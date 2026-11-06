/* Tests des calculs de Fonte : node tests/run.js
   Charge les moteurs de calcul (js/engine-*.js : données + fonctions pures) sans navigateur. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

/* Moteurs chargés depuis js/engine-*.js (phase 3A) : voir tests/charger.js */
const G = require("./charger").charger();

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

console.log("Postes (banc, poulie)");
const mk = ids => ids.map(id => ({ id }));
test("groupStations : les exercices à la poulie s’enchaînent", () => {
  const it = mk(["tirage-vertical", "curl-halteres", "extension-corde"]), r = ["C", "I", "I"];
  assert.ok(G.groupStations(it, r));
  same(it.map(x => x.id), ["tirage-vertical", "extension-corde", "curl-halteres"]);
});
test("groupStations : une isolation ne passe pas devant un gros mouvement qu’elle fatigue", () => {
  const it = mk(["tirage-vertical", "rowing-barre", "curl-poulie"]);
  assert.ok(!G.groupStations(it, ["C", "C", "I"]));
});
test("groupStations : une isolation passe devant un gros mouvement d’autres muscles", () => {
  const it = mk(["dc-barre", "rowing-barre", "di-halteres"]);
  G.groupStations(it, ["C", "C", "I"]);
  same(it.map(x => x.id), ["dc-barre", "di-halteres", "rowing-barre"]);
});
test("groupStations : rien ne traverse le cardio ni les étirements", () => {
  const it = mk(["dc-halteres", "velo", "rowing-haltere"]);
  assert.ok(!G.groupStations(it, ["C", "K", "C"]));
});
test("prescribe : Haut du corps n’a plus de banc ni de poulie séparés", () => {
  const se = G.prescribe(G.TPL_BY_ID["haut"], P_H);
  const st = se.items.map(x => G.stationOf(x.id));
  st.forEach((s, i) => { if (s && st.indexOf(s) < i) assert.strictEqual(st[i - 1], s, "poste " + s + " séparé : " + se.items.map(x => x.id)); });
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

console.log("Garde-fou de charge (S1-a)");
const sets5 = (n, r, kg) => Array.from({ length: n }, () => ({ r, kg }));
test("convertLoad : cas de l'audit, 5 × 5 à 100 kg au squat puis 10 répétitions → 82,5 kg (et non 102,5)", () => {
  const lp = { sets: sets5(5, 5, 100), target: 5, base: 5 };
  assert.strictEqual(G.convertLoad("squat-barre", lp, 10, 20), 82.5);
  assert.strictEqual(G.progress("squat-barre", lp).next, 102.5, "sans garde-fou : 102,5 kg");
});
test("convertLoad : moins de répétitions → charge plus lourde mais prudente (10 × 70 kg → 75 kg pour 5)", () => {
  assert.strictEqual(G.convertLoad("squat-barre", { sets: sets5(3, 10, 70), target: 10 }, 5, 20), 75);
});
test("convertLoad : écart de moins de 3 répétitions, assistance, poids du corps, durée → pas de conversion", () => {
  assert.strictEqual(G.convertLoad("squat-barre", { sets: sets5(3, 8, 80), target: 8 }, 10, 20), null);
  assert.strictEqual(G.convertLoad("tractions-assistees", { sets: sets5(3, 5, 30), target: 5 }, 12, 20), null);
  assert.strictEqual(G.convertLoad("pompes", { sets: sets5(3, 5, 0), target: 5 }, 15, 20), null);
  assert.strictEqual(G.convertLoad("squat-barre", { sets: sets5(3, 5, 100), target: 5 }, 0, 20), null);
  assert.strictEqual(G.convertLoad("squat-barre", null, 10, 20), null);
});
test("convertLoad : arrondi vers le bas au matériel (haltères du commerce, machines de 5 en 5, barre minimum)", () => {
  const d = G.convertLoad("dc-halteres", { sets: sets5(3, 5, 30), target: 5 }, 12, 20);
  assert.ok(G.DB_KG.indexOf(d) >= 0 && d <= 30 * (1 + 5 / 30) / (1 + 12 / 30) * 0.95, "haltère : " + d);
  assert.strictEqual(G.convertLoad("presse-cuisses", { sets: sets5(3, 6, 150), target: 6 }, 12, 20) % 5, 0);
  assert.strictEqual(G.convertLoad("squat-barre", { sets: sets5(3, 5, 20), target: 5 }, 15, 20), 20, "jamais sous la barre à vide");
});
test("convertLoad : prend la série la plus lourde, au plus petit nombre de répétitions réussies", () => {
  const lp = { sets: [{ r: 5, kg: 100 }, { r: 3, kg: 100 }, { r: 8, kg: 90 }], target: 5 };
  assert.strictEqual(G.convertLoad("squat-barre", lp, 10, 20), Math.floor(100 * 1.1 / (1 + 10 / 30) * 0.95 / 2.5) * 2.5);
});
test("convertLoad : tous les profils à 2 objectifs (niveaux, 1 à 6 jours, paliers 1 à 4, semaines A et B) → jamais au-dessus de la charge convertie + 1 cran", () => {
  const objs = Object.keys(G.OBJECTIFS), weeks = ["2026-11-02", "2026-11-09"];
  let combos = 0, pairs = 0;
  objs.forEach(a => objs.forEach(b => { if (a === b) return;
    ["debutant", "intermediaire", "avance"].forEach(niv => { for (let j = 1; j <= 6; j++) for (let ph = 1; ph <= 4; ph++) {
      const p = Object.assign({}, P_H, { objectif: a, objectifs: [a, b], niveau: niv, jours: j, phase: ph, phaseDone: 0 });
      const reps = {};
      weeks.forEach(w => { const pr = G.programme(p); pr.ids.forEach((id, k) => {
        const se = G.prescribe(G.TPL_BY_ID[G.weekVariant(id, w)], G.profFor(p, pr.objs[k]));
        se.items.forEach(it => { if (it.reps > 0 && !it.duree && G.LOAD[it.id] && !G.isAssist(it.id)) (reps[it.id] = reps[it.id] || new Set()).add(it.reps); });
      }); });
      let hit = false;
      Object.keys(reps).forEach(id => { const rs = [...reps[id]];
        rs.forEach(r1 => rs.forEach(r2 => { if (Math.abs(r1 - r2) < 3) return;
          const kg = G.estCharge(id, r1, p); if (!kg) return;
          const lp = { sets: sets5(3, r1, kg), target: r1, base: r1 }, cv = G.convertLoad(id, lp, r2, p.barre);
          const ideal = kg * (1 + Math.min(r1, 15) / 30) / (1 + Math.min(r2, 15) / 30);
          const tag = a + "+" + b + " " + niv + " " + j + " j palier " + ph + " " + id + " " + r1 + "→" + r2 + " reps à " + kg + " kg : " + cv;
          assert.ok(cv != null, tag);
          assert.ok(cv <= Math.max(G.loadStep(id, ideal, 1), G.floorLoad(id, 0, p.barre)) + 1e-9, tag + " au-dessus de la charge convertie + 1 cran");
          if (r2 > r1) assert.ok(cv <= G.progress(id, lp).next + 1e-9, tag + " plus lourd que sans garde-fou");
          pairs++; hit = true;
        }));
      });
      if (hit) combos++;
    } });
  }));
  assert.ok(combos > 0 && pairs > 0);
  console.log("        (" + combos + " combinaisons de profils et " + pairs + " cas de conversion vérifiés)");
});

console.log("Rappel de sauvegarde (D1-a)");
test("backupDueAt : jamais sauvegardé → dès 3 séances", () => {
  const now = Date.UTC(2026, 10, 6), h = n => Array.from({ length: n }, (_, i) => ({ id: "h" + i, ts: now - (i + 1) * 864e5 }));
  assert.strictEqual(G.backupDueAt(h(2), 0, 0, now), null);
  assert.ok(G.backupDueAt(h(3), 0, 0, now));
});
test("backupDueAt : 10 séances ou 14 jours depuis la dernière sauvegarde, report de 7 jours respecté", () => {
  const now = Date.UTC(2026, 10, 6), D = 864e5, h = (n, from) => Array.from({ length: n }, (_, i) => ({ id: "h" + i, ts: from + (i + 1) * 3600e3 }));
  assert.strictEqual(G.backupDueAt(h(9, now - 3 * D), now - 3 * D, 0, now), null, "9 séances en 3 jours");
  assert.strictEqual(G.backupDueAt(h(10, now - 3 * D), now - 3 * D, 0, now).n, 10, "10 séances");
  assert.strictEqual(G.backupDueAt(h(1, now - 14 * D), now - 14 * D, 0, now).days, 14, "14 jours et 1 séance");
  assert.strictEqual(G.backupDueAt(h(1, now - 13 * D), now - 13 * D, 0, now), null, "13 jours");
  assert.strictEqual(G.backupDueAt([], now - 40 * D, 0, now), null, "rien de nouveau depuis la sauvegarde");
  assert.strictEqual(G.backupDueAt(h(12, now - 20 * D), now - 20 * D, now + 7 * D, now), null, "reporté");
  assert.ok(G.backupDueAt(h(12, now - 20 * D), now - 20 * D, now - 1, now), "report terminé");
  assert.strictEqual(G.BK_SNOOZE_DAYS, 7);
});

console.log("Photographie des programmes");
test("programmes identiques à la photographie (objectifs × niveau × jours × palier × semaine A/B)", () => {
  const ref = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "programmes.json"), "utf8"));
  const cur = require("./photo-programmes").photo(G);
  const keys = Object.keys(ref.programmes);
  assert.strictEqual(Object.keys(cur.programmes).length, keys.length, "nombre de combinaisons");
  keys.forEach(k => {
    const a = ref.programmes[k], b = cur.programmes[k];
    assert.ok(b, "combinaison absente : " + k);
    same(b.ids, a.ids, k + " : séances"); same(b.objs, a.objs, k + " : objectifs"); same(b.offsets, a.offsets, k + " : jours");
    a.seances.forEach((i, n) => assert.strictEqual(cur.seances[b.seances[n]], ref.seances[i], k + " : séance " + a.ids[n] + " modifiée"));
  });
  console.log("        (" + keys.length + " programmes, " + ref.seances.length + " séances différentes)");
});

