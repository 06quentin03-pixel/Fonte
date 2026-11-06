/* Tests des règles Firestore (RULES, js/app.js) avec l’émulateur Firebase : rien n’est envoyé à un vrai projet.
   Outils de test seulement (rien n’est ajouté à l’appli) : firebase-tools (émulateur, Java), @firebase/rules-unit-testing, firebase.
   Lancement (voir README, section Tests) :
     FONTE_REGLES_DEPS=<dossier où ces paquets sont installés> \
       npx --prefix <ce dossier> firebase emulators:exec --only firestore --project demo-fonte "node tests/regles/run.js"
   (ou un émulateur déjà lancé : FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node tests/regles/run.js) */
"use strict";
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const DEPS = process.env.FONTE_REGLES_DEPS ? createRequire(path.join(path.resolve(process.env.FONTE_REGLES_DEPS), "x.js")) : require;
const { initializeTestEnvironment, assertSucceeds, assertFails } = DEPS("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp, setLogLevel } = DEPS("firebase/firestore");
setLogLevel("silent"); /* les refus attendus ne sont pas affichés comme des erreurs */

const app = fs.readFileSync(path.join(__dirname, "..", "..", "js", "app.js"), "utf8");
const RULES = app.match(/const RULES = `([\s\S]*?)`;/)[1];
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

let pass = 0, fail = 0;
async function test(name, fn) {
  try { await fn(); pass++; console.log("  ok  " + name); }
  catch (e) { fail++; console.log("  ÉCHEC  " + name + "\n        " + (e && e.message ? e.message.split("\n")[0] : e)); }
}

(async () => {
  const env = await initializeTestEnvironment({ projectId: "demo-fonte", firestore: { rules: RULES, host, port: Number(port) } });
  const compte = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: "password" }, email: uid + "@exemple.fr" }).firestore();
  const anonyme = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
  const personne = env.unauthenticatedContext().firestore();
  const A = compte("alice"), B = compte("bob"), X = anonyme("anon1");
  const profil = (extra) => Object.assign({ v: 2, app: "fonte", upd: 1, agUpd: 0, u: { profile: 1 }, srv: serverTimestamp(), profile: JSON.stringify({ prenom: "Alice" }), notes: "{}" }, extra || {});
  const seance = (extra) => Object.assign({ v: 2, upd: 1, j: JSON.stringify({ id: "s1", date: "2026-11-01", log: [] }), srv: serverTimestamp() }, extra || {});
  const agenda = (extra) => Object.assign({ v: 1, upd: 1, prenom: "Alice", events: [] }, extra || {});
  console.log("Règles Firestore (émulateur)");

  await test("données perso : le propriétaire (compte e-mail) crée, lit, modifie, supprime son profil et ses séances", async () => {
    await assertSucceeds(setDoc(doc(A, "users/alice"), profil()));
    await assertSucceeds(getDoc(doc(A, "users/alice")));
    await assertSucceeds(setDoc(doc(A, "users/alice/seances/s1"), seance()));
    await assertSucceeds(setDoc(doc(A, "users/alice/seances/s1"), seance({ del: 5, upd: 5 })));
    await assertSucceeds(getDocs(collection(A, "users/alice/seances")));
    await assertSucceeds(deleteDoc(doc(A, "users/alice/seances/s1")));
  });
  await test("lecture et écriture croisées interdites (un compte ne voit ni ne modifie les données d’un autre)", async () => {
    await assertSucceeds(setDoc(doc(A, "users/alice/seances/s2"), seance()));
    await assertFails(getDoc(doc(B, "users/alice")));
    await assertFails(getDocs(collection(B, "users/alice/seances")));
    await assertFails(getDoc(doc(B, "users/alice/seances/s2")));
    await assertFails(setDoc(doc(B, "users/alice"), profil()));
    await assertFails(setDoc(doc(B, "users/alice/seances/s3"), seance()));
    await assertFails(deleteDoc(doc(B, "users/alice/seances/s2")));
    await assertFails(getDocs(collection(B, "users")));
  });
  await test("connexion anonyme refusée sur les données perso (même les siennes) ; sans connexion : tout refusé", async () => {
    await assertFails(setDoc(doc(X, "users/anon1"), profil()));
    await assertFails(getDoc(doc(X, "users/anon1")));
    await assertFails(setDoc(doc(X, "users/anon1/seances/s1"), seance()));
    await assertFails(getDoc(doc(personne, "users/alice")));
    await assertFails(setDoc(doc(personne, "users/alice"), profil()));
  });
  await test("heure du serveur obligatoire (srv), champs inconnus refusés, version entière", async () => {
    await assertFails(setDoc(doc(A, "users/alice"), profil({ srv: 123 })));
    await assertFails(setDoc(doc(A, "users/alice/seances/s4"), seance({ srv: 123 })));
    await assertFails(setDoc(doc(A, "users/alice"), profil({ autre: "x" })));
    await assertFails(setDoc(doc(A, "users/alice/seances/s4"), seance({ autre: 1 })));
    await assertFails(setDoc(doc(A, "users/alice"), profil({ v: "2" })));
    await assertFails(setDoc(doc(A, "users/alice/seances/s4"), { v: 2, upd: 1, srv: serverTimestamp() }), "ni séance ni marque de suppression");
  });
  await test("tailles bornées (séance de plus de 200 000 caractères, profil trop long, identifiant de plus de 40 caractères)", async () => {
    await assertFails(setDoc(doc(A, "users/alice/seances/s5"), seance({ j: "x".repeat(200001) })));
    await assertSucceeds(setDoc(doc(A, "users/alice/seances/s5"), seance({ j: "x".repeat(199000) })));
    await assertFails(setDoc(doc(A, "users/alice"), profil({ profile: "x".repeat(20001) })));
    await assertFails(setDoc(doc(A, "users/alice/seances/" + "a".repeat(41)), seance()));
  });
  await test("agenda partagé : lu par les comptes e-mail, refusé aux connexions anonymes et sans connexion", async () => {
    await assertSucceeds(setDoc(doc(A, "espaces/esp1/agendas/alice"), agenda()));
    await assertSucceeds(getDocs(collection(B, "espaces/esp1/agendas")));
    await assertFails(getDocs(collection(X, "espaces/esp1/agendas")));
    await assertFails(getDocs(collection(personne, "espaces/esp1/agendas")));
  });
  await test("agenda partagé : chacun n’écrit que le sien, 500 séances au plus, prénom de 40 caractères au plus", async () => {
    await assertFails(setDoc(doc(B, "espaces/esp1/agendas/alice"), agenda()));
    await assertFails(deleteDoc(doc(B, "espaces/esp1/agendas/alice")));
    await assertFails(setDoc(doc(A, "espaces/esp1/agendas/alice"), agenda({ events: new Array(501).fill({ date: "2026-11-01" }) })));
    await assertSucceeds(setDoc(doc(A, "espaces/esp1/agendas/alice"), agenda({ events: new Array(500).fill({ date: "2026-11-01" }) })));
    await assertFails(setDoc(doc(A, "espaces/esp1/agendas/alice"), agenda({ prenom: "x".repeat(41) })));
    await assertFails(setDoc(doc(X, "espaces/esp1/agendas/anon1"), agenda()), "anonyme : plus d’écriture");
  });
  await test("ancien agenda anonyme : son appareil peut encore le retirer (passage au compte e-mail)", async () => {
    await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "espaces/esp1/agendas/anon1"), agenda()); });
    await assertFails(deleteDoc(doc(anonyme("anon2"), "espaces/esp1/agendas/anon1")));
    await assertSucceeds(deleteDoc(doc(X, "espaces/esp1/agendas/anon1")));
  });
  await test("tout autre emplacement est refusé", async () => {
    await assertFails(setDoc(doc(A, "autre/x"), { a: 1 }));
    await assertFails(getDoc(doc(A, "autre/x")));
    await assertFails(setDoc(doc(A, "data/users/alice/etat"), { a: 1 }));
  });
  await env.cleanup();
  console.log("\n" + pass + " réussis, " + fail + " en échec");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("ÉCHEC du lancement : " + (e && e.message)); process.exit(1); });
