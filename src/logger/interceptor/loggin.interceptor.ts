import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import { sanitize } from '../../common/utils/sanitize.utils';

@Injectable()
export class LogginInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ct = context.switchToHttp();
    const request = ct.getRequest<Request>();
    const response = ct.getResponse<Response>();
    const { method, url } = request;

    const startTime = Date.now();
    const ip = request.ip ?? request.connection?.remoteAddress;

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode ?? 200;
        if (statusCode >= 400) return;

        const endTime = Date.now();
        const duration = endTime - startTime;
        const timestamp = new Date().toISOString();
        const safeBody = JSON.stringify(sanitize(request.body ?? {}));

        console.log(
          `[${timestamp}] ${method} ${url} - ${duration}ms - IP: ${ip} - Body: ${safeBody}`,
        );

        this.auditService
          .save({
            statusCode,
            method,
            path: url,
            message: safeBody,
            ip: ip,
            stack: null,
            timestamp: new Date(),
          })
          .catch((err: Error) =>
            console.error('Failed to persist audit log', err),
          );
      }),
    );
  }
}
