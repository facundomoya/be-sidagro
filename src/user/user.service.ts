import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GenericQueryService,
  ResponseFindAll,
} from '../common/generic_query.service';
import { User } from './entities/user.entity';
import { RolesEntity } from '../role/entities/role.entity';
import { Bcrypt } from '../common/bcrypt/bcrypt';
import type { Filters } from '../common/types/filters.type';
import type { DeepPartial } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: GenericQueryService,
    private readonly bcrypt: Bcrypt,
  ) {}

  async save(data: DeepPartial<User>): Promise<User> {
    if (data.password) {
      data.password = await this.bcrypt.encrypt(data.password);
    }
    return await this.repository.save<User>(User, data);
  }

  async findAll(filter: Filters): Promise<ResponseFindAll<User>> {
    return await this.repository.find<User>(User, {
      filters: filter,
      relations: { role: true },
    });
  }

  async find(filter: Filters) {
    return await this.repository.findOne(User, {
      filters: filter,
      relations: { role: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne(User, {
      filters: { username: username },
      relations: { role: { permission: true } },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return await this.repository.update<User>(User, { id }, data);
  }

  async delete(id: string): Promise<{ affected: number }> {
    return await this.repository.delete<User>(User, { id: +id });
  }

  async softDelete(id: string): Promise<{ affected: number }> {
    return await this.repository.softDelete<User>(User, { id: +id });
  }

  async addRole(userId: string, roleId: string) {
    const user = await this.repository.findOne(User, {
      filters: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(
        `No se encontro el usuario con id= ${userId}`,
      );
    }

    const role = await this.repository.findOne(RolesEntity, {
      filters: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`No se encontro el rol con el id= ${roleId}`);
    }

    user.role = role;

    await this.repository.update(User, { id: user.id }, { ...user });
    const userUpdate = await this.find({ id: user.id });
    return userUpdate;
  }

  async testTrx(filter: Filters): Promise<ResponseFindAll<User>> {
    await this.repository.withTransaction(async (manager) => {
      const userByFilter = await this.repository.find(
        User,
        { ...filter, takeAll: true },
        manager,
      );
      const promisesUpdated = userByFilter.data.map((u) => {
        return this.repository.update(
          User,
          { id: u.id },
          { lastname: 'Ruiz3' },
          manager,
        );
        return this.repository.update(
          User,
          { id: u.id },
          { lastname: 'Ruiz3' },
          manager,
        );
      });
      await Promise.all(promisesUpdated);
      return true;
    });
    const userUpdated = await this.repository.find(User, filter);
    return userUpdated;
  }

  register(email: string) {
    console.log('Usuario registrado ', email);

    // await this.queueServices.add("send-email",{ email });
    return { ok: true };
  }
}
