const CACHE='quiz-v20260403-s81r4';
const URLS=['./','./index.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r&&r.status===200){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}return r}).catch(()=>caches.match(e.request)))});