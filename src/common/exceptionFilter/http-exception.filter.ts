import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditService } from '../../audit/audit.service';
import { Audit } from '../../audit/entities/audit.entity';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditService: AuditService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const ip = request.ip ?? request.connection?.remoteAddress;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | null = null;

    // 👉 Caso 1: errores controlados de Nest
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;

        message = res.message ?? message;
        error = res.error ?? null;
      }
    }

    // 👉 Caso 2: errores inesperados (bugs, throw new Error, etc)
    else if (exception instanceof Error) {
      message = exception.message;
    }

    const auditData: Partial<Audit> = {
      statusCode: status,
      method: request.method,
      path: request.url,
      message: typeof message === 'string' ? message : message.join(', '),
      ip: ip,
      stack: exception instanceof Error ? exception.stack : null,
      timestamp: new Date(),
    };

    try {
      await this.auditService.save(auditData);
    } catch (auditError) {
      console.error('Failed to persist audit log', auditError);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      method: request.method,
      path: request.url,
      error: {
        message,
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
