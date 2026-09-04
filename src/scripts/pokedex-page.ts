import { getManifest, getChunk, getAllPokemon, getGenerations, getTypeChart, getGameDexData, getMoveDetailsMap } from "../lib/pokedexData";
import {
  getCapturedIds,
  setCaptured,
  CAPTURED_CHANGED_EVENT,
  getSelectedGame,
  setSelectedGame,
  GAME_CHANGED_EVENT,
  getGameDexMode,
  setGameDexMode,
  GAME_DEX_MODE_CHANGED_EVENT,
  DATA_RESET_EVENT,
} from "../lib/storage";
import { staggerCardsIn, cardHoverTilt, animateCaptureReveal } from "../lib/animations";
import { getCurrentLocale, getTranslations, getTypeName, getGameTitle, getRegionName, getMoveName } from "../lib/i18n/translations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import { openPokemonModal } from "../lib/pokemonModal";
import type { GameDexData, GameDexMode, GameVersionMeta, GenerationInfo, MoveData, Pokemon } from "../lib/types";

const PAGE_SIZE = 100;

const grid = document.querySelector<HTMLElement>("[data-pokedex-grid]")!;
const emptyMsg = document.querySelector<HTMLElement>("[data-pokedex-empty]")!;
const loadMoreWrap = document.querySelector<HTMLElement>("[data-load-more-wrap]")!;
const loadMoreBtn = document.querySelector<HTMLButtonElement>("[data-load-more]")!;
const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]")!;
const gameFilterEl = document.querySelector<HTMLSelectElement>("[data-game-filter]")!;
const gameModeToggleEl = document.querySelector<HTMLElement>("[data-game-mode-toggle]");
const exclusiveToggleEl = document.querySelector<HTMLElement>("[data-exclusive-toggle]");
const typeFilterEl = document.querySelector<HTMLElement>("[data-type-filter]")!;
const genFilterEl = document.querySelector<HTMLElement>("[data-generation-filter]")!;
const viewToggleEl = document.querySelector<HTMLElement>("[data-view-toggle]")!;
const capturedCountEl = document.querySelector<HTMLElement>("[data-captured-count]")!;
const totalCountEl = document.querySelector<HTMLElement>("[data-total-count]")!;
const filterToggleBtn = document.querySelector<HTMLButtonElement>("[data-filter-toggle]");
const filtersPanelEl = document.querySelector<HTMLElement>("[data-filters-panel]");
const filterActiveCountEl = document.querySelector<HTMLElement>("[data-filter-active-count]");
const clearFiltersBtn = document.querySelector<HTMLButtonElement>("[data-clear-filters]");
const closeFiltersBtn = document.querySelector<HTMLButtonElement>("[data-close-filters]");

const movesInputEl = document.querySelector<HTMLInputElement>("[data-moves-input]");
const clearMovesInputBtn = document.querySelector<HTMLButtonElement>("[data-clear-moves-input]");
const movesDropdownEl = document.querySelector<HTMLElement>("[data-moves-dropdown]");
const movesTagsEl = document.querySelector<HTMLElement>("[data-moves-tags]");
const movesSummaryEl = document.querySelector<HTMLElement>("[data-moves-summary]");
const movesFilterContainer = document.querySelector<HTMLElement>("[data-moves-filter-container]");

let allPokemon: Pokemon[] = [];
let allPokemonReady = false;
let filtered: Pokemon[] = [];
let shown = 0;
let manifestTotal = 0;
let view: "all" | "captured" = "all";
let search = "";
let selectedGame = getSelectedGame();
let selectedGameMode: GameDexMode = getGameDexMode();
let selectedExclusiveFilters = new Set<string>(["all"]);
let gameDexData: GameDexData | null = null;
let activeExclusivesMap = new Map<number, GameVersionMeta>();
const gameSpeciesSets = new Map<string, { regional: Set<number>; obtainable: Set<number> }>();
const selectedTypes = new Set<string>();
const selectedGenerations = new Set<string>();
const selectedMoves = new Set<string>();
let moveDetailsMap: Record<string, MoveData> = {};
const moveCountMap = new Map<string, number>();
let highlightedMoveIndex = -1;
let currentMoveMatches: MoveData[] = [];
const gameToGenMap = new Map<string, GenerationInfo>();

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

