import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const response = context.switchToHttp().getResponse();

    const message = this.generateMessage(method, url);

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message,
        data,
      })),
    );
  }

  private generateMessage(method: string, url: string): string {
    switch (method) {
      case 'GET':
        return `Data retrieved successfully from ${url}`;
      case 'POST':
        return `Resource created successfully at ${url}`;
      case 'PUT':
      case 'PATCH':
        return `Resource updated successfully at ${url}`;
      case 'DELETE':
        return `Resource deleted successfully at ${url}`;
      default:
        return `Request processed successfully`;
    }
  }
}
