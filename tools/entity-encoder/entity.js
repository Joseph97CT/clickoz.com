/* =========================================================
   Clickoz Tool — HTML Entity Encoder / Decoder
   File: /tools/entity-encoder/entity.js

   Expected IDs (HTML):
   #entInput, #entOutput
   #entEncode, #entDecode
   #entCopyIn, #entCopyOut, #entClear
   #entModeEncode, #entModeDecode (radio)
   #entAuto (checkbox)
   #entPreset (select)  // optional
   #entExampleBox, #entLoadExample, #entNewExample

   Options:
   #optNamed (checkbox)     // use named entities when possible
   #optQuotes (checkbox)    // encode quotes
   #optApos (checkbox)      // encode apostrophe
   #optNonAscii (checkbox)  // encode non-ascii chars as numeric
   #optKeepNbsp (checkbox)  // keep spaces as-is / encode multiple spaces to &nbsp;

   Stats (optional):
   #entInLen, #entOutLen, #entEntities, #entChanged

========================================================= */

(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);

  const inTa  = $("#entInput");
  const outTa = $("#entOutput");

  const btnEnc = $("#entEncode");
  const btnDec = $("#entDecode");
  const btnCopyIn  = $("#entCopyIn");
  const btnCopyOut = $("#entCopyOut");
  const btnClear   = $("#entClear");

  const modeEnc = $("#entModeEncode");
  const modeDec = $("#entModeDecode");
  const optAuto = $("#entAuto");

  const preset = $("#entPreset");

  const exBox  = $("#entExampleBox");
  const exLoad = $("#entLoadExample");
  const exNew  = $("#entNewExample");

  const optNamed    = $("#optNamed");
  const optQuotes   = $("#optQuotes");
  const optApos     = $("#optApos");
  const optNonAscii = $("#optNonAscii");
  const optKeepNbsp = $("#optKeepNbsp");

  const stInLen     = $("#entInLen");
  const stOutLen    = $("#entOutLen");
  const stEntities  = $("#entEntities");
  const stChanged   = $("#entChanged");

  if(!inTa || !outTa) return;

  /* -----------------------------
     Helpers
  ----------------------------- */
  const normalize = (t) => String(t ?? "").replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");

  async function copyToClipboard(str){
    const text = String(str ?? "");
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
        return true;
      }
    }catch(e){}
    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly","");
      ta.style.position="fixed";
      ta.style.top="-9999px";
      ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){ return false; }
  }

  function flash(btn, ok, baseText){
    if(!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(()=>btn.textContent=base, 900);
  }

  function getMode(){
    if(modeDec && modeDec.checked) return "decode";
    return "encode";
  }

  function setMode(m){
    if(m === "decode"){
      if(modeDec) modeDec.checked = true;
      if(modeEnc) modeEnc.checked = false;
    }else{
      if(modeEnc) modeEnc.checked = true;
      if(modeDec) modeDec.checked = false;
    }
  }

  /* -----------------------------
     HTML Entity core
  ----------------------------- */

  // Minimal named entities map (safe, common, readable).
  // We deliberately do NOT include every possible entity to avoid unexpected output.
  const NAMED = new Map([
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
    ["'", "&#39;"],     // keep numeric for apos by default (broader support)
    ["\u00A0", "&nbsp;"]
  ]);

  // Additional named entities (optional, used when optNamed is enabled)
  const NAMED_EXTRA = new Map([
    ["©", "&copy;"],
    ["®", "&reg;"],
    ["€", "&euro;"],
    ["£", "&pound;"],
    ["¥", "&yen;"],
    ["•", "&bull;"],
    ["…", "&hellip;"],
    ["–", "&ndash;"],
    ["—", "&mdash;"],
    ["™", "&trade;"]
  ]);

  // Encode text into entities according to options
  function encodeEntities(text){
    const t = normalize(text);

    const useNamed = !!(optNamed && optNamed.checked);
    const encQuotes = !!(optQuotes && optQuotes.checked);
    const encApos   = !!(optApos && optApos.checked);
    const encNonAscii = !!(optNonAscii && optNonAscii.checked);
    const keepSpaces = !!(optKeepNbsp && optKeepNbsp.checked);

    let out = "";
    let entityCount = 0;

    for(let i=0;i<t.length;i++){
      const ch = t[i];
      const code = ch.codePointAt(0);

      // Handle surrogate pairs
      if(code > 0xFFFF) i++;

      // core dangerous chars
      if(ch === "&"){ out += "&amp;"; entityCount++; continue; }
      if(ch === "<"){ out += "&lt;"; entityCount++; continue; }
      if(ch === ">"){ out += "&gt;"; entityCount++; continue; }

      // quotes options
      if(ch === '"'){
        if(encQuotes){ out += "&quot;"; entityCount++; }
        else out += ch;
        continue;
      }
      if(ch === "'"){
        if(encApos){ out += "&#39;"; entityCount++; }
        else out += ch;
        continue;
      }

      // spaces to &nbsp; (only if user wants AND there are runs of spaces)
      if(!keepSpaces && ch === " "){
        // preserve single spaces normally, convert runs to &nbsp; for “layout-safe”
        // if next is space, convert this and subsequent spaces
        if(t[i+1] === " "){
          out += "&nbsp;";
          entityCount++;
        }else{
          out += " ";
        }
        continue;
      }

      // Named extras (only if enabled)
      if(useNamed && NAMED_EXTRA.has(ch)){
        out += NAMED_EXTRA.get(ch);
        entityCount++;
        continue;
      }

      // Non-ascii option (encode unicode > 127)
      if(encNonAscii && code > 127){
        out += `&#${code};`;
        entityCount++;
        continue;
      }

      out += ch;
    }

    return { out, entityCount };
  }

  // Decode entities safely using DOM parsing
  function decodeEntities(text){
    const t = normalize(text);

    // Use a textarea trick: browser decodes entities reliably
    const ta = document.createElement("textarea");

    // We want to preserve unknown ampersands; the browser will keep them.
    ta.innerHTML = t;

    const decoded = ta.value;

    // Count how many entities *appear* in input (rough)
    const entityCount = (t.match(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g) || []).length;

    return { out: decoded, entityCount };
  }

  /* -----------------------------
     Presets
  ----------------------------- */
  const PRESETS = {
    "html-safe": {
      label: "HTML-safe (recommended)",
      apply: () => {
        if(optNamed) optNamed.checked = true;
        if(optQuotes) optQuotes.checked = true;
        if(optApos) optApos.checked = true;
        if(optNonAscii) optNonAscii.checked = false;
        if(optKeepNbsp) optKeepNbsp.checked = true;
      }
    },
    "text-only": {
      label: "Minimal (only < > &)",
      apply: () => {
        if(optNamed) optNamed.checked = false;
        if(optQuotes) optQuotes.checked = false;
        if(optApos) optApos.checked = false;
        if(optNonAscii) optNonAscii.checked = false;
        if(optKeepNbsp) optKeepNbsp.checked = true;
      }
    },
    "attributes": {
      label: "Attributes (quotes on)",
      apply: () => {
        if(optNamed) optNamed.checked = true;
        if(optQuotes) optQuotes.checked = true;
        if(optApos) optApos.checked = true;
        if(optNonAscii) optNonAscii.checked = false;
        if(optKeepNbsp) optKeepNbsp.checked = true;
      }
    },
    "unicode": {
      label: "Unicode to numeric",
      apply: () => {
        if(optNamed) optNamed.checked = false;
        if(optQuotes) optQuotes.checked = true;
        if(optApos) optApos.checked = true;
        if(optNonAscii) optNonAscii.checked = true;
        if(optKeepNbsp) optKeepNbsp.checked = true;
      }
    },
    "layout": {
      label: "Layout-safe spaces (&nbsp;)",
      apply: () => {
        if(optNamed) optNamed.checked = true;
        if(optQuotes) optQuotes.checked = true;
        if(optApos) optApos.checked = true;
        if(optNonAscii) optNonAscii.checked = false;
        if(optKeepNbsp) optKeepNbsp.checked = false; // convert runs of spaces
      }
    }
  };

  function applyPreset(key){
    const p = PRESETS[key];
    if(!p) return;
    p.apply();
  }

  /* -----------------------------
     Render + stats
  ----------------------------- */
  function updateStats(inputStr, outputStr, entityCount){
    if(stInLen) stInLen.textContent = String((inputStr ?? "").length);
    if(stOutLen) stOutLen.textContent = String((outputStr ?? "").length);
    if(stEntities) stEntities.textContent = String(entityCount ?? 0);
    if(stChanged) stChanged.textContent = (String(inputStr ?? "") === String(outputStr ?? "")) ? "No" : "Yes";
  }

  function run(){
    const mode = getMode();
    const raw = normalize(inTa.value);

    if(!raw.trim()){
      outTa.value = "";
      updateStats("", "", 0);
      return;
    }

    if(mode === "decode"){
      const res = decodeEntities(raw);
      outTa.value = res.out;
      updateStats(raw, res.out, res.entityCount);
      return;
    }

    const res = encodeEntities(raw);
    outTa.value = res.out;
    updateStats(raw, res.out, res.entityCount);
  }

  /* -----------------------------
     Examples (7)
  ----------------------------- */
  const examples = [
    {
      title: "HTML snippet (encode)",
      text: `<div class="hero">Fast & clean <b>tools</b> <span>→</span></div>`
    },
    {
      title: "Attributes (quotes + apostrophes)",
      text: `<a title="Mark's list" href="https://example.com/?q=a&b=c">Link</a>`
    },
    {
      title: "Text with special chars",
      text: `5 > 3 and 2 < 4 — “quotes”, apostrophe’s, & symbols.`
    },
    {
      title: "Emoji / unicode (numeric option)",
      text: `New drop 🚀 • Price: €29.90 • Available now`
    },
    {
      title: "Already-encoded (decode)",
      text: `&lt;div&gt;AT&amp;T&#39;s &quot;deal&quot;&lt;/div&gt;`
    },
    {
      title: "Mixed numeric + named",
      text: `Hello &#x1F680; &amp; goodbye &#169; 2026`
    },
    {
      title: "Spacing / layout",
      text: `Column A    Column B    Column C`
    }
  ];
  let exIndex = 0;

  function showExample(idx){
    if(!exBox) return;
    const ex = examples[idx % examples.length];
    exBox.textContent = `${ex.title}\n\n${ex.text}`;
  }

  function nextExample(){
    exIndex = (exIndex + 1) % examples.length;
    showExample(exIndex);
  }

  function loadExample(){
    const ex = examples[exIndex % examples.length];
    inTa.value = ex.text;

    // smart mode
    const t = normalize(ex.text);
    if(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/.test(t)){
      setMode("decode");
    }else{
      setMode("encode");
    }

    // smart preset defaults
    if(getMode() === "encode"){
      applyPreset("html-safe");
      if(preset) preset.value = "html-safe";
    }

    run();
    inTa.focus();
  }

  /* -----------------------------
     Events
  ----------------------------- */
  // default options (safe)
  if(optNamed) optNamed.checked = true;
  if(optQuotes) optQuotes.checked = true;
  if(optApos) optApos.checked = false;
  if(optNonAscii) optNonAscii.checked = false;
  if(optKeepNbsp) optKeepNbsp.checked = true;
  if(optAuto) optAuto.checked = true;

  // presets select (if present)
  if(preset){
    // If the HTML didn’t render options, we can populate it.
    if(!preset.querySelector("option")){
      const opts = [
        ["", "Choose a preset (optional)"],
        ...Object.entries(PRESETS).map(([k,v]) => [k, v.label])
      ];
      preset.innerHTML = opts.map(([v,l]) => `<option value="${v}">${l}</option>`).join("");
    }
    preset.addEventListener("change", () => {
      const key = preset.value;
      if(key) applyPreset(key);
      run();
    });
  }

  // example box init
  if(exBox) showExample(exIndex);
  if(exNew) exNew.addEventListener("click", nextExample);
  if(exLoad) exLoad.addEventListener("click", loadExample);

  // buttons
  if(btnEnc) btnEnc.addEventListener("click", () => { setMode("encode"); run(); });
  if(btnDec) btnDec.addEventListener("click", () => { setMode("decode"); run(); });

  // auto transform
  let tmr = null;
  inTa.addEventListener("input", () => {
    if(optAuto && !optAuto.checked) return;
    clearTimeout(tmr);
    tmr = setTimeout(run, 70);
  });

  // option changes re-run
  const reRunOn = [optNamed,optQuotes,optApos,optNonAscii,optKeepNbsp,modeEnc,modeDec,optAuto]
    .filter(Boolean);

  reRunOn.forEach(el => el.addEventListener("change", () => {
    // if auto is off, still keep the UI consistent when toggling options
    if(el === optAuto) return;
    run();
  }));

  // copy buttons
  if(btnCopyIn) btnCopyIn.addEventListener("click", async () => {
    const ok = await copyToClipboard(inTa.value || "");
    flash(btnCopyIn, ok, "📋 Copy input");
  });
  if(btnCopyOut) btnCopyOut.addEventListener("click", async () => {
    const ok = await copyToClipboard(outTa.value || "");
    flash(btnCopyOut, ok, "✅ Copy output");
  });

  // clear
  if(btnClear) btnClear.addEventListener("click", () => {
    inTa.value = "";
    outTa.value = "";
    updateStats("", "", 0);
    inTa.focus();
  });

  // UX
  outTa.addEventListener("focus", () => { try{ outTa.select(); }catch(e){} });

  // Initial render
  run();
})();

