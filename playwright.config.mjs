/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './tests/playwright',
  testMatch: '*.spec.mjs',
  workers: 1,
  fullyParallel: false
}
