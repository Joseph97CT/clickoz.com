/* =========================================================
   Word Counter — UX upgrades (clarity + utilities + voice)
   (append at bottom)
========================================================= */

/* Make "Paste your text" feel like the main action */
.wc .field-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}
.wc .field-label::after{
  content:"Step 1: paste / type →";
  font-size: 12px;
  opacity: .70;
  font-weight: 900;
  letter-spacing: .01em;
}
@media (max-width:520px){
  .wc .field-label{ flex-direction:column; align-items:flex-start; }
  .wc .field-label::after{ content:"Step 1: paste or type below"; }
}

/* Stronger textarea focus ring + subtle hint glow */
.wc #inputText{
  box-shadow: 0 0 0 1px rgba(255,255,255,.06) inset;
}
.wc #inputText:focus{
  box-shadow:
    0 0 0 4px rgba(var(--accent-rgb), .12),
    0 0 0 1px rgba(var(--accent-rgb), .22) inset !important;
}

/* Examples clarity: show as "Step 0: quick samples" */
.wc .wc-examples{
  position: relative;
}
.wc .wc-examples::before{
  content:"Step 0: load a sample (optional)";
  display:block;
  margin: 0 0 8px;
  font-weight: 1000;
  font-size: 12px;
  letter-spacing: .02em;
  color: rgba(255,255,255,.72);
}

/* Make privacy callout full-width and easier to scan */
.wc .callout{
  width: 100%;
  padding: 14px;
  font-size: 14.5px;
  color: rgba(255,255,255,.82);
}
.wc .callout b{
  color: rgba(255,255,255,.92);
  font-weight: 1000;
}
.wc .callout a{
  color: rgba(255,255,255,.90);
  text-decoration:none;
  border-bottom:1px solid rgba(255,255,255,.16);
}

/* Voice section polish */
.wc .wc-voice-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
  margin-top: 10px;
}
.wc .wc-voice-select{
  min-width: 220px;
  max-width: 100%;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.92);
  padding: 0 10px;
  outline: none;
}
.wc .wc-voice-select:focus{
  border-color: rgba(var(--accent-rgb), .35);
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb), .10);
}

