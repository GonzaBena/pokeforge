// Paleta presentacional de colores por tipo — PokeAPI no expone colores de UI,
// así que esto se hardcodea a mano (no es dato de dominio, solo estilo de badges).
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fighting: "#C03028",
  flying: "#A890F0",
  poison: "#A040A0",
  ground: "#E0C068",
  rock: "#B8A038",
  bug: "#A8B820",
  ghost: "#705898",
  steel: "#B8B8D0",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  psychic: "#F85888",
  ice: "#98D8D8",
  dragon: "#7038F8",
  dark: "#705848",
  fairy: "#EE99AC",
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#68A090";
}
