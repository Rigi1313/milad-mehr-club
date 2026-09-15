/* باشگاه میلاد مهر — Production PWA Service Worker */
const VERSION = "2026.09.15.3";
const CACHE = `milad-mehr-${VERSION}`;

const STATIC = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html"
];

const CDN_HOSTS = new Set([
  "cdnjs.cloudflare.com",
  "cdn.jsdelivr.net"
]);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith("milad-mehr-") && k !== CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function networkThenCache(request, cacheKey = request) {
  const response = await fetch(request);

  if (response && (response.ok || response.type === "opaque")) {
    const cache = await caches.open(CACHE);
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    url.origin === self.location.origin &&
    request.mode === "navigate"
  ) {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put("./index.html", response.clone());
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./offline.html"))
        )
    );

    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        const refresh = networkThenCache(request).catch(() => null);

        return cached || refresh.then(r => r || caches.match("./offline.html"));
      })
    );

    return;
  }

  if (CDN_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.match(request).then(
        cached =>
          cached ||
          networkThenCache(request).catch(() => Response.error())
      )
    );
  }
});
