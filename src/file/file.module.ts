import { Module } from '@nestjs/common';
import { storageServiceProvider } from './storage-factory';

@Module({
  providers: [storageServiceProvider],
  exports: [storageServiceProvider],
})
export class FileModule {}
