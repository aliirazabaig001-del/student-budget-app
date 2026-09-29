import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthDto } from '@skoolledger/shared';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

/** Version from the API package.json (present both in development and in the Docker image). */
function readVersion(): string {
  try {
    // dist/modules/health → package root in both layouts.
    const pkg = readFileSync(join(__dirname, '../../../package.json'), 'utf8');
    return (JSON.parse(pkg) as { version: string }).version;
  } catch {
    return 'unknown';
  }
}

const VERSION = readVersion();

/** Used by Docker health checks and the installer to confirm the stack is up. */
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthDto> {
    const dbUp = await this.prisma.isHealthy();
    if (!dbUp) response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: dbUp ? 'ok' : 'error',
      database: dbUp ? 'up' : 'down',
      version: VERSION,
      time: new Date().toISOString(),
    };
  }
}