// Mirrors src/components/PokemonCard.astro — keep both in sync when the markup changes.
function renderCardHTML(p: Pokemon, captured: boolean): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? "";
  const typesHtml = p.types
    .map((type) => `<span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>`)
    .join("");

  const primaryType = p.types[0] ?? "normal";
  const glowColor = typeColor(primaryType);

  let exclusiveBadgeHtml = "";
  if (selectedGame && activeExclusivesMap.has(p.id)) {
    const meta = activeExclusivesMap.get(p.id)!;
    const vName = locale === "es" ? meta.nameEs : meta.name;
    const badgeTitle = t.pokedex.exclusiveBadge.replace("{version}", vName);
    exclusiveBadgeHtml = `
      <span class="exclusive-badge" style="--version-color:${meta.color};" title="${badgeTitle}">
        <span class="exclusive-badge__dot"></span>
        <span class="exclusive-badge__label">${vName}</span>
      </span>
    `;
  }

  return `
    <article class="pokemon-card${captured ? " captured" : ""}" data-pokemon-id="${p.id}" style="--type-glow:${glowColor};">
      <div class="pokemon-card__header">
        <span class="pokemon-card__id">${dexNumber(p.id)}</span>
        ${exclusiveBadgeHtml}
      </div>
      <div class="pokemon-card__sprite-wrap">
        <img class="pokemon-card__sprite" src="${sprite}" alt="${p.name}" loading="lazy" decoding="async" width="120" height="120" />
      </div>
      <div class="captured-badge"><i data-lucide="circle-dot"></i></div>
      <div class="pokemon-card__name">${p.name}</div>
      <div class="pokemon-card__types">${typesHtml}</div>
      <button class="pokemon-card__capture-btn" type="button" data-capture-btn data-pokemon-id="${p.id}">
        <i data-lucide="${captured ? "check" : "circle-dot"}"></i>
        ${captured ? t.pokedex.caught : t.pokedex.catch}
      </button>
    </article>
  `;
}

function getExclusiveMapForGame(game: string): Map<number, GameVersionMeta> {
  const map = new Map<number, GameVersionMeta>();
  if (!game || !gameDexData || !gameDexData[game]) return map;
  const entry = gameDexData[game];
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

function updateExclusiveToggleUI(): void {
  if (!exclusiveToggleEl) return;
  const entry = selectedGame && gameDexData ? gameDexData[selectedGame] : null;
  const hasExclusives = Boolean(entry?.versions && entry.versions.length === 2 && entry.exclusives && Object.keys(entry.exclusives).length > 0);

  if (!hasExclusives) {
    exclusiveToggleEl.hidden = true;
    exclusiveToggleEl.innerHTML = "";
    selectedExclusiveFilters = new Set(["all"]);
    return;
  }

  exclusiveToggleEl.hidden = false;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const [vA, vB] = entry!.versions!;
  const nameA = locale === "es" ? vA.nameEs : vA.name;
  const nameB = locale === "es" ? vB.nameEs : vB.name;

  exclusiveToggleEl.innerHTML = `
    <button class="view-toggle__btn" type="button" data-exclusive-filter="all" aria-pressed="${String(selectedExclusiveFilters.has("all"))}">
      ${t.pokedex.exclusiveAll}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="${vA.id}" aria-pressed="${String(selectedExclusiveFilters.has(vA.id))}" style="--btn-color:${vA.color};">
      <span class="exclusive-dot" style="--btn-color:${vA.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameA)}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="${vB.id}" aria-pressed="${String(selectedExclusiveFilters.has(vB.id))}" style="--btn-color:${vB.color};">
      <span class="exclusive-dot" style="--btn-color:${vB.color};"></span>
      ${t.pokedex.exclusiveOnly.replace("{version}", nameB)}
    </button>
    <button class="view-toggle__btn" type="button" data-exclusive-filter="both" aria-pressed="${String(selectedExclusiveFilters.has("both"))}">
      ${t.pokedex.exclusiveBoth}
    </button>
  `;
}

function getActiveGamePokemonList(game: string): number[] | null {
  if (!game || !gameDexData || !gameDexData[game]) return null;
  const entry = gameDexData[game];
  return selectedGameMode === "obtainable" ? entry.obtainable : entry.regional;
}

function getActiveGameSpeciesSet(game: string): Set<number> | null {
  if (!game) return null;
  const entry = gameSpeciesSets.get(game);
  if (!entry) return null;
  return selectedGameMode === "obtainable" ? entry.obtainable : entry.regional;
}

function updateGameModeToggleUI(): void {
  if (!gameModeToggleEl) return;
  if (!selectedGame) {
    gameModeToggleEl.hidden = true;
    return;
  }
  gameModeToggleEl.hidden = false;
  gameModeToggleEl.querySelectorAll<HTMLButtonElement>("[data-game-mode]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.gameMode === selectedGameMode));
  });
}

function updateCapturedCounter(): void {
  const capturedIds = getCapturedIds();

  if (selectedGame && gameDexData && gameDexData[selectedGame]) {
    const fullGameList = getActiveGamePokemonList(selectedGame)!;
    let targetList = fullGameList;

    if (!selectedExclusiveFilters.has("all") && activeExclusivesMap.size > 0) {
      targetList = fullGameList.filter((id) => {
        const meta = activeExclusivesMap.get(id);
        const category = meta ? meta.id : "both";
        return selectedExclusiveFilters.has(category);
      });
    }

    let countInGame = 0;
    for (const id of targetList) {
      if (capturedIds.has(id)) {
        countInGame++;
      }
    }

    if (capturedCountEl) capturedCountEl.textContent = String(countInGame);
    if (totalCountEl) totalCountEl.textContent = String(targetList.length);
  } else {
    if (capturedCountEl) capturedCountEl.textContent = String(capturedIds.size);
    if (totalCountEl) totalCountEl.textContent = manifestTotal ? String(manifestTotal) : "—";
  }
}

