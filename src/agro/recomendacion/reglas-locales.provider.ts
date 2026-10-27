import { Injectable } from '@nestjs/common';
import { NivelRiesgo } from '../enums/agro.enums';
import {
  ContextoEscenario,
  NivelConfianza,
  Prioridad,
  RecomendacionGenerada,
  RecommendationProvider,
} from './recommendation-provider.interface';

// Umbrales PROVISIONALES para una ventana de aplicacion; deben ser validados
// por el ingeniero agronomo, igual que la parametrizacion de etapas.
export const VIENTO_MAX_APLICACION_KMH = 15;
export const LLUVIA_MAX_APLICACION_MM = 2;
export const TEMPERATURA_MAX_APLICACION_C = 30;

const ORDEN_RIESGO: string[] = [
  NivelRiesgo.MUY_BAJO,
  NivelRiesgo.BAJO,
  NivelRiesgo.MODERADO,
  NivelRiesgo.ALTO,
  NivelRiesgo.MUY_ALTO,
];

const indiceRiesgo = (riesgo: string) =>
  Math.max(
    0,
    ORDEN_RIESGO.findIndex((r) => r.toLowerCase() === riesgo.toLowerCase()),
  );

/**
 * Recomendacion por reglas fijas. Sirve para probar el flujo completo sin IA
 * y como respaldo cuando la IA no esta disponible.
 */
@Injectable()
export class ReglasLocalesProvider implements RecommendationProvider {
  readonly modelo = 'reglas-locales';

