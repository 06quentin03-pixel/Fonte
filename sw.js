/* Fonte : fonctionnement hors ligne. Change VERSION à chaque mise à jour de l'appli. */
const VERSION = "fonte-2026-11-04b";
const EXT = "fonte-ext";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== EXT).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
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
  // Appli : réponse immédiate depuis le cache, nouvelle version téléchargée pour le prochain lancement
  const key = req.mode === "navigate" ? "./index.html" : req;
  const net = caches.open(VERSION).then(c => fetch(req).then(r => { if (r.ok) c.put(key, r.clone()); return r; })).catch(() => null);
  e.waitUntil(net);
  e.respondWith(caches.match(key, { ignoreSearch: true }).then(hit => hit || net.then(r => r || caches.match("./index.html")).then(r => r || new Response("Hors ligne", { status: 503 }))));
});
