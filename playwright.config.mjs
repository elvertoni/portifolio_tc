import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'line',
  use: {
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  }
});
