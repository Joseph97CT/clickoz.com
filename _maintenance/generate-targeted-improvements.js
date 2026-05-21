const fs = require("fs");
const path = require("path");

const root = process.cwd();

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function nav(active) {
  return `<nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home">
        <span class="logo-badge" id="logoBadge" aria-hidden="true">
          <svg class="logo-mark" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden="true" focusable="false">
            <path d="M32.5 13.5c-2.4-2.2-5.4-3.3-8.9-3.3-7.2 0-12.6 5.1-12.6 13.8S16.4 37.8 23.6 37.8c3.6 0 6.7-1.2 9.2-3.6" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="logo-text">Click<span class="logo-oz">oz</span></span>
      </a>
      <div class="nav-links" aria-label="Sections">
        <a href="/"${active === "home" ? ' class="active" aria-current="page"' : ""}>Home</a>
        <a href="/tools/"${active === "tools" ? ' class="active" aria-current="page"' : ""}>Tools</a>
        <a href="/guides/"${active === "guides" ? ' class="active" aria-current="page"' : ""}>Guides</a>
        <a href="/updates/"${active === "updates" ? ' class="active" aria-current="page"' : ""}>Updates</a>
      </div>
      <div class="spacer"></div>
    </div>
  </nav>`;
}

function layout({ title, description, canonical, active, body, schema = [] }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="https://clickoz.com${canonical}" />
  <meta name="robots" content="index,follow" />
  <meta name="theme-color" content="#0b0f19" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="https://clickoz.com${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://clickoz.com/assets/og/default.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="https://clickoz.com/assets/og/default.svg" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/site.css?v=13" />
  <link rel="stylesheet" href="/tools/tool-improvements.css?v=1" />
  ${schema.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n  ")}
</head>
<body class="bigtext">
  <div id="clickozParticles" aria-hidden="true"></div>
  <div class="__grain" aria-hidden="true"></div>
  ${nav(active)}
  ${body}
  <script src="/assets/site.js" defer></script>
  <script src="/tools/tool-improvements.js?v=1" defer></script>
</body>
</html>`;
}

function breadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `https://clickoz.com${url}`
    }))
  };
}

const toolData = [
  {
    slug: "json-minifier",
    name: "JSON Minifier",
    type: "json-minify",
    category: "Developer Utilities",
    description: "Compress valid JSON into a compact copy-ready payload while checking that the input is valid.",
    controls: "codec"
  },
  {
    slug: "whitespace-cleaner",
    name: "Whitespace Cleaner",
    type: "whitespace",
    category: "Writing Tools",
    description: "Remove duplicate spaces, trim messy copied text, normalize blank lines and copy a cleaner version.",
    controls: "text"
  },
  {
    slug: "character-counter",
    name: "Character Counter",
    type: "character-counter",
    category: "Writing Tools",
    description: "Measure characters with and without spaces for titles, descriptions, social posts and form limits.",
    controls: "text"
  },
  {
    slug: "readability-analyzer",
    name: "Readability Analyzer",
    type: "readability",
    category: "Writing Tools",
    description: "Estimate reading ease, grade level and sentence length so drafts become easier to scan.",
    controls: "text"
  },
  {
    slug: "keyword-density",
    name: "Keyword Density Checker",
    type: "keyword-density",
    category: "SEO Tools",
    description: "Find repeated terms, top words and focus keyword density without encouraging keyword stuffing.",
    controls: "keyword"
  },
  {
    slug: "meta-tags",
    name: "Meta Tag Optimizer",
    type: "meta-preview",
    category: "SEO Tools",
    description: "Preview title and meta description length before publishing so search snippets stay clear.",
    controls: "meta"
  },
  {
    slug: "serp-preview",
    name: "SERP Snippet Preview",
    type: "meta-preview",
    category: "SEO Tools",
    description: "Check how a page title, URL and description may appear in search results.",
    controls: "meta"
  },
  {
    slug: "text-case-converter",
    name: "Text Case Converter",
    type: "case-converter",
    category: "Writing Tools",
    description: "Convert text to sentence case, title case, uppercase, lowercase and slug format.",
    controls: "case"
  },
  {
    slug: "slug-generator",
    name: "Slug Generator",
    type: "slug",
    category: "SEO Tools",
    description: "Create short, readable and SEO-friendly URL slugs from page titles or headings.",
    controls: "text"
  }
];

