import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "./http.ts";
import { readCache, cachedFetch } from "./diskCache.ts";
import { createLimiter } from "./limiter.ts";
import type { SpeciesInfo } from "./buildSpeciesInfo.ts";
import type {
  AcquisitionRow,
  EvolutionChain,
  EvolutionNode,
  GenerationInfo,
  MoveDetail,
  PokemonDetail,
  PokemonStats,
} from "../../src/lib/types.ts";

const API_ROOT = "https://pokeapi.co/api/v2";
const OUT_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "public",
  "data",
  "pokemon-detail",
);

interface VersionGroupDetail {
  level_learned_at: number;
  move_learn_method: { name: string };
  version_group: { name: string; url: string };
}

interface RawMoveEntry {
  move: { name: string };
  version_group_details: VersionGroupDetail[];
}

interface RawStatEntry {
  base_stat: number;
  stat: { name: string };
}

interface RawPokemonDetail {
  id: number;
  name: string;
  stats: RawStatEntry[];
  moves: RawMoveEntry[];
}

interface EncounterEntry {
  location_area: { name: string };
  version_details: { version: { name: string } }[];
}

const TRIGGER_ES: Record<string, string> = {
  "level-up": "Nivel",
  trade: "Intercambio",
  "use-item": "Usar objeto",
  shed: "Muda",
  "agile-style-move": "Movimiento estilo ágil",
  "strong-style-move": "Movimiento estilo fuerte",
  "three-critical-hits": "3 golpes críticos",
  "take-damage": "Recibir daño",
  other: "Especial",
};

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractStats(raw: RawPokemonDetail): PokemonStats {
  const find = (name: string) =>
    raw.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
  return {
    hp: find("hp"),
    attack: find("attack"),
    defense: find("defense"),
    specialAttack: find("special-attack"),
    specialDefense: find("special-defense"),
    speed: find("speed"),
  };
}

// Picks the most recent version group referenced across this pokemon's
// moves (highest version-group id) so the movepool reflects current games
// instead of mixing move-learn data across every game it has ever appeared in.
function extractMoveDetails(raw: RawPokemonDetail): MoveDetail[] {
  const moveMap = new Map<string, MoveDetail>();

  for (const m of raw.moves) {
    const moveName = m.move.name;

    for (const vgd of m.version_group_details) {
      let rawMethod = vgd.move_learn_method.name;
      let method = rawMethod === "train" ? "tutor" : rawMethod;

      const key = `${moveName}:${method}`;
      const existing = moveMap.get(key);

      const level = vgd.level_learned_at;

      if (!existing) {
        moveMap.set(key, {
          name: moveName,
          method,
          level,
        });
      } else if (method === "level-up" && existing.level === 0 && level > 0) {
        existing.level = level;
      }
    }
  }

  const details = Array.from(moveMap.values());

  const methodOrder = ["level-up", "machine", "tutor", "egg"];
  return details.sort((a, b) => {
    const aOrder = methodOrder.indexOf(a.method) !== -1 ? methodOrder.indexOf(a.method) : 99;
    const bOrder = methodOrder.indexOf(b.method) !== -1 ? methodOrder.indexOf(b.method) : 99;
    const orderDiff = aOrder - bOrder;
    if (orderDiff !== 0) return orderDiff;
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });
}

function evolutionMethodText(
  node: EvolutionNode,
  itemEs: Map<string, string>,
): string {
  const from = node.evolvesFromSpecies
    ? formatLabel(node.evolvesFromSpecies)
    : "";
  const parts: string[] = [];
  if (node.minLevel) parts.push(`Nivel ${node.minLevel}`);
  if (node.item)
    parts.push(`usando ${itemEs.get(node.item) ?? formatLabel(node.item)}`);
  if (
    !node.minLevel &&
    !node.item &&
    node.trigger &&
    node.trigger !== "level-up"
  ) {
    parts.push(TRIGGER_ES[node.trigger] ?? formatLabel(node.trigger));
  }
  const detail = parts.length ? ` (${parts.join(", ")})` : "";
  return `Evolucionar a partir de ${from}${detail}`;
}

// Carries raw generation/version-group keys (instead of baked display
// strings) so rows can be sorted into chronological order before the final
// display text is resolved.
interface RawAcquisitionRow {
  generation: string;
  versionGroup: string;
  location: string;
  method: string;
}

