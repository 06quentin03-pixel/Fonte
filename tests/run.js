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
const names = ["EX", "EX_BY_ID", "TPL", "TPL_BY_ID", "LOAD", "DB_KG", "KB_KG", "OBJECTIFS", "NIV_KEYS", "HIST_FULL", "HIST_MAX"];
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
test("coolDown : 4 étirements maximum, jamais déjà dans la séance", () => {
  G.TPL.forEach(t => {
    const se = G.prescribe(t, P_H), cd = G.coolDown(se.items);
    assert.ok(cd.length <= 4);
    cd.forEach(it => { assert.ok(G.EX_BY_ID[it.id]); assert.ok(!se.items.some(x => x.id === it.id)); });
  });
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
