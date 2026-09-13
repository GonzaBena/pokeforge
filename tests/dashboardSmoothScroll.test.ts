import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { isReducedMotion, smoothScrollTo, setupSmoothScroll } from '../src/lib/smoothScroll'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('dashboard layout - html element has dashboard marker for /dashboard and children', () => {
  const layoutPath = path.join(projectRoot, 'src/layouts/DashboardLayout.astro')
  const layoutContent = fs.readFileSync(layoutPath, 'utf8')

  // DashboardLayout must mark html tag with class so CSS applies to /dashboard and all child routes
  assert.match(
    layoutContent,
    /<html[^>]*class="[^"]*dashboard-html[^"]*"/,
    'DashboardLayout.astro must include dashboard-html class on the <html> element'
  )
})

test('dashboard css - smooth scroll is enabled for dashboard html and scrollable children with accessibility check', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  // Verify prefers-reduced-motion wraps smooth scroll
  assert.match(
    cssContent,
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[^}]*scroll-behavior:\s*smooth;?[^}]*\}/s,
    'dashboard.css must apply scroll-behavior: smooth inside prefers-reduced-motion: no-preference'
  )

  // Must target html.dashboard-html or html:has(.dashboard-body)
  assert.match(
    cssContent,
    /html\.dashboard-html[^{]*,[^{]*html:has\(\.dashboard-body\)|html:has\(\.dashboard-body\)[^{]*,[^{]*html\.dashboard-html/,
    'dashboard.css must target both html.dashboard-html and html:has(.dashboard-body) for smooth scroll'
  )

  // Must configure scroll-behavior: smooth on .dashboard-sidebar
  assert.match(
    cssContent,
    /\.dashboard-sidebar\s*\{[^}]*scroll-behavior:\s*smooth;?[^}]*\}/s,
    'dashboard.css must apply scroll-behavior: smooth on .dashboard-sidebar'
  )
})

test('smoothScroll - isReducedMotion detects media query preference correctly', () => {
  const originalMatchMedia = globalThis.matchMedia

  try {
    globalThis.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    assert.equal(isReducedMotion(), true)

    globalThis.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    assert.equal(isReducedMotion(), false)
  } finally {
    globalThis.matchMedia = originalMatchMedia
  }
})

test('smoothScroll - smoothScrollTo scrolls element into view with motion awareness', () => {
  let scrolledBehavior: ScrollBehavior | undefined
  let scrolledBlock: ScrollLogicalPosition | undefined

  const fakeElement = {
    scrollIntoView: (options?: ScrollIntoViewOptions) => {
      scrolledBehavior = options?.behavior
      scrolledBlock = options?.block
    },
  } as unknown as HTMLElement

  const originalMatchMedia = globalThis.matchMedia
  try {
    globalThis.matchMedia = (() => ({
      matches: false,
    })) as unknown as typeof window.matchMedia

    const result = smoothScrollTo(fakeElement)
    assert.equal(result, true)
    assert.equal(scrolledBehavior, 'smooth')
    assert.equal(scrolledBlock, 'start')

    // When motion IS reduced, behavior should degrade to 'auto'
    globalThis.matchMedia = (() => ({
      matches: true,
    })) as unknown as typeof window.matchMedia

    smoothScrollTo(fakeElement)
    assert.equal(scrolledBehavior, 'auto')
  } finally {
    globalThis.matchMedia = originalMatchMedia
  }
})

