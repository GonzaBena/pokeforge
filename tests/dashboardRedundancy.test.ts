import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('dashboardRedundancy - DashboardView does not contain redundant index chips for notifications or settings', () => {
  const viewPath = path.join(projectRoot, 'src/views/DashboardView.astro')
  const content = fs.readFileSync(viewPath, 'utf8')

  // The index bar should not link to notifications or settings
  assert.ok(
    !content.includes('data-index-chip="notifications"'),
    'DashboardView must not contain notifications index chip'
  )
  assert.ok(
    !content.includes('href="#settings"'),
    'DashboardView must not contain settings index chip'
  )
  assert.ok(
    !content.includes('notificationsHref'),
    'DashboardView should not need notificationsHref'
  )
  assert.ok(
    !content.includes('settingsHref'),
    'DashboardView should not need settingsHref'
  )

  // Verify that only the relevant on-page sections exist in the index bar: overview, active-team, game-progress
  assert.match(content, /<a href="#overview" class="dashboard-index-chip"/)
  assert.match(content, /<a href="#active-team" class="dashboard-index-chip"/)
  assert.match(content, /<a href="#game-progress" class="dashboard-index-chip"/)
})

test('dashboardRedundancy - DashboardView does not contain redundant bottom sections for notifications or settings', () => {
  const viewPath = path.join(projectRoot, 'src/views/DashboardView.astro')
  const content = fs.readFileSync(viewPath, 'utf8')

  // Bottom notifications section must be removed (it has its own dedicated page at /dashboard/notifications/)
  assert.ok(
    !content.includes('id="notifications"'),
    'DashboardView must not contain section id="notifications"'
  )
  assert.ok(
    !content.includes('data-notifications-section'),
    'DashboardView must not contain data-notifications-section'
  )

  // Bottom settings section must be removed (it has its own dedicated page at /dashboard/settings/)
  assert.ok(
    !content.includes('id="settings"'),
    'DashboardView must not contain section id="settings"'
  )
  assert.ok(
    !content.includes('settings-teaser-card'),
    'DashboardView must not contain settings-teaser-card'
  )
})

test('dashboardRedundancy - DashboardView removes unused notification listener scripts', () => {
  const viewPath = path.join(projectRoot, 'src/views/DashboardView.astro')
  const content = fs.readFileSync(viewPath, 'utf8')

  // Unused notification listeners & imports in DashboardView script
  assert.ok(
    !content.includes('renderNotifications'),
    'DashboardView script must not contain renderNotifications'
  )
  assert.ok(
    !content.includes('getUnassignedCaptures'),
    'DashboardView script must not import getUnassignedCaptures'
  )
  assert.ok(
    !content.includes('VERSION_ASSIGNMENT_CHANGED_EVENT'),
    'DashboardView script must not import VERSION_ASSIGNMENT_CHANGED_EVENT'
  )
  assert.ok(
    !content.includes('data-notifications-badge'),
    'DashboardView markup/script must not reference data-notifications-badge'
  )
})

test('dashboardRedundancy - all remaining dashboard index chips have matching section anchors', () => {
  const viewPath = path.join(projectRoot, 'src/views/DashboardView.astro')
  const content = fs.readFileSync(viewPath, 'utf8')

  // Matches all chip hrefs
  const chipHrefs = Array.from(content.matchAll(/class="dashboard-index-chip"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*class="dashboard-index-chip"/g))
    .map((m) => m[1] || m[2])

  assert.deepEqual(chipHrefs, ['#overview', '#active-team', '#game-progress'])

  // Ensure each anchor target exists in the document
  for (const href of chipHrefs) {
    const id = href.replace('#', '')
    assert.ok(
      content.includes(`id="${id}"`),
      `DashboardView must contain an element with id="${id}" for chip ${href}`
    )
  }
})
