import { test, expect } from '@playwright/test'

test.describe('Settings Back Button & Mobile Layout', () => {
  test('mobile: back button is styled, not covered by mobile bar, and navigates back', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/settings/')

    const backBtn = page.locator('.settings-back-btn')
    await expect(backBtn).toBeVisible()

    // Verify back button has proper styles applied (not unstyled inline text)
    const btnStyles = await backBtn.evaluate((el) => {
      const s = window.getComputedStyle(el)
      return {
        display: s.display,
        borderRadius: s.borderRadius,
        paddingLeft: parseFloat(s.paddingLeft),
        paddingRight: parseFloat(s.paddingRight),
      }
    })

    expect(['flex', 'inline-flex']).toContain(btnStyles.display)
    expect(btnStyles.paddingLeft).toBeGreaterThan(0)
    expect(btnStyles.paddingRight).toBeGreaterThan(0)

    // Verify back button is NOT covered or overlapped by .dashboard-mobile-bar
    const box = await backBtn.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      const isTopElement = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y)
          const target = document.querySelector('.settings-back-btn')
          return el === target || target?.contains(el)
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      )
      expect(isTopElement).toBe(true)
    }

    // Clicking navigates back to dashboard
    await backBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/?$/)
  })

  test('mobile (es): back button in Spanish works and is not obstructed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/es/dashboard/settings/')

    const backBtn = page.locator('.settings-back-btn')
    await expect(backBtn).toBeVisible()
    await expect(backBtn).toContainText(/Volver al Dashboard/i)

    const box = await backBtn.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      const isTopElement = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y)
          const target = document.querySelector('.settings-back-btn')
          return el === target || target?.contains(el)
        },
        { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      )
      expect(isTopElement).toBe(true)
    }

    await backBtn.click()
    await expect(page).toHaveURL(/\/es\/dashboard\/?$/)
  })

  test('desktop: back button is styled and clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard/settings/')

    const backBtn = page.locator('.settings-back-btn')
    await expect(backBtn).toBeVisible()

    await backBtn.click()
    await expect(page).toHaveURL(/\/dashboard\/?$/)
  })
})
