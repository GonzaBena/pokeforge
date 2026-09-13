import test from 'node:test'
import assert from 'node:assert/strict'
import { installStorageStub } from './helpers/localStorageStub'
import {
  getCaptureMeta,
  setCaptureMeta,
  deleteCaptureMeta,
  getCaptureLog,
  setCaptured,
  setCapturedForVersions,
  setCapturedByGame,
  resetAllData,
  CAPTURE_LOG_CHANGED_EVENT,
  type CaptureLogEntry,
} from '../src/lib/storage'

function withStorage(fn: () => void): void {
  const stub = installStorageStub()
  try {
    fn()
  } finally {
    stub.restore()
  }
}

const entry = (overrides: Partial<CaptureLogEntry> = {}): CaptureLogEntry => ({
  date: '2026-09-12',
  method: 'wild',
  game: 'violet',
  ...overrides,
})

test('storage - getCaptureMeta returns null when nothing was recorded', () => {
  withStorage(() => {
    assert.equal(getCaptureMeta(25), null)
  })
})

test('storage - setCaptureMeta/getCaptureMeta roundtrip', () => {
  withStorage(() => {
    setCaptureMeta(25, entry())
    assert.deepEqual(getCaptureMeta(25), entry())
  })
})

test('storage - deleteCaptureMeta removes only the targeted entry', () => {
  withStorage(() => {
    setCaptureMeta(25, entry())
    setCaptureMeta(133, entry({ method: 'egg', game: null }))

    deleteCaptureMeta(25)

    assert.equal(getCaptureMeta(25), null)
    assert.deepEqual(getCaptureMeta(133), entry({ method: 'egg', game: null }))
  })
})

test('storage - getCaptureLog collects every recorded entry keyed by id', () => {
  withStorage(() => {
    setCaptureMeta(1, entry({ method: 'wild' }))
    setCaptureMeta(133, entry({ method: 'egg', game: 'scarlet' }))

    const log = getCaptureLog()
    assert.deepEqual(Object.keys(log).sort(), ['1', '133'])
    assert.deepEqual(log[1], entry({ method: 'wild' }))
    assert.deepEqual(log[133], entry({ method: 'egg', game: 'scarlet' }))
  })
})

test('storage - setCaptureMeta and deleteCaptureMeta dispatch CAPTURE_LOG_CHANGED_EVENT', () => {
  withStorage(() => {
    const events: CustomEvent[] = []
    window.addEventListener(CAPTURE_LOG_CHANGED_EVENT, (e) => events.push(e as CustomEvent))

    setCaptureMeta(25, entry())
    assert.equal(events.length, 1)
    assert.equal(events[0].detail.id, 25)
    assert.deepEqual(events[0].detail.meta, entry())

    deleteCaptureMeta(25)
    assert.equal(events.length, 2)
    assert.equal(events[1].detail.id, 25)
    assert.equal(events[1].detail.deleted, true)
  })
})

test('storage - setCaptured(false) deletes capture meta once the aggregate capture state becomes false', () => {
  withStorage(() => {
    setCaptured(42, true)
    setCapturedByGame('scarlet', 42, true)
    setCaptureMeta(42, entry())

    // Still captured in scarlet after clearing the global flag -> meta survives.
    setCaptured(42, false)
    assert.deepEqual(getCaptureMeta(42), entry())

    // Clearing the last remaining source removes the aggregate capture -> meta is wiped.
    setCapturedByGame('scarlet', 42, false)
    assert.equal(getCaptureMeta(42), null)
  })
})

test('storage - setCapturedForVersions(false) deletes capture meta once no version keeps it captured', () => {
  withStorage(() => {
    setCapturedForVersions(7, ['scarlet', 'violet'], true)
    setCaptureMeta(7, entry({ game: 'scarlet' }))

    setCapturedForVersions(7, ['scarlet', 'violet'], false)
    assert.equal(getCaptureMeta(7), null)
  })
})

test('storage - resetAllData clears every capture-meta entry and notifies listeners', () => {
  withStorage(() => {
    setCaptureMeta(1, entry())
    setCaptureMeta(2, entry({ method: 'trade' }))

    let resetSeen = false
    window.addEventListener(CAPTURE_LOG_CHANGED_EVENT, (e) => {
      if ((e as CustomEvent).detail?.reset) resetSeen = true
    })

    resetAllData()

    assert.deepEqual(getCaptureLog(), {})
    assert.ok(resetSeen)
  })
})
