# Fonte Muscu — Audit complet (phase 1)

Date : 5 novembre 2026 · Version auditée : commit `029e2da` (branche `main`)
Périmètre : `index.html` (5 598 lignes, 563 Ko), `sw.js`, `manifest.webmanifest`, `tests/run.js`, CI GitHub.
Règle de la phase : **aucun fichier existant n’a été modifié**. Quatre fichiers ont été ajoutés : ce rapport, `PROJECT_STATUS.md`, `docs/PROMPT_PHASE2.md` et un petit outil d’analyse en lecture seule (`tools/analyse-volume.js`).

---

## 0. Comment l’audit a été fait (ce qui a réellement été exécuté)

| Vérification | Résultat |
|---|---|
| Lecture du code : données, prescriptions, programmes, progression, paliers, historique, sauvegarde, synchro, lecteur de séance, démarrage, service worker | Fait |
| `node tests/run.js` (tests existants) | **77 réussis, 0 en échec** |
| Calcul du volume hebdomadaire par muscle pour chaque objectif × niveau × jours × palier (`node tools/analyse-volume.js`, 120 combinaisons) | Fait, résultats cités plus bas |
| Exemples chiffrés : charges de départ, conseils de progression, 1RM, paliers, plateau de poids | Fait, résultats cités plus bas |
| Ouverture de l’appli dans Chromium (iPhone 13 simulé) : chargement, 5 onglets, lancement d’une séance, 3 séries, rechargement de la page | **Aucune erreur JavaScript**. Séance en cours bien retrouvée après rechargement (carte « Reprendre ») |
| Affichage iPad Pro 11" paysage simulé | Fonctionne, mais colonne unique étroite (voir UX) |
| Non vérifié (impossible ici) | Vrai iPhone/iPad, Safari réel, vraie base Firebase, comportement en arrière-plan iOS, mode « artifact Claude » |

---

## 1. État des lieux

### 1.1 Architecture

- **Un seul fichier `index.html`** contenant : styles (≈ 480 lignes), base d’exercices + toute la logique sportive « pure » (script 1, ≈ 1 740 lignes), animations SVG (script 2, ≈ 780 lignes), application (script 3, ≈ 2 450 lignes dans une seule fonction).
- **Pas de dépendance, pas d’étape de construction.** Firebase (version 10.12.2) n’est chargé que si la synchro est configurée.
- **Données** : tout est dans `localStorage` (clé `fonte:v1`), un seul objet `S` (profil, séances perso, historique, dernières performances, notes, mesures, agenda…). Séance en cours dans `fonte:run`.
- **Hors ligne** : service worker « cache d’abord, mise à jour en arrière-plan », avec bandeau « Nouvelle version prête ». Bien conçu.
- **Synchronisation** : deux systèmes différents :
  - en mode **appli installée (PWA)** : Firebase, **uniquement l’agenda** (chacun écrit son document, voit celui de l’autre) ;
  - en mode **artifact Claude** : base du compte Claude, profil + historique + agenda.
- **Tests** : 77 tests sur les fonctions de calcul (script 1), lancés aussi par GitHub Actions. **Aucun test** sur l’état, la sauvegarde, la restauration, la synchro ou le lecteur de séance.

### 1.2 Contenu

- ≈ 200 exercices (muscles principaux/secondaires, matériel, niveau, consignes, conseils, variantes débutant / sans saut).
- ≈ 90 séances types, 5 objectifs (muscle, force, perte, tonus, forme), 3 niveaux, 1 à 6 jours.
- Programme automatique, semaines A/B, zones prioritaires, paliers de 4 semaines, passage de niveau automatique, semaine allégée, séance de reprise, suivi poids/tour de taille, « Mes muscles », records, courbes, export CSV et calendrier (.ics), sauvegarde fichier/code.

### 1.3 Points forts (à conserver)

