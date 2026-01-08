const CACHE_NAME = "mindmaze-v1";
const API_CACHE = "mindmaze-api-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // no pre-cache of built assets here — runtime caching will handle resources
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME && k !== API_CACHE) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName = API_CACHE) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET
  if (request.method !== "GET") return;

  // API requests to backend: network-first with cache fallback
  if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // navigation requests -> try network then cache
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  // images, css, js -> cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|css|js|html)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // default to network
  event.respondWith(fetch(request));
});
