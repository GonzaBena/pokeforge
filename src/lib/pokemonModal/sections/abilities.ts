import { getCurrentLocale, getTranslations } from "../../i18n/translations";
import type { PokemonDetail } from "../../types";
import { capitalize } from "../utils";

export function renderAbilitiesContent(detail: PokemonDetail, activeAbility: string | null): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const abilities = detail.abilities ?? [];

  if (abilities.length === 0) {
    return `<div class="detail-abilities-empty">${t.modal.noAbilities}</div>`;
  }

  const cardsHtml = abilities
    .map((ab) => {
      const name = locale === "es" ? (ab.nameEs || capitalize(ab.name)) : (ab.nameEn || capitalize(ab.name));
      const desc = locale === "es" ? (ab.descriptionEs || ab.descriptionEn || "") : (ab.descriptionEn || ab.descriptionEs || "");
      const isActive = activeAbility === ab.name;

      let badgeHtml = "";
      if (ab.isHidden) {
        badgeHtml = `<span class="detail-ability-card__badge detail-ability-card__badge--hidden"><i data-lucide="eye-off"></i> ${t.modal.hiddenAbility}</span>`;
      } else {
        const pct = Math.round(ab.probability * 100);
        badgeHtml = `<span class="detail-ability-card__badge detail-ability-card__badge--prob" title="${t.modal.probability}: ${pct}%">${pct}%</span>`;
      }

      const activeBadgeHtml = isActive
        ? `<span class="detail-ability-card__badge detail-ability-card__badge--active"><i data-lucide="check"></i> ${t.modal.activeAbility}</span>`
        : "";

      return `
        <div class="detail-ability-card ${isActive ? "is-active" : ""}" data-ability-card="${ab.name}">
          <div class="detail-ability-card__header">
            <div class="detail-ability-card__title-group">
              <span class="detail-ability-card__name">${name}</span>
              ${ab.nameEn && locale === "es" ? `<span class="detail-ability-card__en">(${ab.nameEn})</span>` : ""}
            </div>
            <div class="detail-ability-card__badges">
              ${activeBadgeHtml}
              ${badgeHtml}
            </div>
          </div>
          ${desc ? `<p class="detail-ability-card__desc">${desc}</p>` : ""}
        </div>
      `;
    })
    .join("");

  return `<div class="detail-abilities-list">${cardsHtml}</div>`;
}
