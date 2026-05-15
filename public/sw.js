/**
 * Service Worker for offline support and smart asset caching
 * Register in your main.tsx: navigator.serviceWorker?.register('/sw.js')
 */

const CACHE_NAME = 'app-v1';
const RUNTIME_CACHE = 'runtime-v1';
const API_CACHE = 'api-v1';

// Assets to cache on install (shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/version.json',
];

// Don't cache these URLs (always fetch fresh)
const NO_CACHE_URLS = [
  '/api/health',
  '/api/auth', // Auth always needs fresh check
];

// API endpoints that should be cached with network-first strategy
const CACHEABLE_API = [
  '/api/projects',
  '/api/tasks',
  '/api/contacts',
  '/api/lookups',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip health check - always fetch fresh
  if (NO_CACHE_URLS.some((pattern) => url.pathname.startsWith(pattern))) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML: Network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseForCache = response.clone();
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, responseForCache));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // API: Network first with cache fallback
  if (CACHEABLE_API.some((pattern) => url.pathname.includes(pattern))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseForCache = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseForCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // JS/CSS/Images: Cache first, fallback to network
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cached) => {
          if (cached) return cached;

          return fetch(request).then((response) => {
            if (response.ok) {
              const responseForCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseForCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Return offline fallback for images
          if (request.destination === 'image') {
            return caches.match('/placeholder.png') || new Response('Image unavailable');
          }
          throw new Error('Offline');
        })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAN_CACHE') {
    caches.delete(RUNTIME_CACHE);
    caches.delete(API_CACHE);
  }
});
