(() => {
  "use strict";

  const shell = document.querySelector(".metaverse-shell");
  const presetSelect = document.querySelector("#presetSelect");
  const pageSelect = document.querySelector("#pageSelect");
  const routeInput = document.querySelector("#routeInput");
  const rotateBtn = document.querySelector("#rotateBtn");
  const fitBtn = document.querySelector("#fitBtn");
  const zoomOutBtn = document.querySelector("#zoomOutBtn");
  const zoomInBtn = document.querySelector("#zoomInBtn");
  const reloadBtn = document.querySelector("#reloadBtn");
  const openLiveLink = document.querySelector("#openLiveLink");
  const stage = document.querySelector("#stageViewport");
  const frame = document.querySelector("#deviceFrame");
  const iframe = document.querySelector("#previewFrame");
  const loadState = document.querySelector("#loadState");
  const deviceName = document.querySelector("#deviceName");
  const deviceNote = document.querySelector("#deviceNote");
  const previewLabel = document.querySelector("#previewLabel");
  const metricViewport = document.querySelector("#metricViewport");
  const metricScale = document.querySelector("#metricScale");
  const metricRoute = document.querySelector("#metricRoute");
  const metricMode = document.querySelector("#metricMode");

  const presets = {
    mobile: [
      { id: "phone-small", name: "Compact phone", width: 320, height: 740, note: "Small Android and tight mobile checks" },
      { id: "phone-modern", name: "Modern phone", width: 390, height: 844, note: "Default mobile debug viewport" },
      { id: "phone-large", name: "Large phone", width: 430, height: 932, note: "Large phone and tall hero fold" }
    ],
    tablet: [
      { id: "tablet-portrait", name: "Tablet portrait", width: 768, height: 1024, note: "Classic tablet portrait layout" },
      { id: "tablet-landscape", name: "Tablet landscape", width: 1024, height: 768, note: "Tablet menu and card width checks" },
      { id: "tablet-large", name: "Large tablet", width: 820, height: 1180, note: "Tall tablet reading experience" }
    ],
    desktop: [
      { id: "laptop", name: "Laptop", width: 1366, height: 900, note: "Common notebook viewport" },
      { id: "desktop", name: "Desktop", width: 1440, height: 900, note: "Standard desktop viewport" },
      { id: "wide", name: "Wide desktop", width: 1920, height: 1080, note: "Wide hero and grid composition" }
    ],
    tv: [
      { id: "tv-fhd", name: "TV Full HD", width: 1920, height: 1080, note: "Large display baseline" },
      { id: "tv-qhd", name: "TV QHD", width: 2560, height: 1440, note: "High-density TV and monitor view" },
      { id: "tv-4k", name: "TV 4K", width: 3840, height: 2160, note: "Extreme wide-scale stress test" }
    ]
  };

  const state = {
    family: "mobile",
    presetId: "phone-modern",
    rotated: false,
    fit: true,
    manualScale: 1,
    route: "/"
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function currentPreset() {
    const group = presets[state.family] || presets.mobile;
    return group.find((item) => item.id === state.presetId) || group[0];
  }

  function viewportSize() {
    const preset = currentPreset();
    return state.rotated
      ? { width: preset.height, height: preset.width }
      : { width: preset.width, height: preset.height };
  }

  function normalizeRoute(value) {
    const raw = String(value || "/").trim();
    if (!raw || raw === "custom") return "/";
    try {
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin) return "/";
      return `${url.pathname}${url.search}${url.hash}` || "/";
    } catch (_error) {
      return raw.startsWith("/") ? raw : `/${raw}`;
    }
  }

  function renderPresetOptions() {
    const group = presets[state.family] || presets.mobile;
    presetSelect.innerHTML = group
      .map((item) => `<option value="${item.id}">${item.name} - ${item.width} x ${item.height}</option>`)
      .join("");
    if (!group.some((item) => item.id === state.presetId)) state.presetId = group[0].id;
    presetSelect.value = state.presetId;
  }

  function syncTabs() {
    document.querySelectorAll(".device-tab").forEach((button) => {
      const active = button.dataset.family === state.family;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    shell.dataset.deviceFamily = state.family;
  }

  function computeFitScale(width, height) {
    const stageRect = stage.getBoundingClientRect();
    const availableWidth = Math.max(240, stageRect.width - 48);
    const availableHeight = Math.max(360, stageRect.height - 48);
    return clamp(Math.min(availableWidth / width, availableHeight / height, 1), 0.08, 1);
  }

  function currentScale() {
    const { width, height } = viewportSize();
    return state.fit ? computeFitScale(width, height) : state.manualScale;
  }

  function applyViewport() {
    const preset = currentPreset();
    const { width, height } = viewportSize();
    const scale = state.fit ? computeFitScale(width, height) : state.manualScale;
    const route = normalizeRoute(state.route);
    const displayWidth = Math.max(1, Math.round(width * scale));
    const displayHeight = Math.max(1, Math.round(height * scale));

    document.documentElement.style.setProperty("--frame-w", String(width));
    document.documentElement.style.setProperty("--frame-h", String(height));
    document.documentElement.style.setProperty("--frame-scale", String(scale));
    document.documentElement.style.setProperty("--frame-display-w", `${displayWidth}px`);
    document.documentElement.style.setProperty("--frame-display-h", `${displayHeight}px`);
    stage.style.setProperty("min-height", `${displayHeight + 62}px`);

    deviceName.textContent = preset.name;
    deviceNote.textContent = `${width} x ${height} CSS pixels - ${preset.note}`;
    previewLabel.textContent = `${state.family.toUpperCase()} / ${width} x ${height}`;
    metricViewport.textContent = `${width} x ${height}`;
    metricScale.textContent = `${Math.round(scale * 100)}%`;
    metricRoute.textContent = route;
    metricMode.textContent = state.fit ? "Fit" : "Manual";
    openLiveLink.href = route;
    routeInput.value = route;

    frame.style.width = `${displayWidth}px`;
    frame.style.height = `${displayHeight}px`;
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.transform = `scale(${scale})`;
  }

  function loadRoute(route = state.route) {
    state.route = normalizeRoute(route);
    loadState.textContent = "Loading";
    loadState.classList.remove("is-ready");
    applyViewport();
    iframe.src = state.route;
  }

  function changeFamily(family) {
    if (!presets[family]) return;
    state.family = family;
    state.presetId = presets[family][0].id;
    state.fit = true;
    syncTabs();
    renderPresetOptions();
    applyViewport();
  }

  document.querySelectorAll(".device-tab").forEach((button) => {
    button.addEventListener("click", () => changeFamily(button.dataset.family));
  });

  presetSelect.addEventListener("change", () => {
    state.presetId = presetSelect.value;
    state.fit = true;
    applyViewport();
  });

  pageSelect.addEventListener("change", () => {
    if (pageSelect.value === "custom") {
      routeInput.focus();
      return;
    }
    loadRoute(pageSelect.value);
  });

  routeInput.addEventListener("change", () => {
    pageSelect.value = "custom";
    loadRoute(routeInput.value);
  });

  routeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      pageSelect.value = "custom";
      loadRoute(routeInput.value);
    }
  });

  rotateBtn.addEventListener("click", () => {
    state.rotated = !state.rotated;
    state.fit = true;
    applyViewport();
  });

  fitBtn.addEventListener("click", () => {
    state.fit = true;
    applyViewport();
  });

  zoomOutBtn.addEventListener("click", () => {
    const scale = currentScale();
    state.fit = false;
    state.manualScale = clamp(scale - 0.08, 0.08, 1.4);
    applyViewport();
  });

  zoomInBtn.addEventListener("click", () => {
    const scale = currentScale();
    state.fit = false;
    state.manualScale = clamp(scale + 0.08, 0.08, 1.4);
    applyViewport();
  });

  reloadBtn.addEventListener("click", () => loadRoute(state.route));

  iframe.addEventListener("load", () => {
    loadState.textContent = "Ready";
    loadState.classList.add("is-ready");
  });

  window.addEventListener("resize", () => {
    if (state.fit) applyViewport();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      if (state.fit) applyViewport();
    }).observe(stage);
  }

  syncTabs();
  renderPresetOptions();
  loadRoute("/");
})();
