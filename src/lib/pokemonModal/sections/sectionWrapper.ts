import { getCurrentLocale, getTranslations } from "../../i18n/translations";
import { isSectionCollapsed } from "../../storage";
import { getCurrentEffectiveOverrides } from "../overrides";
import type { RenderContext } from "../types";
import { capitalize, getDefaultAbility } from "../utils";
import { renderAbilitiesContent } from "./abilities";
import { renderEffectivenessContent } from "./effectiveness";
import { renderEvolutionsContent } from "./evolutions";

export const SECTION_CONTENT: Record<string, (ctx: RenderContext) => string> = {
  effectiveness: (ctx) => renderEffectivenessContent(ctx.pokemon, ctx.typeChart),
  abilities: (ctx) => {
    const overrides = getCurrentEffectiveOverrides();
    const activeAbility = overrides.ability ?? getDefaultAbility(ctx.detail);
    return renderAbilitiesContent(ctx.detail, activeAbility);
  },
  location: () => `<div data-table-mount="location"></div>`,
  moves: () => {
    const locale = getCurrentLocale();
    const t = getTranslations(locale);
    return `
      <div class="move-table-toolbar" data-move-table-toolbar>
        <div class="search-with-help">
          <search class="move-table-search" role="search">
            <i data-lucide="search" class="move-table-search__icon"></i>
            <input
              type="search"
              class="move-table-search__input"
              data-move-search-input
              placeholder="${t.modal.searchMovesPlaceholder}"
              aria-label="${t.modal.searchMovesPlaceholder}"
              autocomplete="off"
              spellcheck="false"
            />
            <button type="button" class="move-table-search__clear" data-move-search-clear aria-label="${t.modal.clearSearch}" hidden>
              <i data-lucide="x"></i>
            </button>
          </search>
          <button
            type="button"
            class="filter-help-btn"
            data-open-move-filter-guide
            title="${t.moveFilterGuide.buttonTitle}"
            aria-label="${t.moveFilterGuide.buttonTitle}"
          >
            <i data-lucide="help-circle"></i>
          </button>
        </div>
        <span class="move-table-count" data-move-table-count hidden></span>
      </div>
      <div data-table-mount="moves"></div>
    `;
  },
  evolutions: (ctx) => renderEvolutionsContent(ctx.chain, ctx.pokemon.id, ctx.allById),
};

export function renderSection(id: string, index: number, total: number, ctx: RenderContext): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const titles: Record<string, string> = {
    effectiveness: t.modal.effectiveness,
    abilities: t.modal.abilities,
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
          <button type="button" data-move-top data-section-id="${id}" ${index === 0 ? "disabled" : ""} aria-label="${locale === "es" ? "Mover arriba del todo" : "Move to top"}">
            <i data-lucide="chevrons-up"></i>
          </button>
          <button type="button" data-move-up data-section-id="${id}" ${index === 0 ? "disabled" : ""} aria-label="${locale === "es" ? "Subir una posición" : "Move section up"}">
            <i data-lucide="chevron-up"></i>
          </button>
          <button type="button" data-move-down data-section-id="${id}" ${index === total - 1 ? "disabled" : ""} aria-label="${locale === "es" ? "Bajar una posición" : "Move section down"}">
            <i data-lucide="chevron-down"></i>
          </button>
          <button type="button" data-move-bottom data-section-id="${id}" ${index === total - 1 ? "disabled" : ""} aria-label="${locale === "es" ? "Mover abajo del todo" : "Move to bottom"}">
            <i data-lucide="chevrons-down"></i>
          </button>
        </div>
      </div>
      <div class="detail-section__content" ${isCollapsed ? "hidden" : ""}>${SECTION_CONTENT[id] ? SECTION_CONTENT[id](ctx) : ""}</div>
    </section>
  `;
}
