export interface LocalizedNameEntry {
  name: string;
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
