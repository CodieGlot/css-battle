import { MinLength } from 'class-validator';

import { StringField } from '../../../../decorators';

export class ResetPasswordDto {
    @StringField({ minLength: 6, example: 'xxxxxx' })
    @MinLength(6)
    oldPassword: string;

    @StringField({ minLength: 6, example: 'xxxxxx' })
    @MinLength(6)
    newPassword: string;
}
