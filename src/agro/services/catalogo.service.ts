import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenericQueryService } from '../../common/generic_query.service';
import type { Filters } from '../../common/types/filters.type';
import { Campania } from '../entities/campania.entity';
import { EtapaFenologica } from '../entities/etapa-fenologica.entity';
import { Lote } from '../entities/lote.entity';
import { Provincia } from '../entities/provincia.entity';
import { CreateCampaniaDto } from '../dto/create-campania.dto';
import { CreateLoteDto } from '../dto/create-lote.dto';

/** Datos de referencia que usa la simulacion: provincias, campanias, lotes y etapas. */
@Injectable()
export class CatalogoService {
  constructor(private readonly repository: GenericQueryService) {}

  async findProvincias() {
    return await this.repository.find(Provincia, { takeAll: true });
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
      relations: ['provincia', 'campania'],
    });
  }

  async findLote(id: number): Promise<Lote> {
    const lote = await this.repository.findOne(Lote, {
      filters: { id },
      relations: { provincia: true, campania: true },
    });
    if (!lote) {
      throw new NotFoundException(`No se encontro el lote con id= ${id}`);
    }
    return lote;
  }

  async createLote(dto: CreateLoteDto): Promise<Lote> {
    const { provinciaId, campaniaId, ...data } = dto;

    const provincia = await this.repository.findOne(Provincia, {
      filters: { id: provinciaId },
    });
    if (!provincia) {
      throw new NotFoundException(
        `No se encontro la provincia con id= ${provinciaId}`,
      );
    }
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
      campania,
    });
    return await this.findLote(lote.id);
  }
}
