import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import type { Observable } from 'rxjs';
import type { Socket } from 'socket.io';

import { ApiConfigService } from '../shared/services/api-config.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private readonly configService: ApiConfigService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const socket: Socket = context.switchToWs().getClient();

        const { authorization } = socket.handshake.headers;
        const token = authorization?.split(' ')[1];

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const payload = verify(token as string, this.configService.authConfig.publicKey);
        } catch {
            socket.emit('error', 'UNAUTHORIZED');

            return false;
        }

        return true;
    }
}
