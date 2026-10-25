import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';

// Listas fijas: una migracion no debe depender de enums que luego cambien.
const PERMISOS_INGENIERO = [
  'AGRO_PARAM_GET',
  'CAMPANIA_POST',
  'LOTE_POST',
  'SIMULACION_GET_ONE',
  'SIMULACION_GET_ALL',
  'SIMULACION_POST',
];

const PERMISOS_SOLO_GERENTE = [
  'USER_GET_ONE',
  'USER_GET_ALL',
  'USER_POST',
  'USER_PUT',
  'USER_DELETE',
  'ROLE_GET_ONE',
  'ROLE_GET_ALL',
  'ROLE_POST',
  'ROLE_PUT',
  'ROLE_DELETE',
  'PERMISSION_GET_ONE',
  'PERMISSION_GET_ALL',
  'PERMISSION_POST',
  'PERMISSION_PUT',
  'PERMISSION_DELETE',
  'AUDIT_GET_ALL',
];

const NUEVOS_PERMISOS = PERMISOS_SOLO_GERENTE.filter((p) =>
  p.startsWith('PERMISSION_'),
);

const ROLES: [string, string, string[]][] = [
  [
    'GERENTE',
    'Gerencia de la empresa arrendataria: acceso total',
    [...PERMISOS_SOLO_GERENTE, ...PERMISOS_INGENIERO],
  ],
  [
    'INGENIERO',
    'Ingeniero agronomo: modulos tecnicos, sin auditoria, economico ni reportes',
    PERMISOS_INGENIERO,
  ],
];

export class RolesGerenteIngeniero1786200000000 implements MigrationInterface {
  name = 'RolesGerenteIngeniero1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of [...PERMISOS_SOLO_GERENTE, ...PERMISOS_INGENIERO]) {
      await queryRunner.query(
        `INSERT INTO \`permissions\` (\`name\`)
         SELECT ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM \`permissions\` WHERE \`name\` = ?)`,
        [name, name],
      );
    }

    for (const [name, description, permisos] of ROLES) {
      await queryRunner.query(
        `INSERT INTO \`roles\` (\`name\`, \`description\`)
         SELECT ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM \`roles\` WHERE \`name\` = ?)`,
        [name, description, name],
      );
      await queryRunner.query(
        `INSERT IGNORE INTO \`roles_permissions\` (\`role_id\`, \`permission_id\`)
         SELECT r.\`id\`, p.\`id\` FROM \`roles\` r
         JOIN \`permissions\` p ON p.\`name\` IN (?)
         WHERE r.\`name\` = ?`,
        [permisos, name],
      );
    }

    await this.crearGerenteInicial(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const nombres = ROLES.map(([name]) => name);
    await queryRunner.query(
      `UPDATE \`user\` u JOIN \`roles\` r ON r.\`id\` = u.\`roleId\`
       SET u.\`roleId\` = NULL WHERE r.\`name\` IN (?)`,
      [nombres],
    );
    await queryRunner.query(
      `DELETE rp FROM \`roles_permissions\` rp
       JOIN \`roles\` r ON r.\`id\` = rp.\`role_id\` WHERE r.\`name\` IN (?)`,
      [nombres],
    );
    await queryRunner.query(`DELETE FROM \`roles\` WHERE \`name\` IN (?)`, [
      nombres,
    ]);
    await queryRunner.query(
      `DELETE FROM \`permissions\` WHERE \`name\` IN (?)`,
      [NUEVOS_PERMISOS],
    );
  }

  /**
   * Garantiza que exista al menos un gerente para poder ingresar al sistema.
   * Si GERENTE_USERNAME ya existe se le asigna el rol (sin tocar su contrasena);
   * si no, se crea con los datos de las variables de entorno.
   */
  private async crearGerenteInicial(queryRunner: QueryRunner): Promise<void> {
    const [{ cantidad }] = (await queryRunner.query(
      `SELECT COUNT(*) AS cantidad FROM \`user\` u
       JOIN \`roles\` r ON r.\`id\` = u.\`roleId\` WHERE r.\`name\` = 'GERENTE'`,
    )) as { cantidad: string }[];
    if (Number(cantidad) > 0) return;

    const username = process.env.GERENTE_USERNAME;
    const email = process.env.GERENTE_EMAIL;
    const password = process.env.GERENTE_PASSWORD;
    if (!username || !email || !password || password.length < 8) {
      throw new Error(
        'No existe ningun usuario GERENTE. Defina GERENTE_USERNAME, GERENTE_EMAIL y GERENTE_PASSWORD (minimo 8 caracteres) en el archivo .env y vuelva a correr la migracion.',
      );
    }

    const [rolGerente] = (await queryRunner.query(
      `SELECT \`id\` FROM \`roles\` WHERE \`name\` = 'GERENTE'`,
    )) as { id: number }[];

    const existente = (await queryRunner.query(
      `SELECT \`id\` FROM \`user\` WHERE \`username\` = ?`,
      [username],
    )) as { id: number }[];
    if (existente.length > 0) {
      await queryRunner.query(
        `UPDATE \`user\` SET \`roleId\` = ?, \`isActive\` = 1 WHERE \`id\` = ?`,
        [rolGerente.id, existente[0].id],
      );
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    await queryRunner.query(
      `INSERT INTO \`user\` (\`username\`, \`password\`, \`email\`, \`name\`, \`lastname\`, \`roleId\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        hash,
        email,
        process.env.GERENTE_NOMBRE || 'Gerente',
        process.env.GERENTE_APELLIDO || 'SID-Agro',
        rolGerente.id,
      ],
    );
  }
}
