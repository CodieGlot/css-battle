import { StringField } from '../../../../decorators';

export class RefreshTokenPayloadDto {
    @StringField()
    readonly accessToken: string;

    @StringField()
    readonly refreshToken: string;
}
