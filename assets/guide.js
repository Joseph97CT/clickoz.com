(() => {
  "use strict";

  const isGuide = (window.location.pathname || "").includes("/guides/");
  if (!isGuide) return;

  document.documentElement.classList.add("is-guide", "guide-stable-mode");
  document.body.classList.add("page-guide");
})();
