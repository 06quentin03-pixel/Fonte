# Fonte Muscu — Plan d’amélioration (phase 2)

Date : 5 novembre 2026 · Base : branche `claude/audit-phase-1` (commit `c524b0a`, appli identique à `main` `029e2da`).
Règle de la phase : **aucun fichier de l’appli n’a été modifié** (`index.html`, `sw.js`, `manifest.webmanifest`, `tests/run.js`). Ce document est un plan, pas du code.

Sommaire
0. Ce qui a été vérifié pendant cette phase
1. Vérification de l’audit : ce qui est confirmé, ce qui est corrigé
2. Tes 5 décisions et leurs conséquences techniques
3. Firebase : difficultés, coûts, ce que tu devras faire
4. Liste des corrections (D, S, U, A)
5. Dépendances et ordre retenu
6. Découpage en sessions
7. Migration des données existantes
8. Stratégie de tests
9. Règles sportives et sources
10. Ce qui est reporté ou abandonné

---

## 0. Ce qui a été vérifié pendant cette phase

| Vérification | Résultat |
|---|---|
| `node tests/run.js` | **77 réussis, 0 en échec** |
| Relecture du code aux endroits cités par l’audit (`Cloud`, `Sync`, `RULES`, `run-discard`, `run-prev`, `hist-del`, `hist-clear`, `restoreData`, `loadState`, `loadRun`, `saveRunHistory`, `runLog`, `runSummary`, `prescribe`, `ECH`, `estCharge`, `progress`, `applySuggestions`, `phaseAdjust`, `progressTick`, `initProgress`, `plateau`, `sw.js`, manifeste) | Fait |
| Rejeu des exemples chiffrés de l’audit avec un script jetable (hors dépôt) qui charge le script « Base d’exercices » comme les tests | Fait, résultats en section 1 |
| `node tools/analyse-volume.js` | Chiffres de l’audit retrouvés |
| Vérification en ligne des références scientifiques (section 9) et des conditions de Firebase (section 3) | Fait ; ce qui n’a pas pu être vérifié est signalé |
| Non vérifié (impossible ici) | Vrai iPhone/iPad, vraie base Firebase, taille réelle des données sur vos deux téléphones |

---

## 1. Vérification de l’audit

### 1.1 Confirmé par la relecture du code

| # | Confirmé | Preuve relue |
|---|---|---|
| D1 | Oui | `Cloud.push()` n’écrit que `{prenom, events}` (l’agenda). Le reste n’existe que dans `localStorage`. |
| D2 | Oui | Écran de fin : bouton `run-discard` « Ne pas enregistrer » → `closeRunner()` → `clearRun()`, sans confirmation. (Dans la fenêtre « Arrêter la séance ? », le bouton « Abandonner » est déjà dans une fenêtre de confirmation : c’est acceptable.) |
| D3 | Oui | `hist-del` retire la séance et note la suppression, mais ne touche ni `S.lastPerf` ni `profile.phaseDone`. |
| D4 | Oui | Aucune action d’édition de l’historique. |
| D5 | Oui | `restoreData` remplace profil, historique, références, agenda sans copie préalable. |
| D6 | Oui | `loadRun` ignore une séance en cours de plus de 12 h ; elle n’est plus proposée. |
| D7 | Oui | `adoptPriv` / `Cloud.onSnap` : document entier, comparaison d’heures du téléphone (`upd`). |
| D8 | Oui | `v: 1` écrit mais jamais lu. Seule « migration » existante : `initProgress()` (calcule les paliers une fois). |
| D9 | Oui | `allow read: if request.auth != null` sur tous les agendas d’un espace ; pas de limite de taille. |
| D10 | Oui | `runSummary` : `volume += r × kg`, y compris le kg d’**assistance** ; un seul haltère compté. |
| S1 | Oui, **et plus large que décrit** | `progress("squat-barre", 5×5 @100)` → 102,5 kg ; `applySuggestions` applique `sg.next` quelle que soit la cible de répétitions. Sur l’ensemble des profils à 2 objectifs × niveaux × jours (semaines A et B), **161 combinaisons** prescrivent un même exercice à des répétitions qui diffèrent d’au moins 4 (ex. muscle + perte avancé : développé couché haltères à 10 et à 15 reps ; muscle + force : développé militaire haltères à 10 et à 5). |
| S2 | Oui | Muscle intermédiaire 4 j : fessiers 27, quadriceps 20,5, pecs 8, deltoïdes latéraux 6, deltoïdes postérieurs et abdos **0 fois en principal**. Perte intermédiaire 3 j : dorsaux 3, pecs 9, deltoïdes avant 13,5. |
| S3 | Oui | Muscle intermédiaire 3 j (Push/Pull/Legs) : tous les muscles 1×/semaine. Force débutant 3 j : quadriceps et pecs 1×/semaine. |
| S4 | Oui | `progressTick` : passage au bout de **36 séances** (3 j/sem) ; `estCharge` × 1,45 au niveau intermédiaire (développé couché : 27,5 → 42,5 kg). |
| S5 | Oui | Femme débutante, objectif muscle : presse pecs, tirage vertical, presse épaules, leg curl… « à l’échec » dès la 1ʳᵉ séance. Objectif forme : pont fessier, rowing élastique à l’échec. |
| S6 | Oui | `progress("pompes", 3×15)` → `null` ; `progress("planche", 45 s)` → `null`. |
| S7 | Oui, **et pire que décrit** | `plateau()` ne compare que la 1ʳᵉ et la dernière pesée : 70 → 69,4 → 69,0 → 70 (baisse réelle puis une pesée haute) est aussi déclaré « plateau ». |
| S8 | Oui | Palier 4 : 4×10 → 5×8, mais la charge suit la référence faite à 10 reps (donc un cran **au-dessus de la charge à 10**, trop léger pour 8). Au palier 3, l’exercice change souvent (haltères → barre) : la charge repart alors de l’estimation du profil. |
| S9, S10 | Oui | `e1rm` plafonné à 15 ; saisie des répétitions en réserve masquée en mode simple (`!simple()`). |
| U1 | Oui | `run-prev` efface toutes les séries saisies après l’étape visée (`R.log.map(l => l.filter(x => x.s < j))`). |
| U2 | Oui | Bip via `AudioContext` + `navigator.vibrate` : rien ne sonne écran verrouillé. |
| U3 | Oui | `"orientation": "portrait"` dans le manifeste. |
| U4, U5, A1–A3 | Oui | — |

### 1.2 Corrections et compléments à l’audit

