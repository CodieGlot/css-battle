import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { WsResponse } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { RoomStatus } from '../../constants';
import type { UserDto } from '../users/dto/response';
import { Room } from './entities';

@Injectable()
export class RoomService {
    constructor(@InjectRepository(Room) private readonly roomRepository: Repository<Room>) {}

    activeRooms: Set<string> = new Set();

    async createRoom(socket: Socket, user: UserDto): Promise<WsResponse<unknown>> {
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
        socket.to(roomCode).emit('roomCreated', { room });

        this.activeRooms.add(roomCode);

        return { event: 'roomCreated', data: { room } };
    }

    async joinRoom(socket: Socket, user: UserDto, roomCode: string): Promise<WsResponse<unknown>> {
        const room = await this.findActiveRoomByCode(roomCode);

        if (!room) {
            throw new BadRequestException('Room not found');
        } else if (room.status === RoomStatus.PROGRESS) {
            throw new BadRequestException('Room has been already in progress');
        }

        room.participants = [...room.participants, user];

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await socket.join(roomCode);
        socket.to(roomCode).emit('playerJoined', { room });

        return { event: 'playerJoined', data: { room } };
    }

    async leaveRoom(socket: Socket, user: UserDto, roomCode: string): Promise<WsResponse<unknown>> {
        const room = await this.findActiveRoomByCode(roomCode);

        if (!room) {
            throw new BadRequestException('Room not found');
        }

        const userIndex = this.findIndexOfParticipant(user.id, room.participants);

        if (userIndex === -1) {
            throw new BadRequestException('User is not in this room');
        }

        if (room.participants.length === 1) {
            this.activeRooms.delete(roomCode);

            await this.roomRepository.delete({ id: room.id });

            return { event: 'roomDeleted', data: { room } };
        }

        room.participants.splice(userIndex, 1);

        await this.roomRepository.update({ id: room.id }, { participants: room.participants });

        await socket.leave(roomCode);
        socket.to(roomCode).emit('playerLeft', { room });

        return { event: 'playerLeft', data: { room } };
    }

    findIndexOfParticipant(id: string, participants: UserDto[]) {
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

    async findAll() {
        return this.roomRepository.find({
            where: {
                status: RoomStatus.OPEN || RoomStatus.PROGRESS
            }
        });
    }
}
