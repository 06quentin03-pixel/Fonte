"use strict";
/* ===== Fonte · moteur « utilisateur » : format des données (version, migrate, migration v1 → v2), stockage par profil (storeOpen,
   storeSave, profils), copie de sécurité, sauvegarde fichier et restauration, historique résumé, rappel de sauvegarde, exports (CSV, .ics) =====
   Tout ce qui touche au stockage se teste en Node avec un faux localStorage (tests/run.js). Restent dans app.js : les messages à l’écran
   (toast), le rendu, et la synchronisation (compte Claude, Firebase : reprise en 3C).
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → engine-sync.js → app.js.
   Les déclarations de haut niveau sont partagées entre ces fichiers (comme lorsqu’ils formaient un seul index.html) :
   un fichier peut utiliser ce qu’un fichier précédent déclare. tools/assemble.js les recolle en un seul fichier (mode « artifact Claude »). */

/* Rappel de sauvegarde (D1-a) : après 10 séances ou 14 jours depuis la dernière sauvegarde (au moins une séance depuis),
   jamais pendant un report (« Me le rappeler dans 7 jours »). Sans aucune sauvegarde : dès 3 séances, comme avant.
   Renvoie null ou { last, days, n } (n = séances faites depuis la dernière sauvegarde). */
const BK_SESSIONS = 10, BK_DAYS = 14, BK_SNOOZE_DAYS = 7;
function backupDueAt(hist, last, snooze, now) {
  hist = Array.isArray(hist) ? hist : [];
  if (now < (snooze || 0)) return null;
  const n = hist.filter(h => h && (h.ts || 0) > (last || 0)).length;
  if (!last) return hist.length >= 3 ? { last: 0, days: 0, n } : null;
  const days = Math.floor((now - last) / 864e5);
  return n >= BK_SESSIONS || (n >= 1 && days >= BK_DAYS) ? { last, days, n } : null;
}
/* Historique : au-delà des HIST_FULL séances les plus récentes, on ne garde que les meilleures séries de chaque exercice
   (suffisant pour les courbes et les records) ; HIST_MAX séances en tout. */
const HIST_FULL = 300, HIST_MAX = 3000;
function compactEntry(h) {
  if (!h || h.c || !Array.isArray(h.log)) return h;
  const log = h.log.filter(l => l && !l.cool && !l.warm && Array.isArray(l.sets) && l.sets.length).map(l => {
    const rs = l.sets.filter(s => s.r != null), ds = l.sets.filter(s => s.d), keep = [];
    const add = s => { if (s && keep.indexOf(s) < 0) keep.push(s); };
    if (rs.length) {
      add(rs.reduce((b, s) => ((s.kg || 0) > (b.kg || 0) || ((s.kg || 0) === (b.kg || 0) && s.r > b.r) ? s : b)));
      if (rs.some(s => s.kg)) add(rs.reduce((b, s) => (e1rm(s.r, s.kg) > e1rm(b.r, b.kg) ? s : b)));
      if (isAssist(l.id)) add(rs.filter(s => s.r >= 5).reduce((b, s) => (!b || (s.kg || 0) < (b.kg || 0) ? s : b), null));
    }
    if (ds.length) add(ds.reduce((b, s) => (s.d > b.d ? s : b)));
    /* t (cible) et b (base) sont gardés : ils servent au recalcul des références (D3) */
    return Object.assign({ id: l.id, n: l.sets.length, sets: keep.map(s => (s.d ? { d: s.d } : Object.assign({ r: s.r, kg: s.kg || 0 }, "t" in s ? { t: s.t } : {}))) }, l.b ? { b: l.b } : {});
  });
  return Object.assign({}, h, { log, c: 1 });
}
function trimHist(list, full) {
  const f = full == null ? HIST_FULL : full;
  return list.slice(0, HIST_MAX).map((h, i) => (i < f ? h : compactEntry(h)));
}

