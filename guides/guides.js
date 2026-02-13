/* /guides/guides.js?v=3
   Same behavior as v2, plus:
   - robust targets (works even if some optional blocks removed)
   - clears hash to #all when search is active (optional, subtle)
   - ESC clears search
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  // DOM
  const chipsWrap = $("#guidesChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#guidesSearch");
  const gridNode = $("#guidesGrid") || $(".guides-grid");

  if (!chipsWrap || chips.length === 0) return;

  // Cards
  let cards = $$(".guide-x");
  if (cards.length === 0) cards = $$(".guide");
  if (cards.length === 0) cards = $$(".card");

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
      cats: norm(cat).split(" ").filter(Boolean),
    };
  });

  // Empty state
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
        Try another keyword, or switch category. Press <b>Esc</b> to clear the search.
      </div>
    </div>
  `;

  // Insert empty state above grid
  if (gridNode && !$(".guides-empty")) {
    gridNode.parentElement.insertBefore(emptyState, gridNode);
  }

  // State
  let activeCat = null; // null means all
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
    if (!meta.cats || meta.cats.length === 0) return false;
    return meta.cats.includes(activeCat);
  }

  function passesQuery(meta) {
    if (!activeQuery) return true;
    const hay = `${meta.title} ${meta.desc} ${meta.keywords}`.trim();
    return hay.includes(activeQuery);
  }

  function applyFilters() {
    let shown = 0;

    cardMeta.forEach((m) => {
      const ok = passesCat(m) && passesQuery(m);
      m.el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    emptyState.style.display = shown === 0 ? "" : "none";
  }

  function scrollGridIntoView() {
    if (!gridNode) return;
    const nav = $("#topNav");
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const y = window.scrollY + gridNode.getBoundingClientRect().top - (navH + 16);
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  // Chip activation
  function onChipActivate(chipEl, { doScroll = true } = {}) {
    const key = (chipEl.getAttribute("data-filter") || "").trim();
    if (!key) return;

    activeCat = key === "all" ? null : key;
    setActiveChip(key);
    safeHashSet(key);

    applyFilters();
    if (doScroll) scrollGridIntoView();
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

  // Search
  function setQuery(v) {
    activeQuery = norm(v);
    applyFilters();

    // Optional: when searching, keep category at "all" to avoid confusion
    if (activeQuery) {
      const allChip = chips.find((c) => c.getAttribute("data-filter") === "all");
      if (allChip) {
        activeCat = null;
        setActiveChip("all");
        safeHashSet("all");
      }
    }
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

  // Init from hash
  function init() {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const has = chips.some((c) => c.getAttribute("data-filter") === raw);
    const startKey = has ? raw : (chips[0]?.getAttribute("data-filter") || "all");

    setActiveChip(startKey);
    activeCat = startKey === "all" ? null : startKey;

    activeQuery = norm(searchInput ? searchInput.value : "");
    applyFilters();
  }

  init();

  // Hash change
  window.addEventListener("hashchange", () => {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const target = chips.find((c) => c.getAttribute("data-filter") === raw);
    if (!target) return;

    // Clear search when changing category via hash/back
    if (searchInput && norm(searchInput.value)) {
      searchInput.value = "";
      setQuery("");
    }

    onChipActivate(target, { doScroll: false });
  });
})();
