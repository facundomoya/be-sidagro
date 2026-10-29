import { Column, Entity, Index } from 'typeorm';
import { BaseClass } from '../../common/entities/baseClass.entity';

/** Precio de la soja por dia y fuente (pizarra de Rosario), en US$ por tonelada. */
@Entity({ name: 'precio_soja' })
@Index('UQ_precio_soja_fecha_fuente', ['fecha', 'fuente'], { unique: true })
export class PrecioSoja extends BaseClass {
  /** Dia al que corresponde el precio (no el dia en que se consulto). */
  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  valor!: number;

  @Column({ type: 'varchar', length: 20, default: 'USD' })
  moneda!: string;

  /** Precio en pesos por tonelada, tal como lo publica la pizarra. */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  valorPesos!: number | null;

  /** Dolar BNA divisa comprador usado para convertir. */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  tipoCambio!: number | null;

  @Column({ type: 'varchar', length: 150 })
  fuente!: string;
}
