import { getAllPokemon, getGenerations, getMoveDetailsMap, getMoveIndex, getTypeChart, getGameDexData } from "../lib/pokedexData";
import { getPokemonDetail } from "../lib/pokemonDetail";
import {
  getTeam,
  setTeam,
  setTeamSlot,
  setTeamSlotMove,
  getSelectedGame,
  setSelectedGame,
  getGameDexMode,
  setGameDexMode,
  GAME_CHANGED_EVENT,
  GAME_DEX_MODE_CHANGED_EVENT,
  TEAM_CHANGED_EVENT,
  DATA_RESET_EVENT,
} from "../lib/storage";
import { computeTeamDefense, splitWeaknessesAndResistances, type TeamDefenseEntry } from "../lib/typeChart";
import { badgeBounceIn, barsAnimateIn, slotPopIn, teamSizeTransition } from "../lib/animations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import { openPokemonModal } from "../lib/pokemonModal";
import { renderTeamCardHTML, downloadTeamCardCanvas, generateShowdownText } from "../lib/teamCardExporter";
import { getCurrentLocale, getTranslations, getTypeName, getGameTitle, getRegionName, type Locale } from "../lib/i18n/translations";
import type { GameDexData, GameDexMode, GameVersionMeta, GenerationInfo, MoveData, MoveDetail, Pokemon, TeamState, TypeChart } from "../lib/types";

const sizeSelectorEl = document.querySelector<HTMLElement>("[data-team-size-selector]");
const slotsEl = document.querySelector<HTMLElement>("[data-team-slots]")!;
const panelEmptyEl = document.querySelector<HTMLElement>("[data-panel-empty]")!;
const panelContentEl = document.querySelector<HTMLElement>("[data-panel-content]")!;
const weaknessesListEl = document.querySelector<HTMLElement>("[data-weaknesses-list]")!;
const resistancesListEl = document.querySelector<HTMLElement>("[data-resistances-list]")!;
const immunitiesListEl = document.querySelector<HTMLElement>("[data-immunities-list]");

const overlayEl = document.querySelector<HTMLElement>("[data-picker-overlay]")!;
const pickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-picker-close]")!;
const pickerResultsEl = document.querySelector<HTMLElement>("[data-picker-results]")!;
const pickerSearchEl = document.querySelector<HTMLInputElement>("[data-picker-search]")!;
const pickerTypeFilterEl = document.querySelector<HTMLElement>("[data-picker-type-filter]")!;
const pickerGenFilterEl = document.querySelector<HTMLElement>("[data-picker-generation-filter]")!;
const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
const pickerGameModeToggleEl = document.querySelector<HTMLElement>("[data-picker-game-mode-toggle]");
const pickerExclusiveToggleEl = document.querySelector<HTMLElement>("[data-picker-exclusive-toggle]");
const pickerMoveFilterEl = document.querySelector<HTMLInputElement>("[data-picker-move-filter]")!;
const pickerMoveOptionsEl = document.querySelector<HTMLElement>("[data-picker-move-options]")!;

const movePickerOverlayEl = document.querySelector<HTMLElement>("[data-move-picker-overlay]")!;
const movePickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-move-picker-close]")!;
const movePickerSearchEl = document.querySelector<HTMLInputElement>("[data-move-picker-search]")!;
const movePickerResultsEl = document.querySelector<HTMLElement>("[data-move-picker-results]")!;
const movePickerTitleEl = document.querySelector<HTMLElement>("[data-move-picker-title]")!;
const moveMethodFilterEl = document.querySelector<HTMLElement>("[data-move-method-filter]");
const moveCategoryFilterEl = document.querySelector<HTMLElement>("[data-move-category-filter]");
const moveTypeFilterEl = document.querySelector<HTMLElement>("[data-move-type-filter]");

let team: TeamState = { size: 5, slots: [] };
let allPokemon: Pokemon[] = [];
let pokemonById = new Map<number, Pokemon>();
let typeChart: TypeChart | null = null;
let generations: GenerationInfo[] = [];
let moveIndex: string[] = [];
let moveDetailsMap: Record<string, MoveData> = {};
const gameToGenMap = new Map<string, GenerationInfo>();

let activeSlotIndex: number | null = null;
let activeMoveSlotIndex: number | null = null;
let activeMoveIndex: number | null = null;
let activeMethodFilter: string = "all";
let activeCategoryFilter: string = "all";
let activeMoveTypeFilter: string = "all";

interface MovePickerRow {
  name: string;
  method: string;
  methodLabel: string;
  level: number;
}

let currentMoveRows: MovePickerRow[] = [];

let gameDexData: GameDexData | null = null;
const gameSpeciesSets = new Map<string, { regional: Set<number>; obtainable: Set<number> }>();

const pickerState = {
  search: "",
  types: new Set<string>(),
  generations: new Set<string>(),
  move: "",
  game: "",
  dexMode: getGameDexMode(),
  exclusive: "all",
};

