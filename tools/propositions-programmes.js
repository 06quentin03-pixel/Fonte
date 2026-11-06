/* Outil (phase 3D, S2/S3) : séries par muscle et par semaine, fréquence, et écarts aux repères (plan section 9.1–9.2),
   pour chaque objectif × niveau × nombre de jours (2 à 6), palier 1, semaines A et B (moyenne).
   Usage : node tools/propositions-programmes.js > annexe.md   (lecture seule : ne modifie aucun programme).
   Comptage : 1 série pour un muscle principal, ½ pour un secondaire (méthode actuelle de Fonte, comptage « fractionnaire » de Pelland et al. 2026).
   Repères (signalés, jamais appliqués seuls — décision 2) :
   - prise de muscle : au moins 10 séries pondérées par semaine pour chaque grand muscle ; alerte de déséquilibre au-delà de 20 quand un autre est sous 10 ;
   - fréquence : au moins 2 séances par semaine par grand muscle quand le programme a 3 jours ou plus (muscle, force, forme) ;
   - équilibre tirage / poussée (dos ÷ pectoraux) : signalé hors de 0,7 à 1,5 (règle pratique, pas un chiffre d’étude). */
"use strict";
const G = require("../tests/charger").charger();
const MAJ = ["pecs", "dorsaux", "epaules_ant", "epaules_lat", "epaules_post", "biceps", "triceps", "quadriceps", "ischios", "fessiers", "mollets", "abdos"];
const NOM = { pecs: "pectoraux", dorsaux: "dorsaux", epaules_ant: "deltoïdes avant", epaules_lat: "deltoïdes latéraux", epaules_post: "deltoïdes arrière", biceps: "biceps", triceps: "triceps", quadriceps: "quadriceps", ischios: "ischios", fessiers: "fessiers", mollets: "mollets", abdos: "abdos" };
const NIV = { debutant: "débutant", intermediaire: "intermédiaire", avance: "avancé" };
const base = { sexe: "H", age: 30, taille: 180, poids: 80, barre: 20, sansSaut: false };
function week(p, iso) {
  const pr = G.programme(p), v = {}, f = {}, days = [];
  pr.ids.forEach((id0, j) => {
    const id = G.weekVariant(id0, iso), se = G.prescribe(G.TPL_BY_ID[id], G.profFor(p, pr.objs[j])), hit = {};
    days.push(G.TPL_BY_ID[id].n);
    se.items.forEach(it => {
      const e = G.EX_BY_ID[it.id]; if (!e || ["cardio", "mobilite", "etirements"].includes(e.g)) return;
      const n = se.mode === "circuit" ? (se.tours || 1) : it.series;
      e.p.forEach(m => { v[m] = (v[m] || 0) + n; hit[m] = 1; });
      e.s.forEach(m => { if (!e.p.includes(m)) v[m] = (v[m] || 0) + n / 2; });
    });
    Object.keys(hit).forEach(m => { f[m] = (f[m] || 0) + 1; });
  });
  return { days, v, f };
}
function analyse(obj, niveau, jours) {
  const p = Object.assign({}, base, { objectif: obj, objectifs: [obj], niveau, jours, phase: 1, phaseDone: 0 });
  const A = week(p, "2026-11-02"), B = week(p, "2026-11-09"), v = {}, f = {};
  MAJ.forEach(m => { v[m] = ((A.v[m] || 0) + (B.v[m] || 0)) / 2; f[m] = Math.min(A.f[m] || 0, B.f[m] || 0); });
  const al = [];
  if (obj === "muscle") {
    const low = MAJ.filter(m => m !== "abdos" && v[m] < 10), high = MAJ.filter(m => v[m] > 20);
    if (low.length) al.push("moins de 10 séries : " + low.map(m => NOM[m] + " " + fmt(v[m])).join(", "));
    if (high.length && low.length) al.push("déséquilibre : " + high.map(m => NOM[m] + " " + fmt(v[m])).join(", ") + " alors que d’autres sont sous 10");
  }
  if (jours >= 3 && ["muscle", "force", "forme"].includes(obj)) {
    const once = ["pecs", "dorsaux", "quadriceps", "ischios", "fessiers"].filter(m => f[m] < 2);
    if (once.length) al.push("1 seule séance par semaine (ou moins) en principal : " + once.map(m => NOM[m]).join(", "));
  }
  const ratio = v.pecs ? v.dorsaux / v.pecs : null;
  if (ratio != null && (ratio < 0.7 || ratio > 1.5) && ["muscle", "force", "perte"].includes(obj)) al.push("tirage ÷ poussée (dos ÷ pecs) = " + fmt(ratio));
  return { A, B, v, f, al };
}
const fmt = x => String(Math.round(x * 10) / 10).replace(".", ",");
if (require.main === module) {
  const out = [];
  for (const obj of Object.keys(G.OBJECTIFS)) for (const niveau of Object.keys(NIV)) for (let j = 2; j <= 6; j++) {
    const r = analyse(obj, niveau, j);
    out.push(`| ${G.OBJECTIFS[obj].n} | ${NIV[niveau]} | ${j} j | ${r.A.days.join(", ")} | ${MAJ.map(m => fmt(r.v[m]) + (r.f[m] ? " (" + r.f[m] + "×)" : " (0×)")).join(" · ")} | ${r.al.length ? r.al.join(" ; ") : "—"} |`);
  }
  console.log("| Objectif | Niveau | Jours | Séances (semaine A) | Séries par semaine (A et B en moyenne) et fréquence : " + MAJ.map(m => NOM[m]).join(" · ") + " | Écarts aux repères |\n|---|---|---|---|---|---|\n" + out.join("\n"));
}
module.exports = { analyse, MAJ, NOM };
