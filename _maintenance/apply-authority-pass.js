const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ORIGIN = "https://clickoz.com";
const V = {
  site: 47,
  cmsFinal: 53,
  cmsSchema: 2,
  cmsEnhance: 7,
  clickozPremium: 6
};

function loadCMS() {
  const code = fs.readFileSync(path.join(root, "assets", "cms-registry.js"), "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.ClickozCMS;
}

const cms = loadCMS();

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function abs(url) {
  return ORIGIN + (url || "/");
}

function writeUrl(url, html) {
  const dir = path.join(root, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function securityMeta(extraConnect = "") {
  const connect = extraConnect ? ` ${extraConnect}` : "";
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://translate.googleapis.com https://translate.google.com${connect}; frame-src https://translate.google.com https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; upgrade-insecure-requests" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=()" />`;
}

function earlyThemeScript() {
  return `<script>
  (function(){
    try{
      var saved = JSON.parse(localStorage.getItem("clickoz_accent") || "null");
      var a1 = saved && saved.a1 ? saved.a1 : "#22d3ee";
      var a2 = saved && saved.a2 ? saved.a2 : "#06b6d4";
      var h = String(a1).replace("#", "");
      var rgb = "34,211,238";
      if(h.length === 3) rgb = [h[0]+h[0], h[1]+h[1], h[2]+h[2]].map(function(x){ return parseInt(x,16); }).join(",");
      if(h.length === 6) rgb = [h.slice(0,2), h.slice(2,4), h.slice(4,6)].map(function(x){ return parseInt(x,16); }).join(",");
      document.documentElement.style.setProperty("--accent", a1);
      document.documentElement.style.setProperty("--accent2", a2);
      document.documentElement.style.setProperty("--accent-rgb", rgb);
      document.documentElement.style.setProperty("--cz-accent", a1);
      document.documentElement.style.setProperty("--cz-accent2", a2);
      document.documentElement.style.setProperty("--cz-accent-rgb", rgb);
    }catch(e){}
  })();
</script>`;
}

function ensureEarlyTheme(html) {
  if (html.includes("clickoz_accent")) return html;
  const script = earlyThemeScript();
  const cssMarker = /(<link rel="stylesheet" href="\/assets\/site\.css[^"]*" \/>)/;
  const preconnectMarker = /(<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>)/;
  if (preconnectMarker.test(html)) return html.replace(preconnectMarker, `${script}\n  $1`);
  if (cssMarker.test(html)) return html.replace(cssMarker, `${script}\n  $1`);
  return html.replace("</head>", `  ${script}\n</head>`);
}

function head({ title, description, canonical, og = "/assets/og/default.svg", jsonLd = "", extraCss = "", extraConnect = "", robots = "index,follow" }) {
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${securityMeta(extraConnect)}
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${abs(canonical)}" />
  <meta name="robots" content="${esc(robots)}" />
  <meta name="theme-color" content="#0b0f19" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${abs(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${abs(og)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${abs(og)}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  ${earlyThemeScript()}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/site.css?v=13" />
  ${extraCss}
  <link rel="stylesheet" href="/assets/clickoz-premium.css?v=4" />
  <link rel="stylesheet" href="/assets/cms-final.css?v=${V.cmsFinal}" />
  ${jsonLd}
</head>`;
}

function nav(active) {
  const current = (key) => active === key ? ` class="active" aria-current="page"` : "";
  return `<nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home">
        <span class="logo-badge" id="logoBadge" aria-hidden="true">
          <svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
            <path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="logo-text">Click<span class="logo-oz">oz</span></span>
      </a>
      <div class="nav-links" aria-label="Sections">
        <a${current("home")} href="/">Home</a>
        <a${current("tools")} href="/tools/">Tools</a>
        <a${current("guides")} href="/guides/">Guides</a>
        <a${current("updates")} href="/updates/">Updates</a>
      </div>
      <div class="spacer"></div>
    </div>
  </nav>`;
}

function mobileShell(active) {
  const current = (key) => active === key ? " active" : "";
  return `<div class="m-overlay" id="mOverlay" hidden></div>
  <aside class="m-menu" id="mobileMenu" aria-hidden="true">
    <div class="m-head"><div class="m-title">Menu</div><button class="m-close" id="mClose" type="button" aria-label="Close menu">x</button></div>
    <div class="m-links">
      <a class="m-link${current("home")}" href="/">Home</a>
      <a class="m-link${current("tools")}" href="/tools/">Tools</a>
      <a class="m-link${current("guides")}" href="/guides/">Guides</a>
      <a class="m-link${current("updates")}" href="/updates/">Updates</a>
      <a class="m-link" href="/about/">About</a>
      <a class="m-link" href="/privacy/">Privacy</a>
    </div>
  </aside>`;
}

function footer() {
  return `<footer class="footer">
    <div class="container footer-grid">
      <div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div>
      <div><h4>Workflow hubs</h4><div class="footer-links"><a href="/workflows/">Workflows</a><a href="/tools/seo-tools/">SEO Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/guides/creator/">Creator Guides</a></div></div>
      <div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/youtube-title-generator/">YouTube Titles</a></div></div>
      <div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/404/">404</a></div></div>
    </div>
    <div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">&copy; 2026 Clickoz &middot; Fast browser tools for SEO, writing, developers and creators</div></div>
  </footer>`;
}

function scripts(extra = "") {
  return `<script src="/assets/cms-registry.js?v=4" defer></script>
  <script src="/assets/cms-schema.js?v=${V.cmsSchema}" defer></script>
  <script src="/assets/cms-enhance.js?v=${V.cmsEnhance}" defer></script>
  <script src="/assets/site.js?v=${V.site}" defer></script>
  <script src="/assets/clickoz-premium.js?v=${V.clickozPremium}" defer></script>
  ${extra}`;
}

function page({ active, bodyClass = "bigtext", title, description, canonical, og, jsonLd, extraCss, main, extraScripts = "", extraConnect = "", robots = "index,follow" }) {
  return `<!doctype html>
<html lang="en">
${head({ title, description, canonical, og, jsonLd, extraCss, extraConnect, robots })}
<body class="${bodyClass}">
  <div id="clickozParticles" aria-hidden="true"></div>
  <div class="__grain" aria-hidden="true"></div>
  ${nav(active)}
  ${mobileShell(active)}
  ${main}
  ${footer()}
  ${scripts(extraScripts)}
</body>
</html>
`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": abs(item.url)
    }))
  };
}

function collectionSchema({ name, url, description, items }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": name,
    "url": abs(url),
    "description": description,
    "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
    "mainEntity": {
      "@type": "ItemList",
      "name": name,
      "numberOfItems": items.length,
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.title || item.name,
        "url": abs(item.url)
      }))
    }
  };
}

function toolCard(tool) {
  const mark = ({ seo: "SEO", writing: "TXT", dev: "DEV", web: "WEB", tracking: "UTM", youtube: "YT", socialai: "SOC" })[tool.category] || "GO";
  return `<a class="authority-card tool-card-enhanced" href="${tool.url}">
    <div class="authority-card-head"><span aria-hidden="true">${mark}</span><h3>${esc(tool.title)}</h3></div>
    <p>${esc(tool.description)}</p>
    <div class="tool-mini-features">${(tool.features || []).slice(0, 3).map((f) => `<span><b>${esc(mark)}</b>${esc(f)}</span>`).join("")}</div>
  </a>`;
}

function guideCard(guide) {
  const mark = ({ seo: "SEO", writing: "TXT", dev: "DEV", tracking: "UTM", youtube: "YT", creator: "CR" })[guide.category] || "GUIDE";
  const tool = cms.toolBySlug[guide.tool];
  return `<a class="guide-hub-card" href="${guide.url}">
    <div class="authority-card-head"><span aria-hidden="true">${mark}</span><h3>${esc(guide.title)}</h3></div>
    <p>${esc(guide.description)}</p>
    <div class="guide-card-meta"><span>${esc(tool ? tool.title : "Related tool")}</span><span>Problem first</span><span>Checklist</span></div>
  </a>`;
}

function homePage() {
  const title = "Clickoz - Browser Tools for SEO, Creators, Writing and Developers";
  const description = "Clickoz is a browser-first toolbox for people who build online: SEO utilities, creator tools, writing checks and developer helpers with practical guides and no uploads.";
  const featured = ["meta-tags", "word-counter", "youtube-title-generator", "json-formatter", "tiktok-hook-generator", "http-ping"].map((s) => cms.toolBySlug[s]).filter(Boolean);
  const schema = jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": ORIGIN + "/#organization", "name": "Clickoz", "url": ORIGIN + "/", "logo": ORIGIN + "/assets/favicon.svg" },
      { "@type": "WebSite", "@id": ORIGIN + "/#website", "name": "Clickoz", "url": ORIGIN + "/", "publisher": { "@id": ORIGIN + "/#organization" }, "potentialAction": { "@type": "SearchAction", "target": ORIGIN + "/tools/?q={search_term_string}", "query-input": "required name=search_term_string" } },
      { "@type": "SoftwareApplication", "name": "Clickoz", "url": ORIGIN + "/", "applicationCategory": "WebApplication", "operatingSystem": "All", "isAccessibleForFree": true, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "featureList": ["SEO tools", "Creator tools", "Writing utilities", "Developer utilities", "Browser-first privacy"] }
    ]
  });

  const main = `<main>
    <header class="home-dashboard home-friendly container" aria-label="Clickoz intro">
      <section class="friendly-hero-copy">
        <h1>Fast browser tools for people who build online.</h1>
        <p class="dash-lead">Pick the problem, run the right tool, read the matching guide, then move to the next action. Clickoz is built for SEO work, creator packaging, cleaner writing and lightweight debugging.</p>
        <div class="friendly-goal-grid" aria-label="Start by goal">
          <a class="goal-card goal-seo" href="/tools/seo-tools/"><b>Rank a page</b><span>Meta tags, snippets, slugs, keywords and internal links.</span></a>
          <a class="goal-card goal-write" href="/tools/writing-tools/"><b>Clean up text</b><span>Word count, readability, structure and copy-ready cleanup.</span></a>
          <a class="goal-card goal-creator" href="/tools/youtube-tools/"><b>Grow a channel</b><span>Titles, thumbnails, descriptions, hashtags and tracking links.</span></a>
          <a class="goal-card goal-dev" href="/tools/developer-tools/"><b>Fix data fast</b><span>JSON, URL encoding, Base64, HTML entities, DNS and ping checks.</span></a>
        </div>
        <div class="dash-actions"><a class="btn btn-accent" href="/tools/">Browse all tools</a><a class="btn btn-outline" href="/guides/">Read guides</a><button class="btn btn-outline" id="surpriseWorkflow" type="button" aria-controls="surpriseCard" aria-expanded="false">Pick for me</button></div>
        <div class="surprise-card friendly-preview-card surprise-card-result" id="surpriseCard" hidden></div>
      </section>

      <aside class="friendly-start-panel friendly-start-panel-lean" aria-label="Recommended Clickoz route">
        <div class="friendly-preview-card friendly-preview-card-main">
          <small>Most useful path today</small>
          <b>Creator upload package</b>
          <p>Generate a title, brief the thumbnail, write the description and track clicks from one connected workflow.</p>
          <a href="/tools/youtube-title-generator/">Start this path</a>
        </div>
        <div class="friendly-task-list">
          <a href="/tools/word-counter/"><span>Writing</span><b>Check length and reading time</b></a>
          <a href="/tools/keyword-density/"><span>SEO</span><b>Check keyword focus</b></a>
          <a href="/tools/utm-builder/"><span>Track</span><b>Build a campaign link</b></a>
          <a href="/tools/base64/"><span>Dev</span><b>Encode or decode Base64</b></a>
        </div>
        <div class="friendly-metrics" aria-label="CMS counters">
          <span><b data-cms-count="tools">${cms.tools.length}</b> tools</span>
          <span><b data-cms-count="guides">${cms.guides.length}</b> guides</span>
          <span><b>0</b> uploads</span>
        </div>
      </aside>
    </header>

    <section class="section container friendly-tools-section" aria-label="Daily tool picks">
      <div class="friendly-section-intro">
        <div><h2>Tools that match real daily jobs.</h2><p class="section-sub">Refresh the set when you want a different route through the CMS without scrolling a long directory.</p></div>
      </div>
      <div class="picks-grid" id="picksGrid">
        <a class="pick-card" href="/tools/meta-tags/"><div class="pick-head"><span class="pick-icon">SEO</span><h3 class="pick-title">Meta Tag Optimizer</h3></div><p class="pick-desc">Preview titles and descriptions before publishing a search result.</p><div class="pick-meta"><span class="pick-cat">SEO Tools</span><span class="pick-cta">Open</span></div></a>
        <a class="pick-card" href="/tools/youtube-title-generator/"><div class="pick-head"><span class="pick-icon">YT</span><h3 class="pick-title">YouTube Title Generator</h3></div><p class="pick-desc">Turn a video idea into stronger title angles with cleaner intent.</p><div class="pick-meta"><span class="pick-cat">Creator Tools</span><span class="pick-cta">Open</span></div></a>
        <a class="pick-card" href="/tools/json-formatter/"><div class="pick-head"><span class="pick-icon">{ }</span><h3 class="pick-title">JSON Formatter</h3></div><p class="pick-desc">Format, validate and clean payloads without a heavy dev console.</p><div class="pick-meta"><span class="pick-cat">Developer Tools</span><span class="pick-cta">Open</span></div></a>
      </div>
      <div class="picks-actions picks-actions-bottom"><button class="btn btn-outline rec-refresh" id="recRefresh" type="button">Refresh picks</button></div>
    </section>

    <section class="section container authority-picker" aria-label="Choose a task">
      <div class="authority-head"><p class="guide-kicker pulse-kicker">START FROM THE PROBLEM</p><h2 class="type-on-view">Pick the job. The site routes the workflow.</h2><p>Every path has a first tool, a guide, and a useful next action. That is the difference between a generic tool list and a product people can reuse.</p></div>
      <div class="authority-grid">
        <a class="authority-card" href="/tools/meta-tags/"><div class="authority-card-head"><span>SEO</span><h3>Publish a page</h3></div><p>Preview the snippet, check title length, scan readability and connect the page to a guide before publishing.</p></a>
        <a class="authority-card" href="/tools/youtube-title-generator/"><div class="authority-card-head"><span>YT</span><h3>Package an upload</h3></div><p>Build title angles, thumbnail text, description structure, hashtags and tracking links from one creator workflow.</p></a>
        <a class="authority-card" href="/tools/readability-analyzer/"><div class="authority-card-head"><span>TXT</span><h3>Improve a draft</h3></div><p>Count, simplify and structure copy so mobile readers understand the point quickly.</p></a>
        <a class="authority-card" href="/tools/json-formatter/"><div class="authority-card-head"><span>DEV</span><h3>Fix broken data</h3></div><p>Format JSON, encode URL values, decode Base64 and escape HTML without heavy developer tools.</p></a>
      </div>
    </section>

    <section class="section container authority-split" aria-label="Clickoz focus">
      <div class="authority-panel">
        <p class="guide-kicker">WHY IT DOES NOT FEEL RANDOM</p>
        <h2>Three authority lanes first. Everything else supports them.</h2>
        <p>Clickoz is built around search growth, creator packaging and readable web work. Developer tools exist because broken links, encoded payloads and messy JSON are part of the same publishing workflow.</p>
      </div>
      <div class="pillar-grid">
        <a href="/guides/seo/"><strong>SEO utilities</strong><span>Snippets, slugs, keywords, internal links and content checklists.</span></a>
        <a href="/guides/creator/"><strong>Creator optimization</strong><span>YouTube titles, thumbnail text, descriptions, hashtags and tracking.</span></a>
        <a href="/guides/writing/"><strong>Readable content</strong><span>Word count, readability, structure, cleanup and briefs.</span></a>
        <a href="/guides/dev/"><strong>Fast debug layer</strong><span>JSON, Base64, URL encoding, HTML entities and technical checks.</span></a>
      </div>
    </section>

    <section class="section container" aria-label="Featured tools">
      <div class="authority-head"><p class="guide-kicker pulse-kicker">HIGH-INTENT TOOLS</p><h2 class="type-on-view">Useful pages people search for every day.</h2><p>These are not filler utilities. They solve frequent jobs for SEO, creators, writers and builders.</p></div>
      <div class="authority-grid authority-grid-3">${featured.map(toolCard).join("")}</div>
    </section>
  </main>`;
  return page({ active: "home", title, description, canonical: "/", jsonLd: schema, extraCss: '<link rel="stylesheet" href="/assets/home.css?v=15" />', main, extraScripts: '<script src="/assets/home.js?v=16" defer></script>' });
}

const guideHubs = {
  "/guides/seo/": {
    key: "seo",
    title: "SEO Guides - Search Workflows, Snippets and Internal Links | Clickoz",
    h1: "SEO guides that connect the tool to the decision.",
    desc: "Guides for search intent, snippets, keyword balance, slugs, internal links, UTM tracking and publishing checks.",
    categories: ["seo", "tracking"],
    toolHref: "/tools/seo-tools/",
    focus: ["Check the intent first", "Use the tool on a real page", "Add internal links before publishing"]
  },
  "/guides/writing/": {
    key: "writing",
    title: "Writing Guides - Readability, Word Count and Cleanup | Clickoz",
    h1: "Writing guides for clearer drafts and faster edits.",
    desc: "Guides for readability, word count, content briefs, cleanup workflows and mobile-friendly writing.",
    categories: ["writing"],
    toolHref: "/tools/writing-tools/",
    focus: ["Make the point obvious", "Reduce hard sentences", "Keep structure scannable"]
  },
  "/guides/dev/": {
    key: "dev",
    title: "Developer Guides - JSON, URL Encoding, Base64 and HTML Entities | Clickoz",
    h1: "Developer guides for broken data, links and payloads.",
    desc: "Guides for JSON formatting, URL encoding, Base64, tokens, HTML entities and practical debugging.",
    categories: ["dev"],
    toolHref: "/tools/developer-tools/",
    focus: ["Inspect before changing", "Decode or escape in the right context", "Copy the cleaned result"]
  },
  "/guides/creator/": {
    key: "creator",
    title: "Creator Guides - YouTube, Shorts, Descriptions and Tracking | Clickoz",
    h1: "Creator guides for uploads that are easier to package.",
    desc: "Guides for YouTube titles, thumbnails, descriptions, hashtags, community posts, content calendars and tracking links.",
    categories: ["youtube", "creator", "tracking"],
    toolHref: "/tools/youtube-tools/",
    focus: ["Start with the promise", "Package title and thumbnail together", "Track links cleanly"]
  }
};

function guideHubPage(url, hub) {
  const guides = cms.guides.filter((guide) => hub.categories.includes(guide.category));
  const schema = [
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Guides", url: "/guides/" }, { name: hub.h1.replace(/\.$/, ""), url }]),
    collectionSchema({ name: hub.h1.replace(/\.$/, ""), url, description: hub.desc, items: guides })
  ].map(jsonLd).join("\n  ");
  const main = `<main class="section container guide-hub-shell">
    <header class="guide-hub-hero">
      <div>
        <p class="guide-kicker">${hub.key.toUpperCase()} GUIDE HUB</p>
        <h1>${esc(hub.h1)}</h1>
        <p>${esc(hub.desc)}</p>
        <div class="dash-actions"><a class="btn btn-accent" href="${hub.toolHref}">Open matching tools</a><a class="btn btn-outline" href="/guides/">All guides</a></div>
      </div>
      <aside class="guide-hub-checklist">
        ${hub.focus.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(item)}</strong><p>Do this before moving to the next page so the workflow stays practical.</p></article>`).join("")}
      </aside>
    </header>
    <section class="authority-head"><p class="guide-kicker">GUIDES IN THIS HUB</p><h2>Start with the article that matches the problem.</h2><p>Each guide links back into a working Clickoz tool, related guides and a concrete checklist.</p></section>
    <section class="guide-hub-grid">${guides.map(guideCard).join("")}</section>
  </main>`;
  return page({
    active: "guides",
    bodyClass: "bigtext guide-hub-page",
    title: hub.title,
    description: hub.desc,
    canonical: url,
    og: "/assets/og/guides.svg",
    jsonLd: schema,
    main
  });
}

function guidesIndexPage() {
  const sections = [
    { title: "SEO Guides", url: "/guides/seo/", cats: ["seo", "tracking"], mark: "SEO", desc: "Search intent, snippets, internal links and publishing decisions." },
    { title: "Writing Guides", url: "/guides/writing/", cats: ["writing"], mark: "TXT", desc: "Readable drafts, content briefs, cleanup and word count decisions." },
    { title: "Developer Guides", url: "/guides/dev/", cats: ["dev"], mark: "DEV", desc: "JSON, URL encoding, Base64, HTML entities and debugging context." },
    { title: "Creator Guides", url: "/guides/creator/", cats: ["youtube", "creator"], mark: "YT", desc: "YouTube packaging, descriptions, community posts and creator planning." }
  ];
  const schema = [
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Guides", url: "/guides/" }]),
    collectionSchema({ name: "Clickoz Guides", url: "/guides/", description: "Problem-first Clickoz guides connected to browser tools, examples, checklists and internal workflows.", items: cms.guides })
  ].map(jsonLd).join("\n  ");
  const main = `<main class="section container guide-hub-shell">
    <header class="guide-hub-hero guides-library-hero">
      <div>
        <p class="guide-kicker">CLICKOZ GUIDE LIBRARY</p>
        <h1>Guides that make the tools useful on the first visit.</h1>
        <p>Each guide starts with the problem, links the matching tool and ends with the next action. No isolated AI text, no empty checklist.</p>
        <div class="dash-actions"><a class="btn btn-accent" href="/tools/">Open tools</a><a class="btn btn-outline" href="/guides/seo/">Start with SEO</a><a class="btn btn-outline" href="/guides/creator/">Creator hub</a></div>
      </div>
      <aside class="guide-hub-checklist">
        <article><span>01</span><strong>Find the problem</strong><p>Search by workflow, not by random article title.</p></article>
        <article><span>02</span><strong>Run the tool</strong><p>Use real input and keep the result copy-ready.</p></article>
        <article><span>03</span><strong>Move to the next page</strong><p>Every article connects into another useful Clickoz action.</p></article>
      </aside>
    </header>
    <section class="guide-hub-grid guide-hub-overview">${sections.map((section) => `<a class="guide-hub-card guide-hub-entry" href="${section.url}"><div class="authority-card-head"><span>${section.mark}</span><h2>${section.title}</h2></div><p>${section.desc}</p><div class="guide-card-meta"><span>${cms.guides.filter((g) => section.cats.includes(g.category)).length} guides</span><span>Tool-linked</span><span>Checklist</span></div></a>`).join("")}</section>
    ${sections.map((section) => {
      const guides = cms.guides.filter((guide) => section.cats.includes(guide.category));
      return `<section class="guide-category-band" id="${section.mark.toLowerCase()}"><div class="authority-head"><p class="guide-kicker">${section.title}</p><h2>${section.desc}</h2><p><a href="${section.url}">Open the full ${section.title.toLowerCase()} hub</a></p></div><div class="guide-hub-grid">${guides.map(guideCard).join("")}</div></section>`;
    }).join("")}
  </main>`;
  return page({
    active: "guides",
    bodyClass: "bigtext guides-page guide-hub-page",
    title: "Clickoz Guides - SEO, Writing, Developer and Creator Workflows",
    description: "Problem-first Clickoz guides connected to browser tools, examples, checklists and internal workflows for SEO, writing, development and creators.",
    canonical: "/guides/",
    og: "/assets/og/guides.svg",
    jsonLd: schema,
    main
  });
}

function aboutPage() {
  const schema = [
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: "About", url: "/about/" }]),
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Clickoz",
      "url": abs("/about/"),
      "description": "Clickoz is a browser-first toolbox for SEO, creators, writing and developer workflows.",
      "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
      "about": {
        "@type": "Organization",
        "name": "Clickoz",
        "url": ORIGIN + "/",
        "logo": ORIGIN + "/assets/favicon.svg"
      }
    }
  ].map(jsonLd).join("\n  ");
  const main = `<main class="section container about-shell">
    <header class="about-hero">
      <p class="guide-kicker">ABOUT CLICKOZ</p>
      <h1>A browser-first toolbox for serious online work.</h1>
      <p>Clickoz exists for people who publish, optimize, debug and create online. The product is deliberately small in friction: open a tool, test real input, read the matching guide, copy the improved result.</p>
    </header>
    <section class="authority-grid">
      <article class="authority-card"><div class="authority-card-head"><span>01</span><h2>Privacy by default</h2></div><p>Text tools are designed to run in the browser. The site avoids account walls, unnecessary uploads and bloated dashboards.</p></article>
      <article class="authority-card"><div class="authority-card-head"><span>02</span><h2>Workflow over novelty</h2></div><p>A tool is only useful if the next step is obvious. Clickoz connects tools, guides and internal links so users do not restart every task.</p></article>
      <article class="authority-card"><div class="authority-card-head"><span>03</span><h2>Search authority</h2></div><p>The site focuses on SEO utilities, creator optimization, readable content and lightweight technical debugging. That gives Google a clear topical map.</p></article>
    </section>
    <section class="authority-split">
      <div class="authority-panel"><p class="guide-kicker">QUALITY STANDARD</p><h2>What a Clickoz page must do.</h2><p>Every important page should explain the problem, provide a working utility or guide, include examples, link related pages, expose useful schema and stay fast on mobile.</p></div>
      <div class="pillar-grid">
        <a href="/tools/"><strong>Tools</strong><span>Live inputs, examples, useful outputs and copy actions.</span></a>
        <a href="/guides/"><strong>Guides</strong><span>Problem, method, alternatives, checklist and linked tools.</span></a>
        <a href="/updates/"><strong>Updates</strong><span>Public release notes for design, SEO, performance and content fixes.</span></a>
        <a href="/contact/"><strong>Feedback</strong><span>Broken pages and weak tools become product priorities.</span></a>
      </div>
    </section>
  </main>`;
  return page({
    active: "home",
    bodyClass: "bigtext about-page",
    title: "About Clickoz - Browser Tools for SEO, Creators and Developers",
    description: "Learn why Clickoz exists: browser-first SEO, creator, writing and developer tools connected to practical guides, no-upload workflows and clean internal structure.",
    canonical: "/about/",
    jsonLd: schema,
    main
  });
}

function updatesPage() {
  const releases = [
    ["v3.6", "Authority foundation pass", "May 2026", "Brand, About, guide hubs, schema and mobile-safe structure now support Clickoz as a product instead of a generic tool list.", ["Brand identity", "Guide hubs", "Schema", "Mobile stability"]],
    ["v3.5", "Tool CMS standardization", "May 2026", "Tool pages share examples, first-use cards, related guides, related tools, SEO support and copy actions.", ["Tools", "Examples", "Internal links", "SEO"]],
    ["v3.4", "Premium visual polish", "May 2026", "Buttons, hover states, footer, cards, nav, theme colors and tool layout received a full visual correction pass.", ["Design", "UI", "Theme", "CMS"]],
    ["v3.3", "Creator workflow lane", "May 2026", "YouTube and social creator tools were expanded for titles, thumbnails, descriptions, hashtags, replies, hooks and tracking.", ["Creator", "YouTube", "Social", "Tracking"]],
    ["v3.0", "Tools and guides rewrite", "January 2026", "The site moved into a shared tool and guide architecture with cleaner routing, schemas and mobile-first pages.", ["Architecture", "Guides", "Tools", "Performance"]]
  ];
  const schema = [
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Updates", url: "/updates/" }]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Clickoz Updates",
      "url": abs("/updates/"),
      "description": "Product changelog for Clickoz tool improvements, guide rewrites, SEO structure and CMS improvements.",
      "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
      "mainEntity": {
        "@type": "ItemList",
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "itemListElement": releases.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "SoftwareRelease",
            "name": item[1],
            "softwareVersion": item[0].replace(/^v/, ""),
            "releaseNotes": item[3]
          }
        }))
      }
    }
  ].map(jsonLd).join("\n  ");
  const main = `<main class="section container updates-shell updates-canvas">
    <header class="updates-hero updates-hero-v2">
      <div class="updates-hero-copy">
        <div class="updates-eyebrow">Product changelog</div>
        <h1 class="updates-title">Clickoz improvement log.</h1>
        <p class="updates-sub">A public control room for product quality: tool fixes, guide rewrites, SEO structure, design polish, schema coverage and mobile performance.</p>
        <div class="updates-actions"><a class="updates-btn updates-btn-primary" href="#all">View releases</a><a class="updates-btn" href="/tools/">Open tools</a><a class="updates-btn" href="/guides/">Open guides</a></div>
        <div class="updates-manifesto"><span class="dot"></span><span>Every update must make Clickoz easier to use, trust or discover.</span></div>
      </div>
      <aside class="source-command-panel source-command-panel-lite">
        <div class="source-panel-head"><span>CMS map</span><strong>Structure that stays light on mobile.</strong></div>
        <div class="source-map-visual source-map-lite" aria-label="Clickoz release structure map">
          <div class="source-lite-orbit source-lite-orbit-a" aria-hidden="true"></div>
          <div class="source-lite-orbit source-lite-orbit-b" aria-hidden="true"></div>
          <div class="source-lite-pulse" aria-hidden="true"></div>
          <div class="source-lite-core"><strong>Clickoz</strong><span>CMS</span></div>
          <div class="source-lite-row source-lite-row-top">
            <a href="/tools/"><b>${cms.tools.length}</b><span>Tool pages</span></a>
            <a href="/guides/"><b>${cms.guides.length}</b><span>Guide workflows</span></a>
          </div>
          <div class="source-lite-row source-lite-row-bottom">
            <a href="/guides/seo/"><b>SEO</b><span>Schema + links</span></a>
            <a href="/about/"><b>Trust</b><span>About + legal</span></a>
          </div>
          <div class="source-lite-status" aria-hidden="true"><span>Schema</span><span>Links</span><span>Mobile</span></div>
          <div class="source-lite-lines" aria-hidden="true"></div>
        </div>
      </aside>
    </header>
    <section class="updates-quality-board">
      <article><span>UI</span><strong>Readable screens</strong><p>Spacing, card depth, hover state, contrast and mobile layout.</p></article>
      <article><span>SEO</span><strong>Search-ready pages</strong><p>Intent titles, descriptions, schema, canonicals and internal links.</p></article>
      <article><span>Tools</span><strong>Useful outputs</strong><p>Examples, real utility, copy actions, privacy notes and related workflows.</p></article>
      <article><span>Guides</span><strong>Problem-first content</strong><p>Problem, method, alternatives, checklist, sources and next actions.</p></article>
    </section>
    <section id="all" class="updates-box">
      <div class="authority-head"><p class="guide-kicker">RELEASE HISTORY</p><h2>Changelog with context.</h2><p>Version notes explain what changed and why it matters for users, SEO and the CMS foundation.</p></div>
      <div class="updates-grid release-lab-grid">${releases.map(([version, title, date, copy, tags]) => `<article class="release-card"><div class="release-meta"><div class="release-left"><span class="release-version">${version}</span><div><h3>${title}</h3><span>${date}</span></div></div><span class="release-type">Release</span></div><p>${copy}</p><div class="release-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div></article>`).join("")}</div>
    </section>
    <section class="authority-split">
      <div class="authority-panel"><p class="guide-kicker">NEXT QUALITY TARGETS</p><h2>What improves next.</h2><p>Clickoz should keep moving toward smarter outputs, richer guide examples, stronger cluster pages and measurable mobile speed.</p></div>
      <div class="pillar-grid">
        <a href="/tools/social-ai-tools/"><strong>Creator traffic tools</strong><span>More YouTube, TikTok, Instagram and Reddit utilities.</span></a>
        <a href="/guides/seo/"><strong>Deep SEO guides</strong><span>More tutorial hubs, comparisons and practical examples.</span></a>
        <a href="/about/"><strong>E-E-A-T layer</strong><span>Clearer mission, quality standards and product trust.</span></a>
        <a href="/contact/"><strong>Feedback loop</strong><span>Weak pages should become the next public fix.</span></a>
      </div>
    </section>
  </main>`;
  return page({
    active: "updates",
    title: "Clickoz Updates - Product Changelog, SEO Releases and CMS Improvements",
    description: "Follow Clickoz releases for tool improvements, guide rewrites, SEO structure, schema coverage, UX polish and mobile performance work.",
    canonical: "/updates/",
    og: "/assets/og/updates.svg",
    jsonLd: schema,
    main
  });
}

function workflowsPage() {
  const lanes = [
    {
      id: "seo",
      mark: "SEO",
      title: "SEO publishing workflow",
      summary: "Take a page from draft to search-ready: snippet, intent, readability, slug and internal links.",
      href: "/tools/seo-tools/",
      guide: "/guides/seo/",
      steps: [
        ["Clarify intent", "Open the SEO checklist and define the exact query problem."],
        ["Build the snippet", "Use Meta Tag Optimizer and SERP Preview before editing the whole page."],
        ["Strengthen the body", "Check word count, readability, keyword balance and internal links."],
        ["Publish clean", "Copy the final title, description, slug and next-click path."]
      ],
      tools: ["meta-tags", "serp-preview", "keyword-density", "slug-generator", "readability-analyzer"],
      guides: ["seo-content-checklist", "meta-tags-checklist", "serp-snippet-ctr", "internal-linking-tools-sites"]
    },
    {
      id: "creator",
      mark: "YT",
      title: "Creator upload workflow",
      summary: "Package a video or short-form idea as one system: title, thumbnail, description, hashtags and tracking.",
      href: "/tools/youtube-tools/",
      guide: "/guides/creator/",
      steps: [
        ["Define the click promise", "Start with the title angle and the thumbnail promise together."],
        ["Package the upload", "Generate the description, chapters, hashtags and comment/community follow-up."],
        ["Track the route", "Build separate links for description, pinned comment, bio and newsletter."],
        ["Reuse the asset", "Repurpose the upload into Shorts, posts, hooks and a creator calendar."]
      ],
      tools: ["youtube-title-generator", "thumbnail-brief-generator", "youtube-description-generator", "youtube-hashtag-generator", "utm-builder"],
      guides: ["youtube-title-thumbnail-checklist", "youtube-description-template", "youtube-tracking-links", "creator-content-calendar"]
    },
    {
      id: "dev",
      mark: "DEV",
      title: "Developer debug workflow",
      summary: "Fix broken payloads, escaped text, URLs and technical checks without leaving the browser.",
      href: "/tools/developer-tools/",
      guide: "/guides/dev/",
      steps: [
        ["Inspect exact input", "Paste the real JSON, URL value, token part or markup fragment."],
        ["Transform with context", "Format, encode, decode or escape only for the context where it will be used."],
        ["Validate the output", "Check errors, compare changed lines and avoid treating encoding as security."],
        ["Document the fix", "Copy the clean result plus the reason it changed."]
      ],
      tools: ["json-formatter", "url-encoder", "base64", "entity-encoder", "regex-tester"],
      guides: ["json-formatting-debug", "url-encoding", "base64url-vs-base64", "encoding-vs-escaping"]
    },
    {
      id: "writing",
      mark: "TXT",
      title: "Writing cleanup workflow",
      summary: "Make drafts easier to scan: count, structure, readability, cleanup and final copy checks.",
      href: "/tools/writing-tools/",
      guide: "/guides/writing/",
      steps: [
        ["Measure first", "Use Word Counter to see length, reading time, paragraphs and sentence load."],
        ["Reduce friction", "Run readability and whitespace cleanup before polishing style."],
        ["Format for reuse", "Convert case, clean pasted text and prepare the final copy field."],
        ["Move to SEO", "If the page will rank, continue to snippet and keyword checks."]
      ],
      tools: ["word-counter", "readability-analyzer", "whitespace-cleaner", "text-case-converter", "character-counter"],
      guides: ["word-count-for-seo", "readability-for-seo", "text-cleanup-workflow", "content-brief-template"]
    }
  ];

  const linkTools = (lane) => lane.tools.map((slug) => cms.toolBySlug[slug]).filter(Boolean)
    .map((tool) => `<a href="${tool.url}">${esc(tool.title)}</a>`).join("");
  const linkGuides = (lane) => lane.guides.map((slug) => cms.guideBySlug[slug]).filter(Boolean)
    .map((guide) => `<a href="${guide.url}">${esc(guide.title)}</a>`).join("");

  const faq = [
    ["What is a Clickoz workflow?", "A Clickoz workflow is a sequence of tools and guides for one real job, such as publishing a page, packaging a creator upload, debugging data or cleaning a draft."],
    ["Why should workflows rank separately from tools?", "Tool pages answer one task. Workflow pages connect multiple tasks, which helps users finish a complete job and gives search engines a stronger topical structure."],
    ["Where should a new user start?", "Start from the problem: SEO publishing, creator upload, developer debugging or writing cleanup. Each lane links to the matching cluster, tools and guide hub."]
  ];

  const schema = jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Workflows", url: "/workflows/" }]),
      {
        "@type": "CollectionPage",
        "name": "Clickoz Workflows",
        "url": abs("/workflows/"),
        "description": "SEO, creator, developer and writing workflows that connect Clickoz tools and guides.",
        "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": lanes.map((lane, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": lane.title,
            "url": abs(`/workflows/#${lane.id}`)
          }))
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } }))
      }
    ]
  });

  const main = `<main class="section container workflows-page-shell">
    <header class="workflow-cluster-hero">
      <div class="workflow-hero-copy">
        <p class="guide-kicker">CLICKOZ WORKFLOW CLUSTER</p>
        <h1>One map for search, creators, code and writing.</h1>
        <p>Tools are useful when the job is clear. Workflows make the job clear first, then route the user through the exact tool, guide and next action. This page is the operating layer for Clickoz.</p>
        <div class="dash-actions">
          <a class="btn btn-accent" href="#seo">Start with SEO</a>
          <a class="btn btn-outline" href="#creator">Creator lane</a>
          <a class="btn btn-outline" href="/tools/">All tools</a>
        </div>
      </div>
      <aside class="workflow-control-card" aria-label="Clickoz workflow map">
        <div class="workflow-core">Clickoz<span>workflow OS</span></div>
        <div class="workflow-map-grid">
          ${lanes.map((lane) => `<a href="#${lane.id}"><b>${lane.mark}</b><span>${esc(lane.title.replace(" workflow", ""))}</span></a>`).join("")}
        </div>
        <div class="workflow-map-note">Pick a lane, run the first tool, read the guide, then continue to the next connected action.</div>
      </aside>
    </header>

    <section class="workflow-lane-grid" aria-label="Workflow lanes">
      ${lanes.map((lane) => `<article class="workflow-lane-card" id="${lane.id}">
        <div class="workflow-lane-head"><span>${lane.mark}</span><div><h2>${esc(lane.title)}</h2><p>${esc(lane.summary)}</p></div></div>
        <ol class="workflow-step-list">
          ${lane.steps.map(([name, text], index) => `<li><b>${String(index + 1).padStart(2, "0")}</b><strong>${esc(name)}</strong><span>${esc(text)}</span></li>`).join("")}
        </ol>
        <div class="workflow-link-columns">
          <div><h3>Tools in this lane</h3><div class="workflow-mini-links">${linkTools(lane)}</div></div>
          <div><h3>Guides to read</h3><div class="workflow-mini-links">${linkGuides(lane)}</div></div>
        </div>
        <div class="workflow-lane-actions"><a class="btn btn-accent" href="${lane.href}">Open tools</a><a class="btn btn-outline" href="${lane.guide}">Open guide hub</a></div>
      </article>`).join("")}
    </section>

    <section class="workflow-decision-board">
      <div class="authority-head">
        <p class="guide-kicker">STARTING POINT</p>
        <h2>Choose by symptom, not by tool name.</h2>
        <p>This keeps new users comfortable: they do not need to know which tool exists. They only need to recognize the problem.</p>
      </div>
      <div class="workflow-symptom-grid">
        <a href="#seo"><b>Page is live but not earning clicks</b><span>Use SEO publishing.</span></a>
        <a href="#creator"><b>Video idea is good but packaging is weak</b><span>Use Creator upload.</span></a>
        <a href="#dev"><b>Payload or URL breaks when copied</b><span>Use Developer debug.</span></a>
        <a href="#writing"><b>Draft is hard to scan on mobile</b><span>Use Writing cleanup.</span></a>
      </div>
    </section>

    <section class="authority-split workflow-authority-split">
      <div class="authority-panel">
        <p class="guide-kicker">SEO AUTHORITY</p>
        <h2>Why this page belongs in the sitemap.</h2>
        <p>Cluster pages help users and Google understand how Clickoz is organized. The workflows hub connects the high-value hubs: SEO Tools, YouTube Tools, Social AI Tools, SEO Guides and Creator Guides.</p>
      </div>
      <div class="pillar-grid">
        <a href="/tools/youtube-tools/"><strong>YouTube Tools</strong><span>Titles, thumbnails, descriptions, hashtags and upload packaging.</span></a>
        <a href="/tools/social-ai-tools/"><strong>Social AI Tools</strong><span>TikTok, Instagram, Reddit, LinkedIn and creator monetization utilities.</span></a>
        <a href="/guides/seo/"><strong>SEO Guides</strong><span>Intent, snippets, links, content length and technical publishing checks.</span></a>
        <a href="/guides/creator/"><strong>Creator Guides</strong><span>Upload planning, descriptions, tracking links and content calendars.</span></a>
      </div>
    </section>

    <section class="workflow-faq-panel">
      <h2>Workflow FAQ</h2>
      ${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
    </section>
  </main>`;

  return page({
    active: "home",
    bodyClass: "bigtext workflows-page",
    title: "Clickoz Workflows - SEO, Creator, Developer and Writing Tool Paths",
    description: "Use Clickoz workflows to move from problem to tool to guide: SEO publishing, creator uploads, developer debugging and writing cleanup.",
    canonical: "/workflows/",
    og: "/assets/og/default.svg",
    jsonLd: schema,
    main
  });
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    "/",
    "/about/",
    "/workflows/",
    "/tools/",
    "/guides/",
    "/guides/seo/",
    "/guides/writing/",
    "/guides/dev/",
    "/guides/creator/",
    "/updates/",
    "/privacy/",
    "/terms/",
    "/legal/",
    "/contact/",
    ...Object.values(cms.clusters).map((cluster) => cluster.url),
    ...cms.tools.filter((tool) => !tool.canonicalSlug || tool.canonicalSlug === tool.slug).map((tool) => tool.url),
    ...cms.guides.map((guide) => guide.url)
  ];
  const unique = Array.from(new Set(urls)).sort();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((url) => {
  const priority = url === "/" ? "1.0" : url === "/tools/" || url === "/guides/" ? "0.9" : url.includes("/tools/") || url.includes("/guides/") ? "0.8" : "0.6";
  const changefreq = url === "/" || url === "/updates/" ? "weekly" : "monthly";
  return `  <url><loc>${abs(url)}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}).join("\n")}
</urlset>
`;
}

function replaceVersionsInHtml() {
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name === ".git" || name === "node_modules") continue;
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith(".html")) files.push(full);
    }
  }
  walk(root);
  for (const file of files) {
    let html = fs.readFileSync(file, "utf8");
    html = html
      .replace(/\/assets\/site\.css\?v=\d+/g, "/assets/site.css?v=13")
      .replace(/\/assets\/home\.css\?v=\d+/g, "/assets/home.css?v=15")
      .replace(/\/assets\/home\.js\?v=\d+/g, "/assets/home.js?v=16")
      .replace(/\/assets\/clickoz-premium\.css\?v=\d+/g, "/assets/clickoz-premium.css?v=4")
      .replace(/\/assets\/guide-premium\.css\?v=\d+/g, "/assets/guide-premium.css?v=5")
      .replace(/\/assets\/guide-premium\.js\?v=\d+/g, "/assets/guide-premium.js?v=6")
      .replace(/\/tools\/tools\.css\?v=\d+/g, "/tools/tools.css?v=8")
      .replace(/\/tools\/cms-tools\.css\?v=\d+/g, "/tools/cms-tools.css?v=13")
      .replace(/\/tools\/cms-tools\.js\?v=\d+/g, "/tools/cms-tools.js?v=11")
      .replace(/\/assets\/cms-final\.css\?v=\d+/g, `/assets/cms-final.css?v=${V.cmsFinal}`)
      .replace(/\/assets\/cms-schema\.js\?v=\d+/g, `/assets/cms-schema.js?v=${V.cmsSchema}`)
      .replace(/\/assets\/cms-enhance\.js\?v=\d+/g, `/assets/cms-enhance.js?v=${V.cmsEnhance}`)
      .replace(/\/assets\/site\.js\?v=\d+/g, `/assets/site.js?v=${V.site}`)
      .replace(/\/assets\/clickoz-premium\.js\?v=\d+/g, `/assets/clickoz-premium.js?v=${V.clickozPremium}`);
    html = ensureEarlyTheme(html);
    fs.writeFileSync(file, html, "utf8");
  }
}

