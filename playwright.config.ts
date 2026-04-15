/**
 * Web smoke tests for the static Expo web export.
 *
 * Prerequisite: run `npm run build` (outputs to `dist/`).
 * Then: `npm run test:e2e` — Playwright starts `scripts/static-e2e-server.mjs` (SPA fallback, sandbox-safe).
 * CI / one-shot: `npm run test:e2e:ci` builds then runs tests.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node ./scripts/static-e2e-server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
