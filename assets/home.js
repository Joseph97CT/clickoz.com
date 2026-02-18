/* ==========================================================================
   /assets/home.js  (REWORK v2)
   Home-only enhancements (safe with /assets/site.js)

   - "Top tools of the month" (manual refresh only)
   - No microtest widget (removed by request)
   - Progressive enhancement: if DOM differs, does nothing.
========================================================================== */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =========================
     0) UTILITIES
  ========================= */
  function escapeHtml(str){
    return (str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function mulberry32(seed){
    return function(){
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithSeed(arr, seed){
    const a = arr.slice();
    const rnd = mulberry32(seed >>> 0);
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* =========================
     1) TOP TOOLS OF THE MONTH
     Expected DOM:
       #picksGrid (container)
       #recRefresh (button)
       optional: [data-month-label] span to show current month
  ========================= */
  const picksGrid = $("#picksGrid");
  const refreshBtn = $("#recRefresh");

  // Curated core (always stable — these should be your best “search magnets”).
  // Keep hrefs exactly matching your site routes.
  const CORE = [
    {
      href: "/tools/json-formatter/",
      icon: "🧾",
      title: "JSON Formatter",
      desc: "Format, validate, and minify JSON for clean debugging and copy-ready output.",
      cat: "Developer Utilities"
    },
    {
      href: "/tools/meta-tags/",
      icon: "🏷️",
      title: "Meta Tag Optimizer",
      desc: "Preview SERP titles/descriptions, avoid truncation, and improve click appeal.",
      cat: "SEO Tools"
    }
  ];

  // Monthly rotation pool (the "search-driven" vibe).
  // Add/remove items anytime; refresh will pick 1 to fill slot 3.
  const MONTHLY_POOL = [
    {
      href: "/tools/word-counter/",
      icon: "🔢",
      title: "Word Counter",
      desc: "Words, characters, sentences, and reading time for briefs and drafts.",
      cat: "Writing Tools"
    },
    {
      href: "/tools/readability-analyzer/",
      icon: "📚",
      title: "Readability Analyzer",
      desc: "Readability score + quick edits to make text easier to scan on mobile.",
      cat: "Writing Tools"
    },
    {
      href: "/tools/url-encoder/",
      icon: "🔗",
      title: "URL Encoder / Decoder",
      desc: "Fix broken parameters, encode tracking links, and inspect redirects safely.",
      cat: "Developer Utilities"
    },
    {
      href: "/tools/base64/",
      icon: "🔐",
      title: "Base64 Encode / Decode",
      desc: "Inspect tokens and payload segments with clean, readable output.",
      cat: "Developer Utilities"
    }
  ].filter(Boolean);

  function renderPickCard(item){
    const href  = escapeHtml(item.href);
    const title = escapeHtml(item.title);
    const desc  = escapeHtml(item.desc);
    const cat   = escapeHtml(item.cat);
    const icon  = escapeHtml(item.icon || "✨");

    return `
      <a class="pick-card" href="${href}">
        <div class="pick-head">
          <span class="pick-icon" aria-hidden="true">${icon}</span>
          <h3 class="pick-title">${title}</h3>
        </div>
        <p class="pick-desc">${desc}</p>
        <div class="pick-meta">
          <span class="pick-cat">${cat}</span>
          <span class="pick-cta">Open</span>
        </div>
      </a>
    `.trim();
  }

  function renderPicks(list){
    if (!picksGrid) return;
    picksGrid.innerHTML = list.map(renderPickCard).join("\n");
  }

  function initPicks(){
    if (!picksGrid) return;

    // If the HTML already contains non-pick markup, do nothing (safe).
    const hasPick = !!picksGrid.querySelector(".pick-card");
    const hasChildren = picksGrid.children && picksGrid.children.length > 0;
    if (hasChildren && !hasPick) return;

    // Default render: stable picks + one deterministic “month pick”
    const now = new Date();
    const seed = (now.getFullYear() * 100) + (now.getMonth() + 1); // YYYYMM
    const shuffled = shuffleWithSeed(MONTHLY_POOL, seed);
    const monthPick = shuffled[0] || MONTHLY_POOL[0];

    renderPicks([CORE[0], CORE[1], monthPick]);
  }

  function refreshMonthlyPick(){
    if (!picksGrid) return;

    const seed = (Date.now() >>> 0);
    const shuffled = shuffleWithSeed(MONTHLY_POOL, seed);
    const pick = shuffled[0] || MONTHLY_POOL[0];

    renderPicks([CORE[0], CORE[1], pick]);

    if (refreshBtn){
      refreshBtn.disabled = true;
      refreshBtn.textContent = "✅ Updated";
      window.setTimeout(() => {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "🔄 Refresh picks";
      }, 900);
    }
  }

  initPicks();

  if (refreshBtn){
    refreshBtn.addEventListener("click", (e) => {
      e.preventDefault();
      refreshMonthlyPick();
    });
  }
})();
