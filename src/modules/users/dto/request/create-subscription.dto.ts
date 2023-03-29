import { StringField } from '../../../../decorators';

export class CreateSubscriptionDto {
    // @IsString()
    // @ApiProperty()
    // userId: string;

    @StringField()
    productId: string;

    @StringField()
    verificationData: string;

    // @IsString()
    // @ApiProperty()
    // expDate: Date;
}
