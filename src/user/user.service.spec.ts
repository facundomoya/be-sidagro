import { BadRequestException, ConflictException } from '@nestjs/common';
import { Bcrypt } from '../common/bcrypt/bcrypt';
import { GenericQueryService } from '../common/generic_query.service';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  const gerente = { id: 1, username: 'gerente', isActive: true } as User;
  let repository: { findOne: jest.Mock; update: jest.Mock; save: jest.Mock };
  let service: UserService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const bcrypt = { encrypt: jest.fn().mockResolvedValue('hash') };
    service = new UserService(
      repository as unknown as GenericQueryService,
      bcrypt as unknown as Bcrypt,
    );
  });

  it('da de baja dejando al usuario inactivo', async () => {
    repository.findOne.mockResolvedValue({ id: 2, isActive: true });

    await service.deactivate(2, gerente);

    expect(repository.update).toHaveBeenCalledWith(
      User,
      { id: 2 },
      { isActive: false },
    );
  });

  it('no permite darse de baja a si mismo', async () => {
    await expect(service.deactivate(1, gerente)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('informa si el usuario ya estaba inactivo', async () => {
    repository.findOne.mockResolvedValue({ id: 2, isActive: false });

    await expect(service.deactivate(2, gerente)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rechaza el alta con un correo ya registrado', async () => {
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 3 });

    await expect(
      service.create({
        username: 'nuevo',
        password: 'secreta1',
        email: 'repetido@empresa.com',
        name: 'N',
        lastname: 'U',
        type: '',
        roleId: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