// Ids whose card-level capture animation this page's own grid click just
// started — CAPTURED_CHANGED_EVENT fires synchronously from setCaptured(),
// before that click handler finishes updating the card itself, so the
// cross-source sync below must skip them to avoid stomping the mid-flight
// reveal animation with an instant class toggle.
const animatingIds = new Set<number>();

// Keeps a card in the grid correct when captured state changes from
// somewhere other than clicking that same card (e.g. the detail modal) —
// without this, capturing from the modal left the card behind it stale
// until a full page reload.
function syncCardCapturedState(id: number, captured: boolean): void {
  const card = document.querySelector<HTMLElement>(`.pokemon-card[data-pokemon-id="${id}"]`);
  if (!card) return;
  card.classList.toggle("captured", captured);
  const btn = card.querySelector<HTMLButtonElement>("[data-capture-btn]");
  if (btn) {
    const t = getTranslations(getCurrentLocale());
    btn.innerHTML = `<i data-lucide="${captured ? "check" : "circle-dot"}"></i> ${captured ? t.pokedex.caught : t.pokedex.catch}`;
    refreshIcons();
  }

  if (!captured && view === "captured") applyFilters();
}

// Refreshes every rendered card's captured state at once — used when a bulk
// change (cloud sync, backup import, "merge") replaces the captured set
// rather than toggling a single id.
function syncAllCardsCapturedState(): void {
  const capturedIds = getCapturedIds();
  for (const card of grid.querySelectorAll<HTMLElement>(".pokemon-card")) {
    const id = Number(card.dataset.pokemonId);
    if (!Number.isNaN(id)) syncCardCapturedState(id, capturedIds.has(id));
  }
  if (view === "captured") applyFilters();
}

function categoryLabel(cat: string, locale: "en" | "es"): string {
  const t = getTranslations(locale);
  if (cat === "physical") return t.team.physical;
  if (cat === "special") return t.team.special;
  if (cat === "status") return t.team.status;
  return cat;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function updateMoveCountMap(): void {
  moveCountMap.clear();
  for (const p of allPokemon) {
    if (p.moves) {
      for (const m of p.moves) {
        moveCountMap.set(m, (moveCountMap.get(m) ?? 0) + 1);
      }
    }
  }
}

function filterMoves(query: string): MoveData[] {
  const q = normalize(query);
  if (!q) return [];
  const allMoves = Object.values(moveDetailsMap);
  const locale = getCurrentLocale();

  interface ScoredMove {
    move: MoveData;
    score: number;
  }

  const scored: ScoredMove[] = [];

  for (const move of allMoves) {
    const nameEsNorm = move.nameEs ? normalize(move.nameEs) : "";
    const nameEnNorm = move.nameEn ? normalize(move.nameEn) : "";
    const slugNorm = normalize(move.name.replace(/-/g, " "));

    const primaryNorm = locale === "es" ? nameEsNorm : nameEnNorm;
    const secondaryNorm = locale === "es" ? nameEnNorm : nameEsNorm;

    let score = -1;

    if (primaryNorm === q) score = 0;
    else if (secondaryNorm === q || slugNorm === q) score = 1;
    else if (primaryNorm.startsWith(q)) score = 2;
    else if (secondaryNorm.startsWith(q) || slugNorm.startsWith(q)) score = 3;
    else if (primaryNorm.includes(q)) score = 4;
    else if (secondaryNorm.includes(q) || slugNorm.includes(q)) score = 5;

    if (score >= 0) {
      scored.push({ move, score });
    }
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const countA = moveCountMap.get(a.move.name) ?? 0;
    const countB = moveCountMap.get(b.move.name) ?? 0;
    if (countB !== countA) return countB - countA;
    return a.move.name.localeCompare(b.move.name);
  });

  return scored.slice(0, 15).map((s) => s.move);
}

function adjustDropdownPosition(): void {
  if (!movesDropdownEl || !movesInputEl) return;
  const inputRect = movesInputEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - inputRect.bottom;
  const spaceAbove = inputRect.top;

  if (spaceBelow < 220 && spaceAbove > spaceBelow) {
    movesDropdownEl.classList.add("is-open-up");
    const maxHeight = Math.max(140, Math.min(300, Math.floor(spaceAbove - 24)));
    movesDropdownEl.style.maxHeight = `${maxHeight}px`;
  } else {
    movesDropdownEl.classList.remove("is-open-up");
    const maxHeight = Math.max(140, Math.min(300, Math.floor(spaceBelow - 24)));
    movesDropdownEl.style.maxHeight = `${maxHeight}px`;
  }
}

