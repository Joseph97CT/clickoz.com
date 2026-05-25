const fs = require("fs");
const path = require("path");
const { CSP, CSP_HEADER, PERMISSIONS_POLICY, ASSET_VERSIONS } = require("./cms-config");
const { BRAND, INDEX_ROBOTS, iconLinks } = require("./brand-assets");

const root = path.resolve(__dirname, "..");
const skipDirs = new Set([".git", "node_modules", "_maintenance"]);
const versionedAssets = new Map([
  ["/assets/site.css", "siteCss"],
  ["/assets/site.js", "siteJs"],
  ["/assets/home.css", "homeCss"],
  ["/assets/home-leadership.css", "homeLeadershipCss"],
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

function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      if (!skipDirs.has(item.name)) walk(path.join(dir, item.name), out);
      continue;
    }
    if (item.isFile() && item.name.endsWith(".html")) out.push(path.join(dir, item.name));
  }
  return out;
}

function syncHtml(file) {
  const source = fs.readFileSync(file, "utf8");
  const cspTag = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
  const permissionsTag = `<meta http-equiv="Permissions-Policy" content="${PERMISSIONS_POLICY}" />`;
  let next = source;

  if (/<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/i.test(next)) {
    next = next.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/g, cspTag);
  } else {
    next = next.replace(/(<meta name="viewport"[^>]*>\s*)/i, `$1\n  ${cspTag}`);
  }

  if (/<meta http-equiv="Permissions-Policy" content="[^"]*" \/>/i.test(next)) {
    next = next.replace(/<meta http-equiv="Permissions-Policy" content="[^"]*" \/>/g, permissionsTag);
  } else {
    next = next.replace(/(<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>\s*)/i, `$1\n  ${permissionsTag}`);
  }

  for (const [assetUrl, key] of versionedAssets) {
    next = next.replace(new RegExp(`${assetUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=\\d+`, "g"), `${assetUrl}?v=${ASSET_VERSIONS[key]}`);
  }

  next = next
    .replace(/<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml" \/>\s*<link rel="apple-touch-icon"[^>]*>/g, iconLinks())
    .replace(/<meta name="robots" content="([^"]*)" \/>/g, (match, content) => content.includes("noindex") ? match : `<meta name="robots" content="${INDEX_ROBOTS}" />`)
    .replace(/<meta name="theme-color" content="[^"]*" \/>/g, `<meta name="theme-color" content="${BRAND.themeColor}" />`);

  if (!next.includes(BRAND.favicon32)) {
    next = next.replace(/<link rel="icon" href="\/assets\/favicon\.svg" type="image\/svg\+xml" \/>/g, iconLinks());
  }
  if (!next.includes('rel="icon"') && /<link rel="stylesheet"/.test(next)) {
    next = next.replace(/(<link rel="stylesheet")/, `${iconLinks()}\n  $1`);
  }
  if (!next.includes('name="robots"') && /<link rel="canonical" href="[^"]*" \/>/.test(next)) {
    next = next.replace(/(<link rel="canonical" href="[^"]*" \/>\s*)/, `$1  <meta name="robots" content="${INDEX_ROBOTS}" />\n`);
  }
  if (!next.includes('name="googlebot"') && /<meta name="robots" content="([^"]*)" \/>/.test(next)) {
    next = next.replace(/(<meta name="robots" content="([^"]*)" \/>\s*)/, `$1  <meta name="googlebot" content="$2" />\n`);
  }
  if (!next.includes('name="application-name"') && next.includes('name="googlebot"')) {
    next = next.replace(/(<meta name="googlebot" content="[^"]*" \/>\s*)/, `$1  <meta name="application-name" content="${BRAND.name}" />\n  <meta name="apple-mobile-web-app-title" content="${BRAND.name}" />\n`);
  }
  if (!next.includes('rel="manifest"') && next.includes(BRAND.faviconSvg)) {
    next = next.replace(/(<link rel="apple-touch-icon"[^>]*>\s*)/, `$1  <link rel="manifest" href="${BRAND.manifest}" />\n`);
  }

  if (next !== source) fs.writeFileSync(file, next, "utf8");
  return next !== source;
}

function syncVercel() {
  const file = path.join(root, "vercel.json");
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  const globalRule = config.headers.find((rule) => rule.source === "/(.*)");
  if (!globalRule) throw new Error("Missing global Vercel header rule");
  const header = globalRule.headers.find((item) => item.key === "Content-Security-Policy");
  const permissions = globalRule.headers.find((item) => item.key === "Permissions-Policy");
  if (!header || !permissions) throw new Error("Missing Vercel security headers");
  header.value = CSP_HEADER;
  permissions.value = PERMISSIONS_POLICY;
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

const changedHtml = walk(root).filter(syncHtml).length;
syncVercel();
console.log(JSON.stringify({ changedHtml, syncedVercel: true, siteJs: ASSET_VERSIONS.siteJs, cmsFinal: ASSET_VERSIONS.cmsFinal }, null, 2));
