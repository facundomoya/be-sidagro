import { DataSource } from 'typeorm';
import { Lote } from '../../agro/entities/lote.entity';
import { applyFilters } from './applyFilters.utils';

describe('applyJoins', () => {
  // Solo arma el SQL: no se conecta a la base.
  const dataSource = new DataSource({
    type: 'mysql',
    database: 'sin_conexion',
    entities: [__dirname + '/../../**/*.entity.ts'],
  });

  beforeAll(async () => {
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
  });

  const joinsDe = (sql: string, tabla: string) =>
    sql.match(new RegExp(`JOIN \`${tabla}\``, 'g'))?.length ?? 0;

  it('reutiliza la relacion ya unida por relations en vez de unirla otra vez', () => {
    const qb = dataSource
      .createQueryBuilder(Lote, 'entity')
      .leftJoinAndSelect('entity.campania', 'campania')
      .leftJoinAndSelect('entity.provincia', 'provincia');

    applyFilters(qb, { 'campania.id': 1, 'provincia.id': 2 });

    const sql = qb.getSql();
    expect(joinsDe(sql, 'campania')).toBe(1);
    expect(joinsDe(sql, 'provincia')).toBe(1);
    expect(sql).toContain('`campania`.`id` = ?');
    expect(sql).toContain('`provincia`.`id` = ?');
  });

  it('sin relations sigue uniendo la relacion para filtrar', () => {
    const qb = dataSource.createQueryBuilder(Lote, 'entity');

    applyFilters(qb, { 'campania.id': 1 });

    expect(joinsDe(qb.getSql(), 'campania')).toBe(1);
  });
});
