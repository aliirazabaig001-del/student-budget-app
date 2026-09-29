import { pipeline } from 'node:stream/promises';
import { Controller, Get, Logger, NotFoundException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SettingsService } from './settings.service';

/**
 * Unauthenticated branding for the sign-in screen: school name and logo only.
 * Nothing sensitive (bank details, contact info) is exposed here.
 */
@Public()
@Controller('public/branding')
export class BrandingController {
  private readonly logger = new Logger(BrandingController.name);

  constructor(private readonly settings: SettingsService) {}

  @Get()
  branding() {
    return this.settings.getPublicBranding();
  }

  @Get('logo')
  async logo(@Res() response: Response): Promise<void> {
    const logo = await this.settings.getPublicLogo();
    if (!logo) throw new NotFoundException('No logo uploaded');

    response.setHeader('Content-Type', logo.mimeType);
    response.setHeader('Content-Length', String(logo.size));
    // The web app appends ?v=<logoUpdatedAt>, so a changed logo gets a new URL.
    response.setHeader('Cache-Control', 'public, max-age=86400');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      await pipeline(logo.stream, response);
    } catch (error) {
      // Client disconnects are normal; anything else is logged.
      if ((error as NodeJS.ErrnoException).code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        this.logger.warn(`Logo stream failed: ${(error as Error).message}`);
      }
    }
  }
}
