(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function addProgressRail() {
    if (!document.body.classList.contains("page-guide") || $(".guide-progress-rail")) return;
    const rail = document.createElement("div");
    rail.className = "guide-progress-rail";
    rail.innerHTML = "<i></i>";
    document.body.appendChild(rail);
    const bar = $("i", rail);
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      bar.style.height = `${Math.max(0, Math.min(100, pct))}%`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function addBackTop() {
    if ($("#backTop")) return;
    const btn = document.createElement("button");
    btn.id = "backTop";
    btn.className = "back-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = "&uarr;";
    document.body.appendChild(btn);
    const update = () => btn.classList.toggle("show", window.scrollY > 520);
    update();
    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function addReadingToc() {
    if (!document.body.classList.contains("page-guide") || $(".guide-floating-toc")) return;
    const headings = $$("main h2").filter((h) => h.textContent.trim());
    if (headings.length < 4) return;
    headings.forEach((h, index) => {
      if (!h.id) h.id = `guide-section-${index + 1}`;
    });
    const toc = document.createElement("aside");
    toc.className = "guide-floating-toc";
    toc.innerHTML = `<strong>On this guide</strong>${headings.slice(0, 8).map((h) => `<a href="#${h.id}">${h.textContent.trim()}</a>`).join("")}`;
    document.body.appendChild(toc);
  }

  function init() {
    addBackTop();
    addProgressRail();
    addReadingToc();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
