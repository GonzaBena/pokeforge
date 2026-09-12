import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseMoveQuery, matchesMoveFilter, type MoveFilterItem } from '../src/lib/moveFilters'

describe('Move Filters - parseMoveQuery', () => {
  it('parses empty queries', () => {
    const parsed = parseMoveQuery('')
    assert.deepEqual(parsed.textTerms, [])
    assert.deepEqual(parsed.types, [])
    assert.deepEqual(parsed.categories, [])
    assert.deepEqual(parsed.numericFilters, [])
    assert.deepEqual(parsed.methods, [])
  })

  it('parses type filters in English and Spanish with accents and aliases', () => {
    const en = parseMoveQuery('type:fire')
    assert.deepEqual(en.types, ['fire'])

    const es = parseMoveQuery('tipo:fuego')
    assert.deepEqual(es.types, ['fire'])

    const esAccented = parseMoveQuery('tipo:eléctrico')
    assert.deepEqual(esAccented.types, ['electric'])

    const esNoAccent = parseMoveQuery('tipo:electrico')
    assert.deepEqual(esNoAccent.types, ['electric'])

    const shortAlias = parseMoveQuery('t:water')
    assert.deepEqual(shortAlias.types, ['water'])

    const esAlias = parseMoveQuery('t:planta')
    assert.deepEqual(esAlias.types, ['grass'])
  })

  it('parses category filters in English and Spanish', () => {
    const enSpec = parseMoveQuery('category:special')
    assert.deepEqual(enSpec.categories, ['special'])

    const esSpec = parseMoveQuery('categoria:especial')
    assert.deepEqual(esSpec.categories, ['special'])

    const esPhysAccented = parseMoveQuery('categoría:físico')
    assert.deepEqual(esPhysAccented.categories, ['physical'])

    const esPhysShort = parseMoveQuery('cat:fisico')
    assert.deepEqual(esPhysShort.categories, ['physical'])

    const esStatus = parseMoveQuery('c:estado')
    assert.deepEqual(esStatus.categories, ['status'])

    const enStatus = parseMoveQuery('cat:status')
    assert.deepEqual(enStatus.categories, ['status'])
  })

  it('parses numeric filters for power, pp, accuracy, and level with various operators', () => {
    const exact = parseMoveQuery('pot:10 pp:10 acc:100 lvl:25')
    assert.equal(exact.numericFilters.length, 4)
    assert.deepEqual(
      exact.numericFilters.find((f) => f.field === 'power'),
      {
        field: 'power',
        operator: '=',
        value: 10,
      },
    )
    assert.deepEqual(
      exact.numericFilters.find((f) => f.field === 'pp'),
      {
        field: 'pp',
        operator: '=',
        value: 10,
      },
    )
    assert.deepEqual(
      exact.numericFilters.find((f) => f.field === 'accuracy'),
      {
        field: 'accuracy',
        operator: '=',
        value: 100,
      },
    )
    assert.deepEqual(
      exact.numericFilters.find((f) => f.field === 'level'),
      {
        field: 'level',
        operator: '=',
        value: 25,
      },
    )

    const gt = parseMoveQuery('pot:>30 pp:>=30 prec:>80 nivel:<=50')
    assert.deepEqual(
      gt.numericFilters.find((f) => f.field === 'power'),
      {
        field: 'power',
        operator: '>',
        value: 30,
      },
    )
    assert.deepEqual(
      gt.numericFilters.find((f) => f.field === 'pp'),
      {
        field: 'pp',
        operator: '>=',
        value: 30,
      },
    )
    assert.deepEqual(
      gt.numericFilters.find((f) => f.field === 'accuracy'),
      {
        field: 'accuracy',
        operator: '>',
        value: 80,
      },
    )
    assert.deepEqual(
      gt.numericFilters.find((f) => f.field === 'level'),
      {
        field: 'level',
        operator: '<=',
        value: 50,
      },
    )

    // English aliases
    const enAliases = parseMoveQuery('pow:>40 pwr:<=90 nv:>15')
    assert.equal(enAliases.numericFilters.length, 3)
  })

  it('parses method filters in English and Spanish', () => {
    const lvl = parseMoveQuery('metodo:nivel')
    assert.deepEqual(lvl.methods, ['level-up'])

    const tm = parseMoveQuery('method:tm')
    assert.deepEqual(tm.methods, ['machine'])

    const egg = parseMoveQuery('metodo:huevo')
    assert.deepEqual(egg.methods, ['egg'])

    const tutor = parseMoveQuery('m:tutor')
    assert.deepEqual(tutor.methods, ['tutor'])
  })

  it('separates text search terms from filter tokens', () => {
    const mixed = parseMoveQuery('lanzallamas tipo:fuego pot:>50')
    assert.deepEqual(mixed.textTerms, ['lanzallamas'])
    assert.deepEqual(mixed.types, ['fire'])
    assert.equal(mixed.numericFilters.length, 1)

    const quoted = parseMoveQuery('tipo:agua "hydro pump" pot:>=100')
    assert.deepEqual(mixed.types, ['fire'])
    assert.deepEqual(quoted.textTerms, ['hydro pump'])
    assert.deepEqual(quoted.types, ['water'])
  })
})

