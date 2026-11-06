/* Faux Firebase pour les tests navigateur (phase 3C) : remplace la bibliothèque officielle (www.gstatic.com/firebasejs/…) par une
   imitation qui garde les comptes et les documents dans le programme de test (Node). Plusieurs « téléphones » simulés (contextes du
   navigateur) partagent le même faux serveur : on peut créer un compte sur l’un et retrouver ses données sur l’autre.
   Seul ce dont Fonte se sert est imité (connexion anonyme et e-mail, liaison, documents, requêtes par heure du serveur, envois groupés,
   transactions, écoute de l’agenda). Les règles de sécurité ne sont pas appliquées ici : elles sont testées avec le vrai émulateur
   (tests/regles/run.js). Rien n’est envoyé sur internet. */
"use strict";

/* ---------- Côté Node : le faux serveur ---------- */
class FauxServeur {
  constructor() { this.comptes = {}; this.anon = 0; this.docs = {}; this.t = Date.now() * 1000; this.n = { ecritures: 0, lectures: 0 }; this.resets = []; }
  heure() { this.t = Math.max(this.t + 1, Date.now() * 1000); return { __ts: [Math.floor(this.t / 1e6), (this.t % 1e6) * 1000] }; }
  enc(v, ts) { if (Array.isArray(v)) return v.map(x => this.enc(x, ts)); if (v && typeof v === "object") { if (v.__srv) return ts; const o = {}; Object.keys(v).forEach(k => { o[k] = this.enc(v[k], ts); }); return o; } return v; }
  micro(v) { return v && v.__ts ? v.__ts[0] * 1e6 + Math.floor(v.__ts[1] / 1000) : 0; }
  ecrire(path, data) { this.docs[path] = this.enc(data, this.heure()); this.n.ecritures++; }
  appel(op, a) {
    switch (op) {
      case "anon": return { uid: "anon" + (++this.anon) };
      case "create": if (this.comptes[a.email]) return { error: "auth/email-already-in-use" }; if ((a.pw || "").length < 6) return { error: "auth/weak-password" };
        this.comptes[a.email] = { pw: a.pw, uid: "u" + Object.keys(this.comptes).length + "x" }; return { uid: this.comptes[a.email].uid };
      case "login": { const c = this.comptes[a.email]; return c && c.pw === a.pw ? { uid: c.uid } : { error: "auth/invalid-credential" }; }
      case "link": if (this.comptes[a.email]) return { error: "auth/email-already-in-use" }; this.comptes[a.email] = { pw: a.pw, uid: a.uid }; return { uid: a.uid };
      case "reset": this.resets.push(a.email); return {};
      case "get": this.n.lectures++; return this.docs[a.path] ? { exists: true, data: this.docs[a.path] } : { exists: false };
      case "set": this.ecrire(a.path, a.data); return {};
      case "del": delete this.docs[a.path]; return {};
      case "batch": { const ts = this.heure(); a.ops.forEach(o => { if (o.set) { this.docs[o.path] = this.enc(o.data, ts); this.n.ecritures++; } else delete this.docs[o.path]; }); return {}; }
      case "query": {
        const pre = a.path + "/";
        let list = Object.keys(this.docs).filter(p => p.startsWith(pre) && p.slice(pre.length).indexOf("/") < 0).map(p => ({ id: p.slice(pre.length), data: this.docs[p] }));
        if (a.after != null) list = list.filter(d => this.micro(d.data.srv) > a.after);
        if (a.order) list.sort((x, y) => this.micro(x.data.srv) - this.micro(y.data.srv));
        if (a.startAfter) { const i = list.findIndex(d => d.id === a.startAfter); if (i >= 0) list = list.slice(i + 1); }
        if (a.limit) list = list.slice(0, a.limit);
        this.n.lectures += Math.max(1, list.length);
        return { docs: list };
      }
    }
    return { error: "inconnu" };
  }
  seances(uid) { const pre = "users/" + uid + "/seances/"; return Object.keys(this.docs).filter(p => p.startsWith(pre)).map(p => Object.assign({ id: p.slice(pre.length) }, this.docs[p])); }
}

