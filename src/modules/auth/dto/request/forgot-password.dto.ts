import { Matches } from 'class-validator';

import { EmailField } from '../../../../decorators';

export class ForgotPasswordDto {
    @EmailField({ toLowerCase: true, example: 'user@vstation.com' })
    @Matches(/^[\w+.-]+@[\dA-Za-z-]+\.[\d.A-Za-z-]+$/, {
        message: 'please enter a valid email address'
    })
    readonly email: string;
}
