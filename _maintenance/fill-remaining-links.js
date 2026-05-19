const fs = require("fs");
const path = require("path");

const root = process.cwd();

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function nav(active) {
  return `<nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home"><span class="logo-badge" id="logoBadge" aria-hidden="true">C</span><span class="logo-text">Click<span class="logo-oz">oz</span></span></a>
      <div class="nav-links" aria-label="Sections"><a href="/">Home</a><a href="/tools/"${active === "tools" ? ' class="active" aria-current="page"' : ""}>Tools</a><a href="/guides/"${active === "guides" ? ' class="active" aria-current="page"' : ""}>Guides</a><a href="/updates/">Updates</a></div>
      <div class="spacer"></div>
    </div>
  </nav>`;
}

function layout({ title, description, canonical, active, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="https://clickoz.com${canonical}" />
  <meta name="robots" content="index,follow" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/site.css?v=6" />
  <link rel="stylesheet" href="/tools/tool-improvements.css?v=1" />
</head>
<body class="bigtext">
  <div id="clickozParticles" aria-hidden="true"></div>
  <div class="__grain" aria-hidden="true"></div>
  ${nav(active)}
  ${body}
  <script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function guide(title, description, slug, toolHref, example) {
  return layout({
    title: `${title} | Clickoz`,
    description,
    canonical: `/guides/${slug}/`,
    active: "guides",
    body: `<section class="section container cz-guide-shell">
      <div class="cz-hero">
        <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/guides/">Guides</a><span>/</span><span>${esc(title)}</span></nav>
        <h1>${esc(title)}</h1>
        <p>${esc(description)}</p>
      </div>
      <div class="cz-guide-layout">
        <article>
          <section class="cz-guide-card"><h2>Why it matters</h2><p>This guide exists because the related Clickoz tool should not be a dead end. A good workflow explains when to use the tool, what to check first, and what to ignore when the metric is not useful.</p></section>
          <section class="cz-guide-card"><h2>Workflow</h2><ol><li>Start with a real page, link or snippet.</li><li>Run the related tool once to find the biggest issue.</li><li>Fix the issue manually instead of chasing every possible number.</li><li>Run the tool again and compare the before/after result.</li><li>Save the final pattern so future pages stay consistent.</li></ol></section>
          <section class="cz-guide-card"><h2>Example</h2><p>${esc(example)}</p></section>
          <section class="cz-guide-card"><h2>Checklist</h2><ul><li>The result is readable on mobile.</li><li>The page has one clear next action.</li><li>Internal links support the same workflow.</li><li>No placeholder copy remains.</li><li>The final output is checked before publishing.</li></ul></section>
          <section class="cz-guide-card"><h2>Common mistake</h2><p>Do not use a tool result as a substitute for judgment. A number can reveal a problem, but it cannot decide whether the page is helpful.</p></section>
        </article>
        <aside class="cz-aside"><div class="cz-guide-card"><h2>Related tool</h2><p><a class="cz-btn primary" href="${toolHref}">Open tool</a></p></div></aside>
      </div>
    </section>`
  });
}

const extraGuides = [
  ["base64url-vs-base64", "Base64URL vs Base64", "Understand why URL-safe Base64 changes characters and padding.", "/tools/base64/", "Base64URL replaces `+` and `/` so encoded values can live safely in URLs and JWT segments."],
  ["core-web-vitals-tools-sites", "Core Web Vitals for Tool Sites", "Keep utility pages fast, stable and usable on mobile.", "/tools/", "A tool page with heavy animation may feel premium, but if the input jumps while typing, the workflow feels broken."],
  ["debugging-tokens", "Debugging Tokens Safely", "Inspect encoded payloads without treating decoded text as proof of validity.", "/tools/base64/", "Decoding a JWT payload can show claims, but signature verification is a separate security step."],
  ["encoding-vs-escaping", "Encoding vs Escaping", "Know the difference between URL encoding, Base64 and HTML entity escaping.", "/tools/html-entity-encoder/", "Encode URLs for transport, escape HTML for display, and use Base64 only when binary-safe text is needed."],
  ["fix-broken-html", "Fix Broken HTML Characters", "Clean unsafe HTML snippets before placing them inside a page or CMS.", "/tools/html-entity-encoder/", "If a title contains `<` or `&`, escape it before showing it inside code examples."],
  ["fix-broken-utm-parameters", "Fix Broken UTM Parameters", "Repair messy campaign links before sharing them across channels.", "/tools/utm-builder/", "A raw ampersand inside a campaign value can split a parameter and break analytics reporting."],
  ["html-entities", "HTML Entities: Encode Special Characters Safely", "Escape special characters before placing text inside HTML examples.", "/tools/html-entity-encoder/", "Use `&amp;` when an ampersand should be visible text instead of starting an entity."],
  ["instagram-bio-utm", "Instagram Bio UTM Links", "Create short and consistent tracking links for bio campaigns.", "/tools/utm-builder/", "Use a stable campaign name so every bio link variant is easy to compare later."],
  ["internal-linking-tools-sites", "Internal Linking for Tool Sites", "Connect tools and guides in a way that helps users continue their workflow.", "/tools/", "A JSON guide should link to the formatter, minifier and URL encoder when those tools support the same debugging job."],
  ["jwt-basics", "JWT Basics for Debugging", "Understand JWT parts before inspecting encoded payloads.", "/tools/base64/", "A JWT has header, payload and signature; decoding only reads the first two pieces."],
  ["keyword-variations", "Keyword Variations for SEO Content", "Use natural related terms without repeating the same phrase too often.", "/tools/keyword-density/", "If every heading repeats the exact keyword, rewrite some headings around user questions."],
  ["meta-tags-checklist", "Meta Tags Checklist", "Check titles, descriptions and social metadata before publishing.", "/tools/meta-tags/", "A good meta description names the page's benefit and avoids generic filler like best guide online."],
  ["query-string-best-practices", "Query String Best Practices", "Keep tracking links readable, encoded and consistent.", "/tools/url-encoder/", "Always encode query values that contain spaces, ampersands or punctuation."],
  ["readability-for-ranking", "Readability for Ranking", "Improve clarity without flattening useful technical content.", "/tools/readability-analyzer/", "Shorter sentences help, but definitions and examples matter more than a perfect score."],
  ["serp-preview", "SERP Preview Guide", "Preview search snippets before publishing important pages.", "/tools/serp-preview/", "Compare two title variants and choose the one that states the exact tool or benefit first."],
  ["url-encoding-basics", "URL Encoding Basics", "Understand the safest way to encode query values.", "/tools/url-encoder/", "Encode a single value when building query strings; do not double-encode a full URL."],
  ["utm-best-practices", "UTM Best Practices", "Standardize campaign naming before links spread across channels.", "/tools/utm-builder/", "Pick lowercase campaign names and reuse the same source/medium values across campaigns."],
  ["youtube-tracking-links", "YouTube Tracking Links", "Build trackable links for descriptions, pinned comments and campaigns.", "/tools/utm-builder/", "Use `utm_source=youtube` and separate video campaigns with clear campaign names."]
];

for (const [slug, title, description, toolHref, example] of extraGuides) {
  write(path.join(root, "guides", slug, "index.html"), guide(title, description, slug, toolHref, example));
}

const redirects = [
  ["tools/base64-encode-decode", "/tools/base64/"],
  ["tools/html-entity-encoder", "/tools/entity-encoder/"],
  ["tools/html-entity-encoder-decoder", "/tools/entity-encoder/"],
  ["tools/meta-tag-optimizer", "/tools/meta-tags/"],
  ["tools/url-encoder-decoder", "/tools/url-encoder/"]
];
for (const [from, to] of redirects) {
  write(path.join(root, from, "index.html"), `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="https://clickoz.com${to}"><title>Redirecting | Clickoz</title></head><body><p>Redirecting to <a href="${to}">${to}</a>.</p></body></html>`);
}

write(path.join(root, "about", "index.html"), layout({
  title: "About Clickoz",
  description: "Clickoz is a privacy-first hub of browser tools for SEO, writing and developer workflows.",
  canonical: "/about/",
  active: "",
  body: `<section class="section container cz-guide-shell"><div class="cz-hero"><h1>About Clickoz</h1><p>Clickoz helps people fix content, data and links quickly without signup-heavy workflows.</p></div><div class="cz-guide-card"><h2>What improved</h2><p>The site now keeps the original rich tools, repairs broken pages, adds missing guides and improves SEO support around each workflow.</p><p><a class="cz-btn primary" href="/tools/">Open tools</a></p></div></section>`
}));

write(path.join(root, "workflows", "index.html"), layout({
  title: "Clickoz Workflows",
  description: "Tool combinations for SEO publishing, JSON debugging, campaign tracking and text cleanup.",
  canonical: "/workflows/",
  active: "",
  body: `<section class="section container cz-guide-shell"><div class="cz-hero"><h1>Clickoz workflows</h1><p>Use these combinations when one tool is not enough.</p></div><div class="cz-guide-card"><h2>Publish a page</h2><p>Word Counter -> Readability Analyzer -> Keyword Density Checker -> Meta Tag Optimizer -> SERP Preview.</p><h2>Debug data</h2><p>JSON Formatter -> JSON Minifier -> URL Encoder -> Base64.</p><h2>Clean copied text</h2><p>Whitespace Cleaner -> Text Case Converter -> Slug Generator.</p></div></section>`
}));

fs.mkdirSync(path.join(root, "assets"), { recursive: true });
fs.writeFileSync(path.join(root, "assets", "apple-touch-icon.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIElEQVR4AWP8z8Dwn4ECwESJ5lEDRg0YNWDUgFEDBgBUdQIfT3zfWQAAAABJRU5ErkJggg==", "base64"));

console.log(`Added ${extraGuides.length} guide pages, ${redirects.length} redirects, about/workflows and apple-touch-icon.`);
