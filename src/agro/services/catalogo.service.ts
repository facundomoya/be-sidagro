import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import type { Filters } from '../../common/types/filters.type';
import { Campania } from '../entities/campania.entity';
import { Departamento } from '../entities/departamento.entity';
import { EtapaFenologica } from '../entities/etapa-fenologica.entity';
import { Lote } from '../entities/lote.entity';
import { Provincia } from '../entities/provincia.entity';
import { CreateCampaniaDto } from '../dto/create-campania.dto';
import { CreateLoteDto } from '../dto/create-lote.dto';
import { UpdateLoteDto } from '../dto/update-lote.dto';

/** Datos de referencia que usa la simulacion: provincias, campanias, lotes y etapas. */
@Injectable()
export class CatalogoService {
  constructor(private readonly repository: GenericQueryService) {}

  async findProvincias() {
    return await this.repository.find(Provincia, { takeAll: true });
  }

  /** Departamentos de la provincia, ordenados por nombre. */
  async findDepartamentos(provinciaId: number) {
    await this.findProvincia(provinciaId);
    const result = await this.repository.find(Departamento, {
      filters: { 'provincia.id': provinciaId },
      takeAll: true,
    });
    result.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return result;
  }

  async findEtapas() {
    const result = await this.repository.find(EtapaFenologica, {
      takeAll: true,
    });
    result.data.sort((a, b) => Number(a.gddaMinimo) - Number(b.gddaMinimo));
    return result;
  }

  async findEtapa(id: number): Promise<EtapaFenologica> {
    const etapa = await this.repository.findOne(EtapaFenologica, {
      filters: { id },
    });
    if (!etapa) {
      throw new NotFoundException(
        `No se encontro la etapa fenologica con id= ${id}`,
      );
    }
    return etapa;
  }

  async findCampanias(filter: Filters) {
    return await this.repository.find(Campania, { filters: filter });
  }

  async createCampania(dto: CreateCampaniaDto): Promise<Campania> {
    if (dto.fechaFin && dto.fechaFin < dto.fechaInicio) {
      throw new BadRequestException(
        'fechaFin no puede ser anterior a fechaInicio',
      );
    }
    const existente = await this.repository.findOne(Campania, {
      filters: { nombre: dto.nombre },
    });
    if (existente) {
      throw new ConflictException(`Ya existe la campania ${dto.nombre}`);
    }
    return await this.repository.save(Campania, dto);
  }

  async findLotes(filter: Filters) {
    return await this.repository.find(Lote, {
      filters: filter,
      relations: ['provincia', 'departamento', 'campania'],
    });
  }

  async findLote(id: number): Promise<Lote> {
    const lote = await this.repository.findOne(Lote, {
      filters: { id },
      relations: { provincia: true, departamento: true, campania: true },
    });
    if (!lote) {
      throw new NotFoundException(`No se encontro el lote con id= ${id}`);
    }
    return lote;
  }

  async createLote(dto: CreateLoteDto): Promise<Lote> {
    const { provinciaId, campaniaId, departamentoId, ...data } = dto;

    const provincia = await this.findProvincia(provinciaId);
    const departamento = await this.departamentoDe(provinciaId, departamentoId);
    const campania = await this.repository.findOne(Campania, {
      filters: { id: campaniaId },
    });
    if (!campania) {
      throw new NotFoundException(
        `No se encontro la campania con id= ${campaniaId}`,
      );
    }

    const lote = await this.repository.save(Lote, {
      ...data,
      provincia,
      departamento,
      campania,
    });
    return await this.findLote(lote.id);
  }

  async updateLote(id: number, dto: UpdateLoteDto): Promise<Lote> {
    const lote = await this.findLote(id);
    if (Object.keys(dto).length === 0) return lote;
    const { departamentoId, ...data } = dto;
    const cambios: Partial<Lote> = { ...data };
    // undefined = no se toca; null = se quita el departamento.
    if (departamentoId !== undefined) {
      cambios.departamento = await this.departamentoDe(
        lote.provincia.id,
        departamentoId,
      );
    }
    await this.repository
      .update(Lote, { id }, cambios)
      // Sin valores nuevos la base informa 0 filas cambiadas; el lote existe.
      .catch((error: unknown) => {
        if (!(error instanceof NotFoundException)) throw error;
      });
    return await this.findLote(id);
  }

  private async findProvincia(id: number): Promise<Provincia> {
    const provincia = await this.repository.findOne(Provincia, {
      filters: { id },
    });
    if (!provincia) {
      throw new NotFoundException(`No se encontro la provincia con id= ${id}`);
    }
    return provincia;
  }

  /** El departamento tiene que ser de la provincia del lote. */
  private async departamentoDe(
    provinciaId: number,
    departamentoId: number | null | undefined,
  ): Promise<Departamento | null> {
    if (departamentoId === undefined || departamentoId === null) return null;
    const departamento = await this.repository.findOne(Departamento, {
      filters: { id: departamentoId },
      relations: { provincia: true },
    });
    if (!departamento) {
      throw new NotFoundException(
        `No se encontro el departamento con id= ${departamentoId}`,
      );
    }
    if (departamento.provincia.id !== provinciaId) {
      throw new BadRequestException(
        `El departamento ${departamento.nombre} no pertenece a la provincia del lote`,
      );
    }
    return departamento;
  }
}
