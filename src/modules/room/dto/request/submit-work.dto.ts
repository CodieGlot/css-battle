import { NumberField, StringField } from '../../../../decorators';

export class SubmitWorkDto {
    @StringField()
    questionId: string;

    @NumberField({ int: true, minimum: 0, maximum: 100 })
    point: number;

    @NumberField({ int: true, minimum: 0 })
    time: number;
}
