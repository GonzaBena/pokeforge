import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isSettingsPath,
  isNotificationsPath,
  getSidebarHeader,
  getSidebarSections,
} from '../src/lib/dashboardSidebar'

test('dashboardSidebar - isSettingsPath identifies settings routes correctly', () => {
  // English routes
  assert.equal(isSettingsPath('/dashboard/settings'), true)
  assert.equal(isSettingsPath('/dashboard/settings/'), true)
  assert.equal(isSettingsPath('/dashboard/settings#audio'), true)
  assert.equal(isSettingsPath('/dashboard'), false)
  assert.equal(isSettingsPath('/dashboard/'), false)
  assert.equal(isSettingsPath('/dashboard/notifications'), false)
  assert.equal(isSettingsPath('/pokedex'), false)

  // Spanish routes
  assert.equal(isSettingsPath('/es/dashboard/settings'), true)
  assert.equal(isSettingsPath('/es/dashboard/settings/'), true)
  assert.equal(isSettingsPath('/es/dashboard/settings#sync'), true)
  assert.equal(isSettingsPath('/es/dashboard'), false)
  assert.equal(isSettingsPath('/es/dashboard/'), false)
  assert.equal(isSettingsPath('/es/dashboard/notifications'), false)
})

test('dashboardSidebar - isNotificationsPath identifies notifications routes correctly', () => {
  // English routes
  assert.equal(isNotificationsPath('/dashboard/notifications'), true)
  assert.equal(isNotificationsPath('/dashboard/notifications/'), true)
  assert.equal(isNotificationsPath('/dashboard/notifications#unassigned'), true)
  assert.equal(isNotificationsPath('/dashboard/notifications?tab=all'), true)
  assert.equal(isNotificationsPath('/dashboard'), false)
  assert.equal(isNotificationsPath('/dashboard/'), false)
  assert.equal(isNotificationsPath('/dashboard/settings'), false)

  // Spanish routes
  assert.equal(isNotificationsPath('/es/dashboard/notifications'), true)
  assert.equal(isNotificationsPath('/es/dashboard/notifications/'), true)
  assert.equal(isNotificationsPath('/es/dashboard/notifications#unassigned'), true)
  assert.equal(isNotificationsPath('/es/dashboard'), false)
  assert.equal(isNotificationsPath('/es/dashboard/settings'), false)
})

test('dashboardSidebar - getSidebarHeader returns section title and icon corresponding to current view', () => {
  // When in dashboard view (EN)
  const dashHeaderEn = getSidebarHeader('/dashboard/', 'en')
  assert.equal(dashHeaderEn.icon, 'layout-dashboard')
  assert.equal(dashHeaderEn.label, 'PokeForge Hub')
  assert.equal(dashHeaderEn.title, 'Dashboard')

  // When in dashboard view (ES)
  const dashHeaderEs = getSidebarHeader('/es/dashboard/', 'es')
  assert.equal(dashHeaderEs.icon, 'layout-dashboard')
  assert.equal(dashHeaderEs.label, 'PokeForge Hub')
  assert.equal(dashHeaderEs.title, 'Dashboard')

  // When in notifications view (EN)
  const notifHeaderEn = getSidebarHeader('/dashboard/notifications/', 'en')
  assert.equal(notifHeaderEn.icon, 'bell')
  assert.equal(notifHeaderEn.label, 'PokeForge Hub')
  assert.equal(notifHeaderEn.title, 'Notifications')

  // When in notifications view (ES)
  const notifHeaderEs = getSidebarHeader('/es/dashboard/notifications/', 'es')
  assert.equal(notifHeaderEs.icon, 'bell')
  assert.equal(notifHeaderEs.label, 'PokeForge Hub')
  assert.equal(notifHeaderEs.title, 'Notificaciones')

  // When in settings view (EN)
  const settingsHeaderEn = getSidebarHeader('/dashboard/settings/', 'en')
  assert.equal(settingsHeaderEn.icon, 'settings')
  assert.equal(settingsHeaderEn.label, 'PokeForge Hub')
  assert.equal(settingsHeaderEn.title, 'Settings')

  // When in settings view (ES)
  const settingsHeaderEs = getSidebarHeader('/es/dashboard/settings/', 'es')
  assert.equal(settingsHeaderEs.icon, 'settings')
  assert.equal(settingsHeaderEs.label, 'PokeForge Hub')
  assert.equal(settingsHeaderEs.title, 'Configuración')
})

