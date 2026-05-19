const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function posix(p) {
  return p.split(path.sep).join("/");
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, content) {
  const full = path.join(root, rel);
  mkdirp(path.dirname(full));
  fs.writeFileSync(full, content, "utf8");
}

function walk(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (!predicate || predicate(full)) out.push(full);
  }
  return out;
}

const siteCss = String.raw`
/* Clickoz Premium Futuristic Layer */
:root {
  --cz-bg0: #070b13;
  --cz-bg1: #091522;
  --cz-ink: rgba(248, 252, 255, .94);
  --cz-soft: rgba(248, 252, 255, .70);
  --cz-faint: rgba(248, 252, 255, .52);
  --cz-line: rgba(148, 235, 255, .18);
  --cz-line-strong: rgba(148, 235, 255, .34);
  --cz-hot: #5df2ff;
  --cz-pink: #ff4fd8;
  --cz-lime: #b6ff68;
  --cz-violet: #8b7cff;
  --cz-panel: rgba(8, 16, 30, .76);
  --cz-panel2: rgba(12, 23, 40, .88);
}

html { scroll-behavior: smooth; }
body {
  background:
    linear-gradient(180deg, rgba(7, 11, 19, .88), rgba(7, 11, 19, .96)),
    radial-gradient(circle at 18% 12%, rgba(93, 242, 255, .18), transparent 34%),
    radial-gradient(circle at 80% 4%, rgba(255, 79, 216, .13), transparent 30%),
    radial-gradient(circle at 50% 92%, rgba(139, 124, 255, .14), transparent 36%),
    #070b13 !important;
  color: var(--cz-ink);
}

body::before {
  background:
    radial-gradient(900px 520px at var(--cz-mx, 50%) var(--cz-my, 20%), rgba(93, 242, 255, .18), transparent 58%),
    radial-gradient(1200px 700px at 12% 0%, rgba(255, 79, 216, .10), transparent 60%),
    radial-gradient(1200px 780px at 88% 0%, rgba(182, 255, 104, .08), transparent 62%) !important;
  opacity: .9 !important;
  filter: blur(42px) saturate(1.2) !important;
}

.nav {
  background: rgba(5, 9, 16, .72) !important;
  border-bottom: 1px solid rgba(93, 242, 255, .16) !important;
  box-shadow: 0 14px 60px rgba(0,0,0,.32);
}

.nav-inner { min-height: 78px; }
.logo-text, .logo-oz { letter-spacing: 0 !important; }
.nav-links a,
.m-link {
  border: 1px solid transparent;
  transition: border-color .18s ease, background .18s ease, transform .18s ease;
}
.nav-links a:hover,
.nav-links a.active,
.nav-links a[aria-current="page"] {
  background: linear-gradient(180deg, rgba(93, 242, 255, .18), rgba(93, 242, 255, .08)) !important;
  border-color: rgba(93, 242, 255, .26);
  color: #fff !important;
}

.hero-box,
.tools-hero,
.guides-hero,
.updates-hero,
.updates-box,
.tool-section,
.cz-panel,
.guide-x,
.release-card,
.card,
.small-card,
.pick-card,
.workflow-card,
.lane,
.faq,
.seo-boost,
.donate-box {
  border-color: var(--cz-line) !important;
  background:
    linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
    radial-gradient(600px 260px at 16% 0%, rgba(93, 242, 255, .12), transparent 66%),
    rgba(8, 16, 30, .78) !important;
  box-shadow:
    0 24px 80px rgba(0,0,0,.36),
    inset 0 1px 0 rgba(255,255,255,.08) !important;
}

.hero-box,
.tools-hero,
.guides-hero,
.updates-hero,
.updates-box,
.tool-section,
.cz-panel {
  border-radius: 22px !important;
}

.card,
.small-card,
.guide-x,
.release-card,
.pick-card,
.workflow-card,
.lane,
.faq {
  border-radius: 18px !important;
}

.card:hover,
.small-card:hover,
.guide-x:hover,
.release-card:hover,
.pick-card:hover,
.workflow-card:hover,
.lane:hover {
  border-color: var(--cz-line-strong) !important;
  box-shadow:
    0 28px 90px rgba(0,0,0,.44),
    0 0 0 1px rgba(93, 242, 255, .12),
    0 0 48px rgba(93, 242, 255, .10) !important;
}

.section-title,
.tools-title,
.updates-title,
.guide-article h1,
.cz-hero h1 {
  color: #fff !important;
  letter-spacing: 0 !important;
  text-shadow: 0 0 42px rgba(93,242,255,.16), 0 18px 70px rgba(0,0,0,.54);
}

.section-sub,
.tools-sub,
.updates-sub,
.guide-article p,
.guide-article li,
.cz-hero p {
  color: var(--cz-soft) !important;
}

.btn,
.cz-btn,
.tool-cta,
.guide-cta,
.release-more,
.chip,
.rec-refresh {
  border-color: rgba(93,242,255,.20) !important;
  background:
    linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035)),
    rgba(8,18,30,.70) !important;
  color: rgba(248,252,255,.92) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 34px rgba(0,0,0,.24);
}
.btn-accent,
.btn.primary,
.cz-btn.primary,
.cookie .primary {
  background:
    linear-gradient(135deg, rgba(93,242,255,.95), rgba(139,124,255,.88)) !important;
  color: #061018 !important;
  border-color: rgba(255,255,255,.20) !important;
  box-shadow: 0 18px 48px rgba(93,242,255,.20) !important;
}

input,
textarea,
select,
.search,
.cz-input,
.cz-textarea {
  background: rgba(4, 10, 18, .72) !important;
  border-color: rgba(93,242,255,.18) !important;
  color: var(--cz-ink) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 16px 40px rgba(0,0,0,.22);
}

input:focus,
textarea:focus,
select:focus,
.search:focus,
.cz-input:focus,
.cz-textarea:focus {
  border-color: rgba(93,242,255,.48) !important;
  box-shadow: 0 0 0 4px rgba(93,242,255,.12), 0 20px 55px rgba(0,0,0,.32) !important;
}

.cz-neon-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  opacity: .14;
  background-image:
    linear-gradient(rgba(93,242,255,.32) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93,242,255,.32) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, transparent, #000 14%, #000 78%, transparent);
}

.cz-scanline {
  position: fixed;
  left: 0;
  right: 0;
  top: -20vh;
  height: 20vh;
  pointer-events: none;
  z-index: -1;
  opacity: .18;
  background: linear-gradient(to bottom, transparent, rgba(93,242,255,.12), transparent);
  animation: czScan 9s linear infinite;
}
@keyframes czScan {
  to { transform: translateY(130vh); }
}

.cz-orb {
  position: fixed;
  width: 420px;
  height: 420px;
  border-radius: 999px;
  right: -180px;
  top: 20vh;
  pointer-events: none;
  z-index: -2;
  opacity: .22;
  background:
    radial-gradient(circle at 38% 38%, rgba(93,242,255,.62), transparent 30%),
    radial-gradient(circle at 62% 58%, rgba(255,79,216,.46), transparent 34%);
  filter: blur(20px) saturate(1.35);
}

.premium-link-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.premium-link-grid a {
  text-decoration: none;
  border: 1px solid rgba(93,242,255,.18);
  background: rgba(255,255,255,.045);
  border-radius: 999px;
  padding: 10px 12px;
  color: rgba(248,252,255,.88);
  font-size: 13px;
  font-weight: 900;
}

@media (max-width: 760px) {
  .hero-box,
  .tools-hero,
  .guides-hero,
  .updates-hero,
  .updates-box,
  .tool-section,
  .cz-panel { border-radius: 16px !important; }
}
`;

