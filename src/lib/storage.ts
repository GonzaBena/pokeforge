import type { CaptureLogEntry, PokemonStats, TeamSlotState, TeamState } from './types'

export type { CaptureLogEntry } from './types'

const CAPTURED_KEY = 'poketeam:captured'
const TEAM_KEY = 'poketeam:team'
const SECTION_ORDER_KEY = 'poketeam:modal-section-order'
const overridesKey = (id: number) => `poketeam:pokemon-overrides:${id}`
const captureMetaKey = (id: number) => `poketeam:capture-meta:${id}`
const CAPTURE_META_KEY_PREFIX = 'poketeam:capture-meta:'

const CAPTURED_BY_GAME_KEY = 'poketeam:captured-by-game'

export const CAPTURED_CHANGED_EVENT = 'poketeam:captured-changed'
export const CAPTURED_BY_GAME_CHANGED_EVENT = 'poketeam:captured-by-game-changed'
export const TEAM_CHANGED_EVENT = 'poketeam:team-changed'
export const CAPTURE_LOG_CHANGED_EVENT = 'poketeam:capture-log-changed'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// --- Captured pokemon -------------------------------------------------
//
// Two sources feed the aggregate "captured" state:
// - CAPTURED_KEY: the original global set (unattributed captures).
// - CAPTURED_BY_GAME_KEY: per-version-id lists (Dual Version Mode), e.g.
//   { scarlet: [1, 2], violet: [2, 3] }.
// getCapturedIds()/isCaptured() always return the union of both, so the
// ~10 existing call sites keep working unchanged. setCaptured() only ever
// touches the global set — it must read via getRawGlobalCapturedIds(), not
// getCapturedIds(), or it would silently promote per-game ids into the
// global set on every write.

function getRawGlobalCapturedIds(): Set<number> {
  return new Set(readJson<number[]>(CAPTURED_KEY, []))
}

function readCapturedByGameMap(): Record<string, number[]> {
  return readJson<Record<string, number[]>>(CAPTURED_BY_GAME_KEY, {})
}

export function getCapturedIds(): Set<number> {
  const union = getRawGlobalCapturedIds()
  for (const ids of Object.values(readCapturedByGameMap())) {
    for (const id of ids) union.add(id)
  }
  return union
}

export function isCaptured(id: number): boolean {
  return getCapturedIds().has(id)
}

export function setCaptured(id: number, captured: boolean): Set<number> {
  const ids = getRawGlobalCapturedIds()
  if (captured) {
    ids.add(id)
  } else {
    ids.delete(id)
  }
  writeJson(CAPTURED_KEY, [...ids])

  const aggregate = getCapturedIds()
  if (!captured && !aggregate.has(id)) {
    // Only wipe overrides once no source (global or any version) still
    // considers this pokemon captured.
    deletePokemonOverrides(id)
    deleteCaptureMeta(id)
  }
  window.dispatchEvent(
    new CustomEvent(CAPTURED_CHANGED_EVENT, {
      detail: { ids: aggregate, changedId: id, captured },
    }),
  )
  return aggregate
}

// --- Captured pokemon, by game version (Dual Version Mode) -------------

export function getCapturedByGame(versionId: string): Set<number> {
  return new Set(readCapturedByGameMap()[versionId] ?? [])
}

export function getAllCapturedByGame(): Record<string, Set<number>> {
  const map = readCapturedByGameMap()
  const result: Record<string, Set<number>> = {}
  for (const [versionId, ids] of Object.entries(map)) {
    result[versionId] = new Set(ids)
  }
  return result
}

export function setCapturedForVersions(
  id: number,
  versionIds: string[],
  captured: boolean,
): void {
  const map = readCapturedByGameMap()
  for (const versionId of versionIds) {
    const set = new Set(map[versionId] ?? [])
    if (captured) {
      set.add(id)
    } else {
      set.delete(id)
    }
    map[versionId] = [...set]
  }
  writeJson(CAPTURED_BY_GAME_KEY, map)

  const aggregate = getCapturedIds()
  if (!captured && !aggregate.has(id)) {
    deletePokemonOverrides(id)
    deleteCaptureMeta(id)
  }
  window.dispatchEvent(
    new CustomEvent(CAPTURED_BY_GAME_CHANGED_EVENT, {
      detail: { versionIds, changedId: id, captured },
    }),
  )
  // Also notify CAPTURED_CHANGED_EVENT listeners (cloudSync auto-sync, card
  // sync in pokedex-page.ts) so they don't need to know Dual Version Mode exists.
  window.dispatchEvent(
    new CustomEvent(CAPTURED_CHANGED_EVENT, {
      detail: { ids: aggregate, changedId: id, captured: aggregate.has(id) },
    }),
  )
}

