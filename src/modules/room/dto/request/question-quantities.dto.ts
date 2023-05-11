import { NumberField } from '../../../../decorators';

export class QuestionQuantitiesDto {
    @NumberField({ int: true, minimum: 0 })
    numOfEasy: number;

    @NumberField({ int: true, minimum: 0 })
    numOfMedium: number;

    @NumberField({ int: true, minimum: 0 })
    numOfHard: number;
}
