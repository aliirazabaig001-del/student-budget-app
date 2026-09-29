import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/app-config.service';

export const JWT_ISSUER = 'skoolledger';
export const JWT_AUDIENCE = 'skoolledger-web';

export interface AccessTokenPayload {
  /** User id. */
  sub: string;
  /** Login session (refresh-token family) id. */
  sid: string;
  typ: 'access';
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccessToken(userId: string, sessionId: string): { token: string; expiresIn: number } {
    const expiresIn = this.config.accessTokenTtlSeconds;
    const payload: AccessTokenPayload = { sub: userId, sid: sessionId, typ: 'access' };
    const token = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      algorithm: 'HS256',
      expiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return { token, expiresIn };
  }

  /** Returns the payload of a valid access token, or `null` for anything else. */
  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (payload.typ !== 'access' || !payload.sub || !payload.sid) return null;
      return payload;
    } catch {
      return null;
    }
  }

  /** 256 bits of randomness, URL-safe. Only its hash is ever stored. */
  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
