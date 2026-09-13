import {
  getManifest,
  getChunk,
  getAllPokemon,
  getGenerations,
  getTypeChart,
  getGameDexData,
  getMoveDetailsMap,
} from '../lib/pokedexData'
import {
  getCapturedIds,
  getCapturedByGame,
  setCaptured,
  CAPTURED_CHANGED_EVENT,
  CAPTURED_BY_GAME_CHANGED_EVENT,
  getSelectedGame,
  setSelectedGame,
  GAME_CHANGED_EVENT,
  getGameDexMode,
  setGameDexMode,
  GAME_DEX_MODE_CHANGED_EVENT,
  DATA_RESET_EVENT,
} from '../lib/storage'
import { staggerCardsIn, cardHoverTilt, animateCaptureReveal } from '../lib/animations'
import {
  calculatePercentage,
  calculateRegionProgress,
  getReachedMilestones,
  MILESTONE_THRESHOLDS,
} from '../lib/dashboard'
import {
  getCurrentLocale,
  getTranslations,
  getTypeName,
  getGameTitle,
  getRegionName,
  getMoveName,
} from '../lib/i18n/translations'
import { toast } from '../lib/toast'
import { refreshIcons } from '../lib/icons'
import { typeColor } from '../lib/typeColors'
import { openPokemonModal } from '../lib/pokemonModal'
import type {
  GameDexData,
  GameDexMode,
  GameVersionMeta,
  GenerationInfo,
  MoveData,
  Pokemon,
} from '../lib/types'
import { matchesMoveFilter, parseMoveQuery, type MoveFilterItem } from '../lib/moveFilters'

const PAGE_SIZE = 24

const grid = document.querySelector<HTMLElement>('[data-pokedex-grid]')!
const emptyMsg = document.querySelector<HTMLElement>('[data-pokedex-empty]')!
const loadMoreWrap = document.querySelector<HTMLElement>('[data-load-more-wrap]')!
const loadMoreBtn = document.querySelector<HTMLButtonElement>('[data-load-more]')!
const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]')!
const gameFilterEl = document.querySelector<HTMLSelectElement>('[data-game-filter]')!
const gameModeToggleEl = document.querySelector<HTMLElement>('[data-game-mode-toggle]')
const exclusiveToggleEl = document.querySelector<HTMLElement>('[data-exclusive-toggle]')
const versionProgressEl = document.querySelector<HTMLElement>('[data-version-progress]')
const genProgressPanelEl = document.querySelector<HTMLElement>('[data-generation-progress-panel]')
const genProgressToggleBtn = document.querySelector<HTMLButtonElement>(
  '[data-generation-progress-toggle]',
)
const genProgressCloseBtn = document.querySelector<HTMLButtonElement>(
  '[data-generation-progress-close]',
)
const genProgressBodyEl = document.querySelector<HTMLElement>('[data-generation-progress-body]')
const genProgressBarsEl = document.querySelector<HTMLElement>('[data-generation-progress-bars]')
const milestoneTrackerEl = document.querySelector<HTMLElement>('[data-milestone-tracker]')
const typeFilterEl = document.querySelector<HTMLElement>('[data-type-filter]')!
const typeModeToggleEl = document.querySelector<HTMLElement>('[data-type-mode-toggle]')
const genFilterEl = document.querySelector<HTMLElement>('[data-generation-filter]')!
const viewToggleEl = document.querySelector<HTMLElement>('[data-view-toggle]')!
const capturedCountEl = document.querySelector<HTMLElement>('[data-captured-count]')!
const totalCountEl = document.querySelector<HTMLElement>('[data-total-count]')!
const filterToggleBtn = document.querySelector<HTMLButtonElement>('[data-filter-toggle]')
const filtersPanelEl = document.querySelector<HTMLElement>('[data-filters-panel]')
const filterActiveCountEl = document.querySelector<HTMLElement>('[data-filter-active-count]')
const clearFiltersBtn = document.querySelector<HTMLButtonElement>('[data-clear-filters]')
const closeFiltersBtn = document.querySelector<HTMLButtonElement>('[data-close-filters]')

const movesInputEl = document.querySelector<HTMLInputElement>('[data-moves-input]')
const clearMovesInputBtn = document.querySelector<HTMLButtonElement>('[data-clear-moves-input]')
const movesDropdownEl = document.querySelector<HTMLElement>('[data-moves-dropdown]')
const movesTagsEl = document.querySelector<HTMLElement>('[data-moves-tags]')
const movesSummaryEl = document.querySelector<HTMLElement>('[data-moves-summary]')
const movesFilterContainer = document.querySelector<HTMLElement>('[data-moves-filter-container]')

let allPokemon: Pokemon[] = []
let allPokemonReady = false
let filtered: Pokemon[] = []
let shown = 0
let manifestTotal = 0
let view: 'all' | 'captured' = 'all'
let search = ''
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const urlGame = urlParams?.get('game')
if (urlGame) {
  setSelectedGame(urlGame)
}
const urlMode = urlParams?.get('mode') as GameDexMode | null
if (urlMode === 'regional' || urlMode === 'obtainable') {
  setGameDexMode(urlMode)
}

let selectedGame = getSelectedGame()
let selectedGameMode: GameDexMode = getGameDexMode()
let selectedExclusiveFilters = new Set<string>(['all'])
let gameDexData: GameDexData | null = null
let activeExclusivesMap = new Map<number, GameVersionMeta>()
const gameSpeciesSets = new Map<string, { regional: Set<number>; obtainable: Set<number> }>()
const selectedTypes = new Set<string>()
let selectedTypeMode: 'or' | 'and' = 'or'
const selectedGenerations = new Set<string>()
const selectedMoves = new Set<string>()
let moveDetailsMap: Record<string, MoveData> = {}
const moveCountMap = new Map<string, number>()
let highlightedMoveIndex = -1
let currentMoveMatches: MoveData[] = []
const gameToGenMap = new Map<string, GenerationInfo>()
let cachedGenerations: GenerationInfo[] = []
let lastGlobalPercentage = 0

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

function renderCardHTML(p: Pokemon, captured: boolean): string {
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? ''
  const typesHtml = p.types
    .map(
      (type) =>
        `<span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>`,
    )
    .join('')

  const primaryType = p.types[0] ?? 'normal'
  const glowColor = typeColor(primaryType)

  let exclusiveBadgeHtml = ''
  if (selectedGame && activeExclusivesMap.has(p.id)) {
    const meta = activeExclusivesMap.get(p.id)!
    const vName = locale === 'es' ? meta.nameEs : meta.name
    const badgeTitle = t.pokedex.exclusiveBadge.replace('{version}', vName)
    exclusiveBadgeHtml = `
      <span class="exclusive-badge" style="--version-color:${meta.color};" title="${badgeTitle}">
        <span class="exclusive-badge__dot"></span>
        <span class="exclusive-badge__label">${vName}</span>
      </span>
    `
  }

  // The round "captured" stamp tints to the specific cartridge's color when
  // the pokemon is only captured in one of the two versions.
  const dualVersionInfo = getDualVersionCaptureInfo(p.id)
  const badgeAppearance = getCapturedBadgeAppearance(dualVersionInfo, locale, t)
  const badgeStyleProps = [
    badgeAppearance.bg ? `--captured-badge-bg:${badgeAppearance.bg}` : '',
    badgeAppearance.color ? `--captured-badge-color:${badgeAppearance.color}` : '',
  ]
    .filter(Boolean)
    .join('; ')
  const capturedBadgeStyle = badgeStyleProps ? ` style="${badgeStyleProps};"` : ''
  const capturedBadgeTitle = badgeAppearance.title ? ` title="${badgeAppearance.title}"` : ''

  return `
    <article class="pokemon-card${captured ? ' captured' : ''}" data-pokemon-id="${p.id}" style="--type-glow:${glowColor};">
      <div class="pokemon-card__header">
        <span class="pokemon-card__id">${dexNumber(p.id)}</span>
        ${exclusiveBadgeHtml}
      </div>
      <div class="pokemon-card__sprite-wrap">
        <img class="pokemon-card__sprite" data-sprite-src="${sprite}" alt="${p.name}" decoding="async" width="120" height="120" />
      </div>
      <div class="captured-badge"${capturedBadgeStyle}${capturedBadgeTitle}><i data-lucide="circle-dot"></i></div>
      <div class="pokemon-card__name">${p.name}</div>
      <div class="pokemon-card__types">${typesHtml}</div>
      <button class="pokemon-card__capture-btn" type="button" data-capture-btn data-pokemon-id="${p.id}">
        <i data-lucide="${captured ? 'check' : 'circle-dot'}"></i>
        ${captured ? t.pokedex.caught : t.pokedex.catch}
      </button>
    </article>
  `
}

