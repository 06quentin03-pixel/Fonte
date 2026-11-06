/* ===== Fonte · interface (app.js) =====
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → engine-sync.js → app.js.
   Les déclarations de haut niveau sont partagées entre ces fichiers (comme lorsqu’ils formaient un seul index.html) :
   un fichier peut utiliser ce qu’un fichier précédent déclare. tools/assemble.js les recolle en un seul fichier (mode « artifact Claude »). */
(function () {
"use strict";
/* ===== Application =====
   Plan : Utilitaires · État (localStorage) · Silhouettes · Prescriptions · Progression (courbes, records) · Fichiers (CSV, .ics)
   · Sauvegarde (rappel) · Personnes / agenda · Synchronisation (compte Claude, Firebase) · Feuilles, toast · Rendu des onglets
   · Éditeur de séance · Lecteur de séance · Minuteur · Codes d'agenda · Actions (data-a) · Démarrage.
   Les calculs purs (progression, records, superséries, exports) sont dans le script « Base d'exercices » et testés par tests/run.js. */

/* ================= Utilitaires ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const num = v => { const n = parseFloat(String(v).replace(",", ".").replace(/\s/g, "")); return isFinite(n) ? n : 0; };
const fmtNum = n => String(Math.round(n * 100) / 100).replace(".", ",");
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + pad(s % 60); };
const fmtDur = s => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + pad(m % 60); };
const fmtRest = s => s >= 60 ? (s % 60 ? Math.floor(s / 60) + " min " + pad(s % 60) : s / 60 + " min") : s + " s";
const fmtSec = s => s >= 120 ? fmtDur(s) : s + " s";
const toISO = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const fromISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const todayISO = () => toISO(new Date());
const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const fmtDay = iso => { const d = fromISO(iso); return JOURS[d.getDay()] + " " + d.getDate() + " " + MOIS[d.getMonth()]; };
const JOURS_C = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS_C = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fmtDayShort = iso => { const d = fromISO(iso); return JOURS_C[d.getDay()] + " " + d.getDate() + " " + MOIS_C[d.getMonth()]; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const mondayOf = iso => { const d = fromISO(iso); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return toISO(d); };
const icon = (id, cls) => `<svg class="${cls || "ic"}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const plural = (n, w) => n + " " + w + (n > 1 ? "s" : "");
const TABS = ["accueil", "exercices", "seances", "agenda", "profil"];
const PWA = !!window.FONTE_PWA;
const INSTALLED = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;

/* ================= État ================= */
/* Démarrage du stockage (engine-user.js) : profil actif, migration de fonte:v1 vers le format v2 au premier lancement de la version 3B */
let S = storeOpen((() => { try { return window.localStorage; } catch (e) { return null; } })(), Date.now());
/* Stockage plein : on résume davantage l’historique ancien plutôt que de tout perdre au prochain lancement */
let quotaWarned = false;
function saveLocal() {
  if (STORE_BLOCK && STORE_BLOCK.reason === "plus-recent") return false; /* D8 : données d’une version plus récente, jamais écrasées */
  const r = storeSave(S);
  if (r.trimmed && !quotaWarned) { quotaWarned = true; setTimeout(() => toast("Stockage presque plein : le détail des séances les plus anciennes a été résumé."), 0); }
  if (!r.ok && r.quota && !quotaWarned) { quotaWarned = true; setTimeout(() => toast("Mémoire du téléphone pleine : fais une sauvegarde depuis Profil."), 0); }
  return !!r.ok;
}
function commit(kinds) {
  const now = Date.now();
  if (kinds.indexOf("p") >= 0) { S.upd = now; Sync.queue("priv"); }
  if (kinds.indexOf("a") >= 0) { S.agUpd = now; Sync.queue("ag"); if (PWA) Cloud.queue(); }
  saveLocal();
  if (PWA) Acct.queue(); /* sauvegarde en ligne du profil (3C) : partira dans 2 s, ou au retour du réseau */
}
const UI = { tab: "accueil", exG: "all", exQ: "", exMat: "", seg: "prog", tplCat: "all", calMonth: todayISO().slice(0, 7), calSel: todayISO() };
try { const u = JSON.parse(localStorage.getItem(LS_UI) || "null"); if (u) { if (u.seg) UI.seg = u.seg; } UI.hideInstall = localStorage.getItem("fonte:noinstall") === "1"; } catch (e) { }
function saveUI() { try { localStorage.setItem(LS_UI, JSON.stringify({ seg: UI.seg })); } catch (e) { } }
{ const h = (location.hash || "").slice(1); if (TABS.indexOf(h) >= 0) UI.tab = h; }

/* ================= Silhouettes ================= */
const GROUP_COLOR = { pecs: "var(--red)", dos: "var(--blue)", epaules: "var(--green)", biceps: "var(--yellow)", triceps: "var(--yellow)", avantbras: "var(--yellow)",
  abdos: "var(--violet)", quadriceps: "var(--red)", ischios: "var(--red)", fessiers: "var(--red)", mollets: "var(--red)", fullbody: "var(--ink-2)", cardio: "var(--green)", mobilite: "var(--violet)", etirements: "var(--green)" };
function figStyle(p, s) { let v = ""; (s || []).forEach(m => { v += "--m-" + m + ":var(--hl2);"; }); (p || []).forEach(m => { v += "--m-" + m + ":var(--hl);"; }); return v; }
function figHTML(p, s, size) {
  const lab = size === "md" ? ' role="img" aria-label="Vue de face"' : ' aria-hidden="true"';
  const lab2 = size === "md" ? ' role="img" aria-label="Vue de dos"' : ' aria-hidden="true"';
  return `<div class="fig fig-${size}" style="${figStyle(p, s)}"><svg viewBox="0 0 120 236"${lab}><use href="#fig-front"/></svg><svg viewBox="0 0 120 236"${lab2}><use href="#fig-back"/></svg></div>`;
}
function seanceMuscles(items) {
  const p = new Set(), s = new Set();
  items.forEach(it => { const e = EX_BY_ID[it.id]; if (!e) return; e.p.forEach(m => p.add(m)); e.s.forEach(m => s.add(m)); });
  p.forEach(m => s.delete(m)); p.delete("cardio"); s.delete("cardio");
  return [[...p], [...s]];
}
const lvlHTML = l => `<span class="lvl" title="${NIVEAUX[l]}" aria-label="Niveau ${NIVEAUX[l]}"><i class="on"></i><i class="${l >= 2 ? "on" : ""}"></i><i class="${l >= 3 ? "on" : ""}"></i></span>`;

/* ================= Prescriptions ================= */
const kgTxt = (id, kg) => isAssist(id) ? fmtNum(kg) + " kg d’assistance" : fmtNum(kg) + " kg";
function prescText(it, mode) {
  const w = it.duree > 0 ? fmtSec(it.duree) : it.reps + " reps" + (it.parCote ? " / côté" : "");
  if (mode === "circuit") return w;
  return it.series > 1 ? it.series + " × " + w.replace(" reps", "") : w;
}
function defaultItem(ex) {
  const ctx = profileCtx(S.profile);
  const iso = ["biceps", "triceps", "avantbras", "mollets", "abdos"].indexOf(ex.g) >= 0;
  const [s, r, rest] = ctx.obj[iso ? "I" : "C"];
  const it = { id: ex.id, series: Math.max(2, s - (ctx.lvl === 1 ? 1 : 0)), reps: 0, duree: 0, repos: adjRest(ctx, rest), charge: 0 };
  if (ex.t === "t") { it.duree = ex.dt || 30; if (ex.g === "cardio" && ex.dt >= 300) { it.series = 1; it.repos = 0; } if (ex.g === "mobilite" || ex.g === "etirements") { it.series = ex.pc ? 2 : 1; it.repos = 10; } }
  else it.reps = r;
  const sg = suggest(ex.id), cv = convFor(ex.id, it.reps); if (cv != null) it.charge = cv; else if (sg) it.charge = sg.next; else it.charge = estCharge(ex.id, it.reps || 12, S.profile);
  if (ECH.has(ex.id) && iso && it.series > 1) it.echec = 1;
  return it;
}
/* Conseil de progression (voir progress() : double progression, ressenti, allègement après 3 échecs) */
function suggest(id) { return progress(id, S.lastPerf[id]); }
/* Garde-fou S1-a : charge convertie quand la séance vise au moins 3 répétitions de plus ou de moins que la dernière fois (sinon null) */
function convFor(id, reps) { return reps > 0 ? convertLoad(id, S.lastPerf[id], reps, S.profile.barre) : null; }
function perfLine(id, reps) {
  const lp = S.lastPerf[id]; if (!lp || !lp.sets || !lp.sets.length) return "";
  const kg = Math.max.apply(null, lp.sets.map(s => s.kg || 0));
  const sg = suggest(id), cv = convFor(id, reps);
  let t = "Dernière fois : " + lp.sets.map(s => s.r).join("-") + " reps" + (kg || isAssist(id) ? " à " + kgTxt(id, kg) : "");
  if (cv != null) return t + " → pour " + reps + " reps, charge recalculée : " + kgTxt(id, cv) + " (estimation prudente)";
  if (sg) t += {
    up: sg.up ? " → essaie " + kgTxt(id, sg.next) + (sg.reps ? " × " + sg.reps : "") : "",
    up2: " → c’était facile : essaie " + kgTxt(id, sg.next),
    reps: " → garde " + kgTxt(id, sg.last) + " et vise " + sg.reps + " reps avant d’augmenter",
    limit: " → réussi sans aucune réserve : garde la même charge",
    hold: lp.fails ? " → garde la même charge" : "",
    hard: " → séance très dure : garde la même charge",
    deload: " → 3 séances ratées de suite : allège à " + kgTxt(id, sg.next) + " pour repartir"
  }[sg.why] || "";
  return t;
}
/* Charge proposée : la progression de la dernière séance (sauf si la séance a été modifiée depuis),
   sinon celle déjà réglée, sinon l’estimation d’après le profil. Double progression : répétitions visées. */
function applySuggestions(se) {
  se.items.forEach(it => {
    const lp = S.lastPerf[it.id], sg = suggest(it.id);
    if (sg && (!it.charge || (lp.ts || 0) > (se.upd || 0))) {
      const cv = it.duree ? null : convFor(it.id, it.reps);
      if (cv != null) { it.charge = cv; return; } /* S1-a : autre nombre de répétitions → charge convertie, pas augmentée */
      it.charge = sg.next;
      if (sg.reps && it.reps && !it.duree && (lp.base || lp.target) === (it.base || it.reps)) { it.base = it.base || it.reps; it.reps = sg.reps; }
    } else if (!it.charge) { const e = estCharge(it.id, it.reps || 12, S.profile); if (e) it.charge = e; }
  });
  if (deloadActive() && !se.dl) { deloadSe(se); se.dl = 1; se.notes = (se.notes || []).concat(["Semaine allégée : moins de séries, charges à 85 %"]); }
  else if (repriseActive() && !se.dl && !se.rp) { scaleCharges(se, 0.9); se.rp = 1; se.notes = (se.notes || []).concat(["Séance de reprise après une pause : charges à 90 % pour repartir en douceur"]); }
  return se;
}
function animHTML(id) {
  if (!ANIM.has(id)) return "";
  return `<div class="card anim-card"><div class="anim" data-ex="${id}" data-a="anim-replay" role="img" aria-label="Animation du mouvement, touche pour la revoir"><svg aria-hidden="true"><g></g></svg></div><div class="anim-prog" aria-hidden="true"><b></b></div><div class="anim-bar"><div class="anim-info"><span class="anim-lab" aria-live="polite"></span><span class="anim-cap"></span></div><button class="btn btn-ghost anim-replay" data-a="anim-replay">${icon("refresh")}Revoir</button></div></div>`;
}
const animMini = (id, cls) => `<div class="anim anim-mini ${cls || ""}" data-ex="${id}" data-a="anim-replay" role="img" aria-label="Animation du mouvement, touche pour la revoir"><svg aria-hidden="true"><g></g></svg></div>`;
function loadNote(e) {
  if (!LOAD[e.id]) return "";
  const p = S.profile;
  if (!p.poids) return `<div class="note">${icon("dumbbell")}<span>Renseigne ton poids et ta taille dans ton profil pour avoir une charge de départ conseillée. <button style="color:var(--accent);font-weight:600" data-a="tab" data-t="profil">Mon profil</button></span></div>`;
  const it = defaultItem(e), reps = it.reps || 12, kg = estCharge(e.id, reps, p), L = LOAD[e.id];
  const who = "d’après ton poids" + (p.taille ? ", ta taille" : "") + (p.sexe ? ", ton sexe" : "") + " et ton niveau";
  let t;
  if (L[0] === "a") t = `Assistance conseillée pour débuter : <b>${fmtNum(kg)} kg</b> de contrepoids pour ${reps} répétitions, ${who}. Diminue-la quand tu réussis toutes tes séries.`;
  else if (!kg) t = `Commence au poids du corps, sans haltères. Ajoutes-en quand ${reps} répétitions deviennent faciles.`;
  else t = `Charge de départ conseillée : <b>${fmtNum(kg)} kg${L[0] === "d" ? ((L[2] || "").indexOf("S") >= 0 ? "" : " par haltère") : ""}</b>${L[0] === "x" ? "" : " pour " + reps + " répétitions"}, ${who}. Ajuste dès la première série : il doit te rester 2 ou 3 répétitions en réserve.${L[0] === "m" || L[0] === "c" ? " Les machines et les poulies varient d’une salle à l’autre." : ""}`;
  return `<div class="note">${icon("dumbbell")}<span>${t}</span></div>`;
}
/* Séance lancée depuis le programme : jour j et clé du programme actuel, pour proposer ensuite la suivante */
function progOpts(j) { if (j == null || j === "" || isNaN(+j)) return {}; return { pj: +j, pk: progKey(programme(S.profile)) }; }
function refInfo(ref) {
  if (!ref) return null;
  if (ref.k === "t" && TPL_BY_ID[ref.id]) return { nom: TPL_BY_ID[ref.id].n, se: () => applySuggestions(prescribe(TPL_BY_ID[ref.id], profFor(S.profile, ref.o))), opts: Object.assign({ tplId: ref.id }, progOpts(ref.j)) };
  if (ref.k === "p") { const m = S.mesSeances.find(x => x.id === ref.id); if (m) return { nom: m.nom, se: () => applySuggestions(clone(m)), opts: { srcId: m.id } }; }
  return null;
}

const objNames = p => objList(p).map(k => OBJECTIFS[k].n);
/* ================= Programme : prochaine séance ================= */
/* Clé du programme : change quand le programme change (objectifs, jours, niveau…) */
function progKey(pr) { return pr.ids.map((id, i) => id + ":" + pr.objs[i]).join(","); }
/* Place dans le programme de la dernière séance du programme faite (null : aucune).
   La séance la plus récente lancée depuis une séance type compte même si elle n’a pas été lancée depuis le programme
   (Séances types, « Refaire cette séance », agenda ajouté à la main) ou si le programme a changé depuis (jours, objectif, niveau) :
   si sa séance type (ou sa variante de semaine B) est dans le programme, la suite part de là. Sinon, comme avant :
   la dernière séance lancée depuis ce programme. (Correction après 3B : le squat fait depuis les séances types était reproposé.) */
function lastProgDone(pr, key) {
  const n = pr.ids.length;
  const h = S.historique.find(x => x && ((x.pk && x.pj != null) || (x.ref && x.ref.k === "t")));
  if (h) {
    if (h.pk === key && h.pj != null && h.pj < n) return h.pj;
    const tid = h.ref && h.ref.k === "t" ? h.ref.id : null;
    if (tid) {
      const idx = pr.ids.map((id, i) => (id === tid || weekVariant(id, h.date) === tid ? i : -1)).filter(i => i >= 0);
      if (idx.length) return idx.indexOf(h.pj) >= 0 ? h.pj : idx[0];
    }
  }
  const last = S.historique.find(x => x.pk === key && x.pj != null && x.pj < n);
  return last ? last.pj : null;
}
/* Prochaine séance du programme : celle qui suit la dernière faite (UI.progSkip pour en proposer une autre) */
function nextProg() {
  const pr = programme(S.profile), key = progKey(pr), n = pr.ids.length;
  const last = lastProgDone(pr, key);
  const j = ((last != null ? last + 1 : 0) + (UI.progSkip || 0)) % n;
  const t = TPL_BY_ID[weekVariant(pr.ids[j], todayISO())], o = pr.objs[j], se = prescribe(t, profFor(S.profile, o));
  return { pr, key, j, n, t, o, se, done: S.historique.filter(h => h.pk === key && h.pj != null).length };
}
/* ================= Mode simple et mots expliqués ================= */
/* Mode simple : activé d’office pour un débutant (moins de chiffres, options avancées masquées), réglable dans le profil */
const simple = () => S.profile.simple != null ? !!S.profile.simple : (NIV_KEYS[S.profile.niveau] || 1) === 1;
const GLOSS = {
  serie: ["Série", "Un groupe de mouvements faits d’affilée, sans pause. « 3 × 10 » veut dire 3 séries de 10 mouvements, avec une pause entre chaque série."],
  rep: ["Répétition", "Un mouvement complet : par exemple descendre puis remonter une fois au squat."],
  repos: ["Repos", "La pause entre deux séries. Pendant la séance, le minuteur la compte pour toi et sonne à la fin."],
  charge: ["Charge", "Le poids que tu soulèves : barre, haltères ou machine. Fonte la calcule d’après ton poids et ton niveau, puis l’augmente quand tu progresses. Avec des haltères, c’est le poids de chaque haltère."],
  echec: ["Jusqu’à l’échec", "Sur la dernière série, tu continues jusqu’à ne plus réussir un mouvement propre. Seulement sur des exercices sans danger : machines, poulies, poids du corps."],
  base: ["Exercices de base et d’isolation", "Un exercice de base fait travailler plusieurs muscles à la fois (squat, développé couché) : plus lourd, avec plus de repos. Un exercice d’isolation cible un seul muscle (curl pour les biceps) : plus léger."],
  superset: ["Supersérie", "Deux exercices enchaînés sans pause entre eux, puis la pause habituelle."],
  reserve: ["Répétitions en réserve", "À la fin d’une série, le nombre de mouvements que tu aurais encore pu faire. 2 ou 3, c’est l’idéal. Ça aide Fonte à régler la charge de la séance suivante."],
  echauf: ["Échauffement", "Quelques minutes de cardio doux et de mouvements pour préparer les muscles de la séance. Ça évite les blessures."],
  etir: ["Étirements", "En fin de séance, quelques positions tenues calmement pour détendre les muscles travaillés."],
  allege: ["Semaine allégée", "Après plusieurs semaines d’entraînement, une semaine plus légère (moins de séries, charges à 85 %) pour laisser le corps récupérer. On repart ensuite plus fort."],
  rm: ["1RM", "Le poids maximum que tu pourrais soulever une seule fois. Fonte l’estime à partir de tes séries, sans que tu aies à le tester."]
};
const gl = k => `<button class="gl" data-a="gloss" data-k="${k}" aria-label="C’est quoi, ${esc(GLOSS[k][0].toLowerCase())} ?">?</button>`;
const readHelp = () => `<div class="note note-help">${icon("info")}<span><b>Comment lire :</b> « 3 séries de 10 » = 10 mouvements d’affilée, une pause, et on recommence 3 fois. Le poids est celui que Fonte te conseille, la pause est indiquée en dessous. <button class="link-in" data-a="gloss">Tous les mots expliqués</button></span></div>`;
function openGloss(k) {
  const keys = Object.keys(GLOSS), order = GLOSS[k] ? [k].concat(keys.filter(x => x !== k)) : keys;
  Sheet.open({ key: "gloss", title: GLOSS[k] ? GLOSS[k][0] : "Les mots de la muscu", body: `<div class="list">${order.map((x, i) => `<div class="row" style="align-items:flex-start"><div class="row-main"><div class="row-title">${esc(GLOSS[x][0])}</div><div class="row-sub" style="white-space:normal">${esc(GLOSS[x][1])}</div></div></div>${i === 0 && GLOSS[k] ? `<div class="grp-title" style="margin:8px 0 0">Les autres mots</div>` : ""}`).join("")}</div>` });
}

/* ================= Programme sur mesure et planning ================= */
const JOURS_L = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const dayShort = d => JOURS_C[(d + 1) % 7].slice(0, 3);
const PLAN_DAYS = 28; /* l’agenda est rempli un mois à l’avance */
/* Séances du programme, chacune réglée sur son objectif, avec les charges conseillées (poids, historique) et son jour de la semaine */
function progSessions() {
  const p = S.profile, pr = programme(p), days = planDays(p);
  return pr.ids.map((id, j) => {
    id = weekVariant(id, todayISO());
    const t = TPL_BY_ID[id], o = pr.objs[j], se = applySuggestions(prescribe(t, profFor(p, o)));
    return { j, id, t, o, se, day: days[j], d: estDuree(se) };
  });
}
/* Séances du programme prévues dans l’agenda (non faites), à partir d’une date */
const isProgEv = e => !!(e && e.ref && e.ref.k === "t" && e.ref.j != null);
const progEvents = from => S.agenda.filter(e => !e.fait && e.date >= from && isProgEv(e));
function progEvent(pr, j, date, heure, multi) { const id = weekVariant(pr.ids[j], date); return { id: rid(), date, heure: heure || "", titre: TPL_BY_ID[id].n, note: multi ? OBJECTIFS[pr.objs[j]].n : "", fait: false, ref: { k: "t", id, o: pr.objs[j], j } }; }
/* Mois glissant : complète l’agenda avec les séances du programme jusqu’à 4 semaines devant */
function autoPlan() {
  const p = S.profile; if (!p.autoPlan) return 0;
  const pr = programme(p), multi = objList(p).length > 1, add = fillPlan(p, S.agenda, todayISO(), PLAN_DAYS);
  add.forEach(x => S.agenda.push(progEvent(pr, x.j, x.date, p.planHeure, multi)));
  if (add.length) commit("a");
  return add.length;
}
/* Replanifie le mois : les séances du programme à venir (non faites) sont remplacées par le planning actuel */
function replan() {
  const today = todayISO();
  S.agenda = S.agenda.filter(e => !(!e.fait && e.date >= today && isProgEv(e)));
  S.profile.autoPlan = true; S.profile.planKey = progKey(programme(S.profile));
  const n = autoPlan(); requeue(); commit("pa");
  return n;
}
/* Le programme a changé (objectif, niveau, jours, nouvelle version de l’appli…) : l’agenda programmé suit */
function syncPlan() {
  const p = S.profile; if (!p.autoPlan) return false;
  const k = progKey(programme(p)); if (p.planKey === k) return false;
  replan(); return true;
}
/* Séances prévues non faites des 14 derniers jours */
function missedEvents() {
  const t = todayISO(), from = addDays(t, -14);
  return S.agenda.filter(e => !e.fait && e.date < t && e.date >= from && refInfo(e.ref) && !(S.profile.autoPlan && isProgEv(e))).sort((a, b) => a.date.localeCompare(b.date));
}
const moveTarget = e => nextFreeDay(S.agenda, addDays(e.date, 1) > todayISO() ? addDays(e.date, 1) : todayISO(), e.id);
const dayName = d => d === todayISO() ? "aujourd’hui" : d === addDays(todayISO(), 1) ? "demain" : fmtDayShort(d);
function missedCard() {
  const m = missedEvents(); if (!m.length) return "";
  const e = m[0], to = moveTarget(e);
  return `<section><div class="card miss" style="display:flex;flex-direction:column;gap:10px"><div class="row-main"><div class="h3">Séance manquée</div><p class="small muted">« ${esc(e.titre)} » était prévue ${fmtDay(e.date)}. Un empêchement, ça arrive : reporte-la, tout simplement.${m.length > 1 ? " Encore " + plural(m.length - 1, "autre séance") + " à reporter ensuite." : ""}</p></div><div class="btn-row"><button class="btn btn-primary" data-a="ev-move" data-id="${esc(e.id)}">${icon("cal")}Reporter ${esc(dayName(to))}</button><button class="btn" data-a="ev-skip" data-id="${esc(e.id)}">Laisser tomber</button></div></div></section>`;
}
function progTags(p) {
  const t = objNames(p).map((n, i) => `<span class="tag ${i ? "" : "tag-p"}">${esc(n)}</span>`);
  if (p.poids) t.push(`<span class="tag">${fmtNum(p.poids)} kg</span>`);
  if (p.taille) t.push(`<span class="tag">${p.taille} cm</span>`);
  zoneList(p).forEach(z => t.push(`<span class="tag tag-p">Priorité ${esc(ZONES[z][0].toLowerCase())}</span>`));
  t.push(`<span class="tag">${NIVEAUX[NIV_KEYS[p.niveau] || 1]}</span>`, `<span class="tag">${plural(planDays(p).length, "séance")} / semaine</span>`);
  return `<div class="tags">${t.join("")}</div>`;
}
/* Résumé en une phrase, sans jargon */
function progSummary(p) {
  const n = planDays(p).length, o = objNames(p).map(x => x.toLowerCase());
  return `${plural(n, "séance")} par semaine pour ${o.length > 1 ? o.slice(0, -1).join(", ") + " et " + o[o.length - 1] : o[0]}. ${p.poids ? "Les poids à soulever sont calculés pour tes " + fmtNum(p.poids) + " kg et augmentent quand tu progresses." : "Ajoute ton poids dans ton profil pour avoir les poids à soulever."} Chaque séance commence par un échauffement et finit par des étirements.`;
}
/* Le détail de ce qui est réglé, objectif par objectif */
function progWhy(p, ss) {
  const b = [], seen = {};
  ss.forEach(x => {
    if (seen[x.o]) return; seen[x.o] = 1;
    const ctx = profileCtx(profFor(p, x.o)), o = ctx.obj, L = ctx.lvl;
    const sc = Math.max(2, o.C[0] + (L === 1 ? -1 : 0) + (L === 3 ? 1 : 0)), si = Math.max(2, o.I[0] + (L === 1 ? -1 : 0));
    b.push(`« ${o.n} » : ${sc} séries de ${o.C[1]} mouvements sur les gros exercices (pause de ${fmtRest(adjRest(ctx, o.C[2]))}), ${si} séries de ${o.I[1]} sur les petits (pause de ${fmtRest(adjRest(ctx, o.I[2]))}), ${Math.round(o.cardio * [0, 0.7, 1, 1.25][L])} min de cardio quand la séance en prévoit.`);
  });
  if (p.poids) {
    const hist = ss.some(x => x.se.items.some(it => suggest(it.id)));
    const ex = []; ss.forEach(x => x.se.items.forEach(it => { if (it.charge > 0 && LOAD[it.id] && ex.length < 3 && !ex.some(e => e[0] === it.id)) ex.push([it.id, it.charge]); }));
    b.push(`Poids calculés pour tes ${fmtNum(p.poids)} kg${p.taille ? " et ton " + p.taille + " cm" : ""}${hist ? ", puis ajustés d’après tes dernières séances" : ""}${ex.length ? " (par exemple " + ex.map(([id, kg]) => EX_BY_ID[id].n.replace(/ \(.*\)$/, "").toLowerCase() + " " + kgTxt(id, kg)).join(", ") + ")" : ""}. Tu peux toujours les changer.`);
  }
  if (objList(p)[0] === "force") b.push("Objectif force : chaque séance est construite autour d’un grand mouvement (squat, développé couché, soulevé de terre, développé militaire) en séries lourdes et courtes, puis des exercices qui le renforcent.");
  b.push("Semaines A et B : une semaine sur deux, tes séances passent à leur variante (mêmes muscles, autres exercices). Les grands mouvements restent pour suivre tes progrès.");
  if (zoneList(p).length) b.push("Zone prioritaire (" + zoneList(p).map(z => ZONES[z][0].toLowerCase()).join(", ") + ") : un exercice en plus pour cette zone dans tes séances de musculation.");
  if ((NIV_KEYS[p.niveau] || 1) === 1) b.push("Débutant : les mouvements à la barre se font d’abord aux haltères pour apprendre le geste ; la barre arrive au palier 3.");
  if (ss.length > 1) b.push("Jamais deux fois la même séance dans la semaine : quand un groupe de muscles revient, c’est avec une variante et d’autres exercices.");
  if ((NIV_KEYS[p.niveau] || 1) === 1) b.push("Débutant : 5 exercices au plus par séance, une série de moins, et les mouvements difficiles remplacés par des versions plus simples.");
  return b;
}
function weekStrip(p) {
  const w = weekPlan(p), today = (fromISO(todayISO()).getDay() + 6) % 7;
  return `<div class="week">${w.map((j, d) => `<button class="wday pday ${j >= 0 ? "on" : ""} ${d === today ? "today" : ""}" data-a="plan-day" data-d="${d}" aria-pressed="${j >= 0}" aria-label="${JOURS_L[d]} : ${j >= 0 ? "entraînement" : "repos"}"><small>${"LMMJVSD"[d]}</small><b>${j >= 0 ? icon("dumbbell") : "–"}</b></button>`).join("")}</div>`;
}
/* Les 7 prochains jours à partir d’aujourd’hui : les séances du programme dans l’ordre (à partir de la prochaine) sur les jours
   d’entraînement, comme dans l’agenda. Aujourd’hui ne compte pas si une séance y est déjà faite. */
function upcomingWeek(p, nx) {
  const w = weekPlan(p), t = todayISO(), pr = nx.pr, n = pr.ids.length, rows = [];
  const doneToday = S.historique.find(h => h.date === t);
  let c = 0;
  for (let k = 0; k < 7; k++) {
    const date = addDays(t, k), d = (fromISO(date).getDay() + 6) % 7, r = { k, d, date };
    if (k === 0 && doneToday) r.done = doneToday.nom;
    else if (w[d] >= 0 && n) {
      const j = (nx.j + c) % n, id = weekVariant(pr.ids[j], date), o = pr.objs[j], se = applySuggestions(prescribe(TPL_BY_ID[id], profFor(p, o)));
      r.x = { j, id, t: TPL_BY_ID[id], o, d: estDuree(se) }; r.first = c === 0; c++;
    }
    rows.push(r);
  }
  return rows;
}
/* Séances › Mon programme : pour qui, la semaine (choix des jours), l’agenda, le détail de chaque séance */
function viewProgramme() {
  const p = S.profile, ss = progSessions(), w = weekPlan(p), nx = nextProg(), sim = simple();
  let h = "";
  if (!p.sexe || !p.age || !p.taille || !p.poids) h += `<section><div class="note">${icon("sparkle")}<span>Complète ton profil (sexe, âge, taille, poids) pour un programme vraiment calé sur toi. <button class="link-in" data-a="tab" data-t="profil">Mon profil</button></span></div></section>`;
  h += progressCard() + bodyCard();
  h += `<section><div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="h3">Fait pour toi</div>${progTags(p)}<p class="small">${esc(progSummary(p))}</p><details class="fold-in"><summary>En savoir plus</summary><ul class="bullets">${progWhy(p, ss).map(x => `<li>${esc(x)}</li>`).join("")}</ul></details><button class="btn" data-a="tab" data-t="profil">${icon("edit")}Changer d’objectif ou de poids</button></div></section>`;
  h += `<section><div class="sec-h"><h2>Ma semaine</h2><span class="small muted">Semaine ${weekB(todayISO()) ? "B" : "A"} · ${plural(ss.length, "séance")}</span></div><div class="card" style="display:flex;flex-direction:column;gap:12px">
    <p class="small muted">Touche un jour pour t’y entraîner ou te reposer. Le programme s’adapte au nombre de jours.${ss.length >= 2 ? "" : " Conseil : 2 ou 3 jours par semaine, c’est idéal pour progresser."}</p>${weekStrip(p)}
    <p class="small muted">Tes 7 prochains jours. Les séances se font dans l’ordre : une séance manquée passe au jour d’entraînement suivant.</p>
    <div class="prog">${upcomingWeek(p, nx).map(r => { const lab = r.k === 0 ? "auj." : dayShort(r.d), rest = `<div class="prog-day" style="opacity:.55"><span class="num">${lab}</span><div class="row-main"><div class="row-title">${r.done ? "Séance faite" : "Repos"}</div>${r.done ? `<div class="row-sub">${esc(r.done)}</div>` : ""}</div></div>`; if (!r.x) return rest; const x = r.x, wk = weekB(r.date) !== weekB(todayISO()) ? " · semaine " + (weekB(r.date) ? "B" : "A") : ""; return `<button class="prog-day" data-a="tpl-open" data-id="${x.id}" data-o="${x.o}" data-j="${x.j}"><span class="num">${lab}</span><div class="row-main"><div class="row-title">${esc(x.t.n)}${r.first ? ` <span class="tag tag-p" style="vertical-align:1px">Prochaine</span>` : ""}</div><div class="row-sub">${esc(OBJECTIFS[x.o].n)} · ≈ ${fmtDur(x.d)}${wk}</div></div>${icon("chev", "ic chev")}</button>`; }).join("")}</div>
  </div></section>`;
  const fut = progEvents(todayISO());
  h += `<section><div class="sec-h"><h2>Dans l’agenda</h2></div><div class="card" style="display:flex;flex-direction:column;gap:12px">
    ${p.autoPlan ? `<div class="status ok"><i></i><span>Tes séances sont programmées un mois à l’avance, et la suite s’ajoute toute seule.</span></div>` : `<p class="small">Mets ton programme dans l’agenda : Fonte prévoit tes séances un mois à l’avance aux jours choisis, puis ajoute la suite au fur et à mesure.</p>`}
    <div class="field"><label for="pl-heure">Heure habituelle</label><input class="inp" type="time" id="pl-heure" value="${esc(p.planHeure || "18:30")}"></div>
    ${p.autoPlan ? `<button class="btn" data-a="plan-month">${icon("cal")}Voir mes séances programmées (${fut.length})</button><button class="switch" role="switch" data-a="pl-auto" aria-checked="true"><span><b>Programmer automatiquement</b><br><span class="small muted">Désactive pour gérer ton agenda toi-même.</span></span><span class="sw"></span></button>` : `<button class="btn btn-primary btn-lg" data-a="pp-save">${icon("cal")}Planifier mon mois</button>`}
    <p class="small muted">Un empêchement ? Touche la séance dans l’agenda, puis « Reporter ».</p>
  </div></section>`;
  h += `<section><div class="sec-h"><h2>Détail des séances</h2></div>${sim ? readHelp() : chargeNote({ items: [].concat.apply([], ss.map(x => x.se.items)) })}`;
  ss.forEach(x => { const [mp, ms] = seanceMuscles(x.se.items); h += `<details class="card prog-det"${x.j === nx.j ? " open" : ""}><summary class="tpl" style="padding:0;border:0">${figHTML(mp, ms, "sm")}<div class="tpl-main"><div class="tpl-name">${JOURS_L[x.day]} · ${esc(x.t.n)}</div><div class="tpl-desc">${esc(OBJECTIFS[x.o].n)}</div><div class="meta"><span>${icon("clock")}${fmtDur(x.d)}</span><span>${x.se.items.length} exos</span><span>${icon("flame")}${estKcal(x.se, p, x.d)} kcal</span></div></div></summary><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">${(x.se.notes || []).length && !sim ? `<div class="note">${icon("sparkle")}<span>${x.se.notes.map(esc).join(" · ")}.</span></div>` : ""}${itemRows(x.se)}<div class="btn-row"><button class="btn" data-a="tpl-open" data-id="${x.id}" data-o="${x.o}" data-j="${x.j}">Voir tout</button><button class="btn btn-primary" data-a="tpl-start" data-id="${x.id}" data-o="${x.o}" data-j="${x.j}">${icon("play")}Lancer</button></div></div></details>`; });
  h += `</section>`;
  return h;
}
/* Séances programmées sur un mois, groupées par semaine */
function openPlanMonth() {
  const t = todayISO(), until = addDays(t, PLAN_DAYS - 1), me = people()[0], m = missedEvents();
  const evs = S.agenda.filter(e => e.date >= t && e.date <= until).sort((a, b) => a.date === b.date ? byTime(a, b) : a.date.localeCompare(b.date));
  const mon0 = mondayOf(t), groups = {};
  evs.forEach(e => { const k = mondayOf(e.date); (groups[k] = groups[k] || []).push(e); });
  const wkName = k => k === mon0 ? "Cette semaine" : k === addDays(mon0, 7) ? "Semaine prochaine" : "Semaine du " + fromISO(k).getDate() + " " + MOIS[fromISO(k).getMonth()];
  let body = "";
  if (m.length) body += `<div class="note">${icon("clock")}<span>${plural(m.length, "séance manquée")} : ${m.map(e => esc(e.titre) + " (" + fmtDayShort(e.date) + ")").join(", ")}. Touche-la pour la reporter.</span></div><div class="list">${m.map(e => evRow(e, me, true)).join("")}</div>`;
  body += S.profile.autoPlan ? `<p class="small muted">Ton programme est ajouté automatiquement un mois à l’avance. Un empêchement ? Touche la séance, puis « Reporter ».</p>` : `<div class="card" style="display:flex;flex-direction:column;gap:10px"><p class="small">Ton programme n’est pas encore dans l’agenda. Fonte peut prévoir tes séances un mois à l’avance, aux jours que tu as choisis.</p><button class="btn btn-primary" data-a="pp-save">${icon("cal")}Planifier mon mois</button></div>`;
  if (!evs.length) body += `<div class="card empty"><p>Aucune séance prévue dans les 4 prochaines semaines.</p></div>`;
  Object.keys(groups).sort().forEach(k => { body += `<div class="grp-title" style="margin:0">${wkName(k)} <span class="muted" style="font-weight:500">· ${plural(groups[k].length, "séance")}</span></div><div class="list">${groups[k].map(e => evRow(e, me, true)).join("")}</div>`; });
  const fut = S.agenda.filter(e => e.date >= t && !e.fait).length;
  Sheet.open({ key: "pm", title: "Programmé", tall: true, body, foot: fut ? `<button class="btn btn-lg" data-a="ics-all">${icon("cal")}Calendrier du téléphone</button>` : "" });
}

/* ================= Progression : paliers, niveau, bilans ================= */
/* countable (séance qui compte pour le palier) et tickApply : dans engine-training.js (utilisés aussi par le recalcul D3) */
/* Applique une séance de plus au profil : palier, niveau ; garde l’historique des paliers pour les bilans */
function applyTick(r, date) { tickApply(S.profile, r, date); }
/* Première ouverture de cette version : les séances déjà faites comptent */
function initProgress() {
  const p = S.profile; if (p.phase != null) return;
  const hist = S.historique.filter(countable).slice().reverse();
  Object.assign(p, { phase: 1, phaseDone: 0, phaseStart: hist.length ? hist[0].date : todayISO(), phases: [] });
  let up = false;
  hist.forEach(h => { const r = progressTick(p); if (r.levelUp) up = true; applyTick(r, h.date); });
  if (up) p.bilanNew = (p.phases || []).length - 1;
  commit("p");
}
/* D3 : une séance supprimée de l’historique. Les références des exercices de cette séance et le palier reviennent à ce qu’ils
   seraient sans elle (rebuildRefs, rebuildProgress : engine-training.js). Les autres exercices ne sont pas touchés. */
function afterHistDelete(gone) {
  const ids = (gone.log || []).map(l => l && l.id).filter(Boolean);
  if (ids.length) {
    const rb = rebuildRefs(S.historique, S.legacyRefs, S.legacySrc);
    ids.forEach(id => { if (rb.lastPerf[id]) S.lastPerf[id] = rb.lastPerf[id]; else delete S.lastPerf[id]; if (rb.refs[id]) S.refs[id] = rb.refs[id]; else delete S.refs[id]; });
  }
  if (countable(gone)) S.profile = rebuildProgress(S.historique, S.profile, gone);
}
/* Séance enregistrée : avance d’une séance ; renvoie vrai si un palier vient d’être terminé */
function tickProgress() {
  const r = progressTick(S.profile); applyTick(r, todayISO());
  if (r.phaseUp) S.profile.bilanNew = S.profile.phases.length - 1;
  return r;
}
function progressCard(home) {
  const p = S.profile, per = phasePer(p), done = Math.min(per, p.phaseDone || 0), ph = p.phase || 1, L = NIV_KEYS[p.niveau] || 1, left = per - done;
  const nextLvl = LEVEL_UP_PHASES[L] ? LEVEL_UP_PHASES[L] - ph + 1 : 0;
  const bar = `<div class="pbar-l" role="img" aria-label="${done} séances sur ${per}"><b style="width:${Math.round(done / per * 100)}%"></b></div>`;
  if (home) return `<button class="card ph-mini" data-a="seg" data-v="prog"><div class="row-main"><div class="row-title">Palier ${ph} · ${esc(phaseName(ph))}</div>${bar}<div class="row-sub">${done} séance${done > 1 ? "s" : ""} sur ${per} · niveau ${NIVEAUX[L].toLowerCase()}</div></div>${icon("chev", "ic chev")}</button>`;
  const nx = phaseChanges(ph + 1, p.objectif)[0];
  return `<section><div class="sec-h"><h2>Ma progression</h2><span class="tag tag-p">${NIVEAUX[L]}</span></div><div class="card" style="display:flex;flex-direction:column;gap:10px">
    <div class="h3">Palier ${ph} · ${esc(phaseName(ph))}</div>${bar}
    <p class="small">${done} séance${done > 1 ? "s" : ""} sur ${per} faite${done > 1 ? "s" : ""}. ${nextLvl === 1 && L < 3 ? `Encore ${plural(left, "séance")} et tu passes <b>au niveau ${NIVEAUX[L + 1].toLowerCase()}</b>.` : `Encore ${plural(left, "séance")} avant le palier ${ph + 1} : ${esc(nx.charAt(0).toLowerCase() + nx.slice(1))}`}</p>
    <details class="fold-in"><summary>Comment ça marche</summary><ul class="bullets"><li>Un palier, c’est 4 semaines de séances (${per} séances pour toi). Seules les séances faites comptent : si tu fais une pause, le palier t’attend.</li><li>À chaque palier, le programme évolue : une série de plus, puis des exercices plus durs, puis plus lourd. Les poids, eux, augmentent séance après séance.</li>${L < 3 ? `<li>Après ${plural(LEVEL_UP_PHASES[L], "palier")} au niveau ${NIVEAUX[L].toLowerCase()} (environ ${LEVEL_UP_PHASES[L] * PHASE_WEEKS / 4} mois), tu passes automatiquement au niveau ${NIVEAUX[L + 1].toLowerCase()}${nextLvl > 1 ? ", dans " + plural(nextLvl, "palier") : ""}.</li>` : ""}<li>À la fin de chaque palier, un bilan te montre tes progrès.</li></ul></details>
    ${(p.phases || []).length ? `<button class="btn" data-a="bilan-open">${icon("trophy")}Mes bilans (${p.phases.length})</button>` : ""}
  </div></section>`;
}
/* Meilleure série (kg, puis répétitions) de chaque exercice au début et à la fin d’une période */
function gainsIn(from, to) {
  const first = {}, last = {};
  S.historique.filter(h => h.date >= from && h.date <= to && Array.isArray(h.log)).slice().reverse().forEach(h => h.log.forEach(l => {
    if (l.warm || l.cool || !EX_BY_ID[l.id] || !(l.sets || []).length) return;
    const kg = Math.max.apply(null, l.sets.map(x => x.kg || 0)), r = Math.max.apply(null, l.sets.map(x => x.r || 0));
    if (!kg && !r) return; const v = { kg, r }; if (!first[l.id]) first[l.id] = v; last[l.id] = v;
  }));
  return Object.keys(first).map(id => { const a = first[id], b = last[id]; return { id, a, b, g: a.kg && !isAssist(id) ? (b.kg - a.kg) / a.kg : (b.r - a.r) / Math.max(1, a.r) }; }).filter(x => x.g > 0).sort((x, y) => y.g - x.g).slice(0, 5);
}
function openBilan(idx) {
  const p = S.profile, list = p.phases || [];
  if (idx == null || !list[idx]) idx = list.length - 1;
  const b = list[idx]; if (!b) return;
  if (p.bilanNew != null) { delete p.bilanNew; commit("p"); }
  const after = h => idx > 0 ? h.date > b.from : h.date >= b.from; /* la séance qui termine un palier appartient à ce palier */
  const hs = S.historique.filter(h => countable(h) && after(h) && h.date <= b.to);
  const mins = Math.round(hs.reduce((a, h) => a + (h.duree || 0), 0) / 60), recs = hs.reduce((a, h) => a + (h.pr || []).length, 0);
  const g = gainsIn(idx > 0 ? addDays(b.from, 1) : b.from, b.to);
  const pts = mesPts("poids"), w0 = pts.filter(x => x.date <= b.from).pop() || pts.find(x => x.date <= b.to), w1 = pts.filter(x => x.date <= b.to).pop();
  const tp = mesPts("tour"), t0 = tp.filter(x => x.date <= b.from).pop() || tp.find(x => x.date <= b.to), t1 = tp.filter(x => x.date <= b.to).pop();
  const last = idx === list.length - 1, nxtN = last ? p.phase : (list[idx + 1] || {}).n;
  const body = `${b.up ? `<div class="card card-accent" style="display:flex;flex-direction:column;gap:6px"><div class="eyebrow" style="color:inherit;opacity:.85">Nouveau niveau</div><div class="hero-t" style="margin:0">Niveau ${esc(NIVEAUX[NIV_KEYS[b.up]])}</div><p class="small">Après ${plural(b.n, "palier")} réguliers, ton programme passe au niveau au-dessus : séances plus complètes, plus d’exercices, et tu repars au palier 1 de ce niveau.</p></div>` : ""}
    <div class="eyebrow">Du ${fmtDayShort(b.from)} au ${fmtDayShort(b.to)} · niveau ${esc(NIVEAUX[NIV_KEYS[b.niv] || 1].toLowerCase())}</div>
    <div class="sum"><div class="stat"><b>${hs.length}</b><span>séances</span></div><div class="stat"><b>${fmtDur(mins * 60)}</b><span>d’entraînement</span></div><div class="stat"><b>${recs}</b><span>record${recs > 1 ? "s" : ""}</span></div><div class="stat"><b>${w0 && w1 && w1.date > w0.date ? (w1.poids - w0.poids >= 0 ? "+" : "−") + fmtNum(Math.abs(Math.round((w1.poids - w0.poids) * 10) / 10)) : "–"}<small style="font-size:17px"> kg</small></b><span>poids de corps</span></div></div>
    ${g.length ? `<div><div class="h3" style="margin-bottom:8px">Tes progrès</div><div class="list">${g.map(x => `<div class="row"><div class="row-main"><div class="row-title">${esc(EX_BY_ID[x.id].n)}</div><div class="row-sub">${x.a.kg && !isAssist(x.id) ? fmtNum(x.a.kg) + " kg → <b>" + fmtNum(x.b.kg) + " kg</b>" : x.a.r + " → <b>" + x.b.r + " répétitions</b>"}</div></div><span class="tag tag-p">+${Math.round(x.g * 100)} %</span></div>`).join("")}</div></div>` : `<p class="small muted">Continue à noter tes poids et tes répétitions : le prochain bilan montrera tes progrès exercice par exercice.</p>`}
    ${t0 && t1 && t1.date > t0.date ? `<p class="small">Tour de taille : ${fmtNum(t0.tour)} cm → <b>${fmtNum(t1.tour)} cm</b>.</p>` : ""}
    ${nxtN ? `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="h3">Maintenant : palier ${nxtN} · ${esc(phaseName(nxtN))}</div><ul class="bullets">${phaseChanges(nxtN, p.objectif).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${list.length > 1 ? `<div class="chips" role="group" aria-label="Bilans">${list.map((x, i) => `<button class="chip chip-sm" data-a="bilan-open" data-i="${i}" aria-pressed="${i === idx}">Palier ${x.n}${x.up ? " ★" : ""}</button>`).join("")}</div>` : ""}`;
  Sheet.closeAll();
  Sheet.open({ key: "bilan", title: `Bilan du palier ${b.n}`, tall: true, body, foot: `<button class="btn btn-primary btn-lg" data-a="sheet-close">${b.up ? "Super, on continue" : "On continue"}</button>` });
}

/* ================= Reprise après une pause ================= */
const REPRISE_DAYS = 10;
function repriseActive() {
  const h = S.historique.find(countable); if (!h) return false;
  return addDays(h.date, REPRISE_DAYS) <= todayISO();
}

/* ================= File d’attente : les séances du programme avancent dans l’ordre ================= */
/* Les séances du programme manquées ne restent pas en retard : la prochaine séance prévue devient celle qui n’a pas été faite,
   et toute la suite se décale. Renvoie le nombre de séances manquées absorbées. */
function requeue() {
  const p = S.profile; if (!p.autoPlan) return 0;
  const t = todayISO(), n0 = S.agenda.length;
  S.agenda = S.agenda.filter(e => !(isProgEv(e) && !e.fait && e.date < t));
  const missed = n0 - S.agenda.length;
  const pr = programme(p), key = progKey(pr), n = pr.ids.length, multi = objList(p).length > 1;
  const last = lastProgDone(pr, key);
  const start = last != null ? (last + 1) % n : 0;
  let ch = missed > 0;
  S.agenda.filter(e => isProgEv(e) && !e.fait && e.date >= t).sort((a, b) => a.date === b.date ? byTime(a, b) : a.date.localeCompare(b.date)).forEach((e, k) => {
    const j = (start + k) % n, id = weekVariant(pr.ids[j], e.date);
    if (e.ref.j !== j || e.ref.id !== id || e.ref.o !== pr.objs[j]) { Object.assign(e, { titre: TPL_BY_ID[id].n, note: multi ? OBJECTIFS[pr.objs[j]].n : "", ref: { k: "t", id, o: pr.objs[j], j } }); ch = true; }
  });
  if (ch) commit("a");
  return missed;
}

/* ================= Le programme suit ton corps ================= */
/* Perte de poids qui stagne 3 semaines : 5 min de cardio en plus (15 au plus), au plus une fois toutes les 3 semaines */
function bodyCheck() {
  const p = S.profile, t = todayISO();
  if (!objList(p).some(k => k === "perte" || k === "tonus")) return false;
  if (p.cardioAt && addDays(p.cardioAt, 21) > t) return false;
  if ((p.cardioPlus || 0) >= 15 || !plateau(mesPts("poids"), t)) return false;
  p.cardioPlus = (p.cardioPlus || 0) + 5; p.cardioAt = t; commit("p");
  return true;
}
const goalReached = p => !!(p.poidsCible && p.poids && p.goalAck !== p.poidsCible && ((p.objectif === "perte" && p.poids <= p.poidsCible) || (p.objectif === "muscle" && p.poids >= p.poidsCible)));
function bodyCard(home) {
  const p = S.profile, items = [];
  if (goalReached(p)) items.push(`<div class="card card-accent" style="display:flex;flex-direction:column;gap:10px"><div class="h3">Objectif atteint : ${fmtNum(p.poids)} kg</div><p class="small">Bravo ! Tu as atteint ton poids visé (${fmtNum(p.poidsCible)} kg). On adapte ton programme ?</p><div class="btn-row">${p.objectif === "perte" ? `<button class="btn" style="background:var(--accent-ink);color:var(--accent)" data-a="goal-switch" data-v="forme">Garder la forme</button><button class="btn" style="background:var(--accent-ink);color:var(--accent)" data-a="goal-switch" data-v="muscle">Prendre du muscle</button>` : `<button class="btn" style="background:var(--accent-ink);color:var(--accent)" data-a="goal-switch" data-v="force">Gagner en force</button><button class="btn" style="background:var(--accent-ink);color:var(--accent)" data-a="goal-switch" data-v="forme">Garder la forme</button>`}</div><button class="link small" style="color:inherit" data-a="goal-keep">Garder mon objectif actuel</button></div>`);
  if (home) return items.length ? `<section>${items.join("")}</section>` : "";
  if (p.cardioPlus) items.push(`<div class="note">${icon("flame")}<span><b>${p.cardioPlus} min de cardio en plus</b> dans tes séances cardio : ton poids ne baissait plus depuis 3 semaines. <button class="link-in" data-a="cardio-reset">Revenir à la normale</button></span></div>`);
  const stuck = Object.keys(S.lastPerf).filter(id => EX_BY_ID[id] && (S.lastPerf[id].fails || 0) >= 2);
  if (stuck.length >= 3 && !deloadActive()) items.push(`<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="h3">Tes charges stagnent</div><p class="small muted">Sur ${plural(stuck.length, "exercice")} (${esc(stuck.slice(0, 3).map(id => EX_BY_ID[id].n.replace(/ \(.*\)$/, "").toLowerCase()).join(", "))}${stuck.length > 3 ? "…" : ""}). C’est normal de temps en temps : une semaine plus légère laisse le corps récupérer, et tu repars plus fort.</p><button class="btn btn-primary" data-a="dl-on">Alléger cette semaine</button></div>`);
  if (!p.poidsCible && (p.objectif === "perte" || p.objectif === "muscle")) items.push(`<div class="note">${icon("sparkle")}<span>Indique ton <b>poids visé</b> dans ton profil : Fonte te préviendra quand tu l’atteins et adaptera ton programme. <button class="link-in" data-a="tab" data-t="profil">Mon profil</button></span></div>`);
  if (!items.length) return "";
  return `<section><div class="sec-h"><h2>Ton corps</h2>${S.mesures.length ? `<button class="link" data-a="mes-open">Mesures</button>` : ""}</div>${items.join("")}</section>`;
}

/* ================= Mes muscles : silhouette interactive et exercices conseillés ================= */
const FIGI = {};
/* Contenu d’une moitié de silhouette (symbole), avec chaque muscle cliquable */
function figPart(id) {
  if (FIGI[id] != null) return FIGI[id];
  const sym = document.getElementById(id);
  return (FIGI[id] = sym ? sym.innerHTML.replace(/<(path|ellipse|circle|rect|polygon)([^>]*?)style="fill:var\(--m-([a-z_]+),var\(--mu\)\)"/g, (m, tg, at, mu) => MUSCLES[mu] ? `<${tg}${at}class="mus" data-a="mus-open" data-m="${mu}" style="fill:var(--m-${mu},var(--mu))"` : m) : "");
}
function figBig(sets) {
  const one = (half, lab) => `<svg viewBox="0 0 120 236" role="img" aria-label="${lab}"><g fill="var(--fig)" stroke="var(--fig)"><use href="#fb-l"/><use href="#fb-l" transform="matrix(-1 0 0 1 120 0)"/></g><g>${figPart(half)}</g><g transform="matrix(-1 0 0 1 120 0)">${figPart(half)}</g></svg>`;
  return `<div class="fig fig-big" style="${heatStyle(sets)}">${one("ff-l", "Vue de face")}${one("fr-l", "Vue de dos")}</div>`;
}
const MUS_LIST = ["pecs", "dorsaux", "rhomboides", "trapezes", "lombaires", "epaules_ant", "epaules_lat", "epaules_post", "biceps", "triceps", "avantbras", "abdos", "obliques", "quadriceps", "ischios", "fessiers", "abducteurs", "adducteurs", "mollets"];
/* Séries par semaine conseillées : moins de 4 = à travailler, 4 à 9 = correct, 10 à 20 = bien, plus = beaucoup */
function musStatus(perWeek) { return perWeek < 4 ? ["low", "À travailler"] : perWeek < 10 ? ["mid", "Correct"] : perWeek <= 20 ? ["ok", "Bien travaillé"] : ["hi", "Beaucoup"]; }
function musPeriod() { const d = UI.musDays || 7, to = todayISO(); return { d, to, from: addDays(to, -(d - 1)), sets: muscleSets(S.historique, addDays(to, -(d - 1)), to) }; }
/* Exercices conseillés pour un muscle : ciblés (peu d’autres muscles), adaptés au niveau et aux articulations */
function musExercises(m, n, exclude) {
  const L = NIV_KEYS[S.profile.niveau] || 1, low = lowImpact(S.profile), ex = exclude || [];
  return EX.filter(e => e.p.indexOf(m) >= 0 && ["cardio", "mobilite", "etirements", "fullbody"].indexOf(e.g) < 0 && e.l <= (L === 1 ? 2 : 3) && !(low && e.imp) && ex.indexOf(e.id) < 0)
    .sort((a, b) => (a.p.length - b.p.length) || (Math.abs(a.l - L) - Math.abs(b.l - L)) || ((LOAD[b.id] ? 1 : 0) - (LOAD[a.id] ? 1 : 0)) || a.n.localeCompare(b.n)).slice(0, n || 5);
}
function lowMuscles(per) {
  const k = 7 / per.d;
  return MAJOR_MUSCLES.concat(["epaules_post", "lombaires"]).filter(m => (per.sets[m] || 0) * k < 4).sort((a, b) => (per.sets[a] || 0) - (per.sets[b] || 0));
}
function musclesSheetBody() {
  const per = musPeriod(), k = 7 / per.d, low = lowMuscles(per), any = Object.keys(per.sets).some(m => per.sets[m] > 0);
  const rows = MUS_LIST.map(m => ({ m, v: per.sets[m] || 0 })).sort((a, b) => b.v - a.v);
  const max = Math.max(10, rows[0] ? rows[0].v : 0);
  let h = `<div class="seg" role="group" aria-label="Période"><button data-a="mus-days" data-v="7" aria-pressed="${per.d === 7}">7 jours</button><button data-a="mus-days" data-v="30" aria-pressed="${per.d === 30}">30 jours</button></div>
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:8px">${figBig(per.sets)}<p class="small muted" style="text-align:center">Touche un muscle pour voir ce que tu as fait et les exercices conseillés.</p><div class="heat-leg small muted"><i style="background:var(--mu)"></i>pas travaillé<i style="background:color-mix(in srgb, var(--hl) 22%, var(--mu))"></i>peu<i style="background:var(--hl)"></i>10 séries et +</div></div>`;
  if (!any) h += `<div class="card empty"><p>Pas encore de séance sur cette période. Tes muscles se colorent au fil de tes séances.</p></div>`;
  if (low.length) {
    h += `<div><div class="sec-h"><h2>À travailler</h2></div><p class="small muted" style="margin:4px 0 10px">Moins de 4 séries par semaine : un exercice conseillé pour chacun.</p><div class="list">${low.slice(0, 6).map(m => { const x = musExercises(m, 1)[0]; return `<button class="row" data-a="mus-open" data-m="${m}">${x ? figHTML(x.p, x.s, "xs") : ""}<div class="row-main"><div class="row-title">${esc(MUSCLES[m])}</div><div class="row-sub">${x ? "Par exemple : " + esc(x.n) : ""}</div></div><span class="tag mus-low">${fmtNum(Math.round((per.sets[m] || 0) * 2) / 2)} série${(per.sets[m] || 0) > 1 ? "s" : ""}</span></button>`; }).join("")}</div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" data-a="mus-go" data-m="${low.slice(0, 4).join(",")}">${icon("play")}Séance express pour ces muscles</button></div>`;
  }
  h += `<div><div class="sec-h"><h2>Tous les muscles</h2><span class="small muted">séries${per.d === 30 ? " sur 30 jours" : " sur 7 jours"}</span></div><div class="list">${rows.map(r => { const [cl, lab] = musStatus(r.v * k); return `<button class="row mus-row" data-a="mus-open" data-m="${r.m}"><div class="row-main"><div class="row-title">${esc(MUSCLES[r.m])}</div><div class="mus-bar"><b class="mus-${cl}" style="width:${Math.round(r.v / max * 100)}%"></b></div></div><div class="presc">${fmtNum(Math.round(r.v * 2) / 2)}<small class="mus-t-${cl}">${lab}</small></div></button>`; }).join("")}</div></div>`;
  return h;
}
function openMuscles() { Sheet.open({ key: "mus", title: "Mes muscles", tall: true, body: musclesSheetBody() }); }
function openMuscle(m) {
  if (!MUSCLES[m] || m === "cardio") return;
  const per = musPeriod(), v = per.sets[m] || 0, wk = v * 7 / per.d, [cl, lab] = musStatus(wk), ex = musExercises(m, 6);
  const last = S.historique.find(h => (h.log || []).some(l => !l.warm && !l.cool && EX_BY_ID[l.id] && (EX_BY_ID[l.id].p.indexOf(m) >= 0 || EX_BY_ID[l.id].s.indexOf(m) >= 0)));
  const msg = cl === "low" ? `Peu travaillé ces derniers temps. Vise au moins 4 à 10 séries par semaine : ajoute un ou deux de ces exercices à ta prochaine séance, ou lance une séance express.` : cl === "hi" ? `Très sollicité : laisse-le récupérer au moins 48 h avant de le retravailler.` : `Bien entretenu, continue comme ça.`;
  const body = `<div style="display:flex;gap:14px;align-items:center">${figHTML([m], [], "sm")}<div class="row-main"><div class="h3">${fmtNum(Math.round(v * 2) / 2)} série${v > 1 ? "s" : ""} en ${per.d} jours</div><span class="tag mus-${cl === "low" ? "low" : "okt"}">${lab}</span><p class="small muted" style="margin-top:6px">${last ? "Dernière fois : " + fmtDay(last.date) : "Pas encore travaillé dans tes séances enregistrées."}</p></div></div>
    <div class="note">${icon("info")}<span>${msg}</span></div>
    <div><div class="h3" style="margin-bottom:8px">Exercices conseillés</div><div class="list">${ex.map(x => exRow(x)).join("")}</div></div>`;
  Sheet.open({ key: "mus1", title: MUSCLES[m], tall: true, body, foot: ex.length ? `<button class="btn btn-primary btn-lg" data-a="mus-go" data-m="${m}">${icon("play")}Séance express : ${esc(MUSCLES[m].toLowerCase())}</button>` : "" });
}
/* Séance express : 2 ou 3 exercices par muscle demandé (environ 5 exercices en tout) */
function musSession(ms) {
  const ids = [], per = Math.max(1, Math.round(5 / ms.length));
  ms.forEach(m => musExercises(m, per, ids).forEach(x => ids.push(x.id)));
  const se = { nom: "Séance express : " + (ms.length === 1 ? MUSCLES[ms[0]].toLowerCase() : "muscles oubliés"), mode: "series", kind: "muscu", items: ids.slice(0, 6).map(id => defaultItem(EX_BY_ID[id])) };
  groupStations(se.items);
  return applySuggestions(se);
}

/* ================= Accueil : séance du jour ================= */
function heroCard() {
  const t = todayISO(), p = S.profile;
  const evs = S.agenda.filter(e => e.date === t && !e.fait && refInfo(e.ref)).sort(byTime);
  const nextEv = S.agenda.filter(e => e.date > t && !e.fait && refInfo(e.ref)).sort((a, b) => a.date === b.date ? byTime(a, b) : a.date.localeCompare(b.date))[0];
  const nextLine = nextEv ? `<p class="small muted">Prochaine séance : <b>${esc(nextEv.titre)}</b>, ${esc(dayName(nextEv.date))}${nextEv.heure ? " à " + esc(nextEv.heure) : ""}.</p>` : "";
  const block = (eb, title, sub, se, btns) => { const [mp, ms] = se ? seanceMuscles(se.items) : [[], []]; return `<section><div class="card hero"><div class="hero-top">${se ? figHTML(mp, ms, "sm") : ""}<div class="row-main"><div class="eyebrow">${eb}</div><div class="hero-t">${title}</div>${sub}</div></div>${btns}</div></section>`; };
  if (evs.length) {
    const e = evs[0], ri = refInfo(e.ref), se = ri.se(), d = estDuree(se);
    return block(`Aujourd’hui${e.heure ? " · " + esc(e.heure) : ""}`, esc(e.titre), `<div class="meta"><span>${icon("clock")}≈ ${fmtDur(d)}</span><span>${plural(se.items.length, "exercice")}</span>${e.note ? `<span>${esc(e.note)}</span>` : ""}</div>${se.rp ? `<p class="small muted">Séance de reprise : poids un peu plus légers pour repartir en douceur.</p>` : ""}`, se,
      `<button class="btn btn-primary btn-lg btn-block" data-a="ev-start" data-id="${esc(e.id)}">${icon("play")}C’est parti</button><div class="btn-row"><button class="btn" data-a="ev-see" data-id="${esc(e.id)}">Voir la séance</button><button class="btn" data-a="ev-move" data-id="${esc(e.id)}">Pas aujourd’hui</button></div>`);
  }
  const x = nextProg(), d = estDuree(x.se);
  const goBtn = `data-a="tpl-start" data-id="${x.t.id}" data-o="${x.o}" data-j="${x.j}"`;
  if (S.historique.some(h => h.date === t)) return block("Aujourd’hui", "Séance faite, bravo", `<p class="small muted">Ton corps se renforce pendant le repos : mange bien, dors bien.</p>${nextLine}`, null, "");
  if (p.autoPlan || nextEv) return block("Aujourd’hui", "Jour de repos", `<p class="small muted">Le repos fait partie du programme : c’est là que les muscles se reconstruisent.</p>${nextLine}`, null, `<button class="btn btn-block" ${goBtn}>${icon("play")}M’entraîner quand même</button>`);
  return block("Ta prochaine séance", esc(x.t.n), `<div class="meta"><span>${icon("clock")}≈ ${fmtDur(d)}</span><span>${plural(x.se.items.length, "exercice")}</span></div>`, x.se,
    `<button class="btn btn-primary btn-lg btn-block" ${goBtn}>${icon("play")}C’est parti</button><div class="btn-row"><button class="btn" data-a="tpl-open" data-id="${x.t.id}" data-o="${x.o}" data-j="${x.j}">Voir la séance</button><button class="btn" data-a="pp-save">${icon("cal")}Planifier mon mois</button></div>`);
}

/* ================= Premier lancement guidé ================= */
const ONB = { i: 0, d: null, err: "" };
const ONB_N = 6;
const ONB_OBJ = { muscle: ["dumbbell", "Des muscles plus gros et plus dessinés"], force: ["bolt", "Soulever plus lourd"], perte: ["flame", "Brûler des calories, affiner ma silhouette"], tonus: ["heart", "Plus d’endurance, un corps plus ferme"], forme: ["sparkle", "Reprendre le sport en douceur"] };
const ONB_NIV = [["debutant", "Je débute", "Jamais fait de musculation, ou il y a longtemps"], ["intermediaire", "J’ai déjà pratiqué", "Quelques mois de salle, je connais les exercices de base"], ["avance", "Je m’entraîne depuis longtemps", "Plus d’un an de pratique régulière"]];
const onbNeeded = () => !S.profile.onb && !(S.profile.sexe && S.profile.poids && S.profile.age);
function openOnb() {
  const p = S.profile;
  ONB.i = 0; ONB.err = "";
  ONB.d = { prenom: p.prenom || "", objectif: objList(p)[0], sexe: p.sexe || "", age: p.age || "", taille: p.taille || "", poids: p.poids || "", niveau: p.niveau || "debutant", zones: zoneList(p), days: planDays(p), heure: p.planHeure || "18:30", plan: true };
  $("#onb").hidden = false; renderOnb(); lockPage();
}
function closeOnb() { $("#onb").hidden = true; $("#onb").innerHTML = ""; lockPage(); }
function onbRead() {
  const v = id => { const el = $("#" + id); return el ? el.value : null; }, d = ONB.d;
  if (v("onb-prenom") != null) d.prenom = v("onb-prenom").trim().slice(0, 30);
  ["age", "taille", "poids", "cible"].forEach(f => { const x = v("onb-" + f); if (x != null) d[f] = x === "" ? "" : num(x); });
  if (v("onb-heure")) d.heure = v("onb-heure");
}
function onbProfile() {
  const d = ONB.d;
  return Object.assign({}, S.profile, { zones: d.zones.slice(), poidsCible: d.cible > 0 ? d.cible : (S.profile.poidsCible || null), prenom: d.prenom, sexe: d.sexe, age: d.age || null, taille: d.taille || null, poids: d.poids || null, niveau: d.niveau, objectif: d.objectif, objectifs: [d.objectif].concat((S.profile.objectifs || []).filter(k => k !== d.objectif && S.profile.onb)), planJours: d.days.slice(), jours: d.days.length });
}
function renderOnb() {
  const d = ONB.d, i = ONB.i;
  const opt = (a, v, on, ic, t, s) => `<button class="opt" data-a="${a}" data-v="${v}" aria-pressed="${on}">${ic ? icon(ic) : ""}<span class="row-main"><b>${t}</b>${s ? `<span class="small muted">${s}</span>` : ""}</span><span class="opt-check">${icon("check")}</span></button>`;
  let title = "", body = "", next = "Continuer";
  if (i === 0) {
    title = "Bienvenue";
    body = `<div style="display:flex;justify-content:center;padding:8px 0"><svg aria-hidden="true" style="width:72px;height:72px"><use href="#logo"/></svg></div><p class="onb-lead">Réponds à 5 petites questions : Fonte te prépare un programme fait pour toi, avec les bons exercices, le bon nombre de mouvements et les bons poids.</p><div class="field"><label for="onb-prenom">Ton prénom</label><input class="inp" id="onb-prenom" maxlength="30" autocomplete="given-name" value="${esc(d.prenom)}" placeholder="Facultatif"></div>${PWA && Acct.ok() && !Acct.user ? `<button class="link small" data-a="onb-account">J’ai déjà un compte Fonte : retrouver mes données</button>` : ""}`;
    next = "Commencer";
  } else if (i === 1) {
    title = "Ton objectif";
    body = `<p class="onb-lead">Qu’est-ce qui te motive le plus ?</p><div class="opts">${Object.keys(ONB_OBJ).map(k => opt("onb-obj", k, d.objectif === k, ONB_OBJ[k][0], esc(OBJECTIFS[k].n), ONB_OBJ[k][1])).join("")}</div><p class="small muted">Tu pourras en ajouter d’autres plus tard, dans ton profil.</p>
      <div class="field"><div class="lbl">Une zone à travailler en priorité ? (facultatif)</div><div class="chips chips-wrap" role="group" aria-label="Zones prioritaires">${Object.keys(ZONES).map(z => `<button class="chip" data-a="onb-zone" data-v="${z}" aria-pressed="${d.zones.indexOf(z) >= 0}">${esc(ZONES[z][0])}</button>`).join("")}</div></div>`;
  } else if (i === 2) {
    title = "Toi";
    body = `<p class="onb-lead">Ça sert à calculer les poids à soulever et la durée des pauses.</p><div class="field"><div class="lbl">Je suis</div><div class="seg" role="group"><button data-a="onb-sexe" data-v="H" aria-pressed="${d.sexe === "H"}">Un homme</button><button data-a="onb-sexe" data-v="F" aria-pressed="${d.sexe === "F"}">Une femme</button></div></div>
      <div class="grid3"><div class="field"><label for="onb-age">Âge</label><input class="inp tnum" id="onb-age" inputmode="numeric" value="${esc(d.age)}" placeholder="ans"></div><div class="field"><label for="onb-taille">Taille</label><input class="inp tnum" id="onb-taille" inputmode="numeric" value="${esc(d.taille)}" placeholder="cm"></div><div class="field"><label for="onb-poids">Poids</label><input class="inp tnum" id="onb-poids" inputmode="decimal" value="${d.poids ? esc(fmtNum(d.poids)) : ""}" placeholder="kg"></div></div>
      ${d.objectif === "perte" || d.objectif === "muscle" ? `<div class="field"><label for="onb-cible">Poids visé (facultatif)</label><input class="inp tnum" id="onb-cible" inputmode="decimal" value="${d.cible ? esc(fmtNum(d.cible)) : ""}" placeholder="kg"></div>` : ""}
      <p class="small muted">Ces informations restent sur ton téléphone.</p>`;
  } else if (i === 3) {
    title = "Ton niveau";
    body = `<p class="onb-lead">Où en es-tu avec la musculation ?</p><div class="opts">${ONB_NIV.map(([k, t, s]) => opt("onb-niv", k, d.niveau === k, "", t, s)).join("")}</div>${d.niveau === "debutant" ? `<div class="note">${icon("sparkle")}<span>Parfait pour commencer : séances courtes, mouvements simples, et l’appli t’explique tout pendant la séance.</span></div>` : ""}`;
  } else if (i === 4) {
    const w = [-1, -1, -1, -1, -1, -1, -1]; d.days.forEach((x, k) => { w[x] = k; });
    title = "Tes jours";
    body = `<p class="onb-lead">Quels jours peux-tu t’entraîner ?</p><div class="week">${w.map((j, k) => `<button class="wday pday ${j >= 0 ? "on" : ""}" data-a="onb-day" data-d="${k}" aria-pressed="${j >= 0}" aria-label="${JOURS_L[k]}"><small>${"LMMJVSD"[k]}</small><b>${j >= 0 ? icon("dumbbell") : "–"}</b></button>`).join("")}</div>
      <p class="small">${d.days.length ? plural(d.days.length, "séance") + " par semaine : " + d.days.map(x => JOURS_L[x].toLowerCase()).join(", ") + "." : ""}</p>
      <div class="note">${icon("heart")}<span>Conseil : ${d.niveau === "debutant" ? "2 ou 3 jours" : "3 ou 4 jours"} par semaine, avec un jour de repos entre deux séances si possible.</span></div>
      <div class="field"><label for="onb-heure">À quelle heure, en général ?</label><input class="inp" type="time" id="onb-heure" value="${esc(d.heure)}"></div>`;
  } else {
    const p = onbProfile(), pr = programme(p), days = planDays(p);
    title = (d.prenom ? esc(d.prenom) + ", voici" : "Voici") + " ton programme";
    body = `<p class="onb-lead">${esc(progSummary(p))}</p><div class="card"><div class="prog">${pr.ids.map((id, j) => { const se = prescribe(TPL_BY_ID[id], profFor(p, pr.objs[j])); return `<div class="prog-day"><span class="num">${dayShort(days[j])}</span><div class="row-main"><div class="row-title">${esc(TPL_BY_ID[id].n)}</div><div class="row-sub">${plural(se.items.length, "exercice")} · ≈ ${fmtDur(estDuree(se))}</div></div></div>`; }).join("")}</div></div>
      <div class="card"><button class="switch" role="switch" data-a="onb-plan" aria-checked="${d.plan}"><span><b>Programmer mes séances</b><br><span class="small muted">Elles s’ajoutent à l’agenda un mois à l’avance, aux jours choisis. Un empêchement ? Tu les reportes d’un geste.</span></span><span class="sw"></span></button></div>`;
    next = "C’est parti";
  }
  $("#onb").innerHTML = `<div class="ov-top">${i ? `<button class="btn-icon" data-a="onb-back" aria-label="Retour">${icon("chevl")}</button>` : `<span style="width:40px"></span>`}<div class="onb-dots" aria-label="Étape ${i + 1} sur ${ONB_N}">${Array.from({ length: ONB_N }, (_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>${i < ONB_N - 1 ? `<button class="link small" data-a="onb-skip">Passer</button>` : `<span style="width:40px"></span>`}</div>
    <div class="ov-body"><h2 class="disp onb-h">${title}</h2>${body}${ONB.err ? `<p class="small" style="color:var(--red)">${esc(ONB.err)}</p>` : ""}</div>
    <div class="ov-foot"><button class="btn btn-primary btn-lg" data-a="onb-next">${next}</button></div>`;
  const b = $("#onb .ov-body"); if (b) b.scrollTop = 0;
}
function onbFinish() {
  const d = ONB.d;
  S.profile = normProfile(Object.assign(onbProfile(), { planHeure: d.heure, onb: 1 }));
  if (d.plan) replan(); else commit("p");
  closeOnb(); UI.tab = "accueil"; UI.seg = "prog"; saveUI(); render(); window.scrollTo(0, 0);
  toast("Ton programme est prêt");
}

/* ================= Semaine allégée ================= */
const DELOAD_EVERY = { 1: 8, 2: 6, 3: 5 };
function deloadActive() { return !!(S.deload && S.deload.mon === mondayOf(todayISO())); }
function deloadState() {
  const lvl = NIV_KEYS[S.profile.niveau] || 1, every = DELOAD_EVERY[lvl];
  return Object.assign({ every }, deloadDue(S.historique, todayISO(), S.deload && S.deload.mon, every));
}
function deloadCard() {
  const mon = mondayOf(todayISO());
  if (deloadActive()) return `<section><div class="note">${icon("heart")}<span><b>Semaine allégée en cours</b> : moins de séries et charges à 85 % pour récupérer. Tes charges de référence restent celles d’avant. <button style="color:var(--accent);font-weight:600" data-a="dl-off">Annuler</button></span></div></section>`;
  const d = deloadState();
  if (!d.due || (S.deload && S.deload.off === mon)) return "";
  return `<section><div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="row-main"><div class="h3">Semaine allégée conseillée ${gl("allege")}</div><p class="small muted">Tu t’entraînes depuis ${plural(d.weeks, "semaine")} d’affilée. Une semaine plus légère (environ 40 % de séries en moins, charges à 85 %) laisse le corps récupérer : tu repartiras plus fort la semaine suivante.</p></div><div class="btn-row"><button class="btn btn-primary" data-a="dl-on">Alléger cette semaine</button><button class="btn" data-a="dl-later">Pas maintenant</button></div></div></section>`;
}

/* ================= Muscles de la semaine, régularité, bilan ================= */
function heatStyle(sets) {
  let v = "";
  Object.keys(sets).forEach(m => { const k = Math.min(1, sets[m] / 10); if (sets[m] > 0) v += `--m-${m}:color-mix(in srgb, var(--hl) ${Math.round(22 + 78 * k)}%, var(--mu));`; });
  return v;
}
function musclesCard() {
  const to = todayISO(), from = addDays(to, -6), sets = muscleSets(S.historique, from, to);
  const done = MAJOR_MUSCLES.filter(m => (sets[m] || 0) >= 1), low = MAJOR_MUSCLES.filter(m => !(sets[m] >= 1));
  if (!done.length) return S.historique.length ? `<section><div class="sec-h"><h2>Mes muscles</h2><button class="link" data-a="mus-all">Voir</button></div><button class="card row" data-a="mus-all" style="padding:14px">${figHTML([], [], "xs")}<div class="row-main"><div class="row-title">Aucun muscle travaillé cette semaine</div><div class="row-sub">Touche pour voir les muscles à travailler et des exercices conseillés</div></div>${icon("chev", "ic chev")}</button></section>` : "";
  const top = Object.keys(sets).filter(m => MUSCLES[m]).sort((a, b) => sets[b] - sets[a]).slice(0, 3);
  return `<section><div class="sec-h"><h2>Mes muscles</h2><button class="link" data-a="mus-all">Détail et conseils</button></div><div class="card wk-mus" data-a="mus-all" role="button" tabindex="0"><div class="fig fig-wk" style="${heatStyle(sets)}"><svg viewBox="0 0 120 236" role="img" aria-label="Vue de face"><use href="#fig-front"/></svg><svg viewBox="0 0 120 236" role="img" aria-label="Vue de dos"><use href="#fig-back"/></svg></div><div class="row-main" style="display:flex;flex-direction:column;gap:8px">
    <div><div class="lbl small muted">Le plus travaillé</div><div class="small">${top.map(m => `<b>${esc(MUSCLES[m])}</b> ${fmtNum(Math.round(sets[m] * 2) / 2)} séries`).join("<br>")}</div></div>
    ${low.length ? `<div><div class="lbl small muted">Peu ou pas travaillé</div><div class="small">${esc(low.map(m => MUSCLES[m]).join(", "))}</div></div>` : `<div class="small"><b>Tous les grands muscles</b> ont été travaillés.</div>`}
    <div class="heat-leg small muted"><i style="background:color-mix(in srgb, var(--hl) 22%, var(--mu))"></i>peu<i style="background:var(--hl)"></i>10 séries et +</div><span class="link small" style="color:var(--accent);font-weight:600">Touche pour les exercices conseillés ›</span></div></div></section>`;
}
function regulariteHTML() {
  const goal = Math.max(1, S.profile.jours || 3), w = weekCounts(S.historique, todayISO(), 8), st = weekStreak(S.historique, todayISO(), goal);
  if (!S.historique.length) return "";
  const max = Math.max(goal, Math.max.apply(null, w.map(x => x.n)));
  const cols = w.map((x, i) => `<div class="reg-col${i === w.length - 1 ? " now" : ""}" title="Semaine du ${esc(fmtDayShort(x.mon))} : ${plural(x.n, "séance")}"><span class="reg-bar"><b style="height:${Math.round(x.n / max * 100)}%" class="${x.n >= goal ? "ok" : ""}"></b><i style="bottom:${Math.round(goal / max * 100)}%"></i></span><small>${x.n}</small></div>`).join("");
  return `<div class="card reg"><div class="reg-cols" role="img" aria-label="Séances des 8 dernières semaines : ${w.map(x => x.n).join(", ")}, objectif ${goal} par semaine">${cols}</div><div class="small">${st ? `<b>${plural(st, "semaine")} d’affilée</b> à ${goal} séance${goal > 1 ? "s" : ""} ou plus.` : `Objectif : ${plural(goal, "séance")} par semaine (réglable dans Profil).`}</div></div>`;
}
function monthRecap() {
  const t = todayISO(), m0 = t.slice(0, 7), d = fromISO(t); d.setDate(1); d.setMonth(d.getMonth() - 1); const m1 = toISO(d).slice(0, 7);
  const sum = m => { const l = S.historique.filter(h => h.date.slice(0, 7) === m); return { n: l.length, min: Math.round(l.reduce((a, h) => a + (h.duree || 0), 0) / 60), vol: l.reduce((a, h) => a + (h.volume || 0), 0), pr: l.reduce((a, h) => a + ((h.pr || []).length), 0) }; };
  const a = sum(m0), b = sum(m1);
  const dlt = (x, y) => (y ? (x >= y ? "+" : "−") + Math.abs(x - y) : "");
  const vt = v => v >= 1000 ? fmtNum(Math.round(v / 100) / 10) + " t" : Math.round(v) + " kg";
  return `<div><div class="h3" style="margin-bottom:8px">Ce mois-ci</div><div class="sum"><div class="stat"><b>${a.n}</b><span>séances${b.n ? " (" + dlt(a.n, b.n) + " vs " + MOIS[d.getMonth()] + ")" : ""}</span></div><div class="stat"><b>${a.min}</b><span>minutes${b.min ? " (" + dlt(a.min, b.min) + ")" : ""}</span></div><div class="stat"><b>${vt(a.vol)}</b><span>soulevés${b.vol ? " (" + (a.vol >= b.vol ? "+" : "−") + vt(Math.abs(a.vol - b.vol)) + ")" : ""}</span></div><div class="stat"><b>${a.pr}</b><span>record${a.pr > 1 ? "s" : ""}</span></div></div></div>`;
}

/* ================= Mesures (poids, tour de taille) ================= */
const MES_TRACK = { poids: { lab: "Poids", v: p => p.poids, f: v => fmtNum(Math.round(v * 10) / 10) + " kg" }, tour: { lab: "Tour de taille", v: p => p.tour, f: v => fmtNum(Math.round(v * 10) / 10) + " cm" } };
function mesSorted() { return S.mesures.slice().sort((a, b) => a.date.localeCompare(b.date) || (a.ts || 0) - (b.ts || 0)); }
function mesPts(k) { return mesSorted().filter(x => x[k] > 0).map(x => ({ date: x.date, ts: fromISO(x.date).getTime(), poids: x.poids, tour: x.tour })); }
/* Ajoute ou met à jour la mesure d’une date ; la plus récente met à jour le poids du profil (charges et calories) */
function upsertMesure(date, vals) {
  let m = S.mesures.find(x => x.date === date);
  if (!m) { m = { id: rid(), date, ts: Date.now() }; S.mesures.push(m); }
  Object.keys(vals).forEach(k => { if (vals[k] > 0) m[k] = vals[k]; else delete m[k]; });
  if (!m.poids && !m.tour) S.mesures = S.mesures.filter(x => x !== m);
  S.mesures = S.mesures.slice(-500);
  const last = mesSorted().filter(x => x.poids).pop();
  if (last && last.date === date && vals.poids > 0) S.profile.poids = vals.poids;
}
function mesuresCard() {
  const pp = mesPts("poids"), pt = mesPts("tour");
  const line = (P, k) => { if (!P.length) return ""; const m = MES_TRACK[k], a = P[0], b = P[P.length - 1], d = m.v(b) - m.v(a); return `<div class="row" style="padding:10px 0"><div class="row-main"><div class="row-title">${m.lab} : ${m.f(m.v(b))}</div><div class="row-sub">${P.length > 1 ? (d >= 0 ? "+" : "−") + m.f(Math.abs(d)) + " depuis le " + fmtDayShort(a.date).replace(/^\S+ /, "") : "Le " + fmtDayShort(b.date).replace(/^\S+ /, "")}</div></div>${sparkSVG(P.slice(-30), m)}</div>`; };
  return `<section><div class="sec-h"><h2>Mesures</h2>${S.mesures.length ? `<button class="link" data-a="mes-open">Courbes</button>` : ""}</div><div class="card" style="display:flex;flex-direction:column;gap:10px">${S.mesures.length ? line(pp, "poids") + line(pt, "tour") : `<p class="small muted">Note ton poids et ton tour de taille de temps en temps pour suivre leur évolution. Le poids le plus récent met aussi à jour tes charges conseillées.</p>`}<button class="btn" data-a="mes-add">${icon("plus")}Ajouter une mesure</button></div></section>`;
}
function openMesAdd() {
  const last = mesSorted().pop() || {};
  Sheet.open({ key: "mesa", title: "Nouvelle mesure", body: `<div class="field"><label for="mes-date">Date</label><input class="inp" type="date" id="mes-date" value="${todayISO()}"></div>
    <div class="grid3" style="grid-template-columns:1fr 1fr"><div class="field"><label for="mes-poids">Poids (kg)</label><input class="inp tnum" id="mes-poids" inputmode="decimal" value="${S.profile.poids ? fmtNum(S.profile.poids) : ""}"></div><div class="field"><label for="mes-tour">Tour de taille (cm)</label><input class="inp tnum" id="mes-tour" inputmode="decimal" value="${last.tour ? fmtNum(last.tour) : ""}" placeholder="facultatif"></div></div>
    <p class="small muted">Tour de taille : mètre ruban au niveau du nombril, ventre relâché, le matin de préférence.</p>`,
    foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="mes-save">Enregistrer</button>` });
}
function mesSheetBody() {
  const by = { poids: mesPts("poids"), tour: mesPts("tour") }, mode = by[CH && CH.mes ? CH.mode : "poids"].length ? (CH && CH.mes ? CH.mode : "poids") : "tour";
  CH = { mes: true, mode, ptsBy: by, sel: Math.min(by[mode].length, 30) - 1 };
  const seg = by.poids.length && by.tour.length ? `<div class="seg" role="group" aria-label="Mesure"><button data-a="ch-m" data-v="poids" aria-pressed="${mode === "poids"}">Poids</button><button data-a="ch-m" data-v="tour" aria-pressed="${mode === "tour"}">Tour de taille</button></div>` : "";
  const list = mesSorted().reverse().map(x => `<div class="row"><div class="row-main"><div class="row-title">${cap(fmtDay(x.date))}</div><div class="row-sub">${[x.poids ? fmtNum(x.poids) + " kg" : "", x.tour ? fmtNum(x.tour) + " cm de tour de taille" : ""].filter(Boolean).join(" · ")}</div></div><button class="btn btn-ghost" style="min-height:36px" data-a="mes-del" data-id="${esc(x.id)}" aria-label="Supprimer">${icon("trash")}</button></div>`).join("");
  return `<div class="card" style="display:flex;flex-direction:column;gap:10px">${seg}<div id="ch">${CH.ptsBy[mode].length ? chartInner() : ""}</div></div><div class="list">${list}</div>`;
}
function openMesures() { Sheet.open({ key: "mes", title: "Mesures", tall: true, body: mesSheetBody(), foot: `<button class="btn btn-primary btn-lg" data-a="mes-add">${icon("plus")}Ajouter une mesure</button>`, onClose: () => { CH = null; } }); }

/* ================= Remplacer un exercice en séance ================= */
function openSwap() {
  const st = R.steps[R.idx]; if (!st || st.k !== "work" || st.cool) return;
  const it = R.se.items[st.i], e = EX_BY_ID[it.id];
  const ids = altsFor(it.id, { exclude: R.se.items.map(x => x.id), low: lowImpact(S.profile), lvl: (NIV_KEYS[S.profile.niveau] || 1) === 1 ? 2 : 3, n: 6 });
  const body = `<p class="muted">Machine prise ou exercice qui ne te va pas : ces exercices travaillent les mêmes muscles. Celui que tu choisis remplace les séries restantes de ${esc(e.n)}.</p>${ids.length ? `<div class="list">${ids.map(id => { const x = EX_BY_ID[id]; return exRow(x, { act: "run-swap-to", right: `<span class="tag">${esc(x.m.slice(0, 1).map(m => MATERIEL[m]).join(""))}</span>` }); }).join("")}</div>` : `<div class="card empty"><p>Pas d’exercice équivalent dans l’appli. Tu peux le mettre de côté avec « Plus tard » ou le passer.</p></div>`}`;
  Sheet.open({ key: "swap", title: "Remplacer " + e.n, tall: true, body });
}
function swapTo(newId) {
  const st = R.steps[R.idx], ex = EX_BY_ID[newId]; if (!st || !ex) return;
  const i = st.i, old = R.se.items[i];
  const it = Object.assign({}, old, { id: newId, charge: 0, echec: ECH.has(newId) ? old.echec : 0 });
  delete it.base;
  if (ex.t === "t") { it.reps = 0; it.duree = it.duree || ex.dt || 30; } else { it.duree = 0; it.reps = it.reps || 10; }
  const sg = suggest(newId), cv = convFor(newId, it.reps); it.charge = cv != null ? cv : sg ? sg.next : estCharge(newId, it.reps || 12, S.profile);
  if (R.se.dl && it.charge) deloadSe({ items: [it], mode: R.se.mode });
  if (!R.log[i].length) R.se.items[i] = it;
  else {
    /* séries déjà faites : elles restent sur l’ancien exercice, les suivantes passent sur le nouveau */
    it.rep = old.rep != null ? old.rep : i; it.ss = 0;
    R.se.items.push(it); R.log.push([]);
    const k = R.se.items.length - 1;
    R.steps.forEach((s, j) => { if (j >= R.idx && s.k === "work" && s.i === i) s.i = k; });
  }
  Sheet.closeAll(); ANIM_IDX = -1; enterStep(); toast(ex.n + " à la place");
}

/* ================= Progression : courbes et records ================= */
const TRACK = {
  kg: { lab: "1RM estimé", v: p => p.rm, f: v => fmtNum(Math.round(v * 2) / 2) + " kg" },
  kgmax: { lab: "Charge max", v: p => p.kg, f: v => fmtNum(v) + " kg" },
  assist: { lab: "Assistance (moins = mieux)", v: p => (p.as < 0.01 ? 0 : p.as), f: v => fmtNum(v) + " kg" },
  reps: { lab: "Répétitions max", v: p => p.reps, f: v => v + " reps" },
  duree: { lab: "Meilleure durée", v: p => p.d, f: v => fmtSec(Math.round(v)) }
};
const ptTs = p => p.ts || fromISO(p.date).getTime();
function niceStep(raw) { const e = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
/* Courbe d’une série de points (30 dernières séances) ; sel = point mis en avant */
function chartSVG(P, m, sel) {
  const W = 320, H = 150, L = 34, Rm = 12, T = 18, B = 22;
  const ys = P.map(m.v), xs = P.map(ptTs);
  let lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
  if (hi - lo < 1e-9) { lo = Math.max(0, lo - 1); hi = hi + 1; }
  const step = niceStep((hi - lo) / 3); lo = Math.max(0, Math.floor(lo / step) * step); hi = Math.ceil(hi / step) * step; if (hi <= lo) hi = lo + step;
  const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  const X = i => P.length === 1 || x1 === x0 ? (P.length === 1 ? (L + W - Rm) / 2 : L + i / (P.length - 1) * (W - L - Rm)) : L + (xs[i] - x0) / (x1 - x0) * (W - L - Rm);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let g = "";
  for (let v = lo; v <= hi + 1e-9; v += step) g += `<line class="grid" x1="${L}" x2="${W - Rm}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="axis" x="${L - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${fmtNum(Math.round(v * 10) / 10)}</text>`;
  const d = P.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(ys[i]).toFixed(1)).join("");
  const xl = `<text class="axis" x="${L}" y="${H - 6}">${fmtDayShort(P[0].date).replace(/^\S+ /, "")}</text>` + (P.length > 1 ? `<text class="axis" x="${W - Rm}" y="${H - 6}" text-anchor="end">${fmtDayShort(P[P.length - 1].date).replace(/^\S+ /, "")}</text>` : "");
  const sx = X(sel), sy = Y(ys[sel]), vt = m.f(ys[sel]);
  const anchor = sx > W - 50 ? "end" : sx < L + 30 ? "start" : "middle";
  const label = `<text class="val" x="${sx.toFixed(1)}" y="${Math.max(11, sy - 10).toFixed(1)}" text-anchor="${anchor}">${esc(vt)}</text>`;
  const pts = P.map((p, i) => `<circle class="pt" cx="${X(i).toFixed(1)}" cy="${Y(ys[i]).toFixed(1)}" r="${i === sel ? 6 : 4}"/>`).join("");
  const hits = P.map((p, i) => `<circle class="hit" data-a="ch-pt" data-i="${i}" cx="${X(i).toFixed(1)}" cy="${Y(ys[i]).toFixed(1)}" r="16"><title>${esc(fmtDayShort(p.date) + " : " + m.f(ys[i]))}</title></circle>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.lab)} : ${esc(P.map((p, i) => fmtDayShort(p.date) + " " + m.f(ys[i])).slice(-6).join(", "))}">${g}<line class="cross" x1="${sx.toFixed(1)}" x2="${sx.toFixed(1)}" y1="${T}" y2="${H - B}"/>${xl}${P.length > 1 ? `<path class="ln" d="${d}"/>` : ""}${pts}${label}${hits}</svg>`;
}
function sparkSVG(P, m) {
  if (P.length < 2) return "";
  const ys = P.map(m.v), lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), r = hi - lo || 1;
  const X = i => 2 + i / (P.length - 1) * 68, Y = v => 25 - (v - lo) / r * 22;
  return `<svg class="spark" viewBox="0 0 72 28" aria-hidden="true"><path d="${P.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(ys[i]).toFixed(1)).join("")}"/><circle cx="${X(P.length - 1).toFixed(1)}" cy="${Y(ys[ys.length - 1]).toFixed(1)}" r="3"/></svg>`;
}
let CH = null;
function chartInner() {
  const P = (CH.ptsBy ? CH.ptsBy[CH.mode] : CH.pts).slice(-30), m = CH.mes ? MES_TRACK[CH.mode] : TRACK[CH.mode], p = P[CH.sel];
  const det = CH.kind === "kg" ? `charge max ${fmtNum(p.kg)} kg · 1RM ≈ ${fmtNum(Math.round(p.rm * 2) / 2)} kg` : m.f(m.v(p));
  return chartSVG(P, m, CH.sel) + `<div class="ch-cap" aria-live="polite">${cap(fmtDayShort(p.date))} · ${esc(det)}</div>`;
}
function trendTxt(P, m) {
  if (P.length < 2) return "";
  const a = m.v(P[0]), b = m.v(P[P.length - 1]);
  if (!a) return "";
  const pc = Math.round((b - a) / a * 100);
  return pc ? (pc > 0 ? "+" : "−") + Math.abs(pc) + " %" : "stable";
}
function recText(k, v, id) {
  return { kg: "Charge max : " + fmtNum(v) + " kg", rm: "1RM estimé : " + fmtNum(Math.round(v * 2) / 2) + " kg", as: "Assistance : " + fmtNum(v) + " kg", reps: v + " répétitions", d: fmtSec(Math.round(v)) }[k] || "";
}
function bestTags(id, kind, b) {
  if (!b) return "";
  const t = [];
  if (kind === "kg") { t.push(["Charge max " + fmtNum(b.kg) + " kg", b.kgDate]); t.push(["1RM estimé " + fmtNum(Math.round(b.rm * 2) / 2) + " kg", b.rmDate]); }
  else if (kind === "assist") t.push(["Assistance " + fmtNum(b.as) + " kg", b.date]);
  else if (kind === "reps") t.push([b.reps + " répétitions", b.date]);
  else t.push([fmtSec(Math.round(b.d)), b.date]);
  return `<div class="tags">${t.map(([l, d]) => `<span class="tag tag-rec">${icon("trophy")}${esc(l)} · ${esc(fmtDayShort(d).replace(/^\S+ /, ""))}</span>`).join("")}</div>`;
}
/* Bloc « Ta progression » de la fiche d’un exercice */
function progBlock(id) {
  const pts = exSeries(S.historique, id); CH = null;
  if (!pts.length) return "";
  const kind = trackKind(id, pts), b = bestOf(pts, kind);
  CH = { id, kind, mode: kind, pts, sel: Math.min(pts.length, 30) - 1 };
  const tr = trendTxt(pts.slice(-30), TRACK[kind]);
  const seg = kind === "kg" ? `<div class="seg" role="group" aria-label="Mesure"><button data-a="ch-m" data-v="kg" aria-pressed="true">1RM estimé</button><button data-a="ch-m" data-v="kgmax" aria-pressed="false">Charge max</button></div>` : `<div class="small muted">${esc(TRACK[kind].lab)}</div>`;
  return `<div><div class="sec-h" style="margin-bottom:8px"><div class="h3">Ta progression</div><span class="small muted">${plural(pts.length, "séance")}${tr ? " · " + tr : ""}</span></div><div class="card" style="display:flex;flex-direction:column;gap:10px">${seg}<div id="ch">${chartInner()}</div>${pts.length === 1 ? `<p class="small muted">Refais cet exercice pour voir ta courbe se dessiner.</p>` : ""}${bestTags(id, kind, b)}</div></div>`;
}
function recentRecords(days) {
  const from = addDays(todayISO(), -(days || 3650)), out = [];
  /* le plus récent par exercice (l’historique est trié du plus récent au plus ancien) */
  S.historique.forEach(h => { if (h.date >= from && Array.isArray(h.pr)) h.pr.forEach(r => { if (EX_BY_ID[r.id] && !out.some(o => o.id === r.id)) out.push(Object.assign({ date: h.date }, r)); }); });
  return out;
}
const recRow = r => `<button class="row" data-a="ex-open" data-id="${esc(r.id)}">${icon("trophy", "ic rec-ic")}<div class="row-main"><div class="row-title">${esc(EX_BY_ID[r.id].n)}</div><div class="row-sub">${esc(recText(r.k, r.v))} · ${cap(fmtDayShort(r.date))}</div></div>${icon("chev", "ic chev")}</button>`;
function openProgress() {
  const ids = [];
  S.historique.forEach(h => (h.log || []).forEach(l => { if (!l.cool && !l.warm && EX_BY_ID[l.id] && ids.indexOf(l.id) < 0) ids.push(l.id); }));
  const rows = ids.map(id => {
    const pts = exSeries(S.historique, id); if (!pts.length) return null;
    const kind = trackKind(id, pts), m = TRACK[kind], b = bestOf(pts, kind), e = EX_BY_ID[id], P = pts.slice(-30), tr = trendTxt(P, m);
    const best = kind === "kg" ? "1RM ≈ " + fmtNum(Math.round(b.rm * 2) / 2) + " kg" : b ? m.f(kind === "assist" ? b.as : kind === "reps" ? b.reps : b.d) : "";
    return `<button class="row" data-a="ex-open" data-id="${id}"><div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${plural(pts.length, "séance")}${best ? " · record " + esc(best) : ""}${tr ? " · " + tr : ""}</div></div>${sparkSVG(P, m)}</button>`;
  }).filter(Boolean);
  const recs = recentRecords(60).slice(0, 8);
  const head = monthRecap() + `<button class="card row" data-a="mes-open" style="padding:14px">${icon("chart", "ic rec-ic ch-ic")}<div class="row-main"><div class="row-title">Poids et tour de taille</div><div class="row-sub">${S.mesures.length ? plural(S.mesures.length, "mesure") : "Ajoute ta première mesure"}</div></div>${icon("chev", "ic chev")}</button>`;
  const body = head + (!rows.length ? `<div class="card empty"><p>Termine une séance pour voir tes courbes et tes records par exercice.</p></div>`
    : `${recs.length ? `<div><div class="h3" style="margin-bottom:8px">Records des deux derniers mois</div><div class="list">${recs.map(recRow).join("")}</div></div>` : ""}
      <div><div class="h3" style="margin-bottom:8px">Par exercice</div><p class="small muted" style="margin-bottom:8px">Le 1RM estimé compare des séries différentes (5 × 80 kg ou 10 × 70 kg) : c’est la charge que tu pourrais soulever une fois.</p><div class="list">${rows.join("")}</div></div>`);
  Sheet.open({ key: "prog", title: "Progression", tall: true, body });
}
/* Log d’une séance en cours, au format de l’historique */
/* Journal d’une séance. Depuis le format v2 (3B), chaque série garde la cible de répétitions t, et l’exercice sa base b
   (répétitions prévues au départ, si différentes) : les références peuvent être recalculées depuis l’historique (D3). */
function runLog() { return R.se.items.map((it, i) => Object.assign(it.cool ? { cool: 1 } : it.warm ? { warm: 1 } : {}, { id: it.id, sets: R.log[i].map(x => x.d ? { d: x.d } : Object.assign({ r: x.r, kg: x.kg }, x.rir != null ? { rir: x.rir } : {}, typeof it.reps === "number" ? { t: it.reps } : {})) }, it.base && it.base !== it.reps ? { b: it.base } : {})).filter(x => x.sets.length); }

/* ================= Fichiers : partager, télécharger, copier ================= */
let FX = null;
function fxFile() { return new File([(FX.bom ? "﻿" : "") + FX.make()], FX.name, { type: FX.mime }); }
function canShareFile(name, mime) { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File(["x"], name, { type: mime })] })); } catch (e) { return false; } }
function openFileSheet(o) {
  FX = o;
  const share = canShareFile(o.name, o.mime);
  Sheet.open({ key: "fx", title: o.title, body: `<p class="muted">${o.intro}</p>${o.extra || ""}<button class="btn btn-ghost" data-a="fx-copy">${icon("copy")}Copier le contenu</button>`,
    foot: `${share ? `<button class="btn btn-lg" data-a="fx-share">${icon("share")}Partager</button>` : ""}<button class="btn btn-primary btn-lg" data-a="fx-dl">${icon("download")}Télécharger</button>`, onClose: () => { FX = null; } });
}
/* Rappels : minutes avant la séance (-1 = sans rappel) */
const LS_RAPPEL = "fonte:rappel";
function rappelPref() { try { const v = localStorage.getItem(LS_RAPPEL); return v == null ? 60 : +v; } catch (e) { return 60; } }
function rappelSelect() { const v = rappelPref(); return `<div class="field"><label for="fx-rappel">Rappel</label><select class="inp" id="fx-rappel">${[[-1, "Sans rappel"], [0, "À l’heure de la séance"], [15, "15 min avant"], [30, "30 min avant"], [60, "1 h avant"], [120, "2 h avant"], [1440, "La veille"]].map(([m, l]) => `<option value="${m}" ${m === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>`; }
function openIcs(events, title) {
  openFileSheet({ title, name: "fonte-seances.ics", mime: "text/calendar", make: () => icsExport(events, { alarm: rappelPref() }),
    intro: `${events.length > 1 ? plural(events.length, "séance") + " à venir" : "Cette séance"} dans le calendrier de ton téléphone, avec un rappel. Sur iPhone : « Télécharger », puis « Ajouter tout » dans l’aperçu (ou ouvre le fichier depuis Fichiers). Si tu changes ton planning, exporte à nouveau : les séances déjà ajoutées sont mises à jour.`,
    extra: rappelSelect() });
}

/* ================= Sauvegarde : rappel ================= */
/* Dates de sauvegarde et de report du rappel : propres à chaque profil (une sauvegarde contient un profil) */
const LS_BK = "backup", LS_BKS = "bksnooze";
function lsNum(k) { try { return +(localStorage.getItem(storeKey(k)) || 0); } catch (e) { return 0; } }
function markBackup() { try { localStorage.setItem(storeKey(LS_BK), String(Date.now())); } catch (e) { } }
function backupDue() {
  if (Sync.state === "live") return null;
  if (Acct.saved()) return null; /* D1 : sauvegarde en ligne active et à jour (moins de 7 jours) : plus besoin du rappel */
  return backupDueAt(S.historique, lsNum(LS_BK), lsNum(LS_BKS), Date.now());
}
/* Fichier de sauvegarde complet : profil, séances, historique, records, notes, mesures, agenda */
function backupName() { return "fonte-sauvegarde-" + todayISO() + ".json"; }
function backupFile() { return new File([JSON.stringify(dataPayload())], backupName(), { type: "application/json" }); }
/* Un toucher : feuille de partage iOS (Enregistrer dans Fichiers / iCloud Drive, AirDrop, Messages…), sinon téléchargement */
function shareBackup() {
  let f = null;
  try { f = backupFile(); } catch (e) { toast("Sauvegarde impossible ici : copie plutôt le code."); return; }
  let can = false; try { can = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [f] })); } catch (e) { }
  const done = msg => { markBackup(); try { localStorage.removeItem(storeKey(LS_BKS)); } catch (e) { } Sheet.closeAll(); render(); toast(msg); };
  if (can) { navigator.share({ files: [f], title: "Sauvegarde Fonte" }).then(() => done("Sauvegarde enregistrée"), () => { }); return; }
  try {
    const url = URL.createObjectURL(f), a = document.createElement("a");
    a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    done("Fichier de sauvegarde téléchargé");
  } catch (e) { toast("Sauvegarde impossible ici : copie plutôt le code."); }
}
function backupAgo() { const t = lsNum(LS_BK); if (!t) return "Aucune sauvegarde pour l’instant"; const d = Math.floor((Date.now() - t) / 864e5); return "Dernière sauvegarde : " + (d === 0 ? "aujourd’hui" : d === 1 ? "hier" : "il y a " + d + " jours"); }
/* Résumé d’une sauvegarde avant de remplacer les données du téléphone */
function parseBackup(raw) {
  raw = String(raw || "").trim();
  try { const m = raw.replace(/\s/g, "").match(/FONTEDATA1\.([A-Za-z0-9_-]+)/); const o = m ? JSON.parse(b64d(m[1])) : JSON.parse(raw); return o && typeof o === "object" && o.profile ? o : null; } catch (e) { return null; }
}
function backupSummary(o) {
  const n = k => (Array.isArray(o[k]) ? o[k].length : 0);
  return `Sauvegarde${o.at ? " du " + fmtDay(toISO(new Date(o.at))) : ""}${o.profile && o.profile.prenom ? " · " + esc(o.profile.prenom) : ""} : ${plural(n("historique"), "séance")} dans l’historique, ${plural(n("mesSeances"), "séance perso")}, ${plural(n("agenda"), "séance prévue")}${n("mesures") ? ", " + plural(n("mesures"), "mesure") : ""}.`;
}

/* ================= Personnes / agenda ================= */
const P_COLORS = ["var(--blue)", "var(--yellow)", "var(--green)", "var(--violet)"];
const NAMES = {};
function people() {
  const list = [{ key: "me", name: "Moi", color: "var(--accent)", events: S.agenda, mine: true }];
  const ids = Object.keys(S.partners).sort();
  ids.forEach((id, i) => { const p = S.partners[id]; list.push({ key: "u:" + id, name: p.prenom || NAMES[id] || "Partenaire", color: P_COLORS[i % 4], events: p.events || [], kind: "live" }); });
  S.imports.forEach((im, j) => list.push({ key: "i:" + im.id, name: im.nom || "Agenda importé", color: P_COLORS[(ids.length + j) % 4], events: im.events || [], kind: "import" }));
  return list;
}
const isVisible = p => !S.hidden[p.key];
const byTime = (a, b) => (a.heure || "99").localeCompare(b.heure || "99");
/* cleanEvents (agenda reçu d’une sauvegarde ou d’un autre appareil) : dans engine-user.js */

/* ================= Synchronisation (db) ================= */
const Sync = {
  state: "init", db: null, user: null, uid: null, gotServer: false, timers: {}, busy: {}, again: {}, dirty: {}, ro: {},
  set(st) { if (this.state === st) return; this.state = st; softRender(); },
  async init() {
    const c = window.claude;
    if (!c || typeof c.use !== "function") { this.set("local"); return; }
    /* profils (3B) : seul le profil relié à ce compte se synchronise ; les autres restent sur l’appareil (rien ne se mélange) */
    if (!isSyncOwner()) { this.set("local"); return; }
    let db = null, user = null;
    try { [db, user] = await Promise.all([c.use("db"), c.use("user")]); } catch (e) { db = null; }
    if (!db || !user) { this.set("local"); return; }
    let id = null;
    try { id = await user.id(); } catch (e) { id = null; }
    if (!id) { this.set("local"); return; }
    this.db = db; this.user = user; this.uid = id; this.set("connecting");
    this.loadTimer = setTimeout(() => { if (!this.gotServer) this.set("slow"); }, 10000);
    try {
      this.privRef = db.doc("data/users/" + id + "/etat");
      this.agRef = db.doc("agenda/" + id);
      this.privRef.onSnapshot(s => this.onPriv(s), e => this.onErr(e));
      db.collection("agenda").onSnapshot(q => this.onAgenda(q), e => this.onErr(e));
    } catch (e) { this.set("local"); return; }
    window.addEventListener("online", () => { if (this.state === "offline") this.set("live"); this.flush(); });
    window.addEventListener("offline", () => { if (this.state === "live") this.set("offline"); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) this.flush(); });
  },
  confirm(meta) {
    if (meta && !meta.fromCache && !this.gotServer) {
      this.gotServer = true; clearTimeout(this.loadTimer);
      if (this.state !== "readonly") this.set(navigator.onLine === false ? "offline" : "live");
    }
  },
  onErr(e) { if (e && e.code === "revoked") { this.db = null; this.set("local"); } else if (!this.gotServer) this.set("slow"); },
  onPriv(snap) {
    this.confirm(snap.metadata);
    if (snap.metadata && snap.metadata.hasPendingWrites) return;
    if (!snap.exists) { if (!snap.metadata.fromCache && hasPrivData()) this.queue("priv", 0); return; }
    const raw = snap.data() || {}, mg = migrate(raw); /* données reçues : passent par migrate ; format plus récent : ignorées */
    if (mg.error) return;
    const r = mg.data, ru = r.upd || 0;
    if (ru > (S.upd || 0)) { adoptPriv(r); saveLocal(); softRender(); }
    else if (ru < (S.upd || 0) && !snap.metadata.fromCache) this.queue("priv", 0);
  },
  onAgenda(q) {
    this.confirm(q.metadata);
    const partners = {}; let mine = null;
    q.docs.forEach(d => {
      if (d.id === this.uid) { mine = d; return; }
      const x = d.data(); if (!x || typeof x !== "object") return;
      partners[d.id] = { events: cleanEvents(x.events), prenom: typeof x.prenom === "string" ? x.prenom.slice(0, 40) : "", upd: x.upd || 0 };
    });
    S.partners = partners;
    if (mine) {
      if (!(mine.metadata && mine.metadata.hasPendingWrites)) {
        const r = mine.data() || {};
        if ((r.upd || 0) > (S.agUpd || 0)) { S.agenda = cleanEvents(r.events); S.agUpd = r.upd; }
        else if ((r.upd || 0) < (S.agUpd || 0) && !q.metadata.fromCache) this.queue("ag", 0);
      }
    } else if (!q.metadata.fromCache && (S.agenda.length || S.profile.prenom)) this.queue("ag", 0);
    saveLocal(); refreshNames(); softRender();
  },
  queue(kind, delay) {
    if (!this.db || this.ro[kind]) return;
    this.dirty[kind] = true;
    clearTimeout(this.timers[kind]);
    this.timers[kind] = setTimeout(() => this.push(kind), delay == null ? 1200 : delay);
  },
  flush() { ["priv", "ag"].forEach(k => { if (this.dirty[k]) this.queue(k, 0); }); },
  async push(kind, retried) {
    if (!this.db || this.ro[kind]) return;
    if (this.busy[kind]) { this.again[kind] = true; return; }
    this.busy[kind] = true;
    try {
      if (kind === "priv") await this.privRef.set(privPayload());
      else await this.agRef.set(agPayload());
      this.dirty[kind] = false;
      if (this.state === "offline" || this.state === "slow") this.set("live");
    } catch (e) {
      const code = e && e.code;
      if (code === "invalid_argument") { this.ro[kind] = true; this.dirty[kind] = false; if (kind === "ag") this.set("readonly"); }
      else if (code === "unavailable" && !retried) { this.busy[kind] = false; setTimeout(() => this.push(kind, true), 2000 + Math.random() * 2000); return; }
      else if (code === "revoked") { this.db = null; this.set("local"); }
      else if (code === "quota_exceeded") toast("Espace de synchronisation plein : supprime d’anciennes séances de l’historique.");
      else if (navigator.onLine === false) this.set("offline");
    }
    this.busy[kind] = false;
    if (this.again[kind]) { this.again[kind] = false; this.push(kind); }
  }
};
function hasPrivData() { return S.mesSeances.length || S.historique.length || S.profile.sexe || S.profile.prenom || S.imports.length; }
function privPayload() {
  let hist = S.historique.slice(0, 150);
  let p = { v: SCHEMA_VERSION, upd: S.upd || Date.now(), profile: S.profile, mesSeances: S.mesSeances.slice(0, 100), historique: hist, lastPerf: S.lastPerf, refs: S.refs, legacyRefs: S.legacyRefs, legacySrc: S.legacySrc, notes: S.notes, mesures: S.mesures.slice(-300), deload: S.deload, imports: S.imports.slice(0, 6), histDel: S.histDel, histClear: S.histClear || 0 };
  while (JSON.stringify(p).length > 230000 && hist.length > 10) { hist = hist.slice(0, Math.floor(hist.length * 0.7)); p.historique = hist; }
  return p;
}
function agPayload() {
  const from = addDays(todayISO(), -120);
  return { v: 1, upd: S.agUpd || Date.now(), prenom: (S.profile.prenom || "").slice(0, 40), events: S.agenda.filter(e => e.date >= from).slice(0, 500) };
}
function adoptPriv(r) {
  if (r.profile && typeof r.profile === "object") S.profile = normProfile(r.profile);
  if (Array.isArray(r.mesSeances)) S.mesSeances = r.mesSeances.filter(m => m && Array.isArray(m.items));
  // Suppressions : les séances supprimées (histDel) s'additionnent, l'effacement complet (histClear) suit la version la plus récente
  if (r.histDel && typeof r.histDel === "object" && !Array.isArray(r.histDel)) S.histDel = pruneDel(Object.assign({}, S.histDel, r.histDel));
  if (typeof r.histClear === "number") S.histClear = r.histClear;
  const clr = S.histClear || 0;
  if (Array.isArray(r.historique)) {
    const map = {}; S.historique.concat(r.historique).forEach(h => { if (h && h.id) map[h.id] = h; });
    S.historique = Object.values(map).filter(h => !S.histDel[h.id] && (h.ts || 0) > clr).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    S.historique = trimHist(S.historique);
  }
  if (r.lastPerf && typeof r.lastPerf === "object") S.lastPerf = Object.assign({}, S.lastPerf, r.lastPerf);
  if (isObj(r.refs)) S.refs = Object.assign({}, S.refs, r.refs);
  if (isObj(r.legacyRefs) && !Object.keys(S.legacyRefs).length) { S.legacyRefs = r.legacyRefs; if (isObj(r.legacySrc)) S.legacySrc = r.legacySrc; }
  if (clr) Object.keys(S.lastPerf).forEach(id => { const lp = S.lastPerf[id]; const t = lp && (lp.ts || (typeof lp.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(lp.d) ? fromISO(lp.d).getTime() : 0)); if (!t || t <= clr) delete S.lastPerf[id]; });
  if (isObj(r.notes)) S.notes = r.notes;
  if (Array.isArray(r.mesures)) S.mesures = r.mesures.filter(m => m && typeof m.date === "string");
  if (isObj(r.deload)) S.deload = r.deload;
  if (Array.isArray(r.imports)) S.imports = r.imports;
  S.upd = r.upd || S.upd;
}
function pruneDel(m) {
  const ks = Object.keys(m); if (ks.length <= 300) return m;
  const out = {}; ks.sort((a, b) => m[b] - m[a]).slice(0, 300).forEach(k => { out[k] = m[k]; }); return out;
}
async function refreshNames() {
  if (!Sync.user) return;
  const ids = Object.keys(S.partners); if (!ids.length) return;
  try {
    const ps = await Sync.user.profiles(ids); let ch = false;
    ids.forEach(id => { const n = ps[id] && ps[id].name; if (n && NAMES[id] !== n) { NAMES[id] = n; ch = true; } });
    if (ch) softRender();
  } catch (e) { }
}
function statusHTML() {
  const m = {
    init: ["warn", "Démarrage…"], connecting: ["warn", "Connexion à ton compte…"], live: ["ok", "Synchronisé avec ton compte Claude"],
    slow: ["warn", "Connexion lente : tout reste enregistré sur ce téléphone"], offline: ["warn", "Hors ligne : tout est enregistré sur ce téléphone, la synchro reprendra seule"],
    local: PWA ? ["ok", "Enregistré sur ce téléphone, fonctionne sans réseau"] : ["", "Mode local : tes données restent sur cet appareil"], readonly: ["warn", "Lecture seule : tu vois les agendas partagés, tes ajouts restent sur ce téléphone"]
  }[Sync.state] || ["", ""];
  return `<div class="status ${m[0]}"><i></i><span>${m[1]}</span></div>`;
}

/* ================= Synchro automatique (version installée, Firebase) ================= */
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
/* Règles Firestore (à coller dans la console Firebase, Firestore › Règles). Testées avec l’émulateur Firebase : tests/regles/run.js.
   - données personnelles (users/{uid} et ses séances) : lues et écrites seulement par leur propriétaire, connecté avec un vrai compte
     (e-mail + mot de passe) ; la connexion anonyme n’y a pas accès ; champs et tailles bornés ; heure du serveur obligatoire (srv) ;
   - agenda partagé : lu par les comptes e-mail connectés qui connaissent l’espace, chacun n’écrit que son propre agenda (500 séances au plus) ;
     un ancien agenda anonyme peut encore être retiré par son appareil ;
   - tout le reste est refusé. */
const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function compte() {
      return request.auth != null && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    function moi(uid) { return compte() && request.auth.uid == uid; }
    function texte(d, k, max) { return !(k in d) || (d[k] is string && d[k].size() <= max); }
    match /users/{uid} {
      allow read, delete: if moi(uid);
      allow create, update: if moi(uid)
        && request.resource.data.keys().hasOnly(['v', 'app', 'upd', 'agUpd', 'u', 'srv', 'profile', 'notes', 'mesures', 'mesSeances', 'deload', 'imports', 'agenda', 'legacy', 'clear'])
        && request.resource.data.v is int && request.resource.data.srv == request.time
        && (!('u' in request.resource.data) || request.resource.data.u is map)
        && texte(request.resource.data, 'profile', 20000) && texte(request.resource.data, 'notes', 100000)
        && texte(request.resource.data, 'mesures', 200000) && texte(request.resource.data, 'mesSeances', 300000)
        && texte(request.resource.data, 'deload', 5000) && texte(request.resource.data, 'imports', 200000)
        && texte(request.resource.data, 'agenda', 200000) && texte(request.resource.data, 'legacy', 300000)
        && texte(request.resource.data, 'clear', 50000);
      match /seances/{sid} {
        allow read, delete: if moi(uid);
        allow create, update: if moi(uid) && sid.size() <= 40
          && request.resource.data.keys().hasOnly(['v', 'upd', 'del', 'j', 'srv'])
          && request.resource.data.v is int && request.resource.data.upd is number
          && request.resource.data.srv == request.time
          && ('j' in request.resource.data || 'del' in request.resource.data)
          && texte(request.resource.data, 'j', 200000)
          && (!('del' in request.resource.data) || request.resource.data.del is number);
      }
    }
    match /espaces/{espace}/agendas/{membre} {
      allow read: if compte();
      allow create, update: if compte() && request.auth.uid == membre
        && request.resource.data.keys().hasOnly(['v', 'upd', 'prenom', 'events'])
        && request.resource.data.events is list && request.resource.data.events.size() <= 500
        && (!('prenom' in request.resource.data) || (request.resource.data.prenom is string && request.resource.data.prenom.size() <= 40));
      allow delete: if request.auth != null && request.auth.uid == membre;
    }
  }
}`;
const loaded = {};
function loadScript(src) {
  if (loaded[src]) return loaded[src];
  loaded[src] = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = src; sc.async = false; sc.onload = res; sc.onerror = () => { delete loaded[src]; rej({ code: "script" }); }; document.head.appendChild(sc); });
  return loaded[src];
}
function parseFbConfig(raw) {
  const txt = String(raw || ""), cfg = {};
  const re = /["']?(apiKey|authDomain|projectId|storageBucket|messagingSenderId|appId)["']?\s*:\s*["']([^"']+)["']/g;
  let m; while ((m = re.exec(txt))) cfg[m[1]] = m[2].trim();
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  if (!cfg.authDomain) cfg.authDomain = cfg.projectId + ".firebaseapp.com";
  return cfg;
}
function randomId(n) { const a = "abcdefghijkmnopqrstuvwxyz23456789"; let s = ""; const r = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(r); r.forEach(x => { s += a[x % a.length]; }); return s; }
const Cloud = {
  state: "off", cfg: null, space: null, app: null, db: null, uid: null, col: null, unsub: null, timer: null, starting: false, err: "", shared: false,
  /* 3C : ce profil écrit son propre agenda s’il est connecté à son compte ; sinon, comme avant, seul le profil relié à l’appareil (owner) l’écrit */
  mine() { return this.shared || isSyncOwner(); },
  async restart() { await this.stop(); this.state = "off"; this.err = ""; return this.start(); },
  load() { try { const x = JSON.parse(localStorage.getItem("fonte:sync") || "null"); if (x && x.cfg && x.space) { this.cfg = x.cfg; this.space = x.space; } } catch (e) { } },
  save() { try { if (this.cfg) localStorage.setItem("fonte:sync", JSON.stringify({ cfg: this.cfg, space: this.space })); else localStorage.removeItem("fonte:sync"); } catch (e) { } },
  set(st) { if (this.state !== st) { this.state = st; softRender(); } },
  async start() {
    if (!this.cfg || !this.space || this.starting || this.col) return;
    this.starting = true; this.err = ""; this.set("connecting");
    try {
      await loadScript(FB + "firebase-app-compat.js");
      await loadScript(FB + "firebase-auth-compat.js");
      await loadScript(FB + "firebase-firestore-compat.js");
      const fb = window.firebase;
      if (!fb || !fb.initializeApp) throw { code: "script" };
      if (Acct.user && Acct.app) { /* compte e-mail du profil (3C) : même connexion que la sauvegarde en ligne */
        this.shared = true; this.app = Acct.app; this.db = Acct.db; this.uid = Acct.user.uid;
      } else {
        this.shared = false;
        this.app = fb.apps.find(a => a.name === "fonte") || fb.initializeApp(this.cfg, "fonte");
        const auth = this.app.auth();
        this.db = this.app.firestore();
        try { await this.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { }
        let user = await new Promise(res => { const u = auth.onAuthStateChanged(x => { u(); res(x); }); });
        if (!user) user = (await auth.signInAnonymously()).user;
        this.uid = user.uid;
      }
      this.col = this.db.collection("espaces").doc(this.space).collection("agendas");
      this.unsub = this.col.onSnapshot({ includeMetadataChanges: true }, qs => this.onSnap(qs), e => this.fail(e));
      this.queue(300);
    } catch (e) { this.fail(e); }
    this.starting = false;
  },
  async stop() {
    clearTimeout(this.timer);
    try { if (this.unsub) this.unsub(); } catch (e) { }
    try { if (this.app && !this.shared) await this.app.delete(); } catch (e) { } /* l’app du compte du profil (Acct) n’est jamais fermée ici */
    this.unsub = null; this.col = null; this.db = null; this.app = null; this.uid = null; this.shared = false;
  },
  onSnap(qs) {
    const fromCache = qs.metadata && qs.metadata.fromCache;
    if (!fromCache) this.err = "";
    this.set(fromCache ? (navigator.onLine === false ? "offline" : "connecting") : "live");
    const partners = {}; let mine = null, owner = this.mine();
    qs.docs.forEach(d => {
      if (d.id === this.uid && owner) { mine = d; return; } /* autre profil de cet appareil : l’agenda du profil relié apparaît comme celui d’un partenaire */
      const x = d.data() || {};
      partners[d.id] = { events: cleanEvents(x.events), prenom: typeof x.prenom === "string" ? x.prenom.slice(0, 40) : "", upd: x.upd || 0 };
    });
    S.partners = partners;
    if (mine && !(mine.metadata && mine.metadata.hasPendingWrites)) {
      const r = mine.data() || {};
      if ((r.upd || 0) > (S.agUpd || 0)) { S.agenda = cleanEvents(r.events); S.agUpd = r.upd; }
    } else if (!mine && !fromCache && owner) this.queue(0);
    saveLocal(); softRender();
  },
  queue(delay) {
    if (!this.cfg || !this.mine()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), delay == null ? 800 : delay);
  },
  push() {
    if (!this.col || !this.uid || !this.mine()) return;
    const from = addDays(todayISO(), -120);
    this.col.doc(this.uid).set({ v: 1, upd: S.agUpd || Date.now(), prenom: (S.profile.prenom || "").slice(0, 40), events: S.agenda.filter(e => e.date >= from).slice(0, 500) }).catch(e => this.fail(e));
  },
  fail(e) {
    const c = String((e && e.code) || "");
    if (c === "unavailable" || c === "auth/network-request-failed" || c === "script") { this.err = c === "script" ? "Connecte-toi à internet une première fois pour activer la synchro." : ""; this.set("offline"); if (c !== "unavailable") { this.stop(); } return; }
    const msg = {
      "permission-denied": this.shared ? "Firebase refuse l’accès : publie les nouvelles règles Firestore (Profil › Sauvegarde en ligne › Règles Firestore)." : "Firebase refuse l’accès. Depuis les nouvelles règles, l’agenda partagé est réservé aux comptes : crée ton compte dans Profil › Sauvegarde en ligne (sinon, vérifie que les règles Firestore sont publiées).",
      "auth/operation-not-allowed": "Active la connexion « Anonyme » dans Firebase, rubrique Authentication (étape 2).",
      "auth/admin-restricted-operation": "Active la connexion « Anonyme » dans Firebase, rubrique Authentication (étape 2).",
      "auth/configuration-not-found": "Ouvre Authentication dans Firebase, touche « Commencer », puis active « Anonyme » (étape 2).",
      "auth/invalid-api-key": "Configuration incorrecte : recopie le bloc firebaseConfig en entier.",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Configuration incorrecte : recopie le bloc firebaseConfig en entier.",
      "not-found": "Base Firestore introuvable : crée-la dans Firebase (étape 3).",
      "failed-precondition": "Base Firestore introuvable ou pas encore prête : crée-la dans Firebase (étape 3)."
    }[c] || "La synchro a rencontré un problème" + (c ? " (" + c + ")" : "") + ". Vérifie la configuration Firebase.";
    this.err = msg; this.set("error");
    if (c.indexOf("auth/") === 0 || c === "permission-denied") this.stop();
  },
  async activate(cfg, space) { await this.stop(); this.cfg = cfg; this.space = space; this.save(); this.start(); },
  async leave() { const col = this.col, uid = this.uid; if (col && uid) { try { await Promise.race([col.doc(uid).delete(), new Promise(r => setTimeout(r, 5000))]); } catch (e) { } } await this.stop(); this.cfg = null; this.space = null; this.save(); S.partners = {}; this.state = "off"; this.err = ""; saveLocal(); render(); },
  invite() { return "FONTESYNC1." + b64e(JSON.stringify({ c: { apiKey: this.cfg.apiKey, authDomain: this.cfg.authDomain, projectId: this.cfg.projectId, appId: this.cfg.appId }, s: this.space })); }
};
function parseInvite(raw) {
  const m = String(raw || "").replace(/\s/g, "").match(/FONTESYNC1\.([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try { const o = JSON.parse(b64d(m[1])); if (o && o.c && o.c.apiKey && o.c.projectId && o.c.appId && typeof o.s === "string" && /^[a-z0-9]{12,40}$/.test(o.s)) return o; } catch (e) { }
  return null;
}
function cloudCard() {
  if (!Cloud.mine() && Cloud.cfg && !Acct.user) return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="h3">Synchronisation automatique</div><p class="small muted">La synchro de l’agenda de cet appareil est reliée au profil ${esc(ownerName())}. Ce profil-ci voit son agenda et ceux des partenaires, mais ses propres séances restent sur ce téléphone. Pour régler la synchro, passe sur le profil ${esc(ownerName())}, ou crée un compte pour ce profil (Profil › Sauvegarde en ligne) : il aura alors son propre agenda partagé.</p></div>`;
  if (!Cloud.cfg) return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="h3">Synchronisation automatique</div><p class="small">Vos agendas se mettent à jour tout seuls, sans code à renvoyer. Il faut une base de données gratuite Firebase, à créer une seule fois avec ton compte Google (une dizaine de minutes). Ta copine, elle, n’a qu’à coller ton invitation.</p><div class="btn-row"><button class="btn btn-primary" data-a="cl-setup">Configurer</button><button class="btn" data-a="cl-join">J’ai une invitation</button></div></div>`;
  const st = { off: ["", "Synchro arrêtée"], connecting: ["warn", "Connexion…"], live: ["ok", "Synchronisé : les agendas se mettent à jour tout seuls"], offline: ["warn", "Hors ligne : tes changements partiront au retour du réseau"], error: ["warn", "Synchro en pause"] }[Cloud.state] || ["", ""];
  const names = Object.keys(S.partners).map(id => S.partners[id].prenom || "Sans prénom");
  return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="h3">Synchronisation automatique</div><div class="status ${st[0]}"><i></i><span>${st[1]}</span></div>${Cloud.err ? `<p class="small" style="color:var(--red)">${esc(Cloud.err)}</p>` : ""}
    <p class="small muted">Dans l’espace : toi${names.length ? ", " + names.map(esc).join(", ") : " (personne d’autre pour l’instant : envoie l’invitation)"}.${S.profile.prenom ? "" : " Ajoute ton prénom dans Profil pour qu’on te reconnaisse."}</p>
    <div class="btn-row"><button class="btn btn-primary" data-a="cl-invite">${icon("share")}Inviter</button>${Cloud.state === "error" || Cloud.state === "off" || (Cloud.state === "offline" && !Cloud.col) ? `<button class="btn" data-a="cl-retry">${icon("refresh")}Réessayer</button>` : ""}<button class="btn btn-danger" data-a="cl-leave">Quitter</button></div></div>`;
}
function setupBody() {
  return `<p class="muted">À faire une seule fois, sur ton téléphone ou un ordi, avec ton compte Google. Firebase est gratuit pour cet usage.</p>
  <ol class="steps">
    <li><span>Va sur <b>console.firebase.google.com</b>, crée un projet (par exemple « fonte »). Tu peux désactiver Google Analytics.</span></li>
    <li><span>Menu <b>Authentication</b> : touche « Commencer », onglet « Sign-in method », active <b>Adresse e-mail/Mot de passe</b> et <b>Anonyme</b>, et enregistre.</span></li>
    <li><span>Menu <b>Firestore Database</b> : « Créer une base de données », choisis un emplacement en Europe, mode production.</span></li>
    <li><span>Dans Firestore, onglet <b>Règles</b> : remplace tout par les règles ci-dessous, puis « Publier ».</span></li>
    <li><span>Roue dentée, <b>Paramètres du projet</b> : sous « Vos applications », touche l’icône Web (&lt;/&gt;), donne un nom, enregistre, puis copie le bloc <b>firebaseConfig</b> et colle-le ici.</span></li>
  </ol>
  <div class="field"><div class="lbl">Règles Firestore</div><textarea class="code-box" id="rules-box" readonly style="min-height:150px">${esc(RULES)}</textarea><button class="btn" data-a="copy-rules">${icon("copy")}Copier les règles</button></div>
  <div class="field"><label for="fb-cfg">Configuration Firebase</label><textarea class="code-box" id="fb-cfg" placeholder="const firebaseConfig = { apiKey: &quot;…&quot;, … };"></textarea><p class="small" id="fb-err" style="color:var(--red)" hidden></p></div>`;
}

/* ================= Sauvegarde en ligne par compte (phase 3C : D1, D7, D9) =================
   Un compte e-mail + mot de passe par profil, une « app » Firebase par profil (« fonte-<id> » : chaque profil garde sa propre connexion),
   état de synchro dans fonte:p:<id>:sync. Ce qui décide (fusion, corbeille, limiteur, quoi envoyer) est dans engine-sync.js et testé en Node ;
   ici : la connexion à Firebase et l’écran. Le téléphone reste la référence : sans réseau tout continue, et rien n’est retiré en cas d’erreur. */
const withTO = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms || 25000))]);
const Acct = {
  state: "off", err: "", meta: csMeta(null), app: null, auth: null, db: null, user: null, busy: false, again: false, timer: null, pending: 0,
  ok() { return PWA && STORE.mode === "v2" && !!STORE.pid && !STORE_BLOCK; },
  key() { return pKey(STORE.pid, "sync"); },
  load() { if (!this.ok()) return; try { this.meta = csMeta(JSON.parse(localStorage.getItem(this.key()) || "null")); } catch (e) { this.meta = csMeta(null); } },
  save() { if (!this.ok()) return; try { localStorage.setItem(this.key(), JSON.stringify(this.meta)); } catch (e) { } },
  cfg() { return this.meta.cfg || Cloud.cfg; },
  /* sauvegarde en ligne active et à jour depuis moins de 7 jours (le rappel de sauvegarde fichier n’est alors plus utile) */
  saved() { return !!this.user && !this.pending && this.meta.last > Date.now() - 7 * 864e5; },
  set(st, err) { const ch = this.state !== st || this.err !== (err || ""); this.state = st; this.err = err || ""; if (ch) softRender(); },
  async ensureApp(cfg) {
    await loadScript(FB + "firebase-app-compat.js"); await loadScript(FB + "firebase-auth-compat.js"); await loadScript(FB + "firebase-firestore-compat.js");
    const fb = window.firebase; if (!fb || !fb.initializeApp) throw { code: "script" };
    const name = "fonte-" + STORE.pid;
    this.app = fb.apps.find(a => a.name === name) || fb.initializeApp(cfg, name);
    this.auth = this.app.auth(); this.db = this.app.firestore();
    return fb;
  },
  /* Au démarrage : la connexion du profil est retrouvée (Firebase la garde sur l’appareil, même hors ligne) */
  async boot() {
    const cfg = this.cfg(); if (!this.ok() || !cfg || !this.meta.email) return false;
    this.set("connecting");
    try {
      await this.ensureApp(cfg);
      const u = await withTO(new Promise(res => { const off = this.auth.onAuthStateChanged(x => { off(); res(x); }); }), 15000);
      if (!u || u.isAnonymous) { this.user = null; this.set("off"); return false; }
      this.user = u; if (this.meta.uid !== u.uid) { this.meta = Object.assign(csMetaReset(this.meta), { uid: u.uid }); this.save(); }
      this.sync(); return true;
    } catch (e) { this.fail(e); return false; }
  },
  /* compte anonyme de l’appareil (agenda partagé, connexion d’avant 3C), s’il appartient à ce profil */
  anon() { const a = Cloud.app && !Cloud.shared && isSyncOwner() && Cloud.app.auth().currentUser; return a && a.isAnonymous ? a : null; },
  /* Création : le compte anonyme de l’appareil est relié au nouveau compte (même identifiant : l’agenda partagé continue) */
  async create(email, pw, cfg) {
    const fb = await this.ensureApp(cfg), anon = this.anon();
    let u;
    if (anon) {
      await anon.linkWithCredential(fb.auth.EmailAuthProvider.credential(email, pw));
      u = (await this.auth.signInWithEmailAndPassword(email, pw)).user;
      try { await Cloud.app.auth().signOut(); } catch (e) { }
    } else u = (await this.auth.createUserWithEmailAndPassword(email, pw)).user;
    await this.connected(u, email, cfg);
  },
  /* Connexion à un compte existant (nouvel appareil, réinstallation) : l’ancien agenda anonyme de cet appareil est retiré */
  async login(email, pw, cfg) {
    await this.ensureApp(cfg);
    const anon = this.anon(), col = Cloud.col;
    const u = (await this.auth.signInWithEmailAndPassword(email, pw)).user;
    if (anon && anon.uid !== u.uid) {
      try { if (col) await withTO(col.doc(anon.uid).delete(), 5000); } catch (e) { }
      try { await Cloud.app.auth().signOut(); } catch (e) { }
    }
    await this.connected(u, email, cfg);
  },
  async connected(u, email, cfg) {
    if (this.meta.uid && this.meta.uid !== u.uid) this.meta = csMetaReset(this.meta);
    Object.assign(this.meta, { cfg: { apiKey: cfg.apiKey, authDomain: cfg.authDomain || cfg.projectId + ".firebaseapp.com", projectId: cfg.projectId, appId: cfg.appId }, email, uid: u.uid });
    this.user = u; this.save();
    if (Cloud.cfg) Cloud.restart();
    await this.sync();
  },
  async reset(email, cfg) { await this.ensureApp(cfg); await this.auth.sendPasswordResetEmail(email); },
  /* Déconnexion : les données restent sur l’appareil ; l’e-mail est gardé pour se reconnecter */
  async logout() {
    clearTimeout(this.timer);
    try { if (this.auth) await this.auth.signOut(); } catch (e) { }
    this.meta = csMetaReset(this.meta); this.user = null; this.pending = 0; this.save(); this.set("off");
    if (Cloud.cfg) Cloud.restart();
  },
  queue(delay) { if (!this.user) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), delay == null ? 2000 : delay); },
  async sync() {
    if (!this.user || !this.ok()) return;
    if (this.busy) { this.again = true; return; }
    /* pas pendant une séance ou l’édition d’une séance : l’état n’est jamais remplacé sous les yeux ; ce sera fait juste après */
    if (!$("#runner").hidden || !$("#editor").hidden) { this.queue(30000); return; }
    if (navigator.onLine === false) { this.pending = csPending(S, this.meta, Date.now()); this.set("offline"); return; }
    this.busy = true; if (this.state !== "ok") this.set("connecting");
    let r;
    try { r = await csRun({ api: this.api(), meta: this.meta, now: () => Date.now(), getState: () => S, setState: (st, rep) => applyCloud(st, rep), saveMeta: m => { this.meta = m; this.save(); } }); }
    catch (e) { r = { status: "erreur", error: e, pending: this.pending }; }
    this.busy = false; this.pending = r.pending || 0;
    if (r.status === "ok") this.set(this.pending ? "offline" : "ok");
    else if (r.status === "limite") { this.set("limite"); this.queue(65000); }
    else if (r.status === "plus-recent") this.set("plus-recent");
    else if (r.status === "trop-gros") this.set("error", "Ton profil est trop gros pour la sauvegarde en ligne (séances perso, mesures…). Tes séances, elles, sont sauvegardées. Fais aussi une sauvegarde fichier.");
    else this.fail(r.error);
    if (this.again) { this.again = false; this.queue(500); }
  },
  fail(e) {
    const c = String((e && e.code) || "");
    if (["unavailable", "timeout", "deadline-exceeded", "auth/network-request-failed", "script"].indexOf(c) >= 0 || navigator.onLine === false) {
      this.set("offline", c === "script" ? "Connecte-toi à internet une première fois pour activer la sauvegarde en ligne." : ""); return;
    }
    if (c === "unauthenticated" || c === "auth/user-token-expired" || c === "auth/user-disabled") { this.user = null; this.set("off", "Reconnecte-toi à ton compte."); return; }
    this.set("error", acctMsg(c));
  },
  /* Branchement de engine-sync.js sur Firestore : users/{uid} et users/{uid}/seances/{id} */
  api() {
    const fb = window.firebase, ref = this.db.doc("users/" + this.user.uid), col = ref.collection("seances");
    const FV = fb.firestore.FieldValue, TS = fb.firestore.Timestamp;
    const micro = t => (t && typeof t.seconds === "number" ? t.seconds * 1e6 + Math.floor(t.nanoseconds / 1000) : 0); /* heure du serveur, en microsecondes */
    const data = d => { const o = Object.assign({}, d.data() || {}); delete o.srv; return o; };
    return {
      getUser: async () => { const s = await withTO(ref.get({ source: "server" })); return s.exists ? data(s) : null; },
      seancesSince: async c => {
        const out = []; let last = null;
        for (;;) {
          let q = c ? col.where("srv", ">", new TS(Math.floor(c / 1e6), (c % 1e6) * 1000)).orderBy("srv") : col.orderBy("srv");
          if (last) q = q.startAfter(last);
          const qs = await withTO(q.limit(300).get({ source: "server" }));
          qs.docs.forEach(d => out.push({ id: d.id, data: data(d), srv: micro(d.get("srv")) }));
          if (qs.docs.length < 300) return out;
          last = qs.docs[qs.docs.length - 1];
        }
      },
      commit: async ops => {
        const u = ops.find(x => x.t === "user");
        if (u) return withTO(this.db.runTransaction(async t => { /* le profil en ligne ne doit pas avoir changé depuis la lecture */
          const s = await t.get(ref);
          if (!csSameU(s.exists ? (s.data() || {}).u : null, u.expect)) throw { code: "conflit" };
          t.set(ref, Object.assign({}, u.data, { srv: FV.serverTimestamp() }));
        }));
        const b = this.db.batch();
        ops.forEach(x => { if (x.t === "se") b.set(col.doc(x.id), Object.assign({}, x.data, { srv: FV.serverTimestamp() })); else if (x.t === "rm") b.delete(col.doc(x.id)); });
        return withTO(b.commit());
      }
    };
  }
};
function acctMsg(c) {
  return {
    "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail : touche plutôt « Me connecter ».",
    "auth/credential-already-in-use": "Un compte existe déjà avec cet e-mail : touche plutôt « Me connecter ».",
    "auth/provider-already-linked": "Ce profil est déjà relié à un compte : touche « Me connecter ».",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/missing-email": "Écris ton adresse e-mail.",
    "auth/weak-password": "Mot de passe trop court : 6 caractères au moins.",
    "auth/missing-password": "Écris ton mot de passe.",
    "auth/wrong-password": "E-mail ou mot de passe incorrect.", "auth/user-not-found": "E-mail ou mot de passe incorrect.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.", "auth/invalid-login-credentials": "E-mail ou mot de passe incorrect.",
    "auth/too-many-requests": "Trop d’essais : réessaie dans quelques minutes.",
    "auth/operation-not-allowed": "Active « Adresse e-mail/Mot de passe » dans Firebase (Authentication › Sign-in method).",
    "auth/admin-restricted-operation": "Active « Adresse e-mail/Mot de passe » dans Firebase (Authentication › Sign-in method).",
    "auth/configuration-not-found": "Ouvre Authentication dans Firebase, touche « Commencer », puis active « Adresse e-mail/Mot de passe ».",
    "auth/invalid-api-key": "Configuration Firebase incorrecte : recopie le code d’invitation ou le bloc firebaseConfig en entier.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Configuration Firebase incorrecte : recopie le code d’invitation ou le bloc firebaseConfig en entier.",
    "auth/network-request-failed": "Pas de réseau : connecte-toi à internet pour cette étape.",
    "timeout": "Pas de réponse de Firebase : vérifie ta connexion et réessaie.", "script": "Connecte-toi à internet une première fois pour cette étape.",
    "permission-denied": "Firebase refuse l’accès : publie les nouvelles règles Firestore (bouton « Règles Firestore » ci-dessous).",
    "not-found": "Base Firestore introuvable : crée-la dans Firebase.", "failed-precondition": "Base Firestore introuvable ou pas encore prête : crée-la dans Firebase."
  }[c] || "La sauvegarde en ligne a rencontré un problème" + (c ? " (" + c + ")" : "") + ". Rien n’a été retiré de ce téléphone.";
}
/* Résultat d’une synchro appliqué : copie de sécurité (D5) avant de retirer plusieurs séances ou d’effacer l’historique, puis enregistrement */
function applyCloud(st, rep) {
  if (STORE_BLOCK) return;
  if (rep.snapshot) snapshotLocal("sync");
  S = st; saveLocal();
  const n = rep.added.length, k = rep.removed.length;
  if (n || k) toast((n ? plural(n, "séance") + " reçue" + (n > 1 ? "s" : "") : "") + (n && k ? ", " : "") + (k ? plural(k, "séance") + " retirée" + (k > 1 ? "s" : "") + (n ? "" : " (corbeille)") : "") + " depuis ton autre appareil");
  if (!$("#onb").hidden && !onbNeeded()) closeOnb();
  softRender();
}
function agoTxt(t) { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "à l’instant" : m < 60 ? "il y a " + m + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + plural(Math.round(m / 1440), "jour"); }
function acctCard() {
  if (!PWA) return "";
  const head = `<div class="h3">Sauvegarde en ligne</div>`;
  if (!Acct.ok()) return `<section><div class="card" style="display:flex;flex-direction:column;gap:8px">${head}<p class="small muted">Indisponible pour l’instant : ${STORE_BLOCK && STORE_BLOCK.reason === "plus-recent" ? "mets d’abord Fonte à jour" : "les données de ce téléphone attendent leur mise à jour (fais une sauvegarde fichier)"}.</p></div></section>`;
  const priv = `<p class="small muted">Tes données sont dans la base Firebase créée pour Fonte. Personne d’autre ne peut les lire depuis l’appli, mais la personne qui gère ce projet Firebase peut techniquement les voir dans la console Firebase.</p>`;
  if (!Acct.user) {
    const again = Acct.meta.email ? `<p class="small">Compte de ce profil : <b>${esc(Acct.meta.email)}</b> (déconnecté).</p>` : "";
    return `<section><div class="card" style="display:flex;flex-direction:column;gap:12px">${head}${Acct.err ? `<p class="small" style="color:var(--red)">${esc(Acct.err)}</p>` : ""}${again}
      <p class="small">Avec un compte (e-mail + mot de passe), tout ce profil — séances, programme, palier, notes, mesures, agenda — se copie seul en ligne. Sur un nouvel iPhone ou après une réinstallation, tu te connectes et tout revient. Sans réseau, rien ne change : la copie se fait au retour du réseau.</p>
      <div class="btn-row"><button class="btn btn-primary" data-a="ac-open" data-v="new">Créer mon compte</button><button class="btn" data-a="ac-open" data-v="login">Me connecter</button></div>${priv}</div></section>`;
  }
  const st = {
    ok: ["ok", Acct.meta.last ? "Sauvegardé en ligne " + agoTxt(Acct.meta.last) : "Sauvegardé en ligne"],
    connecting: ["warn", "Synchronisation…"],
    offline: ["warn", "En attente du réseau" + (Acct.pending ? " : " + plural(Acct.pending, "changement") + " à envoyer" : "") + ". Tout est enregistré sur ce téléphone."],
    limite: ["warn", "Beaucoup de changements à envoyer : la suite part dans une minute."],
    "plus-recent": ["warn", "Les données en ligne viennent d’une version plus récente de Fonte : mets l’appli à jour. Rien n’a été modifié."],
    error: ["warn", "Sauvegarde en ligne en pause"], off: ["", "Déconnecté"]
  }[Acct.state] || ["", ""];
  return `<section><div class="card" style="display:flex;flex-direction:column;gap:12px">${head}<div class="status ${st[0]}" id="ac-status"><i></i><span>${esc(st[1])}</span></div>${Acct.err ? `<p class="small" style="color:var(--red)">${esc(Acct.err)}</p>` : ""}
    <p class="small muted">Compte : <b>${esc(Acct.meta.email || Acct.user.email || "")}</b>. Les séances supprimées restent 30 jours dans la corbeille (Profil › Données).</p>
    <div class="btn-row"><button class="btn" data-a="ac-sync">${icon("refresh")}Synchroniser maintenant</button><button class="btn" data-a="ac-rules">Règles Firestore</button></div>
    <button class="btn btn-danger" data-a="ac-logout">Me déconnecter</button>${priv}</div></section>`;
}
function acctForm(mode) {
  const login = mode === "login", needCfg = !Acct.cfg();
  const local = S.historique.length || S.mesures.length;
  return `<p class="muted">${login ? "Connecte ce profil à ton compte : tes données en ligne reviennent sur ce téléphone." : "Un compte pour ce profil (une personne = un compte). Garde bien ton mot de passe."}</p>
    ${needCfg ? `<div class="field"><label for="ac-code">Code d’invitation ou configuration Firebase</label><textarea class="code-box" id="ac-code" placeholder="FONTESYNC1.… (bouton « Inviter » sur l’autre téléphone, onglet Agenda) ou le bloc firebaseConfig"></textarea><span class="small muted">Ce téléphone ne connaît pas encore la base Firebase de Fonte : demande le code d’invitation à l’autre téléphone (Agenda › Partager mon agenda › Inviter).</span></div>` : ""}
    <div class="field"><label for="ac-email">E-mail</label><input class="inp" id="ac-email" type="email" autocomplete="email" autocapitalize="off" spellcheck="false" value="${esc(Acct.meta.email || "")}"></div>
    <div class="field"><label for="ac-pw">Mot de passe${login ? "" : " (6 caractères au moins)"}</label><input class="inp" id="ac-pw" type="password" autocomplete="${login ? "current-password" : "new-password"}"></div>
    ${login && local ? `<div class="note">${icon("sparkle")}<span>Ce profil a déjà des séances sur ce téléphone : elles seront ajoutées à celles du compte (rien n’est effacé). Connecte-toi seulement à <b>ton</b> compte.</span></div>` : ""}
    <p class="small" id="ac-err" style="color:var(--red)" hidden></p>
    ${login ? `<button class="link small" data-a="ac-forgot">Mot de passe oublié ?</button>` : ""}`;
}
/* Configuration Firebase pour le formulaire : celle de l’appareil, sinon le code d’invitation (qui rejoint aussi l’agenda partagé) ou le bloc firebaseConfig */
function acctCfgFrom(raw) {
  const have = Acct.cfg(); if (have) return { cfg: have };
  const inv = parseInvite(raw);
  if (inv) return { cfg: Object.assign({}, inv.c, { authDomain: inv.c.authDomain || inv.c.projectId + ".firebaseapp.com" }), space: inv.s };
  const cfg = parseFbConfig(raw); return cfg ? { cfg } : null;
}
function trashBody() {
  const list = (S.corbeille || []).filter(c => c && c.h);
  if (!list.length) return `<p class="muted">La corbeille est vide.</p>`;
  return `<p class="muted">Les séances supprimées restent ici 30 jours, puis sont effacées définitivement (ici et en ligne).</p><div class="list">${list.map(c => `<div class="row"><div class="row-main"><div class="row-title">${esc(c.h.nom || "Séance")}</div><div class="row-sub">Faite le ${esc(fmtDay(c.h.date))} · supprimée ${esc(agoTxt(c.del))}</div></div><button class="btn" style="min-height:36px" data-a="trash-restore" data-id="${esc(c.id)}">Remettre</button></div>`).join("")}</div>`;
}
/* Séance remise depuis la corbeille : références de ses exercices et palier recalculés (comme D3, dans l’autre sens) */
function afterHistRestore(h) {
  const ids = (h.log || []).map(l => l && l.id).filter(Boolean);
  if (ids.length) {
    const rb = rebuildRefs(S.historique, S.legacyRefs, S.legacySrc);
    ids.forEach(id => { if (rb.lastPerf[id]) S.lastPerf[id] = rb.lastPerf[id]; if (rb.refs[id]) S.refs[id] = rb.refs[id]; });
  }
  S.profile = csAddProgress(S.historique, S.profile, h);
}

/* ================= Feuilles, toast ================= */
function lockPage() { const open = Sheet.stack.length || !$("#editor").hidden || !$("#runner").hidden || !$("#onb").hidden; document.documentElement.classList.toggle("lock", !!open); }
const Sheet = {
  stack: [],
  open(o) {
    const top = this.stack[this.stack.length - 1];
    if (top && o.key && top.key === o.key) { this.fill(top, o); return top; }
    const w = document.createElement("div");
    w.className = "sheet-wrap";
    w.innerHTML = `<div class="sheet-bg" data-a="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-top"><h3></h3><button class="btn-icon" data-a="sheet-close" aria-label="Fermer">${icon("x")}</button></div><div class="sheet-body"></div><div class="sheet-foot" hidden></div></div>`;
    $("#sheets").appendChild(w);
    const s = { el: w, key: o.key };
    this.stack.push(s); this.fill(s, o); lockPage(); return s;
  },
  fill(s, o) {
    s.el.querySelector(".sheet-top h3").textContent = o.title || "";
    const b = s.el.querySelector(".sheet-body"); b.innerHTML = o.body || ""; b.scrollTop = 0;
    const f = s.el.querySelector(".sheet-foot"); f.innerHTML = o.foot || ""; f.hidden = !o.foot;
    s.el.querySelector(".sheet").classList.toggle("tall", !!o.tall);
    s.key = o.key; s.onClose = o.onClose || null;
  },
  close() { const s = this.stack.pop(); if (!s) return; s.el.remove(); if (s.onClose) s.onClose(); lockPage(); },
  closeAll() { while (this.stack.length) this.close(); },
  top() { return this.stack[this.stack.length - 1]; },
  body() { const t = this.top(); return t ? t.el.querySelector(".sheet-body") : null; },
  foot() { const t = this.top(); return t ? t.el.querySelector(".sheet-foot") : null; }
};
let toastT = null;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, msg.length > 90 ? 6000 : 2600); }
function arm(el, label) {
  if (el.dataset.armed) return true;
  el.dataset.armed = "1"; const old = el.innerHTML; el.textContent = label || "Touche encore pour confirmer";
  setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = old; } }, 3500);
  return false;
}

/* ================= Rendu principal ================= */
let pendingRender = false;
function render() {
  pendingRender = false;
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-current", b.dataset.t === UI.tab ? "page" : "false"));
  renderHeader();
  $("#view").innerHTML = VIEWS[UI.tab]();
}
function softRender() {
  const a = document.activeElement;
  if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT") && $("#view").contains(a)) { pendingRender = true; return; }
  render();
}
document.addEventListener("focusout", () => { if (pendingRender) { setTimeout(() => { if (!pendingRender) return; const a = document.activeElement; if (!(a && $("#view").contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { render(); } }, 600); } });

function renderHeader() {
  const t = UI.tab, p = S.profile;
  let eb = "", ti = "", ac = "";
  if (t === "accueil") { eb = fmtDay(todayISO()); ti = p.prenom ? "Salut " + esc(p.prenom) : "Bonjour"; const nf = progEvents(todayISO()).length || S.agenda.filter(e => e.date >= todayISO() && !e.fait).length; ac = `<button class="pill-btn" data-a="plan-month" aria-label="Séances programmées sur un mois">${icon("cal")}Programmé${nf ? `<span class="pill-n">${nf}</span>` : ""}</button>`; }
  if (t === "exercices") { eb = EX.length + " exercices"; ti = "Exercices"; }
  if (t === "seances") { eb = UI.seg === "prog" ? "Sur mesure" : UI.seg === "types" ? TPL.length + " séances toutes prêtes" : "Tes séances"; ti = "Séances"; ac = `<button class="btn-icon" data-a="my-new" aria-label="Créer une séance">${icon("plus")}</button>`; }
  if (t === "agenda") { eb = "Planning partagé"; ti = "Agenda"; ac = `<button class="btn-icon" data-a="ev-add" aria-label="Ajouter une séance">${icon("plus")}</button>`; }
  if (t === "profil") { eb = "Séances sur mesure"; ti = "Profil"; }
  $("#hdr").innerHTML = `<div class="hdr-row"><div style="min-width:0"><div class="eyebrow">${eb}</div><h1>${ti}</h1></div><div class="hdr-actions">${ac}</div></div>`;
}

/* ---------- Accueil ---------- */
function evRow(e, person, showDate) {
  const mine = person.mine;
  const ri = mine ? refInfo(e.ref) : null;
  const sub = mine ? (e.fait ? "Fait" : (e.note ? esc(e.note) : (ri ? "Séance prête" : "Moi"))) : esc(person.name) + (e.fait ? " · fait" : "") + (e.note ? " · " + esc(e.note) : "");
  const act = mine && ri && !e.fait ? `<button class="btn btn-primary" style="min-height:36px;padding:0 12px" data-a="ev-start" data-id="${esc(e.id)}">${icon("play")}Lancer</button>` : "";
  const open = mine ? `data-a="ev-open" data-id="${esc(e.id)}"` : `data-a="ev-view" data-k="${esc(person.key)}" data-id="${esc(e.id)}"`;
  return `<div class="ev ${e.fait ? "fait" : ""}" ${open} role="button" tabindex="0"><i class="ev-bar" style="background:${person.color}"></i>${showDate ? `<div class="ev-time" style="width:56px"><div>${JOURS_C[fromISO(e.date).getDay()]} ${fromISO(e.date).getDate()}</div><div class="small muted" style="font-weight:600">${esc(e.heure || "")}</div></div>` : `<div class="ev-time">${esc(e.heure || "—")}</div>`}<div class="row-main"><div class="row-title">${esc(e.titre)}</div><div class="row-sub">${sub}</div></div>${act}</div>`;
}
function viewAccueil() {
  const p = S.profile, today = todayISO();
  let h = "";
  if (PWA && !INSTALLED && !UI.hideInstall) h += `<section><div class="card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:12px;align-items:center"><svg aria-hidden="true" style="width:44px;height:44px;flex-shrink:0"><use href="#logo"/></svg><div class="row-main"><div class="h3">Installe Fonte</div><p class="small muted">Dans Safari, touche le bouton Partager (le carré avec une flèche), puis « Sur l’écran d’accueil ». Fonte s’ouvrira comme une appli, même sans réseau.</p></div></div><button class="btn" data-a="hide-install">J’ai compris</button></div></section>`;
  if (STORE_BLOCK && STORE_BLOCK.reason === "plus-recent") h += `<section><div class="card" id="store-block" style="display:flex;flex-direction:column;gap:8px"><div class="h3">Mets Fonte à jour</div><p class="small muted">Les données de ce téléphone ont été enregistrées par une version plus récente de Fonte. Pour ne rien perdre, cette version ne les modifie pas et n’enregistre rien. Ferme l’appli et rouvre-la avec du réseau pour qu’elle se mette à jour.</p></div></section>`;
  if (STORE.mode === "v1") h += `<section><div class="card" id="store-v1" style="display:flex;flex-direction:column;gap:8px"><div class="h3">Fais une sauvegarde</div><p class="small muted">${STORE.note === "migration-verif" ? "La mise à jour de tes données vers le nouveau format n’a pas pu être vérifiée" : "La mémoire du téléphone est trop pleine pour mettre tes données au nouveau format"} : Fonte continue avec tes données actuelles, rien n’a été effacé. Fais une sauvegarde fichier (Profil › Sauvegarder / transférer) ; la mise à jour sera retentée au prochain lancement. En attendant, un seul profil est possible.</p><button class="btn btn-primary" data-a="bk-now">${icon("download")}Sauvegarder</button></div></section>`;
  const bk = backupDue();
  if (bk) h += `<section><div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="row-main"><div class="h3">Pense à sauvegarder</div><p class="small muted">${bk.last ? (bk.days ? "Ta dernière sauvegarde date de " + plural(bk.days, "jour") : "Depuis ta dernière sauvegarde") + (bk.n ? ", " + plural(bk.n, "séance") + " faite" + (bk.n > 1 ? "s" : "") + " depuis" : "") + "." : "Tu n’as encore jamais sauvegardé tes données."} Touche « Sauvegarder », puis « Enregistrer dans Fichiers » et choisis <b>iCloud Drive</b> : ton historique te suivra sur ton prochain iPhone.</p></div><div class="btn-row"><button class="btn btn-primary" data-a="bk-now">${icon("download")}Sauvegarder</button><button class="btn" data-a="bk-later">Me le rappeler dans 7 jours</button></div></div></section>`;
  const run = loadRun();
  if (run && run.stale) { const n = runSets(run); h += `<section><div class="card" id="run-stale" style="display:flex;flex-direction:column;gap:10px"><div class="row-main"><div class="eyebrow">Séance non terminée</div><div class="h3">Séance du ${esc(fmtDay(toISO(new Date(run.start || Date.now()))))} : ${esc(run.se.nom || "Séance")}</div><p class="small muted">${n ? plural(n, "série") + " déjà fait" + (n > 1 ? "es" : "e") + ". Tu peux l’enregistrer à sa date, avec ce qui a été fait, ou la supprimer." : "Aucune série n’a été faite."}</p></div><div class="btn-row">${n ? `<button class="btn btn-primary" data-a="run-stale-save">${icon("check")}Enregistrer ce qui a été fait</button>` : ""}<button class="btn" data-a="run-stale-del">Supprimer</button></div></div></section>`; }
  else if (run) h += `<section><div class="card card-accent banner"><div class="row-main"><div class="eyebrow" style="color:inherit;opacity:.8">${run.done ? "Séance terminée, à enregistrer" : "Séance en cours"}</div><div class="row-title" style="font-size:17px">${esc(run.se.nom)}</div></div><button class="btn" data-a="run-resume" style="background:var(--accent-ink);color:var(--accent)">Reprendre</button></div></section>`;
  if (!p.sexe || !p.age || !p.taille || !p.poids) {
    h += `<section><div class="card" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;gap:14px;align-items:center">${figHTML(["pecs", "quadriceps", "dorsaux", "fessiers"], ["abdos", "epaules_ant", "ischios"], "sm")}<div class="row-main"><div class="h3">Ton programme sur mesure</div><p class="small muted">5 petites questions et Fonte te prépare un programme avec les bons exercices et les bons poids.</p></div></div><button class="btn btn-primary" data-a="onb-open">Répondre aux questions</button></div></section>`;
  }
  h += bodyCard(true);
  h += missedCard();
  h += deloadCard();
  h += heroCard();
  // semaine
  const ppl = people().filter(isVisible), mon = mondayOf(today);
  const wkDone = S.historique.filter(x => x.date >= mon).length, wkGoal = Math.max(1, planDays(p).length);
  h += `<section><div class="sec-h"><h2>Ma semaine</h2><span class="small muted">${wkDone} sur ${wkGoal} faite${wkDone > 1 ? "s" : ""}</span></div><div class="week">`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(mon, i), done = S.historique.some(x => x.date === d), plan = !done && S.agenda.some(e => e.date === d && !e.fait);
    const dots = ppl.filter(pp => !pp.mine && pp.events.some(e => e.date === d)).slice(0, 2).map(pp => `<i style="background:${pp.color}"></i>`).join("");
    h += `<button class="wday ${d === today ? "today" : ""} ${done ? "done" : ""} ${plan ? "plan" : ""}" data-a="cal-go" data-d="${d}" aria-label="${fmtDay(d)}${done ? ", séance faite" : plan ? ", séance prévue" : ""}"><small>${"LMMJVSD"[i]}</small><b>${fromISO(d).getDate()}</b><span class="dots">${done ? icon("check", "ic wk-ic") : plan ? `<i style="background:var(--accent)"></i>` : ""}${dots}</span></button>`;
  }
  h += `</div><div class="wk-legend small muted"><span><i style="background:var(--accent)"></i>prévue</span><span>${icon("check", "ic wk-ic")}faite</span></div><div class="btn-row" style="margin-top:12px"><button class="btn" data-a="plan-month">${icon("cal")}Programmé</button><button class="btn" data-a="seg" data-v="prog">${icon("list")}Mon programme</button></div>${progressCard(true)}</section>`;
  // les autres, aujourd’hui
  const oth = [];
  ppl.filter(pp => !pp.mine).forEach(pp => pp.events.filter(e => e.date === today).forEach(e => oth.push({ e, p: pp })));
  if (oth.length) h += `<section><div class="sec-h"><h2>Aujourd’hui chez les autres</h2></div><div class="list">${oth.sort((a, b) => byTime(a.e, b.e)).map(x => evRow(x.e, x.p)).join("")}</div></section>`;
  // progrès
  const month = today.slice(0, 7);
  const mo = S.historique.filter(x => x.date.slice(0, 7) === month);
  const mins = Math.round(mo.reduce((a, x) => a + (x.duree || 0), 0) / 60);
  const vol = mo.reduce((a, x) => a + (x.volume || 0), 0);
  const volTxt = vol >= 1000 ? fmtNum(Math.round(vol / 100) / 10) + `<small style="font-size:17px"> t</small>` : Math.round(vol) + `<small style="font-size:17px"> kg</small>`;
  h += `<section><div class="sec-h"><h2>Mes progrès</h2></div><div class="stats"><div class="stat"><b>${mo.length}</b><span>${mo.length > 1 ? "séances" : "séance"} ce mois-ci</span></div><div class="stat"><b>${mins}</b><span>minutes ce mois-ci</span></div><div class="stat"><b>${volTxt}</b><span>soulevés ce mois-ci</span></div></div>${regulariteHTML()}</section>`;
  h += musclesCard();
  if (S.historique.some(x => (x.log || []).some(l => !l.cool && !l.warm))) {
    const recs = recentRecords(30).slice(0, 3);
    h += `<section><div class="sec-h"><h2>Records et courbes</h2><button class="link" data-a="prog-open">Tout voir</button></div>${recs.length ? `<div class="list">${recs.map(recRow).join("")}</div>` : `<button class="card row" data-a="prog-open" style="padding:14px">${icon("chart", "ic rec-ic ch-ic")}<div class="row-main"><div class="row-title">Tes courbes par exercice</div><div class="row-sub">Poids soulevés, répétitions et records</div></div>${icon("chev", "ic chev")}</button>`}</section>`;
  }
  h += histSection(3);
  // outils
  h += `<section><div class="sec-h"><h2>Outils</h2></div><div class="tools">
    <button class="tool" data-a="timer-open">${icon("timer")}<b>Minuteur</b><span class="muted small">Repos, gainage, chrono</span></button>
    <button class="tool" data-a="gloss">${icon("info")}<b>Les mots de la muscu</b><span class="muted small">Série, répétition, repos…</span></button>
    ${simple() ? "" : `<button class="tool" data-a="my-new">${icon("plus")}<b>Créer une séance</b><span class="muted small">Tes exercices, tes séries</span></button>
    <button class="tool" data-a="tpl-open" data-id="tabata">${icon("bolt")}<b>Tabata express</b><span class="muted small">20 s à fond, 10 s de repos</span></button>`}</div></section>`;
  return h;
}
function histRow(x) {
  return `<button class="row" data-a="hist-open" data-id="${esc(x.id)}"><div class="row-main"><div class="row-title">${esc(x.nom)}${x.pr && x.pr.length ? ` <span class="tag tag-rec" style="vertical-align:1px">${icon("trophy")}${x.pr.length}</span>` : ""}</div><div class="row-sub">${cap(fmtDayShort(x.date))} · ${fmtDur(x.duree || 60)}${x.volume ? " · " + fmtNum(Math.round(x.volume)) + " kg" : ""}${x.kcal ? " · ≈ " + x.kcal + " kcal" : ""}</div></div>${icon("chev", "ic chev")}</button>`;
}
function histSection(n) {
  if (!S.historique.length) return `<section><div class="sec-h"><h2>Dernières séances</h2></div><div class="card empty"><p>Tes séances terminées s’afficheront ici avec la durée, le volume soulevé et ton ressenti.</p></div></section>`;
  return `<section><div class="sec-h"><h2>Dernières séances</h2>${S.historique.length > n ? `<button class="link" data-a="hist-all">Tout voir</button>` : ""}</div><div class="list">${S.historique.slice(0, n).map(histRow).join("")}</div></section>`;
}

/* ---------- Exercices ---------- */
const MAT_FILTERS = [["", "Tout matériel"], ["pdc", "Poids du corps"], ["halteres", "Haltères"], ["barre", "Barre"], ["machine", "Machine"], ["poulie", "Poulie"], ["kettlebell", "Kettlebell"], ["elastique", "Élastique"]];
function exMatch(e, g, mat, q) {
  if (g !== "all" && e.g !== g) return false;
  if (mat && e.m.indexOf(mat) < 0) return false;
  if (q) {
    const hay = norm(e.n + " " + e.p.concat(e.s).map(m => MUSCLES[m]).join(" ") + " " + GROUP_LABEL[e.g] + " " + e.m.map(m => MATERIEL[m]).join(" "));
    return q.split(/\s+/).every(w => hay.indexOf(w) >= 0);
  }
  return true;
}
function exRow(e, extra) {
  return `<button class="row ex-row" data-a="${extra && extra.act ? extra.act : "ex-open"}" data-id="${e.id}" ${extra && extra.pressed != null ? `aria-pressed="${extra.pressed}"` : ""}>${figHTML(e.p, e.s, "xs")}<div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${e.p.map(m => MUSCLES[m]).join(", ")} · ${e.m.slice(0, 2).map(m => MATERIEL[m]).join(", ")}</div></div>${extra && extra.right ? extra.right : lvlHTML(e.l)}</button>`;
}
function exListHTML() {
  const q = norm(UI.exQ.trim());
  const list = EX.filter(e => exMatch(e, UI.exG, UI.exMat, q));
  if (!list.length) return `<div class="card empty"><p>Aucun exercice ne correspond. Essaie un autre mot ou retire un filtre.</p></div>`;
  let h = (q || UI.exG !== "all" || UI.exMat) ? `<div class="count">${plural(list.length, "exercice")}</div>` : "";
  if (UI.exG === "all" && !q) {
    GROUPS.forEach(([k, l]) => { const g = list.filter(e => e.g === k); if (!g.length) return; h += `<div class="grp-title"><i class="plate-dot" style="--c:${GROUP_COLOR[k]}"></i>${l}</div><div class="list">${g.map(e => exRow(e)).join("")}</div>`; });
  } else h += `<div class="list">${list.map(e => exRow(e)).join("")}</div>`;
  return h;
}
function viewExercices() {
  return `<section><div class="search">${icon("search")}<input id="ex-q" type="search" placeholder="Exercice, muscle, matériel…" value="${esc(UI.exQ)}" autocomplete="off" aria-label="Rechercher un exercice"></div>
  <div class="chips" role="group" aria-label="Groupes musculaires"><button class="chip" data-a="ex-g" data-g="all" aria-pressed="${UI.exG === "all"}">Tous</button>${GROUPS.map(([k, l]) => `<button class="chip" data-a="ex-g" data-g="${k}" aria-pressed="${UI.exG === k}"><i class="plate-dot" style="--c:${GROUP_COLOR[k]}"></i>${l}</button>`).join("")}</div>
  <div class="chips" role="group" aria-label="Matériel">${MAT_FILTERS.map(([k, l]) => `<button class="chip" data-a="ex-mat" data-m="${k}" aria-pressed="${UI.exMat === k}">${l}</button>`).join("")}</div></section>
  <section id="ex-list">${exListHTML()}</section>`;
}
function openEx(id) {
  const e = EX_BY_ID[id]; if (!e) return;
  const harder = EX.filter(x => x.deb === id || x.lo === id);
  const alts = [];
  if (e.deb && EX_BY_ID[e.deb]) alts.push(["Version plus facile", EX_BY_ID[e.deb]]);
  if (e.lo && EX_BY_ID[e.lo]) alts.push(["Version sans saut", EX_BY_ID[e.lo]]);
  harder.forEach(x => alts.push([x.deb === id ? "Pour progresser" : "Version avec sauts", x]));
  const sim = EX.filter(x => x.id !== id && x.g === e.g && x.p.some(m => e.p.indexOf(m) >= 0) && !alts.some(a => a[1].id === x.id)).slice(0, 5);
  const pl = perfLine(id);
  const body = `
    <div class="tags"><span class="tag"><i class="plate-dot" style="--c:${GROUP_COLOR[e.g]};display:inline-block;vertical-align:-1px;margin-right:4px"></i>${GROUP_LABEL[e.g]}</span><span class="tag">${NIVEAUX[e.l]}</span><span class="tag">${e.t === "t" ? "Chronométré" + (e.dt ? " · " + fmtSec(e.dt) : "") : "En répétitions"}${e.pc ? " · par côté" : ""}</span>${e.imp ? `<span class="tag">Avec sauts</span>` : ""}${ECH.has(id) ? `<span class="tag tag-f">${icon("flame")}Échec sans risque</span>` : ""}</div>
    ${animHTML(id)}
    ${loadNote(e)}
    <div class="card">${figHTML(e.p, e.s, "md")}<div class="legend" style="margin-top:12px"><span><i style="background:var(--hl)"></i>Principal</span><span><i style="background:var(--hl2)"></i>Secondaire</span></div></div>
    <div class="field"><div class="lbl">Muscles principaux</div><div class="tags">${e.p.map(m => `<span class="tag tag-p">${MUSCLES[m]}</span>`).join("")}</div></div>
    ${e.s.length ? `<div class="field"><div class="lbl">Muscles secondaires</div><div class="tags">${e.s.map(m => `<span class="tag">${MUSCLES[m]}</span>`).join("")}</div></div>` : ""}
    <div class="field"><div class="lbl">Matériel</div><div class="tags">${e.m.map(m => `<span class="tag">${MATERIEL[m]}</span>`).join("")}</div></div>
    <div><div class="h3" style="margin-bottom:10px">Comment le faire</div><ol class="steps">${e.d.map(s => `<li><span>${esc(s)}</span></li>`).join("")}</ol></div>
    <div><div class="h3" style="margin-bottom:8px">Conseils</div><ul class="bullets">${e.c.map(s => `<li>${esc(s)}</li>`).join("")}${ECH.has(id) ? `<li>Tu peux pousser la dernière série jusqu’à l’échec : continue jusqu’à ne plus réussir une répétition propre, sans tricher sur le mouvement.</li>` : ""}</ul></div>
    ${pl ? `<div class="note">${icon("refresh")}<span>${esc(pl)}</span></div>` : ""}
    ${progBlock(id)}
    <div class="field"><label for="ex-note">Ma note</label><textarea class="inp" id="ex-note" data-note="${id}" maxlength="300" placeholder="Réglage du siège, prise, sensations…">${esc(S.notes[id] || "")}</textarea><span class="small muted">Elle s’affiche pendant la séance.</span></div>
    ${alts.length ? `<div><div class="h3" style="margin-bottom:8px">Variantes</div><div class="list">${alts.map(([l, x]) => exRow(x, { right: `<span class="tag">${l}</span>` })).join("")}</div></div>` : ""}
    ${sim.length ? `<div><div class="h3" style="margin-bottom:8px">Exercices proches</div><div class="list">${sim.map(x => exRow(x)).join("")}</div></div>` : ""}`;
  const sh = Sheet.open({ key: "ex", title: e.n, body, tall: true, foot: `<button class="btn btn-primary btn-lg" data-a="ex-add" data-id="${id}">${icon("plus")}${E ? "Ajouter à cette séance" : "Ajouter à une séance"}</button>`,
    onClose: () => { CH = null; if (R && !$("#runner").hidden) renderRunner(); } });
  ANIM.mount(sh.el, true);
}

/* ---------- Séances ---------- */
function adaptNote() {
  const p = S.profile;
  if (!p.sexe) return `<div class="note">${icon("sparkle")}<span>Complète ton profil pour adapter les séries, répétitions et repos à ton corps et à ton objectif. <button style="color:var(--accent);font-weight:600" data-a="tab" data-t="profil">Mon profil</button></span></div>`;
  return `<div class="note">${icon("sparkle")}<span>Adaptées à ton profil : ${p.sexe === "F" ? "femme" : "homme"}${p.age ? ", " + p.age + " ans" : ""} · ${NIVEAUX[NIV_KEYS[p.niveau] || 1].toLowerCase()} · ${esc(objNames(p)[0].toLowerCase())}${objList(p).length > 1 ? " (objectif principal ; les séances du programme suivent chacune leur objectif)" : ""}.</span></div>`;
}
function tplCard(t) {
  const se = prescribe(t, S.profile), d = estDuree(se), [p, s] = seanceMuscles(se.items);
  return `<button class="tpl" data-a="tpl-open" data-id="${t.id}">${figHTML(p, s, "sm")}<div class="tpl-main"><div class="tpl-name">${esc(t.n)}</div><div class="tpl-desc">${esc(t.desc)}</div><div class="meta"><span>${icon("clock")}${fmtDur(d)}</span><span>${se.items.length} exos${se.mode === "circuit" ? " · " + se.tours + " tours" : ""}</span><span>${icon("flame")}${estKcal(se, S.profile, d)} kcal</span></div></div></button>`;
}
/* « 3 min de rameur, cercles de bras, dislocations d’épaules » */
function warmTxt(wu) { return wu.map((it, k) => { const n = EX_BY_ID[it.id].n.replace(/ \(.*\)$/, ""); return k === 0 && it.duree >= 60 ? Math.round(it.duree / 60) + " min de " + n.toLowerCase().replace(/^vélo d’appartement$/, "vélo") : (k ? n.charAt(0).toLowerCase() + n.slice(1) : n); }).join(", "); }
function warmNote(se) {
  if (!echOn(se) || !se.items.length) return "";
  const wu = warmUp(se.items, lowImpact(S.profile)); if (!wu.length) return "";
  return `<div class="note">${icon("flame")}<span>Pour commencer, échauffement ciblé (≈ ${fmtDur(warmDuree(se.items, lowImpact(S.profile)))}) : ${esc(warmTxt(wu))}. Tu peux le retirer dans « Lancer ».</span></div>`;
}
/* Aperçu d’une de mes séances : tout le contenu, avant de la lancer ou de la modifier */
function openMes(id) {
  const m = S.mesSeances.find(x => x.id === id); if (!m) return;
  const se = applySuggestions(clone(m)), d = estDuree(se), [p, s] = seanceMuscles(se.items);
  const circ = se.mode === "circuit" ? `<div class="note">${icon("refresh")}<span>Circuit : ${se.tours || 3} tours, ${fmtRest(se.roundRest || 60)} de pause entre les tours.</span></div>` : "";
  const cd = etirOn(se) ? coolDown(se.items) : [];
  const body = `<div style="display:flex;gap:14px;align-items:center">${figHTML(p, s, "sm")}<div class="meta" style="flex-direction:column;gap:6px;font-size:14px"><span>${icon("clock")}≈ ${fmtDur(d)}</span><span>${icon("dumbbell")}${plural(se.items.length, "exercice")}</span><span>${icon("flame")}≈ ${estKcal(se, S.profile, d)} kcal</span></div></div>
    ${(se.notes || []).length ? `<div class="note">${icon("sparkle")}<span>${se.notes.map(esc).join(" · ")}.</span></div>` : ""}${circ}${chargeNote(se)}
    ${warmNote(se)}
    ${simple() ? readHelp() : ""}${itemRows(se)}
    ${cd.length ? `<div class="note">${icon("heart")}<span>Pour finir, ${plural(cd.length, "étirement")} (≈ ${fmtDur(coolDuree(se.items))}) : ${esc(cd.map(it => EX_BY_ID[it.id].n.replace(/ \(.*\)$/, "")).join(", "))}.</span></div>` : ""}
    <div class="btn-row"><button class="btn" data-a="my-edit" data-id="${esc(m.id)}">${icon("edit")}Modifier</button><button class="btn" data-a="my-plan" data-id="${esc(m.id)}">${icon("cal")}Agenda</button></div>`;
  Sheet.open({ key: "mes-se", title: m.nom, body, tall: true, foot: `<button class="btn btn-primary btn-lg" data-a="my-start" data-id="${esc(m.id)}">${icon("play")}Lancer</button>` });
}
function mesCard(m) {
  const d = estDuree(m), [p, s] = seanceMuscles(m.items);
  return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><button class="tpl" style="padding:0;border:0" data-a="my-open" data-id="${esc(m.id)}">${figHTML(p, s, "sm")}<div class="tpl-main"><div class="tpl-name">${esc(m.nom)}</div><div class="tpl-desc">${esc(m.items.map(it => (EX_BY_ID[it.id] || {}).n).filter(Boolean).join(" · "))}</div><div class="meta"><span>${icon("clock")}${fmtDur(d)}</span><span>${m.items.length} exos${m.mode === "circuit" ? " · " + (m.tours || 3) + " tours" : ""}</span></div></div></button><div class="btn-row"><button class="btn" data-a="my-edit" data-id="${esc(m.id)}">${icon("edit")}Modifier</button><button class="btn" data-a="my-plan" data-id="${esc(m.id)}">${icon("cal")}Agenda</button><button class="btn btn-primary" data-a="my-start" data-id="${esc(m.id)}">${icon("play")}Lancer</button></div></div>`;
}
function viewSeances() {
  const other = UI.seg !== "prog";
  let h = `<section><div class="seg" role="group" aria-label="Séances"><button data-a="seg" data-v="prog" aria-pressed="${!other}">Mon programme</button><button data-a="seg" data-v="${UI.lastOther || "types"}" aria-pressed="${other}">Autres séances</button></div>${other ? `<div class="chips" role="group" aria-label="Type de séances" style="margin-top:10px"><button class="chip" data-a="seg" data-v="types" aria-pressed="${UI.seg === "types"}">Séances toutes prêtes</button><button class="chip" data-a="seg" data-v="mes" aria-pressed="${UI.seg === "mes"}">Mes séances${S.mesSeances.length ? " (" + S.mesSeances.length + ")" : ""}</button></div>` : ""}</section>`;
  if (UI.seg === "prog") h += viewProgramme();
  else if (UI.seg === "types") {
    const list = TPL.filter(t => UI.tplCat === "all" || t.cat === UI.tplCat);
    h += `<section>${adaptNote()}<div class="chips" role="group" aria-label="Catégories"><button class="chip" data-a="tpl-cat" data-c="all" aria-pressed="${UI.tplCat === "all"}">Toutes</button>${TPL_CATS.map(([k, l]) => `<button class="chip" data-a="tpl-cat" data-c="${k}" aria-pressed="${UI.tplCat === k}">${l}</button>`).join("")}</div><div class="tpl-grid">${list.map(tplCard).join("")}</div></section>`;
  } else {
    if (!S.mesSeances.length) h += `<section><div class="card empty">${figHTML(["pecs", "dorsaux"], ["biceps", "triceps"], "sm")}<p>Compose ta propre séance : tes exercices, tes séries, tes répétitions, tes charges et tes temps de repos.</p><button class="btn btn-primary" data-a="my-new">${icon("plus")}Créer une séance</button><button class="btn btn-ghost" data-a="seg" data-v="types">Ou partir d’une séance type</button></div></section>`;
    else h += `<section>${S.mesSeances.map(mesCard).join("")}<button class="btn btn-block" data-a="my-new">${icon("plus")}Nouvelle séance</button></section>`;
  }
  return h;
}
function hrZoneNote(se) {
  const fc = fcMax(S.profile); if (!fc) return "";
  if (se.kind === "cardio") return `<div class="note">${icon("heart")}<span>Cardio continu en zone 2 : ${Math.round(fc * .6)}–${Math.round(fc * .7)} bpm. Efforts fractionnés : ${Math.round(fc * .8)}–${Math.round(fc * .9)} bpm.</span></div>`;
  if (se.kind === "hiit") return `<div class="note">${icon("heart")}<span>Vise ${Math.round(fc * .8)}–${Math.round(fc * .9)} bpm pendant les efforts (FC max estimée : ${fc} bpm).</span></div>`;
  return "";
}
function chargeNote(se) {
  const w = se.items.filter(it => LOAD[it.id]);
  if (!w.length) return "";
  if (!S.profile.poids) return `<div class="note">${icon("dumbbell")}<span>Renseigne ton poids et ta taille pour avoir les charges de départ de chaque exercice. <button style="color:var(--accent);font-weight:600" data-a="tab" data-t="profil">Mon profil</button></span></div>`;
  const hist = w.some(it => suggest(it.id));
  return `<div class="note">${icon("dumbbell")}<span>Charges ${hist ? "reprises de tes dernières séances ou " : ""}calculées d’après ton poids${S.profile.taille ? " et ta taille" : ""}. Tu pourras les changer avant de commencer et pendant la séance.</span></div>`;
}
function itemRows(se) {
  return `<div class="list">${se.items.map(it => { const e = EX_BY_ID[it.id]; if (!e) return ""; return `<button class="row" data-a="ex-open" data-id="${e.id}">${figHTML(e.p, e.s, "xs")}<div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${e.p.map(m => MUSCLES[m]).join(", ")}</div></div><div class="presc">${simple() && se.mode !== "circuit" ? (it.series > 1 ? it.series + " séries" : "1 fois") + `<small>${it.duree ? fmtSec(it.duree) : "de " + it.reps + " mouv." + (it.parCote ? " / côté" : "")}</small>` : prescText(it, se.mode)}${it.charge || (isAssist(it.id) && it.charge === 0 && suggest(it.id)) ? `<small>${isAssist(it.id) ? "assist. " : ""}${fmtNum(it.charge)} kg</small>` : ""}${se.mode !== "circuit" && it.repos && it.series > 1 ? `<small>${simple() ? "pause" : "repos"} ${fmtRest(it.repos)}</small>` : ""}${it.echec && se.mode !== "circuit" ? `<small class="f">${simple() ? "dernière : au max" : "dernière à l’échec"}</small>` : ""}${linked(se, se.items.indexOf(it)) ? `<small>superset ↓</small>` : ""}</div></button>`; }).join("")}</div>`;
}
function openTpl(id, o, j) {
  const t = TPL_BY_ID[id]; if (!t) return;
  o = OBJECTIFS[o] ? o : null; j = j == null || j === "" || isNaN(+j) ? null : +j;
  const se = applySuggestions(prescribe(t, profFor(S.profile, o))), d = estDuree(se), [p, s] = seanceMuscles(se.items);
  const pa = (o ? ` data-o="${o}"` : "") + (j != null ? ` data-j="${j}"` : "");
  const circ = se.mode === "circuit" ? `<div class="note">${icon("refresh")}<span>Circuit : ${se.tours} tours, enchaîne les exercices${se.items[0] && se.items[0].duree ? " (" + se.items[0].duree + " s d’effort, " + se.items[0].repos + " s de récupération)" : ""}, ${fmtRest(se.roundRest)} de pause entre les tours.</span></div>` : "";
  const body = `${j != null ? `<div class="note">${icon("cal")}<span>Jour ${j + 1} de ton programme${o && objList(S.profile).length > 1 ? ", réglé pour l’objectif « " + esc(OBJECTIFS[o].n) + " »" : ""}.</span></div>` : ""}<p class="muted">${esc(t.desc)}</p>
    <div style="display:flex;gap:14px;align-items:center">${figHTML(p, s, "sm")}<div class="meta" style="flex-direction:column;gap:6px;font-size:14px"><span>${icon("clock")}≈ ${fmtDur(d)}</span><span>${icon("dumbbell")}${plural(se.items.length, "exercice")}</span><span>${icon("flame")}≈ ${estKcal(se, S.profile, d)} kcal</span></div></div>
    ${se.notes.length && !simple() ? `<div class="note">${icon("sparkle")}<span>${se.notes.map(esc).join(" · ")}.</span></div>` : ""}${circ}${hrZoneNote(se)}${chargeNote(se)}
    ${warmNote(se)}
    ${simple() ? readHelp() : ""}${itemRows(se)}
    ${etirOn(se) && coolDown(se.items).length ? `<div class="note">${icon("heart")}<span>Pour finir, ${(n => n + (n > 1 ? " étirements ciblés" : " étirement ciblé"))(coolDown(se.items).length)} (≈ ${fmtDur(coolDuree(se.items))}) : ${esc(coolDown(se.items).map(it => EX_BY_ID[it.id].n.replace(/ \(.*\)$/, "")).join(", "))}. Tu peux les retirer dans « Lancer ».</span></div>` : ""}
    <div class="btn-row"><button class="btn" data-a="tpl-copy" data-id="${id}">${icon("copy")}Copier dans mes séances</button></div>`;
  Sheet.open({ key: "tpl", title: t.n, body, tall: true, foot: `<button class="btn btn-lg" data-a="tpl-plan" data-id="${id}"${pa}>${icon("cal")}Agenda</button><button class="btn btn-primary btn-lg" data-a="tpl-start" data-id="${id}"${pa}>${icon("play")}Lancer</button>` });
}

/* ---------- Agenda ---------- */
function viewAgenda() {
  const [y, m] = UI.calMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1), off = (first.getDay() + 6) % 7, days = new Date(y, m, 0).getDate();
  const start = addDays(toISO(first), -off), cells = Math.ceil((off + days) / 7) * 7, today = todayISO();
  const ppl = people(), vis = ppl.filter(isVisible);
  let h = `<section><div class="people" role="group" aria-label="Agendas affichés">${ppl.map(p => `<button class="person" data-a="person-toggle" data-k="${esc(p.key)}" aria-pressed="${isVisible(p)}"><i style="background:${p.color}"></i>${esc(p.name)}</button>`).join("")}</div></section>`;
  h += `<section><div class="cal-head"><button class="btn-icon" data-a="cal-prev" aria-label="Mois précédent">${icon("chevl")}</button><h2>${MOIS[m - 1]} ${y}</h2><button class="btn-icon" data-a="cal-next" aria-label="Mois suivant">${icon("chev")}</button></div><div class="cal">${"LMMJVSD".split("").map(d => `<div class="dow">${d}</div>`).join("")}`;
  for (let i = 0; i < cells; i++) {
    const d = addDays(start, i);
    const dots = vis.filter(p => p.events.some(e => e.date === d)).slice(0, 3).map(p => `<i style="background:${p.color}"></i>`).join("");
    h += `<button class="cday ${d.slice(0, 7) !== UI.calMonth ? "out" : ""} ${d === today ? "today" : ""}" data-a="cal-day" data-d="${d}" aria-pressed="${d === UI.calSel}" aria-label="${fmtDay(d)}">${fromISO(d).getDate()}<span class="dots">${dots}</span></button>`;
  }
  h += `</div></section>`;
  const evs = [];
  vis.forEach(p => p.events.filter(e => e.date === UI.calSel).forEach(e => evs.push({ e, p })));
  evs.sort((a, b) => byTime(a.e, b.e));
  h += `<section><div class="sec-h"><h2>${cap(fmtDay(UI.calSel))}</h2><button class="link" data-a="ev-add" data-d="${UI.calSel}">Ajouter</button></div>${evs.length ? `<div class="list">${evs.map(x => evRow(x.e, x.p)).join("")}</div>` : `<div class="card empty"><p>Aucune séance ce jour-là.</p><button class="btn" data-a="ev-add" data-d="${UI.calSel}">${icon("plus")}Ajouter une séance</button></div>`}</section>`;
  if (!S.profile.autoPlan) h += `<section><div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="h3">Ton programme dans l’agenda</div><p class="small muted">Fonte peut prévoir tes séances un mois à l’avance, aux jours que tu as choisis, et ajouter la suite toute seule.</p><button class="btn btn-primary" data-a="pp-save">${icon("cal")}Planifier mon mois</button></div></section>`;
  // à venir
  const up = [];
  vis.forEach(p => p.events.filter(e => e.date > today && e.date <= addDays(today, 14)).forEach(e => up.push({ e, p })));
  up.sort((a, b) => a.e.date === b.e.date ? byTime(a.e, b.e) : a.e.date.localeCompare(b.e.date));
  if (up.length) h += `<section><div class="sec-h"><h2>Prochains jours</h2></div><div class="list">${up.slice(0, 12).map(x => evRow(x.e, x.p, true)).join("")}</div></section>`;
  const fut = S.agenda.filter(e => e.date >= today && !e.fait);
  h += `<section><div class="sec-h"><h2>Rappels</h2></div><div class="card" style="display:flex;flex-direction:column;gap:10px"><p class="small">Ajoute tes séances prévues au calendrier de ton téléphone : il te préviendra avant chaque séance, même appli fermée.</p><button class="btn" data-a="ics-all" ${fut.length ? "" : "disabled"}>${icon("cal")}${fut.length ? "Exporter " + plural(fut.length, "séance") + " à venir" : "Aucune séance à venir"}</button></div></section>`;
  h += `<section><details class="card fold"><summary>${icon("share")}<span class="row-main"><b>Partager mon agenda</b><span class="small muted">Avec ta copine, un ami, ton coach…</span></span>${icon("chev", "ic chev")}</summary><div class="fold-body">${shareCard()}</div></details></section>`;
  return h;
}
function shareCard() {
  if (PWA) return `<section>${cloudCard()}<div class="card" style="display:flex;flex-direction:column;gap:12px">
    <div class="h3">Sans synchronisation</div><p class="small">Vous pouvez aussi vous envoyer vos agendas avec un code, à renvoyer quand le planning change.</p>
    <div class="btn-row"><button class="btn btn-primary" data-a="share-send">${icon("share")}Envoyer mon agenda</button><button class="btn" data-a="share-import">Importer un code</button></div>
    ${S.imports.length ? `<div class="list">${S.imports.map(im => `<div class="row"><div class="row-main"><div class="row-title">${esc(im.nom)}</div><div class="row-sub">Mis à jour le ${fmtDay(toISO(new Date(im.at || Date.now())))} · ${plural((im.events || []).length, "séance")}</div></div><button class="btn btn-danger" style="min-height:36px" data-a="import-del" data-id="${esc(im.id)}">Retirer</button></div>`).join("")}</div>` : ""}
  </div></section>`;
  const live = ["live", "slow", "offline", "connecting", "readonly"].indexOf(Sync.state) >= 0;
  const n = Object.keys(S.partners).length;
  return `<section><div class="card" style="display:flex;flex-direction:column;gap:12px">${statusHTML()}
    <p class="small">${live
      ? `Ton agenda est partagé en direct avec les personnes qui ont accès à cette appli. Pour voir celui de ta copine, partage l’appli avec elle depuis le menu de partage de Claude (invitation par e-mail avec le droit de modifier). Dès qu’elle planifie ses séances, son agenda s’affiche ici, et le tien chez elle.`
      : `Le partage en direct demande d’ouvrir l’appli connecté à ton compte Claude. En attendant, échangez vos agendas avec un code.`}</p>
    ${n ? `<div class="small muted">${n > 1 ? n + " agendas partagés" : "1 agenda partagé"} en direct.</div>` : ""}
    <p class="small muted">Les autres voient ton prénom et ton agenda, jamais ton profil ni ton historique.</p>
    <div class="btn-row"><button class="btn" data-a="share-export">${icon("share")}Mon code d’agenda</button><button class="btn" data-a="share-import">Importer un code</button></div>
    ${S.imports.length ? `<div class="list">${S.imports.map(im => `<div class="row"><div class="row-main"><div class="row-title">${esc(im.nom)}</div><div class="row-sub">Importé le ${fmtDay(toISO(new Date(im.at || Date.now())))} · ${plural((im.events || []).length, "séance")}</div></div><button class="btn btn-danger" style="min-height:36px" data-a="import-del" data-id="${esc(im.id)}">Retirer</button></div>`).join("")}</div>` : ""}
  </div></section>`;
}
function refOptions(sel) {
  const tpl = TPL.map(t => `<option value="t:${t.id}" ${sel === "t:" + t.id ? "selected" : ""}>${esc(t.n)}</option>`).join("");
  const mes = S.mesSeances.map(m => `<option value="p:${esc(m.id)}" ${sel === "p:" + m.id ? "selected" : ""}>${esc(m.nom)}</option>`).join("");
  return `${mes ? `<optgroup label="Mes séances">${mes}</optgroup>` : ""}<optgroup label="Séances types">${tpl}</optgroup><option value="libre" ${sel === "libre" ? "selected" : ""}>Autre activité…</option>`;
}
let AE_REF = null;
function openAddEvent(o) {
  o = o || {}; AE_REF = o.ref || null;
  const ev = o.editId ? S.agenda.find(e => e.id === o.editId) : null;
  const date = ev ? ev.date : (o.date || (UI.calSel >= todayISO() ? UI.calSel : todayISO()));
  const ref = ev ? ev.ref : o.ref;
  const sel = ref ? ref.k + ":" + ref.id : (ev ? "libre" : (S.mesSeances[0] ? "p:" + S.mesSeances[0].id : "t:" + programme(S.profile).ids[0]));
  const body = `<div class="field"><label for="ae-ref">Séance</label><select class="inp" id="ae-ref">${refOptions(sel)}</select></div>
    <div class="field" id="ae-titre-f" ${sel === "libre" ? "" : "hidden"}><label for="ae-titre">Activité</label><input class="inp" id="ae-titre" maxlength="60" placeholder="Course à pied, yoga, match…" value="${ev && !ev.ref ? esc(ev.titre) : ""}"></div>
    <div class="grid3" style="grid-template-columns:1.4fr 1fr"><div class="field"><label for="ae-date">Date</label><input class="inp" type="date" id="ae-date" value="${date}"></div><div class="field"><label for="ae-heure">Heure</label><input class="inp" type="time" id="ae-heure" value="${ev ? esc(ev.heure) : "18:30"}"></div></div>
    ${ev ? "" : `<div class="field"><label for="ae-rep">Répéter</label><select class="inp" id="ae-rep"><option value="0">Une seule fois</option><option value="4">Chaque semaine pendant 4 semaines</option><option value="8">Chaque semaine pendant 8 semaines</option><option value="12">Chaque semaine pendant 12 semaines</option></select></div>`}
    <div class="field"><label for="ae-note">Note</label><input class="inp" id="ae-note" maxlength="120" placeholder="Avec ma copine, salle de Belleville…" value="${ev ? esc(ev.note) : ""}"></div>`;
  Sheet.open({ key: "ae", title: ev ? "Modifier" : "Ajouter une séance", body, foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="ae-save" data-id="${ev ? esc(ev.id) : ""}">Enregistrer</button>` });
}
function openEvent(id) {
  const e = S.agenda.find(x => x.id === id); if (!e) return;
  const ri = refInfo(e.ref);
  const body = `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="eyebrow">${cap(fmtDay(e.date))}${e.heure ? " · " + esc(e.heure) : ""}</div><div class="h3" style="font-size:22px">${esc(e.titre)}</div>${e.note ? `<p class="muted">${esc(e.note)}</p>` : ""}${e.fait ? `<div class="status ok"><i></i><span>Séance faite</span></div>` : ""}</div>
    ${ri ? `<button class="btn btn-block" data-a="ev-see" data-id="${esc(e.id)}">Voir le détail de la séance</button>` : ""}
    <button class="btn btn-block" data-a="ev-ics" data-id="${esc(e.id)}">${icon("cal")}Ajouter au calendrier du téléphone</button>
    ${e.fait ? "" : `<button class="btn btn-block" data-a="ev-move-pick" data-id="${esc(e.id)}">${icon("clock")}Reporter</button>`}
    <div class="btn-row"><button class="btn" data-a="ev-done" data-id="${esc(e.id)}">${icon("check")}${e.fait ? "Marquer non faite" : "Marquer comme faite"}</button><button class="btn" data-a="ev-edit" data-id="${esc(e.id)}">${icon("edit")}Modifier</button></div>
    <button class="btn btn-danger btn-block" data-a="ev-del" data-id="${esc(e.id)}">${icon("trash")}Supprimer</button>`;
  Sheet.open({ key: "ev", title: "Séance prévue", body, foot: ri && !e.fait ? `<button class="btn btn-primary btn-lg" data-a="ev-start" data-id="${esc(e.id)}">${icon("play")}Lancer maintenant</button>` : "" });
}
function openPartnerEvent(key, id) {
  const p = people().find(x => x.key === key); if (!p) return;
  const e = p.events.find(x => x.id === id); if (!e) return;
  const t = e.ref && e.ref.k === "t" ? TPL_BY_ID[e.ref.id] : null;
  const body = `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="person" style="align-self:flex-start"><i style="background:${p.color}"></i>${esc(p.name)}</div><div class="eyebrow">${cap(fmtDay(e.date))}${e.heure ? " · " + esc(e.heure) : ""}</div><div class="h3" style="font-size:22px">${esc(e.titre)}</div>${e.note ? `<p class="muted">${esc(e.note)}</p>` : ""}${e.fait ? `<div class="status ok"><i></i><span>Séance faite</span></div>` : ""}</div>
    ${t ? `<button class="btn btn-block" data-a="tpl-open" data-id="${t.id}">Voir la séance ${esc(t.n)}</button>` : ""}`;
  Sheet.open({ key: "pev", title: "Agenda de " + p.name, body, foot: `<button class="btn btn-primary btn-lg" data-a="ev-join" data-k="${esc(key)}" data-id="${esc(id)}">${icon("plus")}L’ajouter à mon agenda</button>` });
}

/* ---------- Profil ---------- */
function bmr(p) { if (!p.sexe || !p.age || !p.taille || !p.poids) return null; return Math.round(10 * p.poids + 6.25 * p.taille - 5 * p.age + (p.sexe === "F" ? -161 : 5)); }
function adaptBullets(p) {
  const ctx = profileCtx(p), o = ctx.obj, L = ctx.lvl, b = [];
  const sc = Math.max(2, o.C[0] + (L === 1 ? -1 : 0) + (L === 3 ? 1 : 0)), si = Math.max(2, o.I[0] + (L === 1 ? -1 : 0));
  b.push(`Objectif${objList(p).length > 1 ? " principal" : ""} « ${o.n} » : ${sc} × ${o.C[1]} sur les exercices de base, ${si} × ${o.I[1]} sur les exercices d’isolation.`);
  if (objList(p).length > 1) {
    const pr = programme(p), cnt = {}; pr.objs.forEach(k => { cnt[k] = (cnt[k] || 0) + 1; });
    b.push(`Plusieurs objectifs : chaque semaine, ${Object.keys(cnt).map(k => plural(cnt[k], "séance") + " « " + OBJECTIFS[k].n + " »").join(", ")}. Chaque séance du programme a ses séries, répétitions et repos réglés pour son objectif, et l’accueil te propose toujours la suivante.`);
  }
  b.push(`Repos : ${fmtRest(adjRest(ctx, o.C[2]))} sur les exercices de base, ${fmtRest(adjRest(ctx, o.I[2]))} en isolation.`);
  if (p.sexe === "F") b.push("Les femmes récupèrent en général plus vite entre deux séries : repos raccourcis d’environ 15 %.");
  if (p.age >= 50) b.push("15 secondes de repos en plus par série, et un échauffement de 10 minutes conseillé.");
  if (L === 1) b.push("Niveau débutant : une série de moins, 5 exercices maximum, mouvements avancés remplacés (tractions assistées, goblet squat…).");
  if (L === 3) b.push("Niveau avancé : une série de plus sur les exercices de base.");
  if (ctx.low) b.push("Exercices sans saut privilégiés pour ménager les articulations.");
  if (p.poids) {
    const dc = estCharge("dc-barre", o.C[1], p), sq = estCharge("squat-barre", o.C[1], p), cu = estCharge("curl-halteres", o.I[1], p), lp = estCharge("presse-cuisses", o.C[1], p);
    b.push(`Charges de départ calculées avec ton poids${p.taille ? " et ta taille" : ""}${p.sexe ? ", ton sexe" : ""} et ton niveau : par exemple ${fmtNum(dc)} kg au développé couché, ${fmtNum(sq)} kg au squat, ${fmtNum(lp)} kg à la presse et ${fmtNum(cu)} kg par haltère au curl. Tu peux toujours les modifier, puis elles progressent avec tes séances.`);
  } else b.push("Ajoute ton poids et ta taille pour obtenir une charge de départ sur chaque exercice avec poids.");
  if (ctx.heavy) b.push("Corpulence prise en compte : pompes inclinées, tractions et dips assistés à la place des versions les plus dures au poids du corps.");
  b.push("Dernière série jusqu’à l’échec sur les exercices sans risque (machines, poulies, poids du corps, isolation)" + (["muscle", "tonus", "perte"].indexOf(p.objectif) >= 0 ? "" : ", sur les exercices d’isolation et de gainage") + " : continue jusqu’à ne plus réussir une répétition propre.");
  const fc = fcMax(p);
  b.push("Étirements de fin de séance choisis selon les muscles que tu viens de travailler (environ 4 minutes, désactivables séance par séance).");
  if (fc) b.push(`Fréquence cardiaque max estimée : ${fc} bpm (${p.sexe === "F" ? "formule de Gulati, établie sur des femmes" : "formule de Tanaka"}). Cardio en zone 2 : ${Math.round(fc * .6)}–${Math.round(fc * .7)} bpm.`);
  const bm = bmr(p);
  if (bm) b.push(`Dépense au repos estimée (taille, poids, âge, sexe) : environ ${bm.toLocaleString("fr-FR")} kcal par jour, sans compter l’activité.`);
  b.push(`Calories des séances estimées avec ${p.poids ? "ton poids (" + fmtNum(p.poids) + " kg)" : "un poids de 70 kg par défaut"}.`);
  return b;
}
function adaptCard() { return `<details class="card fold" id="adapt"><summary>${icon("sparkle")}<span class="row-main"><b>Ce que ton profil change</b><span class="small muted">Séries, pauses, poids, calories…</span></span>${icon("chev", "ic chev")}</summary><div class="fold-body"><ul class="bullets">${adaptBullets(S.profile).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></details>`; }
/* ================= Profils (U4, 3B) =================
   Chaque profil a ses propres données (programme, historique, records, mesures, notes, séance en cours, copie de sécurité).
   Changer de profil relance l’appli sur l’autre profil : rien de l’un ne peut rester en mémoire dans l’autre. Interdit pendant une séance. */
const profName = x => (x && x.prenom) || "Profil sans prénom";
function ownerName() { const o = STORE.P && STORE.P.list.find(x => x.id === STORE.P.owner); return profName(o); }
const profInit = x => esc(((x && x.prenom) || "?").charAt(0).toUpperCase());
const profAv = (x, on) => `<span class="pf-av${on ? " on" : ""}" aria-hidden="true">${profInit(x)}</span>`;
function runBusy() { return !!(R || loadRun()); }
const RUN_BUSY = "Une séance est en cours dans ce profil : termine-la (ou supprime-la) avant de changer de profil.";
function profilesCard() {
  if (STORE.mode !== "v2") return "";
  const list = profileList(), cur = list.find(x => x.active) || { prenom: S.profile.prenom };
  cur.prenom = S.profile.prenom || cur.prenom;
  return `<section><div class="card" id="pf-card" style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;gap:12px;align-items:center">${profAv(cur, true)}<div class="row-main"><div class="h3">${esc(profName(cur))}</div><p class="small muted">${list.length > 1 ? plural(list.length, "profil") + " sur cet appareil" : "Un seul profil sur cet appareil"}</p></div></div><div class="btn-row">${list.length > 1 ? `<button class="btn" data-a="prof-open">Changer de profil</button>` : ""}<button class="btn" data-a="prof-add">${icon("plus")}Ajouter un profil</button></div></div></section>`;
}
function openProfiles() {
  const list = profileList();
  const body = `<p class="small muted">Chaque profil a son programme, ses séances, son historique, ses records et ses réglages. Les profils sont séparés mais pas protégés par un code : toute personne qui utilise cet appareil peut les ouvrir.</p><div class="list">${list.map(x => `<button class="row" data-a="prof-pick" data-id="${esc(x.id)}" aria-current="${x.active}">${profAv(x, x.active)}<div class="row-main"><div class="row-title">${esc(profName(x.active ? { prenom: S.profile.prenom || x.prenom } : x))}</div><div class="row-sub">${x.active ? "Profil ouvert" : "Ouvrir ce profil"}</div></div>${x.active ? icon("check", "ic chev") : icon("chev", "ic chev")}</button>`).join("")}<button class="row" data-a="prof-add"><div class="row-main"><div class="row-title" style="color:var(--accent)">Ajouter un profil</div><div class="row-sub">Nouveau profil vide, avec le questionnaire de départ</div></div>${icon("plus", "ic chev")}</button></div>`;
  Sheet.open({ key: "profs", title: "Profils", body });
}
function viewProfil() {
  const p = S.profile;
  const seg = (f, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-a="pf-set" data-f="${f}" data-v="${v}" aria-pressed="${String(p[f]) === String(v)}">${l}</button>`).join("")}</div>`;
  return `${profilesCard()}<section><div class="form">
    <div class="field"><label for="pf-prenom">Prénom</label><input class="inp" id="pf-prenom" data-pf="prenom" maxlength="30" autocomplete="given-name" value="${esc(p.prenom)}" placeholder="Ton prénom"></div>
    <div class="field"><div class="lbl">Je suis</div>${seg("sexe", [["H", "Un homme"], ["F", "Une femme"]])}</div>
    <div class="grid3"><div class="field"><label for="pf-age">Âge</label><input class="inp tnum" id="pf-age" data-pf="age" inputmode="numeric" value="${p.age || ""}" placeholder="ans"></div><div class="field"><label for="pf-taille">Taille</label><input class="inp tnum" id="pf-taille" data-pf="taille" inputmode="numeric" value="${p.taille || ""}" placeholder="cm"></div><div class="field"><label for="pf-poids">Poids</label><input class="inp tnum" id="pf-poids" data-pf="poids" inputmode="decimal" value="${p.poids ? fmtNum(p.poids) : ""}" placeholder="kg"></div></div>
    <div class="field"><label for="pf-cible">Poids visé (facultatif)</label><input class="inp tnum" id="pf-cible" data-pf="poidsCible" inputmode="decimal" value="${p.poidsCible ? fmtNum(p.poidsCible) : ""}" placeholder="kg"><span class="small muted">Fonte te prévient quand tu l’atteins et adapte ton programme.</span></div>
    <div class="field"><div class="lbl">Niveau</div>${seg("niveau", [["debutant", "Débutant"], ["intermediaire", "Intermédiaire"], ["avance", "Avancé"]])}<span class="small muted">Débutant : moins de 6 mois de pratique régulière.</span></div>
    <div class="card"><button class="switch" role="switch" data-a="pf-simple" aria-checked="${simple()}"><span><b>Mode simple</b><br><span class="small muted">Explications pas à pas pendant la séance, moins de chiffres, options avancées cachées. Activé d’office pour les débutants.</span></span><span class="sw"></span></button></div>
    <div class="field"><div class="lbl">Objectifs</div><span class="small muted">Choisis-en un ou plusieurs. Le principal compte le plus de séances dans ton programme.</span><div class="list radio-list" role="group" aria-label="Objectifs">${Object.entries(OBJECTIFS).map(([k, o]) => { const i = p.objectifs.indexOf(k); return `<div class="radio obj-row"><button class="obj-t" role="checkbox" data-a="pf-obj" data-v="${k}" aria-checked="${i >= 0}"><span class="box">${icon("check")}</span><span>${esc(o.n)}</span></button>${i === 0 && p.objectifs.length > 1 ? `<span class="tag tag-p">Principal</span>` : i > 0 ? `<button class="link small" data-a="pf-obj-main" data-v="${k}">Mettre en principal</button>` : ""}</div>`; }).join("")}</div></div>
    <div class="field"><div class="lbl">Zone à travailler en priorité</div><span class="small muted">Facultatif, 2 au plus : un exercice en plus pour cette zone dans tes séances de musculation.</span><div class="chips chips-wrap" role="group" aria-label="Zones prioritaires">${Object.keys(ZONES).map(z => `<button class="chip" data-a="pf-zone" data-v="${z}" aria-pressed="${zoneList(p).indexOf(z) >= 0}">${esc(ZONES[z][0])}</button>`).join("")}</div></div>
    <div class="field"><div class="lbl">Séances par semaine</div>${seg("jours", [[1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]])}<span class="small muted">Jours d’entraînement : ${planDays(p).map(d => JOURS_L[d].toLowerCase()).join(", ")}. <button style="color:var(--accent);font-weight:600" data-a="seg" data-v="prog">Choisir mes jours</button></span></div>
    <div class="card"><button class="switch" role="switch" data-a="pf-toggle" data-f="sansSaut" aria-checked="${!!p.sansSaut}"><span><b>Éviter les sauts</b><br><span class="small muted">Genoux ou dos sensibles : burpees, squats sautés et corde remplacés.</span></span><span class="sw"></span></button></div>
    ${simple() ? "" : `<div class="field"><div class="lbl">Poids de ta barre olympique</div>${seg("barre", [[20, "20 kg"], [15, "15 kg"], [10, "10 kg"]])}<span class="small muted">Sert au calcul des disques à charger de chaque côté.</span></div>`}
    <button class="btn" data-a="onb-open">${icon("refresh")}Refaire le questionnaire de départ</button>
  </div></section>
  ${mesuresCard()}
  <section>${adaptCard()}</section>
  ${acctCard()}
  <section><div class="sec-h"><h2>Données</h2></div><div class="card" style="display:flex;flex-direction:column;gap:12px">${statusHTML()}<p class="small muted">${PWA ? "Tout reste sur ce téléphone et fonctionne sans réseau. Fonte te propose une sauvegarde toutes les 10 séances ou tous les 14 jours ; fais-en une aussi juste avant de changer de téléphone. " + backupAgo() + "." : "Tout est enregistré sur ce téléphone et fonctionne sans réseau une fois l’appli ouverte. Quand tu es connecté à ton compte Claude, ton profil, tes séances et ton historique sont aussi sauvegardés dans ton compte (privés, toi seul y as accès)."}</p><div class="btn-row"><button class="btn" data-a="data-export">${icon("download")}${PWA ? "Sauvegarder / transférer" : "Transférer mes données"}</button><button class="btn" data-a="data-import">Restaurer</button></div>${simple() ? "" : `<button class="btn" data-a="csv-export">${icon("download")}Exporter l’historique (tableur)</button>`}${(S.corbeille || []).length ? `<button class="btn" data-a="trash-open">${icon("trash")}Corbeille (${(S.corbeille || []).length})</button>` : ""}<div class="btn-row"><button class="btn" data-a="hist-clear">Effacer l’historique</button><button class="btn btn-danger" data-a="reset-all">Tout réinitialiser</button></div>${undoBtn()}</div></section>
  <section><div class="card" style="display:flex;gap:14px;align-items:center"><div class="brand"><svg aria-hidden="true" style="width:46px;height:46px"><use href="#logo"/></svg></div><div class="row-main"><b>Fonte</b><span class="small muted">${EX.length} exercices · ${TPL.length} séances types. Les estimations (calories, fréquence cardiaque) sont indicatives. En cas de douleur ou de souci de santé, demande l’avis d’un médecin.</span></div></div></section>`;
}
const VIEWS = { accueil: viewAccueil, exercices: viewExercices, seances: viewSeances, agenda: viewAgenda, profil: viewProfil };

/* ================= Éditeur de séance ================= */
let E = null;
function openEditor(mode, se, opts) {
  /* Mode simple : pas d’écran de préparation, la séance guidée démarre directement */
  if (mode === "prep" && simple() && se && (se.items || []).length) { const o = opts || {}; startRun(se, { tplId: o.tplId || null, srcId: o.srcId || null, eventId: o.eventId || null, pj: o.pj != null ? o.pj : null, pk: o.pk || null }); return; }
  Sheet.closeAll();
  E = Object.assign({ mode, se: clone(se) }, opts || {});
  if (!Array.isArray(E.se.items)) E.se.items = [];
  if (!E.se.mode) E.se.mode = "series";
  renderEditor(); $("#editor").hidden = false; $("#editor .ov-body").scrollTop = 0; lockPage();
}
function closeEditor() { E = null; $("#editor").hidden = true; $("#editor").innerHTML = ""; lockPage(); }
function edStp(i, f, v, label, step) {
  return `<div class="stp"><span>${label}</span><div class="stp-ctl"><button type="button" data-a="ed-step" data-i="${i}" data-f="${f}" data-d="${-step}" aria-label="${label} moins">−</button><input id="ed-${i}-${f}" inputmode="decimal" data-i="${i}" data-f="${f}" value="${fmtNum(v || 0)}" aria-label="${label}"><button type="button" data-a="ed-step" data-i="${i}" data-f="${f}" data-d="${step}" aria-label="${label} plus">+</button></div></div>`;
}
function edItem(it, i) {
  const e = EX_BY_ID[it.id]; if (!e) return "";
  const n = E.se.items.length, circ = E.se.mode === "circuit", f = [];
  if (!circ) f.push(edStp(i, "series", it.series, "Séries", 1));
  f.push(it.duree > 0 ? edStp(i, "duree", it.duree, "Durée (s)", 5) : edStp(i, "reps", it.reps, "Reps", 1));
  if (!(e.g === "cardio" || e.g === "mobilite" || e.g === "etirements") && !(it.duree > 0 && !it.charge)) f.push(edStp(i, "charge", it.charge, isAssist(e.id) ? "Assist. kg" : (chargeLabel(e.id, 1) === "Kg / haltère" ? "Kg / haltère" : "Charge kg"), chargeStep(e)));
  f.push(edStp(i, "repos", it.repos, circ ? "Récup (s)" : "Repos (s)", circ ? 5 : 15));
  const pl = perfLine(it.id, it.duree ? 0 : it.reps);
  return `<div class="ed-item"><div class="ed-head">${figHTML(e.p, e.s, "xs")}<div class="row-main" data-a="ex-open" data-id="${e.id}" role="button" tabindex="0"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${e.p.map(m => MUSCLES[m]).join(", ")}${it.parCote ? " · par côté" : ""}</div></div><div class="ed-tools"><button data-a="ed-move" data-i="${i}" data-d="-1" ${i === 0 ? "disabled" : ""} aria-label="Monter">${icon("up")}</button><button data-a="ed-move" data-i="${i}" data-d="1" ${i === n - 1 ? "disabled" : ""} aria-label="Descendre">${icon("down")}</button><button data-a="ed-del" data-i="${i}" aria-label="Retirer">${icon("trash")}</button></div></div><div class="ed-grid ${f.length === 3 ? "c3" : ""}">${f.join("")}</div>${(ECH.has(e.id) || (!circ && i < n - 1)) && !circ ? `<div class="ed-flags">${ECH.has(e.id) ? `<button class="chip chip-sm" data-a="ed-echec" data-i="${i}" aria-pressed="${!!it.echec}">${icon("flame")}Dernière série à l’échec</button>` : ""}${i < n - 1 ? `<button class="chip chip-sm" data-a="ed-ss" data-i="${i}" aria-pressed="${!!it.ss}">${icon("link")}Superset avec le suivant</button>` : ""}</div>` : ""}${pl ? `<div class="small muted">${esc(pl)}</div>` : ""}</div>${linked(E.se, i) ? `<div class="ss-join">${icon("link")}<span>Enchaîné sans repos avec ${esc((EX_BY_ID[E.se.items[i + 1].id] || {}).n || "le suivant")}, repos après le dernier exercice du superset</span></div>` : ""}`;
}
function renderEditor() {
  const se = E.se, prep = E.mode === "prep", circ = se.mode === "circuit";
  const d = se.items.length ? estDuree(se) : 0;
  let h = `<div class="ov-top"><button class="btn-icon" data-a="ed-close" aria-label="Fermer">${icon("x")}</button><h3>${prep ? "Préparer la séance" : (E.srcId ? "Modifier la séance" : "Nouvelle séance")}</h3></div><div class="ov-body">`;
  h += `<div class="field"><label for="ed-nom">Nom de la séance</label><input class="inp" id="ed-nom" data-ed="nom" maxlength="60" value="${esc(se.nom || "")}" placeholder="Ex. Haut du corps du lundi"></div>`;
  h += `<div class="field"><div class="lbl">Format</div><div class="seg"><button data-a="ed-mode" data-v="series" aria-pressed="${!circ}">Séries classiques</button><button data-a="ed-mode" data-v="circuit" aria-pressed="${circ}">Circuit</button></div><span class="small muted">${circ ? "Tu enchaînes tous les exercices, puis tu recommences pour chaque tour." : "Toutes les séries d’un exercice, puis l’exercice suivant."}</span></div>`;
  if (circ) h += `<div class="circuit-box">${edStp(-1, "tours", se.tours || 3, "Tours", 1)}${edStp(-1, "roundRest", se.roundRest || 60, "Pause entre tours (s)", 15)}</div>`;
  if (prep && se.notes && se.notes.length) h += `<div class="note">${icon("sparkle")}<span>${se.notes.map(esc).join(" · ")}.</span></div>`;
  if (prep) h += `<p class="small muted">Règle les séries, répétitions, charges et repos pour aujourd’hui. Les charges viennent de ta dernière séance, ou sont calculées d’après ton profil la première fois.</p>`;
  h += se.items.length ? se.items.map(edItem).join("") : `<div class="card empty"><p>Ajoute des exercices pour composer ta séance.</p></div>`;
  h += `<button class="btn btn-block" data-a="ed-add">${icon("plus")}Ajouter des exercices</button>`;
  if (se.items.length) { const on = echOn(se), wu = warmUp(se.items, lowImpact(S.profile)); h += `<div class="card"><button class="switch" role="switch" data-a="ed-echauf" aria-checked="${on}"><span><b>Échauffement au début</b><br><span class="small muted">${on ? "≈ " + fmtDur(warmDuree(se.items, lowImpact(S.profile))) + " : " : ""}${esc(warmTxt(wu))}</span></span><span class="sw"></span></button></div>`; }
  if (se.items.length) { const on = etirOn(se), cd = coolDown(se.items); h += `<div class="card"><button class="switch" role="switch" data-a="ed-etir" aria-checked="${on}"><span><b>Étirements à la fin</b><br><span class="small muted">${cd.length ? (on ? "≈ " + fmtDur(coolDuree(se.items)) + " : " : "") + esc(cd.map(it => EX_BY_ID[it.id].n.replace(/ \(.*\)$/, "")).join(", ")) : "Rien à ajouter : ta séance contient déjà ces étirements."}</span></span><span class="sw"></span></button></div>`; }
  if (se.items.length) h += `<div class="meta" style="justify-content:center"><span>${icon("clock")}≈ ${fmtDur(d)}</span><span>${icon("flame")}≈ ${estKcal(se, S.profile, d)} kcal</span></div>`;
  if (!prep && E.srcId) h += `<button class="btn btn-danger btn-block" data-a="ed-delete">${icon("trash")}Supprimer cette séance</button>`;
  h += `</div><div class="ov-foot">${prep ? `<button class="btn btn-lg" data-a="ed-save" style="flex:0 1 auto">Enregistrer</button><button class="btn btn-primary btn-lg" data-a="ed-go">${icon("play")}C’est parti</button>` : `<button class="btn btn-primary btn-lg" data-a="ed-save">Enregistrer</button>`}</div>`;
  const body = $("#editor .ov-body"), st = body ? body.scrollTop : 0;
  $("#editor").innerHTML = h;
  $("#editor .ov-body").scrollTop = st;
}
const ED_MIN = { series: 1, reps: 1, duree: 5, charge: 0, repos: 0, tours: 1, roundRest: 0 };
function edSet(i, f, v) {
  v = Math.max(ED_MIN[f] || 0, Math.round(v * 100) / 100);
  if (i < 0) E.se[f] = v; else E.se.items[i][f] = v;
  const inp = document.getElementById("ed-" + i + "-" + f); if (inp && document.activeElement !== inp) inp.value = fmtNum(v);
}

/* ---------- Sélecteur d'exercices ---------- */
let PK = null;
function openPicker() {
  PK = { sel: [], q: "", g: "all" };
  const body = `<div class="search">${icon("search")}<input id="pk-q" type="search" placeholder="Exercice, muscle, matériel…" autocomplete="off" aria-label="Rechercher"></div><div class="chips" id="pk-chips">${pkChips()}</div><div id="pk-list">${pkList()}</div>`;
  Sheet.open({ key: "pk", title: "Ajouter des exercices", body, tall: true, foot: `<button class="btn btn-primary btn-lg" data-a="pk-ok" id="pk-ok">Ajouter</button>`, onClose: () => { PK = null; } });
}
function pkChips() { return `<button class="chip" data-a="pk-g" data-g="all" aria-pressed="${PK.g === "all"}">Tous</button>` + GROUPS.map(([k, l]) => `<button class="chip" data-a="pk-g" data-g="${k}" aria-pressed="${PK.g === k}">${l}</button>`).join(""); }
function pkList() {
  const q = norm(PK.q.trim());
  const list = EX.filter(e => exMatch(e, PK.g, "", q));
  if (!list.length) return `<div class="card empty"><p>Aucun exercice trouvé.</p></div>`;
  return `<div class="list">${list.map(e => { const on = PK.sel.indexOf(e.id) >= 0; return exRow(e, { act: "pk-t", pressed: on, right: `<span class="radio" style="padding:0;width:auto" aria-checked="${on}"><span class="dot"></span></span>` }); }).join("")}</div>`;
}
function pkFoot() { const b = $("#pk-ok"); if (b) b.textContent = PK.sel.length ? "Ajouter " + plural(PK.sel.length, "exercice") : "Ajouter"; }

/* ================= Lecteur de séance ================= */
let R = null;
const RING_C = 2 * Math.PI * 54;
function saveRun() { try { if (R) localStorage.setItem(storeKey("run"), JSON.stringify(R)); } catch (e) { } }
function clearRun() { try { localStorage.removeItem(storeKey("run")); } catch (e) { } }
/* Séance commencée il y a plus de 12 h : plus proposée à la reprise, mais jamais ignorée en silence (D6) :
   l’accueil propose de l’enregistrer à sa date ou de la supprimer. r.stale l’indique (non enregistré dans fonte:run). */
const STALE_MS = 12 * 3600e3;
function loadRun() {
  try { const r = JSON.parse(localStorage.getItem(storeKey("run")) || "null"); if (r && r.se && r.steps && Array.isArray(r.log)) { r.stale = !(Date.now() - (r.start || 0) < STALE_MS); return r; } } catch (e) { }
  return null;
}
const runSets = r => (r && Array.isArray(r.log) ? r.log.reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0) : 0);
/* « Ne pas enregistrer » (D2) : la séance supprimée est gardée 10 s dans fonte:run-trash pour « Annuler », même après rechargement */
const UNDO_MS = 10e3; /* séance supprimée gardée dans fonte:p:<profil>:run-trash */
let undoT = null;
function showUndo(msg, action, until) {
  const b = $("#undo"); if (!b) return;
  clearTimeout(undoT);
  b.querySelector("span").textContent = msg; b.querySelector("button").dataset.a = action; b.hidden = false;
  undoT = setTimeout(hideUndo, Math.max(0, until - Date.now()));
}
function hideUndo() { const b = $("#undo"); if (b) b.hidden = true; clearTimeout(undoT); }
function trashRun(r) {
  const run = clone(r); delete run.stale;
  const at = Date.now();
  try { localStorage.setItem(storeKey("run-trash"), JSON.stringify({ at, run })); } catch (e) { }
  TRASH = { at, run };
  showUndo("Séance supprimée", "run-undo-discard", at + UNDO_MS);
}
let TRASH = null;
function readTrash() {
  let t = TRASH;
  if (!t) try { t = JSON.parse(localStorage.getItem(storeKey("run-trash")) || "null"); } catch (e) { t = null; }
  return t && t.run && Date.now() - (t.at || 0) < UNDO_MS ? t : null;
}
function clearTrash() { TRASH = null; try { localStorage.removeItem(storeKey("run-trash")); } catch (e) { } }
let AC = null;
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; } }
function beep(f, d, v) {
  if (AC) try {
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(v || 0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.03);
  } catch (e) { }
  try { if (navigator.vibrate) navigator.vibrate(d > 0.2 ? 350 : 60); } catch (e) { }
}
let WL = null;
async function wakeLock() { try { if (navigator.wakeLock && !WL) { WL = await navigator.wakeLock.request("screen"); WL.addEventListener("release", () => { WL = null; }); } } catch (e) { WL = null; } }
function releaseWake() { try { if (WL) WL.release(); } catch (e) { } WL = null; }

function startRun(se, opts) {
  se = clone(se); se.kind = se.kind || (se.mode === "circuit" ? "hiit" : "muscu");
  se.items = (se.items || []).filter(it => it && EX_BY_ID[it.id] && !it.cool && !it.warm);
  const main = se.items;
  if (echOn(se) && main.length) se.items = warmUp(main, lowImpact(S.profile)).concat(se.items);
  if (etirOn(se) && main.length) se.items = se.items.concat(coolDown(main));
  if (!se.items.length) { toast("Aucun exercice de cette séance n’existe encore dans l’appli."); return; }
  Sheet.closeAll(); closeEditor();
  R = Object.assign({ se, steps: buildSteps(se), idx: 0, start: Date.now(), log: se.items.map(() => []), t: null, cur: null, beeped: {} }, opts || {});
  unlockAudio(); wakeLock(); enterStep(); $("#runner").hidden = false; lockPage();
}
function enterStep() {
  const st = R.steps[R.idx];
  if (!st) { finishRun(); return; }
  R.beeped = {};
  if (st.k === "rest") R.t = { end: Date.now() + st.d * 1000, total: st.d, running: true, left: st.d };
  else {
    const it = R.se.items[st.i];
    if (it.duree > 0 && (st.cool || st.warm)) { R.t = { left: it.duree, total: it.duree, running: true, end: Date.now() + it.duree * 1000 }; R.cur = null; }
    else if (it.duree > 0) { R.t = st.fail ? { up: true, acc: 0, start: null, total: it.duree, running: false } : { left: it.duree, total: it.duree, running: false, end: null }; R.cur = null; }
    else { R.t = null; const prev = R.log[st.i][R.log[st.i].length - 1]; R.cur = { r: it.reps, kg: prev && prev.kg != null ? prev.kg : (it.charge || 0) }; }
  }
  saveRun(); renderRunner();
}
function timeLeft() { const t = R && R.t; if (!t) return 0; return t.running ? (t.end - Date.now()) / 1000 : t.left; }
function upElapsed() { const t = R && R.t; if (!t) return 0; return t.acc + (t.running && t.start ? (Date.now() - t.start) / 1000 : 0); }
function upLabel(el) { return el >= R.t.total ? "Objectif passé, continue" : (R.t.running ? "Tiens bon" : "Prêt ?"); }
function ringHTML(rest) {
  if (R.t.up) {
    const el = upElapsed();
    return `<div class="ring-wrap"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bg" cx="60" cy="60" r="54" fill="none" stroke-width="8"/><circle id="ring-fg" class="ring-fg" cx="60" cy="60" r="54" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - Math.min(1, el / (R.t.total || 1)))}"/></svg><div class="ring-txt"><b id="ring-t" role="timer" aria-live="off">${mmss(el)}</b><span id="ring-l">${upLabel(el)}</span></div></div>`;
  }
  const left = timeLeft(), tot = R.t.total || 1;
  return `<div class="ring-wrap ${rest ? "ring-rest" : ""}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bg" cx="60" cy="60" r="54" fill="none" stroke-width="8"/><circle id="ring-fg" class="ring-fg" cx="60" cy="60" r="54" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - Math.max(0, left) / tot)}"/></svg><div class="ring-txt"><b id="ring-t" role="timer" aria-live="off">${mmss(left)}</b><span>${rest ? "Repos" : (R.t.running ? "Tiens bon" : "Prêt ?")}</span></div></div>`;
}
function platesHTML(total) {
  const bar = S.profile.barre || 20;
  if (!total || total <= bar) return total && total < bar ? `<div class="plates"><span>Moins lourd que la barre (${bar} kg) : prends une barre plus légère.</span></div>` : "";
  let side = (total - bar) / 2; const used = [];
  const P = [[25, "var(--red)", 44], [20, "var(--blue)", 44], [15, "var(--yellow)", 40], [10, "var(--green)", 36], [5, "var(--plate5)", 28], [2.5, "var(--red)", 22], [1.25, "var(--plate125)", 18]];
  P.forEach(([w, c, hh]) => { while (side >= w - 1e-9) { used.push([w, c, hh]); side -= w; } });
  return `<div class="plates" id="plates"><div class="bar">${used.map(([w, c, hh]) => `<i class="pl" style="height:${hh}px;background:${c}"></i>`).join("")}</div><span>Par côté : ${used.map(u => fmtNum(u[0])).join(" + ")}${side > 0.01 ? " (≈)" : ""}<br>barre de ${bar} kg</span></div>`;
}
/* Mode simple : ce qu’il faut faire maintenant, en une phrase, et la façon de faire au premier passage */
function guideNote(st, it, e) {
  const kg = it.charge ? (chargeLabel(e.id) === "Par haltère" ? " avec un haltère de " + fmtNum(it.charge) + " kg dans chaque main" : isAssist(e.id) ? " avec " + fmtNum(it.charge) + " kg d’assistance" : " avec " + fmtNum(it.charge) + " kg") : "";
  const what = it.duree > 0 ? `Touche « Démarrer » et tiens ${fmtSec(it.duree)}${kg}. Le téléphone sonne à la fin.` : `Fais ${it.reps} mouvements${it.parCote ? " de chaque côté" : ""}${kg}, à ton rythme, puis touche « Série terminée ».`;
  const how = st.set === 1 && e.d && e.d.length ? `<ol class="steps steps-sm">${e.d.slice(0, 3).map(x => `<li><span>${esc(x)}</span></li>`).join("")}</ol>` : "";
  return `<div class="note note-help">${icon("info")}<span><b>Série ${st.set} sur ${st.of}.</b> ${esc(what)}${st.set === 1 ? " Trop dur ou trop facile ? Change le poids avec − et +." : ""}</span></div>${how}`;
}
let ANIM_IDX = -1;
function renderRunner() {
  const st = R.steps[R.idx], se = R.se, n = se.items.length;
  let autoAnim = false;
  let segs = "";
  se.items.forEach((it, i) => {
    const tot = R.steps.filter(s => s.k === "work" && s.i === i).length;
    const done = R.steps.slice(0, R.idx).filter(s => s.k === "work" && s.i === i).length;
    segs += `<i><b style="width:${R.done || !tot ? (R.skipped && R.skipped[i] ? 0 : 100) : Math.round(done / tot * 100)}%"></b></i>`;
  });
  let top = `<div class="run-top"><button class="btn-icon" data-a="run-quit" aria-label="Arrêter la séance">${icon("x")}</button><div class="t"><b>${esc(se.nom)}</b><span id="run-el" class="tnum">${mmss((Date.now() - R.start) / 1000)}</span></div>`;
  let body = "", foot = "";
  if (R.done) {
    top += `<span style="width:40px"></span></div>`;
    const sum = runSummary();
    body = `<div class="run-kicker">Séance terminée</div><h2 class="disp" style="font-size:44px">Bien joué${S.profile.prenom ? " " + esc(S.profile.prenom) : ""}</h2>
      <div class="sum"><div class="stat"><b>${fmtDur(sum.duree)}</b><span>durée</span></div><div class="stat"><b>${sum.sets}</b><span>séries réalisées</span></div><div class="stat"><b>${fmtNum(Math.round(sum.volume))}<small style="font-size:17px"> kg</small></b><span>volume soulevé</span></div><div class="stat"><b>≈ ${sum.kcal}</b><span>kcal estimées</span></div></div>
      ${recordsCard()}
      <div class="field"><div class="lbl">Ton ressenti</div><div class="feel">${["Facile", "Correct", "Dur", "Très dur"].map((l, i) => `<button data-a="run-feel" data-v="${i + 1}" aria-pressed="${R.feel === i + 1}">${l}</button>`).join("")}</div></div>
      <div class="list">${se.items.map((it, i) => { const e = EX_BY_ID[it.id], lg = R.log[i]; if (!e || (!lg.length && (it.cool || it.warm))) return ""; if (!lg.length) return `<div class="row"><div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">Pas fait</div></div></div>`; return `<div class="row"><div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${lg.map(x => x.d ? fmtSec(x.d) : x.r + (x.kg ? " × " + fmtNum(x.kg) + " kg" : "")).join(" · ")}</div></div></div>`; }).join("")}</div>`;
    foot = `<button class="btn btn-primary btn-lg btn-block" data-a="run-save">${icon("check")}Enregistrer la séance</button><button class="btn btn-ghost btn-block" data-a="run-discard">Ne pas enregistrer</button>`;
  } else if (st.k === "work") {
    const it = se.items[st.i], e = EX_BY_ID[it.id];
    top += `<button class="btn-icon" data-a="ex-open" data-id="${e.id}" aria-label="Fiche de l’exercice">${icon("info")}</button></div>`;
    const nWarm = se.items.filter(x => x.warm).length, warmIds = se.items.map((x, k) => x.warm ? k : -1).filter(k => k >= 0);
    const nMain = se.items.filter(x => !x.cool && !x.warm && x.rep == null).length, num = (it.rep != null ? it.rep : st.i) + 1 - nWarm, coolIds = se.items.map((x, k) => x.cool ? k : -1).filter(k => k >= 0);
    const kicker = st.warm ? `Échauffement · ${warmIds.indexOf(st.i) + 1}/${warmIds.length}` : st.cool ? `Étirements · ${coolIds.indexOf(st.i) + 1}/${coolIds.length}` : se.mode === "circuit" ? `Tour ${st.set}/${st.of} · Exercice ${num}/${nMain}` : `${st.g != null ? "Superset " + (st.gi + 1) + "/" + st.gn + " · " : ""}Exercice ${num}/${nMain} · Série ${st.set}/${st.of}`;
    const nst = R.steps[R.idx + 1], chain = st.g != null && nst && nst.k === "work" && nst.g === st.g && nst.i !== st.i ? EX_BY_ID[se.items[nst.i].id] : null;
    autoAnim = st.set === 1;
    body = `<div class="run-ex"><div class="row-main"><div class="run-kicker">${kicker}</div><h2>${esc(e.n)}</h2>${it.parCote ? `<div class="small muted">Répétitions par côté</div>` : (e.pc && it.duree ? `<div class="small muted">${st.of === 2 && st.set === 2 ? "Deuxième côté" : (st.of === 2 ? "Premier côté" : "Par côté")}</div>` : "")}</div>${figHTML(e.p, e.s, "sm")}</div>`;
    if (!st.cool && !st.warm) body += `<div class="run-tools"><button class="chip chip-sm" data-a="run-swap">${icon("refresh")}Remplacer l’exercice</button>${R.se.dl ? `<span class="tag">Semaine allégée</span>` : ""}</div>`;
    if (S.notes[e.id]) body += `<div class="note">${icon("edit")}<span>${esc(S.notes[e.id])}</span></div>`;
    if (st.later) body += `<div class="note">${icon("clock")}<span><b>Exercice mis de côté tout à l’heure.</b> ${laterLeft(st.i) ? "Si la machine est encore prise, tu peux le passer." : "Si la machine est encore prise, repousse-le encore ou passe-le."}</span></div>`;
    if (st.warm && warmIds.indexOf(st.i) === 0 && st.set === 1) body += `<div class="note">${icon("flame")}<span>Échauffement ciblé sur les muscles de ta séance : ${e.g === "cardio" ? "d’abord quelques minutes de cardio doux pour monter en température, puis quelques mouvements de mobilité" : "des mouvements amples et contrôlés, sans forcer"}. Le minuteur démarre tout seul.</span></div>`;
    if (st.cool && coolIds.indexOf(st.i) === 0 && st.set === 1) body += `<div class="note">${icon("heart")}<span>Retour au calme : tiens chaque position sans à-coups, en respirant lentement. Le minuteur démarre tout seul.</span></div>`;
    body += laterNote(st.i);
    if (simple() && !st.warm && !st.cool) body += guideNote(st, it, e);
    if (st.fail) body += `<div class="note note-f">${icon("flame")}<span><b>Dernière série jusqu’à l’échec</b> ${gl("echec")} : continue jusqu’à ne plus réussir une répétition propre${it.duree > 0 ? ", puis touche « J’arrête »" : ", puis note ton total"}.</span></div>`;
    if (it.duree > 0) {
      body += ringHTML(false);
      if (it.charge) body += `<p class="small muted" style="text-align:center">${chargeLabel(e.id) === "Par haltère" ? "Avec " + fmtNum(it.charge) + " kg dans chaque main" : "Charge : " + kgTxt(e.id, it.charge)}</p>`;
      if (R.t.up) { const el = upElapsed(); foot = R.t.running ? `<div class="run-nav"><button class="btn btn-lg" data-a="run-toggle" style="flex:1">${icon("pause")}Pause</button><button class="btn btn-primary btn-lg" data-a="run-next" style="flex:1.4">${icon("check")}J’arrête</button></div>` : `<div class="run-nav"><button class="btn btn-lg" data-a="run-next" style="flex:1">${icon("check")}${el > 0 ? "Terminé" : "Passer"}</button><button class="btn btn-primary btn-lg" data-a="run-toggle" style="flex:1.4">${icon("play")}${el > 0 ? "Reprendre" : "Démarrer"}</button></div>`; }
      else foot = `<div class="run-nav"><button class="btn btn-lg" data-a="run-next" style="flex:1">${icon("check")}Terminé</button><button class="btn btn-primary btn-lg" data-a="run-toggle" style="flex:1.4">${R.t.running ? icon("pause") + "Pause" : icon("play") + "Démarrer"}</button></div>`;
    } else {
      const showKg = !(e.g === "cardio" || e.g === "mobilite" || e.g === "etirements") && (it.charge > 0 || e.m.some(m => ["barre", "halteres", "machine", "poulie", "kettlebell", "ez", "smith"].indexOf(m) >= 0));
      const step = chargeStep(e);
      body += `<div class="target"${showKg ? "" : ' style="grid-template-columns:1fr"'}><div class="big-stp"><span>${st.fail ? "Répétitions (max)" : "Répétitions"}</span><div class="v" id="run-r">${R.cur.r}</div><div class="ctl"><button data-a="run-adj" data-f="r" data-d="-1" aria-label="Une répétition de moins">−</button><button data-a="run-adj" data-f="r" data-d="1" aria-label="Une répétition de plus">+</button></div></div>${showKg ? `<div class="big-stp"><span>${chargeLabel(e.id)}</span><div class="v" id="run-kg">${fmtNum(R.cur.kg)}<small> kg</small></div><div class="ctl"><button data-a="run-adj" data-f="kg" data-d="${-step}" aria-label="Moins lourd">−</button><button data-a="run-adj" data-f="kg" data-d="${step}" aria-label="Plus lourd">+</button></div></div>` : ""}</div>`;
      if (e.m.indexOf("barre") >= 0 && showKg) body += `<div id="plates-w">${platesHTML(R.cur.kg)}</div>`;
      if (!st.fail && !st.cool && !simple()) body += `<div class="field"><div class="lbl">Répétitions encore possibles à la fin (facultatif) ${gl("reserve")}</div><div class="feel rir" role="group">${[0, 1, 2, 3].map(v => `<button data-a="run-rir" data-v="${v}" aria-pressed="${R.cur.rir === v}">${v === 3 ? "3 et +" : v}</button>`).join("")}</div></div>`;
      const pl = perfLine(it.id, it.duree ? 0 : it.reps); if (pl) body += `<div class="small muted">${esc(pl)}</div>`;
      if (!simple() || st.cool || st.warm) body += `<p class="small muted">${st.fail ? "Au moins " + it.reps + " répétitions, puis jusqu’à l’échec" : "Objectif : " + it.reps + " répétitions"}${it.charge || isAssist(e.id) ? (isAssist(e.id) ? " avec " : " à ") + kgTxt(e.id, it.charge || 0) : ""}. Ajuste avec − et + si tu en fais plus ou moins${showKg ? ", et change la charge si c’est trop facile ou trop dur" : ""}.</p>`;
      foot = `<button class="btn btn-primary btn-lg btn-block" data-a="run-next">${icon("check")}${chain ? "Enchaîne : " + esc(chain.n) : "Série terminée"}</button>`;
    }
    body += animHTML(e.id);
    const canLater = !st.cool && !st.warm && !laterLeft(st.i);
    if (st.warm) foot += `<div class="run-nav run-nav3"><button class="btn btn-ghost" data-a="run-prev" ${R.idx === 0 ? "disabled" : ""}>${icon("back")}Précédent</button><button class="btn btn-ghost" data-a="run-skipwarm">Passer l’échauffement${icon("skip")}</button></div>`;
    else foot += `<div class="run-nav run-nav3"><button class="btn btn-ghost" data-a="run-prev" ${R.idx === 0 ? "disabled" : ""}>${icon("back")}Précédent</button>${st.cool ? `<button class="btn btn-ghost" data-a="run-end">${icon("check")}Finir</button>` : `<button class="btn btn-ghost" data-a="run-later" ${canLater ? "" : "disabled"} aria-label="Plus tard : la machine est prise, on y revient à la fin">${icon("clock")}Plus tard</button>`}<button class="btn btn-ghost" data-a="run-refuse">Ne pas faire${icon("skip")}</button></div>`;
  } else {
    const nx = R.steps.slice(R.idx + 1).find(s => s.k === "work");
    top += nx ? `<button class="btn-icon" data-a="ex-open" data-id="${se.items[nx.i].id}" aria-label="Fiche de l’exercice suivant">${icon("info")}</button></div>` : `<span style="width:40px"></span></div>`;
    body = `<div class="run-kicker" style="color:var(--green)">${st.fromWarm ? "Échauffé, place à la séance" : st.toCool ? "Place aux étirements" : (st.round ? "Fin du tour, souffle" : "Récupère")}</div>` + ringHTML(true) + (simple() ? `<p class="small muted" style="text-align:center">Pause : respire, bois une gorgée d’eau. Le téléphone sonne à la fin, puis touche « Passer » pour continuer.</p>` : "") + laterNote(nx ? nx.i : -1);
    if (nx) autoAnim = nx.set === 1;
    if (nx) { const it = se.items[nx.i], e = EX_BY_ID[it.id]; body += `<div class="next">${ANIM.has(e.id) ? animMini(e.id, "next") : figHTML(e.p, e.s, "xs")}<div class="row-main"><small>À suivre${nx.cool ? " · étirement" : (se.mode === "circuit" ? "" : " · série " + nx.set + "/" + nx.of)}${nx.later ? " · mis de côté" : ""}</small><div class="row-title">${esc(e.n)}</div><div class="row-sub">${it.duree ? fmtSec(it.duree) : it.reps + " reps"}${it.charge ? " · " + kgTxt(it.id, R.log[nx.i].length && R.log[nx.i][R.log[nx.i].length - 1].kg != null ? R.log[nx.i][R.log[nx.i].length - 1].kg : it.charge) : ""}${nx.fail ? " · jusqu’à l’échec" : ""}</div></div></div>`; }
    foot = `<div class="run-nav"><button class="btn btn-lg" data-a="run-time" data-d="-15" style="flex:1">−15 s</button><button class="btn btn-lg" data-a="run-time" data-d="15" style="flex:1">+15 s</button><button class="btn btn-primary btn-lg" data-a="run-next" style="flex:1.3">Passer${icon("skip")}</button></div>`;
  }
  $("#runner").innerHTML = top + `<div class="pbar" aria-hidden="true">${segs}</div><div class="run-body">${body}</div><div class="run-foot">${foot}</div>`;
  ANIM.mount($("#runner"), autoAnim && R.idx !== ANIM_IDX);
  ANIM_IDX = R.idx;
}
/* Records battus pendant la séance qui vient de se terminer */
function recordsCard() {
  const recs = findRecords(S.historique, runLog());
  if (!recs.length) return "";
  return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="h3" style="display:flex;gap:8px;align-items:center">${icon("trophy", "ic rec-ic")}${recs.length > 1 ? recs.length + " nouveaux records" : "Nouveau record"}</div><ul class="bullets">${recs.map(r => `<li><b>${esc(EX_BY_ID[r.id].n)}</b> : ${esc(recText(r.k, r.v))} (avant : ${esc(recText(r.k, r.old).replace(/^[^:]*: /, ""))})</li>`).join("")}</ul></div>`;
}
/* Exercices mis de côté encore à venir (hors exercice affiché) */
function laterNote(cur) {
  if (!R) return "";
  const ids = [];
  R.steps.slice(R.idx + 1).forEach(s => { if (s.k === "work" && s.later && s.i !== cur && ids.indexOf(s.i) < 0) ids.push(s.i); });
  if (!ids.length) return "";
  return `<div class="note">${icon("clock")}<span>Mis de côté : <b>${ids.map(i => esc((EX_BY_ID[R.se.items[i].id] || {}).n)).join(", ")}</b>. On y revient ${R.se.mode === "circuit" ? "en fin de tour" : "après les autres exercices"}.</span></div>`;
}
/* Vrai s'il ne reste aucun autre exercice vers lequel repousser celui-ci */
function laterLeft(i) {
  const st = R.steps[R.idx], rest = R.steps.slice(R.idx).filter(s => s.k === "work" && !s.cool && s.i !== i);
  return !(R.se.mode === "circuit" ? rest.some(s => s.set === st.set) : rest.length);
}
function runSummary() {
  const duree = Math.round(((R.endAt || Date.now()) - R.start) / 1000);
  let sets = 0, volume = 0;
  R.log.forEach(l => l.forEach(x => { sets++; if (x.r && x.kg) volume += x.r * x.kg; }));
  return { duree, sets, volume, kcal: estKcal(R.se, S.profile, duree) };
}
function finishRun() { R.done = true; R.endAt = R.endAt || Date.now(); R.t = null; saveRun(); releaseWake(); renderRunner(); }
function runNext() {
  const st = R.steps[R.idx]; if (!st) return;
  if (st.k === "work") {
    const it = R.se.items[st.i];
    if (it.duree > 0) { const done = R.t.up ? Math.round(upElapsed()) : Math.round(R.t.total - Math.max(0, timeLeft())); R.log[st.i].push({ s: R.idx, d: Math.max(1, done) }); }
    else R.log[st.i].push(Object.assign({ s: R.idx, r: R.cur.r, kg: R.cur.kg }, R.cur.rir != null ? { rir: R.cur.rir } : {}));
  }
  R.idx++; enterStep();
}
function closeRunner() { R = null; $("#runner").hidden = true; $("#runner").innerHTML = ""; releaseWake(); clearRun(); lockPage(); render(); }
/* at : heure de la séance (séance non terminée de plus de 12 h enregistrée à sa date, D6) ; par défaut maintenant */
function saveRunHistory(at) {
  const sum = runSummary(), se = R.se, now = at || Date.now();
  const log = runLog(), pr = findRecords(S.historique.filter(h => (h.ts || 0) < now), log).map(r => ({ id: r.id, k: r.k, v: r.v }));
  const ref = R.tplId ? { k: "t", id: R.tplId } : (R.srcId ? { k: "p", id: R.srcId } : null);
  const today = toISO(new Date(now));
  const entry = { id: rid(), date: today, ts: now, upd: Date.now(), nom: se.nom || "Séance", kind: se.kind, ref, duree: sum.duree, volume: Math.round(sum.volume), kcal: sum.kcal, sets: sum.sets, ressenti: R.feel || null, log, pr: pr.length ? pr : undefined, pj: R.pj != null ? R.pj : undefined, pk: R.pk || undefined, dl: se.dl ? 1 : undefined };
  S.historique.unshift(entry);
  UI.progSkip = 0;
  if (at) S.historique.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  S.historique = trimHist(S.historique);
  /* références (dernière performance et zone de répétitions) : refStep, la même règle que le recalcul D3 (engine-training.js) ;
     semaine allégée : les charges de référence ne baissent pas ; séance ancienne : ne remplace pas une référence plus récente */
  refStep(S.lastPerf, S.refs, entry);
  let ag = false;
  const ev = R.eventId ? S.agenda.find(e => e.id === R.eventId) : (ref ? S.agenda.find(e => e.date === today && !e.fait && e.ref && e.ref.k === ref.k && e.ref.id === ref.id) : null);
  if (ev) { ev.fait = true; ag = true; }
  if (countable(S.historique[0])) { const r = tickProgress(); if (r.levelUp) { syncPlan(); ag = true; } }
  if (requeue()) ag = true;
  autoPlan();
  commit(ag ? "pa" : "p");
  return pr.length;
}

/* ================= Minuteur libre ================= */
let TM = null;
function timerBody() {
  const down = TM.mode === "down";
  const v = down ? (TM.running ? (TM.end - Date.now()) / 1000 : TM.left) : (TM.running ? (Date.now() - TM.start) / 1000 + TM.acc : TM.acc);
  return `<div class="seg"><button data-a="tm-mode" data-v="down" aria-pressed="${down}">Compte à rebours</button><button data-a="tm-mode" data-v="up" aria-pressed="${!down}">Chrono</button></div>
    <div class="timer-big" id="tm-t" role="timer">${mmss(v)}</div>
    ${down ? `<div class="chips" style="justify-content:flex-start">${[30, 45, 60, 90, 120, 180, 300].map(s => `<button class="chip" data-a="tm-set" data-v="${s}" aria-pressed="${TM.total === s}">${s < 60 ? s + " s" : (s % 60 ? Math.floor(s / 60) + ":" + pad(s % 60) : s / 60 + " min")}</button>`).join("")}</div>
    <div class="btn-row"><button class="btn" data-a="tm-add" data-v="-15">−15 s</button><button class="btn" data-a="tm-add" data-v="15">+15 s</button></div>` : ""}
    <button class="btn btn-ghost" data-a="tpl-open" data-id="tabata">${icon("bolt")}Lancer un Tabata guidé</button>`;
}
function openTimer() {
  TM = { mode: "down", total: 60, left: 60, running: false, end: 0, start: 0, acc: 0, done: false };
  Sheet.open({ key: "tm", title: "Minuteur", body: timerBody(), foot: timerFoot(), onClose: () => { TM = null; } });
}
function timerFoot() { return `<button class="btn btn-lg" data-a="tm-reset">Réinitialiser</button><button class="btn btn-primary btn-lg" data-a="tm-go">${TM.running ? icon("pause") + "Pause" : icon("play") + "Démarrer"}</button>`; }
function timerRefresh() { const t = Sheet.top(); if (t && t.key === "tm") { t.el.querySelector(".sheet-body").innerHTML = timerBody(); t.el.querySelector(".sheet-foot").innerHTML = timerFoot(); } }

/* ================= Horloge ================= */
function tick() {
  if (R && !$("#runner").hidden && !R.done) {
    const el = $("#run-el"); if (el) el.textContent = mmss((Date.now() - R.start) / 1000);
    if (R.t && R.t.up) {
      const el = upElapsed(), fg = $("#ring-fg"), tt = $("#ring-t"), lb = $("#ring-l");
      if (fg) fg.style.strokeDashoffset = RING_C * (1 - Math.min(1, el / (R.t.total || 1)));
      if (tt) tt.textContent = mmss(el);
      if (lb) lb.textContent = upLabel(el);
      if (R.t.running && el >= R.t.total && !R.beeped.goal) { R.beeped.goal = 1; beep(880, 0.25, 0.25); }
    } else if (R.t) {
      const left = timeLeft();
      const fg = $("#ring-fg"), tt = $("#ring-t");
      if (fg) fg.style.strokeDashoffset = RING_C * (1 - Math.max(0, left) / (R.t.total || 1));
      if (tt) tt.textContent = mmss(left);
      if (R.t.running) {
        const s = Math.ceil(left);
        if (s >= 1 && s <= 3 && !R.beeped[s]) { R.beeped[s] = 1; beep(660, 0.1, 0.22); }
        if (left <= 0) { beep(990, 0.4, 0.3); runNext(); }
      }
    }
  }
  if (TM && TM.running) {
    const el = $("#tm-t");
    if (TM.mode === "down") {
      const left = (TM.end - Date.now()) / 1000;
      if (el) el.textContent = mmss(left);
      const s = Math.ceil(left);
      if (s >= 1 && s <= 3 && !TM["b" + s]) { TM["b" + s] = 1; beep(660, 0.1, 0.22); }
      if (left <= 0) { beep(990, 0.45, 0.3); TM.running = false; TM.left = TM.total; timerRefresh(); }
    } else if (el) el.textContent = mmss((Date.now() - TM.start) / 1000 + TM.acc);
  }
}
setInterval(tick, 250);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (R && !R.done && !$("#runner").hidden) wakeLock(); tick(); } });

/* ================= Code d'agenda ================= */
/* b64e, b64d : dans engine-user.js */
function exportCode() {
  const from = addDays(todayISO(), -14), to = addDays(todayISO(), 120);
  const ev = S.agenda.filter(e => e.date >= from && e.date <= to).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 200)
    .map(e => [e.date, e.heure || "", String(e.titre).slice(0, 60), e.fait ? 1 : 0, e.ref && e.ref.k === "t" ? e.ref.id : ""]);
  return "FONTE1." + b64e(JSON.stringify({ n: (S.profile.prenom || "").slice(0, 30), e: ev, t: Date.now() }));
}
function importCode(raw) {
  const m = String(raw || "").replace(/\s/g, "").match(/FONTE1\.([A-Za-z0-9_-]+)/);
  if (!m) return "Ce code n’est pas reconnu. Copie-le en entier, depuis FONTE1.";
  let o; try { o = JSON.parse(b64d(m[1])); } catch (e) { return "Ce code est incomplet. Demande-le à nouveau."; }
  if (!o || !Array.isArray(o.e)) return "Ce code ne contient pas d’agenda.";
  const events = cleanEvents(o.e.map(a => ({ id: rid(), date: a[0], heure: a[1], titre: a[2], fait: !!a[3], ref: a[4] && TPL_BY_ID[a[4]] ? { k: "t", id: a[4] } : null })));
  const nom = String(o.n || "").slice(0, 30) || "Agenda importé";
  const ex = S.imports.find(im => im.nom === nom);
  if (ex) { ex.events = events; ex.at = Date.now(); } else S.imports.push({ id: rid(), nom, events, at: Date.now() });
  commit("p");
  return null;
}

/* ===== Copie de sécurité avant une opération qui remplace ou efface les données (D5) =====
   :undo = contenu exact de l’état enregistré du profil actif juste avant l’opération ; :undo-info = { at, reason }. Une seule copie par profil.
   Si la copie ne tient pas dans la mémoire du téléphone, l’opération est refusée (rien n’est modifié). Mécanisme : storeSnapshot (engine-user.js). */
const UNDO_REASONS = { sync: "avant une synchro qui retirait des séances", restore: "avant la restauration", "hist-clear": "avant l’effacement de l’historique", "reset-all": "avant la réinitialisation", undo: "avant le retour en arrière" };
const SNAP_FAIL = "Pas assez de place sur ce téléphone pour garder une copie de sécurité : rien n’a été modifié. Fais d’abord une sauvegarde fichier (Profil › Sauvegarder / transférer).";
function snapshotLocal(reason) {
  if (!saveLocal()) return false;
  return storeSnapshot(reason, Date.now(), JSON.stringify(S));
}
function undoInfo() {
  try { const i = JSON.parse(localStorage.getItem(storeKey("undo-info")) || "null"); if (i && i.at && localStorage.getItem(storeKey("undo")) != null) return i; } catch (e) { }
  return null;
}
/* Revenir à l’état d’avant : l’état actuel devient à son tour la copie de sécurité (on peut revenir encore).
   La copie peut être au format v1 (faite avant la mise à jour 3B) : loadState la fait passer par migrate. */
function undoRestore() {
  let raw = null; try { raw = localStorage.getItem(storeKey("undo")); } catch (e) { }
  const r = readState(raw);
  if (!r.state) return r.error === "plus-recent" ? "Cette copie vient d’une version plus récente de Fonte : mets d’abord l’appli à jour." : "Aucune copie de sécurité utilisable.";
  if (!snapshotLocal("undo")) return SNAP_FAIL;
  /* la copie vient d’être remplacée par l’état actuel : on remet l’ancienne */
  try { localStorage.setItem(storeKey(), raw); } catch (e) { return SNAP_FAIL; }
  const cur = S; S = loadState();
  if (PWA && Acct.user) csRevive(S, cur, Date.now()); /* 3C : l’état d’avant repart en ligne comme le plus récent (séances revenues partout) */
  commit("pa");
  return null;
}
function dataPayload() { return backupPayload(S, Date.now()); }
function dataCode() { return "FONTEDATA1." + b64e(JSON.stringify(dataPayload())); }
/* Restauration d’un fichier ou d’un code (toutes versions : decodeBackup passe par migrate), dans le profil actif */
function restoreData(raw) {
  const d = decodeBackup(raw);
  if (d.error === "illisible") return "Ce fichier ou ce code n’est pas une sauvegarde Fonte complète.";
  if (d.error === "plus-recent") return "Cette sauvegarde vient d’une version plus récente de Fonte : mets d’abord l’appli à jour, puis réessaie. Rien n’a été modifié.";
  if (d.error) return "Ce fichier ou ce code n’est pas une sauvegarde Fonte.";
  if (STORE_BLOCK && STORE_BLOCK.reason === "plus-recent") return "Les données de ce téléphone viennent d’une version plus récente de Fonte : mets d’abord l’appli à jour. Rien n’a été modifié.";
  if (!snapshotLocal("restore")) return SNAP_FAIL;
  applyBackup(S, d.data);
  commit("pa");
  return null;
}
function undoBtn() {
  const i = undoInfo(); if (!i) return "";
  const d = new Date(i.at);
  return `<div style="display:flex;flex-direction:column;gap:6px"><button class="btn" data-a="undo-restore" id="undo-restore">${icon("refresh")}Revenir à l’état d’avant</button><p class="small muted">Copie de sécurité faite ${esc(UNDO_REASONS[i.reason] || "")} du ${esc(fmtDay(toISO(d)))} à ${pad(d.getHours())} h ${pad(d.getMinutes())}.</p></div>`;
}
function canShareFiles() { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(["{}"], "t.json", { type: "application/json" })] })); } catch (e) { return false; } }

/* ================= Actions ================= */
function goTab(t) { UI.tab = t; render(); window.scrollTo(0, 0); try { history.replaceState(null, "", "#" + t); } catch (e) { } }
const A = {
  "tab": el => { Sheet.closeAll(); if (el.dataset.t === UI.tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } goTab(el.dataset.t); },
  "sheet-close": () => Sheet.close(),
  /* exercices */
  "ex-g": el => { UI.exG = el.dataset.g; render(); },
  "ex-mat": el => { UI.exMat = el.dataset.m; render(); },
  "ex-open": el => openEx(el.dataset.id),
  "ex-add": el => {
    const ex = EX_BY_ID[el.dataset.id]; if (!ex) return;
    if (E) { E.se.items.push(defaultItem(ex)); Sheet.closeAll(); renderEditor(); toast(ex.n + " ajouté"); return; }
    const body = `<div class="list">${S.mesSeances.map(m => `<button class="row" data-a="ex-add-to" data-id="${esc(m.id)}" data-ex="${ex.id}"><div class="row-main"><div class="row-title">${esc(m.nom)}</div><div class="row-sub">${plural(m.items.length, "exercice")}</div></div>${icon("plus", "ic chev")}</button>`).join("")}<button class="row" data-a="ex-add-new" data-ex="${ex.id}"><div class="row-main"><div class="row-title" style="color:var(--accent)">Nouvelle séance</div><div class="row-sub">Commencer une séance avec cet exercice</div></div>${icon("plus", "ic chev")}</button></div>`;
    Sheet.open({ key: "addto", title: "Ajouter à…", body });
  },
  "ex-add-to": el => { const m = S.mesSeances.find(x => x.id === el.dataset.id), ex = EX_BY_ID[el.dataset.ex]; if (!m || !ex) return; m.items.push(defaultItem(ex)); commit("p"); Sheet.closeAll(); toast(ex.n + " ajouté à " + m.nom); softRender(); },
  "ex-add-new": el => { const ex = EX_BY_ID[el.dataset.ex]; if (!ex) return; openEditor("edit", { nom: "", mode: "series", items: [defaultItem(ex)] }); },
  /* séances */
  "seg": el => { UI.seg = el.dataset.v; if (UI.seg !== "prog") UI.lastOther = UI.seg; saveUI(); if (UI.tab !== "seances") goTab("seances"); else render(); },
  "tpl-cat": el => { UI.tplCat = el.dataset.c; render(); },
  "tpl-open": el => openTpl(el.dataset.id, el.dataset.o, el.dataset.j),
  "prog-skip": () => { UI.progSkip = (UI.progSkip || 0) + 1; render(); },
  "tpl-start": el => { const t = TPL_BY_ID[el.dataset.id]; if (t) openEditor("prep", applySuggestions(prescribe(t, profFor(S.profile, el.dataset.o))), Object.assign({ tplId: t.id }, progOpts(el.dataset.j))); },
  "tpl-copy": el => { const t = TPL_BY_ID[el.dataset.id]; if (!t) return; const se = prescribe(t, S.profile); delete se.notes; se.nom = t.n; openEditor("edit", se); },
  "tpl-plan": el => openAddEvent({ ref: Object.assign({ k: "t", id: el.dataset.id }, OBJECTIFS[el.dataset.o] ? { o: el.dataset.o } : {}, el.dataset.j != null && el.dataset.j !== "" ? { j: +el.dataset.j } : {}) }),
  "my-new": () => openEditor("edit", { nom: "", mode: "series", items: [] }),
  "my-open": el => openMes(el.dataset.id),
  "my-edit": el => { const m = S.mesSeances.find(x => x.id === el.dataset.id); if (m) openEditor("edit", m, { srcId: m.id }); },
  "my-start": el => { const m = S.mesSeances.find(x => x.id === el.dataset.id); if (m) openEditor("prep", applySuggestions(clone(m)), { srcId: m.id }); },
  "my-plan": el => openAddEvent({ ref: { k: "p", id: el.dataset.id } }),
  /* éditeur */
  "ed-close": () => closeEditor(),
  "ed-mode": el => {
    const v = el.dataset.v; if (E.se.mode === v) return;
    E.se.mode = v;
    if (v === "circuit") { E.se.tours = E.se.tours || 3; E.se.roundRest = E.se.roundRest || 60; E.se.items.forEach(it => { it.repos = Math.min(it.repos || 20, 30); }); }
    else E.se.items.forEach(it => { it.series = it.series > 1 ? it.series : 3; it.repos = Math.max(it.repos || 60, 45); });
    renderEditor();
  },
  "ed-step": el => { const i = +el.dataset.i, f = el.dataset.f, d = num(el.dataset.d); const cur = i < 0 ? (E.se[f] || 0) : (E.se.items[i][f] || 0); edSet(i, f, cur + d); },
  "ed-move": el => { const i = +el.dataset.i, d = +el.dataset.d, a = E.se.items; if (!a[i + d]) return; const x = a[i]; a[i] = a[i + d]; a[i + d] = x; renderEditor(); },
  "ed-del": el => { E.se.items.splice(+el.dataset.i, 1); renderEditor(); },
  "ed-etir": () => { E.se.etir = !etirOn(E.se); renderEditor(); },
  "ed-echauf": () => { E.se.echauf = !echOn(E.se); renderEditor(); },
  "ed-ss": el => { const it = E.se.items[+el.dataset.i]; if (!it) return; it.ss = it.ss ? 0 : 1; renderEditor(); },
  "ed-echec": el => { const it = E.se.items[+el.dataset.i]; if (!it) return; it.echec = it.echec ? 0 : 1; renderEditor(); },
  "anim-replay": el => ANIM.replay(el),
  "ed-add": () => openPicker(),
  "ed-save": () => {
    const se = E.se;
    if (!se.items.length) { toast("Ajoute au moins un exercice."); return; }
    se.nom = (se.nom || "").trim() || "Ma séance";
    se.kind = se.kind || (se.mode === "circuit" ? "hiit" : "muscu");
    const data = { id: E.srcId || rid(), nom: se.nom, mode: se.mode, kind: se.kind, etir: etirOn(se), echauf: echOn(se), tours: se.tours, roundRest: se.roundRest, items: clone(se.items), upd: Date.now() };
    const i = S.mesSeances.findIndex(x => x.id === data.id);
    if (i >= 0) S.mesSeances[i] = data; else S.mesSeances.unshift(data);
    commit("p");
    if (E.mode === "prep") { E.srcId = data.id; toast("Enregistrée dans Mes séances"); return; }
    closeEditor(); UI.seg = "mes"; saveUI(); goTab("seances"); toast("Séance enregistrée");
  },
  "ed-delete": el => { if (!arm(el)) return; S.mesSeances = S.mesSeances.filter(x => x.id !== E.srcId); commit("p"); closeEditor(); render(); toast("Séance supprimée"); },
  "ed-go": () => { if (!E.se.items.length) { toast("Ajoute au moins un exercice."); return; } E.se.nom = (E.se.nom || "").trim() || "Séance"; startRun(E.se, { tplId: E.tplId || null, srcId: E.srcId || null, eventId: E.eventId || null, pj: E.pj != null ? E.pj : null, pk: E.pk || null }); },
  /* sélecteur */
  "pk-g": el => { PK.g = el.dataset.g; $("#pk-chips").innerHTML = pkChips(); $("#pk-list").innerHTML = pkList(); },
  "pk-t": el => { const id = el.dataset.id, k = PK.sel.indexOf(id); if (k >= 0) PK.sel.splice(k, 1); else PK.sel.push(id); const on = k < 0; el.setAttribute("aria-pressed", on); const r = el.querySelector(".radio"); if (r) r.setAttribute("aria-checked", on); pkFoot(); },
  "pk-ok": () => { if (!PK || !PK.sel.length) { Sheet.close(); return; } const n = PK.sel.length; PK.sel.forEach(id => E && E.se.items.push(defaultItem(EX_BY_ID[id]))); Sheet.close(); if (E) renderEditor(); toast(plural(n, "exercice") + " " + (n > 1 ? "ajoutés" : "ajouté")); },
  /* lecteur */
  "run-next": () => runNext(),
  "run-toggle": () => {
    unlockAudio(); const t = R.t; if (!t) return;
    if (t.up) { if (t.running) { t.acc = upElapsed(); t.running = false; t.start = null; } else { t.start = Date.now(); t.running = true; } saveRun(); renderRunner(); return; }
    if (t.running) { t.left = Math.max(0, (t.end - Date.now()) / 1000); t.running = false; t.end = null; }
    else { t.end = Date.now() + t.left * 1000; t.running = true; }
    saveRun(); renderRunner();
  },
  "run-time": el => { if (!R.t || R.t.up) return; const d = +el.dataset.d; R.t.end = Math.max(Date.now() + 1000, R.t.end + d * 1000); R.t.total = Math.max(R.t.total + d, 1); R.beeped = {}; saveRun(); tick(); },
  "run-adj": el => {
    const f = el.dataset.f, d = num(el.dataset.d);
    R.cur[f] = Math.max(0, Math.round((R.cur[f] + d) * 100) / 100);
    if (f === "r") $("#run-r").textContent = R.cur.r;
    else { $("#run-kg").innerHTML = fmtNum(R.cur.kg) + "<small> kg</small>"; const w = $("#plates-w"); if (w) w.innerHTML = platesHTML(R.cur.kg); }
    saveRun();
  },
  "run-prev": () => {
    let j = R.idx - 1; while (j > 0 && R.steps[j].k !== "work") j--;
    if (j < 0) return;
    R.log = R.log.map(l => l.filter(x => x.s < j)); R.idx = j; enterStep();
  },
  /* Machine prise : l'exercice passe après les autres (en fin de tour pour un circuit) et reste dans la séance */
  "run-later": () => {
    const st = R.steps[R.idx]; if (!st || st.k !== "work" || st.cool || laterLeft(st.i)) return;
    const rest = R.steps.slice(R.idx).filter(s => s.k === "work"), e = EX_BY_ID[R.se.items[st.i].id];
    let order;
    if (R.se.mode === "circuit") {
      const round = rest.filter(s => !s.cool && s.set === st.set);
      order = round.filter(s => s !== st).concat([Object.assign({}, st, { later: true })], rest.filter(s => round.indexOf(s) < 0));
    } else {
      const mine = rest.filter(s => s.i === st.i).map(s => Object.assign({}, s, { later: true }));
      order = rest.filter(s => s.i !== st.i && !s.cool).concat(mine, rest.filter(s => s.cool));
    }
    R.steps = R.steps.slice(0, R.idx).concat(withRests(R.se, order));
    enterStep(); toast(e.n + " : on y revient " + (R.se.mode === "circuit" ? "en fin de tour" : "à la fin"));
  },
  /* Ne pas faire l'exercice : retiré du reste de la séance */
  "run-refuse": el => {
    const st = R.steps[R.idx]; if (!st || st.k !== "work") return;
    if (!arm(el, "Confirmer ?")) return;
    const order = R.steps.slice(R.idx).filter(s => s.k === "work" && s.i !== st.i);
    R.skipped = R.skipped || {}; R.skipped[st.i] = 1;
    R.steps = R.steps.slice(0, R.idx).concat(withRests(R.se, order));
    enterStep();
  },
  "run-quit": () => {
    const any = R.log.some(l => l.length);
    Sheet.open({ key: "quit", title: "Arrêter la séance ?", body: `<p class="muted">${any ? "Tu peux terminer maintenant et enregistrer ce que tu as déjà fait." : "Rien n’a encore été enregistré pour cette séance."}</p>`, foot: `${any ? `<button class="btn btn-primary" data-a="run-end">Terminer</button>` : ""}<button class="btn btn-danger" data-a="run-discard">Abandonner</button><button class="btn" data-a="sheet-close">Continuer</button>` });
  },
  "run-skipwarm": () => {
    const rest = R.steps.slice(R.idx).filter(s => s.k === "work" && !s.warm);
    if (!rest.length) return;
    R.steps = R.steps.slice(0, R.idx).concat(withRests(R.se, rest)); ANIM_IDX = -1; enterStep();
  },
  "run-end": () => { Sheet.closeAll(); finishRun(); },
  "run-feel": el => { R.feel = +el.dataset.v; renderRunner(); },
  "run-save": () => { const n = saveRunHistory(); closeRunner(); toast(n ? "Séance enregistrée · " + (n > 1 ? n + " nouveaux records" : "nouveau record") : "Séance enregistrée"); if (S.profile.bilanNew != null) setTimeout(() => openBilan(S.profile.bilanNew), 400); },
  /* D2 : supprimer une séance contenant au moins une série demande confirmation, puis « Annuler » pendant 10 s */
  "run-discard": () => {
    const n = runSets(R);
    if (!n) { Sheet.closeAll(); closeRunner(); return; }
    Sheet.open({ key: "discard", title: "Supprimer cette séance ?", body: `<p class="muted">${plural(n, "série")} ${n > 1 ? "seront perdues" : "sera perdue"}. Tu pourras encore annuler pendant 10 secondes.</p>`, foot: `<button class="btn" data-a="sheet-close">Revenir</button><button class="btn btn-danger" data-a="run-discard-ok">Supprimer</button>` });
  },
  "run-discard-ok": () => { const r = R; Sheet.closeAll(); if (r) trashRun(r); closeRunner(); },
  "run-undo-discard": () => {
    const t = readTrash(); hideUndo();
    if (!t) { toast("Trop tard : la séance a été supprimée."); return; }
    if (R) { toast("Termine d’abord la séance en cours."); return; }
    try { localStorage.setItem(storeKey("run"), JSON.stringify(t.run)); } catch (e) { toast("Impossible de récupérer la séance."); return; }
    clearTrash(); toast("Séance récupérée");
    A["run-resume"]();
  },
  /* D6 : séance de plus de 12 h, enregistrée à sa date ou supprimée (avec confirmation et « Annuler ») */
  "run-stale-save": () => {
    const r = loadRun(); if (!r || !r.stale) { render(); return; }
    if (r.se.items.some(it => !EX_BY_ID[it.id])) r.se.items.forEach((it, i) => { if (!EX_BY_ID[it.id]) r.log[i] = []; });
    delete r.stale; R = r;
    if (!R.endAt) R.endAt = R.start + Math.min(Date.now() - R.start, estDuree(R.se) * 1000); /* fin inconnue : durée prévue de la séance */
    const n = saveRunHistory(R.start), d = R.start;
    closeRunner(); toast("Séance du " + fmtDay(toISO(new Date(d))) + " enregistrée" + (n ? " · " + (n > 1 ? n + " records" : "1 record") : ""));
  },
  "run-stale-del": () => {
    const r = loadRun(); if (!r) { render(); return; }
    const n = runSets(r);
    Sheet.open({ key: "discard", title: "Supprimer cette séance ?", body: `<p class="muted">${n ? plural(n, "série") + " " + (n > 1 ? "seront perdues" : "sera perdue") + ". " : ""}Tu pourras encore annuler pendant 10 secondes.</p>`, foot: `<button class="btn" data-a="sheet-close">Revenir</button><button class="btn btn-danger" data-a="run-stale-del-ok">Supprimer</button>` });
  },
  "run-stale-del-ok": () => { const r = loadRun(); Sheet.closeAll(); if (r) { trashRun(r); clearRun(); } render(); },
  "run-resume": () => { const r = loadRun(); if (!r || r.stale) { render(); return; } delete r.stale; if (r.se.items.some(it => !EX_BY_ID[it.id])) { clearRun(); render(); toast("Cette séance contenait un exercice qui n’existe plus."); return; } R = r; unlockAudio(); wakeLock(); $("#runner").hidden = false; lockPage(); renderRunner(); },
  /* accueil */
  "cal-go": el => { UI.calSel = el.dataset.d; UI.calMonth = el.dataset.d.slice(0, 7); goTab("agenda"); },
  "timer-open": () => { unlockAudio(); openTimer(); },
  "tm-mode": el => { TM.mode = el.dataset.v; TM.running = false; TM.acc = 0; TM.left = TM.total; timerRefresh(); },
  "tm-set": el => { TM.total = +el.dataset.v; TM.left = TM.total; TM.running = false; timerRefresh(); },
  "tm-add": el => { const d = +el.dataset.v; if (TM.running) TM.end = Math.max(Date.now() + 1000, TM.end + d * 1000); else { TM.left = Math.max(5, TM.left + d); TM.total = TM.left; } timerRefresh(); },
  "tm-go": () => {
    unlockAudio();
    if (TM.mode === "down") { if (TM.running) { TM.left = Math.max(0, (TM.end - Date.now()) / 1000); TM.running = false; } else { TM.end = Date.now() + TM.left * 1000; TM.running = true; TM.b1 = TM.b2 = TM.b3 = 0; } }
    else { if (TM.running) { TM.acc += (Date.now() - TM.start) / 1000; TM.running = false; } else { TM.start = Date.now(); TM.running = true; } }
    timerRefresh();
  },
  "tm-reset": () => { TM.running = false; TM.left = TM.total; TM.acc = 0; timerRefresh(); },
  "hist-open": el => {
    const x = S.historique.find(h => h.id === el.dataset.id); if (!x) return;
    const feel = ["", "Facile", "Correct", "Dur", "Très dur"][x.ressenti || 0];
    const body = `<div class="eyebrow">${cap(fmtDay(x.date))}</div><div class="sum"><div class="stat"><b>${fmtDur(x.duree || 60)}</b><span>durée</span></div><div class="stat"><b>${x.sets || 0}</b><span>séries</span></div><div class="stat"><b>${fmtNum(x.volume || 0)}<small style="font-size:17px"> kg</small></b><span>volume</span></div><div class="stat"><b>≈ ${x.kcal || 0}</b><span>kcal</span></div></div>${feel ? `<div class="status"><i></i><span>Ressenti : ${feel}</span></div>` : ""}
      ${x.c ? `<p class="small muted">Séance ancienne : seules tes meilleures séries sont conservées.</p>` : ""}
      <div class="list">${(x.log || []).map(l => { const e = EX_BY_ID[l.id]; if (!e) return ""; const rec = (x.pr || []).find(r => r.id === l.id); return `<button class="row" data-a="ex-open" data-id="${e.id}"><div class="row-main"><div class="row-title">${esc(e.n)}</div><div class="row-sub">${l.sets.map(s => s.d ? fmtSec(s.d) : s.r + (s.kg ? " × " + fmtNum(s.kg) + " kg" : "")).join(" · ")}</div>${rec ? `<div class="tags" style="margin-top:4px"><span class="tag tag-rec">${icon("trophy")}${esc(recText(rec.k, rec.v))}</span></div>` : ""}</div></button>`; }).join("")}</div>
      <button class="btn btn-danger btn-block" data-a="hist-del" data-id="${esc(x.id)}">${icon("trash")}Supprimer de l’historique</button>`;
    Sheet.open({ key: "hist", title: x.nom, body, foot: `<button class="btn btn-primary btn-lg" data-a="hist-redo" data-id="${esc(x.id)}">${icon("refresh")}Refaire cette séance</button>` });
  },
  "hist-redo": el => {
    const x = S.historique.find(h => h.id === el.dataset.id); if (!x) return;
    const items = (x.log || []).filter(l => EX_BY_ID[l.id] && !l.cool && !l.warm).map(l => { const r = l.sets.filter(s => s.r != null), d = l.sets.find(s => s.d); return { id: l.id, series: l.n || l.sets.length, reps: r.length ? Math.max.apply(null, r.map(s => s.r)) : 0, duree: d ? d.d : 0, charge: r.length ? Math.max.apply(null, r.map(s => s.kg || 0)) : 0, repos: 90 }; });
    openEditor("prep", applySuggestions({ nom: x.nom, mode: "series", kind: x.kind || "muscu", items }), {});
  },
  "hist-del": el => { if (!arm(el)) return; const id = el.dataset.id; const gone = S.historique.find(h => h.id === id); S.historique = S.historique.filter(h => h.id !== id); S.histDel[id] = Date.now(); S.histDel = pruneDel(S.histDel); if (gone) { csTrashAdd(S, gone, S.histDel[id]); csTrashPrune(S, Date.now()); afterHistDelete(gone); } commit("p"); Sheet.closeAll(); render(); toast("Supprimée de l’historique"); },
  "hist-all": () => Sheet.open({ key: "hall", title: "Historique", tall: true, body: `<div class="list">${S.historique.map(histRow).join("")}</div>` }),
  "prog-plan": () => { UI.seg = "prog"; saveUI(); goTab("seances"); },
  "plan-day": el => {
    const d = togglePlanDay(S.profile, +el.dataset.d);
    if (!d) { toast(planDays(S.profile).length <= 1 ? "Garde au moins un jour d’entraînement" : "6 séances au plus : garde au moins un jour de repos"); return; }
    const n0 = planDays(S.profile).length;
    S.profile.planJours = d; S.profile.jours = d.length; UI.progSkip = 0;
    if (S.profile.autoPlan) replan(); else commit("p");
    render();
    toast(d.length !== n0 ? "Programme adapté à " + plural(d.length, "séance") + " par semaine" + (S.profile.autoPlan ? ", agenda mis à jour" : "") : (S.profile.autoPlan ? "Agenda mis à jour" : "Jours modifiés"));
  },
  "pl-auto": () => {
    if (S.profile.autoPlan) { S.profile.autoPlan = false; commit("p"); render(); toast("Programmation automatique désactivée : tes séances déjà prévues restent dans l’agenda"); }
    else { const n = replan(); render(); toast(plural(n, "séance") + " programmée" + (n > 1 ? "s" : "")); }
  },
  "pp-save": () => {
    const h = ($("#pl-heure") || {}).value; if (h) S.profile.planHeure = h;
    const n = replan(); Sheet.closeAll(); render();
    toast(n ? plural(n, "séance") + " programmée" + (n > 1 ? "s" : "") + " sur un mois" : "Ton mois est déjà programmé");
    openPlanMonth();
  },
  "plan-month": () => openPlanMonth(),
  "bilan-open": el => openBilan(el.dataset.i != null ? +el.dataset.i : null),
  "mus-all": () => openMuscles(),
  "mus-open": el => openMuscle(el.dataset.m),
  "mus-days": el => { UI.musDays = +el.dataset.v; const sh = Sheet.stack.find(x => x.key === "mus"); if (sh) { const b = sh.el.querySelector(".sheet-body"); if (b) b.innerHTML = musclesSheetBody(); } },
  "mus-go": el => { const ms = String(el.dataset.m || "").split(",").filter(m => MUSCLES[m]); if (!ms.length) return; const se = musSession(ms); if (!se.items.length) { toast("Pas d’exercice adapté pour l’instant."); return; } openEditor("prep", se, {}); },
  "goal-switch": el => { const k = el.dataset.v, p = S.profile; p.goalAck = p.poidsCible; p.objectifs = [k].concat(p.objectifs.filter(x => x !== k && x !== p.objectif)); p.objectif = k; commit("p"); syncPlan(); render(); toast("Nouvel objectif : " + OBJECTIFS[k].n); },
  "goal-keep": () => { S.profile.goalAck = S.profile.poidsCible; commit("p"); render(); },
  "cardio-reset": () => { S.profile.cardioPlus = 0; S.profile.cardioAt = todayISO(); commit("p"); render(); toast("Cardio revenu à la normale"); },
  "gloss": el => openGloss(el && el.dataset ? el.dataset.k : ""),
  /* report d’une séance */
  "ev-move": el => {
    const e = S.agenda.find(x => x.id === el.dataset.id); if (!e) return;
    const to = el.dataset.to === "pick" ? (($("#mv-date") || {}).value || "") : moveTarget(e);
    if (!to) return;
    e.date = to; requeue(); commit("a"); Sheet.closeAll(); render();
    toast("« " + e.titre + " » reportée " + dayName(to));
  },
  "ev-move-pick": el => {
    const e = S.agenda.find(x => x.id === el.dataset.id); if (!e) return;
    const to = moveTarget(e);
    Sheet.open({ key: "mv", title: "Reporter la séance", body: `<p class="muted">« ${esc(e.titre)} », prévue ${fmtDay(e.date)}.</p>
      <button class="btn btn-primary btn-lg btn-block" data-a="ev-move" data-id="${esc(e.id)}">${icon("cal")}Au prochain jour libre : ${esc(dayName(to))}</button>
      <div class="field"><label for="mv-date">Ou choisis le jour</label><input class="inp" type="date" id="mv-date" min="${todayISO()}" value="${to}"></div>
      <button class="btn btn-block" data-a="ev-move" data-to="pick" data-id="${esc(e.id)}">Déplacer à cette date</button>
      <button class="btn btn-ghost btn-block" data-a="ev-skip" data-id="${esc(e.id)}">Laisser tomber cette séance</button>` });
  },
  "ev-skip": el => { S.agenda = S.agenda.filter(x => x.id !== el.dataset.id); requeue(); commit("a"); Sheet.closeAll(); render(); toast("Séance retirée de l’agenda"); },
  /* premier lancement guidé */
  "onb-open": () => openOnb(),
  "onb-skip": () => { S.profile.onb = 1; commit("p"); closeOnb(); render(); },
  /* sauvegarde en ligne (3C) */
  "onb-account": () => { closeOnb(); A["ac-open"]({ dataset: { v: "login" } }); },
  "ac-open": el => {
    const login = el.dataset.v === "login";
    Sheet.open({ key: "ac", title: login ? "Me connecter" : "Créer mon compte", body: acctForm(login ? "login" : "new"), foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="ac-go" data-v="${login ? "login" : "new"}" id="ac-go">${login ? "Me connecter" : "Créer mon compte"}</button>`,
      onClose: () => { if (onbNeeded() && !Acct.user && !loadRun()) setTimeout(() => { if (onbNeeded() && $("#onb").hidden && !Sheet.top()) openOnb(); }, 50); } });
  },
  "ac-go": async el => {
    const login = el.dataset.v === "login", err = $("#ac-err"), show = m => { if (err) { err.textContent = m; err.hidden = !m; } };
    const email = ($("#ac-email").value || "").trim(), pw = $("#ac-pw").value || "", got = acctCfgFrom($("#ac-code") ? $("#ac-code").value : "");
    if (!got) { show("Colle le code d’invitation (il commence par FONTESYNC1.) ou le bloc firebaseConfig."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show("Adresse e-mail invalide."); return; }
    if (pw.length < 6) { show("Mot de passe trop court : 6 caractères au moins."); return; }
    if (navigator.onLine === false) { show("Pas de réseau : connecte-toi à internet pour cette étape."); return; }
    show(""); el.disabled = true; el.textContent = login ? "Connexion…" : "Création…";
    try {
      if (got.space && !Cloud.cfg) { Cloud.cfg = got.cfg; Cloud.space = got.space; Cloud.save(); } /* le code d’invitation rejoint aussi l’agenda partagé */
      if (login) await Acct.login(email, pw, got.cfg); else await Acct.create(email, pw, got.cfg);
      Sheet.closeAll(); render(); toast(login ? "Connecté : tes données en ligne arrivent" : "Compte créé : ce profil est sauvegardé en ligne");
    } catch (e) { show(acctMsg(String((e && e.code) || ""))); if (el.isConnected) { el.disabled = false; el.textContent = login ? "Me connecter" : "Créer mon compte"; } }
  },
  "ac-forgot": async () => {
    const err = $("#ac-err"), email = ($("#ac-email").value || "").trim(), got = acctCfgFrom($("#ac-code") ? $("#ac-code").value : "");
    const show = m => { if (err) { err.textContent = m; err.hidden = !m; } };
    if (!got) { show("Colle d’abord le code d’invitation ou le bloc firebaseConfig."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show("Écris ton adresse e-mail, puis touche « Mot de passe oublié ? »."); return; }
    try { await Acct.reset(email, got.cfg); show(""); toast("E-mail envoyé à " + email + " : suis le lien pour choisir un nouveau mot de passe"); }
    catch (e) { show(acctMsg(String((e && e.code) || ""))); }
  },
  "ac-sync": () => { Acct.err = ""; Acct.sync(); },
  "ac-logout": el => { if (!arm(el, "Confirmer : me déconnecter")) return; Acct.logout().then(() => { render(); toast("Déconnecté : tes données restent sur ce téléphone"); }); },
  "ac-rules": () => Sheet.open({ key: "acr", title: "Règles Firestore", body: `<p class="muted">À faire une fois, par la personne qui gère le projet Firebase : console Firebase › Firestore Database › onglet <b>Règles</b> › remplacer tout par ces règles › <b>Publier</b>. Elles protègent la sauvegarde en ligne : chacun ne peut lire et écrire que ses propres données.</p><div class="field"><textarea class="code-box" id="rules-box" readonly style="min-height:220px">${esc(RULES)}</textarea><button class="btn" data-a="copy-rules">${icon("copy")}Copier les règles</button></div>` }),
  "trash-open": () => Sheet.open({ key: "trash", title: "Corbeille", body: trashBody() }),
  "trash-restore": el => {
    const h = csTrashRestore(S, el.dataset.id, Date.now()); if (!h) { toast("Séance introuvable"); return; }
    afterHistRestore(h); commit("p"); const b = Sheet.body(); if (b) b.innerHTML = trashBody(); render(); toast("Séance remise dans l’historique");
  },
  "onb-back": () => { onbRead(); ONB.err = ""; ONB.i = Math.max(0, ONB.i - 1); renderOnb(); },
  "onb-obj": el => { onbRead(); ONB.d.objectif = el.dataset.v; renderOnb(); },
  "onb-sexe": el => { onbRead(); ONB.d.sexe = el.dataset.v; ONB.err = ""; renderOnb(); },
  "onb-niv": el => { onbRead(); ONB.d.niveau = el.dataset.v; renderOnb(); },
  "onb-plan": () => { ONB.d.plan = !ONB.d.plan; renderOnb(); },
  "onb-day": el => {
    onbRead(); const d = ONB.d.days, k = +el.dataset.d, i = d.indexOf(k);
    if (i >= 0) { if (d.length <= 1) { toast("Garde au moins un jour"); return; } d.splice(i, 1); }
    else { if (d.length >= 6) { toast("6 jours au plus : garde un jour de repos"); return; } d.push(k); d.sort((a, b) => a - b); }
    renderOnb();
  },
  "onb-next": () => {
    onbRead(); const d = ONB.d; ONB.err = "";
    if (ONB.i === 2) {
      if (!d.sexe) ONB.err = "Indique si tu es un homme ou une femme : les poids et les pauses en dépendent.";
      else if (!(d.poids >= 30 && d.poids <= 250)) ONB.err = "Indique ton poids en kg : il sert à calculer les poids à soulever.";
      else if (d.age && !(d.age >= 12 && d.age <= 100)) ONB.err = "Cet âge ne semble pas correct.";
      else if (d.taille && !(d.taille >= 120 && d.taille <= 230)) ONB.err = "Indique ta taille en centimètres (par exemple 175).";
      if (ONB.err) { renderOnb(); return; }
    }
    if (ONB.i >= ONB_N - 1) { onbFinish(); return; }
    ONB.i++; renderOnb();
  },
  "pf-zone": el => {
    const z = el.dataset.v, a = zoneList(S.profile), i = a.indexOf(z);
    if (i >= 0) a.splice(i, 1); else { if (a.length >= 2) { toast("2 zones au plus : retire-en une d’abord"); return; } a.push(z); }
    S.profile.zones = a; commit("p"); render();
    toast(a.length ? "Zone prioritaire : " + a.map(x => ZONES[x][0].toLowerCase()).join(" et ") : "Plus de zone prioritaire");
  },
  "onb-zone": el => {
    onbRead(); const z = el.dataset.v, a = ONB.d.zones, i = a.indexOf(z);
    if (i >= 0) a.splice(i, 1); else { if (a.length >= 2) { toast("2 zones au plus"); return; } a.push(z); }
    renderOnb();
  },
  "pf-simple": () => { S.profile.simple = !simple(); commit("p"); render(); },
  /* agenda */
  "cal-prev": () => { const [y, m] = UI.calMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); UI.calMonth = d.getFullYear() + "-" + pad(d.getMonth() + 1); render(); },
  "cal-next": () => { const [y, m] = UI.calMonth.split("-").map(Number); const d = new Date(y, m, 1); UI.calMonth = d.getFullYear() + "-" + pad(d.getMonth() + 1); render(); },
  "cal-day": el => { UI.calSel = el.dataset.d; if (el.dataset.d.slice(0, 7) !== UI.calMonth) UI.calMonth = el.dataset.d.slice(0, 7); render(); },
  "person-toggle": el => { const k = el.dataset.k; if (S.hidden[k]) delete S.hidden[k]; else S.hidden[k] = 1; saveLocal(); render(); },
  "ev-add": el => openAddEvent({ date: el.dataset.d }),
  "ae-save": el => {
    const sel = $("#ae-ref").value, date = $("#ae-date").value, heure = $("#ae-heure").value || "", note = ($("#ae-note").value || "").trim().slice(0, 120);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Choisis une date."); return; }
    let ref = null, titre = "";
    if (sel === "libre") { titre = ($("#ae-titre").value || "").trim() || "Activité"; }
    else { const [k, id] = [sel.slice(0, 1), sel.slice(2)]; ref = { k, id }; const old = el.dataset.id ? (S.agenda.find(e => e.id === el.dataset.id) || {}).ref : null; const keep = old || (!el.dataset.id ? AE_REF : null); if (keep && keep.k === k && keep.id === id) { if (keep.o) ref.o = keep.o; if (keep.j != null) ref.j = keep.j; } const ri = refInfo(ref); titre = ri ? ri.nom : "Séance"; }
    if (el.dataset.id) { const ev = S.agenda.find(e => e.id === el.dataset.id); if (ev) Object.assign(ev, { date, heure, note, ref, titre }); }
    else { const rep = +(($("#ae-rep") || {}).value || 0); for (let k = 0; k < Math.max(1, rep); k++) S.agenda.push({ id: rid(), date: addDays(date, 7 * k), heure, titre, note, fait: false, ref }); }
    commit("a"); Sheet.closeAll(); UI.calSel = date; UI.calMonth = date.slice(0, 7);
    if (UI.tab === "agenda") render(); else goTab("agenda");
    toast("Ajouté à l’agenda");
  },
  "ev-open": el => openEvent(el.dataset.id),
  "ev-view": el => openPartnerEvent(el.dataset.k, el.dataset.id),
  "ev-see": el => { const e = S.agenda.find(x => x.id === el.dataset.id); if (!e || !e.ref) return; if (e.ref.k === "t") openTpl(e.ref.id); else A["my-edit"]({ dataset: { id: e.ref.id } }); },
  "ev-start": el => { const e = S.agenda.find(x => x.id === el.dataset.id); const ri = e && refInfo(e.ref); if (!ri) { toast("Cette séance n’existe plus."); return; } openEditor("prep", ri.se(), Object.assign({ eventId: e.id }, ri.opts)); },
  "ev-done": el => { const e = S.agenda.find(x => x.id === el.dataset.id); if (!e) return; e.fait = !e.fait; commit("a"); Sheet.closeAll(); render(); },
  "ev-edit": el => openAddEvent({ editId: el.dataset.id }),
  "ev-del": el => { if (!arm(el)) return; S.agenda = S.agenda.filter(x => x.id !== el.dataset.id); commit("a"); Sheet.closeAll(); render(); toast("Supprimée de l’agenda"); },
  "ev-join": el => {
    const p = people().find(x => x.key === el.dataset.k); const e = p && p.events.find(x => x.id === el.dataset.id); if (!e) return;
    const ref = e.ref && e.ref.k === "t" && TPL_BY_ID[e.ref.id] ? { k: "t", id: e.ref.id } : null;
    S.agenda.push({ id: rid(), date: e.date, heure: e.heure, titre: e.titre, note: "Avec " + p.name, fait: false, ref });
    commit("a"); Sheet.closeAll(); render(); toast("Ajouté à ton agenda");
  },
  "share-export": () => {
    const code = exportCode();
    Sheet.open({ key: "exp", title: "Mon code d’agenda", body: `<p class="muted">Envoie ce code à ta copine (SMS, WhatsApp…). Elle l’ouvre dans Fonte, onglet Agenda, « Importer un code ». Il contient tes séances des deux dernières semaines et des quatre prochains mois. Renvoie-le quand ton planning change.</p><textarea class="code-box" id="exp-code" readonly aria-label="Code d’agenda">${esc(code)}</textarea>`, foot: `<button class="btn btn-primary btn-lg" data-a="copy-code">${icon("copy")}Copier le code</button>` });
  },
  "copy-code": () => {
    const ta = $("#exp-code"); if (!ta) return;
    const fallback = () => { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); toast("Code sélectionné : utilise Copier"); };
    const bk = Sheet.top() && Sheet.top().key === "dx";
    try { navigator.clipboard.writeText(ta.value).then(() => { if (bk) markBackup(); toast("Code copié"); }, fallback); } catch (e) { fallback(); }
  },
  "share-import": () => Sheet.open({ key: "imp", title: "Importer un agenda", body: `<p class="muted">Colle ici le code reçu (il commence par FONTE1.).</p><textarea class="code-box" id="imp-code" aria-label="Code à importer" placeholder="FONTE1.…"></textarea><p class="small" id="imp-err" style="color:var(--red)" hidden></p>`, foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="imp-ok">Importer</button>` }),
  "imp-ok": () => { const err = importCode($("#imp-code").value); if (err) { const p = $("#imp-err"); p.textContent = err; p.hidden = false; return; } Sheet.closeAll(); render(); toast("Agenda importé"); },
  "cl-setup": () => Sheet.open({ key: "cls", title: "Synchro automatique", tall: true, body: setupBody(), foot: `<button class="btn" data-a="sheet-close">Plus tard</button><button class="btn btn-primary" data-a="cl-activate">Activer</button>` }),
  "copy-rules": () => { const ta = $("#rules-box"); try { navigator.clipboard.writeText(RULES).then(() => toast("Règles copiées"), () => { ta.focus(); ta.select(); }); } catch (e) { ta.focus(); ta.select(); } },
  "cl-activate": () => {
    const cfg = parseFbConfig(($("#fb-cfg") || {}).value);
    if (!cfg) { const p = $("#fb-err"); p.textContent = "Je ne trouve pas apiKey, projectId et appId : copie tout le bloc firebaseConfig."; p.hidden = false; return; }
    profileSetOwner(STORE.pid); Cloud.activate(cfg, randomId(20)); Sheet.closeAll(); render(); toast("Synchro activée : envoie l’invitation à ta copine");
  },
  "cl-join": () => Sheet.open({ key: "clj", title: "Rejoindre un agenda", body: `<p class="muted">Colle le message d’invitation reçu (il contient FONTESYNC1.). Ensuite, vos agendas se mettront à jour tout seuls.</p><textarea class="code-box" id="cl-code" aria-label="Invitation"></textarea><p class="small" id="cl-err" style="color:var(--red)" hidden></p>`, foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="cl-join-ok">Rejoindre</button>` }),
  "cl-join-ok": () => {
    const o = parseInvite(($("#cl-code") || {}).value);
    if (!o) { const p = $("#cl-err"); p.textContent = "Cette invitation n’est pas reconnue. Colle le message en entier."; p.hidden = false; return; }
    profileSetOwner(STORE.pid); Cloud.activate(Object.assign({}, o.c, { authDomain: o.c.authDomain || o.c.projectId + ".firebaseapp.com" }), o.s); Sheet.closeAll(); render(); toast("Espace rejoint");
  },
  "cl-invite": () => {
    const code = Cloud.invite();
    const txt = "Rejoins mon agenda Fonte : ouvre Fonte, onglet Agenda, « J’ai une invitation », et colle ce message. Ensuite nos agendas se mettront à jour tout seuls.\n\n" + code;
    Sheet.open({ key: "cli", title: "Inviter", body: `<p class="muted">À envoyer une seule fois. Ta copine installe Fonte avec le même lien, puis colle ce message dans Agenda, « J’ai une invitation ». Garde-le pour vous deux : il donne accès à vos agendas.</p><textarea class="code-box" id="exp-code" readonly aria-label="Invitation">${esc(txt)}</textarea>`, foot: `<button class="btn btn-lg" data-a="copy-code">${icon("copy")}Copier</button>${navigator.share ? `<button class="btn btn-primary btn-lg" data-a="cl-send">${icon("share")}Envoyer</button>` : ""}` });
  },
  "cl-send": () => { const ta = $("#exp-code"); if (ta && navigator.share) navigator.share({ text: ta.value }).catch(() => { }); },
  "cl-retry": () => { Cloud.err = ""; Cloud.start(); },
  "cl-leave": el => { if (!arm(el, "Confirmer")) return; Cloud.leave(); toast("Synchro désactivée"); },
  "prog-open": () => openProgress(),
  "run-rir": el => { const v = +el.dataset.v; R.cur.rir = R.cur.rir === v ? null : v; el.parentNode.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === R.cur.rir)); saveRun(); },
  "run-swap": () => openSwap(),
  "run-swap-to": el => swapTo(el.dataset.id),
  "dl-on": () => { const m = mondayOf(todayISO()); S.deload = Object.assign({}, S.deload, S.deload.mon !== m ? { prev: S.deload.mon } : {}, { mon: m }); delete S.deload.off; commit("p"); render(); toast("Semaine allégée activée"); },
  "dl-off": () => { const prev = S.deload.prev; S.deload = Object.assign({}, S.deload); if (prev) S.deload.mon = prev; else delete S.deload.mon; delete S.deload.prev; S.deload.off = mondayOf(todayISO()); commit("p"); render(); toast("Semaine allégée annulée"); },
  "dl-later": () => { S.deload = Object.assign({}, S.deload, { off: mondayOf(todayISO()) }); commit("p"); render(); },
  "mes-add": () => openMesAdd(),
  "mes-open": () => openMesures(),
  "mes-save": () => {
    const date = ($("#mes-date") || {}).value || todayISO(), poids = num(($("#mes-poids") || {}).value), tour = num(($("#mes-tour") || {}).value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("Choisis une date."); return; }
    if (!(poids > 0) && !(tour > 0)) { toast("Indique ton poids ou ton tour de taille."); return; }
    if ((poids && (poids < 25 || poids > 350)) || (tour && (tour < 40 || tour > 250))) { toast("Valeur étonnante : vérifie la saisie."); return; }
    upsertMesure(date, { poids, tour }); commit("p"); Sheet.close(); if (bodyCheck()) setTimeout(() => toast("Ton poids ne baisse plus depuis 3 semaines : 5 min de cardio en plus dans tes séances cardio"), 600);
    const t = Sheet.top(); if (t && t.key === "mes") t.el.querySelector(".sheet-body").innerHTML = mesSheetBody();
    render(); toast("Mesure enregistrée");
  },
  "mes-del": el => { if (!arm(el, "Supprimer ?")) return; S.mesures = S.mesures.filter(x => x.id !== el.dataset.id); commit("p"); const b = Sheet.body(); if (b) { if (S.mesures.length) b.innerHTML = mesSheetBody(); else Sheet.close(); } render(); },
  "ch-m": el => { if (!CH) return; CH.mode = el.dataset.v; if (CH.ptsBy) CH.sel = Math.min(CH.ptsBy[CH.mode].length, 30) - 1; el.parentNode.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === el)); $("#ch").innerHTML = chartInner(); },
  "ch-pt": el => { if (!CH) return; CH.sel = +el.dataset.i; $("#ch").innerHTML = chartInner(); },
  "bk-later": () => { try { localStorage.setItem(storeKey(LS_BKS), String(Date.now() + BK_SNOOZE_DAYS * 864e5)); } catch (e) { } render(); toast("Rappel dans 7 jours"); },
  "bk-now": () => shareBackup(),
  "csv-export": () => {
    if (!S.historique.length) { toast("Pas encore de séance dans l’historique."); return; }
    openFileSheet({ title: "Exporter l’historique", name: "fonte-historique-" + todayISO() + ".csv", mime: "text/csv", bom: true, make: () => csvExport(S.historique),
      intro: `${plural(S.historique.length, "séance")}, une ligne par série : date, séance, exercice, répétitions, charge, durée et ressenti. S’ouvre dans Numbers, Excel ou Google Sheets.` });
  },
  "ev-ics": el => { const e = S.agenda.find(x => x.id === el.dataset.id); if (e) openIcs([e], "Calendrier du téléphone"); },
  "ics-all": () => { const t = todayISO(), evs = S.agenda.filter(e => e.date >= t && !e.fait).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 200); if (evs.length) openIcs(evs, "Calendrier du téléphone"); },
  "fx-share": () => { if (!FX) return; try { navigator.share({ files: [fxFile()], title: FX.title }).catch(() => { }); } catch (e) { toast("Partage impossible ici : utilise Télécharger."); } },
  "fx-dl": () => {
    if (!FX) return;
    try {
      const f = fxFile(), url = URL.createObjectURL(f), a = document.createElement("a");
      a.href = url; a.download = FX.name; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { toast("Téléchargement impossible ici : copie le contenu."); }
  },
  "fx-copy": () => { if (!FX) return; const t = FX.make(); try { navigator.clipboard.writeText(t).then(() => toast("Contenu copié"), () => toast("Copie impossible ici")); } catch (e) { toast("Copie impossible ici"); } },
  "app-reload": () => { saveRun(); location.reload(); },
  /* profils (U4) */
  "prof-open": () => openProfiles(),
  "prof-pick": el => {
    const id = el.dataset.id; if (id === STORE.pid) { Sheet.closeAll(); return; }
    if (runBusy()) { toast(RUN_BUSY); return; }
    saveLocal();
    if (!profileSwitch(id)) { toast("Impossible de changer de profil : mémoire du téléphone pleine."); return; }
    location.reload();
  },
  "prof-add": () => {
    if (runBusy()) { toast(RUN_BUSY); return; }
    Sheet.closeAll();
    Sheet.open({ key: "profadd", title: "Ajouter un profil", body: `<p class="muted">Un nouveau profil vide est créé sur cet appareil, avec son propre programme, son historique et ses réglages. Le questionnaire de départ s’ouvre aussitôt. Tes données restent dans ton profil, tu peux y revenir à tout moment (Profil › Changer de profil).</p>`, foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="prof-add-ok">Créer le profil</button>` });
  },
  "prof-add-ok": () => {
    if (runBusy()) { toast(RUN_BUSY); return; }
    saveLocal();
    const id = profileAdd(Date.now());
    if (!id || !profileSwitch(id)) { toast("Pas assez de place sur ce téléphone pour un nouveau profil. Fais d’abord une sauvegarde fichier."); return; }
    location.reload();
  },
  "hide-install": () => { UI.hideInstall = true; try { localStorage.setItem("fonte:noinstall", "1"); } catch (e) { } render(); },
  "share-send": () => {
    const code = exportCode();
    const txt = "Mon agenda Fonte" + (S.profile.prenom ? " (" + S.profile.prenom + ")" : "") + " : ouvre Fonte, onglet Agenda, « Importer un code », et colle ce message.\n\n" + code;
    if (navigator.share) navigator.share({ text: txt }).catch(() => { });
    else A["share-export"]();
  },
  "data-export": () => {
    if (!PWA) { Sheet.open({ key: "dx", title: "Transférer mes données", body: `<p class="muted">Copie ce code, puis colle-le dans Fonte installé sur ton écran d’accueil (Profil, Restaurer). Profil, séances, historique et agenda passent d’un coup.</p><textarea class="code-box" id="exp-code" readonly aria-label="Code de sauvegarde">${esc(dataCode())}</textarea>`, foot: `<button class="btn btn-primary btn-lg" data-a="copy-code">${icon("copy")}Copier le code</button>` }); return; }
    Sheet.open({ key: "dx", title: "Sauvegarder / transférer", tall: true, body: `<p class="muted">Un seul fichier contient tout : profil, séances, historique, records, notes, mesures et agenda. ${esc(backupAgo())}.</p>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="h3">Garder une copie</div><ol class="steps"><li><span>Touche « Sauvegarder » en bas.</span></li><li><span>Choisis <b>Enregistrer dans Fichiers</b>, puis le dossier <b>iCloud Drive</b>.</span></li></ol><p class="small muted">Dans iCloud Drive, la sauvegarde sera aussi sur ton prochain iPhone. Fonte te la redemande tous les 30 jours.</p></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="h3">Passer sur un autre iPhone</div><ol class="steps"><li><span>Ici : « Sauvegarder », puis <b>AirDrop</b> vers le nouvel iPhone (ou Messages, ou iCloud Drive).</span></li><li><span>Sur le nouvel iPhone : ouvre le lien de Fonte dans Safari, ajoute-la à l’écran d’accueil et ouvre-la.</span></li><li><span>Profil, <b>Restaurer</b>, « Choisir un fichier », puis prends la sauvegarde (dossier Téléchargements pour AirDrop).</span></li></ol></div>
      <details><summary class="small muted" style="cursor:pointer">Pas de fichier possible ? Copier le code à la place</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><p class="small muted">Colle-le dans tes notes ou envoie-le-toi par message, puis colle-le dans Restaurer.</p><button class="btn" data-a="dx-code">${icon("copy")}Copier le code de sauvegarde</button></div></details>`,
      foot: `<button class="btn btn-primary btn-lg" data-a="bk-now">${icon("download")}Sauvegarder</button>` });
  },
  "dx-code": () => { const c = dataCode(); const ok = () => { markBackup(); toast("Code copié"); render(); }; try { navigator.clipboard.writeText(c).then(ok, () => toast("Copie impossible ici")); } catch (e) { toast("Copie impossible ici"); } },
  "data-file": () => shareBackup(),
  "data-import": () => { IMP_RAW = ""; Sheet.open({ key: "di", title: "Restaurer", body: `<p class="muted">${PWA ? "Choisis le fichier de sauvegarde (iCloud Drive, ou Téléchargements s’il est arrivé par AirDrop), ou colle un code de sauvegarde." : "Colle un code de sauvegarde (il commence par FONTEDATA1.)."} Les données de ce téléphone seront remplacées.</p>${PWA ? `<label class="btn btn-block btn-primary" for="imp-file">${icon("download")}Choisir le fichier</label><input type="file" id="imp-file" accept=".json,application/json,text/plain" hidden>` : ""}<div class="note" id="imp-sum" hidden></div><textarea class="code-box" id="imp-data" aria-label="Code de sauvegarde" placeholder="Ou colle ici un code FONTEDATA1.…"></textarea><p class="small" id="imp-derr" style="color:var(--red)" hidden></p>`, foot: `<button class="btn" data-a="sheet-close">Annuler</button><button class="btn btn-primary" data-a="data-restore">Restaurer</button>` }); },
  "data-restore": el => {
    const v = IMP_RAW || ($("#imp-data") || {}).value || "";
    if (!v.trim()) { const p = $("#imp-derr"); p.textContent = "Choisis un fichier ou colle un code."; p.hidden = false; return; }
    if (!parseBackup(v)) { const p = $("#imp-derr"); p.textContent = "Ce fichier ou ce code n’est pas une sauvegarde Fonte complète."; p.hidden = false; return; }
    if (!arm(el, "Remplacer mes données ?")) return;
    const err = restoreData(v);
    if (err) { const p = $("#imp-derr"); p.textContent = err; p.hidden = false; return; }
    IMP_RAW = ""; markBackup(); Sheet.closeAll(); render(); toast("Données restaurées");
  },
  "import-del": el => { if (!arm(el, "Confirmer")) return; S.imports = S.imports.filter(x => x.id !== el.dataset.id); commit("p"); render(); },
  /* profil */
  "pf-set": el => { const f = el.dataset.f; let v = el.dataset.v; if (f === "jours" || f === "barre") v = +v; S.profile[f] = v; commit("p"); if (syncPlan()) toast("Programme et agenda mis à jour"); render(); },
  "pf-obj": el => {
    const k = el.dataset.v, a = S.profile.objectifs.slice(), i = a.indexOf(k);
    if (i >= 0) { if (a.length === 1) { toast("Garde au moins un objectif"); return; } a.splice(i, 1); } else a.push(k);
    S.profile.objectifs = a; S.profile.objectif = a[0]; commit("p"); if (syncPlan()) toast("Programme et agenda mis à jour"); render();
  },
  "pf-obj-main": el => { const k = el.dataset.v, a = S.profile.objectifs.filter(x => x !== k); a.unshift(k); S.profile.objectifs = a; S.profile.objectif = k; commit("p"); syncPlan(); render(); toast("Objectif principal : " + OBJECTIFS[k].n); },
  "pf-toggle": el => { const f = el.dataset.f; S.profile[f] = !S.profile[f]; commit("p"); render(); },
  "hist-clear": el => { if (!arm(el)) return; if (!snapshotLocal("hist-clear")) { toast(SNAP_FAIL); return; } S.historique = []; S.lastPerf = {}; S.refs = {}; S.legacyRefs = {}; S.legacySrc = {}; S.histDel = {}; S.histClear = Date.now(); commit("p"); render(); toast("Historique effacé"); },
  "undo-restore": el => {
    if (!arm(el, "Revenir à l’état d’avant ?")) return;
    const err = undoRestore();
    if (err) { toast(err); return; }
    initProgress(); syncPlan(); render(); toast("Données d’avant rétablies");
  },
  "reset-all": el => { if (!arm(el)) return; if (!snapshotLocal("reset-all")) { toast(SNAP_FAIL); return; } const keep = { partners: S.partners }; S = Object.assign(clone(DEF), keep); S.histClear = Date.now(); commit("pa"); render(); toast("Application réinitialisée"); }
};

document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el, ev); }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && Sheet.stack.length) { Sheet.close(); return; }
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute && ev.target.getAttribute("role") === "button" && ev.target.dataset.a) { ev.preventDefault(); ev.target.click(); }
});
let pfTimer = null, noteTimer = null, IMP_RAW = "";
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "imp-data") { IMP_RAW = ""; const sum = $("#imp-sum"), o = parseBackup(t.value); if (sum) { sum.hidden = !o; if (o) sum.innerHTML = `${icon("check")}<span>${backupSummary(o)}</span>`; } return; }
  if (t.dataset.note) {
    const id = t.dataset.note, v = t.value.slice(0, 300);
    if (v.trim()) S.notes[id] = v; else delete S.notes[id];
    saveLocal(); clearTimeout(noteTimer); noteTimer = setTimeout(() => commit("p"), 800);
    return;
  }
  if (t.id === "ex-q") { UI.exQ = t.value; $("#ex-list").innerHTML = exListHTML(); return; }
  if (t.id === "pk-q" && PK) { PK.q = t.value; $("#pk-list").innerHTML = pkList(); return; }
  if (t.dataset.pf) {
    const f = t.dataset.pf;
    if (f === "prenom") S.profile.prenom = t.value.slice(0, 30);
    else { const v = num(t.value); S.profile[f] = v > 0 ? v : null; }
    saveLocal();
    clearTimeout(pfTimer);
    pfTimer = setTimeout(() => { if (f === "poids" && S.profile.poids) upsertMesure(todayISO(), { poids: S.profile.poids, tour: (S.mesures.find(x => x.date === todayISO()) || {}).tour || 0 }); commit(f === "prenom" ? "pa" : "p"); const a = $("#adapt"); if (a) a.outerHTML = adaptCard(); renderHeader(); }, 500);
    return;
  }
  if (E && t.closest("#editor")) {
    if (t.dataset.ed) { E.se[t.dataset.ed] = t.value; return; }
    if (t.dataset.f) { const i = +t.dataset.i, f = t.dataset.f, v = num(t.value); if (i < 0) E.se[f] = v; else if (E.se.items[i]) E.se.items[i][f] = v; }
  }
});
document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.id === "imp-file" && t.files && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      IMP_RAW = String(r.result || ""); const o = parseBackup(IMP_RAW), sum = $("#imp-sum"), er = $("#imp-derr"), ta = $("#imp-data");
      if (ta) ta.value = "";
      if (o) { if (sum) { sum.innerHTML = `${icon("check")}<span>${backupSummary(o)} Touche « Restaurer » pour la charger.</span>`; sum.hidden = false; } if (er) er.hidden = true; }
      else { IMP_RAW = ""; if (sum) sum.hidden = true; if (er) { er.textContent = "Ce fichier n’est pas une sauvegarde Fonte."; er.hidden = false; } }
    };
    r.readAsText(t.files[0]);
  }
  if (t.id === "fx-rappel") { try { localStorage.setItem(LS_RAPPEL, t.value); } catch (e) { } }
  if (t.id === "ae-ref") { const f = $("#ae-titre-f"); if (f) f.hidden = t.value !== "libre"; }
  if (t.id === "pl-heure" && t.value) {
    S.profile.planHeure = t.value;
    if (S.profile.autoPlan) { progEvents(todayISO()).forEach(e => { e.heure = t.value; }); commit("pa"); toast("Heure changée pour tes séances à venir"); } else commit("p");
  }
  if (E && t.closest("#editor") && t.dataset.f) { const i = +t.dataset.i, f = t.dataset.f; edSet(i, f, num(t.value)); t.value = fmtNum(i < 0 ? E.se[f] : E.se.items[i][f]); }
});
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (TABS.indexOf(h) >= 0 && h !== UI.tab) { UI.tab = h; render(); window.scrollTo(0, 0); } });

/* ================= Démarrage ================= */
initProgress();
const BODY_UP = bodyCheck();
if (!syncPlan()) autoPlan();
const MISSED = requeue();
if (MISSED) setTimeout(() => toast(MISSED > 1 ? MISSED + " séances manquées : le programme reprend là où tu t’étais arrêté" : "Séance manquée : tu la feras à ta prochaine séance, la suite est décalée"), 800);
else if (BODY_UP) setTimeout(() => toast("Ton poids ne baisse plus depuis 3 semaines : 5 min de cardio en plus dans tes séances cardio"), 800);
render();
{ const t = readTrash(); if (t) showUndo("Séance supprimée", "run-undo-discard", t.at + UNDO_MS); else clearTrash(); }
if (STORE.note === "resume") setTimeout(() => toast("Mise à jour des données : la mémoire était presque pleine, le détail des séances les plus anciennes a été résumé (aucune séance perdue)."), 900);
if (STORE.note === "fusion") setTimeout(() => toast("Des séances enregistrées par une ancienne version de Fonte ont été ajoutées à ton profil."), 900);
if (STORE.note === "fusion-plein") setTimeout(() => toast("Mémoire du téléphone pleine : fais une sauvegarde depuis Profil."), 900);
if (STORE_BLOCK && STORE_BLOCK.reason === "illisible") setTimeout(() => toast("Les données enregistrées étaient illisibles : une copie a été gardée sur ce téléphone, rien n’a été effacé."), 900);
if (STORE_BLOCK && STORE_BLOCK.reason === "plus-recent") { /* rien à faire : la carte « Mets Fonte à jour » est affichée */ }
else if (onbNeeded() && !loadRun()) openOnb();
else if (S.profile.bilanNew != null && !loadRun()) setTimeout(() => openBilan(S.profile.bilanNew), 300);
Sync.init();
if (PWA) {
  Cloud.load();
  Acct.load();
  /* compte du profil (3C) : la connexion est retrouvée d’abord, l’agenda partagé l’utilise ensuite ; sinon, agenda comme avant */
  if (Acct.meta.email && Acct.cfg()) Acct.boot().then(() => { if (Cloud.cfg && !Cloud.col && !Cloud.starting) Cloud.start(); });
  else if (Cloud.cfg) Cloud.start();
  window.addEventListener("online", () => { Acct.queue(0); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) Acct.queue(300); });
  setInterval(() => { if (!document.hidden) Acct.queue(0); }, 5 * 60e3); /* ce qui a changé sur l’autre appareil arrive aussi pendant que l’appli est ouverte */
  window.addEventListener("online", () => { if (Cloud.cfg && !Cloud.col) Cloud.start(); });
  window.addEventListener("offline", () => { if (Cloud.cfg && Cloud.state === "live") Cloud.set("offline"); });
}
if (PWA && "serviceWorker" in navigator && location.protocol !== "file:") {
  const sw = navigator.serviceWorker;
  /* Le service worker prévient quand il a téléchargé une nouvelle version de l’appli */
  sw.addEventListener("message", e => { if (e.data && e.data.type === "fonte-update") $("#upd").hidden = false; });
  try { sw.startMessages(); } catch (e) { }
  window.addEventListener("load", () => {
    sw.register("./sw.js").then(reg => { if (sw.controller) sw.controller.postMessage({ type: "fonte-hello" }); return reg; }).catch(() => { });
  });
  /* Appli rouverte après un long moment en arrière-plan : on vérifie s’il y a du nouveau */
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 30 * 60e3 && navigator.onLine !== false) {
      fetch("./index.html", { cache: "no-store" }).catch(() => { });
      sw.getRegistration().then(r => r && r.update()).catch(() => { });
    }
  });
}
})();
