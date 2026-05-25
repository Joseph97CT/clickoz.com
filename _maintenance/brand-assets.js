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
          <svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
            <path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8s5.4 13.8 12.6 13.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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
