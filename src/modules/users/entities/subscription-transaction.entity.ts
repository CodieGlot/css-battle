import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators';
import { SubscriptionTransactionDto } from '../dto';
import { User } from '.';

@Entity()
@UseDto(SubscriptionTransactionDto)
export class SubscriptionTransaction extends AbstractEntity<SubscriptionTransactionDto> {
    @Column({ default: true })
    status: boolean;

    @Column()
    productId: string;

    @Column()
    verificationData: string;

    @Column()
    expDate: Date;

    @ManyToOne(() => User, (user) => user.subscription, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    @JoinColumn()
    user: User;
}
