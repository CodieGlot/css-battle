import { StringField } from '../../../../decorators';

export class RoomCodeDto {
    @StringField({ minLength: 6, maxLength: 6 })
    roomCode: string;
}
