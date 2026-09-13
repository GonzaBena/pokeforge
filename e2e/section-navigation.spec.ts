import { test, expect } from '@playwright/test'

test.describe('Section Navigation & Scroll Clearance on Mobile', () => {
  test('mobile: clicking section index buttons scrolls section into view without being covered by mobile bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/')

    const mobileBar = page.locator('.dashboard-mobile-bar')
    await expect(mobileBar).toBeVisible()
    const mobileBarBox = await mobileBar.boundingBox()
    expect(mobileBarBox).not.toBeNull()
    const mobileBarBottom = mobileBarBox!.y + mobileBarBox!.height

    // 1. Click on #active-team chip
    await page.locator('.dashboard-index-chip[href="#active-team"]').click()
    await page.waitForTimeout(400)

    const activeTeam = page.locator('#active-team')
    await expect(activeTeam).toBeVisible()
    const activeTeamBox = await activeTeam.boundingBox()
    expect(activeTeamBox).not.toBeNull()

    // The top of the active team section must NOT be covered by the mobile bar
    // It should be at or below the bottom of the sticky mobile bar
    expect(activeTeamBox!.y).toBeGreaterThanOrEqual(mobileBarBottom - 2)

    // 2. Click on #game-progress chip
    await page.locator('.dashboard-index-chip[href="#game-progress"]').click()
    await page.waitForTimeout(400)

    const gameProgress = page.locator('#game-progress')
    await expect(gameProgress).toBeVisible()
    const gameProgressTitle = page.locator('#game-progress .dashboard-section__title')
    const titleBox = await gameProgressTitle.boundingBox()
    expect(titleBox).not.toBeNull()
    expect(titleBox!.y).toBeGreaterThanOrEqual(mobileBarBottom - 2)

    // Verify element at title center is the title itself or its text, NOT the mobile bar
    const elAtTitle = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y)
        const mobileBarEl = document.querySelector('.dashboard-mobile-bar')
        return { isMobileBar: mobileBarEl?.contains(el) || el === mobileBarEl }
      },
      { x: titleBox!.x + 20, y: titleBox!.y + titleBox!.height / 2 }
    )
    expect(elAtTitle.isMobileBar).toBe(false)
  })

  test('mobile: sidebar subnav links scroll to settings sections without being covered', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/settings/')

    const mobileBar = page.locator('.dashboard-mobile-bar')
    const mobileBarBox = await mobileBar.boundingBox()
    const mobileBarBottom = mobileBarBox!.y + mobileBarBox!.height

    // Open sidebar
    await page.locator('[data-sidebar-toggle]').click()
    await expect(page.locator('[data-dashboard-sidebar]')).toHaveClass(/is-open/)

    // Click data management section link
    await page.locator('[data-section-link="data"]').click()
    await page.waitForTimeout(400)

    const dataSection = page.locator('#data')
    await expect(dataSection).toBeVisible()
    const dataBox = await dataSection.boundingBox()
    expect(dataBox).not.toBeNull()
    expect(dataBox!.y).toBeGreaterThanOrEqual(mobileBarBottom - 2)
  })

  test('mobile: direct URL load with hash positions section below mobile bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard/#active-team')
    await page.waitForTimeout(400)

    const mobileBar = page.locator('.dashboard-mobile-bar')
    const mobileBarBox = await mobileBar.boundingBox()
    const mobileBarBottom = mobileBarBox!.y + mobileBarBox!.height

    const activeTeam = page.locator('#active-team')
    await expect(activeTeam).toBeVisible()
    const activeTeamBox = await activeTeam.boundingBox()
    expect(activeTeamBox).not.toBeNull()
    expect(activeTeamBox!.y).toBeGreaterThanOrEqual(mobileBarBottom - 2)
  })

  test('mobile (es): subnav link from sidebar scrolls to game-progress with clear visibility', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/es/dashboard/')

    const mobileBar = page.locator('.dashboard-mobile-bar')
    const mobileBarBox = await mobileBar.boundingBox()
    const mobileBarBottom = mobileBarBox!.y + mobileBarBox!.height

    // Open sidebar and click game-progress subnav link
    await page.locator('[data-sidebar-toggle]').click()
    await page.locator('[data-section-link="game-progress"]').click()
    await page.waitForTimeout(400)

    const gameProgressTitle = page.locator('#game-progress .dashboard-section__title')
    await expect(gameProgressTitle).toBeVisible()
    const titleBox = await gameProgressTitle.boundingBox()
    expect(titleBox).not.toBeNull()
    expect(titleBox!.y).toBeGreaterThanOrEqual(mobileBarBottom - 2)
  })

  test('desktop & children: smooth scroll is active on /dashboard and /dashboard/settings', async ({ page }) => {
    // Check root /dashboard
    await page.goto('/dashboard/')
    const htmlScrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior
    })
    expect(htmlScrollBehavior).toBe('smooth')

    const sidebarScrollBehavior = await page.evaluate(() => {
      const sidebar = document.querySelector('.dashboard-sidebar')
      return sidebar ? window.getComputedStyle(sidebar).scrollBehavior : null
    })
    expect(sidebarScrollBehavior).toBe('smooth')

    // Check child route /dashboard/settings
    await page.goto('/dashboard/settings/')
    const settingsHtmlScrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior
    })
    expect(settingsHtmlScrollBehavior).toBe('smooth')

    // Check Spanish child route /es/dashboard/settings
    await page.goto('/es/dashboard/settings/')
    const esSettingsHtmlScrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior
    })
    expect(esSettingsHtmlScrollBehavior).toBe('smooth')
  })
})

