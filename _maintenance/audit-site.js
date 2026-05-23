const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ORIGIN, ASSET_VERSIONS, CORE_URLS, SMOKE_PATHS, asset } = require("./cms-config");

const root = path.resolve(__dirname, "..");
const skipDirs = new Set(["node_modules", ".git"]);
const textFiles = /\.(html|js|css|xml|txt|json|md)$/i;
const htmlFiles = [];
const findings = [];
const registryFindings = [];
const placeholderPattern = /\b(lorem ipsum|todo|tbd|placeholder|fake data|dummy data|coming soon|your text here|insert .* here)\b/i;
const configuredAssetVersions = new Map([
  ["/assets/site.css", "siteCss"],
  ["/assets/site.js", "siteJs"],
  ["/assets/home.css", "homeCss"],
  ["/assets/home.js", "homeJs"],
  ["/assets/guide.css", "guideCss"],
  ["/assets/guide.js", "guideJs"],
  ["/assets/guide-premium.css", "guidePremiumCss"],
  ["/assets/guide-premium.js", "guidePremiumJs"],
  ["/assets/clickoz-premium.css", "clickozPremiumCss"],
  ["/assets/clickoz-premium.js", "clickozPremiumJs"],
  ["/assets/cms-registry.js", "cmsRegistry"],
  ["/assets/cms-schema.js", "cmsSchema"],
  ["/assets/cms-enhance.js", "cmsEnhance"],
  ["/assets/cms-final.css", "cmsFinal"],
  ["/tools/tools.css", "toolsCss"],
  ["/tools/tools.js", "toolsJs"],
  ["/tools/cms-tools.css", "cmsToolsCss"],
  ["/tools/cms-tools.js", "cmsToolsJs"]
]);

/**
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, features?: string[], relatedTools?: string[], relatedGuides?: string[], canonicalSlug?: string }} CmsTool
 * @typedef {{ slug: string, title: string, category: string, url: string, description: string, tool: string }} CmsGuide
 * @typedef {{ title: string, url: string, description: string, cta?: string, icon?: string }} CmsCluster
 */

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function addFinding(type, file, detail) {
  findings.push({ type, file, detail });
}

function addRegistryFinding(type, detail) {
  registryFindings.push({ type, file: "assets/cms-registry.js", detail });
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      if (!skipDirs.has(name)) walk(file);
      continue;
    }
    if (file.endsWith(".html")) htmlFiles.push(file);
    if (textFiles.test(name)) scanText(file);
  }
}

function scanText(file) {
  const fileRel = rel(file);
  if (fileRel === "_maintenance/audit-site.js") return;
  const source = fs.readFileSync(file, "utf8").replace(/Română|Türkçe/g, "");
  const noisy = source.match(/Â|â|Ã|ð|�|ï¿½|Ricarica lingua|Premium pass/g);
  if (noisy) addFinding("text-noise", fileRel, [...new Set(noisy)].join(", "));
}

function localTargetExists(url) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean || clean === "/" || !clean.startsWith("/")) return true;
  const target = path.join(root, clean);
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory() && fs.existsSync(path.join(target, "index.html"))) return true;
  if (fs.existsSync(`${target}.html`)) return true;
  return false;
}

function scanLinks(file) {
  const source = fs.readFileSync(file, "utf8");
  const re = /(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(source))) {
    const url = match[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(url)) continue;
    if (!localTargetExists(url)) addFinding("broken-local-link", rel(file), url);
  }
}

function scanConfiguredAssetVersions(file) {
  const source = fs.readFileSync(file, "utf8");
  const fileRel = rel(file);
  const re = /((?:\/assets|\/tools)\/[a-z0-9-]+\.(?:css|js))\?v=(\d+)/gi;
  let match;
  while ((match = re.exec(source))) {
    const [, url, version] = match;
    const key = configuredAssetVersions.get(url);
    if (!key) continue;
    const expected = String(ASSET_VERSIONS[key]);
    if (version !== expected) {
      addFinding("asset-version-mismatch", fileRel, `${url}?v=${version} should be ${url}?v=${expected}`);
    }
  }
}