const METHOD_LABELS: Record<Locale, Record<string, string>> = {
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(cat: string, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);
  if (cat === "physical") return t.team.physical;
  if (cat === "special") return t.team.special;
  if (cat === "status") return t.team.status;
  return cat;
}

// Mirrors src/components/TeamSlot.astro — keep both in sync when the markup changes.
function renderSlotHTML(index: number, pokemon: Pokemon | null): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  if (!pokemon) {
    return `
      <div class="team-slot-column" data-slot-column="${index}">
        <div class="team-slot" data-team-slot data-slot-index="${index}">
          <i data-lucide="plus-circle"></i>
          <span>${t.team.choosePokemon}</span>
        </div>
      </div>
    `;
  }

  const slotData = team.slots[index];
  const slotMoves = Array.from({ length: 4 }, (_, i) => slotData?.moves?.[i] ?? null);

  const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const typesHtml = pokemon.types
    .map((type) => `<span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>`)
    .join("");

  const movesHtml = slotMoves
    .map((moveName, mIdx) => {
      if (!moveName) {
        return `
          <button class="move-slot-btn empty" type="button" data-select-move data-slot-index="${index}" data-move-index="${mIdx}">
            <i data-lucide="plus"></i> <span>${locale === "es" ? `Ataque ${mIdx + 1}` : `Move ${mIdx + 1}`}</span>
          </button>
        `;
      }

      const meta = moveDetailsMap[moveName];
      const typeBadgeHtml = meta
        ? `<span class="type-badge type-badge--sm" data-type="${meta.type}" style="--badge-bg:${typeColor(meta.type)}">${getTypeName(meta.type, locale)}</span>`
        : "";
      const categoryBadgeHtml = meta
        ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category, locale)}</span>`
        : "";
      const powerText = meta?.power !== null && meta?.power !== undefined ? meta.power : "-";
      const ppText = meta?.pp !== null && meta?.pp !== undefined ? meta.pp : "-";

      return `
        <div class="move-slot-card filled">
          <div class="move-slot-card__top">
            <button class="move-slot-card__name-btn" type="button" data-select-move data-slot-index="${index}" data-move-index="${mIdx}">
              <i data-lucide="swords"></i>
              <span class="move-slot-card__title">${formatLabel(moveName)}</span>
            </button>
            <button class="move-slot-card__clear" type="button" data-clear-move data-slot-index="${index}" data-move-index="${mIdx}" aria-label="${locale === "es" ? "Quitar movimiento" : "Remove move"}">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="move-slot-card__meta">
            ${typeBadgeHtml}
            ${categoryBadgeHtml}
            <span class="move-stat-pill" title="${locale === "es" ? "Potencia" : "Power"}"><span class="move-stat-label">${locale === "es" ? "POT" : "PWR"}</span> ${powerText}</span>
            <span class="move-stat-pill" title="${locale === "es" ? "Puntos de Poder" : "Power Points"}"><span class="move-stat-label">PP</span> ${ppText}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="team-slot-column" data-slot-column="${index}">
      <div class="team-slot filled" data-team-slot data-slot-index="${index}">
        <button class="team-slot__remove-btn" type="button" data-remove-slot data-slot-index="${index}" aria-label="${locale === "es" ? "Quitar Pokémon" : "Remove Pokémon"}">
          <i data-lucide="x"></i>
        </button>
        <div class="team-slot__card-content">
          <div class="team-slot__sprite-col">
            <img class="team-slot__sprite" src="${sprite}" alt="${pokemon.name}" loading="lazy" />
          </div>
          <div class="team-slot__info-col">
            <span class="team-slot__id">${dexNumber(pokemon.id)}</span>
            <div class="team-slot__name">${pokemon.name}</div>
            <div class="pokemon-card__types">${typesHtml}</div>
          </div>
        </div>
      </div>

      <div class="team-slot-moves">
        <span class="team-slot-moves__title">${locale === "es" ? "Ataques" : "Moves"}</span>
        <div class="team-slot-moves__list">
          ${movesHtml}
        </div>
      </div>
    </div>
  `;
}

function pokemonForSlot(index: number): Pokemon | null {
  const id = team.slots[index]?.pokemonId ?? null;
  return id !== null ? pokemonById.get(id) ?? null : null;
}

function renderSizeSelector(): void {
  sizeSelectorEl?.querySelectorAll<HTMLButtonElement>("[data-size]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.size) === team.size));
  });
}

function renderAllSlots(): void {
  slotsEl.innerHTML = team.slots.map((_, i) => renderSlotHTML(i, pokemonForSlot(i))).join("");
  refreshIcons();
}

function renderSingleSlot(index: number, animatePop = false): void {
  const oldEl = slotsEl.querySelector<HTMLElement>(`[data-slot-column="${index}"]`) ?? slotsEl.querySelector<HTMLElement>(`[data-slot-index="${index}"]`);
  const template = document.createElement("template");
  template.innerHTML = renderSlotHTML(index, pokemonForSlot(index));
  const newEl = template.content.firstElementChild as HTMLElement;

  if (oldEl) oldEl.replaceWith(newEl);
  else slotsEl.appendChild(newEl);
  refreshIcons();

  if (animatePop) {
    const cardEl = newEl.querySelector<HTMLElement>(".team-slot");
    if (cardEl) slotPopIn(cardEl);
    const badges = newEl.querySelectorAll(".type-badge");
    if (badges.length) badgeBounceIn(badges);
  }
}

function changeTeamSize(newSize: number): void {
  if (newSize === team.size) return;
  const oldSize = team.size;

  if (newSize < oldSize) {
    const losing = team.slots.slice(newSize).filter((s) => s.pokemonId !== null);
    const removedEls = Array.from(slotsEl.children).slice(newSize) as HTMLElement[];

    team = setTeam({ size: newSize, slots: team.slots.slice(0, newSize) });
    renderSizeSelector();

    if (losing.length) {
      const locale = getCurrentLocale();
      toast.info(
        locale === "es"
          ? `Se ${losing.length === 1 ? "quitó" : "quitaron"} ${losing.length} Pokémon del equipo al reducir el tamaño.`
          : `${losing.length} Pokémon ${losing.length === 1 ? "was" : "were"} removed from the team due to size reduction.`
      );
    }

    teamSizeTransition({
      removed: removedEls,
      onRemoved: () => removedEls.forEach((el) => el.remove()),
    });
  } else {
    const newSlots = Array.from({ length: newSize }, (_, i) => team.slots[i] ?? { pokemonId: null });
    team = setTeam({ size: newSize, slots: newSlots });
    renderSizeSelector();

    const template = document.createElement("template");
    template.innerHTML = Array.from({ length: newSize - oldSize }, (_, i) => renderSlotHTML(oldSize + i, null)).join("");
    const addedEls = Array.from(template.content.children) as HTMLElement[];
    slotsEl.append(...addedEls);
    refreshIcons();
    teamSizeTransition({ added: addedEls });
  }

  renderStrengthsPanel();
}

function renderBarHTML(entry: TeamDefenseEntry): string {
  const locale = getCurrentLocale();
  const isWeakness = entry.averageMultiplier > 1;
  const isImmunity = entry.averageMultiplier <= 0.001;

  const pct = isImmunity
    ? 100
    : isWeakness
      ? Math.min(100, Math.max(15, (entry.averageMultiplier / 4) * 100))
      : Math.min(100, Math.max(15, (1 - entry.averageMultiplier) * 100));

  return `
    <div class="type-bar">
      <span class="type-bar__type">${getTypeName(entry.type, locale)}</span>
      <div class="type-bar__track">
        <div class="type-bar__fill" data-target-width="${pct}%" style="--badge-bg:${typeColor(entry.type)}"></div>
      </div>
      <span class="type-bar__value">${entry.averageMultiplier.toFixed(2)}x</span>
    </div>
  `;
}

function renderStrengthsPanel(): void {
  const locale = getCurrentLocale();
  const activePokemon = team.slots
    .map((s) => (s.pokemonId !== null ? pokemonById.get(s.pokemonId) ?? null : null))
    .filter((p): p is Pokemon => p !== null);

  if (!activePokemon.length || !typeChart) {
    panelEmptyEl.hidden = false;
    panelContentEl.hidden = true;
    return;
  }

  panelEmptyEl.hidden = true;
  panelContentEl.hidden = false;

  const defense = computeTeamDefense(typeChart, activePokemon);
  const { weaknesses, resistances, immunities } = splitWeaknessesAndResistances(defense);

  weaknessesListEl.innerHTML = weaknesses.length
    ? weaknesses.map(renderBarHTML).join("")
    : `<p class="side-panel__empty">${locale === "es" ? "Sin debilidades destacadas." : "No significant weaknesses."}</p>`;

  resistancesListEl.innerHTML = resistances.length
    ? resistances.map(renderBarHTML).join("")
    : `<p class="side-panel__empty">${locale === "es" ? "Sin resistencias destacadas." : "No significant resistances."}</p>`;

  if (immunitiesListEl) {
    immunitiesListEl.innerHTML = immunities.length
      ? immunities.map(renderBarHTML).join("")
      : `<p class="side-panel__empty">${locale === "es" ? "Sin inmunidades." : "No immunities."}</p>`;
  }

  const fills = panelContentEl.querySelectorAll<HTMLElement>(".type-bar__fill");
  barsAnimateIn(fills);
}

// --- pokemon picker --------------------------------------------------

function getPickerExclusiveMap(): Map<number, GameVersionMeta> {
  const map = new Map<number, GameVersionMeta>();
  if (!pickerState.game || !gameDexData || !gameDexData[pickerState.game]) return map;
  const entry = gameDexData[pickerState.game];
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

function updatePickerExclusiveToggleUI(): void {
  if (!pickerExclusiveToggleEl) return;
  const entry = pickerState.game && gameDexData ? gameDexData[pickerState.game] : null;
  const hasExclusives = Boolean(entry?.versions && entry.versions.length === 2 && entry.exclusives && Object.keys(entry.exclusives).length > 0);

  if (!hasExclusives) {
    pickerExclusiveToggleEl.hidden = true;
    pickerExclusiveToggleEl.innerHTML = "";
    pickerState.exclusive = "all";
    return;
  }

  pickerExclusiveToggleEl.hidden = false;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const [vA, vB] = entry!.versions!;
  const nameA = locale === "es" ? vA.nameEs : vA.name;
  const nameB = locale === "es" ? vB.nameEs : vB.name;

  pickerExclusiveToggleEl.innerHTML = `
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="all" aria-pressed="${String(pickerState.exclusive === "all")}">
      ${t.pokedex.exclusiveAll}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vA.id}" aria-pressed="${String(pickerState.exclusive === vA.id)}" style="--btn-color:${vA.color};">
      <span class="exclusive-dot" style="--btn-color:${vA.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameA)}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vB.id}" aria-pressed="${String(pickerState.exclusive === vB.id)}" style="--btn-color:${vB.color};">
      <span class="exclusive-dot" style="--btn-color:${vB.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameB)}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="both" aria-pressed="${String(pickerState.exclusive === "both")}">
      ${t.pokedex.exclusiveBoth}
    </button>
  `;
}

function computePickerFiltered(): Pokemon[] {
  const gameSpeciesSet = pickerState.game && gameSpeciesSets.has(pickerState.game)
    ? (pickerState.dexMode === "obtainable" ? gameSpeciesSets.get(pickerState.game)!.obtainable : gameSpeciesSets.get(pickerState.game)!.regional)
    : null;

  const exclusivesMap = getPickerExclusiveMap();

  return allPokemon.filter((p) => {
    if (pickerState.search && !p.name.includes(pickerState.search) && !String(p.id).includes(pickerState.search)) return false;
    if (pickerState.types.size && !p.types.some((t) => pickerState.types.has(t))) return false;
    if (pickerState.generations.size && !pickerState.generations.has(p.generation)) return false;
    if (pickerState.move && !p.moves.includes(pickerState.move)) return false;
    if (gameSpeciesSet && !gameSpeciesSet.has(p.id)) return false;

    if (pickerState.exclusive !== "all" && exclusivesMap.size > 0) {
      if (pickerState.exclusive === "both") {
        if (exclusivesMap.has(p.id)) return false;
      } else {
        const meta = exclusivesMap.get(p.id);
        if (!meta || meta.id !== pickerState.exclusive) return false;
      }
    }

    return true;
  });
}

function updatePickerGameModeToggleUI(): void {
  if (!pickerGameModeToggleEl) return;
  if (!pickerState.game) {
    pickerGameModeToggleEl.hidden = true;
    return;
  }
  pickerGameModeToggleEl.hidden = false;
  pickerGameModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-game-mode]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.pickerGameMode === pickerState.dexMode));
  });
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

function renderPickerResults(): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const results = computePickerFiltered();
  const exclusivesMap = getPickerExclusiveMap();
  const countEl = overlayEl.querySelector<HTMLElement>("[data-picker-count]");
  if (countEl) {
    countEl.textContent = `${results.length} Pokémon`;
  }

  if (!results.length) {
    pickerResultsEl.innerHTML = `<p class="pokedex-empty">${t.pokedex.empty}</p>`;
    return;
  }
  pickerResultsEl.innerHTML = results
    .map((p) => {
      let dotHtml = "";
      if (exclusivesMap.has(p.id)) {
        const meta = exclusivesMap.get(p.id)!;
        const vName = locale === "es" ? meta.nameEs : meta.name;
        const badgeTitle = t.pokedex.exclusiveBadge.replace("{version}", vName);
        dotHtml = `<span class="picker-item__exclusive-dot" style="--version-color:${meta.color};" title="${badgeTitle}"></span>`;
      }
      return `
      <button class="picker-item" type="button" data-picker-pick data-pokemon-id="${p.id}">
        <span class="picker-item__id">${dexNumber(p.id)}</span>
        <img src="${p.sprites.officialArtwork ?? p.sprites.default ?? ""}" alt="${p.name}" loading="lazy" />
        <span class="picker-item__name">${p.name}${dotHtml}</span>
      </button>
    `;
    })
    .join("");
}

function openPicker(index: number): void {
  activeSlotIndex = index;
  overlayEl.hidden = false;
  pickerState.search = "";
  pickerState.types.clear();
  pickerState.generations.clear();
  pickerState.move = "";
  pickerState.game = getSelectedGame();
  pickerState.dexMode = getGameDexMode();
  pickerState.exclusive = "all";
  pickerSearchEl.value = "";
  pickerMoveFilterEl.value = "";
  if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
  updatePickerGameModeToggleUI();
  updatePickerExclusiveToggleUI();
  pickerTypeFilterEl.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  pickerGenFilterEl.querySelectorAll("[data-generation]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  renderPickerResults();
  pickerSearchEl.focus();
}

function closePicker(): void {
  overlayEl.hidden = true;
  activeSlotIndex = null;
}

function populatePickerFilters(): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const typeChips = typeChart!.types
    .map(
      (type) =>
        `<button class="filter-chip" type="button" data-type="${type}" aria-pressed="false" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</button>`,
    )
    .join("");

  pickerTypeFilterEl.innerHTML = `<div class="filter-group__row">${typeChips}</div>`;

  const genChips = generations
    .map((g) => {
      const label = g.displayName.replace(/^(Generación|Generation)\s*/i, "");
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="false">${label}</button>`;
    })
    .join("");

  pickerGenFilterEl.innerHTML = `<div class="filter-group__row">${genChips}</div>`;
  pickerMoveOptionsEl.innerHTML = moveIndex.map((m) => `<option value="${m}"></option>`).join("");

  if (pickerGameFilterEl) {
    gameToGenMap.clear();
    let html = `<option value="">${t.pokedex.allGames}</option>`;
    for (const g of generations) {
      const regionName = g.region ? getRegionName(g.region, locale) : "";
      const regionLabel = regionName ? ` (${regionName})` : "";
      const genName = locale === "es" ? g.displayName : g.displayName.replace("Generación", "Generation");
      html += `<optgroup label="${genName}${regionLabel}">`;
      for (const vg of g.versionGroups) {
        gameToGenMap.set(vg.name, g);
        const title = getGameTitle(vg.name, locale, vg.displayName);
        html += `<option value="${vg.name}">${title}</option>`;
      }
      html += `</optgroup>`;
    }
    pickerGameFilterEl.innerHTML = html;
  }

  if (moveTypeFilterEl && typeChart) {
    const allBtn = `<button class="filter-chip" type="button" data-move-type="all" aria-pressed="true">${locale === "es" ? "Todos" : "All"}</button>`;
    const typeBtns = typeChart.types
      .map(
        (type) =>
          `<button class="filter-chip" type="button" data-move-type="${type}" aria-pressed="false" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</button>`,
      )
      .join("");
    moveTypeFilterEl.innerHTML = allBtn + typeBtns;
  }
}