function toolControls(tool) {
  if (tool.controls === "codec") {
    return `<div class="cz-panel" data-cz-tool="${tool.type}">
      <div class="cz-grid">
        <div>
          <label class="cz-label" for="input">Input JSON</label>
          <textarea id="input" data-input class="cz-textarea" placeholder='{"hello":"world"}'></textarea>
          <div class="cz-actions">
            <button class="cz-btn primary" type="button" data-run>Minify JSON</button>
            <button class="cz-btn" type="button" data-sample>Load sample</button>
            <button class="cz-btn" type="button" data-clear>Clear</button>
          </div>
          <p class="cz-note">The tool parses JSON before minifying, so invalid input returns a clear error instead of unsafe output.</p>
        </div>
        <div>
          <div class="cz-stats" data-stats aria-live="polite"></div>
          <div class="cz-field"><label class="cz-label" for="output">Minified output</label><textarea id="output" data-output class="cz-textarea" readonly></textarea></div>
          <button class="cz-btn" type="button" data-copy>Copy output</button>
        </div>
      </div>
    </div>`;
  }

  if (tool.controls === "meta") {
    return `<div class="cz-panel" data-cz-tool="${tool.type}">
      <div class="cz-grid">
        <div>
          <div class="cz-field"><label class="cz-label" for="url">Page URL</label><input id="url" data-url class="cz-input" placeholder="https://example.com/page"></div>
          <div class="cz-field"><label class="cz-label" for="title">Title</label><input id="title" data-title class="cz-input" maxlength="120" placeholder="Useful page title"></div>
          <div class="cz-field"><label class="cz-label" for="desc">Meta description</label><textarea id="desc" data-desc class="cz-textarea" style="min-height:150px" maxlength="240" placeholder="Clear page description"></textarea></div>
        </div>
        <div>
          <div class="cz-stats" data-stats aria-live="polite"></div>
          <div class="cz-serp" data-preview></div>
          <p class="cz-note">Length is not a guarantee. Use the preview to keep the message specific and readable.</p>
        </div>
      </div>
    </div>`;
  }

  if (tool.controls === "case") {
    return `<div class="cz-panel" data-cz-tool="${tool.type}">
      <div class="cz-grid">
        <div>
          <label class="cz-label" for="input">Input text</label>
          <textarea id="input" data-input class="cz-textarea" placeholder="Paste text here"></textarea>
          <div class="cz-actions">
            <button class="cz-btn primary" type="button" data-case="sentence">Sentence case</button>
            <button class="cz-btn" type="button" data-case="title">Title Case</button>
            <button class="cz-btn" type="button" data-case="upper">UPPER</button>
            <button class="cz-btn" type="button" data-case="lower">lower</button>
            <button class="cz-btn" type="button" data-case="slug">slug</button>
          </div>
        </div>
        <div>
          <div class="cz-stats" data-stats aria-live="polite"></div>
          <div class="cz-field"><label class="cz-label" for="output">Converted output</label><textarea id="output" data-output class="cz-textarea" readonly></textarea></div>
          <button class="cz-btn" type="button" data-copy>Copy output</button>
        </div>
      </div>
    </div>`;
  }

  const focus = tool.controls === "keyword" ? `<div class="cz-field"><label class="cz-label" for="focus">Focus keyword</label><input id="focus" data-focus class="cz-input" placeholder="e.g. productivity tips"></div>` : "";
  const table = tool.controls === "keyword" ? `<table class="cz-table"><thead><tr><th>Top terms</th><th>Count</th><th>Density</th></tr></thead><tbody data-terms></tbody></table>` : "";
  return `<div class="cz-panel" data-cz-tool="${tool.type}">
    <div class="cz-grid">
      <div>
        <label class="cz-label" for="input">Input text</label>
        <textarea id="input" data-input class="cz-textarea" placeholder="Paste text here"></textarea>
        ${focus}
        <div class="cz-actions">
          <button class="cz-btn primary" type="button" data-sample>Load sample</button>
          <button class="cz-btn" type="button" data-clear>Clear</button>
          <button class="cz-btn" type="button" data-copy>Copy result</button>
        </div>
      </div>
      <div>
        <div class="cz-stats" data-stats aria-live="polite"></div>
        <div class="cz-field"><label class="cz-label" for="output">Result</label><textarea id="output" data-output class="cz-textarea" readonly></textarea></div>
        ${table}
      </div>
    </div>
  </div>`;
}