1. **Fonctionnement hors ligne solide** et mise à jour propre (service worker bien écrit).
2. **Lecteur de séance déjà riche** : minuteur de repos, calcul des disques à charger, « Plus tard » (machine prise), remplacement d’exercice, réserve de répétitions (RIR), superséries, échauffement et étirements ciblés, écran maintenu allumé, reprise après fermeture.
3. **Progression bien pensée sur plusieurs points** : double progression quand la marche de poids est grosse (haltères), vrais poids d’haltères/kettlebells du commerce, maintien après un échec, allègement de 10 % après 3 échecs, semaine allégée (−40 % de séries, 85 % des charges) cohérente avec le consensus récent sur les « deloads » (Bell et al., 2022–2023).
4. **Comptage des séries par muscle** : 1 pour un muscle principal, ½ pour un secondaire — c’est la méthode retenue par la recherche récente (Pelland et al., 2024).
5. **Gestion du stockage plein** : l’historique ancien est résumé au lieu d’être perdu, avec message.
6. **Sécurité de l’affichage** : les textes saisis sont échappés (`esc`) avant affichage.
7. **Restauration contrôlée** : le fichier est vérifié et résumé avant d’être chargé, double confirmation.
8. **Code commenté en français**, fonctions de calcul séparées et testées.

---

## 2. Problèmes réellement détectés

Gravité : 🔴 critique (perte de données ou conseil sportif faux) · 🟠 élevée · 🟡 moyenne · ⚪ faible.

### 2.1 Données et fiabilité technique

| # | Gravité | Problème | Preuve / détail |
|---|---|---|---|
| D1 | 🔴 | **L’historique, le profil et les performances ne sont copiés nulle part automatiquement** (mode appli installée). Firebase ne synchronise que l’agenda. Téléphone perdu, appli supprimée de l’écran d’accueil, données Safari effacées → tout est perdu sauf si une sauvegarde manuelle a été faite (rappel tous les 30 jours). | `Cloud.push()` n’envoie que `S.agenda` (index.html ≈ l. 4290). |
| D2 | 🔴 | **« Ne pas enregistrer » en fin de séance efface toute la séance en un seul toucher**, sans confirmation, juste sous le bouton « Enregistrer ». | Action `run-discard` (≈ l. 5238), bouton de l’écran de fin (≈ l. 4905). |
| D3 | 🟠 | **Supprimer une séance de l’historique ne corrige pas la « dernière performance »** utilisée pour les conseils de charge, ni le compteur de palier. Une faute de frappe (ex. 600 kg au lieu de 60) reste la référence même après suppression. | `hist-del` ne touche pas `S.lastPerf` (≈ l. 5267). |
| D4 | 🟠 | **Impossible de corriger une séance enregistrée** (charge ou répétitions mal saisies) ni d’ajouter une séance faite sans l’appli. Seule solution : supprimer (voir D3). | Pas d’action d’édition de l’historique. |
| D5 | 🟡 | **Restaurer une sauvegarde remplace tout sans copie de sécurité automatique** des données actuelles. Une mauvaise sauvegarde (ancienne, de l’autre personne) écrase tout. | `restoreData` (≈ l. 5091). |
| D6 | 🟡 | **Séance en cours abandonnée en silence après 12 h** (si on oublie d’appuyer sur « Enregistrer » et qu’on rouvre le lendemain). | `loadRun` (≈ l. 4817). |
| D7 | 🟡 | **Synchro « le dernier qui écrit gagne » sur des documents entiers**, avec l’heure du téléphone. Deux appareils de la même personne modifiés hors ligne → les changements de l’un sont perdus. (Impact faible aujourd’hui : chacun a son téléphone et son propre document d’agenda.) | `Sync.onPriv`, `Cloud.onSnap`. |
| D8 | 🟡 | **Pas de numéro de version du format des données ni de mécanisme de migration** (champ `v: 1` jamais exploité). Toute évolution future des données (nécessaire pour corriger S1) doit être prévue proprement. | `loadState` (≈ l. 3188). |
| D9 | ⚪ | **Règles Firebase larges** : tout utilisateur anonyme connaissant l’identifiant d’espace peut lire les agendas ; aucune limite de taille à l’écriture. Données exposées : prénom et titres de séances seulement. | Constante `RULES` (≈ l. 4204). |
| D10 | ⚪ | Volume affiché : l’assistance des tractions/dips assistées est comptée comme du poids soulevé ; pour les haltères, un seul haltère est compté. Chiffre « volume » donc faux sur ces exercices (sans effet sur les conseils). | `runSummary`, `exSeries`. |

