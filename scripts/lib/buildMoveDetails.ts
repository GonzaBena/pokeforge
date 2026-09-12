import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fetchJson } from './http.ts'
import { cachedFetch } from './diskCache.ts'
import { createLimiter } from './limiter.ts'

const API_ROOT = 'https://pokeapi.co/api/v2'
const OUT_DIR = path.resolve(import.meta.dirname, '..', '..', 'public', 'data', 'moves')

interface RawMoveDetail {
  name: string
  names?: { name: string; language: { name: string } }[]
  type: { name: string }
  damage_class: { name: string }
  power: number | null
  pp: number | null
  accuracy: number | null
  flavor_text_entries?: { flavor_text: string; language: { name: string } }[]
  effect_entries?: { effect: string; short_effect: string; language: { name: string } }[]
}

export interface MoveData {
  name: string
  type: string
  category: 'physical' | 'special' | 'status'
  power: number | null
  pp: number | null
  accuracy: number | null
  nameEs?: string
  nameEn?: string
  descriptionEs?: string
  descriptionEn?: string
}

export type MovesDetailsMap = Record<string, MoveData>

export async function buildMoveDetails(force = false): Promise<MovesDetailsMap> {
  const list = await cachedFetch<{ results: { name: string; url: string }[] }>(
    'moves',
    'list',
    () => fetchJson(`${API_ROOT}/move?limit=1000`),
    force,
  )

  const movesMap: MovesDetailsMap = {}
  const limit = createLimiter(15)

  await Promise.all(
    list.results.map(({ name, url }) =>
      limit(async () => {
        try {
          const raw = await cachedFetch<RawMoveDetail>(
            'move-detail',
            name,
            () => fetchJson<RawMoveDetail>(url),
            force,
          )

          const nameEs = raw.names?.find((n) => n.language?.name === 'es')?.name
          const nameEn = raw.names?.find((n) => n.language?.name === 'en')?.name

          let descEs = ''
          const esFlavors = raw.flavor_text_entries?.filter((f) => f.language?.name === 'es')
          if (esFlavors && esFlavors.length > 0) {
            descEs = esFlavors[esFlavors.length - 1].flavor_text
              .replace(/[\f\n\r]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          }

          let descEn = ''
          const enFlavors = raw.flavor_text_entries?.filter((f) => f.language?.name === 'en')
          if (enFlavors && enFlavors.length > 0) {
            descEn = enFlavors[enFlavors.length - 1].flavor_text
              .replace(/[\f\n\r]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
          } else {
            const enEffect = raw.effect_entries?.find((e) => e.language?.name === 'en')
            if (enEffect?.short_effect) {
              descEn = enEffect.short_effect
                .replace(/[\f\n\r]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
            }
          }

          if (!descEs && descEn) {
            descEs = descEn
          }

          movesMap[name] = {
            name: raw.name,
            type: raw.type?.name ?? 'normal',
            category: (raw.damage_class?.name as 'physical' | 'special' | 'status') ?? 'status',
            power: raw.power ?? null,
            pp: raw.pp ?? null,
            accuracy: raw.accuracy ?? null,
            ...(nameEs ? { nameEs } : {}),
            ...(nameEn ? { nameEn } : {}),
            ...(descEs ? { descriptionEs: descEs } : {}),
            ...(descEn ? { descriptionEn: descEn } : {}),
          }
        } catch (err) {
          console.warn(`Failed to fetch move detail for ${name}:`, err)
        }
      }),
    ),
  )

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(path.join(OUT_DIR, 'details.json'), JSON.stringify(movesMap), 'utf-8')

  console.log(
    `move-details: wrote details for ${Object.keys(movesMap).length} moves to public/data/moves/details.json`,
  )
  return movesMap
}
