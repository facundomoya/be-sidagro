import { Column, Entity, OneToMany } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { Departamento } from './departamento.entity';
import { Lote } from './lote.entity';

@Entity({ name: 'provincia' })
export class Provincia extends BaseClass {
  @Column({ type: 'varchar', length: 120, unique: true })
  nombre!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitud!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitud!: number;

  @OneToMany(() => Lote, (lote) => lote.provincia)
  lotes!: Lote[];

  @OneToMany(() => Departamento, (departamento) => departamento.provincia)
  departamentos!: Departamento[];
}
