import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculatePercentage,
  calculateGameProgress,
  getDashboardOverview,
  calculateRegionProgress,
  getNextMilestone,
  getReachedMilestones,
  MILESTONE_THRESHOLDS,
} from '../src/lib/dashboard'
import type { GameDexData, GameDexEntry, GenerationInfo, TeamState } from '../src/lib/types'

test('dashboard - calculatePercentage computes rounded integers safely', () => {
  assert.equal(calculatePercentage(0, 0), 0)
  assert.equal(calculatePercentage(0, 100), 0)
  assert.equal(calculatePercentage(50, 100), 50)
  assert.equal(calculatePercentage(1, 3), 33)
  assert.equal(calculatePercentage(2, 3), 67)
  assert.equal(calculatePercentage(151, 151), 100)
  assert.equal(calculatePercentage(100, 50), 100) // Capped at 100%
  assert.equal(calculatePercentage(-5, 50), 0) // Capped at 0%
})

test('dashboard - calculateGameProgress computes regional and obtainable progress with version breakdown', () => {
  const entry: GameDexEntry = {
    regional: [1, 2, 3, 4],
    obtainable: [1, 2, 3, 4, 5, 6],
    versions: [
      { id: 'scarlet', name: 'Scarlet', nameEs: 'Escarlata', color: '#eb2f06' },
      { id: 'violet', name: 'Violet', nameEs: 'Púrpura', color: '#8854d0' },
    ],
    exclusives: {
      scarlet: [3],
      violet: [4],
    },
  }

  // User captured 1 and 2 globally, and captured 3 specifically in scarlet
  const capturedIds = new Set([1, 2, 3])
  const capturedByGame = {
    scarlet: new Set([3]),
    violet: new Set<number>(),
  }

  // Test regional mode
  const regionalProgress = calculateGameProgress({
    gameKey: 'scarlet-violet',
    entry,
    mode: 'regional',
    capturedIds,
    capturedByGame,
  })

  assert.equal(regionalProgress.gameKey, 'scarlet-violet')
  assert.equal(regionalProgress.totalCount, 4)
  assert.equal(regionalProgress.caughtCount, 3) // 1, 2, 3 in regional list
  assert.equal(regionalProgress.percentage, 75)
  assert.equal(regionalProgress.versions.length, 2)

  // Scarlet version progress:
  // eligible: 1, 2, 3 (4 is violet exclusive, so eligible is 3 pokemon)
  // caught in scarlet (global or per-game in eligible list): 1, 2, 3
  const scarletVer = regionalProgress.versions.find((v) => v.id === 'scarlet')!
  assert.ok(scarletVer)
  assert.equal(scarletVer.eligibleCount, 3)
  assert.equal(scarletVer.caughtCount, 3)
  assert.equal(scarletVer.percentage, 100)

  // Violet version progress:
  // eligible: 1, 2, 4 (3 is scarlet exclusive)
  // caught in violet list (1 and 2 from capturedIds): 2
  const violetVer = regionalProgress.versions.find((v) => v.id === 'violet')!
  assert.ok(violetVer)
  assert.equal(violetVer.eligibleCount, 3)
  assert.equal(violetVer.caughtCount, 2)
  assert.equal(violetVer.percentage, 67)

  // Test obtainable mode
  const obtainableProgress = calculateGameProgress({
    gameKey: 'scarlet-violet',
    entry,
    mode: 'obtainable',
    capturedIds,
    capturedByGame,
  })

  assert.equal(obtainableProgress.totalCount, 6)
  assert.equal(obtainableProgress.caughtCount, 3)
  assert.equal(obtainableProgress.percentage, 50)
})

test('dashboard - calculateGameProgress handles single version game without exclusives', () => {
  const entry: GameDexEntry = {
    regional: [1, 2, 3],
    obtainable: [1, 2, 3],
    versions: [{ id: 'yellow', name: 'Yellow', nameEs: 'Amarillo', color: '#f1c40f' }],
  }

  const capturedIds = new Set([1])
  const capturedByGame = {}

  const progress = calculateGameProgress({
    gameKey: 'yellow',
    entry,
    mode: 'regional',
    capturedIds,
    capturedByGame,
  })

  assert.equal(progress.totalCount, 3)
  assert.equal(progress.caughtCount, 1)
  assert.equal(progress.percentage, 33)
  assert.equal(progress.versions.length, 1)
  assert.equal(progress.versions[0].eligibleCount, 3)
  assert.equal(progress.versions[0].caughtCount, 1)
  assert.equal(progress.versions[0].percentage, 33)
})

