import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { FileModule } from './file/file.module';
import { appDataSource } from 'data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RoleModule } from './role/role.module';
import { AuditModule } from './audit/audit.module';
import { LoggerModule } from './logger/logger.module';
import { PermissionModule } from './permission/permission.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    /*   ServeStaticModule.forRoot({
      rootPath: '',
      serveRoot: '',
    }), */
    TypeOrmModule.forRoot(appDataSource.options),
    CommonModule,
    FileModule,
    UserModule,
    AuthModule,
    RoleModule,
    AuditModule,
    LoggerModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
