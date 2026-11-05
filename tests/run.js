/* Tests des calculs de Fonte : node tests/run.js
   Charge le script « Base d'exercices » de index.html (données + fonctions pures) sans navigateur. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const data = scripts.find(s => s.indexOf("/* ===== Base d'exercices") === 0);
if (!data) throw new Error("Script « Base d'exercices » introuvable dans index.html");
const ctx = vm.createContext({ console });
/* Les const/let de haut niveau ne deviennent pas des propriétés du contexte : on les expose explicitement */
const names = ["EX", "EX_BY_ID", "TPL", "TPL_BY_ID", "LOAD", "DB_KG", "KB_KG", "OBJECTIFS", "NIV_KEYS", "HIST_FULL", "HIST_MAX", "echOn", "etirOn", "MAJOR_MUSCLES", "LEVEL_UP_PHASES", "PHASE_WEEKS", "HARDER", "PLANS", "WEEK_B", "ZONES", "EASIER", "weekVariant", "zoneList"];
vm.runInContext(data + "\n;globalThis.__x = {" + names.map(n => n + ": typeof " + n + " === 'undefined' ? undefined : " + n).join(", ") + "};", ctx);
const G = new Proxy({}, { get: (_, k) => (k in ctx.__x ? ctx.__x[k] : ctx[k]) });

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log("  ok  " + name); }
  catch (e) { fail++; console.log("  ÉCHEC  " + name + "\n        " + (e && e.message ? e.message.split("\n").join("\n        ") : e)); }
}
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= (eps || 1e-9), (msg || "") + " attendu " + b + ", obtenu " + a);

const P_H = { prenom: "", sexe: "H", age: 30, taille: 180, poids: 80, niveau: "intermediaire", objectif: "muscle", jours: 3, sansSaut: false, barre: 20 };
const P_F = Object.assign({}, P_H, { sexe: "F", taille: 165, poids: 60, niveau: "debutant" });

console.log("Données");
test("chaque exercice a un identifiant unique, un nom, des muscles et des consignes", () => {
  const seen = new Set();
  G.EX.forEach(e => {
    assert.ok(!seen.has(e.id), "doublon : " + e.id); seen.add(e.id);
    assert.ok(e.n && Array.isArray(e.p) && Array.isArray(e.m) && Array.isArray(e.d) && e.d.length, "exercice incomplet : " + e.id);
  });
});
test("les séances types ne citent que des exercices existants", () => {
  G.TPL.forEach(t => t.items.forEach(([id]) => assert.ok(G.EX_BY_ID[id], t.id + " cite " + id)));
});
test("les variantes (deb, lo) pointent vers des exercices existants", () => {
  G.EX.forEach(e => { if (e.deb) assert.ok(G.EX_BY_ID[e.deb], e.id + ".deb"); if (e.lo) assert.ok(G.EX_BY_ID[e.lo], e.id + ".lo"); });
});

