/* Tests de la sauvegarde et synchro en ligne (phase 3C, js/engine-sync.js) avec un faux Firestore (tests/faux-firestore.js).
   Appelé par tests/run.js. Chaque « appareil » a son état (comme S dans l’appli) et son état de synchro (fonte:p:<id>:sync). */
"use strict";
const assert = require("assert");
const { FauxFirestore } = require("./faux-firestore");

module.exports = function (atest, G, same) {
  const clone = o => JSON.parse(JSON.stringify(o));
  const T = { now: Date.UTC(2026, 10, 1, 12) };
  const jour = 864e5;
  let N = 0;
  const iso = ts => new Date(ts).toISOString().slice(0, 10);
  /* séance de musculation : squat à kg, développé couché à kg/2 */
  function seance(ts, kg, o) {
    const sets = k => [0, 1, 2].map(() => ({ r: 8, kg: k, t: 8 }));
    return Object.assign({ id: "s" + (++N) + "t", date: iso(ts), ts, upd: ts, nom: "Full body", kind: "muscu", duree: 3000, volume: 0, sets: 6, ressenti: 2,
      log: [{ id: "squat-barre", sets: sets(kg) }, { id: "dc-barre", sets: sets(kg / 2) }] }, o || {});
  }
  const PROFIL = { prenom: "Quentin", sexe: "H", age: 30, taille: 180, poids: 80, niveau: "intermediaire", objectif: "muscle", objectifs: ["muscle"], jours: 3, barre: 20, onb: 1, phase: 1, phaseDone: 0, phaseStart: "2026-10-01", phases: [] };
  class Appareil {
    constructor(srv, uid, st) {
      this.srv = srv; this.uid = uid; this.api = srv.api(uid);
      this.st = G.normState(st ? clone(st) : { profile: clone(PROFIL) });
      this.meta = G.csMeta({ uid }); this.reps = [];
    }
    enregistrer(h) { /* comme saveRunHistory : historique, références (refStep), palier */
      const st = this.st; st.historique.unshift(clone(h)); st.historique.sort((a, b) => b.ts - a.ts);
      G.refStep(st.lastPerf, st.refs, st.historique.find(x => x.id === h.id));
      if (G.countable(h)) G.tickApply(st.profile, G.progressTick(st.profile), h.date);
      st.upd = T.now; return h;
    }
    supprimer(id) { /* comme « Supprimer de l’historique » : histDel, corbeille, D3 */
      const st = this.st, gone = st.historique.find(h => h.id === id);
      st.historique = st.historique.filter(h => h.id !== id); st.histDel[id] = T.now; G.csTrashAdd(st, gone, T.now);
      const rb = G.rebuildRefs(st.historique, st.legacyRefs, st.legacySrc);
      gone.log.forEach(l => { if (rb.lastPerf[l.id]) st.lastPerf[l.id] = rb.lastPerf[l.id]; else delete st.lastPerf[l.id]; if (rb.refs[l.id]) st.refs[l.id] = rb.refs[l.id]; else delete st.refs[l.id]; });
      st.profile = G.rebuildProgress(st.historique, st.profile, gone); st.upd = T.now;
    }
    async sync() {
      const r = await G.csRun({ api: this.api, meta: this.meta, now: () => T.now, getState: () => this.st, setState: (s, rep) => { this.st = s; this.reps.push(rep); }, saveMeta: m => { this.meta = G.csMeta(m); } });
      this.last = r; return r;
    }
  }
  const ids = a => a.st.historique.map(h => h.id).sort().join(",");
  const pal = a => [a.st.profile.phase, a.st.profile.phaseDone, a.st.profile.niveau].join("|");
  const nouveau = () => new FauxFirestore(G.csSameU, () => T.now);

  atest("synchro : premier envoi (une séance = un document, profil ensuite), puis rien n’est réécrit ni relu inutilement", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    for (let i = 0; i < 5; i++) A.enregistrer(seance(T.now - (10 - i) * jour, 60 + i * 2.5));
    A.st.notes = { "squat-barre": "pieds écartés" }; A.st.mesures = [{ id: "m1", date: "2026-10-20", poids: 80 }];
    const r = await A.sync();
    assert.strictEqual(r.status, "ok"); assert.strictEqual(r.pending, 0);
    assert.strictEqual(Object.keys(srv.se.uA).length, 5, "5 documents de séance"); assert.ok(srv.users.uA, "document du profil");
    assert.strictEqual(srv.n.ecritures, 6);
    same(srv.journal.map(j => j.ops.join("+")), ["se+se+se+se+se", "user"], "séances d’abord, profil ensuite, envoyé seul");
    const avant = Object.assign({}, srv.n), st = JSON.stringify(A.st);
    await A.sync(); T.now += 60000; await A.sync();
    assert.strictEqual(srv.n.ecritures, avant.ecritures, "aucune écriture sans changement");
    assert.ok(srv.n.lectures - avant.lectures <= 2 + 5 + 2, "lectures : le profil, ses propres séances relues une fois, puis plus rien (" + (srv.n.lectures - avant.lectures) + ")");
    assert.strictEqual(JSON.stringify(A.st), st, "état local inchangé");
    T.now += 10 * 60000; const l0 = srv.n.lectures; await A.sync();
    assert.strictEqual(srv.n.lectures - l0, 2, "plus tard : 1 lecture du profil + 1 pour la requête vide");
  });

  atest("synchro : appareil réinstallé (vide) → historique, profil, palier, notes, mesures, agenda, références : tout revient", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    for (let i = 0; i < 8; i++) A.enregistrer(seance(T.now - (20 - i) * jour, 60 + i * 2.5));
    Object.assign(A.st, { notes: { "squat-barre": "siège 3" }, mesures: [{ id: "m1", date: "2026-10-20", poids: 80 }], mesSeances: [{ id: "my1", nom: "Ma séance", items: [{ id: "squat-barre", series: 3, reps: 8 }] }],
      agenda: [{ id: "e1", date: "2026-11-10", heure: "18:00", titre: "Jambes", note: "", fait: false, ref: null }], deload: { at: "2026-10-01" }, legacyRefs: {}, legacySrc: {} });
    A.st.agUpd = T.now;
    await A.sync();
    const B = new Appareil(srv, "uA", { profile: {} }); /* questionnaire pas encore rempli, comme après une réinstallation */
    const r = await B.sync();
    assert.strictEqual(r.status, "ok");
    assert.strictEqual(ids(B), ids(A)); assert.strictEqual(pal(B), pal(A), "palier");
    same(B.st.profile, A.st.profile, "profil"); same(B.st.notes, A.st.notes); same(B.st.mesures, A.st.mesures); same(B.st.mesSeances, A.st.mesSeances);
    same(B.st.agenda, A.st.agenda); same(B.st.deload, A.st.deload);
    same(B.st.lastPerf, A.st.lastPerf, "références recalculées = références de l’appareil d’origine"); same(B.st.refs, A.st.refs);
    same(B.st.historique, A.st.historique, "séances identiques");
    assert.strictEqual(srv.n.ecritures, 9, "l’appareil réinstallé n’a rien renvoyé");
  });

  atest("synchro : téléphone neuf dont le questionnaire a déjà été rempli → le profil en ligne (palier, réglages) l’emporte", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); for (let i = 0; i < 3; i++) A.enregistrer(seance(T.now - (9 - i) * jour, 60));
    await A.sync();
    T.now += 5000;
    const B = new Appareil(srv, "uA", { profile: { prenom: "Q", sexe: "H", age: 31, poids: 82, niveau: "debutant", objectif: "forme", onb: 1, phase: 1, phaseDone: 0 } }); B.st.upd = T.now;
    await B.sync();
    assert.strictEqual(pal(B), pal(A)); same(B.st.profile, A.st.profile);
  });

  atest("synchro : deux appareils hors ligne ajoutent chacun une séance → les deux gardent les deux, palier compté une fois chacune", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    A.enregistrer(seance(T.now - 5 * jour, 60)); await A.sync();
    const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    assert.strictEqual(pal(B), "1|1|intermediaire");
    A.enregistrer(seance(T.now - 2 * jour, 62.5)); T.now += 1000; B.enregistrer(seance(T.now - 1 * jour, 65));
    await A.sync(); T.now += 1000; await B.sync(); await A.sync();
    assert.strictEqual(A.st.historique.length, 3); assert.strictEqual(ids(A), ids(B));
    assert.strictEqual(pal(A), "1|3|intermediaire", "A : 3 séances au palier"); assert.strictEqual(pal(B), pal(A), "B identique");
    same(A.st.lastPerf["squat-barre"].sets[0].kg, 65, "référence = séance la plus récente (faite sur B)"); same(B.st.lastPerf, A.st.lastPerf);
    /* et ça ne bouge plus */
    const w = srv.n.ecritures; await A.sync(); await B.sync(); assert.strictEqual(srv.n.ecritures, w);
    assert.strictEqual(pal(A), "1|3|intermediaire"); assert.strictEqual(pal(B), "1|3|intermediaire");
  });

  atest("synchro : suppression propagée → corbeille 30 jours, références et palier recalculés (D3) sur l’autre appareil", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    A.enregistrer(seance(T.now - 6 * jour, 60)); A.enregistrer(seance(T.now - 4 * jour, 62.5)); const faute = A.enregistrer(seance(T.now - 2 * jour, 600));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    assert.strictEqual(B.st.lastPerf["squat-barre"].sets[0].kg, 600);
    A.supprimer(faute.id); await A.sync(); await B.sync();
    assert.ok(!B.st.historique.some(h => h.id === faute.id), "supprimée sur B");
    assert.strictEqual(B.st.lastPerf["squat-barre"].sets[0].kg, 62.5, "référence revenue à la séance précédente");
    assert.strictEqual(pal(B), "1|2|intermediaire"); assert.strictEqual(pal(A), pal(B));
    assert.ok(B.st.corbeille.some(c => c.id === faute.id), "dans la corbeille de B"); assert.ok(A.st.corbeille.some(c => c.id === faute.id));
    assert.ok(srv.se.uA[faute.id].del && srv.se.uA[faute.id].j, "en ligne : marque del + séance gardée (restaurable)");
  });

  atest("synchro : remettre une séance de la corbeille → elle revient aussi sur l’autre appareil", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    const s1 = A.enregistrer(seance(T.now - 6 * jour, 60)); A.enregistrer(seance(T.now - 4 * jour, 62.5));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    A.supprimer(s1.id); T.now += 1000; await A.sync(); await B.sync();
    assert.strictEqual(B.st.historique.length, 1);
    T.now += 1000;
    const h = G.csTrashRestore(B.st, s1.id, T.now); assert.ok(h);
    B.st.profile = G.csAddProgress(B.st.historique, B.st.profile, h); B.st.upd = T.now;
    await B.sync(); await A.sync();
    assert.strictEqual(A.st.historique.length, 2, "revenue sur A"); assert.ok(!A.st.histDel[s1.id] && !B.st.histDel[s1.id]);
    assert.ok(!A.st.corbeille.some(c => c.id === s1.id), "plus dans la corbeille de A");
    assert.strictEqual(pal(A), "1|2|intermediaire"); assert.strictEqual(pal(B), pal(A));
  });

  atest("synchro : après 30 jours, la séance supprimée est effacée définitivement en ligne et quitte la corbeille", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    const s1 = A.enregistrer(seance(T.now - 6 * jour, 60)); A.enregistrer(seance(T.now - 4 * jour, 62.5));
    await A.sync(); A.supprimer(s1.id); await A.sync();
    T.now += 29 * jour; await A.sync();
    assert.ok(srv.se.uA[s1.id], "29 jours : encore là"); assert.strictEqual(A.st.corbeille.length, 1);
    T.now += 2 * jour; await A.sync();
    assert.ok(!srv.se.uA[s1.id], "31 jours : effacée en ligne"); assert.strictEqual(A.st.corbeille.length, 0, "corbeille vidée");
    assert.strictEqual(srv.n.suppressions, 1);
    /* un appareil resté hors ligne qui avait encore la séance l’apprend par la liste des suppressions */
    const C = new Appareil(srv, "uA", { profile: {} }); C.st.historique = [clone(s1)]; C.meta.seen[s1.id] = G.csSeSig(C.st.historique[0]); C.meta.ru = {};
    await C.sync(); assert.ok(!C.st.historique.some(h => h.id === s1.id), "retirée aussi sur l’appareil resté hors ligne");
  });

  atest("synchro : la même séance modifiée sur deux appareils → la version la plus récente gagne partout", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); const s1 = A.enregistrer(seance(T.now - 3 * jour, 60));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    T.now += 1000; Object.assign(A.st.historique[0], { ressenti: 1, upd: T.now });
    T.now += 1000; Object.assign(B.st.historique[0], { ressenti: 4, upd: T.now });
    await A.sync(); await B.sync(); await A.sync();
    assert.strictEqual(A.st.historique[0].ressenti, 4); assert.strictEqual(B.st.historique[0].ressenti, 4);
    assert.strictEqual(A.st.historique[0].id, s1.id);
  });

  atest("synchro : deux appareils envoient leur profil au même moment → l’envoi vérifie, recommence, aucun changement perdu", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); A.enregistrer(seance(T.now - 3 * jour, 60));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    A.st.notes = Object.assign({}, A.st.notes, { "squat-barre": "siège 3" }); A.st.mesures = [{ id: "mA", date: "2026-10-30", poids: 79 }]; A.st.upd = T.now;
    B.st.notes = Object.assign({}, B.st.notes, { "dc-barre": "prise large" }); B.st.mesures = [{ id: "mB", date: "2026-10-31", poids: 78.5 }]; B.st.upd = T.now + 1;
    let fait = false;
    srv.avant = async (uid, ops) => { if (!fait && ops.some(o => o.t === "user")) { fait = true; srv.avant = null; await B.sync(); } }; /* B écrit pendant l’envoi de A */
    const r = await A.sync();
    assert.strictEqual(r.status, "ok", "A a recommencé et réussi");
    await B.sync();
    for (const X of [A, B]) {
      same(Object.keys(X.st.notes).sort(), ["dc-barre", "squat-barre"], "notes des deux appareils");
      same(X.st.mesures.map(m => m.id), ["mA", "mB"], "mesures des deux appareils");
    }
  });

  atest("synchro : limiteur — une boucle qui modifie 3 000 fois ne dépasse jamais 60 écritures par minute ni 1 500 par jour", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); A.enregistrer(seance(T.now - 3 * jour, 60));
    const parMinute = {};
    srv.avant = async (uid, ops) => { const k = Math.floor(T.now / 6e4); parMinute[k] = (parMinute[k] || 0) + ops.length; };
    const debut = srv.n.ecritures; let limite = false;
    T.now = Date.UTC(2026, 10, 2, 0, 0, 5);
    for (let i = 0; i < 3000; i++) { A.st.profile.poids = 70 + (i % 7) / 10; A.st.upd = T.now; const r = await A.sync(); if (r.status === "limite") limite = true; T.now += 1000; }
    assert.ok(srv.n.ecritures - debut <= G.CS_LIM_DAY, "au plus " + G.CS_LIM_DAY + " écritures le même jour (" + (srv.n.ecritures - debut) + ")");
    assert.ok(Object.values(parMinute).every(n => n <= G.CS_LIM_MIN), "au plus " + G.CS_LIM_MIN + " par minute");
    assert.ok(limite, "état « limite » signalé");
    T.now = Date.UTC(2026, 10, 3, 0, 0, 5); const r = await A.sync();
    assert.strictEqual(r.status, "ok", "le lendemain, la synchro reprend"); assert.strictEqual(JSON.parse(srv.users.uA.profile).poids, A.st.profile.poids);
  });

  atest("synchro : premier envoi de 500 séances étalé par le limiteur ; le profil en ligne ne part qu’après toutes ses séances", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    for (let i = 0; i < 500; i++) A.enregistrer(seance(T.now - (600 - i) * jour, 40 + (i % 20)));
    let minutes = 0, r;
    do { r = await A.sync(); T.now += 61000; minutes++;
      if (srv.users.uA) assert.strictEqual(Object.keys(srv.se.uA).length, 500, "profil en ligne avant toutes les séances");
    } while (r.status !== "ok" && minutes < 30);
    assert.strictEqual(r.status, "ok"); assert.ok(minutes >= 9, "étalé sur " + minutes + " minutes");
    const B = new Appareil(srv, "uA", { profile: {} }); await B.sync(); assert.strictEqual(pal(B), pal(A)); assert.strictEqual(B.st.historique.length, 500);
  });

  atest("synchro : format plus récent en ligne (profil ou séance) → rien n’est fusionné ni écrasé, données locales intactes", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); A.enregistrer(seance(T.now - 3 * jour, 60)); await A.sync();
    const enLigne = JSON.stringify(srv.users.uA);
    srv.users.uA.v = G.SCHEMA_VERSION + 1; const v3 = JSON.stringify(srv.users.uA);
    A.st.notes = { x: "local" }; A.st.upd = T.now; const avant = JSON.stringify(A.st);
    let r = await A.sync();
    assert.strictEqual(r.status, "plus-recent"); assert.strictEqual(JSON.stringify(A.st), avant, "local intact");
    assert.strictEqual(JSON.stringify(srv.users.uA), v3, "document plus récent jamais écrasé"); assert.ok(enLigne);
    srv.users.uA.v = G.SCHEMA_VERSION; /* une séance en v3 */
    srv.se.uA.s3 = { v: G.SCHEMA_VERSION + 1, upd: T.now, j: "{}", srv: ++srv.t }; const se3 = JSON.stringify(srv.se.uA.s3);
    r = await A.sync();
    assert.strictEqual(r.status, "plus-recent"); assert.strictEqual(JSON.stringify(srv.se.uA.s3), se3, "séance plus récente jamais écrasée");
    assert.strictEqual(JSON.stringify(A.st), avant, "local intact");
  });

  atest("synchro : panne à chaque étape (lecture, envoi, envoi à moitié) → aucune donnée locale retirée, tout repart ensuite sans doublon", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA");
    for (let i = 0; i < 150; i++) A.enregistrer(seance(T.now - (200 - i) * jour, 50));
    for (const etape of ["getUser", "seancesSince", "commit"]) {
      srv.panne = e => (e === etape ? { code: "unavailable" } : null);
      const avant = JSON.stringify(A.st), r = await A.sync();
      assert.strictEqual(r.status, "erreur", etape); assert.strictEqual(JSON.stringify(A.st), avant, "état local identique après une panne à l’étape " + etape);
      assert.ok(r.pending > 0, "changements en attente signalés");
    }
    srv.panne = null;
    let r = await A.sync(); assert.strictEqual(r.status, "limite", "60 séances envoyées (limite de la minute)");
    T.now += 61000; srv.panne = e => (e === "commit" ? { code: "unavailable" } : null); /* l’envoi suivant échoue en cours de route */
    r = await A.sync(); assert.strictEqual(r.status, "erreur");
    assert.strictEqual(Object.keys(srv.se.uA).length, 60, "seul le 1er envoi groupé est en ligne"); assert.ok(!srv.users.uA, "pas de profil en ligne tant que des séances manquent");
    srv.panne = null;
    for (let k = 0; k < 6 && (r = await A.sync()).status !== "ok"; k++) T.now += 61000;
    assert.strictEqual(r.status, "ok"); assert.strictEqual(Object.keys(srv.se.uA).length, 150, "150 séances en ligne, aucune en double");
    assert.strictEqual(A.st.historique.length, 150);
  });

  atest("synchro : une séance résumée sur un appareil n’écrase pas le détail en ligne", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); const s1 = A.enregistrer(seance(T.now - 3 * jour, 60)); await A.sync();
    const detail = srv.se.uA[s1.id].j;
    A.st.historique = A.st.historique.map(G.compactEntry); assert.strictEqual(A.st.historique[0].c, 1);
    const w = srv.n.ecritures; await A.sync();
    assert.strictEqual(srv.n.ecritures, w, "rien de renvoyé"); assert.strictEqual(srv.se.uA[s1.id].j, detail, "détail gardé en ligne");
    const B = new Appareil(srv, "uA", { profile: {} }); await B.sync(); assert.ok(!B.st.historique[0].c, "un nouvel appareil reçoit le détail");
  });

  atest("synchro : « Effacer l’historique » sur un appareil → l’autre le suit (copie de sécurité demandée), palier inchangé", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); for (let i = 0; i < 4; i++) A.enregistrer(seance(T.now - (9 - i) * jour, 60));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    T.now += 1000; Object.assign(A.st, { historique: [], lastPerf: {}, refs: {}, legacyRefs: {}, legacySrc: {}, histDel: {}, histClear: T.now }); A.st.upd = T.now;
    await A.sync(); await B.sync();
    assert.strictEqual(B.st.historique.length, 0); same(B.st.lastPerf, {}); assert.ok(B.reps.some(r => r.snapshot), "copie de sécurité demandée avant");
    assert.strictEqual(pal(B), pal(A)); assert.strictEqual(pal(B), "1|4|intermediaire");
    const C = new Appareil(srv, "uA", { profile: {} }); await C.sync(); assert.strictEqual(C.st.historique.length, 0, "un nouvel appareil ne récupère pas les séances effacées");
  });

  atest("synchro : deux appareils qui avaient chacun leurs séances reliés au même compte → union, rien n’est perdu, palier = toutes les séances", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"), B = new Appareil(srv, "uA");
    for (let i = 0; i < 3; i++) A.enregistrer(seance(T.now - (20 - i) * jour, 60));
    for (let i = 0; i < 2; i++) B.enregistrer(seance(T.now - (10 - i) * jour, 70));
    A.st.mesures = [{ id: "mA", date: "2026-10-01", poids: 80 }]; B.st.mesures = [{ id: "mB", date: "2026-10-02", poids: 79 }]; B.st.upd = T.now + 5;
    await A.sync(); await B.sync(); await A.sync();
    assert.strictEqual(A.st.historique.length, 5); assert.strictEqual(ids(A), ids(B));
    same(A.st.mesures.map(m => m.id), ["mA", "mB"]); same(B.st.mesures.map(m => m.id), ["mA", "mB"]);
    assert.strictEqual(pal(A), "1|5|intermediaire"); assert.strictEqual(pal(B), pal(A));
  });

  atest("synchro : séance reçue abîmée ignorée ; séance reçue d’un ancien format passée par migrate", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); A.enregistrer(seance(T.now - 3 * jour, 60)); await A.sync();
    srv.se.uA.casse = { v: 2, upd: T.now, j: "{pas du json", srv: ++srv.t };
    const ancienne = seance(T.now - 2 * jour, 61); delete ancienne.upd; ancienne.id = "v1x";
    srv.se.uA.v1x = { v: 1, j: JSON.stringify(ancienne), srv: ++srv.t };
    const B = new Appareil(srv, "uA", { profile: {} }); const r = await B.sync();
    assert.strictEqual(r.status, "ok"); assert.strictEqual(B.reps[0].bad, 1, "1 document ignoré");
    const h = B.st.historique.find(x => x.id === "v1x"); assert.ok(h, "séance v1 reçue"); assert.strictEqual(h.upd, ancienne.ts, "upd ajouté par migrate");
    assert.ok(srv.se.uA.casse, "le document abîmé n’est pas effacé");
  });

  atest("synchro : « Revenir à l’état d’avant » après une suppression ou un effacement reçus → les séances reviennent partout", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"); for (let i = 0; i < 4; i++) A.enregistrer(seance(T.now - (9 - i) * jour, 60 + i));
    await A.sync(); const B = new Appareil(srv, "uA", { profile: {} }); await B.sync();
    const copie = clone(B.st); /* copie de sécurité faite par l’appli avant d’appliquer la synchro */
    T.now += 1000; A.supprimer(A.st.historique[0].id); T.now += 1000;
    Object.assign(A.st, { historique: [], lastPerf: {}, refs: {}, histClear: T.now }); A.st.upd = T.now; await A.sync();
    await B.sync(); assert.strictEqual(B.st.historique.length, 0);
    T.now += 1000; const actuel = B.st; B.st = G.normState(copie); assert.strictEqual(G.csRevive(B.st, actuel, T.now), 4);
    await B.sync(); await A.sync();
    assert.strictEqual(B.st.historique.length, 4, "revenues sur B"); assert.strictEqual(A.st.historique.length, 4, "revenues sur A");
    const C = new Appareil(srv, "uA", { profile: {} }); await C.sync(); assert.strictEqual(C.st.historique.length, 4, "et sur un nouvel appareil");
  });

  atest("synchro : les données d’un compte ne sont jamais envoyées dans celui d’un autre (faux serveur par compte)", async () => {
    const srv = nouveau(), A = new Appareil(srv, "uA"), C = new Appareil(srv, "uC");
    A.enregistrer(seance(T.now - 3 * jour, 60)); C.enregistrer(seance(T.now - 2 * jour, 40));
    await A.sync(); await C.sync(); await A.sync();
    assert.strictEqual(A.st.historique.length, 1); assert.strictEqual(C.st.historique.length, 1);
    assert.strictEqual(Object.keys(srv.se.uA).length, 1); assert.strictEqual(Object.keys(srv.se.uC).length, 1);
  });
};
