import { Module } from '@nestjs/common';
import { GenericQueryService } from './generic_query.service';

@Module({
  providers: [GenericQueryService],
  exports: [GenericQueryService],
})
export class CommonModule {}