console.log("Prescriptions");
test("prescribe donne des séries, répétitions ou durées positives pour toutes les séances types", () => {
  [P_H, P_F, {}].forEach(p => G.TPL.forEach(t => {
    const se = G.prescribe(t, p);
    assert.ok(se.items.length > 0, t.id + " vide");
    se.items.forEach(it => {
      assert.ok(it.series >= 1, t.id + "/" + it.id + " séries");
      assert.ok(it.reps > 0 || it.duree > 0, t.id + "/" + it.id + " ni reps ni durée");
      assert.ok(it.repos >= 0, t.id + "/" + it.id + " repos");
    });
  }));
});
test("un débutant n'a pas plus de 5 exercices en musculation", () => {
  G.TPL.filter(t => t.kind === "muscu" && t.mode !== "circuit").forEach(t => assert.ok(G.prescribe(t, P_F).items.length <= 5, t.id));
});
test("estCharge : barre au moins égale au poids de la barre, haltères du commerce", () => {
  assert.ok(G.estCharge("squat-barre", 8, P_H) >= 20);
  assert.ok(G.DB_KG.indexOf(G.estCharge("curl-halteres", 12, P_H)) >= 0);
  assert.strictEqual(G.estCharge("squat-barre", 8, {}), 0, "sans poids : pas d'estimation");
});
test("estDuree et estKcal restent dans des valeurs plausibles", () => {
  G.TPL.forEach(t => {
    const se = G.prescribe(t, P_H), d = G.estDuree(se);
    assert.ok(d > 120 && d < 3 * 3600, t.id + " : " + d + " s");
    assert.ok(G.estKcal(se, P_H, d) > 0, t.id + " kcal");
  });
});
test("programme : autant de séances que de jours demandés, toutes existantes", () => {
  for (let j = 1; j <= 6; j++) {
    const pr = G.programme(Object.assign({}, P_H, { jours: j }));
    assert.strictEqual(pr.ids.length, j); assert.strictEqual(pr.offsets.length, j);
    pr.ids.forEach(id => assert.ok(G.TPL_BY_ID[id], id));
  }
});
test("variété : jamais deux fois la même séance dans la semaine", () => {
  const objs = Object.keys(G.OBJECTIFS), combos = objs.map(k => [k]);
  objs.forEach(a => objs.forEach(b => { if (a !== b) combos.push([a, b]); }));
  combos.push(["muscle", "perte", "tonus"], ["force", "muscle", "forme"], ["perte", "tonus", "forme"]);
  combos.forEach(O => ["debutant", "intermediaire", "avance"].forEach(niv => {
    for (let j = 1; j <= 6; j++) {
      const pr = G.programme(Object.assign({}, P_H, { objectif: O[0], objectifs: O, niveau: niv, jours: j }));
      const tag = O.join("+") + " " + niv + " " + j + " j : " + pr.ids.join(", ");
      assert.strictEqual(new Set(pr.ids).size, pr.ids.length, tag);
      pr.ids.forEach(id => assert.ok(G.TPL_BY_ID[id], tag));
    }
  }));
});
test("HARDER : progressions vers des exercices existants, mêmes muscles, même type", () => {
  Object.keys(G.HARDER).forEach(k => { const a = G.EX_BY_ID[k], b = G.EX_BY_ID[G.HARDER[k]]; assert.ok(a && b, k); assert.strictEqual(a.t, b.t, k); assert.ok(a.p.some(m => b.p.indexOf(m) >= 0), k); });
});
test("variété : la variante travaille le même type de séance", () => {
  same(G.programme(Object.assign({}, P_H, { niveau: "debutant", jours: 3 })).ids, ["fb-machines", "fb-halteres", "fb-guide"]);
  same(G.programme(Object.assign({}, P_H, { jours: 4 })).ids, ["haut", "bas", "haut-b", "bas-b"]);
  same(G.programme(Object.assign({}, P_H, { jours: 6 })).ids, ["push", "pull", "legs", "push-b", "pull-b", "legs-b"]);
});
test("objList : objectif principal en premier, sans doublon, « forme » par défaut", () => {
  same(G.objList({}), ["forme"]);
  same(G.objList({ objectif: "muscle" }), ["muscle"]);
  same(G.objList({ objectif: "perte", objectifs: ["muscle", "perte", "muscle", "inconnu"] }), ["perte", "muscle"]);
});
test("programme à un seul objectif : identique à avant (une seule clé objectif)", () => {
  const a = G.programme(Object.assign({}, P_H, { objectifs: ["muscle"] })), b = G.programme(P_H);
  same(a.ids, b.ids); same(a.objs, ["muscle", "muscle", "muscle"]);
});
test("programme à plusieurs objectifs : chaque objectif a ses séances, le principal le plus", () => {
  const combos = [["muscle", "perte"], ["perte", "muscle"], ["force", "muscle"], ["perte", "tonus"], ["muscle", "perte", "tonus"], ["forme", "tonus"]];
  combos.forEach(O => ["debutant", "intermediaire", "avance"].forEach(niv => {
    for (let j = 1; j <= 6; j++) {
      const pr = G.programme(Object.assign({}, P_H, { objectif: O[0], objectifs: O, niveau: niv, jours: j }));
      const tag = O.join("+") + " " + niv + " " + j + " j";
      assert.strictEqual(pr.ids.length, j, tag); assert.strictEqual(pr.objs.length, j, tag); assert.strictEqual(pr.offsets.length, j, tag);
      pr.ids.forEach(id => assert.ok(G.TPL_BY_ID[id], tag + " : " + id));
      const cnt = k => pr.objs.filter(x => x === k).length;
      O.slice(0, j).forEach(k => assert.ok(cnt(k) >= 1, tag + " : aucune séance " + k));
      O.slice(1).forEach(k => assert.ok(cnt(O[0]) >= cnt(k), tag + " : le principal doit compter au moins autant"));
    }
  }));
});
test("programme muscle + perte : séances de muscu et de cardio alternées", () => {
  const pr = G.programme(Object.assign({}, P_H, { objectif: "muscle", objectifs: ["muscle", "perte"], jours: 4 }));
  same(pr.objs, ["muscle", "perte", "muscle", "perte"]);
  pr.ids.forEach((id, i) => assert.strictEqual(G.TPL_BY_ID[id].kind === "muscu", pr.objs[i] === "muscle", id));
});
test("planDays : jours choisis s'ils correspondent au nombre de séances, sinon séances espacées", () => {
  same(G.planDays(Object.assign({}, P_H, { jours: 3 })), [0, 2, 4]);
  same(G.planDays(Object.assign({}, P_H, { jours: 3, planJours: [5, 1, 3] })), [1, 3, 5]);
  same(G.planDays(Object.assign({}, P_H, { jours: 4, planJours: [1, 3, 5] })), [0, 1, 3, 4], "nombre différent : par défaut");
  same(G.planDays(Object.assign({}, P_H, { jours: 2, planJours: [1, 1, 9] })), [0, 3], "valeurs invalides ignorées");
  same(G.weekPlan(Object.assign({}, P_H, { jours: 3, planJours: [1, 3, 6] })), [-1, 0, -1, 1, -1, -1, 2]);
});
test("togglePlanDay : ajoute ou retire un jour, entre 1 et 6 jours", () => {
  const p = Object.assign({}, P_H, { jours: 3, planJours: [0, 2, 4] });
  same(G.togglePlanDay(p, 6), [0, 2, 4, 6]);
  same(G.togglePlanDay(p, 2), [0, 4]);
  assert.strictEqual(G.togglePlanDay(Object.assign({}, P_H, { jours: 1, planJours: [3] }), 3), null, "au moins un jour");
  assert.strictEqual(G.togglePlanDay(Object.assign({}, P_H, { jours: 6, planJours: [0, 1, 2, 3, 4, 5] }), 6), null, "un jour de repos");
});
test("planDates : séances sur les jours choisis, jours passés de la semaine ignorés", () => {
  const p = Object.assign({}, P_H, { jours: 3, planJours: [0, 2, 4] });
  /* 2026-03-04 est un mercredi */
  same(G.planDates(p, "2026-03-04", 2), [{ date: "2026-03-04", j: 1 }, { date: "2026-03-06", j: 2 }, { date: "2026-03-09", j: 0 }, { date: "2026-03-11", j: 1 }, { date: "2026-03-13", j: 2 }]);
  assert.strictEqual(G.planDates(p, "2026-03-02", 4).length, 12);
  same(G.planDates(Object.assign({}, P_H, { jours: 1, planJours: [6] }), "2026-03-01", 1), [{ date: "2026-03-01", j: 0 }], "dimanche");
});
test("fillPlan : agenda rempli sur 4 semaines, sans recréer ce qui est déjà prévu", () => {
  const p = Object.assign({}, P_H, { jours: 3, planJours: [0, 2, 4] });
  const a = G.fillPlan(p, [], "2026-03-02", 28);
  assert.strictEqual(a.length, 12); assert.strictEqual(a[0].date, "2026-03-02"); assert.ok(a[a.length - 1].date <= "2026-03-29");
  const ev = a.slice(0, 6).map(x => ({ date: x.date, fait: false, ref: { k: "t", id: "x", j: x.j } }));
  const b = G.fillPlan(p, ev, "2026-03-02", 28);
  assert.strictEqual(b.length, 6); assert.ok(b[0].date > ev[5].date, "repart après la dernière séance prévue");
  same(G.fillPlan(p, a.map(x => ({ date: x.date, ref: { k: "t", j: x.j } })), "2026-03-02", 28), [], "déjà complet");
  assert.strictEqual(G.fillPlan(p, [{ date: "2026-01-05", ref: { k: "t", j: 0 } }], "2026-03-02", 28).length, 12, "planning ancien : repart d'aujourd'hui");
});
test("nextFreeDay : premier jour sans séance prévue", () => {
  const ev = [{ id: "a", date: "2026-03-03" }, { id: "b", date: "2026-03-04", fait: true }, { id: "c", date: "2026-03-05" }];
  assert.strictEqual(G.nextFreeDay(ev, "2026-03-03"), "2026-03-04", "une séance faite ne bloque pas");
  assert.strictEqual(G.nextFreeDay(ev, "2026-03-05"), "2026-03-06");
  assert.strictEqual(G.nextFreeDay(ev, "2026-03-03", "a"), "2026-03-03", "la séance déplacée elle-même ne compte pas");
});
test("profFor : la séance est réglée sur l'objectif du jour", () => {
  const t = G.TPL_BY_ID["fb-halteres"];
  const a = G.prescribe(t, G.profFor(P_H, "force")), b = G.prescribe(t, G.profFor(P_H, "perte"));
  assert.ok(a.items[0].reps < b.items[0].reps, "force : moins de répétitions que perte de poids");
});
test("coolDown : 4 étirements maximum, jamais déjà dans la séance", () => {
  G.TPL.forEach(t => {
    const se = G.prescribe(t, P_H), cd = G.coolDown(se.items);
    assert.ok(cd.length <= 4);
    cd.forEach(it => { assert.ok(G.EX_BY_ID[it.id]); assert.ok(!se.items.some(x => x.id === it.id)); });
  });
});

