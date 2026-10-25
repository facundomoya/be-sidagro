import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { User } from '../../user/entities/user.entity';
import { Lote } from './lote.entity';
import { EtapaFenologica } from './etapa-fenologica.entity';
import { DatoClimatico } from './dato-climatico.entity';
import { RecomendacionAgronomica } from './recomendacion-agronomica.entity';

@Entity({ name: 'simulacion_escenario' })
export class SimulacionEscenario extends BaseClass {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @ManyToOne(() => Lote, (lote) => lote.simulaciones, { nullable: false })
  @JoinColumn({ name: 'lote_id' })
  lote!: Lote;

  @ManyToOne(() => EtapaFenologica, (etapa) => etapa.simulaciones, {
    nullable: false,
  })
  @JoinColumn({ name: 'etapa_id' })
  etapa!: EtapaFenologica;

  @Column({ type: 'varchar', length: 20 })
  fuenteClimatica!: string;

  @Column({ type: 'varchar', length: 40 })
  riesgoPlaga!: string;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gddaMinimoUtilizado!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gddaMaximoUtilizado!: number;

  @Column({ type: 'varchar', length: 80 })
  frecuenciaMonitoreoUtilizada!: string;

  @Column({ type: 'varchar', length: 40 })
  riesgoEtapaUtilizado!: string;

  @Column({ type: 'varchar', length: 30, default: 'CREADA' })
  estado!: string;

  @OneToMany(() => DatoClimatico, (dato) => dato.simulacion)
  datosClimaticos!: DatoClimatico[];

  @OneToOne(
    () => RecomendacionAgronomica,
    (recomendacion) => recomendacion.simulacion,
  )
  recomendacion!: RecomendacionAgronomica | null;
}
