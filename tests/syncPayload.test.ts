import test from 'node:test'
import assert from 'node:assert/strict'
import {
  encodeCapturedIds,
  decodeCapturedIds,
  encodeSyncPayload,
  decodeSyncPayload,
  parseCloudPairingFromHash,
  generateCloudPairingUrl,
  type SyncPayload,
} from '../src/lib/sync'

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
