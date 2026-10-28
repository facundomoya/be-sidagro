import { MigrationInterface, QueryRunner } from 'typeorm';

// Listas fijas: una migracion no debe depender de enums que luego cambien.
const PERMISOS: [string, string][] = [
  ['LOTE_PUT', 'Modificar lotes (por ejemplo, la fecha de siembra)'],
  ['MONITOREO_GET', 'Consultar el monitoreo de chinche verde de un lote'],
  ['MONITOREO_POST', 'Registrar observaciones de monitoreo de chinche verde'],
];
const ROLES = ['GERENTE', 'INGENIERO'];

/**
 * Modulo de monitoreo de chinche verde (CU 06): fecha de siembra del lote
 * para acumular grados dia y observaciones de campo por golpes de pano.
 */
export class MonitoreoChinche1786400000000 implements MigrationInterface {
  name = 'MonitoreoChinche1786400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `lote` ADD `fechaSiembra` date NULL AFTER `superficie`',
    );

    await queryRunner.query(`
      CREATE TABLE \`observacion_monitoreo\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`lote_id\` int NOT NULL,
        \`usuario_id\` int NOT NULL,
        \`fecha\` date NOT NULL,
        \`presencia\` tinyint NOT NULL,
        \`densidad\` int NULL,
        \`observaciones\` text NULL,
        \`gddaAcumulado\` decimal(10,2) NULL,
        \`etapaEstimada\` varchar(120) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_observacion_lote_fecha\` (\`lote_id\`, \`fecha\`),
        INDEX \`IDX_observacion_usuario\` (\`usuario_id\`),
        CONSTRAINT \`FK_observacion_lote\` FOREIGN KEY (\`lote_id\`) REFERENCES \`lote\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_observacion_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

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
    await queryRunner.query('DROP TABLE `observacion_monitoreo`');
    await queryRunner.query('ALTER TABLE `lote` DROP COLUMN `fechaSiembra`');
  }
}
