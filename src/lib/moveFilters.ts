import type { Locale } from './i18n/translations'

export type MoveCategory = 'physical' | 'special' | 'status'

export interface MoveFilterItem {
  name: string
  nameEs?: string | null
  nameEn?: string | null
  type?: string | null
  category?: MoveCategory | string | null
  power?: number | null
  pp?: number | null
  accuracy?: number | null
  method?: string | null
  level?: number | null
}

export type NumericOperator = '>' | '>=' | '<' | '<=' | '=' | '!='

export interface NumericFilter {
  field: 'power' | 'pp' | 'accuracy' | 'level'
  operator: NumericOperator
  value: number | null
}

export interface ParsedMoveQuery {
  raw: string
  textTerms: string[]
  types: string[]
  negatedTypes: string[]
  categories: MoveCategory[]
  negatedCategories: MoveCategory[]
  methods: string[]
  negatedMethods: string[]
  numericFilters: NumericFilter[]
}

export function normalizeFilterText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Multilingual Type Mapping (ES & EN normalized -> standard type key)
const TYPE_MAP: Record<string, string> = {
  // English
  normal: 'normal',
  fighting: 'fighting',
  flying: 'flying',
  poison: 'poison',
  ground: 'ground',
  rock: 'rock',
  bug: 'bug',
  ghost: 'ghost',
  steel: 'steel',
  fire: 'fire',
  water: 'water',
  grass: 'grass',
  electric: 'electric',
  psychic: 'psychic',
  ice: 'ice',
  dragon: 'dragon',
  dark: 'dark',
  fairy: 'fairy',
  stellar: 'stellar',

  // Spanish
  fuego: 'fire',
  agua: 'water',
  planta: 'grass',
  hierba: 'grass',
  electrico: 'electric',
  hielo: 'ice',
  lucha: 'fighting',
  veneno: 'poison',
  tierra: 'ground',
  volador: 'flying',
  psiquico: 'psychic',
  bicho: 'bug',
  roca: 'rock',
  fantasma: 'ghost',
  acero: 'steel',
  siniestro: 'dark',
  hada: 'fairy',
  estelar: 'stellar',
}

// Multilingual Category Mapping
const CATEGORY_MAP: Record<string, MoveCategory> = {
  // English
  physical: 'physical',
  phys: 'physical',
  special: 'special',
  spec: 'special',
  status: 'status',
  stat: 'status',

  // Spanish
  fisico: 'physical',
  fis: 'physical',
  especial: 'special',
  esp: 'special',
  estado: 'status',
  est: 'status',
}

// Learn Method Mapping
const METHOD_MAP: Record<string, string> = {
  'level-up': 'level-up',
  level: 'level-up',
  lvl: 'level-up',
  lv: 'level-up',
  nivel: 'level-up',
  nv: 'level-up',
  nvl: 'level-up',

  machine: 'machine',
  tm: 'machine',
  hm: 'machine',
  mt: 'machine',
  mo: 'machine',
  maquina: 'machine',

  tutor: 'tutor',
  train: 'tutor',

  egg: 'egg',
  huevo: 'egg',
}

const TYPE_PREFIXES = new Set(['type', 'tipo', 't'])
const CATEGORY_PREFIXES = new Set(['category', 'categoria', 'cat', 'c'])
const METHOD_PREFIXES = new Set(['method', 'metodo', 'met', 'm'])
const POWER_PREFIXES = new Set(['power', 'pow', 'pwr', 'potencia', 'pot', 'fuerza'])
const PP_PREFIXES = new Set(['pp', 'puntos'])
const ACCURACY_PREFIXES = new Set(['accuracy', 'acc', 'precision', 'prec'])
const LEVEL_PREFIXES = new Set(['level', 'lvl', 'lv', 'nivel', 'nv', 'nvl'])

