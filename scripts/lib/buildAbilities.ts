import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import { createLimiter } from "./limiter.ts";
import { getLocalizedName } from "./localizedResource.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "..", "public", "data", "abilities");

interface RawAbilityDetail {
  id: number;
  name: string;
  names?: { name: string; language: { name: string } }[];
  flavor_text_entries?: { flavor_text: string; language: { name: string }; version_group?: { name: string } }[];
  effect_entries?: { effect: string; short_effect: string; language: { name: string } }[];
}

export interface AbilityData {
  name: string;
  nameEs?: string;
  nameEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
}

export type AbilitiesMap = Map<string, AbilityData>;

export async function buildAbilities(force = false): Promise<AbilitiesMap> {
  const list = await cachedFetch<{ results: { name: string; url: string }[] }>(
    "abilities",
    "list",
    () => fetchJson(`${API_ROOT}/ability?limit=500`),
    force,
  );

  const abilitiesMap = new Map<string, AbilityData>();
  const limit = createLimiter(15);

  await Promise.all(
    list.results.map(({ name, url }) =>
      limit(async () => {
        try {
          const raw = await cachedFetch<RawAbilityDetail>(
            "ability-detail",
            name,
            () => fetchJson<RawAbilityDetail>(url),
            force,
          );

          const nameEs = getLocalizedName(raw.names, "es", "en");
          const nameEn = getLocalizedName(raw.names, "en", "en");

          // For description in Spanish, check flavor text entries (filter to Spanish, take latest)
          let descEs = "";
          const esFlavors = raw.flavor_text_entries?.filter((f) => f.language.name === "es");
          if (esFlavors && esFlavors.length > 0) {
            descEs = esFlavors[esFlavors.length - 1].flavor_text.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
          }

          // For description in English, check flavor text first then effect_entries
          let descEn = "";
          const enFlavors = raw.flavor_text_entries?.filter((f) => f.language.name === "en");
          if (enFlavors && enFlavors.length > 0) {
            descEn = enFlavors[enFlavors.length - 1].flavor_text.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
          } else {
            const enEffect = raw.effect_entries?.find((e) => e.language.name === "en");
            if (enEffect?.short_effect) {
              descEn = enEffect.short_effect.replace(/[\f\n\r]/g, " ").replace(/\s+/g, " ").trim();
            }
          }

          // If no Spanish flavor text, fallback to English
          if (!descEs && descEn) {
            descEs = descEn;
          }

          abilitiesMap.set(name, {
            name: raw.name,
            ...(nameEs ? { nameEs } : {}),
            ...(nameEn ? { nameEn } : {}),
            ...(descEs ? { descriptionEs: descEs } : {}),
            ...(descEn ? { descriptionEn: descEn } : {}),
          });
        } catch (err) {
          console.warn(`Failed to fetch ability detail for ${name}:`, err);
        }
      }),
    ),
  );

  await mkdir(OUT_DIR, { recursive: true });
  const plainObject: Record<string, AbilityData> = {};
  for (const [k, v] of abilitiesMap) {
    plainObject[k] = v;
  }
  await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(plainObject), "utf-8");

  console.log(`abilities: wrote details for ${abilitiesMap.size} abilities to public/data/abilities/index.json`);
  return abilitiesMap;
}