  generar(contexto: ContextoEscenario): Promise<RecomendacionGenerada> {
    const { etapa, clima } = contexto;
    const iBase = indiceRiesgo(etapa.riesgoBase);
    const iObservado = indiceRiesgo(contexto.riesgoObservado);
    // Manda el mayor: el riesgo tipico de la etapa o lo que se vio en el campo.
    const nivelRiesgo = ORDEN_RIESGO[
      Math.max(iBase, iObservado)
    ] as NivelRiesgo;
    const iFinal = Math.max(iBase, iObservado);
    const prioridad =
      iFinal >= 3
        ? Prioridad.ALTA
        : iFinal === 2
          ? Prioridad.MEDIA
          : Prioridad.BAJA;

    const diasAptos = clima.filter(
      (d) =>
        d.viento <= VIENTO_MAX_APLICACION_KMH &&
        d.precipitacion < LLUVIA_MAX_APLICACION_MM &&
        d.temperatura <= TEMPERATURA_MAX_APLICACION_C,
    );
    const lluviaTotal = clima.reduce((t, d) => t + d.precipitacion, 0);
    const diasConLluvia = clima.filter(
      (d) => d.precipitacion >= LLUVIA_MAX_APLICACION_MM,
    );
    const diasVentosos = clima.filter(
      (d) => d.viento > VIENTO_MAX_APLICACION_KMH,
    );
    const ventana = diasAptos.map((d) => d.fecha).join(', ');

    const factoresRiesgo: string[] = [];
    const factoresAtenuantes: string[] = [];
    if (iBase >= 3) {
      factoresRiesgo.push(
        `${etapa.nombre} es una etapa de riesgo ${etapa.riesgoBase.toLowerCase()} para chinche verde.`,
      );
    } else {
      factoresAtenuantes.push(
        `${etapa.nombre} tiene riesgo base ${etapa.riesgoBase.toLowerCase()}.`,
      );
    }
    if (iObservado > iBase) {
      factoresRiesgo.push(
        `El riesgo observado en el campo (${contexto.riesgoObservado}) supera el típico de la etapa.`,
      );
    } else if (iObservado < iBase) {
      factoresAtenuantes.push(
        `El riesgo observado (${contexto.riesgoObservado}) es menor que el típico de la etapa.`,
      );
    }
    if (diasVentosos.length > 0) {
      factoresRiesgo.push(
        `${diasVentosos.length} día(s) con viento mayor a ${VIENTO_MAX_APLICACION_KMH} km/h dificultan una aplicación.`,
      );
    }
    if (diasConLluvia.length > 0) {
      factoresRiesgo.push(
        `${diasConLluvia.length} día(s) con lluvia de ${LLUVIA_MAX_APLICACION_MM} mm o más pueden lavar un producto aplicado.`,
      );
    }
    if (diasAptos.length > 0) {
      factoresAtenuantes.push(
        `${diasAptos.length} día(s) con condiciones aptas para aplicar.`,
      );
    }

    const sinMonitoreo = /no se recomienda/i.test(etapa.frecuenciaMonitoreo);
    const accionesSugeridas: string[] = [
      sinMonitoreo
        ? 'No se requiere monitoreo sistemático de chinche en esta etapa.'
        : `Monitorear el lote ${etapa.frecuenciaMonitoreo.toLowerCase()}.`,
    ];
    let recomendacionPrincipal: string;
    if (iFinal >= 3) {
      recomendacionPrincipal =
        'Muestrear el lote para estimar la densidad de chinches y evaluar una aplicación de insecticida si se supera el umbral de daño.';
      accionesSugeridas.push(
        'Realizar muestreo con paño vertical y registrar la densidad observada.',
        ventana
          ? `Si corresponde aplicar, hacerlo en los días aptos: ${ventana}.`
          : 'No hay días aptos para aplicar en el período analizado: postergar y reevaluar con un nuevo pronóstico.',
      );
    } else if (iFinal === 2) {
      recomendacionPrincipal =
        'Intensificar el monitoreo para detectar a tiempo un aumento de la población.';
      accionesSugeridas.push(
        'Registrar la densidad observada en cada monitoreo.',
      );
    } else {
      recomendacionPrincipal =
        'Mantener el monitoreo de rutina; no se justifica una aplicación.';
    }

    const datosFaltantes = [
      'Densidad de chinches por metro lineal (el escenario solo registra un nivel de riesgo).',
      'Umbral de daño económico validado para el lote.',
    ];
    if (!contexto.observaciones) {
      datosFaltantes.push('Observaciones de campo del ingeniero.');
    }

    const advertencias = [
      'Recomendación generada por reglas locales provisionales: no reemplaza el criterio del ingeniero agrónomo.',
    ];
    if (contexto.proveedorClimatico) {
      advertencias.push(
        `El pronóstico de ${contexto.proveedorClimatico} corresponde a la capital de ${contexto.provincia} y puede diferir de las condiciones del lote.`,
      );
    }

    const analisisEtapaFenologica = `${etapa.nombre}: GDDA entre ${etapa.gddaMinimo} y ${etapa.gddaMaximo}, monitoreo ${etapa.frecuenciaMonitoreo.toLowerCase()}, riesgo base ${etapa.riesgoBase.toLowerCase()}.`;
    const analisisClimatico = `${clima.length} día(s) analizados (${contexto.fuenteClimatica}): ${lluviaTotal.toFixed(1)} mm de lluvia acumulada, viento máximo ${Math.max(...clima.map((d) => d.viento))} km/h, ${diasAptos.length} día(s) aptos para aplicar.`;
    const analisisSanitario = `Riesgo observado ${contexto.riesgoObservado.toLowerCase()} frente a un riesgo base ${etapa.riesgoBase.toLowerCase()}; se toma el mayor: ${nivelRiesgo.toLowerCase()}.`;

    return Promise.resolve({
      resumen: `Riesgo ${nivelRiesgo.toLowerCase()} de chinche verde en ${contexto.lote} (${etapa.nombre}). ${recomendacionPrincipal}`,
      analisisDetallado: [
        analisisEtapaFenologica,
        analisisSanitario,
        analisisClimatico,
      ].join(' '),
      analisisEtapaFenologica,
      analisisClimatico,
      analisisSanitario,
      factoresRiesgo,
      factoresAtenuantes,
      recomendacionPrincipal,
      accionesSugeridas,
      datosFaltantes,
      advertencias,
      nivelRiesgo,
      prioridad,
      nivelConfianza: NivelConfianza.BAJO,
      fuentesConsultadas: [
        { titulo: 'Parametrización fenológica provisional de SID-Agro' },
        { titulo: 'Reglas locales provisionales de SID-Agro (sin validar)' },
      ],
    });
  }
}