1. **S1 est plus étendu** que « force + muscle » : 161 combinaisons concernées (voir ci-dessus).
2. **S2, mollets « souvent 0–2 »** : vrai pour force, perte, tonus ; **faux pour muscle intermédiaire 4 j** (9 séries, 2×/sem). La conclusion générale (déséquilibre) reste juste.
3. **S8** : la charge du palier 4 n’est pas dangereuse, elle est **trop légère** (l’audit disait « ne monte pas en conséquence », c’est exact, mais il faut préciser le sens).
4. **D1 — point manquant important** : la synchro Firebase actuelle utilise une **connexion anonyme**. L’identifiant anonyme est rangé dans le téléphone lui-même. Si le téléphone est perdu ou l’appli supprimée, cet identifiant disparaît avec, et une sauvegarde en ligne attachée à lui serait **inaccessible**. Étendre la synchro actuelle « telle quelle » ne protégerait donc pas contre la perte du téléphone. Il faut un vrai compte (voir section 3).
5. **D1 — risque « 7 jours » de Safari** : Safari efface les données d’un site non utilisé pendant 7 jours, mais les **applis ajoutées à l’écran d’accueil en sont exemptées** (WebKit). Le risque réel est donc : téléphone perdu/remplacé, appli supprimée de l’écran d’accueil (ce qui efface ses données), effacement des données Safari.
6. **Historique et références** (impact sur D3/D4/S1) : le journal d’une séance (`runLog`) n’enregistre **pas** le nombre de répétitions visé, seulement ce qui a été fait. On ne peut donc pas recalculer exactement les références de charge à partir de l’historique actuel. Il faudra enregistrer la cible désormais et garder les références actuelles comme point de départ (section 7).
7. **Références bibliographiques** (section 9) : « Bell et al. 2023, enquête » est inexact. Le consensus Delphi est **Bell et al. 2023** (*Sports Medicine – Open*), l’enquête est **Rogerson et al. 2024** (*Sports Medicine – Open*), et l’article 2022 de *Frontiers* porte sur l’avis des entraîneurs. Pelland et al. n’est plus une prépublication : il est paru dans *Sports Medicine* (2026). La position ACSM 2009 a été **remplacée par une nouvelle position ACSM** (2026).

---

## 2. Tes 5 décisions et leurs conséquences

Les réponses ont été données dans le message de lancement de la phase 2 ; elles sont notées ici telles quelles.

| # | Décision | Ce que cela implique | Cohérent avec l’architecture ? |
|---|---|---|---|
| 1 | **Firebase : OUI**, sauvegarde et synchro en ligne, hors ligne et copie locale conservés, sécurité et isolation prioritaires | Le téléphone reste la source principale (tout marche sans réseau) ; Firebase devient une **copie en ligne** par compte. Il faut des **comptes avec e-mail et mot de passe** (pas anonymes), des règles de sécurité « chacun ne lit que ses données », et une **corbeille** (une suppression synchronisée se propage partout). | Oui. Firebase est déjà chargé à la demande et mis en cache par `sw.js`. Le code `Cloud` actuel sert de base. Difficultés en section 3. |
| 2 | **Programmes actuels : NON** aux modifications automatiques | Aucune séance type, aucun programme ne change sans ton accord. Les problèmes S2/S3 sont **analysés et proposés** dans un document dédié ; seules les propositions que tu valides seront appliquées, dans la 2ᵉ partie de la session 3E. Un test automatique « photographie » les programmes actuels pour garantir qu’aucune session ne les modifie par erreur. | Oui. |
| 3 | **Échec : OUI, approche prudente**, pas d’échec systématique pour les débutants, gestion en RIR avec marge adaptée au niveau et à l’exercice | Les consignes « jusqu’à l’échec » sont remplacées par une **cible de répétitions en réserve** (RIR) selon le niveau et le type d’exercice (règles en section 9.3). C’est une modification de la prescription, que tu as validée. | Oui. Le champ `echec` et la saisie RIR existent déjà. |
| 4 | **Passage de niveau : PROPOSÉ**, jamais automatique | `progressTick` ne change plus le niveau seul ; Fonte affiche une **proposition argumentée** (régularité, progrès, durée), avec « Passer au niveau … » / « Plus tard ». Les charges ne sautent plus de +45 % : on garde tes charges réelles. | Oui. Change un comportement actuel (passage automatique) : c’est ta décision. |
| 5 | **Profils multiples : OUI**, sur un même appareil, profils/programmes/historiques/objectifs/statistiques indépendants | Les données passent d’un seul objet `fonte:v1` à **un espace par profil**. C’est le plus gros changement de format : il est regroupé avec les autres changements de format en **une seule migration** (section 7). Chaque profil peut être relié à **son propre compte Firebase**. | Oui, avec deux limites à connaître (ci-dessous). |

**Limites à connaître pour la décision 5** :
- Sur un appareil partagé, les profils sont **séparés, pas secrets** : quelqu’un qui tient l’iPad peut ouvrir l’autre profil. Un code à 4 chiffres serait possible mais ne protège pas vraiment (les données restent lisibles par un connaisseur). Proposition par défaut : pas de code ; on peut l’ajouter plus tard si tu le souhaites.
- La mémoire `localStorage` de Safari (environ 5 Mo par site, selon les estimations courantes ; à mesurer sur vos appareils en 3A) est **partagée entre les profils** d’un même appareil. À 2 personnes et 4 séances par semaine, cela reste largement suffisant pendant des années (le mécanisme actuel de résumé de l’historique ancien reste en place), mais la session 3A mesurera la taille réelle.

---

## 3. Firebase : difficultés, coûts, ce que tu devras faire

### 3.1 Difficultés techniques (à connaître avant de développer)

1. **Connexion anonyme insuffisante** (voir 1.2-4). → Chaque personne crée un **compte e-mail + mot de passe** dans Fonte. Le compte anonyme actuel est **relié** à ce nouveau compte (fonction Firebase « lier un compte ») : l’identifiant ne change pas, votre agenda partagé continue de marcher.
2. **Pourquoi pas « Se connecter avec Apple/Google »** : Fonte est hébergée sur GitHub Pages et s’ouvre comme appli d’écran d’accueil. Firebase documente que la connexion par redirection échoue sur les navigateurs qui bloquent le stockage tiers (Safari) quand le site n’est pas hébergé chez Firebase, et les fenêtres « popup » sont peu fiables dans une appli d’écran d’accueil sur iPhone. L’e-mail + mot de passe fonctionne partout, hors popup. (Ajout possible plus tard si Fonte est hébergée sur Firebase Hosting.)
3. **Synchroniser n’est pas sauvegarder** : si une séance est supprimée par erreur, la suppression part aussi en ligne. → **Corbeille de 30 jours** (rien n’est effacé définitivement tout de suite), copie de sécurité locale avant chaque opération lourde, et la sauvegarde fichier (iCloud Drive) reste proposée. Le plan gratuit de Firebase ne fournit pas, à ma connaissance, de sauvegardes automatiques de la base (fonction réservée au plan payant ; non revérifié en détail).
4. **Le propriétaire du projet Firebase voit tout** : la base Firebase est **ton** projet Google. Les règles empêchent ta copine de lire tes données et inversement **depuis l’appli**, mais toi, en tant qu’administrateur, tu peux techniquement voir ses données dans la console Firebase. Le seul moyen de l’empêcher serait un chiffrement dans l’appli avec un mot de passe à elle, qui rend les données irrécupérables si le mot de passe est oublié : **non recommandé** pour l’instant. Il faut le lui dire. Pour de futurs utilisateurs externes, il faudra une page « confidentialité » et une fonction « supprimer mon compte » (prévu, section 10).
5. **Conflits entre appareils** (D7) : aujourd’hui un document entier écrase l’autre. → Une **séance = un document** (deux appareils qui ajoutent chacun une séance ne s’écrasent plus), heure du serveur pour savoir ce qui est nouveau, fusion par rubrique pour le profil.
6. **Coût en lectures** : relire tout l’historique à chaque ouverture finirait par compter. → On ne télécharge que **ce qui a changé** depuis la dernière synchro.
7. **Premier lancement en ligne obligatoire** pour télécharger la bibliothèque Firebase (déjà le cas aujourd’hui ; ensuite elle est en cache hors ligne).
8. **Mode « artifact Claude »** : inchangé (il synchronise déjà via le compte Claude).

### 3.2 Coûts

