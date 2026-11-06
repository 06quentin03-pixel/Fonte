/* ===== Fonte · moteur « analyse » : courbes par exercice, records, muscles travaillés, régularité, plateau de poids =====
   Fonctions pures (sans DOM ni état de l’appli) : vérifiées par tests/run.js.
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → app.js.
   Les déclarations de haut niveau sont partagées entre ces fichiers (comme lorsqu’ils formaient un seul index.html) :
   un fichier peut utiliser ce qu’un fichier précédent déclare. tools/assemble.js les recolle en un seul fichier (mode « artifact Claude »). */

/* D10 (phase 3D) : charge réellement soulevée par répétition, à partir de la charge notée.
   Exercice aux haltères (LOAD « d » sans l’option S, « par haltère ») : 2 haltères ; assistance (contrepoids) : ce n’est pas un poids
   soulevé, 0 (comme les autres exercices au poids du corps, dont la charge notée est 0). */
function loadMult(id) { const L = LOAD[id]; if (!L) return 1; if (L[0] === "a") return 0; if (L[0] === "d" && (L[2] || "").indexOf("S") < 0) return 2; return 1; }
/* Volume d’une séance (journal au format de l’historique) : somme des répétitions × charge réellement soulevée.
   Échauffement et étirements compris s’ils ont une charge (en pratique : non). */
function logVolume(log) {
  let v = 0;
  (log || []).forEach(l => { if (!l || !Array.isArray(l.sets)) return; const m = loadMult(l.id); l.sets.forEach(s => { if (s && s.r > 0 && s.kg > 0) v += s.r * s.kg * m; }); });
  return v;
}
/* Courbe d’un exercice : un point par séance, du plus ancien au plus récent.
   rmR = répétitions de la série qui donne le 1RM estimé (S9 : au-delà de 10, l’estimation est peu fiable). */
function exSeries(hist, id) {
  const by = {};
  (hist || []).forEach(h => {
    if (!h || !Array.isArray(h.log)) return;
    h.log.forEach(l => {
      if (!l || l.id !== id || l.cool || l.warm || !Array.isArray(l.sets)) return;
      const rs = l.sets.filter(s => s && s.r != null && s.r > 0), ds = l.sets.filter(s => s && s.d > 0);
      if (!rs.length && !ds.length) return;
      const k = h.id || h.date + h.ts;
      const p = by[k] || (by[k] = { hid: h.id, date: h.date, ts: h.ts || 0, kg: 0, rm: 0, rmR: 0, reps: 0, d: 0, as: 0, vol: 0 });
      const mult = loadMult(id);
      rs.forEach(s => {
        const kg = s.kg || 0, rm = e1rm(s.r, kg);
        if (rm > p.rm) { p.rm = rm; p.rmR = s.r; }
        p.kg = Math.max(p.kg, kg); p.reps = Math.max(p.reps, s.r); p.vol += s.r * kg * mult;
        if (s.r >= 5 && (!p.as || kg < p.as)) p.as = kg || 0.001;
      });
      ds.forEach(s => { p.d = Math.max(p.d, s.d); });
    });
  });
  return Object.values(by).sort((a, b) => (a.ts - b.ts) || String(a.date).localeCompare(String(b.date)));
}
/* Ce qu’on suit pour un exercice : kg (1RM estimé et charge max), assist (moins d’assistance = mieux), reps (poids du corps), duree */
function trackKind(id, pts) {
  if (isAssist(id)) return "assist";
  if (pts.some(p => p.kg > 0)) return "kg";
  if (pts.some(p => p.reps > 0)) return "reps";
  if (pts.some(p => p.d > 0)) return "duree";
  const e = EX_BY_ID[id]; return e && e.t === "t" ? "duree" : "reps";
}
const NO_RECORD_GROUPS = ["mobilite", "etirements"];
/* Meilleures valeurs d’un exercice */
function bestOf(pts, kind) {
  if (!pts.length) return null;
  const pick = k => pts.reduce((b, p) => (p[k] > b[k] ? p : b), pts[0]);
  if (kind === "kg") { const a = pick("kg"), m = pick("rm"); return { kg: a.kg, kgDate: a.date, rm: m.rm, rmDate: m.date }; }
  if (kind === "assist") { const w = pts.filter(p => p.as); if (!w.length) return null; const a = w.reduce((b, p) => (p.as < b.as ? p : b), w[0]); return { as: a.as < 0.01 ? 0 : a.as, date: a.date }; }
  if (kind === "reps") { const a = pick("reps"); return { reps: a.reps, date: a.date }; }
  const a = pick("d"); return { d: a.d, date: a.date };
}
/* Records battus par une séance (log au format de l’historique) par rapport aux séances précédentes.
   Pas de record la première fois qu’on fait un exercice. */
