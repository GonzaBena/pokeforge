import { getCurrentLocale, getTranslations } from "../../i18n/translations";
import { refreshIcons } from "../../icons";
import { getTeam, isCaptured } from "../../storage";
import { typeColor } from "../../typeColors";
import type { PokemonStats } from "../../types";
import { getAllItems, getItemById, getItemStatModifiers, renderItemIconHTML } from "../../items";
import {
  getNatureModifier,
  natureEffectText,
  renderHexagonChart,
  renderNatureEffectBadges,
  updateHexagonChartIfVisible,
} from "../chart";
import { STAT_KEYS, STAT_LABELS } from "../constants";
import { getModalElements } from "../dom";
import { getCurrentEffectiveOverrides } from "../overrides";
import { modalState } from "../state";
import type { RenderContext } from "../types";
import {
  capitalize,
  dexNumber,
  getDefaultAbility,
  typeBadgesHtml,
} from "../utils";

export function renderHeader(ctx: RenderContext): string {
  const { pokemon, detail } = ctx;
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const isTeamMode = modalState.currentSlotIndex !== null;
  const captured = isCaptured(pokemon.id);
  const canEdit = isTeamMode ? true : captured;

  const team = isTeamMode ? getTeam() : null;
  const currentSlot =
    isTeamMode && team
      ? (team.slots[modalState.currentSlotIndex!] ?? null)
      : null;
  const overrides = getCurrentEffectiveOverrides();

  const userStats = overrides.stats ?? {};
  const sprite =
    pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
  const naturesList = ctx.natures ?? [];
  const selectedNature =
    naturesList.find((n) => n.name === overrides.nature) ?? null;

  const hasEvolution = Boolean(
    ctx.chain?.nodes.some((n) => n.evolvesFromSpecies === pokemon.name)
  );
  const currentItem = getItemById(overrides.item);
  const itemModifiers = getItemStatModifiers(currentItem, pokemon.id, hasEvolution);
  const selectedItemDesc = currentItem
    ? locale === "es"
      ? currentItem.effect?.descriptionEs || currentItem.shortDescEs
      : currentItem.effect?.descriptionEn || currentItem.shortDescEn
    : "";

  const allItems = getAllItems();
  const itemOptionsHtml = allItems
    .map((it) => {
      const isSelected = overrides.item === it.id;
      const label = locale === "es" ? it.nameEs : it.nameEn;
      return `<option value="${it.id}" ${isSelected ? "selected" : ""}>${label}</option>`;
    })
    .join("");

  const abilitiesList = detail.abilities ?? [];
  const defaultAbility = getDefaultAbility(detail);
  const currentAbilityName = overrides.ability ?? defaultAbility;
  const selectedAbility =
    abilitiesList.find((a) => a.name === currentAbilityName) ?? null;
  const selectedAbilityDesc = selectedAbility
    ? locale === "es"
      ? selectedAbility.descriptionEs || selectedAbility.descriptionEn || ""
      : selectedAbility.descriptionEn || selectedAbility.descriptionEs || ""
    : "";

  const abilityOptionsHtml = abilitiesList
    .map((a) => {
      const isSelected = currentAbilityName === a.name;
      const label =
        locale === "es"
          ? a.nameEs || capitalize(a.name)
          : a.nameEn || capitalize(a.name);
      const tag = a.isHidden
        ? locale === "es"
          ? ` (${t.modal.hiddenBadge})`
          : ` (${t.modal.hiddenBadge})`
        : "";
      return `<option value="${a.name}" ${isSelected ? "selected" : ""}>${label}${tag}</option>`;
    })
    .join("");

  const statsHtml = STAT_KEYS.map((key) => {
    const base = detail.stats?.[key] ?? 0;
    const value = userStats[key] ?? base;
    const modifier = getNatureModifier(selectedNature, key);
    const itemMod = itemModifiers[key];
    let modBadge = "";
    let modClass = "";

    if (modifier === "up") {
      modBadge = `<span class="detail-stat__mod detail-stat__mod--up" title="${locale === "es" ? "+10% por naturaleza" : "+10% from nature"}">▲ +10%</span>`;
      modClass = "is-nature-up";
    } else if (modifier === "down") {
      modBadge = `<span class="detail-stat__mod detail-stat__mod--down" title="${locale === "es" ? "-10% por naturaleza" : "-10% from nature"}">▼ -10%</span>`;
      modClass = "is-nature-down";
    }

    let itemBadge = "";
    if (itemMod) {
      const itemLabel = locale === "es" ? itemMod.labelEs : itemMod.labelEn;
      itemBadge = `<span class="detail-stat__mod detail-stat__mod--item" title="${itemLabel}">★ ${itemLabel}</span>`;
      modClass += " is-item-boosted";
    }

    return `
      <div class="detail-stat ${modClass}">
        <div class="detail-stat__label-group">
          <span class="detail-stat__label">${STAT_LABELS[key]}</span>
          ${modBadge}
          ${itemBadge}
        </div>
        <input
          class="detail-stat__input"
          type="number"
          min="${base}"
          value="${value}"
          data-stat-input
          data-stat-key="${key}"
          ${canEdit ? "" : "disabled"}
        />
      </div>
    `;
  }).join("");

  const natureOptionsHtml = naturesList
    .map(
      (n) =>
        `<option value="${n.name}" ${overrides.nature === n.name ? "selected" : ""}>${capitalize(n.name)}</option>`,
    )
    .join("");

  const currentStats: PokemonStats = {
    hp: userStats.hp ?? detail.stats.hp,
    attack: userStats.attack ?? detail.stats.attack,
    defense: userStats.defense ?? detail.stats.defense,
    specialAttack: userStats.specialAttack ?? detail.stats.specialAttack,
    specialDefense: userStats.specialDefense ?? detail.stats.specialDefense,
    speed: userStats.speed ?? detail.stats.speed,
  };
  const primaryTypeColor = typeColor(pokemon.types[0] ?? "normal");

  const badgeTeamHtml = isTeamMode
    ? `<span class="badge badge--team"><i data-lucide="users"></i> ${t.modal.teamSlotBadge.replace("{n}", String(modalState.currentSlotIndex! + 1))}</span>`
    : "";

  let footerActionsHtml = "";
  if (isTeamMode) {
    const isSynced = Boolean(currentSlot?.usePokedexData);
    footerActionsHtml = `
      <div class="detail-team-toolbar" data-team-toolbar>
        <div class="detail-team-toolbar__actions">
          <button class="btn btn--compact btn--outline" type="button" data-copy-from-pokedex title="${t.modal.copyFromPokedex}">
            <i data-lucide="download"></i>
            <span>${t.modal.copyFromPokedex}</span>
          </button>
          <button class="btn btn--compact btn--outline" type="button" data-copy-to-pokedex title="${t.modal.copyToPokedex}">
            <i data-lucide="upload"></i>
            <span>${t.modal.copyToPokedex}</span>
          </button>
        </div>
        <label class="detail-team-link-label" title="${t.modal.linkPokedex}">
          <input type="checkbox" data-link-pokedex ${isSynced ? "checked" : ""} />
          <span>${t.modal.linkPokedex}</span>
        </label>
      </div>
    `;
  } else {
    footerActionsHtml = `
      <button class="btn ${captured ? "btn--captured" : "btn--primary"}" type="button" data-modal-capture-btn>
        <i data-lucide="${captured ? "check" : "circle-dot"}"></i>
        ${captured ? t.pokedex.caught : t.pokedex.catch}
      </button>
    `;
  }

  const medalHtml = isTeamMode
    ? `<div class="detail-team-slot-badge"><i data-lucide="users"></i> ${t.modal.teamSlotBadge.replace("{n}", String(modalState.currentSlotIndex! + 1))}</div>`
    : `
      <div class="detail-capture-medal" data-capture-medal ${captured ? "" : "hidden"}>
        <img src="/Medal-Black.png" alt="" class="detail-capture-medal__medal" data-medal-img />
        <img src="/Text.png" alt="${captured ? t.pokedex.caught : t.pokedex.catch}" class="detail-capture-medal__stamp" data-stamp-img />
      </div>
    `;

  return `
    <div class="detail-header ${isTeamMode ? "is-team-mode" : ""}">
      <div class="detail-header__sprite">
        <img src="${sprite}" alt="${pokemon.name}" />
        ${medalHtml}
      </div>
      <div class="detail-header__info">
        <div class="detail-header__name-row">
          <div class="detail-header__title-group">
            <h3 class="detail-header__name capitalize">${pokemon.name}</h3>
            <span class="detail-header__id">${dexNumber(pokemon.id)}</span>
            ${badgeTeamHtml}
          </div>
          <button class="btn btn--compact detail-chart-toggle-btn ${modalState.showHexagonChart ? "btn--primary" : ""}" type="button" data-toggle-chart-view title="${t.modal.chartToggle}">
            <i data-lucide="${modalState.showHexagonChart ? "bar-chart-2" : "hexagon"}"></i>
            <span data-chart-toggle-label>${modalState.showHexagonChart ? (locale === "es" ? "Ocultar Juez" : "Hide Judge") : locale === "es" ? "Gráfico Juez" : "Judge Chart"}</span>
          </button>
        </div>
        <div class="detail-header__types">${typeBadgesHtml(pokemon.types)}</div>
        <div class="detail-stats-wrapper ${modalState.showHexagonChart ? "has-hexagon" : ""}" data-stats-wrapper>
          <div class="detail-stats" data-stats-bars-view>${statsHtml}</div>
          <div class="detail-hexagon-view" data-stats-hexagon-view ${modalState.showHexagonChart ? "" : "hidden"}>
            ${renderHexagonChart(currentStats, primaryTypeColor, selectedNature, itemModifiers)}
          </div>
        </div>
        <div class="detail-footer-row">
          <div class="detail-footer-row__customization">
            <div class="detail-custom-grid">
              <div class="detail-ability">
                <div class="detail-ability__select-row">
                  <span class="detail-ability__label">${t.modal.ability}</span>
                  <select data-ability-select ${canEdit ? "" : "disabled"}>
                    ${abilityOptionsHtml}
                  </select>
                  <div class="detail-help-tooltip" data-help-tooltip="ability">
                    <button
                      type="button"
                      class="detail-help-tooltip__trigger"
                      data-tooltip-trigger="ability"
                      aria-label="${t.modal.ability}"
                      title="${selectedAbilityDesc || (locale === "es" ? "Información de la habilidad" : "Ability information")}"
                    >
                      <i data-lucide="info"></i>
                    </button>
                    <div class="detail-help-tooltip__popover" data-tooltip-popover="ability" role="tooltip">
                      <strong class="detail-help-tooltip__title" data-tooltip-title="ability">${selectedAbility ? (locale === "es" ? selectedAbility.nameEs || capitalize(selectedAbility.name) : selectedAbility.nameEn || capitalize(selectedAbility.name)) : t.modal.ability}</strong>
                      <p class="detail-help-tooltip__text" data-tooltip-text="ability">${selectedAbilityDesc || (locale === "es" ? "La habilidad otorga efectos pasivos únicos en combate o aventura." : "Abilities provide unique passive effects in battle or adventure.")}</p>
                      ${selectedAbility?.isHidden ? `<p class="detail-help-tooltip__sub" data-tooltip-sub="ability">${locale === "es" ? "Habilidad Oculta" : "Hidden Ability"}</p>` : ""}
                    </div>
                  </div>
                </div>
              </div>
              <div class="detail-nature">
                <div class="detail-nature__select-row">
                  <span class="detail-nature__label">${t.modal.nature}</span>
                  <select data-nature-select ${canEdit ? "" : "disabled"}>
                    <option value="">${locale === "es" ? "Sin definir" : "Undefined"}</option>
                    ${natureOptionsHtml}
                  </select>
                  <div class="detail-help-tooltip" data-help-tooltip="nature">
                    <button
                      type="button"
                      class="detail-help-tooltip__trigger"
                      data-tooltip-trigger="nature"
                      aria-label="${t.modal.nature}"
                      title="${natureEffectText(selectedNature, locale)}"
                    >
                      <i data-lucide="info"></i>
                    </button>
                    <div class="detail-help-tooltip__popover" data-tooltip-popover="nature" role="tooltip">
                      <strong class="detail-help-tooltip__title" data-tooltip-title="nature">${selectedNature ? capitalize(selectedNature.name) : t.modal.nature}</strong>
                      <p class="detail-help-tooltip__text" data-tooltip-text="nature">${natureEffectText(selectedNature, locale)}</p>
                      <p class="detail-help-tooltip__sub">${locale === "es" ? "Las naturalezas modifican un stat en +10% y otro en -10% (o son neutras)." : "Natures increase one stat by +10% and decrease another by -10% (or are neutral)."}</p>
                    </div>
                  </div>
                </div>
                <div class="detail-nature__effects" data-nature-effects-container>
                  ${renderNatureEffectBadges(selectedNature, locale)}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-item__select-row">
                  <span class="detail-item__label">${locale === "es" ? "Objeto" : "Item"}</span>
                  ${currentItem ? renderItemIconHTML(currentItem.id, { size: 18 }) : ""}
                  <select data-item-select ${canEdit ? "" : "disabled"}>
                    <option value="">${locale === "es" ? "Sin objeto" : "No item"}</option>
                    ${itemOptionsHtml}
                  </select>
                  <div class="detail-help-tooltip" data-help-tooltip="item">
                    <button
                      type="button"
                      class="detail-help-tooltip__trigger"
                      data-tooltip-trigger="item"
                      aria-label="${locale === "es" ? "Objeto" : "Item"}"
                      title="${selectedItemDesc || (locale === "es" ? "Información del objeto" : "Item information")}"
                    >
                      <i data-lucide="info"></i>
                    </button>
                    <div class="detail-help-tooltip__popover" data-tooltip-popover="item" role="tooltip">
                      <strong class="detail-help-tooltip__title" data-tooltip-title="item">${currentItem ? (locale === "es" ? currentItem.nameEs : currentItem.nameEn) : (locale === "es" ? "Objeto" : "Item")}</strong>
                      <p class="detail-help-tooltip__text" data-tooltip-text="item">${selectedItemDesc || (locale === "es" ? "Los objetos equipados otorgan efectos pasivos o modifican estadísticas y efectividades." : "Held items provide passive battle effects or modify stats and type effectiveness.")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ${isTeamMode ? `<p class="detail-nature-hint">${t.modal.teamNatureNotice}</p>` : !captured ? `<p class="detail-hint" data-capture-hint>${t.modal.captureHint}</p>` : ""}
          </div>
          ${footerActionsHtml}
        </div>
      </div>
    </div>
  `;
}

