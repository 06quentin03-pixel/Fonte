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
/* S7 (phase 3D) : poids qui ne baisse plus, jugé sur des moyennes (les pesées varient d’un jour à l’autre, Orsama et al. 2014).
   Moyenne des pesées des 7 derniers jours comparée à celle de la semaine d’il y a 3 semaines (jours −27 à −21), au moins 3 pesées
   de chaque côté ; plateau si moins de 0,3 kg perdus entre les deux (même seuil qu’avant 3D).
   Renvoie { plateau, few } : few = pas assez de pesées pour juger (l’appli invite à se peser plus souvent, sans ajouter de cardio). */
function plateauInfo(pts, today) {
  const P = (pts || []).filter(x => x && x.poids > 0 && typeof x.date === "string");
  const win = (a, b) => P.filter(x => x.date >= isoAdd(today, a) && x.date <= isoAdd(today, b)).map(x => x.poids);
  const now = win(-6, 0), old = win(-27, -21), avg = l => l.reduce((s, x) => s + x, 0) / l.length;
  if (now.length < 3 || old.length < 3) return { plateau: false, few: P.some(x => x.date >= isoAdd(today, -27) && x.date <= today), now: now.length, old: old.length };
  return { plateau: avg(now) - avg(old) > -0.3, few: false, now: now.length, old: old.length, delta: Math.round((avg(now) - avg(old)) * 100) / 100 };
}
function plateau(pts, today) { return plateauInfo(pts, today).plateau; }

/* ===== S4 (phase 3D, décision 4) : passage de niveau proposé, jamais automatique =====
   Critères (plan section 9.4, docs/REGLES_SPORTIVES.md) :
   débutant → intermédiaire : (1) environ 6 mois d’entraînement (première séance il y a 182 jours ou plus) et régulier
   (au moins 16 séances sur les 8 dernières semaines terminées, soit 2 par semaine en moyenne) ; (2) progression devenue lente :
   au moins 3 exercices avec charge dont les 3 dernières séances n’ont pas monté à chaque fois ; (3) au moins 3 paliers terminés à ce niveau.
   intermédiaire → avancé : mêmes critères avec 2 ans d’entraînement et 6 paliers à ce niveau. Avancé : rien à proposer.
   p.levelAsk = { niv, until } : « Plus tard », la proposition revient après cette date.
   Renvoie null, ou { to, from, checks: [{ ok, txt }], ok } (ok = les 3 critères sont réunis : la carte s’affiche). */
const LEVEL_RULES = { debutant: { to: "intermediaire", days: 182, phases: 3 }, intermediaire: { to: "avance", days: 730, phases: 6 } };
function levelSuggest(p, hist, today) {
  p = p || {}; const rule = LEVEL_RULES[p.niveau || "debutant"]; if (!rule) return null;
  const list = (hist || []).filter(h => countable(h) && typeof h.date === "string");
  const first = list.reduce((m, h) => (h.date < m ? h.date : m), "9999-12-31");
  const since = list.length ? Math.round((new Date(today) - new Date(first)) / 864e5) : 0;
  const mon = isoMon(today), from = isoAdd(mon, -56), last8 = list.filter(h => h.date >= from && h.date < mon).length;
  const regular = since >= rule.days && last8 >= 16;
  /* progression lente : exercices avec charge, 3 dernières séances */
  const ids = {}; list.forEach(h => (h.log || []).forEach(l => { if (l && !l.warm && !l.cool && !isAssist(l.id) && (l.sets || []).some(s => s && s.kg > 0)) ids[l.id] = 1; }));
  let slow = 0, tracked = 0;
  Object.keys(ids).forEach(id => { const P = exSeries(list, id).filter(x => x.kg > 0).slice(-3); if (P.length < 3) return; tracked++; if (!(P[0].kg < P[1].kg && P[1].kg < P[2].kg)) slow++; });
  const done = (p.phases || []).filter(x => x && x.niv === (p.niveau || "debutant")).length;
  const months = Math.round(rule.days / 30.4);
  const checks = [
    { ok: regular, txt: regular ? `Tu t’entraînes depuis ${since >= 365 ? "plus d’un an" : "environ " + Math.max(1, Math.round(since / 30.4)) + " mois"}, régulièrement (${last8} séances sur les 8 dernières semaines).` : `Il faut environ ${months >= 24 ? "2 ans" : months + " mois"} d’entraînement régulier (au moins 2 séances par semaine sur les 8 dernières semaines) : ${list.length ? "ta première séance date d’il y a " + since + " jours, " + last8 + " séances sur 8 semaines" : "pas encore de séance"}.` },
    { ok: slow >= 3, txt: slow >= 3 ? `Tes charges ne montent plus à chaque séance sur ${slow} exercices : la progression « séance après séance » du débutant s’essouffle, c’est normal.` : `Tes charges montent encore souvent d’une séance à l’autre (${slow} exercice${slow > 1 ? "s" : ""} sur ${tracked} ralentissent) : continue au niveau actuel.` },
    { ok: done >= rule.phases, txt: `${done} palier${done > 1 ? "s" : ""} terminé${done > 1 ? "s" : ""} à ce niveau (${rule.phases} au moins).` }
  ];
  const ok = checks.every(c => c.ok) && !(p.levelAsk && p.levelAsk.niv === rule.to && p.levelAsk.until > today);
  return { from: p.niveau || "debutant", to: rule.to, checks, ok };
}
/* La personne accepte : niveau suivant, palier 1, charges réelles gardées (la charge proposée continue de partir de ses références).
   Le bilan garde la trace du passage (man: 1 = choisi, pas automatique). Renvoie un nouveau profil. */
function levelAccept(p, to, today) {
  const q = JSON.parse(JSON.stringify(p || {})), old = q.niveau || "debutant";
  if (!NIV_KEYS[to] || to === old) return q;
  q.phases = (q.phases || []).concat([{ n: q.phase || 1, niv: old, from: q.phaseStart || today, to: today, up: to, man: 1 }]).slice(-40);
  if (q.simple == null && (NIV_KEYS[old] || 1) === 1) q.simple = true; /* le mode simple ne disparaît pas sans prévenir */
  Object.assign(q, { niveau: to, phase: 1, phaseDone: 0, phaseStart: today });
  delete q.levelAsk;
  return q;
}
