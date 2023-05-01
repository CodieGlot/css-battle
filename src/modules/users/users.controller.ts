import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { UserRole } from '../../constants';
import { Auth, AuthUser } from '../../decorators';
import { CreateUsersDto, ResetPasswordDto, UserInfoDto } from './dto/request';
import { User } from './entities';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('create')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: ResponseDto,
        description: 'Create a new user'
    })
    @ApiOperation({ summary: 'Create a new user' })
    async createUser(@Body() userInfoDto: UserInfoDto) {
        return this.usersService.createUser(userInfoDto);
    }

    @Post('create-multiple')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: ResponseDto,
        description: 'Create new users'
    })
    @ApiOperation({ summary: 'Create new users' })
    async createUsers(@Body() createUsersDto: CreateUsersDto) {
        return this.usersService.createUsers(createUsersDto);
    }

    @Post('create-from-sheet')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: ResponseDto,
        description: 'Create new users'
    })
    @ApiOperation({ summary: 'Create new users' })
    async createUsersFromSheet() {
        return this.usersService.createUsersFromSheet();
    }

    @Get()
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: [User],
        description: 'Get all participants'
    })
    @ApiOperation({ summary: 'Get all participants' })
    async getAllParticipants() {
        return this.usersService.getAllParticipants();
    }

    @Get(':username')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: User,
        description: 'Get user by username'
    })
    @ApiOperation({ summary: 'Get user by username' })
    async getUserByUsername(@Param('username') username: string) {
        return this.usersService.findUserByIdOrUsername({ username });
    }

    @Patch('reset-password/:id')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: ResponseDto,
        description: 'Reset password by admin'
    })
    @ApiOperation({ summary: 'Reset password by admin' })
    async resetPassByAdmin(@Param('id') id: string) {
        return this.usersService.resetPassByAdmin(id);
    }

    @Patch('reset-password')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({
        type: ResponseDto,
        description: 'Reset password successfully'
    })
    @ApiOperation({ summary: 'Reset password' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @AuthUser() user: User) {
        return this.usersService.changePassword(user.id, resetPasswordDto);
    }

    @Delete(':id')
    @Auth([UserRole.ADMIN])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiAcceptedResponse({
        type: ResponseDto,
        description: 'Delete user successfully'
    })
    @ApiOperation({ summary: 'Delete user by id' })
    async deleteUserById(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}
