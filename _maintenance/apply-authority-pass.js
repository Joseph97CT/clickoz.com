const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ORIGIN, ASSET_VERSIONS, CSP, PERMISSIONS_POLICY, asset } = require("./cms-config");
const { BRAND, INDEX_ROBOTS, iconLinks, logoMarkup, normalizeRobots, organizationNode, publisherNode, websiteNode } = require("./brand-assets");

const root = path.resolve(__dirname, "..");
const V = {
  site: ASSET_VERSIONS.siteJs,
  cmsFinal: ASSET_VERSIONS.cmsFinal,
  cmsSchema: ASSET_VERSIONS.cmsSchema,
  cmsEnhance: ASSET_VERSIONS.cmsEnhance,
  clickozPremium: ASSET_VERSIONS.clickozPremiumJs
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
  const csp = connect ? CSP.replace("https://cloudflare-dns.com", `https://cloudflare-dns.com${connect}`) : CSP;
  return `<meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="${PERMISSIONS_POLICY}" />`;
}

function earlyThemeScript() {
  return `<script>
  (function(){
    try{
      var saved = JSON.parse(localStorage.getItem("clickoz_accent") || "null");
      var a1 = saved && saved.a1 ? saved.a1 : "#22d3ee";
      var a2 = saved && saved.a2 ? saved.a2 : "#06b6d4";
      var map = {"#22d3ee":["#38e8ff","#8af3ff"],"#38e8ff":["#38e8ff","#8af3ff"],"#6366f1":["#9b8cff","#d6ccff"],"#8b7cff":["#9b8cff","#d6ccff"],"#3b82f6":["#6fb6ff","#b9e2ff"],"#5ea8ff":["#6fb6ff","#b9e2ff"],"#10b981":["#5cff9d","#c7ffd6"],"#31f5bd":["#5cff9d","#c7ffd6"],"#39f5c7":["#5cff9d","#c7ffd6"],"#ef4444":["#ff6f7d","#ffc0c7"],"#ff5c6c":["#ff6f7d","#ffc0c7"],"#ff6fa8":["#ff6f7d","#ffc0c7"],"#ec4899":["#ff6fde","#ffc2f0"],"#ff5fbd":["#ff6fde","#ffc2f0"],"#fde047":["#fff36d","#fff8b8"],"#ffe45c":["#fff36d","#fff8b8"],"#f59e0b":["#ffc85f","#ffe0a3"],"#ffb238":["#ffc85f","#ffe0a3"],"#f97316":["#ffc85f","#ffe0a3"],"#ff7a1a":["#ffc85f","#ffe0a3"],"#cbd5e1":["#38e8ff","#8af3ff"],"#f8fafc":["#38e8ff","#8af3ff"],"#ffffff":["#38e8ff","#8af3ff"]};
      var pair = map[String(a1).toLowerCase()] || ["#38e8ff","#8af3ff"];
      a1 = pair[0]; a2 = pair[1];
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

function head({ title, description, canonical, og = BRAND.defaultOg, jsonLd = "", extraCss = "", extraConnect = "", robots = INDEX_ROBOTS }) {
  const safeRobots = esc(normalizeRobots(robots));
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${securityMeta(extraConnect)}
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${abs(canonical)}" />
  <meta name="robots" content="${safeRobots}" />
  <meta name="googlebot" content="${safeRobots}" />
  <meta name="application-name" content="${BRAND.name}" />
  <meta name="apple-mobile-web-app-title" content="${BRAND.name}" />
  <meta name="theme-color" content="${BRAND.themeColor}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${abs(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${abs(og)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${abs(og)}" />
  <meta name="twitter:image:alt" content="${esc(title)}" />
  ${iconLinks()}
  ${earlyThemeScript()}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${asset("/assets/site.css", "siteCss")}" />
  ${extraCss}
  <link rel="stylesheet" href="${asset("/assets/clickoz-premium.css", "clickozPremiumCss")}" />
  <link rel="stylesheet" href="${asset("/assets/cms-final.css", "cmsFinal")}" />
  ${jsonLd}
</head>`;
}

