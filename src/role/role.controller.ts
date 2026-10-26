import { Auth } from '../auth/decorators/auth.decorator';
import { ValidPermissions } from '../auth/enums/valid-permissions';
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
  @Auth(ValidPermissions.ROLE_POST)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @Auth(ValidPermissions.ROLE_GET_ALL)
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @Auth(ValidPermissions.ROLE_GET_ONE)
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidPermissions.ROLE_PUT)
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Auth(ValidPermissions.ROLE_DELETE)
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':roleId/add/permissions')
  @Auth(ValidPermissions.ROLE_PUT)
  addPermission(
    @Param('roleId') roleId: string,
    @Body() permissions: addPermissionsDto,
  ) {
    return this.roleService.addPermissions(roleId, permissions); //  (createRoleDto);
  }
  @Delete(':roleId/remove/permissions')
  @Auth(ValidPermissions.ROLE_PUT)
  removePErmission(
    @Param('roleId') roleId: string,
    @Body() permissions: addPermissionsDto,
  ) {
    return this.roleService.removePermissions(roleId, permissions); //  (createRoleDto);
  }
}
