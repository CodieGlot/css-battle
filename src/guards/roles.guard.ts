import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';

import type { UserRole } from '../constants';
import type { User } from '../modules/users/entities';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());

        if (_.isEmpty(roles)) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = <User>request.user;

        return roles.includes(user.role);
    }
}
