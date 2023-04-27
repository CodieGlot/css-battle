import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

import { QuestionDifficulty } from '../../../../constants';
import { EnumField, StringField } from '../../../../decorators';

export class NewQuestionDto {
    @StringField()
    imageUrl: string;

    @ApiProperty({ type: () => [String] })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    colors: string[];

    @EnumField(() => QuestionDifficulty, { example: QuestionDifficulty.EASY })
    difficulty: QuestionDifficulty;
}
