import { getAllPokemon, getGenerations, getMoveDetailsMap, getMoveIndex, getTypeChart, getGameDexData } from "../lib/pokedexData";
import { getPokemonDetail } from "../lib/pokemonDetail";
import {
  getTeam,
  setTeamSlot,
  setTeamSlotItem,
  setTeamSlotMove,
  swapTeamSlotMoves,
  swapTeamSlots,
  getSelectedGame,
  setSelectedGame,
  getGameDexMode,
  setGameDexMode,
  GAME_CHANGED_EVENT,
  GAME_DEX_MODE_CHANGED_EVENT,
  TEAM_CHANGED_EVENT,
  DATA_RESET_EVENT,
} from "../lib/storage";
import {
  computeTeamDefense,
  splitWeaknessesAndResistances,
  computeTeamOffense,
  getTypeMultiplier,
  type TeamDefenseEntry,
  type TeamOffenseEntry,
  type TeamOffenseSummary,
  type AttackSource,
  type TeamMember,
} from "../lib/typeChart";
import { badgeBounceIn, slotPopIn } from "../lib/animations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import { openPokemonModal } from "../lib/pokemonModal";
import { getDefaultAbility } from "../lib/pokemonModal/utils";
import { renderTeamCardHTML, downloadTeamCardCanvas, generateShowdownText } from "../lib/teamCardExporter";
import { getCurrentLocale, getNatureName, getTranslations, getTypeName, getGameTitle, getRegionName, getMoveName, type Locale } from "../lib/i18n/translations";
import { computeTeamSynergy } from "../lib/teamSynergy";
import { filterItems, getItemById, getItemDisplayName, renderItemIconHTML } from "../lib/items";
import type { GameDexData, GameDexMode, GameVersionMeta, GenerationInfo, MoveData, MoveDetail, Pokemon, TeamSlotState, TeamState, TypeChart } from "../lib/types";
const slotsEl = document.querySelector<HTMLElement>("[data-team-slots]")!;
const sidePanelEl = document.querySelector<HTMLElement>("[data-strengths-panel]");
const densitySwitchEl = document.querySelector<HTMLButtonElement>("[data-density-switch]");
const panelEmptyEl = document.querySelector<HTMLElement>("[data-panel-empty]")!;
const panelContentEl = document.querySelector<HTMLElement>("[data-panel-content]")!;
const panelTabToggleEl = document.querySelector<HTMLElement>("[data-panel-tab-toggle]");
const tabContentDefenseEl = document.querySelector<HTMLElement>("[data-tab-content-defense]");
const tabContentOffenseEl = document.querySelector<HTMLElement>("[data-tab-content-offense]");

const openSynergyBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-synergy]");
const synergyModalOverlay = document.querySelector<HTMLElement>("[data-synergy-modal-overlay]");
const synergyModalCloseBtn = document.querySelector<HTMLButtonElement>("[data-synergy-modal-close]");
const synergyModalContent = document.querySelector<HTMLElement>("[data-synergy-panel-content]");
const synergySidebarCalloutEl = document.querySelector<HTMLElement>("[data-synergy-sidebar-callout]");

const openPanelGuideBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-panel-guide]");
const strengthsGuideOverlay = document.querySelector<HTMLElement>("[data-strengths-guide-overlay]");
const strengthsGuideCloseBtn = document.querySelector<HTMLButtonElement>("[data-strengths-guide-close]");
const guideTabBtns = document.querySelectorAll<HTMLButtonElement>("[data-guide-tab]");
const guidePanes = document.querySelectorAll<HTMLElement>("[data-guide-pane]");

const defenseKpisEl = document.querySelector<HTMLElement>("[data-defense-kpis]");
const defenseMiniGridEl = document.querySelector<HTMLElement>("[data-defense-mini-grid]");
const weaknessesListEl = document.querySelector<HTMLElement>("[data-weaknesses-list]")!;
const resistancesListEl = document.querySelector<HTMLElement>("[data-resistances-list]")!;
const immunitiesListEl = document.querySelector<HTMLElement>("[data-immunities-list]");
const weaknessesCountEl = document.querySelector<HTMLElement>("[data-weaknesses-count]");
const resistancesCountEl = document.querySelector<HTMLElement>("[data-resistances-count]");
const immunitiesCountEl = document.querySelector<HTMLElement>("[data-immunities-count]");

const offenseKpisEl = document.querySelector<HTMLElement>("[data-offense-kpis]");
const offenseMiniGridEl = document.querySelector<HTMLElement>("[data-offense-mini-grid]");
const offenseModeToggleEl = document.querySelector<HTMLElement>("[data-offense-mode-toggle]");
const offensePctEl = document.querySelector<HTMLElement>("[data-offense-pct]");
const offenseMeterEl = document.querySelector<HTMLElement>("[data-offense-meter]");
const offenseScoreLabelEl = document.querySelector<HTMLElement>("[data-offense-score-label]");
const offenseCoveredCountEl = document.querySelector<HTMLElement>("[data-offense-covered-count]");
const offenseBlindspotsCountEl = document.querySelector<HTMLElement>("[data-offense-blindspots-count]");
const offenseCoveredListEl = document.querySelector<HTMLElement>("[data-offense-covered-list]");
const offenseBlindspotsListEl = document.querySelector<HTMLElement>("[data-offense-blindspots-list]");

let activePanelTab: "defense" | "offense" = "defense";
let activeOffenseMode: "moves" | "stab" = "moves";
let activeDensity: "compact" | "detailed" =
  typeof window !== "undefined" && localStorage.getItem("poketeam_view_density") === "detailed"
    ? "detailed"
    : "compact";

const overlayEl = document.querySelector<HTMLElement>("[data-picker-overlay]")!;
const pickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-picker-close]")!;
const pickerBodyEl = document.querySelector<HTMLElement>("[data-picker-body]");
const pickerResultsEl = document.querySelector<HTMLElement>("[data-picker-results]")!;
const pickerSearchEl = document.querySelector<HTMLInputElement>("[data-picker-search]")!;
const pickerTypeFilterEl = document.querySelector<HTMLElement>("[data-picker-type-filter]")!;
const pickerGenFilterEl = document.querySelector<HTMLElement>("[data-picker-generation-filter]")!;
const pickerGameFilterEl = document.querySelector<HTMLSelectElement>("[data-picker-game-filter]");
const teamHeaderGameSelectEl = document.querySelector<HTMLSelectElement>("[data-team-header-game-select]");
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

const itemPickerOverlayEl = document.querySelector<HTMLElement>("[data-item-picker-overlay]");
const itemPickerBodyEl = document.querySelector<HTMLElement>("[data-item-picker-body]");
const itemPickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-item-picker-close]");
const itemPickerSearchEl = document.querySelector<HTMLInputElement>("[data-item-picker-search]");
const itemPickerResultsEl = document.querySelector<HTMLElement>("[data-item-picker-results]");
const itemPickerTitleEl = document.querySelector<HTMLElement>("[data-item-picker-title]");
const itemPickerCountEl = document.querySelector<HTMLElement>("[data-item-picker-count]");
const itemCategoryFilterEl = document.querySelector<HTMLElement>("[data-item-category-filter]");

let team: TeamState = { size: 6, slots: [] };
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

let activeItemSlotIndex: number | null = null;
let activeItemCategory: string = "all";

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
  game: getSelectedGame(),
  dexMode: getGameDexMode(),
  exclusive: new Set<string>(["all"]),
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
          <button class="move-slot-btn empty" type="button" data-move-slot data-slot-index="${index}" data-move-index="${mIdx}" data-select-move>
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
        <div class="move-slot-card filled" data-move-slot data-slot-index="${index}" data-move-index="${mIdx}" draggable="true">
          <div class="move-slot-card__top">
            <div class="move-slot-drag-handle" data-drag-handle title="${locale === "es" ? "Arrastrar para reordenar" : "Drag to reorder"}" aria-label="${locale === "es" ? "Arrastrar para reordenar" : "Drag to reorder"}">
              <i data-lucide="grip-vertical"></i>
            </div>
            <button class="move-slot-card__name-btn" type="button" data-select-move data-slot-index="${index}" data-move-index="${mIdx}">
              <i data-lucide="swords"></i>
              <span class="move-slot-card__title">${getMoveName(moveName, locale, meta)}</span>
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
    <div class="team-slot-column" data-slot-column="${index}" draggable="true">
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
            <div class="team-slot__pills-row">
              ${
                slotData?.nature
                  ? `<div class="team-slot__nature-pill" title="${locale === "es" ? `Naturaleza: ${getNatureName(slotData.nature, locale)}` : `Nature: ${getNatureName(slotData.nature, locale)}`}">
                      <i data-lucide="sparkle"></i>
                      <span>${getNatureName(slotData.nature, locale)}</span>
                    </div>`
                  : ""
              }
              ${
                slotData?.item
                  ? `<div class="team-slot__item-pill" draggable="true" title="${locale === "es" ? `Objeto: ${getItemDisplayName(slotData.item, locale)} (Arrastrá para mover o soltá fuera para quitar)` : `Item: ${getItemDisplayName(slotData.item, locale)} (Drag to move or drop outside to unequip)`}" data-select-item data-item-pill data-slot-index="${index}">
                      ${renderItemIconHTML(slotData.item, { size: 16 })}
                      <span>${getItemDisplayName(slotData.item, locale)}</span>
                    </div>`
                  : `<button class="team-slot__item-btn empty" type="button" data-select-item data-slot-index="${index}" title="${t.team.chooseItem}">
                      <i data-lucide="backpack"></i>
                      <span>${t.team.item}</span>
                    </button>`
              }
            </div>
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

function formatMult(mult: number): string {
  if (mult === 0) return "0×";
  if (mult === 0.25) return "¼×";
  if (mult === 0.5) return "½×";
  if (mult === 2) return "2×";
  if (mult === 4) return "4×";
  return `${mult}×`;
}

function updateDensityUI(): void {
  if (sidePanelEl) {
    sidePanelEl.setAttribute("data-view-density", activeDensity);
  }
  if (densitySwitchEl) {
    const isCompact = activeDensity === "compact";
    densitySwitchEl.setAttribute("aria-checked", String(isCompact));
    const locale = getCurrentLocale();
    const t = getTranslations(locale);
    densitySwitchEl.title = isCompact ? t.strengthsWeaknesses.viewCompact : t.strengthsWeaknesses.viewDetailed;
  }
}

function setDensity(density: "compact" | "detailed"): void {
  activeDensity = density;
  try {
    localStorage.setItem("poketeam_view_density", density);
  } catch {}
  updateDensityUI();
}

