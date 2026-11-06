# Fonte — format des données

Ce document décrit comment Fonte enregistre les données sur l’appareil (dans le `localStorage` du navigateur), en version 1 (jusqu’à la phase 3A) et en version 2 (depuis la phase 3B). Le code correspondant est dans `js/engine-user.js` (stockage, migration) et `js/engine-training.js` (références, palier).

Règle : **toute donnée lue passe par `migrate(raw)`** : les données de l’appareil au démarrage, les fichiers et codes de sauvegarde `FONTEDATA1.`, les données reçues de la synchro Claude. Une donnée d’un format plus récent que l’appli est refusée et jamais écrasée.

---

## 1. Version 1 (format utilisé jusqu’à la phase 3A)

| Clé | Contenu |
|---|---|
| `fonte:v1` | Tout l’état de l’appli (un seul utilisateur), voir ci-dessous. Pas de champ `v` dans les toutes premières versions (traité comme v1). |
| `fonte:run` | Séance en cours (lecteur) : `{ se, steps, idx, log, start, endAt?, done?, feel?, … }`. |
| `fonte:run-trash` | Séance supprimée il y a moins de 10 s (« Annuler », D2) : `{ at, run }`. |
| `fonte:undo`, `fonte:undo-info` | Copie de sécurité (D5) : contenu exact de `fonte:v1` avant l’opération ; `{ at, reason }`. |
| `fonte:backup`, `fonte:bksnooze` | Date de la dernière sauvegarde fichier ; date jusqu’à laquelle le rappel est reporté. |
| `fonte:v1-illisible` | Copie brute d’un `fonte:v1` abîmé (jamais écrasée). |
| `fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync` | Réglages de l’appareil : onglet de l’écran Séances, carte « Installe Fonte » masquée, rappel du calendrier, configuration de la synchro Firebase de l’agenda (espace partagé). |

Contenu de `fonte:v1` (état `S`) :

| Champ | Contenu |
|---|---|
| `v` | `1` |
| `upd`, `agUpd` | Dates (ms) de dernière modification des données personnelles et de l’agenda. |
| `profile` | Prénom, sexe, âge, taille, poids, niveau, objectif(s), jours, zones, barre, mode simple ; palier : `phase`, `phaseDone`, `phaseStart`, `phases` (bilans), `bilanNew`. |
| `historique` | Séances faites, de la plus récente à la plus ancienne : `{ id, date, ts, nom, kind, ref, duree, volume, kcal, sets, ressenti, log: [{ id, warm?, cool?, sets: [{ r, kg, rir? } ou { d }] }], pr?, pj?, pk?, dl? }`. Au-delà de 300 séances : résumées (`c: 1`, meilleures séries seulement). 3 000 au plus. |
| `lastPerf` | Dernière performance par exercice : `{ d, ts, sets, target, base, feel, fails }` (sert au conseil de charge). |
| `mesSeances`, `notes`, `mesures`, `deload`, `agenda`, `imports` | Séances perso, notes par exercice, poids/tour de taille, semaine allégée, agenda personnel, agendas importés. |
| `histDel`, `histClear` | Séances supprimées (identifiant → date) et date d’effacement complet (synchro). |
| `partners`, `hidden` | Agendas des partenaires reçus par la synchro ; personnes masquées dans l’agenda. |

Le fichier et le code de sauvegarde v1 (`FONTEDATA1.` + base64) contiennent `{ v: 1, app: "fonte", at, profile, mesSeances, historique, lastPerf, notes, mesures, deload, agenda, imports }`.

---

## 2. Version 2 (depuis la phase 3B) : profils multiples

### 2.1 Clés

