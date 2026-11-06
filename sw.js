/* Fonte : fonctionnement hors ligne.
   L'appli est servie depuis le cache (démarrage immédiat, même sans réseau) et la nouvelle version est téléchargée
   en arrière-plan : si elle a changé, la page affiche « Nouvelle version prête, Recharger ».
   Il n'est donc plus nécessaire de changer VERSION à chaque mise à jour de index.html :
   change-la seulement quand tu modifies ce fichier sw.js ou la liste SHELL.
   Les fichiers js/ sont aussi servis depuis le cache et mis à jour en arrière-plan ; l'avis « Nouvelle version » est donné
   par index.html : pour qu'une modification d'un fichier js/ soit proposée, change aussi VERSION (tout est alors retéléchargé ensemble). */
const VERSION = "fonte-2026-11-06-synchro-comptes";
const EXT = "fonte-ext";
/* Tous les fichiers de l'appli : un fichier manquant ici casserait le fonctionnement hors ligne (vérifié par tests/run.js) */
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./js/engine-pedago.js", "./js/engine-training.js", "./js/engine-analytics.js", "./js/engine-user.js", "./js/engine-sync.js", "./js/app.js"];
let pending = false;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== EXT).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function notify(client) {
  const msg = { type: "fonte-update" };
  if (client) { client.postMessage(msg); return Promise.resolve(); }
  return self.clients.matchAll({ type: "window" }).then(cs => cs.forEach(c => c.postMessage(msg)));
}
/* La page se signale une fois prête : on lui redit s'il y a une nouvelle version en attente */
self.addEventListener("message", e => {
  if (e.data && e.data.type === "fonte-hello" && pending && e.source) notify(e.source);
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Polices Google et bibliothèque Firebase : servies depuis le cache, mises à jour en arrière-plan
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com" || (url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0)) {
    const net = caches.open(EXT).then(c => fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; })).catch(() => null);
    e.waitUntil(net);
    e.respondWith(caches.match(req).then(hit => hit || net.then(r => r || new Response("", { status: 504 }))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  const page = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  // La page qui s'ouvre est servie depuis le cache, qui contient déjà la dernière version téléchargée
  if (req.mode === "navigate") pending = false;
  const key = page ? "./index.html" : req;
  // Appli : réponse immédiate depuis le cache, nouvelle version téléchargée pour le prochain lancement
  const net = caches.open(VERSION).then(c => fetch(page ? new Request(url.href.split("#")[0], { cache: "no-cache", credentials: "same-origin" }) : req).then(r => {
    if (!r.ok) return r;
    if (!page) { c.put(key, r.clone()); return r; }
    const copy = r.clone();
    return Promise.all([c.match(key).then(o => (o ? o.text() : null)), r.clone().text()]).then(([a, b]) => c.put(key, copy).then(() => {
      if (a !== null && a !== b) { pending = true; return notify().then(() => r); }
      return r;
    }));
  })).catch(() => null);
  e.waitUntil(net);
  e.respondWith(caches.match(key, { ignoreSearch: true }).then(hit => hit || net.then(r => r || caches.match("./index.html")).then(r => r || new Response("Hors ligne", { status: 503 }))));
});
