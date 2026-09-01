import { getAllPokemon, getGenerations, getMoveDetailsMap, getMoveIndex, getTypeChart } from "../lib/pokedexData";
import { getPokemonDetail } from "../lib/pokemonDetail";
import { getTeam, setTeam, setTeamSlot, setTeamSlotMove } from "../lib/storage";
import { computeTeamDefense, splitWeaknessesAndResistances, type TeamDefenseEntry } from "../lib/typeChart";
import { badgeBounceIn, barsAnimateIn, slotPopIn, teamSizeTransition } from "../lib/animations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import type { GenerationInfo, MoveData, MoveDetail, Pokemon, TeamState, TypeChart } from "../lib/types";

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

const pickerState = { search: "", types: new Set<string>(), generations: new Set<string>(), move: "" };

const METHOD_LABELS: Record<string, string> = {
  "level-up": "Nivel",
  machine: "MT/MO",
  tutor: "Tutor",
  train: "Tutor",
  egg: "Huevo",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(cat: string): string {
  if (cat === "physical") return "Físico";
  if (cat === "special") return "Especial";
  if (cat === "status") return "Estado";
  return cat;
}

// Mirrors src/components/TeamSlot.astro — keep both in sync when the markup changes.
function renderSlotHTML(index: number, pokemon: Pokemon | null): string {
  if (!pokemon) {
    return `
      <div class="team-slot-column" data-slot-column="${index}">
        <div class="team-slot" data-team-slot data-slot-index="${index}">
          <i data-lucide="plus-circle"></i>
          <span>Elegir Pokémon</span>
        </div>
      </div>
    `;
  }

  const slotData = team.slots[index];
  const slotMoves = Array.from({ length: 4 }, (_, i) => slotData?.moves?.[i] ?? null);

  const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const typesHtml = pokemon.types
    .map((t) => `<span class="type-badge" style="--badge-bg:${typeColor(t)}">${t}</span>`)
    .join("");

  const movesHtml = slotMoves
    .map((moveName, mIdx) => {
      if (!moveName) {
        return `
          <button class="move-slot-btn empty" type="button" data-select-move data-slot-index="${index}" data-move-index="${mIdx}">
            <i data-lucide="plus"></i> <span>Ataque ${mIdx + 1}</span>
          </button>
        `;
      }

      const meta = moveDetailsMap[moveName];
      const typeBadgeHtml = meta
        ? `<span class="type-badge type-badge--sm" style="--badge-bg:${typeColor(meta.type)}">${meta.type}</span>`
        : "";
      const categoryBadgeHtml = meta
        ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category)}</span>`
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
            <button class="move-slot-card__clear" type="button" data-clear-move data-slot-index="${index}" data-move-index="${mIdx}" aria-label="Quitar movimiento">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="move-slot-card__meta">
            ${typeBadgeHtml}
            ${categoryBadgeHtml}
            <span class="move-stat-pill" title="Potencia"><span class="move-stat-label">POT</span> ${powerText}</span>
            <span class="move-stat-pill" title="Puntos de Poder"><span class="move-stat-label">PP</span> ${ppText}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="team-slot-column" data-slot-column="${index}">
      <div class="team-slot filled" data-team-slot data-slot-index="${index}">
        <button class="team-slot__remove-btn" type="button" data-remove-slot data-slot-index="${index}" aria-label="Quitar Pokémon">
          <i data-lucide="x"></i>
        </button>
        <img class="team-slot__sprite" src="${sprite}" alt="${pokemon.name}" loading="lazy" />
        <div class="team-slot__name">${pokemon.name}</div>
        <div class="pokemon-card__types">${typesHtml}</div>
      </div>

      <div class="team-slot-moves">
        <span class="team-slot-moves__title">Ataques</span>
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
      toast.info(`Se ${losing.length === 1 ? "quitó" : "quitaron"} ${losing.length} Pokémon del equipo al reducir el tamaño.`);
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
  const isWeakness = entry.averageMultiplier > 1;
  const isImmunity = entry.averageMultiplier <= 0.001;

  const pct = isImmunity
    ? 100
    : isWeakness
      ? Math.min(100, Math.max(15, (entry.averageMultiplier / 4) * 100))
      : Math.min(100, Math.max(15, (1 - entry.averageMultiplier) * 100));

  return `
    <div class="type-bar">
      <span class="type-bar__type">${entry.type}</span>
      <div class="type-bar__track">
        <div class="type-bar__fill" data-target-width="${pct}%" style="--badge-bg:${typeColor(entry.type)}"></div>
      </div>
      <span class="type-bar__value">${entry.averageMultiplier.toFixed(2)}x</span>
    </div>
  `;
}

function renderStrengthsPanel(): void {
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
    : `<p class="side-panel__empty">Sin debilidades destacadas.</p>`;

  resistancesListEl.innerHTML = resistances.length
    ? resistances.map(renderBarHTML).join("")
    : `<p class="side-panel__empty">Sin resistencias destacadas.</p>`;

  if (immunitiesListEl) {
    immunitiesListEl.innerHTML = immunities.length
      ? immunities.map(renderBarHTML).join("")
      : `<p class="side-panel__empty">Sin inmunidades.</p>`;
  }

  const fills = panelContentEl.querySelectorAll<HTMLElement>(".type-bar__fill");
  barsAnimateIn(fills);
}

// --- pokemon picker --------------------------------------------------

function computePickerFiltered(): Pokemon[] {
  return allPokemon.filter((p) => {
    if (pickerState.search && !p.name.includes(pickerState.search) && !String(p.id).includes(pickerState.search)) return false;
    if (pickerState.types.size && !p.types.some((t) => pickerState.types.has(t))) return false;
    if (pickerState.generations.size && !pickerState.generations.has(p.generation)) return false;
    if (pickerState.move && !p.moves.includes(pickerState.move)) return false;
    return true;
  });
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

function renderPickerResults(): void {
  const results = computePickerFiltered();
  const countEl = overlayEl.querySelector<HTMLElement>("[data-picker-count]");
  if (countEl) {
    countEl.textContent = `${results.length} Pokémon`;
  }

  if (!results.length) {
    pickerResultsEl.innerHTML = `<p class="pokedex-empty">No se encontraron Pokémon con esos filtros.</p>`;
    return;
  }
  pickerResultsEl.innerHTML = results
    .map(
      (p) => `
      <button class="picker-item" type="button" data-picker-pick data-pokemon-id="${p.id}">
        <span class="picker-item__id">${dexNumber(p.id)}</span>
        <img src="${p.sprites.officialArtwork ?? p.sprites.default ?? ""}" alt="${p.name}" loading="lazy" />
        <span class="picker-item__name">${p.name}</span>
      </button>
    `,
    )
    .join("");
}

function openPicker(index: number): void {
  activeSlotIndex = index;
  overlayEl.hidden = false;
  pickerState.search = "";
  pickerState.types.clear();
  pickerState.generations.clear();
  pickerState.move = "";
  pickerSearchEl.value = "";
  pickerMoveFilterEl.value = "";
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
  pickerTypeFilterEl.innerHTML = typeChart!.types
    .map(
      (t) =>
        `<button class="filter-chip" type="button" data-type="${t}" aria-pressed="false" style="--badge-bg:${typeColor(t)}">${t}</button>`,
    )
    .join("");
  pickerGenFilterEl.innerHTML = generations
    .map((g) => {
      const label = g.displayName.replace(/^Generación\s*/i, "");
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="false">${label}</button>`;
    })
    .join("");
  pickerMoveOptionsEl.innerHTML = moveIndex.map((m) => `<option value="${m}"></option>`).join("");

  if (moveTypeFilterEl && typeChart) {
    const allBtn = `<button class="filter-chip" type="button" data-move-type="all" aria-pressed="true">Todos</button>`;
    const typeBtns = typeChart.types
      .map(
        (t) =>
          `<button class="filter-chip" type="button" data-move-type="${t}" aria-pressed="false" style="--badge-bg:${typeColor(t)}">${t}</button>`,
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

  if (movePickerTitleEl) {
    movePickerTitleEl.textContent = `Ataque ${moveIndex + 1} - ${capitalize(pokemon.name)}`;
  }
  movePickerSearchEl.value = "";
  movePickerOverlayEl.hidden = false;

  const methodChips = moveMethodFilterEl?.querySelectorAll<HTMLButtonElement>("[data-method]");
  methodChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.method === "all")));

  const categoryChips = moveCategoryFilterEl?.querySelectorAll<HTMLButtonElement>("[data-category]");
  categoryChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.category === "all")));

  const typeChips = moveTypeFilterEl?.querySelectorAll<HTMLButtonElement>("[data-move-type]");
  typeChips?.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.moveType === "all")));

  movePickerResultsEl.innerHTML = `<div class="pokedex-loading"><i data-lucide="loader-2" class="spin"></i> Cargando movimientos de ${capitalize(pokemon.name)}...</div>`;
  refreshIcons();

  const detail = await getPokemonDetail(pokemon.id);
  if (activeMoveSlotIndex !== slotIndex || activeMoveIndex !== moveIndex) return;

  const rawDetails: MoveDetail[] = detail.moveDetails && detail.moveDetails.length
    ? detail.moveDetails
    : pokemon.moves.map((m) => ({ name: m, method: "level-up", level: 0 }));

  currentMoveRows = rawDetails.map((m) => ({
    name: m.name,
    method: m.method === "train" ? "tutor" : m.method,
    methodLabel: METHOD_LABELS[m.method] ?? formatLabel(m.method),
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
    countEl.textContent = `${filtered.length} ataques`;
  }

  if (!filtered.length) {
    movePickerResultsEl.innerHTML = `<p class="pokedex-empty">No se encontraron movimientos con los filtros seleccionados.</p>`;
    return;
  }

  const rowsHtml = filtered
    .map((r) => {
      const meta = moveDetailsMap[r.name];
      const typeBadgeHtml = meta ? `<span class="type-badge type-badge--sm" style="--badge-bg:${typeColor(meta.type)}">${meta.type}</span>` : "-";
      const categoryBadgeHtml = meta ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category)}</span>` : "-";
      const powerText = meta?.power !== null && meta?.power !== undefined ? meta.power : "-";
      const ppText = meta?.pp !== null && meta?.pp !== undefined ? meta.pp : "-";
      const accuracyText = meta?.accuracy !== null && meta?.accuracy !== undefined ? `${meta.accuracy}%` : "-";
      const levelText = r.method === "level-up" ? `Nv. ${r.level}` : "-";
      const methodBadgeClass = `move-method-badge move-method-badge--${r.method}`;

      return `
        <tr>
          <td class="move-table__cell-name">
            <span class="move-table__name">${formatLabel(r.name)}</span>
          </td>
          <td class="move-table__cell-type">${typeBadgeHtml}</td>
          <td class="move-table__cell-category">${categoryBadgeHtml}</td>
          <td class="move-table__cell-stat">${powerText}</td>
          <td class="move-table__cell-stat">${ppText}</td>
          <td class="move-table__cell-stat">${accuracyText}</td>
          <td class="move-table__cell-method">
            <span class="${methodBadgeClass}">${r.methodLabel}</span>
          </td>
          <td class="move-table__cell-level">${levelText}</td>
          <td class="move-table__cell-action">
            <button class="btn btn--sm btn--primary" type="button" data-pick-move="${r.name}">
              Elegir
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  movePickerResultsEl.innerHTML = `
    <div class="move-table-container">
      <table class="move-table">
        <thead>
          <tr>
            <th>Movimiento</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>POT</th>
            <th>PP</th>
            <th>Prec.</th>
            <th>Método</th>
            <th>Nivel</th>
            <th style="text-align: right;">Acción</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
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
  if (slotEl && !slotEl.classList.contains("filled")) {
    openPicker(Number(slotEl.dataset.slotIndex));
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!movePickerOverlayEl.hidden) closeMovePicker();
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
    toast.success(`Ataque "${formatLabel(moveName)}" asignado a ${capitalize(pokemon.name)}.`);
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

pickerResultsEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-picker-pick]");
  if (!btn || activeSlotIndex === null) return;
  const id = Number(btn.dataset.pokemonId);
  const pokemon = pokemonById.get(id);

  team = setTeamSlot(activeSlotIndex, id);
  renderSingleSlot(activeSlotIndex, true);
  renderStrengthsPanel();
  if (pokemon) toast.success(`${capitalize(pokemon.name)} agregado al equipo.`);
  closePicker();
});

// --- init ---------------------------------------------------------------

async function init(): Promise<void> {
  team = getTeam();
  renderSizeSelector();

  const [full, chart, gens, moves, moveDetails] = await Promise.all([
    getAllPokemon(),
    getTypeChart(),
    getGenerations(),
    getMoveIndex(),
    getMoveDetailsMap(),
  ]);

  allPokemon = full;
  pokemonById = new Map(full.map((p) => [p.id, p]));
  typeChart = chart;
  generations = gens;
  moveIndex = moves;
  moveDetailsMap = moveDetails;

  populatePickerFilters();
  renderAllSlots();
  renderStrengthsPanel();
}

init();
