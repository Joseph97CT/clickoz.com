/* /updates/updates.js?v=2
   ✅ Optimized + ALL 3 upgrades:
   - chips filter (NO search)
   - timeline friendly (no assumptions about layout)
   - expand/collapse per release details
   - collapsible donation box (PayPal ready)
   - hash sync (#all, #major, #seo, ...)
   - keyboard accessible chips

   Expected markup:
   - #updatesChips .chip[data-filter="all|major|minor|fix|design|seo|performance"]
   - .release-card[data-type="major|minor|fix"][data-tags="seo performance design ..."]
   - optional: .release-more + .release-details
   - donation: .donate-box + #donateToggle + .donate-body
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();

  function safeHashSet(key) {
    const h = `#${encodeURIComponent(key)}`;
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  // --------- Chips filter ---------
  const chipsWrap = $("#updatesChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const grid = $(".updates-grid") || $("#updatesGrid") || document.body;

  if (!chipsWrap || chips.length === 0) return;

  const cards = $$(".release-card");
  const meta = cards.map((el) => {
    const type = norm(el.getAttribute("data-type") || "");
    const tags = norm(el.getAttribute("data-tags") || "")
      .split(" ")
      .filter(Boolean);
    return { el, type, tags };
  });

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
        Switch filters to explore other releases.
      </div>
    </div>
  `;
  if (grid && !$(".updates-empty")) grid.parentElement.insertBefore(emptyState, grid);

  let activeFilter = "all";

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
    if (m.type === f) return true;
    if (m.tags && m.tags.includes(f)) return true;
    return false;
  }

  function apply() {
    let shown = 0;
    meta.forEach((m) => {
      const ok = passFilter(m);
      m.el.style.display = ok ? "" : "none";
      if (ok) shown++;
    });
    emptyState.style.display = shown === 0 ? "" : "none";
  }

  function activateChip(chipEl, { doHash = true } = {}) {
    const key = (chipEl.getAttribute("data-filter") || "").trim();
    if (!key) return;

    activeFilter = key;
    setActiveChip(key);
    if (doHash) safeHashSet(key);

    apply();

    // gentle scroll to grid
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

  // Init from hash
  function initFromHash() {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const has = chips.some((c) => c.getAttribute("data-filter") === raw);
    const start = has ? raw : "all";

    activeFilter = start;
    setActiveChip(start);
    safeHashSet(start);
    apply();
  }
  initFromHash();

  window.addEventListener("hashchange", () => {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const target = chips.find((c) => c.getAttribute("data-filter") === raw);
    if (!target) return;
    activateChip(target, { doHash: false });
  });

  // --------- Per-release details toggle (optional) ---------
  document.addEventListener("click", (e) => {
    const t = e.target;
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

    if (toggle.tagName === "BUTTON") {
      toggle.setAttribute("aria-expanded", String(!isOpen));
    } else {
      const openText = toggle.getAttribute("data-open-text") || "View details";
      const closeText = toggle.getAttribute("data-close-text") || "Hide details";
      toggle.textContent = isOpen ? openText : closeText;
    }
  });

  // --------- Donation collapsible (PayPal box) ---------
  const donateBox = $(".donate-box");
  const donateToggle = $("#donateToggle");

  if (donateBox && donateToggle) {
    const KEY = "clickoz_donate_open";
    const saved = localStorage.getItem(KEY);
    const startOpen = saved === "1";

    donateBox.setAttribute("data-open", startOpen ? "true" : "false");
    donateToggle.setAttribute("aria-expanded", startOpen ? "true" : "false");

    donateToggle.addEventListener("click", () => {
      const isOpen = donateBox.getAttribute("data-open") === "true";
      const next = !isOpen;

      donateBox.setAttribute("data-open", next ? "true" : "false");
      donateToggle.setAttribute("aria-expanded", next ? "true" : "false");
      localStorage.setItem(KEY, next ? "1" : "0");
    });
  }
})();
