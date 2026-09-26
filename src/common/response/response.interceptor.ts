import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const method = context.switchToHttp().getRequest<Request>().method;
    const requestPath =
      context.switchToHttp().getRequest<Request>().originalUrl || '';

    return next.handle().pipe(
      map((data) => {
        let message = '';

        switch (method) {
          case 'GET': {
            const payload = data?.data ?? data;
            const isEmpty =
              !payload || (Array.isArray(payload) && payload.length === 0);
            message = isEmpty
              ? 'No results found'
              : 'Information successfully retrieved';
            break;
          }
          case 'POST':
            message = requestPath.includes('/auth/login')
              ? 'Login successful'
              : 'Creation successful';
            break;
          case 'PATCH':
          case 'PUT':
            message = 'Update successful';
            break;
          case 'DELETE':
            message = 'Deletion successful';
            break;
          default:
            message = 'Operation successful';
        }

        return { statusCode: response.statusCode, message, data };
      }),
    );
  }
}
