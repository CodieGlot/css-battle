import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { TokenType, UserRole } from '../../../constants';
import { Token } from '../../../constants';
import { ApiConfigService } from '../../../shared/services/api-config.service';
import type { User } from '../../users/entities';
import { UsersService } from '../../users/users.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ApiConfigService, private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.authConfig.publicKey
        });
    }

    async validate(args: { userId: Uuid; role: UserRole; type: TokenType }): Promise<User> {
        if (args.type !== Token.ACCESS_TOKEN) {
            throw new UnauthorizedException();
        }

        const user = await this.usersService.findUserByIdOrUsername({
            // FIXME: issue with type casts
            id: args.userId as never
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
