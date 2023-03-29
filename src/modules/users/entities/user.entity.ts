import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { RegisterMethod, RegisterType, UserRole } from '../../../constants';
import { UseDto } from '../../../decorators';
import type { UserDtoOptions } from '../dto/response/user.dto';
import { UserDto } from '../dto/response/user.dto';
import { GeographyLocation } from './geography-location.entity';
import { SubscriptionTransaction } from './subscription-transaction.entity';

@Entity()
@UseDto(UserDto)
export class User extends AbstractEntity<UserDto, UserDtoOptions> {
    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({ default: RegisterMethod.REGISTER })
    registerType: RegisterType;

    @Column({ default: false })
    isSubscription: boolean;

    @OneToMany(() => SubscriptionTransaction, (subscription) => subscription.user, {
        cascade: true
    })
    subscription: SubscriptionTransaction[];

    @OneToOne(() => GeographyLocation, (geographyLocation) => geographyLocation.user, {
        cascade: true
    })
    geography: GeographyLocation;

    @Column({ type: 'timestamptz', nullable: true })
    lastLogin: Date;
}
