import {
  getNuzlockeState,
  setNuzlockeState,
  setCapturedForVersions,
  setCaptureMeta,
} from './storage'
import type {
  GameDexData,
  GameVersionMeta,
  NuzlockeArea,
  NuzlockeDeath,
  NuzlockeOutcome,
  NuzlockePlaythrough,
  NuzlockeRules,
  NuzlockeState,
  NuzlockeStatus,
} from './types'

const PARTY_SIZE = 6

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// --- Playthrough management -------------------------------------------

export function createPlaythrough(game: string): NuzlockePlaythrough {
  const state = getNuzlockeState()
  const id = `run-${Date.now()}`
  const playthrough: NuzlockePlaythrough = {
    id,
    game,
    startedAt: today(),
    areas: {},
    deaths: [],
    party: Array(PARTY_SIZE).fill(null),
    status: 'active',
  }
  setNuzlockeState({
    ...state,
    enabled: true,
    playthroughs: { ...state.playthroughs, [id]: playthrough },
    activeRunId: id,
  })
  return playthrough
}

export function getActivePlaythrough(): NuzlockePlaythrough | null {
  const state = getNuzlockeState()
  return state.activeRunId ? (state.playthroughs[state.activeRunId] ?? null) : null
}

export function setActiveRun(runId: string | null): NuzlockeState {
  const state = getNuzlockeState()
  return setNuzlockeState({ ...state, activeRunId: runId })
}

export function setPlaythroughStatus(runId: string, status: NuzlockeStatus): void {
  const state = getNuzlockeState()
  const playthrough = state.playthroughs[runId]
  if (!playthrough) return
  setNuzlockeState({
    ...state,
    playthroughs: { ...state.playthroughs, [runId]: { ...playthrough, status } },
  })
}

export function deletePlaythrough(runId: string): void {
  const state = getNuzlockeState()
  const playthroughs = { ...state.playthroughs }
  delete playthroughs[runId]
  const activeRunId = state.activeRunId === runId ? null : state.activeRunId
  setNuzlockeState({ ...state, playthroughs, activeRunId })
}

export function setRules(rules: Partial<NuzlockeRules>): void {
  const state = getNuzlockeState()
  setNuzlockeState({ ...state, rules: { ...state.rules, ...rules } })
}

// --- Encounters ----------------------------------------------------------

export function hasAreaBeenUsed(playthrough: NuzlockePlaythrough, areaName: string): boolean {
  return Boolean(playthrough.areas[areaName.trim()])
}

/**
 * Registers a wild encounter in an area. On 'captured', adds the pokemonId
 * to the first free slot of the run's own party (independent of
 * poketeam:team) and syncs the real Pokédex via setCapturedForVersions,
 * since a Nuzlocke capture is still a real capture. On 'fainted', the
 * Pokédex is left untouched — it was never caught.
 */
export function registerEncounter(
  runId: string,
  areaName: string,
  pokemonId: number,
  outcome: NuzlockeOutcome,
): { partyFull: boolean } {
  const state = getNuzlockeState()
  const playthrough = state.playthroughs[runId]
  if (!playthrough) throw new Error(`Unknown nuzlocke run: ${runId}`)

  const trimmedArea = areaName.trim()
  const recordedAt = today()
  const area: NuzlockeArea = { pokemonId, outcome, recordedAt }

  let party = playthrough.party
  let partyFull = false
  if (outcome === 'captured') {
    const freeIndex = party.findIndex((slot) => slot === null)
    if (freeIndex === -1) {
      partyFull = true
    } else {
      party = party.map((slot, i) => (i === freeIndex ? pokemonId : slot))
    }
    setCapturedForVersions(pokemonId, [playthrough.game], true)
    setCaptureMeta(pokemonId, { date: recordedAt, method: 'wild', game: playthrough.game })
  }

  const updated: NuzlockePlaythrough = {
    ...playthrough,
    party,
    areas: { ...playthrough.areas, [trimmedArea]: area },
  }
  setNuzlockeState({ ...state, playthroughs: { ...state.playthroughs, [runId]: updated } })
  return { partyFull }
}

