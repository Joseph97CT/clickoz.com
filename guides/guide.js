/* =========================================================
   Clickoz Guides — Guide Page Script (2026)
   File: guide.js
   Features:
   - TOC active section highlight
   - Smooth scroll with sticky header offset
   - Copy-to-clipboard for code blocks
   - Accessible FAQ accordion
   - Reading progress bar
   ========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Config ---------- */
  const HEADER_OFFSET = 78; // sticky nav height approx
  const ACTIVE_CLASS_ATTR = "aria-current";

  /* ---------- Progress Bar ---------- */
  const progress = $("#readingProgress");
  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  /* ---------- Smooth scroll for internal links ---------- */
  const smoothScrollTo = (targetEl) => {
    if (!targetEl) return;
    const y = targetEl.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const bindSmoothAnchors = () => {
    $$('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      a.addEventListener("click", (e) => {
        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        smoothScrollTo(target);

        // Update URL without jumping
        history.pushState(null, "", `#${id}`);
      });
    });
  };

  /* ---------- TOC active section ---------- */
  const toc = $("#toc");
  const tocLinks = toc ? $$('a[href^="#"]', toc) : [];

  const clearTocActive = () => {
    tocLinks.forEach((a) => a.removeAttribute(ACTIVE_CLASS_ATTR));
  };

  const setTocActiveById = (id) => {
    if (!id) return;
    const active = tocLinks.find((a) => a.getAttribute("href") === `#${id}`);
    if (!active) return;

    clearTocActive();
    active.setAttribute(ACTIVE_CLASS_ATTR, "true");
  };

  const observeHeadings = () => {
    if (!tocLinks.length) return;

    const headingIds = tocLinks
      .map((a) => (a.getAttribute("href") || "").slice(1))
      .filter(Boolean);

    const headings = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!headings.length) return;

    // IntersectionObserver: marks the most recently visible heading
    let lastVisibleId = headingIds[0];

    const io = new IntersectionObserver(
      (entries) => {
        // choose the entry closest to top that is intersecting
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          lastVisibleId = visible[0].target.id || lastVisibleId;
          setTocActiveById(lastVisibleId);
        }
      },
      {
        root: null,
        // Trigger a bit before reaching the heading
        rootMargin: `-${HEADER_OFFSET + 12}px 0px -70% 0px`,
        threshold: [0, 1],
      }
    );

    headings.forEach((h) => io.observe(h));

    // Initial
    setTocActiveById(lastVisibleId);
  };

  /* ---------- Copy-to-clipboard for code blocks ---------- */
  const toast = $("#toast");

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.setAttribute("data-show", "true");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.removeAttribute("data-show"), 1400);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // fallback
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
    $$(".code").forEach((wrap) => {
      const btn = $(".copy-btn", wrap);
      const pre = $("pre", wrap);
      if (!btn || !pre) return;

      btn.addEventListener("click", async () => {
        const ok = await copyText(pre.innerText || pre.textContent || "");
        if (ok) {
          btn.textContent = "Copied";
          showToast("Copied to clipboard");
          setTimeout(() => (btn.textContent = "Copy"), 900);
        } else {
          showToast("Copy failed");
        }
      });
    });
  };

  /* ---------- FAQ accordion (accessible) ---------- */
  const bindFaq = () => {
    $$(".faq-item").forEach((item) => {
      const q = $(".faq-q", item);
      const a = $(".faq-a", item);
      if (!q || !a) return;

      const panelId = q.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : a;

      const setOpen = (open) => {
        item.setAttribute("data-open", open ? "true" : "false");
        q.setAttribute("aria-expanded", open ? "true" : "false");
        if (panel) panel.hidden = !open;
      };

      // initial: ensure hidden is consistent
      const expanded = q.getAttribute("aria-expanded") === "true";
      setOpen(expanded);

      q.addEventListener("click", () => setOpen(!(q.getAttribute("aria-expanded") === "true")));

      // keyboard enhancements (Enter/Space already click on button)
      q.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setOpen(false);
          q.blur();
        }
      });
    });
  };

  /* ---------- Utilities ---------- */
  const handleInitialHash = () => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;

    const el = document.getElementById(hash);
    if (!el) return;

    // Delay to allow layout paint
    setTimeout(() => smoothScrollTo(el), 50);
  };

  /* ---------- Init ---------- */
  const init = () => {
    bindSmoothAnchors();
    observeHeadings();
    bindCopyButtons();
    bindFaq();
    handleInitialHash();

    updateProgress();
    window.addEventListener("scroll", () => {
      updateProgress();
    }, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
