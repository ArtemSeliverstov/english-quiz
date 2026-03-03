const CACHE_NAME = 'english-quiz-v20260302-d29efb47';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './sw.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url)))));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.url.includes('firebaseio.com')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(resp => {
      if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      return resp;
    });
  }));
});