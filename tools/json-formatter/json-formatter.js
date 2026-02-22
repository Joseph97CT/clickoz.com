/* ==========================================================================
   Clickoz — JSON Formatter (Tool)
   File: /tools/json-formatter/json-formatter.js
   Requires: /assets/tools.js (ClickozToolShell)
   ========================================================================== */

(() => {
  'use strict';

  function stripBomAndTrim(s) {
    if (!s) return '';
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    return s.trim();
  }

  function detectMinified(s) {
    const oneLine = s.split('\n').length === 1;
    return oneLine && s.length > 160;
  }

  function safeParseJson(input) {
    const s = stripBomAndTrim(input);
    if (!s) return { ok: false, error: 'Paste JSON to format.' };

    try {
      const value = JSON.parse(s);
      return { ok: true, value };
    } catch (e) {
      return { ok: false, error: e?.message || 'Invalid JSON.' };
    }
  }

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

  function setText(el, txt) {
    if (!el) return;
    el.textContent = txt;
  }

  function setPill(pill, type, text) {
    if (!pill) return;
    pill.classList.remove('pill--ok', 'pill--warn', 'pill--bad');
    if (type === 'ok') pill.classList.add('pill--ok');
    else if (type === 'warn') pill.classList.add('pill--warn');
    else if (type === 'bad') pill.classList.add('pill--bad');
    pill.textContent = text;
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

  ClickozToolShell.register({
    persist: true,

    init(root) {
      const input = root.querySelector('#jsonInput');
      const output = root.querySelector('#jsonOutput');
      const pill = root.querySelector('#jsonStatusPill');

      const indentSel = root.querySelector('#jsonIndent');
      const sortChk = root.querySelector('#jsonSortKeys');
      const autoChk = root.querySelector('#jsonAuto');

      const mIn = root.querySelector('#mInputChars');
      const mOut = root.querySelector('#mOutputChars');
      const mKeys = root.querySelector('#mKeys');
      const mArrays = root.querySelector('#mArrays');

      const btnFormat = root.querySelector('#btnFormat');

      const apply = () => {
        const raw = input?.value || '';
        const parsed = safeParseJson(raw);

        if (!raw.trim()) {
          setPill(pill, 'warn', 'Waiting for JSON…');
          setText(output, '');
          setText(mIn, '0');
          setText(mOut, '0');
          setText(mKeys, '0');
          setText(mArrays, '0');
          return;
        }

        if (!parsed.ok) {
          setPill(pill, 'bad', 'Invalid JSON');
          setText(output, parsed.error);
          setText(mIn, String(raw.length));
          setText(mOut, String((output?.textContent || '').length));
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

        setText(output, formatted);

        const minified = detectMinified(stripBomAndTrim(raw));
        setPill(pill, 'ok', minified ? 'Valid JSON (minified)' : 'Valid JSON');

        const metrics = computeMetrics(raw, formatted, parsed.value);
        setText(mIn, String(metrics.inputChars));
        setText(mOut, String(metrics.outputChars));
        setText(mKeys, String(metrics.keys));
        setText(mArrays, String(metrics.arrays));
      };

      const maybeAuto = () => {
        if (autoChk?.checked) apply();
      };

      input?.addEventListener('input', maybeAuto);
      indentSel?.addEventListener('change', maybeAuto);
      sortChk?.addEventListener('change', maybeAuto);
      autoChk?.addEventListener('change', () => { if (autoChk.checked) apply(); });
      btnFormat?.addEventListener('click', apply);

      // store refs for shell calls (example/clear/persist)
      this._els = { input, output, pill, indentSel, sortChk, autoChk };
      this._apply = apply;

      setPill(pill, 'warn', 'Waiting for JSON…');
      apply();
    },

    getExample() {
      return {
        json: `{"name":"Clickoz","tools":["json-formatter","utm-builder"],"meta":{"privacy":"browser-only","fast":true},"numbers":[1,2,3],"nested":{"a":1,"b":{"c":[{"id":1},{"id":2}]}}}`,
        indent: 2,
        sortKeys: false,
        auto: true
      };
    },

    serialize() {
      const { input, indentSel, sortChk, autoChk } = this._els || {};
      return {
        json: input?.value ?? '',
        indent: Number(indentSel?.value ?? 2),
        sortKeys: !!sortChk?.checked,
        auto: !!autoChk?.checked
      };
    },

    hydrate(state) {
      const { input, indentSel, sortChk, autoChk } = this._els || {};
      if (!state) return;

      if (input && typeof state.json === 'string') input.value = state.json;
      if (indentSel && state.indent != null) indentSel.value = String(state.indent);
      if (sortChk) sortChk.checked = !!state.sortKeys;
      if (autoChk) autoChk.checked = state.auto !== false;

      this._apply?.();
    },

    clear() {
      const { input, sortChk, autoChk, indentSel } = this._els || {};
      if (input) input.value = '';
      if (sortChk) sortChk.checked = false;
      if (autoChk) autoChk.checked = true;
      if (indentSel) indentSel.value = '2';
      this._apply?.();
    }
  });
})();