function buildWildRows(
  encounters: EncounterEntry[],
  versionToGroup: Map<string, string>,
  groupToGeneration: Map<string, string>,
): RawAcquisitionRow[] {
  const seen = new Set<string>();
  const rows: RawAcquisitionRow[] = [];

  for (const enc of encounters) {
    const location = formatLabel(enc.location_area.name);
    for (const { version } of enc.version_details) {
      const versionGroup = versionToGroup.get(version.name);
      if (!versionGroup) continue;
      const generation = groupToGeneration.get(versionGroup);
      if (!generation) continue;

      const key = `${generation}|${versionGroup}|${location}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        generation,
        versionGroup,
        location,
        method: "Encuentro salvaje",
      });
    }
  }

  return rows;
}

// Only the species' own debut generation is used for the synthesized
// evolution row — PokeAPI doesn't cleanly expose per-game evolution
// availability across every later generation, so extrapolating further
// would risk claiming availability in games that don't actually include
// this species (National Dex gaps, remakes, etc).
function buildEvolutionRows(
  node: EvolutionNode | undefined,
  ownGenerationName: string | undefined,
  generationsByName: Map<string, GenerationInfo>,
  itemEs: Map<string, string>,
): RawAcquisitionRow[] {
  if (!node || !node.evolvesFromSpecies || !ownGenerationName) return [];
  const gen = generationsByName.get(ownGenerationName);
  if (!gen) return [];

  const method = evolutionMethodText(node, itemEs);
  return gen.versionGroups.map((vg) => ({
    generation: gen.name,
    versionGroup: vg.name,
    location: "-",
    method,
  }));
}

interface BuildContext {
  speciesInfoById: Map<number, SpeciesInfo>;
  chains: Map<number, EvolutionChain>;
  itemEs: Map<string, string>;
  speciesToGeneration: Map<string, string>;
  generationsByName: Map<string, GenerationInfo>;
  versionToGroup: Map<string, string>;
  groupToGeneration: Map<string, string>;
  generationDisplay: Map<string, string>;
  versionGroupDisplay: Map<string, string>;
  generationOrder: Map<string, number>;
  versionGroupOrder: Map<string, number>;
}

function sortAndFormatRows(
  rows: RawAcquisitionRow[],
  generationDisplay: Map<string, string>,
  versionGroupDisplay: Map<string, string>,
  generationOrder: Map<string, number>,
  versionGroupOrder: Map<string, number>,
): AcquisitionRow[] {
  return [...rows]
    .sort((a, b) => {
      const genDiff =
        (generationOrder.get(a.generation) ?? 0) -
        (generationOrder.get(b.generation) ?? 0);
      if (genDiff !== 0) return genDiff;
      return (
        (versionGroupOrder.get(a.versionGroup) ?? 0) -
        (versionGroupOrder.get(b.versionGroup) ?? 0)
      );
    })
    .map((row) => ({
      generation: generationDisplay.get(row.generation) ?? row.generation,
      game: versionGroupDisplay.get(row.versionGroup) ?? row.versionGroup,
      location: row.location,
      method: row.method,
    }));
}

async function buildOneDetail(
  id: number,
  force: boolean,
  ctx: BuildContext,
  failed: number[],
): Promise<void> {
  const raw = await readCache<RawPokemonDetail>("pokemon", String(id));
  if (!raw) {
    failed.push(id);
    return;
  }

  try {
    const speciesInfo = ctx.speciesInfoById.get(id) ?? {
      evolvesFrom: null,
      evolutionChainId: null,
    };

    const encounters = await cachedFetch<EncounterEntry[]>(
      "encounters",
      String(id),
      () => fetchJson<EncounterEntry[]>(`${API_ROOT}/pokemon/${id}/encounters`),
      force,
    );

    const wildRows = buildWildRows(
      encounters,
      ctx.versionToGroup,
      ctx.groupToGeneration,
    );

    let evolutionRows: RawAcquisitionRow[] = [];
    if (speciesInfo.evolutionChainId !== null) {
      const chain = ctx.chains.get(speciesInfo.evolutionChainId);
      const node = chain?.nodes.find((n) => n.speciesId === id);
      const ownGeneration = ctx.speciesToGeneration.get(raw.name);
      evolutionRows = buildEvolutionRows(
        node,
        ownGeneration,
        ctx.generationsByName,
        ctx.itemEs,
      );
    }

    const acquisitions = sortAndFormatRows(
      [...wildRows, ...evolutionRows],
      ctx.generationDisplay,
      ctx.versionGroupDisplay,
      ctx.generationOrder,
      ctx.versionGroupOrder,
    );

    const detail: PokemonDetail = {
      id,
      stats: extractStats(raw),
      moveDetails: extractMoveDetails(raw),
      evolvesFrom: speciesInfo.evolvesFrom,
      evolutionChainId: speciesInfo.evolutionChainId,
      acquisitions,
    };

    await writeFile(
      path.join(OUT_DIR, `${id}.json`),
      JSON.stringify(detail),
      "utf-8",
    );
  } catch (err) {
    console.error(`pokemon-details: failed for pokemon ${id}: ${String(err)}`);
    failed.push(id);
  }
}

export interface BuildPokemonDetailsResult {
  failedIds: number[];
}

export async function buildPokemonDetails(
  totalCount: number,
  speciesInfoById: Map<number, SpeciesInfo>,
  chains: Map<number, EvolutionChain>,
  itemEs: Map<string, string>,
  speciesToGeneration: Map<string, string>,
  generations: GenerationInfo[],
  versionToGroup: Map<string, string>,
  groupToGeneration: Map<string, string>,
  force = false,
): Promise<BuildPokemonDetailsResult> {
  await mkdir(OUT_DIR, { recursive: true });

  const generationsByName = new Map(generations.map((g) => [g.name, g]));
  // Short form for the table's Generación column ("Generación I" -> "I").
  const generationDisplay = new Map(
    generations.map((g) => [g.name, g.displayName.replace("Gen ", "")]),
  );
  const versionGroupDisplay = new Map(
    generations.flatMap((g) =>
      g.versionGroups.map((vg) => [vg.name, vg.displayName] as const),
    ),
  );
  const generationOrder = new Map(generations.map((g) => [g.name, g.id]));
  const versionGroupOrder = new Map(
    generations.flatMap((g) =>
      g.versionGroups.map((vg, i) => [vg.name, i] as const),
    ),
  );

  const ctx: BuildContext = {
    speciesInfoById,
    chains,
    itemEs,
    speciesToGeneration,
    generationsByName,
    versionToGroup,
    groupToGeneration,
    generationDisplay,
    versionGroupDisplay,
    generationOrder,
    versionGroupOrder,
  };

  const limit = createLimiter();
  const failed: number[] = [];

  console.log(`pokemon-details: building details for ${totalCount} pokemon...`);

  await Promise.all(
    Array.from({ length: totalCount }, (_, i) => i + 1).map((id) =>
      limit(() => buildOneDetail(id, force, ctx, failed)),
    ),
  );

  console.log(
    `pokemon-details: wrote ${totalCount - failed.length}/${totalCount} detail files (${failed.length} failed)`,
  );

  return { failedIds: failed };
}
