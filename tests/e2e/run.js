/* Tests navigateur de Fonte (phase 3A) : node tests/e2e/run.js
   Chromium piloté par Playwright, écrans d'iPhone 13 et d'iPad Pro 11 simulés (Safari réel non disponible ici : voir la checklist manuelle).
   L'appli est servie en local ; chaque test part d'un localStorage préparé (jeux de données de tests/fixtures/).
   Couvre : D2 (Ne pas enregistrer + Annuler), D5 (copie de sécurité + Revenir), D6 (séance de plus de 12 h), D1-a (rappel de sauvegarde),
   aucune erreur JavaScript, fonctionnement hors ligne (réseau coupé + rechargement), mise à jour du service worker. */
"use strict";
const assert = require("assert");
const { serve, openApp, fixture, ROOT } = require("./outils");
/* Ancienne version de référence (celle installée sur les téléphones avant la phase 3A) */
const OLD_REV = process.env.FONTE_OLD_REV || "029e2da";

const DEVICES = (process.env.FONTE_DEVICES || "iPhone 13,iPad Pro 11").split(",");
const only = process.argv[2] || "";
let pass = 0, fail = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const DAY = 864e5;

const typ = () => fixture("v1-usage-typique.json").storage;
/* Séance terminée il y a 20 min, à enregistrer (écran de fin), avec 3 séries */
function doneRun() {
  const r = JSON.parse(fixture("v1-seance-en-cours.json").storage["fonte:run"]);
  r.start = Date.now() - 20 * 60e3; r.endAt = Date.now() - 2 * 60e3; r.done = true; r.t = null;
  return JSON.stringify(r);
}
const ls = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
const strip = raw => { const o = JSON.parse(raw); delete o.upd; delete o.agUpd; return JSON.stringify(o); };
async function tab(page, t) { await page.click(`.tab[data-t="${t}"]`); await page.waitForTimeout(50); }
/* Bouton à double toucher (arm) : deux touchers */
async function twice(page, sel) { await page.click(sel); await page.click(sel); }

/* ---------- Aucune erreur JavaScript ---------- */
["v1-vide.json", "v1-ancien-sans-objectifs.json", "v1-usage-typique.json", "v1-gros-historique.json", "v1-json-abime.json", "v1-seance-en-cours.json"].forEach(f => {
  test("aucune erreur JavaScript au démarrage et dans les 5 onglets : " + f, async (b, srv, dev) => {
    const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: fixture(f).storage });
    /* premier lancement (ou données illisibles) : le questionnaire d'accueil s'ouvre ; on le ferme pour parcourir les onglets */
    if (await page.$("#onb:not([hidden])")) await page.evaluate(() => { document.querySelector("#onb").hidden = true; });
    for (const t of ["exercices", "seances", "agenda", "profil", "accueil"]) await tab(page, t);
    if (f === "v1-json-abime.json") assert.ok(await page.$("#onb:not([hidden])") || await page.$("#view .card"), "l'appli s'ouvre malgré des données abîmées");
    await page.waitForTimeout(200);
    assert.deepStrictEqual(errors, []);
    await ctx.close();
  });
});
test("le profil ancien (sans « objectifs ») s'ouvre avec son objectif, sans perdre de séance", async (b, srv, dev) => {
  const st = fixture("v1-ancien-sans-objectifs.json").storage, before = JSON.parse(st["fonte:v1"]).historique.length;
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: st });
  const s = JSON.parse(await ls(page, "fonte:v1"));
  assert.deepStrictEqual(s.profile.objectifs, ["forme"]);
  assert.strictEqual(s.historique.length, before);
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

