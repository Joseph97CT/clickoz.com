const BRAND = Object.freeze({
  name: "Clickoz",
  shortName: "Clickoz",
  tagline: "Free browser tools and practical guides for web work.",
  logoSvg: "/assets/clickoz-logo.svg",
  logoPng: "/assets/clickoz-logo-512.png",
  faviconSvg: "/assets/favicon.svg",
  favicon32: "/assets/favicon-32.png",
  appleTouchIcon: "/assets/apple-touch-icon.png",
  manifest: "/site.webmanifest",
  defaultOg: "/assets/og/default.svg",
  themeColor: "#101828"
});

const INDEX_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";

function normalizeRobots(value = INDEX_ROBOTS) {
  return value === "index,follow" ? INDEX_ROBOTS : value;
}

function iconLinks() {
  return `<link rel="icon" href="${BRAND.faviconSvg}" type="image/svg+xml" />
  <link rel="icon" href="${BRAND.favicon32}" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" sizes="180x180" href="${BRAND.appleTouchIcon}" />
  <link rel="manifest" href="${BRAND.manifest}" />`;
}

function logoMarkup() {
  return `<span class="logo-badge" id="logoBadge" aria-hidden="true">
          <img class="logo-mark logo-img" src="${BRAND.logoPng}" alt="" width="48" height="48" decoding="async" />
        </span>
        <span class="logo-text">Click<span class="logo-oz">oz</span></span>`;
}

function organizationNode(origin) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    "name": BRAND.name,
    "url": `${origin}/`,
    "logo": {
      "@type": "ImageObject",
      "url": `${origin}${BRAND.logoPng}`,
      "width": 512,
      "height": 512
    }
  };
}

function websiteNode(origin) {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    "name": BRAND.name,
    "alternateName": ["Clickoz Tools", "Clickoz Tool Network"],
    "url": `${origin}/`,
    "publisher": { "@id": `${origin}/#organization` },
    "inLanguage": "en",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${origin}/tools/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

function publisherNode(origin) {
  return {
    "@type": "Organization",
    "name": BRAND.name,
    "url": `${origin}/`,
    "logo": {
      "@type": "ImageObject",
      "url": `${origin}${BRAND.logoPng}`,
      "width": 512,
      "height": 512
    }
  };
}

module.exports = {
  BRAND,
  INDEX_ROBOTS,
  normalizeRobots,
  iconLinks,
  logoMarkup,
  organizationNode,
  websiteNode,
  publisherNode
};
