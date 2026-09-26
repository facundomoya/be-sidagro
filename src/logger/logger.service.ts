import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements LoggerService {
  log(message: any, context?: string) {
    console.log(`[${context ?? 'App'}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    console.error(`[${context ?? 'App'}] ERROR: ${message}`, trace ?? '');
  }

  warn(message: any, context?: string) {
    console.warn(`[${context ?? 'App'}] WARN: ${message}`);
  }

  debug(message: any, context?: string) {
    console.debug(`[${context ?? 'App'}] DEBUG: ${message}`);
  }

  verbose(message: any, context?: string) {
    console.log(`[${context ?? 'App'}] VERBOSE: ${message}`);
  }
}
