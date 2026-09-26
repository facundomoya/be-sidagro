import { BaseClass } from '../../common/entities/baseClass.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'permissions' })
export class PermissionEntity extends BaseClass {
  @Column({
    type: 'varchar',
    nullable: false,
  })
  name!: string;
  @Column({
    type: 'varchar',
    nullable: true,
  })
  description!: string;
}
