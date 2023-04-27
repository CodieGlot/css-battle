import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { NewQuestionDto } from './new-question.dto';

export class CreateQuestionsDto {
    @ApiProperty({ type: () => [NewQuestionDto] })
    @ValidateNested({ each: true })
    @Type(() => NewQuestionDto)
    questions: NewQuestionDto[];
}
