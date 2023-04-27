import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity';
import { QuestionDifficulty } from '../../../constants';
import { UseDto } from '../../../decorators';
import { QuestionDto } from '../dto/response';

@Entity()
@UseDto(QuestionDto)
export class Question extends AbstractEntity<QuestionDto> {
    @Column()
    imageUrl: string;

    @Column('varchar', { array: true })
    colors: string[];

    @Column({ type: 'enum', enum: QuestionDifficulty })
    difficulty: QuestionDifficulty;
}