/* ---------- D2 ---------- */
test("D2 : « Ne pas enregistrer » demande confirmation, « Revenir » garde la séance", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:run": doneRun() }) });
  await page.click('[data-a="run-resume"]');
  await page.click('#runner [data-a="run-discard"]');
  await page.waitForSelector(".sheet h3:text('Supprimer cette séance ?')");
  assert.match(await page.textContent(".sheet-body"), /3 séries seront perdues/);
  assert.ok(await ls(page, "fonte:run"), "rien n'est supprimé avant confirmation");
  await page.click('.sheet [data-a="sheet-close"]:text("Revenir")');
  assert.ok(!(await page.$eval("#runner", e => e.hidden)), "le lecteur reste ouvert");
  assert.ok(await ls(page, "fonte:run"));
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D2 : « Supprimer » puis « Annuler » dans les 10 s restaure la séance", async (b, srv, dev) => {
  const run = doneRun();
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:run": run }) });
  await page.click('[data-a="run-resume"]');
  await page.click('#runner [data-a="run-discard"]');
  await page.click('[data-a="run-discard-ok"]');
  assert.strictEqual(await ls(page, "fonte:run"), null, "séance supprimée");
  assert.ok(await page.$eval("#runner", e => e.hidden));
  await page.waitForSelector("#undo:not([hidden])");
  assert.match(await page.textContent("#undo"), /Séance supprimée/);
  await page.click("#undo button");
  await page.waitForSelector("#runner:not([hidden])");
  assert.strictEqual(JSON.stringify(JSON.parse(await ls(page, "fonte:run")).log), JSON.stringify(JSON.parse(run).log), "mêmes séries");
  assert.ok(await page.$('#runner [data-a="run-save"]'), "écran de fin retrouvé");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D2 : « Annuler » fonctionne encore après un rechargement dans les 10 s, plus après", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:run": doneRun() }) });
  await page.click('[data-a="run-resume"]');
  await page.click('#runner [data-a="run-discard"]');
  await page.click('[data-a="run-discard-ok"]');
  await page.reload(); await page.waitForSelector("#view .card");
  await page.waitForSelector("#undo:not([hidden])");
  await page.click("#undo button");
  await page.waitForSelector("#runner:not([hidden])");
  assert.ok(await ls(page, "fonte:run"));
  /* séance supprimée il y a 11 s : plus d'« Annuler » */
  await page.evaluate(() => { const t = JSON.parse(localStorage.getItem("fonte:run")); localStorage.removeItem("fonte:run"); localStorage.setItem("fonte:run-trash", JSON.stringify({ at: Date.now() - 11e3, run: t })); });
  await page.reload(); await page.waitForSelector("#view .card");
  await page.waitForTimeout(100);
  assert.ok(await page.$eval("#undo", e => e.hidden), "pas de bandeau après 10 s");
  assert.strictEqual(await ls(page, "fonte:run-trash"), null);
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D2 : « Arrêter » › « Abandonner » avec des séries demande aussi confirmation", async (b, srv, dev) => {
  const r = JSON.parse(fixture("v1-seance-en-cours.json").storage["fonte:run"]); r.start = Date.now() - 20 * 60e3; /* séance en cours, pendant un repos */
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:run": JSON.stringify(r) }) });
  await page.click('[data-a="run-resume"]');
  await page.click('#runner [data-a="run-quit"]');
  await page.click('.sheet [data-a="run-discard"]');
  await page.waitForSelector(".sheet h3:text('Supprimer cette séance ?')");
  assert.ok(await ls(page, "fonte:run"));
  await page.click('[data-a="run-discard-ok"]');
  await page.waitForSelector("#undo:not([hidden])");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

