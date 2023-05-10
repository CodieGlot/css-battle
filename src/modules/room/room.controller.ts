import type { OnModuleInit } from '@nestjs/common';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import Ably from 'ably';

import { UserRole } from '../../constants';
import { Auth, AuthUser } from '../../decorators';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { User } from '../users/entities';
import { QuestionQuantitiesDto, RoomCodeDto, SubmitWorkDto, UpdateStatusDto } from './dto/request';
import { Room } from './entities';
import { RoomService } from './room.service';

@ApiTags('room')
@Controller('room')
export class RoomController implements OnModuleInit {
    constructor(
        private readonly roomService: RoomService,
        private readonly configService: ApiConfigService
    ) {}

    ably = new Ably.Realtime.Promise(this.configService.ablyConfig.rootKey);

    async onModuleInit() {
        await this.ably.connection.once('connected');
    }

    @Post('create')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: Room,
        description: 'Room has been created'
    })
    @ApiOperation({ summary: 'Create room with random code' })
    async createRoom(@AuthUser() user: User) {
        return this.roomService.createRoom(this.ably, user);
    }

    @Post('join')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'PLayer has joined the room'
    })
    @ApiOperation({ summary: 'Join room with roomcode' })
    async joinRoom(@AuthUser() user: User, @Body() dto: RoomCodeDto) {
        return this.roomService.joinRoom(this.ably, user, dto.roomCode);
    }

    @Post('leave')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'Player has left the room'
    })
    @ApiOperation({ summary: 'Leave room with roomcode' })
    async leaveRoom(@AuthUser() user: User, @Body() dto: RoomCodeDto) {
        return this.roomService.joinRoom(this.ably, user, dto.roomCode);
    }

    @Post('update-status')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'Play has updated his/her status'
    })
    @ApiOperation({ summary: "Update player's status" })
    async updateStatus(@AuthUser() user: User, @Body() dto: UpdateStatusDto) {
        return this.roomService.updateStatus(this.ably, user, dto);
    }

    @Post('start')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'Start game'
    })
    @ApiOperation({ summary: 'Start game' })
    async startGame(@AuthUser() user: User, @Body() dto: QuestionQuantitiesDto) {
        return this.roomService.startGame(this.ably, user, dto);
    }

    @Post('submit')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'Submit work'
    })
    @ApiOperation({ summary: 'Submit work' })
    async submitWork(@AuthUser() user: User, @Body() dto: SubmitWorkDto) {
        return this.roomService.submitWork(this.ably, user, dto);
    }

    @Post('finish')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: Room,
        description: 'Finish game'
    })
    @ApiOperation({ summary: 'Finish Game' })
    async finishGame(@AuthUser() user: User, @Body() dto: RoomCodeDto) {
        return this.roomService.finishGame(this.ably, user, dto.roomCode);
    }
}
