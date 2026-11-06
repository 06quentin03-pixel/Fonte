/* Photographie des programmes (plan phase 2, section 8.1) : pour chaque combinaison objectif(s) × niveau × jours × palier × semaine A/B,
   le programme et chaque séance prescrite (exercices, séries, répétitions, durées, repos, charges de départ, notes).
   Les séances identiques sont rangées une seule fois dans un dictionnaire pour garder un fichier de taille raisonnable.
   tests/run.js compare l'appli à tests/fixtures/programmes.json : toute différence fait échouer le test.
   Mise à jour volontaire seulement (S5 en 3D, propositions validées en 3E) : node tools/photo-programmes.js */
"use strict";
const P = { prenom: "", sexe: "H", age: 30, taille: 180, poids: 80, barre: 20, sansSaut: false };
const NIVEAUX = ["debutant", "intermediaire", "avance"], PALIERS = [1, 2, 3, 4, 5], SEMAINES = { A: "2026-11-02", B: "2026-11-09" };

function photo(G) {
  const objs = Object.keys(G.OBJECTIFS), combos = objs.map(k => [k]);
  objs.forEach(a => objs.forEach(b => { if (a !== b) combos.push([a, b]); }));
  const dict = [], index = new Map(), programmes = {};
  const ref = s => { let i = index.get(s); if (i == null) { i = dict.length; dict.push(s); index.set(s, i); } return i; };
  combos.forEach(O => NIVEAUX.forEach(niv => { for (let j = 1; j <= 6; j++) PALIERS.forEach(ph => Object.keys(SEMAINES).forEach(w => {
    const p = Object.assign({}, P, { objectif: O[0], objectifs: O, niveau: niv, jours: j, phase: ph, phaseDone: 0 });
    const pr = G.programme(p);
    const seances = pr.ids.map((id, k) => ref(JSON.stringify(G.prescribe(G.TPL_BY_ID[G.weekVariant(id, SEMAINES[w])], G.profFor(p, pr.objs[k])))));
    programmes[O.join("+") + " · " + niv + " · " + j + " j · palier " + ph + " · semaine " + w] = { ids: pr.ids, objs: pr.objs, offsets: pr.offsets, seances };
  })); }));
  return { _info: "Photographie des programmes de Fonte (profil de référence : homme 30 ans, 180 cm, 80 kg). Ne pas modifier à la main.", seances: dict, programmes };
}
module.exports = { photo };
