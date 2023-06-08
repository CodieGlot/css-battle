import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PlayerStatus } from '../../../constants';
import type { PointInfoDto } from '../dto/response/point-info.dto';
import { Room } from './room.entity';

@Entity()
export class Player {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    username: string;

    @Column()
    avatarUrl: string;

    @Column('int')
    playerIndex: number;

    @Column({ type: 'enum', enum: PlayerStatus, default: PlayerStatus.WAITING })
    status: PlayerStatus;

    @Column('jsonb', {
        transformer: {
            to(value: PointInfoDto[]): string {
                return JSON.stringify(value);
            },
            from(value: string): PointInfoDto[] {
                return JSON.parse(value);
            }
        },
        nullable: true
    })
    points: PointInfoDto[];

    @ManyToOne(() => Room, (room) => room.players, { onDelete: 'CASCADE' })
    room: Room;
}