// --- move picker modal (table view) ----------------------------------

async function openMovePicker(slotIndex: number, moveIndex: number): Promise<void> {
  const slot = team.slots[slotIndex];
  if (!slot || slot.pokemonId === null) return;
  const pokemon = pokemonById.get(slot.pokemonId);
  if (!pokemon) return;

  activeMoveSlotIndex = slotIndex;
  activeMoveIndex = moveIndex;
  activeMethodFilter = "all";
  activeCategoryFilter = "all";
  activeMoveTypeFilter = "all";

  const locale = getCurrentLocale();
  if (movePickerTitleEl) {
    movePickerTitleEl.textContent = locale === "es" ? `Ataque ${moveIndex + 1} - ${capitalize(pokemon.name)}` : `Move ${moveIndex + 1} - ${capitalize(pokemon.name)}`;
  }
  movePickerSearchEl.value = "";
  movePickerOverlayEl.hidden = false;

  const methodChips = moveMethodFilterEl?.querySelectorAll<HTMLButtonElement>("[data-method]");
  methodChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.method === "all")));

  const categoryChips = moveCategoryFilterEl?.querySelectorAll<HTMLButtonElement>("[data-category]");
  categoryChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.category === "all")));

  const typeChips = moveTypeFilterEl?.querySelectorAll<HTMLButtonElement>("[data-move-type]");
  typeChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.moveType === "all")));

  movePickerResultsEl.innerHTML = `<div class="pokedex-loading"><i data-lucide="loader-2" class="spin"></i> ${locale === "es" ? `Cargando movimientos de ${capitalize(pokemon.name)}...` : `Loading moves for ${capitalize(pokemon.name)}...`}</div>`;
  refreshIcons();

  const detail = await getPokemonDetail(pokemon.id);
  if (activeMoveSlotIndex !== slotIndex || activeMoveIndex !== moveIndex) return;

  const rawDetails: MoveDetail[] = detail.moveDetails && detail.moveDetails.length
    ? detail.moveDetails
    : pokemon.moves.map((m) => ({ name: m, method: "level-up", level: 0 }));

  const methodMap = METHOD_LABELS[locale] ?? METHOD_LABELS.en;
  currentMoveRows = rawDetails.map((m) => ({
    name: m.name,
    method: m.method === "train" ? "tutor" : m.method,
    methodLabel: methodMap[m.method] ?? formatLabel(m.method),
    level: m.level,
  }));

  renderMovePickerTable();
  movePickerSearchEl.focus();
}

