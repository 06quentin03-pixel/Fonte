/* Fabrique les jeux de données v1 de référence de tests/fixtures/ (phase 3A). Usage : node tools/make-fixtures.js
   Toutes les données sont INVENTÉES (prénoms fictifs, séances simulées) : aucune donnée personnelle réelle.
   Les états « usage typique », « gros historique » et « séance en cours » passent une fois dans la vraie appli (Chromium + Playwright)
   pour être enregistrés exactement comme Fonte les écrit (paliers, agenda). Les autres restent tels quels (anciens formats, données abîmées).
   Affiche aussi la taille en octets de fonte:v1 (mesure demandée en 3A). Nécessite Playwright (environnement de test seulement). */
"use strict";
const fs = require("fs");
const path = require("path");
const { charger } = require("../tests/charger");
const { serve, openApp } = require("../tests/e2e/outils");

const G = charger();
const OUT = path.join(__dirname, "..", "tests", "fixtures");
const BASE = Date.UTC(2026, 9, 30, 17, 0, 0); /* 30 oct. 2026, 18 h à Paris : date de référence des séances simulées */
const DAY = 864e5;

/* Générateur pseudo-aléatoire reproductible */
function rng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
const iso = t => new Date(t).toISOString().slice(0, 10);
let N = 0; const rid = () => "fx" + (N++).toString(36).padStart(5, "0");
const progKey = pr => pr.ids.map((id, i) => id + ":" + pr.objs[i]).join(",");

/* Historique simulé : n séances du programme, de la plus récente à la plus ancienne, charges qui progressent doucement */
function simulate(profile, n, seed, gapDays) {
  const R = rng(seed), pr = G.programme(profile), key = progKey(pr), kgOf = {}, hist = [], lastPerf = {};
  let t = BASE - n * gapDays * DAY;
  for (let k = 0; k < n; k++) {
    t += gapDays * DAY + Math.round((R() - 0.5) * 6) * 3600e3;
    const j = k % pr.ids.length, date = iso(t);
    const tpl = G.TPL_BY_ID[G.weekVariant(pr.ids[j], date)], se = G.prescribe(tpl, G.profFor(profile, pr.objs[j]));
    const log = [];
    let sets = 0, volume = 0;
    se.items.forEach(it => {
      const s = [];
      for (let q = 0; q < (it.series || 1); q++) {
        if (it.duree > 0) { s.push({ d: it.duree }); continue; }
        const kg0 = kgOf[it.id] != null ? kgOf[it.id] : (G.estCharge(it.id, it.reps || 12, profile) || 0);
        const r = Math.max(1, it.reps - (R() < 0.15 ? 1 : 0)), set = { r, kg: kg0 };
        if (R() < 0.5) set.rir = Math.floor(R() * 4);
        s.push(set); sets++; volume += r * kg0;
      }
      if (s.length) log.push({ id: it.id, sets: s });
      const rs = s.filter(x => x.r != null);
      if (rs.length) {
        lastPerf[it.id] = { d: date, ts: t, sets: rs.map(x => Object.assign({}, x)), target: it.reps, base: it.reps, feel: 2, fails: 0 };
        if (rs.every(x => x.r >= it.reps) && kgOf[it.id] !== undefined && R() < 0.35) kgOf[it.id] = G.loadStep(it.id, kgOf[it.id], 1);
        if (kgOf[it.id] === undefined) kgOf[it.id] = rs[0].kg;
      }
    });
    const duree = Math.round(G.estDuree(se));
    hist.unshift({ id: rid(), date, ts: t, nom: tpl.n, kind: tpl.kind, ref: { k: "t", id: tpl.id }, duree, volume: Math.round(volume), kcal: G.estKcal(se, profile, duree), sets, ressenti: 1 + Math.floor(R() * 4), log, pj: j, pk: key });
  }
  return { hist, lastPerf };
}
function mesures(n, seed, kg0) {
  const R = rng(seed), out = [];
  for (let k = 0; k < n; k++) { const t = BASE - (n - k) * 7 * DAY; out.push({ id: rid(), date: iso(t), ts: t, poids: Math.round((kg0 - k * 0.1 + (R() - 0.5)) * 10) / 10, tour: k % 4 ? undefined : 84 - k * 0.1 }); }
  return out.map(m => JSON.parse(JSON.stringify(m)));
}
function state(profile, sim, extra) {
  return Object.assign({ v: 1, upd: BASE, agUpd: BASE, profile, mesSeances: [], historique: sim ? sim.hist : [], lastPerf: sim ? sim.lastPerf : {}, notes: {}, mesures: [], deload: {}, histDel: {}, histClear: 0, agenda: [], imports: [], partners: {}, hidden: {} }, extra || {});
}

