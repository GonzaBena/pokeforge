import type { GameDexData, GameVersionMeta } from './types'
import {
  CAPTURED_CHANGED_EVENT,
  CAPTURED_BY_GAME_CHANGED_EVENT,
  getCapturedIds,
} from './storage'
import gameDexDataRaw from '../../public/data/pokedex/game-pokedex.json'

export const VERSION_ASSIGNMENT_CHANGED_EVENT = 'poketeam:version-assignment-changed'

const CAPTURED_KEY = 'poketeam:captured'
const CAPTURED_BY_GAME_KEY = 'poketeam:captured-by-game'
const SELECTED_GAME_KEY = 'poketeam:selected-game'

const gameDexData = gameDexDataRaw as GameDexData

export interface UnassignedCapture {
  id: number
  gameKey: string
  gameTitle: string
  versionA: GameVersionMeta
  versionB: GameVersionMeta
  exclusiveTo?: 'a' | 'b'
  recommended: 'a' | 'b' | 'both'
}

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function getRawGlobalCapturedIds(): Set<number> {
  return new Set(readJson<number[]>(CAPTURED_KEY, []))
}

function readCapturedByGameMap(): Record<string, number[]> {
  return readJson<Record<string, number[]>>(CAPTURED_BY_GAME_KEY, {})
}

function getSelectedGame(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(SELECTED_GAME_KEY) || ''
}

// Ordered list of dual-version games to search when assigning a pokemon
const DUAL_GAMES_ORDER: string[] = [
  'scarlet-violet',
  'sword-shield',
  'ultra-sun-ultra-moon',
  'sun-moon',
  'omega-ruby-alpha-sapphire',
  'x-y',
  'black-2-white-2',
  'black-white',
  'heartgold-soulsilver',
  'diamond-pearl',
  'firered-leafgreen',
  'ruby-sapphire',
  'gold-silver',
  'red-blue',
  'lets-go-pikachu-lets-go-eevee',
]

function getDualGameForPokemon(id: number, preferredGame?: string): string | null {
  if (preferredGame && gameDexData[preferredGame]) {
    const entry = gameDexData[preferredGame]
    if (entry.versions && entry.versions.length === 2 && entry.exclusives) {
      const inRegional = entry.regional?.includes(id) ?? false
      const inObtainable = entry.obtainable?.includes(id) ?? false
      if (inRegional || inObtainable) return preferredGame
    }
  }

  for (const key of DUAL_GAMES_ORDER) {
    const entry = gameDexData[key]
    if (!entry || !entry.versions || entry.versions.length !== 2 || !entry.exclusives) {
      continue
    }
    const inRegional = entry.regional?.includes(id) ?? false
    const inObtainable = entry.obtainable?.includes(id) ?? false
    if (inRegional || inObtainable) return key
  }

  return null
}

export function getUnassignedCaptures(): UnassignedCapture[] {
  const globalIds = getRawGlobalCapturedIds()
  if (globalIds.size === 0) return []

  const gameMap = readCapturedByGameMap()
  const preferredGame = getSelectedGame()
  const results: UnassignedCapture[] = []

  for (const id of globalIds) {
    const gameKey = getDualGameForPokemon(id, preferredGame)
    if (!gameKey) continue

    const entry = gameDexData[gameKey]
    if (!entry || !entry.versions || entry.versions.length !== 2) continue

    const [vA, vB] = entry.versions
    const idsA = new Set(gameMap[vA.id] ?? [])
    const idsB = new Set(gameMap[vB.id] ?? [])

    // If the pokemon is already recorded in at least one version of this game, it's not unassigned
    if (idsA.has(id) || idsB.has(id)) continue

    const isExclusiveA = entry.exclusives?.[vA.id]?.includes(id) ?? false
    const isExclusiveB = entry.exclusives?.[vB.id]?.includes(id) ?? false

    let exclusiveTo: 'a' | 'b' | undefined
    let recommended: 'a' | 'b' | 'both' = 'both'

    if (isExclusiveA) {
      exclusiveTo = 'a'
      recommended = 'a'
    } else if (isExclusiveB) {
      exclusiveTo = 'b'
      recommended = 'b'
    }

    results.push({
      id,
      gameKey,
      gameTitle: gameKey,
      versionA: vA,
      versionB: vB,
      exclusiveTo,
      recommended,
    })
  }

  return results
}

