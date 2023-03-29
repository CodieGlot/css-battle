import { StringField } from '../../../../decorators';

export class GoogleApplePayloadDto {
    @StringField()
    readonly idToken: string;
}
