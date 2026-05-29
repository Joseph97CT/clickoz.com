/* /assets/home.js?v=4
   Progressive reveal for the Home page:
   - Quickchips appear 1 -> 2 -> 3
   - Top tools box + pick cards stagger
   - Guides box + guide cards stagger
   - Workflow box + pills + cards stagger
*/

(() => {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasIO = "IntersectionObserver" in window;

  function revealNow(el) {
    if (!el) return;
    el.classList.add("is-in");
  }

  function observeReveal(el, opts = {}) {
    if (!el) return;
    el.classList.add("reveal");
    if (opts.kind === "box") el.classList.add("reveal-box");

    if (prefersReduced || !hasIO) {
      revealNow(el);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      {
        threshold: opts.threshold ?? 0.14,
        rootMargin: opts.rootMargin ?? "0px 0px -10% 0px",
      }
    );

    io.observe(el);
  }

  function observeStagger(container, itemsSelector, opts = {}) {
    if (!container) return;

    const items = Array.from(container.querySelectorAll(itemsSelector));
    if (!items.length) return;

    container.classList.add("stagger");

    // Set stagger delays on children
    const base = opts.baseDelay ?? 0;
    const step = opts.step ?? 110;

    items.forEach((item, i) => {
      item.style.transitionDelay = `${base + i * step}ms`;
    });

    if (prefersReduced || !hasIO) {
      container.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      {
        threshold: opts.threshold ?? 0.18,
        rootMargin: opts.rootMargin ?? "0px 0px -12% 0px",
      }
    );

    io.observe(container);
  }

  function setupHeroReveal() {
    // Lead line small reveal
    const lead = document.querySelector(".quickchips-lead");
    observeReveal(lead, { threshold: 0.2 });

    // Quickchips container reveal + chips sequential
    const quickchips = document.querySelector(".quickchips");
    if (quickchips) {
      observeReveal(quickchips, { threshold: 0.12, kind: "box" });

      const chips = Array.from(quickchips.querySelectorAll(".qchip"));
      chips.forEach((chip, i) => {
        chip.classList.add("reveal");
        chip.style.transitionDelay = `${i * 140}ms`;
      });

      if (prefersReduced || !hasIO) {
        chips.forEach((c) => c.classList.add("is-in"));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          },
          { threshold: 0.28, rootMargin: "0px 0px -8% 0px" }
        );
        chips.forEach((c) => io.observe(c));
      }
    }
  }

  function setupTopToolsReveal() {
    const recBox = document.querySelector(".rec-wrap");
    observeReveal(recBox, { kind: "box", threshold: 0.12 });

    const picksGrid = document.querySelector("#picksGrid");
    // Stagger pick cards
    observeStagger(picksGrid, ".pick-card", { step: 120, threshold: 0.18 });
  }

  function setupGuidesReveal() {
    // The guides section has .section container > .hero-box
    const guidesBox = document.querySelector('section[aria-label="Guides"] .hero-box');
    observeReveal(guidesBox, { kind: "box", threshold: 0.12 });

    // Stagger guide cards
    const guidesGrid = document.querySelector('section[aria-label="Guides"] .guides-grid');
    observeStagger(guidesGrid, ".guide-card", { step: 95, threshold: 0.14 });
  }

  function setupRouteReveal() {
    const wfBox = document.querySelector('section[aria-label="Next tool routes"] .workflow-box');
    observeReveal(wfBox, { kind: "box", threshold: 0.12 });

    // Pills stagger (faster)
    const pills = document.querySelector('section[aria-label="Next tool routes"] .workflow-pills');
    observeStagger(pills, ".workflow-pill", { step: 60, threshold: 0.14 });

    // Cards stagger
    const cards = document.querySelector('section[aria-label="Next tool routes"] .workflow-grid');
    observeStagger(cards, ".workflow-card", { step: 120, threshold: 0.16 });
  }

  function init() {
    setupHeroReveal();
    setupTopToolsReveal();
    setupGuidesReveal();
    setupRouteReveal();
    setupSurpriseRoute();
    setupPicksRefresh();
    setupTypewriterHeadlines();
    setupWorkdeskHome();
  }

  function setupTypewriterHeadlines() {
    const targets = Array.from(document.querySelectorAll(".type-on-view"));
    if (!targets.length) return;

    if (prefersReduced || !hasIO) {
      targets.forEach((el) => {
        if (!el.dataset.fullText) el.dataset.fullText = el.textContent.trim();
        el.textContent = el.dataset.fullText;
      });
      return;
    }

    function typeText(el) {
      if (el.dataset.typed === "1") return;
      const text = el.dataset.fullText || el.textContent.trim();
      el.dataset.fullText = text;
      el.dataset.typed = "1";
      el.textContent = text;
      el.classList.add("is-typing");
      window.setTimeout(() => el.classList.remove("is-typing"), 620);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          typeText(entry.target);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((el) => {
      el.dataset.fullText = el.textContent.trim();
      io.observe(el);
    });
  }

  function setupSurpriseRoute() {
    const button = document.querySelector("#surpriseRoute");
    const card = document.querySelector("#surpriseCard");
    if (!button || !card) return;

    const flows = [
      {
        title: "YouTube upload sprint",
        tool: ["/tools/youtube-title-generator/", "YouTube Title Generator"],
        guide: ["/guides/youtube-title-thumbnail-checklist/", "Title + Thumbnail Checklist"]
      },
      {
        title: "SEO publish check",
        tool: ["/tools/meta-tags/", "Meta Tag Optimizer"],
        guide: ["/guides/seo-content-checklist/", "SEO Content Checklist"]
      },
      {
        title: "Debug a broken payload",
        tool: ["/tools/json-formatter/", "JSON Formatter"],
        guide: ["/guides/json-formatting-debug/", "Fix JSON Errors"]
      },
      {
        title: "Creator tracking setup",
        tool: ["/tools/utm-builder/", "UTM Builder"],
        guide: ["/guides/youtube-tracking-links/", "YouTube Tracking Links"]
      },
      {
        title: "Clean a messy draft",
        tool: ["/tools/whitespace-cleaner/", "Whitespace Cleaner"],
        guide: ["/guides/text-cleanup-workflow/", "Text Cleanup Workflow"]
      }
    ];

    button.addEventListener("click", () => {
      const pick = flows[Math.floor(Math.random() * flows.length)];
      card.hidden = false;
      card.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      card.innerHTML = `
        <small>Suggested workflow</small>
        <b>${pick.title}</b>
        <p>Open the matching tool, then use the guide to finish the task.</p>
        <div class="surprise-links">
          <a href="${pick.tool[0]}">${pick.tool[1]}</a>
          <a href="${pick.guide[0]}">${pick.guide[1]}</a>
        </div>
      `;
    });
  }

  function setupPicksRefresh() {
    const grid = document.querySelector("#picksGrid");
    const button = document.querySelector("#recRefresh");
    if (!grid || !button) return;

    const tools = [
      { href: "/tools/json-formatter/", icon: "{ }", title: "JSON Formatter", desc: "Format, validate and minify JSON for clean debugging and easy-to-copy output.", cat: "Developer Utilities" },
      { href: "/tools/meta-tags/", icon: "SEO", title: "Meta Tag Optimizer", desc: "Preview titles and descriptions, avoid truncation, and improve click appeal.", cat: "SEO Tools" },
      { href: "/tools/youtube-title-generator/", icon: "YT", title: "YouTube Title Generator", desc: "Generate stronger video title angles with hook, clarity, and keyword intent.", cat: "Creator Tools" },
      { href: "/tools/thumbnail-brief-generator/", icon: "IMG", title: "Thumbnail Brief Generator", desc: "Turn a video idea into a clear thumbnail concept with text, subject, and emotion.", cat: "Creator Tools" },
      { href: "/tools/keyword-density/", icon: "KW", title: "Keyword Density Checker", desc: "Check repeated terms, avoid stuffing, and improve topical clarity before publishing.", cat: "SEO Tools" },
      { href: "/tools/readability-analyzer/", icon: "Aa", title: "Readability Analyzer", desc: "Score paragraphs, reading time, sentence length, and mobile readability signals.", cat: "Writing Tools" },
      { href: "/tools/utm-builder/", icon: "UTM", title: "UTM Builder", desc: "Build clean campaign links for videos, posts, newsletters, and landing pages.", cat: "Marketing Tools" },
      { href: "/tools/youtube-hashtag-generator/", icon: "#", title: "YouTube Hashtag Generator", desc: "Generate focused hashtag sets by topic, niche, and video angle.", cat: "Creator Tools" },
      { href: "/tools/word-counter/", icon: "123", title: "Word Counter", desc: "Count words, characters, reading time, and structure signals for any draft.", cat: "Writing Tools" }
    ];

    let cursor = 3;

    function render() {
      const rotated = tools.slice(cursor).concat(tools.slice(0, cursor)).slice(0, 3);
      cursor = (cursor + 3) % tools.length;
      grid.innerHTML = rotated.map((tool) => `
        <a class="pick-card" href="${tool.href}">
          <div class="pick-head"><span class="pick-icon" aria-hidden="true">${tool.icon}</span><h3 class="pick-title">${tool.title}</h3></div>
          <p class="pick-desc">${tool.desc}</p>
          <div class="pick-meta"><span class="pick-cat">${tool.cat}</span><span class="pick-cta">Open</span></div>
        </a>
      `).join("");
    }

    button.addEventListener("click", render);
  }

  function setupWorkdeskHome() {
    setupLiveDemo();
    setupHeroCommandDesk();
    setupLocalWorkbench();
    setupWorkdeskRefresh();
    bindHomeFavoriteButtons();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function compact(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function words(value) {
    return compact(value).match(/[a-z0-9]+(?:['-][a-z0-9]+)*/gi) || [];
  }

  function setupLiveDemo() {
    const root = document.querySelector("#homeLiveDemo");
    const input = document.querySelector("#liveDemoInput");
    const output = document.querySelector("#liveDemoOutput");
    const sampleButtons = Array.from(document.querySelectorAll("#liveDemoSample, [data-live-demo-sample]"));
    const link = document.querySelector("[data-demo-link]");
    if (!root || !input || !output) return;
    const status = root.querySelector("[data-demo-status]");
    const routeCards = Array.from(root.querySelectorAll("[data-dashboard-route]"));

    let mode = "snippet";
    const samples = {
      snippet: "browser tools with no signup and fast output",
      readability: "This paragraph has a useful idea, but it is trying to do too much at once. Clickoz helps you turn it into a shorter draft, a clearer action and a useful next tool.",
      clean: "  This   AI draft has     broken spacing.\n\n\nIt needs cleaner paragraphs, fewer blank lines, and a version that is easy to copy.  ",
      json: "{\"title\":\"Clickoz work desk\",\"status\":\"fast\",\"tasks\":[\"seo\",\"json\",\"clean text\"]}",
      youtube: "Package a YouTube upload about faster creator workflows"
    };
    const modeLinks = {
      snippet: "/tools/meta-tags/",
      clean: "/tools/whitespace-cleaner/",
      json: "/tools/json-formatter/",
      readability: "/tools/readability-analyzer/",
      youtube: "/tools/youtube-title-generator/"
    };
    const modeCtas = {
      snippet: "Continue in SEO tool",
      clean: "Continue in text cleaner",
      json: "Continue in JSON tool",
      readability: "Continue in readability tool",
      youtube: "Continue in title tool"
    };
    const modeStatus = {
      snippet: "SEO workflow active",
      clean: "Writing workflow active",
      json: "Developer workflow active",
      readability: "Writing workflow active",
      youtube: "Creator workflow active"
    };
    const modeRoute = {
      snippet: "seo",
      clean: "writing",
      json: "dev",
      readability: "writing",
      youtube: "creator"
    };

    function slugify(text) {
      return compact(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "clickoz-workflow";
    }

    function sentenceCount(text) {
      const clean = compact(text);
      return clean ? Math.max(1, clean.split(/(?<=[.!?])\s+/).filter(Boolean).length) : 0;
    }

    function titleCase(text) {
      return compact(text).toLowerCase().replace(/\b[a-z0-9]/g, (char) => char.toUpperCase()).replace(/\b(And|Or|For|With|In|The)\b/g, (word) => word.toLowerCase());
    }

    function buildSnippet(text) {
      const clean = compact(text).replace(/^seo snippet for\s+/i, "").replace(/[.!?]+$/g, "") || samples.snippet;
      const core = /browser tools|no signup|fast output/i.test(clean)
        ? "No-Signup Browser Tools"
        : titleCase(words(clean).slice(0, 5).join(" ") || clean);
      const title = `${core} | Clickoz`;
      const plain = core.toLowerCase().replace("no-signup", "no signup");
      const desc = `Finish ${plain} in one tab. Browser-first, no upload and ready to copy.`;
      return { title, desc, slug: slugify(core).slice(0, 34) };
    }

    function renderSnippet(text) {
      const clean = compact(text) || samples.snippet;
      const built = buildSnippet(clean);
      const title = built.title.length > 62 ? `${built.title.slice(0, 59).trim()}...` : built.title;
      const desc = built.desc.length > 154 ? `${built.desc.slice(0, 151).trim()}...` : built.desc;
      output.innerHTML = `
        <div class="demo-result">
          <small>Search preview</small>
          <strong>${escapeHtml(title)}</strong>
          <p class="demo-url">clickoz.com/${escapeHtml(built.slug)}</p>
          <p class="demo-desc">${escapeHtml(desc)}</p>
          <div class="demo-stat-grid">
            <span><b>${title.length}</b>title chars</span>
            <span><b>${desc.length}</b>desc chars</span>
            <span><b>${Math.max(1, Math.ceil(words(clean).length / 180))}m</b>reading</span>
          </div>
        </div>`;
    }

    function renderReadability(text) {
      const clean = compact(text) || samples.readability;
      const wordList = words(clean);
      const sentences = sentenceCount(clean);
      const avg = sentences ? Math.round(wordList.length / sentences) : 0;
      const pressure = avg > 24 ? "Trim long sentences" : avg > 16 ? "Readable with light edits" : "Fast to scan";
      output.innerHTML = `
        <div class="demo-result">
          <small>Draft pressure</small>
          <strong>${escapeHtml(pressure)}</strong>
          <p>${escapeHtml(clean.length > 170 ? `${clean.slice(0, 167).trim()}...` : clean)}</p>
          <div class="demo-stat-grid">
            <span><b>${wordList.length}</b>words</span>
            <span><b>${sentences}</b>sentences</span>
            <span><b>${avg}</b>avg words</span>
          </div>
        </div>`;
    }

    function renderClean(text) {
      const clean = compact(text) || samples.clean;
      const normalized = clean
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      const removed = Math.max(0, String(text || samples.clean).length - normalized.length);
      output.innerHTML = `
        <div class="demo-result">
          <small>Clean text</small>
          <strong>Ready to copy in one pass</strong>
          <p>${escapeHtml(normalized.length > 170 ? `${normalized.slice(0, 167).trim()}...` : normalized)}</p>
          <div class="demo-stat-grid">
            <span><b>${words(normalized).length}</b>words</span>
            <span><b>${Math.max(0, removed)}</b>chars cut</span>
            <span><b>1</b>next copy</span>
          </div>
        </div>`;
    }

    function renderJson(text) {
      const raw = compact(text) || samples.json;
      let parsed = null;
      let valid = false;
      try {
        parsed = JSON.parse(raw);
        valid = true;
      } catch (_) {}
      const preview = valid ? JSON.stringify(parsed, null, 2) : raw.replace(/,\s*/g, ",\n  ").replace(/{\s*/g, "{\n  ").replace(/\s*}/g, "\n}");
      output.innerHTML = `
        <div class="demo-result">
          <small>JSON fix</small>
          <strong>${valid ? "Valid and formatted" : "Needs validation in the full tool"}</strong>
          <p>${escapeHtml(preview.length > 190 ? `${preview.slice(0, 187).trim()}...` : preview)}</p>
          <div class="demo-stat-grid">
            <span><b>${valid ? "OK" : "!"}</b>status</span>
            <span><b>${preview.split(/\n/).length}</b>lines</span>
            <span><b>JSON</b>next tool</span>
          </div>
        </div>`;
    }

    function renderTitles(text) {
      const clean = compact(text) || samples.youtube;
      const rawTopic = clean.replace(/[.!?]$/g, "").replace(/^how\s+/i, "");
      const topic = /browser tools|seo snippet|no signup/i.test(rawTopic)
        ? "Package a creator upload faster"
        : rawTopic.slice(0, 56);
      output.innerHTML = `
        <div class="demo-result">
          <small>YouTube upload</small>
          <strong>Three usable directions</strong>
          <div class="demo-title-list">
            <span>${escapeHtml(topic || "Package the upload faster")}</span>
            <span>Turn the idea into title, description and tags</span>
            <span>Open the next upload checklist</span>
          </div>
        </div>`;
    }

    function render() {
      const text = input.value;
      if (mode === "clean") renderClean(text);
      else if (mode === "json") renderJson(text);
      else if (mode === "youtube") renderTitles(text);
      else if (mode === "readability") renderReadability(text);
      else renderSnippet(text);
      if (link) {
        link.href = modeLinks[mode] || "/tools/";
        link.textContent = modeCtas[mode] || "Open matching tool";
      }
      if (status) status.textContent = modeStatus[mode] || "Workflow active";
      routeCards.forEach((card) => {
        card.classList.toggle("active", card.dataset.dashboardRoute === modeRoute[mode]);
      });
    }

    function setMode(nextMode, nextText) {
      mode = samples[nextMode] ? nextMode : "snippet";
      root.querySelectorAll("[data-demo-mode]").forEach((item) => item.classList.toggle("active", item.dataset.demoMode === mode));
      if (typeof nextText === "string") input.value = nextText;
      render();
    }

    root.querySelectorAll("[data-demo-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.demoMode || "snippet";
        root.querySelectorAll("[data-demo-mode]").forEach((item) => item.classList.toggle("active", item === button));
        render();
      });
    });

    input.addEventListener("input", render);
    sampleButtons.forEach((sample) => sample.addEventListener("click", () => {
      input.value = samples[mode] || samples.snippet;
      input.focus();
      render();
    }));
    window.ClickozHomeDemo = { setMode, samples, modeLinks };
    render();
  }

  function setupHeroCommandDesk() {
    const input = document.querySelector("#heroJobInput");
    const start = document.querySelector("#heroStartJob");
    const chips = Array.from(document.querySelectorAll("[data-hero-job]"));
    if (!input || !start) return;

    const jobs = {
      json: {
        query: "fix broken json",
        mode: "json",
        sample: "{\"title\":\"Clickoz work desk\",\"status\":\"fast\",\"tasks\":[\"seo\",\"json\",\"clean text\"]}"
      },
      snippet: {
        query: "create seo snippet",
        mode: "snippet",
        sample: "browser tools with no signup and fast output"
      },
      clean: {
        query: "clean pasted text",
        mode: "clean",
        sample: "  This   AI draft has     broken spacing.\n\n\nIt needs cleaner paragraphs, fewer blank lines, and a version that is easy to copy.  "
      },
      youtube: {
        query: "prepare youtube upload",
        mode: "youtube",
        sample: "Package a YouTube upload about faster creator workflows"
      }
    };

    function inferJob(value) {
      const clean = compact(value).toLowerCase();
      if (/json|payload|config|rotto|formatt/.test(clean)) return "json";
      if (/clean|pulir|spazi|testo|ai draft|whitespace/.test(clean)) return "clean";
      if (/youtube|title|titolo|upload|thumbnail|video/.test(clean)) return "youtube";
      if (/seo|snippet|meta|description|descrizione|serp/.test(clean)) return "snippet";
      return "snippet";
    }

    function preview(jobKey, queryText) {
      const job = jobs[jobKey] || jobs.snippet;
      const sample = queryText && queryText.length > 12 ? queryText : job.sample;
      window.ClickozHomeDemo?.setMode(job.mode, sample);
    }

    function openCommand() {
      const query = compact(input.value) || "fast web fix";
      document.dispatchEvent(new CustomEvent("clickoz:open-command", { detail: { query } }));
    }

    chips.forEach((chip) => chip.addEventListener("click", () => {
      const key = chip.dataset.heroJob || "snippet";
      const job = jobs[key] || jobs.snippet;
      input.value = job.query;
      chips.forEach((item) => item.classList.toggle("active", item === chip));
      preview(key, "");
    }));

    input.addEventListener("input", () => {
      chips.forEach((item) => item.classList.toggle("active", item.dataset.heroJob === inferJob(input.value)));
      preview(inferJob(input.value), input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        openCommand();
      }
    });

    start.addEventListener("click", openCommand);
    if (chips.length) {
      chips[1]?.click();
    } else {
      preview("snippet", "");
    }
  }

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function toolBySlug(slug) {
    return window.ClickozCMS?.toolBySlug?.[slug] || null;
  }

  function renderToolList(target, slugs, fallbackSlugs) {
    if (!target) return;
    const picked = slugs.map(toolBySlug).filter(Boolean).slice(0, 4);
    const fallback = fallbackSlugs.map(toolBySlug).filter(Boolean).slice(0, 3);
    const items = picked.length ? picked : fallback;

    if (!items.length) {
      target.innerHTML = `<div class="local-empty">Open a tool once and Clickoz will keep it ready in this browser.</div>`;
      return;
    }

    target.innerHTML = items.map((tool) => `
      <a href="${tool.url}">
        <span><strong>${escapeHtml(tool.title)}</strong><br>${escapeHtml(tool.description)}</span>
        <b>Open</b>
      </a>
    `).join("");
  }

  function setupLocalWorkbench() {
    const recentTarget = document.querySelector("#recentToolsList");
    const favoriteTarget = document.querySelector("#favoriteToolsList");
    const recent = readStorage("clickoz_recent_tools", []);
    const favorites = readStorage("clickoz_favorite_tools", []);
    renderToolList(recentTarget, recent, ["meta-tags", "word-counter", "youtube-title-generator"]);
    renderToolList(favoriteTarget, favorites, ["json-formatter", "utm-builder", "readability-analyzer"]);
  }

  function setFavoriteButtonState(button, saved) {
    button.classList.toggle("is-saved", saved);
    button.textContent = saved ? "Saved" : "Save";
    button.setAttribute("aria-pressed", String(saved));
  }

  function bindHomeFavoriteButtons() {
    const buttons = Array.from(document.querySelectorAll("[data-favorite-tool]"));
    if (!buttons.length) return;

    function sync() {
      const favorites = readStorage("clickoz_favorite_tools", []);
      document.querySelectorAll("[data-favorite-tool]").forEach((button) => {
        setFavoriteButtonState(button, favorites.includes(button.dataset.favoriteTool));
      });
      setupLocalWorkbench();
    }

    buttons.forEach((button) => {
      if (button.dataset.favoriteBound === "true") return;
      button.dataset.favoriteBound = "true";
      button.addEventListener("click", () => {
        const slug = button.dataset.favoriteTool;
        if (!slug) return;
        const favorites = readStorage("clickoz_favorite_tools", []);
        const next = favorites.includes(slug) ? favorites.filter((item) => item !== slug) : [slug, ...favorites.filter((item) => item !== slug)].slice(0, 24);
        writeStorage("clickoz_favorite_tools", next);
        sync();
      });
    });
    sync();
    if (document.documentElement.dataset.homeFavoritesSyncBound !== "true") {
      document.documentElement.dataset.homeFavoritesSyncBound = "true";
      document.addEventListener("clickoz:favorites-changed", sync);
    }
  }

  function setupWorkdeskRefresh() {
    const grid = document.querySelector("#picksGrid.desk-tool-grid");
    const button = document.querySelector("#workdeskRefresh");
    if (!grid || !button || !window.ClickozCMS?.tools) return;

    const sets = [
      ["meta-tags", "word-counter", "youtube-title-generator", "json-formatter"],
      ["utm-builder", "readability-analyzer", "whitespace-cleaner", "thumbnail-brief-generator"],
      ["keyword-density", "url-encoder", "youtube-description-generator", "text-case-converter"],
      ["serp-preview", "base64", "tiktok-hook-generator", "newsletter-subject-generator"]
    ];
    const labels = {
      "meta-tags": ["Fix in 30 sec", "Used for SEO publishing"],
      "word-counter": ["Live count", "Used for client work"],
      "youtube-title-generator": ["Upload sprint", "Used for creator uploads"],
      "json-formatter": ["Debug now", "Used for fast formatting"],
      "utm-builder": ["Track clicks", "Used for campaigns"],
      "readability-analyzer": ["Trim friction", "Used for readable drafts"],
      "whitespace-cleaner": ["Clean paste", "Used before copying"],
      "thumbnail-brief-generator": ["Brief faster", "Used for upload packaging"],
      "keyword-density": ["Check focus", "Used for SEO review"],
      "url-encoder": ["Repair links", "Used for query strings"],
      "youtube-description-generator": ["Description flow", "Used after titles"],
      "text-case-converter": ["Case fix", "Used for cleanup"],
      "serp-preview": ["Preview result", "Used before publishing"],
      "base64": ["Decode fast", "Used for payloads"],
      "tiktok-hook-generator": ["Hook sprint", "Used for short-form"],
      "newsletter-subject-generator": ["Open angle", "Used for newsletters"]
    };
    let cursor = 1;

    function render(slugs) {
      grid.innerHTML = slugs.map((slug) => {
        const tool = toolBySlug(slug);
        if (!tool) return "";
        const label = labels[slug] || ["Quick fix", "Used for web work"];
        return `
          <article class="desk-tool-card" data-tool-slug="${tool.slug}">
            <a href="${tool.url}">
              <span class="time-chip">${escapeHtml(label[0])}</span>
              <h3>${escapeHtml(tool.title)}</h3>
              <p>${escapeHtml(tool.description)}</p>
              <div><small>${escapeHtml(label[1])}</small><b>Open</b></div>
            </a>
            <button type="button" data-favorite-tool="${tool.slug}" aria-label="Save ${escapeHtml(tool.title)}">Save</button>
          </article>`;
      }).join("");
      bindHomeFavoriteButtons();
    }

    button.addEventListener("click", () => {
      render(sets[cursor] || sets[0]);
      cursor = (cursor + 1) % sets.length;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
