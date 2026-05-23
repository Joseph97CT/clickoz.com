/* /tools/tools.js?v=11
   Directory behavior:
   - All is the default state, so /tools/ starts at the top.
   - Category chips navigate to sections; they do not hide the catalogue.
   - Search filters cards only while typing.
   - Tool cards receive compact workflow badges automatically.
*/

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const chipsWrap = $("#toolsChips");
  const chips = chipsWrap ? $$(".chip", chipsWrap) : [];
  const searchInput = $("#toolsSearch");
  const shell = $(".tools-shell");
  const hero = $(".tools-hero");
  const sectionsWrap = $(".tool-sections");
  const sections = sectionsWrap ? $$(".tool-section", sectionsWrap) : [];

  if (!chipsWrap || chips.length === 0 || sections.length === 0) return;

  const sectionByKey = new Map();
  sections.forEach((sec) => {
    const key = (sec.getAttribute("data-section") || sec.id || "").trim();
    if (key) sectionByKey.set(key, sec);
  });

  const navOffset = () => {
    const nav = $("#topNav");
    return nav ? nav.getBoundingClientRect().height + 16 : 16;
  };

  function setActiveChip(key, { focus = false } = {}) {
    chips.forEach((chip) => {
      const active = chip.getAttribute("data-filter") === key;
      chip.classList.toggle("active", active);
      if (active) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    });

    if (focus) {
      const active = chips.find((chip) => chip.getAttribute("data-filter") === key);
      if (active) active.focus({ preventScroll: true });
    }
  }

  function updateHash(key) {
    if (key === "all") {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      return;
    }

    const hash = `#${encodeURIComponent(key)}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  function scrollToKey(key) {
    const target = key === "all" ? hero || shell : sectionByKey.get(key);
    if (!target) return;

    const y = window.scrollY + target.getBoundingClientRect().top - navOffset();
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function activateKey(key, { doScroll = true, syncHash = true, focus = false } = {}) {
    const valid = key === "all" || sectionByKey.has(key);
    if (!valid) return;

    setActiveChip(key, { focus });
    if (syncHash) updateHash(key);
    if (doScroll) scrollToKey(key);
  }

  const sectionFallbackFeatures = {
    seo: [["🔎", "Search intent"], ["🧲", "Snippet-ready"], ["📋", "Copy output"]],
    text: [["✍️", "Writing flow"], ["📱", "Mobile scan"], ["🔒", "Local input"]],
    dev: [["🧪", "Debug faster"], ["🔒", "Browser-only"], ["🧾", "Clean payload"]],
    creator: [["🎬", "Creator flow"], ["📈", "Growth ideas"], ["📋", "Copy output"]],
    youtube: [["▶️", "Upload flow"], ["🎬", "Creator ideas"], ["📋", "Copy output"]],
    web: [["🌐", "Web check"], ["🛡️", "Security flow"], ["📋", "Copy output"]],
    tracking: [["📈", "Track links"], ["🧭", "Clean UTM"], ["📋", "Copy output"]],
    socialai: [["✨", "Creator boost"], ["🎯", "Hook logic"], ["📋", "Copy output"]],
  };

  const toolFeatures = {
    "meta-tags": [["🏷️", "Title + description"], ["📏", "Length checks"], ["🧲", "CTR polish"]],
    "meta-tag-optimizer": [["✨", "Pro snippet"], ["🎯", "Intent match"], ["📋", "Copy-ready"]],
    "serp-preview": [["🧩", "SERP preview"], ["👁️", "Visual snippet"], ["🧲", "Click appeal"]],
    "keyword-density": [["📈", "Term frequency"], ["⚖️", "Stuffing check"], ["🔎", "Focus keyword"]],
    "slug-generator": [["🔗", "Clean URLs"], ["✂️", "Short slugs"], ["📌", "Stable paths"]],
    "word-counter": [["🔢", "Live counts"], ["⏱️", "Reading time"], ["📋", "Copy stats"]],
    "character-counter": [["🔠", "Char limits"], ["📱", "Platform fit"], ["✂️", "Trim copy"]],
    "readability-analyzer": [["📚", "Scan score"], ["🧠", "Clarity hints"], ["📱", "Mobile reading"]],
    "text-case-converter": [["🔤", "Case formats"], ["✨", "Clean titles"], ["📋", "Copy text"]],
    "whitespace-cleaner": [["🧼", "Remove mess"], ["↵", "Fix breaks"], ["✨", "Clean paste"]],
    "json-formatter": [["🧾", "Format JSON"], ["✅", "Validate"], ["🪲", "Debug faster"]],
    "json-minifier": [["📦", "Compress JSON"], ["⚡", "Smaller output"], ["✅", "Keep valid"]],
    "url-encoder": [["🌐", "Encode URLs"], ["🧩", "Query safe"], ["🔁", "Decode too"]],
    "url-encoder-decoder": [["🌐", "Encode URLs"], ["🧩", "Query safe"], ["🔁", "Decode too"]],
    "base64": [["🔐", "Encode data"], ["🔓", "Decode payload"], ["🧾", "Inspect tokens"]],
    "base64-encode-decode": [["🔐", "Encode data"], ["🔓", "Decode payload"], ["🧾", "Inspect tokens"]],
    "entity-encoder": [["🧬", "HTML entities"], ["🛡️", "Safe markup"], ["🔁", "Decode text"]],
    "html-entity-encoder": [["🧬", "HTML entities"], ["🛡️", "Safe markup"], ["🔁", "Decode text"]],
    "html-entity-encoder-decoder": [["🧬", "HTML entities"], ["🛡️", "Safe markup"], ["🔁", "Decode text"]],
    "youtube-title-generator": [["🎬", "Title hooks"], ["🧲", "Curiosity"], ["🔎", "Search angle"]],
    "thumbnail-brief-generator": [["🖼️", "Visual brief"], ["🎯", "Focal point"], ["📱", "Mobile readable"]],
    "youtube-description-generator": [["📝", "First lines"], ["🔗", "CTA links"], ["#️⃣", "Hashtag flow"]],
    "youtube-hashtag-generator": [["#️⃣", "Tag mix"], ["🎯", "Niche angles"], ["🚫", "No stuffing"]],
    "youtubevideotagoptimizer": [["🏷️", "Video tags"], ["📊", "Score hints"], ["🔎", "Topic match"]],
    "community-post-generator": [["💬", "Post ideas"], ["📊", "Poll prompts"], ["🔥", "Engagement"]],
    "utm-builder": [["📍", "UTM links"], ["📈", "Track campaigns"], ["🧭", "Clean sources"]],
    "http-ping": [["⚡", "HTTP latency"], ["🌐", "Reachability"], ["📊", "3 attempts"]],
    "dns-lookup": [["🧭", "DNS records"], ["🌐", "Domain check"], ["☁️", "DoH lookup"]],
    "ip-subnet-calculator": [["🌐", "IPv4 range"], ["🧮", "CIDR math"], ["📋", "Network output"]],
    "password-generator": [["🛡️", "Crypto random"], ["🔐", "Strong output"], ["🔒", "Browser-only"]],
    "uuid-generator": [["🆔", "UUID v4"], ["📦", "Bulk output"], ["📋", "Copy list"]],
    "timestamp-converter": [["⏱️", "Unix time"], ["🌍", "Local + UTC"], ["📋", "Copy-ready"]],
    "regex-tester": [["🧪", "Regex match"], ["🎯", "Groups"], ["🔁", "Replace preview"]],
    "text-diff-checker": [["🧾", "Line diff"], ["✅", "Review changes"], ["📋", "Copy result"]],
    "color-converter": [["🎨", "HEX RGB HSL"], ["👁️", "Contrast"], ["📋", "Copy values"]],
    "robots-txt-generator": [["🤖", "Crawl rules"], ["🗺️", "Sitemap"], ["🔎", "Technical SEO"]],
  };

  function enhanceToolCards() {
    sections.forEach((section) => {
      const key = section.getAttribute("data-section") || section.id || "seo";
      const features = sectionFallbackFeatures[key] || [["⚡", "Fast"], ["🔒", "Private"], ["📋", "Copy-ready"]];

      $$(".card", section).forEach((card) => {
        if (!$(".tool-mini-features", card)) {
          const slug = (card.getAttribute("href") || "").split("/").filter(Boolean).pop() || "";
          const cardFeatures = toolFeatures[slug] || features;
          const row = document.createElement("div");
          row.className = "tool-mini-features";
          row.innerHTML = cardFeatures
            .map(([emoji, label]) => `<span><b aria-hidden="true">${emoji}</b> ${label}</span>`)
            .join("");

          const cta = $(".tool-cta", card);
          if (cta && cta.parentElement === card) card.insertBefore(row, cta);
          else card.appendChild(row);
        }

        const h = $("h3", card);
        const icon = $(".card-ico", card);
        if (h && icon && !card.classList.contains("tool-card-enhanced")) {
          card.classList.add("tool-card-enhanced");
          h.setAttribute("data-title-ready", "true");
        }
      });
    });
  }

  enhanceToolCards();

  function workProfile(slug) {
    return window.ClickozWorkCMS?.profileForSlug?.(slug) || null;
  }

  function enhanceOperationalCards() {
    $$(".card", sectionsWrap).forEach((card) => {
      if ($(".tool-output-preview", card)) return;
      const slug = (card.dataset.toolSlug || (card.getAttribute("href") || "").split("/").filter(Boolean).pop() || "").trim();
      const profile = workProfile(slug);
      if (!profile) return;

      const preview = document.createElement("div");
      preview.className = "tool-output-preview";
      preview.innerHTML = `
        <span>${profile.timeSaved || "Fast fix"}</span>
        <strong>${profile.sampleInput || "Input"} -> ${profile.sampleOutput || "useful output"}</strong>
        <em>${profile.usedFor || profile.quickJob || "Daily work"}</em>
      `;

      const cta = $(".tool-cta", card);
      if (cta && cta.parentElement === card) card.insertBefore(preview, cta);
      else card.appendChild(preview);
    });
  }

  enhanceOperationalCards();

  chips.forEach((chip) => {
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    chip.addEventListener("click", () => {
      const key = chip.getAttribute("data-filter") || "all";
      activateKey(key);
    });

    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateKey(chip.getAttribute("data-filter") || "all");
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = chips.indexOf(chip);
        const nextIdx = e.key === "ArrowRight" ? (idx + 1) % chips.length : (idx - 1 + chips.length) % chips.length;
        chips[nextIdx].focus();
      }
    });
  });

  const allCards = $$(".card", sectionsWrap);
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        const next = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
        row[j - 1] = prev;
        prev = next;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  function scoreQuery(query, meta) {
    if (!query) return 1;
    if (meta.search.includes(query)) return 180 - meta.search.indexOf(query);

    const queryWords = query.split(/\s+/).filter(Boolean);
    const weakWords = new Set(["fix", "make", "tool", "free", "online", "check", "create", "generate", "build", "best", "new", "quick", "fast"]);
    const wordMatches = (word) =>
      meta.title.includes(word) ||
      meta.slug.includes(word) ||
      meta.tokens.some((candidate) => candidate.startsWith(word)) ||
      meta.tokens.some((candidate) => candidate.includes(word)) ||
      meta.tokens.some((candidate) => Math.min(word.length, candidate.length) >= 4 && levenshtein(word, candidate) <= 2);
    const requiredWords = queryWords.filter((word) => word.length >= 4 && !weakWords.has(word));
    if (requiredWords.length && !requiredWords.some(wordMatches)) return 0;
    let score = 0;

    queryWords.forEach((word) => {
      if (meta.title.includes(word)) score += 64;
      else if (meta.slug.includes(word)) score += 56;
      else if (meta.tokens.some((candidate) => candidate.startsWith(word))) score += 36;
      else if (meta.tokens.some((candidate) => candidate.includes(word))) score += 24;
      else if (meta.tokens.some((candidate) => Math.min(word.length, candidate.length) >= 4 && levenshtein(word, candidate) <= 2)) score += 18;
    });

    if (queryWords.length > 1 && queryWords.every((word) => meta.search.includes(word) || meta.tokens.some((candidate) => candidate.startsWith(word)))) {
      score += 34;
    }

    return score;
  }

  const cardMeta = allCards.map((card) => {
    const h = $("h3", card);
    const p = $("p", card);
    const section = card.closest(".tool-section");
    const sectionTitle = section ? $(".section-head h2", section) : null;
    const slug = norm(card.dataset.toolSlug || (card.getAttribute("href") || "").split("/").filter(Boolean).pop() || "");
    const title = norm(h ? h.textContent : "");
    const description = norm(p ? p.textContent : "");
    const featureText = norm($(".tool-mini-features", card)?.textContent || "");
    const profile = workProfile(slug);
    const profileText = profile ? `${profile.problem} ${profile.quickJob} ${profile.sampleInput} ${profile.sampleOutput} ${profile.timeSaved} ${profile.usedFor} ${profile.aliases || ""}` : "";
    const search = norm(`${title} ${description} ${slug.replace(/-/g, " ")} ${featureText} ${profileText} ${section?.dataset.section || ""} ${sectionTitle ? sectionTitle.textContent : ""}`);
    return {
      el: card,
      search,
      title,
      slug,
      tokens: Array.from(new Set(search.split(/\s+/).filter(Boolean))),
      section,
    };
  });

  const emptyState = document.createElement("div");
  emptyState.className = "tools-empty";
  emptyState.setAttribute("role", "status");
  emptyState.setAttribute("aria-live", "polite");
  emptyState.style.display = "none";
  emptyState.innerHTML = `
    <div class="cms-empty-box">
      <strong>No matching tool yet</strong>
      <span>Search by the job you are trying to finish: fix JSON, clean text, SEO snippet, YouTube upload or tracking URL.</span>
      <div class="tools-empty-suggestions" aria-label="Search suggestions">
        <button type="button" data-search-suggestion="fix json">Fix JSON</button>
        <button type="button" data-search-suggestion="clean text">Clean text</button>
        <button type="button" data-search-suggestion="seo snippet">SEO snippet</button>
        <button type="button" data-search-suggestion="youtube upload">YouTube upload</button>
      </div>
    </div>
  `;

  if (shell && !$(".tools-empty")) shell.insertBefore(emptyState, sectionsWrap);

  function filterCards(value) {
    const q = norm(value);
    let shown = 0;
    const sectionScores = new Map();

    cardMeta.forEach((meta) => {
      const score = q ? scoreQuery(q, meta) : 1;
      const ok = !q || score >= 18;
      const { el } = meta;
      el.style.display = ok ? "" : "none";
      el.style.order = q && ok ? String(Math.max(0, 999 - Math.round(score))) : "";
      if (ok) {
        shown++;
        if (q && meta.section) sectionScores.set(meta.section, Math.max(sectionScores.get(meta.section) || 0, score));
      }
    });

    sections.forEach((section) => {
      const hasVisible = $$(".card", section).some((card) => card.style.display !== "none");
      section.style.display = !q || hasVisible ? "" : "none";
      section.style.order = q && hasVisible ? String(Math.max(0, 999 - Math.round(sectionScores.get(section) || 0))) : "";
    });

    emptyState.style.display = q && shown === 0 ? "" : "none";
    if (q) setActiveChip("all");
  }

  function debounce(fn, wait = 120) {
    let t = null;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  if (searchInput) {
    const handler = debounce(() => filterCards(searchInput.value), 120);
    searchInput.addEventListener("input", handler);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        filterCards("");
        searchInput.blur();
      }
    });
  }

  emptyState.addEventListener("click", (event) => {
    const suggestion = event.target.closest("[data-search-suggestion]");
    if (!suggestion || !searchInput) return;
    searchInput.value = suggestion.getAttribute("data-search-suggestion") || "";
    filterCards(searchInput.value);
    searchInput.focus({ preventScroll: true });
  });

  let spyEnabled = true;
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      spyEnabled = !norm(searchInput.value);
    }, 50));
  }

  const ratios = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      if (!spyEnabled) return;
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));

      if (window.scrollY < 140) {
        setActiveChip("all");
        return;
      }

      let best = null;
      let bestRatio = 0;
      sections.forEach((section) => {
        if (section.style.display === "none") return;
        const ratio = ratios.get(section) || 0;
        if (ratio > bestRatio) {
          best = section;
          bestRatio = ratio;
        }
      });

      if (!best || bestRatio < 0.12) return;
      const key = best.getAttribute("data-section") || best.id;
      if (key) setActiveChip(key);
    },
    {
      root: null,
      threshold: [0.12, 0.25, 0.45, 0.65],
      rootMargin: `-${Math.round(navOffset())}px 0px -58% 0px`,
    }
  );

  sections.forEach((section) => observer.observe(section));

  function initFromHash() {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    if (raw && sectionByKey.has(raw)) {
      setActiveChip(raw);
      window.setTimeout(() => scrollToKey(raw), 60);
      return;
    }

    setActiveChip("all");
    if (location.hash && raw === "all") history.replaceState(null, "", location.pathname + location.search);
  }

  initFromHash();

  window.addEventListener("hashchange", () => {
    const raw = decodeURIComponent((location.hash || "").replace("#", "").trim());
    const key = raw && sectionByKey.has(raw) ? raw : "all";

    if (searchInput && norm(searchInput.value)) {
      searchInput.value = "";
      filterCards("");
    }

    activateKey(key, { syncHash: false });
  });
})();


