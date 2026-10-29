import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { Provincia } from './provincia.entity';

/**
 * Departamento de una provincia. Sus coordenadas (centroide segun Georef) son
 * las que se usan para pedir el clima del monitoreo de los lotes de la zona.
 */
@Entity({ name: 'departamento' })
@Index('UQ_departamento_provincia_nombre', ['provincia', 'nombre'], {
  unique: true,
})
export class Departamento extends BaseClass {
  @ManyToOne(() => Provincia, (provincia) => provincia.departamentos, {
    nullable: false,
  })
  @JoinColumn({ name: 'provincia_id' })
  provincia!: Provincia;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitud!: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitud!: number;
}
