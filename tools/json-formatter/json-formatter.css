/* ==========================================================================
   Clickoz — JSON Formatter (UTM Builder UI clone, scoped)
   File: /tools/json-formatter/json-formatter.css
   Version: v4
   Scope: body.jf only (so it won't affect other tools)
   ==========================================================================
   This file includes:
   - Tool hero (crumbs, title, kicker, mini-trust)
   - Tool panel + cards + fields + toggles + buttons (fallback if site.css changes)
   - Examples box, output boxes, preview, stats, related
   - SEO block (hero-box), lanes, FAQ, SEO intents, chips
   ========================================================================== */

:root{
  --jf-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  /* Glass / borders */
  --jf-bd: rgba(255,255,255,.08);
  --jf-bd2: rgba(255,255,255,.12);
  --jf-bg: rgba(255,255,255,.03);
  --jf-bg2: rgba(0,0,0,.22);
  --jf-tx: rgba(242,242,255,.88);
  --jf-tx2: rgba(242,242,255,.72);

  /* Shadows */
  --jf-sh: 0 10px 26px rgba(0,0,0,.25);
  --jf-sh2: 0 10px 26px rgba(0,0,0,.18);

  /* Accents fallback (site.js usually sets --accent) */
  --jf-accent: var(--accent, #06b6d4);
  --jf-accent2: var(--accent2, #22d3ee);
}

/* ---------- Safe resets (scoped) ---------- */
body.jf{
  color: var(--jf-tx);
}

body.jf a{
  color: rgba(242,242,255,.86);
  text-decoration: none;
}
body.jf a:hover{ text-decoration: underline; }

body.jf .container{
  width: min(1100px, calc(100% - 32px));
  margin-inline: auto;
}

/* Tool shell section spacing (matches UB) */
body.jf .tool-shell{
  padding-top: 22px;
  padding-bottom: 34px;
}

/* ---------- Hero / crumbs / title / kicker ---------- */
body.jf .tool-hero{
  padding: 14px 0 12px;
}

body.jf .crumbs{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--jf-tx2);
  margin-bottom: 12px;
}

body.jf .crumbs .sep{
  opacity: .55;
}

body.jf .section-title{
  font-size: clamp(28px, 4.6vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.6px;
  margin: 0 0 10px;
  font-weight: 1000;
}

body.jf .kicker{
  font-size: 15px;
  line-height: 1.65;
  color: rgba(242,242,255,.78);
  max-width: 72ch;
}

body.jf .kicker b{
  color: rgba(242,242,255,.92);
}

/* mini trust pills row */
body.jf .mini-trust{
  display:flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

body.jf .mini-pill{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 10px 26px rgba(0,0,0,.14);
  color: rgba(242,242,255,.82);
  font-size: 12.5px;
  font-weight: 900;
  letter-spacing: .15px;
}

/* ---------- Panel container (like UB tool-panel) ---------- */
body.jf .tool-panel{
  margin-top: 18px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 14px 40px rgba(0,0,0,.25);
}

@media (min-width: 980px){
  body.jf .tool-panel{
    padding: 18px;
  }
}

/* ---------- Stepbar ---------- */
body.jf .stepbar{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-bottom:14px;
}

body.jf .stepbadge{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-radius: 16px;
  background: var(--jf-bg);
  border: 1px solid var(--jf-bd);
  box-shadow: var(--jf-sh2);
  font-size: 13px;
  color: rgba(242,242,255,.82);
}

body.jf .stepbadge .tag{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  letter-spacing: .2px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
}

/* ---------- Main grid ---------- */
body.jf .tool-grid{
  display:grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items:start;
}

@media (min-width: 980px){
  body.jf .tool-grid{
    grid-template-columns: 1.25fr .92fr;
  }
}

/* ---------- Cards used inside tool area ---------- */
body.jf .jf-ex,
body.jf .jf-preview,
body.jf .jf-stat,
body.jf .rel-box{
  background: var(--jf-bg);
  border: 1px solid var(--jf-bd);
  box-shadow: var(--jf-sh);
}

/* ---------- Examples box ---------- */
body.jf .jf-examples{ margin-bottom: 14px; }

body.jf .jf-ex{
  padding: 14px;
  border-radius: 18px;
}

body.jf .jf-ex h3{
  margin: 0 0 10px;
  font-size: 14px;
  letter-spacing: .2px;
  font-weight: 1000;
}

body.jf .jf-ex pre{
  margin:0;
  padding: 12px;
  border-radius: 14px;
  background: var(--jf-bg2);
  border: 1px solid rgba(255,255,255,.08);
  color: rgba(242,242,255,.80);
  font-family: var(--jf-mono);
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  min-height: 74px;
}

body.jf .jf-ex-actions{
  display:flex;
  gap:10px;
  margin-top: 10px;
  flex-wrap:wrap;
}

/* ---------- Fields / labels / hint ---------- */
body.jf .field{
  margin-bottom: 14px;
}

body.jf .field-label{
  display:block;
  font-size: 13px;
  font-weight: 1000;
  letter-spacing: .15px;
  margin-bottom: 8px;
  color: rgba(242,242,255,.92);
}

body.jf .hint{
  font-size: 13px;
  line-height: 1.55;
  margin-top: 8px;
  color: rgba(242,242,255,.68);
}

/* Inputs */
body.jf .input,
body.jf .select,
body.jf textarea{
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  color: rgba(242,242,255,.88);
  outline: none;
  box-shadow: 0 10px 26px rgba(0,0,0,.16);
}

body.jf .input,
body.jf textarea{
  padding: 12px 12px;
  font-size: 14px;
}

body.jf .select{
  padding: 10px 12px;
  font-size: 14px;
  appearance: none;
}

body.jf .input:focus,
body.jf .select:focus,
body.jf textarea:focus{
  border-color: rgba(255,255,255,.18);
  box-shadow: 0 0 0 3px rgba(6,182,212,.16), 0 10px 26px rgba(0,0,0,.18);
}

/* Textareas (json) */
body.jf textarea.jf-in,
body.jf textarea.jf-out{
  min-height: 260px;
  resize: vertical;
  font-family: var(--jf-mono);
  line-height: 1.6;
  tab-size: 2;
}

@media (min-width: 980px){
  body.jf textarea.jf-in,
  body.jf textarea.jf-out{
    min-height: 360px;
  }
}

/* Wrap mode on output */
body.jf.is-wrap textarea.jf-out{
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* ---------- Options grid ---------- */
body.jf .jf-options{
  display:grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 12px;
}

@media (min-width: 720px){
  body.jf .jf-options{
    grid-template-columns: 1fr 1.2fr;
    align-items:start;
  }
}

/* Toggles */
body.jf .toggle{
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
}

body.jf .toggle input[type="checkbox"]{
  width: 18px;
  height: 18px;
  accent-color: var(--jf-accent);
}

body.jf .toggle span{
  font-size: 13px;
  color: rgba(242,242,255,.78);
  font-weight: 900;
  letter-spacing: .12px;
}

/* ---------- Buttons (UB style fallback) ---------- */
body.jf .btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.04);
  color: rgba(242,242,255,.88);
  font-weight: 1000;
  letter-spacing: .12px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: transform .06s ease, background .2s ease, border-color .2s ease, opacity .2s ease;
}

body.jf .btn:hover{
  background: rgba(255,255,255,.06);
  border-color: rgba(255,255,255,.14);
}

body.jf .btn:active{
  transform: translateY(1px);
}

body.jf .btn.primary{
  background: linear-gradient(180deg, rgba(6,182,212,.35), rgba(6,182,212,.18));
  border-color: rgba(6,182,212,.35);
  box-shadow: 0 0 0 3px rgba(6,182,212,.14), 0 14px 34px rgba(0,0,0,.20);
}

body.jf .btn.primary:hover{
  background: linear-gradient(180deg, rgba(34,211,238,.38), rgba(6,182,212,.18));
  border-color: rgba(34,211,238,.40);
}

body.jf .btn.ghost{
  background: rgba(0,0,0,.12);
  border-color: rgba(255,255,255,.10);
}

/* Actions row */
body.jf .tool-actions{
  display:flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

/* ---------- Right column sticky wrapper (like UB ub-out-wrap) ---------- */
body.jf .jf-out-wrap{
  position: sticky;
  top: 92px;
}
@media (max-width: 979px){
  body.jf .jf-out-wrap{
    position: static;
    top: auto;
  }
}

/* ---------- Status pill ---------- */
body.jf .pill{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  letter-spacing: .2px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(242,242,255,.82);
}

body.jf .pill.ok{
  border-color: rgba(0,255,160,.22);
  background: rgba(0,255,160,.10);
  color: rgba(220,255,245,.92);
}
body.jf .pill.bad{
  border-color: rgba(255,90,90,.26);
  background: rgba(255,90,90,.10);
  color: rgba(255,230,230,.92);
}

/* ---------- Error box under output ---------- */
body.jf .jf-error{
  margin-top: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,90,90,.08);
  border: 1px solid rgba(255,90,90,.18);
  color: rgba(255,235,235,.92);
  font-size: 13px;
  line-height: 1.55;
}

body.jf .jf-error code{
  display:block;
  margin-top: 10px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.08);
  color: rgba(242,242,255,.82);
  font-family: var(--jf-mono);
  white-space: pre-wrap;
  overflow-wrap:anywhere;
}

/* ---------- Preview box (UB-like preview) ---------- */
body.jf .jf-preview{
  margin-top: 12px;
  padding: 12px;
  border-radius: 18px;
}

body.jf .jf-preview .row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

body.jf .jf-preview code{
  font-family: var(--jf-mono);
  font-size: 12.5px;
  opacity: .92;
  background: rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.08);
  padding: 6px 10px;
  border-radius: 999px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- Stats grid ---------- */
body.jf .jf-stats{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

body.jf .jf-stat{
  padding: 12px;
  border-radius: 18px;
}

body.jf .jf-stat .label{
  font-size: 12px;
  opacity: .72;
  margin-bottom: 6px;
}

body.jf .jf-stat .value{
  font-size: 18px;
  font-weight: 1000;
  letter-spacing: .2px;
  font-variant-numeric: tabular-nums;
}

/* ---------- Related boxes ---------- */
body.jf .related{
  display:grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 14px;
}

@media (min-width: 720px){
  body.jf .related{
    grid-template-columns: 1fr 1fr;
  }
}

body.jf .rel-box{
  padding: 14px;
  border-radius: 18px;
}

body.jf .rel-box h4{
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 1000;
}

body.jf .rel-links{
  display:flex;
  flex-direction:column;
  gap: 8px;
}

body.jf .rel-links a{
  color: rgba(242,242,255,.84);
}

/* ---------- Callout (privacy note) ---------- */
body.jf .callout{
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(6,182,212,.08);
  border: 1px solid rgba(6,182,212,.18);
  box-shadow: 0 10px 26px rgba(0,0,0,.16);
  color: rgba(242,242,255,.82);
  line-height: 1.6;
  font-size: 13.5px;
}

body.jf .callout b{
  color: rgba(242,242,255,.92);
}

/* ---------- SEO block (hero-box seo-block) ---------- */
body.jf .hero-box.seo-block{
  margin-top: 18px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 14px 40px rgba(0,0,0,.22);
}

body.jf .hero-box.seo-block h2{
  margin: 0 0 10px;
  font-size: 22px;
  letter-spacing: -0.2px;
  font-weight: 1000;
}

body.jf .hero-box.seo-block h3{
  margin: 16px 0 10px;
  font-size: 16px;
  font-weight: 1000;
  letter-spacing: .1px;
  color: rgba(242,242,255,.92);
}

body.jf .hero-box.seo-block p{
  margin: 0 0 10px;
  color: rgba(242,242,255,.78);
  line-height: 1.7;
}

/* ---------- Lanes (4 cards) ---------- */
body.jf .lanes{
  display:grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 12px;
}

@media (min-width: 980px){
  body.jf .lanes{
    grid-template-columns: 1fr 1fr;
  }
}

body.jf .lane{
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 10px 26px rgba(0,0,0,.18);
}

body.jf .lane-head{
  display:flex;
  align-items:center;
  gap: 10px;
  margin-bottom: 8px;
}

body.jf .lane-ico{
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.10);
  box-shadow: 0 10px 26px rgba(0,0,0,.12);
}

body.jf .lane h3{
  margin: 0;
  font-size: 14.5px;
  font-weight: 1000;
}

body.jf .lane p{
  margin: 0;
  color: rgba(242,242,255,.76);
  line-height: 1.65;
  font-size: 13.5px;
}

/* ---------- FAQ ---------- */
body.jf .faq{
  display:grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
}

body.jf .faq-item{
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 10px 26px rgba(0,0,0,.16);
}

body.jf .faq-q{
  font-weight: 1000;
  letter-spacing: .12px;
  color: rgba(242,242,255,.92);
  margin-bottom: 8px;
}

body.jf .faq-a{
  color: rgba(242,242,255,.74);
  line-height: 1.65;
  font-size: 13.5px;
}

/* ---------- SEO intents (2 cards) ---------- */
body.jf .seo-intent{
  display:grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 14px;
}

@media (min-width: 980px){
  body.jf .seo-intent{
    grid-template-columns: 1fr 1fr;
  }
}

body.jf .seo-card{
  padding: 14px;
  border-radius: 20px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 10px 26px rgba(0,0,0,.16);
}

body.jf .seo-card h4{
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 1000;
}

body.jf .seo-card p{
  margin: 0;
  color: rgba(242,242,255,.72);
  line-height: 1.6;
  font-size: 13.5px;
}

/* Chips grid */
body.jf .qgrid{
  display:flex;
  flex-wrap:wrap;
  gap: 10px;
  margin-top: 10px;
}

body.jf .qchip{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 1000;
  letter-spacing: .15px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.10);
  color: rgba(242,242,255,.78);
  line-height: 1;
  user-select: none;
  transition: background .2s ease, border-color .2s ease, transform .06s ease;
}

body.jf .qchip:hover{
  background: rgba(255,255,255,.06);
  border-color: rgba(255,255,255,.14);
  color: rgba(242,242,255,.90);
}

body.jf .qchip:active{
  transform: translateY(1px);
}

/* Meta note */
body.jf .meta-note{
  margin-top: 16px;
  font-size: 13px;
  color: rgba(242,242,255,.62);
}

/* ---------- Small helpers ---------- */
body.jf .muted{ opacity: .72; }

