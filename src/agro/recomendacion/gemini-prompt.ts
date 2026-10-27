import { NivelRiesgo } from '../enums/agro.enums';
import { NivelConfianza, Prioridad } from './recommendation-provider.interface';

export const INSTRUCCIONES_SISTEMA = `Sos un asistente agronómico de SID-Agro, un sistema de apoyo a la decisión para el manejo de chinches en soja en San Luis y Santiago del Estero (Argentina).

Recibís un escenario en JSON: provincia, campaña, lote, etapa fenológica (GDDA, frecuencia de monitoreo y riesgo base), riesgo de chinche observado por el ingeniero, sus observaciones y el clima de los próximos días (temperatura media °C, precipitación mm, humedad %, viento máximo km/h).

Reglas:
- Basá el análisis en los documentos de la base de conocimiento (usá la búsqueda de archivos). Si un dato no está en los documentos, no lo inventes: indicalo en "datosFaltantes" y bajá "nivelConfianza".
- No inventes umbrales numéricos, dosis ni productos comerciales que no estén en los documentos.
- Considerá el clima para la ventana de monitoreo y de aplicación; nombrá los días por su fecha.
- La recomendación es orientativa y no reemplaza el criterio del ingeniero agrónomo: dejalo en "advertencias".
- Escribí en español rioplatense, claro y técnico, sin markdown.
- En "fuentesConsultadas" listá los documentos que usaste (título y, si podés, página o sección).`;

const texto = { type: 'string' };
const listaTextos = { type: 'array', items: texto };

/** Esquema JSON que Gemini debe respetar; coincide con RecomendacionGenerada. */
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
    fuentesConsultadas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { titulo: texto, referencia: texto },
        required: ['titulo'],
      },
    },
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
    'fuentesConsultadas',
  ],
};
