# Prompt pour démarrer la phase 3D (à coller dans une nouvelle session Claude Code)

**Avant de lancer cette session** : la phase 3C doit être fusionnée dans `main`, installée, et **vérifiée** avec la checklist `docs/CHECKLIST_PHASE3C.md` (console Firebase réglée, un compte par profil, « Sauvegardé en ligne » sur chaque iPhone, réinstallation d’un appareil de test réussie, mode avion OK). Fais une sauvegarde fichier (iCloud Drive) sur chaque iPhone. **Si la sauvegarde en ligne n’a pas été vérifiée, ne lance pas 3D** : la phase 3D modifie des séances enregistrées, et ces modifications partent en ligne sur tous les appareils.

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte` (renommé `06quentin03-pixel/Fonte` : les deux adresses fonctionnent). Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions, résultats de 3C, points ouverts, prochaine étape. Mets à jour la ligne « Version du code de l’appli » selon ce qui a été fusionné dans `main`.
2. `docs/PLAN_PHASE2.md` — **section 4.1** fiches **D4**, **D10** ; **section 4.2** fiches **S1-b** (usage), **S8**, **S9**, puis **S5**, **S6**, **S7**, **S4**, **S10**, **S2/S3** (propositions seulement) ; **section 9** (règles sportives et sources) ; section 6 (sessions) ; section 8 (tests).
3. `docs/FORMAT_DONNEES.md` — format v2 (références par zone `refs`, `legacyRefs`/`legacySrc`, cible `t` par série), recalcul D3, et **section 5 : sauvegarde en ligne** (une séance = un document, empreintes, `upd`, corbeille).
4. `README.md` — fonctionnalités et organisation des fichiers.
5. Pars de `main` (compare la branche locale avec `origin/main`, elle peut être périmée). Travaille sur la branche indiquée par la session (sinon crée `claude/phase-3d-charges-regles`). Ne modifie jamais `main` directement.

## État actuel (fin de 3C)

- Sauvegarde et synchro en ligne par compte e-mail (un par profil) : `js/engine-sync.js` (sans Firebase : `csMerge`, `csPlan`, `csRun`, corbeille `csTrashAdd`/`csTrashRestore`, `csAddProgress`, `csRevive`, limiteur) et `Acct` dans `js/app.js` (Firebase). Règles `RULES` dans `js/app.js`, testées par `tests/regles/run.js` (émulateur).
- D3 : `rebuildRefs`, `rebuildProgress`, `refStep` dans `js/engine-training.js` ; ils servent aussi après une synchro.
- Tests à relancer au début et noter : `node tests/run.js` (127 réussis attendus), `node tests/e2e/run.js` (66 réussis attendus : 33 × iPhone 13 et iPad Pro 11 ; Playwright et Chromium sont déjà installés, `require('playwright')`, ne pas les réinstaller), et si Java est disponible les règles avec l’émulateur (commande dans `README.md`, 9 réussis attendus ; sinon le dire).

## Objectif de la phase 3D

**Partie 1 — charges et historique** : S1-b (usage des références par zone dans la charge proposée), S8 (charge du palier 4), D4 (modifier une séance enregistrée, ajouter une séance faite sans l’appli), D10 (volume juste), S9 (mention 1RM peu fiable au-delà de 10 répétitions).
**Partie 2 — règles sportives** : S5 (échec remplacé par une cible de répétitions en réserve, décision 3), S6, S7, S4 (passage de niveau proposé, jamais automatique, décision 4), S10 ; `docs/REGLES_SPORTIVES.md` ; `docs/PROPOSITIONS_PROGRAMMES.md` (S2/S3 : **propositions seulement**, aucune modification de programme ; la photographie des programmes doit rester identique, sauf S5 si elle touche la prescription, justifié et documenté).

À respecter avec la sauvegarde en ligne :
- **toute modification d’une séance enregistrée (D4) met `upd = Date.now()` sur la séance** (c’est la date qui départage deux appareils) ; une séance ajoutée à la main reçoit un identifiant `rid()`, `ts` = date choisie, `upd` = maintenant ;
- après une modification : `rebuildRefs` (exercices touchés, avant et après), `rebuildProgress`/`csAddProgress` si le palier est concerné, `findRecords` recalculés, puis `commit("p")` (la synchro part seule) ;
- ne pas changer le format des documents en ligne sans passer par `SCHEMA_VERSION` + `MIGRATIONS` (et alors : un appareil pas encore à jour refuse les données et n’écrase rien — à tester) ;
- vérifier que les tests de synchro restent verts et en ajouter un pour « séance modifiée sur un appareil → modifiée sur l’autre, références recalculées ».

Hors périmètre de 3D : U1, U2, U3, U5 et l’application des propositions de programmes (3E), toute modification de programme ou de séance type non validée par le propriétaire.

## Fin de session

1. Lance `node tests/run.js`, `node tests/e2e/run.js` (et les règles si possible) ; note les résultats réels sans rien masquer. Vérifie GitHub Actions après le push (tâches « tests », « navigateur », « regles »).
2. Checklist courte pour le propriétaire (plan 8.3, partie 3D) : sauvegarde fichier d’abord ; corriger une séance (600 → 60 kg) et vérifier charge proposée, courbe et records, sur les deux appareils ; ajouter une séance passée ; cibles « répétitions en réserve » ; lire et valider (ou non) les propositions de programmes.
3. Mets à jour `PROJECT_STATUS.md` et `README.md`, rédige `docs/PROMPT_PHASE3E.md`.
4. Commit (un par partie), push sur ta branche. Pas de pull request ni de fusion dans `main` sans accord explicite du propriétaire.
5. Termine en disant clairement que la phase 3D est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA). Ne jamais perdre une donnée déjà enregistrée (ni sur l’appareil, ni en ligne).
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire (plan section 9) : chaque règle a sa source.
- Pas de transformation d’architecture sans justification ; pas d’outil de construction.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur).
- Une phase = une session : ne commence jamais la phase 3E.
