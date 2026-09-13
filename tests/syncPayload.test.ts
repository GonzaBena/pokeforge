import test from 'node:test'
import assert from 'node:assert/strict'
import {
  encodeCapturedIds,
  decodeCapturedIds,
  encodeSyncPayload,
  decodeSyncPayload,
  parseCloudPairingFromHash,
  generateCloudPairingUrl,
  parseSyncFromHash,
  applySyncPayload,
  importBackupFile,
  createSyncPayload,
  type SyncPayload,
} from '../src/lib/sync'
import { installStorageStub } from './helpers/localStorageStub'
import {
  getCapturedByGame,
  getCapturedIds,
  setCapturedByGame,
  setCaptured,
  getCaptureMeta,
  setCaptureMeta,
} from '../src/lib/storage'

function withStorage(fn: () => void): void {
  const stub = installStorageStub()
  try {
    fn()
  } finally {
    stub.restore()
  }
}

test('sync - encodeCapturedIds and decodeCapturedIds roundtrip', () => {
  const emptySet = new Set<number>()
  const emptyBase64 = encodeCapturedIds(emptySet)
  const decodedEmpty = decodeCapturedIds(emptyBase64)
  assert.equal(decodedEmpty.size, 0)

  // Boundary IDs (1 and 1025) plus mid-range IDs
  const originalIds = new Set<number>([1, 25, 150, 151, 250, 493, 721, 898, 1008, 1025])
  const base64 = encodeCapturedIds(originalIds)
  assert.equal(typeof base64, 'string')
  assert.ok(base64.length > 0)

  const decodedIds = decodeCapturedIds(base64)
  assert.equal(decodedIds.size, originalIds.size)
  for (const id of originalIds) {
    assert.ok(decodedIds.has(id), `Missing expected ID: ${id}`)
  }
})

test('sync - encodeSyncPayload and decodeSyncPayload roundtrip', async () => {
  const payload: SyncPayload = {
    v: 1,
    timestamp: 1726156800000,
    capturedBitset: encodeCapturedIds(new Set([1, 4, 7, 25])),
    team: {
      size: 6,
      slots: [
        {
          pokemonId: 25,
          moves: ['thunderbolt'],
          item: 'light-ball',
          ability: 'static',
          nature: 'timid',
        },
        { pokemonId: null, moves: [], item: null, ability: null },
      ],
    },
    overrides: {
      25: {
        stats: {},
        nature: 'timid',
        item: 'light-ball',
      },
    },
    game: 'scarlet-violet',
  }

  const token = await encodeSyncPayload(payload)
  assert.ok(token.length > 0)
  assert.ok(token.startsWith('z.') || token.startsWith('r.'))

  const decoded = await decodeSyncPayload(token)
  assert.equal(decoded.v, 1)
  assert.equal(decoded.timestamp, payload.timestamp)
  assert.equal(decoded.game, 'scarlet-violet')
  assert.equal(decoded.team.slots[0].pokemonId, 25)
  assert.equal(decoded.team.slots[0].item, 'light-ball')

  const decodedCaptures = decodeCapturedIds(decoded.capturedBitset)
  assert.deepEqual(
    Array.from(decodedCaptures).sort((a, b) => a - b),
    [1, 4, 7, 25],
  )
})

test('sync - parseCloudPairingFromHash and generateCloudPairingUrl', () => {
  const url = generateCloudPairingUrl('PK-TEST-1234', 'secretKeyABC', 'https://pokeforge.app', 'es')
  assert.equal(url, 'https://pokeforge.app/es/sync/#vault=PK-TEST-1234&key=secretKeyABC')

  const hash = '#vault=PK-TEST-1234&key=secretKeyABC'
  const parsed = parseCloudPairingFromHash(hash)
  assert.ok(parsed)
  assert.equal(parsed.code, 'PK-TEST-1234')
  assert.equal(parsed.secretKey, 'secretKeyABC')

  const invalidParsed = parseCloudPairingFromHash('#random-hash=123')
  assert.equal(invalidParsed, null)
})

