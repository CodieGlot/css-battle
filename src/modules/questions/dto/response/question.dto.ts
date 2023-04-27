import { ApiProperty } from '@nestjs/swagger';

import { AbstractDto } from '../../../../common/dto/abstract.dto';
import { QuestionDifficulty } from '../../../../constants';
import type { Question } from '../../entities';

export class QuestionDto extends AbstractDto {
    @ApiProperty()
    imageUrl: string;

    @ApiProperty()
    colors: string[];

    @ApiProperty()
    difficulty: QuestionDifficulty;

    constructor(question: Question) {
        super(question);
        this.imageUrl = question.imageUrl;
        this.colors = question.colors;
        this.difficulty = question.difficulty;
    }
}