function handleCrossHighlight(targetType: string | null): void {
  const slotCols = document.querySelectorAll<HTMLElement>(".team-slot-column");
  if (!targetType || !typeChart) {
    slotCols.forEach((col) => {
      col.classList.remove(
        "is-dimmed",
        "is-highlighted-weak-4x",
        "is-highlighted-weak-2x",
        "is-highlighted-resist",
        "is-highlighted-immune",
        "is-highlighted-attacker"
      );
    });
    return;
  }

  slotCols.forEach((col) => {
    const idx = Number(col.dataset.slotColumn);
    const slot = team.slots[idx];
    if (!slot || slot.pokemonId === null) {
      col.classList.add("is-dimmed");
      return;
    }
    const pokemon = pokemonById.get(slot.pokemonId);
    if (!pokemon) {
      col.classList.add("is-dimmed");
      return;
    }

    col.classList.remove(
      "is-dimmed",
      "is-highlighted-weak-4x",
      "is-highlighted-weak-2x",
      "is-highlighted-resist",
      "is-highlighted-immune",
      "is-highlighted-attacker"
    );

    if (activePanelTab === "defense") {
      const mult = getTypeMultiplier(typeChart!, targetType, pokemon.types, {
        item: slot.item,
        speciesId: pokemon.id,
        ability: slot.ability,
      });
      if (mult >= 4) {
        col.classList.add("is-highlighted-weak-4x");
      } else if (mult >= 2) {
        col.classList.add("is-highlighted-weak-2x");
      } else if (mult === 0) {
        col.classList.add("is-highlighted-immune");
      } else if (mult <= 0.5) {
        col.classList.add("is-highlighted-resist");
      } else {
        col.classList.add("is-dimmed");
      }
    } else {
      let isAttacker = false;
      if (activeOffenseMode === "moves" && slot.moves?.length) {
        for (const mName of slot.moves) {
          if (!mName) continue;
          const meta = moveDetailsMap[mName];
          if (meta && meta.category !== "status") {
            const mMult = typeChart!.chart[meta.type]?.[targetType] ?? 1;
            if (mMult >= 2) {
              isAttacker = true;
              break;
            }
          }
        }
      }
      if (!isAttacker) {
        for (const pType of pokemon.types) {
          const mMult = typeChart!.chart[pType]?.[targetType] ?? 1;
          if (mMult >= 2) {
            isAttacker = true;
            break;
          }
        }
      }

      if (isAttacker) {
        col.classList.add("is-highlighted-attacker");
      } else {
        col.classList.add("is-dimmed");
      }
    }
  });
}

function renderDefenseKPIs(
  weaknesses: TeamDefenseEntry[],
  resistances: TeamDefenseEntry[],
  immunities: TeamDefenseEntry[]
): void {
  if (!defenseKpisEl) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const criticalCount = weaknesses.filter(
    (w) => w.threatLevel === "critical" || w.threatLevel === "exposed"
  ).length;
  const resistCount = resistances.length;
  const immuneCount = immunities.length;

  defenseKpisEl.innerHTML = `
    <div class="side-panel-kpi side-panel-kpi--critical" title="${t.strengthsWeaknesses.threatCritical}">
      <span class="side-panel-kpi__count">${criticalCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiCritical}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--resist" title="${t.strengthsWeaknesses.resistances}">
      <span class="side-panel-kpi__count">${resistCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiResists}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--immune" title="${t.strengthsWeaknesses.immunities}">
      <span class="side-panel-kpi__count">${immuneCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiImmunes}</span>
    </div>
  `;
}

function renderDefenseMiniGrid(defense: TeamDefenseEntry[]): void {
  if (!defenseMiniGridEl || !typeChart) return;
  const locale = getCurrentLocale();
  const allTypes = typeChart.types || Object.keys(typeChart.chart);
  const defenseMap = new Map<string, TeamDefenseEntry>(defense.map((d) => [d.type, d]));

  const chipsHtml = allTypes
    .map((type) => {
      const entry = defenseMap.get(type);
      let severityClass = "type-mini-chip--neutral";
      let multLabel = "1×";

      if (entry) {
        if (entry.threatLevel === "critical" || entry.threatLevel === "exposed") {
          severityClass = entry.threatLevel === "critical" ? "type-mini-chip--critical" : "type-mini-chip--exposed";
          const maxMult = Math.max(...entry.weakDetails.map((m) => m.multiplier), 2);
          multLabel = formatMult(maxMult);
        } else if (entry.threatLevel === "covered") {
          severityClass = "type-mini-chip--covered";
          multLabel = "2×";
        } else if (entry.immuneCount > 0) {
          severityClass = "type-mini-chip--immune";
          multLabel = "0×";
        } else if (entry.resistCount > 0) {
          severityClass = "type-mini-chip--safe";
          const minMult = Math.min(...entry.resistDetails.map((m) => m.multiplier), 0.5);
          multLabel = formatMult(minMult);
        }
      }

      return `
        <div class="type-mini-chip ${severityClass}" data-type="${type}" title="${getTypeName(type, locale)}: ${multLabel}">
          <span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>
          <span class="type-mini-chip__mult">${multLabel}</span>
        </div>
      `;
    })
    .join("");

  defenseMiniGridEl.innerHTML = chipsHtml;
}

function renderOffenseKPIs(offense: TeamOffenseSummary): void {
  if (!offenseKpisEl) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  offenseKpisEl.innerHTML = `
    <div class="side-panel-kpi side-panel-kpi--covered" title="${t.strengthsWeaknesses.superEffectiveTypes}">
      <span class="side-panel-kpi__count">${offense.coveredCount}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiCovered}</span>
    </div>
    <div class="side-panel-kpi side-panel-kpi--blindspot" title="${t.strengthsWeaknesses.blindSpots}">
      <span class="side-panel-kpi__count">${offense.blindSpots.length}</span>
      <span class="side-panel-kpi__label">${t.strengthsWeaknesses.kpiBlindSpots}</span>
    </div>
  `;
}

function renderOffenseMiniGrid(offense: TeamOffenseSummary): void {
  if (!offenseMiniGridEl || !typeChart) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const allTypes = typeChart.types || Object.keys(typeChart.chart);
  const coveredSet = new Set(offense.coveredTypes.map((c: TeamOffenseEntry) => c.targetType));

  const chipsHtml = allTypes
    .map((type) => {
      const isCovered = coveredSet.has(type);
      const severityClass = isCovered ? "type-mini-chip--offense-covered" : "type-mini-chip--offense-blindspot";
      const multLabel = isCovered ? "2×" : "-";

      return `
        <div class="type-mini-chip ${severityClass}" data-type="${type}" title="${getTypeName(type, locale)}: ${isCovered ? "2×" : t.strengthsWeaknesses.blindSpots}">
          <span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>
          <span class="type-mini-chip__mult">${multLabel}</span>
        </div>
      `;
    })
    .join("");

  offenseMiniGridEl.innerHTML = chipsHtml;
}

function renderWeaknessItemHTML(entry: TeamDefenseEntry): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  let threatBadge = "";
  if (entry.threatLevel === "critical") {
    threatBadge = `<span class="threat-pill threat-pill--critical"><i data-lucide="alert-triangle"></i> ${t.strengthsWeaknesses.threatCritical}</span>`;
  } else if (entry.threatLevel === "exposed") {
    threatBadge = `<span class="threat-pill threat-pill--exposed">${t.strengthsWeaknesses.threatExposed}</span>`;
  } else {
    threatBadge = `<span class="threat-pill threat-pill--covered">${t.strengthsWeaknesses.threatCovered}</span>`;
  }

  const has4x = entry.weakDetails.some((m) => m.multiplier >= 4);
  const countLabel = entry.weakCount === 1
    ? t.strengthsWeaknesses.weakLabel.replace("{n}", "1")
    : t.strengthsWeaknesses.weakLabelPlural.replace("{n}", String(entry.weakCount));
  const weakCountBadge = `<span class="threat-pill threat-pill--weak">${countLabel}${has4x ? " (4×)" : ""}</span>`;

  let supportBadge = "";
  if (entry.immuneCount > 0) {
    const immuneLabel = entry.immuneCount === 1
      ? t.strengthsWeaknesses.immuneLabel.replace("{n}", "1")
      : t.strengthsWeaknesses.immuneLabelPlural.replace("{n}", String(entry.immuneCount));
    supportBadge = `<span class="threat-pill threat-pill--immune">${immuneLabel}</span>`;
  } else if (entry.resistCount > 0) {
    const resistLabel = entry.resistCount === 1
      ? t.strengthsWeaknesses.resistLabel.replace("{n}", "1")
      : t.strengthsWeaknesses.resistLabelPlural.replace("{n}", String(entry.resistCount));
    supportBadge = `<span class="threat-pill threat-pill--resist">${resistLabel}</span>`;
  }

  const weakTags = entry.weakDetails
    .map(
      (m) => {
        const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
        return `<span class="member-tag member-tag--weak">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
      }
    )
    .join("");

  const safeTags = [
    ...entry.immuneDetails.map(
      (m) => {
        const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
        return `<span class="member-tag member-tag--immune">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">0×</span></span>`;
      }
    ),
    ...entry.resistDetails.map(
      (m) => {
        const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
        return `<span class="member-tag member-tag--resist">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
      }
    ),
  ].join("");

  return `
    <details class="defense-item defense-item--${entry.threatLevel}" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${threatBadge}
          ${weakCountBadge}
          ${supportBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--weak">
            <i data-lucide="x"></i> ${t.strengthsWeaknesses.vulnerableGroup}
          </span>
          <div class="defense-item__tags">${weakTags}</div>
        </div>
        ${
          safeTags
            ? `
          <div class="defense-item__group">
            <span class="defense-item__group-title defense-item__group-title--safe">
              <i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistantGroup}
            </span>
            <div class="defense-item__tags">${safeTags}</div>
          </div>
        `
            : `
          <div class="defense-item__notice defense-item__notice--warn">
            <i data-lucide="info"></i>
            <span>${t.strengthsWeaknesses.noResistWarning}</span>
          </div>
        `
        }
      </div>
    </details>
  `;
}

function renderResistItemHTML(entry: TeamDefenseEntry): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const resistLabel = entry.resistCount === 1
    ? t.strengthsWeaknesses.resistLabel.replace("{n}", "1")
    : t.strengthsWeaknesses.resistLabelPlural.replace("{n}", String(entry.resistCount));
  const hasQuarter = entry.resistDetails.some((m) => m.multiplier <= 0.25);
  const resistBadge = `<span class="threat-pill threat-pill--resist">${resistLabel}${hasQuarter ? " (¼×)" : ""}</span>`;

  const resistTags = entry.resistDetails
    .map(
      (m) => {
        const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
        return `<span class="member-tag member-tag--resist">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">${formatMult(m.multiplier)}</span></span>`;
      }
    )
    .join("");

  return `
    <details class="defense-item defense-item--safe" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${resistBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--safe">
            <i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistantGroup}
          </span>
          <div class="defense-item__tags">${resistTags}</div>
        </div>
      </div>
    </details>
  `;
}

function renderImmunityItemHTML(entry: TeamDefenseEntry): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const immuneLabel = entry.immuneCount === 1
    ? t.strengthsWeaknesses.immuneLabel.replace("{n}", "1")
    : t.strengthsWeaknesses.immuneLabelPlural.replace("{n}", String(entry.immuneCount));
  const immuneBadge = `<span class="threat-pill threat-pill--immune">${immuneLabel} (0×)</span>`;

  const immuneTags = entry.immuneDetails
    .map(
      (m) => {
        const noteTag = m.itemEffectNote ? ` <span class="member-tag__note" title="${m.itemEffectNote}">(${m.itemEffectNote})</span>` : "";
        return `<span class="member-tag member-tag--immune">${capitalize(m.name)}${noteTag} <span class="member-tag__mult">0×</span></span>`;
      }
    )
    .join("");

  return `
    <details class="defense-item defense-item--immune" data-defense-item name="sidepanel-breakdown" data-type="${entry.type}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.type}" style="--badge-bg:${typeColor(entry.type)}">
              ${getTypeName(entry.type, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          ${immuneBadge}
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--immune">
            <i data-lucide="shield-off"></i> ${t.strengthsWeaknesses.immuneGroup}
          </span>
          <div class="defense-item__tags">${immuneTags}</div>
        </div>
      </div>
    </details>
  `;
}

