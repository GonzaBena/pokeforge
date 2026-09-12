import type { MoveDetail, Pokemon, PokemonDetail, PokemonStats } from './types'

const DEFAULT_OFFLINE_STATS: PokemonStats = {
  hp: 50,
  attack: 50,
  defense: 50,
  specialAttack: 50,
  specialDefense: 50,
  speed: 50,
}

/**
 * Builds a degraded PokemonDetail object when offline and the individual
 * detail file (/data/pokemon-detail/{id}.json) is not available in cache.
 */
export function buildOfflinePokemonDetail(pokemon: Pokemon): PokemonDetail {
  const moveDetails: MoveDetail[] = (pokemon.moves || []).map((moveName) => ({
    name: moveName,
    method: 'level-up',
    level: 0,
  }))

  return {
    id: pokemon.id,
    stats: { ...DEFAULT_OFFLINE_STATS },
    abilities: [],
    moveDetails,
    evolvesFrom: null,
    evolutionChainId: null,
    acquisitions: [],
    isOfflineFallback: true,
  }
}

/**
 * Wraps fetching of Pokemon detail with automatic fallback to local pokedex data.
 */
export async function getPokemonDetailWithFallback(
  id: number,
  allPokemonGetter: () => Promise<Pokemon[]>,
  detailFetcher: (id: number) => Promise<PokemonDetail>,
): Promise<PokemonDetail> {
  try {
    return await detailFetcher(id)
  } catch (err) {
    const allPokes = await allPokemonGetter()
    const found = allPokes.find((p) => p.id === id)
    if (!found) {
      throw new Error(`Pokemon #${id} not found in local pokedex data`)
    }
    return buildOfflinePokemonDetail(found)
  }
}
