import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService],
  imports: [CommonModule],
})
export class PermissionModule {}
