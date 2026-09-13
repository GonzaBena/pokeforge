import { GAME_NAMES_BY_DISPLAY, getEvolutionTriggerName, type Locale } from './i18n/translations'
import type { AcquisitionRow, EvolutionChain, EvolutionNode } from './types'

function formatItemLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function evolutionConditionText(node: EvolutionNode, locale: Locale): string {
  if (node.evolvesFromSpecies === null) return ''
  const parts: string[] = []
  if (node.minLevel)
    parts.push(locale === 'es' ? `Nivel ${node.minLevel}` : `Level ${node.minLevel}`)
  if (node.item)
    parts.push(
      locale === 'es' ? (node.itemDisplay ?? formatItemLabel(node.item)) : formatItemLabel(node.item),
    )
  if (node.trigger && node.trigger !== 'level-up' && !node.item) {
    parts.push(getEvolutionTriggerName(node.trigger, locale))
  }
  return parts.length
    ? parts.join(' · ')
    : locale === 'es'
      ? 'Condición especial'
      : 'Special condition'
}

export interface CaptureStep {
  node: EvolutionNode
  isBase: boolean
  isTarget: boolean
  isTrade: boolean
  condition: string
}

/**
 * Asciende desde el nodo objetivo por `evolvesFromSpecies` hasta la raíz.
 * Cada nodo apunta a un único padre, así que el camino raíz→objetivo es
 * siempre único incluso en chains con ramas (Eevee, Scyther→Scizor/Kleavor).
 * [] si no hay chain o el objetivo no aparece en ella.
 */
export function buildCapturePath(chain: EvolutionChain | null, targetId: number): EvolutionNode[] {
  if (!chain || chain.nodes.length === 0) return []
  const byName = new Map(chain.nodes.map((n) => [n.speciesName, n]))
  const target = chain.nodes.find((n) => n.speciesId === targetId)
  if (!target) return []

  const path: EvolutionNode[] = [target]
  const seen = new Set<number>([target.speciesId])
  let current = target
  while (current.evolvesFromSpecies) {
    const parent = byName.get(current.evolvesFromSpecies)
    if (!parent || seen.has(parent.speciesId)) break
    path.unshift(parent)
    seen.add(parent.speciesId)
    current = parent
  }
  return path
}

export function buildCaptureSteps(
  chain: EvolutionChain | null,
  targetId: number,
  locale: Locale,
): CaptureStep[] {
  const path = buildCapturePath(chain, targetId)
  return path.map((node, i) => ({
    node,
    isBase: i === 0,
    isTarget: node.speciesId === targetId,
    isTrade: node.trigger === 'trade',
    condition: i === 0 ? '' : evolutionConditionText(node, locale),
  }))
}

export interface AcquisitionResolution {
  rows: AcquisitionRow[]
  usedFallback: boolean
  sourceGameKey: string | null
}

/**
 * Filtra acquisitions por el juego seleccionado. AcquisitionRow.game es un
 * display string ("Sword - Shield"); selectedGame es un versionId
 * ("sword-shield") — se comparan vía GAME_NAMES_BY_DISPLAY. Sin match, cae
 * al primer juego presente en el array, que ya viene ordenado por
 * generación ascendente (scripts/lib/buildPokemonDetails.ts).
 */
export function resolveAcquisitionSource(
  rows: AcquisitionRow[] | undefined,
  selectedGame: string,
): AcquisitionResolution {
  if (!rows || rows.length === 0) return { rows: [], usedFallback: false, sourceGameKey: null }

  if (selectedGame) {
    const matched = rows.filter((r) => GAME_NAMES_BY_DISPLAY[r.game] === selectedGame)
    if (matched.length > 0) return { rows: matched, usedFallback: false, sourceGameKey: selectedGame }
  }

  const fallbackGame = rows[0].game
  const fallbackRows = rows.filter((r) => r.game === fallbackGame)
  return {
    rows: fallbackRows,
    usedFallback: true,
    sourceGameKey: GAME_NAMES_BY_DISPLAY[fallbackGame] ?? null,
  }
}
