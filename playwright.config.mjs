/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './e2e',
  testMatch: '*.e2e.mjs',
  // retries: 1,
  fullyParallel: true,
  use: {
    headless: !!process.env.CI,
    baseURL: 'http://localhost:9080'
  },
  webServer: {
    command: 'npm run dev:web-noopen',
    url: 'http://localhost:9080',
  },
}
