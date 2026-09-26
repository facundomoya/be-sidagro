import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditIp1785845136180 implements MigrationInterface {
    name = 'AuditIp1785845136180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_userId\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_roleId\``);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` DROP FOREIGN KEY \`FK_permission_id\``);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` DROP FOREIGN KEY \`FK_role_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_email\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_username\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_permission_id\` ON \`roles_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_role_id\` ON \`roles_permissions\``);
        await queryRunner.query(`ALTER TABLE \`audit\` CHANGE \`error\` \`ip\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`audit\` DROP COLUMN \`ip\``);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD \`ip\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_7d2dad9f14eddeb09c256fea71\` ON \`roles_permissions\` (\`role_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_337aa8dba227a1fe6b73998307\` ON \`roles_permissions\` (\`permission_id\`)`);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD CONSTRAINT \`FK_7ae389e858ad6f2c0c63112e387\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_c28e52f758e7bbc53828db92194\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` ADD CONSTRAINT \`FK_7d2dad9f14eddeb09c256fea719\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` ADD CONSTRAINT \`FK_337aa8dba227a1fe6b73998307b\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` DROP FOREIGN KEY \`FK_337aa8dba227a1fe6b73998307b\``);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` DROP FOREIGN KEY \`FK_7d2dad9f14eddeb09c256fea719\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_c28e52f758e7bbc53828db92194\``);
        await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_7ae389e858ad6f2c0c63112e387\``);
        await queryRunner.query(`DROP INDEX \`IDX_337aa8dba227a1fe6b73998307\` ON \`roles_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_7d2dad9f14eddeb09c256fea71\` ON \`roles_permissions\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\``);
        await queryRunner.query(`ALTER TABLE \`audit\` DROP COLUMN \`ip\``);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD \`ip\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`audit\` CHANGE \`ip\` \`error\` varchar(255) NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_role_id\` ON \`roles_permissions\` (\`role_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_permission_id\` ON \`roles_permissions\` (\`permission_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_username\` ON \`user\` (\`username\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_email\` ON \`user\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` ADD CONSTRAINT \`FK_role_id\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`roles_permissions\` ADD CONSTRAINT \`FK_permission_id\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_roleId\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD CONSTRAINT \`FK_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
