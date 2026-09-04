import type { ColumnDef } from "@tanstack/table-core";
import { getAllPokemon, getTypeChart } from "./pokedexData";
import { getEvolutionChain, getNatures, getPokemonDetail } from "./pokemonDetail";
import { getTypeMultiplier } from "./typeChart";
import {
  copyPokedexToSlot,
  copySlotToPokedex,
  getPokemonOverrides,
  getSectionOrder,
  getTeam,
  getTeamSlotEffectiveOverrides,
  isCaptured,
  isSectionCollapsed,
  setCaptured,
  setPokemonOverrides,
  setSectionCollapsed,
  setSectionOrder,
  setTeamSlotNature,
  setTeamSlotStats,
  setTeamSlotUsePokedexData,
  type PokemonOverrides,
} from "./storage";
import { animateMedalReveal, modalIn, modalOut, sectionSwap } from "./animations";
import { refreshIcons } from "./icons";
import { typeColor } from "./typeColors";
import { renderDataTable } from "./dataTable";
import { toast } from "./toast";
import { getCurrentLocale, getTranslations, getTypeName, getEvolutionTriggerName, getGameTitle, type Locale } from "./i18n/translations";
import type { AcquisitionRow, EvolutionChain, EvolutionNode, MoveDetail, Nature, Pokemon, PokemonDetail, PokemonStats, TypeChart } from "./types";

function getModalElements() {
  const overlayEl = document.querySelector<HTMLElement>("[data-detail-overlay]");
  const panelEl = overlayEl?.querySelector<HTMLElement>(".modal-panel") ?? null;
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-detail-close]");
  const bodyEl = document.querySelector<HTMLElement>("[data-detail-body]");
  const fabContainer = panelEl?.querySelector<HTMLElement>("[data-detail-fab-container]") ?? null;
  const fabBtn = panelEl?.querySelector<HTMLButtonElement>("[data-detail-fab-btn]") ?? null;
  const tocMenu = panelEl?.querySelector<HTMLElement>("[data-detail-toc-menu]") ?? null;
  const tocList = panelEl?.querySelector<HTMLElement>("[data-detail-toc-list]") ?? null;
  return { overlayEl, panelEl, closeBtn, bodyEl, fabContainer, fabBtn, tocMenu, tocList };
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

const NATURE_STAT_DISPLAY: Record<Locale, Record<string, string>> = {
  es: {
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "At. Especial",
    "special-defense": "Def. Especial",
    speed: "Velocidad",
  },
  en: {
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  },
};

const METHOD_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    "level-up": "Nivel",
    machine: "MT/MO",
    tutor: "Tutor",
    egg: "Huevo",
  },
  en: {
    "level-up": "Level",
    machine: "TM/HM",
    tutor: "Tutor",
    egg: "Egg",
  },
};

interface RenderContext {
  pokemon: Pokemon;
  detail: PokemonDetail;
  chain: EvolutionChain | null;
  natures: Nature[];
  allById: Map<number, Pokemon>;
  typeChart: TypeChart;
}

export interface PokemonModalOptions {
  slotIndex?: number;
}

let currentId: number | null = null;
let currentSlotIndex: number | null = null;
let lastContext: RenderContext | null = null;
let showHexagonChart = false;

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
  const locale = getCurrentLocale();
  const cls = small ? "type-badge type-badge--sm" : "type-badge";
  return types
    .map((t) => `<span class="${cls}" data-type="${t}" style="--badge-bg:${typeColor(t)}">${getTypeName(t, locale)}</span>`)
    .join("");
}

interface MoveTableRow {
  name: string;
  method: string;
  methodLabel: string;
  level: number;
}

function buildMoveTableRows(moveDetails: MoveDetail[], locale: Locale): MoveTableRow[] {
  const methodMap = METHOD_LABELS[locale] ?? METHOD_LABELS.en;
  return moveDetails.map((m) => ({
    name: m.name,
    method: m.method,
    methodLabel: methodMap[m.method] ?? formatLabel(m.method),
    level: m.level,
  }));
}

function formatGeneration(gen: unknown): string {
  return String(gen ?? "").replace(/^(Generación|Generation)\s*/i, "").trim();
}

function getLocationColumns(locale: Locale): ColumnDef<AcquisitionRow, unknown>[] {
  const t = getTranslations(locale);
  return [
    {
      accessorKey: "generation",
      header: "Gen.",
      size: 40,
      cell: (info) => formatGeneration(info.getValue()),
    },
    {
      accessorKey: "game",
      header: t.modal.game,
      size: 190,
      cell: (info) => getGameTitle(String(info.getValue()), locale),
    },
    { accessorKey: "location", header: t.modal.location, size: 160 },
    {
      accessorKey: "method",
      header: t.modal.method,
      size: 260,
      cell: (info) => {
        const val = String(info.getValue());
        if (locale === "en" && val === "Encuentro salvaje") return "Wild encounter";
        return val;
      },
    },
  ];
}

function getMoveColumns(locale: Locale): ColumnDef<MoveTableRow, unknown>[] {
  const t = getTranslations(locale);
  return [
    { accessorKey: "name", header: t.modal.move, size: 220, cell: (info) => formatLabel(String(info.getValue())) },
    { accessorKey: "methodLabel", header: t.modal.method, size: 70 },
    {
      accessorFn: (row) => row.level,
      id: "level",
      header: t.modal.level,
      size: 50,
      cell: (info) => (info.row.original.method === "level-up" ? `${locale === "es" ? "Nv." : "Lv."} ${info.getValue()}` : "-"),
    },
  ];
}

