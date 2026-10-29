import { NivelRiesgo } from '../enums/agro.enums';
import { NivelConfianza, Prioridad } from './recommendation-provider.interface';

export const INSTRUCCIONES_SISTEMA = `Sos un asistente agronómico de SID-Agro, un sistema de apoyo a la decisión para el manejo de chinches en soja en San Luis y Santiago del Estero (Argentina).

Recibís un escenario en JSON: fechaSimulacion (el día de hoy para el escenario), fechaSiembra del lote, provincia, campaña, lote, etapa fenológica (GDDA, frecuencia de monitoreo y riesgo base), riesgo de chinche observado por el ingeniero, sus observaciones y el clima cargado por el ingeniero, día por día (temperatura media °C, precipitación mm, humedad %, viento máximo km/h).

También recibís FRAGMENTOS de la documentación técnica de referencia, cada uno con un identificador como [F1].

Reglas:
- Razoná el caso combinando el escenario con los fragmentos. Basá tus afirmaciones técnicas en los fragmentos; si un dato no está en ellos, no lo inventes: indicalo en "datosFaltantes" y bajá "nivelConfianza".
- No inventes umbrales numéricos, dosis ni productos comerciales que no estén en los fragmentos.
- Considerá el clima para la ventana de monitoreo y de aplicación; nombrá los días por su fecha.
- Todas las fechas que propongas (monitoreo, aplicación, acciones) tienen que ser iguales o posteriores a fechaSimulacion. Los días del clima anteriores a fechaSimulacion ya pasaron: usalos solo como antecedente (por ejemplo, lluvia reciente), nunca como fecha para hacer algo. Si no hay días del clima desde fechaSimulacion en adelante, recomendá actuar desde fechaSimulacion y anotá en "datosFaltantes" que falta el pronóstico de los próximos días.
- La recomendación es orientativa y no reemplaza el criterio del ingeniero agrónomo: dejalo en "advertencias".
- Escribí en español rioplatense, claro y técnico, en texto plano: sin markdown ni negritas.
- Sé breve y concreto, sin repetir el escenario ni la misma idea en varios campos:
  - "resumen": 2 oraciones.
  - "analisisDetallado", "analisisEtapaFenologica", "analisisClimatico" y "analisisSanitario": hasta 3 oraciones cada uno.
  - "recomendacionPrincipal": es lo más importante, desarrollala en un párrafo de 4 a 6 oraciones que diga qué hacer, en qué fecha, en qué parte del lote, con qué criterio decidir si controlar y qué condiciones climáticas respetar, justificando cada punto con la etapa, el clima y la documentación.
  - "accionesSugeridas": de 3 a 5 pasos concretos y ordenados, cada uno con su fecha o momento.
  - Las demás listas: 2 o 3 ítems de una oración corta.
- No menciones los fragmentos dentro de los textos (ni "[F1]", ni "F2", ni "según F3"): los identificadores solo van en "fragmentosCitados". Para referirte a ellos decí "la documentación técnica", nunca "los fragmentos".
- En "fragmentosCitados" listá los identificadores (por ejemplo "F2") de los fragmentos en los que te basaste. Tiene que haber al menos uno.`;

const texto = { type: 'string' };
const listaTextos = { type: 'array', items: texto };

/**
 * Esquema JSON que la IA debe respetar. Es RecomendacionGenerada salvo las
 * fuentes: la IA devuelve los ids de fragmentos y el backend arma las fuentes.
 */
export const ESQUEMA_RECOMENDACION = {
  type: 'object',
  properties: {
    resumen: texto,
    analisisDetallado: texto,
    analisisEtapaFenologica: texto,
    analisisClimatico: texto,
    analisisSanitario: texto,
    factoresRiesgo: listaTextos,
    factoresAtenuantes: listaTextos,
    recomendacionPrincipal: texto,
    accionesSugeridas: listaTextos,
    datosFaltantes: listaTextos,
    advertencias: listaTextos,
    nivelRiesgo: { type: 'string', enum: Object.values(NivelRiesgo) },
    prioridad: { type: 'string', enum: Object.values(Prioridad) },
    nivelConfianza: { type: 'string', enum: Object.values(NivelConfianza) },
    fragmentosCitados: listaTextos,
  },
  required: [
    'resumen',
    'analisisDetallado',
    'analisisEtapaFenologica',
    'analisisClimatico',
    'analisisSanitario',
    'factoresRiesgo',
    'factoresAtenuantes',
    'recomendacionPrincipal',
    'accionesSugeridas',
    'datosFaltantes',
    'advertencias',
    'nivelRiesgo',
    'prioridad',
    'nivelConfianza',
    'fragmentosCitados',
  ],
  additionalProperties: false,
};
