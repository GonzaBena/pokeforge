import { test, expect } from '@playwright/test'

test.describe('Team UI Flow - Adding Pokémon, Moves, Items & Removal', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure isolated team state
    await page.goto('/team')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('adds a Pokémon to an empty slot via picker modal', async ({ page }) => {
    // 1. Initial state: Slot 0 should be empty
    const slot0 = page.locator('[data-slot-column="0"] [data-team-slot]')
    await expect(slot0).toBeVisible()
    await expect(slot0).toContainText(/Choose Pok[eé]mon|Elegir Pok[eé]mon/i)

    // 2. Click empty slot to open Pokémon picker modal
    await slot0.click()
    const pickerOverlay = page.locator('[data-picker-overlay]')
    await expect(pickerOverlay).toBeVisible()

    // 3. Search for Charizard
    const searchInput = page.locator('[data-picker-search]')
    await searchInput.fill('charizard')

    // 4. Click Charizard in results
    const charizardItem = page.locator('[data-picker-results] [data-pokemon-id="6"]')
    await expect(charizardItem).toBeVisible()
    await charizardItem.click()

    // 5. Modal closes and slot 0 is populated
    await expect(pickerOverlay).toBeHidden()
    await expect(slot0).toHaveClass(/filled/)
    await expect(slot0.locator('.team-slot__name')).toContainText(/charizard/i)
    await expect(slot0.locator('.team-slot__id')).toContainText('#0006')

    // 6. Strengths and Weaknesses panel reactively updates
    const panel = page.locator('[data-strengths-panel]')
    await expect(panel).toBeVisible()
  })

  test('selects moves and item for the Pokémon in the slot', async ({ page }) => {
    // Add Pikachu to slot 0
    const slot0 = page.locator('[data-slot-column="0"] [data-team-slot]')
    await slot0.click()
    await page.locator('[data-picker-search]').fill('pikachu')
    await page.locator('[data-picker-results] [data-pokemon-id="25"]').click()
    await expect(page.locator('[data-picker-overlay]')).toBeHidden()

    // 1. Add a move: click the first empty move slot
    const moveBtn0 = page.locator('[data-move-slot][data-slot-index="0"][data-move-index="0"]')
    await expect(moveBtn0).toBeVisible()
    await moveBtn0.click()

    // Move picker modal opens
    const moveOverlay = page.locator('[data-move-picker-overlay]')
    await expect(moveOverlay).toBeVisible()

    // Select the first available move row
    const firstMoveRow = page.locator('[data-move-picker-results] tr[data-pick-move]').first()
    await expect(firstMoveRow).toBeVisible()
    const chosenMoveName = (await firstMoveRow.locator('.move-table__name').textContent())?.trim()
    await firstMoveRow.locator('button[data-pick-move]').click()

    // Move modal closes and move card is rendered
    await expect(moveOverlay).toBeHidden()
    const filledMoveCard = page.locator(
      '.move-slot-card.filled[data-slot-index="0"][data-move-index="0"]',
    )
    await expect(filledMoveCard).toBeVisible()
    if (chosenMoveName) {
      await expect(filledMoveCard).toContainText(chosenMoveName)
    }

    // 2. Add an item: click item button
    const itemBtn = page.locator('[data-select-item][data-slot-index="0"]')
    await itemBtn.click()

    // Item picker modal opens
    const itemOverlay = page.locator('[data-item-picker-overlay]')
    await expect(itemOverlay).toBeVisible()

    // Search and pick 'Light Ball' or first competitive item
    await page.locator('[data-item-picker-search]').fill('light ball')
    const lightBall = page.locator('[data-item-picker-results] [data-item-id="light-ball"]')
    await expect(lightBall).toBeVisible()
    await lightBall.click()

    // Item modal closes and item pill is rendered
    await expect(itemOverlay).toBeHidden()
    const itemPill = page.locator('[data-item-pill][data-slot-index="0"]')
    await expect(itemPill).toBeVisible()
    await expect(itemPill).toContainText(/Light Ball|Bola Luminosa/i)
  })

  test('removes a Pokémon from the team and resets the slot', async ({ page }) => {
    // Add Gengar to slot 0
    const slot0 = page.locator('[data-slot-column="0"] [data-team-slot]')
    await slot0.click()
    await page.locator('[data-picker-search]').fill('gengar')
    await page.locator('[data-picker-results] [data-pokemon-id="94"]').click()
    await expect(slot0).toHaveClass(/filled/)

    // Remove Pokémon via the remove button
    const removeBtn = page.locator('[data-remove-slot][data-slot-index="0"]')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    // Slot 0 should return to empty state
    await expect(slot0).not.toHaveClass(/filled/)
    await expect(slot0).toContainText(/Choose Pok[eé]mon|Elegir Pok[eé]mon/i)
  })

  test('works seamlessly in Spanish locale /es/equipo', async ({ page }) => {
    await page.goto('/es/equipo')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    const slot0 = page.locator('[data-slot-column="0"] [data-team-slot]')
    await expect(slot0).toContainText('Elegir Pokémon')

    await slot0.click()
    await expect(page.locator('[data-picker-overlay]')).toBeVisible()
    await page.locator('[data-picker-search]').fill('bulbasaur')

    const bulbasaurItem = page.locator('[data-picker-results] [data-pokemon-id="1"]')
    await expect(bulbasaurItem).toBeVisible()
    await bulbasaurItem.click()

    // Verify Spanish toast
    const toast = page.locator('.toast, [data-toast-container]')
    await expect(toast).toBeVisible()
    await expect(slot0.locator('.team-slot__name')).toContainText(/bulbasaur/i)
  })
})
