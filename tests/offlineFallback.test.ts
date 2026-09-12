import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { Pokemon } from '../src/lib/types'
import {
  buildOfflinePokemonDetail,
  getPokemonDetailWithFallback,
} from '../src/lib/offlineFallback'

const mockPokemon: Pokemon = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  sprites: {
    default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    officialArtwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  },
  generation: 'generation-i',
  moves: ['thunder-shock', 'quick-attack', 'thunderbolt'],
}

describe('Offline Pokemon Detail Fallback', () => {
  it('generates a valid PokemonDetail object with isOfflineFallback flag', () => {
    const detail = buildOfflinePokemonDetail(mockPokemon)

    assert.equal(detail.id, 25)
    assert.equal(detail.isOfflineFallback, true)
    assert.ok(detail.stats)
    assert.equal(typeof detail.stats.hp, 'number')
    assert.equal(typeof detail.stats.attack, 'number')
    assert.equal(typeof detail.stats.defense, 'number')
    assert.equal(typeof detail.stats.specialAttack, 'number')
    assert.equal(typeof detail.stats.specialDefense, 'number')
    assert.equal(typeof detail.stats.speed, 'number')
    assert.ok(Array.isArray(detail.abilities))
    assert.ok(Array.isArray(detail.acquisitions))
  })

  it('maps pokemon moves into moveDetails structure with level-up fallback', () => {
    const detail = buildOfflinePokemonDetail(mockPokemon)

    assert.equal(detail.moveDetails.length, 3)
    assert.equal(detail.moveDetails[0]?.name, 'thunder-shock')
    assert.equal(detail.moveDetails[0]?.method, 'level-up')
    assert.equal(detail.moveDetails[1]?.name, 'quick-attack')
    assert.equal(detail.moveDetails[2]?.name, 'thunderbolt')
  })

  it('handles pokemon with empty moves list gracefully', () => {
    const emptyPokemon: Pokemon = {
      ...mockPokemon,
      id: 9999,
      moves: [],
    }
    const detail = buildOfflinePokemonDetail(emptyPokemon)
    assert.equal(detail.id, 9999)
    assert.deepEqual(detail.moveDetails, [])
  })

  it('getPokemonDetailWithFallback returns real detail when fetch succeeds', async () => {
    const realDetail = {
      id: 25,
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
      abilities: [{ name: 'static', isHidden: false, slot: 1, probability: 1 }],
      moveDetails: [{ name: 'growl', method: 'level-up', level: 1 }],
      evolvesFrom: 'pichu',
      evolutionChainId: 10,
      acquisitions: [],
    }

    const result = await getPokemonDetailWithFallback(
      25,
      async () => [mockPokemon],
      async () => realDetail,
    )

    assert.equal(result.id, 25)
    assert.equal(result.isOfflineFallback, undefined)
    assert.equal(result.evolvesFrom, 'pichu')
  })

  it('getPokemonDetailWithFallback returns offline fallback when fetch fails', async () => {
    const failingFetcher = async () => {
      throw new Error('Failed to fetch /data/pokemon-detail/25.json: 404 (offline)')
    }

    const result = await getPokemonDetailWithFallback(
      25,
      async () => [mockPokemon],
      failingFetcher,
    )

    assert.equal(result.id, 25)
    assert.equal(result.isOfflineFallback, true)
    assert.equal(result.moveDetails.length, 3)
  })

  it('propagates error when pokemon is not found in allPokemon either', async () => {
    const failingFetcher = async () => {
      throw new Error('Failed to fetch /data/pokemon-detail/999.json: 404')
    }

    await assert.rejects(
      async () => {
        await getPokemonDetailWithFallback(999, async () => [mockPokemon], failingFetcher)
      },
      {
        message: 'Pokemon #999 not found in local pokedex data',
      },
    )
  })
})
