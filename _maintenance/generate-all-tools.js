const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ORIGIN, CSP: csp, PERMISSIONS_POLICY, CORE_URLS, asset } = require("./cms-config");
const { BRAND, INDEX_ROBOTS, iconLinks, logoMarkup, normalizeRobots, publisherNode } = require("./brand-assets");

const root = path.resolve(__dirname, "..");

/**
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, features?: string[], relatedTools?: string[], relatedGuides?: string[], canonicalSlug: string }} CmsTool
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, tool: string }} CmsGuide
 */

function loadCMS() {
  const code = fs.readFileSync(path.join(root, "assets", "cms-registry.js"), "utf8");
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.window.ClickozCMS;
}

const cms = loadCMS();
const bySlug = Object.fromEntries(cms.tools.map((tool) => [tool.slug, tool]));
const guidesBySlug = Object.fromEntries(cms.guides.map((guide) => [guide.slug, guide]));
const entity = {
  lock: "&#128274;",
  bolt: "&#9889;",
  copy: "&#128203;",
  mobile: "&#128241;",
  puzzle: "&#129513;",
  tool: "&#128736;&#65039;",
  check: "&#9989;",
  search: "&#128269;",
  write: "&#9997;&#65039;",
  dev: "&#129514;",
  shield: "&#128737;&#65039;",
  play: "&#9654;&#65039;",
  spark: "&#10024;",
  book: "&#128218;",
  chart: "&#128200;",
  link: "&#128279;",
  target: "&#127919;",
  brush: "&#127912;",
  calendar: "&#128197;",
  money: "&#128176;",
  robot: "&#129302;",
  id: "&#127380;",
  time: "&#9201;&#65039;",
  globe: "&#127760;",
  tag: "&#127991;&#65039;",
  hash: "#&#65039;&#8419;",
  eye: "&#128065;&#65039;"
};

const categoryUI = {
  seo: { key: "seo", label: "SEO", title: "SEO Tools", icon: entity.search, intro: "Start with the page problem: snippet, slug, keyword balance, readability or publishing check." },
  writing: { key: "text", label: "Text", title: "Writing Tools", icon: entity.write, intro: "Clean pasted text, measure limits and make drafts easier to scan before they leave your browser." },
  dev: { key: "dev", label: "Dev", title: "Developer Utilities", icon: entity.dev, intro: "Format, encode, decode and inspect payloads without opening a heavier app for a small job." },
  web: { key: "web", label: "Web", title: "Web & Security Tools", icon: entity.shield, intro: "Check domains, HTTP, IP ranges, passwords, IDs, timestamps and crawl files quickly." },
  tracking: { key: "tracking", label: "Tracking", title: "Marketing & Tracking Tools", icon: entity.chart, intro: "Build clean campaign links before posts, descriptions, bios or newsletters start sending traffic." },
  youtube: { key: "youtube", label: "YouTube", title: "YouTube Creator Tools", icon: entity.play, intro: "Package uploads as one flow: title, thumbnail, description, hashtags, tags and tracking." },
  socialai: { key: "socialai", label: "Social", title: "Social & AI Creator Tools", icon: entity.spark, intro: "Shape creator ideas into platform-native hooks, posts, scripts, disclosures and reusable assets." }
};

const sectionOrder = ["seo", "writing", "dev", "web", "tracking", "youtube", "socialai"];

