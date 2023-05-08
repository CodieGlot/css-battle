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
import { QuestionQuantitiesDto, RoomCodeDto, SubmitWorkDto, UpdateStatusDto } from './dto/request';
import { RoomService } from './room.service';

@WebSocketGateway({
    cors: {
        origin: '*'
    },
    namespace: 'room'
})
@UseGuards(WsJwtGuard)
export class RoomGateway {
    constructor(private readonly roomService: RoomService) {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('findAllActiveRooms')
    async findAllActiveRooms() {
        return this.roomService.findAllActiveRooms();
    }

    @SubscribeMessage('createRoom')
    async createRoom(@ConnectedSocket() socket: Socket) {
        return this.roomService.createRoom(socket);
    }

    @SubscribeMessage('joinRoom')
    async joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomCodeDto: RoomCodeDto) {
        return this.roomService.joinRoom(socket, roomCodeDto);
    }

    @SubscribeMessage('leaveRoom')
    async leaveRoom(@ConnectedSocket() socket: Socket, @MessageBody() roomCodeDto: RoomCodeDto) {
        return this.roomService.leaveRoom(socket, roomCodeDto);
    }

    @SubscribeMessage('updateStatus')
    async updateStatus(@ConnectedSocket() socket: Socket, @MessageBody() updateStatusDto: UpdateStatusDto) {
        return this.roomService.updateStatus(socket, updateStatusDto);
    }

    @SubscribeMessage('startGame')
    async startGame(
        @ConnectedSocket() socket: Socket,
        @MessageBody() questionQuantitiesDto: QuestionQuantitiesDto
    ) {
        return this.roomService.startGame(socket, questionQuantitiesDto);
    }

    @SubscribeMessage('submitWork')
    async submitWork(@ConnectedSocket() socket: Socket, @MessageBody() submitWorkDto: SubmitWorkDto) {
        return this.roomService.submitWork(socket, submitWorkDto);
    }

    @SubscribeMessage('finishGame')
    async finishGame(@ConnectedSocket() socket: Socket, @MessageBody() roomCodeDto: RoomCodeDto) {
        return this.roomService.finishGame(socket, roomCodeDto);
    }
}