| Clé | Contenu |
|---|---|
| `fonte:profiles` | `{ v: 2, active, owner, list: [{ id, prenom, cree }], mig? }` : liste des profils de l’appareil et profil ouvert. `owner` = profil relié à la synchro de l’appareil (agenda Firebase, compte Claude). `mig` = trace de la migration : `{ pid, at, sig, resume?, merged?, illisible? }` (`sig` = empreinte de `fonte:v1` au moment de la migration). |
| `fonte:p:<id>` | État du profil (voir 2.2). `<id>` = `p` + lettres et chiffres. |
| `fonte:p:<id>:run`, `:run-trash`, `:undo`, `:undo-info`, `:backup`, `:bksnooze` | Les mêmes fichiers qu’en v1, **un jeu par profil** : séance en cours, séance supprimée récemment, copie de sécurité, dates de sauvegarde. |
| `fonte:p:<id>-illisible` | Copie brute d’un état de profil abîmé (jamais écrasée). |
| `fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync` | Inchangés, **communs à l’appareil**. |
| `fonte:v1` | **Conservé tel quel** après la migration, comme copie de secours. Plus jamais écrit par la version 3B (sauf mode « v1 », voir 3.3). Il ne sera supprimé qu’avec l’accord du propriétaire (futur bouton « Libérer de la place », qui proposera d’abord une sauvegarde fichier). |

`fonte:sync` (Firebase, agenda partagé, connexion anonyme de l’appareil) reste commun en 3B : seul le profil `owner` y envoie son agenda ; les autres profils de l’appareil voient l’agenda du profil relié et ceux des partenaires, et gardent leurs séances sur l’appareil. Chaque profil aura son propre compte en 3C (`fonte:p:<id>:sync`).

### 2.2 État d’un profil (`fonte:p:<id>`)

Le même contenu qu’en v1, avec :

| Champ | Contenu |
|---|---|
| `v` | `2` |
| `refs` | Références par exercice **et par zone de répétitions** (S1-b) : `refs[exercice][zone] = { d, ts, sets, target, base, feel, fails }`, zones `force` (≤ 6 répétitions), `muscle` (7 à 12), `endurance` (≥ 13) ; cible inconnue : `muscle`. Format seulement en 3B : l’appli continue d’utiliser `lastPerf` pour la charge proposée ; les zones serviront en 3D. |
| `legacyRefs` | Copie **intacte** de `lastPerf` au moment de la migration (ou de la restauration d’une sauvegarde v1). Jamais modifiée ensuite (sauf « Effacer l’historique » et « Tout réinitialiser », qui la vident avec le reste). Sert de point de départ au recalcul des références (D3), parce que les séances d’avant 3B n’ont pas la cible de répétitions. |
| `legacySrc` | Séance d’origine de chaque référence de `legacyRefs` : `{ exercice: idSéance }` (même `ts`, ou même date et mêmes séries). Si cette séance est supprimée, la référence v1 est abandonnée et recalculée. |
| `historique[].upd` | Date de dernière modification de chaque séance (pour les anciennes : son heure `ts`). Préparé pour la synchro par séance (3C). |
| `historique[].log[].sets[].t` | **Nouvelles séances** : cible de répétitions de la série (`it.reps`). |
| `historique[].log[].b` | **Nouvelles séances** : répétitions prévues au départ, si différentes de la cible (`it.base`). |

Les séances résumées (`c: 1`) gardent `t` et `b`.

### 2.3 Sauvegarde fichier et code

`{ v: 2, app: "fonte", at, profile, mesSeances, historique, lastPerf, refs, legacyRefs, legacySrc, notes, mesures, deload, agenda, imports }` — **un profil par sauvegarde**. Le code garde le préfixe `FONTEDATA1.` (c’est le nom du code, pas la version des données). Une sauvegarde v1 (ancienne) se restaure toujours : elle passe par `migrate`. La version 3A refuse une sauvegarde v2 (« version plus récente ») sans rien modifier.

---

## 3. Migration v1 → v2

### 3.1 La transformation (`MIGRATIONS[1]`, fonction pure, testée en Node)

