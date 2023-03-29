import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import type { SubscriptionTransaction } from '../../entities';

export class SubscriptionTransactionDto extends AbstractDto {
    @ApiProperty()
    status: boolean;

    @ApiProperty()
    productId: string;

    @ApiProperty()
    transactionDate: Date;

    @ApiProperty()
    verificationData: string;

    @ApiProperty()
    expDate: Date;

    constructor(subscription: SubscriptionTransaction) {
        super(subscription);
        this.status = subscription.status;
        this.productId = subscription.productId;
        this.transactionDate = subscription.createdAt;
        this.verificationData = subscription.verificationData;
        this.expDate = subscription.expDate;
    }
}
