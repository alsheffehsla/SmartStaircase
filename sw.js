const CACHE_NAME = "smartstaircase-cache-v1";
const urlsToCache = [
  "/SmartStaircase/",
  "/SmartStaircase/index.html",
  "/SmartStaircase/js/main.js",
  "/SmartStaircase/js/forms.js",
  "/SmartStaircase/js/settings.js",
  "/SmartStaircase/js/terminal.js",
  "/SmartStaircase/styles/styles.css",
  "/SmartStaircase/styles/buttons.css",
  "/SmartStaircase/styles/forms.css",
  "/SmartStaircase/styles/inputs.css",
  "/SmartStaircase/styles/terminal.css",
  "/SmartStaircase/images/blue.jpg",
  "/SmartStaircase/images/green.jpg",
  "/SmartStaircase/images/yellow.jpg",
  "/SmartStaircase/images/red.jpg",
  "/SmartStaircase/images/modalCross.svg",
  "/SmartStaircase/sounds/click.mp3",
  "/SmartStaircase/sounds/creak.mp3"
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