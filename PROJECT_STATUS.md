# Fonte Muscu — Suivi du projet

Ce fichier est la mémoire du projet entre les sessions Claude Code. **Chaque session le lit en premier et le met à jour en dernier.**
Règle : une phase = une session. On ne commence jamais la phase suivante dans la même session.

## État actuel

| Phase | Statut | Session / branche | Livrables |
|---|---|---|---|
| 1 — Audit complet | ✅ Terminée le 5 nov. 2026 | `claude/audit-phase-1` | `docs/AUDIT_PHASE1.md`, `tools/analyse-volume.js`, `docs/PROMPT_PHASE2.md` |
| 2 — Plan d’amélioration | ✅ Terminée le 5 nov. 2026 | `claude/plan-phase-2` (part de `claude/audit-phase-1`) | `docs/PLAN_PHASE2.md`, `docs/PROMPT_PHASE3A.md` |
| 3A — Filet de sécurité (D2, D5, D6, D1-a, S1-a, tests navigateur) **puis** moteurs en fichiers séparés (A1, A3, D8 cadre) | ✅ Terminée le 6 nov. 2026 (parties 1 et 2) | `claude/phase-3a-securite-moteurs` (part de `claude/plan-phase-2`) | `js/engine-*.js`, `js/app.js`, `tests/e2e/`, `tests/fixtures/`, `tools/assemble.js`, `docs/CHECKLIST_PHASE3A.md`, `docs/PROMPT_PHASE3B.md` |
| 3B — Format v2 + profils multiples + migration (U4, S1-b format, D3) | ✅ Terminée le 6 nov. 2026 (parties 1, 2 et 3), **fusionnée dans `main`** (pull request n° 12, `b165012`) | `claude/phase-3b-format-profils` (part de `main` `434b292`) | `js/engine-user.js` (format v2, migration, profils), `js/engine-training.js` (D3), `docs/FORMAT_DONNEES.md`, `docs/CHECKLIST_PHASE3B.md`, `docs/PROMPT_PHASE3C.md` |
| 3C — Sauvegarde/synchro Firebase par compte (D1, D7, D9) | ✅ Terminée le 6 nov. 2026 (parties 1 et 2) — **à vérifier avec `docs/CHECKLIST_PHASE3C.md` avant 3D** | `claude/eloquent-goldberg-l5gn8b` (branche imposée par la session ; part de `main` `b165012`) | `js/engine-sync.js`, `Acct` et `RULES` dans `js/app.js`, `tests/synchro.js`, `tests/faux-firestore.js`, `tests/regles/run.js`, `tests/e2e/faux-firebase.js`, `docs/FORMAT_DONNEES.md` (section 5), `docs/CHECKLIST_PHASE3C.md`, `docs/PROMPT_PHASE3D.md` |
| 3D — Charges et historique (S1-b, S8, D4, D10, S9) **puis** règles sportives (S5, S6, S7, S4, S10) + propositions de programmes (S2/S3, sans application) | À faire | — | — |
| 3E — Expérience de séance, iPad (U1, U2, U3, U5) **puis**, si validé, programmes (S2/S3) | À faire | — | — |
| 4 — Tests complets | À faire | — | — |
| 5 — Validation et documentation | À faire | — | — |

Le détail de chaque session (contenu, taille, critères « terminé », tests) est dans `docs/PLAN_PHASE2.md`, sections 4 à 6.

**6 nov. 2026 — regroupement demandé par le propriétaire** : les 8 sessions prévues (3a à 3h) deviennent 5 (3A à 3E). Correspondance : 3a + 3b → 3A ; 3c → 3B ; 3d → 3C ; 3e + 3f → 3D ; 3g + 3h → 3E. La migration (3B) et Firebase (3C) restent séparées : vérification des données sur les deux iPhone entre les deux. Chaque session regroupée est faite en parties, un commit par partie ; une partie non terminée passe au début de la session suivante et est notée ici.

## Version du code de l’appli

- Version dans `main` : commit `b165012` (phase 3B et sa correction « même séance reproposée », fusionnées par la pull request n° 12).
- Version de développement : branche `claude/eloquent-goldberg-l5gn8b` (phase 3C), **pas encore fusionnée** : la fusion attend l’accord du propriétaire.
- Attention : dans un clone, la branche locale `main` peut être périmée ; comparer avec `origin/main`. GitHub signale que le dépôt s’appelle désormais `06quentin03-pixel/Fonte` (l’ancienne adresse redirige).

