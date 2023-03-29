import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Ip,
    Patch,
    Post,
    Query,
    Req,
    Version
} from '@nestjs/common';
import {
    ApiAcceptedResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from '@nestjs/swagger';

import { ResponseDto } from '../../common/dto';
import { RegisterMethod, UserRole } from '../../constants';
import { Auth, AuthUser, RefreshToken } from '../../decorators';
import IRequestWithUser from '../../interfaces/request-with-user.interface';
import { ResetPasswordDto } from '../users/dto';
import { UserDto } from '../users/dto/response/user.dto';
import { User } from '../users/entities';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { TokenPayloadDto } from './dto';
import { GoogleApplePayloadDto, LoginPayloadDto, UserLoginDto, ValidateEmailDto } from './dto';
import { ForgotPasswordDto } from './dto/request/forgot-password.dto';
import { OTPDto } from './dto/request/otp.dto';
import { UserRegisterDto } from './dto/request/user-register.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    constructor(private usersService: UsersService, private authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: 'User info with access token'
    })
    @ApiOperation({ summary: 'Login with credentials' })
    async userLogin(@Body() userLoginDto: UserLoginDto): Promise<LoginPayloadDto> {
        const userEntity = await this.authService.validateUser(userLoginDto);

        const token = await this.authService.createAccessToken({
            userId: userEntity.id,
            role: userEntity.role
        });

        await this.usersService.updateLastLogin(userEntity.id);

        return new LoginPayloadDto(userEntity.toResponseDto(), token);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Generate OTP send to user email'
    })
    @ApiOperation({ summary: 'Forgot password' })
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'OTP verification successfully!'
    })
    @ApiOperation({ summary: 'Verify OTP' })
    async verifyOtp(@Body() dto: OTPDto): Promise<TokenPayloadDto> {
        const user = await this.authService.verifyOTP(dto);

        return this.authService.createAccessToken({
            userId: user.id,
            role: user.role
        });
    }

    @Patch('reset-password')
    @HttpCode(HttpStatus.ACCEPTED)
    @Auth([UserRole.USER, UserRole.ADMIN])
    @ApiAcceptedResponse({
        description: 'Reset password successfully'
    })
    @ApiOperation({ summary: 'Reset password' })
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('google')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: LoginPayloadDto,
        description: 'Successfully Registered'
    })
    @ApiOperation({ summary: 'Sign in with Google' })
    async googleSignUp(
        @Body() googlePayloadDto: GoogleApplePayloadDto,
        @Ip() _ip: string
    ): Promise<LoginPayloadDto> {
        const googleUser = await this.authService.verifyGoogleUser(googlePayloadDto.idToken);

        return this.authService.googleAppleAuthentication(googleUser.email!, _ip, RegisterMethod.GOOGLE);
    }

    @Post('apple')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: LoginPayloadDto,
        description: 'Successfully Registered'
    })
    @ApiOperation({ summary: 'Signup with Apple' })
    async appleSignUp(
        @Body() applePayloadDto: GoogleApplePayloadDto,
        @Ip() _ip: string
    ): Promise<LoginPayloadDto> {
        const appleUser = await this.authService.verifyAppleUser(applePayloadDto.idToken);

        return this.authService.googleAppleAuthentication(appleUser.email, _ip, RegisterMethod.APPLE);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: ResponseDto,
        description: 'Successfully Registered'
    })
    @ApiOperation({ summary: 'Register with Email/Password' })
    async userRegister(@Body() dto: UserRegisterDto, @Ip() _ip: string) {
        const userDto = await this.usersService.createUser(
            dto,
            RegisterMethod.REGISTER,
            _ip === '::1' ? '14.245.167.9' : _ip
        );

        const token = await this.authService.createAccessToken({
            userId: userDto.id,
            role: userDto.role
        });

        await this.usersService.updateLastLogin(userDto.id);

        return new LoginPayloadDto(userDto, token);
    }

    @Version('1')
    @Get('me')
    @HttpCode(HttpStatus.OK)
    @Auth([UserRole.USER, UserRole.ADMIN])
    @ApiOkResponse({ type: UserDto, description: 'Current user infomation' })
    @ApiOperation({ summary: 'Get current user information' })
    async getCurrentUser(@AuthUser() user: User): Promise<UserDto> {
        const userResult = await this.usersService.getUserById(user.id);

        return userResult.toResponseDto();
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

    @Get('email-validation')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: ResponseDto })
    @ApiOperation({ summary: 'Check if email is already taken' })
    checkExistingEmail(@Query() dto: ValidateEmailDto) {
        return this.usersService.checkExistingEmail(dto.email);
    }
}