function closeMovePicker(): void {
  movePickerOverlayEl.hidden = true;
  activeMoveSlotIndex = null;
  activeMoveIndex = null;
  currentMoveRows = [];
}

function renderMovePickerTable(): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const search = movePickerSearchEl.value.trim().toLowerCase();

  const filtered = currentMoveRows.filter((r) => {
    // 1. Method filter
    if (activeMethodFilter !== "all") {
      if (activeMethodFilter === "tutor" && r.method !== "tutor" && r.method !== "train") return false;
      if (activeMethodFilter === "machine" && r.method !== "machine" && r.method !== "TM" && r.method !== "HM") return false;
      if (activeMethodFilter !== "tutor" && activeMethodFilter !== "machine" && r.method !== activeMethodFilter) return false;
    }

    const meta = moveDetailsMap[r.name];

    // 2. Category filter
    if (activeCategoryFilter !== "all") {
      if (!meta || meta.category !== activeCategoryFilter) return false;
    }

    // 3. Move Type filter (single selection)
    if (activeMoveTypeFilter !== "all") {
      if (!meta || meta.type !== activeMoveTypeFilter) return false;
    }

    // 4. Search query filter
    if (search && !r.name.toLowerCase().includes(search) && !formatLabel(r.name).toLowerCase().includes(search)) {
      return false;
    }

    return true;
  });

  const countEl = document.querySelector<HTMLElement>("[data-move-picker-count]");
  if (countEl) {
    countEl.textContent = `${filtered.length} ${locale === "es" ? "ataques" : "moves"}`;
  }

  if (!filtered.length) {
    movePickerResultsEl.innerHTML = `<p class="pokedex-empty">${locale === "es" ? "No se encontraron movimientos con los filtros seleccionados." : "No moves found matching the selected filters."}</p>`;
    return;
  }

  const rowsHtml = filtered
    .map((r) => {
      const meta = moveDetailsMap[r.name];
      const typeBadgeHtml = meta ? `<span class="type-badge type-badge--sm" data-type="${meta.type}" style="--badge-bg:${typeColor(meta.type)}">${getTypeName(meta.type, locale)}</span>` : "-";
      const categoryBadgeHtml = meta ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category, locale)}</span>` : "-";
      const powerText = meta?.power !== null && meta?.power !== undefined ? meta.power : "-";
      const ppText = meta?.pp !== null && meta?.pp !== undefined ? meta.pp : "-";
      const accuracyText = meta?.accuracy !== null && meta?.accuracy !== undefined ? `${meta.accuracy}%` : "-";
      const levelText = r.method === "level-up" ? `${locale === "es" ? "Nv." : "Lv."} ${r.level}` : "-";
      const methodBadgeClass = `move-method-badge move-method-badge--${r.method}`;

      return `
        <tr>
          <td class="move-table__cell-name" data-label="${t.modal.move}">
            <span class="move-table__name">${formatLabel(r.name)}</span>
          </td>
          <td class="move-table__cell-type" data-label="${locale === "es" ? "Tipo" : "Type"}">${typeBadgeHtml}</td>
          <td class="move-table__cell-category" data-label="${locale === "es" ? "Categoría" : "Category"}">${categoryBadgeHtml}</td>
          <td class="move-table__cell-stat" data-label="${locale === "es" ? "POT" : "PWR"}">${powerText}</td>
          <td class="move-table__cell-stat" data-label="PP">${ppText}</td>
          <td class="move-table__cell-stat" data-label="${locale === "es" ? "Prec." : "Acc."}">${accuracyText}</td>
          <td class="move-table__cell-method" data-label="${t.modal.method}">
            <span class="${methodBadgeClass}">${r.methodLabel}</span>
          </td>
          <td class="move-table__cell-level" data-label="${t.modal.level}">${levelText}</td>
          <td class="move-table__cell-action" data-label="${locale === "es" ? "Acción" : "Action"}">
            <button class="btn btn--sm btn--primary" type="button" data-pick-move="${r.name}">
              ${locale === "es" ? "Elegir" : "Choose"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  movePickerResultsEl.innerHTML = `
    <div class="move-table-wrapper">
      <div class="table-scroll-hint" aria-hidden="true">
        <span>${locale === "es" ? "← Deslizá horizontalmente para ver todos los detalles →" : "← Scroll horizontally to see all details →"}</span>
      </div>
      <div class="move-table-container">
        <table class="move-table">
          <thead>
            <tr>
              <th class="move-table__head-name">${t.modal.move}</th>
              <th>${locale === "es" ? "Tipo" : "Type"}</th>
              <th>${locale === "es" ? "Categoría" : "Category"}</th>
              <th>${locale === "es" ? "POT" : "PWR"}</th>
              <th>PP</th>
              <th>${locale === "es" ? "Prec." : "Acc."}</th>
              <th>${t.modal.method}</th>
              <th>${t.modal.level}</th>
              <th class="move-table__head-action" style="text-align: right;">${locale === "es" ? "Acción" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  refreshIcons();
}

// --- event wiring -----------------------------------------------------

sizeSelectorEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-size]");
  if (!btn) return;
  changeTeamSize(Number(btn.dataset.size));
});

slotsEl.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const clearMoveBtn = target.closest<HTMLButtonElement>("[data-clear-move]");
  if (clearMoveBtn) {
    e.stopPropagation();
    const sIdx = Number(clearMoveBtn.dataset.slotIndex);
    const mIdx = Number(clearMoveBtn.dataset.moveIndex);
    team = setTeamSlotMove(sIdx, mIdx, null);
    renderSingleSlot(sIdx);
    return;
  }

  const selectMoveBtn = target.closest<HTMLButtonElement>("[data-select-move]");
  if (selectMoveBtn) {
    e.stopPropagation();
    const sIdx = Number(selectMoveBtn.dataset.slotIndex);
    const mIdx = Number(selectMoveBtn.dataset.moveIndex);
    openMovePicker(sIdx, mIdx);
    return;
  }

  const removeBtn = target.closest<HTMLButtonElement>("[data-remove-slot]");
  if (removeBtn) {
    const idx = Number(removeBtn.dataset.slotIndex);
    team = setTeamSlot(idx, null);
    renderSingleSlot(idx);
    renderStrengthsPanel();
    return;
  }

  const slotEl = target.closest<HTMLElement>("[data-team-slot]");
  if (slotEl) {
    const idx = Number(slotEl.dataset.slotIndex);
    const slot = team.slots[idx];
    if (!slot || slot.pokemonId === null) {
      openPicker(idx);
    } else {
      openPokemonModal(slot.pokemonId);
    }
  }
});

pickerCloseBtn.addEventListener("click", closePicker);
overlayEl.addEventListener("click", (e) => {
  if (e.target === overlayEl) closePicker();
});

movePickerCloseBtn.addEventListener("click", closeMovePicker);
movePickerOverlayEl.addEventListener("click", (e) => {
  if (e.target === movePickerOverlayEl) closeMovePicker();
});

window.addEventListener(DATA_RESET_EVENT, () => {
  team = getTeam();
  for (let i = 0; i < team.slots.length; i++) {
    renderSingleSlot(i);
  }
  renderStrengthsPanel();
});

// Cloud sync / import can replace the team from outside this tab's own
// controls — re-render slots and size selector so it shows up without reload.
window.addEventListener(TEAM_CHANGED_EVENT, () => {
  team = getTeam();
  renderSizeSelector();
  renderAllSlots();
  renderStrengthsPanel();
});

const openTeamCardBtn = document.querySelector<HTMLButtonElement>("[data-open-team-card]");
const teamCardOverlay = document.querySelector<HTMLElement>("[data-team-card-overlay]");
const teamCardCloseBtn = document.querySelector<HTMLButtonElement>("[data-team-card-close]");
const teamCardPreview = document.querySelector<HTMLElement>("[data-team-card-preview]");
const downloadPngBtn = document.querySelector<HTMLButtonElement>("[data-download-card-png]");
const copyShowdownBtn = document.querySelector<HTMLButtonElement>("[data-copy-showdown]");

function openTeamCardModal(): void {
  if (!teamCardOverlay || !teamCardPreview) return;
  const pokemonMap = new Map(allPokemon.map((p) => [p.id, p]));
  teamCardPreview.innerHTML = renderTeamCardHTML(team, pokemonMap);
  refreshIcons();
  teamCardOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeTeamCardModal(): void {
  if (!teamCardOverlay) return;
  teamCardOverlay.hidden = true;
  document.body.style.overflow = "";
}

openTeamCardBtn?.addEventListener("click", openTeamCardModal);
teamCardCloseBtn?.addEventListener("click", closeTeamCardModal);
teamCardOverlay?.addEventListener("click", (e) => {
  if (e.target === teamCardOverlay) closeTeamCardModal();
});

downloadPngBtn?.addEventListener("click", () => {
  if (teamCardPreview) {
    downloadTeamCardCanvas(teamCardPreview);
  }
});

copyShowdownBtn?.addEventListener("click", () => {
  const pokemonMap = new Map(allPokemon.map((p) => [p.id, p]));
  const text = generateShowdownText(team, pokemonMap);
  const locale = getCurrentLocale();
  if (!text) {
    toast.info(locale === "es" ? "Tu equipo está vacío." : "Your team is empty.");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    toast.success(locale === "es" ? "¡Formato Showdown copiado al portapapeles!" : "Showdown format copied to clipboard!");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (teamCardOverlay && !teamCardOverlay.hidden) closeTeamCardModal();
    else if (!movePickerOverlayEl.hidden) closeMovePicker();
    else if (!overlayEl.hidden) closePicker();
  }
});

let pickerSearchDebounce: number | undefined;
pickerSearchEl.addEventListener("input", () => {
  window.clearTimeout(pickerSearchDebounce);
  pickerSearchDebounce = window.setTimeout(() => {
    pickerState.search = pickerSearchEl.value.trim().toLowerCase();
    renderPickerResults();
  }, 200);
});

movePickerSearchEl.addEventListener("input", renderMovePickerTable);

moveMethodFilterEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-method]");
  if (!btn) return;
  activeMethodFilter = btn.dataset.method!;
  moveMethodFilterEl.querySelectorAll<HTMLButtonElement>("[data-method]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
  renderMovePickerTable();
});

moveCategoryFilterEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-category]");
  if (!btn) return;
  activeCategoryFilter = btn.dataset.category!;
  moveCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
  renderMovePickerTable();
});

moveTypeFilterEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-move-type]");
  if (!btn) return;
  activeMoveTypeFilter = btn.dataset.moveType!;
  moveTypeFilterEl.querySelectorAll<HTMLButtonElement>("[data-move-type]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
  renderMovePickerTable();
});

movePickerResultsEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-pick-move]");
  if (!btn || activeMoveSlotIndex === null || activeMoveIndex === null) return;
  const moveName = btn.dataset.pickMove!;
  const pokemon = pokemonForSlot(activeMoveSlotIndex);

  team = setTeamSlotMove(activeMoveSlotIndex, activeMoveIndex, moveName);
  renderSingleSlot(activeMoveSlotIndex);
  closeMovePicker();
  if (pokemon) {
    const locale = getCurrentLocale();
    toast.success(
      locale === "es"
        ? `Ataque "${formatLabel(moveName)}" asignado a ${capitalize(pokemon.name)}.`
        : `Move "${formatLabel(moveName)}" assigned to ${capitalize(pokemon.name)}.`
    );
  }
});

pickerTypeFilterEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-type]");
  if (!btn) return;
  const t = btn.dataset.type!;
  const pressed = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", String(!pressed));
  if (pressed) pickerState.types.delete(t);
  else pickerState.types.add(t);
  renderPickerResults();
});

pickerGenFilterEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-generation]");
  if (!btn) return;
  const g = btn.dataset.generation!;
  const pressed = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", String(!pressed));
  if (pressed) pickerState.generations.delete(g);
  else pickerState.generations.add(g);
  renderPickerResults();
});

pickerMoveFilterEl.addEventListener("input", () => {
  pickerState.move = pickerMoveFilterEl.value.trim().toLowerCase();
  renderPickerResults();
});

pickerGameFilterEl?.addEventListener("change", () => {
  pickerState.game = pickerGameFilterEl.value;
  setSelectedGame(pickerState.game);
  pickerState.exclusive = "all";
  updatePickerGameModeToggleUI();
  updatePickerExclusiveToggleUI();
  renderPickerResults();
});

pickerGameModeToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-game-mode]");
  if (!btn) return;
  const mode = btn.dataset.pickerGameMode as GameDexMode;
  if (mode && mode !== pickerState.dexMode) {
    pickerState.dexMode = mode;
    setGameDexMode(mode);
    updatePickerGameModeToggleUI();
    renderPickerResults();
  }
});

pickerExclusiveToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-exclusive-filter]");
  if (!btn) return;
  const filter = btn.dataset.pickerExclusiveFilter!;
  if (filter && filter !== pickerState.exclusive) {
    pickerState.exclusive = filter;
    pickerExclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-exclusive-filter]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.pickerExclusiveFilter === pickerState.exclusive));
    });
    renderPickerResults();
  }
});

window.addEventListener(GAME_CHANGED_EVENT, (e) => {
  const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? "";
  if (newGame !== pickerState.game) {
    pickerState.game = newGame;
    if (pickerGameFilterEl) pickerGameFilterEl.value = newGame;
    pickerState.exclusive = "all";
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    if (!overlayEl.hidden) renderPickerResults();
  }
});

window.addEventListener(GAME_DEX_MODE_CHANGED_EVENT, (e) => {
  const newMode = (e as CustomEvent<{ mode: GameDexMode }>).detail?.mode ?? "regional";
  if (newMode !== pickerState.dexMode) {
    pickerState.dexMode = newMode;
    updatePickerGameModeToggleUI();
    if (!overlayEl.hidden) renderPickerResults();
  }
});

pickerResultsEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-pick]");
  if (!btn || activeSlotIndex === null) return;
  const id = Number(btn.dataset.pokemonId);
  const pokemon = pokemonById.get(id);

  team = setTeamSlot(activeSlotIndex, id);
  renderSingleSlot(activeSlotIndex, true);
  renderStrengthsPanel();
  if (pokemon) {
    const locale = getCurrentLocale();
    toast.success(
      locale === "es"
        ? `${capitalize(pokemon.name)} agregado al equipo.`
        : `${capitalize(pokemon.name)} added to the team.`
    );
  }
  closePicker();
});

// --- init ---------------------------------------------------------------

async function init(): Promise<void> {
  team = getTeam();
  renderSizeSelector();

  const [full, chart, gens, moves, moveDetails, gameDex] = await Promise.all([
    getAllPokemon(),
    getTypeChart(),
    getGenerations(),
    getMoveIndex(),
    getMoveDetailsMap(),
    getGameDexData().catch(() => null),
  ]);

  allPokemon = full;
  pokemonById = new Map(full.map((p) => [p.id, p]));
  typeChart = chart;
  generations = gens;
  moveIndex = moves;
  moveDetailsMap = moveDetails;

  if (gameDex) {
    gameDexData = gameDex;
    for (const [gname, entry] of Object.entries(gameDex)) {
      gameSpeciesSets.set(gname, {
        regional: new Set(entry.regional),
        obtainable: new Set(entry.obtainable),
      });
    }
  }

  populatePickerFilters();
  renderAllSlots();
  renderStrengthsPanel();
}

init();
