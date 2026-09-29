import type { Readable } from 'node:stream';

export interface StoredObject {
  stream: Readable;
  size: number;
}

/**
 * File storage abstraction. Phase 1 ships `LocalDiskStorage`; an S3-compatible
 * or MinIO driver can be added later for hosted deployments by providing a
 * different implementation of this class in `StorageModule` — callers only
 * ever deal with opaque keys, never paths or URLs.
 */
export abstract class StorageDriver {
  abstract put(key: string, data: Buffer, contentType: string): Promise<void>;
  /** Returns `null` when the object does not exist. */
  abstract get(key: string): Promise<StoredObject | null>;
  abstract delete(key: string): Promise<void>;
}

/** Keys look like `logos/<uuid>/<uuid>.png`: no traversal, no absolute paths. */
const SAFE_KEY = /^[a-z0-9-]+(\/[a-z0-9-]+)*\/[a-z0-9-]+\.[a-z0-9]{2,5}$/;

export function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key)) throw new Error(`Invalid storage key: ${key}`);
}
