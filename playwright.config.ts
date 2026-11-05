import { defineConfig, devices } from '@playwright/test'

// Port khusus tes agar tidak bentrok dengan `npm run dev` (3000)
const PORT = 3100
const MOCK_BE_PORT = 3199
const MOCK_BE_URL = `http://localhost:${MOCK_BE_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  // Dev server mengompilasi rute saat pertama diminta, jadi beri waktu lebih
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: [
    {
      // Mock BE untuk request SSR (yang tidak bisa dicegat page.route)
      command: `node tests/e2e/support/mock-backend.mjs ${MOCK_BE_PORT}`,
      url: `${MOCK_BE_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx nuxt dev --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NUXT_PUBLIC_API_BASE: '/backend',
        NUXT_PUBLIC_BACKEND_URL: MOCK_BE_URL,
        NUXT_BACKEND_INTERNAL_URL: MOCK_BE_URL,
      },
    },
  ],
})
