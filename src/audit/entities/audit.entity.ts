import { BaseClass } from '../../common/entities/baseClass.entity';
import { User } from '../../user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Audit extends BaseClass {
  @Column({ type: 'int' })
  statusCode!: number;

  @Column({ type: 'varchar' })
  method!: string;

  @Column({ type: 'varchar' })
  path!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', nullable: true })
  ip!: string | null;

  @Column({ type: 'text', nullable: true })
  stack!: string | null;

  @Column({ type: 'datetime' })
  timestamp!: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.audits)
  user: User;
}
