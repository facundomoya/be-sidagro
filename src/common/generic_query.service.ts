import { Injectable, NotFoundException } from '@nestjs/common';

import {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
} from 'typeorm';
import { applyFilters } from './utils/applyFilters.utils';
import { splitQuery } from './utils/splitQuery.utils';
import { applyUpdateFilters } from './utils/applyUpdateFilters.utils';
import { SelectQueryBuilder } from 'typeorm';

type FindOptionsExtended<T> = FindManyOptions<T> & {
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  takeAll?: boolean;
};

export type ResponseFindAll<T> = {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export interface FindOneOptionsExtended<T> extends FindOneOptions<T> {
  filters?: Record<string, any>;
}

@Injectable()
export class GenericQueryService {
  constructor(private readonly datasource: DataSource) {}

  // 🔹 helper para usar manager o default
  private getManager(manager?: EntityManager) {
    return manager ?? this.datasource.manager;
  }

  async find<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options?: FindOptionsExtended<T>,
    manager?: EntityManager,
  ): Promise<ResponseFindAll<T>> {
    const repo = this.getManager(manager).getRepository(entity);
    const qb = repo.createQueryBuilder('entity');

    const { filters, limit, page, takeAll } = splitQuery(options ?? {});

    // relations
    if (options?.relations && Array.isArray(options.relations)) {
      options.relations.forEach((rel) => {
        const alias = rel.replace(/\./g, '_');
        qb.leftJoinAndSelect(`entity.${rel}`, alias);
      });
    }

    // where nativo
    if (options?.where) {
      qb.where(options.where);
    }

    // filtros dinámicos
    if (!options?.where && Object.keys(filters).length > 0) {
      applyFilters(qb, filters);
    }

    let data: T[] = [];
    let total = 0;

    if (takeAll) {
      data = await qb.getMany();
      total = data.length;

      return {
        data,
      };
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, limit);

    qb.skip((safePage - 1) * safeLimit).take(safeLimit);

    [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  applyRelationsRecursively<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    relations: Record<string, any>,
    parentAlias: string,
  ) {
    Object.entries(relations).forEach(([key, value]) => {
      const alias = `${parentAlias}_${key}`;

      qb.leftJoinAndSelect(`${parentAlias}.${key}`, alias);

      if (value && typeof value === 'object') {
        this.applyRelationsRecursively(qb, value, alias);
      }
    });
  }

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    options: FindOneOptionsExtended<T> = {},
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = this.getManager(manager).getRepository(entity);
    const qb = repo.createQueryBuilder('entity');

    const { filters, relations, where, order, select } = options;

    // ✅ relations
    if (relations) {
      if (Array.isArray(relations)) {
        relations.forEach((rel) => {
          const alias = rel.replace(/\./g, '_');
          qb.leftJoinAndSelect(`entity.${rel}`, alias);
        });
      } else if (typeof relations === 'object') {
        this.applyRelationsRecursively(qb, relations, 'entity');
      }
    }

    // ✅ where de TypeORM
    if (where) {
      qb.where(where);
    }

    // ✅ select
    if (select) {
      qb.select(
        Array.isArray(select)
          ? select.map((s) => `entity.${String(s)}`)
          : Object.keys(select).map((key) => `entity.${key}`),
      );
    }

    // ✅ order
    if (order) {
      Object.entries(order).forEach(([key, value]) => {
        qb.addOrderBy(`entity.${key}`, value as 'ASC' | 'DESC');
      });
    }

    // ✅ filtros custom (tu lógica)
    if (filters && Object.keys(filters).length) {
      applyFilters(qb, filters);
    }

    qb.take(1);

    return qb.getOne();
  }

  async save<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    data: DeepPartial<T>,
    manager?: EntityManager,
  ): Promise<T> {
    const repo = this.getManager(manager).getRepository(entity);

    const entityInstance = repo.create(data);

    return await repo.save(entityInstance);
  }

  async update<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    filter: Record<string, any>,
    data: Partial<T>,
    manager?: EntityManager,
  ) {
    if (!filter || !Object.keys(filter).length) {
      throw new Error('Update requires filters');
    }

    const qb = this.getManager(manager)
      .createQueryBuilder()
      .update(entity)
      .set(data);

    applyUpdateFilters(qb, filter);

    const result = await qb.execute();

    if (!result.affected) {
      throw new NotFoundException('Entity not found or not updated');
    }

    const entityUpdated = await this.findOne(entity, { filters: filter });

    return entityUpdated;
  }

  async withTransaction<T>(
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner.manager);

      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction(); // 🔥 clave

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    filter: Partial<T>,
    manager?: EntityManager,
  ) {
    if (!filter || !Object.keys(filter).length) {
      throw new Error('Delete requires filters');
    }

    const qb = this.getManager(manager)
      .createQueryBuilder()
      .delete()
      .from(entity);

    applyUpdateFilters(qb as any, filter);

    const result = await qb.execute();

    if (!result.affected) {
      throw new NotFoundException('Entity not found');
    }

    return {
      affected: result.affected ?? 0,
    };
  }

  async softDelete<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    filter: Partial<T>,
    manager?: EntityManager,
  ) {
    if (!filter || !Object.keys(filter).length) {
      throw new Error('Delete requires filters');
    }

    const qb = this.getManager(manager)
      .createQueryBuilder()
      .softDelete()
      .from(entity);

    applyUpdateFilters(qb as any, filter);

    const result = await qb.execute();

    if (!result.affected) {
      throw new NotFoundException('Entity not found');
    }
    return {
      affected: result.affected ?? 0,
    };
  }
}
