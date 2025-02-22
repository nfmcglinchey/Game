self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('game-v1').then((cache) => {
      return cache.addAll([
        'index.html',
        'game.js',
        'manifest.json',
        'assets/player.png',
        'assets/enemy.png',
        'assets/platform.png',
        'assets/bike.png',
        'assets/key.png',
        'assets/door.png',
        'assets/boss.png',
        'assets/icons/icon-192.png',
        'assets/icons/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
