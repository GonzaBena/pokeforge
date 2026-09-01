import type { ColumnDef } from "@tanstack/table-core";
import { getAllPokemon } from "./pokedexData";
import { getEvolutionChain, getNatures, getPokemonDetail } from "./pokemonDetail";
import {
  getPokemonOverrides,
  getSectionOrder,
  isCaptured,
  setCaptured,
  setPokemonOverrides,
  setSectionOrder,
} from "./storage";
import { animateMedalReveal, modalIn, modalOut, sectionSwap } from "./animations";
import { refreshIcons } from "./icons";
import { typeColor } from "./typeColors";
import { renderDataTable } from "./dataTable";
import { toast } from "./toast";
import type { AcquisitionRow, EvolutionChain, EvolutionNode, MoveDetail, Nature, Pokemon, PokemonDetail, PokemonStats } from "./types";

function getModalElements() {
  const overlayEl = document.querySelector<HTMLElement>("[data-detail-overlay]");
  const panelEl = overlayEl?.querySelector<HTMLElement>(".modal-panel") ?? null;
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-detail-close]");
  const bodyEl = document.querySelector<HTMLElement>("[data-detail-body]");
  return { overlayEl, panelEl, closeBtn, bodyEl };
}

const STAT_KEYS: (keyof PokemonStats)[] = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];
const STAT_LABELS: Record<keyof PokemonStats, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  specialAttack: "SPA",
  specialDefense: "SPD",
  speed: "SPE",
};

const NATURE_STAT_DISPLAY: Record<string, string> = {
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Especial",
  "special-defense": "Def. Especial",
  speed: "Velocidad",
};

const METHOD_LABELS: Record<string, string> = {
  "level-up": "Nivel",
  machine: "MT/MO",
  tutor: "Tutor",
  egg: "Huevo",
};

const TRIGGER_ES: Record<string, string> = {
  trade: "Intercambio",
  "use-item": "Usar objeto",
  shed: "Muda",
  "agile-style-move": "Movimiento estilo ágil",
  "strong-style-move": "Movimiento estilo fuerte",
  "three-critical-hits": "3 golpes críticos",
  "take-damage": "Recibir daño",
  other: "Especial",
};

const SECTION_TITLES: Record<string, string> = {
  location: "Ubicación",
  moves: "Movimientos",
  evolutions: "Evoluciones",
};

interface RenderContext {
  pokemon: Pokemon;
  detail: PokemonDetail;
  chain: EvolutionChain | null;
  natures: Nature[];
  allById: Map<number, Pokemon>;
}

