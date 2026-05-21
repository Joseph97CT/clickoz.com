/* =========================================================
   Clickoz Tool — URL Encoder / Decoder
   File: /tools/url-encoder/url-encoder.js
   Notes:
   - This script is defensive: if some elements are missing, it won’t crash.
   - Expected IDs in the HTML:
     #ueInput, #ueOutput
     #ueEncode, #ueDecode, #ueCopyIn, #ueCopyOut, #ueClear
     #ueModeEncode, #ueModeDecode, #ueModeQueryOnly (radio/checkbox inputs OR buttons)
     #uePlusAsSpace (checkbox)  // affects decoding + query encoding
     #ueExampleBox, #ueLoadExample, #ueNewExample
     #ueValidity, #ueMeta
     #ueInLen, #ueOutLen, #ueUnsafeCount, #uePairsCount (optional stats)
========================================================= */

(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const inTa   = $("#ueInput");
  const outTa  = $("#ueOutput");

  const btnEnc = $("#ueEncode");
  const btnDec = $("#ueDecode");
  const btnCopyIn  = $("#ueCopyIn");
  const btnCopyOut = $("#ueCopyOut");
  const btnClear   = $("#ueClear");

  const modeEnc = $("#ueModeEncode");
  const modeDec = $("#ueModeDecode");
  const modeQueryOnly = $("#ueModeQueryOnly");

  const plusAsSpace = $("#uePlusAsSpace");

  const exBox  = $("#ueExampleBox");
  const exLoad = $("#ueLoadExample");
  const exNew  = $("#ueNewExample");

  const badge = $("#ueValidity");
  const meta  = $("#ueMeta");

  const stInLen = $("#ueInLen");
  const stOutLen = $("#ueOutLen");
  const stUnsafe = $("#ueUnsafeCount");
  const stPairs  = $("#uePairsCount");

  if (!inTa || !outTa) return;

  /* -----------------------------
     Helpers
  ----------------------------- */
  const normalize = (t) => String(t ?? "").replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");

  function setBadge(ok, text){
    if(!badge) return;
    badge.classList.remove("ok","bad");
    badge.classList.add(ok ? "ok" : "bad");
    badge.textContent = text || (ok ? "✅ Ready" : "⚠️ Check input");
  }
  function setMeta(text){
    if(meta) meta.textContent = text || "";
  }

  function flash(btn, ok, baseText){
    if(!btn) return;
    const base = baseText || btn.getAttribute("data-base") || btn.textContent;
    btn.setAttribute("data-base", base);
    btn.textContent = ok ? "Copied!" : "Copy failed";
    setTimeout(() => (btn.textContent = base), 900);
  }

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
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    }catch(e){ return false; }
  }

  function countUnsafeChars(str){
    // chars that usually break query strings if not encoded
    // (space, quotes, <>, &, =, ?, #, %, +, unicode non-ascii)
    let n = 0;
    for(const ch of str){
      const code = ch.charCodeAt(0);
      if(
        ch === " " || ch === "\"" || ch === "'" || ch === "<" || ch === ">" ||
        ch === "&" || ch === "=" || ch === "?" || ch === "#" || ch === "%" ||
        ch === "+" || code > 0x7E
      ) n++;
    }
    return n;
  }

  function updateStats(inputStr, outputStr){
    const i = String(inputStr ?? "");
    const o = String(outputStr ?? "");
    if(stInLen) stInLen.textContent = String(i.length);
    if(stOutLen) stOutLen.textContent = String(o.length);
    if(stUnsafe) stUnsafe.textContent = String(countUnsafeChars(i));

    if(stPairs){
      try{
        const s = i.includes("?") ? i.split("?")[1] : i;
        const q = s.includes("#") ? s.split("#")[0] : s;
        if(!q.trim()){ stPairs.textContent = "0"; return; }
        const pairs = q.split("&").filter(Boolean);
        stPairs.textContent = String(pairs.length);
      }catch(e){
        stPairs.textContent = "0";
      }
    }
  }

  function getMode(){
    // Support either inputs (checked) or buttons (aria-pressed)
    if(modeQueryOnly){
      if(modeQueryOnly.matches("input[type=radio], input[type=checkbox]")){
        if(modeQueryOnly.checked) return "query";
      }else if(modeQueryOnly.getAttribute("aria-pressed") === "true"){
        return "query";
      }
    }
    if(modeDec){
      if(modeDec.matches("input[type=radio], input[type=checkbox]")){
        if(modeDec.checked) return "decode";
      }else if(modeDec.getAttribute("aria-pressed") === "true"){
        return "decode";
      }
    }
    // default encode
    return "encode";
  }

  function setPressed(el, on){
    if(!el) return;
    if(el.matches("button")){
      el.setAttribute("aria-pressed", on ? "true" : "false");
    }else if(el.matches("input[type=radio], input[type=checkbox]")){
      el.checked = !!on;
    }
  }

  function applyModeUI(mode){
    // keep all in sync
    setPressed(modeEnc, mode === "encode");
    setPressed(modeDec, mode === "decode");
    setPressed(modeQueryOnly, mode === "query");
  }

  function looksEncoded(str){
    // heuristic: has %XX sequences or plus signs typical of query encoding
    return /%[0-9A-Fa-f]{2}/.test(str) || /\+/.test(str);
  }

  function safeDecodeURIComponent(s){
    // Robust decoder: won’t throw on malformed sequences.
    // Tries to decode valid %XX segments and keeps the rest.
    const t = String(s ?? "");
    try{
      return decodeURIComponent(t);
    }catch(e){
      // decode chunk-by-chunk
      let out = "";
      for(let i=0;i<t.length;i++){
        const ch = t[i];
        if(ch === "%" && i+2 < t.length){
          const hex = t.slice(i+1, i+3);
          if(/^[0-9A-Fa-f]{2}$/.test(hex)){
            // attempt decode this byte in context by decoding contiguous run
            let j = i;
            while(j < t.length && t[j] === "%" && j+2 < t.length && /^[0-9A-Fa-f]{2}$/.test(t.slice(j+1,j+3))){
              j += 3;
            }
            const seg = t.slice(i, j);
            try{ out += decodeURIComponent(seg); }
            catch(_){ out += seg; }
            i = j-1;
            continue;
          }
        }
        out += ch;
      }
      return out;
    }
  }

  function decodeWithPlusOption(s){
    let t = String(s ?? "");
    // In query strings, '+' often means space (application/x-www-form-urlencoded)
    if(plusAsSpace && plusAsSpace.checked){
      t = t.replace(/\+/g, " ");
    }
    return safeDecodeURIComponent(t);
  }

  function encodeComponent(s){
    // standard URI component encoding
    return encodeURIComponent(String(s ?? ""));
  }

  function encodeQueryParamValue(s){
    // application/x-www-form-urlencoded-ish: encodeURIComponent + spaces to '+'
    // but only when user wants it (plusAsSpace checked) for parity with decoding.
    let out = encodeURIComponent(String(s ?? ""));
    if(plusAsSpace && plusAsSpace.checked){
      out = out.replace(/%20/g, "+");
    }
    return out;
  }

  function encodeQueryOnly(input){
    // Accept either full URL or raw query string.
    // - Preserves base + hash
    // - Encodes keys and values safely
    const raw = normalize(input).trim();
    if(!raw) return "";

    // If it's a full URL, use URL parser; if not, treat as query string.
    let base = "";
    let query = raw;
    let hash = "";

    // Split hash first
    const hashIdx = query.indexOf("#");
    if(hashIdx !== -1){
      hash = query.slice(hashIdx);
      query = query.slice(0, hashIdx);
    }

    // If contains '?', split base/query
    const qIdx = query.indexOf("?");
    if(qIdx !== -1){
      base = query.slice(0, qIdx);
      query = query.slice(qIdx + 1);
    }

    // If user pasted only "?a=b&c=d"
    if(base === "" && raw.startsWith("?")){
      query = raw.slice(1);
      // hash already handled above, but for "?..#.." case
      const hi = query.indexOf("#");
      if(hi !== -1){
        hash = "#" + query.slice(hi + 1);
        query = query.slice(0, hi);
      }
    }

    // Normalize leading &
    query = query.replace(/^\&+/, "");

    if(!query.trim()){
      return base ? (base + (hash || "")) : (raw);
    }

    const pairs = query.split("&").filter(p => p.length);
    const outPairs = pairs.map(pair => {
      const eq = pair.indexOf("=");
      if(eq === -1){
        // key-only
        const k = decodeWithPlusOption(pair); // decode first to avoid double-encoding
        return encodeQueryParamValue(k);
      }
      const kRaw = pair.slice(0, eq);
      const vRaw = pair.slice(eq + 1);
      const k = decodeWithPlusOption(kRaw);
      const v = decodeWithPlusOption(vRaw);
      return `${encodeQueryParamValue(k)}=${encodeQueryParamValue(v)}`;
    });

    const outQuery = outPairs.join("&");
    if(base){
      return `${base}?${outQuery}${hash || ""}`;
    }
    // raw query result (no base)
    return `?${outQuery}${hash || ""}`;
  }

  function encodeAll(input){
    return encodeComponent(normalize(input));
  }

  function decodeAll(input){
    return decodeWithPlusOption(normalize(input));
  }

  function runTransform(){
    const input = normalize(inTa.value);
    const mode = getMode();

    if(!input.trim()){
      outTa.value = "";
      setBadge(false, "⚠️ Paste a URL or query string");
      setMeta("Tip: paste a full URL or a raw query like ?q=hello%20world&x=1");
      updateStats("", "");
      return;
    }

    // Smart hint (not auto switching, just guidance)
    if(mode === "encode" && looksEncoded(input) && input.length > 4){
      setMeta("Looks already encoded. If you want the readable version, switch to Decode.");
    }else if(mode === "decode" && !looksEncoded(input)){
      setMeta("No %XX sequences detected. If you meant to make it safe for URLs, switch to Encode.");
    }else{
      setMeta(mode === "query"
        ? "Query-only mode encodes keys/values but keeps the base URL intact."
        : "Copy-ready output. Browser-only.");
    }

    let output = "";
    try{
      if(mode === "query") output = encodeQueryOnly(input);
      else if(mode === "decode") output = decodeAll(input);
      else output = encodeAll(input);

      outTa.value = output;

      // Badge state
      if(mode === "decode"){
        // decoding doesn't guarantee “valid URL”, but shows it's processed
        setBadge(true, "✅ Decoded");
      }else if(mode === "query"){
        setBadge(true, "✅ Encoded query");
      }else{
        setBadge(true, "✅ Encoded");
      }

      updateStats(input, output);
    }catch(e){
      outTa.value = "";
      setBadge(false, "⚠️ Couldn’t process input");
      setMeta("Tip: check for malformed % sequences or unsupported characters.");
      updateStats(input, "");
    }
  }

  /* -----------------------------
     Examples (7 scenarios)
  ----------------------------- */
  const examples = [
    {
      title: "Broken UTM (spaces + &)",
      text: "https://example.com/page?utm_source=instagram bio&utm_campaign=spring & sale&utm_medium=social"
    },
    {
      title: "Query only (needs safe encoding)",
      text: "?q=cheap flights to paris&ref=summer sale&lang=en"
    },
    {
      title: "Already encoded (decode it)",
      text: "https://example.com/search?q=hello%20world%20from%20clickoz&tag=dev%2Bseo"
    },
    {
      title: "Form-style (+ means space)",
      text: "utm_source=newsletter&utm_campaign=jan+update&utm_medium=email"
    },
    {
      title: "Unicode / emoji",
      text: "https://example.com/?title=Pokémon⚡Cards&note=fast + clean"
    },
    {
      title: "Only a value (encode component)",
      text: "hello world & friends = 100%"
    },
    {
      title: "Decode a raw component",
      text: "hello%2Fworld%3Fq%3D1%26x%3D2"
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

    // Suggest a smart mode for some examples (without being invasive)
    const t = ex.text;
    if(t.startsWith("?") || (!t.includes("://") && t.includes("=") && t.includes("&"))){
      applyModeUI("query");
    }else if(looksEncoded(t)){
      applyModeUI("decode");
    }else{
      applyModeUI("encode");
    }

    runTransform();
    inTa.focus();
  }

  // init example box
  if(exBox) showExample(exIndex);
  if(exNew) exNew.addEventListener("click", nextExample);
  if(exLoad) exLoad.addEventListener("click", loadExample);

  /* -----------------------------
     Wire buttons
  ----------------------------- */
  if(btnEnc) btnEnc.addEventListener("click", () => { applyModeUI("encode"); runTransform(); });
  if(btnDec) btnDec.addEventListener("click", () => { applyModeUI("decode"); runTransform(); });

  // If you use radio inputs for modes
  [modeEnc, modeDec, modeQueryOnly].filter(Boolean).forEach(el => {
    el.addEventListener("change", runTransform);
    el.addEventListener("click", () => {
      // if they're buttons with aria-pressed, toggle
      if(el.matches("button")){
        const id = el.id;
        if(id === "ueModeQueryOnly") applyModeUI("query");
        else if(id === "ueModeDecode") applyModeUI("decode");
        else applyModeUI("encode");
        runTransform();
      }
    });
  });

  if(plusAsSpace) plusAsSpace.addEventListener("change", runTransform);

  // live transform
  let tmr = null;
  inTa.addEventListener("input", () => {
    clearTimeout(tmr);
    tmr = setTimeout(runTransform, 60);
  });

  if(btnCopyIn) btnCopyIn.addEventListener("click", async () => {
    const ok = await copyToClipboard(inTa.value || "");
    flash(btnCopyIn, ok, "📋 Copy input");
  });

  if(btnCopyOut) btnCopyOut.addEventListener("click", async () => {
    const ok = await copyToClipboard(outTa.value || "");
    flash(btnCopyOut, ok, "✅ Copy output");
  });

  if(btnClear) btnClear.addEventListener("click", () => {
    inTa.value = "";
    outTa.value = "";
    inTa.focus();
    setBadge(false, "⚠️ Paste a URL or query string");
    setMeta("Tip: use Query-only mode to fix broken parameters without touching the base URL.");
    updateStats("", "");
  });

  outTa.addEventListener("focus", () => {
    try{ outTa.select(); }catch(e){}
  });

  /* -----------------------------
     Initial state
  ----------------------------- */
  // Default: encode mode
  applyModeUI("encode");
  setBadge(false, "⚠️ Paste a URL or query string");
  setMeta("Encode or decode query strings safely to fix broken parameters.");
  updateStats("", "");
})();