describe('Move Filters - matchesMoveFilter', () => {
  const flamethrower: MoveFilterItem = {
    name: 'flamethrower',
    nameEs: 'Lanzallamas',
    nameEn: 'Flamethrower',
    type: 'fire',
    category: 'special',
    power: 90,
    pp: 15,
    accuracy: 100,
    method: 'level-up',
    level: 36,
  }

  const willOWisp: MoveFilterItem = {
    name: 'will-o-wisp',
    nameEs: 'Fuego Fatuo',
    nameEn: 'Will-O-Wisp',
    type: 'fire',
    category: 'status',
    power: null,
    pp: 15,
    accuracy: 85,
    method: 'machine',
    level: 0,
  }

  const closeCombat: MoveFilterItem = {
    name: 'close-combat',
    nameEs: 'A Bocajarro',
    nameEn: 'Close Combat',
    type: 'fighting',
    category: 'physical',
    power: 120,
    pp: 5,
    accuracy: 100,
    method: 'level-up',
    level: 45,
  }

  it('filters by type:fire and tipo:fuego', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'type:fire', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'tipo:fuego', 'es'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'tipo:fuego', 'es'), false)
    assert.equal(matchesMoveFilter(closeCombat, 'type:fighting', 'en'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'tipo:lucha', 'es'), true)
  })

  it('filters by category:special and categoria:especial', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'category:special', 'en'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'categoria:especial', 'es'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'categoria:especial', 'es'), false)
    assert.equal(matchesMoveFilter(closeCombat, 'cat:fisico', 'es'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'cat:physical', 'en'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'cat:estado', 'es'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'c:status', 'en'), true)
  })

  it('filters by power: pot:10, pot:>30, pot:>=90', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'pot:>30', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'pot:>90', 'es'), false)
    assert.equal(matchesMoveFilter(flamethrower, 'pot:>=90', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'pot:90', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'power:<100', 'en'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'pot:>100', 'es'), true)

    // Status moves with null power should not match positive power comparisons
    assert.equal(matchesMoveFilter(willOWisp, 'pot:>0', 'es'), false)
    assert.equal(matchesMoveFilter(willOWisp, 'pot:null', 'es'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'pot:-', 'es'), true)
  })

  it('filters by pp: pp:10, pp:>30, pp:>=30', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'pp:15', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'pp:>10', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'pp:>20', 'es'), false)
    assert.equal(matchesMoveFilter(closeCombat, 'pp:5', 'es'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'pp:<=5', 'es'), true)
  })

  it('filters by accuracy: acc:100, prec:>80', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'acc:100', 'en'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'prec:>80', 'es'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'prec:>90', 'es'), false)
  })

  it('filters by method and level', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'metodo:nivel', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'metodo:mt', 'es'), false)
    assert.equal(matchesMoveFilter(willOWisp, 'metodo:mt', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'nivel:<=40', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'lvl:>40', 'en'), false)
  })

  it('combines multiple filters and text query', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'tipo:fuego pot:>80 cat:especial', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'tipo:fuego pot:>80 cat:fisico', 'es'), false)
    assert.equal(matchesMoveFilter(flamethrower, 'lanzallamas tipo:fuego', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'flamethrower tipo:fuego', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'burbuja tipo:fuego', 'es'), false)
  })

  it('handles edge cases: extra whitespace, invalid tokens, uppercase, accents', () => {
    assert.equal(matchesMoveFilter(flamethrower, '   TIPO:FUEGO    POT:>=90  ', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'tipo:fúégó', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'unknown_field:abc flamethrower', 'en'), true)
  })

  it('supports comma-separated multi-values (OR logic for types/categories/methods)', () => {
    assert.equal(matchesMoveFilter(flamethrower, 'tipo:agua,fuego', 'es'), true)
    assert.equal(matchesMoveFilter(closeCombat, 'type:fire,water', 'en'), false)
    assert.equal(matchesMoveFilter(closeCombat, 'type:fire,fighting', 'en'), true)
    assert.equal(matchesMoveFilter(flamethrower, 'cat:fisico,especial', 'es'), true)
    assert.equal(matchesMoveFilter(willOWisp, 'cat:fisico,especial', 'es'), false)
    assert.equal(matchesMoveFilter(willOWisp, 'metodo:nivel,mt', 'es'), true)
  })

  it('supports negation with ! or - prefix', () => {
    assert.equal(matchesMoveFilter(flamethrower, '!tipo:fuego', 'es'), false)
    assert.equal(matchesMoveFilter(closeCombat, '-tipo:fuego', 'es'), true)
    assert.equal(matchesMoveFilter(flamethrower, '!cat:status', 'en'), true)
    assert.equal(matchesMoveFilter(willOWisp, '-cat:status', 'en'), false)
  })

  it('validates all filter guide cheatsheet examples', () => {
    const examples = [
      { q: 'tipo:fuego', item: flamethrower, expected: true },
      { q: 'type:water', item: flamethrower, expected: false },
      { q: 't:electrico', item: flamethrower, expected: false },
      { q: 'tipo:planta,fuego', item: flamethrower, expected: true },
      { q: '!tipo:normal', item: flamethrower, expected: true },
      { q: 'categoria:especial', item: flamethrower, expected: true },
      { q: 'cat:fisico', item: closeCombat, expected: true },
      { q: 'cat:physical', item: closeCombat, expected: true },
      { q: 'c:estado', item: willOWisp, expected: true },
      { q: '!cat:estado', item: willOWisp, expected: false },
      { q: 'pot:>30', item: flamethrower, expected: true },
      { q: 'pot:>=90', item: flamethrower, expected: true },
      { q: 'power:<60', item: flamethrower, expected: false },
      { q: 'pot:null', item: willOWisp, expected: true },
      { q: 'pp:>10', item: flamethrower, expected: true },
      { q: 'pp:<=5', item: closeCombat, expected: true },
      { q: 'prec:100', item: flamethrower, expected: true },
      { q: 'acc:>=90', item: flamethrower, expected: true },
      { q: 'metodo:nivel', item: flamethrower, expected: true },
      { q: 'method:tm', item: willOWisp, expected: true },
      { q: 'nivel:<=36', item: flamethrower, expected: true },
      { q: 'tipo:fuego pot:>80 cat:especial', item: flamethrower, expected: true },
      { q: 'tipo:fire !cat:status pot:>=90', item: flamethrower, expected: true },
    ]

    for (const ex of examples) {
      assert.equal(
        matchesMoveFilter(ex.item, ex.q, 'es'),
        ex.expected,
        `Failed on query: "${ex.q}"`,
      )
    }
  })

  it('validates English cheatsheet examples in English locale', () => {
    const enExamples = [
      { q: 'type:fire', item: flamethrower, expected: true },
      { q: 'type:water', item: flamethrower, expected: false },
      { q: 't:electric', item: flamethrower, expected: false },
      { q: 'type:grass,ice', item: flamethrower, expected: false },
      { q: '!type:normal', item: flamethrower, expected: true },
      { q: 'category:special', item: flamethrower, expected: true },
      { q: 'cat:physical', item: closeCombat, expected: true },
      { q: 'cat:phys', item: closeCombat, expected: true },
      { q: 'c:status', item: willOWisp, expected: true },
      { q: '!cat:status', item: willOWisp, expected: false },
      { q: 'power:>30', item: flamethrower, expected: true },
      { q: 'pow:>=90', item: flamethrower, expected: true },
      { q: 'pwr:10', item: flamethrower, expected: false },
      { q: 'power:<60', item: flamethrower, expected: false },
      { q: 'power:null', item: willOWisp, expected: true },
      { q: 'pp:10', item: flamethrower, expected: false },
      { q: 'pp:>=30', item: flamethrower, expected: false },
      { q: 'accuracy:100', item: flamethrower, expected: true },
      { q: 'acc:>80', item: willOWisp, expected: true },
      { q: 'acc:>=90', item: flamethrower, expected: true },
      { q: 'method:level', item: flamethrower, expected: true },
      { q: 'method:tm', item: willOWisp, expected: true },
      { q: 'm:tutor', item: willOWisp, expected: false },
      { q: 'level:<=25', item: flamethrower, expected: false },
      { q: 'lvl:>40', item: closeCombat, expected: true },
      { q: 'type:fire pow:>80 cat:special', item: flamethrower, expected: true },
      { q: 'flamethrower type:fire', item: flamethrower, expected: true },
      { q: 'type:fire !cat:status pow:>=90', item: flamethrower, expected: true },
    ]

    for (const ex of enExamples) {
      assert.equal(
        matchesMoveFilter(ex.item, ex.q, 'en'),
        ex.expected,
        `Failed on English query: "${ex.q}"`,
      )
    }
  })
})
