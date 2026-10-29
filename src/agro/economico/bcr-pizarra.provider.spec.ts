import { ServiceUnavailableException } from '@nestjs/common';
import { leerPizarra } from './bcr-pizarra.provider';

// Recorte del HTML real de la pizarra (27/10/2026).
const html = (soja: string) => `
<div class="board-prices">
  <h3>Precios Pizarra del día 27/10/2026</h3>
  <div class="board board-trigo"><h3><span class="icon"></span> Trigo </h3>
    <div class="price"> $323.000,00 </div>
    <div class="cell"><strong>US$</strong> 211,25</div></div>
  <div class="board board-soja"><h3><span class="icon"></span> Soja </h3>
    ${soja}</div>
  <strong>TC BNA Divisas</strong> Comprador 27/10/2026: <strong>$ 1.529,00</strong>
</div>`;

describe('leerPizarra', () => {
  it('toma fecha, precio en dolares y pesos y tipo de cambio de la soja', () => {
    const cotizacion = leerPizarra(
      html(
        '<div class="price"> $550.000,00 </div><div class="cell"><strong>US$</strong> 359,71</div>',
      ),
    );
    expect(cotizacion).toEqual({
      fecha: '2026-10-27',
      valor: 359.71,
      valorPesos: 550000,
      tipoCambio: 1529,
    });
  });

  it('falla con 503 si la soja esta sin cotizacion', () => {
    expect(() => leerPizarra(html('<div class="price"> S/C </div>'))).toThrow(
      ServiceUnavailableException,
    );
  });

  it('falla con 503 si la pagina cambio de formato', () => {
    expect(() => leerPizarra('<html>Mantenimiento</html>')).toThrow(
      ServiceUnavailableException,
    );
  });
});
