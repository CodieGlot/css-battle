import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const error = this.getErrorType(response, exceptionResponse);

        response.status(status).json({
            ...error,
            timestamp: new Date().toISOString()
        });
    }

    private getErrorType(
        response: Response<unknown, Record<string, unknown>>,
        exceptionResponse: string | Record<never, never>
    ) {
        if (typeof response === 'string') {
            return { message: exceptionResponse };
        }

        const error = exceptionResponse as Record<string, string>;

        const message = typeof error.message === 'string' ? error.message.toUpperCase() : error.message;

        return {
            status: error.status,
            message,
            error: STATUS_CODES[error.status]
        } as Record<string, number | string>;
    }
}
