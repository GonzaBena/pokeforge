import { getTypeMultiplier } from "../../typeChart";
import { typeColor } from "../../typeColors";
import { getCurrentLocale, getTypeName, getTranslations, type Locale } from "../../i18n/translations";
import type { Pokemon, TypeChart } from "../../types";
import type { EffectivenessItem } from "../types";

export function getValClass(multiplier: number): string {
  if (multiplier >= 4) return "quad";
  if (multiplier > 1) return "double";
  if (multiplier === 0) return "immune";
  if (multiplier <= 0.25) return "quarter";
  if (multiplier < 1) return "half";
  return "neutral";
}

export function renderEffectivenessItem(item: EffectivenessItem, locale: Locale): string {
  const typeName = getTypeName(item.type, locale);
  const color = typeColor(item.type);
  const valStr = `x${item.multiplier}`;
  const valClass = getValClass(item.multiplier);

  return `<li class="detail-effectiveness__item"><span class="type-badge type-badge--sm" data-type="${item.type}" style="--badge-bg:${color}">${typeName}</span>, <span class="detail-effectiveness__val detail-effectiveness__val--${valClass}">${valStr}</span></li>`;
}

export function renderEffectivenessContent(pokemon: Pokemon, typeChart: TypeChart): string {
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