console.log("Séances par objectif, semaines A/B, zone prioritaire");
test("chaque objectif a ses propres séances", () => {
  same(G.programme(Object.assign({}, P_H, { objectif: "force", jours: 4 })).ids, ["force-squat", "force-dc", "force-sdt", "force-dm"]);
  const k = o => G.programme(Object.assign({}, P_H, { objectif: o, objectifs: [o], jours: 3 })).ids;
  assert.ok(k("perte").some(id => /^metab/.test(id)), "perte : circuits brûle-graisses");
  assert.ok(k("tonus").every(id => /^tonus/.test(id)), "tonus");
  assert.ok(k("forme").indexOf("forme-doux") >= 0, "forme");
  ["muscle", "force", "perte", "tonus", "forme"].forEach(o => ["d", "s"].forEach(l => G.PLANS[o][l].forEach((ids, i) => { assert.strictEqual(ids.length, i + 1, o + l + i); ids.forEach(id => assert.ok(G.TPL_BY_ID[id], id)); })));
});
test("semaines A/B : une semaine sur deux, variantes réciproques", () => {
  assert.notStrictEqual(G.weekB("2026-03-02"), G.weekB("2026-03-09"));
  assert.strictEqual(G.weekB("2026-03-02"), G.weekB("2026-03-08"), "même semaine du lundi au dimanche");
  Object.keys(G.WEEK_B).forEach(a => { assert.ok(G.TPL_BY_ID[a] && G.TPL_BY_ID[G.WEEK_B[a]], a); assert.strictEqual(G.WEEK_B[G.WEEK_B[a]], a, a); });
  const b = G.weekB("2026-03-02") ? "2026-03-02" : "2026-03-09";
  assert.strictEqual(G.weekVariant("force-squat", b), "force-squat-b");
  assert.strictEqual(G.TPL_BY_ID["force-squat-b"].items[0][0], G.TPL_BY_ID["force-squat"].items[0][0], "même mouvement principal");
});
test("débutant : haltères aux paliers 1 et 2, barre au palier 3", () => {
  const t = G.TPL_BY_ID["force-squat"], deb = Object.assign({}, P_H, { niveau: "debutant", objectif: "force" });
  assert.strictEqual(G.prescribe(t, deb).items[0].id, "goblet-squat");
  assert.strictEqual(G.prescribe(t, Object.assign({}, deb, { phase: 3 })).items[0].id, "squat-barre");
  assert.strictEqual(G.prescribe(t, Object.assign({}, P_H, { objectif: "force" })).items[0].id, "squat-barre", "intermédiaire : barre tout de suite");
  const uniq = x => new Set(x.items.map(i => i[0])).size === x.items.length; /* cardio-fractionne : vélo au début et à la fin, voulu */
  G.TPL.filter(uniq).forEach(x => { const ids = G.prescribe(x, deb).items.map(i => i.id); assert.strictEqual(new Set(ids).size, ids.length, x.id + " doublon"); });
});
test("zone prioritaire : un exercice en plus pour la zone, sans doublon", () => {
  const t = G.TPL_BY_ID["force-squat"], a = G.prescribe(t, P_H), b = G.prescribe(t, Object.assign({}, P_H, { zones: ["bras"] }));
  assert.strictEqual(b.items.length, a.items.length + 1);
  assert.ok(G.ZONES.bras[1].indexOf(b.items[b.items.length - 1].id) >= 0);
  const c = G.prescribe(t, Object.assign({}, P_H, { zones: ["bras", "abdos", "pecs"] }));
  assert.strictEqual(c.items.length, a.items.length + 2, "2 zones au plus");
  assert.strictEqual(G.prescribe(G.TPL_BY_ID["hiit-20"], Object.assign({}, P_H, { zones: ["bras"] })).items.length, G.prescribe(G.TPL_BY_ID["hiit-20"], P_H).items.length, "pas sur les circuits");
  G.TPL.filter(x => new Set(x.items.map(i => i[0])).size === x.items.length).forEach(x => { const ids = G.prescribe(x, Object.assign({}, P_F, { zones: ["fessiers", "abdos"] })).items.map(i => i.id); assert.strictEqual(new Set(ids).size, ids.length, x.id); });
});