/* Export tableur : une ligne par série, séparateur « ; » et virgule décimale (Excel, Numbers, LibreOffice en français) */
function csvCell(v) { const s = v == null ? "" : String(v); return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csvNum(n) { return n == null || n === "" ? "" : String(Math.round(n * 100) / 100).replace(".", ","); }
function csvExport(hist) {
  const FEEL = ["", "Facile", "Correct", "Dur", "Très dur"];
  const rows = [["Date", "Séance", "Exercice", "Série", "Répétitions", "Charge (kg)", "Réserve (reps)", "Durée (s)", "Phase", "Ressenti", "Durée séance (min)", "Volume séance (kg)", "Détail"]];
  (hist || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0) || String(a.date).localeCompare(String(b.date))).forEach(h => {
    const head = [h.date, h.nom || "Séance"], tail = [FEEL[h.ressenti || 0] || "", csvNum(Math.round((h.duree || 0) / 60)), csvNum(h.volume || 0), h.c ? "meilleures séries seulement" : ""];
    const log = Array.isArray(h.log) ? h.log : [];
    if (!log.length) { rows.push(head.concat(["", "", "", "", "", "", ""], tail)); return; }
    log.forEach(l => {
      const e = EX_BY_ID[l.id], nom = e ? e.n : l.id;
      (l.sets || []).forEach((s, k) => rows.push(head.concat([nom, k + 1, s.d ? "" : s.r, s.d ? "" : csvNum(s.kg || 0), s.rir == null ? "" : (s.rir >= 3 ? "3+" : s.rir), s.d || "", l.warm ? "échauffement" : l.cool ? "étirement" : ""], tail)));
    });
  });
  return rows.map(r => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

/* Export agenda au format iCalendar, avec un rappel : alarm = minutes avant la séance (-1 = aucun) */
function icsText(s) { return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
function icsFold(line) { const out = []; let s = line; while (s.length > 74) { out.push(s.slice(0, 74)); s = " " + s.slice(74); } out.push(s); return out.join("\r\n"); }
function icsExport(events, opts) {
  opts = opts || {};
  const alarm = opts.alarm == null ? 60 : opts.alarm, dur = opts.dur || 60, now = opts.now || new Date();
  const p2 = n => String(n).padStart(2, "0");
  const utc = d => d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + "T" + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + "Z";
  const loc = d => d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "T" + p2(d.getHours()) + p2(d.getMinutes()) + "00";
  const day = d => d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate());
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fonte//Agenda//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Fonte"];
  (events || []).forEach(e => {
    if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) return;
    const [y, m, d] = e.date.split("-").map(Number);
    L.push("BEGIN:VEVENT", "UID:fonte-" + icsText(e.id || e.date) + "@fonte", "DTSTAMP:" + utc(now));
    if (/^\d{2}:\d{2}$/.test(e.heure || "")) {
      const [hh, mm] = e.heure.split(":").map(Number), a = new Date(y, m - 1, d, hh, mm), b = new Date(a.getTime() + dur * 60000);
      L.push("DTSTART:" + loc(a), "DTEND:" + loc(b));
    } else { const a = new Date(y, m - 1, d), b = new Date(y, m - 1, d + 1); L.push("DTSTART;VALUE=DATE:" + day(a), "DTEND;VALUE=DATE:" + day(b)); }
    L.push("SUMMARY:" + icsText(e.titre || "Séance"));
    if (e.note) L.push("DESCRIPTION:" + icsText(e.note));
    if (alarm >= 0) L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsText(e.titre || "Séance"), "TRIGGER:-PT" + alarm + "M", "END:VALARM");
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.map(icsFold).join("\r\n") + "\r\n";
}


/* ================= État ================= */
const clone = o => JSON.parse(JSON.stringify(o));
const rid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const LS = "fonte:v1", LS_RUN = "fonte:run", LS_UI = "fonte:ui";
const DEF_PROFILE = { prenom: "", sexe: "", age: null, taille: null, poids: null, niveau: "debutant", objectif: "forme", objectifs: ["forme"], jours: 3, sansSaut: false, barre: 20 };
/* Profil normalisé : objectifs = liste (le premier est le principal), objectif = le principal (anciennes versions) */
function normProfile(pr) { const p = Object.assign(clone(DEF_PROFILE), pr || {}); if (!pr || !Array.isArray(pr.objectifs)) p.objectifs = [p.objectif]; p.objectifs = objList(p); p.objectif = p.objectifs[0]; return p; }
/* État d’un profil (format v2). refs, legacyRefs, legacySrc : voir MIGRATIONS[1] et docs/FORMAT_DONNEES.md */
const DEF = { v: 2, upd: 0, agUpd: 0, profile: DEF_PROFILE, mesSeances: [], historique: [], lastPerf: {}, refs: {}, legacyRefs: {}, legacySrc: {}, notes: {}, mesures: [], deload: {}, histDel: {}, histClear: 0, corbeille: [], agenda: [], imports: [], partners: {}, hidden: {} };
const isObj = o => !!o && typeof o === "object" && !Array.isArray(o);
const dayMs = iso => { if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 0; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };

/* ================= Version du format et migrations (D8, 3B) =================
   SCHEMA_VERSION = version du format que cette appli sait lire et écrire (champ v des données).
   Toute donnée lue (stockage au démarrage, sauvegarde fichier ou code FONTEDATA1., synchro Claude) passe par migrate(raw) :
   - pas de champ v : premières versions de Fonte, traitées comme la version 1 ;
   - version plus ancienne : MIGRATIONS[n] transforme la version n en n + 1, l’une après l’autre ;
   - version plus récente que l’appli (appareil pas encore mis à jour) : refusée, rien n’est transformé ni écrasé.
   migrate ne modifie jamais l’objet reçu. Renvoie { data, from } ou { data: null, from, error: "illisible" | "plus-recent" }. */
const SCHEMA_VERSION = 2;
/* Références par exercice et par zone, à partir des « dernières performances » (une seule zone par exercice au départ) */
function refsFromLastPerf(lastPerf) {
  const out = {};
  Object.keys(isObj(lastPerf) ? lastPerf : {}).forEach(id => { const lp = lastPerf[id]; if (lp && Array.isArray(lp.sets) && lp.sets.length) out[id] = { [zoneOf(refReps(lp))]: lp }; });
  return out;
}
/* Séance de l’historique dont vient chaque « dernière performance » (même heure ts, ou à défaut même date et mêmes séries) :
   sert à D3 (si cette séance est supprimée, la référence est recalculée sans elle). Exercice absent : séance inconnue. */
function legacySources(hist, lastPerf) {
  const out = {}, list = Array.isArray(hist) ? hist : [];
  const sig = sets => JSON.stringify((sets || []).filter(s => s && s.r != null).map(s => [s.r, s.kg || 0]));
  Object.keys(isObj(lastPerf) ? lastPerf : {}).forEach(id => {
    const lp = lastPerf[id]; if (!lp || !Array.isArray(lp.sets)) return;
    const h = list.find(h => h && h.id && !h.dl && Array.isArray(h.log) && h.log.some(l => l && l.id === id && !l.warm && !l.cool) &&
      (lp.ts ? h.ts === lp.ts : h.date === lp.d && h.log.some(l => l && l.id === id && sig(l.sets) === sig(lp.sets))));
    if (h) out[id] = h.id;
  });
  return out;
}
/* v1 → v2 (3B) : même contenu, plus
   - refs[id][zone] : références par exercice et zone de répétitions, issues de lastPerf (S1-b, format seulement : utilisées en 3D) ;
   - legacyRefs : copie intacte de lastPerf v1 (point de départ du recalcul des références, D3) ; legacySrc : séance d’origine de chacune ;
   - upd sur chaque séance de l’historique (date de dernière modification : heure de la séance pour les anciennes).
   Rien n’est retiré. Les profils (fonte:profiles, fonte:p:<id>) sont gérés par storeOpen, pas ici : cette fonction ne touche qu’à l’état. */
function migrate1to2(d) {
  d.v = 2;
  const lp = isObj(d.lastPerf) ? d.lastPerf : {};
  d.legacyRefs = clone(lp);
  d.refs = refsFromLastPerf(clone(lp));
  d.legacySrc = legacySources(d.historique, lp);
  if (Array.isArray(d.historique)) d.historique.forEach(h => { if (isObj(h) && h.upd == null) h.upd = h.ts || dayMs(h.date) || 0; });
  return d;
}
const MIGRATIONS = { 1: migrate1to2 };
function migrate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { data: null, from: 0, error: "illisible" };
  const from = Number.isInteger(raw.v) && raw.v > 0 ? raw.v : 1;
  if (from > SCHEMA_VERSION) return { data: null, from, error: "plus-recent" };
  let data = raw;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    if (!MIGRATIONS[v]) return { data: null, from, error: "illisible" };
    data = MIGRATIONS[v](JSON.parse(JSON.stringify(data)));
  }
  return { data, from };
}
/* État complet et cohérent (champs manquants remplis), à partir de données déjà migrées */
function normState(s) {
  const st = Object.assign(clone(DEF), s && typeof s === "object" ? s : {});
  st.v = SCHEMA_VERSION;
  st.profile = normProfile(st.profile);
  ["mesSeances", "historique", "agenda", "imports", "corbeille"].forEach(k => { if (!Array.isArray(st[k])) st[k] = []; });
  if (!st.histDel || typeof st.histDel !== "object" || Array.isArray(st.histDel)) st.histDel = {};
  if (typeof st.histClear !== "number") st.histClear = 0;
  ["notes", "deload", "lastPerf", "refs", "legacyRefs", "legacySrc", "partners", "hidden"].forEach(k => { if (!isObj(st[k])) st[k] = {}; });
  if (!Array.isArray(st.mesures)) st.mesures = [];
  return st;
}