- **Plan gratuit Spark** (sans carte bancaire), quotas Firestore publiés : 1 Gio stockés, 50 000 lectures, 20 000 écritures et 20 000 suppressions par jour (chiffres repris par plusieurs sources ; la page officielle des tarifs Firebase sera relue en 3C avant de figer le code).
- **Estimation pour vous deux** : une séance ≈ 2 Ko ; ≈ 400 séances/an/personne → moins de 1 Mo par personne et par an. Écritures : quelques-unes par séance ; lectures : quelques dizaines par jour avec la synchro « ce qui a changé ». **On reste à moins de 1 % des quotas gratuits : coût prévu 0 €.**
- La connexion par e-mail/mot de passe est gratuite (seule la connexion par SMS est payante).
- **Risque** : un bug qui écrirait en boucle pourrait atteindre le quota du jour ; la synchro s’arrêterait alors jusqu’au lendemain (les données restent sur le téléphone). → Le code limitera le rythme des écritures, et un test le vérifiera.
- **À éviter** : passer au plan payant « Blaze » sans raison (il demande une carte). Rien dans ce plan ne l’exige. Seule exception éventuelle : de vraies notifications de fin de repos écran verrouillé (U2), qui demanderaient un serveur d’envoi ; ce n’est **pas** prévu (section 10).
- Cloud Storage (fichiers) n’est plus inclus dans le plan gratuit depuis février 2026 (source secondaire) : Fonte n’en a pas besoin.

### 3.3 Ce que tu devras faire (session 3C, environ 10 minutes, guidé dans l’appli)

1. Console Firebase → Authentication → activer **« Adresse e-mail/Mot de passe »** (garder « Anonyme » activé pendant la transition).
2. Firestore → Règles → coller les **nouvelles règles** affichées par Fonte, publier.
3. Dans Fonte, chacun crée son compte (e-mail + mot de passe) dans Profil › Sauvegarde en ligne.
4. Vérifier sur le 2ᵉ appareil (ou après réinstallation) que l’historique revient.

---

## 4. Liste des corrections

Format de chaque fiche : **Utilisateur** = ce qui change pour vous · **Code** = fichiers et fonctions · **Risque** · **Test** · **Terminé quand**.
Les noms de fichiers « moteurs » (`js/…`) sont ceux créés en 3A ; avant 3A, tout est dans `index.html`.

### 4.1 Données et fiabilité technique

**D2 — Confirmation de « Ne pas enregistrer »** (3A)
- Utilisateur : toucher « Ne pas enregistrer » ouvre une fenêtre « Supprimer cette séance ? X séries seront perdues » (Supprimer / Revenir). Après suppression, un bandeau « Séance supprimée — Annuler » pendant 10 s.
- Code : `index.html` script 3 : écran de fin du lecteur (`renderRunner`, bouton `run-discard`), action `run-discard`, nouvelle action `run-undo-discard` (garde une copie de `R` en mémoire et dans `fonte:run-trash`).
- Risque : faible.
- Test : test navigateur (Playwright) : séance avec 3 séries → « Ne pas enregistrer » → la séance n’est pas supprimée avant confirmation ; « Annuler » la restaure.
- Terminé quand : aucun chemin ne supprime une séance contenant au moins une série sans confirmation ; « Annuler » fonctionne même après rechargement dans les 10 s.

**D5 — Copie de sécurité automatique avant restauration/réinitialisation** (3A)
- Utilisateur : avant « Restaurer », « Effacer l’historique », « Tout réinitialiser », Fonte garde une copie. Dans Profil › Données : « Revenir à l’état d’avant (date, heure) ».
- Code : `restoreData`, actions `hist-clear`, `reset-all` ; nouvelle fonction `snapshotLocal(reason)` → clé `fonte:undo` (une seule copie, la plus récente) ; action `undo-restore`.
- Risque : moyen (place mémoire : une copie double la taille). Si la copie ne tient pas, l’opération est **refusée** avec un message qui propose d’abord une sauvegarde fichier.
- Test : navigateur : état A → restauration B → « Revenir » → état A identique octet pour octet (comparaison JSON).
- Terminé quand : les 3 opérations destructives sont précédées d’une copie ou refusées ; le retour arrière est testé.

**D6 — Séance en cours de plus de 12 h** (3A)
- Utilisateur : au lieu de disparaître, l’accueil affiche « Séance du [date] non terminée : Enregistrer ce qui a été fait / Supprimer » (avec confirmation).
- Code : `loadRun` (ne plus filtrer à 12 h, renvoyer un indicateur `stale`), carte « Reprendre » de l’accueil, enregistrement à la **date de la séance** (pas aujourd’hui) via `saveRunHistory`.
- Risque : faible ; attention à la date enregistrée et au compteur de palier.
- Test : navigateur avec `fonte:run` daté de la veille.
- Terminé quand : aucune séance en cours n’est plus jamais ignorée en silence.

**D1-a — Rappel de sauvegarde renforcé (protection immédiate, avant Firebase)** (3A)
- Utilisateur : rappel après 10 séances **ou** 14 jours sans sauvegarde (au lieu de 30 jours), sauvegarde en un toucher vers Fichiers/iCloud Drive ; le rappel disparaît dès que la sauvegarde en ligne (3C) est active.
- Code : fonction du rappel de sauvegarde (`backupAgo` et la carte d’accueil associée), `dataPayload`.
- Risque : faible (agacement si trop fréquent → bouton « Me le rappeler dans 7 jours »).
- Test : navigateur avec date de dernière sauvegarde simulée.
- Terminé quand : le rappel apparaît aux bons moments et la sauvegarde produite se restaure (test aller-retour).

**D8 — Version du format et cadre de migration** (3A pour le cadre, 3B pour la migration réelle)
- Utilisateur : rien de visible.
- Code : nouveau `js/engine-user.js` : `SCHEMA_VERSION`, `migrate(raw)` (chaîne v1→v2→…), `loadState`, `saveLocal`, `restoreData` passent tous par `migrate`. Documentation du format dans `docs/FORMAT_DONNEES.md`.
- Risque : élevé si mal fait (perte de données) → stratégie complète en section 7.
- Test : jeux de données v1 de référence (section 8) chargés et migrés en Node.
- Terminé quand : chaque format connu se charge, un format inconnu (plus récent) est **refusé sans rien écraser**, et les tests de migration passent.

**U4 — Profils multiples** (3B)
- Utilisateur : en haut du Profil, « Changer de profil » (prénoms + initiale) ; « Ajouter un profil » lance le questionnaire d’accueil ; chaque profil a ses programmes, historique, objectifs, statistiques, notes, mesures, réglages de séance et séance en cours. L’agenda partagé reste visible depuis chaque profil (chacun voit celui de l’autre, comme aujourd’hui). Au premier lancement après mise à jour, vos données actuelles deviennent le **profil 1**, sans rien perdre.
- Code : `engine-user.js` : clés `fonte:profiles` (liste, profil actif) et `fonte:p:<id>` (données), `fonte:p:<id>:run` ; `S` devient l’état du profil actif ; `switchProfile(id)` (enregistre, ferme le lecteur, recharge `S`, `render()`). Les réglages d’appareil (`fonte:ui`, `fonte:noinstall`, rappel) restent communs.
- Risque : élevé (toutes les lectures/écritures de `S` passent par là ; risque de mélanger deux profils). Interdiction de changer de profil pendant une séance en cours.
- Test : navigateur : créer 2 profils, faire une séance dans chacun, vérifier qu’aucune donnée de l’un n’apparaît dans l’autre (historique, records, « Mes muscles », lastPerf, palier, agenda personnel) ; Node : migration v1 → profil 1.
- Terminé quand : test d’isolation vert sur toutes les rubriques listées ; migration vérifiée sur les jeux de données de référence.