test('sync - v2 payload roundtrip carries capturedByGame', async () => {
  const payload: SyncPayload = {
    v: 2,
    timestamp: 1726156800000,
    capturedBitset: encodeCapturedIds(new Set([1])),
    capturedByGame: {
      scarlet: encodeCapturedIds(new Set([2, 4])),
      violet: encodeCapturedIds(new Set([3])),
    },
    team: { size: 6, slots: [] },
    game: 'scarlet-violet',
  }

  const token = await encodeSyncPayload(payload)
  const decoded = await decodeSyncPayload(token)
  assert.equal(decoded.v, 2)
  assert.deepEqual(
    [...decodeCapturedIds(decoded.capturedByGame!.scarlet)].sort((a, b) => a - b),
    [2, 4],
  )
  assert.deepEqual([...decodeCapturedIds(decoded.capturedByGame!.violet)], [3])
})

test('sync - parseSyncFromHash accepts both v1 and v2 payloads', async () => {
  const v1: SyncPayload = {
    v: 1,
    timestamp: Date.now(),
    capturedBitset: encodeCapturedIds(new Set([1])),
    team: { size: 6, slots: [] },
  }
  const v2: SyncPayload = {
    v: 2,
    timestamp: Date.now(),
    capturedBitset: encodeCapturedIds(new Set([1])),
    capturedByGame: { scarlet: encodeCapturedIds(new Set([2])) },
    team: { size: 6, slots: [] },
  }

  const tokenV1 = await encodeSyncPayload(v1)
  const tokenV2 = await encodeSyncPayload(v2)

  const parsedV1 = await parseSyncFromHash(`#d=${tokenV1}`)
  const parsedV2 = await parseSyncFromHash(`#d=${tokenV2}`)
  assert.ok(parsedV1)
  assert.equal(parsedV1!.v, 1)
  assert.ok(parsedV2)
  assert.equal(parsedV2!.v, 2)
})

test('sync - applySyncPayload merges capturedByGame per version without losing local progress', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 100, true)

    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      capturedByGame: {
        scarlet: encodeCapturedIds(new Set([101])),
        violet: encodeCapturedIds(new Set([200])),
      },
      team: { size: 6, slots: [] },
    }

    applySyncPayload(payload, 'merge')

    assert.deepEqual(
      [...getCapturedByGame('scarlet')].sort((a, b) => a - b),
      [100, 101],
      'merge is a union per version, local progress is preserved',
    )
    assert.deepEqual([...getCapturedByGame('violet')], [200])
  })
})

test('sync - applySyncPayload replace overwrites capturedByGame per version', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 100, true)
    setCapturedByGame('violet', 999, true)

    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      capturedByGame: {
        scarlet: encodeCapturedIds(new Set([101])),
      },
      team: { size: 6, slots: [] },
    }

    applySyncPayload(payload, 'replace')

    assert.deepEqual([...getCapturedByGame('scarlet')], [101])
    // violet wasn't present in the incoming payload -> untouched by a replace scoped to what arrived
    assert.deepEqual([...getCapturedByGame('violet')], [999])
  })
})

test('sync - applySyncPayload with a v1-shaped payload (no capturedByGame) leaves the per-game map untouched', () => {
  withStorage(() => {
    setCapturedByGame('scarlet', 5, true)

    const payload: SyncPayload = {
      v: 1,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set([1])),
      team: { size: 6, slots: [] },
    }

    applySyncPayload(payload, 'merge')

    assert.deepEqual([...getCapturedByGame('scarlet')], [5])
    assert.ok(getCapturedIds().has(1))
  })
})

test('sync - importBackupFile falls back gracefully when capturedByGame is absent (old backup)', async () => {
  await withStorageAsync(async () => {
    const raw = {
      app: 'PokeForge',
      version: 1,
      captured: [1, 2, 3],
      team: { size: 6, slots: [] },
    }
    const file = new File([JSON.stringify(raw)], 'backup.json', { type: 'application/json' })
    const result = await importBackupFile(file, 'replace')
    assert.equal(result.totalCaptures, 3)
    assert.equal(getCapturedByGame('scarlet').size, 0)
  })
})