/* ================= Stockage : profils et migration au démarrage (3B) =================
   Format v2 (docs/FORMAT_DONNEES.md) :
   - fonte:profiles = { v: 2, active, owner, list: [{ id, prenom, cree }], mig } : liste des profils, profil actif ;
     owner = profil relié à la synchro de l’appareil (agenda partagé Firebase, compte Claude) ; mig = trace de la migration de fonte:v1 ;
   - fonte:p:<id> = état du profil ; fonte:p:<id>:run (séance en cours), :run-trash, :undo, :undo-info, :backup, :bksnooze ;
   - communs à l’appareil : fonte:ui, fonte:noinstall, fonte:rappel, fonte:sync ;
   - fonte:v1 (format v1) n’est plus jamais écrit après la migration : il reste comme copie de secours.
   STORE.mode = "v2" (normal) | "v1" (migration impossible pour l’instant, mémoire pleine : l’appli continue sur fonte:v1 comme avant)
   | "bloque" (données d’une version plus récente : rien n’est écrit). */
const LS_PROFILES = "fonte:profiles";
const pKey = (id, sfx) => "fonte:p:" + id + (sfx ? ":" + sfx : "");
/* Clés propres à chaque profil (suffixes) ; en v1 elles s’appelaient fonte:<suffixe> */
const PROFILE_SFX = ["run", "run-trash", "undo", "undo-info", "backup", "bksnooze"];
const STORE = { ls: null, mode: "v2", pid: null, P: null, note: null };
/* Données présentes mais inutilisables au démarrage : l’appli ne doit jamais les écraser.
   STORE_BLOCK = null (tout va bien) | { reason: "plus-recent", v } (format plus récent : aucune écriture des données)
   | { reason: "illisible" } (JSON abîmé : une copie brute est gardée dans <clé>-illisible avant toute écriture). */
let STORE_BLOCK = null;
const LS_BROKEN = "fonte:v1-illisible";
const isQuota = e => !!e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
function lsOf(ls) { if (ls || STORE.ls) return ls || STORE.ls; try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } /* stockage interdit (bac à sable) */ }
function lsGet(ls, k) { try { return lsOf(ls).getItem(k); } catch (e) { return null; } }
/* true si écrit ; "plein" si la mémoire est pleine ; false pour une autre erreur */
function lsSet(ls, k, v) { try { lsOf(ls).setItem(k, v); return true; } catch (e) { return isQuota(e) ? "plein" : false; } }
function lsDel(ls, k) { try { lsOf(ls).removeItem(k); } catch (e) { } }
/* Empreinte d’un texte (FNV-1a 32 bits + longueur) : sert à voir si fonte:v1 a changé depuis la migration */
function sigOf(str) {
  str = String(str); let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16) + ":" + str.length;
}
const newProfileId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
/* Clé de l’état actif ou d’un fichier lié (sfx = "run", "undo"…), selon le mode */
function storeKey(sfx) {
  if (STORE.mode === "v2" && STORE.pid) return pKey(STORE.pid, sfx);
  return sfx ? "fonte:" + sfx : LS;
}
/* Écrit un état ; mémoire pleine → résume davantage les séances anciennes (trimHist) et réessaie. Modifie st.historique si résumé. */
function writeState(ls, key, st) {
  let trimmed = false;
  for (let full = HIST_FULL; ; full = Math.floor(full / 2)) {
    try { lsOf(ls).setItem(key, JSON.stringify(st)); return { ok: true, trimmed }; }
    catch (e) {
      const quota = isQuota(e);
      if (!quota || full < 10) return { ok: false, quota, trimmed };
      st.historique = trimHist(st.historique, full); trimmed = true;
    }
  }
}
/* Lecture d’un état stocké → { state } | { error: "illisible" | "plus-recent", v } | { absent: true } */
function readState(raw) {
  if (raw == null) return { absent: true };
  let o = null; try { o = JSON.parse(raw); } catch (e) { o = null; }
  const m = migrate(o);
  if (m.error) return { error: m.error, v: m.from };
  return { state: normState(m.data), from: m.from };
}
/* Comparaison après relecture (migration) : rien ne doit manquer par rapport à la source v1.
   Renvoie la liste des rubriques différentes (vide = identique). */