## Phase 3C — résumé (6 nov. 2026)

Tests au début de la session (sur `main` `b165012`) : `node tests/run.js` → **106 réussis, 0 en échec** ; `node tests/e2e/run.js` → **58 réussis, 0 en échec**.

**Tarifs Firebase relus (plan 3.2)** sur la page officielle (firebase.google.com/pricing et la page des quotas Firestore, le 6 nov. 2026 ; il a fallu autoriser ce site dans le réseau de la session) : plan gratuit **Spark**, Firestore « Standard » : 1 Gio stocké, **50 000 lectures, 20 000 écritures, 20 000 suppressions par jour**, 10 Gio de transfert par mois ; Authentication gratuite jusqu’à 50 000 utilisateurs actifs par mois (seuls les SMS sont payants) ; document de 1 Mio au plus. **Les sauvegardes de la base, la restauration à une date et la suppression automatique (TTL) demandent la facturation** → la corbeille de 30 jours est vidée par l’appli elle-même. Coût prévu : **0 €**.

**Partie 1 — moteur de synchro et règles** (commit `f5843db`) :
- `js/engine-sync.js` (nouveau fichier, **sans Firebase**) : décide quoi fusionner et quoi envoyer. **Pourquoi un fichier à part** : c’est ce qui permet de tester toute la synchro en Node avec un faux Firestore ; `app.js` ne fait que le brancher sur Firebase. Ajouté à `index.html`, `sw.js` (`SHELL`), `tests/charger.js` ; `tools/assemble.js` le prend tout seul.
- Modèle (plan D1/D7/D9, détail : `docs/FORMAT_DONNEES.md` section 5) : `users/{uid}` (profil, notes, mesures, séances perso, semaine allégée, agendas importés, agenda, `legacyRefs`/`legacySrc`, suppressions), chaque rubrique en texte JSON avec sa date ; `users/{uid}/seances/{id}` : **une séance = un document**, suppression = marque `del` + date, **corbeille 30 jours** puis effacement définitif. On ne relit que ce qui a changé (heure du serveur, à la microseconde). Les séances partent d’abord, le profil ensuite (il ne compte jamais une séance absente en ligne), et seulement s’il n’a pas changé en ligne depuis la lecture (deux appareils ne s’écrasent pas : la synchro recommence). **Limiteur** : 60 écritures/minute, 1 500/jour par profil et par appareil.
- Après une synchro qui ajoute, retire ou modifie des séances : références (`rebuildRefs`) et palier (`rebuildProgress`, et `csAddProgress`, son pendant pour un ajout) recalculés. Toute donnée reçue passe par `migrate` ; un format plus récent arrête la synchro sans rien écrire. Une erreur ne retire jamais rien de l’appareil.
- État d’un profil : nouvelle rubrique `corbeille` (facultative, le format reste en version 2).
- `RULES` remplacées : données perso lues/écrites seulement par leur propriétaire connecté par **e-mail** (connexion anonyme refusée), champs et tailles bornés (mêmes limites que le moteur, vérifié par un test), heure du serveur obligatoire ; agenda partagé réservé aux comptes e-mail ; un ancien agenda anonyme peut encore être retiré par son appareil.

**Partie 2 — l’appli** (commits `7e852fd` et `d3bd946`) :
- Profil › **Sauvegarde en ligne** : créer un compte, se connecter, mot de passe oublié, se déconnecter (les données restent). Une « app » Firebase par profil (`fonte-<id>`), état dans `fonte:p:<id>:sync`. **Liaison** : le compte anonyme de l’appareil devient le compte e-mail (même identifiant, l’agenda partagé continue) ; « Me connecter » sur un appareil qui avait un agenda anonyme le retire. Indicateur « Sauvegardé en ligne il y a 2 min » / « En attente du réseau : N changements ». Rappel de la visibilité par l’administrateur du projet Firebase dans la carte.
- Questionnaire de départ : **« J’ai déjà un compte Fonte »** (téléphone neuf ou réinstallé). Un téléphone qui ne connaît pas la base Firebase demande le code d’invitation `FONTESYNC1.` (ou le bloc `firebaseConfig`).
- Synchro à l’ouverture, 2 s après chaque changement, au retour du réseau ou dans l’appli, toutes les 5 min appli ouverte ; **jamais pendant une séance** (juste après). Copie de sécurité D5 avant d’appliquer une synchro qui retire 3 séances ou plus (ou un effacement complet) ; « Revenir à l’état d’avant » les fait revenir partout.
- Agenda partagé : un profil connecté à son compte a son propre agenda (fin de la restriction « profil relié à l’appareil » pour lui).
- **Corbeille** : Profil › Données › Corbeille › « Remettre » (référence et palier recalculés). Rappel de sauvegarde fichier masqué quand la sauvegarde en ligne est à jour (moins de 7 jours).
- `sw.js` : `VERSION = "fonte-2026-11-06-synchro-comptes"`.