interface DualVersionCaptureInfo {
  vA: GameVersionMeta
  vB: GameVersionMeta
  inA: boolean
  inB: boolean
}

// Dual Version Mode: whether/how a pokemon is captured per cartridge in the
// currently selected game. Only meaningful for real version pairs (same
// gate as the exclusive toggle) — null for single-version games, DLC packs,
// or when no game is selected.
function getDualVersionCaptureInfo(pokemonId: number): DualVersionCaptureInfo | null {
  if (!selectedGame || !gameDexData) return null
  const entry = gameDexData[selectedGame]
  const hasDualVersions = Boolean(
    entry?.versions &&
      entry.versions.length === 2 &&
      entry.exclusives &&
      Object.keys(entry.exclusives).length > 0,
  )
  if (!hasDualVersions) return null

  const [vA, vB] = entry!.versions!
  return {
    vA,
    vB,
    inA: getCapturedByGame(vA.id).has(pokemonId),
    inB: getCapturedByGame(vB.id).has(pokemonId),
  }
}

interface CapturedBadgeAppearance {
  bg: string | null
  color: string | null
  title: string
}

// Shared by renderCardHTML (initial render) and syncCapturedBadgeAppearance
// (live updates from the modal) so both stay in sync. Captured in only one
// version tints the icon to that version's color; captured in both splits
// the badge's background between both colors instead of picking a single
// fixed accent — a fixed color would risk coinciding with a real version
// color (e.g. LeafGreen).
function getCapturedBadgeAppearance(
  info: DualVersionCaptureInfo | null,
  locale: 'en' | 'es',
  t: ReturnType<typeof getTranslations>,
): CapturedBadgeAppearance {
  if (!info || (!info.inA && !info.inB)) return { bg: null, color: null, title: '' }

  if (info.inA !== info.inB) {
    const meta = info.inA ? info.vA : info.vB
    const vName = locale === 'es' ? meta.nameEs : meta.name
    return {
      bg: null,
      color: meta.color,
      title: t.pokedex.capturedInVersion.replace('{version}', vName),
    }
  }

  return {
    bg: `linear-gradient(135deg, ${info.vA.color} 50%, ${info.vB.color} 50%)`,
    color: '#fff',
    title: t.pokedex.capturedInBoth,
  }
}

function getExclusiveMapForGame(game: string): Map<number, GameVersionMeta> {
  const map = new Map<number, GameVersionMeta>()
  if (!game || !gameDexData || !gameDexData[game]) return map
  const entry = gameDexData[game]
  if (!entry.exclusives || !entry.versions || entry.versions.length !== 2) return map

  const versionMetaMap = new Map(entry.versions.map((v) => [v.id, v]))
  for (const [vId, ids] of Object.entries(entry.exclusives)) {
    const meta = versionMetaMap.get(vId)
    if (meta) {
      for (const id of ids) {
        map.set(id, meta)
      }
    }
  }
  return map
}

function updateExclusiveToggleUI(): void {
  if (!exclusiveToggleEl) return
  const entry = selectedGame && gameDexData ? gameDexData[selectedGame] : null
  const hasExclusives = Boolean(
    entry?.versions &&
    entry.versions.length === 2 &&
    entry.exclusives &&
    Object.keys(entry.exclusives).length > 0,
  )

  if (!hasExclusives) {
    exclusiveToggleEl.hidden = true
    exclusiveToggleEl.innerHTML = ''
    selectedExclusiveFilters = new Set(['all'])
    return
  }

  exclusiveToggleEl.hidden = false
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  const [vA, vB] = entry!.versions!
  const nameA = locale === 'es' ? vA.nameEs : vA.name
  const nameB = locale === 'es' ? vB.nameEs : vB.name

  exclusiveToggleEl.innerHTML = `
    <button class="view-toggle__btn" type="button" data-exclusive-filter="all" aria-pressed="${String(selectedExclusiveFilters.has('all'))}">
      ${t.pokedex.exclusiveAll}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="${vA.id}" aria-pressed="${String(selectedExclusiveFilters.has(vA.id))}" style="--btn-color:${vA.color};">
      <span class="exclusive-dot" style="--btn-color:${vA.color};"></span>
      ${t.pokedex.exclusiveOnly.replace('{version}', nameA)}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="${vB.id}" aria-pressed="${String(selectedExclusiveFilters.has(vB.id))}" style="--btn-color:${vB.color};">
      <span class="exclusive-dot" style="--btn-color:${vB.color};"></span>
      ${t.pokedex.exclusiveOnly.replace('{version}', nameB)}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="both" aria-pressed="${String(selectedExclusiveFilters.has('both'))}">
      ${t.pokedex.exclusiveBoth}
    </button>
  `
}

function getActiveGamePokemonList(game: string): number[] | null {
  if (!game || !gameDexData || !gameDexData[game]) return null
  const entry = gameDexData[game]
  return selectedGameMode === 'obtainable' ? entry.obtainable : entry.regional
}

function getActiveGameSpeciesSet(game: string): Set<number> | null {
  if (!game) return null
  const entry = gameSpeciesSets.get(game)
  if (!entry) return null
  return selectedGameMode === 'obtainable' ? entry.obtainable : entry.regional
}

function updateGameModeToggleUI(): void {
  if (!gameModeToggleEl) return
  if (!selectedGame) {
    gameModeToggleEl.hidden = true
    return
  }
  gameModeToggleEl.hidden = false
  gameModeToggleEl.querySelectorAll<HTMLButtonElement>('[data-game-mode]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.gameMode === selectedGameMode))
  })
}

function updateCapturedCounter(): void {
  const capturedIds = getCapturedIds()

  if (selectedGame && gameDexData && gameDexData[selectedGame]) {
    const fullGameList = getActiveGamePokemonList(selectedGame)!
    let targetList = fullGameList

    if (!selectedExclusiveFilters.has('all') && activeExclusivesMap.size > 0) {
      targetList = fullGameList.filter((id) => {
        const meta = activeExclusivesMap.get(id)
        const category = meta ? meta.id : 'both'
        return selectedExclusiveFilters.has(category)
      })
    }

    let countInGame = 0
    for (const id of targetList) {
      if (capturedIds.has(id)) {
        countInGame++
      }
    }

    if (capturedCountEl) capturedCountEl.textContent = String(countInGame)
    if (totalCountEl) totalCountEl.textContent = String(targetList.length)
  } else {
    if (capturedCountEl) capturedCountEl.textContent = String(capturedIds.size)
    if (totalCountEl) totalCountEl.textContent = manifestTotal ? String(manifestTotal) : '—'
  }
}

