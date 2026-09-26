import { BaseClass } from '../../common/entities/baseClass.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PermissionEntity } from '../../permission/entities/permission.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'roles' })
export class RolesEntity extends BaseClass {
  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  description!: string;

  @Exclude()
  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @ManyToMany(() => PermissionEntity)
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permission!: PermissionEntity[];
}
