# Prompt pour démarrer la phase 3A (à coller dans une nouvelle session Claude Code)

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte`. Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions prises, prochaine étape.
2. `docs/PLAN_PHASE2.md` — plan détaillé : fiches des corrections (section 4), ordre (5), sessions (6), migration (7), tests (8), règles sportives (9).
3. `docs/AUDIT_PHASE1.md` — audit d’origine (numéros D/S/U/A).
4. `README.md` — fonctionnalités et organisation des fichiers.
5. Pars de la branche `claude/plan-phase-2` (ou de `main` si elle a été fusionnée ; attention, la branche locale `main` peut être périmée : compare avec `origin/main`). Crée une branche dédiée, par exemple `claude/phase-3a-securite-moteurs`.

## État actuel

- Phases 1 (audit) et 2 (plan) terminées. **Aucune ligne de l’appli n’a encore été modifiée.**
- Fichiers de l’appli : `index.html` (styles, script « Base d’exercices » = données + calculs purs, animations, application), `sw.js`, `manifest.webmanifest`, `tests/run.js` (77 tests, lancés aussi par GitHub Actions).
- Vérification à refaire au début : `node tests/run.js` doit donner 77 réussis, 0 en échec. Note le résultat réel.
- Les 5 décisions du propriétaire sont dans `PROJECT_STATUS.md` (Firebase oui, programmes non modifiés automatiquement, échec prudent en RIR, passage de niveau proposé, profils multiples). Elles ne concernent pas directement 3A, sauf : **ne modifie aucun programme ni séance type**.

## Objectif de la phase 3A : filet de sécurité, puis découpage en moteurs

Cette session regroupe deux étapes (décision du propriétaire du 6 nov. 2026, voir `PROJECT_STATUS.md`). Fais-les **dans cet ordre**, avec **un commit par partie**. Ne modifie aucun programme ni séance type.

### Partie 1 — Filet de sécurité (sans changer le format des données)

Réalise exactement les fiches suivantes de `docs/PLAN_PHASE2.md` section 4, avec leurs critères « terminé » :

1. **D2** — confirmation de « Ne pas enregistrer » + « Annuler » pendant 10 s.
2. **D5** — copie de sécurité locale avant restauration, « Effacer l’historique », « Tout réinitialiser » ; « Revenir à l’état d’avant » ; opération refusée si la copie ne tient pas.
3. **D6** — séance en cours de plus de 12 h : proposer « Enregistrer ce qui a été fait » (à la date de la séance) ou « Supprimer » avec confirmation.
4. **D1-a** — rappel de sauvegarde après 10 séances ou 14 jours, avec « Me le rappeler dans 7 jours ».
5. **S1-a** — garde-fou de charge : si les répétitions visées diffèrent d’au moins 3 de la référence, convertir la charge par le 1RM estimé (Epley, marge de prudence 5 %, arrondi au matériel) au lieu de l’augmenter. Fonction pure dans le script « Base d’exercices », testée dans `tests/run.js` (cas de l’audit : 5×5 à 100 kg → ≈ 82,5 kg pour 10 reps ; et toutes les combinaisons de profils à 2 objectifs).
6. **Tests navigateur** : tests Playwright (Chromium déjà installé dans l’environnement cloud : `require('playwright')`, ne pas le réinstaller) dans `tests/e2e/`, iPhone 13 et iPad simulés, qui chargent l’appli servie en local avec un `localStorage` préparé ; couvrir D2, D5, D6, D1-a, « aucune erreur JavaScript » et le fonctionnement hors ligne (réseau coupé + rechargement). `tests/run.js` doit rester sans dépendance ; ajouter l’étape navigateur à GitHub Actions seulement si elle fonctionne réellement (sinon le dire).
7. **Jeux de données v1 de référence** dans `tests/fixtures/` (vide, profil ancien sans `objectifs`, usage typique, gros historique avec séances résumées, JSON abîmé, sauvegarde `FONTEDATA1.`, séance en cours), inventés et anonymes (jamais de vraies données personnelles). Ils serviront à la migration de 3B.
8. **Mesure** : taille en octets de `fonte:v1` pour un usage typique et pour 3 000 séances ; noter le résultat dans `PROJECT_STATUS.md`.

Commit de la partie 1 avant de commencer la partie 2.

### Partie 2 — Quatre moteurs en fichiers séparés, sans changement de comportement

Fiches **A1 / A3** et **D8 (cadre seulement)** de `docs/PLAN_PHASE2.md` (sections 4.1 et 4.4) :

1. **D’abord** le test « photographie des programmes » (plan section 8.1) : toutes les combinaisons objectif × niveau × jours × palier × semaine A/B, enregistrées dans `tests/fixtures/`, vérifiées par `tests/run.js`. Il doit passer **avant** et **après** le découpage, sans être modifié.
2. Découper `index.html` en `js/engine-pedago.js`, `js/engine-training.js`, `js/engine-analytics.js`, `js/engine-user.js`, `js/app.js`, chargés par de simples `<script src>` dans l’ordre, **sans outil de construction**. Déplacer le code, ne pas le réécrire. Garder `window.FONTE_PWA` et le mode « artifact Claude ».
3. `sw.js` : ajouter tous les nouveaux fichiers à `SHELL`, changer `VERSION`. Vérifier qu’une mise à jour depuis l’ancienne version (cache existant) fonctionne et que l’appli marche hors ligne ensuite.
4. `tools/assemble.js` (facultatif pour l’utilisateur) : recolle les fichiers en un seul `index.html` pour le mode « artifact Claude » ; vérifier que le fichier assemblé s’ouvre sans erreur.
5. `tests/run.js` et `tools/analyse-volume.js` chargent désormais les fichiers moteurs ; mêmes résultats qu’avant (les 77 tests d’origine + les nouveaux).
6. **D8 cadre** : dans `engine-user.js`, `SCHEMA_VERSION = 1` et une fonction `migrate(raw)` par laquelle passent `loadState` et `restoreData` (pour l’instant elle ne transforme rien) ; un format plus récent que l’appli est refusé sans rien écraser ; tests avec les jeux de données de la partie 1.

**Si le temps manque** : arrête-toi à une étape propre (moteurs déjà séparés, tous les tests verts, hors ligne vérifié), commite, et note dans `PROJECT_STATUS.md` ce qui reste ; ce reste passera au début de 3B. Ne laisse jamais un découpage à moitié qui casse l’appli.

Hors périmètre de 3A (ne pas faire) : changement de format / profils (3B), Firebase (3C), toute modification de programme ou de séance type, échec/RIR (3D).

## Fin de session

1. Lance `node tests/run.js` et les tests navigateur ; note les résultats réels (nombre réussis/échoués) sans rien masquer.
2. Rédige pour le propriétaire une courte checklist de vérification à la main sur iPhone (plan section 8.3, partie 3A), y compris : faire une sauvegarde fichier avant la mise à jour, puis vérifier en mode avion après.
3. Mets à jour `PROJECT_STATUS.md` (phase 3A terminée ou partie restante, ce qui a été fait, résultats des tests, mesure de taille, prochaine étape) et le `README.md` (nouvelle organisation des fichiers, fonctionnalités visibles ajoutées).
4. Rédige `docs/PROMPT_PHASE3B.md` : prompt autonome pour la session suivante, sur le même modèle que celui-ci (contenu de 3B : plan sections 4.1 U4/D3, 4.2 S1-b format, 6 et 7 ; rappeler la sauvegarde fichier sur les deux iPhone avant la mise à jour).
5. Commit sur ta branche et push. Ne crée pas de pull request sans accord.
6. Termine en disant clairement que la phase 3A est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA).
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire : chaque recommandation repose sur un principe reconnu et une source fiable (plan section 9).
- Pas de transformation d’architecture sans justification ; pas d’outil de construction imposé sans raison.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur), en gardant la rigueur technique.
- Une phase = une session : ne commence jamais la phase 3B.

## Critères pour considérer la phase 3A terminée

- D2, D5, D6, D1-a et S1-a remplissent leurs critères « terminé » du plan, chacun couvert par au moins un test automatique exécuté.
- Les tests navigateur et les jeux de données de référence existent et ont été lancés.
- Le code est réparti dans les fichiers moteurs, la photographie des programmes est identique avant et après, l’appli fonctionne hors ligne après mise à jour, et `migrate` est en place (ou la partie restante est clairement notée pour 3B).
- Les 77 tests d’origine passent toujours ; aucun programme ni séance type n’a changé.
- `PROJECT_STATUS.md`, `README.md`, la checklist manuelle et `docs/PROMPT_PHASE3B.md` sont à jour ; le tout est commité et poussé.
