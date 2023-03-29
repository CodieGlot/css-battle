import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Auth } from 'googleapis';
import { google } from 'googleapis';
import { totp } from 'otplib';
import verifyAppleToken from 'verify-apple-id-token';

import { validateHash } from '../../common/utils';
import type { UserRole } from '../../constants';
import { EmailTemplate, RegisterMethod, TimeExpression, Token } from '../../constants';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { AwsSESService } from '../../shared/services/email-services/aws-ses.service';
import { NodemailerService } from '../../shared/services/email-services/nodemailer.service';
import type { ResetPasswordDto } from '../users/dto';
import type { User } from '../users/entities';
import { UsersService } from '../users/users.service';
import type { UserRegisterDto } from './dto';
import { LoginPayloadDto } from './dto';
import type { OTPDto } from './dto/request/otp.dto';
import type { UserLoginDto } from './dto/request/user-login.dto';
import { TokenPayloadDto } from './dto/response/token-payload.dto';
@Injectable()
export class AuthService {
    private readonly oauthClient: Auth.OAuth2Client;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ApiConfigService,
        private readonly usersService: UsersService,
        private readonly awsSESService: AwsSESService,
        private readonly nodemailerService: NodemailerService
    ) {
        this.oauthClient = new google.auth.OAuth2(
            this.configService.googleAuth.clientID,
            this.configService.googleAuth.clientSecret
        );
    }

    async createAccessToken(data: { role: UserRole; userId: string }): Promise<TokenPayloadDto> {
        return new TokenPayloadDto({
            expiresIn: this.configService.authConfig.jwtExpirationTime,
            accessToken: await this.jwtService.signAsync({
                userId: data.userId,
                type: Token.ACCESS_TOKEN,
                role: data.role
            }),
            refreshToken: await this.jwtService.signAsync(
                {
                    userId: data.userId,
                    type: Token.REFRESH_TOKEN,
                    role: data.role
                },
                {
                    // set expired date refresh token
                    expiresIn: TimeExpression.ONE_WEEK
                }
            )
        });
    }

    async validateUser(userLoginDto: UserLoginDto): Promise<User> {
        const user = await this.usersService.getUserByEmail(userLoginDto.email);

        if (!user) {
            throw new NotFoundException();
        }

        const isPasswordValid = await validateHash(userLoginDto.password, user?.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException();
        }

        return user;
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByIdOrEmail({
            email,
            registerType: RegisterMethod.REGISTER
        });

        totp.options = {
            digits: 6,
            step: 600
        };

        const otpCode = totp.generate(email);
        await this.nodemailerService.sendMailNodeMailer(
            EmailTemplate.FORGOT_PASSWORD_OTP_EMAIL,
            {
                subject: {},
                message: {
                    email: user.email,
                    otpCode
                }
            },
            [email]
        );
        // return otpCode
    }

    async verifyGoogleUser(token: string) {
        try {
            return await this.oauthClient.getTokenInfo(token);
        } catch {
            throw new BadRequestException('Invalid Token');
        }
    }

    async verifyAppleUser(token: string) {
        try {
            return await verifyAppleToken({
                idToken: token,
                clientId: this.configService.appleAuth.clientId
            });
        } catch {
            throw new BadRequestException('Invalid Token');
        }
    }

    async verifyOTP(dto: OTPDto): Promise<User> {
        const user = await this.usersService.findByIdOrEmail({
            email: dto.email
        });

        if (!totp.check(dto.otpCode, dto.email)) {
            throw new BadRequestException('Invalid OTP');
        }

        return user;
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        return this.usersService.resetPassword(resetPasswordDto);
    }

    async googleAppleAuthentication(
        email: string,
        _ip: string,
        registerType: RegisterMethod
    ): Promise<LoginPayloadDto> {
        const user = await this.usersService.getUserByEmail(email);

        if (!user) {
            const createUserDto: UserRegisterDto = {
                email
            };

            const userDto = await this.usersService.createUser(
                createUserDto,
                registerType,
                _ip === '::1' ? '14.245.167.9' : _ip
            );

            const token = await this.createAccessToken({
                userId: userDto.id,
                role: userDto.role
            });

            await this.usersService.updateLastLogin(userDto.id);

            return new LoginPayloadDto(userDto, token);
        }

        const loginToken = await this.createAccessToken({
            userId: user.id,
            role: user.role
        });

        await this.usersService.updateLastLogin(user.id);

        return new LoginPayloadDto(user.toResponseDto(), loginToken);
    }
}
