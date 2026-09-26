import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InterfazFile } from './interfazFile.class';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'node:fs/promises';
import SftpClient from 'ssh2-sftp-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SftpService implements InterfazFile, OnModuleDestroy {
  private sftp: SftpClient;
  private connected = false;

  constructor(
    private configService: ConfigService,
    private readonly basePath: string,
  ) {
    this.sftp = new SftpClient();
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected) return;

    const host = this.configService.get<string>('SFTP_HOST');
    const port = this.configService.get<number>('SFTP_PORT') || 22;
    const username = this.configService.get<string>('SFTP_USERNAME');
    const password = this.configService.get<string>('SFTP_PASSWORD');

    if (!host || !username || !password) {
      throw new Error(
        'Missing SFTP environment variables: SFTP_HOST, SFTP_USERNAME, SFTP_PASSWORD',
      );
    }

    await this.sftp.connect({ host, port, username, password });
    this.connected = true;
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.sftp.end();
      this.connected = false;
    }
  }

  private async validatePath(remoteDir: string) {
    try {
      await this.sftp.stat(remoteDir);
      return true;
    } catch (error: any) {
      if (error.code === 2 || error.message?.includes('No such file')) {
        await this.sftp.mkdir(remoteDir, true);
        return true;
      } else {
        throw error;
      }
    }
  }

  async saveFile(filePath: string, content: Buffer): Promise<void> {
    try {
      await this.ensureConnected();

      const remoteFullPath = path.join(this.basePath, filePath);
      await this.validatePath(path.dirname(remoteFullPath));

      const tempLocalPath = path.join(os.tmpdir(), path.basename(filePath));
      await fs.writeFile(tempLocalPath, content);

      await this.sftp.put(tempLocalPath, remoteFullPath);
      await fs.rm(tempLocalPath);
    } catch (error) {
      console.error('SFTP saveFile error:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.ensureConnected();
      const remoteFullPath = path.join(this.basePath, filePath);
      await this.sftp.delete(remoteFullPath);
    } catch (error) {
      console.error('SFTP deleteFile error:', error);
      throw error;
    }
  }

  async listFiles(remoteDirectory: string): Promise<string[]> {
    try {
      await this.ensureConnected();
      const fullPath = path.join(this.basePath, remoteDirectory);
      const files = await this.sftp.list(fullPath);
      return files
        .filter((f) => f.type === '-')
        .map((f) => path.join(remoteDirectory, f.name));
    } catch (error) {
      console.error('SFTP listFiles error:', error);
      throw error;
    }
  }
}