function compareMigrated(src, st) {
  const diff = [], n = (o, k) => (Array.isArray(o[k]) ? o[k].length : 0), keys = (o, k) => Object.keys(isObj(o[k]) ? o[k] : {}).sort().join(",");
  const ids = o => (Array.isArray(o.historique) ? o.historique : []).map(h => h && h.id).sort().join(",");
  ["historique", "mesures", "mesSeances", "agenda", "imports"].forEach(k => { if (n(src, k) !== n(st, k)) diff.push(k); });
  if (ids(src) !== ids(st)) diff.push("historique (identifiants)");
  ["notes", "lastPerf", "deload"].forEach(k => { if (keys(src, k) !== keys(st, k)) diff.push(k); });
  if (keys(src, "lastPerf") !== Object.keys(st.legacyRefs || {}).sort().join(",")) diff.push("legacyRefs");
  if (JSON.stringify(src.lastPerf || {}) !== JSON.stringify(st.lastPerf || {})) diff.push("lastPerf (contenu)");
  if (JSON.stringify(src.notes || {}) !== JSON.stringify(st.notes || {})) diff.push("notes (contenu)");
  if (JSON.stringify(src.mesures || []) !== JSON.stringify(st.mesures || [])) diff.push("mesures (contenu)");
  const sp = isObj(src.profile) ? src.profile : {};
  Object.keys(sp).forEach(k => { if (JSON.stringify(sp[k]) !== JSON.stringify(st.profile[k])) diff.push("profile." + k); });
  return diff;
}
/* Migration de fonte:v1 vers le profil 1 (plan, section 7.3), au premier lancement de la version 3B.
   1. fonte:v1 est lu sans être modifié ; 2. l’état v2 est construit en mémoire (migrate) ;
   3. fonte:p:<id> est écrit, relu et comparé à la source avant d’écrire fonte:profiles ;
   4. mémoire pleine : l’historique ancien est résumé dans la copie (trimHist) et on réessaie ; sinon on reste sur v1, rien n’est effacé ;
   5. fonte:v1 est conservé. Renvoie { pid, P, state, trimmed } ou { error: "illisible" | "plus-recent" | "plein" | "verification", diff }. */
function migrateStore(ls, raw, now) {
  let o = null; try { o = JSON.parse(raw); } catch (e) { o = null; }
  const m = migrate(o);
  if (m.error) return { error: m.error, v: m.from };
  const src = normState(clone(o)); /* source telle que la version 3A la lisait (pour la comparaison) */
  const st = normState(m.data), id = newProfileId(), key = pKey(id);
  const undo = (made) => { made.forEach(k => lsDel(ls, k)); };
  const w = writeState(ls, key, st);
  if (!w.ok) { lsDel(ls, key); return { error: w.quota ? "plein" : "ecriture" }; }
  const back = lsGet(ls, key), rb = readState(back);
  const diff = back !== JSON.stringify(st) ? ["relecture"] : rb.state ? compareMigrated(src, rb.state) : ["relecture"];
  /* sans résumé, chaque séance doit être identique à la source (à part la date upd ajoutée) */
  if (!w.trimmed && rb.state && !diff.length) {
    const strip = h => { const c = Object.assign({}, h); delete c.upd; return JSON.stringify(c); };
    if (rb.state.historique.some((h, i) => strip(h) !== strip(src.historique[i]))) diff.push("historique (contenu)");
  }
  if (diff.length) { lsDel(ls, key); return { error: "verification", diff }; }
  /* fichiers liés au profil : séance en cours, séance supprimée récemment, copie de sécurité, dates de sauvegarde */
  const made = [key];
  for (const sfx of PROFILE_SFX) {
    const v = lsGet(ls, "fonte:" + sfx); if (v == null) continue;
    const r = lsSet(ls, pKey(id, sfx), v);
    if (r !== true) { if (sfx === "undo" || sfx === "undo-info") continue; undo(made); return { error: r === "plein" ? "plein" : "ecriture" }; }
    made.push(pKey(id, sfx));
  }
  const P = { v: 2, active: id, owner: id, list: [{ id, prenom: st.profile.prenom || "", cree: now }], mig: { pid: id, at: now, sig: sigOf(raw) } };
  if (w.trimmed) P.mig.resume = 1;
  const rp = lsSet(ls, LS_PROFILES, JSON.stringify(P));
  if (rp !== true || lsGet(ls, LS_PROFILES) !== JSON.stringify(P)) { lsDel(ls, LS_PROFILES); undo(made); return { error: rp === "plein" ? "plein" : "ecriture" }; }
  /* la copie de sécurité (D5) est déplacée plutôt que doublée (elle peut être grosse) */
  if (lsGet(ls, pKey(id, "undo")) != null && lsGet(ls, pKey(id, "undo-info")) != null) { lsDel(ls, "fonte:undo"); lsDel(ls, "fonte:undo-info"); }
  return { pid: id, P, state: rb.state, trimmed: w.trimmed };
}
/* Fusion (garde anti-retour) : fonte:v1 a été modifié après la migration par une ancienne version encore ouverte.
   On garde tout ce qui est dans le profil et on ajoute ce que l’ancienne version a enregistré :
   séances par identifiant (sauf celles supprimées dans le profil), mesures et séances perso par identifiant, références plus récentes,
   notes ajoutées ; profil, agenda, notes modifiées, semaine allégée et agendas importés : la version la plus récente (upd / agUpd). */
