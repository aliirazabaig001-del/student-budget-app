import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { API_PREFIX, configureApp } from './app.setup';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app);

  const port = app.get(AppConfigService).get('API_PORT');
  await app.listen(port, '0.0.0.0');
  Logger.log(`SkoolLedger API listening on port ${port} (/${API_PREFIX})`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  // Configuration errors are printed plainly so installers can read them.
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