### 2.2 Fiabilité sportive

Chiffres obtenus avec `node tools/analyse-volume.js` (homme 30 ans, 80 kg ; séries par semaine, ½ pour un muscle secondaire ; « 1× » = travaillé en principal une fois par semaine).

| # | Gravité | Problème | Preuve / détail |
|---|---|---|---|
| S1 | 🔴 | **La charge de référence est mémorisée par exercice seulement, quel que soit le nombre de répétitions.** Avec plusieurs objectifs (ex. force + muscle), le squat fait en 5×5 à 100 kg conduit à proposer **102,5 kg pour 10 répétitions** à la séance « muscle » suivante : irréalisable. Même problème quand l’objectif change, au palier 4 (répétitions −2) et pour un même exercice présent dans plusieurs séances. | `S.lastPerf[id]` + `applySuggestions` ; exemple vérifié : `progress("squat-barre", 5×5@100)` → 102,5 kg, appliqué à une séance 4×10. |
| S2 | 🟠 | **Volume très déséquilibré entre muscles.** Prise de muscle, 4 jours, intermédiaire : fessiers **27 à 33** séries/semaine, quadriceps 20–25, mais pectoraux **8–10**, deltoïdes latéraux **6–7,5**, mollets souvent **0–2**. Perte de poids intermédiaire : pectoraux 9 et épaules avant 13,5, mais **dos 3 séries/semaine** (déséquilibre poussée/tirage, mauvais pour les épaules et la posture). | Sortie de `tools/analyse-volume.js`. Repères : au moins ~10 séries/muscle/semaine pour la prise de muscle (Schoenfeld et al., 2017), rapport tirage/poussée au moins 1:1 couramment recommandé. |
| S3 | 🟠 | **Chaque muscle n’est travaillé qu’une fois par semaine** dans plusieurs programmes : prise de muscle intermédiaire/avancé sur 3 jours (Push/Pull/Legs), force sur 3–4 jours (un grand mouvement par séance, **y compris pour un débutant**). | Repères : 2 fois/semaine au moins conseillé pour l’hypertrophie (Schoenfeld et al., 2016) ; un débutant progresse plus vite en force en répétant les mouvements plusieurs fois par semaine (Grgic et al., 2018). |
| S4 | 🟠 | **Passage de niveau uniquement au nombre de séances** (débutant → intermédiaire après 3 paliers ≈ 36 séances à 3/semaine), sans regarder les progrès, la régularité ou la technique. C’est une règle arbitraire ; au passage, les charges de départ estimées augmentent de 45 %. | `progressTick`, `LEVEL_UP_PHASES`, multiplicateur `[1, 1.45, 1.85]` dans `estCharge`. |
| S5 | 🟡 | **Dernière série à l’échec systématique** sur les machines, poulies, exercices au poids du corps et isolation — **dès la première séance d’un débutant** (ex. pompes, tractions, crunchs ; même une planche « jusqu’à l’échec »). Les études ne montrent pas d’avantage clair de l’échec par rapport à 1–3 répétitions en réserve, et l’échec augmente la fatigue (Refalo et al., 2023 ; Grgic et al., 2022). Pour un débutant qui apprend le geste, ce n’est pas recommandé. | `ECH` + `prescribe` ; exemple : séance Push femme débutante → élévations latérales et extensions à la poulie « à l’échec ». |
| S6 | 🟡 | **Aucun conseil de progression pour les exercices au poids du corps et chronométrés** (pompes, tractions, dips, gainage) : la fonction renvoie « rien » quand la charge est 0. | `progress("pompes", 3×15)` → `null`. |
| S7 | 🟡 | **« Poids qui ne baisse plus » décidé sur 2 pesées seulement** (première et dernière des 21 jours). Le poids varie normalement de 1 à 2 kg d’un jour à l’autre (eau, sel, cycle) : la règle ajoute du cardio sur du bruit. | `plateau()` : 70 kg puis 69,8 kg → « plateau » = vrai. Il faudrait une moyenne sur plusieurs pesées. |
| S8 | 🟡 | **Palier 4 « plus lourd »** : les répétitions baissent de 2 mais la charge proposée ne monte pas en conséquence (elle suit l’ancienne référence). | `phaseAdjust` + `applySuggestions`. |
| S9 | ⚪ | 1RM estimé (formule d’Epley) plafonné à 15 répétitions : correct, mais peu fiable au-delà de ~10 répétitions ; à signaler dans les courbes. | `e1rm`. |
| S10 | ⚪ | Le ressenti « répétitions en réserve » est facultatif et masqué en mode simple ; la progression fonctionne sans, mais devient moins fine. | — |