function mergeV1(cur, v1) {
  const out = clone(cur), newer = (v1.upd || 0) > (cur.upd || 0);
  const map = {}; out.historique.forEach(h => { if (h && h.id) map[h.id] = 1; });
  const add = (v1.historique || []).filter(h => h && h.id && !map[h.id] && !out.histDel[h.id] && (h.ts || 0) > (out.histClear || 0));
  add.forEach(h => { if (h.upd == null) h.upd = h.ts || dayMs(h.date) || 0; });
  out.historique = trimHist(out.historique.concat(clone(add)).sort((a, b) => (b.ts || 0) - (a.ts || 0)));
  Object.keys(v1.lastPerf || {}).forEach(id => {
    const a = out.lastPerf[id], b = v1.lastPerf[id];
    if (b && Array.isArray(b.sets) && (!a || (b.ts || dayMs(b.d)) > (a.ts || dayMs(a.d)))) { out.lastPerf[id] = clone(b); (out.refs[id] = out.refs[id] || {})[zoneOf(refReps(b))] = clone(b); }
  });
  const byId = (a, b) => { const m = {}; a.forEach(x => { if (x && x.id) m[x.id] = x; }); (b || []).forEach(x => { if (x && x.id && (!m[x.id] || newer)) m[x.id] = x; }); return Object.values(m); };
  out.mesures = byId(out.mesures, clone(v1.mesures || [])).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  out.mesSeances = byId(out.mesSeances, clone(v1.mesSeances || []));
  Object.keys(v1.notes || {}).forEach(k => { if (!(k in out.notes) || newer) out.notes[k] = v1.notes[k]; });
  if (newer) { out.profile = normProfile(v1.profile); if (isObj(v1.deload)) out.deload = clone(v1.deload); if (Array.isArray(v1.imports)) out.imports = clone(v1.imports); out.upd = v1.upd; }
  if ((v1.agUpd || 0) > (cur.agUpd || 0) && Array.isArray(v1.agenda)) { out.agenda = clone(v1.agenda); out.agUpd = v1.agUpd; }
  return out;
}
function guardV1(ls, P) {
  const mig = P.mig; if (!mig || !mig.pid || !P.list.some(x => x && x.id === mig.pid)) return null;
  const raw1 = lsGet(ls, LS); if (raw1 == null) return null;
  const sg = sigOf(raw1); if (sg === mig.sig) return null;
  const r1 = readState(raw1), saveP = () => { mig.sig = sg; lsSet(ls, LS_PROFILES, JSON.stringify(P)); };
  if (r1.error === "illisible") { if (lsGet(ls, LS_BROKEN) == null) lsSet(ls, LS_BROKEN, raw1); saveP(); return null; }
  if (r1.error) return null; /* format plus récent dans fonte:v1 : on n’y touche pas */
  const key = pKey(mig.pid), rc = readState(lsGet(ls, key));
  if (rc.error) return null; /* profil illisible ou plus récent : on ne fusionne pas (loadState s’en occupe) */
  const merged = mergeV1(rc.state || normState(clone(DEF)), r1.state);
  const w = writeState(ls, key, merged);
  if (!w.ok) return "fusion-plein";
  mig.merged = (mig.merged || 0) + 1; saveP();
  return "fusion";
}
/* Démarrage : choisit le profil actif, migre fonte:v1 si besoin, et renvoie l’état du profil actif. */
function storeOpen(ls, now) {
  ls = STORE.ls = lsOf(ls); now = now || Date.now();
  STORE.mode = "v2"; STORE.pid = null; STORE.P = null; STORE.note = null; STORE_BLOCK = null;
  const rawP = lsGet(ls, LS_PROFILES);
  if (rawP != null) {
    let P = null; try { P = JSON.parse(rawP); } catch (e) { P = null; }
    if (P && Number.isInteger(P.v) && P.v > SCHEMA_VERSION) { STORE.mode = "bloque"; STORE_BLOCK = { reason: "plus-recent", v: P.v }; return normState(clone(DEF)); }
    if (P && typeof P.active === "string" && Array.isArray(P.list) && P.list.some(x => x && x.id === P.active)) {
      STORE.P = P; STORE.pid = P.active;
      STORE.note = guardV1(ls, P);
      return loadState();
    }
    /* liste des profils abîmée : gardée à part ; la migration de fonte:v1 ci-dessous la recrée (aucune donnée de profil n’est effacée) */
    if (lsGet(ls, LS_PROFILES + "-illisible") == null) lsSet(ls, LS_PROFILES + "-illisible", rawP);
  }
  const raw1 = lsGet(ls, LS);
  if (raw1 == null) return storeFresh(ls, now, null);
  const r = migrateStore(ls, raw1, now);
  if (r.pid) { STORE.P = r.P; STORE.pid = r.pid; STORE.note = r.trimmed ? "resume" : "migre"; return r.state; }
  if (r.error === "plus-recent") { STORE.mode = "bloque"; STORE_BLOCK = { reason: "plus-recent", v: r.v }; return normState(clone(DEF)); }
  if (r.error === "illisible") {
    if (lsGet(ls, LS_BROKEN) == null) lsSet(ls, LS_BROKEN, raw1);
    const st = storeFresh(ls, now, sigOf(raw1)); STORE_BLOCK = STORE_BLOCK || { reason: "illisible" }; return st;
  }
  /* mémoire pleine ou vérification ratée : on reste sur fonte:v1 (comme la version 3A), rien n’est effacé ; nouvel essai au prochain lancement */
  STORE.mode = "v1"; STORE.note = r.error === "verification" ? "migration-verif" : "migration-plein"; STORE.diff = r.diff;
  return loadState();
}
/* Premier lancement (rien d’enregistré) ou fonte:v1 illisible : un profil vide */
function storeFresh(ls, now, sig) {
  const id = newProfileId(), st = normState(clone(DEF));
  const P = { v: 2, active: id, owner: id, list: [{ id, prenom: "", cree: now }] };
  if (sig) P.mig = { pid: id, at: now, sig, illisible: 1 };
  if (lsSet(ls, pKey(id), JSON.stringify(st)) === true && lsSet(ls, LS_PROFILES, JSON.stringify(P)) === true) { STORE.P = P; STORE.pid = id; return st; }
  lsDel(ls, pKey(id));
  STORE.mode = "v1"; /* mémoire pleine dès le départ : comme avant, sur fonte:v1 */
  return st;
}
/* Lecture de l’état du profil actif (ou de fonte:v1 en mode v1). Un état illisible est copié à part avant toute écriture ;
   pour le profil migré, on repart alors de fonte:v1 (toujours conservé). */