test('dashboardSidebar - getSidebarSections returns Dashboard, Notifications, and Settings with accordion expansion', () => {
  // Case 1: In Dashboard page (EN)
  const sectionsInDashboard = getSidebarSections('/dashboard/', 'en')
  assert.equal(sectionsInDashboard.length, 3)

  const dashSection = sectionsInDashboard[0]
  assert.equal(dashSection.id, 'dashboard')
  assert.equal(dashSection.title, 'Dashboard')
  assert.equal(dashSection.icon, 'layout-dashboard')
  assert.equal(dashSection.href, '/dashboard/')
  assert.equal(dashSection.isActive, true)
  assert.equal(dashSection.isExpanded, true)
  assert.equal(dashSection.items.length, 3)
  assert.equal(dashSection.items[0].id, 'overview')
  assert.equal(dashSection.items[0].href, '#overview')
  assert.equal(dashSection.items[1].id, 'active-team')
  assert.equal(dashSection.items[1].href, '#active-team')
  assert.equal(dashSection.items[2].id, 'game-progress')
  assert.equal(dashSection.items[2].href, '#game-progress')

  const notifSectionInDash = sectionsInDashboard[1]
  assert.equal(notifSectionInDash.id, 'notifications')
  assert.equal(notifSectionInDash.title, 'Notifications')
  assert.equal(notifSectionInDash.icon, 'bell')
  assert.equal(notifSectionInDash.href, '/dashboard/notifications/')
  assert.equal(notifSectionInDash.isActive, false)
  assert.equal(notifSectionInDash.isExpanded, false)

  const settingsSectionInDash = sectionsInDashboard[2]
  assert.equal(settingsSectionInDash.id, 'settings')
  assert.equal(settingsSectionInDash.title, 'Settings')
  assert.equal(settingsSectionInDash.icon, 'settings')
  assert.equal(settingsSectionInDash.href, '/dashboard/settings/')
  assert.equal(settingsSectionInDash.isActive, false)
  assert.equal(settingsSectionInDash.isExpanded, false)

  // Case 2: In Notifications page (ES)
  const sectionsInNotifications = getSidebarSections('/es/dashboard/notifications/', 'es')
  assert.equal(sectionsInNotifications.length, 3)

  const dashSectionInNotif = sectionsInNotifications[0]
  assert.equal(dashSectionInNotif.isActive, false)
  assert.equal(dashSectionInNotif.isExpanded, false)
  assert.equal(dashSectionInNotif.items[0].href, '/es/dashboard/#overview')

  const notifSection = sectionsInNotifications[1]
  assert.equal(notifSection.id, 'notifications')
  assert.equal(notifSection.title, 'Notificaciones')
  assert.equal(notifSection.isActive, true)
  assert.equal(notifSection.isExpanded, true)
  assert.equal(notifSection.items.length, 1)
  assert.equal(notifSection.items[0].id, 'unassigned')
  assert.equal(notifSection.items[0].href, '#unassigned')

  const settingsSectionInNotif = sectionsInNotifications[2]
  assert.equal(settingsSectionInNotif.isActive, false)
  assert.equal(settingsSectionInNotif.isExpanded, false)

  // Case 3: In Settings page (ES)
  const sectionsInSettings = getSidebarSections('/es/dashboard/settings/', 'es')
  assert.equal(sectionsInSettings.length, 3)

  const dashSectionInSettings = sectionsInSettings[0]
  assert.equal(dashSectionInSettings.isActive, false)
  assert.equal(dashSectionInSettings.isExpanded, false)

  const notifSectionInSettings = sectionsInSettings[1]
  assert.equal(notifSectionInSettings.isActive, false)
  assert.equal(notifSectionInSettings.isExpanded, false)
  assert.equal(notifSectionInSettings.items[0].href, '/es/dashboard/notifications/#unassigned')

  const settingsSection = sectionsInSettings[2]
  assert.equal(settingsSection.id, 'settings')
  assert.equal(settingsSection.title, 'Configuración')
  assert.equal(settingsSection.isActive, true)
  assert.equal(settingsSection.isExpanded, true)
  assert.equal(settingsSection.items.length, 3)
  assert.equal(settingsSection.items[0].id, 'audio')
  assert.equal(settingsSection.items[0].href, '#audio')
  assert.equal(settingsSection.items[1].id, 'sync')
  assert.equal(settingsSection.items[1].href, '#sync')
  assert.equal(settingsSection.items[2].id, 'data')
  assert.equal(settingsSection.items[2].href, '#data')
})

test('dashboardSidebar - handles corner cases like trailing slashes, hashes, query parameters', () => {
  assert.equal(isSettingsPath('/dashboard/settings?tab=audio'), true)
  assert.equal(isSettingsPath('/es/dashboard/settings/?filter=true'), true)
  assert.equal(isNotificationsPath('/dashboard/notifications?tab=all'), true)
  assert.equal(isNotificationsPath('/es/dashboard/notifications/?filter=true'), true)

  const sectionsWithoutSlash = getSidebarSections('/dashboard', 'en')
  assert.equal(sectionsWithoutSlash[0].isActive, true)
  assert.equal(sectionsWithoutSlash[0].isExpanded, true)
  assert.equal(sectionsWithoutSlash[1].isExpanded, false)
  assert.equal(sectionsWithoutSlash[2].isExpanded, false)

  const sectionsWithHash = getSidebarSections('/dashboard#game-progress', 'en')
  assert.equal(sectionsWithHash[0].isActive, true)
  assert.equal(sectionsWithHash[0].isExpanded, true)

  const sectionsInNotifHash = getSidebarSections('/dashboard/notifications#unassigned', 'en')
  assert.equal(sectionsInNotifHash[1].isActive, true)
  assert.equal(sectionsInNotifHash[1].isExpanded, true)
  assert.equal(sectionsInNotifHash[0].isActive, false)
})
