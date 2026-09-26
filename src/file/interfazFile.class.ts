export abstract class InterfazFile {
  abstract saveFile(path: string, content: Buffer): Promise<void>;
  abstract deleteFile(path: string): Promise<void>;
  abstract listFiles(path: string): Promise<string[]>;
}