/* ---------- D5 ---------- */
test("D5 : restauration puis « Revenir à l'état d'avant » : état d'origine identique", async (b, srv, dev) => {
  const code = fixture("v1-sauvegarde-fontedata1.json").code;
  const petit = fixture("v1-seance-en-cours.json").storage["fonte:v1"];
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: { "fonte:v1": petit, "fonte:backup": String(Date.now()) } });
  const A = await ls(page, "fonte:v1");
  await tab(page, "profil");
  assert.strictEqual(await page.$("#undo-restore"), null, "pas de copie au départ");
  await page.click('[data-a="data-import"]');
  await page.fill("#imp-data", code);
  await twice(page, '.sheet [data-a="data-restore"]');
  await page.waitForSelector("#toast:text('Données restaurées')");
  assert.strictEqual(await ls(page, "fonte:undo"), A, "copie exacte de l'état d'avant");
  const B = JSON.parse(await ls(page, "fonte:v1"));
  assert.strictEqual(B.profile.prenom, "Alex"); assert.ok(B.historique.length > JSON.parse(A).historique.length);
  await page.waitForSelector("#undo-restore");
  await twice(page, "#undo-restore");
  await page.waitForSelector("#toast:text('Données d’avant rétablies')");
  assert.strictEqual(strip(await ls(page, "fonte:v1")), strip(A), "état A retrouvé (hors dates de modification)");
  /* on peut revenir encore : l'état restauré est gardé à son tour */
  assert.strictEqual(JSON.parse(await ls(page, "fonte:undo")).historique.length, B.historique.length);
  assert.strictEqual(JSON.parse(await ls(page, "fonte:undo-info")).reason, "undo");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D5 : « Effacer l'historique » et « Tout réinitialiser » gardent une copie, réversible", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: typ() });
  for (const [act, reason] of [["hist-clear", "hist-clear"], ["reset-all", "reset-all"]]) {
    await tab(page, "profil");
    const A = await ls(page, "fonte:v1");
    await twice(page, `[data-a="${act}"]`);
    await page.waitForTimeout(100);
    assert.strictEqual(await ls(page, "fonte:undo"), A, act + " : copie exacte");
    assert.strictEqual(JSON.parse(await ls(page, "fonte:undo-info")).reason, reason);
    assert.strictEqual(JSON.parse(await ls(page, "fonte:v1")).historique.length, 0, act + " : historique vide");
    if (await page.$("#onb:not([hidden])")) await page.evaluate(() => { document.querySelector("#onb").hidden = true; });
    await tab(page, "profil");
    await twice(page, "#undo-restore");
    await page.waitForTimeout(100);
    assert.strictEqual(strip(await ls(page, "fonte:v1")), strip(A), act + " : retour à l'état d'avant");
  }
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D5 : copie impossible (mémoire pleine) → opération refusée, rien n'est modifié", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: typ() });
  const A = await ls(page, "fonte:v1");
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === "fonte:undo") { const e = new Error("plein"); e.name = "QuotaExceededError"; throw e; } return set.call(this, k, v); };
  });
  await tab(page, "profil");
  await twice(page, '[data-a="hist-clear"]');
  await page.waitForSelector("#toast:text('Pas assez de place')");
  assert.strictEqual(await ls(page, "fonte:v1"), A, "historique non effacé");
  await page.click('[data-a="data-import"]');
  await page.fill("#imp-data", fixture("v1-sauvegarde-fontedata1.json").code);
  await twice(page, '.sheet [data-a="data-restore"]');
  await page.waitForSelector("#imp-derr:text('Pas assez de place')");
  assert.strictEqual(await ls(page, "fonte:v1"), A, "restauration refusée");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

