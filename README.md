# Fonte

Appli de musculation en français, installable sur iPhone et Android (PWA), qui fonctionne sans réseau.

- **Exercices** : environ 200 fiches avec muscles travaillés, consignes, conseils et animation du mouvement.
- **Séances types et programme** adaptés au profil (sexe, âge, taille, poids, niveau) et à **un ou plusieurs objectifs** : chaque séance du programme est réglée sur son objectif, et l’accueil propose toujours **la prochaine séance** à faire.
- **Programme qui évolue (paliers)** : un palier = 4 semaines de séances (compté en séances faites : une pause ne fait pas avancer). Palier 2 : une série de plus sur les gros exercices ; palier 3 : versions plus dures des exercices (machine → haltères → barre, pompes sur les genoux → pompes…) ; palier 4 et suivants : plus lourd (muscle, force, forme) ou pauses plus courtes (perte, tonus). **Bilan** à la fin de chaque palier (séances, progrès par exercice, poids, tour de taille, ce qui change ensuite).
- **Passage de niveau automatique** : débutant → intermédiaire après 3 paliers (environ 3 mois), intermédiaire → avancé après 6 paliers.
- **Séances dans l’ordre** : une séance du programme manquée n’est pas perdue, elle devient la prochaine séance prévue et toute la suite se décale. Après plus de 10 jours sans séance, **séance de reprise** avec des charges à 90 %.
- **Le programme suit ton corps** : poids qui ne baisse plus depuis 3 semaines (perte, tonus) → 5 min de cardio en plus (15 au plus) ; **poids visé** atteint → proposition de changer d’objectif ; charges qui stagnent sur plusieurs exercices → semaine allégée proposée.
- **Mes muscles** : silhouette où chaque muscle se touche (séries sur 7 ou 30 jours, état « à travailler » / « bien travaillé »), exercices conseillés pour chaque muscle et **séance express** pour les muscles les moins travaillés.
- **Séances propres à chaque objectif** : force (une séance par grand mouvement : squat, développé couché, soulevé de terre, développé militaire), perte de poids (circuits brûle-graisses haut et bas du corps, cardio), tonus (séances toniques en séries longues, circuit), remise en forme (séances douces, renfo et mobilité), prise de muscle (full body, haut/bas, push/pull/legs). Débutant : mouvements à la barre d’abord aux haltères, la barre arrive au palier 3.
- **Semaines A et B** : une semaine sur deux, chaque séance passe à sa variante (mêmes muscles, autres exercices), les grands mouvements de force restent pour mesurer les progrès.
- **Zone prioritaire** (bras, épaules, pectoraux, dos, fessiers, jambes, abdos ; 2 au plus) : un exercice en plus pour cette zone dans les séances de musculation.
- **Variété** : jamais deux fois la même séance dans la semaine. Quand un groupe de muscles revient (Haut/Bas en 4 jours, Push/Pull/Legs en 6 jours, full body en 3 jours…), le programme prend une variante (Push B, Haut du corps B, Full body guidé, Cardio varié, HIIT cardio-boxe…). Si le programme change, l’agenda programmé est mis à jour tout seul.
- **Premier lancement guidé** : 5 questions (prénom, objectif, homme/femme, âge, taille, poids, niveau, jours d’entraînement et heure), puis « Voici ton programme ». Le questionnaire peut être refait depuis le profil.
- **Accueil centré sur la séance du jour** (« C’est parti », « Pas aujourd’hui » pour la reporter, ou jour de repos), la semaine (prévues / faites), puis les progrès.
- **Programmé** (bouton en haut de l’accueil) : les séances des 4 prochaines semaines. Le programme est ajouté automatiquement **un mois à l’avance** et la suite s’ajoute au fil des jours. **Séance manquée** : l’accueil propose de la reporter au prochain jour libre (ou à la date choisie) ou de la laisser tomber.
- **Mode simple** (activé d’office pour les débutants, réglable dans le profil) : séance guidée pas à pas (que faire, avec quel poids, comment faire le mouvement), pas d’écran de préparation, moins de chiffres, options avancées masquées. **Les mots de la muscu** : chaque terme technique (série, répétition, repos, échec…) est expliqué en une phrase.
- **Programme sur mesure** (accueil et onglet Séances › Programme) : ce qui est réglé selon tes objectifs et ton poids (séries, répétitions, repos, charges de départ), le détail de chaque séance avec ses charges, et **le planning de la semaine** : tu choisis tes jours d’entraînement (le programme s’adapte au nombre de jours), puis tu l’ajoutes à l’agenda pour 1 à 12 semaines, en remplaçant le planning précédent si besoin.
- **Mode séance** : minuteur de repos, charges et disques à charger, « Plus tard » quand la machine est prise, **remplacement d’exercice** par un équivalent, **répétitions en réserve** par série, **échauffement ciblé** en début de séance (cardio doux + mobilité selon les muscles travaillés) et **étirements ciblés** en fin de séance, **superséries** (deux exercices enchaînés sans repos).
- **Semaine allégée** conseillée après plusieurs semaines d’affilée (moins de séries, charges à 85 %), sans faire baisser les charges de référence.
- **Progression** : courbe par exercice (1RM estimé, charge max, répétitions ou durée), **records** détectés en fin de séance, conseil de charge pour la séance suivante (double progression, ressenti, allègement après 3 séances ratées).
- **Suivi** : muscles travaillés sur 7 jours (silhouette), régularité sur 8 semaines, bilan du mois, **poids et tour de taille** avec leurs courbes (le dernier poids met à jour les charges conseillées).
- **Notes par exercice** (réglage du siège, prise…), affichées pendant la séance.
- **Agenda** partagé (synchro Firebase ou codes à échanger) et **export vers le calendrier du téléphone** (.ics) avec rappel.
- **Données** : sauvegarde/restauration, rappel de sauvegarde tous les 30 jours, **export tableur** (CSV) de l’historique.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l’appli, en un seul fichier autonome (styles, données, animations, code). Le plan est en tête de chaque bloc `<script>`. |
| `sw.js` | Service worker : fonctionnement hors ligne et détection des nouvelles versions. |
| `manifest.webmanifest`, `icon-*.png` | Installation sur l’écran d’accueil. |
| `tests/run.js` | Tests des calculs (prescriptions, progression, records, superséries, exports). |

