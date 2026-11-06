# Fonte — règles sportives et leurs sources

Ce document liste les règles sportives que Fonte applique, ce qu’elles font dans l’appli, d’où elles viennent, et ce qui relève d’un choix prudent plutôt que d’un chiffre d’étude. Il complète la section 9 de `docs/PLAN_PHASE2.md` (où les références ont été vérifiées en phase 2) et décrit l’état **à la fin de la phase 3D**.

État des sources : ✅ vérifiée en ligne (titre, revue, année ; en phase 2 ou 3D) · ⚠️ partiellement (résumé ou présentation officielle seulement) · ❌ non vérifiée.

Règle générale : quand un chiffre exact n’existe pas dans les études, Fonte choisit la valeur **prudente** et le dit ici (« choix prudent »). Les programmes eux-mêmes (séances types, séries, répétitions) ne changent pas sans l’accord du propriétaire (décision 2) : les propositions sont dans `docs/PROPOSITIONS_PROGRAMMES.md`.

---

## 1. Répétitions en réserve au lieu de « jusqu’à l’échec » (S5, décision 3)

**Ce que fait Fonte** : chaque exercice en répétitions reçoit une cible « garde N répétitions en réserve » (`rirFor`, `setRir` dans `js/engine-training.js`), affichée dans la séance (« Garde 2 répétitions en réserve ») et dans le détail des séances (« réserve 2 »). La dernière série « jusqu’à l’échec » ne reste qu’au niveau **avancé**, sur les exercices sans risque (liste `ECH` : machines, poulies, poids du corps).

| Niveau | Grands mouvements libres (barre, haltères, kettlebell, exercice de base) | Machines, poulies, élastiques, isolation | Poids du corps | Chronométrés (gainage) |
|---|---|---|---|---|
| Débutant | 3 au palier 1, puis 2 | 2 | 2 | une durée, jamais d’échec ni de réserve |
| Intermédiaire | 2 ; dernière série 1 à partir du palier 4 | 1 | 1 | une durée |
| Avancé | 2, dernière série 1 | 1 ; dernière série à l’échec si l’exercice est dans `ECH` (sinon 1) | 1 ; dernière série à l’échec si dans `ECH` | une durée |

Semaine allégée et séance de reprise : 3 répétitions en réserve partout, aucun échec (`rirEasy`). Les circuits (enchaînements chronométrés) ne changent pas.

**Choix prudents** (le tableau du plan laissait une fourchette) : intermédiaire sur machine « 0–1 possible » → 1 ; avancé sur grand mouvement « 1–2 » → 2 puis 1 sur la dernière série ; avancé au poids du corps « 0–1 » → 1, échec seulement sur la dernière série d’un exercice sans risque.

**La progression en tient compte** (`progress`) : la cible est enregistrée avec chaque série (`rt`) et reprise dans la référence (`rirT`).
- Toutes les séries finies **au moins 2 répétitions plus près de l’échec que la cible** (ex. cible 3, fini à 1) → la charge reste la même (« limit »). Pourquoi 2 : on se trompe en moyenne d’environ 1 répétition en estimant sa réserve (Halperin 2022) ; 2 d’écart, c’est vraiment plus dur que prévu.
- « 3 et plus » en réserve ne compte comme « facile » (deux crans de plus) que si la cible était 0 ou 1 ; avec une cible de 2 ou 3, c’est un cran normal.

