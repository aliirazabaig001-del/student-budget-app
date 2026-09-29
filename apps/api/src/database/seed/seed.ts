import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import {
  CURRENCY_CODES,
  PERMISSION_DEFINITIONS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_KEYS,
  emailSchema,
  passwordSchema,
  usernameSchema,
} from '@skoolledger/shared';
import { PasswordService } from '../../modules/auth/password.service';

export interface SeedOptions {
  schoolName: string;
  currency: string;
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  /** When empty a strong random password is generated and printed once. */
  adminPassword?: string;
}

export interface SeedResult {
  permissions: number;
  roles: number;
  createdSchool: boolean;
  createdAdmin: { username: string; email: string; generatedPassword: string | null } | null;
}

/**
 * Idempotent seed. Safe to run on every start-up:
 * - permissions and built-in roles are synchronised with `@skoolledger/shared`;
 * - the first school and Super Admin are created only on an empty database.
 */
export async function runSeed(prisma: PrismaClient, options: SeedOptions): Promise<SeedResult> {
  const result: SeedResult = {
    permissions: 0,
    roles: 0,
    createdSchool: false,
    createdAdmin: null,
  };

  await prisma.$transaction(async (tx) => {
    for (const def of PERMISSION_DEFINITIONS) {
      await tx.permission.upsert({
        where: { code: def.code },
        create: { code: def.code, module: def.module, description: def.description },
        update: { module: def.module, description: def.description },
      });
    }
    // Permissions removed from the catalogue are removed from every role.
    await tx.permission.deleteMany({
      where: { code: { notIn: PERMISSION_DEFINITIONS.map((p) => p.code) } },
    });
    result.permissions = PERMISSION_DEFINITIONS.length;

    const permissionIds = new Map(
      (await tx.permission.findMany({ select: { id: true, code: true } })).map((p) => [
        p.code,
        p.id,
      ]),
    );

    for (const def of SYSTEM_ROLES) {
      const role = await tx.role.upsert({
        where: { key: def.key },
        create: { key: def.key, name: def.name, description: def.description, isSystem: true },
        update: { name: def.name, description: def.description, isSystem: true, deletedAt: null },
      });
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
      await tx.rolePermission.createMany({
        data: def.permissions.map((code) => ({
          roleId: role.id,
          permissionId: permissionIds.get(code)!,
        })),
      });
    }
    result.roles = SYSTEM_ROLES.length;
  });

  let school = await prisma.school.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!school) {
    const currency = (CURRENCY_CODES as readonly string[]).includes(options.currency)
      ? options.currency
      : 'PKR';
    school = await prisma.school.create({
      data: { name: options.schoolName, settings: { create: { currency } } },
    });
    result.createdSchool = true;
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const email = emailSchema.parse(options.adminEmail);
    const username = usernameSchema.parse(options.adminUsername);
    const generatedPassword = options.adminPassword ? null : generatePassword();
    const password = passwordSchema.parse(options.adminPassword || generatedPassword);
    const passwordHash = await new PasswordService().hash(password);
    const superAdmin = await prisma.role.findUniqueOrThrow({
      where: { key: SYSTEM_ROLE_KEYS.SUPER_ADMIN },
    });

    await prisma.user.create({
      data: {
        schoolId: school.id,
        fullName: options.adminFullName,
        email,
        username,
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
        roles: { create: [{ roleId: superAdmin.id }] },
      },
    });
    result.createdAdmin = { username, email, generatedPassword };
  }

  return result;
}

/** 16 random characters from an unambiguous alphabet, plus a guaranteed letter/digit. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${body}a7`;
}
