import { Column, Entity, OneToMany } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { Lote } from './lote.entity';

@Entity({ name: 'campania' })
export class Campania extends BaseClass {
  @Column({ type: 'varchar', length: 120, unique: true })
  nombre!: string;

  @Column({ type: 'date' })
  fechaInicio!: string;

  @Column({ type: 'date', nullable: true })
  fechaFin!: string | null;

  @OneToMany(() => Lote, (lote) => lote.campania)
  lotes!: Lote[];
}
