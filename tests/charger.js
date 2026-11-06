/* Charge les calculs purs de Fonte dans Node, sans navigateur (utilisé par tests/run.js et les outils).
   Renvoie G : accès à toutes les constantes et fonctions de haut niveau des moteurs (js/engine-*.js). */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
/* Les const/let de haut niveau ne deviennent pas des propriétés du contexte : on les expose explicitement */
const NAMES = ["EX", "EX_BY_ID", "TPL", "TPL_BY_ID", "LOAD", "DB_KG", "KB_KG", "OBJECTIFS", "NIV_KEYS", "HIST_FULL", "HIST_MAX", "echOn", "etirOn",
  "MAJOR_MUSCLES", "LEVEL_UP_PHASES", "PHASE_WEEKS", "HARDER", "PLANS", "WEEK_B", "ZONES", "EASIER", "weekVariant", "zoneList", "groupStations", "stationOf",
  "isAssist", "clone", "LS", "DEF", "DEF_PROFILE", "isObj", "CONV_GAP", "CONV_MARGIN", "BK_SESSIONS", "BK_DAYS", "BK_SNOOZE_DAYS", "nearestOf", "SCHEMA_VERSION", "MIGRATIONS", "STORE_BLOCK"];

/* Fichiers moteurs, dans l’ordre de chargement de index.html (app.js, l’interface, n’est pas chargé ici) */
const ENGINES = ["js/engine-pedago.js", "js/engine-training.js", "js/engine-analytics.js", "js/engine-user.js"];
function engineSource() { return ENGINES.map(f => fs.readFileSync(path.join(ROOT, f), "utf8")); }

function charger(extra) {
  const ctx = vm.createContext(Object.assign({ console }, extra || {}));
  /* chaque fichier est un script séparé dans le même contexte, comme les <script src> du navigateur */
  engineSource().forEach((src, i) => vm.runInContext(src, ctx, { filename: ENGINES[i] }));
  /* accesseurs : la valeur actuelle est relue à chaque fois (utile pour les « let » qui changent, comme STORE_BLOCK) */
  vm.runInContext("globalThis.__x = {" + NAMES.map(n => "get " + n + "() { return typeof " + n + " === 'undefined' ? undefined : " + n + "; }").join(", ") + "};", ctx);
  return new Proxy({}, { get: (_, k) => (k in ctx.__x ? ctx.__x[k] : ctx[k]), has: (_, k) => k in ctx.__x || k in ctx });
}

module.exports = { charger, engineSource, ENGINES, ROOT };
