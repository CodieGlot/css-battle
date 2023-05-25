import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Auth } from 'googleapis';

import { validateHash } from '../../common/utils';
import type { UserRole } from '../../constants';
import { TimeExpression, Token } from '../../constants';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { User } from '../users/entities';
import { UsersService } from '../users/users.service';
import type { UserCredentialDto } from './dto/request/user-credential.dto';
import { TokenPayloadDto } from './dto/response/token-payload.dto';

@Injectable()
export class AuthService {
    private readonly oauthClient: Auth.OAuth2Client;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ApiConfigService,
        private readonly usersService: UsersService
    ) {}

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

    async validateUser(dto: UserCredentialDto): Promise<User> {
        const user = await this.usersService.findUserByIdOrUsername({ username: dto.username });

        if (!user) {
            throw new UnauthorizedException('Username or password is not valid');
        }

        const isPasswordValid = await validateHash(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Username or password is not valid');
        }

        return user;
    }
}