console.log("Paliers et niveau");
test("progressTick : un palier = 4 semaines de séances, puis palier suivant", () => {
  let p = Object.assign({}, P_F, { jours: 3, planJours: [0, 2, 4], phase: 1, phaseDone: 0 });
  for (let k = 0; k < 11; k++) { const r = G.progressTick(p); assert.ok(!r.phaseUp); p = Object.assign(p, r); }
  const r = G.progressTick(p);
  assert.ok(r.phaseUp && !r.levelUp); assert.strictEqual(r.phase, 2); assert.strictEqual(r.phaseDone, 0); assert.strictEqual(r.per, 12);
});
test("progressTick : débutant → intermédiaire automatiquement après 3 paliers, palier remis à 1", () => {
  let p = Object.assign({}, P_F, { jours: 3, planJours: [0, 2, 4] }), up = null;
  for (let k = 0; k < 36; k++) { const r = G.progressTick(p); if (r.levelUp) up = k + 1; p = Object.assign(p, r); }
  assert.strictEqual(up, 36); assert.strictEqual(p.niveau, "intermediaire"); assert.strictEqual(p.phase, 1);
  const a = Object.assign({}, P_H, { niveau: "avance", phase: 9, phaseDone: 11, jours: 3 });
  const r = G.progressTick(a); assert.strictEqual(r.niveau, "avance"); assert.strictEqual(r.phase, 10);
});
test("paliers : une série de plus au palier 2, exercices plus durs au palier 3, plus lourd au palier 4", () => {
  const t = G.TPL_BY_ID["fb-halteres"], p1 = G.prescribe(t, P_H), p2 = G.prescribe(t, Object.assign({}, P_H, { phase: 2 })), p4 = G.prescribe(t, Object.assign({}, P_H, { phase: 4 }));
  assert.strictEqual(p2.items[0].series, Math.min(5, p1.items[0].series + 1), "série en plus sur un gros exercice");
  assert.strictEqual(p2.items[p2.items.length - 1].series, p1.items[p1.items.length - 1].series, "gainage inchangé");
  assert.ok(p4.items[0].reps < p1.items[0].reps, "moins de répétitions au palier 4 (muscle)");
  const pp = G.prescribe(t, Object.assign({}, P_H, { objectif: "perte", phase: 4 })), pp1 = G.prescribe(t, Object.assign({}, P_H, { objectif: "perte" }));
  assert.ok(pp.items[0].repos < pp1.items[0].repos, "pauses plus courtes (perte)");
  const deb = Object.assign({}, P_F, { niveau: "debutant" }), pg = G.TPL_BY_ID["fb-maison"];
  /* palier 3 : la version plus dure remplace l'exercice quand elle existe (« deb ») */
  const t3 = { id: "x", n: "x", kind: "muscu", mode: "series", items: [["pompes-genoux", "C"]] };
  G.TPL_BY_ID.x = t3;
  assert.strictEqual(G.prescribe(t3, Object.assign({}, deb, { phase: 3 })).items[0].id, "pompes");
  assert.strictEqual(G.prescribe(t3, Object.assign({}, deb, { phase: 2 })).items[0].id, "pompes-genoux");
  delete G.TPL_BY_ID.x;
  assert.ok(G.prescribe(pg, Object.assign({}, deb, { phase: 4 })).items.length > 0, "circuit inchangé");
});
test("paliers : toutes les séances restent valides à tous les paliers", () => {
  [P_H, P_F].forEach(p => [1, 2, 3, 4, 7].forEach(ph => G.TPL.forEach(t => {
    const se = G.prescribe(t, Object.assign({}, p, { phase: ph }));
    se.items.forEach(it => { assert.ok(G.EX_BY_ID[it.id], t.id + " " + it.id); assert.ok(it.series >= 1 && it.series <= 12 && (it.reps > 0 || it.duree > 0) && it.repos >= 0, t.id + " " + it.id); });
  })));
});
test("cardio en plus pour la perte de poids, plafonné à 15 min", () => {
  const t = G.TPL_BY_ID["cardio-endurance"], P = Object.assign({}, P_H, { objectif: "perte" });
  const tot = se => se.items.reduce((a, it) => a + it.duree, 0);
  assert.strictEqual(tot(G.prescribe(t, Object.assign({}, P, { cardioPlus: 5 }))) - tot(G.prescribe(t, P)), 300);
  assert.strictEqual(tot(G.prescribe(t, Object.assign({}, P, { cardioPlus: 40 }))) - tot(G.prescribe(t, P)), 900);
  assert.strictEqual(tot(G.prescribe(t, Object.assign({}, P_H, { cardioPlus: 5 }))), tot(G.prescribe(t, P_H)), "objectif muscle : pas de cardio en plus");
});
test("plateau : poids stable sur 3 semaines", () => {
  assert.ok(G.plateau([{ date: "2026-03-01", poids: 80 }, { date: "2026-03-18", poids: 79.9 }], "2026-03-20"));
  assert.ok(!G.plateau([{ date: "2026-03-01", poids: 80 }, { date: "2026-03-18", poids: 79 }], "2026-03-20"), "en baisse");
  assert.ok(!G.plateau([{ date: "2026-03-10", poids: 80 }, { date: "2026-03-18", poids: 80 }], "2026-03-20"), "moins de 14 jours");
  assert.ok(!G.plateau([{ date: "2026-03-18", poids: 80 }], "2026-03-20"));
});