function renderMoveDropdown(moves: MoveData[]): void {
  if (!movesDropdownEl) return;
  currentMoveMatches = moves;
  highlightedMoveIndex = -1;

  if (moves.length === 0) {
    const t = getTranslations(getCurrentLocale());
    movesDropdownEl.innerHTML = `<div class="moves-autocomplete__empty">${t.pokedex.noMovesFound}</div>`;
    movesDropdownEl.hidden = false;
    movesInputEl?.setAttribute("aria-expanded", "true");
    adjustDropdownPosition();
    return;
  }

  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  let html = moves
    .map((move, idx) => {
      const isSelected = selectedMoves.has(move.name);
      const displayName = getMoveName(move.name, locale, move);
      const secondaryName =
        locale === "es"
          ? move.nameEn && move.nameEn.toLowerCase() !== displayName.toLowerCase()
            ? move.nameEn
            : ""
          : move.nameEs && move.nameEs.toLowerCase() !== displayName.toLowerCase()
            ? move.nameEs
            : "";

      const pCount = moveCountMap.get(move.name) ?? 0;
      const countLabel = t.pokedex.moveLearnedBy.replace("{count}", String(pCount));
      const powerLabel = move.power !== null ? `${locale === "es" ? "Pot" : "Pwr"}: ${move.power}` : "";
      const accLabel = move.accuracy !== null ? `${locale === "es" ? "Prec" : "Acc"}: ${move.accuracy}%` : "";
      const catLabel = categoryLabel(move.category, locale);

      const statsParts = [powerLabel, accLabel].filter(Boolean).join(" • ");

      return `
        <div
          class="moves-autocomplete-item${isSelected ? " is-selected" : ""}"
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
                ${secondaryName ? `<span class="moves-autocomplete-item__subtitle">(${secondaryName})</span>` : ""}
              </div>
              <div class="moves-autocomplete-item__meta-row">
                <span class="move-category-badge move-category-badge--${move.category}">${catLabel}</span>
                ${statsParts ? `<span class="moves-autocomplete-item__meta-sep">•</span><span>${statsParts}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="moves-autocomplete-item__right">
            <span class="moves-sugg__count">${countLabel}</span>
            ${isSelected ? `<span class="moves-sugg__check"><i data-lucide="check"></i></span>` : ""}
          </div>
        </div>
      `;
    })
    .join("");

  movesDropdownEl.innerHTML = html;
  movesDropdownEl.hidden = false;
  movesInputEl?.setAttribute("aria-expanded", "true");
  adjustDropdownPosition();
  refreshIcons();
}

function closeMovesDropdown(): void {
  if (!movesDropdownEl) return;
  movesDropdownEl.hidden = true;
  movesDropdownEl.classList.remove("is-open-up");
  movesDropdownEl.style.maxHeight = "";
  movesInputEl?.setAttribute("aria-expanded", "false");
  highlightedMoveIndex = -1;
  currentMoveMatches = [];
}

function updateHighlightedOption(): void {
  if (!movesDropdownEl) return;
  const items = movesDropdownEl.querySelectorAll<HTMLElement>(".moves-autocomplete-item");
  items.forEach((item, idx) => {
    const isHigh = idx === highlightedMoveIndex;
    item.classList.toggle("is-highlighted", isHigh);
    item.setAttribute("aria-selected", String(isHigh));
    if (isHigh) {
      item.scrollIntoView({ block: "nearest" });
    }
  });
}

function renderSelectedMoveTags(): void {
  if (!movesTagsEl || !movesSummaryEl) return;

  if (selectedMoves.size === 0) {
    movesTagsEl.hidden = true;
    movesTagsEl.innerHTML = "";
    movesSummaryEl.hidden = true;
    movesSummaryEl.innerHTML = "";
    return;
  }

  movesTagsEl.hidden = false;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  let tagsHtml = Array.from(selectedMoves)
    .map((slug) => {
      const meta = moveDetailsMap[slug];
      const displayName = getMoveName(slug, locale, meta);
      const tColor = meta ? typeColor(meta.type) : "var(--accent)";
      const removeAria = t.pokedex.removeMove.replace("{move}", displayName);
      return `
        <span class="moves-tag" style="--tag-border:${tColor};">
          <span class="moves-tag__dot" style="background:${tColor};"></span>
          <span class="moves-tag__name">${displayName}</span>
          <button class="moves-tag__remove" type="button" data-remove-move="${slug}" aria-label="${removeAria}" title="${removeAria}">
            <i data-lucide="x"></i>
          </button>
        </span>
      `;
    })
    .join("");

  if (selectedMoves.size > 1) {
    tagsHtml += `
      <button class="moves-tags__clear-all" type="button" data-clear-all-moves>
        <i data-lucide="trash-2"></i> ${t.pokedex.clearMoves}
      </button>
    `;
  }

  movesTagsEl.innerHTML = tagsHtml;
  refreshIcons();

  movesSummaryEl.hidden = false;
  const moveNamesList = Array.from(selectedMoves).map((s) => getMoveName(s, locale, moveDetailsMap[s]));
  const formattedNames = moveNamesList.join(locale === "es" ? " Y " : " & ");
  const matchesCount = filtered.length;

  if (matchesCount === 0) {
    movesSummaryEl.className = "moves-filter-summary moves-filter-summary--empty";
    movesSummaryEl.innerHTML = `<i data-lucide="info"></i> ${
      locale === "es"
        ? `Ningún Pokémon aprende simultáneamente: <strong>${formattedNames}</strong>`
        : `No Pokémon learns simultaneously: <strong>${formattedNames}</strong>`
    }`;
  } else {
    movesSummaryEl.className = "moves-filter-summary moves-filter-summary--active";
    movesSummaryEl.innerHTML = `<i data-lucide="check-circle-2"></i> ${
      locale === "es"
        ? `${matchesCount} Pokémon ${matchesCount === 1 ? "aprende" : "aprenden"} <strong>${formattedNames}</strong>`
        : `${matchesCount} Pokémon ${matchesCount === 1 ? "learns" : "learn"} <strong>${formattedNames}</strong>`
    }`;
  }
  refreshIcons();
}

function toggleSelectedMove(slug: string): void {
  if (selectedMoves.has(slug)) {
    selectedMoves.delete(slug);
  } else {
    selectedMoves.add(slug);
  }
  if (movesInputEl) movesInputEl.value = "";
  if (clearMovesInputBtn) clearMovesInputBtn.hidden = true;
  closeMovesDropdown();
  updateActiveFilterBadge();
  applyFilters();
}

function computeFiltered(source: Pokemon[]): Pokemon[] {
  const capturedIds = getCapturedIds();
  const gameSpeciesSet = getActiveGameSpeciesSet(selectedGame);

  return source.filter((p) => {
    if (view === "captured" && !capturedIds.has(p.id)) return false;
    if (search && !p.name.includes(search) && !String(p.id).includes(search)) return false;
    if (selectedTypes.size && !p.types.some((t) => selectedTypes.has(t))) return false;
    if (selectedGenerations.size && !selectedGenerations.has(p.generation)) return false;
    if (gameSpeciesSet && !gameSpeciesSet.has(p.id)) return false;

    if (!selectedExclusiveFilters.has("all") && activeExclusivesMap.size > 0) {
      const meta = activeExclusivesMap.get(p.id);
      const category = meta ? meta.id : "both";
      if (!selectedExclusiveFilters.has(category)) return false;
    }

    if (selectedMoves.size > 0) {
      for (const m of selectedMoves) {
        if (!p.moves || !p.moves.includes(m)) return false;
      }
    }

    return true;
  });
}

function renderNextBatch(): void {
  const capturedIds = getCapturedIds();
  const next = filtered.slice(shown, shown + PAGE_SIZE);

  if (next.length) {
    const template = document.createElement("template");
    template.innerHTML = next.map((p) => renderCardHTML(p, capturedIds.has(p.id))).join("");
    const newEls = Array.from(template.content.children) as HTMLElement[];
    grid.append(...newEls);
    shown += next.length;
    refreshIcons();
    staggerCardsIn(newEls);
  }

  emptyMsg.hidden = filtered.length > 0 || shown > 0;
  loadMoreWrap.hidden = allPokemonReady ? shown >= filtered.length : shown >= manifestTotal;
}

async function applyFilters(): Promise<void> {
  if (!allPokemonReady) {
    allPokemon = await getAllPokemon();
    allPokemonReady = true;
    updateMoveCountMap();
  }
  filtered = computeFiltered(allPokemon);
  shown = 0;
  grid.innerHTML = "";
  renderNextBatch();
  renderSelectedMoveTags();
}

function populateTypeChips(types: string[]): void {
  const locale = getCurrentLocale();
  const chips = types
    .map(
      (t) =>
        `<button class="filter-chip" type="button" data-type="${t}" aria-pressed="${String(selectedTypes.has(t))}" style="--badge-bg:${typeColor(t)}">${getTypeName(t, locale)}</button>`,
    )
    .join("");

  typeFilterEl.innerHTML = `<div class="filter-group__row">${chips}</div>`;
}

function populateGenerationChips(generations: GenerationInfo[]): void {
  const chips = generations
    .map((g) => {
      const label = g.displayName.replace(/^(Generación|Generation)\s*/i, "");
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="${String(selectedGenerations.has(g.name))}">${label}</button>`;
    })
    .join("");

  genFilterEl.innerHTML = `<div class="filter-group__row">${chips}</div>`;
}