function nav(active) {
  const current = (key) => active === key ? ` class="active" aria-current="page"` : "";
  return `<nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home">
        ${logoMarkup()}
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
    </div>
  </aside>`;
}

function footer() {
  return `<footer class="footer">
    <div class="container footer-grid">
      <div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div>
      <div><h4>Tool hubs</h4><div class="footer-links"><a href="/tools/seo-tools/">SEO Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/tools/writing-tools/">Writing Tools</a><a href="/guides/creator/">Creator Guides</a></div></div>
      <div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/youtube-title-generator/">YouTube Titles</a></div></div>
      <div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/404/">404</a></div></div>
    </div>
    <div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">&copy; 2026 Clickoz &middot; Fast browser tools for SEO, writing, developers and creators</div></div>
  </footer>`;
}

function routeFinalStrip(label = "Clickoz route") {
  return `<section class="route-final-strip" aria-label="${esc(label)} operating route">
      <article><span>01</span><strong>Search by problem</strong><p>Start from the messy input or task, not from a long category list.</p></article>
      <article><span>02</span><strong>Use the exact tool</strong><p>Open the focused utility that matches the job you need to finish.</p></article>
      <article><span>03</span><strong>Copy a clean result</strong><p>Keep output, copy controls and checks in one predictable surface.</p></article>
      <article><span>04</span><strong>Read when needed</strong><p>Use guides only when the copied result needs a better decision behind it.</p></article>
      <article><span>05</span><strong>Request gaps</strong><p>Ask for a missing tool, fix or guide when the current route does not cover the job.</p></article>
    </section>`;
}

function requestMegaCta(title = "Missing a tool, guide or workflow?", copy = "Send the exact job you are trying to finish. Clickoz requests go through the validated contact form and email fallback.") {
  return `<section class="request-mega-cta" aria-label="Request a Clickoz tool">
      <div>
        <p class="guide-kicker">CONTACT / REQUEST</p>
        <h2>${esc(title)}</h2>
        <p>${esc(copy)}</p>
      </div>
      <a class="btn btn-accent" href="/contact/#request">Request a tool</a>
    </section>`;
}