function validateMaintenanceConfigUsage() {
  const activeScripts = [
    "_maintenance/generate-all-tools.js",
    "_maintenance/generate-premium-guides.js",
    "_maintenance/audit-site.js"
  ];
  activeScripts.forEach((relPath) => {
    const source = read(relPath);
    if (!source.includes('require("./cms-config")')) {
      addFinding("maintenance-config-missing", relPath, "script must use _maintenance/cms-config.js");
    }
    if (/["'`](?:\/assets|\/tools)\/[a-z0-9-]+\.(?:css|js)\?v=\d+["'`]/i.test(source)) {
      addFinding("hardcoded-asset-version", relPath, "use asset(url, key) from cms-config instead of inline ?v=");
    }
  });
}

function validateCmsRuntimeIntegrity() {
  const runtime = read("tools/cms-tools.js");
  const styles = read("assets/cms-final.css");
  [
    ["toolUx", "central CMS interaction model"],
    ["cms-example-sequence", "sequenced example UI"],
    ["cms-run-meter", "tool run feedback"],
    ["humanSampleFor", "human fallback samples"],
    ["renderExampleSequence", "example sequence renderer"],
    ["renderRunMeter", "run state renderer"]
  ].forEach(([needle, label]) => {
    if (!runtime.includes(needle)) addFinding("cms-runtime-missing", "tools/cms-tools.js", label);
  });
  [
    ["v67: sequenced examples", "v67 CMS animation cascade"],
    ["v68: reduce tool clutter", "v68 compact CMS cascade"],
    ["cmsSequenceIn", "example sequence animation"],
    ["cmsPulseDot", "run feedback animation"],
    ["prefers-reduced-motion", "reduced motion support"]
  ].forEach(([needle, label]) => {
    if (!styles.includes(needle)) addFinding("cms-style-missing", "assets/cms-final.css", label);
  });
  if (/Create a premium .* result/i.test(runtime)) {
    addFinding("generic-runtime-copy", "tools/cms-tools.js", "fallback tool sample must be human and concrete");
  }
}

function loadCMS() {
  const code = read("assets/cms-registry.js");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.ClickozCMS;
}

function urlToHtmlPath(url) {
  if (url === "/") return "index.html";
  const clean = url.replace(/^\/+/, "");
  if (clean.endsWith(".html")) return clean;
  return path.join(clean, "index.html");
}

function htmlForUrl(url) {
  return read(urlToHtmlPath(url));
}

function fileExistsForUrl(url) {
  return fs.existsSync(path.join(root, urlToHtmlPath(url)));
}

function duplicateValues(items, getValue) {
  const seen = new Map();
  const duplicates = [];
  items.forEach((item) => {
    const value = getValue(item);
    if (!value) return;
    if (seen.has(value)) duplicates.push(value);
    else seen.set(value, true);
  });
  return [...new Set(duplicates)];
}

function assertUrlShape(kind, item) {
  if (!/^\/[a-z0-9][a-z0-9/-]*\/$/.test(item.url || "")) {
    addRegistryFinding("invalid-url", `${kind} ${item.slug || item.title} uses ${item.url || "empty url"}`);
  }
}

function assertNoPlaceholder(kind, item, fields) {
  fields.forEach((field) => {
    const value = String(item[field] || "");
    if (placeholderPattern.test(value)) addRegistryFinding("placeholder-copy", `${kind} ${item.slug || item.title} has placeholder-like ${field}`);
  });
}

function assertRequiredString(kind, item, field, minLength = 1) {
  const value = String(item[field] || "").trim();
  if (value.length < minLength) addRegistryFinding("missing-copy", `${kind} ${item.slug || item.title} needs ${field}`);
}

function validateRegistry(cms) {
  /** @type {CmsTool[]} */
  const tools = Array.isArray(cms.tools) ? cms.tools : [];
  /** @type {CmsGuide[]} */
  const guides = Array.isArray(cms.guides) ? cms.guides : [];
  /** @type {Record<string, CmsCluster>} */
  const clusters = cms.clusters || {};
  const clusterKeys = Object.keys(clusters);
  const toolSlugs = new Set(tools.map((item) => item.slug));
  const guideSlugs = new Set(guides.map((item) => item.slug));
  const allowedGuideCategories = new Set([...clusterKeys, "creator"]);

  duplicateValues(tools, (item) => item.slug).forEach((slug) => addRegistryFinding("duplicate-tool-slug", slug));
  duplicateValues(tools, (item) => item.url).forEach((url) => addRegistryFinding("duplicate-tool-url", url));
  duplicateValues(guides, (item) => item.slug).forEach((slug) => addRegistryFinding("duplicate-guide-slug", slug));
  duplicateValues(guides, (item) => item.url).forEach((url) => addRegistryFinding("duplicate-guide-url", url));
  duplicateValues(Object.values(clusters), (item) => item.url).forEach((url) => addRegistryFinding("duplicate-cluster-url", url));
  duplicateValues([
    ...tools.map((item) => ({ kind: "tool", url: item.url })),
    ...guides.map((item) => ({ kind: "guide", url: item.url })),
    ...Object.values(clusters).map((item) => ({ kind: "cluster", url: item.url }))
  ], (item) => item.url).forEach((url) => addRegistryFinding("duplicate-cms-url", url));

  Object.entries(clusters).forEach(([key, cluster]) => {
    assertUrlShape("cluster", { ...cluster, slug: key });
    assertRequiredString("cluster", { ...cluster, slug: key }, "title", 3);
    assertRequiredString("cluster", { ...cluster, slug: key }, "description", 35);
    assertNoPlaceholder("cluster", { ...cluster, slug: key }, ["title", "description", "cta"]);
  });

  tools.forEach((tool) => {
    assertUrlShape("tool", tool);
    assertRequiredString("tool", tool, "slug", 3);
    assertRequiredString("tool", tool, "title", 3);
    assertRequiredString("tool", tool, "description", 45);
    assertNoPlaceholder("tool", tool, ["title", "description"]);

    if (!clusters[tool.category]) addRegistryFinding("unknown-tool-category", `${tool.slug} -> ${tool.category}`);
    if (!Array.isArray(tool.features) || tool.features.length < 3) addRegistryFinding("weak-tool-features", `${tool.slug} needs at least 3 features`);
    if (!Array.isArray(tool.relatedTools) || tool.relatedTools.length < 2) addRegistryFinding("weak-related-tools", `${tool.slug} needs at least 2 related tools`);
    if (!Array.isArray(tool.relatedGuides) || tool.relatedGuides.length < 2) addRegistryFinding("weak-related-guides", `${tool.slug} needs at least 2 related guides`);

    (tool.relatedTools || []).forEach((slug) => {
      if (!toolSlugs.has(slug)) addRegistryFinding("missing-related-tool", `${tool.slug} -> ${slug}`);
      if (slug === tool.slug) addRegistryFinding("self-related-tool", tool.slug);
    });
    (tool.relatedGuides || []).forEach((slug) => {
      if (!guideSlugs.has(slug)) addRegistryFinding("missing-related-guide", `${tool.slug} -> ${slug}`);
    });
    if (!tool.canonicalSlug || !toolSlugs.has(tool.canonicalSlug)) addRegistryFinding("invalid-canonical-tool", `${tool.slug} -> ${tool.canonicalSlug || "missing"}`);
  });

  tools.forEach((tool) => {
    const target = cms.toolBySlug?.[tool.canonicalSlug];
    if (target && target.canonicalSlug !== target.slug) addRegistryFinding("canonical-chain", `${tool.slug} -> ${tool.canonicalSlug} -> ${target.canonicalSlug}`);
  });

  guides.forEach((guide) => {
    assertUrlShape("guide", guide);
    assertRequiredString("guide", guide, "slug", 3);
    assertRequiredString("guide", guide, "title", 3);
    assertRequiredString("guide", guide, "description", 45);
    assertNoPlaceholder("guide", guide, ["title", "description"]);

    if (!allowedGuideCategories.has(guide.category)) addRegistryFinding("unknown-guide-category", `${guide.slug} -> ${guide.category}`);
    if (!toolSlugs.has(guide.tool)) addRegistryFinding("missing-guide-tool", `${guide.slug} -> ${guide.tool}`);
  });
}

function validatePages(cms) {
  const toolCss = asset("/tools/cms-tools.css", "cmsToolsCss");
  const toolJs = asset("/tools/cms-tools.js", "cmsToolsJs");
  const guidePremiumJs = asset("/assets/guide-premium.js", "guidePremiumJs");
  const cmsRegistryJs = asset("/assets/cms-registry.js", "cmsRegistry");
  const cmsSchemaJs = asset("/assets/cms-schema.js", "cmsSchema");
  const cmsEnhanceJs = asset("/assets/cms-enhance.js", "cmsEnhance");

  const toolPagesNotUnified = cms.tools.filter((item) => {
    const source = htmlForUrl(item.url);
    return !source.includes(`data-tool-app="${item.slug}"`) ||
      !source.includes(toolCss) ||
      !source.includes(toolJs) ||
      !source.includes(cmsRegistryJs) ||
      !source.includes(cmsSchemaJs) ||
      !source.includes(cmsEnhanceJs) ||
      !source.includes("cms-tool-brief") ||
      !source.includes("cms-related") ||
      !source.includes("cms-ops-strip") ||
      !source.includes("cms-info-grid") ||
      !source.includes("cms-faq") ||
      !source.includes("cms-query-chips") ||
      source.includes("cms-tool-continue") ||
      source.includes("cms-tool-notes") ||
      source.includes("cms-tool-workflow") ||
      source.includes("cms-job-summary");
  }).map((item) => item.url);

  const guidePagesWeak = cms.guides.filter((item) => {
    const source = htmlForUrl(item.url);
    return (source.match(/class="guide-block/g) || []).length < 10 ||
      !source.includes("guide-tutorial-map") ||
      !source.includes("FAQPage") ||
      !source.includes("HowTo") ||
      !source.includes(guidePremiumJs) ||
      !source.includes(cmsRegistryJs) ||
      !source.includes(cmsSchemaJs) ||
      !source.includes(cmsEnhanceJs);
  }).map((item) => item.url);

  cms.tools.forEach((tool) => {
    const source = htmlForUrl(tool.url);
    const canonicalTool = cms.toolBySlug?.[tool.canonicalSlug] || tool;
    const expected = `<link rel="canonical" href="${ORIGIN}${canonicalTool.url}" />`;
    if (!source.includes(expected)) {
      addFinding("invalid-tool-canonical", urlToHtmlPath(tool.url), `${tool.slug} expected ${expected}`);
    }
  });

  cms.guides.forEach((guide) => {
    const source = htmlForUrl(guide.url);
    const expected = `<link rel="canonical" href="${ORIGIN}${guide.url}" />`;
    if (!source.includes(expected)) {
      addFinding("invalid-guide-canonical", urlToHtmlPath(guide.url), `${guide.slug} expected ${expected}`);
    }
  });

  return { toolPagesNotUnified, guidePagesWeak };
}

function parseSitemapLocs(source) {
  return [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function validateSitemap(cms, sitemap) {
  const clusters = Object.values(cms.clusters || {}).map((cluster) => cluster.url);
  const expected = [...new Set(CORE_URLS.concat(clusters, cms.tools.map((tool) => tool.url), cms.guides.map((guide) => guide.url)))];
  const locs = parseSitemapLocs(sitemap);
  const locSet = new Set(locs);
  const missing = expected.filter((url) => !locSet.has(`${ORIGIN}${url}`));
  const duplicateLocs = duplicateValues(locs.map((loc) => ({ loc })), (item) => item.loc);
  const hasEnvelope = sitemap.includes("<urlset") && sitemap.includes("</urlset>");

  if (!hasEnvelope) addFinding("invalid-sitemap", "sitemap.xml", "missing urlset envelope");
  missing.forEach((url) => addFinding("sitemap-missing-url", "sitemap.xml", `${ORIGIN}${url}`));
  duplicateLocs.forEach((url) => addFinding("sitemap-duplicate-url", "sitemap.xml", url));

  return {
    expectedUrls: expected.length,
    actualUrls: locs.length,
    missing,
    duplicateLocs,
    hasEnvelope
  };
}

function validateRobots(robots, sitemapUrls) {
  const disallowRules = [...robots.matchAll(/^Disallow:\s*(\S+)/gmi)].map((match) => match[1]);
  const hasAllowAll = /^Allow:\s*\/\s*$/mi.test(robots);
  const hasSitemap = robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`);
  const hasMaintenanceBlock = disallowRules.includes("/_maintenance/");
  const blocksIndexedCms = sitemapUrls.some((url) => disallowRules.some((rule) => rule !== "/" && url.startsWith(rule)));

  if (!hasAllowAll) addFinding("robots-missing-allow", "robots.txt", "expected Allow: /");
  if (!hasSitemap) addFinding("robots-missing-sitemap", "robots.txt", `${ORIGIN}/sitemap.xml`);
  if (!hasMaintenanceBlock) addFinding("robots-missing-maintenance-block", "robots.txt", "expected Disallow: /_maintenance/");
  if (blocksIndexedCms) addFinding("robots-blocks-indexed-cms", "robots.txt", "a sitemap URL is blocked by robots.txt");

  return { hasAllowAll, hasSitemap, hasMaintenanceBlock, blocksIndexedCms, disallowRules };
}

function validateSmokeTemplates() {
  return SMOKE_PATHS.map((url) => {
    const exists = fileExistsForUrl(url);
    const checks = { exists, viewport: false, title: false, canonical: false, nav: false, cmsFinal: false };
    if (!exists) {
      addFinding("smoke-page-missing", urlToHtmlPath(url), url);
      return { url, ...checks };
    }
    const source = htmlForUrl(url);
    checks.viewport = source.includes('name="viewport"');
    checks.title = /<title>[^<]+<\/title>/i.test(source);
    checks.canonical = /rel="canonical"/i.test(source);
    checks.nav = source.includes('class="nav"') || source.includes("nav-inner");
    checks.cmsFinal = source.includes(asset("/assets/cms-final.css", "cmsFinal"));

    Object.entries(checks).forEach(([key, ok]) => {
      if (key !== "exists" && !ok) addFinding("smoke-page-weak", urlToHtmlPath(url), `${url} missing ${key}`);
    });
    return { url, ...checks };
  });
}

function registryStats(cms) {
  const pageStats = validatePages(cms);
  return {
    tools: cms.tools.length,
    guides: cms.guides.length,
    clusters: Object.keys(cms.clusters || {}).length,
    toolPagesMissing: cms.tools.filter((item) => !fileExistsForUrl(item.url)).map((item) => item.url),
    guidePagesMissing: cms.guides.filter((item) => !fileExistsForUrl(item.url)).map((item) => item.url),
    ...pageStats,
    registryFindings
  };
}

walk(root);
htmlFiles.forEach(scanLinks);
htmlFiles.forEach(scanConfiguredAssetVersions);
validateMaintenanceConfigUsage();
validateCmsRuntimeIntegrity();

const cms = loadCMS();
validateRegistry(cms);

const workflows = read("workflows/index.html");
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
const stats = registryStats(cms);
const sitemapReport = validateSitemap(cms, sitemap);
const robotsReport = validateRobots(robots, CORE_URLS.concat(Object.values(cms.clusters || {}).map((cluster) => cluster.url), cms.tools.map((tool) => tool.url), cms.guides.map((guide) => guide.url)));
const smokeTemplates = validateSmokeTemplates();

const report = {
  ok: !findings.length &&
    !stats.toolPagesMissing.length &&
    !stats.guidePagesMissing.length &&
    !stats.toolPagesNotUnified.length &&
    !stats.guidePagesWeak.length &&
    !stats.registryFindings.length,
  assetVersions: ASSET_VERSIONS,
  stats,
  workflows: {
    indexable: workflows.includes("index,follow"),
    inSitemap: sitemap.includes(`${ORIGIN}/workflows/`),
    faqSchema: workflows.includes("FAQPage"),
    collectionSchema: workflows.includes("CollectionPage")
  },
  securitySeo: {
    robotsHasSitemap: robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
    hasSecurityHeadersConfig: fs.existsSync(path.join(root, "vercel.json")),
    has404: fs.existsSync(path.join(root, "404.html")) && fs.existsSync(path.join(root, "404", "index.html")),
    has500: fs.existsSync(path.join(root, "500.html")) && fs.existsSync(path.join(root, "500", "index.html")),
    sitemap: sitemapReport,
    robots: robotsReport
  },
  smokeTemplates,
  findings
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) process.exit(1);