function populateGameSelect(generations: GenerationInfo[]): void {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
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

  if (gameFilterEl) {
    gameFilterEl.innerHTML = html;
    gameFilterEl.value = selectedGame;
  }
}

// --- filter collapse & active badge --------------------------------------

const STORAGE_KEY_FILTERS_EXPANDED = "poketeam:pokedex-filters-expanded";

function isMobile(): boolean {
  return window.innerWidth <= 820;
}

let filtersExpanded = !isMobile();

function updateFiltersCollapseUI(expanded: boolean): void {
  if (!filtersPanelEl || !filterToggleBtn) return;

  filtersExpanded = expanded;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  if (expanded) {
    filtersPanelEl.classList.remove("is-collapsed");
    filtersPanelEl.classList.add("is-expanded");
    filterToggleBtn.setAttribute("aria-expanded", "true");
    filterToggleBtn.classList.add("is-panel-open");
    filterToggleBtn.title = t.pokedex.hideFilters;
    filterToggleBtn.setAttribute("aria-label", t.pokedex.hideFilters);
  } else {
    filtersPanelEl.classList.add("is-collapsed");
    filtersPanelEl.classList.remove("is-expanded");
    filterToggleBtn.setAttribute("aria-expanded", "false");
    filterToggleBtn.classList.remove("is-panel-open");
    filterToggleBtn.title = t.pokedex.showFilters;
    filterToggleBtn.setAttribute("aria-label", t.pokedex.showFilters);
  }
}

