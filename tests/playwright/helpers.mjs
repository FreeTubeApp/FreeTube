import { devices, expect, test, _electron as electron } from '@playwright/test'
import { join } from 'path'
import { AxeBuilder } from '@axe-core/playwright'

const mainJs = join(import.meta.dirname, '../../dist/main.js')

/**
 *
 * @param {string} name
 * @param {import('@playwright/test').ViewportSize} viewPortSize
 * @param {(function({ app: import('@playwright/test').ElectronApplication, page: import('@playwright/test').Page }) : Promise<void>)} func
*/
const electronTest = async (name, viewPortSize, func) => {
  // eslint-disable-next-line playwright/expect-expect, playwright/valid-title
  test(name, async () => {
    const electronApp = await electron.launch({ args: [mainJs] })
    const page = await electronApp.firstWindow()
    page.setViewportSize(viewPortSize)

    await func({ app: electronApp, page })

    await electronApp.close()
  })
}

/**
 * @param {string} name
 * @param {(function({ app: import('@playwright/test').ElectronApplication, page: import('@playwright/test').Page }) : Promise<void>)} func
*/
export const electronDesktopTest = async (name, func) => {
  await electronTest(name, devices['Desktop Firefox'].viewport, func)
}

/**
 * @param {string} name
 * @param {(function({ app: import('@playwright/test').ElectronApplication, page: import('@playwright/test').Page }) : Promise<void>)} func
*/
export const electronMobileTest = async (name, func) => {
  await electronTest(name, devices['LG Optimus L70'].viewport, func)
}

/**
 * @param {string} name
 * @param {(function({ app: import('@playwright/test').ElectronApplication, page: import('@playwright/test').Page }) : Promise<void>)} func
*/
export const electronTabletTest = async (name, func) => {
  await electronTest(name, devices['Galaxy Tab S9'].viewport, func)
}

/**
 * @param {import('@playwright/test').Page} page
 */
export async function validateAccessibility (page) {
  const axeResults = await new AxeBuilder({ page })
    .setLegacyMode(true)
    .analyze()

  expect(axeResults.violations).toHaveLength(0)
}