const siteJs = String.raw`
(() => {
  "use strict";
  document.documentElement.classList.add("cz-premium-ready");
  const grid = document.createElement("div");
  grid.className = "cz-neon-grid";
  grid.setAttribute("aria-hidden", "true");
  const scan = document.createElement("div");
  scan.className = "cz-scanline";
  scan.setAttribute("aria-hidden", "true");
  const orb = document.createElement("div");
  orb.className = "cz-orb";
  orb.setAttribute("aria-hidden", "true");
  document.body.prepend(orb);
  document.body.prepend(scan);
  document.body.prepend(grid);

  let raf = 0;
  window.addEventListener("pointermove", (event) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const x = Math.round((event.clientX / Math.max(1, innerWidth)) * 100);
      const y = Math.round((event.clientY / Math.max(1, innerHeight)) * 100);
      document.documentElement.style.setProperty("--cz-mx", x + "%");
      document.documentElement.style.setProperty("--cz-my", y + "%");
      raf = 0;
    });
  }, { passive: true });

  const cards = document.querySelectorAll(".card,.small-card,.guide-x,.release-card,.pick-card,.workflow-card,.lane");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", (event.clientX - rect.left) + "px");
      card.style.setProperty("--spot-y", (event.clientY - rect.top) + "px");
    }, { passive: true });
  });
})();
`;

write("assets/clickoz-premium.css", siteCss.trim() + "\n");
write("assets/clickoz-premium.js", siteJs.trim() + "\n");

for (const full of walk(root, (file) => file.endsWith(".html"))) {
  let html = fs.readFileSync(full, "utf8");
  if (!html.includes("/assets/clickoz-premium.css")) {
    html = html.replace("</head>", '  <link rel="stylesheet" href="/assets/clickoz-premium.css?v=1" />\n</head>');
  }
  if (!html.includes("/assets/clickoz-premium.js")) {
    html = html.replace("</body>", '  <script src="/assets/clickoz-premium.js?v=1" defer></script>\n</body>');
  }
  fs.writeFileSync(full, html, "utf8");
}

const visuals = {
  seo: ["SEO workflow", "Search intent", "SERP preview", "Internal links"],
  writing: ["Writing workflow", "Scanability", "Structure", "Copy-ready"],
  dev: ["Developer workflow", "Validate", "Encode", "Debug"],
  creator: ["Creator workflow", "Title", "Thumbnail", "Analytics"],
  youtube: ["YouTube workflow", "Hook", "Thumbnail", "Description"],
  tracking: ["Tracking workflow", "UTM", "Source", "Campaign"]
};

