# Vérification à la main — phase 3B (format v2, profils)

Environ 15 minutes. À faire sur **les deux iPhone**, puis sur l’iPad pour les profils.
Les tests automatiques ont tourné dans Chromium avec des écrans d’iPhone et d’iPad simulés : ils ne remplacent pas un vrai Safari.
Cette mise à jour transforme le format de vos données (une seule fois). Fonte garde l’ancien format intact à côté, comme copie de secours.

## Avant la mise à jour (sur chaque iPhone, important)

1. Ouvre Fonte → **Profil › Sauvegarder / transférer** → « Enregistrer dans Fichiers » → **iCloud Drive**.
2. Note sur un papier : le **nombre de séances** de l’historique (accueil › « Dernières séances » › « Tout voir »), la **dernière séance** (nom, date), ton **palier** (« Palier X · Y séances sur Z ») et **un record** (exercice + charge).

## Mettre à jour (sur chaque iPhone)

3. La mise à jour arrive quand la branche `claude/phase-3b-format-profils` est fusionnée dans `main`. Ouvre Fonte avec du réseau.
   Le bandeau « Nouvelle version de Fonte prête – Recharger » apparaît : touche **Recharger**. (S’il n’apparaît pas, ferme complètement l’appli et rouvre-la.)
4. ✅ Les chiffres de l’étape 2 sont identiques : nombre de séances, dernière séance, palier, record.
5. ✅ Profil : en haut, une carte avec ton prénom et « Un seul profil sur cet appareil ».
6. Si une carte **« Fais une sauvegarde »** apparaît sur l’accueil : la mémoire du téléphone était trop pleine pour la mise à jour des données. Rien n’est perdu, Fonte continue comme avant. Fais la sauvegarde et signale-le à la prochaine session.

## Mode avion (sur chaque iPhone)

7. Active le **mode avion**, ferme complètement Fonte (balaye-la vers le haut), puis rouvre-la.
   ✅ L’appli s’ouvre, les 5 onglets fonctionnent, une séance peut être lancée.
8. Désactive le mode avion.

## Deux profils sur l’iPad

9. Sur l’iPad : **Profil › Ajouter un profil › Créer le profil**. L’appli se relance sur le nouveau profil et le questionnaire de départ s’ouvre : réponds-y pour la 2ᵉ personne.
10. Fais une petite séance dans ce profil (1 ou 2 séries suffisent) et enregistre-la.
11. **Profil › Changer de profil** › choisis le premier profil. Fais aussi une petite séance et enregistre-la.
12. ✅ Rien ne se mélange : chaque profil n’a que ses séances (accueil › Dernières séances), son palier, ses records, sa silhouette « Mes muscles », ses charges proposées, son agenda.
13. ✅ Pendant une séance en cours, « Changer de profil » est refusé (« Une séance est en cours dans ce profil… »).
14. Si tu veux garder l’iPad avec un seul profil, ce n’est pas grave : le profil ajouté reste simplement là (sa suppression n’existe pas encore, volontairement, pour ne rien perdre par erreur).

## Correction du bug « même séance reproposée »

15. Fais une séance du programme (par exemple « Force : squat »), même en la lançant depuis Séances › Séances types.
    ✅ Le lendemain, l’accueil propose la séance **suivante** du programme (par exemple « Force : développé couché »), pas la même.

## Bon à savoir

- Les profils sont **séparés mais pas protégés par un code** : toute personne qui utilise l’appareil peut les ouvrir.
- Une sauvegarde fichier contient **le profil ouvert** : fais-en une par profil.
- Supprimer une séance de l’historique remet maintenant la charge proposée et le palier comme si elle n’avait jamais existé.
- La synchro de l’agenda (Firebase) reste reliée au profil qui l’a activée ; dans un autre profil du même appareil, on voit cet agenda comme celui d’un partenaire.

## Si quelque chose ne va pas

- Ne réinitialise rien. Profil › Restaurer › choisis le fichier de l’étape 1. Les anciennes sauvegardes restent restaurables.
- Note ce que tu as vu et donne-le à la prochaine session Claude Code. **Ne lance pas la phase 3C** tant que les données ne sont pas vérifiées sur les deux iPhone.