**D3 — Supprimer une séance recalcule références et palier** (3B)
- Utilisateur : après suppression d’une séance (ou d’une faute de frappe), la charge proposée et l’avancement du palier reviennent à ce qu’ils seraient sans elle.
- Code : `engine-training.js` : `rebuildRefs(historique, legacyRefs)` (recalcule les références par exercice et par zone de répétitions à partir de l’historique) et `rebuildProgress(historique)` (même logique que `initProgress`) ; appelés par `hist-del`, la future édition (D4), la synchro.
- Risque : moyen. Les séances anciennes n’ont pas la cible de répétitions (1.2-6) : pour elles, on garde la référence `lastPerf` actuelle comme point de départ.
- Test : Node : historique de 5 séances, suppression de celle à 600 kg → la référence revient à la précédente ; palier décrémenté.
- Terminé quand : supprimer puis recalculer donne le même résultat que si la séance n’avait jamais existé (test de propriété sur des historiques générés).

**D1 / D7 / D9 — Sauvegarde et synchro en ligne des données personnelles** (3C)
- Utilisateur : Profil › « Sauvegarde en ligne » : créer un compte / se connecter (par profil). Ensuite, tout se copie seul en ligne ; sur un nouvel appareil, on se connecte et tout revient. Indicateur clair : « Sauvegardé en ligne il y a 2 min » / « En attente du réseau ». Corbeille 30 jours pour les séances supprimées.
- Code : `engine-user.js` (`Cloud` étendu) : compte e-mail (création, connexion, mot de passe oublié, déconnexion), liaison du compte anonyme, un « app » Firebase nommé par profil (chaque profil garde sa connexion), modèle `users/{uid}` (profil, notes, mesures, réglages, séances perso, références anciennes) + `users/{uid}/seances/{id}` (une séance par document, suppression = marque `del` + date), lecture incrémentale par date serveur, fusion, limiteur d’écritures. Nouvelles règles `RULES` (section 3.3). Espace d’agenda : lecture réservée aux membres connectés avec un vrai compte, taille des listes limitée.
- Risque : élevé (sécurité, conflits, quotas). Le téléphone reste la référence : une erreur de synchro ne doit jamais effacer de données locales.
- Test : Node (fusion, corbeille, limiteur) ; règles testées avec l’émulateur Firebase si l’installation est possible dans la session, sinon liste de vérifications manuelles ; vérifications à la main sur vos deux iPhone (section 8.3).
- Terminé quand : (1) un appareil réinitialisé retrouve tout après connexion ; (2) un compte ne peut ni lire ni écrire les données d’un autre (test des règles) ; (3) deux appareils hors ligne qui ajoutent chacun une séance gardent les deux ; (4) l’appli fonctionne entièrement sans réseau ; (5) aucune donnée locale n’est perdue si Firebase répond par une erreur.

**D4 — Modifier une séance enregistrée, ajouter une séance faite sans l’appli** (3D)
- Utilisateur : dans l’historique, « Modifier » (date, séries, charges, répétitions, ressenti, supprimer/ajouter une série) ; « Ajouter une séance passée ».
- Code : nouvel écran d’édition (script interface), `saveHistEdit(id, entry)` → `rebuildRefs`, `rebuildProgress`, `findRecords` recalculés, synchro.
- Risque : moyen (records et courbes à recalculer).
- Test : navigateur + Node (records et références après modification).
- Terminé quand : une correction de 600 → 60 kg corrige la référence, la courbe et les records.

**D10 — Volume affiché juste** (3D)
- Utilisateur : le « volume » d’une séance ne compte plus l’assistance comme du poids ; les exercices à 2 haltères comptent les 2.
- Code : `runSummary`, `exSeries` (`vol`), éventuel champ « nombre d’haltères » dans `LOAD` (option `S` déjà présente pour un seul haltère).
- Risque : faible (les anciens volumes restent tels qu’enregistrés ; seuls les nouveaux calculs changent, c’est indiqué).
- Test : Node.
- Terminé quand : volume = Σ reps × charge réellement soulevée, testé sur haltères, barre, assistance.

### 4.2 Fiabilité sportive

**S1 — Référence de charge selon le nombre de répétitions**
- S1-a, garde-fou immédiat (3A) — Utilisateur : si la séance prévue vise un nombre de répétitions très différent de la dernière fois (écart ≥ 3), la charge proposée est **convertie** (via le 1RM estimé) au lieu d’être simplement augmentée : plus de 102,5 kg pour 10 répétitions après un 5×5 à 100 kg (1RM estimé 116,7 kg → 87,5 kg pour 10 reps, moins la marge de prudence de 5 % → ≈ 82,5 kg, arrondi au matériel). Code : `applySuggestions` (script 3) et nouvelle fonction pure `convertLoad(id, lp, targetReps)` (script 1). Risque : faible. Test : Node (cas de l’audit + 161 combinaisons : plus aucune charge proposée au-dessus de la charge convertie + 1 cran). Terminé quand : le cas de l’audit propose une charge réalisable et le test couvre toutes les combinaisons à 2 objectifs.
- S1-b, correction complète (3B pour le format, 3D pour l’usage) — Utilisateur : Fonte retient **une référence par exercice et par zone** (force ≤ 6 reps, muscle 7–12, endurance ≥ 13) et progresse dans chaque zone séparément. Code : format v2 `refs[id][zone]`, `progress` inchangé dans son principe mais appelé avec la référence de la bonne zone ; à défaut, conversion S1-a avec marge de prudence. Risque : moyen (migration). Test : Node. Terminé quand : en force + muscle, le squat progresse séparément à 5 et à 10 répétitions, et la migration conserve les références existantes dans leur zone.

**S8 — Palier 4 : charge ajustée** (3D)
- Utilisateur : quand le palier 4 baisse les répétitions (10 → 8), la charge proposée monte en conséquence (conversion S1-a).
- Code : `phaseAdjust` (marque `it.base` / `it.repsFrom`), `applySuggestions`.
- Risque : faible. Test : Node. Terminé quand : au palier 4, la charge proposée est ≥ celle du palier 3 pour le même exercice.

**S5 — Échec remplacé par une cible de répétitions en réserve** (3D, décision 3)
- Utilisateur : plus de « jusqu’à l’échec » pour les débutants ; chaque exercice affiche une cible « garde 2 répétitions en réserve » (ou 1, selon niveau et exercice), expliquée dans « Les mots de la muscu ». Les exercices chronométrés (planche…) n’affichent jamais « échec » mais une durée.
- Code : `ECH`, `prescribe` (champ `rir` cible à la place de/en plus de `echec`), `deloadSe`, `phaseAdjust` (`it.echec`), affichage dans le lecteur, `progress` (utilise la cible RIR pour juger « facile/limite »). Règles chiffrées en 9.3.
- Risque : moyen (touche toutes les séances ; c’est voulu et validé). Le test « photographie des programmes » sera mis à jour **uniquement** pour ce champ.
- Test : Node : aucune séance débutant ne contient `echec`; pour chaque niveau, la cible RIR respecte le tableau 9.3.
- Terminé quand : test vert sur toutes les combinaisons de profils.

**S6 — Progression au poids du corps et chronométrée** (3D)
- Utilisateur : pompes, tractions, gainage reçoivent aussi un conseil : « +1 à 2 répétitions », « +5 à 10 s », puis « passe à la version plus dure » (table `HARDER` existante) quand le haut de la fourchette est atteint 2 séances de suite.
- Code : `progress` (branche sans charge), `perfLine`, utilisation de `HARDER`/`harderEx`.
- Risque : faible. Test : Node. Terminé quand : `progress("pompes", 3×15)` et `progress("planche", 45 s)` renvoient un conseil.

