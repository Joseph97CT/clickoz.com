(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  // -----------------------------
  // Elements
  // -----------------------------
  const elUrl       = $("#ubUrl");
  const elPreset    = $("#ubPreset");
  const elSource    = $("#ubSource");
  const elMedium    = $("#ubMedium");
  const elCampaign  = $("#ubCampaign");
  const elTerm      = $("#ubTerm");
  const elContent   = $("#ubContent");

  const elOutput    = $("#ubOutput");
  const elHost      = $("#ubHost");
  const elPath      = $("#ubPath");
  const elLen       = $("#ubLen");
  const elCount     = $("#ubParamsCount");

  const btnCopyLink   = $("#ubCopyLink");
  const btnCopyParams = $("#ubCopyParams");
  const btnClear      = $("#ubClear");

  const exBox      = $("#ubExampleBox");
  const btnLoadEx  = $("#ubLoadExample");
  const btnNewEx   = $("#ubNewExample");

  if (!elUrl || !elOutput) return;

  // -----------------------------
  // Examples (realistic)
  // -----------------------------
  const examples = [
    {
      title: "YouTube description → website",
      url: "https://clickoz.com/tools/",
      utm: { source: "youtube", medium: "video", campaign: "tool-hub", content: "description" }
    },
    {
      title: "Instagram bio → landing",
      url: "https://clickoz.com/",
      utm: { source: "instagram", medium: "social", campaign: "bio", content: "profile" }
    },
    {
      title: "TikTok profile → product page",
      url: "https://example.com/product/super-drop?ref=profile",
      utm: { source: "tiktok", medium: "social", campaign: "launch-jan", content: "profile" }
    },
    {
      title: "Newsletter CTA button → blog post",
      url: "https://example.com/blog/utm-guide",
      utm: { source: "newsletter", medium: "email", campaign: "jan-update", content: "cta-button" }
    },
    {
      title: "Paid ads (Google) → keyword test",
      url: "https://example.com/landing?variant=a",
      utm: { source: "google", medium: "cpc", campaign: "brand-search", term: "utm builder", content: "ad-a" }
    },
    {
      title: "Partner mention → referral",
      url: "https://example.com/welcome",
      utm: { source: "partner-site", medium: "referral", campaign: "partner-spotlight", content: "sidebar-link" }
    },
    {
      title: "QR poster (offline) → signup",
      url: "https://example.com/signup#pricing",
      utm: { source: "qr", medium: "offline", campaign: "winter-poster", content: "street-banner" }
    }
  ];
  let exIndex = 0;

  // -----------------------------
  // Presets
  // -----------------------------
  const presets = {
    youtube:     { source: "youtube",     medium: "video",  campaign: "video-campaign", content: "description" },
    instagram:   { source: "instagram",   medium: "social", campaign: "ig-bio",         content: "profile" },
    tiktok:      { source: "tiktok",      medium: "social", campaign: "tiktok-profile", content: "profile" },
    newsletter:  { source: "newsletter",  medium: "email",  campaign: "newsletter",     content: "cta" },
    ads:         { source: "google",      medium: "cpc",    campaign: "paid-campaign",  term: "keyword", content: "ad-variant" }
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  function normalizeText(t) {
    return String(t ?? "").replace(/\u00A0/g, " ").trim();
  }

  // light sanitize: trim + spaces → hyphen (keeps casing + underscores)
  function cleanValue(v) {
    const t = normalizeText(v);
    if (!t) return "";
    return t.replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function ensureProtocol(raw) {
    const s = normalizeText(raw);
    if (!s) return "";
    // already has scheme
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return s;
    // protocol-relative
    if (s.startsWith("//")) return "https:" + s;
    // mailto/tel/data etc - keep as-is
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return s;
    return "https://" + s;
  }

  function safeUrl(raw) {
    const s = ensureProtocol(raw);
    if (!s) return null;

    try {
      const u = new URL(s);
      // guard: needs host for http(s)
      if ((u.protocol === "http:" || u.protocol === "https:") && !u.host) return null;
      return u;
    } catch {
      return null;
    }
  }

  function setOrDelete(sp, key, value) {
    if (value) sp.set(key, value);
    else sp.delete(key);
  }

  function buildUtmLink() {
    const u = safeUrl(elUrl.value);
    if (!u) return { ok: false, link: "", host: "—", path: "—", len: 0, count: 0 };

    // preserve existing params; only update UTM keys
    const sp = u.searchParams;

    const vSource   = cleanValue(elSource.value);
    const vMedium   = cleanValue(elMedium.value);
    const vCampaign = cleanValue(elCampaign.value);
    const vTerm     = cleanValue(elTerm.value);
    const vContent  = cleanValue(elContent.value);

    setOrDelete(sp, "utm_source", vSource);
    setOrDelete(sp, "utm_medium", vMedium);
    setOrDelete(sp, "utm_campaign", vCampaign);
    setOrDelete(sp, "utm_term", vTerm);
    setOrDelete(sp, "utm_content", vContent);

    // count present UTM keys
    let count = 0;
    for (const k of UTM_KEYS) if (sp.get(k)) count++;

    const host = u.host || "—";
    const path = (u.pathname || "/") + (u.hash || "");

    const link = u.toString();
    return { ok: true, link, host, path, len: link.length, count };
  }

  async function copyToClipboard(str) {
    const text = String(str ?? "");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }

  function flash(btn, ok, baseText) {
    if (!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btn.textContent = base), 900);
  }

  function render() {
    const r = buildUtmLink();

    if (elOutput) elOutput.value = r.link || "";
    if (elHost) elHost.textContent = r.host;
    if (elPath) elPath.textContent = r.path;

    if (elLen) elLen.textContent = String(r.len || 0);
    if (elCount) elCount.textContent = String(r.count || 0);

    // subtle "invalid" state
    if (!r.ok) {
      elOutput.placeholder = "Paste a valid URL to generate your UTM link…";
      elOutput.value = "";
      if (elLen) elLen.textContent = "0";
      if (elCount) elCount.textContent = "0";
    }
  }

  function setExampleBox(ex) {
    if (!exBox) return;
    exBox.textContent =
      `${ex.title}\n\n` +
      `URL: ${ex.url}\n` +
      `utm_source=${ex.utm.source || ""}\n` +
      `utm_medium=${ex.utm.medium || ""}\n` +
      `utm_campaign=${ex.utm.campaign || ""}` +
      (ex.utm.term ? `\nutm_term=${ex.utm.term}` : "") +
      (ex.utm.content ? `\nutm_content=${ex.utm.content}` : "");
  }

  function applyExample(ex) {
    elUrl.value = ex.url;
    elSource.value = ex.utm.source || "";
    elMedium.value = ex.utm.medium || "";
    elCampaign.value = ex.utm.campaign || "";
    elTerm.value = ex.utm.term || "";
    elContent.value = ex.utm.content || "";
    render();
    elUrl.focus();
  }

  function nextExample() {
    exIndex = (exIndex + 1) % examples.length;
    setExampleBox(examples[exIndex]);
  }

  function applyPreset(key) {
    const p = presets[key];
    if (!p) return;

    // Fill only if empty → non-destructive
    if (!normalizeText(elSource.value))   elSource.value = p.source;
    if (!normalizeText(elMedium.value))   elMedium.value = p.medium;
    if (!normalizeText(elCampaign.value)) elCampaign.value = p.campaign;
    if (!normalizeText(elTerm.value) && p.term) elTerm.value = p.term;
    if (!normalizeText(elContent.value))  elContent.value = p.content;

    render();
  }

  // -----------------------------
  // Events
  // -----------------------------
  let tmr = null;
  function scheduleRender() {
    clearTimeout(tmr);
    tmr = setTimeout(render, 30);
  }

  [elUrl, elSource, elMedium, elCampaign, elTerm, elContent].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", scheduleRender);
    el.addEventListener("change", scheduleRender);
  });

  if (elPreset) {
    elPreset.addEventListener("change", () => {
      const key = elPreset.value;
      if (!key) return;
      applyPreset(key);

      // hint box aligns with preset (nice UX)
      if (exBox) {
        exBox.textContent = `Preset applied → edit values if needed, then copy the link.\n\nTip: keep naming consistent across channels.`;
      }
    });
  }

  if (btnNewEx) btnNewEx.addEventListener("click", nextExample);

  if (btnLoadEx) {
    btnLoadEx.addEventListener("click", () => {
      const ex = examples[exIndex];
      applyExample(ex);
      if (exBox) exBox.textContent = "Example loaded → edit values if needed, then copy the link.";
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      elUrl.value = "";
      elPreset.value = "";
      elSource.value = "";
      elMedium.value = "";
      elCampaign.value = "";
      elTerm.value = "";
      elContent.value = "";
      setExampleBox(examples[exIndex]);
      render();
      elUrl.focus();
    });
  }

  if (btnCopyLink) {
    btnCopyLink.addEventListener("click", async () => {
      const r = buildUtmLink();
      const ok = r.ok && r.link ? await copyToClipboard(r.link) : false;
      flash(btnCopyLink, ok, "📋 Copy link");
    });
  }

  if (btnCopyParams) {
    btnCopyParams.addEventListener("click", async () => {
      const s = cleanValue(elSource.value);
      const m = cleanValue(elMedium.value);
      const c = cleanValue(elCampaign.value);
      const t = cleanValue(elTerm.value);
      const o = cleanValue(elContent.value);

      const lines = [];
      if (s) lines.push(`utm_source=${encodeURIComponent(s)}`);
      if (m) lines.push(`utm_medium=${encodeURIComponent(m)}`);
      if (c) lines.push(`utm_campaign=${encodeURIComponent(c)}`);
      if (t) lines.push(`utm_term=${encodeURIComponent(t)}`);
      if (o) lines.push(`utm_content=${encodeURIComponent(o)}`);

      const payload = lines.join("&");
      const ok = payload ? await copyToClipboard(payload) : false;
      flash(btnCopyParams, ok, "✅ Copy UTM params");
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  setExampleBox(examples[exIndex]);
  render();
})();

