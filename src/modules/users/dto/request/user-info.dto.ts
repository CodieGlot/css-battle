import { MinLength } from 'class-validator';

import { defaultPassword } from '../../../../constants';
import { StringField, StringFieldOptional } from '../../../../decorators';

export class UserInfoDto {
    @StringField({ minLength: 8, example: 'dexxxxxx' })
    @MinLength(6)
    readonly username: string;

    @StringFieldOptional({ minLength: 6, example: 'xxxxxx' })
    @MinLength(8)
    readonly password: string = defaultPassword;
}