console.log("Format des données v2 et migration v1 → v2 (D8, 3B)");
/* localStorage simulé : un moteur chargé par jeu de données. limit = taille maximale (caractères des clés + valeurs) : simule la mémoire pleine. */
function fakeStorage(init, opts) {
  opts = opts || {};
  const m = new Map(Object.entries(init || {}));
  const size = () => { let n = 0; m.forEach((v, k) => { n += k.length + v.length; }); return n; };
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      v = String(v);
      if (opts.limit != null) { const old = m.has(k) ? k.length + m.get(k).length : 0; if (size() - old + k.length + v.length > opts.limit) { const e = new Error("plein"); e.name = "QuotaExceededError"; throw e; } }
      if (opts.refuse && opts.refuse(k, v)) { const e = new Error("plein"); e.name = "QuotaExceededError"; throw e; }
      m.set(k, opts.alter ? opts.alter(k, v) : v);
    },
    removeItem: k => { m.delete(k); }, _m: m, _size: size
  };
}
const fixture = n => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", n), "utf8"));
const NOW = 1794000000000;
function boot(storage, opts) { const ls = storage && storage._m ? storage : fakeStorage(storage, opts), U = require("./charger").charger({ localStorage: ls }); return { U, ls, st: U.storeOpen(ls, NOW) }; }
const V1_FIX = ["v1-ancien-sans-objectifs.json", "v1-usage-typique.json", "v1-gros-historique.json", "v1-seance-en-cours.json"];
const jsonOf = o => JSON.parse(JSON.stringify(o));
/* Comparaison champ à champ d’un état migré avec sa source v1 : aucune séance, mesure, note, référence perdue */
function checkMigrated(st, raw, f) {
  assert.strictEqual(st.v, 2, f + " : v");
  assert.strictEqual(st.historique.length, raw.historique.length, f + " : nombre de séances");
  st.historique.forEach((h, i) => {
    const src = raw.historique[i], c = Object.assign({}, h); delete c.upd;
    same(c, src, f + " : séance " + i + " identique");
    assert.strictEqual(h.upd, src.ts || 0, f + " : upd de la séance " + i);
  });
  ["mesures", "mesSeances", "agenda", "imports"].forEach(k => same(st[k], raw[k] || [], f + " : " + k));
  ["notes", "deload", "lastPerf"].forEach(k => same(st[k], raw[k] || {}, f + " : " + k));
  same(st.legacyRefs, raw.lastPerf || {}, f + " : legacyRefs = copie intacte de lastPerf");
  Object.keys(raw.lastPerf || {}).forEach(id => {
    const lp = raw.lastPerf[id], z = st.refs[id];
    assert.ok(z, f + " : refs." + id);
    const zone = Object.keys(z); assert.strictEqual(zone.length, 1, f + " : une zone pour " + id);
    same(z[zone[0]], lp, f + " : refs." + id + " = lastPerf");
    const reps = lp.target || Math.max.apply(null, lp.sets.map(s => s.r || 0));
    assert.strictEqual(zone[0], reps <= 6 ? "force" : reps <= 12 ? "muscle" : "endurance", f + " : zone de " + id);
    const sid = st.legacySrc[id];
    if (sid) { const h = st.historique.find(x => x.id === sid); assert.ok(h && h.log.some(l => l.id === id), f + " : séance d’origine de " + id); if (lp.ts) assert.strictEqual(h.ts, lp.ts); }
  });
  Object.keys(raw.profile).forEach(k => same(st.profile[k], raw.profile[k], f + " : profil." + k));
}
test("SCHEMA_VERSION = 2 ; migrate v1 → v2 ajoute refs, legacyRefs, legacySrc, upd sans rien retirer ni modifier l'objet reçu", () => {
  assert.strictEqual(G.SCHEMA_VERSION, 2);
  const lp = { d: "2026-01-01", ts: 5, sets: [{ r: 5, kg: 100 }], target: 5, base: 5, feel: 2, fails: 0 };
  const o = { v: 1, profile: { prenom: "Zoé" }, historique: [{ id: "a", date: "2026-01-01", ts: 5, log: [{ id: "squat-barre", sets: [{ r: 5, kg: 100 }] }] }], lastPerf: { "squat-barre": lp } }, copy = JSON.stringify(o);
  const m = G.migrate(o);
  assert.strictEqual(m.from, 1); assert.strictEqual(m.error, undefined); assert.strictEqual(JSON.stringify(o), copy, "objet reçu intact");
  assert.strictEqual(m.data.v, 2); assert.strictEqual(m.data.historique[0].upd, 5);
  same(m.data.legacyRefs, o.lastPerf); same(m.data.refs, { "squat-barre": { force: lp } }); same(m.data.legacySrc, { "squat-barre": "a" });
  assert.strictEqual(G.migrate({ profile: {} }).from, 1, "sans v : premières versions = v1");
  const v2 = { v: 2, profile: {}, historique: [] }; assert.strictEqual(G.migrate(v2).data, v2, "v2 : rien à transformer");
  assert.strictEqual(G.migrate(null).error, "illisible"); assert.strictEqual(G.migrate([1, 2]).error, "illisible");
  same(G.REF_ZONES, ["force", "muscle", "endurance"]);
  assert.strictEqual(G.zoneOf(6), "force"); assert.strictEqual(G.zoneOf(7), "muscle"); assert.strictEqual(G.zoneOf(12), "muscle"); assert.strictEqual(G.zoneOf(13), "endurance");
});
test("migrate : un format plus récent que l'appli (v3) est refusé", () => {
  const m = G.migrate({ v: 3, profiles: [] });
  assert.strictEqual(m.error, "plus-recent"); assert.strictEqual(m.data, null); assert.strictEqual(m.from, 3);
});
test("migration au démarrage, chaque jeu de données v1 : profil 1 créé, comparaison champ à champ, fonte:v1 conservé tel quel", () => {
  V1_FIX.forEach(f => {
    const storage = fixture(f).storage, raw = JSON.parse(storage["fonte:v1"]), { st, U, ls } = boot(storage);
    assert.strictEqual(U.STORE_BLOCK, null, f); assert.strictEqual(U.STORE.mode, "v2", f); assert.strictEqual(U.STORE.note, "migre", f);
    const P = JSON.parse(ls.getItem("fonte:profiles"));
    assert.strictEqual(P.v, 2); assert.strictEqual(P.list.length, 1); assert.strictEqual(P.active, P.list[0].id); assert.strictEqual(P.owner, P.active);
    assert.strictEqual(P.list[0].prenom, raw.profile.prenom || ""); assert.strictEqual(P.mig.pid, P.active); assert.strictEqual(P.mig.sig, U.sigOf(storage["fonte:v1"]));
    assert.ok(/^p[a-z0-9]+$/.test(P.active), "identifiant de profil");
    assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"], f + " : fonte:v1 jamais modifié");
    checkMigrated(st, raw, f);
    checkMigrated(JSON.parse(ls.getItem("fonte:p:" + P.active)), raw, f + " (relu)");
    ["run", "backup"].forEach(s => { if (storage["fonte:" + s] != null) assert.strictEqual(ls.getItem("fonte:p:" + P.active + ":" + s), storage["fonte:" + s], f + " : " + s + " copié dans le profil"); });
    assert.strictEqual(ls.getItem("fonte:ui"), storage["fonte:ui"] == null ? null : storage["fonte:ui"], "réglages d'appareil inchangés");
  });
});
test("migration : double lancement (idempotence), rien n'est réécrit ni dupliqué", () => {
  V1_FIX.forEach(f => {
    const storage = fixture(f).storage, a = boot(storage), key = "fonte:p:" + a.U.STORE.pid, snap = new Map(a.ls._m);
    const b = boot(a.ls);
    assert.strictEqual(b.U.STORE.pid, a.U.STORE.pid, f); assert.strictEqual(b.U.STORE.note, null, f + " : pas de nouvelle migration");
    same(b.st, a.st, f + " : même état");
    assert.strictEqual(b.ls._m.size, snap.size, f + " : aucune clé ajoutée");
    snap.forEach((v, k) => assert.strictEqual(b.ls.getItem(k), v, f + " : " + k + " inchangé"));
    assert.strictEqual(JSON.parse(b.ls.getItem("fonte:profiles")).list.length, 1);
    assert.ok(b.ls.getItem(key));
  });
});
test("migration : copie de sécurité D5 (fonte:undo) déplacée dans le profil, toujours utilisable", () => {
  const s = fixture("v1-seance-en-cours.json").storage, undo = fixture("v1-ancien-sans-objectifs.json").storage["fonte:v1"];
  const { U, ls } = boot(Object.assign({}, s, { "fonte:undo": undo, "fonte:undo-info": JSON.stringify({ at: 1, reason: "restore" }) }));
  assert.strictEqual(ls.getItem(U.pKey(U.STORE.pid, "undo")), undo); assert.strictEqual(ls.getItem("fonte:undo"), null, "pas doublée");
  assert.ok(U.readState(undo).state.historique.length > 0, "la copie v1 se relit via migrate");
});
test("premier lancement (vide) : un profil vide, fonte:v1 jamais créé", () => {
  const { st, U, ls } = boot(fixture("v1-vide.json").storage);
  assert.strictEqual(U.STORE_BLOCK, null); assert.strictEqual(U.STORE.mode, "v2"); assert.strictEqual(st.historique.length, 0);
  assert.strictEqual(ls.getItem("fonte:v1"), null);
  const P = JSON.parse(ls.getItem("fonte:profiles")); assert.strictEqual(P.list.length, 1); assert.strictEqual(P.mig, undefined);
});
test("JSON abîmé : copie brute dans fonte:v1-illisible, fonte:v1 jamais écrasé, nouveau profil vide", () => {
  const storage = fixture("v1-json-abime.json").storage, { st, U, ls } = boot(storage);
  assert.strictEqual(U.STORE_BLOCK.reason, "illisible");
  assert.strictEqual(ls.getItem("fonte:v1-illisible"), storage["fonte:v1"]);
  assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"]);
  assert.strictEqual(st.historique.length, 0);
  U.storeSave(st); assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"], "l'enregistrement n'y touche pas");
  ls.setItem("fonte:v1", "{abîmé une deuxième fois"); boot(ls);
  assert.strictEqual(ls.getItem("fonte:v1-illisible"), storage["fonte:v1"], "la première copie est conservée");
});
test("état d'un profil illisible : copie à part, et le profil migré repart de fonte:v1 (conservé)", () => {
  const storage = fixture("v1-usage-typique.json").storage, a = boot(storage), key = "fonte:p:" + a.U.STORE.pid;
  a.ls.setItem(key, "{cassé");
  const b = boot(a.ls);
  assert.strictEqual(b.U.STORE_BLOCK.reason, "illisible"); assert.strictEqual(b.ls.getItem(key + "-illisible"), "{cassé");
  assert.strictEqual(b.st.historique.length, JSON.parse(storage["fonte:v1"]).historique.length, "données retrouvées depuis fonte:v1");
});
test("format plus récent : fonte:profiles v3 ou profil v3 → rien n'est écrit, STORE_BLOCK posé", () => {
  const P3 = JSON.stringify({ v: 3, active: "x", list: [{ id: "x" }] }), a = boot({ "fonte:profiles": P3, "fonte:v1": fixture("v1-usage-typique.json").storage["fonte:v1"] });
  same(jsonOf(a.U.STORE_BLOCK), { reason: "plus-recent", v: 3 }); assert.strictEqual(a.U.STORE.mode, "bloque");
  assert.strictEqual(a.U.storeSave(a.st).ok, false); assert.strictEqual(a.ls.getItem("fonte:profiles"), P3); assert.strictEqual(a.ls._m.size, 2);
  const st3 = JSON.stringify({ v: 3, profile: { prenom: "Futur" } }), P = JSON.stringify({ v: 2, active: "pa", owner: "pa", list: [{ id: "pa", prenom: "" }] });
  const b = boot({ "fonte:profiles": P, "fonte:p:pa": st3 });
  same(jsonOf(b.U.STORE_BLOCK), { reason: "plus-recent", v: 3 });
  assert.strictEqual(b.U.storeSave(b.st).ok, false); assert.strictEqual(b.ls.getItem("fonte:p:pa"), st3, "jamais écrasé");
  const c = boot({ "fonte:v1": JSON.stringify({ v: 3, profiles: { list: [] } }) });
  assert.strictEqual(c.U.STORE_BLOCK.reason, "plus-recent"); assert.strictEqual(c.ls._m.size, 1, "rien d'écrit");
});
test("stockage plein simulé : l'historique ancien est résumé dans la copie, aucune séance perdue, fonte:v1 intact", () => {
  const storage = fixture("v1-gros-historique.json").storage, raw = JSON.parse(storage["fonte:v1"]);
  const full = boot(storage), v2len = full.ls.getItem("fonte:p:" + full.U.STORE.pid).length;
  const limit = full.ls._size() - 2000; /* la copie v2 complète ne tient pas, une copie résumée oui */
  const { st, U, ls } = boot(storage, { limit });
  assert.strictEqual(U.STORE.mode, "v2"); assert.strictEqual(U.STORE.note, "resume");
  assert.ok(JSON.parse(ls.getItem("fonte:profiles")).mig.resume);
  assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"], "fonte:v1 intact");
  assert.strictEqual(st.historique.length, raw.historique.length, "toutes les séances sont là");
  same(st.historique.map(h => h.id), raw.historique.map(h => h.id), "mêmes séances");
  assert.ok(ls.getItem("fonte:p:" + U.STORE.pid).length < v2len, "copie résumée");
  same(st.lastPerf, raw.lastPerf); same(st.legacyRefs, raw.lastPerf); same(st.mesures, raw.mesures); same(st.notes, raw.notes);
});
test("stockage plein simulé : migration impossible → on reste sur fonte:v1, rien n'est effacé ni laissé à moitié", () => {
  const storage = fixture("v1-usage-typique.json").storage, raw = JSON.parse(storage["fonte:v1"]);
  const total = Object.keys(storage).reduce((n, k) => n + k.length + storage[k].length, 0);
  const { st, U, ls } = boot(storage, { limit: total + 5000 });
  assert.strictEqual(U.STORE.mode, "v1"); assert.strictEqual(U.STORE.note, "migration-plein");
  assert.strictEqual(ls.getItem("fonte:profiles"), null); assert.ok([...ls._m.keys()].every(k => k.indexOf("fonte:p:") < 0), "aucune copie à moitié");
  assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"]);
  assert.strictEqual(st.historique.length, raw.historique.length); same(st.lastPerf, raw.lastPerf);
  same(U.profileList(), [], "un seul profil possible en attendant");
  /* l'appli continue comme la version 3A : fonte:v1 au format v1 */
  const b = boot(storage, { limit: total + 5000 }); assert.strictEqual(b.U.STORE.mode, "v1", "nouvel essai au lancement suivant");
  /* écriture de fonte:profiles refusée en dernier : tout est retiré */
  const c = boot(storage, { refuse: k => k === "fonte:profiles" });
  assert.strictEqual(c.U.STORE.mode, "v1"); assert.ok([...c.ls._m.keys()].every(k => k.indexOf("fonte:p:") < 0));
  /* mode v1 : enregistrement au format v1 (lisible par la version 3A) */
  const d = boot(storage, { refuse: k => k === "fonte:profiles" }); d.st.notes.x = "y"; assert.ok(d.U.storeSave(d.st).ok);
  const w = JSON.parse(d.ls.getItem("fonte:v1")); assert.strictEqual(w.v, 1); assert.strictEqual(w.refs, undefined); assert.strictEqual(w.historique.length, raw.historique.length); assert.strictEqual(w.notes.x, "y");
});
test("vérification après relecture : une copie différente de la source est retirée, on reste sur v1", () => {
  const storage = fixture("v1-usage-typique.json").storage;
  const { U, ls } = boot(storage, { alter: (k, v) => (k.indexOf("fonte:p:") === 0 ? v.replace('"mesures":[{', '"mesures":[{"x":1},{') : v) });
  assert.strictEqual(U.STORE.mode, "v1"); assert.strictEqual(U.STORE.note, "migration-verif");
  assert.ok([...ls._m.keys()].every(k => k.indexOf("fonte:p:") < 0)); assert.strictEqual(ls.getItem("fonte:v1"), storage["fonte:v1"]);
});
test("garde anti-retour : fonte:v1 modifié après la migration (ancienne version ouverte) → séances fusionnées par identifiant", () => {
  const storage = fixture("v1-usage-typique.json").storage, a = boot(storage), pid = a.U.STORE.pid;
  /* le profil v2 supprime une séance et en ajoute une */
  const del = a.st.historique[3].id;
  a.st.historique = a.st.historique.filter(h => h.id !== del); a.st.histDel[del] = NOW;
  a.st.historique.unshift({ id: "nouv2", date: "2026-11-05", ts: NOW - 5e3, upd: NOW - 5e3, nom: "v2", log: [] }); a.st.upd = NOW - 4e3;
  a.U.storeSave(a.st);
  /* l'ancienne version (encore ouverte) enregistre une séance dans fonte:v1 */
  const v1 = JSON.parse(storage["fonte:v1"]);
  v1.historique.unshift({ id: "ancv1", date: "2026-11-04", ts: NOW - 9e4, nom: "ancienne", log: [{ id: "squat-barre", sets: [{ r: 5, kg: 90 }] }] });
  v1.lastPerf["squat-barre"] = { d: "2026-11-04", ts: NOW - 9e4, sets: [{ r: 5, kg: 90 }], target: 5, base: 5, feel: 0, fails: 0 };
  v1.upd = NOW - 1e3;
  a.ls.setItem("fonte:v1", JSON.stringify(v1));
  const b = boot(a.ls);
  assert.strictEqual(b.U.STORE.note, "fusion"); assert.strictEqual(b.U.STORE.pid, pid);
  const ids = b.st.historique.map(h => h.id);
  assert.ok(ids.indexOf("ancv1") >= 0, "séance de l'ancienne version ajoutée"); assert.ok(ids.indexOf("nouv2") >= 0, "séance du profil gardée");
  assert.ok(ids.indexOf(del) < 0, "séance supprimée dans le profil : pas ressuscitée");
  assert.strictEqual(b.st.historique.length, a.st.historique.length + 1);
  assert.ok(b.st.historique.every((x, i, l) => !i || (l[i - 1].ts || 0) >= (x.ts || 0)), "historique trié");
  assert.strictEqual(b.st.lastPerf["squat-barre"].kg === undefined && b.st.lastPerf["squat-barre"].sets[0].kg, 90, "référence plus récente prise");
  assert.strictEqual(b.ls.getItem("fonte:v1"), JSON.stringify(v1), "fonte:v1 toujours pas modifié");
  const c = boot(b.ls); assert.strictEqual(c.U.STORE.note, null, "fusion faite une seule fois"); same(c.st, b.st);
});
test("toute restauration passe par migrate : codes FONTEDATA1. v1 de référence et aller-retour sauvegarde → restauration identique", () => {
  const code = fixture("v1-sauvegarde-fontedata1.json").code, raw = JSON.parse(fixture("v1-usage-typique.json").storage["fonte:v1"]);
  const r = G.decodeBackup(code);
  assert.strictEqual(r.error, undefined); assert.strictEqual(r.from, 1); assert.strictEqual(r.data.v, 2);
  assert.strictEqual(r.data.historique.length, raw.historique.length); same(r.data.legacyRefs, raw.lastPerf);
  assert.strictEqual(G.decodeBackup(JSON.stringify({ v: 3, app: "fonte", profile: {} })).error, "plus-recent");
  assert.strictEqual(G.decodeBackup("n'importe quoi").error, "illisible");
  assert.strictEqual(G.decodeBackup(JSON.stringify({ a: 1 })).error, "pas-fonte");
  V1_FIX.forEach(f => {
    const { st, U } = boot(fixture(f).storage);
    const KEYS = ["profile", "mesSeances", "historique", "lastPerf", "refs", "legacyRefs", "legacySrc", "notes", "mesures", "deload", "agenda", "imports"];
    for (const enc of [o => JSON.stringify(o), o => "FONTEDATA1." + U.b64e(JSON.stringify(o))]) {
      const txt = enc(U.backupPayload(st, NOW)), d = U.decodeBackup(txt);
      assert.strictEqual(d.error, undefined, f); assert.strictEqual(d.from, 2);
      const st2 = U.applyBackup(U.normState({}), jsonOf(d.data));
      KEYS.forEach(k => same(st2[k], st[k], f + " : " + k + " identique après aller-retour"));
    }
    /* une sauvegarde v1 (ancienne) se restaure dans un profil v2 sans rien perdre */
    const v1 = JSON.parse(fixture(f).storage["fonte:v1"]), d1 = U.decodeBackup(JSON.stringify(Object.assign({ app: "fonte" }, v1)));
    const st3 = U.applyBackup(U.normState({}), d1.data);
    assert.strictEqual(st3.historique.length, v1.historique.length); same(st3.lastPerf, v1.lastPerf || {}); same(st3.legacyRefs, v1.lastPerf || {});
  });
});
test("profils : ajout, changement, données et fichiers séparés (séance en cours, copie de sécurité, sauvegarde)", () => {
  const storage = fixture("v1-seance-en-cours.json").storage, a = boot(storage), p1 = a.U.STORE.pid;
  const id = a.U.profileAdd(NOW); assert.ok(id && id !== p1);
  assert.strictEqual(a.U.STORE.pid, p1, "le profil actif ne change pas tout seul");
  assert.ok(a.U.profileSwitch(id));
  const b = boot(a.ls);
  assert.strictEqual(b.U.STORE.pid, id); assert.strictEqual(b.st.historique.length, 0, "nouveau profil vide");
  assert.strictEqual(b.U.storeKey("run"), "fonte:p:" + id + ":run"); assert.strictEqual(b.ls.getItem(b.U.storeKey("run")), null, "pas la séance en cours de l'autre");
  assert.ok(b.ls.getItem("fonte:p:" + p1 + ":run"), "séance en cours du profil 1 gardée");
  b.st.profile.prenom = "Camille"; b.st.historique.push({ id: "s2", date: "2026-11-05", ts: NOW, log: [] }); assert.ok(b.U.storeSave(b.st).ok);
  assert.ok(b.U.storeSnapshot("restore", NOW)); assert.ok(b.ls.getItem("fonte:p:" + id + ":undo")); assert.strictEqual(b.ls.getItem("fonte:p:" + p1 + ":undo"), null);
  same(b.U.profileList().map(x => [x.prenom, x.active]), [["Alex", false], ["Camille", true]], "prénoms dans la liste");
  assert.ok(!b.U.isSyncOwner(), "la synchro de l'appareil reste reliée au profil 1");
  b.U.profileSwitch(p1);
  const c = boot(b.ls);
  assert.strictEqual(c.U.STORE.pid, p1); assert.ok(c.U.isSyncOwner());
  assert.ok(c.st.historique.every(h => h.id !== "s2"), "rien ne se mélange"); assert.strictEqual(c.st.profile.prenom, "Alex");
  assert.strictEqual(c.st.historique.length, JSON.parse(storage["fonte:v1"]).historique.length);
  assert.strictEqual(c.ls.getItem("fonte:v1"), storage["fonte:v1"]);
});

