(() => {
  "use strict";
  const swatches = [
    ["#22d3ee", "#06b6d4", "Cyan"],
    ["#6366f1", "#8b5cf6", "Violet"],
    ["#3b82f6", "#60a5fa", "Blue"],
    ["#10b981", "#34d399", "Green"],
    ["#f59e0b", "#fbbf24", "Amber"],
    ["#f97316", "#fb923c", "Orange"],
    ["#ef4444", "#f87171", "Red"],
    ["#ec4899", "#f472b6", "Pink"]
  ];

  function hexToRgbTriplet(hex) {
    const h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16)
      ].join(",");
    }
    if (h.length === 6) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
      ].join(",");
    }
    return "34,211,238";
  }

  function setPremiumAccent(a1, a2) {
    const accent = a1 || "#22d3ee";
    const accent2 = a2 || "#06b6d4";
    const rgb = hexToRgbTriplet(accent);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent2", accent2);
    document.documentElement.style.setProperty("--accent-rgb", rgb);
    document.documentElement.style.setProperty("--cz-accent", accent);
    document.documentElement.style.setProperty("--cz-accent2", accent2);
    document.documentElement.style.setProperty("--cz-accent-rgb", rgb);
    document.querySelectorAll("#colorDot,.cz-theme-dot").forEach((dot) => {
      dot.style.background = accent;
    });
    document.querySelectorAll(".logo-badge").forEach((badge) => {
      badge.style.color = accent;
    });
    document.querySelectorAll(".color-option,.cz-theme-option").forEach((option) => {
      option.classList.toggle("active", option.dataset.accent === accent);
    });
    try {
      localStorage.setItem("clickoz_accent", JSON.stringify({ a1: accent, a2: accent2 }));
    } catch (_) {}
    document.dispatchEvent(new CustomEvent("clickoz:accent-change", {
      detail: { accent, accent2, rgb }
    }));
  }

  function getSavedAccent() {
    try {
      const saved = JSON.parse(localStorage.getItem("clickoz_accent") || "null");
      if (saved && saved.a1) return saved;
    } catch (_) {}
    return { a1: "#22d3ee", a2: "#06b6d4" };
  }

  function ensureThemePicker() {
    let actions = document.querySelector(".nav-actions");
    const navInner = document.querySelector(".nav-inner");
    if (!actions && navInner) {
      actions = document.createElement("div");
      actions.className = "nav-actions";
      actions.setAttribute("aria-label", "Preferences");
      navInner.appendChild(actions);
    }
    if (!actions || document.querySelector("#colorToggle")) return;
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown cz-theme-dropdown";
    dropdown.innerHTML = `
      <button class="dot-btn" id="colorToggle" type="button" aria-haspopup="true" aria-expanded="false" title="Theme color">
        <span class="dot cz-theme-dot" id="colorDot" aria-hidden="true"></span>
      </button>
      <div class="menu" id="colorMenu" role="menu" aria-label="Pick theme color">
        <div class="menu-title">Theme color</div>
        <div class="color-grid">
          ${swatches.map(([a1, a2, label]) => `<button class="color-option cz-theme-option" type="button" data-accent="${a1}" data-accent2="${a2}" style="background:${a1}" title="${label}" role="menuitem"></button>`).join("")}
        </div>
      </div>`;
    actions.prepend(dropdown);
  }

  ensureThemePicker();
  setPremiumAccent(getSavedAccent().a1, getSavedAccent().a2);

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("#colorToggle");
    const option = event.target.closest(".color-option");
    const menu = document.querySelector("#colorMenu");
    if (toggle && menu) {
      event.stopPropagation();
      const open = menu.classList.contains("active");
      document.querySelectorAll(".menu.active").forEach((el) => el.classList.remove("active"));
      menu.classList.toggle("active", !open);
      toggle.setAttribute("aria-expanded", String(!open));
      return;
    }
    if (option) {
      event.stopPropagation();
      setPremiumAccent(option.dataset.accent, option.dataset.accent2);
      document.querySelectorAll(".menu.active").forEach((el) => el.classList.remove("active"));
    }
  });

  document.documentElement.classList.add("cz-premium-ready");
  const grid = document.createElement("div");
  grid.className = "cz-neon-grid";
  grid.setAttribute("aria-hidden", "true");
  const scan = document.createElement("div");
  scan.className = "cz-scanline";
  scan.setAttribute("aria-hidden", "true");
  const orb = document.createElement("div");
  orb.className = "cz-orb";
  orb.setAttribute("aria-hidden", "true");
  document.body.prepend(orb);
  document.body.prepend(scan);
  document.body.prepend(grid);

  let raf = 0;
  window.addEventListener("pointermove", (event) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const x = Math.round((event.clientX / Math.max(1, innerWidth)) * 100);
      const y = Math.round((event.clientY / Math.max(1, innerHeight)) * 100);
      document.documentElement.style.setProperty("--cz-mx", x + "%");
      document.documentElement.style.setProperty("--cz-my", y + "%");
      raf = 0;
    });
  }, { passive: true });

  const cards = document.querySelectorAll(".card,.small-card,.guide-x,.release-card,.pick-card,.workflow-card,.lane");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", (event.clientX - rect.left) + "px");
      card.style.setProperty("--spot-y", (event.clientY - rect.top) + "px");
    }, { passive: true });
  });
})();
