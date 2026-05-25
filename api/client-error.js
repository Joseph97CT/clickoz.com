const MAX_BODY_BYTES = 8192;
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 45;
const ALLOWED_ORIGINS = new Set(["https://clickoz.com", "https://www.clickoz.com"]);
const ALLOWED_TYPES = new Set([
  "client-error",
  "client-rejection",
  "slow-load",
  "long-task",
  "bot-honeypot",
  "bot-submit-burst",
  "interaction-burst",
  "interaction-blocked",
  "manual"
]);
const rateBuckets = globalThis.__clickozClientErrorRateBuckets || new Map();
globalThis.__clickozClientErrorRateBuckets = rateBuckets;

function setCommonHeaders(request, response) {
  const origin = String(request.headers.origin || "");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.setHeader("Vary", "Origin");
  if (ALLOWED_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload-too-large"));
        request.destroy();
        return;
      }
      body += chunk.toString("utf8");
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function clean(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safePath(value) {
  const path = clean(value || "/", 160);
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.replace(/[?#].*$/, "") || "/";
}

function safeNumber(value, max = 100000) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, max);
}

function safeSource(value) {
  return clean(value, 180).replace(/[?#].*$/, "");
}

function normalizeEvent(raw) {
  const detail = raw && typeof raw.detail === "object" ? raw.detail : {};
  const type = clean(raw?.type, 48);
  return {
    type: ALLOWED_TYPES.has(type) ? type : "manual",
    path: safePath(raw?.path || "/"),
    lang: clean(raw?.lang || "en", 16),
    viewport: clean(raw?.viewport || "", 32),
    ts: clean(raw?.ts || new Date().toISOString(), 40),
    detail: {
      message: clean(detail.message, 260),
      name: clean(detail.name, 80),
      source: safeSource(detail.source),
      line: safeNumber(detail.line, 100000),
      column: safeNumber(detail.column, 100000),
      duration: safeNumber(detail.duration, 600000),
      count: safeNumber(detail.count, 10000)
    }
  };
}

module.exports = async function clientError(request, response) {
  setCommonHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    response.statusCode = 405;
    response.setHeader("Allow", "POST, OPTIONS");
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Method not allowed");
    return;
  }

  if (!requestOriginAllowed(request)) {
    response.statusCode = 403;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Forbidden");
    return;
  }

  if (!rateAllowed(request)) {
    response.statusCode = 429;
    response.setHeader("Retry-After", "60");
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Too many events");
    return;
  }

  const contentType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (contentType && contentType !== "application/json" && contentType !== "text/plain") {
    response.statusCode = 415;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Unsupported media type");
    return;
  }

  try {
    const body = await readBody(request);
    const parsed = JSON.parse(body || "{}");
    const event = normalizeEvent(parsed);
    console.error("clickoz-client-event", JSON.stringify(event));
    response.statusCode = 204;
    response.end();
  } catch (error) {
    response.statusCode = error && error.message === "payload-too-large" ? 413 : 400;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Invalid event");
  }
};