console.log("Progression");
test("e1rm (Epley)", () => {
  near(G.e1rm(1, 100), 100); near(G.e1rm(10, 75), 100); assert.strictEqual(G.e1rm(0, 80), 0); assert.strictEqual(G.e1rm(5, 0), 0);
});
test("loadStep : haltères et kettlebells du commerce, barre de 2,5 kg en 2,5 kg", () => {
  assert.strictEqual(G.loadStep("curl-halteres", 10, 1), 12);
  assert.strictEqual(G.loadStep("curl-halteres", 12, -1), 10);
  assert.strictEqual(G.loadStep("squat-barre", 60, 1), 62.5);
});
test("progress : toutes les séries réussies → charge suivante", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60 }, { r: 8, kg: 60 }, { r: 9, kg: 60 }], target: 8 });
  assert.strictEqual(sg.why, "up"); assert.strictEqual(sg.next, 62.5); assert.ok(sg.up);
});
test("progress : séries ratées → même charge", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60 }, { r: 6, kg: 60 }], target: 8, fails: 1 });
  assert.strictEqual(sg.why, "hold"); assert.strictEqual(sg.next, 60);
});
test("progress : 3 séances ratées d'affilée → allègement d'environ 10 %", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 5, kg: 100 }], target: 8, fails: 3 });
  assert.strictEqual(sg.why, "deload"); assert.strictEqual(sg.next, 90);
  const db = G.progress("curl-halteres", { sets: [{ r: 6, kg: 14 }], target: 10, fails: 3 });
  assert.strictEqual(db.next, 12, "haltères : poids du commerce");
});
test("progress : ressenti « très dur » → on garde la charge", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60 }], target: 8, feel: 4 });
  assert.strictEqual(sg.why, "hard"); assert.strictEqual(sg.next, 60);
});
test("progress : ressenti « facile » et reps largement dépassées → deux crans", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 12, kg: 60 }, { r: 11, kg: 60 }], target: 8, feel: 1 });
  assert.strictEqual(sg.why, "up2"); assert.strictEqual(sg.next, 65);
});
test("progress : double progression quand la marche de charge est grosse (haltères légers)", () => {
  const a = G.progress("curl-halteres", { sets: [{ r: 10, kg: 8 }, { r: 10, kg: 8 }], target: 10 });
  assert.strictEqual(a.why, "reps"); assert.strictEqual(a.reps, 12); assert.strictEqual(a.next, 8);
  const b = G.progress("curl-halteres", { sets: [{ r: 12, kg: 8 }, { r: 12, kg: 8 }], target: 12, base: 10 });
  assert.strictEqual(b.why, "up"); assert.strictEqual(b.next, 9); assert.strictEqual(b.reps, 10, "retour aux reps de départ");
});
test("progress : assistance réduite quand tout est réussi", () => {
  const sg = G.progress("tractions-assistees", { sets: [{ r: 8, kg: 30 }], target: 8 });
  assert.strictEqual(sg.next, 25);
});
test("failCount : compte les échecs à la même charge, repart à 0 en cas de réussite", () => {
  assert.strictEqual(G.failCount(null, [{ r: 5, kg: 60 }], 8), 1);
  assert.strictEqual(G.failCount({ sets: [{ r: 6, kg: 60 }], fails: 1 }, [{ r: 5, kg: 60 }], 8), 2);
  assert.strictEqual(G.failCount({ sets: [{ r: 6, kg: 60 }], fails: 2 }, [{ r: 5, kg: 55 }], 8), 1);
  assert.strictEqual(G.failCount({ sets: [{ r: 6, kg: 60 }], fails: 2 }, [{ r: 8, kg: 60 }], 8), 0);
});