const featureIcon = {
  "Browser-only": entity.lock,
  "Live counts": entity.bolt,
  "Copy results": entity.copy,
  "Copy-ready": entity.copy,
  "Mobile-ready": entity.mobile,
  "Snippet": entity.tag,
  "Preview": entity.eye,
  "Search intent": entity.search,
  "CTR": entity.chart,
  "Keyword": entity.search,
  "Hook": entity.target,
  "Creator": entity.play,
  "Thumbnail": entity.brush,
  "Tracking": entity.chart,
  "Campaigns": entity.chart,
  "Crawl rules": entity.robot,
  "UUID v4": entity.id,
  "Unix time": entity.time,
  "DNS records": entity.globe,
  "Latency": entity.bolt,
  "Strong passwords": entity.shield,
  "AI disclosure": entity.robot,
  "Sponsorship": entity.money,
  "Calendar": entity.calendar
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function plain(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sentence(value) {
  const text = plain(value);
  return text.endsWith(".") ? text : `${text}.`;
}

function clipMeta(value, limit = 158) {
  const text = plain(value);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const clean = cut.slice(0, Math.max(0, cut.lastIndexOf(" "))).replace(/[,.:-]+$/, "");
  return clean || cut.trim();
}

function abs(url) {
  return `${ORIGIN}${url}`;
}

function canonicalFor(tool) {
  const primary = bySlug[tool.canonicalSlug];
  return abs(primary ? primary.url : tool.url);
}

function slugOf(url) {
  return (url || "").split("/").filter(Boolean).pop() || "";
}

function mkdirForUrl(url) {
  fs.mkdirSync(path.join(root, url.replace(/^\//, "")), { recursive: true });
}

function writeUrl(url, html) {
  const dir = path.join(root, url.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function titleCaseSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function toolIcon(tool) {
  if (/youtube|video|short|tiktok|reel|ugc|podcast/i.test(tool.slug)) return entity.play;
  if (/instagram|caption|bio|hashtag|pinterest|reddit|linkedin|thread|social/i.test(tool.slug)) return entity.spark;
  if (/password|robots|dns|http|ip|subnet/i.test(tool.slug)) return entity.shield;
  if (/json|regex|base64|url|entity|uuid|timestamp|diff/i.test(tool.slug)) return entity.dev;
  if (/word|character|readability|text|whitespace/i.test(tool.slug)) return entity.write;
  return categoryUI[tool.category]?.icon || entity.tool;
}

function featureChip(feature) {
  return `<span><b aria-hidden="true">${featureIcon[feature] || entity.spark}</b>${esc(feature)}</span>`;
}

function trustPills(tool) {
  const items = [...(tool.features || []).slice(0, 3), "Mobile-ready"].slice(0, 4);
  return items.map((item) => `<span class="cms-pill"><span class="cms-pill-icon" aria-hidden="true"></span>${esc(item)}</span>`).join("\n");
}

function workflowCopy(tool) {
  const title = tool.title;
  const lower = title.toLowerCase();
  const workflowBySlug = {
    "word-counter": {
      problem: "You need to know if a draft is too short, too long or hard to scan before it is published.",
      how: "Paste the text, read the live counts, then use reading time and sentence length to decide what to trim.",
      check: "Check words, characters, sentence length, paragraphs and reading time before copying the final text."
    },
    "html-entity-encoder-decoder": {
      problem: "A snippet contains characters like <, >, &, quotes or apostrophes that can break HTML.",
      how: "Paste the raw or escaped snippet, run the encoder/decoder, then copy the safe version for the right context.",
      check: "Use encoded output inside markup and decoded output only when you are reading or cleaning text."
    },
    "entity-encoder": {
      problem: "A text fragment needs to be placed inside HTML without breaking the page.",
      how: "Paste the fragment, convert special characters to entities, then test the result in the final markup.",
      check: "Watch quotes, ampersands and angle brackets because they are the characters that usually break snippets."
    },
    "json-formatter": {
      problem: "A JSON payload is compressed, hard to read or possibly invalid.",
      how: "Paste the payload, format it, then inspect the structure before copying it into code, docs or logs.",
      check: "If the tool reports an error, fix the exact syntax issue before trusting the payload."
    },
    "meta-tags": {
      problem: "A title or description may look good in the editor but fail in the search result.",
      how: "Write the title and description, check length and intent, then move to SERP preview.",
      check: "Make the title useful first, then make the description support the click."
    },
    "youtube-shorts-hook-analyzer": {
      problem: "The first seconds of a Short do not clearly tell viewers why they should keep watching.",
      how: "Paste the hook or video idea, score it, then rewrite the opening with a stronger promise.",
      check: "Keep the hook specific, visual and easy to understand without context."
    },
    "thumbnail-text-readability-checker": {
      problem: "Thumbnail text may be unreadable on mobile even if it looks fine on desktop.",
      how: "Paste the thumbnail phrase, check word count and clarity, then reduce it to the strongest words.",
      check: "Use fewer words, high contrast and one clear visual promise."
    },
    "ai-disclosure-checker": {
      problem: "A post, video or article uses AI and needs a clear disclosure before publishing.",
      how: "Paste the draft or use case, generate disclosure options, then choose the clearest one for the platform.",
      check: "Disclose what was AI-assisted without overexplaining or hiding the fact."
    },
    "sponsorship-rate-calculator": {
      problem: "A creator offer needs a realistic sponsor price range before negotiation.",
      how: "Enter average views, engagement and deliverables, then use the range as a starting point.",
      check: "Adjust the estimate for niche, usage rights, exclusivity and production effort."
    },
    "instagram-bio-optimizer": {
      problem: "The profile does not explain who you are, who should follow you, or why someone should contact you.",
      how: "Paste the current bio or account idea, set niche, audience, goal and CTA, then copy the version with the clearest profile promise.",
      check: "Keep the bio short and specific: identity, value, audience and one next action."
    },
    "instagram-caption-generator": {
      problem: "The caption is decorative but does not give context, value or a reason to interact.",
      how: "Paste the photo or post context, generate a caption, then keep the first line, CTA and hashtags aligned with the post.",
      check: "Make the first line explain the visual, then use one CTA and a small focused hashtag set."
    }
  };
  if (workflowBySlug[tool.slug]) return workflowBySlug[tool.slug];

  const byCategory = {
    seo: {
      problem: `The page needs a cleaner search asset before publishing: title, snippet, keyword use, URL or metadata.`,
      how: `Paste the real page draft, run ${lower}, then compare the output with the related SEO guide.`,
      check: "Review intent, length, wording and final output before publishing."
    },
    writing: {
      problem: `The text needs a fast quality check before it is sent, published or reused.`,
      how: `Paste the real text, run ${lower}, then use the result to cut, clean or restructure the draft.`,
      check: "Check mobile readability, structure and final wording before copying."
    },
    dev: {
      problem: `A payload, URL, token or snippet is hard to inspect and needs a reliable conversion.`,
      how: "Paste the broken or raw input, run the tool, then copy the formatted, encoded or decoded output.",
      check: "Validate the result in the original context before using it in production."
    },
    web: {
      problem: `A technical value, site signal or security utility needs a quick browser-side check.`,
      how: "Enter the target value, run the utility, then use the related guide for the operational decision.",
      check: "Use the output as a quick diagnostic and confirm critical changes with production tools."
    },
    tracking: {
      problem: "A campaign link needs clean naming before traffic starts and analytics become messy.",
      how: `Enter the destination and campaign values, run ${lower}, then copy the final link into the post or description.`,
      check: "Check source, medium and campaign names before publishing because analytics cleanup is expensive later."
    },
    youtube: {
      problem: `The upload asset needs a stronger title, hook, description or metadata structure before publishing.`,
      how: "Paste the topic or draft, generate options, then refine the hook, clarity and next action.",
      check: "Check the first line, mobile scan value and search angle before publishing."
    },
    socialai: {
      problem: `The creator asset needs a clearer hook, format, platform fit or monetization angle.`,
      how: "Paste the idea, choose the platform, generate the structure, then edit it to match your voice.",
      check: "Keep one clear promise, one platform-specific format and one next action."
    }
  };
  return byCategory[tool.category] || byCategory.writing;
}

function explainTool(tool) {
  const specific = {
    "word-counter": {
      what: "Word Counter measures the length and structure of a draft: words, characters, sentences, paragraphs and reading time. It is useful for SEO copy, captions, essays, forms and scripts.",
      when: "Use it before publishing or submitting text with limits. It helps you decide whether to trim, expand or split the copy."
    },
    "html-entity-encoder-decoder": {
      what: "HTML Entity Encoder Decoder converts unsafe characters into HTML entities and can also decode escaped text back into readable form.",
      when: "Use it when pasted text breaks markup, when attributes contain quotes, or when you need to inspect escaped HTML safely."
    },
    "json-formatter": {
      what: "JSON Formatter validates JSON and turns compressed payloads into readable structured output.",
      when: "Use it while debugging API responses, config files, logs, tracking payloads or token-like data."
    },
    "youtube-shorts-hook-analyzer": {
      what: "YouTube Shorts Hook Analyzer checks whether a short-form opening has enough clarity, tension and reason to keep watching.",
      when: "Use it before filming, editing or publishing a Short so the first seconds are not vague."
    },
    "sponsorship-rate-calculator": {
      what: "Sponsorship Rate Calculator estimates a practical creator price range from views, engagement and deliverables.",
      when: "Use it before replying to a brand deal, building a media kit or comparing offer value."
    },
    "instagram-bio-optimizer": {
      what: "Instagram Bio Optimizer rebuilds a profile bio around niche, audience, trust and CTA. It creates concise options that fit profile intent instead of adding generic hype.",
      when: "Use it when the profile sounds vague, does not attract collaborations, or does not tell visitors why to follow, click or contact you."
    },
    "instagram-caption-generator": {
      what: "Instagram Caption Generator turns a photo or post idea into a caption with a hook, useful context, CTA options and focused hashtags.",
      when: "Use it before posting when the image is ready but the first line, save/comment prompt or hashtag structure still feels weak."
    }
  };
  if (specific[tool.slug]) return specific[tool.slug];

  const category = {
    seo: {
      what: `${tool.title} helps prepare one SEO asset with a clear output instead of forcing you to judge the page by eye.`,
      when: "Use it before publishing a page, updating a snippet, choosing a URL or checking whether the copy matches search intent."
    },
    writing: {
      what: `${tool.title} helps clean, measure or restructure text so it is easier to read and reuse.`,
      when: "Use it when a draft feels messy, too long, hard to scan or not ready to paste into its final place."
    },
    dev: {
      what: `${tool.title} handles one technical conversion or inspection task in the browser.`,
      when: "Use it while debugging payloads, URLs, encoded text, snippets, configs or logs."
    },
    web: {
      what: `${tool.title} gives a fast operational check for common web, security or technical setup tasks.`,
      when: "Use it before changing DNS, testing a website, generating IDs, creating crawl files or preparing secure values."
    },
    tracking: {
      what: `${tool.title} helps create measurable links and campaign structures without messy parameters.`,
      when: "Use it before publishing creator descriptions, newsletter links, ads, bios or campaign pages."
    },
    youtube: {
      what: `${tool.title} helps turn a creator idea into a publishable YouTube asset.`,
      when: "Use it before upload when the title, thumbnail, description, hashtags, tags or community post still needs structure."
    },
    socialai: {
      what: `${tool.title} helps prepare a platform-specific creator asset with a cleaner hook, format or business angle.`,
      when: "Use it when a post, caption, script, disclosure, calendar or creator offer needs to be clearer before publishing."
    }
  };
  return category[tool.category] || category.writing;
}

function guideTitle(slug) {
  return guidesBySlug[slug]?.title || titleCaseSlug(slug);
}

function relatedTools(tool) {
  return (tool.relatedTools || []).slice(0, 3).map((slug) => bySlug[slug]).filter(Boolean);
}

function relatedGuides(tool) {
  return (tool.relatedGuides || []).slice(0, 3).map((slug) => guidesBySlug[slug] || { slug, title: guideTitle(slug), url: `/guides/${slug}/` });
}

const categoryBriefs = {
  seo: {
    bestFor: "Finishing a page asset before publishing",
    useWhen: "The page exists, but the snippet, URL, wording or search intent still needs a final check.",
    exampleInput: "A draft title, description, URL, paragraph or keyword target from the page you are about to publish.",
    whatYouGet: "A clearer SEO output, visible warnings and the next tool to validate the decision.",
    timeSaved: "Avoid rewriting the same page asset in multiple tabs.",
    trust: "No account needed. Keep the workflow lightweight and review the output before publishing."
  },
  writing: {
    bestFor: "Cleaning or measuring copy before it leaves the browser",
    useWhen: "A draft feels too long, hard to scan, badly pasted or not ready for a client, page or caption.",
    exampleInput: "A paragraph, caption, intro, bio, client note or pasted AI draft.",
    whatYouGet: "A readable text result with length, structure or cleanup guidance.",
    timeSaved: "Fix the small copy problem before opening a heavier editor.",
    trust: "Text utilities run in the page and restore your last input locally."
  },
  dev: {
    bestFor: "Inspecting a payload, value or snippet without losing context",
    useWhen: "JSON, URLs, Base64, HTML text or regex input looks correct but breaks after copy-paste.",
    exampleInput: "A real payload, query value, encoded string, escaped snippet or test text.",
    whatYouGet: "Formatted, encoded, decoded or matched output with copy-ready sections.",
    timeSaved: "Debug the exact small value without switching to a full IDE.",
    trust: "Browser-first where possible. Always test technical output in the original context."
  },
  web: {
    bestFor: "Quick operational checks before a technical change",
    useWhen: "You need a domain, HTTP, IP, timestamp, password, UUID, color or crawl-file result now.",
    exampleInput: "A public URL, domain, IPv4 range, timestamp, color value or crawl rule.",
    whatYouGet: "A focused diagnostic result with the values that are safe to copy.",
    timeSaved: "Complete the lookup or generated value without opening a separate dashboard.",
    trust: "Network checks only contact the target or resolver needed for that check."
  },
  tracking: {
    bestFor: "Building campaign links before traffic starts",
    useWhen: "A link needs clean source, medium and campaign naming for YouTube, social, ads or email.",
    exampleInput: "Destination URL plus source, medium and campaign names.",
    whatYouGet: "A trackable URL and a naming rule you can keep consistent.",
    timeSaved: "Avoid analytics cleanup caused by messy parameters.",
    trust: "No fake attribution. You control the final URL before posting."
  },
  youtube: {
    bestFor: "Packaging a YouTube upload from idea to publishable assets",
    useWhen: "The video exists, but title, thumbnail, description, hashtags, tags or next action still feel weak.",
    exampleInput: "Video topic, rough title, outline, thumbnail phrase or upload notes.",
    whatYouGet: "Creator-ready angles and the next upload tool to keep the package aligned.",
    timeSaved: "Finish the upload assets in one connected flow.",
    trust: "Outputs are draft assets. Keep the version that matches the real video promise."
  },
  socialai: {
    bestFor: "Turning a creator idea into a platform-specific asset",
    useWhen: "A post, caption, hook, script, disclosure, content plan or creator offer needs a cleaner first version.",
    exampleInput: "Content idea, platform, audience, CTA, draft caption or offer details.",
    whatYouGet: "A structured draft with platform fit, copy-ready sections and a next step.",
    timeSaved: "Move from rough idea to usable draft without starting from a blank page.",
    trust: "Edit the output for your voice and keep claims grounded in your real offer."
  }
};

const specificBriefs = {
  "meta-tags": {
    bestFor: "Finishing an SEO title and meta description before publishing",
    useWhen: "Your snippet exists but may be too long, vague or weak in the search result.",
    exampleInput: "Clickoz Tools | Fast browser utilities for SEO, writing and creators.",
    whatYouGet: "Length status, intent guidance and a snippet you can test in SERP Preview.",
    timeSaved: "Fix title and description in one pass instead of rewriting them after launch."
  },
  "serp-preview": {
    bestFor: "Seeing how a search result reads before the page goes live",
    useWhen: "The title and description look fine in the CMS, but you need the combined snippet view.",
    exampleInput: "URL, SEO title and meta description for the page you are about to publish.",
    whatYouGet: "A visual snippet, truncation risk and next copy decision."
  },
  "slug-generator": {
    bestFor: "Turning a page title into a durable URL slug",
    useWhen: "The URL needs to be short, readable and stable before the page is indexed.",
    exampleInput: "How to Write Better Meta Titles in 2026",
    whatYouGet: "Primary and short slug options with a simple durability recommendation."
  },
  "keyword-density": {
    bestFor: "Spotting repeated terms before SEO copy sounds stuffed",
    useWhen: "A draft may repeat one phrase too often or miss natural topic support.",
    exampleInput: "A paragraph, product description or guide section.",
    whatYouGet: "Top terms, density signals and a practical repetition warning."
  },
  "word-counter": {
    bestFor: "Checking length, structure and reading time before sending a draft",
    useWhen: "You need to know whether text is too short, too long or too dense.",
    exampleInput: "A page intro, script, caption, client draft or article section.",
    whatYouGet: "Words, characters, sentences, paragraphs, reading time and next edit advice."
  },
  "readability-analyzer": {
    bestFor: "Finding heavy sentences and mobile scan problems",
    useWhen: "The draft contains the right idea but feels slow to read.",
    exampleInput: "A real section from a page, post, guide or email.",
    whatYouGet: "Readability score, sentence pressure and practical rewrite guidance."
  },
  "whitespace-cleaner": {
    bestFor: "Cleaning pasted AI, PDF, doc or CMS text",
    useWhen: "The copy has extra spaces, broken lines or messy paragraphs.",
    exampleInput: "Pasted text with irregular spacing, line breaks and duplicate blanks.",
    whatYouGet: "Normalized text you can copy into the final editor."
  },
  "json-formatter": {
    bestFor: "Reading broken or compressed JSON before debugging",
    useWhen: "A payload, config or log entry is hard to inspect or may be invalid.",
    exampleInput: "{\"status\":\"ok\",\"items\":[{\"name\":\"Clickoz\",\"tools\":66}]}",
    whatYouGet: "Valid formatted JSON, type, character count and a copy-ready block."
  },
  "url-encoder": {
    bestFor: "Fixing query values and special characters in links",
    useWhen: "Spaces, symbols or pasted parameters break a URL.",
    exampleInput: "campaign name=spring launch & source=instagram",
    whatYouGet: "Encoded value, decoded attempt and a rule for where to use it."
  },
  "base64": {
    bestFor: "Inspecting Base64 text or token-like payloads safely",
    useWhen: "You need to encode/decode text without treating it as encryption.",
    exampleInput: "Clickoz premium tools",
    whatYouGet: "Encoded text, decoded attempt and a security note."
  },
  "utm-builder": {
    bestFor: "Creating clean campaign links before publishing",
    useWhen: "A post, video description, bio or newsletter link needs measurable tracking.",
    exampleInput: "https://clickoz.com/ with source youtube, medium description, campaign launch",
    whatYouGet: "Final URL, naming rule and clean source/medium/campaign values."
  },
  "youtube-title-generator": {
    bestFor: "Choosing title angles that match the video promise",
    useWhen: "The topic is clear but the click promise, curiosity or keyword angle needs work.",
    exampleInput: "A rough video topic, target viewer and core outcome.",
    whatYouGet: "Title options you can connect to thumbnail, description and tracking."
  },
  "youtube-description-generator": {
    bestFor: "Building the first lines, links and CTA block for an upload",
    useWhen: "The title is chosen but the description still lacks structure.",
    exampleInput: "Video topic, key points, CTA link and chapter notes.",
    whatYouGet: "A scan-friendly description draft with next upload steps."
  }
};

function toolBrief(tool) {
  const base = {
    ...(categoryBriefs[tool.category] || categoryBriefs.writing),
    ...(specificBriefs[tool.canonicalSlug] || specificBriefs[tool.slug] || {})
  };
  const rel = relatedTools(tool);
  const guide = relatedGuides(tool)[0];
  return {
    ...base,
    nextTools: rel,
    nextToolsText: rel.map((item) => item.title).join(" -> ") || "Browse the matching Clickoz cluster",
    guideText: guide ? guide.title : "Open the related Clickoz guide"
  };
}

function nav(active) {
  const current = (name) => active === name ? ` class="active" aria-current="page"` : "";
  return `<nav class="nav" aria-label="Primary navigation" id="topNav">
    <div class="container nav-inner">
      <a class="logo" href="/" aria-label="Clickoz Home">
        ${logoMarkup()}
      </a>
      <div class="nav-links" aria-label="Sections">
        <a href="/"${current("home")}>Home</a>
        <a href="/tools/"${current("tools")}>Tools</a>
        <a href="/guides/"${current("guides")}>Guides</a>
        <a href="/updates/"${current("updates")}>Updates</a>
      </div>
      <div class="spacer"></div>
    </div>
  </nav>`;
}

function footer() {
  return `<footer class="footer">
    <div class="container footer-grid">
      <div><h4>Clickoz</h4><div class="footer-links"><a href="/about/">About</a><a href="/tools/">Tools</a><a href="/guides/">Guides</a><a href="/updates/">Updates</a></div></div>
      <div><h4>Tool hubs</h4><div class="footer-links"><a href="/tools/seo-tools/">SEO Tools</a><a href="/tools/youtube-tools/">YouTube Tools</a><a href="/tools/writing-tools/">Writing Tools</a><a href="/guides/creator/">Creator Guides</a></div></div>
      <div><h4>Popular tools</h4><div class="footer-links"><a href="/tools/word-counter/">Word Counter</a><a href="/tools/meta-tags/">Meta Tags</a><a href="/tools/json-formatter/">JSON Formatter</a><a href="/tools/youtube-title-generator/">YouTube Titles</a></div></div>
      <div><h4>Legal</h4><div class="footer-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/contact/">Contact</a><a href="/404/">404</a></div></div>
    </div>
    <div class="container" style="margin-top:14px"><hr class="sep" /><div style="text-align:center;font-size:13px;color:rgba(242,242,255,.60)">&copy; 2026 Clickoz &middot; Fast browser tools for SEO, writing, developers and creators</div></div>
  </footer>`;
}

function routeFinalStrip(label = "Clickoz route") {
  return `<section class="route-final-strip" aria-label="${esc(label)} operating route">
      <article><span>01</span><strong>Search by problem</strong><p>Start from the messy input or task, not from a long category list.</p></article>
      <article><span>02</span><strong>Use the exact tool</strong><p>Open the focused utility that matches the job you need to finish.</p></article>
      <article><span>03</span><strong>Copy a clean result</strong><p>Keep output, copy controls and checks in one predictable surface.</p></article>
      <article><span>04</span><strong>Read when needed</strong><p>Use guides only when the copied result needs a better decision behind it.</p></article>
      <article><span>05</span><strong>Request gaps</strong><p>Ask for a missing tool, fix or guide when the current route does not cover the job.</p></article>
    </section>`;
}

function requestMegaCta(title = "Missing a tool, guide or workflow?", copy = "Send the exact job you are trying to finish. Clickoz requests go through the validated contact form and email fallback.") {
  return `<section class="request-mega-cta" aria-label="Request a Clickoz tool">
      <div>
        <p class="guide-kicker">CONTACT / REQUEST</p>
        <h2>${esc(title)}</h2>
        <p>${esc(copy)}</p>
      </div>
      <a class="btn btn-accent" href="/contact/#request">Request a tool</a>
    </section>`;
}

function head({ title, description, canonical, og = BRAND.defaultOg, extraCss = "", jsonLd = "", robots = INDEX_ROBOTS }) {
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeRobots = esc(normalizeRobots(robots));
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Permissions-Policy" content="${PERMISSIONS_POLICY}" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta name="robots" content="${safeRobots}" />
  <meta name="googlebot" content="${safeRobots}" />
  <meta name="application-name" content="${BRAND.name}" />
  <meta name="apple-mobile-web-app-title" content="${BRAND.name}" />
  <meta name="theme-color" content="${BRAND.themeColor}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:site_name" content="Clickoz" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${esc(`${ORIGIN}${og}`)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${esc(`${ORIGIN}${og}`)}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
  ${iconLinks()}
  <script>(function(){try{var s=JSON.parse(localStorage.getItem("clickoz_accent")||"null");var a=s&&s.a1?s.a1:"#22d3ee";var b=s&&s.a2?s.a2:"#06b6d4";var h=String(a).replace("#","");var r="34,211,238";if(h.length===3)r=[h[0]+h[0],h[1]+h[1],h[2]+h[2]].map(function(x){return parseInt(x,16)}).join(",");if(h.length===6)r=[h.slice(0,2),h.slice(2,4),h.slice(4,6)].map(function(x){return parseInt(x,16)}).join(",");document.documentElement.style.setProperty("--accent",a);document.documentElement.style.setProperty("--accent2",b);document.documentElement.style.setProperty("--accent-rgb",r);document.documentElement.style.setProperty("--cz-accent",a);document.documentElement.style.setProperty("--cz-accent2",b);document.documentElement.style.setProperty("--cz-accent-rgb",r)}catch(e){}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${asset("/assets/site.css", "siteCss")}" />
  ${extraCss}
  <link rel="stylesheet" href="${asset("/assets/clickoz-premium.css", "clickozPremiumCss")}" />
  <link rel="stylesheet" href="${asset("/assets/cms-final.css", "cmsFinal")}" />
  ${jsonLd}
</head>`;
}

function scripts(extra = "") {
  return `<script src="${asset("/assets/cms-registry.js", "cmsRegistry")}" defer></script>
  <script src="${asset("/assets/cms-schema.js", "cmsSchema")}" defer></script>
  <script src="${asset("/assets/cms-enhance.js", "cmsEnhance")}" defer></script>
  <script src="${asset("/assets/site.js", "siteJs")}" defer></script>
  <script src="${asset("/assets/clickoz-premium.js", "clickozPremiumJs")}" defer></script>
  ${extra}`;
}

function toolJsonLd(tool) {
  const flow = workflowCopy(tool);
  const relTools = relatedTools(tool);
  const relGuides = relatedGuides(tool);
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Clickoz", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${ORIGIN}/tools/` },
          { "@type": "ListItem", position: 3, name: tool.title, item: abs(tool.url) }
        ]
      },
      {
        "@type": "WebApplication",
        name: tool.title,
        url: abs(tool.url),
        description: tool.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: publisherNode(ORIGIN),
        image: `${ORIGIN}${BRAND.logoPng}`,
        featureList: (tool.features || []).concat(["Examples", "Related tools", "Related guides", "Copy-ready output"])
      },
      {
        "@type": "HowTo",
        name: `How to use ${tool.title}`,
        description: flow.problem,
        step: [
          { "@type": "HowToStep", position: 1, name: "Understand the problem", text: flow.problem },
          { "@type": "HowToStep", position: 2, name: "Run the tool", text: flow.how },
          { "@type": "HowToStep", position: 3, name: "Review before copying", text: flow.check }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: `Does ${tool.title} upload my data?`, acceptedAnswer: { "@type": "Answer", text: "Most Clickoz tools run in the browser. Network diagnostic tools only contact the target or public resolver needed for the check." } },
          { "@type": "Question", name: `What should I do after using ${tool.title}?`, acceptedAnswer: { "@type": "Answer", text: `Review the output, copy the useful version, then continue with related tools such as ${relTools.slice(0, 2).map((item) => item.title).join(" or ")} and guides such as ${relGuides.slice(0, 2).map((item) => item.title).join(" or ")}.` } }
        ]
      }
    ]
  })}</script>`;
}

function queryItems(tool) {
  const base = [
    `${tool.title} online`,
    `free ${tool.title}`,
    `${tool.title} example`,
    `${tool.title} checker`,
    `${tool.title} generator`,
    `${tool.title} for ${categoryUI[tool.category]?.label || "workflows"}`
  ];
  const category = categoryUI[tool.category]?.label || "tool";
  return [...new Set(base.concat((tool.features || []).map((f) => `${f} ${category} tool`)))].slice(0, 12);
}

function queryChips(tool) {
  return queryItems(tool)
    .map((q) => `<span>${esc(q.toLowerCase())}</span>`).join("\n");
}

function faqHtml(tool, brief) {
  return [
    [
      `Does ${tool.title} upload my data?`,
      "Text tools run on the page and do not require an account. Diagnostic tools only contact the public resolver or target needed for that specific check."
    ],
    [
      "Can I use the output directly?",
      `Use the result as a ready draft, then review it in the place where it will be published. ${sentence(brief.whatYouGet)}`
    ],
    [
      "Why are examples included?",
      "Examples remove the blank-page problem. They show the expected input shape and help you test the tool before pasting real work."
    ]
  ].map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("\n");
}

function toolPage(tool) {
  const flow = workflowCopy(tool);
  const info = explainTool(tool);
  const brief = toolBrief(tool);
  const title = `${tool.title} - Free Browser Tool | Clickoz`;
  const description = clipMeta(`${tool.title}: ${sentence(brief.bestFor)} ${sentence(brief.whatYouGet)} Runs in your browser with no signup or upload.`);
  const relTools = relatedTools(tool);
  const relGuides = relatedGuides(tool);
  const relToolLinks = relTools.map((item) => `<a href="${esc(item.url)}">${toolIcon(item)} ${esc(item.title)}</a>`).join("\n");
  const relGuideLinks = relGuides.map((item) => `<a href="${esc(item.url)}">${entity.book} ${esc(item.title)}</a>`).join("\n");
  const searchTasks = queryChips(tool);
  return `<!doctype html>
<html lang="en">
${head({
  title,
  description,
  canonical: canonicalFor(tool),
  extraCss: `<link rel="stylesheet" href="${asset("/tools/cms-tools.css", "cmsToolsCss")}" />`,
  jsonLd: toolJsonLd(tool)
})}
<body class="bigtext cms-tool-body" data-tool-slug="${esc(tool.slug)}">
  <div id="clickozParticles" aria-hidden="true"></div>
  <canvas id="spaceParticles" aria-hidden="true"></canvas>
  <div class="__grain" aria-hidden="true"></div>
  ${nav("tools")}

  <main class="section container cms-tool-page">
    <div class="cms-tool-hero">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span>&rsaquo;</span><a href="/tools/">Tools</a><span>&rsaquo;</span><span aria-current="page">${esc(tool.title)}</span>
      </nav>
      <h1 class="cms-tool-title">${esc(tool.title)}</h1>
      <p class="cms-tool-sub">${esc(tool.description)}</p>
      <div class="cms-tool-trust" aria-label="Key benefits">
        ${trustPills(tool)}
      </div>
    </div>

    <section class="cms-tool-brief cms-box-signal" aria-label="${esc(tool.title)} quick guide">
      <article><strong><span class="cms-brief-icon" aria-hidden="true">01</span>Problem it solves</strong><span>${esc(flow.problem)}</span></article>
      <article><strong><span class="cms-brief-icon" aria-hidden="true">02</span>How to use it</strong><span>${esc(flow.how)}</span></article>
      <article><strong><span class="cms-brief-icon" aria-hidden="true">03</span>Check before copying</strong><span>${esc(flow.check)}</span></article>
    </section>

    <section class="cms-tool-panel cms-box-action" id="tool-app" data-tool-app="${esc(tool.slug)}" aria-label="${esc(tool.title)} app">
      <div class="cms-tool-grid">
        <div class="cms-tool-app cms-box-action">
          <div class="cms-example-box">
            <h3>Examples</h3>
            <pre></pre>
            <div class="cms-example-options" aria-label="Example inputs"></div>
          </div>
          <div class="cms-form-grid" aria-label="${esc(tool.title)} inputs"></div>
          <div class="cms-tool-actions">
            <button class="btn primary" type="button" data-action="run">${entity.bolt} Run tool</button>
            <button class="btn ghost" type="button" data-action="copy">${entity.copy} Copy result</button>
            <button class="btn ghost" type="button" data-action="clear">${entity.spark} Clear input</button>
          </div>
        </div>
        <aside class="cms-result-card cms-box-action" aria-label="Result">
          <h3>Result</h3>
          <p class="cms-result-status">Enter input and run the tool.</p>
          <div class="cms-metrics"></div>
          <div class="cms-output" role="region" aria-live="polite"></div>
        </aside>
      </div>
    </section>

    <section class="cms-related cms-box-flow" aria-label="${esc(tool.title)} related tools and guides">
      <div class="cms-related-box cms-box-flow">
        <h3>Related tools</h3>
        <div class="cms-related-links">${relToolLinks || `<a href="/tools/">${entity.tool} Browse all tools</a>`}</div>
      </div>
      <div class="cms-related-box cms-box-flow">
        <h3>Related guides</h3>
        <div class="cms-related-links">${relGuideLinks || `<a href="/guides/">${entity.book} Browse all guides</a>`}</div>
      </div>
    </section>

    <section class="cms-ops-strip cms-box-support" aria-label="${esc(tool.title)} quality signals">
      <article><span>${entity.shield}</span><strong>Input safety</strong><p>Outputs are rendered through the Clickoz safe result layer, with script-like markup blocked from executable output.</p></article>
      <article><span>${entity.bolt}</span><strong>Faster task flow</strong><p>Examples load instantly, inputs auto-run after changes and results stay copy-ready.</p></article>
      <article><span>${entity.search}</span><strong>Search support</strong><p>This page has canonical URL, schema, FAQs, related tools, related guides and clear task intent.</p></article>
    </section>

    <section class="cms-info-grid cms-box-support" aria-label="${esc(tool.title)} explanation and FAQ">
      <article class="cms-info-card">
        <h2>What is ${esc(tool.title)}?</h2>
        <p>${esc(info.what)}</p>
      </article>
      <article class="cms-info-card">
        <h2>When should you use it?</h2>
        <p>${esc(info.when)} The related tools and guides are placed directly under the result so the next step is visible without searching again.</p>
      </article>
      <article class="cms-info-card cms-faq">
        <h2>FAQ</h2>
        ${faqHtml(tool, brief)}
      </article>
      <article class="cms-info-card">
        <h2>Useful search intents</h2>
        <p>These phrases describe real tasks users search for. They keep the page focused on problems, not repeated keywords.</p>
        <div class="cms-query-chips">${searchTasks}</div>
      </article>
    </section>
  </main>

  ${footer()}
  ${scripts(`<script src="${asset("/tools/cms-tools.js", "cmsToolsJs")}" defer></script>`)}
</body>
</html>
`;
}

function card(tool) {
  const brief = toolBrief(tool);
  const features = (tool.features || []).slice(0, 3).map(featureChip).join("");
  return `<a class="card tool-card-enhanced" href="${esc(tool.url)}" data-tool-slug="${esc(tool.slug)}">
    <div class="card-top">
      <span class="card-ico" aria-hidden="true">${toolIcon(tool)}</span>
      <div>
        <h3>${esc(tool.title)}</h3>
        <p>${esc(tool.description)}</p>
      </div>
    </div>
    <div class="tool-output-preview">
      <span>Quick job</span>
      <strong>${esc(brief.timeSaved)}</strong>
      <div class="tool-card-flow">
        <p><b>Input</b><span>${esc(brief.exampleInput)}</span></p>
        <p><b>Output</b><span>${esc(brief.whatYouGet)}</span></p>
      </div>
      <em>${esc(brief.bestFor)}</em>
    </div>
    <div class="tool-mini-features">${features}</div>
    <span class="tool-cta">Open ${esc(tool.title)} &rarr;</span>
  </a>`;
}

function toolsJsonLd(items, title, url, description) {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: abs(url),
    description,
    isPartOf: { "@type": "WebSite", name: "Clickoz", url: `${ORIGIN}/` },
    publisher: publisherNode(ORIGIN),
    mainEntity: {
      "@type": "ItemList",
      name: title,
      itemListOrder: "https://schema.org/ItemListUnordered",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: abs(item.url),
        name: item.title
      }))
    }
  })}</script>`;
}

function sectionHtml(category) {
  const ui = categoryUI[category];
  const items = cms.tools.filter((tool) => tool.category === category);
  return `<section class="tool-section" id="${esc(ui.key)}" data-section="${esc(ui.key)}" aria-label="${esc(ui.title)}">
    <div class="section-head">
      <div>
        <div class="section-kicker"><span class="section-ico" aria-hidden="true">${ui.icon}</span><h2 class="section-name">${esc(ui.title)}</h2></div>
        <p class="section-desc">${esc(ui.intro)}</p>
      </div>
      <span class="section-count">${items.length} tools</span>
    </div>
    <div class="cards-grid">${items.map(card).join("\n")}</div>
  </section>`;
}

function toolsIndexPage() {
  const chips = [
    ["all", "All"],
    ["seo", "SEO"],
    ["text", "Text"],
    ["dev", "Dev"],
    ["web", "Web"],
    ["tracking", "Tracking"],
    ["youtube", "YouTube"],
    ["socialai", "Social"]
  ].map(([key, label], index) => `<button class="chip${index === 0 ? " active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("\n");

  return `<!doctype html>
<html lang="en">
${head({
  title: "Free Online Tools for SEO, Writing, YouTube and JSON | Clickoz",
  description: `Search ${cms.tools.length} free browser tools for meta tags, word count, JSON formatting, UTM links, YouTube titles and security checks. No account or upload.`,
  canonical: `${ORIGIN}/tools/`,
  og: "/assets/og/tools.svg",
  extraCss: `<link rel="stylesheet" href="${asset("/tools/tools.css", "toolsCss")}" />`,
  jsonLd: toolsJsonLd(cms.tools, "Clickoz Tools", "/tools/", "Free online tools for SEO, writing, developers, web checks and creators.")
})}
<body class="bigtext tools-page">
  <div id="clickozParticles" aria-hidden="true"></div>
  <canvas id="spaceParticles" aria-hidden="true"></canvas>
  <div class="__grain" aria-hidden="true"></div>
  ${nav("tools")}
  <main class="section container tools-shell">
    <section class="tools-hero" aria-label="Clickoz tools">
      <div class="tools-hero-top">
        <div>
          <p class="guide-kicker">CLICKOZ TOOL DIRECTORY</p>
          <h1 class="tools-title">Find the right tool by job, not by category.</h1>
          <p class="tools-sub">Search by problem, typo or task: fix JSON, clean text, create an SEO snippet, package a YouTube upload or build a tracking URL. Every tool includes examples, output, copy controls and a next page.</p>
        </div>
      </div>
      <div class="chips" id="toolsChips" aria-label="Tool categories">${chips.replace('data-filter="all"', 'data-filter="all" aria-pressed="true"')}</div>
      <div class="tools-search">
        <input id="toolsSearch" class="search" type="search" placeholder="Try: broken JSON, clean text, YouTube title, SEO snippet..." aria-describedby="toolsSearchMeta" />
        <div class="tools-search-meta" id="toolsSearchMeta" aria-live="polite">
          <span>Search all ${cms.tools.length} tools</span>
          <button type="button" id="toolsReset" hidden>Reset search</button>
        </div>
      </div>
      <div class="tools-prompt-dock" aria-label="Popular tool starts">
        <button type="button" data-search-suggestion="seo snippet"><b>SEO snippet</b><span>title + description</span></button>
        <button type="button" data-search-suggestion="fix json"><b>Fix JSON</b><span>format + validate</span></button>
        <button type="button" data-search-suggestion="clean text"><b>Clean text</b><span>readability + copy</span></button>
        <button type="button" data-search-suggestion="youtube upload"><b>YouTube upload</b><span>title + package</span></button>
      </div>
      <div class="tools-route-grid" aria-label="Start with a common job">
        <a href="/tools/seo-tools/"><b>SEO publishing</b><span>Titles, descriptions, slugs and page checks.</span><em>Open SEO tools</em></a>
        <a href="/tools/writing-tools/"><b>Writing cleanup</b><span>Count, readability, cleanup and copy formatting.</span><em>Open writing tools</em></a>
        <a href="/tools/developer-tools/"><b>Developer debug</b><span>JSON, URL encoding, Base64, entities and regex.</span><em>Open dev tools</em></a>
        <a href="/tools/youtube-tools/"><b>Creator upload</b><span>Titles, thumbnails, descriptions, hashtags and tracking.</span><em>Open creator tools</em></a>
      </div>
    </section>
    <div class="tool-sections" aria-label="Tools by category">
      ${sectionOrder.map(sectionHtml).join("\n")}
    </div>
    ${routeFinalStrip("Tools page")}
    ${requestMegaCta()}
  </main>
  ${footer()}
  ${scripts(`<script src="${asset("/tools/tools.js", "toolsJs")}" defer></script>`)}
</body>
</html>
`;
}

function clusterPage(category) {
  const cluster = cms.clusters[category];
  const ui = categoryUI[category];
  const items = cms.tools.filter((tool) => tool.category === category);
  const relatedGuides = cms.guides.filter((guide) => items.some((tool) => tool.slug === guide.tool || (tool.relatedGuides || []).includes(guide.slug))).slice(0, 8);
  const featured = items.slice(0, 3);
  const countLabel = `${items.length} ${items.length === 1 ? "tool" : "tools"}`;
  return `<!doctype html>
<html lang="en">
${head({
  title: `${cluster.title} - Free ${ui.label} Utilities | Clickoz`,
  description: clipMeta(`${cluster.description} Browse ${countLabel} with examples, usable output and related guides.`),
  canonical: abs(cluster.url),
  og: "/assets/og/tools.svg",
  extraCss: `<link rel="stylesheet" href="${asset("/tools/tools.css", "toolsCss")}" /><link rel="stylesheet" href="${asset("/tools/cms-tools.css", "cmsToolsCss")}" />`,
  jsonLd: toolsJsonLd(items, cluster.title, cluster.url, cluster.description)
})}
<body class="bigtext tools-page">
  <div id="clickozParticles" aria-hidden="true"></div>
  <canvas id="spaceParticles" aria-hidden="true"></canvas>
  <div class="__grain" aria-hidden="true"></div>
  ${nav("tools")}
  <main class="section container tools-shell">
    <section class="tools-hero" aria-label="${esc(cluster.title)}">
      <div class="tools-hero-top">
        <div>
          <p class="guide-kicker">${esc(ui.label)} CLUSTER</p>
          <h1 class="tools-title">${esc(cluster.title)}</h1>
          <p class="tools-sub">${esc(cluster.description)} Start with the exact job, use the output, then open the guide only when the decision needs context.</p>
        </div>
      </div>
      <div class="cluster-focus-grid" aria-label="${esc(cluster.title)} focus routes">
        ${featured.map((tool, index) => `<a href="${esc(tool.url)}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(tool.title)}</strong><em>${esc(tool.description)}</em></a>`).join("\n")}
        <a class="cluster-request-card" href="/contact/#request"><span>+</span><strong>Need another tool?</strong><em>Request the exact workflow you need.</em></a>
      </div>
    </section>
    <section class="tool-section" id="${esc(ui.key)}" data-section="${esc(ui.key)}">
      <div class="section-head">
        <div><div class="section-kicker"><span class="section-ico" aria-hidden="true">${ui.icon}</span><h2 class="section-name">Open the right tool</h2></div><p class="section-desc">${esc(ui.intro)}</p></div>
        <span class="section-count">${items.length} tools</span>
      </div>
      <div class="cards-grid">${items.map(card).join("\n")}</div>
    </section>
    <section class="cms-info-grid" aria-label="Related guides">
      <article class="cms-info-card"><h2>Best next guides</h2><p>Use the guides when the tool output needs a publishing decision, not just a copied result.</p><div class="cms-related-links">${relatedGuides.map((guide) => `<a href="${esc(guide.url)}">${entity.book} ${esc(guide.title)}</a>`).join("") || `<a href="/guides/">${entity.book} Browse all guides</a>`}</div></article>
      <article class="cms-info-card"><h2>How this hub helps</h2><p>Each card starts from a concrete job, shows the expected output and routes to a page with examples, local history, related tools, FAQ and schema support.</p></article>
    </section>
    ${routeFinalStrip(`${cluster.title} route`)}
    ${requestMegaCta(`Need a ${cluster.title.toLowerCase()} that is missing?`, `Send the exact ${ui.label.toLowerCase()} job, input and expected output. Clickoz will use it to prioritize the next focused tool or guide.`)}
  </main>
  ${footer()}
  ${scripts(`<script src="${asset("/tools/tools.js", "toolsJs")}" defer></script>`)}
</body>
</html>`;
}

function sitemap() {
  const clusters = Object.values(cms.clusters).map((cluster) => cluster.url);
  const urls = [...new Set(CORE_URLS.concat(clusters, cms.tools.map((tool) => tool.url), cms.guides.map((guide) => guide.url)))];
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${ORIGIN}${url}</loc><lastmod>${today}</lastmod><changefreq>${url === "/" ? "weekly" : "monthly"}</changefreq><priority>${url === "/" ? "1.0" : url.startsWith("/tools/") ? "0.9" : "0.8"}</priority></url>`).join("\n")}
</urlset>
`;
}

function main() {
  cms.tools.forEach((tool) => writeUrl(tool.url, toolPage(tool)));
  writeUrl("/tools/", toolsIndexPage());
  Object.keys(cms.clusters).forEach((category) => writeUrl(cms.clusters[category].url, clusterPage(category)));
  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap(), "utf8");
  console.log(JSON.stringify({
    tools: cms.tools.length,
    clusters: Object.keys(cms.clusters).length,
    guides: cms.guides.length,
    written: "all tool pages, tool index, cluster pages and sitemap"
  }, null, 2));
}

main();
