const MAX_HTML_BYTES = 1200000;
const REQUEST_TIMEOUT_MS = 9000;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 45;
const ALLOWED_ORIGINS = new Set(["https://clickoz.com", "https://www.clickoz.com"]);
const rateBuckets = globalThis.__clickozPagePreviewRateBuckets || new Map();
globalThis.__clickozPagePreviewRateBuckets = rateBuckets;

function setHeaders(request, response) {
  const origin = String(request.headers.origin || "");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Vary", "Origin");
  if (ALLOWED_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "content-type");
    response.setHeader("Access-Control-Max-Age", "600");
  }
}

function requestOriginAllowed(request) {
  const origin = String(request.headers.origin || "");
  if (origin) return ALLOWED_ORIGINS.has(origin);
  const referer = String(request.headers.referer || "");
  if (!referer) return true;
  try {
    return ALLOWED_ORIGINS.has(new URL(referer).origin);
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
  const raw = String(rawTarget || "https://clickoz.com/").trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported-protocol");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("unsupported-port");
  if (isPrivateHostname(url.hostname)) throw new Error("private-host-blocked");
  url.hash = "";
  return url;
}

async function fetchHtml(target) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target.toString(), {
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
        "user-agent": "Clickoz Multi Device Tester (+https://clickoz.com/premium/multi-device-tester/)"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`upstream-${response.status}`);
    const type = String(response.headers.get("content-type") || "");
    if (type && !/html|text\/plain|xml/i.test(type)) throw new Error("not-html");
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_HTML_BYTES) throw new Error("page-too-large");
    const html = await response.text();
    if (html.length > MAX_HTML_BYTES) throw new Error("page-too-large");
    return { html, finalUrl: response.url || target.toString() };
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeHtml(source, finalUrl) {
  const base = `<base href="${String(finalUrl).replace(/"/g, "&quot;")}">`;
  let html = String(source || "")
    .replace(/<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");

  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  return `<!doctype html><html><head>${base}<meta charset="utf-8"></head><body>${html}</body></html>`;
}

function send(response, status, body) {
  response.statusCode = status;
  response.end(JSON.stringify(body));
}

module.exports = async function pagePreview(request, response) {
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
    const result = await fetchHtml(target);
    send(response, 200, {
      ok: true,
      target: target.origin,
      finalUrl: result.finalUrl,
      html: sanitizeHtml(result.html, result.finalUrl)
    });
  } catch (error) {
    send(response, 400, { ok: false, error: error && error.message ? error.message : "preview-fetch-failed" });
  }
};
