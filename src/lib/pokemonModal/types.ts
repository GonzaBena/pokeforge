import type { EvolutionChain, MoveData, Nature, Pokemon, PokemonDetail, TypeChart } from '../types'

export interface RenderContext {
  pokemon: Pokemon
  detail: PokemonDetail
  chain: EvolutionChain | null
  natures: Nature[]
  allById: Map<number, Pokemon>
  typeChart: TypeChart
  moveDetailsMap?: Record<string, MoveData>
}

export interface PokemonModalOptions {
  slotIndex?: number
}

export interface MoveTableRow {
  name: string
  rawName?: string
  nameEs?: string
  nameEn?: string
  type: string | null
  typeName: string
  category: 'physical' | 'special' | 'status' | null
  categoryLabel: string
  power: number | null
  pp: number | null
  accuracy: number | null
  method: string
  methodLabel: string
  level: number
  description?: string
}

export interface EffectivenessItem {
  type: string
  multiplier: number
  note?: string
}
