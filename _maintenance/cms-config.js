const ORIGIN = "https://clickoz.com";

/**
 * Central cache-busting versions for assets emitted by CMS generators and
 * checked by the production audit. Bump a key here, not inside templates.
 * @type {Readonly<Record<string, number>>}
 */
const ASSET_VERSIONS = Object.freeze({
  siteCss: 14,
  siteJs: 83,
  homeCss: 21,
  homeLeadershipCss: 12,
  homeJs: 25,
  guideCss: 4,
  guideJs: 3,
  guidePremiumCss: 5,
  guidePremiumJs: 6,
  clickozPremiumCss: 4,
  clickozPremiumJs: 14,
  cmsRegistry: 5,
  cmsSchema: 2,
  cmsEnhance: 8,
  cmsFinal: 158,
  toolsCss: 9,
  toolsJs: 15,
  cmsToolsCss: 22,
  cmsToolsJs: 28
});

/** @type {string} */
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.google.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://translate.googleapis.com https://translate.google.com https://cloudflare-dns.com; frame-src https://translate.google.com https://*.google.com; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; upgrade-insecure-requests";
const CSP_HEADER = `${CSP}; frame-ancestors 'self'`;
const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=()";

/** @type {ReadonlyArray<string>} */
const CORE_URLS = Object.freeze([
  "/",
  "/tools/",
  "/guides/",
  "/guides/seo/",
  "/guides/writing/",
  "/guides/dev/",
  "/guides/creator/",
  "/updates/",
  "/privacy/",
  "/terms/",
  "/contact/",
  "/legal/",
  "/about/"
]);

/** @type {ReadonlyArray<string>} */
const SMOKE_PATHS = Object.freeze([
  "/",
  "/tools/",
  "/tools/seo-tools/",
  "/tools/word-counter/",
  "/tools/json-formatter/",
  "/tools/youtube-title-generator/",
  "/guides/",
  "/guides/word-count-for-seo/",
  "/updates/",
  "/404/"
]);

/**
 * Return an asset URL with the configured cache-busting version.
 * @param {string} url Root-relative asset URL.
 * @param {keyof typeof ASSET_VERSIONS} versionKey Key in ASSET_VERSIONS.
 * @returns {string}
 */
function asset(url, versionKey) {
  const version = ASSET_VERSIONS[versionKey];
  if (version == null) throw new Error(`Unknown asset version key: ${versionKey}`);
  return `${url}?v=${version}`;
}

module.exports = {
  ORIGIN,
  ASSET_VERSIONS,
  CSP,
  CSP_HEADER,
  PERMISSIONS_POLICY,
  CORE_URLS,
  SMOKE_PATHS,
  asset
};
