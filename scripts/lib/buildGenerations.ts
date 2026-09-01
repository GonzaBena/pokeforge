import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import type { GenerationInfo, VersionGroupInfo } from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "generations");

interface NamedApiResource {
  name: string;
  url: string;
}

interface GenerationListResponse {
  results: NamedApiResource[];
}

interface GenerationDetailResponse {
  name: string;
  main_region: NamedApiResource;
  pokemon_species: NamedApiResource[];
  version_groups: NamedApiResource[];
}

interface VersionGroupDetailResponse {
  versions: NamedApiResource[];
}

const ROMAN_NUMERALS: Record<string, string> = {
  i: "I", ii: "II", iii: "III", iv: "IV", v: "V",
  vi: "VI", vii: "VII", viii: "VIII", ix: "IX", x: "X",
};

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) throw new Error(`Cannot extract id from ${url}`);
  return Number(match[1]);
}

function displayName(generationName: string): string {
  const roman = generationName.replace("generation-", "");
  return `Generación ${ROMAN_NUMERALS[roman] ?? roman.toUpperCase()}`;
}

// Game/version names are kept in English (not translated) so they stay
// short in the acquisition table — e.g. "Red - Blue" instead of a much
// longer localized pair.
function versionDisplayName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface BuildGenerationsResult {
  generations: GenerationInfo[];
  speciesToGeneration: Map<string, string>;
  versionToGroup: Map<string, string>;
  groupToGeneration: Map<string, string>;
}

export async function buildGenerations(force = false): Promise<BuildGenerationsResult> {
  const list = await cachedFetch<GenerationListResponse>(
    "generation",
    "list",
    () => fetchJson<GenerationListResponse>(`${API_ROOT}/generation?limit=100`),
    force,
  );

  const generations: GenerationInfo[] = [];
  const speciesToGeneration = new Map<string, string>();
  const versionToGroup = new Map<string, string>();
  const groupToGeneration = new Map<string, string>();

  for (const { name, url } of list.results) {
    const id = idFromUrl(url);
    const detail = await cachedFetch<GenerationDetailResponse>(
      "generation",
      String(id),
      () => fetchJson<GenerationDetailResponse>(url),
      force,
    );

    const speciesIds = detail.pokemon_species.map((s) => idFromUrl(s.url));
    const speciesIdRange: [number, number] = speciesIds.length
      ? [Math.min(...speciesIds), Math.max(...speciesIds)]
      : [0, 0];

    for (const species of detail.pokemon_species) {
      speciesToGeneration.set(species.name, name);
    }

    const versionGroups: VersionGroupInfo[] = [];
    for (const vg of detail.version_groups) {
      groupToGeneration.set(vg.name, name);

      const vgDetail = await cachedFetch<VersionGroupDetailResponse>(
        "version-group",
        vg.name,
        () => fetchJson<VersionGroupDetailResponse>(vg.url),
        force,
      );

      const versionNames: string[] = [];
      for (const v of vgDetail.versions) {
        versionToGroup.set(v.name, vg.name);
        versionNames.push(versionDisplayName(v.name));
      }

      versionGroups.push({ name: vg.name, displayName: versionNames.join(" - ") });
    }

    generations.push({
      id,
      name,
      displayName: displayName(name),
      region: detail.main_region.name,
      speciesIdRange,
      versionGroups,
    });
  }

  generations.sort((a, b) => a.id - b.id);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "generations.json"),
    JSON.stringify(generations, null, 2),
    "utf-8",
  );

  console.log(`generations: wrote ${generations.length} entries (${versionToGroup.size} versions, ${groupToGeneration.size} version groups)`);

  return { generations, speciesToGeneration, versionToGroup, groupToGeneration };
}
