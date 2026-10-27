import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenMeteoProvider } from './open-meteo.provider';

const respuestaOk = {
  daily: {
    time: ['2026-10-26', '2026-10-27'],
    temperature_2m_mean: [14.73, 14.1],
    precipitation_sum: [1.5, 8.8],
    relative_humidity_2m_mean: [65, 81],
    wind_speed_10m_max: [17.8, 13],
    precipitation_probability_max: [16, 86],
    weather_code: [3, 81],
  },
};

const mockFetch = (body: unknown, ok = true) =>
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => body,
  } as unknown as Response);

describe('OpenMeteoProvider', () => {
  const provider = new OpenMeteoProvider({
    get: () => undefined,
  } as unknown as ConfigService);

  afterEach(() => jest.restoreAllMocks());

  it('normaliza el pronostico diario al formato de la simulacion', async () => {
    const fetchSpy = mockFetch(respuestaOk);

    const serie = await provider.obtenerPronostico(-33.3, -66.33, 2);

    expect(serie).toEqual([
      {
        fecha: '2026-10-26',
        temperatura: 14.73,
        precipitacion: 1.5,
        humedad: 65,
        viento: 17.8,
        probabilidadLluvia: 16,
        estadoCielo: { codigo: 3, descripcion: 'Nublado', icono: 'nublado' },
      },
      {
        fecha: '2026-10-27',
        temperatura: 14.1,
        precipitacion: 8.8,
        humedad: 81,
        viento: 13,
        probabilidadLluvia: 86,
        estadoCielo: {
          codigo: 81,
          descripcion: 'Chaparrones moderados',
          icono: 'chaparrones',
        },
      },
    ]);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('latitude=-33.3');
    expect(url).toContain('forecast_days=2');
  });

  it('sin codigo de clima devuelve icono desconocido en vez de fallar', async () => {
    mockFetch({
      daily: {
        ...respuestaOk.daily,
        weather_code: [null, 42],
        precipitation_probability_max: [null, null],
      },
    });

    const serie = await provider.obtenerPronostico(-33.3, -66.33, 2);

    expect(serie.map((d) => d.estadoCielo.icono)).toEqual([
      'desconocido',
      'desconocido',
    ]);
    expect(serie[0].probabilidadLluvia).toBeNull();
  });

  it('responde 503 si faltan valores en la respuesta', async () => {
    mockFetch({
      daily: { ...respuestaOk.daily, precipitation_sum: [1.5, null] },
    });

    await expect(
      provider.obtenerPronostico(-33.3, -66.33, 2),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('responde 503 si devuelve menos dias de los pedidos', async () => {
    mockFetch(respuestaOk);

    await expect(
      provider.obtenerPronostico(-33.3, -66.33, 5),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('responde 503 ante un error de la API', async () => {
    mockFetch({ error: true, reason: 'Latitude must be in range' }, false);

    await expect(provider.obtenerPronostico(999, 0, 2)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('responde 503 si no hay conexion o se agota el tiempo', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('timeout'));

    await expect(
      provider.obtenerPronostico(-33.3, -66.33, 2),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