**S7 — Plateau de poids sur une moyenne** (3D)
- Utilisateur : « ton poids ne baisse plus » seulement si la **moyenne des pesées** de la dernière semaine n’est pas plus basse que celle d’il y a 3 semaines (au moins 3 pesées de chaque côté) ; sinon un message invite à se peser plus souvent, sans ajouter de cardio.
- Code : `plateau()`.
- Risque : faible (le cardio ajouté arrivera moins souvent ; c’est le but).
- Test : Node (cas 70 → 69,8 avec 2 pesées → pas de plateau ; série en baisse avec une pesée haute → pas de plateau ; vraie stagnation → plateau).
- Terminé quand : les 3 cas passent.

**S4 — Passage de niveau proposé, jamais automatique** (3D, décision 4)
- Utilisateur : une carte « Tu pourrais passer au niveau intermédiaire » explique pourquoi (régularité, progrès, durée) ; « Passer » / « Plus tard » ; on peut aussi changer de niveau soi-même dans le profil, comme aujourd’hui. Les charges réelles sont gardées (pas de +45 %).
- Code : `progressTick` (plus de changement de `niveau`, renvoie `levelSuggest`), `tickProgress`, `applyTick`, carte d’accueil, `estCharge` utilisé seulement pour les exercices jamais faits. Critères en 9.4.
- Risque : faible. Test : Node (36 séances ne changent plus le niveau ; la proposition apparaît quand les critères sont réunis).
- Terminé quand : aucun chemin du code ne change `profile.niveau` sans action de l’utilisateur.

**S9 — 1RM estimé** (3D) : mention « estimation peu fiable au-delà de 10 répétitions » sous les courbes quand c’est le cas ; pas de changement de calcul. Test : navigateur. Terminé quand : la mention apparaît uniquement pour ces points.

**S10 — Répétitions en réserve en mode simple** (3D) : en mode simple, la question devient « C’était : facile / juste / très dur » (déjà proche du « ressenti » existant), convertie en RIR approximatif (3 / 1 / 0) pour la progression. Test : Node + navigateur. Terminé quand : la progression utilise ce ressenti en mode simple.

**S2 / S3 — Équilibre et fréquence des programmes** (3D : analyse et propositions ; 3E : application de ce que tu valides — décision 2)
- Utilisateur : en 3D, rien ne change dans vos séances. Tu reçois `docs/PROPOSITIONS_PROGRAMMES.md` : pour chaque objectif/niveau/nombre de jours, les séries par muscle et par semaine, la fréquence, ce qui sort des repères (section 9.1–9.2), et une proposition précise (ex. muscle intermédiaire 3 j : Push/Pull/Legs → Haut/Bas/Full body ; ajout de deltoïdes latéraux ; perte 3 j : un tirage de plus). Tu coches ce que tu acceptes.
- Code (3D) : `tools/analyse-volume.js` enrichi (repères, alertes) ; test « photographie » qui **garantit** que les programmes ne changent pas. Code (3E) : séances types et `PLANS` uniquement pour les propositions acceptées.
- Risque : nul en 3D ; moyen en 3E (vos séances changent, avec votre accord).
- Terminé quand (3D) : le document existe et couvre les 5 objectifs × 3 niveaux × 2 à 6 jours. (3E) : chaque proposition acceptée est appliquée et vérifiée par l’outil d’analyse, les autres programmes sont identiques à la photographie.

### 4.3 Expérience utilisateur

**U1 — Tableau des séries d’un exercice** (3E)
- Utilisateur : dans le lecteur, un bouton « Séries » montre le tableau de l’exercice en cours (séries faites, à faire) : modifier une série déjà faite, en ajouter une, sans effacer les autres. « Précédent » ne supprime plus rien.
- Code : `renderRunner`, `run-prev` (navigation sans effacement), nouvelles actions d’édition de `R.log`, `runLog`.
- Risque : moyen (cœur du lecteur). Test : navigateur (séance complète avec retours en arrière). Terminé quand : aucune série saisie n’est perdue par la navigation ; le mode guidé actuel reste le mode par défaut.

**U2 — Fin de repos signalée** (3E)
- Utilisateur : au retour dans l’appli après la fin du repos, signal sonore + écran clair « Repos terminé depuis 40 s » ; option « garder l’écran allumé pendant le repos » (déjà active pendant la séance) mise en avant. Limite expliquée honnêtement : écran verrouillé, une web-app iPhone ne peut pas sonner sans serveur d’envoi de notifications.
- Code : `tick`, gestion de `visibilitychange`, `beep` (le vibreur n’est pas pris en charge par Safari sur iPhone : à confirmer sur appareil).
- Risque : faible. Test : navigateur (simulation de mise en arrière-plan) + vérification manuelle iPhone. Terminé quand : le retour dans l’appli après un repos terminé déclenche toujours le signal.

**U3 — iPad** (3E) : mise en page 2 colonnes au-delà de ~900 px (liste + détail, lecteur avec tableau des séries à côté), suppression de `"orientation": "portrait"` du manifeste. Test : captures navigateur iPad portrait/paysage + vérification manuelle. Terminé quand : aucune zone vide de plus d’un tiers de l’écran et rien de coupé en paysage.

**U5 — Police hors ligne** (3E) : polices Archivo et Big Shoulders (licence libre OFL) copiées dans le dépôt et mises en cache par `sw.js`. Test : navigateur hors ligne dès le 1ᵉʳ lancement. Terminé quand : aucune requête vers Google Fonts.

### 4.4 Maintenabilité

**A1 / A3 — Quatre moteurs en fichiers séparés, sans outil de construction** (3A)
- Utilisateur : rien de visible (même appli, même vitesse, hors ligne identique).
- Code : `js/engine-pedago.js` (exercices `EX`, `LOAD`, animations), `js/engine-training.js` (prescriptions, programmes, paliers, progression), `js/engine-analytics.js` (records, courbes, volume, régularité, `exSeries`, `findRecords`), `js/engine-user.js` (état, stockage, migrations, sauvegarde, synchro), `js/app.js` (interface, inchangée sur le fond). Simples `<script src>` chargés dans l’ordre ; `sw.js` : liste `SHELL` complétée et `VERSION` changée ; le mode « artifact Claude » (fichier unique) est conservé grâce à un petit script `tools/assemble.js` qui recolle les fichiers en un seul `index.html` à la demande (outil facultatif, pas une étape de construction obligatoire).
- Justification : pouvoir tester chaque moteur seul, en Node, et faire évoluer l’un sans toucher les autres. On ne réécrit pas l’interface.
- Risque : moyen (ordre de chargement, cache hors ligne : un fichier manquant dans `SHELL` casserait le hors ligne). Point d’attention : pendant la mise à jour, l’ancien `index.html` en cache et les nouveaux fichiers doivent rester cohérents → `VERSION` changée, tous les fichiers dans le même cache.
- Test : les 77 tests + photographie des programmes + test navigateur hors ligne (couper le réseau, recharger).
- Terminé quand : comportement identique (photographie identique, aucun test modifié sauf le chemin de chargement), hors ligne vérifié, artifact assemblé qui s’ouvre.

**A2 — Tests de l’état, de la sauvegarde, de la synchro, du lecteur** : répartis dans chaque session (section 8) ; consolidés en phase 4.

---

## 5. Dépendances et ordre retenu

