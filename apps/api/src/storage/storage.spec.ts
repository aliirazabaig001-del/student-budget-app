import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AppConfigService } from '../config/app-config.service';
import { detectImageType } from './image-type';
import { LocalDiskStorage } from './local-disk.storage';
import { assertSafeKey } from './storage.driver';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);

describe('detectImageType', () => {
  it('recognises PNG, JPEG and WebP by their bytes', () => {
    expect(detectImageType(PNG)?.mimeType).toBe('image/png');
    expect(detectImageType(JPEG)?.mimeType).toBe('image/jpeg');
    expect(detectImageType(WEBP)?.mimeType).toBe('image/webp');
  });

  it('rejects SVG, HTML and other content regardless of file name', () => {
    expect(detectImageType(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from('<html></html>'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe('assertSafeKey', () => {
  it('accepts generated keys', () => {
    expect(() =>
      assertSafeKey('logos/7f2c9e1a-1111-4222-8333-944445555666/abc-123.png'),
    ).not.toThrow();
  });

  it.each(['../etc/passwd', '/abs/path.png', 'logos/../../x.png', 'logos\\x.png', 'LOGOS/a.png'])(
    'rejects %s',
    (key) => expect(() => assertSafeKey(key)).toThrow(),
  );
});

describe('LocalDiskStorage', () => {
  let root: string;
  let storage: LocalDiskStorage;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'skoolledger-storage-'));
    storage = new LocalDiskStorage({ get: () => root } as unknown as AppConfigService);
  });

  afterAll(() => rm(root, { recursive: true, force: true }));

  it('stores, reads and deletes objects', async () => {
    await storage.put('logos/school/logo-1.png', PNG, 'image/png');
    expect(await readFile(join(root, 'logos/school/logo-1.png'))).toEqual(PNG);

    const object = await storage.get('logos/school/logo-1.png');
    expect(object?.size).toBe(PNG.length);
    object?.stream.destroy();

    await storage.delete('logos/school/logo-1.png');
    expect(await storage.get('logos/school/logo-1.png')).toBeNull();
  });

  it('refuses to write outside its root', async () => {
    await expect(storage.put('../escape.png', PNG, 'image/png')).rejects.toThrow();
  });
});
