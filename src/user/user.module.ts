import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesEntity } from '../role/entities/role.entity';
import { Bcrypt } from '../common/bcrypt/bcrypt';
import { GenericQueryService } from '../common/generic_query.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, RolesEntity])],
  controllers: [UserController],
  providers: [UserService, GenericQueryService, Bcrypt],
  exports: [UserService, Bcrypt],
})
export class UserModule {}
