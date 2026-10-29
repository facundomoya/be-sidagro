import { Lote } from '../entities/lote.entity';
import { ubicacionClima } from './monitoreo.service';

const provincia = {
  nombre: 'Santiago del Estero',
  latitud: '-27.795100',
  longitud: '-64.261500',
};

describe('ubicacionClima', () => {
  it('usa las coordenadas del departamento del lote', () => {
    const lote = {
      provincia,
      departamento: {
        nombre: 'Copo',
        latitud: '-25.939161',
        longitud: '-62.731097',
      },
    } as unknown as Lote;
    expect(ubicacionClima(lote)).toEqual({
      origen: 'DEPARTAMENTO',
      nombre: 'Copo',
      latitud: -25.939161,
      longitud: -62.731097,
    });
  });

  it('sin departamento usa la capital de la provincia', () => {
    const lote = { provincia, departamento: null } as unknown as Lote;
    expect(ubicacionClima(lote)).toEqual({
      origen: 'CAPITAL',
      nombre: 'Capital de Santiago del Estero',
      latitud: -27.7951,
      longitud: -64.2615,
    });
  });
});