function toggleFilters(): void {
  const willExpand = !filtersExpanded;
  updateFiltersCollapseUI(willExpand);
  try {
    sessionStorage.setItem(STORAGE_KEY_FILTERS_EXPANDED, String(willExpand));
  } catch {
    // Ignore storage issues
  }
}

function updateActiveFilterBadge(): void {
  let count = 0;
  if (selectedGame) count++;
  if (!selectedExclusiveFilters.has("all")) {
    count += selectedExclusiveFilters.size;
  }
  count += selectedTypes.size;
  count += selectedGenerations.size;
  count += selectedMoves.size;

  if (filterActiveCountEl) {
    if (count > 0) {
      filterActiveCountEl.textContent = String(count);
      filterActiveCountEl.hidden = false;
    } else {
      filterActiveCountEl.hidden = true;
    }
  }

  if (filterToggleBtn) {
    filterToggleBtn.classList.toggle("has-active-filters", count > 0);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.hidden = count === 0;
  }
}

function clearAllFilters(): void {
  let changed = false;

  if (selectedGame) {
    selectedGame = "";
    setSelectedGame("");
    if (gameFilterEl) gameFilterEl.value = "";
    activeExclusivesMap.clear();
    selectedExclusiveFilters = new Set(["all"]);
    updateGameModeToggleUI();
    updateExclusiveToggleUI();
    changed = true;
  } else if (!selectedExclusiveFilters.has("all")) {
    selectedExclusiveFilters = new Set(["all"]);
    updateExclusiveToggleUI();
    changed = true;
  }

  if (selectedTypes.size > 0) {
    selectedTypes.clear();
    typeFilterEl.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((btn) => {
      btn.setAttribute("aria-pressed", "false");
    });
    changed = true;
  }

  if (selectedGenerations.size > 0) {
    selectedGenerations.clear();
    genFilterEl.querySelectorAll<HTMLButtonElement>("[data-generation]").forEach((btn) => {
      btn.setAttribute("aria-pressed", "false");
    });
    changed = true;
  }

  if (selectedMoves.size > 0) {
    selectedMoves.clear();
    if (movesInputEl) movesInputEl.value = "";
    if (clearMovesInputBtn) clearMovesInputBtn.hidden = true;
    closeMovesDropdown();
    renderSelectedMoveTags();
    changed = true;
  }

  if (changed) {
    updateCapturedCounter();
    updateActiveFilterBadge();
    applyFilters();
  }
}

// --- event wiring --------------------------------------------------------

grid.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest<HTMLButtonElement>("[data-capture-btn]");

  if (!btn) {
    const card = target.closest<HTMLElement>(".pokemon-card");
    if (card) openPokemonModal(Number(card.dataset.pokemonId));
    return;
  }

  const card = btn.closest<HTMLElement>(".pokemon-card")!;
  const id = Number(btn.dataset.pokemonId);
  const name = card.querySelector(".pokemon-card__name")?.textContent ?? "";
  const nowCaptured = !card.classList.contains("captured");
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  animatingIds.add(id);
  setCaptured(id, nowCaptured);
  btn.innerHTML = `<i data-lucide="${nowCaptured ? "check" : "circle-dot"}"></i> ${nowCaptured ? t.pokedex.caught : t.pokedex.catch}`;
  refreshIcons();

  if (nowCaptured) {
    animateCaptureReveal(card).then(() => {
      refreshIcons();
      animatingIds.delete(id);
    });
    toast.success(locale === "es" ? `¡${capitalize(name)} capturado!` : `${capitalize(name)} caught!`);
  } else {
    card.classList.remove("captured");
    animatingIds.delete(id);
    toast.info(locale === "es" ? `${capitalize(name)} liberado de tu Pokédex.` : `${capitalize(name)} released from your Pokédex.`);
    if (view === "captured") applyFilters();
  }
});

let searchDebounce: number | undefined;
searchInput.addEventListener("input", () => {
  window.clearTimeout(searchDebounce);
  searchDebounce = window.setTimeout(() => {
    search = searchInput.value.trim().toLowerCase();
    applyFilters();
  }, 200);
});

viewToggleEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-view]");
  if (!btn) return;
  view = btn.dataset.view as "all" | "captured";
  viewToggleEl.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  applyFilters();
});

typeFilterEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-type]");
  if (!btn) return;
  const t = btn.dataset.type!;
  const pressed = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", String(!pressed));
  if (pressed) selectedTypes.delete(t);
  else selectedTypes.add(t);
  updateActiveFilterBadge();
  applyFilters();
});

genFilterEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-generation]");
  if (!btn) return;
  const g = btn.dataset.generation!;
  const pressed = btn.getAttribute("aria-pressed") === "true";
  btn.setAttribute("aria-pressed", String(!pressed));
  if (pressed) selectedGenerations.delete(g);
  else selectedGenerations.add(g);
  updateActiveFilterBadge();
  applyFilters();
});

let movesInputDebounce: number | undefined;

