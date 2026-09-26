import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { GenericQueryService } from '../common/generic_query.service';
import { PermissionEntity } from './entities/permission.entity';
import { Filters } from '../common/types/filters.type';

@Injectable()
export class PermissionService {
  constructor(private readonly repository: GenericQueryService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    return await this.repository.save(PermissionEntity, createPermissionDto);
  }

  async findAll(filter: Filters) {
    return await this.repository.find<PermissionEntity>(PermissionEntity, {
      filters: filter,
    });
  }

  async findOne(id: string) {
    return await this.repository.findOne(PermissionEntity, {
      where: { id: +id },
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return await this.repository.update(
      PermissionEntity,
      { id },
      { ...updatePermissionDto },
    );
  }

  async remove(id: number) {
    return await this.repository.softDelete(PermissionEntity, { id });
  }
}