/* ---------- Côté page : la fausse bibliothèque (compat, comme firebase-*-compat.js) ---------- */
const PAGE = `(function () {
  if (window.firebase && window.firebase.__faux) return;
  var call = function (op, a) { return window.__fauxFirebase(op, a || {}); };
  var off = function () { return navigator.onLine === false; };
  var err = function (c) { var e = new Error(c); e.code = c; return e; };
  function Timestamp(s, n) { this.seconds = s; this.nanoseconds = n; }
  var dec = function (v) { if (Array.isArray(v)) return v.map(dec); if (v && typeof v === "object") { if (v.__ts) return new Timestamp(v.__ts[0], v.__ts[1]); var o = {}; Object.keys(v).forEach(function (k) { o[k] = dec(v[k]); }); return o; } return v; };
  var enc = function (v) { if (Array.isArray(v)) return v.map(enc); if (v instanceof Timestamp) return { __ts: [v.seconds, v.nanoseconds] }; if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { if (v[k] !== undefined) o[k] = enc(v[k]); }); return o; } return v; };
  var apps = [];
  function App(cfg, name) { this.name = name; this.options = cfg; }
  App.prototype.auth = function () { return this._auth || (this._auth = new Auth(this)); };
  App.prototype.firestore = function () { return this._db || (this._db = new Db(this)); };
  App.prototype.delete = function () { var i = apps.indexOf(this); if (i >= 0) apps.splice(i, 1); return Promise.resolve(); };
  function Auth(app) { this.key = "__faux:auth:" + app.name; var s = null; try { s = JSON.parse(localStorage.getItem(this.key)); } catch (e) { } this._set(s, true); }
  Auth.prototype._set = function (u, quiet) {
    var self = this;
    if (!quiet) { try { if (u) localStorage.setItem(this.key, JSON.stringify(u)); else localStorage.removeItem(this.key); } catch (e) { } }
    this.currentUser = !u ? null : { uid: u.uid, email: u.email || null, isAnonymous: !!u.anon,
      linkWithCredential: function (c) { if (off()) return Promise.reject(err("auth/network-request-failed")); return call("link", { uid: u.uid, email: c.email, pw: c.pw }).then(function (r) { if (r.error) throw err(r.error); self._set({ uid: u.uid, email: c.email }); return { user: self.currentUser }; }); } };
  };
  Auth.prototype.onAuthStateChanged = function (cb) { var u = this.currentUser; setTimeout(function () { cb(u); }, 0); return function () { }; };
  Auth.prototype._sign = function (op, a, anon) { var self = this; if (off()) return Promise.reject(err("auth/network-request-failed")); return call(op, a).then(function (r) { if (r.error) throw err(r.error); self._set(anon ? { uid: r.uid, anon: 1 } : { uid: r.uid, email: a.email }); return { user: self.currentUser }; }); };
  Auth.prototype.signInAnonymously = function () { return this._sign("anon", {}, true); };
  Auth.prototype.createUserWithEmailAndPassword = function (e, p) { return this._sign("create", { email: e, pw: p }); };
  Auth.prototype.signInWithEmailAndPassword = function (e, p) { return this._sign("login", { email: e, pw: p }); };
  Auth.prototype.sendPasswordResetEmail = function (e) { if (off()) return Promise.reject(err("auth/network-request-failed")); return call("reset", { email: e }).then(function () { }); };
  Auth.prototype.signOut = function () { this._set(null); return Promise.resolve(); };
  function Snap(id, data, exists) { this.id = id; this.exists = exists; this._d = data; this.metadata = { fromCache: false, hasPendingWrites: false }; }
  Snap.prototype.data = function () { return this.exists ? dec(this._d) : undefined; };
  Snap.prototype.get = function (f) { var d = this.data(); return d ? d[f] : undefined; };
  function Db(app) { this.app = app; this.subs = []; }
  Db.prototype.enablePersistence = function () { return Promise.resolve(); };
  Db.prototype.doc = function (p) { return new Ref(this, p); };
  Db.prototype.collection = function (p) { return new Col(this, p); };
  Db.prototype._changed = function (p) { var c = p.slice(0, p.lastIndexOf("/")); this.subs.forEach(function (s) { if (s.path === c) s.fire(); }); };
  Db.prototype.batch = function () {
    var db = this, ops = [];
    return { set: function (r, d) { ops.push({ set: 1, path: r.path, data: enc(d) }); }, delete: function (r) { ops.push({ path: r.path }); },
      commit: function () { if (off()) return Promise.reject(err("unavailable")); return call("batch", { ops: ops }).then(function () { ops.forEach(function (o) { db._changed(o.path); }); }); } };
  };
  Db.prototype.runTransaction = function (fn) {
    var db = this, w = [];
    if (off()) return Promise.reject(err("unavailable"));
    return Promise.resolve(fn({ get: function (r) { return r.get(); }, set: function (r, d) { w.push([r, d]); } })).then(function () { return Promise.all(w.map(function (x) { return x[0].set(x[1]); })); });
  };
  function Ref(db, p) { this.db = db; this.path = p; this.id = p.slice(p.lastIndexOf("/") + 1); }
  Ref.prototype.collection = function (n) { return new Col(this.db, this.path + "/" + n); };
  Ref.prototype.get = function () { var self = this; if (off()) return Promise.reject(err("unavailable")); return call("get", { path: this.path }).then(function (r) { return new Snap(self.id, r.data, r.exists); }); };
  Ref.prototype.set = function (d) { var self = this; if (off()) return Promise.reject(err("unavailable")); return call("set", { path: this.path, data: enc(d) }).then(function () { self.db._changed(self.path); }); };
  Ref.prototype.delete = function () { var self = this; if (off()) return Promise.reject(err("unavailable")); return call("del", { path: this.path }).then(function () { self.db._changed(self.path); }); };
  function Col(db, p, q) { this.db = db; this.path = p; this.q = q || {}; }
  Col.prototype.doc = function (id) { return new Ref(this.db, this.path + "/" + id); };
  Col.prototype._with = function (o) { var q = {}; Object.keys(this.q).forEach(function (k) { q[k] = this.q[k]; }, this); Object.keys(o).forEach(function (k) { q[k] = o[k]; }); return new Col(this.db, this.path, q); };
  Col.prototype.where = function (f, op, v) { return this._with({ after: v.seconds * 1e6 + Math.floor(v.nanoseconds / 1000) }); };
  Col.prototype.orderBy = function () { return this._with({ order: 1 }); };
  Col.prototype.limit = function (n) { return this._with({ limit: n }); };
  Col.prototype.startAfter = function (s) { return this._with({ startAfter: s.id }); };
  Col.prototype.get = function () {
    var self = this; if (off()) return Promise.reject(err("unavailable"));
    return call("query", { path: this.path, after: this.q.after, order: this.q.order, limit: this.q.limit, startAfter: this.q.startAfter }).then(function (r) {
      return { docs: r.docs.map(function (d) { return new Snap(d.id, d.data, true); }), metadata: { fromCache: false, hasPendingWrites: false } };
    });
  };
  Col.prototype.onSnapshot = function (opts, cb, onErr) {
    var self = this, sub = { path: this.path, live: true };
    sub.fire = function () { if (!sub.live) return; self.get().then(function (qs) { if (sub.live) cb(qs); }, function (e) { if (sub.live && onErr) onErr(e); }); };
    this.db.subs.push(sub); setTimeout(sub.fire, 0);
    return function () { sub.live = false; };
  };
  window.firebase = { __faux: true, apps: apps,
    initializeApp: function (cfg, name) { var a = new App(cfg, name || "[DEFAULT]"); apps.push(a); return a; },
    auth: { EmailAuthProvider: { credential: function (e, p) { return { email: e, pw: p }; } } },
    firestore: { Timestamp: Timestamp, FieldValue: { serverTimestamp: function () { return { __srv: 1 }; } } } };
})();`;

/* Branche le faux Firebase sur un contexte du navigateur (à appeler avant l’ouverture de la page) */
async function installer(ctx, serveur) {
  await ctx.exposeBinding("__fauxFirebase", (src, op, a) => serveur.appel(op, a));
  await ctx.route(/www\.gstatic\.com\/firebasejs\//, r => r.fulfill({ status: 200, contentType: "text/javascript", body: /firebase-app-compat\.js/.test(r.request().url()) ? PAGE : "/* faux : tout est dans firebase-app-compat.js */" }));
}
const CFG = { apiKey: "faux-cle", authDomain: "demo-fonte.firebaseapp.com", projectId: "demo-fonte", appId: "1:1:web:1" };
const invitation = space => "FONTESYNC1." + Buffer.from(JSON.stringify({ c: CFG, s: space })).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

module.exports = { FauxServeur, installer, CFG, invitation };
