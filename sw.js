const CACHE_NAME = 'benson-pro-v2';
const urlsToCache = [
  './dashboard.html',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
  'https://unpkg.com/@phosphor-icons/web',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+TC:wght@300;400;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // We use catch to avoid failing the whole install if one of the CDNs is unreachable during install
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.error('Failed to cache', url, error);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Let the browser handle google sheets api directly, don't cache data requests so it's always fresh
  if (event.request.url.includes('docs.google.com')) {
    return;
  }

  // Network First Strategy: Always try to get the newest file from the internet
  // This prevents the PWA from getting stuck on an old version of dashboard.html
  event.respondWith(
    fetch(event.request).then(response => {
      // If successful, save a copy in the cache for offline fallback
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(() => {
      // If offline, fallback to the cached version
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
