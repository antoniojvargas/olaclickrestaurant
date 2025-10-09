import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const now = Date.now();

    // 📥 Log inicial
    this.logger.log(`📥 [${method}] ${url} — Petición recibida`, {
      method,
      url,
      ip,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - now;
          this.logger.log(`📤 [${method}] ${url} — Completado en ${elapsed}ms`, {
            method,
            url,
            ip,
            duration: `${elapsed}ms`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (err) => {
          const elapsed = Date.now() - now;
          this.logger.error(
            `🛑 [${method}] ${url} — Error tras ${elapsed}ms`,
            err.stack,
          );
        },
      }),
    );
  }
}