console.log("Références par zone et suppression d'une séance (S1-b format, D3)");
/* Ancienne règle de saveRunHistory (avant 3B), recopiée ici comme référence : refStep doit donner exactement la même chose */
function oldSave(lastPerf, items, logs, now, feel, dl) {
  const today = "2026-01-01";
  items.forEach((it, i) => {
    const reps = logs[i].filter(x => x.r != null); if (!reps.length || dl || it.warm || it.cool) return;
    if (lastPerf[it.id] && (lastPerf[it.id].ts || 0) > now) return;
    const sets = reps.map(x => Object.assign({ r: x.r, kg: x.kg || 0 }, x.rir != null ? { rir: x.rir } : {}));
    lastPerf[it.id] = { d: today, ts: now, sets, target: it.reps, base: it.base || it.reps, feel: feel || 0, fails: G.failCount(lastPerf[it.id], sets, it.reps) };
  });
}
/* Générateur pseudo-aléatoire reproductible */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const EXS = ["squat-barre", "developpe-couche", "rowing-barre", "curl-halteres", "planche"];
/* Séances générées comme l'appli les enregistre depuis 3B (cible t dans chaque série, base b) */
function genHist(seed, n) {
  const r = rng(seed), hist = [];
  for (let k = 0; k < n; k++) {
    const ts = 1790000000000 + k * 2 * 864e5 + Math.floor(r() * 1e6), log = [];
    EXS.forEach(id => {
      if (r() < 0.35) return;
      if (id === "planche") { log.push({ id, sets: [{ d: 30 + Math.floor(r() * 30) }] }); return; }
      const t = [5, 8, 10, 12, 15][Math.floor(r() * 5)], kg = 20 + Math.floor(r() * 16) * 2.5, ns = 2 + Math.floor(r() * 3);
      const sets = []; for (let s = 0; s < ns; s++) sets.push(Object.assign({ r: Math.max(1, t - Math.floor(r() * 3)), kg, t }, r() < 0.5 ? { rir: Math.floor(r() * 4) } : {}));
      log.push(Object.assign({ id, sets }, r() < 0.2 ? { b: t + 2 } : {}));
    });
    if (r() < 0.15) log.unshift({ id: "rameur", warm: 1, sets: [{ d: 300 }] });
    hist.unshift(Object.assign({ id: "h" + k, date: "2026-" + String(1 + (k % 12)).padStart(2, "0") + "-10", ts, upd: ts, log, ressenti: 1 + Math.floor(r() * 4), kind: r() < 0.1 ? "mob" : "muscu" }, r() < 0.1 ? { dl: 1 } : {}));
  }
  return hist;
}
/* comparaison sans tenir compte de l'ordre des clés des objets (sans importance pour les données) */
const canon = o => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => { a[x] = v[x]; return a; }, {}) : v));
const sameC = (a, b, msg) => assert.strictEqual(canon(a), canon(b), msg);
const refsOf = (hist, L0) => { const lp = jsonOf(L0 || {}), rf = G.refsFromLastPerf(lp); hist.slice().reverse().forEach(h => G.refStep(lp, rf, h)); return jsonOf({ lastPerf: lp, refs: rf }); };
test("refStep (enregistrement d'une séance) donne exactement la même référence que l'ancienne règle de saveRunHistory", () => {
  const r = rng(7);
  for (let k = 0; k < 300; k++) {
    const A = {}, B = {}, refs = {};
    for (let s = 0; s < 6; s++) {
      const items = EXS.slice(0, 4).map(id => ({ id, reps: [5, 8, 10, 12][Math.floor(r() * 4)], base: r() < 0.3 ? 12 : undefined, warm: r() < 0.05 ? 1 : undefined }));
      const logs = items.map(it => r() < 0.2 ? [] : [0, 1, 2].map(() => Object.assign({ r: Math.max(1, it.reps - Math.floor(r() * 3)), kg: 20 + Math.floor(r() * 10) * 2.5 }, r() < 0.5 ? { rir: Math.floor(r() * 4) } : {})));
      const now = 1790000000000 + s * 864e5 + (r() < 0.1 ? -5 * 864e5 : 0), feel = Math.floor(r() * 5) || null, dl = r() < 0.1;
      oldSave(A, items, logs, now, feel, dl);
      /* journal tel que runLog l'écrit depuis 3B */
      const log = items.map((it, i) => Object.assign(it.warm ? { warm: 1 } : {}, { id: it.id, sets: logs[i].map(x => Object.assign({ r: x.r, kg: x.kg }, x.rir != null ? { rir: x.rir } : {}, { t: it.reps })) }, it.base && it.base !== it.reps ? { b: it.base } : {})).filter(x => x.sets.length);
      G.refStep(B, refs, { id: "x" + s, date: "2026-01-01", ts: now, ressenti: feel, dl: dl ? 1 : undefined, log });
    }
    same(B, A, "essai " + k);
    Object.keys(B).forEach(id => same(refs[id][G.zoneOf(B[id].target)], B[id], "refs par zone"));
  }
});
test("D3 : historique de 5 séances, suppression de celle à 600 kg → la référence revient à la précédente, palier décrémenté", () => {
  const mk = (k, kg) => ({ id: "s" + k, date: "2026-10-0" + (k + 1), ts: 1790000000000 + k * 864e5, upd: 0, kind: "muscu", log: [{ id: "squat-barre", sets: [{ r: 5, kg, t: 5 }, { r: 5, kg, t: 5 }] }] });
  const hist = [mk(0, 90), mk(1, 92.5), mk(2, 95), mk(3, 600), mk(4, 97.5)].reverse();
  /* la séance à 600 kg est la plus récente pour cet exercice si on retire la dernière */
  const h4 = hist.filter(h => h.id !== "s4");
  const before = refsOf(h4);
  assert.strictEqual(before.lastPerf["squat-barre"].sets[0].kg, 600);
  const after = G.rebuildRefs(h4.filter(h => h.id !== "s3"), {}, {});
  assert.strictEqual(after.lastPerf["squat-barre"].sets[0].kg, 95, "retour à 95 kg");
  sameC(after, refsOf(h4.filter(h => h.id !== "s3")), "comme si elle n'avait jamais existé");
  /* même cas avec des séances d'avant 3B (sans cible t) et la référence v1 venant de la séance à 600 kg */
  const old = h4.map(h => jsonOf(Object.assign({}, h, { log: h.log.map(l => ({ id: l.id, sets: l.sets.map(s => ({ r: s.r, kg: s.kg })) })) })));
  const L = { "squat-barre": { d: "2026-10-04", ts: 1790000000000 + 3 * 864e5, sets: [{ r: 5, kg: 600 }, { r: 5, kg: 600 }], target: 5, base: 5, feel: 0, fails: 0 } };
  const src = G.legacySources(old, L); assert.strictEqual(src["squat-barre"], "s3");
  same(G.rebuildRefs(old, L, src).lastPerf, L, "séance d'origine présente : référence v1 gardée telle quelle");
  const rb = G.rebuildRefs(old.filter(h => h.id !== "s3"), L, src);
  assert.strictEqual(rb.lastPerf["squat-barre"].sets[0].kg, 95, "séance d'origine supprimée : référence recalculée sur la précédente");
  assert.strictEqual(rb.lastPerf["squat-barre"].target, 5, "cible déduite (plus grande répétition faite)");
  /* palier : 5 séances, 9 par palier (3 jours × 3 semaines ? selon PHASE_WEEKS), une de moins */
  const prof = { niveau: "intermediaire", jours: 3 }, p5 = G.rebuildProgress(hist, prof), p4 = G.rebuildProgress(hist.filter(h => h.id !== "s3"), p5, hist.find(h => h.id === "s3"));
  assert.strictEqual(p5.phaseDone, 5); assert.strictEqual(p4.phaseDone, 4, "palier décrémenté");
});
test("D3, propriété : supprimer une séance puis recalculer = comme si elle n'avait jamais existé (références, zones, palier)", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const hist = genHist(seed, 10 + seed % 40), r = rng(seed * 31);
    const legacy = seed % 3 === 0 ? { "squat-barre": { d: "2025-12-01", ts: 1780000000000, sets: [{ r: 8, kg: 70 }], target: 8, base: 8, feel: 2, fails: 0 } } : {};
    for (let k = 0; k < 5; k++) {
      const x = hist[Math.floor(r() * hist.length)], rest = hist.filter(h => h !== x);
      sameC(G.rebuildRefs(rest, legacy, {}), refsOf(rest, legacy), "graine " + seed + " : références sans " + x.id);
      sameC(G.rebuildRefs(hist, legacy, {}), refsOf(hist, legacy), "graine " + seed + " : rien de supprimé = références actuelles");
      /* palier : séances une à une depuis le début, comme l'appli */
      const p0 = { niveau: ["debutant", "intermediaire"][seed % 2], jours: 2 + seed % 4, phase: 1, phaseDone: 0, phases: [] };
      const play = list => { const q = jsonOf(p0); q.phaseStart = undefined; list.slice().reverse().filter(G.countable).forEach(h => G.tickApply(q, G.progressTick(q), h.date)); return q; };
      const cur = play(hist), want = play(rest), got = G.rebuildProgress(rest, cur, x);
      ["phase", "phaseDone", "niveau"].forEach(f => assert.strictEqual(got[f], want[f], "graine " + seed + " : " + f + " sans " + x.id));
      same((got.phases || []).map(p => [p.n, p.niv, p.to]), (want.phases || []).map(p => [p.n, p.niv, p.to]), "graine " + seed + " : paliers");
    }
  }
});
test("D3 : palier incohérent avec l'historique (jours changés, ancienne suppression) → une seule séance retirée au compteur", () => {
  const hist = genHist(5, 12).map(h => Object.assign(h, { kind: "muscu", dl: undefined }));
  const p = { niveau: "intermediaire", jours: 3, phase: 2, phaseDone: 3, phases: [{ n: 1, niv: "intermediaire", from: "2026-01-10", to: "2026-03-10" }], phaseStart: "2026-03-10" };
  const q = G.rebuildProgress(hist.slice(1), p, hist[0]);
  assert.strictEqual(q.phase, 2); assert.strictEqual(q.phaseDone, 2);
  const q0 = G.rebuildProgress(hist.slice(1), Object.assign({}, p, { phaseDone: 0 }), hist[0]);
  assert.strictEqual(q0.phase, 1, "palier précédent rouvert"); assert.strictEqual(q0.phases.length, 0); assert.strictEqual(q0.phaseStart, "2026-01-10");
  same(G.rebuildProgress(hist.slice(1), p, Object.assign({}, hist[0], { kind: "mob" })), p, "séance de mobilité : palier inchangé");
});