/* ---------- D6 ---------- */
test("D6 : séance de plus de 12 h proposée, enregistrée à sa date", async (b, srv, dev) => {
  const st = fixture("v1-seance-en-cours.json").storage, run = JSON.parse(st["fonte:run"]);
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: st });
  await page.waitForSelector("#run-stale");
  assert.match(await page.textContent("#run-stale"), /Séance non terminée/);
  assert.match(await page.textContent("#run-stale"), /3 séries/);
  const n0 = JSON.parse(await ls(page, "fonte:v1")).historique.length;
  await page.click('[data-a="run-stale-save"]');
  await page.waitForTimeout(100);
  const s = JSON.parse(await ls(page, "fonte:v1")), d = new Date(run.start), date = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  assert.strictEqual(s.historique.length, n0 + 1);
  const h = s.historique.find(x => x.ts === run.start);
  assert.ok(h, "séance enregistrée à son heure");
  assert.strictEqual(h.date, date, "à la date de la séance, pas aujourd'hui");
  assert.strictEqual(h.sets, 3);
  assert.ok(s.historique.every((x, i, a) => !i || (a[i - 1].ts || 0) >= (x.ts || 0)), "historique toujours du plus récent au plus ancien");
  assert.strictEqual(await ls(page, "fonte:run"), null);
  assert.strictEqual(await page.$("#run-stale"), null);
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D6 : « Supprimer » demande confirmation, puis « Annuler » la fait revenir", async (b, srv, dev) => {
  const st = fixture("v1-seance-en-cours.json").storage;
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: st });
  await page.click('[data-a="run-stale-del"]');
  await page.waitForSelector(".sheet h3:text('Supprimer cette séance ?')");
  assert.ok(await ls(page, "fonte:run"));
  await page.click('[data-a="run-stale-del-ok"]');
  assert.strictEqual(await ls(page, "fonte:run"), null);
  await page.click("#undo button");
  await page.waitForSelector("#run-stale");
  assert.strictEqual(await ls(page, "fonte:run"), st["fonte:run"].replace(/,"stale":(true|false)/, ""));
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

/* ---------- D1-a ---------- */
test("D1-a : rappel après 14 jours sans sauvegarde, « Me le rappeler dans 7 jours »", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:backup": String(Date.now() - 15 * DAY) }) });
  await page.waitForSelector("h3:text('Pense à sauvegarder'), .h3:text('Pense à sauvegarder')");
  await page.click('[data-a="bk-later"]');
  const sn = +(await ls(page, "fonte:bksnooze"));
  assert.ok(Math.abs(sn - (Date.now() + 7 * DAY)) < 60e3, "report de 7 jours");
  assert.strictEqual(await page.$("[data-a='bk-later']"), null, "rappel masqué");
  await page.reload(); await page.waitForSelector("#view .card");
  assert.strictEqual(await page.$("[data-a='bk-later']"), null, "toujours masqué après rechargement");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D1-a : pas de rappel 2 jours après une sauvegarde (moins de 10 séances depuis)", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:backup": String(Date.now() - 2 * DAY) }) });
  await page.waitForTimeout(100);
  assert.strictEqual(await page.$("[data-a='bk-later']"), null);
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D1-a : « Sauvegarder » produit un fichier qui se restaure à l'identique (aller-retour)", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:backup": String(Date.now() - 15 * DAY) }) });
  const A = JSON.parse(await ls(page, "fonte:v1"));
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-a="bk-now"]')]);
  const fs = require("fs"), file = await dl.path(), txt = fs.readFileSync(file, "utf8");
  assert.ok(Math.abs(+(await ls(page, "fonte:backup")) - Date.now()) < 60e3, "date de sauvegarde notée");
  assert.strictEqual(await page.$("[data-a='bk-later']"), null, "rappel masqué après la sauvegarde");
  /* nouvel appareil vide : restauration du fichier */
  const o = await openApp(b, srv.url, { device: dev, storage: {} });
  await o.page.evaluate(() => { const e = document.querySelector("#onb"); if (e) e.hidden = true; });
  await tab(o.page, "profil");
  await o.page.click('[data-a="data-import"]');
  await o.page.setInputFiles("#imp-file", { name: "fonte-sauvegarde.json", mimeType: "application/json", buffer: Buffer.from(txt) });
  await o.page.waitForSelector("#imp-sum:not([hidden])");
  await twice(o.page, '.sheet [data-a="data-restore"]');
  await o.page.waitForSelector("#toast:text('Données restaurées')");
  const B = JSON.parse(await ls(o.page, "fonte:v1"));
  ["profile", "mesSeances", "historique", "lastPerf", "notes", "mesures", "deload", "agenda", "imports"].forEach(k => assert.deepStrictEqual(B[k], A[k], k));
  assert.deepStrictEqual(errors.concat(o.errors), []);
  await o.ctx.close(); await ctx.close();
});

