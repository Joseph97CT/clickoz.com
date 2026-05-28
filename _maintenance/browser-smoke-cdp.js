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
    const layout = (() => {
      const dialog = document.querySelector(".cz-command-dialog");
      const back = document.querySelector(".cz-command-return");
      const input = document.querySelector("#czCommandInput");
      const results = document.querySelector("#czCommandResults");
      const dialogRect = dialog?.getBoundingClientRect();
      const backRect = back?.getBoundingClientRect();
      const inputRect = input?.getBoundingClientRect();
      return {
        returnVisible: Boolean(back && backRect && backRect.width > 90 && backRect.height >= 38),
        resultVisible: Boolean(results && results.getBoundingClientRect().height > 180),
        inputInside: Boolean(dialogRect && inputRect && inputRect.left >= dialogRect.left - 1 && inputRect.right <= dialogRect.right + 1),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1
      };
    })();
    document.querySelector("[data-command-close]")?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      copy: text,
      opened,
      layout,
      mentionsFive: /5\\s*(quick|times)|five/i.test(text),
      mentionsCtrl: /Ctrl/i.test(text) && /K/.test(text)
    };
  })()`);

  const mobileMenuAccess = await evalJson(cdp, `(async () => {
    const burger = document.querySelector("#burger");
    if (!burger) return { openedByBurgerBurst: false, reason: "missing burger" };
    const tapBurger = () => burger.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: 32,
      clientY: 32
    }));
    for (let i = 0; i < 5; i += 1) tapBurger();
    await new Promise((resolve) => setTimeout(resolve, 220));
    const openedByBurgerBurst = Boolean(document.querySelector("#czCommandPalette") && !document.querySelector("#czCommandPalette").hidden);
    const back = document.querySelector(".cz-command-return");
    const backRect = back?.getBoundingClientRect();
    const returnVisible = Boolean(back && backRect && backRect.width > 90 && backRect.height >= 38 && backRect.right <= window.innerWidth + 1);
    document.querySelector("[data-command-close]")?.click();
    return { openedByBurgerBurst, returnVisible };
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
    const burstLayout = (() => {
      const dialog = document.querySelector(".cz-command-dialog");
      const back = document.querySelector(".cz-command-return");
      const search = document.querySelector(".cz-command-search");
      const results = document.querySelector("#czCommandResults");
      const dialogRect = dialog?.getBoundingClientRect();
      const backRect = back?.getBoundingClientRect();
      const searchRect = search?.getBoundingClientRect();
      return {
        returnVisible: Boolean(back && backRect && backRect.width > 90 && backRect.height >= 38),
        searchInside: Boolean(dialogRect && searchRect && searchRect.left >= dialogRect.left - 1 && searchRect.right <= dialogRect.right + 1),
        resultVisible: Boolean(results && results.getBoundingClientRect().height > 180),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1
      };
    })();
    document.querySelector("[data-command-close]")?.click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    hint?.click();
    await new Promise((resolve) => setTimeout(resolve, 160));
    const openedByHint = Boolean(document.querySelector("#czCommandPalette") && !document.querySelector("#czCommandPalette").hidden);
    const hintReturnVisible = Boolean(document.querySelector(".cz-command-return") && document.querySelector(".cz-command-return").getBoundingClientRect().height >= 38);
    document.querySelector("[data-command-close]")?.click();
    return {
      copy: text,
      openedByBurst,
      openedByHint,
      burstLayout,
      hintReturnVisible,
      mentionsFive: /5\\s*(quick|times)|five/i.test(text),
      mentionsCtrl: /Ctrl/i.test(text) && /K/.test(text)
    };
  })()`);

  try { await cdp.send("Emulation.clearDeviceMetricsOverride"); } catch (_) {}
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 450));
  const desktopAccess = await evalJson(cdp, `(async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "k" }));
    await new Promise((resolve) => setTimeout(resolve, 200));
    const palette = document.querySelector("#czCommandPalette");
    const dialog = document.querySelector(".cz-command-dialog");
    const sidebar = document.querySelector(".cz-command-sidebar");
    const detail = document.querySelector(".cz-command-detail");
    const back = document.querySelector(".cz-command-return");
    const results = document.querySelector("#czCommandResults");
    const opened = Boolean(palette && !palette.hidden);
    const dialogRect = dialog?.getBoundingClientRect();
    const backRect = back?.getBoundingClientRect();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const detailRect = detail?.getBoundingClientRect();
    const resultsRect = results?.getBoundingClientRect();
    const dialogStyle = dialog ? getComputedStyle(dialog) : null;
    const sidebarStyle = sidebar ? getComputedStyle(sidebar) : null;
    const detailStyle = detail ? getComputedStyle(detail) : null;
    const returnVisible = Boolean(back && backRect && backRect.width > 90 && backRect.height >= 38);
    const sidebarVisible = Boolean(sidebarRect && sidebarRect.width > 180 && sidebarStyle?.display !== "none");
    const detailVisible = Boolean(detailRect && detailRect.width > 260 && detailStyle?.display !== "none");
    const resultVisible = Boolean(resultsRect && resultsRect.height > 320);
    const dialogInside = Boolean(dialogRect && dialogRect.left >= -1 && dialogRect.right <= window.innerWidth + 1 && dialogRect.bottom <= window.innerHeight + 1);
    const noOverflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
    document.querySelector("[data-command-close]")?.click();
    return {
      opened,
      returnVisible,
      sidebarVisible,
      detailVisible,
      resultVisible,
      dialogInside,
      noOverflow,
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, docWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth },
      debug: {
        dialog: dialogRect ? { width: Math.round(dialogRect.width), height: Math.round(dialogRect.height), display: dialogStyle?.display || "", columns: dialogStyle?.gridTemplateColumns || "" } : null,
        sidebar: sidebarRect ? { width: Math.round(sidebarRect.width), height: Math.round(sidebarRect.height), display: sidebarStyle?.display || "" } : null,
        detail: detailRect ? { width: Math.round(detailRect.width), height: Math.round(detailRect.height), display: detailStyle?.display || "" } : null,
        results: resultsRect ? { width: Math.round(resultsRect.width), height: Math.round(resultsRect.height) } : null
      }
    };
  })()`);

  return {
    ok: homeAccess.opened &&
      homeAccess.layout.returnVisible &&
      homeAccess.layout.resultVisible &&
      homeAccess.layout.inputInside &&
      homeAccess.layout.noOverflow &&
      homeAccess.mentionsFive &&
      homeAccess.mentionsCtrl &&
      toolsAccess.openedByBurst &&
      toolsAccess.openedByHint &&
      mobileMenuAccess.openedByBurgerBurst &&
      mobileMenuAccess.returnVisible &&
      toolsAccess.burstLayout.returnVisible &&
      toolsAccess.burstLayout.searchInside &&
      toolsAccess.burstLayout.resultVisible &&
      toolsAccess.burstLayout.noOverflow &&
      toolsAccess.hintReturnVisible &&
      toolsAccess.mentionsFive &&
      toolsAccess.mentionsCtrl &&
      desktopAccess.opened &&
      desktopAccess.returnVisible &&
      desktopAccess.sidebarVisible &&
      desktopAccess.detailVisible &&
      desktopAccess.resultVisible &&
      desktopAccess.dialogInside &&
      desktopAccess.noOverflow,
    homeAccess,
    mobileMenuAccess,
    toolsAccess,
    desktopAccess
  };
}

async function smokeMobileMenuFit(cdp, baseUrl) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 450));
  return evalJson(cdp, `(async () => {
    const burger = document.querySelector("#burger");
    if (!burger) return { ok: false, reason: "missing burger" };
    burger.click();
    await new Promise((resolve) => setTimeout(resolve, 260));
    const menu = document.querySelector("#mobileMenu");
    const command = document.querySelector(".m-advanced-search");
    const language = document.querySelector(".m-lang-block");
    const colors = document.querySelector(".m-colors");
    const internalClose = document.querySelector("#mClose");
    if (!menu || !command || !language || !colors) return { ok: false, reason: "missing menu blocks" };
    const menuRect = menu.getBoundingClientRect();
    const blocks = [command, language, colors, ...Array.from(colors.children)].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        className: node.className || node.id || node.tagName,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        inside: rect.left >= menuRect.left - 1 && rect.right <= menuRect.right + 1
      };
    });
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    const offenders = Array.from(document.querySelectorAll("body *")).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        selector: node.id ? "#" + node.id : node.className ? "." + String(node.className).trim().replace(/\\s+/g, ".") : node.tagName.toLowerCase(),
        left: rect.left,
        right: rect.right,
        width: rect.width
      };
    }).filter((item) => item.width > 0 && (item.left < -1 || item.right > window.innerWidth + 1)).slice(0, 12);
    const scrollOffenders = Array.from(document.querySelectorAll("body *")).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        selector: node.id ? "#" + node.id : node.className ? "." + String(node.className).trim().replace(/\\s+/g, ".") : node.tagName.toLowerCase(),
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        rectWidth: rect.width,
        overflowX: getComputedStyle(node).overflowX
      };
    }).filter((item) => item.scrollWidth > item.clientWidth + 1).slice(0, 16);
    const menuInsideViewport = menuRect.left >= -1 && menuRect.right <= window.innerWidth + 1 && menuRect.width <= window.innerWidth;
    const burgerStyle = getComputedStyle(burger);
    const languageRect = language.getBoundingClientRect();
    const languageVisible = languageRect.bottom <= menuRect.bottom + 1 || menu.scrollHeight > menu.clientHeight;
    const burgerIsSolid = /gradient|rgb/i.test(burgerStyle.backgroundImage) && burgerStyle.boxShadow !== "none";
    const bodyRect = document.body.getBoundingClientRect();
    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(document.documentElement);
    burger.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    return {
      ok: menuInsideViewport && !overflowX && blocks.every((block) => block.inside) && !internalClose && languageVisible && burgerIsSolid,
      menuInsideViewport,
      overflowX,
      internalClose: !!internalClose,
      languageVisible,
      burgerIsSolid,
      scroll: {
        innerWidth: window.innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        bodyRect: { left: bodyRect.left, right: bodyRect.right, width: bodyRect.width },
        bodyStyle: {
          width: bodyStyle.width,
          minWidth: bodyStyle.minWidth,
          marginLeft: bodyStyle.marginLeft,
          marginRight: bodyStyle.marginRight,
          paddingLeft: bodyStyle.paddingLeft,
          paddingRight: bodyStyle.paddingRight,
          overflowX: bodyStyle.overflowX
        },
        htmlStyle: {
          width: htmlStyle.width,
          minWidth: htmlStyle.minWidth,
          overflowX: htmlStyle.overflowX
        }
      },
      menu: { left: menuRect.left, right: menuRect.right, width: menuRect.width },
      blocks,
      offenders,
      scrollOffenders
    };
  })()`);
}

async function smokeMetaverseLab(cdp, baseUrl) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/metaverse/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 700));
  const desktop = await evalJson(cdp, `(async () => {
    const frame = document.querySelector("#deviceFrame");
    const iframe = document.querySelector("#previewFrame");
    const pageSelect = document.querySelector("#pageSelect");
    const tablet = document.querySelector('[data-family="tablet"]');
    const tv = document.querySelector('[data-family="tv"]');
    if (!frame || !iframe || !pageSelect || !tablet || !tv) return { ok: false, reason: "missing controls" };
    const initialViewport = document.querySelector("#metricViewport")?.textContent.trim() || "";
    tablet.click();
    await new Promise((resolve) => setTimeout(resolve, 220));
    const tabletViewport = document.querySelector("#metricViewport")?.textContent.trim() || "";
    pageSelect.value = "/tools/";
    pageSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 520));
    const route = document.querySelector("#metricRoute")?.textContent.trim() || "";
    tv.click();
    await new Promise((resolve) => setTimeout(resolve, 220));
    const tvViewport = document.querySelector("#metricViewport")?.textContent.trim() || "";
    const tvScale = document.querySelector("#metricScale")?.textContent.trim() || "";
    const stage = document.querySelector("#stageViewport");
    const tvFrameRect = frame.getBoundingClientRect();
    const tvStageRect = stage?.getBoundingClientRect();
    const tvFrameFitsStage = Boolean(stage && tvStageRect) &&
      tvFrameRect.width <= stage.clientWidth - 32 &&
      tvFrameRect.left >= tvStageRect.left - 1 &&
      tvFrameRect.right <= tvStageRect.right + 1 &&
      stage.scrollWidth <= stage.clientWidth + 2;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    return {
      ok: /390 x 844/.test(initialViewport) &&
        /768 x 1024/.test(tabletViewport) &&
        route === "/tools/" &&
        iframe.getAttribute("src") === "/tools/" &&
        /1920 x 1080/.test(tvViewport) &&
        /%/.test(tvScale) &&
        tvFrameFitsStage &&
        !overflowX,
      initialViewport,
      tabletViewport,
      route,
      iframeSrc: iframe.getAttribute("src"),
      tvViewport,
      tvScale,
      tvFrame: {
        width: Math.round(tvFrameRect.width),
        height: Math.round(tvFrameRect.height),
        stageWidth: stage?.clientWidth || 0,
        stageScrollWidth: stage?.scrollWidth || 0,
        fitsStage: tvFrameFitsStage
      },
      overflowX
    };
  })()`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/metaverse/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 700));
  const mobile = await evalJson(cdp, `(() => {
    const deck = document.querySelector(".control-deck");
    const topbar = document.querySelector(".lab-topbar");
    const route = document.querySelector(".route-field");
    const frame = document.querySelector("#deviceFrame");
    const iframe = document.querySelector("#previewFrame");
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    const inside = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.width <= window.innerWidth + 1;
    };
    return {
      ok: !!frame && !!iframe && inside(deck) && inside(topbar) && inside(route) && !overflowX,
      hasFrame: !!frame,
      iframeSrc: iframe?.getAttribute("src") || "",
      deckInside: inside(deck),
      topbarInside: inside(topbar),
      routeInside: inside(route),
      overflowX,
      width: window.innerWidth
    };
  })()`);

  return {
    ok: desktop.ok && mobile.ok,
    desktop,
    mobile
  };
}

async function smokeCmsFullMap(cdp, baseUrl) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/updates/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const entryDesktop = await evalJson(cdp, `(async () => {
    document.querySelector("#cookieEssential")?.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const panel = document.querySelector(".source-command-panel-lite");
    const map = document.querySelector(".source-map-visual.neural-map-shell");
    const button = document.querySelector(".updates-full-map-btn");
    if (!panel || !map || !button) return { ok: false, reason: "missing updates map entry", hasPanel: !!panel, hasMap: !!map, hasButton: !!button };
    const rect = button.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const style = getComputedStyle(button);
    const centerX = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
    const centerY = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
    const topElement = document.elementFromPoint(centerX, centerY);
    const visible = rect.width >= 180 && rect.height >= 38 && rect.top >= mapRect.top && rect.bottom <= mapRect.bottom + 1 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > .5;
    const clickable = topElement === button || button.contains(topElement);
    return {
      ok: button.getAttribute("href") === "/updates/cms-map/?from=updates" && /interactive map/i.test(button.textContent) && visible && clickable,
      href: button.getAttribute("href"),
      text: button.textContent.trim(),
      visible,
      clickable,
      topElement: topElement ? { tag: topElement.tagName, id: topElement.id, className: topElement.className } : null,
      rect: { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
      mapRect: { top: mapRect.top, bottom: mapRect.bottom }
    };
  })()`);
  await cdp.send("Page.navigate", { url: `${baseUrl}/updates/cms-map/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 900));
  const desktop = await evalJson(cdp, `(async () => {
    const canvas = document.querySelector("#cmsFullMapCanvas");
    const expand = document.querySelector("[data-map-expand]");
    const collapse = document.querySelector("[data-map-collapse]");
    const activeNav = document.querySelector('.nav-links a[aria-current="page"][href="/updates/"]');
    const stage = document.querySelector(".cms-map-stage");
    const controlbar = document.querySelector(".cms-map-controlbar");
    const hud = document.querySelector(".cms-map-hud");
    const back = document.querySelector(".cms-map-back");
    const footer = document.querySelector("body > footer.footer");
    if (!canvas || !expand || !collapse || !stage || !controlbar || !hud || !back) return { ok: false, reason: "missing map controls" };
    collapse.click();
    await new Promise((resolve) => setTimeout(resolve, 120));
    expand.click();
    await new Promise((resolve) => setTimeout(resolve, 240));
    const tools = Number(document.querySelector("#cmsMapTools")?.textContent.trim() || 0);
    const guides = Number(document.querySelector("#cmsMapGuides")?.textContent.trim() || 0);
    const nodes = Number(document.querySelector("#cmsMapNodes")?.textContent.trim() || 0);
    const rect = stage.getBoundingClientRect();
    const controlbarRect = controlbar.getBoundingClientRect();
    const hudRect = hud.getBoundingClientRect();
    const backRect = back.getBoundingClientRect();
    const statCount = document.querySelectorAll(".cms-map-stats > span").length;
    const actionCount = document.querySelectorAll(".cms-map-actions > button").length;
    const clientWidth = document.documentElement.clientWidth;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    const pixels = canvas.getContext("2d").getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    const nonBlank = pixels[3] > 0 || pixels[0] + pixels[1] + pixels[2] > 0;
    const controlbarInside = controlbarRect.left >= -1 && controlbarRect.right <= window.innerWidth + 1;
    const backNearHud = Math.abs(backRect.right - hudRect.left) < 24;
    return {
      ok: !!activeNav && !footer && tools === 66 && guides === 41 && nodes >= 120 && statCount === 3 && actionCount === 5 && rect.width >= clientWidth - 2 && controlbarRect.top < 130 && controlbarInside && backNearHud && !overflowX && nonBlank,
      activeNav: !!activeNav,
      noFooter: !footer,
      tools,
      guides,
      nodes,
      statCount,
      actionCount,
      stageWidth: rect.width,
      clientWidth,
      controlbarTop: controlbarRect.top,
      controlbarInside,
      backNearHud,
      hudTop: hudRect.top,
      backTop: backRect.top,
      overflowX,
      nonBlank
    };
  })()`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/updates/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const entryMobile = await evalJson(cdp, `(async () => {
    document.querySelector("#cookieEssential")?.click();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const map = document.querySelector(".source-map-visual.neural-map-shell");
    const button = document.querySelector(".updates-full-map-btn");
    if (!map || !button) return { ok: false, reason: "missing mobile updates map entry", hasMap: !!map, hasButton: !!button };
    const beforeRect = button.getBoundingClientRect();
    const scroller = document.scrollingElement || document.documentElement;
    const targetScroll = Math.max(0, beforeRect.top + window.scrollY - (window.innerHeight - beforeRect.height) / 2);
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.scrollBehavior = "auto";
    scroller.style.scrollBehavior = "auto";
    scroller.scrollTop = targetScroll;
    window.scrollTo(0, targetScroll);
    await new Promise((resolve) => setTimeout(resolve, 180));
    const rect = button.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const style = getComputedStyle(button);
    const centerX = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
    const centerY = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
    const topElement = document.elementFromPoint(centerX, centerY);
    const visible = rect.width >= 220 && rect.height >= 34 && rect.top >= mapRect.top && rect.bottom <= mapRect.bottom + 1 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > .5;
    const clickable = topElement === button || button.contains(topElement);
    return {
      ok: button.getAttribute("href") === "/updates/cms-map/?from=updates" && visible && clickable,
      href: button.getAttribute("href"),
      visible,
      clickable,
      topElement: topElement ? { tag: topElement.tagName, id: topElement.id, className: topElement.className } : null,
      rect: { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
      mapRect: { top: mapRect.top, bottom: mapRect.bottom },
      width: window.innerWidth
    };
  })()`);
  await cdp.send("Page.navigate", { url: `${baseUrl}/updates/cms-map/` });
  await waitForReady(cdp);
  await new Promise((resolve) => setTimeout(resolve, 900));
  const mobile = await evalJson(cdp, `(() => {
    const canvas = document.querySelector("#cmsFullMapCanvas");
    const stage = document.querySelector(".cms-map-stage");
    const controlbar = document.querySelector(".cms-map-controlbar");
    const hud = document.querySelector(".cms-map-hud");
    const back = document.querySelector(".cms-map-back");
    const footer = document.querySelector("body > footer.footer");
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1;
    const inside = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.width <= window.innerWidth + 1;
    };
    const statCount = document.querySelectorAll(".cms-map-stats > span").length;
    const actionCount = document.querySelectorAll(".cms-map-actions > button").length;
    const controlbarRect = controlbar?.getBoundingClientRect();
    const controlsVisible = Boolean(controlbarRect && controlbarRect.top >= -1 && controlbarRect.bottom <= window.innerHeight * .25);
    return {
      ok: !!canvas && !footer && inside(stage) && inside(controlbar) && inside(back) && controlsVisible && statCount === 3 && actionCount === 5 && !overflowX,
      hasCanvas: !!canvas,
      noFooter: !footer,
      stageInside: inside(stage),
      controlbarInside: inside(controlbar),
      controlsVisible,
      hudInside: inside(hud),
      backInside: inside(back),
      statCount,
      actionCount,
      overflowX,
      width: window.innerWidth,
      docWidth: document.documentElement.scrollWidth
    };
  })()`);

  return {
    ok: entryDesktop.ok && desktop.ok && entryMobile.ok && mobile.ok,
    entryDesktop,
    desktop,
    entryMobile,
    mobile
  };
}

