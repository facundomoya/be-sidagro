import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClimaService } from '../clima/clima.service';
import { GenericQueryService } from '../../common/generic_query.service';
import { User } from '../../user/entities/user.entity';
import { CreateSimulacionDto } from '../dto/create-simulacion.dto';
import { DatoClimatico } from '../entities/dato-climatico.entity';
import { RecomendacionAgronomica } from '../entities/recomendacion-agronomica.entity';
import { SimulacionEscenario } from '../entities/simulacion-escenario.entity';
import { FuenteClimatica, NivelRiesgo } from '../enums/agro.enums';
import { ReglasLocalesProvider } from '../recomendacion/reglas-locales.provider';
import { CatalogoService } from './catalogo.service';
import { SimulacionService } from './simulacion.service';

const dia = (fecha: string) => ({
  fecha,
  temperatura: 25,
  precipitacion: 0,
  humedad: 60,
  viento: 10,
});

// Escenario tal como lo devuelve findOne (con relaciones cargadas).
const simulacionGuardada = (recomendacion: object | null = null) => ({
  id: 10,
  lote: {
    nombre: 'L1',
    provincia: { nombre: 'San Luis' },
    campania: { nombre: '2026/2027' },
  },
  etapa: { nombre: 'R3 - Formacion de vainas' },
  gddaMinimoUtilizado: '750.00',
  gddaMaximoUtilizado: '900.00',
  frecuenciaMonitoreoUtilizada: 'Cada 3 dias',
  riesgoEtapaUtilizado: 'Alto',
  riesgoPlaga: 'Moderado',
  observaciones: null,
  fuenteClimatica: 'MANUAL',
  datosClimaticos: [{ ...dia('2026-11-01'), proveedor: null }],
  recomendacion,
});

type Llamada = [unknown, Record<string, unknown>, ...unknown[]];

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
    update: jest.Mock;
    withTransaction: jest.Mock;
    findOne: jest.Mock;
  };
  let clima: { obtenerPronostico: jest.Mock };
  let recomendador: { modelo: string; generar: jest.Mock };
  let service: SimulacionService;

  const guardados = (entidad: unknown) =>
    (repository.save.mock.calls as Llamada[])
      .filter(([e]) => e === entidad)
      .map(([, data]) => data);
  const estados = () =>
    (repository.update.mock.calls as Llamada[])
      .filter(([e]) => e === SimulacionEscenario)
      .map(([, , data]) => (data as { estado: string }).estado);

  beforeEach(() => {
    repository = {
      save: jest.fn().mockImplementation((_entity: unknown, data: object) => ({
        id: 10,
        ...data,
      })),
      update: jest.fn().mockResolvedValue(null),
      withTransaction: jest
        .fn()
        .mockImplementation((cb: (manager: string) => unknown) =>
          cb('manager'),
        ),
      findOne: jest.fn().mockResolvedValue(simulacionGuardada()),
    };
    const catalogo = {
      findLote: jest.fn().mockResolvedValue({
        id: 2,
        estado: 'ACTIVO',
        nombre: 'L1',
        provincia: { id: 7 },
      }),
      findEtapa: jest.fn().mockResolvedValue(etapa),
    };
    clima = {
      obtenerPronostico: jest.fn().mockResolvedValue({
        proveedor: 'Open-Meteo',
        dias: [
          {
            ...dia('2026-10-26'),
            probabilidadLluvia: 20,
            estadoCielo: {
              codigo: 3,
              descripcion: 'Nublado',
              icono: 'nublado',
            },
          },
        ],
      }),
    };
    const reglas = new ReglasLocalesProvider();
    recomendador = {
      modelo: reglas.modelo,
      generar: jest.fn((c: Parameters<typeof reglas.generar>[0]) =>
        reglas.generar(c),
      ),
    };
    service = new SimulacionService(
      repository as unknown as GenericQueryService,
      catalogo as unknown as CatalogoService,
      clima as unknown as ClimaService,
      recomendador,
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

    expect(guardados(SimulacionEscenario)[0]).toMatchObject({
      gddaMinimoUtilizado: 750,
      gddaMaximoUtilizado: 900,
      frecuenciaMonitoreoUtilizada: 'Cada 3 días',
      riesgoEtapaUtilizado: 'Alto',
      riesgoPlaga: NivelRiesgo.MODERADO,
      estado: 'CREADA',
    });
    expect(guardados(DatoClimatico).map((d) => d.fecha)).toEqual([
      '2026-11-01',
      '2026-11-02',
    ]);
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

  it('con fuente API usa el pronostico de la provincia del lote', async () => {
    await service.create(
      dto({
        fuenteClimatica: FuenteClimatica.API,
        datosClimaticos: undefined,
        dias: 3,
      }),
      usuario,
    );

    expect(clima.obtenerPronostico).toHaveBeenCalledWith(7, 3);
    const [guardado] = guardados(DatoClimatico);
    expect(guardado).toMatchObject({
      fecha: '2026-10-26',
      fuente: FuenteClimatica.API,
      proveedor: 'Open-Meteo',
    });
    expect(guardado).not.toHaveProperty('estadoCielo');
    expect(guardado).not.toHaveProperty('probabilidadLluvia');
  });

  it('no guarda nada si el proveedor climatico falla', async () => {
    clima.obtenerPronostico.mockRejectedValue(
      new ServiceUnavailableException(),
    );

    await expect(
      service.create(dto({ fuenteClimatica: FuenteClimatica.API }), usuario),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('guarda la recomendacion y deja el escenario RECOMENDADA', async () => {
    await service.create(dto(), usuario);

    const [recomendacion] = guardados(RecomendacionAgronomica);
    expect(recomendacion).toMatchObject({
      simulacion: { id: 10 },
      modeloIa: 'reglas-locales',
      nivelRiesgo: 'Alto',
    });
    expect(estados()).toEqual(['RECOMENDADA']);
  });

  it('si la recomendacion falla, el escenario queda guardado en ERROR', async () => {
    recomendador.generar.mockRejectedValue(new Error('timeout'));

    await expect(service.create(dto(), usuario)).resolves.toBeDefined();
    expect(guardados(SimulacionEscenario)).toHaveLength(1);
    expect(guardados(RecomendacionAgronomica)).toHaveLength(0);
    expect(estados()).toEqual(['ERROR']);
  });

  it('descarta una recomendacion con estructura invalida', async () => {
    recomendador.generar.mockResolvedValue({ resumen: 'incompleta' });

    await service.create(dto(), usuario);

    expect(guardados(RecomendacionAgronomica)).toHaveLength(0);
    expect(estados()).toEqual(['ERROR']);
  });

  it('el reintento genera la recomendacion pendiente', async () => {
    await service.recomendar(10);

    expect(guardados(RecomendacionAgronomica)).toHaveLength(1);
    expect(estados()).toEqual(['RECOMENDADA']);
  });

  it('el reintento falla con 409 si ya hay recomendacion', async () => {
    repository.findOne.mockResolvedValue(simulacionGuardada({ id: 1 }));

    await expect(service.recomendar(10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('el reintento responde 503 si vuelve a fallar', async () => {
    recomendador.generar.mockRejectedValue(new Error('caido'));

    await expect(service.recomendar(10)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
