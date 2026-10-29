import { NivelRiesgo } from '../enums/agro.enums';
import { NivelConfianza, Prioridad } from './recommendation-provider.interface';

const TEXTOS = [
  'resumen',
  'analisisDetallado',
  'analisisEtapaFenologica',
  'analisisClimatico',
  'analisisSanitario',
  'recomendacionPrincipal',
] as const;

const LISTAS = [
  'factoresRiesgo',
  'factoresAtenuantes',
  'accionesSugeridas',
  'datosFaltantes',
  'advertencias',
] as const;

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
// 2026-10-27 | 27/10/2026 | 27/10 | 27 de octubre (de 2026)
const FECHA_EN_TEXTO = new RegExp(
  String.raw`\b(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b|\b(\d{1,2}) de (${MESES.join('|')})(?: de (\d{4}))?`,
  'gi',
);

const iso = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/**
 * Fechas de un texto anteriores a fechaMinima (YYYY-MM-DD). Sin anio se toma
 * el de fechaMinima, o el siguiente si la fecha quedaria medio anio antes
 * (en diciembre, "2 de enero" es del anio que viene).
 */
export function fechasAnteriores(texto: string, fechaMinima: string): string[] {
  const anioBase = Number(fechaMinima.slice(0, 4));
  const encontradas: string[] = [];
  for (const m of texto.matchAll(FECHA_EN_TEXTO)) {
    let fecha: string;
    if (m[1]) {
      fecha = `${m[1]}-${m[2]}-${m[3]}`;
    } else {
      const dia = Number(m[4] ?? m[7]);
      const mes = m[5] ? Number(m[5]) : MESES.indexOf(m[8].toLowerCase()) + 1;
      const anio = m[6] ?? m[9];
      if (mes < 1 || mes > 12 || dia < 1 || dia > 31) continue;
      fecha = iso(anio ? Number(anio) : anioBase, mes, dia);
      const atrasoDias =
        (Date.parse(fechaMinima) - Date.parse(fecha)) / 86_400_000;
      if (!anio && atrasoDias > 180) fecha = iso(anioBase + 1, mes, dia);
    }
    if (fecha < fechaMinima) encontradas.push(fecha);
  }
  return encontradas;
}

/**
 * Verifica la estructura antes de guardarla. Pensado sobre todo para la IA,
 * cuya respuesta no esta garantizada. Devuelve la lista de problemas (vacia = valida).
 */
export function validarRecomendacion(
  valor: unknown,
  fechaSimulacion?: string,
): string[] {
  if (!valor || typeof valor !== 'object') {
    return ['La recomendacion no es un objeto'];
  }
  const r = valor as Record<string, unknown>;
  const errores: string[] = [];

  for (const campo of TEXTOS) {
    if (typeof r[campo] !== 'string' || !r[campo].trim()) {
      errores.push(`${campo} debe ser un texto no vacio`);
    }
  }
  for (const campo of LISTAS) {
    const lista = r[campo];
    if (!Array.isArray(lista) || lista.some((x) => typeof x !== 'string')) {
      errores.push(`${campo} debe ser una lista de textos`);
    }
  }
  if (!Object.values(NivelRiesgo).includes(r.nivelRiesgo as NivelRiesgo)) {
    errores.push('nivelRiesgo no es un valor valido');
  }
  if (!Object.values(Prioridad).includes(r.prioridad as Prioridad)) {
    errores.push('prioridad no es un valor valido');
  }
  if (
    !Object.values(NivelConfianza).includes(r.nivelConfianza as NivelConfianza)
  ) {
    errores.push('nivelConfianza no es un valor valido');
  }
  const fuentes = r.fuentesConsultadas;
  if (
    !Array.isArray(fuentes) ||
    fuentes.some(
      (f) =>
        !f ||
        typeof f !== 'object' ||
        typeof (f as Record<string, unknown>).titulo !== 'string',
    )
  ) {
    errores.push('fuentesConsultadas debe ser una lista de { titulo }');
  }
  // Cada accion lleva su fecha: ninguna puede haber pasado ya.
  if (fechaSimulacion && Array.isArray(r.accionesSugeridas)) {
    const pasadas = (r.accionesSugeridas as unknown[])
      .filter((a): a is string => typeof a === 'string')
      .flatMap((a) => fechasAnteriores(a, fechaSimulacion));
    if (pasadas.length > 0) {
      errores.push(
        `accionesSugeridas propone fechas anteriores a la simulacion (${fechaSimulacion}): ${[...new Set(pasadas)].join(', ')}`,
      );
    }
  }
  return errores;
}
