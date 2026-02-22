/* =========================================================
   PATCH 2026-02 — Remove #spaceParticles canvas completely
   Paste at the VERY END of /assets/site.js
   ========================================================= */
(() => {
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
