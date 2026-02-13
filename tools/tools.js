/* /tools/tools.js?v=2
   Clickoz Tools page behavior:
   - Category chips -> smooth scroll to section + active state
   - Scroll spy -> updates active chip based on section in view
   - Search -> filters tool cards across all categories (title + description)
   - Hash sync -> updates URL hash without jump
   - Mobile-friendly + accessible (keyboard + aria)
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Elements
  const chipsWrap = $("#toolsChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#toolsSearch");
  const sectionsWrap = $(".tool-sections");
  const sections = sectionsWrap ? $$(".tool-section", sectionsWrap) : [];

  // Guards
  if (!chipsWrap || chips.length === 0 || sections.length === 0) {
    // Page markup not found; exit gracefully.
    return;
  }

  // Map: filter -> section element
  const sectionByKey = new Map();
  sections.forEach((sec) => {
    const key = (sec.getAttribute("data-section") || sec.id || "").trim();
    if (key) sectionByKey.set(key, sec);
  });

  // Helper: normalize text for search
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  // ---------------------------
  // Active chip management
  // ---------------------------
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

  function updateHash(key) {
    const hash = `#${encodeURIComponent(key)}`;
    // Avoid continuous history spam
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  // Smooth scroll with a small offset (to account for fixed nav)
  function scrollToSection(key) {
    const sec = sectionByKey.get(key);
    if (!sec) return;

    const nav = $("#topNav");
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const y = window.scrollY + sec.getBoundingClientRect().top - (navH + 14);

    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  // ---------------------------
  // Chips click + keyboard
  // ---------------------------
  function onChipActivate(chipEl) {
    const key = chipEl.getAttribute("data-filter");
    if (!key) return;

    setActiveChip(key);
    updateHash(key);
    scrollToSection(key);

    // If user has search active, keep it (filtering still applies),
    // but ensure section is visible even if many cards are hidden.
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

      // Optional: arrow navigation between chips
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

  // ---------------------------
  // Search filtering (cards)
  // ---------------------------
  const allCards = $$(".card");
  const cardMeta = allCards.map((card) => {
    const h = $("h3", card);
    const p = $("p", card);
    return {
      el: card,
      text: norm(`${h ? h.textContent : ""} ${p ? p.textContent : ""}`),
      section: card.closest(".tool-section"),
    };
  });

  // "No results" UI (inserts once)
  const emptyState = document.createElement("div");
  emptyState.className = "tools-empty";
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
      max-width: 760px;
      margin: 12px auto 0;
    ">
      <div style="font-weight:1000;letter-spacing:-.01em;color:rgba(255,255,255,.92);margin-bottom:6px;">
        No tools found
      </div>
      <div style="color:rgba(242,242,255,.72);font-size:13.5px;line-height:1.6;">
        Try a different keyword (e.g. <b>json</b>, <b>meta</b>, <b>readability</b>, <b>url</b>, <b>base64</b>)
        or clear the search to see all tools.
      </div>
    </div>
  `;

  // Put empty state under hero (still inside main shell)
  const toolsShell = $(".tools-shell");
  if (toolsShell && !$(".tools-empty")) {
    // Insert after the sections block starts (right before tool-sections)
    const toolSections = $(".tool-sections", toolsShell);
    if (toolSections) toolsShell.insertBefore(emptyState, toolSections);
    else toolsShell.appendChild(emptyState);
  }

  function setSectionVisible(sectionEl, visible) {
    if (!sectionEl) return;
    sectionEl.style.display = visible ? "" : "none";
  }

  function filterCards(query) {
    const q = norm(query);
    let shown = 0;

    // Filter cards
    cardMeta.forEach(({ el, text }) => {
      const ok = !q || text.includes(q);
      el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    // Hide empty categories (sections with zero visible cards)
    sections.forEach((sec) => {
      const hasVisibleCard = $$(".card", sec).some(
        (c) => c.style.display !== "none"
      );
      setSectionVisible(sec, hasVisibleCard);
    });

    // Empty state
    if (shown === 0 && q) {
      emptyState.style.display = "";
    } else {
      emptyState.style.display = "none";
    }

    // If user is searching, don't force chip changes.
    // But if current active chip section got hidden, remove "active" highlight.
    if (q) {
      const activeChip = chips.find((c) => c.classList.contains("active"));
      if (activeChip) {
        const key = activeChip.getAttribute("data-filter");
        const sec = sectionByKey.get(key);
        if (sec && sec.style.display === "none") {
          chips.forEach((c) => c.classList.remove("active"));
        }
      }
    }
  }

  // Debounce
  function debounce(fn, wait = 120) {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  if (searchInput) {
    const handler = debounce(() => filterCards(searchInput.value), 120);
    searchInput.addEventListener("input", handler);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        filterCards("");
        searchInput.blur();
      }
    });
  }

  // ---------------------------
  // Scroll spy (active chip based on section)
  // ---------------------------
  let spyEnabled = true;

  // Disable spy while user is "actively" searching (prevents chip flicker)
  function updateSpyEnabled() {
    const q = norm(searchInput ? searchInput.value : "");
    spyEnabled = !q;
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce(updateSpyEnabled, 50));
  }

  const nav = $("#topNav");
  const navH = () => (nav ? nav.getBoundingClientRect().height : 0);

  // Intersection observer: pick section with highest intersection ratio
  const ratios = new Map();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));

      if (!spyEnabled) return;

      // Choose best visible section
      let best = null;
      let bestRatio = 0;

      sections.forEach((sec) => {
        // ignore hidden sections (e.g., during search)
        if (sec.style.display === "none") return;
        const r = ratios.get(sec) || 0;
        if (r > bestRatio) {
          bestRatio = r;
          best = sec;
        }
      });

      if (!best || bestRatio < 0.12) return;

      const key = best.getAttribute("data-section") || best.id;
      if (!key) return;

      setActiveChip(key);
      updateHash(key);
    },
    {
      root: null,
      threshold: [0.12, 0.22, 0.35, 0.5, 0.65, 0.8],
      rootMargin: `-${Math.round(navH() + 24)}px 0px -55% 0px`,
    }
  );

  sections.forEach((sec) => io.observe(sec));

  // ---------------------------
  // Initial state from hash
  // ---------------------------
  function initFromHash() {
    const raw = (location.hash || "").replace("#", "");
    const key = decodeURIComponent(raw || "").trim();

    // Default chip
    const fallback = chips[0]?.getAttribute("data-filter") || "seo";

    const startKey = sectionByKey.has(key) ? key : fallback;
    setActiveChip(startKey);
    updateHash(startKey);

    // If hash existed, scroll to it (after layout)
    if (sectionByKey.has(key)) {
      // small delay to allow CSS/layout settle (especially on mobile)
      window.setTimeout(() => scrollToSection(startKey), 40);
    }
  }

  initFromHash();

  // If user changes hash manually (back/forward)
  window.addEventListener("hashchange", () => {
    const raw = (location.hash || "").replace("#", "");
    const key = decodeURIComponent(raw || "").trim();
    if (!sectionByKey.has(key)) return;

    // If searching, clear search to restore sections
    if (searchInput && norm(searchInput.value)) {
      searchInput.value = "";
      filterCards("");
      updateSpyEnabled();
    }

    setActiveChip(key, { focus: false });
    scrollToSection(key);
  });
})();
