/* ==========================================================================
   Clickoz — JSON Formatter (UTM Builder style page shell)
   File: /tools/json-formatter/json-formatter.js
   No dependency on tools.js — matches UTM Builder approach
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const els = {
    in:  $('#jfInput'),
    out: $('#jfOutput'),
    pill: $('#jfStatus'),
    err: $('#jfError'),

    indent: $('#jfIndent'),
    sort: $('#jfSort'),
    auto: $('#jfAuto'),
    wrap: $('#jfWrap'),

    btnCopy: $('#jfCopy'),
    btnClear: $('#jfClear'),
    btnFormat: $('#jfFormat'),

    btnLoadExample: $('#jfLoadExample'),
    btnNewExample: $('#jfNewExample'),
    exampleBox: $('#jfExampleBox'),

    file: $('#jfFile'),
    btnUpload: $('#jfUpload'),
    btnDownload: $('#jfDownload'),

    // stats
    sIn: $('#jfInChars'),
    sOut: $('#jfOutChars'),
    sKeys: $('#jfKeys'),
    sArrays: $('#jfArrays')
  };

  // ---------- helpers ----------
  const monoTrim = (s) => {
    if (!s) return '';
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    return s.trim();
  };

  const setPill = (type, text) => {
    if (!els.pill) return;
    els.pill.classList.remove('ok', 'bad');
    if (type) els.pill.classList.add(type);
    els.pill.textContent = text;
  };

  const setError = (html) => {
    if (!els.err) return;
    if (!html) {
      els.err.hidden = true;
      els.err.innerHTML = '';
      return;
    }
    els.err.hidden = false;
    els.err.innerHTML = html;
  };

  const applyWrapClass = () => {
    document.body.classList.toggle('is-wrap', !!els.wrap?.checked);
  };

  const safeCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  };

  // Parse error position helpers (V8 style)
  const extractPos = (msg) => {
    const m = /at position (\d+)/i.exec(msg || '');
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const posToLineCol = (s, pos) => {
    let line = 1, col = 1;
    for (let i = 0; i < pos && i < s.length; i++) {
      if (s[i] === '\n') { line++; col = 1; }
      else col++;
    }
    return { line, col };
  };

  const snippetAt = (s, pos, radius = 60) => {
    const start = Math.max(0, pos - radius);
    const end = Math.min(s.length, pos + radius);
    const before = s.slice(start, pos);
    const at = s.slice(pos, pos + 1);
    const after = s.slice(pos + 1, end);
    const clippedLeft = start > 0;
    const clippedRight = end < s.length;

    const caretPad = before.replaceAll('\t', '  ').length;
    const caret = `${' '.repeat(caretPad)}^`;

    return {
      snippet: `${clippedLeft ? '…' : ''}${before}${at}${after}${clippedRight ? '…' : ''}`,
      caret
    };
  };

  const pretty = (obj, indent, sortKeys) => {
    if (!sortKeys) return JSON.stringify(obj, null, indent);

    const sortDeep = (v) => {
      if (Array.isArray(v)) return v.map(sortDeep);
      if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v).sort((a,b)=>a.localeCompare(b))) {
          out[k] = sortDeep(v[k]);
        }
        return out;
      }
      return v;
    };

    return JSON.stringify(sortDeep(obj), null, indent);
  };

  const metrics = (raw, formatted, value) => {
    let keys = 0;
    let arrays = 0;

    const walk = (v) => {
      if (Array.isArray(v)) {
        arrays++;
        for (const x of v) walk(x);
      } else if (v && typeof v === 'object') {
        keys += Object.keys(v).length;
        for (const k of Object.keys(v)) walk(v[k]);
      }
    };

    walk(value);

    return {
      inChars: raw.length,
      outChars: formatted.length,
      keys,
      arrays
    };
  };

  const render = () => {
    const raw = els.in?.value ?? '';
    const s = monoTrim(raw);

    applyWrapClass();

    if (els.sIn) els.sIn.textContent = String(raw.length);

    if (!s) {
      if (els.out) els.out.value = '';
      setPill(null, 'Waiting for JSON…');
      setError('');
      if (els.sOut) els.sOut.textContent = '0';
      if (els.sKeys) els.sKeys.textContent = '0';
      if (els.sArrays) els.sArrays.textContent = '0';
      return;
    }

    let value;
    try {
      value = JSON.parse(s);
    } catch (e) {
      const msg = (e && e.message) ? String(e.message) : 'Invalid JSON.';
      const pos = extractPos(msg);

      let extra = '';
      if (pos != null) {
        const lc = posToLineCol(s, pos);
        const sn = snippetAt(s, pos);
        extra = `
          <div class="muted" style="margin-top:6px;">Line <b>${lc.line}</b>, Col <b>${lc.col}</b></div>
          <code>${sn.snippet}\n${sn.caret}</code>
        `;
      }

      setPill('bad', 'Invalid JSON');
      setError(`<div><b>Invalid JSON.</b> ${msg}${extra}</div>`);
      if (els.out) els.out.value = '';
      if (els.sOut) els.sOut.textContent = '0';
      if (els.sKeys) els.sKeys.textContent = '0';
      if (els.sArrays) els.sArrays.textContent = '0';
      return;
    }

    const indent = Number(els.indent?.value ?? 2);
    const sortKeys = !!els.sort?.checked;

    const formatted = pretty(value, Number.isFinite(indent) ? indent : 2, sortKeys);

    if (els.out) els.out.value = formatted;
    setPill('ok', indent === 0 ? 'Valid JSON (minified)' : 'Valid JSON');
    setError('');

    const m = metrics(raw, formatted, value);
    if (els.sOut) els.sOut.textContent = String(m.outChars);
    if (els.sKeys) els.sKeys.textContent = String(m.keys);
    if (els.sArrays) els.sArrays.textContent = String(m.arrays);
  };

  // debounce based on input size
  let t = null;
  const schedule = () => {
    if (!els.auto?.checked) return;
    const n = (els.in?.value || '').length;
    const wait = n <= 5000 ? 120 : n <= 50000 ? 180 : n <= 200000 ? 260 : 360;
    clearTimeout(t);
    t = setTimeout(render, wait);
  };

  // examples
  const examples = [
    {
      title: 'API response (nested)',
      json: `{"status":"ok","user":{"id":72,"name":"Mark","roles":["admin","editor"]},"meta":{"privacy":"browser-only","ts":"2026-02-22T18:00:00+01:00"},"items":[{"id":1,"qty":2},{"id":2,"qty":1}]}`
    },
    {
      title: 'Event payload (minified)',
      json: `{"event":"purchase","value":39.9,"currency":"EUR","items":[{"sku":"A1","price":19.95},{"sku":"B4","price":19.95}],"utm":{"source":"instagram","medium":"social","campaign":"winter-launch"}}`
    },
    {
      title: 'Config (common mistakes to debug)',
      json: `{
  "name": "clickoz",
  "features": ["json-formatter","utm-builder"],
  "flags": {"privacy": true, "fast": true}
}`
    }
  ];

  let exIndex = 0;
  const setExampleBox = (i) => {
    const ex = examples[i % examples.length];
    if (!els.exampleBox) return;
    els.exampleBox.textContent = `Click “Load example” to fill:\n• ${ex.title}`;
  };

  const loadExample = () => {
    const ex = examples[exIndex % examples.length];
    if (els.in) els.in.value = ex.json;
    render();
  };

  const newExample = () => {
    exIndex = (exIndex + 1) % examples.length;
    setExampleBox(exIndex);
  };

  // upload/download
  const doUpload = () => els.file?.click();

  const doDownload = () => {
    const content = els.out?.value || '';
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---------- wire ----------
  const bind = () => {
    setExampleBox(0);
    applyWrapClass();
    render();

    els.in?.addEventListener('input', schedule);
    els.indent?.addEventListener('change', schedule);
    els.sort?.addEventListener('change', schedule);
    els.auto?.addEventListener('change', () => { if (els.auto.checked) render(); });
    els.wrap?.addEventListener('change', () => { applyWrapClass(); });

    els.btnFormat?.addEventListener('click', render);
    els.btnClear?.addEventListener('click', () => {
      if (els.in) els.in.value = '';
      if (els.out) els.out.value = '';
      render();
    });

    els.btnCopy?.addEventListener('click', async () => {
      const ok = await safeCopy(els.out?.value || '');
      setPill(ok ? 'ok' : 'bad', ok ? 'Copied' : 'Copy failed');
      setTimeout(() => render(), 650);
    });

    els.btnLoadExample?.addEventListener('click', loadExample);
    els.btnNewExample?.addEventListener('click', newExample);

    els.btnUpload?.addEventListener('click', doUpload);
    els.file?.addEventListener('change', async () => {
      const f = els.file.files && els.file.files[0];
      if (!f) return;
      try {
        const txt = await f.text();
        if (els.in) els.in.value = txt;
        render();
      } catch {
        setPill('bad', 'File read error');
      } finally {
        els.file.value = '';
      }
    });

    els.btnDownload?.addEventListener('click', doDownload);

    // Ctrl/Cmd + Enter formats
    els.in?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        render();
      }
    });
  };

  // Wait for DOM (defer should already)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
