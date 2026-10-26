import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import { Provincia } from '../entities/provincia.entity';
import {
  CLIMATE_PROVIDER,
  type ClimateProvider,
  PronosticoDiario,
} from './climate-provider.interface';

export interface Pronostico {
  proveedor: string;
  provincia: string;
  latitud: number;
  longitud: number;
  dias: PronosticoDiario[];
}

@Injectable()
export class ClimaService {
  constructor(
    private readonly repository: GenericQueryService,
    @Inject(CLIMATE_PROVIDER) private readonly provider: ClimateProvider,
  ) {}

  /** Usa las coordenadas de referencia de la provincia (no las del lote). */
  async obtenerPronostico(
    provinciaId: number,
    dias: number,
  ): Promise<Pronostico> {
    const provincia = await this.repository.findOne(Provincia, {
      filters: { id: provinciaId },
    });
    if (!provincia) {
      throw new NotFoundException(
        `No se encontro la provincia con id= ${provinciaId}`,
      );
    }

    const latitud = Number(provincia.latitud);
    const longitud = Number(provincia.longitud);
    return {
      proveedor: this.provider.nombre,
      provincia: provincia.nombre,
      latitud,
      longitud,
      dias: await this.provider.obtenerPronostico(latitud, longitud, dias),
    };
  }
}