function natureEffectText(nature: Nature | null, locale: Locale = getCurrentLocale()): string {
  const t = getTranslations(locale);
  if (!nature) return locale === "es" ? "Elegí una naturaleza para ver su efecto." : "Choose a nature to see its effect.";
  if (!nature.increasedStat || !nature.decreasedStat) return t.modal.neutralNature;
  const statMap = NATURE_STAT_DISPLAY[locale] ?? NATURE_STAT_DISPLAY.en;
  const up = statMap[nature.increasedStat] ?? nature.increasedStat;
  const down = statMap[nature.decreasedStat] ?? nature.decreasedStat;
  if (locale === "es") {
    return `Sube ${up} y baja ${down}.`;
  }
  return `Increases ${up} and decreases ${down}.`;
}

function evolutionConditionText(node: EvolutionNode, locale: Locale): string {
  if (node.evolvesFromSpecies === null) return "";
  const parts: string[] = [];
  if (node.minLevel) parts.push(locale === "es" ? `Nivel ${node.minLevel}` : `Level ${node.minLevel}`);
  if (node.item) parts.push(locale === "es" ? (node.itemDisplay ?? formatLabel(node.item)) : formatLabel(node.item));
  if (node.trigger && node.trigger !== "level-up" && !node.item) {
    parts.push(getEvolutionTriggerName(node.trigger, locale));
  }
  return parts.length ? parts.join(" · ") : (locale === "es" ? "Condición especial" : "Special condition");
}

function renderEvolutionsContent(chain: EvolutionChain | null, currentPokemonId: number, allById: Map<number, Pokemon>): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  if (!chain || chain.nodes.length <= 1) {
    return `<p class="detail-empty">${t.modal.noEvolutions}</p>`;
  }

  const cards = chain.nodes.map((node, i) => {
    const p = allById.get(node.speciesId);
    if (!p) return "";

    const isCurrent = node.speciesId === currentPokemonId;
    const condition = evolutionConditionText(node, locale);
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

interface EffectivenessItem {
  type: string;
  multiplier: number;
}

function getValClass(multiplier: number): string {
  if (multiplier >= 4) return "quad";
  if (multiplier > 1) return "double";
  if (multiplier === 0) return "immune";
  if (multiplier <= 0.25) return "quarter";
  if (multiplier < 1) return "half";
  return "neutral";
}

function renderEffectivenessItem(item: EffectivenessItem, locale: Locale): string {
  const typeName = getTypeName(item.type, locale);
  const color = typeColor(item.type);
  const valStr = `x${item.multiplier}`;
  const valClass = getValClass(item.multiplier);

  return `<li class="detail-effectiveness__item"><span class="type-badge type-badge--sm" data-type="${item.type}" style="--badge-bg:${color}">${typeName}</span>, <span class="detail-effectiveness__val detail-effectiveness__val--${valClass}">${valStr}</span></li>`;
}

function renderEffectivenessContent(pokemon: Pokemon, typeChart: TypeChart): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);

  if (!typeChart || !typeChart.types) {
    return `<p class="detail-empty">${locale === "es" ? "Datos de tipos no disponibles." : "Type data not available."}</p>`;
  }

  const weaknesses: EffectivenessItem[] = [];
  const resistances: EffectivenessItem[] = [];
  const immunities: EffectivenessItem[] = [];

  for (const attackingType of typeChart.types) {
    const mult = getTypeMultiplier(typeChart, attackingType, pokemon.types);
    if (mult > 1) {
      weaknesses.push({ type: attackingType, multiplier: mult });
    } else if (mult === 0) {
      immunities.push({ type: attackingType, multiplier: mult });
    } else if (mult < 1) {
      resistances.push({ type: attackingType, multiplier: mult });
    }
  }

  weaknesses.sort((a, b) => b.multiplier - a.multiplier || getTypeName(a.type, locale).localeCompare(getTypeName(b.type, locale)));
  resistances.sort((a, b) => a.multiplier - b.multiplier || getTypeName(a.type, locale).localeCompare(getTypeName(b.type, locale)));
  immunities.sort((a, b) => getTypeName(a.type, locale).localeCompare(getTypeName(b.type, locale)));

  const immunitiesHtml = immunities.length
    ? `
      <div class="detail-subsection">
        <h5 class="detail-subsection__title">${t.modal.immunities}</h5>
        <ul class="detail-effectiveness__list">${immunities.map((item) => renderEffectivenessItem(item, locale)).join("")}</ul>
      </div>
    `
    : "";

  return `
    <div class="detail-effectiveness">
      <div class="detail-subsection">
        <h5 class="detail-subsection__title">${t.modal.weaknesses}</h5>
        ${
          weaknesses.length
            ? `<ul class="detail-effectiveness__list">${weaknesses.map((item) => renderEffectivenessItem(item, locale)).join("")}</ul>`
            : `<p class="detail-empty">${t.modal.none}</p>`
        }
      </div>
      <div class="detail-subsection">
        <h5 class="detail-subsection__title">${t.modal.resistances}</h5>
        ${
          resistances.length
            ? `<ul class="detail-effectiveness__list">${resistances.map((item) => renderEffectivenessItem(item, locale)).join("")}</ul>`
            : `<p class="detail-empty">${t.modal.none}</p>`
        }
      </div>
      ${immunitiesHtml}
    </div>
  `;
}

