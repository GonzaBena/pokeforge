import { getAllPokemon, getGameDexData, getGenerations } from '../lib/pokedexData'
import { getPokemonDetail } from '../lib/pokemonDetail'
import { getNuzlockeState, NUZLOCKE_CHANGED_EVENT, DATA_RESET_EVENT } from '../lib/storage'
import {
  createPlaythrough,
  registerEncounter,
  registerDeath,
  setActiveRun,
  setPlaythroughStatus,
  deletePlaythrough,
  setRules,
  computeProgress,
  getSortedDeaths,
  getSortedAreaEntries,
  getVersionOptionGroups,
  findVersionMeta,
  getAreaSuggestions,
} from '../lib/nuzlocke'
import { openPokemonModal } from '../lib/pokemonModal'
import { renderGraveyardCardHTML } from '../lib/graveyardCardExporter'
import { downloadTeamCardCanvas } from '../lib/teamCardExporter'
import { filterPokemonList } from '../lib/team/helpers'
import { toast } from '../lib/toast'
import { refreshIcons } from '../lib/icons'
import { getCurrentLocale, getTranslations } from '../lib/i18n/translations'
import type {
  GameDexData,
  NuzlockeOutcome,
  NuzlockePlaythrough,
  NuzlockeRules,
  NuzlockeStatus,
  Pokemon,
} from '../lib/types'

