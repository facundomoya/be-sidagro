import { BadRequestException, NotImplementedException } from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import { User } from '../../user/entities/user.entity';
import { CreateSimulacionDto } from '../dto/create-simulacion.dto';
import { FuenteClimatica, NivelRiesgo } from '../enums/agro.enums';
import { CatalogoService } from './catalogo.service';
import { SimulacionService } from './simulacion.service';

const dia = (fecha: string) => ({
  fecha,
  temperatura: 25,
  precipitacion: 0,
  humedad: 60,
  viento: 10,
});

describe('SimulacionService', () => {
  const etapa = {
    id: 4,
    gddaMinimo: 750,
    gddaMaximo: 900,
    frecuenciaMonitoreo: 'Cada 3 días',
    riesgoChinche: 'Alto',
  };
  const usuario = { id: 1 } as User;

  let repository: {
    save: jest.Mock;
    withTransaction: jest.Mock;
    findOne: jest.Mock;
  };
  let service: SimulacionService;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockImplementation((_entity: unknown, data: object) => ({
        id: 10,
        ...data,
      })),
      withTransaction: jest
        .fn()
        .mockImplementation((cb: (manager: string) => unknown) =>
          cb('manager'),
        ),
      findOne: jest.fn().mockResolvedValue({ id: 10, datosClimaticos: [] }),
    };
    const catalogo = {
      findLote: jest
        .fn()
        .mockResolvedValue({ id: 2, estado: 'ACTIVO', nombre: 'L1' }),
      findEtapa: jest.fn().mockResolvedValue(etapa),
    };
    service = new SimulacionService(
      repository as unknown as GenericQueryService,
      catalogo as unknown as CatalogoService,
    );
  });

  const dto = (
    overrides: Partial<CreateSimulacionDto> = {},
  ): CreateSimulacionDto => ({
    loteId: 2,
    etapaId: 4,
    fuenteClimatica: FuenteClimatica.MANUAL,
    riesgoObservado: NivelRiesgo.MODERADO,
    datosClimaticos: [dia('2026-11-02'), dia('2026-11-01')],
    ...overrides,
  });

  it('guarda el escenario con los valores derivados de la etapa y la serie ordenada', async () => {
    await service.create(dto(), usuario);

    const calls = repository.save.mock.calls as [
      unknown,
      Record<string, unknown>,
    ][];
    const [, simulacion] = calls[0];
    expect(simulacion).toMatchObject({
      gddaMinimoUtilizado: 750,
      gddaMaximoUtilizado: 900,
      frecuenciaMonitoreoUtilizada: 'Cada 3 días',
      riesgoEtapaUtilizado: 'Alto',
      riesgoPlaga: NivelRiesgo.MODERADO,
      estado: 'CREADA',
    });
    const fechas = calls.slice(1).map(([, d]) => d.fecha);
    expect(fechas).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('rechaza fechas repetidas', async () => {
    await expect(
      service.create(
        dto({ datosClimaticos: [dia('2026-11-01'), dia('2026-11-01')] }),
        usuario,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza series que abarcan mas de 7 dias corridos', async () => {
    await expect(
      service.create(
        dto({ datosClimaticos: [dia('2026-11-01'), dia('2026-11-08')] }),
        usuario,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('informa que la fuente API todavia no esta disponible', async () => {
    await expect(
      service.create(dto({ fuenteClimatica: FuenteClimatica.API }), usuario),
    ).rejects.toBeInstanceOf(NotImplementedException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
