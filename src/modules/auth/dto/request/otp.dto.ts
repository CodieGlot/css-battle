import { Matches } from 'class-validator';

import { EmailField, StringField } from '../../../../decorators';

export class OTPDto {
    @EmailField({ toLowerCase: true, example: 'user@vstation.com' })
    @Matches(/^[\w+.-]+@[\dA-Za-z-]+\.[\d.A-Za-z-]+$/)
    readonly email: string;

    @StringField()
    readonly otpCode: string;
}