console.log("Records et historique");
const H = (id, date, sets, extra) => Object.assign({ id: "h" + date, date, ts: new Date(date).getTime(), log: [{ id, sets }] }, extra || {});
test("exSeries : un point par séance, du plus ancien au plus récent", () => {
  const pts = G.exSeries([H("squat-barre", "2026-02-01", [{ r: 5, kg: 90 }]), H("squat-barre", "2026-01-01", [{ r: 8, kg: 80 }, { r: 8, kg: 82.5 }])], "squat-barre");
  assert.strictEqual(pts.length, 2); assert.strictEqual(pts[0].kg, 82.5); assert.strictEqual(pts[1].kg, 90);
});
test("exSeries : ignore les étirements de fin de séance", () => {
  const h = { id: "x", date: "2026-01-01", ts: 1, log: [{ id: "etirement-ischios", cool: 1, sets: [{ d: 30 }] }] };
  assert.strictEqual(G.exSeries([h], "etirement-ischios").length, 0);
});
test("findRecords : charge max battue", () => {
  const prev = [H("squat-barre", "2026-01-01", [{ r: 5, kg: 90 }])];
  const r = G.findRecords(prev, [{ id: "squat-barre", sets: [{ r: 3, kg: 95 }] }]);
  assert.strictEqual(r.length, 1); assert.strictEqual(r[0].k, "kg"); assert.strictEqual(r[0].v, 95); assert.strictEqual(r[0].old, 90);
});
test("findRecords : même charge, plus de reps → record de 1RM estimé", () => {
  const prev = [H("squat-barre", "2026-01-01", [{ r: 5, kg: 90 }])];
  const r = G.findRecords(prev, [{ id: "squat-barre", sets: [{ r: 7, kg: 90 }] }]);
  assert.strictEqual(r.length, 1); assert.strictEqual(r[0].k, "rm");
});
test("findRecords : pas de record la première fois, ni quand on fait moins bien", () => {
  assert.strictEqual(G.findRecords([], [{ id: "squat-barre", sets: [{ r: 5, kg: 90 }] }]).length, 0);
  const prev = [H("squat-barre", "2026-01-01", [{ r: 5, kg: 90 }])];
  assert.strictEqual(G.findRecords(prev, [{ id: "squat-barre", sets: [{ r: 5, kg: 85 }] }]).length, 0);
});
test("findRecords : poids du corps (répétitions) et gainage (durée)", () => {
  const r1 = G.findRecords([H("pompes", "2026-01-01", [{ r: 20, kg: 0 }])], [{ id: "pompes", sets: [{ r: 22, kg: 0 }] }]);
  assert.strictEqual(r1.length, 1); assert.strictEqual(r1[0].k, "reps");
  const r2 = G.findRecords([H("planche", "2026-01-01", [{ d: 45 }])], [{ id: "planche", sets: [{ d: 60 }] }]);
  assert.strictEqual(r2.length, 1); assert.strictEqual(r2[0].k, "d");
});
test("trimHist : les séances anciennes sont résumées mais gardent leurs meilleures séries", () => {
  const list = [];
  for (let i = 0; i < 320; i++) list.push(H("squat-barre", "2026-01-01", [{ r: 8, kg: 60 }, { r: 5, kg: 70 }, { r: 10, kg: 50 }], { id: "h" + i, ts: 1000 - i }));
  const t = G.trimHist(list);
  assert.strictEqual(t.length, 320);
  assert.ok(!t[0].c && t[319].c, "les plus récentes restent complètes");
  const old = t[319].log[0];
  assert.strictEqual(old.n, 3, "nombre de séries conservé");
  assert.ok(old.sets.some(s => s.kg === 70), "charge max conservée");
  assert.strictEqual(G.exSeries([t[319]], "squat-barre")[0].rm, G.exSeries([list[319]], "squat-barre")[0].rm, "1RM identique");
  assert.ok(JSON.stringify(t).length < JSON.stringify(list).length);
});

console.log("Superséries");
const seSS = () => ({ mode: "series", items: [
  { id: "dc-barre", series: 3, reps: 8, repos: 90, ss: 1 },
  { id: "rowing-barre", series: 3, reps: 8, repos: 90 },
  { id: "curl-halteres", series: 2, reps: 12, repos: 60 }] });
test("buildSteps : un superset alterne les deux exercices sans repos entre eux", () => {
  const steps = G.buildSteps(seSS()), w = steps.map(s => s.k === "work" ? "W" + s.i + "." + s.set : "R" + s.d);
  same(w.slice(0, 6), ["W0.1", "W1.1", "R90", "W0.2", "W1.2", "R90"]);
  assert.ok(steps.some(s => s.k === "work" && s.i === 2), "l'exercice suivant est bien là");
});
test("buildSteps : sans superset, toutes les séries d'un exercice à la suite", () => {
  const se = seSS(); se.items[0].ss = 0;
  const w = G.buildSteps(se).filter(s => s.k === "work").map(s => s.i);
  same(w.slice(0, 4), [0, 0, 0, 1]);
});
test("buildSteps : le superset est ignoré en circuit", () => {
  const se = seSS(); se.mode = "circuit"; se.tours = 2;
  const w = G.buildSteps(se).filter(s => s.k === "work");
  assert.strictEqual(w.length, 6); assert.ok(w.every(s => s.g == null));
});
test("estDuree : un superset est plus court que les mêmes exercices à la suite", () => {
  const a = seSS(), b = seSS(); b.items[0].ss = 0;
  assert.ok(G.estDuree(a) < G.estDuree(b));
});

