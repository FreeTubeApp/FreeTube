import { electronDesktopTest, electronMobileTest, electronTabletTest, validateAccessibility } from '../helpers.mjs'

electronDesktopTest('desktop - settings - accessibility test', async ({ page }) => {
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  // go to settings page
  await page.locator('a[href="#/settings"]').last().click()
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')
  await validateAccessibility(page)
})

electronMobileTest('mobile - settings - accessibility test', async ({ page }) => {
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  // go to settings page
  await page.locator('.moreOptionNav').click()
  await page.locator('a[href="#/settings"]').first().click()
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')
  await validateAccessibility(page)
})

electronTabletTest('tablet - settings - accessibility test', async ({ page }) => {
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')

  // go to settings page
  await page.locator('a[href="#/settings"]').last().click()
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')
  await validateAccessibility(page)
})
