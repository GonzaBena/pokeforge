import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { getLocalizedPath } from '../src/lib/i18n/translations'

test('notificationsRoute - localized paths map to /dashboard/notifications/ correctly', () => {
  assert.equal(getLocalizedPath('/dashboard/notifications/', 'en'), '/dashboard/notifications/')
  assert.equal(getLocalizedPath('/dashboard/notifications/', 'es'), '/es/dashboard/notifications/')
})

test('notificationsRoute - page files exist for both default and spanish routes', () => {
  const root = process.cwd()
  const enPage = path.join(root, 'src/pages/dashboard/notifications.astro')
  const esPage = path.join(root, 'src/pages/es/dashboard/notifications.astro')
  const viewFile = path.join(root, 'src/views/NotificationsView.astro')

  assert.ok(fs.existsSync(enPage), 'en notifications.astro page must exist')
  assert.ok(fs.existsSync(esPage), 'es notifications.astro page must exist')
  assert.ok(fs.existsSync(viewFile), 'NotificationsView.astro must exist')
})

test('notificationsRoute - SyncModal redirects to /dashboard/notifications/', () => {
  const root = process.cwd()
  const syncModalFile = path.join(root, 'src/components/SyncModal.astro')
  const content = fs.readFileSync(syncModalFile, 'utf-8')

  // Check that SyncModal points to /dashboard/notifications/ rather than /dashboard/#notifications
  assert.ok(
    content.includes("'/dashboard/notifications/'"),
    'SyncModal must link to /dashboard/notifications/'
  )
})