async function init(): Promise<void> {
  const rootEl = document.querySelector<HTMLElement>('[data-nuzlocke-root]')
  if (!rootEl) return

  const locale = getCurrentLocale()
  const t = getTranslations(locale).nuzlocke

  const [allPokemon, gameDexData, generations] = await Promise.all([
    getAllPokemon(),
    getGameDexData().catch(() => null as GameDexData | null),
    getGenerations().catch(() => []),
  ])
  const pokemonMap = new Map<number, Pokemon>(allPokemon.map((p) => [p.id, p]))
  const resolvedGameDex: GameDexData = gameDexData ?? {}
  const versionOptionGroups = getVersionOptionGroups(resolvedGameDex, generations, locale)

  const headerActionsEl = document.querySelector<HTMLElement>('[data-nuzlocke-header-actions]')!
  const runSelectEl = document.querySelector<HTMLSelectElement>('[data-run-select]')!
  const newRunBtn = document.querySelector<HTMLButtonElement>('[data-new-run-btn]')!

  const emptyStateEl = document.querySelector<HTMLElement>('[data-nuzlocke-empty-state]')!
  const newRunGameSelectEl = document.querySelector<HTMLSelectElement>('[data-new-run-game-select]')!
  const newRunSubmitBtn = document.querySelector<HTMLButtonElement>('[data-new-run-submit]')!

  const dashboardEl = document.querySelector<HTMLElement>('[data-nuzlocke-dashboard]')!
  const statsEl = document.querySelector<HTMLElement>('[data-nuzlocke-stats]')!
  const partySlotsEl = document.querySelector<HTMLElement>('[data-nuzlocke-party-slots]')!
  const areasListEl = document.querySelector<HTMLElement>('[data-nuzlocke-areas-list]')!
  const graveyardListEl = document.querySelector<HTMLElement>('[data-nuzlocke-graveyard-list]')!
  const graveyardCountBadgeEl = document.querySelector<HTMLElement>('[data-graveyard-count-badge]')!
  const statusSelectEl = document.querySelector<HTMLSelectElement>('[data-run-status-select]')!
  const deleteRunBtn = document.querySelector<HTMLButtonElement>('[data-delete-run-btn]')!
  const newEncounterBtn = document.querySelector<HTMLButtonElement>('[data-new-encounter-btn]')!
  const registerDeathBtn = document.querySelector<HTMLButtonElement>('[data-register-death-btn]')!
  const exportMemorialBtn = document.querySelector<HTMLButtonElement>('[data-export-memorial-btn]')!

  // Encounter modal elements
  const encounterOverlay = document.querySelector<HTMLElement>('[data-encounter-modal-overlay]')!
  const encounterCloseBtn = document.querySelector<HTMLButtonElement>('[data-encounter-modal-close]')!
  const encounterAreaInput = document.querySelector<HTMLInputElement>('[data-encounter-area-input]')!
  const encounterAreaOptions = document.querySelector<HTMLDataListElement>('[data-encounter-area-options]')!
  const encounterSearchInput = document.querySelector<HTMLInputElement>('[data-encounter-search]')!
  const encounterResultsEl = document.querySelector<HTMLElement>('[data-encounter-results]')!
  const encounterSelectedChipEl = document.querySelector<HTMLElement>('[data-encounter-selected-chip]')!
  const encounterOutcomeToggleEl = document.querySelector<HTMLElement>('[data-encounter-outcome-toggle]')!
  const encounterConfirmBtn = document.querySelector<HTMLButtonElement>('[data-encounter-confirm]')!

  // Death modal elements
  const deathOverlay = document.querySelector<HTMLElement>('[data-death-modal-overlay]')!
  const deathCloseBtn = document.querySelector<HTMLButtonElement>('[data-death-modal-close]')!
  const deathPokemonSelect = document.querySelector<HTMLSelectElement>('[data-death-pokemon-select]')!
  const deathLevelInput = document.querySelector<HTMLInputElement>('[data-death-level]')!
  const deathAreaInput = document.querySelector<HTMLInputElement>('[data-death-area]')!
  const deathCauseInput = document.querySelector<HTMLInputElement>('[data-death-cause]')!
  const deathDateInput = document.querySelector<HTMLInputElement>('[data-death-date]')!
  const deathConfirmBtn = document.querySelector<HTMLButtonElement>('[data-death-confirm]')!

  // Memorial modal elements
  const memorialOverlay = document.querySelector<HTMLElement>('[data-memorial-modal-overlay]')!
  const memorialCloseBtn = document.querySelector<HTMLButtonElement>('[data-memorial-modal-close]')!
  const memorialPreviewEl = document.querySelector<HTMLElement>('[data-memorial-preview]')!
  const downloadMemorialBtn = document.querySelector<HTMLButtonElement>('[data-download-memorial-png]')!

  function sprite(p: Pokemon): string {
    return p.sprites.officialArtwork ?? p.sprites.default ?? ''
  }

  function versionLabel(versionId: string): string {
    const meta = findVersionMeta(resolvedGameDex, versionId)
    if (!meta) return versionId
    return locale === 'es' ? meta.nameEs : meta.name
  }

  function populateGameSelect(selectEl: HTMLSelectElement): void {
    selectEl.innerHTML = versionOptionGroups
      .map(
        (group) => `
          <optgroup label="${group.genLabel}">
            ${group.options.map((opt) => `<option value="${opt.id}">${opt.label}</option>`).join('')}
          </optgroup>
        `,
      )
      .join('')
  }

  // --- Run switcher / empty state -----------------------------------------

  function showEmptyStateForm(): void {
    emptyStateEl.hidden = false
    dashboardEl.hidden = true
  }

  function renderHeaderAndRunSwitcher(state: ReturnType<typeof getNuzlockeState>): NuzlockePlaythrough | null {
    const playthroughs = Object.values(state.playthroughs)
    headerActionsEl.hidden = playthroughs.length === 0

    runSelectEl.innerHTML = playthroughs
      .map(
        (p) =>
          `<option value="${p.id}">${versionLabel(p.game)} — ${p.startedAt}</option>`,
      )
      .join('')
    if (state.activeRunId) runSelectEl.value = state.activeRunId

    return state.activeRunId ? (state.playthroughs[state.activeRunId] ?? null) : null
  }

  // --- Dashboard render ------------------------------------------------------

  function renderStats(playthrough: NuzlockePlaythrough): void {
    const progress = computeProgress(playthrough)
    statsEl.innerHTML = `
      <div class="nuzlocke-stat-tile">
        <div class="nuzlocke-stat-tile__value">${progress.areasVisited}</div>
        <div class="nuzlocke-stat-tile__label">${t.statAreas}</div>
      </div>
      <div class="nuzlocke-stat-tile">
        <div class="nuzlocke-stat-tile__value">${progress.captures}</div>
        <div class="nuzlocke-stat-tile__label">${t.statCaptures}</div>
      </div>
      <div class="nuzlocke-stat-tile">
        <div class="nuzlocke-stat-tile__value">${progress.deaths}</div>
        <div class="nuzlocke-stat-tile__label">${t.statDeaths}</div>
      </div>
      <div class="nuzlocke-stat-tile">
        <div class="nuzlocke-stat-tile__value">${progress.aliveInParty}</div>
        <div class="nuzlocke-stat-tile__label">${t.statAlive}</div>
      </div>
    `
  }

  function renderParty(playthrough: NuzlockePlaythrough): void {
    partySlotsEl.innerHTML = playthrough.party
      .map((pokemonId) => {
        if (pokemonId === null) {
          return `<div class="nuzlocke-party-slot nuzlocke-party-slot--empty">${t.partyEmptySlot}</div>`
        }
        const p = pokemonMap.get(pokemonId)
        if (!p) return ''
        return `
          <button class="nuzlocke-party-slot" type="button" data-open-detail="${pokemonId}">
            <img src="${sprite(p)}" alt="${p.name}" loading="lazy" />
            <span>${p.name}</span>
          </button>
        `
      })
      .join('')
  }

  function renderAreas(playthrough: NuzlockePlaythrough): void {
    const entries = getSortedAreaEntries(playthrough)
    if (entries.length === 0) {
      areasListEl.innerHTML = `<p class="nuzlocke-empty-hint">${t.areasEmpty}</p>`
      return
    }
    areasListEl.innerHTML = entries
      .map(([areaName, area]) => {
        const p = pokemonMap.get(area.pokemonId)
        const outcomeLabel = area.outcome === 'captured' ? t.outcomeCaptured : t.outcomeFainted
        return `
          <div class="nuzlocke-area-row">
            ${p ? `<img src="${sprite(p)}" alt="${p.name}" loading="lazy" data-open-detail="${p.id}" />` : ''}
            <span class="nuzlocke-area-row__name">${areaName}</span>
            <span class="nuzlocke-area-row__pokemon">${p?.name ?? ''}</span>
            <span class="nuzlocke-area-row__outcome nuzlocke-area-row__outcome--${area.outcome}">${outcomeLabel}</span>
          </div>
        `
      })
      .join('')
  }

  function renderGraveyard(playthrough: NuzlockePlaythrough): void {
    const deaths = getSortedDeaths(playthrough)
    graveyardCountBadgeEl.textContent = t.graveyardCount.replace('{count}', String(deaths.length))
    if (deaths.length === 0) {
      graveyardListEl.innerHTML = `<p class="nuzlocke-empty-hint">${t.graveyardEmpty}</p>`
      return
    }
    const dateFormatter = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    graveyardListEl.innerHTML = deaths
      .map((d) => {
        const p = pokemonMap.get(d.pokemonId)
        if (!p) return ''
        return `
          <div class="nuzlocke-death-row">
            <img src="${sprite(p)}" alt="${p.name}" loading="lazy" data-open-detail="${p.id}" />
            <div class="nuzlocke-death-row__info">
              <div class="nuzlocke-death-row__name">${p.name}</div>
              <div class="nuzlocke-death-row__meta">${d.atLevel !== null ? `Nv. ${d.atLevel} · ` : ''}${d.area}</div>
              <div class="nuzlocke-death-row__cause">${d.cause}</div>
            </div>
            <span class="nuzlocke-death-row__date">${dateFormatter.format(new Date(`${d.date}T00:00:00`))}</span>
          </div>
        `
      })
      .join('')
  }

  function renderRules(state: ReturnType<typeof getNuzlockeState>): void {
    for (const key of ['capLevelByGym', 'noHeal', 'noItems', 'shuffle'] as (keyof NuzlockeRules)[]) {
      const input = document.querySelector<HTMLInputElement>(`[data-rule="${key}"]`)
      if (input) input.checked = state.rules[key]
    }
  }

  function renderDashboard(playthrough: NuzlockePlaythrough): void {
    renderStats(playthrough)
    renderParty(playthrough)
    renderAreas(playthrough)
    renderGraveyard(playthrough)
    statusSelectEl.value = playthrough.status
  }

  function renderAll(): void {
    const state = getNuzlockeState()
    const playthrough = renderHeaderAndRunSwitcher(state)
    renderRules(state)
    if (!playthrough) {
      emptyStateEl.hidden = false
      dashboardEl.hidden = true
    } else {
      emptyStateEl.hidden = true
      dashboardEl.hidden = false
      renderDashboard(playthrough)
    }
    refreshIcons()
  }

  function getActivePlaythrough(): NuzlockePlaythrough | null {
    const state = getNuzlockeState()
    return state.activeRunId ? (state.playthroughs[state.activeRunId] ?? null) : null
  }

  // --- Party / area / graveyard row clicks open the detail modal -----------

  rootEl.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-open-detail]')
    if (!target) return
    const id = Number(target.dataset.openDetail)
    if (!isNaN(id)) openPokemonModal(id)
  })

  // --- New run flow --------------------------------------------------------

  populateGameSelect(newRunGameSelectEl)

  newRunBtn.addEventListener('click', showEmptyStateForm)

  newRunSubmitBtn.addEventListener('click', () => {
    const game = newRunGameSelectEl.value
    if (!game) return
    createPlaythrough(game)
  })

  runSelectEl.addEventListener('change', () => {
    setActiveRun(runSelectEl.value || null)
  })

  statusSelectEl.addEventListener('change', () => {
    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    setPlaythroughStatus(playthrough.id, statusSelectEl.value as NuzlockeStatus)
  })

  deleteRunBtn.addEventListener('click', () => {
    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    if (!window.confirm(t.deleteRunConfirm)) return
    deletePlaythrough(playthrough.id)
  })

  rootEl.querySelectorAll<HTMLInputElement>('[data-rule]').forEach((input) => {
    input.addEventListener('change', () => {
      const rule = input.dataset.rule as keyof NuzlockeRules
      setRules({ [rule]: input.checked } as Partial<NuzlockeRules>)
    })
  })

  // --- Encounter wizard ------------------------------------------------------

  let encounterSelectedPokemonId: number | null = null
  let encounterOutcome: NuzlockeOutcome | null = null

  function resetEncounterWizard(): void {
    encounterSelectedPokemonId = null
    encounterOutcome = null
    encounterAreaInput.value = ''
    encounterSearchInput.value = ''
    encounterResultsEl.innerHTML = ''
    encounterAreaOptions.innerHTML = ''
    encounterSelectedChipEl.hidden = true
    encounterSelectedChipEl.innerHTML = ''
    encounterOutcomeToggleEl.querySelectorAll<HTMLButtonElement>('[data-encounter-outcome]').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'false')
    })
    updateEncounterConfirmState()
  }

  function updateEncounterConfirmState(): void {
    encounterConfirmBtn.disabled = !(
      encounterSelectedPokemonId !== null &&
      encounterOutcome !== null &&
      encounterAreaInput.value.trim().length > 0
    )
  }

  function openEncounterModal(): void {
    resetEncounterWizard()
    encounterOverlay.hidden = false
    document.body.style.overflow = 'hidden'
    refreshIcons()
  }

  function closeEncounterModal(): void {
    encounterOverlay.hidden = true
    document.body.style.overflow = ''
  }

  newEncounterBtn.addEventListener('click', openEncounterModal)
  encounterCloseBtn.addEventListener('click', closeEncounterModal)
  encounterOverlay.addEventListener('click', (e) => {
    if (e.target === encounterOverlay) closeEncounterModal()
  })

  encounterSearchInput.addEventListener('input', () => {
    const query = encounterSearchInput.value.trim().toLowerCase()
    if (!query) {
      encounterResultsEl.innerHTML = ''
      return
    }
    const results = filterPokemonList(allPokemon, { search: query }).slice(0, 30)
    encounterResultsEl.innerHTML = results
      .map(
        (p) => `
          <button class="nuzlocke-encounter-result-item" type="button" data-pick-pokemon="${p.id}">
            <img src="${sprite(p)}" alt="${p.name}" loading="lazy" />
            <span>${p.name}</span>
          </button>
        `,
      )
      .join('')
  })

  encounterResultsEl.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pick-pokemon]')
    if (!btn) return
    const id = Number(btn.dataset.pickPokemon)
    const p = pokemonMap.get(id)
    if (!p) return

    encounterSelectedPokemonId = id
    encounterSelectedChipEl.hidden = false
    encounterSelectedChipEl.innerHTML = `<img src="${sprite(p)}" alt="${p.name}" /><span>${p.name}</span>`
    encounterResultsEl.innerHTML = ''
    encounterSearchInput.value = ''
    updateEncounterConfirmState()

    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    try {
      const detail = await getPokemonDetail(id)
      const meta = findVersionMeta(resolvedGameDex, playthrough.game)
      const suggestions = getAreaSuggestions(playthrough, detail.acquisitions, meta)
      encounterAreaOptions.innerHTML = suggestions.map((name) => `<option value="${name}"></option>`).join('')
    } catch {
      // area suggestions are a convenience; ignore failures
    }
  })

  encounterAreaInput.addEventListener('input', updateEncounterConfirmState)

  encounterOutcomeToggleEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-encounter-outcome]')
    if (!btn) return
    encounterOutcome = btn.dataset.encounterOutcome as NuzlockeOutcome
    encounterOutcomeToggleEl.querySelectorAll<HTMLButtonElement>('[data-encounter-outcome]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b === btn))
    })
    updateEncounterConfirmState()
  })

  encounterConfirmBtn.addEventListener('click', () => {
    const playthrough = getActivePlaythrough()
    if (!playthrough || encounterSelectedPokemonId === null || !encounterOutcome) return
    const { partyFull } = registerEncounter(
      playthrough.id,
      encounterAreaInput.value,
      encounterSelectedPokemonId,
      encounterOutcome,
    )
    if (partyFull) toast.info(t.partyFullWarning)
    closeEncounterModal()
  })

  // --- Death wizard ------------------------------------------------------

  function openDeathModal(): void {
    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    const aliveIds = playthrough.party.filter((id): id is number => id !== null)
    deathPokemonSelect.innerHTML = aliveIds
      .map((id) => {
        const p = pokemonMap.get(id)
        return p ? `<option value="${id}">${p.name}</option>` : ''
      })
      .join('')
    deathLevelInput.value = ''
    deathAreaInput.value = ''
    deathCauseInput.value = ''
    deathDateInput.value = new Date().toISOString().slice(0, 10)
    deathOverlay.hidden = false
    document.body.style.overflow = 'hidden'
    refreshIcons()
  }

  function closeDeathModal(): void {
    deathOverlay.hidden = true
    document.body.style.overflow = ''
  }

  registerDeathBtn.addEventListener('click', openDeathModal)
  deathCloseBtn.addEventListener('click', closeDeathModal)
  deathOverlay.addEventListener('click', (e) => {
    if (e.target === deathOverlay) closeDeathModal()
  })

  deathConfirmBtn.addEventListener('click', () => {
    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    const pokemonId = Number(deathPokemonSelect.value)
    if (!pokemonId) return
    const level = deathLevelInput.value ? parseInt(deathLevelInput.value, 10) : null
    registerDeath(playthrough.id, {
      pokemonId,
      atLevel: isNaN(level as number) ? null : level,
      area: deathAreaInput.value.trim(),
      cause: deathCauseInput.value.trim(),
      date: deathDateInput.value || new Date().toISOString().slice(0, 10),
    })
    closeDeathModal()
  })

  // --- Memorial export -------------------------------------------------------

  function openMemorialModal(): void {
    const playthrough = getActivePlaythrough()
    if (!playthrough) return
    const deaths = getSortedDeaths(playthrough)
    memorialPreviewEl.innerHTML = renderGraveyardCardHTML(playthrough, deaths, pokemonMap, locale)
    memorialOverlay.hidden = false
    document.body.style.overflow = 'hidden'
    refreshIcons()
  }

  function closeMemorialModal(): void {
    memorialOverlay.hidden = true
    document.body.style.overflow = ''
  }

  exportMemorialBtn.addEventListener('click', openMemorialModal)
  memorialCloseBtn.addEventListener('click', closeMemorialModal)
  memorialOverlay.addEventListener('click', (e) => {
    if (e.target === memorialOverlay) closeMemorialModal()
  })
  downloadMemorialBtn.addEventListener('click', () => {
    downloadTeamCardCanvas(memorialPreviewEl)
  })

  // --- Escape key closes whichever wizard modal is open -----------------

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (!encounterOverlay.hidden) closeEncounterModal()
    else if (!deathOverlay.hidden) closeDeathModal()
    else if (!memorialOverlay.hidden) closeMemorialModal()
  })

  // --- Storage events --------------------------------------------------------

  window.addEventListener(NUZLOCKE_CHANGED_EVENT, renderAll)
  window.addEventListener(DATA_RESET_EVENT, renderAll)

  renderAll()
}

init()
