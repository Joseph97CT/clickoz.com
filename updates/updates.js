/* /updates/updates.js?v=1
   Clickoz Updates page behavior:
   - Category chips filter (All / major / minor / fix / design / seo / performance)
   - Search live (title + short desc + highlights + tags)
   - Expand/collapse per-release details (optional .release-details)
   - Hash sync (#all, #major, #seo, ...)
   - Keyboard accessible chips (Enter/Space + arrows)
   - ESC clears search
   - Elegant empty state

   Expected markup:
   - Chips wrapper: #updatesChips .chip[data-filter="all|major|minor|fix|design|seo|performance"]
   - Search input: #updatesSearch
   - Release cards: .release-card[data-type="major|minor|fix"][data-tags="seo performance design ..."]
       * title element: .release-title (or h3)
       * desc element: .release-desc (optional)
       * highlights list: .release-highlights (optional)
       * tags: .tag (optional)
       * toggle: .release-more (optional) OR button[data-action="toggle-details"]
       * details: .release-details (optional)
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
  const chipsWrap = $("#updatesChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#updatesSearch");
  const grid = $(".updates-grid") || $("#updatesGrid") || document.body;

  if (!chipsWrap || chips.length === 0) return;

  // Release cards
  const cards = $$(".release-card");
  const meta = cards.map((el) => {
    const titleEl = $(".release-title", el) || $("h3", el);
    const descEl = $(".release-desc", el) || $("p", el);
    const highlightsEl = $(".release-highlights", el);
    const tagsEls = $$(".tag", el);

    const dataType = norm(el.getAttribute("data-type") || "");
    const dataTags = norm(el.getAttribute("data-tags") || "");

    const highlightsText = highlightsEl ? norm(highlightsEl.textContent) : "";
    const tagsText = tagsEls.length ? norm(tagsEls.map(t => t.textContent).join(" ")) : "";

    // also include meta pills if present
    const typeEl = $(".release-type", el);
    const typeText = typeEl ? norm(typeEl.textContent) : "";

    return {
      el,
      type: dataType || typeText,
      tags: dataTags.split(" ").filter(Boolean),
      hay: norm(
        [
          titleEl ? titleEl.textContent : "",
          descEl ? descEl.textContent : "",
          highlightsText,
          tagsText,
          dataTags,
          dataType,
          typeText
        ].join(" ")
      )
    };
  });

  // Empty state (insert once)
  const emptyState = document.createElement("div");
  emptyState.className = "updates-empty";
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
        No updates found
      </div>
      <div style="color:rgba(242,242,255,.72);font-size:13.5px;line-height:1.6;">
        Try another keyword, or switch filters. Press <b>Esc</b> to clear the search.
      </div>
    </div>
  `;

  if (grid && !$(".updates-empty")) {
    grid.parentElement.insertBefore(emptyState, grid);
  }

  // State
  let activeFilter = "all"; // one of the chip keys
  let activeQuery = "";

  function setActiveChip(key, { focus = false } = {}) {
    chips.forEach((c) => {
      const isActive = c.getAttribute("data-filter") === key;
      c.classList.toggle("active", isActive);
      if (isActive) c.setAttribute("aria-current", "true");
      else c.removeAttribute("aria-current");
    });
    if (focus) {
      const a = chips.find((c) => c.getAttribute("data-filter") === key);
      if (a) a.focus({ preventScroll: true });
    }
  }

  function passFilter(m) {
    const f = activeFilter;
    if (!f || f === "all") return true;

    // filter matches either type or tags
    if (m.type === f) return true;
    if (m.tags && m.tags.includes(f)) return true;

    return false;
  }

  function passQuery(m) {
    if (!activeQuery) return true;
    return m.hay.includes(activeQuery);
  }

  function apply() {
    let shown = 0;

    meta.forEach((m) => {
      const ok = passFilter(m) && passQuery(m);
      m.el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });

    emptyState.style.display = shown === 0 ? "" : "none";
  }

  // Chip interaction
  function activateChip(chipEl, { doHash = true } = {}) {
    const key = (chipEl.getAttribute("data-filter") || "").trim();
    if (!key) return;

    activeFilter = key;
    setActiveChip(key);
    if (doHash) safeHashSet(key);

    // If user switches filter, keep current query (good UX)
    apply();

    // Optional: smooth scroll to grid if user is deep
    if (grid) {
      const nav = $("#topNav");
      const navH = nav ? nav.getBoundingClientRect().height : 0;
      const y = window.scrollY + grid.getBoundingClientRect().top - (navH + 16);
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }

  chips.forEach((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    chip.addEventListener("click", () => activateChip(chip));

    chip.addEventListener("keydown", (e) => {
      const k = e.key;

      if (k === "Enter" || k === " ") {
        e.preventDefault();
        activateChip(chip);
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
    apply();
  }

  if (searchInput) {
    const onInput = debounce(() => setQuery(searchInput.value), 120);
    searchInput.addEventListener("input", onInput);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        setQuery("");
        searchInput.blur();
      }
    });
  }

  // Expand/collapse details (event delegation)
  document.addEventListener("click", (e) => {
    const t = e.target;

    // .release-more OR explicit toggle button
    const toggle =
      t.closest?.(".release-more") ||
      t.closest?.('button[data-action="toggle-details"]');

    if (!toggle) return;

    const card = toggle.closest(".release-card");
    if (!card) return;

    const details = $(".release-details", card);
    if (!details) return;

    const isOpen = details.style.display === "block";
    details.style.display = isOpen ? "none" : "block";

    // update label if it's a button/link
    if (toggle.tagName === "BUTTON") {
      toggle.setAttribute("aria-expanded", String(!isOpen));
    } else {
      // optional: if you set data-open-text/data-close-text
      const openText = toggle.getAttribute("data-open-text") || "View details";
      const closeText = toggle.getAttribute("data-close-text") || "Hide details";
      toggle.textContent = isOpen ? openText : closeText;
    }
  });

  // Init from hash
  function initFromHash() {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const has = chips.some((c) => c.getAttribute("data-filter") === raw);
    const start = has ? raw : "all";

    activeFilter = start;
    setActiveChip(start);
    safeHashSet(start);

    activeQuery = norm(searchInput ? searchInput.value : "");
    apply();
  }

  initFromHash();

  window.addEventListener("hashchange", () => {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const target = chips.find((c) => c.getAttribute("data-filter") === raw);
    if (!target) return;
    activateChip(target, { doHash: false });
  });
})();

