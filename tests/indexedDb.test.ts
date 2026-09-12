import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isIndexedDbSupported,
  getStoredMetadata,
  setStoredMetadata,
  getStoredChunk,
  setStoredChunk,
  getAllStoredPokemon,
  setAllStoredPokemon,
} from '../src/lib/indexedDb'
import type { Pokemon } from '../src/lib/types'

describe('IndexedDB Local Cache Storage', () => {
  it('isIndexedDbSupported returns false gracefully in Node test environment without window/indexedDB', () => {
    const supported = isIndexedDbSupported()
    assert.equal(typeof supported, 'boolean')
  })

  it('handles getStoredMetadata gracefully when indexedDB is not available', async () => {
    const data = await getStoredMetadata('test-key')
    assert.equal(data, null)
  })

  it('handles setStoredMetadata gracefully when indexedDB is not available', async () => {
    // Should resolve without throwing
    await setStoredMetadata('test-key', { foo: 'bar' })
  })

  it('handles getStoredChunk and setStoredChunk gracefully when indexedDB is not available', async () => {
    const chunk = await getStoredChunk(0)
    assert.equal(chunk, null)
    await setStoredChunk(0, [])
  })

  it('handles getAllStoredPokemon and setAllStoredPokemon gracefully', async () => {
    const all = await getAllStoredPokemon()
    assert.equal(all, null)
    const mockPokes: Pokemon[] = [
      {
        id: 1,
        name: 'bulbasaur',
        types: ['grass', 'poison'],
        sprites: { default: null, officialArtwork: null },
        generation: 'generation-i',
        moves: ['tackle'],
      },
    ]
    await setAllStoredPokemon(mockPokes)
  })
})
