import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RolesEntity } from './entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from '../permission/entities/permission.entity';
import { GenericQueryService } from '../common/generic_query.service';

@Module({
  imports: [TypeOrmModule.forFeature([RolesEntity, PermissionEntity])],
  controllers: [RoleController],
  providers: [RoleService, GenericQueryService],
})
export class RoleModule {}
