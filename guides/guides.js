/* /guides/guides.js?v=4
   Guides directory:
   - Every guide stays visible by default.
   - Category chips scroll to ordered category sections.
   - Search filters inside the visible section layout.
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

  const chipsWrap = $("#guidesChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#guidesSearch");
  const originalGrid = $("#guidesGrid") || $(".guides-grid");
  const heroBox = originalGrid ? originalGrid.closest(".hero-box") : null;
  const hero = $(".guides-hero");

  if (!chipsWrap || chips.length === 0 || !originalGrid) return;

  const labels = {
    seo: { title: "SEO Guides", icon: "🔎", desc: "Search intent, snippets, internal links and pages built to rank without filler.", action: "Best paired with Meta Tags, SERP Preview and Slug Generator." },
    writing: { title: "Writing Guides", icon: "✍️", desc: "Structure, readability and editing workflows that make content easier to use.", action: "Best paired with Word Counter, Readability Analyzer and Whitespace Cleaner." },
    dev: { title: "Developer Guides", icon: "🧪", desc: "JSON, URL encoding, Base64, tokens and debugging routines for practical fixes.", action: "Best paired with JSON Formatter, URL Encoder, Base64 and Entity Encoder." },
    tracking: { title: "Tracking Guides", icon: "📈", desc: "UTM links, campaign naming and analytics hygiene for clean attribution.", action: "Best paired with UTM Builder and URL Encoder." },
    youtube: { title: "YouTube Guides", icon: "▶️", desc: "Titles, descriptions, hashtags and upload workflows for stronger creator pages.", action: "Best paired with title, thumbnail, description and hashtag tools." },
    creator: { title: "Creator Guides", icon: "🎬", desc: "Content calendars, community posts and repeatable publishing systems.", action: "Best paired with YouTube tools and UTM tracking." },
  };

  const order = ["seo", "writing", "dev", "tracking", "youtube", "creator"];
  const navOffset = () => {
    const nav = $("#topNav");
    return nav ? nav.getBoundingClientRect().height + 16 : 16;
  };

  const cards = $$(".guide-x", originalGrid);
  const cardMeta = cards.map((card) => {
    const h = $("h3", card);
    const p = $("p", card);
    const keywords = card.getAttribute("data-keywords") || "";
    const cat = (card.getAttribute("data-cat") || "seo").trim();
    return {
      el: card,
      cat,
      text: norm(`${h ? h.textContent : ""} ${p ? p.textContent : ""} ${keywords}`),
    };
  });

  function buildSections() {
    if ($(".guide-category-sections", heroBox || document)) return;

    const wrap = document.createElement("div");
    wrap.className = "guide-category-sections";
    wrap.setAttribute("aria-label", "Guides grouped by category");

    order.forEach((key) => {
      const info = labels[key];
      const section = document.createElement("section");
      section.className = "guide-category-section";
      section.id = `guides-${key}`;
      section.dataset.section = key;
      const count = cardMeta.filter((meta) => meta.cat === key).length;
      section.innerHTML = `
        <div class="guide-category-head">
          <div class="guide-category-icon" aria-hidden="true">${info.icon}</div>
          <div>
            <h3>${info.title}</h3>
            <p>${info.desc}</p>
            <div class="guide-category-meta"><span>${count} guides</span><span>${info.action}</span></div>
          </div>
        </div>
        <div class="guides-grid guide-category-grid"></div>
      `;

      const grid = $(".guide-category-grid", section);
      cardMeta
        .filter((meta) => meta.cat === key)
        .forEach((meta) => grid.appendChild(meta.el));

      if (grid.children.length) wrap.appendChild(section);
    });

    originalGrid.replaceWith(wrap);
  }

  buildSections();

  const sections = $$(".guide-category-section");
  const sectionByKey = new Map(sections.map((section) => [section.dataset.section, section]));

  const emptyState = document.createElement("div");
  emptyState.className = "guides-empty";
  emptyState.setAttribute("role", "status");
  emptyState.setAttribute("aria-live", "polite");
  emptyState.style.display = "none";
  emptyState.innerHTML = `
    <div class="cms-empty-box">
      <strong>No guides found</strong>
      <span>Try another keyword, or press Esc to return to the full guide library.</span>
    </div>
  `;

  const groupedWrap = $(".guide-category-sections");
  if (groupedWrap && !$(".guides-empty")) groupedWrap.parentElement.insertBefore(emptyState, groupedWrap);

  function setActiveChip(key, { focus = false } = {}) {
    chips.forEach((chip) => {
      const active = chip.getAttribute("data-filter") === key;
      chip.classList.toggle("active", active);
      if (active) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    });

    if (focus) {
      const active = chips.find((chip) => chip.getAttribute("data-filter") === key);
      if (active) active.focus({ preventScroll: true });
    }
  }

  function scrollToKey(key) {
    const target = key === "all" ? hero || heroBox : sectionByKey.get(key);
    if (!target) return;

    const y = window.scrollY + target.getBoundingClientRect().top - navOffset();
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function updateHash(key) {
    if (key === "all") {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      return;
    }

    const hash = `#${encodeURIComponent(key)}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function activateKey(key, { doScroll = true, syncHash = true } = {}) {
    const valid = key === "all" || sectionByKey.has(key);
    if (!valid) return;
    setActiveChip(key);
    if (syncHash) updateHash(key);
    if (doScroll) scrollToKey(key);
  }

  chips.forEach((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    chip.addEventListener("click", () => activateKey(chip.getAttribute("data-filter") || "all"));
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateKey(chip.getAttribute("data-filter") || "all");
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = chips.indexOf(chip);
        const nextIdx = e.key === "ArrowRight" ? (idx + 1) % chips.length : (idx - 1 + chips.length) % chips.length;
        chips[nextIdx].focus();
      }
    });
  });

  function applySearch(value) {
    const q = norm(value);
    let shown = 0;

    cardMeta.forEach((meta) => {
      const ok = !q || meta.text.includes(q);
      meta.el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    sections.forEach((section) => {
      const visible = $$(".guide-x", section).some((card) => card.style.display !== "none");
      section.style.display = !q || visible ? "" : "none";
    });

    emptyState.style.display = q && shown === 0 ? "" : "none";
    if (q) setActiveChip("all");
  }

  function debounce(fn, wait = 120) {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  if (searchInput) {
    const handler = debounce(() => applySearch(searchInput.value), 120);
    searchInput.addEventListener("input", handler);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        applySearch("");
        searchInput.blur();
      }
    });
  }

  const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
  if (raw && sectionByKey.has(raw)) {
    setActiveChip(raw);
    window.setTimeout(() => scrollToKey(raw), 60);
  } else {
    setActiveChip("all");
    if (location.hash && raw === "all") history.replaceState(null, "", location.pathname + location.search);
  }

  window.addEventListener("hashchange", () => {
    const key = decodeURIComponent((location.hash || "").replace("#", "").trim());
    if (!key || key === "all") activateKey("all", { syncHash: false });
    else if (sectionByKey.has(key)) activateKey(key, { syncHash: false });
  });
})();