// Dual Version Mode: one pill per cartridge with precise per-version
// progress (from `poketeam:captured-by-game`, not the aggregate captured
// set), so a player owning both copies can see exactly what's left in each.
function updateVersionProgressUI(): void {
  if (!versionProgressEl) return
  const entry = selectedGame && gameDexData ? gameDexData[selectedGame] : null
  const hasDualVersions = Boolean(
    entry?.versions &&
      entry.versions.length === 2 &&
      entry.exclusives &&
      Object.keys(entry.exclusives).length > 0,
  )

  if (!hasDualVersions || !entry) {
    versionProgressEl.hidden = true
    versionProgressEl.innerHTML = ''
    return
  }

  versionProgressEl.hidden = false
  const locale = getCurrentLocale()
  const fullGameList = getActiveGamePokemonList(selectedGame)!
  const [vA, vB] = entry.versions!

  versionProgressEl.innerHTML = [vA, vB]
    .map((v) => {
      const name = locale === 'es' ? v.nameEs : v.name
      const eligible = fullGameList.filter((id) => {
        const meta = activeExclusivesMap.get(id)
        return !meta || meta.id === v.id
      })
      const capturedForVersion = getCapturedByGame(v.id)
      const count = eligible.filter((id) => capturedForVersion.has(id)).length
      const isActive = selectedExclusiveFilters.has(v.id)
      return `
        <button
          class="version-pill${isActive ? ' version-pill--active' : ''}"
          type="button"
          data-version-pill
          data-version-id="${v.id}"
          style="--pill-color:${v.color};"
        >
          <span class="version-pill__name">${name}</span>
          <span class="version-pill__count">${count}/${eligible.length}</span>
        </button>
      `
    })
    .join('')
}

// Shared by the generation filter chips and the generation progress bars, so
// both triggers stay in sync when either one is clicked.
function toggleGenerationFilter(genName: string): void {
  if (selectedGenerations.has(genName)) {
    selectedGenerations.delete(genName)
  } else {
    selectedGenerations.add(genName)
  }
  genFilterEl
    .querySelectorAll<HTMLButtonElement>(`[data-generation="${genName}"]`)
    .forEach((btn) => btn.setAttribute('aria-pressed', String(selectedGenerations.has(genName))))
  genProgressBarsEl
    ?.querySelectorAll<HTMLButtonElement>(`[data-generation-progress-bar][data-generation="${genName}"]`)
    .forEach((btn) => btn.setAttribute('aria-pressed', String(selectedGenerations.has(genName))))
  updateActiveFilterBadge()
  applyFilters()
}

// Region/generation progress panel + global milestone tracker. Milestones
// are global only (25/50/75/100% of manifestTotal) — no per-region marks in
// v1. lastGlobalPercentage lives in memory only, so reloading the page while
// already past a threshold never re-announces it (no transition happened).
function updateGenerationProgressUI(): void {
  if (!genProgressBarsEl && !milestoneTrackerEl) return

  const capturedIds = getCapturedIds()

  if (milestoneTrackerEl) {
    const globalPercentage = calculatePercentage(capturedIds.size, manifestTotal)
    const reached = getReachedMilestones(globalPercentage)

    milestoneTrackerEl.innerHTML = MILESTONE_THRESHOLDS.map((threshold) => {
      const isReached = reached.includes(threshold)
      return `<span class="milestone-node${isReached ? ' is-reached' : ''}">${threshold}%</span>`
    }).join('')

    if (globalPercentage > lastGlobalPercentage) {
      const newlyReached = reached.filter(
        (m) => !getReachedMilestones(lastGlobalPercentage).includes(m),
      )
      if (newlyReached.length > 0) {
        const locale = getCurrentLocale()
        const t = getTranslations(locale)
        const milestone = newlyReached[newlyReached.length - 1]
        toast.success(t.pokedex.milestoneReached.replace('{pct}', String(milestone)))
      }
    }
    lastGlobalPercentage = globalPercentage
  }

  if (genProgressBarsEl && cachedGenerations.length > 0) {
    const regionProgress = calculateRegionProgress(cachedGenerations, capturedIds)
    genProgressBarsEl.innerHTML = regionProgress
      .map((r) => {
        const isActive = selectedGenerations.has(r.generationName)
        return `
          <button
            type="button"
            class="generation-progress-bar"
            data-generation-progress-bar
            data-generation="${r.generationName}"
            aria-pressed="${isActive}"
          >
            <span class="generation-progress-bar__label">
              <span>${r.displayName}</span>
              <span class="generation-progress-bar__count">${r.caughtCount}/${r.totalCount}</span>
            </span>
            <span class="generation-progress-bar__track">
              <span class="generation-progress-bar__fill" style="width:${r.percentage}%"></span>
            </span>
          </button>
        `
      })
      .join('')
  }
}

// Ids whose card-level capture animation this page's own grid click just
// started — CAPTURED_CHANGED_EVENT fires synchronously from setCaptured(),
// before that click handler finishes updating the card itself, so the
// cross-source sync below must skip them to avoid stomping the mid-flight
// reveal animation with an instant class toggle.
const animatingIds = new Set<number>()

// Keeps the round captured-badge's version tint/title in sync — needed not
// just on first render but also when a modal toggle flips which version(s)
// a pokemon is attributed to without necessarily flipping `captured` itself
// (e.g. going from "only A" to "both"). "Both" gets --success rather than
// either game's color, matching the same choice made in renderCardHTML.
function syncCapturedBadgeAppearance(card: HTMLElement, id: number): void {
  const badge = card.querySelector<HTMLElement>('.captured-badge')
  if (!badge) return
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  const appearance = getCapturedBadgeAppearance(getDualVersionCaptureInfo(id), locale, t)

  if (appearance.bg) badge.style.setProperty('--captured-badge-bg', appearance.bg)
  else badge.style.removeProperty('--captured-badge-bg')

  if (appearance.color) badge.style.setProperty('--captured-badge-color', appearance.color)
  else badge.style.removeProperty('--captured-badge-color')

  badge.title = appearance.title
}

// Keeps a card in the grid correct when captured state changes from
// somewhere other than clicking that same card (e.g. the detail modal) —
// without this, capturing from the modal left the card behind it stale
// until a full page reload.
function syncCardCapturedState(id: number, captured: boolean): void {
  const card = document.querySelector<HTMLElement>(`.pokemon-card[data-pokemon-id="${id}"]`)
  if (!card) return
  card.classList.toggle('captured', captured)
  const btn = card.querySelector<HTMLButtonElement>('[data-capture-btn]')
  if (btn) {
    const t = getTranslations(getCurrentLocale())
    btn.innerHTML = `<i data-lucide="${captured ? 'check' : 'circle-dot'}"></i> ${captured ? t.pokedex.caught : t.pokedex.catch}`
    refreshIcons()
  }
  syncCapturedBadgeAppearance(card, id)

  if (!captured && view === 'captured') applyFilters()
}