const ALEX = { prenom: "Alex", sexe: "H", age: 31, taille: 178, poids: 79, niveau: "intermediaire", objectif: "muscle", objectifs: ["muscle", "force"], jours: 3, sansSaut: false, barre: 20, planJours: [1, 3, 5], planHeure: "18:30" };
const CAMILLE_ANCIEN = { prenom: "Camille", sexe: "F", age: 27, taille: 166, poids: 61, niveau: "debutant", objectif: "forme", jours: 2, sansSaut: true, barre: 15 }; /* sans « objectifs » ni paliers : format des premières versions */

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const typ = simulate(ALEX, 78, 7, 2.3); /* ≈ 6 mois à 3 séances par semaine */
  const typique = state(ALEX, typ, {
    mesures: mesures(26, 3, 80), notes: { "squat-barre": "Barre sur les trapèzes, pieds largeur d’épaules", "presse-cuisses": "Dossier cran 4" },
    mesSeances: [{ id: "fxperso1", nom: "Bras express", kind: "muscu", items: [{ id: "curl-halteres", series: 3, reps: 12, duree: 0, repos: 60, charge: 10 }, { id: "extension-corde", series: 3, reps: 12, duree: 0, repos: 60, charge: 20 }], upd: BASE - 40 * DAY }],
    deload: { last: iso(BASE - 30 * DAY) }
  });
  const gros = simulate(Object.assign({}, ALEX, { jours: 4, objectifs: ["muscle"], objectif: "muscle" }), 3000, 11, 1.2);
  gros.hist = G.trimHist(gros.hist);
  const grosState = state(Object.assign({}, ALEX, { jours: 4, objectifs: ["muscle"], objectif: "muscle" }), gros, { mesures: mesures(150, 5, 82) });

  /* séance en cours commencée il y a 2 jours, 3 séries faites */
  const p = G.programme(ALEX), tpl = G.TPL_BY_ID[p.ids[0]], se = G.prescribe(tpl, G.profFor(ALEX, p.objs[0]));
  se.kind = tpl.kind;
  const steps = G.buildSteps(se), log = se.items.map(() => []), first = se.items.findIndex(it => !it.duree && it.reps);
  let idx = 0, done = 0;
  while (idx < steps.length && done < 3) { const st = steps[idx]; if (st.k === "work" && st.i === first) { log[first].push({ s: idx, r: se.items[first].reps, kg: 60 }); done++; } idx++; }
  const start = BASE - 2 * DAY, rest = steps[idx] && steps[idx].k === "rest" ? steps[idx].d : 0;
  /* comme l'appli l'enregistre : arrêtée pendant le repos qui suit la 3e série (minuteur en cours) */
  const run = { se, steps, idx, start, log, t: rest ? { end: start + 9 * 60e3 + rest * 1000, total: rest, running: true, left: rest } : null, cur: { r: se.items[first].reps, kg: 60 }, beeped: {}, tplId: tpl.id, pj: 0, pk: progKey(p) };

  /* Passage dans la vraie appli : enregistrée telle que Fonte l'écrit */
  const { chromium } = require("playwright");
  const srv = await serve(), browser = await chromium.launch();
  async function viaApp(st) {
    const { ctx, page } = await openApp(browser, srv.url, { storage: { "fonte:v1": JSON.stringify(st), "fonte:backup": String(BASE - 5 * DAY) } });
    await page.waitForTimeout(300);
    const v = await page.evaluate(() => localStorage.getItem("fonte:v1"));
    await ctx.close();
    return v;
  }
  const typV1 = await viaApp(typique), grosV1 = await viaApp(grosState);
  const petit = state(ALEX, simulate(ALEX, 12, 21, 2.3));
  const petitV1 = await viaApp(petit);
  await browser.close(); await srv.close();

  const typObj = JSON.parse(typV1);
  const payload = { v: 1, app: "fonte", at: BASE, profile: typObj.profile, mesSeances: typObj.mesSeances, historique: typObj.historique, lastPerf: typObj.lastPerf, notes: typObj.notes, mesures: typObj.mesures, deload: typObj.deload, agenda: typObj.agenda, imports: typObj.imports };
  const b64 = s => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const info = "Données inventées (aucune donnée réelle). Fabriqué par tools/make-fixtures.js.";
  const write = (name, o) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(o, null, 1) + "\n"); };
  write("v1-vide.json", { _info: info + " Premier lancement : rien dans localStorage.", storage: {} });
  write("v1-ancien-sans-objectifs.json", { _info: info + " Profil des premières versions : « objectif » seul, pas d’« objectifs », pas de paliers, ni histDel/hidden/partners.", storage: { "fonte:v1": JSON.stringify({ v: 1, upd: BASE, profile: CAMILLE_ANCIEN, mesSeances: [], historique: simulate(Object.assign({}, CAMILLE_ANCIEN, { objectifs: ["forme"] }), 9, 31, 3.5).hist, lastPerf: {}, notes: {}, mesures: [], agenda: [] }) } });
  write("v1-usage-typique.json", { _info: info + " Environ 6 mois à 3 séances par semaine (muscle + force), mesures, notes, une séance perso, agenda.", storage: { "fonte:v1": typV1, "fonte:backup": String(BASE - 5 * DAY), "fonte:ui": JSON.stringify({ seg: "prog" }) } });
  write("v1-gros-historique.json", { _info: info + " 3 000 séances (4 par semaine) : les 300 plus récentes en détail, les autres résumées (trimHist).", storage: { "fonte:v1": grosV1, "fonte:backup": String(BASE - 5 * DAY) } });
  write("v1-json-abime.json", { _info: info + " fonte:v1 coupé au milieu (écriture interrompue) : JSON illisible.", storage: { "fonte:v1": typV1.slice(0, Math.floor(typV1.length / 2)) } });
  write("v1-sauvegarde-fontedata1.json", { _info: info + " Code de sauvegarde FONTEDATA1. (contenu du fichier/du code de Profil › Sauvegarder) de l’usage typique.", code: "FONTEDATA1." + b64(JSON.stringify(payload)) });
  write("v1-seance-en-cours.json", { _info: info + " Séance en cours commencée 2 jours avant la date de référence (plus de 12 h), 3 séries faites.", storage: { "fonte:v1": petitV1, "fonte:run": JSON.stringify(run) } });

  const kb = n => (n / 1024).toFixed(1) + " Ko";
  const bytes = s => Buffer.byteLength(s, "utf8");
  console.log("Taille de fonte:v1 (octets UTF-8 ; Safari compte en caractères UTF-16, soit ≈ 2 octets par caractère) :");
  console.log("  usage typique (" + typObj.historique.length + " séances) : " + bytes(typV1) + " octets (" + kb(bytes(typV1)) + "), " + typV1.length + " caractères");
  console.log("  gros historique (" + JSON.parse(grosV1).historique.length + " séances) : " + bytes(grosV1) + " octets (" + kb(bytes(grosV1)) + "), " + grosV1.length + " caractères");
}
main().catch(e => { console.error(e); process.exit(1); });
