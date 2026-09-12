import { downloadTeamCardCanvas, generateShowdownText, renderTeamCardHTML } from "../teamCardExporter";
import { refreshIcons } from "../icons";
import { toast } from "../toast";
import type { TeamContext } from "./types";

export function setupExportModal(context: TeamContext) {
  const openTeamCardBtn = document.querySelector<HTMLButtonElement>("[data-open-team-card]");
  const teamCardOverlay = document.querySelector<HTMLElement>("[data-team-card-overlay]");
  const teamCardCloseBtn = document.querySelector<HTMLButtonElement>("[data-team-card-close]");
  const teamCardPreview = document.querySelector<HTMLElement>("[data-team-card-preview]");
  const downloadPngBtn = document.querySelector<HTMLButtonElement>("[data-download-card-png]");
  const copyShowdownBtn = document.querySelector<HTMLButtonElement>("[data-copy-showdown]");

  function openTeamCardModal(): void {
    if (!teamCardOverlay || !teamCardPreview) return;
    const team = context.getTeam();
    const pokemonMap = context.getPokemonById();
    const locale = context.getLocale();
    const moveDetailsMap = context.getMoveDetailsMap();

    teamCardPreview.innerHTML = renderTeamCardHTML(team, pokemonMap, locale, moveDetailsMap);
    refreshIcons();
    teamCardOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeTeamCardModal(): void {
    if (!teamCardOverlay) return;
    teamCardOverlay.hidden = true;
    context.updateBodyScrollLock();
  }

  openTeamCardBtn?.addEventListener("click", openTeamCardModal);
  teamCardCloseBtn?.addEventListener("click", closeTeamCardModal);
  teamCardOverlay?.addEventListener("click", (e) => {
    if (e.target === teamCardOverlay) closeTeamCardModal();
  });

  downloadPngBtn?.addEventListener("click", () => {
    if (teamCardPreview) {
      downloadTeamCardCanvas(teamCardPreview);
    }
  });

  copyShowdownBtn?.addEventListener("click", () => {
    const team = context.getTeam();
    const pokemonMap = context.getPokemonById();
    const text = generateShowdownText(team, pokemonMap);
    const locale = context.getLocale();

    if (!text) {
      toast.info(locale === "es" ? "Tu equipo está vacío." : "Your team is empty.");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast.success(
        locale === "es"
          ? "¡Formato Showdown copiado al portapapeles!"
          : "Showdown format copied to clipboard!"
      );
    });
  });

  return {
    openTeamCardModal,
    closeTeamCardModal,
    isOverlayOpen: () => Boolean(teamCardOverlay && !teamCardOverlay.hidden),
  };
}
