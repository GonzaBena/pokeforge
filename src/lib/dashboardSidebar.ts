import {
  getTranslations,
  getLocalizedPath,
  type Locale,
} from './i18n/translations'

export interface SidebarSubItem {
  id: string
  href: string
  label: string
  icon: string
  isAnchor?: boolean
}

export interface SidebarSection {
  id: 'dashboard' | 'notifications' | 'settings'
  title: string
  icon: string
  href: string
  isActive: boolean
  isExpanded: boolean
  items: SidebarSubItem[]
}

export interface SidebarHeaderInfo {
  icon: string
  label: string
  title: string
}

/**
 * Determines whether a given pathname belongs to the Settings section.
 */
export function isSettingsPath(pathname: string, locale?: Locale): boolean {
  const cleanPath = pathname.split('?')[0].split('#')[0]
  if (locale === 'es') {
    return cleanPath.startsWith('/es/dashboard/settings')
  }
  return (
    cleanPath.startsWith('/dashboard/settings') ||
    cleanPath.startsWith('/es/dashboard/settings')
  )
}

/**
 * Determines whether a given pathname belongs to the Notifications section.
 */
export function isNotificationsPath(pathname: string, locale?: Locale): boolean {
  const cleanPath = pathname.split('?')[0].split('#')[0]
  if (locale === 'es') {
    return cleanPath.startsWith('/es/dashboard/notifications')
  }
  return (
    cleanPath.startsWith('/dashboard/notifications') ||
    cleanPath.startsWith('/es/dashboard/notifications')
  )
}

/**
 * Returns header badge icon, branding label and current section title.
 */
export function getSidebarHeader(
  pathname: string,
  locale: Locale = 'en'
): SidebarHeaderInfo {
  const isNotifications = isNotificationsPath(pathname, locale)
  const isSettings = isSettingsPath(pathname, locale)
  const t = getTranslations(locale)
  const settingsTitle = locale === 'es' ? 'Configuración' : 'Settings'
  const notificationsTitle = t.dashboard.notificationsTitle

  if (isNotifications) {
    return {
      icon: 'bell',
      label: 'PokeForge Hub',
      title: notificationsTitle,
    }
  }

  if (isSettings) {
    return {
      icon: 'settings',
      label: 'PokeForge Hub',
      title: settingsTitle,
    }
  }

  return {
    icon: 'layout-dashboard',
    label: 'PokeForge Hub',
    title: t.dashboard.title,
  }
}

/**
 * Returns the list of top-level sections for the dashboard sidebar (Dashboard, Notifications, Settings),
 * with the active section's index expanded and the remaining collapsed.
 */
export function getSidebarSections(
  pathname: string,
  locale: Locale = 'en'
): SidebarSection[] {
  const isNotifications = isNotificationsPath(pathname, locale)
  const isSettings = isSettingsPath(pathname, locale)
  const isDashboard = !isNotifications && !isSettings
  const t = getTranslations(locale)

  const dashboardBaseHref = getLocalizedPath('/dashboard/', locale)
  const notificationsHref = getLocalizedPath('/dashboard/notifications/', locale)
  const settingsHref = getLocalizedPath('/dashboard/settings/', locale)

  const settingsTitle = locale === 'es' ? 'Configuración' : 'Settings'
  const notificationsTitle = t.dashboard.notificationsTitle

  const dashboardItems: SidebarSubItem[] = [
    {
      id: 'overview',
      label: locale === 'es' ? 'Resumen General' : 'Overview',
      icon: 'bar-chart-2',
      href: isDashboard ? '#overview' : `${dashboardBaseHref}#overview`,
      isAnchor: true,
    },
    {
      id: 'active-team',
      label: t.dashboard.activeTeamTitle,
      icon: 'users',
      href: isDashboard ? '#active-team' : `${dashboardBaseHref}#active-team`,
      isAnchor: true,
    },
    {
      id: 'game-progress',
      label: t.dashboard.gameProgressTitle,
      icon: 'gamepad-2',
      href: isDashboard ? '#game-progress' : `${dashboardBaseHref}#game-progress`,
      isAnchor: true,
    },
  ]

  const notificationsItems: SidebarSubItem[] = [
    {
      id: 'unassigned',
      label: locale === 'es' ? 'Asignación de Versiones' : 'Version Assignment',
      icon: 'bell',
      href: isNotifications ? '#unassigned' : `${notificationsHref}#unassigned`,
      isAnchor: true,
    },
  ]

  const settingsItems: SidebarSubItem[] = [
    {
      id: 'audio',
      label: locale === 'es' ? 'Sonido y Audio' : 'Sound & Audio',
      icon: 'volume-2',
      href: isSettings ? '#audio' : `${settingsHref}#audio`,
      isAnchor: true,
    },
    {
      id: 'sync',
      label: t.dashboard.cloudSyncTitle,
      icon: 'cloud',
      href: isSettings ? '#sync' : `${settingsHref}#sync`,
      isAnchor: true,
    },
    {
      id: 'data',
      label: t.dashboard.dataManagementTitle,
      icon: 'database',
      href: isSettings ? '#data' : `${settingsHref}#data`,
      isAnchor: true,
    },
  ]

  return [
    {
      id: 'dashboard',
      title: t.dashboard.title,
      icon: 'layout-dashboard',
      href: dashboardBaseHref,
      isActive: isDashboard,
      isExpanded: isDashboard,
      items: dashboardItems,
    },
    {
      id: 'notifications',
      title: notificationsTitle,
      icon: 'bell',
      href: notificationsHref,
      isActive: isNotifications,
      isExpanded: isNotifications,
      items: notificationsItems,
    },
    {
      id: 'settings',
      title: settingsTitle,
      icon: 'settings',
      href: settingsHref,
      isActive: isSettings,
      isExpanded: isSettings,
      items: settingsItems,
    },
  ]
}
