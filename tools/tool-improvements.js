(() => {
  "use strict";
  const root = document.querySelector("[data-cz-tool]");
  if (!root) return;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));
  const type = root.dataset.czTool;
  const input = $("[data-input]");
  const output = $("[data-output]");
  const stats = $("[data-stats]");

  const samples = {
    text: "Clear writing helps readers move faster. Short sentences make ideas easier to scan, while useful details build trust. Edit the draft until the next step feels obvious.",
    json: "{\"name\":\"Clickoz\",\"tools\":[\"json\",\"seo\",\"writing\"],\"active\":true,\"count\":18}",
    url: "https://example.com/search?q=hello world&campaign=spring sale",
    html: "<a title=\"Mark's list\" href=\"https://example.com/?q=a&b=c\">Read the guide</a>"
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }
  function words(text) {
    return (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter(Boolean);
  }
  function sentences(text) {
    return text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  }
  function slugify(text) {
    return String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  }
  function syllables(word) {
    let clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!clean) return 0;
    if (clean.length <= 3) return 1;
    clean = clean.replace(/(?:e|es|ed)$/i, "");
    const groups = clean.match(/[aeiouy]{1,2}/g);
    return groups ? Math.max(1, groups.length) : 1;
  }
  function setStats(items) {
    if (!stats) return;
    stats.innerHTML = items.map(([label, value]) => `<div class="cz-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
  }
  function setOutput(value) {
    if (output) output.value = value;
  }
  async function copyOutput() {
    try { await navigator.clipboard.writeText(output?.value || ""); } catch (_) {}
  }
  function titleCase(text) {
    const small = new Set(["a","an","and","as","at","but","by","for","in","of","on","or","the","to","vs","with"]);
    return String(text).toLowerCase().split(/\s+/).map((word, index) => index > 0 && small.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }
  function sentenceCase(text) {
    return String(text).toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase());
  }

  function analyzeText() {
    const value = input?.value || "";
    const list = words(value);
    const sent = sentences(value);
    const chars = value.length;
    const noSpaces = value.replace(/\s/g, "").length;

    if (type === "character-counter") {
      setStats([["Characters", chars], ["No spaces", noSpaces], ["Words", list.length], ["Lines", value ? value.split(/\r?\n/).length : 0]]);
      setOutput(`Characters: ${chars}\nCharacters without spaces: ${noSpaces}\nWords: ${list.length}`);
    }

    if (type === "readability") {
      const wordCount = Math.max(1, list.length);
      const sentenceCount = Math.max(1, sent.length);
      const syllableCount = list.reduce((sum, word) => sum + syllables(word), 0);
      const ease = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
      const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
      setStats([["Reading ease", Math.max(0, Math.min(100, ease)).toFixed(1)], ["Grade", Math.max(0, grade).toFixed(1)], ["Avg sentence", (wordCount / sentenceCount).toFixed(1)], ["Words", list.length]]);
      setOutput(ease >= 60 ? "Good readability for web content. Keep headings and bullets clear." : "Consider shorter sentences, simpler wording and more scannable paragraphs.");
    }

    if (type === "keyword-density") {
      const focus = ($("[data-focus]")?.value || "").trim().toLowerCase();
      const freq = new Map();
      list.forEach((word) => freq.set(word, (freq.get(word) || 0) + 1));
      const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
      const focusCount = focus ? (value.toLowerCase().match(new RegExp(`\\b${focus.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "g")) || []).length : 0;
      const density = list.length ? ((focusCount / list.length) * 100).toFixed(2) : "0.00";
      setStats([["Words", list.length], ["Unique", freq.size], ["Focus count", focusCount], ["Density", `${density}%`]]);
      setOutput(top.map(([term, count]) => `${term}: ${count} (${list.length ? ((count / list.length) * 100).toFixed(2) : "0.00"}%)`).join("\n"));
      const body = $("[data-terms]");
      if (body) body.innerHTML = top.map(([term, count]) => `<tr><td>${esc(term)}</td><td>${count}</td><td>${list.length ? ((count / list.length) * 100).toFixed(2) : "0.00"}%</td></tr>`).join("");
    }

    if (type === "whitespace") {
      const cleaned = value.replace(/[ \t]+/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      setStats([["Before", chars], ["After", cleaned.length], ["Removed", Math.max(0, chars - cleaned.length)], ["Lines", cleaned ? cleaned.split(/\r?\n/).length : 0]]);
      setOutput(cleaned);
    }

    if (type === "slug") {
      const slug = slugify(value);
      setStats([["Length", slug.length], ["Words", slug ? slug.split("-").length : 0], ["Status", slug.length <= 70 ? "Good" : "Long"], ["Hyphens", (slug.match(/-/g) || []).length]]);
      setOutput(slug);
    }
  }

  function runCodec(reverse = false) {
    const value = input?.value || "";
    try {
      if (type === "json-minify") {
        const result = JSON.stringify(JSON.parse(value || "{}"));
        setOutput(result);
        setStats([["Status", "Valid"], ["Input bytes", value.length], ["Output bytes", result.length], ["Saved", Math.max(0, value.length - result.length)]]);
      }
      if (type === "url-codec") {
        const result = reverse ? decodeURIComponent(value) : encodeURIComponent(value);
        setOutput(result);
        setStats([["Mode", reverse ? "Decode" : "Encode"], ["Length", result.length], ["Changed", result === value ? "No" : "Yes"], ["Status", "OK"]]);
      }
    } catch (error) {
      setOutput("");
      setStats([["Error", error.message]]);
    }
  }

  function initMeta() {
    const url = $("[data-url]");
    const title = $("[data-title]");
    const desc = $("[data-desc]");
    const preview = $("[data-preview]");
    const update = () => {
      const u = url.value || "https://clickoz.com/tools/";
      const t = title.value || "Useful SEO title";
      const d = desc.value || "A clear description that helps searchers decide before they click.";
      preview.innerHTML = `<div class="cz-serp-url">${esc(u)}</div><div class="cz-serp-title">${esc(t)}</div><p class="cz-serp-desc">${esc(d)}</p>`;
      setStats([["Title", `${t.length}/60`], ["Description", `${d.length}/160`], ["Title status", t.length <= 60 ? "Good" : "Long"], ["Desc status", d.length <= 160 ? "Good" : "Long"]]);
    };
    [url, title, desc].forEach((el) => el?.addEventListener("input", update));
    $("[data-sample]")?.addEventListener("click", () => {
      url.value = "https://clickoz.com/guides/youtube-title-thumbnail-checklist/";
      title.value = "YouTube Title and Thumbnail Checklist for Creators";
      desc.value = "Use this practical checklist to improve YouTube titles, thumbnails, descriptions and upload packaging before publishing.";
      update();
    });
    $("[data-clear]")?.addEventListener("click", () => {
      url.value = "";
      title.value = "";
      desc.value = "";
      update();
    });
    update();
  }

  function initCase() {
    const run = (mode) => {
      const value = input.value;
      const result = mode === "title" ? titleCase(value) : mode === "upper" ? value.toUpperCase() : mode === "lower" ? value.toLowerCase() : mode === "slug" ? slugify(value) : sentenceCase(value);
      setOutput(result);
      setStats([["Mode", mode], ["Input", value.length], ["Output", result.length], ["Words", words(result).length]]);
    };
    $$("[data-case]").forEach((btn) => btn.addEventListener("click", () => run(btn.dataset.case)));
    $("[data-sample]")?.addEventListener("click", () => {
      input.value = "how to make better youtube titles without sounding spammy";
      run("title");
    });
    $("[data-clear]")?.addEventListener("click", () => {
      input.value = "";
      setOutput("");
      setStats([]);
    });
    $("[data-copy]")?.addEventListener("click", copyOutput);
    input?.addEventListener("input", () => run("sentence"));
  }

  if (["character-counter", "readability", "keyword-density", "whitespace", "slug"].includes(type)) {
    input?.addEventListener("input", analyzeText);
    $("[data-focus]")?.addEventListener("input", analyzeText);
    $("[data-sample]")?.addEventListener("click", () => { input.value = samples.text; analyzeText(); });
    $("[data-clear]")?.addEventListener("click", () => { input.value = ""; setOutput(""); setStats([]); });
    $("[data-copy]")?.addEventListener("click", copyOutput);
    analyzeText();
  }
  if (["json-minify", "url-codec"].includes(type)) {
    $("[data-run]")?.addEventListener("click", () => runCodec(false));
    $("[data-alt]")?.addEventListener("click", () => runCodec(true));
    $("[data-sample]")?.addEventListener("click", () => { input.value = type === "json-minify" ? samples.json : samples.url; runCodec(false); });
    $("[data-clear]")?.addEventListener("click", () => { input.value = ""; setOutput(""); setStats([]); });
    $("[data-copy]")?.addEventListener("click", copyOutput);
  }
  if (type === "meta-preview") initMeta();
  if (type === "case-converter") initCase();
})();
