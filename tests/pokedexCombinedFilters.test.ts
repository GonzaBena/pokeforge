import test from 'node:test'
import assert from 'node:assert/strict'
import { filterPokemonList } from '../src/lib/team/helpers'
import type { Pokemon } from '../src/lib/types'

const samplePokemonList: Pokemon[] = [
  {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    generation: 'generation-i',
    sprites: { default: '', officialArtwork: null },
    moves: ['vine-whip', 'tackle'],
  },
  {
    id: 4,
    name: 'charmander',
    types: ['fire'],
    generation: 'generation-i',
    sprites: { default: '', officialArtwork: null },
    moves: ['ember', 'scratch'],
  },
  {
    id: 6,
    name: 'charizard',
    types: ['fire', 'flying'],
    generation: 'generation-i',
    sprites: { default: '', officialArtwork: null },
    moves: ['flamethrower', 'air-slash', 'ember'],
  },
  {
    id: 7,
    name: 'squirtle',
    types: ['water'],
    generation: 'generation-i',
    sprites: { default: '', officialArtwork: null },
    moves: ['water-gun', 'tackle'],
  },
  {
    id: 94,
    name: 'gengar',
    types: ['ghost', 'poison'],
    generation: 'generation-i',
    sprites: { default: '', officialArtwork: null },
    moves: ['shadow-ball', 'sludge-bomb'],
  },
  {
    id: 252,
    name: 'treecko',
    types: ['grass'],
    generation: 'generation-iii',
    sprites: { default: '', officialArtwork: null },
    moves: ['pound', 'mega-drain'],
  },
  {
    id: 257,
    name: 'blaziken',
    types: ['fire', 'fighting'],
    generation: 'generation-iii',
    sprites: { default: '', officialArtwork: null },
    moves: ['blaze-kick', 'sky-uppercut', 'ember'],
  },
]

test('filterPokemonList - empty filters returns original list', () => {
  const result = filterPokemonList(samplePokemonList, {
    search: '',
    types: new Set(),
    generations: new Set(),
  })
  assert.equal(result.length, samplePokemonList.length)
})

test('filterPokemonList - combined search and type filter', () => {
  // Search 'char' with Fire type
  const result = filterPokemonList(samplePokemonList, {
    search: 'char',
    types: new Set(['fire']),
    generations: new Set(),
  })
  assert.equal(result.length, 2)
  assert.deepEqual(
    result.map((p) => p.name),
    ['charmander', 'charizard'],
  )
})

test('filterPokemonList - type mode OR vs AND with dual types', () => {
  // Filter Grass and Poison with OR
  const orResult = filterPokemonList(samplePokemonList, {
    search: '',
    types: new Set(['grass', 'poison']),
    typeMode: 'or',
    generations: new Set(),
  })
  // Bulbasaur (grass/poison), Gengar (ghost/poison), Treecko (grass)
  assert.equal(orResult.length, 3)
  assert.ok(orResult.some((p) => p.name === 'bulbasaur'))
  assert.ok(orResult.some((p) => p.name === 'gengar'))
  assert.ok(orResult.some((p) => p.name === 'treecko'))

  // Filter Grass and Poison with AND
  const andResult = filterPokemonList(samplePokemonList, {
    search: '',
    types: new Set(['grass', 'poison']),
    typeMode: 'and',
    generations: new Set(),
  })
  // Only Bulbasaur has both Grass AND Poison
  assert.equal(andResult.length, 1)
  assert.equal(andResult[0].name, 'bulbasaur')
})

test('filterPokemonList - combined Type + Generation + Game Species Set', () => {
  // Fire type in Gen 1 that is also in a regional dex of [1, 4, 7]
  const gameRegionalSet = new Set<number>([1, 4, 7]) // Bulbasaur, Charmander, Squirtle

  const result = filterPokemonList(samplePokemonList, {
    search: '',
    types: new Set(['fire']),
    generations: new Set(['generation-i']),
    gameSpeciesSet: gameRegionalSet,
  })

  // Charmander is Fire, Gen 1, and in gameRegionalSet. Charizard is not in gameRegionalSet. Blaziken is Gen 3.
  assert.equal(result.length, 1)
  assert.equal(result[0].name, 'charmander')
})

test('filterPokemonList - combined Move and Generation filter', () => {
  // Pokémon with move 'ember' in Generation 1
  const result = filterPokemonList(samplePokemonList, {
    search: '',
    types: new Set(),
    generations: new Set(['generation-i']),
    move: 'ember',
  })

  assert.equal(result.length, 2)
  assert.deepEqual(
    result.map((p) => p.name),
    ['charmander', 'charizard'],
  )
})
