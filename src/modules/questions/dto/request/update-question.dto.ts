import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

import { QuestionDifficulty } from '../../../../constants';
import { EnumFieldOptional, StringFieldOptional } from '../../../../decorators';

export class UpdateQuestionDto {
    @StringFieldOptional()
    imageUrl: string;

    @ApiPropertyOptional({ type: () => [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    colors: string[];

    @EnumFieldOptional(() => QuestionDifficulty, { example: QuestionDifficulty.EASY })
    difficulty: QuestionDifficulty;
}
