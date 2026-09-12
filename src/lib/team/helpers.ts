import type { GameDexData, GameVersionMeta, GenerationInfo, Pokemon, TeamState } from "../types";
import { getCurrentLocale, getGameTitle, getRegionName, getTranslations, type Locale } from "../i18n/translations";
import type { EmptyStateOptions, GameSpeciesSetEntry } from "./types";

export const METHOD_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    "level-up": "Nivel",
    machine: "MT/MO",
    tutor: "Tutor",
    train: "Tutor",
    egg: "Huevo",
  },
  en: {
    "level-up": "Level",
    machine: "TM/HM",
    tutor: "Tutor",
    train: "Tutor",
    egg: "Egg",
  },
};

export function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatMult(mult: number): string {
  if (mult === 0) return "0×";
  if (mult === 0.25) return "¼×";
  if (mult === 0.5) return "½×";
  if (mult === 2) return "2×";
  if (mult === 4) return "4×";
  return `${mult}×`;
}

export function categoryLabel(cat: string, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);
  if (cat === "physical") return t.team.physical;
  if (cat === "special") return t.team.special;
  if (cat === "status") return t.team.status;
  return cat;
}

export function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function autoDetectGameFromTeam(
  team: TeamState,
  gameDexData: GameDexData | null,
  gameSpeciesSets: Map<string, GameSpeciesSetEntry>
): string {
  const activeIds = team.slots
    .map((s) => s.pokemonId)
    .filter((id): id is number => id !== null);
  if (!activeIds.length || !gameDexData) return "";

  const gameEntries = Object.entries(gameDexData).reverse();
  for (const [gname] of gameEntries) {
    const set = gameSpeciesSets.get(gname);
    if (set && activeIds.every((id) => set.obtainable.has(id))) {
      return gname;
    }
  }
  return "";
}

export function getPickerExclusiveMap(
  game: string,
  gameDexData: GameDexData | null
): Map<number, GameVersionMeta> {
  const map = new Map<number, GameVersionMeta>();
  if (!game || !gameDexData || !gameDexData[game]) return map;
  const entry = gameDexData[game];
  if (!entry.exclusives || !entry.versions || entry.versions.length !== 2) return map;

  const versionMetaMap = new Map(entry.versions.map((v) => [v.id, v]));
  for (const [vId, ids] of Object.entries(entry.exclusives)) {
    const meta = versionMetaMap.get(vId);
    if (meta) {
      for (const id of ids) {
        map.set(id, meta);
      }
    }
  }
  return map;
}

export interface PokemonFilterCriteria {
  search?: string;
  types?: Set<string>;
  typeMode?: "or" | "and";
  generations?: Set<string>;
  move?: string;
  gameSpeciesSet?: Set<number> | null;
  exclusivesMap?: Map<number, GameVersionMeta>;
  exclusiveFilter?: Set<string>;
}

export function filterPokemonList(
  allPokemon: Pokemon[],
  criteria: PokemonFilterCriteria
): Pokemon[] {
  const {
    search = "",
    types = new Set<string>(),
    typeMode = "or",
    generations = new Set<string>(),
    move = "",
    gameSpeciesSet = null,
    exclusivesMap = new Map<number, GameVersionMeta>(),
    exclusiveFilter = new Set<string>(["all"]),
  } = criteria;

  return allPokemon.filter((p) => {
    if (search && !p.name.includes(search) && !String(p.id).includes(search)) return false;
    if (types.size) {
      if (typeMode === "and") {
        for (const t of types) {
          if (!p.types.includes(t)) return false;
        }
      } else {
        if (!p.types.some((t) => types.has(t))) return false;
      }
    }
    if (generations.size && !generations.has(p.generation)) return false;
    if (move && !p.moves.includes(move)) return false;
    if (gameSpeciesSet && !gameSpeciesSet.has(p.id)) return false;

    if (!exclusiveFilter.has("all") && exclusivesMap.size > 0) {
      const meta = exclusivesMap.get(p.id);
      const category = meta ? meta.id : "both";
      if (!exclusiveFilter.has(category)) return false;
    }

    return true;
  });
}

export function renderEmptyState(opts: EmptyStateOptions): string {
  const icon = opts.icon ?? "search-x";
  const actionHtml =
    opts.actionText && opts.actionAttr
      ? `<button class="btn btn--sm btn--primary empty-state__btn" type="button" ${opts.actionAttr}>
          <i data-lucide="rotate-ccw"></i>
          <span>${opts.actionText}</span>
        </button>`
      : "";

  return `
    <div class="empty-state">
      <div class="empty-state__icon-wrap" aria-hidden="true">
        <div class="empty-state__icon-glow"></div>
        <i data-lucide="${icon}" class="empty-state__icon"></i>
      </div>
      <h3 class="empty-state__title">${opts.title}</h3>
      <p class="empty-state__desc">${opts.description}</p>
      ${actionHtml}
    </div>
  `;
}

export function getGameOptionsHTML(
  generations: GenerationInfo[],
  selectedGame: string,
  locale: Locale = getCurrentLocale(),
  gameToGenMap?: Map<string, GenerationInfo>
): string {
  const t = getTranslations(locale);
  if (gameToGenMap) gameToGenMap.clear();

  let html = `<option value="" ${selectedGame === "" ? "selected" : ""}>${t.pokedex.allGames}</option>`;
  for (const g of generations) {
    const regionName = g.region ? getRegionName(g.region, locale) : "";
    const regionLabel = regionName ? ` (${regionName})` : "";
    const genName = locale === "es" ? g.displayName : g.displayName.replace("Generación", "Generation");
    html += `<optgroup label="${genName}${regionLabel}">`;
    for (const vg of g.versionGroups) {
      if (gameToGenMap) gameToGenMap.set(vg.name, g);
      const title = getGameTitle(vg.name, locale, vg.displayName);
      const isSelected = vg.name === selectedGame ? "selected" : "";
      html += `<option value="${vg.name}" ${isSelected}>${title}</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}
