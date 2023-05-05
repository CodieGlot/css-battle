import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { RoomStatus } from '../../../constants';
import { UseDto } from '../../../decorators';
import type { UserDto } from '../../users/dto/response';
import { RoomDto } from '../dto/response';

@Entity()
@UseDto(RoomDto)
export class Room extends AbstractEntity<RoomDto> {
    @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.OPEN })
    status: RoomStatus;

    @Column('simple-json', {
        transformer: {
            to(value: UserDto[]): string {
                return JSON.stringify(value);
            },
            from(value: string): UserDto[] {
                return JSON.parse(value);
            }
        }
    })
    participants: UserDto[];

    @Column()
    roomCode: string;
}
