import type { PipeTransform } from '@nestjs/common';
import {
    applyDecorators,
    Param,
    ParseUUIDPipe,
    SetMetadata,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import type { Type } from '@nestjs/common/interfaces';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import type { UserRole } from '../constants';
import { AuthGuard, JwtRefreshGuard, RolesGuard } from '../guards';
import { AuthUserInterceptor } from '../interceptors/auth-user.interceptor';
import { PublicRoute } from './public-route.decorator';

export function Auth(roles: UserRole[] = [], options?: Partial<{ public: boolean }>): MethodDecorator {
    const isPublicRoute = options?.public;

    return applyDecorators(
        SetMetadata('roles', roles),
        UseGuards(AuthGuard({ public: isPublicRoute }), RolesGuard),
        ApiBearerAuth(),
        UseInterceptors(AuthUserInterceptor),
        ApiUnauthorizedResponse({ description: 'Unauthorized' }),
        PublicRoute(isPublicRoute)
    );
}

export function RefreshToken(): MethodDecorator {
    return applyDecorators(
        UseGuards(JwtRefreshGuard),
        ApiUnauthorizedResponse({ description: 'Unauthorized' })
    );
}

export function UUIDParam(
    property: string,
    ...pipes: Array<Type<PipeTransform> | PipeTransform>
): ParameterDecorator {
    return Param(property, new ParseUUIDPipe({ version: '4' }), ...pipes);
}