**Décisions prises pendant la session (expliquées simplement)** :
- **Données en ligne en texte** : chaque séance et chaque rubrique est envoyée comme un texte. Firestore ne peut alors rien transformer ni refuser, et les règles peuvent limiter la taille de chaque texte. Inconvénient : moins lisible dans la console Firebase (ce qui protège aussi un peu la vie privée).
- **Pas de lecture « en direct »** des séances : l’appli demande ce qui a changé à des moments précis (voir plus haut). Plus simple, plus prévisible, et testable ; une séance faite sur l’autre téléphone arrive au plus tard 5 minutes après, ou à l’ouverture.
- **Téléphone neuf** : si ce téléphone n’a encore aucune séance, c’est le profil en ligne qui gagne au premier lien, même si le questionnaire a été rempli avant (sinon le palier serait remis à zéro).
- **Ordre conseillé dans la console** (checklist 3C) : activer l’e-mail, créer les comptes, **puis** publier les règles : l’agenda partagé n’est jamais coupé.
- **Une rubrique trop grosse** pour les règles n’est pas envoyée (le reste part, message à l’écran) au lieu de bloquer toute la sauvegarde.

**Écarts et adaptations** :
- Branche : `claude/eloquent-goldberg-l5gn8b` (imposée par la configuration de la session) au lieu de `claude/phase-3c-firebase`.
- Commits : partie 1 et partie 2 séparées comme demandé ; la partie 2 a un commit de suite (rubrique trop grosse), trouvé à la relecture.
- Test adapté (imposé) : dans `tests/run.js`, le test qui fige l’ordre de chargement des fichiers `js/` inclut maintenant `engine-sync.js`. `tests/run.js` lance aussi des tests asynchrones (synchro) après les autres. `tests/e2e/outils.js` : option `before` (pour brancher le faux Firebase avant l’ouverture). Rien d’autre ne change dans les tests existants.
- Défauts trouvés et corrigés **pendant** la session grâce aux tests (avant tout envoi) : marque « supprimée » confondue avec une empreinte commençant par « d » (aurait pu effacer une séance en ligne) ; deux changements dans la même milliseconde ; profil vide d’un téléphone neuf qui gagnait contre le vrai (palier posé à l’ouverture).

**Résultats des tests (fin de session, réellement exécutés, sur `d3bd946`)** :
- `node tests/run.js` → **127 réussis, 0 en échec** (106 d’avant, dont 1 adapté pour l’ordre de chargement, + 21 de synchro avec le faux Firestore : premier envoi et lectures minimales, réinstallation, téléphone neuf dont le questionnaire est rempli, deux appareils hors ligne, suppression propagée avec D3, corbeille remise, effacement définitif à 30 jours, même séance modifiée des deux côtés, deux envois de profil simultanés, limiteur sur 3 000 modifications, 500 séances étalées, format plus récent refusé, pannes à chaque étape, séance résumée, effacement complet, union de deux appareils, document abîmé et ancien format, retour arrière après synchro, rubrique trop grosse, limites identiques aux règles, comptes séparés).
- `node tests/e2e/run.js` → **66 réussis, 0 en échec** (33 tests × iPhone 13 et iPad Pro 11 : les 29 d’avant inchangés + création de compte et liaison du compte anonyme, réinstallation « J’ai déjà un compte », mode avion puis retour du réseau, corbeille).
- Règles Firestore avec l’**émulateur Firebase** (firebase-tools 15.35.0, Java 21) → **9 réussis, 0 en échec** (lecture/écriture croisées interdites, anonyme refusé sur les données perso, sans connexion refusé, heure du serveur, champs inconnus, tailles, agenda partagé).
- GitHub Actions : exécution n° 55 (commit `7a92e63`) **réussie** : tâches « tests », « navigateur » et la nouvelle tâche « regles » (émulateur Firebase installé et lancé sur GitHub : elle fonctionne réellement).
- Non testé (impossible ici) : vrai projet Firebase, vrai Safari, vrais iPhone/iPad → `docs/CHECKLIST_PHASE3C.md`.

