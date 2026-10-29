import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import { hoyEnArgentina } from '../../common/utils/hoyEnArgentina.utils';
import { CreateCostoDto } from '../dto/create-costo.dto';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { PaginacionOpcionalDto } from '../dto/paginacion-opcional.dto';
import { CostoProduccion } from '../entities/costo-produccion.entity';
import { Lote } from '../entities/lote.entity';
import { PrecioSoja } from '../entities/precio-soja.entity';
import { CatalogoService } from '../services/catalogo.service';
import {
  calcularEconomia,
  rendimientoIndiferencia,
  ResultadoEconomico,
} from './calculo-economico';
import {
  PRECIO_SOJA_PROVIDER,
  type PrecioSojaProvider,
} from './precio-soja-provider.interface';

// La pizarra se publica una vez por dia: no hace falta consultarla en cada pedido.
const CACHE_PRECIO_MS = 60 * 60 * 1000;
// Si la fuente falla, se reintenta recien despues de este tiempo.
const CACHE_ERROR_MS = 5 * 60 * 1000;

const MAS_RECIENTE = { fecha: 'DESC', id: 'DESC' } as const;

export interface PrecioVigente {
  fecha: string;
  valor: number;
  moneda: string;
  valorPesos: number | null;
  tipoCambio: number | null;
  fuente: string;
  /** true si la fuente no respondio y se usa el ultimo precio guardado. */
  desactualizado: boolean;
  aviso: string | null;
}

const aNumero = (valor: number | string | null) =>
  valor === null ? null : Number(valor);

/**
 * Modulo economico (CU 04): precio de la soja, costos de produccion e
 * indicadores por lote (ingreso, costo, ganancia y rendimiento de
 * indiferencia). Solo para la gerencia.
 *
 * PENDIENTE E IMPORTANTE (CU 04): perdidas estimadas, costo de aplicacion y
 * comparacion de escenarios (actual vs. sugerido), a definir con sus calculos.
 */
@Injectable()
export class EconomicoService {
  private readonly logger = new Logger(EconomicoService.name);
  private cache: { precio: PrecioVigente; hasta: number } | null = null;

  constructor(
    private readonly repository: GenericQueryService,
    private readonly catalogoService: CatalogoService,
    @Inject(PRECIO_SOJA_PROVIDER) private readonly provider: PrecioSojaProvider,
  ) {}

  /**
   * Precio del dia desde la pizarra de Rosario; se guarda en precio_soja. Si
   * la pizarra no responde se usa el ultimo guardado y se avisa (CU 04, 2a).
   */
  async precioActual(): Promise<PrecioVigente> {
    if (this.cache && Date.now() < this.cache.hasta) return this.cache.precio;

    let precio: PrecioVigente;
    let vigenciaMs = CACHE_PRECIO_MS;
    try {
      const guardado = await this.guardarCotizacion();
      precio = {
        ...this.aPrecio(guardado),
        desactualizado: false,
        aviso: null,
      };
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error;
      const ultimo = await this.ultimoPrecioGuardado();
      if (!ultimo) {
        throw new ServiceUnavailableException(
          'No se pudo obtener el precio de la soja y no hay precios guardados.',
        );
      }
      precio = {
        ...this.aPrecio(ultimo),
        desactualizado: true,
        aviso: `No se pudo obtener el precio actualizado de la soja; se usa el ultimo guardado (${ultimo.fecha}). La informacion economica puede estar desactualizada.`,
      };
      vigenciaMs = CACHE_ERROR_MS;
    }
    this.cache = { precio, hasta: Date.now() + vigenciaMs };
    return precio;
  }

  /** Precios guardados, del mas reciente al mas viejo. */
  async historialPrecios(paginacion: PaginacionOpcionalDto) {
    const paginar = !!(paginacion.page || paginacion.limit);
    const resultado = await this.repository.find(PrecioSoja, {
      order: MAS_RECIENTE,
      takeAll: !paginar,
      page: paginacion.page,
      limit: paginacion.limit,
    });
    return paginar ? resultado : resultado.data;
  }

  /** Costos cargados, del mas reciente al mas viejo. */
  async findCostos() {
    const { data } = await this.repository.find(CostoProduccion, {
      order: { vigenciaDesde: 'DESC' },
      takeAll: true,
    });
    return data;
  }

  async createCosto(dto: CreateCostoDto): Promise<CostoProduccion> {
    const existente = await this.repository.findOne(CostoProduccion, {
      filters: { vigenciaDesde: dto.vigenciaDesde },
    });
    if (existente) {
      throw new ConflictException(
        `Ya hay un costo vigente desde ${dto.vigenciaDesde} (id= ${existente.id})`,
      );
    }
    return await this.repository.save(CostoProduccion, dto);
  }

  /** Indicadores economicos de un lote. */
  async analisisLote(loteId: number) {
    const lote = await this.catalogoService.findLote(loteId);
    const [precio, costo] = await Promise.all([
      this.precioActual(),
      this.costoVigente(),
    ]);
    return {
      precioSoja: precio,
      costoProduccion: costo,
      rendimientoIndiferencia: rendimientoIndiferencia(
        Number(costo.costoPorHectarea),
        precio.valor,
      ),
      ...this.analizar(lote, precio.valor, Number(costo.costoPorHectarea)),
    };
  }

