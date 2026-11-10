// Lamp service worker
// - App shell is cached at install, so the app opens offline.
// - Translation files in /data are cached the first time they're opened,
//   so any version you've read once keeps working offline.
// - Licensed translations from API.Bible always go to the network and are never stored.
const SHELL = 'lamp-shell-v2';
const DATA = 'lamp-data-v1';
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './data/versions.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.endsWith('api.bible')) return;

  // The manifest changes when you add versions: try network first, fall back to cache.
  if (url.pathname.endsWith('/data/versions.json')) {
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request)));
    return;
  }

  // Translation files are large and never change for a given version: cache first.
  if (url.pathname.includes('/data/')) {
    e.respondWith(caches.open(DATA).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }

  // Everything else (app shell, fonts): cache first, then network.
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && (url.origin === location.origin || url.hostname.includes('gstatic') || url.hostname.includes('googleapis'))) {
      const copy = res.clone(); caches.open(SHELL).then(c => c.put(e.request, copy));
    }
    return res;
  })));
});
