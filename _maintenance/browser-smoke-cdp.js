const fs = require("fs");
const http = require("http");
const crypto = require("crypto");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.CLICKOZ_SMOKE_BASE_URL || "http://127.0.0.1:4177";
const PORT = Number(process.env.CLICKOZ_CDP_PORT || 9333);

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);

function chromePath() {
  const found = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome or Edge executable not found.");
  return found;
}

function requestJson(pathname, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: PORT, path: pathname, method }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(error); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function waitForDebugEndpoint(ms = 8000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { return await requestJson("/json/version"); }
    catch (_) { await new Promise((resolve) => setTimeout(resolve, 160)); }
  }
  throw new Error("Chrome DevTools endpoint did not start.");
}

class MinimalWebSocket {
  constructor(url) {
    this.url = new URL(url);
    this.buffer = Buffer.alloc(0);
    this.readyState = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString("base64");
      const port = Number(this.url.port || 80);
      const socket = net.createConnection({ host: this.url.hostname, port }, () => {
        socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "\r\n"
        ].join("\r\n"));
      });
      this.socket = socket;
      let handshake = Buffer.alloc(0);
      socket.on("data", (chunk) => {
        if (this.readyState !== 1) {
          handshake = Buffer.concat([handshake, chunk]);
          const end = handshake.indexOf("\r\n\r\n");
          if (end === -1) return;
          const head = handshake.slice(0, end).toString("utf8");
          if (!/^HTTP\/1\.1 101/i.test(head)) {
            reject(new Error(`WebSocket handshake failed: ${head.split("\r\n")[0]}`));
            return;
          }
          this.readyState = 1;
          if (this.onopen) this.onopen();
          resolve();
          const rest = handshake.slice(end + 4);
          if (rest.length) this.readFrames(rest);
          return;
        }
        this.readFrames(chunk);
      });
      socket.on("error", reject);
      socket.on("close", () => {
        this.readyState = 3;
        if (this.onclose) this.onclose();
      });
    });
  }

  readFrames(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const opcode = first & 0x0f;
      let len = this.buffer[1] & 0x7f;
      let offset = 2;
      if (len === 126) {
        if (this.buffer.length < 4) return;
        len = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (len === 127) {
        if (this.buffer.length < 10) return;
        const high = this.buffer.readUInt32BE(2);
        const low = this.buffer.readUInt32BE(6);
        len = high * 2 ** 32 + low;
        offset = 10;
      }
      const masked = Boolean(this.buffer[1] & 0x80);
      const maskOffset = masked ? 4 : 0;
      if (this.buffer.length < offset + maskOffset + len) return;
      let payload = this.buffer.slice(offset + maskOffset, offset + maskOffset + len);
      if (masked) {
        const mask = this.buffer.slice(offset, offset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      this.buffer = this.buffer.slice(offset + maskOffset + len);
      if (opcode === 1 && this.onmessage) this.onmessage({ data: payload.toString("utf8") });
      if (opcode === 8) this.close();
    }
  }

  send(text) {
    const payload = Buffer.from(String(text));
    const mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x81, 0x80 | payload.length]);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(payload.length, 6);
    }
    const masked = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
    this.socket.write(Buffer.concat([header, mask, masked]));
  }

  close() {
    try { this.socket.end(); } catch (_) {}
  }
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = typeof WebSocket === "function" ? new WebSocket(this.url) : new MinimalWebSocket(this.url);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error("CDP websocket failed."));
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve: ok, reject: fail } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) fail(new Error(msg.error.message || "CDP command failed."));
          else ok(msg.result || {});
          return;
        }
        if (msg.method) this.events.push(msg);
      };
      if (this.ws instanceof MinimalWebSocket) this.ws.connect().catch(reject);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    try { this.ws.close(); } catch (_) {}
  }
}

