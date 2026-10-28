import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { User } from '../../user/entities/user.entity';
import { Lote } from './lote.entity';

/** Observacion de campo del monitoreo de chinche verde (CU 06). */
@Entity({ name: 'observacion_monitoreo' })
export class ObservacionMonitoreo extends BaseClass {
  @ManyToOne(() => Lote, (lote) => lote.observaciones, { nullable: false })
  @JoinColumn({ name: 'lote_id' })
  lote!: Lote;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'boolean' })
  presencia!: boolean;

  /** Chinches contadas cada 20 golpes de pano; null si no hubo presencia. */
  @Column({ type: 'int', nullable: true })
  densidad!: number | null;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  // Copia del seguimiento al momento de observar, para el historial.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gddaAcumulado!: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  etapaEstimada!: string | null;
}
