import { sanitize } from './sanitize.utils';

describe('sanitize', () => {
  it('oculta campos sensibles en cualquier nivel', () => {
    const body = {
      username: 'facu',
      password: 'secreta',
      nested: { apiKey: 'k', refreshToken: 't', ok: 1 },
      items: [{ contrasena: 'x', nombre: 'lote' }],
    };

    expect(sanitize(body)).toEqual({
      username: 'facu',
      password: '[REDACTED]',
      nested: { apiKey: '[REDACTED]', refreshToken: '[REDACTED]', ok: 1 },
      items: [{ contrasena: '[REDACTED]', nombre: 'lote' }],
    });
  });

  it('no modifica el objeto original', () => {
    const body = { password: 'secreta' };
    sanitize(body);
    expect(body.password).toBe('secreta');
  });
});
