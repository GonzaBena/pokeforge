import { fetchJson } from "./http.ts";
import { cachedFetch } from "./diskCache.ts";
import { createLimiter } from "./limiter.ts";

const API_ROOT = "https://pokeapi.co/api/v2";

interface SpeciesResponse {
  evolves_from_species: { name: string } | null;
  evolution_chain: { url: string } | null;
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

export interface SpeciesInfo {
  evolvesFrom: string | null;
  evolutionChainId: number | null;
}

export interface BuildSpeciesInfoResult {
  speciesInfoById: Map<number, SpeciesInfo>;
  evolutionChainIds: number[];
  failedIds: number[];
}

export async function buildSpeciesInfo(totalCount: number, force = false): Promise<BuildSpeciesInfoResult> {
  const limit = createLimiter();
  const speciesInfoById = new Map<number, SpeciesInfo>();
  const chainIds = new Set<number>();
  const failed: number[] = [];

  console.log(`species-info: fetching species data for ${totalCount} pokemon...`);

  await Promise.all(
    Array.from({ length: totalCount }, (_, i) => i + 1).map((id) =>
      limit(async () => {
        try {
          const species = await cachedFetch<SpeciesResponse>(
            "species",
            String(id),
            () => fetchJson<SpeciesResponse>(`${API_ROOT}/pokemon-species/${id}`),
            force,
          );
          const evolutionChainId = species.evolution_chain ? idFromUrl(species.evolution_chain.url) : null;
          if (evolutionChainId) chainIds.add(evolutionChainId);
          speciesInfoById.set(id, { evolvesFrom: species.evolves_from_species?.name ?? null, evolutionChainId });
        } catch (err) {
          console.error(`species-info: failed for pokemon ${id}: ${String(err)}`);
          failed.push(id);
        }
      }),
    ),
  );

  console.log(`species-info: resolved ${speciesInfoById.size}/${totalCount} species (${chainIds.size} unique evolution chains)`);

  return { speciesInfoById, evolutionChainIds: [...chainIds], failedIds: failed };
}
