import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a running SkoolLedger installation:
 *   E2E_BASE_URL=http://localhost pnpm test:e2e        (Docker stack)
 *   E2E_BASE_URL=http://localhost:5173 pnpm test:e2e   (dev servers)
 * See apps/web/e2e/README.md for the required credentials.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
          : {},
      },
    },
  ],
});
