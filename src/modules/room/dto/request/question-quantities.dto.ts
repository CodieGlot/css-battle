import { NumberField, StringField } from '../../../../decorators';

export class QuestionQuantitiesDto {
    @StringField({ minLength: 6, maxLength: 6 })
    roomCode: string;

    @NumberField({ int: true, minimum: 0 })
    numOfEasy: number;

    @NumberField({ int: true, minimum: 0 })
    numOfMedium: number;

    @NumberField({ int: true, minimum: 0 })
    numOfHard: number;
}
