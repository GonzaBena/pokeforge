import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('notificationsView - uses matching CSS classes from dashboard.css', () => {
  const root = process.cwd()
  const viewPath = path.join(root, 'src/views/NotificationsView.astro')
  const content = fs.readFileSync(viewPath, 'utf-8')

  // Check required classes for table layout, sprite-name alignment and button styles
  const requiredClasses = [
    'notif-cell-pokemon',
    'notif-sprite',
    'notif-pokemon-meta',
    'notif-pokemon-id',
    'notif-pokemon-name',
    'notif-cell-game',
    'notif-game-title',
    'notif-version-dots',
    'notif-version-dot',
    'notif-excl-pill',
    'notif-btn-group',
    'notif-btn',
    'notif-btn--both',
  ]

  for (const cls of requiredClasses) {
    assert.ok(
      content.includes(cls),
      `NotificationsView must include class "${cls}" defined in dashboard.css`
    )
  }

  // Ensure old/mismatched classes are not used
  const forbiddenClasses = [
    'notifications-pokemon-cell',
    'notifications-pokemon-sprite',
    'btn-version-pick',
  ]

  for (const cls of forbiddenClasses) {
    assert.ok(
      !content.includes(cls),
      `NotificationsView must not use mismatched class "${cls}"`
    )
  }
})