function toolPage(tool) {
  return layout({
    title: `${tool.name} - Free Online Tool | Clickoz`,
    description: `${tool.description} Browser-only, privacy-first and copy-ready.`,
    canonical: `/tools/${tool.slug}/`,
    active: "tools",
    schema: [
      breadcrumb([["Clickoz", "/"], ["Tools", "/tools/"], [tool.name, `/tools/${tool.slug}/`]]),
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: tool.name,
        url: `https://clickoz.com/tools/${tool.slug}/`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "Clickoz", url: "https://clickoz.com/" }
      }
    ],
    body: `<section class="section container cz-tool-shell">
      <div class="cz-hero">
        <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/tools/">Tools</a><span>/</span><span>${esc(tool.name)}</span></nav>
        <h1>${esc(tool.name)}</h1>
        <p>${esc(tool.description)}</p>
        <div class="cz-trust"><span class="cz-pill">${esc(tool.category)}</span><span class="cz-pill">Browser-only</span><span class="cz-pill">No signup</span></div>
      </div>
      ${toolControls(tool)}
    </section>`
  });
}

const guideData = [
  {
    slug: "seo-content-checklist",
    title: "SEO Content Checklist",
    description: "A practical checklist for improving search-focused content before publishing.",
    intent: "publish a page that answers a searcher's question clearly",
    tools: [["Word Counter", "/tools/word-counter/"], ["Readability Analyzer", "/tools/readability-analyzer/"], ["Keyword Density Checker", "/tools/keyword-density/"], ["Meta Tag Optimizer", "/tools/meta-tags/"]],
    example: "Before publishing a guide, confirm the title matches the actual promise, the opening paragraph answers the main query, and each H2 moves the reader closer to a decision."
  },
  {
    slug: "how-to-write-meta-title-description",
    title: "How to Write Meta Titles and Descriptions",
    description: "Write titles and descriptions that are compact, clear and useful in search results.",
    intent: "improve snippet clarity and click appeal",
    tools: [["Meta Tag Optimizer", "/tools/meta-tags/"], ["SERP Preview", "/tools/serp-preview/"]],
    example: "Weak: Best Tools. Better: Free JSON Formatter - Validate, Format and Minify JSON."
  },
  {
    slug: "keyword-density-explained",
    title: "Keyword Density: What It Is and How to Use It",
    description: "Understand keyword density without falling into keyword stuffing.",
    intent: "spot overused or missing terms in a draft",
    tools: [["Keyword Density Checker", "/tools/keyword-density/"], ["Readability Analyzer", "/tools/readability-analyzer/"]],
    example: "If the focus term appears in every sentence, the issue is usually writing quality, not SEO optimization."
  },
  {
    slug: "readability-for-seo",
    title: "Readability for SEO",
    description: "Make pages easier to scan while keeping useful detail.",
    intent: "make content easier for humans to understand",
    tools: [["Readability Analyzer", "/tools/readability-analyzer/"], ["Word Counter", "/tools/word-counter/"]],
    example: "Break a 180-word paragraph into two shorter paragraphs and a bullet list when the reader needs to compare steps."
  },
  {
    slug: "utm-builder-guide",
    title: "UTM Builder Guide",
    description: "Use consistent campaign parameters across social, email and ads.",
    intent: "track campaign links without messy reporting",
    tools: [["UTM Builder", "/tools/utm-builder/"], ["URL Encoder", "/tools/url-encoder/"]],
    example: "Use `utm_source=newsletter`, `utm_medium=email`, and a stable campaign name such as `spring_launch`."
  },
  {
    slug: "url-encoding",
    title: "URL Encoding Explained",
    description: "Learn when to encode query values, paths and full URLs.",
    intent: "avoid broken links and malformed query strings",
    tools: [["URL Encoder / Decoder", "/tools/url-encoder/"], ["UTM Builder", "/tools/utm-builder/"]],
    example: "A space inside a query value should become `%20` or `+`; an ampersand inside a value must be encoded so it does not split the parameter."
  },
  {
    slug: "base64-decode",
    title: "Base64 Decode: What It Is and How to Use It",
    description: "Understand Base64 decoding, common payloads and why it is not encryption.",
    intent: "inspect encoded text safely",
    tools: [["Base64 Encode / Decode", "/tools/base64/"], ["JSON Formatter", "/tools/json-formatter/"]],
    example: "Many JWT payloads are Base64URL encoded. Decoding helps inspect claims, but it does not prove the token is valid."
  },
  {
    slug: "text-cleanup-workflow",
    title: "Text Cleanup Workflow",
    description: "Clean pasted copy, fix whitespace and normalize casing before publishing.",
    intent: "turn messy pasted text into clean copy",
    tools: [["Whitespace Cleaner", "/tools/whitespace-cleaner/"], ["Text Case Converter", "/tools/text-case-converter/"], ["Slug Generator", "/tools/slug-generator/"]],
    example: "Paste from a PDF, remove doubled spaces, normalize headings, then create a clean slug from the final title."
  },
  {
    slug: "serp-snippet-ctr",
    title: "SERP Snippets and CTR",
    description: "Improve title and description clarity for better search result appeal.",
    intent: "make search snippets more specific",
    tools: [["SERP Preview", "/tools/serp-preview/"], ["Meta Tag Optimizer", "/tools/meta-tags/"]],
    example: "A useful snippet names the tool, the outcome and the speed: `Format JSON instantly, validate errors and copy clean output`."
  },
  {
    slug: "slug-best-practices",
    title: "Slug Best Practices for SEO URLs",
    description: "Create short, stable and readable slugs for content pages.",
    intent: "make URLs readable and durable",
    tools: [["Slug Generator", "/tools/slug-generator/"]],
    example: "Prefer `/guides/json-formatting-debug/` over `/post?id=8432&cat=tools-json-final-v2/`."
  },
  {
    slug: "content-brief-template",
    title: "Content Brief Template",
    description: "A reusable brief structure for search-focused pages and guides.",
    intent: "plan a page before writing it",
    tools: [["Keyword Density Checker", "/tools/keyword-density/"], ["Word Counter", "/tools/word-counter/"], ["Readability Analyzer", "/tools/readability-analyzer/"]],
    example: "Include primary query, search intent, required sections, related terms, examples, internal links and success criteria."
  },
  {
    slug: "base64-encode-decode",
    title: "Base64 Encode and Decode Basics",
    description: "Understand Base64 encoding, decoding and common mistakes when inspecting payloads.",
    intent: "move between plain text and Base64 safely",
    tools: [["Base64 Encode / Decode", "/tools/base64/"]],
    example: "Base64 is an encoding format. Anyone can decode it, so do not use it to hide secrets."
  },
  {
    slug: "json-formatter-online",
    title: "How to Use an Online JSON Formatter",
    description: "Format, validate and debug JSON without losing context.",
    intent: "turn unreadable JSON into a useful debugging view",
    tools: [["JSON Formatter", "/tools/json-formatter/"], ["JSON Minifier", "/tools/json-minifier/"]],
    example: "Pretty-print JSON while debugging, then minify it only when you need compact output."
  },
  {
    slug: "meta-tags-length",
    title: "Meta Title and Description Length",
    description: "Check practical length ranges for titles and descriptions before publishing.",
    intent: "avoid unclear or truncated snippets",
    tools: [["Meta Tag Optimizer", "/tools/meta-tags/"], ["SERP Preview", "/tools/serp-preview/"]],
    example: "A title under 60 characters is often easier to scan, but clarity matters more than a perfect number."
  },
  {
    slug: "readability-score",
    title: "Readability Score Basics",
    description: "Use readability scores as a signal, not as the only editing goal.",
    intent: "edit text for clarity",
    tools: [["Readability Analyzer", "/tools/readability-analyzer/"], ["Word Counter", "/tools/word-counter/"]],
    example: "A technical guide can have a lower score and still be useful if terms are defined and steps are clear."
  },
  {
    slug: "url-encoding-explained",
    title: "URL Encoding Explained",
    description: "Learn what URL encoding does and when to encode query string values.",
    intent: "keep links reliable",
    tools: [["URL Encoder / Decoder", "/tools/url-encoder/"]],
    example: "`spring sale` becomes `spring%20sale` inside a URL so browsers and analytics tools read it correctly."
  },
  {
    slug: "word-count-for-seo",
    title: "Word Count for SEO",
    description: "Use word count as a planning signal while keeping content useful and focused.",
    intent: "avoid thin pages without adding filler",
    tools: [["Word Counter", "/tools/word-counter/"], ["Readability Analyzer", "/tools/readability-analyzer/"]],
    example: "If a competing guide is long because it covers examples and FAQs, match the usefulness, not just the word count."
  }
];