**Points ouverts notés pendant 3C** (non corrigés, hors périmètre ou à décider) :
- « Restaurer » une sauvegarde fichier n’efface pas les séances déjà en ligne ; « Effacer l’historique » et « Tout réinitialiser » laissent les séances en ligne (ignorées partout). Détail : `docs/FORMAT_DONNEES.md` 5.5.
- Un téléphone neuf doit recevoir le code d’invitation (ou le bloc `firebaseConfig`) pour trouver la base : prévu dans la checklist. Plus simple plus tard : écrire la configuration du projet dans l’appli (elle n’est pas secrète).
- La synchro Claude (mode artifact) fusionne encore `lastPerf` sans recalcul D3 après des suppressions reçues (déjà noté en 3B) : non repris, le mode artifact n’est pas utilisé sur les téléphones.
- Quiconque a la clé publique du projet peut créer un compte e-mail ; il ne peut lire que ses propres données, et l’agenda d’un espace seulement s’il connaît son identifiant (20 caractères aléatoires). Pour de futurs utilisateurs : page confidentialité, suppression de compte (plan section 10).
- Mot de passe oublié : l’e-mail de Firebase peut arriver dans les indésirables.

## Phase 3B — résumé (6 nov. 2026)

Tests au début de la session (sur `main` `434b292`) : `node tests/run.js` → **94 réussis, 0 en échec** ; `node tests/e2e/run.js` → **50 réussis, 0 en échec**.

**Partie 1 — format v2 et migration v1 → v2** (plan 7.2 à 7.4, suivi à la lettre) :
- `SCHEMA_VERSION = 2`, `MIGRATIONS[1]` (fonction pure) : même contenu + `refs[exercice][zone]` (force ≤ 6, muscle 7–12, endurance ≥ 13, issues de `lastPerf` : format seulement, l’usage viendra en 3D), `legacyRefs` (copie intacte de `lastPerf`), `legacySrc` (séance d’origine de chaque référence), `upd` sur chaque séance. Les nouvelles séances enregistrent la cible `t` dans chaque série (et la base `b`).
- Au démarrage (`storeOpen`) : `fonte:v1` lu sans être modifié → état v2 construit en mémoire → écrit dans `fonte:p:<id>` → **relu et comparé** (texte identique ; séances une à une, mesures, notes, références, séances perso, agenda, profil champ par champ) **avant** d’écrire `fonte:profiles`. Mémoire pleine : historique ancien résumé dans la copie puis nouvel essai ; sinon on reste en v1 (carte « Fais une sauvegarde », nouvel essai au lancement suivant), rien n’est effacé ni laissé à moitié. **`fonte:v1` conservé tel quel.** Garde anti-retour : si `fonte:v1` change après la migration, il est rejoué et fusionné (séances par identifiant, sans ressusciter celles supprimées). Format plus récent jamais écrasé. Séance en cours, séance supprimée récemment, dates de sauvegarde copiées dans le profil ; copie de sécurité D5 déplacée.
- Ce dont la migration et les profils ont besoin a quitté `app.js` pour `engine-user.js`, testable en Node : enregistrement (`storeSave`, résumé si mémoire pleine), copie de sécurité (`storeSnapshot`), sauvegarde et restauration (`backupPayload`, `decodeBackup`, `applyBackup`, `cleanEvents`, `b64e/b64d`). Toute restauration (fichier, code `FONTEDATA1.`, synchro Claude) passe par `migrate`.
- `docs/FORMAT_DONNEES.md` : formats v1 et v2, migration, recalcul D3.

**Partie 2 — profils multiples (U4)** :
- Profil › en haut : carte du profil ouvert, « Changer de profil », « Ajouter un profil » (profil vide + questionnaire de départ). Données du profil dans `fonte:p:<id>` (séance en cours `:run`, `:run-trash`, `:undo`, `:backup`, `:bksnooze`) ; réglages d’appareil communs (`fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync`).
- **Décision** : changer de profil **relance l’appli** sur l’autre profil (au lieu de tout recharger en mémoire) : c’est le moyen le plus sûr pour que rien d’un profil ne reste à l’écran ou en mémoire dans l’autre. Fonctionne hors ligne (l’appli est en cache). Interdit pendant une séance en cours (y compris une séance non terminée de plus de 12 h).
- **Décision** : la synchro de l’appareil (agenda Firebase, connexion anonyme ; compte Claude en mode artifact) reste reliée à **un** profil (`owner`, le profil 1 migré, ou celui qui active la synchro). Les autres profils voient l’agenda de ce profil comme celui d’un partenaire et gardent leurs séances sur l’appareil. Sinon, deux profils auraient écrit dans le même document en ligne et se seraient mélangés. Chaque profil aura son compte en 3C.
- Pas de suppression de profil (volontaire : rien ne peut être perdu par erreur ; à prévoir plus tard avec sauvegarde d’abord).

