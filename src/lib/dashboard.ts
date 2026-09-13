import type { GameDexData, GameDexEntry, GameDexMode, GenerationInfo, TeamState } from './types'

export interface GameVersionProgress {
  id: string
  name: string
  nameEs: string
  color: string
  eligibleCount: number
  caughtCount: number
  percentage: number
}

export interface GameProgressSummary {
  gameKey: string
  mode: GameDexMode
  totalCount: number
  caughtCount: number
  percentage: number
  versions: GameVersionProgress[]
}

export interface DashboardOverview {
  nationalDexTotal: number
  nationalDexCaught: number
  nationalDexPercentage: number
  activeTeamCount: number
  gamesStartedCount: number
  gamesCompletedCount: number
}

/**
 * Calculates a rounded percentage between 0 and 100 safely.
 */
export function calculatePercentage(caught: number, total: number): number {
  if (total <= 0 || caught <= 0) return 0
  const pct = Math.round((caught / total) * 100)
  return Math.min(100, Math.max(0, pct))
}

export interface CalculateGameProgressOptions {
  gameKey: string
  entry: GameDexEntry
  mode?: GameDexMode
  capturedIds: Set<number>
  capturedByGame?: Record<string, Set<number>>
}

/**
 * Computes the capture progress for a given game entry in regional or obtainable mode,
 * including per-version breakdown when version metadata is available.
 */
export function calculateGameProgress({
  gameKey,
  entry,
  mode = 'regional',
  capturedIds,
  capturedByGame = {},
}: CalculateGameProgressOptions): GameProgressSummary {
  const speciesList = mode === 'obtainable' ? entry.obtainable : entry.regional
  const totalCount = speciesList.length

  // Build lookup for version exclusives
  const exclusiveToMap = new Map<number, string>()
  if (entry.exclusives) {
    for (const [verId, ids] of Object.entries(entry.exclusives)) {
      for (const id of ids) {
        exclusiveToMap.set(id, verId)
      }
    }
  }

  // Count overall captures in this game's species list
  let caughtCount = 0
  for (const id of speciesList) {
    if (capturedIds.has(id)) {
      caughtCount++
    }
  }
  const percentage = calculatePercentage(caughtCount, totalCount)

  // Compute version-specific breakdowns
  const versions: GameVersionProgress[] = []
  if (entry.versions && entry.versions.length > 0) {
    for (const ver of entry.versions) {
      const eligibleList = speciesList.filter((id) => {
        const exclusiveVer = exclusiveToMap.get(id)
        return !exclusiveVer || exclusiveVer === ver.id
      })

      const verCapturedSet = capturedByGame[ver.id]
      let verCaught = 0

      for (const id of eligibleList) {
        // Count if captured specifically in this version OR captured in global set
        if (verCapturedSet?.has(id) || capturedIds.has(id)) {
          verCaught++
        }
      }

      versions.push({
        id: ver.id,
        name: ver.name,
        nameEs: ver.nameEs,
        color: ver.color,
        eligibleCount: eligibleList.length,
        caughtCount: verCaught,
        percentage: calculatePercentage(verCaught, eligibleList.length),
      })
    }
  }

  return {
    gameKey,
    mode,
    totalCount,
    caughtCount,
    percentage,
    versions,
  }
}

export interface DashboardOverviewOptions {
  totalSpeciesCount: number
  capturedIds: Set<number>
  team?: TeamState | null
  gamesData: GameDexData
  capturedByGame?: Record<string, Set<number>>
  mode?: GameDexMode
}

/**
 * Calculates top-level metrics for the dashboard:
 * - Global National Dex progress
 * - Active team filled slots
 * - Count of games in progress / completed
 */
export function getDashboardOverview({
  totalSpeciesCount,
  capturedIds,
  team,
  gamesData,
  capturedByGame = {},
  mode = 'regional',
}: DashboardOverviewOptions): DashboardOverview {
  const nationalDexCaught = capturedIds.size
  const nationalDexPercentage = calculatePercentage(nationalDexCaught, totalSpeciesCount)

  let activeTeamCount = 0
  if (team && Array.isArray(team.slots)) {
    activeTeamCount = team.slots.filter((slot) => slot.pokemonId !== null).length
  }

  let gamesStartedCount = 0
  let gamesCompletedCount = 0

  for (const [gameKey, entry] of Object.entries(gamesData)) {
    const summary = calculateGameProgress({
      gameKey,
      entry,
      mode,
      capturedIds,
      capturedByGame,
    })

    if (summary.caughtCount > 0) {
      gamesStartedCount++
    }
    if (summary.totalCount > 0 && summary.caughtCount >= summary.totalCount) {
      gamesCompletedCount++
    }
  }

  return {
    nationalDexTotal: totalSpeciesCount,
    nationalDexCaught,
    nationalDexPercentage,
    activeTeamCount,
    gamesStartedCount,
    gamesCompletedCount,
  }
}

export interface RegionProgress {
  generationName: string
  displayName: string
  region: string
  caughtCount: number
  totalCount: number
  percentage: number
}

/**
 * Computes per-generation capture progress by intersecting captured ids with
 * each generation's speciesIdRange (inclusive).
 */
export function calculateRegionProgress(
  generations: GenerationInfo[],
  capturedIds: Set<number>,
): RegionProgress[] {
  return generations.map((g) => {
    const [start, end] = g.speciesIdRange
    const totalCount = end - start + 1
    let caughtCount = 0
    for (const id of capturedIds) {
      if (id >= start && id <= end) caughtCount++
    }
    return {
      generationName: g.name,
      displayName: g.displayName,
      region: g.region,
      caughtCount,
      totalCount,
      percentage: calculatePercentage(caughtCount, totalCount),
    }
  })
}

export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const

/**
 * Returns the next milestone threshold not yet reached, or null if all are.
 */
export function getNextMilestone(percentage: number): number | null {
  return MILESTONE_THRESHOLDS.find((m) => m > percentage) ?? null
}

/**
 * Returns every milestone threshold reached at or below the given percentage.
 */
export function getReachedMilestones(percentage: number): number[] {
  return MILESTONE_THRESHOLDS.filter((m) => percentage >= m)
}
