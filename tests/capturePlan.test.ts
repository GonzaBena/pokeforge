import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCapturePath,
  buildCaptureSteps,
  evolutionConditionText,
  resolveAcquisitionSource,
} from '../src/lib/capturePlan'
import type { AcquisitionRow, EvolutionChain, EvolutionNode } from '../src/lib/types'

function node(overrides: Partial<EvolutionNode> & Pick<EvolutionNode, 'speciesId' | 'speciesName'>): EvolutionNode {
  return {
    evolvesFromSpecies: null,
    trigger: null,
    minLevel: null,
    item: null,
    itemDisplay: null,
    ...overrides,
  }
}

// Scyther (base) -> Scizor (trade) / Scyther -> Kleavor (use-item), como chain-58.json real.
const scytherChain: EvolutionChain = {
  chainId: 58,
  nodes: [
    node({ speciesId: 123, speciesName: 'scyther' }),
    node({
      speciesId: 212,
      speciesName: 'scizor',
      evolvesFromSpecies: 'scyther',
      trigger: 'trade',
    }),
    node({
      speciesId: 900,
      speciesName: 'kleavor',
      evolvesFromSpecies: 'scyther',
      trigger: 'use-item',
      item: 'black-augurite',
      itemDisplay: 'Mineral Negro',
    }),
  ],
}

// Eevee (base) -> Vaporeon / Jolteon / Flareon, como chain-67.json real.
const eeveeChain: EvolutionChain = {
  chainId: 67,
  nodes: [
    node({ speciesId: 133, speciesName: 'eevee' }),
    node({
      speciesId: 134,
      speciesName: 'vaporeon',
      evolvesFromSpecies: 'eevee',
      trigger: 'use-item',
      item: 'water-stone',
      itemDisplay: 'Piedra Agua',
    }),
    node({
      speciesId: 135,
      speciesName: 'jolteon',
      evolvesFromSpecies: 'eevee',
      trigger: 'use-item',
      item: 'thunder-stone',
      itemDisplay: 'Piedra Trueno',
    }),
  ],
}

describe('buildCapturePath', () => {
  it('returns [] for a null chain', () => {
    assert.deepEqual(buildCapturePath(null, 212), [])
  })

  it('returns [] when the target is not part of the chain', () => {
    assert.deepEqual(buildCapturePath(scytherChain, 999), [])
  })

  it('returns just the node itself when the target is the base form', () => {
    const path = buildCapturePath(scytherChain, 123)
    assert.deepEqual(
      path.map((n) => n.speciesId),
      [123],
    )
  })

  it('ascends from a mid-chain target to the root', () => {
    const path = buildCapturePath(scytherChain, 212)
    assert.deepEqual(
      path.map((n) => n.speciesId),
      [123, 212],
    )
  })

  it('does not mix sibling branches (Scizor vs Kleavor)', () => {
    const scizorPath = buildCapturePath(scytherChain, 212)
    const kleavorPath = buildCapturePath(scytherChain, 900)
    assert.deepEqual(
      scizorPath.map((n) => n.speciesId),
      [123, 212],
    )
    assert.deepEqual(
      kleavorPath.map((n) => n.speciesId),
      [123, 900],
    )
  })

  it('handles Eevee branches independently', () => {
    const vaporeonPath = buildCapturePath(eeveeChain, 134)
    const jolteonPath = buildCapturePath(eeveeChain, 135)
    assert.deepEqual(
      vaporeonPath.map((n) => n.speciesId),
      [133, 134],
    )
    assert.deepEqual(
      jolteonPath.map((n) => n.speciesId),
      [133, 135],
    )
  })
})

describe('buildCaptureSteps', () => {
  it('marks base, target and trade flags correctly', () => {
    const steps = buildCaptureSteps(scytherChain, 212, 'es')
    assert.equal(steps.length, 2)
    assert.equal(steps[0].isBase, true)
    assert.equal(steps[0].isTarget, false)
    assert.equal(steps[0].condition, '')
    assert.equal(steps[1].isBase, false)
    assert.equal(steps[1].isTarget, true)
    assert.equal(steps[1].isTrade, true)
  })
})

describe('evolutionConditionText', () => {
  it('returns empty string for the base node', () => {
    assert.equal(evolutionConditionText(scytherChain.nodes[0], 'es'), '')
  })

  it('formats level-up conditions', () => {
    const n = node({
      speciesId: 1,
      speciesName: 'x',
      evolvesFromSpecies: 'y',
      trigger: 'level-up',
      minLevel: 16,
    })
    assert.equal(evolutionConditionText(n, 'es'), 'Nivel 16')
    assert.equal(evolutionConditionText(n, 'en'), 'Level 16')
  })

  it('formats item conditions using itemDisplay in Spanish', () => {
    assert.equal(evolutionConditionText(eeveeChain.nodes[1], 'es'), 'Piedra Agua')
  })

  it('falls back to the translated trigger name for trade without item', () => {
    assert.equal(evolutionConditionText(scytherChain.nodes[1], 'es'), 'Intercambio')
    assert.equal(evolutionConditionText(scytherChain.nodes[1], 'en'), 'Trade')
  })

  it('falls back to "special condition" when nothing is known', () => {
    const n = node({ speciesId: 1, speciesName: 'x', evolvesFromSpecies: 'y', trigger: null })
    assert.equal(evolutionConditionText(n, 'es'), 'Condición especial')
    assert.equal(evolutionConditionText(n, 'en'), 'Special condition')
  })
})

describe('resolveAcquisitionSource', () => {
  const rows: AcquisitionRow[] = [
    { generation: 'i', game: 'Red - Blue', location: 'Ruta 1', method: 'Encuentro salvaje' },
    { generation: 'iii', game: 'Ruby - Sapphire', location: 'Ruta 5', method: 'Encuentro salvaje' },
  ]

  it('returns empty result when there are no rows', () => {
    assert.deepEqual(resolveAcquisitionSource(undefined, 'sword-shield'), {
      rows: [],
      usedFallback: false,
      sourceGameKey: null,
    })
    assert.deepEqual(resolveAcquisitionSource([], 'sword-shield'), {
      rows: [],
      usedFallback: false,
      sourceGameKey: null,
    })
  })

  it('matches rows for the selected game', () => {
    const res = resolveAcquisitionSource(rows, 'ruby-sapphire')
    assert.equal(res.usedFallback, false)
    assert.equal(res.sourceGameKey, 'ruby-sapphire')
    assert.equal(res.rows.length, 1)
    assert.equal(res.rows[0].game, 'Ruby - Sapphire')
  })

  it('falls back to the earliest game when there is no match', () => {
    const res = resolveAcquisitionSource(rows, 'sword-shield')
    assert.equal(res.usedFallback, true)
    assert.equal(res.sourceGameKey, 'red-blue')
    assert.equal(res.rows.length, 1)
    assert.equal(res.rows[0].game, 'Red - Blue')
  })

  it('falls back to the earliest game when no game is selected', () => {
    const res = resolveAcquisitionSource(rows, '')
    assert.equal(res.usedFallback, true)
    assert.equal(res.rows[0].game, 'Red - Blue')
  })
})
