(() => {
  "use strict";
  const root = document.querySelector("[data-creator-mode]");
  if (!root) return;
  const mode = root.dataset.creatorMode;
  const idea = root.querySelector("[data-idea]");
  const audience = root.querySelector("[data-audience]");
  const output = root.querySelector("[data-output]");
  const stats = root.querySelector("[data-stats]");
  const clean = (value) => String(value || "").trim();
  const titleCase = (value) => clean(value).toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
  function setStats(items) {
    stats.innerHTML = items.map(([k,v]) => '<div class="cz-stat"><span>' + k + '</span><strong>' + v + '</strong></div>').join("");
  }
  function generate() {
    const topic = clean(idea.value) || "how to grow a YouTube channel";
    const niche = clean(audience.value) || "creators";
    let result = "";
    if (mode === "title") {
      const core = titleCase(topic);
      result = [
        core + " (Step-by-Step)",
        "I Tried " + core + " for 7 Days",
        core + ": What Actually Works",
        "Stop Doing This If You Want " + core,
        core + " for " + titleCase(niche)
      ].join("\n");
      setStats([["Variants", 5], ["Best length", "45-65 chars"], ["Use", "A/B title ideas"], ["Next", "Thumbnail brief"]]);
    }
    if (mode === "description") {
      result = titleCase(topic) + "\n\nIn this video, I break down the practical steps for " + topic + " so " + niche + " can take action faster.\n\nChapters:\n00:00 Intro\n00:35 Why it matters\n02:10 Step 1\n04:20 Step 2\n06:15 Common mistakes\n08:00 Final checklist\n\nUseful links:\n- Main resource:\n- Related guide:\n- Subscribe for more:\n\n#" + topic.split(/\s+/).slice(0,2).join("") + " #" + niche.split(/\s+/)[0] + " #YouTubeTips";
      setStats([["Structure", "Ready"], ["Chapters", 6], ["Hashtags", 3], ["CTA", "Included"]]);
    }
    if (mode === "hashtags") {
      const base = topic.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 6);
      const nicheWord = niche.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean)[0] || "creator";
      const tags = [...new Set([...base.map((w) => "#" + w), "#" + nicheWord, "#youtubetips", "#creator"])]
        .slice(0, 8);
      result = "Primary hashtags:\n" + tags.slice(0,3).join(" ") + "\n\nOptional extras:\n" + tags.slice(3).join(" ") + "\n\nRule: keep hashtags relevant. Do not turn the description into a tag dump.";
      setStats([["Primary", 3], ["Total", tags.length], ["Risk", "Low stuffing"], ["Placement", "Description"]]);
    }
    if (mode === "thumbnail") {
      result = "Thumbnail brief for: " + titleCase(topic) + "\n\nConcept A: Before/After\n- Left: messy or confusing state\n- Right: clean result\n- Text: 2-4 strong words\n\nConcept B: Big Promise\n- One clear subject\n- High contrast background\n- Text: " + titleCase(topic).split(" ").slice(0,3).join(" ") + "\n\nChecklist:\n- Readable on mobile\n- Face/object large enough\n- No tiny paragraphs\n- Title and thumbnail promise the same idea";
      setStats([["Concepts", 2], ["Text limit", "2-4 words"], ["Mobile", "Priority"], ["Next", "Test variants"]]);
    }
    if (mode === "community") {
      result = "Poll post:\nWhich part of " + topic + " should I cover next?\nA) Beginner steps\nB) Mistakes to avoid\nC) Tools and templates\nD) Real examples\n\nTeaser post:\nWorking on a new video for " + niche + ": " + topic + ". I am testing examples now. What should I include?\n\nFollow-up post:\nThe video is live. Start with the checklist, then tell me which step you want expanded.";
      setStats([["Formats", 3], ["Poll options", 4], ["Use", "Engagement"], ["CTA", "Included"]]);
    }
    output.value = result;
  }
  root.querySelector("[data-generate]")?.addEventListener("click", generate);
  root.querySelector("[data-sample]")?.addEventListener("click", () => {
    idea.value = "how to make better thumbnails without design experience";
    audience.value = "new YouTube creators";
    generate();
  });
  root.querySelector("[data-clear]")?.addEventListener("click", () => { idea.value = ""; audience.value = ""; output.value = ""; stats.innerHTML = ""; });
  root.querySelector("[data-copy]")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(output.value || ""); } catch (_) {} });
  generate();
})();