export function setCapturedByGame(versionId: string, id: number, captured: boolean): void {
  setCapturedForVersions(id, [versionId], captured)
}

// --- Active team --------------------------------------------------------

const TEAM_FIXED_SIZE = 6
const DEFAULT_SLOTS: TeamSlotState[] = Array.from({ length: TEAM_FIXED_SIZE }, () => ({
  pokemonId: null,
  moves: [null, null, null, null],
  nature: null,
  ability: null,
  item: null,
  stats: {},
  usePokedexData: false,
}))
const DEFAULT_TEAM: TeamState = { size: TEAM_FIXED_SIZE, slots: DEFAULT_SLOTS }

function normalizeTeam(team: TeamState): TeamState {
  const slots = Array.from({ length: TEAM_FIXED_SIZE }, (_, i) => {
    const raw = team?.slots?.[i]
    if (!raw || raw.pokemonId === null) {
      return {
        pokemonId: null,
        moves: [null, null, null, null],
        nature: null,
        ability: null,
        item: null,
        stats: {},
        usePokedexData: false,
      }
    }
    const moves = Array.from({ length: 4 }, (_, mIdx) => raw.moves?.[mIdx] ?? null)
    const nature = typeof raw.nature === 'string' ? raw.nature : null
    const ability = typeof raw.ability === 'string' ? raw.ability : null
    const item = typeof raw.item === 'string' ? raw.item : null
    const stats = raw.stats && typeof raw.stats === 'object' ? { ...raw.stats } : {}
    const usePokedexData = Boolean(raw.usePokedexData)
    return { pokemonId: raw.pokemonId, moves, nature, ability, item, stats, usePokedexData }
  })
  return { size: TEAM_FIXED_SIZE, slots }
}

export function getTeam(): TeamState {
  return normalizeTeam(readJson<TeamState>(TEAM_KEY, DEFAULT_TEAM))
}

export function setTeam(team: TeamState): TeamState {
  const normalized = normalizeTeam(team)
  writeJson(TEAM_KEY, normalized)
  window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: { team: normalized } }))
  return normalized
}

export function setTeamSlot(
  index: number,
  pokemonId: number | null,
  initialStats?: Partial<PokemonStats>,
  initialNature?: string | null,
  initialAbility?: string | null,
  initialItem?: string | null,
): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  if (index >= 0 && index < TEAM_FIXED_SIZE) {
    if (pokemonId === null) {
      slots[index] = {
        pokemonId: null,
        moves: [null, null, null, null],
        nature: null,
        ability: null,
        item: null,
        stats: {},
        usePokedexData: false,
      }
    } else {
      slots[index] = {
        pokemonId,
        moves: [null, null, null, null],
        nature: initialNature ?? null,
        ability: initialAbility ?? null,
        item: initialItem ?? null,
        stats: initialStats ? { ...initialStats } : {},
        usePokedexData: false,
      }
    }
  }
  return setTeam({ ...current, slots })
}

export function setTeamSlotMove(
  slotIndex: number,
  moveIndex: number,
  moveName: string | null,
): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  const currentMoves = Array.from({ length: 4 }, (_, i) => targetSlot.moves?.[i] ?? null)
  currentMoves[moveIndex] = moveName

  slots[slotIndex] = {
    ...targetSlot,
    moves: currentMoves,
  }

  return setTeam({ ...current, slots })
}

export function swapTeamSlotMoves(
  slotIndex: number,
  fromMoveIndex: number,
  toMoveIndex: number,
): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  const currentMoves = Array.from({ length: 4 }, (_, i) => targetSlot.moves?.[i] ?? null)
  const temp = currentMoves[fromMoveIndex]
  currentMoves[fromMoveIndex] = currentMoves[toMoveIndex]
  currentMoves[toMoveIndex] = temp

  slots[slotIndex] = {
    ...targetSlot,
    moves: currentMoves,
  }

  return setTeam({ ...current, slots })
}

export function swapTeamSlots(fromIndex: number, toIndex: number): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  if (
    fromIndex < 0 ||
    fromIndex >= slots.length ||
    toIndex < 0 ||
    toIndex >= slots.length ||
    fromIndex === toIndex
  ) {
    return current
  }

  const temp = slots[fromIndex]
  slots[fromIndex] = slots[toIndex]
  slots[toIndex] = temp

  return setTeam({ ...current, slots })
}

export function setTeamSlotNature(slotIndex: number, nature: string | null): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  slots[slotIndex] = {
    ...targetSlot,
    nature,
  }
  return setTeam({ ...current, slots })
}

