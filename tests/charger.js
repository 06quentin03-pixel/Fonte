/* Charge les calculs purs de Fonte dans Node, sans navigateur (utilisé par tests/run.js et les outils).
   Renvoie G : accès à toutes les constantes et fonctions de haut niveau des moteurs (js/engine-*.js). */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
/* Les const/let de haut niveau ne deviennent pas des propriétés du contexte : on les expose explicitement */
const NAMES = ["EX", "EX_BY_ID", "TPL", "TPL_BY_ID", "LOAD", "DB_KG", "KB_KG", "OBJECTIFS", "NIV_KEYS", "HIST_FULL", "HIST_MAX", "echOn", "etirOn",
  "MAJOR_MUSCLES", "LEVEL_UP_PHASES", "PHASE_WEEKS", "HARDER", "PLANS", "WEEK_B", "ZONES", "DEB_GUIDE", "DEB_GUIDE_NOTE", "debGuide", "isGuided", "weekVariant", "zoneList", "groupStations", "stationOf",
  "isAssist", "clone", "LS", "DEF", "DEF_PROFILE", "isObj", "CONV_GAP", "CONV_MARGIN", "BK_SESSIONS", "BK_DAYS", "BK_SNOOZE_DAYS", "nearestOf", "SCHEMA_VERSION", "MIGRATIONS", "STORE_BLOCK",
  "STORE", "LS_PROFILES", "PROFILE_SFX", "REF_ZONES", "countable", "pKey", "rid", "b64e", "b64d", "dayMs", "isQuota", "newProfileId", "LS_BROKEN",
  "CS_TRASH_MS", "CS_LIM_MIN", "CS_LIM_DAY", "CS_SECTIONS", "CS_BATCH", "CS_SEC_MAX", "csSig", "csSeSig", "csParse", "csSameU", "csDel36", "csSeOk", "HE_MAX", "ECH"];

/* Fichiers moteurs, dans l’ordre de chargement de index.html (app.js, l’interface, n’est pas chargé ici) */
const ENGINES = ["js/engine-pedago.js", "js/engine-training.js", "js/engine-analytics.js", "js/engine-user.js", "js/engine-sync.js"];
function engineSource() { return ENGINES.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")); }

function charger(extra) {
  const ctx = vm.createContext(Object.assign({ console, atob, btoa }, extra || {}));
  /* chaque fichier est un script séparé dans le même contexte, comme les <script src> du navigateur */
  engineSource().forEach((src, i) => vm.runInContext(src, ctx, { filename: ENGINES[i] }));
  /* accesseurs : la valeur actuelle est relue à chaque fois (utile pour les « let » qui changent, comme STORE_BLOCK) */
  vm.runInContext("globalThis.__x = {" + NAMES.map(n => "get " + n + "() { return typeof " + n + " === 'undefined' ? undefined : " + n + "; }").join(", ") + "};", ctx);
  return new Proxy({}, { get: (_, k) => (k in ctx.__x ? ctx.__x[k] : ctx[k]), has: (_, k) => k in ctx.__x || k in ctx });
}

module.exports = { charger, engineSource, ENGINES, ROOT };
