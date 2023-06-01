import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { RoomStatus } from '../../../constants';
import { UseDto } from '../../../decorators';
import { Question } from '../../questions/entities';
import { RoomDto } from '../dto/response';
import { Player } from './player.entity';

@Entity()
@UseDto(RoomDto)
export class Room extends AbstractEntity<RoomDto> {
    @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.OPEN })
    status: RoomStatus;

    @Column()
    playerHostId: string;

    @OneToMany(() => Player, (player) => player.room, { cascade: true })
    players: Player[];

    @Column()
    roomCode: string;

    @ManyToMany(() => Question, { cascade: true })
    @JoinTable()
    questions: Question[];
}
