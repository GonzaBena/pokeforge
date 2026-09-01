export interface PokemonSprites {
  default: string | null;
  officialArtwork: string | null;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprites: PokemonSprites;
  generation: string;
  moves: string[];
}

export interface PokedexChunk {
  chunkIndex: number;
  idRange: [number, number];
  pokemon: Pokemon[];
}

export interface PokedexManifestEntry {
  index: number;
  file: string;
  idRange: [number, number];
  count: number;
}

export interface PokedexManifest {
  totalCount: number;
  chunkSize: number;
  chunkCount: number;
  generatedAt: string;
  chunks: PokedexManifestEntry[];
}

export interface VersionGroupInfo {
  name: string;
  displayName: string;
}

export interface GenerationInfo {
  id: number;
  name: string;
  displayName: string;
  region: string;
  speciesIdRange: [number, number];
  versionGroups: VersionGroupInfo[];
}

export type TypeName =
  | "normal" | "fighting" | "flying" | "poison" | "ground" | "rock"
  | "bug" | "ghost" | "steel" | "fire" | "water" | "grass"
  | "electric" | "psychic" | "ice" | "dragon" | "dark" | "fairy";

export interface TypeChart {
  types: TypeName[];
  chart: Record<string, Record<string, number>>;
}

export interface MovesIndex {
  moves: string[];
}

export interface MoveData {
  name: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  pp: number | null;
  accuracy: number | null;
}

export type MovesDetailsMap = Record<string, MoveData>;

export interface TeamSlotState {
  pokemonId: number | null;
  moves?: (string | null)[];
}

export interface TeamState {
  size: number;
  slots: TeamSlotState[];
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface MoveDetail {
  name: string;
  method: string;
  level: number;
}

export interface AcquisitionRow {
  generation: string;
  game: string;
  location: string;
  method: string;
}

export interface PokemonDetail {
  id: number;
  stats: PokemonStats;
  moveDetails: MoveDetail[];
  evolvesFrom: string | null;
  evolutionChainId: number | null;
  acquisitions: AcquisitionRow[];
}

export interface EvolutionNode {
  speciesId: number;
  speciesName: string;
  evolvesFromSpecies: string | null;
  trigger: string | null;
  minLevel: number | null;
  item: string | null;
  itemDisplay: string | null;
}

export interface EvolutionChain {
  chainId: number;
  nodes: EvolutionNode[];
}

export interface Nature {
  name: string;
  increasedStat: string | null;
  decreasedStat: string | null;
}

export interface NaturesIndex {
  natures: Nature[];
}
