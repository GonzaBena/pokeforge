export function getModalElements() {
  const overlayEl = document.querySelector<HTMLElement>("[data-detail-overlay]");
  const panelEl = overlayEl?.querySelector<HTMLElement>(".modal-panel") ?? null;
  const closeBtn = document.querySelector<HTMLButtonElement>("[data-detail-close]");
  const bodyEl = document.querySelector<HTMLElement>("[data-detail-body]");
  const fabContainer = panelEl?.querySelector<HTMLElement>("[data-detail-fab-container]") ?? null;
  const fabBtn = panelEl?.querySelector<HTMLButtonElement>("[data-detail-fab-btn]") ?? null;
  const tocMenu = panelEl?.querySelector<HTMLElement>("[data-detail-toc-menu]") ?? null;
  const tocList = panelEl?.querySelector<HTMLElement>("[data-detail-toc-list]") ?? null;
  return { overlayEl, panelEl, closeBtn, bodyEl, fabContainer, fabBtn, tocMenu, tocList };
}
