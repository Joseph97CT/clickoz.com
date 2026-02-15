/* =========================================================
   Clickoz — guide.js (SAFE)
   Runs ONLY on /guides/
   - Adds body.page-guide
   - Builds TOC from h2[id]
   - Copy buttons for <pre><code>
   - Smooth scroll with header offset
   - Reading progress bar
========================================================= */

(() => {
  "use strict";

  const path = window.location.pathname || "";
  if (!path.includes("/guides/")) return;

  document.body.classList.add("page-guide");

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const HEADER_OFFSET = 78;
  const ACTIVE_ATTR = "aria-current";

  /* Toast */
  const toastEl = $(".toast");
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.setAttribute("data-show", "true");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.removeAttribute("data-show"), 1200);
  };

  /* Progress */
  const bar = $(".readingbar i");
  const updateProgress = () => {
    if (!bar) return;
    const doc = document.documentElement;
    const st = doc.scrollTop || document.body.scrollTop;
    const sh = doc.scrollHeight - doc.clientHeight;
    const pct = sh > 0 ? (st / sh) * 100 : 0;
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  /* Smooth scroll */
  const smoothTo = (el) => {
    const y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const bindAnchors = () => {
    $$('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      a.addEventListener("click", (e) => {
        e.preventDefault();
        smoothTo(target);
        history.pushState(null, "", `#${id}`);
      });
    });
  };

  /* Wrap <pre><code> into .codeblock + add copy */
  const wrapCode = () => {
    const scope = $("main") || document.body;
    $$("pre", scope).forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;
      if (pre.parentElement && pre.parentElement.classList.contains("codeblock")) return;

      const wrap = document.createElement("div");
      wrap.className = "codeblock";

      const head = document.createElement("div");
      head.className = "codeblock__head";

      const label = document.createElement("span");
      label.textContent = "Code";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copy";
      btn.setAttribute("data-copy", "true");

      head.appendChild(label);
      head.appendChild(btn);

      pre.parentElement.insertBefore(wrap, pre);
      wrap.appendChild(head);
      wrap.appendChild(pre);
    });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
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
      } catch {
        return false;
      }
    }
  };

  const bindCopy = () => {
    $$(".codeblock [data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const wrap = btn.closest(".codeblock");
        const pre = wrap ? $("pre", wrap) : null;
        const text = pre ? (pre.innerText || pre.textContent || "") : "";
        const ok = await copyText(text);

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

  /* TOC build + active section */
  const buildTOC = () => {
    const toc = $(".guide-toc");
    if (!toc) return;

    const existing = $$('a[href^="#"]', toc);
    if (existing.length) return;

    const hs = $$("h2[id]").filter(h => h.id && h.textContent.trim());
    if (!hs.length) return;

    const t = document.createElement("h3");
    t.textContent = "On this page";

    const p = document.createElement("p");
    p.textContent = "Jump to the section you need. The active section updates as you scroll.";

    const ol = document.createElement("ol");
    hs.forEach((h) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent.trim();
      li.appendChild(a);
      ol.appendChild(li);
    });

    toc.appendChild(t);
    toc.appendChild(p);
    toc.appendChild(ol);
  };

  const bindTOCActive = () => {
    const toc = $(".guide-toc");
    if (!toc) return;

    const links = $$('a[href^="#"]', toc);
    if (!links.length) return;

    const ids = links.map(a => (a.getAttribute("href") || "").slice(1)).filter(Boolean);
    const targets = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return;

    const clear = () => links.forEach(a => a.removeAttribute(ACTIVE_ATTR));
    const setActive = (id) => {
      const a = links.find(x => x.getAttribute("href") === `#${id}`);
      if (!a) return;
      clear();
      a.setAttribute(ACTIVE_ATTR, "true");
    };

    let last = targets[0].id;
    setActive(last);

    const io = new IntersectionObserver((entries) => {
      const v = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (v.length) {
        last = v[0].target.id || last;
        setActive(last);
      }
    }, {
      root: null,
      rootMargin: `-${HEADER_OFFSET + 10}px 0px -70% 0px`,
      threshold: [0, 1]
    });

    targets.forEach(t => io.observe(t));
  };

  const fixInitialHash = () => {
    const hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    setTimeout(() => smoothTo(el), 50);
  };

  const init = () => {
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    wrapCode();
    bindCopy();

    buildTOC();
    bindTOCActive();

    bindAnchors();
    fixInitialHash();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
