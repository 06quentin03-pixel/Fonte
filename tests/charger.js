/* Charge les calculs purs de Fonte dans Node, sans navigateur (utilisé par tests/run.js et les outils).
   Renvoie G : accès à toutes les constantes et fonctions de haut niveau du script « Base d'exercices ». */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
/* Les const/let de haut niveau ne deviennent pas des propriétés du contexte : on les expose explicitement */
const NAMES = ["EX", "EX_BY_ID", "TPL", "TPL_BY_ID", "LOAD", "DB_KG", "KB_KG", "OBJECTIFS", "NIV_KEYS", "HIST_FULL", "HIST_MAX", "echOn", "etirOn",
  "MAJOR_MUSCLES", "LEVEL_UP_PHASES", "PHASE_WEEKS", "HARDER", "PLANS", "WEEK_B", "ZONES", "EASIER", "weekVariant", "zoneList", "groupStations", "stationOf",
  "isAssist", "CONV_GAP", "CONV_MARGIN", "BK_SESSIONS", "BK_DAYS", "BK_SNOOZE_DAYS", "nearestOf"];

/* Code source des calculs purs, tel que chargé par l’appli */
function engineSource() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const data = scripts.find(s => s.indexOf("/* ===== Base d'exercices") === 0);
  if (!data) throw new Error("Script « Base d'exercices » introuvable dans index.html");
  return data;
}

function charger(extra) {
  const ctx = vm.createContext(Object.assign({ console }, extra || {}));
  vm.runInContext(engineSource() + "\n;globalThis.__x = {" + NAMES.map(n => n + ": typeof " + n + " === 'undefined' ? undefined : " + n).join(", ") + "};", ctx);
  return new Proxy({}, { get: (_, k) => (k in ctx.__x ? ctx.__x[k] : ctx[k]), has: (_, k) => k in ctx.__x || k in ctx });
}

module.exports = { charger, engineSource, ROOT };
