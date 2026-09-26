import { UpdateQueryBuilder, ObjectLiteral } from 'typeorm';

export function applyUpdateFilters<T extends ObjectLiteral>(
  qb: UpdateQueryBuilder<T>,
  filters: Record<string, any>,
) {
  Object.entries(filters).forEach(([key, value], index) => {
    const paramKey = `param_${index}`;

    // ignoramos operadores tipo __gt, __like, etc.
    const [field] = key.split('__');

    qb.andWhere(`${field} = :${paramKey}`, {
      [paramKey]: value,
    });
  });
}
