import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FsService } from './file-fs.class';
import { SftpService } from './file-sftp.class';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

export const storageServiceProvider: Provider = {
  provide: STORAGE_SERVICE,
  useFactory: (configService: ConfigService) => {
    const type = configService.get<string>('STORAGE_TYPE');
    const basePath = configService.get<string>('STORAGE_BASE_PATH') || '.';

    if (type === 'fs') {
      return new FsService(basePath);
    }
    if (type === 'sftp') {
      return new SftpService(configService, basePath);
    }
    throw new Error(`Invalid STORAGE_TYPE: ${type}. Expected 'fs' or 'sftp'.`);
  },
  inject: [ConfigService],
};
