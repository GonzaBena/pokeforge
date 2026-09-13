import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('icons - all data-lucide icons used across the codebase are registered in src/lib/icons.ts', () => {
  function walk(dir: string): string[] {
    const results: string[] = []
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f)
      if (fs.statSync(full).isDirectory()) {
        if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.astro') {
          results.push(...walk(full))
        }
      } else if (/\.(astro|ts|js|mjs|html)$/.test(f)) {
        results.push(full)
      }
    }
    return results
  }

  const files = walk('src')
  const iconsUsed = new Set<string>()
  const regex = /data-lucide=["']([^"'${}]+)["']/g

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      iconsUsed.add(match[1])
    }
  }

  // Also include known dynamic icons
  const dynamicIcons = [
    'circle',
    'circle-dashed',
    'circle-dot',
    'circle-check',
    'circle-x',
    'shield-check',
    'sparkle',
    'sparkles',
    'sliders',
    'database',
    'globe',
    'search-x',
    'menu',
    'play',
  ]
  for (const di of dynamicIcons) {
    iconsUsed.add(di)
  }

  const iconsFile = fs.readFileSync('src/lib/icons.ts', 'utf8')

  const missing: string[] = []
  for (const icon of iconsUsed) {
    const pascal = icon
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')

    if (!iconsFile.includes(pascal)) {
      missing.push(`${icon} (expected Lucide icon: ${pascal})`)
    }
  }

  assert.deepEqual(
    missing,
    [],
    `The following icons are used in markup but not registered in src/lib/icons.ts:\n${missing.join('\n')}`
  )
})
