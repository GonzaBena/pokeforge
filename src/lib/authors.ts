import type { Locale } from "./i18n/translations";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  role: Record<Locale, string>;
  bio?: Record<Locale, string>;
}

export const AUTHORS: Record<string, Author> = {
  gonzo: {
    id: "gonzo",
    name: "Gonzalo Benavente",
    avatar: "https://github.com/GonzaBena.png",
    role: {
      es: "Fundador & Desarrollador de PokeForge",
      en: "Founder & PokeForge Developer",
    },
    bio: {
      es: "Entrenador competitivo y creador de PokeForge.",
      en: "Competitive trainer and creator of PokeForge.",
    },
  },
  poketeam: {
    id: "poketeam",
    name: "PokeForge Team",
    avatar: "/favicon.png",
    role: {
      es: "Equipo Editorial de PokeForge",
      en: "PokeForge Editorial Staff",
    },
    bio: {
      es: "Guías, análisis competitivos y curiosidades de la comunidad PokeForge.",
      en: "Guides, competitive analysis, and trivia from the PokeForge community.",
    },
  },
};

// Aliases para máxima compatibilidad si se escribe con mayúsculas o nombres alternativos
const ALIASES: Record<string, string> = {
  gonza: "gonzo",
  gonzabena: "gonzo",
  "gonza bena": "gonzo",
  team: "poketeam",
  pokeforge: "poketeam",
  "pokeforge team": "poketeam",
};

export function getAuthor(authorKey?: string | null): Author {
  if (!authorKey) return AUTHORS.poketeam;

  const normalized = authorKey.trim().toLowerCase();
  const resolvedKey = ALIASES[normalized] ?? normalized;

  if (AUTHORS[resolvedKey]) {
    return AUTHORS[resolvedKey];
  }

  // Fallback si es un nombre personalizado
  return {
    id: normalized,
    name: authorKey,
    avatar: "/favicon.png",
    role: {
      es: "Colaborador PokeForge",
      en: "PokeForge Contributor",
    },
  };
}