function legacyToolTemplatePage() {
  return page({
    active: "tools",
    title: "Tool Template Moved - Clickoz",
    description: "This legacy Clickoz tool template is retired. Open the tools directory for the current CMS tool experience.",
    canonical: "/tools/",
    og: "/assets/og/tools.svg",
    robots: "noindex,follow",
    main: `<main class="section container trust-shell">
    <section class="hero-box trust-hero">
      <p class="guide-kicker">LEGACY TEMPLATE</p>
      <h1 class="section-title">This tool template has moved.</h1>
      <p class="section-sub">Clickoz now uses generated tool pages with examples, related guides, related tools, SEO sections and consistent mobile controls.</p>
      <div class="trust-actions">
        <a class="btn primary" href="/tools/">Open all tools</a>
        <a class="btn" href="/tools/developer-tools/">Open developer tools</a>
      </div>
    </section>
  </main>`
  });
}

function errorPage(code, title, copy) {
  return page({
    active: "home",
    title: `${code} - ${title} | Clickoz`,
    description: `${title}. Use Clickoz recovery links to continue to tools, guides, updates or contact.`,
    canonical: `/${code}/`,
    robots: "noindex,follow",
    main: `<main class="section container trust-shell">
    <section class="hero-box trust-hero">
      <div class="error-code">${code}</div>
      <p class="guide-kicker">RECOVERY MODE</p>
      <h1 class="section-title">${esc(title)}</h1>
      <p class="section-sub">${esc(copy)}</p>
      <div class="trust-link-grid" style="max-width:760px;margin:18px auto 0">
        <a href="/tools/">Open tools</a>
        <a href="/guides/">Open guides</a>
        <a href="/updates/">Read updates</a>
        <a href="/contact/">Report issue</a>
      </div>
    </section>
    <section class="trust-card-grid">
      <article class="trust-card"><h3>Text workflow</h3><p>Count, clean and improve draft readability.</p><p><a href="/tools/word-counter/">Open Word Counter</a></p></article>
      <article class="trust-card"><h3>SEO workflow</h3><p>Fix snippets, metadata, URLs and internal links.</p><p><a href="/tools/meta-tags/">Open Meta Tags</a></p></article>
      <article class="trust-card"><h3>Developer workflow</h3><p>Format JSON, encode URLs and inspect payloads.</p><p><a href="/tools/json-formatter/">Open JSON Formatter</a></p></article>
    </section>
  </main>`
  });
}

