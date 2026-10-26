import {
  BadRequestException,
  Injectable,
  NotFoundException,
  NotImplementedException,
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

const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable()
export class SimulacionService {
  constructor(
    private readonly repository: GenericQueryService,
    private readonly catalogoService: CatalogoService,
  ) {}

  async create(dto: CreateSimulacionDto, usuario: User) {
    const lote = await this.catalogoService.findLote(dto.loteId);
    if (lote.estado !== 'ACTIVO') {
      throw new BadRequestException(`El lote ${lote.nombre} no esta activo`);
    }
    const etapa = await this.catalogoService.findEtapa(dto.etapaId);

    const serie = this.obtenerSerieClimatica(dto);

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
            fuenteClimatica: dto.fuenteClimatica,
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
              fuente: dto.fuenteClimatica,
              proveedor: null,
              simulacion: { id: simulacion.id },
            },
            manager,
          );
        }

        return simulacion.id;
      },
    );

    return await this.findOne(simulacionId);
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

  private obtenerSerieClimatica(dto: CreateSimulacionDto): DatoClimaticoDto[] {
    if (dto.fuenteClimatica === FuenteClimatica.API) {
      throw new NotImplementedException(
        'La obtencion de clima desde la API todavia no esta disponible; use fuenteClimatica MANUAL',
      );
    }

    const serie = [...(dto.datosClimaticos ?? [])].sort((a, b) =>
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
