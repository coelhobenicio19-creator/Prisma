import { defineConfig, devices } from '@playwright/test';

// E2E roda contra o preview do Vercel (ou local `npm run dev`).
// Base URL via env E2E_BASE_URL (padrão: preview do Vercel).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
