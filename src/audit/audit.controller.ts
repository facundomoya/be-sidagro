import {
  Controller,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidPermissions } from '../auth/enums/valid-permissions';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('/list')
  @Auth(ValidPermissions.AUDIT_GET_ALL)
  @UseInterceptors(ClassSerializerInterceptor)
  findAll() {
    return this.auditService.findAll();
  }
}