for (const [name, labels] of Object.entries(visuals)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${labels[0]} visual">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07101d"/>
      <stop offset=".52" stop-color="#101a33"/>
      <stop offset="1" stop-color="#061018"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5df2ff"/>
      <stop offset=".5" stop-color="#8b7cff"/>
      <stop offset="1" stop-color="#ff4fd8"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
  <g opacity=".18">${Array.from({length:16},(_,i)=>`<path d="M0 ${60+i*34}H1200" stroke="#5df2ff"/>`).join("")}${Array.from({length:24},(_,i)=>`<path d="M${i*54} 0V630" stroke="#5df2ff"/>`).join("")}</g>
  <circle cx="970" cy="120" r="170" fill="#ff4fd8" opacity=".16"/>
  <circle cx="190" cy="520" r="190" fill="#5df2ff" opacity=".16"/>
  <path d="M190 355C330 190 470 460 610 295S880 120 1018 270" fill="none" stroke="url(#line)" stroke-width="8" filter="url(#glow)" stroke-linecap="round"/>
  <g font-family="Inter, Arial, sans-serif" fill="#f8fcff">
    <text x="72" y="120" font-size="58" font-weight="900">${labels[0]}</text>
    <text x="76" y="168" font-size="22" fill="rgba(248,252,255,.68)">A practical Clickoz guide with tools, examples and next steps.</text>
    ${labels.slice(1).map((label,i)=>`<g transform="translate(${104+i*260} 405)"><rect width="210" height="86" rx="22" fill="rgba(255,255,255,.07)" stroke="rgba(93,242,255,.28)"/><text x="24" y="52" font-size="24" font-weight="800">${label}</text></g>`).join("")}
  </g>
</svg>`;
  write(`assets/img/guides/${name}.svg`, svg);
}

const sourceLinks = {
  youtube: [
    ["YouTube thumbnail and title tips", "https://support.google.com/youtube/answer/12340300?hl=en"],
    ["YouTube video description tips", "https://support.google.com/youtube/answer/12948449?hl=en-GB"],
    ["YouTube hashtags help", "https://support.google.com/youtube/answer/6390658?hl=en-EN"],
    ["YouTube Test and Compare thumbnails", "https://support.google.com/youtube/answer/13861714?hl=en-uk"]
  ],
  seo: [
    ["Google helpful content guidance", "https://developers.google.com/search/docs/fundamentals/creating-helpful-content"],
    ["Google SEO starter guide", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide"],
    ["Google sitelinks and internal links", "https://developers.google.com/search/docs/advanced/appearance/sitelinks"]
  ]
};

const toolLinks = [
  ["/tools/meta-tags/", "Meta Tag Optimizer"],
  ["/tools/serp-preview/", "SERP Preview"],
  ["/tools/keyword-density/", "Keyword Density"],
  ["/tools/readability-analyzer/", "Readability Analyzer"],
  ["/tools/word-counter/", "Word Counter"],
  ["/tools/json-formatter/", "JSON Formatter"],
  ["/tools/url-encoder/", "URL Encoder"],
  ["/tools/utm-builder/", "UTM Builder"],
  ["/tools/youtube-title-generator/", "YouTube Title Generator"],
  ["/tools/youtube-hashtag-generator/", "YouTube Hashtag Generator"]
];

const guideData = {
  "seo-content-checklist": ["SEO Content Checklist", "seo", "Audit a page before publishing with intent, structure, links and SERP checks."],
  "how-to-write-meta-title-description": ["How to Write Meta Titles and Descriptions", "seo", "Write search snippets that are clear, useful and click-worthy."],
  "keyword-density-explained": ["Keyword Density: What It Means Now", "seo", "Use density as a diagnostic, not as a ranking shortcut."],
  "readability-for-seo": ["Readability for SEO", "writing", "Make pages easier to scan without flattening the message."],
  "readability-score": ["Readability Score Guide", "writing", "Interpret readability scores and turn them into practical edits."],
  "readability-for-ranking": ["Readability for Ranking", "writing", "Use clarity and structure to support helpful content."],
  "word-count-for-seo": ["Word Count for SEO", "writing", "Choose content length based on intent, not arbitrary word targets."],
  "meta-tags-length": ["Meta Title and Description Length", "seo", "Avoid truncation and keep snippets focused."],
  "meta-tags-checklist": ["Meta Tags Checklist", "seo", "A compact checklist for title, description, canonical and social tags."],
  "serp-preview": ["SERP Preview Guide", "seo", "Preview and refine snippets before publishing."],
  "serp-snippet-ctr": ["SERP Snippets and CTR Testing", "seo", "Plan title and description tests without clickbait."],
  "slug-best-practices": ["Slug Best Practices", "seo", "Create clean URLs that are readable and durable."],
  "internal-linking-tools-sites": ["Internal Linking for Tool Sites", "seo", "Use links to make tools and guides discoverable."],
  "core-web-vitals-tools-sites": ["Core Web Vitals for Tool Sites", "seo", "Keep interactive utilities fast and stable."],
  "keyword-variations": ["Keyword Variations", "seo", "Cover intent with natural variants and supporting sections."],
  "content-brief-template": ["Content Brief Template", "writing", "Create briefs that turn search intent into structure."],
  "text-cleanup-workflow": ["Text Cleanup Workflow", "writing", "Normalize pasted text before publishing or sending."],
  "json-formatter-online": ["JSON Formatter Online Guide", "dev", "Validate, format and inspect JSON without losing context."],
  "json-formatting-debug": ["Fix JSON Errors", "dev", "Debug broken JSON with examples and a clean routine."],
  "url-encoding": ["URL Encoding Explained", "dev", "Understand when and why query strings break."],
  "url-encoding-basics": ["URL Encoding Basics", "dev", "Encode values safely for URLs and forms."],
  "url-encoding-explained": ["URL Encoding Explained in Practice", "dev", "Fix special characters in links and parameters."],
  "fix-broken-utm-parameters": ["Fix Broken UTM Parameters", "tracking", "Diagnose tracking links before campaigns go live."],
  "query-string-best-practices": ["Query String Best Practices", "dev", "Keep parameters readable, encoded and measurable."],
  "base64-decode": ["Base64 Decode Guide", "dev", "Decode payloads for inspection without treating it as encryption."],
  "base64-encode-decode": ["Base64 Encode and Decode", "dev", "Use Base64 safely for payloads and debugging."],
  "base64url-vs-base64": ["Base64URL vs Base64", "dev", "Understand token-safe encoding differences."],
  "debugging-tokens": ["Debugging Tokens", "dev", "Inspect token segments carefully and safely."],
  "jwt-basics": ["JWT Basics", "dev", "Understand header, payload and signature at a practical level."],
  "html-entities": ["HTML Entities Explained", "dev", "Encode special characters without breaking markup."],
  "encoding-vs-escaping": ["Encoding vs Escaping", "dev", "Choose the right protection for the right context."],
  "fix-broken-html": ["Fix Broken HTML", "dev", "Repair messy markup and unsafe characters."],
  "utm-builder-guide": ["UTM Builder Guide", "tracking", "Build campaign links that stay readable in analytics."],
  "utm-best-practices": ["UTM Best Practices", "tracking", "Create naming conventions for campaigns and creators."],
  "youtube-tracking-links": ["YouTube Tracking Links", "youtube", "Track clicks from descriptions, pinned comments and channel links."],
  "instagram-bio-utm": ["Instagram Bio UTM Links", "tracking", "Measure profile and campaign links without messy names."],
  "youtube-title-thumbnail-checklist": ["YouTube Title and Thumbnail Checklist", "youtube", "Plan titles and thumbnails as one click promise."],
  "youtube-description-template": ["YouTube Description Template", "youtube", "Write descriptions that support search, viewers and next actions."],
  "youtube-hashtags-guide": ["YouTube Hashtags Guide", "youtube", "Use hashtags as labels without turning descriptions into spam."],
  "youtube-community-post-ideas": ["YouTube Community Post Ideas", "youtube", "Turn uploads into community posts, polls and teasers."],
  "creator-content-calendar": ["Creator Content Calendar", "creator", "Plan videos, Shorts, posts and tracking links together."]
};

function guideTemplate(slug, [title, group, desc]) {
  const visual = group === "creator" ? "youtube" : group;
  const isYoutube = group === "youtube" || group === "creator" || slug.includes("youtube");
  const sources = isYoutube ? sourceLinks.youtube : sourceLinks.seo;
  const related = Object.entries(guideData)
    .filter(([other, data]) => other !== slug && (data[1] === group || (isYoutube && ["youtube","creator","tracking"].includes(data[1]))))
    .slice(0, 5);
  const canonical = `https://clickoz.com/guides/${slug}/`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Clickoz Guide</title>
  <meta name="description" content="${desc} Includes workflow steps, examples, source notes, internal links and matching Clickoz tools." />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#070b13" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${title} | Clickoz Guide" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="https://clickoz.com/assets/img/guides/${visual}.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/site.css?v=6" />
  <link rel="stylesheet" href="/assets/guide.css?v=2" />
  <link rel="stylesheet" href="/assets/clickoz-premium.css?v=1" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: desc,
    image: `https://clickoz.com/assets/img/guides/${visual}.svg`,
    author: {"@type":"Organization","name":"Clickoz"},
    publisher: {"@type":"Organization","name":"Clickoz","logo":{"@type":"ImageObject","url":"https://clickoz.com/assets/favicon.svg"}},
    mainEntityOfPage: canonical
  })}</script>
