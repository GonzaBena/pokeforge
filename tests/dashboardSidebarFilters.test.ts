import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('dashboardSidebarFilters - DashboardLayout does not contain regional and obtainable quick filters in sidebar', () => {
  const layoutPath = path.join(projectRoot, 'src/layouts/DashboardLayout.astro')
  const content = fs.readFileSync(layoutPath, 'utf8')

  // Sidebar subnav must not have quick mode filters for regional or obtainable
  assert.ok(
    !content.includes('data-quick-filter="regional"'),
    'DashboardLayout sidebar must not include data-quick-filter="regional"'
  )
  assert.ok(
    !content.includes('data-quick-filter="obtainable"'),
    'DashboardLayout sidebar must not include data-quick-filter="obtainable"'
  )
  assert.ok(
    !content.includes('sidebar-subnav-filters'),
    'DashboardLayout sidebar must not include .sidebar-subnav-filters container'
  )
  assert.ok(
    !content.includes('data-quick-filter'),
    'DashboardLayout script must not query or listen to [data-quick-filter]'
  )
})

test('dashboardSidebarFilters - DashboardLayout retains core sidebar navigation items', () => {
  const layoutPath = path.join(projectRoot, 'src/layouts/DashboardLayout.astro')
  const content = fs.readFileSync(layoutPath, 'utf8')

  // Core subnav link selectors and toggles remain intact
  assert.ok(
    content.includes('data-section-link={subItem.id}'),
    'DashboardLayout must retain data-section-link attribute for subnav items'
  )
  assert.ok(
    content.includes('data-main-section-link={section.id}'),
    'DashboardLayout must retain data-main-section-link attribute'
  )
  assert.ok(
    content.includes('data-section-toggle={section.id}'),
    'DashboardLayout must retain data-section-toggle attribute'
  )
})
