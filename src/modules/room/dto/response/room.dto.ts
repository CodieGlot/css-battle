import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { RoomStatus } from '../../../../constants';
import type { Room } from '../../entities';

export class RoomDto extends AbstractDto {
    @ApiProperty({ enum: RoomStatus })
    status: RoomStatus;

    @ApiProperty()
    roomCode: string;

    @ApiProperty()
    playerHostId: string;

    constructor(room: Room) {
        super(room);
        this.status = room.status;
        this.roomCode = room.roomCode;
        this.playerHostId = room.playerHostId;
    }
}
