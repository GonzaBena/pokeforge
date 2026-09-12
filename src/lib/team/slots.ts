import type { MoveData, Pokemon, TeamSlotState } from "../types";
import { getCurrentLocale, getMoveDescription, getMoveName, getNatureName, getTranslations, getTypeName, type Locale } from "../i18n/translations";
import { typeColor } from "../typeColors";
import { getItemDisplayName, renderItemIconHTML } from "../items";
import { badgeBounceIn, slotPopIn } from "../animations";
import { refreshIcons } from "../icons";
import { openPokemonModal } from "../pokemonModal/lifecycle";
import { setTeamSlot, setTeamSlotMove } from "../storage";
import { categoryLabel, dexNumber } from "./helpers";
import type { TeamContext } from "./types";

export function renderSlotHTML(
  index: number,
  pokemon: Pokemon | null,
  slotData?: TeamSlotState,
  locale: Locale = getCurrentLocale(),
  moveDetailsMap: Record<string, MoveData> = {}
): string {
  const t = getTranslations(locale);

  if (!pokemon) {
    return `
      <div class="team-slot-column" data-slot-column="${index}">
        <div class="team-slot" data-team-slot data-slot-index="${index}">
          <i data-lucide="plus-circle"></i>
          <span>${t.team.choosePokemon}</span>
        </div>
      </div>
    `;
  }

  const slotMoves = Array.from({ length: 4 }, (_, i) => slotData?.moves?.[i] ?? null);

  const sprite = pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const typesHtml = pokemon.types
    .map((type) => `<span class="type-badge" data-type="${type}" style="--badge-bg:${typeColor(type)}">${getTypeName(type, locale)}</span>`)
    .join("");

  const movesHtml = slotMoves
    .map((moveName, mIdx) => {
      if (!moveName) {
        return `
          <button class="move-slot-btn empty" type="button" data-move-slot data-slot-index="${index}" data-move-index="${mIdx}" data-select-move>
            <i data-lucide="plus"></i> <span>${locale === "es" ? `Ataque ${mIdx + 1}` : `Move ${mIdx + 1}`}</span>
          </button>
        `;
      }

      const meta = moveDetailsMap[moveName];
      const typeBadgeHtml = meta
        ? `<span class="type-badge type-badge--sm" data-type="${meta.type}" style="--badge-bg:${typeColor(meta.type)}">${getTypeName(meta.type, locale)}</span>`
        : "";
      const categoryBadgeHtml = meta
        ? `<span class="move-category-badge move-category-badge--${meta.category}">${categoryLabel(meta.category, locale)}</span>`
        : "";
      const powerText = meta?.power !== null && meta?.power !== undefined ? meta.power : "-";
      const ppText = meta?.pp !== null && meta?.pp !== undefined ? meta.pp : "-";

      const slotMoveName = getMoveName(moveName, locale, meta);
      const slotMoveDesc = getMoveDescription(meta, locale);
      const slotAriaLabel = `${slotMoveName} - ${slotMoveDesc}`;

      return `
        <div class="move-slot-card filled" data-move-slot data-slot-index="${index}" data-move-index="${mIdx}" draggable="true">
          <div class="move-slot-card__top">
            <div class="move-slot-drag-handle" data-drag-handle title="${locale === "es" ? "Arrastrar para reordenar" : "Drag to reorder"}" aria-label="${locale === "es" ? "Arrastrar para reordenar" : "Drag to reorder"}">
              <i data-lucide="grip-vertical"></i>
            </div>
            <button
              type="button"
              class="move-help-btn move-help-btn--slot"
              data-move-tooltip-trigger
              data-move-name="${slotMoveName.replace(/"/g, "&quot;")}"
              data-move-desc="${slotMoveDesc.replace(/"/g, "&quot;")}"
              aria-label="${slotAriaLabel.replace(/"/g, "&quot;")}"
              title="${slotMoveDesc.replace(/"/g, "&quot;")}"
            ><span class="move-help-btn__text" aria-hidden="true">?</span></button>
            <button class="move-slot-card__name-btn" type="button" data-select-move data-slot-index="${index}" data-move-index="${mIdx}">
              <i data-lucide="swords"></i>
              <span class="move-slot-card__title">${slotMoveName}</span>
            </button>
            <button class="move-slot-card__clear" type="button" data-clear-move data-slot-index="${index}" data-move-index="${mIdx}" aria-label="${locale === "es" ? "Quitar movimiento" : "Remove move"}">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="move-slot-card__meta">
            ${typeBadgeHtml}
            ${categoryBadgeHtml}
            <span class="move-stat-pill" title="${locale === "es" ? "Potencia" : "Power"}"><span class="move-stat-label">${locale === "es" ? "POT" : "PWR"}</span> ${powerText}</span>
            <span class="move-stat-pill" title="${locale === "es" ? "Puntos de Poder" : "Power Points"}"><span class="move-stat-label">PP</span> ${ppText}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="team-slot-column" data-slot-column="${index}" draggable="true">
      <div class="team-slot filled" data-team-slot data-slot-index="${index}">
        <button class="team-slot__remove-btn" type="button" data-remove-slot data-slot-index="${index}" aria-label="${locale === "es" ? "Quitar Pokémon" : "Remove Pokémon"}">
          <i data-lucide="x"></i>
        </button>
        <div class="team-slot__card-content">
          <div class="team-slot__sprite-col">
            <img class="team-slot__sprite" src="${sprite}" alt="${pokemon.name}" loading="lazy" />
          </div>
          <div class="team-slot__info-col">
            <span class="team-slot__id">${dexNumber(pokemon.id)}</span>
            <div class="team-slot__name">${pokemon.name}</div>
            <div class="pokemon-card__types">${typesHtml}</div>
            <div class="team-slot__pills-row">
              ${
                slotData?.nature
                  ? `<div class="team-slot__nature-pill" title="${locale === "es" ? `Naturaleza: ${getNatureName(slotData.nature, locale)}` : `Nature: ${getNatureName(slotData.nature, locale)}`}">
                      <i data-lucide="sparkle"></i>
                      <span>${getNatureName(slotData.nature, locale)}</span>
                    </div>`
                  : ""
              }
              ${
                slotData?.item
                  ? `<div class="team-slot__item-pill" draggable="true" title="${locale === "es" ? `Objeto: ${getItemDisplayName(slotData.item, locale)} (Arrastrá para mover o soltá fuera para quitar)` : `Item: ${getItemDisplayName(slotData.item, locale)} (Drag to move or drop outside to unequip)`}" data-select-item data-item-pill data-slot-index="${index}">
                      ${renderItemIconHTML(slotData.item, { size: 16 })}
                      <span>${getItemDisplayName(slotData.item, locale)}</span>
                    </div>`
                  : `<button class="team-slot__item-btn empty" type="button" data-select-item data-slot-index="${index}" title="${t.team.chooseItem}">
                      <i data-lucide="backpack"></i>
                      <span>${t.team.item}</span>
                    </button>`
              }
            </div>
          </div>
        </div>
      </div>

      <div class="team-slot-moves">
        <span class="team-slot-moves__title">${locale === "es" ? "Ataques" : "Moves"}</span>
        <div class="team-slot-moves__list">
          ${movesHtml}
        </div>
      </div>
    </div>
  `;
}

export function setupSlots(slotsEl: HTMLElement, context: TeamContext) {
  function pokemonForSlot(index: number): Pokemon | null {
    const team = context.getTeam();
    const id = team.slots[index]?.pokemonId ?? null;
    return id !== null ? context.getPokemonById().get(id) ?? null : null;
  }

  function renderAllSlots(): void {
    const team = context.getTeam();
    const locale = context.getLocale();
    const moveDetailsMap = context.getMoveDetailsMap();

    slotsEl.innerHTML = team.slots
      .map((slot, i) => renderSlotHTML(i, pokemonForSlot(i), slot, locale, moveDetailsMap))
      .join("");
    refreshIcons();
  }

  function renderSingleSlot(index: number, animatePop = false): void {
    const team = context.getTeam();
    const locale = context.getLocale();
    const moveDetailsMap = context.getMoveDetailsMap();

    const oldEl =
      slotsEl.querySelector<HTMLElement>(`[data-slot-column="${index}"]`) ??
      slotsEl.querySelector<HTMLElement>(`[data-slot-index="${index}"]`);
    const template = document.createElement("template");
    template.innerHTML = renderSlotHTML(index, pokemonForSlot(index), team.slots[index], locale, moveDetailsMap);
    const newEl = template.content.firstElementChild as HTMLElement;

    if (oldEl) oldEl.replaceWith(newEl);
    else slotsEl.appendChild(newEl);
    refreshIcons();

    if (animatePop) {
      const cardEl = newEl.querySelector<HTMLElement>(".team-slot");
      if (cardEl) slotPopIn(cardEl);
      const badges = newEl.querySelectorAll(".type-badge");
      if (badges.length) badgeBounceIn(badges);
    }
  }

  slotsEl.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const clearMoveBtn = target.closest<HTMLButtonElement>("[data-clear-move]");
    if (clearMoveBtn) {
      e.stopPropagation();
      const sIdx = Number(clearMoveBtn.dataset.slotIndex);
      const mIdx = Number(clearMoveBtn.dataset.moveIndex);
      const nextTeam = setTeamSlotMove(sIdx, mIdx, null);
      context.setTeam(nextTeam);
      renderSingleSlot(sIdx);
      context.renderStrengthsPanel();
      return;
    }

    const selectMoveBtn = target.closest<HTMLButtonElement>("[data-select-move]");
    if (selectMoveBtn) {
      e.stopPropagation();
      const sIdx = Number(selectMoveBtn.dataset.slotIndex);
      const mIdx = Number(selectMoveBtn.dataset.moveIndex);
      context.openMovePicker(sIdx, mIdx);
      return;
    }

    const selectItemBtn = target.closest<HTMLElement>("[data-select-item]");
    if (selectItemBtn) {
      // Avoid opening immediately if item was just dragged
      if (slotsEl.dataset.itemDragJustEnded === "true") return;
      e.stopPropagation();
      const sIdx = Number(selectItemBtn.dataset.slotIndex);
      context.openItemPicker(sIdx);
      return;
    }

    const removeBtn = target.closest<HTMLButtonElement>("[data-remove-slot]");
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.slotIndex);
      const nextTeam = setTeamSlot(idx, null);
      context.setTeam(nextTeam);
      renderSingleSlot(idx);
      context.renderStrengthsPanel();
      return;
    }

    const slotEl = target.closest<HTMLElement>("[data-team-slot]");
    if (slotEl) {
      const idx = Number(slotEl.dataset.slotIndex);
      const slot = context.getTeam().slots[idx];
      if (!slot || slot.pokemonId === null) {
        context.openPokemonPicker(idx);
      } else {
        openPokemonModal(slot.pokemonId, { slotIndex: idx });
      }
    }
  });

  return {
    renderAllSlots,
    renderSingleSlot,
  };
}