</head>
<body class="bigtext page-guide">
  <div id="clickozParticles" aria-hidden="true"></div>
  <div class="__grain" aria-hidden="true"></div>
  <nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home"><span class="logo-badge" id="logoBadge" aria-hidden="true"><svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="logo-text">Click<span class="logo-oz">oz</span></span></a>
      <div class="nav-links" aria-label="Sections"><a href="/">Home</a><a href="/tools/">Tools</a><a href="/guides/" class="active" aria-current="page">Guides</a><a href="/updates/">Updates</a></div>
      <div class="spacer"></div>
    </div>
  </nav>
  <main class="guide-article container">
    <article class="guide-shell">
      <header class="guide-premium-hero">
        <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/guides/">Guides</a><span>/</span><span>${title}</span></nav>
        <div class="guide-hero-grid">
          <div>
            <p class="guide-kicker">${group.toUpperCase()} WORKFLOW</p>
            <h1>${title}</h1>
            <p class="guide-lead">${desc}</p>
            <div class="premium-link-grid">
              ${toolLinks.slice(0, 5).map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
            </div>
          </div>
          <img class="guide-visual" src="/assets/img/guides/${visual}.svg" alt="${title} workflow visual" loading="eager" />
        </div>
      </header>

      <section class="guide-block">
        <h2>What this guide helps you do</h2>
        <p>This guide is written as a practical workflow, not a thin article. Use it to decide what to check, which tool to open, what a good output looks like and what to do next. The goal is to move from a rough idea to a cleaner published asset with fewer guesses.</p>
        <div class="guide-cards">
          <div><strong>Audit</strong><span>Find the weak part before publishing.</span></div>
          <div><strong>Improve</strong><span>Rewrite or format with a clear rule.</span></div>
          <div><strong>Link</strong><span>Send users to the next useful tool or guide.</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Step-by-step workflow</h2>
        <ol class="guide-steps">
          <li><strong>Define the job.</strong> Write the search intent, creator goal or debugging problem in one sentence before touching the tool.</li>
          <li><strong>Run the first check.</strong> Use the matching Clickoz tool to expose length, repeated terms, invalid syntax or missing structure.</li>
          <li><strong>Rewrite only what matters.</strong> Fix the part that blocks the user: unclear title, weak description, broken JSON, messy URL, missing tracking or poor readability.</li>
          <li><strong>Add internal links.</strong> Link to one supporting guide and one matching tool so visitors have a natural next step.</li>
          <li><strong>Review on mobile.</strong> Scan the title, first paragraph, CTA and key output. If it feels dense, simplify before publishing.</li>
        </ol>
      </section>

      <section class="guide-block">
        <h2>Example pattern</h2>
        <div class="example-panel">
          <p><b>Weak:</b> A generic page that explains the topic but gives no next step.</p>
          <p><b>Better:</b> A focused workflow with one clear promise, a short checklist, examples, tool links and a related guide path.</p>
          <p><b>Premium:</b> The page helps the user complete a real task and then routes them to the next useful action inside Clickoz.</p>
        </div>
      </section>

      <section class="guide-block">
        <h2>Recommended tools</h2>
        <div class="guide-related-tools">
          ${toolLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
        </div>
      </section>

      <section class="guide-block">
        <h2>Related guides</h2>
        <div class="guide-related-grid">
          ${related.map(([href, data]) => `<a href="/guides/${href}/"><strong>${data[0]}</strong><span>${data[2]}</span></a>`).join("")}
        </div>
      </section>

      <section class="guide-block">
        <h2>Source notes</h2>
        <p>These references are used as guardrails. The guide avoids fake guarantees and focuses on useful, people-first workflows.</p>
        <ul class="source-list">
          ${sources.map(([label, href]) => `<li><a href="${href}" rel="nofollow noopener" target="_blank">${label}</a></li>`).join("")}
        </ul>
      </section>

      <section class="guide-block guide-faq">
        <h2>FAQ</h2>
        <details open><summary>How long should this workflow take?</summary><p>Most checks take a few minutes. The rewrite takes longer only when the page or video idea is unclear.</p></details>
        <details><summary>Should I optimize for search engines first?</summary><p>No. Start with the user task, then use SEO checks to make the page easier to understand and discover.</p></details>
        <details><summary>What should I link to next?</summary><p>Link to the tool that completes the task and a guide that answers the next likely question.</p></details>
      </section>
    </article>
  </main>
  <footer class="footer"><div class="container footer-grid"><div><h4>Clickoz</h4><div class="footer-links"><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div><div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/youtube-title-generator/">YouTube Title Generator</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/utm-builder/">UTM Builder</a></div></div><div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div></div></footer>
  <script src="/assets/site.js" defer></script>
  <script src="/assets/clickoz-premium.js?v=1" defer></script>
</body>
</html>`;
}

for (const [slug, data] of Object.entries(guideData)) {
  write(`guides/${slug}/index.html`, guideTemplate(slug, data));
}

const guideCss = String.raw`
.guide-article { padding-top: 34px; padding-bottom: 46px; }
.guide-shell { display: grid; gap: 18px; }
.guide-premium-hero,
.guide-block {
  border: 1px solid rgba(93,242,255,.18);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)), rgba(8,16,30,.78);
  box-shadow: 0 24px 80px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.08);
  padding: 22px;
}
.guide-hero-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); gap: 22px; align-items: center; }
.cz-crumbs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; color: rgba(248,252,255,.62); font-size: 13px; font-weight: 800; }
.cz-crumbs a { color: rgba(248,252,255,.78); text-decoration: none; }
.guide-kicker { color: #5df2ff !important; font-size: 12px; font-weight: 900; letter-spacing: .14em; margin: 0 0 10px !important; }
.guide-article h1 { font-size: clamp(40px, 5vw, 72px); line-height: 1.02; margin: 0; }
.guide-lead { font-size: clamp(17px, 2vw, 21px); line-height: 1.65; max-width: 840px; margin: 16px 0 0 !important; }
.guide-visual { width: 100%; border-radius: 20px; border: 1px solid rgba(93,242,255,.18); box-shadow: 0 24px 70px rgba(0,0,0,.34); }
.guide-block h2 { margin: 0 0 12px; font-size: clamp(24px, 3vw, 34px); letter-spacing: 0; }
.guide-block p { line-height: 1.75; margin: 0 0 12px; }
.guide-cards,
.guide-related-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
.guide-cards div,
.guide-related-grid a,
.example-panel,
.guide-related-tools a {
  border: 1px solid rgba(93,242,255,.15);
  background: rgba(255,255,255,.045);
  border-radius: 16px;
  padding: 14px;
  text-decoration: none;
  color: rgba(248,252,255,.90);
}
.guide-cards strong,
.guide-related-grid strong { display:block; color:#fff; margin-bottom:6px; }
.guide-cards span,
.guide-related-grid span { display:block; color:rgba(248,252,255,.66); line-height:1.55; }
.guide-steps { display: grid; gap: 12px; padding-left: 22px; color: rgba(248,252,255,.74); line-height: 1.7; }
.guide-steps strong { color: #fff; }
.guide-related-tools { display: flex; flex-wrap: wrap; gap: 10px; }
.guide-related-tools a { padding: 10px 12px; border-radius: 999px; font-size: 13px; font-weight: 900; }
.source-list { display: grid; gap: 8px; }
.source-list a { color: #8ff7ff; }
.guide-faq details { border: 1px solid rgba(93,242,255,.15); background: rgba(255,255,255,.04); border-radius: 14px; padding: 12px 14px; margin-top: 10px; }
.guide-faq summary { cursor: pointer; font-weight: 900; color: #fff; }
@media (max-width: 900px) {
  .guide-hero-grid,
  .guide-cards,
  .guide-related-grid { grid-template-columns: 1fr; }
}
`;
write("assets/guide.css", guideCss.trim() + "\n");

function toolPage({ slug, title, desc, mode }) {
  const canonical = `https://clickoz.com/tools/${slug}/`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Free Creator Tool | Clickoz</title>
  <meta name="description" content="${desc} Browser-only, copy-ready and built for YouTube creator workflows." />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#070b13" />
  <meta property="og:title" content="${title} | Clickoz" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://clickoz.com/assets/og/default.svg" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/site.css?v=6" />
  <link rel="stylesheet" href="/tools/tool-improvements.css?v=1" />
  <link rel="stylesheet" href="/assets/clickoz-premium.css?v=1" />
  <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication","name":title,"url":canonical,"applicationCategory":"UtilitiesApplication","operatingSystem":"All","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"Clickoz"}})}</script>
</head>
<body class="bigtext">
  <div id="clickozParticles" aria-hidden="true"></div><div class="__grain" aria-hidden="true"></div>
  <nav class="nav" aria-label="Primary navigation" id="topNav"><div class="container nav-inner"><a class="logo" href="/" aria-label="Clickoz Home"><span class="logo-badge" id="logoBadge" aria-hidden="true"><svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="logo-text">Click<span class="logo-oz">oz</span></span></a><div class="nav-links"><a href="/">Home</a><a href="/tools/" class="active">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div><div class="spacer"></div></div></nav>
  <main class="section container cz-tool-shell">
    <div class="cz-hero">
      <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/tools/">Tools</a><span>/</span><span>${title}</span></nav>
      <h1>${title}</h1>
      <p>${desc}</p>
      <div class="cz-trust"><span class="cz-pill">Creator Tools</span><span class="cz-pill">YouTube workflow</span><span class="cz-pill">Copy-ready</span></div>
    </div>
    <section class="cz-panel creator-tool" data-creator-mode="${mode}">
      <div class="cz-grid">
        <div>
          <label class="cz-label" for="idea">Video idea or topic</label>
          <textarea id="idea" class="cz-textarea" data-idea placeholder="Example: how to build a morning routine for busy students"></textarea>
          <div class="cz-field"><label class="cz-label" for="audience">Audience / niche</label><input id="audience" class="cz-input" data-audience placeholder="Example: students, gamers, small business owners" /></div>
          <div class="cz-actions"><button class="cz-btn primary" type="button" data-generate>Generate</button><button class="cz-btn" type="button" data-sample>Load sample</button><button class="cz-btn" type="button" data-copy>Copy output</button><button class="cz-btn" type="button" data-clear>Clear</button></div>
        </div>
        <div>
          <div class="cz-stats" data-stats></div>
          <label class="cz-label" for="output">Output</label>
          <textarea id="output" class="cz-textarea" data-output readonly placeholder="Your creator-ready output appears here"></textarea>
        </div>
      </div>
    </section>
    <section class="hero-box" style="margin-top:18px;text-align:left">
      <h2 class="section-title" style="margin-top:0">How to use this tool</h2>
      <p class="section-sub">Use it before uploading or publishing. Draft several versions, choose the strongest one, then validate the idea against YouTube Studio data and your audience patterns.</p>
      <div class="premium-link-grid"><a href="/guides/youtube-title-thumbnail-checklist/">Title and thumbnail checklist</a><a href="/guides/youtube-description-template/">Description template</a><a href="/guides/youtube-hashtags-guide/">Hashtags guide</a><a href="/tools/utm-builder/">UTM Builder</a></div>
    </section>
  </main>
  <footer class="footer"><div class="container footer-grid"><div><h4>Clickoz</h4><div class="footer-links"><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div><div><h4>Creator tools</h4><div class="footer-links"><a href="/tools/youtube-title-generator/">YouTube Title Generator</a><a href="/tools/youtube-description-generator/">Description Generator</a><a href="/tools/youtube-hashtag-generator/">Hashtag Generator</a><a href="/tools/thumbnail-brief-generator/">Thumbnail Brief</a></div></div><div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div></div></footer>
  <script src="/assets/site.js" defer></script>
  <script src="/tools/creator-tools.js?v=1" defer></script>
  <script src="/assets/clickoz-premium.js?v=1" defer></script>
</body>
</html>`;
}

const creatorTools = [
  { slug: "youtube-title-generator", title: "YouTube Title Generator", mode: "title", desc: "Generate sharper YouTube title angles with hook, keyword and curiosity variants." },
  { slug: "youtube-description-generator", title: "YouTube Description Generator", mode: "description", desc: "Create a clean YouTube description structure with first lines, chapters, links and CTA blocks." },
  { slug: "youtube-hashtag-generator", title: "YouTube Hashtag Generator", mode: "hashtags", desc: "Build a relevant YouTube hashtag mix without stuffing your title or description." },
  { slug: "thumbnail-brief-generator", title: "Thumbnail Brief Generator", mode: "thumbnail", desc: "Turn a video idea into thumbnail concepts with focal point, contrast and text rules." },
  { slug: "community-post-generator", title: "YouTube Community Post Generator", mode: "community", desc: "Generate polls, teasers and update posts that support your next upload." }
];
creatorTools.forEach((tool) => write(`tools/${tool.slug}/index.html`, toolPage(tool)));

const creatorJs = String.raw`
(() => {
  "use strict";
  const root = document.querySelector("[data-creator-mode]");
  if (!root) return;
  const mode = root.dataset.creatorMode;
  const idea = root.querySelector("[data-idea]");
  const audience = root.querySelector("[data-audience]");
  const output = root.querySelector("[data-output]");
  const stats = root.querySelector("[data-stats]");
  const clean = (value) => String(value || "").trim();
  const titleCase = (value) => clean(value).toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
  function setStats(items) {
    stats.innerHTML = items.map(([k,v]) => '<div class="cz-stat"><span>' + k + '</span><strong>' + v + '</strong></div>').join("");
  }
  function generate() {
    const topic = clean(idea.value) || "how to grow a YouTube channel";
    const niche = clean(audience.value) || "creators";
    let result = "";
    if (mode === "title") {
      const core = titleCase(topic);
      result = [
        core + " (Step-by-Step)",
        "I Tried " + core + " for 7 Days",
        core + ": What Actually Works",
        "Stop Doing This If You Want " + core,
        core + " for " + titleCase(niche)
      ].join("\n");
      setStats([["Variants", 5], ["Best length", "45-65 chars"], ["Use", "A/B title ideas"], ["Next", "Thumbnail brief"]]);
    }
    if (mode === "description") {
      result = titleCase(topic) + "\n\nIn this video, I break down the practical steps for " + topic + " so " + niche + " can take action faster.\n\nChapters:\n00:00 Intro\n00:35 Why it matters\n02:10 Step 1\n04:20 Step 2\n06:15 Common mistakes\n08:00 Final checklist\n\nUseful links:\n- Main resource:\n- Related guide:\n- Subscribe for more:\n\n#" + topic.split(/\s+/).slice(0,2).join("") + " #" + niche.split(/\s+/)[0] + " #YouTubeTips";
      setStats([["Structure", "Ready"], ["Chapters", 6], ["Hashtags", 3], ["CTA", "Included"]]);
    }
    if (mode === "hashtags") {
      const base = topic.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 6);
      const nicheWord = niche.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean)[0] || "creator";
      const tags = [...new Set([...base.map((w) => "#" + w), "#" + nicheWord, "#youtubetips", "#creator"])]
        .slice(0, 8);
      result = "Primary hashtags:\n" + tags.slice(0,3).join(" ") + "\n\nOptional extras:\n" + tags.slice(3).join(" ") + "\n\nRule: keep hashtags relevant. Do not turn the description into a tag dump.";
      setStats([["Primary", 3], ["Total", tags.length], ["Risk", "Low stuffing"], ["Placement", "Description"]]);
    }
    if (mode === "thumbnail") {
      result = "Thumbnail brief for: " + titleCase(topic) + "\n\nConcept A: Before/After\n- Left: messy or confusing state\n- Right: clean result\n- Text: 2-4 strong words\n\nConcept B: Big Promise\n- One clear subject\n- High contrast background\n- Text: " + titleCase(topic).split(" ").slice(0,3).join(" ") + "\n\nChecklist:\n- Readable on mobile\n- Face/object large enough\n- No tiny paragraphs\n- Title and thumbnail promise the same idea";
      setStats([["Concepts", 2], ["Text limit", "2-4 words"], ["Mobile", "Priority"], ["Next", "Test variants"]]);
    }
    if (mode === "community") {
      result = "Poll post:\nWhich part of " + topic + " should I cover next?\nA) Beginner steps\nB) Mistakes to avoid\nC) Tools and templates\nD) Real examples\n\nTeaser post:\nWorking on a new video for " + niche + ": " + topic + ". I am testing examples now. What should I include?\n\nFollow-up post:\nThe video is live. Start with the checklist, then tell me which step you want expanded.";
      setStats([["Formats", 3], ["Poll options", 4], ["Use", "Engagement"], ["CTA", "Included"]]);
    }
    output.value = result;
  }
  root.querySelector("[data-generate]")?.addEventListener("click", generate);
  root.querySelector("[data-sample]")?.addEventListener("click", () => {
    idea.value = "how to make better thumbnails without design experience";
    audience.value = "new YouTube creators";
    generate();
  });
  root.querySelector("[data-clear]")?.addEventListener("click", () => { idea.value = ""; audience.value = ""; output.value = ""; stats.innerHTML = ""; });
  root.querySelector("[data-copy]")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(output.value || ""); } catch (_) {} });
  generate();
})();
`;
write("tools/creator-tools.js", creatorJs.trim() + "\n");

let toolsIndex = read("tools/index.html");
const creatorSection = String.raw`<!-- CREATOR -->
      <section class="tool-section" id="creator" data-section="creator" aria-label="Creator tools">
        <div class="section-head">
          <div>
            <div class="section-kicker">
              <div class="section-ico" aria-hidden="true">YT</div>
              <h2 class="section-name">Creator and YouTube Tools</h2>
            </div>
            <p class="section-desc">
              Tools for YouTube titles, thumbnails, descriptions, hashtags, community posts and trackable creator links.
            </p>
          </div>
          <div class="section-count" aria-label="Creator tools count">6 tools</div>
        </div>

        <div class="cards-grid">
          <a class="card" href="/tools/youtube-title-generator/"><div class="card-top"><div class="card-ico" aria-hidden="true">YT</div><div><h3>YouTube Title Generator</h3><p>Create title angles with hook, keyword, curiosity and clarity variants.</p></div></div><span class="tool-cta">Generate Titles</span></a>
          <a class="card" href="/tools/thumbnail-brief-generator/"><div class="card-top"><div class="card-ico" aria-hidden="true">TH</div><div><h3>Thumbnail Brief Generator</h3><p>Plan thumbnail concepts with contrast, focal point and mobile readability.</p></div></div><span class="tool-cta">Build Thumbnail Brief</span></a>
          <a class="card" href="/tools/youtube-description-generator/"><div class="card-top"><div class="card-ico" aria-hidden="true">DS</div><div><h3>YouTube Description Generator</h3><p>Write first lines, chapters, links, CTA blocks and clean hashtag placement.</p></div></div><span class="tool-cta">Generate Description</span></a>
          <a class="card" href="/tools/youtube-hashtag-generator/"><div class="card-top"><div class="card-ico" aria-hidden="true">#</div><div><h3>YouTube Hashtag Generator</h3><p>Create a relevant hashtag mix without stuffing the description.</p></div></div><span class="tool-cta">Generate Hashtags</span></a>
          <a class="card" href="/tools/community-post-generator/"><div class="card-top"><div class="card-ico" aria-hidden="true">CP</div><div><h3>Community Post Generator</h3><p>Generate polls, teasers and follow-up posts around your upload.</p></div></div><span class="tool-cta">Create Posts</span></a>
          <a class="card" href="/tools/utm-builder/"><div class="card-top"><div class="card-ico" aria-hidden="true">UTM</div><div><h3>UTM Builder</h3><p>Build trackable links for YouTube, TikTok, Instagram and newsletters.</p></div></div><span class="tool-cta">Build UTM Link</span></a>
        </div>
      </section>`;
toolsIndex = toolsIndex.replace(/<!-- CREATOR -->[\s\S]*?<\/section>\s*<\/div>\s*<\/section>/, `${creatorSection}\n    </div>\n  </section>`);
toolsIndex = toolsIndex.replace('"numberOfItems":15', '"numberOfItems":20');
write("tools/index.html", toolsIndex);

let home = read("index.html");
const wowHome = String.raw`
  <section class="section container home-wow" aria-label="Clickoz command center">
    <div class="wow-grid">
      <div class="wow-panel wow-main">
        <p class="guide-kicker">COMMAND CENTER</p>
        <h2>One hub for search, writing, code and creator workflows.</h2>
        <p>Clickoz now works like a compact operating system: pick a workflow, open the right tool, read the matching guide, then move to the next action without leaving the site.</p>
        <div class="wow-actions">
          <a class="btn btn-accent" href="/tools/youtube-title-generator/">Try YouTube tools</a>
          <a class="btn btn-outline" href="/guides/youtube-title-thumbnail-checklist/">Read creator guide</a>
        </div>
      </div>
      <div class="wow-panel system-map">
        <div class="map-node core">Clickoz</div>
        <a class="map-node n1" href="/tools/#seo">SEO</a>
        <a class="map-node n2" href="/tools/#creator">Creator</a>
        <a class="map-node n3" href="/tools/#dev">Dev</a>
        <a class="map-node n4" href="/guides/">Guides</a>
      </div>
    </div>
  </section>

  <section class="section container creator-lab" aria-label="Creator lab">
    <div class="hero-box creator-lab-box">
      <div>
        <p class="guide-kicker">CREATOR LAB</p>
        <h2 class="section-title" style="margin-top:0">YouTube tools for the new content workflow.</h2>
        <p class="section-sub">Titles, thumbnails, descriptions, hashtags, community posts and tracking links now live in one creator lane.</p>
      </div>
      <div class="creator-tool-strip">
        <a href="/tools/youtube-title-generator/">Title Generator</a>
        <a href="/tools/thumbnail-brief-generator/">Thumbnail Brief</a>
        <a href="/tools/youtube-description-generator/">Description Generator</a>
        <a href="/tools/youtube-hashtag-generator/">Hashtags</a>
        <a href="/tools/community-post-generator/">Community Posts</a>
        <a href="/tools/utm-builder/">UTM Tracking</a>
      </div>
    </div>
  </section>
