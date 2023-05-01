import { MinLength } from 'class-validator';

import { StringField } from '../../../../decorators';

export class UserCredentialDto {
    @StringField({ minLength: 8, example: 'dexxxxxx' })
    @MinLength(6)
    readonly username: string;

    @StringField({ minLength: 6, example: 'xxxxxx' })
    @MinLength(8)
    readonly password: string;
}
