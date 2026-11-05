# Prompt pour démarrer la phase 2 (à coller dans une nouvelle session Claude Code)

---

Tu travailles sur **Fonte Muscu**, une application web de musculation en français (PWA installable sur iPhone/iPad, fonctionne hors ligne), dépôt GitHub `06quentin03-pixel/fonte`. Elle est utilisée par deux personnes (le propriétaire, qui n’est pas développeur, et sa copine) et doit pouvoir accueillir d’autres utilisateurs plus tard. Objectif à long terme : une appli de référence, fiable sur le plan sportif et technique, capable de rivaliser avec Hevy, Strong ou Fitness Point.

Tu n’as pas accès aux sessions précédentes : tout le contexte est dans les fichiers du dépôt.

## Ce que tu dois lire d’abord

1. `PROJECT_STATUS.md` — état du projet, décisions, problèmes ouverts.
2. `docs/AUDIT_PHASE1.md` — audit complet de la phase 1 (problèmes numérotés D1–D10, S1–S10, U1–U5, A1–A3, lots A–D, plan en phases, références).
3. `README.md` — fonctionnalités et organisation des fichiers.
4. Le travail de la phase 1 est sur la branche `claude/audit-phase-1` (pars de cette branche, ou de `main` si elle a été fusionnée).

## État actuel

- Phase 1 (audit) terminée. **Aucune ligne de l’appli n’a encore été modifiée.**
- Fichiers de l’appli : `index.html` (tout : styles, base d’exercices et calculs = script « Base d’exercices », animations, application), `sw.js` (service worker, hors ligne), `manifest.webmanifest`, `tests/run.js` (77 tests des calculs, lancés aussi par GitHub Actions).
- Outil d’audit en lecture seule : `node tools/analyse-volume.js` (séries par muscle et par semaine pour chaque programme).
- Vérifications à refaire au début : `node tests/run.js` doit donner 77 réussis, 0 en échec.

## Objectif de la phase 2 : plan d’amélioration détaillé

Ne modifie **aucun fichier de l’appli** pendant cette phase. Tu produis un plan, pas du code.

1. Relis le code aux endroits cités dans l’audit pour confirmer chaque problème (ne pas croire l’audit sur parole ; signale toute erreur de l’audit).
2. Pose au propriétaire les 5 décisions en attente listées dans `PROJECT_STATUS.md`, en expliquant simplement les conséquences de chaque choix (outil AskUserQuestion), et note ses réponses.
3. Rédige `docs/PLAN_PHASE2.md` contenant :
   - la liste précise des corrections (reprendre les numéros D/S/U/A de l’audit), chacune avec : ce qui change pour l’utilisateur, les fichiers et fonctions concernés, le risque, la façon de tester, le critère « terminé » ;
   - les dépendances entre corrections et l’ordre retenu ;
   - le découpage en sessions (3a, 3b, 3c, 3d, 3e, 4, 5 — à ajuster si besoin) avec, pour chacune, une taille réaliste pour une seule session ;
   - la stratégie de migration des données existantes (format `v: 1` dans `localStorage` clé `fonte:v1` ; ne jamais perdre les données déjà enregistrées sur les deux iPhone) ;
   - la stratégie de tests (ce qui sera testé automatiquement, ce que le propriétaire devra vérifier à la main sur iPhone/iPad) ;
   - pour la partie sportive : chaque règle proposée avec sa justification et une source scientifique vérifiée (vérifie les références de la section 7 de l’audit ; si tu ne peux pas vérifier une source, dis-le).
4. Mets à jour `PROJECT_STATUS.md` (phase 2 terminée, décisions prises, prochaine étape).
5. Rédige `docs/PROMPT_PHASE3A.md` : prompt autonome pour la session suivante, sur le même modèle que celui-ci.
6. Enregistre ton travail : commit sur une branche dédiée (par exemple `claude/plan-phase-2`) et push. Ne crée pas de pull request sans accord.
7. Termine en disant clairement que la phase 2 est finie et que tu attends une nouvelle session.

## Contraintes à respecter (valables pour tout le projet)

- Ne jamais détruire ni simplifier une fonctionnalité existante sans accord explicite.
- Préserver les données existantes et le fonctionnement hors ligne (PWA).
- Ne jamais prétendre qu’un test a réussi s’il n’a pas été exécuté ; ne pas masquer les erreurs.
- Pas de règle sportive arbitraire : chaque recommandation doit reposer sur un principe reconnu et une source fiable.
- Pas de transformation d’architecture sans justification ; pas d’outil de construction imposé sans raison.
- Expliquer les décisions importantes avec des mots simples (le propriétaire n’est pas développeur), en gardant la rigueur technique.
- Une phase = une session : ne commence jamais la phase 3.

## Problèmes encore ouverts (résumé, détails dans l’audit)

- 🔴 D1 pas de sauvegarde automatique hors du téléphone ; 🔴 D2 « Ne pas enregistrer » sans confirmation ; 🔴 S1 charge de référence indépendante du nombre de répétitions.
- 🟠 D3/D4 historique non corrigeable ; 🟠 S2/S3 volume déséquilibré et fréquence 1×/semaine ; 🟠 S4 passage de niveau au nombre de séances ; 🟠 U1/U2 saisie linéaire, fin de repos non signalée écran verrouillé.
- 🟡 D5–D8, S5–S8, U3–U4, A1–A2 ; ⚪ D9, D10, S9, S10, U5, A3.

## Critères pour considérer la phase 2 terminée

- `docs/PLAN_PHASE2.md` existe, couvre tous les problèmes 🔴 et 🟠 de l’audit (et dit explicitement lesquels des 🟡/⚪ sont reportés ou abandonnés, et pourquoi).
- Les 5 décisions ont une réponse du propriétaire (ou sont explicitement laissées ouvertes avec une option par défaut).
- Chaque correction a un critère « terminé » vérifiable et une méthode de test.
- `PROJECT_STATUS.md` et `docs/PROMPT_PHASE3A.md` sont à jour, le tout est commité et poussé.
- Aucun fichier de l’appli (`index.html`, `sw.js`, `manifest.webmanifest`, `tests/run.js`) n’a été modifié.
