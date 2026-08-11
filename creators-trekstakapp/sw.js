/* TrekStak Creators — lightweight offline shell */
var CACHE = "trekstak-creators-v1";
var SHELL = [
  "/",
  "/index.html",
  "/404.html",
  "/styles.css",
  "/webapp-shell.css",
  "/webapp-shell.js",
  "/app.js",
  "/creator-public-store.js",
  "/firebase-config.js",
  "/finallogo.png",
  "/apple-badge-black.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL).catch(function () {
        /* ignore missing assets during install */
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.indexOf("/data/") === 0) {
    event.respondWith(fetch(req).catch(function () {
      return caches.match(req);
    }));
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(req, copy);
        });
        return res;
      });
    })
  );
});
