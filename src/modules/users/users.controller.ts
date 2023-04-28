import { Controller, Delete, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { UserRole } from '../../constants';
import { Auth } from '../../decorators';
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
