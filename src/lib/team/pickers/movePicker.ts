import { getPokemonDetail } from "../../pokemonDetail";
import { getMoveDescription, getMoveName, getTranslations, getTypeName } from "../../i18n/translations";
import { typeColor } from "../../typeColors";
import { refreshIcons } from "../../icons";
import { toast } from "../../toast";
import { setTeamSlotMove } from "../../storage";
import { matchesMoveFilter, parseMoveQuery, type MoveFilterItem } from "../../moveFilters";
import type { MoveDetail } from "../../types";
import { capitalize, categoryLabel, formatLabel, METHOD_LABELS, renderEmptyState } from "../helpers";
import type { MovePickerRow, TeamContext } from "../types";

export function setupMovePicker(context: TeamContext) {
  const movePickerOverlayEl = document.querySelector<HTMLElement>("[data-move-picker-overlay]")!;
  const movePickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-move-picker-close]")!;
  const movePickerSearchEl = document.querySelector<HTMLInputElement>("[data-move-picker-search]")!;
  const movePickerResultsEl = document.querySelector<HTMLElement>("[data-move-picker-results]")!;
  const movePickerTitleEl = document.querySelector<HTMLElement>("[data-move-picker-title]")!;
  const moveMethodFilterEl = document.querySelector<HTMLElement>("[data-move-method-filter]");
  const moveCategoryFilterEl = document.querySelector<HTMLElement>("[data-move-category-filter]");
  const moveTypeFilterEl = document.querySelector<HTMLElement>("[data-move-type-filter]");
  const movePickerBodyEl = document.querySelector<HTMLElement>("[data-move-picker-body]");

  let activeMoveSlotIndex: number | null = null;
  let activeMoveIndex: number | null = null;
  let activeMethodFilter: string = "all";
  let activeCategoryFilter: string = "all";
  let activeMoveTypeFilter: string = "all";
  let currentMoveRows: MovePickerRow[] = [];

  function pokemonForSlot(index: number) {
    const id = context.getTeam().slots[index]?.pokemonId ?? null;
    return id !== null ? context.getPokemonById().get(id) ?? null : null;
  }

  function renderMovePickerTable(): void {
    const locale = context.getLocale();
    const t = getTranslations(locale);
    const searchRaw = movePickerSearchEl.value.trim();
    const parsedQuery = searchRaw ? parseMoveQuery(searchRaw) : null;
    const moveDetailsMap = context.getMoveDetailsMap();

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

      // 4. Advanced & multilingual search query filter
      if (parsedQuery) {
        const item: MoveFilterItem = {
          name: r.name,
          nameEs: meta?.nameEs,
          nameEn: meta?.nameEn,
          type: meta?.type,
          category: meta?.category,
          power: meta?.power,
          pp: meta?.pp,
          accuracy: meta?.accuracy,
          method: r.method,
          level: r.level,
        };
        if (!matchesMoveFilter(item, parsedQuery, locale)) {
          return false;
        }
      }

      return true;
    });

    const countEl = document.querySelector<HTMLElement>("[data-move-picker-count]");
    if (countEl) {
      countEl.textContent = `${filtered.length} ${locale === "es" ? "ataques" : "moves"}`;
    }

    if (!filtered.length) {
      movePickerResultsEl.innerHTML = renderEmptyState({
        icon: "swords",
        title: locale === "es" ? "No se encontraron movimientos" : "No moves found",
        description:
          locale === "es"
            ? "Probá cambiando la categoría, el método de aprendizaje o quitando los filtros aplicados."
            : "Try changing the category, learn method, or clearing the applied filters.",
        actionText: locale === "es" ? "Restablecer filtros" : "Reset filters",
        actionAttr: "data-clear-move-filters",
      });
      refreshIcons();
      return;
    }

    const rowsHtml = filtered
      .map((r) => {
        const meta = moveDetailsMap[r.name];
        const typeBadgeHtml = meta
          ? `<span class="type-badge type-badge--sm" data-type="${meta.type}" style="--badge-bg:${typeColor(meta.type)}">${getTypeName(meta.type, locale)}</span>`
          : "-";
        const categoryBadgeHtml = meta
          ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category, locale)}</span>`
          : "-";
        const powerText = meta?.power !== null && meta?.power !== undefined ? meta.power : "-";
        const ppText = meta?.pp !== null && meta?.pp !== undefined ? meta.pp : "-";
        const accuracyText = meta?.accuracy !== null && meta?.accuracy !== undefined ? `${meta.accuracy}%` : "-";
        const levelText = r.method === "level-up" ? `${locale === "es" ? "Nv." : "Lv."} ${r.level}` : "-";
        const methodBadgeClass = `move-method-badge move-method-badge--${r.method}`;

        const rowMoveName = getMoveName(r.name, locale, meta);
        const rowMoveDesc = getMoveDescription(meta, locale);
        const rowAriaLabel = `${rowMoveName} - ${rowMoveDesc}`;

        return `
          <tr data-pick-move="${r.name}">
            <td class="move-table__cell-name" data-label="${t.modal.move}">
              <div class="move-name-wrap">
                <button
                  type="button"
                  class="move-help-btn"
                  data-move-tooltip-trigger
                  data-move-name="${rowMoveName.replace(/"/g, "&quot;")}"
                  data-move-desc="${rowMoveDesc.replace(/"/g, "&quot;")}"
                  aria-label="${rowAriaLabel.replace(/"/g, "&quot;")}"
                  title="${rowMoveDesc.replace(/"/g, "&quot;")}"
                ><span class="move-help-btn__text" aria-hidden="true">?</span></button>
                <span class="move-table__name">${rowMoveName}</span>
              </div>
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

  function clearMovePickerFilters(): void {
    activeMethodFilter = "all";
    activeCategoryFilter = "all";
    activeMoveTypeFilter = "all";
    if (movePickerSearchEl) movePickerSearchEl.value = "";

    moveMethodFilterEl?.querySelectorAll<HTMLButtonElement>("[data-method]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.method === "all"));
    });
    moveCategoryFilterEl?.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.category === "all"));
    });
    moveTypeFilterEl?.querySelectorAll<HTMLButtonElement>("[data-move-type]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.moveType === "all"));
    });

    renderMovePickerTable();
  }

  async function openMovePicker(slotIndex: number, moveIndex: number): Promise<void> {
    const slot = context.getTeam().slots[slotIndex];
    if (!slot || slot.pokemonId === null) return;
    const pokemon = context.getPokemonById().get(slot.pokemonId);
    if (!pokemon) return;

    activeMoveSlotIndex = slotIndex;
    activeMoveIndex = moveIndex;
    activeMethodFilter = "all";
    activeCategoryFilter = "all";
    activeMoveTypeFilter = "all";

    const locale = context.getLocale();
    if (movePickerTitleEl) {
      movePickerTitleEl.textContent =
        locale === "es"
          ? `Ataque ${moveIndex + 1} - ${capitalize(pokemon.name)}`
          : `Move ${moveIndex + 1} - ${capitalize(pokemon.name)}`;
    }
    movePickerSearchEl.value = "";
    movePickerOverlayEl.hidden = false;
    if (movePickerBodyEl) {
      movePickerBodyEl.scrollTop = 0;
    }
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

    const rawDetails: MoveDetail[] =
      detail.moveDetails && detail.moveDetails.length
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
    context.updateBodyScrollLock();
    activeMoveSlotIndex = null;
    activeMoveIndex = null;
    currentMoveRows = [];
  }

  // Event wiring
  movePickerCloseBtn.addEventListener("click", closeMovePicker);
  movePickerOverlayEl.addEventListener("click", (e) => {
    if (e.target === movePickerOverlayEl) closeMovePicker();
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
    const targetType = btn.dataset.moveType!;
    if (targetType !== "all" && activeMoveTypeFilter === targetType) {
      activeMoveTypeFilter = "all";
    } else {
      activeMoveTypeFilter = targetType;
    }
    moveTypeFilterEl.querySelectorAll<HTMLButtonElement>("[data-move-type]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.moveType === activeMoveTypeFilter));
    });
    renderMovePickerTable();
  });

  movePickerResultsEl.addEventListener("click", (e) => {
    const clearBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-clear-move-filters]");
    if (clearBtn) {
      clearMovePickerFilters();
      return;
    }

    if ((e.target as HTMLElement).closest("[data-move-tooltip-trigger]")) {
      return;
    }

    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-pick-move]");
    if (!target || activeMoveSlotIndex === null || activeMoveIndex === null) return;
    const moveName = target.dataset.pickMove!;
    const pokemon = pokemonForSlot(activeMoveSlotIndex);

    const nextTeam = setTeamSlotMove(activeMoveSlotIndex, activeMoveIndex, moveName);
    context.setTeam(nextTeam);
    context.renderSingleSlot(activeMoveSlotIndex);
    context.renderStrengthsPanel();
    closeMovePicker();

    if (pokemon) {
      const locale = context.getLocale();
      const meta = context.getMoveDetailsMap()[moveName];
      const localizedMove = getMoveName(moveName, locale, meta);
      toast.success(
        locale === "es"
          ? `Ataque "${localizedMove}" asignado a ${capitalize(pokemon.name)}.`
          : `Move "${localizedMove}" assigned to ${capitalize(pokemon.name)}.`
      );
    }
  });

  return {
    openMovePicker,
    closeMovePicker,
    renderMovePickerTable,
    isOverlayOpen: () => !movePickerOverlayEl.hidden,
  };
}
