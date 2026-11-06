# Fonte Muscu — Suivi du projet

Ce fichier est la mémoire du projet entre les sessions Claude Code. **Chaque session le lit en premier et le met à jour en dernier.**
Règle : une phase = une session. On ne commence jamais la phase suivante dans la même session.

## État actuel

| Phase | Statut | Session / branche | Livrables |
|---|---|---|---|
| 1 — Audit complet | ✅ Terminée le 5 nov. 2026 | `claude/audit-phase-1` | `docs/AUDIT_PHASE1.md`, `tools/analyse-volume.js`, `docs/PROMPT_PHASE2.md` |
| 2 — Plan d’amélioration | ✅ Terminée le 5 nov. 2026 | `claude/plan-phase-2` (part de `claude/audit-phase-1`) | `docs/PLAN_PHASE2.md`, `docs/PROMPT_PHASE3A.md` |
| 3A — Filet de sécurité (D2, D5, D6, D1-a, S1-a, tests navigateur) **puis** moteurs en fichiers séparés (A1, A3, D8 cadre) | ✅ Terminée le 6 nov. 2026 (parties 1 et 2) | `claude/phase-3a-securite-moteurs` (part de `claude/plan-phase-2`) | `js/engine-*.js`, `js/app.js`, `tests/e2e/`, `tests/fixtures/`, `tools/assemble.js`, `docs/CHECKLIST_PHASE3A.md`, `docs/PROMPT_PHASE3B.md` |
| 3B — Format v2 + profils multiples + migration (U4, S1-b format, D3) | ⏳ À faire (nouvelle session) | — | voir `docs/PROMPT_PHASE3B.md` |
| 3C — Sauvegarde/synchro Firebase par compte (D1, D7, D9) | À faire | — | — |
| 3D — Charges et historique (S1-b, S8, D4, D10, S9) **puis** règles sportives (S5, S6, S7, S4, S10) + propositions de programmes (S2/S3, sans application) | À faire | — | — |
| 3E — Expérience de séance, iPad (U1, U2, U3, U5) **puis**, si validé, programmes (S2/S3) | À faire | — | — |
| 4 — Tests complets | À faire | — | — |
| 5 — Validation et documentation | À faire | — | — |

Le détail de chaque session (contenu, taille, critères « terminé », tests) est dans `docs/PLAN_PHASE2.md`, sections 4 à 6.

**6 nov. 2026 — regroupement demandé par le propriétaire** : les 8 sessions prévues (3a à 3h) deviennent 5 (3A à 3E). Correspondance : 3a + 3b → 3A ; 3c → 3B ; 3d → 3C ; 3e + 3f → 3D ; 3g + 3h → 3E. La migration (3B) et Firebase (3C) restent séparées : vérification des données sur les deux iPhone entre les deux. Chaque session regroupée est faite en parties, un commit par partie ; une partie non terminée passe au début de la session suivante et est notée ici.

## Version du code de l’appli

- Version utilisée sur les téléphones : commit `029e2da` sur `main` (tant que la branche 3A n’est pas fusionnée).
- Version de développement : branche `claude/phase-3a-securite-moteurs` (commits `aed42f5` partie 1, `77f5de1` partie 2, puis documentation).
- Attention : dans un clone, la branche locale `main` peut être périmée ; comparer avec `origin/main`. GitHub signale que le dépôt s’appelle désormais `06quentin03-pixel/Fonte` (l’ancienne adresse redirige).

## Phase 3A — résumé (6 nov. 2026)

Tests au début de la session : `node tests/run.js` → **77 réussis, 0 en échec**.

**Partie 1 — filet de sécurité** (sans changement de format) :
- **D2** : « Ne pas enregistrer » (écran de fin) et « Abandonner » (fenêtre Arrêter) demandent « Supprimer cette séance ? X séries seront perdues » dès qu’une série est faite ; bandeau « Séance supprimée — Annuler » 10 s, valable même après rechargement (`fonte:run-trash`).
- **D5** : copie de sécurité exacte de `fonte:v1` (`fonte:undo` + `fonte:undo-info`) avant Restaurer, Effacer l’historique, Tout réinitialiser ; « Revenir à l’état d’avant (date, heure) » dans Profil › Données (l’état remplacé devient à son tour la copie) ; si la copie ne tient pas en mémoire, l’opération est refusée et une sauvegarde fichier est proposée.
- **D6** : une séance commencée il y a plus de 12 h n’est plus ignorée : carte « Séance non terminée » avec « Enregistrer ce qui a été fait » (à la date et l’heure de la séance, historique retrié, référence plus récente jamais écrasée ; fin inconnue → durée prévue de la séance) ou « Supprimer » (confirmation + Annuler).
- **D1-a** : rappel après 10 séances ou 14 jours (au moins une séance depuis) ; jamais sauvegardé → dès 3 séances, comme avant ; « Me le rappeler dans 7 jours ». Fonction pure `backupDueAt`.
- **S1-a** : `convertLoad` (1RM Epley, marge de 5 %, arrondi vers le bas au matériel, minimum du matériel respecté) quand les répétitions visées diffèrent d’au moins 3 de la dernière fois : 5 × 5 à 100 kg → **82,5 kg** pour 10 répétitions (au lieu de 102,5). Utilisée par la charge proposée (`applySuggestions`, création et remplacement d’exercice) et affichée (« charge recalculée … estimation prudente »).
- Jeux de données v1 inventés dans `tests/fixtures/` (vide, ancien sans objectifs, usage typique, 3 000 séances résumées, JSON abîmé, code `FONTEDATA1.`, séance en cours), fabriqués par `tools/make-fixtures.js`. Ce sont des références figées : ne pas les régénérer (seule la date `upd` changerait).

