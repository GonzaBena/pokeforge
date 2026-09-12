import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('Service Worker Offline Fallback & Precaching Config', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js')
  const swContent = fs.readFileSync(swPath, 'utf8')

  it('service worker defines precached data assets including all 11 chunks and metadata', () => {
    assert.ok(swContent.includes('/data/pokedex/index.json'), 'Precaches pokedex index.json')
    assert.ok(swContent.includes('/data/pokedex/game-pokedex.json'), 'Precaches game-pokedex.json')
    assert.ok(swContent.includes('/data/moves/details.json'), 'Precaches moves/details.json')
    assert.ok(swContent.includes('/data/types/type-chart.json'), 'Precaches type-chart.json')
    assert.ok(swContent.includes('/data/generations/generations.json'), 'Precaches generations.json')

    for (let i = 0; i <= 10; i++) {
      assert.ok(
        swContent.includes(`/data/pokedex/chunk-${i}.json`),
        `Precaches /data/pokedex/chunk-${i}.json`,
      )
    }
  })

  it('service worker has synthetic SVG fallback response for failed sprite requests', () => {
    assert.ok(
      swContent.includes('image/svg+xml'),
      'Provides image/svg+xml content-type for image fallback',
    )
    assert.ok(
      swContent.includes('raw.githubusercontent.com'),
      'Intercepts raw.githubusercontent.com',
    )
    assert.ok(
      swContent.includes('<svg') && swContent.includes('</svg>'),
      'Contains inline SVG fallback for offline sprites',
    )
  })

  it('service worker uses separate cache stores for static, data, and sprites', () => {
    assert.ok(swContent.includes('DATA_CACHE') || swContent.includes('data-cache') || swContent.includes('CACHE_DATA'), 'Has distinct data cache')
    assert.ok(swContent.includes('SPRITES_CACHE') || swContent.includes('sprites-cache') || swContent.includes('CACHE_SPRITES'), 'Has distinct sprites cache')
  })
})
