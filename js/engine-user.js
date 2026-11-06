"use strict";
/* ===== Fonte · moteur « utilisateur » : format des données (version, migrate), lecture de l’état (localStorage), migrations, historique résumé, rappel de sauvegarde, exports (CSV, .ics) =====
   Pour l’instant, l’enregistrement (saveLocal, commit), la copie de sécurité, la sauvegarde fichier et la synchronisation restent dans app.js :
   ils appellent directement l’interface (toast, rendu). Ils rejoindront ce moteur quand ils seront repris (profils en 3B, Firebase en 3C).
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → app.js.
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
    return { id: l.id, n: l.sets.length, sets: keep.map(s => (s.d ? { d: s.d } : { r: s.r, kg: s.kg || 0 })) };
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
const LS = "fonte:v1", LS_RUN = "fonte:run", LS_UI = "fonte:ui";
const DEF_PROFILE = { prenom: "", sexe: "", age: null, taille: null, poids: null, niveau: "debutant", objectif: "forme", objectifs: ["forme"], jours: 3, sansSaut: false, barre: 20 };
/* Profil normalisé : objectifs = liste (le premier est le principal), objectif = le principal (anciennes versions) */
function normProfile(pr) { const p = Object.assign(clone(DEF_PROFILE), pr || {}); if (!pr || !Array.isArray(pr.objectifs)) p.objectifs = [p.objectif]; p.objectifs = objList(p); p.objectif = p.objectifs[0]; return p; }
const DEF = { v: 1, upd: 0, agUpd: 0, profile: DEF_PROFILE, mesSeances: [], historique: [], lastPerf: {}, notes: {}, mesures: [], deload: {}, histDel: {}, histClear: 0, agenda: [], imports: [], partners: {}, hidden: {} };
const isObj = o => !!o && typeof o === "object" && !Array.isArray(o);
/* ================= Version du format et migrations (D8) =================
   SCHEMA_VERSION = version du format que cette appli sait lire et écrire (champ v des données).
   Toute donnée lue (localStorage au démarrage, sauvegarde fichier ou code FONTEDATA1.) passe par migrate(raw) :
   - pas de champ v : premières versions de Fonte, traitées comme la version 1 ;
   - version plus ancienne : MIGRATIONS[n] transforme la version n en n + 1, l’une après l’autre (aucune pour l’instant : 3B ajoutera 1 → 2) ;
   - version plus récente que l’appli (appareil pas encore mis à jour) : refusée, rien n’est transformé ni écrasé.
   migrate ne modifie jamais l’objet reçu. Renvoie { data, from } ou { data: null, from, error: "illisible" | "plus-recent" }. */
const SCHEMA_VERSION = 1;
const MIGRATIONS = {};
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
/* Données présentes mais inutilisables au démarrage : l’appli ne doit jamais les écraser.
   STORE_BLOCK = null (tout va bien) | { reason: "plus-recent", v } (format plus récent : l’écriture de fonte:v1 est bloquée)
   | { reason: "illisible" } (JSON abîmé : une copie brute est gardée dans fonte:v1-illisible avant toute écriture). */
let STORE_BLOCK = null;
const LS_BROKEN = "fonte:v1-illisible";
function loadState() {
  let s = null, raw = null;
  STORE_BLOCK = null;
  try { raw = localStorage.getItem(LS); } catch (e) { raw = null; }
  if (raw != null) {
    try { s = JSON.parse(raw); } catch (e) { s = null; }
    const m = migrate(s);
    if (m.error === "plus-recent") { STORE_BLOCK = { reason: "plus-recent", v: m.from }; s = null; }
    else if (m.error) {
      STORE_BLOCK = { reason: "illisible" };
      try { if (localStorage.getItem(LS_BROKEN) == null) localStorage.setItem(LS_BROKEN, raw); } catch (e) { }
      s = null;
    } else s = m.data;
  }
  const st = Object.assign(clone(DEF), s && typeof s === "object" ? s : {});
  st.profile = normProfile(st.profile);
  ["mesSeances", "historique", "agenda", "imports"].forEach(k => { if (!Array.isArray(st[k])) st[k] = []; });
  if (!st.histDel || typeof st.histDel !== "object" || Array.isArray(st.histDel)) st.histDel = {};
  if (typeof st.histClear !== "number") st.histClear = 0;
  if (!isObj(st.notes)) st.notes = {};
  if (!Array.isArray(st.mesures)) st.mesures = [];
  if (!isObj(st.deload)) st.deload = {};
  return st;
}
