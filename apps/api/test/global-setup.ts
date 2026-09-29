import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/**
 * Creates a fresh `<database>_test` database, applies all migrations and runs
 * the seed. The development database is never touched.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const rootEnv = resolve(__dirname, '../../../.env');
  if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

  const baseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!baseUrl) throw new Error('Set DATABASE_URL or TEST_DATABASE_URL to run integration tests.');

  const url = new URL(baseUrl);
  const baseName = url.pathname.slice(1);
  const testName = process.env.TEST_DATABASE_URL ? baseName : `${baseName}_test`;
  if (!/^[a-z0-9_]+$/i.test(testName)) throw new Error(`Unsafe test database name: ${testName}`);
  url.pathname = `/${testName}`;
  const testUrl = url.toString();

  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = '/postgres';
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testName}" WITH (FORCE)`);
  await admin.$executeRawUnsafe(`CREATE DATABASE "${testName}"`);
  await admin.$disconnect();

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });

  project.provide('databaseUrl', testUrl);

  return async () => {
    const cleanup = new PrismaClient({ datasourceUrl: adminUrl.toString() });
    await cleanup.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testName}" WITH (FORCE)`);
    await cleanup.$disconnect();
  };
}
