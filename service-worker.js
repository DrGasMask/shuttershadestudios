const CACHE_NAME = "my-site-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js"
];

// Install event — cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event — serve from cache first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
