import type { PokemonStats, TeamSlotState, TeamState } from "./types";

const CAPTURED_KEY = "poketeam:captured";
const TEAM_KEY = "poketeam:team";
const SECTION_ORDER_KEY = "poketeam:modal-section-order";
const overridesKey = (id: number) => `poketeam:pokemon-overrides:${id}`;

export const CAPTURED_CHANGED_EVENT = "poketeam:captured-changed";
export const TEAM_CHANGED_EVENT = "poketeam:team-changed";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Captured pokemon -------------------------------------------------

export function getCapturedIds(): Set<number> {
  return new Set(readJson<number[]>(CAPTURED_KEY, []));
}

export function isCaptured(id: number): boolean {
  return getCapturedIds().has(id);
}

export function setCaptured(id: number, captured: boolean): Set<number> {
  const ids = getCapturedIds();
  if (captured) ids.add(id);
  else ids.delete(id);

  writeJson(CAPTURED_KEY, [...ids]);
  window.dispatchEvent(new CustomEvent(CAPTURED_CHANGED_EVENT, { detail: { ids, changedId: id, captured } }));
  return ids;
}

// --- Active team --------------------------------------------------------

const TEAM_FIXED_SIZE = 5;
const DEFAULT_SLOTS: TeamSlotState[] = Array.from({ length: TEAM_FIXED_SIZE }, () => ({
  pokemonId: null,
  moves: [null, null, null, null],
  nature: null,
  stats: {},
  usePokedexData: false,
}));
const DEFAULT_TEAM: TeamState = { size: TEAM_FIXED_SIZE, slots: DEFAULT_SLOTS };

function normalizeTeam(team: TeamState): TeamState {
  const slots = Array.from({ length: TEAM_FIXED_SIZE }, (_, i) => {
    const raw = team?.slots?.[i];
    if (!raw || raw.pokemonId === null) {
      return {
        pokemonId: null,
        moves: [null, null, null, null],
        nature: null,
        stats: {},
        usePokedexData: false,
      };
    }
    const moves = Array.from({ length: 4 }, (_, mIdx) => raw.moves?.[mIdx] ?? null);
    const nature = typeof raw.nature === "string" ? raw.nature : null;
    const stats = raw.stats && typeof raw.stats === "object" ? { ...raw.stats } : {};
    const usePokedexData = Boolean(raw.usePokedexData);
    return { pokemonId: raw.pokemonId, moves, nature, stats, usePokedexData };
  });
  return { size: TEAM_FIXED_SIZE, slots };
}

export function getTeam(): TeamState {
  return normalizeTeam(readJson<TeamState>(TEAM_KEY, DEFAULT_TEAM));
}

export function setTeam(team: TeamState): TeamState {
  const normalized = normalizeTeam(team);
  writeJson(TEAM_KEY, normalized);
  window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: { team: normalized } }));
  return normalized;
}

export function setTeamSize(size: number): TeamState {
  return getTeam();
}

export function setTeamSlot(
  index: number,
  pokemonId: number | null,
  initialStats?: Partial<PokemonStats>,
  initialNature?: string | null
): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  if (index >= 0 && index < TEAM_FIXED_SIZE) {
    if (pokemonId === null) {
      slots[index] = {
        pokemonId: null,
        moves: [null, null, null, null],
        nature: null,
        stats: {},
        usePokedexData: false,
      };
    } else {
      slots[index] = {
        pokemonId,
        moves: [null, null, null, null],
        nature: initialNature ?? null,
        stats: initialStats ? { ...initialStats } : {},
        usePokedexData: false,
      };
    }
  }
  return setTeam({ ...current, slots });
}

export function setTeamSlotMove(slotIndex: number, moveIndex: number, moveName: string | null): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  const currentMoves = Array.from({ length: 4 }, (_, i) => targetSlot.moves?.[i] ?? null);
  currentMoves[moveIndex] = moveName;

  slots[slotIndex] = {
    ...targetSlot,
    moves: currentMoves,
  };

  return setTeam({ ...current, slots });
}

export function swapTeamSlotMoves(slotIndex: number, fromMoveIndex: number, toMoveIndex: number): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  const currentMoves = Array.from({ length: 4 }, (_, i) => targetSlot.moves?.[i] ?? null);
  const temp = currentMoves[fromMoveIndex];
  currentMoves[fromMoveIndex] = currentMoves[toMoveIndex];
  currentMoves[toMoveIndex] = temp;

  slots[slotIndex] = {
    ...targetSlot,
    moves: currentMoves,
  };

  return setTeam({ ...current, slots });
}

export function setTeamSlotNature(slotIndex: number, nature: string | null): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  slots[slotIndex] = {
    ...targetSlot,
    nature,
  };
  return setTeam({ ...current, slots });
}

export function setTeamSlotStats(slotIndex: number, stats: Partial<PokemonStats>): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  slots[slotIndex] = {
    ...targetSlot,
    stats: { ...stats },
  };
  return setTeam({ ...current, slots });
}

export function setTeamSlotUsePokedexData(slotIndex: number, usePokedexData: boolean): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  slots[slotIndex] = {
    ...targetSlot,
    usePokedexData,
  };
  return setTeam({ ...current, slots });
}

export function copyPokedexToSlot(slotIndex: number): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  const targetSlot = slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return current;

  const pokedexOverrides = getPokemonOverrides(targetSlot.pokemonId);
  slots[slotIndex] = {
    ...targetSlot,
    nature: pokedexOverrides.nature,
    stats: { ...pokedexOverrides.stats },
    usePokedexData: false,
  };
  return setTeam({ ...current, slots });
}