**Partie 3 — D3** : `rebuildRefs(historique, legacyRefs, legacySrc)`, `rebuildProgress(historique, profil, séance)`, `refStep` (la même règle sert à l’enregistrement d’une séance et au recalcul) dans `engine-training.js`, appelés par « Supprimer de l’historique » (seuls les exercices de la séance supprimée sont recalculés). Palier : rejoué sans la séance si l’historique correspond au palier actuel ; sinon (jours changés, niveau choisi à la main, ancienne suppression) une seule séance retirée au compteur, pour ne rien bouleverser.

**Commits** : les trois parties ont été faites ensemble dans un seul commit de code (puis un commit de documentation), et non un commit par partie comme demandé : elles partagent les mêmes fonctions (la migration calcule `legacySrc` pour D3 ; `refStep` sert à l’enregistrement et au recalcul ; les clés par profil servent à la migration). Les découper aurait produit des étapes intermédiaires jamais testées. Rien n’est resté à moitié.

**Tests adaptés (imposé par le format)** : dans `tests/run.js`, les 7 tests D8 de 3A qui supposaient `SCHEMA_VERSION = 1` et une lecture sans écriture sont remplacés par la suite de migration (le format « plus récent » devient v3) ; dans `tests/e2e/run.js`, les tests lisent `fonte:v1`, `fonte:run`, `fonte:undo`… à leur nouvelle place (`fonte:p:<profil>…`), le test D8 utilise v3, et le test de mise à jour part maintenant de **`029e2da` et de `434b292`** (version en service). Rien d’autre n’a changé dans les tests existants.

**Résultats des tests (fin de session, réellement exécutés)** :
- `node tests/run.js` → **106 réussis, 0 en échec** (94 − 7 tests D8 de 3A remplacés + 19 nouveaux : migration de chaque jeu de données avec comparaison champ à champ, double lancement, copie de sécurité déplacée, premier lancement, JSON abîmé, profil illisible, format plus récent, mémoire pleine — résumé puis migration impossible —, vérification ratée, garde anti-retour, restauration de toutes les versions et aller-retour, profils séparés ; `refStep` identique à l’ancienne règle sur 300 essais ; D3 : cas des 600 kg, propriété sur 60 historiques générés, palier incohérent).
- `node tests/e2e/run.js` → **56 réussis, 0 en échec** (28 tests × iPhone 13 et iPad Pro 11) : les 25 de 3A (adaptés comme ci-dessus), mise à jour depuis `029e2da` **et** `434b292` (données migrées intactes, `fonte:v1` conservé, hors ligne), isolation de 2 profils avec une séance dans chacun (historique, références, palier, agenda, copie de sécurité, séance en cours, changement refusé pendant une séance), D3 dans l’appli.
- GitHub Actions : exécution n° 50 (commit `51eb44d`) **réussie**, tâches « tests » et « navigateur » (cette dernière comprend la mise à jour depuis `029e2da` et `434b292`).
- Non testé (impossible ici) : Safari réel, vrais iPhone/iPad, vraie taille des données de vos téléphones → `docs/CHECKLIST_PHASE3B.md`.

**Correction après la fin de 3B (bug signalé par le propriétaire)** : une séance du programme faite **hors du programme** (Séances › Séances types, « Refaire cette séance », séance ajoutée à la main dans l’agenda) ou faite juste avant un changement de programme n’était pas reconnue : l’accueil reproposait la même séance (ex. « Force : squat » deux fois de suite). Désormais (`lastProgDone` dans `app.js`), si la séance la plus récente vient d’une séance type présente dans le programme (ou de sa variante de semaine B), la suite du programme part de là ; sinon, rien ne change. Le programme lui-même n’est pas modifié (photographie identique). Test navigateur ajouté ; reproduit avant correction (« Force : squat » reproposé), vert après. `sw.js` : `VERSION` changée. Tests : `node tests/run.js` → **106 réussis, 0 en échec** ; `node tests/e2e/run.js` → **58 réussis, 0 en échec** (29 × 2 appareils).

