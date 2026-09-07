import { defineConfig, devices } from '@playwright/test';

// In this managed environment Chromium is pre-installed and Playwright's own download
// is skipped, so we point at the pre-installed binary when PW_EXECUTABLE_PATH is set.
// On a normal machine, run `npx playwright install chromium` and leave it unset.
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;

const PORT = Number(process.env.E2E_PORT || 4174);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath, args: ['--no-sandbox'] } },
    },
  ],
  // Runs the app in DEVELOPMENT mode (no production secure-backend guard) so the SPA renders
  // without a live backend; the backend is stubbed per-test via page.route (see e2e/mock-backend.js).
  webServer: {
    command: `npm run dev -- --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { VITE_BACKEND_URL: 'http://127.0.0.1:5000' },
  },
});
