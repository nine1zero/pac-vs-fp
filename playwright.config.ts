import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/pac-vs-fp/`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // la build vera, con la CSP: in sviluppo la CSP non c'è
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}/pac-vs-fp/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