test('smoothScroll - setupSmoothScroll binds anchor clicks and ignores external/empty links', () => {
  const listeners: Record<string, ((e: any) => void)[]> = {}
  let pushStateUrl: string | undefined

  const targetElement: {
    scrollIntoView: (options?: ScrollIntoViewOptions) => void
    lastBehavior?: string
  } = {
    scrollIntoView: (options?: ScrollIntoViewOptions) => {
      targetElement.lastBehavior = options?.behavior
    },
    lastBehavior: '',
  }

  const validAnchor = {
    tagName: 'A',
    getAttribute: (name: string) => (name === 'href' ? '#game-progress' : null),
    addEventListener: (event: string, fn: (e: any) => void) => {
      listeners[event] = listeners[event] || []
      listeners[event].push(fn)
    },
    removeEventListener: () => {},
  }

  const externalAnchor = {
    tagName: 'A',
    getAttribute: (name: string) => (name === 'href' ? '/pokedex/' : null),
    addEventListener: (event: string, fn: (e: any) => void) => {
      listeners['external_' + event] = listeners['external_' + event] || []
      listeners['external_' + event].push(fn)
    },
    removeEventListener: () => {},
  }

  const fakeRoot = {
    querySelectorAll: (selector: string) => {
      if (selector.includes('a[href^="#"]')) {
        return [validAnchor]
      }
      return [validAnchor, externalAnchor]
    },
    querySelector: (selector: string) => {
      if (selector === '#game-progress') return targetElement
      return null
    },
  } as unknown as ParentNode

  const originalHistory = globalThis.history
  const originalDocument = globalThis.document
  const originalMatchMedia = globalThis.matchMedia

  try {
    globalThis.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
    globalThis.history = {
      pushState: (_state: any, _title: string, url?: string | URL | null) => {
        pushStateUrl = String(url)
      },
    } as unknown as History
    globalThis.document = fakeRoot as unknown as Document

    const cleanup = setupSmoothScroll(fakeRoot)

    assert.ok(listeners['click'] && listeners['click'].length > 0)

    let defaultPrevented = false
    const fakeEvent = {
      preventDefault: () => {
        defaultPrevented = true
      },
    }

    listeners['click'][0](fakeEvent)

    assert.equal(defaultPrevented, true)
    assert.equal(targetElement.lastBehavior, 'smooth')
    assert.equal(pushStateUrl, '#game-progress')

    cleanup()
  } finally {
    globalThis.history = originalHistory
    globalThis.document = originalDocument
    globalThis.matchMedia = originalMatchMedia
  }
})

test('dashboard css - section target highlight pulse and keyframes are defined', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  assert.match(
    cssContent,
    /@keyframes dashboard-target-pulse\s*\{/,
    'dashboard.css must define @keyframes dashboard-target-pulse'
  )
  assert.match(
    cssContent,
    /\.is-target-highlight|:target/,
    'dashboard.css must style :target and .is-target-highlight'
  )
})

test('dashboard css - view transitions for dashboard layout elements are defined', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  assert.match(
    cssContent,
    /view-transition-name:\s*dashboard-sidebar/,
    'dashboard.css must set view-transition-name: dashboard-sidebar'
  )
  assert.match(
    cssContent,
    /view-transition-name:\s*dashboard-main-content/,
    'dashboard.css must set view-transition-name: dashboard-main-content'
  )
})

test('dashboard css - sidebar subnav accordion uses smooth grid-template-rows transition', () => {
  const cssPath = path.join(projectRoot, 'src/styles/features/dashboard/dashboard.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  assert.match(
    cssContent,
    /grid-template-rows:\s*0fr/,
    'dashboard.css must define collapsed state with grid-template-rows: 0fr'
  )
  assert.match(
    cssContent,
    /grid-template-rows:\s*1fr/,
    'dashboard.css must define expanded state with grid-template-rows: 1fr'
  )
})

test('smoothScroll - smoothScrollTo highlights target element with is-target-highlight class', () => {
  const classListAdded: string[] = []
  const fakeElement = {
    scrollIntoView: () => {},
    classList: {
      add: (cls: string) => classListAdded.push(cls),
      remove: () => {},
    },
  } as unknown as HTMLElement

  smoothScrollTo(fakeElement, { highlight: true })
  assert.ok(classListAdded.includes('is-target-highlight'))
})

