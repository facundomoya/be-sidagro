import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { addPermissionsDto, CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':roleId/add/permissions')
  addPermission(
    @Param('roleId') roleId: string,
    @Body() permissions: addPermissionsDto,
  ) {
    return this.roleService.addPermissions(roleId, permissions); //  (createRoleDto);
  }
  @Delete(':roleId/remove/permissions')
  removePErmission(
    @Param('roleId') roleId: string,
    @Body() permissions: addPermissionsDto,
  ) {
    return this.roleService.removePermissions(roleId, permissions); //  (createRoleDto);
  }
}
