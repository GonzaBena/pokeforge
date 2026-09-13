import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  getUnassignedCaptures,
  getUnassignedCount,
  assignCapture,
  autoAssignAll,
  assignAllToBoth,
  VERSION_ASSIGNMENT_CHANGED_EVENT,
} from '../src/lib/versionAssignment'

// Mock minimal browser environment for localStorage and CustomEvent
class LocalStorageMock {
  private store: Record<string, string> = {}
  getItem(key: string): string | null {
    return this.store[key] ?? null
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }
  removeItem(key: string): void {
    delete this.store[key]
  }
  clear(): void {
    this.store = {}
  }
}

describe('versionAssignment', () => {
  beforeEach(() => {
    // Setup clean storage mock
    const mockStorage = new LocalStorageMock()
    // @ts-ignore
    globalThis.localStorage = mockStorage

    // Setup window mock if missing
    if (typeof globalThis.window === 'undefined') {
      // @ts-ignore
      globalThis.window = {
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      }
    }
  })

  it('returns empty array and count 0 when no captures exist', () => {
    const unassigned = getUnassignedCaptures()
    assert.deepEqual(unassigned, [])
    assert.equal(getUnassignedCount(), 0)
  })

  it('detects unassigned captures from global captured list', () => {
    // #1007 (Koraidon - exclusive Scarlet), #1008 (Miraidon - exclusive Violet), #915 (Lechonk - both)
    localStorage.setItem('poketeam:captured', JSON.stringify([1007, 1008, 915]))
    localStorage.setItem('poketeam:captured-by-game', JSON.stringify({}))

    const unassigned = getUnassignedCaptures()
    assert.equal(unassigned.length, 3)
    assert.equal(getUnassignedCount(), 3)

    const koraidon = unassigned.find((p) => p.id === 1007)
    assert.ok(koraidon)
    assert.equal(koraidon.gameKey, 'scarlet-violet')
    assert.equal(koraidon.exclusiveTo, 'a')
    assert.equal(koraidon.recommended, 'a')

    const miraidon = unassigned.find((p) => p.id === 1008)
    assert.ok(miraidon)
    assert.equal(miraidon.exclusiveTo, 'b')
    assert.equal(miraidon.recommended, 'b')

    const lechonk = unassigned.find((p) => p.id === 915)
    assert.ok(lechonk)
    assert.equal(lechonk.exclusiveTo, undefined)
    assert.equal(lechonk.recommended, 'both')
  })

  it('ignores captures that are already assigned in captured-by-game', () => {
    // #1007 is already in scarlet
    localStorage.setItem('poketeam:captured', JSON.stringify([1007, 1008]))
    localStorage.setItem(
      'poketeam:captured-by-game',
      JSON.stringify({ scarlet: [1007], violet: [] }),
    )

    const unassigned = getUnassignedCaptures()
    assert.equal(unassigned.length, 1)
    assert.equal(unassigned[0].id, 1008)
  })

  it('assignCapture assigns a single pokemon to version A, B, or both', () => {
    localStorage.setItem('poketeam:captured', JSON.stringify([1007, 1008, 915]))
    localStorage.setItem('poketeam:captured-by-game', JSON.stringify({}))

    // Assign Koraidon to version A (scarlet)
    assignCapture(1007, 'scarlet-violet', 'a')
    let map = JSON.parse(localStorage.getItem('poketeam:captured-by-game') || '{}')
    assert.deepEqual(map.scarlet, [1007])
    assert.equal(map.violet?.includes(1007) ?? false, false)

    // Assign Miraidon to version B (violet)
    assignCapture(1008, 'scarlet-violet', 'b')
    map = JSON.parse(localStorage.getItem('poketeam:captured-by-game') || '{}')
    assert.deepEqual(map.violet, [1008])

    // Assign Lechonk to both
    assignCapture(915, 'scarlet-violet', 'both')
    map = JSON.parse(localStorage.getItem('poketeam:captured-by-game') || '{}')
    assert.ok(map.scarlet.includes(915))
    assert.ok(map.violet.includes(915))

    // Now count should be 0
    assert.equal(getUnassignedCount(), 0)
    assert.equal(getUnassignedCaptures().length, 0)
  })

  it('autoAssignAll automatically applies Option 2 (exclusives to their version, common to both)', () => {
    localStorage.setItem('poketeam:captured', JSON.stringify([1007, 1008, 915]))
    localStorage.setItem('poketeam:captured-by-game', JSON.stringify({}))

    autoAssignAll()

    const map = JSON.parse(localStorage.getItem('poketeam:captured-by-game') || '{}')
    // Koraidon exclusive to scarlet
    assert.ok(map.scarlet.includes(1007))
    assert.equal(map.violet?.includes(1007) ?? false, false)

    // Miraidon exclusive to violet
    assert.ok(map.violet.includes(1008))
    assert.equal(map.scarlet?.includes(1008) ?? false, false)

    // Lechonk in both
    assert.ok(map.scarlet.includes(915))
    assert.ok(map.violet.includes(915))

    assert.equal(getUnassignedCount(), 0)
  })

  it('assignAllToBoth assigns all unassigned pokemon to both versions', () => {
    localStorage.setItem('poketeam:captured', JSON.stringify([1007, 1008]))
    localStorage.setItem('poketeam:captured-by-game', JSON.stringify({}))

    assignAllToBoth()

    const map = JSON.parse(localStorage.getItem('poketeam:captured-by-game') || '{}')
    assert.ok(map.scarlet.includes(1007))
    assert.ok(map.violet.includes(1007))
    assert.ok(map.scarlet.includes(1008))
    assert.ok(map.violet.includes(1008))

    assert.equal(getUnassignedCount(), 0)
  })

  it('dispatches VERSION_ASSIGNMENT_CHANGED_EVENT on assignment changes', () => {
    localStorage.setItem('poketeam:captured', JSON.stringify([1007]))
    localStorage.setItem('poketeam:captured-by-game', JSON.stringify({}))

    let eventFired = false
    // @ts-ignore
    globalThis.window.dispatchEvent = (event: Event) => {
      if (event.type === VERSION_ASSIGNMENT_CHANGED_EVENT) {
        eventFired = true
      }
      return true
    }

    assignCapture(1007, 'scarlet-violet', 'a')
    assert.ok(eventFired)
  })
})
