/* =====================================================================
   Clickoz — Tools Shell (GLOBAL)
   File: /assets/tools.js

   Purpose:
   - Standard UX for ALL /tools/* pages
   - Skeleton loading (.is-loading -> .is-ready)
   - Toasts
   - Copy / Clear / Example actions via data-action
   - Optional localStorage persistence (per tool, keyed by data-tool)
   - Optional FAQ accordion helper

   REQUIRED HTML HOOKS (recommended):
   - Root: <main class="tools-wrap is-loading" data-tool="json-formatter" data-persist>...</main>
     - data-tool: unique id for the tool (used as storage key)
     - data-persist (optional): enable persistence if tool implements serialize/hydrate

   ACTION BUTTONS (optional):
   - data-action="copy"    data-copy-target="#output"
   - data-action="clear"
   - data-action="example"
   - data-action="reset-storage"

   Tool-specific JS (example):
   ClickozToolShell.register({
     persist: true, // optional (or rely on data-persist in HTML)
     init(root){ ... },
     getExample(){ return {...} },       // optional
     serialize(){ return {...} },        // optional (for persistence)
     hydrate(state){ ... },              // optional (for example + persistence)
     clear(){ ... }                      // optional (for clear button)
   });

   ===================================================================== */

(() => {
  'use strict';

  const SHELL_VERSION = '1.0.0';

  // -----------------------------
  // Utilities
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function safeJsonParse(str, fallback = null) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function debounce(fn, wait = 180) {
    let t;
    return (...args) => {
      window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
  }

  // -----------------------------
  // Root + key (NEUTRAL)
  // -----------------------------
  function getToolRoot() {
    return $('.tools-wrap[data-tool]') || $('main[data-tool]') || document.body;
  }

  function getToolKey(root) {
    // Always derive from HTML, never hardcode names like "utm"
    const k = root?.getAttribute?.('data-tool');
    return (k && k.trim()) ? k.trim() : 'tool';
  }

  function setLoading(root, isLoading) {
    if (!root?.classList) return;
    root.classList.toggle('is-loading', !!isLoading);
    root.classList.toggle('is-ready', !isLoading);
  }

  // -----------------------------
  // Toasts
  // -----------------------------
  const Toast = (() => {
    let host;

    function ensureHost() {
      if (host) return host;
      host = document.createElement('div');
      host.id = 'cx-toasts';
      host.style.position = 'fixed';
      host.style.right = '16px';
      host.style.bottom = '16px';
      host.style.display = 'flex';
      host.style.flexDirection = 'column';
      host.style.gap = '10px';
      host.style.zIndex = '9999';
      host.style.maxWidth = 'min(420px, calc(100vw - 32px))';
      document.body.appendChild(host);
      return host;
    }

    function show(message, { type = 'info', ttl = 2400 } = {}) {
      ensureHost();

      const el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.style.borderRadius = '14px';
      el.style.padding = '12px 12px';
      el.style.border = '1px solid rgba(255,255,255,.12)';
      el.style.background = 'rgba(0,0,0,.55)';
      el.style.backdropFilter = 'blur(10px)';
      el.style.boxShadow = '0 16px 60px rgba(0,0,0,.55)';
      el.style.color = 'rgba(255,255,255,.92)';
      el.style.fontSize = '13.5px';
      el.style.lineHeight = '1.35';
      el.style.display = 'flex';
      el.style.gap = '10px';
      el.style.alignItems = 'flex-start';
      el.style.transform = 'translateY(6px)';
      el.style.opacity = '0';
      el.style.transition = 'transform .18s ease, opacity .18s ease';

      const dot = document.createElement('span');
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.marginTop = '4px';
      dot.style.borderRadius = '999px';
      dot.style.flex = '0 0 10px';

      if (type === 'success') dot.style.background = 'rgba(34,197,94,.95)';
      else if (type === 'error') dot.style.background = 'rgba(239,68,68,.95)';
      else if (type === 'warn') dot.style.background = 'rgba(var(--accent-rgb,34,211,238),.95)';
      else dot.style.background = 'rgba(124,92,255,.95)';

      const text = document.createElement('div');
      text.textContent = message;

      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '×';
      x.setAttribute('aria-label', 'Close');
      x.style.marginLeft = 'auto';
      x.style.border = 'none';
      x.style.background = 'transparent';
      x.style.color = 'rgba(255,255,255,.78)';
      x.style.cursor = 'pointer';
      x.style.fontSize = '18px';
      x.style.lineHeight = '1';
      x.style.padding = '0 2px';

      x.addEventListener('click', () => remove(el));

      el.appendChild(dot);
      el.appendChild(text);
      el.appendChild(x);
      host.appendChild(el);

      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });

      const timer = window.setTimeout(() => remove(el), ttl);
      el.addEventListener('mouseenter', () => window.clearTimeout(timer), { once: true });

      return el;
    }

    function remove(el) {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      window.setTimeout(() => {
        if (el?.parentNode) el.parentNode.removeChild(el);
      }, 180);
    }

    return { show };
  })();

  // -----------------------------
  // Clipboard
  // -----------------------------
  async function copyText(text) {
    if (typeof text !== 'string') text = String(text ?? '');

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }

  // -----------------------------
  // Persistence (per-tool, neutral)
  // -----------------------------
  function storageKey(toolKey) {
    return `clickoz:tool:${toolKey}:state:v${SHELL_VERSION}`;
  }

  function saveState(toolKey, state) {
    try {
      localStorage.setItem(storageKey(toolKey), JSON.stringify(state));
      return true;
    } catch { return false; }
  }

  function loadState(toolKey) {
    try {
      const raw = localStorage.getItem(storageKey(toolKey));
      return raw ? safeJsonParse(raw, null) : null;
    } catch { return null; }
  }

  function clearState(toolKey) {
    try { localStorage.removeItem(storageKey(toolKey)); } catch {}
  }

  // -----------------------------
  // FAQ accordion helper (optional)
  // -----------------------------
  function initFaq(root) {
    const qs = $$('.faq-q', root);
    if (!qs.length) return;

    qs.forEach(btn => {
      const item = btn.closest('.faq-item');
      const a = item?.querySelector('.faq-a');
      if (!a) return;

      if (!a.style.display) a.style.display = 'none';

      btn.addEventListener('click', () => {
        const open = a.style.display !== 'none';
        a.style.display = open ? 'none' : 'block';
      });
    });
  }

  // -----------------------------
  // Registry
  // -----------------------------
  const registry = new Map();
  const readyQueue = [];
  let domReady = false;

  // -----------------------------
  // Global actions: copy / clear / example / reset-storage
  // -----------------------------
  function hookGlobalActions(root, tool) {
    root.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;

      const action = el.getAttribute('data-action');

      if (action === 'copy') {
        const targetSel = el.getAttribute('data-copy-target');
        const target = targetSel ? $(targetSel, root) : null;
        const text = target ? (target.value ?? target.textContent ?? '') : '';

        try {
          await copyText(text);
          Toast.show('Copied to clipboard', { type: 'success' });
        } catch {
          Toast.show('Copy failed', { type: 'error' });
        }
      }

      if (action === 'clear') {
        try {
          tool?.clear?.();
          Toast.show('Cleared', { type: 'info' });

          const persist = tool?.persist ?? root.hasAttribute('data-persist');
          if (persist) clearState(tool.key);
        } catch {
          Toast.show('Clear failed', { type: 'error' });
        }
      }

      if (action === 'example') {
        try {
          const example = tool?.getExample?.();
          if (example && typeof tool?.hydrate === 'function') {
            tool.hydrate(example);
            Toast.show('Example loaded', { type: 'success' });
          } else {
            Toast.show('No example available', { type: 'warn' });
          }
        } catch {
          Toast.show('Could not load example', { type: 'error' });
        }
      }

      if (action === 'reset-storage') {
        clearState(tool.key);
        Toast.show('Saved state removed', { type: 'info' });
      }
    });
  }

  // -----------------------------
  // Tool init lifecycle
  // -----------------------------
  function initTool(tool) {
    const root = getToolRoot();
    const key = getToolKey(root);

    tool.key = key;

    // Keep skeleton visible until after init
    setLoading(root, true);

    initFaq(root);
    hookGlobalActions(root, tool);

    const persist = tool.persist ?? root.hasAttribute('data-persist');

    // Hydrate saved state (if any)
    if (persist && typeof tool.hydrate === 'function') {
      const saved = loadState(key);
      if (saved) {
        try { tool.hydrate(saved); } catch { /* ignore */ }
      }

      // Auto-save on input/change (if serialize exists)
      if (typeof tool.serialize === 'function') {
        const autoSave = debounce(() => {
          try {
            const state = tool.serialize();
            if (state) saveState(key, state);
          } catch { /* ignore */ }
        }, 220);

        root.addEventListener('input', autoSave);
        root.addEventListener('change', autoSave);
      }
    }

    try {
      tool.init?.(root);
    } catch (err) {
      console.error('[ClickozToolShell] tool init error', err);
      Toast.show('Tool initialization error', { type: 'error', ttl: 4200 });
    }

    setLoading(root, false);
  }

  // -----------------------------
  // Public API
  // -----------------------------
  function register(tool) {
    if (!tool || typeof tool !== 'object') {
      throw new Error('ClickozToolShell.register(tool) requires an object');
    }

    // Always neutral: key derived from HTML data-tool
    const root = getToolRoot();
    tool.key = getToolKey(root);

    registry.set(tool.key, tool);

    if (domReady) initTool(tool);
    return tool;
  }

  function ready(fn) {
    if (typeof fn !== 'function') return;
    if (domReady) fn();
    else readyQueue.push(fn);
  }

  function boot() {
    if (domReady) return;
    domReady = true;

    while (readyQueue.length) {
      try { readyQueue.shift()(); } catch {}
    }

    const root = getToolRoot();
    const key = getToolKey(root);

    const tool = registry.get(key);
    if (tool) initTool(tool);
    else setLoading(root, false); // no tool registered (still remove skeleton)
  }

  document.addEventListener('DOMContentLoaded', boot, { once: true });

  window.ClickozToolShell = {
    version: SHELL_VERSION,
    Toast,
    copyText,
    register,
    ready,
    loadState,
    saveState,
    clearState,
    utils: { $, $$, debounce }
  };
})();