test('sync - createSyncPayload includes the current capture log', () => {
  withStorage(() => {
    setCaptured(25, true)
    setCaptureMeta(25, { date: '2026-09-12', method: 'wild', game: 'violet' })

    const payload = createSyncPayload()
    assert.deepEqual(payload.captureLog, {
      25: { date: '2026-09-12', method: 'wild', game: 'violet' },
    })
  })
})

test('sync - encodeSyncPayload/decodeSyncPayload roundtrip preserves captureLog', async () => {
  const payload: SyncPayload = {
    v: 2,
    timestamp: Date.now(),
    capturedBitset: encodeCapturedIds(new Set([25])),
    team: { size: 6, slots: [] },
    captureLog: { 25: { date: '2026-09-12', method: 'wild', game: 'violet' } },
  }

  const token = await encodeSyncPayload(payload)
  const decoded = await decodeSyncPayload(token)
  assert.deepEqual(decoded.captureLog, payload.captureLog)
})

test('sync - applySyncPayload merge keeps the local entry when it is more recent', () => {
  withStorage(() => {
    setCaptureMeta(25, { date: '2026-09-12', method: 'wild', game: 'violet' })

    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      team: { size: 6, slots: [] },
      captureLog: { 25: { date: '2026-09-01', method: 'egg', game: 'scarlet' } },
    }

    applySyncPayload(payload, 'merge')

    assert.deepEqual(getCaptureMeta(25), { date: '2026-09-12', method: 'wild', game: 'violet' })
  })
})

test('sync - applySyncPayload merge takes the remote entry when it is more recent', () => {
  withStorage(() => {
    setCaptureMeta(25, { date: '2026-09-01', method: 'wild', game: 'violet' })

    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      team: { size: 6, slots: [] },
      captureLog: { 25: { date: '2026-09-12', method: 'egg', game: 'scarlet' } },
    }

    applySyncPayload(payload, 'merge')

    assert.deepEqual(getCaptureMeta(25), { date: '2026-09-12', method: 'egg', game: 'scarlet' })
  })
})

test('sync - applySyncPayload merge copies entries absent locally', () => {
  withStorage(() => {
    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      team: { size: 6, slots: [] },
      captureLog: { 133: { date: '2026-09-12', method: 'trade', game: null } },
    }

    applySyncPayload(payload, 'merge')

    assert.deepEqual(getCaptureMeta(133), { date: '2026-09-12', method: 'trade', game: null })
  })
})

test('sync - applySyncPayload replace never deletes entries absent from the incoming payload', () => {
  withStorage(() => {
    setCaptureMeta(1, { date: '2026-09-01', method: 'wild', game: 'violet' })
    setCaptureMeta(2, { date: '2026-09-01', method: 'egg', game: 'violet' })

    const payload: SyncPayload = {
      v: 2,
      timestamp: Date.now(),
      capturedBitset: encodeCapturedIds(new Set()),
      team: { size: 6, slots: [] },
      captureLog: { 1: { date: '2026-09-12', method: 'trade', game: 'scarlet' } },
    }

    applySyncPayload(payload, 'replace')

    assert.deepEqual(getCaptureMeta(1), { date: '2026-09-12', method: 'trade', game: 'scarlet' })
    assert.deepEqual(getCaptureMeta(2), { date: '2026-09-01', method: 'egg', game: 'violet' })
  })
})

test('sync - importBackupFile without captureLog (old backup) leaves the local log untouched', async () => {
  await withStorageAsync(async () => {
    setCaptureMeta(1, { date: '2026-09-01', method: 'wild', game: 'violet' })

    const raw = {
      app: 'PokeForge',
      version: 2,
      captured: [1],
      team: { size: 6, slots: [] },
    }
    const file = new File([JSON.stringify(raw)], 'backup.json', { type: 'application/json' })
    await importBackupFile(file, 'merge')

    assert.deepEqual(getCaptureMeta(1), { date: '2026-09-01', method: 'wild', game: 'violet' })
  })
})

async function withStorageAsync(fn: () => Promise<void>): Promise<void> {
  const stub = installStorageStub()
  try {
    await fn()
  } finally {
    stub.restore()
  }
}
