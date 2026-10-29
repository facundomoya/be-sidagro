import { Column, Entity, Index } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';

/**
 * Costo total de producir una hectarea de soja (directos e indirectos, sin
 * Impuesto a las Ganancias), en US$/ha. Rige desde vigenciaDesde hasta el
 * siguiente costo cargado.
 */
@Entity({ name: 'costo_produccion' })
@Index('UQ_costo_produccion_vigencia', ['vigenciaDesde'], { unique: true })
export class CostoProduccion extends BaseClass {
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  costoPorHectarea!: number;

  @Column({ type: 'date' })
  vigenciaDesde!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fuente!: string | null;

  @Column({ type: 'text', nullable: true })
  detalle!: string | null;
}