**Points ouverts notés pendant 3B** (non corrigés, hors périmètre) :
- Questionnaire de départ : « Passer » ne garde pas le prénom tapé à la première étape (comportement d’origine).
- La synchro Claude (mode artifact) fusionne encore `lastPerf` sans recalcul D3 après des suppressions reçues : à reprendre avec la synchro par séance (3C).
- Mémoire : `fonte:v1` est gardé en plus du profil 1, la place utilisée double donc à peu près (≈ 80 Ko → 160 Ko pour 6 mois d’usage ; très loin de la limite). Le bouton « Libérer de la place » (avec sauvegarde d’abord) est à prévoir, au plus tôt après 2 mises à jour.
- `rebuildProgress` compte les paliers avec le nombre de jours actuel ; si les jours ont changé, il retire seulement une séance au compteur (voir partie 3).

## Phase 3A — résumé (6 nov. 2026)

Tests au début de la session : `node tests/run.js` → **77 réussis, 0 en échec**.

**Partie 1 — filet de sécurité** (sans changement de format) :
- **D2** : « Ne pas enregistrer » (écran de fin) et « Abandonner » (fenêtre Arrêter) demandent « Supprimer cette séance ? X séries seront perdues » dès qu’une série est faite ; bandeau « Séance supprimée — Annuler » 10 s, valable même après rechargement (`fonte:run-trash`).
- **D5** : copie de sécurité exacte de `fonte:v1` (`fonte:undo` + `fonte:undo-info`) avant Restaurer, Effacer l’historique, Tout réinitialiser ; « Revenir à l’état d’avant (date, heure) » dans Profil › Données (l’état remplacé devient à son tour la copie) ; si la copie ne tient pas en mémoire, l’opération est refusée et une sauvegarde fichier est proposée.
- **D6** : une séance commencée il y a plus de 12 h n’est plus ignorée : carte « Séance non terminée » avec « Enregistrer ce qui a été fait » (à la date et l’heure de la séance, historique retrié, référence plus récente jamais écrasée ; fin inconnue → durée prévue de la séance) ou « Supprimer » (confirmation + Annuler).
- **D1-a** : rappel après 10 séances ou 14 jours (au moins une séance depuis) ; jamais sauvegardé → dès 3 séances, comme avant ; « Me le rappeler dans 7 jours ». Fonction pure `backupDueAt`.
- **S1-a** : `convertLoad` (1RM Epley, marge de 5 %, arrondi vers le bas au matériel, minimum du matériel respecté) quand les répétitions visées diffèrent d’au moins 3 de la dernière fois : 5 × 5 à 100 kg → **82,5 kg** pour 10 répétitions (au lieu de 102,5). Utilisée par la charge proposée (`applySuggestions`, création et remplacement d’exercice) et affichée (« charge recalculée … estimation prudente »).
- Jeux de données v1 inventés dans `tests/fixtures/` (vide, ancien sans objectifs, usage typique, 3 000 séances résumées, JSON abîmé, code `FONTEDATA1.`, séance en cours), fabriqués par `tools/make-fixtures.js`. Ce sont des références figées : ne pas les régénérer (seule la date `upd` changerait).

