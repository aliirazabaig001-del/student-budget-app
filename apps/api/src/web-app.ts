import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { API_PREFIX } from './app.setup';

/**
 * Serves the built React app from WEB_DIST_DIR on the same origin as the API,
 * with index.html as the fallback for client-side routes. Same-origin serving
 * keeps the refresh cookie `SameSite=Strict` and needs no CORS.
 */
export function serveWebApp(app: NestExpressApplication, webDistDir: string | undefined): void {
  if (!webDistDir) return;
  const root = resolve(webDistDir);
  const indexHtml = join(root, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(`WEB_DIST_DIR is set but ${indexHtml} does not exist. Run "pnpm build" first.`);
  }

  // Hashed build assets can be cached for a long time; index.html never is.
  app.useStaticAssets(root, {
    index: false,
    setHeaders: (response, path) => {
      response.setHeader(
        'Cache-Control',
        path.includes(`${join(root, 'assets')}`)
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      );
    },
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const isApi = request.path === `/${API_PREFIX}` || request.path.startsWith(`/${API_PREFIX}/`);
    if (isApi || (request.method !== 'GET' && request.method !== 'HEAD')) return next();
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(indexHtml);
  });
  Logger.log(`Serving web app from ${root}`, 'WebApp');
}
