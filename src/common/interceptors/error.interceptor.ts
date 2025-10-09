import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((err: unknown) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors: any = null;

        if (err instanceof HttpException) {
          status = err.getStatus();
          const res = err.getResponse();

          if (typeof res === 'string') {
            message = res;
          } else if (typeof res === 'object' && res !== null) {
            const errorResponse = res as { message?: string; error?: string };
            message =
              errorResponse.message ||
              errorResponse.error ||
              'Unexpected error';
            errors = res;
          }
        } else if (err instanceof Error && err.message) {
          message = err.message;
        }

        response.status(status);

        return throwError(() => ({
          statusCode: status,
          message,
          errors,
          timestamp: new Date().toISOString(),
        }));
      }),
    );
  }
}
