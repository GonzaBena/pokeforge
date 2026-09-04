import { getPokemonOverrides, getTeam, getTeamSlotEffectiveOverrides, type PokemonOverrides } from "../storage";
import { modalState } from "./state";

export function getCurrentEffectiveOverrides(): PokemonOverrides {
  if (modalState.currentSlotIndex !== null && modalState.lastContext) {
    const team = getTeam();
    const slot = team.slots[modalState.currentSlotIndex];
    if (slot) {
      return getTeamSlotEffectiveOverrides(slot, modalState.lastContext.detail.stats);
    }
  }
  if (modalState.currentId !== null) {
    return getPokemonOverrides(modalState.currentId) ?? { stats: {}, nature: null };
  }
  return { stats: {}, nature: null };
}