**Partie 2 — moteurs séparés** :
- Photographie des programmes (`tests/fixtures/programmes.json`, 4 500 combinaisons objectif(s) × niveau × jours × palier 1–5 × semaine A/B, 1 098 séances différentes) faite **avant** le découpage ; identique après. Un essai de modification volontaire (puis annulée) a bien fait échouer le test.
- Code **déplacé sans réécriture** (vérifié ligne à ligne) dans `js/engine-pedago.js` (exercices, libellés, LOAD, animations), `js/engine-training.js` (séances types, prescriptions, programmes, planning, progression, superséries, paliers), `js/engine-analytics.js` (courbes, records, muscles, régularité, plateau), `js/engine-user.js` (format, `migrate`, `loadState`, historique résumé, rappel de sauvegarde, exports CSV/.ics), `js/app.js` (interface). `index.html` ne garde que la page et `window.FONTE_PWA = true`.
- **Écart au plan, assumé** : `saveLocal`, `commit`, la copie D5, `restoreData`, la sauvegarde fichier et la synchro (Claude, Firebase) sont restés dans `app.js`, car ils appellent directement l’interface ; les déplacer aurait demandé de les réécrire. Ils rejoindront `engine-user.js` en 3B (migration, profils) et 3C (Firebase).
- **D8 (cadre)** : `SCHEMA_VERSION = 1`, `MIGRATIONS = {}`, `migrate(raw)` ; `loadState` et `restoreData` passent par `migrate`. Format plus récent : refusé, carte « Mets Fonte à jour », aucune écriture de `fonte:v1` (`STORE_BLOCK`). Ajout de sécurité : un `fonte:v1` illisible est copié tel quel dans `fonte:v1-illisible` avant que l’appli ne réécrive (avant, il était perdu au premier enregistrement).
- `sw.js` : fichiers `js/` dans `SHELL`, `VERSION = "fonte-2026-11-06-moteurs"`. Mise à jour depuis l’ancienne version en cache (`029e2da`) puis hors ligne : vérifiées par un test navigateur.
- `tools/assemble.js` : fichier unique pour le mode artifact Claude (`dist/fonte-artifact.html`, ignoré par git) ; s’ouvre sans erreur (test navigateur, modes artifact et PWA).
- `tests/run.js` et `tools/analyse-volume.js` chargent les moteurs via `tests/charger.js` ; sortie de `analyse-volume` identique avant/après.

**Résultats des tests (fin de session, réellement exécutés)** :
- `node tests/run.js` → **94 réussis, 0 en échec** (77 d’origine inchangés sauf le chemin de chargement + 8 en partie 1 + photographie + 6 D8 + 1 SHELL).
- `node tests/e2e/run.js` → **50 réussis, 0 en échec** (25 tests × iPhone 13 et iPad Pro 11 simulés dans Chromium) : D2, D5, D6, D1-a, S1-a, aucune erreur JavaScript sur chaque jeu de données, hors ligne, mise à jour du service worker, fichier assemblé, D8.
- GitHub Actions : tâches « tests » et « navigateur » ; exécutions de la partie 1 (run 45) et de la partie 2 (run 46) **réussies**, tâche « navigateur » comprise (elle fonctionne réellement sur GitHub).
- Non testé (impossible ici) : Safari réel, iPhone/iPad réels → `docs/CHECKLIST_PHASE3A.md`.

**Mesure de la taille de `fonte:v1`** (jeux de données inventés) :
- usage typique, 78 séances (≈ 6 mois à 3 séances/semaine) : **80 641 octets** (≈ 79 Ko) ;
- 3 000 séances (300 détaillées, 2 700 résumées) : **1 914 627 octets** (≈ 1,9 Mo, 1,9 million de caractères).
- Safari compte la limite de `localStorage` (≈ 5 Mo selon les estimations courantes, non mesurée sur vos appareils) en caractères UTF-16, soit environ 2 octets par caractère : 3 000 séances ≈ 3,8 Mo. Conséquences : (1) l’usage réel de 2 personnes reste loin de la limite pendant des années ; (2) avec un très gros historique, la copie de sécurité D5 (qui double la place) ne tiendra pas et l’opération sera **refusée proprement** ; (3) les profils (3B) partagent cette mémoire : à surveiller, IndexedDB reste une option si nécessaire.