**Partie 2 — moteurs séparés** :
- Photographie des programmes (`tests/fixtures/programmes.json`, 4 500 combinaisons objectif(s) × niveau × jours × palier 1–5 × semaine A/B, 1 098 séances différentes) faite **avant** le découpage ; identique après. Un essai de modification volontaire (puis annulée) a bien fait échouer le test.
- Code **déplacé sans réécriture** (vérifié ligne à ligne) dans `js/engine-pedago.js` (exercices, libellés, LOAD, animations), `js/engine-training.js` (séances types, prescriptions, programmes, planning, progression, superséries, paliers), `js/engine-analytics.js` (courbes, records, muscles, régularité, plateau), `js/engine-user.js` (format, `migrate`, `loadState`, historique résumé, rappel de sauvegarde, exports CSV/.ics), `js/app.js` (interface). `index.html` ne garde que la page et `window.FONTE_PWA = true`.
- **Écart au plan, assumé** : `saveLocal`, `commit`, la copie D5, `restoreData`, la sauvegarde fichier et la synchro (Claude, Firebase) sont restés dans `app.js`, car ils appellent directement l’interface ; les déplacer aurait demandé de les réécrire. Ils rejoindront `engine-user.js` en 3B (migration, profils) et 3C (Firebase).
- **D8 (cadre)** : `SCHEMA_VERSION = 1`, `MIGRATIONS = {}`, `migrate(raw)` ; `loadState` et `restoreData` passent par `migrate`. Format plus récent : refusé, carte « Mets Fonte à jour », aucune écriture de `fonte:v1` (`STORE_BLOCK`). Ajout de sécurité : un `fonte:v1` illisible est copié tel quel dans `fonte:v1-illisible` avant que l’appli ne réécrive (avant, il était perdu au premier enregistrement).
- `sw.js` : fichiers `js/` dans `SHELL`, `VERSION = "fonte-2026-11-06-moteurs"`. Mise à jour depuis l’ancienne version en cache (`029e2da`) puis hors ligne : vérifiées par un test navigateur.
- `tools/assemble.js` : fichier unique pour le mode artifact Claude (`dist/fonte-artifact.html`, ignoré par git) ; s’ouvre sans erreur (test navigateur, modes artifact et PWA).
- `tests/run.js` et `tools/analyse-volume.js` chargent les moteurs via `tests/charger.js` ; sortie de `analyse-volume` identique avant/après.

**Résultats des tests (fin de session, réellement exécutés)** :
- `node tests/run.js` → **94 réussis, 0 en échec** (77 d’origine inchangés sauf le chemin de chargement + 8 en partie 1 + photographie + 6 D8 + 1 SHELL).
- `node tests/e2e/run.js` → **50 réussis, 0 en échec** (25 tests × iPhone 13 et iPad Pro 11 simulés dans Chromium) : D2, D5, D6, D1-a, S1-a, aucune erreur JavaScript sur chaque jeu de données, hors ligne, mise à jour du service worker, fichier assemblé, D8.
- GitHub Actions : tâches « tests » et « navigateur » ; exécutions de la partie 1 (run 45) et de la partie 2 (run 46) **réussies**, tâche « navigateur » comprise (elle fonctionne réellement sur GitHub).
- Non testé (impossible ici) : Safari réel, iPhone/iPad réels → `docs/CHECKLIST_PHASE3A.md`.

**Mesure de la taille de `fonte:v1`** (jeux de données inventés) :
- usage typique, 78 séances (≈ 6 mois à 3 séances/semaine) : **80 641 octets** (≈ 79 Ko) ;
- 3 000 séances (300 détaillées, 2 700 résumées) : **1 914 627 octets** (≈ 1,9 Mo, 1,9 million de caractères).
- Safari compte la limite de `localStorage` (≈ 5 Mo selon les estimations courantes, non mesurée sur vos appareils) en caractères UTF-16, soit environ 2 octets par caractère : 3 000 séances ≈ 3,8 Mo. Conséquences : (1) l’usage réel de 2 personnes reste loin de la limite pendant des années ; (2) avec un très gros historique, la copie de sécurité D5 (qui double la place) ne tiendra pas et l’opération sera **refusée proprement** ; (3) les profils (3B) partagent cette mémoire : à surveiller, IndexedDB reste une option si nécessaire.

**Points ouverts notés pendant 3A** (non corrigés, hors périmètre) :
- Le jeu de données « usage typique » montre le passage de niveau automatique existant (intermédiaire → avancé après 6 paliers) : c’est S4, prévu en 3D.
- Données illisibles au démarrage : le questionnaire d’accueil s’ouvre toujours (comportement d’origine), mais la copie `fonte:v1-illisible` est désormais gardée ; une récupération guidée pourrait être ajoutée en 3B.

## Phase 2 — résumé

- Code relu aux endroits cités par l’audit et exemples rejoués : l’audit est **confirmé**, avec des compléments (section 1 du plan) :
  - S1 touche **161 combinaisons** de profils à 2 objectifs (pas seulement force + muscle) ;
  - D1 : la connexion Firebase **anonyme** actuelle ne permettrait pas de récupérer une sauvegarde en ligne après perte du téléphone → comptes e-mail + mot de passe ;
  - le journal des séances n’enregistre pas les répétitions visées → les références anciennes servent de point de départ au recalcul ;
  - S8 : charge du palier 4 trop **légère** (et non trop lourde) ; « mollets 0–2 » faux pour muscle intermédiaire 4 j ;
  - références : Bell 2023 = Delphi, enquête = Rogerson 2024 ; Pelland paru dans *Sports Medicine* (2026) ; ACSM 2009 remplacée par une position 2026 ; Grgic 2018 plus nuancé que présenté.