**Ce qui est correct sur le plan sportif** (vérifié) : fourchettes séries × répétitions × repos par objectif (force 5×5 / 3 min ; muscle 4×10 / 2 min ; isolation 3×12 / 75 s), repos un peu plus courts chez la femme (cohérent avec une meilleure résistance à la fatigue entre séries), charges de départ prudentes (ex. homme débutant 80 kg : développé couché 27,5 kg × 10 ; femme débutante 60 kg : barre à vide 20 kg, goblet squat 8 kg), allègement de 10 % après 3 échecs, semaine allégée toutes les 5 à 8 semaines selon le niveau, séance de reprise à 90 % après 10 jours d’arrêt, adaptations corpulence/âge (exercices sans saut).

### 2.3 Expérience utilisateur

| # | Gravité | Problème |
|---|---|---|
| U1 | 🟠 | **Saisie strictement linéaire** : une série à la fois, pas de tableau « séries de l’exercice » comme dans Hevy/Strong. Revenir en arrière (« Précédent ») efface les séries saisies après. |
| U2 | 🟠 | **Fin de repos non signalée quand l’écran est verrouillé ou l’appli en arrière-plan** (limite d’iOS pour les web-apps : pas de son ni de notification). Le minuteur reste juste (il se base sur l’heure), mais l’utilisateur n’est pas prévenu. |
| U3 | 🟡 | **iPad** : une seule colonne d’environ 570 px au centre, grands espaces vides ; orientation « portrait » imposée dans le manifeste. |
| U4 | 🟡 | Pas de **plusieurs profils sur un même appareil** (ex. un iPad partagé à deux). |
| U5 | ⚪ | Police téléchargée depuis Google : au tout premier lancement hors ligne, police de secours. |

### 2.4 Maintenabilité / architecture future

| # | Gravité | Problème |
|---|---|---|
| A1 | 🟡 | Tout dans un fichier de 563 Ko ; l’application est une seule fonction de 2 450 lignes avec un état global modifié partout ; l’affichage reconstruit des morceaux de HTML en texte. Chaque évolution est risquée et difficile à tester. |
| A2 | 🟡 | Les tests ne couvrent ni l’état, ni la sauvegarde/restauration, ni la synchro, ni le lecteur de séance : les zones où une erreur ferait perdre des données. |
| A3 | ⚪ | Les « 4 moteurs » demandés existent déjà en germe : pédagogique (base d’exercices + animations), entraînement (prescriptions, programmes, paliers), analytique (records, courbes, muscles, régularité), utilisateur (état, sauvegarde, synchro). Ils sont mélangés dans les mêmes scripts. |

---