function scripts(extra = "") {
  return `<script src="${asset("/assets/cms-registry.js", "cmsRegistry")}" defer></script>
  <script src="${asset("/assets/cms-schema.js", "cmsSchema")}" defer></script>
  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>
  <script src="${asset("/assets/site.js", "siteJs")}" defer></script>
  <script src="${asset("/assets/clickoz-premium.js", "clickozPremiumJs")}" defer></script>
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
    "publisher": publisherNode(ORIGIN),
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
  const title = "Clickoz - Free SEO, Writing, Creator and Developer Tools";
  const description = "Run free browser tools for SEO snippets, JSON, text cleanup, YouTube titles, UTM links and practical guides. No signup or upload.";
  const featured = ["meta-tags", "word-counter", "youtube-title-generator", "json-formatter", "tiktok-hook-generator", "http-ping"].map((s) => cms.toolBySlug[s]).filter(Boolean);
  const schema = jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(ORIGIN),
      websiteNode(ORIGIN),
      { "@type": "SoftwareApplication", "name": "Clickoz", "url": ORIGIN + "/", "applicationCategory": "WebApplication", "operatingSystem": "All", "isAccessibleForFree": true, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "publisher": { "@id": ORIGIN + "/#organization" }, "image": `${ORIGIN}${BRAND.logoPng}`, "featureList": ["SEO tools", "Creator tools", "Writing utilities", "Developer utilities", "Browser-first privacy"] }
    ]
  });

  const main = `<main class="home-workdesk">
    <header class="cz-workdesk-hero hero-simple-v2" aria-label="Clickoz tool network">
      <section class="workdesk-copy">
        <h1>Clickoz turns web work into clean workflows.</h1>
        <p class="hero-workdesk-sub">Route the task, preview the output, open the exact browser tool, then use the matching guide when the decision matters. SEO, creator packaging, writing cleanup and developer fixes stay in one fast system.</p>
        <div class="dash-actions hero-direct-actions">
          <a class="btn btn-accent" href="/tools/">Browse tools</a>
          <a class="btn btn-outline" href="/guides/">Read guides</a>
          <a class="btn btn-outline" href="/contact/#request">Request a tool</a>
        </div>
        <div class="hero-fix-console" aria-label="Clickoz tool router">
          <p class="hero-router-question">What do you need to fix?</p>
          <label class="hero-input-label" for="heroJobInput">Describe the task</label>
          <div class="hero-fix-input-row">
            <input id="heroJobInput" type="search" value="create seo snippet" autocomplete="off" />
            <button class="btn btn-accent" id="heroStartJob" type="button">Find tool</button>
          </div>
          <p class="hero-command-note">Advanced Search press <kbd>Ctrl</kbd> + <kbd>K</kbd></p>
        </div>
        <div class="hero-assurance-row" aria-label="Clickoz operating promises">
          <a href="/tools/"><strong>No account</strong><span>Start instantly</span></a>
          <a href="/privacy/"><strong>No upload</strong><span>Browser-first</span></a>
          <a href="/tools/"><strong>Local saves</strong><span>Recents and favorites</span></a>
        </div>
      </section>
    </header>

    <section class="section container friendly-tools-section" aria-label="Daily tool picks">
      <div class="friendly-section-intro">
        <div><h2>Tools that match real daily jobs.</h2><p class="section-sub">Start from the problem, not from a directory. Each card points to a practical route through the Clickoz system.</p></div>
      </div>
      <div class="picks-grid" id="picksGrid">
        <a class="pick-card" href="/tools/meta-tags/"><div class="pick-head"><span class="pick-icon">SEO</span><h3 class="pick-title">Meta Tag Optimizer</h3></div><p class="pick-desc">Preview titles and descriptions before publishing a search result.</p><div class="pick-meta"><span class="pick-cat">SEO Tools</span><span class="pick-cta">Open</span></div></a>
        <a class="pick-card" href="/tools/youtube-title-generator/"><div class="pick-head"><span class="pick-icon">YT</span><h3 class="pick-title">YouTube Title Generator</h3></div><p class="pick-desc">Turn a video idea into stronger title angles with cleaner intent.</p><div class="pick-meta"><span class="pick-cat">Creator Tools</span><span class="pick-cta">Open</span></div></a>
        <a class="pick-card" href="/tools/json-formatter/"><div class="pick-head"><span class="pick-icon">{ }</span><h3 class="pick-title">JSON Formatter</h3></div><p class="pick-desc">Format, validate and clean payloads without a heavy dev console.</p><div class="pick-meta"><span class="pick-cat">Developer Tools</span><span class="pick-cta">Open</span></div></a>
      </div>
      <div class="picks-actions picks-actions-bottom"><button class="btn btn-outline rec-refresh" id="recRefresh" type="button">Refresh picks</button></div>
    </section>

    <section class="section container authority-picker" aria-label="Choose a task">
      <div class="authority-head"><p class="guide-kicker pulse-kicker">START FROM THE PROBLEM</p><h2 class="type-on-view">Pick the job. The site routes the next action.</h2><p>Every path has a first tool, a guide, and a useful next step. That is the difference between a generic tool list and a product people can reuse.</p></div>
      <div class="authority-grid">
        <a class="authority-card" href="/tools/meta-tags/"><div class="authority-card-head"><span>SEO</span><h3>Publish a page</h3></div><p>Preview the snippet, check title length, scan readability and connect the page to a guide before publishing.</p></a>
        <a class="authority-card" href="/tools/youtube-title-generator/"><div class="authority-card-head"><span>YT</span><h3>Package an upload</h3></div><p>Build title angles, thumbnail text, description structure, hashtags and tracking links from one creator route.</p></a>
        <a class="authority-card" href="/tools/readability-analyzer/"><div class="authority-card-head"><span>TXT</span><h3>Improve a draft</h3></div><p>Count, simplify and structure copy so mobile readers understand the point quickly.</p></a>
        <a class="authority-card" href="/tools/json-formatter/"><div class="authority-card-head"><span>DEV</span><h3>Fix broken data</h3></div><p>Format JSON, encode URL values, decode Base64 and escape HTML without heavy developer tools.</p></a>
      </div>
    </section>

    <section class="section container authority-split" aria-label="Clickoz focus">
      <div class="authority-panel">
        <p class="guide-kicker">WHY IT DOES NOT FEEL RANDOM</p>
        <h2>Three authority lanes first. Everything else supports them.</h2>
        <p>Clickoz is built around search growth, creator packaging and readable web work. Developer tools exist because broken links, encoded payloads and messy JSON are part of the same publishing job.</p>
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
    ${routeFinalStrip("Clickoz home route")}
    ${requestMegaCta("Need a tool that is missing?", "Send the exact job, output or guide you expected to find. Clickoz uses requests to prioritize the next browser utility without adding random filler.")}
  </main>`;
  return page({ active: "home", title, description, canonical: "/", jsonLd: schema, extraCss: `<link rel="stylesheet" href="${asset("/assets/home.css", "homeCss")}" />
  <link rel="stylesheet" href="${asset("/assets/home-leadership.css", "homeLeadershipCss")}" />`, main, extraScripts: `<script src="${asset("/assets/home.js", "homeJs")}" defer></script>` });
}

const guideHubs = {
  "/guides/seo/": {
    key: "seo",
    title: "SEO Guides - Search Decisions, Snippets and Internal Links | Clickoz",
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
    desc: "Guides for readability, word count, content briefs, cleanup routines and mobile-friendly writing.",
    categories: ["writing"],
    toolHref: "/tools/writing-tools/",
    focus: ["Make the point obvious", "Reduce hard sentences", "Keep structure scannable"]
  },
  "/guides/dev/": {
    key: "dev",
    title: "Developer Guides - JSON, URL Encoding and Base64 | Clickoz",
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
        ${hub.focus.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(item)}</strong><p>Do this before moving to the next page so the route stays practical.</p></article>`).join("")}
      </aside>
    </header>
    <section class="authority-head"><p class="guide-kicker">GUIDES IN THIS HUB</p><h2>Start with the article that matches the problem.</h2><p>Each guide links back into a working Clickoz tool, related guides and a concrete checklist.</p></section>
    <section class="guide-hub-grid">${guides.map(guideCard).join("")}</section>
    ${routeFinalStrip(`${hub.key} guide hub`)}
    ${requestMegaCta(`Need a ${hub.key} guide that is missing?`, `Send the exact decision, tool output or workflow that still feels unclear. Clickoz will use it to prioritize the next guide or utility.`)}
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
    collectionSchema({ name: "Clickoz Guides", url: "/guides/", description: "Problem-first Clickoz guides connected to browser tools, examples, checklists and practical next steps.", items: cms.guides })
  ].map(jsonLd).join("\n  ");
  const main = `<main class="section container guide-hub-shell">
    <header class="guide-hub-hero guides-library-hero">
      <div>
        <p class="guide-kicker">CLICKOZ GUIDE LIBRARY</p>
        <h1>Guides that turn tool output into a better decision.</h1>
        <p>Use guides when a copied result still needs context: SEO intent, publishing checks, creator packaging, readable drafts or safe technical handling.</p>
        <div class="dash-actions"><a class="btn btn-accent" href="/tools/">Use a tool first</a><a class="btn btn-outline" href="/guides/seo/">Start with SEO</a></div>
      </div>
      <aside class="guide-hub-checklist">
        <article><span>01</span><strong>Find the problem</strong><p>Search by decision, not by random article title.</p></article>
        <article><span>02</span><strong>Run the tool</strong><p>Use real input and keep the result copy-ready.</p></article>
        <article><span>03</span><strong>Move to the next page</strong><p>Every article connects into another useful Clickoz action.</p></article>
      </aside>
    </header>
    <section class="guide-route-panel" aria-label="Guide starting points">
      <a href="/guides/seo/"><b>SEO decision</b><span>Make titles, snippets, slugs and internal links search-ready.</span></a>
      <a href="/guides/writing/"><b>Writing decision</b><span>Use word count and readability as practical editing signals.</span></a>
      <a href="/guides/dev/"><b>Technical decision</b><span>Understand encoding, escaping and payload fixes before copying.</span></a>
      <a href="/guides/creator/"><b>Creator decision</b><span>Package titles, descriptions, hashtags and tracking as one upload route.</span></a>
    </section>
    <section class="guide-search-panel" aria-label="Search Clickoz guides">
      <div>
        <p class="guide-kicker">FIND THE RIGHT GUIDE</p>
        <h2>Search by decision, tool or problem.</h2>
        <p>Filter the library without losing the category structure. Use it when you know the job but not the article name.</p>
      </div>
      <div class="guide-search-control">
        <input id="guideSearch" class="search" type="search" placeholder="Try: meta title, JSON error, UTM, readability, YouTube description" aria-describedby="guideSearchStatus" />
        <p id="guideSearchStatus" class="guide-search-status" aria-live="polite">Showing ${cms.guides.length} practical guides</p>
        <button type="button" id="guideSearchReset" hidden>Reset guide search</button>
      </div>
      <div class="guide-search-chips" aria-label="Popular guide searches">
        <button type="button" data-guide-search="meta title">Meta title</button>
        <button type="button" data-guide-search="json error">JSON error</button>
        <button type="button" data-guide-search="utm">UTM</button>
        <button type="button" data-guide-search="youtube description">YouTube description</button>
      </div>
    </section>
    <section class="guide-hub-grid guide-hub-overview">${sections.map((section) => `<a class="guide-hub-card guide-hub-entry" href="${section.url}"><div class="authority-card-head"><span>${section.mark}</span><h2>${section.title}</h2></div><p>${section.desc}</p><div class="guide-card-meta"><span>${cms.guides.filter((g) => section.cats.includes(g.category)).length} guides</span><span>Tool-linked</span><span>Checklist</span></div></a>`).join("")}</section>
    ${sections.map((section) => {
      const guides = cms.guides.filter((guide) => section.cats.includes(guide.category));
      return `<section class="guide-category-band" id="${section.mark.toLowerCase()}"><div class="authority-head"><p class="guide-kicker">${section.title}</p><h2>${section.desc}</h2><p><a href="${section.url}">Open the full ${section.title.toLowerCase()} hub</a></p></div><div class="guide-hub-grid">${guides.map(guideCard).join("")}</div></section>`;
    }).join("")}
    ${routeFinalStrip("Guide library")}
    ${requestMegaCta("Missing a practical guide?", "Send the tool output or publishing decision that still feels unclear. Clickoz will turn useful requests into a focused guide or matching utility.")}
  </main>`;
  return page({
    active: "guides",
    bodyClass: "bigtext guides-page guide-hub-page",
    title: "Clickoz Guides - SEO, Writing, Creator and Developer Guides",
    description: "Practical guides for SEO snippets, readable drafts, JSON fixes, UTM tracking and YouTube uploads, linked to free Clickoz tools.",
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
      "description": "Clickoz is a browser-first toolbox for SEO, creators, writing and developer jobs.",
      "isPartOf": { "@type": "WebSite", "name": "Clickoz", "url": ORIGIN + "/" },
      "about": {
        "@type": "Organization",
        "name": "Clickoz",
        "url": ORIGIN + "/",
        "logo": `${ORIGIN}${BRAND.logoPng}`
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
      <article class="authority-card"><div class="authority-card-head"><span>02</span><h2>Next action over novelty</h2></div><p>A tool is only useful if the next step is obvious. Clickoz connects tools, guides and internal links so users do not restart every task.</p></article>
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
    description: "Learn why Clickoz exists: browser-first SEO, creator, writing and developer tools connected to practical guides, no-upload routines and clean internal structure.",
    canonical: "/about/",
    jsonLd: schema,
    main
  });
}

