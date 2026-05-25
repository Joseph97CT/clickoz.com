/* Clickoz CMS UX enhancer.
   Adds lightweight card metadata and live counts without injecting duplicate hero blocks. */
(function () {
  "use strict";

  const cms = window.ClickozCMS;
  if (!cms) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const categoryLabel = {
    seo: "Search route",
    writing: "Writing route",
    dev: "Developer route",
    web: "Web route",
    socialai: "Creator route",
    tracking: "Tracking route",
    youtube: "YouTube route",
    creator: "Creator route"
  };

  const categoryMark = {
    seo: "SEO",
    writing: "TXT",
    dev: "DEV",
    web: "WEB",
    socialai: "SOC",
    tracking: "UTM",
    youtube: "YT",
    creator: "CR"
  };

  const featureMark = {
    "Browser-only": "Private",
    "Live counts": "Live",
    "Copy results": "Copy",
    "No upload": "Local",
    "Mobile-ready": "Mobile",
    "Snippet": "SERP",
    "Title length": "Length",
    "CTR": "Click",
    "Preview": "Preview",
    "Search intent": "Intent",
    "Validate": "Check",
    "Format": "Clean",
    "Debug": "Debug",
    "Encode": "Encode",
    "Decode": "Decode",
    "Hook": "Hook",
    "Keyword": "Keyword",
    "Creator": "Creator",
    "Thumbnail": "Visual",
    "CTA": "CTA",
    "Tracking": "Track",
    "Campaigns": "Campaign",
    "Latency": "Speed",
    "DNS records": "DNS",
    "IPv4": "IPv4",
    "Regex match": "Regex",
    "Robots.txt": "Crawl"
  };

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function slugFromUrl(url) {
    return (url || "").split("/").filter(Boolean).pop() || "";
  }

  function toolName(slug) {
    return cms.toolBySlug?.[slug]?.title || slug.replace(/-/g, " ");
  }

  function addToolCardFeatures() {
    $$(".card[href^='/tools/'], .tool-card-enhanced[href^='/tools/']").forEach((card) => {
      if ($(".tool-mini-features", card)) return;
      const tool = cms.toolBySlug?.[slugFromUrl(card.getAttribute("href"))];
      if (!tool) return;
      const wrap = document.createElement("div");
      wrap.className = "tool-mini-features";
      wrap.innerHTML = (tool.features || []).slice(0, 3).map((feature) => {
        const mark = featureMark[feature] || categoryMark[tool.category] || "OK";
        return `<span><b>${esc(mark)}</b>${esc(feature)}</span>`;
      }).join("");
      const top = $(".card-top", card) || $(".card-head", card);
      if (top && top.nextSibling) top.parentNode.insertBefore(wrap, top.nextSibling);
      else card.appendChild(wrap);
    });
  }

  function addGuideCardFeatures() {
    $$(".guide-x, .guide-card, .guide-hub-card").forEach((card) => {
      if ($(".guide-card-meta", card)) return;
      const guide = cms.guideBySlug?.[slugFromUrl(card.getAttribute("href"))];
      if (!guide) return;
      const tool = cms.toolBySlug?.[guide.tool];
      const meta = document.createElement("div");
      meta.className = "guide-card-meta";
      meta.innerHTML = [
        categoryLabel[guide.category] || "Guide route",
        tool ? tool.title : toolName(guide.tool),
        "Checklist"
      ].map((trait) => `<span>${esc(trait)}</span>`).join("") +
        `<span class="guide-tool-chip">${esc(categoryMark[guide.category] || "GO")} ${esc(toolName(guide.tool))}</span>`;
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
      if (key === "clusters") el.textContent = `${counts.clusters} tool clusters`;
    });
  }

  function enhanceGuideArticle() {
    const guide = cms.guides.find((item) => item.url === window.location.pathname);
    if (!guide || $(".guide-cms-summary")) return;
    const hero = $(".guide-premium-hero");
    if (!hero) return;
    const tool = cms.toolBySlug?.[guide.tool];
    const cluster = cms.clusters?.[tool?.category || guide.category];
    const summary = document.createElement("section");
    summary.className = "guide-cms-summary";
    summary.innerHTML = `
      <article>
        <span>01</span>
        <h2>Problem</h2>
        <p>${esc(guide.description)} Start with the problem, test a real input, then decide what to change.</p>
      </article>
      <article>
        <span>02</span>
        <h2>Tool</h2>
        <p>Use <a href="${esc(tool?.url || "/tools/")}">${esc(tool?.title || "the matching Clickoz tool")}</a> to check the page, draft, link or dataset before publishing.</p>
      </article>
      <article>
        <span>03</span>
        <h2>Next step</h2>
        <p>Move into <a href="${esc(cluster?.url || "/tools/")}">${esc(cluster?.title || "the related route")}</a> when you need the next connected action.</p>
      </article>
    `;
    hero.insertAdjacentElement("afterend", summary);
  }

  function init() {
    addToolCardFeatures();
    addGuideCardFeatures();
    enhanceGuideArticle();
    updateCMSCounts();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
