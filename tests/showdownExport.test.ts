import test from 'node:test'
import assert from 'node:assert/strict'
import { generateShowdownText } from '../src/lib/teamCardExporter'
import type { Pokemon, TeamState } from '../src/lib/types'

test('generateShowdownText - returns empty string for empty team', () => {
  const emptyTeam: TeamState = {
    size: 6,
    slots: [
      { pokemonId: null, moves: [], item: null, ability: null },
      { pokemonId: null, moves: [], item: null, ability: null },
    ],
  }
  const pokemonMap = new Map<number, Pokemon>()
  const result = generateShowdownText(emptyTeam, pokemonMap)
  assert.equal(result, '')
})

test('generateShowdownText - formats single pokemon with full competitive set', () => {
  const gengar: Pokemon = {
    id: 94,
    name: 'gengar',
    types: ['ghost', 'poison'],
    generation: 'generation-i',
    sprites: { default: 'https://example.com/gengar.png', officialArtwork: null },
    moves: ['shadow-ball', 'sludge-bomb', 'focus-blast', 'substitute'],
  }

  const team: TeamState = {
    size: 6,
    slots: [
      {
        pokemonId: 94,
        moves: ['shadow-ball', 'sludge-bomb', 'focus-blast', 'substitute'],
        item: 'life-orb',
        ability: 'cursed-body',
        nature: 'timid',
      },
    ],
  }

  const pokemonMap = new Map<number, Pokemon>([[94, gengar]])
  const text = generateShowdownText(team, pokemonMap)

  // Verify format
  assert.match(text, /^Gengar @ Life Orb/)
  assert.match(text, /Ability: Cursed Body/)
  assert.match(text, /Types: Ghost \/ Poison/)
  assert.match(text, /Nature: Timid/)
  assert.match(text, /- Shadow Ball/)
  assert.match(text, /- Sludge Bomb/)
  assert.match(text, /- Focus Blast/)
  assert.match(text, /- Substitute/)
})

test('generateShowdownText - handles pokemon with partial moves and no item', () => {
  const pikachu: Pokemon = {
    id: 25,
    name: 'pikachu',
    types: ['electric'],
    generation: 'generation-i',
    sprites: { default: 'https://example.com/pikachu.png', officialArtwork: null },
    moves: ['thunderbolt'],
  }

  const team: TeamState = {
    size: 6,
    slots: [
      {
        pokemonId: 25,
        moves: ['thunderbolt', null, null, null],
        item: null,
        ability: 'static',
        nature: 'jolly',
      },
    ],
  }

  const pokemonMap = new Map<number, Pokemon>([[25, pikachu]])
  const text = generateShowdownText(team, pokemonMap)

  assert.equal(text.includes('@'), false, 'Should not contain @ when item is null')
  assert.match(text, /^Pikachu\n/)
  assert.match(text, /Ability: Static/)
  assert.match(text, /Types: Electric/)
  assert.match(text, /Nature: Jolly/)
  assert.match(text, /- Thunderbolt/)
})

test('generateShowdownText - formats multi-pokemon team separated by double newlines', () => {
  const charizard: Pokemon = {
    id: 6,
    name: 'charizard',
    types: ['fire', 'flying'],
    generation: 'generation-i',
    sprites: { default: 'https://example.com/charizard.png', officialArtwork: null },
    moves: ['flamethrower'],
  }
  const blastoise: Pokemon = {
    id: 9,
    name: 'blastoise',
    types: ['water'],
    generation: 'generation-i',
    sprites: { default: 'https://example.com/blastoise.png', officialArtwork: null },
    moves: ['surf'],
  }

  const team: TeamState = {
    size: 6,
    slots: [
      {
        pokemonId: 6,
        moves: ['flamethrower'],
        item: 'charcoal',
        ability: 'blaze',
      },
      {
        pokemonId: null,
        moves: [],
        item: null,
        ability: null,
      },
      {
        pokemonId: 9,
        moves: ['surf'],
        item: 'mystic-water',
        ability: 'torrent',
      },
    ],
  }

  const pokemonMap = new Map<number, Pokemon>([
    [6, charizard],
    [9, blastoise],
  ])
  const text = generateShowdownText(team, pokemonMap)

  const blocks = text.split('\n\n')
  assert.equal(blocks.length, 2, 'Should skip empty slot and export 2 blocks')
  assert.match(blocks[0], /^Charizard @ Charcoal/)
  assert.match(blocks[1], /^Blastoise @ Mystic Water/)
})
