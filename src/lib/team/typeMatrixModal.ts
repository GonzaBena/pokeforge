import { getTypeMultiplier } from "../typeChart";
import type { TypeChart } from "../types";
import { getTranslations, getTypeName } from "../i18n/translations";
import { typeColor } from "../typeColors";
import { refreshIcons } from "../icons";
import { capitalize } from "./helpers";
import type { Pokemon, TeamSlotState } from "../types";
import type { TeamContext } from "./types";

export interface MatrixCellResult {
  multiplier: number;
  label: string;
  badgeClass: string;
}

export function computeMatrixDefenseCell(
  typeChart: TypeChart,
  attackType: string,
  pokemonTypes: string[],
  options?: { item?: string | null; speciesId?: number; ability?: string | null }
): MatrixCellResult {
  const mult = getTypeMultiplier(typeChart, attackType, pokemonTypes, options);
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

  return { multiplier: mult, label, badgeClass };
}

export function computeMatrixOffenseCell(
  typeChart: TypeChart,
  defendType: string,
  attackTypes: string[]
): MatrixCellResult {
  let bestMult = 1;
  for (const sType of attackTypes) {
    const m = typeChart.chart[sType]?.[defendType] ?? 1;
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

  return { multiplier: bestMult, label, badgeClass };
}

export function setupTypeMatrixModal(context: TeamContext) {
  const openTypeMatrixBtns = document.querySelectorAll<HTMLButtonElement>("[data-open-type-matrix]");
  const typeMatrixOverlay = document.querySelector<HTMLElement>("[data-type-matrix-overlay]");
  const typeMatrixCloseBtn = document.querySelector<HTMLButtonElement>("[data-type-matrix-close]");
  const typeMatrixContent = document.querySelector<HTMLElement>("[data-type-matrix-content]");

  let activeMatrixMode: "defense" | "offense" = "defense";

  function renderTypeMatrix(): void {
    if (!typeMatrixContent) return;
    const typeChart = context.getTypeChart();
    if (!typeChart) return;

    const locale = context.getLocale();
    const t = getTranslations(locale);
    const team = context.getTeam();
    const pokemonById = context.getPokemonById();
    const moveDetailsMap = context.getMoveDetailsMap();

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

        const cellsHtml = typeChart.types
          .map((type) => {
            if (activeMatrixMode === "defense") {
              const cell = computeMatrixDefenseCell(typeChart, type, pokemon.types, {
                item: slot.item,
                speciesId: pokemon.id,
                ability: slot.ability,
              });

              return `
                <td>
                  <span class="matrix-badge ${cell.badgeClass}" title="${capitalize(pokemon.name)} vs ${getTypeName(type, locale)}: ${cell.multiplier}×">${cell.label}</span>
                </td>
              `;
            } else {
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

              const cell = computeMatrixOffenseCell(typeChart, type, sources);

              return `
                <td>
                  <span class="matrix-badge ${cell.badgeClass}" title="${capitalize(pokemon.name)} → ${getTypeName(type, locale)}: ${cell.multiplier}×">${cell.label}</span>
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
            const mult = getTypeMultiplier(typeChart, type, pokemon.types);
            if (mult === 0) immune++;
            else if (mult > 1) weak++;
            else if (mult < 1) resist++;
          }

          const netScore = resist + immune - weak;
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
            if (effectiveSources.some((st: string) => (typeChart.chart[st]?.[type] ?? 1) >= 2)) {
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

    const legendHtml =
      activeMatrixMode === "defense"
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
    context.updateBodyScrollLock();
  }

  openTypeMatrixBtns.forEach((btn) => btn.addEventListener("click", openTypeMatrixModal));
  typeMatrixCloseBtn?.addEventListener("click", closeTypeMatrixModal);
  typeMatrixOverlay?.addEventListener("click", (e) => {
    if (e.target === typeMatrixOverlay) closeTypeMatrixModal();
  });

  return {
    renderTypeMatrix,
    openTypeMatrixModal,
    closeTypeMatrixModal,
    isOverlayOpen: () => Boolean(typeMatrixOverlay && !typeMatrixOverlay.hidden),
  };
}
