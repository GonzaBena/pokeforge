import { getCurrentLocale, getTranslations, getEvolutionTriggerName, type Locale } from "../../i18n/translations";
import type { EvolutionChain, EvolutionNode, Pokemon } from "../../types";
import { dexNumber, formatLabel, typeBadgesHtml } from "../utils";

export function evolutionConditionText(node: EvolutionNode, locale: Locale): string {
  if (node.evolvesFromSpecies === null) return "";
  const parts: string[] = [];
  if (node.minLevel) parts.push(locale === "es" ? `Nivel ${node.minLevel}` : `Level ${node.minLevel}`);
  if (node.item) parts.push(locale === "es" ? (node.itemDisplay ?? formatLabel(node.item)) : formatLabel(node.item));
  if (node.trigger && node.trigger !== "level-up" && !node.item) {
    parts.push(getEvolutionTriggerName(node.trigger, locale));
  }
  return parts.length ? parts.join(" · ") : (locale === "es" ? "Condición especial" : "Special condition");
}

export function renderEvolutionsContent(chain: EvolutionChain | null, currentPokemonId: number, allById: Map<number, Pokemon>): string {
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
