const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

/** Dia de un instante en Argentina (YYYY-MM-DD). */
export const fechaEnArgentina = (instante: Date) =>
  instante.toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
export const hoyEnArgentina = () => fechaEnArgentina(new Date());
