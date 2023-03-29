import { StringField } from '../../../../decorators';

export class ChangePasswordDto {
    @StringField()
    newPassword: string;

    @StringField()
    newPasswordConfirmed: string;
}
