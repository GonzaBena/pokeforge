import type { Pokemon } from "./types";

export type SpriteMode = "pixel" | "artwork";

const STORAGE_KEY = "poketeam_sprite_mode";
export const SPRITE_MODE_EVENT = "poketeam:sprite-mode-changed";

/**
 * Gets the current sprite preference mode.
 * Default is "pixel" (prioritizing pixelated sprites).
 */
export function getSpriteMode(): SpriteMode {
  if (typeof window === "undefined") return "pixel";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "artwork" || saved === "pixel") {
    return saved;
  }
  return "pixel";
}

/**
 * Sets the sprite preference mode and dispatches a change event.
 */
export function setSpriteMode(mode: SpriteMode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(SPRITE_MODE_EVENT, { detail: { mode } }));
  }
}

/**
 * Resolves the appropriate sprite URL for a given Pokemon based on sprite mode.
 */
export function getPokemonSprite(pokemon: Pokemon, mode: SpriteMode = getSpriteMode()): string {
  if (!pokemon || !pokemon.sprites) return "";
  if (mode === "pixel") {
    return pokemon.sprites.default ?? pokemon.sprites.officialArtwork ?? "";
  }
  return pokemon.sprites.officialArtwork ?? pokemon.sprites.default ?? "";
}
