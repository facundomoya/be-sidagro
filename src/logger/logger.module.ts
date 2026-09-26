import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AppLoggerService } from './logger.service';
import { LogginInterceptor } from './interceptor/loggin.interceptor';

@Module({
  imports: [AuditModule],
  providers: [AppLoggerService, LogginInterceptor],
  exports: [AppLoggerService, LogginInterceptor],
})
export class LoggerModule {}
