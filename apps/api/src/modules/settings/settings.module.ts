import { Module } from '@nestjs/common';
import { SchoolsModule } from '../schools/schools.module';
import { BrandingController } from './branding.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [SchoolsModule],
  controllers: [SettingsController, BrandingController],
  providers: [SettingsService],
})
export class SettingsModule {}
