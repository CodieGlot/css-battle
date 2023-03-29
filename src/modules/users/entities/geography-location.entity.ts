import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';

@Entity()
export class GeographyLocation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timezone: string;

    @Column()
    region: string;

    @Column()
    city: string;

    @Column()
    country: string;

    @Column()
    latitude: string;

    @Column()
    longitude: string;

    @Column()
    userId: string;

    @OneToOne(() => User, (user) => user.geography, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn()
    user: User;
}