Le 6 novembre 2026, à la demande du propriétaire, les 8 sessions prévues (3a à 3h) ont été regroupées en **5 sessions (3A à 3E)**. Correspondance : 3a + 3b → **3A** ; 3c → **3B** ; 3d → **3C** ; 3e + 3f → **3D** ; 3g + 3h → **3E**. Les fiches de la section 4 utilisent déjà la nouvelle numérotation.

```
3A Filet de sécurité, puis moteurs séparés ──► 3B Format v2 + profils ──► 3C Firebase ──► 3D Charges, historique, règles sportives ──► 3E Séance, iPad, programmes validés
                                                                                                              │
                                                                                               propositions de programmes validées par toi
tout ──► 4 Tests complets ──► 5 Validation
```

- **3A, dans cet ordre à l’intérieur de la session** : d’abord le filet de sécurité (D2, D5, D6, D1-a, S1-a) et les tests navigateur, enregistrés dans un premier commit ; ensuite seulement le découpage en moteurs, dans un second commit. Les tests écrits en première partie protègent le découpage. Si le temps manque, le découpage s’arrête à une étape propre (moteurs déjà séparés et testés) et le reste passe au début de 3B ; on ne laisse jamais un découpage à moitié.
- **3A avant 3B** : la migration et les profils sont le changement le plus risqué ; ils doivent être testables en Node, donc le moteur « utilisateur » doit être séparé avant.
- **3B reste seule** : une seule migration regroupe tous les changements de format : profils (U4), références par zone (S1-b), cible de répétitions dans le journal (D3/D4), marques de suppression et dates par séance (D7). Migrer une seule fois limite le risque.
- **3B et 3C ne sont pas regroupées** : entre les deux, tu vérifies sur vos deux iPhone que toutes vos données sont là après la migration. Une erreur de migration non vue serait sinon recopiée en ligne sur tous les appareils.
- **Profils (3B) avant Firebase (3C)** : la sauvegarde en ligne est rattachée à chaque profil ; faire l’inverse obligerait à refaire le modèle en ligne.
- **3D après 3C** : l’édition de l’historique (D4) doit se synchroniser proprement. Charges et règles sportives sont regroupées parce qu’elles touchent les mêmes fonctions (`progress`, `applySuggestions`, `prescribe`, `phaseAdjust`, `progressTick`) : on n’y touche qu’une fois.
- **3E après 3D** : le tableau des séries (U1) réutilise l’édition de séance (D4), et les programmes ne sont modifiés qu’après ta validation des propositions produites en fin de 3D. Si tu n’as rien validé, 3E se limite à la séance et à l’iPad.

---

## 6. Découpage en sessions

Une session = une phase = une branche `claude/phase-3x-…`, terminée par : tests lancés et résultats notés, `PROJECT_STATUS.md` à jour, prompt de la session suivante, commit et push, pas de pull request sans ton accord.
Sessions regroupées = sessions plus longues : chacune est découpée en parties, avec un commit par partie, pour pouvoir s’arrêter proprement si le temps manque. La partie non faite est alors reportée **au début** de la session suivante et notée dans `PROJECT_STATUS.md`.

| Session | Contenu (dans l’ordre) | Taille estimée | Ce que tu vérifies à la main |
|---|---|---|---|
| **3A** Filet de sécurité + moteurs séparés | Partie 1 : D2, D5, D6, D1-a, S1-a ; tests navigateur (Playwright) ; jeux de données v1 de référence ; mesure de la taille des données. Partie 2 : A1/A3, D8 (cadre), photographie des programmes, `tools/assemble.js`, `sw.js` | Grande (partie 1 ≈ 150–300 lignes modifiées ; partie 2 surtout du déplacement de code) | Fin de séance → « Ne pas enregistrer » ; restauration puis « Revenir » ; rappel de sauvegarde ; l’appli s’ouvre et marche en mode avion après la mise à jour |
| **3B** Format v2 + profils | U4, migration v1→v2, S1-b (format), D3, `docs/FORMAT_DONNEES.md` | **Grande** : si le temps manque, l’interface « Ajouter un profil » peut glisser au début de 3C, jamais la migration à moitié | Vos données sont toutes là après la mise à jour (checklist 8.3), sur les deux iPhone ; création d’un 2ᵉ profil sur l’iPad |
| **3C** Firebase | D1, D7, D9, comptes, règles, corbeille, limiteur | Grande | Étapes 3.3 ; réinstallation d’un appareil et récupération |
| **3D** Charges, historique, règles sportives | Partie 1 : S1-b (usage), S8, D4, D10, S9. Partie 2 : S5, S6, S7, S4, S10, `docs/REGLES_SPORTIVES.md`, `docs/PROPOSITIONS_PROGRAMMES.md` | Grande | Corriger une séance, ajouter une séance passée ; lire et valider les propositions de programmes |
| **3E** Séance, iPad, programmes validés | Partie 1 : U1, U2, U3, U5. Partie 2 (si tu as validé des propositions) : S2/S3 acceptés | Moyenne à grande | Une vraie séance avec retours en arrière ; iPad en paysage ; vos nouvelles séances |
| **4** Tests complets | Non-régression, migration sur copies réelles anonymisées, rejeu de l’audit, essais iPhone/iPad | Moyenne | Checklist complète |
| **5** Validation | Compte rendu, README, problèmes restants, page confidentialité | Petite | Relecture |

---

## 7. Migration des données existantes

Objectif absolu : **ne jamais perdre une donnée déjà enregistrée sur vos deux iPhone.**

### 7.1 Format actuel (v1)
`localStorage` : `fonte:v1` (tout l’état `S`), `fonte:run` (séance en cours), `fonte:sync` (config Firebase + espace), `fonte:ui`, `fonte:noinstall`, `fonte:rappel`. Les sauvegardes fichier/code `FONTEDATA1.` contiennent le même contenu (sans `histDel`, `partners`, `hidden`).

### 7.2 Format cible (v2, introduit en 3B)
- `fonte:profiles` = `{ v: 2, active: "<id>", list: [{ id, prenom, cree, uid? }] }`
- `fonte:p:<id>` = état du profil : contenu actuel de `S` + `v: 2` + `refs` (références par exercice et zone, issues de `lastPerf`) + `legacyRefs` (copie de `lastPerf` v1, jamais modifiée, sert de point de départ au recalcul) ; chaque séance de l’historique reçoit `upd` (et `del` en cas de suppression, 30 jours) ; les nouvelles séances enregistrent la cible `t` (répétitions visées) dans chaque série.
- `fonte:p:<id>:run`, `fonte:p:<id>:sync` (compte Firebase du profil).
- Communs à l’appareil : `fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync` (espace d’agenda partagé).

### 7.3 Déroulement (au premier lancement de la version 3B)
1. Lire `fonte:v1` **sans le modifier**.
2. Construire l’état v2 en mémoire (`migrate`, fonction pure testée en Node).
3. Écrire `fonte:p:<id>` puis **relire et comparer** (nombre de séances, de mesures, de notes, profil) avant d’écrire `fonte:profiles`.
4. Si l’écriture échoue (mémoire pleine) : résumer davantage l’historique **dans la copie** (mécanisme `trimHist` existant) et réessayer ; si cela échoue encore, **rester sur v1**, afficher « Fais une sauvegarde avant la mise à jour » et ne rien effacer.
5. `fonte:v1` est **conservé** tel quel comme copie de secours pendant au moins 2 mises à jour ; il ne sera supprimé qu’avec ton accord (bouton « Libérer de la place » qui propose d’abord une sauvegarde fichier).
6. **Garde anti-retour** : si `fonte:v1` a été modifié après la migration (cas d’une ancienne version encore ouverte), la migration est rejouée et fusionnée (séances par identifiant) au lieu d’être ignorée.
7. Toute restauration (fichier `FONTEDATA1.`, code, synchro Claude) passe par la même fonction `migrate` : **les anciennes sauvegardes resteront restaurables indéfiniment**.
8. Une donnée d’un format **plus récent** que l’appli (appareil pas encore mis à jour qui reçoit des données synchronisées) n’est jamais écrasée : l’appli demande de se mettre à jour.

