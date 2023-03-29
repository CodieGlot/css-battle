import type { EntitySubscriberInterface, InsertEvent } from 'typeorm';
import { EventSubscriber } from 'typeorm';

import { generateHash } from '../common/utils';
import { User } from '../modules/users/entities';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo(): typeof User {
        return User;
    }

    beforeInsert(event: InsertEvent<User>): void {
        if (event.entity.password) {
            event.entity.password = generateHash(event.entity.password);
        }
    }
}
