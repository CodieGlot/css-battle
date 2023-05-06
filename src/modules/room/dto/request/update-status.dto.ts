import { PlayerStatus } from '../../../../constants';
import { EnumField, StringField } from '../../../../decorators';

export class UpdateStatusDto {
    @StringField({ minLength: 6, maxLength: 6 })
    roomCode: string;

    @EnumField(() => PlayerStatus)
    status: PlayerStatus;
}