async function smokeToolCardTextFit(cdp, baseUrl) {
  const viewports = [
    { name: "desktop-tight", width: 1180, height: 900, mobile: false },
    { name: "desktop-two-col", width: 1100, height: 900, mobile: false },
    { name: "tablet", width: 768, height: 900, mobile: true },
    { name: "mobile", width: 390, height: 844, mobile: true }
  ];
  const checks = [];

  for (const viewport of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      mobile: Boolean(viewport.mobile)
    });
    await cdp.send("Page.navigate", { url: `${baseUrl}/tools/` });
    await waitForReady(cdp);
    await new Promise((resolve) => setTimeout(resolve, 420));
    const result = await evalJson(cdp, `(() => {
      const limit = 3;
      const rect = (node) => {
        const box = node.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
      };
      const issue = (type, card, details) => ({
        type,
        section: card.closest(".tool-section")?.id || "",
        title: card.querySelector("h3")?.textContent.trim() || "",
        ...details
      });
      const cards = Array.from(document.querySelectorAll("body.tools-page .tool-section .cards-grid > .card.tool-card-enhanced"))
        .filter((card) => !card.hidden && getComputedStyle(card).display !== "none");
      const issues = [];

      for (const card of cards) {
        const title = card.querySelector("h3");
        const copy = card.querySelector(".card-top p");
        const header = card.querySelector(".card-top");
        const preview = card.querySelector(".tool-output-preview");
        if (!title || !copy || !header || !preview) {
          issues.push(issue("missing-node", card, {}));
          continue;
        }
        const titleOverflow = Math.ceil(title.scrollHeight - title.clientHeight);
        const copyOverflow = Math.ceil(copy.scrollHeight - copy.clientHeight);
        const titleCopyOverlap = Math.ceil(rect(title).bottom - rect(copy).top);
        const headerPreviewOverlap = Math.ceil(rect(header).bottom - rect(preview).top);
        if (titleOverflow > limit || copyOverflow > limit || titleCopyOverlap > limit || headerPreviewOverlap > limit) {
          issues.push(issue("text-fit", card, {
            titleOverflow,
            copyOverflow,
            titleCopyOverlap,
            headerPreviewOverlap
          }));
        }
      }

      const rows = new Map();
      for (const card of cards) {
        const key = String(Math.round(rect(card).top / 3) * 3);
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push(card);
      }
      for (const row of rows.values()) {
        if (row.length < 2) continue;
        const spreads = {};
        for (const [name, selector] of Object.entries({
          title: "h3",
          copy: ".card-top p",
          preview: ".tool-output-preview",
          features: ".tool-mini-features",
          cta: ".tool-cta"
        })) {
          const tops = row.map((card) => rect(card.querySelector(selector)).top);
          spreads[name] = Math.max(...tops) - Math.min(...tops);
        }
        if (Object.values(spreads).some((value) => value > limit)) {
          issues.push({
            type: "row-alignment",
            titles: row.map((card) => card.querySelector("h3")?.textContent.trim() || ""),
            spreads
          });
        }
      }

      return {
        ok: issues.length === 0,
        cardCount: cards.length,
        issues: issues.slice(0, 12)
      };
    })()`);
    checks.push({ viewport: viewport.name, ...result });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks
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

    if (process.env.CLICKOZ_SMOKE_ONLY_MENU === "1") {
      console.log(JSON.stringify(await smokeMobileMenuFit(cdp, BASE_URL), null, 2));
      return;
    }

    if (process.env.CLICKOZ_SMOKE_ONLY_METAVERSE === "1") {
      console.log(JSON.stringify(await smokeMetaverseLab(cdp, BASE_URL), null, 2));
      return;
    }

    if (process.env.CLICKOZ_SMOKE_ONLY_CMS_MAP === "1") {
      console.log(JSON.stringify(await smokeCmsFullMap(cdp, BASE_URL), null, 2));
      return;
    }

    if (process.env.CLICKOZ_SMOKE_ONLY_ADVANCED === "1") {
      console.log(JSON.stringify(await smokeAdvancedSearchAccess(cdp, BASE_URL), null, 2));
      return;
    }

    if (process.env.CLICKOZ_SMOKE_ONLY_TOOL_CARDS === "1") {
      console.log(JSON.stringify(await smokeToolCardTextFit(cdp, BASE_URL), null, 2));
      return;
    }

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
      if (!input || !status || !reset || cards.length < 18) return { ok: false, reason: "missing tools search controls" };
      input.value = "seo snippet";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 260));
      const visibleAfterSearch = cards.filter((card) => getComputedStyle(card).display !== "none").length;
      const statusText = status.textContent.trim();
      reset.click();
      await new Promise((resolve) => setTimeout(resolve, 160));
      const visibleAfterReset = cards.filter((card) => getComputedStyle(card).display !== "none").length;
      return {
        ok: visibleAfterSearch > 0 && visibleAfterSearch < cards.length && /seo snippet/i.test(statusText) && visibleAfterReset === cards.length,
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
      if (!input || !status || !reset || cards.length < 18) return { ok: false, reason: "missing guide search controls" };
      input.value = "youtube";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 260));
      const visibleAfterSearch = cards.filter((card) => !card.hidden).length;
      const statusText = status.textContent.trim();
      const overviewHidden = overview ? overview.hidden : false;
      reset.click();
      await new Promise((resolve) => setTimeout(resolve, 160));
      const visibleAfterReset = cards.filter((card) => !card.hidden).length;
      return {
        ok: visibleAfterSearch > 0 && visibleAfterSearch < cards.length && /youtube/i.test(statusText) && overviewHidden && visibleAfterReset === cards.length,
        visibleAfterSearch,
        visibleAfterReset,
        overviewHidden,
        statusText
      };
    })()`);

    const advancedSearchAccess = await smokeAdvancedSearchAccess(cdp, BASE_URL);
    const mobileMenuFit = await smokeMobileMenuFit(cdp, BASE_URL);
    const metaverseLab = await smokeMetaverseLab(cdp, BASE_URL);
    const toolCardTextFit = await smokeToolCardTextFit(cdp, BASE_URL);

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
      ...[mobileMenuFit].filter((item) => !item.ok).map((item) => ({ path: "/", interaction: "mobile-menu-fit", ...item })),
      ...[metaverseLab].filter((item) => !item.ok).map((item) => ({ path: "/metaverse/", interaction: "metaverse-lab", ...item })),
      ...[toolCardTextFit].filter((item) => !item.ok).map((item) => ({ path: "/tools/", interaction: "tool-card-text-fit", ...item })),
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
      interactions: { cookieConsent, advancedSearchAccess, mobileMenuFit, metaverseLab, toolCardTextFit, toolsSearch: toolsInteraction, guidesSearch: guidesInteraction },
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
