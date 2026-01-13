const CACHE_NAME = 'scanner-v1';
const ASSETS = [
  './',
  './index.html',
  'https://unpkg.com/html5-qrcode',
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
];

// Instalar y guardar archivos en memoria local
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Responder desde la memoria local sin buscar en internet
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});