// Refreshes every rendered card's captured state at once — used when a bulk
// change (cloud sync, backup import, "merge") replaces the captured set
// rather than toggling a single id.
function syncAllCardsCapturedState(): void {
  const capturedIds = getCapturedIds()
  for (const card of grid.querySelectorAll<HTMLElement>('.pokemon-card')) {
    const id = Number(card.dataset.pokemonId)
    if (!Number.isNaN(id)) syncCardCapturedState(id, capturedIds.has(id))
  }
  if (view === 'captured') applyFilters()
}

function categoryLabel(cat: string, locale: 'en' | 'es'): string {
  const t = getTranslations(locale)
  if (cat === 'physical') return t.team.physical
  if (cat === 'special') return t.team.special
  if (cat === 'status') return t.team.status
  return cat
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function updateMoveCountMap(): void {
  moveCountMap.clear()
  for (const p of allPokemon) {
    if (p.moves) {
      for (const m of p.moves) {
        moveCountMap.set(m, (moveCountMap.get(m) ?? 0) + 1)
      }
    }
  }
}

function filterMoves(query: string): MoveData[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  const allMoves = Object.values(moveDetailsMap)
  const locale = getCurrentLocale()
  const parsed = parseMoveQuery(trimmed)

  const hasAdvancedFilter =
    parsed.types.length > 0 ||
    parsed.negatedTypes.length > 0 ||
    parsed.categories.length > 0 ||
    parsed.negatedCategories.length > 0 ||
    parsed.methods.length > 0 ||
    parsed.negatedMethods.length > 0 ||
    parsed.numericFilters.length > 0

  if (hasAdvancedFilter) {
    const matched = allMoves.filter((move) => {
      const item: MoveFilterItem = {
        name: move.name,
        nameEs: move.nameEs,
        nameEn: move.nameEn,
        type: move.type,
        category: move.category,
        power: move.power,
        pp: move.pp,
        accuracy: move.accuracy,
      }
      return matchesMoveFilter(item, parsed, locale)
    })

    matched.sort((a, b) => {
      const countA = moveCountMap.get(a.name) ?? 0
      const countB = moveCountMap.get(b.name) ?? 0
      if (countB !== countA) return countB - countA
      return a.name.localeCompare(b.name)
    })

    return matched.slice(0, 15)
  }

  const q = normalize(query)

  interface ScoredMove {
    move: MoveData
    score: number
  }

  const scored: ScoredMove[] = []

  for (const move of allMoves) {
    const nameEsNorm = move.nameEs ? normalize(move.nameEs) : ''
    const nameEnNorm = move.nameEn ? normalize(move.nameEn) : ''
    const slugNorm = normalize(move.name.replace(/-/g, ' '))

    const primaryNorm = locale === 'es' ? nameEsNorm : nameEnNorm
    const secondaryNorm = locale === 'es' ? nameEnNorm : nameEsNorm

    let score = -1

    if (primaryNorm === q) score = 0
    else if (secondaryNorm === q || slugNorm === q) score = 1
    else if (primaryNorm.startsWith(q)) score = 2
    else if (secondaryNorm.startsWith(q) || slugNorm.startsWith(q)) score = 3
    else if (primaryNorm.includes(q)) score = 4
    else if (secondaryNorm.includes(q) || slugNorm.includes(q)) score = 5

    if (score >= 0) {
      scored.push({ move, score })
    }
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    const countA = moveCountMap.get(a.move.name) ?? 0
    const countB = moveCountMap.get(b.move.name) ?? 0
    if (countB !== countA) return countB - countA
    return a.move.name.localeCompare(b.move.name)
  })

  return scored.slice(0, 15).map((s) => s.move)
}

function adjustDropdownPosition(): void {
  if (!movesDropdownEl || !movesInputEl) return
  const inputRect = movesInputEl.getBoundingClientRect()
  const spaceBelow = window.innerHeight - inputRect.bottom
  const spaceAbove = inputRect.top

  if (spaceBelow < 220 && spaceAbove > spaceBelow) {
    movesDropdownEl.classList.add('is-open-up')
    const maxHeight = Math.max(140, Math.min(300, Math.floor(spaceAbove - 24)))
    movesDropdownEl.style.maxHeight = `${maxHeight}px`
  } else {
    movesDropdownEl.classList.remove('is-open-up')
    const maxHeight = Math.max(140, Math.min(300, Math.floor(spaceBelow - 24)))
    movesDropdownEl.style.maxHeight = `${maxHeight}px`
  }
}

