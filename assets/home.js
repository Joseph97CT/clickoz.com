/* =========================================================
   Clickoz — home.js
   - Monthly picks (manual refresh)
   - Stable rendering + nice randomness (no auto changes)
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  // Simple seeded RNG (deterministic for "monthly" baseline)
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(str) {
    // small deterministic hash
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]
    ));
  }

  function renderPickCard(tool) {
    const title = escapeHtml(tool.title);
    const desc = escapeHtml(tool.desc);
    const cat  = escapeHtml(tool.cat);
    const href = escapeHtml(tool.href);
    const icon = escapeHtml(tool.icon);

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
    `;
  }

  // Tool pool (curate as you like)
  const TOOL_POOL = [
    { icon:"🧾", title:"JSON Formatter", desc:"Format, validate, and minify JSON for clean debugging and copy-ready output.", cat:"Developer Utilities", href:"/tools/json-formatter/" },
    { icon:"🏷️", title:"Meta Tag Optimizer", desc:"Preview SERP titles/descriptions, avoid truncation, and improve click appeal.", cat:"SEO Tools", href:"/tools/meta-tags/" },
    { icon:"📚", title:"Readability Analyzer", desc:"Readability score + quick edits to make text easier to scan on mobile.", cat:"Writing Tools", href:"/tools/readability-analyzer/" },

    { icon:"🔗", title:"URL Encoder / Decoder", desc:"Encode or decode query strings to fix broken URLs and parameters safely.", cat:"Developer Utilities", href:"/tools/url-encoder/" },
    { icon:"🔐", title:"Base64 Encode / Decode", desc:"Inspect tokens and payloads quickly with clean, readable output.", cat:"Developer Utilities", href:"/tools/base64/" },
    { icon:"🧮", title:"Word Counter", desc:"Count words, characters, sentences, and estimate reading time instantly.", cat:"Writing Tools", href:"/tools/word-counter/" },
    { icon:"🧠", title:"Keyword Density Checker", desc:"Spot overuse and missing terms to balance intent and readability.", cat:"SEO Tools", href:"/tools/keyword-density/" },
    { icon:"🧩", title:"HTML Entity Encoder/Decoder", desc:"Convert special characters safely for HTML or decode them back.", cat:"Developer Utilities", href:"/tools/html-entity/" },
    { icon:"🧹", title:"Whitespace Remover", desc:"Clean extra spaces/lines without breaking your text structure.", cat:"Writing Tools", href:"/tools/whitespace-remover/" },
    { icon:"🧭", title:"UTM Builder", desc:"Create trackable UTM links quickly with clean parameters.", cat:"SEO Tools", href:"/tools/utm-builder/" }
  ];

  function dedupeByHref(list) {
    const seen = new Set();
    return list.filter(t => {
      if (seen.has(t.href)) return false;
      seen.add(t.href);
      return true;
    });
  }

  function pickMonthlyBaseline() {
    // Deterministic baseline: changes with month, not every load
    const now = new Date();
    const key = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-clickoz-home`;
    const seed = hashStr(key);
    const rnd = mulberry32(seed);

    const pool = dedupeByHref([...TOOL_POOL]);
    // shuffle deterministic
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function getManualRotationIndex(max) {
    const raw = sessionStorage.getItem("clickoz_home_rotation_idx");
    const idx = raw ? parseInt(raw, 10) : 0;
    return clamp(Number.isFinite(idx) ? idx : 0, 0, Math.max(0, max - 1));
  }

  function setManualRotationIndex(idx) {
    sessionStorage.setItem("clickoz_home_rotation_idx", String(idx));
  }

  function renderPicks({ rotate = false } = {}) {
    const grid = $("#picksGrid");
    if (!grid) return;

    // Baseline list (monthly deterministic)
    const base = pickMonthlyBaseline();

    // The first two picks are "stable anchors" (best for trust)
    const anchors = base.slice(0, 2);

    // Rotating slot uses the remaining tools
    const rest = base.slice(2);
    const restLen = rest.length;

    let rotIdx = getManualRotationIndex(restLen);
    if (rotate && restLen > 0) {
      rotIdx = (rotIdx + 1) % restLen;
      setManualRotationIndex(rotIdx);
    }

    const rotating = restLen > 0 ? rest[rotIdx] : null;

    const finalList = rotating ? [...anchors, rotating] : [...anchors];
    grid.innerHTML = finalList.map(renderPickCard).join("");

    // Optional: micro-focus for accessibility after refresh
    if (rotate) {
      const firstCard = grid.querySelector(".pick-card");
      if (firstCard) firstCard.focus?.();
    }
  }

  function bindRefresh() {
    const btn = $("#recRefresh");
    if (!btn) return;

    btn.addEventListener("click", () => {
      // button tactile feedback
      btn.disabled = true;
      btn.style.opacity = "0.85";

      renderPicks({ rotate: true });

      window.setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = "";
      }, 220);
    });
  }

  function init() {
    renderPicks({ rotate: false });
    bindRefresh();
  }

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
/* =========================================================
   PATCH — No burst + Nav glow always ON (global)
   Paste at END of /assets/site.js
========================================================= */
(() => {
  "use strict";

  // 1) Force nav glow from the moment you enter the site
  const nav = document.getElementById("topNav");
  if (nav) {
    nav.classList.add("is-scrolled", "is-down");
  }

  // 2) Kill any "burst" particles that might be created by scroll logic
  const layer = document.getElementById("clickozParticles");
  if (layer) {
    // Remove existing bursts immediately (and keep removing them)
    const killBursts = () => {
      layer.querySelectorAll(".pburst").forEach(n => n.remove());
    };
    killBursts();

    // MutationObserver: deletes bursts instantly if any script tries to add them
    const obs = new MutationObserver(() => killBursts());
    obs.observe(layer, { childList: true, subtree: true });
  }

  // 3) If your original code toggles nav.is-down off/on while scrolling,
  // keep it ON to prevent the bottom glow changing when you scroll back up.
  // (This is a safe override: it doesn't break layout.)
  window.addEventListener("scroll", () => {
    const nav2 = document.getElementById("topNav");
    if (nav2) nav2.classList.add("is-scrolled", "is-down");
  }, { passive: true });
})();
