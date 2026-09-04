import { renderDataTable } from "../dataTable";
import { getCurrentLocale } from "../i18n/translations";
import { refreshIcons } from "../icons";
import { getSectionOrder } from "../storage";
import { getModalElements } from "./dom";
import { renderHeader } from "./sections/header";
import { renderSection } from "./sections/sectionWrapper";
import { buildMoveTableRows, getLocationColumns, getMoveColumns } from "./sections/tables";
import { modalState } from "./state";
import { updateTocMenu } from "./toc";
import type { RenderContext } from "./types";

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
    renderDataTable(
      movesMount,
      getMoveColumns(locale),
      buildMoveTableRows(ctx.detail.moveDetails, locale),
      locale === "es" ? "Sin datos de movimientos." : "No move data available."
    );
  }

  updateTocMenu();
}
