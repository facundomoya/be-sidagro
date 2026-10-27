import { SimulacionEscenario } from '../entities/simulacion-escenario.entity';
import { ContextoEscenario } from './recommendation-provider.interface';

/**
 * Arma el contexto desde el escenario guardado (con lote.provincia,
 * lote.campania, etapa y datosClimaticos cargados). Usa los valores
 * copiados en la simulacion, no los actuales de la etapa.
 */
export function construirContexto(
  simulacion: SimulacionEscenario,
): ContextoEscenario {
  const clima = [...simulacion.datosClimaticos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((dia) => ({
      fecha: dia.fecha,
      temperatura: Number(dia.temperatura),
      precipitacion: Number(dia.precipitacion),
      humedad: Number(dia.humedad),
      viento: Number(dia.viento),
    }));

  return {
    provincia: simulacion.lote.provincia.nombre,
    campania: simulacion.lote.campania.nombre,
    lote: simulacion.lote.nombre,
    etapa: {
      nombre: simulacion.etapa.nombre,
      gddaMinimo: Number(simulacion.gddaMinimoUtilizado),
      gddaMaximo: Number(simulacion.gddaMaximoUtilizado),
      frecuenciaMonitoreo: simulacion.frecuenciaMonitoreoUtilizada,
      riesgoBase: simulacion.riesgoEtapaUtilizado,
    },
    riesgoObservado: simulacion.riesgoPlaga,
    observaciones: simulacion.observaciones,
    fuenteClimatica: simulacion.fuenteClimatica,
    proveedorClimatico: simulacion.datosClimaticos[0]?.proveedor ?? null,
    clima,
  };
}
