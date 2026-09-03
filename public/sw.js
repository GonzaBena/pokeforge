const CACHE_NAME = 'pokeforge-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pokedex/index.html',
  '/equipo/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests unless image/audio/pokeapi
  if (url.origin !== location.origin && !url.hostname.includes('pokeapi.co') && !url.hostname.includes('raw.githubusercontent.com')) {
    return;
  }

  // Skip Vite HMR / dev server internal requests and optimize dep hashes
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  // Skip API requests so sync and dynamic data are never served stale from SW cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Stale-While-Revalidate for static data (/data/*.json)
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Navigation requests (HTML pages) with Stale-While-Revalidate
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(async () => {
            if (cached) return cached;
            if (url.pathname.includes('/pokedex')) {
              return (await caches.match('/pokedex/index.html')) || (await caches.match('/'));
            }
            if (url.pathname.includes('/equipo')) {
              return (await caches.match('/equipo/index.html')) || (await caches.match('/'));
            }
            return (await caches.match('/index.html')) || (await caches.match('/'));
          });

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cache First for static resources (CSS, JS, Images, Sounds)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse) return;
            const isBasic = networkResponse.status === 200 && networkResponse.type === 'basic';
            const isAllowedCrossOrigin =
              (url.hostname.includes('pokeapi.co') || url.hostname.includes('raw.githubusercontent.com')) &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque' || networkResponse.type === 'cors');

            if (isBasic || isAllowedCrossOrigin) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse) return networkResponse;

        const isBasic = networkResponse.status === 200 && networkResponse.type === 'basic';
        const isAllowedCrossOrigin =
          (url.hostname.includes('pokeapi.co') || url.hostname.includes('raw.githubusercontent.com')) &&
          (networkResponse.status === 200 || networkResponse.type === 'opaque' || networkResponse.type === 'cors');

        if (isBasic || isAllowedCrossOrigin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