**Sources** :
- Refalo, Helms, Trexler, Hamilton, Fyfe (2023). *Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy*. Sports Medicine 53(3) : 649–665 ✅ — pas d’avantage clair de l’échec.
- Grgic, Schoenfeld, Orazem, Sabol (2022). Journal of Sport and Health Science 11(2) : 202–211 ✅ — pas de différence significative force/hypertrophie ; petit avantage hypertrophie possible chez les entraînés (d’où l’échec ponctuel chez l’avancé).
- Helms, Cronin, Storey, Zourdos (2016). Strength and Conditioning Journal 38(4) : 42–49 ✅ — échelle des répétitions en réserve.
- Halperin et al. (2022). Sports Medicine 52(2) : 377–390 ✅ — sous-estimation moyenne d’environ 1 répétition.
- American College of Sports Medicine (2026). *Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews*. Medicine & Science in Sports & Exercise (avril 2026) ⚠️ — vérifié en 3D sur la présentation officielle de l’ACSM et des résumés (137 revues systématiques) : aller jusqu’à la fatigue momentanée ne change pas de façon constante les résultats ; au moins 10 séries par semaine et par muscle favorisent l’hypertrophie ; chaque grand groupe musculaire au moins 2 jours par semaine. Texte complet non lu.

**Point honnête** : les valeurs 3, 2, 1 sont une application prudente de ces résultats, pas des chiffres tirés directement d’une étude.

## 2. Mode simple : « C’était facile / juste / très dur » (S10)

En mode simple, la question « répétitions encore possibles » (0 à 3) est remplacée par « C’était : Facile / Juste / Très dur », enregistrée comme 3 / 1 / 0 répétitions en réserve. La progression l’utilise exactement comme la réserve notée en chiffres. Facultatif : sans réponse, rien ne change. Source : la même échelle (Helms 2016) ; la conversion est une approximation volontairement grossière (choix prudent : « juste » = 1, pas 2).

## 3. Charge selon le nombre de répétitions (S1-b, S1-a, S8)

- **Une référence par zone** (`refFor`) : force (6 répétitions ou moins), muscle (7 à 12), endurance (13 et plus). La charge proposée part de la dernière séance faite **dans la même zone** : le squat progresse séparément à 5 et à 10 répétitions. Les zones reprennent les repères classiques force / hypertrophie / endurance (ACSM 2009 ✅) ; la frontière exacte (6/7, 12/13) est un choix de rangement, pas un seuil biologique.
- **Pas de référence dans la zone** : la dernière performance, **convertie** si l’écart est d’au moins 3 répétitions (`convertLoad`, 3A) : 1RM estimé par la formule d’Epley, marge de prudence de 5 %, arrondi vers le bas au matériel.
- **Palier 4 (S8)** : quand les gros exercices passent de 10 à 8 répétitions, la charge est convertie par Epley **sans marge** (l’écart est petit et la cible de réserve garde la prudence), arrondie vers le bas, et **jamais en dessous** de la progression normale : 4 × 10 à 100 kg → 105 kg pour 8. Seulement si la dernière séance a été réussie.
- Formule d’Epley (1985) et précision des équations de 1RM (LeSuer et al., 1997, J. Strength Cond. Res. 11(4) : 211–213) ❌ non revérifiées en ligne dans cette session : la conversion est présentée comme une **estimation prudente** dans l’appli.

## 4. 1RM estimé au-delà de 10 répétitions (S9)

Sous la courbe « 1RM estimé » d’un exercice, un point calculé à partir d’une série de plus de 10 répétitions est dessiné en creux, avec la mention « estimation peu fiable au-delà de 10 répétitions ». Le calcul ne change pas (Epley, plafonné à 15 répétitions). Raison : les équations de 1RM perdent en précision quand le nombre de répétitions augmente (LeSuer 1997 ❌, à revérifier).

## 5. Progression au poids du corps et chronométrée (S6)

`progressBW` : double progression appliquée sans charge.
- Toutes les séries atteignent la cible → **+1 répétition** (+2 si c’était facile : ressenti « facile » ou 3 en réserve), ou **+5 s** (+10 s si facile) sur le gainage ; la séance suivante propose ce nouveau nombre (ou cette durée).
- **Haut de la fourchette** : cible de départ + 5 répétitions, ou durée de départ × 1,5.
- Haut de la fourchette atteint **2 séances de suite** → « passe à la version plus dure » (table `HARDER` : pompes → pompes déclinées, planche → hollow…), par « Remplacer l’exercice » : rien ne change seul.
- Source : surcharge progressive en augmentant les répétitions ou la difficulté (ACSM 2009 ✅). **Point honnête** : la largeur de la fourchette (+5 répétitions, × 1,5) et les « 2 séances de suite » sont des **règles pratiques** (même logique que la double progression déjà en place pour les haltères), pas des chiffres d’étude.