export function getUnassignedCount(): number {
  return getUnassignedCaptures().length
}

export function assignCapture(id: number, gameKey: string, choice: 'a' | 'b' | 'both'): void {
  const entry = gameDexData[gameKey]
  if (!entry?.versions || entry.versions.length !== 2) return

  const [vA, vB] = entry.versions
  const map = readCapturedByGameMap()

  const setA = new Set(map[vA.id] ?? [])
  const setB = new Set(map[vB.id] ?? [])

  if (choice === 'a') {
    setA.add(id)
  } else if (choice === 'b') {
    setB.add(id)
  } else if (choice === 'both') {
    setA.add(id)
    setB.add(id)
  }

  map[vA.id] = [...setA]
  map[vB.id] = [...setB]
  writeJson(CAPTURED_BY_GAME_KEY, map)

  notifyAssignmentChanged(id, [vA.id, vB.id])
}

export function autoAssignAll(captures?: UnassignedCapture[]): void {
  const list = captures ?? getUnassignedCaptures()
  if (list.length === 0) return

  const map = readCapturedByGameMap()
  const touchedVersionIds = new Set<string>()

  for (const item of list) {
    const entry = gameDexData[item.gameKey]
    if (!entry?.versions || entry.versions.length !== 2) continue
    const [vA, vB] = entry.versions

    const setA = new Set(map[vA.id] ?? [])
    const setB = new Set(map[vB.id] ?? [])

    if (item.recommended === 'a') {
      setA.add(item.id)
      touchedVersionIds.add(vA.id)
    } else if (item.recommended === 'b') {
      setB.add(item.id)
      touchedVersionIds.add(vB.id)
    } else {
      setA.add(item.id)
      setB.add(item.id)
      touchedVersionIds.add(vA.id)
      touchedVersionIds.add(vB.id)
    }

    map[vA.id] = [...setA]
    map[vB.id] = [...setB]
  }

  writeJson(CAPTURED_BY_GAME_KEY, map)
  notifyAssignmentChanged(undefined, [...touchedVersionIds])
}

export function assignAllToBoth(captures?: UnassignedCapture[]): void {
  const list = captures ?? getUnassignedCaptures()
  if (list.length === 0) return

  const map = readCapturedByGameMap()
  const touchedVersionIds = new Set<string>()

  for (const item of list) {
    const entry = gameDexData[item.gameKey]
    if (!entry?.versions || entry.versions.length !== 2) continue
    const [vA, vB] = entry.versions

    const setA = new Set(map[vA.id] ?? [])
    const setB = new Set(map[vB.id] ?? [])

    setA.add(item.id)
    setB.add(item.id)
    touchedVersionIds.add(vA.id)
    touchedVersionIds.add(vB.id)

    map[vA.id] = [...setA]
    map[vB.id] = [...setB]
  }

  writeJson(CAPTURED_BY_GAME_KEY, map)
  notifyAssignmentChanged(undefined, [...touchedVersionIds])
}

function notifyAssignmentChanged(changedId?: number, versionIds?: string[]): void {
  if (typeof window === 'undefined') return

  const count = getUnassignedCount()
  window.dispatchEvent(
    new CustomEvent(VERSION_ASSIGNMENT_CHANGED_EVENT, {
      detail: { changedId, versionIds, count },
    }),
  )

  if (versionIds && versionIds.length > 0) {
    window.dispatchEvent(
      new CustomEvent(CAPTURED_BY_GAME_CHANGED_EVENT, {
        detail: { versionIds, changedId, captured: true },
      }),
    )
  }

  window.dispatchEvent(
    new CustomEvent(CAPTURED_CHANGED_EVENT, {
      detail: { ids: getCapturedIds(), changedId, captured: true },
    }),
  )
}
