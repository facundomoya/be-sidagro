import { Injectable } from '@nestjs/common';
import { GenericQueryService } from '../common/generic_query.service';
import { Audit } from './entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(private readonly genericQueryService: GenericQueryService) {}

  async save(data: Partial<Audit>): Promise<Audit> {
    return this.genericQueryService.save(Audit, data) as Promise<Audit>;
  }

  async findAll(): Promise<Audit[]> {
    const result = await this.genericQueryService.find(Audit, {
      takeAll: true,
      order: { timestamp: 'DESC' },
    });
    return result.data;
  }
}
