const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ORIGIN, CSP: csp, PERMISSIONS_POLICY, asset } = require("./cms-config");
const { BRAND, INDEX_ROBOTS, iconLinks, logoMarkup, publisherNode } = require("./brand-assets");

const root = path.resolve(__dirname, "..");
const registryCode = fs.readFileSync(path.join(root, "assets", "cms-registry.js"), "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(registryCode, ctx);
const cms = ctx.window.ClickozCMS;

/**
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, tool: string }} CmsGuide
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, relatedTools?: string[], relatedGuides?: string[], canonicalSlug?: string }} CmsTool
 */

const cat = {
  seo: {
    label: "SEO workflow", icon: "SEO", visual: "seo",
    problem: "The page may be published, but it does not clearly answer search intent or guide the visitor to the next step.",
    cause: "Most SEO issues come from vague intent, weak snippets, repeated keywords, missing internal links or content that explains a topic without helping the user act.",
    avoid: "Do not chase one magic number. Prioritize intent match, clarity, useful structure and internal links.",
    primary: ["Map the searcher need", "Improve the visible snippet", "Add a clear next step"],
    alternatives: [
      ["If the page is thin", "Expand the section that answers the exact user task before adding keyword variants."],
      ["If the snippet is weak", "Rewrite the title and description before editing the whole article."],
      ["If users leave", "Add links to the matching tool and a related guide near the moment of need."]
    ]
  },
  writing: {
    label: "Writing workflow", icon: "TXT", visual: "writing",
    problem: "The draft contains the right idea, but it feels too long, unclear or hard to scan on mobile.",
    cause: "Writing usually fails because the structure is unclear: long sentences, weak first paragraph, mixed intent, repeated filler or no obvious next step.",
    avoid: "Do not polish every sentence at once. Fix structure first, then length, then wording.",
    primary: ["Measure the draft", "Simplify the structure", "Check the final scan"],
    alternatives: [
      ["If the text is too long", "Cut repeated examples and split one dense paragraph into two smaller blocks."],
      ["If the text is too short", "Add missing context, examples, use cases and a small FAQ instead of filler."],
      ["If it reads flat", "Improve headings, transitions and the first sentence of each section."]
    ]
  },
  dev: {
    label: "Developer workflow", icon: "DEV", visual: "dev",
    problem: "A payload, URL, token or markup snippet looks correct, but breaks when copied into a real environment.",
    cause: "Developer utility problems often come from invisible characters, wrong encoding context, malformed JSON, unsafe escaping or confusing transport formats.",
    avoid: "Do not guess from appearance. Validate the exact input, inspect the transformed output and copy only after checking context.",
    primary: ["Paste exact input", "Validate or transform", "Copy with context"],
    alternatives: [
      ["If syntax fails", "Use the formatter first and read the exact error instead of rewriting randomly."],
      ["If a URL breaks", "Encode values, not the whole URL, then compare the query string."],
      ["If a token is confusing", "Decode only for inspection and never treat encoding as encryption."]
    ]
  },
  tracking: {
    label: "Tracking workflow", icon: "UTM", visual: "tracking",
    problem: "Campaign links exist, but analytics becomes messy because naming, source or medium choices are inconsistent.",
    cause: "Tracking problems usually start before launch: unclear naming conventions, unencoded URLs, duplicate campaign names or links pasted in the wrong place.",
    avoid: "Do not create campaign names on the fly. Decide a naming system before publishing.",
    primary: ["Define source and medium", "Build the tracked URL", "Test before publishing"],
    alternatives: [
      ["If reports are messy", "Standardize source, medium and campaign naming before building more links."],
      ["If links break", "Encode parameters and check the final URL before posting."],
      ["If attribution is unclear", "Create separate links for description, bio, pinned comment and newsletter."]
    ]
  },
  youtube: {
    label: "YouTube workflow", icon: "YT", visual: "youtube",
    problem: "The video may be good, but the title, thumbnail and description do not make the reason to click obvious enough.",
    cause: "Creator pages underperform when title, thumbnail, description, hashtags and tracking are treated as separate tasks instead of one upload system.",
    avoid: "Do not optimize tags before the title and thumbnail promise is clear.",
    primary: ["Define the click promise", "Prepare the upload", "Guide viewers to the next step"],
    alternatives: [
      ["If the idea is unclear", "Write five title angles before building the thumbnail brief."],
      ["If discovery is weak", "Use hashtags and description lines as labels, not as spam."],
      ["If clicks are not tracked", "Use separate UTM links for description, pinned comment and social reposts."]
    ]
  },
  creator: {
    label: "Creator system", icon: "CR", visual: "creator",
    problem: "Content is created one piece at a time, so ideas, uploads and follow-up posts are hard to repeat consistently.",
    cause: "Creator workflows become fragile when planning, packaging, community posts and tracking are not connected.",
    avoid: "Do not plan uploads without planning the follow-up action.",
    primary: ["Plan the content lane", "Prepare each piece", "Measure the follow-up"],
    alternatives: [
      ["If posting feels random", "Create a weekly lane for long video, short clip, community post and link tracking."],
      ["If engagement drops", "Use polls, teasers and follow-up posts tied to the upload topic."],
      ["If ideas dry up", "Turn one video into titles, shorts, comments, posts and newsletter angles."]
    ]
  }
};

const specific = {
  "word-counter": {
    toolUse: "Paste the draft and inspect words, paragraphs, sentence length and reading time before deciding whether to cut or expand.",
    output: "A clear length target based on the page purpose, not a generic word-count rule.",
    example: ["Weak: the article is short because someone said 600 words is enough.", "Better: the page answers the exact query, covers objections and uses short sections.", "Premium: the guide includes examples, FAQs, internal links and a measurable next step."]
  },
  "readability-analyzer": {
    toolUse: "Run the draft, identify dense sentences and rewrite the sections that slow mobile scanning.",
    output: "A page that feels easier to read without losing expertise.",
    example: ["Weak: long paragraphs with no visual rhythm.", "Better: clear headings, shorter sentences and direct examples.", "Premium: the user understands the task quickly and knows what to do next."]
  },
  "meta-tags": {
    toolUse: "Write the title and description, compare length and click intent, then copy only after the snippet explains the page value.",
    output: "A SERP-ready title and description aligned with the user query.",
    example: ["Weak: a title stuffed with every keyword.", "Better: one clear promise plus a natural modifier.", "Premium: title, description, H1 and first section all support the same intent."]
  },
  "serp-preview": {
    toolUse: "Preview title, URL and description together so the imagined snippet matches what users may see.",
    output: "A cleaner snippet with less truncation and stronger click context.",
    example: ["Weak: a description that repeats the title.", "Better: a description that explains the benefit and next step.", "Premium: the snippet sets the exact expectation the page fulfills."]
  },
  "keyword-density": {
    toolUse: "Check repeated terms, then replace mechanical repetition with natural variants and supporting phrases.",
    output: "Balanced wording that covers the topic without stuffing.",
    example: ["Weak: the same keyword repeated in every paragraph.", "Better: synonyms, examples and intent-matching language.", "Premium: the page reads naturally and still signals the topic clearly."]
  },
  "slug-generator": {
    toolUse: "Generate a clean slug, remove filler words and keep only the durable page concept.",
    output: "A short URL that stays readable after the page grows.",
    example: ["Weak: /best-free-online-super-seo-tool-for-everyone-now/", "Better: /seo-content-checklist/", "Premium: the URL, title and internal links all describe the same page."]
  },
  "json-formatter": {
    toolUse: "Paste the exact JSON, format it, read the error and fix the smallest broken part first.",
    output: "Valid JSON with readable indentation and fewer copy errors.",
    example: ["Weak: guessing where the comma should go.", "Better: validate, locate the line and repair syntax.", "Premium: copy a clean payload and document what changed."]
  },
  "url-encoder": {
    toolUse: "Encode only the parameter value that needs protection, then inspect the final URL.",
    output: "A safer URL or query string that does not break when shared.",
    example: ["Weak: pasting spaces and symbols directly into a URL.", "Better: encode parameter values.", "Premium: combine encoded values with consistent tracking names."]
  },
  "base64": {
    toolUse: "Decode payloads for inspection, or encode text for transport when the context requires it.",
    output: "Readable payload insight without confusing encoding with security.",
    example: ["Weak: treating Base64 as encryption.", "Better: decode and inspect safely.", "Premium: understand when Base64URL is required for tokens."]
  },
  "entity-encoder": {
    toolUse: "Encode or decode characters that would otherwise break HTML or display incorrectly.",
    output: "Markup-safe text that preserves the intended characters.",
    example: ["Weak: pasting raw angle brackets into content.", "Better: escape unsafe characters.", "Premium: choose encoding or escaping based on output context."]
  },
  "utm-builder": {
    toolUse: "Build the campaign URL with consistent source, medium and campaign naming before publishing.",
    output: "A trackable URL that stays readable in analytics.",
    example: ["Weak: every campaign uses a different naming style.", "Better: source, medium and campaign follow one convention.", "Premium: each platform placement has its own measurable link."]
  },
  "youtube-title-generator": {
    toolUse: "Generate title angles, then choose the one that matches the thumbnail promise and viewer intent.",
    output: "A title direction that is clear enough to package and test.",
    example: ["Weak: a clever title nobody understands.", "Better: clear promise with curiosity.", "Premium: title and thumbnail answer the same click question."]
  },
  "youtube-description-generator": {
    toolUse: "Build first lines, chapters, links and CTA blocks in the order viewers actually scan.",
    output: "A useful description that supports search, viewers and conversion.",
    example: ["Weak: random links before context.", "Better: first lines explain value, then chapters and links.", "Premium: every link is trackable and placed with intent."]
  },
  "youtube-hashtag-generator": {
    toolUse: "Generate a small, relevant hashtag mix and keep the description readable.",
    output: "Focused tags that label the topic without looking spammy.",
    example: ["Weak: twenty broad hashtags.", "Better: 3-5 specific tags.", "Premium: tags match the video angle, niche and description."]
  },
  "community-post-generator": {
    toolUse: "Turn an upload into a poll, teaser or follow-up prompt that keeps the topic alive.",
    output: "A community post connected to a real content goal.",
    example: ["Weak: posting only 'new video out'.", "Better: ask a question tied to the video problem.", "Premium: post, pinned comment and next upload reinforce each other."]
  }
};

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function clipMeta(value, limit = 158) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const clean = cut.slice(0, Math.max(0, cut.lastIndexOf(" "))).replace(/[,.:-]+$/, "");
  return clean || cut.trim();
}

