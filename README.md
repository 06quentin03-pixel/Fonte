# Fonte

Appli de musculation en français, installable sur iPhone et Android (PWA), qui fonctionne sans réseau.

- **Exercices** : environ 200 fiches avec muscles travaillés, consignes, conseils et animation du mouvement.
- **Séances types et programme** adaptés au profil (sexe, âge, taille, poids, niveau) et à **un ou plusieurs objectifs** : chaque séance du programme est réglée sur son objectif, et l’accueil propose toujours **la prochaine séance** à faire.
- **Mode séance** : minuteur de repos, charges et disques à charger, « Plus tard » quand la machine est prise, **remplacement d’exercice** par un équivalent, **répétitions en réserve** par série, étirements de fin de séance, **superséries** (deux exercices enchaînés sans repos).
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
