import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import type { TypeChart } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "types");

// Ids 1-18 map exactly to the 18 canonical battle types on PokeAPI
// (unknown/shadow live at much higher ids and are intentionally excluded).
const TYPE_IDS = Array.from({ length: 18 }, (_, i) => i + 1);

interface NamedApiResource {
  name: string;
  url: string;
}

interface TypeDetailResponse {
  name: string;
  damage_relations: {
    double_damage_to: NamedApiResource[];
    half_damage_to: NamedApiResource[];
    no_damage_to: NamedApiResource[];
  };
}

export async function buildTypeChart(force = false): Promise<TypeChart> {
  const details: TypeDetailResponse[] = [];

  for (const id of TYPE_IDS) {
    const detail = await cachedFetch<TypeDetailResponse>(
      "type",
      String(id),
      () => fetchJson<TypeDetailResponse>(`${API_ROOT}/type/${id}`),
      force,
    );
    details.push(detail);
  }

  const types = details.map((d) => d.name).sort() as TypeChart["types"];
  const chart: TypeChart["chart"] = {};

  for (const attacker of details) {
    const row: Record<string, number> = {};
    for (const defender of types) row[defender] = 1;

    for (const { name } of attacker.damage_relations.double_damage_to) row[name] = 2;
    for (const { name } of attacker.damage_relations.half_damage_to) row[name] = 0.5;
    for (const { name } of attacker.damage_relations.no_damage_to) row[name] = 0;

    chart[attacker.name] = row;
  }

  const result: TypeChart = { types, chart };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "type-chart.json"), JSON.stringify(result, null, 2), "utf-8");

  console.log(`type-chart: wrote ${types.length} types`);

  return result;
}
