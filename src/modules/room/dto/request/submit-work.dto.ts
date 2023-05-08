import { NumberField, StringField } from '../../../../decorators';

export class SubmitWorkDto {
    @StringField({ minLength: 6, maxLength: 6 })
    roomCode: string;

    @StringField()
    questionId: string;

    @NumberField({ int: true, minimum: 0, maximum: 100 })
    point: number;
}
