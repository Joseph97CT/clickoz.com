/* Clickoz PWA service worker: fast repeat loads, visited-page offline support and safe updates. */
"use strict";

const VERSION = "2026-05-29.5";
const CACHE_PREFIX = "clickoz";
const PRECACHE = `${CACHE_PREFIX}-precache-${VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-${VERSION}`;
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${VERSION}`;
const VALID_CACHES = new Set([PRECACHE, STATIC_CACHE, PAGE_CACHE]);

const CORE_URLS = [
  "/",
  "/tools/",
  "/premium/",
  "/premium/dev-premium-tools/",
  "/premium/multi-device-tester/",
  "/premium/sitemap-viewer/",
  "/guides/",
  "/updates/",
  "/about/",
  "/contact/",
  "/site.webmanifest",
  "/assets/favicon.svg",
  "/assets/favicon-32.png",
  "/assets/apple-touch-icon.png",
  "/assets/clickoz-logo-512.png",
  "/assets/site.css?v=15",
  "/assets/home.css?v=21",
  "/assets/home-leadership.css?v=22",
  "/assets/clickoz-premium.css?v=5",
  "/assets/cms-final.css?v=214",
  "/assets/premium-tools.css?v=2",
  "/assets/cms-registry.js?v=7",
  "/assets/cms-schema.js?v=2",
  "/assets/cms-enhance.js?v=10",
  "/assets/site.js?v=112",
  "/assets/premium-tools.js?v=4",
  "/assets/clickoz-premium.js?v=15",
  "/assets/home.js?v=27",
  "/tools/tools.css?v=9",
  "/tools/tools.js?v=17"
];

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isCacheable(response) {
  return response && response.ok && (response.type === "basic" || response.type === "default");
}

function pageCacheKey(request) {
  const url = new URL(request.url);
  url.hash = "";
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

function shouldHandleStatic(url) {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname === "/site.webmanifest") return true;
  if (url.pathname.startsWith("/assets/")) return true;
  if (url.pathname.startsWith("/tools/") && /\.(?:css|js)$/i.test(url.pathname)) return true;
  return /\.(?:css|js|png|svg|webp|jpg|jpeg|gif|ico|json|txt|xml|webmanifest)$/i.test(url.pathname);
}

async function precacheCore() {
  const cache = await caches.open(PRECACHE);
  for (const url of CORE_URLS) {
    try {
      const request = new Request(new URL(url, self.location.origin).toString(), { cache: "reload" });
      const response = await fetch(request);
      if (isCacheable(response)) await cache.put(request, response.clone());
    } catch (_) {}
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fresh = fetch(request).then(async (response) => {
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
      trimCache(STATIC_CACHE, 160).catch(() => {});
    }
    return response;
  }).catch(() => null);
  if (cached) return cached;
  return await fresh || Response.error();
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  const key = pageCacheKey(request);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await cache.put(key, response.clone());
      trimCache(PAGE_CACHE, 48).catch(() => {});
    }
    return response;
  } catch (_) {
    const cached = await cache.match(key) || await caches.match(key) || await caches.match("/");
    return cached || offlineResponse();
  }
}

function offlineResponse() {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#101828">
  <title>Clickoz offline</title>
  <link rel="manifest" href="/site.webmanifest">
  <style>
    :root{color-scheme:dark;--bg:#090d16;--panel:#101827;--line:rgba(255,255,255,.16);--text:#f7f8ff;--muted:rgba(247,248,255,.68);--accent:#9b8cff}
    *{box-sizing:border-box}
    body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:radial-gradient(circle at 20% 10%,rgba(155,140,255,.24),transparent 34%),var(--bg);color:var(--text)}
    main{width:min(560px,100%);border:1px solid var(--line);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03)),var(--panel);padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.34)}
    .brand{display:flex;align-items:center;gap:12px;margin-bottom:18px}
    .mark{width:42px;height:42px;border-radius:8px;background:linear-gradient(135deg,#38e8ff,var(--accent));box-shadow:0 0 28px rgba(155,140,255,.35)}
    h1{margin:0 0 8px;font-size:clamp(28px,7vw,44px);line-height:1}
    p{margin:0;color:var(--muted);line-height:1.55}
    nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
    a{color:var(--text);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:rgba(255,255,255,.06);font-weight:700}
    a:first-child{border-color:rgba(155,140,255,.56);background:rgba(155,140,255,.16)}
  </style>
</head>
<body>
  <main>
    <div class="brand"><span class="mark" aria-hidden="true"></span><strong>Clickoz</strong></div>
    <h1>Offline mode</h1>
    <p>The app can reopen cached pages and tools you have already visited. Reconnect to load new Clickoz pages.</p>
    <nav aria-label="Cached app routes">
      <a href="/">Home</a>
      <a href="/tools/">Tools</a>
      <a href="/guides/">Guides</a>
      <a href="/updates/">Updates</a>
    </nav>
  </main>
</body>
</html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; manifest-src 'self'; object-src 'none'; base-uri 'self'"
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheCore());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(`${CACHE_PREFIX}-`) && !VALID_CACHES.has(name))
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: "CLICKOZ_SW_ACTIVE", version: VERSION }));
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLICKOZ_SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!sameOrigin(url) || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (shouldHandleStatic(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