function syncLegacyShell() {
  const pages = [
    ["contact/index.html", "home"],
    ["legal/index.html", "home"],
    ["privacy/index.html", "home"],
    ["terms/index.html", "home"],
    ["404.html", "home"],
    ["404/index.html", "home"],
    ["tools/dev-tools/index.html", "tools"]
  ];

  for (const [rel, active] of pages) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");

    if (/<nav class="nav"[\s\S]*?<\/nav>/.test(html)) {
      html = html.replace(/<nav class="nav"[\s\S]*?<\/nav>/, nav(active));
    }

    if (/<footer class="footer"[\s\S]*?<\/footer>/.test(html)) {
      html = html.replace(/<footer class="footer"[\s\S]*?<\/footer>/, footer());
    } else if (html.includes("</main>")) {
      html = html.replace("</main>", `</main>\n\n  ${footer()}`);
    } else {
      html = html.replace("</body>", `  ${footer()}\n</body>`);
    }

    html = ensureEarlyTheme(html);
    fs.writeFileSync(file, html, "utf8");
  }

  fs.writeFileSync(path.join(root, "tools", "tool.html"), legacyToolTemplatePage(), "utf8");
}

function main() {
  fs.writeFileSync(path.join(root, "index.html"), homePage(), "utf8");
  fs.writeFileSync(path.join(root, "about", "index.html"), aboutPage(), "utf8");
  writeUrl("/workflows/", workflowsPage());
  fs.writeFileSync(path.join(root, "updates", "index.html"), updatesPage(), "utf8");
  fs.writeFileSync(path.join(root, "guides", "index.html"), guidesIndexPage(), "utf8");
  Object.entries(guideHubs).forEach(([url, hub]) => writeUrl(url, guideHubPage(url, hub)));
  syncLegacyShell();
  replaceVersionsInHtml();
  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap(), "utf8");
  fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *
Allow: /
Disallow: /_maintenance/
Disallow: /404/
Disallow: /500/
Disallow: /tools/tool.html
Sitemap: ${ORIGIN}/sitemap.xml
`, "utf8");
  fs.writeFileSync(path.join(root, "404.html"), errorPage("404", "This page does not exist yet.", "The URL may be old, mistyped or moved during a CMS rewrite. Use one of the recovery paths below to get back into the site."), "utf8");
  writeUrl("/404/", errorPage("404", "This page does not exist yet.", "The URL may be old, mistyped or moved during a CMS rewrite. Use one of the recovery paths below to get back into the site."));
  fs.writeFileSync(path.join(root, "500.html"), errorPage("500", "Something failed safely.", "If a server or deployment error happens, this page gives users a clean recovery path instead of a blank dead end."), "utf8");
  writeUrl("/500/", errorPage("500", "Something failed safely.", "If a server or deployment error happens, this page gives users a clean recovery path instead of a blank dead end."));
  console.log("Authority pass applied: home, about, updates, guide index, guide hubs, sitemap and robots.");
}

main();
