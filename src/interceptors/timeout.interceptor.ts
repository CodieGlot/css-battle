import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, throwError, TimeoutError } from 'rxjs';
import { EntityNotFoundError } from 'typeorm';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            // timeout(3000),
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new RequestTimeoutException());
                }

                if (err instanceof EntityNotFoundError) {
                    return throwError(() => new NotFoundException());
                }

                return throwError(() => err);
            })
        );
    }
}
