import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GenericQueryService,
  ResponseFindAll,
} from '../common/generic_query.service';
import { User } from './entities/user.entity';
import { RolesEntity } from '../role/entities/role.entity';
import { Bcrypt } from '../common/bcrypt/bcrypt';
import type { Filters } from '../common/types/filters.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: GenericQueryService,
    private readonly bcrypt: Bcrypt,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const { roleId, password, ...data } = dto;
    await this.validarUnicidad(data.username, data.email);
    const role = await this.findRole(roleId);

    const user = await this.repository.save<User>(User, {
      ...data,
      password: await this.bcrypt.encrypt(password),
      role,
    });
    return await this.findById(user.id);
  }

  async findAll(filter: Filters): Promise<ResponseFindAll<User>> {
    return await this.repository.find<User>(User, {
      filters: filter,
      relations: ['role'],
    });
  }

  async find(filter: Filters) {
    return await this.repository.findOne(User, {
      filters: filter,
      relations: { role: true },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.find({ id });
    if (!user) {
      throw new NotFoundException(`No se encontro el usuario con id= ${id}`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne(User, {
      filters: { username: username },
      relations: { role: { permission: true } },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    const { roleId, password, ...data } = dto;

    await this.validarUnicidad(
      data.username !== user.username ? data.username : undefined,
      data.email !== user.email ? data.email : undefined,
    );

    const cambios: Partial<User> = { ...data };
    if (password) {
      cambios.password = await this.bcrypt.encrypt(password);
    }
    if (roleId) {
      cambios.role = await this.findRole(roleId);
    }

    await this.repository.update<User>(User, { id }, cambios);
    return await this.findById(id);
  }

  /** CU02.3: la baja deja al usuario Inactivo; no se borra para conservar la auditoria. */
  async deactivate(id: number, solicitante: User): Promise<User> {
    if (id === solicitante.id) {
      throw new BadRequestException('No puede darse de baja a si mismo');
    }
    const user = await this.findById(id);
    if (!user.isActive) {
      throw new BadRequestException(
        `El usuario ${user.username} ya se encuentra dado de baja`,
      );
    }
    await this.repository.update<User>(User, { id }, { isActive: false });
    return await this.findById(id);
  }

  async addRole(userId: number, roleId: number) {
    await this.findById(userId);
    const role = await this.findRole(roleId);
    await this.repository.update<User>(User, { id: userId }, { role });
    return await this.findById(userId);
  }

  private async findRole(roleId: number): Promise<RolesEntity> {
    const role = await this.repository.findOne(RolesEntity, {
      filters: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`No se encontro el rol con el id= ${roleId}`);
    }
    return role;
  }

  private async validarUnicidad(username?: string, email?: string) {
    if (username && (await this.find({ username }))) {
      throw new ConflictException(`El usuario ${username} ya existe`);
    }
    if (email && (await this.find({ email }))) {
      throw new ConflictException(
        `Ya existe un usuario asociado al correo ${email}`,
      );
    }
  }
}
