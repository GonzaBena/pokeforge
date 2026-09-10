import { getEffectiveTypeMultiplier } from "../../typeChart";
import { typeColor } from "../../typeColors";
import { getCurrentLocale, getTypeName, getTranslations, type Locale } from "../../i18n/translations";
import { getItemDisplayName } from "../../items";
import type { Pokemon, TypeChart } from "../../types";
import type { EffectivenessItem } from "../types";
import { getCurrentEffectiveOverrides } from "../overrides";

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
  const noteBadge = item.note ? `<span class="detail-effectiveness__note">(${item.note})</span>` : "";

  return `<li class="detail-effectiveness__item"><span class="type-badge type-badge--sm" data-type="${item.type}" style="--badge-bg:${color}">${typeName}</span>, <span class="detail-effectiveness__val detail-effectiveness__val--${valClass}">${valStr}</span> ${noteBadge}</li>`;
}

export function renderEffectivenessContent(pokemon: Pokemon, typeChart: TypeChart): string {
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const overrides = getCurrentEffectiveOverrides();

  if (!typeChart || !typeChart.types) {
    return `<p class="detail-empty">${locale === "es" ? "Datos de tipos no disponibles." : "Type data not available."}</p>`;
  }

  const weaknesses: EffectivenessItem[] = [];
  const resistances: EffectivenessItem[] = [];
  const immunities: EffectivenessItem[] = [];

  for (const attackingType of typeChart.types) {
    const { multiplier: mult, itemEffectNote } = getEffectiveTypeMultiplier(typeChart, attackingType, pokemon.types, {
      item: overrides.item,
      speciesId: pokemon.id,
      ability: overrides.ability,
    });

    const note = itemEffectNote ? getItemDisplayName(itemEffectNote, locale) : undefined;

    if (mult > 1) {
      weaknesses.push({ type: attackingType, multiplier: mult, note });
    } else if (mult === 0) {
      immunities.push({ type: attackingType, multiplier: mult, note });
    } else if (mult < 1) {
      resistances.push({ type: attackingType, multiplier: mult, note });
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
