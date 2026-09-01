import { getManifest, getChunk, getAllPokemon, getGenerations, getTypeChart } from "../lib/pokedexData";
import { getCapturedIds, setCaptured, CAPTURED_CHANGED_EVENT } from "../lib/storage";
import { staggerCardsIn, cardHoverTilt, animateCaptureReveal } from "../lib/animations";
import { toast } from "../lib/toast";
import { refreshIcons } from "../lib/icons";
import { typeColor } from "../lib/typeColors";
import { openPokemonModal } from "../lib/pokemonModal";
import type { Pokemon } from "../lib/types";

const PAGE_SIZE = 100;

const grid = document.querySelector<HTMLElement>("[data-pokedex-grid]")!;
const emptyMsg = document.querySelector<HTMLElement>("[data-pokedex-empty]")!;
const loadMoreWrap = document.querySelector<HTMLElement>("[data-load-more-wrap]")!;
const loadMoreBtn = document.querySelector<HTMLButtonElement>("[data-load-more]")!;
const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]")!;
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
const selectedTypes = new Set<string>();
const selectedGenerations = new Set<string>();

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

// Mirrors src/components/PokemonCard.astro — keep both in sync when the markup changes.
function renderCardHTML(p: Pokemon, captured: boolean): string {
  const sprite = p.sprites.officialArtwork ?? p.sprites.default ?? "";
  const typesHtml = p.types
    .map((t) => `<span class="type-badge" style="--badge-bg:${typeColor(t)}">${t}</span>`)
    .join("");

  return `
    <article class="pokemon-card${captured ? " captured" : ""}" data-pokemon-id="${p.id}">
      <div class="pokemon-card__id">${dexNumber(p.id)}</div>
      <div class="pokemon-card__sprite-wrap">
        <img class="pokemon-card__sprite" src="${sprite}" alt="${p.name}" loading="lazy" decoding="async" width="120" height="120" />
      </div>
      <div class="captured-badge"><i data-lucide="circle-dot"></i></div>
      <div class="pokemon-card__name">${p.name}</div>
      <div class="pokemon-card__types">${typesHtml}</div>
      <button class="pokemon-card__capture-btn" type="button" data-capture-btn data-pokemon-id="${p.id}">
        <i data-lucide="${captured ? "check" : "circle-dot"}"></i>
        ${captured ? "Capturado" : "Capturar"}
      </button>
    </article>
  `;
}

function updateCapturedCounter(): void {
  capturedCountEl.textContent = String(getCapturedIds().size);
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
  const card = grid.querySelector<HTMLElement>(`.pokemon-card[data-pokemon-id="${id}"]`);
  if (!card) return;

  card.classList.toggle("captured", captured);
  const btn = card.querySelector<HTMLButtonElement>("[data-capture-btn]");
  if (btn) {
    btn.innerHTML = `<i data-lucide="${captured ? "check" : "circle-dot"}"></i> ${captured ? "Capturado" : "Capturar"}`;
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
  typeFilterEl.innerHTML = types
    .map(
      (t) =>
        `<button class="filter-chip" type="button" data-type="${t}" aria-pressed="false" style="--badge-bg:${typeColor(t)}">${t}</button>`,
    )
    .join("");
}

function populateGenerationChips(generations: { name: string; displayName: string }[]): void {
  genFilterEl.innerHTML = generations
    .map((g) => {
      const label = g.displayName.replace(/^Generación\s*/i, "");
      return `<button class="filter-chip" type="button" data-generation="${g.name}" aria-pressed="false">${label}</button>`;
    })
    .join("");
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

  animatingIds.add(id);
  setCaptured(id, nowCaptured);
  btn.innerHTML = `<i data-lucide="${nowCaptured ? "check" : "circle-dot"}"></i> ${nowCaptured ? "Capturado" : "Capturar"}`;
  refreshIcons();

  if (nowCaptured) {
    animateCaptureReveal(card).then(() => {
      refreshIcons();
      animatingIds.delete(id);
    });
    toast.success(`¡${capitalize(name)} capturado!`);
  } else {
    card.classList.remove("captured");
    animatingIds.delete(id);
    toast.info(`${capitalize(name)} liberado de tu Pokédex.`);
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

// --- init ------------------------------------------------------------

async function init(): Promise<void> {
  const manifest = await getManifest();
  manifestTotal = manifest.totalCount;
  totalCountEl.textContent = String(manifest.totalCount);
  updateCapturedCounter();

  const chunk0 = await getChunk(0);
  filtered = chunk0;
  renderNextBatch();

  cardHoverTilt(grid);
  getAllPokemon(); // warm cache in background for filters/load-more
  getTypeChart().then((chart) => populateTypeChips(chart.types));
  getGenerations().then(populateGenerationChips);
}

init();
