/* =========================================================
   Clickoz — site.js (CLEAN + PRO)
   - One file, used across all pages
   - Cyan default accent on first visit
   - Mobile drawer + dropdown close helpers
   - Search + chips (only if present)
   - Recommended random picks (home) + manual refresh (if present)
   - Cookie consent + optional Google Translate
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

  function closeAllMenus(){
    $$('.menu.active').forEach(m => m.classList.remove('active'));
    $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

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

    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent2', accent2);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgbTriplet(accent));

    const dot = $('#colorDot');
    if (dot) dot.style.background = accent;

    const badge = $('#logoBadge');
    if (badge) badge.style.color = accent;

    try{
      localStorage.setItem('clickoz_accent', JSON.stringify({a1: accent, a2: accent2}));
    }catch(_){}
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

    function openMenu(){
      menu.classList.add('open');
      overlay.hidden = false;
      menu.setAttribute('aria-hidden','false');
      burger.setAttribute('aria-expanded','true');
      root.classList.add('no-scroll');
    }

    function closeMenu(){
      menu.classList.remove('open');
      overlay.hidden = true;
      menu.setAttribute('aria-hidden','true');
      burger.setAttribute('aria-expanded','false');
      root.classList.remove('no-scroll');
    }

    burger.addEventListener('click', () => {
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });

    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    window.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
    });

    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) closeMenu();
    });

    if(!$('#__noScrollStyle')){
      const style = document.createElement('style');
      style.id = "__noScrollStyle";
      style.textContent = `.no-scroll{ overflow:hidden !important; }`;
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
      { href:'/tools/word-counter/',          icon:'🔢', title:'Word Counter',          desc:'Count words, characters, sentences, paragraphs and reading time.' },
      { href:'/tools/word-counter-pro/',      icon:'✨', title:'Word Counter Pro',      desc:'Advanced stats: speaking time, section breakdown and keyword hints.' },
      { href:'/tools/readability-analyzer/',  icon:'📚', title:'Readability Analyzer',  desc:'Readability score + clarity hints to improve scannability.' },
      { href:'/tools/keyword-density/',       icon:'🎯', title:'Keyword Density',       desc:'Measure keyword frequency and spot overuse without stuffing.' },
      { href:'/tools/meta-tags/',             icon:'🏷️', title:'Meta Tag Optimizer',    desc:'SERP preview + length checks to improve CTR.' },
      { href:'/tools/json-formatter/',        icon:'🧾', title:'JSON Formatter',        desc:'Prettify/minify/validate JSON instantly for debugging.' },
      { href:'/tools/url-encoder/',           icon:'🔗', title:'URL Encoder',           desc:'Encode/decode URLs and query strings safely.' },
      { href:'/tools/base64/',                icon:'🔐', title:'Base64',                desc:'Encode/decode Base64 strings for tokens and payloads.' },
      { href:'/tools/title-description/',     icon:'📝', title:'Title & Description',   desc:'Generate SEO title/description ideas aligned to intent.' },
      { href:'/tools/alt-text/',              icon:'🖼️', title:'Alt Text Generator',    desc:'Accessibility-friendly alt text variants without spam.' },
      { href:'/tools/seo-outline/',           icon:'🧠', title:'SEO Outline Helper',    desc:'Build H1/H2/H3 outline + FAQ ideas that match intent.' },
    ];

    const grid = document.getElementById('grid');
    const cards = grid ? Array.from(grid.querySelectorAll('a.card')) : [];

    function extractFromCard(card){
      const title = (card.querySelector('h3')?.textContent || 'Tool').trim();
      const icon  = (card.querySelector('.thumb')?.textContent || '✨').trim();
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
     6) COOKIE CONSENT + GOOGLE TRANSLATE (optional)
  ========================================================= */
  (function consentAndGT(){
    const KEY = "clickoz_consent";
    const banner = $('.cookie');
    const gtWrap  = $('#gtNavWrap');

    function setCookie(name, value, days){
      const maxAge = days ? `; Max-Age=${days*24*60*60}` : "";
      document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; Path=/; SameSite=Lax`;
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

    function mirrorGTToMobile(){
      const desktop = $('#google_translate_element');
      const mobile  = $('#google_translate_element_mobile');
      if(!desktop || !mobile) return;
      if(desktop.innerHTML.trim() && !mobile.innerHTML.trim()){
        mobile.innerHTML = desktop.innerHTML;
      }
    }

    function loadGoogleTranslate(){
      if (window.__gt_loaded) return;
      window.__gt_loaded = true;

      if (gtWrap) gtWrap.classList.add('show');

      window.googleTranslateElementInit = function(){
        // eslint-disable-next-line no-new
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );

        let tries = 0;
        const t = setInterval(() => {
          mirrorGTToMobile();
          tries++;
          if(tries > 18) clearInterval(t);
        }, 350);
      };

      const s = document.createElement('script');
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    }

    const existing = readStored() || getCookie(KEY);
    if (!existing){
      banner?.classList.add('show');
    } else {
      if (existing === "all") loadGoogleTranslate();
    }

    $('#cookieAccept')?.addEventListener('click', () => {
      store("all"); hideBanner(); loadGoogleTranslate();
    });
    $('#cookieEssential')?.addEventListener('click', () => {
      store("essential"); hideBanner();
    });
    $('#cookieReject')?.addEventListener('click', () => {
      store("none"); hideBanner();
    });
    $('#cookieClose')?.addEventListener('click', hideBanner);
  })();

  /* =========================================================
     7) DOM PARTICLES (idle + burst) — NO CLICK
  ========================================================= */
  function ensureParticlesLayer(){
    if (prefersReduce) return null;
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
    const COUNT = isMobile ? 44 : 90;

    for(let i=0;i<COUNT;i++){
      const p = document.createElement('span');
      p.className = "pidle";
      p.style.left = rnd(4, 96) + "%";
      p.style.top  = rnd(6, 94) + "%";
      p.style.setProperty("--ix", rnd(-200, 200).toFixed(0) + "px");
      p.style.setProperty("--iy", rnd(-160, 220).toFixed(0) + "px");
      p.style.setProperty("--idur", rnd(12, 26).toFixed(2) + "s");
      layer.appendChild(p);
    }
  }

  function burstParticles(){
    if (prefersReduce) return;
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

  /* =========================================================
     8) SPACE CANVAS — PRO (NO CLICK)
     - One burst on load/resize
     - Stable drift + subtle swirl
     - Color follows --accent-rgb (no random violet)
========================================================= */
  (function spaceCanvas(){
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
    if (prefersReduce) return;
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
