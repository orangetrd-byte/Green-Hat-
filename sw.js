const CACHE = 'green-hat-v17-reset-protection';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './update-helper.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const freshFirst = e.request.mode === 'navigate' || /\.(html|js|css|json)$/i.test(url.pathname);

  function cacheOnlyGood(storeResponse) {
    const good = storeResponse && (storeResponse.status === 200 || storeResponse.type === 'opaque');
    if (!good) return;
    const copy = storeResponse.clone();
    caches.open(CACHE).then(cache => cache.put(e.request, copy));
  }

  if (freshFirst) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          caches.open(CACHE).then(cache => cache.put(e.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(response => {
        cacheOnlyGood(response);
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
