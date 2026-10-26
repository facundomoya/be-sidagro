import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClimateProvider,
  PronosticoDiario,
} from './climate-provider.interface';
import { estadoCieloDesdeWmo } from './estado-cielo';

const URL_POR_DEFECTO = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_POR_DEFECTO_MS = 8000;
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

type VariableDiaria = (typeof VARIABLES_DIARIAS)[number];

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
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    // || y no ??: una variable vacia en .env debe usar el valor por defecto.
    this.url = configService.get<string>('OPEN_METEO_URL') || URL_POR_DEFECTO;
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

    let respuesta: OpenMeteoRespuesta;
    try {
      const res = await fetch(`${this.url}?${params.toString()}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      respuesta = (await res.json()) as OpenMeteoRespuesta;
      if (!res.ok || respuesta.error) {
        throw new Error(respuesta.reason ?? `HTTP ${res.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `Fallo la consulta a Open-Meteo: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'No fue posible obtener los datos climaticos actualizados. Intente nuevamente o cargue el clima de forma manual.',
      );
    }

    return this.normalizar(respuesta, dias);
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
