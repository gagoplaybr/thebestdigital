const CACHE = 'the-best-pwa-v5';
const CORE = [
  '/', '/index.html', '/manifest.webmanifest',
  '/logo-the-best-digital.png', '/dashboard_powerbi_preview.png', '/video-poster.jpg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.url.endsWith('.mp4') || event.request.headers.has('range')) return;
  event.respondWith(fetch(event.request).then(response => { const clone=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request,clone)); return response; }).catch(() => caches.match(event.request).then(r => r || caches.match('/index.html'))));
});
