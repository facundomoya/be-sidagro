import {
  calcularEconomia,
  rendimientoIndiferencia,
  ResultadoEconomico,
} from './calculo-economico';

describe('calculo economico', () => {
  it('rendimiento de indiferencia: 925 US$/ha a 358 US$/t son 2,58 t/ha (25,8 qq/ha)', () => {
    expect(rendimientoIndiferencia(925, 358)).toBe(2.58);
  });

  it('calcula ingreso, costo y ganancia por hectarea y del lote', () => {
    const { indicadores, faltantes } = calcularEconomia({
      superficie: 80,
      rendimiento: 3.2,
      precio: 359.71,
      costoPorHectarea: 925,
    });
    expect(faltantes).toEqual([]);
    expect(indicadores).toEqual({
      produccionEstimada: 256,
      ingresoPorHectarea: 1151.07,
      costoPorHectarea: 925,
      gananciaPorHectarea: 226.07,
      ingresoTotal: 92085.76,
      costoTotal: 74000,
      gananciaTotal: 18085.76,
      rentabilidad: 24.44,
      resultado: ResultadoEconomico.GANANCIA,
    });
  });

  it('marca perdida si el rendimiento no cubre los costos', () => {
    const { indicadores } = calcularEconomia({
      superficie: 100,
      rendimiento: 2,
      precio: 358,
      costoPorHectarea: 925,
    });
    expect(indicadores?.gananciaPorHectarea).toBe(-209);
    expect(indicadores?.gananciaTotal).toBe(-20900);
    expect(indicadores?.resultado).toBe(ResultadoEconomico.PERDIDA);
  });

  it('sin superficie o rendimiento no calcula e informa que falta', () => {
    expect(
      calcularEconomia({
        superficie: null,
        rendimiento: null,
        precio: 358,
        costoPorHectarea: 925,
      }),
    ).toEqual({ indicadores: null, faltantes: ['superficie', 'rendimiento'] });
  });
});
