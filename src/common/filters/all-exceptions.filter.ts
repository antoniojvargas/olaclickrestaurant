import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Si es un HttpException conocida (por ejemplo BadRequestException)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any).message || 'Internal server error';

    // 🧾 Log detallado con Winston
    this.logger.error(`🛑 [${request.method}] ${request.url}`, {
      timestamp: new Date().toISOString(),
      status,
      message,
      stack: (exception as any)?.stack,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    // 📤 Respuesta al cliente
    response.status(status).json({
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : message.message || 'Unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
