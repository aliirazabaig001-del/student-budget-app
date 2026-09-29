import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Integration tests boot the real Nest application against a real PostgreSQL
 * database. They need DATABASE_URL pointing at a disposable test database;
 * see apps/api/test/README.md.
 */
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.int-spec.ts'],
    environment: 'node',
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/setup-env.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
