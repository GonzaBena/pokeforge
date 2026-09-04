import { getCurrentLocale, getTranslations } from "../../i18n/translations";
import { isSectionCollapsed } from "../../storage";
import type { RenderContext } from "../types";
import { capitalize } from "../utils";
import { renderEffectivenessContent } from "./effectiveness";
import { renderEvolutionsContent } from "./evolutions";

export const SECTION_CONTENT: Record<string, (ctx: RenderContext) => string> = {
  effectiveness: (ctx) => renderEffectivenessContent(ctx.pokemon, ctx.typeChart),
  location: () => `<div data-table-mount="location"></div>`,
  moves: () => `<div data-table-mount="moves"></div>`,
  evolutions: (ctx) => renderEvolutionsContent(ctx.chain, ctx.pokemon.id, ctx.allById),
};

export function renderSection(id: string, index: number, total: number, ctx: RenderContext): string {
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