export function updateHeaderCapturedState(captured: boolean): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const captureBtn = bodyEl.querySelector<HTMLButtonElement>(
    "[data-modal-capture-btn]",
  );
  if (captureBtn) {
    captureBtn.classList.toggle("btn--primary", !captured);
    captureBtn.classList.toggle("btn--captured", captured);
    captureBtn.innerHTML = `<i data-lucide="${captured ? "check" : "circle-dot"}"></i> ${captured ? t.pokedex.caught : t.pokedex.catch}`;
  }
  bodyEl
    .querySelectorAll<HTMLInputElement>("[data-stat-input]")
    .forEach((input) => {
      input.disabled = !captured;
    });
  const natureSelect = bodyEl.querySelector<HTMLSelectElement>(
    "[data-nature-select]",
  );
  if (natureSelect) natureSelect.disabled = !captured;
  const abilitySelect = bodyEl.querySelector<HTMLSelectElement>(
    "[data-ability-select]",
  );
  if (abilitySelect) abilitySelect.disabled = !captured;
  const hint = bodyEl.querySelector<HTMLElement>("[data-capture-hint]");
  if (hint) hint.hidden = captured;
  refreshIcons();
}

export function reRenderHeader(): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl || !modalState.lastContext) return;
  const currentHeader = bodyEl.querySelector<HTMLElement>(".detail-header");
  if (!currentHeader) return;

  const temp = document.createElement("div");
  temp.innerHTML = renderHeader(modalState.lastContext);
  const newHeader = temp.firstElementChild;
  if (newHeader) {
    currentHeader.replaceWith(newHeader);
    refreshIcons();
    updateHexagonChartIfVisible();
  }
}
