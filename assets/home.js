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

    // -----------------------------
    // YOUR EXISTING PICKS LOGIC HERE
    // -----------------------------
    // Se avevi già logica in home.js per:
    // - #recRefresh click
    // - random “monthly slot”
    // incollala sotto senza cambiare nient’altro.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