async function waitForReady(cdp) {
  const start = Date.now();
  while (Date.now() - start < 7000) {
    const ready = await cdp.send("Runtime.evaluate", {
      expression: "document.readyState === 'complete'",
      returnByValue: true
    });
    if (ready.result && ready.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

async function evalJson(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Evaluation failed.");
  return result.result.value;
}

async function smokePage(cdp, url, viewport) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 2 : 1,
    mobile: Boolean(viewport.mobile)
  });
  await cdp.send("Page.navigate", { url });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 550));
  return evalJson(cdp, `(async () => {
    const doc = document.documentElement;
    const visible = (el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };
    const fixedBottom = Array.from(document.querySelectorAll("*")).filter((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (["clickozParticles", "spaceParticles"].includes(el.id)) return false;
      if (el.classList.contains("__grain") || el.classList.contains("cz-neon-grid")) return false;
      if (cs.pointerEvents === "none" && Number(cs.zIndex || 0) <= 0) return false;
      return visible(el) && (cs.position === "fixed" || cs.position === "sticky") && rect.bottom > innerHeight - 32 && rect.height > 18 && rect.width > innerWidth * .44;
    }).map((el) => ({ tag: el.tagName, id: el.id, cls: String(el.className || "").slice(0, 80) }));
    const visualOverflows = Array.from(document.querySelectorAll("body *")).filter((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!visible(el)) return false;
      if (["clickozParticles", "spaceParticles"].includes(el.id)) return false;
      if (el.classList.contains("__grain") || el.classList.contains("cz-neon-grid") || el.classList.contains("cz-scanline") || el.classList.contains("cz-orb")) return false;
      if (el.closest(".contact-hp,.m-menu[aria-hidden='true']")) return false;
      if (cs.position === "fixed" && cs.pointerEvents === "none") return false;
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = getComputedStyle(parent);
        if (["auto", "scroll"].includes(parentStyle.overflowX) && parent.scrollWidth > parent.clientWidth + 1) return false;
        if (["hidden", "clip"].includes(parentStyle.overflowX)) {
          const parentRect = parent.getBoundingClientRect();
          if (rect.left < parentRect.left - 1 || rect.right > parentRect.right + 1) return false;
        }
        parent = parent.parentElement;
      }
      if (["auto", "scroll"].includes(cs.overflowX)) return false;
      return rect.left < -2 || rect.right > innerWidth + 2;
    }).slice(0, 8).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id,
        cls: String(el.className || "").slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      };
    });
    const ambient = {
      particleNodes: document.querySelectorAll("#clickozParticles .pidle,#clickozParticles .pburst,#clickozParticles .pguide").length,
      hasSpaceCanvas: Boolean(document.getElementById("spaceParticles")),
      hasNeonGrid: Boolean(document.querySelector(".cz-neon-grid")),
      leanMode: document.documentElement.classList.contains("lean-perf-mode"),
      mobilePerfMode: document.documentElement.classList.contains("mobile-perf-mode")
    };
    const tapTargets = Array.from(document.querySelectorAll("a,button,input,select,textarea,summary")).filter(visible);
    const smallTapTargets = tapTargets.filter((el) => {
      const rect = el.getBoundingClientRect();
      const label = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim();
      if (!label && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA" && el.tagName !== "SELECT") return false;
      return rect.width < 32 || rect.height < 32;
    }).slice(0, 8).map((el) => {
      const rect = el.getBoundingClientRect();
      return { tag: el.tagName, cls: String(el.className || "").slice(0, 60), width: Math.round(rect.width), height: Math.round(rect.height) };
    });
    const output = document.querySelector(".cms-output");
    const form = document.querySelector("[data-clickoz-contact-form]");
    const exampleStability = await (async () => {
      const box = document.querySelector(".cms-example-box");
      if (!box) return null;
      const pre = box.querySelector("pre");
      const options = Array.from(box.querySelectorAll(".cms-example-option"));
      if (!pre || !options.length) return { options: options.length, ok: true };
      const states = [];
      for (const button of options.slice(0, 3)) {
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 120));
        const rect = pre.getBoundingClientRect();
        const boxRect = box.getBoundingClientRect();
        const activeCount = box.querySelectorAll(".cms-example-option.active").length;
        states.push({
          label: button.textContent.trim(),
          textLength: pre.textContent.trim().length,
          preHeight: Math.round(rect.height),
          boxWidth: Math.round(boxRect.width),
          feedbackText: document.querySelector(".cms-tool-feedback.show")?.textContent.trim() || "",
          overflowX: box.scrollWidth > box.clientWidth + 1,
          activeCount
        });
      }
      const maxHeight = Math.max(...states.map((item) => item.preHeight));
      return {
        options: options.length,
        states,
        maxHeight,
        ok: states.every((item) => item.textLength > 0 && !item.overflowX && item.activeCount === 1 && !/Example loaded/i.test(item.feedbackText)) && maxHeight <= 190
      };
    })();
    return {
      title: document.title,
      overflowX: doc.scrollWidth > doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      fixedBottomCount: fixedBottom.length,
      fixedBottom,
      visualOverflowCount: visualOverflows.length,
      visualOverflows,
      ambient,
      smallTapTargetCount: smallTapTargets.length,
      smallTapTargets,
      hasToolOutput: output ? Boolean((output.dataset.copy || output.textContent || "").trim()) : null,
      contactEmail: form ? form.dataset.contactEmail || form.getAttribute("action") : null,
      exampleStability
    };
  })()`);
}

