// Updated cache name to force refresh if needed
const CACHE_NAME = 'game-v3';

// Make sure these paths match the files you want to cache
const urlsToCache = [
  'index.html',
  'game.js',
  'manifest.json',
  'assets/player.png',
  'assets/enemy.png',
  'assets/platform.png',
  'assets/bike.png',
  'assets/key.png',
  'assets/door.png',
  'assets/doc.png', // doc.png is your "boss" sprite
  'assets/icons/icon-72.png',
  'assets/icons/icon-152.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
