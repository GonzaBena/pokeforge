import { getCurrentLocale, getTranslations } from "../i18n/translations";
import { refreshIcons } from "../icons";
import { getSectionOrder, isSectionCollapsed } from "../storage";
import { getModalElements } from "./dom";
import { toggleSectionCollapse } from "./sections/actions";
import { capitalize } from "./utils";

export function updateTocMenu(): void {
  const { fabContainer, tocList } = getModalElements();
  if (!fabContainer || !tocList) return;

  const order = getSectionOrder();
  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const titles: Record<string, string> = {
    effectiveness: t.modal.effectiveness,
    location: t.modal.acquisition,
    moves: t.modal.moves,
    evolutions: t.modal.evolutions,
  };
  const icons: Record<string, string> = {
    effectiveness: "shield-check",
    location: "gamepad-2",
    moves: "swords",
    evolutions: "sparkles",
  };

  const topItem = `
    <button class="detail-toc-item" type="button" data-toc-target="header">
      <span class="detail-toc-item__icon"><i data-lucide="arrow-up"></i></span>
      <span class="detail-toc-item__title">${t.modal.top}</span>
    </button>
    <div class="detail-toc-divider"></div>
  `;

  const sectionItems = order
    .map((id) => {
      const isCollapsed = isSectionCollapsed(id);
      return `
        <button class="detail-toc-item" type="button" data-toc-target="${id}">
          <span class="detail-toc-item__icon"><i data-lucide="${icons[id] ?? "circle"}"></i></span>
          <span class="detail-toc-item__title">${titles[id] ?? capitalize(id)}</span>
          ${isCollapsed ? `<span class="detail-toc-item__status">${t.modal.collapsed}</span>` : ""}
        </button>
      `;
    })
    .join("");

  tocList.innerHTML = topItem + sectionItems;
  fabContainer.hidden = false;
  refreshIcons();
}

export function closeTocMenu(): void {
  const { fabBtn, tocMenu } = getModalElements();
  if (!tocMenu || !fabBtn) return;
  tocMenu.classList.remove("is-open");
  tocMenu.setAttribute("aria-hidden", "true");
  fabBtn.classList.remove("is-active");
  fabBtn.setAttribute("aria-expanded", "false");
}

export function toggleTocMenu(): void {
  const { fabBtn, tocMenu } = getModalElements();
  if (!tocMenu || !fabBtn) return;
  const isOpen = tocMenu.classList.toggle("is-open");
  tocMenu.setAttribute("aria-hidden", String(!isOpen));
  fabBtn.classList.toggle("is-active", isOpen);
  fabBtn.setAttribute("aria-expanded", String(isOpen));
}

export function scrollToSection(targetId: string): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  closeTocMenu();

  if (targetId === "header") {
    bodyEl.scrollTo({ top: 0, behavior: "smooth" });
    const headerEl = bodyEl.querySelector<HTMLElement>(".detail-header");
    if (headerEl) {
      headerEl.classList.remove("section-target-highlight");
      void headerEl.offsetWidth;
      headerEl.classList.add("section-target-highlight");
      setTimeout(() => headerEl.classList.remove("section-target-highlight"), 1200);
    }
    return;
  }

  const sectionEl = bodyEl.querySelector<HTMLElement>(`[data-section-id="${targetId}"]`);
  if (!sectionEl) return;

  if (isSectionCollapsed(targetId)) {
    toggleSectionCollapse(targetId);
  }

  sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });

  sectionEl.classList.remove("section-target-highlight");
  void sectionEl.offsetWidth;
  sectionEl.classList.add("section-target-highlight");
  setTimeout(() => sectionEl.classList.remove("section-target-highlight"), 1200);
}
