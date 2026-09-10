import type { EvolutionChain, MoveData, Nature, Pokemon, PokemonDetail, TypeChart } from "../types";

export interface RenderContext {
  pokemon: Pokemon;
  detail: PokemonDetail;
  chain: EvolutionChain | null;
  natures: Nature[];
  allById: Map<number, Pokemon>;
  typeChart: TypeChart;
  moveDetailsMap?: Record<string, MoveData>;
}

export interface PokemonModalOptions {
  slotIndex?: number;
}

export interface MoveTableRow {
  name: string;
  method: string;
  methodLabel: string;
  level: number;
}

export interface EffectivenessItem {
  type: string;
  multiplier: number;
}