const SECTION_CONTENT: Record<string, (ctx: RenderContext) => string> = {
  effectiveness: (ctx) => renderEffectivenessContent(ctx.pokemon, ctx.typeChart),
  location: () => `<div data-table-mount="location"></div>`,
  moves: () => `<div data-table-mount="moves"></div>`,
  evolutions: (ctx) => renderEvolutionsContent(ctx.chain, ctx.pokemon.id, ctx.allById),
};

function renderSection(id: string, index: number, total: number, ctx: RenderContext): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const titles: Record<string, string> = {
    effectiveness: t.modal.effectiveness,
    location: t.modal.acquisition,
    moves: t.modal.moves,
    evolutions: t.modal.evolutions,
  };
  const isCollapsed = isSectionCollapsed(id);

  return `
    <section class="detail-section${isCollapsed ? " is-collapsed" : ""}" data-section-id="${id}">
      <div
        class="detail-section__header"
        data-section-toggle="${id}"
        role="button"
        tabindex="0"
        aria-expanded="${!isCollapsed}"
        aria-label="${titles[id] ?? capitalize(id)}"
      >
        <div class="detail-section__title-group">
          <span class="detail-section__collapse-icon">
            <i data-lucide="chevron-down"></i>
          </span>
          <h4 class="detail-section__title">${titles[id] ?? capitalize(id)}</h4>
        </div>
        <div class="detail-section__reorder">
          <button type="button" data-move-up data-section-id="${id}" ${index === 0 ? "disabled" : ""} aria-label="${locale === "es" ? "Subir sección" : "Move section up"}">
            <i data-lucide="chevron-up"></i>
          </button>
          <button type="button" data-move-down data-section-id="${id}" ${index === total - 1 ? "disabled" : ""} aria-label="${locale === "es" ? "Bajar sección" : "Move section down"}">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="detail-section__content" ${isCollapsed ? "hidden" : ""}>${SECTION_CONTENT[id] ? SECTION_CONTENT[id](ctx) : ""}</div>
    </section>
  `;
}

function getCurrentEffectiveOverrides(): PokemonOverrides {
  if (currentSlotIndex !== null && lastContext) {
    const team = getTeam();
    const slot = team.slots[currentSlotIndex];
    if (slot) {
      return getTeamSlotEffectiveOverrides(slot, lastContext.detail.stats);
    }
  }
  if (currentId !== null) {
    return getPokemonOverrides(currentId) ?? { stats: {}, nature: null };
  }
  return { stats: {}, nature: null };
}