**Points ouverts notés pendant 3A** (non corrigés, hors périmètre) :
- Le jeu de données « usage typique » montre le passage de niveau automatique existant (intermédiaire → avancé après 6 paliers) : c’est S4, prévu en 3D.
- Données illisibles au démarrage : le questionnaire d’accueil s’ouvre toujours (comportement d’origine), mais la copie `fonte:v1-illisible` est désormais gardée ; une récupération guidée pourrait être ajoutée en 3B.

## Phase 2 — résumé

- Code relu aux endroits cités par l’audit et exemples rejoués : l’audit est **confirmé**, avec des compléments (section 1 du plan) :
  - S1 touche **161 combinaisons** de profils à 2 objectifs (pas seulement force + muscle) ;
  - D1 : la connexion Firebase **anonyme** actuelle ne permettrait pas de récupérer une sauvegarde en ligne après perte du téléphone → comptes e-mail + mot de passe ;
  - le journal des séances n’enregistre pas les répétitions visées → les références anciennes servent de point de départ au recalcul ;
  - S8 : charge du palier 4 trop **légère** (et non trop lourde) ; « mollets 0–2 » faux pour muscle intermédiaire 4 j ;
  - références : Bell 2023 = Delphi, enquête = Rogerson 2024 ; Pelland paru dans *Sports Medicine* (2026) ; ACSM 2009 remplacée par une position 2026 ; Grgic 2018 plus nuancé que présenté.
- Les applis d’écran d’accueil iOS sont exemptées de l’effacement Safari « 7 jours » : le risque D1 vient surtout de la perte/réinitialisation du téléphone ou de la suppression de l’appli.

## Décisions prises (phase 2, par le propriétaire)

1. **Firebase : oui** — sauvegarde et synchro en ligne, hors ligne et copie locale conservés, sécurité et isolation prioritaires. Mise en œuvre retenue : comptes e-mail + mot de passe (un par profil), compte anonyme actuel relié (l’agenda partagé continue), une séance = un document, corbeille 30 jours, plan gratuit Spark (coût prévu 0 €). À savoir : le propriétaire du projet Firebase peut techniquement voir toutes les données dans la console (plan, section 3.1).
2. **Programmes actuels : aucune modification automatique.** S2/S3 → document de propositions en 3D ; application en 3E uniquement de ce qui est validé ; test « photographie » des programmes pour garantir qu’ils ne changent pas par erreur.
3. **Échec : oui, approche prudente** — plus d’échec pour les débutants (3D) ; cibles de répétitions en réserve selon niveau et type d’exercice (tableau, plan section 9.3).
4. **Passage de niveau : proposé, jamais automatique** — critères : ~6 mois réguliers, progression devenue lente, ≥ 3 paliers ; charges réelles conservées (plus de +45 %).
5. **Profils multiples : oui**, totalement indépendants sur un même appareil ; profils séparés mais pas secrets sur un appareil partagé (pas de code par défaut).

Décisions techniques : 4 moteurs en fichiers séparés sans outil de construction (3A, 2ᵉ partie), avec un script facultatif pour reconstituer le fichier unique « artifact Claude » ; une **seule** migration de format v1 → v2 en 3B ; `fonte:v1` conservé comme copie de secours ; tests navigateur avec Playwright (outil de test uniquement, rien ajouté à l’appli).

## Décisions en attente

Aucune bloquante. À trancher plus tard : validation des propositions de programmes (fin de 3D) ; code de verrouillage des profils (optionnel) ; ouverture à d’autres utilisateurs (page confidentialité, suppression de compte).

## Problèmes ouverts connus

Ceux de `docs/AUDIT_PHASE1.md` section 2, avec les compléments de `docs/PLAN_PHASE2.md` section 1. **Corrigés en 3A** : D2, D5, D6, D1-a (rappel renforcé ; D1 complet en 3C), S1-a (garde-fou ; S1-b en 3B/3D), D8 (cadre), A1/A3. Abandonné : notification de fin de repos écran verrouillé (demande un serveur d’envoi).

## Prochaine étape

1. Passer la checklist `docs/CHECKLIST_PHASE3A.md` : **sauvegarde fichier sur chaque iPhone d’abord**, puis fusion de la branche `claude/phase-3a-securite-moteurs` dans `main` (sur GitHub : Pull requests › New pull request › base `main` ← `claude/phase-3a-securite-moteurs` › Create › Merge), mise à jour sur les iPhone et vérification en mode avion.
2. Refaire une sauvegarde fichier sur chaque iPhone, puis ouvrir une **nouvelle session** Claude Code avec le contenu de `docs/PROMPT_PHASE3B.md`.
