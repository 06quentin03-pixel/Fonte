# Fonte — format des données

Ce document décrit comment Fonte enregistre les données sur l’appareil (dans le `localStorage` du navigateur), en version 1 (jusqu’à la phase 3A) et en version 2 (depuis la phase 3B), et, depuis la phase 3C, leur copie en ligne (Firebase, section 5). Le code correspondant est dans `js/engine-user.js` (stockage, migration), `js/engine-training.js` (références, palier) et `js/engine-sync.js` (sauvegarde et synchro en ligne).

Règle : **toute donnée lue passe par `migrate(raw)`** : les données de l’appareil au démarrage, les fichiers et codes de sauvegarde `FONTEDATA1.`, les données reçues de la synchro Claude et (depuis 3C) chaque document reçu de Firebase. Une donnée d’un format plus récent que l’appli est refusée et jamais écrasée.

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
| `fonte:p:<id>:sync` | **Depuis 3C** : état de la sauvegarde en ligne du profil (voir 5.3). |
| `fonte:p:<id>:run`, `:run-trash`, `:undo`, `:undo-info`, `:backup`, `:bksnooze` | Les mêmes fichiers qu’en v1, **un jeu par profil** : séance en cours, séance supprimée récemment, copie de sécurité, dates de sauvegarde. |
| `fonte:p:<id>-illisible` | Copie brute d’un état de profil abîmé (jamais écrasée). |
| `fonte:ui`, `fonte:noinstall`, `fonte:rappel`, `fonte:sync` | Inchangés, **communs à l’appareil**. |
| `fonte:v1` | **Conservé tel quel** après la migration, comme copie de secours. Plus jamais écrit par la version 3B (sauf mode « v1 », voir 3.3). Il ne sera supprimé qu’avec l’accord du propriétaire (futur bouton « Libérer de la place », qui proposera d’abord une sauvegarde fichier). |

`fonte:sync` (configuration Firebase et espace d’agenda partagé) reste commun à l’appareil. En 3B, seul le profil `owner` y envoyait son agenda (connexion anonyme de l’appareil). **Depuis 3C**, un profil connecté à son compte e-mail envoie son propre agenda avec ce compte ; un profil sans compte fonctionne comme en 3B.

### 2.2 État d’un profil (`fonte:p:<id>`)

Le même contenu qu’en v1, avec :

| Champ | Contenu |
|---|---|
| `v` | `2` |
| `refs` | Références par exercice **et par zone de répétitions** (S1-b) : `refs[exercice][zone] = { d, ts, sets, target, base, feel, fails }`, zones `force` (≤ 6 répétitions), `muscle` (7 à 12), `endurance` (≥ 13) ; cible inconnue : `muscle`. **Depuis 3D**, la charge proposée part de la référence de la zone visée (`refFor`) ; sans référence dans cette zone, de `lastPerf` (convertie si l’écart de répétitions est d’au moins 3, S1-a). |
| `legacyRefs` | Copie **intacte** de `lastPerf` au moment de la migration (ou de la restauration d’une sauvegarde v1). Jamais modifiée ensuite (sauf « Effacer l’historique » et « Tout réinitialiser », qui la vident avec le reste). Sert de point de départ au recalcul des références (D3), parce que les séances d’avant 3B n’ont pas la cible de répétitions. |
| `legacySrc` | Séance d’origine de chaque référence de `legacyRefs` : `{ exercice: idSéance }` (même `ts`, ou même date et mêmes séries). Si cette séance est supprimée, la référence v1 est abandonnée et recalculée. |
| `historique[].upd` | Date de dernière modification de chaque séance (pour les anciennes : son heure `ts`). Préparé pour la synchro par séance (3C). |
| `historique[].log[].sets[].t` | **Nouvelles séances** : cible de répétitions de la série (`it.reps`). |
| `historique[].log[].b` | **Nouvelles séances** : répétitions prévues au départ, si différentes de la cible (`it.base`). |
| `corbeille` | **Depuis 3C** : séances supprimées de l’historique depuis moins de 30 jours, `[{ id, del, h }]` (`del` = date de suppression, `h` = la séance), 200 au plus. « Remettre » (Profil › Données › Corbeille) la replace dans l’historique. Champ facultatif : une version 3B l’ignore et le garde. Le format reste en version 2. |

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

### 4.1 Séance modifiée ou ajoutée à la main (D4, phase 3D)

