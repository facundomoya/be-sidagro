import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClimateProvider,
  PronosticoDiario,
  TemperaturaDiaria,
} from './climate-provider.interface';
import { estadoCieloDesdeWmo } from './estado-cielo';

const URL_POR_DEFECTO = 'https://api.open-meteo.com/v1/forecast';
// El pronostico comun solo llega unos 90 dias atras; este cubre toda la campania.
const URL_HISTORICO_POR_DEFECTO =
  'https://historical-forecast-api.open-meteo.com/v1/forecast';
const TIMEOUT_POR_DEFECTO_MS = 8000;
const VARIABLES_TEMPERATURA = [
  'temperature_2m_max',
  'temperature_2m_min',
] as const;
const VARIABLES_DIARIAS = [
  'temperature_2m_mean',
  'precipitation_sum',
  'relative_humidity_2m_mean',
  'wind_speed_10m_max',
  'precipitation_probability_max',
  'weather_code',
] as const;

// Sin estas variables el dia no sirve para simular; las demas son opcionales.
const OBLIGATORIAS = [
  'temperatura',
  'precipitacion',
  'humedad',
  'viento',
] as const;

type VariableDiaria =
  | (typeof VARIABLES_DIARIAS)[number]
  | (typeof VARIABLES_TEMPERATURA)[number];

interface OpenMeteoRespuesta {
  error?: boolean;
  reason?: string;
  daily?: { time?: string[] } & Partial<
    Record<VariableDiaria, (number | null)[]>
  >;
}

/**
 * Pronostico diario de Open-Meteo (sin API key). Unidades: °C, mm, %, km/h.
 * Open-Meteo no devuelve imagenes: el estado del cielo llega como codigo WMO
 * y se traduce a una clave de icono (ver estado-cielo.ts).
 */
@Injectable()
export class OpenMeteoProvider implements ClimateProvider {
  readonly nombre = 'Open-Meteo';
  private readonly logger = new Logger(OpenMeteoProvider.name);
  private readonly url: string;
  private readonly urlHistorico: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    // || y no ??: una variable vacia en .env debe usar el valor por defecto.
    this.url = configService.get<string>('OPEN_METEO_URL') || URL_POR_DEFECTO;
    this.urlHistorico =
      configService.get<string>('OPEN_METEO_HISTORICO_URL') ||
      URL_HISTORICO_POR_DEFECTO;
    this.timeoutMs =
      Number(configService.get<string>('OPEN_METEO_TIMEOUT_MS')) ||
      TIMEOUT_POR_DEFECTO_MS;
  }

  async obtenerPronostico(
    latitud: number,
    longitud: number,
    dias: number,
  ): Promise<PronosticoDiario[]> {
    const params = new URLSearchParams({
      latitude: String(latitud),
      longitude: String(longitud),
      daily: VARIABLES_DIARIAS.join(','),
      timezone: 'America/Argentina/Buenos_Aires',
      forecast_days: String(dias),
    });

    const respuesta = await this.consultar(this.url, params);
    return this.normalizar(respuesta, dias);
  }

  async obtenerTemperaturas(
    latitud: number,
    longitud: number,
    desde: string,
    hasta: string,
  ): Promise<TemperaturaDiaria[]> {
    const params = new URLSearchParams({
      latitude: String(latitud),
      longitude: String(longitud),
      daily: VARIABLES_TEMPERATURA.join(','),
      timezone: 'America/Argentina/Buenos_Aires',
      start_date: desde,
      end_date: hasta,
    });
    const { daily } = await this.consultar(this.urlHistorico, params);

    const fechas = daily?.time ?? [];
    const serie: TemperaturaDiaria[] = [];
    fechas.forEach((fecha, i) => {
      const maxima = daily?.temperature_2m_max?.[i];
      const minima = daily?.temperature_2m_min?.[i];
      // Los ultimos dias del pronostico pueden venir vacios: se cortan ahi.
      if (typeof maxima === 'number' && typeof minima === 'number') {
        serie.push({ fecha, maxima, minima });
      }
    });
    if (serie.length === 0) {
      throw new ServiceUnavailableException(
        'Open-Meteo no devolvio temperaturas para el periodo del cultivo.',
      );
    }
    return serie;
  }

  private async consultar(
    url: string,
    params: URLSearchParams,
  ): Promise<OpenMeteoRespuesta> {
    try {
      const res = await fetch(`${url}?${params.toString()}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const respuesta = (await res.json()) as OpenMeteoRespuesta;
      if (!res.ok || respuesta.error) {
        throw new Error(respuesta.reason ?? `HTTP ${res.status}`);
      }
      return respuesta;
    } catch (error) {
      this.logger.warn(
        `Fallo la consulta a Open-Meteo: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'No fue posible obtener los datos climaticos actualizados. Intente nuevamente o cargue el clima de forma manual.',
      );
    }
  }

  private normalizar(
    respuesta: OpenMeteoRespuesta,
    dias: number,
  ): PronosticoDiario[] {
    const daily = respuesta.daily;
    const fechas = daily?.time ?? [];
    const valor = (variable: VariableDiaria, i: number) => {
      const v = daily?.[variable]?.[i];
      return typeof v === 'number' ? Math.round(v * 100) / 100 : null;
    };

    const serie = fechas.slice(0, dias).map((fecha, i) => ({
      fecha,
      temperatura: valor('temperature_2m_mean', i),
      precipitacion: valor('precipitation_sum', i),
      humedad: valor('relative_humidity_2m_mean', i),
      viento: valor('wind_speed_10m_max', i),
      probabilidadLluvia: valor('precipitation_probability_max', i),
      estadoCielo: estadoCieloDesdeWmo(valor('weather_code', i)),
    }));

    const incompleto =
      serie.length < dias ||
      serie.some((dia) => OBLIGATORIAS.some((campo) => dia[campo] === null));
    if (incompleto) {
      throw new ServiceUnavailableException(
        'Open-Meteo devolvio datos climaticos incompletos. Cargue el clima de forma manual.',
      );
    }

    return serie as PronosticoDiario[];
  }
}
