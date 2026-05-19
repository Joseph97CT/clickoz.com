/* /assets/home.js?v=4
   Progressive reveal for the Home page:
   - Quickchips appear 1 -> 2 -> 3
   - Top tools box + pick cards stagger
   - Guides box + guide cards stagger
   - Workflows box + pills + cards stagger
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

  function setupWorkflowsReveal() {
    const wfBox = document.querySelector('section[aria-label="Workflows"] .workflow-box');
    observeReveal(wfBox, { kind: "box", threshold: 0.12 });

    // Pills stagger (faster)
    const pills = document.querySelector('section[aria-label="Workflows"] .workflow-pills');
    observeStagger(pills, ".workflow-pill", { step: 60, threshold: 0.14 });

    // Cards stagger
    const cards = document.querySelector('section[aria-label="Workflows"] .workflow-grid');
    observeStagger(cards, ".workflow-card", { step: 120, threshold: 0.16 });
  }

  function init() {
    setupHeroReveal();
    setupTopToolsReveal();
    setupGuidesReveal();
    setupWorkflowsReveal();
    setupSurpriseWorkflow();
    setupPicksRefresh();
  }

  function setupSurpriseWorkflow() {
    const button = document.querySelector("#surpriseWorkflow");
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
      card.innerHTML = `
        <strong>${pick.title}</strong>
        <span>Open <a href="${pick.tool[0]}">${pick.tool[1]}</a>, then read <a href="${pick.guide[0]}">${pick.guide[1]}</a>.</span>
      `;
    });
  }

  function setupPicksRefresh() {
    const grid = document.querySelector("#picksGrid");
    const button = document.querySelector("#recRefresh");
    if (!grid || !button) return;

    const tools = [
      { href: "/tools/json-formatter/", icon: "{ }", title: "JSON Formatter", desc: "Format, validate, and minify JSON for clean debugging and copy-ready output.", cat: "Developer Utilities" },
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
