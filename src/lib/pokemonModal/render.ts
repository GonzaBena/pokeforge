import { renderDataTable } from "../dataTable";
import { getCurrentLocale, getTranslations } from "../i18n/translations";
import { refreshIcons } from "../icons";
import { getSectionOrder } from "../storage";
import { getModalElements } from "./dom";
import { renderHeader } from "./sections/header";
import { renderSection } from "./sections/sectionWrapper";
import { buildMoveTableRows, getLocationColumns, getMoveColumns } from "./sections/tables";
import { modalState } from "./state";
import { updateTocMenu } from "./toc";
import type { RenderContext } from "./types";
import { matchesMoveFilter, parseMoveQuery, type MoveFilterItem } from "../moveFilters";

function normalizeSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function render(ctx: RenderContext): void {
  modalState.lastContext = ctx;
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
    const t = getTranslations(locale);
    const rows = buildMoveTableRows(ctx.detail.moveDetails, locale, ctx.moveDetailsMap);
    const toolbar = bodyEl.querySelector<HTMLElement>("[data-move-table-toolbar]");
    const searchInput = bodyEl.querySelector<HTMLInputElement>("[data-move-search-input]");
    const clearBtn = bodyEl.querySelector<HTMLButtonElement>("[data-move-search-clear]");
    const countEl = bodyEl.querySelector<HTMLElement>("[data-move-table-count]");

    if (toolbar) {
      toolbar.hidden = rows.length === 0;
    }
    if (searchInput) {
      searchInput.value = "";
    }
    if (clearBtn) {
      clearBtn.hidden = true;
    }
    if (countEl) {
      countEl.hidden = true;
    }

    modalState.moveTableHandle = renderDataTable(
      movesMount,
      getMoveColumns(locale),
      rows,
      locale === "es" ? "Sin datos de movimientos." : "No move data available.",
      {
        scrollHint:
          locale === "es"
            ? "← Deslizá horizontalmente para ver todos los detalles →"
            : "← Scroll horizontally to see all details →",
        noMatchMessage: t.modal.noMovesMatch,
        globalFilterFn: (row, _colId, filterVal) => {
          const rawFilter = String(filterVal ?? "").trim();
          if (!rawFilter) return true;
          const item: MoveFilterItem = {
            name: row.original.rawName ?? row.original.name,
            nameEs: row.original.nameEs ?? row.original.name,
            nameEn: row.original.nameEn,
            type: row.original.type,
            category: row.original.category,
            power: row.original.power,
            pp: row.original.pp,
            accuracy: row.original.accuracy,
            method: row.original.method,
            level: row.original.level,
          };
          if (matchesMoveFilter(item, rawFilter, locale)) {
            return true;
          }
          // Fallback for simple free-text queries matching type name or method label
          const parsed = parseMoveQuery(rawFilter);
          if (
            parsed.types.length === 0 &&
            parsed.categories.length === 0 &&
            parsed.methods.length === 0 &&
            parsed.numericFilters.length === 0 &&
            parsed.textTerms.length > 0
          ) {
            const q = normalizeSearch(rawFilter);
            const type = normalizeSearch(row.original.typeName || row.original.type || "");
            const method = normalizeSearch(row.original.methodLabel || row.original.method || "");
            const cat = normalizeSearch(row.original.categoryLabel || row.original.category || "");
            return type.includes(q) || method.includes(q) || cat.includes(q);
          }
          return false;
        },
        onRowCountChange: (filteredCount, totalCount) => {
          if (!countEl) return;
          if (filteredCount < totalCount) {
            countEl.textContent = t.modal.movesCount
              .replace("{filtered}", String(filteredCount))
              .replace("{total}", String(totalCount));
            countEl.hidden = false;
          } else {
            countEl.hidden = true;
          }
        },
      },
    );
  } else {
    modalState.moveTableHandle = null;
  }

  updateTocMenu();
}