function renderHeader(ctx: RenderContext): string {
  const { pokemon, detail } = ctx;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const isTeamMode = currentSlotIndex !== null;
  const captured = isCaptured(pokemon.id);
  const canEdit = isTeamMode ? true : captured;

  const team = isTeamMode ? getTeam() : null;
  const currentSlot = isTeamMode && team ? (team.slots[currentSlotIndex!] ?? null) : null;
  const overrides = getCurrentEffectiveOverrides();

  const userStats = overrides.stats ?? {};
  const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const naturesList = ctx.natures ?? [];
  const selectedNature = naturesList.find((n) => n.name === overrides.nature) ?? null;

  const statsHtml = STAT_KEYS.map((key) => {
    const base = detail.stats?.[key] ?? 0;
    const value = userStats[key] ?? base;
    const modifier = getNatureModifier(selectedNature, key);
    let modBadge = "";
    let modClass = "";

    if (modifier === "up") {
      modBadge = `<span class="detail-stat__mod detail-stat__mod--up" title="${locale === "es" ? "+10% por naturaleza" : "+10% from nature"}">▲ +10%</span>`;
      modClass = "is-nature-up";
    } else if (modifier === "down") {
      modBadge = `<span class="detail-stat__mod detail-stat__mod--down" title="${locale === "es" ? "-10% por naturaleza" : "-10% from nature"}">▼ -10%</span>`;
      modClass = "is-nature-down";
    }

    return `
      <div class="detail-stat ${modClass}">
        <div class="detail-stat__label-group">
          <span class="detail-stat__label">${STAT_LABELS[key]}</span>
          ${modBadge}
        </div>
        <input
          class="detail-stat__input"
          type="number"
          min="${base}"
          value="${value}"
          data-stat-input
          data-stat-key="${key}"
          ${canEdit ? "" : "disabled"}
        />
      </div>
    `;
  }).join("");

  const natureOptionsHtml = naturesList
    .map((n) => `<option value="${n.name}" ${overrides.nature === n.name ? "selected" : ""}>${capitalize(n.name)}</option>`)
    .join("");

  const currentStats: PokemonStats = {
    hp: userStats.hp ?? detail.stats.hp,
    attack: userStats.attack ?? detail.stats.attack,
    defense: userStats.defense ?? detail.stats.defense,
    specialAttack: userStats.specialAttack ?? detail.stats.specialAttack,
    specialDefense: userStats.specialDefense ?? detail.stats.specialDefense,
    speed: userStats.speed ?? detail.stats.speed,
  };
  const primaryTypeColor = typeColor(pokemon.types[0] ?? "normal");

  const badgeTeamHtml = isTeamMode
    ? `<span class="badge badge--team"><i data-lucide="users"></i> ${t.modal.teamSlotBadge.replace("{n}", String(currentSlotIndex! + 1))}</span>`
    : "";

  let footerActionsHtml = "";
  if (isTeamMode) {
    const isSynced = Boolean(currentSlot?.usePokedexData);
    footerActionsHtml = `
      <div class="detail-team-toolbar" data-team-toolbar>
        <div class="detail-team-toolbar__actions">
          <button class="btn btn--compact btn--outline" type="button" data-copy-from-pokedex title="${t.modal.copyFromPokedex}">
            <i data-lucide="download"></i>
            <span>${t.modal.copyFromPokedex}</span>
          </button>
          <button class="btn btn--compact btn--outline" type="button" data-copy-to-pokedex title="${t.modal.copyToPokedex}">
            <i data-lucide="upload"></i>
            <span>${t.modal.copyToPokedex}</span>
          </button>
        </div>
        <label class="detail-team-link-label" title="${t.modal.linkPokedex}">
          <input type="checkbox" data-link-pokedex ${isSynced ? "checked" : ""} />
          <span>${t.modal.linkPokedex}</span>
        </label>
      </div>
    `;
  } else {
    footerActionsHtml = `
      <button class="btn ${captured ? "" : "btn--primary"}" type="button" data-modal-capture-btn>
        <i data-lucide="${captured ? "check" : "circle-dot"}"></i>
        ${captured ? t.pokedex.caught : t.pokedex.catch}
      </button>
    `;
  }

  const medalHtml = isTeamMode
    ? `<div class="detail-team-slot-badge"><i data-lucide="users"></i> ${t.modal.teamSlotBadge.replace("{n}", String(currentSlotIndex! + 1))}</div>`
    : `
      <div class="detail-capture-medal" data-capture-medal ${captured ? "" : "hidden"}>
        <img src="/Medal-Black.png" alt="" class="detail-capture-medal__medal" data-medal-img />
        <img src="/Text.png" alt="${captured ? t.pokedex.caught : t.pokedex.catch}" class="detail-capture-medal__stamp" data-stamp-img />
      </div>
    `;

  return `
    <div class="detail-header ${isTeamMode ? "is-team-mode" : ""}">
      <div class="detail-header__sprite">
        <img src="${sprite}" alt="${pokemon.name}" />
        ${medalHtml}
      </div>
      <div class="detail-header__info">
        <div class="detail-header__name-row">
          <div class="detail-header__title-group">
            <h3 class="detail-header__name">${pokemon.name}</h3>
            <span class="detail-header__id">${dexNumber(pokemon.id)}</span>
            ${badgeTeamHtml}
          </div>
          <button class="btn btn--compact detail-chart-toggle-btn ${showHexagonChart ? "btn--primary" : ""}" type="button" data-toggle-chart-view title="${t.modal.chartToggle}">
            <i data-lucide="${showHexagonChart ? "bar-chart-2" : "hexagon"}"></i>
            <span data-chart-toggle-label>${showHexagonChart ? (locale === "es" ? "Ocultar Juez" : "Hide Judge") : (locale === "es" ? "Gráfico Juez" : "Judge Chart")}</span>
          </button>
        </div>
        <div class="detail-header__types">${typeBadgesHtml(pokemon.types)}</div>
        <div class="detail-stats-wrapper ${showHexagonChart ? "has-hexagon" : ""}" data-stats-wrapper>
          <div class="detail-stats" data-stats-bars-view>${statsHtml}</div>
          <div class="detail-hexagon-view" data-stats-hexagon-view ${showHexagonChart ? "" : "hidden"}>
            ${renderHexagonChart(currentStats, primaryTypeColor, selectedNature)}
          </div>
        </div>
        <div class="detail-footer-row">
          <div class="detail-footer-row__nature">
            <div class="detail-nature">
              <div class="detail-nature__select-row">
                <span class="detail-nature__label">${t.modal.nature}</span>
                <select data-nature-select ${canEdit ? "" : "disabled"}>
                  <option value="">${locale === "es" ? "Sin definir" : "Undefined"}</option>
                  ${natureOptionsHtml}
                </select>
                <i data-lucide="info" class="detail-nature__tooltip" data-nature-tooltip title="${natureEffectText(selectedNature, locale)}"></i>
              </div>
              <div class="detail-nature__effects" data-nature-effects-container>
                ${renderNatureEffectBadges(selectedNature, locale)}
              </div>
            </div>
            ${isTeamMode ? `<p class="detail-nature-hint">${t.modal.teamNatureNotice}</p>` : (!captured ? `<p class="detail-hint" data-capture-hint>${t.modal.captureHint}</p>` : "")}
          </div>
          ${footerActionsHtml}
        </div>
      </div>
    </div>
  `;
}

function getNatureModifier(nature: Nature | null, key: keyof PokemonStats): "up" | "down" | null {
  if (!nature || !nature.increasedStat || !nature.decreasedStat || nature.increasedStat === nature.decreasedStat) return null;
  const map: Record<string, keyof PokemonStats> = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "specialAttack",
    "special-defense": "specialDefense",
    speed: "speed",
  };
  if (map[nature.increasedStat] === key) return "up";
  if (map[nature.decreasedStat] === key) return "down";
  return null;
}

