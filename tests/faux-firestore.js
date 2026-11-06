/* Faux Firestore pour tester la synchro en Node (tests/synchro.js), sans réseau ni compte.
   Il imite ce dont js/engine-sync.js a besoin : users/{uid} et users/{uid}/seances/{id}, une heure du serveur (srv) qui avance à
   chaque envoi, des envois groupés atomiques, la vérification « le document du profil n’a pas changé depuis la lecture » (sinon
   erreur « conflit »), et il compte les lectures, écritures et suppressions (comme la facturation Firestore). */
"use strict";
const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));

class FauxFirestore {
  constructor(csSameU, horloge) {
    this.csSameU = csSameU; this.horloge = horloge || (() => 0); /* heure du serveur : suit l’horloge du test, et avance toujours */
    this.t = 1.7e12; this.users = {}; this.se = {};
    this.n = { lectures: 0, ecritures: 0, suppressions: 0 };
    this.panne = null;   /* fonction (étape) → erreur à lancer, ou null */
    this.avant = null;   /* fonction async (uid, ops) appelée avant d’appliquer un envoi (pour simuler un autre appareil qui écrit en même temps) */
    this.journal = [];   /* chaque envoi : { uid, ops: [type] } */
  }
  verifier(etape) { const e = this.panne && this.panne(etape); if (e) throw e; }
  api(uid) {
    const S = this;
    return {
      async getUser() { S.verifier("getUser"); S.n.lectures++; return clone(S.users[uid] || null); },
      async seancesSince(ms) {
        S.verifier("seancesSince");
        const docs = Object.entries(S.se[uid] || {}).filter(([, d]) => d.srv > ms).sort((a, b) => a[1].srv - b[1].srv);
        S.n.lectures += Math.max(1, docs.length); /* une requête sans résultat compte une lecture */
        return docs.map(([id, d]) => ({ id, data: clone(d), srv: d.srv }));
      },
      async commit(ops) {
        S.verifier("commit");
        if (S.avant) await S.avant(uid, ops);
        for (const op of ops) if (op.t === "user") { const cur = S.users[uid]; if (!S.csSameU(cur ? cur.u : null, op.expect)) throw { code: "conflit" }; }
        const t = S.t = Math.max(S.t + 1, S.horloge());
        S.journal.push({ uid, ops: ops.map(o => o.t) });
        for (const op of ops) {
          if (op.t === "se") { (S.se[uid] = S.se[uid] || {})[op.id] = Object.assign(clone(op.data), { srv: t }); S.n.ecritures++; }
          else if (op.t === "user") { S.users[uid] = Object.assign(clone(op.data), { srv: t }); S.n.ecritures++; }
          else if (op.t === "rm") { if (S.se[uid]) delete S.se[uid][op.id]; S.n.suppressions++; }
        }
      }
    };
  }
}
module.exports = { FauxFirestore };