/* ---------- S1-a dans l'appli ---------- */
test("S1-a : après 5 × 5 à 100 kg au squat, une séance à 10 répétitions propose ≈ 82,5 kg", async (b, srv, dev) => {
  const s = JSON.parse(typ()["fonte:v1"]);
  s.lastPerf = { "squat-barre": { d: "2026-10-01", ts: Date.now() - 3 * DAY, sets: [1, 2, 3, 4, 5].map(() => ({ r: 5, kg: 100 })), target: 5, base: 5, feel: 2, fails: 0 } };
  s.mesSeances = [{ id: "fxs1a", nom: "Squat 10", kind: "muscu", items: [{ id: "squat-barre", series: 3, reps: 10, duree: 0, repos: 120, charge: 0 }], upd: Date.now() - 5 * DAY }];
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: Object.assign(typ(), { "fonte:v1": JSON.stringify(s), "fonte:backup": String(Date.now()), "fonte:ui": JSON.stringify({ seg: "mes" }) }) });
  await tab(page, "seances");
  await page.click('[data-a="my-open"][data-id="fxs1a"]');
  const t = await page.textContent(".sheet-body");
  assert.ok(/82,5/.test(t), "charge convertie 82,5 kg affichée : " + t.slice(0, 300));
  assert.ok(!/102,5/.test(t), "plus de 102,5 kg pour 10 répétitions");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

/* ---------- Hors ligne et mise à jour ---------- */
async function swReady(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(async () => { await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }); });
}
test("hors ligne : réseau coupé puis rechargement, l'appli s'ouvre et fonctionne", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: typ(), sw: true });
  await swReady(page);
  await page.waitForTimeout(500);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForSelector("#view .card");
  for (const t of ["exercices", "seances", "agenda", "profil", "accueil"]) await tab(page, t);
  assert.ok((await page.textContent("#hdr")).length > 0);
  await ctx.setOffline(false);
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

