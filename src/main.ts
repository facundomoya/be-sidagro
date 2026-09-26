import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './common/exceptionFilter/http-exception.filter';
import { ResponseInterceptor } from './common/response/response.interceptor';
import { LogginInterceptor } from './logger/interceptor/loggin.interceptor';
import { AuditService } from './audit/audit.service';
import { AppLoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const auditService = app.get(AuditService);

  app.useGlobalFilters(new HttpExceptionFilter(auditService));
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LogginInterceptor(auditService),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
