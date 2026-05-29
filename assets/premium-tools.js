(() => {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function cssVar(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function accentRgb() {
    return cssVar("--accent-rgb", "155,140,255").split(",").map((item) => Number(item.trim()) || 155).slice(0, 3);
  }

  function rgba(alpha) {
    const [r, g, b] = accentRgb();
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function titleFromPath(pathname) {
    if (!pathname || pathname === "/") return "Home";
    return pathname.replace(/^\/|\/$/g, "").split("/").pop().replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function normalizePublicUrl(raw, fallback = "https://clickoz.com/") {
    const value = String(raw || fallback).trim();
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http and https URLs are supported.");
    url.hash = "";
    return url;
  }

  function initDeviceTester() {
    const app = document.getElementById("premiumDeviceApp");
    if (!app) return;

    const targetInput = document.getElementById("deviceTargetInput");
    const pathSelect = document.getElementById("devicePathSelect");
    const pathInput = document.getElementById("devicePathInput");
    const presetSelect = document.getElementById("devicePresetSelect");
    const previewModeSelect = document.getElementById("devicePreviewMode");
    const rotateBtn = document.getElementById("deviceRotateBtn");
    const fitBtn = document.getElementById("deviceFitBtn");
    const zoomOutBtn = document.getElementById("deviceZoomOutBtn");
    const zoomInBtn = document.getElementById("deviceZoomInBtn");
    const reloadBtn = document.getElementById("deviceReloadBtn");
    const openLink = document.getElementById("deviceOpenLink");
    const stage = document.getElementById("deviceStageViewport");
    const frame = document.getElementById("deviceFrame");
    const iframe = document.getElementById("devicePreviewFrame");
    const loadState = document.getElementById("deviceLoadState");
    const deviceName = document.getElementById("deviceName");
    const deviceNote = document.getElementById("deviceNote");
    const previewLabel = document.getElementById("devicePreviewLabel");
    const metricViewport = document.getElementById("deviceMetricViewport");
    const metricScale = document.getElementById("deviceMetricScale");
    const metricTarget = document.getElementById("deviceMetricTarget");
    const metricMode = document.getElementById("deviceMetricMode");
    const previewNote = document.getElementById("devicePreviewNote");

    if (!targetInput || !stage || !iframe) return;

    const presets = {
      mobile: [
        { id: "phone-small", name: "Compact phone", width: 320, height: 740, note: "Small mobile layout check" },
        { id: "phone-modern", name: "Modern phone", width: 390, height: 844, note: "Default mobile viewport" },
        { id: "phone-large", name: "Large phone", width: 430, height: 932, note: "Tall mobile hero check" }
      ],
      tablet: [
        { id: "tablet-portrait", name: "Tablet portrait", width: 768, height: 1024, note: "Tablet reading layout" },
        { id: "tablet-landscape", name: "Tablet landscape", width: 1024, height: 768, note: "Wide tablet controls" },
        { id: "tablet-large", name: "Large tablet", width: 820, height: 1180, note: "Large touch viewport" }
      ],
      desktop: [
        { id: "laptop", name: "Laptop", width: 1366, height: 900, note: "Common notebook viewport" },
        { id: "desktop", name: "Desktop", width: 1440, height: 900, note: "Standard desktop viewport" },
        { id: "wide", name: "Wide desktop", width: 1920, height: 1080, note: "Wide grid and hero check" }
      ],
    };

    const state = {
      family: "mobile",
      presetId: "phone-modern",
      rotated: false,
      fit: true,
      manualScale: 1,
      previewMode: "auto",
      target: "https://clickoz.com/",
      path: "/"
    };

    function isClickozUrl(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return host === "clickoz.com";
      } catch (_) {
        return false;
      }
    }

    function previewModeForUrl(url) {
      const selected = previewModeSelect ? previewModeSelect.value : state.previewMode;
      if (selected === "direct" || selected === "snapshot") return selected;
      return isClickozUrl(url) ? "direct" : "snapshot";
    }

    function setPreviewNote(message) {
      if (previewNote) previewNote.textContent = message || "";
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

    function targetUrl() {
      const target = normalizePublicUrl(targetInput.value || state.target);
      const selectedPath = pathSelect.value === "custom" ? pathInput.value : pathSelect.value;
      const rawPath = String(selectedPath || "/").trim();
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(rawPath)) return normalizePublicUrl(rawPath).toString();
      const next = new URL(rawPath.startsWith("/") ? rawPath : `/${rawPath}`, target.origin);
      return next.toString();
    }

    function renderPresetOptions() {
      const group = presets[state.family] || presets.mobile;
      presetSelect.innerHTML = group.map((item) => `<option value="${item.id}">${item.name} - ${item.width} x ${item.height}</option>`).join("");
      if (!group.some((item) => item.id === state.presetId)) state.presetId = group[0].id;
      presetSelect.value = state.presetId;
    }

    function syncTabs() {
      app.querySelectorAll(".device-tab").forEach((button) => {
        const active = button.dataset.family === state.family;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      app.dataset.deviceFamily = state.family;
    }

    function computeFitScale(width, height) {
      const rect = stage.getBoundingClientRect();
      const availableWidth = Math.max(240, rect.width - 48);
      const availableHeight = Math.max(300, rect.height - 48);
      return clamp(Math.min(availableWidth / width, availableHeight / height, 1), 0.08, 1);
    }

    function currentScale() {
      const { width, height } = viewportSize();
      return state.fit ? computeFitScale(width, height) : state.manualScale;
    }

    function applyViewport() {
      let url;
      try {
        url = targetUrl();
      } catch (error) {
        loadState.textContent = error.message || "Invalid URL";
        loadState.classList.remove("is-ready");
        return null;
      }

      const preset = currentPreset();
      const { width, height } = viewportSize();
      const scale = currentScale();
      const displayWidth = Math.max(1, Math.round(width * scale));
      const displayHeight = Math.max(1, Math.round(height * scale));

      stage.style.setProperty("min-height", `${displayHeight + 72}px`);
      frame.style.width = `${displayWidth}px`;
      frame.style.height = `${displayHeight}px`;
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
      iframe.style.transform = `scale(${scale})`;

      deviceName.textContent = preset.name;
      deviceNote.textContent = `${width} x ${height} CSS pixels - ${preset.note}`;
      previewLabel.textContent = `${state.family.toUpperCase()} / ${width} x ${height}`;
      metricViewport.textContent = `${width} x ${height}`;
      metricScale.textContent = `${Math.round(scale * 100)}%`;
      metricTarget.textContent = url;
      metricMode.textContent = state.fit ? "Fit" : "Manual";
      openLink.href = url;
      return url;
    }

    async function loadSnapshot(url) {
      const response = await fetch(`/api/page-preview?target=${encodeURIComponent(url)}`, { cache: "no-store" });
      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (_) {
        throw new Error("Preview API returned a page instead of JSON. Deploy the Clickoz API route before using snapshot mode.");
      }
      if (!response.ok || !data.ok || !data.html) throw new Error(friendlyPreviewError(data.error || "preview-fetch-failed"));
      return data;
    }

    function friendlyPreviewError(error) {
      const key = String(error || "");
      if (key === "private-host-blocked") return "Private or local network targets are blocked for safety.";
      if (key === "unsupported-protocol") return "Only http and https URLs are supported.";
      if (key === "page-too-large") return "The target page is too large for the browser snapshot preview.";
      if (key.startsWith("upstream-")) return `The target returned ${key.replace("upstream-", "HTTP ")}.`;
      if (key === "not-html") return "The target did not return an HTML page.";
      return "Unable to create a preview for this target.";
    }

    async function loadTarget() {
      const url = applyViewport();
      if (!url) return;
      const mode = previewModeForUrl(url);
      loadState.textContent = "Loading";
      loadState.classList.remove("is-ready");
      if (mode === "snapshot") {
        metricMode.textContent = `${state.fit ? "Fit" : "Manual"} / Snapshot`;
        setPreviewNote("Snapshot mode is used for external sites that block iframe embedding.");
        try {
          const data = await loadSnapshot(url);
          iframe.removeAttribute("src");
          iframe.srcdoc = data.html;
          openLink.href = data.finalUrl || url;
          metricTarget.textContent = data.finalUrl || url;
          loadState.textContent = "Snapshot";
          loadState.classList.add("is-ready");
        } catch (error) {
          loadState.textContent = "Preview blocked";
          loadState.classList.remove("is-ready");
          setPreviewNote(error && error.message ? error.message : "Preview failed. Open live is still available.");
          iframe.removeAttribute("src");
          iframe.srcdoc = `<p style="font:700 16px system-ui;padding:24px;color:#111">Preview unavailable. Use Open live for this target.</p>`;
        }
        return;
      }
      metricMode.textContent = `${state.fit ? "Fit" : "Manual"} / Direct`;
      setPreviewNote("Direct mode keeps Clickoz fully interactive. External sites may still block embedding.");
      iframe.removeAttribute("srcdoc");
      iframe.src = url;
    }

    app.querySelectorAll(".device-tab").forEach((button) => {
      button.addEventListener("click", () => {
        if (!presets[button.dataset.family]) return;
        state.family = button.dataset.family;
        state.presetId = presets[state.family][0].id;
        state.fit = true;
        syncTabs();
        renderPresetOptions();
        applyViewport();
      });
    });

    presetSelect.addEventListener("change", () => {
      state.presetId = presetSelect.value;
      state.fit = true;
      applyViewport();
    });

    targetInput.addEventListener("change", loadTarget);
    pathSelect.addEventListener("change", () => {
      if (pathSelect.value === "custom") {
        pathInput.focus();
        return;
      }
      loadTarget();
    });
    pathInput.addEventListener("change", () => {
      pathSelect.value = "custom";
      loadTarget();
    });
    pathInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        pathSelect.value = "custom";
        loadTarget();
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
      state.fit = false;
      state.manualScale = clamp(currentScale() - 0.08, 0.08, 1.4);
      applyViewport();
    });
    zoomInBtn.addEventListener("click", () => {
      state.fit = false;
      state.manualScale = clamp(currentScale() + 0.08, 0.08, 1.4);
      applyViewport();
    });
    reloadBtn.addEventListener("click", loadTarget);
    previewModeSelect?.addEventListener("change", loadTarget);
    iframe.addEventListener("load", () => {
      loadState.textContent = "Ready";
      loadState.classList.add("is-ready");
    });
    window.addEventListener("resize", () => {
      if (state.fit) applyViewport();
    }, { passive: true });

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        if (state.fit) applyViewport();
      }).observe(stage);
    }

    syncTabs();
    renderPresetOptions();
    loadTarget();
  }

  function initSitemapViewer() {
    const app = document.getElementById("premiumSitemapApp");
    if (!app) return;
    const canvas = document.getElementById("premiumSitemapCanvas");
    const targetInput = document.getElementById("sitemapTargetInput");
    const loadBtn = document.getElementById("sitemapLoadBtn");
    const status = document.getElementById("sitemapStatus");
    const countEl = document.getElementById("sitemapUrlCount");
    const hostEl = document.getElementById("sitemapHost");
    const selectedTitle = document.getElementById("sitemapSelectedTitle");
    const selectedDesc = document.getElementById("sitemapSelectedDesc");
    const resultsEl = document.getElementById("sitemapResults");
    const searchInput = document.getElementById("sitemapSearchInput");

    if (!canvas || !targetInput || !loadBtn || !status || !countEl || !hostEl || !selectedTitle || !selectedDesc || !resultsEl || !searchInput) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const state = {
      nodes: [],
      edges: [],
      selected: "root",
      hover: null,
      tx: 0,
      ty: 0,
      scale: 0.72,
      dragging: false,
      pointerId: null,
      downX: 0,
      downY: 0,
      lastX: 0,
      lastY: 0,
      search: ""
    };

    function buildGraph(urls, origin) {
      const nodes = new Map();
      const edges = [];
      function addNode(id, label, kind, parent, meta = {}) {
        if (!nodes.has(id)) nodes.set(id, { id, label, kind, parent, meta, x: 0, y: 0, r: kind === "root" ? 58 : kind === "section" ? 34 : 20 });
        if (parent && !edges.some((edge) => edge.from === parent && edge.to === id)) edges.push({ from: parent, to: id });
        return nodes.get(id);
      }
      addNode("root", origin.replace(/^https?:\/\//, ""), "root", null, { url: origin, description: "Target sitemap root." });
      const limited = urls.slice(0, 220);
      limited.forEach((item) => {
        let url;
        try { url = new URL(item); } catch (_) { return; }
        const parts = url.pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
        const first = parts[0] || "home";
        const sectionId = `section-${first.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        addNode(sectionId, first === "home" ? "Home" : titleFromPath(first), "section", "root", { url: `${url.origin}/${first === "home" ? "" : `${first}/`}` });
        const slug = url.pathname === "/" ? "home" : url.pathname.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
        addNode(`page-${slug || "home"}`, titleFromPath(url.pathname), "page", sectionId, { url: url.toString(), description: url.pathname });
      });
      return { nodes: Array.from(nodes.values()), edges };
    }

    function layoutGraph() {
      const root = state.nodes.find((node) => node.id === "root");
      if (!root) return;
      root.x = 0;
      root.y = 0;
      const sections = state.nodes.filter((node) => node.kind === "section");
      const radius = window.matchMedia("(max-width: 700px)").matches ? 240 : 330;
      sections.forEach((section, index) => {
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, sections.length);
        section.x = Math.cos(angle) * radius;
        section.y = Math.sin(angle) * radius;
        const pages = state.nodes.filter((node) => node.parent === section.id);
        const fan = Math.max(.5, pages.length * .12);
        pages.forEach((page, pageIndex) => {
          const localAngle = angle + (pages.length === 1 ? 0 : -fan / 2 + (fan * pageIndex) / Math.max(1, pages.length - 1));
          const pageRadius = window.matchMedia("(max-width: 700px)").matches ? 110 : 155;
          page.x = section.x + Math.cos(localAngle) * pageRadius;
          page.y = section.y + Math.sin(localAngle) * pageRadius;
        });
      });
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function project(node) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: rect.width / 2 + (node.x * state.scale) + state.tx,
        y: rect.height / 2 + (node.y * state.scale) + state.ty
      };
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      state.edges.forEach((edge) => {
        const from = state.nodes.find((node) => node.id === edge.from);
        const to = state.nodes.find((node) => node.id === edge.to);
        if (!from || !to) return;
        const a = project(from);
        const b = project(to);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(to.kind === "page" ? .16 : .28);
        ctx.lineWidth = to.kind === "page" ? 1 : 1.8;
        ctx.stroke();
      });
      state.nodes.forEach((node) => {
        const p = project(node);
        const selected = node.id === state.selected;
        const hover = node.id === state.hover;
        const r = node.r * state.scale * (selected ? 1.18 : hover ? 1.08 : 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(7, r), 0, Math.PI * 2);
        ctx.fillStyle = node.kind === "root" ? rgba(.52) : node.kind === "section" ? rgba(.34) : "rgba(255,255,255,.10)";
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeStyle = selected ? "rgba(255,255,255,.92)" : rgba(.36);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.92)";
        ctx.font = `${node.kind === "root" ? 800 : 700} ${node.kind === "page" ? 10 : 12}px Space Grotesk, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = node.label.length > 18 ? `${node.label.slice(0, 17)}...` : node.label;
        ctx.fillText(label, p.x, p.y + Math.max(13, r + 12));
      });
      ctx.restore();
    }

    function nearestNode(x, y) {
      let best = null;
      let distance = Infinity;
      state.nodes.forEach((node) => {
        const p = project(node);
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < distance && d < Math.max(22, node.r * state.scale + 12)) {
          best = node;
          distance = d;
        }
      });
      return best;
    }

    function selectNode(id) {
      const node = state.nodes.find((item) => item.id === id) || state.nodes[0];
      if (!node) return;
      state.selected = node.id;
      selectedTitle.textContent = node.label;
      selectedDesc.textContent = node.meta.url || node.meta.description || "Sitemap node";
      draw();
    }

    function updateResults() {
      const query = state.search.trim().toLowerCase();
      const matches = (query ? state.nodes.filter((node) => `${node.label} ${node.meta.url || ""}`.toLowerCase().includes(query)) : state.nodes.filter((node) => node.kind !== "root")).slice(0, 12);
      resultsEl.innerHTML = "";
      matches.forEach((node) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.sitemapNode = node.id;
        button.textContent = node.label;
        resultsEl.appendChild(button);
      });
    }

    function fitGraph() {
      if (!state.nodes.length) return;
      const xs = state.nodes.map((node) => node.x);
      const ys = state.nodes.map((node) => node.y);
      const rect = canvas.getBoundingClientRect();
      const graphW = Math.max(1, Math.max(...xs) - Math.min(...xs) + 180);
      const graphH = Math.max(1, Math.max(...ys) - Math.min(...ys) + 180);
      state.scale = clamp(Math.min(rect.width / graphW, rect.height / graphH), .22, .95);
      state.tx = 0;
      state.ty = 0;
      draw();
    }

    function parseSitemapLocs(xml) {
      return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
        .map((match) => match[1].trim())
        .filter(Boolean);
    }

    async function fetchTextUrl(url) {
      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    }

    function canUseLocalSitemapFallback(target) {
      const host = window.location.hostname;
      const localHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
      const targetHost = target.hostname.replace(/^www\./, "");
      return localHost && targetHost === "clickoz.com";
    }

    function isLocalPreviewHost() {
      const host = window.location.hostname;
      return host === "localhost" || host === "127.0.0.1" || host === "::1";
    }

    function sitemapCandidateUrls(target) {
      const candidates = [];
      if (canUseLocalSitemapFallback(target)) candidates.push(new URL("/sitemap.xml", window.location.origin).toString());
      candidates.push(target.toString());
      if (!/sitemap|\.xml(?:\.gz)?$/i.test(target.pathname)) {
        candidates.push(new URL("/sitemap.xml", target.origin).toString());
        candidates.push(new URL("/sitemap_index.xml", target.origin).toString());
      }
      const seen = new Set();
      return candidates.filter((item) => {
        if (!item || seen.has(item)) return false;
        seen.add(item);
        return true;
      });
    }

    async function loadSitemapClientSide(target) {
      const errors = [];
      for (const candidate of sitemapCandidateUrls(target)) {
        try {
          const xml = await fetchTextUrl(candidate);
          const locs = parseSitemapLocs(xml);
          if (!locs.length) throw new Error("No <loc> entries found");
          const isIndex = /<sitemapindex[\s>]/i.test(xml);
          const childSitemaps = isIndex ? locs.slice(0, 8) : [];
          const pageUrls = [];
          if (isIndex) {
            for (const child of childSitemaps) {
              try {
                pageUrls.push(...parseSitemapLocs(await fetchTextUrl(child)));
                if (pageUrls.length >= 900) break;
              } catch (_) {}
            }
          }
          const urls = (pageUrls.length ? pageUrls : locs).slice(0, 900);
          return {
            ok: true,
            target: target.origin,
            sitemapUrl: candidate,
            urls,
            childSitemaps,
            limited: urls.length >= 900,
            localFallback: canUseLocalSitemapFallback(target) && candidate.startsWith(window.location.origin)
          };
        } catch (error) {
          errors.push(error && error.message ? error.message : "fetch failed");
        }
      }
      throw new Error(canUseLocalSitemapFallback(target)
        ? "Local sitemap fallback failed. Check that /sitemap.xml is served by the local server."
        : "This target needs the Clickoz API route or a CORS-readable sitemap URL.");
    }

    function sitemapApiUrls(target) {
      const query = `target=${encodeURIComponent(target.toString())}`;
      const urls = [`/api/sitemap-viewer?${query}`];
      if (isLocalPreviewHost() && !canUseLocalSitemapFallback(target)) {
        urls.push(`https://clickoz.com/api/sitemap-viewer?${query}`);
      }
      return urls;
    }

    function canFallbackFromApiError(error) {
      return /Clickoz API route|Failed to fetch|NetworkError|Unexpected token|Load failed/i.test(String(error && error.message || ""));
    }

    async function requestSitemapApi(url) {
      const response = await fetch(url, { cache: "no-store" });
      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (_) {
        throw new Error("Clickoz API route unavailable");
      }
      if (!response.ok || !data.ok) throw new Error(friendlySitemapError(data.error || "Unable to load sitemap."));
      return data;
    }

    async function loadSitemapData(target) {
      const apiErrors = [];
      for (const apiUrl of sitemapApiUrls(target)) {
        try {
          return await requestSitemapApi(apiUrl);
        } catch (error) {
          apiErrors.push(error);
          if (!canFallbackFromApiError(error)) throw error;
        }
      }
      try {
        return loadSitemapClientSide(target);
      } catch (error) {
        throw error || apiErrors[apiErrors.length - 1];
      }
    }

    async function loadSitemap() {
      status.textContent = "Loading sitemap...";
      loadBtn.disabled = true;
      try {
        const target = normalizePublicUrl(targetInput.value || "https://clickoz.com/sitemap.xml", "https://clickoz.com/sitemap.xml");
        const data = await loadSitemapData(target);
        if (!Array.isArray(data.urls) || !data.urls.length) throw new Error("No public sitemap URLs were found for this target.");
        const graph = buildGraph(data.urls || [], data.target || target.origin);
        state.nodes = graph.nodes;
        state.edges = graph.edges;
        layoutGraph();
        fitGraph();
        selectNode("root");
        updateResults();
        countEl.textContent = String((data.urls || []).length);
        hostEl.textContent = data.localFallback
          ? target.hostname.replace(/^www\./, "")
          : new URL(data.sitemapUrl || target.toString()).hostname;
        status.textContent = data.localFallback
          ? `Loaded ${data.urls.length} URLs from the local Clickoz sitemap.`
          : data.limited ? "Loaded first sitemap URLs. Large sitemap was limited." : `Loaded ${data.urls.length} URLs.`;
      } catch (error) {
        status.textContent = error && error.message ? error.message : "Sitemap load failed.";
        countEl.textContent = "0";
        resultsEl.innerHTML = "";
      } finally {
        loadBtn.disabled = false;
      }
    }

    function friendlySitemapError(error) {
      const key = String(error || "");
      if (key === "private-host-blocked") return "Private or local network targets are blocked for safety.";
      if (key === "unsupported-protocol") return "Only http and https sitemap URLs are supported.";
      if (key === "sitemap-too-large") return "This sitemap is too large for the public viewer.";
      if (key === "no-sitemap-found" || key === "no-sitemap-locs") return "No sitemap was found. Try the exact sitemap URL, for example https://example.com/sitemap.xml.";
      if (key.startsWith("upstream-")) return `The sitemap target returned ${key.replace("upstream-", "HTTP ")}.`;
      return "Unable to load this sitemap.";
    }

    canvas.addEventListener("pointerdown", (event) => {
      const rect = canvas.getBoundingClientRect();
      const node = nearestNode(event.clientX - rect.left, event.clientY - rect.top);
      if (node) {
        selectNode(node.id);
        return;
      }
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.downX = event.clientX;
      state.downY = event.clientY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const node = nearestNode(event.clientX - rect.left, event.clientY - rect.top);
      state.hover = node ? node.id : null;
      if (state.dragging && state.pointerId === event.pointerId) {
        state.tx += event.clientX - state.lastX;
        state.ty += event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
      }
      draw();
    });
    canvas.addEventListener("pointerup", () => {
      state.dragging = false;
      state.pointerId = null;
    });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.scale = clamp(state.scale * (event.deltaY < 0 ? 1.08 : .92), .18, 1.8);
      draw();
    }, { passive: false });
    app.addEventListener("click", (event) => {
      const nodeBtn = event.target.closest("[data-sitemap-node]");
      if (nodeBtn) selectNode(nodeBtn.dataset.sitemapNode);
      const focus = event.target.closest("[data-sitemap-focus]");
      if (focus) {
        const section = state.nodes.find((node) => node.kind === "section" && node.label.toLowerCase().includes(focus.dataset.sitemapFocus));
        if (section) selectNode(section.id);
      }
      if (event.target.closest("[data-sitemap-reset]")) fitGraph();
    });
    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      updateResults();
    });
    targetInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") loadSitemap();
    });
    loadBtn.addEventListener("click", loadSitemap);
    window.addEventListener("resize", resizeCanvas, { passive: true });

    resizeCanvas();
    loadSitemap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initDeviceTester();
      initSitemapViewer();
    }, { once: true });
  } else {
    initDeviceTester();
    initSitemapViewer();
  }
})();