function renderStrengthsPanel(): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const activeMembers: TeamMember[] = team.slots
    .map((s): TeamMember | null => {
      if (s.pokemonId === null) return null;
      const p = pokemonById.get(s.pokemonId);
      if (!p) return null;
      return {
        name: p.name,
        types: p.types,
        speciesId: p.id,
        item: s.item ?? null,
        ability: s.ability ?? null,
      };
    })
    .filter((m): m is TeamMember => m !== null);

  if (!activeMembers.length || !typeChart) {
    panelEmptyEl.hidden = false;
    panelContentEl.hidden = true;
    return;
  }

  panelEmptyEl.hidden = true;
  panelContentEl.hidden = false;

  const defense = computeTeamDefense(typeChart, activeMembers);
  const { weaknesses, resistances, immunities } = splitWeaknessesAndResistances(defense);

  renderDefenseKPIs(weaknesses, resistances, immunities);
  renderDefenseMiniGrid(defense);

  if (weaknessesCountEl) {
    weaknessesCountEl.textContent = weaknesses.length ? `(${weaknesses.length})` : "";
  }
  if (resistancesCountEl) {
    resistancesCountEl.textContent = resistances.length ? `(${resistances.length})` : "";
  }
  if (immunitiesCountEl) {
    immunitiesCountEl.textContent = immunities.length ? `(${immunities.length})` : "";
  }

  weaknessesListEl.innerHTML = weaknesses.length
    ? weaknesses.map(renderWeaknessItemHTML).join("")
    : `<p class="side-panel__empty">${t.strengthsWeaknesses.noWeaknesses}</p>`;

  resistancesListEl.innerHTML = resistances.length
    ? resistances.map(renderResistItemHTML).join("")
    : `<p class="side-panel__empty">${t.strengthsWeaknesses.noResistances}</p>`;

  if (immunitiesListEl) {
    immunitiesListEl.innerHTML = immunities.length
      ? immunities.map(renderImmunityItemHTML).join("")
      : `<p class="side-panel__empty">${t.strengthsWeaknesses.noImmunities}</p>`;
  }

  renderOffensePanel();
  renderSynergyPanel();

  refreshIcons();
}

function getAttackSources(): AttackSource[] {
  const sources: AttackSource[] = [];

  for (let i = 0; i < team.slots.length; i++) {
    const slot = team.slots[i];
    if (!slot || slot.pokemonId === null) continue;
    const pokemon = pokemonById.get(slot.pokemonId);
    if (!pokemon) continue;

    if (activeOffenseMode === "moves") {
      let hasDamagingMove = false;
      if (slot.moves && slot.moves.length) {
        for (const moveName of slot.moves) {
          if (!moveName) continue;
          const meta = moveDetailsMap[moveName];
          if (meta && meta.category !== "status") {
            hasDamagingMove = true;
            sources.push({
              pokemonName: pokemon.name,
              type: meta.type,
              moveName,
            });
          }
        }
      }
      if (!hasDamagingMove) {
        for (const pType of pokemon.types) {
          sources.push({
            pokemonName: pokemon.name,
            type: pType,
          });
        }
      }
    } else {
      for (const pType of pokemon.types) {
        sources.push({
          pokemonName: pokemon.name,
          type: pType,
        });
      }
    }
  }

  return sources;
}

function renderOffenseCoveredItemHTML(entry: TeamOffenseEntry): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const countLabel = entry.attackers.length === 1
    ? t.strengthsWeaknesses.attackerCount.replace("{n}", "1")
    : t.strengthsWeaknesses.attackerCountPlural.replace("{n}", String(entry.attackers.length));

  const attackerTags = entry.attackers
    .map((att) => {
      const moveLabel = att.moveName ? ` (${getMoveName(att.moveName, locale, moveDetailsMap[att.moveName])})` : "";
      return `
        <span class="member-tag member-tag--attacker">
          ${capitalize(att.pokemonName)}${moveLabel} <span class="member-tag__mult">${formatMult(att.multiplier)}</span>
        </span>
      `;
    })
    .join("");

  return `
    <details class="defense-item defense-item--covered-offense" data-defense-item name="sidepanel-breakdown" data-type="${entry.targetType}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.targetType}" style="--badge-bg:${typeColor(entry.targetType)}">
              ${getTypeName(entry.targetType, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          <span class="threat-pill threat-pill--covered-offense">${countLabel}</span>
          <span class="threat-pill threat-pill--covered-offense">2×</span>
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__group">
          <span class="defense-item__group-title defense-item__group-title--attacker">
            <i data-lucide="swords"></i> ${t.strengthsWeaknesses.superEffectiveTypes}:
          </span>
          <div class="defense-item__tags">${attackerTags}</div>
        </div>
      </div>
    </details>
  `;
}

function renderOffenseBlindSpotItemHTML(entry: TeamOffenseEntry): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  return `
    <details class="defense-item defense-item--blindspot" data-defense-item name="sidepanel-breakdown" data-type="${entry.targetType}">
      <summary class="defense-item__summary">
        <div class="defense-item__header-row">
          <div class="defense-item__type-col">
            <span class="type-badge" data-type="${entry.targetType}" style="--badge-bg:${typeColor(entry.targetType)}">
              ${getTypeName(entry.targetType, locale)}
            </span>
          </div>
          <i data-lucide="chevron-down" class="defense-item__chevron"></i>
        </div>
        <div class="defense-item__badges-col">
          <span class="threat-pill threat-pill--blindspot">${t.strengthsWeaknesses.blindSpots}</span>
        </div>
      </summary>
      <div class="defense-item__details">
        <div class="defense-item__notice defense-item__notice--warn">
          <i data-lucide="info"></i>
          <span>${t.strengthsWeaknesses.blindSpotHint}</span>
        </div>
      </div>
    </details>
  `;
}

function renderOffensePanel(): void {
  if (!typeChart || !tabContentOffenseEl) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const sources = getAttackSources();
  const offense = computeTeamOffense(typeChart, sources);

  renderOffenseKPIs(offense);
  renderOffenseMiniGrid(offense);

  if (offensePctEl) {
    offensePctEl.textContent = `${offense.coveragePercentage}%`;
  }
  if (offenseMeterEl) {
    offenseMeterEl.style.width = `${offense.coveragePercentage}%`;
  }
  if (offenseScoreLabelEl) {
    offenseScoreLabelEl.textContent = t.strengthsWeaknesses.coverageScore
      .replace("{count}", String(offense.coveredCount))
      .replace("{total}", String(offense.totalTypes));
  }
  if (offenseCoveredCountEl) {
    offenseCoveredCountEl.textContent = offense.coveredCount ? `(${offense.coveredCount})` : "";
  }
  if (offenseBlindspotsCountEl) {
    offenseBlindspotsCountEl.textContent = offense.blindSpots.length ? `(${offense.blindSpots.length})` : "";
  }

  if (offenseCoveredListEl) {
    offenseCoveredListEl.innerHTML = offense.coveredTypes.length
      ? offense.coveredTypes.map(renderOffenseCoveredItemHTML).join("")
      : `<p class="side-panel__empty">${t.strengthsWeaknesses.noOffenseCovered}</p>`;
  }

  if (offenseBlindspotsListEl) {
    offenseBlindspotsListEl.innerHTML = offense.blindSpots.length
      ? offense.blindSpots.map(renderOffenseBlindSpotItemHTML).join("")
      : `<p class="side-panel__empty">${t.strengthsWeaknesses.noBlindSpots}</p>`;
  }
}

function getGameOptionsHTML(selectedGame: string): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  gameToGenMap.clear();
  let html = `<option value="" ${selectedGame === "" ? "selected" : ""}>${t.pokedex.allGames}</option>`;
  for (const g of generations) {
    const regionName = g.region ? getRegionName(g.region, locale) : "";
    const regionLabel = regionName ? ` (${regionName})` : "";
    const genName = locale === "es" ? g.displayName : g.displayName.replace("Generación", "Generation");
    html += `<optgroup label="${genName}${regionLabel}">`;
    for (const vg of g.versionGroups) {
      gameToGenMap.set(vg.name, g);
      const title = getGameTitle(vg.name, locale, vg.displayName);
      const isSelected = vg.name === selectedGame ? "selected" : "";
      html += `<option value="${vg.name}" ${isSelected}>${title}</option>`;
    }
    html += `</optgroup>`;
  }
  return html;
}

function autoDetectGameFromTeam(): string {
  const activeIds = team.slots
    .map((s) => s.pokemonId)
    .filter((id): id is number => id !== null);
  if (!activeIds.length || !gameDexData) return "";

  const gameEntries = Object.entries(gameDexData).reverse();
  for (const [gname] of gameEntries) {
    const set = gameSpeciesSets.get(gname);
    if (set && activeIds.every((id) => set.obtainable.has(id))) {
      return gname;
    }
  }
  return "";
}

