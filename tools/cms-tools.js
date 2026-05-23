(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cms = window.ClickozCMS || {};
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const allowedResultTags = new Set(["DIV", "ARTICLE", "SPAN", "STRONG", "B", "P", "BR", "UL", "OL", "LI", "SMALL", "CODE", "PRE"]);
  const allowedResultClasses = new Set([
    "cms-output-pack", "bio-pack", "serp-pack", "cms-result-hero", "cms-output-cards", "cms-output-list",
    "serp-url", "serp-title", "serp-desc", "cms-quality-grid", "cms-quality-card"
  ]);
  const words = (t) => (String(t || "").match(/[a-z0-9]+(?:['-][a-z0-9]+)*/gi) || []);
  const field = (id, label, type = "text", value = "", full = false, options = null, placeholder = "") => ({ id, label, type, value, full, options, placeholder });
  const normUrl = (v) => /^https?:\/\//i.test(String(v || "").trim()) ? String(v).trim() : `https://${String(v || "").trim()}`;
  const int = (v, d = 0) => Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d;
  const cssId = (id) => (window.CSS && CSS.escape) ? CSS.escape(id) : String(id).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  /**
   * Shared CMS interaction model. Keep copy, stage names and timing here so
   * individual tools can stay focused on input/output logic.
   */
  const toolUx = Object.freeze({
    inputDelay: 220,
    revealStepMs: 70,
    sequence: {
      writing: [
        ["Paste", "Use a real paragraph, caption or intro, not a perfect sample."],
        ["Check", "Look for length, density and the first edit that removes friction."],
        ["Finish", "Copy the cleaner version, then test readability if it still feels heavy."]
      ],
      seo: [
        ["Paste", "Start with the real page title, URL, snippet or keyword section."],
        ["Check", "Use the result to decide what should change before publishing."],
        ["Continue", "Open the next SEO tool so title, slug and preview stay aligned."]
      ],
      dev: [
        ["Paste", "Use the exact value from the payload, URL, config or markup."],
        ["Inspect", "Read the formatted result and the risk note before copying."],
        ["Apply", "Copy only into the matching context; encoding rules change by context."]
      ],
      youtube: [
        ["Idea", "Start with the real upload promise, not a generic topic."],
        ["Package", "Compare hook, thumbnail promise, description and metadata direction."],
        ["Upload", "Move to the next YouTube tool so the upload stays consistent."]
      ],
      tracking: [
        ["Campaign", "Enter the real source, medium, campaign and landing URL."],
        ["Clean", "Check naming and encoded parameters before the link is shared."],
        ["Reuse", "Keep the same naming rule across every channel."]
      ],
      web: [
        ["Target", "Use the real domain, IP, timestamp, color or generated value."],
        ["Verify", "Treat the output as a quick diagnostic, not a production guarantee."],
        ["Repeat", "Save the result with the tested context so the check is reproducible."]
      ],
      socialai: [
        ["Brief", "Write the real post, creator angle or audience problem."],
        ["Shape", "Keep one clear hook, one useful body section and one CTA."],
        ["Post", "Remove any line that could fit every creator before publishing."]
      ],
      default: [
        ["Start", "Paste the real job you need to finish."],
        ["Review", "Use the result to make one clear decision."],
        ["Next", "Continue with the related tool or guide while the context is fresh."]
      ]
    },
    runStates: {
      idle: ["Ready", "Waiting for input", "Output will update here"],
      running: ["Reading input", "Building result", "Preparing copy"],
      ready: ["Input checked", "Result built", "Ready to copy"],
      error: ["Input checked", "Needs review", "Try again"]
    }
  });

  async function copyText(text) {
    try { await navigator.clipboard.writeText(String(text || "")); return true; }
    catch (_) {
      const ta = document.createElement("textarea");
      ta.value = String(text || "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function duration(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    if (s < 60) return `${s} sec`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m} min ${r} sec` : `${m} min`;
  }

  function renderFields(config, root) {
    const form = $(".cms-form-grid", root);
    form.innerHTML = config.fields.map((f) => {
      const cls = `cms-field type-${f.type}${f.full ? " full" : ""}`;
      if (f.type === "textarea") return `<div class="${cls}"><label for="${f.id}">${esc(f.label)}</label><textarea id="${f.id}" placeholder="${esc(f.placeholder)}">${esc(f.value)}</textarea></div>`;
      if (f.type === "select") return `<div class="${cls}"><label for="${f.id}">${esc(f.label)}</label><select id="${f.id}">${f.options.map((o) => `<option value="${esc(o.value)}"${o.value === f.value ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select></div>`;
      return `<div class="${cls}"><label for="${f.id}">${esc(f.label)}</label><input id="${f.id}" type="${esc(f.type)}" value="${esc(f.value)}" placeholder="${esc(f.placeholder)}" /></div>`;
    }).join("");
  }

  function vals(root) {
    const out = {};
    root.querySelectorAll("input, textarea, select").forEach((el) => { out[el.id] = el.value; });
    return out;
  }

  function result(status, metrics, output, html = "") { return { status, metrics, output, html }; }
  function metric(label, value) { return [label, String(value)]; }

  function renderSafeHtml(target, html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("*").forEach((node) => {
      if (!allowedResultTags.has(node.tagName)) {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || name === "style" || name === "srcdoc") node.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
        if (name === "class") {
          const safe = attr.value.split(/\s+/).filter((cls) => allowedResultClasses.has(cls)).join(" ");
          if (safe) node.setAttribute("class", safe);
          else node.removeAttribute("class");
        }
      });
    });
    target.replaceChildren(template.content);
  }

  function appendText(parent, tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = String(text || "");
    parent.appendChild(el);
    return el;
  }

  function renderTextOutput(target, text) {
    const raw = String(text || "").trim();
    target.replaceChildren();
    if (!raw) return;

    if (/^\s*[\[{]/.test(raw)) {
      appendText(target, "pre", "cms-output-pre", raw);
      return;
    }

    const lines = raw.split(/\r?\n/);
    const box = document.createElement("div");
    box.className = "cms-text-output";
    let index = 0;
    const first = lines.find((line) => line.trim());
    const firstClean = first ? first.trim() : "";
    const firstLooksLikeTitle = firstClean && !/:/.test(firstClean) && !/^[\d\-+*]/.test(firstClean) && firstClean.length <= 80;
    if (firstLooksLikeTitle) {
      appendText(box, "div", "cms-text-title", first.trim());
      index = lines.indexOf(first) + 1;
    }

    let currentTitle = "";
    let currentLines = [];
    const flush = () => {
      const body = currentLines.join("\n").trim();
      if (!currentTitle && !body) return;
      const section = document.createElement("div");
      section.className = "cms-text-section";
      appendText(section, "b", "", currentTitle || "Output");
      appendText(section, "span", "", body || "Ready.");
      box.appendChild(section);
      currentTitle = "";
      currentLines = [];
    };

    lines.slice(index).forEach((line) => {
      const clean = line.trim();
      if (!clean) {
        if (currentLines.length) currentLines.push("");
        return;
      }
      if (/^[A-Z0-9][A-Za-z0-9 /&()+.-]{1,48}:$/.test(clean)) {
        flush();
        currentTitle = clean.replace(/:$/, "");
        return;
      }
      currentLines.push(line);
    });
    flush();

    if (!box.querySelector(".cms-text-section")) {
      const section = document.createElement("div");
      section.className = "cms-text-section";
      appendText(section, "b", "", "Output");
      appendText(section, "span", "", raw);
      box.appendChild(section);
    }

    target.appendChild(box);
  }

  const statePrefix = "clickoz_tool_state:";
  const historyPrefix = "clickoz_tool_history:";
  const fieldControls = (root) => Array.from(root.querySelectorAll(".cms-form-grid input, .cms-form-grid textarea, .cms-form-grid select"));
  const stateKey = (slug) => `${statePrefix}${slug}`;
  const historyKey = (slug) => `${historyPrefix}${slug}`;

  function safeStorage(method, key, value) {
    try {
      if (method === "get") return localStorage.getItem(key);
      if (method === "set") localStorage.setItem(key, value);
      if (method === "remove") localStorage.removeItem(key);
    } catch (_) {}
    return null;
  }

  function capText(value, max = 16000) {
    const text = String(value ?? "");
    return text.length > max ? text.slice(0, max) : text;
  }

  function toolValues(root, max = 16000) {
    const values = {};
    fieldControls(root).forEach((el) => { values[el.id] = capText(el.value, max); });
    return values;
  }

  function applyValues(root, values = {}) {
    fieldControls(root).forEach((el) => {
      if (Object.prototype.hasOwnProperty.call(values, el.id)) el.value = values[el.id];
    });
  }

  function summarizeValues(values) {
    const first = Object.values(values || {}).map((v) => String(v || "").trim()).find(Boolean);
    if (!first) return "Empty input";
    return first.replace(/\s+/g, " ").slice(0, 82);
  }

  function toolFamily(tool, slug = "") {
    const category = String(tool?.category || "").toLowerCase();
    if (toolUx.sequence[category]) return category;
    if (/meta|serp|keyword|slug|robots/i.test(slug)) return "seo";
    if (/json|minifier|url|base64|entity|regex|diff/i.test(slug)) return "dev";
    if (/dns|http|subnet|password|uuid|timestamp|color/i.test(slug)) return "web";
    if (/youtube|thumbnail|chapter|video|community/i.test(slug)) return "youtube";
    if (/utm|tracking|campaign/i.test(slug)) return "tracking";
    if (/word|character|readability|whitespace|case/i.test(slug)) return "writing";
    return "default";
  }

  function humanSampleFor(tool) {
    const title = tool?.title || "this tool";
    const slug = tool?.slug || "";
    if (/caption/i.test(slug)) return "New behind-the-scenes shoot in Milan, with one clear tip for creators who want cleaner content.";
    if (/bio/i.test(slug)) return "Fashion model in Milan. Editorial shoots, brand campaigns and clean portfolio work. DM for bookings.";
    if (/thread/i.test(slug)) return "A small SEO workflow that fixes title, snippet, readability and internal links before a page goes live.";
    if (/calendar|planner|repurposing/i.test(slug)) return "One long YouTube video about fixing messy content workflows into Shorts, posts, newsletter and community updates.";
    if (/media-kit/i.test(slug)) return "Creator in productivity and SEO. 42k monthly views, practical tutorials, brand-safe audience and newsletter reach.";
    if (/newsletter/i.test(slug)) return "A short issue showing how to finish SEO and creator tasks faster without opening five different apps.";
    if (/disclosure/i.test(slug)) return "A product review post that includes an affiliate link and one AI-assisted summary paragraph.";
    if (/alt-text/i.test(slug)) return "A mobile screenshot of a tool result card showing word count, reading time and a copy button.";
    if (/cta/i.test(slug)) return "A creator post about saving time before publishing: ask people to save the checklist, try the tool and share the result.";
    if (/hook|shorts|reels|tiktok/i.test(slug)) return "Creators waste ten minutes rewriting the same idea for every platform before they can post.";
    if (/youtube|thumbnail|chapter|video|community/i.test(slug) || tool?.category === "youtube") return "A YouTube upload about cleaning messy text, checking the snippet and preparing the tracking link before publishing.";
    if (tool?.category === "socialai") return "A practical post for creators who want to turn one rough idea into a hook, useful body and platform-native CTA.";
    if (tool?.category === "seo") return "A tool page that helps creators finish a specific SEO task in the browser without signup.";
    if (tool?.category === "writing") return "Most readers scan on mobile first. Shorter paragraphs, clearer headings and one direct next action make the page easier to use.";
    if (tool?.category === "dev") return "{\"campaign\":\"spring launch\",\"source\":\"youtube description\",\"tools\":[\"formatter\",\"encoder\"]}";
    if (tool?.category === "web") return "clickoz.com";
    if (tool?.category === "tracking") return "Landing page: https://example.com/offer, source: youtube, medium: description, campaign: spring launch";
    return `${title}: turn the rough input into one result that can be copied, checked and used in the next workflow step.`;
  }

  function saveToolState(root, slug) {
    if (!slug) return;
    const payload = { ts: Date.now(), values: toolValues(root) };
    safeStorage("set", stateKey(slug), JSON.stringify(payload));
  }

  function restoreToolState(root, slug) {
    if (!slug) return false;
    try {
      const payload = JSON.parse(safeStorage("get", stateKey(slug)) || "null");
      if (!payload || !payload.values) return false;
      applyValues(root, payload.values);
      return true;
    } catch (_) {
      return false;
    }
  }

  function readHistory(slug) {
    try {
      const items = JSON.parse(safeStorage("get", historyKey(slug)) || "[]");
      return Array.isArray(items) ? items : [];
    } catch (_) {
      return [];
    }
  }

  function pushToolHistory(root, slug) {
    if (!slug) return;
    const values = toolValues(root, 4000);
    const label = summarizeValues(values);
    if (label === "Empty input") return;
    const next = { ts: Date.now(), label, values };
    const items = readHistory(slug)
      .filter((item) => item && JSON.stringify(item.values) !== JSON.stringify(values))
      .slice(0, 5);
    safeStorage("set", historyKey(slug), JSON.stringify([next, ...items].slice(0, 6)));
  }

  function ensureToolUx(root) {
    const app = $(".cms-tool-app", root);
    if (!app) return;
    if (!$(".cms-tool-feedback", root)) {
      app.insertAdjacentHTML("afterbegin", `<div class="cms-tool-feedback" aria-live="polite"></div>`);
    }
    if (!$(".cms-example-sequence", root)) {
      $(".cms-example-box pre", root)?.insertAdjacentHTML("afterend", `<div class="cms-example-sequence" aria-label="Example workflow sequence"></div>`);
    }
    if (!$(".cms-local-history", root)) {
      $(".cms-example-box", root)?.insertAdjacentHTML("afterend", `<details class="cms-local-history" aria-label="Recent local inputs"><summary><strong>Recent inputs</strong><span>Local only</span></summary><div class="cms-history-items"></div></details>`);
    }
    if (!$(".cms-run-meter", root)) {
      $(".cms-tool-actions", root)?.insertAdjacentHTML("afterend", `<div class="cms-run-meter" aria-live="polite"></div>`);
    }
    if (!$(".cms-shortcut-row", root)) {
      $(".cms-tool-actions", root)?.insertAdjacentHTML("beforebegin", `<div class="cms-shortcut-row" aria-label="Keyboard shortcuts"><span>Ctrl+Enter</span><span>Ctrl+Shift+C</span><span>Ctrl+Shift+D</span></div>`);
    }
  }

  function renderExampleSequence(root, tool, example, index = 0, state = "preview") {
    const box = $(".cms-example-sequence", root);
    if (!box) return;
    const slug = root.getAttribute("data-tool-app") || "";
    const family = toolFamily(tool, slug);
    const steps = toolUx.sequence[family] || toolUx.sequence.default;
    const label = typeof example === "string" ? `Example ${index + 1}` : example?.label || `Example ${index + 1}`;
    box.dataset.state = state;
    box.innerHTML = `<div class="cms-sequence-head"><strong>Sample flow</strong><span>${esc(label)}</span></div>
      <div class="cms-sequence-track">${steps.map(([title, text], stepIndex) => `<span class="cms-sequence-step${stepIndex === 0 ? " is-active" : ""}" style="--seq-delay:${stepIndex * toolUx.revealStepMs}ms" title="${esc(text)}"><b>${esc(stepIndex + 1)} ${esc(title)}</b><span>${esc(text)}</span></span>`).join("")}</div>`;
  }

  function renderRunMeter(root, tool, state = "idle") {
    const meter = $(".cms-run-meter", root);
    if (!meter) return;
    const steps = toolUx.runStates[state] || toolUx.runStates.idle;
    const activeIndex = state === "ready" ? 2 : state === "running" ? 1 : state === "error" ? 1 : 0;
    meter.dataset.state = state;
    meter.innerHTML = steps.map((label, index) => `<span class="${index <= activeIndex ? "is-active" : ""}"><i aria-hidden="true"></i>${esc(label)}</span>`).join("");
  }

  function renderToolHistory(root, slug) {
    const box = $(".cms-local-history", root);
    const list = $(".cms-history-items", root);
    if (!box || !list) return;
    const items = readHistory(slug);
    box.classList.toggle("is-empty", !items.length);
    box.hidden = !items.length;
    list.innerHTML = items.length
      ? items.map((item, index) => {
        const date = new Date(item.ts || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const label = item.label || "Saved input";
        return `<button type="button" class="cms-history-chip" data-history="${index}" title="Restore ${esc(label)}" aria-label="Restore local input from ${esc(date)}: ${esc(label)}"><span>${esc(date)}</span>${esc(label)}</button>`;
      }).join("")
      : `<span class="cms-history-empty">Run a real job and it appears here.</span>`;
  }

  function flashTool(root, message, tone = "ok") {
    const feedback = $(".cms-tool-feedback", root);
    if (!feedback) return;
    clearTimeout(root._feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.tone = tone;
    feedback.classList.add("show");
    root._feedbackTimer = setTimeout(() => feedback.classList.remove("show"), 1800);
  }

  function duplicateFocusedField(root) {
    const el = document.activeElement;
    if (!el || !root.contains(el) || !/^(TEXTAREA|INPUT)$/i.test(el.tagName)) return false;
    const selected = typeof el.selectionStart === "number" && el.selectionEnd > el.selectionStart
      ? el.value.slice(el.selectionStart, el.selectionEnd)
      : el.value;
    if (!selected) return false;
    el.value = el.value ? `${el.value}${el.tagName === "TEXTAREA" ? "\n\n" : " "}${selected}` : selected;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function selectOutput(root) {
    try {
      const out = $(".cms-output", root);
      if (!out || !out.textContent.trim()) return false;
      const range = document.createRange();
      range.selectNodeContents(out);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch (_) {
      return false;
    }
  }

  function textStats(text) {
    const w = words(text);
    const chars = String(text || "").length;
    const sentences = String(text || "").trim() ? Math.max(1, String(text).split(/(?<=[.!?])\s+/).filter(Boolean).length) : 0;
    const paragraphs = String(text || "").trim() ? String(text).trim().split(/\n{2,}/).filter(Boolean).length : 0;
    return { w, chars, sentences, paragraphs };
  }

  function scoreHook(text) {
    const t = String(text || "").trim();
    let score = 45;
    if (t.length >= 24 && t.length <= 90) score += 16;
    if (/[?]/.test(t)) score += 8;
    if (/\b(how|why|before|after|mistake|secret|fast|free|check|avoid|fix)\b/i.test(t)) score += 14;
    if (/\b(you|your|creator|seo|views|rank|click|save|watch)\b/i.test(t)) score += 10;
    if (t.length > 120) score -= 14;
    return Math.max(0, Math.min(100, score));
  }

  function compactText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(String(text || ""));
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(text) {
    const clean = String(text || "").trim().replace(/\s+/g, "");
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function smartTitle(text) {
    return compactText(text).toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
  }

  function inferNiche(input, fallback = "creator") {
    const t = compactText(input).toLowerCase();
    const rules = [
      [/model|modella|fashion|style|outfit|shoot|photo/, "fashion model"],
      [/fitness|gym|workout|wellness|coach/, "fitness creator"],
      [/beauty|makeup|skin|hair|cosmetic/, "beauty creator"],
      [/travel|hotel|city|trip|tour/, "travel creator"],
      [/food|recipe|chef|restaurant/, "food creator"],
      [/music|dj|producer|singer/, "music creator"],
      [/business|founder|startup|marketing|seo/, "business creator"],
      [/photo|video|cinema|filmmaker|editor/, "visual creator"]
    ];
    return (rules.find(([re]) => re.test(t)) || [null, fallback])[1];
  }

  function inferAudience(input, niche) {
    const t = compactText(input).toLowerCase();
    if (/brand|agency|sponsor|collab|booking/.test(t)) return "brands and collaborations";
    if (/client|lead|service|booking/.test(t)) return "new clients";
    if (/fan|community|follow|followers/.test(t)) return "new followers";
    if (/model|fashion|style|outfit/.test(t) || /fashion/.test(niche)) return "brands, photographers and style-focused followers";
    return "people who need a clear reason to follow";
  }

  function bioScore({ bio, niche, audience, cta }) {
    let score = 38;
    const bioText = compactText(bio);
    const text = compactText(`${bioText} ${niche} ${audience} ${cta}`);
    if (niche && niche.length > 3) score += 14;
    if (audience && audience.length > 8) score += 12;
    if (cta && cta.length > 4) score += 14;
    if (/\b(dm|book|collab|portfolio|link|work|follow|shop|email)\b/i.test(text)) score += 10;
    if (bioText.length >= 50 && bioText.length <= 150) score += 8;
    if (bioText.length > 180) score -= 12;
    if (bioText.length < 36) score -= 8;
    return Math.max(0, Math.min(100, score));
  }

  function instagramBioResult(v) {
    const raw = compactText(v.bio || v.input || "");
    const niche = compactText(v.niche) || inferNiche(raw, "creator");
    const audience = compactText(v.audience) || inferAudience(raw, niche);
    const goal = compactText(v.goal) || "get profile visits and collaboration requests";
    const cta = compactText(v.cta) || (/model|fashion/.test(niche) ? "DM for bookings/collabs" : "DM for collaborations");
    const tone = compactText(v.tone || "premium");
    const title = smartTitle(niche);
    const isModel = /model|fashion|style|outfit|shoot|photo/.test(`${raw} ${niche}`);
    const promise = isModel
      ? "Editorial | lifestyle | brand shoots"
      : `clear ${niche.replace(/ creator$/, "")} content with a useful point of view`;
    const optionA = isModel
      ? `${title}\n${promise}\n${cta}`
      : `${title}\nFor ${audience}\n${promise}\n${cta}`;
    const optionB = isModel
      ? `${title} for brands + photographers\nCampaign-ready visuals and clean portfolio work\n${cta}`
      : `${title} for ${audience}\nUseful posts, simple structure and one clear next action\n${cta}`;
    const optionC = isModel
      ? "Model portfolio + collaborations\nEditorial, lifestyle and social campaigns\n" + cta
      : title + "\nHelping " + audience + "\nNew ideas, practical posts and honest recommendations\n" + cta;
    const best = [optionA, optionB, optionC].sort((a, b) => Math.abs(a.length - 135) - Math.abs(b.length - 135))[0];
    const score = bioScore({ bio: best, niche, audience, cta });
    const output = [
      "Instagram Bio Optimizer",
      "",
      "Best bio:",
      best,
      "",
      "Alternatives:",
      `1.\n${optionA}`,
      "",
      `2.\n${optionB}`,
      "",
      `3.\n${optionC}`,
      "",
      "Profile fix checklist:",
      "- First line says exactly who the account is for.",
      "- Second line gives a reason to follow.",
      "- CTA tells people what to do next.",
      "- Link matches the CTA: portfolio, booking, shop, newsletter or media kit.",
      "",
      `Tone: ${tone}`,
      `Goal: ${goal}`
    ].join("\n");
    const html = `
      <div class="cms-output-pack bio-pack">
        <div class="cms-result-hero">
          <span>Best bio</span>
          <strong>${esc(best).replace(/\n/g, "<br>")}</strong>
        </div>
        <div class="cms-output-cards">
          <article><b>Profile position</b><span>${esc(title)}</span></article>
          <article><b>Audience</b><span>${esc(audience)}</span></article>
          <article><b>CTA</b><span>${esc(cta)}</span></article>
        </div>
        <div class="cms-output-list">
          <b>Alternative angle</b>
          <span>${esc(optionA === best ? optionB : optionA).replace(/\n/g, "<br>")}</span>
        </div>
        <div class="cms-output-list">
          <b>Why this is stronger</b>
          <span>It removes vague wording and gives the profile four jobs: identity, niche, audience value and next action.</span>
        </div>
      </div>`;
    return result("Instagram bio rebuilt for profile clarity.", [
      metric("Bio score", `${score}/100`),
      metric("Characters", best.length),
      metric("Niche", title),
      metric("CTA", cta ? "Present" : "Missing")
    ], output, html);
  }

  function creatorOutput(tool, input, platform = "Creator") {
    const slug = tool.slug || "";
    const topic = String(input || "").trim() || tool.title;
    const hook = topic.length > 80 ? topic.slice(0, 77) + "..." : topic;
    const platformName = platform || "Creator";

    if (/comment-reply/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Viewer comment: ${hook}`,
        "",
        "Reply options:",
        `1. Thanks for watching. Good point: ${hook}. I will pin a clearer note in the next update.`,
        `2. Appreciate it. The short answer is: ${hook}. The important part is testing it before publishing.`,
        `3. You are right to ask. I would solve it by checking the example first, then comparing the result.`,
        "",
        "Tone check:",
        "- Helpful, not defensive.",
        "- One useful detail per reply.",
        "- Invite the viewer to continue the conversation only when it adds value."
      ].join("\n");
    }

    if (/chapter/i.test(slug)) {
      const lines = String(input || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 8);
      const chapters = (lines.length ? lines : ["Intro and promise", "Main problem", "Step-by-step fix", "Example", "Final checklist"]).map((line, i) => {
        const min = Math.floor(i * 1.5);
        const sec = i % 2 ? 30 : 0;
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")} ${line.replace(/^\d+[\).\s-]+/, "")}`;
      });
      return [
        `${tool.title}`,
        "",
        "YouTube chapters:",
        ...chapters,
        "",
        "Description note:",
        "Keep chapter names short, useful and aligned with the video promise."
      ].join("\n");
    }

    if (/thumbnail-text|readability-checker/i.test(slug)) {
      const count = words(topic).length;
      const status = count <= 4 ? "Strong mobile scan" : count <= 7 ? "Acceptable, but tighten it" : "Too long for a thumbnail";
      return [
        `${tool.title}`,
        "",
        `Thumbnail text: ${hook}`,
        `Word count: ${count}`,
        `Status: ${status}`,
        "",
        "Better variants:",
        `1. ${words(topic).slice(0, 4).join(" ") || hook}`,
        `2. ${hook.replace(/\b(the|a|an|really|very|just)\b/gi, "").replace(/\s+/g, " ").trim()}`,
        "",
        "Visual checklist:",
        "- 2 to 4 strong words usually scan best.",
        "- Put the outcome in the largest text.",
        "- Avoid repeating the exact title."
      ].join("\n");
    }

    if (/cta/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Context: ${hook}`,
        `Platform: ${platformName}`,
        "",
        "CTA options:",
        "- Save this before you publish.",
        "- Open the related tool and test your own version.",
        "- Comment with the part you want checked next.",
        "- Send this to someone building the same workflow.",
        "",
        "Pick the CTA that matches intent: save for education, comment for conversation, click for conversion."
      ].join("\n");
    }

    if (/script/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Topic: ${hook}`,
        "",
        "Script:",
        "0-3s: Name the problem in one clear line.",
        "3-10s: Show the mistake or before-state.",
        "10-25s: Give the fix in 3 steps.",
        "25-35s: Show a proof point or example.",
        "35-45s: Close with one CTA.",
        "",
        "Retention note: cut any sentence that does not move the viewer to the next beat."
      ].join("\n");
    }

    if (/formatter|thread/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Draft idea: ${hook}`,
        "",
        "Formatted structure:",
        "1. Hook: say the outcome first.",
        "2. Context: explain why it matters.",
        "3. Steps: split the fix into short blocks.",
        "4. Proof: add example, metric or constraint.",
        "5. CTA: one next action.",
        "",
        "Spacing: keep paragraphs short enough to scan on mobile."
      ].join("\n");
    }

    if (/carousel/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Carousel topic: ${hook}`,
        "",
        "Slides:",
        "1. Promise / pain point",
        "2. Why the problem happens",
        "3. Step 1",
        "4. Step 2",
        "5. Step 3",
        "6. Example",
        "7. Checklist",
        "8. CTA",
        "",
        "Design note: one idea per slide, one visual anchor per idea."
      ].join("\n");
    }

    if (/hook|title/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Main angle: ${hook}`,
        `Hook score: ${scoreHook(topic)}/100`,
        "",
        "Rewrite options:",
        `1. ${hook}: what most people miss`,
        `2. Before you post ${hook.toLowerCase()}, check this`,
        `3. I tested ${hook.toLowerCase()} so you do not have to`,
        "",
        "Fix checklist:",
        "- Open with the outcome, not the background.",
        "- Use one concrete noun or number.",
        "- Remove vague words like amazing, best or ultimate unless you prove them."
      ].join("\n");
    }

    if (/caption|description|subject|bio|alt-text|disclosure/i.test(slug)) {
      if (/description/i.test(slug)) {
        return [
          `${tool.title}`,
          "",
          `Video or post topic: ${hook}`,
          `Platform: ${platformName}`,
          "",
          "Description draft:",
          `${hook}`,
          "",
          "In this video/post, you will see the problem, the practical fix and the exact next step to use it without guessing.",
          "",
          "Chapters / sections:",
          "00:00 What this solves",
          "00:32 The common mistake",
          "01:10 Step-by-step fix",
          "02:20 Example",
          "03:05 Final checklist",
          "",
          "CTA:",
          "Open the related Clickoz tool, test your own version, then copy the cleaner output.",
          "",
          "Description check:",
          "- First two lines explain the value before links.",
          "- Links are grouped after the promise.",
          "- Hashtags stay focused instead of stuffed."
        ].join("\n");
      }
      if (/subject/i.test(slug)) {
        return [
          `${tool.title}`,
          "",
          `Email topic: ${hook}`,
          "",
          "Subject options:",
          `1. ${hook}: the faster version`,
          `2. Before you publish ${hook.toLowerCase()}`,
          `3. A cleaner way to handle ${hook.toLowerCase()}`,
          `4. Fix this before the next send`,
          "",
          "Preheader:",
          "A practical checklist you can use today without rebuilding the whole workflow.",
          "",
          "Inbox check:",
          "- Clear benefit in the first 45 characters.",
          "- No fake urgency.",
          "- Subject and preheader do not repeat the same words."
        ].join("\n");
      }
      if (/alt-text/i.test(slug)) {
        return [
          `${tool.title}`,
          "",
          `Image context: ${hook}`,
          "",
          "Alt text options:",
          `1. ${hook}, shown clearly with the main subject and setting.`,
          `2. ${hook}, focused on the visible action and important detail.`,
          `3. ${hook}, described for someone who cannot see the image.`,
          "",
          "Accessibility check:",
          "- Describe what is visible, not what you want users to feel.",
          "- Mention text in the image only if it matters.",
          "- Keep it useful and concise."
        ].join("\n");
      }
      if (/disclosure/i.test(slug)) {
        return [
          `${tool.title}`,
          "",
          `Content context: ${hook}`,
          "",
          "Disclosure options:",
          "- This content was created with AI assistance and reviewed before publishing.",
          "- AI helped draft parts of this post; the final version was checked and edited.",
          "- This includes AI-assisted wording, with human review for accuracy and context.",
          "",
          "Use the clearest option when:",
          "- AI wrote, edited or summarized meaningful parts.",
          "- A platform, client or audience expects disclosure.",
          "- The content could influence buying, health, finance or legal decisions."
        ].join("\n");
      }
      return [
        `${tool.title}`,
        "",
        `Input: ${hook}`,
        `Platform: ${platformName}`,
        "",
        "Caption draft:",
        `${hook}.`,
        "",
        "What matters here: make the first line explain the visual, then give the reader one reason to save, comment or click.",
        "",
        "CTA options:",
        "- Save this before your next post.",
        "- Comment with the part you want checked.",
        "- DM for collaborations or the full checklist.",
        "",
        "Quality check:",
        "- First line is understandable alone.",
        "- CTA matches the platform.",
        "- Hashtags support the topic instead of replacing the message."
      ].join("\n");
    }

    if (/calendar|planner|outline|repurposing|brief|show-notes|media-kit/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Core topic: ${hook}`,
        `Platform: ${platformName}`,
        "",
        "Workflow:",
        "1. Define the promise.",
        "2. Split it into 3 practical sections.",
        "3. Add proof, example or constraint.",
        "4. End with one clear next action.",
        "",
        "Reusable structure:",
        "- Hook",
        "- Problem",
        "- Steps",
        "- Example",
        "- CTA"
      ].join("\n");
    }

    if (/hashtag|keyword|gap|risk|checker/i.test(slug)) {
      return [
        `${tool.title}`,
        "",
        `Topic checked: ${hook}`,
        "",
        "Recommended mix:",
        "- 2 broad discovery terms",
        "- 3 niche-specific terms",
        "- 1 branded or recurring term",
        "",
        "Avoid:",
        "- Repeating the same keyword in every line.",
        "- Tags that do not match the actual content.",
        "- Spam-style bundles that make the post look generic."
      ].join("\n");
    }

    return [
      `${tool.title}`,
      "",
      `Core angle: ${hook}`,
      `Best platform fit: ${platformName}`,
      "",
      "Hook options:",
      `1. Stop losing time on this: ${hook}`,
      `2. The simple way to improve ${hook.toLowerCase()}`,
      `3. Before you publish, check this ${platformName.toLowerCase()} mistake`,
      "",
      "Structure:",
      "- Open with the problem in one sentence.",
      "- Show the practical fix or checklist.",
      "- Add one CTA that matches the viewer intent.",
      "",
      "Quality check:",
      "- Specific > clever.",
      "- Short first line.",
      "- Plain language.",
      "- One measurable next action."
    ].join("\n");
  }

  function premiumFallbackHtml(tool, input, platform, output) {
    const topic = compactText(input) || tool.title;
    const platformName = compactText(platform) || "General";
    const score = scoreHook(topic);
    const category = tool.category === "socialai" ? "Creator workflow" : tool.category === "youtube" ? "YouTube workflow" : smartTitle(String(tool.category || "workflow"));
    const usefulLine = String(output || "").split(/\r?\n/).map((x) => x.trim()).find((line) => line && line !== tool.title && !/:$/.test(line)) || topic;
    const nextTool = (tool.relatedTools || []).map((slug) => cms.toolBySlug?.[slug]).find(Boolean);
    const job = tool.category === "youtube"
      ? "Package the upload"
      : tool.category === "socialai"
        ? "Make it platform-specific"
        : tool.category === "tracking"
          ? "Track cleanly"
          : "Finish the task";
    const next = tool.category === "youtube"
      ? "Title, thumbnail, description, tags and tracking should match the same promise."
      : tool.category === "socialai"
        ? "Keep one clear hook, one useful body section and one platform-native CTA."
        : "Copy the result only after checking it in the real page, post, payload or campaign.";
    const decision = score >= 72
      ? "Strong enough to refine in the real workflow."
      : score >= 55
        ? "Usable draft. Tighten the first line before copying."
        : "Needs a clearer promise, audience or practical detail before use.";

    return `<div class="cms-output-pack">
      <div class="cms-result-hero">
        <span>${esc(category)}</span>
        <strong>${esc(usefulLine)}</strong>
      </div>
      <div class="cms-output-cards">
        <article><b>Score</b><span>${score}/100 clarity estimate</span></article>
        <article><b>Best use</b><span>${esc(job)}</span></article>
        <article><b>Platform</b><span>${esc(platformName)}</span></article>
        <article><b>Next tool</b><span>${esc(nextTool?.title || "Related workflow")}</span></article>
      </div>
      <div class="cms-output-list">
        <b>Copy-ready result</b>
        <span>${esc(output).replace(/\n/g, "<br>")}</span>
      </div>
      <div class="cms-output-list">
        <b>Human check</b>
        <span>${esc(decision)} If one line sounds like it could fit any brand or creator, rewrite that line first.</span>
      </div>
      <div class="cms-output-list">
        <b>Before publishing</b>
        <span>${esc(next)}${nextTool ? ` Continue with ${esc(nextTool.title)} while the context is fresh.` : ""}</span>
      </div>
    </div>`;
  }

  function outputPackHtml({ badge = "Output", hero = "", cards = [], sections = [] }) {
    const cardHtml = cards.filter(Boolean).slice(0, 4).map(([label, value]) =>
      `<article><b>${esc(label)}</b><span>${esc(value)}</span></article>`
    ).join("");
    const sectionHtml = sections.filter(Boolean).map(([label, value]) =>
      `<div class="cms-output-list"><b>${esc(label)}</b><span>${esc(value).replace(/\n/g, "<br>")}</span></div>`
    ).join("");
    return `<div class="cms-output-pack">
      <div class="cms-result-hero"><span>${esc(badge)}</span><strong>${esc(hero).replace(/\n/g, "<br>")}</strong></div>
      ${cardHtml ? `<div class="cms-output-cards">${cardHtml}</div>` : ""}
      ${sectionHtml}
    </div>`;
  }

  function wordCounterHtml(stats, text) {
    const avg = stats.sentences ? (stats.w.length / stats.sentences).toFixed(1) : "0.0";
    const advice = stats.w.length < 40
      ? "Short draft. Good for captions, snippets or intros; expand it if the page needs depth."
      : stats.w.length > 450
        ? "Long draft. Add headings, tighten paragraphs and move secondary points lower."
        : "Balanced draft. Review sentence length and keep the first paragraph direct.";
    return outputPackHtml({
      badge: "Text structure",
      hero: `${stats.w.length} words - ${duration(stats.w.length / 235 * 60)} reading time`,
      cards: [
        ["Characters", stats.chars],
        ["Sentences", stats.sentences],
        ["Paragraphs", stats.paragraphs],
        ["Avg sentence", `${avg} words`]
      ],
      sections: [
        ["What this means", advice],
        ["Copy-ready summary", `Words: ${stats.w.length}\nCharacters: ${stats.chars}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nReading time: ${duration(stats.w.length / 235 * 60)}`],
        ["Next edit", "If the text feels heavy, split the longest paragraph and remove one filler sentence before publishing."]
      ]
    });
  }

  function transformPackHtml(label, primary, cards, note) {
    return outputPackHtml({
      badge: label,
      hero: primary || "Result ready",
      cards,
      sections: [
        ["Copy-ready output", primary || "No output yet."],
        ["How to use it", note]
      ]
    });
  }

  function ipv4ToNumber(ip) {
    const p = String(ip || "").split(".").map((x) => parseInt(x, 10));
    if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error("Enter a valid IPv4 address.");
    return p.reduce((a, n) => ((a << 8) | n) >>> 0, 0) >>> 0;
  }
  const numberToIpv4 = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
  const uuidv4 = () => crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

  async function pingUrl(url) {
    const target = new URL(normUrl(url));
    const start = performance.now();
    return new Promise((resolve) => {
      const img = new Image();
      const done = (status) => resolve({ ms: Math.round(performance.now() - start), status });
      const timer = setTimeout(() => done("timeout"), 5000);
      img.onload = () => { clearTimeout(timer); done("loaded"); };
      img.onerror = () => { clearTimeout(timer); done("responded or blocked"); };
      img.src = `${target.origin}/favicon.ico?clickoz=${Date.now()}${Math.random()}`;
    });
  }

  function parseColor(input) {
    const raw = String(input || "").trim();
    const hex = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    const rgb = raw.match(/^rgb\(?\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)?$/i);
    let r, g, b;
    if (hex) {
      const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else if (rgb) { r = +rgb[1]; g = +rgb[2]; b = +rgb[3]; }
    else throw new Error("Use HEX like #3b82f6 or RGB like rgb(59,130,246).");
    return { r, g, b };
  }

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function toolExamples(slug, config, tool) {
    const title = tool.title || slug.replace(/-/g, " ");
    const map = {
      "word-counter": [
        { label: "SEO intro", values: { text: "Fast word counter online. Count words, characters, sentences, paragraphs and reading time instantly. Browser-only and privacy-first." } },
        { label: "Mobile copy", values: { text: "Most readers scan first. Use short sentences, clear sections and one specific promise per paragraph." } },
        { label: "Voice script", values: { text: "Today we are checking a quick publishing workflow. Paste the draft, review reading time, then remove the slow parts before recording." } }
      ],
      "character-counter": [
        { label: "Instagram bio", values: { text: "Tools for creators, SEO writers and developers. Fast, private and copy-ready." } },
        { label: "Meta snippet", values: { text: "Free online tools for SEO, writing, developers and creators. No signup." } },
        { label: "Short caption", values: { text: "New guide live. Save it before your next upload." } }
      ],
      "json-formatter": [
        { label: "API payload", values: { json: "{\"status\":\"ok\",\"items\":[{\"name\":\"Clickoz\",\"tools\":66}]}" } },
        { label: "Config", values: { json: "{\"theme\":{\"accent\":\"#22d3ee\"},\"features\":[\"tools\",\"guides\"]}" } },
        { label: "Error check", values: { json: "{\"name\":\"Clickoz\",\"valid\":true}" } }
      ],
      "entity-encoder": [
        { label: "Button HTML", values: { text: "<button aria-label=\"Save & publish\">Save</button>" } },
        { label: "Headline", values: { text: "SEO & Writing Tools > Free, fast, no signup" } },
        { label: "Attribute", values: { text: "title=\"Tom's guide & checklist\"" } }
      ],
      "html-entity-encoder": [
        { label: "Encode tag", values: { text: "<span title=\"Save & publish\">5 > 3</span>", mode: "encode" } },
        { label: "Decode text", values: { text: "Tom &amp; Sara &lt;strong&gt;save now&lt;/strong&gt;", mode: "decode" } },
        { label: "Auto", values: { text: "SEO & Writing Tools > Free, fast, no signup", mode: "auto" } }
      ],
      "html-entity-encoder-decoder": [
        { label: "Escaped copy", values: { text: "Tom &amp; Sara said &lt;strong&gt;save now&lt;/strong&gt;" } },
        { label: "Unsafe text", values: { text: "<script>alert('x')</script> & campaign copy" } },
        { label: "Attribute copy", values: { text: "title=&quot;Creator tools &amp; SEO fixes&quot;" } }
      ],
      "url-encoder": [
        { label: "Campaign", values: { text: "campaign name=spring launch & source=instagram" } },
        { label: "Search query", values: { text: "best free seo tools for creators" } },
        { label: "UTM value", values: { text: "youtube description / pinned comment" } }
      ],
      "url-encoder-decoder": [
        { label: "Encode value", values: { value: "campaign name=spring launch & source=instagram", mode: "encode" } },
        { label: "Decode value", values: { value: "youtube%20description%20%2F%20pinned%20comment", mode: "decode" } },
        { label: "Query clean", values: { value: "utm_source=YouTube Ads&utm_medium=video description&utm_campaign=spring launch", mode: "query" } }
      ],
      "base64": [
        { label: "Text", values: { text: "Clickoz premium tools" } },
        { label: "Payload", values: { text: "{\"role\":\"admin\",\"site\":\"clickoz\"}" } },
        { label: "Token part", values: { text: "eyJzaXRlIjoiQ2xpY2tveiJ9" } }
      ],
      "base64-encode-decode": [
        { label: "Encode text", values: { value: "Clickoz premium tools", mode: "encode" } },
        { label: "Decode payload", values: { value: "eyJzaXRlIjoiQ2xpY2tveiIsInRvb2xzIjo2Nn0=", mode: "decode" } },
        { label: "Base64URL", values: { value: "eyJwYWdlIjoidG9vbC1kZXNrIn0", mode: "auto" } }
      ],
      "meta-tags": [
        { label: "Tool page", values: { title: "Free Word Counter Online | Clickoz", description: "Count words, characters, sentences and reading time instantly. Browser-only, mobile-ready and free." } },
        { label: "Guide page", values: { title: "SEO Content Checklist for Better Pages", description: "Use this checklist to match search intent, improve snippets and link to the right next action." } },
        { label: "Creator page", values: { title: "YouTube Title Generator for Better Hooks", description: "Generate clearer title angles, thumbnail promises and upload-ready ideas before publishing." } }
      ],
      "meta-tag-optimizer": [
        { label: "Tool page", values: { url: "https://clickoz.com/tools/word-counter/", title: "Free Word Counter Online | Clickoz", description: "Count words, characters, sentences and reading time instantly. Browser-only, mobile-ready and free.", intent: "count words and reading time quickly" } },
        { label: "Guide page", values: { url: "https://clickoz.com/guides/seo-content-checklist/", title: "SEO Content Checklist for Better Pages", description: "Use this checklist to match search intent, improve snippets and link to the right next action.", intent: "audit a page before publishing" } },
        { label: "Weak snippet", values: { url: "https://example.com/page", title: "Best Tools", description: "Useful tools online.", intent: "find fast tools for SEO and creator work" } }
      ],
      "serp-preview": [
        { label: "Homepage", values: { url: "https://clickoz.com/", title: "Clickoz - Free Online Tools", description: "Fast browser tools for SEO, writing, developers and creators. No signup." } },
        { label: "Tool", values: { url: "https://clickoz.com/tools/word-counter/", title: "Word Counter - Free Online Tool", description: "Count words, characters, sentences, paragraphs and reading time instantly." } },
        { label: "Guide", values: { url: "https://clickoz.com/guides/seo-content-checklist/", title: "SEO Content Checklist", description: "A practical workflow for search intent, snippets, internal links and page structure." } }
      ],
      "sponsorship-rate-calculator": [
        { label: "Mid creator", values: { views: "100000", engagement: "4.5", deliverables: "1 YouTube video + 1 Short" } },
        { label: "Reels deal", values: { views: "35000", engagement: "6.2", deliverables: "2 Reels + 3 story frames" } },
        { label: "Newsletter", values: { views: "18000", engagement: "8", deliverables: "1 dedicated section + link tracking" } }
      ],
      "youtube-comment-reply-generator": [
        { label: "Question", values: { input: "Can you explain how to use this with a small channel?", platform: "YouTube" } },
        { label: "Criticism", values: { input: "This sounds too complicated. Is there a faster way?", platform: "YouTube" } },
        { label: "Thanks", values: { input: "This helped me fix my upload description today.", platform: "YouTube" } }
      ],
      "youtube-chapter-generator": [
        { label: "Tutorial", values: { input: "Intro\nWhy the page is not ranking\nCheck the snippet\nFix the title\nAdd internal links\nFinal checklist", platform: "YouTube" } },
        { label: "Review", values: { input: "Opening promise\nFeature overview\nLive example\nPros and limits\nBest use case", platform: "YouTube" } },
        { label: "Case study", values: { input: "Before state\nWhat changed\nResults\nMistakes to avoid\nNext steps", platform: "YouTube" } }
      ],
      "thumbnail-text-readability-checker": [
        { label: "Short", values: { input: "Rank Faster", platform: "YouTube" } },
        { label: "Too long", values: { input: "How I fixed my SEO pages with a better internal linking workflow", platform: "YouTube" } },
        { label: "Rewrite", values: { input: "Stop Losing Clicks", platform: "YouTube" } }
      ],
      "social-cta-generator": [
        { label: "Save", values: { input: "Checklist for publishing a better YouTube description", platform: "Instagram" } },
        { label: "Comment", values: { input: "Free SEO tool update for creators", platform: "TikTok" } },
        { label: "Click", values: { input: "New Clickoz guide about UTM tracking", platform: "LinkedIn" } }
      ],
      "ugc-script-generator": [
        { label: "App demo", values: { input: "A browser tool that fixes messy text before publishing", platform: "TikTok" } },
        { label: "Problem", values: { input: "Creators waste time rewriting the same caption for every platform", platform: "Instagram" } },
        { label: "Proof", values: { input: "A workflow that turns one video into five useful posts", platform: "Short-form" } }
      ],
      "linkedin-post-formatter": [
        { label: "Launch", values: { input: "We rebuilt our tools page so every utility has examples, guides and next actions.", platform: "LinkedIn" } },
        { label: "Lesson", values: { input: "Good SEO tools should solve one task clearly before asking users to read more.", platform: "LinkedIn" } },
        { label: "Checklist", values: { input: "Before publishing: snippet, readability, internal links, tracking link.", platform: "LinkedIn" } }
      ],
      "x-thread-formatter": [
        { label: "SEO thread", values: { input: "A small SEO workflow that improves pages without keyword spam.", platform: "X" } },
        { label: "Creator thread", values: { input: "How to package a YouTube upload from title to tracking link.", platform: "X" } },
        { label: "Dev thread", values: { input: "Debugging JSON faster with formatter, minifier and examples.", platform: "X" } }
      ],
      "carousel-outline-generator": [
        { label: "SEO carousel", values: { input: "How to make a tool page useful enough to rank", platform: "Instagram" } },
        { label: "Creator carousel", values: { input: "One video idea into titles, captions and posts", platform: "Instagram" } },
        { label: "Checklist", values: { input: "Pre-publish checklist for a landing page", platform: "LinkedIn" } }
      ],
      "instagram-bio-optimizer": [
        { label: "Model", preview: "Fashion model profile: brand-ready positioning, booking CTA and cleaner portfolio promise.", values: { bio: "account instagram of a model", niche: "fashion model", audience: "brands, photographers and style-focused followers", goal: "book collaborations", cta: "DM for bookings/collabs", tone: "premium" } },
        { label: "Fitness", preview: "Fitness coach profile: clear audience, coaching offer and direct DM CTA.", values: { bio: "online fitness coach helping busy women train at home", niche: "fitness coach", audience: "busy women who want simple workouts", goal: "sell coaching calls", cta: "DM START for coaching", tone: "direct" } },
        { label: "Creator", preview: "Travel creator profile: niche, audience and collaboration CTA for brand deals.", values: { bio: "travel creator posting hotels, city guides and hidden places", niche: "travel creator", audience: "travellers and tourism brands", goal: "grow followers and brand deals", cta: "Email for collaborations", tone: "editorial" } }
      ],
      "instagram-caption-generator": [
        { label: "Outfit", values: { input: "new editorial streetwear shoot in Milan", platform: "Instagram" } },
        { label: "Beauty", values: { input: "skincare routine for glowing skin before a shoot", platform: "Instagram" } },
        { label: "Travel", values: { input: "hidden hotel terrace with sunset view in Rome", platform: "Instagram" } }
      ]
    };
    const alias = { "html-entity-encoder": "entity-encoder", "html-entity-encoder-decoder": "entity-encoder", "url-encoder-decoder": "url-encoder", "base64-encode-decode": "base64", "meta-tag-optimizer": "meta-tags" };
    if (map[slug] || map[alias[slug]]) return map[slug] || map[alias[slug]];
    if (config.examples) return config.examples;
    const firstField = (config.fields || [])[0]?.id || "input";
    if (tool.category === "socialai" || tool.category === "youtube") {
      const sample = humanSampleFor(tool);
      return [
        { label: "Real brief", values: { [firstField]: sample, platform: tool.category === "youtube" ? "YouTube" : "Short-form" } },
        { label: "Launch note", values: { [firstField]: "A creator workflow that turns one rough idea into a hook, caption, CTA and next post without sounding generic.", platform: "Instagram" } },
        { label: "How-to", values: { [firstField]: "How to plan a week of content from one long video without repeating the same point on every platform.", platform: "TikTok" } }
      ];
    }
    const sample = humanSampleFor(tool);
    return [
      { label: "Real job", values: Object.fromEntries((config.fields || []).map((f) => [f.id, f.value || config.sample || sample])) },
      { label: "Messy input", values: { [firstField]: sample } },
      { label: "Publish check", values: { [firstField]: config.sample || sample } }
    ];
  }

  function previewExample(example) {
    if (typeof example === "string") return example;
    if (example.preview) return example.preview;
    const values = example.values || {};
    return Object.values(values).filter(Boolean).join("\n") || example.label || "";
  }

  function applyExample(root, config, example) {
    const values = typeof example === "string"
      ? { [(config.fields || [])[0]?.id || "input"]: example }
      : (example.values || {});
    (config.fields || []).forEach((f) => {
      const el = root.querySelector(`#${cssId(f.id)}`);
      if (el && Object.prototype.hasOwnProperty.call(values, f.id)) el.value = values[f.id];
    });
  }

  const configs = {
    "word-counter": {
      sample: "Fast word counter online. Count words, characters, sentences, paragraphs and reading time instantly. Browser-only and privacy-first.",
      fields: [field("text", "Paste your text", "textarea", "Most people skim on mobile. Use short sentences and clear structure. Cut filler words and make the point fast.", true)],
      run(v) {
        const s = textStats(v.text);
        const output = `Words: ${s.w.length}\nCharacters: ${s.chars}\nSentences: ${s.sentences}\nParagraphs: ${s.paragraphs}\nReading time: ${duration(s.w.length / 235 * 60)}`;
        return result("Output ready: text length, structure and reading time are separated below.", [metric("Words", s.w.length), metric("Characters", s.chars), metric("Sentences", s.sentences), metric("Reading time", duration(s.w.length / 235 * 60))], output, wordCounterHtml(s, v.text));
      }
    },
    "character-counter": {
      sample: "Instagram bio: Tools for creators, SEO writers and developers.",
      fields: [field("text", "Text", "textarea", "Instagram bio: Tools for creators, SEO writers and developers.", true)],
      run(v) {
        const t = String(v.text || "");
        const noSpaces = t.replace(/\s/g, "").length;
        const output = `Characters: ${t.length}\nCharacters without spaces: ${noSpaces}\nWords: ${words(t).length}\nLines: ${t.split(/\n/).length}`;
        return result("Output ready: character limits and copy length are clear.", [metric("Characters", t.length), metric("No spaces", noSpaces), metric("Words", words(t).length), metric("Lines", t.split(/\n/).length)], output, outputPackHtml({
          badge: "Limit check",
          hero: `${t.length} characters - ${words(t).length} words`,
          cards: [["No spaces", noSpaces], ["Lines", t.split(/\n/).length], ["Best for", "Bios/snippets"], ["Status", t.length > 160 ? "Review length" : "Clean"]],
          sections: [["Copy-ready summary", output], ["How to use it", "Use this before pasting into bios, captions, titles, forms, ads or metadata fields with strict limits."]]
        }));
      }
    },
    "readability-analyzer": {
      sample: "This paragraph is useful, but it might be too long for mobile readers. Shorter sentences make scanning easier.",
      fields: [field("text", "Text to analyze", "textarea", "This paragraph is useful, but it might be too long for mobile readers. Shorter sentences make scanning easier.", true)],
      run(v) {
        const s = textStats(v.text);
        const avg = s.sentences ? (s.w.length / s.sentences) : 0;
        const score = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, avg - 14) * 4)));
        const recommendation = avg > 20 ? "Split long sentences, add one heading and remove filler transitions." : "Structure is readable. Review headings, CTA and paragraph breaks.";
        const output = `Score: ${score}/100\nAverage words per sentence: ${avg.toFixed(1)}\nRecommendation: ${recommendation}`;
        return result("Output ready: readability score includes the next edit.", [metric("Score", `${score}/100`), metric("Avg sentence", avg.toFixed(1)), metric("Words", s.w.length), metric("Action", avg > 20 ? "Shorten" : "Good scan")], output, outputPackHtml({
          badge: "Readability",
          hero: `${score}/100 clarity estimate`,
          cards: [["Avg sentence", `${avg.toFixed(1)} words`], ["Words", s.w.length], ["Sentences", s.sentences], ["Action", avg > 20 ? "Shorten" : "Polish"]],
          sections: [["Recommendation", recommendation], ["Copy-ready note", output]]
        }));
      }
    },
    "text-case-converter": {
      sample: "make this headline cleaner for the page",
      fields: [field("text", "Text", "textarea", "make this headline cleaner for the page", true)],
      run(v) {
        const t = String(v.text || "");
        const title = t.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
        const sentence = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        const output = `UPPERCASE:\n${t.toUpperCase()}\n\nlowercase:\n${t.toLowerCase()}\n\nTitle Case:\n${title}\n\nSentence case:\n${sentence}`;
        return result("Case formats generated with copy-ready variants.", [metric("Original chars", t.length), metric("Formats", 4), metric("Words", words(t).length), metric("Copy", "Ready")], output, outputPackHtml({
          badge: "Text case",
          hero: title || "No text yet",
          cards: [["Formats", 4], ["Words", words(t).length], ["Best for", "Titles/forms"], ["Status", t ? "Ready" : "Needs input"]],
          sections: [["Title Case", title], ["Sentence case", sentence], ["All formats", output], ["Next step", "Use title case for headings and sentence case for body copy, then check the final field limit before publishing."]]
        }));
      }
    },
    "whitespace-cleaner": {
      sample: "Messy    text\n\n\nwith too many      spaces.",
      fields: [field("text", "Messy text", "textarea", "Messy    text\n\n\nwith too many      spaces.", true)],
      run(v) { const before = String(v.text || ""); const out = before.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(); return result("Output ready: spacing and paragraph breaks cleaned.", [metric("Before", before.length), metric("After", out.length), metric("Removed", Math.max(0, before.length - out.length)), metric("Status", "Clean")], out, transformPackHtml("Clean text", out, [["Before", before.length], ["After", out.length], ["Removed", Math.max(0, before.length - out.length)], ["Status", "Copy-ready"]], "Paste the cleaned output back into the editor, then check readability if the draft still feels dense.")); }
    },
    "meta-tags": {
      sample: "Title: Free SEO Tools for Faster Publishing\nDescription: Use Clickoz to write snippets, check readability and clean URLs before publishing.",
      fields: [field("title", "SEO title", "text", "Free SEO Tools for Faster Publishing", false), field("description", "Meta description", "textarea", "Use Clickoz to write snippets, check readability and clean URLs before publishing.", true)],
      run(v) {
        const title = compactText(v.title);
        const desc = compactText(v.description);
        const titleStatus = !title ? "Missing" : title.length < 28 ? "Too short" : title.length <= 60 ? "Good" : title.length <= 68 ? "Review" : "Too long";
        const descStatus = !desc ? "Missing" : desc.length < 80 ? "Too short" : desc.length <= 158 ? "Good" : desc.length <= 170 ? "Review" : "Too long";
        const titleHint = title.length > 60 ? "Cut brand repetition or secondary modifiers." : title.length < 28 ? "Add the main intent and one concrete benefit." : "Keep the promise specific.";
        const descHint = desc.length > 158 ? "Move weaker details into the page intro." : desc.length < 80 ? "Add who it helps and what action it supports." : "Strong enough to test in SERP preview.";
        const html = `<div class="cms-output-pack serp-pack">
          <div class="serp-url">https://clickoz.com/example/</div>
          <div class="serp-title">${esc(title || "Missing title")}</div>
          <div class="serp-desc">${esc(desc || "Missing description")}</div>
          <div class="cms-quality-grid">
            <div class="cms-quality-card"><strong>Title fix</strong><span>${esc(titleHint)}</span></div>
            <div class="cms-quality-card"><strong>Description fix</strong><span>${esc(descHint)}</span></div>
          </div>
        </div>`;
        const output = `SEO title\n${title}\n\nMeta description\n${desc}\n\nHTML\n<title>${title}</title>\n<meta name="description" content="${desc.replace(/"/g, "&quot;")}" />\n\nQuality notes\nTitle: ${titleStatus} - ${titleHint}\nDescription: ${descStatus} - ${descHint}`;
        return result("Meta tags reviewed with snippet guidance.", [metric("Title chars", title.length), metric("Description chars", desc.length), metric("Title status", titleStatus), metric("Description status", descStatus)], output, html);
      }
    },
    "serp-preview": {
      sample: "https://clickoz.com/tools/\nClickoz Tools - Free Online Tools\nFast browser tools for SEO, writing, developers and creators.",
      fields: [field("url", "URL", "url", "https://clickoz.com/tools/", false), field("title", "Title", "text", "Clickoz Tools - Free Online Tools", false), field("description", "Description", "textarea", "Fast browser tools for SEO, writing, developers and creators.", true)],
      run(v) {
        const url = normUrl(v.url || "clickoz.com");
        const title = compactText(v.title);
        const desc = compactText(v.description);
        const titleCut = title.length > 60;
        const descCut = desc.length > 158;
        const host = new URL(url).hostname.replace(/^www\./, "");
        const pathLabel = new URL(url).pathname.replace(/^\/|\/$/g, "").replace(/\//g, " > ") || "home";
        const html = `<div class="cms-output-pack serp-pack">
          <div class="serp-url">${esc(host)} &gt; ${esc(pathLabel)}</div>
          <div class="serp-title">${esc(title || "Untitled result")}</div>
          <div class="serp-desc">${esc(desc || "No description provided.")}</div>
          <div class="cms-quality-grid">
            <div class="cms-quality-card"><strong>CTR risk</strong><span>${esc(titleCut || descCut ? "Snippet may truncate. Tighten before publishing." : "Length is in a clean testing range.")}</span></div>
            <div class="cms-quality-card"><strong>Intent</strong><span>${esc(/\b(free|tool|guide|check|generator|how)\b/i.test(`${title} ${desc}`) ? "Intent signal found." : "Add a clearer action word or page type.")}</span></div>
          </div>
        </div>`;
        return result("SERP preview rendered.", [metric("Title chars", title.length), metric("Description chars", desc.length), metric("Truncation", titleCut || descCut ? "Review" : "Low risk"), metric("Host", host)], `${title}\n${url}\n${desc}`, html);
      }
    },
    "keyword-density": {
      sample: "SEO tools help writers create SEO pages with clearer structure and better SEO checks.",
      fields: [field("text", "Text", "textarea", "SEO tools help writers create SEO pages with clearer structure and better SEO checks.", true)],
      run(v) {
        const stop = new Set(["the", "and", "for", "with", "this", "that", "you", "your", "are", "from", "into", "how", "why", "what", "when", "where", "then", "than"]);
        const ws = words(v.text).map((w) => w.toLowerCase()).filter((w) => w.length > 2);
        const useful = ws.filter((w) => !stop.has(w));
        const map = new Map();
        useful.forEach((w) => map.set(w, (map.get(w) || 0) + 1));
        const rows = [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
        const topDensity = rows[0] && useful.length ? (rows[0][1] / useful.length) * 100 : 0;
        const action = !ws.length ? "Paste real copy first." : topDensity > 8 ? "Reduce repetition and add supporting phrases." : rows.length < 4 ? "Add more context before judging density." : "Use the top terms to check topic focus, not to stuff keywords.";
        const output = rows.length ? rows.map(([k, n]) => `${k}: ${n} (${((n / useful.length) * 100).toFixed(1)}%)`).join("\n") : "No useful terms found yet.\n\nPaste a paragraph, product description or guide section to inspect real topic focus.";
        return result("Keyword focus calculated with a clear next edit.", [metric("Words", ws.length), metric("Tracked terms", useful.length), metric("Top term", rows[0]?.[0] || "-"), metric("Action", action)], output, outputPackHtml({
          badge: "Topic focus",
          hero: rows[0] ? `${rows[0][0]} leads at ${topDensity.toFixed(1)}%` : "Paste a real section to inspect focus",
          cards: [["Words", ws.length], ["Tracked terms", useful.length], ["Top term", rows[0]?.[0] || "-"], ["Risk", topDensity > 8 ? "Repetition" : "Balanced"]],
          sections: [["Top terms", output], ["What this means", action], ["Next edit", "Replace repeated wording with natural variants, examples and supporting phrases before touching the title or meta description."]]
        }));
      }
    },
    "slug-generator": {
      sample: "How to Write Better Meta Titles in 2026",
      fields: [field("text", "Title", "text", "How to Write Better Meta Titles in 2026", true)],
      run(v) {
        const raw = compactText(v.text);
        const base = raw.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const parts = base.split("-").filter((x) => x && !["the", "and", "for", "with", "your", "best"].includes(x));
        const primary = parts.join("-").slice(0, 80).replace(/-$/g, "");
        const short = parts.slice(0, 6).join("-");
        const status = primary.length <= 60 ? "Clean" : primary.length <= 80 ? "Usable" : "Too long";
        const output = `Primary slug\n${primary || "missing-input"}\n\nShort slug\n${short || primary || "missing-input"}\n\nRecommendation\nUse the short version when the page intent is still clear. Avoid dates unless the content is explicitly year-based.`;
        return result("SEO slug variants generated with publishing guidance.", [metric("Primary length", primary.length), metric("Short length", short.length), metric("Words kept", parts.length), metric("Status", status)], output, outputPackHtml({
          badge: "URL slug",
          hero: short || primary || "missing-input",
          cards: [["Primary length", primary.length], ["Short length", short.length], ["Words kept", parts.length], ["Status", status]],
          sections: [["Primary slug", primary || "missing-input"], ["Short slug", short || primary || "missing-input"], ["Publishing rule", "Use the shortest version that still explains the page. Avoid dates unless the content is explicitly year-based."]]
        }));
      }
    },
    "json-formatter": {
      sample: "{\"name\":\"Clickoz\",\"tools\":66,\"premium\":true}",
      fields: [field("json", "JSON", "textarea", "{\"name\":\"Clickoz\",\"tools\":66,\"premium\":true}", true)],
      run(v) { const obj = JSON.parse(v.json); const out = JSON.stringify(obj, null, 2); const type = Array.isArray(obj) ? "Array" : typeof obj; return result("Output ready: JSON is valid and formatted.", [metric("Status", "Valid"), metric("Chars", out.length), metric("Type", type), metric("Copy", "Ready")], out, outputPackHtml({ badge: "Valid JSON", hero: `${type} formatted with ${out.length} characters`, cards: [["Status", "Valid"], ["Type", type], ["Indent", "2 spaces"], ["Copy", "Ready"]], sections: [["Formatted JSON", out], ["How to use it", "Copy this only after checking that the payload still matches the API, config or log context you started from."]] })); }
    },
    "json-minifier": {
      sample: "{\n  \"name\": \"Clickoz\",\n  \"tools\": 66\n}",
      fields: [field("json", "JSON", "textarea", "{\n  \"name\": \"Clickoz\",\n  \"tools\": 66\n}", true)],
      run(v) { const original = String(v.json || ""); const out = JSON.stringify(JSON.parse(original)); return result("Output ready: JSON is valid and minified.", [metric("Status", "Valid"), metric("Chars", out.length), metric("Saved", Math.max(0, original.length - out.length)), metric("Copy", "Ready")], out, outputPackHtml({ badge: "Minified JSON", hero: `${out.length} characters after minify`, cards: [["Status", "Valid"], ["Saved", Math.max(0, original.length - out.length)], ["Format", "One line"], ["Copy", "Ready"]], sections: [["Minified output", out], ["How to use it", "Use this for compact payloads, but keep a formatted copy nearby when debugging."]] })); }
    },
    "url-encoder": {
      sample: "campaign name=spring launch & source=instagram",
      fields: [field("text", "URL or value", "textarea", "campaign name=spring launch & source=instagram", true)],
      run(v) {
        const t = String(v.text || "");
        const encoded = encodeURIComponent(t);
        let decoded = "";
        let decodeStatus = "Valid";
        try { decoded = decodeURIComponent(t.replace(/\+/g, "%20")); }
        catch (_) { decoded = "Input is not valid percent-encoded text."; decodeStatus = "Review"; }
        const output = `Encoded\n${encoded}\n\nDecoded attempt\n${decoded}\n\nUsage note\nEncode values before placing them inside query parameters. Do not encode the full URL unless you intentionally need it as one parameter value.`;
        return result("Output ready: encoded and decoded values are separated.", [metric("Original", t.length), metric("Encoded", encoded.length), metric("Decode", decodeStatus), metric("Copy", "Ready")], output, outputPackHtml({ badge: "URL value", hero: encoded || "No value yet", cards: [["Original", t.length], ["Encoded", encoded.length], ["Decode", decodeStatus], ["Use case", "Query values"]], sections: [["Encoded", encoded], ["Decoded attempt", decoded], ["Rule", "Encode parameter values before placing them inside URLs. Do not encode an entire URL unless it is intentionally one parameter value."]] }));
      }
    },
    "base64": {
      sample: "Clickoz premium tools",
      fields: [field("text", "Text or Base64", "textarea", "Clickoz premium tools", true)],
      run(v) {
        const t = String(v.text || "");
        const encoded = utf8ToBase64(t);
        let decoded = "";
        let decodedOk = true;
        try { decoded = base64ToUtf8(t); }
        catch (_) { decoded = "Input is not valid UTF-8 Base64."; decodedOk = false; }
        const output = `Encoded\n${encoded}\n\nDecoded attempt\n${decoded}\n\nSecurity note\nBase64 only changes representation. It does not hide secrets, tokens or private data.`;
        return result("Output ready: Base64 encode/decode is split into clear sections.", [metric("Input chars", t.length), metric("Encoded chars", encoded.length), metric("Decoded", decodedOk ? "Yes" : "No"), metric("Security", "Not encryption")], output, outputPackHtml({ badge: "Base64", hero: encoded || "No value yet", cards: [["Encoded chars", encoded.length], ["Decoded", decodedOk ? "Yes" : "No"], ["UTF-8", "Supported"], ["Security", "Not encryption"]], sections: [["Encoded", encoded], ["Decoded attempt", decoded], ["Security note", "Base64 is a representation format, not encryption. Never treat decoded tokens as safe to share."]] }));
      }
    },
    "entity-encoder": {
      sample: "<button aria-label=\"Save & publish\">Save</button>",
      fields: [field("text", "HTML/text", "textarea", "<button aria-label=\"Save & publish\">Save</button>", true)],
      run(v) { const t = String(v.text || ""); const encoded = esc(t); const ta = document.createElement("textarea"); ta.innerHTML = t; const output = `Encoded:\n${encoded}\n\nDecoded attempt:\n${ta.value}`; return result("Output ready: encoded HTML and decoded text are separated.", [metric("Original", t.length), metric("Encoded", encoded.length), metric("Mode", "Encode/decode"), metric("Safe", "Review")], output, outputPackHtml({ badge: "HTML entities", hero: encoded || "No value yet", cards: [["Original", t.length], ["Encoded", encoded.length], ["Mode", "Encode/decode"], ["Context", "HTML text"]], sections: [["Encoded for markup", encoded], ["Decoded attempt", ta.value], ["Rule", "Use encoded output inside HTML text or attributes. Decode only when reading, cleaning or debugging the content."]] })); }
    },
    "utm-builder": {
      sample: "https://clickoz.com/?utm_source=youtube&utm_medium=description&utm_campaign=launch",
      fields: [field("url", "Base URL", "url", "https://clickoz.com/", false), field("source", "Source", "text", "youtube", false), field("medium", "Medium", "text", "description", false), field("campaign", "Campaign", "text", "launch", false)],
      run(v) {
        const u = new URL(normUrl(v.url));
        const clean = (x, fallback) => compactText(x || fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const source = clean(v.source, "source");
        const medium = clean(v.medium, "medium");
        const campaign = clean(v.campaign, "campaign");
        u.searchParams.set("utm_source", source);
        u.searchParams.set("utm_medium", medium);
        u.searchParams.set("utm_campaign", campaign);
        const out = `${u.toString()}\n\nNaming rule\nKeep source, medium and campaign lowercase with hyphens. Use the same values across every creator, social and email placement.`;
        return result("UTM link built with clean naming.", [metric("Source", source), metric("Medium", medium), metric("Campaign", campaign), metric("URL", "Ready")], out, outputPackHtml({
          badge: "Tracking URL",
          hero: u.toString(),
          cards: [["Source", source], ["Medium", medium], ["Campaign", campaign], ["Status", "Copy-ready"]],
          sections: [["Final URL", u.toString()], ["Naming rule", "Keep source, medium and campaign lowercase with hyphens. Use the same values across every creator, social and email placement."], ["Next step", "Paste this into the exact placement you want to measure, then keep a separate link for each placement."]]
        }));
      }
    },
    "http-ping": { sample: "https://example.com", fields: [field("url", "Website URL", "url", "https://example.com", true)], async run(v) { const tries = []; for (let i = 0; i < 3; i++) tries.push(await pingUrl(v.url)); const target = new URL(normUrl(v.url)).hostname; const avg = Math.round(tries.reduce((a, x) => a + x.ms, 0) / tries.length); const rows = tries.map((x, i) => `Attempt ${i + 1}: ${x.ms} ms (${x.status})`).join("\n"); return result("Browser HTTP latency estimate.", [metric("Average", `${avg} ms`), metric("Attempts", 3), metric("Mode", "HTTP"), metric("Target", target)], rows, outputPackHtml({ badge: "Reachability check", hero: `${target} averaged ${avg} ms`, cards: [["Average", `${avg} ms`], ["Attempts", "3"], ["Mode", "HTTP favicon"], ["Target", target]], sections: [["Attempts", rows], ["How to read it", "This is a browser-side reachability estimate. Use it for quick comparison, not as a full uptime or Core Web Vitals report."]] })); } },
    "dns-lookup": { sample: "example.com A", fields: [field("domain", "Domain", "text", "example.com"), field("record", "Record", "select", "A", false, ["A", "AAAA", "CNAME", "MX", "TXT", "NS"].map((x) => ({ value: x, label: x })))], async run(v) { const d = String(v.domain || "").replace(/^https?:\/\//, "").split("/")[0]; const type = v.record || "A"; const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${encodeURIComponent(type)}`, { headers: { accept: "application/dns-json" } }); const j = await r.json(); const ans = j.Answer || []; const rows = ans.length ? ans.map((a) => `${a.name} ${a.TTL} ${type} ${a.data}`).join("\n") : JSON.stringify(j, null, 2); return result("DNS lookup complete.", [metric("Domain", d), metric("Type", type), metric("Answers", ans.length), metric("Resolver", "Cloudflare")], rows, outputPackHtml({ badge: "DNS result", hero: `${ans.length} ${type} answer${ans.length === 1 ? "" : "s"} for ${d}`, cards: [["Domain", d], ["Record", type], ["Answers", ans.length], ["Resolver", "Cloudflare"]], sections: [["Records", rows], ["Next step", "If a record changed recently, compare TTL and repeat the lookup after propagation time."]] })); } },
    "ip-subnet-calculator": { sample: "192.168.1.10 / 24", fields: [field("ip", "IPv4", "text", "192.168.1.10"), field("cidr", "CIDR", "number", "24")], run(v) { const ip = ipv4ToNumber(v.ip), cidr = Math.max(0, Math.min(32, int(v.cidr, 24))); const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0; const net = (ip & mask) >>> 0, broad = (net | (~mask >>> 0)) >>> 0; const first = cidr >= 31 ? "n/a" : numberToIpv4(net + 1); const last = cidr >= 31 ? "n/a" : numberToIpv4(broad - 1); const out = `Network: ${numberToIpv4(net)}\nFirst host: ${first}\nLast host: ${last}\nBroadcast: ${numberToIpv4(broad)}\nSubnet mask: ${numberToIpv4(mask)}`; return result("Subnet calculated.", [metric("Network", numberToIpv4(net)), metric("Broadcast", numberToIpv4(broad)), metric("Mask", numberToIpv4(mask)), metric("Usable", cidr >= 31 ? 0 : broad - net - 1)], out, outputPackHtml({ badge: "IPv4 subnet", hero: `${numberToIpv4(net)}/${cidr}`, cards: [["Network", numberToIpv4(net)], ["Broadcast", numberToIpv4(broad)], ["Usable hosts", cidr >= 31 ? 0 : broad - net - 1], ["Mask", numberToIpv4(mask)]], sections: [["Range", `First host: ${first}\nLast host: ${last}`], ["Copy-ready summary", out]] })); } },
    "password-generator": { sample: "Length 20, symbols on", fields: [field("length", "Length", "number", "20"), field("symbols", "Symbols", "select", "yes", false, [{ value: "yes", label: "Include symbols" }, { value: "no", label: "No symbols" }])], run(v) { const chars = `abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789${v.symbols === "no" ? "" : "!@#$%^&*_-+=?"}`; const bytes = new Uint32Array(Math.min(128, Math.max(8, int(v.length, 20)))); crypto.getRandomValues(bytes); const out = [...bytes].map((b) => chars[b % chars.length]).join(""); return result("Password generated locally.", [metric("Length", out.length), metric("Symbols", v.symbols), metric("Random", "Crypto"), metric("Saved", "No")], out, outputPackHtml({ badge: "Local password", hero: out, cards: [["Length", out.length], ["Symbols", v.symbols === "no" ? "No" : "Yes"], ["Randomness", "Crypto API"], ["Storage", "Not saved"]], sections: [["Password", out], ["Use safely", "Paste it into a password manager immediately. Do not send generated secrets through chat, email or screenshots."]] })); } },
    "uuid-generator": { sample: "5 UUIDs", fields: [field("count", "Count", "number", "5")], run(v) { const count = Math.min(100, Math.max(1, int(v.count, 5))); const out = Array.from({ length: count }, uuidv4).join("\n"); return result("UUID v4 generated.", [metric("Count", count), metric("Version", "v4"), metric("Format", "RFC 4122"), metric("Copy", "Ready")], out, outputPackHtml({ badge: "UUID v4", hero: `${count} identifier${count === 1 ? "" : "s"} generated`, cards: [["Count", count], ["Version", "v4"], ["Format", "RFC 4122"], ["Copy", "Ready"]], sections: [["UUID list", out], ["Best use", "Use these as non-sequential IDs for tests, mocks, records or temporary references."]] })); } },
    "timestamp-converter": { sample: "now", fields: [field("timestamp", "Timestamp or date", "text", "now", true)], run(v) { const raw = String(v.timestamp || "now"); const d = raw.toLowerCase() === "now" ? new Date() : /^\d{10}$/.test(raw) ? new Date(+raw * 1000) : /^\d{13}$/.test(raw) ? new Date(+raw) : new Date(raw); if (Number.isNaN(d.getTime())) throw new Error("Invalid date or timestamp."); const unix = Math.floor(d.getTime() / 1000); const out = `ISO: ${d.toISOString()}\nLocal: ${d.toLocaleString()}\nUTC: ${d.toUTCString()}\nUnix seconds: ${unix}`; return result("Timestamp converted.", [metric("Unix seconds", unix), metric("Milliseconds", d.getTime()), metric("Local", d.toLocaleString()), metric("UTC", d.toUTCString())], out, outputPackHtml({ badge: "Time value", hero: d.toISOString(), cards: [["Unix seconds", unix], ["Milliseconds", d.getTime()], ["Local", d.toLocaleString()], ["UTC", d.toUTCString()]], sections: [["Copy-ready formats", out], ["Next step", "Use ISO for logs and APIs, Unix seconds for many backends, and local time only when presenting to humans."]] })); } },
    "regex-tester": { sample: "Email regex test", fields: [field("pattern", "Pattern", "text", "\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b"), field("flags", "Flags", "text", "gi"), field("text", "Text", "textarea", "Contact sales@clickoz.com or support@example.com", true)], run(v) { const re = new RegExp(v.pattern, v.flags || "g"); const matches = [...String(v.text || "").matchAll(re)]; const rows = matches.map((m, i) => `${i + 1}. ${m[0]} at ${m.index}`).join("\n") || "No matches"; return result("Regex tested.", [metric("Matches", matches.length), metric("Flags", v.flags), metric("Groups", matches[0] ? matches[0].length - 1 : 0), metric("Status", "Done")], rows, outputPackHtml({ badge: "Regex result", hero: matches.length ? `${matches.length} match${matches.length === 1 ? "" : "es"} found` : "No matches found", cards: [["Matches", matches.length], ["Flags", v.flags || "g"], ["Groups", matches[0] ? matches[0].length - 1 : 0], ["Status", "Done"]], sections: [["Matches", rows], ["Next step", "If the match is too broad, add anchors, word boundaries or a more specific character class before using it in production."]] })); } },
    "text-diff-checker": { sample: "Compare two drafts", fields: [field("left", "Original", "textarea", "The product is fast.\nIt works on mobile.", true), field("right", "Updated", "textarea", "The product is fast and private.\nIt works on mobile.", true)], run(v) { const a = String(v.left || "").split(/\r?\n/), b = String(v.right || "").split(/\r?\n/); const max = Math.max(a.length, b.length); const lines = []; let changed = 0; for (let i = 0; i < max; i++) { if (a[i] === b[i]) lines.push(`  ${a[i] || ""}`); else { changed++; if (a[i] !== undefined) lines.push(`- ${a[i]}`); if (b[i] !== undefined) lines.push(`+ ${b[i]}`); } } const out = lines.join("\n"); return result("Line diff complete.", [metric("Original lines", a.length), metric("New lines", b.length), metric("Changed rows", changed), metric("Mode", "Line")], out, outputPackHtml({ badge: "Line diff", hero: changed ? `${changed} changed row${changed === 1 ? "" : "s"}` : "No line changes found", cards: [["Original lines", a.length], ["New lines", b.length], ["Changed rows", changed], ["Mode", "Line"]], sections: [["Diff", out || "No content to compare."], ["Review rule", "Read deletions and additions together before copying. A clean diff is still a draft review, not an approval."]] })); } },
    "color-converter": { sample: "#3b82f6", fields: [field("color", "Color", "text", "#3b82f6", true)], run(v) { const rgb = parseColor(v.color), hsl = rgbToHsl(rgb), hex = `#${[rgb.r, rgb.g, rgb.b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase(); const luma = Math.round((0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 * 100); const out = `HEX: ${hex}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`; return result("Color converted.", [metric("HEX", hex), metric("RGB", `${rgb.r}, ${rgb.g}, ${rgb.b}`), metric("HSL", `${hsl.h}, ${hsl.s}%, ${hsl.l}%`), metric("CSS", "Ready")], out, outputPackHtml({ badge: "Color values", hero: hex, cards: [["RGB", `${rgb.r}, ${rgb.g}, ${rgb.b}`], ["HSL", `${hsl.h}, ${hsl.s}%, ${hsl.l}%`], ["Luma", `${luma}%`], ["Text hint", luma > 58 ? "Dark text" : "Light text"]], sections: [["CSS values", out], ["Next step", "Check final contrast in the real UI before using the color for small text or controls."]] })); } },
    "robots-txt-generator": { sample: "Sitemap + private paths", fields: [field("sitemap", "Sitemap URL", "url", "https://example.com/sitemap.xml"), field("disallow", "Disallow paths", "textarea", "/admin/\n/private/", true)], run(v) { const paths = String(v.disallow || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean); const lines = ["User-agent: *", ...(paths.length ? paths.map((p) => `Disallow: ${p}`) : ["Allow: /"]), "", `Sitemap: ${v.sitemap || ""}`]; const out = lines.join("\n"); return result("robots.txt generated.", [metric("Rules", paths.length || 1), metric("Sitemap", v.sitemap ? "Included" : "Missing"), metric("SEO", "Technical"), metric("Copy", "Ready")], out, outputPackHtml({ badge: "robots.txt", hero: paths.length ? `${paths.length} disallow rule${paths.length === 1 ? "" : "s"}` : "Allow all crawlable paths", cards: [["Rules", paths.length || 1], ["Sitemap", v.sitemap ? "Included" : "Missing"], ["Scope", "User-agent *"], ["Copy", "Ready"]], sections: [["robots.txt", out], ["Before publishing", "Robots directives affect crawling, not access control. Do not use robots.txt to protect private data."]] })); } }
  };

  configs["instagram-bio-optimizer"] = {
    sample: "Fashion model based in Milan. Editorial shoots, lifestyle campaigns and brand collaborations.",
    fields: [
      field("bio", "Current bio or account idea", "textarea", "account instagram of a model", true, null, "Example: model in Milan, editorial shoots, lifestyle campaigns"),
      field("niche", "Niche", "text", "fashion model", false, null, "fashion model, fitness coach, travel creator"),
      field("audience", "Who should follow or contact you?", "text", "brands, photographers and style-focused followers", false, null, "brands, clients, fans, local buyers"),
      field("goal", "Main goal", "text", "book collaborations", false, null, "bookings, followers, leads, sales"),
      field("cta", "Call to action", "text", "DM for bookings/collabs", false, null, "DM, email, shop, portfolio, book now"),
      field("tone", "Tone", "select", "premium", false, ["premium", "friendly", "luxury", "bold", "minimal", "professional", "direct", "editorial"].map((x) => ({ value: x, label: smartTitle(x) })))
    ],
    run(v) { return instagramBioResult(v); }
  };

  configs["instagram-caption-generator"] = {
    sample: "new editorial streetwear shoot in Milan",
    fields: [
      field("input", "Post topic or photo context", "textarea", "new editorial streetwear shoot in Milan", true),
      field("platform", "Caption style", "select", "Instagram", false, ["Instagram", "Reels", "Carousel"].map((x) => ({ value: x, label: x })))
    ],
    run(v) {
      const topic = compactText(v.input);
      const first = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : "New post";
      const caption = [
        `${first}.`,
        "",
        "The detail most people miss: the first line has to make the photo easier to understand, not just decorate it.",
        "",
        "Save this if you want the full breakdown.",
        "",
        "#style #visualstory #creatorworkflow"
      ].join("\n");
      const output = [
        "Instagram Caption Generator",
        "",
        "Caption:",
        caption,
        "",
        "Short version:",
        `${first}. Save this before your next shoot.`,
        "",
        "CTA options:",
        "- Save this for later.",
        "- Comment 'GUIDE' if you want the checklist.",
        "- DM for collaborations."
      ].join("\n");
      const html = `
        <div class="cms-output-pack">
          <div class="cms-result-hero"><span>Caption</span><strong>${esc(caption).replace(/\n/g, "<br>")}</strong></div>
          <div class="cms-output-cards">
            <article><b>Hook</b><span>${esc(first)}</span></article>
            <article><b>CTA</b><span>Save / comment / DM</span></article>
            <article><b>Hashtags</b><span>3 focused tags</span></article>
          </div>
        </div>`;
      return result("Instagram caption drafted with hook, value and CTA.", [
        metric("Platform", v.platform),
        metric("Caption chars", caption.length),
        metric("CTA", "Included"),
        metric("Hashtags", 3)
      ], output, html);
    }
  };

  configs["meta-tag-optimizer"] = {
    sample: "https://clickoz.com/tools/\nTitle: Clickoz Tools - Free Online Tools\nDescription: Fast browser tools for SEO, writing, developers and creators.",
    fields: [
      field("url", "Page URL", "url", "https://clickoz.com/tools/", false),
      field("title", "Current SEO title", "text", "Clickoz Tools - Free Online Tools", false),
      field("description", "Current meta description", "textarea", "Fast browser tools for SEO, writing, developers and creators.", true),
      field("intent", "Search intent or page job", "text", "find a fast browser tool", true)
    ],
    run(v) {
      const title = compactText(v.title);
      const desc = compactText(v.description);
      const intent = compactText(v.intent);
      let host = "page";
      try { host = new URL(normUrl(v.url || "clickoz.com")).hostname.replace(/^www\./, ""); }
      catch (_) {}
      const titleStatus = !title ? "Missing" : title.length < 28 ? "Too short" : title.length <= 60 ? "Ready" : title.length <= 68 ? "Tighten" : "Too long";
      const descStatus = !desc ? "Missing" : desc.length < 80 ? "Too short" : desc.length <= 158 ? "Ready" : desc.length <= 170 ? "Tighten" : "Too long";
      const hasAction = /\b(fix|check|create|build|write|clean|format|convert|generate|preview|plan|save|find|use|finish|inspect|measure|compare)\b/i.test(`${title} ${desc} ${intent}`);
      const priority = titleStatus !== "Ready" ? "Fix the title first" : descStatus !== "Ready" ? "Fix the description next" : hasAction ? "Ready for SERP preview" : "Add a stronger action word";
      const baseIntent = intent || title || "the page job";
      const suggestedTitle = titleStatus === "Ready" ? title : smartTitle(baseIntent).slice(0, 58).replace(/\s+\S*$/, "");
      const suggestedDesc = descStatus === "Ready" && hasAction
        ? desc
        : `Use this page to ${baseIntent.toLowerCase().replace(/[.!?]$/, "")} with a clear result, practical steps and a next action.`;
      const output = `Current snippet\n${title || "Missing title"}\n${desc || "Missing description"}\n\nPriority\n${priority}\n\nSuggested title\n${suggestedTitle || "Add a specific title"}\n\nSuggested description\n${suggestedDesc}\n\nHTML\n<title>${suggestedTitle}</title>\n<meta name="description" content="${suggestedDesc.replace(/"/g, "&quot;")}" />`;
      const html = `<div class="cms-output-pack serp-pack">
        <div class="serp-url">${esc(host)} &gt; snippet-check</div>
        <div class="serp-title">${esc(suggestedTitle || title || "Missing title")}</div>
        <div class="serp-desc">${esc(suggestedDesc || desc || "Missing description")}</div>
        <div class="cms-quality-grid">
          <div class="cms-quality-card"><strong>Priority</strong><span>${esc(priority)}</span></div>
          <div class="cms-quality-card"><strong>Intent signal</strong><span>${esc(hasAction ? "Action wording found." : "Add the job the page helps finish.")}</span></div>
        </div>
      </div>`;
      return result("Meta title and description checked with a publishing priority.", [metric("Title", `${title.length} chars`), metric("Description", `${desc.length} chars`), metric("Priority", priority), metric("Intent", hasAction ? "Clear" : "Weak")], output, html);
    }
  };

  configs["url-encoder-decoder"] = {
    sample: "campaign name=spring launch & source=instagram",
    fields: [
      field("value", "URL value, query string or pasted parameter", "textarea", "campaign name=spring launch & source=instagram", true),
      field("mode", "Mode", "select", "auto", false, [
        { value: "auto", label: "Auto detect" },
        { value: "encode", label: "Encode value" },
        { value: "decode", label: "Decode value" },
        { value: "query", label: "Clean query string" }
      ])
    ],
    run(v) {
      const raw = String(v.value || "").trim();
      const mode = v.mode || "auto";
      const encoded = encodeURIComponent(raw);
      let decoded = "";
      let decodeStatus = "Valid";
      try { decoded = decodeURIComponent(raw.replace(/\+/g, "%20")); }
      catch (_) { decoded = "Input is not valid percent-encoded text."; decodeStatus = "Review"; }
      const querySource = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : raw;
      let queryClean = "";
      try {
        const params = new URLSearchParams(querySource);
        queryClean = [...params.entries()].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
      } catch (_) {
        queryClean = "";
      }
      const hasUnsafe = /[\s<>"'{}|\\^`]/.test(raw);
      const hasPercent = /%[0-9a-f]{2}/i.test(raw);
      const primary = mode === "decode" || (mode === "auto" && hasPercent && decodeStatus === "Valid")
        ? decoded
        : mode === "query" && queryClean
          ? queryClean
          : encoded;
      const issue = !raw ? "Paste a real value first." : hasUnsafe ? "Unsafe characters found." : hasPercent ? "Percent encoding detected." : "No obvious encoding issue.";
      const output = `Recommended result\n${primary}\n\nEncoded value\n${encoded}\n\nDecoded attempt\n${decoded}\n\nClean query string\n${queryClean || "No query-style parameters detected."}\n\nDetected issue\n${issue}`;
      return result("URL value analyzed with encode, decode and query repair paths.", [metric("Mode", mode), metric("Decode", decodeStatus), metric("Unsafe chars", hasUnsafe ? "Yes" : "No"), metric("Copy", "Ready")], output, outputPackHtml({
        badge: "URL repair",
        hero: primary || "Paste a real value first",
        cards: [["Mode", mode], ["Decode", decodeStatus], ["Unsafe chars", hasUnsafe ? "Yes" : "No"], ["Detected", hasPercent ? "Encoded" : "Raw"]],
        sections: [["Recommended result", primary || "No value yet."], ["Encoded value", encoded], ["Decoded attempt", decoded], ["Rule", "Encode parameter values before they enter a URL. Decode only when inspecting a value that is already encoded."]]
      }));
    }
  };

  configs["base64-encode-decode"] = {
    sample: "Clickoz premium tools",
    fields: [
      field("value", "Text, Base64 or Base64URL", "textarea", "Clickoz premium tools", true),
      field("mode", "Mode", "select", "auto", false, [
        { value: "auto", label: "Auto detect" },
        { value: "encode", label: "Encode text" },
        { value: "decode", label: "Decode Base64" }
      ])
    ],
    run(v) {
      const raw = String(v.value || "");
      const clean = raw.trim().replace(/\s+/g, "");
      const encoded = utf8ToBase64(raw);
      let decoded = "";
      let decodedOk = true;
      const hasBase64Shape = /^[A-Za-z0-9+/_-]+={0,2}$/.test(clean) && clean.length >= 8 && (clean.length % 4 === 0 || /[-_=]/.test(clean));
      try {
        const normalized = clean.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
        decoded = base64ToUtf8(padded);
      } catch (_) {
        decoded = "Input is not valid UTF-8 Base64 or Base64URL.";
        decodedOk = false;
      }
      const likelyBase64 = hasBase64Shape && decodedOk;
      const decodedDisplay = likelyBase64 || v.mode === "decode" ? decoded : "Input looks like plain text. Use Encode text to create Base64.";
      const primary = v.mode === "decode" || (v.mode === "auto" && likelyBase64) ? decoded : encoded;
      const output = `Recommended result\n${primary}\n\nEncoded text\n${encoded}\n\nDecoded attempt\n${decodedDisplay}\n\nSecurity note\nBase64 is a transport format, not encryption. Decode only to inspect content you are allowed to inspect.`;
      return result("Base64 text inspected with encode, decode and safety context.", [metric("Mode", v.mode || "auto"), metric("Encoded chars", encoded.length), metric("Decoded", likelyBase64 ? "Yes" : "Not detected"), metric("Security", "Not encryption")], output, outputPackHtml({
        badge: "Base64 converter",
        hero: primary || "No value yet",
        cards: [["Mode", v.mode || "auto"], ["Decoded", likelyBase64 ? "Yes" : "Not detected"], ["Base64URL", /[-_]/.test(clean) ? "Detected" : "Not detected"], ["Security", "Not encryption"]],
        sections: [["Recommended result", primary || "No value yet."], ["Encoded text", encoded], ["Decoded attempt", decodedDisplay], ["When to use it", "Use Base64 for transport or inspection, not for hiding secrets. For token-safe values, compare Base64URL rules before copying."]]
      }));
    }
  };

  configs["html-entity-encoder"] = {
    sample: "<span title=\"Save & publish\">5 > 3</span>",
    fields: [
      field("text", "HTML text or escaped entities", "textarea", "<span title=\"Save & publish\">5 > 3</span>", true),
      field("mode", "Mode", "select", "auto", false, [
        { value: "auto", label: "Auto detect" },
        { value: "encode", label: "Encode for HTML" },
        { value: "decode", label: "Decode entities" }
      ])
    ],
    run(v) {
      const raw = String(v.text || "");
      const ta = document.createElement("textarea");
      ta.innerHTML = raw;
      const decoded = ta.value;
      const encoded = esc(raw);
      const looksEscaped = /&(?:amp|lt|gt|quot|apos|#0?39|#[0-9]+|#x[0-9a-f]+);/i.test(raw);
      const primary = v.mode === "decode" || (v.mode === "auto" && looksEscaped) ? decoded : encoded;
      const output = `Recommended result\n${primary}\n\nEncoded for HTML\n${encoded}\n\nDecoded text\n${decoded}\n\nRule\nEncode when text will be inserted into HTML. Decode when you are reading or repairing already escaped content.`;
      return result("HTML entities converted with a clear context rule.", [metric("Mode", v.mode || "auto"), metric("Escaped input", looksEscaped ? "Yes" : "No"), metric("Original chars", raw.length), metric("Copy", "Ready")], output, outputPackHtml({
        badge: "HTML entities",
        hero: primary || "No text yet",
        cards: [["Mode", v.mode || "auto"], ["Escaped input", looksEscaped ? "Yes" : "No"], ["Chars", raw.length], ["Context", "HTML text"]],
        sections: [["Recommended result", primary || "No text yet."], ["Encoded for HTML", encoded], ["Decoded text", decoded], ["Rule", "Encode for markup output. Decode only for inspection, cleanup or repair."]]
      }));
    }
  };

  configs["html-entity-encoder-decoder"] = {
    sample: "Tom &amp; Jerry said &lt;strong&gt;save now&lt;/strong&gt;",
    fields: [field("text", "Broken, escaped or unsafe HTML text", "textarea", "Tom &amp; Jerry said &lt;strong&gt;save now&lt;/strong&gt;", true)],
    run(v) {
      const raw = String(v.text || "");
      const ta = document.createElement("textarea");
      ta.innerHTML = raw;
      const readable = ta.value;
      const safe = esc(readable);
      const entityCount = (raw.match(/&(?:amp|lt|gt|quot|apos|#0?39|#[0-9]+|#x[0-9a-f]+);/gi) || []).length;
      const unsafeCount = (readable.match(/[<>"'&]/g) || []).length;
      const risk = unsafeCount ? "Review before inserting into markup." : "Safe as plain text.";
      const output = `Safe HTML text\n${safe}\n\nReadable decoded text\n${readable}\n\nRepair notes\nEntities detected: ${entityCount}\nUnsafe characters after decode: ${unsafeCount}\n${risk}`;
      return result("HTML entity repair finished with safe and readable versions.", [metric("Entities", entityCount), metric("Unsafe chars", unsafeCount), metric("Repair", safe === raw ? "No change" : "Applied"), metric("Copy", "Safe text")], output, outputPackHtml({
        badge: "HTML repair",
        hero: safe || "No text yet",
        cards: [["Entities", entityCount], ["Unsafe chars", unsafeCount], ["Repair", safe === raw ? "No change" : "Applied"], ["Best use", "Broken markup"]],
        sections: [["Safe HTML text", safe || "No text yet."], ["Readable decoded text", readable || "No text yet."], ["Risk fixed", risk], ["Next check", "Paste the safe version into the exact HTML context and confirm it displays as text, not as executable markup."]]
      }));
    }
  };

  ["youtube-title-generator", "thumbnail-brief-generator", "youtube-description-generator", "youtube-hashtag-generator", "youtubevideotagoptimizer", "community-post-generator"].forEach((s) => {
    const listedTool = cms.toolBySlug?.[s] || { title: s, slug: s, category: "youtube" };
    const sample = humanSampleFor(listedTool);
    configs[s] = {
      sample,
      fields: [field("input", "Video idea, comment or upload context", "textarea", sample, true)],
      run(v) { const tool = cms.toolBySlug?.[s] || { title: s, slug: s }; const output = creatorOutput(tool, v.input, "YouTube"); return result(`${tool.title} ready with a structured upload path.`, [metric("Score", `${scoreHook(v.input)}/100`), metric("Format", "YouTube"), metric("Sections", 4), metric("Copy", "Ready")], output, premiumFallbackHtml(tool, v.input, "YouTube", output)); }
    };
  });

  function fallbackConfig(slug) {
    const tool = cms.toolBySlug?.[slug] || { title: slug.replace(/-/g, " "), category: "socialai", description: "" };
    const isCalc = /calculator|rate/i.test(tool.title);
    if (isCalc && slug === "sponsorship-rate-calculator") {
      return {
        sample: "100000 views, 4.5% engagement, 1 video + 1 short",
        fields: [field("views", "Average views", "number", "100000"), field("engagement", "Engagement %", "number", "4.5"), field("deliverables", "Deliverables", "text", "1 video + 1 short", true)],
        run(v) {
          const views = int(v.views, 0);
          const engagement = Math.max(0, parseFloat(v.engagement || 0));
          const base = views * (0.02 + engagement / 100);
          const min = Math.round(base * .7);
          const max = Math.round(base * 1.4);
          const midpoint = Math.round((min + max) / 2);
          const output = `Estimated range\n$${min} - $${max}\n\nAnchor price\n$${midpoint}\n\nDeliverables\n${v.deliverables || "-"}\n\nNegotiation notes\nValidate against niche, audience quality, usage rights, whitelisting, exclusivity, production effort and revision scope.`;
          return result("Sponsorship estimate ready with negotiation context.", [metric("Low", `$${min}`), metric("High", `$${max}`), metric("Views", views), metric("Deliverables", v.deliverables || "-")], output, outputPackHtml({
            badge: "Rate estimate",
            hero: `$${min} - $${max}`,
            cards: [["Anchor", `$${midpoint}`], ["Views", views], ["Engagement", `${engagement}%`], ["Scope", v.deliverables || "-"]],
            sections: [["Estimated range", `$${min} - $${max}`], ["Anchor price", `$${midpoint}`], ["Negotiation notes", "Validate against niche, audience quality, usage rights, whitelisting, exclusivity, production effort and revision scope."], ["Next step", "Use the media kit tool next so the rate is supported by audience, offer and deliverable details."]]
          }));
        }
      };
    }
    const sample = humanSampleFor(tool);
    return {
      sample,
      fields: [field("input", "Topic, draft or notes", "textarea", sample, true), field("platform", "Platform", "select", tool.category === "youtube" ? "YouTube" : tool.category === "socialai" ? "Short-form" : "General", false, ["General", "YouTube", "Instagram", "TikTok", "LinkedIn", "X", "Pinterest", "Short-form"].map((x) => ({ value: x, label: x })))],
      run(v) {
        const output = creatorOutput(tool, v.input, v.platform);
        return result(`${tool.title} ready with a structured output.`, [metric("Score", `${scoreHook(v.input)}/100`), metric("Platform", v.platform), metric("Sections", 4), metric("Next", "Copy/refine")], output, premiumFallbackHtml(tool, v.input, v.platform, output));
      }
    };
  }

  function qualityChecklistFor(tool, slug) {
    if (/meta|serp|keyword|slug|robots/i.test(slug) || tool.category === "seo") {
      return [
        "Make the search intent obvious in the first visible line.",
        "Keep the result useful first; never repeat keywords just to repeat them.",
        "Open the related SEO guide before publishing an important page."
      ];
    }
    if (/youtube|thumbnail|chapter|video|community/i.test(slug) || tool.category === "youtube" || tool.category === "socialai") {
      return [
        "The hook should promise one clear outcome, not generic hype.",
        "Match the CTA to the platform and the moment: watch, save, comment or click.",
        "Remove any line that could fit every creator in the niche."
      ];
    }
    if (/json|minifier|url|base64|entity|regex|diff|dns|http|subnet|uuid|timestamp|password|color/i.test(slug) || tool.category === "dev" || tool.category === "web") {
      return [
        "Test the copied value inside the original app, URL, payload or config.",
        "Remember that encoding is not encryption and generated values may need review.",
        "Save the input context so you can reproduce the check later."
      ];
    }
    if (/word|character|readability|whitespace|case/i.test(slug) || tool.category === "writing") {
      return [
        "Shorten one dense sentence before copying the final version.",
        "Check mobile readability: short paragraphs, clear headings and direct CTA.",
        "Use the next related tool if the draft still feels hard to scan."
      ];
    }
    return [
      "Use the output as a draft, then review it in the real page or workflow.",
      "Copy only the version that solves the specific problem you started with.",
      "Continue through the related tools and guides instead of stopping at one result."
    ];
  }

  function inputWarningsFor(root, slug, hasOutput) {
    if (!hasOutput) return [];
    const values = vals(root);
    const joined = Object.values(values).map((value) => String(value || "").trim()).filter(Boolean).join(" ");
    const warnings = [];

    if (/word-counter|character-counter|readability|whitespace|text-case/i.test(slug) && joined.length > 0 && joined.length < 70) {
      warnings.push("This is a short sample. Use a real paragraph before making length or readability decisions.");
    }
    if (/meta/.test(slug)) {
      const title = String(values.title || "").trim();
      const desc = String(values.description || "").trim();
      if (title && title.length < 28) warnings.push("The title may be too short to explain the page value clearly.");
      if (desc && desc.length < 70) warnings.push("The description may need more context before it can earn the click.");
    }
    if (/keyword-density/.test(slug) && joined.split(/\s+/).filter(Boolean).length < 40) {
      warnings.push("Density checks need enough text to be meaningful. Paste a real section when possible.");
    }
    if (/utm-builder/.test(slug) && [values.source, values.medium, values.campaign].some((value) => /^(source|medium|campaign)$/i.test(String(value || "").trim()))) {
      warnings.push("Replace fallback campaign names before posting, or analytics will be hard to read later.");
    }
    if (/password-generator/.test(slug) && int(values.length, 20) < 14) {
      warnings.push("Use at least 14 characters for sensitive accounts; longer is better when allowed.");
    }

    return warnings.slice(0, 2);
  }

  function renderInputWarnings(root, slug, hasOutput) {
    const card = $(".cms-result-card", root);
    if (!card) return;
    let warning = $(".cms-input-warnings", root);
    if (!warning) {
      warning = document.createElement("div");
      warning.className = "cms-input-warnings";
      const metrics = $(".cms-metrics", root);
      (metrics || card).insertAdjacentElement(metrics ? "afterend" : "beforeend", warning);
    }
    const warnings = inputWarningsFor(root, slug, hasOutput);
    warning.hidden = warnings.length === 0;
    warning.innerHTML = warnings.length
      ? `<strong>Check before copying</strong><ul>${warnings.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
      : "";
  }

  function setupCmsReveal(root) {
    if (root.dataset.revealReady === "true") return;
    root.dataset.revealReady = "true";
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const page = root.closest(".cms-tool-page") || document;
    const items = $$(".cms-tool-brief article, .cms-job-summary article, .cms-step-card, .cms-tool-app, .cms-result-card, .cms-related-box, .cms-ops-strip article, .cms-info-card", page);
    items.forEach((item, index) => {
      item.classList.add("cms-reveal");
      item.style.setProperty("--cms-reveal-delay", `${Math.min(index * 28, 180)}ms`);
    });
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    items.forEach((item) => observer.observe(item));
  }

  function renderResult(root, res) {
    const slug = root.getAttribute("data-tool-app") || "";
    const tool = cms.toolBySlug?.[slug] || { title: slug.replace(/-/g, " "), category: "" };
    const card = $(".cms-result-card", root);
    const hasOutput = Boolean(String(res.output || "").trim() || String(res.html || "").trim());
    if (card) {
      card.classList.toggle("has-output", hasOutput);
      card.classList.remove("cms-result-updated");
      requestAnimationFrame(() => card.classList.add("cms-result-updated"));
    }
    root.dataset.toolHasOutput = hasOutput ? "true" : "false";
    $(".cms-result-status", root).textContent = res.status || "Result ready.";
    $(".cms-metrics", root).innerHTML = (res.metrics || []).map(([a, b]) => `<div class="cms-metric"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`).join("");
    renderInputWarnings(root, slug, hasOutput);
    const out = $(".cms-output", root);
    let label = $(".cms-output-label", root);
    if (!label) {
      label = document.createElement("div");
      label.className = "cms-output-label";
      out.insertAdjacentElement("beforebegin", label);
    }
    label.innerHTML = `<span>${hasOutput ? "Primary output" : "Ready when you are"}</span><small>${hasOutput ? "Copy-ready result below" : "Use a sample or paste real input"}</small>`;
    if (hasOutput) {
      if (res.html) renderSafeHtml(out, res.html);
      else renderTextOutput(out, res.output || "");
      out.dataset.copy = res.output || out.textContent || "";
    } else {
      out.innerHTML = `<div class="cms-output-empty"><b>No output yet</b><span>Pick an example or type real input. Your work stays browser-only and the last input is restored locally.</span></div>`;
      out.dataset.copy = "";
    }

    let next = $(".cms-next-action", root);
    if (!next) {
      next = document.createElement("div");
      next.className = "cms-next-action";
      out.insertAdjacentElement("afterend", next);
    }
    next.innerHTML = hasOutput
      ? `<strong>Next best action</strong><span>${esc(nextActionFor(tool, slug))}</span>`
      : `<strong>Start fast</strong><span>Load a sample, paste real input or use Ctrl+K to jump to the next Clickoz job.</span>`;

    let quality = $(".cms-quality-action", root);
    if (!quality || quality.tagName !== "DETAILS") {
      const old = quality;
      quality = document.createElement("div");
      const details = document.createElement("details");
      details.className = "cms-quality-action";
      quality = details;
      if (old) old.replaceWith(quality);
      else next.insertAdjacentElement("afterend", quality);
    }
    quality.hidden = !hasOutput;
    if (hasOutput) {
      quality.open = false;
      quality.innerHTML = `<summary>Output check</summary><ul>${qualityChecklistFor(tool, slug).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    }
    root.dispatchEvent(new CustomEvent("clickoz:tool-result", { detail: { hasOutput, status: res.status || "" } }));
  }

  function nextToolChipsFor(tool) {
    const items = (tool.relatedTools || [])
      .map((slug) => cms.toolBySlug?.[slug])
      .filter(Boolean)
      .slice(0, 3);
    if (!items.length) return "";
    return `<div class="cms-next-chips" aria-label="Next useful tools">${items.map((item) => `<a href="${esc(item.url)}">${esc(item.title)}</a>`).join("")}</div>`;
  }

  function nextActionFor(tool, slug) {
    if (/word-counter|character-counter|readability|whitespace|text-case/i.test(slug)) {
      return "Use the result to shorten one paragraph, then open the related guide if the text still feels heavy.";
    }
    if (/meta|serp|keyword|slug/i.test(slug)) {
      return "Copy one improved version, then compare it with the related SEO guide before publishing the page.";
    }
    if (/json|minifier|url|base64|entity|regex|diff/i.test(slug)) {
      return "Validate the output in the original context before shipping it; encoding and decoding depend on where the value is used.";
    }
    if (/dns|http|subnet|password|uuid|timestamp|robots|color/i.test(slug)) {
      return "Save the result with the target URL or value you tested, so you can repeat the check after the next change.";
    }
    if (/youtube|thumbnail|chapter|video|community/i.test(slug) || tool.category === "youtube") {
      return "Pick the strongest option, then run the next YouTube tool in the workflow: thumbnail, description, tags or tracking.";
    }
    if (tool.category === "tracking") {
      return "Copy the final URL and keep the same source, medium and campaign naming rules across every channel.";
    }
    if (tool.category === "socialai") {
      return "Keep the version that sounds specific to the platform, then remove any generic line before posting.";
    }
    return "Copy the result, review it once in context, then continue with the related guide or next connected tool.";
  }

  async function run(root, config, options = {}) {
    const btn = $("[data-action='run']", root);
    const original = btn ? btn.textContent : "";
    const slug = root.getAttribute("data-tool-app") || "";
    const tool = cms.toolBySlug?.[slug] || { title: slug.replace(/-/g, " "), category: "" };
    root.classList.add("is-running");
    root.dataset.toolPhase = "running";
    root.setAttribute("aria-busy", "true");
    renderRunMeter(root, tool, "running");
    try {
      if (btn) {
        btn.textContent = "Working...";
        btn.dataset.busy = "true";
        btn.setAttribute("aria-busy", "true");
      }
      renderResult(root, await config.run(vals(root)));
      renderRunMeter(root, tool, "ready");
      root.dataset.toolPhase = "ready";
      if (options.save !== false) saveToolState(root, slug);
      if (options.record) {
        pushToolHistory(root, slug);
        renderToolHistory(root, slug);
      }
    } catch (err) {
      renderResult(root, result("Check the input and try again.", [metric("Status", "Input error"), metric("Privacy", "Browser"), metric("Output", "Blocked"), metric("Fix", "Review")], err?.message || "Unable to run this tool."));
      renderRunMeter(root, tool, "error");
      root.dataset.toolPhase = "error";
      flashTool(root, "Check the input and try again.", "warn");
    } finally {
      root.classList.remove("is-running");
      root.setAttribute("aria-busy", "false");
      if (btn) {
        delete btn.dataset.busy;
        btn.removeAttribute("aria-busy");
        btn.textContent = original || "Run tool";
      }
    }
  }

  function init() {
    const root = $("[data-tool-app]");
    if (!root) return;
    const slug = root.getAttribute("data-tool-app");
    const config = configs[slug] || fallbackConfig(slug);
    const tool = cms.toolBySlug?.[slug] || { title: slug.replace(/-/g, " "), description: "" };
    const examples = toolExamples(slug, config, tool).filter(Boolean).slice(0, 3);
    renderFields(config, root);
    ensureToolUx(root);
    renderRunMeter(root, tool, "idle");
    const restored = restoreToolState(root, slug);
    renderToolHistory(root, slug);
    if (restored) flashTool(root, "Last input restored locally.");
    setupCmsReveal(root);
    const pre = $(".cms-example-box pre", root);
    const options = $(".cms-example-options", root);
    function showExample(index, load = false) {
      const example = examples[index] || examples[0];
      if (pre) pre.textContent = previewExample(example);
      renderExampleSequence(root, tool, example, index, load ? "loaded" : "preview");
      if (options) {
        options.querySelectorAll(".cms-example-option").forEach((btn, i) => {
          const active = i === index;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-pressed", active ? "true" : "false");
        });
      }
      if (load) {
        applyExample(root, config, example);
        run(root, config, { record: true });
        flashTool(root, "Example loaded. Output refreshed.");
      }
    }
    if (options) {
      options.innerHTML = examples.map((example, index) => `<button class="cms-example-option${index === 0 ? " active" : ""}" type="button" data-example="${index}" aria-pressed="${index === 0 ? "true" : "false"}">${esc(typeof example === "string" ? `Example ${index + 1}` : example.label || `Example ${index + 1}`)}</button>`).join("");
    }
    showExample(0, false);
    root.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      const exampleBtn = e.target.closest("[data-example]");
      const historyBtn = e.target.closest("[data-history]");
      if (historyBtn) {
        const item = readHistory(slug)[int(historyBtn.getAttribute("data-history"), 0)];
        if (item && item.values) {
          applyValues(root, item.values);
          await run(root, config, { record: false });
          flashTool(root, "History restored.");
        }
        return;
      }
      if (exampleBtn) {
        const index = int(exampleBtn.getAttribute("data-example"), 0);
        showExample(index, true);
        return;
      }
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      if (action === "run") {
        await run(root, config, { record: true });
        flashTool(root, "Result refreshed.");
      }
      if (action === "clear") {
        root.querySelectorAll("input, textarea").forEach((el) => { el.value = ""; });
        safeStorage("remove", stateKey(slug));
        renderResult(root, result("Cleared. Pick an example or enter your own input.", [], ""));
        flashTool(root, "Input cleared.");
      }
      if (action === "copy") {
        const text = $(".cms-output", root)?.dataset.copy || "";
        const hasText = Boolean(text);
        const ok = hasText && await copyText(text);
        const old = btn.textContent;
        btn.textContent = ok ? "Copied" : hasText ? "Copy failed" : "Nothing to copy";
        btn.classList.toggle("is-copied", ok);
        if (hasText && !ok) selectOutput(root);
        flashTool(root, ok ? "Copied to clipboard." : hasText ? "Copy blocked by the browser. Select the output manually." : "Run the tool before copying.", ok ? "ok" : "warn");
        setTimeout(() => { btn.textContent = old; btn.classList.remove("is-copied"); }, 1000);
      }
    });
    $(".cms-form-grid", root)?.addEventListener("input", () => {
      saveToolState(root, slug);
      clearTimeout(root._timer);
      root._timer = setTimeout(() => run(root, config, { record: false }), 220);
    });
    root.addEventListener("keydown", async (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "Enter") {
        e.preventDefault();
        await run(root, config, { record: true });
        flashTool(root, "Ran from shortcut.");
      }
      if (e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        const text = $(".cms-output", root)?.dataset.copy || "";
        const hasText = Boolean(text);
        const ok = hasText && await copyText(text);
        if (hasText && !ok) selectOutput(root);
        flashTool(root, ok ? "Copied to clipboard." : hasText ? "Copy blocked by the browser. Select the output manually." : "Run the tool before copying.", ok ? "ok" : "warn");
      }
      if (e.shiftKey && e.key === "Backspace") {
        e.preventDefault();
        root.querySelectorAll("input, textarea").forEach((el) => { el.value = ""; });
        safeStorage("remove", stateKey(slug));
        renderResult(root, result("Cleared. Pick an example or enter your own input.", [], ""));
        flashTool(root, "Input cleared.");
      }
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (duplicateFocusedField(root)) flashTool(root, "Focused field duplicated.");
      }
    });
    run(root, config, { save: false, record: false });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