export function setTeamSlotAbility(slotIndex: number, ability: string | null): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  slots[slotIndex] = {
    ...targetSlot,
    ability,
  }
  return setTeam({ ...current, slots })
}

export function setTeamSlotItem(slotIndex: number, item: string | null): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  slots[slotIndex] = {
    ...targetSlot,
    item,
  }
  return setTeam({ ...current, slots })
}

export function setTeamSlotStats(slotIndex: number, stats: Partial<PokemonStats>): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  slots[slotIndex] = {
    ...targetSlot,
    stats: { ...stats },
  }
  return setTeam({ ...current, slots })
}

export function setTeamSlotUsePokedexData(slotIndex: number, usePokedexData: boolean): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  slots[slotIndex] = {
    ...targetSlot,
    usePokedexData,
  }
  return setTeam({ ...current, slots })
}

export function copyPokedexToSlot(slotIndex: number): TeamState {
  const current = getTeam()
  const slots = [...current.slots]
  const targetSlot = slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return current

  const pokedexOverrides = getPokemonOverrides(targetSlot.pokemonId)
  slots[slotIndex] = {
    ...targetSlot,
    nature: pokedexOverrides.nature,
    ability: pokedexOverrides.ability ?? null,
    item: pokedexOverrides.item ?? null,
    stats: { ...pokedexOverrides.stats },
    usePokedexData: false,
  }
  return setTeam({ ...current, slots })
}

export function copySlotToPokedex(slotIndex: number): void {
  const current = getTeam()
  const targetSlot = current.slots[slotIndex]
  if (!targetSlot || targetSlot.pokemonId === null) return

  setPokemonOverrides(targetSlot.pokemonId, {
    nature: targetSlot.nature ?? null,
    ability: targetSlot.ability ?? null,
    item: targetSlot.item ?? null,
    stats: targetSlot.stats ? { ...targetSlot.stats } : {},
  })
}

export function getTeamSlotEffectiveOverrides(
  slot: TeamSlotState,
  baseStats?: PokemonStats,
): PokemonOverrides {
  if (slot.usePokedexData && slot.pokemonId !== null) {
    const pOverrides = getPokemonOverrides(slot.pokemonId)
    return {
      nature: pOverrides.nature ?? null,
      ability: pOverrides.ability ?? null,
      item: pOverrides.item ?? null,
      stats: { ...(baseStats ?? {}), ...(pOverrides.stats ?? {}) },
    }
  }

  return {
    nature: slot.nature ?? null,
    ability: slot.ability ?? null,
    item: slot.item ?? null,
    stats: { ...(baseStats ?? {}), ...(slot.stats ?? {}) },
  }
}

// --- Per-pokemon detail overrides (stats/nature/ability/item, informational only) ----

export interface PokemonOverrides {
  stats: Partial<PokemonStats>
  nature: string | null
  ability?: string | null
  item?: string | null
}

const DEFAULT_OVERRIDES: PokemonOverrides = { stats: {}, nature: null, ability: null, item: null }

export function getPokemonOverrides(id: number): PokemonOverrides {
  const stored = readJson<PokemonOverrides>(overridesKey(id), DEFAULT_OVERRIDES)
  return {
    stats: stored && typeof stored.stats === 'object' && stored.stats !== null ? stored.stats : {},
    nature: stored?.nature ?? null,
    ability: stored?.ability ?? null,
    item: stored?.item ?? null,
  }
}

export function setPokemonOverrides(id: number, overrides: PokemonOverrides): void {
  writeJson(overridesKey(id), overrides)
}

export function deletePokemonOverrides(id: number): void {
  localStorage.removeItem(overridesKey(id))
}

// --- Capture log / passport (fecha, método, juego) — optional, additive layer
// on top of the capture model above. Keys are per-id, mirroring the overrides
// trio above, so cleanup is O(1) and rides the same 'poketeam:' prefix sweep
// in resetAllData().

export function getCaptureMeta(id: number): CaptureLogEntry | null {
  const stored = readJson<CaptureLogEntry | null>(captureMetaKey(id), null)
  return stored ?? null
}

export function setCaptureMeta(id: number, meta: CaptureLogEntry): void {
  writeJson(captureMetaKey(id), meta)
  window.dispatchEvent(new CustomEvent(CAPTURE_LOG_CHANGED_EVENT, { detail: { id, meta } }))
}

export function deleteCaptureMeta(id: number): void {
  if (getCaptureMeta(id) === null) return
  localStorage.removeItem(captureMetaKey(id))
  window.dispatchEvent(
    new CustomEvent(CAPTURE_LOG_CHANGED_EVENT, { detail: { id, deleted: true } }),
  )
}

