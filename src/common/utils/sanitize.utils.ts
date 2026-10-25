const SENSITIVE_KEY_PATTERN =
  /pass(word)?|contrasena|contraseña|secret|token|authorization|api[-_]?key|credential/i;

const REDACTED = '[REDACTED]';

/**
 * Devuelve una copia del valor con los campos sensibles ocultos,
 * para poder registrarlo en auditoria o logs sin exponer secretos.
 */
export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitize(val),
      ]),
    );
  }

  return value;
}
