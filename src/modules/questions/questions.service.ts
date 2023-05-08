import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResponseDto } from '../../common/dto';
import type { QuestionDifficulty } from '../../constants';
import type { CreateQuestionsDto, NewQuestionDto, UpdateQuestionDto } from './dto/request';
import { Question } from './entities';

@Injectable()
export class QuestionsService {
    constructor(@InjectRepository(Question) private readonly questionRepository: Repository<Question>) {}

    async createQuestion(dto: NewQuestionDto) {
        const questionEntity = this.questionRepository.create(dto);

        return this.questionRepository.save(questionEntity);
    }

    async createQuestions(dto: CreateQuestionsDto) {
        const promiseSaveQuestions = dto.questions.map(async (question) => {
            const questionEntity = this.questionRepository.create(question);

            return this.questionRepository.save(questionEntity);
        });

        return Promise.all(promiseSaveQuestions);
    }

    async findQuestionById(id: string) {
        const question = await this.questionRepository.findOne({ where: { id } });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        return question.toResponseDto();
    }

    async getAllQuestions() {
        return this.questionRepository.find();
    }

    async updateQuestionById(id: string, dto: UpdateQuestionDto) {
        const question = await this.findQuestionById(id);

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        await this.questionRepository.update(id, dto);

        return new ResponseDto({ message: 'Update question successfully' });
    }

    async deleteQuestionById(id: string) {
        const question = await this.findQuestionById(id);

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        await this.questionRepository.delete(id);

        return new ResponseDto({ message: 'Delete question succesfully' });
    }

    async getRandomQuestions(number: number, difficulty?: QuestionDifficulty) {
        if (!number || number === 0) {
            return [];
        }

        const queryBuilder = this.questionRepository.createQueryBuilder('question');

        if (difficulty) {
            queryBuilder.where('question.difficulty = :difficulty', { difficulty });
        }

        return queryBuilder.orderBy('RANDOM()').limit(number).getMany();
    }
}