export function getCaptureLog(): Record<number, CaptureLogEntry> {
  const log: Record<number, CaptureLogEntry> = {}
  if (typeof localStorage === 'undefined') return log
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CAPTURE_META_KEY_PREFIX)) {
        const id = parseInt(key.replace(CAPTURE_META_KEY_PREFIX, ''), 10)
        if (!isNaN(id)) {
          const meta = getCaptureMeta(id)
          if (meta) log[id] = meta
        }
      }
    }
  } catch {
    // ignore storage access failures
  }
  return log
}

// --- Modal section order -------------------------------------------------

export const DEFAULT_SECTION_ORDER = [
  'effectiveness',
  'abilities',
  'location',
  'moves',
  'evolutions',
  'passport',
]

export function getSectionOrder(): string[] {
  const stored = readJson<string[]>(SECTION_ORDER_KEY, DEFAULT_SECTION_ORDER)
  const valid = stored.filter((s) => DEFAULT_SECTION_ORDER.includes(s))
  const missing = DEFAULT_SECTION_ORDER.filter((s) => !valid.includes(s))
  if (missing.length === 0) return valid
  const result = [...valid]
  for (const item of missing) {
    const defaultIndex = DEFAULT_SECTION_ORDER.indexOf(item)
    if (defaultIndex === 0) {
      result.unshift(item)
    } else {
      result.push(item)
    }
  }
  return result
}

export function setSectionOrder(order: string[]): void {
  writeJson(SECTION_ORDER_KEY, order)
}

// --- Modal collapsed sections --------------------------------------------

const COLLAPSED_SECTIONS_KEY = 'poketeam:modal-collapsed-sections'

export function getCollapsedSections(): Set<string> {
  return new Set(readJson<string[]>(COLLAPSED_SECTIONS_KEY, []))
}

export function isSectionCollapsed(id: string): boolean {
  return getCollapsedSections().has(id)
}

export function setSectionCollapsed(id: string, collapsed: boolean): void {
  const current = getCollapsedSections()
  if (collapsed) {
    current.add(id)
  } else {
    current.delete(id)
  }
  writeJson(COLLAPSED_SECTIONS_KEY, [...current])
}

// --- Selected Game Filter ----------------------------------------------

const GAME_KEY = 'poketeam:selected-game'
export const GAME_CHANGED_EVENT = 'poketeam:game-changed'

export function getSelectedGame(): string {
  try {
    return localStorage.getItem(GAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setSelectedGame(game: string): string {
  try {
    localStorage.setItem(GAME_KEY, game)
  } catch {
    // ignore write failures (e.g. private browsing, storage quota)
  }
  window.dispatchEvent(new CustomEvent(GAME_CHANGED_EVENT, { detail: { game } }))
  return game
}

import type { GameDexMode } from './types'

const GAME_DEX_MODE_KEY = 'poketeam:game-dex-mode'
export const GAME_DEX_MODE_CHANGED_EVENT = 'poketeam:game-dex-mode-changed'

export function getGameDexMode(): GameDexMode {
  try {
    const val = localStorage.getItem(GAME_DEX_MODE_KEY)
    return val === 'obtainable' ? 'obtainable' : 'regional'
  } catch {
    return 'regional'
  }
}

export function setGameDexMode(mode: GameDexMode): GameDexMode {
  try {
    localStorage.setItem(GAME_DEX_MODE_KEY, mode)
  } catch {
    // ignore write failures (e.g. private browsing, storage quota)
  }
  window.dispatchEvent(new CustomEvent(GAME_DEX_MODE_CHANGED_EVENT, { detail: { mode } }))
  return mode
}

// --- Reset all data ----------------------------------------------------

export const DATA_RESET_EVENT = 'poketeam:data-reset'

export function resetAllData(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('poketeam:')) {
        toRemove.push(key)
      }
    }
    for (const key of toRemove) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore storage access failures
  }

  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT))
  window.dispatchEvent(
    new CustomEvent(CAPTURED_CHANGED_EVENT, { detail: { ids: new Set(), reset: true } }),
  )
  window.dispatchEvent(
    new CustomEvent(CAPTURED_BY_GAME_CHANGED_EVENT, { detail: { reset: true } }),
  )
  window.dispatchEvent(new CustomEvent(TEAM_CHANGED_EVENT, { detail: { team: DEFAULT_TEAM } }))
  window.dispatchEvent(new CustomEvent(GAME_CHANGED_EVENT, { detail: { game: '' } }))
  window.dispatchEvent(
    new CustomEvent(GAME_DEX_MODE_CHANGED_EVENT, { detail: { mode: 'regional' } }),
  )
  window.dispatchEvent(new CustomEvent(CAPTURE_LOG_CHANGED_EVENT, { detail: { reset: true } }))
}
