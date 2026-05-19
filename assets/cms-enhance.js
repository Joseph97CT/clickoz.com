/* Clickoz CMS UX enhancer: card details, guide logic, home lanes and updates polish. */
(function () {
  "use strict";

  const cms = window.ClickozCMS;
  if (!cms) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const slugFromUrl = (url) => (url || "").split("/").filter(Boolean).pop() || "";
  const titleForTool = (slug) => cms.toolBySlug?.[slug]?.title || slug.replace(/-/g, " ");

  const categoryLabel = {
    seo: "Search system",
    writing: "Writing craft",
    dev: "Debug lab",
    web: "Web security",
    socialai: "Social creator",
    tracking: "Tracking ops",
    youtube: "Creator lane",
    creator: "Creator system"
  };

  const categoryEmoji = {
    seo: "🔎",
    writing: "✍️",
    dev: "🧪",
    web: "🛡️",
    socialai: "✨",
    tracking: "📈",
    youtube: "▶️",
    creator: "🎬"
  };

  const featureEmoji = {
    "Browser-only": "🔒", "Live counts": "⚡", "Copy results": "📋", "Limits": "📏",
    "No upload": "🛡️", "Mobile-ready": "📱", "Score": "🎯", "Clarity": "💡",
    "SEO copy": "🔎", "Case fixes": "🔤", "Clean text": "🧼", "Copy-ready": "📋",
    "Cleanup": "🧽", "Paste repair": "🧩", "Readable": "👁️", "Snippet": "🏷️",
    "Title length": "📐", "CTR": "📈", "Preview": "🖥️", "Snippet-ready": "✨",
    "Search intent": "🔎", "Density": "📊", "Intent": "🧠", "Natural copy": "🌿",
    "URL slug": "🔗", "Clean links": "🧼", "Durable": "🧱", "Validate": "✅",
    "Format": "🧾", "Debug": "🛠️", "Minify": "🗜️", "Payloads": "📦",
    "Copy": "📋", "Encode": "🔐", "Decode": "🔓", "Query strings": "🧭",
    "Tokens": "🪪", "Entities": "⌁", "Markup": "<>", "Escaping": "🛡️",
    "Hook": "🎣", "Keyword": "🔑", "Creator": "🎬", "Thumbnail": "🖼️",
    "Mobile": "📱", "Visual brief": "🎨", "First lines": "📝", "CTA": "👉",
    "Links": "🔗", "Tags": "#", "Niche": "🎯", "No stuffing": "🚫",
    "Video tags": "🏷️", "Metadata": "🧬", "Angles": "📐", "Community": "💬",
    "Polls": "📊", "Retention": "🧲", "Tracking": "📈", "Campaigns": "🚀",
    "Clean URLs": "🔗", "Latency": "⚡", "Reachability": "🌐", "Website check": "📊",
    "DNS records": "🧭", "Domain check": "🌐", "Fast lookup": "☁️",
    "IPv4": "🌐", "CIDR": "🧮", "Network math": "📡", "Crypto random": "🎲",
    "Strong passwords": "🔐", "UUID v4": "🆔", "Bulk output": "📦",
    "Unix time": "⏱️", "ISO date": "📅", "Timezone view": "🌍",
    "Regex match": "🧪", "Groups": "🧩", "Replace preview": "🔁",
    "Diff": "🧾", "Compare text": "✅", "Review changes": "👁️",
    "HEX RGB HSL": "🎨", "Contrast": "👁️", "Palette check": "🎛️",
    "Robots.txt": "🤖", "Crawl rules": "🗺️", "SEO technical": "🔎"
  };

  const guideTraits = {
    "seo-content-checklist": ["🔎 Intent map", "🏗️ Page structure", "🔗 Internal links"],
    "how-to-write-meta-title-description": ["🏷️ Snippet writing", "📐 Length control", "📈 Click appeal"],
    "keyword-density-explained": ["📊 Term balance", "🌿 Natural copy", "🚫 No stuffing"],
    "meta-tags-length": ["📐 Title limits", "🧪 SERP check", "✂️ Trim safely"],
    "meta-tags-checklist": ["✅ Pre-publish", "🏷️ Social tags", "🧭 Canonical"],
    "serp-preview": ["🖥️ Visual snippet", "👁️ Mobile scan", "📋 Copy check"],
    "serp-snippet-ctr": ["📈 CTR testing", "🎣 Better hook", "🧠 Intent match"],
    "slug-best-practices": ["🔗 Clean URLs", "🧱 Durable slugs", "✂️ Short paths"],
    "internal-linking-tools-sites": ["🕸️ Link flow", "🧭 Next action", "🏗️ Topic hubs"],
    "core-web-vitals-tools-sites": ["⚡ Speed", "📱 Stability", "🧊 Low friction"],
    "keyword-variations": ["🔑 Variants", "🧠 Intent coverage", "🧩 Clusters"],
    "readability-for-seo": ["👁️ Scanability", "✍️ Clear copy", "📱 Mobile reading"],
    "readability-score": ["🎯 Score meaning", "🧼 Practical edits", "📚 Structure"],
    "readability-for-ranking": ["✅ Helpful content", "🧠 Clarity", "🏗️ Layout"],
    "word-count-for-seo": ["🔢 Content depth", "⏱️ Reading time", "✂️ Trim/expand"],
    "content-brief-template": ["🧱 Outline", "🔎 Intent", "📋 Brief template"],
    "text-cleanup-workflow": ["🧼 Paste cleanup", "🔤 Formatting", "✅ Ready text"],
    "json-formatter-online": ["🧾 Format JSON", "✅ Validate", "🛠️ Debug faster"],
    "json-formatting-debug": ["🐞 Error hunt", "🧪 Broken JSON", "📋 Fix routine"],
    "url-encoding": ["🔗 URL safety", "🧭 Query strings", "🛡️ Encode values"],
    "url-encoding-basics": ["🔐 Safe values", "🧩 Forms", "🌐 Links"],
    "url-encoding-explained": ["🛠️ Broken links", "🧭 Parameters", "✅ Decode checks"],
    "query-string-best-practices": ["🧭 Clean params", "📈 Measurable links", "🔗 URL hygiene"],
    "base64-decode": ["🔓 Decode payload", "🪪 Inspect token", "🚫 Not encryption"],
    "base64-encode-decode": ["🔐 Encode", "🔓 Decode", "📦 Payloads"],
    "base64url-vs-base64": ["🧬 Token-safe", "↔️ Compare", "🧪 Debug auth"],
    "debugging-tokens": ["🪪 Token parts", "🧪 Inspect safely", "🔒 Privacy"],
    "jwt-basics": ["🪪 Header/payload", "🔐 Signature", "🧠 JWT basics"],
    "html-entities": ["<> Markup", "🛡️ Entities", "🧼 Safe text"],
    "encoding-vs-escaping": ["🧠 Choose context", "🛡️ Protect output", "🔗 Encode vs escape"],
    "fix-broken-html": ["🧷 Broken markup", "🧼 Escape chars", "✅ Repair"],
    "fix-broken-utm-parameters": ["📈 Tracking repair", "🧭 Params", "✅ Campaign QA"],
    "utm-builder-guide": ["🚀 Campaign links", "📈 Analytics", "🏷️ Naming"],
    "utm-best-practices": ["🏷️ Naming rules", "📊 Attribution", "🧼 Clean data"],
    "instagram-bio-utm": ["📱 Bio links", "📈 Profile traffic", "🔗 Short path"],
    "youtube-tracking-links": ["▶️ Description clicks", "📌 Pinned links", "📈 Attribution"],
    "youtube-title-thumbnail-checklist": ["🎣 Click promise", "🖼️ Thumbnail", "▶️ Upload QA"],
    "youtube-description-template": ["📝 First lines", "🔗 Links", "# Hashtags"],
    "youtube-hashtags-guide": ["# Tag mix", "🎯 Niche labels", "🚫 No spam"],
    "youtube-community-post-ideas": ["💬 Engagement", "📊 Polls", "🔁 Follow-up"],
    "creator-content-calendar": ["🗓️ Calendar", "🎬 Shorts/videos", "📈 Tracking"]
  };

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function addToolCardFeatures() {
    $$(".card[href^='/tools/']").forEach((card) => {
      if ($(".tool-mini-features", card)) return;
      const slug = slugFromUrl(card.getAttribute("href"));
      const tool = cms.toolBySlug?.[slug];
      if (!tool) return;
      const wrap = document.createElement("div");
      wrap.className = "tool-mini-features";
      wrap.innerHTML = (tool.features || []).slice(0, 3)
        .map((feature) => `<span><b>${esc(featureEmoji[feature] || "✦")}</b>${esc(feature)}</span>`)
        .join("");
      const top = $(".card-top", card);
      if (top && top.nextSibling) top.parentNode.insertBefore(wrap, top.nextSibling);
      else card.appendChild(wrap);
    });
  }

  function addGuideCardFeatures() {
    $$(".guide-x").forEach((card) => {
      if ($(".guide-card-meta", card)) return;
      const slug = slugFromUrl(card.getAttribute("href"));
      const guide = cms.guideBySlug?.[slug];
      if (!guide) return;
      const traits = guideTraits[guide.slug] || [categoryLabel[guide.category] || "Guide workflow", titleForTool(guide.tool), "Checklist"];
      const meta = document.createElement("div");
      meta.className = "guide-card-meta";
      meta.innerHTML = traits.slice(0, 3).map((trait) => `<span>${esc(trait)}</span>`).join("") +
        `<span class="guide-tool-chip">${esc(categoryEmoji[guide.category] || "✦")} ${esc(titleForTool(guide.tool))}</span>`;
      const bottom = $(".guide-bottom", card);
      if (bottom) card.insertBefore(meta, bottom);
      else card.appendChild(meta);
    });
  }

  function updateCMSCounts() {
    const tools = cms.tools || [];
    const guides = cms.guides || [];
    const clusters = cms.clusters || {};
    const counts = {
      tools: tools.length,
      guides: guides.length,
      clusters: Object.keys(clusters).length,
      seo: tools.filter((tool) => tool.category === "seo").length,
      writing: tools.filter((tool) => tool.category === "writing").length,
      dev: tools.filter((tool) => tool.category === "dev").length,
      web: tools.filter((tool) => tool.category === "web").length,
      tracking: tools.filter((tool) => tool.category === "tracking").length,
      youtube: tools.filter((tool) => tool.category === "youtube").length,
      socialai: tools.filter((tool) => tool.category === "socialai").length
    };

    $$("[data-cms-count]").forEach((el) => {
      const key = el.getAttribute("data-cms-count");
      if (Object.prototype.hasOwnProperty.call(counts, key)) el.textContent = String(counts[key]);
    });

    $$("[data-cms-label]").forEach((el) => {
      const key = el.getAttribute("data-cms-label");
      if (key === "tools") el.textContent = `${counts.tools} live tools`;
      if (key === "guides") el.textContent = `${counts.guides} practical guides`;
      if (key === "clusters") el.textContent = `${counts.clusters} workflow clusters`;
    });
  }

  function enhanceHome() {
    if (window.location.pathname !== "/" || $(".home-personality-board")) return;
    const target = $(".home-pathways") || $(".home-dashboard");
    if (!target) return;
    const board = document.createElement("section");
    board.className = "section container home-personality-board";
    board.setAttribute("aria-label", "Clickoz workflow personality");
    board.innerHTML = `
      <div class="home-personality-head">
        <p class="guide-kicker">CLICKOZ OS</p>
        <h2>Open the right lane first.</h2>
        <p>Choose what you are trying to fix. Each lane starts simple and points to the next useful page.</p>
      </div>
      <div class="home-personality-grid">
        <a href="/tools/seo-tools/"><span>🔎</span><strong>SEO lane</strong><small>Fix titles, snippets, keywords and clean URLs before publishing.</small></a>
        <a href="/tools/writing-tools/"><span>✍️</span><strong>Writing lane</strong><small>Check length, readability and structure before users read the draft.</small></a>
        <a href="/tools/web-security-tools/"><span>🛡️</span><strong>Web lane</strong><small>Run DNS, HTTP, IP, password, UUID and robots.txt checks.</small></a>
        <a href="/tools/youtube-tools/"><span>▶️</span><strong>YouTube lane</strong><small>Build titles, thumbnails, descriptions, comments and chapters.</small></a>
        <a href="/tools/social-ai-tools/"><span>✨</span><strong>Social lane</strong><small>Prepare captions, hooks, CTAs, disclosures and creator assets.</small></a>
        <a href="/tools/developer-tools/"><span>🧪</span><strong>Debug lane</strong><small>Format JSON, encode URLs, decode Base64 and escape HTML safely.</small></a>
      </div>
    `;
    target.insertAdjacentElement("afterend", board);
  }

  function enhanceGuideArticle() {
    const guide = cms.guides.find((item) => item.url === window.location.pathname);
    if (!guide || $(".guide-cms-summary")) return;
    const hero = $(".guide-premium-hero");
    const shell = $(".guide-shell") || $("article");
    if (!hero || !shell) return;
    const tool = cms.toolBySlug?.[guide.tool];
    const cluster = cms.clusters?.[tool?.category || guide.category];

    const summary = document.createElement("section");
    summary.className = "guide-cms-summary";
    summary.innerHTML = `
      <article>
        <span>01</span>
        <h2>Problem to solve</h2>
        <p>${esc(guide.description)} Start with the problem, run the matching tool, then use the checklist to make a publishable decision.</p>
      </article>
      <article>
        <span>02</span>
        <h2>Use the tool</h2>
        <p>Open <a href="${esc(tool?.url || "/tools/")}">${esc(tool?.title || "the matching Clickoz tool")}</a>, test real input, then compare the result with the guide checklist.</p>
      </article>
      <article>
        <span>03</span>
        <h2>Next action</h2>
        <p>Finish the page by moving to <a href="${esc(cluster?.url || "/tools/")}">${esc(cluster?.title || "the related cluster")}</a> or one related internal link.</p>
      </article>
    `;
    hero.insertAdjacentElement("afterend", summary);

    const grid = $(".premium-link-grid", hero);
    if (grid && tool) {
      const related = [tool.slug].concat(tool.relatedTools || []).slice(0, 5);
      grid.innerHTML = related.map((slug) => {
        const t = cms.toolBySlug?.[slug];
        return t ? `<a href="${esc(t.url)}">${esc(t.title)}</a>` : "";
      }).join("");
    }
  }

  function enhanceUpdates() {
    if (!document.body || !window.location.pathname.startsWith("/updates/") || $(".updates-system-strip")) return;
    const hero = $(".updates-hero");
    if (!hero) return;
    const strip = document.createElement("section");
    strip.className = "updates-system-strip";
    strip.innerHTML = `
      <article><span>🧭 Registry</span><strong><b data-cms-count="tools">${cms.tools.length}</b> tools mapped</strong><p>Every utility has features, examples, related guides and schema data.</p></article>
      <article><span>📚 Guides</span><strong><b data-cms-count="guides">${cms.guides.length}</b> workflows</strong><p>Guide cards route users by problem, matching tool and next action.</p></article>
      <article><span>🔎 SEO</span><strong>Clusters live</strong><p>SEO, writing, developer, web and YouTube hubs support topical authority.</p></article>
      <article><span>🛡️ Quality</span><strong>Canonical control</strong><p>Duplicate entry pages point to clean canonical destinations.</p></article>
    `;
    hero.insertAdjacentElement("afterend", strip);
  }

  function init() {
    addToolCardFeatures();
    addGuideCardFeatures();
    enhanceGuideArticle();
    enhanceHome();
    enhanceUpdates();
    updateCMSCounts();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
