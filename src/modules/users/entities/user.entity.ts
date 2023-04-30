import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UserRole } from '../../../constants';
import { UseDto } from '../../../decorators';
import { UserDto } from '../dto/response/user.dto';

@Entity()
@UseDto(UserDto)
export class User extends AbstractEntity<UserDto> {
    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    avatarUrl: string;
}
