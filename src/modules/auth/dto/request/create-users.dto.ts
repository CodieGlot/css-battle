import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';

import { UserInfoDto } from './user-info.dto';

export class CreateUsersDto {
    @ApiProperty({ type: () => [UserInfoDto] })
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UserInfoDto)
    userInfos: UserInfoDto[];
}