## 6. Plateau de poids (S7)

« Ton poids ne baisse plus » (et 5 minutes de cardio en plus, objectifs perte et tonus) seulement si la **moyenne des pesées des 7 derniers jours** n’est pas plus basse d’au moins 0,3 kg que la moyenne de la semaine d’**il y a 3 semaines**, avec **au moins 3 pesées de chaque côté** (`plateauInfo`). Sinon, s’il y a des pesées mais pas assez, Fonte invite à se peser 3 fois par semaine, le matin, sans ajouter de cardio. Avant 3D, deux pesées isolées suffisaient (70 → 69,4 → 69,0 → 70 était un « plateau »).
- Source : Orsama et al. (2014). *Weight rhythms: weight increases during weekends and decreases during weekdays*. Obesity Facts 7(1) : 36–47 ⚠️ — variations normales d’un jour à l’autre ; tendance estimée par moyenne sur une semaine.
- Le seuil de 0,3 kg est celui qu’utilisait déjà Fonte (conservé pour ne pas changer deux choses à la fois).

## 7. Passage de niveau proposé, jamais automatique (S4, décision 4)

Le niveau ne change plus jamais seul (`progressTick`). Une carte « Tu pourrais passer au niveau intermédiaire » apparaît quand les **trois** critères sont réunis (`levelSuggest`), avec les raisons ; « Passer au niveau … » ou « Plus tard » (reproposé 4 semaines après). On peut toujours changer de niveau soi-même dans le profil.

| Passage | (1) Durée et régularité | (2) Progression devenue lente | (3) Paliers |
|---|---|---|---|
| Débutant → intermédiaire | première séance il y a au moins 182 jours (≈ 6 mois) et au moins 16 séances sur les 8 dernières semaines terminées (2 par semaine) | au moins 3 exercices avec charge dont les 3 dernières séances n’ont pas monté à chaque fois | au moins 3 paliers terminés à ce niveau |
| Intermédiaire → avancé | au moins 2 ans, même régularité | idem | au moins 6 paliers à ce niveau |

En acceptant : palier 1 du nouveau niveau, **charges réelles conservées** (la charge proposée continue de partir des références de la personne ; l’estimation d’après le profil ne sert qu’aux exercices jamais faits). Le bilan garde la trace du passage (`man: 1`). Un passage automatique d’avant 3D, déjà enregistré, est respecté quand l’historique est rejoué (suppression d’une séance).
- Sources : ACSM (2009). *Progression models in resistance training for healthy adults*. MSSE 41(3) : 687–708 ✅ (intermédiaire ≈ 6 mois d’entraînement régulier, avancé : des années). La position ACSM 2026 ⚠️ ne redéfinit pas ces niveaux dans ce qui a pu être lu (présentation et résumés).
- **Point honnête** : le critère (2) est une règle pratique d’entraîneur (la progression « à chaque séance » est le propre du débutant), acceptable parce que la décision reste à la personne.

## 8. Volume d’une séance (D10)

Volume = somme des répétitions × charge **réellement soulevée** : 2 haltères comptés pour les exercices « par haltère », un seul pour ceux à un haltère (option `S`), la barre en charge totale ; l’**assistance** (contrepoids) n’est pas un poids soulevé et n’est pas comptée (comme les autres exercices au poids du corps). Les volumes des séances enregistrées avant 3D ne sont pas recalculés (sauf si la séance est modifiée).

## 9. Règles déjà en place, inchangées en 3D

Volume par muscle (comptage ½ pour un muscle secondaire), fréquence, semaine allégée (Bell 2023, Rogerson 2024 ✅), double progression des charges, allègement après 3 séances ratées : voir `docs/PLAN_PHASE2.md`, section 9.
