import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import { User } from '../../user/entities/user.entity';
import { ClimaService } from '../clima/clima.service';
import {
  CLIMATE_PROVIDER,
  type ClimateProvider,
} from '../clima/climate-provider.interface';
import { CreateObservacionDto } from '../dto/create-observacion.dto';
import { Lote } from '../entities/lote.entity';
import { ObservacionMonitoreo } from '../entities/observacion-monitoreo.entity';
import { MAX_DIAS_CLIMATICOS } from '../enums/agro.enums';
import { CatalogoService } from '../services/catalogo.service';
import {
  calcularMonitoreo,
  EtapaReferencia,
  etapaPorGdda,
  gradosDia,
  sumarDias,
  TEMPERATURA_BASE,
} from './calculo-monitoreo';

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
const hoyEnArgentina = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

/**
 * Monitoreo de chinche verde (CU 06): estado del cultivo por grados dia,
 * fechas para monitorear y observaciones de campo. No usa IA.
 */
@Injectable()
export class MonitoreoService {
  private readonly logger = new Logger(MonitoreoService.name);

  constructor(
    private readonly repository: GenericQueryService,
    private readonly catalogoService: CatalogoService,
    private readonly climaService: ClimaService,
    @Inject(CLIMATE_PROVIDER) private readonly climateProvider: ClimateProvider,
  ) {}

  async estado(loteId: number) {
    const lote = await this.catalogoService.findLote(loteId);
    const fechaSiembra = this.validarSiembra(lote);
    const hoy = hoyEnArgentina();

    const [temperaturas, pronostico, etapas, observaciones] = await Promise.all(
      [
        this.temperaturas(lote, fechaSiembra, sumarDias(hoy, 6)),
        this.climaService.obtenerPronostico(
          lote.provincia.id,
          MAX_DIAS_CLIMATICOS,
        ),
        this.etapas(),
        this.observacionesDe(loteId),
      ],
    );

    const resultado = calcularMonitoreo({
      fechaSiembra,
      hoy,
      temperaturas,
      pronostico: pronostico.dias,
      etapas,
      observaciones,
    });

    return {
      lote: {
        id: lote.id,
        nombre: lote.nombre,
        fechaSiembra,
        provincia: lote.provincia.nombre,
        campania: lote.campania.nombre,
      },
      fecha: hoy,
      temperaturaBase: TEMPERATURA_BASE,
      proveedorClimatico: pronostico.proveedor,
      ...resultado,
      ultimaObservacion: observaciones[0] ?? null,
    };
  }

  async findObservaciones(loteId: number) {
    await this.catalogoService.findLote(loteId);
    return await this.observacionesDe(loteId);
  }

  async createObservacion(
    loteId: number,
    dto: CreateObservacionDto,
    usuario: User,
  ) {
    const lote = await this.catalogoService.findLote(loteId);
    const hoy = hoyEnArgentina();
    if (dto.fecha > hoy) {
      throw new BadRequestException(
        'La fecha del monitoreo no puede ser futura',
      );
    }
    if (lote.fechaSiembra && dto.fecha < lote.fechaSiembra) {
      throw new BadRequestException(
        `La fecha del monitoreo no puede ser anterior a la siembra (${lote.fechaSiembra})`,
      );
    }
    if (dto.presencia && !dto.densidad) {
      throw new BadRequestException(
        'Si hay presencia de chinche, indique la densidad (chinches cada 20 golpes de paño, mayor a 0)',
      );
    }

    const seguimiento = await this.seguimientoAl(lote, dto.fecha);
    const observacion = await this.repository.save(ObservacionMonitoreo, {
      lote: { id: loteId },
      usuario: { id: usuario.id },
      fecha: dto.fecha,
      presencia: dto.presencia,
      densidad: dto.presencia ? dto.densidad : null,
      observaciones: dto.observaciones ?? null,
      ...seguimiento,
    });
    return await this.repository.findOne(ObservacionMonitoreo, {
      filters: { id: observacion.id },
    });
  }

  /** CU 06 2b: sin fecha de siembra no se pueden acumular grados dia. */
  private validarSiembra(lote: Lote): string {
    if (!lote.fechaSiembra) {
      throw new BadRequestException(
        `El lote ${lote.nombre} no tiene fecha de siembra: no hay información suficiente para calcular las fechas de monitoreo. Cárguela con PATCH /agro/lotes/${lote.id}`,
      );
    }
    if (lote.fechaSiembra > hoyEnArgentina()) {
      throw new BadRequestException(
        `El lote ${lote.nombre} todavía no fue sembrado (siembra prevista: ${lote.fechaSiembra})`,
      );
    }
    return lote.fechaSiembra;
  }

  private temperaturas(lote: Lote, desde: string, hasta: string) {
    return this.climateProvider.obtenerTemperaturas(
      Number(lote.provincia.latitud),
      Number(lote.provincia.longitud),
      desde,
      hasta,
    );
  }

  private async etapas(): Promise<EtapaReferencia[]> {
    const { data } = await this.catalogoService.findEtapas();
    return data.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      gddaMinimo: Number(e.gddaMinimo),
      gddaMaximo: Number(e.gddaMaximo),
      frecuenciaMonitoreo: e.frecuenciaMonitoreo,
      riesgoChinche: e.riesgoChinche,
    }));
  }

  /** De la mas reciente a la mas vieja. */
  private async observacionesDe(loteId: number) {
    const { data } = await this.repository.find(ObservacionMonitoreo, {
      filters: { 'lote.id': loteId },
      takeAll: true,
    });
    return data.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  }

  /**
   * GDDA y etapa al dia de la observacion, para el historial. Si el clima no
   * responde la observacion se guarda igual, sin esos datos.
   */
  private async seguimientoAl(lote: Lote, fecha: string) {
    if (!lote.fechaSiembra) return { gddaAcumulado: null, etapaEstimada: null };
    try {
      const [temperaturas, etapas] = await Promise.all([
        this.temperaturas(lote, lote.fechaSiembra, fecha),
        this.etapas(),
      ]);
      const gdda = temperaturas.reduce((total, t) => total + gradosDia(t), 0);
      return {
        gddaAcumulado: Math.round(gdda * 100) / 100,
        etapaEstimada: etapaPorGdda(etapas, gdda).nombre,
      };
    } catch (error) {
      this.logger.warn(
        `Observacion del lote ${lote.id} sin grados dia: ${(error as Error).message}`,
      );
      return { gddaAcumulado: null, etapaEstimada: null };
    }
  }
}