function renderSynergyPanel(): void {
  if (!typeChart || !synergyModalContent || !allPokemon.length) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  type SynergyMember = Pokemon & { item?: string | null; ability?: string | null };
  const activePokemon: SynergyMember[] = team.slots
    .map((s): SynergyMember | null => {
      if (s.pokemonId === null) return null;
      const p = pokemonById.get(s.pokemonId);
      if (!p) return null;
      return { ...p, item: s.item ?? null, ability: s.ability ?? null };
    })
    .filter((p): p is SynergyMember => p !== null);

  if (!activePokemon.length) {
    if (synergySidebarCalloutEl) synergySidebarCalloutEl.hidden = true;
    synergyModalContent.innerHTML = `
      <p class="side-panel__empty" style="text-align: center; padding: 40px 20px;">
        <i data-lucide="info" style="margin-bottom: 8px;"></i><br />
        ${locale === "es" ? "Agregá al menos un Pokémon a tu equipo para analizar sinergias y ver recomendaciones inteligentes." : "Add at least one Pokémon to your team to analyze synergies and see smart recommendations."}
      </p>
    `;
    refreshIcons();
    return;
  }

  if (synergySidebarCalloutEl) synergySidebarCalloutEl.hidden = false;

  // If no game is selected yet, attempt auto-detect from the current team
  if (!pickerState.game) {
    const detected = autoDetectGameFromTeam();
    if (detected) {
      pickerState.game = detected;
      setSelectedGame(detected);
      if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = detected;
      if (pickerGameFilterEl) pickerGameFilterEl.value = detected;
    }
  }

  const setObj = pickerState.game ? gameSpeciesSets.get(pickerState.game) : undefined;
  const currentSet = setObj
    ? (pickerState.dexMode === "obtainable" ? setObj.obtainable : setObj.regional)
    : undefined;

  const report = computeTeamSynergy(typeChart, activePokemon, allPokemon, { gameSpeciesSet: currentSet });

  const hasEmptySlot = team.slots.some((s) => s.pokemonId === null);

  // 1. Toolbar with Game Selector and Dex Mode Toggle
  let noticeHtml = "";
  if (pickerState.game && currentSet) {
    const gTitle = getGameTitle(pickerState.game, locale);
    const dexLabel = pickerState.dexMode === "obtainable" ? t.pokedex.obtainable : t.pokedex.regionalDex;
    noticeHtml = `
      <span class="synergy-filter-notice">
        <i data-lucide="circle-check"></i>
        <span>${t.strengthsWeaknesses.synergyGameFilteredNotice
          .replace("{game}", gTitle)
          .replace("{count}", String(currentSet.size))
          .replace("{dex}", dexLabel)}</span>
      </span>
    `;
  } else {
    noticeHtml = `
      <span class="synergy-filter-notice synergy-filter-notice--warning">
        <i data-lucide="info"></i>
        <span>${t.strengthsWeaknesses.synergyGameAllPrompt}</span>
      </span>
    `;
  }

  const toolbarHtml = `
    <div class="synergy-toolbar">
      <div class="synergy-toolbar__left">
        <label class="synergy-toolbar__label">
          <i data-lucide="gamepad-2"></i>
          <span>${t.strengthsWeaknesses.synergyGameFilterLabel}</span>
        </label>
        <div class="select-wrapper select-wrapper--compact">
          <select class="game-select" data-synergy-game-filter>
            ${getGameOptionsHTML(pickerState.game)}
          </select>
          <i data-lucide="chevron-down" class="select-wrapper__arrow"></i>
        </div>
        <div class="view-toggle" data-synergy-dex-mode-toggle ${!pickerState.game ? "hidden" : ""}>
          <button class="view-toggle__btn" type="button" data-synergy-dex-mode="regional" aria-pressed="${String(pickerState.dexMode === "regional")}">
            ${t.pokedex.regionalDex}
          </button>
          <button class="view-toggle__btn" type="button" data-synergy-dex-mode="obtainable" aria-pressed="${String(pickerState.dexMode === "obtainable")}">
            ${t.pokedex.obtainable}
          </button>
        </div>
      </div>
      <div class="synergy-toolbar__right">
        ${noticeHtml}
      </div>
    </div>
  `;

  // 2. Overview Grid (Debilidades, Puntos ciegos, Tipos clave)
  const weaknessesToCover = [...report.criticalWeaknesses, ...report.exposedWeaknesses];
  const weaknessesHtml = weaknessesToCover.length
    ? weaknessesToCover
        .map(
          (ty) => `
        <span class="type-badge" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
          ${getTypeName(ty, locale)}
        </span>
      `
        )
        .join("")
    : `<span style="color: #86efac; font-size: 13px; font-weight: 500;">✓ ${locale === "es" ? "Sin debilidades desprotegidas" : "No unprotected weaknesses"}</span>`;

  const blindSpotsHtml = report.blindSpots.length
    ? report.blindSpots
        .map(
          (ty) => `
        <span class="type-badge" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
          ${getTypeName(ty, locale)}
        </span>
      `
        )
        .join("")
    : `<span style="color: #86efac; font-size: 13px; font-weight: 500;">✓ ${locale === "es" ? "Cobertura ofensiva completa" : "Full offensive coverage"}</span>`;

  const recommendedTypesHtml = report.recommendedTypes.length
    ? report.recommendedTypes
        .map((rt) => {
          const tooltipParts: string[] = [];
          if (rt.resistsTeamWeaknesses.length) {
            tooltipParts.push(
              (locale === "es" ? "Resiste: " : "Resists: ") +
                rt.resistsTeamWeaknesses.map((w) => getTypeName(w, locale)).join(", ")
            );
          }
          if (rt.coversBlindSpots.length) {
            tooltipParts.push(
              (locale === "es" ? "Cubre: " : "Covers: ") +
                rt.coversBlindSpots.map((b) => getTypeName(b, locale)).join(", ")
            );
          }
          return `
            <span class="type-badge" data-type="${rt.type}" style="--badge-bg:${typeColor(rt.type)}" title="${tooltipParts.join(" | ")}">
              ${getTypeName(rt.type, locale)}
            </span>
          `;
        })
        .join("")
    : `<span style="color: var(--text-muted); font-size: 13px;">-</span>`;

  const overviewHtml = `
    <div class="synergy-overview-grid">
      <div class="synergy-overview-card">
        <div class="synergy-overview-card__title">
          <i data-lucide="shield-alert"></i>
          <span>${locale === "es" ? "Debilidades a mitigar" : "Weaknesses to mitigate"}</span>
        </div>
        <div class="synergy-overview-card__types">${weaknessesHtml}</div>
      </div>

      <div class="synergy-overview-card">
        <div class="synergy-overview-card__title">
          <i data-lucide="circle-dot"></i>
          <span>${locale === "es" ? "Puntos ciegos ofensivos" : "Offensive blind spots"}</span>
        </div>
        <div class="synergy-overview-card__types">${blindSpotsHtml}</div>
      </div>

      <div class="synergy-overview-card">
        <div class="synergy-overview-card__title">
          <i data-lucide="sparkles"></i>
          <span>${locale === "es" ? "Tipos elementales clave" : "Key recommended types"}</span>
        </div>
        <div class="synergy-overview-card__types">${recommendedTypesHtml}</div>
      </div>
    </div>
  `;

  // 3. Suggested Pokémon cards in spacious grid
  let pokemonCardsHtml = "";
  if (report.suggestions.length) {
    const cards = report.suggestions
      .map((sug) => {
        const p = sug.pokemon;
        const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? "";
        const typesBadges = p.types
          .map(
            (ty) => `
          <span class="type-badge type-badge--sm" data-type="${ty}" style="--badge-bg:${typeColor(ty)}">
            ${getTypeName(ty, locale)}
          </span>
        `
          )
          .join("");

        const reasonTags: string[] = [];

        if (sug.keyImmunities.length) {
          const immStr = sug.keyImmunities.map((ty) => getTypeName(ty, locale)).join(", ");
          reasonTags.push(
            `<span class="synergy-tag synergy-tag--immune"><i data-lucide="shield-check"></i> ${t.strengthsWeaknesses.immuneToVulnerability.replace("{types}", immStr)}</span>`
          );
        }

        if (sug.keyResistances.length) {
          const resStr = sug.keyResistances.map((ty) => getTypeName(ty, locale)).join(", ");
          reasonTags.push(
            `<span class="synergy-tag synergy-tag--resist"><i data-lucide="shield"></i> ${t.strengthsWeaknesses.resistsVulnerability.replace("{types}", resStr)}</span>`
          );
        }

        if (sug.coveredBlindSpots.length) {
          const covStr = sug.coveredBlindSpots.map((ty) => getTypeName(ty, locale)).join(", ");
          reasonTags.push(
            `<span class="synergy-tag synergy-tag--offense"><i data-lucide="swords"></i> ${t.strengthsWeaknesses.coversBlindSpotBadge.replace("{types}", covStr)}</span>`
          );
        }

        if (sug.newTypes.length) {
          const newStr = sug.newTypes.map((ty) => getTypeName(ty, locale)).join(", ");
          reasonTags.push(
            `<span class="synergy-tag synergy-tag--new"><i data-lucide="sparkles"></i> ${t.strengthsWeaknesses.bringsNewTypeBadge.replace("{types}", newStr)}</span>`
          );
        }

        const actionBtn = hasEmptySlot
          ? `
            <button class="btn btn--sm btn--primary" type="button" data-synergy-add="${p.id}">
              <i data-lucide="plus"></i> <span>${t.strengthsWeaknesses.addToTeam}</span>
            </button>
          `
          : `
            <button class="btn btn--sm btn--subtle" type="button" disabled title="${t.strengthsWeaknesses.teamFull.replace("{max}", String(team.size))}">
              <i data-lucide="check"></i> <span>${team.size}/${team.size}</span>
            </button>
          `;

        return `
          <div class="synergy-card">
            <div class="synergy-card__header">
              <div class="synergy-card__info">
                <img class="synergy-card__sprite" src="${sprite}" alt="${p.name}" loading="lazy" />
                <div class="synergy-card__meta">
                  <span class="synergy-card__name">${capitalize(p.name)}</span>
                  <div class="synergy-card__types">${typesBadges}</div>
                </div>
              </div>
              ${actionBtn}
            </div>
            <div class="synergy-card__reasons">
              ${reasonTags.join("")}
            </div>
          </div>
        `;
      })
      .join("");

    pokemonCardsHtml = `
      <div class="synergy-pokemon-section">
        <span class="defense-group__label" style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">
          ${t.strengthsWeaknesses.suggestedPokemonTitle} (${report.suggestions.length})
        </span>
        <div class="synergy-grid">${cards}</div>
      </div>
    `;
  } else {
    pokemonCardsHtml = `
      <p class="side-panel__empty" style="text-align: center; padding: 30px;">${t.strengthsWeaknesses.synergyNoSuggestions}</p>
    `;
  }

  synergyModalContent.innerHTML = `
    ${toolbarHtml}
    ${overviewHtml}
    ${pokemonCardsHtml}
  `;

  // Wire toolbar listeners inside modal
  const synergyGameSelect = synergyModalContent.querySelector<HTMLSelectElement>("[data-synergy-game-filter]");
  synergyGameSelect?.addEventListener("change", () => {
    pickerState.game = synergyGameSelect.value;
    setSelectedGame(pickerState.game);
    if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
    if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = pickerState.game;
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    renderSynergyPanel();
    refreshIcons();
  });

  const synergyDexToggle = synergyModalContent.querySelector<HTMLElement>("[data-synergy-dex-mode-toggle]");
  synergyDexToggle?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-synergy-dex-mode]");
    if (!btn) return;
    const mode = btn.dataset.synergyDexMode as GameDexMode;
    if (mode && mode !== pickerState.dexMode) {
      pickerState.dexMode = mode;
      setGameDexMode(mode);
      updatePickerGameModeToggleUI();
      renderSynergyPanel();
      refreshIcons();
    }
  });
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
    pickerState.exclusive = new Set(["all"]);
    return;
  }

  pickerExclusiveToggleEl.hidden = false;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const [vA, vB] = entry!.versions!;
  const nameA = locale === "es" ? vA.nameEs : vA.name;
  const nameB = locale === "es" ? vB.nameEs : vB.name;

  pickerExclusiveToggleEl.innerHTML = `
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="all" aria-pressed="${String(pickerState.exclusive.has("all"))}">
      ${t.pokedex.exclusiveAll}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vA.id}" aria-pressed="${String(pickerState.exclusive.has(vA.id))}" style="--btn-color:${vA.color};">
      <span class="exclusive-dot" style="--btn-color:${vA.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameA)}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="${vB.id}" aria-pressed="${String(pickerState.exclusive.has(vB.id))}" style="--btn-color:${vB.color};">
      <span class="exclusive-dot" style="--btn-color:${vB.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameB)}
    </button>
    <button class="view-toggle__btn" type="button" data-picker-exclusive-filter="both" aria-pressed="${String(pickerState.exclusive.has("both"))}">
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

    if (!pickerState.exclusive.has("all") && exclusivesMap.size > 0) {
      const meta = exclusivesMap.get(p.id);
      const category = meta ? meta.id : "both";
      if (!pickerState.exclusive.has(category)) return false;
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

let currentPickerResults: Pokemon[] = [];

function renderPickerBatch(append = false): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const exclusivesMap = getPickerExclusiveMap();

  if (!currentPickerResults.length) {
    pickerResultsEl.innerHTML = `<p class="pokedex-empty">${t.pokedex.empty}</p>`;
    return;
  }

  const start = append ? pickerResultsEl.querySelectorAll(".picker-item").length : 0;
  const batch = currentPickerResults.slice(start, start + 60);
  if (!batch.length) return;

  const html = batch
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

  if (append) {
    pickerResultsEl.insertAdjacentHTML("beforeend", html);
  } else {
    pickerResultsEl.innerHTML = html;
  }
}

function renderPickerResults(): void {
  currentPickerResults = computePickerFiltered();
  const countEl = overlayEl.querySelector<HTMLElement>("[data-picker-count]");
  if (countEl) {
    countEl.textContent = `${currentPickerResults.length} Pokémon`;
  }
  if (pickerBodyEl) {
    pickerBodyEl.scrollTop = 0;
  } else {
    pickerResultsEl.scrollTop = 0;
  }
  renderPickerBatch(false);
}

const pickerScrollTarget = pickerBodyEl ?? pickerResultsEl;
pickerScrollTarget.addEventListener(
  "scroll",
  () => {
    if (pickerScrollTarget.scrollTop + pickerScrollTarget.clientHeight >= pickerScrollTarget.scrollHeight - 300) {
      renderPickerBatch(true);
    }
  },
  { passive: true }
);

function updateBodyScrollLock(): void {
  const isAnyModalOpen =
    (!overlayEl.hidden) ||
    (!movePickerOverlayEl.hidden) ||
    Boolean(itemPickerOverlayEl && !itemPickerOverlayEl.hidden) ||
    Boolean(teamCardOverlay && !teamCardOverlay.hidden) ||
    Boolean(typeMatrixOverlay && !typeMatrixOverlay.hidden) ||
    Boolean(synergyModalOverlay && !synergyModalOverlay.hidden);

  document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
}

function openPicker(index: number): void {
  activeSlotIndex = index;
  overlayEl.hidden = false;
  document.body.style.overflow = "hidden";
  pickerState.search = "";
  pickerState.types.clear();
  pickerState.generations.clear();
  pickerState.move = "";
  pickerState.game = getSelectedGame();
  pickerState.dexMode = getGameDexMode();
  pickerState.exclusive = new Set(["all"]);
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
  updateBodyScrollLock();
  activeSlotIndex = null;
}

function populatePickerFilters(): void {
  const locale = getCurrentLocale();
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
  pickerMoveOptionsEl.innerHTML = moveIndex
    .map((m) => {
      const meta = moveDetailsMap[m];
      const localized = getMoveName(m, locale, meta);
      return `<option value="${localized}">${localized !== m ? ` (${formatLabel(m)})` : ""}</option>`;
    })
    .join("");

  if (pickerGameFilterEl) {
    pickerGameFilterEl.innerHTML = getGameOptionsHTML(pickerState.game);
    pickerGameFilterEl.value = pickerState.game;
  }
  if (teamHeaderGameSelectEl) {
    teamHeaderGameSelectEl.innerHTML = getGameOptionsHTML(pickerState.game);
    teamHeaderGameSelectEl.value = pickerState.game;
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
  document.body.style.overflow = "hidden";

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
  updateBodyScrollLock();
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
    const moveNameLocalized = getMoveName(r.name, locale, meta);
    if (
      search &&
      !r.name.toLowerCase().includes(search) &&
      !formatLabel(r.name).toLowerCase().includes(search) &&
      !moveNameLocalized.toLowerCase().includes(search)
    ) {
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
        <tr data-pick-move="${r.name}">
          <td class="move-table__cell-name" data-label="${t.modal.move}">
            <span class="move-table__name">${getMoveName(r.name, locale, meta)}</span>
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

function openItemPicker(slotIndex: number): void {
  if (!itemPickerOverlayEl) return;
  activeItemSlotIndex = slotIndex;
  activeItemCategory = "all";
  if (itemPickerSearchEl) itemPickerSearchEl.value = "";

  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const slot = team.slots[slotIndex];
  const pokemon = slot && slot.pokemonId !== null ? pokemonById.get(slot.pokemonId) : null;

  if (itemPickerTitleEl) {
    itemPickerTitleEl.textContent = pokemon
      ? `${t.team.selectItem} - ${capitalize(pokemon.name)}`
      : t.team.selectItem;
  }

  if (itemCategoryFilterEl) {
    itemCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-item-category]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.itemCategory === "all"));
    });
  }

  itemPickerOverlayEl.hidden = false;
  if (itemPickerBodyEl) {
    itemPickerBodyEl.scrollTop = 0;
  }
  updateBodyScrollLock();
  renderItemPickerResults();
  if (itemPickerSearchEl) itemPickerSearchEl.focus();
}

function closeItemPicker(): void {
  if (!itemPickerOverlayEl) return;
  itemPickerOverlayEl.hidden = true;
  updateBodyScrollLock();
  activeItemSlotIndex = null;
}

function renderItemPickerResults(): void {
  if (!itemPickerResultsEl) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const search = itemPickerSearchEl ? itemPickerSearchEl.value.trim() : "";
  const filtered = filterItems(search, activeItemCategory, locale);

  const slot = activeItemSlotIndex !== null ? team.slots[activeItemSlotIndex] : null;
  const currentItemId = slot?.item ?? null;

  if (itemPickerCountEl) {
    itemPickerCountEl.textContent = `${filtered.length} ${locale === "es" ? "objetos" : "items"}`;
  }

  let html = "";

  if (currentItemId) {
    const currentItem = getItemById(currentItemId);
    const itemName = currentItem ? (locale === "es" ? currentItem.nameEs : currentItem.nameEn) : currentItemId;
    html += `
      <div class="item-picker__current-banner">
        <div class="item-picker__current-info">
          ${renderItemIconHTML(currentItemId, { size: 22 })}
          <span>${locale === "es" ? "Equipado actualmente:" : "Currently equipped:"} <strong>${itemName}</strong></span>
        </div>
        <button class="btn btn--sm btn--danger" type="button" data-remove-item-picker>
          <i data-lucide="trash-2"></i> ${t.team.removeItem}
        </button>
      </div>
    `;
  }

  if (!filtered.length) {
    html += `<p class="pokedex-empty">${locale === "es" ? "No se encontraron objetos con los filtros seleccionados." : "No items found matching the selected filters."}</p>`;
    itemPickerResultsEl.innerHTML = html;
    refreshIcons();
    return;
  }

  const cardsHtml = filtered
    .map((item) => {
      const isSelected = item.id === currentItemId;
      const itemName = locale === "es" ? item.nameEs : item.nameEn;
      const itemDesc = locale === "es" ? (item.shortDescEs || item.effect?.descriptionEs || "") : (item.shortDescEn || item.effect?.descriptionEn || "");
      const categoryName = (t.team.itemCategories as Record<string, string>)[item.category] ?? item.category;

      let effectBadges = "";
      if (item.effect?.statMultipliers) {
        for (const [, mult] of Object.entries(item.effect.statMultipliers)) {
          if (typeof mult === "number") {
            const pct = Math.round((mult - 1) * 100);
            const sign = pct > 0 ? `+${pct}%` : `${pct}%`;
            effectBadges += `<span class="item-effect-badge item-effect-badge--stat">★ ${sign}</span>`;
          }
        }
      }
      if (item.effect?.grantsImmunities?.length) {
        for (const imm of item.effect.grantsImmunities) {
          effectBadges += `<span class="item-effect-badge item-effect-badge--immunity"><i data-lucide="shield"></i> ${locale === "es" ? "Inmune a " : "Immune to "}${getTypeName(imm, locale)}</span>`;
        }
      }
      if (item.effect?.changesPokemonType) {
        effectBadges += `<span class="item-effect-badge item-effect-badge--type"><i data-lucide="sparkles"></i> ${getTypeName(item.effect.changesPokemonType, locale)}</span>`;
      }

      return `
        <div class="item-picker-card ${isSelected ? "is-selected" : ""}" data-item-id="${item.id}" data-pick-item="${item.id}">
          <div class="item-picker-card__header">
            <div class="item-picker-card__icon-wrap">
              ${renderItemIconHTML(item.id, { size: 24, fallbackIcon: item.icon || "backpack" })}
            </div>
            <div class="item-picker-card__title-group">
              <div class="item-picker-card__name">${itemName}</div>
              <span class="item-picker-card__category">${categoryName}</span>
            </div>
            ${
              isSelected
                ? `<span class="item-picker-card__badge-equipped"><i data-lucide="check"></i> ${locale === "es" ? "Equipado" : "Equipped"}</span>`
                : ""
            }
          </div>
          <p class="item-picker-card__desc">${itemDesc}</p>
          ${effectBadges ? `<div class="item-picker-card__effects">${effectBadges}</div>` : ""}
          <div class="item-picker-card__actions">
            <button class="btn btn--sm ${isSelected ? "btn--secondary" : "btn--primary"} item-picker-card__btn" type="button" data-pick-item="${item.id}">
              ${isSelected ? (locale === "es" ? "Conservar" : "Keep") : (locale === "es" ? "Equipar" : "Equip")}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  html += `<div class="item-picker__grid">${cardsHtml}</div>`;
  itemPickerResultsEl.innerHTML = html;
  refreshIcons();
}

