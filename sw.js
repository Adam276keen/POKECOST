const CACHE_NAME = 'pokecost-cache-v1';

// On install, the service worker will take control immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// On activate, clean up old caches and claim the clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, use a caching strategy.
self.addEventListener('fetch', (event) => {
  // Only cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first approach.
  // This ensures the user gets the latest HTML shell.
  if (event.request.mode === 'navigate') {
      event.respondWith(
          fetch(event.request).catch(() => {
            // If network fails, try to serve the main app page from cache.
            return caches.match('/index.html');
          })
      );
      return;
  }

  // For all other requests (assets, API calls), use stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If we get a valid response, clone it and put it in the cache.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response if available, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