function renderNatureEffectBadges(nature: Nature | null, locale: Locale = getCurrentLocale()): string {
  if (!nature) return `<span class="detail-nature-hint">${locale === "es" ? "Elegí una naturaleza para ver su efecto." : "Choose a nature to see its effect."}</span>`;
  if (!nature.increasedStat || !nature.decreasedStat || nature.increasedStat === nature.decreasedStat) {
    return `<span class="detail-nature-tag detail-nature-tag--neutral">${locale === "es" ? "Naturaleza neutra (sin cambios)" : "Neutral nature (no changes)"}</span>`;
  }
  const statMap = NATURE_STAT_DISPLAY[locale] ?? NATURE_STAT_DISPLAY.en;
  const upLabel = statMap[nature.increasedStat] ?? nature.increasedStat;
  const downLabel = statMap[nature.decreasedStat] ?? nature.decreasedStat;
  return `
    <span class="detail-nature-tag detail-nature-tag--up">+10% ${upLabel}</span>
    <span class="detail-nature-tag detail-nature-tag--down">-10% ${downLabel}</span>
  `;
}

function isStatUp(nature: Nature | null, key: keyof PokemonStats): boolean {
  return getNatureModifier(nature, key) === "up";
}

function isStatDown(nature: Nature | null, key: keyof PokemonStats): boolean {
  return getNatureModifier(nature, key) === "down";
}

function renderHexagonChart(stats: PokemonStats, primaryTypeColor: string, nature: Nature | null = null): string {
  const width = 250;
  const height = 165;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 50;
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
      const up = isStatUp(nature, item.key);
      const down = isStatDown(nature, item.key);
      const labelRadius = radius + 17;
      const lx = cx + labelRadius * Math.cos(angles[i]);
      const ly = cy + labelRadius * Math.sin(angles[i]);
      const anchor = Math.abs(lx - cx) < 10 ? "middle" : lx > cx ? "start" : "end";

      let symbol = "";
      let symbolColor = "";
      if (up) {
        symbol = "▲";
        symbolColor = "#f87171";
      } else if (down) {
        symbol = "▼";
        symbolColor = "#60a5fa";
      }

      const valColor = up ? "#f87171" : down ? "#60a5fa" : val >= 130 ? "var(--accent)" : "var(--text)";

      return `
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" class="hexagon-chart__label">
          <tspan class="hexagon-chart__label-title">${item.label}</tspan>
          <tspan class="hexagon-chart__label-val" fill="${valColor}" dx="2">${val}</tspan>
          ${symbol ? `<tspan fill="${symbolColor}" dx="2" font-size="10px" font-weight="900">${symbol}</tspan>` : ""}
        </text>
      `;
    })
    .join("");

  const cleanColor = primaryTypeColor.replace("#", "");

  return `
    <div class="hexagon-chart-container">
      <svg class="hexagon-chart-svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto">
        <defs>
          <linearGradient id="hexGrad-${cleanColor}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryTypeColor}" stop-opacity="0.4" />
            <stop offset="100%" stop-color="${primaryTypeColor}" stop-opacity="0.12" />
          </linearGradient>
          <filter id="hexGlow-${cleanColor}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="${primaryTypeColor}" flood-opacity="0.4" />
          </filter>
        </defs>

        <polygon points="${getGridPoints(1)}" fill="var(--bg-elevated)" fill-opacity="0.2" stroke="var(--border-strong)" stroke-width="1.2" />
        <polygon points="${getGridPoints(0.75)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />
        <polygon points="${getGridPoints(0.5)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />
        <polygon points="${getGridPoints(0.25)}" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="3,3" />

        ${axisLinesHtml}

        <polygon points="${valuePoints}" fill="url(#hexGrad-${cleanColor})" stroke="${primaryTypeColor}" stroke-width="2" filter="url(#hexGlow-${cleanColor})" class="hexagon-chart__polygon" />

        ${statList
          .map((item, i) => {
            const val = Math.min(stats[item.key] ?? 0, MAX_STAT);
            const ratio = Math.max(val / MAX_STAT, 0.08);
            const vx = cx + radius * ratio * Math.cos(angles[i]);
            const vy = cy + radius * ratio * Math.sin(angles[i]);
            return `<circle cx="${vx.toFixed(1)}" cy="${vy.toFixed(1)}" r="2" fill="${primaryTypeColor}" stroke="#ffffff" stroke-width="1" />`;
          })
          .join("")}

        ${labelsHtml}
      </svg>
    </div>
  `;
}

function updateHexagonChartIfVisible(): void {
  if (!showHexagonChart || currentId === null || !lastContext) return;
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;
  const hexView = bodyEl.querySelector<HTMLElement>("[data-stats-hexagon-view]");
  if (!hexView) return;

  const overrides = getCurrentEffectiveOverrides();
  const userStats = overrides.stats ?? {};
  const currentStats: PokemonStats = {
    hp: userStats.hp ?? lastContext.detail.stats.hp,
    attack: userStats.attack ?? lastContext.detail.stats.attack,
    defense: userStats.defense ?? lastContext.detail.stats.defense,
    specialAttack: userStats.specialAttack ?? lastContext.detail.stats.specialAttack,
    specialDefense: userStats.specialDefense ?? lastContext.detail.stats.specialDefense,
    speed: userStats.speed ?? lastContext.detail.stats.speed,
  };
  const selectedNature = (lastContext.natures ?? []).find((n) => n.name === overrides.nature) ?? null;
  const primaryTypeColor = typeColor(lastContext.pokemon.types[0] ?? "normal");

  hexView.innerHTML = renderHexagonChart(currentStats, primaryTypeColor, selectedNature);
}

