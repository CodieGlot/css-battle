import { PlayerStatus } from '../../../../constants';
import { EnumField } from '../../../../decorators';

export class UpdateStatusDto {
    @EnumField(() => PlayerStatus)
    status: PlayerStatus;
}
