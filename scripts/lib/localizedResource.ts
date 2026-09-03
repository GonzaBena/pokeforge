export interface LocalizedNameEntry {
  name: string;
  language: { name: string; url?: string };
}

export interface LocalizedFlavorTextEntry {
  flavor_text: string;
  language: { name: string; url?: string };
}

export interface LocalizedGenusEntry {
  genus: string;
  language: { name: string; url?: string };
}

/**
 * Obtiene el texto en el idioma solicitado ('es'), y si no existe en la respuesta,
 * recurre al inglés ('en'). Si ninguno existe, devuelve el valor por defecto.
 */
export function getLocalizedName(
  entries: LocalizedNameEntry[] | undefined | null,
  targetLang = "es",
  fallbackLang = "en",
  defaultVal = "",
): string {
  if (!entries || !entries.length) return defaultVal;
  const match = entries.find((e) => e.language.name === targetLang);
  if (match?.name) return match.name;
  const fallback = entries.find((e) => e.language.name === fallbackLang);
  if (fallback?.name) return fallback.name;
  return entries[0]?.name ?? defaultVal;
}

/**
 * Obtiene el texto de ambientación/descripción (flavor text) en el idioma solicitado,
 * con fallback a inglés.
 */
export function getLocalizedFlavorText(
  entries: LocalizedFlavorTextEntry[] | undefined | null,
  targetLang = "es",
  fallbackLang = "en",
  defaultVal = "",
): string {
  if (!entries || !entries.length) return defaultVal;
  const match = entries.find((e) => e.language.name === targetLang);
  if (match?.flavor_text) return match.flavor_text.replace(/\f/g, "\n");
  const fallback = entries.find((e) => e.language.name === fallbackLang);
  if (fallback?.flavor_text) return fallback.flavor_text.replace(/\f/g, "\n");
  return entries[0]?.flavor_text?.replace(/\f/g, "\n") ?? defaultVal;
}
