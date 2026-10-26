import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { QueryDto } from '../common/dtos/baseQuery.dto';
import type { Filters } from '../common/types/filters.type';
import { User } from './entities/user.entity';
import { ValidPermissions } from '../auth/enums/valid-permissions';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Usuarios')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @Auth(ValidPermissions.USER_GET_ALL)
  findMany(@Query() filter: QueryDto) {
    return this.userService.findAll(filter);
  }

  @Get('/find/one')
  @Auth(ValidPermissions.USER_GET_ALL)
  findOne(@Query() filter: Filters) {
    return this.userService.find(filter);
  }

  @Get(':id')
  @Auth(ValidPermissions.USER_GET_ONE)
  find(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findById(id);
  }

  @Post('/register')
  @Auth(ValidPermissions.USER_POST)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @Auth(ValidPermissions.USER_PUT)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidPermissions.USER_DELETE)
  deactivate(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.userService.deactivate(id, user);
  }

  @Post(':userId/add/role/:roleId')
  @Auth(ValidPermissions.USER_PUT)
  addRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.userService.addRole(userId, roleId);
  }
}
