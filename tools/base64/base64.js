/* =========================================================
   Clickoz Tool — Base64 Encode / Decode
   File: /tools/base64/base64.js
   Requires HTML IDs:
   #b64Input, #b64Output
   #b64Encode, #b64Decode, #b64CopyIn, #b64CopyOut, #b64Clear
   #b64ModeEncode, #b64ModeDecode (radio)
   #b64UrlSafe (checkbox)        // base64url (-_) instead of (+/)
   #b64Pad (checkbox)            // add/remove "=" padding when encoding
   #b64Auto (checkbox)           // auto detect + transform on input
   #b64ExampleBox, #b64LoadExample, #b64NewExample
   #b64Validity, #b64Meta
   #b64InLen, #b64OutLen, #b64BytesIn, #b64BytesOut (optional stats)
   Inspector IDs (optional but supported):
   #b64IsJwt, #b64JwtHeader, #b64JwtPayload, #b64JwtSig
========================================================= */

(() => {
  "use strict";

  const $ = (s, r=document) => r.querySelector(s);

  const inTa  = $("#b64Input");
  const outTa = $("#b64Output");

  const btnEnc = $("#b64Encode");
  const btnDec = $("#b64Decode");
  const btnCopyIn  = $("#b64CopyIn");
  const btnCopyOut = $("#b64CopyOut");
  const btnClear   = $("#b64Clear");

  const modeEnc = $("#b64ModeEncode");
  const modeDec = $("#b64ModeDecode");

  const optUrlSafe = $("#b64UrlSafe");
  const optPad     = $("#b64Pad");
  const optAuto    = $("#b64Auto");

  const exBox  = $("#b64ExampleBox");
  const exLoad = $("#b64LoadExample");
  const exNew  = $("#b64NewExample");

  const badge = $("#b64Validity");
  const meta  = $("#b64Meta");

  const stInLen  = $("#b64InLen");
  const stOutLen = $("#b64OutLen");
  const stBytesIn  = $("#b64BytesIn");
  const stBytesOut = $("#b64BytesOut");

  // Inspector (JWT)
  const elIsJwt = $("#b64IsJwt");
  const elJwtHeader = $("#b64JwtHeader");
  const elJwtPayload = $("#b64JwtPayload");
  const elJwtSig = $("#b64JwtSig");

  if(!inTa || !outTa) return;

  /* -----------------------------
     Helpers
  ----------------------------- */
  const normalize = (t) => String(t ?? "").replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

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

  function toBase64(bytes){
    let bin = "";
    const chunk = 0x8000;
    for(let i=0;i<bytes.length;i+=chunk){
      const sub = bytes.subarray(i, i+chunk);
      bin += String.fromCharCode(...sub);
    }
    return btoa(bin);
  }

  function fromBase64(b64){
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function utf8Encode(str){
    return new TextEncoder().encode(String(str ?? ""));
  }
  function utf8Decode(bytes){
    return new TextDecoder().decode(bytes);
  }

  function normalizeB64Input(raw){
    // trim + remove whitespace/newlines
    return normalize(raw).trim().replace(/\s+/g, "");
  }

  function isLikelyB64(s){
    const t = normalizeB64Input(s);
    if(t.length < 8) return false;
    // accept base64url too
    if(!/^[A-Za-z0-9+/_-]+={0,2}$/.test(t)) return false;
    // length should be >= 4 and usually multiple of 4 when padded
    return true;
  }

  function toUrlSafe(b64){
    return String(b64).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromUrlSafe(b64url){
    let s = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
    // restore padding
    const mod = s.length % 4;
    if(mod) s += "=".repeat(4 - mod);
    return s;
  }

  function applyPadding(b64){
    const s = String(b64).replace(/=+$/g, "");
    const mod = s.length % 4;
    return mod ? s + "=".repeat(4 - mod) : s;
  }

  function bytesFromStringOrHexGuess(str){
    // If looks like hex dump (even length, only hex + spaces), convert to bytes.
    const t = normalize(str).trim();
    const hex = t.replace(/\s+/g, "");
    if(hex.length >= 2 && hex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hex)){
      const out = new Uint8Array(hex.length/2);
      for(let i=0;i<hex.length;i+=2){
        out[i/2] = parseInt(hex.slice(i,i+2), 16);
      }
      return { bytes: out, hint: "Detected hex → encoded as bytes." };
    }
    return { bytes: utf8Encode(t), hint: "" };
  }

  function bytesToPretty(bytes){
    // show a compact preview
    const n = bytes?.length || 0;
    if(n === 0) return "0 B";
    if(n < 1024) return `${n} B`;
    if(n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/(1024*1024)).toFixed(2)} MB`;
  }

  function safeJsonParse(str){
    try{ return JSON.parse(str); }catch(e){ return null; }
  }

  function formatJsonIfPossible(str){
    const j = safeJsonParse(str);
    if(!j) return { ok:false, text:str };
    return { ok:true, text: JSON.stringify(j, null, 2) };
  }

  function setInspectorEmpty(){
    if(elIsJwt) elIsJwt.textContent = "No";
    if(elJwtHeader) elJwtHeader.textContent = "—";
    if(elJwtPayload) elJwtPayload.textContent = "—";
    if(elJwtSig) elJwtSig.textContent = "—";
  }

  function inspectJwt(maybeJwt){
    const t = normalizeB64Input(maybeJwt);
    const parts = t.split(".");
    if(parts.length !== 3) { setInspectorEmpty(); return; }

    // Decode header/payload as base64url JSON if possible
    const [h,p,sig] = parts;

    function decodePart(part){
      try{
        const b64 = fromUrlSafe(part);
        const bytes = fromBase64(b64);
        const txt = utf8Decode(bytes);
        const fmt = formatJsonIfPossible(txt);
        return fmt.ok ? fmt.text : txt;
      }catch(e){
        return null;
      }
    }

    const header = decodePart(h);
    const payload = decodePart(p);

    const isJwt = !!(header && payload);
    if(elIsJwt) elIsJwt.textContent = isJwt ? "Yes" : "Maybe";
    if(elJwtHeader) elJwtHeader.textContent = header || "—";
    if(elJwtPayload) elJwtPayload.textContent = payload || "—";
    if(elJwtSig) elJwtSig.textContent = sig ? `${sig.slice(0, clamp(sig.length, 16, 32))}${sig.length>32 ? "…" : ""}` : "—";
  }

  function updateStats(inputStr, outputStr, bytesIn, bytesOut){
    const i = String(inputStr ?? "");
    const o = String(outputStr ?? "");
    if(stInLen) stInLen.textContent = String(i.length);
    if(stOutLen) stOutLen.textContent = String(o.length);
    if(stBytesIn) stBytesIn.textContent = bytesToPretty(bytesIn);
    if(stBytesOut) stBytesOut.textContent = bytesToPretty(bytesOut);
  }

  function getMode(){
    if(modeDec && modeDec.checked) return "decode";
    return "encode";
  }

  function setMode(mode){
    if(mode === "decode"){
      if(modeDec) modeDec.checked = true;
      if(modeEnc) modeEnc.checked = false;
    }else{
      if(modeEnc) modeEnc.checked = true;
      if(modeDec) modeDec.checked = false;
    }
  }

  /* -----------------------------
     Transform core
  ----------------------------- */
  function encode(){
    const raw = normalize(inTa.value).trim();
    if(!raw){
      outTa.value = "";
      setBadge(false, "⚠️ Paste text or bytes");
      setMeta("Tip: paste JSON, a token payload, or plain text. (Hex is auto-detected.)");
      updateStats("", "", new Uint8Array(0), new Uint8Array(0));
      setInspectorEmpty();
      return;
    }

    const { bytes, hint } = bytesFromStringOrHexGuess(raw);
    let b64 = toBase64(bytes);

    // optional padding control (for display; base64 is valid with padding)
    if(optPad && !optPad.checked){
      b64 = b64.replace(/=+$/g, "");
    }else{
      b64 = applyPadding(b64);
    }

    // url-safe transform
    if(optUrlSafe && optUrlSafe.checked){
      b64 = toUrlSafe(b64);
    }

    outTa.value = b64;

    setBadge(true, "✅ Encoded");
    setMeta(hint || "Copy-ready Base64 output. Toggle URL-safe for tokens / URLs.");

    updateStats(raw, b64, bytes, utf8Encode(b64));
    inspectJwt(b64);
  }

  function decode(){
    const raw = normalize(inTa.value).trim();
    const t = normalizeB64Input(raw);

    if(!t){
      outTa.value = "";
      setBadge(false, "⚠️ Paste Base64");
      setMeta("Tip: paste Base64 or Base64URL. The tool will restore padding automatically.");
      updateStats("", "", new Uint8Array(0), new Uint8Array(0));
      setInspectorEmpty();
      return;
    }

    // Detect base64url by chars - _
    const isUrl = /[-_]/.test(t) && !/[+/]/.test(t);
    let b64 = t;

    try{
      b64 = isUrl ? fromUrlSafe(t) : applyPadding(t);
      const bytes = fromBase64(b64);

      // Try decode as UTF-8
      let txt = "";
      try{
        txt = utf8Decode(bytes);
      }catch(e){
        txt = "";
      }

      // If it looks like JSON, pretty-print
      const fmt = formatJsonIfPossible(txt);
      const out = fmt.ok ? fmt.text : txt;

      outTa.value = out;

      setBadge(true, fmt.ok ? "✅ Decoded (JSON)" : "✅ Decoded");
      setMeta(isUrl
        ? "Detected Base64URL (JWT-style). Decoded output shown below."
        : "Decoded output shown below. If text looks broken, it may be binary.");

      updateStats(raw, out, utf8Encode(raw), bytes);
      inspectJwt(raw); // inspect original (for real JWT with dots)
    }catch(e){
      outTa.value = "";
      setBadge(false, "⚠️ Invalid Base64");
      setMeta("Check characters and padding. Remove spaces/newlines and try again.");
      updateStats(raw, "", utf8Encode(raw), new Uint8Array(0));
      setInspectorEmpty();
    }
  }

  function run(){
    const mode = getMode();
    if(mode === "decode") decode();
    else encode();
  }

  /* -----------------------------
     Examples (7 realistic)
  ----------------------------- */
  const examples = [
    {
      title: "JSON payload (encode)",
      text: `{"user":"clickoz","role":"admin","exp":1893456000,"tags":["seo","tools","dev"]}`
    },
    {
      title: "JWT (inspect header/payload)",
      text: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGlja296Iiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sImlhdCI6MTcwMDAwMDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
    },
    {
      title: "Base64URL (decode)",
      text: `eyJkZWJ1ZyI6dHJ1ZSwiY2hhbm5lbCI6InlvdXR1YmUiLCJjYW1wYWlnbiI6Imphbi11cGRhdGUifQ`
    },
    {
      title: "Plain text (encode)",
      text: `Track clicks cleanly. No uploads. Copy-ready output.`
    },
    {
      title: "Binary-ish text (decode)",
      text: `SGVsbG8gV29ybGQhIPCfkYI=`
    },
    {
      title: "Hex bytes (auto-detected → encode)",
      text: `48 65 6c 6c 6f 20 43 6c 69 63 6b 6f 7a`
    },
    {
      title: "Token snippet (decode)",
      text: `eyJpc3MiOiJjbGlja296IiwiYXVkIjoidG9vbHMiLCJ2IjoyfQ==`
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

    // Smart mode suggestion
    const t = normalize(inTa.value).trim();
    if(t.includes(".") && t.split(".").length === 3) setMode("decode");
    else if(isLikelyB64(t) && /%?[A-Za-z0-9+/_-]+={0,2}/.test(t) && t.length > 12) setMode("decode");
    else setMode("encode");

    run();
    inTa.focus();
  }

  /* -----------------------------
     Events
  ----------------------------- */
  if(exBox) showExample(exIndex);
  if(exNew) exNew.addEventListener("click", nextExample);
  if(exLoad) exLoad.addEventListener("click", loadExample);

  if(btnEnc) btnEnc.addEventListener("click", () => { setMode("encode"); run(); });
  if(btnDec) btnDec.addEventListener("click", () => { setMode("decode"); run(); });

  if(modeEnc) modeEnc.addEventListener("change", run);
  if(modeDec) modeDec.addEventListener("change", run);

  if(optUrlSafe) optUrlSafe.addEventListener("change", run);
  if(optPad) optPad.addEventListener("change", run);
  if(optAuto) optAuto.addEventListener("change", () => {
    setMeta(optAuto.checked ? "Auto mode enabled: transforms as you type." : "Auto mode disabled: use Encode/Decode buttons.");
  });

  let tmr = null;
  inTa.addEventListener("input", () => {
    if(optAuto && !optAuto.checked) return;
    clearTimeout(tmr);
    tmr = setTimeout(run, 70);
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
    setBadge(false, "⚠️ Paste text or Base64");
    setMeta("Inspect tokens and payloads quickly with clean, readable output.");
    updateStats("", "", new Uint8Array(0), new Uint8Array(0));
    setInspectorEmpty();
  });

  outTa.addEventListener("focus", () => { try{ outTa.select(); }catch(e){} });

  /* -----------------------------
     Init
  ----------------------------- */
  // defaults
  if(optAuto) optAuto.checked = true;
  if(optPad) optPad.checked = true;
  if(optUrlSafe) optUrlSafe.checked = false;

  setBadge(false, "⚠️ Paste text or Base64");
  setMeta("Inspect tokens and payloads quickly with clean, readable output.");
  setInspectorEmpty();
  updateStats("", "", new Uint8Array(0), new Uint8Array(0));
})();

