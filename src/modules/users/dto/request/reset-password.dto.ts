import { Matches } from 'class-validator';

import { EmailField, StringField } from '../../../../decorators';

export class ResetPasswordDto {
    @EmailField({ toLowerCase: true, example: 'user@vstation.com' })
    @Matches(/^[\w+.-]+@[\dA-Za-z-]+\.[\d.A-Za-z-]+$/, {
        message: 'please enter a valid email address'
    })
    email: string;

    @StringField()
    newPassword: string;
}