function findRecords(prevHist, log) {
  const out = [];
  (log || []).forEach(l => {
    if (!l || l.cool || l.warm || out.some(o => o.id === l.id)) return;
    const e = EX_BY_ID[l.id]; if (!e || NO_RECORD_GROUPS.indexOf(e.g) >= 0) return;
    const prev = exSeries(prevHist, l.id); if (!prev.length) return;
    const cur = exSeries([{ id: "_cur", date: "9999-12-31", ts: Infinity, log: (log || []).filter(x => x.id === l.id && !x.warm && !x.cool) }], l.id)[0]; if (!cur) return;
    const kind = trackKind(l.id, prev.concat([cur])), b = bestOf(prev, kind);
    if (kind === "kg") {
      if (!b) return;
      if (cur.kg > b.kg + 1e-9) out.push({ id: l.id, k: "kg", v: cur.kg, old: b.kg });
      else if (cur.rm > b.rm + 0.05) out.push({ id: l.id, k: "rm", v: cur.rm, old: b.rm });
    } else if (kind === "assist") {
      if (b && cur.as && (cur.as < 0.01 ? 0 : cur.as) < b.as - 1e-9) out.push({ id: l.id, k: "as", v: cur.as < 0.01 ? 0 : cur.as, old: b.as });
    } else if (kind === "reps") {
      if (b && cur.kg === 0 && cur.reps > b.reps) out.push({ id: l.id, k: "reps", v: cur.reps, old: b.reps });
    } else if (b && cur.d > b.d) out.push({ id: l.id, k: "d", v: cur.d, old: b.d });
  });
  return out;
}

/* Séries par muscle sur une période : 1 par série pour un muscle principal, ½ pour un muscle secondaire */
const MAJOR_MUSCLES = ["pecs", "dorsaux", "epaules_ant", "epaules_lat", "biceps", "triceps", "abdos", "quadriceps", "ischios", "fessiers", "mollets"];
function muscleSets(hist, from, to) {
  const out = {};
  (hist || []).forEach(h => {
    if (!h || h.date < from || h.date > to || !Array.isArray(h.log)) return;
    h.log.forEach(l => {
      const e = EX_BY_ID[l.id]; if (!e || l.cool || l.warm || e.g === "etirements" || e.g === "mobilite" || e.g === "cardio") return;
      const n = l.n || (l.sets || []).length;
      e.p.forEach(m => { out[m] = (out[m] || 0) + n; });
      e.s.forEach(m => { if (e.p.indexOf(m) < 0) out[m] = (out[m] || 0) + n / 2; });
    });
  });
  delete out.cardio;
  return out;
}

/* Séances par semaine sur les n dernières semaines (la dernière = semaine en cours) */
function weekCounts(hist, today, n) {
  const mon = isoMon(today), out = [];
  for (let k = n - 1; k >= 0; k--) { const a = isoAdd(mon, -7 * k), b = isoAdd(a, 6); out.push({ mon: a, n: (hist || []).filter(h => h && h.date >= a && h.date <= b).length }); }
  return out;
}
/* Semaines d’affilée avec au moins « goal » séances (la semaine en cours compte dès que l’objectif est atteint) */
function weekStreak(hist, today, goal) {
  const w = weekCounts(hist, today, 104), g = Math.max(1, goal || 1);
  let k = w.length - 1, s = 0;
  if (w[k].n >= g) s++;
  for (k--; k >= 0 && w[k].n >= g; k--) s++;
  return s;
}
/* Poids qui ne baisse plus : au moins 2 pesées sur 14 jours ou plus dans les 3 dernières semaines, et moins de 0,3 kg perdus */
function plateau(pts, today) {
  const from = isoAdd(today, -21), P = (pts || []).filter(x => x && x.poids > 0 && x.date >= from && x.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  if (P.length < 2) return false;
  const a = P[0], b = P[P.length - 1];
  if (isoAdd(a.date, 14) > b.date) return false;
  return b.poids - a.poids > -0.3;
}
