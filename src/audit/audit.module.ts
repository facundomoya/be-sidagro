import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { GenericQueryService } from '../common/generic_query.service';

@Module({
  imports: [TypeOrmModule.forFeature([Audit])],
  controllers: [AuditController],
  providers: [AuditService, GenericQueryService],
  exports: [AuditService],
})
export class AuditModule {}
