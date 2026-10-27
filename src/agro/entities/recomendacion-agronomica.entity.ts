import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';
import type { FuenteConsultada } from '../recomendacion/recommendation-provider.interface';

@Entity({ name: 'recomendacion_agronomica' })
export class RecomendacionAgronomica extends BaseClass {
  @OneToOne(
    () => SimulacionEscenario,
    (simulacion) => simulacion.recomendacion,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'simulacion_id' })
  simulacion!: SimulacionEscenario;

  @Column({ type: 'text' })
  resumen!: string;

  @Column({ type: 'text', nullable: true })
  analisisDetallado!: string | null;

  @Column({ type: 'text', nullable: true })
  analisisEtapaFenologica!: string | null;

  @Column({ type: 'text', nullable: true })
  analisisClimatico!: string | null;

  @Column({ type: 'text', nullable: true })
  analisisSanitario!: string | null;

  @Column({ type: 'text' })
  recomendacionPrincipal!: string;

  @Column({ type: 'varchar', length: 40 })
  nivelRiesgo!: string;

  @Column({ type: 'varchar', length: 40 })
  prioridad!: string;

  @Column({ type: 'varchar', length: 20, default: 'BAJO' })
  nivelConfianza!: string;

  @Column({ type: 'json', nullable: true })
  factoresRiesgo!: string[] | null;

  @Column({ type: 'json', nullable: true })
  factoresAtenuantes!: string[] | null;

  @Column({ type: 'json', nullable: true })
  accionesSugeridas!: string[] | null;

  @Column({ type: 'json', nullable: true })
  datosFaltantes!: string[] | null;

  @Column({ type: 'json', nullable: true })
  advertencias!: string[] | null;

  @Column({ type: 'json', nullable: true })
  fuentesConsultadas!: FuenteConsultada[] | null;

  @Column({ type: 'longtext', nullable: true })
  respuestaOriginal!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  modeloIa!: string | null;

  @Column({ type: 'datetime', nullable: true })
  fechaGeneracion!: Date | null;
}
