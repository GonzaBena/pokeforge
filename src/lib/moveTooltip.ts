let tooltipEl: HTMLElement | null = null
let titleEl: HTMLElement | null = null
let descEl: HTMLElement | null = null
let arrowEl: HTMLElement | null = null
let activeTrigger: HTMLElement | null = null
let lastShownTime = 0
let isInitialized = false

export function shouldToggleTooltip(
  active: unknown,
  clicked: unknown,
  lastShown: number,
  now: number = Date.now(),
): boolean {
  if (active !== clicked) return true
  // If shown less than 400ms ago on the same trigger, keep it open (prevents touch pointerenter/focusin collision)
  if (now - lastShown < 400) return false
  return true
}

function ensureTooltipElements(): void {
  if (tooltipEl || typeof document === 'undefined') return

  tooltipEl = document.createElement('div')
  tooltipEl.className = 'move-floating-tooltip'
  tooltipEl.setAttribute('role', 'tooltip')
  tooltipEl.hidden = true

  titleEl = document.createElement('strong')
  titleEl.className = 'move-floating-tooltip__title'

  descEl = document.createElement('p')
  descEl.className = 'move-floating-tooltip__text'

  arrowEl = document.createElement('div')
  arrowEl.className = 'move-floating-tooltip__arrow'

  tooltipEl.appendChild(titleEl)
  tooltipEl.appendChild(descEl)
  tooltipEl.appendChild(arrowEl)
  document.body.appendChild(tooltipEl)
}

function positionTooltip(trigger: HTMLElement): void {
  if (!tooltipEl || !arrowEl) return
  const rect = trigger.getBoundingClientRect()
  const tooltipRect = tooltipEl.getBoundingClientRect()
  const tooltipWidth = tooltipRect.width || 250
  const tooltipHeight = tooltipRect.height || 60
  const gap = 8
  const viewportWidth = window.innerWidth

  let left = rect.left + rect.width / 2
  const minMargin = 12
  const halfWidth = tooltipWidth / 2
  let arrowOffset = 0

  if (left - halfWidth < minMargin) {
    const shift = minMargin - (left - halfWidth)
    left += shift
    arrowOffset = -shift
  } else if (left + halfWidth > viewportWidth - minMargin) {
    const shift = left + halfWidth - (viewportWidth - minMargin)
    left -= shift
    arrowOffset = shift
  }

  const bottom = window.innerHeight - rect.top + gap
  let isFlipped = false

  if (rect.top - tooltipHeight - gap < 8) {
    isFlipped = true
    tooltipEl.style.top = `${rect.bottom + gap}px`
    tooltipEl.style.bottom = 'auto'
  } else {
    tooltipEl.style.top = 'auto'
    tooltipEl.style.bottom = `${bottom}px`
  }

  tooltipEl.style.left = `${left}px`
  tooltipEl.classList.toggle('is-flipped', isFlipped)
  arrowEl.style.transform = `translateX(calc(-50% + ${arrowOffset}px))`
}

function showMoveTooltip(trigger: HTMLElement): void {
  ensureTooltipElements()
  if (!tooltipEl || !titleEl || !descEl) return

  const name = trigger.getAttribute('data-move-name') || ''
  const desc = trigger.getAttribute('data-move-desc') || trigger.getAttribute('title') || ''
  if (!desc) return

  activeTrigger = trigger
  lastShownTime = Date.now()
  titleEl.textContent = name
  descEl.textContent = desc
  titleEl.hidden = !name

  tooltipEl.hidden = false
  positionTooltip(trigger)
  tooltipEl.classList.add('is-visible')
}

export function hideMoveTooltip(): void {
  if (!tooltipEl) return
  tooltipEl.classList.remove('is-visible')
  activeTrigger = null
  lastShownTime = 0
  tooltipEl.hidden = true
}

export function initMoveTooltip(): void {
  if (typeof document === 'undefined' || isInitialized) return
  isInitialized = true
  ensureTooltipElements()

  // Handle true mouse hover via pointerenter/leave (ignoring simulated touch hover)
  document.addEventListener(
    'pointerenter',
    ((e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const target = e.target as HTMLElement
      const trigger = target?.closest<HTMLElement>('[data-move-tooltip-trigger]')
      if (trigger) {
        showMoveTooltip(trigger)
      }
    }) as EventListener,
    true,
  )

  document.addEventListener(
    'pointerleave',
    ((e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const target = e.target as HTMLElement
      const trigger = target?.closest<HTMLElement>('[data-move-tooltip-trigger]')
      if (trigger && activeTrigger === trigger) {
        hideMoveTooltip()
      }
    }) as EventListener,
    true,
  )

  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement
    const trigger = target?.closest<HTMLElement>('[data-move-tooltip-trigger]')
    if (trigger) {
      showMoveTooltip(trigger)
    }
  })

  document.addEventListener('focusout', (e) => {
    const target = e.target as HTMLElement
    const trigger = target?.closest<HTMLElement>('[data-move-tooltip-trigger]')
    if (trigger && activeTrigger === trigger) {
      hideMoveTooltip()
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTrigger) {
      hideMoveTooltip()
    }
  })

  window.addEventListener(
    'scroll',
    () => {
      if (activeTrigger) {
        hideMoveTooltip()
      }
    },
    { passive: true },
  )

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const trigger = target?.closest<HTMLElement>('[data-move-tooltip-trigger]')
    if (trigger) {
      if (!shouldToggleTooltip(activeTrigger, trigger, lastShownTime)) {
        return
      }
      if (activeTrigger === trigger) {
        hideMoveTooltip()
      } else {
        showMoveTooltip(trigger)
      }
    } else if (activeTrigger && !target.closest('.move-floating-tooltip')) {
      hideMoveTooltip()
    }
  })
}
