import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report-prod' }], ['list']],
  timeout: 45_000,

  use: {
    baseURL: 'https://freshly.web.id',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: false,
  },

  projects: [
    // ── Auth setup — login via UI, save storageState ──
    {
      name: 'prod-setup',
      testMatch: /prod-auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // ── Public pages (no auth) ──
    {
      name: 'prod-public',
      testMatch: /prod-smoke\.spec\.ts|seo-branding\.spec\.ts|public-pages\.spec\.ts|prod-auth-form\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // ── Mobile smoke ──
    {
      name: 'prod-mobile',
      testMatch: /prod-smoke\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
    // ── Authenticated admin tests ──
    {
      name: 'prod-authenticated',
      testMatch: /prod-admin-.*\.spec\.ts|prod-auth-flow\.spec\.ts|prod-user-profile-submit\.spec\.ts|prod-newsletter-subscribe\.spec\.ts/,
      dependencies: ['prod-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/prod-admin.json',
      },
    },
  ],
});