// --- Graveyard -------------------------------------------------------------

/**
 * Registers a death and removes the pokemon from the run's own party.
 * IMPORTANT: this never calls setCapturedForVersions(..., false) — a
 * "dead" Pokémon in the Nuzlocke still counts as captured in the real
 * Pokédex. The dex does not die.
 */
export function registerDeath(runId: string, death: NuzlockeDeath): void {
  const state = getNuzlockeState()
  const playthrough = state.playthroughs[runId]
  if (!playthrough) throw new Error(`Unknown nuzlocke run: ${runId}`)

  const party = playthrough.party.map((slot) => (slot === death.pokemonId ? null : slot))
  const deaths = [...playthrough.deaths, death]
  const updated: NuzlockePlaythrough = { ...playthrough, party, deaths }
  setNuzlockeState({ ...state, playthroughs: { ...state.playthroughs, [runId]: updated } })
}

export function getSortedDeaths(playthrough: NuzlockePlaythrough): NuzlockeDeath[] {
  return [...playthrough.deaths].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getSortedAreaEntries(
  playthrough: NuzlockePlaythrough,
): Array<[string, NuzlockeArea]> {
  return Object.entries(playthrough.areas).sort((a, b) =>
    a[1].recordedAt < b[1].recordedAt ? 1 : -1,
  )
}

// --- Progress --------------------------------------------------------------

export interface NuzlockeProgress {
  areasVisited: number
  captures: number
  deaths: number
  aliveInParty: number
}

export function computeProgress(playthrough: NuzlockePlaythrough): NuzlockeProgress {
  const areaValues = Object.values(playthrough.areas)
  return {
    areasVisited: areaValues.length,
    captures: areaValues.filter((a) => a.outcome === 'captured').length,
    deaths: playthrough.deaths.length,
    aliveInParty: playthrough.party.filter((id) => id !== null).length,
  }
}

// --- Version selection (individual versionId, not version-group) --------

export interface VersionOption {
  id: string
  label: string
}

/**
 * Flattens game-pokedex.json down to individual version ids (scarlet,
 * violet, ...) — do NOT use getGameOptionsHTML from team/helpers.ts, which
 * works at the version-group level ("scarlet-violet") and doesn't match the
 * namespace of poketeam:captured-by-game / CaptureLogEntry.game.
 */
export function getIndividualVersionOptions(
  gameDexData: GameDexData,
  locale: 'en' | 'es',
): VersionOption[] {
  const seen = new Set<string>()
  const options: VersionOption[] = []
  for (const entry of Object.values(gameDexData)) {
    for (const v of entry.versions ?? []) {
      if (seen.has(v.id)) continue
      seen.add(v.id)
      options.push({ id: v.id, label: locale === 'es' ? v.nameEs : v.name })
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
}

export function findVersionMeta(gameDexData: GameDexData, versionId: string): GameVersionMeta | null {
  for (const entry of Object.values(gameDexData)) {
    const match = entry.versions?.find((v) => v.id === versionId)
    if (match) return match
  }
  return null
}

/**
 * Area name suggestions for the encounter autocomplete: union of (a) area
 * names already used in this run, and (b) acquisitions[].location for the
 * chosen wild Pokémon, filtered by the run's version English name
 * (acquisitions[].game is a string like "Scarlet - Violet", not a
 * versionId, hence the substring match). No new dataset — reuses data
 * already fetched to render the Pokémon detail.
 */
export function getAreaSuggestions(
  playthrough: NuzlockePlaythrough,
  acquisitions: { game: string; location: string }[],
  versionMeta: GameVersionMeta | null,
): string[] {
  const used = Object.keys(playthrough.areas)
  const fromAcquisitions = versionMeta
    ? acquisitions
        .filter((row) => row.game.includes(versionMeta.name) && row.location !== '-')
        .map((row) => row.location)
    : []
  return [...new Set([...used, ...fromAcquisitions])]
}