let currentId: number | null = null;
let lastContext: RenderContext | null = null;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLabel(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dexNumber(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

function typeBadgesHtml(types: string[], small = false): string {
  const cls = small ? "type-badge type-badge--sm" : "type-badge";
  return types.map((t) => `<span class="${cls}" style="--badge-bg:${typeColor(t)}">${t}</span>`).join("");
}

interface MoveTableRow {
  name: string;
  method: string;
  methodLabel: string;
  level: number;
}

function buildMoveTableRows(moveDetails: MoveDetail[]): MoveTableRow[] {
  return moveDetails.map((m) => ({
    name: m.name,
    method: m.method,
    methodLabel: METHOD_LABELS[m.method] ?? formatLabel(m.method),
    level: m.level,
  }));
}

function formatGeneration(gen: unknown): string {
  return String(gen ?? "").replace(/^Generación\s*/i, "").trim();
}

const LOCATION_COLUMNS: ColumnDef<AcquisitionRow, unknown>[] = [
  {
    accessorKey: "generation",
    header: "Gen.",
    size: 40,
    cell: (info) => formatGeneration(info.getValue()),
  },
  { accessorKey: "game", header: "Juego", size: 190 },
  { accessorKey: "location", header: "Lugar", size: 160 },
  { accessorKey: "method", header: "Método", size: 260 },
];

const MOVE_COLUMNS: ColumnDef<MoveTableRow, unknown>[] = [
  { accessorKey: "name", header: "Movimiento", size: 220, cell: (info) => formatLabel(String(info.getValue())) },
  { accessorKey: "methodLabel", header: "Método", size: 70 },
  {
    accessorFn: (row) => row.level,
    id: "level",
    header: "Nivel",
    size: 50,
    cell: (info) => (info.row.original.method === "level-up" ? `Nv. ${info.getValue()}` : "-"),
  },
];

function natureEffectText(nature: Nature | null): string {
  if (!nature) return "Elegí una naturaleza para ver su efecto.";
  if (!nature.increasedStat || !nature.decreasedStat) return "Neutral: no modifica ninguna estadística.";
  const up = NATURE_STAT_DISPLAY[nature.increasedStat] ?? nature.increasedStat;
  const down = NATURE_STAT_DISPLAY[nature.decreasedStat] ?? nature.decreasedStat;
  return `Sube ${up} y baja ${down}.`;
}

function evolutionConditionText(node: EvolutionNode): string {
  if (node.evolvesFromSpecies === null) return "";
  const parts: string[] = [];
  if (node.minLevel) parts.push(`Nivel ${node.minLevel}`);
  if (node.item) parts.push(node.itemDisplay ?? formatLabel(node.item));
  if (node.trigger && node.trigger !== "level-up" && !node.item) parts.push(TRIGGER_ES[node.trigger] ?? formatLabel(node.trigger));
  return parts.length ? parts.join(" · ") : "Condición especial";
}

function renderEvolutionsContent(chain: EvolutionChain | null, currentPokemonId: number, allById: Map<number, Pokemon>): string {
  if (!chain || chain.nodes.length <= 1) {
    return `<p class="detail-empty">Este Pokémon no evoluciona.</p>`;
  }

  const cards = chain.nodes.map((node, i) => {
    const p = allById.get(node.speciesId);
    if (!p) return "";

    const isCurrent = node.speciesId === currentPokemonId;
    const condition = evolutionConditionText(node);
    const card = `
      <div class="detail-evolution-card${isCurrent ? " current" : ""}"${
        isCurrent ? "" : ` data-evolution-pick data-pokemon-id="${node.speciesId}"`
      }>
        <img src="${p.sprites.officialArtwork ?? p.sprites.default ?? ""}" alt="${p.name}" loading="lazy" />
        <span class="detail-evolution-card__id">${dexNumber(p.id)}</span>
        <span class="detail-evolution-card__name">${p.name}</span>
        <div class="detail-evolution-card__types">${typeBadgesHtml(p.types, true)}</div>
        ${condition ? `<span class="detail-evolution-card__condition">${condition}</span>` : ""}
      </div>
    `;

    const next = chain.nodes[i + 1];
    const arrow =
      next && next.evolvesFromSpecies === node.speciesName
        ? `<span class="detail-evolution-arrow"><i data-lucide="arrow-right"></i></span>`
        : "";

    return card + arrow;
  });

  return `<div class="detail-evolutions">${cards.join("")}</div>`;
}

const SECTION_CONTENT: Record<string, (ctx: RenderContext) => string> = {
  location: () => `<div data-table-mount="location"></div>`,
  moves: () => `<div data-table-mount="moves"></div>`,
  evolutions: (ctx) => renderEvolutionsContent(ctx.chain, ctx.pokemon.id, ctx.allById),
};

function renderSection(id: string, index: number, total: number, ctx: RenderContext): string {
  return `
    <section class="detail-section" data-section-id="${id}">
      <div class="detail-section__header">
        <h4 class="detail-section__title">${SECTION_TITLES[id]}</h4>
        <div class="detail-section__reorder">
          <button type="button" data-move-up data-section-id="${id}" ${index === 0 ? "disabled" : ""} aria-label="Subir sección">
            <i data-lucide="chevron-up"></i>
          </button>
          <button type="button" data-move-down data-section-id="${id}" ${index === total - 1 ? "disabled" : ""} aria-label="Bajar sección">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="detail-section__content">${SECTION_CONTENT[id](ctx)}</div>
    </section>
  `;
}

function renderHeader(ctx: RenderContext): string {
  const { pokemon, detail } = ctx;
  const captured = isCaptured(pokemon.id);
  const overrides = getPokemonOverrides(pokemon.id);
  const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const selectedNature = ctx.natures.find((n) => n.name === overrides.nature) ?? null;

  const statsHtml = STAT_KEYS.map((key) => {
    const base = detail.stats[key];
    const value = overrides.stats[key] ?? base;
    return `
      <div class="detail-stat">
        <span class="detail-stat__label">${STAT_LABELS[key]}</span>
        <input
          class="detail-stat__input"
          type="number"
          min="${base}"
          value="${value}"
          data-stat-input
          data-stat-key="${key}"
          ${captured ? "" : "disabled"}
        />
      </div>
    `;
  }).join("");

  const natureOptionsHtml = ctx.natures
    .map((n) => `<option value="${n.name}" ${overrides.nature === n.name ? "selected" : ""}>${capitalize(n.name)}</option>`)
    .join("");

  const currentStats: PokemonStats = {
    hp: overrides.stats.hp ?? detail.stats.hp,
    attack: overrides.stats.attack ?? detail.stats.attack,
    defense: overrides.stats.defense ?? detail.stats.defense,
    specialAttack: overrides.stats.specialAttack ?? detail.stats.specialAttack,
    specialDefense: overrides.stats.specialDefense ?? detail.stats.specialDefense,
    speed: overrides.stats.speed ?? detail.stats.speed,
  };
  const primaryTypeColor = typeColor(pokemon.types[0] ?? "normal");

  return `
    <div class="detail-header">
      <div class="detail-header__sprite">
        <img src="${sprite}" alt="${pokemon.name}" />
        <div class="detail-capture-medal" data-capture-medal ${captured ? "" : "hidden"}>
          <img src="/Medal-Black.png" alt="" class="detail-capture-medal__medal" data-medal-img />
          <img src="/Text.png" alt="Capturado" class="detail-capture-medal__stamp" data-stamp-img />
        </div>
      </div>
      <div class="detail-header__info">
        <div class="detail-header__name-row">
          <div class="detail-header__title-group">
            <h3 class="detail-header__name">${pokemon.name}</h3>
            <span class="detail-header__id">${dexNumber(pokemon.id)}</span>
          </div>
          <button class="btn btn--compact detail-chart-toggle-btn ${showHexagonChart ? "btn--primary" : ""}" type="button" data-toggle-chart-view title="Alternar entre lista de estadísticas y gráfico hexágono estilo Juez Pokémon">
            <i data-lucide="${showHexagonChart ? "bar-chart-2" : "hexagon"}"></i>
            <span data-chart-toggle-label>${showHexagonChart ? "Ver Barras" : "Gráfico Juez"}</span>
          </button>
        </div>
        <div class="detail-header__types">${typeBadgesHtml(pokemon.types)}</div>
        <div class="detail-stats" data-stats-bars-view ${showHexagonChart ? "hidden" : ""}>${statsHtml}</div>
        <div class="detail-hexagon-view" data-stats-hexagon-view ${showHexagonChart ? "" : "hidden"}>
          ${renderHexagonChart(currentStats, primaryTypeColor)}
        </div>
        <div class="detail-nature">
          <span class="detail-nature__label">Naturaleza</span>
          <select data-nature-select ${captured ? "" : "disabled"}>
            <option value="">Sin definir</option>
            ${natureOptionsHtml}
          </select>
          <i data-lucide="info" class="detail-nature__tooltip" data-nature-tooltip title="${natureEffectText(selectedNature)}"></i>
        </div>
        <button class="btn ${captured ? "" : "btn--primary"}" type="button" data-modal-capture-btn>
          <i data-lucide="${captured ? "check" : "circle-dot"}"></i>
          ${captured ? "Capturado" : "Capturar"}
        </button>
        ${captured ? "" : '<p class="detail-hint" data-capture-hint>Capturá este Pokémon para personalizar sus stats y naturaleza.</p>'}
      </div>
    </div>
  `;
}

let showHexagonChart = false;

function renderHexagonChart(stats: PokemonStats, primaryTypeColor: string): string {
  const width = 280;
  const height = 230;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 70;
  const MAX_STAT = 255;

  const statList: { key: keyof PokemonStats; label: string }[] = [
    { key: "hp", label: "HP" },
    { key: "attack", label: "ATK" },
    { key: "defense", label: "DEF" },
    { key: "speed", label: "SPE" },
    { key: "specialDefense", label: "SPD" },
    { key: "specialAttack", label: "SPA" },
  ];

  const angles = statList.map((_, i) => -Math.PI / 2 + (i * Math.PI) / 3);

  function getGridPoints(rRatio: number): string {
    return angles
      .map((angle) => {
        const x = cx + radius * rRatio * Math.cos(angle);
        const y = cy + radius * rRatio * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const valuePoints = statList
    .map((item, i) => {
      const val = Math.min(stats[item.key] ?? 0, MAX_STAT);
      const ratio = Math.max(val / MAX_STAT, 0.08);
      const x = cx + radius * ratio * Math.cos(angles[i]);
      const y = cy + radius * ratio * Math.sin(angles[i]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const axisLinesHtml = angles
    .map((angle) => {
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);
      return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="3,3" />`;
    })
    .join("");

  const labelsHtml = statList
    .map((item, i) => {
      const val = stats[item.key] ?? 0;
      const labelRadius = radius + 22;
      const lx = cx + labelRadius * Math.cos(angles[i]);
      const ly = cy + labelRadius * Math.sin(angles[i]);
      const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";

      return `
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" class="hexagon-chart__label">
          <tspan class="hexagon-chart__label-title">${item.label}</tspan>
          <tspan class="hexagon-chart__label-val" dx="3">${val}</tspan>
        </text>
      `;
    })
    .join("");

  return `
    <div class="hexagon-chart-container">
      <svg class="hexagon-chart-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <polygon points="${getGridPoints(1)}" fill="none" stroke="var(--border-strong)" stroke-width="1.5" />
        <polygon points="${getGridPoints(0.75)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2" />
        <polygon points="${getGridPoints(0.5)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2" />
        <polygon points="${getGridPoints(0.25)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2" />

        ${axisLinesHtml}

        <polygon points="${valuePoints}" fill="${primaryTypeColor}33" stroke="${primaryTypeColor}" stroke-width="2.5" class="hexagon-chart__polygon" />

        ${statList
          .map((item, i) => {
            const val = Math.min(stats[item.key] ?? 0, MAX_STAT);
            const ratio = Math.max(val / MAX_STAT, 0.08);
            const vx = cx + radius * ratio * Math.cos(angles[i]);
            const vy = cy + radius * ratio * Math.sin(angles[i]);
            return `<circle cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="4" fill="${primaryTypeColor}" stroke="#ffffff" stroke-width="1.5" />`;
          })
          .join("")}

        ${labelsHtml}
      </svg>
      <div class="hexagon-chart__footer">
        <span>Gráfico Juez de Stats</span>
      </div>
    </div>
  `;
}

function render(ctx: RenderContext): void {
  lastContext = ctx;
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const order = getSectionOrder();
  const sectionsHtml = order.map((id, i) => renderSection(id, i, order.length, ctx)).join("");
  bodyEl.innerHTML = renderHeader(ctx) + sectionsHtml;
  refreshIcons();

  const locationMount = bodyEl.querySelector<HTMLElement>('[data-table-mount="location"]');
  if (locationMount) {
    renderDataTable(locationMount, LOCATION_COLUMNS, ctx.detail.acquisitions, "No disponible en los juegos con datos de ubicación.");
  }

  const movesMount = bodyEl.querySelector<HTMLElement>('[data-table-mount="moves"]');
  if (movesMount) {
    renderDataTable(movesMount, MOVE_COLUMNS, buildMoveTableRows(ctx.detail.moveDetails), "Sin datos de movimientos.");
  }
}

// --- interactions ---------------------------------------------------------

function swapSection(id: string, direction: -1 | 1): void {
  const order = getSectionOrder();
  const idx = order.indexOf(id);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;

  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  setSectionOrder(order);
  if (lastContext) render(lastContext);

  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  for (const sectionId of [id, order[idx]]) {
    const el = bodyEl.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
    if (el) sectionSwap(el);
  }
}

function updateHeaderCapturedState(captured: boolean): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const captureBtn = bodyEl.querySelector<HTMLButtonElement>("[data-modal-capture-btn]");
  if (captureBtn) {
    captureBtn.classList.toggle("btn--primary", !captured);
    captureBtn.innerHTML = `<i data-lucide="${captured ? "check" : "circle-dot"}"></i> ${captured ? "Capturado" : "Capturar"}`;
  }
  bodyEl.querySelectorAll<HTMLInputElement>("[data-stat-input]").forEach((input) => {
    input.disabled = !captured;
  });
  const natureSelect = bodyEl.querySelector<HTMLSelectElement>("[data-nature-select]");
  if (natureSelect) natureSelect.disabled = !captured;
  const hint = bodyEl.querySelector<HTMLElement>("[data-capture-hint]");
  if (hint) hint.hidden = captured;
  refreshIcons();
}

function closeModal(): void {
  currentId = null;
  const { overlayEl, panelEl } = getModalElements();
  if (!overlayEl || !panelEl) return;

  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 500));
  Promise.race([modalOut(overlayEl, panelEl), timeout]).then(() => {
    overlayEl.hidden = true;
    document.body.style.overflow = "";
  });
}

function bindModalEvents(): void {
  document.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.matches("[data-stat-input]") || currentId === null || !lastContext) return;

    const key = target.dataset.statKey as keyof PokemonStats;
    const base = lastContext.detail.stats[key];
    let value = Number(target.value);
    if (Number.isNaN(value)) return;
    if (value < base) {
      value = base;
      target.value = String(base);
    }

    const overrides = getPokemonOverrides(currentId);
    overrides.stats = { ...overrides.stats, [key]: value };
    setPokemonOverrides(currentId, overrides);
  });

  document.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches("[data-nature-select]") || currentId === null) return;

    const value = (target as HTMLSelectElement).value || null;
    const overrides = getPokemonOverrides(currentId);
    overrides.nature = value;
    setPokemonOverrides(currentId, overrides);

    const nature = lastContext?.natures.find((n) => n.name === value) ?? null;
    const { bodyEl } = getModalElements();
    const tooltipEl = bodyEl?.querySelector<HTMLElement>("[data-nature-tooltip]");
    if (tooltipEl) tooltipEl.setAttribute("title", natureEffectText(nature));
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-detail-close]")) {
      closeModal();
      return;
    }

    const { overlayEl, bodyEl } = getModalElements();

    if (overlayEl && target === overlayEl) {
      closeModal();
      return;
    }

    if (!bodyEl) return;

    const toggleBtn = target.closest<HTMLButtonElement>("[data-toggle-chart-view]");
    if (toggleBtn) {
      showHexagonChart = !showHexagonChart;
      const barsView = bodyEl.querySelector<HTMLElement>("[data-stats-bars-view]");
      const hexView = bodyEl.querySelector<HTMLElement>("[data-stats-hexagon-view]");
      const labelEl = toggleBtn.querySelector<HTMLElement>("[data-chart-toggle-label]");

      if (barsView && hexView) {
        barsView.hidden = showHexagonChart;
        hexView.hidden = !showHexagonChart;
      }
      if (labelEl) {
        labelEl.textContent = showHexagonChart ? "Ver Barras" : "Gráfico Juez";
      }
      toggleBtn.classList.toggle("btn--primary", showHexagonChart);
      refreshIcons();
      return;
    }

    const captureBtn = target.closest<HTMLButtonElement>("[data-modal-capture-btn]");
    if (captureBtn && currentId !== null && lastContext) {
      const nowCaptured = !isCaptured(currentId);
      setCaptured(currentId, nowCaptured);
      updateHeaderCapturedState(nowCaptured);

      const medal = bodyEl.querySelector<HTMLElement>("[data-capture-medal]");
      const medalImg = bodyEl.querySelector<HTMLElement>("[data-medal-img]");
      const stampImg = bodyEl.querySelector<HTMLElement>("[data-stamp-img]");

      const name = capitalize(lastContext.pokemon.name);
      if (nowCaptured) {
        toast.success(`¡${name} capturado!`);
        if (medal && medalImg && stampImg) {
          medal.hidden = false;
          animateMedalReveal(medalImg, stampImg);
        }
      } else {
        toast.info(`${name} liberado de tu Pokédex.`);
        if (medal) medal.hidden = true;
      }
      return;
    }

    const evoCard = target.closest<HTMLElement>("[data-evolution-pick]");
    if (evoCard) {
      openPokemonModal(Number(evoCard.dataset.pokemonId));
      return;
    }

    const upBtn = target.closest<HTMLButtonElement>("[data-move-up]");
    if (upBtn && !upBtn.disabled) {
      swapSection(upBtn.dataset.sectionId!, -1);
      return;
    }

    const downBtn = target.closest<HTMLButtonElement>("[data-move-down]");
    if (downBtn && !downBtn.disabled) {
      swapSection(downBtn.dataset.sectionId!, 1);
    }
  });

  document.addEventListener("keydown", (e) => {
    const { overlayEl } = getModalElements();
    if (e.key === "Escape" && overlayEl && !overlayEl.hidden) closeModal();
  });
}

bindModalEvents();

// --- public API -------------------------------------------------------

export async function openPokemonModal(id: number): Promise<void> {
  currentId = id;
  const { overlayEl, panelEl, bodyEl } = getModalElements();
  if (!overlayEl || !panelEl || !bodyEl) return;

  if (overlayEl.hidden) {
    bodyEl.innerHTML = `<div class="detail-loading"><div class="spinner"></div><p>Cargando datos del Pokémon...</p></div>`;
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    modalIn(overlayEl, panelEl);
  } else {
    bodyEl.innerHTML = `<div class="detail-loading"><div class="spinner"></div><p>Cargando datos del Pokémon...</p></div>`;
  }

  try {
    const [allPokemon, detail, natures] = await Promise.all([getAllPokemon(), getPokemonDetail(id), getNatures()]);
    if (currentId !== id) return;

    const pokemon = allPokemon.find((p) => p.id === id);
    if (!pokemon) {
      closeModal();
      return;
    }

    const allById = new Map(allPokemon.map((p) => [p.id, p]));
    const chain = detail.evolutionChainId !== null ? await getEvolutionChain(detail.evolutionChainId) : null;
    if (currentId !== id) return;

    render({ pokemon, detail, chain, natures, allById });
    bodyEl.scrollTop = 0;
  } catch (err) {
    console.error("Error cargando detalles del Pokémon:", err);
    toast.error("No se pudieron cargar los detalles del Pokémon.");
    closeModal();
  }
}
