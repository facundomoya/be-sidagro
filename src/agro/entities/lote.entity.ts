import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { Provincia } from './provincia.entity';
import { Campania } from './campania.entity';
import { Departamento } from './departamento.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';
import { ObservacionMonitoreo } from './observacion-monitoreo.entity';

@Entity({ name: 'lote' })
export class Lote extends BaseClass {
  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  superficie!: number | null;

  /** Rendimiento esperado en toneladas por hectarea (modulo economico). */
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  rendimiento!: number | null;

  /** Desde esta fecha se acumulan los grados dia del monitoreo. */
  @Column({ type: 'date', nullable: true })
  fechaSiembra!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVO' })
  estado!: string;

  @ManyToOne(() => Provincia, (provincia) => provincia.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'provincia_id' })
  provincia!: Provincia;

  /** Zona del lote: de aca sale el clima del monitoreo. Sin departamento se usa la capital. */
  @ManyToOne(() => Departamento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Departamento | null;

  @ManyToOne(() => Campania, (campania) => campania.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'campania_id' })
  campania!: Campania;

  @OneToMany(() => SimulacionEscenario, (simulacion) => simulacion.lote)
  simulaciones!: SimulacionEscenario[];

  @OneToMany(() => ObservacionMonitoreo, (observacion) => observacion.lote)
  observaciones!: ObservacionMonitoreo[];
}
