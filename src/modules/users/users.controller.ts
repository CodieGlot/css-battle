import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { UserRole } from '../../constants';
import { Auth, AuthUser } from '../../decorators';
import { ResetPasswordDto, UploadAvatarDto } from './dto/request';
import { User } from './entities';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

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

    @Patch('upload-avatar')
    @Auth([UserRole.ADMIN, UserRole.USER])
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: ResponseDto,
        description: 'Upload avatar successfully'
    })
    @ApiOperation({ summary: 'Upload avatar' })
    async uploadAvatar(@Body() uploadAvatarDto: UploadAvatarDto, @AuthUser() user: User) {
        return this.usersService.uploadAvatar(user.id, uploadAvatarDto);
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
        return this.usersService.resetPassword(user.id, resetPasswordDto);
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