function toolFor(guide) {
  return cms.toolBySlug[guide.tool] || cms.tools[0];
}

function relatedGuides(guide) {
  const tool = toolFor(guide);
  const direct = (tool.relatedGuides || []).filter((slug) => slug !== guide.slug);
  const sameCat = cms.guides.filter((item) => item.category === guide.category && item.slug !== guide.slug).map((item) => item.slug);
  return [...new Set([...direct, ...sameCat])].slice(0, 5).map((slug) => cms.guideBySlug[slug]).filter(Boolean);
}

function relatedTools(guide) {
  const tool = toolFor(guide);
  return [tool.slug, ...(tool.relatedTools || [])].slice(0, 5).map((slug) => cms.toolBySlug[slug]).filter(Boolean);
}

function specFor(tool) {
  return specific[tool.canonicalSlug] || specific[tool.slug] || {
    toolUse: `Open ${tool.title}, test real input and copy the result only after checking the output.`,
    output: "A practical result that helps the user finish the current task.",
    example: ["Weak: explaining the topic without helping the reader finish the task.", "Better: apply the tool to real input.", "Premium: connect the result to the next guide or tool."]
  };
}

function guideFocus(guide, tool, cluster) {
  const map = {
    "how-to-write-meta-title-description": ["Snippet writing", "Turn a rough page promise into a title and description users can understand before clicking.", "A title, description and first screen that all communicate the same useful promise."],
    "meta-tags-length": ["Length control", "Fix truncation risk without reducing the snippet to empty keyword fragments.", "A snippet that stays readable inside common title and description limits."],
    "meta-tags-checklist": ["Publishing audit", "Check the full metadata routine before the page goes live.", "A practical pre-publish checklist with no fake ranking promises."],
    "serp-preview": ["Visual preview", "See title, URL and description together before pushing the page live.", "A cleaner search result preview with a visible next edit."],
    "serp-snippet-ctr": ["CTR testing", "Improve click clarity without drifting into clickbait.", "A testable snippet angle that still matches the real page."],
    "keyword-density-explained": ["Topic diagnosis", "Use repeated terms as a signal, not as a mechanical ranking target.", "A natural wording plan with variants, examples and supporting phrases."],
    "keyword-variations": ["Intent coverage", "Expand the topic with adjacent phrases that help the reader, not keyword stuffing.", "A page outline that covers the real search intent more completely."],
    "seo-content-checklist": ["Whole-page audit", "Review intent, structure, internal links, trust and the next step in one pass.", "A page that is ready to publish because the workflow is complete."],
    "slug-best-practices": ["URL durability", "Create a slug that will still make sense after the page changes.", "A short URL that matches the title and internal link wording."],
    "internal-linking-tools-sites": ["Discovery flow", "Connect tools and guides so users do not hit dead ends.", "A linked path from problem to tool to next useful page."],
    "core-web-vitals-tools-sites": ["Performance trust", "Keep interactive pages fast, stable and usable on mobile.", "A tool page that feels responsive before the user reads the copy."],
    "readability-for-seo": ["Search readability", "Make SEO copy easier to scan without flattening expertise.", "A draft with shorter paragraphs, clearer headings and useful examples."],
    "readability-score": ["Score interpretation", "Turn a readability number into practical edits.", "A rewrite plan that explains exactly what to shorten or restructure."],
    "readability-for-ranking": ["Helpful content clarity", "Use clarity to support search usefulness instead of chasing a score.", "A page that reads fast and still answers the query with depth."],
    "word-count-for-seo": ["Length decision", "Choose page depth from intent and usefulness, not arbitrary word-count targets.", "A content length plan based on the task the page must finish."],
    "content-brief-template": ["Brief building", "Turn intent into a usable page outline before writing.", "A brief with audience, sections, examples, FAQ and next step."],
    "text-cleanup-workflow": ["Paste cleanup", "Normalize messy text before editing the message itself.", "Clean copy that can move into a CMS, doc, post or email without broken spacing."],
    "json-formatter-online": ["JSON inspection", "Format and inspect payloads without losing the original debugging context.", "A readable JSON payload plus the reason it is safe to copy."],
    "json-formatting-debug": ["Error repair", "Find the smallest broken part before rewriting a payload.", "A focused debugging routine for invalid JSON."],
    "url-encoding": ["Concept guide", "Understand why URLs break when characters move between contexts.", "A mental model for encoding values, not entire workflows blindly."],
    "url-encoding-basics": ["Quick encoding fix", "Encode a pasted value safely before it enters a URL.", "A query-safe value and a short rule for when to use it."],
    "url-encoding-explained": ["Practical repair", "Fix broken links, spaces and symbols in real parameters.", "A repaired URL value with the original problem explained."],
    "query-string-best-practices": ["Parameter hygiene", "Keep query strings readable, encoded and measurable.", "A naming and encoding routine that survives analytics."],
    "base64-decode": ["Decode inspection", "Decode payloads only to understand what is inside.", "Readable content plus a safety note that it is not encryption."],
    "base64-encode-decode": ["Transport format", "Choose encode or decode based on the data movement task.", "A clear before/after result for payload transport."],
    "base64url-vs-base64": ["Token-safe encoding", "Understand why tokens use URL-safe characters.", "A decision rule for Base64 vs Base64URL."],
    "debugging-tokens": ["Token debugging", "Inspect token-like strings without exposing or trusting secrets.", "A safer inspection routine with context and caution."],
    "jwt-basics": ["JWT anatomy", "Understand header, payload and signature at a practical level.", "A basic JWT reading workflow without false security claims."],
    "html-entities": ["Character safety", "Encode special characters without breaking displayed text.", "Markup-safe text that preserves the intended meaning."],
    "encoding-vs-escaping": ["Context decision", "Choose the right transformation for URL, HTML, token or payload contexts.", "A rule for avoiding the wrong kind of fix."],
    "fix-broken-html": ["Markup repair", "Repair unsafe characters and escaped text before it enters a page.", "A safer snippet and a readable decoded version."],
    "fix-broken-utm-parameters": ["Tracking repair", "Diagnose links before messy campaign data reaches analytics.", "A fixed campaign URL and the naming issue that caused it."],
    "utm-builder-guide": ["Link building", "Create a campaign URL with consistent source, medium and campaign naming.", "A clean UTM link ready for one exact placement."],
    "utm-best-practices": ["Naming system", "Define conventions before links multiply across channels.", "A repeatable tracking vocabulary for campaigns and creators."],
    "instagram-bio-utm": ["Profile tracking", "Measure bio clicks without mixing them with other placements.", "A separate profile link with readable analytics labels."],
    "youtube-tracking-links": ["Upload attribution", "Track description, pinned comment and social clicks separately.", "A set of links that shows where viewer action came from."],
    "youtube-title-thumbnail-checklist": ["Click promise", "Make title and thumbnail communicate the same reason to watch.", "A packaging checklist before upload."],
    "youtube-description-template": ["Upload support", "Write descriptions that help viewers, search and links in the right order.", "A description structure with first lines, chapters, links and CTA."],
    "youtube-hashtags-guide": ["Hashtag restraint", "Use hashtags as labels instead of stuffing.", "A short relevant hashtag set tied to the video angle."],
    "youtube-community-post-ideas": ["Retention loop", "Turn one upload into follow-up posts, polls and questions.", "A community post connected to a real viewer action."],
    "creator-content-calendar": ["Creator system", "Plan long videos, short clips, posts and tracking as one weekly routine.", "A repeatable content lane instead of isolated ideas."]
  };
  const item = map[guide.slug] || [cluster.label, `Use ${tool.title} with real input and turn the guide into an action, not a passive read.`, "A practical next step connected to a tool, guide or workflow."];
  return { role: item[0], job: item[1], deliverable: item[2] };
}

