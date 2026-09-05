import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:18473', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.RV_TEST_CHROMIUM },
  },
  webServer: {
    command: `"${resolve(process.env.CARGO_TARGET_DIR || 'target', 'debug/rust-visualizer')}" serve tests/fixtures/journey --port 18473 --no-open`,
    url: 'http://127.0.0.1:18473',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { OPENAI_API_KEY: '', OPENROUTER_API_KEY: '', RV_AI_PROVIDER: '', RV_AI_MODEL: '' },
  },
});
