import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('dashboard section navigation - scroll-margin-top is defined for dashboard and settings sections', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  // Check that scroll-margin-top is configured for sections
  assert.match(
    cssContent,
    /scroll-margin-top:\s*calc\(/,
    'dashboard.css must define scroll-margin-top using calc() to offset sticky headers'
  )

  // Must cover both desktop and mobile
  const hasMobileMedia = cssContent.includes('@media (max-width: 992px)') || cssContent.includes('@media (max-width: 768px)')
  assert.equal(
    hasMobileMedia,
    true,
    'dashboard.css must have responsive scroll-margin-top accounting for mobile bar'
  )

  // Must target key dashboard and settings section selectors
  assert.match(cssContent, /#active-team/, 'dashboard.css must target #active-team')
  assert.match(cssContent, /#game-progress/, 'dashboard.css must target #game-progress')
  assert.match(cssContent, /\.dashboard-section/, 'dashboard.css must target .dashboard-section')
  assert.match(cssContent, /\.settings-card/, 'dashboard.css must target .settings-card')
})

test('dashboard section navigation - smooth scroll behavior is configured with prefers-reduced-motion check', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  assert.match(
    cssContent,
    /scroll-behavior:\s*smooth/,
    'dashboard.css must define scroll-behavior: smooth for dashboard and children'
  )
  assert.match(
    cssContent,
    /prefers-reduced-motion:\s*no-preference/,
    'dashboard.css must wrap smooth scroll in prefers-reduced-motion: no-preference'
  )
})

