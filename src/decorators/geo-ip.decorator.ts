import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, createParamDecorator } from '@nestjs/common';
import { isNotEmpty, isString } from 'class-validator';
import { isIP } from 'net';

export interface IGeoIP {
    ipAddress: string;
    platform: string;
    city: string;
    country: string;
    countryCode: string;
}

export function isStringField(data: unknown): string {
    const isValid = isNotEmpty(data) && isString(data);

    if (!isValid) {
        throw new BadRequestException();
    }

    return data.trim();
}

export function isIpField(data: unknown): string {
    const isValid = isNotEmpty(data) && isString(data) && isIP(data);

    if (!isValid) {
        throw new BadRequestException();
    }

    return data.trim();
}

export function GeoIP() {
    return createParamDecorator((_data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<Request>();

        const geoIp: IGeoIP = {
            ipAddress: isIpField(request.headers['ip-address']),
            platform: isStringField(request.headers['platform']),
            city: isStringField(request.headers['city']),
            country: isStringField(request.headers['country']),
            countryCode: isStringField(request.headers['country-code'])
        };

        return geoIp;
    })();
}
