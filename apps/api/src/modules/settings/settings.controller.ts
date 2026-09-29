import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PERMISSIONS, schoolSettingsSchema, type SchoolSettingsValues } from '@skoolledger/shared';
import { Actor, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { ActorContext, RequestUser } from '../../common/types/request-user';
import { SettingsService } from './settings.service';

/** Hard ceiling for the multipart parser; the configurable limit is checked in the service. */
const UPLOAD_HARD_LIMIT_BYTES = 5 * 1024 * 1024;

@Controller('settings/school')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_READ)
  get(@CurrentUser() user: RequestUser) {
    return this.settings.get(user.schoolId);
  }

  @Put()
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  update(
    @Body(new ZodValidationPipe(schoolSettingsSchema)) body: SchoolSettingsValues,
    @Actor() actor: ActorContext,
  ) {
    return this.settings.update(actor.user.schoolId, body, actor);
  }

  @Post('logo')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @UseInterceptors(
    // No `dest`/`storage`: Multer keeps the file in memory so its bytes can be
    // inspected before anything is written to disk.
    FileInterceptor('file', {
      limits: { fileSize: UPLOAD_HARD_LIMIT_BYTES, files: 1, fields: 0 },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File | undefined, @Actor() actor: ActorContext) {
    return this.settings.uploadLogo(actor.user.schoolId, file, actor);
  }

  @Delete('logo')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  removeLogo(@Actor() actor: ActorContext) {
    return this.settings.removeLogo(actor.user.schoolId, actor);
  }
}
