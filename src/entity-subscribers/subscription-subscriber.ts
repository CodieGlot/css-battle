import type { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { EventSubscriber } from 'typeorm';

import { SubscriptionTransaction } from '../modules/users/entities';

@EventSubscriber()
export class SubscriptionTransactionSubscriber implements EntitySubscriberInterface<SubscriptionTransaction> {
    listenTo(): typeof SubscriptionTransaction {
        return SubscriptionTransaction;
    }

    beforeInsert(event: InsertEvent<SubscriptionTransaction>): void {
        event.entity.expDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    }
}