async function smokeCookieConsent(cdp, url) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send("Page.navigate", { url });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 650));
  return evalJson(cdp, `(async () => {
    const banner = document.querySelector(".cookie.cookie-pro");
    const title = document.querySelector("#clickozConsentTitle")?.textContent.trim() || "";
    const text = document.querySelector("#clickozConsentText")?.textContent.trim() || "";
    const link = banner?.querySelector('a[href="/privacy/#cookies"]');
    const buttons = Array.from(banner?.querySelectorAll("button") || []).map((button) => button.textContent.trim());
    const rect = banner?.getBoundingClientRect();
    const visibleBefore = Boolean(
      banner &&
      banner.classList.contains("show") &&
      banner.getAttribute("aria-hidden") === "false" &&
      rect &&
      rect.width <= innerWidth &&
      rect.bottom <= innerHeight &&
      rect.height > 100
    );
    document.querySelector("#cookieEssential")?.click();
    await new Promise((resolve) => setTimeout(resolve, 220));
    const hiddenAfter = Boolean(
      banner &&
      !banner.classList.contains("show") &&
      banner.getAttribute("aria-hidden") === "true" &&
      document.documentElement.dataset.clickozConsent === "essential"
    );
    return {
      ok: visibleBefore &&
        hiddenAfter &&
        /browser handshake/i.test(title) &&
        /privacy|cache|cookie/i.test(text) &&
        Boolean(link) &&
        buttons.includes("Allow smart cache") &&
        buttons.includes("Essential only") &&
        buttons.includes("No extras"),
      title,
      buttons,
      link: link ? link.getAttribute("href") : null,
      visibleBefore,
      hiddenAfter,
      width: rect ? Math.round(rect.width) : 0,
      bottom: rect ? Math.round(rect.bottom) : 0
    };
  })()`);
}