// --- event wiring -----------------------------------------------------

panelTabToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-panel-tab]");
  if (!btn) return;
  const tab = btn.dataset.panelTab as "defense" | "offense";
  if (!tab || tab === activePanelTab) return;

  activePanelTab = tab;
  panelTabToggleEl.querySelectorAll<HTMLButtonElement>("[data-panel-tab]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.panelTab === activePanelTab));
  });

  if (tabContentDefenseEl) tabContentDefenseEl.hidden = activePanelTab !== "defense";
  if (tabContentOffenseEl) tabContentOffenseEl.hidden = activePanelTab !== "offense";
  handleCrossHighlight(null);
  refreshIcons();
});

densitySwitchEl?.addEventListener("click", () => {
  const newDensity = activeDensity === "compact" ? "detailed" : "compact";
  setDensity(newDensity);
});

sidePanelEl?.addEventListener("mouseover", (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-type]");
  if (target && target.dataset.type) {
    handleCrossHighlight(target.dataset.type);
  }
});

sidePanelEl?.addEventListener("mouseleave", () => {
  handleCrossHighlight(null);
});

synergyModalContent?.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-synergy-add]");
  if (!btn) return;
  const pId = Number(btn.dataset.synergyAdd);
  const pokemon = pokemonById.get(pId);
  if (!pokemon) return;

  const emptySlotIndex = team.slots.findIndex((s) => s.pokemonId === null);
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  if (emptySlotIndex === -1) {
    toast.info(t.strengthsWeaknesses.teamFull.replace("{max}", String(team.size)));
    return;
  }

  const detail = await getPokemonDetail(pId).catch(() => null);
  const baseStats = detail ? { ...detail.stats } : {};
  const defaultAbility = getDefaultAbility(detail);

  team = setTeamSlot(emptySlotIndex, pId, baseStats, null, defaultAbility);
  renderSingleSlot(emptySlotIndex);
  renderStrengthsPanel();
  toast.success(t.strengthsWeaknesses.teamAddedSuccess.replace("{name}", capitalize(pokemon.name)));
});

offenseModeToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-offense-mode]");
  if (!btn) return;
  const mode = btn.dataset.offenseMode as "moves" | "stab";
  if (!mode || mode === activeOffenseMode) return;

  activeOffenseMode = mode;
  offenseModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-offense-mode]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.offenseMode === activeOffenseMode));
  });

  renderOffensePanel();
  refreshIcons();
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
    renderStrengthsPanel();
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

  const selectItemBtn = target.closest<HTMLElement>("[data-select-item]");
  if (selectItemBtn) {
    if (itemDragJustEnded) return;
    e.stopPropagation();
    const sIdx = Number(selectItemBtn.dataset.slotIndex);
    openItemPicker(sIdx);
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
      openPokemonModal(slot.pokemonId, { slotIndex: idx });
    }
  }
});

// --- Drag and Drop for Pokemon Slots, Move Slots, and Held Items (Desktop & Touch) ---

let draggedItem: { slotIndex: number; itemId: string; droppedOnSlot: boolean } | null = null;
let draggedMove: { slotIndex: number; moveIndex: number } | null = null;
let draggedSlot: number | null = null;

let itemDragJustEnded = false;

slotsEl.addEventListener("dragstart", (e) => {
  const target = e.target as HTMLElement;

  // 1. Item pill dragstart
  const itemPill = target.closest<HTMLElement>(".team-slot__item-pill[draggable='true']");
  if (itemPill) {
    const sIdx = Number(itemPill.dataset.slotIndex);
    const slot = team.slots[sIdx];
    if (slot && slot.item) {
      draggedItem = { slotIndex: sIdx, itemId: slot.item, droppedOnSlot: false };
      draggedMove = null;
      draggedSlot = null;

      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", `item:${sIdx}:${slot.item}`);
        e.dataTransfer.effectAllowed = "move";
      }

      requestAnimationFrame(() => {
        itemPill.classList.add("is-dragging");
      });
      return;
    }
  }

  // 2. Move dragstart
  const moveCard = target.closest<HTMLElement>(".move-slot-card[draggable='true']");
  if (moveCard) {
    if (target.closest("[data-clear-move]")) {
      e.preventDefault();
      return;
    }
    const sIdx = Number(moveCard.dataset.slotIndex);
    const mIdx = Number(moveCard.dataset.moveIndex);
    draggedMove = { slotIndex: sIdx, moveIndex: mIdx };
    draggedSlot = null;
    draggedItem = null;

    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", `move:${sIdx}:${mIdx}`);
      e.dataTransfer.effectAllowed = "move";
    }

    requestAnimationFrame(() => {
      moveCard.classList.add("is-dragging");
    });
    return;
  }

  // 3. Pokemon slot column dragstart
  const slotCol = target.closest<HTMLElement>(".team-slot-column[draggable='true']");
  if (slotCol) {
    if (
      target.closest("[data-remove-slot]") ||
      target.closest("[data-move-slot]") ||
      target.closest(".team-slot-moves") ||
      target.closest(".team-slot__item-pill") ||
      target.closest(".team-slot__item-btn")
    ) {
      e.preventDefault();
      return;
    }

    const sIdx = Number(slotCol.dataset.slotColumn);
    draggedSlot = sIdx;
    draggedMove = null;
    draggedItem = null;

    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", `slot:${sIdx}`);
      e.dataTransfer.effectAllowed = "move";
    }

    requestAnimationFrame(() => {
      slotCol.classList.add("is-slot-dragging");
    });
  }
});