function renderMoveDropdown(moves: MoveData[]): void {
  if (!movesDropdownEl) return
  currentMoveMatches = moves
  highlightedMoveIndex = -1

  if (moves.length === 0) {
    const t = getTranslations(getCurrentLocale())
    movesDropdownEl.innerHTML = `<div class="moves-autocomplete__empty">${t.pokedex.noMovesFound}</div>`
    movesDropdownEl.hidden = false
    movesInputEl?.setAttribute('aria-expanded', 'true')
    adjustDropdownPosition()
    return
  }

  const locale = getCurrentLocale()
  const t = getTranslations(locale)

  const html = moves
    .map((move, idx) => {
      const isSelected = selectedMoves.has(move.name)
      const displayName = getMoveName(move.name, locale, move)
      const secondaryName =
        locale === 'es'
          ? move.nameEn && move.nameEn.toLowerCase() !== displayName.toLowerCase()
            ? move.nameEn
            : ''
          : move.nameEs && move.nameEs.toLowerCase() !== displayName.toLowerCase()
            ? move.nameEs
            : ''

      const pCount = moveCountMap.get(move.name) ?? 0
      const countLabel = t.pokedex.moveLearnedBy.replace('{count}', String(pCount))
      const powerLabel =
        move.power !== null ? `${locale === 'es' ? 'Pot' : 'Pwr'}: ${move.power}` : ''
      const accLabel =
        move.accuracy !== null ? `${locale === 'es' ? 'Prec' : 'Acc'}: ${move.accuracy}%` : ''
      const catLabel = categoryLabel(move.category, locale)

      const statsParts = [powerLabel, accLabel].filter(Boolean).join(' • ')

      return `
        <div
          class="moves-autocomplete-item${isSelected ? ' is-selected' : ''}"
          data-move-slug="${move.name}"
          data-index="${idx}"
          role="option"
          aria-selected="false"
        >
          <div class="moves-autocomplete-item__left">
            <span class="moves-sugg__type" style="background-color:${typeColor(move.type)}">
              ${getTypeName(move.type, locale)}
            </span>
            <div class="moves-autocomplete-item__info">
              <div class="moves-autocomplete-item__name-row">
                <span class="moves-autocomplete-item__title">${displayName}</span>
                ${secondaryName ? `<span class="moves-autocomplete-item__subtitle">(${secondaryName})</span>` : ''}
              </div>
              <div class="moves-autocomplete-item__meta-row">
                <span class="move-category-badge move-category-badge--${move.category}">${catLabel}</span>
                ${statsParts ? `<span class="moves-autocomplete-item__meta-sep">•</span><span>${statsParts}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="moves-autocomplete-item__right">
            <span class="moves-sugg__count">${countLabel}</span>
            ${isSelected ? `<span class="moves-sugg__check"><i data-lucide="check"></i></span>` : ''}
          </div>
        </div>
      `
    })
    .join('')

  movesDropdownEl.innerHTML = html
  movesDropdownEl.hidden = false
  movesInputEl?.setAttribute('aria-expanded', 'true')
  adjustDropdownPosition()
  refreshIcons()
}

function closeMovesDropdown(): void {
  if (!movesDropdownEl) return
  movesDropdownEl.hidden = true
  movesDropdownEl.classList.remove('is-open-up')
  movesDropdownEl.style.maxHeight = ''
  movesInputEl?.setAttribute('aria-expanded', 'false')
  highlightedMoveIndex = -1
  currentMoveMatches = []
}

function updateHighlightedOption(): void {
  if (!movesDropdownEl) return
  const items = movesDropdownEl.querySelectorAll<HTMLElement>('.moves-autocomplete-item')
  items.forEach((item, idx) => {
    const isHigh = idx === highlightedMoveIndex
    item.classList.toggle('is-highlighted', isHigh)
    item.setAttribute('aria-selected', String(isHigh))
    if (isHigh) {
      item.scrollIntoView({ block: 'nearest' })
    }
  })
}

function renderSelectedMoveTags(): void {
  if (!movesTagsEl || !movesSummaryEl) return

  if (selectedMoves.size === 0) {
    movesTagsEl.hidden = true
    movesTagsEl.innerHTML = ''
    movesSummaryEl.hidden = true
    movesSummaryEl.innerHTML = ''
    return
  }

  movesTagsEl.hidden = false
  const locale = getCurrentLocale()
  const t = getTranslations(locale)

  let tagsHtml = Array.from(selectedMoves)
    .map((slug) => {
      const meta = moveDetailsMap[slug]
      const displayName = getMoveName(slug, locale, meta)
      const tColor = meta ? typeColor(meta.type) : 'var(--accent)'
      const removeAria = t.pokedex.removeMove.replace('{move}', displayName)
      return `
        <span class="moves-tag" style="--tag-border:${tColor};">
          <span class="moves-tag__dot" style="background:${tColor};"></span>
          <span class="moves-tag__name">${displayName}</span>
          <button class="moves-tag__remove" type="button" data-remove-move="${slug}" aria-label="${removeAria}" title="${removeAria}">
            <i data-lucide="x"></i>
          </button>
        </span>
      `
    })
    .join('')

  if (selectedMoves.size > 1) {
    tagsHtml += `
      <button class="moves-tags__clear-all" type="button" data-clear-all-moves>
        <i data-lucide="trash-2"></i> ${t.pokedex.clearMoves}
      </button>
    `
  }

  movesTagsEl.innerHTML = tagsHtml
  refreshIcons()

  movesSummaryEl.hidden = false
  const moveNamesList = Array.from(selectedMoves).map((s) =>
    getMoveName(s, locale, moveDetailsMap[s]),
  )
  const formattedNames = moveNamesList.join(locale === 'es' ? ' Y ' : ' & ')
  const matchesCount = filtered.length

  if (matchesCount === 0) {
    movesSummaryEl.className = 'moves-filter-summary moves-filter-summary--empty'
    movesSummaryEl.innerHTML = `<i data-lucide="info"></i> ${
      locale === 'es'
        ? `Ningún Pokémon aprende simultáneamente: <strong>${formattedNames}</strong>`
        : `No Pokémon learns simultaneously: <strong>${formattedNames}</strong>`
    }`
  } else {
    movesSummaryEl.className = 'moves-filter-summary moves-filter-summary--active'
    movesSummaryEl.innerHTML = `<i data-lucide="check-circle-2"></i> ${
      locale === 'es'
        ? `${matchesCount} Pokémon ${matchesCount === 1 ? 'aprende' : 'aprenden'} <strong>${formattedNames}</strong>`
        : `${matchesCount} Pokémon ${matchesCount === 1 ? 'learns' : 'learn'} <strong>${formattedNames}</strong>`
    }`
  }
  refreshIcons()
}

function toggleSelectedMove(slug: string): void {
  if (selectedMoves.has(slug)) {
    selectedMoves.delete(slug)
  } else {
    selectedMoves.add(slug)
  }
  if (movesInputEl) movesInputEl.value = ''
  if (clearMovesInputBtn) clearMovesInputBtn.hidden = true
  closeMovesDropdown()
  updateActiveFilterBadge()
  applyFilters()
}

function computeFiltered(source: Pokemon[]): Pokemon[] {
  const capturedIds = getCapturedIds()
  const gameSpeciesSet = getActiveGameSpeciesSet(selectedGame)

  return source.filter((p) => {
    if (view === 'captured' && !capturedIds.has(p.id)) return false
    if (search && !p.name.includes(search) && !String(p.id).includes(search)) return false
    if (selectedTypes.size) {
      if (selectedTypeMode === 'and') {
        for (const t of selectedTypes) {
          if (!p.types.includes(t)) return false
        }
      } else {
        if (!p.types.some((t) => selectedTypes.has(t))) return false
      }
    }
    if (selectedGenerations.size && !selectedGenerations.has(p.generation)) return false
    if (gameSpeciesSet && !gameSpeciesSet.has(p.id)) return false

    if (!selectedExclusiveFilters.has('all') && activeExclusivesMap.size > 0) {
      const meta = activeExclusivesMap.get(p.id)
      const category = meta ? meta.id : 'both'
      if (!selectedExclusiveFilters.has(category)) return false
    }

    if (selectedMoves.size > 0) {
      for (const m of selectedMoves) {
        if (!p.moves || !p.moves.includes(m)) return false
      }
    }

    return true
  })
}

function renderNextBatch(): void {
  const capturedIds = getCapturedIds()
  const next = filtered.slice(shown, shown + PAGE_SIZE)

  if (next.length) {
    const template = document.createElement('template')
    template.innerHTML = next.map((p) => renderCardHTML(p, capturedIds.has(p.id))).join('')
    const newEls = Array.from(template.content.children) as HTMLElement[]
    grid.append(...newEls)
    shown += next.length
    refreshIcons()
    staggerCardsIn(newEls)
  }

  emptyMsg.hidden = filtered.length > 0 || shown > 0
  loadMoreWrap.hidden = allPokemonReady ? shown >= filtered.length : shown >= manifestTotal
}

async function applyFilters(): Promise<void> {
  if (!allPokemonReady) {
    allPokemon = await getAllPokemon()
    allPokemonReady = true
    updateMoveCountMap()
  }
  filtered = computeFiltered(allPokemon)
  shown = 0
  grid.innerHTML = ''
  renderNextBatch()
  renderSelectedMoveTags()
}

function populateTypeChips(types: string[]): void {
  const locale = getCurrentLocale()
  const chips = types
    .map(
      (t) =>
        `<button class="filter-chip" type="button" data-type="${t}" aria-pressed="${String(selectedTypes.has(t))}" style="--badge-bg:${typeColor(t)}">${getTypeName(t, locale)}</button>`,
    )
    .join('')

  typeFilterEl.innerHTML = `<div class="filter-group__row">${chips}</div>`
}

function populateGenerationChips(generations: GenerationInfo[]): void {
  const chips = generations
    .map((g) => {
      const label = g.displayName.replace(/^(Generación|Generation)\s*/i, '')
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="${String(selectedGenerations.has(g.name))}">${label}</button>`
    })
    .join('')

  genFilterEl.innerHTML = `<div class="filter-group__row">${chips}</div>`
}

