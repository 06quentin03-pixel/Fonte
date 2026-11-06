# Vérification à la main sur iPhone — phase 3A

Environ 10 minutes. À faire sur ton iPhone (et, si possible, sur celui de ta copine).
Les tests automatiques ont tourné dans Chromium avec des écrans d’iPhone et d’iPad simulés : ils ne remplacent pas un vrai Safari.

## Avant la mise à jour (important)

1. Ouvre Fonte → **Profil › Sauvegarder / transférer** → « Enregistrer dans Fichiers » → **iCloud Drive**. Fais-le sur chaque iPhone.
2. Note sur un papier : le **nombre de séances** de l’historique, la **dernière séance** (nom, date), ton **palier**, et **un record** (exercice + charge).

## Mettre à jour

3. La mise à jour arrive quand la branche est fusionnée dans `main` (GitHub › Pull requests › Merge). Ouvre Fonte avec du réseau.
   Le bandeau « Nouvelle version de Fonte prête – Recharger » apparaît : touche **Recharger**. (S’il n’apparaît pas, ferme complètement l’appli et rouvre-la.)
4. Vérifie que les chiffres notés à l’étape 2 sont identiques (séances, dernière séance, palier, record).

## Mode avion (le plus important)

5. Active le **mode avion**, ferme complètement Fonte (balaye-la vers le haut dans le sélecteur d’applis), puis rouvre-la.
   ✅ L’appli s’ouvre, les 5 onglets fonctionnent, une séance peut être lancée.
6. Désactive le mode avion.

## Les nouveautés

7. **« Ne pas enregistrer »** : lance une séance, valide 1 ou 2 séries, touche la croix › « Terminer », puis « Ne pas enregistrer ».
   ✅ Une fenêtre demande « Supprimer cette séance ? ». Touche « Supprimer » : un bandeau « Séance supprimée — **Annuler** » s’affiche 10 secondes. Touche « Annuler » : la séance revient. (Ensuite, enregistre-la ou supprime-la pour de bon.)
8. **Revenir en arrière** : Profil › Données › « Effacer l’historique » (touche deux fois).
   ✅ L’historique est vide, et un bouton **« Revenir à l’état d’avant »** apparaît en dessous. Touche-le deux fois : tout ton historique revient.
   (Si tu préfères ne pas tester avec tes vraies données, fais l’essai juste après la sauvegarde de l’étape 1 : tu pourras toujours restaurer le fichier.)
9. **Rappel de sauvegarde** : il apparaîtra sur l’accueil après 10 séances ou 14 jours sans sauvegarde, avec « Me le rappeler dans 7 jours ».
10. **Charge recalculée** : si une séance demande beaucoup plus (ou moins) de répétitions que la dernière fois pour un exercice, la charge proposée est recalculée (ligne « charge recalculée … (estimation prudente) » sous l’exercice), au lieu d’être augmentée.
11. **Séance oubliée** : une séance laissée en cours plus de 12 h apparaît sur l’accueil (« Séance non terminée ») avec « Enregistrer ce qui a été fait » (à sa date) ou « Supprimer ».

## Si quelque chose ne va pas

- Ne réinitialise rien. Profil › Restaurer › choisis le fichier de l’étape 1.
- Note ce que tu as vu et donne-le à la prochaine session Claude Code.
