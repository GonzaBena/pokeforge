import { sectionSwap } from "../../animations";
import { getSectionOrder, setSectionCollapsed, setSectionOrder } from "../../storage";
import { getModalElements } from "../dom";
import { render } from "../render";
import { modalState } from "../state";
import { updateTocMenu } from "../toc";

export function swapSection(id: string, direction: -1 | 1): void {
  const order = getSectionOrder();
  const idx = order.indexOf(id);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= order.length) return;

  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  setSectionOrder(order);
  if (modalState.lastContext) render(modalState.lastContext);

  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  for (const sectionId of [id, order[idx]]) {
    const el = bodyEl.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
    if (el) sectionSwap(el);
  }
}

export function toggleSectionCollapse(sectionId: string): void {
  const { bodyEl } = getModalElements();
  if (!bodyEl) return;

  const sectionEl = bodyEl.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
  if (!sectionEl) return;

  const willCollapse = !sectionEl.classList.contains("is-collapsed");
  sectionEl.classList.toggle("is-collapsed", willCollapse);

  const headerEl = sectionEl.querySelector<HTMLElement>("[data-section-toggle]");
  if (headerEl) {
    headerEl.setAttribute("aria-expanded", String(!willCollapse));
  }

  const contentEl = sectionEl.querySelector<HTMLElement>(".detail-section__content");
  if (contentEl) {
    contentEl.hidden = willCollapse;
  }

  setSectionCollapsed(sectionId, willCollapse);
  updateTocMenu();
}
