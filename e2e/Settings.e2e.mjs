import { webDesktopTest, webMobileTest, webTabletTest, validateAccessibility } from './helpers.mjs'

webDesktopTest('desktop - settings - accessibility test', async ({ page }) => {
  await page.goto('#/settings')

  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  await validateAccessibility(page)
})

webMobileTest('mobile - settings - accessibility test', async ({ page }) => {
  await page.goto('#/settings')

  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  await validateAccessibility(page)
})

webTabletTest('tablet - settings - accessibility test', async ({ page }) => {
  await page.goto('#/settings')

  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  await validateAccessibility(page)
})