- `v` passe à 2 ; rien n’est retiré ;
- `legacyRefs` = copie de `lastPerf` ; `refs` = chaque `lastPerf` rangée dans sa zone (d’après `target`, sinon la plus grande répétition faite) ; `legacySrc` = séance d’origine ;
- `upd` ajouté à chaque séance qui n’en a pas.

### 3.2 Au démarrage (`storeOpen`, plan section 7.3)

1. `fonte:profiles` existe et désigne un profil : on lit `fonte:p:<actif>` (via `migrate`). Puis **garde anti-retour** : si `fonte:v1` a changé depuis la migration (empreinte différente — une ancienne version encore ouverte a enregistré quelque chose), il est relu, migré et **fusionné** dans le profil migré : séances ajoutées par identifiant (sauf celles supprimées dans le profil), mesures et séances perso par identifiant, références plus récentes ; pour le profil, l’agenda et les réglages, la version la plus récente gagne. Fusion faite une seule fois par changement.
2. Sinon, `fonte:v1` est lu **sans être modifié**, l’état v2 est construit en mémoire, écrit dans `fonte:p:<id>`, **relu et comparé** à la source (texte identique ; nombre de séances et leurs identifiants, chaque séance identique à part `upd`, mesures, notes, références, séances perso, agenda, profil champ par champ) **avant** d’écrire `fonte:profiles`. Les fichiers liés (`fonte:run`, `fonte:run-trash`, `fonte:backup`, `fonte:bksnooze`) sont copiés dans le profil ; la copie de sécurité `fonte:undo` est déplacée (pour ne pas doubler la place).
3. Mémoire pleine : l’historique ancien est résumé **dans la copie** (`trimHist`, comme l’enregistrement habituel) et on réessaie ; toutes les séances restent (seul le détail des plus anciennes est résumé ; message affiché). Si cela échoue encore, ou si la relecture ne correspond pas : la copie est retirée, l’appli **reste sur `fonte:v1`** (mode « v1 »), affiche « Fais une sauvegarde » et réessaie au lancement suivant. Rien n’est effacé.
4. `fonte:v1` absent : premier lancement, un profil vide. `fonte:v1` illisible : copie brute dans `fonte:v1-illisible`, profil vide, et `fonte:v1` n’est jamais écrasé.
5. Format plus récent (`fonte:profiles` ou état en v3 ou plus) : rien n’est écrit, carte « Mets Fonte à jour ».
6. Un état de profil illisible est copié dans `fonte:p:<id>-illisible` ; pour le profil issu de la migration, l’appli repart alors de `fonte:v1` (toujours conservé).

### 3.3 Mode « v1 » (migration en attente)

L’appli fonctionne comme la version 3A : elle lit et écrit `fonte:v1` au format v1 (sans `refs`, `legacyRefs`, `legacySrc`) et les fichiers `fonte:run`, `fonte:undo`… Un seul profil est possible. La migration est retentée à chaque lancement.

---

## 4. Recalcul après suppression d’une séance (D3)

- **Références** (`rebuildRefs(historique, legacyRefs, legacySrc)`, `engine-training.js`) : pour chaque exercice, on part de la référence v1 (si sa séance d’origine est toujours là, ou si elle est inconnue) puis on rejoue les séances plus récentes avec la même règle que l’enregistrement d’une séance (`refStep`) ; si la séance d’origine a été supprimée, on rejoue toutes les séances de l’exercice (cible = `t`, sinon la plus grande répétition faite). L’appli n’applique le résultat qu’aux exercices de la séance supprimée.
- **Palier** (`rebuildProgress(historique, profil, séanceSupprimée)`) : si le palier actuel correspond à l’historique rejoué depuis le début (même logique que la première ouverture), on rejoue sans la séance : comme si elle n’avait jamais existé. Sinon (jours changés en cours de route, niveau choisi à la main, suppression ancienne non décomptée), on retire seulement une séance au compteur (et on rouvre le palier précédent si besoin), pour ne rien bouleverser. Une séance de mobilité ne change pas le palier.