async function smokeAdvancedSearchAccess(cdp, baseUrl) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 450));
  const homeAccess = await evalJson(cdp, `(async () => {
    const note = document.querySelector(".hero-command-note[data-open-command]");
    const text = note?.textContent.replace(/\\s+/g, " ").trim() || "";
    note?.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const opened = Boolean(document.querySelector("#czCommandPalette") && !document.querySelector("#czCommandPalette").hidden);
    document.querySelector("[data-command-close]")?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      copy: text,
      opened,
      mentionsFive: /5 quick/i.test(text),
      mentionsCtrl: /Ctrl/i.test(text) && /K/.test(text)
    };
  })()`);

  await cdp.send("Page.navigate", { url: `${baseUrl}/tools/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 450));
  const toolsAccess = await evalJson(cdp, `(async () => {
    const hint = document.querySelector(".cz-tools-search-hint[data-open-command]");
    const text = hint?.textContent.replace(/\\s+/g, " ").trim() || "";
    const click = () => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, clientX: 24, clientY: 240 }));
    for (let i = 0; i < 5; i += 1) click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const openedByBurst = Boolean(document.querySelector("#czCommandPalette") && !document.querySelector("#czCommandPalette").hidden);
    document.querySelector("[data-command-close]")?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    hint?.click();
    await new Promise((resolve) => setTimeout(resolve, 160));
    const openedByHint = Boolean(document.querySelector("#czCommandPalette") && !document.querySelector("#czCommandPalette").hidden);
    document.querySelector("[data-command-close]")?.click();
    return {
      copy: text,
      openedByBurst,
      openedByHint,
      mentionsFive: /5 quick/i.test(text),
      mentionsCtrl: /Ctrl/i.test(text) && /K/.test(text)
    };
  })()`);

  return {
    ok: homeAccess.opened &&
      homeAccess.mentionsFive &&
      homeAccess.mentionsCtrl &&
      toolsAccess.openedByBurst &&
      toolsAccess.openedByHint &&
      toolsAccess.mentionsFive &&
      toolsAccess.mentionsCtrl,
    homeAccess,
    toolsAccess
  };
}

async function main() {
  const userDataDir = path.join(ROOT, ".chrome-smoke-cdp");
  fs.rmSync(userDataDir, { recursive: true, force: true });
  const chrome = spawn(chromePath(), [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--disable-background-networking",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore", windowsHide: true });

  let cdp;
  try {
    await waitForDebugEndpoint();
    const target = await requestJson(`/json/new?${encodeURIComponent("about:blank")}`, "PUT");
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Log.enable");

    const pageChecks = [];
    const viewportMatrix = [
      { name: "small-phone", width: 320, height: 740, mobile: true },
      { name: "mobile", width: 390, height: 844, mobile: true },
      { name: "phone-landscape", width: 844, height: 390, mobile: true },
      { name: "tablet", width: 768, height: 1024, mobile: true },
      { name: "desktop", width: 1366, height: 900, mobile: false },
      { name: "wide", width: 1920, height: 1080, mobile: false }
    ];
    const cookieConsent = await smokeCookieConsent(cdp, `${BASE_URL}/`);
    const responsivePaths = ["/", "/contact/", "/tools/", "/guides/", "/updates/", "/tools/meta-tags/", "/tools/json-formatter/", "/tools/word-counter/", "/tools/youtube-title-generator/"];
    for (const viewport of viewportMatrix) {
      for (const pathName of responsivePaths) {
        pageChecks.push({ viewport: viewport.name, path: pathName, ...(await smokePage(cdp, `${BASE_URL}${pathName}`, viewport)) });
      }
    }

    await cdp.send("Page.navigate", { url: `${BASE_URL}/tools/` });
    await waitForReady(cdp);
    const toolsInteraction = await evalJson(cdp, `(async () => {
      const input = document.querySelector("#toolsSearch");
      const status = document.querySelector("#toolsSearchMeta");
      const reset = document.querySelector("#toolsReset");
      const cards = Array.from(document.querySelectorAll(".tool-sections .tool-card-enhanced"));
      if (!input || !status || !reset || cards.length < 60) return { ok: false, reason: "missing tools search controls" };
      input.value = "json formatter";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 260));
      const visibleAfterSearch = cards.filter((card) => getComputedStyle(card).display !== "none").length;
      const statusText = status.textContent.trim();
      reset.click();
      await new Promise((resolve) => setTimeout(resolve, 160));
      const visibleAfterReset = cards.filter((card) => getComputedStyle(card).display !== "none").length;
      return {
        ok: visibleAfterSearch > 0 && visibleAfterSearch < cards.length && /json formatter/i.test(statusText) && visibleAfterReset === cards.length,
        visibleAfterSearch,
        visibleAfterReset,
        statusText
      };
    })()`);

    await cdp.send("Page.navigate", { url: `${BASE_URL}/guides/` });
    await waitForReady(cdp);
    const guidesInteraction = await evalJson(cdp, `(async () => {
      const input = document.querySelector("#guideSearch");
      const status = document.querySelector("#guideSearchStatus");
      const reset = document.querySelector("#guideSearchReset");
      const cards = Array.from(document.querySelectorAll(".guide-category-band .guide-hub-card"));
      const overview = document.querySelector(".guide-hub-overview");
      if (!input || !status || !reset || cards.length < 35) return { ok: false, reason: "missing guide search controls" };
      input.value = "utm";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 260));
      const visibleAfterSearch = cards.filter((card) => !card.hidden).length;
      const statusText = status.textContent.trim();
      const overviewHidden = overview ? overview.hidden : false;
      reset.click();
      await new Promise((resolve) => setTimeout(resolve, 160));
      const visibleAfterReset = cards.filter((card) => !card.hidden).length;
      return {
        ok: visibleAfterSearch > 0 && visibleAfterSearch < cards.length && /utm/i.test(statusText) && overviewHidden && visibleAfterReset === cards.length,
        visibleAfterSearch,
        visibleAfterReset,
        overviewHidden,
        statusText
      };
    })()`);

    const advancedSearchAccess = await smokeAdvancedSearchAccess(cdp, BASE_URL);

    await cdp.send("Page.navigate", { url: `${BASE_URL}/tools/` });
    await waitForReady(cdp);
    const toolUrls = await evalJson(cdp, `(() => (window.ClickozCMS?.tools || []).map((tool) => tool.url))()`);
    const toolChecks = [];
    for (const toolUrl of toolUrls) {
      const result = await smokePage(cdp, `${BASE_URL}${toolUrl}`, { width: 390, height: 844, mobile: true });
      toolChecks.push({
        path: toolUrl,
        hasToolOutput: result.hasToolOutput,
        overflowX: result.overflowX,
        exampleOk: result.exampleStability ? result.exampleStability.ok : true,
        exampleStability: result.exampleStability
      });
    }

    const events = cdp.events.filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method === "Log.entryAdded") return event.params?.entry?.level === "error";
      return false;
    });
    const mobileViewportNames = new Set(["small-phone", "mobile", "phone-landscape", "tablet"]);
    const mobileAmbientStable = (item) => {
      if (!mobileViewportNames.has(item.viewport)) return true;
      if (item.ambient.leanMode) return true;
      const hasAmbient = item.ambient.particleNodes > 0 || item.ambient.hasSpaceCanvas || item.ambient.hasNeonGrid;
      return hasAmbient && item.ambient.particleNodes <= 240;
    };
    const failures = [
      ...pageChecks.filter((item) =>
        item.overflowX ||
        item.fixedBottomCount ||
        item.visualOverflowCount ||
        !mobileAmbientStable(item)
      ),
      ...toolChecks.filter((item) => item.overflowX || !item.hasToolOutput || !item.exampleOk),
      ...[cookieConsent].filter((item) => !item.ok).map((item) => ({ path: "/", interaction: "cookie-consent", ...item })),
      ...[advancedSearchAccess].filter((item) => !item.ok).map((item) => ({ path: "/", interaction: "advanced-search-access", ...item })),
      ...[toolsInteraction].filter((item) => !item.ok).map((item) => ({ path: "/tools/", interaction: "tools-search", ...item })),
      ...[guidesInteraction].filter((item) => !item.ok).map((item) => ({ path: "/guides/", interaction: "guide-search", ...item }))
    ];
    const report = {
      ok: failures.length === 0 && events.length === 0,
      checkedPages: pageChecks.length,
      viewportMatrix: viewportMatrix.map(({ name, width, height }) => `${name}:${width}x${height}`),
      checkedTools: toolChecks.length,
      responsiveSummary: {
        pageOverflowChecks: pageChecks.filter((item) => item.overflowX || item.visualOverflowCount).length,
        fixedBottomIssues: pageChecks.filter((item) => item.fixedBottomCount).length,
        mobileAmbientIssues: pageChecks.filter((item) => !mobileAmbientStable(item)).length
      },
      contactTarget: pageChecks.find((item) => item.path === "/contact/")?.contactEmail || null,
      interactions: { cookieConsent, advancedSearchAccess, toolsSearch: toolsInteraction, guidesSearch: guidesInteraction },
      failures,
      browserErrors: events.map((event) => event.params?.entry?.text || event.params?.exceptionDetails?.text || event.method)
    };
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1200);
      chrome.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); }
    catch (_) {}
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
