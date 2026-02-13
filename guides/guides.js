/* /guides/guides.js?v=2
   Clickoz Guides page behavior:
   - Category chips -> filter guide cards (no reload) + optional scroll
   - Search -> filters by title + description + optional keywords
   - Hash sync -> updates URL hash without jump (e.g. #seo, #writing)
   - Keyboard accessible chips (Enter/Space + arrow nav)
   - ESC clears search
   - Elegant empty state
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Helpers ----------
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const debounce = (fn, wait = 120) => {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  };

  function safeHashSet(key) {
    const h = `#${encodeURIComponent(key)}`;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  // ---------- DOM ----------
  const chipsWrap = $("#guidesChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#guidesSearch") || $("#toolsSearch"); // fallback if you reused id
  const grid = $("#guidesGrid") || $(".guides-grid") || document.body;

  // If markup missing, exit gracefully
  if (!chipsWrap || chips.length === 0) return;

  // Guide cards:
  // expected: <a class="guide-x" data-cat="seo writing" data-keywords="...">
  // but we support fallbacks (".card" or ".guide")
  let cards = $$(".guide-x");
  if (cards.length === 0) cards = $$(".guide");
  if (cards.length === 0) cards = $$(".card"); // last resort

  // Build searchable meta
  const cardMeta = cards.map((el) => {
    const h = $("h3", el);
    const p = $("p", el);
    const kw = el.getAttribute("data-keywords") || "";
    const cat = el.getAttribute("data-cat") || el.getAttribute("data-category") || "";
    return {
      el,
      title: norm(h ? h.textContent : ""),
      desc: norm(p ? p.textContent : ""),
      keywords: norm(kw),
      cats: norm(cat).split(" ").filter(Boolean), // ["seo","writing",...]
    };
  });

  // Empty state node (insert once)
  const emptyState = document.createElement("div");
  emptyState.className = "guides-empty";
  emptyState.setAttribute("role", "status");
  emptyState.setAttribute("aria-live", "polite");
  emptyState.style.display = "none";
  emptyState.innerHTML = `
    <div style="
      border:1px solid rgba(255,255,255,.12);
      background:rgba(0,0,0,.18);
      border-radius:16px;
      padding:14px 14px 12px;
      text-align:center;
      box-shadow: 0 14px 34px rgba(0,0,0,.30);
      max-width: 860px;
      margin: 12px auto 0;
    ">
      <div style="font-weight:1000;letter-spacing:-.01em;color:rgba(255,255,255,.92);margin-bottom:6px;">
        No guides found
      </div>
      <div style="color:rgba(242,242,255,.72);font-size:13.5px;line-height:1.6;">
        Try another keyword or switch category. You can also clear the search to see everything.
      </div>
    </div>
  `;

  // Place empty state right after the grid wrapper (preferred), otherwise after chips
  const insertTarget =
    $("#guidesGrid")?.parentElement ||
    $(".hero-box") ||
    chipsWrap.parentElement ||
    document.body;

  if (insertTarget && !$(".guides-empty")) {
    // Try to place it right before the grid node if possible
    const gridNode = $("#guidesGrid") || $(".guides-grid");
    if (gridNode && gridNode.parentElement === insertTarget) {
      insertTarget.insertBefore(emptyState, gridNode);
    } else {
      insertTarget.appendChild(emptyState);
    }
  }

  // ---------- Filtering state ----------
  let activeCat = null; // null = "all"
  let activeQuery = "";

  function setActiveChip(key, { focus = false } = {}) {
    chips.forEach((c) => {
      const isActive = c.getAttribute("data-filter") === key;
      c.classList.toggle("active", isActive);
      if (isActive) c.setAttribute("aria-current", "true");
      else c.removeAttribute("aria-current");
    });

    if (focus) {
      const active = chips.find((c) => c.getAttribute("data-filter") === key);
      if (active) active.focus({ preventScroll: true });
    }
  }

  function passesCat(meta) {
    if (!activeCat || activeCat === "all") return true;
    // If card has no cats defined, keep it visible only in "all"
    if (!meta.cats || meta.cats.length === 0) return false;
    return meta.cats.includes(activeCat);
  }

  function passesQuery(meta) {
    const q = activeQuery;
    if (!q) return true;
    const hay = `${meta.title} ${meta.desc} ${meta.keywords}`.trim();
    return hay.includes(q);
  }

  function applyFilters() {
    let shown = 0;

    cardMeta.forEach((m) => {
      const ok = passesCat(m) && passesQuery(m);
      m.el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    // Empty state
    if (shown === 0) emptyState.style.display = "";
    else emptyState.style.display = "none";
  }

  // ---------- Chip events ----------
  function onChipActivate(chipEl) {
    const key = (chipEl.getAttribute("data-filter") || "").trim();
    if (!key) return;

    activeCat = key === "all" ? null : key;
    setActiveChip(key);
    safeHashSet(key);

    applyFilters();

    // Optional: if user has scrolled deep, bring grid into view
    const gridNode = $("#guidesGrid") || $(".guides-grid");
    if (gridNode) {
      const nav = $("#topNav");
      const navH = nav ? nav.getBoundingClientRect().height : 0;
      const y = window.scrollY + gridNode.getBoundingClientRect().top - (navH + 16);
      // Smooth but not aggressive
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }

  chips.forEach((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    chip.addEventListener("click", () => onChipActivate(chip));

    chip.addEventListener("keydown", (e) => {
      const k = e.key;
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        onChipActivate(chip);
        return;
      }

      if (k === "ArrowRight" || k === "ArrowLeft") {
        e.preventDefault();
        const idx = chips.indexOf(chip);
        const nextIdx =
          k === "ArrowRight"
            ? (idx + 1) % chips.length
            : (idx - 1 + chips.length) % chips.length;
        chips[nextIdx].focus();
      }
    });
  });

  // ---------- Search events ----------
  function setQuery(v) {
    activeQuery = norm(v);
    applyFilters();
  }

  if (searchInput) {
    const handler = debounce(() => setQuery(searchInput.value), 120);
    searchInput.addEventListener("input", handler);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        setQuery("");
        searchInput.blur();
      }
    });
  }

  // ---------- Init from hash ----------
  function init() {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const has = chips.some((c) => c.getAttribute("data-filter") === raw);
    const startKey = has ? raw : (chips[0]?.getAttribute("data-filter") || "all");

    setActiveChip(startKey);
    activeCat = startKey === "all" ? null : startKey;
    safeHashSet(startKey);

    // Ensure query starts clean
    activeQuery = norm(searchInput ? searchInput.value : "");
    applyFilters();
  }

  init();

  window.addEventListener("hashchange", () => {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const target = chips.find((c) => c.getAttribute("data-filter") === raw);
    if (!target) return;

    onChipActivate(target);
  });
})();
