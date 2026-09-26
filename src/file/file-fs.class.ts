import { Injectable } from '@nestjs/common';
import { InterfazFile } from './interfazFile.class';
import * as fs from 'node:fs/promises';
import * as pathModule from 'node:path';

@Injectable()
export class FsService implements InterfazFile {
  constructor(private readonly basePath: string) {}

  async saveFile(filePath: string, content: Buffer): Promise<void> {
    try {
      const fullPath = pathModule.join(this.basePath, filePath);
      const directoryPath = pathModule.dirname(fullPath);
      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(fullPath, content);
    } catch (error) {
      console.error(`Error writing file: ${filePath}`, error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = pathModule.join(this.basePath, filePath);
      await fs.rm(fullPath, { force: true });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      } else {
        console.error(`Error deleting file: ${filePath}`, error);
        throw error;
      }
    }
  }

  async listFiles(directoryPath: string): Promise<string[]> {
    try {
      const fullDirPath = pathModule.join(this.basePath, directoryPath);
      const entries = await fs.readdir(fullDirPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => pathModule.join(directoryPath, entry.name));
    } catch (error) {
      console.error(`Error listing files in: ${directoryPath}`, error);
      throw error;
    }
  }
}
