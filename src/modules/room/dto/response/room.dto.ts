import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { RoomStatus } from '../../../../constants';
import type { Room } from '../../entities';
import type { PlayerDto } from '../response';

export class RoomDto extends AbstractDto {
    @ApiProperty({ enum: RoomStatus })
    status: RoomStatus;

    @ApiProperty()
    participants: PlayerDto[];

    @ApiProperty()
    roomCode: string;

    constructor(room: Room) {
        super(room);
        this.status = room.status;
        this.participants = room.participants;
        this.roomCode = room.roomCode;
    }
}
