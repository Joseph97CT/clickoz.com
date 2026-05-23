const fs = require("fs");
const path = require("path");
const { ORIGIN, CSP, PERMISSIONS_POLICY, asset } = require("./cms-config");

const root = path.resolve(__dirname, "..");
const today = "2026-05-18";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function write(rel, content) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, out);
    else if (item.isFile() && item.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function loadRegistry() {
  const code = read("assets/cms-registry.js");
  const sandbox = { window: {} };
  Function("window", code + "\nreturn window.ClickozCMS;")(sandbox.window);
  return sandbox.window.ClickozCMS;
}

const cms = loadRegistry();

function ensureScripts() {
  const files = walk(root).filter((file) => !file.includes(`${path.sep}_maintenance${path.sep}`));
  for (const file of files) {
    let html = fs.readFileSync(file, "utf8");
    const siteScriptPattern = /(\s*<script src="\/assets\/site\.js[^"]*"(?: defer)?><\/script>)/;
    if (!html.includes("/assets/cms-registry.js")) {
      html = html.replace(siteScriptPattern, `\n  <script src="${asset("/assets/cms-registry.js", "cmsRegistry")}" defer></script>\n  <script src="${asset("/assets/cms-schema.js", "cmsSchema")}" defer></script>\n  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>$1`);
    } else if (!html.includes("/assets/cms-enhance.js")) {
      html = html.replace(siteScriptPattern, `\n  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>$1`);
    }
    html = html.replace(/\/assets\/cms-final\.css\?v=\d+/g, asset("/assets/cms-final.css", "cmsFinal"));
    fs.writeFileSync(file, html, "utf8");
  }
}

function clusterTemplate(key) {
  const cluster = cms.clusters[key];
  const tools = cms.tools.filter((tool) => tool.category === key);
  const guides = cms.guides.filter((guide) => guide.category === key || (key === "youtube" && guide.category === "creator"));
  const title = `${cluster.title} by Clickoz`;
  const desc = `${cluster.description} Open the right tool, read the matching guide and finish the workflow faster.`;
  const og = `/assets/og/${key}-tools.svg`;

  const card = (item, type) => `<a class="cluster-card" href="${item.url}">
            <span class="cluster-card-type">${type}</span>
            <strong>${item.title}</strong>
            <span>${item.description}</span>
          </a>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="${PERMISSIONS_POLICY}" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${ORIGIN}${cluster.url}" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#0b0f19" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${ORIGIN}${cluster.url}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${ORIGIN}${og}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ORIGIN}${og}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="${asset("/assets/site.css", "siteCss")}" />
  <link rel="stylesheet" href="${asset("/assets/clickoz-premium.css", "clickozPremiumCss")}" />
  <link rel="stylesheet" href="${asset("/assets/cms-final.css", "cmsFinal")}" />
</head>
<body class="bigtext cluster-page">
  <div id="clickozParticles" aria-hidden="true"></div>
  <canvas id="spaceParticles" aria-hidden="true"></canvas>
  <div class="__grain" aria-hidden="true"></div>
  <nav class="nav" aria-label="Primary navigation" id="topNav"><div class="container nav-inner"><a class="logo" href="/" aria-label="Clickoz Home"><span class="logo-badge" aria-hidden="true"><svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="logo-text">Click<span class="logo-oz">oz</span></span></a><div class="nav-links" aria-label="Sections"><a href="/">Home</a><a href="/tools/" class="active">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div><div class="spacer"></div><div class="nav-actions" aria-label="Preferences"><div id="gtNavWrap" aria-label="Translate"><div id="google_translate_element"></div></div></div></div></nav>
  <main class="section container cluster-shell">
    <section class="cluster-hero hero-box">
      <nav class="cz-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/tools/">Tools</a><span>/</span><span>${cluster.title}</span></nav>
      <p class="guide-kicker">SEARCH CLUSTER</p>
      <h1 class="section-title">${cluster.title}</h1>
      <p class="section-sub">${desc}</p>
      <div class="cluster-paths">
        <a href="#tools">Open tools</a>
        <a href="#guides">Read guides</a>
        <a href="/tools/">All tools</a>
      </div>
    </section>
    <section class="cluster-section" id="tools">
      <div class="cluster-head"><span>01</span><div><h2>Tools in this workflow</h2><p>Start from the utility, then move to the related guide when the result needs strategy.</p></div></div>
      <div class="cluster-grid">${tools.map((item) => card(item, "Tool")).join("\n")}</div>
    </section>
    <section class="cluster-section" id="guides">
      <div class="cluster-head"><span>02</span><div><h2>Guides that support it</h2><p>Each guide explains the problem, the process and the next Clickoz action.</p></div></div>
      <div class="cluster-grid">${guides.map((item) => card(item, "Guide")).join("\n")}</div>
    </section>
    <section class="cluster-section cluster-faq">
      <div class="cluster-head"><span>03</span><div><h2>How to use this cluster</h2><p>Pick one task, finish it, then follow the internal links instead of jumping between random pages.</p></div></div>
      <div class="cluster-grid">
        <article class="cluster-card"><span class="cluster-card-type">Step</span><strong>Choose the closest task</strong><span>Open the tool that matches the job you need to complete right now.</span></article>
        <article class="cluster-card"><span class="cluster-card-type">Step</span><strong>Use the example first</strong><span>Load the sample so the interface explains itself before you paste real input.</span></article>
        <article class="cluster-card"><span class="cluster-card-type">Step</span><strong>Read the guide after output</strong><span>The guide explains why the result matters and what to check before publishing.</span></article>
      </div>
    </section>
  </main>
  <footer class="footer"><div class="container footer-grid"><div><h4>Clickoz</h4><div class="footer-links"><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div><div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/readability-analyzer/">Readability</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a></div></div><div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div></div><div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">&copy; 2026 Clickoz - Fast tools for SEO, writing and developers</div></div></footer>
  <script src="${asset("/assets/cms-registry.js", "cmsRegistry")}" defer></script>
  <script src="${asset("/assets/cms-schema.js", "cmsSchema")}" defer></script>
  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>
  <script src="${asset("/assets/site.js", "siteJs")}" defer></script>
  <script src="${asset("/assets/clickoz-premium.js", "clickozPremiumJs")}" defer></script>
</body>
</html>
`;
}

function ogSvg(key) {
  const c = cms.clusters[key] || { title: "Clickoz", description: "Fast browser tools" };
  const accent = { seo: "#22d3ee", writing: "#a78bfa", dev: "#34d399", youtube: "#f97316" }[key] || "#22d3ee";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="25%" cy="15%" r="80%"><stop offset="0" stop-color="${accent}" stop-opacity=".50"/><stop offset=".48" stop-color="#111827"/><stop offset="1" stop-color="#05070d"/></radialGradient>
    <linearGradient id="b" x1="0" x2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="#ffffff" stop-opacity=".55"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="54" y="54" width="1092" height="522" rx="38" fill="#05070d" fill-opacity=".50" stroke="url(#b)" stroke-width="3"/>
  <text x="92" y="135" fill="${accent}" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6">CLICKOZ</text>
  <text x="92" y="270" fill="#fff" font-family="Arial, sans-serif" font-size="74" font-weight="900">${c.title}</text>
  <text x="94" y="348" fill="#dbeafe" font-family="Arial, sans-serif" font-size="32">${c.description}</text>
  <text x="94" y="505" fill="#fff" font-family="Arial, sans-serif" font-size="28">Tools + guides + workflows</text>
</svg>`;
}

function createClustersAndOg() {
  for (const key of Object.keys(cms.clusters)) {
    const dir = cms.clusters[key].url.replace(/^\/|\/$/g, "");
    write(`${dir}/index.html`, clusterTemplate(key));
    write(`assets/og/${key}-tools.svg`, ogSvg(key));
  }
  write("assets/og/tools.svg", ogSvg("seo").replace(/SEO Tools/g, "Clickoz Tools").replace(/Meta tags, SERP previews, slugs, keyword checks and page publishing workflows\./g, "Browser tools for SEO, writing, developers and creators."));
  write("assets/og/guides.svg", ogSvg("writing").replace(/Writing Tools/g, "Clickoz Guides").replace(/Counters, readability checks, cleanup utilities and copy workflows for clearer content\./g, "Practical workflows connected to Clickoz tools."));
  write("assets/og/updates.svg", ogSvg("dev").replace(/Developer Tools/g, "Clickoz Updates").replace(/JSON, URL, Base64 and HTML entity utilities built for fast debugging\./g, "Release notes, product improvements and CMS quality work."));
  for (const tool of cms.tools) {
    const key = tool.canonicalSlug || tool.slug;
    if (key !== tool.slug) continue;
    write(`assets/og/tool-${tool.slug}.svg`, toolOgSvg(tool));
  }
}

function toolOgSvg(tool) {
  const accent = { seo: "#22d3ee", writing: "#a78bfa", dev: "#34d399", youtube: "#f97316" }[tool.category] || "#22d3ee";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="20%" cy="10%" r="90%"><stop offset="0" stop-color="${accent}" stop-opacity=".42"/><stop offset=".52" stop-color="#111827"/><stop offset="1" stop-color="#05070d"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="54" y="54" width="1092" height="522" rx="38" fill="#05070d" fill-opacity=".58" stroke="${accent}" stroke-opacity=".78" stroke-width="3"/>
  <text x="92" y="135" fill="${accent}" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="6">CLICKOZ TOOL</text>
  <text x="92" y="266" fill="#fff" font-family="Arial, sans-serif" font-size="70" font-weight="900">${tool.title}</text>
  <text x="94" y="344" fill="#dbeafe" font-family="Arial, sans-serif" font-size="30">${tool.description}</text>
  <text x="94" y="505" fill="#fff" font-family="Arial, sans-serif" font-size="28">${(tool.features || []).join(" - ")}</text>
</svg>`;
}

function redirects() {
  const rows = [
    ["/tools/meta-tag-optimizer/", "/tools/meta-tags/"],
    ["/tools/base64-encode-decode/", "/tools/base64/"],
    ["/tools/url-encoder-decoder/", "/tools/url-encoder/"],
    ["/tools/html-entity-encoder/", "/tools/entity-encoder/"],
    ["/tools/html-entity-encoder-decoder/", "/tools/entity-encoder/"],
    ["/tools/dev-tools/", "/tools/developer-tools/"]
  ];
  write("_redirects", rows.map(([from, to]) => `${from} ${to} 301`).join("\n") + "\n");
  write("vercel.json", JSON.stringify({
    redirects: rows.map(([source, destination]) => ({ source, destination, permanent: true }))
  }, null, 2) + "\n");
}

function updateCanonicals() {
  const aliases = {
    "tools/meta-tag-optimizer/index.html": "/tools/meta-tags/",
    "tools/base64-encode-decode/index.html": "/tools/base64/",
    "tools/url-encoder-decoder/index.html": "/tools/url-encoder/",
    "tools/html-entity-encoder/index.html": "/tools/entity-encoder/",
    "tools/html-entity-encoder-decoder/index.html": "/tools/entity-encoder/"
  };
  for (const [rel, canonical] of Object.entries(aliases)) {
    let html = read(rel);
    html = html.replace(/<link rel="canonical" href="https:\/\/clickoz\.com\/tools\/[^"]+" \/>/, `<link rel="canonical" href="${ORIGIN}${canonical}" />`);
    html = html.replace(/<meta property="og:url" content="https:\/\/clickoz\.com\/tools\/[^"]+" \/>/, `<meta property="og:url" content="${ORIGIN}${canonical}" />`);
    write(rel, html);
  }
  for (const tool of cms.tools) {
    const rel = `tools/${tool.slug}/index.html`;
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    const canonical = cms.toolBySlug[tool.canonicalSlug] || tool;
    const image = `${ORIGIN}/assets/og/tool-${canonical.slug}.svg`;
    let html = read(rel);
    html = html.replace(/<meta property="og:image" content="[^"]+" \/>/, `<meta property="og:image" content="${image}" />`);
    html = html.replace(/<meta name="twitter:image" content="[^"]+" \/>/, `<meta name="twitter:image" content="${image}" />`);
    write(rel, html);
  }
  for (const [rel, image] of Object.entries({
    "tools/index.html": `${ORIGIN}/assets/og/tools.svg`,
    "guides/index.html": `${ORIGIN}/assets/og/guides.svg`,
    "updates/index.html": `${ORIGIN}/assets/og/updates.svg`
  })) {
    let html = read(rel);
    html = html.replace(/<meta property="og:image" content="[^"]+" \/>/, `<meta property="og:image" content="${image}" />`);
    html = html.replace(/<meta name="twitter:image" content="[^"]+" \/>/, `<meta name="twitter:image" content="${image}" />`);
    write(rel, html);
  }
}

function updateSitemap() {
  const htmlFiles = walk(root)
    .filter((file) => !file.includes(`${path.sep}_maintenance${path.sep}`))
    .map((file) => path.relative(root, file).replace(/\\/g, "/"))
    .filter((rel) => !rel.startsWith("404") && rel !== "404.html" && rel !== "tools/tool.html" && rel !== "tools/dev-tools/index.html")
    .filter((rel) => !["tools/meta-tag-optimizer/index.html", "tools/base64-encode-decode/index.html", "tools/url-encoder-decoder/index.html", "tools/html-entity-encoder/index.html", "tools/html-entity-encoder-decoder/index.html"].includes(rel));

  const urls = htmlFiles.map((rel) => {
    let loc = rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "");
    const priority = loc === "/" ? "1.00" : loc.startsWith("/tools/") || loc.startsWith("/guides/") ? "0.82" : "0.70";
    return `  <url><loc>${ORIGIN}${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`;
  }).sort();
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
}

ensureScripts();
createClustersAndOg();
redirects();
updateCanonicals();
updateSitemap();
console.log("CMS foundation applied:", cms.tools.length, "tools,", cms.guides.length, "guides,", Object.keys(cms.clusters).length, "clusters");