function loadState() {
  const ls = lsOf();
  if (STORE.mode === "bloque") return normState(clone(DEF));
  STORE_BLOCK = null;
  const key = storeKey(), raw = lsGet(ls, key), r = readState(raw);
  if (r.state) return r.state;
  if (r.absent) return normState(clone(DEF));
  if (r.error === "plus-recent") { STORE_BLOCK = { reason: "plus-recent", v: r.v }; return normState(clone(DEF)); }
  STORE_BLOCK = { reason: "illisible" };
  const bk = key === LS ? LS_BROKEN : key + "-illisible";
  if (lsGet(ls, bk) == null) lsSet(ls, bk, raw);
  if (STORE.mode === "v2" && STORE.P && STORE.P.mig && STORE.P.mig.pid === STORE.pid) { const r1 = readState(lsGet(ls, LS)); if (r1.state) return r1.state; }
  return normState(clone(DEF));
}
/* Enregistrement de l’état actif → { ok, trimmed, quota }. Mode v1 : écrit fonte:v1 au format v1 (lisible par la version 3A). */
function storeSave(st) {
  if (STORE_BLOCK && STORE_BLOCK.reason === "plus-recent") return { ok: false };
  const ls = lsOf();
  if (STORE.mode === "bloque") return { ok: false };
  if (STORE.mode === "v1") {
    const o = Object.assign({}, st, { v: 1 }); delete o.refs; delete o.legacyRefs; delete o.legacySrc;
    const r = writeState(ls, LS, o); if (r.trimmed) st.historique = o.historique; return r;
  }
  const r = writeState(ls, pKey(STORE.pid), st);
  const e = STORE.P && STORE.P.list.find(x => x.id === STORE.pid), pre = (st.profile && st.profile.prenom) || "";
  if (r.ok && e && e.prenom !== pre) { e.prenom = pre; lsSet(ls, LS_PROFILES, JSON.stringify(STORE.P)); }
  return r;
}
/* Profils de l’appareil (vide en mode v1 ou bloqué) */
function profileList() { return STORE.mode === "v2" && STORE.P ? STORE.P.list.map(x => Object.assign({ active: x.id === STORE.pid }, x)) : []; }
/* Nouveau profil vide (le questionnaire d’accueil s’ouvrira) → id, ou null si la mémoire est pleine. Ne change pas le profil actif. */
function profileAdd(now) {
  if (STORE.mode !== "v2" || !STORE.P) return null;
  const ls = lsOf(), id = newProfileId(), st = normState(clone(DEF));
  if (lsSet(ls, pKey(id), JSON.stringify(st)) !== true) { lsDel(ls, pKey(id)); return null; }
  const P = clone(STORE.P); P.list.push({ id, prenom: "", cree: now || Date.now() });
  if (lsSet(ls, LS_PROFILES, JSON.stringify(P)) !== true) { lsDel(ls, pKey(id)); return null; }
  STORE.P = P; return id;
}
/* Profil actif suivant (pris en compte au prochain démarrage : l’appli se relance aussitôt) */
function profileSwitch(id) {
  if (STORE.mode !== "v2" || !STORE.P || !STORE.P.list.some(x => x.id === id)) return false;
  const P = clone(STORE.P); P.active = id;
  if (lsSet(lsOf(), LS_PROFILES, JSON.stringify(P)) !== true) return false;
  STORE.P = P; return true;
}
/* Le profil actif est-il celui relié à la synchro de l’appareil (agenda partagé, compte Claude) ? */
function isSyncOwner() { return STORE.mode !== "v2" || !STORE.P || !STORE.P.owner || STORE.P.owner === STORE.pid; }

