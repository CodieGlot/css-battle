import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { RoomStatus } from '../../../constants';
import { UseDto } from '../../../decorators';
import { Question } from '../../questions/entities';
import type { PlayerDto } from '../dto/response';
import { RoomDto } from '../dto/response';

@Entity()
@UseDto(RoomDto)
export class Room extends AbstractEntity<RoomDto> {
    @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.OPEN })
    status: RoomStatus;

    @Column('jsonb', {
        transformer: {
            to(value: PlayerDto[]): string {
                return JSON.stringify(value);
            },
            from(value: string): PlayerDto[] {
                return JSON.parse(value);
            }
        }
    })
    participants: PlayerDto[];

    @Column()
    roomCode: string;

    @ManyToMany(() => Question, { cascade: true })
    @JoinTable()
    questions: Question[];
}
