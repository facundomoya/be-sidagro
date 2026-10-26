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
  Query,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { QueryDto } from '../common/dtos/baseQuery.dto';

@ApiTags('Permisos')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionsService: PermissionService) {}

  @Post()
  @Auth(ValidPermissions.PERMISSION_POST)
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Auth(ValidPermissions.PERMISSION_GET_ALL)
  findAll(@Query() filter: QueryDto) {
    return this.permissionsService.findAll(filter);
  }

  @Get(':id')
  @Auth(ValidPermissions.PERMISSION_GET_ONE)
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidPermissions.PERMISSION_PUT)
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Auth(ValidPermissions.PERMISSION_DELETE)
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }
}