  /**
   * Dashboard de la gerencia: indicadores de cada lote y totales. Los lotes
   * sin superficie o rendimiento se listan con lo que les falta (CU 04, 3a).
   */
  async dashboard(filtros: DashboardQueryDto) {
    const filters: Record<string, number> = {};
    if (filtros.campaniaId) filters['campania.id'] = filtros.campaniaId;
    if (filtros.provinciaId) filters['provincia.id'] = filtros.provinciaId;

    const [precio, costo, { data: lotes }] = await Promise.all([
      this.precioActual(),
      this.costoVigente(),
      this.repository.find(Lote, {
        filters,
        relations: ['provincia', 'campania'],
        takeAll: true,
      }),
    ]);
    const costoPorHectarea = Number(costo.costoPorHectarea);
    const analisis = lotes
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((lote) => this.analizar(lote, precio.valor, costoPorHectarea));

    const calculados = analisis.flatMap((a) =>
      a.indicadores ? [a.indicadores] : [],
    );
    const sumar = (
      campo:
        | 'produccionEstimada'
        | 'ingresoTotal'
        | 'costoTotal'
        | 'gananciaTotal',
    ) =>
      Math.round(calculados.reduce((total, i) => total + i[campo], 0) * 100) /
      100;
    const superficie = analisis.reduce(
      (total, a) => total + (a.indicadores ? (a.lote.superficie ?? 0) : 0),
      0,
    );
    const costoTotal = sumar('costoTotal');
    const gananciaTotal = sumar('gananciaTotal');

    const avisos: string[] = [];
    if (precio.aviso) avisos.push(precio.aviso);
    const incompletos = analisis.filter((a) => !a.indicadores).length;
    if (incompletos > 0) {
      avisos.push(
        `${incompletos} lote(s) sin superficie o rendimiento no se incluyen en los totales.`,
      );
    }

    return {
      precioSoja: precio,
      costoProduccion: costo,
      rendimientoIndiferencia: rendimientoIndiferencia(
        costoPorHectarea,
        precio.valor,
      ),
      totales: {
        lotesCalculados: calculados.length,
        lotesIncompletos: incompletos,
        superficie: Math.round(superficie * 100) / 100,
        produccionEstimada: sumar('produccionEstimada'),
        ingresoTotal: sumar('ingresoTotal'),
        costoTotal,
        gananciaTotal,
        rentabilidad:
          costoTotal > 0
            ? Math.round((gananciaTotal / costoTotal) * 10000) / 100
            : null,
        lotesConGanancia: calculados.filter(
          (i) => i.resultado === ResultadoEconomico.GANANCIA,
        ).length,
        lotesConPerdida: calculados.filter(
          (i) => i.resultado === ResultadoEconomico.PERDIDA,
        ).length,
      },
      lotes: analisis,
      avisos,
    };
  }

  private analizar(lote: Lote, precio: number, costoPorHectarea: number) {
    const superficie = aNumero(lote.superficie);
    const rendimiento = aNumero(lote.rendimiento);
    return {
      lote: {
        id: lote.id,
        nombre: lote.nombre,
        provincia: lote.provincia?.nombre ?? null,
        campania: lote.campania?.nombre ?? null,
        superficie,
        rendimiento,
      },
      ...calcularEconomia({
        superficie,
        rendimiento,
        precio,
        costoPorHectarea,
      }),
    };
  }

  /** El costo con la vigencia mas reciente que ya empezo. */
  private async costoVigente(): Promise<CostoProduccion> {
    const { data } = await this.repository.find(CostoProduccion, {
      filters: { vigenciaDesde__lte: hoyEnArgentina() },
      order: { vigenciaDesde: 'DESC' },
      page: 1,
      limit: 1,
    });
    if (!data[0]) {
      throw new ConflictException(
        'No hay un costo de produccion vigente. Carguelo con POST /agro/economico/costos.',
      );
    }
    return data[0];
  }

  /** Consulta la fuente y guarda el precio del dia (uno por fecha y fuente). */
  private async guardarCotizacion(): Promise<PrecioSoja> {
    const cotizacion = await this.provider.obtenerPrecio();
    const existente = await this.repository.findOne(PrecioSoja, {
      filters: { fecha: cotizacion.fecha, fuente: this.provider.nombre },
    });
    // La pizarra puede corregirse en el dia: se guarda el ultimo valor.
    const guardado = await this.repository.save(PrecioSoja, {
      ...(existente ? { id: existente.id } : {}),
      ...cotizacion,
      moneda: 'USD',
      fuente: this.provider.nombre,
    });
    this.logger.log(
      `Precio de la soja ${cotizacion.fecha}: US$ ${cotizacion.valor}/t`,
    );
    return guardado;
  }

  private async ultimoPrecioGuardado(): Promise<PrecioSoja | null> {
    const { data } = await this.repository.find(PrecioSoja, {
      order: MAS_RECIENTE,
      page: 1,
      limit: 1,
    });
    return data[0] ?? null;
  }

  private aPrecio(p: PrecioSoja) {
    return {
      fecha: p.fecha,
      valor: Number(p.valor),
      moneda: p.moneda,
      valorPesos: aNumero(p.valorPesos),
      tipoCambio: aNumero(p.tipoCambio),
      fuente: p.fuente,
    };
  }
}
