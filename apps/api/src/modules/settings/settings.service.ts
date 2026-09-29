import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { School, SchoolSettings } from '@prisma/client';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type PublicBrandingDto,
  type SchoolSettingsDto,
  type SchoolSettingsValues,
} from '@skoolledger/shared';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../database/prisma.service';
import type { ActorContext } from '../../common/types/request-user';
import { detectImageType } from '../../storage/image-type';
import { StorageDriver, type StoredObject } from '../../storage/storage.driver';
import { diffValues } from '../audit/audit-values';
import { AuditService } from '../audit/audit.service';
import { SchoolsService } from '../schools/schools.service';

const SETTINGS_FIELDS = [
  'schoolName',
  'campusName',
  'address',
  'phone',
  'email',
  'currency',
  'academicSession',
  'bankName',
  'accountTitle',
  'accountNumber',
  'iban',
  'jazzCash',
  'easypaisa',
] as const satisfies readonly (keyof SchoolSettingsValues)[];

type SchoolWithSettings = School & { settings: SchoolSettings | null };

function toFlat(school: SchoolWithSettings): SchoolSettingsValues {
  const s = school.settings;
  return {
    schoolName: school.name,
    campusName: s?.campusName ?? null,
    address: s?.address ?? null,
    phone: s?.phone ?? null,
    email: s?.email ?? null,
    currency: (s?.currency ?? 'PKR') as SchoolSettingsValues['currency'],
    academicSession: s?.academicSession ?? null,
    bankName: s?.bankName ?? null,
    accountTitle: s?.accountTitle ?? null,
    accountNumber: s?.accountNumber ?? null,
    iban: s?.iban ?? null,
    jazzCash: s?.jazzCash ?? null,
    easypaisa: s?.easypaisa ?? null,
  };
}

function toDto(school: SchoolWithSettings): SchoolSettingsDto {
  return {
    schoolId: school.id,
    ...toFlat(school),
    hasLogo: Boolean(school.settings?.logoKey),
    logoUpdatedAt: school.settings?.logoUpdatedAt?.toISOString() ?? null,
    updatedAt: (school.settings?.updatedAt ?? school.updatedAt).toISOString(),
  };
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageDriver,
    private readonly audit: AuditService,
    private readonly schools: SchoolsService,
    private readonly config: AppConfigService,
  ) {}

  async get(schoolId: string): Promise<SchoolSettingsDto> {
    return toDto(await this.load(schoolId));
  }

  async update(
    schoolId: string,
    input: SchoolSettingsValues,
    actor: ActorContext,
  ): Promise<SchoolSettingsDto> {
    const before = await this.load(schoolId);
    const { schoolName, ...settings } = input;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.school.update({ where: { id: schoolId }, data: { name: schoolName } });
      await tx.schoolSettings.upsert({
        where: { schoolId },
        create: { schoolId, ...settings, updatedById: actor.user.id },
        update: { ...settings, updatedById: actor.user.id },
      });

      const changes = diffValues(toFlat(before), input, SETTINGS_FIELDS);
      if (changes.newValues) {
        await this.audit.record(
          {
            action: AUDIT_ACTIONS.SETTINGS_UPDATED,
            entity: AUDIT_ENTITIES.SCHOOL,
            entityId: schoolId,
            schoolId,
            actorId: actor.user.id,
            ...changes,
            context: actor,
          },
          tx,
        );
      }
      return tx.school.findUniqueOrThrow({ where: { id: schoolId }, include: { settings: true } });
    });

    return toDto(updated);
  }

  async uploadLogo(
    schoolId: string,
    file: Express.Multer.File | undefined,
    actor: ActorContext,
  ): Promise<SchoolSettingsDto> {
    if (!file || file.size === 0) throw new BadRequestException('Please choose an image file.');
    const maxBytes = this.config.get('LOGO_MAX_BYTES');
    if (file.size > maxBytes) {
      throw new PayloadTooLargeException(
        `The logo must be smaller than ${Math.round(maxBytes / 1024)} KB.`,
      );
    }
    const type = detectImageType(file.buffer);
    if (!type) {
      throw new UnsupportedMediaTypeException('The logo must be a PNG, JPEG or WebP image.');
    }

    const before = await this.load(schoolId);
    const key = `logos/${schoolId}/${randomUUID()}.${type.extension}`;
    await this.storage.put(key, file.buffer, type.mimeType);

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        await tx.schoolSettings.upsert({
          where: { schoolId },
          create: {
            schoolId,
            logoKey: key,
            logoMimeType: type.mimeType,
            logoUpdatedAt: now,
            updatedById: actor.user.id,
          },
          update: {
            logoKey: key,
            logoMimeType: type.mimeType,
            logoUpdatedAt: now,
            updatedById: actor.user.id,
          },
        });
        await this.audit.record(
          {
            action: AUDIT_ACTIONS.SETTINGS_LOGO_UPDATED,
            entity: AUDIT_ENTITIES.SCHOOL,
            entityId: schoolId,
            schoolId,
            actorId: actor.user.id,
            previousValues: { hasLogo: Boolean(before.settings?.logoKey) },
            newValues: { hasLogo: true, mimeType: type.mimeType, sizeBytes: file.size },
            context: actor,
          },
          tx,
        );
        return tx.school.findUniqueOrThrow({
          where: { id: schoolId },
          include: { settings: true },
        });
      });

      if (before.settings?.logoKey) await this.storage.delete(before.settings.logoKey);
      return toDto(updated);
    } catch (error) {
      await this.storage.delete(key);
      throw error;
    }
  }

  async removeLogo(schoolId: string, actor: ActorContext): Promise<SchoolSettingsDto> {
    const before = await this.load(schoolId);
    const oldKey = before.settings?.logoKey;
    if (!oldKey) return toDto(before);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.schoolSettings.update({
        where: { schoolId },
        data: {
          logoKey: null,
          logoMimeType: null,
          logoUpdatedAt: new Date(),
          updatedById: actor.user.id,
        },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.SETTINGS_LOGO_REMOVED,
          entity: AUDIT_ENTITIES.SCHOOL,
          entityId: schoolId,
          schoolId,
          actorId: actor.user.id,
          previousValues: { hasLogo: true },
          newValues: { hasLogo: false },
          context: actor,
        },
        tx,
      );
      return tx.school.findUniqueOrThrow({ where: { id: schoolId }, include: { settings: true } });
    });

    await this.storage.delete(oldKey);
    return toDto(updated);
  }

  async getPublicBranding(): Promise<PublicBrandingDto> {
    const school = await this.schools.getPrimarySchool();
    return {
      schoolName: school?.name ?? null,
      campusName: school?.settings?.campusName ?? null,
      hasLogo: Boolean(school?.settings?.logoKey),
      logoUpdatedAt: school?.settings?.logoUpdatedAt?.toISOString() ?? null,
    };
  }

  async getPublicLogo(): Promise<(StoredObject & { mimeType: string }) | null> {
    const school = await this.schools.getPrimarySchool();
    const key = school?.settings?.logoKey;
    const mimeType = school?.settings?.logoMimeType;
    if (!key || !mimeType) return null;
    const object = await this.storage.get(key);
    return object ? { ...object, mimeType } : null;
  }

  private async load(schoolId: string): Promise<SchoolWithSettings> {
    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      include: { settings: true },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }
}
