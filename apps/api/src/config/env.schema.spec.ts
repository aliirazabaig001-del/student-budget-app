import { describe, expect, it } from 'vitest';
import { parseTrustProxy, validateEnv } from './env.schema';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
};

describe('validateEnv', () => {
  it('applies secure defaults', () => {
    const env = validateEnv(valid);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.JWT_ACCESS_TTL_MINUTES).toBe(15);
    expect(env.LOGIN_MAX_ATTEMPTS).toBe(5);
  });

  it('rejects a missing or short JWT secret', () => {
    expect(() => validateEnv({ DATABASE_URL: valid.DATABASE_URL })).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => validateEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('rejects the placeholder secret from .env.example', () => {
    expect(() =>
      validateEnv({ ...valid, JWT_ACCESS_SECRET: 'change-me-generate-a-long-random-secret' }),
    ).toThrow(/placeholder/);
  });

  it('parses boolean flags strictly', () => {
    expect(validateEnv({ ...valid, COOKIE_SECURE: 'true' }).COOKIE_SECURE).toBe(true);
    expect(() => validateEnv({ ...valid, COOKIE_SECURE: 'yes' })).toThrow();
  });
});

describe('parseTrustProxy', () => {
  it('converts numbers and booleans', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('loopback')).toBe('loopback');
  });
});
