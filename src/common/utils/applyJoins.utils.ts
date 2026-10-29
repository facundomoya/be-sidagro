import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applyJoins<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  field: string,
  joins: Map<string, string>,
): string {
  const parts = field.split('.');

  // ej: ["user", "role"]
  if (parts.length === 1) {
    return `entity.${field}`;
  }

  let currentAlias = 'entity';
  let path = '';

  for (let i = 0; i < parts.length - 1; i++) {
    const relation = parts[i];
    path = path ? `${path}.${relation}` : relation;

    if (!joins.has(path)) {
      const alias = path.replace(/\./g, '_');

      // find() pudo haber unido ya esta relacion (relations) con el mismo alias.
      const yaUnido = qb.expressionMap.aliases.some((a) => a.name === alias);
      if (!yaUnido) qb.leftJoin(`${currentAlias}.${relation}`, alias);
      joins.set(path, alias);
    }

    currentAlias = joins.get(path)!;
  }

  const lastField = parts[parts.length - 1];
  return `${currentAlias}.${lastField}`;
}
