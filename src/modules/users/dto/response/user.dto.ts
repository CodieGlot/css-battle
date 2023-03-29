import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { RegisterType, UserRole } from '../../../../constants';
import type { User } from '../../entities';
import { GeographyLocationDto } from './geography-location.dto';

export type UserDtoOptions = Partial<{
    isActive: boolean;
    isShowGeography: boolean;
}>;

export class UserDto extends AbstractDto {
    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @ApiProperty()
    email: string;

    @ApiProperty()
    isSubscription: boolean;

    @ApiProperty()
    isActive?: boolean;

    @ApiProperty()
    geography: GeographyLocationDto;

    @ApiProperty()
    registerType: RegisterType;

    @ApiProperty()
    lastLogin: Date;

    constructor(user: User, options?: UserDtoOptions) {
        super(user);
        this.role = user.role;
        this.email = user.email;
        this.isSubscription = user.isSubscription;
        this.registerType = user.registerType;
        this.isActive = options?.isActive;

        if (options?.isShowGeography) {
            this.geography = user.geography;
        }

        if (user.lastLogin) {
            this.lastLogin = user.lastLogin;
        }
    }
}
