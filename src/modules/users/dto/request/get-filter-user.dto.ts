import { PageOptionsDto } from '../../../../common/dto';
import { Order } from '../../../../constants';
import { DateFieldOptional, EnumFieldOptional } from '../../../../decorators';

export class GetFilterUserDto extends PageOptionsDto {
    @DateFieldOptional()
    startDate?: Date;

    @DateFieldOptional()
    endDate?: Date;

    @EnumFieldOptional(() => Order, {
        default: Order.ASC
    })
    createdAt: Order = Order.ASC;
}