function guidePage(guide) {
  const toolLinks = guide.tools.map(([name, url]) => `<li><a href="${url}">${esc(name)}</a></li>`).join("");
  return layout({
    title: `${guide.title} | Clickoz`,
    description: guide.description,
    canonical: `/guides/${guide.slug}/`,
    active: "guides",
    schema: [
      breadcrumb([["Clickoz", "/"], ["Guides", "/guides/"], [guide.title, `/guides/${guide.slug}/`]]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: "2026-05-16",
        dateModified: "2026-05-16",
        author: { "@type": "Organization", name: "Clickoz" },
        publisher: { "@type": "Organization", name: "Clickoz", logo: { "@type": "ImageObject", url: "https://clickoz.com/assets/favicon.svg" } },
        mainEntityOfPage: `https://clickoz.com/guides/${guide.slug}/`
      }
    ],
    body: `<section class="section container cz-guide-shell">
      <div class="cz-hero">
        <nav class="cz-crumbs"><a href="/">Home</a><span>/</span><a href="/guides/">Guides</a><span>/</span><span>${esc(guide.title)}</span></nav>
        <h1>${esc(guide.title)}</h1>
        <p>${esc(guide.description)}</p>
      </div>
      <div class="cz-guide-layout">
        <article>
          <section class="cz-guide-card">
            <h2>When to use this guide</h2>
            <p>Use this workflow when you need to ${esc(guide.intent)}. The point is not to chase a vanity metric. The point is to make the page easier to understand, easier to trust and easier to act on.</p>
          </section>
          <section class="cz-guide-card">
            <h2>Step-by-step workflow</h2>
            <ol>
              <li>Define the reader's job: what are they trying to finish right now?</li>
              <li>Open the related Clickoz tool and test the current draft, link or data.</li>
              <li>Fix the largest clarity issue first, then rerun the check.</li>
              <li>Review the result on a narrow screen so buttons, boxes and text still scan well.</li>
              <li>Publish only when the next step is obvious without extra explanation.</li>
            </ol>
          </section>
          <section class="cz-guide-card">
            <h2>Practical example</h2>
            <p>${esc(guide.example)}</p>
          </section>
          <section class="cz-guide-card">
            <h2>Checklist before publishing</h2>
            <ul>
              <li>The page has one clear purpose and one primary next action.</li>
              <li>The title and first paragraph match the real content below.</li>
              <li>Examples are specific enough that a reader can copy the pattern.</li>
              <li>Internal links point to tools or guides that continue the same workflow.</li>
              <li>There are no empty sections, fake placeholders or dead-end cards.</li>
            </ul>
          </section>
          <section class="cz-guide-card">
            <h2>Common mistakes</h2>
            <p>Do not add filler just to make the page look larger. Thin, direct content is better than long content that repeats itself. Also avoid linking to tools that are unfinished, because one broken link can make the whole site feel unreliable.</p>
          </section>
          <section class="cz-guide-card">
            <h2>FAQ</h2>
            <h3>Should I follow the tool score exactly?</h3>
            <p>No. Treat the score as a signal. Human clarity, correct information and useful examples matter more.</p>
            <h3>How often should I recheck a page?</h3>
            <p>Recheck after major edits, layout changes or when you add new internal links.</p>
          </section>
        </article>
        <aside class="cz-aside">
          <div class="cz-guide-card">
            <h2>Related tools</h2>
            <ul>${toolLinks}</ul>
          </div>
          <div class="cz-guide-card">
            <h2>Next</h2>
            <p>Run the relevant tool, fix the biggest issue, then return to this checklist before publishing.</p>
            <a class="cz-btn primary" href="/tools/">Open tools</a>
          </div>
        </aside>
      </div>
    </section>`
  });
}

