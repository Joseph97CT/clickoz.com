(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const titleEl   = $('#ytTitle');
  const focusEl   = $('#ytFocus');
  const langEl    = $('#ytLang');
  const catEl     = $('#ytCategory');
  const maxEl     = $('#ytMax');

  const runBtn    = $('#ytRun');
  const copyAllBtn= $('#ytCopyAll');
  const resetBtn  = $('#ytReset');
  const exampleBtn= $('#ytExample');

  const scoreEl   = $('#ytScore');
  const recMaxEl  = $('#ytRecMax');
  const primaryEl = $('#ytPrimary');
  const lenEl     = $('#ytLen');

  const feedbackEl= $('#ytFeedback');
  const outEl     = $('#ytOut');
  const chipsEl   = $('#ytChips');

  if(!titleEl || !runBtn || !outEl || !chipsEl) return;

  /* ---------------- Utils ---------------- */
  const STOP = new Set([
    "a","an","the","and","or","but","to","of","for","in","on","at","with","without","from","by","as","is","are","was","were",
    "this","that","these","those","your","my","our","their","you","we","they","i","me","us","them",
    "how","what","why","when","where","who","which","best","top","new","official","video"
  ]);

  const STOP_IT = new Set([
    "un","una","il","lo","la","i","gli","le","e","o","ma","per","di","del","della","dei","delle",
    "in","su","con","senza","da","come","che","cosa","perché","quando","dove","chi","quale","migliore","nuovo","ufficiale","video"
  ]);

  function norm(s){
    return (s || "")
      .toLowerCase()
      .replace(/[’']/g,"'")
      .replace(/[\u0300-\u036f]/g,"") // best effort if accents were decomposed
      .replace(/[^a-z0-9\s\-]/gi," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function words(s){
    const t = norm(s);
    if(!t) return [];
    return t.split(" ").filter(Boolean);
  }

  function uniq(arr){
    const out = [];
    const seen = new Set();
    for(const x of arr){
      const k = x.toLowerCase();
      if(!k || seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return out;
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function titleHealth(title){
    const t = (title || "").trim();
    const w = words(t);
    const chars = t.length;

    let score = 70;

    // length heuristics (works well in practice)
    if(chars < 25) score -= 18;
    if(chars > 85) score -= 10;
    if(chars >= 35 && chars <= 72) score += 10;

    // too few words
    if(w.length < 5) score -= 12;
    if(w.length >= 6 && w.length <= 12) score += 6;

    // has year/number/angle
    if(/\b(20\d{2})\b/.test(t)) score += 6;
    if(/\b(steps|checklist|guide|tips|tutorial|beginner|fast|easy)\b/i.test(t)) score += 6;
    if(/\b(official|lyrics|mv)\b/i.test(t)) score += 4;

    // punctuation / parentheses sometimes good
    if(/[()\-:]/.test(t)) score += 3;

    return clamp(Math.round(score), 0, 100);
  }

  function recommendedMaxTags(title){
    const w = words(title);
    const score = titleHealth(title);

    // clearer titles need fewer tags, broad titles need slightly more (but not spam)
    let rec = 18;
    if(score >= 85) rec = 16;
    else if(score >= 75) rec = 18;
    else if(score >= 60) rec = 22;
    else rec = 26;

    // if very short title, allow a few more variants
    if(w.length <= 4) rec += 4;

    return clamp(rec, 12, 30);
  }

  function pickStopSet(lang){
    return (lang === "it") ? STOP_IT : STOP;
  }

  function inferPrimaryKeyword(title, lang){
    const stop = pickStopSet(lang);
    const w = words(title);
    const filtered = w.filter(x => !stop.has(x) && x.length > 2);

    // pick strongest 2-3 tokens
    const top = filtered.slice(0, 4);
    if(top.length >= 3) return `${top[0]} ${top[1]} ${top[2]}`;
    if(top.length >= 2) return `${top[0]} ${top[1]}`;
    return (filtered[0] || w[0] || "").trim();
  }

  function buildClusters({title, focus, lang, category, maxTags}){
    const t = (title || "").trim();
    const n = norm(t);
    const stop = pickStopSet(lang);

    const baseKw = (focus && focus.trim()) ? norm(focus) : inferPrimaryKeyword(t, lang);
    const baseTokens = baseKw.split(" ").filter(Boolean).slice(0, 4);

    // category bias
    const catBias = {
      general:  ["tips","guide","tutorial","how to","best","checklist"],
      howto:    ["how to","tutorial","step by step","checklist","tips"],
      tech:     ["tutorial","settings","fix","review","2026"],
      gaming:   ["gameplay","tips","settings","best","ranked"],
      music:    ["official video","lyrics","audio","music video","mv"],
      education:["lesson","explained","study","tutorial","guide"],
      vlog:     ["vlog","day in the life","travel","storytime","behind the scenes"],
      finance:  ["explained","strategy","investing","beginner","tips"],
      fitness:  ["workout","routine","beginner","tips","form"]
    }[category] || ["tips","guide","tutorial","how to"];

    // helpers
    const makeLongTails = () => {
      const outs = [];
      if(!baseTokens.length) return outs;

      const first2 = baseTokens.slice(0,2).join(" ");
      const first3 = baseTokens.slice(0,3).join(" ");
      const year = (t.match(/\b20\d{2}\b/) || [])[0];

      // English/Italian patterning
      const isIT = (lang === "it");

      if(isIT){
        outs.push(`come ${first2}`);
        outs.push(`${first2} tutorial`);
        if(first3) outs.push(`${first3} guida`);
        if(year) outs.push(`${first2} ${year}`);
        outs.push(`${first2} consigli`);
        outs.push(`${first2} per principianti`);
      } else {
        outs.push(`how to ${first2}`);
        outs.push(`${first2} tutorial`);
        if(first3) outs.push(`${first3} guide`);
        if(year) outs.push(`${first2} ${year}`);
        outs.push(`${first2} tips`);
        outs.push(`${first2} for beginners`);
      }

      // add a clean "best" variant
      outs.push(isIT ? `miglior ${first2}` : `best ${first2}`);

      return outs;
    };

    const extractContextTokens = () => {
      const w = words(n).filter(x => !stop.has(x) && x.length > 2);
      const ctx = w.slice(0, 12); // early tokens usually strongest
      // add joined pairs
      const pairs = [];
      for(let i=0;i<Math.min(ctx.length-1, 8);i++){
        const a = ctx[i], b = ctx[i+1];
        const pair = `${a} ${b}`;
        if(pair.length >= 6) pairs.push(pair);
      }
      return uniq([...ctx, ...pairs]).slice(0, 16);
    };

    const primary = uniq([
      baseKw,
      baseTokens.slice(0,2).join(" "),
      baseTokens.slice(0,3).join(" ")
    ].filter(Boolean));

    const supporting = uniq([
      ...catBias,
      ...extractContextTokens()
    ]).filter(x => x && x.length > 2);

    const longTail = uniq(makeLongTails());

    // clean + final merge
    let all = uniq([
      ...primary,
      ...supporting,
      ...longTail
    ])
    .map(x => x.replace(/\s+/g," ").trim())
    .filter(Boolean);

    // remove super generic single tokens if too short
    all = all.filter(tag => tag.length >= 3);

    // respect max
    all = all.slice(0, clamp(maxTags, 5, 60));

    return {
      primaryKeyword: baseKw,
      tags: all
    };
  }

  function feedback(title, lang){
    const t = (title || "").trim();
    const w = words(t);
    const score = titleHealth(t);

    const isIT = (lang === "it");
    const tips = [];

    if(!t){
      tips.push(isIT ? "Incolla un titolo per ottenere tag e consigli." : "Paste a title to generate tags and suggestions.");
      return tips;
    }

    if(t.length < 30) tips.push(isIT ? "Titolo un po’ corto: aggiungi un dettaglio (anno, formato, outcome)." : "Title is a bit short: add a detail (year, format, outcome).");
    if(t.length > 85) tips.push(isIT ? "Titolo lungo: prova a tagliare parole inutili mantenendo l’idea." : "Title is long: trim extra words while keeping the core idea.");
    if(w.length < 5) tips.push(isIT ? "Aggiungi 1–2 parole chiave per chiarire il topic." : "Add 1–2 keywords to clarify the topic.");
    if(!/\b20\d{2}\b/.test(t)) tips.push(isIT ? "Se è contenuto attuale, aggiungi l’anno per aumentare CTR." : "If it's current content, add the year to boost CTR.");
    if(!/[()\-:]/.test(t)) tips.push(isIT ? "Un separatore (—, :, parentesi) aiuta a rendere il titolo più leggibile." : "A separator (—, :, parentheses) can improve scannability.");
    if(score >= 85) tips.push(isIT ? "Titolo già molto buono: punta su tag long-tail specifici." : "Title is already strong: prioritize specific long-tail tags.");

    // keep it tight
    return tips.slice(0, 6);
  }

  async function copyTextSafe(str){
    try{ await navigator.clipboard.writeText(str); return true; }
    catch(e){ return false; }
  }

  function setText(el, txt){
    if(!el) return;
    el.textContent = txt;
  }

  function renderList(listEl, items){
    if(!listEl) return;
    listEl.innerHTML = "";
    for(const it of items){
      const li = document.createElement("li");
      li.textContent = it;
      listEl.appendChild(li);
    }
  }

  function renderChips(tags){
    chipsEl.innerHTML = "";
    tags.forEach((tag) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-label", `Copy tag: ${tag}`);
      b.innerHTML = `<span>${escapeHtml(tag)}</span> <small>↗</small>`;
      b.addEventListener("click", async () => {
        const ok = await copyTextSafe(tag);
        if(ok){
          b.style.borderColor = `rgba(var(--accent-rgb), .55)`;
          b.style.background = `rgba(var(--accent-rgb), .12)`;
          setTimeout(() => {
            b.style.borderColor = "";
            b.style.background = "";
          }, 500);
        }
      });
      chipsEl.appendChild(b);
    });
  }

  function escapeHtml(s){
    return (s || "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  /* ---------------- Main action ---------------- */
  function run(){
    const title = (titleEl.value || "").trim();
    const focus = (focusEl.value || "").trim();
    const lang  = (langEl.value || "en").trim();
    const cat   = (catEl.value || "general").trim();

    const maxTags = clamp(parseInt(maxEl.value || "25", 10) || 25, 5, 60);

    const score = titleHealth(title);
    const recMax = recommendedMaxTags(title);
    const { primaryKeyword, tags } = buildClusters({ title, focus, lang, category: cat, maxTags });

    setText(scoreEl, score ? `${score}/100` : "—");
    setText(recMaxEl, title ? String(recMax) : "—");
    setText(primaryEl, title ? primaryKeyword : "—");

    const w = words(title);
    setText(lenEl, title ? `${w.length}w / ${title.length}c` : "—");

    renderList(feedbackEl, feedback(title, lang));

    // output (comma-separated)
    const line = tags.join(", ");
    outEl.value = line;

    renderChips(tags);

    copyAllBtn.disabled = tags.length === 0;
  }

  function reset(){
    titleEl.value = "";
    focusEl.value = "";
    maxEl.value = "25";
    outEl.value = "";
    chipsEl.innerHTML = "";
    renderList(feedbackEl, ["Generate tags to see recommendations."]);
    setText(scoreEl, "—");
    setText(recMaxEl, "—");
    setText(primaryEl, "—");
    setText(lenEl, "—");
    copyAllBtn.disabled = true;
    titleEl.focus();
  }

  function useExample(){
    titleEl.value = "How to Rank YouTube Videos in 2026 (Fast SEO Checklist)";
    focusEl.value = "youtube seo";
    langEl.value = "en";
    catEl.value = "howto";
    maxEl.value = "25";
    run();
    titleEl.scrollIntoView({ behavior:"smooth", block:"center" });
  }

  /* ---------------- Events ---------------- */
  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", reset);
  exampleBtn.addEventListener("click", useExample);

  copyAllBtn.addEventListener("click", async () => {
    const txt = outEl.value || "";
    const ok = await copyTextSafe(txt);
    copyAllBtn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => copyAllBtn.textContent = "Copy all tags", 900);
  });

  // Example loaders from <pre>
  $$('.ex .btn[data-fill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-fill');
      const pre = sel ? $(sel) : null;
      if(!pre) return;
      titleEl.value = (pre.textContent || '').trim();
      run();
      titleEl.focus();
      titleEl.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  });

  // live tiny updates (no heavy recompute until click)
  titleEl.addEventListener("input", () => {
    const t = (titleEl.value || "").trim();
    if(!t){
      setText(lenEl, "—");
      return;
    }
    const w = words(t);
    setText(lenEl, `${w.length}w / ${t.length}c`);
  });

  // first paint
  reset();
})();

