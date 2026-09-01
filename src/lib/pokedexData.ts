import type { GenerationInfo, MovesIndex, Pokemon, PokedexChunk, PokedexManifest, TypeChart } from "./types";

const DATA_ROOT = "/data";

let manifestPromise: Promise<PokedexManifest> | null = null;
let allPokemonPromise: Promise<Pokemon[]> | null = null;
let movesPromise: Promise<string[]> | null = null;
let typeChartPromise: Promise<TypeChart> | null = null;
let generationsPromise: Promise<GenerationInfo[]> | null = null;
const chunkPromises = new Map<number, Promise<Pokemon[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export function getManifest(): Promise<PokedexManifest> {
  manifestPromise ??= fetchJson<PokedexManifest>(`${DATA_ROOT}/pokedex/index.json`);
  return manifestPromise;
}

export function getChunk(index: number): Promise<Pokemon[]> {
  let promise = chunkPromises.get(index);
  if (!promise) {
    promise = getManifest().then((manifest) => {
      const entry = manifest.chunks[index];
      if (!entry) throw new Error(`Unknown chunk index ${index}`);
      return fetchJson<PokedexChunk>(`${DATA_ROOT}/pokedex/${entry.file}`).then((c) => c.pokemon);
    });
    chunkPromises.set(index, promise);
  }
  return promise;
}

export function getAllPokemon(): Promise<Pokemon[]> {
  allPokemonPromise ??= getManifest().then((manifest) =>
    Promise.all(manifest.chunks.map((c) => getChunk(c.index))).then((chunks) => chunks.flat()),
  );
  return allPokemonPromise;
}

export function getMoveIndex(): Promise<string[]> {
  movesPromise ??= fetchJson<MovesIndex>(`${DATA_ROOT}/moves/index.json`).then((m) => m.moves);
  return movesPromise;
}

export function getTypeChart(): Promise<TypeChart> {
  typeChartPromise ??= fetchJson<TypeChart>(`${DATA_ROOT}/types/type-chart.json`);
  return typeChartPromise;
}

export function getGenerations(): Promise<GenerationInfo[]> {
  generationsPromise ??= fetchJson<GenerationInfo[]>(`${DATA_ROOT}/generations/generations.json`);
  return generationsPromise;
}
