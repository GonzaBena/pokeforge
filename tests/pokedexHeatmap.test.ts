import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHeatmapPixel,
  buildHeatmapData,
  getHeatmapStats,
} from '../src/lib/pokedexHeatmap'
import type { Pokemon } from '../src/lib/types'

const mockPokemon: Pokemon[] = [
  {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    sprites: { default: '/sprites/1.png', officialArtwork: '/art/1.png' },
    generation: 'generation-i',
    moves: [],
  },
  {
    id: 4,
    name: 'charmander',
    types: ['fire'],
    sprites: { default: '/sprites/4.png', officialArtwork: '/art/4.png' },
    generation: 'generation-i',
    moves: [],
  },
  {
    id: 7,
    name: 'squirtle',
    types: ['water'],
    sprites: { default: '/sprites/7.png', officialArtwork: '/art/7.png' },
    generation: 'generation-i',
    moves: [],
  },
  {
    id: 25,
    name: 'pikachu',
    types: ['electric'],
    sprites: { default: '/sprites/25.png', officialArtwork: '/art/25.png' },
    generation: 'generation-i',
    moves: [],
  },
]

test('buildHeatmapPixel - single type pokemon creates correct pixel with primary type color', () => {
  const charmander = mockPokemon[1]
  const pixel = buildHeatmapPixel(charmander, true)

  assert.equal(pixel.id, 4)
  assert.equal(pixel.name, 'charmander')
  assert.equal(pixel.isCaptured, true)
  assert.equal(pixel.types.length, 1)
  assert.equal(pixel.primaryColor, '#F08030') // Fire color
  assert.equal(pixel.secondaryColor, undefined)
  assert.ok(pixel.backgroundStyle.includes('#F08030'))
})

test('buildHeatmapPixel - dual type pokemon creates gradient background', () => {
  const bulbasaur = mockPokemon[0]
  const pixel = buildHeatmapPixel(bulbasaur, true)

  assert.equal(pixel.id, 1)
  assert.equal(pixel.types.length, 2)
  assert.equal(pixel.primaryColor, '#78C850') // Grass color
  assert.equal(pixel.secondaryColor, '#A040A0') // Poison color
  assert.ok(pixel.backgroundStyle.includes('linear-gradient'))
  assert.ok(pixel.backgroundStyle.includes('#78C850'))
  assert.ok(pixel.backgroundStyle.includes('#A040A0'))
})

test('buildHeatmapPixel - uncaptured pokemon reflects isCaptured false and still preserves type colors', () => {
  const squirtle = mockPokemon[2]
  const pixel = buildHeatmapPixel(squirtle, false)

  assert.equal(pixel.id, 7)
  assert.equal(pixel.isCaptured, false)
  assert.equal(pixel.primaryColor, '#6890F0') // Water color
})

test('buildHeatmapPixel - handles corner case of pokemon with empty types or unknown type', () => {
  const unknownPoke: Pokemon = {
    id: 9999,
    name: 'missingno',
    types: [],
    sprites: { default: null, officialArtwork: null },
    generation: 'generation-i',
    moves: [],
  }
  const pixel = buildHeatmapPixel(unknownPoke, false)

  assert.equal(pixel.id, 9999)
  assert.ok(pixel.primaryColor, 'should assign a fallback color')
  assert.ok(pixel.backgroundStyle)
})

test('buildHeatmapData - maps full pokemon list and marks captured ones correctly', () => {
  const capturedIds = new Set([1, 25])
  const pixels = buildHeatmapData(mockPokemon, capturedIds)

  assert.equal(pixels.length, 4)
  assert.equal(pixels[0].id, 1)
  assert.equal(pixels[0].isCaptured, true)
  assert.equal(pixels[1].id, 4)
  assert.equal(pixels[1].isCaptured, false)
  assert.equal(pixels[2].id, 7)
  assert.equal(pixels[2].isCaptured, false)
  assert.equal(pixels[3].id, 25)
  assert.equal(pixels[3].isCaptured, true)
})

test('buildHeatmapData - handles empty array and out-of-order lists gracefully', () => {
  const empty = buildHeatmapData([], new Set([1]))
  assert.deepEqual(empty, [])

  // Out of order pokemon should be sorted by ID ascending
  const unordered: Pokemon[] = [mockPokemon[3], mockPokemon[0], mockPokemon[1]]
  const sortedPixels = buildHeatmapData(unordered, new Set([1]))
  assert.equal(sortedPixels[0].id, 1)
  assert.equal(sortedPixels[1].id, 4)
  assert.equal(sortedPixels[2].id, 25)
})

test('getHeatmapStats - computes total, caught count, percentage and breakdown by type', () => {
  const capturedIds = new Set([1, 25])
  const pixels = buildHeatmapData(mockPokemon, capturedIds)
  const stats = getHeatmapStats(pixels)

  assert.equal(stats.total, 4)
  assert.equal(stats.caught, 2)
  assert.equal(stats.percentage, 50)
  assert.equal(stats.byType['grass'].caught, 1)
  assert.equal(stats.byType['grass'].total, 1)
  assert.equal(stats.byType['electric'].caught, 1)
  assert.equal(stats.byType['fire'].caught, 0)
  assert.equal(stats.byType['fire'].total, 1)
})

test('getHeatmapStats - handles empty pixels array without NaN or division by zero', () => {
  const stats = getHeatmapStats([])
  assert.equal(stats.total, 0)
  assert.equal(stats.caught, 0)
  assert.equal(stats.percentage, 0)
  assert.deepEqual(stats.byType, {})
})
