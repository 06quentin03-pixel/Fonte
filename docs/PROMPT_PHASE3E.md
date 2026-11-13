# Prompt pour démarrer la phase 3E (à coller dans une nouvelle session Claude Code)

**Avant de lancer cette session** : la phase 3D est fusionnée dans `main` (pull request n° 14). Installe-la et vérifie-la avec `docs/CHECKLIST_PHASE3D.md` (sauvegarde fichier d’abord ; une séance corrigée 600 → 60 kg sur un appareil et vérifiée sur l’autre ; une séance passée ajoutée ; cibles « répétitions en réserve » vues). Les décisions sur les propositions de programmes sont déjà prises (fin de ce message) ; si tu veux en changer une, modifie la liste avant de coller ce prompt.

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte` (renommé `06quentin03-pixel/Fonte` : les deux adresses fonctionnent). Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions, résultats de 3D, points ouverts, prochaine étape. Mets à jour la ligne « Version du code de l’appli » selon ce qui a été fusionné dans `main`.
2. `docs/PLAN_PHASE2.md` — **section 4.3** fiches **U1**, **U2**, **U3**, **U5** ; fiche **S2/S3** (section 4.2) ; section 6 (sessions) ; section 8 (tests, dont 8.3 partie 3E).
3. `docs/PROPOSITIONS_PROGRAMMES.md` — les propositions P1 à P10 et leurs **décisions** (à la fin de ce message). Si la version de `main` n’a pas encore la section « Décisions » (dernier envoi de 3D bloqué par l’accès GitHub), ce message fait foi : recopie les décisions dans le document, dans `PROJECT_STATUS.md` (section « Décisions en attente ») et dans `docs/CHECKLIST_PHASE3D.md` (section 6 faite).
4. `docs/REGLES_SPORTIVES.md` et `docs/FORMAT_DONNEES.md` (section 4.1 : modification d’une séance, D4 ; section 5 : sauvegarde en ligne).
5. `README.md` — fonctionnalités et organisation des fichiers.
6. Pars de `main` (compare la branche locale avec `origin/main`, elle peut être périmée). Travaille sur la branche indiquée par la session (sinon crée `claude/phase-3e-seance-ipad`). Ne modifie jamais `main` directement.

## État actuel (fin de 3D)

- Partie 1 de 3D : charge proposée par zone de répétitions (`refFor`), palier 4 (`s8Load`), modification et ajout de séance (`histSave` dans `engine-user.js`, écran `openHistEdit` dans `app.js`), volume juste (`logVolume`), mention 1RM peu fiable.
- Partie 2 de 3D : cibles de répétitions en réserve (`rirFor`, `setRir` ; champ `rir`/`rirLast` des exercices, `rt` dans les séries enregistrées), progression au poids du corps et gainage (`progressBW`, `histPerfs`), plateau sur moyennes (`plateauInfo`), passage de niveau proposé (`levelSuggest`, `levelAccept`), mode simple « facile / juste / très dur ».
- La photographie des programmes (`tests/fixtures/programmes.json`) a été refaite **une seule fois** en 3D pour S5 ; un test vérifie par une empreinte que, hors cibles de réserve et échec, les programmes sont identiques à ceux de 3C.
- Tests à relancer au début et noter : `node tests/run.js` (143 réussis attendus), `node tests/e2e/run.js` (76 réussis attendus : 38 × iPhone 13 et iPad Pro 11 ; Playwright et Chromium sont déjà installés, `require('playwright')`, ne pas les réinstaller), et si Java est disponible les règles avec l’émulateur (commande dans `README.md`, 9 réussis attendus ; sinon le dire).

## Objectif de la phase 3E

**Partie 1 — séance et iPad** : U1 (tableau des séries de l’exercice en cours : modifier une série déjà faite, en ajouter une ; « Précédent » n’efface plus rien ; réutiliser ce qui a été fait pour D4), U2 (fin de repos signalée au retour dans l’appli, limite iOS expliquée honnêtement), U3 (iPad : mise en page 2 colonnes au-delà de ~900 px, retirer `"orientation": "portrait"` du manifeste), U5 (polices Archivo et Big Shoulders copiées dans le dépôt et mises en cache par `sw.js`, licence OFL jointe).
**Partie 2 — programmes** : appliquer **uniquement** les propositions acceptées (liste à la fin de ce message, détail et raisons dans `docs/PROPOSITIONS_PROGRAMMES.md`, section 2 « Décisions »), vérifier avec `node tools/propositions-programmes.js` qu’elles corrigent bien l’écart visé (chiffres avant/après dans le document), refaire la photographie des programmes et prouver (script de comparaison, comme en 3D) que **seules** les combinaisons concernées ont changé ; mettre à jour l’empreinte du test S5 en le justifiant. Garde-fous : la durée estimée d’une séance ne doit pas augmenter de plus de 10 minutes (sinon, ne pas appliquer cette partie et le signaler) ; lister les profils à 2 objectifs touchés indirectement (par exemple le programme « muscle » à 3 jours utilisé dans une combinaison muscle + autre objectif) ; rappel : les séances débutant sont limitées à 5 exercices, un exercice ajouté peut donc ne pas y apparaître (c’est voulu, P6 refusée). Si un changement accepté se révèle impossible ou contraire à son but une fois mesuré, ne l’applique pas et explique pourquoi.

À respecter :
- la séance en cours (`R`) ne doit jamais perdre une série saisie ; tests navigateur de séance complète avec retours en arrière ;
- toute modification d’une séance enregistrée met `upd = Date.now()` et passe par `histSave` ;
- ne pas changer le format des documents en ligne sans `SCHEMA_VERSION` + `MIGRATIONS` ;
- `sw.js` : changer `VERSION` et ajouter tout nouveau fichier (polices) à `SHELL` (un test le vérifie) ;
- les tests de synchro, de migration et la photographie restent verts (sauf mise à jour justifiée de la photographie en partie 2).

Hors périmètre de 3E : tout programme non validé, les phases 4 et 5.

## Fin de session

1. Lance `node tests/run.js`, `node tests/e2e/run.js` (et les règles si possible) ; note les résultats réels sans rien masquer. Vérifie GitHub Actions après le push (tâches « tests », « navigateur », « regles »).
2. Checklist courte pour le propriétaire (plan 8.3, partie 3E) : sauvegarde fichier d’abord ; une vraie séance avec retours en arrière et correction d’une série ; repos écran allumé puis appli quittée et revenue ; iPad en paysage ; mode avion dès le premier lancement (polices) ; nouvelles séances si des propositions ont été validées.
3. Mets à jour `PROJECT_STATUS.md` et `README.md`, rédige `docs/PROMPT_PHASE4.md`.
4. Commit (un par partie), push sur ta branche. Pas de pull request ni de fusion dans `main` sans accord explicite du propriétaire.
5. Termine en disant clairement que la phase 3E est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA). Ne jamais perdre une donnée déjà enregistrée (ni sur l’appareil, ni en ligne).
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire (plan section 9, `docs/REGLES_SPORTIVES.md`) : chaque règle a sa source.
- Pas de transformation d’architecture sans justification ; pas d’outil de construction.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur).
- Une phase = une session : ne commence jamais la phase 4.

## Décisions sur les propositions de programmes

Le propriétaire a délégué ces choix à Claude à la fin de la phase 3D (« fais ce qui te semble le mieux pour les décisions ») ; raisons détaillées dans `docs/PROPOSITIONS_PROGRAMMES.md`, section 2 « Décisions ».

- **P1 ✅** Prise de muscle, intermédiaire et avancé, 3 jours : Push / Pull / Legs → Haut du corps / Bas du corps / Full body (`haut`, `bas`, `fb-barre` ; semaine B `haut-b`, `bas-b`, `fb-barre-b`).
- **P2 ✅** Prise de muscle, à partir de 4 jours : élévations latérales dans `haut` et `haut-b`, oiseau dans `haut`.
- **P3 ❌** Ne pas retirer d’exercice de jambes.
- **P4 ✅** Haut/Bas 4 jours : un tirage remplacé par un développé dans `haut-b` (par exemple `tirage-serre` → `dc-halteres` ou `pompes` ; `di-halteres` y est déjà).
- **P5 ✅** Prise de muscle : mollets une fois de plus par semaine (`bas` ou `legs`).
- **P6 ❌** Débutant : garder les séances à 5 exercices.
- **P7 ✅** Force 3 et 4 jours : goblet squat dans `force-sdt` ; à 3 jours, développé couché haltères dans `force-squat`.
- **P8 ✅** Perte de poids : dans `metab-haut` / `metab-haut-b`, un exercice de poussée remplacé par un tirage ; dans `hiit-20`, pompes remplacées par superman.
- **P9 ✅** Remise en forme : pont fessier ou leg curl dans `forme-mobi`.
- **P10 ✅** Repères (séries par muscle et par semaine, repère 10) affichés dans « Ce que ton profil change », information seulement.