for (const tool of toolData) {
  write(path.join(root, "tools", tool.slug, "index.html"), toolPage(tool));
}

for (const guide of guideData) {
  write(path.join(root, "guides", guide.slug, "index.html"), guidePage(guide));
}

fs.mkdirSync(path.join(root, "assets", "og"), { recursive: true });
write(path.join(root, "assets", "og", "default.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0b0f19"/><rect x="70" y="70" width="1060" height="490" rx="32" fill="#111827" stroke="#22d3ee" stroke-opacity=".55"/><text x="120" y="180" fill="#22d3ee" font-family="Arial" font-size="44" font-weight="700">Clickoz</text><text x="120" y="320" fill="white" font-family="Arial" font-size="76" font-weight="800">Free Browser Tools</text><text x="120" y="400" fill="#cbd5e1" font-family="Arial" font-size="32">SEO, writing and developer utilities</text></svg>`);

const urls = ["/", "/tools/", "/guides/", "/updates/", "/privacy/", "/terms/", "/contact/"];
for (const dir of fs.readdirSync(path.join(root, "tools"), { withFileTypes: true })) {
  if (dir.isDirectory() && fs.existsSync(path.join(root, "tools", dir.name, "index.html"))) urls.push(`/tools/${dir.name}/`);
}
for (const dir of fs.readdirSync(path.join(root, "guides"), { withFileTypes: true })) {
  if (dir.isDirectory() && fs.existsSync(path.join(root, "guides", dir.name, "index.html"))) urls.push(`/guides/${dir.name}/`);
}
write(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>https://clickoz.com${url}</loc><lastmod>2026-05-16</lastmod></url>`).join("\n")}\n</urlset>\n`);
write(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: https://clickoz.com/sitemap.xml\n`);

console.log(`Wrote ${toolData.length} targeted tool pages and ${guideData.length} improved guide pages.`);
