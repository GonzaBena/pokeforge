import { modalIn, modalOut } from "../animations";
import { getCurrentLocale, getTranslations } from "../i18n/translations";
import { getAllPokemon, getTypeChart } from "../pokedexData";
import { getEvolutionChain, getNatures, getPokemonDetail } from "../pokemonDetail";
import { toast } from "../toast";
import type { Pokemon } from "../types";
import { getModalElements } from "./dom";
import { render } from "./render";
import { modalState } from "./state";
import { closeTocMenu } from "./toc";
import type { PokemonModalOptions } from "./types";

export function closeModal(): void {
  modalState.currentId = null;
  modalState.currentSlotIndex = null;
  closeTocMenu();
  const { overlayEl, panelEl, fabContainer } = getModalElements();
  if (fabContainer) fabContainer.hidden = true;
  if (!overlayEl || !panelEl) return;

  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 500));
  Promise.race([modalOut(overlayEl, panelEl), timeout]).then(() => {
    overlayEl.hidden = true;
    document.body.style.overflow = "";
  });
}

export async function openPokemonModal(id: number, options?: PokemonModalOptions): Promise<void> {
  modalState.currentId = id;
  modalState.currentSlotIndex = options?.slotIndex ?? null;
  const { overlayEl, panelEl, bodyEl, fabContainer } = getModalElements();
  if (!overlayEl || !panelEl || !bodyEl) return;

  if (fabContainer) fabContainer.hidden = true;
  closeTocMenu();

  const locale = getCurrentLocale();
  const t = getTranslations(locale);
  const loadingHtml = `<div class="detail-loading"><div class="spinner"></div><p>${t.modal.loading}</p></div>`;

  if (overlayEl.hidden) {
    bodyEl.innerHTML = loadingHtml;
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    modalIn(overlayEl, panelEl);
  } else {
    bodyEl.innerHTML = loadingHtml;
  }

  try {
    const [allPokemon, detail, natures, typeChart] = await Promise.all([
      getAllPokemon(),
      getPokemonDetail(id),
      getNatures(),
      getTypeChart(),
    ]);
    if (modalState.currentId !== id) return;

    const pokemon = allPokemon.find((p) => p.id === id);
    if (!pokemon) {
      closeModal();
      return;
    }

    const allById = new Map<number, Pokemon>(allPokemon.map((p) => [p.id, p]));
    const chain = detail.evolutionChainId !== null ? await getEvolutionChain(detail.evolutionChainId).catch(() => null) : null;
    if (modalState.currentId !== id) return;

    render({ pokemon, detail, chain, natures, allById, typeChart });
    bodyEl.scrollTop = 0;
  } catch (err) {
    console.error("Error cargando detalles del Pokémon:", err);
    toast.error(t.modal.loadError);
    closeModal();
  }
}
