import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppConfigService } from './config/app-config.service';
import { parseTrustProxy } from './config/env.schema';

export const API_PREFIX = 'api/v1';

/**
 * HTTP-level configuration shared by `main.ts` and the integration tests, so
 * tests exercise exactly the same security settings as production.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);
  const express = app as NestExpressApplication;

  express.set('trust proxy', parseTrustProxy(config.get('TRUST_PROXY')));
  express.disable('x-powered-by');

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  express.useBodyParser('json', { limit: '1mb' });

  const origins = config.corsOrigins;
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  }

  app.enableShutdownHooks();
}
