/* =========================================================
   Clickoz — site.js (CLEAN + PRO)
   - One file, used across all pages
   - Cyan default accent on first visit
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
    window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  if (mobilePerfMode) document.documentElement.classList.add("mobile-perf-mode");

  const THEME_SWATCHES = [
    ["#22d3ee", "#06b6d4", "Cyan"],
    ["#6366f1", "#8b5cf6", "Violet"],
    ["#3b82f6", "#60a5fa", "Blue"],
    ["#10b981", "#34d399", "Green"],
    ["#fde047", "#eab308", "Yellow"],
    ["#f59e0b", "#fbbf24", "Amber"],
    ["#f97316", "#fb923c", "Orange"],
    ["#ef4444", "#f87171", "Red"],
    ["#ec4899", "#f472b6", "Pink"],
    ["#f8fafc", "#cbd5e1", "White"]
  ];

  function closeAllMenus(){
    $$('.menu.active').forEach(m => m.classList.remove('active'));
    $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function colorGridMarkup(){
    return THEME_SWATCHES.map(([a1, a2, label]) =>
      `<button class="color-option" type="button" data-accent="${a1}" data-accent2="${a2}" style="background:${a1}" title="${label}" role="menuitem" aria-label="${label} theme"></button>`
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

  function mobileMenuMarkup(){
    return `
      <div class="m-overlay" id="mOverlay" hidden></div>
      <aside class="m-menu m-menu-premium" id="mobileMenu" aria-hidden="true">
        ${mobileMenuInnerMarkup()}
      </aside>`;
  }

  function mobileMenuInnerMarkup(){
    return `
      <div class="m-head m-head-minimal">
        <button class="m-close" id="mClose" type="button" aria-label="Close menu">&times;</button>
      </div>

      <div class="m-command-card" aria-label="Quick route">
        <span class="m-command-icon" aria-hidden="true">⚡</span>
        <div>
          <strong>Start from the job</strong>
          <p>Pick the page you need, then move to the matching workflow.</p>
        </div>
      </div>

      <div class="m-links" aria-label="Main sections">
        <a class="m-link" href="/"><span aria-hidden="true">⌂</span><strong>Home</strong></a>
        <a class="m-link" href="/tools/"><span aria-hidden="true">⚙</span><strong>Tools</strong></a>
        <a class="m-link" href="/guides/"><span aria-hidden="true">◇</span><strong>Guides</strong></a>
        <a class="m-link" href="/updates/"><span aria-hidden="true">↻</span><strong>Updates</strong></a>
        <a class="m-link" href="/about/"><span aria-hidden="true">i</span><strong>About</strong></a>
        <a class="m-link" href="/contact/"><span aria-hidden="true">✉</span><strong>Contact</strong></a>
      </div>

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
    if(logo.querySelector('.logo-text')) return;
    logo.setAttribute('aria-label', 'Clickoz Home');
    logo.innerHTML = `
      <span class="logo-badge" id="logoBadge" aria-hidden="true">
        <svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
          <path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="logo-text">Click<span class="logo-oz">oz</span></span>`;
  }

  function normalizeNavLinks(){
    const navInner = $('.nav-inner');
    if(!navInner) return;
    let links = $('.nav-links', navInner);
    const path = window.location.pathname || "/";
    const active = path.startsWith('/tools/') ? 'tools'
      : path.startsWith('/guides/') ? 'guides'
      : path.startsWith('/updates/') ? 'updates'
      : 'home';
    const items = [
      ['home', '/', 'Home'],
      ['tools', '/tools/', 'Tools'],
      ['guides', '/guides/', 'Guides'],
      ['updates', '/updates/', 'Updates']
    ];
    const html = items.map(([key, href, label]) => {
      const current = active === key ? ' class="active" aria-current="page"' : '';
      return `<a href="${href}"${current}>${label}</a>`;
    }).join('');

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
    return "34,211,238"; // cyan fallback
  }

  function setAccent(a1, a2){
    const accent  = a1 || '#22d3ee'; // cyan default
    const accent2 = a2 || '#06b6d4';
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
    if(!burger || !menu || !overlay || !closeBtn) return;

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
      closeBtn.focus?.({ preventScroll: true });
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

    closeBtn.addEventListener('click', () => closeMenu());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMenu();
    });

    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });

    menu.addEventListener('click', (e) => {
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
     2) ACCENT MENU (DESKTOP + MOBILE GRID)
  ========================================================= */
  (function initAccent(){
    const CYAN  = '#22d3ee';
    const CYAN2 = '#06b6d4';

    // restore saved accent first
    try{
      const saved = JSON.parse(localStorage.getItem('clickoz_accent') || 'null');
      if(saved?.a1){
        setAccent(saved.a1, saved.a2);
        markActiveSwatches(saved.a1);
      }else{
        // first visit default
        setAccent(CYAN, CYAN2);
        markActiveSwatches(CYAN);
      }
    }catch(_){
      setAccent(CYAN, CYAN2);
      markActiveSwatches(CYAN);
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
    const banner = $('.cookie');
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
    }

    function readStored(){
      try { return localStorage.getItem(KEY); } catch(e){ return null; }
    }

    function hideBanner(){ banner?.classList.remove('show'); }

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
    } else {
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
    if (prefersReduce) {
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
    if (prefersReduce) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;
    if (layer.querySelector('.pidle')) return;

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile || mobilePerfMode ? 28 : 82;

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
    if (prefersReduce || mobilePerfMode) return;
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
    if (prefersReduce) return;
    const layer = ensureParticlesLayer();
    if(!layer) return;
    if (layer.querySelector('.pguide')) return;

    layer.querySelectorAll(".pburst").forEach((node) => node.remove());

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const COUNT = isMobile || mobilePerfMode ? 24 : 58;

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
    if (prefersReduce || guidePath || document.body.classList.contains("page-guide")) {
      if (!prefersReduce && (guidePath || document.body.classList.contains("page-guide"))) {
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
    else if (path.startsWith('/guides') || path.endsWith('/guides.html')) section = 'guides';
    else if (path.startsWith('/updates') || path.endsWith('/updates.html')) section = 'updates';

    function matchLink(a){
      const href = (a.getAttribute('href') || '').toLowerCase().replace(/\/+$/, '');
      if (section === 'home')   return href === '' || href === '/' || href === '/index.html';
      if (section === 'tools')  return href === '/tools'  || href === '/tools.html'  || href.startsWith('/tools/');
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
    <div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div>
    <div><h4>Workflow hubs</h4><div class="footer-links"><a href="/workflows/">Workflows</a><a href="/tools/seo-tools/">SEO Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/guides/creator/">Creator Guides</a></div></div>
    <div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/youtube-title-generator/">YouTube Titles</a></div></div>
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
          <svg class="footer-logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
            <path class="footer-logo-c" d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6"
              fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
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
      meta: "Quick job",
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
      meta: "Quick job",
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
      meta: "Quick job",
      description: "Remove spacing noise, blank lines and messy paste formatting.",
      sampleInput: "messy AI draft",
      sampleOutput: "Copy-ready clean text",
      timeSaved: "Clean in 5 sec",
      usedFor: "Client work",
      search: "clean text whitespace cleaner pulire testo sistemare testo spazi ai draft"
    },
    {
      id: "youtube",
      title: "Prepare YouTube upload",
      url: "/tools/youtube-title-generator/",
      meta: "Quick job",
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
      meta: "Quick job",
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
      sampleOutput: "Copy-ready text",
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
      sampleOutput: "Creator-ready upload asset",
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
      problem: "Turn creator ideas into usable social assets.",
      quickJob: "Creator asset",
      sampleInput: "post or content idea",
      sampleOutput: "Ready-to-use creator copy",
      timeSaved: "Create faster",
      usedFor: "Creator growth",
      aliases: "social tiktok instagram linkedin hook caption ai creator"
    }
  };

  const explicitProfiles = {
    "meta-tags": { problem: "Create a search-ready snippet.", quickJob: "SEO snippet", sampleInput: "rough page title", sampleOutput: "Title + meta description", timeSaved: "Fix in 30 sec", usedFor: "SEO publishing", aliases: "snippet meta descrizione title seo" },
    "word-counter": { problem: "Check if a draft fits the target length.", quickJob: "Live count", sampleInput: "draft text", sampleOutput: "Words, chars and reading time", timeSaved: "Count instantly", usedFor: "Client work", aliases: "count words parole caratteri reading time" },
    "readability-analyzer": { problem: "Find where a draft feels heavy.", quickJob: "Draft pressure", sampleInput: "long paragraph", sampleOutput: "Readability and sentence pressure", timeSaved: "Edit faster", usedFor: "Readable drafts", aliases: "readability clarity scan sentence testo leggibilita" },
    "whitespace-cleaner": { problem: "Remove messy spaces and blank lines.", quickJob: "Clean pasted text", sampleInput: "messy AI draft", sampleOutput: "Copy-ready text", timeSaved: "Clean in 5 sec", usedFor: "Text cleanup", aliases: "clean text whitespace spaces pulire testo spazi" },
    "json-formatter": { problem: "Repair and read JSON quickly.", quickJob: "Fix broken JSON", sampleInput: "{\"status\":\"messy\"}", sampleOutput: "Valid formatted JSON", timeSaved: "Debug in 10 sec", usedFor: "Fast formatting", aliases: "json rotto payload config validate" },
    "utm-builder": { problem: "Build campaign links without mistakes.", quickJob: "Tracking URL", sampleInput: "landing page URL", sampleOutput: "Clean UTM link", timeSaved: "Track in 20 sec", usedFor: "Campaign work", aliases: "utm tracking link campaign url" },
    "youtube-title-generator": { problem: "Create usable title angles for an upload.", quickJob: "YouTube title", sampleInput: "video idea", sampleOutput: "Title options", timeSaved: "Upload faster", usedFor: "Creator uploads", aliases: "youtube title titolo video upload creator" },
    "youtube-description-generator": { problem: "Package a video description faster.", quickJob: "YouTube description", sampleInput: "video topic", sampleOutput: "Description draft", timeSaved: "Write faster", usedFor: "Creator uploads", aliases: "youtube description descrizione video upload" },
    "thumbnail-brief-generator": { problem: "Turn a video idea into a visual brief.", quickJob: "Thumbnail brief", sampleInput: "video promise", sampleOutput: "Visual brief", timeSaved: "Brief faster", usedFor: "Creator uploads", aliases: "thumbnail brief youtube visual" },
    "slug-generator": { problem: "Make a clean URL slug.", quickJob: "Clean slug", sampleInput: "page title", sampleOutput: "Short URL slug", timeSaved: "Fix in seconds", usedFor: "SEO publishing", aliases: "slug url seo permalink" },
    "serp-preview": { problem: "See how a result will look before publishing.", quickJob: "SERP preview", sampleInput: "title and description", sampleOutput: "Search result preview", timeSaved: "Preview faster", usedFor: "SEO publishing", aliases: "serp preview google snippet" }
  };

  function profileForTool(toolOrSlug) {
    const tool = typeof toolOrSlug === "string" ? (cms.toolBySlug?.[toolOrSlug] || null) : toolOrSlug;
    if (!tool) return null;
    const base = categoryDefaults[tool.category] || categoryDefaults.text;
    const explicit = explicitProfiles[tool.slug] || {};
    return {
      ...base,
      ...explicit,
      nextTools: tool.relatedTools || [],
      search: `${tool.title} ${tool.description} ${(tool.features || []).join(" ")} ${tool.category} ${base.aliases || ""} ${explicit.aliases || ""} ${explicit.problem || base.problem} ${explicit.quickJob || base.quickJob}`
    };
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
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "Saved" : "Save tool";
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
        <span>After ${esc(profile?.quickJob || tool.title)}, these are the most useful next actions.</span>
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

  function commandItems() {
    const tools = (cms.tools || []).map((tool) => {
      const profile = profileForTool(tool);
      return {
        type: "tool",
        title: tool.title,
        url: tool.url,
        slug: tool.slug,
        description: profile?.problem || tool.description,
        meta: profile?.quickJob || cms.clusters?.[tool.category]?.title || "Tool",
        output: profile?.sampleOutput || "",
        time: profile?.timeSaved || "",
        search: profile?.search || `${tool.title} ${tool.description} ${(tool.features || []).join(" ")} ${tool.category}`
      };
    });
    const guides = (cms.guides || []).map((guide) => ({
      type: "guide",
      title: guide.title,
      url: guide.url,
      slug: guide.slug,
      description: guide.description,
      meta: "Guide",
      search: `${guide.title} ${guide.description} ${guide.category}`
    }));
    const jobs = jobCatalog.map((job) => ({
      type: "job",
      title: job.title,
      url: job.url,
      slug: job.id,
      description: job.description,
      meta: job.meta,
      output: job.sampleOutput,
      time: job.timeSaved,
      search: `${job.title} ${job.description} ${job.sampleInput} ${job.sampleOutput} ${job.usedFor} ${job.search}`
    }));
    return [...jobs, ...tools, ...guides];
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
      <div class="cz-command-dialog" role="dialog" aria-modal="true" aria-label="Clickoz command palette">
        <div class="cz-command-titlebar">
          <span>CLICKOZ COMMAND DESK</span>
          <strong>What do you need to fix?</strong>
          <em>Ctrl+K on desktop. Four quick taps on mobile.</em>
        </div>
        <div class="cz-command-input-row">
          <span aria-hidden="true">K</span>
          <input id="czCommandInput" type="search" placeholder="Try: broken JSON, clean text, YouTube title, SEO snippet..." autocomplete="off" />
          <button type="button" data-command-close aria-label="Close command palette">Close</button>
        </div>
        <div class="cz-command-sections">
          <div class="cz-command-memory" id="czCommandMemory"></div>
          <div class="cz-command-results" id="czCommandResults" role="listbox"></div>
        </div>
      </div>`;
    document.body.appendChild(shell);
    return shell;
  }

  function renderCommandMemory() {
    const shell = ensurePalette();
    const target = $("#czCommandMemory", shell);
    if (!target) return;
    const recent = readList(storage.recent).map(toolBySlug).filter(Boolean).slice(0, 3);
    const favorites = readList(storage.favorites).map(toolBySlug).filter(Boolean).slice(0, 3);
    const items = [
      ...favorites.map((tool) => ({ label: "Saved", tool })),
      ...recent.map((tool) => ({ label: "Recent", tool }))
    ].slice(0, 5);
    target.innerHTML = items.length ? `
      <div class="cz-memory-title">Fast access</div>
      ${items.map(({ label, tool }) => `<a href="${tool.url}"><span>${esc(label)}</span><strong>${esc(tool.title)}</strong></a>`).join("")}
    ` : `<div class="cz-command-hint">Tip: press Ctrl+K and type a job like "snippet", "json" or "youtube".</div>`;
  }

  let selectedIndex = 0;
  let lastResults = [];

  function renderCommandResults(query = "") {
    const shell = ensurePalette();
    const target = $("#czCommandResults", shell);
    const items = commandItems()
      .map((item) => ({ item, score: fuzzyScore(query, item.search) }))
      .filter((entry) => !query || entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((entry) => entry.item);
    lastResults = items;
    selectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));
    target.innerHTML = items.length ? items.map((item, index) => `
      <a class="${index === selectedIndex ? "is-active" : ""}" href="${item.url}" role="option" aria-selected="${index === selectedIndex ? "true" : "false"}" data-command-index="${index}">
        <span>${esc(item.meta)}</span>
        <strong>${esc(item.title)}</strong>
        <em>${esc(item.description)}</em>
        ${item.output || item.time ? `<small>${esc(item.output || "Useful output")}${item.time ? ` - ${esc(item.time)}` : ""}</small>` : ""}
      </a>
    `).join("") : `<div class="cz-command-empty">No exact match. Try "seo", "json", "youtube", "clean text" or "utm".</div>`;
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
    let mobileTapTimes = [];

    function shouldTrackMobileTap(event) {
      if (!(window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 820)) return false;
      if (!ensurePalette().hidden) return false;
      const target = event.target;
      if (!target || target.closest("a, button, input, textarea, select, [role='button'], .m-menu, .cz-command-palette")) return false;
      return true;
    }

    function trackMobileTap(event) {
      if (!shouldTrackMobileTap(event)) return;
      const now = Date.now();
      mobileTapTimes = mobileTapTimes.filter((time) => now - time < 1300);
      mobileTapTimes.push(now);
      if (mobileTapTimes.length >= 4) {
        mobileTapTimes = [];
        openPalette("");
      }
    }

    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        openPalette();
        return;
      }
      if (event.key === "Escape" && !ensurePalette().hidden) closePalette();
    });

    document.addEventListener("click", (event) => {
      const commandTrigger = event.target.closest("[data-open-command]");
      if (commandTrigger) {
        event.preventDefault();
        openPalette(commandTrigger.getAttribute("data-command-query") || "");
        return;
      }
      if (event.target.closest("[data-command-close]")) closePalette();
      const fav = event.target.closest("[data-cz-fav-toggle]");
      if (fav) {
        event.preventDefault();
        const slug = fav.getAttribute("data-cz-fav-toggle");
        setFavorite(slug, !isFavorite(slug));
      }
      trackMobileTap(event);
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
        renderCommandResults(input.value);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = Math.max(0, selectedIndex - 1);
        renderCommandResults(input.value);
      } else if (event.key === "Enter" && lastResults[selectedIndex]) {
        event.preventDefault();
        window.location.href = lastResults[selectedIndex].url;
      }
    });
  }

  function compactEventQuery(event) {
    return String(event?.detail?.query || "").replace(/\s+/g, " ").trim();
  }

  function enhanceToolsSearch() {
    const input = $("#toolsSearch");
    if (!input || $(".cz-tools-search-hint")) return;
    input.setAttribute("placeholder", "Try: broken JSON, clean text, YouTube title, SEO snippet");
    const hint = document.createElement("div");
    hint.className = "cz-tools-search-hint";
    hint.innerHTML = `Press <kbd>Ctrl</kbd> + <kbd>K</kbd> for the command palette`;
    input.insertAdjacentElement("afterend", hint);
  }

  function currentDockSection() {
    const path = window.location.pathname || "/";
    if (path === "/" || path === "/index.html") return "home";
    if (path.startsWith("/tools/") || path === "/tools/") return "tools";
    if (path.startsWith("/guides/") || path === "/guides/") return "guides";
    return "more";
  }

  function ensureAppDock() {
    if ($(".cz-app-dock")) return;
    const active = currentDockSection();
    const dock = document.createElement("nav");
    dock.className = "cz-app-dock";
    dock.setAttribute("aria-label", "Mobile Clickoz workbench");
    dock.innerHTML = `
      <a href="/" data-dock-section="home"${active === "home" ? ` aria-current="page"` : ""}><span>Home</span></a>
      <a href="/tools/" data-dock-section="tools"${active === "tools" ? ` aria-current="page"` : ""}><span>Tools</span></a>
      <button type="button" data-open-command data-dock-center><span>Fix</span></button>
      <a href="/guides/" data-dock-section="guides"${active === "guides" ? ` aria-current="page"` : ""}><span>Guides</span></a>
      <button type="button" data-open-command data-command-query=""><span>Saved</span></button>`;
    document.body.appendChild(dock);
    document.documentElement.classList.add("cz-app-dock-ready");
  }

  function init() {
    rememberCurrentTool();
    addFavoriteControl();
    addNextTools();
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

    function resize(){
      const rect = shell.getBoundingClientRect();
      size.w = Math.max(320, rect.width);
      size.h = Math.max(240, rect.height);
      canvas.width = Math.round(size.w * DPR);
      canvas.height = Math.round(size.h * DPR);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      pan.x = size.w / 2;
      pan.y = size.h / 2;
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
        tip.textContent = "Hover a folder to inspect the CMS layer. Scroll to zoom, drag to move.";
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
      focus = focus && focus.id === node.id ? null : node;
      if (focus){
        zoom = Math.max(zoom, 1.48);
        pan.x = size.w / 2 - focus.x * zoom;
        pan.y = size.h / 2 - focus.y * zoom;
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
      focus = null;
      zoom = 1;
      pan.x = size.w / 2;
      pan.y = size.h / 2;
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
