import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { runSeed } from './seed';

// In development the variables live in the repository-level .env file; in
// Docker they are injected by Compose.
for (const candidate of ['.env', '../../.env']) {
  const path = resolve(process.cwd(), candidate);
  if (existsSync(path)) {
    process.loadEnvFile(path);
    break;
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await runSeed(prisma, {
      schoolName: process.env.INITIAL_SCHOOL_NAME || 'My School',
      currency: process.env.INITIAL_CURRENCY || 'PKR',
      adminFullName: process.env.INITIAL_ADMIN_NAME || 'System Administrator',
      adminEmail: process.env.INITIAL_ADMIN_EMAIL || 'admin@skoolledger.local',
      adminUsername: process.env.INITIAL_ADMIN_USERNAME || 'admin',
      adminPassword: process.env.INITIAL_ADMIN_PASSWORD || undefined,
    });

    console.log(
      `[seed] ${result.permissions} permissions and ${result.roles} roles are up to date.`,
    );
    if (result.createdSchool) console.log('[seed] Created the school record.');
    if (result.createdAdmin) {
      const { username, email, generatedPassword } = result.createdAdmin;
      console.log('');
      console.log('==============================================================');
      console.log(' SkoolLedger first administrator account created');
      console.log(`   Username: ${username}`);
      console.log(`   Email:    ${email}`);
      console.log(
        generatedPassword
          ? `   Password: ${generatedPassword}   (generated — shown only once)`
          : '   Password: the INITIAL_ADMIN_PASSWORD value from your .env file',
      );
      console.log(' You will be asked to choose a new password on first sign-in.');
      console.log('==============================================================');
      console.log('');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[seed] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
