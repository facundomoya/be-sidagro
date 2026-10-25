import { MigrationInterface, QueryRunner } from 'typeorm';

export class SidAgroDomainCore1786000000000 implements MigrationInterface {
  name = 'SidAgroDomainCore1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`provincia\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`nombre\` varchar(120) NOT NULL,
        \`latitud\` decimal(9,6) NOT NULL,
        \`longitud\` decimal(9,6) NOT NULL,
        UNIQUE INDEX \`UQ_provincia_nombre\` (\`nombre\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`campania\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`nombre\` varchar(120) NOT NULL,
        \`fechaInicio\` date NOT NULL,
        \`fechaFin\` date NULL,
        UNIQUE INDEX \`UQ_campania_nombre\` (\`nombre\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`lote\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`nombre\` varchar(120) NOT NULL,
        \`ubicacion\` varchar(255) NULL,
        \`superficie\` decimal(12,2) NULL,
        \`estado\` varchar(30) NOT NULL DEFAULT 'ACTIVO',
        \`provincia_id\` int NOT NULL,
        \`campania_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_lote_provincia\` (\`provincia_id\`),
        INDEX \`IDX_lote_campania\` (\`campania_id\`),
        CONSTRAINT \`FK_lote_provincia\` FOREIGN KEY (\`provincia_id\`) REFERENCES \`provincia\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_lote_campania\` FOREIGN KEY (\`campania_id\`) REFERENCES \`campania\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`etapa_fenologica\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`nombre\` varchar(80) NOT NULL,
        \`descripcion\` varchar(255) NOT NULL,
        \`gddaMinimo\` decimal(10,2) NOT NULL,
        \`gddaMaximo\` decimal(10,2) NOT NULL,
        \`frecuenciaMonitoreo\` varchar(80) NOT NULL,
        \`riesgoChinche\` varchar(40) NOT NULL,
        UNIQUE INDEX \`UQ_etapa_fenologica_nombre\` (\`nombre\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`simulacion_escenario\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`usuario_id\` int NOT NULL,
        \`lote_id\` int NOT NULL,
        \`etapa_id\` int NOT NULL,
        \`fuenteClimatica\` varchar(20) NOT NULL,
        \`riesgoPlaga\` varchar(40) NOT NULL,
        \`observaciones\` text NULL,
        \`gddaMinimoUtilizado\` decimal(10,2) NOT NULL,
        \`gddaMaximoUtilizado\` decimal(10,2) NOT NULL,
        \`frecuenciaMonitoreoUtilizada\` varchar(80) NOT NULL,
        \`riesgoEtapaUtilizado\` varchar(40) NOT NULL,
        \`estado\` varchar(30) NOT NULL DEFAULT 'CREADA',
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_simulacion_usuario\` (\`usuario_id\`),
        INDEX \`IDX_simulacion_lote\` (\`lote_id\`),
        INDEX \`IDX_simulacion_etapa\` (\`etapa_id\`),
        CONSTRAINT \`FK_simulacion_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_simulacion_lote\` FOREIGN KEY (\`lote_id\`) REFERENCES \`lote\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_simulacion_etapa\` FOREIGN KEY (\`etapa_id\`) REFERENCES \`etapa_fenologica\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`dato_climatico\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`simulacion_id\` int NOT NULL,
        \`fecha\` date NOT NULL,
        \`temperatura\` decimal(8,2) NOT NULL,
        \`precipitacion\` decimal(8,2) NOT NULL,
        \`humedad\` decimal(6,2) NOT NULL,
        \`viento\` decimal(8,2) NOT NULL,
        \`fuente\` varchar(20) NOT NULL,
        \`proveedor\` varchar(120) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_dato_climatico_simulacion\` (\`simulacion_id\`),
        CONSTRAINT \`FK_dato_climatico_simulacion\` FOREIGN KEY (\`simulacion_id\`) REFERENCES \`simulacion_escenario\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`recomendacion_agronomica\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`simulacion_id\` int NOT NULL,
        \`descripcion\` text NOT NULL,
        \`accionSugerida\` text NOT NULL,
        \`nivelRiesgo\` varchar(40) NOT NULL,
        \`prioridad\` varchar(40) NOT NULL,
        \`fundamento\` json NULL,
        \`datosFaltantes\` json NULL,
        \`advertencias\` json NULL,
        \`fuentesConsultadas\` json NULL,
        \`respuestaOriginal\` longtext NULL,
        \`modeloIa\` varchar(80) NULL,
        \`fechaGeneracion\` datetime NULL,
        UNIQUE INDEX \`UQ_recomendacion_simulacion\` (\`simulacion_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_recomendacion_simulacion\` FOREIGN KEY (\`simulacion_id\`) REFERENCES \`simulacion_escenario\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`provincia\` (\`nombre\`, \`latitud\`, \`longitud\`)
      VALUES
        ('San Luis', -33.3017, -66.3378),
        ('Santiago del Estero', -27.7951, -64.2615)
    `);

    await queryRunner.query(`
      INSERT INTO \`etapa_fenologica\`
        (\`nombre\`, \`descripcion\`, \`gddaMinimo\`, \`gddaMaximo\`, \`frecuenciaMonitoreo\`, \`riesgoChinche\`)
      VALUES
        ('Emergencia - Vn', 'Emergencia del cultivo', 0, 500, 'No se recomienda', 'Muy bajo'),
        ('R1 - Inicio de floración', 'Inicio de floración', 500, 600, 'Cada 7 días', 'Muy bajo'),
        ('R2 - Floración plena', 'Floración plena', 600, 750, 'Cada 7 días', 'Bajo'),
        ('R3 - Formación de vainas', 'Formación de vainas', 750, 900, 'Cada 3 días', 'Alto'),
        ('R4 - Vaina completa', 'Vaina completa', 900, 1050, 'Cada 3 días', 'Alto'),
        ('R5 - Grano iniciando', 'Inicio de formación de grano', 1050, 1250, 'Cada 3 días', 'Alto'),
        ('R6 - Llenado de granos', 'Llenado de granos', 1250, 1400, 'Cada 7 días', 'Moderado'),
        ('R7 - Madurez fisiológica', 'Madurez fisiológica', 1400, 1500, 'Cada 7 días', 'Bajo'),
        ('R8 - Madurez de cosecha', 'Madurez de cosecha', 1500, 1600, 'Cada 7 días', 'Bajo')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `recomendacion_agronomica`');
    await queryRunner.query('DROP TABLE `dato_climatico`');
    await queryRunner.query('DROP TABLE `simulacion_escenario`');
    await queryRunner.query('DROP TABLE `etapa_fenologica`');
    await queryRunner.query('DROP TABLE `lote`');
    await queryRunner.query('DROP TABLE `campania`');
    await queryRunner.query('DROP TABLE `provincia`');
  }
}
