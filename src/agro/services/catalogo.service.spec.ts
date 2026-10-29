import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GenericQueryService } from '../../common/generic_query.service';
import { Departamento } from '../entities/departamento.entity';
import { Lote } from '../entities/lote.entity';
import { CatalogoService } from './catalogo.service';

const copo = { id: 12, nombre: 'Copo', provincia: { id: 2 } };
const lote = {
  id: 5,
  nombre: 'Lote Norte',
  provincia: { id: 2, nombre: 'Santiago del Estero' },
};

describe('CatalogoService - departamento del lote', () => {
  let repository: { findOne: jest.Mock; update: jest.Mock; save: jest.Mock };
  let service: CatalogoService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn((entidad: unknown) =>
        Promise.resolve(entidad === Departamento ? copo : lote),
      ),
      update: jest.fn().mockResolvedValue(lote),
      save: jest.fn(),
    };
    service = new CatalogoService(repository as unknown as GenericQueryService);
  });

  const cambios = () =>
    (repository.update.mock.calls[0] as [unknown, unknown, object])[2];

  it('asigna un departamento de la provincia del lote', async () => {
    await service.updateLote(5, { departamentoId: 12 });
    expect(cambios()).toEqual({ departamento: copo });
  });

  it('rechaza un departamento de otra provincia', async () => {
    repository.findOne.mockImplementation((entidad: unknown) =>
      Promise.resolve(
        entidad === Departamento
          ? { id: 3, nombre: 'Chacabuco', provincia: { id: 1 } }
          : lote,
      ),
    );
    await expect(service.updateLote(5, { departamentoId: 3 })).rejects.toThrow(
      new BadRequestException(
        'El departamento Chacabuco no pertenece a la provincia del lote',
      ),
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('responde 404 si el departamento no existe', async () => {
    repository.findOne.mockImplementation((entidad: unknown) =>
      Promise.resolve(entidad === Departamento ? null : lote),
    );
    await expect(
      service.updateLote(5, { departamentoId: 99 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('con null quita el departamento y sin el campo no lo toca', async () => {
    await service.updateLote(5, { departamentoId: null });
    expect(cambios()).toEqual({ departamento: null });

    repository.update.mockClear();
    await service.updateLote(5, { rendimiento: 3 });
    expect(cambios()).toEqual({ rendimiento: 3 });
  });
});

describe('UPDATE del departamento del lote', () => {
  // Solo arma el SQL: no se conecta a la base.
  const dataSource = new DataSource({
    type: 'mysql',
    database: 'sin_conexion',
    entities: [__dirname + '/../../**/*.entity.ts'],
  });

  beforeAll(async () => {
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
  });

  const sqlDe = (departamento: object | null) =>
    dataSource
      .createQueryBuilder()
      .update(Lote)
      .set({ departamento } as object)
      .where('id = :id', { id: 5 })
      .getQueryAndParameters();

  it('guarda el id del departamento en departamento_id', () => {
    const [sql, parametros] = sqlDe(copo);
    expect(sql).toContain('`departamento_id` = ?');
    expect(parametros).toContain(12);
  });

  it('con null deja departamento_id en NULL', () => {
    const [sql, parametros] = sqlDe(null);
    expect(sql).toContain('`departamento_id` = ?');
    expect(parametros[0]).toBeNull();
  });
});