movesInputEl?.addEventListener("input", () => {
  window.clearTimeout(movesInputDebounce);
  const q = movesInputEl.value.trim();
  if (clearMovesInputBtn) clearMovesInputBtn.hidden = !q;

  if (!q) {
    closeMovesDropdown();
    return;
  }

  movesInputDebounce = window.setTimeout(() => {
    const currentQ = movesInputEl?.value.trim() ?? "";
    if (!currentQ) {
      closeMovesDropdown();
      return;
    }
    if (!allPokemonReady) {
      getAllPokemon().then((pokemon) => {
        allPokemon = pokemon;
        allPokemonReady = true;
        updateMoveCountMap();
        const curVal = movesInputEl?.value.trim() ?? "";
        if (curVal) {
          renderMoveDropdown(filterMoves(curVal));
        } else {
          closeMovesDropdown();
        }
      });
    } else {
      renderMoveDropdown(filterMoves(currentQ));
    }
  }, 100);
});

movesInputEl?.addEventListener("focus", () => {
  const q = movesInputEl.value.trim();
  if (!q) {
    closeMovesDropdown();
    return;
  }
  if (!allPokemonReady) {
    getAllPokemon().then((pokemon) => {
      allPokemon = pokemon;
      allPokemonReady = true;
      updateMoveCountMap();
      const curVal = movesInputEl?.value.trim() ?? "";
      if (curVal) {
        renderMoveDropdown(filterMoves(curVal));
      } else {
        closeMovesDropdown();
      }
    });
  } else {
    renderMoveDropdown(filterMoves(q));
  }
});

movesInputEl?.addEventListener("keydown", (e) => {
  if (movesDropdownEl && !movesDropdownEl.hidden && currentMoveMatches.length > 0) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedMoveIndex = (highlightedMoveIndex + 1) % currentMoveMatches.length;
      updateHighlightedOption();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedMoveIndex = (highlightedMoveIndex - 1 + currentMoveMatches.length) % currentMoveMatches.length;
      updateHighlightedOption();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const targetIdx = highlightedMoveIndex >= 0 ? highlightedMoveIndex : 0;
      const move = currentMoveMatches[targetIdx];
      if (move) {
        toggleSelectedMove(move.name);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMovesDropdown();
      return;
    }
  } else if (e.key === "Escape") {
    closeMovesDropdown();
  }
});

clearMovesInputBtn?.addEventListener("click", () => {
  if (movesInputEl) {
    movesInputEl.value = "";
    movesInputEl.focus();
  }
  clearMovesInputBtn.hidden = true;
  closeMovesDropdown();
});

window.addEventListener("resize", () => {
  if (movesDropdownEl && !movesDropdownEl.hidden) {
    adjustDropdownPosition();
  }
});

movesDropdownEl?.addEventListener("click", (e) => {
  const item = (e.target as HTMLElement).closest<HTMLElement>(".moves-autocomplete-item");
  if (!item) return;
  const slug = item.dataset.moveSlug;
  if (slug) {
    toggleSelectedMove(slug);
  }
});

movesTagsEl?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const removeBtn = target.closest<HTMLButtonElement>("[data-remove-move]");
  if (removeBtn) {
    const slug = removeBtn.dataset.removeMove;
    if (slug) toggleSelectedMove(slug);
    return;
  }
  const clearAllBtn = target.closest<HTMLButtonElement>("[data-clear-all-moves]");
  if (clearAllBtn) {
    selectedMoves.clear();
    if (movesInputEl) movesInputEl.value = "";
    if (clearMovesInputBtn) clearMovesInputBtn.hidden = true;
    closeMovesDropdown();
    renderSelectedMoveTags();
    updateActiveFilterBadge();
    applyFilters();
  }
});

document.addEventListener("click", (e) => {
  if (!movesFilterContainer?.contains(e.target as Node)) {
    closeMovesDropdown();
  }
});

gameFilterEl?.addEventListener("change", () => {
  selectedGame = gameFilterEl.value;
  setSelectedGame(selectedGame);
  activeExclusivesMap = getExclusiveMapForGame(selectedGame);
  selectedExclusiveFilters = new Set(["all"]);
  updateGameModeToggleUI();
  updateExclusiveToggleUI();
  updateCapturedCounter();
  updateActiveFilterBadge();
  applyFilters();
});

gameModeToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-game-mode]");
  if (!btn) return;
  const mode = btn.dataset.gameMode as GameDexMode;
  if (mode && mode !== selectedGameMode) {
    selectedGameMode = mode;
    setGameDexMode(mode);
    updateGameModeToggleUI();
    updateCapturedCounter();
    applyFilters();
  }
});

exclusiveToggleEl?.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-exclusive-filter]");
  if (!btn) return;
  const filter = btn.dataset.exclusiveFilter;
  if (!filter) return;

  const nonAllButtons = Array.from(
    exclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-exclusive-filter]")
  ).filter((b) => b.dataset.exclusiveFilter !== "all");

  if (filter === "all") {
    selectedExclusiveFilters = new Set(["all"]);
  } else {
    selectedExclusiveFilters.delete("all");
    if (selectedExclusiveFilters.has(filter)) {
      selectedExclusiveFilters.delete(filter);
    } else {
      selectedExclusiveFilters.add(filter);
    }
    if (selectedExclusiveFilters.size === 0 || selectedExclusiveFilters.size >= nonAllButtons.length) {
      selectedExclusiveFilters = new Set(["all"]);
    }
  }

  exclusiveToggleEl.querySelectorAll<HTMLButtonElement>("[data-exclusive-filter]").forEach((b) => {
    b.setAttribute("aria-pressed", String(selectedExclusiveFilters.has(b.dataset.exclusiveFilter!)));
  });
  updateCapturedCounter();
  updateActiveFilterBadge();
  applyFilters();
});

