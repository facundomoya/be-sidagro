import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { RolesEntity } from '../../role/entities/role.entity';
import { Audit } from '../../audit/entities/audit.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User extends BaseClass {
  @Column('varchar', { unique: true, length: 255 })
  username: string;
  @Exclude()
  @Column('varchar', { length: 255 })
  password: string;
  @Column('varchar', { unique: true, length: 255 })
  email: string;
  @Column('varchar', { length: 255 })
  name: string;
  @Column('varchar', { length: 255 })
  lastname: string;
  @Column('bool', { default: true })
  isActive: boolean;
  @Column('varchar', { length: 255, nullable: true })
  type: string;

  @ManyToOne(() => RolesEntity, (role) => role.users)
  role: RolesEntity;

  @Exclude()
  @OneToMany(() => Audit, (audit) => audit.user)
  audits: Audit[];
}
