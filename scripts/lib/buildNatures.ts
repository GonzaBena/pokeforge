import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import type { Nature, NaturesIndex } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "natures");
const NATURE_IDS = Array.from({ length: 25 }, (_, i) => i + 1);

interface NamedApiResource {
  name: string;
}

interface NatureDetailResponse {
  name: string;
  increased_stat: NamedApiResource | null;
  decreased_stat: NamedApiResource | null;
}

export async function buildNatures(force = false): Promise<NaturesIndex> {
  const natures: Nature[] = [];

  for (const id of NATURE_IDS) {
    const detail = await cachedFetch<NatureDetailResponse>(
      "nature",
      String(id),
      () => fetchJson<NatureDetailResponse>(`${API_ROOT}/nature/${id}`),
      force,
    );
    natures.push({
      name: detail.name,
      increasedStat: detail.increased_stat?.name ?? null,
      decreasedStat: detail.decreased_stat?.name ?? null,
    });
  }

  const result: NaturesIndex = { natures };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(result), "utf-8");

  console.log(`natures: wrote ${natures.length} entries`);

  return result;
}
