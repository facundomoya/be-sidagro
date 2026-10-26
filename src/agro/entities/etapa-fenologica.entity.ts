import { Column, Entity, OneToMany } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';

@Entity({ name: 'etapa_fenologica' })
export class EtapaFenologica extends BaseClass {
  @Column({ type: 'varchar', length: 80, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gddaMinimo!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gddaMaximo!: number;

  @Column({ type: 'varchar', length: 80 })
  frecuenciaMonitoreo!: string;

  @Column({ type: 'varchar', length: 40 })
  riesgoChinche!: string;

  @OneToMany(() => SimulacionEscenario, (simulacion) => simulacion.etapa)
  simulaciones!: SimulacionEscenario[];
}
