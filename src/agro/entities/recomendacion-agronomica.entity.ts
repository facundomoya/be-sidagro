import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';
import { SimulacionEscenario } from './simulacion-escenario.entity';

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
  descripcion!: string;

  @Column({ type: 'text' })
  accionSugerida!: string;

  @Column({ type: 'varchar', length: 40 })
  nivelRiesgo!: string;

  @Column({ type: 'varchar', length: 40 })
  prioridad!: string;

  @Column({ type: 'json', nullable: true })
  fundamento!: string[] | null;

  @Column({ type: 'json', nullable: true })
  datosFaltantes!: string[] | null;

  @Column({ type: 'json', nullable: true })
  advertencias!: string[] | null;

  @Column({ type: 'json', nullable: true })
  fuentesConsultadas!: Record<string, string>[] | null;

  @Column({ type: 'longtext', nullable: true })
  respuestaOriginal!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  modeloIa!: string | null;

  @Column({ type: 'datetime', nullable: true })
  fechaGeneracion!: Date | null;
}
