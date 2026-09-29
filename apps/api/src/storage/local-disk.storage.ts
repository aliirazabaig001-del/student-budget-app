import { mkdir, open, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { StorageDriver, type StoredObject, assertSafeKey } from './storage.driver';

/** Stores files under `UPLOAD_DIR` on the server's own disk. */
@Injectable()
export class LocalDiskStorage extends StorageDriver {
  private readonly logger = new Logger(LocalDiskStorage.name);
  private readonly root: string;

  constructor(config: AppConfigService) {
    super();
    this.root = resolve(config.get('UPLOAD_DIR'));
  }

  // Local disk does not need the content type; object stores (S3/MinIO) will.
  async put(key: string, data: Buffer, _contentType?: string): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    // Write to a temp file and rename, so a crash never leaves a half-written file.
    const temp = `${target}.tmp`;
    await writeFile(temp, data, { mode: 0o640 });
    await rename(temp, target);
  }

  async get(key: string): Promise<StoredObject | null> {
    const target = this.pathFor(key);
    try {
      // Open eagerly so a missing file is reported here, not later as a stream error.
      const handle = await open(target, 'r');
      const info = await handle.stat();
      return { stream: handle.createReadStream(), size: info.size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.pathFor(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Could not delete ${key}: ${(error as Error).message}`);
      }
    }
  }

  private pathFor(key: string): string {
    assertSafeKey(key);
    const target = resolve(this.root, key);
    if (!target.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`);
    return target;
  }
}
