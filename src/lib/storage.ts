import type { PokemonStats, TeamState } from "./types";

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
const DEFAULT_SLOTS = Array.from({ length: TEAM_FIXED_SIZE }, () => ({ pokemonId: null, moves: [null, null, null, null] }));
const DEFAULT_TEAM: TeamState = { size: TEAM_FIXED_SIZE, slots: DEFAULT_SLOTS };

function normalizeTeam(team: TeamState): TeamState {
  const slots = Array.from({ length: TEAM_FIXED_SIZE }, (_, i) => {
    const raw = team?.slots?.[i];
    if (!raw || raw.pokemonId === null) return { pokemonId: null, moves: [null, null, null, null] };
    const moves = Array.from({ length: 4 }, (_, mIdx) => raw.moves?.[mIdx] ?? null);
    return { pokemonId: raw.pokemonId, moves };
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

export function setTeamSlot(index: number, pokemonId: number | null): TeamState {
  const current = getTeam();
  const slots = [...current.slots];
  if (index >= 0 && index < TEAM_FIXED_SIZE) {
    slots[index] = { pokemonId, moves: [null, null, null, null] };
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

// --- Per-pokemon detail overrides (stats/nature, informational only) ----

export interface PokemonOverrides {
  stats: Partial<PokemonStats>;
  nature: string | null;
}

const DEFAULT_OVERRIDES: PokemonOverrides = { stats: {}, nature: null };

export function getPokemonOverrides(id: number): PokemonOverrides {
  return readJson<PokemonOverrides>(overridesKey(id), DEFAULT_OVERRIDES);
}

export function setPokemonOverrides(id: number, overrides: PokemonOverrides): void {
  writeJson(overridesKey(id), overrides);
}

// --- Modal section order -------------------------------------------------

export const DEFAULT_SECTION_ORDER = ["location", "moves", "evolutions"];

export function getSectionOrder(): string[] {
  const stored = readJson<string[]>(SECTION_ORDER_KEY, DEFAULT_SECTION_ORDER);
  const valid = stored.filter((s) => DEFAULT_SECTION_ORDER.includes(s));
  const missing = DEFAULT_SECTION_ORDER.filter((s) => !valid.includes(s));
  return [...valid, ...missing];
}

export function setSectionOrder(order: string[]): void {
  writeJson(SECTION_ORDER_KEY, order);
}
