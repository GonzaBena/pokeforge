import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('settings layout - styles for back button and header are defined in dashboard.css', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  // Must have .settings-back-btn styling
  assert.match(cssContent, /\.settings-back-btn\s*\{/, 'dashboard.css must style .settings-back-btn')
  assert.match(cssContent, /\.settings-back-btn:hover/, 'dashboard.css must define hover state for .settings-back-btn')
  assert.match(cssContent, /\.settings-header-top\s*\{/, 'dashboard.css must style .settings-header-top')
})

test('settings layout - header-h token is responsive and prevents mobile overlap', () => {
  const tokensPath = path.join(projectRoot, 'src/styles/tokens.css')
  const tokensContent = fs.readFileSync(tokensPath, 'utf8')

  // --header-h should match realistic navbar height on desktop and mobile
  // Mobile should not be a static 94px that pushes sticky mobile-bar into page content
  const matchesMobileMedia = tokensContent.includes('@media') && tokensContent.includes('--header-h')
  assert.equal(
    matchesMobileMedia,
    true,
    'tokens.css must adapt --header-h for mobile screens so sticky header does not overlap content'
  )
})
