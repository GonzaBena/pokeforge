/**
 * Smooth scroll utility module.
 * Provides accessible, motion-aware scrolling for anchor links and programmatic navigation.
 */

function getGlobalWindow(): Window | null {
  if (typeof window !== 'undefined') return window
  if (typeof globalThis !== 'undefined') return globalThis as unknown as Window
  return null
}

/**
 * Checks if the user has requested reduced motion via OS/browser settings.
 */
export function isReducedMotion(): boolean {
  const win = getGlobalWindow()
  if (!win || typeof win.matchMedia !== 'function') {
    return false
  }
  return win.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface SmoothScrollOptions {
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
  inline?: ScrollLogicalPosition
  highlight?: boolean
}

/**
 * Scrolls to an element or selector smoothly, respecting the user's motion preference.
 */
export function smoothScrollTo(
  target: Element | string | null,
  options?: SmoothScrollOptions
): boolean {
  if (!target) return false

  let element: Element | null = null
  if (typeof target === 'string') {
    const doc = typeof document !== 'undefined' ? document : (getGlobalWindow() as unknown as Document)
    if (!doc || typeof doc.querySelector !== 'function') return false
    try {
      element = doc.querySelector(target)
    } catch {
      return false
    }
  } else {
    element = target
  }

  if (!element || typeof element.scrollIntoView !== 'function') {
    return false
  }

  const shouldReduceMotion = isReducedMotion()
  const behavior: ScrollBehavior =
    options?.behavior ?? (shouldReduceMotion ? 'auto' : 'smooth')
  const block: ScrollLogicalPosition = options?.block ?? 'start'
  const inline: ScrollLogicalPosition = options?.inline ?? 'nearest'

  element.scrollIntoView({
    behavior,
    block,
    inline,
  })

  // Flash highlight effect if requested (or default true when scrolling smoothly)
  const shouldHighlight = options?.highlight ?? true
  if (shouldHighlight && !shouldReduceMotion && element.classList) {
    element.classList.remove('is-target-highlight')
    // Trigger reflow if possible to restart animation
    if ('offsetWidth' in element) {
      void (element as HTMLElement).offsetWidth
    }
    element.classList.add('is-target-highlight')
    setTimeout(() => {
      element?.classList.remove('is-target-highlight')
    }, 1500)
  }

  return true
}

export interface SetupSmoothScrollOptions {
  onScroll?: (targetHref: string, targetEl: Element) => void
}

/**
 * Attaches smooth scroll behavior to all in-page hash links (a[href^="#"])
 * within the given root element or document.
 * Returns a cleanup function to remove attached listeners.
 */
export function setupSmoothScroll(
  root: ParentNode = typeof document !== 'undefined' ? document : ({} as ParentNode),
  options?: SetupSmoothScrollOptions
): () => void {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return () => {}
  }

  const links = root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
  const handlers: Array<{ el: HTMLAnchorElement; fn: (e: Event) => void }> = []

  links.forEach((link) => {
    const fn = (e: Event) => {
      const href = link.getAttribute('href')
      if (!href || href === '#' || !href.startsWith('#')) return

      const targetId = href.slice(1)
      if (!targetId) return

      const doc = typeof document !== 'undefined' ? document : (root as Document)
      let targetEl: Element | null = null
      try {
        targetEl = doc.querySelector(href) || doc.getElementById(targetId)
      } catch {
        // Selector might be invalid ID characters, fallback to getElementById
        targetEl = doc.getElementById(targetId)
      }

      if (targetEl) {
        e.preventDefault()
        smoothScrollTo(targetEl)

        const win = getGlobalWindow()
        if (win && win.history?.pushState) {
          win.history.pushState(null, '', href)
        }

        if (options?.onScroll) {
          options.onScroll(href, targetEl)
        }
      }
    }

    link.addEventListener('click', fn)
    handlers.push({ el: link, fn })
  })

  return () => {
    handlers.forEach(({ el, fn }) => {
      el.removeEventListener('click', fn)
    })
  }
}