### 7.4 Ce qui est testé
Jeux de données v1 de référence (créés en 3A, dans `tests/fixtures/`) : vide ; premier lancement ; profil ancien sans `objectifs` ; usage typique 6 mois ; historique de 3 000 séances avec séances résumées ; données proches du plein ; JSON abîmé ; sauvegarde `FONTEDATA1.` ; séance en cours. Pour chacun : migration, puis comparaison champ à champ (aucune séance, mesure, note, référence perdue), puis aller-retour sauvegarde → restauration identique.

### 7.5 Ce que tu fais avant la mise à jour 3B
Une sauvegarde fichier vers iCloud Drive sur chaque iPhone (le prompt de 3B le rappellera). C’est une précaution, pas une nécessité.

---

## 8. Stratégie de tests

### 8.1 Automatique (lancé à chaque session et par GitHub Actions)
| Type | Outil | Contenu |
|---|---|---|
| Calculs | `node tests/run.js` (sans dépendance, existant) | 77 tests actuels + nouveaux tests par correction (S1, S5–S8, D3, D10…) |
| Photographie des programmes | Node | Toutes les combinaisons objectif × niveau × jours × palier × semaine A/B : séances, exercices, séries, répétitions. Toute différence fait échouer le test, sauf mise à jour volontaire et justifiée (S5 en 3D, propositions validées en 3E). |
| Bornes sportives (rapport) | `tools/analyse-volume.js` | Séries/semaine, fréquence, rapport tirage/poussée : **rapport**, pas d’échec (décision 2), jusqu’à 3E. |
| Migration et état | Node (après 3A) | Section 7.4 ; sauvegarde/restauration aller-retour ; stockage plein simulé. |
| Synchro | Node avec faux Firestore | Fusion, corbeille, conflits deux appareils, limiteur d’écritures, format plus récent refusé. |
| Règles Firebase | Émulateur Firebase (`firebase-tools`, Java) si installable dans la session et en CI | Lecture/écriture croisées interdites, compte anonyme refusé sur les données perso, tailles. Sinon : checklist manuelle documentée, et le plan le dit. |
| Navigateur | Playwright (déjà présent dans l’environnement de travail ; installé en CI uniquement pour les tests, rien n’est ajouté à l’appli) | iPhone 13 et iPad Pro simulés : séance complète, D2, D5, D6, profils, hors ligne (réseau coupé + rechargement), mise à jour du service worker, aucune erreur JavaScript. |

### 8.2 Ce que les tests automatiques ne peuvent pas prouver
Safari réel, comportement en arrière-plan d’iOS, vraie base Firebase, vrais quotas, données réelles de vos téléphones.

### 8.3 À vérifier à la main (checklists fournies à chaque session)
- **Après chaque mise à jour** : l’appli s’ouvre en mode avion ; l’historique, les records, le palier et la prochaine séance sont identiques à avant (noter avant la mise à jour : nombre de séances, dernière séance, palier, un record).
- **3A** : « Ne pas enregistrer » demande confirmation ; « Annuler » ; restauration puis « Revenir » ; après la mise à jour, l’appli s’ouvre et marche en mode avion.
- **3B** : checklist ci-dessus sur les **deux** iPhone ; création d’un 2ᵉ profil sur l’iPad ; séance dans chaque profil ; vérifier que rien ne se mélange.
- **3C** : section 3.3 ; supprimer l’appli de l’écran d’accueil d’un appareil de test, la réinstaller, se connecter, tout revient ; mode avion puis retour du réseau.
- **3D** : corriger une séance, ajouter une séance passée ; les cibles « répétitions en réserve » s’affichent ; lire et valider les propositions de programmes.
- **3E** : séance réelle avec repos écran allumé/éteint ; iPad paysage ; nouvelles séances si des propositions ont été validées.

---

## 9. Règles sportives et sources

État de vérification : ✅ vérifiée en ligne pendant cette phase (titre, revue, volume/pages ou DOI) · ⚠️ partiellement (résumé seulement) · ❌ non vérifiée.

### 9.1 Volume par muscle et par semaine (S2)
- Règle proposée : prise de muscle → **au moins 10 séries « pondérées » par muscle principal et par semaine** (1 série pour un muscle principal, ½ pour un secondaire, méthode actuelle), avec une zone d’alerte au-delà d’environ 20–25 pour un muscle donné quand d’autres sont sous 10 (déséquilibre plutôt que plafond strict). Utilisée pour **signaler** et **proposer**, pas pour modifier seule (décision 2).
- Justification : relation dose-réponse entre volume et hypertrophie, avec rendements décroissants.
- Sources :
  - Schoenfeld, Ogborn, Krieger (2017). *Journal of Sports Sciences* 35(11) : 1073–1082. DOI 10.1080/02640414.2016.1210197 ✅. Limite : la méta-analyse ne distingue les doses que jusqu’à « 10 séries et plus », surtout chez des non-entraînés.
  - Pelland, Remmert, Robinson, Hinson, Zourdos. *The Resistance Training Dose Response: Meta-regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains*. *Sports Medicine* 56(2) : 481–505 (2026, en ligne 2025). DOI 10.1007/s40279-025-02344-w ✅ (référence ; contenu vérifié sur le résumé ⚠️). Appuie le comptage « fractionnaire » (½ pour un muscle secondaire) et les rendements décroissants.
- Point honnête : il n’existe pas de chiffre « idéal » unique ; les bornes servent de repères.

### 9.2 Fréquence (S3)
- Règle proposée : viser **2 séances par semaine par muscle** quand le nombre de jours le permet (≥ 3 jours), surtout pour les grands mouvements chez le débutant en force.
- Sources :
  - Schoenfeld, Ogborn, Krieger (2016). *Sports Medicine* 46(11) : 1689–1697. DOI 10.1007/s40279-016-0543-8 ✅ (≥ 2×/sem > 1×/sem pour l’hypertrophie, études non égalisées en volume).
  - Grgic, Schoenfeld, Davies et al. (2018). *Sports Medicine* 48(5) : 1207–1220. DOI 10.1007/s40279-018-0872-x ✅. **Nuance** : à volume égal, pas d’effet significatif de la fréquence sur la force ; l’intérêt de 2×/sem vient surtout de la répartition du volume. L’audit présentait cette source un peu trop favorablement.
  - Pelland et al. (2026) ✅ : la fréquence a un effet identifiable sur la force, pas clairement sur l’hypertrophie au-delà du volume.
- Conséquence : la fréquence 2×/sem est un **moyen pratique** de répartir le volume, pas une obligation ; c’est pourquoi ce sont des **propositions** (décision 2).

### 9.3 Proximité de l’échec, RIR (S5, S10 — décision 3)
- Règle proposée (cibles de répétitions en réserve) :

