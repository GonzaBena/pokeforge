const STATIC_CACHE = 'pokeforge-static-v5'
const DATA_CACHE = 'pokeforge-data-v1'
const SPRITES_CACHE = 'pokeforge-sprites-v1'

const CURRENT_CACHES = [STATIC_CACHE, DATA_CACHE, SPRITES_CACHE]

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pokedex/index.html',
  '/team/index.html',
  '/es/equipo/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/icons/pokemon-fallback.svg',
]

const CORE_DATA_ASSETS = [
  '/data/pokedex/index.json',
  '/data/pokedex/chunk-0.json',
  '/data/pokedex/chunk-1.json',
  '/data/pokedex/chunk-2.json',
  '/data/pokedex/chunk-3.json',
  '/data/pokedex/chunk-4.json',
  '/data/pokedex/chunk-5.json',
  '/data/pokedex/chunk-6.json',
  '/data/pokedex/chunk-7.json',
  '/data/pokedex/chunk-8.json',
  '/data/pokedex/chunk-9.json',
  '/data/pokedex/chunk-10.json',
  '/data/pokedex/game-pokedex.json',
  '/data/moves/details.json',
  '/data/types/type-chart.json',
  '/data/generations/generations.json',
  '/data/natures/index.json',
]

const OFFLINE_SPRITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="pokeball-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="16" fill="transparent"/>
  <circle cx="60" cy="60" r="46" fill="url(#pokeball-bg)" stroke="#334155" stroke-width="2"/>
  <path d="M 16 60 A 44 44 0 0 1 104 60 Z" fill="#ef4444" opacity="0.45"/>
  <path d="M 16 60 A 44 44 0 0 0 104 60 Z" fill="#f8fafc" opacity="0.35"/>
  <line x1="16" y1="60" x2="104" y2="60" stroke="#1e293b" stroke-width="4"/>
  <circle cx="60" cy="60" r="14" fill="#0f172a" stroke="#1e293b" stroke-width="4"/>
  <circle cx="60" cy="60" r="6" fill="#94a3b8"/>
</svg>`

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)))
      }),
      caches.open(DATA_CACHE).then((cache) => {
        return Promise.allSettled(CORE_DATA_ASSETS.map((asset) => cache.add(asset)))
      }),
    ]).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!CURRENT_CACHES.includes(key)) {
              return caches.delete(key)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip cross-origin requests unless image/audio/pokeapi
  if (
    url.origin !== location.origin &&
    !url.hostname.includes('pokeapi.co') &&
    !url.hostname.includes('raw.githubusercontent.com')
  ) {
    return
  }

  // Skip Vite HMR / dev server internal requests and optimize dep hashes
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('v')
  ) {
    return
  }

  // Skip API requests so sync and dynamic data are never served stale from SW cache
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // 1. Static Data (/data/*.json): Cache-first with stale-while-revalidate fallback
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request)

        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      }),
    )
    return
  }

  // 2. Navigation requests (HTML pages): Network-First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE)
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          if (url.pathname.includes('/pokedex')) {
            return (await caches.match('/pokedex/index.html')) || (await caches.match('/'))
          }
          if (url.pathname.includes('/equipo')) {
            return (await caches.match('/equipo/index.html')) || (await caches.match('/'))
          }
          return (await caches.match('/index.html')) || (await caches.match('/'))
        }),
    )
    return
  }

  // 3. PokeAPI & Raw GitHub Sprites: Cache-First with synthetic SVG fallback on offline failure
  const isSpriteRequest =
    url.hostname.includes('raw.githubusercontent.com') || url.hostname.includes('pokeapi.co')

  if (isSpriteRequest) {
    event.respondWith(
      caches.open(SPRITES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }

        try {
          // Fetched in explicit CORS mode (both hosts send Access-Control-Allow-Origin: *)
          // so failures come back as readable 4xx/5xx instead of an opaque response that
          // would otherwise report ok/fail identically and let an error get cached forever.
          const networkResponse = await fetch(event.request.url, { mode: 'cors' })
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        } catch {
          // Offline and not in cache: serve the synthetic SVG fallback
          return new Response(OFFLINE_SPRITE_SVG, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-store',
            },
          })
        }
      }),
    )
    return
  }

  // 4. Other static resources (CSS, JS, local icons): Cache-First
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        })
        .catch(() => cachedResponse)
    }),
  )
})
