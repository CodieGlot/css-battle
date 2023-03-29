import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'http';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter<QueryFailedError> {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status =
            exception.driverError?.routine === 'string_to_uuid'
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.INTERNAL_SERVER_ERROR;

        response.status(status).json({
            status,
            message:
                exception.driverError?.routine === 'string_to_uuid'
                    ? 'Uuid invalid'
                    : 'Internal Server Error',
            error: STATUS_CODES[status],
            timestamp: new Date().toISOString()
        });
    }
}
