import { describe, expect, it } from 'vitest';
import { validateLogoFile } from './logo-validation';

const file = (type: string, size: number) => new File([new Uint8Array(size)], 'logo', { type });

describe('validateLogoFile', () => {
  it('accepts small PNG, JPEG and WebP images', () => {
    expect(validateLogoFile(file('image/png', 1000))).toBeNull();
    expect(validateLogoFile(file('image/jpeg', 1000))).toBeNull();
    expect(validateLogoFile(file('image/webp', 1000))).toBeNull();
  });

  it('rejects SVG and other types', () => {
    expect(validateLogoFile(file('image/svg+xml', 100))).toMatch(/PNG, JPEG or WebP/);
    expect(validateLogoFile(file('application/pdf', 100))).toMatch(/PNG, JPEG or WebP/);
  });

  it('rejects files over the size limit', () => {
    expect(validateLogoFile(file('image/png', 2 * 1024 * 1024))).toMatch(/smaller than/);
  });
});
