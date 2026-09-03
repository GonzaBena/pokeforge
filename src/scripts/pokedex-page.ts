import { getManifest, getChunk, getAllPokemon, getGenerations, getTypeChart } from "../lib/pokedexData";
import { getCapturedIds, setCaptured, CAPTURED_CHANGED_EVENT, getSelectedGame, setSelectedGame, GAME_CHANGED_EVENT, DATA_RESET_EVENT } from "../lib/storage";
import { staggerCardsIn, cardHoverTilt, animateCaptureReveal } from "../lib/animations";
import { getCurrentLocale, getTranslations, getTypeName } from "../lib/i18n/translations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import { openPokemonModal } from "../lib/pokemonModal";
import type { GenerationInfo, Pokemon } from "../lib/types";

const PAGE_SIZE = 100;

const grid = document.querySelector<HTMLElement>("[data-pokedex-grid]")!;
const emptyMsg = document.querySelector<HTMLElement>("[data-pokedex-empty]")!;
const loadMoreWrap = document.querySelector<HTMLElement>("[data-load-more-wrap]")!;
const loadMoreBtn = document.querySelector<HTMLButtonElement>("[data-load-more]")!;
const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]")!;
const gameFilterEl = document.querySelector<HTMLSelectElement>("[data-game-filter]")!;
const typeFilterEl = document.querySelector<HTMLElement>("[data-type-filter]")!;
const genFilterEl = document.querySelector<HTMLElement>("[data-generation-filter]")!;
const viewToggleEl = document.querySelector<HTMLElement>("[data-view-toggle]")!;
const capturedCountEl = document.querySelector<HTMLElement>("[data-captured-count]")!;
const totalCountEl = document.querySelector<HTMLElement>("[data-total-count]")!;

let allPokemon: Pokemon[] = [];
let allPokemonReady = false;
let filtered: Pokemon[] = [];
let shown = 0;
let manifestTotal = 0;
let view: "all" | "captured" = "all";
let search = "";
let selectedGame = getSelectedGame();
const selectedTypes = new Set<string>();
const selectedGenerations = new Set<string>();
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

  return `
    <article class="pokemon-card${captured ? " captured" : ""}" data-pokemon-id="${p.id}" style="--type-glow:${glowColor};">
      <div class="pokemon-card__id">${dexNumber(p.id)}</div>
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

function updateCapturedCounter(): void {
  const capturedIds = getCapturedIds();

  if (selectedGame && gameToGenMap.has(selectedGame)) {
    const genInfo = gameToGenMap.get(selectedGame)!;
    const maxId = genInfo.speciesIdRange[1];

    let countInGame = 0;
    for (const id of capturedIds) {
      if (id <= maxId) {
        countInGame++;
      }
    }

    if (capturedCountEl) capturedCountEl.textContent = String(countInGame);
    if (totalCountEl) totalCountEl.textContent = String(maxId);
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

function computeFiltered(source: Pokemon[]): Pokemon[] {
  const capturedIds = getCapturedIds();
  return source.filter((p) => {
    if (view === "captured" && !capturedIds.has(p.id)) return false;
    if (search && !p.name.includes(search) && !String(p.id).includes(search)) return false;
    if (selectedTypes.size && !p.types.some((t) => selectedTypes.has(t))) return false;
    if (selectedGenerations.size && !selectedGenerations.has(p.generation)) return false;
    if (selectedGame) {
      const genInfo = gameToGenMap.get(selectedGame);
      if (genInfo && p.id > genInfo.speciesIdRange[1]) return false;
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
    const newEls = Array.from(template.content.children);
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
  }
  filtered = computeFiltered(allPokemon);
  shown = 0;
  grid.innerHTML = "";
  renderNextBatch();
}

function populateTypeChips(types: string[]): void {
  const locale = getCurrentLocale();
  const chips = types
    .map(
      (t) =>
        `<button class="filter-chip" type="button" data-type="${t}" aria-pressed="false" style="--badge-bg:${typeColor(t)}">${getTypeName(t, locale)}</button>`,
    )
    .join("");

  typeFilterEl.innerHTML = `<div class="filter-group__row">${chips}</div>`;
}

function populateGenerationChips(generations: GenerationInfo[]): void {
  const chips = generations
    .map((g) => {
      const label = g.displayName.replace(/^(Generación|Generation)\s*/i, "");
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="false">${label}</button>`;
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
    const regionLabel = g.region ? ` (${capitalize(g.region)})` : "";
    const genName = locale === "es" ? g.displayName : g.displayName.replace("Generación", "Generation");
    html += `<optgroup label="${genName}${regionLabel}">`;
    for (const vg of g.versionGroups) {
      gameToGenMap.set(vg.name, g);
      html += `<option value="${vg.name}">${vg.displayName}</option>`;
    }
    html += `</optgroup>`;
  }

  if (gameFilterEl) {
    gameFilterEl.innerHTML = html;
    gameFilterEl.value = selectedGame;
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
  applyFilters();
});

gameFilterEl?.addEventListener("change", () => {
  selectedGame = gameFilterEl.value;
  setSelectedGame(selectedGame);
  updateCapturedCounter();
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
  const detail = (e as CustomEvent<{ changedId: number; captured: boolean }>).detail;
  if (detail && !animatingIds.has(detail.changedId)) {
    syncCardCapturedState(detail.changedId, detail.captured);
  }
});

window.addEventListener(GAME_CHANGED_EVENT, (e) => {
  const newGame = (e as CustomEvent<{ game: string }>).detail?.game ?? "";
  if (newGame !== selectedGame) {
    selectedGame = newGame;
    if (gameFilterEl) gameFilterEl.value = newGame;
    updateCapturedCounter();
    applyFilters();
  }
});

window.addEventListener(DATA_RESET_EVENT, () => {
  updateCapturedCounter();
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
  updateCapturedCounter();

  const chunk0 = await getChunk(0);
  filtered = chunk0;
  renderNextBatch();

  cardHoverTilt(grid);
  const warmCache = () => {
    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(() => getAllPokemon(), { timeout: 3000 });
    } else {
      setTimeout(() => getAllPokemon(), 1500);
    }
  };
  warmCache();
  getTypeChart().then((chart) => populateTypeChips(chart.types));
  getGenerations().then((gens) => {
    populateGenerationChips(gens);
    populateGameSelect(gens);
    updateCapturedCounter();
    if (selectedGame) applyFilters();
  });
}

init();
