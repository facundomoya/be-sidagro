import { MigrationInterface, QueryRunner } from 'typeorm';

// Listas fijas: una migracion no debe depender de enums que luego cambien.
const PERMISOS: [string, string][] = [
  ['ECONOMICO_GET', 'Consultar el dashboard economico y el precio de la soja'],
  ['COSTO_POST', 'Cargar costos de produccion por hectarea'],
];
// El modulo economico es solo para la gerencia (CU 04).
const ROLES = ['GERENTE'];

// Costos totales directos e indirectos de la soja, sin Impuesto a las Ganancias.
const COSTOS: [number, string, string][] = [
  [831, '2025-10-01', 'Costos totales directos e indirectos de soja, oct/25'],
  [925, '2026-10-01', 'Costos totales directos e indirectos de soja, oct/26'],
];

/**
 * Modulo economico (CU 04): rendimiento del lote, precio de la soja (pizarra
 * de Rosario) y costos de produccion por hectarea con fecha de vigencia.
 */
export class ModuloEconomico1786500000000 implements MigrationInterface {
  name = 'ModuloEconomico1786500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `lote` ADD `rendimiento` decimal(6,2) NULL AFTER `superficie`',
    );

    await queryRunner.query(`
      CREATE TABLE \`precio_soja\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`fecha\` date NOT NULL,
        \`valor\` decimal(14,2) NOT NULL,
        \`moneda\` varchar(20) NOT NULL DEFAULT 'USD',
        \`valorPesos\` decimal(14,2) NULL,
        \`tipoCambio\` decimal(12,2) NULL,
        \`fuente\` varchar(150) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_precio_soja_fecha_fuente\` (\`fecha\`, \`fuente\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`costo_produccion\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`costoPorHectarea\` decimal(12,2) NOT NULL,
        \`vigenciaDesde\` date NOT NULL,
        \`fuente\` varchar(255) NULL,
        \`detalle\` text NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_costo_produccion_vigencia\` (\`vigenciaDesde\`)
      ) ENGINE=InnoDB
    `);

    for (const [costo, vigencia, fuente] of COSTOS) {
      await queryRunner.query(
        'INSERT INTO `costo_produccion` (`costoPorHectarea`, `vigenciaDesde`, `fuente`) VALUES (?, ?, ?)',
        [costo, vigencia, fuente],
      );
    }

    for (const [name, description] of PERMISOS) {
      await queryRunner.query(
        `INSERT INTO \`permissions\` (\`name\`, \`description\`)
         SELECT ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM \`permissions\` WHERE \`name\` = ?)`,
        [name, description, name],
      );
    }
    await queryRunner.query(
      `INSERT IGNORE INTO \`roles_permissions\` (\`role_id\`, \`permission_id\`)
       SELECT r.\`id\`, p.\`id\` FROM \`roles\` r
       JOIN \`permissions\` p ON p.\`name\` IN (?)
       WHERE r.\`name\` IN (?)`,
      [PERMISOS.map(([name]) => name), ROLES],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const nombres = PERMISOS.map(([name]) => name);
    await queryRunner.query(
      `DELETE rp FROM \`roles_permissions\` rp
       JOIN \`permissions\` p ON p.\`id\` = rp.\`permission_id\`
       WHERE p.\`name\` IN (?)`,
      [nombres],
    );
    await queryRunner.query(
      `DELETE FROM \`permissions\` WHERE \`name\` IN (?)`,
      [nombres],
    );
    await queryRunner.query('DROP TABLE `costo_produccion`');
    await queryRunner.query('DROP TABLE `precio_soja`');
    await queryRunner.query('ALTER TABLE `lote` DROP COLUMN `rendimiento`');
  }
}