| Niveau | Grands mouvements libres (squat, soulevé de terre, développés, rowing barre) | Machines, poulies, isolation | Poids du corps (pompes, tractions…) | Chronométrés (gainage) |
|---|---|---|---|---|
| Débutant | RIR 3 (palier 1), puis 2 | RIR 2 | RIR 2 | durée cible, jamais « échec » |
| Intermédiaire | RIR 2 (1 sur la dernière série au palier 4) | RIR 1, dernière série RIR 0–1 possible | RIR 1 | durée cible |
| Avancé | RIR 1–2 | dernière série à l’échec possible (liste `ECH`) | RIR 0–1 | durée cible |

Semaine allégée et séance de reprise : RIR 3 partout (cohérent avec `deloadSe`).
- Justification : l’échec n’apporte pas d’avantage clair sur la force ou l’hypertrophie par rapport à s’arrêter près de l’échec, et augmente la fatigue ; les débutants apprennent le geste ; l’estimation des répétitions restantes est imprécise d’environ 1 répétition, d’où une marge plus grande chez le débutant et sur les mouvements où rater est risqué.
- Sources :
  - Refalo, Helms, Trexler, Hamilton, Fyfe (2023). *Sports Medicine* 53(3) : 649–665. DOI 10.1007/s40279-022-01784-y ✅ (pas d’avantage clair de l’échec « momentané » ; relation possiblement non linéaire).
  - Grgic, Schoenfeld, Orazem, Sabol (2022). *Journal of Sport and Health Science* 11(2) : 202–211. DOI 10.1016/j.jshs.2021.01.007 ✅ (pas de différence significative force/hypertrophie ; petit avantage hypertrophie de l’échec chez les entraînés → justifie l’échec ponctuel chez l’avancé).
  - Helms, Cronin, Storey, Zourdos (2016). *Strength and Conditioning Journal* 38(4) : 42–49. DOI 10.1519/SSC.0000000000000218 ✅ (échelle RIR).
  - Halperin et al. (2022). *Sports Medicine* 52(2) : 377–390 ✅ (sous-estimation moyenne ≈ 1 répétition, indépendante du niveau d’entraînement).
- Point honnête : les valeurs exactes du tableau (3, 2, 1) sont une **application prudente** de ces résultats, pas des chiffres issus directement d’une étude. Elles seront présentées comme telles dans `docs/REGLES_SPORTIVES.md`.

### 9.4 Passage de niveau (S4 — décision 4)
- Règle proposée : **proposer** le niveau intermédiaire quand les trois conditions sont réunies : (1) environ **6 mois** d’entraînement régulier (au moins 2 séances par semaine en moyenne sur les 8 dernières semaines) ; (2) progression des charges sur les grands mouvements devenue lente (références qui ne montent plus à chaque séance sur 3 exercices de base, signe que la progression « séance après séance » du débutant s’épuise) ; (3) au moins 3 paliers terminés. Avancé : proposé seulement après plusieurs années ou sur demande.
- Sources : ACSM (2009). *Progression models in resistance training for healthy adults*. *Medicine & Science in Sports & Exercise* 41(3) : 687–708. DOI 10.1249/MSS.0b013e3181915670 ✅ (définit l’intermédiaire comme ≈ 6 mois d’entraînement régulier, l’avancé comme des années ; fréquences 2–3 / 3–4 / 4–5 jours). **Remplacée** en 2026 par une nouvelle position ACSM (*Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews*) ⚠️ : existence vérifiée, contenu détaillé non lu ; à lire en 3D avant de figer la règle.
- Point honnête : le critère (2) est une **règle pratique d’entraîneur**, pas un résultat d’étude. C’est acceptable parce que la décision reste à l’utilisateur.

### 9.5 Progression de charge (S1, S6, S8)
- Règle : progression par petits incréments quand toutes les séries cibles sont réussies avec la réserve prévue ; double progression quand la marche de charge est grosse (déjà en place) ; conversion entre nombres de répétitions par le 1RM estimé (Epley) **avec une marge de prudence de 5 %**, uniquement quand il n’existe pas de référence dans la bonne zone.
- Sources : ACSM 2009 ✅ (surcharge progressive ; augmenter la charge ou les répétitions). Le chiffre « +2 à 10 % » souvent attribué à l’ACSM n’a **pas** pu être retrouvé dans les résumés consultés ❌ : il ne sera pas cité. Formule d’Epley (1985) et précision des équations de 1RM (LeSuer et al., 1997, *J. Strength Cond. Res.*) ❌ non revérifiées en ligne : à vérifier en 3D ; d’ici là, la conversion est présentée comme une estimation, et la marge de 5 % compense l’imprécision connue au-delà de ~10 répétitions (S9).

### 9.6 Semaine allégée (déjà en place, conservée)
- Bell, Strafford, Coleman, Androulakis Korakakis, Nolan (2023). *Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach*. *Sports Medicine – Open* 9 : 87 ✅.
- Rogerson, Nolan, Androulakis Korakakis, Immonen, Wolf, Bell (2024). *Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey*. *Sports Medicine – Open* 10 ✅ (allègement ≈ 6 jours toutes les ≈ 5,6 semaines en moyenne : cohérent avec Fonte, 5 à 8 semaines).
- Nolan, Bell et al. (2022). *Frontiers in Sports and Active Living*, avis d’entraîneurs sur l’allègement ✅ (ordre exact des auteurs à confirmer).

### 9.7 Plateau de poids (S7)
- Règle : comparer des **moyennes** de plusieurs pesées (au moins 3 par semaine), pas deux pesées isolées.
- Source : Orsama et al. (2014). *Weight rhythms: weight increases during weekends and decreases during weekdays*. *Obesity Facts* 7(1) : 36–47 ⚠️ (revue et page vérifiées, liste des auteurs à confirmer) : variations normales d’un jour à l’autre et selon le jour de la semaine, tendance estimée par moyenne mobile sur 7 jours.

---

## 10. Ce qui est reporté ou abandonné

| Élément | Décision | Pourquoi |
|---|---|---|
| Vraies notifications écran verrouillé (U2 complet) | **Abandonné pour l’instant** | Demande un serveur d’envoi (Web Push) et donc le plan Firebase payant ; Safari ne permet pas de programmer une notification locale. Revu si l’appli s’ouvre à d’autres utilisateurs. |
| Connexion Apple/Google | Reporté | Peu fiable dans une web-app d’écran d’accueil hébergée sur GitHub Pages (section 3.1-2). |
| Chiffrement des données dans l’appli | Reporté | Risque de perte définitive en cas d’oubli du mot de passe ; à discuter si d’autres utilisateurs arrivent. |
| Code de verrouillage des profils | Reporté (option) | Faible protection réelle ; ajoutable à ta demande. |
| Passage de `localStorage` à IndexedDB | Reporté | Pas nécessaire aux volumes actuels ; réévalué selon la mesure faite en 3A. |
| Réécriture de l’interface | Abandonné | Non justifié ; A1 est traité par le découpage en moteurs. |
| Page confidentialité, suppression de compte, ouverture à d’autres utilisateurs | Phase 5 (ou ultérieure) | Nécessaire avant d’accueillir des personnes extérieures, pas pour vous deux. |
| Modifications de programmes (S2/S3) | Conditionnel (3E) | Décision 2 : uniquement ce que tu valides. |

Tous les problèmes 🔴 (D1, D2, S1) et 🟠 (D3, D4, S2, S3, S4, U1, U2) ont une fiche en section 4. Tous les 🟡 (D5–D8, S5–S8, U3, U4, A1, A2) et ⚪ (D9, D10, S9, S10, U5, A3) sont planifiés ; seul le volet « notification écran verrouillé » de U2 est abandonné, pour la raison ci-dessus.
