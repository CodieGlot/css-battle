import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { UserRole } from '../../constants';
import { Auth } from '../../decorators';
import { CreateQuestionsDto, NewQuestionDto, UpdateQuestionDto } from './dto/request';
import { QuestionDto } from './dto/response';
import { QuestionsService } from './questions.service';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    @Post()
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Create new question',
        type: QuestionDto
    })
    @ApiOperation({ summary: 'Create new question' })
    async createQuestion(@Body() newQuestionDto: NewQuestionDto) {
        return this.questionsService.createQuestion(newQuestionDto);
    }

    @Post('create-multiple')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Create new questions',
        type: [QuestionDto]
    })
    @ApiOperation({ summary: 'Create new questions' })
    async createQuestions(@Body() createQuestionsDto: CreateQuestionsDto) {
        return this.questionsService.createQuestions(createQuestionsDto);
    }

    @Get()
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Get all questions',
        type: [QuestionDto]
    })
    @ApiOperation({ summary: 'Get all questions' })
    async getAllQuestions() {
        return this.questionsService.getAllQuestions();
    }

    @Get(':id')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Get question by id',
        type: QuestionDto
    })
    @ApiOperation({ summary: 'Get question by id' })
    async getQuestionById(@Param('id') id: string) {
        return this.questionsService.findQuestionById(id);
    }

    @Patch(':id')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Update question by id',
        type: ResponseDto
    })
    @ApiOperation({ summary: 'Update question by id' })
    async updateQuestionById(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
        return this.questionsService.updateQuestionById(id, updateQuestionDto);
    }

    @Delete(':id')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Delete question by id',
        type: ResponseDto
    })
    @ApiOperation({ summary: 'Delete question by id' })
    async deleteQuestionById(@Param('id') id: string) {
        return this.questionsService.deleteQuestionById(id);
    }
}