`index.html` reste volontairement un fichier unique : on peut le déposer tel quel sur GitHub Pages ou l’ouvrir comme artifact Claude (sans la ligne `window.FONTE_PWA = true`, l’appli passe en mode artifact et synchronise via le compte Claude).

## Mettre à jour l’appli

1. Remplace `index.html` (et les autres fichiers modifiés) sur GitHub.
2. Au lancement suivant, l’appli s’ouvre depuis le cache, télécharge la nouvelle version en arrière-plan et affiche **« Nouvelle version de Fonte prête – Recharger »**.

Il n’est plus nécessaire de changer `VERSION` dans `sw.js` à chaque mise à jour : seulement quand tu modifies `sw.js` lui-même ou la liste des fichiers mis en cache (`SHELL`).

## Tests

```sh
node tests/run.js
```

Aucune dépendance : il suffit de Node.js 18 ou plus. Les tests tournent aussi automatiquement sur GitHub à chaque envoi (onglet **Actions**).

## Données et stockage

Tout est enregistré dans le navigateur du téléphone (`localStorage`). Les 300 séances les plus récentes gardent tout leur détail ; au-delà, seules les meilleures séries de chaque exercice sont conservées (assez pour les courbes et les records), jusqu’à 3 000 séances. Si le stockage du téléphone est plein, l’appli résume davantage les séances anciennes au lieu de perdre des données, et prévient.

Les rappels passent par le calendrier du téléphone : une vraie notification envoyée par l’appli, appli fermée, demanderait un serveur d’envoi (Web Push), que Fonte n’a pas.