function render(ctx: RenderContext): void {
  lastContext = ctx;
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const order = getSectionOrder();
  const sectionsHtml = order.map((id, i) => renderSection(id, i, order.length, ctx)).join("");
  bodyEl.innerHTML = renderHeader(ctx) + sectionsHtml;
  refreshIcons();

  const locale = getCurrentLocale();
  const locationMount = bodyEl.querySelector<HTMLElement>('[data-table-mount="location"]');
  if (locationMount) {
    renderDataTable(
      locationMount,
      getLocationColumns(locale),
      ctx.detail.acquisitions,
      locale === "es" ? "No disponible en los juegos con datos de ubicación." : "Not available in games with location data."
    );
  }

  const movesMount = bodyEl.querySelector<HTMLElement>('[data-table-mount="moves"]');
  if (movesMount) {
    renderDataTable(
      movesMount,
      getMoveColumns(locale),
      buildMoveTableRows(ctx.detail.moveDetails, locale),
      locale === "es" ? "Sin datos de movimientos." : "No move data available."
    );
  }

  updateTocMenu();
}

// --- interactions ---------------------------------------------------------

function updateTocMenu(): void {
  const { fabContainer, tocList } = getModalElements();
  if (!fabContainer || !tocList) return;

  const order = getSectionOrder();
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const titles: Record<string, string> = {
    effectiveness: t.modal.effectiveness,
    location: t.modal.acquisition,
    moves: t.modal.moves,
    evolutions: t.modal.evolutions,
  };
  const icons: Record<string, string> = {
    effectiveness: "shield-check",
    location: "gamepad-2",
    moves: "swords",
    evolutions: "sparkles",
  };

  const topItem = `
    <button class="detail-toc-item" type="button" data-toc-target="header">
      <span class="detail-toc-item__icon"><i data-lucide="arrow-up"></i></span>
      <span class="detail-toc-item__title">${t.modal.top}</span>
    </button>
    <div class="detail-toc-divider"></div>
  `;

  const sectionItems = order
    .map((id) => {
      const isCollapsed = isSectionCollapsed(id);
      return `
        <button class="detail-toc-item" type="button" data-toc-target="${id}">
          <span class="detail-toc-item__icon"><i data-lucide="${icons[id] ?? "circle"}"></i></span>
          <span class="detail-toc-item__title">${titles[id] ?? capitalize(id)}</span>
          ${isCollapsed ? `<span class="detail-toc-item__status">${t.modal.collapsed}</span>` : ""}
        </button>
      `;
    })
    .join("");

  tocList.innerHTML = topItem + sectionItems;
  fabContainer.hidden = false;
  refreshIcons();
}

function closeTocMenu(): void {
  const { fabBtn, tocMenu } = getModalElements();
  if (!tocMenu || !fabBtn) return;
  tocMenu.classList.remove("is-open");
  tocMenu.setAttribute("aria-hidden", "true");
  fabBtn.classList.remove("is-active");
  fabBtn.setAttribute("aria-expanded", "false");
}

function toggleTocMenu(): void {
  const { fabBtn, tocMenu } = getModalElements();
  if (!tocMenu || !fabBtn) return;
  const isOpen = tocMenu.classList.toggle("is-open");
  tocMenu.setAttribute("aria-hidden", String(!isOpen));
  fabBtn.classList.toggle("is-active", isOpen);
  fabBtn.setAttribute("aria-expanded", String(isOpen));
}

function scrollToSection(targetId: string): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  closeTocMenu();

  if (targetId === "header") {
    bodyEl.scrollTo({ top: 0, behavior: "smooth" });
    const headerEl = bodyEl.querySelector<HTMLElement>(".detail-header");
    if (headerEl) {
      headerEl.classList.remove("section-target-highlight");
      void headerEl.offsetWidth;
      headerEl.classList.add("section-target-highlight");
      setTimeout(() => headerEl.classList.remove("section-target-highlight"), 1200);
    }
    return;
  }

  const sectionEl = bodyEl.querySelector<HTMLElement>(`[data-section-id="${targetId}"]`);
  if (!sectionEl) return;

  if (isSectionCollapsed(targetId)) {
    toggleSectionCollapse(targetId);
  }

  sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });

  sectionEl.classList.remove("section-target-highlight");
  void sectionEl.offsetWidth;
  sectionEl.classList.add("section-target-highlight");
  setTimeout(() => sectionEl.classList.remove("section-target-highlight"), 1200);
}

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

function toggleSectionCollapse(sectionId: string): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const sectionEl = bodyEl.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
  if (!sectionEl) return;

  const willCollapse = !sectionEl.classList.contains("is-collapsed");
  sectionEl.classList.toggle("is-collapsed", willCollapse);

  const headerEl = sectionEl.querySelector<HTMLElement>("[data-section-toggle]");
  if (headerEl) {
    headerEl.setAttribute("aria-expanded", String(!willCollapse));
  }

  const contentEl = sectionEl.querySelector<HTMLElement>(".detail-section__content");
  if (contentEl) {
    contentEl.hidden = willCollapse;
  }

  setSectionCollapsed(sectionId, willCollapse);
  updateTocMenu();
}