slotsEl.addEventListener("dragend", () => {
  slotsEl.querySelectorAll<HTMLElement>("[data-move-slot]").forEach((el) => {
    el.classList.remove("is-dragging", "is-dragover");
  });
  slotsEl.querySelectorAll<HTMLElement>("[data-slot-column]").forEach((el) => {
    el.classList.remove("is-slot-dragging", "is-slot-dragover", "is-item-dragover");
  });
  slotsEl.querySelectorAll<HTMLElement>(".team-slot__item-pill").forEach((el) => {
    el.classList.remove("is-dragging");
  });

  // If item was dragged and dropped outside (drag ended without dropping on a slot)
  if (draggedItem && !draggedItem.droppedOnSlot) {
    const sIdx = draggedItem.slotIndex;
    team = setTeamSlotItem(sIdx, null);
    renderSingleSlot(sIdx);
    renderStrengthsPanel();
    if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
    const locale = getCurrentLocale();
    toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
    itemDragJustEnded = true;
    setTimeout(() => { itemDragJustEnded = false; }, 100);
  }

  draggedItem = null;
  draggedMove = null;
  draggedSlot = null;
});

slotsEl.addEventListener("dragover", (e) => {
  const target = e.target as HTMLElement;

  if (draggedItem) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
      if (el !== targetCol) el.classList.remove("is-item-dragover");
    });
    if (targetCol) {
      targetCol.classList.add("is-item-dragover");
    }
    return;
  }

  if (draggedMove) {
    const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
    if (!targetSlot) return;

    const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
    if (targetSlotIdx !== draggedMove.slotIndex) return;

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
      if (el !== targetSlot) el.classList.remove("is-dragover");
    });
    targetSlot.classList.add("is-dragover");
    return;
  }

  if (draggedSlot !== null) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    if (!targetCol) return;

    const targetSlotIdx = Number(targetCol.dataset.slotColumn);
    if (targetSlotIdx === draggedSlot) return;

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
      if (el !== targetCol) el.classList.remove("is-slot-dragover");
    });
    targetCol.classList.add("is-slot-dragover");
  }
});

slotsEl.addEventListener("dragleave", (e) => {
  const target = e.target as HTMLElement;
  if (draggedItem) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!targetCol?.contains(related)) {
      targetCol?.classList.remove("is-item-dragover");
    }
  } else if (draggedMove) {
    const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
    targetSlot?.classList.remove("is-dragover");
  } else if (draggedSlot !== null) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!targetCol?.contains(related)) {
      targetCol?.classList.remove("is-slot-dragover");
    }
  }
});

slotsEl.addEventListener("drop", (e) => {
  const target = e.target as HTMLElement;

  if (draggedItem) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
      el.classList.remove("is-item-dragover");
    });

    if (targetCol) {
      const targetSlotIdx = Number(targetCol.dataset.slotColumn);
      draggedItem.droppedOnSlot = true;

      if (targetSlotIdx !== draggedItem.slotIndex) {
        e.preventDefault();
        const targetSlot = team.slots[targetSlotIdx];
        if (targetSlot && targetSlot.pokemonId !== null) {
          const targetPrevItem = targetSlot.item ?? null;
          team = setTeamSlotItem(targetSlotIdx, draggedItem.itemId);
          team = setTeamSlotItem(draggedItem.slotIndex, targetPrevItem);
          renderSingleSlot(draggedItem.slotIndex);
          renderSingleSlot(targetSlotIdx);
          renderStrengthsPanel();
          if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
        }
      }
    } else {
      // Dropped on slotsEl but outside any slot column -> unequip
      e.preventDefault();
      draggedItem.droppedOnSlot = false;
      const sIdx = draggedItem.slotIndex;
      team = setTeamSlotItem(sIdx, null);
      renderSingleSlot(sIdx);
      renderStrengthsPanel();
      if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
      const locale = getCurrentLocale();
      toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
    }

    const itemPill = slotsEl.querySelector<HTMLElement>(`[data-item-pill][data-slot-index="${draggedItem.slotIndex}"]`);
    itemPill?.classList.remove("is-dragging");
    itemDragJustEnded = true;
    setTimeout(() => { itemDragJustEnded = false; }, 100);
    draggedItem = null;
    return;
  }

  if (draggedMove) {
    const targetSlot = target.closest<HTMLElement>("[data-move-slot]");
    if (!targetSlot) return;

    const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
    const targetMoveIdx = Number(targetSlot.dataset.moveIndex);

    slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
      el.classList.remove("is-dragover");
    });

    if (targetSlotIdx === draggedMove.slotIndex && targetMoveIdx !== draggedMove.moveIndex) {
      e.preventDefault();
      team = swapTeamSlotMoves(targetSlotIdx, draggedMove.moveIndex, targetMoveIdx);
      renderSingleSlot(targetSlotIdx);
      renderStrengthsPanel();
    }

    draggedMove = null;
    return;
  }

  if (draggedSlot !== null) {
    const targetCol = target.closest<HTMLElement>("[data-slot-column]");
    if (!targetCol) return;

    const targetSlotIdx = Number(targetCol.dataset.slotColumn);

    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
      el.classList.remove("is-slot-dragover");
    });

    if (targetSlotIdx !== draggedSlot) {
      e.preventDefault();
      team = swapTeamSlots(draggedSlot, targetSlotIdx);
      renderAllSlots();
      renderStrengthsPanel();
    }

    draggedSlot = null;
  }
});

// Document-level dragover and drop to handle dropping items anywhere outside slots
document.addEventListener("dragover", (e) => {
  if (draggedItem) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }
});

document.addEventListener("drop", (e) => {
  if (draggedItem) {
    const target = e.target as HTMLElement;
    if (!slotsEl.contains(target)) {
      e.preventDefault();
      const sIdx = draggedItem.slotIndex;
      team = setTeamSlotItem(sIdx, null);
      renderSingleSlot(sIdx);
      renderStrengthsPanel();
      if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
      const locale = getCurrentLocale();
      toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
      itemDragJustEnded = true;
      setTimeout(() => { itemDragJustEnded = false; }, 100);
    }
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
      el.classList.remove("is-item-dragover");
    });
    const pill = slotsEl.querySelector<HTMLElement>(`[data-item-pill][data-slot-index="${draggedItem.slotIndex}"]`);
    pill?.classList.remove("is-dragging");
    draggedItem = null;
  }
});

// Touch drag & drop support for mobile devices
let touchDragState: {
  slotIndex: number;
  moveIndex: number;
  card: HTMLElement;
} | null = null;

let touchItemDragState: {
  slotIndex: number;
  itemId: string;
  pillEl: HTMLElement;
  startX: number;
  startY: number;
  isDragging: boolean;
} | null = null;

let touchSlotDragState: {
  slotIndex: number;
  columnEl: HTMLElement;
  startX: number;
  startY: number;
  isDragging: boolean;
} | null = null;

slotsEl.addEventListener(
  "touchstart",
  (e) => {
    const target = e.target as HTMLElement;

    // 1. Item pill drag handle
    const itemPill = target.closest<HTMLElement>(".team-slot__item-pill[draggable='true']");
    if (itemPill) {
      const sIdx = Number(itemPill.dataset.slotIndex);
      const slot = team.slots[sIdx];
      if (slot && slot.item) {
        const touch = e.touches[0];
        touchItemDragState = {
          slotIndex: sIdx,
          itemId: slot.item,
          pillEl: itemPill,
          startX: touch.clientX,
          startY: touch.clientY,
          isDragging: false,
        };
        return;
      }
    }

    // 2. Move drag handle
    const moveHandle = target.closest<HTMLElement>("[data-drag-handle]");
    if (moveHandle) {
      const card = moveHandle.closest<HTMLElement>(".move-slot-card");
      if (!card) return;

      const sIdx = Number(card.dataset.slotIndex);
      const mIdx = Number(card.dataset.moveIndex);
      touchDragState = { slotIndex: sIdx, moveIndex: mIdx, card };
      card.classList.add("is-dragging");
      return;
    }

    // 3. Whole filled slot card drag
    const filledSlot = target.closest<HTMLElement>(".team-slot.filled");
    if (filledSlot) {
      if (
        target.closest("[data-remove-slot]") ||
        target.closest("[data-move-slot]") ||
        target.closest(".team-slot-moves") ||
        target.closest(".team-slot__item-pill") ||
        target.closest(".team-slot__item-btn")
      ) {
        return;
      }
      const columnEl = filledSlot.closest<HTMLElement>("[data-slot-column]");
      if (!columnEl) return;

      const sIdx = Number(filledSlot.dataset.slotIndex);
      const touch = e.touches[0];
      touchSlotDragState = {
        slotIndex: sIdx,
        columnEl,
        startX: touch.clientX,
        startY: touch.clientY,
        isDragging: false,
      };
    }
  },
  { passive: true }
);

slotsEl.addEventListener(
  "touchmove",
  (e) => {
    if (touchItemDragState) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchItemDragState.startX;
      const dy = touch.clientY - touchItemDragState.startY;

      if (!touchItemDragState.isDragging) {
        if (Math.hypot(dx, dy) > 8) {
          touchItemDragState.isDragging = true;
          touchItemDragState.pillEl.classList.add("is-dragging");
        }
      }

      if (touchItemDragState.isDragging) {
        if (e.cancelable) e.preventDefault();
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

        slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
          if (el !== targetCol) el.classList.remove("is-item-dragover");
        });

        if (targetCol) {
          targetCol.classList.add("is-item-dragover");
        }
      }
      return;
    }

    if (touchDragState) {
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetSlot = targetEl?.closest<HTMLElement>("[data-move-slot]");

      slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
        if (el !== targetSlot) el.classList.remove("is-dragover");
      });

      if (targetSlot) {
        const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
        if (targetSlotIdx === touchDragState.slotIndex) {
          targetSlot.classList.add("is-dragover");
          if (e.cancelable) e.preventDefault();
        }
      }
      return;
    }

    if (touchSlotDragState) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchSlotDragState.startX;
      const dy = touch.clientY - touchSlotDragState.startY;

      if (!touchSlotDragState.isDragging) {
        if (Math.hypot(dx, dy) > 10) {
          touchSlotDragState.isDragging = true;
          touchSlotDragState.columnEl.classList.add("is-slot-dragging");
        }
      }

      if (touchSlotDragState.isDragging) {
        if (e.cancelable) e.preventDefault();
        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

        slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
          if (el !== targetCol) el.classList.remove("is-slot-dragover");
        });

        if (targetCol) {
          const targetSlotIdx = Number(targetCol.dataset.slotColumn);
          if (targetSlotIdx !== touchSlotDragState.slotIndex) {
            targetCol.classList.add("is-slot-dragover");
          }
        }
      }
    }
  },
  { passive: false }
);

