import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea recomendacion_agronomica con la estructura que devuelven los
 * proveedores (reglas locales y, despues, Gemini).
 */
export class RecomendacionEstructura1786300000000 implements MigrationInterface {
  name = 'RecomendacionEstructura1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`recomendacion_agronomica\`
        CHANGE \`descripcion\` \`resumen\` text NOT NULL,
        CHANGE \`accionSugerida\` \`recomendacionPrincipal\` text NOT NULL,
        CHANGE \`fundamento\` \`factoresRiesgo\` json NULL,
        ADD \`analisisDetallado\` text NULL AFTER \`resumen\`,
        ADD \`analisisEtapaFenologica\` text NULL AFTER \`analisisDetallado\`,
        ADD \`analisisClimatico\` text NULL AFTER \`analisisEtapaFenologica\`,
        ADD \`analisisSanitario\` text NULL AFTER \`analisisClimatico\`,
        ADD \`factoresAtenuantes\` json NULL AFTER \`factoresRiesgo\`,
        ADD \`accionesSugeridas\` json NULL AFTER \`factoresAtenuantes\`,
        ADD \`nivelConfianza\` varchar(20) NOT NULL DEFAULT 'BAJO' AFTER \`prioridad\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`recomendacion_agronomica\`
        DROP COLUMN \`nivelConfianza\`,
        DROP COLUMN \`accionesSugeridas\`,
        DROP COLUMN \`factoresAtenuantes\`,
        DROP COLUMN \`analisisSanitario\`,
        DROP COLUMN \`analisisClimatico\`,
        DROP COLUMN \`analisisEtapaFenologica\`,
        DROP COLUMN \`analisisDetallado\`,
        CHANGE \`factoresRiesgo\` \`fundamento\` json NULL,
        CHANGE \`recomendacionPrincipal\` \`accionSugerida\` text NOT NULL,
        CHANGE \`resumen\` \`descripcion\` text NOT NULL
    `);
  }
}
