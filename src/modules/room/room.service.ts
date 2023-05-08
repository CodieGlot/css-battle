import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WsResponse } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { PlayerStatus, QuestionDifficulty, RoomStatus } from '../../constants';
import type { Question } from '../questions/entities';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';
import type { QuestionQuantitiesDto, RoomCodeDto, SubmitWorkDto, UpdateStatusDto } from './dto/request';
import type { PlayerDto } from './dto/response';
import { Room } from './entities';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        private readonly usersService: UsersService,
        private readonly questionsService: QuestionsService
    ) {}

    activeRooms: Set<string> = new Set();

    async createRoom(socket: Socket): Promise<WsResponse<unknown>> {
        const user = await this.usersService.getUserFromSocket(socket);

        let roomCode: string;

        do {
            roomCode = Math.floor(100_000 + Math.random() * 900_000).toString();
        } while (this.activeRooms.has(roomCode));

        const roomEntity = this.roomRepository.create({
            participants: [user],
            roomCode
        });

        const room = await this.roomRepository.save(roomEntity);

        await socket.join(roomCode);
        socket.to(roomCode).emit('roomUpdated', { room, message: `Room ${roomCode} has been created` });

        this.activeRooms.add(roomCode);

        return { event: 'roomUpdated', data: { room, message: `Room ${roomCode} has been created` } };
    }

    async joinRoom(socket: Socket, dto: RoomCodeDto): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { user, room } = await this.getUserRoomUserIndex(socket, roomCode, false, false);

        if (room.status === RoomStatus.PROGRESS) {
            socket.emit('error', 'Room has already been in progress');

            throw new BadRequestException('Room has already been in progress');
        } else if (room.participants.length === 10) {
            socket.emit('error', 'Room has been full');

            throw new BadRequestException('Room has been full');
        }

        room.participants = [...room.participants, user];

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await socket.join(roomCode);
        socket
            .to(roomCode)
            .emit('roomUpdated', { room, message: `User ${user.username} has joined the room` });

        return {
            event: 'roomUpdated',
            data: { room, message: `User ${user.username} has joined the room` }
        };
    }

    async leaveRoom(socket: Socket, dto: RoomCodeDto): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { user, room, userIndex } = await this.getUserRoomUserIndex(socket, roomCode);

        if (room.participants.length === 1) {
            this.activeRooms.delete(roomCode);

            await this.roomRepository.delete({ id: room.id });

            return { event: 'roomUpdated', data: { message: `Room ${roomCode} has been deleted` } };
        }

        room.participants.splice(userIndex, 1);

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await socket.leave(roomCode);
        socket
            .to(roomCode)
            .emit('roomUpdated', { room, message: `Player ${user.username} has left the room` });

        return { event: 'roomUpdated', data: { room, message: `Player ${user.username} has left the room` } };
    }

    async updateStatus(socket: Socket, dto: UpdateStatusDto): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { user, room, userIndex } = await this.getUserRoomUserIndex(socket, roomCode);

        let message: string;

        switch (dto.status) {
            case PlayerStatus.READY: {
                room.participants[userIndex].status = PlayerStatus.READY;
                message = `Player ${user.username} readies to start`;

                break;
            }

            case PlayerStatus.WAITING: {
                room.participants[userIndex].status = PlayerStatus.WAITING;
                message = `Player ${user.username} has changed to waiting state`;

                break;
            }

            case PlayerStatus.FINISHED: {
                room.participants[userIndex].status = PlayerStatus.FINISHED;
                message = `Player ${user.username} has finished the game`;

                break;
            }
        }

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        socket.to(roomCode).emit('roomUpdated', { room, message });

        return {
            event: 'roomUpdated',
            data: { room, message }
        };
    }

    async startGame(socket: Socket, dto: QuestionQuantitiesDto): Promise<WsResponse<unknown>> {
        const total = dto.numOfEasy + dto.numOfMedium + dto.numOfHard;

        if (total > 10) {
            throw new BadRequestException('Total number of questions should not be more than 10');
        } else if (total === 0) {
            throw new BadRequestException('There should be at least 1 question to start');
        }

        const roomCode = dto.roomCode;

        const { room, userIndex } = await this.getUserRoomUserIndex(socket, roomCode);

        if (userIndex === 0) {
            if (room.participants.length === 1) {
                socket.emit('error', 'Find one more player to start game');

                throw new BadRequestException('Not enough players to start');
            }

            const easyQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfEasy,
                QuestionDifficulty.EASY
            );

            const mediumQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfMedium,
                QuestionDifficulty.MEDIUM
            );

            const hardQuestions = await this.questionsService.getRandomQuestions(
                dto.numOfHard,
                QuestionDifficulty.HARD
            );

            room.questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

            for (let i = 0; i !== room.participants.length; i++) {
                room.participants[i].points = Array.from({ length: room.questions.length }).map(() => 0);
            }

            room.status = RoomStatus.PROGRESS;

            await this.roomRepository.save(room);

            socket.to(roomCode).emit('startGame', {
                room,
                message: 'Questions have been generated successfully'
            });

            return {
                event: 'startGame',
                data: { room, message: 'Questions have been generated successfully' }
            };
        }

        socket.emit('error', 'User is not the host of this room');

        throw new BadRequestException('User is not the host of this room');
    }

    async submitWork(socket: Socket, dto: SubmitWorkDto): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { user, room, userIndex } = await this.getUserRoomUserIndex(socket, roomCode, true);

        const questionIndex = this.findIndexOfQuestion(dto.questionId, room.questions);

        if (questionIndex === -1) {
            socket.emit('error', 'Question ID invalid');

            throw new BadRequestException('Question ID invalid');
        }

        const currentPoint = room.participants[userIndex].points[questionIndex];

        if (dto.point > currentPoint) {
            room.participants[userIndex].points[questionIndex] = dto.point;

            room.participants[userIndex].total += dto.point - currentPoint;
        } else {
            throw new BadRequestException('Player has earned less points than previous submit');
        }

        await this.roomRepository.save(room);

        socket
            .to(roomCode)
            .emit('roomUpdated', { room, message: `Player ${user.username} has earned more points` });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${user.username} has earned more points` }
        };
    }

    async finishGame(socket: Socket, dto: RoomCodeDto): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { user, room, userIndex } = await this.getUserRoomUserIndex(socket, roomCode, true);

        room.participants[userIndex].status = PlayerStatus.FINISHED;

        if (room.participants.every((player) => player.status === PlayerStatus.FINISHED)) {
            room.status = RoomStatus.CLOSED;
            await this.roomRepository.save(room);

            socket.to(roomCode).emit('roomUpdated', { room, message: 'All players have finished the game' });

            return { event: 'roomUpdated', data: { room, message: 'All players have finished the game' } };
        }

        await this.roomRepository.save(room);
        socket
            .to(roomCode)
            .emit('roomUpdated', { room, message: `Player ${user.username} has finished the game` });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${user.username} has finished the game` }
        };
    }

    async getUserRoomUserIndex(socket: Socket, roomCode: string, getQuestions = false, getIndex = true) {
        const user = await this.usersService.getUserFromSocket(socket);

        const room = await (getQuestions
            ? this.roomRepository.findOne({
                  relations: {
                      questions: true
                  },
                  where: { roomCode }
              })
            : this.findActiveRoomByCode(roomCode));

        if (!room) {
            socket.emit('error', 'Room not found');

            throw new BadRequestException('Room not found');
        }

        let userIndex = -1;

        if (getIndex) {
            userIndex = this.findIndexOfParticipant(user.id, room.participants);

            if (userIndex === -1) {
                socket.emit('error', 'User is not in this room');

                throw new BadRequestException('User is not in this room');
            }
        }

        return { user, room, userIndex };
    }

    findIndexOfParticipant(id: string, participants: PlayerDto[]) {
        for (let i = 0; i !== participants.length; i++) {
            if (id === participants[i].id) {
                return i;
            }
        }

        return -1;
    }

    findIndexOfQuestion(id: string, questions: Question[]) {
        for (let i = 0; i !== questions.length; i++) {
            if (id === questions[i].id) {
                return i;
            }
        }

        return -1;
    }

    async findActiveRoomByCode(roomCode: string) {
        return this.roomRepository.findOne({
            where: {
                roomCode,
                status: RoomStatus.OPEN || RoomStatus.PROGRESS
            }
        });
    }

    async findAllActiveRooms() {
        return this.roomRepository.find({
            where: {
                status: RoomStatus.OPEN || RoomStatus.PROGRESS
            }
        });
    }
}
