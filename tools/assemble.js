/* Recolle Fonte en un seul fichier HTML autonome : node tools/assemble.js [sortie] [--pwa]
   Outil facultatif (aucune étape de construction n'est nécessaire pour GitHub Pages, qui sert index.html et js/ tels quels).
   Usage principal : le mode « artifact Claude », qui demande un fichier unique. Par défaut la ligne window.FONTE_PWA = true est retirée
   (l'appli passe alors en mode artifact et synchronise via le compte Claude) ; --pwa la garde.
   Sortie par défaut : dist/fonte-artifact.html (dossier ignoré par git). */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
function assemble(opts) {
  opts = opts || {};
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  let n = 0;
  html = html.replace(/<script src="(js\/[^"]+\.js)"><\/script>/g, (m, src) => {
    const code = fs.readFileSync(path.join(ROOT, src), "utf8");
    if (/<\/script/i.test(code)) throw new Error(src + " contient « </script » : impossible de l'intégrer tel quel");
    n++;
    return "<script>" + code + "</script>";
  });
  if (!n) throw new Error("aucun <script src=\"js/…\"> trouvé dans index.html");
  if (!opts.pwa) {
    const before = html.length;
    html = html.replace("<script>window.FONTE_PWA = true;</script>\n", "").replace("<script>window.FONTE_PWA = true;</script>", "");
    if (html.length === before) throw new Error("ligne window.FONTE_PWA introuvable");
  }
  return { html, scripts: n };
}
module.exports = { assemble };

if (require.main === module) {
  const args = process.argv.slice(2), pwa = args.indexOf("--pwa") >= 0, out = args.find(a => a[0] !== "-") || path.join(ROOT, "dist", "fonte-artifact.html");
  const r = assemble({ pwa });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, r.html);
  console.log(r.scripts + " fichiers js intégrés → " + out + " (" + fs.statSync(out).size + " octets, mode " + (pwa ? "PWA" : "artifact Claude") + ")");
}
