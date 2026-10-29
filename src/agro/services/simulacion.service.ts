import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import type { Filters } from '../../common/types/filters.type';
import { User } from '../../user/entities/user.entity';
import {
  CreateSimulacionDto,
  DatoClimaticoDto,
} from '../dto/create-simulacion.dto';
import { DatoClimatico } from '../entities/dato-climatico.entity';
import { SimulacionEscenario } from '../entities/simulacion-escenario.entity';
import {
  EstadoSimulacion,
  FuenteClimatica,
  MAX_DIAS_CLIMATICOS,
} from '../enums/agro.enums';
import { CatalogoService } from './catalogo.service';
import { RecomendacionAgronomica } from '../entities/recomendacion-agronomica.entity';
import {
  RECOMMENDATION_PROVIDER,
  type RecommendationProvider,
} from '../recomendacion/recommendation-provider.interface';
import { construirContexto } from '../recomendacion/contexto-escenario';
import { validarRecomendacion } from '../recomendacion/validar-recomendacion';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable()
export class SimulacionService {
  private readonly logger = new Logger(SimulacionService.name);

  constructor(
    private readonly repository: GenericQueryService,
    private readonly catalogoService: CatalogoService,
    @Inject(RECOMMENDATION_PROVIDER)
    private readonly recommendationProvider: RecommendationProvider,
  ) {}

  async create(dto: CreateSimulacionDto, usuario: User) {
    const lote = await this.catalogoService.findLote(dto.loteId);
    if (lote.estado !== 'ACTIVO') {
      throw new BadRequestException(`El lote ${lote.nombre} no esta activo`);
    }
    const etapa = await this.catalogoService.findEtapa(dto.etapaId);

    // El clima del escenario siempre lo carga el ingeniero (CU 07).
    const serie = this.validarSerieManual(dto);
    if (lote.fechaSiembra && serie[0].fecha < lote.fechaSiembra) {
      throw new BadRequestException(
        `La serie climatica no puede empezar antes de la siembra del lote (${lote.fechaSiembra})`,
      );
    }

    const simulacionId = await this.repository.withTransaction(
      async (manager) => {
        // Se copian los valores derivados de la etapa para que el escenario
        // sea reproducible aunque luego cambie la parametrizacion.
        const simulacion = await this.repository.save(
          SimulacionEscenario,
          {
            usuario: { id: usuario.id },
            lote: { id: lote.id },
            etapa: { id: etapa.id },
            fuenteClimatica: FuenteClimatica.MANUAL,
            riesgoPlaga: dto.riesgoObservado,
            observaciones: dto.observaciones ?? null,
            gddaMinimoUtilizado: etapa.gddaMinimo,
            gddaMaximoUtilizado: etapa.gddaMaximo,
            frecuenciaMonitoreoUtilizada: etapa.frecuenciaMonitoreo,
            riesgoEtapaUtilizado: etapa.riesgoChinche,
            estado: EstadoSimulacion.CREADA,
          },
          manager,
        );

        for (const dia of serie) {
          await this.repository.save(
            DatoClimatico,
            {
              ...dia,
              fuente: FuenteClimatica.MANUAL,
              proveedor: null,
              simulacion: { id: simulacion.id },
            },
            manager,
          );
        }

        return simulacion.id;
      },
    );

    // El escenario ya quedo guardado: si la recomendacion falla, queda en
    // ERROR y se puede reintentar con POST /agro/simulaciones/:id/recomendacion.
    await this.intentarRecomendacion(simulacionId);
    return await this.findOne(simulacionId);
  }

  /** Reintento manual cuando la recomendacion fallo (estado ERROR). */
  async recomendar(id: number) {
    const simulacion = await this.findOne(id);
    if (simulacion.recomendacion) {
      throw new ConflictException(
        `La simulacion ${id} ya tiene una recomendacion`,
      );
    }
    if (!(await this.intentarRecomendacion(id))) {
      throw new ServiceUnavailableException(
        'No fue posible generar la recomendacion. Intente nuevamente mas tarde.',
      );
    }
    return await this.findOne(id);
  }

  async findAll(filter: Filters) {
    return await this.repository.find(SimulacionEscenario, {
      filters: filter,
      relations: ['lote', 'etapa', 'usuario'],
    });
  }

  async findOne(id: number) {
    const simulacion = await this.repository.findOne(SimulacionEscenario, {
      filters: { id },
      relations: {
        usuario: true,
        lote: { provincia: true, campania: true },
        etapa: true,
        datosClimaticos: true,
        recomendacion: true,
      },
    });
    if (!simulacion) {
      throw new NotFoundException(`No se encontro la simulacion con id= ${id}`);
    }
    simulacion.datosClimaticos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return simulacion;
  }

  /** Genera, valida y guarda la recomendacion. Devuelve false si fallo. */
  private async intentarRecomendacion(id: number): Promise<boolean> {
    try {
      const simulacion = await this.findOne(id);
      const contexto = construirContexto(simulacion);
      const generada = await this.recommendationProvider.generar(contexto);
      const errores = validarRecomendacion(generada, contexto.fechaSimulacion);
      if (errores.length > 0) {
        throw new Error(`Recomendacion invalida: ${errores.join('; ')}`);
      }

      await this.repository.withTransaction(async (manager) => {
        await this.repository.save(
          RecomendacionAgronomica,
          {
            ...generada,
            simulacion: { id },
            modeloIa: this.recommendationProvider.modelo,
            fechaGeneracion: new Date(),
            respuestaOriginal: JSON.stringify(generada),
          },
          manager,
        );
        await this.repository.update(
          SimulacionEscenario,
          { id },
          { estado: EstadoSimulacion.RECOMENDADA },
          manager,
        );
      });
      return true;
    } catch (error) {
      this.logger.error(
        `No se pudo generar la recomendacion de la simulacion ${id}: ${(error as Error).message}`,
      );
      await this.repository
        .update(SimulacionEscenario, { id }, { estado: EstadoSimulacion.ERROR })
        // Si ya estaba en ERROR la base informa 0 filas cambiadas; no es un problema.
        .catch(() => undefined);
      return false;
    }
  }

  private validarSerieManual(dto: CreateSimulacionDto): DatoClimaticoDto[] {
    const serie = [...dto.datosClimaticos].sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );

    const fechas = new Set(serie.map((dia) => dia.fecha));
    if (fechas.size !== serie.length) {
      throw new BadRequestException(
        'La serie climatica tiene fechas repetidas',
      );
    }

    const primera = Date.parse(serie[0].fecha);
    const ultima = Date.parse(serie[serie.length - 1].fecha);
    if ((ultima - primera) / MS_POR_DIA >= MAX_DIAS_CLIMATICOS) {
      throw new BadRequestException(
        `La serie climatica debe abarcar como maximo ${MAX_DIAS_CLIMATICOS} dias corridos`,
      );
    }

    return serie;
  }
}
