import type { EvolutionChain, Nature, NaturesIndex, PokemonDetail } from './types'
import { getAllPokemon } from './pokedexData'
import { getPokemonDetailWithFallback } from './offlineFallback'
import { getStoredMetadata, setStoredMetadata } from './indexedDb'

const DATA_ROOT = '/data'

const detailPromises = new Map<number, Promise<PokemonDetail>>()
const chainPromises = new Map<number, Promise<EvolutionChain>>()
let naturesPromise: Promise<Nature[]> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return (await res.json()) as T
}

async function rawFetchDetail(id: number): Promise<PokemonDetail> {
  return fetchJson<PokemonDetail>(`${DATA_ROOT}/pokemon-detail/${id}.json`)
}

export function getPokemonDetail(id: number): Promise<PokemonDetail> {
  let promise = detailPromises.get(id)
  if (!promise) {
    promise = getPokemonDetailWithFallback(id, getAllPokemon, rawFetchDetail)
    detailPromises.set(id, promise)
  }
  return promise
}

export function getEvolutionChain(chainId: number): Promise<EvolutionChain> {
  let promise = chainPromises.get(chainId)
  if (!promise) {
    promise = fetchJson<EvolutionChain>(`${DATA_ROOT}/evolutions/chain-${chainId}.json`)
    chainPromises.set(chainId, promise)
  }
  return promise
}

export function getNatures(): Promise<Nature[]> {
  if (!naturesPromise) {
    naturesPromise = (async () => {
      const stored = await getStoredMetadata<Nature[]>('natures')
      if (stored) return stored

      const fetched = (await fetchJson<NaturesIndex>(`${DATA_ROOT}/natures/index.json`)).natures
      setStoredMetadata('natures', fetched).catch(() => {})
      return fetched
    })()
  }
  return naturesPromise
}
