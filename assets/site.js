/* =========================================================
   Clickoz — site.js (CLEAN + PRO)
   - One file, used across all pages
   - Violet default accent on first visit
   - Mobile drawer + dropdown close helpers
   - Search + chips (only if present)
   - Recommended random picks (home) + manual refresh (if present)
   - Cookie consent + stable language preference
   - DOM particles (idle + burst) — NO click effects
   - Space canvas "starfield" — NO click effects, follows --accent-rgb
   - Active nav link (single, non-duplicated)
========================================================= */

(() => {
  "use strict";

  /* ---------------------------
     Helpers
  --------------------------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const rnd = (a,b)=>Math.random()*(b-a)+a;

  const prefersReduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobilePerfMode = window.matchMedia &&
    window.matchMedia("(max-width: 820px), (pointer: coarse), (max-height: 480px) and (orientation: landscape)").matches;
  const saveDataMode = Boolean(navigator.connection && (
    navigator.connection.saveData ||
    /(^|-)2g/i.test(String(navigator.connection.effectiveType || ""))
  ));
  const leanPerfMode = prefersReduce || saveDataMode;
  if (mobilePerfMode) document.documentElement.classList.add("mobile-perf-mode");
  if (leanPerfMode) document.documentElement.classList.add("lean-perf-mode");

  function removeAmbientEffects(){
    document.getElementById("spaceParticles")?.remove();
    if (leanPerfMode) document.getElementById("clickozParticles")?.remove();
  }

  if (leanPerfMode) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", removeAmbientEffects, { once:true });
    } else {
      removeAmbientEffects();
    }
  }

  const THEME_SWATCHES = [
    ["#38e8ff", "#8af3ff", "Cyan"],
    ["#6fb6ff", "#b9e2ff", "Blue"],
    ["#9b8cff", "#d6ccff", "Violet"],
    ["#5cff9d", "#c7ffd6", "Green"],
    ["#ff6f7d", "#ffc0c7", "Red"],
    ["#ff6fde", "#ffc2f0", "Pink"],
    ["#fff36d", "#fff8b8", "Yellow"],
    ["#ffc85f", "#ffe0a3", "Amber"]
  ];
  const DEFAULT_ACCENT = "#9b8cff";
  const DEFAULT_ACCENT2 = "#d6ccff";
  const DEFAULT_ACCENT_RGB = "155,140,255";

  const LEGACY_SWATCHES = {
    "#22d3ee": ["#38e8ff", "#8af3ff"],
    "#38e8ff": ["#38e8ff", "#8af3ff"],
    "#6366f1": ["#9b8cff", "#d6ccff"],
    "#8b7cff": ["#9b8cff", "#d6ccff"],
    "#3b82f6": ["#6fb6ff", "#b9e2ff"],
    "#5ea8ff": ["#6fb6ff", "#b9e2ff"],
    "#10b981": ["#5cff9d", "#c7ffd6"],
    "#31f5bd": ["#5cff9d", "#c7ffd6"],
    "#39f5c7": ["#5cff9d", "#c7ffd6"],
    "#ef4444": ["#ff6f7d", "#ffc0c7"],
    "#ff5c6c": ["#ff6f7d", "#ffc0c7"],
    "#ff6fa8": ["#ff6f7d", "#ffc0c7"],
    "#ec4899": ["#ff6fde", "#ffc2f0"],
    "#ff5fbd": ["#ff6fde", "#ffc2f0"],
    "#fde047": ["#fff36d", "#fff8b8"],
    "#ffe45c": ["#fff36d", "#fff8b8"],
    "#f59e0b": ["#ffc85f", "#ffe0a3"],
    "#ffb238": ["#ffc85f", "#ffe0a3"],
    "#f97316": ["#ffc85f", "#ffe0a3"],
    "#ff7a1a": ["#ffc85f", "#ffe0a3"],
    "#cbd5e1": ["#38e8ff", "#8af3ff"],
    "#f8fafc": ["#38e8ff", "#8af3ff"]
  };

  function normalizeAccentPair(a1, a2){
    const key = String(a1 || "").toLowerCase();
    const upgraded = LEGACY_SWATCHES[key];
    if (upgraded) return upgraded;
    const current = THEME_SWATCHES.find(([accent]) => accent.toLowerCase() === key);
    if (current) return [current[0], current[1]];
    return [DEFAULT_ACCENT, DEFAULT_ACCENT2];
  }

  function closeAllMenus(){
    $$('.menu.active').forEach(m => m.classList.remove('active'));
    $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.documentElement.classList.remove('theme-menu-open');
  }

  function colorGridMarkup(){
    return THEME_SWATCHES.map(([a1, a2, label]) =>
      `<button class="color-option" type="button" data-accent="${a1}" data-accent2="${a2}" style="--swatch:${a1};--swatch2:${a2}" title="${label}" role="menuitem" aria-label="${label} theme"><span class="color-swatch" aria-hidden="true"></span><span class="color-label">${label}</span></button>`
    ).join("");
  }

  function themePickerMarkup(){
    return `
      <div class="dropdown">
        <button class="dot-btn" id="colorToggle" type="button" aria-haspopup="true" aria-expanded="false" title="Theme color" aria-label="Theme color">
          <span class="dot" id="colorDot" aria-hidden="true"></span>
        </button>
        <div class="menu" id="colorMenu" role="menu" aria-label="Pick theme color">
          <div class="menu-title">Theme color</div>
          <div class="color-grid">${colorGridMarkup()}</div>
        </div>
      </div>`;
  }

  function burgerMarkup(){
    return `
      <button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <span></span><span></span><span></span>
      </button>`;
  }

  function translateMarkup(){
    return `<div id="gtNavWrap" aria-label="Translate"><div id="google_translate_element"><div id="google_translate_native"></div></div></div>`;
  }

  const NAV_CATEGORY_GROUPS = {
    tools: {
      href: "/tools/",
      label: "Tools",
      indexLabel: "All tools",
      indexNote: "Complete tools index",
      mobileNote: "Open the full tools hub first.",
      items: [
        ["SEO Tools", "/tools/seo-tools/"],
        ["Writing Tools", "/tools/writing-tools/"],
        ["YouTube Tools", "/tools/youtube-tools/"],
        ["Social & AI Tools", "/tools/social-ai-tools/"],
        ["Developer Tools", "/tools/developer-tools/"],
        ["Marketing Tools", "/tools/marketing-tracking-tools/"],
        ["Web & Security Tools", "/tools/web-security-tools/"]
      ]
    },
    premium: {
      href: "/premium/",
      label: "Premium",
      indexLabel: "All premium",
      indexNote: "Free complete workflow tools",
      mobileNote: "Open the full premium workflow hub first.",
      items: [
        ["Dev Premium Tools", "/premium/dev-premium-tools/"],
        ["Multi Device Tester", "/premium/multi-device-tester/"],
        ["Site Map Pro", "/premium/sitemap-viewer/"]
      ]
    },
    guides: {
      href: "/guides/",
      label: "Guides",
      indexLabel: "All guides",
      indexNote: "Complete guides library",
      mobileNote: "Open the full guides index first.",
      items: [
        ["SEO Guides", "/guides/seo/"],
        ["Writing Guides", "/guides/writing/"],
        ["Developer Guides", "/guides/dev/"],
        ["Creator Guides", "/guides/creator/"]
      ]
    }
  };

  function navSubLinksMarkup(groupKey, mode = "desktop"){
    const group = NAV_CATEGORY_GROUPS[groupKey];
    if(!group) return "";
    const normalizePath = (value) => {
      const clean = String(value || "/").toLowerCase().replace(/\/+$/, "");
      return clean ? `${clean}/` : "/";
    };
    const path = normalizePath(window.location.pathname || "/");
    const subLinks = group.items.map(([label, href]) => {
      const isCurrent = path === normalizePath(href);
      return `<a class="${mode === "mobile" ? "m-subnav-link" : "nav-sub-link"}${isCurrent ? " is-current" : ""}" href="${href}">${label}</a>`;
    }).join("");

    if(mode === "mobile"){
      return `
        <a class="m-subnav-index" href="${group.href}">
          <strong>${group.indexLabel}</strong>
          <span>${group.mobileNote}</span>
        </a>
        <div class="m-subnav-grid">${subLinks}</div>`;
    }

    return `
      <div class="nav-subpanel" aria-label="${group.label} categories">
        <a class="nav-index-link" href="${group.href}">
          <strong>${group.indexLabel}</strong>
          <span>${group.indexNote}</span>
        </a>
        <div class="nav-subgrid">${subLinks}</div>
      </div>`;
  }

  function navCategoryMarkup(key, active){
    const group = NAV_CATEGORY_GROUPS[key];
    const isActive = active === key;
    const activeClass = isActive ? " active" : "";
    const current = isActive ? ' aria-current="page"' : "";
    return `
      <div class="nav-group nav-group-${key}${isActive ? " is-active" : ""}">
        <a class="nav-main-link${activeClass}" href="${group.href}"${current}>
          <span>${group.label}</span>
          <span class="nav-caret" aria-hidden="true"></span>
        </a>
        ${navSubLinksMarkup(key)}
      </div>`;
  }

  function mobileMenuMarkup(){
    return `
      <div class="m-overlay" id="mOverlay" hidden></div>
      <aside class="m-menu m-menu-premium" id="mobileMenu" aria-hidden="true">
        ${mobileMenuInnerMarkup()}
      </aside>`;
  }

  function mobileMenuInnerMarkup(){
    return `
      <div class="m-category-block" aria-label="Categories">
        <div class="m-label">Categories</div>
        <div class="m-links" aria-label="Main sections">
          <a class="m-link" href="/"><span aria-hidden="true">⌂</span><strong>Home</strong></a>
          <a class="m-link" href="/tools/"><span aria-hidden="true">⚙</span><strong>Tools</strong></a>
          <a class="m-link" href="/premium/"><span aria-hidden="true">✦</span><strong>Premium</strong></a>
          <a class="m-link" href="/guides/"><span aria-hidden="true">◇</span><strong>Guides</strong></a>
          <a class="m-link" href="/updates/"><span aria-hidden="true">↻</span><strong>Updates</strong></a>
        </div>
      </div>

      <div class="m-subnav" aria-label="Tools and guides categories">
        <section class="m-subnav-section" aria-label="Tools categories">
          <div class="m-label">Tools categories</div>
          ${navSubLinksMarkup("tools", "mobile")}
        </section>
        <section class="m-subnav-section" aria-label="Premium workflows">
          <div class="m-label">Premium workflows</div>
          ${navSubLinksMarkup("premium", "mobile")}
        </section>
        <section class="m-subnav-section" aria-label="Guides categories">
          <div class="m-label">Guides categories</div>
          ${navSubLinksMarkup("guides", "mobile")}
        </section>
      </div>

      <button class="m-command-card m-advanced-search" type="button" data-open-command data-command-query="" aria-label="Open advanced search">
        <span class="m-command-icon" aria-hidden="true">K</span>
        <div>
          <strong>Advanced Search</strong>
          <p>Press Ctrl+K or tap five times quickly anywhere.</p>
        </div>
      </button>

      <div class="m-block m-theme-block">
        <div class="m-label">Theme color</div>
        <div class="color-grid m-colors" id="mobileColorGrid">${colorGridMarkup()}</div>
      </div>

      <div class="m-block m-lang-block">
        <div class="m-label">Language</div>
        <div id="google_translate_element_mobile"></div>
      </div>`;
  }

  function normalizeLogo(){
    const logo = $('.logo');
    if(!logo) return;
    if(logo.querySelector('.logo-mark')) return;
    logo.setAttribute('aria-label', 'Clickoz Home');
    logo.innerHTML = `
      <span class="logo-badge" id="logoBadge" aria-hidden="true">
        <img class="logo-mark logo-img" src="/assets/clickoz-logo-512.png" alt="" width="48" height="48" decoding="async" />
      </span>
      <span class="logo-text">Click<span class="logo-oz">oz</span></span>`;
  }

  function normalizeNavLinks(){
    const navInner = $('.nav-inner');
    if(!navInner) return;
    let links = $('.nav-links', navInner);
    const path = window.location.pathname || "/";
    const active = path.startsWith('/tools/') ? 'tools'
      : path.startsWith('/premium/') ? 'premium'
      : path.startsWith('/guides/') ? 'guides'
      : path.startsWith('/updates/') ? 'updates'
      : 'home';
    const html = [
      `<a href="/"${active === "home" ? ' class="active" aria-current="page"' : ""}>Home</a>`,
      navCategoryMarkup("tools", active),
      navCategoryMarkup("premium", active),
      navCategoryMarkup("guides", active),
      `<a href="/updates/"${active === "updates" ? ' class="active" aria-current="page"' : ""}>Updates</a>`
    ].join('');

    if(!links){
      links = document.createElement('div');
      links.className = 'nav-links';
      links.setAttribute('aria-label', 'Sections');
      const spacer = $('.spacer', navInner);
      if(spacer) navInner.insertBefore(links, spacer);
      else navInner.appendChild(links);
    }
    links.innerHTML = html;
  }

  function ensureGlobalNavigation(){
    const navInner = $('.nav-inner');
    if(!navInner) return;
    normalizeLogo();
    normalizeNavLinks();

    let actions = $('.nav-actions', navInner);
    if(!actions){
      actions = document.createElement('div');
      actions.className = 'nav-actions';
      actions.setAttribute('aria-label', 'Preferences');
      navInner.appendChild(actions);
    }

    if(!$('#colorToggle')){
      actions.insertAdjacentHTML('afterbegin', themePickerMarkup());
    }else{
      const menu = $('#colorMenu');
      const grid = menu?.querySelector('.color-grid');
      if(grid && grid.querySelectorAll('.color-option').length < THEME_SWATCHES.length){
        grid.innerHTML = colorGridMarkup();
      }
    }

    if(!$('#gtNavWrap')){
      actions.insertAdjacentHTML('beforeend', translateMarkup());
    }else if(!$('#google_translate_element')){
      $('#gtNavWrap').innerHTML = '<div id="google_translate_element"><div id="google_translate_native"></div></div>';
    }else if(!$('#google_translate_native') && !$('#google_translate_element .goog-te-combo')){
      $('#google_translate_element').insertAdjacentHTML('afterbegin', '<div id="google_translate_native"></div>');
    }

    actions.querySelectorAll('.nav-primary-cta').forEach((item) => item.remove());

    if(!$('#burger')){
      actions.insertAdjacentHTML('afterbegin', burgerMarkup());
    }

    if(!$('#mOverlay')){
      document.body.insertAdjacentHTML('beforeend', '<div class="m-overlay" id="mOverlay" hidden></div>');
    }

    if(!$('#mobileMenu')){
      document.body.insertAdjacentHTML('beforeend', `<aside class="m-menu m-menu-premium" id="mobileMenu" aria-hidden="true">${mobileMenuInnerMarkup()}</aside>`);
    }else{
      const mobileGrid = $('#mobileColorGrid');
      if(!mobileGrid){
        const themeBlock = document.createElement('div');
        themeBlock.className = 'm-block';
        themeBlock.innerHTML = `<div class="m-label">Theme color</div><div class="color-grid m-colors" id="mobileColorGrid">${colorGridMarkup()}</div>`;
        $('#mobileMenu')?.appendChild(themeBlock);
      }else if(mobileGrid.querySelectorAll('.color-option').length < THEME_SWATCHES.length){
        mobileGrid.innerHTML = colorGridMarkup();
      }
      if(!$('#google_translate_element_mobile')){
        const langBlock = document.createElement('div');
        langBlock.className = 'm-block';
        langBlock.innerHTML = '<div class="m-label">Language</div><div id="google_translate_element_mobile"></div>';
        $('#mobileMenu')?.appendChild(langBlock);
      }
    }
  }

  ensureGlobalNavigation();

  function enhanceMobileMenu(){
    const menu = $('#mobileMenu');
    if(!menu || menu.dataset.premiumMenu === '1') return;
    menu.classList.add('m-menu-premium');
    menu.innerHTML = mobileMenuInnerMarkup();
    menu.dataset.premiumMenu = '1';
  }

  enhanceMobileMenu();

  function hardenCmsGrowthSurface(root = document){
    const gridSelectors = [
      ".cards-grid",
      ".guide-hub-grid",
      ".release-lab-grid",
      ".picks-grid",
      ".authority-grid",
      ".tools-route-grid",
      ".route-final-strip",
      ".cluster-focus-grid",
      ".cms-info-grid"
    ];
    const cardSelector = [
      ".card.tool-card-enhanced",
      ".guide-hub-card",
      ".release-card",
      ".pick-card",
      ".authority-card",
      ".tools-route-grid > a",
      ".route-final-strip > article",
      ".cluster-focus-grid > a",
      ".cms-info-card"
    ].join(",");

    gridSelectors.forEach((selector) => {
      $$(selector, root).forEach((grid) => {
        const items = Array.from(grid.children).filter((item) => item.nodeType === 1 && !item.hidden);
        grid.classList.add("cms-growth-grid");
        grid.dataset.cmsItems = String(items.length);
        items.forEach((item, index) => {
          item.classList.add("cms-growth-card");
          item.style.setProperty("--cms-item-index", String(index));
        });
      });
    });

    $$(".tool-section", root).forEach((section) => {
      const cards = $$(".cards-grid > .card.tool-card-enhanced", section).filter((card) => !card.hidden);
      if (cards.length && !section.dataset.toolCount) section.dataset.toolCount = String(cards.length);
      if (cards.length) section.dataset.renderedToolCount = String(cards.length);
      section.classList.add("cms-growth-section");
    });

    $$(cardSelector, root).forEach((card) => {
      card.classList.add("cms-growth-card");
    });
  }

  hardenCmsGrowthSurface();
  try {
    let cmsGrowthQueued = false;
    const scheduleCmsGrowthSurface = () => {
      if (cmsGrowthQueued) return;
      cmsGrowthQueued = true;
      requestAnimationFrame(() => {
        cmsGrowthQueued = false;
        hardenCmsGrowthSurface();
      });
    };
    new MutationObserver(scheduleCmsGrowthSurface).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch(_) {}

  function hardenRuntimeSurface(){
    $$('a').forEach((link) => {
      const href = (link.getAttribute('href') || '').trim();
      if (/^javascript:/i.test(href)) {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        return;
      }

      const target = (link.getAttribute('target') || '').toLowerCase();
      if (target === '_blank') {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        const nextRel = Array.from(rel).join(' ');
        if (link.getAttribute('rel') !== nextRel) {
          link.setAttribute('rel', nextRel);
        }
      }
    });

    $$('form').forEach((form) => {
      const action = (form.getAttribute('action') || '').trim();
      if (/^javascript:/i.test(action)) form.removeAttribute('action');
    });
  }

  hardenRuntimeSurface();
  try {
    const staticGuidePage = (location.pathname || "").includes("/guides/");
    if (!staticGuidePage) {
      let hardenQueued = false;
      const scheduleHardenRuntimeSurface = () => {
        if (hardenQueued) return;
        hardenQueued = true;
        requestAnimationFrame(() => {
          hardenQueued = false;
          hardenRuntimeSurface();
        });
      };
      new MutationObserver(scheduleHardenRuntimeSurface).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href', 'target', 'rel', 'action']
      });
    }
  } catch(_) {}

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeAllMenus();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });

  /* ---------------------------
     Accent (theme color)
  --------------------------- */
  function hexToRgbTriplet(hex){
    const h = (hex || '').replace('#','').trim();
    if (h.length === 3){
      const r = parseInt(h[0]+h[0], 16);
      const g = parseInt(h[1]+h[1], 16);
      const b = parseInt(h[2]+h[2], 16);
      return `${r},${g},${b}`;
    }
    if (h.length === 6){
      const r = parseInt(h.slice(0,2), 16);
      const g = parseInt(h.slice(2,4), 16);
      const b = parseInt(h.slice(4,6), 16);
      return `${r},${g},${b}`;
    }
    return DEFAULT_ACCENT_RGB;
  }

  function safeHexColor(value, fallback){
    const color = String(value || "").trim();
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color) ? color : fallback;
  }

  function clickozFaviconSvg(accent, accent2){
    const a1 = safeHexColor(accent, DEFAULT_ACCENT);
    const a2 = safeHexColor(accent2, DEFAULT_ACCENT2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Clickoz">
  <defs>
    <linearGradient id="badge" x1="72" y1="56" x2="438" y2="454" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${a2}"/>
      <stop offset=".55" stop-color="${a1}"/>
      <stop offset="1" stop-color="${a1}"/>
    </linearGradient>
    <radialGradient id="shine" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(172 118) rotate(47) scale(190 118)">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".42"/>
      <stop offset=".36" stop-color="#ffffff" stop-opacity=".16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-24%" y="-24%" width="148%" height="148%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="${a1}" flood-opacity=".46"/>
      <feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#000000" flood-opacity=".28"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="118" fill="url(#badge)" filter="url(#glow)"/>
  <rect width="512" height="512" rx="118" fill="url(#shine)"/>
  <path fill="#f8fbff" stroke="#071018" stroke-width="24" stroke-linejoin="round" paint-order="stroke fill" d="M367 176c-25-29-61-43-109-43-83 0-145 50-145 123s62 123 145 123c49 0 86-15 112-47l-79-47c-8 12-20 18-36 18-25 0-42-19-42-47s17-47 42-47c16 0 28 6 36 19l76-52Z"/>
</svg>`;
  }

  function syncDynamicFavicon(accent, accent2){
    const href = `data:image/svg+xml,${encodeURIComponent(clickozFaviconSvg(accent, accent2))}`;
    let link = document.getElementById("clickozDynamicFavicon");
    if (!link) {
      link = document.createElement("link");
      link.id = "clickozDynamicFavicon";
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.sizes = "any";
      document.head.appendChild(link);
    }
    link.href = href;

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", accent);
  }

  document.addEventListener("clickoz:accent-change", (event) => {
    const detail = event.detail || {};
    if (detail.accent) syncDynamicFavicon(detail.accent, detail.accent2);
  });

  function setAccent(a1, a2){
    const [accent, accent2] = normalizeAccentPair(a1, a2);
    const rgb = hexToRgbTriplet(accent);

    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent2', accent2);
    document.documentElement.style.setProperty('--accent-rgb', rgb);
    document.documentElement.style.setProperty('--cz-accent', accent);
    document.documentElement.style.setProperty('--cz-accent2', accent2);
    document.documentElement.style.setProperty('--cz-accent-rgb', rgb);

    $$('#colorDot,.cz-theme-dot').forEach(dot => {
      dot.style.background = accent;
    });

    $$('#logoBadge,.logo-badge').forEach(badge => {
      badge.style.color = accent;
    });

    syncDynamicFavicon(accent, accent2);

    try{
      localStorage.setItem('clickoz_accent', JSON.stringify({a1: accent, a2: accent2}));
    }catch(_){}

    document.dispatchEvent(new CustomEvent('clickoz:accent-change', {
      detail: { accent, accent2, rgb }
    }));
  }

  function markActiveSwatches(accent){
    $$('.color-option').forEach(x => x.classList.toggle('active', x.dataset.accent === accent));
  }

  /* =========================================================
     1) MOBILE MENU (DRAWER)
  ========================================================= */
  (function initMobileMenu(){
    // tolerate accidental burger_1
    const burger  = $('#burger') || $('#burger_1');
    const menu    = $('#mobileMenu');
    const overlay = $('#mOverlay');
    const closeBtn= $('#mClose');
    if(!burger || !menu || !overlay) return;

    const root = document.documentElement;
    let closeTimer = 0;

    function openMenu(){
      window.clearTimeout(closeTimer);
      closeAllMenus();
      menu.scrollTop = 0;
      menu.classList.remove('closing');
      overlay.hidden = false;
      overlay.classList.add('open');
      menu.classList.add('open');
      menu.setAttribute('aria-hidden','false');
      burger.setAttribute('aria-expanded','true');
      root.classList.add('no-scroll');
      burger.focus?.({ preventScroll: true });
    }

    function closeMenu(skipDelay = false){
      window.clearTimeout(closeTimer);
      menu.classList.remove('open');
      menu.classList.add('closing');
      overlay.classList.remove('open');
      menu.setAttribute('aria-hidden','true');
      burger.setAttribute('aria-expanded','false');
      root.classList.remove('no-scroll');
      const finish = () => {
        if (menu.classList.contains('open')) return;
        overlay.hidden = true;
        overlay.classList.remove('open');
        menu.classList.remove('closing');
      };
      if (skipDelay) finish();
      else closeTimer = window.setTimeout(finish, 230);
    }

    burger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });

    closeBtn?.addEventListener('click', () => closeMenu());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMenu();
    });

    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });

    menu.addEventListener('click', (e) => {
      const command = e.target.closest('[data-open-command]');
      if(command) closeMenu(true);
      const a = e.target.closest('a');
      if(a) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (!menu.classList.contains('open')) return;
      const desktopNav = window.matchMedia("(min-width: 1101px) and (hover: hover) and (pointer: fine)").matches;
      if (desktopNav) closeMenu(true);
    }, { passive: true });

    if(!$('#__noScrollStyle')){
      const style = document.createElement('style');
      style.id = "__noScrollStyle";
      style.textContent = `html.no-scroll{ overflow:hidden !important; }`;
      document.head.appendChild(style);
    }
  })();

  /* =========================================================
     2) CONTACT AND REQUEST FORMS
  ========================================================= */
  (function initContactForms(){
    const forms = $$('[data-clickoz-contact-form]');
    if(!forms.length) return;

    function field(form, name){
      return form.querySelector(`[name="${name}"]`);
    }

    function value(form, name){
      return String(field(form, name)?.value || "").trim();
    }

    function setStatus(form, type, message){
      const target = form.querySelector('[data-form-status]');
      if(!target) return;
      target.textContent = message;
      target.dataset.state = type;
      target.hidden = false;
    }

    function mark(input, invalid){
      if(!input) return;
      input.setAttribute('aria-invalid', String(Boolean(invalid)));
    }

    function validEmail(email){
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    function validate(form){
      const name = field(form, 'name');
      const email = field(form, 'email');
      const topic = field(form, 'topic');
      const message = field(form, 'message');
      const errors = [];
      const checks = [
        [name, value(form, 'name').length >= 2, 'Add your name.'],
        [email, validEmail(value(form, 'email')), 'Add a valid email.'],
        [topic, value(form, 'topic').length > 0, 'Choose the request type.'],
        [message, value(form, 'message').length >= 20, 'Write at least 20 characters so the request is actionable.']
      ];
      checks.forEach(([input, ok, copy]) => {
        mark(input, !ok);
        if(!ok) errors.push(copy);
      });
      return errors;
    }

    function mailtoUrl(form){
      const topic = value(form, 'topic') || 'Clickoz request';
      const subject = encodeURIComponent(`[Clickoz] ${topic}`);
      const recipient = (String(form.dataset.contactEmail || 'support@clickoz.com').trim() || 'support@clickoz.com').replace(/[^\w.+@-]/g, '');
      const lines = [
        `Name: ${value(form, 'name')}`,
        `Email: ${value(form, 'email')}`,
        `Topic: ${topic}`,
        `Page: ${value(form, 'page') || window.location.href}`,
        '',
        value(form, 'message')
      ];
      return `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
    }

    async function submitToEndpoint(form, endpoint){
      const payload = {
        name: value(form, 'name'),
        email: value(form, 'email'),
        topic: value(form, 'topic'),
        page: value(form, 'page') || window.location.href,
        message: value(form, 'message')
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });
      if(!response.ok) throw new Error(`Request failed with status ${response.status}`);
    }

    forms.forEach((form) => {
      if(form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';
      const pageInput = field(form, 'page');
      if(pageInput && !pageInput.value) pageInput.value = window.location.href;

      form.addEventListener('input', (event) => {
        const target = event.target;
        if(target && target.matches('input, textarea, select')) mark(target, false);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if(value(form, 'website') || value(form, 'clickoz_company_url')){
          setStatus(form, 'error', 'Request blocked by the anti-spam guard.');
          return;
        }
        const errors = validate(form);
        if(errors.length){
          setStatus(form, 'error', errors[0]);
          return;
        }

        const button = form.querySelector('[type="submit"]');
        button?.setAttribute('disabled', 'true');
        setStatus(form, 'pending', 'Preparing your request...');
        const endpoint = String(form.dataset.endpoint || '').trim();

        try{
          if(endpoint){
            await submitToEndpoint(form, endpoint);
            setStatus(form, 'success', 'Request sent. We will review it from support@clickoz.com.');
            form.reset();
          }else{
            window.location.href = mailtoUrl(form);
            setStatus(form, 'success', 'Email draft opened with the request details. Send it from your mail app to complete the request.');
          }
        }catch(_){
          window.location.href = mailtoUrl(form);
          setStatus(form, 'error', 'The endpoint did not accept the request. A mail draft was opened as fallback.');
        }finally{
          button?.removeAttribute('disabled');
        }
      });
    });
  })();

  /* =========================================================
     3) ACCENT MENU (DESKTOP + MOBILE GRID)
  ========================================================= */
  (function initAccent(){
    const FIRST_ACCENT = DEFAULT_ACCENT;
    const FIRST_ACCENT2 = DEFAULT_ACCENT2;

    // restore saved accent first
    try{
      const saved = JSON.parse(localStorage.getItem('clickoz_accent') || 'null');
      if(saved?.a1){
        const [accent, accent2] = normalizeAccentPair(saved.a1, saved.a2);
        setAccent(accent, accent2);
        markActiveSwatches(accent);
      }else{
        // first visit default
        setAccent(FIRST_ACCENT, FIRST_ACCENT2);
        markActiveSwatches(FIRST_ACCENT);
      }
    }catch(_){
      setAccent(FIRST_ACCENT, FIRST_ACCENT2);
      markActiveSwatches(FIRST_ACCENT);
    }

    const toggle = $('#colorToggle');
    const menu   = $('#colorMenu');

    if(toggle && menu){
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.contains('active');
        closeAllMenus();
        menu.classList.toggle('active', !open);
        toggle.setAttribute('aria-expanded', String(!open));
        document.documentElement.classList.toggle('theme-menu-open', !open);
      });

      menu.addEventListener('click', (e) => {
        e.stopPropagation();
        const opt = e.target.closest('.color-option');
        if(!opt) return;

        setAccent(opt.dataset.accent, opt.dataset.accent2);
        markActiveSwatches(opt.dataset.accent);
        closeAllMenus();
        burstParticles(); // quick burst on theme change
      });
    }

    const mobileGrid = $('#mobileColorGrid');
    if(mobileGrid){
      mobileGrid.addEventListener('click', (e) => {
        const opt = e.target.closest('.color-option');
        if(!opt) return;
        setAccent(opt.dataset.accent, opt.dataset.accent2);
        markActiveSwatches(opt.dataset.accent);
        burstParticles();
      });
    }
  })();

  /* =========================================================
     3) "/" FOCUSES SEARCH (only if #toolSearch exists)
  ========================================================= */
  (function slashFocus(){
    const search = $('#toolSearch');
    if(!search) return;

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement !== search){
        e.preventDefault();
        search.focus();
      }
    });
  })();

  /* =========================================================
     4) SEARCH + CHIPS FILTER (Tools page)
  ========================================================= */
  (function searchAndChips(){
    const grid  = $('#grid');
    const chips = $('#chips');
    const q     = $('#toolSearch');
    if(!grid || !chips || !q) return;

    const cards = Array.from(grid.querySelectorAll('a.card'));
    let filter = 'all';

    const SEO = new Set([
      "word-counter-pro","readability-analyzer","keyword-density","meta-tags",
      "title-description","alt-text","seo-outline"
    ]);
    const TEXT = new Set(["word-counter","readability-analyzer"]);

    function catFromSlug(slug){
      if (SEO.has(slug)) return "seo";
      if (TEXT.has(slug)) return "text";
      return "dev";
    }

    function apply(){
      const term = (q.value || '').trim().toLowerCase();
      cards.forEach(card => {
        const hay = ((card.dataset.hay || "") + " " + (card.textContent || "")).toLowerCase();
        const okTerm = !term || hay.includes(term);

        const cat = (card.dataset.cat || "").toLowerCase();
        const slug = card.getAttribute('data-slug') || "";
        const resolved = cat || catFromSlug(slug);

        const okCat = (filter === "all") || (resolved === filter);
        card.style.display = (okTerm && okCat) ? "" : "none";
      });
    }

    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if(!chip) return;
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      filter = chip.dataset.filter || "all";
      apply();
    });

    q.addEventListener('input', apply);
    apply();
  })();

  /* =========================================================
     5) RECOMMENDED NOW — RANDOM PICKS (Home slots)
  ========================================================= */
  (function recommendedRandom(){
    const slots = [
      {a:'randTool1', i:'randIcon1', t:'randTitle1', d:'randDesc1', c:'randCta1'},
      {a:'randTool2', i:'randIcon2', t:'randTitle2', d:'randDesc2', c:'randCta2'},
      {a:'randTool3', i:'randIcon3', t:'randTitle3', d:'randDesc3', c:'randCta3'},
      {a:'randTool4', i:'randIcon4', t:'randTitle4', d:'randDesc4', c:'randCta4'},
      {a:'randTool5', i:'randIcon5', t:'randTitle5', d:'randDesc5', c:'randCta5'},
      {a:'randTool6', i:'randIcon6', t:'randTitle6', d:'randDesc6', c:'randCta6'},
    ];

    const anySlot = document.getElementById(slots[0].a);
    if(!anySlot) return;

    const FALLBACK = [
      { href:'/tools/word-counter/',          icon:'123', title:'Word Counter',          desc:'Count words, characters, sentences, paragraphs and reading time.' },
      { href:'/tools/character-counter/',     icon:'Aa',  title:'Character Counter',     desc:'Measure character limits for forms, snippets and social copy.' },
      { href:'/tools/readability-analyzer/',  icon:'TXT', title:'Readability Analyzer',  desc:'Readability score and clarity hints to improve scannability.' },
      { href:'/tools/keyword-density/',       icon:'SEO', title:'Keyword Density',       desc:'Measure keyword frequency and spot overuse without stuffing.' },
      { href:'/tools/meta-tags/',             icon:'TAG', title:'Meta Tag Optimizer',    desc:'SERP preview and length checks to improve click appeal.' },
      { href:'/tools/json-formatter/',        icon:'{}',  title:'JSON Formatter',        desc:'Prettify, minify and validate JSON instantly for debugging.' },
      { href:'/tools/url-encoder/',           icon:'URL', title:'URL Encoder',           desc:'Encode and decode URLs and query strings safely.' },
      { href:'/tools/base64/',                icon:'64',  title:'Base64',                desc:'Encode and decode Base64 strings for tokens and payloads.' },
      { href:'/tools/youtube-title-generator/', icon:'YT', title:'YouTube Title Generator', desc:'Create video title angles for search, curiosity and clarity.' },
      { href:'/tools/thumbnail-brief-generator/', icon:'IMG', title:'Thumbnail Brief Generator', desc:'Turn a video idea into a clear thumbnail concept.' },
      { href:'/tools/utm-builder/',           icon:'UTM', title:'UTM Builder',           desc:'Build campaign links with clean tracking conventions.' },
    ];

    const grid = document.getElementById('grid');
    const cards = grid ? Array.from(grid.querySelectorAll('a.card')) : [];

    function extractFromCard(card){
      const title = (card.querySelector('h3')?.textContent || 'Tool').trim();
      const icon  = (card.querySelector('.thumb')?.textContent || 'GO').trim();
      const href  = (card.getAttribute('href') || '#').trim();
      const desc  = (card.querySelector('p')?.textContent || '').trim();
      return { href, icon, title, desc };
    }

    let catalog = [];
    if(cards.length >= 6){
      catalog = cards.map(extractFromCard)
        .map(x => ({...x, href: x.href.replace(/^\/tool\//, '/tools/')}));
    }else{
      catalog = FALLBACK.slice();
    }
    if(catalog.length < 6) return;

    function pickDistinct(n){
      const idx = new Set();
      while(idx.size < n) idx.add(Math.floor(Math.random() * catalog.length));
      return Array.from(idx).map(i => catalog[i]);
    }

    const picks = pickDistinct(6);

    slots.forEach((slot, k) => {
      const p = picks[k];
      const a = document.getElementById(slot.a);
      if(!a || !p) return;

      a.href = p.href;

      const i = document.getElementById(slot.i);
      const t = document.getElementById(slot.t);
      const d = document.getElementById(slot.d);
      const c = document.getElementById(slot.c);

      if(i) i.textContent = p.icon;
      if(t) t.textContent = p.title;
      if(d) d.textContent = p.desc || '';
      if(c) c.textContent = `Use ${p.title}`;
    });
  })();

  /* =========================================================
     6) COOKIE CONSENT + LANGUAGE PREFERENCE
  ========================================================= */
  (function consentAndGT(){
    const KEY = "clickoz_consent";
    const LANG_KEY = "clickoz_language";
    const LANG_EXPLICIT_KEY = "clickoz_language_explicit";
    const gtWrap  = $('#gtNavWrap');
    const LANGUAGES = [
      ["en", "English"],
      ["it", "Italiano"],
      ["es", "Español"],
      ["fr", "Français"],
      ["de", "Deutsch"],
      ["pt", "Português"],
      ["nl", "Nederlands"],
      ["pl", "Polski"],
      ["ro", "Română"],
      ["tr", "Türkçe"],
      ["el", "Ελληνικά"],
      ["ru", "Русский"],
      ["uk", "Українська"],
      ["ar", "العربية"],
      ["hi", "हिन्दी"],
      ["zh-CN", "中文"],
      ["ja", "日本語"],
      ["ko", "한국어"],
      ["id", "Bahasa Indonesia"],
      ["vi", "Tiếng Việt"]
    ];
    const SUPPORTED = new Set(LANGUAGES.map(([code]) => code));
    let targetLang = "en";

    function consentMarkup(){
      return `
        <div class="cookie cookie-pro" role="dialog" aria-modal="false" aria-hidden="true" aria-labelledby="clickozConsentTitle" aria-describedby="clickozConsentText">
          <div class="cookie-card cookie-dev-card">
            <div class="cookie-status-row">
              <button class="cookie-x" id="cookieClose" type="button" aria-label="Close consent panel">x</button>
              <div class="cookie-status" aria-hidden="true">
                <span class="cookie-led"></span>
                <span>DEV CONSENT</span>
              </div>
            </div>
            <div class="cookie-content">
              <div class="cookie-title" id="clickozConsentTitle">Tiny browser handshake?</div>
              <p class="cookie-text" id="clickozConsentText">
                Clickoz can remember useful browser preferences on this device. Essential keeps theme, language and this privacy choice; smart cache prepares internal pages faster and enables optional translation only when requested. No account, no uploads, no dark pattern.
                <a href="/privacy/#cookies">Read cache and cookie notes</a>.
              </p>
              <div class="cookie-mini-grid" aria-label="Consent details">
                <span data-choice="all"><b>Allow smart cache</b> faster pages + optional translation</span>
                <span data-choice="essential"><b>Essential only</b> theme, language, consent</span>
                <span data-choice="none"><b>No extras</b> only remember this choice</span>
              </div>
            </div>
            <div class="cookie-actions">
              <button class="btn primary cookie-btn" id="cookieAccept" type="button">Allow smart cache</button>
              <button class="btn btn-outline cookie-btn" id="cookieEssential" type="button">Essential only</button>
              <button class="btn btn-outline cookie-btn" id="cookieReject" type="button">No extras</button>
            </div>
          </div>
        </div>`;
    }

    function ensureConsentBanner(){
      let node = $('.cookie');
      if(node) return node;
      if(!document.body) return null;
      document.body.insertAdjacentHTML("beforeend", consentMarkup());
      return $('.cookie');
    }

    const banner = ensureConsentBanner();

    function setCookie(name, value, days){
      const maxAge = days ? `; Max-Age=${days*24*60*60}` : "";
      document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; Path=/; SameSite=Lax`;
      const host = window.location.hostname || "";
      const isLocal = host === "localhost" || host === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(host);
      if(!isLocal && host.includes(".")){
        const rootDomain = host.split(".").slice(-2).join(".");
        document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; Path=/; Domain=.${rootDomain}; SameSite=Lax`;
      }
    }

    function getCookie(name){
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
      return m ? decodeURIComponent(m[1]) : null;
    }

    function store(val){
      try { localStorage.setItem(KEY, val); } catch(e){}
      setCookie(KEY, val, 365);
      document.documentElement.dataset.clickozConsent = val;
      document.dispatchEvent(new CustomEvent("clickoz:consent-changed", { detail: { value: val } }));
    }

    function readStored(){
      try { return localStorage.getItem(KEY); } catch(e){ return null; }
    }

    function hideBanner(){
      banner?.classList.remove('show');
      banner?.setAttribute("aria-hidden", "true");
    }

    function normalizeLang(code){
      const raw = String(code || "").trim();
      if(!raw) return "en";
      if(raw.toLowerCase().startsWith("zh")) return "zh-CN";
      const exact = LANGUAGES.find(([lang]) => lang.toLowerCase() === raw.toLowerCase());
      if(exact) return exact[0];
      const base = raw.split("-")[0].toLowerCase();
      return SUPPORTED.has(base) ? base : "en";
    }

    function rememberLanguage(lang){
      try { localStorage.setItem(LANG_KEY, lang); } catch(_){}
      setCookie("clickoz_lang", lang, 365);
    }

    function rememberExplicitLanguage(lang){
      rememberLanguage(lang);
      try { localStorage.setItem(LANG_EXPLICIT_KEY, "1"); } catch(_){}
      setCookie("clickoz_lang_explicit", "1", 365);
    }

    function languageSelectHtml(lang, state){
      const status = state ? ` data-state="${state}"` : "";
      const cls = state ? ` gt-select is-${state}` : " gt-select";
      const options = LANGUAGES.map(([code, label]) => {
        const selected = code === lang ? " selected" : "";
        return `<option value="${code}"${selected}>${label}</option>`;
      }).join("");
      return `<select class="${cls.trim()}" data-gt-control aria-label="Select language"${status}>${options}</select>`;
    }

    function renderLanguageControls(lang = targetLang, state = ""){
      targetLang = normalizeLang(lang);
      document.documentElement.lang = targetLang;
      const html = languageSelectHtml(targetLang, state);
      const desktop = $('#google_translate_element');
      const mobile = $('#google_translate_element_mobile');

      if(desktop){
        $$('#google_translate_element > .gt-select, #google_translate_element > .gt-fallback').forEach((el) => el.remove());
        desktop.insertAdjacentHTML("beforeend", html);
        desktop.classList.add("gt-ready");
      }

      if(mobile){
        mobile.innerHTML = html;
      }
    }

    const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
    const TRANSLATE_SPLIT = "ZXQCLICKOZSEPARATORQXZ";
    const originalText = new WeakMap();
    const originalNodes = new Set();
    const translationCache = new Map();
    let translateRun = 0;

    function canTranslateNode(node){
      if(!node || node.nodeType !== Node.TEXT_NODE) return false;
      const parent = node.parentElement;
      if(!parent) return false;
      if(parent.closest("script,style,noscript,svg,canvas,textarea,input,select,option,code,pre,kbd,samp,.logo,.logo-text,.logo-oz,.notranslate,[translate='no'],#google_translate_element,#google_translate_element_mobile,.color-grid")) return false;
      const text = node.nodeValue || "";
      const trimmed = text.trim();
      if(trimmed.length < 2 || trimmed.length > 900) return false;
      if(!/[A-Za-z]/.test(trimmed)) return false;
      if(/^[\d\s.,:;!?()[\]{}%+\-/*#@|]+$/.test(trimmed)) return false;
      return true;
    }

    function collectTextNodes(){
      const nodes = [];
      if(!document.body) return nodes;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node){
          return canTranslateNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while(walker.nextNode()) nodes.push(walker.currentNode);
      return nodes;
    }

    function splitWhitespace(text){
      const leading = (text.match(/^\s*/) || [""])[0];
      const trailing = (text.match(/\s*$/) || [""])[0];
      return { leading, core: text.trim(), trailing };
    }

    async function fetchTranslation(text, lang){
      const key = `${lang}::${text}`;
      if(translationCache.has(key)) return translationCache.get(key);
      const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { cache: "force-cache" });
      if(!res.ok) throw new Error(`translate ${res.status}`);
      const data = await res.json();
      const translated = (data?.[0] || []).map((part) => part?.[0] || "").join("").trim();
      const value = translated || text;
      translationCache.set(key, value);
      return value;
    }

    async function translateCores(cores, lang){
      const out = new Array(cores.length);
      const pending = [];
      cores.forEach((text, index) => {
        const key = `${lang}::${text}`;
        if(translationCache.has(key)) out[index] = translationCache.get(key);
        else pending.push({ text, index });
      });
      if(!pending.length) return out;

      const groups = [];
      let current = [];
      let size = 0;
      pending.forEach((item) => {
        const nextSize = size + item.text.length + TRANSLATE_SPLIT.length + 8;
        if(current.length && nextSize > 1700){
          groups.push(current);
          current = [];
          size = 0;
        }
        current.push(item);
        size += item.text.length + TRANSLATE_SPLIT.length + 8;
      });
      if(current.length) groups.push(current);

      let cursor = 0;
      const workers = Math.min(4, groups.length);
      async function runNextGroup(){
        while(cursor < groups.length){
          const group = groups[cursor++];
          const joined = group.map((item) => item.text).join(`\n${TRANSLATE_SPLIT}\n`);
          try{
            const translatedJoined = await fetchTranslation(joined, lang);
            const pieces = translatedJoined.split(TRANSLATE_SPLIT).map((x) => x.trim());
            if(pieces.length === group.length){
              group.forEach((item, i) => {
                const value = pieces[i] || item.text;
                translationCache.set(`${lang}::${item.text}`, value);
                out[item.index] = value;
              });
            }else{
              await Promise.all(group.map(async (item) => {
                const value = await fetchTranslation(item.text, lang);
                out[item.index] = value;
              }));
            }
          }catch(_){
            group.forEach((item) => {
              out[item.index] = item.text;
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      await Promise.all(Array.from({ length: workers }, () => runNextGroup()));

      return out;
    }

    function didTranslate(values, cores){
      return values.some((value, index) => {
        const before = (cores[index] || "").trim();
        const after = (value || "").trim();
        return after && before && after.toLowerCase() !== before.toLowerCase();
      });
    }

    async function translatePage(lang, mode = "manual"){
      const normalized = normalizeLang(lang);
      const run = ++translateRun;
      if(normalized === "en"){
        restoreEnglish();
        renderLanguageControls("en", "");
        return;
      }

      renderLanguageControls(normalized, "loading");
      document.documentElement.classList.add("is-translating");
      const nodes = collectTextNodes();
      const payload = [];

      nodes.forEach((node) => {
        if(!originalText.has(node)){
          originalText.set(node, node.nodeValue || "");
          originalNodes.add(node);
        }
        const raw = originalText.get(node) || "";
        const parts = splitWhitespace(raw);
        if(parts.core) payload.push({ node, ...parts });
      });

      const cores = payload.map((item) => item.core);
      try{
        const translated = await translateCores(cores, normalized);
        if(run !== translateRun) return;
        if(cores.length > 3 && !didTranslate(translated, cores)){
          throw new Error("translation returned unchanged text");
        }
        payload.forEach((item, index) => {
          if(item.node.isConnected){
            item.node.nodeValue = `${item.leading}${translated[index] || item.core}${item.trailing}`;
          }
        });
        renderLanguageControls(normalized, "");
      }catch(_){
        if(run === translateRun) renderLanguageControls(normalized, "error");
      }finally{
        if(run === translateRun) document.documentElement.classList.remove("is-translating");
      }
    }

    function restoreEnglish(){
      originalNodes.forEach((node) => {
        if(node && node.isConnected && originalText.has(node)){
          node.nodeValue = originalText.get(node);
        }
      });
      document.documentElement.classList.remove("is-translating");
    }

    function applyLanguage(lang, mode = "manual"){
      const normalized = normalizeLang(lang);
      targetLang = normalized;
      if(mode === "manual") rememberExplicitLanguage(normalized);
      renderLanguageControls(normalized, "");

      if(normalized === "en"){
        restoreEnglish();
        renderLanguageControls("en", "");
        return;
      }

      if(mode === "manual") store("all");
      hideBanner();
      translatePage(normalized, mode);
    }

    const existing = readStored() || getCookie(KEY);
    const languageWasExplicit = ((() => {
      try { return localStorage.getItem(LANG_EXPLICIT_KEY); } catch(_) { return null; }
    })() || getCookie("clickoz_lang_explicit")) === "1";
    const savedLang = null;
    const translationAllowed = existing !== "none" && existing !== "essential";
    targetLang = "en";
    renderLanguageControls(targetLang, "");

    if (!existing){
      banner?.classList.add('show');
      banner?.setAttribute("aria-hidden", "false");
    } else {
      document.documentElement.dataset.clickozConsent = existing;
      if(existing === "all" && gtWrap) gtWrap.classList.add('show');
    }

    // Pages always open in English. Translation runs only after an explicit
    // user selection, which keeps guide pages stable and preserves the value
    // of the language selector.

    $('#cookieAccept')?.addEventListener('click', () => {
      store("all");
      hideBanner();
    });

    $('#cookieEssential')?.addEventListener('click', () => {
      store("essential"); hideBanner();
    });

    $('#cookieReject')?.addEventListener('click', () => {
      store("none"); hideBanner();
    });

    $('#cookieClose')?.addEventListener('click', hideBanner);

    document.addEventListener('change', (e) => {
      const control = e.target.closest('[data-gt-control]');
      if(!control) return;
      applyLanguage(control.value || "en", "manual");
    });

    // No Google Translate widget here: page translation is handled by the
    // lightweight fetch translator above to avoid iframe/widget freezes.
  })();

  /* =========================================================
     7) DOM PARTICLES (idle + burst) — NO CLICK
  ========================================================= */
  function ensureParticlesLayer(){
    if (leanPerfMode) {
      document.getElementById("clickozParticles")?.remove();
      return null;
    }
    let layer = $('#clickozParticles');
    if(!layer){
      layer = document.createElement('div');
      layer.id = "clickozParticles";
      document.body.appendChild(layer);
    }
    return layer;
  }

  function buildIdleParticles(){
    if (leanPerfMode) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;
    if (layer.querySelector('.pidle')) return;

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile || mobilePerfMode ? 28 : 120;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement('span');
      p.className = "pidle";
      p.style.left = rnd(4, 96) + "%";
      p.style.top  = rnd(6, 94) + "%";
      p.style.setProperty("--ix", rnd(isMobile ? -80 : -190, isMobile ? 80 : 190).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(isMobile ? -70 : -160, isMobile ? 90 : 210).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(isMobile ? 22 : 14, isMobile ? 38 : 30).toFixed(2) + "s");
      layer.appendChild(p);
    }
  }

  function burstParticles(){
    if (leanPerfMode) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;

    layer.querySelectorAll(".pburst").forEach(n => n.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile ? 90 : 180;

    // origin near hero top-center
    const ORIGIN_X = 50;
    const ORIGIN_Y = 22;
    const MAX_DELAY = 0.50;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement("span");
      p.className = "pburst";

      const side = Math.random() < 0.5 ? -1 : 1;
      const dx = side * rnd(isMobile ? 260 : 320, isMobile ? 760 : 1100);
      const dy = rnd(-120, isMobile ? 620 : 820);

      const big = Math.random() < 0.16;
      const sz = big ? rnd(5,7) : rnd(2,4);
      const op = big ? rnd(0.20, 0.34) : rnd(0.14, 0.26);

      const delay = rnd(0, MAX_DELAY);
      const dur = rnd(1.05, 1.60);

      p.style.setProperty("--sx", ORIGIN_X + "%");
      p.style.setProperty("--sy", ORIGIN_Y + "%");
      p.style.setProperty("--dx", dx.toFixed(0) + "px");
      p.style.setProperty("--dy", dy.toFixed(0) + "px");
      p.style.setProperty("--sz", sz.toFixed(1) + "px");
      p.style.setProperty("--op", op.toFixed(2));
      p.style.setProperty("--delay", delay.toFixed(2) + "s");
      p.style.setProperty("--dur", dur.toFixed(2) + "s");

      layer.appendChild(p);
    }
  }

  function buildGuideParticles(){
    if (leanPerfMode) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;
    if (layer.querySelector('.pguide')) return;

    layer.querySelectorAll(".pburst").forEach((node) => node.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile || mobilePerfMode ? 24 : 80;

    for(let i = 0; i < COUNT; i++){
      const p = document.createElement("span");
      p.className = "pidle pguide";
      p.style.left = rnd(3, 97) + "%";
      p.style.top = rnd(5, 96) + "%";
      p.style.setProperty("--ix", rnd(isMobile ? -70 : -150, isMobile ? 70 : 150).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(isMobile ? -58 : -120, isMobile ? 78 : 170).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(isMobile ? 30 : 22, isMobile ? 48 : 42).toFixed(2) + "s");
      p.style.setProperty("--palpha", rnd(.14, .32).toFixed(2));
      layer.appendChild(p);
    }
  }

  /* =========================================================
     8) SPACE CANVAS — PRO (NO CLICK)
     - One burst on load/resize
     - Stable drift + subtle swirl
     - Color follows --accent-rgb (no random violet)
========================================================= */
  (function spaceCanvas(){
    // Disabled intentionally: the old background canvas was expensive on phones
    // and was later removed from the DOM, which could leave a hidden RAF loop alive.
    return;
    if (prefersReduce) return;

    const canvas = document.getElementById('spaceParticles');
    if(!canvas) return;
    const ctx = canvas.getContext('2d', { alpha:true });

    let w=0,h=0,dpr=1;
    let stars = [];
    let running = true;
    let last = performance.now();

    function accentRGB(){
      return (getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || "34,211,238");
    }
    function isMobile(){
      return window.matchMedia("(max-width: 720px)").matches;
    }
    function origin(){
      return { x: w*0.5, y: h*(isMobile() ? 0.30 : 0.26) };
    }

    function spawnDrift(randomField=true){
      const r = (Math.random() < 0.12 ? rnd(1.7, 3.4) : rnd(0.9, 2.0)) * dpr;
      const x = randomField ? rnd(0, w) : origin().x;
      const y = randomField ? rnd(0, h) : origin().y;

      const sp = (isMobile() ? rnd(0.10, 0.26) : rnd(0.12, 0.32)) * dpr;
      const a = Math.random()*Math.PI*2;

      return {
        mode: "drift",
        x, y,
        vx: Math.cos(a)*sp,
        vy: Math.sin(a)*sp,
        r,
        a: rnd(0.06, 0.16),
        life: 0,
        max: rnd(900, 1700),
        swirl: (isMobile() ? 0.00060 : 0.00085) * dpr
      };
    }

    function spawnBurst(){
      const o = origin();
      const ang = Math.random()*Math.PI*2 + rnd(-0.10, 0.10);

      const vBase = isMobile() ? rnd(2.4, 3.9) : rnd(3.1, 5.0);
      const vx0 = Math.cos(ang) * vBase * dpr;
      const vy0 = Math.sin(ang) * vBase * dpr;

      const big = Math.random() < 0.20;
      const r = (big ? rnd(2.2, 4.2) : rnd(1.0, 2.2)) * dpr;

      return {
        mode: "burst",
        x: o.x + rnd(-3,3)*dpr,
        y: o.y + rnd(-3,3)*dpr,
        vx: vx0,
        vy: vy0,
        r,
        a: isMobile() ? rnd(0.18, 0.30) : rnd(0.20, 0.34),
        life: 0,
        burstFrames: isMobile() ? 85 : 120,
        swirl: (isMobile() ? 0.00060 : 0.00085) * dpr
      };
    }

    function bigBurst(){
      const count = isMobile() ? 150 : 260;
      for(let i=0;i<count;i++) stars.push(spawnBurst());

      const cap = isMobile() ? 320 : 520;
      if(stars.length > cap) stars.splice(0, stars.length - cap);
    }

    function resize(){
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.width  = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';

      const base = isMobile() ? 70 : 120;
      stars = [];
      for(let i=0;i<base;i++) stars.push(spawnDrift(true));

      bigBurst();
    }

    function step(now){
      if(!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0,0,w,h);
      const rgb = accentRGB();
      const o = origin();
      const margin = 140*dpr;

      // soft haze (no fixed "ball")
      ctx.fillStyle = `rgba(${rgb},0.055)`;
      ctx.fillRect(0,0,w,h);

      for(let i=0;i<stars.length;i++){
        const s = stars[i];
        s.life++;

        if(s.mode === "burst"){
          s.x += s.vx;
          s.y += s.vy;

          const t = Math.min(1, s.life / s.burstFrames);
          const alpha = s.a * (1 - t*0.35);

          ctx.beginPath();
          ctx.fillStyle = `rgba(${rgb},${Math.max(0, alpha)})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
          ctx.fill();

          if(s.life >= s.burstFrames){
            s.mode = "drift";
            s.vx *= isMobile() ? 0.10 : 0.12;
            s.vy *= isMobile() ? 0.10 : 0.12;
            s.life = 0;
            s.max = rnd(900, 1700);
            s.a = rnd(0.06, 0.16);
          }
          continue;
        }

        // drift swirl
        const dx = s.x - o.x;
        const dy = s.y - o.y;
        s.vx += (-dy) * s.swirl * 0.0009;
        s.vy += ( dx) * s.swirl * 0.0009;

        // micro damping (prevents runaway)
        s.vx *= (1 - dt*0.015);
        s.vy *= (1 - dt*0.015);

        s.x += s.vx;
        s.y += s.vy;

        const fade = 1 - (s.life / s.max);
        const alpha = Math.max(0, s.a * Math.min(1, fade));

        ctx.beginPath();
        ctx.fillStyle = `rgba(${rgb},${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();

        if(s.life > s.max || s.x < -margin || s.x > w+margin || s.y < -margin || s.y > h+margin){
          stars[i] = spawnDrift(true);
        }
      }

      requestAnimationFrame(step);
    }

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if(running){
        last = performance.now();
        requestAnimationFrame(step);
      }
    });

    window.addEventListener('resize', () => {
      resize();
    }, { passive:true });

    resize();
    requestAnimationFrame(step);
  })();

  /* =========================================================
     9) INIT FX (particles on load)
  ========================================================= */
  (function initFX(){
    const guidePath = (location.pathname || "").includes("/guides/");
    if (leanPerfMode || guidePath || document.body.classList.contains("page-guide")) {
      if (!leanPerfMode && (guidePath || document.body.classList.contains("page-guide"))) {
        if (document.readyState === "loading"){
          document.addEventListener("DOMContentLoaded", buildGuideParticles, { once:true });
        } else {
          buildGuideParticles();
        }
      }
      return;
    }
    if (document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", () => {
        buildIdleParticles();
        burstParticles();
      }, { once:true });
    } else {
      buildIdleParticles();
      burstParticles();
    }
  })();

  /* =========================================================
     10) NAV ACTIVE LINK (single)
  ========================================================= */
  (function navActive(){
    const links = [
      ...Array.from(document.querySelectorAll('.nav-links a')),
      ...Array.from(document.querySelectorAll('.m-links a'))
    ];
    if (!links.length) return;

    links.forEach(a => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });

    const path = (location.pathname || '/').toLowerCase();

    let section = 'home';
    if (path === '/' || path === '/index.html') section = 'home';
    else if (path.startsWith('/tools') || path.endsWith('/tools.html')) section = 'tools';
    else if (path.startsWith('/premium') || path.endsWith('/premium.html')) section = 'premium';
    else if (path.startsWith('/guides') || path.endsWith('/guides.html')) section = 'guides';
    else if (path.startsWith('/updates') || path.endsWith('/updates.html')) section = 'updates';

    function matchLink(a){
      const href = (a.getAttribute('href') || '').toLowerCase().replace(/\/+$/, '');
      if (section === 'home')   return href === '' || href === '/' || href === '/index.html';
      if (section === 'tools')  return href === '/tools'  || href === '/tools.html'  || href.startsWith('/tools/');
      if (section === 'premium') return href === '/premium' || href === '/premium.html' || href.startsWith('/premium/');
      if (section === 'guides') return href === '/guides' || href === '/guides.html' || href.startsWith('/guides/');
      if (section === 'updates') return href === '/updates' || href === '/updates.html' || href.startsWith('/updates/');
      return false;
    }

    const el = links.find(matchLink);
    if (el){
      el.classList.add('active');
      el.setAttribute('aria-current', 'page');
    }
  })();

  /* =========================================================
     11) NAV GLOW ON SCROLL (optional, safe)
  ========================================================= */
  (function navGlowOnScroll(){
    const nav = document.getElementById('topNav');
    if(!nav) return;

    let lastY = window.scrollY || 0;

    const onScroll = () => {
      const y = window.scrollY || 0;
      const scrolled = y > 8;
      nav.classList.toggle('is-scrolled', scrolled);

      const goingDown = y > lastY + 2;
      const goingUp   = y < lastY - 2;

      if(scrolled && goingDown) nav.classList.add('is-down');
      if(!scrolled || goingUp)  nav.classList.remove('is-down');

      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  })();

  /* =========================================================
     12) RECOMMENDED — manual refresh (if #recRefresh + #recGrid exist)
  ========================================================= */
  (function recommendedRefresh(){
    const btn  = document.getElementById('recRefresh');
    const grid = document.getElementById('recGrid');
    if(!btn || !grid) return;

    const extra = [
      {
        href: "/tools/seo-outline/",
        icon: "🧠",
        title:"SEO Outline Helper",
        desc:"Build H1/H2/H3 outline + FAQs aligned to search intent.",
        examples:["Create a heading structure for a ‘how to’ guide.","Add FAQ ideas that match related queries.","Map sections to user intent."],
        catHref:"/tools/#seo",
        catLabel:"SEO Tools",
        cta:"Use SEO Outline Helper"
      },
      {
        href: "/tools/title-description/",
        icon: "📝",
        title:"Title & Description",
        desc:"Generate SEO titles + meta descriptions for higher CTR.",
        examples:["Generate 10 title angles.","Write meta for info vs transactional intent.","Improve CTR for key pages."],
        catHref:"/tools/#seo",
        catLabel:"SEO Tools",
        cta:"Use Title & Description"
      },
      {
        href: "/tools/keyword-density/",
        icon: "🎯",
        title:"Keyword Density Checker",
        desc:"Analyze keyword frequency and keep text natural (no stuffing).",
        examples:["Detect keyword overuse.","Find missing related terms.","Balance keywords in headings."],
        catHref:"/tools/#seo",
        catLabel:"SEO Tools",
        cta:"Use Keyword Density Checker"
      }
    ];

    const swappableSlots = [4, 5];
    let idx = 0;

    function setCard(card, data){
      if(!card || !data) return;

      card.setAttribute('href', data.href);

      const iconEl  = card.querySelector('.rec-icon');
      const titleEl = card.querySelector('h3');
      const descEl  = card.querySelector('p');
      const exUl    = card.querySelector('.tool-examples');
      const catA    = card.querySelector('.tool-cat a');
      const ctaEl   = card.querySelector('.tool-cta');

      if(iconEl)  iconEl.textContent = data.icon;
      if(titleEl) titleEl.textContent = data.title;
      if(descEl)  descEl.textContent = data.desc;

      if(exUl){
        exUl.innerHTML = "";
        (data.examples || []).slice(0,3).forEach(t => {
          const li = document.createElement('li');
          li.textContent = t;
          exUl.appendChild(li);
        });
      }

      if(catA){
        catA.setAttribute('href', data.catHref);
        catA.textContent = data.catLabel;
      }

      if(ctaEl) ctaEl.textContent = data.cta;
    }

    btn.addEventListener('click', () => {
      swappableSlots.forEach((slot, i) => {
        const card = grid.querySelector(`.rec-card[data-slot="${slot}"]`);
        const data = extra[(idx + i) % extra.length];
        setCard(card, data);
      });
      idx = (idx + 1) % extra.length;
    }, { passive:true });
  })();

})();

/* Premium footer brand: one footer identity across the CMS. */
(() => {
  const standardFooterColumns = `
    <div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/premium/">Premium</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div>
    <div><h4>Tool hubs</h4><div class="footer-links"><a href="/tools/seo-tools/">SEO Tools</a><a href="/premium/dev-premium-tools/">Dev Premium Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/tools/writing-tools/">Writing Tools</a><a href="/guides/creator/">Creator Guides</a></div></div>
    <div><h4>Popular tools</h4><div class="footer-links"><a href="/premium/multi-device-tester/">Multi Device Tester</a><a href="/premium/sitemap-viewer/">Site Map Pro</a><a href="/tools/word-counter/">Word Counter</a><a href="/tools/json-formatter/">JSON Formatter</a></div></div>
    <div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/404/">404</a></div></div>`;

  function enhanceFooters(){
    document.querySelectorAll(".footer").forEach((footer) => {
      if (footer.dataset.cmsFooterReady === "true") return;
      const grid = footer.querySelector(".footer-grid");
      if (!grid) return;
      footer.querySelectorAll(".footer-brand, .footer-brand-col").forEach((el) => el.remove());
      grid.innerHTML = standardFooterColumns;

      const brand = document.createElement("a");
      brand.className = "footer-brand footer-brand-bottom";
      brand.href = "/";
      brand.setAttribute("aria-label", "Clickoz Home");
      brand.innerHTML = `
        <span class="footer-logo-badge" aria-hidden="true">
          <img class="footer-logo-mark logo-mark logo-img" src="/assets/clickoz-logo-512.png" alt="" width="48" height="48" decoding="async" />
        </span>
        <span class="footer-brand-copy">
          <strong>Click<span>oz</span></strong>
          <em>Fast tools, practical guides, cleaner workflows.</em>
        </span>`;

      const brandCol = document.createElement("div");
      brandCol.className = "footer-brand-col";
      brandCol.appendChild(brand);
      grid.appendChild(brandCol);

      const bottom = grid.nextElementSibling;
      if (bottom && bottom.classList && bottom.classList.contains("container")) {
        bottom.classList.remove("footer-bottom-integrated");
        if (!bottom.querySelector("hr")) {
          bottom.prepend(Object.assign(document.createElement("hr"), { className: "sep" }));
        }
        bottom.querySelectorAll(":scope > div").forEach((el) => el.classList.remove("footer-copy-line"));
      }
      footer.dataset.cmsFooterReady = "true";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceFooters, { once: true });
  } else {
    enhanceFooters();
  }
})();

/* Premium tag layer: guide pages stay first, Premium workflows appear before lite tools. */
(() => {
  "use strict";

  const match = (window.location.pathname || "").match(/^\/tags\/([^/]+)\/?$/);
  if (!match || !document.body.classList.contains("tag-page")) return;

  const premiumTools = {
    multiDevice: {
      title: "Multi Device Tester",
      url: "/premium/multi-device-tester/",
      desc: "Preview a public site across mobile, tablet and desktop with direct or snapshot mode.",
      tags: ["Premium workflow", "Responsive QA"]
    },
    sitemapViewer: {
      title: "Site Map Pro",
      url: "/premium/sitemap-viewer/",
      desc: "Load a public sitemap and map URL structure in a searchable graph.",
      tags: ["Premium workflow", "Technical SEO"]
    }
  };

  const tagMap = {
    "mobile-ready": [premiumTools.multiDevice],
    "mobile": [premiumTools.multiDevice],
    "instant-preview": [premiumTools.multiDevice],
    "preview": [premiumTools.multiDevice],
    "website-check": [premiumTools.multiDevice, premiumTools.sitemapViewer],
    "workflow": [premiumTools.multiDevice, premiumTools.sitemapViewer],
    "seo-technical": [premiumTools.sitemapViewer],
    "crawl-rules": [premiumTools.sitemapViewer],
    "debug": [premiumTools.sitemapViewer]
  };

  const items = tagMap[match[1]];
  if (!items || !items.length || document.querySelector(".premium-tag-resource-section")) return;

  const liteSection = document.querySelector(".tag-tool-section");
  const target = liteSection || document.querySelector("main");
  if (!target) return;

  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

  const section = document.createElement("section");
  section.className = "tag-resource-section premium-tag-resource-section";
  section.setAttribute("aria-label", "Premium tools for this tag");
  section.innerHTML = `
    <div class="section-head">
      <div><p class="guide-kicker">PREMIUM TOOLS NEXT</p><h2>Use the complete workflow tools.</h2><p class="section-desc">These Premium tools sit after the guides and before the lite tools for this tag.</p></div>
      <span class="section-count">${items.length} premium ${items.length === 1 ? "tool" : "tools"}</span>
    </div>
    <div class="tag-guide-grid">
      ${items.map((item) => `
        <a class="tag-guide-card guide-hub-card premium-tag-card" href="${esc(item.url)}">
          <div class="authority-card-head"><span aria-hidden="true">PRO</span><h2>${esc(item.title)}</h2></div>
          <p>${esc(item.desc)}</p>
          <div class="tag-card-meta">${item.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
        </a>`).join("")}
    </div>`;

  if (liteSection) {
    liteSection.insertAdjacentElement("beforebegin", section);
    const liteHeading = liteSection.querySelector(".section-name");
    if (liteHeading) liteHeading.textContent = "Open the related lite tools";
  } else {
    target.appendChild(section);
  }
})();

/* Guide library search: filter long guide hubs without flattening the CMS structure. */
(() => {
  "use strict";

  const input = document.getElementById("guideSearch");
  if (!input) return;

  const reset = document.getElementById("guideSearchReset");
  const status = document.getElementById("guideSearchStatus");
  const panel = input.closest(".guide-search-panel");
  const overview = document.querySelector(".guide-hub-overview");
  const bands = Array.from(document.querySelectorAll(".guide-category-band"));
  const cards = Array.from(document.querySelectorAll(".guide-category-band .guide-hub-card"));
  const previewTotal = cards.length;
  const fullTotal = bands.reduce((sum, band) => {
    const bandCards = band.querySelectorAll(".guide-hub-card").length;
    return sum + Number(band.dataset.guideCount || bandCards);
  }, 0);

  if (!cards.length) return;

  const norm = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cardMeta = cards.map((card) => ({
    el: card,
    band: card.closest(".guide-category-band"),
    text: norm(card.textContent)
  }));
  const guideSearchChips = Array.from(document.querySelectorAll("[data-guide-search]"));

  const empty = document.createElement("div");
  empty.className = "guide-search-empty";
  empty.hidden = true;
  empty.setAttribute("role", "status");
  empty.innerHTML = `
    <strong>No guide matches that search.</strong>
    <span>Try a task or tool name: meta title, JSON error, UTM, readability, YouTube description.</span>
    <a href="/contact/#request">Request a guide</a>
  `;
  panel?.insertAdjacentElement("afterend", empty);

  function syncUrl(rawValue) {
    const raw = String(rawValue || "").trim();
    const url = new URL(window.location.href);
    if (raw) url.searchParams.set("q", raw);
    else url.searchParams.delete("q");
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) history.replaceState(null, "", next);
  }

  function apply(rawValue) {
    const raw = String(rawValue || "").trim();
    const query = norm(raw);
    let shown = 0;

    cardMeta.forEach((meta) => {
      const ok = !query || query.split(/\s+/).every((part) => meta.text.includes(part));
      meta.el.hidden = !ok;
      if (ok) meta.el.style.removeProperty("display");
      else meta.el.style.setProperty("display", "none", "important");
      if (ok) shown += 1;
    });

    bands.forEach((band) => {
      const visible = Array.from(band.querySelectorAll(".guide-hub-card")).filter((card) => !card.hidden).length;
      band.hidden = Boolean(query) && visible === 0;
      if (band.hidden) band.style.setProperty("display", "none", "important");
      else band.style.removeProperty("display");
      const head = band.querySelector(".authority-head p:last-child");
      if (head && query) {
        head.dataset.searchCount = `${visible} matching guides`;
      } else if (head) {
        delete head.dataset.searchCount;
      }
    });

    if (overview) {
      overview.hidden = Boolean(query);
      if (overview.hidden) overview.style.setProperty("display", "none", "important");
      else overview.style.removeProperty("display");
    }
    if (reset) reset.hidden = !query;
    if (empty) empty.hidden = !query || shown > 0;
    if (status) {
      status.textContent = query
        ? `Showing ${shown} of ${previewTotal} newest guide previews for "${raw}"`
        : `Showing ${previewTotal} newest guide previews${fullTotal > previewTotal ? ` (${fullTotal} total)` : ""}`;
    }
    guideSearchChips.forEach((chip) => {
      const active = Boolean(query) && norm(chip.getAttribute("data-guide-search")) === query;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  let timer = null;
  input.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      apply(input.value);
      syncUrl(input.value);
    }, 120);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    input.value = "";
    apply("");
    syncUrl("");
  });

  reset?.addEventListener("click", () => {
    input.value = "";
    apply("");
    syncUrl("");
    input.focus({ preventScroll: true });
  });

  document.addEventListener("click", (event) => {
    const chip = event.target instanceof Element ? event.target.closest("[data-guide-search]") : null;
    if (!chip) return;
    const value = chip.getAttribute("data-guide-search") || "";
    input.value = value;
    apply(value);
    syncUrl(value);
    input.focus({ preventScroll: true });
  });

  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  if (initialQuery) {
    input.value = initialQuery;
    apply(initialQuery);
  } else {
    apply("");
  }
})();

/* Updates release board: filter changelog cards by product impact. */
(() => {
  "use strict";

  const panel = document.querySelector(".updates-control-panel");
  if (!panel) return;

  const buttons = Array.from(panel.querySelectorAll("[data-release-filter]"));
  const cards = Array.from(document.querySelectorAll(".release-lab-grid .release-card"));
  const status = panel.querySelector(".updates-filter-status");
  if (!buttons.length || !cards.length) return;

  const norm = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function syncUrl(filter) {
    const url = new URL(window.location.href);
    if (filter && filter !== "all") url.searchParams.set("release", filter);
    else url.searchParams.delete("release");
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) history.replaceState(null, "", next);
  }

  function setFilter(filter, { sync = true } = {}) {
    const active = norm(filter) || "all";
    const aliases = {
      tools: ["tool", "tools"],
      guide: ["guide", "guides"],
      seo: ["seo", "schema", "search"],
      performance: ["performance", "mobile", "runtime"],
      ux: ["ux", "ui", "design", "motion"]
    };
    const wanted = aliases[active] || [active];
    let shown = 0;

    buttons.forEach((button) => {
      const selected = button.getAttribute("data-release-filter") === active;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    cards.forEach((card) => {
      const tags = norm(card.getAttribute("data-release-tags") || card.textContent || "");
      const tokens = tags.split(" ").filter(Boolean);
      const visible = active === "all" || wanted.some((token) => tokens.includes(token));
      card.hidden = !visible;
      if (visible) {
        card.style.removeProperty("display");
        shown += 1;
      } else {
        card.style.setProperty("display", "none", "important");
      }
    });

    if (status) status.textContent = active === "all"
      ? `Showing ${cards.length} releases`
      : `Showing ${shown} ${shown === 1 ? "release" : "releases"} for ${active}`;
    if (sync) syncUrl(active);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.getAttribute("data-release-filter") || "all"));
  });

  const initial = norm(new URLSearchParams(window.location.search).get("release") || "all");
  const allowed = buttons.some((button) => button.getAttribute("data-release-filter") === initial) ? initial : "all";
  setFilter(allowed, { sync: false });
})();

/* Updates manifesto typewriter: real text reveal, not a layout-only animation. */
(() => {
  "use strict";

  function initUpdatesTypewriter() {
    const line = document.querySelector(".updates-manifesto [data-typewriter]");
    if (!line || line.dataset.typed === "1") return;
    const text = (line.getAttribute("data-typewriter") || line.textContent || "").trim();
    if (!text) return;
    line.dataset.typed = "1";

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      line.textContent = text;
      line.classList.add("is-complete");
      return;
    }

    line.textContent = "";
    line.classList.add("is-typing");
    let index = 0;

    const tick = () => {
      line.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) {
        const punctuationPause = /[,.]/.test(text[index - 2] || "") ? 120 : 0;
        window.setTimeout(tick, 22 + Math.min(index, 18) + punctuationPause);
      } else {
        line.classList.remove("is-typing");
        line.classList.add("is-complete");
      }
    };

    window.setTimeout(tick, 420);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initUpdatesTypewriter, { once: true });
  else initUpdatesTypewriter();
})();

