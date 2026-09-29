import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inject } from 'vitest';

// Runs before any test file is imported, so configuration validated at import
// time (ConfigModule.forRoot) sees the test database, never the dev one.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: inject('databaseUrl'),
  UPLOAD_DIR: mkdtempSync(join(tmpdir(), 'skoolledger-uploads-')),
  TRUST_PROXY: 'loopback',
  COOKIE_SECURE: 'false',
  LOGIN_RATE_LIMIT_PER_MINUTE: '1000',
  RATE_LIMIT_PER_MINUTE: '10000',
  LOGIN_MAX_ATTEMPTS: '5',
});
