# Checklist phase 3C — sauvegarde en ligne par compte (à faire à la main)

Environ 20 minutes. Ce que les tests automatiques ne peuvent pas prouver : vrai Safari, vrais iPhone/iPad, **vrai projet Firebase** (les tests utilisent un faux Firebase et l’émulateur officiel).

## 0. Avant la mise à jour

- [ ] Sur **chaque iPhone** : Profil › Données › « Sauvegarder / transférer » › Enregistrer dans Fichiers › iCloud Drive.
- [ ] Noter sur chaque iPhone : nombre de séances de l’historique, dernière séance, palier (Séances › Programme), un record.
- [ ] Mettre à jour l’appli (après la fusion dans `main`) : ouvrir Fonte, « Nouvelle version de Fonte prête – Recharger ». Vérifier que les données notées sont toujours là.

## 1. Console Firebase (la personne qui gère le projet, une seule fois, ≈ 5 min)

L’ordre compte : il évite toute coupure de l’agenda partagé.

- [ ] **console.firebase.google.com** › votre projet › **Authentication** › onglet « Sign-in method » › **Adresse e-mail/Mot de passe** : activer, enregistrer. **Laisser « Anonyme » activé** (sert pendant la transition).
- [ ] Ne pas encore toucher aux règles : faire d’abord l’étape 2 sur les deux iPhone.

## 2. Un compte par profil (chacun sur son iPhone, ≈ 2 min)

- [ ] Profil › **Sauvegarde en ligne** › « Créer mon compte » › e-mail + mot de passe (6 caractères au moins, à garder précieusement).
  Le compte anonyme du téléphone est relié au compte : l’agenda partagé continue sans rien refaire.
  À ce moment, la carte peut afficher « Firebase refuse l’accès : publie les nouvelles règles » : c’est normal, voir l’étape 3.
- [ ] Sur l’iPad, pour le 2ᵉ profil : ouvrir ce profil, Profil › Sauvegarde en ligne › « Créer mon compte » (ou « Me connecter » si cette personne a déjà son compte sur son iPhone).

## 3. Nouvelles règles Firestore (≈ 2 min)

- [ ] Dans Fonte : Profil › Sauvegarde en ligne › **« Règles Firestore »** › « Copier les règles ».
- [ ] Console Firebase › **Firestore Database** › onglet **Règles** › tout remplacer par le texte copié › **Publier**.
- [ ] Sur chaque iPhone : Profil › Sauvegarde en ligne › « Synchroniser maintenant » → la carte affiche **« Sauvegardé en ligne à l’instant »**.
- [ ] L’agenda partagé (onglet Agenda) montre toujours l’agenda de l’autre.

À savoir : depuis ces règles, un téléphone **sans compte** ne voit plus l’agenda partagé (la connexion anonyme n’y a plus accès) : il suffit de créer le compte.

## 4. Réinstallation : tout revient (sur un appareil de test, par exemple l’iPad)

- [ ] Sur l’autre iPhone : Agenda › « Partager mon agenda » › « Inviter » : copier le code `FONTESYNC1.…` (l’envoyer par Messages ou le coller dans Notes). Il faut ce code sur un appareil qui n’a jamais eu Fonte.
- [ ] Sur l’appareil de test : **faire une sauvegarde fichier**, puis supprimer Fonte de l’écran d’accueil (appui long › Supprimer l’app). Sur iPhone/iPad, cela efface aussi les données de Fonte sur cet appareil.
- [ ] Safari › adresse de Fonte › Partager › « Sur l’écran d’accueil » › ouvrir Fonte.
- [ ] Le questionnaire de départ s’ouvre : toucher **« J’ai déjà un compte Fonte : retrouver mes données »**, coller le code d’invitation, e-mail, mot de passe › « Me connecter ».
- [ ] Vérifier : nombre de séances, dernière séance, palier, le record noté, notes d’exercice, mesures, séances perso : **tout est revenu**. Le questionnaire ne revient pas.
- [ ] Essayer aussi « Mot de passe oublié ? » (l’e-mail vient de `noreply@…firebaseapp.com`, regarder les indésirables).

## 5. Mode avion puis retour du réseau

- [ ] Activer le mode avion. Faire une petite séance (ou supprimer puis remettre une séance depuis la corbeille).
- [ ] Profil › Sauvegarde en ligne : **« En attente du réseau : … changement(s) à envoyer »**. L’appli marche normalement.
- [ ] Couper le mode avion, revenir dans Fonte : la carte repasse à **« Sauvegardé en ligne »** (quelques secondes).
- [ ] Sur l’autre appareil du même compte (s’il y en a un) : la séance apparaît à l’ouverture de l’appli (ou au plus tard après 5 minutes appli ouverte).

## 6. Corbeille

- [ ] Historique › une séance › « Supprimer de l’historique ». Profil › Données › **Corbeille** › « Remettre » : la séance revient, avec la même charge proposée et le même palier qu’avant.

## 7. À dire à l’autre personne

- Ses données sont dans le projet Firebase **que tu gères**. Les règles empêchent quiconque de les lire depuis l’appli, mais **toi, en tant qu’administrateur, tu peux techniquement les voir dans la console Firebase**. Le seul moyen de l’empêcher (chiffrement par mot de passe) rendrait les données irrécupérables en cas d’oubli : non retenu.
- Garder son mot de passe ; en cas d’oubli : « Mot de passe oublié ? ».

## Si quelque chose ne va pas

- Rien n’est retiré du téléphone en cas d’erreur. La sauvegarde fichier de l’étape 0 reste la solution de secours (Profil › Données › Restaurer).
- Si une synchro a retiré des séances par erreur : Profil › Données › **« Revenir à l’état d’avant »** (copie de sécurité faite automatiquement avant), puis « Synchroniser maintenant » : elles reviennent partout.
- Noter le message exact affiché dans la carte « Sauvegarde en ligne » pour la prochaine session.