- Les applis d’écran d’accueil iOS sont exemptées de l’effacement Safari « 7 jours » : le risque D1 vient surtout de la perte/réinitialisation du téléphone ou de la suppression de l’appli.

## Décisions prises (phase 2, par le propriétaire)

1. **Firebase : oui** — sauvegarde et synchro en ligne, hors ligne et copie locale conservés, sécurité et isolation prioritaires. Mise en œuvre retenue : comptes e-mail + mot de passe (un par profil), compte anonyme actuel relié (l’agenda partagé continue), une séance = un document, corbeille 30 jours, plan gratuit Spark (coût prévu 0 €). À savoir : le propriétaire du projet Firebase peut techniquement voir toutes les données dans la console (plan, section 3.1).
2. **Programmes actuels : aucune modification automatique.** S2/S3 → document de propositions en 3D ; application en 3E uniquement de ce qui est validé ; test « photographie » des programmes pour garantir qu’ils ne changent pas par erreur.
3. **Échec : oui, approche prudente** — plus d’échec pour les débutants (3D) ; cibles de répétitions en réserve selon niveau et type d’exercice (tableau, plan section 9.3).
4. **Passage de niveau : proposé, jamais automatique** — critères : ~6 mois réguliers, progression devenue lente, ≥ 3 paliers ; charges réelles conservées (plus de +45 %).
5. **Profils multiples : oui**, totalement indépendants sur un même appareil ; profils séparés mais pas secrets sur un appareil partagé (pas de code par défaut).

Décisions techniques : 4 moteurs en fichiers séparés sans outil de construction (3A, 2ᵉ partie), avec un script facultatif pour reconstituer le fichier unique « artifact Claude » ; une **seule** migration de format v1 → v2 en 3B ; `fonte:v1` conservé comme copie de secours ; tests navigateur avec Playwright (outil de test uniquement, rien ajouté à l’appli).

## Décisions en attente

Aucune bloquante. **Accord attendu : fusion de la branche 3C (`claude/eloquent-goldberg-l5gn8b`) dans `main`.** À trancher plus tard : suppression d’un profil et bouton « Libérer de la place » (suppression de `fonte:v1`, avec sauvegarde d’abord) ; validation des propositions de programmes (fin de 3D) ; code de verrouillage des profils (optionnel) ; ouverture à d’autres utilisateurs (page confidentialité, suppression de compte).

## Problèmes ouverts connus

Ceux de `docs/AUDIT_PHASE1.md` section 2, avec les compléments de `docs/PLAN_PHASE2.md` section 1. **Corrigés en 3A** : D2, D5, D6, D1-a (rappel renforcé ; D1 complet en 3C), S1-a (garde-fou ; S1-b en 3B/3D), D8 (cadre), A1/A3. Abandonné : notification de fin de repos écran verrouillé (demande un serveur d’envoi). **Corrigés en 3B** : D8 (migration réelle v1 → v2), U4 (profils), S1-b (format : références par zone ; usage en 3D), D3. **Corrigés en 3C** (à vérifier sur les téléphones) : D1 (sauvegarde en ligne récupérable après perte ou réinstallation), D7 (conflits entre appareils), D9 (données personnelles en ligne protégées par compte et règles).

## Prochaine étape

1. Le propriétaire lit ce résumé et donne (ou non) son accord pour fusionner `claude/eloquent-goldberg-l5gn8b` dans `main` (GitHub › Pull requests › New pull request › base `main` ← `claude/eloquent-goldberg-l5gn8b` › Create › Merge).
2. **Avant la mise à jour : sauvegarde fichier sur chaque iPhone.** Puis checklist `docs/CHECKLIST_PHASE3C.md` : console Firebase (activer « Adresse e-mail/Mot de passe »), un compte par profil, **puis** publier les nouvelles règles, réinstallation d’un appareil de test, mode avion, corbeille.
3. Dire à l’autre personne que l’administrateur du projet Firebase peut techniquement voir ses données dans la console (plan 3.1-4).
4. Seulement ensuite, ouvrir une **nouvelle session** Claude Code avec le contenu de `docs/PROMPT_PHASE3D.md`.
