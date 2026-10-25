import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { QueryDto } from '../common/dtos/baseQuery.dto';
import type { Filters } from '../common/types/filters.type';
import { User } from './entities/user.entity';
import type { DeepPartial } from 'typeorm';
import { ValidPermissions } from '../auth/enums/valid-permissions';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Usuarios')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @Auth(ValidPermissions.USER_GET_ALL)
  findMany(@Query() filter: QueryDto) {
    return this.userService.findAll(filter);
  }

  @Get(':id')
  @Auth(ValidPermissions.USER_GET_ONE)
  find(@Param('id') id: string) {
    return this.userService.find({ id });
  }

  @Get('/find/one')
  findOne(@Query() filter: Filters) {
    return this.userService.find(filter);
  }

  @Post('/register')
  save(@Body() body: DeepPartial<User>) {
    return this.userService.save(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<User>) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Delete('soft/:id')
  softDelete(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }

  @Get('/test/trx')
  pruebaTrx(@Query() filter: Filters) {
    return this.userService.testTrx(filter);
  }

  @Post(':userId/add/role/:roleId')
  addRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.userService.addRole(userId, roleId);
  }

  @Post('/register/queue')
  registerUser(@Body('email') email: string) {
    return this.userService.register(email);
  }
}