loadMoreBtn.addEventListener("click", async () => {
  if (!allPokemonReady) {
    allPokemon = await getAllPokemon();
    allPokemonReady = true;
    filtered = computeFiltered(allPokemon);
  }
  renderNextBatch();
});

window.addEventListener(CAPTURED_CHANGED_EVENT, (e) => {
  updateCapturedCounter();
  const detail = (e as CustomEvent<{ changedId?: number; captured?: boolean }>).detail;
  if (detail && detail.changedId !== undefined) {
    if (!animatingIds.has(detail.changedId)) {
      syncCardCapturedState(detail.changedId, Boolean(detail.captured));
    }
  } else {
    // Bulk update (cloud sync / import / merge) — no single changedId.
    syncAllCardsCapturedState();
  }
});

window.addEventListener(GAME_CHANGED_EVENT, (e) => {
  const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? "";
  if (newGame !== selectedGame) {
    selectedGame = newGame;
    if (gameFilterEl) gameFilterEl.value = newGame;
    activeExclusivesMap = getExclusiveMapForGame(selectedGame);
    selectedExclusiveFilters = new Set(["all"]);
    updateGameModeToggleUI();
    updateExclusiveToggleUI();
    updateCapturedCounter();
    updateActiveFilterBadge();
    applyFilters();
  }
});

window.addEventListener(GAME_DEX_MODE_CHANGED_EVENT, (e) => {
  const newMode = (e as CustomEvent<{ mode: GameDexMode }>).detail?.mode ?? "regional";
  if (newMode !== selectedGameMode) {
    selectedGameMode = newMode;
    updateGameModeToggleUI();
    updateCapturedCounter();
    applyFilters();
  }
});

window.addEventListener(DATA_RESET_EVENT, () => {
  updateGameModeToggleUI();
  updateExclusiveToggleUI();
  updateCapturedCounter();
  updateActiveFilterBadge();
  for (const card of grid.querySelectorAll<HTMLElement>(".pokemon-card")) {
    card.classList.remove("pokemon-card--captured");
    const btn = card.querySelector<HTMLButtonElement>("[data-capture-btn]");
    if (btn) {
      btn.setAttribute("aria-pressed", "false");
      btn.title = "Marcar como capturado";
    }
  }
});

// --- init ------------------------------------------------------------

async function init(): Promise<void> {
  const manifest = await getManifest();
  manifestTotal = manifest.totalCount;

  let initialExpanded = !isMobile();
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS_EXPANDED);
    if (saved !== null) {
      initialExpanded = saved === "true";
    }
  } catch {
    // Ignore storage issues
  }
  updateFiltersCollapseUI(initialExpanded);
  updateActiveFilterBadge();

  filterToggleBtn?.addEventListener("click", toggleFilters);
  closeFiltersBtn?.addEventListener("click", () => {
    updateFiltersCollapseUI(false);
    try {
      sessionStorage.setItem(STORAGE_KEY_FILTERS_EXPANDED, "false");
    } catch {
      // Ignore
    }
  });
  clearFiltersBtn?.addEventListener("click", clearAllFilters);
  window.addEventListener("resize", () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS_EXPANDED);
      if (saved === null) {
        updateFiltersCollapseUI(!isMobile());
      }
    } catch {
      updateFiltersCollapseUI(!isMobile());
    }
  });

  try {
    gameDexData = await getGameDexData();
    for (const [gname, entry] of Object.entries(gameDexData)) {
      gameSpeciesSets.set(gname, {
        regional: new Set(entry.regional),
        obtainable: new Set(entry.obtainable),
      });
    }
  } catch (err) {
    console.warn("Could not load game dex data:", err);
  }

  activeExclusivesMap = getExclusiveMapForGame(selectedGame);
  updateGameModeToggleUI();
  updateExclusiveToggleUI();
  updateCapturedCounter();

  if (selectedGame) {
    await applyFilters();
  } else {
    const chunk0 = await getChunk(0);
    filtered = chunk0;
    renderNextBatch();
  }

  cardHoverTilt(grid);
  const warmCache = () => {
    const onReady = (pokemon: Pokemon[]) => {
      allPokemon = pokemon;
      allPokemonReady = true;
      updateMoveCountMap();
    };
    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(() => getAllPokemon().then(onReady), { timeout: 3000 });
    } else {
      setTimeout(() => getAllPokemon().then(onReady), 1500);
    }
  };
  warmCache();
  getMoveDetailsMap().then((m) => {
    moveDetailsMap = m;
  });
  getTypeChart().then((chart) => populateTypeChips(chart.types));
  getGenerations().then((gens) => {
    populateGenerationChips(gens);
    populateGameSelect(gens);
    updateGameModeToggleUI();
    updateExclusiveToggleUI();
    updateCapturedCounter();
    updateActiveFilterBadge();
  });
}

init();
