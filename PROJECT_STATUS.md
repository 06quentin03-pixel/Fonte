# Fonte Muscu — Suivi du projet

Ce fichier est la mémoire du projet entre les sessions Claude Code. **Chaque session le lit en premier et le met à jour en dernier.**
Règle : une phase = une session. On ne commence jamais la phase suivante dans la même session.

## État actuel

| Phase | Statut | Session / branche | Livrables |
|---|---|---|---|
| 1 — Audit complet | ✅ Terminée le 5 nov. 2026 | `claude/audit-phase-1` | `docs/AUDIT_PHASE1.md`, `tools/analyse-volume.js`, `docs/PROMPT_PHASE2.md` |
| 2 — Plan d’amélioration | ✅ Terminée le 5 nov. 2026 | `claude/plan-phase-2` (part de `claude/audit-phase-1`) | `docs/PLAN_PHASE2.md`, `docs/PROMPT_PHASE3A.md` |
| 3A — Filet de sécurité (D2, D5, D6, D1-a, S1-a, tests navigateur) **puis** moteurs en fichiers séparés (A1, A3, D8 cadre) | ⏳ À faire (nouvelle session) | — | voir `docs/PROMPT_PHASE3A.md` |
| 3B — Format v2 + profils multiples + migration (U4, S1-b format, D3) | À faire | — | — |
| 3C — Sauvegarde/synchro Firebase par compte (D1, D7, D9) | À faire | — | — |
| 3D — Charges et historique (S1-b, S8, D4, D10, S9) **puis** règles sportives (S5, S6, S7, S4, S10) + propositions de programmes (S2/S3, sans application) | À faire | — | — |
| 3E — Expérience de séance, iPad (U1, U2, U3, U5) **puis**, si validé, programmes (S2/S3) | À faire | — | — |
| 4 — Tests complets | À faire | — | — |
| 5 — Validation et documentation | À faire | — | — |

Le détail de chaque session (contenu, taille, critères « terminé », tests) est dans `docs/PLAN_PHASE2.md`, sections 4 à 6.

**6 nov. 2026 — regroupement demandé par le propriétaire** : les 8 sessions prévues (3a à 3h) deviennent 5 (3A à 3E). Correspondance : 3a + 3b → 3A ; 3c → 3B ; 3d → 3C ; 3e + 3f → 3D ; 3g + 3h → 3E. La migration (3B) et Firebase (3C) restent séparées : vérification des données sur les deux iPhone entre les deux. Chaque session regroupée est faite en parties, un commit par partie ; une partie non terminée passe au début de la session suivante et est notée ici.

## Version du code de l’appli

- Dernière version de l’appli : commit `029e2da` sur `main` (identique sur `claude/audit-phase-1` et `claude/plan-phase-2`).
- **Aucune ligne de l’appli (`index.html`, `sw.js`, manifeste, `tests/run.js`) n’a encore été modifiée** par ce chantier.
- Tests : `node tests/run.js` → 77 réussis, 0 en échec (relancé le 5 nov. 2026 en phase 2).
- Attention : dans un clone, la branche locale `main` peut être périmée ; comparer avec `origin/main`.

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

Tous ceux de `docs/AUDIT_PHASE1.md` section 2, avec les compléments de `docs/PLAN_PHASE2.md` section 1. Aucun corrigé à ce jour. Abandonné : notification de fin de repos écran verrouillé (demande un serveur d’envoi).

## Prochaine étape

Faire une sauvegarde fichier (Profil › Sauvegarder → iCloud Drive) sur chaque iPhone, puis ouvrir une **nouvelle session** Claude Code et lui donner le contenu de `docs/PROMPT_PHASE3A.md`.