function populateGameSelect(generations: GenerationInfo[]): void {
  const locale = getCurrentLocale()
  const t = getTranslations(locale)
  gameToGenMap.clear()
  let html = `<option value="">${t.pokedex.allGames}</option>`

  for (const g of generations) {
    const regionName = g.region ? getRegionName(g.region, locale) : ''
    const regionLabel = regionName ? ` (${regionName})` : ''
    const genName =
      locale === 'es' ? g.displayName : g.displayName.replace('Generación', 'Generation')
    html += `<optgroup label="${genName}${regionLabel}">`
    for (const vg of g.versionGroups) {
      gameToGenMap.set(vg.name, g)
      const title = getGameTitle(vg.name, locale, vg.displayName)
      html += `<option value="${vg.name}">${title}</option>`
    }
    html += `</optgroup>`
  }

  if (gameFilterEl) {
    gameFilterEl.innerHTML = html
    gameFilterEl.value = selectedGame
  }
}

// --- filter collapse & active badge --------------------------------------

const STORAGE_KEY_FILTERS_EXPANDED = 'poketeam:pokedex-filters-expanded'
const STORAGE_KEY_GEN_PROGRESS_EXPANDED = 'poketeam:generation-progress-expanded'

let filtersExpanded = false

function updateFiltersCollapseUI(expanded: boolean): void {
  if (!filtersPanelEl || !filterToggleBtn) return

  filtersExpanded = expanded
  const locale = getCurrentLocale()
  const t = getTranslations(locale)

  if (expanded) {
    filtersPanelEl.classList.remove('is-collapsed')
    filtersPanelEl.classList.add('is-expanded')
    filterToggleBtn.setAttribute('aria-expanded', 'true')
    filterToggleBtn.classList.add('is-panel-open')
    filterToggleBtn.title = t.pokedex.hideFilters
    filterToggleBtn.setAttribute('aria-label', t.pokedex.hideFilters)
  } else {
    filtersPanelEl.classList.add('is-collapsed')
    filtersPanelEl.classList.remove('is-expanded')
    filterToggleBtn.setAttribute('aria-expanded', 'false')
    filterToggleBtn.classList.remove('is-panel-open')
    filterToggleBtn.title = t.pokedex.showFilters
    filterToggleBtn.setAttribute('aria-label', t.pokedex.showFilters)
  }
}

function toggleFilters(): void {
  const willExpand = !filtersExpanded
  updateFiltersCollapseUI(willExpand)
  try {
    sessionStorage.setItem(STORAGE_KEY_FILTERS_EXPANDED, String(willExpand))
  } catch {
    // Ignore storage issues
  }
}

let genProgressExpanded = false

function updateGenerationProgressCollapseUI(expanded: boolean): void {
  genProgressExpanded = expanded
  const locale = getCurrentLocale()
  const t = getTranslations(locale)

  if (genProgressPanelEl) {
    if (expanded) {
      genProgressPanelEl.classList.remove('is-collapsed')
      genProgressPanelEl.classList.add('is-expanded')
    } else {
      genProgressPanelEl.classList.add('is-collapsed')
      genProgressPanelEl.classList.remove('is-expanded')
    }
  }

  if (genProgressBodyEl) {
    genProgressBodyEl.hidden = !expanded
  }

  if (genProgressToggleBtn) {
    genProgressToggleBtn.setAttribute('aria-expanded', String(expanded))
    genProgressToggleBtn.classList.toggle('is-active', expanded)
    const label = expanded ? t.pokedex.hideRegionProgress : t.pokedex.progressByRegion
    genProgressToggleBtn.title = label
  }

  try {
    sessionStorage.setItem(STORAGE_KEY_GEN_PROGRESS_EXPANDED, String(expanded))
  } catch {
    // Ignore storage issues
  }
}

function updateActiveFilterBadge(): void {
  let count = 0
  if (selectedGame) count++
  if (!selectedExclusiveFilters.has('all')) {
    count += selectedExclusiveFilters.size
  }
  count += selectedTypes.size
  count += selectedGenerations.size
  count += selectedMoves.size

  if (filterActiveCountEl) {
    if (count > 0) {
      filterActiveCountEl.textContent = String(count)
      filterActiveCountEl.hidden = false
    } else {
      filterActiveCountEl.hidden = true
    }
  }

  if (filterToggleBtn) {
    filterToggleBtn.classList.toggle('has-active-filters', count > 0)
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.hidden = count === 0
  }
}

function clearAllFilters(): void {
  let changed = false

  if (selectedGame) {
    selectedGame = ''
    setSelectedGame('')
    if (gameFilterEl) gameFilterEl.value = ''
    activeExclusivesMap.clear()
    selectedExclusiveFilters = new Set(['all'])
    updateGameModeToggleUI()
    updateExclusiveToggleUI()
    updateVersionProgressUI()
    changed = true
  } else if (!selectedExclusiveFilters.has('all')) {
    selectedExclusiveFilters = new Set(['all'])
    updateExclusiveToggleUI()
    updateVersionProgressUI()
    changed = true
  }

  if (selectedTypes.size > 0) {
    selectedTypes.clear()
    typeFilterEl.querySelectorAll<HTMLButtonElement>('[data-type]').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'false')
    })
    changed = true
  }

  if (selectedTypeMode !== 'or') {
    selectedTypeMode = 'or'
    typeModeToggleEl?.querySelectorAll<HTMLButtonElement>('[data-type-mode]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.typeMode === 'or'))
    })
    changed = true
  }

  if (selectedGenerations.size > 0) {
    selectedGenerations.clear()
    genFilterEl.querySelectorAll<HTMLButtonElement>('[data-generation]').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'false')
    })
    genProgressBarsEl
      ?.querySelectorAll<HTMLButtonElement>('[data-generation-progress-bar]')
      .forEach((btn) => btn.setAttribute('aria-pressed', 'false'))
    changed = true
  }

  if (selectedMoves.size > 0) {
    selectedMoves.clear()
    if (movesInputEl) movesInputEl.value = ''
    if (clearMovesInputBtn) clearMovesInputBtn.hidden = true
    closeMovesDropdown()
    renderSelectedMoveTags()
    changed = true
  }

  if (changed) {
    updateCapturedCounter()
    updateActiveFilterBadge()
    applyFilters()
  }
}

// --- event wiring --------------------------------------------------------

grid.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const btn = target.closest<HTMLButtonElement>('[data-capture-btn]')

  if (!btn) {
    const card = target.closest<HTMLElement>('.pokemon-card')
    if (card) openPokemonModal(Number(card.dataset.pokemonId))
    return
  }

  const card = btn.closest<HTMLElement>('.pokemon-card')!
  const id = Number(btn.dataset.pokemonId)
  const name = card.querySelector('.pokemon-card__name')?.textContent ?? ''
  const nowCaptured = !card.classList.contains('captured')
  const locale = getCurrentLocale()
  const t = getTranslations(locale)

  animatingIds.add(id)
  setCaptured(id, nowCaptured)
  btn.innerHTML = `<i data-lucide="${nowCaptured ? 'check' : 'circle-dot'}"></i> ${nowCaptured ? t.pokedex.caught : t.pokedex.catch}`
  refreshIcons()

  if (nowCaptured) {
    animateCaptureReveal(card).then(() => {
      refreshIcons()
      animatingIds.delete(id)
    })
    toast.success(
      locale === 'es' ? `¡${capitalize(name)} capturado!` : `${capitalize(name)} caught!`,
    )
  } else {
    card.classList.remove('captured')
    animatingIds.delete(id)
    toast.info(
      locale === 'es'
        ? `${capitalize(name)} liberado de tu Pokédex.`
        : `${capitalize(name)} released from your Pokédex.`,
    )
    if (view === 'captured') applyFilters()
  }
})