function updateHeaderCapturedState(captured: boolean): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const captureBtn = bodyEl.querySelector<HTMLButtonElement>("[data-modal-capture-btn]");
  if (captureBtn) {
    captureBtn.classList.toggle("btn--primary", !captured);
    captureBtn.innerHTML = `<i data-lucide="${captured ? "check" : "circle-dot"}"></i> ${captured ? t.pokedex.caught : t.pokedex.catch}`;
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

function reRenderHeader(): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl || !lastContext) return;
  const currentHeader = bodyEl.querySelector<HTMLElement>(".detail-header");
  if (!currentHeader) return;

  const temp = document.createElement("div");
  temp.innerHTML = renderHeader(lastContext);
  const newHeader = temp.firstElementChild;
  if (newHeader) {
    currentHeader.replaceWith(newHeader);
    refreshIcons();
    updateHexagonChartIfVisible();
  }
}

function closeModal(): void {
  currentId = null;
  currentSlotIndex = null;
  closeTocMenu();
  const { overlayEl, panelEl, fabContainer } = getModalElements();
  if (fabContainer) fabContainer.hidden = true;
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

    if (currentSlotIndex !== null) {
      const team = getTeam();
      const slot = team.slots[currentSlotIndex];
      if (slot) {
        const nextStats = { ...lastContext.detail.stats, ...(slot.stats ?? {}), [key]: value };
        if (slot.usePokedexData) {
          const overrides = getPokemonOverrides(currentId);
          overrides.stats = { ...overrides.stats, [key]: value };
          setPokemonOverrides(currentId, overrides);
        }
        setTeamSlotStats(currentSlotIndex, nextStats);
      }
    } else {
      const overrides = getPokemonOverrides(currentId);
      overrides.stats = { ...overrides.stats, [key]: value };
      setPokemonOverrides(currentId, overrides);
    }
    updateHexagonChartIfVisible();
  });

  document.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;

    if (target.matches("[data-link-pokedex]") && currentSlotIndex !== null && currentId !== null && lastContext) {
      const isChecked = (target as HTMLInputElement).checked;
      if (isChecked) {
        const pOverrides = getPokemonOverrides(currentId);
        const hasPokedexData = pOverrides.nature !== null || Object.keys(pOverrides.stats).length > 0;
        if (hasPokedexData) {
          copyPokedexToSlot(currentSlotIndex);
        } else {
          copySlotToPokedex(currentSlotIndex);
        }
        setTeamSlotUsePokedexData(currentSlotIndex, true);
      } else {
        setTeamSlotUsePokedexData(currentSlotIndex, false);
      }
      reRenderHeader();
      return;
    }

    if (!target.matches("[data-nature-select]") || currentId === null) return;

    const value = (target as HTMLSelectElement).value || null;
    if (currentSlotIndex !== null) {
      const team = getTeam();
      const slot = team.slots[currentSlotIndex];
      if (slot) {
        if (slot.usePokedexData) {
          const overrides = getPokemonOverrides(currentId);
          overrides.nature = value;
          setPokemonOverrides(currentId, overrides);
        }
        setTeamSlotNature(currentSlotIndex, value);
      }
    } else {
      const overrides = getPokemonOverrides(currentId);
      overrides.nature = value;
      setPokemonOverrides(currentId, overrides);
    }

    const nature = lastContext?.natures.find((n) => n.name === value) ?? null;
    const { bodyEl } = getModalElements();
    const locale = getCurrentLocale();

    if (bodyEl && lastContext) {
      const tooltipEl = bodyEl.querySelector<HTMLElement>("[data-nature-tooltip]");
      if (tooltipEl) tooltipEl.setAttribute("title", natureEffectText(nature, locale));

      const effectsEl = bodyEl.querySelector<HTMLElement>("[data-nature-effects-container]");
      if (effectsEl) effectsEl.innerHTML = renderNatureEffectBadges(nature, locale);

      STAT_KEYS.forEach((key) => {
        const inputEl = bodyEl.querySelector<HTMLInputElement>(`[data-stat-input][data-stat-key="${key}"]`);
        const statEl = inputEl?.closest<HTMLElement>(".detail-stat");
        if (statEl) {
          const mod = getNatureModifier(nature, key);
          statEl.classList.toggle("is-nature-up", mod === "up");
          statEl.classList.toggle("is-nature-down", mod === "down");

          let labelGroup = statEl.querySelector<HTMLElement>(".detail-stat__label-group");
          let modBadge = statEl.querySelector<HTMLElement>(".detail-stat__mod");

          if (mod === "up") {
            if (!modBadge) {
              modBadge = document.createElement("span");
              labelGroup?.appendChild(modBadge);
            }
            modBadge.className = "detail-stat__mod detail-stat__mod--up";
            modBadge.textContent = "▲ +10%";
            modBadge.title = locale === "es" ? "+10% por naturaleza" : "+10% from nature";
          } else if (mod === "down") {
            if (!modBadge) {
              modBadge = document.createElement("span");
              labelGroup?.appendChild(modBadge);
            }
            modBadge.className = "detail-stat__mod detail-stat__mod--down";
            modBadge.textContent = "▼ -10%";
            modBadge.title = locale === "es" ? "-10% por naturaleza" : "-10% from nature";
          } else if (modBadge) {
            modBadge.remove();
          }
        }
      });
    }

    updateHexagonChartIfVisible();
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
      const wrapper = bodyEl.querySelector<HTMLElement>("[data-stats-wrapper]");
      const hexView = bodyEl.querySelector<HTMLElement>("[data-stats-hexagon-view]");
      const labelEl = toggleBtn.querySelector<HTMLElement>("[data-chart-toggle-label]");

      if (wrapper && hexView) {
        wrapper.classList.toggle("has-hexagon", showHexagonChart);
        hexView.hidden = !showHexagonChart;
        updateHexagonChartIfVisible();
      }
      const locale = getCurrentLocale();
      if (labelEl) {
        labelEl.textContent = showHexagonChart ? (locale === "es" ? "Ocultar Juez" : "Hide Judge") : (locale === "es" ? "Gráfico Juez" : "Judge Chart");
      }
      toggleBtn.classList.toggle("btn--primary", showHexagonChart);
      refreshIcons();
      return;
    }

    const copyFromBtn = target.closest<HTMLButtonElement>("[data-copy-from-pokedex]");
    if (copyFromBtn && currentSlotIndex !== null && currentId !== null && lastContext) {
      const pOverrides = getPokemonOverrides(currentId);
      const hasData = pOverrides.nature !== null || (pOverrides.stats && Object.keys(pOverrides.stats).length > 0);
      const locale = getCurrentLocale();
      const t = getTranslations(locale);
      if (!hasData) {
        toast.info(t.modal.noPokedexData);
        return;
      }
      copyPokedexToSlot(currentSlotIndex);
      toast.success(t.modal.copiedFromPokedex);
      reRenderHeader();
      return;
    }

    const copyToBtn = target.closest<HTMLButtonElement>("[data-copy-to-pokedex]");
    if (copyToBtn && currentSlotIndex !== null && currentId !== null && lastContext) {
      copySlotToPokedex(currentSlotIndex);
      const locale = getCurrentLocale();
      const t = getTranslations(locale);
      toast.success(t.modal.savedToPokedex);
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
      const locale = getCurrentLocale();
      if (nowCaptured) {
        toast.success(locale === "es" ? `¡${name} capturado!` : `${name} caught!`);
        if (medal && medalImg && stampImg) {
          medal.hidden = false;
          animateMedalReveal(medalImg, stampImg);
        }
      } else {
        toast.info(locale === "es" ? `${name} liberado de tu Pokédex.` : `${name} released from your Pokédex.`);
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
    if (upBtn) {
      if (!upBtn.disabled) {
        swapSection(upBtn.dataset.sectionId!, -1);
      }
      return;
    }

    const downBtn = target.closest<HTMLButtonElement>("[data-move-down]");
    if (downBtn) {
      if (!downBtn.disabled) {
        swapSection(downBtn.dataset.sectionId!, 1);
      }
      return;
    }

    if (target.closest(".detail-section__reorder")) {
      return;
    }

    const sectionToggle = target.closest<HTMLElement>("[data-section-toggle]");
    if (sectionToggle) {
      const sectionId = sectionToggle.dataset.sectionToggle;
      if (sectionId) {
        toggleSectionCollapse(sectionId);
      }
      return;
    }

    const fabBtn = target.closest<HTMLButtonElement>("[data-detail-fab-btn]");
    if (fabBtn) {
      toggleTocMenu();
      return;
    }

    const tocItem = target.closest<HTMLButtonElement>("[data-toc-target]");
    if (tocItem) {
      const targetId = tocItem.dataset.tocTarget;
      if (targetId) scrollToSection(targetId);
      return;
    }

    const { tocMenu } = getModalElements();
    if (tocMenu && tocMenu.classList.contains("is-open") && !target.closest("[data-detail-fab-container]")) {
      closeTocMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    const { overlayEl, tocMenu } = getModalElements();
    if (e.key === "Escape") {
      if (tocMenu && tocMenu.classList.contains("is-open")) {
        closeTocMenu();
        return;
      }
      if (overlayEl && !overlayEl.hidden) {
        closeModal();
        return;
      }
    }

    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target && target.matches("[data-section-toggle]")) {
        e.preventDefault();
        const sectionId = target.dataset.sectionToggle;
        if (sectionId) {
          toggleSectionCollapse(sectionId);
        }
      }
    }
  });
}

