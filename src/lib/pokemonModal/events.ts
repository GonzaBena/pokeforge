import { animateMedalReveal } from "../animations";
import { getCurrentLocale, getTranslations } from "../i18n/translations";
import { refreshIcons } from "../icons";
import {
  copyPokedexToSlot,
  copySlotToPokedex,
  getPokemonOverrides,
  getTeam,
  isCaptured,
  setCaptured,
  setPokemonOverrides,
  setTeamSlotNature,
  setTeamSlotStats,
  setTeamSlotUsePokedexData,
} from "../storage";
import { toast } from "../toast";
import type { PokemonStats } from "../types";
import { getNatureModifier, natureEffectText, renderNatureEffectBadges, updateHexagonChartIfVisible } from "./chart";
import { STAT_KEYS } from "./constants";
import { getModalElements } from "./dom";
import { closeModal, openPokemonModal } from "./lifecycle";
import { swapSection, toggleSectionCollapse } from "./sections/actions";
import { reRenderHeader, updateHeaderCapturedState } from "./sections/header";
import { modalState } from "./state";
import { closeTocMenu, scrollToSection, toggleTocMenu } from "./toc";
import { capitalize } from "./utils";

let hasBoundEvents = false;

export function bindModalEvents(): void {
  if (hasBoundEvents) return;
  hasBoundEvents = true;

  document.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.matches("[data-stat-input]") || modalState.currentId === null || !modalState.lastContext) return;

    const key = target.dataset.statKey as keyof PokemonStats;
    const base = modalState.lastContext.detail.stats[key];
    let value = Number(target.value);
    if (Number.isNaN(value)) return;
    if (value < base) {
      value = base;
      target.value = String(base);
    }

    if (modalState.currentSlotIndex !== null) {
      const team = getTeam();
      const slot = team.slots[modalState.currentSlotIndex];
      if (slot) {
        const nextStats = { ...modalState.lastContext.detail.stats, ...(slot.stats ?? {}), [key]: value };
        if (slot.usePokedexData) {
          const overrides = getPokemonOverrides(modalState.currentId);
          overrides.stats = { ...overrides.stats, [key]: value };
          setPokemonOverrides(modalState.currentId, overrides);
        }
        setTeamSlotStats(modalState.currentSlotIndex, nextStats);
      }
    } else {
      const overrides = getPokemonOverrides(modalState.currentId);
      overrides.stats = { ...overrides.stats, [key]: value };
      setPokemonOverrides(modalState.currentId, overrides);
    }
    updateHexagonChartIfVisible();
  });

  document.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;

    if (target.matches("[data-link-pokedex]") && modalState.currentSlotIndex !== null && modalState.currentId !== null && modalState.lastContext) {
      const isChecked = (target as HTMLInputElement).checked;
      if (isChecked) {
        const pOverrides = getPokemonOverrides(modalState.currentId);
        const hasPokedexData = pOverrides.nature !== null || Object.keys(pOverrides.stats).length > 0;
        if (hasPokedexData) {
          copyPokedexToSlot(modalState.currentSlotIndex);
        } else {
          copySlotToPokedex(modalState.currentSlotIndex);
        }
        setTeamSlotUsePokedexData(modalState.currentSlotIndex, true);
      } else {
        setTeamSlotUsePokedexData(modalState.currentSlotIndex, false);
      }
      reRenderHeader();
      return;
    }

    if (!target.matches("[data-nature-select]") || modalState.currentId === null) return;

    const value = (target as HTMLSelectElement).value || null;
    if (modalState.currentSlotIndex !== null) {
      const team = getTeam();
      const slot = team.slots[modalState.currentSlotIndex];
      if (slot) {
        if (slot.usePokedexData) {
          const overrides = getPokemonOverrides(modalState.currentId);
          overrides.nature = value;
          setPokemonOverrides(modalState.currentId, overrides);
        }
        setTeamSlotNature(modalState.currentSlotIndex, value);
      }
    } else {
      const overrides = getPokemonOverrides(modalState.currentId);
      overrides.nature = value;
      setPokemonOverrides(modalState.currentId, overrides);
    }

    const nature = modalState.lastContext?.natures.find((n) => n.name === value) ?? null;
    const { bodyEl } = getModalElements();
    const locale = getCurrentLocale();

    if (bodyEl && modalState.lastContext) {
      const tooltipEl = bodyEl.querySelector<HTMLElement>("[data-nature-tooltip]");
      if (tooltipEl) tooltipEl.setAttribute("title", natureEffectText(nature, locale));

      const effectsEl = bodyEl.querySelector<HTMLElement>("[data-nature-effects-container]");
      if (effectsEl) effectsEl.innerHTML = renderNatureEffectBadges(nature, locale);

      STAT_KEYS.forEach((key) => {
        const inputEl = bodyEl.querySelector<HTMLInputElement>(`[data-stat-input][data-stat-key="${key}"]`);
        const statEl = inputEl?.closest<HTMLElement>(".detail-stat");
        if (statEl) {
          const mod = getNatureModifier(nature, key);
          statEl.classList.toggle("is-nature-up", mod === "up");
          statEl.classList.toggle("is-nature-down", mod === "down");

          let labelGroup = statEl.querySelector<HTMLElement>(".detail-stat__label-group");
          let modBadge = statEl.querySelector<HTMLElement>(".detail-stat__mod");

          if (mod === "up") {
            if (!modBadge) {
              modBadge = document.createElement("span");
              labelGroup?.appendChild(modBadge);
            }
            modBadge.className = "detail-stat__mod detail-stat__mod--up";
            modBadge.textContent = "▲ +10%";
            modBadge.title = locale === "es" ? "+10% por naturaleza" : "+10% from nature";
          } else if (mod === "down") {
            if (!modBadge) {
              modBadge = document.createElement("span");
              labelGroup?.appendChild(modBadge);
            }
            modBadge.className = "detail-stat__mod detail-stat__mod--down";
            modBadge.textContent = "▼ -10%";
            modBadge.title = locale === "es" ? "-10% por naturaleza" : "-10% from nature";
          } else if (modBadge) {
            modBadge.remove();
          }
        }
      });
    }

    updateHexagonChartIfVisible();
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-detail-close]")) {
      closeModal();
      return;
    }

    const { overlayEl, bodyEl } = getModalElements();

    if (overlayEl && target === overlayEl) {
      closeModal();
      return;
    }

    if (!bodyEl) return;

    const toggleBtn = target.closest<HTMLButtonElement>("[data-toggle-chart-view]");
    if (toggleBtn) {
      modalState.showHexagonChart = !modalState.showHexagonChart;
      const wrapper = bodyEl.querySelector<HTMLElement>("[data-stats-wrapper]");
      const hexView = bodyEl.querySelector<HTMLElement>("[data-stats-hexagon-view]");
      const labelEl = toggleBtn.querySelector<HTMLElement>("[data-chart-toggle-label]");

      if (wrapper && hexView) {
        wrapper.classList.toggle("has-hexagon", modalState.showHexagonChart);
        hexView.hidden = !modalState.showHexagonChart;
        updateHexagonChartIfVisible();
      }
      const locale = getCurrentLocale();
      if (labelEl) {
        labelEl.textContent = modalState.showHexagonChart ? (locale === "es" ? "Ocultar Juez" : "Hide Judge") : (locale === "es" ? "Gráfico Juez" : "Judge Chart");
      }
      toggleBtn.classList.toggle("btn--primary", modalState.showHexagonChart);
      refreshIcons();
      return;
    }

    const copyFromBtn = target.closest<HTMLButtonElement>("[data-copy-from-pokedex]");
    if (copyFromBtn && modalState.currentSlotIndex !== null && modalState.currentId !== null && modalState.lastContext) {
      const pOverrides = getPokemonOverrides(modalState.currentId);
      const hasData = pOverrides.nature !== null || (pOverrides.stats && Object.keys(pOverrides.stats).length > 0);
      const locale = getCurrentLocale();
      const t = getTranslations(locale);
      if (!hasData) {
        toast.info(t.modal.noPokedexData);
        return;
      }
      copyPokedexToSlot(modalState.currentSlotIndex);
      toast.success(t.modal.copiedFromPokedex);
      reRenderHeader();
      return;
    }

    const copyToBtn = target.closest<HTMLButtonElement>("[data-copy-to-pokedex]");
    if (copyToBtn && modalState.currentSlotIndex !== null && modalState.currentId !== null && modalState.lastContext) {
      copySlotToPokedex(modalState.currentSlotIndex);
      const locale = getCurrentLocale();
      const t = getTranslations(locale);
      toast.success(t.modal.savedToPokedex);
      return;
    }

    const captureBtn = target.closest<HTMLButtonElement>("[data-modal-capture-btn]");
    if (captureBtn && modalState.currentId !== null && modalState.lastContext) {
      const nowCaptured = !isCaptured(modalState.currentId);
      setCaptured(modalState.currentId, nowCaptured);
      updateHeaderCapturedState(nowCaptured);

      const medal = bodyEl.querySelector<HTMLElement>("[data-capture-medal]");
      const medalImg = bodyEl.querySelector<HTMLElement>("[data-medal-img]");
      const stampImg = bodyEl.querySelector<HTMLElement>("[data-stamp-img]");

      const name = capitalize(modalState.lastContext.pokemon.name);
      const locale = getCurrentLocale();
      if (nowCaptured) {
        toast.success(locale === "es" ? `¡${name} capturado!` : `${name} caught!`);
        if (medal && medalImg && stampImg) {
          medal.hidden = false;
          animateMedalReveal(medalImg, stampImg);
        }
      } else {
        toast.info(locale === "es" ? `${name} liberado de tu Pokédex.` : `${name} released from your Pokédex.`);
        if (medal) medal.hidden = true;
      }
      return;
    }

    const evoCard = target.closest<HTMLElement>("[data-evolution-pick]");
    if (evoCard) {
      openPokemonModal(Number(evoCard.dataset.pokemonId));
      return;
    }

    const upBtn = target.closest<HTMLButtonElement>("[data-move-up]");
    if (upBtn) {
      if (!upBtn.disabled) {
        swapSection(upBtn.dataset.sectionId!, -1);
      }
      return;
    }

    const downBtn = target.closest<HTMLButtonElement>("[data-move-down]");
    if (downBtn) {
      if (!downBtn.disabled) {
        swapSection(downBtn.dataset.sectionId!, 1);
      }
      return;
    }

    if (target.closest(".detail-section__reorder")) {
      return;
    }

    const sectionToggle = target.closest<HTMLElement>("[data-section-toggle]");
    if (sectionToggle) {
      const sectionId = sectionToggle.dataset.sectionToggle;
      if (sectionId) {
        toggleSectionCollapse(sectionId);
      }
      return;
    }

    const fabBtn = target.closest<HTMLButtonElement>("[data-detail-fab-btn]");
    if (fabBtn) {
      toggleTocMenu();
      return;
    }

    const tocItem = target.closest<HTMLButtonElement>("[data-toc-target]");
    if (tocItem) {
      const targetId = tocItem.dataset.tocTarget;
      if (targetId) scrollToSection(targetId);
      return;
    }

    const { tocMenu } = getModalElements();
    if (tocMenu && tocMenu.classList.contains("is-open") && !target.closest("[data-detail-fab-container]")) {
      closeTocMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    const { overlayEl, tocMenu } = getModalElements();
    if (e.key === "Escape") {
      if (tocMenu && tocMenu.classList.contains("is-open")) {
        closeTocMenu();
        return;
      }
      if (overlayEl && !overlayEl.hidden) {
        closeModal();
        return;
      }
    }

    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target && target.matches("[data-section-toggle]")) {
        e.preventDefault();
        const sectionId = target.dataset.sectionToggle;
        if (sectionId) {
          toggleSectionCollapse(sectionId);
        }
      }
    }
  });
}
