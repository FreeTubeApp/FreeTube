import { devices, expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

export const webDesktopTest = test.extend({
  contextOptions: {
    ...devices['Desktop Firefox']
  }
})

export const webMobileTest = test.extend({
  contextOptions: {
    ...devices['LG Optimus L70']
  }
})

export const webTabletTest = test.extend({
  contextOptions: {
    ...devices['Galaxy Tab S9']
  }
})

/**
 * @param {import('@playwright/test').Page} page
 */
export async function validateAccessibility (page) {
  const violations = (await new AxeBuilder({ page }).analyze()).violations
  expect(violations).toHaveLength(0)
}