console.log("Charges et historique (S1-b usage, S8, D4, D10, S9 — phase 3D)");
test("S1-b : en force + muscle, le squat progresse séparément à 5 et à 10 répétitions (référence de la zone)", () => {
  const f = { d: "2026-10-01", ts: 1, sets: [{ r: 5, kg: 100 }, { r: 5, kg: 100 }], target: 5, base: 5, feel: 2, fails: 0 };
  const m = { d: "2026-10-03", ts: 2, sets: [{ r: 10, kg: 80 }, { r: 10, kg: 80 }], target: 10, base: 10, feel: 2, fails: 0 };
  const refs = { "squat-barre": { force: f, muscle: m } }, lastPerf = { "squat-barre": m };
  assert.strictEqual(G.refFor(refs, lastPerf, "squat-barre", 5), f, "5 reps → référence force");
  assert.strictEqual(G.refFor(refs, lastPerf, "squat-barre", 10), m, "10 reps → référence muscle");
  assert.strictEqual(G.progress("squat-barre", G.refFor(refs, lastPerf, "squat-barre", 5)).next, 102.5);
  assert.strictEqual(G.progress("squat-barre", G.refFor(refs, lastPerf, "squat-barre", 10)).next, 82.5);
  /* pas de référence dans la zone : la dernière performance, convertie si l'écart est grand (S1-a) */
  const only = { "squat-barre": { force: f } };
  assert.strictEqual(G.refFor(only, { "squat-barre": f }, "squat-barre", 10), f);
  assert.strictEqual(G.convertLoad("squat-barre", f, 10, 20), 82.5);
  assert.strictEqual(G.refFor({}, {}, "squat-barre", 10), null);
  assert.strictEqual(G.refFor(refs, lastPerf, "planche", 0), null);
});
test("S1-b : refStep range chaque séance dans sa zone, et la charge proposée suit la bonne zone", () => {
  const lp = {}, refs = {};
  G.refStep(lp, refs, { id: "a", date: "2026-10-01", ts: 1, log: [{ id: "squat-barre", sets: [{ r: 5, kg: 100, t: 5 }] }] });
  G.refStep(lp, refs, { id: "b", date: "2026-10-02", ts: 2, log: [{ id: "squat-barre", sets: [{ r: 10, kg: 80, t: 10 }] }] });
  assert.strictEqual(G.refFor(refs, lp, "squat-barre", 5).sets[0].kg, 100);
  assert.strictEqual(G.refFor(refs, lp, "squat-barre", 12).sets[0].kg, 80);
});
test("S8 : au palier 4 (10 → 8 reps), la charge proposée est au moins celle du palier 3, convertie par le 1RM estimé", () => {
  const ref = { sets: [{ r: 10, kg: 100 }, { r: 10, kg: 100 }, { r: 10, kg: 100 }], target: 10, base: 10 };
  const sg = G.progress("squat-barre", ref);
  assert.strictEqual(sg.next, 102.5, "palier 3 : progression normale");
  const v = G.s8Load("squat-barre", ref, 8, sg, 20);
  assert.ok(v >= sg.next, "jamais moins que la progression normale");
  assert.strictEqual(v, 105, "100 kg × (1 + 10/30) / (1 + 8/30) = 105,3 → 105 kg");
  /* petite charge : la progression normale reste au-dessus */
  const r2 = { sets: [{ r: 10, kg: 60 }], target: 10 }; assert.strictEqual(G.s8Load("squat-barre", r2, 8, G.progress("squat-barre", r2), 20), 62.5);
  /* pas d'application : séance ratée, même nombre de reps, écart ≥ 3 (S1-a s'en charge), assistance */
  assert.strictEqual(G.s8Load("squat-barre", { sets: [{ r: 7, kg: 100 }], target: 10 }, 8, G.progress("squat-barre", { sets: [{ r: 7, kg: 100 }], target: 10 }), 20), null);
  assert.strictEqual(G.s8Load("squat-barre", ref, 10, sg, 20), null);
  assert.strictEqual(G.s8Load("squat-barre", ref, 6, sg, 20), null);
  assert.strictEqual(G.s8Load("tractions-assistees", { sets: [{ r: 10, kg: 20 }], target: 10 }, 8, { why: "up", next: 17.5 }, 20), null);
  /* sur toutes les combinaisons : au palier 4, un gros exercice dont les reps baissent n'est jamais proposé plus léger qu'au palier 3 */
  let n = 0;
  ["muscle", "forme"].forEach(o => ["intermediaire", "avance"].forEach(niv => [3, 4].forEach(j => {
    const p = Object.assign({}, P_H, { objectif: o, objectifs: [o], niveau: niv, jours: j });
    G.programme(Object.assign({}, p, { phase: 4 })).ids.forEach(id => {
      const s3 = G.prescribe(G.TPL_BY_ID[id], Object.assign({}, p, { phase: 3 })), s4 = G.prescribe(G.TPL_BY_ID[id], Object.assign({}, p, { phase: 4 }));
      s4.items.forEach(it => { const a = s3.items.find(x => x.id === it.id); if (!a || !(a.reps > it.reps) || !G.LOAD[it.id]) return;
        const lp = { sets: [{ r: a.reps, kg: 40 }, { r: a.reps, kg: 40 }], target: a.reps }, sg3 = G.progress(it.id, lp);
        if (!sg3 || sg3.why !== "up") return;
        const v4 = G.s8Load(it.id, lp, it.reps, sg3, 20); assert.ok(v4 == null || v4 >= sg3.next, it.id); if (v4 != null) n++; });
    });
  })));
  assert.ok(n > 0, "cas vérifiés");
});
test("D10 : volume = répétitions × charge réellement soulevée (2 haltères, barre, assistance non comptée)", () => {
  assert.strictEqual(G.logVolume([{ id: "dc-halteres", sets: [{ r: 10, kg: 20 }] }]), 400, "2 haltères de 20 kg");
  assert.strictEqual(G.logVolume([{ id: "rowing-haltere", sets: [{ r: 10, kg: 20 }] }]), 200, "un seul haltère (option S)");
  assert.strictEqual(G.logVolume([{ id: "squat-barre", sets: [{ r: 5, kg: 100 }, { r: 5, kg: 100 }] }]), 1000, "barre : charge totale");
  assert.strictEqual(G.logVolume([{ id: "tractions-assistees", sets: [{ r: 8, kg: 30 }] }]), 0, "assistance : pas un poids soulevé");
  assert.strictEqual(G.logVolume([{ id: "planche", sets: [{ d: 45 }] }, { id: "pompes", sets: [{ r: 15, kg: 0 }] }]), 0);
  assert.strictEqual(G.exSeries([{ id: "a", date: "2026-10-01", ts: 1, log: [{ id: "dc-halteres", sets: [{ r: 10, kg: 20 }] }] }], "dc-halteres")[0].vol, 400);
});
test("S9 : la courbe sait quand le 1RM estimé vient d'une série de plus de 10 répétitions", () => {
  const pts = G.exSeries([{ id: "a", date: "2026-10-01", ts: 1, log: [{ id: "squat-barre", sets: [{ r: 15, kg: 60 }, { r: 5, kg: 70 }] }] },
    { id: "b", date: "2026-10-02", ts: 2, log: [{ id: "squat-barre", sets: [{ r: 5, kg: 100 }] }] }], "squat-barre");
  assert.strictEqual(pts[0].rmR, 15, "60 × 15 (1RM 90) > 70 × 5 (81,7)"); assert.strictEqual(pts[1].rmR, 5);
});
/* État minimal pour D4 */
const d4State = () => {
  const mk = (k, kg) => ({ id: "s" + k, date: "2026-10-0" + (k + 1), ts: new Date(2026, 9, k + 1, 18).getTime(), upd: 100 + k, nom: "Force", kind: "muscu", duree: 3600, kcal: 300, sets: 2, volume: 10 * kg,
    log: [{ id: "squat-barre", sets: [{ r: 5, kg, t: 5 }, { r: 5, kg, t: 5 }] }, { id: "curl-halteres", sets: [{ r: 10, kg: 10, t: 10 }] }] });
  const st = G.normState({ profile: { niveau: "intermediaire", jours: 3, phase: 1, phaseDone: 0, phases: [], poids: 80 }, historique: [mk(0, 90), mk(1, 92.5), mk(2, 95), mk(3, 600)].reverse() });
  const asc = st.historique.slice().reverse();
  asc.forEach((h, k) => { const pr = G.findRecords(asc.slice(0, k), h.log).map(r => ({ id: r.id, k: r.k, v: r.v })); if (pr.length) h.pr = pr; G.refStep(st.lastPerf, st.refs, h); G.tickApply(st.profile, G.progressTick(st.profile), h.date); });
  return st;
};
test("D4 : corriger 600 → 60 kg corrige la référence, la courbe et les records ; upd et ed posés", () => {
  const st = d4State(), now = 1800000000000;
  assert.strictEqual(st.lastPerf["squat-barre"].sets[0].kg, 600);
  const x = st.historique.find(h => h.id === "s3"), e = jsonOf(x);
  e.log[0].sets.forEach(s => { s.kg = 60; });
  const r = G.histSave(st, e, now);
  assert.ok(r.ok && !r.added); const h = st.historique.find(h => h.id === "s3");
  assert.strictEqual(h.upd, now, "upd = maintenant"); assert.strictEqual(h.ed, 1);
  assert.strictEqual(st.lastPerf["squat-barre"].sets[0].kg, 60, "référence corrigée");
  assert.strictEqual(st.refs["squat-barre"].force.sets[0].kg, 60);
  assert.strictEqual(G.progress("squat-barre", st.refs["squat-barre"].force).next, 62.5);
  assert.strictEqual(Math.max.apply(null, G.exSeries(st.historique, "squat-barre").map(p => p.kg)), 95, "courbe : 95 kg au plus");
  assert.ok(!(h.pr || []).some(p => p.id === "squat-barre"), "plus de record à 60 kg");
  assert.strictEqual(h.volume, 60 * 10 + 10 * 10 * 2, "volume recalculé (D10)");
  assert.strictEqual(st.profile.phaseDone, 4, "palier inchangé"); assert.strictEqual(st.historique.length, 4);
  /* une séance faite après, à 97,5 kg : redevient un record grâce à la correction */
  const st2 = d4State(); st2.historique.unshift({ id: "s4", date: "2026-10-05", ts: new Date(2026, 9, 5, 18).getTime(), upd: 5, kind: "muscu", nom: "F", log: [{ id: "squat-barre", sets: [{ r: 5, kg: 97.5, t: 5 }] }] });
  const e2 = jsonOf(st2.historique.find(h => h.id === "s3")); e2.log[0].sets.forEach(s => { s.kg = 60; });
  const r2 = G.histSave(st2, e2, now);
  same(r2.changed, ["s4"], "la séance suivante a de nouveaux records");
  const s4 = st2.historique.find(h => h.id === "s4"); assert.ok(s4.pr.some(p => p.id === "squat-barre" && p.k === "kg" && p.v === 97.5)); assert.strictEqual(s4.upd, now, "elle repartira en ligne");
  /* rien de changé : rien n'est réécrit */
  const st3 = d4State(), x3 = st3.historique[1], before = JSON.stringify(st3);
  const r3 = G.histSave(st3, jsonOf(x3), now); assert.ok(r3.same); assert.strictEqual(JSON.stringify(st3), before);
});
test("D4 : séance d'avant 3B (référence v1 issue de la séance à 600 kg) : corrigée, la référence v1 n'est plus utilisée", () => {
  const st = d4State();
  st.historique.forEach(h => h.log.forEach(l => l.sets.forEach(s => { delete s.t; })));
  st.legacyRefs = { "squat-barre": jsonOf(st.lastPerf["squat-barre"]) }; st.legacySrc = { "squat-barre": "s3" };
  const e = jsonOf(st.historique.find(h => h.id === "s3")); e.log[0].sets.forEach(s => { s.kg = 60; });
  G.histSave(st, e, 1800000000000);
  assert.strictEqual(st.lastPerf["squat-barre"].sets[0].kg, 60);
  assert.strictEqual(st.legacyRefs["squat-barre"].sets[0].kg, 600, "legacyRefs jamais modifiée");
});
test("D4 : changer la date, ajouter et retirer des séries, séance vide refusée, séance résumée refusée", () => {
  const st = d4State(), now = 1800000000000;
  const e = jsonOf(st.historique.find(h => h.id === "s0")); e.date = "2026-10-06"; e.heure = "07:30"; e.log[0].sets.push({ r: 3, kg: 90 }); e.log.splice(1, 1);
  const r = G.histSave(st, e, now); assert.ok(r.ok);
  assert.strictEqual(st.historique[0].id, "s0", "retriée : la plus récente");
  assert.strictEqual(new Date(st.historique[0].ts).getHours(), 7); assert.strictEqual(st.historique[0].sets, 3);
  assert.strictEqual(st.lastPerf["squat-barre"].d, "2026-10-06", "référence : la séance déplacée est maintenant la dernière");
  assert.ok(!st.lastPerf["curl-halteres"] || st.lastPerf["curl-halteres"].d !== "2026-10-06");
  const v = jsonOf(st.historique[1]); v.log = [{ id: "squat-barre", sets: [{ r: 0, kg: 90 }] }];
  assert.strictEqual(G.histSave(st, v, now).error, "vide");
  st.historique[2].c = 1; assert.strictEqual(G.histSave(st, jsonOf(st.historique[2]), now).error, "resume");
  assert.strictEqual(G.histSave(st, { id: "inconnu", date: "2026-10-01", log: [] }, now).error, "introuvable");
});
test("D4 : ajouter une séance passée → identifiant, ts = date choisie, upd = maintenant, palier compté, références et records", () => {
  const st = d4State(), now = 1800000000000, n0 = st.profile.phaseDone;
  const r = G.histSave(st, { date: "2026-09-20", heure: "18:00", nom: "Séance faite sans l'appli", kind: "muscu", ref: { k: "t", id: "force-squat" }, duree: 2700, ressenti: 2,
    log: [{ id: "squat-barre", sets: [{ r: 5, kg: 80 }] }, { id: "planche", sets: [{ d: 60 }] }] }, now);
  assert.ok(r.ok && r.added); const h = r.entry;
  assert.ok(typeof h.id === "string" && h.id.length >= 8); assert.strictEqual(h.ts, new Date(2026, 8, 20, 18).getTime()); assert.strictEqual(h.upd, now);
  assert.strictEqual(h.ed, undefined); assert.strictEqual(h.ajout, 1); same(h.ref, { k: "t", id: "force-squat" });
  assert.strictEqual(st.profile.phaseDone, n0 + 1, "compte pour le palier");
  assert.strictEqual(st.historique[st.historique.length - 1].id, h.id, "rangée à sa date (la plus ancienne)");
  assert.strictEqual(st.lastPerf["squat-barre"].sets[0].kg, 600, "plus ancienne : ne remplace pas la référence récente");
  assert.ok(G.csSeOk(h), "valide pour la synchro"); assert.strictEqual(h.kcal > 0, true); assert.strictEqual(h.duree, 2700);
  /* la séance suivante (90 kg) n'est plus la première fois : elle devient un record */
  assert.ok(st.historique.find(x => x.id === "s0").pr.some(p => p.id === "squat-barre"));
});

