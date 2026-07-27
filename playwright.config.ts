import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour la maquette OASE.
 *
 * URLs attendues :
 *   - Frontend : http://localhost:5173
 *   - Backend  : http://localhost:3000 (proxyé par Vite via /api)
 *
 * Les tests utilisent principalement des mocks réseau (page.route) pour
 * garantir la reproductibilité, mais la configuration reste compatible avec
 * un backend réel si TEST_BASE_URL est positionné.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e-report' }],
    ['junit', { outputFile: 'e2e-report/results.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  // Les specs de recette (e2e/recette/) enchaînent de longs parcours UI + sondes API
  // sur un backend réel : le timeout par défaut (30 s) est insuffisant en charge.
  timeout: 120000,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox peut être activé si besoin ; il nécessite généralement workers=1 avec le dev server Vite.
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
})
