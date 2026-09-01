import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { readCache, writeCache } from "./diskCache.ts";
import { createLimiter } from "./limiter.ts";
import type { Pokemon, PokedexChunk, PokedexManifest, PokedexManifestEntry } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "pokedex");
const CHUNK_SIZE = 100;

interface NamedApiResource {
  name: string;
  url: string;
}

interface PokemonDetailResponse {
  id: number;
  name: string;
  species: NamedApiResource;
  types: { slot: number; type: NamedApiResource }[];
  moves: { move: NamedApiResource }[];
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
}

interface SpeciesCountResponse {
  count: number;
}

async function fetchSpeciesCount(force: boolean): Promise<number> {
  if (!force) {
    const cached = await readCache<SpeciesCountResponse>("species-count", "count");
    if (cached) return cached.count;
  }
  const data = await fetchJson<SpeciesCountResponse>(`${API_ROOT}/pokemon-species?limit=1`);
  await writeCache("species-count", "count", data);
  return data.count;
}

async function fetchOnePokemon(
  id: number,
  speciesToGeneration: Map<string, string>,
  force: boolean,
  stats: { fetched: number; cached: number; failed: number[] },
): Promise<Pokemon | null> {
  if (!force) {
    const cached = await readCache<PokemonDetailResponse>("pokemon", String(id));
    if (cached) {
      stats.cached++;
      return toPokemon(cached, speciesToGeneration);
    }
  }

  try {
    const data = await fetchJson<PokemonDetailResponse>(`${API_ROOT}/pokemon/${id}`);
    await writeCache("pokemon", String(id), data);
    stats.fetched++;
    return toPokemon(data, speciesToGeneration);
  } catch (err) {
    console.error(`pokedex: failed to fetch pokemon ${id}: ${String(err)}`);
    stats.failed.push(id);
    return null;
  }
}

function toPokemon(data: PokemonDetailResponse, speciesToGeneration: Map<string, string>): Pokemon {
  const types = [...data.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const moves = [...new Set(data.moves.map((m) => m.move.name))].sort();

  return {
    id: data.id,
    name: data.name,
    types,
    sprites: {
      default: data.sprites.front_default,
      officialArtwork: data.sprites.other?.["official-artwork"]?.front_default ?? null,
    },
    generation: speciesToGeneration.get(data.species.name) ?? "unknown",
    moves,
  };
}

export interface BuildPokedexResult {
  totalCount: number;
  fetchedFromApi: number;
  fetchedFromCache: number;
  failedIds: number[];
}

export async function buildPokedex(
  speciesToGeneration: Map<string, string>,
  force = false,
): Promise<BuildPokedexResult> {
  const count = await fetchSpeciesCount(force);
  const limit = createLimiter();
  const stats = { fetched: 0, cached: 0, failed: [] as number[] };

  console.log(`pokedex: fetching ${count} pokemon (concurrency 8)...`);

  const results = await Promise.all(
    Array.from({ length: count }, (_, i) => i + 1).map((id) =>
      limit(() => fetchOnePokemon(id, speciesToGeneration, force, stats)),
    ),
  );

  const pokemon = results.filter((p): p is Pokemon => p !== null).sort((a, b) => a.id - b.id);

  await mkdir(OUT_DIR, { recursive: true });

  const chunks: PokedexManifestEntry[] = [];
  for (let i = 0; i * CHUNK_SIZE < pokemon.length; i++) {
    const slice = pokemon.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const idRange: [number, number] = [slice[0].id, slice[slice.length - 1].id];
    const chunk: PokedexChunk = { chunkIndex: i, idRange, pokemon: slice };
    const file = `chunk-${i}.json`;

    await writeFile(path.join(OUT_DIR, file), JSON.stringify(chunk), "utf-8");
    chunks.push({ index: i, file, idRange, count: slice.length });
  }

  const manifest: PokedexManifest = {
    totalCount: pokemon.length,
    chunkSize: CHUNK_SIZE,
    chunkCount: chunks.length,
    generatedAt: new Date().toISOString(),
    chunks,
  };

  await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(
    `pokedex: wrote ${pokemon.length}/${count} pokemon across ${chunks.length} chunks ` +
      `(${stats.fetched} fetched, ${stats.cached} cached, ${stats.failed.length} failed)`,
  );

  return {
    totalCount: pokemon.length,
    fetchedFromApi: stats.fetched,
    fetchedFromCache: stats.cached,
    failedIds: stats.failed,
  };
}
