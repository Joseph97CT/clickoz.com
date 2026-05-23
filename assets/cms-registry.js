/* Clickoz CMS registry.
   One readable source for tools, guide relationships, SEO clusters and schema helpers. */
(function () {
  "use strict";

  /**
   * @typedef {Object} CmsCluster
   * @property {string} title
   * @property {string} url
   * @property {string} icon
   * @property {string} description
   * @property {string} cta
   *
   * @typedef {Object} CmsTool
   * @property {string} slug
   * @property {string} title
   * @property {string} category
   * @property {string} url
   * @property {string} description
   * @property {string[]} features
   * @property {string[]} relatedTools
   * @property {string[]} relatedGuides
   * @property {string} canonicalSlug
   *
   * @typedef {Object} CmsGuide
   * @property {string} slug
   * @property {string} title
   * @property {string} category
   * @property {string} url
   * @property {string} description
   * @property {string} tool
   */

  const root = window.ClickozCMS || {};

  // Workflow clusters used by tool hubs, cards, command palette suggestions and internal linking.
  /** @type {Record<string, CmsCluster>} */
  const clusters = {
    seo: {
      title: "SEO Tools",
      url: "/tools/seo-tools/",
      icon: "Search",
      description: "Create search snippets, slugs, keyword checks and publishing decisions before a page goes live.",
      cta: "Open SEO tools"
    },
    writing: {
      title: "Writing Tools",
      url: "/tools/writing-tools/",
      icon: "Text",
      description: "Clean, measure and restructure drafts so they scan faster on mobile and copy cleanly into the final place.",
      cta: "Open writing tools"
    },
    dev: {
      title: "Developer Tools",
      url: "/tools/developer-tools/",
      icon: "Code",
      description: "Format, encode, decode and inspect payloads without opening heavier software for a quick fix.",
      cta: "Open developer tools"
    },
    youtube: {
      title: "YouTube Tools",
      url: "/tools/youtube-tools/",
      icon: "Creator",
      description: "Package a video upload from title and thumbnail promise to description, hashtags, tags and tracking.",
      cta: "Open YouTube tools"
    },
    tracking: {
      title: "Marketing & Tracking Tools",
      url: "/tools/marketing-tracking-tools/",
      icon: "Chart",
      description: "Build clean campaign links before analytics turns messy across posts, descriptions, ads and newsletters.",
      cta: "Open tracking tools"
    },
    web: {
      title: "Web & Security Tools",
      url: "/tools/web-security-tools/",
      icon: "Shield",
      description: "Check domains, HTTP, IP ranges, timestamps, passwords and crawl files quickly from the browser.",
      cta: "Open web tools"
    },
    socialai: {
      title: "Social & AI Creator Tools",
      url: "/tools/social-ai-tools/",
      icon: "Spark",
      description: "Turn creator ideas into platform-specific hooks, posts, disclosures, reusable assets and business blocks.",
      cta: "Open creator growth tools"
    }
  };

  // Alias/canonical routes keep search-specific URLs without duplicating the workflow family.
  const canonicalSlugByAlias = {
    "meta-tag-optimizer": "meta-tags",
    "url-encoder-decoder": "url-encoder",
    "base64-encode-decode": "base64",
    "html-entity-encoder": "entity-encoder",
    "html-entity-encoder-decoder": "entity-encoder"
  };

  // Primary tools and canonical aliases. Tuple shape:
  // [slug, title, category, url, description, features, relatedTools, relatedGuides]
  /** @type {CmsTool[]} */
  const tools = [
    ["word-counter", "Word Counter", "writing", "/tools/word-counter/", "Count words, characters, sentences, paragraphs and reading time instantly.", ["Browser-only", "Live counts", "Copy results"], ["readability-analyzer", "keyword-density", "meta-tags"], ["word-count-for-seo", "readability-for-ranking", "meta-tags-checklist"]],
    ["character-counter", "Character Counter", "writing", "/tools/character-counter/", "Measure character limits for bios, snippets, captions, forms and strict copy fields.", ["Limits", "No upload", "Mobile-ready"], ["word-counter", "text-case-converter", "meta-tags"], ["word-count-for-seo", "meta-tags-length", "text-cleanup-workflow"]],
    ["readability-analyzer", "Readability Analyzer", "writing", "/tools/readability-analyzer/", "Find hard-to-read text and improve structure before publishing.", ["Score", "Clarity", "SEO copy"], ["word-counter", "keyword-density", "whitespace-cleaner"], ["readability-for-ranking", "readability-score", "readability-for-seo"]],
    ["text-case-converter", "Text Case Converter", "writing", "/tools/text-case-converter/", "Convert text between uppercase, lowercase, title case and sentence case.", ["Case fixes", "Clean text", "Copy-ready"], ["whitespace-cleaner", "slug-generator", "word-counter"], ["text-cleanup-workflow", "content-brief-template", "slug-best-practices"]],
    ["whitespace-cleaner", "Whitespace Cleaner", "writing", "/tools/whitespace-cleaner/", "Remove extra spaces, broken paragraphs and messy pasted formatting.", ["Cleanup", "Paste repair", "Readable"], ["text-case-converter", "readability-analyzer", "word-counter"], ["text-cleanup-workflow", "readability-for-seo", "content-brief-template"]],

    ["meta-tags", "Meta Tag Optimizer", "seo", "/tools/meta-tags/", "Write better titles and descriptions with length checks and snippet intent.", ["Snippet", "Title length", "CTR"], ["serp-preview", "keyword-density", "slug-generator"], ["meta-tags-checklist", "how-to-write-meta-title-description", "serp-snippet-ctr"]],
    ["meta-tag-optimizer", "Meta Title and Description Checker", "seo", "/tools/meta-tag-optimizer/", "Check a page title and meta description before the snippet goes live.", ["Title fixes", "Description check", "SEO entry"], ["meta-tags", "serp-preview", "slug-generator"], ["meta-tags-checklist", "meta-tags-length", "serp-preview"]],
    ["serp-preview", "SERP Snippet Preview", "seo", "/tools/serp-preview/", "Preview how a title, URL and description can look before publishing.", ["Preview", "Snippet-ready", "Search intent"], ["meta-tags", "slug-generator", "keyword-density"], ["serp-preview", "serp-snippet-ctr", "meta-tags-length"]],
    ["keyword-density", "Keyword Density Checker", "seo", "/tools/keyword-density/", "Check keyword frequency and wording balance without stuffing.", ["Density", "Intent", "Natural copy"], ["readability-analyzer", "word-counter", "meta-tags"], ["keyword-density-explained", "keyword-variations", "seo-content-checklist"]],
    ["slug-generator", "Slug Generator", "seo", "/tools/slug-generator/", "Create readable, stable and SEO-friendly URL slugs from page titles.", ["URL slug", "Clean links", "Durable"], ["meta-tags", "serp-preview", "url-encoder"], ["slug-best-practices", "url-encoding-basics", "seo-content-checklist"]],

    ["json-formatter", "JSON Formatter", "dev", "/tools/json-formatter/", "Format, validate and inspect JSON for debugging and clean output.", ["Validate", "Format", "Debug"], ["json-minifier", "base64", "url-encoder"], ["json-formatting-debug", "json-formatter-online", "debugging-tokens"]],
    ["json-minifier", "JSON Minifier", "dev", "/tools/json-minifier/", "Minify JSON for compact payloads, configs and copy/paste workflows.", ["Minify", "Payloads", "Copy"], ["json-formatter", "base64", "url-encoder"], ["json-formatting-debug", "json-formatter-online", "debugging-tokens"]],
    ["url-encoder", "URL Encoder / Decoder", "dev", "/tools/url-encoder/", "Encode or decode query strings and special characters safely.", ["Encode", "Decode", "Query strings"], ["utm-builder", "base64", "entity-encoder"], ["url-encoding", "query-string-best-practices", "encoding-vs-escaping"]],
    ["url-encoder-decoder", "URL Encode Decode Tool", "dev", "/tools/url-encoder-decoder/", "Encode or decode URL values, query strings and pasted parameters safely.", ["Encode", "Decode", "Query repair"], ["url-encoder", "utm-builder", "base64"], ["url-encoding-basics", "query-string-best-practices", "url-encoding-explained"]],
    ["base64", "Base64 Encode / Decode", "dev", "/tools/base64/", "Encode, decode and inspect Base64 text and token-like payloads.", ["Encode", "Decode", "Tokens"], ["url-encoder", "json-formatter", "entity-encoder"], ["base64-encode-decode", "base64url-vs-base64", "debugging-tokens"]],
    ["base64-encode-decode", "Base64 Text Converter", "dev", "/tools/base64-encode-decode/", "Encode, decode and inspect Base64 text, payloads and token-like strings.", ["Encode", "Decode", "Payloads"], ["base64", "json-formatter", "url-encoder"], ["base64-decode", "base64url-vs-base64", "debugging-tokens"]],
    ["entity-encoder", "HTML Entity Encoder", "dev", "/tools/entity-encoder/", "Encode or decode HTML entities for markup, attributes and pasted content.", ["Entities", "Markup", "Escaping"], ["html-entity-encoder", "url-encoder", "json-formatter"], ["html-entities", "fix-broken-html", "encoding-vs-escaping"]],
    ["html-entity-encoder", "HTML Entity Encode Decode Tool", "dev", "/tools/html-entity-encoder/", "Escape and unescape HTML entities without breaking markup.", ["Encode", "Decode", "HTML safe"], ["entity-encoder", "url-encoder", "base64"], ["html-entities", "fix-broken-html", "encoding-vs-escaping"]],
    ["html-entity-encoder-decoder", "HTML Entity Repair Tool", "dev", "/tools/html-entity-encoder-decoder/", "Fix escaped text and unsafe characters before they break an HTML snippet.", ["Entities", "HTML repair", "Broken markup"], ["entity-encoder", "html-entity-encoder", "url-encoder"], ["html-entities", "fix-broken-html", "encoding-vs-escaping"]],

    ["youtube-title-generator", "YouTube Title Generator", "youtube", "/tools/youtube-title-generator/", "Generate YouTube title angles with hook, keyword, curiosity and clarity variants.", ["Hook", "Keyword", "Creator"], ["thumbnail-brief-generator", "youtube-description-generator", "utm-builder"], ["youtube-title-thumbnail-checklist", "youtube-description-template", "youtube-tracking-links"]],
    ["thumbnail-brief-generator", "Thumbnail Brief Generator", "youtube", "/tools/thumbnail-brief-generator/", "Plan thumbnail concepts with contrast, focal point and mobile readability.", ["Thumbnail", "Mobile", "Visual brief"], ["youtube-title-generator", "youtube-description-generator", "youtube-hashtag-generator"], ["youtube-title-thumbnail-checklist", "creator-content-calendar", "youtube-description-template"]],
    ["youtube-description-generator", "YouTube Description Generator", "youtube", "/tools/youtube-description-generator/", "Write first lines, chapters, links, CTA blocks and hashtag placement.", ["First lines", "CTA", "Links"], ["youtube-title-generator", "youtube-hashtag-generator", "utm-builder"], ["youtube-description-template", "youtube-tracking-links", "youtube-hashtags-guide"]],
    ["youtube-hashtag-generator", "YouTube Hashtag Generator", "youtube", "/tools/youtube-hashtag-generator/", "Create relevant hashtag mixes without stuffing the description.", ["Tags", "Niche", "No stuffing"], ["youtube-title-generator", "youtube-description-generator", "youtubevideotagoptimizer"], ["youtube-hashtags-guide", "keyword-variations", "youtube-description-template"]],
    ["youtubevideotagoptimizer", "YouTube Video Tag Optimizer", "youtube", "/tools/youtubevideotagoptimizer/", "Analyze a title and generate focused video tags for creator metadata.", ["Video tags", "Metadata", "Angles"], ["youtube-hashtag-generator", "youtube-title-generator", "keyword-density"], ["youtube-hashtags-guide", "keyword-variations", "youtube-title-thumbnail-checklist"]],
    ["community-post-generator", "Community Post Generator", "youtube", "/tools/community-post-generator/", "Generate polls, teasers and follow-up posts around YouTube uploads.", ["Community", "Polls", "Retention"], ["youtube-title-generator", "youtube-description-generator", "thumbnail-brief-generator"], ["youtube-community-post-ideas", "creator-content-calendar", "youtube-title-thumbnail-checklist"]],
    ["utm-builder", "UTM Builder", "tracking", "/tools/utm-builder/", "Build trackable links for YouTube, TikTok, Instagram and newsletter campaigns.", ["Tracking", "Campaigns", "Clean URLs"], ["url-encoder", "youtube-description-generator", "serp-preview"], ["utm-builder-guide", "youtube-tracking-links", "fix-broken-utm-parameters"]],

    ["http-ping", "HTTP Ping Checker", "web", "/tools/http-ping/", "Measure browser HTTP latency and basic reachability for any public website.", ["Latency", "Reachability", "Website check"], ["dns-lookup", "ip-subnet-calculator", "url-encoder"], ["core-web-vitals-tools-sites", "query-string-best-practices", "debugging-tokens"]],
    ["dns-lookup", "DNS Lookup", "web", "/tools/dns-lookup/", "Look up DNS records with a clean browser interface and readable results.", ["DNS records", "Domain check", "Fast lookup"], ["http-ping", "url-encoder", "json-formatter"], ["query-string-best-practices", "core-web-vitals-tools-sites", "debugging-tokens"]],
    ["ip-subnet-calculator", "IP Subnet Calculator", "web", "/tools/ip-subnet-calculator/", "Calculate IPv4 network range, broadcast address, host range and wildcard mask.", ["IPv4", "CIDR", "Network math"], ["dns-lookup", "http-ping", "json-formatter"], ["debugging-tokens", "core-web-vitals-tools-sites", "query-string-best-practices"]],
    ["password-generator", "Password Generator", "web", "/tools/password-generator/", "Generate strong browser-only passwords and passphrases with copy-ready output.", ["Crypto random", "Strong passwords", "No upload"], ["uuid-generator", "base64", "text-case-converter"], ["debugging-tokens", "encoding-vs-escaping", "text-cleanup-workflow"]],
    ["uuid-generator", "UUID Generator", "web", "/tools/uuid-generator/", "Generate one or many RFC 4122 UUID v4 values instantly in the browser.", ["UUID v4", "Bulk output", "Copy-ready"], ["password-generator", "timestamp-converter", "json-formatter"], ["debugging-tokens", "json-formatter-online", "base64-encode-decode"]],
    ["timestamp-converter", "Timestamp Converter", "web", "/tools/timestamp-converter/", "Convert Unix timestamps to local dates and readable ISO time, or generate the current timestamp.", ["Unix time", "ISO date", "Timezone view"], ["uuid-generator", "json-formatter", "url-encoder"], ["debugging-tokens", "json-formatting-debug", "query-string-best-practices"]],
    ["regex-tester", "Regex Tester", "web", "/tools/regex-tester/", "Test regular expressions against text with matches, groups and replace preview.", ["Regex match", "Groups", "Replace preview"], ["text-diff-checker", "whitespace-cleaner", "json-formatter"], ["text-cleanup-workflow", "debugging-tokens", "fix-broken-html"]],
    ["text-diff-checker", "Text Diff Checker", "web", "/tools/text-diff-checker/", "Compare two text blocks and highlight added, removed and changed lines.", ["Diff", "Compare text", "Review changes"], ["regex-tester", "word-counter", "whitespace-cleaner"], ["text-cleanup-workflow", "content-brief-template", "json-formatting-debug"]],
    ["color-converter", "Color Converter", "web", "/tools/color-converter/", "Convert HEX, RGB and HSL colors and check quick contrast against black or white.", ["HEX RGB HSL", "Contrast", "Palette check"], ["password-generator", "meta-tags", "serp-preview"], ["core-web-vitals-tools-sites", "seo-content-checklist", "content-brief-template"]],
    ["robots-txt-generator", "Robots.txt Generator", "web", "/tools/robots-txt-generator/", "Generate clean robots.txt rules with sitemap hints and crawl directives.", ["Robots.txt", "Crawl rules", "SEO technical"], ["meta-tags", "serp-preview", "http-ping"], ["seo-content-checklist", "internal-linking-tools-sites", "core-web-vitals-tools-sites"]]
  ].map(([slug, title, category, url, description, features, relatedTools, relatedGuides]) => ({
    slug, title, category, url, description, features, relatedTools, relatedGuides,
    canonicalSlug: canonicalSlugByAlias[slug] || slug
  }));

  // Extended creator, YouTube and social workflow tools.
  tools.push(...[
    ["youtube-shorts-hook-analyzer", "YouTube Shorts Hook Analyzer", "youtube", "/tools/youtube-shorts-hook-analyzer/", "Score the first seconds of a Shorts idea for clarity, curiosity and retention.", ["Hook score", "Retention", "Creator"], ["youtube-title-generator", "video-script-outline-generator", "thumbnail-text-readability-checker"], ["youtube-title-thumbnail-checklist", "creator-content-calendar", "youtube-description-template"]],
    ["thumbnail-text-readability-checker", "Thumbnail Text Readability Checker", "youtube", "/tools/thumbnail-text-readability-checker/", "Check thumbnail text length, contrast wording and mobile readability before publishing.", ["Thumbnail", "Mobile", "Readability"], ["thumbnail-brief-generator", "youtube-title-generator", "color-converter"], ["youtube-title-thumbnail-checklist", "readability-for-seo", "core-web-vitals-tools-sites"]],
    ["youtube-chapter-generator", "YouTube Chapter Generator", "youtube", "/tools/youtube-chapter-generator/", "Turn a rough video outline into clean YouTube chapters and timestamps.", ["Chapters", "Description", "Copy-ready"], ["youtube-description-generator", "timestamp-converter", "video-script-outline-generator"], ["youtube-description-template", "youtube-tracking-links", "creator-content-calendar"]],
    ["video-script-outline-generator", "Video Script Outline Generator", "youtube", "/tools/video-script-outline-generator/", "Build a video outline with hook, beats, proof, CTA and retention checkpoints.", ["Script", "Hook", "CTA"], ["youtube-title-generator", "ugc-script-generator", "youtube-chapter-generator"], ["youtube-title-thumbnail-checklist", "content-brief-template", "creator-content-calendar"]],
    ["youtube-comment-reply-generator", "YouTube Comment Reply Generator", "youtube", "/tools/youtube-comment-reply-generator/", "Draft respectful, useful replies for viewer comments and community engagement.", ["Replies", "Community", "Tone"], ["community-post-generator", "youtube-description-generator", "social-cta-generator"], ["youtube-community-post-ideas", "creator-content-calendar", "youtube-description-template"]],
    ["youtube-competitor-title-analyzer", "YouTube Competitor Title Analyzer", "youtube", "/tools/youtube-competitor-title-analyzer/", "Compare competitor-style titles and extract hook patterns without copying them.", ["Title analysis", "Competitor", "Angles"], ["youtube-title-generator", "content-gap-finder", "thumbnail-brief-generator"], ["youtube-title-thumbnail-checklist", "keyword-variations", "seo-content-checklist"]],
    ["tiktok-hook-generator", "TikTok Hook Generator", "socialai", "/tools/tiktok-hook-generator/", "Generate short-form hooks for TikTok, Reels and Shorts from one content idea.", ["TikTok", "Hooks", "Short-form"], ["instagram-reels-hook-analyzer", "youtube-shorts-hook-analyzer", "ugc-script-generator"], ["creator-content-calendar", "youtube-title-thumbnail-checklist", "content-brief-template"]],
    ["tiktok-caption-seo-checker", "TikTok Caption SEO Checker", "socialai", "/tools/tiktok-caption-seo-checker/", "Check TikTok captions for clarity, search phrases, CTA and hashtag balance.", ["Caption", "Search", "Hashtags"], ["hashtag-risk-checker", "instagram-caption-generator", "keyword-density"], ["keyword-density-explained", "keyword-variations", "creator-content-calendar"]],
    ["tiktok-trend-brief-builder", "TikTok Trend Brief Builder", "socialai", "/tools/tiktok-trend-brief-builder/", "Convert a trend observation into a usable content brief with angle, format and CTA.", ["Trend brief", "Angles", "CTA"], ["tiktok-hook-generator", "video-script-outline-generator", "social-cta-generator"], ["content-brief-template", "creator-content-calendar", "keyword-variations"]],
    ["instagram-caption-generator", "Instagram Caption Generator", "socialai", "/tools/instagram-caption-generator/", "Create Instagram captions with hook, value, CTA and optional hashtag direction.", ["Instagram", "Caption", "CTA"], ["instagram-reels-hook-analyzer", "hashtag-risk-checker", "social-cta-generator"], ["instagram-bio-utm", "creator-content-calendar", "keyword-variations"]],
    ["instagram-reels-hook-analyzer", "Instagram Reels Hook Analyzer", "socialai", "/tools/instagram-reels-hook-analyzer/", "Improve the first line or first frame idea of an Instagram Reel.", ["Reels", "Hook score", "Retention"], ["instagram-caption-generator", "tiktok-hook-generator", "thumbnail-text-readability-checker"], ["creator-content-calendar", "content-brief-template", "readability-for-seo"]],
    ["instagram-bio-optimizer", "Instagram Bio Optimizer", "socialai", "/tools/instagram-bio-optimizer/", "Improve an Instagram bio for clarity, niche, trust and link intent.", ["Bio", "Profile", "CTA"], ["instagram-caption-generator", "social-cta-generator", "utm-builder"], ["instagram-bio-utm", "utm-builder-guide", "content-brief-template"]],
    ["hashtag-risk-checker", "Hashtag Risk Checker", "socialai", "/tools/hashtag-risk-checker/", "Review hashtag mixes for repetition, broad tags, stuffing and weak niche relevance.", ["Hashtags", "Risk", "No stuffing"], ["youtube-hashtag-generator", "tiktok-caption-seo-checker", "keyword-density"], ["youtube-hashtags-guide", "keyword-density-explained", "keyword-variations"]],
    ["carousel-outline-generator", "Carousel Outline Generator", "socialai", "/tools/carousel-outline-generator/", "Turn a topic into a slide-by-slide carousel outline for Instagram, LinkedIn or Pinterest.", ["Carousel", "Slides", "Story"], ["linkedin-post-formatter", "instagram-caption-generator", "social-alt-text-generator"], ["content-brief-template", "readability-for-seo", "creator-content-calendar"]],
    ["social-alt-text-generator", "Social Alt Text Generator", "socialai", "/tools/social-alt-text-generator/", "Draft useful alt text for social images, thumbnails and carousel slides.", ["Alt text", "Accessibility", "Images"], ["thumbnail-text-readability-checker", "carousel-outline-generator", "instagram-caption-generator"], ["content-brief-template", "readability-for-seo", "seo-content-checklist"]],
    ["linkedin-post-formatter", "LinkedIn Post Formatter", "socialai", "/tools/linkedin-post-formatter/", "Format LinkedIn posts with hook, spacing, bullets, CTA and mobile scan.", ["LinkedIn", "Formatting", "B2B"], ["carousel-outline-generator", "newsletter-subject-generator", "social-cta-generator"], ["readability-for-seo", "content-brief-template", "text-cleanup-workflow"]],
    ["x-thread-formatter", "X Thread Formatter", "socialai", "/tools/x-thread-formatter/", "Split an idea into a readable X thread with hook, numbered points and CTA.", ["Thread", "X posts", "Formatting"], ["linkedin-post-formatter", "social-cta-generator", "word-counter"], ["content-brief-template", "text-cleanup-workflow", "readability-for-seo"]],
    ["pinterest-pin-title-generator", "Pinterest Pin Title Generator", "socialai", "/tools/pinterest-pin-title-generator/", "Generate Pinterest-friendly pin titles with search intent and click clarity.", ["Pinterest", "Pin title", "Search"], ["instagram-caption-generator", "meta-tags", "keyword-density"], ["keyword-variations", "seo-content-checklist", "how-to-write-meta-title-description"]],
    ["reddit-title-checker", "Reddit Title Checker", "socialai", "/tools/reddit-title-checker/", "Check whether a Reddit title sounds useful, specific and non-spammy.", ["Reddit", "Title check", "Community"], ["x-thread-formatter", "content-gap-finder", "readability-analyzer"], ["content-brief-template", "readability-for-seo", "seo-content-checklist"]],
    ["ai-disclosure-checker", "AI Disclosure Checker", "socialai", "/tools/ai-disclosure-checker/", "Draft a clear AI-use disclosure for social posts, videos, articles or ads.", ["AI disclosure", "Transparency", "Compliance"], ["affiliate-disclosure-generator", "ugc-script-generator", "social-alt-text-generator"], ["seo-content-checklist", "content-brief-template", "creator-content-calendar"]],
    ["creator-content-calendar-tool", "Creator Content Calendar Tool", "socialai", "/tools/creator-content-calendar-tool/", "Plan a repeatable weekly creator schedule across video, shorts, posts and links.", ["Calendar", "Creator system", "Planning"], ["community-post-generator", "video-repurposing-planner", "utm-builder"], ["creator-content-calendar", "youtube-community-post-ideas", "youtube-tracking-links"]],
    ["sponsorship-rate-calculator", "Sponsorship Rate Calculator", "socialai", "/tools/sponsorship-rate-calculator/", "Estimate creator sponsorship pricing from views, engagement and deliverables.", ["Sponsorship", "Rate", "Creator money"], ["media-kit-generator", "affiliate-disclosure-generator", "utm-builder"], ["creator-content-calendar", "utm-best-practices", "youtube-tracking-links"]],
    ["media-kit-generator", "Media Kit Generator", "socialai", "/tools/media-kit-generator/", "Draft a creator media kit summary with niche, audience, metrics and offer blocks.", ["Media kit", "Brand deals", "Profile"], ["sponsorship-rate-calculator", "instagram-bio-optimizer", "newsletter-subject-generator"], ["creator-content-calendar", "content-brief-template", "utm-best-practices"]],
    ["affiliate-disclosure-generator", "Affiliate Disclosure Generator", "socialai", "/tools/affiliate-disclosure-generator/", "Create clear affiliate disclosure text for descriptions, posts and landing pages.", ["Disclosure", "Affiliate", "Trust"], ["ai-disclosure-checker", "youtube-description-generator", "utm-builder"], ["youtube-tracking-links", "utm-builder-guide", "seo-content-checklist"]],
    ["newsletter-subject-generator", "Newsletter Subject Generator", "socialai", "/tools/newsletter-subject-generator/", "Generate subject line options with curiosity, clarity and non-spam wording.", ["Newsletter", "Subject", "Open rate"], ["linkedin-post-formatter", "social-cta-generator", "readability-analyzer"], ["content-brief-template", "readability-for-seo", "keyword-variations"]],
    ["ugc-script-generator", "UGC Script Generator", "socialai", "/tools/ugc-script-generator/", "Build a short UGC ad script with hook, problem, proof, product and CTA.", ["UGC", "Script", "Ad flow"], ["video-script-outline-generator", "tiktok-hook-generator", "social-cta-generator"], ["content-brief-template", "creator-content-calendar", "youtube-title-thumbnail-checklist"]],
    ["podcast-show-notes-generator", "Podcast Show Notes Generator", "socialai", "/tools/podcast-show-notes-generator/", "Turn episode notes into summary, chapters, links and promotional snippets.", ["Podcast", "Show notes", "Chapters"], ["youtube-chapter-generator", "newsletter-subject-generator", "video-repurposing-planner"], ["content-brief-template", "text-cleanup-workflow", "creator-content-calendar"]],
    ["video-repurposing-planner", "Video Repurposing Planner", "socialai", "/tools/video-repurposing-planner/", "Turn one video idea into Shorts, Reels, posts, newsletter and community content.", ["Repurposing", "Short-form", "Workflow"], ["creator-content-calendar-tool", "tiktok-hook-generator", "instagram-caption-generator"], ["creator-content-calendar", "youtube-community-post-ideas", "youtube-title-thumbnail-checklist"]],
    ["content-gap-finder", "Content Gap Finder", "socialai", "/tools/content-gap-finder/", "Compare a topic against missing questions, angles, examples and internal links.", ["Content gaps", "SEO", "Angles"], ["keyword-density", "youtube-competitor-title-analyzer", "meta-tags"], ["keyword-variations", "seo-content-checklist", "internal-linking-tools-sites"]],
    ["social-cta-generator", "Social CTA Generator", "socialai", "/tools/social-cta-generator/", "Generate platform-specific calls to action for posts, videos, bios and descriptions.", ["CTA", "Social", "Conversion"], ["instagram-caption-generator", "youtube-description-generator", "linkedin-post-formatter"], ["content-brief-template", "youtube-description-template", "instagram-bio-utm"]]
  ].map(([slug, title, category, url, description, features, relatedTools, relatedGuides]) => ({
    slug, title, category, url, description, features, relatedTools, relatedGuides, canonicalSlug: slug
  })));

  // Practical guides. Each guide points to the tool that completes the job.
  /** @type {CmsGuide[]} */
  const guides = [
    ["seo-content-checklist", "SEO Content Checklist", "seo", "/guides/seo-content-checklist/", "Audit intent, structure, links and SERP readiness before publishing.", "meta-tags"],
    ["how-to-write-meta-title-description", "How to Write Meta Titles and Descriptions", "seo", "/guides/how-to-write-meta-title-description/", "Write snippets that explain value and earn clicks without clickbait.", "meta-tags"],
    ["keyword-density-explained", "Keyword Density Explained", "seo", "/guides/keyword-density-explained/", "Use keyword density as a diagnostic, not a ranking shortcut.", "keyword-density"],
    ["meta-tags-length", "Meta Tags Length", "seo", "/guides/meta-tags-length/", "Avoid truncation and keep titles and descriptions focused.", "meta-tags"],
    ["meta-tags-checklist", "Meta Tags Checklist", "seo", "/guides/meta-tags-checklist/", "Check title, description, canonical and social tags before publishing.", "meta-tags"],
    ["serp-preview", "SERP Preview Guide", "seo", "/guides/serp-preview/", "Preview and refine snippets before pushing a page live.", "serp-preview"],
    ["serp-snippet-ctr", "SERP Snippets and CTR Testing", "seo", "/guides/serp-snippet-ctr/", "Plan useful snippet tests that improve click clarity without drifting into clickbait or mismatched page promises.", "serp-preview"],
    ["slug-best-practices", "Slug Best Practices", "seo", "/guides/slug-best-practices/", "Create clean URLs that stay readable and durable.", "slug-generator"],
    ["internal-linking-tools-sites", "Internal Linking for Tool Sites", "seo", "/guides/internal-linking-tools-sites/", "Use links to make tools and guides discoverable.", "meta-tags"],
    ["core-web-vitals-tools-sites", "Core Web Vitals for Tool Sites", "seo", "/guides/core-web-vitals-tools-sites/", "Keep interactive utilities fast, stable and usable.", "word-counter"],
    ["keyword-variations", "Keyword Variations", "seo", "/guides/keyword-variations/", "Cover search intent with natural variants and supporting sections.", "keyword-density"],

    ["readability-for-seo", "Readability for SEO", "writing", "/guides/readability-for-seo/", "Make pages easier to scan without flattening the message.", "readability-analyzer"],
    ["readability-score", "Readability Score Guide", "writing", "/guides/readability-score/", "Interpret readability scores and turn them into practical edits.", "readability-analyzer"],
    ["readability-for-ranking", "Readability for Ranking", "writing", "/guides/readability-for-ranking/", "Use clarity and structure to support helpful content.", "readability-analyzer"],
    ["word-count-for-seo", "Word Count for SEO", "writing", "/guides/word-count-for-seo/", "Choose content length based on intent, not arbitrary targets.", "word-counter"],
    ["content-brief-template", "Content Brief Template", "writing", "/guides/content-brief-template/", "Turn search intent into a useful page outline.", "word-counter"],
    ["text-cleanup-workflow", "Text Cleanup Workflow", "writing", "/guides/text-cleanup-workflow/", "Normalize pasted text before publishing or sending.", "whitespace-cleaner"],

    ["json-formatter-online", "JSON Formatter Online Guide", "dev", "/guides/json-formatter-online/", "Validate, format and inspect JSON without losing context.", "json-formatter"],
    ["json-formatting-debug", "Fix JSON Errors", "dev", "/guides/json-formatting-debug/", "Debug broken JSON with examples and a clean routine.", "json-formatter"],
    ["url-encoding", "URL Encoding Explained", "dev", "/guides/url-encoding/", "Understand when query strings break, which values need encoding and how to avoid damaging a full URL.", "url-encoder"],
    ["url-encoding-basics", "URL Encoding Basics", "dev", "/guides/url-encoding-basics/", "Encode pasted values safely for URLs, forms and tracking links before they break in the final context.", "url-encoder"],
    ["url-encoding-explained", "URL Encoding Explained in Practice", "dev", "/guides/url-encoding-explained/", "Fix special characters in links and parameters.", "url-encoder"],
    ["query-string-best-practices", "Query String Best Practices", "dev", "/guides/query-string-best-practices/", "Keep parameters readable, encoded and measurable.", "url-encoder"],
    ["base64-decode", "Base64 Decode Guide", "dev", "/guides/base64-decode/", "Decode payloads for inspection without treating it as encryption.", "base64"],
    ["base64-encode-decode", "Base64 Encode and Decode", "dev", "/guides/base64-encode-decode/", "Use Base64 safely for payloads and debugging.", "base64"],
    ["base64url-vs-base64", "Base64URL vs Base64", "dev", "/guides/base64url-vs-base64/", "Understand token-safe encoding differences before copying payloads into URLs, APIs or debugging notes.", "base64"],
    ["debugging-tokens", "Debugging Tokens", "dev", "/guides/debugging-tokens/", "Inspect token segments carefully without treating decoded payloads as proof of trust or security.", "base64"],
    ["jwt-basics", "JWT Basics", "dev", "/guides/jwt-basics/", "Understand header, payload and signature at a practical level.", "base64"],
    ["html-entities", "HTML Entities Explained", "dev", "/guides/html-entities/", "Encode special characters without breaking markup.", "entity-encoder"],
    ["encoding-vs-escaping", "Encoding vs Escaping", "dev", "/guides/encoding-vs-escaping/", "Choose the right protection for the right context.", "entity-encoder"],
    ["fix-broken-html", "Fix Broken HTML", "dev", "/guides/fix-broken-html/", "Repair messy markup, escaped text and unsafe characters before snippets break a page or CMS field.", "entity-encoder"],

    ["fix-broken-utm-parameters", "Fix Broken UTM Parameters", "tracking", "/guides/fix-broken-utm-parameters/", "Diagnose tracking links before campaigns go live.", "utm-builder"],
    ["utm-builder-guide", "UTM Builder Guide", "tracking", "/guides/utm-builder-guide/", "Build campaign links that stay readable in analytics.", "utm-builder"],
    ["utm-best-practices", "UTM Best Practices", "tracking", "/guides/utm-best-practices/", "Create naming conventions for campaigns and creators.", "utm-builder"],
    ["instagram-bio-utm", "Instagram Bio UTM Links", "tracking", "/guides/instagram-bio-utm/", "Measure profile and campaign links without messy names.", "utm-builder"],

    ["youtube-tracking-links", "YouTube Tracking Links", "youtube", "/guides/youtube-tracking-links/", "Track clicks from descriptions, pinned comments and channel links.", "utm-builder"],
    ["youtube-title-thumbnail-checklist", "YouTube Title and Thumbnail Checklist", "youtube", "/guides/youtube-title-thumbnail-checklist/", "Plan titles and thumbnails as one click promise.", "youtube-title-generator"],
    ["youtube-description-template", "YouTube Description Template", "youtube", "/guides/youtube-description-template/", "Write descriptions that support search and next actions.", "youtube-description-generator"],
    ["youtube-hashtags-guide", "YouTube Hashtags Guide", "youtube", "/guides/youtube-hashtags-guide/", "Use hashtags as labels without turning descriptions into spam.", "youtube-hashtag-generator"],
    ["youtube-community-post-ideas", "YouTube Community Post Ideas", "youtube", "/guides/youtube-community-post-ideas/", "Turn uploads into community posts, polls and teasers.", "community-post-generator"],
    ["creator-content-calendar", "Creator Content Calendar", "creator", "/guides/creator-content-calendar/", "Plan videos, shorts, posts and tracking links together.", "youtube-title-generator"]
  ].map(([slug, title, category, url, description, tool]) => ({ slug, title, category, url, description, tool }));

  const bySlug = (items) => Object.fromEntries(items.map((item) => [item.slug, item]));

  root.clusters = clusters;
  root.tools = tools;
  root.guides = guides;
  root.toolBySlug = bySlug(tools);
  root.guideBySlug = bySlug(guides);
  root.findByPath = function (path) {
    const clean = path || window.location.pathname;
    return tools.find((tool) => clean === tool.url) || guides.find((guide) => clean === guide.url) || null;
  };

  window.ClickozCMS = root;
})();