## 3. Les risques les plus importants (par ordre)

1. **Perte de tout l’historique** si le téléphone est perdu/réinitialisé ou les données du site effacées (D1), aggravée par un mauvais toucher en fin de séance (D2).
2. **Conseils de charge faux pour les profils à plusieurs objectifs** (S1) : risque de blessure ou de découragement.
3. **Programmes déséquilibrés** (S2, S3) : certains muscles sous-entraînés, déséquilibre poussée/tirage en perte de poids.
4. **Erreurs de saisie impossibles à corriger** qui faussent durablement la progression (D3, D4).
5. **Coût et risque croissants de chaque modification** tant que tout reste dans un seul bloc non testé (A1, A2).

---

## 4. Améliorations recommandées

### Lot A — Sécurité des données (priorité 1)
- A-1 Confirmation (ou annulation possible quelques secondes) sur « Ne pas enregistrer » (D2).
- A-2 Copie de sécurité locale automatique avant toute restauration ou réinitialisation, restaurable en un toucher (D5).
- A-3 Séance en cours : ne plus la jeter après 12 h ; proposer « Enregistrer ce qui a été fait » (D6).
- A-4 Sauvegarde automatique hors du téléphone (D1). **Décision nécessaire** : soit étendre la synchro Firebase existante aux données personnelles (document privé par personne, lisible par elle seule), soit garder la sauvegarde manuelle mais plus fréquente et plus visible.
- A-5 Numéro de version des données + migrations testées (D8), prérequis du lot B.
- A-6 Tests automatiques de l’état : chargement d’anciennes données, sauvegarde/restauration aller-retour, stockage plein.

### Lot B — Fiabilité sportive (priorité 2)
- B-1 Référence de charge par exercice **et** par plage de répétitions (ou conversion par 1RM estimé) ; migration des données existantes (S1).
- B-2 Correction/suppression d’une séance qui recalcule les références et les paliers (D3, D4).
- B-3 Rééquilibrage des programmes : 2 fois/semaine par muscle quand c’est possible, ~10–20 séries par muscle et par semaine pour la prise de muscle, tirage ≥ poussée, mollets et deltoïdes présents ; test automatique qui vérifie ces bornes pour chaque combinaison (S2, S3).
- B-4 Échec réservé aux non-débutants et à certaines séries, sinon cible « 1–2 répétitions en réserve » (S5).
- B-5 Progression des exercices au poids du corps et chronométrés (répétitions/durée puis version plus dure) (S6).
- B-6 Plateau de poids sur moyenne glissante de plusieurs pesées (S7).
- B-7 Passage de niveau fondé sur des critères mesurables (régularité + progrès sur les mouvements de base), proposé et non imposé (S4) ; palier 4 avec charge ajustée (S8).
- Chaque règle sera documentée avec sa source dans un fichier `docs/REGLES_SPORTIVES.md`.

### Lot C — Expérience de séance (priorité 3)
- C-1 Vue « tableau des séries » d’un exercice (modifier une série déjà faite, en ajouter une) sans casser le mode guidé (U1).
- C-2 Modifier une séance de l’historique, saisir une séance faite sans l’appli (D4).
- C-3 Fin de repos : son/vibration au retour dans l’appli + option d’alerte via le calendrier non adaptée → étudier les notifications web d’iOS (installées sur l’écran d’accueil, iOS 16.4+) avec leurs limites (U2).
- C-4 Mise en page iPad en deux colonnes, orientation libre (U3).
- C-5 Plusieurs profils sur un appareil (U4) — à décider.

### Lot D — Architecture pour les 4 moteurs (progressive)
- D-1 Sortir le contenu de `index.html` en fichiers séparés **sans outil de construction** (simples scripts chargés dans l’ordre, mis en cache par le service worker) : `engine-pedago` (exercices, animations), `engine-training` (prescriptions, programmes, paliers, progression), `engine-analytics` (records, courbes, volume, régularité), `engine-user` (état, stockage, migrations, sauvegarde, synchro), puis l’interface.
- D-2 Fait **par petites étapes**, chaque étape vérifiée par les tests et un test dans le navigateur, en commençant par ce qui est déjà isolé (script 1).
- D-3 Justification : pouvoir tester et faire évoluer chaque moteur sans toucher aux autres. On ne réécrit pas l’interface.

