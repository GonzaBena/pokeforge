// Loads Pokémon sprites (hosted on raw.githubusercontent.com) with retry-on-failure
// and a persistent Cache Storage layer, so a transient CDN hiccup doesn't permanently
// stick a Pokémon with the fallback icon for the session.
const SPRITE_CACHE_NAME = 'pokemon-sprites-v1'
export const SPRITE_FALLBACK = '/icons/pokemon-fallback.svg'

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 700

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function openSpriteCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(SPRITE_CACHE_NAME)
  } catch {
    return null
  }
}

async function readFromCache(url: string): Promise<string | null> {
  const cache = await openSpriteCache()
  if (!cache) return null
  try {
    const match = await cache.match(url)
    if (!match) return null
    return URL.createObjectURL(await match.blob())
  } catch {
    return null
  }
}

async function fetchWithRetry(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { mode: 'cors' })
      // Only a real, readable success is worth keeping — an opaque or error
      // response must never be cached, or the fallback would stick forever.
      if (res.ok) {
        const cache = await openSpriteCache()
        if (cache) {
          try {
            await cache.put(url, res.clone())
          } catch {
            // Cache Storage unavailable (private browsing, quota) — sprite still renders fine.
          }
        }
        return URL.createObjectURL(await res.blob())
      }
    } catch {
      // Network error/abort — fall through to retry below.
    }
    if (attempt < MAX_ATTEMPTS) {
      await wait(RETRY_DELAY_MS * attempt)
    }
  }
  return null
}

async function hydrateSprite(img: HTMLImageElement): Promise<void> {
  const url = img.dataset.spriteSrc
  if (!url) return
  delete img.dataset.spriteSrc

  const cached = await readFromCache(url)
  img.src = cached ?? (await fetchWithRetry(url)) ?? SPRITE_FALLBACK
}

function hydrateWithin(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>('img[data-sprite-src]').forEach((img) => {
    void hydrateSprite(img)
  })
}

let initialized = false

// Auto-hydrates every `<img data-sprite-src>` added anywhere in the page, present or future,
// so call sites only need to emit the attribute — no per-render wiring required.
export function initSpriteLoader(): void {
  if (initialized) return
  initialized = true

  hydrateWithin(document.body)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        if (node.matches('img[data-sprite-src]')) {
          void hydrateSprite(node as HTMLImageElement)
        }
        hydrateWithin(node)
      })
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