let searchDebounce: number | undefined
searchInput.addEventListener('input', () => {
  window.clearTimeout(searchDebounce)
  searchDebounce = window.setTimeout(() => {
    search = searchInput.value.trim().toLowerCase()
    applyFilters()
  }, 200)
})

viewToggleEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-view]')
  if (!btn) return
  view = btn.dataset.view as 'all' | 'captured'
  viewToggleEl
    .querySelectorAll('[data-view]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)))
  applyFilters()
})

typeFilterEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-type]')
  if (!btn) return
  const t = btn.dataset.type!
  const pressed = btn.getAttribute('aria-pressed') === 'true'
  btn.setAttribute('aria-pressed', String(!pressed))
  if (pressed) selectedTypes.delete(t)
  else selectedTypes.add(t)
  updateActiveFilterBadge()
  applyFilters()
})

typeModeToggleEl?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-type-mode]')
  if (!btn) return
  const mode = btn.dataset.typeMode as 'or' | 'and'
  if (!mode || mode === selectedTypeMode) return
  selectedTypeMode = mode
  typeModeToggleEl.querySelectorAll<HTMLButtonElement>('[data-type-mode]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b === btn))
  })
  applyFilters()
})

genFilterEl.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-generation]')
  if (!btn) return
  toggleGenerationFilter(btn.dataset.generation!)
})

genProgressBarsEl?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-generation-progress-bar]')
  if (!btn) return
  toggleGenerationFilter(btn.dataset.generation!)
})

genProgressToggleBtn?.addEventListener('click', () => {
  updateGenerationProgressCollapseUI(!genProgressExpanded)
})

genProgressCloseBtn?.addEventListener('click', () => {
  updateGenerationProgressCollapseUI(false)
})

let movesInputDebounce: number | undefined

movesInputEl?.addEventListener('input', () => {
  window.clearTimeout(movesInputDebounce)
  const q = movesInputEl.value.trim()
  if (clearMovesInputBtn) clearMovesInputBtn.hidden = !q

  if (!q) {
    closeMovesDropdown()
    return
  }

  movesInputDebounce = window.setTimeout(() => {
    const currentQ = movesInputEl?.value.trim() ?? ''
    if (!currentQ) {
      closeMovesDropdown()
      return
    }
    if (!allPokemonReady) {
      getAllPokemon().then((pokemon) => {
        allPokemon = pokemon
        allPokemonReady = true
        filtered = computeFiltered(allPokemon)
        updateMoveCountMap()
        const curVal = movesInputEl?.value.trim() ?? ''
        if (curVal) {
          renderMoveDropdown(filterMoves(curVal))
        } else {
          closeMovesDropdown()
        }
      })
    } else {
      renderMoveDropdown(filterMoves(currentQ))
    }
  }, 100)
})

movesInputEl?.addEventListener('focus', () => {
  const q = movesInputEl.value.trim()
  if (!q) {
    closeMovesDropdown()
    return
  }
  if (!allPokemonReady) {
    getAllPokemon().then((pokemon) => {
      allPokemon = pokemon
      allPokemonReady = true
      filtered = computeFiltered(allPokemon)
      updateMoveCountMap()
      const curVal = movesInputEl?.value.trim() ?? ''
      if (curVal) {
        renderMoveDropdown(filterMoves(curVal))
      } else {
        closeMovesDropdown()
      }
    })
  } else {
    renderMoveDropdown(filterMoves(q))
  }
})

movesInputEl?.addEventListener('keydown', (e) => {
  if (movesDropdownEl && !movesDropdownEl.hidden && currentMoveMatches.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightedMoveIndex = (highlightedMoveIndex + 1) % currentMoveMatches.length
      updateHighlightedOption()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightedMoveIndex =
        (highlightedMoveIndex - 1 + currentMoveMatches.length) % currentMoveMatches.length
      updateHighlightedOption()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const targetIdx = highlightedMoveIndex >= 0 ? highlightedMoveIndex : 0
      const move = currentMoveMatches[targetIdx]
      if (move) {
        toggleSelectedMove(move.name)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMovesDropdown()
      return
    }
  } else if (e.key === 'Escape') {
    closeMovesDropdown()
  }
})

clearMovesInputBtn?.addEventListener('click', () => {
  if (movesInputEl) {
    movesInputEl.value = ''
    movesInputEl.focus()
  }
  clearMovesInputBtn.hidden = true
  closeMovesDropdown()
})

window.addEventListener('resize', () => {
  if (movesDropdownEl && !movesDropdownEl.hidden) {
    adjustDropdownPosition()
  }
})

movesDropdownEl?.addEventListener('click', (e) => {
  const item = (e.target as HTMLElement).closest<HTMLElement>('.moves-autocomplete-item')
  if (!item) return
  const slug = item.dataset.moveSlug
  if (slug) {
    toggleSelectedMove(slug)
  }
})

movesTagsEl?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const removeBtn = target.closest<HTMLButtonElement>('[data-remove-move]')
  if (removeBtn) {
    const slug = removeBtn.dataset.removeMove
    if (slug) toggleSelectedMove(slug)
    return
  }
  const clearAllBtn = target.closest<HTMLButtonElement>('[data-clear-all-moves]')
  if (clearAllBtn) {
    selectedMoves.clear()
    if (movesInputEl) movesInputEl.value = ''
    if (clearMovesInputBtn) clearMovesInputBtn.hidden = true
    closeMovesDropdown()
    renderSelectedMoveTags()
    updateActiveFilterBadge()
    applyFilters()
  }
})

document.addEventListener('click', (e) => {
  if (!movesFilterContainer?.contains(e.target as Node)) {
    closeMovesDropdown()
  }
})

gameFilterEl?.addEventListener('change', () => {
  selectedGame = gameFilterEl.value
  setSelectedGame(selectedGame)
  activeExclusivesMap = getExclusiveMapForGame(selectedGame)
  selectedExclusiveFilters = new Set(['all'])
  updateGameModeToggleUI()
  updateExclusiveToggleUI()
  updateVersionProgressUI()
  updateCapturedCounter()
  updateActiveFilterBadge()
  applyFilters()
})

gameModeToggleEl?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-game-mode]')
  if (!btn) return
  const mode = btn.dataset.gameMode as GameDexMode
  if (mode && mode !== selectedGameMode) {
    selectedGameMode = mode
    setGameDexMode(mode)
    updateGameModeToggleUI()
    updateVersionProgressUI()
    updateCapturedCounter()
    applyFilters()
  }
})

exclusiveToggleEl?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-exclusive-filter]')
  if (!btn) return
  const filter = btn.dataset.exclusiveFilter
  if (!filter) return

  const nonAllButtons = Array.from(
    exclusiveToggleEl.querySelectorAll<HTMLButtonElement>('[data-exclusive-filter]'),
  ).filter((b) => b.dataset.exclusiveFilter !== 'all')

  if (filter === 'all') {
    selectedExclusiveFilters = new Set(['all'])
  } else {
    selectedExclusiveFilters.delete('all')
    if (selectedExclusiveFilters.has(filter)) {
      selectedExclusiveFilters.delete(filter)
    } else {
      selectedExclusiveFilters.add(filter)
    }
    if (
      selectedExclusiveFilters.size === 0 ||
      selectedExclusiveFilters.size >= nonAllButtons.length
    ) {
      selectedExclusiveFilters = new Set(['all'])
    }
  }

  exclusiveToggleEl.querySelectorAll<HTMLButtonElement>('[data-exclusive-filter]').forEach((b) => {
    b.setAttribute('aria-pressed', String(selectedExclusiveFilters.has(b.dataset.exclusiveFilter!)))
  })
  updateVersionProgressUI()
  updateCapturedCounter()
  updateActiveFilterBadge()
  applyFilters()
})