`histSave(état, saisie, maintenant)` (`engine-user.js`) :
- une séance **modifiée** reçoit `upd` = maintenant (c’est la date qui départage deux appareils, voir 5.4) et la marque `ed: 1` ; une séance **ajoutée** reçoit un identifiant `rid()`, `ts` = date et heure choisies, `upd` = maintenant et la marque `ajout: 1` ;
- `sets`, `volume` (nouvelle règle D10 : 2 haltères comptés, assistance non comptée) et, si la durée change, `kcal` sont recalculés ; si rien n’a changé, rien n’est réécrit ;
- références (`rebuildRefs`) recalculées pour les exercices touchés, avant et après ; si la séance d’origine d’une référence v1 (`legacySrc`) a été modifiée (`ed`), cette référence v1 n’est plus utilisée (sinon une correction 600 → 60 kg d’une séance d’avant 3B serait sans effet) — `legacyRefs` elle-même n’est jamais modifiée ;
- palier : une séance ajoutée compte comme une séance faite (`csAddProgress`) ; une modification ne change pas le palier ;
- records (`pr`) recalculés pour la séance et les suivantes qui contiennent les exercices touchés ; une séance dont les records changent reçoit aussi `upd` (elle repart en ligne). La même mise à jour des records est faite après « Supprimer de l’historique ».

`ed` et `ajout` sont des champs **facultatifs** : le format reste en version 2 et le document en ligne garde la même forme (`{ v, upd, j, srv }`). Une version 3C qui reçoit une séance modifiée la remplace normalement (son `upd` est plus récent) et ignore ces champs. Les séances résumées (`c: 1`) ne se modifient pas.

---

## 5. Sauvegarde et synchro en ligne (phase 3C)

Le téléphone reste la référence : tout fonctionne sans réseau, la copie en ligne se fait quand le réseau est là. Une erreur de synchro (réseau, refus de Firebase, limite atteinte) ne retire jamais rien des données de l’appareil : ce qui n’est pas parti repart à la synchro suivante.

### 5.1 Comptes

- Un compte **e-mail + mot de passe par profil** (Firebase Authentication). Chaque profil a sa propre « app » Firebase nommée `fonte-<id du profil>` : sa connexion est gardée par Firebase sur l’appareil et ne se mélange pas avec celle d’un autre profil.
- **Liaison** : quand le profil relié à l’appareil (`owner`) crée son compte alors que l’appareil était connecté de façon anonyme (agenda partagé d’avant 3C), le compte anonyme est **relié** au nouveau compte : l’identifiant (`uid`) ne change pas, l’agenda partagé continue. Si le compte existe déjà (« Me connecter »), l’ancien agenda anonyme de l’appareil est retiré et l’agenda repart sous le compte.
- La configuration Firebase (`apiKey`, `projectId`…) vient de `fonte:sync` ; sur un téléphone qui ne la connaît pas encore, on colle le **code d’invitation** `FONTESYNC1.` (qui fait aussi rejoindre l’agenda partagé) ou le bloc `firebaseConfig`.

### 5.2 Documents en ligne (Firestore)

| Document | Contenu |
|---|---|
| `users/{uid}` | `{ v, app: "fonte", upd, agUpd, u, srv, profile, notes, mesures, mesSeances, deload, imports, agenda, legacy, clear }`. Chaque rubrique est enregistrée **en texte JSON** (Firestore ne peut alors rien modifier ni refuser : listes dans des listes, valeurs vides…), avec sa date de modification `u[rubrique]` (toujours strictement croissante). `legacy` = `{ legacyRefs, legacySrc }` ; `clear` = `{ histClear, histDel }`. `srv` = heure du serveur. |
| `users/{uid}/seances/{id}` | **Une séance = un document** : `{ v, upd, j, srv }` (`j` = la séance en texte JSON). Suppression : `{ v, upd, del, j, srv }` (marque `del` + date ; la séance reste lisible pour la corbeille des autres appareils). Effacée définitivement 30 jours après la suppression. |
| `espaces/{espace}/agendas/{uid}` | Agenda partagé (inchangé depuis 3A) : `{ v, upd, prenom, events }`. |

