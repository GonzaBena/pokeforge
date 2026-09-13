import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('notificationsHeader - header contains title and badge together without duplicate section header', () => {
  const root = process.cwd()
  const viewPath = path.join(root, 'src/views/NotificationsView.astro')
  const content = fs.readFileSync(viewPath, 'utf-8')

  // Check that the badge is in the header title row
  assert.ok(
    content.includes('dashboard-header__title-row'),
    'Header must have a title-row container for title and badge'
  )

  // Ensure there is only one notificationsTitle rendered in the template
  const titleMatches = content.match(/\{t\.dashboard\.notificationsTitle\}/g) || []
  // In frontmatter layout title={...}, and in the header <h1>: exactly 2 occurrences total
  assert.equal(
    titleMatches.length,
    2,
    `notificationsTitle should only appear in Layout title prop and header h1, found ${titleMatches.length}`
  )

  // Ensure duplicate section header is removed
  assert.ok(
    !content.includes('<h2 class="dashboard-section__title">{t.dashboard.notificationsTitle}</h2>'),
    'Duplicate section title h2 should be removed'
  )
})
