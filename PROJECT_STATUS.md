# Fonte Muscu — Suivi du projet

Ce fichier est la mémoire du projet entre les sessions Claude Code. **Chaque session le lit en premier et le met à jour en dernier.**
Règle : une phase = une session. On ne commence jamais la phase suivante dans la même session.

## État actuel

| Phase | Statut | Session / branche | Livrables |
|---|---|---|---|
| 1 — Audit complet | ✅ Terminée le 5 nov. 2026 | `claude/audit-phase-1` | `docs/AUDIT_PHASE1.md`, `tools/analyse-volume.js`, `docs/PROMPT_PHASE2.md` |
| 2 — Plan d’amélioration | ⏳ À faire (nouvelle session) | — | `docs/PLAN_PHASE2.md` attendu |
| 3a — Sécurité des données | À faire | — | — |
| 3b — Séparation des 4 moteurs | À faire | — | — |
| 3c — Références de charge + correction de l’historique | À faire | — | — |
| 3d — Rééquilibrage sportif | À faire | — | — |
| 3e — Expérience de séance, iPad | À faire | — | — |
| 4 — Tests complets | À faire | — | — |
| 5 — Validation et documentation | À faire | — | — |

## Version du code de l’appli

- Dernière version de l’appli auditée : commit `029e2da` sur `main`.
- **Aucune ligne de l’appli (`index.html`, `sw.js`, manifeste, tests) n’a encore été modifiée** par ce chantier.
- Tests existants : `node tests/run.js` → 77 réussis, 0 en échec (5 nov. 2026).

## Phase 1 — résumé

Ce qui a été fait : lecture complète du code, calcul du volume hebdomadaire de tous les programmes (`node tools/analyse-volume.js`), exemples chiffrés de progression, essai de l’appli dans un iPhone et un iPad simulés (aucune erreur JavaScript, reprise de séance après rechargement OK).

Problèmes majeurs (détail et preuves dans `docs/AUDIT_PHASE1.md`) :
- 🔴 D1 Historique/profil/performances jamais copiés hors du téléphone (Firebase ne synchronise que l’agenda).
- 🔴 D2 « Ne pas enregistrer » efface la séance en un toucher.
- 🔴 S1 Charge de référence mémorisée par exercice sans tenir compte des répétitions (ex. 5×5 à 100 kg → 102,5 kg proposés pour 10 répétitions).
- 🟠 D3/D4 Erreurs de saisie impossibles à corriger, suppression qui ne recalcule pas les références.
- 🟠 S2/S3 Volume déséquilibré (fessiers 27–33 séries/sem contre pecs 8–10 ; dos 3 séries/sem en perte de poids) et muscles travaillés 1×/semaine dans plusieurs programmes.
- 🟠 S4 Passage de niveau au seul nombre de séances.
- 🟠 U1/U2 Saisie strictement linéaire ; fin de repos non signalée écran verrouillé.

## Décisions techniques prises

- Phase 1 : aucun changement de code (demandé).
- Architecture cible proposée (à valider en phase 2) : 4 moteurs en fichiers séparés **sans outil de construction**, chargés dans l’ordre et mis en cache par le service worker ; pas de réécriture de l’interface.

## Décisions en attente de l’utilisateur

1. Sauvegarde automatique en ligne des données personnelles via Firebase ?
2. Modifier les programmes existants (fréquence 2×/semaine, rééquilibrage) ?
3. Échec musculaire retiré pour les débutants ?
4. Passage de niveau automatique ou seulement proposé ?
5. Plusieurs profils sur un même appareil ?

## Problèmes ouverts connus

Tous ceux listés dans `docs/AUDIT_PHASE1.md`, section 2. Aucun corrigé à ce jour.

## Prochaine étape

Ouvrir une **nouvelle session** Claude Code et lui donner le contenu de `docs/PROMPT_PHASE2.md`.
