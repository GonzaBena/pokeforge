import type {
  GameDexData,
  GenerationInfo,
  MoveData,
  MovesIndex,
  Pokemon,
  PokedexChunk,
  PokedexManifest,
  TypeChart,
} from './types'
import {
  getAllStoredPokemon,
  getStoredChunk,
  getStoredMetadata,
  setAllStoredPokemon,
  setStoredChunk,
  setStoredMetadata,
} from './indexedDb'

const DATA_ROOT = '/data'

let manifestPromise: Promise<PokedexManifest> | null = null
let allPokemonPromise: Promise<Pokemon[]> | null = null
let movesPromise: Promise<string[]> | null = null
let typeChartPromise: Promise<TypeChart> | null = null
let generationsPromise: Promise<GenerationInfo[]> | null = null
const chunkPromises = new Map<number, Promise<Pokemon[]>>()

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return (await res.json()) as T
}

export function getManifest(): Promise<PokedexManifest> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      const stored = await getStoredMetadata<PokedexManifest>('manifest')
      if (stored) return stored

      const fetched = await fetchJson<PokedexManifest>(`${DATA_ROOT}/pokedex/index.json`)
      setStoredMetadata('manifest', fetched).catch(() => {})
      return fetched
    })()
  }
  return manifestPromise
}

export function getChunk(index: number): Promise<Pokemon[]> {
  let promise = chunkPromises.get(index)
  if (!promise) {
    promise = (async () => {
      const stored = await getStoredChunk(index)
      if (stored && stored.length > 0) return stored

      const manifest = await getManifest()
      const entry = manifest.chunks[index]
      if (!entry) throw new Error(`Unknown chunk index ${index}`)
      const chunk = await fetchJson<PokedexChunk>(`${DATA_ROOT}/pokedex/${entry.file}`)
      setStoredChunk(index, chunk.pokemon).catch(() => {})
      return chunk.pokemon
    })()
    chunkPromises.set(index, promise)
  }
  return promise
}

export function getAllPokemon(): Promise<Pokemon[]> {
  if (!allPokemonPromise) {
    allPokemonPromise = (async () => {
      const storedAll = await getAllStoredPokemon()
      if (storedAll && storedAll.length > 0) return storedAll

      const manifest = await getManifest()
      const chunks = await Promise.all(manifest.chunks.map((c) => getChunk(c.index)))
      const flat = chunks.flat()
      setAllStoredPokemon(flat).catch(() => {})
      return flat
    })()
  }
  return allPokemonPromise
}

export function getMoveIndex(): Promise<string[]> {
  if (!movesPromise) {
    movesPromise = (async () => {
      const stored = await getStoredMetadata<string[]>('moves-index')
      if (stored) return stored

      const fetched = (await fetchJson<MovesIndex>(`${DATA_ROOT}/moves/index.json`)).moves
      setStoredMetadata('moves-index', fetched).catch(() => {})
      return fetched
    })()
  }
  return movesPromise
}

export function getTypeChart(): Promise<TypeChart> {
  if (!typeChartPromise) {
    typeChartPromise = (async () => {
      const stored = await getStoredMetadata<TypeChart>('type-chart')
      if (stored) return stored

      const fetched = await fetchJson<TypeChart>(`${DATA_ROOT}/types/type-chart.json`)
      setStoredMetadata('type-chart', fetched).catch(() => {})
      return fetched
    })()
  }
  return typeChartPromise
}

export function getGenerations(): Promise<GenerationInfo[]> {
  if (!generationsPromise) {
    generationsPromise = (async () => {
      const stored = await getStoredMetadata<GenerationInfo[]>('generations')
      if (stored) return stored

      const fetched = await fetchJson<GenerationInfo[]>(`${DATA_ROOT}/generations/generations.json`)
      setStoredMetadata('generations', fetched).catch(() => {})
      return fetched
    })()
  }
  return generationsPromise
}

let gameDexPromise: Promise<GameDexData> | null = null

export function getGameDexData(): Promise<GameDexData> {
  if (!gameDexPromise) {
    gameDexPromise = (async () => {
      const stored = await getStoredMetadata<GameDexData>('game-pokedex')
      if (stored) return stored

      const fetched = await fetchJson<GameDexData>(`${DATA_ROOT}/pokedex/game-pokedex.json`)
      setStoredMetadata('game-pokedex', fetched).catch(() => {})
      return fetched
    })()
  }
  return gameDexPromise
}

let moveDetailsMapPromise: Promise<Record<string, MoveData>> | null = null

export function getMoveDetailsMap(): Promise<Record<string, MoveData>> {
  if (!moveDetailsMapPromise) {
    moveDetailsMapPromise = (async () => {
      const stored = await getStoredMetadata<Record<string, MoveData>>('move-details-map')
      if (stored) return stored

      const fetched = await fetchJson<Record<string, MoveData>>(`${DATA_ROOT}/moves/details.json`)
      setStoredMetadata('move-details-map', fetched).catch(() => {})
      return fetched
    })()
  }
  return moveDetailsMapPromise
}