/* Browser-only work memory: command palette, favorites, recent tools and next steps. */
(() => {
  "use strict";

  const cms = window.ClickozCMS || {};
  const storage = {
    recent: "clickoz_recent_tools",
    favorites: "clickoz_favorite_tools"
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
  const norm = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  const jobCatalog = [
    {
      id: "json",
      title: "Fix broken JSON",
      url: "/tools/json-formatter/",
      meta: "Quick task",
      description: "Paste a payload, format it, validate it and keep debugging.",
      sampleInput: "{\"title\":\"Clickoz\",\"status\":\"fast\"}",
      sampleOutput: "Valid formatted JSON",
      timeSaved: "Fix in 10 sec",
      usedFor: "Debugging payloads",
      search: "fix json broken json format json validate payload config sistemare json json rotto"
    },
    {
      id: "snippet",
      title: "Create SEO snippet",
      url: "/tools/meta-tags/",
      meta: "Quick task",
      description: "Turn a rough page idea into a title, description and preview.",
      sampleInput: "landing page idea",
      sampleOutput: "Search-ready title and meta description",
      timeSaved: "Publish faster",
      usedFor: "SEO publishing",
      search: "seo snippet meta title description descrizione serp preview pagina pubblicare"
    },
    {
      id: "clean",
      title: "Clean pasted text",
      url: "/tools/whitespace-cleaner/",
      meta: "Quick task",
      description: "Remove spacing noise, blank lines and messy paste formatting.",
      sampleInput: "messy AI draft",
      sampleOutput: "Clean text ready to copy",
      timeSaved: "Clean in 5 sec",
      usedFor: "Client work",
      search: "clean text whitespace cleaner pulire testo sistemare testo spazi ai draft"
    },
    {
      id: "youtube",
      title: "Prepare YouTube upload",
      url: "/tools/youtube-title-generator/",
      meta: "Quick task",
      description: "Start with title angles, then move to thumbnail, description and tracking.",
      sampleInput: "video idea",
      sampleOutput: "Title angles plus next upload tools",
      timeSaved: "Upload sprint",
      usedFor: "Creator uploads",
      search: "youtube upload title titolo video thumbnail description hashtags creator"
    },
    {
      id: "utm",
      title: "Build tracking URL",
      url: "/tools/utm-builder/",
      meta: "Quick task",
      description: "Create measurable campaign links without messy parameters.",
      sampleInput: "campaign link",
      sampleOutput: "Clean UTM URL",
      timeSaved: "Track in 20 sec",
      usedFor: "Campaign work",
      search: "utm tracking url link campaign marketing sorgente campagna"
    }
  ];

  const categoryDefaults = {
    seo: {
      problem: "Prepare a page before publishing.",
      quickJob: "SEO publishing check",
      sampleInput: "page title or keyword",
      sampleOutput: "Search-ready page element",
      timeSaved: "Publish faster",
      usedFor: "SEO publishing",
      aliases: "snippet serp meta keyword title description slug"
    },
    text: {
      problem: "Clean, count or improve a draft before sending.",
      quickJob: "Text cleanup",
      sampleInput: "messy draft",
      sampleOutput: "Text ready to copy",
      timeSaved: "Fix in seconds",
      usedFor: "Client work",
      aliases: "clean text writing readability count parole testo pulire"
    },
    dev: {
      problem: "Debug a payload or convert technical text quickly.",
      quickJob: "Payload repair",
      sampleInput: "payload or encoded text",
      sampleOutput: "Readable developer output",
      timeSaved: "Debug faster",
      usedFor: "Fast formatting",
      aliases: "json url base64 regex html developer debug payload"
    },
    youtube: {
      problem: "Package a YouTube upload without opening extra tools.",
      quickJob: "Upload sprint",
      sampleInput: "video idea",
      sampleOutput: "Creator-ready upload section",
      timeSaved: "Upload faster",
      usedFor: "Creator uploads",
      aliases: "youtube video title thumbnail description hashtag creator upload"
    },
    tracking: {
      problem: "Make links measurable without messy parameters.",
      quickJob: "Campaign link",
      sampleInput: "URL and campaign name",
      sampleOutput: "Clean tracking URL",
      timeSaved: "Track in seconds",
      usedFor: "Campaign work",
      aliases: "utm tracking campaign link url marketing"
    },
    web: {
      problem: "Check web, DNS, security or identifier work quickly.",
      quickJob: "Web check",
      sampleInput: "domain, IP or setting",
      sampleOutput: "Actionable web utility result",
      timeSaved: "Check faster",
      usedFor: "Web operations",
      aliases: "dns http ping password uuid timestamp robots security"
    },
    socialai: {
      problem: "Turn creator ideas into usable social content.",
      quickJob: "Creator content",
      sampleInput: "post or content idea",
      sampleOutput: "Ready-to-use creator copy",
      timeSaved: "Create faster",
      usedFor: "Creator growth",
      aliases: "social tiktok instagram linkedin hook caption ai creator"
    }
  };

  const explicitProfiles = {
    "meta-tags": { problem: "Generate a sharper search snippet with length and intent signals.", quickJob: "SEO snippet", sampleInput: "rough page title", sampleOutput: "Title + meta description", timeSaved: "Fix in 30 sec", usedFor: "SEO publishing", aliases: "snippet meta descrizione title seo" },
    "word-counter": { problem: "Measure draft size, reading time and content density instantly.", quickJob: "Live count", sampleInput: "draft text", sampleOutput: "Words, chars and reading time", timeSaved: "Count instantly", usedFor: "Client work", aliases: "count words parole caratteri reading time" },
    "readability-analyzer": { problem: "Detect readability pressure, heavy sentences and weak content flow.", quickJob: "Readability scan", sampleInput: "long paragraph", sampleOutput: "Readability pressure map and sentence fixes", timeSaved: "Edit faster", usedFor: "Readable drafts", aliases: "readability clarity scan sentence testo leggibilita" },
    "text-case-converter": { problem: "Instantly normalize messy headings, labels and copied AI text.", quickJob: "Case engine", sampleInput: "a MESSY heading, product name or pasted title", sampleOutput: "Clean heading variants ready to paste", timeSaved: "Fix in seconds", usedFor: "Typography cleanup", aliases: "case converter uppercase lowercase title sentence" },
    "whitespace-cleaner": { problem: "Make pasted AI, PDF or CMS content clean and publish-ready.", quickJob: "Cleanup engine", sampleInput: "messy AI draft", sampleOutput: "Clean text with broken spacing repaired", timeSaved: "Clean in 5 sec", usedFor: "Text cleanup", aliases: "clean text whitespace spaces pulire testo spazi" },
    "json-formatter": { problem: "Repair and read JSON quickly.", quickJob: "Fix broken JSON", sampleInput: "{\"status\":\"messy\"}", sampleOutput: "Valid formatted JSON", timeSaved: "Debug in 10 sec", usedFor: "Fast formatting", aliases: "json rotto payload config validate" },
    "utm-builder": { problem: "Build campaign links without mistakes.", quickJob: "Tracking URL", sampleInput: "landing page URL", sampleOutput: "Clean UTM link", timeSaved: "Track in 20 sec", usedFor: "Campaign work", aliases: "utm tracking link campaign url" },
    "youtube-title-generator": { problem: "Create usable title angles for an upload.", quickJob: "YouTube title", sampleInput: "video idea", sampleOutput: "Title options", timeSaved: "Upload faster", usedFor: "Creator uploads", aliases: "youtube title titolo video upload creator" },
    "youtube-description-generator": { problem: "Package a video description faster.", quickJob: "YouTube description", sampleInput: "video topic", sampleOutput: "Description draft", timeSaved: "Write faster", usedFor: "Creator uploads", aliases: "youtube description descrizione video upload" },
    "thumbnail-brief-generator": { problem: "Turn a video idea into a visual brief.", quickJob: "Thumbnail brief", sampleInput: "video promise", sampleOutput: "Visual brief", timeSaved: "Brief faster", usedFor: "Creator uploads", aliases: "thumbnail brief youtube visual" },
    "slug-generator": { problem: "Compress page titles into clean, durable URL slugs.", quickJob: "Slug engine", sampleInput: "page title", sampleOutput: "Short URL slug", timeSaved: "Fix in seconds", usedFor: "SEO publishing", aliases: "slug url seo permalink" },
    "serp-preview": { problem: "Preview the live search result shape before publishing.", quickJob: "SERP preview", sampleInput: "title and description", sampleOutput: "Search result preview", timeSaved: "Preview faster", usedFor: "SEO publishing", aliases: "serp preview google snippet" },
    "meta-tag-optimizer": { problem: "Stress-test title and description before the snippet goes live.", quickJob: "Snippet check", sampleInput: "URL, SEO title and meta description.", sampleOutput: "Length status, risk note and next copy decision.", timeSaved: "Publish faster", usedFor: "SEO publishing", aliases: "meta title description checker snippet seo" },
    "keyword-density": { problem: "Spot repetition patterns before SEO copy starts sounding stuffed.", quickJob: "Keyword balance", sampleInput: "A product paragraph, guide section or landing page draft.", sampleOutput: "Top terms, density signals and repetition warning.", timeSaved: "Scan in seconds", usedFor: "SEO copy review", aliases: "keyword density repetition stuffing seo copy" }
  };

  const quickTaskVisuals = [
    { match: /text case|uppercase|lowercase|title case|sentence case|typography/, vibe: "type", label: "AI fix", engine: "Case engine", processing: "normalizing structure...", cta: "Normalize text", visual: "letters" },
    { match: /readability|hard to read|hard-to-read|clarity|pressure|word count|character|limit|reading time/, vibe: "analytics", label: "AI scan", engine: "Readability engine", processing: "mapping content pressure...", cta: "Run analyzer", visual: "bars" },
    { match: /whitespace|cleanup|paste|spacing|pasted ai|clean pasted/, vibe: "repair", label: "AI repair", engine: "Cleanup engine", processing: "removing spacing noise...", cta: "Clean text", visual: "particles" },
    { match: /json|payload|base64|url encode|entity|html|regex|developer|debug/, vibe: "dev", label: "Debug engine", engine: "Parser engine", processing: "validating payload...", cta: "Run utility", visual: "terminal" },
    { match: /youtube|thumbnail|video|shorts|chapter|creator/, vibe: "creator", label: "Creator AI", engine: "Angle engine", processing: "scoring hook options...", cta: "Build upload", visual: "wave" },
    { match: /utm|tracking|campaign/, vibe: "tracking", label: "Link engine", engine: "Tracking engine", processing: "assembling clean parameters...", cta: "Build link", visual: "nodes" },
    { match: /seo|serp|slug|keyword|meta|snippet|title|description/, vibe: "seo", label: "SEO engine", engine: "Intent engine", processing: "checking search signals...", cta: "Run SEO check", visual: "radar" },
    { match: /password|uuid|dns|http|subnet|timestamp|robots|color|diff|web/, vibe: "ops", label: "Ops engine", engine: "Check engine", processing: "reading technical signals...", cta: "Run check", visual: "grid" },
    { match: /tiktok|instagram|linkedin|reddit|pinterest|caption|social|bio|hashtag|newsletter|podcast|ugc|cta|calendar|sponsorship|media kit|affiliate|disclosure/, vibe: "social", label: "Social AI", engine: "Draft engine", processing: "shaping platform output...", cta: "Generate copy", visual: "pulse" }
  ];

  const quickTaskExamples = [
    { match: /character|bio|caption|form|limit/, input: "Bio, snippet or form copy near a strict limit.", output: "Character count, limit warning and copy-ready text.", usedFor: "Tight copy fields" },
    { match: /text case|uppercase|lowercase|title case|sentence case/, input: "A messy heading, product name or pasted title.", output: "Clean case variants ready to paste.", usedFor: "Copy cleanup" },
    { match: /json minifier|minify/, input: "{\"title\":\"Clickoz\",\"draft\":true}", output: "Compact JSON and size difference.", usedFor: "Payload cleanup" },
    { match: /url encode|url encoder|query|string|parameter/, input: "campaign name=spring launch & source=instagram", output: "Encoded and decoded URL-safe values.", usedFor: "Query repair" },
    { match: /base64/, input: "Plain text, token-like text or encoded payload.", output: "Encoded text, decoded attempt and safety note.", usedFor: "Payload inspection" },
    { match: /html entity|entity|markup|escaping/, input: "<strong>Sale & update</strong>", output: "Escaped or repaired HTML-safe text.", usedFor: "Markup repair" },
    { match: /http ping|latency|reachability/, input: "https://example.com or your public page URL.", output: "Status, latency and reachability signal.", usedFor: "Website checks" },
    { match: /dns|domain/, input: "Domain name you want to check.", output: "Readable DNS records and lookup status.", usedFor: "DNS checks" },
    { match: /subnet|cidr|ipv4/, input: "192.168.1.0/24 or another IPv4 CIDR.", output: "Network range, hosts and broadcast values.", usedFor: "Network math" },
    { match: /password|passphrase/, input: "Length, symbols and passphrase preferences.", output: "Strong browser-only password options.", usedFor: "Credential setup" },
    { match: /uuid/, input: "Number of UUID values needed.", output: "RFC 4122 UUID v4 list ready to copy.", usedFor: "IDs and testing" },
    { match: /timestamp|unix|iso|timezone/, input: "Unix timestamp, ISO date or current time.", output: "Local date, ISO time and timestamp value.", usedFor: "Time conversion" },
    { match: /regex|regular expression|match|replace/, input: "Pattern plus the text you want to test.", output: "Matches, groups and replace preview.", usedFor: "Regex debugging" },
    { match: /diff|compare/, input: "Old text and revised text.", output: "Added, removed and changed lines.", usedFor: "Reviewing edits" },
    { match: /color|hex|rgb|hsl|contrast/, input: "#38e8ff, rgb() or hsl() color value.", output: "Converted color values and quick contrast.", usedFor: "Design checks" },
    { match: /robots|crawl|sitemap/, input: "Allowed paths, blocked paths and sitemap URL.", output: "Clean robots.txt rules.", usedFor: "Technical SEO" },
    { match: /hashtag/, input: "Topic, niche and draft hashtag list.", output: "Balanced hashtag mix without stuffing.", usedFor: "Creator metadata" },
    { match: /thumbnail/, input: "Video promise, focal point and thumbnail text.", output: "Mobile-readable thumbnail direction.", usedFor: "Upload packaging" },
    { match: /chapter/, input: "Rough video outline with timestamps or sections.", output: "Clean YouTube chapters ready to paste.", usedFor: "Description structure" },
    { match: /\bugc\b|\bscript\b|ad flow|video script/, input: "Offer, audience, proof point and CTA.", output: "Hook, beats and CTA in a short script.", usedFor: "Video scripting" },
    { match: /comment reply|community/, input: "Viewer comment, tone and reply goal.", output: "Respectful response draft.", usedFor: "Audience replies" },
    { match: /competitor|title analyzer/, input: "Competing title ideas or titles you like.", output: "Hook patterns and safer title angles.", usedFor: "Title research" },
    { match: /tiktok|reels|shorts|hook/, input: "Short-form idea, viewer and first-second promise.", output: "Hook options or retention warning.", usedFor: "Short-form ideas" },
    { match: /instagram bio|profile/, input: "Current bio, niche, proof and link goal.", output: "Clearer bio with CTA and trust signal.", usedFor: "Profile cleanup" },
    { match: /carousel/, input: "Topic, audience and main takeaway.", output: "Slide-by-slide outline.", usedFor: "Social planning" },
    { match: /alt text/, input: "Image context, visible text and purpose.", output: "Useful alt text for social images.", usedFor: "Accessibility" },
    { match: /linkedin/, input: "Idea, audience and desired response.", output: "Spaced post with hook, body and CTA.", usedFor: "Professional posts" },
    { match: /x thread|thread/, input: "Idea, proof points and CTA.", output: "Numbered thread structure.", usedFor: "Thread writing" },
    { match: /pinterest|pin title/, input: "Pin topic, keyword and destination intent.", output: "Search-friendly pin title options.", usedFor: "Pinterest search" },
    { match: /reddit/, input: "Subreddit, topic and draft title.", output: "Specific non-spammy title check.", usedFor: "Community posts" },
    { match: /disclosure|affiliate|ai-use|ai disclosure/, input: "Platform, relationship and disclosure need.", output: "Clear disclosure text.", usedFor: "Transparency copy" },
    { match: /calendar/, input: "Content pillars, channels and weekly cadence.", output: "Repeatable creator schedule.", usedFor: "Publishing rhythm" },
    { match: /sponsorship|rate/, input: "Views, engagement, deliverables and usage rights.", output: "Estimated sponsorship range.", usedFor: "Brand deal pricing" },
    { match: /media kit/, input: "Niche, audience, metrics and offer.", output: "Media kit summary sections.", usedFor: "Brand deals" },
    { match: /newsletter|subject/, input: "Email topic, audience and promise.", output: "Subject line options with risk notes.", usedFor: "Email opens" },
    { match: /podcast|show notes/, input: "Episode notes, links and key moments.", output: "Summary, chapters and promo snippets.", usedFor: "Episode packaging" },
    { match: /repurposing/, input: "Main video topic and strongest moments.", output: "Shorts, posts and newsletter angles.", usedFor: "Content reuse" },
    { match: /content gap/, input: "Topic, page angle and current outline.", output: "Missing questions, angles and links.", usedFor: "Content planning" },
    { match: /cta|call to action/, input: "Platform, offer and next action.", output: "Platform-fit CTA options.", usedFor: "Conversion copy" }
  ];

  function derivedQuickProfile(tool, base, explicit) {
    const text = norm(`${tool.slug || ""} ${tool.title || ""} ${tool.description || ""} ${(tool.features || []).join(" ")}`);
    const preset = quickTaskExamples.find((item) => item.match.test(text)) || {};
    const visual = quickTaskVisuals.find((item) => item.match.test(text)) || { vibe: "default", label: "AI fix", engine: "Tool engine", processing: "processing input...", cta: "Launch AI tool", visual: "grid" };
    const featureOutput = (tool.features || []).filter(Boolean).slice(0, 2).join(" + ");
    return {
      problem: explicit.problem || tool.description || base.problem,
      quickJob: explicit.quickJob || String(tool.title || base.quickJob).replace(/\s+(Generator|Checker|Tool)$/i, ""),
      sampleInput: explicit.sampleInput || preset.input || base.sampleInput,
      sampleOutput: explicit.sampleOutput || preset.output || (featureOutput ? `${featureOutput} result ready to copy` : base.sampleOutput),
      timeSaved: explicit.timeSaved || preset.timeSaved || base.timeSaved,
      usedFor: explicit.usedFor || preset.usedFor || base.usedFor,
      engine: explicit.engine || visual.engine,
      processing: explicit.processing || visual.processing,
      primaryBadge: explicit.primaryBadge || visual.label,
      ctaLabel: explicit.ctaLabel || visual.cta,
      visual: explicit.visual || visual.visual,
      vibe: explicit.vibe || visual.vibe
    };
  }

  function toolOutcomeCopy(tool, profile) {
    const title = String(tool.title || "");
    if (/readability/i.test(title)) return "Detect heavy sentences, weak flow and mobile reading friction in seconds.";
    if (/case/i.test(title)) return "Normalize messy headings, labels and copied AI text without manual retyping.";
    if (/whitespace|cleaner/i.test(title)) return "Repair pasted AI, PDF and CMS spacing so the copy is ready to publish.";
    if (/word counter/i.test(title)) return "Measure draft length, density and reading time before you ship the copy.";
    if (/character/i.test(title)) return "Check strict copy limits for bios, snippets, captions and form fields.";
    if (/json/i.test(title)) return "Validate, format or compress payloads while you stay in the browser.";
    if (/youtube|thumbnail|chapter|shorts/i.test(title)) return "Package creator ideas into upload-ready titles, hooks and sections.";
    if (/seo|meta|serp|slug|keyword/i.test(`${title} ${tool.category || ""}`)) return "Turn rough page inputs into search-ready publishing decisions.";
    return profile?.problem || tool.description || "";
  }

  function quickTaskVisualMarkup(type) {
    const bars = `<i></i><i></i><i></i><i></i>`;
    const letters = `<span>Aa</span><span>AA</span><span>Title</span>`;
    const particles = `<i></i><i></i><i></i><i></i><i></i>`;
    const terminal = `<span>{ }</span><span>OK</span><span>01</span>`;
    const wave = `<i></i><i></i><i></i><i></i><i></i>`;
    const nodes = `<i></i><i></i><i></i><b></b>`;
    const radar = `<i></i><i></i><i></i>`;
    const pulse = `<i></i><i></i><i></i><i></i>`;
    const grid = `<i></i><i></i><i></i><i></i>`;
    const map = { bars, letters, particles, terminal, wave, nodes, radar, pulse, grid };
    return `<div class="quick-task-visual quick-task-visual-${esc(type || "grid")}" aria-hidden="true">${map[type] || map.grid}</div>`;
  }

  function profileForTool(toolOrSlug) {
    const tool = typeof toolOrSlug === "string" ? (cms.toolBySlug?.[toolOrSlug] || null) : toolOrSlug;
    if (!tool) return null;
    const base = categoryDefaults[tool.category] || categoryDefaults.text;
    const explicit = explicitProfiles[tool.slug] || {};
    const derived = derivedQuickProfile(tool, base, explicit);
    return {
      ...base,
      ...derived,
      ...explicit,
      nextTools: tool.relatedTools || [],
      search: `${tool.title} ${tool.description} ${(tool.features || []).join(" ")} ${tool.category} ${base.aliases || ""} ${explicit.aliases || ""} ${explicit.problem || base.problem} ${explicit.quickJob || base.quickJob}`
    };
  }

  function initToolCardQuickTasks() {
    if (!document.body.classList.contains("tools-page")) return;
    const toolBySlug = cms.toolBySlug || Object.fromEntries((cms.tools || []).map((tool) => [tool.slug, tool]));
    $$(".tool-card-enhanced[data-tool-slug]").forEach((card) => {
      const slug = card.getAttribute("data-tool-slug");
      const tool = toolBySlug[slug];
      const profile = profileForTool(tool || slug);
      const preview = $(".tool-output-preview", card);
      if (!tool || !profile || !preview) return;
      preview.classList.add("tool-output-preview-concrete");
      card.setAttribute("data-card-vibe", profile.vibe || "default");
      card.style.setProperty("--tool-cta-label", `"${profile.ctaLabel || "Launch AI tool"}"`);
      card.setAttribute("data-quick-task-ready", "true");
      const topCopy = $(".card-top p", card);
      if (topCopy) topCopy.textContent = toolOutcomeCopy(tool, profile);
      preview.innerHTML = `
        <div class="quick-task-head">
          <span class="quick-task-label">${esc(profile.primaryBadge || "AI fix")}</span>
          <span class="quick-task-badge">${esc(profile.timeSaved || "2 sec")}</span>
        </div>
        <strong class="quick-task-title">${esc(profile.problem || tool.description)}</strong>
        ${quickTaskVisualMarkup(profile.visual)}
        <div class="tool-card-flow quick-task-flow quick-task-engine-flow" aria-label="${esc(tool.title)} live example workflow">
          <p class="quick-task-step quick-task-step-input"><span class="quick-task-num" aria-hidden="true">01</span><b>Raw input</b><span>${esc(profile.sampleInput || "Paste the input you need to finish.")}</span></p>
          <p class="quick-task-step quick-task-step-process"><span class="quick-task-num" aria-hidden="true">02</span><b>${esc(profile.engine || "AI engine")}</b><span>${esc(profile.processing || "processing input...")}</span></p>
          <p class="quick-task-step quick-task-step-output"><span class="quick-task-num" aria-hidden="true">03</span><b>Ready output</b><span>${esc(profile.sampleOutput || "A clean result you can review and copy.")}</span></p>
        </div>
        <div class="quick-task-next"><span>Copy ready</span><em>${esc(profile.usedFor || "Focused browser work")}</em></div>
      `;
    });
  }

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function writeList(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function toolBySlug(slug) {
    return cms.toolBySlug?.[slug] || null;
  }

  window.ClickozWorkCMS = {
    jobs: jobCatalog,
    profileForSlug: (slug) => profileForTool(slug),
    profileForTool
  };

  function currentTool() {
    const slug = document.body?.dataset?.toolSlug;
    if (slug && toolBySlug(slug)) return toolBySlug(slug);
    const path = window.location.pathname || "";
    return cms.tools?.find((tool) => tool.url === path) || null;
  }

  function rememberCurrentTool() {
    const tool = currentTool();
    if (!tool) return;
    const recent = readList(storage.recent).filter((slug) => slug !== tool.slug);
    writeList(storage.recent, [tool.slug, ...recent].slice(0, 12));
  }

  function setFavorite(slug, saved) {
    if (!slug || !toolBySlug(slug)) return;
    const existing = readList(storage.favorites).filter((item) => item !== slug);
    const next = saved ? [slug, ...existing].slice(0, 32) : existing;
    writeList(storage.favorites, next);
    document.dispatchEvent(new CustomEvent("clickoz:favorites-changed", { detail: { slug, saved } }));
    syncFavoriteControls();
  }

  function isFavorite(slug) {
    return readList(storage.favorites).includes(slug);
  }

  function syncFavoriteControls() {
    $$("[data-cz-fav-toggle]").forEach((button) => {
      const slug = button.getAttribute("data-cz-fav-toggle");
      const saved = isFavorite(slug);
      const style = button.getAttribute("data-cz-fav-style") || "";
      const tool = slug ? toolBySlug(slug) : null;
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${tool?.title || "tool"} ${saved ? "from" : "to"} favorites`);
      if (style === "icon") button.textContent = saved ? "★" : "☆";
      else if (style === "detail") button.textContent = saved ? "Saved in Favorites" : "Add to Favorites";
      else button.textContent = saved ? "Saved" : "Save tool";
    });
  }

  function addFavoriteControl() {
    const tool = currentTool();
    const hero = $(".cms-tool-hero");
    if (!tool || !hero || $("[data-cz-fav-toggle]", hero)) return;
    const profile = profileForTool(tool);
    const row = document.createElement("div");
    row.className = "cz-tool-memory-row";
    row.innerHTML = `
      <button class="cz-save-tool" type="button" data-cz-fav-toggle="${esc(tool.slug)}" aria-pressed="false">Save tool</button>
      <span>${esc(profile?.quickJob || "Fast tool")} - ${esc(profile?.timeSaved || "Stored only in this browser")}. No account.</span>`;
    hero.appendChild(row);
    syncFavoriteControls();
  }

  function addNextTools() {
    const tool = currentTool();
    if (!tool || $(".cz-next-tools")) return;
    if ($(".cms-related")) return;
    const profile = profileForTool(tool);
    const related = (tool.relatedTools || []).map(toolBySlug).filter(Boolean).slice(0, 4);
    if (!related.length) return;
    const panel = $(".cms-tool-panel") || $("main");
    if (!panel) return;
    const section = document.createElement("section");
    section.className = "cz-next-tools";
    section.setAttribute("aria-label", "Next tools");
    section.innerHTML = `
      <div class="cz-next-head">
        <p class="guide-kicker">NEXT TOOL</p>
        <h2>Keep the workflow moving.</h2>
        <span>After ${esc(profile?.quickJob || tool.title)}, these are the most useful next steps.</span>
      </div>
      <div class="cz-next-grid">
        ${related.map((item) => {
          const itemProfile = profileForTool(item);
          return `
          <a href="${item.url}">
            <strong>${esc(item.title)}</strong>
            <span>${esc(itemProfile?.problem || item.description)}</span>
            <em>${esc(itemProfile?.timeSaved || "Next useful step")}</em>
          </a>`;
        }).join("")}
      </div>`;
    panel.insertAdjacentElement("afterend", section);
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
        row[j - 1] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  function fuzzyScore(query, haystack) {
    const q = norm(query);
    const h = norm(haystack);
    if (!q) return 1;
    if (h.includes(q)) return 120 - h.indexOf(q);
    const qWords = q.split(/\s+/).filter(Boolean);
    const hWords = h.split(/\s+/).filter(Boolean);
    let score = 0;
    qWords.forEach((word) => {
      if (hWords.some((candidate) => candidate.startsWith(word))) score += 32;
      else if (hWords.some((candidate) => candidate.includes(word))) score += 22;
      else if (hWords.some((candidate) => Math.min(word.length, candidate.length) >= 4 && levenshtein(word, candidate) <= 2)) score += 14;
    });
    return score;
  }

  const commandFilters = [
    ["all", "All"],
    ["quick", "Quick Fix"],
    ["seo", "SEO"],
    ["content", "Content"],
    ["dev", "Dev"],
    ["cleanup", "Cleanup"],
    ["ai", "AI"],
    ["utility", "Utility"]
  ];
  const commandTabs = [
    ["recommended", "Best Matches"],
    ["recent", "Recent"],
    ["saved", "Favorites"],
    ["guides", "Guides"]
  ];
  const commandSuggestions = [
    ["fix json", "Fix JSON", "Format and validate"],
    ["clean text", "Clean text", "Remove paste noise"],
    ["seo snippet", "SEO snippet", "Title and meta"],
    ["youtube title", "YouTube title", "Upload ideas"],
    ["utm link", "UTM link", "Tracking URL"]
  ];
  let activeCommandFilter = "all";
  let activeCommandTab = "recommended";

  function categoryTitle(category) {
    const explicit = cms.clusters?.[category]?.title;
    if (explicit) return explicit.replace(/\s+Tools$/i, "");
    const fallback = { writing: "Content", socialai: "Creator", seo: "SEO", dev: "Developer", youtube: "YouTube", tracking: "Tracking", web: "Web" };
    return fallback[category] || "Clickoz";
  }

  function compactTags(values, limit = 3) {
    const seen = new Set();
    return values.map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter((value) => {
        const key = norm(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }

  function commandGlyph(item) {
    const text = norm(`${item.slug || ""} ${item.title || ""} ${item.category || ""} ${item.meta || ""}`);
    if (item.type === "premium") return "PRO";
    if (item.type === "guide") return "DOC";
    if (/json|base64|url|regex|html|entity|developer|payload|dev/.test(text)) return "{..}";
    if (/youtube|thumbnail|creator|upload|social|tiktok|instagram|linkedin/.test(text)) return "YT";
    if (/utm|tracking|campaign|link/.test(text)) return "UTM";
    if (/word|text|clean|readability|writing|copy|case|draft/.test(text)) return "TXT";
    if (/seo|serp|meta|snippet|slug|keyword/.test(text)) return "SEO";
    if (/web|dns|security|http|password|uuid|timestamp/.test(text)) return "WEB";
    return "CMD";
  }

  function commandKind(item) {
    if (item.type === "guide") return "Guide";
    if (item.type === "premium") return "Premium tool";
    if (item.type === "job") return "Quick task";
    return categoryTitle(item.category);
  }

  function commandCategoryForJob(job) {
    const text = norm(`${job.title} ${job.search} ${job.usedFor}`);
    if (/json|payload|developer|debug/.test(text)) return "dev";
    if (/youtube|creator|upload/.test(text)) return "youtube";
    if (/utm|tracking|campaign/.test(text)) return "tracking";
    if (/clean|text|draft/.test(text)) return "writing";
    return "seo";
  }

  const premiumCommandCatalog = [
    {
      slug: "multi-device-tester",
      title: "Multi Device Tester",
      url: "/premium/multi-device-tester/",
      category: "dev",
      description: "Test a public site across mobile, tablet and desktop viewports with direct or snapshot preview.",
      tags: ["Mobile-ready", "Website check", "Instant preview", "Workflow"],
      sampleInput: "https://google.com/",
      output: "Responsive preview or external-site snapshot",
      time: "Full workflow",
      usedFor: "Public site QA",
      search: "premium multi device tester mobile-ready website check instant preview responsive viewport external site google snapshot workflow"
    },
    {
      slug: "sitemap-viewer",
      title: "Site Map Pro",
      url: "/premium/sitemap-viewer/",
      category: "dev",
      description: "Load a public sitemap, map URL structure and search nodes in an interactive graph.",
      tags: ["SEO technical", "Crawl rules", "Website check", "Workflow"],
      sampleInput: "https://clickoz.com/sitemap.xml",
      output: "Sitemap graph with searchable URLs",
      time: "Full workflow",
      usedFor: "Technical SEO map",
      search: "premium sitemap viewer seo technical crawl rules website check sitemap xml graph search urls workflow"
    }
  ];

  function commandItems() {
    const tools = (cms.tools || []).map((tool) => {
      const profile = profileForTool(tool);
      const cluster = cms.clusters?.[tool.category] || {};
      const tags = compactTags([categoryTitle(tool.category), profile?.quickJob, ...(tool.features || [])]);
      return {
        type: "tool",
        title: tool.title,
        url: tool.url,
        slug: tool.slug,
        category: tool.category,
        description: profile?.problem || tool.description,
        meta: profile?.quickJob || cluster.title || "Tool",
        output: profile?.sampleOutput || "",
        time: profile?.timeSaved || "",
        sampleInput: profile?.sampleInput || "",
        usedFor: profile?.usedFor || cluster.title || "Browser tool",
        tags,
        icon: commandGlyph({ ...tool, type: "tool", meta: profile?.quickJob || "" }),
        search: profile?.search || `${tool.title} ${tool.description} ${(tool.features || []).join(" ")} ${tool.category}`
      };
    });
    const guides = (cms.guides || []).map((guide) => {
      const tool = guide.tool ? toolBySlug(guide.tool) : null;
      const category = guide.category || tool?.category || "";
      return {
        type: "guide",
        title: guide.title,
        url: guide.url,
        slug: guide.slug,
        category,
        description: guide.description,
        meta: "Decision guide",
        output: "Readable decision path",
        time: "Read when needed",
        sampleInput: "Problem or tool decision",
        usedFor: categoryTitle(category),
        tags: compactTags([categoryTitle(category), tool?.title, "Guide"]),
        icon: commandGlyph({ ...guide, type: "guide", category }),
        search: `${guide.title} ${guide.description} ${guide.category || ""} ${tool?.title || ""}`
      };
    });
    const premiumTools = premiumCommandCatalog.map((tool) => ({
      type: "premium",
      title: tool.title,
      url: tool.url,
      slug: tool.slug,
      category: tool.category,
      description: tool.description,
      meta: "Premium workflow",
      output: tool.output,
      time: tool.time,
      sampleInput: tool.sampleInput,
      usedFor: tool.usedFor,
      tags: compactTags(tool.tags, 4),
      icon: commandGlyph({ ...tool, type: "premium" }),
      search: `${tool.title} ${tool.description} ${(tool.tags || []).join(" ")} ${tool.search}`
    }));
    const jobs = jobCatalog.map((job) => {
      const category = commandCategoryForJob(job);
      return {
        type: "job",
        title: job.title,
        url: job.url,
        slug: job.id,
        category,
        description: job.description,
        meta: job.meta,
        output: job.sampleOutput,
        time: job.timeSaved,
        sampleInput: job.sampleInput,
        usedFor: job.usedFor,
        tags: compactTags([categoryTitle(category), job.usedFor, job.meta]),
        icon: commandGlyph({ ...job, type: "job", category }),
        search: `${job.title} ${job.description} ${job.sampleInput} ${job.sampleOutput} ${job.usedFor} ${job.search}`
      };
    });
    return [...jobs, ...guides, ...premiumTools, ...tools];
  }

  function commandFilterMatches(item, filter) {
    if (!filter || filter === "all") return true;
    if (filter === item.category) return true;
    if (filter === "content" && item.category === "writing") return true;
    if (filter === "ai" && item.category === "socialai") return true;
    if (filter === "utility" && /^(web|tracking)$/.test(item.category || "")) return true;
    const text = norm(`${item.type} ${item.title} ${item.category} ${item.meta} ${item.description} ${(item.tags || []).join(" ")} ${item.search}`);
    if (filter === "quick") return item.type === "job" || /quick|fix|broken|clean|snippet|upload|tracking|repair/.test(text);
    if (filter === "seo") return /seo|serp|meta|snippet|slug|keyword|search/.test(text);
    if (filter === "content") return /content|writing|text|copy|youtube|creator|social|caption|draft|title/.test(text);
    if (filter === "dev") return /dev|developer|json|payload|url|base64|regex|html|entity|debug/.test(text);
    if (filter === "cleanup") return /cleanup|clean|format|readability|counter|space|case|minify/.test(text);
    if (filter === "ai") return /ai|prompt|hook|creator|social/.test(text);
    if (filter === "utility") return /utility|web|tracking|utm|dns|http|password|uuid|timestamp|security/.test(text);
    return true;
  }

  function commandPriority(item) {
    if (item.type === "job") return 4;
    if (item.type === "guide") return 3;
    if (item.type === "premium") return 2;
    if (item.type === "tool") return 1;
    return 0;
  }

  function commandFavoriteSlug(item) {
    if (!item) return "";
    if (item.type === "tool") return item.slug || "";
    if (item.type === "job") {
      const tool = (cms.tools || []).find((entry) => entry.url === item.url);
      return tool?.slug || "";
    }
    return "";
  }

  function commandSearchScore(query, item) {
    const q = norm(query);
    if (!q) return 1;
    const title = norm(item.title);
    const words = q.split(/\s+/).filter(Boolean);
    let score = fuzzyScore(q, item.search);
    let matched = score > 0;
    if (title === q) {
      score += 120;
      matched = true;
    } else if (title.includes(q)) {
      score += 90;
      matched = true;
    } else if (words.length && words.every((word) => title.includes(word))) {
      score += 60;
      matched = true;
    }
    if (!matched) return 0;
    if (item.type === "job") score += 80;
    else if (item.type === "guide") score += 70;
    else if (item.type === "premium") score += 56;
    else if (item.type === "tool") score += 35;
    return score;
  }

  function itemsForActiveTab(items) {
    if (activeCommandTab === "saved") return items.filter((item) => item.type === "tool" && isFavorite(item.slug));
    if (activeCommandTab === "guides") return items.filter((item) => item.type === "guide");
    if (activeCommandTab === "recent") {
      const order = new Map(readList(storage.recent).map((slug, index) => [slug, index]));
      return items
        .filter((item) => item.type === "tool" && order.has(item.slug))
        .sort((a, b) => order.get(a.slug) - order.get(b.slug));
    }
    return items;
  }

  function updateCommandControlState(shell) {
    $$("[data-command-filter]", shell).forEach((button) => {
      const active = button.getAttribute("data-command-filter") === activeCommandFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $$("[data-command-tab]", shell).forEach((button) => {
      const active = button.getAttribute("data-command-tab") === activeCommandTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function ensurePalette() {
    let shell = $("#czCommandPalette");
    if (shell) return shell;
    shell = document.createElement("div");
    shell.className = "cz-command-palette";
    shell.id = "czCommandPalette";
    shell.hidden = true;
    shell.innerHTML = `
      <div class="cz-command-backdrop" data-command-close></div>
      <div class="cz-command-dialog cz-command-desk" role="dialog" aria-modal="true" aria-label="Clickoz advanced search">
        <aside class="cz-command-sidebar" aria-label="Command desk navigation">
          <a class="cz-command-brand" href="/" aria-label="Clickoz home"><span>C</span><strong>CLICKOZ</strong></a>
          <div class="cz-command-side-group">
            <p>Command desk</p>
            <a href="/">Dashboard</a>
            <button type="button" class="is-active" data-command-tab="recommended">Fix & Tools</button>
            <a href="/tools/">Workflows</a>
            <button type="button" data-command-tab="recent">History</button>
            <button type="button" data-command-tab="saved">Favorites</button>
            <button type="button" data-command-tab="guides">Guides</button>
          </div>
          <div class="cz-command-side-group">
            <p>Tool collections</p>
            <div id="czCommandCollections"></div>
          </div>
          <div class="cz-command-side-group cz-command-memory-group">
            <p>Fast access</p>
            <div class="cz-command-memory" id="czCommandMemory"></div>
          </div>
          <div class="cz-command-local-card">
            <strong>Browser workspace</strong>
            <span>No account, local recents and saved tools in this browser.</span>
          </div>
        </aside>
        <main class="cz-command-main">
          <div class="cz-command-topbar">
            <label class="cz-command-search" for="czCommandInput">
              <span>Command bar</span>
              <div>
                <input id="czCommandInput" type="search" placeholder="Try: broken JSON, clean text, YouTube title, SEO snippet..." autocomplete="off" aria-controls="czCommandResults" />
                <kbd>Ctrl</kbd><kbd>K</kbd>
              </div>
            </label>
            <div class="cz-command-actions">
              <button type="button" class="cz-command-return" data-command-close>Back to site</button>
              <a class="cz-command-launch" href="/tools/">Launch Workflow</a>
              <button type="button" class="cz-command-close-icon" data-command-close aria-label="Close command palette">Close</button>
            </div>
          </div>
          <section class="cz-command-hero">
            <span>What do you need to fix?</span>
            <h2>Solve it. Optimize it. <span>Ship it.</span></h2>
            <p>Smart tools. Fast results. Zero friction.</p>
          </section>
          <div class="cz-command-quick-picks" aria-label="Quick search suggestions">
            ${commandSuggestions.map(([query, label, meta]) => `<button type="button" data-command-query-pick="${esc(query)}"><span>${esc(label)}</span><em>${esc(meta)}</em></button>`).join("")}
          </div>
          <div class="cz-command-filter-row" id="czCommandFilters">
            ${commandFilters.map(([id, label]) => `<button type="button" data-command-filter="${esc(id)}" aria-pressed="${id === activeCommandFilter ? "true" : "false"}">${esc(label)}</button>`).join("")}
          </div>
          <section class="cz-command-mobile-task" id="czCommandMobileTask" aria-live="polite"></section>
          <section class="cz-command-results-shell">
            <div class="cz-command-result-head">
              <div class="cz-command-tabs" id="czCommandTabs">
                ${commandTabs.map(([id, label]) => `<button type="button" data-command-tab="${esc(id)}" aria-pressed="${id === activeCommandTab ? "true" : "false"}">${esc(label)}</button>`).join("")}
              </div>
              <span id="czCommandResultCount">Ready</span>
            </div>
            <div class="cz-command-results" id="czCommandResults" role="listbox"></div>
          </section>
        </main>
        <aside class="cz-command-detail" id="czCommandDetail" aria-live="polite"></aside>
        <footer class="cz-command-status">
          <span><strong>No account required</strong><em>Start instantly</em></span>
          <span><strong>100% free tools</strong><em>Always will be</em></span>
          <span><strong>Privacy first</strong><em>Everything local</em></span>
          <span><strong>Blazing fast</strong><em>Built for speed</em></span>
          <a href="/contact/#request">Request a tool</a>
        </footer>
      </div>`;
    document.body.appendChild(shell);
    return shell;
  }

  function renderCommandMemory() {
    const shell = ensurePalette();
    const memoryTarget = $("#czCommandMemory", shell);
    const collectionsTarget = $("#czCommandCollections", shell);
    const recent = readList(storage.recent).map(toolBySlug).filter(Boolean).slice(0, 3);
    const favorites = readList(storage.favorites).map(toolBySlug).filter(Boolean).slice(0, 3);
    const quickItems = [
      ...favorites.map((tool) => ({ label: "Saved", tool })),
      ...recent.map((tool) => ({ label: "Recent", tool }))
    ].slice(0, 5);

    if (memoryTarget) {
      memoryTarget.innerHTML = quickItems.length ? quickItems.map(({ label, tool }) => `
        <a href="${tool.url}"><span>${esc(label)}</span><strong>${esc(tool.title)}</strong></a>
      `).join("") : `<div class="cz-command-hint">Type a task like "snippet", "json", "youtube" or "clean text".</div>`;
    }

    if (collectionsTarget) {
      const counts = new Map();
      (cms.tools || []).forEach((tool) => counts.set(tool.category, (counts.get(tool.category) || 0) + 1));
      collectionsTarget.innerHTML = Object.entries(cms.clusters || {}).slice(0, 6).map(([key, cluster]) => `
        <button type="button" data-command-filter="${esc(key === "writing" ? "content" : key === "socialai" ? "ai" : key)}">
          <span>${esc(cluster.title.replace(/\s+Tools$/i, ""))}</span><em>${counts.get(key) || 0}</em>
        </button>
      `).join("");
    }
  }

  let selectedIndex = 0;
  let lastResults = [];

  function commandHowSteps(item) {
    if (!item) return [];
    if (item.type === "guide") return ["Open the decision guide", "Use the connected tool", "Apply the cleaner workflow"];
    return [
      item.sampleInput ? `Start with: ${item.sampleInput}` : "Paste the input",
      item.output ? `Get: ${item.output}` : "Generate a clean result",
      item.time || "Copy or continue instantly"
    ];
  }

  function renderCommandMobileTask(item) {
    const shell = ensurePalette();
    const target = $("#czCommandMobileTask", shell);
    if (!target) return;
    if (!item) {
      target.hidden = true;
      target.innerHTML = "";
      return;
    }
    const favoriteSlug = commandFavoriteSlug(item);
    const primaryLabel = item.type === "guide" ? "Open Guide" : "Open Tool";
    target.hidden = false;
    target.innerHTML = `
      <div class="cz-command-mobile-task-card">
        <div class="cz-command-mobile-task-head">
          <span>${esc(commandKind(item))}</span>
          <em>${esc(item.time || "Instant")}</em>
        </div>
        <a class="cz-command-mobile-task-main" href="${item.url}">
          <span class="cz-command-mobile-task-icon">${esc(item.icon || commandGlyph(item))}</span>
          <span>
            <strong>${esc(item.title)}</strong>
            <em>${esc(item.description)}</em>
          </span>
        </a>
        <div class="cz-command-mobile-task-actions">
          <a href="${item.url}">${primaryLabel}</a>
          ${favoriteSlug ? `<button type="button" data-cz-fav-toggle="${esc(favoriteSlug)}" data-cz-fav-style="icon" aria-pressed="false">☆</button>` : ""}
        </div>
      </div>`;
  }

  function renderCommandDetail(item) {
    const shell = ensurePalette();
    const target = $("#czCommandDetail", shell);
    renderCommandMobileTask(item);
    if (!target) return;
    if (!item) {
      target.innerHTML = `<div class="cz-command-detail-card"><p>No command selected yet.</p></div>`;
      return;
    }
    const recents = readList(storage.recent).map(toolBySlug).filter(Boolean).slice(0, 3);
    const favoriteSlug = commandFavoriteSlug(item);
    const primaryLabel = item.type === "guide" ? "Open Guide" : "Open Tool";
    target.innerHTML = `
      <div class="cz-command-detail-card">
        <span class="cz-command-detail-kicker">${esc(commandKind(item))}</span>
        <div class="cz-command-detail-title">
          <span>${esc(item.icon || commandGlyph(item))}</span>
          <h3>${esc(item.title)}</h3>
        </div>
        <p>${esc(item.description)}</p>
        <dl>
          <div><dt>Category</dt><dd>${esc(categoryTitle(item.category))}</dd></div>
          <div><dt>Speed</dt><dd>${esc(item.time || "Instant")}</dd></div>
          <div><dt>Use</dt><dd>${esc(item.usedFor || commandKind(item))}</dd></div>
        </dl>
        <a class="cz-command-primary" href="${item.url}">${primaryLabel}</a>
        ${favoriteSlug ? `<button class="cz-command-secondary" type="button" data-cz-fav-toggle="${esc(favoriteSlug)}" data-cz-fav-style="detail" aria-pressed="false">Add to Favorites</button>` : ""}
        <div class="cz-command-how">
          <strong>How it works</strong>
          ${commandHowSteps(item).map((step, index) => `<span><em>${index + 1}</em>${esc(step)}</span>`).join("")}
        </div>
        <div class="cz-command-recent">
          <strong>Recent tools</strong>
          ${recents.length ? recents.map((tool) => `<a href="${tool.url}"><span>${esc(tool.title)}</span><em>Local browser</em></a>`).join("") : `<p>No recent tools yet.</p>`}
        </div>
      </div>`;
    syncFavoriteControls();
  }

  function updateSelectedCommand() {
    const shell = ensurePalette();
    $$("[data-command-index]", shell).forEach((row) => {
      const active = Number(row.getAttribute("data-command-index")) === selectedIndex;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-selected", String(active));
    });
    renderCommandDetail(lastResults[selectedIndex] || null);
  }

  function renderCommandResults(query = "") {
    const shell = ensurePalette();
    const target = $("#czCommandResults", shell);
    if (!target) return;
    updateCommandControlState(shell);
    const q = String(query || "").trim();
    const scoredItems = itemsForActiveTab(commandItems())
      .filter((item) => commandFilterMatches(item, activeCommandFilter))
      .map((item, index) => ({ item, index, score: commandSearchScore(q, item) }))
      .filter((entry) => !q || entry.score > 0)
      .sort((a, b) => (q ? b.score - a.score : 0) || commandPriority(b.item) - commandPriority(a.item) || a.index - b.index);
    const items = scoredItems
      .slice(0, 12)
      .map((entry) => entry.item);
    const countTarget = $("#czCommandResultCount", shell);
    if (countTarget) {
      const total = scoredItems.length;
      const tabLabel = commandTabs.find(([id]) => id === activeCommandTab)?.[1] || "matches";
      countTarget.textContent = q
        ? `${total} ${total === 1 ? "match" : "matches"} for "${q}"`
        : `${items.length} ${tabLabel.toLowerCase()}`;
    }
    lastResults = items;
    selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
    target.innerHTML = items.length ? items.map((item, index) => {
      const tags = (item.tags || []).slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join("");
      const favoriteSlug = commandFavoriteSlug(item);
      return `
        <div class="cz-command-result-row ${index === selectedIndex ? "is-active" : ""}" role="option" aria-selected="${index === selectedIndex ? "true" : "false"}" data-command-index="${index}">
          <a class="cz-command-result-main" href="${item.url}">
            <span class="cz-command-item-icon">${esc(item.icon || commandGlyph(item))}</span>
            <span class="cz-command-item-copy">
              <strong>${esc(item.title)}</strong>
              <em>${esc(item.description)}</em>
              <span class="cz-command-tags">${tags}</span>
            </span>
          </a>
          <span class="cz-command-item-time">${esc(item.time || "Instant")}</span>
          <a class="cz-command-open-btn" href="${item.url}">${item.type === "guide" ? "Open Guide" : "Open Tool"}</a>
          ${favoriteSlug ? `<button class="cz-command-favorite" type="button" data-cz-fav-toggle="${esc(favoriteSlug)}" data-cz-fav-style="icon" aria-pressed="false">☆</button>` : `<span class="cz-command-favorite is-static">DOC</span>`}
        </div>`;
    }).join("") : `<div class="cz-command-empty">No exact match. Try "seo", "json", "youtube", "clean text" or "utm".</div>`;
    updateSelectedCommand();
    syncFavoriteControls();
  }

  function openPalette(query = "") {
    const shell = ensurePalette();
    shell.hidden = false;
    document.documentElement.classList.add("cz-command-open");
    renderCommandMemory();
    selectedIndex = 0;
    renderCommandResults(query);
    const input = $("#czCommandInput", shell);
    if (input) {
      input.value = query;
      window.setTimeout(() => input.focus(), 20);
    }
  }

  function closePalette() {
    const shell = ensurePalette();
    shell.hidden = true;
    document.documentElement.classList.remove("cz-command-open");
  }

  function bindPalette() {
    let commandBurstTimes = [];
    let commandBurstReset = 0;

    function shouldTrackCommandBurst(event) {
      if (!ensurePalette().hidden) return false;
      if (event.defaultPrevented || (event.button != null && event.button !== 0)) return false;
      if (event.ctrlKey || event.metaKey || event.altKey) return false;
      const target = event.target;
      if (!target) return false;
      if (target.closest("input, textarea, select, option, [contenteditable='true'], .cookie, .cz-command-palette, #google_translate_element, #google_translate_element_mobile")) return false;
      if (target.closest(".menu") && !target.closest(".m-menu")) return false;
      return true;
    }

    function trackCommandBurst(event) {
      if (!shouldTrackCommandBurst(event)) return;
      const now = Date.now();
      commandBurstTimes = commandBurstTimes.filter((time) => now - time < 1600);
      commandBurstTimes.push(now);
      document.documentElement.dataset.commandBurst = String(commandBurstTimes.length);
      window.clearTimeout(commandBurstReset);
      commandBurstReset = window.setTimeout(() => {
        commandBurstTimes = [];
        delete document.documentElement.dataset.commandBurst;
      }, 1650);
      if (commandBurstTimes.length >= 5) {
        commandBurstTimes = [];
        delete document.documentElement.dataset.commandBurst;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        openPalette("");
      }
    }

    document.addEventListener("keydown", (event) => {
      const commandActivator = event.target.closest?.("[data-open-command]");
      if (commandActivator && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openPalette(commandActivator.getAttribute("data-command-query") || "");
        return;
      }
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.key === "Escape" && !ensurePalette().hidden) closePalette();
    });

    document.addEventListener("click", trackCommandBurst, { capture: true });

    document.addEventListener("click", (event) => {
      const commandTrigger = event.target.closest("[data-open-command]");
      if (commandTrigger) {
        event.preventDefault();
        openPalette(commandTrigger.getAttribute("data-command-query") || "");
        return;
      }
      const commandPick = event.target.closest("[data-command-query-pick]");
      if (commandPick && commandPick.closest(".cz-command-palette")) {
        event.preventDefault();
        activeCommandTab = "recommended";
        selectedIndex = 0;
        const input = $("#czCommandInput", ensurePalette());
        const query = commandPick.getAttribute("data-command-query-pick") || "";
        if (input) {
          input.value = query;
          input.focus({ preventScroll: true });
        }
        renderCommandResults(query);
        return;
      }
      const commandFilter = event.target.closest("[data-command-filter]");
      if (commandFilter && commandFilter.closest(".cz-command-palette")) {
        event.preventDefault();
        const nextFilter = commandFilter.getAttribute("data-command-filter") || "all";
        activeCommandFilter = nextFilter;
        selectedIndex = 0;
        const input = $("#czCommandInput", ensurePalette());
        renderCommandResults(input?.value || "");
        return;
      }
      const commandTab = event.target.closest("[data-command-tab]");
      if (commandTab && commandTab.closest(".cz-command-palette")) {
        event.preventDefault();
        activeCommandTab = commandTab.getAttribute("data-command-tab") || "recommended";
        selectedIndex = 0;
        const input = $("#czCommandInput", ensurePalette());
        renderCommandResults(input?.value || "");
        return;
      }
      if (event.target.closest("[data-command-close]")) closePalette();
      const fav = event.target.closest("[data-cz-fav-toggle]");
      if (fav) {
        event.preventDefault();
        const slug = fav.getAttribute("data-cz-fav-toggle");
        setFavorite(slug, !isFavorite(slug));
        renderCommandMemory();
        const input = $("#czCommandInput", ensurePalette());
        renderCommandResults(input?.value || "");
        return;
      }
    });

    document.addEventListener("clickoz:open-command", (event) => {
      openPalette(compactEventQuery(event));
    });

    const shell = ensurePalette();
    const input = $("#czCommandInput", shell);
    input?.addEventListener("input", () => {
      selectedIndex = 0;
      renderCommandResults(input.value);
    });
    input?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedIndex = Math.min(lastResults.length - 1, selectedIndex + 1);
        updateSelectedCommand();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = Math.max(0, selectedIndex - 1);
        updateSelectedCommand();
      } else if (event.key === "Enter" && lastResults[selectedIndex]) {
        event.preventDefault();
        window.location.href = lastResults[selectedIndex].url;
      }
    });
    const results = $("#czCommandResults", shell);
    results?.addEventListener("pointerover", (event) => {
      const row = event.target.closest("[data-command-index]");
      if (!row) return;
      const index = Number(row.getAttribute("data-command-index"));
      if (!Number.isFinite(index) || index === selectedIndex) return;
      selectedIndex = index;
      updateSelectedCommand();
    });
  }

  function compactEventQuery(event) {
    return String(event?.detail?.query || "").replace(/\s+/g, " ").trim();
  }

  function enhanceToolsSearch() {
    const input = $("#toolsSearch");
    if (!input || $(".cz-tools-search-hint")) return;
    input.setAttribute("placeholder", "Try: Broken JSON, clean text, YouTube title, SEO snippet");
    const hint = document.createElement("button");
    hint.type = "button";
    hint.className = "cz-tools-search-hint";
    hint.setAttribute("data-open-command", "");
    hint.setAttribute("data-command-query", "");
    hint.setAttribute("aria-label", "Open Advanced Search with Ctrl K or five quick taps");
    hint.innerHTML = `Advanced Search <span class="command-shortcut">press <kbd>Ctrl</kbd> + <kbd>K</kbd></span> <span class="command-burst">or tap/click 5 times quickly anywhere</span>`;
    const title = $(".tools-hero .tools-title");
    if (title) title.insertAdjacentElement("afterend", hint);
    else input.insertAdjacentElement("afterend", hint);
  }

  function currentDockSection() {
    const path = window.location.pathname || "/";
    if (path === "/" || path === "/index.html") return "home";
    if (path.startsWith("/tools/") || path === "/tools/") return "tools";
    if (path.startsWith("/guides/") || path === "/guides/") return "guides";
    return "more";
  }

  function ensureAppDock() {
    $$(".cz-app-dock").forEach((dock) => dock.remove());
    document.documentElement.classList.remove("cz-app-dock-ready");
  }

  function init() {
    rememberCurrentTool();
    addFavoriteControl();
    addNextTools();
    initToolCardQuickTasks();
    bindPalette();
    enhanceToolsSearch();
    ensureAppDock();
    syncFavoriteControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
/* =========================================================
   Clickoz — guide.js
   SAFE MODE:
   - Runs ONLY on /guides/
   - Adds minimal behavior (TOC active, copy, smooth scroll, progress)
   - Does NOT touch site-wide components
   ========================================================= */

(() => {
  "use strict";

  const isGuidePath = () => {
    const p = window.location.pathname || "";
    return p.includes("/guides/");
  };

  if (!isGuidePath()) return;

  // Guide interaction is now handled by /assets/guide-premium.js.
  // Keeping this legacy block active caused duplicate scroll/progress work on long guide pages.
  document.documentElement.classList.add("is-guide");
  document.body.classList.add("page-guide");
  return;

  document.documentElement.classList.add("is-guide");
  document.body.classList.add("page-guide");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const HEADER_OFFSET = 78; // safe approximate for sticky header on Clickoz
  const ACTIVE_ATTR = "aria-current";

  /* ---------- Toast ---------- */
  const toastEl = $(".toast");
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.setAttribute("data-show", "true");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.removeAttribute("data-show"), 1200);
  };

  /* ---------- Reading Progress ---------- */
  const progressBar = $(".readingbar i");
  const updateProgress = () => {
    if (!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  /* ---------- Smooth scroll for hash links ---------- */
  const smoothScrollTo = (el) => {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const bindSmoothAnchors = () => {
    $$('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        smoothScrollTo(target);
        history.pushState(null, "", `#${id}`);
      });
    });
  };

  /* ---------- Code blocks: wrap + copy buttons (guide-only) ---------- */
  const wrapCodeBlocks = () => {
    // Only inside main/article-ish areas to avoid picking up nav/footer snippets
    const scope = $("main") || document.body;

    const pres = $$("pre", scope).filter((pre) => pre.querySelector("code"));
    pres.forEach((pre) => {
      // Skip if already wrapped
      const parent = pre.parentElement;
      if (!parent) return;
      if (parent.classList && parent.classList.contains("codeblock")) return;

      const code = pre.querySelector("code");
      if (!code) return;

      const wrapper = document.createElement("div");
      wrapper.className = "codeblock";

      const head = document.createElement("div");
      head.className = "codeblock__head";

      const label = document.createElement("span");
      label.textContent = "Code";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-copy", "true");
      btn.textContent = "Copy";

      head.appendChild(label);
      head.appendChild(btn);

      parent.insertBefore(wrapper, pre);
      wrapper.appendChild(head);
      wrapper.appendChild(pre);
    });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch (__) {
        return false;
      }
    }
  };

  const bindCopyButtons = () => {
    $$(".codeblock [data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const wrap = btn.closest(".codeblock");
        const pre = wrap ? $("pre", wrap) : null;
        const code = pre ? pre.innerText || pre.textContent || "" : "";
        const ok = await copyText(code);

        if (ok) {
          const old = btn.textContent;
          btn.textContent = "Copied";
          toast("Copied to clipboard");
          setTimeout(() => (btn.textContent = old || "Copy"), 900);
        } else {
          toast("Copy failed");
        }
      });
    });
  };

  /* ---------- TOC: build from h2[id] ---------- */
  const buildTOC = () => {
    const toc = $(".guide-toc");
    if (!toc) return;

    // If toc already has links, don’t rebuild (just bind observers)
    const existing = $$('a[href^="#"]', toc);
    if (existing.length) return;

    const headings = $$("h2[id]").filter((h) => h.id && h.textContent.trim().length > 0);
    if (!headings.length) return;

    const title = document.createElement("h3");
    title.textContent = "On this page";

    const list = document.createElement("ol");

    headings.forEach((h) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      list.appendChild(li);
    });

    toc.appendChild(title);
    toc.appendChild(list);
  };

  const bindTOCActive = () => {
    const toc = $(".guide-toc");
    if (!toc) return;

    const links = $$('a[href^="#"]', toc);
    if (!links.length) return;

    const ids = links.map((a) => (a.getAttribute("href") || "").slice(1)).filter(Boolean);
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return;

    const clear = () => links.forEach((a) => a.removeAttribute(ACTIVE_ATTR));
    const setActive = (id) => {
      const a = links.find((x) => x.getAttribute("href") === `#${id}`);
      if (!a) return;
      clear();
      a.setAttribute(ACTIVE_ATTR, "true");
    };

    let last = targets[0].id;
    setActive(last);

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          last = visible[0].target.id || last;
          setActive(last);
        }
      },
      { root: null, rootMargin: `-${HEADER_OFFSET + 10}px 0px -70% 0px`, threshold: [0, 1] }
    );

    targets.forEach((t) => io.observe(t));
  };

  /* ---------- Initial hash handling (avoid header overlap) ---------- */
  const fixInitialHash = () => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    setTimeout(() => smoothScrollTo(el), 50);
  };

  /* ---------- Init ---------- */
  const init = () => {
    // features are additive and safe
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    wrapCodeBlocks();
    bindCopyButtons();

    buildTOC();
    bindTOCActive();

    bindSmoothAnchors();
    fixInitialHash();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/* =========================================================
   PATCH — Disable scroll bursts (keep idle floating particles)
   Paste at END of /assets/site.js
========================================================= */
(() => {
  return;
  try{
    // If your existing code uses a function like createBurst / burst / spawnBurst,
    // this neutralizes it if it's attached on window.
    const noop = () => {};

    // Common names (safe to set if they exist, harmless if not)
    if (typeof window.createBurst === "function") window.createBurst = noop;
    if (typeof window.spawnBurst  === "function") window.spawnBurst  = noop;
    if (typeof window.burst       === "function") window.burst       = noop;

    // Also kill any burst-on-scroll listener pattern by capturing + stopping.
    // This doesn't affect normal scrolling; it just blocks “burst trigger” handlers
    // that rely on scroll events (common in your effect).
    let last = 0;
    window.addEventListener("scroll", (e) => {
      // If something fires too often (your burst bug), we stop propagation early.
      // Keep this extremely light: only blocks event propagation; no layout reads.
      const now = performance.now();
      if (now - last < 40) { // 25fps throttle for safety
        e.stopImmediatePropagation?.();
      }
      last = now;
    }, { capture: true, passive: true });
  } catch(_) {}
})();
/* =========================================================
   PATCH 2026-02 — Kill any burst on scroll (DOM + Canvas safe)
   Paste at the VERY END of /assets/site.js
========================================================= */
(() => {
  return;
  try {
    // 1) Kill known burst spawners if present
    const noop = () => {};
    ["createBurst","spawnBurst","burst","emitBurst","particleBurst","spawnExplosion"].forEach((k)=>{
      if (typeof window[k] === "function") window[k] = noop;
    });

    // 2) If the effect is implemented as DOM nodes .pburst: remove them immediately
    const killBursts = () => {
      const root = document.getElementById("clickozParticles");
      if (!root) return;
      root.querySelectorAll(".pburst").forEach(n => n.remove());
    };
    killBursts();
    new MutationObserver(killBursts).observe(document.body, { childList:true, subtree:true });

    // 3) Canvas “center flash” is usually triggered on scroll direction change.
    //    We can safely block ONLY handlers that call preventDefault/stopImmediatePropagation? Not reliable.
    //    Better: intercept rAF loops by freezing common anim toggles.
    //    If your canvas code uses window.__spaceParticlesRunning or similar, stop it.
    //    Fallback: clear the canvas once on direction changes so bursts don't accumulate.
    const canvas = document.getElementById("spaceParticles");
    const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;

    let lastY = window.scrollY || 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;
      const goingUp = y < lastY;
      lastY = y;

      // When user goes up, that's when your "center burst" likely happens.
      // Clear once to remove the pop, without disabling the whole starfield.
      if (goingUp && ctx) {
        // match current size (your script likely sets it; we respect it)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, { passive: true });

  } catch (e) {
    // silent
  }
})();
/* =========================================================
   PATCH 2026-02 — Remove #spaceParticles canvas completely
   Paste at the VERY END of /assets/site.js
   ========================================================= */
(() => {
  return;
  const kill = () => {
    const c = document.getElementById("spaceParticles");
    if (!c) return;

    try {
      // If some script attached a context, clear once (harmless)
      const ctx = c.getContext && c.getContext("2d");
      if (ctx && c.width && c.height) ctx.clearRect(0, 0, c.width, c.height);
    } catch(_) {}

    // Remove from DOM
    try { c.remove(); } catch(_) { c.parentNode && c.parentNode.removeChild(c); }
  };

  // Kill immediately if already parsed
  kill();

  // Kill after DOM is ready (covers cases where scripts insert/recreate it)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kill, { once: true });
  } else {
    queueMicrotask(kill);
  }

  // Safety net: if anything re-inserts it, remove again
  try {
    const mo = new MutationObserver(() => kill());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch(_) {}
})();
/* =========================================================
   PATCH 2026-02 (FORTE) — Remove #spaceParticles from DOM
   INCOLLA ALLA FINE di /assets/site.js
   ========================================================= */
(() => {
  return;
  function killCanvas(){
    const c = document.getElementById("spaceParticles");
    if (!c) return;
    try { c.remove(); } catch (e) { c.parentNode && c.parentNode.removeChild(c); }
  }

  // run now + after DOM ready
  killCanvas();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", killCanvas, { once: true });
  } else {
    queueMicrotask(killCanvas);
  }

  // If something re-adds it, remove again
  try {
    const mo = new MutationObserver(() => killCanvas());
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch(e) {}
})();

/* Interactive CMS neural map for the Updates hero. */
(() => {
  function initCmsNeuralMap(){
    const shell = document.querySelector(".neural-map-shell");
    const canvas = document.getElementById("cmsNeuralMap");
    if (!shell || !canvas || canvas.dataset.ready === "1") return;
    canvas.dataset.ready = "1";

    const ctx = canvas.getContext("2d");
    const tip = document.getElementById("cmsNeuralTip");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia && window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    const liveAnimate = !reduce && !coarse;
    const DPR = coarse ? 1 : Math.min(2, window.devicePixelRatio || 1);
    let lastManualDraw = 0;

    const folders = [
      { id:"root", label:"Clickoz", sub:"CMS core", type:"core", x:0, y:0, r:48 },
      { id:"tools", label:"/tools", sub:"66 pages", type:"folder", x:-260, y:-120, r:34, files:["cms-tools.js","tool pages","examples","results"] },
      { id:"guides", label:"/guides", sub:"41 workflows", type:"folder", x:-260, y:118, r:34, files:["guide-premium.js","HowTo schema","FAQ schema","internal links"] },
      { id:"assets", label:"/assets", sub:"design system", type:"folder", x:230, y:-132, r:34, files:["cms-final.css","site.css","site.js","favicon.svg"] },
      { id:"seo", label:"SEO", sub:"index layer", type:"folder", x:260, y:108, r:34, files:["sitemap.xml","robots.txt","canonicals","OG data"] },
      { id:"updates", label:"/updates", sub:"release log", type:"folder", x:0, y:-188, r:30, files:["release cards","quality board","roadmap","feedback"] },
      { id:"legal", label:"/legal", sub:"trust pages", type:"folder", x:0, y:188, r:30, files:["privacy","terms","contact","404"] }
    ];

    const edges = [
      ["root","tools"],["root","guides"],["root","assets"],["root","seo"],["root","updates"],["root","legal"],
      ["tools","guides"],["tools","seo"],["guides","seo"],["assets","tools"],["assets","guides"],["updates","tools"],["updates","guides"]
    ];

    let size = { w: 0, h: 0 };
    let zoom = 1;
    let pan = { x: 0, y: 0 };
    let hover = null;
    let focus = null;
    let dragging = false;
    let moved = false;
    let last = { x: 0, y: 0 };
    let userAdjusted = false;

    function requestStaticDraw(){
      if (liveAnimate) return;
      const now = performance.now();
      if (now - lastManualDraw < 48) return;
      lastManualDraw = now;
      draw(now);
    }

    function accent(){
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "34,211,238";
      return raw.split(",").map(v => Math.max(0, Math.min(255, Number(v.trim()) || 0)));
    }

    function rgba(a, alpha){
      return `rgba(${a[0]},${a[1]},${a[2]},${alpha})`;
    }

    function fittedZoom(){
      return Math.max(.64, Math.min(.96, size.w / 680, size.h / 500));
    }

    function centerMap(node = focus){
      const target = node && node.type !== "file" ? node : { x: 0, y: 0 };
      pan.x = size.w / 2 - target.x * zoom;
      pan.y = size.h / 2 - target.y * zoom;
    }

    function resize(){
      const rect = shell.getBoundingClientRect();
      size.w = Math.max(320, rect.width);
      size.h = Math.max(240, rect.height);
      canvas.width = Math.round(size.w * DPR);
      canvas.height = Math.round(size.h * DPR);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!userAdjusted || coarse) zoom = fittedZoom();
      centerMap();
    }

    function worldToScreen(n){
      return { x: pan.x + n.x * zoom, y: pan.y + n.y * zoom };
    }

    function screenToWorld(x, y){
      return { x: (x - pan.x) / zoom, y: (y - pan.y) / zoom };
    }

    function fileNodes(folder){
      const files = folder.files || [];
      const spread = Math.min(110, 50 + files.length * 12);
      return files.map((label, i) => {
        const angle = (-90 + (i - (files.length - 1) / 2) * 34) * Math.PI / 180;
        return {
          id: `${folder.id}-${i}`,
          label,
          type: "file",
          parent: folder.id,
          x: folder.x + Math.cos(angle) * spread,
          y: folder.y + Math.sin(angle) * spread,
          r: 16
        };
      });
    }

    function visibleNodes(){
      const showFiles = zoom > 1.22 || !!focus;
      const files = showFiles
        ? folders.filter(f => f.files && (!focus || focus.id === f.id)).flatMap(fileNodes)
        : [];
      return folders.concat(files);
    }

    function getNodeById(id){
      return folders.find(n => n.id === id);
    }

    function hitTest(clientX, clientY){
      const rect = canvas.getBoundingClientRect();
      const p = screenToWorld(clientX - rect.left, clientY - rect.top);
      const nodes = visibleNodes().slice().reverse();
      return nodes.find(n => {
        const dx = p.x - n.x;
        const dy = p.y - n.y;
        return Math.sqrt(dx * dx + dy * dy) <= (n.r + 10) / Math.max(.9, zoom * .75);
      }) || null;
    }

    function setTip(node){
      if (!tip) return;
      if (!node){
        tip.textContent = coarse
          ? "Tap a folder to reveal connected files. Drag the map lightly to inspect the CMS graph."
          : "Hover or click a folder to reveal files. Scroll to zoom, drag to move.";
        return;
      }
      if (node.type === "file"){
        tip.textContent = `${node.label} - connected inside ${node.parent}`;
      } else {
        tip.textContent = node.files ? `${node.label} - ${node.sub}. Zoom in to reveal: ${node.files.join(", ")}.` : `${node.label} - ${node.sub}`;
      }
    }

    function drawConnection(a, b, color, width, pulse){
      const pa = worldToScreen(a);
      const pb = worldToScreen(b);
      const midX = (pa.x + pb.x) / 2;
      const midY = (pa.y + pb.y) / 2;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(midX, midY + Math.sin(pulse) * 8, pb.x, pb.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    function drawNode(n, a, t){
      const p = worldToScreen(n);
      const isHover = hover && hover.id === n.id;
      const isFocus = focus && (focus.id === n.id || n.parent === focus.id);
      const pulse = liveAnimate ? Math.sin(t / 600 + n.x * .01) * 2.5 : 0;
      const r = (n.r + pulse + (isHover ? 5 : 0) + (isFocus ? 3 : 0)) * zoom;

      const grad = ctx.createRadialGradient(p.x - r * .32, p.y - r * .32, 1, p.x, p.y, Math.max(2, r));
      const fillStrong = n.type === "core" ? .62 : n.type === "file" ? .32 : .48;
      grad.addColorStop(0, "rgba(255,255,255,.82)");
      grad.addColorStop(.22, rgba(a, fillStrong));
      grad.addColorStop(1, "rgba(5,12,24,.92)");

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(5, r), 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = isHover || isFocus ? 2.2 : 1.2;
      ctx.strokeStyle = rgba(a, isHover || isFocus ? .86 : .38);
      ctx.stroke();

      ctx.shadowColor = rgba(a, isHover || isFocus ? .42 : .18);
      ctx.shadowBlur = isHover || isFocus ? 22 : 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(4, r * .58), 0, Math.PI * 2);
      ctx.strokeStyle = rgba(a, .16);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const showLabel = n.type !== "file" || zoom > 1.55 || isHover || isFocus;
      if (showLabel){
        ctx.font = `${n.type === "core" ? 15 : n.type === "file" ? 10 : 12}px Space Grotesk, Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,.94)";
        ctx.fillText(n.label, p.x, p.y + (n.type === "file" ? 0 : -2));
        if (n.sub && n.type !== "file"){
          ctx.font = "10px Space Grotesk, Inter, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,.62)";
          ctx.fillText(n.sub, p.x, p.y + 15);
        }
      }
    }

    function draw(t = 0){
      const a = accent();
      ctx.clearRect(0, 0, size.w, size.h);

      ctx.fillStyle = "rgba(3,8,18,.12)";
      ctx.fillRect(0, 0, size.w, size.h);

      const grid = 34 * zoom;
      if (grid > 12){
        ctx.beginPath();
        for (let x = pan.x % grid; x < size.w; x += grid){ ctx.moveTo(x, 0); ctx.lineTo(x, size.h); }
        for (let y = pan.y % grid; y < size.h; y += grid){ ctx.moveTo(0, y); ctx.lineTo(size.w, y); }
        ctx.strokeStyle = rgba(a, .08);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      edges.forEach(([from, to], i) => {
        const aa = getNodeById(from);
        const bb = getNodeById(to);
        if (!aa || !bb) return;
        drawConnection(aa, bb, rgba(a, .22 + Math.sin(t / 900 + i) * .06), 1.3, t / 650 + i);
      });

      if (zoom > 1.22 || focus){
        folders.filter(f => f.files && (!focus || focus.id === f.id)).forEach(folder => {
          fileNodes(folder).forEach(file => drawConnection(folder, file, rgba(a, .18), .9, t / 800));
        });
      }

      visibleNodes().forEach(n => drawNode(n, a, t));

      if (liveAnimate) requestAnimationFrame(draw);
    }

    function zoomAt(nextZoom, clientX, clientY){
      userAdjusted = true;
      const rect = canvas.getBoundingClientRect();
      const sx = clientX == null ? size.w / 2 : clientX - rect.left;
      const sy = clientY == null ? size.h / 2 : clientY - rect.top;
      const before = screenToWorld(sx, sy);
      zoom = Math.max(.72, Math.min(2.85, nextZoom));
      pan.x = sx - before.x * zoom;
      pan.y = sy - before.y * zoom;
      requestStaticDraw();
    }

    function focusNode(node){
      if (!node || node.type === "file") return;
      userAdjusted = true;
      focus = focus && focus.id === node.id ? null : node;
      if (focus){
        zoom = coarse ? Math.max(zoom, 1.06) : Math.max(zoom, 1.48);
        centerMap(focus);
      } else if (coarse) {
        zoom = fittedZoom();
        centerMap();
      }
      setTip(node);
      requestStaticDraw();
    }

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : .89;
      zoomAt(zoom * factor, e.clientX, e.clientY);
    }, { passive: false });

    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = false;
      userAdjusted = true;
      last.x = e.clientX;
      last.y = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (dragging){
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        pan.x += dx;
        pan.y += dy;
        last.x = e.clientX;
        last.y = e.clientY;
        requestStaticDraw();
        return;
      }
      hover = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = hover ? "pointer" : "grab";
      setTip(hover);
      requestStaticDraw();
    });

    canvas.addEventListener("pointerup", (e) => {
      dragging = false;
      canvas.releasePointerCapture?.(e.pointerId);
      const node = hitTest(e.clientX, e.clientY);
      if (!moved && node) focusNode(node);
    });

    canvas.addEventListener("pointerleave", () => {
      dragging = false;
      hover = null;
      canvas.style.cursor = "grab";
      setTip(null);
      requestStaticDraw();
    });

    shell.querySelector("[data-neural-zoom='in']")?.addEventListener("click", () => zoomAt(zoom * 1.18));
    shell.querySelector("[data-neural-zoom='out']")?.addEventListener("click", () => zoomAt(zoom * .84));
    shell.querySelector("[data-neural-reset]")?.addEventListener("click", () => {
      userAdjusted = false;
      focus = null;
      zoom = fittedZoom();
      centerMap();
      setTip(null);
      requestStaticDraw();
    });

    window.addEventListener("resize", () => {
      resize();
      requestStaticDraw();
    }, { passive: true });
    document.addEventListener("clickoz:accent-change", () => requestStaticDraw());
    document.body.classList.add("neural-map-ready");
    resize();
    draw();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCmsNeuralMap, { once: true });
  else initCmsNeuralMap();
})();

/* Clickoz operations guard: client error monitoring, basic bot protection and release diagnostics. */
(() => {
  "use strict";

  const EVENT_KEY = "clickoz_ops_events";
  const MAX_EVENTS = 40;
  const MAX_FIELD = 180;
  const MAX_REMOTE_EVENTS = 12;
  const startedAt = Date.now();
  const clickWindow = [];
  const submitWindow = [];
  const remoteWindow = [];
  let slowLoadReported = false;
  let longTaskReported = false;

  function trim(value, max = MAX_FIELD) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function readEvents() {
    try {
      const events = JSON.parse(localStorage.getItem(EVENT_KEY) || "[]");
      return Array.isArray(events) ? events : [];
    } catch (_) {
      return [];
    }
  }

  function writeEvents(events) {
    try {
      localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (_) {}
  }

  function endpointUrl() {
    const configured = document.querySelector('meta[name="clickoz-error-endpoint"]')?.getAttribute("content") || "/api/client-error";
    try {
      const url = new URL(configured, window.location.origin);
      if (url.origin !== window.location.origin) return "";
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(window.location.hostname)) return "";
      if (window.location.protocol === "file:") return "";
      return url.pathname + url.search;
    } catch (_) {
      return "";
    }
  }

  function eventBase(type, detail) {
    return {
      type: trim(type, 48),
      detail: detail || {},
      path: trim(window.location.pathname || "/", 120),
      lang: trim(document.documentElement.lang || "en", 16),
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      ts: new Date().toISOString()
    };
  }

  function sendEvent(event) {
    const endpoint = endpointUrl();
    if (!endpoint) return;
    const now = Date.now();
    remoteWindow.push(now);
    while (remoteWindow.length && now - remoteWindow[0] > 60000) remoteWindow.shift();
    if (remoteWindow.length > MAX_REMOTE_EVENTS) return;
    const body = JSON.stringify(event);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
        return;
      }
      fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
        credentials: "same-origin"
      }).catch(() => {});
    } catch (_) {}
  }

  function report(type, detail) {
    const event = eventBase(type, detail);
    writeEvents(readEvents().concat(event));
    sendEvent(event);
    document.dispatchEvent(new CustomEvent("clickoz:ops-event", { detail: event }));
    return event;
  }

  function errorDetail(error, extra = {}) {
    const err = error instanceof Error ? error : null;
    return {
      message: trim(err ? err.message : error, 220),
      name: trim(err?.name || "Error", 80),
      source: trim(extra.source || "", 160),
      line: Number(extra.line || 0) || 0,
      column: Number(extra.column || 0) || 0
    };
  }

  window.addEventListener("error", (event) => {
    report("client-error", errorDetail(event.error || event.message, {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    }));
  });

  window.addEventListener("unhandledrejection", (event) => {
    report("client-rejection", errorDetail(event.reason || "Unhandled promise rejection"));
  });

  function installFormGuard(form) {
    if (!form || form.dataset.clickozGuard === "1") return;
    form.dataset.clickozGuard = "1";
    form.dataset.clickozStartedAt = String(Date.now());

    const honeyName = "clickoz_company_url";
    if (!form.querySelector(`[name="${honeyName}"]`)) {
      const honey = document.createElement("input");
      honey.type = "text";
      honey.name = honeyName;
      honey.tabIndex = -1;
      honey.autocomplete = "off";
      honey.setAttribute("aria-hidden", "true");
      honey.className = "clickoz-bot-field";
      honey.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;";
      form.appendChild(honey);
    }

    form.addEventListener("submit", (event) => {
      const now = Date.now();
      const honey = form.querySelector(`[name="${honeyName}"]`);
      const elapsed = now - Number(form.dataset.clickozStartedAt || startedAt);
      submitWindow.push(now);
      while (submitWindow.length && now - submitWindow[0] > 10000) submitWindow.shift();

      if (honey && honey.value.trim()) {
        event.preventDefault();
        report("bot-honeypot", { form: trim(form.id || form.name || form.action || "unknown") });
        return;
      }

      if (submitWindow.length > 3) {
        event.preventDefault();
        report("bot-submit-burst", { count: submitWindow.length, elapsed });
      }
    }, true);
  }

  function installBotGuard() {
    document.querySelectorAll("form").forEach(installFormGuard);
    try {
      new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (node.matches("form")) installFormGuard(node);
            node.querySelectorAll?.("form").forEach(installFormGuard);
          });
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (_) {}

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest("button, a, [role='button']") : null;
      if (!target) return;
      const now = Date.now();
      clickWindow.push(now);
      while (clickWindow.length && now - clickWindow[0] > 12000) clickWindow.shift();
      if (clickWindow.length === 50) {
        report("interaction-burst", { count: clickWindow.length, target: trim(target.getAttribute("aria-label") || target.textContent || target.id || target.className, 120) });
      }
      if (clickWindow.length > 70) {
        event.preventDefault();
        report("interaction-blocked", { count: clickWindow.length });
      }
    }, true);
  }

  function installPerformanceWatch() {
    window.addEventListener("load", () => {
      window.setTimeout(() => {
        if (slowLoadReported) return;
        const nav = performance.getEntriesByType?.("navigation")?.[0];
        const duration = nav ? Math.round(nav.duration) : Math.round(performance.now());
        if (duration > 4500) {
          slowLoadReported = true;
          report("slow-load", { duration, connection: trim(navigator.connection?.effectiveType || "unknown", 24) });
        }
      }, 0);
    }, { once: true });

    try {
      const observer = new PerformanceObserver((list) => {
        if (longTaskReported) return;
        const entry = list.getEntries().find((item) => item.duration > 160);
        if (!entry) return;
        longTaskReported = true;
        report("long-task", { duration: Math.round(entry.duration), name: trim(entry.name || "task", 80) });
        observer.disconnect();
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (_) {}
  }

  function initOpsGuard() {
    document.documentElement.dataset.clickozOps = "active";
    installBotGuard();
    installPerformanceWatch();
  }

  window.ClickozOps = Object.freeze({
    events: readEvents,
    clear() { writeEvents([]); },
    report,
    status() {
      return {
        bufferedEvents: readEvents().length,
        endpoint: endpointUrl() || "local-buffer",
        guard: "active"
      };
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initOpsGuard, { once: true });
  else initOpsGuard();
})();

/* App runtime: route state, scroll feedback, reveal motion and fast internal navigation. */
(() => {
  "use strict";

  if (window.ClickozAppRuntime) return;

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || false;
  const saveData = Boolean(navigator.connection?.saveData);
  const canAnimate = !reduceMotion && !saveData;
  const prefetched = new Set();
  const MAX_PREFETCH = 14;
  const REVEAL_SELECTOR = [
    ".cz-workdesk-hero",
    ".home-workdesk .quick-job-grid a",
    ".home-workdesk .pipeline-grid a",
    ".tools-page .tools-hero",
    ".tools-prompt-dock button",
    ".tools-page .tools-route-grid a",
    ".tools-page .tool-section",
    ".tools-page .tool-card-enhanced",
    ".guides-page .guide-hub-hero",
    ".guide-hub-page .guide-hub-hero",
    ".guide-route-panel a",
    ".guide-search-chips button",
    ".guide-category-band",
    ".guide-hub-card",
    ".updates-hero-v2",
    ".updates-control-panel",
    ".updates-filter-buttons button",
    ".updates-box",
    ".release-lab-grid .release-card",
    ".request-mega-cta"
  ].join(",");
  const SPOTLIGHT_SELECTOR = [
    ".tool-card-enhanced",
    ".guide-hub-card",
    ".release-card",
    ".tools-route-grid a",
    ".tools-prompt-dock button",
    ".guide-route-panel a",
    ".guide-search-chips button",
    ".updates-filter-buttons button",
    ".contact-next-links a",
    ".quick-job-grid a",
    ".pipeline-grid a",
    ".request-mega-cta"
  ].join(",");

  let progressBar = null;
  let progressFrame = 0;
  let scrollFrame = 0;
  let lastY = window.scrollY || 0;
  let revealObserver = null;
  let sectionObserver = null;

  function pageName() {
    const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/") return "home";
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "tools" && parts.length > 1) return "tool";
    if (parts[0] === "guides" && parts.length > 1) return "guide";
    return parts[0] || "home";
  }

  function ensureProgress() {
    progressBar = document.querySelector(".cz-app-progress");
    if (progressBar) return progressBar;
    progressBar = document.createElement("div");
    progressBar.className = "cz-app-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.prepend(progressBar);
    return progressBar;
  }

  function updateProgress() {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(() => {
      progressFrame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
      doc.style.setProperty("--cz-progress", ratio.toFixed(4));
    });
  }

  function updateScrollState() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      const y = window.scrollY || 0;
      doc.classList.toggle("cz-page-scrolled", y > 10);
      doc.classList.toggle("cz-scroll-down", y > lastY && y > 80);
      doc.classList.toggle("cz-scroll-up", y < lastY && y > 80);
      lastY = y;
      updateProgress();
    });
  }

  function initReveal() {
    const nodes = Array.from(document.querySelectorAll(REVEAL_SELECTOR))
      .filter((node) => node instanceof HTMLElement && !node.classList.contains("cz-reveal-ignore"));
    if (!nodes.length) return;

    if (revealObserver) revealObserver.disconnect();

    if (!canAnimate || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    nodes.forEach((node, index) => {
      node.classList.add("cz-reveal-ready");
      node.style.setProperty("--cz-reveal-delay", `${Math.min(180, index * 18)}ms`);
    });

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    nodes.forEach((node) => revealObserver.observe(node));
  }

  function initSectionState() {
    const sections = Array.from(document.querySelectorAll("main section[id]"))
      .filter((section) => section instanceof HTMLElement && section.offsetParent !== null);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    if (sectionObserver) sectionObserver.disconnect();

    sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const active = visible[0].target;
      doc.dataset.activeSection = active.id || "";
      sections.forEach((section) => section.classList.toggle("is-current-section", section === active));
    }, { rootMargin: "-24% 0px -62% 0px", threshold: [0, 0.25, 0.6] });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  function initSpotlight() {
    if (coarsePointer || !canAnimate) return;
    let frame = 0;
    let pending = null;

    document.addEventListener("pointermove", (event) => {
      const target = event.target instanceof Element ? event.target.closest(SPOTLIGHT_SELECTOR) : null;
      if (!(target instanceof HTMLElement)) return;
      pending = { target, x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const rect = pending.target.getBoundingClientRect();
        pending.target.style.setProperty("--spot-x", `${pending.x - rect.left}px`);
        pending.target.style.setProperty("--spot-y", `${pending.y - rect.top}px`);
        pending = null;
      });
    }, { passive: true });
  }

  function canPrefetch(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    const raw = anchor.getAttribute("href") || "";
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return false;
    if (anchor.hasAttribute("download") || anchor.target === "_blank") return false;
    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && !url.search) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function allowsOptionalCache() {
    let value = "";
    try { value = localStorage.getItem("clickoz_consent") || ""; } catch (_) {}
    if (!value) {
      const match = document.cookie.match(/(?:^|;\s*)clickoz_consent=([^;]+)/);
      value = match ? decodeURIComponent(match[1]) : "";
    }
    return value === "all";
  }

  function prefetch(anchor) {
    if (saveData || prefetched.size >= MAX_PREFETCH || !allowsOptionalCache() || !canPrefetch(anchor)) return;
    const url = new URL(anchor.href, window.location.href);
    const href = `${url.pathname}${url.search}`;
    const exists = Array.from(document.head.querySelectorAll('link[rel="prefetch"]'))
      .some((link) => link.getAttribute("href") === href);
    if (prefetched.has(href) || exists) return;
    prefetched.add(href);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    link.as = "document";
    document.head.appendChild(link);
  }

  function initPrefetch() {
    if (saveData) return;
    const schedule = (anchor) => {
      if (!anchor) return;
      const run = () => prefetch(anchor);
      if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 1200 });
      else window.setTimeout(run, 120);
    };

    document.addEventListener("mouseover", (event) => {
      schedule(event.target instanceof Element ? event.target.closest("a[href]") : null);
    }, { passive: true });

    document.addEventListener("focusin", (event) => {
      schedule(event.target instanceof Element ? event.target.closest("a[href]") : null);
    });
  }

  function initFormState() {
    document.addEventListener("submit", (event) => {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!(form instanceof HTMLFormElement)) return;
      if (typeof form.checkValidity === "function" && !form.checkValidity()) return;
      window.setTimeout(() => {
        if (event.defaultPrevented || !form.isConnected) return;
        form.classList.add("is-submitting");
        form.setAttribute("aria-busy", "true");
        form.querySelectorAll("button[type='submit'], input[type='submit']").forEach((button) => {
          button.setAttribute("aria-disabled", "true");
        });
      }, 0);
    }, true);
  }

  function refresh() {
    initReveal();
    initSectionState();
    updateProgress();
  }

  function init() {
    const page = pageName();
    doc.dataset.clickozPage = page;
    doc.classList.add("cz-app-ready", `cz-route-${page}`);
    ensureProgress();
    updateProgress();
    updateScrollState();
    initReveal();
    initSectionState();
    initSpotlight();
    initPrefetch();
    initFormState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    document.dispatchEvent(new CustomEvent("clickoz:app-ready", { detail: { page } }));
  }

  window.ClickozAppRuntime = Object.freeze({
    page: pageName,
    refresh,
    progress: updateProgress
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

/* PWA bridge: install prompt, service worker lifecycle and network state. */
(() => {
  "use strict";

  if (window.ClickozPWA) return;

  const SW_URL = "/sw.js";
  const INSTALL_DISMISS_KEY = "clickoz_install_dismissed_until";
  const INSTALL_SESSION_KEY = "clickoz_install_seen_session";
  const INSTALL_IDLE_DELAY = 24000;
  const INSTALL_INTERACTION_DELAY = 2200;
  const doc = document.documentElement;

  let deferredInstallPrompt = null;
  let installCard = null;
  let installPromptTimer = 0;
  let installAutoHideTimer = 0;
  let installOfferArmed = false;
  let toast = null;
  let toastTimer = 0;
  let updateWorker = null;
  let reloadOnControllerChange = false;
  let wasOffline = navigator.onLine === false;
  let updateCheckTimer = 0;

  function storageGet(key) {
    try { return localStorage.getItem(key) || ""; } catch (_) { return ""; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function sessionGet(key) {
    try { return sessionStorage.getItem(key) || ""; } catch (_) { return ""; }
  }

  function sessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function onDomReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function isStandalone() {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true
    );
  }

  function dismissedInstallPrompt() {
    const until = Number(storageGet(INSTALL_DISMISS_KEY) || 0);
    return Number.isFinite(until) && until > Date.now();
  }

  function setInstallDismissal(days) {
    storageSet(INSTALL_DISMISS_KEY, String(Date.now() + days * 86400000));
  }

  function hideInstallCard() {
    if (installAutoHideTimer) window.clearTimeout(installAutoHideTimer);
    installAutoHideTimer = 0;
    installCard?.remove();
    installCard = null;
  }

  function toastIsVisible() {
    return toast?.getAttribute("data-show") === "true";
  }

  function ensureToast() {
    if (toast) return toast;
    toast = document.createElement("div");
    toast.className = "cz-app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const text = document.createElement("span");
    text.className = "cz-app-toast-text";
    toast.appendChild(text);

    const actions = document.createElement("div");
    actions.className = "cz-app-toast-actions";
    toast.appendChild(actions);

    document.body.appendChild(toast);
    return toast;
  }

  function clearToastTimer() {
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = 0;
  }

  function hideToast() {
    clearToastTimer();
    toast?.setAttribute("data-show", "false");
  }

  function showToast(message, options = {}) {
    onDomReady(() => {
      const node = ensureToast();
      const text = node.querySelector(".cz-app-toast-text");
      const actions = node.querySelector(".cz-app-toast-actions");
      if (text) text.textContent = message;
      if (actions) actions.textContent = "";
      node.dataset.kind = options.kind || "status";

      if (options.action && typeof options.onAction === "function" && actions) {
        const action = document.createElement("button");
        action.type = "button";
        action.className = "cz-app-toast-action";
        action.textContent = options.action;
        action.addEventListener("click", () => {
          options.onAction();
        });
        actions.appendChild(action);
      }

      const close = document.createElement("button");
      close.type = "button";
      close.className = "cz-app-toast-close";
      close.setAttribute("aria-label", "Dismiss");
      close.textContent = "x";
      close.addEventListener("click", hideToast);
      actions?.appendChild(close);

      clearToastTimer();
      node.setAttribute("data-show", "true");
      if (!options.persist) {
        toastTimer = window.setTimeout(hideToast, options.ttl || 4200);
      }
    });
  }

  function shouldOfferInstall() {
    return Boolean(
      deferredInstallPrompt &&
      !isStandalone() &&
      !dismissedInstallPrompt() &&
      sessionGet(INSTALL_SESSION_KEY) !== "1"
    );
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) return;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    hideInstallCard();

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === "accepted") {
        showToast("Clickoz installed", { kind: "success" });
      } else {
        setInstallDismissal(7);
      }
    } catch (_) {
      showToast("Install unavailable", { kind: "status" });
    }
  }

  function showInstallCard() {
    if (!shouldOfferInstall() || installCard) return;
    if (toastIsVisible()) return;

    installCard = document.createElement("div");
    installCard.className = "cz-install-card";
    installCard.setAttribute("role", "dialog");
    installCard.setAttribute("aria-label", "Install Clickoz");

    const copy = document.createElement("div");
    copy.className = "cz-install-copy";

    const title = document.createElement("strong");
    title.textContent = "Install Clickoz";
    copy.appendChild(title);

    const detail = document.createElement("span");
    detail.textContent = "Open as app.";
    copy.appendChild(detail);

    const actions = document.createElement("div");
    actions.className = "cz-install-actions";

    const install = document.createElement("button");
    install.type = "button";
    install.className = "cz-install-action";
    install.textContent = "Install";
    install.addEventListener("click", promptInstall);
    actions.appendChild(install);

    const later = document.createElement("button");
    later.type = "button";
    later.className = "cz-install-dismiss";
    later.setAttribute("aria-label", "Dismiss install prompt");
    later.textContent = "Later";
    later.addEventListener("click", () => {
      setInstallDismissal(14);
      hideInstallCard();
    });
    actions.appendChild(later);

    installCard.appendChild(copy);
    installCard.appendChild(actions);
    document.body.appendChild(installCard);
    sessionSet(INSTALL_SESSION_KEY, "1");
    requestAnimationFrame(() => installCard?.setAttribute("data-show", "true"));
    installAutoHideTimer = window.setTimeout(() => {
      if (!installCard?.matches(":hover, :focus-within")) hideInstallCard();
    }, 14000);
  }

  function scheduleInstallOffer(delay = INSTALL_IDLE_DELAY) {
    if (!shouldOfferInstall()) return;
    if (installPromptTimer) window.clearTimeout(installPromptTimer);
    installPromptTimer = window.setTimeout(() => {
      installPromptTimer = 0;
      showInstallCard();
    }, delay);
  }

  function armInstallOffer() {
    if (installOfferArmed || !shouldOfferInstall()) return;
    installOfferArmed = true;

    const interactionOptions = { once: true, passive: true };
    const onInteraction = () => scheduleInstallOffer(INSTALL_INTERACTION_DELAY);
    window.addEventListener("scroll", onInteraction, interactionOptions);
    document.addEventListener("pointerdown", onInteraction, interactionOptions);
    document.addEventListener("keydown", onInteraction, { once: true });
    document.addEventListener("focusin", onInteraction, { once: true });
    scheduleInstallOffer(INSTALL_IDLE_DELAY);
  }

  function handleNetworkState(announce) {
    const online = navigator.onLine !== false;
    doc.classList.toggle("cz-is-offline", !online);
    doc.classList.toggle("cz-is-online", online);
    doc.dataset.network = online ? "online" : "offline";

    if (!online) {
      wasOffline = true;
      showToast("Offline mode", { kind: "offline", persist: true });
      return;
    }

    if (wasOffline && announce) {
      showToast("Back online", { kind: "online" });
    } else if (toast?.dataset.kind === "offline") {
      hideToast();
    }
    wasOffline = false;
  }

  function offerUpdate(worker) {
    if (!worker || !navigator.serviceWorker?.controller) return;
    updateWorker = worker;
    hideInstallCard();
    showToast("Update ready", {
      action: "Refresh",
      kind: "update",
      persist: true,
      onAction() {
        if (!updateWorker) return;
        reloadOnControllerChange = true;
        updateWorker.postMessage({ type: "CLICKOZ_SKIP_WAITING" });
        window.setTimeout(() => window.location.reload(), 1800);
      }
    });
  }

  function watchRegistration(registration) {
    if (registration.waiting) offerUpdate(registration.waiting);

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          offerUpdate(worker);
        }
      });
    });

    const scheduleUpdateCheck = () => {
      if (document.hidden || updateCheckTimer) return;
      updateCheckTimer = window.setTimeout(() => {
        updateCheckTimer = 0;
        registration.update().catch(() => {});
      }, 1400);
    };

    window.addEventListener("focus", scheduleUpdateCheck);
    document.addEventListener("visibilitychange", scheduleUpdateCheck);
  }

  function registerServiceWorker() {
    const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname || "");
    const localPwaEnabled = new URLSearchParams(window.location.search || "").has("pwa");
    if (isLocalHost && !localPwaEnabled) {
      doc.classList.add("cz-sw-skipped");
      return;
    }

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      doc.classList.add("cz-sw-unavailable");
      return;
    }

    const startRegistration = () => {
      navigator.serviceWorker.register(SW_URL, { scope: "/" })
        .then((registration) => {
          doc.classList.add("cz-sw-registered");
          watchRegistration(registration);
          return navigator.serviceWorker.ready;
        })
        .then(() => {
          doc.classList.add("cz-sw-ready");
        })
        .catch(() => {
          doc.classList.add("cz-sw-unavailable");
        });
    };

    if (document.readyState === "complete") startRegistration();
    else window.addEventListener("load", startRegistration, { once: true });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      doc.classList.add("cz-sw-ready");
      if (reloadOnControllerChange) window.location.reload();
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "CLICKOZ_SW_ACTIVE") {
        doc.dataset.swVersion = event.data.version || "active";
      }
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    armInstallOffer();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallCard();
    setInstallDismissal(365);
    doc.classList.add("cz-installed");
    showToast("Clickoz installed", { kind: "success" });
  });

  window.addEventListener("online", () => handleNetworkState(true));
  window.addEventListener("offline", () => handleNetworkState(true));

  onDomReady(() => {
    doc.classList.toggle("cz-installed", isStandalone());
    handleNetworkState(false);
    registerServiceWorker();
  });

  window.ClickozPWA = Object.freeze({
    status() {
      return {
        standalone: isStandalone(),
        online: navigator.onLine !== false,
        serviceWorker: "serviceWorker" in navigator,
        controlled: Boolean(navigator.serviceWorker?.controller),
        installPrompt: Boolean(deferredInstallPrompt)
      };
    },
    install: promptInstall,
    refresh() {
      if (updateWorker) {
        reloadOnControllerChange = true;
        updateWorker.postMessage({ type: "CLICKOZ_SKIP_WAITING" });
      } else {
        window.location.reload();
      }
    }
  });
})();
