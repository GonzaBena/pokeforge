import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import type { MovesIndex } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "moves");

interface NamedApiResource {
  name: string;
  url: string;
}

interface MoveListResponse {
  results: NamedApiResource[];
}

export async function buildMovesIndex(force = false): Promise<MovesIndex> {
  const list = await cachedFetch<MoveListResponse>(
    "moves",
    "list",
    () => fetchJson<MoveListResponse>(`${API_ROOT}/move?limit=1000`),
    force,
  );

  const moves = list.results.map((m) => m.name).sort();
  const result: MovesIndex = { moves };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(result), "utf-8");

  console.log(`moves-index: wrote ${moves.length} move names`);

  return result;
}
