import { test, expect } from '@playwright/test'

test.describe('Pokédex Combined Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pokedex')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Wait for the grid to have initial cards rendered
    await expect(page.locator('[data-pokedex-grid] .pokemon-card').first()).toBeVisible()
  })

  test('filters by text search and type simultaneously', async ({ page }) => {
    // 1. Type "char" in search input
    const searchInput = page.locator('[data-search-input]')
    await searchInput.fill('char')

    // 2. Open filters panel
    const filterToggle = page.locator('[data-filter-toggle]')
    await filterToggle.click()
    const filtersPanel = page.locator('[data-filters-panel]')
    await expect(filtersPanel).toBeVisible()

    // 3. Select Fire type
    const fireChip = page.locator('[data-type-filter] button[data-type="fire"]')
    await fireChip.click()
    await expect(fireChip).toHaveAttribute('aria-pressed', 'true')

    // 4. Verify filtered cards: must only include Fire Pokémon with "char" in name
    const cards = page.locator('[data-pokedex-grid] .pokemon-card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      const name = (await card.locator('.pokemon-card__name').textContent())?.toLowerCase()
      expect(name).toContain('char')
      const types = await card.locator('.pokemon-card__types').textContent()
      expect(types?.toLowerCase()).toContain('fire')
    }
  })

  test('toggles type match mode between OR and AND with dual types', async ({ page }) => {
    // Open filters panel
    await page.locator('[data-filter-toggle]').click()

    // Select Grass and Poison types
    const grassChip = page.locator('[data-type-filter] button[data-type="grass"]')
    const poisonChip = page.locator('[data-type-filter] button[data-type="poison"]')
    await grassChip.click()
    await poisonChip.click()

    // 1. In default OR mode: should show pure grass, pure poison, or dual
    const orBtn = page.locator('[data-type-mode-toggle] button[data-type-mode="or"]')
    await expect(orBtn).toHaveAttribute('aria-pressed', 'true')
    const orCount = await page.locator('[data-pokedex-grid] .pokemon-card').count()
    expect(orCount).toBeGreaterThan(0)

    // 2. Switch to AND mode: should only show Pokémon that are BOTH Grass and Poison
    const andBtn = page.locator('[data-type-mode-toggle] button[data-type-mode="and"]')
    await andBtn.click()
    await expect(andBtn).toHaveAttribute('aria-pressed', 'true')

    const andCards = page.locator('[data-pokedex-grid] .pokemon-card')
    const andCount = await andCards.count()
    expect(andCount).toBeGreaterThan(0)
    expect(andCount).toBeLessThan(orCount)

    // Verify first few cards are dual Grass/Poison
    for (let i = 0; i < Math.min(andCount, 5); i++) {
      const typesText = (
        await andCards.nth(i).locator('.pokemon-card__types').textContent()
      )?.toLowerCase()
      expect(typesText).toContain('grass')
      expect(typesText).toContain('poison')
    }
  })

  test('combines Generation and Type filters', async ({ page }) => {
    // Open filters panel
    await page.locator('[data-filter-toggle]').click()

    // Filter by Generation 1
    const gen1Chip = page.locator('[data-generation-filter] button[data-generation="generation-i"]')
    await gen1Chip.click()
    await expect(gen1Chip).toHaveAttribute('aria-pressed', 'true')

    // Filter by Electric type
    const electricChip = page.locator('[data-type-filter] button[data-type="electric"]')
    await electricChip.click()

    // Grid should contain Gen 1 Electric Pokémon (Pikachu, Raichu, Magnemite, Magneton, Voltorb, Electrode, Electabuzz, Jolteon, Zapdos)
    const cards = page.locator('[data-pokedex-grid] .pokemon-card')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    const pikachuCard = page.locator('[data-pokedex-grid] .pokemon-card[data-pokemon-id="25"]')
    await expect(pikachuCard).toBeVisible()

    // Gen 2 Mareep (#179) should NOT be present
    const mareepCard = page.locator('[data-pokedex-grid] .pokemon-card[data-pokemon-id="179"]')
    await expect(mareepCard).toBeHidden()
  })

  test('shows active filters count and resets with clear filters button', async ({ page }) => {
    // Initially no active filter badge
    const badge = page.locator('[data-filter-active-count]')
    await expect(badge).toBeHidden()

    // Open filters and apply multiple panel filters: type + gen
    await page.locator('[data-filter-toggle]').click()
    await page.locator('[data-type-filter] button[data-type="electric"]').click()
    await page.locator('[data-generation-filter] button[data-generation="generation-i"]').click()

    // Active count badge should be visible and show 2
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('2')

    // Clear filters button should be visible
    const clearBtn = page.locator('[data-clear-filters]')
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    // Badge should be hidden and chips cleared
    await expect(badge).toBeHidden()
    await expect(page.locator('[data-type-filter] button[data-type="electric"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(
      page.locator('[data-generation-filter] button[data-generation="generation-i"]'),
    ).toHaveAttribute('aria-pressed', 'false')

    // Grid shows full list again
    const fullCount = await page.locator('[data-pokedex-grid] .pokemon-card').count()
    expect(fullCount).toBeGreaterThanOrEqual(24)
  })

  test('toggles between All and Captured view', async ({ page }) => {
    // 1. Switch to 'Captured' view with 0 captured
    const capturedTab = page.locator('[data-view-toggle] button[data-view="captured"]')
    await capturedTab.click()
    await expect(capturedTab).toHaveAttribute('aria-pressed', 'true')

    // Empty message should show
    const emptyMsg = page.locator('[data-pokedex-empty]')
    await expect(emptyMsg).toBeVisible()

    // 2. Switch back to 'All'
    const allTab = page.locator('[data-view-toggle] button[data-view="all"]')
    await allTab.click()
    await expect(emptyMsg).toBeHidden()
    await expect(page.locator('[data-pokedex-grid] .pokemon-card').first()).toBeVisible()
  })
})
