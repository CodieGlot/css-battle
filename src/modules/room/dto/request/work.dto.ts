import { NumberField, StringField } from '../../../../decorators';

export class WorkDto {
    @StringField()
    questionId: string;

    @StringField()
    htmlCode: string;

    @NumberField({ int: true, minimum: 1 })
    time: number;
}