function parseNumericFilter(
  field: 'power' | 'pp' | 'accuracy' | 'level',
  valStr: string,
): NumericFilter | null {
  const trimmed = valStr.trim()
  if (trimmed === 'null' || trimmed === '-' || trimmed === 'none') {
    return { field, operator: '=', value: null }
  }

  const match = trimmed.match(/^([><=!]=?|==)?\s*(-?\d+)$/)
  if (!match) return null

  let opStr = match[1] ?? '='
  if (opStr === '==') opStr = '='

  const numVal = parseInt(match[2], 10)
  if (Number.isNaN(numVal)) return null

  return {
    field,
    operator: opStr as NumericOperator,
    value: numVal,
  }
}

/**
 * Parses a search query string into structured filter tokens.
 * Handles prefixes like `tipo:fuego`, `pot:>50`, quotes like `"fire blast"`, and free text.
 */
export function parseMoveQuery(query: string): ParsedMoveQuery {
  const result: ParsedMoveQuery = {
    raw: query,
    textTerms: [],
    types: [],
    negatedTypes: [],
    categories: [],
    negatedCategories: [],
    methods: [],
    negatedMethods: [],
    numericFilters: [],
  }

  if (!query || !query.trim()) {
    return result
  }

  // Tokenize preserving quotes
  const tokenRegex = /"([^"]+)"|'([^']+)'|(\S+)/g
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(query)) !== null) {
    const rawToken = match[1] ?? match[2] ?? match[3]
    if (!rawToken) continue

    const colonIndex = rawToken.indexOf(':')
    if (colonIndex > 0) {
      let rawPrefix = normalizeFilterText(rawToken.slice(0, colonIndex))
      let isNegated = false
      if (rawPrefix.startsWith('!') || rawPrefix.startsWith('-')) {
        isNegated = true
        rawPrefix = rawPrefix.slice(1)
      }

      const valuePart = rawToken.slice(colonIndex + 1)

      if (TYPE_PREFIXES.has(rawPrefix)) {
        const parts = valuePart
          .split(',')
          .map((v) => normalizeFilterText(v))
          .filter(Boolean)
        for (const p of parts) {
          const canonical = TYPE_MAP[p] ?? p
          if (isNegated) {
            result.negatedTypes.push(canonical)
          } else {
            result.types.push(canonical)
          }
        }
        continue
      } else if (CATEGORY_PREFIXES.has(rawPrefix)) {
        const parts = valuePart
          .split(',')
          .map((v) => normalizeFilterText(v))
          .filter(Boolean)
        for (const p of parts) {
          const canonical = (CATEGORY_MAP[p] ?? p) as MoveCategory
          if (isNegated) {
            result.negatedCategories.push(canonical)
          } else {
            result.categories.push(canonical)
          }
        }
        continue
      } else if (METHOD_PREFIXES.has(rawPrefix)) {
        const parts = valuePart
          .split(',')
          .map((v) => normalizeFilterText(v))
          .filter(Boolean)
        for (const p of parts) {
          const canonical = METHOD_MAP[p] ?? p
          if (isNegated) {
            result.negatedMethods.push(canonical)
          } else {
            result.methods.push(canonical)
          }
        }
        continue
      } else if (POWER_PREFIXES.has(rawPrefix)) {
        const numFilter = parseNumericFilter('power', valuePart)
        if (numFilter) {
          result.numericFilters.push(numFilter)
        }
        continue
      } else if (PP_PREFIXES.has(rawPrefix)) {
        const numFilter = parseNumericFilter('pp', valuePart)
        if (numFilter) {
          result.numericFilters.push(numFilter)
        }
        continue
      } else if (ACCURACY_PREFIXES.has(rawPrefix)) {
        const numFilter = parseNumericFilter('accuracy', valuePart)
        if (numFilter) {
          result.numericFilters.push(numFilter)
        }
        continue
      } else if (LEVEL_PREFIXES.has(rawPrefix)) {
        const numFilter = parseNumericFilter('level', valuePart)
        if (numFilter) {
          result.numericFilters.push(numFilter)
        }
        continue
      } else {
        // Unknown prefix with colon (e.g. unknown_field:abc)
        // Ignored as an unsupported filter tag so it doesn't break search
        continue
      }
    }

    // Otherwise treat as plain search text
    const cleanText = normalizeFilterText(rawToken)
    if (cleanText) {
      result.textTerms.push(cleanText)
    }
  }

  return result
}