versionProgressEl?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-version-pill]')
  const versionId = btn?.dataset.versionId
  if (!versionId) return

  // Reuse the existing exclusive-filter mechanism instead of inventing a
  // second "active version" concept — clicking a pill narrows the grid to
  // that version's pokemon, same as picking it in the exclusive toggle.
  selectedExclusiveFilters = new Set([versionId])
  updateExclusiveToggleUI()
  updateVersionProgressUI()
  updateCapturedCounter()
  updateActiveFilterBadge()
  applyFilters()
})

let isLoadingBatch = false
let infiniteScrollObserver: IntersectionObserver | null = null

async function handleLoadMore(): Promise<void> {
  if (isLoadingBatch) return
  const isFinished = allPokemonReady ? shown >= filtered.length : shown >= manifestTotal
  if (isFinished) return

  isLoadingBatch = true
  if (shown >= filtered.length && !allPokemonReady) {
    allPokemon = await getAllPokemon()
    allPokemonReady = true
    filtered = computeFiltered(allPokemon)
  }
  renderNextBatch()
  isLoadingBatch = false
}

function setupInfiniteScroll(): void {
  if (infiniteScrollObserver) {
    infiniteScrollObserver.disconnect()
  }

  if (!('IntersectionObserver' in window) || !loadMoreWrap) return

  infiniteScrollObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting) {
        handleLoadMore()
      }
    },
    {
      rootMargin: '350px 0px',
      threshold: 0.1,
    },
  )

  infiniteScrollObserver.observe(loadMoreWrap)
}

loadMoreBtn.addEventListener('click', () => {
  handleLoadMore()
})

window.addEventListener(CAPTURED_CHANGED_EVENT, (e) => {
  updateCapturedCounter()
  updateGenerationProgressUI()
  const detail = (e as CustomEvent<{ changedId?: number; captured?: boolean }>).detail
  if (detail && detail.changedId !== undefined) {
    if (!animatingIds.has(detail.changedId)) {
      syncCardCapturedState(detail.changedId, Boolean(detail.captured))
    }
  } else {
    // Bulk update (cloud sync / import / merge) — no single changedId.
    syncAllCardsCapturedState()
  }
})

window.addEventListener(CAPTURED_BY_GAME_CHANGED_EVENT, () => {
  updateVersionProgressUI()
  updateCapturedCounter()
  updateGenerationProgressUI()
})

window.addEventListener(GAME_CHANGED_EVENT, (e) => {
  const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? ''
  if (newGame !== selectedGame) {
    selectedGame = newGame
    if (gameFilterEl) gameFilterEl.value = newGame
    activeExclusivesMap = getExclusiveMapForGame(selectedGame)
    selectedExclusiveFilters = new Set(['all'])
    updateGameModeToggleUI()
    updateExclusiveToggleUI()
    updateVersionProgressUI()
    updateCapturedCounter()
    updateGenerationProgressUI()
    updateActiveFilterBadge()
    applyFilters()
  }
})

window.addEventListener(GAME_DEX_MODE_CHANGED_EVENT, (e) => {
  const newMode = (e as CustomEvent<{ mode: GameDexMode }>).detail?.mode ?? 'regional'
  if (newMode !== selectedGameMode) {
    selectedGameMode = newMode
    updateGameModeToggleUI()
    updateVersionProgressUI()
    updateCapturedCounter()
    updateGenerationProgressUI()
    applyFilters()
  }
})

window.addEventListener(DATA_RESET_EVENT, () => {
  updateGameModeToggleUI()
  updateExclusiveToggleUI()
  updateVersionProgressUI()
  updateCapturedCounter()
  lastGlobalPercentage = 0
  updateGenerationProgressUI()
  updateActiveFilterBadge()
  for (const card of grid.querySelectorAll<HTMLElement>('.pokemon-card')) {
    card.classList.remove('pokemon-card--captured')
    const btn = card.querySelector<HTMLButtonElement>('[data-capture-btn]')
    if (btn) {
      btn.setAttribute('aria-pressed', 'false')
      btn.title = 'Marcar como capturado'
    }
  }
})

// --- init ------------------------------------------------------------

async function init(): Promise<void> {
  const manifest = await getManifest()
  manifestTotal = manifest.totalCount

  let initialExpanded = false
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS_EXPANDED)
    if (saved !== null) {
      initialExpanded = saved === 'true'
    }
  } catch {
    // Ignore storage issues
  }
  updateFiltersCollapseUI(initialExpanded)
  updateActiveFilterBadge()

  let initialGenProgressExpanded = false
  try {
    initialGenProgressExpanded =
      sessionStorage.getItem(STORAGE_KEY_GEN_PROGRESS_EXPANDED) === 'true'
  } catch {
    // Ignore storage issues
  }
  updateGenerationProgressCollapseUI(initialGenProgressExpanded)

  filterToggleBtn?.addEventListener('click', toggleFilters)
  closeFiltersBtn?.addEventListener('click', () => {
    updateFiltersCollapseUI(false)
    try {
      sessionStorage.setItem(STORAGE_KEY_FILTERS_EXPANDED, 'false')
    } catch {
      // Ignore
    }
  })
  clearFiltersBtn?.addEventListener('click', clearAllFilters)

  try {
    gameDexData = await getGameDexData()
    for (const [gname, entry] of Object.entries(gameDexData)) {
      gameSpeciesSets.set(gname, {
        regional: new Set(entry.regional),
        obtainable: new Set(entry.obtainable),
      })
    }
  } catch (err) {
    console.warn('Could not load game dex data:', err)
  }

  activeExclusivesMap = getExclusiveMapForGame(selectedGame)
  updateGameModeToggleUI()
  updateExclusiveToggleUI()
  updateVersionProgressUI()
  updateCapturedCounter()

  if (selectedGame) {
    await applyFilters()
  } else {
    const chunk0 = await getChunk(0)
    filtered = chunk0
    renderNextBatch()
  }

  cardHoverTilt(grid)
  setupInfiniteScroll()
  const warmCache = () => {
    const onReady = (pokemon: Pokemon[]) => {
      allPokemon = pokemon
      allPokemonReady = true
      filtered = computeFiltered(allPokemon)
      updateMoveCountMap()
    }
    if ('requestIdleCallback' in window) {
      ;(window as Window).requestIdleCallback(() => getAllPokemon().then(onReady), {
        timeout: 3000,
      })
    } else {
      setTimeout(() => getAllPokemon().then(onReady), 1500)
    }
  }
  warmCache()
  getMoveDetailsMap().then((m) => {
    moveDetailsMap = m
  })
  getTypeChart().then((chart) => populateTypeChips(chart.types))
  getGenerations().then((gens) => {
    cachedGenerations = gens
    populateGenerationChips(gens)
    populateGameSelect(gens)
    updateGameModeToggleUI()
    updateExclusiveToggleUI()
    updateVersionProgressUI()
    updateCapturedCounter()
    updateGenerationProgressUI()
    updateActiveFilterBadge()
  })
}

init()
