import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import type { AppConfigService } from '../../config/app-config.service';
import { extractBearerToken } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('hashes with Argon2id and never stores the plain text', async () => {
    const hash = await passwords.hash('Correct-horse-42');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('Correct-horse-42');
    expect(await passwords.verify(hash, 'Correct-horse-42')).toBe(true);
    expect(await passwords.verify(hash, 'wrong-password-42')).toBe(false);
    expect(passwords.needsRehash(hash)).toBe(false);
  });

  it('treats malformed hashes as a failed verification', async () => {
    expect(await passwords.verify('not-a-hash', 'anything')).toBe(false);
  });
});

describe('TokenService', () => {
  const config = {
    get: (key: string) => (key === 'JWT_ACCESS_SECRET' ? 's'.repeat(64) : undefined),
    accessTokenTtlSeconds: 900,
  } as unknown as AppConfigService;
  const tokens = new TokenService(new JwtService(), config);

  it('round-trips access tokens', () => {
    const { token, expiresIn } = tokens.signAccessToken('user-1', 'session-1');
    expect(expiresIn).toBe(900);
    expect(tokens.verifyAccessToken(token)).toMatchObject({
      sub: 'user-1',
      sid: 'session-1',
      typ: 'access',
    });
  });

  it('rejects tampered tokens and tokens signed with another secret', () => {
    const { token } = tokens.signAccessToken('user-1', 'session-1');
    expect(tokens.verifyAccessToken(`${token}x`)).toBeNull();

    const other = new JwtService().sign(
      { sub: 'u', sid: 's', typ: 'access' },
      { secret: 'x'.repeat(64) },
    );
    expect(tokens.verifyAccessToken(other)).toBeNull();
  });

  it('rejects unsigned ("alg: none") tokens', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'u', sid: 's', typ: 'access' })).toString(
      'base64url',
    );
    expect(tokens.verifyAccessToken(`${header}.${body}.`)).toBeNull();
  });

  it('generates unique refresh tokens and hashes them deterministically', () => {
    const a = tokens.generateRefreshToken();
    const b = tokens.generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(tokens.hashRefreshToken(a)).toBe(tokens.hashRefreshToken(a));
    expect(tokens.hashRefreshToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('extractBearerToken', () => {
  it('parses Authorization headers', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken('bearer abc')).toBe('abc');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
  });
});
