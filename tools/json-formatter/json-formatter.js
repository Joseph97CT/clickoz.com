/* ==========================================================================
   Clickoz — JSON Formatter (Tool)
   File: /tools/json-formatter/json-formatter.js
   Requires: /assets/tools.js (ClickozToolShell)
   ========================================================================== */

(() => {
  'use strict';

  // ---------- utils ----------
  function stripBomAndTrim(s) {
    if (!s) return '';
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    return s.trim();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function detectMinified(s) {
    const oneLine = s.split('\n').length === 1;
    return oneLine && s.length > 160;
  }

  function setText(el, txt) {
    if (!el) return;
    el.textContent = txt;
  }

  function setHtml(el, html) {
    if (!el) return;
    el.innerHTML = html;
  }

  function setPill(pill, type, text) {
    if (!pill) return;
    pill.classList.remove('pill--ok', 'pill--warn', 'pill--bad');
    if (type === 'ok') pill.classList.add('pill--ok');
    else if (type === 'warn') pill.classList.add('pill--warn');
    else if (type === 'bad') pill.classList.add('pill--bad');
    pill.textContent = text;
  }

  function setOutputState(outputBox, state) {
    if (!outputBox) return;
    outputBox.classList.remove('jsonf--ok', 'jsonf--bad');
    if (state === 'ok') outputBox.classList.add('jsonf--ok');
    if (state === 'bad') outputBox.classList.add('jsonf--bad');
  }

  function applyWrap(outputBox, wrap) {
    if (!outputBox) return;
    outputBox.classList.toggle('jsonf-wrap', !!wrap);
  }

  // ---------- JSON parsing with rich error details ----------
  function extractPositionFromMessage(msg) {
    // Common V8 format: "Unexpected token ... in JSON at position 123"
    const m = /at position (\d+)/i.exec(msg || '');
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }

  function positionToLineCol(raw, pos) {
    // pos is 0-based index into raw string (after trimming? we want raw index)
    // We'll compute on the exact string we parse (trimmed) so user line/col matches it.
    let line = 1;
    let col = 1;
    for (let i = 0; i < pos && i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '\n') {
        line += 1;
        col = 1;
      } else {
        col += 1;
      }
    }
    return { line, col };
  }

  function buildSnippet(raw, pos, radius = 50) {
    const start = Math.max(0, pos - radius);
    const end = Math.min(raw.length, pos + radius);
    const before = raw.slice(start, pos);
    const at = raw.slice(pos, pos + 1);
    const after = raw.slice(pos + 1, end);

    // Normalize newlines in snippet for display (keep as-is, but ensure it's visible)
    const snippet = before + (at || '') + after;

    // caret line (spaces for before length, caret at position)
    // Replace tabs with 2 spaces to keep caret closer
    const beforeVis = before.replaceAll('\t', '  ');
    const caretPad = beforeVis.length;
    const caretLine = `${' '.repeat(caretPad)}^`;

    return { snippet, caretLine, clippedLeft: start > 0, clippedRight: end < raw.length };
  }

  function safeParseJsonDetailed(input) {
    const s = stripBomAndTrim(input);
    if (!s) return { ok: false, error: { message: 'Paste JSON to format.' } };

    try {
      const value = JSON.parse(s);
      return { ok: true, value, normalized: s };
    } catch (e) {
      const message = (e && e.message) ? String(e.message) : 'Invalid JSON.';
      const pos = extractPositionFromMessage(message);

      if (pos == null) {
        return { ok: false, error: { message } };
      }

      const { line, col } = positionToLineCol(s, pos);
      const { snippet, caretLine, clippedLeft, clippedRight } = buildSnippet(s, pos);

      return {
        ok: false,
        error: {
          message,
          pos,
          line,
          col,
          snippet,
          caretLine,
          clippedLeft,
          clippedRight
        }
      };
    }
  }

  // ---------- formatting ----------
  function prettyJson(obj, { indent = 2, sortKeys = false } = {}) {
    if (!sortKeys) return JSON.stringify(obj, null, indent);

    const sortDeep = (v) => {
      if (Array.isArray(v)) return v.map(sortDeep);
      if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v).sort((a, b) => a.localeCompare(b))) {
          out[k] = sortDeep(v[k]);
        }
        return out;
      }
      return v;
    };

    return JSON.stringify(sortDeep(obj), null, indent);
  }

  function computeMetrics(raw, formatted, parsedValue) {
    const inputChars = raw.length;
    const outputChars = formatted.length;

    let keys = 0;
    let arrays = 0;

    const walk = (v) => {
      if (Array.isArray(v)) {
        arrays += 1;
        for (const x of v) walk(x);
      } else if (v && typeof v === 'object') {
        keys += Object.keys(v).length;
        for (const k of Object.keys(v)) walk(v[k]);
      }
    };

    walk(parsedValue);
    return { inputChars, outputChars, keys, arrays };
  }

  // ---------- debounce ----------
  function debounce(fn, wait) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function dynamicWaitForSize(n) {
    // Smooth for small payloads, safer for large payloads
    if (n <= 5_000) return 120;
    if (n <= 50_000) return 180;
    if (n <= 200_000) return 260;
    return 360;
  }

  // ---------- render error HTML ----------
  function renderErrorHtml(err) {
    const title = `<span class="jsonf-error-title">Invalid JSON</span>`;
    const meta =
      (err && Number.isFinite(err.line) && Number.isFinite(err.col))
        ? `<span class="jsonf-error-meta">Line ${err.line}, Col ${err.col}</span>`
        : '';

    const msg = `<div style="margin-top:10px;">${escapeHtml(err?.message || 'Invalid JSON.')}</div>`;

    if (!err?.snippet) {
      return `${title}${meta ? ` <span style="opacity:.9;">•</span> ${meta}` : ''}${msg}`;
    }

    const leftDots = err.clippedLeft ? '…' : '';
    const rightDots = err.clippedRight ? '…' : '';
    const snippet = `${leftDots}${escapeHtml(err.snippet)}${rightDots}`;
    const caret = escapeHtml(err.caretLine || '^');

    return `
      ${title}${meta ? ` <span style="opacity:.9;">•</span> ${meta}` : ''}
      ${msg}
      <span class="jsonf-error-snippet">
        ${snippet}
        <span class="jsonf-caret">${caret}</span>
      </span>
    `.trim();
  }

  // ---------- tool ----------
  ClickozToolShell.register({
    persist: true,

    init(root) {
      const input = root.querySelector('#jsonInput');
      const outputPre = root.querySelector('#jsonOutput');     // <pre>
      const pill = root.querySelector('#jsonStatusPill');

      const indentSel = root.querySelector('#jsonIndent');
      const sortChk = root.querySelector('#jsonSortKeys');
      const autoChk = root.querySelector('#jsonAuto');

      const mIn = root.querySelector('#mInputChars');
      const mOut = root.querySelector('#mOutputChars');
      const mKeys = root.querySelector('#mKeys');
      const mArrays = root.querySelector('#mArrays');

      const btnFormat = root.querySelector('#btnFormat');

      // Optional future controls (safe if missing in HTML)
      const wrapChk = root.querySelector('#jsonWrap');         // checkbox (optional)
      const btnUpload = root.querySelector('#btnUploadJson');  // optional
      const fileInput = root.querySelector('#jsonFile');       // optional hidden input[type=file]
      const btnDownload = root.querySelector('#btnDownload');  // optional

      const outputBox =
        (outputPre && outputPre.closest('.jsonf-output')) ||
        (outputPre && outputPre.parentElement) ||
        null;

      const setEmpty = () => {
        setPill(pill, 'warn', 'Waiting for JSON…');
        setOutputState(outputBox, null);
        if (outputPre) setText(outputPre, '');
        setText(mIn, '0');
        setText(mOut, '0');
        setText(mKeys, '0');
        setText(mArrays, '0');
      };

      const apply = () => {
        const raw = input?.value || '';
        const trimmed = stripBomAndTrim(raw);

        // Keep wrap state applied even when empty
        applyWrap(outputBox, !!wrapChk?.checked);

        if (!trimmed) {
          setEmpty();
          return;
        }

        const parsed = safeParseJsonDetailed(raw);

        // metrics input always available
        setText(mIn, String(raw.length));

        if (!parsed.ok) {
          setPill(pill, 'bad', 'Invalid JSON');
          setOutputState(outputBox, 'bad');

          // show rich error
          if (outputPre) {
            setHtml(outputPre, renderErrorHtml(parsed.error));
          }

          // output chars = current output length (textContent)
          setText(mOut, String((outputPre?.textContent || '').length));
          setText(mKeys, '0');
          setText(mArrays, '0');
          return;
        }

        const indent = Number(indentSel?.value ?? 2);
        const sortKeys = !!sortChk?.checked;

        const formatted = prettyJson(parsed.value, {
          indent: Number.isFinite(indent) ? indent : 2,
          sortKeys
        });

        if (outputPre) setText(outputPre, formatted);

        const minified = detectMinified(stripBomAndTrim(raw));
        setPill(pill, 'ok', minified ? 'Valid JSON (minified)' : 'Valid JSON');
        setOutputState(outputBox, 'ok');

        const metrics = computeMetrics(raw, formatted, parsed.value);
        setText(mOut, String(metrics.outputChars));
        setText(mKeys, String(metrics.keys));
        setText(mArrays, String(metrics.arrays));
      };

      // Debounced apply for auto-format
      const applyAutoDebounced = debounce(() => {
        if (!autoChk?.checked) return;
        apply();
      }, dynamicWaitForSize((input?.value || '').length));

      const refreshDebounce = () => {
        // Recreate debounce delay based on size (simple trick: call applyAutoDebounced soon)
        // We can't change delay inside existing debounce easily; so we just call a size-based timer here.
        if (!autoChk?.checked) return;
        const wait = dynamicWaitForSize((input?.value || '').length);
        clearTimeout(this._autoTimer);
        this._autoTimer = setTimeout(() => apply(), wait);
      };

      const maybeAuto = () => {
        // Better: dynamic timer
        refreshDebounce();
      };

      input?.addEventListener('input', maybeAuto);
      indentSel?.addEventListener('change', maybeAuto);
      sortChk?.addEventListener('change', maybeAuto);
      autoChk?.addEventListener('change', () => {
        if (autoChk.checked) apply();
      });

      wrapChk?.addEventListener('change', () => {
        applyWrap(outputBox, !!wrapChk.checked);
      });

      btnFormat?.addEventListener('click', apply);

      // Ctrl/Cmd + Enter to format
      input?.addEventListener('keydown', (e) => {
        const isEnter = e.key === 'Enter';
        const mod = e.ctrlKey || e.metaKey;
        if (isEnter && mod) {
          e.preventDefault();
          apply();
        }
      });

      // Optional: upload JSON file
      const triggerFile = () => fileInput?.click();
      btnUpload?.addEventListener('click', triggerFile);

      fileInput?.addEventListener('change', async () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        try {
          const txt = await f.text();
          if (input) input.value = txt;
          apply();
        } catch {
          // fallback
          if (input) input.value = '';
          setPill(pill, 'bad', 'File read error');
          setOutputState(outputBox, 'bad');
          if (outputPre) setHtml(outputPre, renderErrorHtml({ message: 'Could not read the file.' }));
        } finally {
          // allow re-upload same file
          fileInput.value = '';
        }
      });

      // Optional: download output
      btnDownload?.addEventListener('click', () => {
        const content = outputPre?.textContent || '';
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

      // store refs for shell calls (example/clear/persist)
      this._els = {
        input,
        outputPre,
        outputBox,
        pill,
        indentSel,
        sortChk,
        autoChk,
        wrapChk
      };
      this._apply = apply;

      // initial
      setEmpty();
      apply();
    },

    getExample() {
      return {
        json: `{"name":"Clickoz","tools":["json-formatter","utm-builder"],"meta":{"privacy":"browser-only","fast":true},"numbers":[1,2,3],"nested":{"a":1,"b":{"c":[{"id":1},{"id":2}]}}}`,
        indent: 2,
        sortKeys: false,
        auto: true,
        wrap: false
      };
    },

    serialize() {
      const { input, indentSel, sortChk, autoChk, wrapChk } = this._els || {};
      return {
        json: input?.value ?? '',
        indent: Number(indentSel?.value ?? 2),
        sortKeys: !!sortChk?.checked,
        auto: !!autoChk?.checked,
        wrap: !!wrapChk?.checked
      };
    },

    hydrate(state) {
      const { input, indentSel, sortChk, autoChk, wrapChk, outputBox } = this._els || {};
      if (!state) return;

      if (input && typeof state.json === 'string') input.value = state.json;
      if (indentSel && state.indent != null) indentSel.value = String(state.indent);
      if (sortChk) sortChk.checked = !!state.sortKeys;
      if (autoChk) autoChk.checked = state.auto !== false;

      if (wrapChk) wrapChk.checked = !!state.wrap;
      applyWrap(outputBox, !!state.wrap);

      this._apply?.();
    },

    clear() {
      const { input, sortChk, autoChk, indentSel, wrapChk, outputBox } = this._els || {};
      if (input) input.value = '';
      if (sortChk) sortChk.checked = false;
      if (autoChk) autoChk.checked = true;
      if (indentSel) indentSel.value = '2';
      if (wrapChk) wrapChk.checked = false;
      applyWrap(outputBox, false);
      this._apply?.();
    }
  });
})();
