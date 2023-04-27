import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Token } from '../../../constants';
import type ITokenPayload from '../../../interfaces/token-payload.interface';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import { UsersService } from '../../users/users.service';

interface IRequestHeaders extends Request {
    refreshtoken: string;
}
interface IRequest {
    headers: IRequestHeaders;
}

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
    constructor(private userService: UsersService, private configService: ApiConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromHeader('refreshtoken'),
            ignoreExpiration: false,
            secretOrKey: configService.authConfig.publicKey,
            passReqToCallback: true
        });
    }

    async validate(req: IRequest, payload: ITokenPayload) {
        if (payload.type !== Token.REFRESH_TOKEN) {
            throw new UnauthorizedException();
        }

        const user = await this.userService.findUserByIdOrUsername({ id: payload.userId });

        if (!user) {
            throw new UnauthorizedException();
        }

        return { id: user.id, username: user.username, role: user.role };
    }
}