Tailles maximales (caractères), identiques dans les règles et dans `engine-sync.js` (un test le vérifie) : profil 20 000, notes 100 000, mesures 200 000, séances perso 300 000, semaine allégée 5 000, agendas importés 200 000, agenda 200 000, anciennes références 300 000, suppressions 50 000, séance 200 000. Une rubrique plus grosse n’est pas envoyée (elle reste sur le téléphone, l’écran le signale), le reste part. `lastPerf` et `refs` ne sont pas envoyés : ils sont **recalculés** à partir des séances (`rebuildRefs`).

### 5.3 État de synchro d’un profil (`fonte:p:<id>:sync`)

`{ v: 1, cfg, email, uid, cursor, sent, ru, su, seen, skip, lim, last, blocked }` :
`cursor` = heure du serveur (microsecondes) de la dernière séance reçue — on ne relit que les séances plus récentes ; `sent[rubrique]` = empreinte de la rubrique telle qu’envoyée ou reçue ; `ru` / `su` = dates `u` lues en ligne ; `seen[id]` = empreinte de chaque séance telle qu’en ligne (`~…` = supprimée) ; `skip` = séances d’un format plus récent (jamais réécrites) ; `lim` = compteurs du limiteur ; `last` = dernière synchro complète.

### 5.4 Une synchro (`csRun`)

1. **Lecture** : le document `users/{uid}` (1 lecture) et les séances dont l’heure du serveur est plus récente que `cursor` (une lecture par séance changée, une seule si rien n’a changé).
2. **Fusion** (`csMerge`, sans réseau, testée en Node) :
   - tout ce qui est reçu passe par `migrate` ; un document d’un **format plus récent** arrête tout : rien n’est fusionné ni écrit (« Mets l’appli à jour ») ;
   - rubrique changée d’un seul côté : ce côté gagne ; changée des deux côtés : union par identifiant (mesures, séances perso, agenda, agendas importés, notes, anciennes références), sinon la plus récente (profil, semaine allégée) ; suppressions (`histDel`) toujours additionnées, effacement complet : le plus récent ;
   - premier lien d’un téléphone **sans aucune séance** (neuf, réinstallé) : le profil en ligne l’emporte, même si le questionnaire vient d’être rempli ;
   - séances : une séance reçue s’ajoute ; une même séance modifiée des deux côtés : la plus récente (`upd`) gagne ; une suppression reçue retire la séance (dans la corbeille), sauf si elle a été modifiée ici après ; une version résumée (`c: 1`) ne remplace jamais le détail ;
   - **palier** : le profil gagnant a compté ses propres séances ; les séances qu’il ne connaissait pas sont ajoutées (ou retirées) une à une, avec la même logique que D3 (`csAddProgress`, `rebuildProgress`) ; un effacement complet ne change pas le palier ;
   - **références** : recalculées (`rebuildRefs`) pour les exercices des séances ajoutées, retirées ou modifiées ;
   - avant d’appliquer une synchro qui retire 3 séances ou plus, ou un effacement complet, l’appli fait une **copie de sécurité** (D5, « Revenir à l’état d’avant ») ; revenir en arrière refait revenir les séances partout (`csRevive`).
3. **Envoi** (`csPlan`) : les séances nouvelles ou modifiées (par groupes de 100), **puis** le document du profil, seul et à condition qu’il n’ait pas changé en ligne depuis la lecture (sinon tout recommence : deux appareils ne s’écrasent pas), puis les effacements définitifs (corbeille de plus de 30 jours). Le profil en ligne ne compte donc jamais une séance absente en ligne.
4. **Limiteur** : 60 écritures par minute et 1 500 par jour au plus, par profil et par appareil (le plan gratuit permet 20 000 écritures par jour pour tout le projet). Au-delà, la suite part plus tard (« Beaucoup de changements à envoyer »).

Quand : à l’ouverture de l’appli, 2 s après chaque changement, au retour du réseau, au retour dans l’appli et toutes les 5 minutes pendant qu’elle est ouverte ; jamais pendant une séance ou l’édition d’une séance (juste après).

### 5.5 Limites connues

- « Restaurer » une sauvegarde fichier remplace les données du téléphone mais n’efface pas les séances déjà en ligne : celles qui ne sont pas dans la sauvegarde restent en ligne (un nouvel appareil les récupérerait).
- Les séances effacées par « Effacer l’historique » ou « Tout réinitialiser » restent en ligne (ignorées par tous les appareils) ; elles ne sont pas dans la corbeille (la copie de sécurité D5 permet de revenir en arrière).
- Une rubrique trop grosse pour les règles reste sur le téléphone (message à l’écran).
