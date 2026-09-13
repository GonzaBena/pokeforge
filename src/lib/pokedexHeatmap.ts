import type { Pokemon } from './types'
import { typeColor } from './typeColors'

export interface HeatmapPixel {
  id: number
  name: string
  types: string[]
  primaryColor: string
  secondaryColor?: string
  backgroundStyle: string
  isCaptured: boolean
  generation: string
}

export interface HeatmapStats {
  total: number
  caught: number
  percentage: number
  byType: Record<string, { total: number; caught: number }>
}

/**
 * Builds a single heatmap pixel from a Pokemon model and capture state.
 */
export function buildHeatmapPixel(pokemon: Pokemon, isCaptured: boolean): HeatmapPixel {
  const types = pokemon.types || []
  const primaryType = types[0] ? types[0].toLowerCase() : 'normal'
  const secondaryType = types[1] ? types[1].toLowerCase() : undefined

  const primaryColor = typeColor(primaryType)
  const secondaryColor = secondaryType ? typeColor(secondaryType) : undefined

  let backgroundStyle = primaryColor
  if (secondaryColor) {
    backgroundStyle = `linear-gradient(135deg, ${primaryColor} 50%, ${secondaryColor} 50%)`
  }

  return {
    id: pokemon.id,
    name: pokemon.name,
    types,
    primaryColor,
    secondaryColor,
    backgroundStyle,
    isCaptured,
    generation: pokemon.generation,
  }
}

/**
 * Maps a list of Pokemon into ordered HeatmapPixels with capture status.
 */
export function buildHeatmapData(
  pokemonList: Pokemon[],
  capturedIds: Set<number>,
): HeatmapPixel[] {
  if (!pokemonList || pokemonList.length === 0) return []

  // Ensure sorted by ID ascending
  const sorted = [...pokemonList].sort((a, b) => a.id - b.id)

  return sorted.map((p) => buildHeatmapPixel(p, capturedIds.has(p.id)))
}

/**
 * Computes statistics for heatmap pixels (total, caught count, percentage and type breakdown).
 */
export function getHeatmapStats(pixels: HeatmapPixel[]): HeatmapStats {
  if (!pixels || pixels.length === 0) {
    return {
      total: 0,
      caught: 0,
      percentage: 0,
      byType: {},
    }
  }

  const total = pixels.length
  let caught = 0
  const byType: Record<string, { total: number; caught: number }> = {}

  for (const pixel of pixels) {
    if (pixel.isCaptured) {
      caught++
    }

    for (const t of pixel.types) {
      const typeKey = t.toLowerCase()
      if (!byType[typeKey]) {
        byType[typeKey] = { total: 0, caught: 0 }
      }
      byType[typeKey].total++
      if (pixel.isCaptured) {
        byType[typeKey].caught++
      }
    }
  }

  const percentage = total > 0 ? Math.round((caught / total) * 100) : 0

  return {
    total,
    caught,
    percentage,
    byType,
  }
}
