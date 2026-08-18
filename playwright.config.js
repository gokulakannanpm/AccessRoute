import { defineConfig, devices } from '@playwright/test';

/**
 * AccessRoute Playwright End-to-End Test Configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 7000
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'node server.js',
      port: 5000,
      reuseExistingServer: true,
      timeout: 30000
    },
    {
      command: 'npm.cmd run dev',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000
    }
  ]
});
