import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CotizacionSoja,
  PrecioSojaProvider,
} from './precio-soja-provider.interface';

const URL_POR_DEFECTO = 'https://www.cac.bcr.com.ar/es/precios-de-pizarra';
const TIMEOUT_POR_DEFECTO_MS = 8000;

const FECHA = /Precios Pizarra del d[ií]a\s+(\d{2})\/(\d{2})\/(\d{4})/i;
const SOJA = /Soja\s+\$\s*([\d.]+,\d+)\s+US\$\s*([\d.]+,\d+)/;
const TIPO_CAMBIO = /TC BNA Divisas\s+Comprador[^$]*\$\s*([\d.]+,\d+)/i;

/** "550.000,00" -> 550000 */
const numeroArgentino = (texto: string) =>
  Number(texto.replace(/\./g, '').replace(',', '.'));

/** Texto visible de la pagina, sin etiquetas ni espacios repetidos. */
const textoPlano = (html: string) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

/**
 * Lee el precio de la soja de la pizarra publica de la Camara Arbitral de
 * Cereales de la Bolsa de Comercio de Rosario. No hay API oficial: se toma
 * de la pagina. Si la soja figura "S/C" (sin cotizacion) o la pagina cambia
 * de formato, falla con 503.
 */
export function leerPizarra(html: string): CotizacionSoja {
  const texto = textoPlano(html);
  const fecha = FECHA.exec(texto);
  const soja = SOJA.exec(texto);
  if (!fecha || !soja) {
    throw new ServiceUnavailableException(
      'La pizarra de Rosario no informa el precio de la soja (sin cotizacion o la pagina cambio de formato).',
    );
  }
  const tipoCambio = TIPO_CAMBIO.exec(texto);
  return {
    fecha: `${fecha[3]}-${fecha[2]}-${fecha[1]}`,
    valor: numeroArgentino(soja[2]),
    valorPesos: numeroArgentino(soja[1]),
    tipoCambio: tipoCambio ? numeroArgentino(tipoCambio[1]) : null,
  };
}

@Injectable()
export class BcrPizarraProvider implements PrecioSojaProvider {
  readonly nombre = 'Pizarra Rosario (Camara Arbitral BCR)';
  private readonly logger = new Logger(BcrPizarraProvider.name);
  private readonly url: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    this.url = configService.get<string>('PRECIO_SOJA_URL') || URL_POR_DEFECTO;
    this.timeoutMs =
      Number(configService.get<string>('PRECIO_SOJA_TIMEOUT_MS')) ||
      TIMEOUT_POR_DEFECTO_MS;
  }

  async obtenerPrecio(): Promise<CotizacionSoja> {
    let html: string;
    try {
      const res = await fetch(this.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (SID-Agro)' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar la pizarra: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'No se pudo consultar el precio de la soja en la Bolsa de Comercio de Rosario.',
      );
    }
    return leerPizarra(html);
  }
}
