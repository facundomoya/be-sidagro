import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { applyJoins } from './applyJoins.utils';

export function applyFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  filters: Record<string, any>,
) {
  const joins = new Map<string, string>();

  Object.entries(filters).forEach(([rawKey, value], index) => {
    const [field, operator = 'eq'] = rawKey.split('__');

    const paramKey = `param_${index}`;
    const fieldPath = applyJoins(qb, field, joins);

    switch (operator) {
      case 'eq':
        qb.andWhere(`${fieldPath} = :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'ne':
        qb.andWhere(`${fieldPath} != :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'gt':
        qb.andWhere(`${fieldPath} > :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'gte':
        qb.andWhere(`${fieldPath} >= :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'lt':
        qb.andWhere(`${fieldPath} < :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'lte':
        qb.andWhere(`${fieldPath} <= :${paramKey}`, {
          [paramKey]: value,
        });
        break;

      case 'like':
        qb.andWhere(`${fieldPath} LIKE :${paramKey}`, {
          [paramKey]: `%${value}%`,
        });
        break;

      case 'ilike': // PostgreSQL
        qb.andWhere(`${fieldPath} ILIKE :${paramKey}`, {
          [paramKey]: `%${value}%`,
        });
        break;

      case 'in':
        qb.andWhere(`${fieldPath} IN (:...${paramKey})`, {
          [paramKey]: Array.isArray(value) ? value : String(value).split(','),
        });
        break;

      case 'between':
        const [start, end] = Array.isArray(value)
          ? value
          : String(value).split(',');
        qb.andWhere(`${fieldPath} BETWEEN :${paramKey}_1 AND :${paramKey}_2`, {
          [`${paramKey}_1`]: start,
          [`${paramKey}_2`]: end,
        });
        break;

      case 'isNull':
        qb.andWhere(`${fieldPath} IS NULL`);
        break;

      case 'notNull':
        qb.andWhere(`${fieldPath} IS NOT NULL`);
        break;

      default:
        throw new Error(`Operador no soportado: ${operator}`);
    }
  });
}