function evaluateNumericCondition(
  actualValue: number | null | undefined,
  filter: NumericFilter,
): boolean {
  if (filter.value === null) {
    if (filter.operator === '!=') {
      return actualValue !== null && actualValue !== undefined
    }
    return actualValue === null || actualValue === undefined
  }

  if (actualValue === null || actualValue === undefined) {
    // Moves with no power/accuracy/level cannot satisfy >, >=, <, <=, = on a numeric value
    return false
  }

  switch (filter.operator) {
    case '>':
      return actualValue > filter.value
    case '>=':
      return actualValue >= filter.value
    case '<':
      return actualValue < filter.value
    case '<=':
      return actualValue <= filter.value
    case '=':
      return actualValue === filter.value
    case '!=':
      return actualValue !== filter.value
    default:
      return false
  }
}

function matchMethod(actualMethod: string, targetMethod: string): boolean {
  if (targetMethod === 'tutor') return actualMethod === 'tutor' || actualMethod === 'train'
  if (targetMethod === 'machine')
    return actualMethod === 'machine' || actualMethod === 'tm' || actualMethod === 'hm'
  return actualMethod === targetMethod
}

/**
 * Checks if a given move satisfies the parsed search query.
 */
export function matchesMoveFilter(
  item: MoveFilterItem,
  queryOrParsed: string | ParsedMoveQuery,
  _locale: Locale = 'en',
): boolean {
  const parsed = typeof queryOrParsed === 'string' ? parseMoveQuery(queryOrParsed) : queryOrParsed
  const itemType = item.type ? normalizeFilterText(item.type) : ''
  const itemCategory = item.category ? normalizeFilterText(item.category) : ''
  const itemMethod = item.method ? normalizeFilterText(item.method) : ''

  // 1. Types filter (Positive: OR among types in query)
  if (parsed.types.length > 0) {
    if (!parsed.types.includes(itemType)) {
      return false
    }
  }
  // Negated types: cannot be any of them
  if (parsed.negatedTypes.length > 0) {
    if (parsed.negatedTypes.includes(itemType)) {
      return false
    }
  }

  // 2. Categories filter (Positive: OR among categories in query)
  if (parsed.categories.length > 0) {
    if (!parsed.categories.includes(itemCategory as MoveCategory)) {
      return false
    }
  }
  // Negated categories
  if (parsed.negatedCategories.length > 0) {
    if (parsed.negatedCategories.includes(itemCategory as MoveCategory)) {
      return false
    }
  }

  // 3. Methods filter (Positive: OR among methods in query)
  if (parsed.methods.length > 0) {
    const matchesMethod = parsed.methods.some((m) => matchMethod(itemMethod, m))
    if (!matchesMethod) return false
  }
  // Negated methods
  if (parsed.negatedMethods.length > 0) {
    const matchesNegated = parsed.negatedMethods.some((m) => matchMethod(itemMethod, m))
    if (matchesNegated) return false
  }

  // 4. Numeric filters (power, pp, accuracy, level)
  for (const numFilter of parsed.numericFilters) {
    let actual: number | null | undefined
    if (numFilter.field === 'power') actual = item.power
    else if (numFilter.field === 'pp') actual = item.pp
    else if (numFilter.field === 'accuracy') actual = item.accuracy
    else if (numFilter.field === 'level') actual = item.level

    if (!evaluateNumericCondition(actual, numFilter)) {
      return false
    }
  }

  // 5. Text search on name, Spanish name, English name, and slug
  if (parsed.textTerms.length > 0) {
    const nameNorm = normalizeFilterText(item.name)
    const slugNorm = normalizeFilterText(item.name.replace(/-/g, ' '))
    const esNorm = item.nameEs ? normalizeFilterText(item.nameEs) : ''
    const enNorm = item.nameEn ? normalizeFilterText(item.nameEn) : ''

    for (const term of parsed.textTerms) {
      const match =
        nameNorm.includes(term) ||
        slugNorm.includes(term) ||
        esNorm.includes(term) ||
        enNorm.includes(term)

      if (!match) return false
    }
  }

  return true
}
