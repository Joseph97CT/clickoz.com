const MAX_XML_BYTES = 1600000;
const MAX_URLS = 900;
const MAX_CHILD_SITEMAPS = 10;
const MAX_CANDIDATES = 8;
const REQUEST_TIMEOUT_MS = 9000;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 60;
const ALLOWED_ORIGINS = new Set(["https://clickoz.com", "https://www.clickoz.com"]);
const rateBuckets = globalThis.__clickozSitemapViewerRateBuckets || new Map();
globalThis.__clickozSitemapViewerRateBuckets = rateBuckets;

function originAllowed(origin) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    const isLocal = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]");
    return isLocal && ["5500", "5501", "3000", "4173", "5173"].includes(url.port);
  } catch (_) {
    return false;
  }
}

function setHeaders(request, response) {
  const origin = String(request.headers.origin || "");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Vary", "Origin");
  if (originAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "content-type");
    response.setHeader("Access-Control-Max-Age", "600");
  }
}

function requestOriginAllowed(request) {
  const origin = String(request.headers.origin || "");
  if (origin) return originAllowed(origin);
  const referer = String(request.headers.referer || "");
  if (!referer) return true;
  try {
    return originAllowed(new URL(referer).origin);
  } catch (_) {
    return false;
  }
}

function clientKey(request) {
  const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || request.socket?.remoteAddress || "unknown";
}

function rateAllowed(request) {
  const now = Date.now();
  const key = clientKey(request);
  const bucket = rateBuckets.get(key) || [];
  const recent = bucket.filter((time) => now - time < RATE_WINDOW_MS);
  recent.push(now);
  rateBuckets.set(key, recent);
  return recent.length <= RATE_LIMIT;
}

function isPrivateHostname(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (/^\[?::1\]?$/.test(host)) return true;
  if (/^(0|10|127)\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const match172 = host.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function normalizeTarget(rawTarget) {
  const raw = String(rawTarget || "https://clickoz.com/sitemap.xml").trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported-protocol");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("unsupported-port");
  if (isPrivateHostname(url.hostname)) throw new Error("private-host-blocked");
  if (!url.pathname || url.pathname === "/") url.pathname = "/sitemap.xml";
  url.hash = "";
  return url;
}

function parseLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function parseRobotsSitemaps(text) {
  return [...String(text || "").matchAll(/^sitemap:\s*(\S+)/gim)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/xml,text/xml,text/plain;q=0.9,*/*;q=0.2",
        "user-agent": "Clickoz Site Map Pro (+https://clickoz.com/premium/sitemap-viewer/)"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`upstream-${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_XML_BYTES) throw new Error("sitemap-too-large");
    const text = await response.text();
    if (text.length > MAX_XML_BYTES) throw new Error("sitemap-too-large");
    return { text, finalUrl: response.url || url.toString() };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRobotsSitemaps(target) {
  const robots = new URL("/robots.txt", target.origin);
  try {
    const result = await fetchText(robots);
    return parseRobotsSitemaps(result.text)
      .map((item) => {
        try {
          return normalizeTarget(item).toString();
        } catch (_) {
          return "";
        }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter((item) => {
    try {
      const url = new URL(item);
      if (!["http:", "https:"].includes(url.protocol)) return false;
      url.hash = "";
      const key = url.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch (_) {
      return false;
    }
  }).slice(0, MAX_URLS);
}

function sitemapCandidates(target, robotsSitemaps = []) {
  const candidates = [target.toString()];
  const path = target.pathname.toLowerCase();
  if (!/sitemap|\.xml(?:\.gz)?$/i.test(path)) {
    candidates.push(new URL("/sitemap.xml", target.origin).toString());
  }
  candidates.push(
    ...robotsSitemaps,
    new URL("/sitemap_index.xml", target.origin).toString(),
    new URL("/sitemap-index.xml", target.origin).toString()
  );
  const seen = new Set();
  return candidates
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, MAX_CANDIDATES)
    .map((item) => new URL(item));
}

async function collectFromSitemap(candidate) {
  const primary = await fetchText(candidate);
  const locs = parseLocs(primary.text);
  const isIndex = /<sitemapindex[\s>]/i.test(primary.text);
  if (!locs.length) throw new Error("no-sitemap-locs");
  if (!isIndex) return { sitemapUrl: primary.finalUrl, urls: uniqueUrls(locs), childSitemaps: [] };

  const childSitemaps = uniqueUrls(locs).slice(0, MAX_CHILD_SITEMAPS);
  const pageUrls = [];
  for (const child of childSitemaps) {
    try {
      const childResult = await fetchText(new URL(child));
      pageUrls.push(...parseLocs(childResult.text));
      if (pageUrls.length >= MAX_URLS) break;
    } catch (_) {}
  }
  return { sitemapUrl: primary.finalUrl, urls: uniqueUrls(pageUrls.length ? pageUrls : locs), childSitemaps };
}

async function collectUrls(target) {
  const robotsSitemaps = await fetchRobotsSitemaps(target);
  const candidates = sitemapCandidates(target, robotsSitemaps);
  const errors = [];
  for (const candidate of candidates) {
    try {
      const result = await collectFromSitemap(candidate);
      return { ...result, candidateCount: candidates.length };
    } catch (error) {
      errors.push(error && error.message ? error.message : "sitemap-fetch-failed");
    }
  }
  const summary = errors.find((item) => item && item !== "no-sitemap-locs") || "no-sitemap-found";
  throw new Error(summary === "no-sitemap-locs" ? "no-sitemap-found" : summary);
}

function send(response, status, body) {
  response.statusCode = status;
  response.end(JSON.stringify(body));
}

module.exports = async function sitemapViewer(request, response) {
  setHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    send(response, 405, { ok: false, error: "method-not-allowed" });
    return;
  }

  if (!requestOriginAllowed(request)) {
    send(response, 403, { ok: false, error: "forbidden-origin" });
    return;
  }

  if (!rateAllowed(request)) {
    response.setHeader("Retry-After", "60");
    send(response, 429, { ok: false, error: "rate-limited" });
    return;
  }

  try {
    const requestUrl = new URL(request.url, "https://clickoz.com");
    const target = normalizeTarget(requestUrl.searchParams.get("target"));
    const result = await collectUrls(target);
    send(response, 200, {
      ok: true,
      target: target.origin,
      sitemapUrl: result.sitemapUrl,
      urls: result.urls,
      childSitemaps: result.childSitemaps,
      limited: result.urls.length >= MAX_URLS
    });
  } catch (error) {
    send(response, 400, { ok: false, error: error && error.message ? error.message : "sitemap-fetch-failed" });
  }
};