console.log("Fichiers de l'appli et hors ligne");
test("sw.js : tous les fichiers chargés par index.html et tous les fichiers de js/ sont dans SHELL", () => {
  const sw = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8"), html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const shell = JSON.parse(sw.match(/const SHELL = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => "./" + m[1]);
  const files = fs.readdirSync(path.join(__dirname, "..", "js")).filter(f => f.endsWith(".js")).map(f => "./js/" + f);
  assert.ok(srcs.length >= 5, "index.html charge les moteurs");
  srcs.concat(files).forEach(f => assert.ok(shell.indexOf(f) >= 0, f + " absent de SHELL"));
  same(srcs, ["./js/engine-pedago.js", "./js/engine-training.js", "./js/engine-analytics.js", "./js/engine-user.js", "./js/engine-sync.js", "./js/app.js"], "ordre de chargement");
  assert.ok(/window\.FONTE_PWA = true/.test(html), "mode PWA conservé");
});

/* Tests asynchrones (synchro en ligne, phase 3C : faux Firestore) : lancés à la suite, dans l’ordre */
const asyncTests = [];
const atest = (name, fn) => asyncTests.push([name, fn]);
require("./synchro")(atest, G, same);
(async () => {
  console.log("Sauvegarde et synchro en ligne (faux Firestore)");
  for (const [name, fn] of asyncTests) {
    try { await fn(); pass++; console.log("  ok  " + name); }
    catch (e) { fail++; console.log("  ÉCHEC  " + name + "\n        " + (e && e.message ? e.message.split("\n").join("\n        ") : JSON.stringify(e))); }
  }
  console.log("\n" + pass + " réussis, " + fail + " en échec");
  process.exit(fail ? 1 : 0);
})();
