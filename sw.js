// ConcreteLab Service Worker
// Bump CACHE_NAME every time you edit index.html (or anything else here)
// so returning users get the new version instead of a stale cached copy.
const CACHE_NAME = 'concretelab-cache-v7';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for the app shell, with a background revalidation,
// falling back to network for anything else (and to the cached index.html
// if the user is offline and navigating).
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests from the same origin
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));

      // Serve cached copy immediately if we have one, update cache in background;
      // otherwise wait for the network.
      return cached || networkFetch;
    })
  );
});
