import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WsResponse } from '@nestjs/websockets';
import type Ably from 'ably';
import { Repository } from 'typeorm';

import { PlayerStatus, QuestionDifficulty, RoomStatus } from '../../constants';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { Question } from '../questions/entities';
import { QuestionsService } from '../questions/questions.service';
import type { User } from '../users/entities';
import { UsersService } from '../users/users.service';
import type { QuestionQuantitiesDto, SubmitWorkDto, UpdateStatusDto } from './dto/request';
import { PlayerDto } from './dto/response';
import { Room } from './entities';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        private readonly usersService: UsersService,
        private readonly questionsService: QuestionsService,
        private readonly configService: ApiConfigService
    ) {}

    activeRooms: Set<string> = new Set();

    async createRoom(ably: Ably.Types.RealtimePromise, user: User): Promise<WsResponse<unknown>> {
        const player = new PlayerDto({ ...user, status: PlayerStatus.WAITING, points: [], total: 0 });

        let roomCode: string;

        do {
            roomCode = Math.floor(100_000 + Math.random() * 900_000).toString();
        } while (this.activeRooms.has(roomCode));

        const roomEntity = this.roomRepository.create({
            participants: [player],
            roomCode
        });

        const room = await this.roomRepository.save(roomEntity);

        this.activeRooms.add(roomCode);

        const channel = ably.channels.get(roomCode);

        await channel.publish('roomUpdated', { room, message: `Room ${roomCode} has been created` });

        return {
            event: 'roomUpdated',
            data: {
                room,
                message: `Room ${roomCode} has been created`
            }
        };
    }

    async joinRoom(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string
    ): Promise<WsResponse<unknown>> {
        const { player, room } = await this.getPLayerRoomPlayerIndex(user, roomCode, false, false);

        const channel = ably.channels.get(roomCode);

        if (room.status === RoomStatus.PROGRESS) {
            throw new BadRequestException('Room has already been in progress');
        } else if (room.participants.length === 10) {
            throw new BadRequestException('Room has been full');
        }

        room.participants = [...room.participants, player];

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await channel.publish('roomUpdated', {
            room,
            message: `Player ${player.username} has joined the room`
        });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${player.username} has joined the room` }
        };
    }

    async leaveRoom(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string
    ): Promise<WsResponse<unknown>> {
        const { player, room, playerIndex } = await this.getPLayerRoomPlayerIndex(user, roomCode);

        const channel = ably.channels.get(roomCode);

        if (room.participants.length === 1) {
            this.activeRooms.delete(roomCode);

            await this.roomRepository.delete({ id: room.id });

            return { event: 'roomUpdated', data: { message: `Room ${roomCode} has been deleted` } };
        }

        room.participants.splice(playerIndex, 1);

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await channel.publish('roomUpdated', {
            room,
            message: `Player ${player.username} has left the room`
        });

        return {
            event: 'roomUpdated',
            data: { room, message: `Player ${player.username} has left the room` }
        };
    }

    async updateStatus(
        ably: Ably.Types.RealtimePromise,
        user: User,
        dto: UpdateStatusDto
    ): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { player, room, playerIndex } = await this.getPLayerRoomPlayerIndex(user, roomCode);

        const channel = ably.channels.get(roomCode);

        let message: string;

        switch (dto.status) {
            case PlayerStatus.READY: {
                room.participants[playerIndex].status = PlayerStatus.READY;
                message = `Player ${player.username} readies to start`;

                break;
            }

            case PlayerStatus.WAITING: {
                room.participants[playerIndex].status = PlayerStatus.WAITING;
                message = `Player ${player.username} has changed to waiting state`;

                break;
            }

            case PlayerStatus.FINISHED: {
                room.participants[playerIndex].status = PlayerStatus.FINISHED;
                message = `Player ${player.username} has finished the game`;

                break;
            }
        }

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await channel.publish('roomUpdated', { room, message });

        return {
            event: 'roomUpdated',
            data: { room, message }
        };
    }

    async startGame(
        ably: Ably.Types.RealtimePromise,
        user: User,
        dto: QuestionQuantitiesDto
    ): Promise<WsResponse<unknown>> {
        const total = dto.numOfEasy + dto.numOfMedium + dto.numOfHard;

        if (total > 10) {
            throw new BadRequestException('Total number of questions should not be more than 10');
        } else if (total === 0) {
            throw new BadRequestException('There should be at least 1 question to start');
        }

        const roomCode = dto.roomCode;

        const { room, playerIndex } = await this.getPLayerRoomPlayerIndex(user, roomCode);

        const channel = ably.channels.get(roomCode);

        if (playerIndex === 0) {
            if (room.participants.length === 1) {
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

            await channel.publish('gameStarted', {
                room,
                message: 'Questions have been generated successfully'
            });

            return {
                event: 'gameStarted',
                data: { room, message: 'Questions have been generated successfully' }
            };
        }

        throw new BadRequestException('User is not the host of this room');
    }

    async submitWork(
        ably: Ably.Types.RealtimePromise,
        user: User,
        dto: SubmitWorkDto
    ): Promise<WsResponse<unknown>> {
        const roomCode = dto.roomCode;

        const { player, room, playerIndex } = await this.getPLayerRoomPlayerIndex(user, roomCode, true);

        const channel = ably.channels.get(roomCode);

        const questionIndex = this.findIndexOfQuestion(dto.questionId, room.questions);

        if (questionIndex === -1) {
            throw new BadRequestException('Question ID invalid');
        }

        const currentPoint = room.participants[playerIndex].points[questionIndex];

        if (dto.point > currentPoint) {
            room.participants[playerIndex].points[questionIndex] = dto.point;

            room.participants[playerIndex].total += dto.point - currentPoint;
        }

        await this.roomRepository.save(room);

        await channel.publish('progressUpdated', {
            room,
            message: `Player ${player.username} has submited work`
        });

        return {
            event: 'progressUpdated',
            data: { room, message: `Player ${player.username} has submited work` }
        };
    }

    async finishGame(
        ably: Ably.Types.RealtimePromise,
        user: User,
        roomCode: string
    ): Promise<WsResponse<unknown>> {
        const { player, room, playerIndex } = await this.getPLayerRoomPlayerIndex(user, roomCode, true);

        const channel = ably.channels.get(roomCode);

        room.participants[playerIndex].status = PlayerStatus.FINISHED;

        if (room.participants.every((participant) => participant.status === PlayerStatus.FINISHED)) {
            room.status = RoomStatus.CLOSED;
            await this.roomRepository.save(room);

            await channel.publish('gameFinished', { room, message: 'All players have finished the game' });

            return { event: 'gameFinished', data: { room, message: 'All players have finished the game' } };
        }

        await this.roomRepository.save(room);
        await channel.publish('playerFinished', {
            room,
            message: `Player ${player.username} has finished the game`
        });

        return {
            event: 'playerFinished',
            data: { room, message: `Player ${player.username} has finished the game` }
        };
    }

    async getPLayerRoomPlayerIndex(user: User, roomCode: string, getQuestions = false, getIndex = true) {
        const player = new PlayerDto({ ...user, status: PlayerStatus.WAITING, points: [], total: 0 });

        const room = await (getQuestions
            ? this.roomRepository.findOne({
                  relations: {
                      questions: true
                  },
                  where: { roomCode }
              })
            : this.findActiveRoomByCode(roomCode));

        if (!room) {
            throw new BadRequestException('Room not found');
        }

        let playerIndex = -1;

        if (getIndex) {
            playerIndex = this.findIndexOfParticipant(player.id, room.participants);

            if (playerIndex === -1) {
                throw new BadRequestException('User is not in this room');
            }
        }

        return { player, room, playerIndex };
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
