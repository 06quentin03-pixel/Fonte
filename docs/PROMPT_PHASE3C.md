# Prompt pour démarrer la phase 3C (à coller dans une nouvelle session Claude Code)

**Avant de lancer cette session** : la phase 3B doit être fusionnée dans `main`, installée, et **vérifiée sur les deux iPhone** avec la checklist `docs/CHECKLIST_PHASE3B.md` (toutes les données présentes après la migration, mode avion OK ; 2ᵉ profil essayé sur l’iPad). Fais aussi une sauvegarde fichier (iCloud Drive) sur chaque iPhone. **Si les données n’ont pas été vérifiées sur les deux iPhone, ne lance pas 3C** : une erreur de migration non vue serait recopiée en ligne sur tous les appareils.

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte` (renommé `06quentin03-pixel/Fonte` : les deux adresses fonctionnent). Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions, résultats de 3B, points ouverts, prochaine étape.
2. `docs/PLAN_PHASE2.md` — **section 3** (Firebase : difficultés, coûts, ce que le propriétaire devra faire), **section 4.1** fiches **D1 / D7 / D9**, section 6 (sessions), section 8 (tests).
3. `docs/FORMAT_DONNEES.md` — format v2 (profils `fonte:profiles`, `fonte:p:<id>`, `upd` par séance, `owner` = profil relié à la synchro de l’appareil), migration, recalcul D3.
4. `README.md` — fonctionnalités et organisation des fichiers.
5. Pars de `main` (compare la branche locale avec `origin/main`, elle peut être périmée). Crée une branche dédiée, par exemple `claude/phase-3c-firebase`. Ne modifie jamais `main` directement.

## État actuel (fin de 3B)

- Format v2 et profils multiples en place (`js/engine-user.js` : `storeOpen`, `storeSave`, `migrate`, `MIGRATIONS[1]`, profils, copie de sécurité, `backupPayload` / `decodeBackup` / `applyBackup`) ; `fonte:v1` conservé comme copie de secours.
- D3 : `rebuildRefs`, `rebuildProgress`, `refStep` dans `js/engine-training.js`.
- Synchro actuelle : agenda partagé Firebase par **connexion anonyme de l’appareil** (`Cloud` dans `app.js`, `fonte:sync` commun), reliée au profil `owner` ; synchro « compte Claude » (`Sync`, mode artifact) pour le profil `owner` seulement.
- Tests à relancer au début et noter : `node tests/run.js` (106 réussis attendus) et `node tests/e2e/run.js` (58 réussis attendus : 29 × iPhone 13 et iPad Pro 11 ; Playwright et Chromium sont déjà installés, `require('playwright')`, ne pas les réinstaller).

## Objectif de la phase 3C : sauvegarde et synchro en ligne des données personnelles (D1, D7, D9)

Suivre les fiches D1/D7/D9 et la section 3 du plan, notamment :
- **un compte e-mail + mot de passe par profil** (création, connexion, mot de passe oublié, déconnexion), **liaison du compte anonyme actuel** (l’agenda partagé continue), une « app » Firebase nommée par profil, clé `fonte:p:<id>:sync` ;
- modèle `users/{uid}` (profil, notes, mesures, réglages, séances perso, `legacyRefs`/`legacySrc`) + `users/{uid}/seances/{id}` (**une séance = un document**, suppression = marque `del` + date, **corbeille 30 jours**), lecture de ce qui a changé seulement (date serveur), fusion, **limiteur d’écritures** ;
- après une synchro qui retire ou modifie des séances : recalcul D3 (`rebuildRefs`, `rebuildProgress`) ;
- nouvelles règles `RULES` (lecture/écriture croisées interdites, compte anonyme refusé sur les données perso, tailles), espace d’agenda réservé aux membres connectés avec un vrai compte ;
- toute donnée reçue passe par `migrate` ; une donnée d’un format plus récent n’est jamais écrasée ; **une erreur de synchro ne doit jamais effacer de données locales** ; l’appli fonctionne entièrement sans réseau ;
- relire la page officielle des tarifs Firebase avant de figer le code (plan 3.2) ; rester sur le plan gratuit Spark.
- Tests : Node avec un faux Firestore (fusion, corbeille, conflits deux appareils, limiteur, format plus récent refusé) ; règles avec l’émulateur Firebase si installable, sinon checklist manuelle documentée (le dire) ; tests navigateur existants verts ; `sw.js` : `VERSION` changée.
- Rappeler au propriétaire ce qu’il devra faire dans la console Firebase (plan 3.3) et que le propriétaire du projet Firebase peut techniquement voir toutes les données (plan 3.1-4).

Un commit par partie. Hors périmètre de 3C : références par zone dans la progression, échec/RIR, édition de séance (3D), toute modification de programme ou de séance type.

## Fin de session

1. Lance `node tests/run.js` et `node tests/e2e/run.js` ; note les résultats réels sans rien masquer. Vérifie GitHub Actions après le push.
2. Checklist courte pour le propriétaire (plan 8.3, partie 3C) : sauvegarde fichier d’abord ; étapes de la console Firebase ; créer un compte par profil ; supprimer l’appli d’un appareil de test, la réinstaller, se connecter, tout revient ; mode avion puis retour du réseau.
3. Mets à jour `PROJECT_STATUS.md` et `README.md`, rédige `docs/PROMPT_PHASE3D.md`.
4. Commit, push sur ta branche. Pas de pull request ni de fusion dans `main` sans accord explicite du propriétaire.
5. Termine en disant clairement que la phase 3C est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA). Ne jamais perdre une donnée déjà enregistrée.
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire (plan section 9).
- Pas de transformation d’architecture sans justification ; pas d’outil de construction.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur).
- Une phase = une session : ne commence jamais la phase 3D.
