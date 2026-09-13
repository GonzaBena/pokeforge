import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(process.cwd())
const pokedexViewPath = path.join(projectRoot, 'src/views/PokedexView.astro')
const genProgressPanelPath = path.join(projectRoot, 'src/components/GenerationProgressPanel.astro')
const genProgressCssPath = path.join(projectRoot, 'src/styles/components/generation-progress-panel.css')
const pokedexScriptPath = path.join(projectRoot, 'src/scripts/pokedex-page.ts')

test('Pokedex layout - page__header-counters contains toggle button and excludes panel body', () => {
  const pokedexViewContent = fs.readFileSync(pokedexViewPath, 'utf8')

  // Extract .page__header block up to GenerationProgressPanel
  const headerStartIndex = pokedexViewContent.indexOf('<div class="page__header">')
  const headerEndIndex = pokedexViewContent.indexOf('<GenerationProgressPanel')
  assert.ok(headerStartIndex !== -1 && headerEndIndex !== -1, 'Could not locate .page__header in PokedexView.astro')
  const headerMarkup = pokedexViewContent.slice(headerStartIndex, headerEndIndex)

  // Verify .page__header-counters contains the toggle button
  assert.match(
    headerMarkup,
    /data-generation-progress-toggle/,
    'Expected .page__header-counters to contain data-generation-progress-toggle',
  )

  // Verify .page__header does NOT contain GenerationProgressPanel or generation-progress-body
  assert.doesNotMatch(
    headerMarkup,
    /<GenerationProgressPanel\s*\/>/,
    'Expected GenerationProgressPanel to NOT be nested inside .page__header',
  )
  assert.doesNotMatch(
    headerMarkup,
    /data-generation-progress-body/,
    'Expected data-generation-progress-body to NOT be inside .page__header',
  )
})

test('Pokedex layout - GenerationProgressPanel is placed between page__header and pokedex-controls', () => {
  const pokedexViewContent = fs.readFileSync(pokedexViewPath, 'utf8')

  // Verify that GenerationProgressPanel appears after .page__header closing div and before .pokedex-controls
  const orderRegex = /<\/div>\s*(?:<!--[\s\S]*?-->\s*)*<GenerationProgressPanel\s*\/>[\s\S]*?<div class="pokedex-controls">/
  assert.match(
    pokedexViewContent,
    orderRegex,
    'Expected <GenerationProgressPanel /> to be placed between .page__header and .pokedex-controls',
  )
})

test('GenerationProgressPanel component structure has card header and close button', () => {
  const panelContent = fs.readFileSync(genProgressPanelPath, 'utf8')

  // Should have data-generation-progress-panel and data-generation-progress-close
  assert.match(
    panelContent,
    /data-generation-progress-panel/,
    'Expected component to have data-generation-progress-panel',
  )
  assert.match(
    panelContent,
    /data-generation-progress-close/,
    'Expected component to have data-generation-progress-close button',
  )
  assert.match(
    panelContent,
    /data-milestone-tracker/,
    'Expected component to have data-milestone-tracker',
  )
  assert.match(
    panelContent,
    /data-generation-progress-bars/,
    'Expected component to have data-generation-progress-bars',
  )
})

test('CSS - generation-progress-panel defines full-width card and grid-template-rows accordion', () => {
  const cssContent = fs.readFileSync(genProgressCssPath, 'utf8')

  assert.match(
    cssContent,
    /grid-template-rows/,
    'Expected CSS to utilize grid-template-rows for smooth accordion animation',
  )
  assert.match(
    cssContent,
    /\.generation-progress-panel\.is-collapsed/,
    'Expected CSS to support .is-collapsed state with 0fr',
  )
  assert.match(
    cssContent,
    /\.generation-progress-panel__close-btn/,
    'Expected CSS to style close button',
  )
})

test('pokedex-page script handles close button and class toggle for region progress', () => {
  const scriptContent = fs.readFileSync(pokedexScriptPath, 'utf8')

  assert.match(
    scriptContent,
    /data-generation-progress-close/,
    'Expected script to attach click listener for data-generation-progress-close',
  )
  assert.match(
    scriptContent,
    /is-collapsed|is-expanded/,
    'Expected script to toggle is-collapsed / is-expanded classes on generation progress panel',
  )
})
