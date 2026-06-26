// CrisisHub — Service Worker (offline + caché para conexiones lentas/2G).
// Estrategia segura: nunca cachea peticiones que no sean GET ni datos dinámicos.
//  - Imágenes (fotos vía /_next/image) y tiles del mapa: cache-first (gran ahorro en 2G).
//  - Estáticos hasheados de Next (/_next/static): cache-first.
//  - Navegaciones: network-first con página /offline como respaldo.
const VERSION = "v1";
const STATIC_CACHE = `static-${VERSION}`;
const IMAGE_CACHE = `img-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((c) => c.add(OFFLINE_URL))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isImage(url) {
  return (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/_next/static/media") ||
    (url.hostname.endsWith("supabase.co") && url.pathname.includes("/storage/")) ||
    url.hostname.endsWith("tile.openstreetmap.org")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  if (isImage(url)) {
    event.respondWith(cacheFirst(req, IMAGE_CACHE, 250));
    return;
  }

  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static")
  ) {
    event.respondWith(cacheFirst(req, STATIC_CACHE, 0));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
  }
});

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && (res.status === 200 || res.type === "opaque")) {
      cache.put(req, res.clone());
      if (maxEntries) trim(cache, maxEntries);
    }
    return res;
  } catch {
    return cached ?? Response.error();
  }
}

async function trim(cache, max) {
  const keys = await cache.keys();
  const excess = keys.length - max;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
}
