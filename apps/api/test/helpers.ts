import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import type { LoginResponse } from '@skoolledger/shared';
import request from 'supertest';
import { inject } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { runSeed } from '../src/database/seed/seed';

export const ADMIN = {
  username: 'admin',
  email: 'admin@test.local',
  initialPassword: 'Initial-pass-2026',
  password: 'Admin-pass-2026!',
};

export const CLIENT_HEADER = { 'X-SkoolLedger-Client': 'web' };

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  http: () => ReturnType<typeof request>;
}

/**
 * Boots the complete application (same guards, filters and HTTP settings as
 * production) against the throwaway test database.
 */
export async function createTestApp(): Promise<TestContext> {
  const databaseUrl = inject('databaseUrl');

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  await runSeed(prisma, {
    schoolName: 'Test School',
    currency: 'PKR',
    adminFullName: 'Test Admin',
    adminEmail: ADMIN.email,
    adminUsername: ADMIN.username,
    adminPassword: ADMIN.initialPassword,
  });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ bodyParser: false, logger: ['error'] });
  configureApp(app);
  await app.init();

  return { app, prisma, http: () => request(app.getHttpServer()) };
}

export async function login(
  ctx: TestContext,
  identifier: string,
  password: string,
): Promise<{ token: string; cookie: string; body: LoginResponse }> {
  const res = await ctx.http().post('/api/v1/auth/login').send({ identifier, password });
  if (res.status !== 200)
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(res.body)}`);
  return { token: res.body.accessToken, cookie: refreshCookie(res), body: res.body };
}

/** Logs in as the seeded admin, changing the initial password on first use. */
export async function loginAdmin(ctx: TestContext): Promise<{ token: string; cookie: string }> {
  const user = await ctx.prisma.user.findUniqueOrThrow({ where: { username: ADMIN.username } });
  if (!user.mustChangePassword) return login(ctx, ADMIN.username, ADMIN.password);

  const first = await login(ctx, ADMIN.username, ADMIN.initialPassword);
  const res = await ctx
    .http()
    .post('/api/v1/auth/change-password')
    .set('Authorization', `Bearer ${first.token}`)
    .send({
      currentPassword: ADMIN.initialPassword,
      newPassword: ADMIN.password,
      confirmPassword: ADMIN.password,
    });
  if (res.status !== 200) throw new Error(`Password change failed: ${JSON.stringify(res.body)}`);
  return { token: res.body.accessToken, cookie: first.cookie };
}

export function refreshCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((c) => c.startsWith('sl_refresh='));
  return cookie ? cookie.split(';')[0]! : '';
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Creates a user through the API (so the audit trail is exercised) and signs them in. */
export async function createUserAndLogin(
  ctx: TestContext,
  adminToken: string,
  roleKey: string,
  suffix: string,
): Promise<{ id: string; token: string; username: string; password: string }> {
  const password = `Pass-${suffix}-2026`;
  const username = `${roleKey.replace('_', '')}.${suffix}`;
  const res = await ctx
    .http()
    .post('/api/v1/users')
    .set(bearer(adminToken))
    .send({
      fullName: `Test ${roleKey} ${suffix}`,
      email: `${username}@test.local`,
      username,
      password,
      roleKeys: [roleKey],
      mustChangePassword: false,
    });
  if (res.status !== 201) throw new Error(`Create user failed: ${JSON.stringify(res.body)}`);
  const session = await login(ctx, username, password);
  return { id: res.body.id, token: session.token, username, password };
}
