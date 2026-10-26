import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';

@Entity({ name: 'dato_climatico' })
export class DatoClimatico extends BaseClass {
  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  temperatura!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  precipitacion!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  humedad!: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  viento!: number;

  @Column({ type: 'varchar', length: 20 })
  fuente!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  proveedor!: string | null;

  @ManyToOne(
    () => SimulacionEscenario,
    (simulacion) => simulacion.datosClimaticos,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'simulacion_id' })
  simulacion!: SimulacionEscenario;
}
