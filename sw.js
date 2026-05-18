const CACHE_NAME = "smartstaircase-cache-v1";
const urlsToCache = [
  "/smartstaircase_group/smartstaircase/",
  "/smartstaircase_group/smartstaircase/index.html",
  "/smartstaircase_group/smartstaircase/js/main.js",
  "/smartstaircase_group/smartstaircase/js/forms.js",
  "/smartstaircase_group/smartstaircase/js/settings.js",
  "/smartstaircase_group/smartstaircase/js/terminal.js",
  "/smartstaircase_group/smartstaircase/styles/styles.css",
  "/smartstaircase_group/smartstaircase/styles/buttons.css",
  "/smartstaircase_group/smartstaircase/styles/forms.css",
  "/smartstaircase_group/smartstaircase/styles/inputs.css",
  "/smartstaircase_group/smartstaircase/styles/terminal.css",
  "/smartstaircase_group/smartstaircase/images/blue.jpg",
  "/smartstaircase_group/smartstaircase/images/green.jpg",
  "/smartstaircase_group/smartstaircase/images/yellow.jpg",
  "/smartstaircase_group/smartstaircase/images/red.jpg",
  "/smartstaircase_group/smartstaircase/images/modalCross.svg",
  "/smartstaircase_group/smartstaircase/sounds/click.mp3",
  "/smartstaircase_group/smartstaircase/sounds/creak.mp3"
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