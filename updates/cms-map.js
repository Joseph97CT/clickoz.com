(function () {
  "use strict";

  const canvas = document.getElementById("cmsFullMapCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const cms = window.ClickozCMS || { tools: [], guides: [], clusters: {} };
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const dprLimit = isCoarse ? 1.35 : 1.8;
  const state = {
    graph: null,
    width: 1,
    height: 1,
    dpr: 1,
    tx: 0,
    ty: 0,
    scale: isCoarse ? 0.48 : 0.62,
    selected: "root",
    dragging: false,
    pointerId: null,
    downX: 0,
    downY: 0,
    lastX: 0,
    lastY: 0,
    search: "",
    hover: null,
    time: 0,
    expanded: new Set(["root"])
  };

  const els = {
    tools: document.getElementById("cmsMapTools"),
    guides: document.getElementById("cmsMapGuides"),
    nodes: document.getElementById("cmsMapNodes"),
    title: document.getElementById("cmsMapSelectedTitle"),
    desc: document.getElementById("cmsMapSelectedDesc"),
    meta: document.getElementById("cmsMapSelectedMeta"),
    results: document.getElementById("cmsMapSearchResults"),
    search: document.getElementById("cmsMapSearch")
  };

  function cssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function accentRgb() {
    return cssVar("--accent-rgb", "155,140,255").split(",").map((item) => Number(item.trim()) || 155).slice(0, 3);
  }

  function rgba(alpha) {
    const [r, g, b] = accentRgb();
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function titleFromPath(pathname) {
    if (pathname === "/") return "Home";
    return pathname.replace(/^\/|\/$/g, "").split("/").pop().replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function groupBy(items, keyFn) {
    return items.reduce((acc, item) => {
      const key = keyFn(item) || "other";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }

  async function readSitemap() {
    try {
      const response = await fetch("/sitemap.xml", { credentials: "same-origin" });
      if (!response.ok) return [];
      const xml = await response.text();
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      return Array.from(doc.querySelectorAll("loc")).map((node) => {
        try {
          return new URL(node.textContent.trim()).pathname;
        } catch (error) {
          return "";
        }
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function buildGraph(sitemapUrls) {
    const nodes = new Map();
    const edges = [];
    const toolItems = Array.isArray(cms.tools) ? cms.tools : [];
    const guideItems = Array.isArray(cms.guides) ? cms.guides : [];
    const clusters = cms.clusters || {};
    const toolByCategory = groupBy(toolItems, (tool) => tool.category);
    const guideByCategory = groupBy(guideItems, (guide) => guide.category);
    const indexedToolUrls = new Set(toolItems.map((tool) => tool.url));
    const indexedGuideUrls = new Set(guideItems.map((guide) => guide.url));

    function addNode(id, label, kind, parent, meta) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          label,
          kind,
          parent: parent || null,
          children: [],
          meta: meta || {},
          x: 0,
          y: 0,
          radius: kind === "root" ? 66 : kind === "hub" ? 46 : kind === "category" ? 34 : 24
        });
      }
      if (parent && nodes.has(parent)) {
        const parentNode = nodes.get(parent);
        if (!parentNode.children.includes(id)) parentNode.children.push(id);
        if (!edges.some((edge) => edge.from === parent && edge.to === id)) edges.push({ from: parent, to: id });
      }
      return nodes.get(id);
    }

    addNode("root", "Clickoz", "root", null, {
      subtitle: "CMS core",
      description: "Central registry for tools, guides, sitemap pages, product updates and shared design assets.",
      stats: [`${toolItems.length} tools`, `${guideItems.length} guides`, `${Object.keys(clusters).length} tool clusters`]
    });

    [
      ["tools", "Tools", "Browser utilities grouped by real work routes."],
      ["guides", "Guides", "Decision pages connected to the matching tools."],
      ["index", "Index", "Public URLs collected from sitemap.xml."],
      ["assets", "Assets", "Shared CSS, JavaScript, registry and crawl files."],
      ["updates", "Updates", "Visible release log and quality roadmap."],
      ["trust", "Trust", "Legal, privacy and contact layers."]
    ].forEach(([id, label, description]) => addNode(id, label, "hub", "root", { description }));

    Object.entries(clusters).forEach(([key, cluster]) => {
      const items = toolByCategory[key] || [];
      const category = addNode(`tool-cat-${key}`, cluster.title || titleFromPath(key), "category", "tools", {
        description: cluster.description,
        stats: [`${items.length} tools`, cluster.url || ""].filter(Boolean)
      });
      category.meta.categoryKey = key;
      items.forEach((tool) => addNode(`tool-${tool.slug}`, tool.title, "file", category.id, {
        description: tool.description,
        stats: ["Tool page", tool.url, (tool.features || []).slice(0, 3).join(", ")].filter(Boolean),
        url: tool.url
      }));
    });

    Object.entries(toolByCategory).forEach(([key, items]) => {
      if (clusters[key]) return;
      const category = addNode(`tool-cat-${key}`, titleFromPath(key), "category", "tools", {
        description: "Additional tool category from the CMS registry.",
        stats: [`${items.length} tools`]
      });
      items.forEach((tool) => addNode(`tool-${tool.slug}`, tool.title, "file", category.id, {
        description: tool.description,
        stats: ["Tool page", tool.url].filter(Boolean),
        url: tool.url
      }));
    });

    Object.entries(guideByCategory).forEach(([key, items]) => {
      const category = addNode(`guide-cat-${key}`, `${titleFromPath(key)} Guides`, "category", "guides", {
        description: "Guide cluster generated from the Clickoz CMS registry.",
        stats: [`${items.length} guides`]
      });
      items.forEach((guide) => addNode(`guide-${guide.slug}`, guide.title, "file", category.id, {
        description: guide.description,
        stats: ["Guide page", guide.url, guide.tool ? `Tool: ${guide.tool}` : ""].filter(Boolean),
        url: guide.url
      }));
    });

    const corePages = (sitemapUrls.length ? sitemapUrls : ["/", "/tools/", "/guides/", "/updates/", "/privacy/", "/terms/", "/contact/", "/about/", "/legal/"])
      .filter((url) => !indexedToolUrls.has(url) && !indexedGuideUrls.has(url))
      .slice(0, 36);
    corePages.forEach((url) => {
      const id = url === "/" ? "page-home" : `page-${url.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-")}`;
      const parent = /privacy|terms|contact|legal|about/.test(url) ? "trust" : "index";
      addNode(id, titleFromPath(url), "file", parent, {
        description: "Indexed public route from sitemap.xml.",
        stats: ["Sitemap route", url]
      });
    });

    [
      ["asset-registry", "cms-registry.js", "CMS tools, guides and cluster data."],
      ["asset-style", "cms-final.css", "Shared premium CMS visual system."],
      ["asset-runtime", "site.js", "Navigation, particles, command search and app runtime."],
      ["asset-sitemap", "sitemap.xml", "Public discovery layer for search engines."],
      ["asset-robots", "robots.txt", "Crawler rules and sitemap reference."],
      ["asset-vercel", "vercel.json", "Production security and header policy."]
    ].forEach(([id, label, description]) => addNode(id, label, "file", "assets", {
      description,
      stats: ["Inspection only", "Not opened from graph"]
    }));

    [
      ["update-log", "Release board", "Visible update cards and impact filters."],
      ["update-quality", "Quality targets", "Future improvements and feedback loop."],
      ["update-map", "Full CMS map", "This interactive structure view."]
    ].forEach(([id, label, description]) => addNode(id, label, "file", "updates", {
      description,
      stats: ["Updates layer", "Product quality"]
    }));

    return { nodes, edges };
  }

  function isVisible(node) {
    if (!node.parent) return true;
    let current = node;
    while (current.parent) {
      if (!state.expanded.has(current.parent)) return false;
      current = state.graph.nodes.get(current.parent);
      if (!current) return false;
    }
    return true;
  }

  function visibleNodes() {
    return Array.from(state.graph.nodes.values()).filter(isVisible);
  }

  function visibleEdges() {
    const visible = new Set(visibleNodes().map((node) => node.id));
    return state.graph.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to));
  }

  function layoutGraph() {
    const graph = state.graph;
    if (!graph) return;
    const root = graph.nodes.get("root");
    root.x = 0;
    root.y = 0;
    const hubs = ["tools", "guides", "index", "assets", "updates", "trust"].map((id) => graph.nodes.get(id)).filter(Boolean);
    const hubAngles = [-2.85, 2.85, -1.52, 0, -0.8, 1.52];
    const hubRadius = isCoarse ? 315 : 390;
    hubs.forEach((hub, index) => {
      const angle = hubAngles[index] || (index / hubs.length) * Math.PI * 2;
      hub.x = Math.cos(angle) * hubRadius;
      hub.y = Math.sin(angle) * hubRadius;
      const categories = hub.children.map((id) => graph.nodes.get(id)).filter(Boolean);
      const fan = Math.max(.5, categories.length * .22);
      categories.forEach((category, catIndex) => {
        const localAngle = angle + (categories.length === 1 ? 0 : -fan / 2 + (fan * catIndex) / Math.max(1, categories.length - 1));
        const categoryRadius = isCoarse ? 185 : 235;
        category.x = hub.x + Math.cos(localAngle) * categoryRadius;
        category.y = hub.y + Math.sin(localAngle) * categoryRadius;
        const files = category.children.map((id) => graph.nodes.get(id)).filter(Boolean);
        files.forEach((file, fileIndex) => {
          const ring = isCoarse ? 118 + Math.floor(fileIndex / 8) * 54 : 140 + Math.floor(fileIndex / 10) * 64;
          const spread = Math.min(1.25, .22 * Math.max(1, Math.min(files.length, 10)));
          const slot = fileIndex % (isCoarse ? 8 : 10);
          const maxSlot = isCoarse ? 7 : 9;
          const fileAngle = localAngle + (slot / maxSlot - .5) * spread;
          file.x = category.x + Math.cos(fileAngle) * ring;
          file.y = category.y + Math.sin(fileAngle) * ring;
        });
      });
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(320, Math.round(rect.width));
    state.height = Math.max(360, Math.round(rect.height));
    state.dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (!canvas.dataset.centered && state.graph) {
      fitVisibleGraph();
      canvas.dataset.centered = "1";
    }
  }

  function centerMap(targetId) {
    const target = state.graph?.nodes.get(targetId || "root");
    state.tx = state.width / 2 - (target ? target.x * state.scale : 0);
    state.ty = state.height / 2 - (target ? target.y * state.scale : 0);
  }

  function expandAll() {
    state.graph.nodes.forEach((node) => {
      if (node.children.length) state.expanded.add(node.id);
    });
  }

  function fitVisibleGraph() {
    if (!state.graph) return;
    const nodes = visibleNodes();
    if (!nodes.length) {
      centerMap("root");
      return;
    }
    const bounds = nodes.reduce((acc, node) => {
      const labelPad = node.kind === "file" ? (isCoarse ? 108 : 74) : node.kind === "category" ? (isCoarse ? 58 : 42) : 28;
      const pad = node.radius + labelPad;
      acc.minX = Math.min(acc.minX, node.x - pad);
      acc.maxX = Math.max(acc.maxX, node.x + pad);
      acc.minY = Math.min(acc.minY, node.y - pad);
      acc.maxY = Math.max(acc.maxY, node.y + pad);
      return acc;
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const controlbar = document.querySelector(".cms-map-controlbar");
    const barRect = controlbar?.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const measuredTopReserve = barRect ? Math.max(0, Math.ceil(barRect.bottom - canvasRect.top + (window.innerWidth <= 620 ? 28 : 34))) : 0;
    const fallbackTopReserve = window.innerWidth <= 360 ? 178 : window.innerWidth <= 620 ? 150 : window.innerWidth <= 920 ? 132 : 112;
    const topReserve = Math.max(fallbackTopReserve, measuredTopReserve);
    const sidePad = window.innerWidth <= 620 ? 46 : window.innerWidth <= 920 ? 48 : 88;
    const usableWidth = Math.max(220, state.width - sidePad * 2);
    const usableHeight = Math.max(220, state.height - topReserve - 42);
    state.scale = Math.max(isCoarse ? .16 : .22, Math.min(isCoarse ? .56 : .74, Math.min(usableWidth / width, usableHeight / height)));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    state.tx = state.width / 2 - centerX * state.scale;
    state.ty = topReserve + usableHeight / 2 - centerY * state.scale;
  }

  function worldToScreen(node) {
    return {
      x: node.x * state.scale + state.tx,
      y: node.y * state.scale + state.ty,
      radius: Math.max(12, node.radius * state.scale)
    };
  }

  function screenToWorld(x, y) {
    return {
      x: (x - state.tx) / state.scale,
      y: (y - state.ty) / state.scale
    };
  }

  function hitTest(x, y) {
    const point = screenToWorld(x, y);
    const nodes = visibleNodes().slice().reverse();
    return nodes.find((node) => Math.hypot(point.x - node.x, point.y - node.y) <= node.radius + 9) || null;
  }

  function wrapText(text, maxChars) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function drawGrid() {
    ctx.save();
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "rgba(1, 6, 17, .42)";
    ctx.fillRect(0, 0, state.width, state.height);
    const grid = 44 * state.scale;
    const startX = state.tx % grid;
    const startY = state.ty % grid;
    ctx.strokeStyle = rgba(.10);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < state.width; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.height);
    }
    for (let y = startY; y < state.height; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
    }
    ctx.stroke();

    const pulse = prefersReduced ? .2 : (Math.sin(state.time * .0012) + 1) / 2;
    const gradient = ctx.createRadialGradient(state.width / 2, state.height / 2, 20, state.width / 2, state.height / 2, Math.max(state.width, state.height) * .52);
    gradient.addColorStop(0, rgba(.20 + pulse * .08));
    gradient.addColorStop(.48, rgba(.06));
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.restore();
  }

  function drawEdges() {
    ctx.save();
    visibleEdges().forEach((edge) => {
      const from = state.graph.nodes.get(edge.from);
      const to = state.graph.nodes.get(edge.to);
      const a = worldToScreen(from);
      const b = worldToScreen(to);
      const selected = edge.from === state.selected || edge.to === state.selected;
      ctx.strokeStyle = selected ? rgba(.58) : rgba(.18);
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.quadraticCurveTo(mx, my - 18 * state.scale, b.x, b.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawNode(node) {
    const screen = worldToScreen(node);
    const selected = node.id === state.selected;
    const hovered = node.id === state.hover;
    const searchHit = state.search && node.label.toLowerCase().includes(state.search);
    const hasChildren = node.children.length > 0;
    const expanded = state.expanded.has(node.id);
    const alpha = selected ? .88 : hovered || searchHit ? .68 : node.kind === "file" ? .36 : .52;
    const gradient = ctx.createRadialGradient(screen.x - screen.radius * .35, screen.y - screen.radius * .45, 2, screen.x, screen.y, screen.radius * 1.4);
    gradient.addColorStop(0, "rgba(255,255,255,.92)");
    gradient.addColorStop(.36, rgba(alpha));
    gradient.addColorStop(1, "rgba(2,8,20,.90)");

    ctx.save();
    ctx.shadowColor = rgba(selected || hovered ? .56 : .22);
    ctx.shadowBlur = selected || hovered ? 28 : 14;
    ctx.fillStyle = gradient;
    ctx.strokeStyle = rgba(selected || hovered ? .76 : .34);
    ctx.lineWidth = selected ? 2.2 : 1.2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, screen.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (hasChildren) {
      ctx.strokeStyle = rgba(expanded ? .62 : .28);
      ctx.setLineDash(expanded ? [] : [5, 5]);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, screen.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,.95)";
    ctx.font = `800 ${Math.max(10, Math.min(18, screen.radius * .34))}px Oxanium, system-ui`;
    const showLabel = node.kind !== "file" || selected || hovered || searchHit || state.scale > .48;
    if (showLabel) {
      const lines = wrapText(node.label, node.kind === "file" ? 12 : 14);
      const lineHeight = Math.max(10, Math.min(18, screen.radius * .32));
      lines.forEach((line, index) => {
        ctx.fillText(line, screen.x, screen.y + (index - (lines.length - 1) / 2) * lineHeight);
      });
    } else {
      ctx.fillStyle = "rgba(255,255,255,.88)";
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, Math.max(2.2, Math.min(4.2, screen.radius * .22)), 0, Math.PI * 2);
      ctx.fill();
    }
    if (node.meta.subtitle && screen.radius > 32 && showLabel) {
      ctx.fillStyle = "rgba(235,242,255,.72)";
      ctx.font = `700 ${Math.max(9, screen.radius * .17)}px Space Grotesk, system-ui`;
      ctx.fillText(node.meta.subtitle, screen.x, screen.y + screen.radius * .42);
    }
    ctx.restore();
  }

  function draw() {
    if (!state.graph) return;
    state.time = performance.now();
    drawGrid();
    drawEdges();
    visibleNodes().forEach(drawNode);
    if (!prefersReduced) requestAnimationFrame(draw);
  }

  function updateStats() {
    if (els.tools) els.tools.textContent = String((cms.tools || []).length);
    if (els.guides) els.guides.textContent = String((cms.guides || []).length);
    if (els.nodes) els.nodes.textContent = String(state.graph.nodes.size);
  }

  function updateInspector() {
    const node = state.graph.nodes.get(state.selected) || state.graph.nodes.get("root");
    if (!node) return;
    const stats = node.meta.stats || [];
    if (els.title) els.title.textContent = node.label;
    if (els.desc) els.desc.textContent = node.meta.description || "CMS node generated from Clickoz registry data.";
    if (els.meta) {
      els.meta.innerHTML = [
        `<span>Type: ${escapeHtml(node.kind)}</span>`,
        node.children.length ? `<span>${node.children.length} connected nodes. Tap to ${state.expanded.has(node.id) ? "collapse" : "expand"}.</span>` : `<span>Inspection-only file node. No navigation is triggered.</span>`,
        ...stats.map((item) => `<span>${escapeHtml(item)}</span>`)
      ].join("");
    }
  }

  function updateResults() {
    if (!els.results) return;
    const query = state.search;
    if (!query) {
      els.results.innerHTML = "";
      return;
    }
    const matches = Array.from(state.graph.nodes.values())
      .filter((node) => `${node.label} ${node.meta.description || ""} ${(node.meta.stats || []).join(" ")}`.toLowerCase().includes(query))
      .slice(0, 6);
    els.results.innerHTML = matches.map((node) => `<button type="button" data-map-select="${escapeHtml(node.id)}">${escapeHtml(node.label)}<br><small>${escapeHtml(node.kind)}</small></button>`).join("");
  }

  function revealPath(id) {
    let node = state.graph.nodes.get(id);
    while (node && node.parent) {
      state.expanded.add(node.parent);
      node = state.graph.nodes.get(node.parent);
    }
  }

  function selectNode(id, center) {
    if (!state.graph.nodes.has(id)) return;
    revealPath(id);
    state.selected = id;
    if (center) centerMap(id);
    updateInspector();
    updateResults();
    if (prefersReduced) draw();
  }

  function toggleNode(node) {
    selectNode(node.id, false);
    if (!node.children.length) return;
    if (state.expanded.has(node.id)) state.expanded.delete(node.id);
    else state.expanded.add(node.id);
    updateInspector();
    if (prefersReduced) draw();
  }

  function zoomAt(delta, x, y) {
    const before = screenToWorld(x, y);
    state.scale = Math.max(.22, Math.min(2.4, state.scale * delta));
    state.tx = x - before.x * state.scale;
    state.ty = y - before.y * state.scale;
    if (prefersReduced) draw();
  }

  function setupEvents() {
    window.addEventListener("resize", () => {
      resize();
      fitVisibleGraph();
      if (prefersReduced) draw();
    });

    canvas.addEventListener("pointerdown", (event) => {
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.downX = event.clientX;
      state.downY = event.clientY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      state.hover = hitTest(event.clientX - rect.left, event.clientY - rect.top)?.id || null;
      if (state.dragging && state.pointerId === event.pointerId) {
        state.tx += event.clientX - state.lastX;
        state.ty += event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
      }
      if (prefersReduced) draw();
    });

    canvas.addEventListener("pointerup", (event) => {
      const moved = Math.hypot(event.clientX - state.downX, event.clientY - state.downY);
      state.dragging = false;
      state.pointerId = null;
      const rect = canvas.getBoundingClientRect();
      const node = hitTest(event.clientX - rect.left, event.clientY - rect.top);
      if (node && moved < 8) toggleNode(node);
    });

    canvas.addEventListener("pointercancel", () => {
      state.dragging = false;
      state.pointerId = null;
    });

    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAt(event.deltaY < 0 ? 1.09 : .92, event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });

    document.addEventListener("click", (event) => {
      const back = event.target.closest("[data-cms-map-back]");
      if (back) {
        const ref = document.referrer ? new URL(document.referrer, location.href) : null;
        if (ref && ref.origin === location.origin) history.back();
        else location.href = "/updates/";
        return;
      }

      const zoom = event.target.closest("[data-map-zoom]");
      if (zoom) {
        zoomAt(zoom.dataset.mapZoom === "in" ? 1.12 : .9, state.width / 2, state.height / 2);
        return;
      }

      if (event.target.closest("[data-map-reset]")) {
        state.expanded = new Set(["root"]);
        expandAll();
        fitVisibleGraph();
        selectNode("root", false);
        return;
      }

      if (event.target.closest("[data-map-expand]")) {
        expandAll();
        fitVisibleGraph();
        if (prefersReduced) draw();
        return;
      }

      if (event.target.closest("[data-map-collapse]")) {
        state.expanded = new Set(["root"]);
        centerMap("root");
        selectNode("root", false);
        return;
      }

      const focus = event.target.closest("[data-map-focus]");
      if (focus) {
        selectNode(focus.dataset.mapFocus, true);
        state.expanded.add(focus.dataset.mapFocus);
        return;
      }

      const select = event.target.closest("[data-map-select]");
      if (select) selectNode(select.dataset.mapSelect, true);
    });

    els.search?.addEventListener("input", () => {
      state.search = els.search.value.trim().toLowerCase();
      const first = state.search ? Array.from(state.graph.nodes.values()).find((node) => node.label.toLowerCase().includes(state.search)) : null;
      if (first) selectNode(first.id, true);
      updateResults();
      if (prefersReduced) draw();
    });
  }

  async function init() {
    if (new URLSearchParams(location.search).get("from") === "updates") {
      document.body.classList.add("cms-map-from-updates");
    }
    const sitemapUrls = await readSitemap();
    state.graph = buildGraph(sitemapUrls);
    layoutGraph();
    expandAll();
    resize();
    fitVisibleGraph();
    updateStats();
    updateInspector();
    updateResults();
    setupEvents();
    draw();
  }

  init();
})();
