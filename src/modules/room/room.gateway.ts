import { UseGuards } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { WsJwtGuard } from '../../guards';
import { UsersService } from '../users/users.service';
import { RoomService } from './room.service';

@WebSocketGateway({
    cors: {
        origin: '*'
    },
    namespace: 'room'
})
@UseGuards(WsJwtGuard)
export class RoomGateway {
    constructor(private readonly roomService: RoomService, private readonly usersService: UsersService) {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('findAllActiveRooms')
    async findAll() {
        return this.roomService.findAll();
    }

    @SubscribeMessage('createRoom')
    async createRoom(@ConnectedSocket() socket: Socket) {
        const user = await this.usersService.getUserFromSocket(socket);

        return this.roomService.createRoom(socket, user);
    }

    @SubscribeMessage('joinRoom')
    async joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        const user = await this.usersService.getUserFromSocket(socket);

        return this.roomService.joinRoom(socket, user, roomCode);
    }

    @SubscribeMessage('leaveRoom')
    async leaveRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomCode: string) {
        const user = await this.usersService.getUserFromSocket(socket);

        return this.roomService.leaveRoom(socket, user, roomCode);
    }
}