console.log("Réserve, remplacement, semaine");
test("progress : séries réussies sans aucune réserve → on garde la charge", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60, rir: 0 }, { r: 8, kg: 60, rir: 0 }], target: 8 });
  assert.strictEqual(sg.why, "limit"); assert.strictEqual(sg.next, 60);
});
test("progress : 3 répétitions ou plus en réserve → deux crans", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60, rir: 3 }, { r: 8, kg: 60, rir: 3 }], target: 8 });
  assert.strictEqual(sg.why, "up2"); assert.strictEqual(sg.next, 65);
});
test("progress : une réserve normale ne change rien", () => {
  const sg = G.progress("squat-barre", { sets: [{ r: 8, kg: 60, rir: 2 }, { r: 8, kg: 60, rir: 1 }], target: 8 });
  assert.strictEqual(sg.why, "up"); assert.strictEqual(sg.next, 62.5);
});
test("altsFor : mêmes muscles principaux, même façon de compter, exclusions respectées", () => {
  ["presse-cuisses", "dc-barre", "tirage-vertical", "curl-halteres", "planche"].forEach(id => {
    const e = G.EX_BY_ID[id]; if (!e) return;
    const alts = G.altsFor(id, { exclude: [] });
    assert.ok(alts.length >= 1, id + " sans remplaçant");
    alts.forEach(a => { const x = G.EX_BY_ID[a]; assert.ok(x.p.some(m => e.p.indexOf(m) >= 0), id + " → " + a); assert.strictEqual(x.t, e.t, id + " → " + a); assert.notStrictEqual(a, id); });
  });
  const first = G.altsFor("dc-barre")[0];
  assert.ok(G.altsFor("dc-barre", { exclude: [first] }).indexOf(first) < 0);
});
test("altsFor : sans saut quand le profil l'exige", () => {
  G.EX.filter(e => e.imp).slice(0, 5).forEach(e => G.altsFor(e.id, { low: true }).forEach(a => assert.ok(!G.EX_BY_ID[a].imp, e.id + " → " + a)));
});
test("isoMon / isoAdd", () => {
  assert.strictEqual(G.isoMon("2026-11-05"), "2026-11-02"); assert.strictEqual(G.isoMon("2026-11-02"), "2026-11-02"); assert.strictEqual(G.isoMon("2026-11-08"), "2026-11-02");
  assert.strictEqual(G.isoAdd("2026-12-31", 1), "2027-01-01");
});
test("muscleSets : 1 série par muscle principal, ½ par secondaire, étirements exclus", () => {
  const e = G.EX_BY_ID["dc-barre"];
  const s = G.muscleSets([{ date: "2026-11-03", log: [{ id: "dc-barre", sets: [{ r: 8 }, { r: 8 }, { r: 8 }] }, { id: "etirement-pectoraux", cool: 1, sets: [{ d: 30 }] }] }], "2026-11-01", "2026-11-07");
  e.p.forEach(m => assert.strictEqual(s[m], 3, m));
  e.s.filter(m => e.p.indexOf(m) < 0).forEach(m => assert.strictEqual(s[m], 1.5, m));
  assert.strictEqual(Object.keys(G.muscleSets([{ date: "2026-10-01", log: [{ id: "dc-barre", sets: [{ r: 8 }] }] }], "2026-11-01", "2026-11-07")).length, 0, "hors période");
});
const W = dates => dates.map((d, i) => ({ id: "w" + i, date: d, ts: i }));
test("weekCounts et weekStreak", () => {
  const hist = W(["2026-11-03", "2026-11-04", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-20", "2026-10-21", "2026-10-13"]);
  const w = G.weekCounts(hist, "2026-11-05", 4);
  same(w.map(x => x.n), [1, 2, 3, 2]); assert.strictEqual(w[3].mon, "2026-11-02");
  assert.strictEqual(G.weekStreak(hist, "2026-11-05", 2), 3, "semaine en cours comptée car objectif atteint");
  assert.strictEqual(G.weekStreak(hist, "2026-11-05", 3), 1, "seule la semaine du 27/10 atteint 3");
  assert.strictEqual(G.weekStreak([], "2026-11-05", 2), 0);
});
test("deloadDue : après N semaines actives d'affilée, remis à zéro par une semaine allégée", () => {
  const dates = []; for (let k = 1; k <= 7; k++) dates.push(G.isoAdd("2026-11-02", -7 * k + 1));
  const hist = W(dates);
  assert.ok(G.deloadDue(hist, "2026-11-05", null, 6).due);
  assert.strictEqual(G.deloadDue(hist, "2026-11-05", null, 6).weeks, 7);
  assert.ok(!G.deloadDue(hist, "2026-11-05", "2026-10-12", 6).due, "semaine allégée récente");
  assert.ok(!G.deloadDue(W(["2026-10-27"]), "2026-11-05", null, 6).due);
});
test("deloadSe : moins de séries, charges à 85 % arrondies, assistance augmentée", () => {
  const se = G.deloadSe({ mode: "series", items: [{ id: "squat-barre", series: 4, reps: 8, charge: 100, echec: 1 }, { id: "curl-halteres", series: 3, reps: 10, charge: 14 }, { id: "tractions-assistees", series: 3, reps: 8, charge: 20 }] });
  assert.strictEqual(se.items[0].series, 2); assert.strictEqual(se.items[0].charge, 85); assert.strictEqual(se.items[0].echec, 0);
  assert.strictEqual(se.items[1].series, 2); assert.strictEqual(se.items[1].charge, 10, "haltère du commerce ≤ 11,9 kg");
  assert.strictEqual(se.items[2].charge, 25);
});

console.log("Échauffement");
test("warmUp : cardio doux puis 2 à 3 mouvements de mobilité ciblés, tous chronométrés", () => {
  const push = G.prescribe(G.TPL_BY_ID["push"], P_H).items, legs = G.prescribe(G.TPL_BY_ID["legs"], P_H).items;
  const wp = G.warmUp(push, false), wl = G.warmUp(legs, false);
  [wp, wl].forEach(w => {
    assert.ok(w.length >= 3 && w.length <= 4, "taille " + w.length);
    assert.strictEqual(G.EX_BY_ID[w[0].id].g, "cardio", "commence par du cardio");
    w.forEach(it => { assert.ok(it.warm && it.duree > 0 && G.EX_BY_ID[it.id], it.id); });
  });
  assert.ok(wp.some(it => ["cercles-bras", "dislocations-epaules"].indexOf(it.id) >= 0), "push : épaules");
  assert.ok(wl.some(it => ["squat-pdc", "world-greatest"].indexOf(it.id) >= 0), "legs : hanches et jambes");
  assert.strictEqual(wl[0].id, "velo"); assert.strictEqual(wp[0].id, "rameur");
});
test("warmUp : à la maison, jumping jacks (sans saut si le profil l'exige)", () => {
  const maison = G.prescribe(G.TPL_BY_ID["fb-maison"], P_H).items;
  assert.strictEqual(G.warmUp(maison, false)[0].id, "jumping-jacks");
  assert.strictEqual(G.warmUp(maison, true)[0].id, "step-jack");
});
test("echOn : échauffement pour la muscu et le HIIT, pas pour le cardio ni la mobilité, désactivable", () => {
  assert.ok(G.echOn({ kind: "muscu" })); assert.ok(G.echOn({ kind: "hiit" }));
  assert.ok(!G.echOn({ kind: "cardio" })); assert.ok(!G.echOn({ kind: "mob" }));
  assert.ok(!G.echOn({ kind: "muscu", echauf: false }));
});
test("buildSteps : l'échauffement passe en premier, puis 20 s de transition", () => {
  const items = [{ id: "dc-barre", series: 2, reps: 8, repos: 90 }];
  const se = { mode: "series", items: G.warmUp(items, false).concat(items) };
  const st = G.buildSteps(se), firstMain = st.findIndex(s => s.k === "work" && !s.warm);
  assert.ok(st.slice(0, firstMain).filter(s => s.k === "work").every(s => s.warm));
  assert.ok(st[firstMain - 1].k === "rest" && st[firstMain - 1].fromWarm && st[firstMain - 1].d === 20);
});
test("estDuree compte l'échauffement, et les étirements aussi pour un circuit", () => {
  const se = G.prescribe(G.TPL_BY_ID["push"], P_H), off = Object.assign({}, se, { echauf: false });
  assert.ok(G.estDuree(se) > G.estDuree(off));
  const c = G.prescribe(G.TPL_BY_ID["fb-maison"], P_H), c0 = Object.assign({}, c, { etir: false });
  assert.ok(G.estDuree(c) > G.estDuree(c0), "circuit : étirements comptés");
});
test("l'échauffement n'entre ni dans les courbes, ni dans les records, ni dans les muscles travaillés", () => {
  const prev = [{ id: "a", date: "2026-01-01", ts: 1, log: [{ id: "squat-pdc", sets: [{ r: 10, kg: 0 }] }] }];
  assert.strictEqual(G.findRecords(prev, [{ id: "squat-pdc", warm: 1, sets: [{ r: 30, kg: 0 }] }]).length, 0);
  assert.strictEqual(G.exSeries([{ id: "b", date: "2026-01-02", ts: 2, log: [{ id: "squat-pdc", warm: 1, sets: [{ d: 30 }] }] }], "squat-pdc").length, 0);
  assert.strictEqual(Object.keys(G.muscleSets([{ date: "2026-01-02", log: [{ id: "squat-pdc", warm: 1, sets: [{ d: 30 }] }] }], "2026-01-01", "2026-01-07")).length, 0);
});

console.log("Exports");
test("csvExport : une ligne par série, point-virgule et virgule décimale", () => {
  const csv = G.csvExport([{ id: "a", date: "2026-03-01", ts: 1, nom: "Push; lourd", duree: 3600, volume: 1234.5, ressenti: 3, log: [{ id: "dc-barre", sets: [{ r: 8, kg: 62.5 }, { r: 7, kg: 62.5 }] }] }]);
  const lines = csv.trim().split("\r\n");
  assert.strictEqual(lines.length, 3);
  assert.ok(lines[1].indexOf('"Push; lourd"') >= 0, "champ avec ; entre guillemets");
  assert.ok(lines[1].indexOf(";62,5;") >= 0, "virgule décimale");
  assert.ok(lines[1].indexOf("Dur") >= 0, "ressenti");
});
test("icsExport : événements avec heure, rappel et texte échappé", () => {
  const ics = G.icsExport([{ id: "e1", date: "2026-03-02", heure: "18:30", titre: "Push, jambes", note: "salle" }, { id: "e2", date: "2026-03-03", heure: "", titre: "Course" }], { alarm: 30, now: new Date(Date.UTC(2026, 0, 1)) });
  assert.ok(ics.indexOf("BEGIN:VCALENDAR") === 0 && ics.trim().endsWith("END:VCALENDAR"));
  assert.ok(ics.indexOf("DTSTART:20260302T183000") >= 0);
  assert.ok(ics.indexOf("DTEND:20260302T193000") >= 0);
  assert.ok(ics.indexOf("SUMMARY:Push\\, jambes") >= 0);
  assert.ok(ics.indexOf("TRIGGER:-PT30M") >= 0);
  assert.ok(ics.indexOf("DTSTART;VALUE=DATE:20260303") >= 0);
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  ics.split("\r\n").forEach(l => assert.ok(l.length <= 75, "ligne trop longue"));
});
test("icsExport : sans rappel", () => {
  assert.ok(G.icsExport([{ id: "e", date: "2026-03-02", heure: "08:00", titre: "x" }], { alarm: -1 }).indexOf("VALARM") < 0);
});

console.log("\n" + pass + " réussis, " + fail + " en échec");
process.exit(fail ? 1 : 0);
