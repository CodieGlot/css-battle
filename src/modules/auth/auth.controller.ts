import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Version } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { UserRole } from '../../constants';
import { Auth, AuthUser, RefreshToken } from '../../decorators';
import IRequestWithUser from '../../interfaces/request-with-user.interface';
import { UserDto } from '../users/dto/response/user.dto';
import { User } from '../users/entities';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto, UserCredentialDto } from './dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    constructor(private readonly usersService: UsersService, private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: 'User info with access token'
    })
    @ApiOperation({ summary: 'Login with credentials' })
    async userLogin(@Body() userLoginDto: UserCredentialDto): Promise<LoginPayloadDto> {
        const userEntity = await this.authService.validateUser(userLoginDto);

        const token = await this.authService.createAccessToken({
            userId: userEntity.id,
            role: userEntity.role
        });

        return new LoginPayloadDto(userEntity.toResponseDto(), token);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: ResponseDto,
        description: 'Successfully Registered'
    })
    @ApiOperation({ summary: 'Register with username and password' })
    async userRegister(@Body() dto: UserCredentialDto) {
        const user = await this.usersService.createUser(dto);

        const token = await this.authService.createAccessToken({
            userId: user.id,
            role: user.role
        });

        return new LoginPayloadDto(user.toResponseDto(), token);
    }

    @Version('1')
    @Get('me')
    @HttpCode(HttpStatus.OK)
    @Auth([UserRole.USER, UserRole.ADMIN])
    @ApiOkResponse({ type: UserDto, description: 'Current user infomation' })
    @ApiOperation({ summary: 'Get current user information' })
    getCurrentUser(@AuthUser() user: User) {
        return this.usersService.findUserByIdOrUsername({ id: user.id });
    }

    @RefreshToken()
    @Post('refresh-token')
    @ApiOperation({ summary: 'Generate new access token' })
    async refreshToken(@Req() req: IRequestWithUser) {
        if (req?.user) {
            return this.authService.createAccessToken({
                userId: req.user.id,
                role: req.user.role
            });
        }
    }
}
