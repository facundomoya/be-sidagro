import { MigrationInterface, QueryRunner } from 'typeorm';

// Centroides de cada departamento segun Georef, la API oficial de la division
// territorial argentina (apis.datos.gob.ar/georef), consultada el 2026-10-29.
// Lista fija: el sistema no consulta Georef en cada pedido.
const DEPARTAMENTOS: [string, [string, number, number][]][] = [
  [
    'San Luis',
    [
      ['Ayacucho', -32.165722, -66.542362],
      ['Belgrano', -32.735611, -66.715053],
      ['Chacabuco', -32.727077, -65.19821],
      ['Coronel Pringles', -33.106882, -65.90079],
      ['General Pedernera', -33.892224, -65.559775],
      ['Gobernador Dupuy', -35.368451, -65.809487],
      ['Juan Martín de Pueyrredón', -33.900715, -66.50244],
      ['Junín', -32.216302, -65.394843],
      ['Libertador General San Martín', -32.578419, -65.709589],
    ],
  ],
  [
    'Santiago del Estero',
    [
      ['Aguirre', -29.297973, -62.515097],
      ['Alberdi', -26.521042, -62.728014],
      ['Atamisqui', -28.691818, -63.881564],
      ['Avellaneda', -28.555363, -63.203767],
      ['Banda', -27.434707, -64.209866],
      ['Belgrano', -29.081505, -62.21828],
      ['Capital', -27.884765, -64.435668],
      ['Choya', -28.754168, -64.763892],
      ['Copo', -25.939161, -62.731097],
      ['Figueroa', -27.321857, -63.579632],
      ['General Taboada', -28.568325, -62.338763],
      ['Guasayán', -27.976851, -64.871224],
      ['Jiménez', -26.899608, -64.272474],
      ['Juan Felipe Ibarra', -28.039493, -62.544375],
      ['Loreto', -28.62448, -64.310727],
      ['Mitre', -29.615049, -62.738676],
      ['Moreno', -27.298201, -62.463903],
      ['Ojo de Agua', -29.304377, -64.014497],
      ['Pellegrini', -26.219902, -64.09175],
      ['Quebrachos', -29.388323, -63.348416],
      ['Rivadavia', -30.020507, -62.28026],
      ['Robles', -27.853944, -63.907509],
      ['Río Hondo', -27.485542, -64.760117],
      ['Salavina', -28.918744, -63.303595],
      ['San Martín', -28.187761, -63.854115],
      ['Sarmiento', -28.106115, -63.446175],
      ['Silípica', -28.188849, -64.273268],
    ],
  ],
];

/**
 * Departamentos de cada provincia con coordenadas, para pedir el clima del
 * monitoreo en la zona del lote y no en la capital provincial.
 */
export class Departamentos1786600000000 implements MigrationInterface {
  name = 'Departamentos1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`departamento\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`provincia_id\` int NOT NULL,
        \`nombre\` varchar(120) NOT NULL,
        \`latitud\` decimal(9,6) NOT NULL,
        \`longitud\` decimal(9,6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_departamento_provincia_nombre\` (\`provincia_id\`, \`nombre\`),
        CONSTRAINT \`FK_departamento_provincia\` FOREIGN KEY (\`provincia_id\`) REFERENCES \`provincia\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    // Solo se cargan las provincias que existen en la base.
    for (const [provincia, departamentos] of DEPARTAMENTOS) {
      for (const [nombre, latitud, longitud] of departamentos) {
        await queryRunner.query(
          `INSERT INTO \`departamento\` (\`provincia_id\`, \`nombre\`, \`latitud\`, \`longitud\`)
           SELECT \`id\`, ?, ?, ? FROM \`provincia\` WHERE \`nombre\` = ?`,
          [nombre, latitud, longitud, provincia],
        );
      }
    }

    await queryRunner.query(
      'ALTER TABLE `lote` ADD `departamento_id` int NULL AFTER `provincia_id`',
    );
    await queryRunner.query(
      'ALTER TABLE `lote` ADD CONSTRAINT `FK_lote_departamento` FOREIGN KEY (`departamento_id`) REFERENCES `departamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `lote` DROP FOREIGN KEY `FK_lote_departamento`',
    );
    await queryRunner.query('ALTER TABLE `lote` DROP COLUMN `departamento_id`');
    await queryRunner.query('DROP TABLE `departamento`');
  }
}