function page(guide) {
  const tool = toolFor(guide);
  const cluster = cat[guide.category] || cat[tool.category] || cat.seo;
  const spec = specFor(tool);
  const focus = guideFocus(guide, tool, cluster);
  const relatedT = relatedTools(guide);
  const relatedG = relatedGuides(guide);
  const title = `${guide.title} | Clickoz Guide`;
  const desc = clipMeta(`${guide.description} See the Clickoz workflow, common mistakes, checklist and next step.`);
  const url = `${ORIGIN}${guide.url}`;
  const visual = `/assets/img/guides/${cluster.visual}.svg`;
  const alt1 = cluster.alternatives[0];
  const alt2 = cluster.alternatives[1];
  const alt3 = cluster.alternatives[2];
  const faq = [
    [`What problem does ${guide.title} solve?`, `${guide.title} helps when ${cluster.problem.toLowerCase()} It pairs the explanation with a working Clickoz tool so you can test the fix immediately.`],
    [`Which Clickoz tool should I use with this guide?`, `Start with ${tool.title}. ${spec.toolUse}`],
    ["What should I do if the first workflow does not fit?", `Use the alternatives section. ${alt1[1]} ${alt2[1]}`]
  ];
  const howSteps = [
    ["Define the real problem", cluster.problem],
    [`Open ${tool.title}`, spec.toolUse],
    ["Compare alternatives", `${alt1[1]} ${alt2[1]}`],
    ["Finish with a next step", `Copy the useful output, then continue with ${relatedG[0]?.title || "a related guide"} or ${relatedT[1]?.title || "a related tool"}.`]
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="${PERMISSIONS_POLICY}" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="${INDEX_ROBOTS}" />
  <meta name="googlebot" content="${INDEX_ROBOTS}" />
  <meta name="application-name" content="${BRAND.name}" />
  <meta name="apple-mobile-web-app-title" content="${BRAND.name}" />
  <meta name="theme-color" content="${BRAND.themeColor}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${ORIGIN}${visual}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${esc(title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${ORIGIN}${visual}" />
  <meta name="twitter:image:alt" content="${esc(title)}" />
  ${iconLinks()}
  <script>(function(){try{var s=JSON.parse(localStorage.getItem("clickoz_accent")||"null");var a=s&&s.a1?s.a1:"#9b8cff";var b=s&&s.a2?s.a2:"#d6ccff";var h=String(a).replace("#","");var r="155,140,255";if(h.length===3)r=[h[0]+h[0],h[1]+h[1],h[2]+h[2]].map(function(x){return parseInt(x,16)}).join(",");if(h.length===6)r=[h.slice(0,2),h.slice(2,4),h.slice(4,6)].map(function(x){return parseInt(x,16)}).join(",");document.documentElement.style.setProperty("--accent",a);document.documentElement.style.setProperty("--accent2",b);document.documentElement.style.setProperty("--accent-rgb",r);document.documentElement.style.setProperty("--cz-accent",a);document.documentElement.style.setProperty("--cz-accent2",b);document.documentElement.style.setProperty("--cz-accent-rgb",r)}catch(e){}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${asset("/assets/site.css", "siteCss")}" />
  <link rel="stylesheet" href="${asset("/assets/guide.css", "guideCss")}" />
  <link rel="stylesheet" href="${asset("/assets/guide-premium.css", "guidePremiumCss")}" />
  <link rel="stylesheet" href="${asset("/assets/clickoz-premium.css", "clickozPremiumCss")}" />
  <link rel="stylesheet" href="${asset("/assets/cms-final.css", "cmsFinal")}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: `${ORIGIN}${visual}`,
    author: { "@type": "Organization", name: "Clickoz" },
    publisher: publisherNode(ORIGIN),
    mainEntityOfPage: url,
    dateModified: "2026-05-19"
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${guide.title} workflow`,
    description: guide.description,
    step: howSteps.map(([name, text], index) => ({ "@type": "HowToStep", position: index + 1, name, text }))
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
  })}</script>
</head>
<body class="bigtext page-guide">
  <div id="clickozParticles" aria-hidden="true"></div>
  <canvas id="spaceParticles" aria-hidden="true"></canvas>
  <div class="__grain" aria-hidden="true"></div>
  <nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home">${logoMarkup()}</a>
      <div class="nav-links" aria-label="Sections"><a href="/">Home</a><a href="/tools/">Tools</a><a href="/guides/" class="active" aria-current="page">Guides</a><a href="/updates/">Updates</a></div>
      <div class="spacer"></div>
    </div>
  </nav>

  <main class="guide-article container">
    <article class="guide-shell">
      <header class="guide-premium-hero">
        <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/guides/">Guides</a><span>/</span><span>${esc(guide.title)}</span></nav>
        <div class="guide-hero-grid">
          <div class="guide-hero-text">
            <p class="guide-kicker">${esc(cluster.label)}</p>
            <h1>${esc(guide.title)}</h1>
            <p class="guide-lead">${esc(guide.description)} Use this as a working routine: diagnose the blocker, run the right tool, compare the output and finish with a clear next step.</p>
            <div class="guide-intent-row">
              <span>${cluster.icon} Problem-led</span>
              <span>Tool-connected</span>
              <span>Checklist-ready</span>
              <span>Internal next step</span>
            </div>
            <div class="premium-link-grid">
              ${relatedT.map((item) => `<a href="${item.url}">${esc(item.title)}</a>`).join("")}
            </div>
            <div class="guide-action-strip" aria-label="${esc(guide.title)} fast actions">
              <a class="guide-action-primary" href="${tool.url}">Open ${esc(tool.title)}</a>
              <a href="${relatedT[1]?.url || "/tools/"}">Next tool</a>
              <a href="${relatedG[0]?.url || "/guides/"}">Related guide</a>
            </div>
          </div>
          <aside class="guide-visual-card" aria-label="${esc(guide.title)} visual workflow">
            <div class="guide-visual-icon" aria-hidden="true">${cluster.icon}</div>
            <img class="guide-visual-inline" src="${visual}" alt="${esc(guide.title)} workflow visual" loading="eager" />
            <div class="guide-visual-steps">
              <span><b>01</b> Identify the blocker</span>
              <span><b>02</b> Run ${esc(tool.title)}</span>
              <span><b>03</b> Apply the checklist</span>
            </div>
          </aside>
        </div>
      </header>

      <section class="guide-block guide-tutorial-map">
        <h2>Tutorial path</h2>
        <p>Follow this guide in order. The goal is not to read every tip; the goal is to finish one real task with ${esc(tool.title)} and know what to do next.</p>
        <ol class="guide-tutorial-steps">
          <li><b>Diagnose</b><span>${esc(focus.job)}</span></li>
          <li><b>Use the tool</b><span>${esc(spec.toolUse)}</span></li>
          <li><b>Check the result</b><span>${esc(spec.output)}</span></li>
          <li><b>Continue</b><span>Move to ${esc(relatedT[1]?.title || "the next related tool")} or ${esc(relatedG[0]?.title || "a related guide")} while the context is still fresh.</span></li>
        </ol>
      </section>

      <section class="guide-block">
        <h2>What you are trying to fix</h2>
        <p>${esc(cluster.problem)} This guide turns "${esc(guide.title)}" into a repeatable action instead of another abstract topic.</p>
        <div class="guide-problem-grid">
          <div class="guide-problem-card"><span class="mark">A</span><strong>Typical symptom</strong><span>${esc(cluster.cause)}</span></div>
          <div class="guide-problem-card"><span class="mark">B</span><strong>What good looks like</strong><span>${esc(spec.output)}</span></div>
          <div class="guide-problem-card"><span class="mark">C</span><strong>What to avoid</strong><span>${esc(cluster.avoid)}</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Diagnose before changing anything</h2>
        <p>First, name the blocker. This keeps the workflow focused and stops extra copy, metadata or UI from hiding the real issue.</p>
        <div class="guide-problem-grid">
          <div class="guide-problem-card"><span class="mark">1</span><strong>Context</strong><span>Where will this be used: Google result, mobile page, creator upload, campaign link or technical payload?</span></div>
          <div class="guide-problem-card"><span class="mark">2</span><strong>Constraint</strong><span>What is limiting the result: length, clarity, intent, platform format, escaping, tracking or trust?</span></div>
          <div class="guide-problem-card"><span class="mark">3</span><strong>Next step</strong><span>Pick one tool, run it on real input, then compare the output against the problem before copying.</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Define the finished result</h2>
        <p>This page has a specific role inside Clickoz, so it does not duplicate nearby guides with different intent.</p>
        <div class="guide-check-grid">
          <div class="guide-check-card"><span class="mark">01</span><strong>${esc(focus.role)}</strong><span>${esc(focus.job)}</span></div>
          <div class="guide-check-card"><span class="mark">02</span><strong>Use ${esc(tool.title)}</strong><span>${esc(spec.toolUse)}</span></div>
          <div class="guide-check-card"><span class="mark">03</span><strong>Finished result</strong><span>${esc(focus.deliverable)}</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Run the primary Clickoz workflow</h2>
        <p>Use this path when you want the fastest reliable fix. It keeps the page useful for the reader first, while giving search engines a clear workflow to understand.</p>
        <div class="guide-tool-path">
          <div class="guide-path-step"><b>${esc(cluster.primary[0])}</b><p>${esc(guide.description)}</p></div>
          <div class="guide-path-arrow">&rarr;</div>
          <div class="guide-path-step"><b>${esc(cluster.primary[1])}</b><p><a href="${tool.url}">Open ${esc(tool.title)}</a> and apply it to real input.</p></div>
          <div class="guide-path-arrow">&rarr;</div>
          <div class="guide-path-step"><b>${esc(cluster.primary[2])}</b><p>Copy the useful output and continue with the next related guide.</p></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Apply the fix step by step</h2>
        <ol class="guide-steps">
          ${howSteps.map(([name, text]) => `<li><strong>${esc(name)}.</strong> ${esc(text)}</li>`).join("")}
          <li><strong>Review on mobile.</strong> Read the title, first paragraph, main output and CTA as if you were in a hurry. If the task is not obvious, simplify before publishing.</li>
        </ol>
      </section>

      <section class="guide-block guide-playbook">
        <h2>Practical playbook</h2>
        <p>Use this playbook when you need a repeatable decision under time pressure. It turns the guide into a practical routine instead of a passive read.</p>
        <div class="guide-playbook-grid">
          <article><span>Input</span><strong>Use real material</strong><p>Paste the actual draft, title, URL, payload or creator idea. Sample text is useful for learning the flow, but real input reveals the actual problem.</p></article>
          <article><span>Tool pass</span><strong>Run ${esc(tool.title)}</strong><p>${esc(spec.toolUse)}</p></article>
          <article><span>Human pass</span><strong>Apply judgment</strong><p>Keep the output only if it matches the user intent, context, platform and next step.</p></article>
          <article><span>Next step</span><strong>Continue the workflow</strong><p>Move to ${esc(relatedT[1]?.title || "the next related tool")} or ${esc(relatedG[0]?.title || "the next related guide")} so the work does not end too early.</p></article>
        </div>
      </section>

      <section class="guide-block">
        <h2>What a useful result should include</h2>
        <p>The output is only valuable when it can be copied, checked and used in the next step without guessing.</p>
        <div class="guide-check-grid">
          <div class="guide-check-card"><span class="mark">A</span><strong>Specific input</strong><span>Use the real draft, URL, payload, page type, platform or campaign placement.</span></div>
          <div class="guide-check-card"><span class="mark">B</span><strong>Output ready to copy</strong><span>The result should be readable, complete and safe to review in its final context.</span></div>
          <div class="guide-check-card"><span class="mark">C</span><strong>Next action</strong><span>Finish with ${esc(relatedT[1]?.title || "the next related tool")} or ${esc(relatedG[0]?.title || "a related guide")} instead of stopping at one isolated fix.</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Alternatives when the first fix is not enough</h2>
        <p>Good guides need alternatives because real users do not all arrive with the same problem. Use the option that matches the failure pattern.</p>
        <div class="guide-option-grid">
          <div class="guide-alternative-card"><span class="mark">A</span><strong>${esc(alt1[0])}</strong><span>${esc(alt1[1])}</span></div>
          <div class="guide-alternative-card"><span class="mark">B</span><strong>${esc(alt2[0])}</strong><span>${esc(alt2[1])}</span></div>
          <div class="guide-alternative-card"><span class="mark">C</span><strong>${esc(alt3[0])}</strong><span>${esc(alt3[1])}</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Decision table</h2>
        <table class="guide-decision-table">
          <thead><tr><th>Situation</th><th>Action</th><th>Best Clickoz page</th></tr></thead>
          <tbody>
            <tr><td>Need a quick check</td><td>${esc(spec.toolUse)}</td><td><a href="${tool.url}">${esc(tool.title)}</a></td></tr>
            <tr><td>Need a broader workflow</td><td>Read the related guide and compare the next step.</td><td><a href="${relatedG[0]?.url || "/guides/"}">${esc(relatedG[0]?.title || "Guide library")}</a></td></tr>
            <tr><td>Need a second tool</td><td>Move to the tool that handles the next part of the task.</td><td><a href="${relatedT[1]?.url || "/tools/"}">${esc(relatedT[1]?.title || "Tools library")}</a></td></tr>
          </tbody>
        </table>
      </section>

      <section class="guide-block guide-troubleshooting">
        <h2>Troubleshooting map</h2>
        <div class="guide-trouble-grid">
          <article><strong>The result lacks context</strong><p>Add the platform, audience, target keyword, page type, campaign source or technical constraint before running the tool again.</p></article>
          <article><strong>The output is technically correct but not useful</strong><p>Compare it against the problem statement. If it does not help the user act faster, simplify the input and rerun.</p></article>
          <article><strong>The page still feels weak for SEO</strong><p>Add a concrete example, one related tool, one related guide, a short FAQ and a clearer promise above the fold.</p></article>
        </div>
      </section>

      <section class="guide-block">
        <h2>Concrete example</h2>
        <div class="guide-example-grid">
          <div class="guide-example-card"><span class="mark">1</span><strong>Weak</strong><span>${esc(spec.example[0])}</span></div>
          <div class="guide-example-card"><span class="mark">2</span><strong>Better</strong><span>${esc(spec.example[1])}</span></div>
          <div class="guide-example-card"><span class="mark">3</span><strong>Premium</strong><span>${esc(spec.example[2])}</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Quality checklist</h2>
        <div class="guide-check-grid">
          <div class="guide-check-card"><span class="mark">01</span><strong>Clear intent</strong><span>The reader knows why the page exists in the first screen.</span></div>
          <div class="guide-check-card"><span class="mark">02</span><strong>Working tool</strong><span>The guide links to a tool that completes the task, not just another article.</span></div>
          <div class="guide-check-card"><span class="mark">03</span><strong>Next step</strong><span>The final section links to a related tool or guide so the user continues naturally.</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Recommended tools</h2>
        <div class="guide-related-tools">
          ${relatedT.map((item) => `<a href="${item.url}">${esc(item.title)}</a>`).join("")}
        </div>
      </section>

      <section class="guide-block">
        <h2>Related guides</h2>
        <div class="guide-related-grid">
          ${relatedG.map((item) => `<a href="${item.url}"><strong>${esc(item.title)}</strong><span>${esc(item.description)}</span></a>`).join("")}
        </div>
      </section>

      <section class="guide-block guide-faq">
        <h2>FAQ</h2>
        ${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
      </section>

      <section class="guide-block">
        <h2>Source notes</h2>
        <p>These references are used as quality guardrails. The guide is intentionally practical: no fake ranking promises, no keyword stuffing and no unsupported claims.</p>
        <ul class="source-list">
          <li><a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" rel="nofollow noopener" target="_blank">Google helpful content guidance</a></li>
          <li><a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" rel="nofollow noopener" target="_blank">Google SEO starter guide</a></li>
          <li><a href="https://developers.google.com/search/docs/appearance/structured-data/search-gallery" rel="nofollow noopener" target="_blank">Google structured data gallery</a></li>
        </ul>
      </section>
    </article>
  </main>

  <footer class="footer"><div class="container footer-grid"><div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div><div><h4>Tool hubs</h4><div class="footer-links"><a href="/tools/seo-tools/">SEO Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/tools/writing-tools/">Writing Tools</a><a href="/guides/creator/">Creator Guides</a></div></div><div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/youtube-title-generator/">YouTube Titles</a></div></div><div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/404/">404</a></div></div></div><div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">&copy; 2026 Clickoz &middot; Fast browser tools for SEO, writing, developers and creators</div></div></footer>

  <script src="${asset("/assets/cms-registry.js", "cmsRegistry")}" defer></script>
  <script src="${asset("/assets/cms-schema.js", "cmsSchema")}" defer></script>
  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>
  <script src="${asset("/assets/site.js", "siteJs")}" defer></script>
  <script src="${asset("/assets/guide.js", "guideJs")}" defer></script>
  <script src="${asset("/assets/guide-premium.js", "guidePremiumJs")}" defer></script>
  <script src="${asset("/assets/clickoz-premium.js", "clickozPremiumJs")}" defer></script>
</body>
</html>
`;
}

for (const guide of cms.guides) {
  const dir = path.join(root, guide.url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(guide), "utf8");
}

console.log(`Generated ${cms.guides.length} premium guides.`);
