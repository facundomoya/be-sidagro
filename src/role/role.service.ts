import { Injectable, NotFoundException } from '@nestjs/common';
import { addPermissionsDto, CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GenericQueryService } from 'src/common/generic_query.service';
import { RolesEntity } from './entities/role.entity';
import { PermissionEntity } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(private readonly repository: GenericQueryService) {}

  async create(createRoleDto: CreateRoleDto) {
    return await this.repository.save(RolesEntity, createRoleDto);
  }

  async findAll() {
    return await this.repository.find(RolesEntity, {});
  }

  async findOne(id: string) {
    return await this.repository.findOne(RolesEntity, {
      where: { id: +id },
      relations: { permission: true },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.repository.update(RolesEntity, { id }, updateRoleDto);
  }

  async remove(id: string) {
    return this.repository.softDelete(RolesEntity, { id: +id });
  }

  async addPermissions(id: string, data: addPermissionsDto) {
    const promisesPermissions: Promise<PermissionEntity | null>[] = [];
    const role = await this.findOne(id);
    if (!role) {
      throw new NotFoundException('Rol not found with id: ' + id);
    }

    for (const idPermission of data.ids) {
      const permisons = this.repository.findOne(PermissionEntity, {
        filters: { id: idPermission },
      });
      promisesPermissions.push(permisons);
    }
    const permissions = await Promise.all(promisesPermissions);
    const permissionsNotNull = permissions.filter((p) => !!p);

    role.permission = permissionsNotNull;

    await this.repository.save(RolesEntity, role);

    return await this.findOne(String(role.id));
  }

  async removePermissions(id: string, data: addPermissionsDto) {
    const role = await this.findOne(id);
    if (!role) {
      throw new NotFoundException('Rol not found with id: ' + id);
    }

    role.permission = role.permission.filter((p) => !data.ids.includes(p.id));

    await this.repository.save(RolesEntity, role);

    return await this.findOne(String(role.id));
  }
}
