import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Env } from './env.schema';

/** Typed access to validated configuration. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get accessTokenTtlSeconds(): number {
    return this.get('JWT_ACCESS_TTL_MINUTES') * 60;
  }

  get refreshTokenTtlMs(): number {
    return this.get('REFRESH_TOKEN_TTL_DAYS') * 24 * 60 * 60 * 1000;
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
