const CACHE_NAME = "smartstaircase-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/js/main.js",
  "/js/forms.js",
  "/js/settings.js",
  "/js/terminal.js",
  "/js/sw-toolbox.js",
  "/js/companion.js",
  "/styles/styles.css",
  "/styles/buttons.css",
  "/styles/forms.css",
  "/styles/inputs.css",
  "/styles/terminal.css",
  "/images/blue.jpg",
  "/images/green.jpg",
  "/images/yellow.jpg",
  "/images/red.jpg",
  "/images/modalCross.svg",
  "/sounds/click.mp3",
  "/sounds/creak.mp3"
];

// Установка: кэшируем основной набор
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// При запросе: сначала из кэша, если нет — сеть
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// При обновлении Service Worker: очищаем старый кэш
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});