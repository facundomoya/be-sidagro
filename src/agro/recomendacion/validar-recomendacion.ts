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

/**
 * Verifica la estructura antes de guardarla. Pensado sobre todo para la IA,
 * cuya respuesta no esta garantizada. Devuelve la lista de problemas (vacia = valida).
 */
export function validarRecomendacion(valor: unknown): string[] {
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
  return errores;
}
