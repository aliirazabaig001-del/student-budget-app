import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { API_PREFIX, configureApp } from './app.setup';
import { AppConfigService } from './config/app-config.service';
import { serveWebApp } from './web-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app);

  const config = app.get(AppConfigService);
  serveWebApp(app, config.get('WEB_DIST_DIR'));

  const port = config.get('API_PORT');
  await app.listen(port, '0.0.0.0');
  Logger.log(`SkoolLedger API listening on port ${port} (/${API_PREFIX})`, 'Bootstrap');
  const appUrl = config.get('APP_URL');
  if (appUrl) Logger.log(`Public address: ${appUrl}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  // Configuration errors are printed plainly so installers can read them.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
