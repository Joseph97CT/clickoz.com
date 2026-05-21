(() => {
  "use strict";

  const isGuide = document.body.classList.contains("page-guide") || (window.location.pathname || "").includes("/guides/");
  if (!isGuide) return;

  document.documentElement.classList.add("guide-stable-mode");
  document.body.classList.add("page-guide");

  const cleanup = () => {
    document.querySelectorAll(".guide-floating-toc, .guide-progress-rail, .back-top").forEach((node) => node.remove());
    document.getElementById("spaceParticles")?.remove();
    document.getElementById("clickozParticles")?.remove();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanup, { once: true });
  } else {
    cleanup();
  }
})();
