import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WsResponse } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { PlayerStatus, RoomStatus } from '../../constants';
import { UsersService } from '../users/users.service';
import type { RoomCodeDto, UpdateStatusDto } from './dto/request';
import type { PlayerDto } from './dto/response';
import { Room } from './entities';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
        private readonly usersService: UsersService
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

        const user = await this.usersService.getUserFromSocket(socket);

        const room = await this.findActiveRoomByCode(roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');

            throw new BadRequestException('Room not found');
        } else if (room.status === RoomStatus.PROGRESS) {
            socket.emit('error', 'Room has already been in progress');

            throw new BadRequestException('Room has already been in progress');
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

        const user = await this.usersService.getUserFromSocket(socket);

        const room = await this.findActiveRoomByCode(roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');

            throw new BadRequestException('Room not found');
        }

        const userIndex = this.findIndexOfParticipant(user.id, room.participants);

        if (userIndex === -1) {
            socket.emit('error', 'User is not in this room');

            throw new BadRequestException('User is not in this room');
        }

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

        const user = await this.usersService.getUserFromSocket(socket);

        const room = await this.findActiveRoomByCode(roomCode);

        if (!room) {
            socket.emit('error', 'Room not found');

            throw new BadRequestException('Room not found');
        }

        const userIndex = this.findIndexOfParticipant(user.id, room.participants);

        if (userIndex === -1) {
            throw new BadRequestException('User is not in this room');
        } else if (userIndex === 0 && dto.status === PlayerStatus.READY) {
            if (room.participants.slice(1).every((player) => player.status === PlayerStatus.READY)) {
                room.participants[userIndex].status = PlayerStatus.READY;

                await this.roomRepository.update({ id: room.id }, { participants: room.participants });

                // ADD GET QUESTIONS AND START GAME

                return { event: 'startGame', data: {} };
            }

            return { event: 'error', data: { room, message: 'Participants have not been in ready state' } };
        }

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

    findIndexOfParticipant(id: string, participants: PlayerDto[]) {
        for (let i = 0; i !== participants.length; i++) {
            if (id === participants[i].id) {
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
