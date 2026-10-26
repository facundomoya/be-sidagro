import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { Provincia } from './provincia.entity';
import { Campania } from './campania.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';

@Entity({ name: 'lote' })
export class Lote extends BaseClass {
  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  superficie!: number | null;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVO' })
  estado!: string;

  @ManyToOne(() => Provincia, (provincia) => provincia.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'provincia_id' })
  provincia!: Provincia;

  @ManyToOne(() => Campania, (campania) => campania.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'campania_id' })
  campania!: Campania;

  @OneToMany(() => SimulacionEscenario, (simulacion) => simulacion.lote)
  simulaciones!: SimulacionEscenario[];
}
