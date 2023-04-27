import { MinLength } from 'class-validator';

import { StringField } from '../../../../decorators';

export class UserInfoDto {
    @StringField({ minLength: 8, example: 'dexxxxxx' })
    @MinLength(8)
    readonly username: string;

    @StringField({ minLength: 6, example: 'xxxxxx' })
    @MinLength(6)
    readonly password: string;
}
