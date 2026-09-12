import { test, expect } from '@playwright/test'

test.describe('Showdown Export Flow', () => {
  test('exports team to Pokémon Showdown format and copies to clipboard', async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/team')
    await page.evaluate(() => localStorage.clear())

    // Set up a mock team in localStorage with complete competitive specs
    await page.evaluate(() => {
      const mockTeam = {
        size: 6,
        slots: [
          {
            pokemonId: 94, // Gengar
            moves: ['shadow-ball', 'sludge-bomb', 'focus-blast', 'substitute'],
            item: 'life-orb',
            ability: 'cursed-body',
            nature: 'timid',
          },
          {
            pokemonId: 25, // Pikachu
            moves: ['thunderbolt', 'quick-attack', null, null],
            item: 'light-ball',
            ability: 'static',
            nature: 'jolly',
          },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
        ],
      }
      localStorage.setItem('poketeam:team', JSON.stringify(mockTeam))
    })
    await page.reload()

    // Verify slots are rendered
    await expect(page.locator('[data-slot-column="0"] [data-team-slot]')).toHaveClass(/filled/)
    await expect(page.locator('[data-slot-column="1"] [data-team-slot]')).toHaveClass(/filled/)

    // Open Team Card / Export modal
    const openCardBtn = page.locator('[data-open-team-card]')
    await openCardBtn.click()

    const cardOverlay = page.locator('[data-team-card-overlay]')
    await expect(cardOverlay).toBeVisible()

    // Verify preview contains team info
    const preview = page.locator('[data-team-card-preview]')
    await expect(preview).toBeVisible()
    await expect(preview).toContainText(/gengar/i)
    await expect(preview).toContainText(/pikachu/i)

    // Click 'Copy Showdown' button
    const copyBtn = page.locator('[data-copy-showdown]')
    await expect(copyBtn).toBeVisible()
    await copyBtn.click()

    // Verify success toast notification
    const toast = page.locator('.toast, [data-toast-container]')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText(/Showdown/i)

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('Gengar @ Life Orb')
    expect(clipboardText).toContain('Ability: Cursed Body')
    expect(clipboardText).toContain('Nature: Timid')
    expect(clipboardText).toContain('- Shadow Ball')
    expect(clipboardText).toContain('- Sludge Bomb')
    expect(clipboardText).toContain('Pikachu @ Light Ball')
    expect(clipboardText).toContain('- Thunderbolt')
  })

  test('shows notification and prevents export when team is empty', async ({ page }) => {
    await page.goto('/team')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Open export modal with empty team
    await page.locator('[data-open-team-card]').click()
    const cardOverlay = page.locator('[data-team-card-overlay]')
    await expect(cardOverlay).toBeVisible()

    // Click 'Copy Showdown'
    await page.locator('[data-copy-showdown]').click()

    // Should display empty team notice
    const toast = page.locator('.toast, [data-toast-container]')
    await expect(toast).toBeVisible()
    await expect(toast).toContainText(/empty|vacío/i)
  })
})
