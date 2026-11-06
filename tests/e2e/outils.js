/* Outils des tests navigateur : petit serveur local (sans dépendance) et ouverture de l'appli avec un localStorage préparé.
   Playwright et Chromium sont fournis par l'environnement de test (require("playwright")), rien n'est ajouté à l'appli. */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css" };

/* Sert le dossier root ; setRoot(dossier) change le dossier servi (test de mise à jour d'une version à l'autre). */
function serve(root, opts) {
  root = root || ROOT; opts = opts || {};
  const hits = [];
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    hits.push(u);
    let f = path.join(root, u === "/" ? "index.html" : u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("absent"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok({ url: "http://127.0.0.1:" + srv.address().port + "/", hits, setRoot: r => { root = r; }, close: () => new Promise(c => srv.close(c)) })));
}

/* Polices Google et Firebase : jamais demandées au réseau pendant les tests (environnement sans accès, résultats reproductibles) */
async function blockExternal(ctx) {
  await ctx.route(url => !/^http:\/\/127\.0\.0\.1/.test(String(url)), r => r.abort());
}

/* Ouvre une page dont le localStorage est préparé avant le premier chargement (une seule fois : un rechargement garde l'état de l'appli) */
async function openApp(browser, base, opts) {
  opts = opts || {};
  const { devices } = require("playwright");
  const dev = Object.assign({}, devices[opts.device || "iPhone 13"]);
  delete dev.defaultBrowserType;
  const ctx = await browser.newContext(Object.assign(dev, { serviceWorkers: opts.sw ? "allow" : "block" }));
  await blockExternal(ctx);
  if (opts.before) await opts.before(ctx); /* par exemple le faux Firebase (tests/e2e/faux-firebase.js) */
  if (opts.storage) {
    await ctx.addInitScript(st => {
      try {
        if (sessionStorage.getItem("__seeded")) return;
        localStorage.clear();
        Object.keys(st).forEach(k => { if (st[k] != null) localStorage.setItem(k, st[k]); });
        sessionStorage.setItem("__seeded", "1");
      } catch (e) { }
    }, opts.storage);
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e && e.message || e)));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(base + (opts.path || ""));
  await page.waitForSelector("#view .card, #onb:not([hidden])");
  return { ctx, page, errors };
}

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", name), "utf8"));
}

module.exports = { serve, openApp, fixture, blockExternal, ROOT };