test("mise à jour depuis l'ancienne version en cache (main, fichier unique) : nouvelle version avec moteurs, données intactes, puis hors ligne", async (b, srv, dev) => {
  const fs = require("fs"), os = require("os"), path = require("path"), { execSync } = require("child_process");
  const old = fs.mkdtempSync(path.join(os.tmpdir(), "fonte-ancienne-"));
  ["index.html", "sw.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"].forEach(f => {
    fs.writeFileSync(path.join(old, f), execSync("git show " + OLD_REV + ":" + f, { cwd: ROOT, maxBuffer: 64 << 20 }));
  });
  const s2 = await serve(old);
  try {
    const st = typ(), n = JSON.parse(st["fonte:v1"]).historique.length;
    const { ctx, page, errors } = await openApp(b, s2.url, { device: dev, storage: st, sw: true });
    await swReady(page);
    assert.strictEqual(await page.$('script[src="js/app.js"]'), null, "ancienne version (fichier unique) en service");
    s2.setRoot(ROOT); /* le serveur publie la nouvelle version */
    await page.reload(); await page.waitForSelector("#view .card");
    await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then(r => r && r.active && r.active.scriptURL && !r.installing && !r.waiting), null, { timeout: 15000 });
    await page.waitForFunction(() => caches.keys().then(k => k.indexOf("fonte-2026-11-06-moteurs") >= 0 && k.indexOf("fonte-2026-11-05-rouge") < 0), null, { timeout: 15000 });
    await page.reload(); await page.waitForSelector("#view .card");
    assert.ok(await page.$('script[src="js/app.js"]'), "nouvelle version (moteurs séparés) chargée");
    assert.strictEqual(JSON.parse(await ls(page, "fonte:v1")).historique.length, n, "historique intact");
    await ctx.setOffline(true);
    await page.reload(); await page.waitForSelector("#view .card");
    assert.ok(await page.$('script[src="js/app.js"]'), "hors ligne : nouvelle version servie depuis le cache");
    for (const t of ["exercices", "seances", "profil", "accueil"]) await tab(page, t);
    await ctx.setOffline(false);
    assert.deepStrictEqual(errors, []);
    await ctx.close();
  } finally { await s2.close(); fs.rmSync(old, { recursive: true, force: true }); }
});
test("fichier unique assemblé (tools/assemble.js) : s'ouvre sans erreur en mode artifact Claude et en mode PWA", async (b, srv, dev) => {
  const fs = require("fs"), os = require("os"), path = require("path"), { assemble } = require("../../tools/assemble");
  for (const pwa of [false, true]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fonte-assemble-"));
    fs.writeFileSync(path.join(dir, "index.html"), assemble({ pwa }).html);
    const s3 = await serve(dir);
    try {
      const { ctx, page, errors } = await openApp(b, s3.url, { device: dev, storage: typ() });
      assert.strictEqual(await page.$("script[src]"), null, "aucun fichier externe");
      assert.strictEqual(await page.evaluate(() => !!window.FONTE_PWA), pwa);
      for (const t of ["exercices", "seances", "agenda", "profil", "accueil"]) await tab(page, t);
      assert.ok((await page.textContent("#hdr")).indexOf("Salut") >= 0 || (await page.textContent("#hdr")).length > 0);
      assert.deepStrictEqual(errors, [], pwa ? "PWA" : "artifact");
      await ctx.close();
    } finally { await s3.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  }
});
test("D8 : données d'une version plus récente → « Mets Fonte à jour », rien n'est écrasé", async (b, srv, dev) => {
  const newer = JSON.stringify({ v: 2, profiles: { active: "p1", list: [{ id: "p1", prenom: "Test" }] } });
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: { "fonte:v1": newer } });
  await page.waitForSelector("#store-block");
  assert.ok(await page.$eval("#onb", e => e.hidden), "pas de questionnaire d'accueil");
  await tab(page, "profil"); await tab(page, "accueil");
  await page.waitForTimeout(200);
  assert.strictEqual(await ls(page, "fonte:v1"), newer, "données non modifiées");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});
test("D8 : une sauvegarde d'une version plus récente est refusée à la restauration", async (b, srv, dev) => {
  const { ctx, page, errors } = await openApp(b, srv.url, { device: dev, storage: typ() });
  const A = await ls(page, "fonte:v1");
  await tab(page, "profil");
  await page.click('[data-a="data-import"]');
  await page.fill("#imp-data", JSON.stringify({ v: 2, app: "fonte", profile: { prenom: "Futur" }, historique: [] }));
  await twice(page, '.sheet [data-a="data-restore"]');
  await page.waitForSelector("#imp-derr:text('version plus récente')");
  assert.strictEqual(await ls(page, "fonte:v1"), A);
  assert.strictEqual(await ls(page, "fonte:undo"), null, "aucune copie inutile");
  assert.deepStrictEqual(errors, []);
  await ctx.close();
});

(async () => {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const srv = await serve();
  for (const dev of DEVICES) {
    console.log("Appareil simulé : " + dev);
    for (const t of tests) {
      if (only && t.name.indexOf(only) < 0) continue;
      try { await t.fn(browser, srv, dev); pass++; console.log("  ok  " + t.name); }
      catch (e) { fail++; console.log("  ÉCHEC  " + t.name + "\n        " + String(e && e.message || e).split("\n").slice(0, 6).join("\n        ")); }
    }
  }
  await browser.close(); await srv.close();
  console.log("\n" + pass + " réussis, " + fail + " en échec");
  process.exit(fail ? 1 : 0);
})();