slotsEl.addEventListener("touchend", (e) => {
  if (touchItemDragState) {
    touchItemDragState.pillEl.classList.remove("is-dragging");
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
      el.classList.remove("is-item-dragover");
    });

    if (touchItemDragState.isDragging) {
      itemDragJustEnded = true;
      setTimeout(() => { itemDragJustEnded = false; }, 100);

      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

      if (targetCol) {
        const targetSlotIdx = Number(targetCol.dataset.slotColumn);
        if (targetSlotIdx !== touchItemDragState.slotIndex) {
          const targetSlot = team.slots[targetSlotIdx];
          if (targetSlot && targetSlot.pokemonId !== null) {
            const targetPrevItem = targetSlot.item ?? null;
            team = setTeamSlotItem(targetSlotIdx, touchItemDragState.itemId);
            team = setTeamSlotItem(touchItemDragState.slotIndex, targetPrevItem);
            renderSingleSlot(touchItemDragState.slotIndex);
            renderSingleSlot(targetSlotIdx);
            renderStrengthsPanel();
            if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
          }
        }
      } else {
        // Dragged outside -> remove item!
        team = setTeamSlotItem(touchItemDragState.slotIndex, null);
        renderSingleSlot(touchItemDragState.slotIndex);
        renderStrengthsPanel();
        if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
        const locale = getCurrentLocale();
        toast.info(locale === "es" ? "Objeto quitado" : "Item unequipped");
      }
    }

    touchItemDragState = null;
    return;
  }

  if (touchDragState) {
    touchDragState.card.classList.remove("is-dragging");

    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetSlot = targetEl?.closest<HTMLElement>("[data-move-slot]");

    slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
      el.classList.remove("is-dragover");
    });

    if (targetSlot) {
      const targetSlotIdx = Number(targetSlot.dataset.slotIndex);
      const targetMoveIdx = Number(targetSlot.dataset.moveIndex);
      if (targetSlotIdx === touchDragState.slotIndex && targetMoveIdx !== touchDragState.moveIndex) {
        team = swapTeamSlotMoves(targetSlotIdx, touchDragState.moveIndex, targetMoveIdx);
        renderSingleSlot(targetSlotIdx);
        renderStrengthsPanel();
      }
    }

    touchDragState = null;
    return;
  }

  if (touchSlotDragState) {
    touchSlotDragState.columnEl.classList.remove("is-slot-dragging");

    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCol = targetEl?.closest<HTMLElement>("[data-slot-column]");

    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
      el.classList.remove("is-slot-dragover");
    });

    if (touchSlotDragState.isDragging && targetCol) {
      const targetSlotIdx = Number(targetCol.dataset.slotColumn);
      if (targetSlotIdx !== touchSlotDragState.slotIndex) {
        team = swapTeamSlots(touchSlotDragState.slotIndex, targetSlotIdx);
        renderAllSlots();
        renderStrengthsPanel();
      }
    }

    touchSlotDragState = null;
  }
});

slotsEl.addEventListener("touchcancel", () => {
  if (touchItemDragState) {
    touchItemDragState.pillEl.classList.remove("is-dragging");
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-item-dragover").forEach((el) => {
      el.classList.remove("is-item-dragover");
    });
    touchItemDragState = null;
  }

  if (touchDragState) {
    touchDragState.card.classList.remove("is-dragging");
    slotsEl.querySelectorAll<HTMLElement>("[data-move-slot].is-dragover").forEach((el) => {
      el.classList.remove("is-dragover");
    });
    touchDragState = null;
  }

  if (touchSlotDragState) {
    touchSlotDragState.columnEl.classList.remove("is-slot-dragging");
    slotsEl.querySelectorAll<HTMLElement>("[data-slot-column].is-slot-dragover").forEach((el) => {
      el.classList.remove("is-slot-dragover");
    });
    touchSlotDragState = null;
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
  if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
});

// Cloud sync / import can replace the team from outside this tab's own
// controls — re-render slots and size selector so it shows up without reload.
window.addEventListener(TEAM_CHANGED_EVENT, () => {
  team = getTeam();
  renderAllSlots();
  renderStrengthsPanel();
  if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
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
  const locale = getCurrentLocale();
  teamCardPreview.innerHTML = renderTeamCardHTML(team, pokemonMap, locale, moveDetailsMap);
  refreshIcons();
  teamCardOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeTeamCardModal(): void {
  if (!teamCardOverlay) return;
  teamCardOverlay.hidden = true;
  updateBodyScrollLock();
}

const openTypeMatrixBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-type-matrix]");
const typeMatrixOverlay = document.querySelector<HTMLElement>("[data-type-matrix-overlay]");
const typeMatrixCloseBtn = document.querySelector<HTMLButtonElement>("[data-type-matrix-close]");
const typeMatrixContent = document.querySelector<HTMLElement>("[data-type-matrix-content]");

let activeMatrixMode: "defense" | "offense" = "defense";

function renderTypeMatrix(): void {
  if (!typeMatrixContent || !typeChart) return;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  const activeMembers = team.slots
    .map((s) => {
      if (s.pokemonId === null) return null;
      const p = pokemonById.get(s.pokemonId);
      return p ? { pokemon: p, slot: s } : null;
    })
    .filter((m): m is { pokemon: Pokemon; slot: TeamSlotState } => m !== null);

  if (!activeMembers.length) {
    typeMatrixContent.innerHTML = `
      <p class="side-panel__empty" style="text-align: center; padding: 40px 20px;">
        <i data-lucide="info" style="margin-bottom: 8px;"></i><br />
        ${t.team.typeMatrixEmpty}
      </p>
    `;
    refreshIcons();
    return;
  }

  const modeToolbar = `
    <div class="type-matrix-toolbar">
      <div class="view-toggle" data-matrix-mode-toggle>
        <button class="view-toggle__btn" type="button" data-matrix-mode="defense" aria-pressed="${String(activeMatrixMode === "defense")}">
          <i data-lucide="shield"></i> ${t.strengthsWeaknesses.tabDefense}
        </button>
        <button class="view-toggle__btn" type="button" data-matrix-mode="offense" aria-pressed="${String(activeMatrixMode === "offense")}">
          <i data-lucide="swords"></i> ${t.strengthsWeaknesses.tabOffense}
        </button>
      </div>
      <div class="table-scroll-hint" aria-hidden="true">
        <span>${locale === "es" ? "← Deslizá horizontalmente para ver los 18 tipos →" : "← Scroll horizontally to see all 18 types →"}</span>
      </div>
    </div>
  `;

  // Header row
  const headerCols = typeChart.types
    .map(
      (type) => `
      <th class="type-matrix__th-type" title="${getTypeName(type, locale)}">
        <span class="type-badge type-badge--sm" data-type="${type}" style="--badge-bg:${typeColor(type)}; font-size: 10px; padding: 2px 4px;">
          ${getTypeName(type, locale).slice(0, 3)}
        </span>
      </th>
    `
    )
    .join("");

  // Body rows
  const rowsHtml = activeMembers
    .map(({ pokemon, slot }) => {
      const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
      const typesHtml = pokemon.types
        .map((ty) => `<span class="type-badge type-badge--sm" data-type="${ty}" style="--badge-bg:${typeColor(ty)}; font-size: 9.5px; padding: 1px 4px;">${getTypeName(ty, locale)}</span>`)
        .join("");

      const cellsHtml = typeChart!.types
        .map((type) => {
          if (activeMatrixMode === "defense") {
            const mult = getTypeMultiplier(typeChart!, type, pokemon.types, {
              item: slot.item,
              speciesId: pokemon.id,
              ability: slot.ability,
            });
            let badgeClass = "matrix-badge--1x";
            let label = "-";

            if (mult === 0) {
              badgeClass = "matrix-badge--immune";
              label = "0";
            } else if (mult >= 4) {
              badgeClass = "matrix-badge--4x";
              label = "4×";
            } else if (mult > 1) {
              badgeClass = "matrix-badge--2x";
              label = "2×";
            } else if (mult <= 0.25) {
              badgeClass = "matrix-badge--quarter";
              label = "¼";
            } else if (mult < 1) {
              badgeClass = "matrix-badge--half";
              label = "½";
            }

            return `
              <td>
                <span class="matrix-badge ${badgeClass}" title="${capitalize(pokemon.name)} vs ${getTypeName(type, locale)}: ${mult}×">${label}</span>
              </td>
            `;
          } else {
            let bestMult = 1;
            const sources: string[] = [];

            if (slot.moves && slot.moves.length) {
              for (const moveName of slot.moves) {
                if (!moveName) continue;
                const meta = moveDetailsMap[moveName];
                if (meta && meta.category !== "status") {
                  sources.push(meta.type);
                }
              }
            }
            if (!sources.length) {
              sources.push(...pokemon.types);
            }

            for (const sType of sources) {
              const m = typeChart!.chart[sType]?.[type] ?? 1;
              if (m > bestMult) bestMult = m;
              else if (bestMult === 1 && m < 1) bestMult = m;
            }

            let badgeClass = "matrix-badge--1x";
            let label = "-";
            if (bestMult >= 2) {
              badgeClass = "matrix-badge--super";
              label = `${bestMult}×`;
            } else if (bestMult === 0) {
              badgeClass = "matrix-badge--immune";
              label = "0";
            } else if (bestMult < 1) {
              badgeClass = "matrix-badge--notvery";
              label = "½";
            }

            return `
              <td>
                <span class="matrix-badge ${badgeClass}" title="${capitalize(pokemon.name)} → ${getTypeName(type, locale)}: ${bestMult}×">${label}</span>
              </td>
            `;
          }
        })
        .join("");

      return `
        <tr>
          <td class="type-matrix__col-pkmn">
            <div class="type-matrix__pkmn-cell">
              <img class="type-matrix__pkmn-sprite" src="${sprite}" alt="${pokemon.name}" loading="lazy" />
              <div>
                <div class="type-matrix__pkmn-name">${capitalize(pokemon.name)}</div>
                <div class="type-matrix__pkmn-types">${typesHtml}</div>
              </div>
            </div>
          </td>
          ${cellsHtml}
        </tr>
      `;
    })
    .join("");

  // Summary / Footer row
  const summaryCells = typeChart.types
    .map((type) => {
      if (activeMatrixMode === "defense") {
        let weak = 0;
        let resist = 0;
        let immune = 0;

        for (const { pokemon } of activeMembers) {
          const mult = getTypeMultiplier(typeChart!, type, pokemon.types);
          if (mult === 0) immune++;
          else if (mult > 1) weak++;
          else if (mult < 1) resist++;
        }

        const netScore = (resist + immune) - weak;
        const balanceClass = netScore < 0 ? "matrix-balance--neg" : netScore > 0 ? "matrix-balance--pos" : "matrix-balance--zero";
        const sign = netScore > 0 ? `+${netScore}` : `${netScore}`;

        return `
          <td>
            <div class="matrix-balance ${balanceClass}" title="${getTypeName(type, locale)}: ${weak} ${locale === "es" ? "débiles" : "weak"} / ${resist} ${locale === "es" ? "resistentes" : "resist"} / ${immune} ${locale === "es" ? "inmunes" : "immune"}">
              <span class="matrix-balance__num">${sign}</span>
              <span class="matrix-balance__sub">${weak}D / ${resist + immune}R</span>
            </div>
          </td>
        `;
      } else {
        let superCount = 0;
        for (const { pokemon, slot } of activeMembers) {
          const slotMoves: (string | null)[] = slot.moves ?? [];
          const sources: string[] = slotMoves
            .map((m: string | null): string | null => (m ? moveDetailsMap[m]?.type ?? null : null))
            .filter((t: string | null): t is string => Boolean(t));
          const effectiveSources = sources.length ? sources : pokemon.types;
          if (effectiveSources.some((st: string) => (typeChart!.chart[st]?.[type] ?? 1) >= 2)) {
            superCount++;
          }
        }

        const balanceClass = superCount > 0 ? "matrix-balance--pos" : "matrix-balance--neg";
        return `
          <td>
            <div class="matrix-balance ${balanceClass}" title="${superCount} ${locale === "es" ? "atacantes con súper eficacia" : "super-effective attackers"}">
              <span class="matrix-balance__num">${superCount}</span>
            </div>
          </td>
        `;
      }
    })
    .join("");

  const legendHtml = activeMatrixMode === "defense"
    ? `
      <div class="type-matrix-legend">
        <span style="font-weight: 700; color: var(--text);">${t.team.legend}:</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--4x">4×</span> ${t.team.legend4x}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--2x">2×</span> ${t.team.legend2x}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--1x">-</span> ${t.team.legend1x}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--half">½</span> ${t.team.legendHalf}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--quarter">¼</span> ${t.team.legendQuarter}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--immune">0</span> ${t.team.legendImmune}</span>
      </div>
    `
    : `
      <div class="type-matrix-legend">
        <span style="font-weight: 700; color: var(--text);">${t.team.legend}:</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--super">2×</span> ${t.strengthsWeaknesses.superEffectiveTypes}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--1x">-</span> ${t.team.legend1x}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--notvery">½</span> ${locale === "es" ? "Poco eficaz" : "Not very effective"}</span>
        <span class="type-matrix-legend__item"><span class="matrix-badge matrix-badge--immune">0</span> ${t.team.legendImmune}</span>
      </div>
    `;

  typeMatrixContent.innerHTML = `
    ${modeToolbar}
    <div class="type-matrix-wrapper">
      <table class="type-matrix-table">
        <thead>
          <tr>
            <th class="type-matrix__col-pkmn" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Pokémon</th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td class="type-matrix__col-pkmn">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text);">
                ${activeMatrixMode === "defense" ? t.team.netBalance : locale === "es" ? "Atacantes 2×" : "2× Attackers"}
              </span>
            </td>
            ${summaryCells}
          </tr>
        </tfoot>
      </table>
    </div>
    ${legendHtml}
  `;

  const modeToggleEl = typeMatrixContent.querySelector<HTMLElement>("[data-matrix-mode-toggle]");
  modeToggleEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-matrix-mode]");
    if (!btn) return;
    const mode = btn.dataset.matrixMode as "defense" | "offense";
    if (!mode || mode === activeMatrixMode) return;
    activeMatrixMode = mode;
    renderTypeMatrix();
    refreshIcons();
  });
}