function updatesPage() {
  const releases = [
    ["v3.7", "Reactive app runtime", "May 2026", "Tools, guides and updates gained route state, reveal motion, scroll feedback, internal prefetch and stronger responsive surfaces.", ["App runtime", "Motion", "Performance", "UX"]],
    ["v3.6", "Authority foundation pass", "May 2026", "Brand, About, guide hubs, schema and mobile-safe structure now support Clickoz as a product instead of a generic tool list.", ["Brand identity", "Guide hubs", "Schema", "Mobile stability"]],
    ["v3.5", "Tool CMS standardization", "May 2026", "Tool pages share examples, first-use cards, related guides, related tools, SEO support and copy actions.", ["Tools", "Examples", "Internal links", "SEO"]],
    ["v3.4", "Premium visual polish", "May 2026", "Buttons, hover states, footer, cards, nav, theme colors and tool layout received a full visual correction pass.", ["Design", "UI", "Theme", "CMS"]],
    ["v3.3", "Creator packaging lane", "May 2026", "YouTube and social creator tools were expanded for titles, thumbnails, descriptions, hashtags, replies, hooks and tracking.", ["Creator", "YouTube", "Social", "Tracking"]],
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
      "publisher": publisherNode(ORIGIN),
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
            <a href="/guides/"><b>${cms.guides.length}</b><span>Guide pages</span></a>
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
    <section id="all" class="updates-box">
      <section class="updates-control-panel" aria-label="Filter release history">
        <div><p class="guide-kicker">RELEASE BOARD</p><h2>Filter by impact.</h2><p>Use the board when you want to see only tool, guide, SEO, performance or UX work.</p></div>
        <div class="updates-filter-buttons" role="group" aria-label="Release filters">
          <button class="active" type="button" data-release-filter="all" aria-pressed="true">All</button>
          <button type="button" data-release-filter="tools">Tools</button>
          <button type="button" data-release-filter="guide">Guides</button>
          <button type="button" data-release-filter="seo">SEO</button>
          <button type="button" data-release-filter="performance">Performance</button>
          <button type="button" data-release-filter="ux">UX</button>
        </div>
        <p class="updates-filter-status" aria-live="polite">Showing ${releases.length} releases</p>
      </section>
      <div class="authority-head"><p class="guide-kicker">RELEASE HISTORY</p><h2>Changelog with context.</h2><p>Version notes explain what changed and why it matters for users, SEO and the CMS foundation.</p></div>
      <div class="updates-grid release-lab-grid">${releases.map(([version, title, date, copy, tags]) => `<article class="release-card" data-release-tags="${tags.join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ")}"><div class="release-meta"><div class="release-left"><span class="release-version">${version}</span><div><h3>${title}</h3><span>${date}</span></div></div><span class="release-type">Release</span></div><p>${copy}</p><div class="release-tags">${tags.map((tag) => `<span>${tag}</span>`).join("")}</div></article>`).join("")}</div>
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
    ${routeFinalStrip("Updates page")}
    ${requestMegaCta("Report a weak page or missing workflow", "Send the page, tool or guide that still feels confusing. The request becomes a concrete CMS improvement target instead of a hidden note.")}
  </main>`;
  return page({
    active: "updates",
    title: "Clickoz Updates - Tool, Guide, SEO and CMS Improvements",
    description: "Follow Clickoz updates for tool fixes, guide rewrites, SEO structure, schema coverage, UX polish and mobile performance.",
    canonical: "/updates/",
    og: "/assets/og/updates.svg",
    jsonLd: schema,
    main
  });
}

function removedLegacyRoutePage() {
  throw new Error("Removed legacy route; use tools and guides instead.");
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    "/",
    "/about/",
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
    ...cms.tools.map((tool) => tool.url),
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
      .replace(/\/assets\/site\.css\?v=\d+/g, asset("/assets/site.css", "siteCss"))
      .replace(/\/assets\/home\.css\?v=\d+/g, asset("/assets/home.css", "homeCss"))
      .replace(/\/assets\/home-leadership\.css\?v=\d+/g, asset("/assets/home-leadership.css", "homeLeadershipCss"))
      .replace(/\/assets\/home\.js\?v=\d+/g, asset("/assets/home.js", "homeJs"))
      .replace(/\/assets\/cms-registry\.js\?v=\d+/g, asset("/assets/cms-registry.js", "cmsRegistry"))
      .replace(/\/assets\/clickoz-premium\.css\?v=\d+/g, asset("/assets/clickoz-premium.css", "clickozPremiumCss"))
      .replace(/\/assets\/guide-premium\.css\?v=\d+/g, asset("/assets/guide-premium.css", "guidePremiumCss"))
      .replace(/\/assets\/guide-premium\.js\?v=\d+/g, asset("/assets/guide-premium.js", "guidePremiumJs"))
      .replace(/\/tools\/tools\.css\?v=\d+/g, asset("/tools/tools.css", "toolsCss"))
      .replace(/\/tools\/cms-tools\.css\?v=\d+/g, asset("/tools/cms-tools.css", "cmsToolsCss"))
      .replace(/\/tools\/cms-tools\.js\?v=\d+/g, asset("/tools/cms-tools.js", "cmsToolsJs"))
      .replace(/\/assets\/cms-final\.css\?v=\d+/g, asset("/assets/cms-final.css", "cmsFinal"))
      .replace(/\/assets\/cms-schema\.js\?v=\d+/g, asset("/assets/cms-schema.js", "cmsSchema"))
      .replace(/\/assets\/cms-enhance\.js\?v=\d+/g, asset("/assets/cms-enhance.js", "cmsEnhance"))
      .replace(/\/assets\/site\.js\?v=\d+/g, asset("/assets/site.js", "siteJs"))
      .replace(/\/assets\/clickoz-premium\.js\?v=\d+/g, asset("/assets/clickoz-premium.js", "clickozPremiumJs"));
    html = html
      .replace(/<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml" \/>\s*<link rel="apple-touch-icon"[^>]*>/g, iconLinks())
      .replace(/<meta name="robots" content="([^"]*)" \/>/g, (match, content) => content.includes("noindex") ? match : `<meta name="robots" content="${INDEX_ROBOTS}" />`)
      .replace(/<meta name="theme-color" content="[^"]*" \/>/g, `<meta name="theme-color" content="${BRAND.themeColor}" />`);
    if (!html.includes(BRAND.favicon32)) {
      html = html.replace(/<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml" \/>/g, iconLinks());
    }
    if (!html.includes('rel="icon"') && /<link rel="stylesheet"/.test(html)) {
      html = html.replace(/(<link rel="stylesheet")/, `${iconLinks()}\n  $1`);
    }
    if (!html.includes('name="robots"') && /<link rel="canonical" href="[^"]*" \/>/.test(html)) {
      html = html.replace(/(<link rel="canonical" href="[^"]*" \/>\s*)/, `$1  <meta name="robots" content="${INDEX_ROBOTS}" />\n`);
    }
    if (!html.includes('name="googlebot"') && /<meta name="robots" content="([^"]*)" \/>/.test(html)) {
      html = html.replace(/(<meta name="robots" content="([^"]*)" \/>\s*)/, `$1  <meta name="googlebot" content="$2" />\n`);
    }
    if (!html.includes('name="application-name"')) {
      html = html.replace(/(<meta name="googlebot" content="[^"]*" \/>\s*)/, `$1  <meta name="application-name" content="${BRAND.name}" />\n  <meta name="apple-mobile-web-app-title" content="${BRAND.name}" />\n`);
    }
    if (!html.includes('rel="manifest"') && html.includes(BRAND.faviconSvg)) {
      html = html.replace(/(<link rel="apple-touch-icon"[^>]*>\s*)/, `$1  <link rel="manifest" href="${BRAND.manifest}" />\n`);
    }
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
  const cleanTitle = title.replace(/[.]+$/, "");
  return page({
    active: "home",
    title: `${code} - ${title} | Clickoz`,
    description: `${cleanTitle}. Use Clickoz recovery links to continue to tools, guides, updates or contact.`,
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
      <article class="trust-card"><h3>Text route</h3><p>Count, clean and improve draft readability.</p><p><a href="/tools/word-counter/">Open Word Counter</a></p></article>
      <article class="trust-card"><h3>SEO route</h3><p>Fix snippets, metadata, URLs and internal links.</p><p><a href="/tools/meta-tags/">Open Meta Tags</a></p></article>
      <article class="trust-card"><h3>Developer route</h3><p>Format JSON, encode URLs and inspect payloads.</p><p><a href="/tools/json-formatter/">Open JSON Formatter</a></p></article>
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