export function copySlotToPokedex(slotIndex: number): void {
  const current = getTeam();
  const targetSlot = current.slots[slotIndex];
  if (!targetSlot || targetSlot.pokemonId === null) return;

  setPokemonOverrides(targetSlot.pokemonId, {
    nature: targetSlot.nature ?? null,
    stats: targetSlot.stats ? { ...targetSlot.stats } : {},
  });
}

export function getTeamSlotEffectiveOverrides(slot: TeamSlotState, baseStats?: PokemonStats): PokemonOverrides {
  if (slot.usePokedexData && slot.pokemonId !== null) {
    const pOverrides = getPokemonOverrides(slot.pokemonId);
    return {
      nature: pOverrides.nature ?? null,
      stats: { ...(baseStats ?? {}), ...(pOverrides.stats ?? {}) },
    };
  }

  return {
    nature: slot.nature ?? null,
    stats: { ...(baseStats ?? {}), ...(slot.stats ?? {}) },
  };
}

// --- Per-pokemon detail overrides (stats/nature, informational only) ----

export interface PokemonOverrides {
  stats: Partial<PokemonStats>;
  nature: string | null;
}

const DEFAULT_OVERRIDES: PokemonOverrides = { stats: {}, nature: null };

export function getPokemonOverrides(id: number): PokemonOverrides {
  const stored = readJson<PokemonOverrides>(overridesKey(id), DEFAULT_OVERRIDES);
  return {
    stats: stored && typeof stored.stats === "object" && stored.stats !== null ? stored.stats : {},
    nature: stored?.nature ?? null,
  };
}

export function setPokemonOverrides(id: number, overrides: PokemonOverrides): void {
  writeJson(overridesKey(id), overrides);
}

// --- Modal section order -------------------------------------------------

export const DEFAULT_SECTION_ORDER = ["effectiveness", "location", "moves", "evolutions"];

export function getSectionOrder(): string[] {
  const stored = readJson<string[]>(SECTION_ORDER_KEY, DEFAULT_SECTION_ORDER);
  const valid = stored.filter((s) => DEFAULT_SECTION_ORDER.includes(s));
  const missing = DEFAULT_SECTION_ORDER.filter((s) => !valid.includes(s));
  if (missing.length === 0) return valid;
  const result = [...valid];
  for (const item of missing) {
    const defaultIndex = DEFAULT_SECTION_ORDER.indexOf(item);
    if (defaultIndex === 0) {
      result.unshift(item);
    } else {
      result.push(item);
    }
  }
  return result;
}

export function setSectionOrder(order: string[]): void {
  writeJson(SECTION_ORDER_KEY, order);
}

// --- Modal collapsed sections --------------------------------------------

const COLLAPSED_SECTIONS_KEY = "poketeam:modal-collapsed-sections";

export function getCollapsedSections(): Set<string> {
  return new Set(readJson<string[]>(COLLAPSED_SECTIONS_KEY, []));
}

export function isSectionCollapsed(id: string): boolean {
  return getCollapsedSections().has(id);
}

export function setSectionCollapsed(id: string, collapsed: boolean): void {
  const current = getCollapsedSections();
  if (collapsed) {
    current.add(id);
  } else {
    current.delete(id);
  }
  writeJson(COLLAPSED_SECTIONS_KEY, [...current]);
}

// --- Selected Game Filter ----------------------------------------------

const GAME_KEY = "poketeam:selected-game";
export const GAME_CHANGED_EVENT = "poketeam:game-changed";

export function getSelectedGame(): string {
  try {
    return localStorage.getItem(GAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setSelectedGame(game: string): string {
  try {
    localStorage.setItem(GAME_KEY, game);
  } catch {}
  window.dispatchEvent(new CustomEvent(GAME_CHANGED_EVENT, { detail: { game } }));
  return game;
}

import type { GameDexMode } from "./types";

const GAME_DEX_MODE_KEY = "poketeam:game-dex-mode";
export const GAME_DEX_MODE_CHANGED_EVENT = "poketeam:game-dex-mode-changed";

export function getGameDexMode(): GameDexMode {
  try {
    const val = localStorage.getItem(GAME_DEX_MODE_KEY);
    return val === "obtainable" ? "obtainable" : "regional";
  } catch {
    return "regional";
  }
}

export function setGameDexMode(mode: GameDexMode): GameDexMode {
  try {
    localStorage.setItem(GAME_DEX_MODE_KEY, mode);
  } catch {}
  window.dispatchEvent(new CustomEvent(GAME_DEX_MODE_CHANGED_EVENT, { detail: { mode } }));
  return mode;
}

// --- Reset all data ----------------------------------------------------

export const DATA_RESET_EVENT = "poketeam:data-reset";

export function resetAllData(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("poketeam:")) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      localStorage.removeItem(key);
    }
  } catch {}

  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT));
  window.dispatchEvent(new CustomEvent(CAPTURED_CHANGED_EVENT, { detail: { ids: new Set(), reset: true } }));
  window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: { team: DEFAULT_TEAM } }));
  window.dispatchEvent(new CustomEvent(GAME_CHANGED_EVENT, { detail: { game: "" } }));
  window.dispatchEvent(new CustomEvent(GAME_DEX_MODE_CHANGED_EVENT, { detail: { mode: "regional" } }));
}
