import test from 'node:test'
import assert from 'node:assert/strict'
import { installStorageStub } from './helpers/localStorageStub'
import {
  getCapturedIds,
  isCaptured,
  setCaptured,
  getCapturedByGame,
  getAllCapturedByGame,
  setCapturedByGame,
  setCapturedForVersions,
  getPokemonOverrides,
  setPokemonOverrides,
  resetAllData,
  CAPTURED_CHANGED_EVENT,
  CAPTURED_BY_GAME_CHANGED_EVENT,
} from '../src/lib/storage'

function withStorage(fn: () => void): void {
  const stub = installStorageStub()
  try {
    fn()
  } finally {
    stub.restore()
  }
}

test('storage - getCapturedIds/isCaptured return the union of global and per-game sets', () => {
  withStorage(() => {
    setCaptured(1, true)
    setCapturedByGame('scarlet', 2, true)
    setCapturedByGame('violet', 3, true)

    const union = getCapturedIds()
    assert.deepEqual([...union].sort((a, b) => a - b), [1, 2, 3])
    assert.ok(isCaptured(1))
    assert.ok(isCaptured(2))
    assert.ok(isCaptured(3))
    assert.ok(!isCaptured(4))
  })
})

test('storage - setCaptured only touches the global set, never promotes per-game ids', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 10, true)
    // Toggling id 10 globally (false then true) must not create/alter a per-game entry for it.
    setCaptured(10, false)
    assert.ok(isCaptured(10), 'still captured via scarlet after clearing the global flag')
    assert.ok(getCapturedByGame('scarlet').has(10))

    setCaptured(20, true)
    setCaptured(20, false)
    assert.ok(!isCaptured(20))
    assert.equal(getCapturedByGame('scarlet').has(20), false)
  })
})

test('storage - setCapturedByGame isolates versions from each other', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 5, true)
    assert.ok(getCapturedByGame('scarlet').has(5))
    assert.ok(!getCapturedByGame('violet').has(5))

    setCapturedByGame('scarlet', 5, false)
    assert.ok(!getCapturedByGame('scarlet').has(5))
    assert.ok(!isCaptured(5))
  })
})

test('storage - setCapturedForVersions marks/unmarks "both" versions at once', () => {
  withStorage(() => {
    setCapturedForVersions(7, ['scarlet', 'violet'], true)
    assert.ok(getCapturedByGame('scarlet').has(7))
    assert.ok(getCapturedByGame('violet').has(7))
    assert.ok(isCaptured(7))

    setCapturedForVersions(7, ['scarlet', 'violet'], false)
    assert.ok(!getCapturedByGame('scarlet').has(7))
    assert.ok(!getCapturedByGame('violet').has(7))
    assert.ok(!isCaptured(7))
  })
})

test('storage - getAllCapturedByGame returns every version map', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 1, true)
    setCapturedByGame('violet', 2, true)
    const all = getAllCapturedByGame()
    assert.deepEqual([...all.scarlet], [1])
    assert.deepEqual([...all.violet], [2])
  })
})

test('storage - overrides are only deleted when the aggregate capture state becomes false', () => {
  withStorage(() => {
    setCaptured(42, true)
    setCapturedByGame('scarlet', 42, true)
    setPokemonOverrides(42, { stats: { hp: 99 }, nature: 'timid' })

    // Still captured in scarlet after clearing the global flag -> overrides survive.
    setCaptured(42, false)
    assert.deepEqual(getPokemonOverrides(42).nature, 'timid')

    // Clearing the last remaining source removes the aggregate capture -> overrides are wiped.
    setCapturedByGame('scarlet', 42, false)
    assert.equal(getPokemonOverrides(42).nature, null)
  })
})

test('storage - setCaptured and setCapturedForVersions dispatch the expected events', () => {
  withStorage(() => {
    const capturedEvents: CustomEvent[] = []
    const byGameEvents: CustomEvent[] = []
    window.addEventListener(CAPTURED_CHANGED_EVENT, (e) => capturedEvents.push(e as CustomEvent))
    window.addEventListener(CAPTURED_BY_GAME_CHANGED_EVENT, (e) =>
      byGameEvents.push(e as CustomEvent),
    )

    setCaptured(1, true)
    assert.equal(capturedEvents.length, 1)
    assert.equal(capturedEvents[0].detail.changedId, 1)
    assert.equal(capturedEvents[0].detail.captured, true)

    setCapturedForVersions(2, ['scarlet'], true)
    assert.equal(byGameEvents.length, 1)
    assert.deepEqual(byGameEvents[0].detail.versionIds, ['scarlet'])
    assert.equal(capturedEvents.length, 2, 'setCapturedForVersions also dispatches CAPTURED_CHANGED_EVENT')
    assert.equal(capturedEvents[1].detail.captured, true)
  })
})

test('storage - resetAllData clears the per-game map and notifies listeners', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 1, true)
    let byGameResetSeen = false
    window.addEventListener(CAPTURED_BY_GAME_CHANGED_EVENT, (e) => {
      if ((e as CustomEvent).detail?.reset) byGameResetSeen = true
    })

    resetAllData()

    assert.equal(getCapturedByGame('scarlet').size, 0)
    assert.equal(getCapturedIds().size, 0)
    assert.ok(byGameResetSeen)
  })
})
