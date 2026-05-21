const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const skipDirs = new Set(["node_modules", ".git"]);
const textFiles = /\.(html|js|css|xml|txt|json)$/i;
const htmlFiles = [];
const findings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
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

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function scanText(file) {
  const fileRel = rel(file);
  if (fileRel === "_maintenance/audit-site.js") return;
  const source = fs.readFileSync(file, "utf8").replace(/Română|Türkçe/g, "");
  const noisy = source.match(/Â|â|Ã|ð|�|Ricarica lingua|Premium pass/g);
  if (!noisy) return;
  findings.push({ type: "text-noise", file: fileRel, detail: [...new Set(noisy)].join(", ") });
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
    if (!localTargetExists(url)) findings.push({ type: "broken-local-link", file: rel(file), detail: url });
  }
}

function registryStats() {
  const code = read("assets/cms-registry.js");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  const cms = context.window.ClickozCMS;
  const toolPagesNotUnified = cms.tools.filter((item) => {
    const source = read(path.join(".", item.url, "index.html"));
    return !source.includes(`data-tool-app="${item.slug}"`) ||
      !source.includes("/tools/cms-tools.css?v=13") ||
      !source.includes("/tools/cms-tools.js?v=11");
  }).map((item) => item.url);
  const guidePagesWeak = cms.guides.filter((item) => {
    const source = read(path.join(".", item.url, "index.html"));
    return (source.match(/class="guide-block/g) || []).length < 10 ||
      !source.includes("FAQPage") ||
      !source.includes("HowTo") ||
      !source.includes("/assets/guide-premium.js?v=6");
  }).map((item) => item.url);
  return {
    tools: cms.tools.length,
    guides: cms.guides.length,
    toolPagesMissing: cms.tools.filter((item) => !fs.existsSync(path.join(root, item.url, "index.html"))).map((item) => item.url),
    guidePagesMissing: cms.guides.filter((item) => !fs.existsSync(path.join(root, item.url, "index.html"))).map((item) => item.url),
    toolPagesNotUnified,
    guidePagesWeak
  };
}

walk(root);
htmlFiles.forEach(scanLinks);

const workflows = read("workflows/index.html");
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
const stats = registryStats();
const report = {
  stats,
  workflows: {
    indexable: workflows.includes("index,follow"),
    inSitemap: sitemap.includes("https://clickoz.com/workflows/"),
    faqSchema: workflows.includes("FAQPage"),
    collectionSchema: workflows.includes("CollectionPage")
  },
  securitySeo: {
    robotsHasSitemap: robots.includes("Sitemap: https://clickoz.com/sitemap.xml"),
    hasSecurityHeadersConfig: fs.existsSync(path.join(root, "vercel.json")),
    has404: fs.existsSync(path.join(root, "404.html")) && fs.existsSync(path.join(root, "404", "index.html")),
    has500: fs.existsSync(path.join(root, "500.html")) && fs.existsSync(path.join(root, "500", "index.html"))
  },
  findings
};

console.log(JSON.stringify(report, null, 2));
if (findings.length || stats.toolPagesMissing.length || stats.guidePagesMissing.length || stats.toolPagesNotUnified.length || stats.guidePagesWeak.length) process.exit(1);
