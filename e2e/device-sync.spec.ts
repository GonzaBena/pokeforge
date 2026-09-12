import { test, expect } from '@playwright/test'
import { encodeCapturedIds, encodeSyncPayload } from '../src/lib/sync'
import type { TeamState } from '../src/lib/types'

test.describe('Cross-Device Synchronization Flow', () => {
  test('syncs team and captures from Device A to Device B via URL hash payload (merge mode)', async ({
    browser,
  }) => {
    // 1. Setup Device A (Context A)
    const deviceAContext = await browser.newContext()
    const pageA = await deviceAContext.newPage()

    await pageA.goto('/team')
    await pageA.evaluate(() => localStorage.clear())

    const mockTeamA: TeamState = {
      size: 6,
      slots: [
        {
          pokemonId: 6,
          moves: ['flamethrower', 'air-slash', null, null],
          item: 'charcoal',
          ability: 'blaze',
          nature: 'timid',
        },
        {
          pokemonId: 9,
          moves: ['surf', 'ice-beam', null, null],
          item: 'mystic-water',
          ability: 'torrent',
          nature: 'modest',
        },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
      ],
    }

    await pageA.evaluate((team) => {
      localStorage.setItem('poketeam:team', JSON.stringify(team))
      localStorage.setItem('poketeam:captured', JSON.stringify([1, 4, 7]))
    }, mockTeamA)

    const syncToken = await encodeSyncPayload({
      v: 1,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set([1, 4, 7])),
      team: mockTeamA,
    })

    expect(syncToken).toBeTruthy()

    // 2. Setup Device B (Context B - completely fresh and isolated)
    const deviceBContext = await browser.newContext()
    const pageB = await deviceBContext.newPage()

    // Device B visits /sync#d=<token>
    await pageB.goto(`/sync#d=${syncToken}`)

    // 3. Verify Device B transitions to Ready state
    const readyCard = pageB.locator('[data-sync-state="ready"]')
    await expect(readyCard).toBeVisible()

    // Verify incoming team preview contains 2 Pokémon sprites
    const previewSlots = pageB.locator('.sync-team-preview-slot img')
    await expect(previewSlots).toHaveCount(2)

    // Verify captures comparison (incoming = 3, current = 0)
    const incomingCaptures = pageB.locator('[data-incoming-captures]')
    await expect(incomingCaptures).toHaveText('3')
    const currentCaptures = pageB.locator('[data-current-captures]')
    await expect(currentCaptures).toHaveText('0')

    // 4. Click Confirm Sync (default merge mode)
    const confirmBtn = pageB.locator('[data-confirm-sync]')
    await expect(confirmBtn).toBeVisible()
    await confirmBtn.click()

    // Device B redirects to /team/ (or /es/equipo/)
    await pageB.waitForURL(/team|equipo/)

    // 5. Verify Device B now has the imported team in slots 0 and 1
    const slot0 = pageB.locator('[data-slot-column="0"] [data-team-slot]')
    const slot1 = pageB.locator('[data-slot-column="1"] [data-team-slot]')
    await expect(slot0).toHaveClass(/filled/)
    await expect(slot0.locator('.team-slot__name')).toContainText(/charizard/i)

    await expect(slot1).toHaveClass(/filled/)
    await expect(slot1.locator('.team-slot__name')).toContainText(/blastoise/i)

    // Clean up contexts
    await deviceAContext.close()
    await deviceBContext.close()
  })

  test('replaces existing team when sync mode is set to replace', async ({ browser }) => {
    // Context A generates payload with Gengar (#94)
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()
    await pageA.goto('/team')
    await pageA.evaluate(() => localStorage.clear())

    const mockTeamGengar: TeamState = {
      size: 6,
      slots: [
        {
          pokemonId: 94,
          moves: ['shadow-ball'],
          item: 'life-orb',
          ability: 'cursed-body',
        },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
        { pokemonId: null, moves: [], item: null, ability: null },
      ],
    }

    await pageA.evaluate((team) => {
      localStorage.setItem('poketeam:team', JSON.stringify(team))
      localStorage.setItem('poketeam:captured', JSON.stringify([94]))
    }, mockTeamGengar)

    const syncToken = await encodeSyncPayload({
      v: 1,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set([94])),
      team: mockTeamGengar,
    })

    // Context B has Pikachu (#25) in slot 0 before sync
    const contextB = await browser.newContext()
    const pageB = await contextB.newPage()
    await pageB.goto('/team')
    await pageB.evaluate(() => {
      const initialTeam = {
        size: 6,
        slots: [
          {
            pokemonId: 25,
            moves: ['thunderbolt'],
            item: 'light-ball',
            ability: 'static',
          },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
          { pokemonId: null, moves: [], item: null, ability: null },
        ],
      }
      localStorage.setItem('poketeam:team', JSON.stringify(initialTeam))
    })

    // Device B goes to sync URL
    await pageB.goto(`/sync#d=${syncToken}`)
    await expect(pageB.locator('[data-sync-state="ready"]')).toBeVisible()

    // Select 'replace' mode
    const replaceRadio = pageB.locator('input[name="syncMode"][value="replace"]')
    await replaceRadio.check()
    await expect(replaceRadio).toBeChecked()

    // Confirm sync
    await pageB.locator('[data-confirm-sync]').click()
    await pageB.waitForURL(/team|equipo/)

    // Slot 0 should now be Gengar, NOT Pikachu
    const slot0 = pageB.locator('[data-slot-column="0"] [data-team-slot]')
    await expect(slot0).toHaveClass(/filled/)
    await expect(slot0.locator('.team-slot__name')).toContainText(/gengar/i)

    await contextA.close()
    await contextB.close()
  })

  test('displays guide/empty instructions when visiting /sync without payload hash', async ({
    page,
  }) => {
    await page.goto('/sync')

    // Empty guide state should be visible
    const emptyState = page.locator('[data-sync-state="empty"]')
    await expect(emptyState).toBeVisible()

    // Guide steps 1, 2, 3 should be displayed
    const steps = page.locator('.sync-steps li')
    await expect(steps).toHaveCount(3)

    // Ready state should be hidden
    await expect(page.locator('[data-sync-state="ready"]')).toBeHidden()
  })
})