test('dashboard - getDashboardOverview aggregates national dex, active team count, and games status', () => {
  const gamesData: GameDexData = {
    'red-blue': {
      regional: [1, 2, 3, 4],
      obtainable: [1, 2, 3, 4],
    },
    'scarlet-violet': {
      regional: [1, 2],
      obtainable: [1, 2],
    },
    emerald: {
      regional: [5, 6],
      obtainable: [5, 6],
    },
  }

  const capturedIds = new Set([1, 2])
  const capturedByGame = {}
  const mockTeam: TeamState = {
    size: 6,
    slots: [
      { pokemonId: 25, moves: [null, null, null, null], stats: {} },
      { pokemonId: 6, moves: [null, null, null, null], stats: {} },
      { pokemonId: null, moves: [null, null, null, null], stats: {} },
      { pokemonId: null, moves: [null, null, null, null], stats: {} },
      { pokemonId: null, moves: [null, null, null, null], stats: {} },
      { pokemonId: null, moves: [null, null, null, null], stats: {} },
    ],
  }

  const overview = getDashboardOverview({
    totalSpeciesCount: 1025,
    capturedIds,
    team: mockTeam,
    gamesData,
    capturedByGame,
  })

  assert.equal(overview.nationalDexTotal, 1025)
  assert.equal(overview.nationalDexCaught, 2)
  assert.equal(overview.nationalDexPercentage, 0) // 2 / 1025 rounds to 0
  assert.equal(overview.activeTeamCount, 2) // 2 slots with pokemon
  assert.equal(overview.gamesStartedCount, 2) // red-blue and scarlet-violet have at least 1 capture
  assert.equal(overview.gamesCompletedCount, 1) // scarlet-violet has 2/2 = 100%
})

test('dashboard - calculateRegionProgress intersects captured ids with each generation range', () => {
  const generations: GenerationInfo[] = [
    {
      id: 1,
      name: 'generation-i',
      displayName: 'Generación I',
      region: 'kanto',
      speciesIdRange: [1, 10],
      versionGroups: [],
    },
    {
      id: 2,
      name: 'generation-ii',
      displayName: 'Generación II',
      region: 'johto',
      speciesIdRange: [11, 20],
      versionGroups: [],
    },
  ]

  const capturedIds = new Set([1, 5, 10, 11, 999])
  const progress = calculateRegionProgress(generations, capturedIds)

  assert.equal(progress.length, 2)
  assert.equal(progress[0].generationName, 'generation-i')
  assert.equal(progress[0].region, 'kanto')
  assert.equal(progress[0].totalCount, 10)
  assert.equal(progress[0].caughtCount, 3) // 1, 5, 10
  assert.equal(progress[0].percentage, 30)

  assert.equal(progress[1].generationName, 'generation-ii')
  assert.equal(progress[1].totalCount, 10)
  assert.equal(progress[1].caughtCount, 1) // 11
  assert.equal(progress[1].percentage, 10)
})

test('dashboard - calculateRegionProgress handles empty capture sets and boundaries', () => {
  const generations: GenerationInfo[] = [
    {
      id: 1,
      name: 'generation-i',
      displayName: 'Generación I',
      region: 'kanto',
      speciesIdRange: [1, 151],
      versionGroups: [],
    },
  ]

  const empty = calculateRegionProgress(generations, new Set())
  assert.equal(empty[0].caughtCount, 0)
  assert.equal(empty[0].percentage, 0)

  const full = calculateRegionProgress(
    generations,
    new Set(Array.from({ length: 151 }, (_, i) => i + 1)),
  )
  assert.equal(full[0].caughtCount, 151)
  assert.equal(full[0].percentage, 100)
})

test('dashboard - MILESTONE_THRESHOLDS is 25/50/75/100', () => {
  assert.deepEqual(MILESTONE_THRESHOLDS, [25, 50, 75, 100])
})

test('dashboard - getNextMilestone returns the next unreached threshold', () => {
  assert.equal(getNextMilestone(0), 25)
  assert.equal(getNextMilestone(24), 25)
  assert.equal(getNextMilestone(25), 50)
  assert.equal(getNextMilestone(99), 100)
  assert.equal(getNextMilestone(100), null)
})

test('dashboard - getReachedMilestones returns every threshold at or below the percentage', () => {
  assert.deepEqual(getReachedMilestones(0), [])
  assert.deepEqual(getReachedMilestones(24), [])
  assert.deepEqual(getReachedMilestones(25), [25])
  assert.deepEqual(getReachedMilestones(60), [25, 50])
  assert.deepEqual(getReachedMilestones(100), [25, 50, 75, 100])
})

test('dashboard - translations contain all necessary settings and dashboard keys', async () => {
  const { getTranslations } = await import('../src/lib/i18n/translations')
  const en = getTranslations('en')
  const es = getTranslations('es')

  assert.ok(en.dashboard.settingsTitle)
  assert.ok(es.dashboard.settingsTitle)
  assert.ok(en.dashboard.backToDashboard)
  assert.ok(es.dashboard.backToDashboard)
  assert.ok(en.dashboard.audioTitle)
  assert.ok(es.dashboard.audioTitle)
  assert.ok(en.dashboard.cloudSyncTitle)
  assert.ok(es.dashboard.cloudSyncTitle)
  assert.ok(en.dashboard.dataManagementTitle)
  assert.ok(es.dashboard.dataManagementTitle)
  assert.ok(en.dashboard.soundToggle)
  assert.ok(es.dashboard.soundToggle)
  assert.ok(en.dashboard.resetData)
  assert.ok(es.dashboard.resetData)
})

