const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const registryCode = fs.readFileSync(path.join(root, "assets", "cms-registry.js"), "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(registryCode, ctx);
const cms = ctx.window.ClickozCMS;

const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://translate.googleapis.com https://translate.google.com https://cloudflare-dns.com; frame-src https://translate.google.com https://*.google.com; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; upgrade-insecure-requests";

const cat = {
  seo: {
    label: "SEO workflow", icon: "🔎", visual: "seo",
    problem: "The page may be technically published, but it does not clearly answer search intent or guide the visitor to the next action.",
    cause: "Most SEO issues come from vague intent, weak snippets, repeated keywords, missing internal links or content that answers the topic without helping the user complete the task.",
    avoid: "Do not chase one magic number. Prioritize intent match, clarity, useful structure and internal links.",
    primary: ["Map the searcher need", "Improve the visible snippet", "Add a next-click path"],
    alternatives: [
      ["If the page is thin", "Expand the section that answers the exact user task before adding keyword variants."],
      ["If the snippet is weak", "Rewrite the title and description before editing the whole article."],
      ["If users leave", "Add links to the matching tool and a related guide near the moment of need."]
    ]
  },
  writing: {
    label: "Writing workflow", icon: "✍️", visual: "writing",
    problem: "The draft contains the right idea, but it feels too long, too unclear or too hard to scan on mobile.",
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
    label: "Developer workflow", icon: "🧪", visual: "dev",
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
    label: "Tracking workflow", icon: "📈", visual: "tracking",
    problem: "Campaign links exist, but analytics becomes messy because naming, source or medium choices are inconsistent.",
    cause: "Tracking problems usually start before launch: unclear naming conventions, unencoded URLs, duplicate campaign names or links pasted in the wrong place.",
    avoid: "Do not create campaign names on the fly. Decide a naming system before publishing.",
    primary: ["Define source and medium", "Build the tracked URL", "Test before launch"],
    alternatives: [
      ["If reports are messy", "Standardize source, medium and campaign naming before building more links."],
      ["If links break", "Encode parameters and check the final URL before posting."],
      ["If attribution is unclear", "Create separate links for description, bio, pinned comment and newsletter."]
    ]
  },
  youtube: {
    label: "YouTube workflow", icon: "▶️", visual: "youtube",
    problem: "The video may be good, but the packaging does not make the click promise obvious enough.",
    cause: "Creator pages underperform when title, thumbnail, description, hashtags and tracking are treated as separate tasks instead of one upload system.",
    avoid: "Do not optimize tags before the title and thumbnail promise is clear.",
    primary: ["Define the click promise", "Package the upload", "Route viewers to the next action"],
    alternatives: [
      ["If the idea is unclear", "Write five title angles before building the thumbnail brief."],
      ["If discovery is weak", "Use hashtags and description lines as labels, not as spam."],
      ["If clicks are not tracked", "Use separate UTM links for description, pinned comment and social reposts."]
    ]
  },
  creator: {
    label: "Creator system", icon: "🎬", visual: "creator",
    problem: "Content is created one piece at a time, so ideas, uploads and follow-up posts are hard to repeat.",
    cause: "Creator workflows become fragile when planning, packaging, community posts and tracking are not connected.",
    avoid: "Do not plan uploads without planning the follow-up action.",
    primary: ["Plan the content lane", "Package each asset", "Measure the follow-up"],
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
    output: "A clear length target based on the page purpose, not a generic word-count myth.",
    example: ["Weak: the article is short because someone said 600 words is enough.", "Better: the page answers the exact query, covers objections and uses short sections.", "Premium: the guide includes examples, FAQs, internal links and a measurable next action."]
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
    example: ["Weak: a description that repeats the title.", "Better: a description that explains the benefit and next action.", "Premium: the snippet sets the exact expectation the page fulfills."]
  },
  "keyword-density": {
    toolUse: "Check repeated terms, then replace mechanical repetition with natural variants and supporting phrases.",
    output: "Balanced wording that covers the topic without stuffing.",
    example: ["Weak: the same keyword repeated in every paragraph.", "Better: synonyms, examples and intent-matching language.", "Premium: the page reads naturally and still signals the topic clearly."]
  },
  "slug-generator": {
    toolUse: "Generate a clean slug, remove filler words and keep only the durable page concept.",
    output: "A short URL that stays readable after the page grows.",
    example: ["Weak: /best-free-online-super-seo-tool-for-everyone-now/", "Better: /seo-content-checklist/", "Premium: the URL, title and internal links all describe the same asset."]
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
    toolUse: `Open ${tool.title}, test the real input and copy the result only after checking the output.`,
    output: "A practical result that helps the user finish the current task.",
    example: ["Weak: using a generic explanation without a next step.", "Better: apply the tool to a real input.", "Premium: connect the result to the next guide or tool."]
  };
}

function page(guide) {
  const tool = toolFor(guide);
  const cluster = cat[guide.category] || cat[tool.category] || cat.seo;
  const spec = specFor(tool);
  const relatedT = relatedTools(guide);
  const relatedG = relatedGuides(guide);
  const title = `${guide.title} | Clickoz Guide`;
  const desc = `${guide.description} Learn the problem, common mistakes, Clickoz tool workflow, alternatives, checklist and next actions.`;
  const url = `https://clickoz.com${guide.url}`;
  const visual = `/assets/img/guides/${cluster.visual}.svg`;
  const alt1 = cluster.alternatives[0];
  const alt2 = cluster.alternatives[1];
  const alt3 = cluster.alternatives[2];
  const faq = [
    [`What problem does ${guide.title} solve?`, `${guide.title} helps when ${cluster.problem.toLowerCase()} It connects the explanation to a working Clickoz tool so the user can act immediately.`],
    [`Which Clickoz tool should I use with this guide?`, `Start with ${tool.title}. ${spec.toolUse}`],
    ["What should I do if the first workflow does not fit?", `Use the alternatives section. ${alt1[1]} ${alt2[1]}`]
  ];
  const howSteps = [
    ["Define the real problem", cluster.problem],
    [`Open ${tool.title}`, spec.toolUse],
    ["Compare alternatives", `${alt1[1]} ${alt2[1]}`],
    ["Finish with a next action", `Copy the useful output, then continue with ${relatedG[0]?.title || "a related guide"} or ${relatedT[1]?.title || "a related tool"}.`]
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=()" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#070b13" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="https://clickoz.com${visual}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="https://clickoz.com${visual}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/site.css?v=12" />
  <link rel="stylesheet" href="/assets/guide.css?v=4" />
  <link rel="stylesheet" href="/assets/guide-premium.css?v=2" />
  <link rel="stylesheet" href="/assets/clickoz-premium.css?v=3" />
  <link rel="stylesheet" href="/assets/cms-final.css?v=24" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    image: `https://clickoz.com${visual}`,
    author: { "@type": "Organization", name: "Clickoz" },
    publisher: { "@type": "Organization", name: "Clickoz", logo: { "@type": "ImageObject", url: "https://clickoz.com/assets/favicon.svg" } },
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
      <a class="logo" href="/" aria-label="Clickoz Home"><span class="logo-badge" id="logoBadge" aria-hidden="true"><svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="logo-text">Click<span class="logo-oz">oz</span></span></a>
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
            <p class="guide-lead">${esc(guide.description)} This guide is built as a practical workflow: understand the problem, run the right tool, compare alternatives and finish with a clear next action.</p>
            <div class="guide-intent-row">
              <span>${cluster.icon} Problem-led</span>
              <span>🛠️ Tool-connected</span>
              <span>✅ Checklist-ready</span>
              <span>🔗 Internal next step</span>
            </div>
            <div class="premium-link-grid">
              ${relatedT.map((item) => `<a href="${item.url}">${esc(item.title)}</a>`).join("")}
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

      <section class="guide-block">
        <h2>The real problem</h2>
        <p>${esc(cluster.problem)} For this specific guide, the useful question is: how do you turn "${esc(guide.title)}" from an abstract topic into a repeatable action?</p>
        <div class="guide-problem-grid">
          <div class="guide-problem-card"><span class="mark">⚠️</span><strong>Typical symptom</strong><span>${esc(cluster.cause)}</span></div>
          <div class="guide-problem-card"><span class="mark">🎯</span><strong>What good looks like</strong><span>${esc(spec.output)}</span></div>
          <div class="guide-problem-card"><span class="mark">🚫</span><strong>What to avoid</strong><span>${esc(cluster.avoid)}</span></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Primary Clickoz workflow</h2>
        <p>Use this path when you want the fastest reliable fix. It keeps the guide practical and gives Google a clear reason to understand the page as a workflow, not a thin article.</p>
        <div class="guide-tool-path">
          <div class="guide-path-step"><b>${esc(cluster.primary[0])}</b><p>${esc(guide.description)}</p></div>
          <div class="guide-path-arrow">→</div>
          <div class="guide-path-step"><b>${esc(cluster.primary[1])}</b><p><a href="${tool.url}">Open ${esc(tool.title)}</a> and apply it to real input.</p></div>
          <div class="guide-path-arrow">→</div>
          <div class="guide-path-step"><b>${esc(cluster.primary[2])}</b><p>Copy the useful output and continue with the next related guide.</p></div>
        </div>
      </section>

      <section class="guide-block">
        <h2>Step-by-step solution</h2>
        <ol class="guide-steps">
          ${howSteps.map(([name, text]) => `<li><strong>${esc(name)}.</strong> ${esc(text)}</li>`).join("")}
          <li><strong>Review on mobile.</strong> Read the title, first paragraph, main output and CTA as if you were in a hurry. If the task is not obvious, simplify before publishing.</li>
        </ol>
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
            <tr><td>Need a broader workflow</td><td>Read the related guide and compare the next action.</td><td><a href="${relatedG[0]?.url || "/guides/"}">${esc(relatedG[0]?.title || "Guide library")}</a></td></tr>
            <tr><td>Need a second tool</td><td>Move to the tool that handles the next layer of the task.</td><td><a href="${relatedT[1]?.url || "/tools/"}">${esc(relatedT[1]?.title || "Tools library")}</a></td></tr>
          </tbody>
        </table>
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
          <div class="guide-check-card"><span class="mark">✅</span><strong>Clear intent</strong><span>The reader knows why the page exists in the first screen.</span></div>
          <div class="guide-check-card"><span class="mark">🛠️</span><strong>Working tool</strong><span>The guide links to a tool that completes the task, not just another article.</span></div>
          <div class="guide-check-card"><span class="mark">🔗</span><strong>Next action</strong><span>The final section routes to a related tool or guide so the user continues naturally.</span></div>
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
        ${faq.map(([q, a], index) => `<details${index === 0 ? " open" : ""}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
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

  <footer class="footer"><div class="container footer-grid"><div><h4>Clickoz</h4><div class="footer-links"><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div><div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/http-ping/">HTTP Ping</a><a href="/tools/utm-builder/">UTM Builder</a></div></div><div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a></div></div></div><div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">© 2026 Clickoz • Fast tools for SEO, writing and developers</div></div></footer>

  <script src="/assets/cms-registry.js?v=4" defer></script>
  <script src="/assets/cms-schema.js?v=1" defer></script>
  <script src="/assets/cms-enhance.js?v=6" defer></script>
  <script src="/assets/site.js?v=21" defer></script>
  <script src="/assets/guide.js?v=2" defer></script>
  <script src="/assets/guide-premium.js?v=3" defer></script>
  <script src="/assets/clickoz-premium.js?v=4" defer></script>
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
