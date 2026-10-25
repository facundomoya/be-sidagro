import { MigrationInterface, QueryRunner } from 'typeorm';

const PERMISOS: [string, string][] = [
  [
    'AGRO_PARAM_GET',
    'Consultar provincias, campanias, lotes y etapas fenologicas',
  ],
  ['CAMPANIA_POST', 'Crear campanias agricolas'],
  ['LOTE_POST', 'Crear lotes'],
  ['SIMULACION_GET_ONE', 'Consultar una simulacion de escenario'],
  ['SIMULACION_GET_ALL', 'Listar simulaciones de escenario'],
  ['SIMULACION_POST', 'Crear simulaciones de escenario'],
];

export class AgroPermissions1786100000000 implements MigrationInterface {
  name = 'AgroPermissions1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, description] of PERMISOS) {
      await queryRunner.query(
        `INSERT INTO \`permissions\` (\`name\`, \`description\`)
         SELECT ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM \`permissions\` WHERE \`name\` = ?)`,
        [name, description, name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM \`permissions\` WHERE \`name\` IN (?)`,
      [PERMISOS.map(([name]) => name)],
    );
  }
}