---

## 5. Plan de développement proposé (une session par phase)

| Phase | Contenu | Dépend de | Fichiers principaux |
|---|---|---|---|
| **2** | Plan d’amélioration détaillé : liste précise des corrections, critères d’acceptation, ordre, réponses aux décisions ouvertes, sources scientifiques à l’appui | Audit | `docs/PLAN_PHASE2.md` |
| **3a** | Lot A : sécurité des données (A-1 à A-3, A-5, A-6 ; A-4 selon décision) | Phase 2 | `index.html` (script 3), `tests/` |
| **3b** | Architecture minimale : séparation des moteurs en fichiers, sans changement de comportement | 3a (tests de l’état en place) | nouveaux fichiers, `sw.js` (SHELL + VERSION), `tests/run.js` |
| **3c** | Lot B partie 1 : références de charge par plage (B-1), correction de l’historique (B-2), migration des données | 3a, 3b | moteurs entraînement + utilisateur |
| **3d** | Lot B partie 2 : rééquilibrage des programmes, échec, poids du corps, plateau, niveaux (B-3 à B-7) + `docs/REGLES_SPORTIVES.md` | 3c | moteur entraînement, tests |
| **3e** | Lot C : expérience de séance, iPad | 3c | interface |
| **4** | Tests complets : non-régression, calculs sur exemples, sauvegarde/restauration, essai sur vrai iPhone/iPad par toi | 3a–3e | `tests/`, compte rendu |
| **5** | Validation : compte rendu, documentation (README), problèmes restants | 4 | `README.md`, `PROJECT_STATUS.md` |

Ordre justifié : on protège d’abord les données (risque le plus grave et changements petits), puis on rend le code testable, puis on corrige la logique sportive (qui nécessite de faire évoluer le format des données), puis l’ergonomie.

## 6. Décisions qui te reviennent (à trancher en phase 2)

1. **Sauvegarde automatique en ligne** des données personnelles via ton Firebase existant (oui / non) ?
2. **Changer les programmes existants** (ex. 3 jours « muscle » intermédiaire : Push/Pull/Legs → Haut/Bas/Full body ; force 3 jours : chaque grand mouvement plusieurs fois par semaine) ? Cela modifie les séances que vous faites aujourd’hui.
3. **Échec musculaire** : le retirer pour les débutants et le remplacer par « garde 1–2 répétitions en réserve » ?
4. **Passage de niveau** : automatique sur critères, ou seulement proposé (tu acceptes ou non) ?
5. **Plusieurs profils sur un même appareil** : utile pour vous (iPad partagé) ?

## 7. Références citées

- Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. *Journal of Sports Sciences*.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2016). Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. *Sports Medicine*.
- Grgic J. et al. (2018). Effect of resistance training frequency on gains in muscular strength: a systematic review and meta-analysis. *Sports Medicine*.
- Refalo M.C. et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. *Sports Medicine*.
- Grgic J. et al. (2022). Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy. *Journal of Sport and Health Science*.
- Pelland J.C. et al. (2024). The resistance training dose-response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains (prépublication SportRxiv).
- Bell L. et al. (2022). Reaching a consensus on deloading in resistance training: a Delphi study. *Frontiers in Sports and Active Living* ; et (2023) Deloading practices in strength and physique sports: a cross-sectional survey. *Sports Medicine – Open*.
- American College of Sports Medicine (2009). Progression models in resistance training for healthy adults. *Medicine & Science in Sports & Exercise*.

Les références exactes (volume, pages) seront revérifiées en phase 2 avant d’écrire les règles définitives.
