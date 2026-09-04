import type { PokemonStats } from "../types";
import type { Locale } from "../i18n/translations";

export const STAT_KEYS: (keyof PokemonStats)[] = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

export const STAT_LABELS: Record<keyof PokemonStats, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  specialAttack: "SPA",
  specialDefense: "SPD",
  speed: "SPE",
};

export const NATURE_STAT_DISPLAY: Record<Locale, Record<string, string>> = {
  es: {
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "At. Especial",
    "special-defense": "Def. Especial",
    speed: "Velocidad",
  },
  en: {
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  },
};

export const METHOD_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    "level-up": "Nivel",
    machine: "MT/MO",
    tutor: "Tutor",
    egg: "Huevo",
  },
  en: {
    "level-up": "Level",
    machine: "TM/HM",
    tutor: "Tutor",
    egg: "Egg",
  },
};