bindModalEvents();

// --- public API -------------------------------------------------------

export async function openPokemonModal(id: number, options?: PokemonModalOptions): Promise<void> {
  currentId = id;
  currentSlotIndex = options?.slotIndex ?? null;
  const { overlayEl, panelEl, bodyEl, fabContainer } = getModalElements();
  if (!overlayEl || !panelEl || !bodyEl) return;

  if (fabContainer) fabContainer.hidden = true;
  closeTocMenu();

  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const loadingHtml = `<div class="detail-loading"><div class="spinner"></div><p>${t.modal.loading}</p></div>`;

  if (overlayEl.hidden) {
    bodyEl.innerHTML = loadingHtml;
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    modalIn(overlayEl, panelEl);
  } else {
    bodyEl.innerHTML = loadingHtml;
  }

  try {
    const [allPokemon, detail, natures, typeChart] = await Promise.all([
      getAllPokemon(),
      getPokemonDetail(id),
      getNatures(),
      getTypeChart(),
    ]);
    if (currentId !== id) return;

    const pokemon = allPokemon.find((p) => p.id === id);
    if (!pokemon) {
      closeModal();
      return;
    }

    const allById = new Map(allPokemon.map((p) => [p.id, p]));
    const chain = detail.evolutionChainId !== null ? await getEvolutionChain(detail.evolutionChainId).catch(() => null) : null;
    if (currentId !== id) return;

    render({ pokemon, detail, chain, natures, allById, typeChart });
    bodyEl.scrollTop = 0;
  } catch (err) {
    console.error("Error cargando detalles del Pokémon:", err);
    toast.error(t.modal.loadError);
    closeModal();
  }
}