/* ================= Copie de sécurité (D5), sauvegarde fichier et restauration ================= */
/* Copie exacte de l’état enregistré du profil actif dans :undo, avec :undo-info = { at, reason } → true, ou false (mémoire pleine) */
function storeSnapshot(reason, now, fallback) {
  const ls = lsOf();
  let raw = lsGet(ls, storeKey()); if (raw == null) raw = fallback != null ? fallback : null;
  if (raw == null) return false;
  if (lsSet(ls, storeKey("undo"), raw) !== true) { lsDel(ls, storeKey("undo-info")); return false; }
  if (lsSet(ls, storeKey("undo-info"), JSON.stringify({ at: now || Date.now(), reason })) !== true) { lsDel(ls, storeKey("undo-info")); return false; }
  return true;
}
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
/* Contenu d’un fichier ou d’un code de sauvegarde (format v2 depuis 3B) */
function backupPayload(st, now) {
  return { v: SCHEMA_VERSION, app: "fonte", at: now || Date.now(), profile: st.profile, mesSeances: st.mesSeances, historique: st.historique, lastPerf: st.lastPerf,
    refs: st.refs, legacyRefs: st.legacyRefs, legacySrc: st.legacySrc, notes: st.notes, mesures: st.mesures, deload: st.deload, agenda: st.agenda, imports: st.imports };
}
/* Fichier JSON ou code FONTEDATA1. → { data } (déjà passé par migrate) ou { error: "illisible" | "pas-fonte" | "plus-recent" } */
function decodeBackup(raw) {
  raw = String(raw || "").trim();
  let o = null;
  try { const m = raw.replace(/\s/g, "").match(/FONTEDATA1\.([A-Za-z0-9_-]+)/); o = m ? JSON.parse(b64d(m[1])) : JSON.parse(raw); } catch (e) { return { error: "illisible" }; }
  if (!o || typeof o !== "object" || !o.profile) return { error: "pas-fonte" };
  const mg = migrate(o);
  if (mg.error === "plus-recent") return { error: "plus-recent" };
  if (mg.error) return { error: "pas-fonte" };
  return { data: mg.data, from: mg.from };
}
/* Agenda nettoyé (données reçues d’une sauvegarde ou d’un autre appareil) */
function cleanEvents(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  arr.slice(0, 600).forEach(e => {
    if (!e || typeof e !== "object" || typeof e.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return;
    const ref = e.ref && typeof e.ref === "object" && (e.ref.k === "t" || e.ref.k === "p") && typeof e.ref.id === "string" ? Object.assign({ k: e.ref.k, id: e.ref.id.slice(0, 60) }, OBJECTIFS[e.ref.o] ? { o: e.ref.o } : {}, Number.isInteger(e.ref.j) && e.ref.j >= 0 && e.ref.j < 6 ? { j: e.ref.j } : {}) : null;
    out.push({ id: String(e.id || rid()).slice(0, 40), date: e.date, heure: typeof e.heure === "string" && /^\d{2}:\d{2}$/.test(e.heure) ? e.heure : "",
      titre: String(e.titre || "Séance").slice(0, 80), note: String(e.note || "").slice(0, 300), fait: !!e.fait, ref });
  });
  return out;
}
/* Remplace les données du profil st par celles d’une sauvegarde déjà migrée (o = decodeBackup(...).data) */
function applyBackup(st, o) {
  st.profile = normProfile(o.profile);
  st.mesSeances = Array.isArray(o.mesSeances) ? o.mesSeances.filter(m => m && Array.isArray(m.items)) : [];
  st.historique = Array.isArray(o.historique) ? trimHist(o.historique.filter(h => h && h.id && h.date).sort((a, b) => (b.ts || 0) - (a.ts || 0))) : [];
  st.notes = isObj(o.notes) ? o.notes : {};
  st.mesures = Array.isArray(o.mesures) ? o.mesures.filter(m => m && typeof m.date === "string") : [];
  st.deload = isObj(o.deload) ? o.deload : {};
  st.histClear = 0; st.histDel = {};
  st.lastPerf = isObj(o.lastPerf) ? o.lastPerf : {};
  st.refs = isObj(o.refs) ? o.refs : refsFromLastPerf(st.lastPerf);
  st.legacyRefs = isObj(o.legacyRefs) ? o.legacyRefs : clone(st.lastPerf);
  st.legacySrc = isObj(o.legacySrc) ? o.legacySrc : legacySources(st.historique, st.legacyRefs);
  st.agenda = cleanEvents(o.agenda);
  st.imports = Array.isArray(o.imports) ? o.imports.filter(i => i && i.id).map(i => Object.assign(i, { events: cleanEvents(i.events) })) : [];
  return st;
}
/* Le profil actif devient celui relié à la synchro de l’appareil (quand on l’active depuis ce profil) */
function profileSetOwner(id) {
  if (STORE.mode !== "v2" || !STORE.P || !STORE.P.list.some(x => x.id === id)) return false;
  const P = clone(STORE.P); P.owner = id;
  if (lsSet(lsOf(), LS_PROFILES, JSON.stringify(P)) !== true) return false;
  STORE.P = P; return true;
}

/* ================= D4 (phase 3D) : modifier une séance enregistrée, ajouter une séance faite sans l’appli =================
   Fonctions pures sur un état (aucun accès au stockage) : vérifiées par tests/run.js. L’appli appelle histSave puis commit("p").
   Règles (docs/FORMAT_DONNEES.md, section 4.1) :
   - toute modification met upd = maintenant sur la séance (c’est ce qui départage deux appareils) et la marque ed = 1 ;
   - une séance ajoutée reçoit un identifiant rid(), ts = date et heure choisies, upd = maintenant ;
   - références (rebuildRefs) recalculées pour les exercices touchés (avant et après la modification), palier compté pour une séance ajoutée,
     records (pr) recalculés pour la séance et les suivantes qui contiennent ces exercices ; volume recalculé (D10). */
const HE_MAX = { r: 999, kg: 1000, d: 36000, ex: 40, sets: 30 };
/* Journal saisi → journal propre : séries valides seulement (répétitions ≥ 1 ou durée ≥ 1 s), exercices sans série retirés.
   Un exercice inconnu de cette version (ajouté par une version plus récente, sur un autre appareil) est gardé, sinon modifier
   la séance ici l’effacerait aussi en ligne. */
function histCleanLog(log) {
  const out = [];
  (Array.isArray(log) ? log : []).slice(0, HE_MAX.ex).forEach(l => {
    if (!l || typeof l.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(l.id)) return;
    const sets = [];
    (Array.isArray(l.sets) ? l.sets : []).slice(0, HE_MAX.sets).forEach(s => {
      if (!s) return;
      if (s.d != null && !(s.r > 0)) { const d = Math.round(+s.d || 0); if (d >= 1) sets.push({ d: Math.min(HE_MAX.d, d) }); return; }
      const r = Math.round(+s.r || 0); if (r < 1) return;
      const o = { r: Math.min(HE_MAX.r, r), kg: Math.min(HE_MAX.kg, Math.max(0, Math.round((+s.kg || 0) * 100) / 100)) };
      if (s.rir != null && s.rir !== "" && isFinite(+s.rir)) o.rir = Math.max(0, Math.min(3, Math.round(+s.rir)));
      if (typeof s.t === "number") o.t = s.t;
      if (typeof s.rt === "number") o.rt = s.rt;
      sets.push(o);
    });
    if (!sets.length) return;
    out.push(Object.assign(l.warm ? { warm: 1 } : l.cool ? { cool: 1 } : {}, { id: l.id, sets }, typeof l.b === "number" ? { b: l.b } : {}));
  });
  return out;
}
/* Heure (ms) d’une date AAAA-MM-JJ et d’une heure HH:MM (heure locale) */
function histTs(date, heure) {
  const [y, m, d] = date.split("-").map(Number), hm = /^\d{2}:\d{2}$/.test(heure || "") ? heure.split(":").map(Number) : [12, 0];
  return new Date(y, m - 1, d, hm[0], hm[1]).getTime();
}
/* Records (pr) recalculés pour les exercices ids, dans les séances faites à partir de fromTs (comprise).
   Les records des autres exercices ne bougent pas. Une séance dont les records changent reçoit upd (elle repartira en ligne).
   Renvoie les identifiants des séances modifiées. */
function histRecords(st, ids, fromTs, upd, selfId) {
  const changed = [];
  if (!ids.length) return changed;
  const asc = st.historique.filter(h => h && Array.isArray(h.log)).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  asc.forEach((h, k) => {
    if ((h.ts || 0) < fromTs || !h.log.some(l => l && ids.indexOf(l.id) >= 0)) return;
    const prev = asc.slice(0, k).filter(x => (x.ts || 0) < (h.ts || 0));
    const fresh = findRecords(prev, h.log.filter(l => l && ids.indexOf(l.id) >= 0)).map(r => ({ id: r.id, k: r.k, v: r.v }));
    const pr = (Array.isArray(h.pr) ? h.pr : []).filter(r => r && ids.indexOf(r.id) < 0).concat(fresh);
    if (JSON.stringify(pr) === JSON.stringify(Array.isArray(h.pr) ? h.pr : [])) return;
    if (pr.length) h.pr = pr; else delete h.pr;
    if (upd != null && h.id !== selfId) h.upd = Math.max(upd, (h.upd || 0) + 1);
    changed.push(h.id);
  });
  return changed;
}
/* Références des exercices ids recalculées (rebuildRefs, D3) ; les autres exercices ne bougent pas */
function histRefs(st, ids) {
  if (!ids.length) return;
  const rb = rebuildRefs(st.historique, st.legacyRefs, st.legacySrc);
  ids.forEach(id => { if (rb.lastPerf[id]) st.lastPerf[id] = rb.lastPerf[id]; else delete st.lastPerf[id]; if (rb.refs[id]) st.refs[id] = rb.refs[id]; else delete st.refs[id]; });
}
/* Enregistre la séance saisie e = { id? (absent : séance ajoutée), date, heure?, nom?, kind?, ref?, duree? (s), ressenti?, log }
   dans l’état st (modifié sur place). now = maintenant (ms).
   Renvoie { ok, error?, same?, entry, added, changed: [identifiants des autres séances dont les records ont changé] }. */
function histSave(st, e, now) {
  if (!e || typeof e.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return { ok: false, error: "date" };
  const before = e.id ? st.historique.find(h => h && h.id === e.id) : null;
  if (e.id && !before) return { ok: false, error: "introuvable" };
  if (before && before.c) return { ok: false, error: "resume" };
  const log = histCleanLog(e.log);
  if (!log.some(l => !l.warm && !l.cool)) return { ok: false, error: "vide" };
  const h = before ? clone(before) : { id: rid(), kind: e.kind || "muscu", nom: "Séance" };
  if (!before) { if (e.ref && typeof e.ref === "object") h.ref = clone(e.ref); h.ajout = 1; }
  if (typeof e.nom === "string" && e.nom.trim()) h.nom = e.nom.trim().slice(0, 60);
  const oldTime = before ? new Date(before.ts || histTs(before.date)) : null;
  const heure = e.heure || (oldTime ? String(oldTime.getHours()).padStart(2, "0") + ":" + String(oldTime.getMinutes()).padStart(2, "0") : "");
  if (!before || e.date !== before.date || e.heure) h.ts = histTs(e.date, heure);
  h.date = e.date;
  h.log = log;
  h.sets = log.reduce((n, l) => n + l.sets.length, 0);
  h.volume = Math.round(logVolume(log));
  const duree = e.duree != null ? Math.max(60, Math.min(6 * 3600, Math.round(+e.duree || 0))) : (h.duree || 3600);
  if (!before || duree !== before.duree || !h.kcal) h.kcal = estKcal({ kind: h.kind }, st.profile, duree);
  h.duree = duree;
  h.ressenti = [1, 2, 3, 4].indexOf(+e.ressenti) >= 0 ? +e.ressenti : null;
  /* ce que la personne peut modifier : si rien n’a changé, rien n’est réécrit (pas de upd, rien à renvoyer en ligne) */
  const strip = x => JSON.stringify([x.date, x.ts, x.nom, histCleanLog(x.log), x.duree || 0, [1, 2, 3, 4].indexOf(+x.ressenti) >= 0 ? +x.ressenti : null]);
  if (before && strip(before) === strip(h)) return { ok: true, same: true, entry: before, added: false, changed: [] };
  h.upd = Math.max(now, before ? (before.upd || 0) + 1 : 0);
  if (before) h.ed = 1;
  st.historique = trimHist(st.historique.filter(x => x && x.id !== h.id).concat([h]).sort((a, b) => (b.ts || 0) - (a.ts || 0)));
  const entry = st.historique.find(x => x.id === h.id) || h;
  /* références des exercices touchés, avant et après */
  const ids = [];
  (before ? before.log : []).concat(log).forEach(l => { if (l && l.id && ids.indexOf(l.id) < 0) ids.push(l.id); });
  histRefs(st, ids);
  /* palier : une séance ajoutée compte comme une séance faite (même logique que la synchro, csAddProgress) */
  if (!before) st.profile = csAddProgress(st.historique, st.profile, entry);
  /* records : la séance et les suivantes */
  const changed = histRecords(st, ids, Math.min(entry.ts || 0, before ? (before.ts || 0) : Infinity), h.upd, h.id).filter(id => id !== h.id);
  return { ok: true, entry, added: !before, changed };
}
