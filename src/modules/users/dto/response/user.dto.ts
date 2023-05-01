import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { UserRole } from '../../../../constants';
import type { User } from '../../entities';

export class UserDto extends AbstractDto {
    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty()
    username: string;

    @ApiProperty()
    avatarUrl: string;

    constructor(user: User) {
        super(user);
        this.role = user.role;
        this.username = user.username;
        this.avatarUrl = user.avatarUrl;
    }
}