function openTypeMatrixModal(): void {
  if (!typeMatrixOverlay || !typeMatrixContent) return;
  renderTypeMatrix();
  typeMatrixOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  refreshIcons();
}

function closeTypeMatrixModal(): void {
  if (!typeMatrixOverlay) return;
  typeMatrixOverlay.hidden = true;
  updateBodyScrollLock();
}

openTypeMatrixBtns.forEach((btn) => btn.addEventListener("click", openTypeMatrixModal));
typeMatrixCloseBtn?.addEventListener("click", closeTypeMatrixModal);
typeMatrixOverlay?.addEventListener("click", (e) => {
  if (e.target === typeMatrixOverlay) closeTypeMatrixModal();
});

function openSynergyModal(): void {
  if (!synergyModalOverlay || !synergyModalContent) return;
  renderSynergyPanel();
  synergyModalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  refreshIcons();
}

function closeSynergyModal(): void {
  if (!synergyModalOverlay) return;
  synergyModalOverlay.hidden = true;
  updateBodyScrollLock();
}

function openStrengthsGuideModal(): void {
  if (!strengthsGuideOverlay) return;
  strengthsGuideOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  refreshIcons();
}

function closeStrengthsGuideModal(): void {
  if (!strengthsGuideOverlay) return;
  strengthsGuideOverlay.hidden = true;
  updateBodyScrollLock();
}

openSynergyBtns.forEach((btn) => btn.addEventListener("click", openSynergyModal));
synergyModalCloseBtn?.addEventListener("click", closeSynergyModal);
synergyModalOverlay?.addEventListener("click", (e) => {
  if (e.target === synergyModalOverlay) closeSynergyModal();
});

openPanelGuideBtns.forEach((btn) => btn.addEventListener("click", openStrengthsGuideModal));
strengthsGuideCloseBtn?.addEventListener("click", closeStrengthsGuideModal);
strengthsGuideOverlay?.addEventListener("click", (e) => {
  if (e.target === strengthsGuideOverlay) closeStrengthsGuideModal();
});

guideTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.guideTab;
    if (!tabName) return;

    guideTabBtns.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });

    guidePanes.forEach((pane) => {
      pane.hidden = pane.dataset.guidePane !== tabName;
    });

    refreshIcons();
  });
});

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
    if (strengthsGuideOverlay && !strengthsGuideOverlay.hidden) closeStrengthsGuideModal();
    else if (synergyModalOverlay && !synergyModalOverlay.hidden) closeSynergyModal();
    else if (typeMatrixOverlay && !typeMatrixOverlay.hidden) closeTypeMatrixModal();
    else if (teamCardOverlay && !teamCardOverlay.hidden) closeTeamCardModal();
    else if (itemPickerOverlayEl && !itemPickerOverlayEl.hidden) closeItemPicker();
    else if (!movePickerOverlayEl.hidden) closeMovePicker();
    else if (!overlayEl.hidden) closePicker();
  }
});

itemPickerCloseBtn?.addEventListener("click", closeItemPicker);
itemPickerOverlayEl?.addEventListener("click", (e) => {
  if (e.target === itemPickerOverlayEl) closeItemPicker();
});

let itemSearchDebounce: number | undefined;
itemPickerSearchEl?.addEventListener("input", () => {
  window.clearTimeout(itemSearchDebounce);
  itemSearchDebounce = window.setTimeout(() => {
    renderItemPickerResults();
  }, 150);
});

itemCategoryFilterEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-item-category]");
  if (!btn) return;
  activeItemCategory = btn.dataset.itemCategory!;
  itemCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-item-category]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b === btn));
  });
  renderItemPickerResults();
});

itemPickerResultsEl?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const removeBtn = target.closest<HTMLButtonElement>("[data-remove-item-picker]");
  if (removeBtn) {
    if (activeItemSlotIndex !== null) {
      team = setTeamSlotItem(activeItemSlotIndex, null);
      renderSingleSlot(activeItemSlotIndex);
      renderStrengthsPanel();
      if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
      closeItemPicker();
    }
    return;
  }

  const pickBtn = target.closest<HTMLElement>("[data-pick-item]");
  if (pickBtn) {
    const itemId = pickBtn.dataset.pickItem;
    if (activeItemSlotIndex !== null && itemId) {
      team = setTeamSlotItem(activeItemSlotIndex, itemId);
      renderSingleSlot(activeItemSlotIndex);
      renderStrengthsPanel();
      if (typeMatrixOverlay && !typeMatrixOverlay.hidden) renderTypeMatrix();
      closeItemPicker();
    }
    return;
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
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-pick-move]");
  if (!target || activeMoveSlotIndex === null || activeMoveIndex === null) return;
  const moveName = target.dataset.pickMove!;
  const pokemon = pokemonForSlot(activeMoveSlotIndex);

  team = setTeamSlotMove(activeMoveSlotIndex, activeMoveIndex, moveName);
  renderSingleSlot(activeMoveSlotIndex);
  renderStrengthsPanel();
  closeMovePicker();
  if (pokemon) {
    const locale = getCurrentLocale();
    const meta = moveDetailsMap[moveName];
    const localizedMove = getMoveName(moveName, locale, meta);
    toast.success(
      locale === "es"
        ? `Ataque "${localizedMove}" asignado a ${capitalize(pokemon.name)}.`
        : `Move "${localizedMove}" assigned to ${capitalize(pokemon.name)}.`
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
  const val = pickerMoveFilterEl.value.trim().toLowerCase();
  if (!val) {
    pickerState.move = "";
  } else {
    const match = Object.entries(moveDetailsMap).find(([slug, meta]) => {
      if (slug.toLowerCase() === val) return true;
      if (formatLabel(slug).toLowerCase() === val) return true;
      if (meta.nameEs && meta.nameEs.toLowerCase() === val) return true;
      if (meta.nameEn && meta.nameEn.toLowerCase() === val) return true;
      return false;
    });
    pickerState.move = match ? match[0] : val;
  }
  renderPickerResults();
});

pickerGameFilterEl?.addEventListener("change", () => {
  pickerState.game = pickerGameFilterEl.value;
  setSelectedGame(pickerState.game);
  if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = pickerState.game;
  pickerState.exclusive = new Set(["all"]);
  updatePickerGameModeToggleUI();
  updatePickerExclusiveToggleUI();
  renderStrengthsPanel();
  renderPickerResults();
});

teamHeaderGameSelectEl?.addEventListener("change", () => {
  pickerState.game = teamHeaderGameSelectEl.value;
  setSelectedGame(pickerState.game);
  if (pickerGameFilterEl) pickerGameFilterEl.value = pickerState.game;
  pickerState.exclusive = new Set(["all"]);
  updatePickerGameModeToggleUI();
  updatePickerExclusiveToggleUI();
  renderStrengthsPanel();
  if (!overlayEl.hidden) renderPickerResults();
});

pickerGameModeToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-game-mode]");
  if (!btn) return;
  const mode = btn.dataset.pickerGameMode as GameDexMode;
  if (mode && mode !== pickerState.dexMode) {
    pickerState.dexMode = mode;
    setGameDexMode(mode);
    updatePickerGameModeToggleUI();
    renderStrengthsPanel();
    renderPickerResults();
  }
});

pickerExclusiveToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-exclusive-filter]");
  if (!btn) return;
  const filter = btn.dataset.pickerExclusiveFilter;
  if (!filter) return;

  const nonAllButtons = Array.from(
    pickerExclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-exclusive-filter]")
  ).filter((b) => b.dataset.pickerExclusiveFilter !== "all");

  if (filter === "all") {
    pickerState.exclusive = new Set(["all"]);
  } else {
    pickerState.exclusive.delete("all");
    if (pickerState.exclusive.has(filter)) {
      pickerState.exclusive.delete(filter);
    } else {
      pickerState.exclusive.add(filter);
    }
    if (pickerState.exclusive.size === 0 || pickerState.exclusive.size >= nonAllButtons.length) {
      pickerState.exclusive = new Set(["all"]);
    }
  }

  pickerExclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-picker-exclusive-filter]").forEach((b) => {
    b.setAttribute("aria-pressed", String(pickerState.exclusive.has(b.dataset.pickerExclusiveFilter!)));
  });
  renderPickerResults();
});

window.addEventListener(GAME_CHANGED_EVENT, (e) => {
  const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? "";
  if (newGame !== pickerState.game) {
    pickerState.game = newGame;
    if (pickerGameFilterEl) pickerGameFilterEl.value = newGame;
    if (teamHeaderGameSelectEl) teamHeaderGameSelectEl.value = newGame;
    pickerState.exclusive = new Set(["all"]);
    updatePickerGameModeToggleUI();
    updatePickerExclusiveToggleUI();
    renderStrengthsPanel();
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

pickerResultsEl.addEventListener("click", async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-pick]");
  if (!btn || activeSlotIndex === null) return;
  const id = Number(btn.dataset.pokemonId);
  const pokemon = pokemonById.get(id);

  const detail = await getPokemonDetail(id).catch(() => null);
  const baseStats = detail ? { ...detail.stats } : {};
  const defaultAbility = getDefaultAbility(detail);

  team = setTeamSlot(activeSlotIndex, id, baseStats, null, defaultAbility);
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

  // If no game is set yet, try to auto-detect from the current team
  if (!pickerState.game) {
    const autoGame = autoDetectGameFromTeam();
    if (autoGame) {
      pickerState.game = autoGame;
      try {
        localStorage.setItem("poketeam:selected_game", autoGame);
      } catch {}
    }
  }

  populatePickerFilters();
  updateDensityUI();
  renderAllSlots();
  renderStrengthsPanel();
}

init();
