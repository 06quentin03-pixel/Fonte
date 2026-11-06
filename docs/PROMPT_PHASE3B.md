# Prompt pour démarrer la phase 3B (à coller dans une nouvelle session Claude Code)

**Avant de lancer cette session** : sur **chaque iPhone**, fais une sauvegarde fichier (Profil › Sauvegarder / transférer → Enregistrer dans Fichiers → iCloud Drive), et vérifie que la checklist `docs/CHECKLIST_PHASE3A.md` est passée (appli à jour, mode avion OK).

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte` (GitHub indique qu’il a été renommé `06quentin03-pixel/Fonte` : les deux adresses fonctionnent). Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions prises, résultats de 3A, prochaine étape.
2. `docs/PLAN_PHASE2.md` — fiches U4 et D3 (section 4.1), S1-b (4.2), sessions (6), **migration (7, à suivre à la lettre)**, tests (8).
3. `README.md` — fonctionnalités et organisation des fichiers (moteurs `js/engine-*.js` depuis 3A).
4. `docs/AUDIT_PHASE1.md` si besoin (numéros D/S/U/A).
5. Pars de la branche `claude/phase-3a-securite-moteurs` (ou de `main` si elle a été fusionnée ; la branche locale `main` peut être périmée : compare avec `origin/main`). Crée une branche dédiée, par exemple `claude/phase-3b-format-profils`.

## État actuel (fin de 3A)

- Code réparti en `js/engine-pedago.js`, `js/engine-training.js`, `js/engine-analytics.js`, `js/engine-user.js`, `js/app.js` (simples `<script src>`, déclarations de haut niveau partagées, aucun outil de construction). `tools/assemble.js` recolle un fichier unique pour le mode « artifact Claude ».
- `engine-user.js` contient `SCHEMA_VERSION = 1`, `MIGRATIONS = {}`, `migrate(raw)`, `loadState` (passe par `migrate`, bloque l’écriture si le format est plus récent via `STORE_BLOCK`, garde un JSON abîmé dans `fonte:v1-illisible`). **`saveLocal`, `commit`, la copie de sécurité (D5), `restoreData`, la sauvegarde fichier et la synchro sont encore dans `app.js`** (ils appellent l’interface) : 3B doit déplacer dans `engine-user.js` ce dont la migration et les profils ont besoin, testable en Node.
- Tests à relancer au début et noter : `node tests/run.js` (94 réussis attendus) et `node tests/e2e/run.js` (50 réussis attendus : 25 × iPhone 13 et iPad Pro 11 ; Playwright et Chromium sont déjà installés, `require('playwright')`, ne pas les réinstaller).
- Jeux de données v1 de référence : `tests/fixtures/v1-*.json` (ne pas les régénérer : ce sont les références de la migration). Photographie des programmes : `tests/fixtures/programmes.json` (ne doit pas changer).
- Les 5 décisions du propriétaire sont dans `PROJECT_STATUS.md`. Pour 3B : **profils multiples oui** (indépendants, séparés mais pas secrets, pas de code par défaut) ; **ne modifie aucun programme ni séance type**.

## Objectif de la phase 3B : format v2, profils multiples, migration (une seule fois)

Un commit par partie, dans cet ordre. Si le temps manque, **jamais de migration à moitié** : l’interface « Ajouter un profil » peut glisser au début de 3C, pas la migration.

### Partie 1 — Format v2 et migration v1 → v2 (plan sections 7.2 à 7.4)

1. `MIGRATIONS[1]` dans `engine-user.js`, fonction pure : `fonte:v1` → profil 1 (`fonte:profiles` + `fonte:p:<id>`), avec `refs[id][zone]` (zones force ≤ 6, muscle 7–12, endurance ≥ 13) issues de `lastPerf` (S1-b, format seulement), `legacyRefs` (copie intacte de `lastPerf`), `upd` sur chaque séance ; les nouvelles séances enregistreront la cible `t` dans chaque série. `SCHEMA_VERSION = 2`.
2. Déroulement de la section 7.3 exactement : lire v1 sans le modifier, construire v2 en mémoire, écrire puis **relire et comparer** (nombre de séances, mesures, notes, profil) avant d’écrire `fonte:profiles` ; mémoire pleine → résumer dans la copie puis réessayer, sinon rester en v1 et demander une sauvegarde ; **`fonte:v1` conservé** ; garde anti-retour (v1 modifié après migration → rejouer et fusionner par identifiant de séance) ; format plus récent jamais écrasé.
3. Toute restauration (fichier/code `FONTEDATA1.`, synchro Claude) passe par `migrate` : les anciennes sauvegardes restent restaurables.
4. Tests Node sur **chaque** jeu de données de `tests/fixtures/` : migration, comparaison champ à champ (aucune séance, mesure, note, référence perdue), aller-retour sauvegarde → restauration identique, stockage plein simulé, double lancement (idempotence).
5. `docs/FORMAT_DONNEES.md` : description des formats v1 et v2.

### Partie 2 — Profils multiples (fiche U4)

« Changer de profil » / « Ajouter un profil » (questionnaire d’accueil) en haut du Profil ; données du profil actif dans `fonte:p:<id>` (séance en cours `fonte:p:<id>:run`) ; réglages d’appareil communs (`fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync`) ; changement de profil interdit pendant une séance. Test navigateur d’isolation : 2 profils, une séance dans chacun, rien ne se mélange (historique, records, Mes muscles, lastPerf/refs, palier, agenda perso, copie de sécurité D5, séance en cours).

### Partie 3 — D3 : supprimer une séance recalcule références et palier

`rebuildRefs(historique, legacyRefs)` et `rebuildProgress(historique)` dans `engine-training.js`, appelés par la suppression d’une séance. Test de propriété : supprimer puis recalculer = comme si la séance n’avait jamais existé.

`sw.js` : changer `VERSION` (et `SHELL` si un fichier est ajouté). Les tests navigateur existants doivent rester verts (adapter seulement ce que le nouveau format impose, en le disant).

Hors périmètre de 3B (ne pas faire) : Firebase (3C), usage des références par zone dans la progression (3D), échec/RIR (3D), toute modification de programme ou de séance type.

## Fin de session

1. Lance `node tests/run.js` et `node tests/e2e/run.js` ; note les résultats réels sans rien masquer. Vérifie GitHub Actions après le push.
2. Rédige pour le propriétaire une checklist courte de vérification sur **les deux iPhone** (plan section 8.3, partie 3B) : sauvegarde fichier avant la mise à jour ; après la mise à jour, toutes les données sont là (séances, dernière séance, palier, record) ; mode avion ; création d’un 2ᵉ profil sur l’iPad, une séance dans chaque, rien ne se mélange.
3. Mets à jour `PROJECT_STATUS.md` et `README.md`.
4. Rédige `docs/PROMPT_PHASE3C.md` (Firebase : plan sections 3, 4.1 D1/D7/D9, 6 ; rappeler que 3C ne commence qu’après vérification des données sur les deux iPhone).
5. Commit, push sur ta branche. Pas de pull request sans accord.
6. Termine en disant clairement que la phase 3B est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA). **Objectif absolu de 3B : ne jamais perdre une donnée déjà enregistrée.**
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire (plan section 9).
- Pas de transformation d’architecture sans justification ; pas d’outil de construction.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur).
- Une phase = une session : ne commence jamais la phase 3C.