`;
if (!home.includes("COMMAND CENTER")) {
  home = home.replace("  <!-- GUIDES (6) -->", wowHome + "\n  <!-- GUIDES (6) -->");
}
home = home.replace('/assets/home.css?v=6', '/assets/home.css?v=7').replace('/assets/home.js?v=2', '/assets/home.js?v=7');
write("index.html", home);

const homeCssPatch = String.raw`

/* Premium home expansion */
.home-wow { padding-top: 8px; }
.wow-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr); gap: 16px; align-items: stretch; }
.wow-panel {
  min-height: 360px;
  border: 1px solid rgba(93,242,255,.18);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025)), rgba(8,16,30,.78);
  box-shadow: 0 28px 90px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.08);
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.wow-main h2 { margin: 0; font-size: clamp(34px, 4.5vw, 62px); line-height: 1.04; letter-spacing: 0; }
.wow-main p:not(.guide-kicker) { max-width: 760px; color: rgba(248,252,255,.72); line-height: 1.7; }
.wow-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.system-map { min-height: 360px; }
.system-map::before {
  content: "";
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  border: 1px solid rgba(93,242,255,.18);
  box-shadow: inset 0 0 80px rgba(93,242,255,.08);
}
.map-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border-radius: 999px;
  border: 1px solid rgba(93,242,255,.28);
  background: rgba(5,12,22,.82);
  color: #fff;
  text-decoration: none;
  font-weight: 1000;
  box-shadow: 0 0 48px rgba(93,242,255,.14);
}
.map-node.core { width: 144px; height: 144px; left: 50%; top: 50%; transform: translate(-50%,-50%); background: linear-gradient(135deg, rgba(93,242,255,.36), rgba(139,124,255,.25)), rgba(5,12,22,.9); }
.map-node.n1 { left: 8%; top: 12%; }
.map-node.n2 { right: 9%; top: 16%; }
.map-node.n3 { left: 12%; bottom: 12%; }
.map-node.n4 { right: 12%; bottom: 10%; }
.creator-lab-box { display: grid; grid-template-columns: minmax(0, .75fr) minmax(0, 1.25fr); gap: 20px; align-items: center; text-align: left; }
.creator-tool-strip { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.creator-tool-strip a {
  min-height: 74px;
  display: flex;
  align-items: center;
  text-decoration: none;
  border: 1px solid rgba(93,242,255,.18);
  border-radius: 16px;
  padding: 14px;
  color: #fff;
  font-weight: 1000;
  background: rgba(255,255,255,.045);
}
@media (max-width: 920px) {
  .wow-grid,
  .creator-lab-box { grid-template-columns: 1fr; }
  .creator-tool-strip { grid-template-columns: 1fr; }
}
`;
fs.appendFileSync(path.join(root, "assets/home.css"), homeCssPatch, "utf8");

let updates = read("updates/index.html");
updates = updates.replace("We rewrite Clickoz. Constantly.", "Clickoz release lab.");
updates = updates.replace("Continuous rewrites, not patchwork fixes", "Design system, SEO, creator tools and content quality upgrades");
updates = updates.replace("</div>\n  </section>\n\n  <!-- FOOTER", `  <section class="updates-showcase" aria-label="Release dashboard">
        <div class="showcase-card"><b>Design</b><span>Futuristic interface, stronger cards, better contrast.</span></div>
        <div class="showcase-card"><b>SEO</b><span>Guide pages, source notes, internal links and structured data.</span></div>
        <div class="showcase-card"><b>Creator</b><span>YouTube tools, templates and tracking workflows.</span></div>
      </section>
    </div>
  </section>

  <!-- FOOTER`);
write("updates/index.html", updates);

const updatesCssPatch = String.raw`

.updates-showcase {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px;
  margin-top: 18px;
}
.showcase-card {
  min-height: 160px;
  border: 1px solid rgba(93,242,255,.18);
  border-radius: 18px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)), rgba(8,16,30,.78);
  box-shadow: 0 22px 60px rgba(0,0,0,.30);
}
.showcase-card b { display:block; font-size: 28px; color:#fff; margin-bottom: 10px; }
.showcase-card span { color: rgba(248,252,255,.70); line-height: 1.6; }
@media (max-width: 860px) { .updates-showcase { grid-template-columns: 1fr; } }
`;
fs.appendFileSync(path.join(root, "updates/updates.css"), updatesCssPatch, "utf8");

function listGuideCards() {
  return Object.entries(guideData).map(([slug, [title, group, desc]]) => `
        <a class="guide-x" href="/guides/${slug}/" data-cat="${group}" data-keywords="${title.toLowerCase()} ${desc.toLowerCase()}">
          <div class="guide-top"><div class="guide-ico" aria-hidden="true">${group === "youtube" || group === "creator" ? "YT" : group === "dev" ? "DEV" : group === "tracking" ? "UTM" : group === "writing" ? "TXT" : "SEO"}</div><div><h3>${title}</h3><p>${desc}</p></div></div>
          <div class="guide-bottom"><div class="guide-tag">${group.toUpperCase()}</div><div class="guide-cta">Read guide</div></div>
        </a>`).join("\n");
}
let guidesIndex = read("guides/index.html");
guidesIndex = guidesIndex.replace(/<div class="guides-grid" id="guidesGrid" aria-label="Guides list">[\s\S]*?<\/div>\s*\n\s*<div class="seo-boost"/, `<div class="guides-grid" id="guidesGrid" aria-label="Guides list">\n${listGuideCards()}\n      </div>\n\n      <div class="seo-boost"`);
guidesIndex = guidesIndex.replace('"numberOfItems":12', `"numberOfItems":${Object.keys(guideData).length}`);
write("guides/index.html", guidesIndex);

let sitemap = read("sitemap.xml");
const extraUrls = [
  ...creatorTools.map((t) => `/tools/${t.slug}/`),
  ...["youtube-title-thumbnail-checklist","youtube-description-template","youtube-hashtags-guide","youtube-community-post-ideas","creator-content-calendar"].map((g) => `/guides/${g}/`)
];
for (const url of extraUrls) {
  const loc = `https://clickoz.com${url}`;
  if (!sitemap.includes(loc)) {
    sitemap = sitemap.replace("</urlset>", `  <url><loc>${loc}</loc></url>\n</urlset>`);
  }
}
write("sitemap.xml", sitemap);

console.log("Premium overhaul complete");
