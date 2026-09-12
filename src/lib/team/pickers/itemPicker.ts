import { filterItems, getItemById, renderItemIconHTML } from "../../items";
import { getTranslations, getTypeName } from "../../i18n/translations";
import { refreshIcons } from "../../icons";
import { setTeamSlotItem } from "../../storage";
import { capitalize, renderEmptyState } from "../helpers";
import type { TeamContext } from "../types";

export function setupItemPicker(context: TeamContext) {
  const itemPickerOverlayEl = document.querySelector<HTMLElement>("[data-item-picker-overlay]");
  const itemPickerBodyEl = document.querySelector<HTMLElement>("[data-item-picker-body]");
  const itemPickerCloseBtn = document.querySelector<HTMLButtonElement>("[data-item-picker-close]");
  const itemPickerSearchEl = document.querySelector<HTMLInputElement>("[data-item-picker-search]");
  const itemPickerResultsEl = document.querySelector<HTMLElement>("[data-item-picker-results]");
  const itemPickerTitleEl = document.querySelector<HTMLElement>("[data-item-picker-title]");
  const itemPickerCountEl = document.querySelector<HTMLElement>("[data-item-picker-count]");
  const itemCategoryFilterEl = document.querySelector<HTMLElement>("[data-item-category-filter]");

  let activeItemSlotIndex: number | null = null;
  let activeItemCategory: string = "all";

  function renderItemPickerResults(): void {
    if (!itemPickerResultsEl) return;
    const locale = context.getLocale();
    const t = getTranslations(locale);
    const search = itemPickerSearchEl ? itemPickerSearchEl.value.trim() : "";
    const filtered = filterItems(search, activeItemCategory, locale);

    const slot = activeItemSlotIndex !== null ? context.getTeam().slots[activeItemSlotIndex] : null;
    const currentItemId = slot?.item ?? null;

    if (itemPickerCountEl) {
      itemPickerCountEl.textContent = `${filtered.length} ${locale === "es" ? "objetos" : "items"}`;
    }

    let html = "";

    if (currentItemId) {
      const currentItem = getItemById(currentItemId);
      const itemName = currentItem ? (locale === "es" ? currentItem.nameEs : currentItem.nameEn) : currentItemId;
      html += `
        <div class="item-picker__current-banner">
          <div class="item-picker__current-info">
            ${renderItemIconHTML(currentItemId, { size: 22 })}
            <span>${locale === "es" ? "Equipado actualmente:" : "Currently equipped:"} <strong>${itemName}</strong></span>
          </div>
          <button class="btn btn--sm btn--danger" type="button" data-remove-item-picker>
            <i data-lucide="trash-2"></i> ${t.team.removeItem}
          </button>
        </div>
      `;
    }

    if (!filtered.length) {
      html += renderEmptyState({
        icon: "backpack",
        title: locale === "es" ? "No se encontraron objetos" : "No items found",
        description:
          locale === "es"
            ? "No hay objetos que coincidan con la búsqueda o la categoría seleccionada."
            : "No items match the search or selected category.",
        actionText: locale === "es" ? "Restablecer filtros" : "Reset filters",
        actionAttr: "data-clear-item-filters",
      });
      itemPickerResultsEl.innerHTML = html;
      refreshIcons();
      return;
    }

    const cardsHtml = filtered
      .map((item) => {
        const isSelected = item.id === currentItemId;
        const itemName = locale === "es" ? item.nameEs : item.nameEn;
        const itemDesc =
          locale === "es"
            ? item.shortDescEs || item.effect?.descriptionEs || ""
            : item.shortDescEn || item.effect?.descriptionEn || "";
        const categoryName = (t.team.itemCategories as Record<string, string>)[item.category] ?? item.category;

        let effectBadges = "";
        if (item.effect?.statMultipliers) {
          for (const [, mult] of Object.entries(item.effect.statMultipliers)) {
            if (typeof mult === "number") {
              const pct = Math.round((mult - 1) * 100);
              const sign = pct > 0 ? `+${pct}%` : `${pct}%`;
              effectBadges += `<span class="item-effect-badge item-effect-badge--stat">★ ${sign}</span>`;
            }
          }
        }
        if (item.effect?.grantsImmunities?.length) {
          for (const imm of item.effect.grantsImmunities) {
            effectBadges += `<span class="item-effect-badge item-effect-badge--immunity"><i data-lucide="shield"></i> ${locale === "es" ? "Inmune a " : "Immune to "}${getTypeName(imm, locale)}</span>`;
          }
        }
        if (item.effect?.changesPokemonType) {
          effectBadges += `<span class="item-effect-badge item-effect-badge--type"><i data-lucide="sparkles"></i> ${getTypeName(item.effect.changesPokemonType, locale)}</span>`;
        }

        return `
          <div class="item-picker-card ${isSelected ? "is-selected" : ""}" data-item-id="${item.id}" data-pick-item="${item.id}">
            <div class="item-picker-card__header">
              <div class="item-picker-card__icon-wrap">
                ${renderItemIconHTML(item.id, { size: 24, fallbackIcon: item.icon || "backpack" })}
              </div>
              <div class="item-picker-card__title-group">
                <div class="item-picker-card__name">${itemName}</div>
                <span class="item-picker-card__category">${categoryName}</span>
              </div>
              ${
                isSelected
                  ? `<span class="item-picker-card__badge-equipped"><i data-lucide="check"></i> ${locale === "es" ? "Equipado" : "Equipped"}</span>`
                  : ""
              }
            </div>
            <p class="item-picker-card__desc">${itemDesc}</p>
            ${effectBadges ? `<div class="item-picker-card__effects">${effectBadges}</div>` : ""}
            <div class="item-picker-card__actions">
              <button class="btn btn--sm ${isSelected ? "btn--secondary" : "btn--primary"} item-picker-card__btn" type="button" data-pick-item="${item.id}">
                ${isSelected ? (locale === "es" ? "Conservar" : "Keep") : (locale === "es" ? "Equipar" : "Equip")}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    html += `<div class="item-picker__grid">${cardsHtml}</div>`;
    itemPickerResultsEl.innerHTML = html;
    refreshIcons();
  }

  function clearItemPickerFilters(): void {
    activeItemCategory = "all";
    if (itemPickerSearchEl) itemPickerSearchEl.value = "";

    if (itemCategoryFilterEl) {
      itemCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-item-category]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.itemCategory === "all"));
      });
    }

    renderItemPickerResults();
  }

  function openItemPicker(slotIndex: number): void {
    if (!itemPickerOverlayEl) return;
    activeItemSlotIndex = slotIndex;
    activeItemCategory = "all";
    if (itemPickerSearchEl) itemPickerSearchEl.value = "";

    const locale = context.getLocale();
    const t = getTranslations(locale);
    const slot = context.getTeam().slots[slotIndex];
    const pokemon = slot && slot.pokemonId !== null ? context.getPokemonById().get(slot.pokemonId) : null;

    if (itemPickerTitleEl) {
      itemPickerTitleEl.textContent = pokemon
        ? `${t.team.selectItem} - ${capitalize(pokemon.name)}`
        : t.team.selectItem;
    }

    if (itemCategoryFilterEl) {
      itemCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-item-category]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.itemCategory === "all"));
      });
    }

    itemPickerOverlayEl.hidden = false;
    if (itemPickerBodyEl) {
      itemPickerBodyEl.scrollTop = 0;
    }
    context.updateBodyScrollLock();
    renderItemPickerResults();
    if (itemPickerSearchEl) itemPickerSearchEl.focus();
  }

  function closeItemPicker(): void {
    if (!itemPickerOverlayEl) return;
    itemPickerOverlayEl.hidden = true;
    context.updateBodyScrollLock();
    activeItemSlotIndex = null;
  }

  // Event wiring
  itemPickerCloseBtn?.addEventListener("click", closeItemPicker);
  itemPickerOverlayEl?.addEventListener("click", (e) => {
    if (e.target === itemPickerOverlayEl) closeItemPicker();
  });

  let itemSearchDebounce: number | undefined;
  itemPickerSearchEl?.addEventListener("input", () => {
    window.clearTimeout(itemSearchDebounce);
    itemSearchDebounce = window.setTimeout(() => {
      renderItemPickerResults();
    }, 150);
  });

  itemCategoryFilterEl?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-item-category]");
    if (!btn) return;
    activeItemCategory = btn.dataset.itemCategory!;
    itemCategoryFilterEl.querySelectorAll<HTMLButtonElement>("[data-item-category]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    renderItemPickerResults();
  });

  itemPickerResultsEl?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const clearBtn = target.closest<HTMLButtonElement>("[data-clear-item-filters]");
    if (clearBtn) {
      clearItemPickerFilters();
      return;
    }

    const removeBtn = target.closest<HTMLButtonElement>("[data-remove-item-picker]");
    if (removeBtn) {
      if (activeItemSlotIndex !== null) {
        const nextTeam = setTeamSlotItem(activeItemSlotIndex, null);
        context.setTeam(nextTeam);
        context.renderSingleSlot(activeItemSlotIndex);
        context.renderStrengthsPanel();
        context.renderTypeMatrix();
        closeItemPicker();
      }
      return;
    }

    const pickBtn = target.closest<HTMLElement>("[data-pick-item]");
    if (pickBtn) {
      const itemId = pickBtn.dataset.pickItem;
      if (activeItemSlotIndex !== null && itemId) {
        const nextTeam = setTeamSlotItem(activeItemSlotIndex, itemId);
        context.setTeam(nextTeam);
        context.renderSingleSlot(activeItemSlotIndex);
        context.renderStrengthsPanel();
        context.renderTypeMatrix();
        closeItemPicker();
      }
      return;
    }
  });

  return {
    openItemPicker,
    closeItemPicker,
    renderItemPickerResults,
    isOverlayOpen: () => Boolean(itemPickerOverlayEl && !itemPickerOverlayEl.hidden),
  };
}
