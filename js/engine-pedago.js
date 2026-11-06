/* ===== Fonte · moteur « pédagogie » : exercices (EX), libellés, charges de départ (LOAD) et animations des mouvements =====
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → app.js.
   Les déclarations de haut niveau sont partagées entre ces fichiers (comme lorsqu’ils formaient un seul index.html) :
   un fichier peut utiliser ce qu’un fichier précédent déclare. tools/assemble.js les recolle en un seul fichier (mode « artifact Claude »). */

/* ===== Base d'exercices =====
   X(id, nom, groupe, muscles principaux, secondaires, matériel, niveau 1-3, type r=répétitions t=temps, étapes, conseils, options)
   options : dt = durée par défaut (s), pc = par côté, imp = impact élevé (sauts), lo = alternative sans saut, deb = alternative débutant */
const EX = [];
function X(id, n, g, p, s, m, l, t, d, c, o) { EX.push(Object.assign({ id, n, g, p, s, m, l, t, d, c }, o || {})); }

/* ---------- PECTORAUX ---------- */
X("dc-barre","Développé couché à la barre","pecs",["pecs"],["epaules_ant","triceps"],["barre","banc"],2,"r",
["Allonge-toi sur le banc, les yeux sous la barre, pieds bien à plat au sol.","Saisis la barre un peu plus large que les épaules, serre les omoplates et garde une légère cambrure du haut du dos.","Descends la barre de façon contrôlée jusqu’au bas des pectoraux, coudes à environ 45° du buste.","Pousse la barre vers le haut en expirant jusqu’à bras tendus, sans verrouiller brutalement."],
["Fesses collées au banc, poignets alignés avec les avant-bras.","Avec une charge lourde, garde un partenaire ou règle les sécurités du rack."]);
X("dc-halteres","Développé couché aux haltères","pecs",["pecs"],["epaules_ant","triceps"],["halteres","banc"],1,"r",
["Assieds-toi au bout du banc, haltères posés sur les cuisses, puis allonge-toi en les ramenant contre la poitrine.","Pousse les haltères au-dessus de la poitrine, paumes tournées vers les pieds.","Descends lentement jusqu’à sentir l’étirement des pectoraux, coudes un peu sous le niveau du banc.","Remonte en rapprochant légèrement les haltères en haut du mouvement."],
["Plus d’amplitude qu’à la barre : idéal pour débuter et corriger un côté plus faible.","Ne laisse pas les haltères partir trop loin sur les côtés."]);
X("di-barre","Développé incliné à la barre","pecs",["pecs"],["epaules_ant","triceps"],["barre","banc"],2,"r",
["Règle le banc entre 30 et 45°.","Prise légèrement plus large que les épaules, omoplates serrées.","Descends la barre vers le haut des pectoraux, juste sous les clavicules.","Pousse verticalement jusqu’à bras tendus."],
["Cible surtout le haut des pectoraux.","Un banc trop incliné fait surtout travailler les épaules."]);
X("di-halteres","Développé incliné aux haltères","pecs",["pecs"],["epaules_ant","triceps"],["halteres","banc"],1,"r",
["Banc incliné à 30°, haltères à hauteur de poitrine.","Pousse les haltères vers le haut au-dessus des épaules.","Redescends lentement jusqu’à l’étirement des pectoraux.","Garde les omoplates serrées contre le banc tout au long du mouvement."],
["Excellent pour le haut des pecs avec une grande amplitude.","Expire en poussant, inspire en descendant."]);
X("dd-barre","Développé décliné à la barre","pecs",["pecs"],["triceps","epaules_ant"],["barre","banc"],2,"r",
["Cale tes jambes sous les boudins du banc décliné.","Décroche la barre avec l’aide du rack ou d’un partenaire.","Descends la barre vers le bas des pectoraux.","Pousse en gardant les coudes à environ 45°."],
["Cible le bas des pectoraux.","Relève-toi doucement entre les séries : le sang monte à la tête."]);
X("ecarte-halteres","Écarté couché aux haltères","pecs",["pecs"],["epaules_ant"],["halteres","banc"],1,"r",
["Allongé sur un banc plat, haltères au-dessus de la poitrine, paumes face à face.","Garde les coudes légèrement fléchis et fixes pendant tout le mouvement.","Ouvre les bras en arc de cercle jusqu’à sentir l’étirement des pectoraux.","Referme comme si tu enlaçais un tronc d’arbre."],
["Prends plus léger qu’au développé : c’est un exercice d’isolation.","Ne descends pas les coudes trop bas pour protéger tes épaules."]);
X("ecarte-incline","Écarté incliné aux haltères","pecs",["pecs"],["epaules_ant"],["halteres","banc"],1,"r",
["Banc incliné à 30°, haltères au-dessus de la poitrine, paumes face à face.","Coudes légèrement fléchis, ouvre les bras en arc de cercle.","Descends jusqu’à l’étirement du haut des pectoraux.","Remonte en contractant la poitrine."],
["Version qui cible le haut des pectoraux.","Mouvement lent et contrôlé, sans à-coups."]);
X("pec-deck","Pec deck (butterfly)","pecs",["pecs"],["epaules_ant"],["machine"],1,"r",
["Règle le siège pour que les poignées soient à hauteur de poitrine.","Dos collé au dossier, saisis les poignées coudes légèrement fléchis.","Rapproche les bras devant toi en contractant les pectoraux.","Reviens lentement jusqu’à l’étirement, sans laisser claquer les charges."],
["Marque une pause d’une seconde bras fermés.","Garde les épaules basses, loin des oreilles."]);
X("vis-a-vis","Écarté à la poulie vis-à-vis","pecs",["pecs"],["epaules_ant"],["poulie"],2,"r",
["Règle les deux poulies en position haute et saisis une poignée dans chaque main.","Avance d’un pas, buste légèrement penché, un pied devant l’autre.","Ramène les mains devant le bas de ta poitrine en arc de cercle.","Reviens lentement en gardant la tension."],
["Poulies hautes : bas des pecs. Poulies basses : haut des pecs.","Coudes légèrement fléchis et fixes."]);
X("presse-pecs","Développé assis à la machine (chest press)","pecs",["pecs"],["triceps","epaules_ant"],["machine"],1,"r",
["Règle le siège pour que les poignées arrivent au milieu de la poitrine.","Dos et tête contre le dossier, saisis les poignées.","Pousse devant toi jusqu’à bras presque tendus.","Reviens lentement jusqu’à ce que les mains soient au niveau de la poitrine."],
["Parfait pour apprendre le geste de poussée en sécurité.","Ne décolle pas le dos du dossier."]);
X("pompes","Pompes","pecs",["pecs"],["triceps","epaules_ant","abdos"],["pdc"],1,"r",
["Mains au sol un peu plus larges que les épaules, corps aligné de la tête aux talons.","Gaine les abdos et serre les fessiers.","Descends la poitrine jusqu’à frôler le sol, coudes à environ 45°.","Pousse fort pour revenir bras tendus."],
["Trop dur ? Passe aux pompes sur les genoux ou mains surélevées.","Ne laisse pas les hanches s’affaisser."]);
X("pompes-genoux","Pompes sur les genoux","pecs",["pecs"],["triceps","epaules_ant"],["pdc"],1,"r",
["Genoux au sol, mains un peu plus larges que les épaules.","Aligne genoux, hanches et épaules.","Descends la poitrine vers le sol en contrôlant.","Pousse pour remonter bras tendus."],
["L’étape idéale pour progresser vers les pompes classiques.","Garde le ventre rentré pendant tout le mouvement."]);
X("pompes-inclinees","Pompes inclinées (mains surélevées)","pecs",["pecs"],["triceps","epaules_ant"],["pdc","banc"],1,"r",
["Pose les mains sur un banc, une marche ou une barre, corps bien droit.","Descends la poitrine vers le support en pliant les coudes.","Pousse pour revenir bras tendus."],
["Plus le support est haut, plus c’est facile.","Baisse le support au fil des semaines pour progresser."]);
X("pompes-declinees","Pompes déclinées (pieds surélevés)","pecs",["pecs","epaules_ant"],["triceps","abdos"],["pdc","banc"],2,"r",
["Pieds posés sur un banc, mains au sol un peu plus larges que les épaules.","Corps gainé et aligné.","Descends le visage et la poitrine vers le sol.","Pousse pour remonter."],
["Accent sur le haut des pectoraux et les épaules.","Ne creuse pas le bas du dos."]);
X("pompes-archer","Pompes archer","pecs",["pecs"],["triceps","epaules_ant","abdos"],["pdc"],3,"r",
["Mains très écartées au sol, corps gainé.","Descends vers une main en gardant l’autre bras presque tendu sur le côté.","Remonte, puis alterne de côté à chaque répétition."],
["Une progression vers la pompe sur un bras.","Garde les hanches face au sol."],{deb:"pompes"});
X("dips-pecs","Dips buste penché (pectoraux)","pecs",["pecs"],["triceps","epaules_ant"],["dips"],3,"r",
["Monte sur les barres parallèles, bras tendus.","Penche le buste vers l’avant d’environ 30°, coudes légèrement écartés.","Descends jusqu’à ce que les épaules arrivent au niveau des coudes.","Pousse pour remonter sans verrouiller brutalement."],
["Ne descends pas trop bas si tu ressens une gêne à l’épaule.","Pour débuter, utilise la machine à dips assistés."],{deb:"dips-assiste"});
X("pull-over","Pull-over à l’haltère","pecs",["pecs","dorsaux"],["triceps","abdos"],["halteres","banc"],2,"r",
["Allongé sur le banc, tiens un haltère à deux mains au-dessus de la poitrine.","Bras légèrement fléchis, descends l’haltère derrière la tête en arc de cercle.","Va jusqu’à sentir l’étirement de la cage thoracique et des dorsaux.","Ramène l’haltère au-dessus de la poitrine."],
["Contrôle la descente, surtout si tes épaules sont raides.","Garde les hanches basses et le ventre gainé."]);
X("smith-incline","Développé incliné à la Smith machine","pecs",["pecs"],["epaules_ant","triceps"],["smith","banc"],1,"r",
["Place un banc incliné à 30° sous la barre guidée.","Décroche la barre en la tournant, mains un peu plus larges que les épaules.","Descends vers le haut de la poitrine.","Pousse jusqu’à bras tendus et raccroche en fin de série."],
["Le guidage sécurise le mouvement : bon choix sans partenaire.","Vérifie que la barre arrive bien sous les clavicules."]);
X("squeeze-press","Squeeze press aux haltères","pecs",["pecs"],["triceps"],["halteres","banc"],1,"r",
["Allongé, haltères collés l’un contre l’autre au-dessus de la poitrine.","Presse-les fort l’un contre l’autre pendant tout le mouvement.","Descends jusqu’à la poitrine puis remonte."],
["Exercice de finition très efficace pour l’intérieur des pectoraux.","Utilise des charges légères."]);

/* ---------- DOS ---------- */
X("tractions","Tractions pronation","dos",["dorsaux"],["biceps","rhomboides","avantbras"],["traction"],3,"r",
["Saisis la barre paumes vers l’avant, mains un peu plus larges que les épaules.","Pars bras tendus, épaules engagées (tirées vers le bas).","Tire en amenant la poitrine vers la barre jusqu’à passer le menton au-dessus.","Redescends lentement jusqu’aux bras tendus."],
["Pas encore de traction ? Fais-les assistées ou en négatif (descente lente de 5 s).","Évite de te balancer pour monter."],{deb:"tractions-assistees"});
X("tractions-supination","Tractions supination (chin-up)","dos",["dorsaux","biceps"],["rhomboides","avantbras"],["traction"],3,"r",
["Saisis la barre paumes vers toi, mains largeur d’épaules.","Pars bras tendus, gainé.","Tire jusqu’à passer le menton au-dessus de la barre.","Redescends sous contrôle."],
["Un peu plus facile que la pronation grâce aux biceps.","Garde les coudes vers l’avant en montant."],{deb:"tractions-assistees"});
X("tractions-assistees","Tractions assistées","dos",["dorsaux"],["biceps","rhomboides"],["machine"],1,"r",
["Sur la machine, règle le contrepoids : plus il est lourd, plus c’est facile.","Genoux sur la plateforme, saisis les poignées paumes vers l’avant.","Tire jusqu’à amener le menton au niveau des mains.","Redescends lentement bras tendus."],
["Diminue l’assistance au fil des semaines.","Avec un élastique : passe-le sous un pied ou un genou."]);
X("tirage-vertical","Tirage vertical poitrine","dos",["dorsaux"],["biceps","rhomboides","epaules_post"],["poulie"],1,"r",
["Assieds-toi, cuisses bloquées sous les boudins.","Saisis la barre en pronation, plus large que les épaules.","Tire la barre vers le haut de la poitrine en sortant légèrement la poitrine.","Remonte lentement jusqu’aux bras tendus."],
["Pense à tirer avec les coudes plutôt qu’avec les mains.","Ne tire jamais la barre derrière la nuque."]);
X("tirage-serre","Tirage vertical prise serrée","dos",["dorsaux"],["biceps","rhomboides"],["poulie"],1,"r",
["Installe une poignée triangle et saisis-la paumes face à face.","Buste légèrement incliné en arrière, poitrine sortie.","Tire la poignée vers le haut de la poitrine.","Remonte lentement jusqu’à l’étirement complet."],
["Plus d’amplitude et un bon travail du bas des dorsaux.","Garde les épaules basses."]);
X("tirage-horizontal","Tirage horizontal assis (poulie basse)","dos",["rhomboides","dorsaux"],["biceps","epaules_post","lombaires"],["poulie"],1,"r",
["Assis, pieds sur les cales, genoux légèrement fléchis.","Dos droit, saisis la poignée bras tendus.","Tire la poignée vers le nombril en serrant les omoplates.","Reviens lentement sans arrondir le dos."],
["Le buste reste presque immobile : ne te balance pas.","Pause d’une seconde omoplates serrées."]);
X("rowing-barre","Rowing barre buste penché","dos",["dorsaux","rhomboides"],["epaules_post","biceps","lombaires","ischios"],["barre"],2,"r",
["Barre en main, penche le buste à environ 45° en poussant les fesses en arrière.","Dos plat, genoux légèrement fléchis.","Tire la barre vers le nombril en serrant les omoplates.","Redescends sous contrôle."],
["Le dos ne doit jamais s’arrondir.","Allège la charge si tu dois te redresser pour tirer."]);
X("rowing-haltere","Rowing haltère à un bras","dos",["dorsaux","rhomboides"],["biceps","epaules_post"],["halteres","banc"],1,"r",
["Pose un genou et une main sur le banc, dos plat parallèle au sol.","Haltère dans l’autre main, bras tendu.","Tire l’haltère vers la hanche en gardant le coude près du corps.","Redescends lentement."],
["Ne fais pas pivoter le buste pour monter la charge.","Fais toutes les répétitions d’un côté, puis change."],{pc:1});
X("rowing-t","Rowing T-bar","dos",["dorsaux","rhomboides"],["biceps","lombaires","epaules_post"],["barre"],2,"r",
["Place-toi au-dessus de la barre, poignée en V sous la barre.","Buste penché à 45°, dos plat, genoux fléchis.","Tire la barre vers la poitrine.","Redescends en contrôlant."],
["Excellent pour l’épaisseur du dos.","Regarde légèrement devant toi pour garder la nuque neutre."]);
X("rowing-machine","Rowing assis à la machine","dos",["rhomboides","dorsaux"],["biceps","epaules_post"],["machine"],1,"r",
["Règle le siège pour que les poignées soient à hauteur de poitrine.","Poitrine contre l’appui, saisis les poignées.","Tire les coudes vers l’arrière en serrant les omoplates.","Reviens lentement."],
["Variante sûre et guidée du rowing barre.","Garde la poitrine collée à l’appui."]);
X("rowing-inverse","Rowing inversé (australian pull-up)","dos",["rhomboides","dorsaux"],["biceps","abdos"],["pdc","barre"],1,"r",
["Sous une barre fixée à hauteur de hanches, saisis-la bras tendus.","Corps droit, talons au sol.","Tire la poitrine vers la barre en serrant les omoplates.","Redescends lentement."],
["Plus ton corps est à l’horizontale, plus c’est difficile.","Super préparation aux tractions."]);
X("souleve-terre","Soulevé de terre","dos",["ischios","fessiers","lombaires"],["quadriceps","trapezes","dorsaux","avantbras"],["barre"],3,"r",
["Pieds largeur de hanches, barre au-dessus du milieu des pieds.","Fléchis hanches et genoux pour saisir la barre, dos plat, poitrine sortie.","Pousse dans le sol et tends hanches et genoux ensemble, barre collée aux jambes.","Redescends en poussant d’abord les fesses en arrière."],
["Le dos reste neutre du début à la fin, jamais arrondi.","Apprends le geste avec un kettlebell avant de charger la barre."],{deb:"sdt-kettlebell"});
X("sdt-kettlebell","Soulevé de terre au kettlebell","dos",["fessiers","ischios"],["lombaires","quadriceps","avantbras"],["kettlebell"],1,"r",
["Kettlebell entre les pieds, pieds largeur de hanches.","Pousse les fesses en arrière, dos plat, et saisis la poignée.","Relève-toi en poussant dans le sol et en serrant les fessiers.","Redescends en contrôlant."],
["L’exercice idéal pour apprendre le soulevé de terre.","Le kettlebell reste entre les pieds, jamais devant."]);
X("extension-lombaire","Extensions lombaires (banc à 45°)","dos",["lombaires"],["fessiers","ischios"],["machine"],1,"r",
["Cale tes hanches contre le coussin, pieds bloqués.","Bras croisés sur la poitrine, corps aligné.","Descends le buste en fléchissant les hanches, dos plat.","Remonte jusqu’à l’alignement, sans te cambrer au-delà."],
["Contrôle chaque répétition, sans élan.","Tiens un disque contre la poitrine pour progresser."]);
X("superman","Superman","dos",["lombaires"],["fessiers","epaules_post"],["pdc"],1,"r",
["Allongé sur le ventre, bras tendus devant toi.","Décolle en même temps bras, poitrine et jambes du sol.","Tiens 2 secondes en serrant les fessiers.","Redescends doucement."],
["Regarde le sol pour garder la nuque neutre.","Pas besoin de monter haut : la contraction suffit."]);
X("pull-over-poulie","Pull-over à la poulie haute (bras tendus)","dos",["dorsaux"],["triceps","abdos"],["poulie"],1,"r",
["Face à la poulie haute, saisis la barre ou la corde bras presque tendus.","Penche légèrement le buste vers l’avant.","Ramène la barre vers les cuisses en arc de cercle en contractant les dorsaux.","Remonte lentement."],
["Les bras restent presque tendus : ce sont les dorsaux qui travaillent.","Idéal pour bien sentir ses dorsaux avant les tractions."]);
X("shrug-halteres","Shrugs aux haltères","dos",["trapezes"],["avantbras"],["halteres"],1,"r",
["Debout, un haltère dans chaque main, bras le long du corps.","Hausse les épaules vers les oreilles le plus haut possible.","Tiens 1 seconde en haut.","Redescends lentement."],
["Mouvement vertical uniquement : ne fais pas rouler les épaules.","Garde la nuque neutre, sans avancer la tête."]);
X("shrug-barre","Shrugs à la barre","dos",["trapezes"],["avantbras"],["barre"],1,"r",
["Debout, barre devant les cuisses, prise largeur d’épaules.","Hausse les épaules le plus haut possible.","Tiens 1 seconde puis redescends lentement."],
["Permet de charger lourd : utilise des sangles si la prise lâche.","Bras tendus pendant tout le mouvement."]);
X("rowing-elastique","Rowing à l’élastique","dos",["rhomboides","dorsaux"],["biceps","epaules_post"],["elastique"],1,"r",
["Fixe l’élastique devant toi à hauteur de poitrine.","Recule pour créer de la tension, bras tendus.","Tire les coudes vers l’arrière en serrant les omoplates.","Reviens lentement."],
["Parfait à la maison ou en échauffement.","Garde les épaules basses."]);

/* ---------- ÉPAULES ---------- */
X("dm-barre","Développé militaire à la barre (debout)","epaules",["epaules_ant"],["epaules_lat","triceps","trapezes","abdos"],["barre"],2,"r",
["Barre sur le haut de la poitrine, mains un peu plus larges que les épaules.","Serre fessiers et abdos pour ne pas te cambrer.","Pousse la barre au-dessus de la tête en reculant légèrement la tête pour la laisser passer.","Redescends sous contrôle jusqu’au haut de la poitrine."],
["Gainage indispensable : le bas du dos ne doit pas se creuser.","Commence léger, c’est un exercice exigeant."]);
X("dm-halteres","Développé épaules aux haltères (assis)","epaules",["epaules_ant"],["epaules_lat","triceps"],["halteres","banc"],1,"r",
["Assis sur un banc à dossier vertical, haltères à hauteur d’épaules, paumes vers l’avant.","Pousse les haltères au-dessus de la tête sans les cogner.","Redescends jusqu’à ce que les coudes soient au niveau des épaules."],
["Le dossier protège le bas du dos.","Garde les coudes légèrement en avant du buste."]);
X("arnold","Développé Arnold","epaules",["epaules_ant","epaules_lat"],["triceps"],["halteres","banc"],2,"r",
["Assis, haltères devant les épaules, paumes vers toi.","Pousse vers le haut en tournant les paumes vers l’avant.","Redescends en refaisant la rotation inverse."],
["La rotation fait travailler l’épaule sur une plus grande amplitude.","Mouvement fluide, sans à-coups."]);
X("presse-epaules","Développé épaules à la machine","epaules",["epaules_ant"],["epaules_lat","triceps"],["machine"],1,"r",
["Règle le siège pour que les poignées soient à hauteur d’épaules.","Dos contre le dossier, pousse vers le haut.","Redescends lentement sans laisser les charges se toucher."],
["Idéal pour débuter en sécurité.","Ne verrouille pas les coudes en haut."]);
X("elevations-laterales","Élévations latérales aux haltères","epaules",["epaules_lat"],["trapezes"],["halteres"],1,"r",
["Debout, haltères le long du corps, buste légèrement penché vers l’avant.","Monte les bras sur les côtés, coudes légèrement fléchis, jusqu’à hauteur d’épaules.","Les petits doigts restent un peu plus hauts que les pouces.","Redescends lentement."],
["Prends léger : l’élan vole le travail aux épaules.","Ne monte pas au-dessus des épaules."]);
X("elev-lat-poulie","Élévation latérale à la poulie","epaules",["epaules_lat"],["trapezes"],["poulie"],2,"r",
["Poulie basse à côté de toi, saisis la poignée avec la main opposée.","Monte le bras sur le côté jusqu’à hauteur d’épaule.","Redescends lentement en gardant la tension."],
["La poulie garde une tension constante, même en bas du mouvement.","Fais toutes les répétitions d’un côté, puis change."],{pc:1});
X("elevations-frontales","Élévations frontales","epaules",["epaules_ant"],["epaules_lat"],["halteres"],1,"r",
["Debout, haltères devant les cuisses.","Monte un bras ou les deux devant toi jusqu’à hauteur des yeux.","Redescends lentement."],
["Souvent facultatif si tu fais déjà du développé.","Ne balance pas le buste."]);
X("oiseau","Oiseau (élévations buste penché)","epaules",["epaules_post"],["rhomboides","trapezes"],["halteres"],1,"r",
["Assis au bout d’un banc ou debout, buste penché presque à l’horizontale.","Haltères sous la poitrine, coudes légèrement fléchis.","Ouvre les bras sur les côtés jusqu’à hauteur d’épaules.","Redescends sous contrôle."],
["Nuque neutre, dos plat.","Essentiel pour une posture droite et des épaules équilibrées."]);
X("reverse-pec-deck","Pec deck inversé (oiseau machine)","epaules",["epaules_post"],["rhomboides","trapezes"],["machine"],1,"r",
["Assis face au dossier de la machine, poitrine contre l’appui.","Saisis les poignées bras tendus devant toi.","Ouvre les bras vers l’arrière en serrant les omoplates.","Reviens lentement."],
["Garde les épaules basses.","Pause d’une seconde bras ouverts."]);
X("face-pull","Face pull","epaules",["epaules_post"],["rhomboides","trapezes"],["poulie"],1,"r",
["Poulie haute avec une corde, saisis-la paumes vers le bas.","Recule d’un pas, bras tendus devant toi.","Tire la corde vers ton visage en écartant les mains, coudes hauts.","Reviens lentement."],
["Excellent pour la santé des épaules : à faire souvent.","Termine le mouvement mains à côté des oreilles."]);
X("rowing-menton","Tirage menton (rowing debout)","epaules",["epaules_lat","trapezes"],["biceps","epaules_ant"],["barre"],2,"r",
["Debout, barre devant les cuisses, prise largeur d’épaules ou plus large.","Monte la barre le long du corps en levant les coudes.","Arrête quand les coudes sont à hauteur d’épaules.","Redescends lentement."],
["Prise large et amplitude limitée pour épargner les épaules.","Arrête si tu ressens une douleur à l’avant de l’épaule."]);
X("pike-pushup","Pompes piquées (pike push-up)","epaules",["epaules_ant"],["triceps","trapezes","pecs"],["pdc"],2,"r",
["En position de pompe, monte les fesses pour former un V inversé.","Fléchis les bras pour amener le haut du crâne vers le sol, entre les mains.","Pousse pour revenir."],
["Pieds surélevés sur un banc pour corser.","Prépare aux pompes en équilibre."]);
X("rotation-externe","Rotations externes (coiffe des rotateurs)","epaules",["epaules_post"],["rhomboides"],["elastique","poulie"],1,"r",
["Coude collé au corps, plié à 90°, élastique ou poignée dans la main.","Tourne l’avant-bras vers l’extérieur sans décoller le coude.","Reviens lentement."],
["Charge très légère : c’est un exercice de prévention.","Parfait en échauffement avant le développé."],{pc:1});
X("elevations-y","Élévations en Y sur banc incliné","epaules",["trapezes","epaules_post"],["epaules_lat","rhomboides"],["halteres","banc"],1,"r",
["Allongé sur le ventre sur un banc incliné à 30°, haltères légers en main.","Monte les bras tendus devant toi en formant un Y.","Tiens une seconde puis redescends lentement."],
["Renforce le bas des trapèzes : top pour la posture.","Pouces vers le plafond."]);

/* ---------- BICEPS ---------- */
X("curl-barre","Curl à la barre droite","biceps",["biceps"],["avantbras"],["barre"],1,"r",
["Debout, barre en supination (paumes vers l’avant), mains largeur d’épaules.","Coudes collés au corps.","Fléchis les bras pour monter la barre vers les épaules.","Redescends lentement jusqu’aux bras tendus."],
["Ne balance pas le buste pour tricher.","La descente lente compte autant que la montée."]);
X("curl-ez","Curl à la barre EZ","biceps",["biceps"],["avantbras"],["ez"],1,"r",
["Saisis la barre EZ sur les parties coudées, paumes vers le haut.","Coudes fixes le long du corps.","Monte la barre vers les épaules.","Redescends lentement."],
["La barre coudée soulage les poignets.","Garde les épaules immobiles."]);
X("curl-halteres","Curl haltères alterné","biceps",["biceps"],["avantbras"],["halteres"],1,"r",
["Debout, haltères le long du corps, paumes face à face.","Monte un haltère en tournant la paume vers le haut.","Redescends et alterne avec l’autre bras."],
["La rotation du poignet contracte encore plus le biceps.","Garde le coude fixe."]);
X("curl-marteau","Curl marteau","biceps",["biceps","avantbras"],[],["halteres"],1,"r",
["Haltères en main, paumes face à face (prise neutre).","Monte les haltères sans tourner les poignets.","Redescends lentement."],
["Développe le brachial et les avant-bras pour des bras plus épais.","Peut se faire en alterné."]);
X("curl-incline","Curl incliné aux haltères","biceps",["biceps"],["avantbras"],["halteres","banc"],2,"r",
["Assis sur un banc incliné à 45-60°, bras pendants.","Monte les haltères en gardant les coudes immobiles.","Redescends lentement jusqu’à l’étirement complet."],
["L’étirement du biceps en bas rend l’exercice très efficace.","Charges plus légères qu’au curl debout."]);
X("curl-pupitre","Curl au pupitre (Larry Scott)","biceps",["biceps"],["avantbras"],["ez","machine"],1,"r",
["Assis, aisselles calées en haut du pupitre, barre EZ en main.","Monte la barre vers les épaules.","Redescends sans tendre brutalement les bras en bas."],
["Isole le biceps : impossible de tricher.","Contrôle bien la fin de la descente."]);
X("curl-concentre","Curl concentré","biceps",["biceps"],[],["halteres"],1,"r",
["Assis, coude calé contre l’intérieur de la cuisse.","Monte l’haltère vers l’épaule.","Contracte 1 seconde, redescends lentement."],
["Concentre-toi sur la contraction, pas sur la charge.","Fais toutes les répétitions d’un côté, puis change."],{pc:1});
X("curl-poulie","Curl à la poulie basse","biceps",["biceps"],["avantbras"],["poulie"],1,"r",
["Face à la poulie basse, saisis la barre paumes vers le haut.","Coudes collés au corps, monte la barre vers les épaules.","Redescends lentement."],
["La tension reste constante sur toute l’amplitude.","Recule d’un petit pas pour garder la tension en bas."]);
X("curl-araignee","Curl araignée (spider curl)","biceps",["biceps"],[],["halteres","banc"],2,"r",
["Poitrine contre un banc incliné, bras pendants dans le vide.","Monte les haltères en gardant les coudes fixes.","Contracte en haut puis redescends lentement."],
["Contraction maximale du biceps en haut du mouvement.","Utilise des charges légères."]);

/* ---------- TRICEPS ---------- */
X("barre-front","Barre au front (skull crusher)","triceps",["triceps"],[],["ez","banc"],2,"r",
["Allongé sur un banc, barre EZ au-dessus de la poitrine, bras tendus.","Plie les coudes pour descendre la barre vers le front ou juste derrière la tête.","Les coudes restent fixes et pointés vers le plafond.","Tends les bras pour remonter."],
["Descends lentement, la barre passe près de la tête.","Si les coudes tirent, passe aux haltères."]);
X("extension-corde","Extension triceps à la poulie (corde)","triceps",["triceps"],[],["poulie"],1,"r",
["Face à la poulie haute, saisis la corde.","Coudes collés au corps, pousse vers le bas jusqu’à bras tendus en écartant la corde.","Remonte lentement jusqu’à ce que les avant-bras soient à l’horizontale."],
["Seuls les avant-bras bougent.","Écarte bien la corde en bas pour contracter au maximum."]);
X("extension-barre-poulie","Extension triceps à la poulie (barre)","triceps",["triceps"],[],["poulie"],1,"r",
["Face à la poulie haute, saisis la barre en pronation.","Coudes collés au corps, pousse vers le bas jusqu’à bras tendus.","Remonte lentement."],
["Permet de charger un peu plus qu’avec la corde.","Ne penche pas le buste au-dessus de la barre."]);
X("extension-nuque","Extension nuque à l’haltère","triceps",["triceps"],[],["halteres"],1,"r",
["Assis ou debout, tiens un haltère à deux mains au-dessus de la tête.","Descends l’haltère derrière la tête en pliant les coudes.","Remonte en tendant les bras."],
["Coudes serrés et pointés vers le haut.","Travaille la longue portion du triceps, très étirée."]);
X("extension-nuque-poulie","Extension au-dessus de la tête à la poulie","triceps",["triceps"],[],["poulie"],2,"r",
["Dos à la poulie, corde au-dessus de la tête, un pied devant l’autre.","Coudes près de la tête, tends les bras vers l’avant et le haut.","Reviens lentement jusqu’à l’étirement."],
["Très bon étirement de la longue portion.","Garde le buste gainé."]);
X("kickback","Kickback à l’haltère","triceps",["triceps"],[],["halteres","banc"],1,"r",
["Buste penché, un genou et une main sur le banc.","Coude collé au corps, bras parallèle au sol.","Tends l’avant-bras vers l’arrière.","Reviens lentement."],
["Le coude ne bouge pas.","Charges légères, contraction franche."],{pc:1});
X("dips-banc","Dips sur banc","triceps",["triceps"],["pecs","epaules_ant"],["pdc","banc"],1,"r",
["Mains sur le bord d’un banc derrière toi, jambes tendues ou fléchies.","Descends en pliant les coudes jusqu’à 90°.","Pousse pour remonter."],
["Garde le dos proche du banc.","Jambes fléchies = plus facile."]);
X("dips-triceps","Dips aux barres parallèles (triceps)","triceps",["triceps"],["pecs","epaules_ant"],["dips"],3,"r",
["En appui sur les barres, bras tendus, buste bien droit.","Descends en pliant les coudes, gardés près du corps.","Arrête quand les bras font 90°.","Pousse pour remonter."],
["Buste droit = triceps. Buste penché = pectoraux.","Ne descends pas trop bas."],{deb:"dips-assiste"});
X("dips-assiste","Dips assistés à la machine","triceps",["triceps"],["pecs","epaules_ant"],["machine"],1,"r",
["Règle le contrepoids, genoux sur la plateforme.","Mains sur les poignées, bras tendus.","Descends jusqu’à 90° aux coudes puis remonte."],
["Réduis l’assistance petit à petit.","Garde les épaules basses."]);
X("dc-serre","Développé couché prise serrée","triceps",["triceps"],["pecs","epaules_ant"],["barre","banc"],2,"r",
["Allongé, mains écartées de la largeur des épaules.","Descends la barre vers le bas de la poitrine, coudes près du corps.","Pousse en tendant les bras."],
["Ne serre pas les mains trop près : ça fatigue les poignets.","Très efficace pour la force des triceps."]);
X("pompes-diamant","Pompes diamant","triceps",["triceps"],["pecs","epaules_ant"],["pdc"],2,"r",
["Mains rapprochées sous la poitrine, pouces et index formant un losange.","Corps gainé et aligné.","Descends la poitrine vers les mains, coudes près du corps.","Pousse pour remonter."],
["Trop dur ? Fais-les sur les genoux.","Garde les coudes vers l’arrière."]);

/* ---------- AVANT-BRAS ---------- */
X("curl-poignets","Curl des poignets","avantbras",["avantbras"],[],["halteres","barre","banc"],1,"r",
["Assis, avant-bras posés sur les cuisses, paumes vers le haut, poignets dans le vide.","Laisse la charge descendre vers les doigts.","Remonte en fléchissant les poignets."],
["Mouvement court mais complet.","Fais beaucoup de répétitions (15 à 20)."]);
X("extension-poignets","Extension des poignets","avantbras",["avantbras"],[],["halteres","barre","banc"],1,"r",
["Avant-bras sur les cuisses, paumes vers le bas.","Monte le dos de la main vers le plafond.","Redescends lentement."],
["Charges très légères.","Utile pour prévenir les douleurs au coude."]);
X("curl-inverse","Curl inversé","avantbras",["avantbras","biceps"],[],["ez","barre"],1,"r",
["Debout, barre en pronation (paumes vers le bas).","Coudes collés au corps, monte la barre.","Redescends lentement."],
["Garde les poignets alignés.","Plus léger qu’un curl classique."]);
X("farmer-walk","Marche du fermier","avantbras",["avantbras","trapezes"],["abdos","fessiers","quadriceps"],["halteres","kettlebell"],1,"t",
["Prends une charge lourde dans chaque main.","Tiens-toi droit, épaules basses, abdos gainés.","Marche à petits pas réguliers pendant le temps indiqué."],
["Excellent pour la prise et le gainage.","Pose les charges en pliant les jambes, dos droit."],{dt:40});
X("suspension","Suspension à la barre (dead hang)","avantbras",["avantbras"],["dorsaux","epaules_post"],["traction"],1,"t",
["Saisis la barre de traction, mains largeur d’épaules.","Laisse-toi pendre bras tendus, pieds décollés du sol.","Respire calmement et tiens le plus longtemps possible."],
["Améliore la prise et décompresse le dos.","Engage légèrement les épaules pour ne pas t’affaisser."],{dt:30});

/* ---------- ABDOS & GAINAGE ---------- */
X("planche","Gainage planche","abdos",["abdos"],["obliques","epaules_ant","fessiers"],["pdc"],1,"t",
["En appui sur les avant-bras et la pointe des pieds, coudes sous les épaules.","Corps aligné de la tête aux talons.","Serre les abdos et les fessiers, respire normalement.","Tiens la position pendant le temps indiqué."],
["Ne monte pas les fesses et ne creuse pas le dos.","Trop dur ? Pose les genoux au sol."],{dt:45});
X("planche-laterale","Gainage latéral","abdos",["obliques"],["abdos","abducteurs","epaules_lat"],["pdc"],1,"t",
["Allongé sur le côté, en appui sur un avant-bras, coude sous l’épaule.","Monte les hanches pour aligner tout le corps.","Tiens la position puis change de côté."],
["Les hanches ne doivent pas tomber.","Genou du dessous au sol pour une version plus facile."],{dt:30,pc:1});
X("crunch","Crunch","abdos",["abdos"],[],["pdc"],1,"r",
["Allongé sur le dos, genoux fléchis, pieds au sol.","Mains sur les tempes ou croisées sur la poitrine.","Enroule le haut du dos en décollant les omoplates.","Redescends lentement."],
["Ne tire pas sur la nuque.","Expire en montant."]);
X("crunch-inverse","Crunch inversé","abdos",["abdos"],["obliques"],["pdc"],1,"r",
["Allongé sur le dos, jambes fléchies à 90°, bras le long du corps.","Ramène les genoux vers la poitrine en décollant le bassin.","Redescends lentement sans poser les pieds."],
["Le mouvement vient du bassin, pas de l’élan des jambes.","Cible le bas des abdos."]);
X("releve-jambes-sol","Relevés de jambes au sol","abdos",["abdos"],[],["pdc"],1,"r",
["Allongé, jambes tendues, mains sous les fesses.","Monte les jambes jusqu’à la verticale.","Redescends lentement sans toucher le sol."],
["Garde le bas du dos plaqué au sol.","Plie légèrement les genoux si ça tire dans le dos."]);
X("releve-jambes-suspendu","Relevés de jambes suspendu","abdos",["abdos"],["obliques","avantbras"],["traction"],3,"r",
["Suspendu à la barre, bras tendus.","Monte les jambes tendues jusqu’à l’horizontale ou plus haut.","Redescends lentement sans te balancer."],
["Commence genoux fléchis si c’est trop dur.","Contrôle chaque descente."],{deb:"releve-genoux-chaise"});
X("releve-genoux-chaise","Relevés de genoux à la chaise romaine","abdos",["abdos"],["obliques"],["machine"],1,"r",
["Dos contre le dossier, avant-bras sur les appuis.","Monte les genoux vers la poitrine en enroulant le bassin.","Redescends lentement."],
["Ne te balance pas.","Pour progresser, monte les jambes tendues."]);
X("russian-twist","Russian twist","abdos",["obliques"],["abdos"],["pdc","medecine"],1,"r",
["Assis, buste incliné en arrière, pieds décollés (ou au sol pour débuter).","Mains jointes ou avec un poids devant la poitrine.","Tourne le buste d’un côté puis de l’autre."],
["Le mouvement vient du buste, pas seulement des bras.","Dos droit, sans t’arrondir."]);
X("mountain-climbers","Mountain climbers","abdos",["abdos"],["epaules_ant","quadriceps","cardio"],["pdc"],1,"t",
["En position de pompe, bras tendus.","Ramène un genou vers la poitrine puis l’autre, en alternance rapide.","Garde les hanches basses."],
["Plus lent = plus de gainage, plus rapide = plus de cardio.","Épaules au-dessus des mains."],{dt:30});
X("bicycle","Crunch bicyclette","abdos",["obliques","abdos"],[],["pdc"],1,"r",
["Allongé, mains sur les tempes, jambes décollées.","Amène le coude droit vers le genou gauche en tendant l’autre jambe.","Alterne de côté de façon contrôlée."],
["Ne tire pas sur la nuque.","Lent et précis vaut mieux que rapide."]);
X("dead-bug","Dead bug","abdos",["abdos"],["obliques"],["pdc"],1,"r",
["Allongé, bras tendus vers le plafond, genoux à 90° au-dessus des hanches.","Tends un bras derrière toi et la jambe opposée vers l’avant.","Reviens au centre et alterne."],
["Le bas du dos reste collé au sol en permanence.","Expire en tendant bras et jambe."]);
X("bird-dog","Bird dog","abdos",["lombaires","abdos"],["fessiers","epaules_post"],["pdc"],1,"r",
["À quatre pattes, mains sous les épaules, genoux sous les hanches.","Tends un bras devant toi et la jambe opposée derrière.","Tiens 2 secondes, reviens et alterne."],
["Le bassin reste horizontal : pas de rotation.","Excellent pour un dos solide."]);
X("hollow","Position creuse (hollow hold)","abdos",["abdos"],["obliques"],["pdc"],2,"t",
["Allongé sur le dos, bras tendus derrière la tête.","Décolle épaules et jambes tendues du sol en plaquant le bas du dos.","Tiens la position en forme de banane."],
["Genoux fléchis pour une version plus facile.","Le bas du dos ne doit jamais décoller."],{dt:30});
X("ab-wheel","Roue abdominale","abdos",["abdos"],["dorsaux","epaules_ant","obliques"],["roue"],3,"r",
["À genoux, mains sur la roue sous les épaules.","Roule vers l’avant en gardant le dos plat, aussi loin que possible.","Reviens en contractant les abdos."],
["Commence par de petites amplitudes.","Ne creuse jamais le bas du dos."],{deb:"planche"});
X("crunch-poulie","Crunch à la poulie haute","abdos",["abdos"],["obliques"],["poulie"],2,"r",
["À genoux face à la poulie, corde tenue près de la tête.","Enroule le buste vers le sol en contractant les abdos.","Remonte lentement."],
["Les hanches restent fixes : seul le buste s’enroule.","Permet d’ajouter de la charge."]);
X("pallof","Pallof press","abdos",["obliques","abdos"],[],["poulie","elastique"],1,"r",
["De profil à la poulie, poignée tenue contre la poitrine.","Pousse les mains devant toi sans laisser le buste tourner.","Tiens 2 secondes, ramène, puis change de côté."],
["Gainage anti-rotation : excellent pour protéger le dos.","Pieds largeur d’épaules, genoux souples."],{pc:1});
X("bucheron","Bûcheron à la poulie (woodchop)","abdos",["obliques"],["abdos","epaules_ant"],["poulie"],2,"r",
["Poulie haute sur le côté, saisis la poignée à deux mains.","Tire en diagonale vers la hanche opposée en pivotant le buste.","Reviens lentement, puis change de côté."],
["Pivote sur le pied arrière.","Bras presque tendus, le mouvement vient du tronc."],{pc:1});
X("shoulder-taps","Planche touches d’épaules","abdos",["abdos","obliques"],["epaules_ant"],["pdc"],2,"r",
["En position de pompe, pieds écartés.","Touche l’épaule opposée avec une main, puis alterne.","Garde les hanches immobiles."],
["Écarte davantage les pieds pour plus de stabilité.","Lentement, sans balancer le bassin."]);
X("v-ups","V-ups","abdos",["abdos"],["obliques"],["pdc"],2,"r",
["Allongé, bras tendus derrière la tête, jambes tendues.","Monte en même temps buste et jambes pour toucher tes pieds.","Redescends lentement."],
["Plie les genoux pour simplifier.","Expire en montant."]);
X("ciseaux","Battements de jambes (flutter kicks)","abdos",["abdos"],[],["pdc"],1,"t",
["Allongé, mains sous les fesses, jambes tendues légèrement décollées.","Fais de petits battements alternés de haut en bas.","Garde le bas du dos au sol."],
["Plus les jambes sont basses, plus c’est dur.","Respire régulièrement."],{dt:30});

/* ---------- QUADRICEPS ---------- */
X("squat-barre","Squat à la barre","quadriceps",["quadriceps","fessiers"],["adducteurs","lombaires","abdos","ischios"],["barre"],2,"r",
["Barre posée sur les trapèzes, pieds largeur d’épaules, pointes légèrement ouvertes.","Inspire, gaine le ventre et descends en poussant les fesses en arrière.","Descends au moins jusqu’à cuisses parallèles au sol, genoux dans l’axe des pieds.","Remonte en poussant dans tout le pied."],
["Le dos reste droit et les talons au sol.","Utilise les sécurités du rack."],{deb:"goblet-squat"});
X("front-squat","Front squat","quadriceps",["quadriceps"],["fessiers","abdos","adducteurs"],["barre"],3,"r",
["Barre posée à l’avant des épaules, coudes hauts.","Descends en gardant le buste très droit.","Remonte en poussant dans le sol, coudes toujours hauts."],
["Demande de la mobilité des poignets et des chevilles.","Cible davantage les quadriceps que le squat classique."],{deb:"goblet-squat"});
X("goblet-squat","Goblet squat","quadriceps",["quadriceps","fessiers"],["adducteurs","abdos"],["halteres","kettlebell"],1,"r",
["Tiens un haltère ou un kettlebell contre la poitrine.","Pieds un peu plus larges que les épaules.","Descends entre tes genoux en gardant le buste droit.","Remonte en poussant dans les talons."],
["Le meilleur exercice pour apprendre le squat.","Les coudes passent à l’intérieur des genoux en bas."]);
X("squat-pdc","Squat au poids du corps","quadriceps",["quadriceps","fessiers"],["adducteurs"],["pdc"],1,"r",
["Pieds largeur d’épaules, bras tendus devant toi.","Descends comme pour t’asseoir sur une chaise.","Remonte en serrant les fessiers."],
["Talons au sol, genoux dans l’axe des pieds.","Parfait pour l’échauffement."]);
X("presse-cuisses","Presse à cuisses","quadriceps",["quadriceps","fessiers"],["ischios","adducteurs"],["machine"],1,"r",
["Assis, dos bien plaqué, pieds largeur d’épaules au milieu de la plateforme.","Déverrouille les sécurités.","Descends en pliant les genoux jusqu’à 90° environ.","Pousse sans verrouiller complètement les genoux."],
["Le bas du dos ne doit pas décoller du dossier.","Pieds hauts = fessiers ; pieds bas = quadriceps."]);
X("hack-squat","Hack squat","quadriceps",["quadriceps"],["fessiers","adducteurs"],["machine"],2,"r",
["Dos contre le dossier, épaules sous les appuis.","Pieds largeur de hanches sur la plateforme.","Descends en contrôlant jusqu’à cuisses parallèles.","Remonte en poussant fort."],
["Mouvement guidé, idéal pour charger les quadriceps.","Genoux dans l’axe des pieds."]);
X("leg-extension","Leg extension","quadriceps",["quadriceps"],[],["machine"],1,"r",
["Assis, chevilles calées sous le boudin, genoux alignés avec l’axe de la machine.","Tends les jambes jusqu’à l’horizontale.","Contracte une seconde puis redescends lentement."],
["Pas d’élan, contrôle la descente.","Excellent en fin de séance jambes."]);
X("fentes-avant","Fentes avant aux haltères","quadriceps",["quadriceps","fessiers"],["ischios","adducteurs"],["halteres","pdc"],1,"r",
["Debout, haltères le long du corps.","Fais un grand pas en avant et descends jusqu’à ce que le genou arrière frôle le sol.","Pousse sur la jambe avant pour revenir.","Alterne les jambes."],
["Le genou avant reste au-dessus de la cheville.","Buste droit."]);
X("fentes-marchees","Fentes marchées","quadriceps",["quadriceps","fessiers"],["ischios","adducteurs","abdos"],["halteres","pdc"],2,"r",
["Haltères en main, avance en enchaînant les fentes.","Descends à chaque pas jusqu’à frôler le sol avec le genou arrière.","Pousse pour ramener la jambe arrière vers l’avant."],
["Grands pas = plus de fessiers.","Compte les répétitions par jambe."]);
X("fentes-arriere","Fentes arrière","quadriceps",["quadriceps","fessiers"],["ischios"],["halteres","pdc"],1,"r",
["Debout, recule une jambe d’un grand pas.","Descends jusqu’à ce que le genou arrière frôle le sol.","Reviens en poussant sur la jambe avant."],
["Plus douce pour les genoux que la fente avant.","Garde le buste droit."]);
X("squat-bulgare","Squat bulgare","quadriceps",["quadriceps","fessiers"],["ischios","adducteurs"],["halteres","banc"],2,"r",
["Dos à un banc, pose le dessus d’un pied dessus.","Haltères en main, descends sur la jambe avant.","Remonte en poussant dans le talon avant."],
["Très exigeant : commence sans charge.","Fais toutes les répétitions d’une jambe, puis change."],{pc:1});
X("step-up","Montées sur banc (step-up)","quadriceps",["quadriceps","fessiers"],["ischios","mollets"],["banc","halteres","pdc"],1,"r",
["Face à un banc ou une box, pose un pied entier dessus.","Monte en poussant sur cette jambe, sans t’aider de l’autre.","Redescends lentement et alterne."],
["Choisis une hauteur où le genou est à 90° environ.","Garde le buste droit."]);
X("squat-smith","Squat à la Smith machine","quadriceps",["quadriceps","fessiers"],["adducteurs"],["smith"],1,"r",
["Barre guidée sur les trapèzes, pieds légèrement en avant.","Décroche la barre et descends jusqu’aux cuisses parallèles.","Remonte en poussant dans le sol."],
["Pratique pour s’entraîner seul en sécurité.","Pieds un peu devant la barre pour protéger les genoux."]);
X("chaise","Chaise contre le mur","quadriceps",["quadriceps"],["fessiers","adducteurs"],["pdc"],1,"t",
["Dos contre un mur, descends jusqu’à former un angle droit aux genoux.","Cuisses parallèles au sol, bras le long du corps.","Tiens la position."],
["Ne pose pas les mains sur les cuisses.","Respire calmement."],{dt:45});
X("squat-saute","Squat sauté","quadriceps",["quadriceps","fessiers"],["mollets","cardio"],["pdc"],2,"r",
["Descends en squat, bras en arrière.","Saute le plus haut possible en lançant les bras.","Réceptionne-toi en douceur et enchaîne."],
["Atterris sur l’avant du pied, genoux souples.","Arrête si tu ressens une douleur aux genoux."],{imp:1,lo:"squat-pdc"});
X("pistol","Pistol squat","quadriceps",["quadriceps","fessiers"],["abdos","adducteurs"],["pdc"],3,"r",
["Debout sur une jambe, l’autre tendue devant toi.","Descends le plus bas possible sur la jambe d’appui.","Remonte sans poser l’autre pied."],
["Tiens-toi à un support pour apprendre.","Demande force, équilibre et mobilité de cheville."],{pc:1,deb:"squat-bulgare"});
X("fentes-laterales","Fentes latérales","quadriceps",["adducteurs","quadriceps"],["fessiers"],["pdc","halteres"],1,"r",
["Debout, pieds joints.","Fais un grand pas sur le côté et fléchis cette jambe, l’autre reste tendue.","Pousse pour revenir et alterne."],
["Fesses vers l’arrière, buste droit.","Étire et renforce l’intérieur des cuisses."]);

/* ---------- ISCHIO-JAMBIERS ---------- */
X("sdt-roumain","Soulevé de terre roumain (barre)","ischios",["ischios","fessiers"],["lombaires","avantbras"],["barre"],2,"r",
["Debout, barre devant les cuisses, genoux légèrement fléchis.","Pousse les fesses en arrière en laissant glisser la barre le long des jambes.","Descends jusqu’à sentir l’étirement des ischios, dos plat.","Remonte en serrant les fessiers."],
["Les genoux restent presque fixes.","La barre reste collée aux jambes."]);
X("sdt-roumain-halteres","Soulevé de terre roumain aux haltères","ischios",["ischios","fessiers"],["lombaires"],["halteres"],1,"r",
["Debout, haltères devant les cuisses.","Pousse les fesses en arrière, dos plat, genoux légèrement fléchis.","Descends les haltères le long des jambes jusqu’à mi-tibias.","Remonte en serrant les fessiers."],
["Pense « charnière de hanche », pas « pencher le dos ».","Regarde le sol à 2 m devant toi."]);
X("leg-curl-allonge","Leg curl allongé","ischios",["ischios"],["mollets"],["machine"],1,"r",
["Allongé sur le ventre, chevilles sous le boudin, genoux juste après le bord du banc.","Ramène les talons vers les fesses.","Redescends lentement."],
["Hanches plaquées sur le banc.","Pas d’élan."]);
X("leg-curl-assis","Leg curl assis","ischios",["ischios"],["mollets"],["machine"],1,"r",
["Assis, cuisses bloquées, boudin au-dessus des chevilles.","Fléchis les genoux pour ramener les talons sous le siège.","Reviens lentement."],
["L’étirement des ischios est meilleur qu’en version allongée.","Contrôle la remontée."]);
X("good-morning","Good morning","ischios",["ischios","lombaires"],["fessiers"],["barre"],2,"r",
["Barre sur les trapèzes, pieds largeur de hanches, genoux légèrement fléchis.","Penche le buste en avant en poussant les fesses en arrière, dos plat.","Remonte en contractant fessiers et ischios."],
["Commence très léger.","Le dos ne s’arrondit jamais."]);
X("nordic-curl","Nordic curl","ischios",["ischios"],["fessiers","mollets"],["pdc"],3,"r",
["À genoux, chevilles bloquées par un partenaire ou un support.","Corps droit, descends lentement vers l’avant en résistant avec les ischios.","Rattrape-toi avec les mains et repousse pour remonter."],
["Très intense : quelques répétitions suffisent.","Protège efficacement contre les blessures des ischios."],{deb:"leg-curl-allonge"});
X("sdt-unilateral","Soulevé de terre roumain unilatéral","ischios",["ischios","fessiers"],["lombaires","abducteurs"],["halteres","kettlebell"],2,"r",
["Debout sur une jambe, haltère dans la main opposée.","Penche le buste en tendant la jambe libre vers l’arrière.","Remonte en serrant le fessier de la jambe d’appui."],
["Hanches parallèles au sol.","Travaille aussi l’équilibre."],{pc:1});
X("leg-curl-swissball","Leg curl au swiss ball","ischios",["ischios"],["fessiers","lombaires"],["swissball"],2,"r",
["Allongé sur le dos, talons sur le ballon.","Monte les hanches pour aligner le corps.","Ramène le ballon vers les fesses en pliant les genoux, puis repousse."],
["Garde les hanches hautes pendant tout le mouvement.","Excellent à la maison."]);

/* ---------- FESSIERS ---------- */
X("hip-thrust","Hip thrust à la barre","fessiers",["fessiers"],["ischios","quadriceps"],["barre","banc"],1,"r",
["Haut du dos appuyé contre un banc, barre (avec protection) sur les hanches.","Pieds largeur de hanches, genoux à 90° en haut du mouvement.","Pousse les hanches vers le plafond en serrant les fessiers.","Redescends lentement."],
["Menton rentré, regard vers l’avant en haut.","Tiens 1 seconde en haut, fessiers contractés."]);
X("pont-fessier","Pont fessier","fessiers",["fessiers"],["ischios","lombaires"],["pdc"],1,"r",
["Allongé sur le dos, genoux fléchis, pieds au sol.","Monte les hanches en serrant les fessiers.","Tiens une seconde, redescends."],
["Pousse dans les talons.","Ajoute un poids sur les hanches pour progresser."]);
X("pont-unilateral","Pont fessier sur une jambe","fessiers",["fessiers"],["ischios","abducteurs"],["pdc"],2,"r",
["Allongé, un pied au sol, l’autre jambe tendue en l’air.","Monte les hanches en poussant dans le talon d’appui.","Redescends sans poser les fesses."],
["Hanches bien parallèles.","Fais toutes les répétitions d’un côté, puis change."],{pc:1});
X("kickback-poulie","Kickback fessier à la poulie","fessiers",["fessiers"],["ischios"],["poulie"],1,"r",
["Sangle à la cheville, face à la poulie basse.","Buste légèrement penché, mains sur la machine.","Pousse la jambe vers l’arrière en serrant le fessier.","Reviens lentement."],
["Ne creuse pas le bas du dos.","Fais toutes les répétitions d’une jambe, puis change."],{pc:1});
X("abduction-machine","Abduction à la machine","fessiers",["abducteurs"],["fessiers"],["machine"],1,"r",
["Assis, extérieur des genoux contre les coussins.","Écarte les jambes le plus loin possible.","Reviens lentement."],
["Buste légèrement penché en avant = plus de fessiers.","Contrôle le retour."]);
X("adduction-machine","Adduction à la machine","fessiers",["adducteurs"],[],["machine"],1,"r",
["Assis, intérieur des genoux contre les coussins, jambes écartées.","Rapproche les jambes en serrant.","Reviens lentement."],
["Ne choisis pas un écartement de départ trop grand.","Pas d’à-coups."]);
X("squat-sumo","Squat sumo","fessiers",["fessiers","adducteurs"],["quadriceps","ischios"],["halteres","kettlebell"],1,"r",
["Pieds très écartés, pointes ouvertes, haltère tenu entre les jambes.","Descends en écartant les genoux, buste droit.","Remonte en serrant fessiers et adducteurs."],
["Genoux dans l’axe des pieds.","Pose l’haltère sur un step pour plus d’amplitude."]);
X("donkey-kick","Donkey kicks","fessiers",["fessiers"],["ischios"],["pdc"],1,"r",
["À quatre pattes, mains sous les épaules.","Genou plié à 90°, pousse le pied vers le plafond.","Redescends sans poser le genou."],
["Le dos reste plat.","Ajoute un élastique pour corser."],{pc:1});
X("fire-hydrant","Fire hydrant","fessiers",["abducteurs"],["fessiers"],["pdc","elastique"],1,"r",
["À quatre pattes, dos plat.","Écarte un genou sur le côté en gardant le genou plié.","Redescends lentement."],
["Le bassin ne bascule pas.","Parfait en échauffement des hanches."],{pc:1});
X("marche-laterale","Marche latérale à l’élastique","fessiers",["abducteurs"],["fessiers","quadriceps"],["elastique"],1,"r",
["Élastique autour des genoux ou des chevilles, demi-squat.","Fais des pas chassés sur le côté en gardant la tension.","Fais le même nombre de pas dans l’autre sens."],
["Reste bas pendant tout l’exercice.","Les pieds ne se touchent jamais."]);
X("sdt-sumo","Soulevé de terre sumo","fessiers",["fessiers","adducteurs","ischios"],["quadriceps","lombaires","trapezes"],["barre"],3,"r",
["Pieds très écartés, pointes ouvertes, mains à l’intérieur des jambes.","Dos plat, poitrine sortie, genoux écartés.","Pousse dans le sol en écartant les genoux pour te relever.","Redescends sous contrôle."],
["Hanches plus basses qu’au soulevé de terre classique.","Garde la barre près du corps."],{deb:"squat-sumo"});
X("clamshell","Clamshell (coquillage)","fessiers",["abducteurs"],["fessiers"],["elastique","pdc"],1,"r",
["Allongé sur le côté, genoux fléchis, élastique autour des genoux.","Pieds collés, ouvre le genou du dessus.","Referme lentement."],
["Le bassin reste immobile.","Excellent pour les genoux et les hanches."],{pc:1});
X("fentes-croisees","Fentes croisées (curtsy lunge)","fessiers",["fessiers","quadriceps"],["abducteurs","adducteurs"],["pdc","halteres"],2,"r",
["Debout, croise une jambe derrière l’autre en diagonale.","Descends comme pour une révérence.","Reviens et alterne."],
["Cible bien le côté des fessiers.","Le genou avant reste dans l’axe du pied."]);
X("pull-through","Pull-through à la poulie","fessiers",["fessiers","ischios"],["lombaires"],["poulie"],1,"r",
["Dos à la poulie basse, corde entre les jambes.","Pousse les fesses en arrière, dos plat.","Redresse-toi en poussant les hanches vers l’avant et en serrant les fessiers."],
["Apprend le mouvement de hanche sans charger le dos.","Bras tendus et passifs."]);

/* ---------- MOLLETS ---------- */
X("mollets-debout","Extensions des mollets debout","mollets",["mollets"],[],["machine","pdc"],1,"r",
["Debout, avant des pieds sur une marche ou la machine, talons dans le vide.","Monte sur la pointe des pieds le plus haut possible.","Redescends lentement sous le niveau de la marche."],
["Pause d’une seconde en haut et en bas.","Pas de rebond."]);
X("mollets-assis","Mollets assis à la machine","mollets",["mollets"],[],["machine"],1,"r",
["Assis, genoux sous les coussins, avant des pieds sur la cale.","Monte les talons le plus haut possible.","Redescends lentement."],
["Cible le soléaire, sous le mollet.","Amplitude complète."]);
X("mollets-presse","Mollets à la presse","mollets",["mollets"],[],["machine"],1,"r",
["Assis à la presse, avant des pieds en bas de la plateforme, jambes tendues.","Pousse avec la pointe des pieds.","Reviens lentement."],
["Garde les sécurités à portée de main.","Genoux tendus mais pas verrouillés."]);
X("mollets-unilateral","Mollet unilatéral sur marche","mollets",["mollets"],[],["pdc","halteres"],1,"r",
["Sur une marche, un seul pied en appui, tiens-toi à un mur.","Monte sur la pointe, redescends sous la marche."],
["Ajoute un haltère dans la main du même côté.","Corrige un mollet plus faible."],{pc:1});
X("releves-pointes","Relevés de pointes (tibias)","mollets",["mollets"],[],["pdc"],1,"r",
["Dos contre un mur, talons à 30 cm du mur.","Relève la pointe des pieds le plus haut possible.","Redescends lentement."],
["Renforce l’avant des jambes.","Utile pour les coureurs."]);

/* ---------- FULL BODY / FONCTIONNEL ---------- */
X("burpees","Burpees","fullbody",["quadriceps","pecs","cardio"],["epaules_ant","triceps","abdos","fessiers"],["pdc"],2,"r",
["Debout, descends en squat et pose les mains au sol.","Saute les pieds en arrière en position de pompe (ajoute une pompe si tu veux).","Ramène les pieds vers les mains.","Saute en l’air bras tendus."],
["Trouve un rythme régulier plutôt que de partir trop vite.","Version douce : marche les pieds au lieu de sauter."],{imp:1,lo:"burpee-sans-saut"});
X("burpee-sans-saut","Burpee sans saut","fullbody",["quadriceps","pecs","cardio"],["abdos","epaules_ant"],["pdc"],1,"r",
["Debout, pose les mains au sol.","Recule un pied puis l’autre en position de planche.","Ramène les pieds un par un.","Relève-toi en tendant les bras."],
["Aucun impact : idéal pour les genoux.","Garde le gainage en planche."]);
X("kettlebell-swing","Kettlebell swing","fullbody",["fessiers","ischios"],["lombaires","epaules_ant","abdos","avantbras","cardio"],["kettlebell"],2,"r",
["Pieds un peu plus larges que les hanches, kettlebell devant toi.","Fais passer le kettlebell entre les jambes en poussant les fesses en arrière.","Projette les hanches vers l’avant pour lancer le kettlebell à hauteur de poitrine.","Laisse-le redescendre et enchaîne."],
["Ce sont les hanches qui lancent, pas les bras.","Dos plat, jamais arrondi."]);
X("thruster","Thruster","fullbody",["quadriceps","epaules_ant"],["fessiers","triceps","abdos","cardio"],["halteres","barre"],2,"r",
["Haltères à hauteur d’épaules, pieds largeur d’épaules.","Descends en squat.","Remonte et enchaîne directement un développé au-dessus de la tête.","Redescends les haltères aux épaules en repartant en squat."],
["Utilise l’élan des jambes pour pousser.","Très cardio : prends léger."]);
X("clean-press","Épaulé-développé aux haltères","fullbody",["fessiers","epaules_ant"],["quadriceps","trapezes","triceps","ischios"],["halteres"],3,"r",
["Haltères devant les cuisses, légère flexion de hanches.","Tire explosivement en remontant les haltères aux épaules.","Pousse-les au-dessus de la tête.","Redescends en deux temps."],
["Commence léger pour maîtriser le geste.","Le mouvement part des hanches."],{deb:"thruster"});
X("turkish-getup","Turkish get-up","fullbody",["epaules_ant","abdos"],["fessiers","obliques","quadriceps"],["kettlebell"],3,"r",
["Allongé, kettlebell tenu bras tendu vers le plafond.","Relève-toi étape par étape (coude, main, pont, genou) sans quitter la charge des yeux.","Une fois debout, refais le chemin inverse."],
["Apprends d’abord sans charge.","Lent et précis."],{pc:1});
X("wall-ball","Wall ball","fullbody",["quadriceps","epaules_ant"],["fessiers","triceps","cardio"],["medecine"],2,"r",
["Face à un mur, médecine-ball contre la poitrine.","Descends en squat.","Remonte et lance le ballon vers une cible en hauteur.","Rattrape-le et enchaîne en squat."],
["Atterrissage du ballon dans les mains, coudes souples.","Respire à chaque lancer."]);
X("box-jump","Box jump","fullbody",["quadriceps","fessiers"],["mollets","cardio"],["box"],2,"r",
["Face à une box stable, pieds largeur de hanches.","Fléchis les jambes et saute sur la box.","Réceptionne-toi en douceur, debout.","Redescends en marchant."],
["Commence avec une box basse.","Ne redescends jamais en sautant en arrière."],{imp:1,lo:"step-up"});
X("bear-crawl","Marche de l’ours","fullbody",["abdos","epaules_ant"],["quadriceps","triceps","cardio"],["pdc"],2,"t",
["À quatre pattes, genoux décollés de quelques centimètres.","Avance en bougeant main et pied opposés.","Garde le dos plat."],
["Petits pas, hanches basses.","Peut se faire en avant puis en arrière."],{dt:30});
X("sled-push","Poussée de traîneau","fullbody",["quadriceps","fessiers"],["mollets","epaules_ant","cardio"],["traineau"],2,"t",
["Mains sur les poignées, buste penché à 45°.","Pousse en faisant des pas courts et puissants.","Garde le dos plat."],
["Très efficace et sans impact.","Charge modérée pour garder la vitesse."],{dt:20});
X("renegade-row","Renegade row","fullbody",["dorsaux","abdos"],["obliques","triceps","epaules_post"],["halteres"],2,"r",
["En position de pompe, mains sur deux haltères, pieds écartés.","Tire un haltère vers la hanche sans faire tourner le bassin.","Repose et alterne."],
["Pieds écartés pour plus de stabilité.","Utilise des haltères hexagonaux qui ne roulent pas."]);
X("slam-ball","Slam ball","fullbody",["dorsaux","abdos"],["epaules_ant","triceps","cardio"],["medecine"],1,"r",
["Ballon lesté tenu au-dessus de la tête, bras tendus.","Lance-le violemment au sol devant toi en pliant les jambes.","Ramasse-le et recommence."],
["Utilise un ballon prévu pour (qui ne rebondit pas).","Dos plat en ramassant."]);

/* ---------- CARDIO ---------- */
X("tapis-course","Course sur tapis","cardio",["cardio","quadriceps"],["mollets","ischios","fessiers"],["tapis"],1,"t",
["Démarre en marchant 2-3 minutes pour t’échauffer.","Augmente la vitesse jusqu’à un rythme où tu peux encore parler.","Garde une foulée courte et légère."],
["Mets une inclinaison de 1 % pour simuler l’extérieur.","Ne te tiens pas aux barres."],{dt:900,imp:1,lo:"marche-inclinee"});
X("marche-inclinee","Marche inclinée sur tapis","cardio",["cardio","fessiers"],["mollets","ischios"],["tapis"],1,"t",
["Règle une inclinaison entre 8 et 12 %.","Marche à 4,5-5,5 km/h.","Garde le buste droit, sans te tenir."],
["Excellent cardio sans impact.","Augmente l’inclinaison pour plus d’intensité."],{dt:1200});
X("velo","Vélo d’appartement","cardio",["cardio","quadriceps"],["mollets","fessiers"],["velo"],1,"t",
["Règle la selle : jambe presque tendue en bas du coup de pédale.","Pédale à un rythme régulier.","Augmente la résistance pour plus d’intensité."],
["Doux pour les articulations.","Parfait pour l’échauffement ou le fractionné."],{dt:900});
X("rameur","Rameur","cardio",["cardio","dorsaux","quadriceps"],["ischios","fessiers","biceps","abdos"],["rameur"],1,"t",
["Pieds sanglés, saisis la poignée bras tendus.","Pousse d’abord avec les jambes, puis bascule le buste et tire avec les bras.","Reviens dans l’ordre inverse : bras, buste, jambes."],
["60 % jambes, 20 % dos, 20 % bras.","Un cardio très complet."],{dt:600});
X("elliptique","Vélo elliptique","cardio",["cardio"],["quadriceps","fessiers","pecs"],["elliptique"],1,"t",
["Pieds sur les pédales, mains sur les poignées mobiles.","Pédale à un rythme régulier en poussant et tirant les bras.","Ajuste la résistance."],
["Zéro impact : idéal pour débuter.","Pédale à l’envers pour varier."],{dt:900});
X("stairmaster","Escalier (stair climber)","cardio",["cardio","fessiers","quadriceps"],["mollets"],["machine"],2,"t",
["Monte les marches à un rythme régulier.","Pose tout le pied sur chaque marche.","Évite de t’appuyer sur les barres."],
["Très efficace pour les fessiers.","Commence lentement."],{dt:600});
X("corde-sauter","Corde à sauter","cardio",["cardio","mollets"],["epaules_ant","avantbras"],["corde"],2,"t",
["Coudes près du corps, la corde tourne avec les poignets.","Petits sauts sur l’avant des pieds.","Garde un rythme régulier."],
["Saute juste assez pour passer la corde.","Sol amortissant recommandé."],{dt:60,imp:1,lo:"step-jack"});
X("jumping-jacks","Jumping jacks","cardio",["cardio"],["epaules_lat","mollets","abducteurs"],["pdc"],1,"t",
["Debout, pieds joints, bras le long du corps.","Saute en écartant les jambes et en levant les bras au-dessus de la tête.","Reviens en position de départ et enchaîne."],
["Parfait pour s’échauffer.","Atterris en douceur."],{dt:40,imp:1,lo:"step-jack"});
X("step-jack","Jumping jacks sans saut","cardio",["cardio"],["epaules_lat","abducteurs"],["pdc"],1,"t",
["Écarte une jambe sur le côté en levant les bras.","Reviens et alterne avec l’autre jambe.","Garde un rythme dynamique."],
["Aucun impact, mais fait bien monter le cardio.","Lève bien les bras."],{dt:40});
X("montees-genoux","Montées de genoux (high knees)","cardio",["cardio","quadriceps"],["abdos","mollets"],["pdc"],1,"t",
["Cours sur place en montant les genoux à hauteur de hanches.","Bras actifs.","Reste sur l’avant des pieds."],
["Buste droit.","Accélère sur les dernières secondes."],{dt:30,imp:1,lo:"marche-genoux"});
X("marche-genoux","Montées de genoux marchées","cardio",["cardio"],["abdos","quadriceps"],["pdc"],1,"t",
["Monte un genou à hauteur de hanche en levant le bras opposé.","Alterne rapidement, sans sauter."],
["Version sans impact des montées de genoux.","Contracte les abdos à chaque montée."],{dt:40});
X("talons-fesses","Talons-fesses","cardio",["cardio","ischios"],["mollets"],["pdc"],1,"t",
["Cours sur place en ramenant les talons vers les fesses.","Bras actifs.","Garde un rythme rapide."],
["Bon échauffement avant le cardio.","Genoux pointés vers le sol."],{dt:30,imp:1,lo:"marche-genoux"});
X("assault-bike","Air bike","cardio",["cardio","quadriceps"],["epaules_ant","dorsaux"],["velo"],2,"t",
["Assis, mains sur les poignées mobiles.","Pousse et tire avec bras et jambes en même temps.","Plus tu vas vite, plus la résistance augmente."],
["Parfait pour le fractionné.","Sans impact."],{dt:30});
X("battle-ropes","Battle ropes","cardio",["cardio","epaules_ant"],["avantbras","abdos","quadriceps"],["cordes"],2,"t",
["Demi-squat, une extrémité de corde dans chaque main.","Fais des vagues en alternant les bras rapidement.","Garde le dos droit."],
["Varie : vagues doubles, cercles, slams.","Respire régulièrement."],{dt:30});
X("shadow-boxing","Shadow boxing","cardio",["cardio"],["epaules_ant","obliques","triceps"],["pdc"],1,"t",
["En garde, pieds décalés, poings au menton.","Enchaîne directs, crochets et uppercuts dans le vide.","Reste léger sur tes appuis."],
["Ramène toujours les poings au visage.","Super pour se défouler."],{dt:60});
X("skater-jumps","Sauts du patineur","cardio",["cardio","fessiers"],["quadriceps","abducteurs","mollets"],["pdc"],2,"t",
["Saute latéralement d’une jambe sur l’autre.","Réceptionne-toi sur une jambe, l’autre passe derrière.","Enchaîne d’un côté à l’autre."],
["Atterrissage souple, genou fléchi.","Plus le saut est grand, plus c’est intense."],{dt:30,imp:1,lo:"fentes-laterales"});

/* ---------- MOBILITÉ & ÉTIREMENTS (groupes « mobilite » : mouvements, « etirements » : postures tenues) ---------- */
X("etirement-ischios","Étirement des ischios (assis)","etirements",["ischios"],["mollets","lombaires"],["pdc"],1,"t",
["Assis, une jambe tendue, l’autre pliée.","Penche le buste vers la jambe tendue en gardant le dos droit.","Tiens en respirant profondément."],
["Ne force pas, tu dois sentir un étirement agréable.","Change de côté."],{dt:30,pc:1});
X("etirement-quadriceps","Étirement des quadriceps (debout)","etirements",["quadriceps"],[],["pdc"],1,"t",
["Debout, attrape ta cheville et ramène le talon vers la fesse.","Genoux serrés, bassin légèrement en avant.","Tiens-toi à un mur si besoin."],
["Ne cambre pas le dos.","Change de côté."],{dt:30,pc:1});
X("etirement-pectoraux","Étirement des pectoraux (au mur)","etirements",["pecs"],["epaules_ant"],["pdc"],1,"t",
["Avant-bras contre un mur ou un montant, coude à hauteur d’épaule.","Tourne doucement le buste à l’opposé.","Tiens en respirant."],
["Super après une séance de pecs.","Change de côté."],{dt:30,pc:1});
X("posture-enfant","Posture de l’enfant","etirements",["lombaires","dorsaux"],["fessiers"],["pdc"],1,"t",
["À genoux, assieds-toi sur les talons.","Allonge les bras devant toi, front au sol.","Respire lentement dans le dos."],
["Écarte les genoux pour plus de confort.","Idéal en fin de séance."],{dt:45});
X("chat-vache","Chat-vache","mobilite",["lombaires"],["abdos","trapezes"],["pdc"],1,"t",
["À quatre pattes, mains sous les épaules.","Inspire en creusant le dos et en levant la tête.","Expire en arrondissant le dos et en rentrant le menton.","Alterne lentement."],
["Synchronise le mouvement avec ta respiration.","Parfait pour réveiller le dos."],{dt:45});
X("pigeon","Posture du pigeon","etirements",["fessiers"],["abducteurs","lombaires"],["pdc"],1,"t",
["À quatre pattes, ramène un genou vers la main du même côté, tibia en travers.","Allonge l’autre jambe vers l’arrière.","Descends le buste vers le sol."],
["Étire profondément les fessiers.","Change de côté."],{dt:45,pc:1});
X("fente-psoas","Étirement du psoas (fente basse)","etirements",["quadriceps"],["abdos"],["pdc"],1,"t",
["En fente, genou arrière au sol.","Avance le bassin en serrant le fessier arrière.","Garde le buste droit."],
["Idéal si tu restes assis longtemps.","Change de côté."],{dt:30,pc:1});
X("rotation-thoracique","Rotations thoraciques (open book)","mobilite",["obliques"],["pecs","rhomboides"],["pdc"],1,"t",
["Allongé sur le côté, genoux pliés, bras tendus devant toi.","Ouvre le bras du dessus vers l’arrière en suivant la main des yeux.","Reviens lentement et répète."],
["Les genoux restent collés au sol.","Améliore la mobilité du haut du dos."],{dt:30,pc:1});
X("cercles-bras","Cercles de bras","mobilite",["epaules_lat"],["epaules_ant","epaules_post"],["pdc"],1,"t",
["Debout, bras tendus sur les côtés.","Fais des cercles de plus en plus grands vers l’avant.","Puis change de sens."],
["Échauffement idéal avant le haut du corps.","Mouvement fluide."],{dt:30});
X("etirement-triceps","Étirement des triceps","etirements",["triceps"],["dorsaux"],["pdc"],1,"t",
["Lève un bras, plie le coude pour amener la main derrière la tête.","Avec l’autre main, pousse doucement le coude.","Tiens en respirant."],
["Ne force pas sur l’épaule.","Change de côté."],{dt:30,pc:1});
X("etirement-mollets","Étirement des mollets (au mur)","etirements",["mollets"],[],["pdc"],1,"t",
["Mains contre un mur, une jambe tendue derrière, talon au sol.","Avance le bassin vers le mur.","Tiens en respirant."],
["Plie le genou arrière pour étirer le soléaire.","Change de côté."],{dt:30,pc:1});
X("world-greatest","World’s greatest stretch","mobilite",["fessiers","quadriceps"],["ischios","obliques","adducteurs"],["pdc"],1,"t",
["En fente avant, pose les deux mains au sol à l’intérieur du pied avant.","Descends le coude vers la cheville.","Ouvre le bras vers le plafond en tournant le buste.","Change de côté."],
["L’échauffement le plus complet qui soit.","Bouge lentement."],{dt:40,pc:1});
X("squat-profond","Squat profond tenu","mobilite",["adducteurs","fessiers"],["mollets","lombaires"],["pdc"],1,"t",
["Pieds un peu plus larges que les épaules, descends le plus bas possible.","Coudes contre l’intérieur des genoux pour les écarter.","Tiens en gardant les talons au sol."],
["Tiens-toi à un support si besoin.","Améliore hanches et chevilles."],{dt:45});
X("papillon","Papillon (adducteurs)","etirements",["adducteurs"],[],["pdc"],1,"t",
["Assis, plantes des pieds collées, genoux écartés.","Tiens tes pieds et penche le buste en avant, dos droit.","Laisse les genoux descendre vers le sol."],
["Ne force pas sur les genoux.","Respire profondément."],{dt:45});
X("cobra","Cobra","etirements",["abdos"],["lombaires","pecs"],["pdc"],1,"t",
["Allongé sur le ventre, mains sous les épaules.","Pousse doucement pour lever le buste, hanches au sol.","Tiens en respirant."],
["Ne monte pas trop haut si ça pince dans le dos.","Épaules basses."],{dt:30});
X("dislocations-epaules","Dislocations d’épaules (bâton ou élastique)","mobilite",["epaules_ant","epaules_post"],["pecs"],["elastique"],1,"r",
["Tiens un bâton ou un élastique avec une prise très large.","Bras tendus, passe-le au-dessus de la tête jusque derrière toi.","Reviens devant de la même façon."],
["Plus la prise est large, plus c’est facile.","Parfait avant le développé."]);
X("foam-roller","Rouleau de massage (foam roller)","mobilite",["quadriceps","ischios"],["mollets","dorsaux"],["rouleau"],1,"t",
["Place le rouleau sous le muscle à masser.","Roule lentement d’avant en arrière.","Marque une pause sur les zones tendues."],
["Évite de rouler directement sur les articulations.","Respire, ne te crispe pas."],{dt:60});
X("etirement-trapezes","Étirement de la nuque et des trapèzes","etirements",["trapezes"],[],["pdc"],1,"t",
["Assis ou debout, penche la tête sur le côté.","Avec la main, accompagne doucement le mouvement.","Garde l’épaule opposée basse."],
["Très doux : pas de mouvement brusque.","Change de côté."],{dt:30,pc:1});

/* ---------- ÉTIREMENTS (ajouts) ---------- */
X("etirement-biceps","Étirement des biceps (au mur)","etirements",["biceps"],["avantbras","epaules_ant"],["pdc"],1,"t",
["Pose la paume contre un mur, doigts vers l’arrière, bras tendu à hauteur d’épaule.","Tourne doucement le buste à l’opposé du mur.","Tiens en respirant, sans verrouiller le coude."],
["Tu dois sentir l’étirement dans le pli du coude et l’avant du bras.","Change de côté."],{dt:30,pc:1});
X("etirement-avantbras","Étirement des avant-bras et poignets","etirements",["avantbras"],["biceps"],["pdc"],1,"t",
["Bras tendu devant toi, paume vers le haut.","Avec l’autre main, tire doucement les doigts vers le bas.","Puis retourne la main, paume vers le bas, et tire le dos de la main vers toi."],
["Parfait après les tractions, le rowing ou le curl.","Change de côté."],{dt:30,pc:1});
X("etirement-dorsaux","Étirement du grand dorsal (inclinaison latérale)","etirements",["dorsaux"],["obliques","triceps"],["pdc"],1,"t",
["Debout, pieds serrés, lève un bras au-dessus de la tête.","Attrape le poignet avec l’autre main et incline-toi sur le côté.","Pousse la hanche du côté étiré vers l’extérieur."],
["Ne bascule ni vers l’avant ni vers l’arrière.","Change de côté."],{dt:30,pc:1});
X("etirement-epaules","Étirement des épaules (bras croisé)","etirements",["epaules_post"],["epaules_lat","rhomboides"],["pdc"],1,"t",
["Passe un bras tendu devant la poitrine.","Avec l’autre main, ramène-le contre toi au niveau du coude.","Garde l’épaule basse, loin de l’oreille."],
["Idéal après les exercices d’épaules et de dos.","Change de côté."],{dt:30,pc:1});
X("etirement-epaules-ant","Ouverture des épaules (mains dans le dos)","etirements",["epaules_ant","pecs"],["biceps"],["pdc"],1,"t",
["Debout, croise les doigts dans le bas du dos, bras tendus.","Serre les omoplates et éloigne doucement les mains du dos.","Garde le buste droit et le menton rentré."],
["Ouvre la poitrine après les développés et les pompes.","Si tes mains ne se rejoignent pas, tiens une serviette."],{dt:30});
X("etirement-haut-dos","Étirement du haut du dos (dos rond)","etirements",["rhomboides"],["trapezes","dorsaux"],["pdc"],1,"t",
["Croise les doigts devant toi, bras tendus à hauteur d’épaule.","Pousse les mains vers l’avant en arrondissant le haut du dos.","Rentre le menton et écarte les omoplates."],
["Respire dans le dos pour l’ouvrir.","Super après le rowing."],{dt:30});
X("etirement-fessiers","Étirement des fessiers (en 4, allongé)","etirements",["fessiers"],["abducteurs","lombaires"],["pdc"],1,"t",
["Allongé sur le dos, genoux pliés, pose une cheville sur le genou opposé.","Attrape l’arrière de la cuisse et ramène les jambes vers toi.","Garde la tête et les épaules au sol."],
["Version plus douce que le pigeon.","Change de côté."],{dt:30,pc:1});
X("genoux-poitrine","Genoux à la poitrine","etirements",["lombaires"],["fessiers"],["pdc"],1,"t",
["Allongé sur le dos, ramène les deux genoux contre la poitrine.","Entoure-les avec les bras.","Relâche le bas du dos et respire lentement."],
["Soulage le bas du dos après les squats et les soulevés de terre.","Tu peux te balancer doucement de gauche à droite."],{dt:30});
X("torsion-allongee","Torsion allongée","etirements",["obliques"],["lombaires","fessiers","pecs"],["pdc"],1,"t",
["Allongé sur le dos, bras en croix.","Ramène un genou plié et laisse-le tomber de l’autre côté du corps.","Garde les deux épaules au sol et tourne la tête à l’opposé."],
["Très doux pour le dos : laisse la gravité faire.","Change de côté."],{dt:30,pc:1});

const EX_BY_ID = Object.fromEntries(EX.map(e => [e.id, e]));
/* ===== Libellés ===== */
const MUSCLES = {
  pecs: "Pectoraux", epaules_ant: "Deltoïde antérieur", epaules_lat: "Deltoïde latéral", epaules_post: "Deltoïde postérieur",
  biceps: "Biceps", triceps: "Triceps", avantbras: "Avant-bras", trapezes: "Trapèzes", dorsaux: "Grand dorsal",
  rhomboides: "Milieu du dos", lombaires: "Lombaires", abdos: "Abdominaux", obliques: "Obliques", fessiers: "Grand fessier",
  abducteurs: "Moyen fessier", adducteurs: "Adducteurs", quadriceps: "Quadriceps", ischios: "Ischio-jambiers",
  mollets: "Mollets", cardio: "Cœur & souffle"
};
const GROUPS = [
  ["pecs", "Pectoraux"], ["dos", "Dos"], ["epaules", "Épaules"], ["biceps", "Biceps"], ["triceps", "Triceps"],
  ["avantbras", "Avant-bras"], ["abdos", "Abdos & gainage"], ["quadriceps", "Quadriceps"], ["ischios", "Ischios"],
  ["fessiers", "Fessiers"], ["mollets", "Mollets"], ["fullbody", "Full body"], ["cardio", "Cardio"], ["mobilite", "Mobilité"], ["etirements", "Étirements"]
];
const GROUP_LABEL = Object.fromEntries(GROUPS);
const MATERIEL = {
  pdc: "Poids du corps", barre: "Barre", halteres: "Haltères", machine: "Machine", poulie: "Poulie", banc: "Banc",
  dips: "Barres parallèles", smith: "Smith machine", traction: "Barre de traction", kettlebell: "Kettlebell",
  elastique: "Élastique", ez: "Barre EZ", medecine: "Médecine-ball", roue: "Roue abdo", swissball: "Swiss ball",
  box: "Box", traineau: "Traîneau", tapis: "Tapis de course", velo: "Vélo", rameur: "Rameur", elliptique: "Elliptique",
  corde: "Corde à sauter", cordes: "Battle ropes", rouleau: "Foam roller"
};
const NIVEAUX = { 1: "Débutant", 2: "Intermédiaire", 3: "Avancé" };

/* Charges de départ : [type, ratio, options]. ratio = 1RM estimé ÷ poids de corps pour un homme débutant (ou charge de travail directe avec « w »).
   Types : b barre (total, barre comprise), e barre EZ, s Smith, d haltère (poids d’un haltère), k kettlebell, m machine, c poulie, a assistance (contrepoids), x poids fixe [homme, femme].
   Options : L bas du corps, S un seul haltère, P au poids du corps pour débuter, w charge de travail directe. */
const LOAD = {
  "dc-barre": ["b", .55], "di-barre": ["b", .47], "dd-barre": ["b", .55], "dc-serre": ["b", .48], "squat-barre": ["b", .75, "L"], "front-squat": ["b", .58, "L"],
  "sdt-roumain": ["b", .7, "L"], "souleve-terre": ["b", 1, "L"], "sdt-sumo": ["b", .95, "L"], "good-morning": ["b", .38, "L"], "hip-thrust": ["b", .85, "L"],
  "rowing-barre": ["b", .5], "rowing-t": ["b", .5], "dm-barre": ["b", .36], "rowing-menton": ["b", .3], "shrug-barre": ["b", .8], "curl-barre": ["b", .25],
  "curl-ez": ["e", .23], "curl-inverse": ["e", .15], "curl-pupitre": ["e", .19], "barre-front": ["e", .2],
  "smith-incline": ["s", .45], "squat-smith": ["s", .7, "L"],
  "dc-halteres": ["d", .22], "di-halteres": ["d", .19], "ecarte-halteres": ["d", .1], "ecarte-incline": ["d", .09], "squeeze-press": ["d", .15],
  "pull-over": ["d", .22, "S"], "rowing-haltere": ["d", .26, "S"], "dm-halteres": ["d", .15], "arnold": ["d", .13], "elevations-laterales": ["d", .1],
  "elevations-frontales": ["d", .09], "oiseau": ["d", .07], "elevations-y": ["d", .04], "shrug-halteres": ["d", .3], "curl-halteres": ["d", .13],
  "curl-marteau": ["d", .14], "curl-incline": ["d", .1], "curl-concentre": ["d", .12, "S"], "curl-araignee": ["d", .09], "extension-nuque": ["d", .17, "S"],
  "kickback": ["d", .07, "S"], "curl-poignets": ["d", .1], "extension-poignets": ["d", .05], "goblet-squat": ["d", .3, "LS"], "fentes-avant": ["d", .12, "LP"],
  "fentes-marchees": ["d", .12, "LP"], "fentes-arriere": ["d", .12, "LP"], "squat-bulgare": ["d", .1, "LP"], "step-up": ["d", .1, "LP"],
  "sdt-roumain-halteres": ["d", .3, "L"], "sdt-unilateral": ["d", .2, "LS"], "squat-sumo": ["d", .35, "LS"], "thruster": ["d", .12], "clean-press": ["d", .12],
  "renegade-row": ["d", .12], "farmer-walk": ["d", .3, "w"],
  "sdt-kettlebell": ["k", .4, "L"], "kettlebell-swing": ["k", .22, "L"], "turkish-getup": ["k", .1],
  "presse-pecs": ["m", .5], "pec-deck": ["m", .35], "presse-epaules": ["m", .32], "reverse-pec-deck": ["m", .22], "rowing-machine": ["m", .5],
  "presse-cuisses": ["m", 1.5, "L"], "hack-squat": ["m", .8, "L"], "leg-extension": ["m", .45, "L"], "leg-curl-allonge": ["m", .32, "L"], "leg-curl-assis": ["m", .36, "L"],
  "abduction-machine": ["m", .5, "L"], "adduction-machine": ["m", .5, "L"], "mollets-debout": ["m", .9, "L"], "mollets-assis": ["m", .45, "L"], "mollets-presse": ["m", 1.1, "L"],
  "sled-push": ["m", .45, "Lw"],
  "vis-a-vis": ["c", .09], "tirage-vertical": ["c", .6], "tirage-serre": ["c", .55], "tirage-horizontal": ["c", .55], "pull-over-poulie": ["c", .22],
  "elev-lat-poulie": ["c", .045], "face-pull": ["c", .22], "curl-poulie": ["c", .26], "extension-corde": ["c", .22], "extension-barre-poulie": ["c", .26],
  "extension-nuque-poulie": ["c", .17], "crunch-poulie": ["c", .4], "pallof": ["c", .12], "bucheron": ["c", .15], "kickback-poulie": ["c", .07, "L"], "pull-through": ["c", .32, "L"],
  "tractions-assistees": ["a"], "dips-assiste": ["a"], "wall-ball": ["x", [6, 4]], "slam-ball": ["x", [6, 4]]
};
const DB_KG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50];
const KB_KG = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48];
const isAssist = id => !!(LOAD[id] && LOAD[id][0] === "a");
function chargeLabel(id, short) {
  const L = LOAD[id]; if (!L) return "Charge";
  if (L[0] === "a") return "Assistance";
  if (L[0] === "d") return (L[2] || "").indexOf("S") >= 0 ? "Haltère" : (short ? "Kg / haltère" : "Par haltère");
  if (L[0] === "k") return "Kettlebell";
  return "Charge";
}

/* ===== Animations « comment le faire » =====
   Figure articulée vue de profil (side, regard vers la droite), de face (front) ou en coupe (top : vue de dessus / end : vue depuis les pieds).
   Angles en degrés : 0 = vers le bas, 90 = vers la droite, 180 = vers le haut, -90 = vers la gauche. Sol à y = 0, y négatif vers le haut.
   Un membre = [angle segment 1, angle segment 2, angle main/pied] ou cible de cinématique inverse { k:[x,y] | j:"repère", o:[dx,dy] | r:[dx,dy], b:"x+"|"x-"|"y+"|"y-" }. */
const ANIM = (function () {
"use strict";
const D = 180 / Math.PI;
const F = { tl: 25, tu: 28, ua: 29, fa: 25, hd: 8, th: 43, sh: 41, ft: 15, nk: 7, hr: 10, sw: 14, hw: 8 };
const TOR = F.tl + F.tu, LEG = F.th + F.sh, ARM = F.ua + F.fa, AR = F.tl + F.tu - 5;
const dir = a => [Math.sin(a / D), Math.cos(a / D)];
const add = (p, a, l) => { const d = dir(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
const plus = (p, o) => [p[0] + o[0], p[1] + o[1]];
const angOf = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) * D;
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const mixP = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
function refl(p, c, ax) { const u = dir(ax), v = [p[0] - c[0], p[1] - c[1]], d = v[0] * u[0] + v[1] * u[1]; return [c[0] + 2 * d * u[0] - v[0], c[1] + 2 * d * u[1] - v[1]]; }
const flipB = b => typeof b === "number" ? -b : b === "x+" ? "x-" : b === "x-" ? "x+" : b;
const swapSide = s => /R$/.test(s) ? s.slice(0, -1) + "L" : /L$/.test(s) ? s.slice(0, -1) + "R" : s;
const na = a => ((a % 360) + 540) % 360 - 180;
function mir(s, c, ax) {
  if (s == null) return s;
  if (Array.isArray(s)) return [na(2 * ax - s[0]), na(2 * ax - s[1]), s[2] == null ? null : na(2 * ax - s[2]), s[3], s[4]];
  const o = Object.assign({}, s);
  if (s.b != null) o.b = flipB(s.b);
  if (s.k) o.k = refl(s.k, c, ax);
  if (s.j) o.j = swapSide(s.j);
  if (s.o) o.o = refl(s.o, [0, 0], ax);
  if (s.r) o.r = refl(s.r, [0, 0], ax);
  if (s.w != null) o.w = na(2 * ax - s.w);
  if (s.f != null) o.f = na(2 * ax - s.f);
  return o;
}
function lerp(a, b, u) {
  if (typeof a === "number") return typeof b === "number" ? a + (b - a) * u : a;
  if (Array.isArray(a)) return Array.isArray(b) && b.length === a.length ? a.map((x, i) => lerp(x, b[i], u)) : (u < .5 ? a : b);
  if (a && typeof a === "object") {
    if (!b || typeof b !== "object" || Array.isArray(b)) return u < .5 ? a : b;
    const o = {}; for (const k in a) o[k] = k in b ? lerp(a[k], b[k], u) : a[k]; for (const k in b) if (!(k in a)) o[k] = b[k]; return o;
  }
  return u < .5 ? a : (b === undefined ? a : b);
}

/* ---------- Cinématique ---------- */
function ik(R, T, l1, l2, b) {
  const d = Math.max(Math.abs(l1 - l2) + .01, Math.min(l1 + l2 - .01, dist(R, T)));
  const base = angOf(R, T), A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))) * D;
  let s = 1;
  if (typeof b === "number") s = b;
  else {
    const m1 = add(R, base + A, l1), m2 = add(R, base - A, l1);
    s = b === "x+" ? (m1[0] >= m2[0] ? 1 : -1) : b === "x-" ? (m1[0] <= m2[0] ? 1 : -1) : b === "y+" ? (m1[1] >= m2[1] ? 1 : -1) : (m1[1] <= m2[1] ? 1 : -1);
  }
  const M = add(R, base + s * A, l1);
  return [M, add(M, angOf(M, add(R, base, d)), l2), s, A];
}
function chain(J, root, s, l1, l2, db) {
  if (Array.isArray(s)) { const M = add(root, s[0], l1 * (s[3] == null ? 1 : s[3])); return [M, add(M, s[1], l2 * (s[4] == null ? 1 : s[4])), s[1], s[2]]; }
  const T = s.k ? s.k : s.j ? plus(J[s.j], s.o || [0, 0]) : plus(root, s.r || [0, 0]);
  const [M, E, sg, A] = ik(root, T, l1 * (s.s1 || 1), l2 * (s.s2 || 1), s.b == null ? db : s.b);
  return [M, E, angOf(M, E), s.w != null ? s.w : s.f, sg, A];
}
function arm(J, sd, root, s, db, sc) {
  if (!s) return;
  const c = chain(J, root, s, F.ua, F.fa, db), w = c[3] != null ? c[3] : c[2];
  if (c[4] != null) (J.sg || (J.sg = {}))["a" + sd] = [c[4], c[5]];
  J["r" + sd] = root; J["e" + sd] = c[0]; J["w" + sd] = c[1]; J["h" + sd] = add(c[1], w, F.hd * (sc || 1)); J["g" + sd] = add(c[1], w, 4 * (sc || 1));
}
function leg(J, sd, root, s, db, fdef, fl) {
  if (!s) return;
  const c = chain(J, root, s, F.th, F.sh, db), f = c[3] != null ? c[3] : fdef(c[2]);
  if (c[4] != null) (J.sg || (J.sg = {}))["l" + sd] = [c[4], c[5]];
  J["p" + sd] = root; J["k" + sd] = c[0]; J["a" + sd] = c[1]; J["t" + sd] = add(c[1], f, (fl || F.ft) - 4); J["q" + sd] = add(c[1], f, -4);
}
function normPose(P, v) {
  P = Object.assign({}, P);
  if (v === "side") { if (P.t == null) P.t = 180; if (P.t2 == null) P.t2 = P.t; if (P.n == null) P.n = P.t2; if (P.a2 === undefined) P.a2 = P.a; if (P.l2 === undefined) P.l2 = P.l; }
  else if (v === "front") {
    if (P.t == null) P.t = 180; if (P.tl == null) P.tl = 1; if (P.sh == null) P.sh = 0; if (P.n == null) P.n = P.t;
    if (P.aL === undefined) P.aL = mir(P.a, P.h, P.t); if (P.lL === undefined) P.lL = mir(P.l, P.h, P.t);
  } else { if (P.fr == null) P.fr = 180; if (P.rot == null) P.rot = 0; if (P.aL === undefined) P.aL = mir(P.a, P.c, P.fr); }
  return P;
}
function solve(P, v) {
  const J = {};
  if (v === "side") {
    J.hip = P.h; J.mid = add(P.h, P.t, F.tl); J.sho = add(J.mid, P.t2, F.tu); J.head = add(J.sho, P.n, F.nk + F.hr);
    J.ar = add(J.mid, P.t2, F.tu - 5);
    const fr = P.t2 - 90, bk = P.t2 + 90;
    J.bk = add(add(J.sho, bk, 10), P.t2, -4); J.rk = add(add(J.sho, fr, 11), P.t2, -5);
    J.ch = add(add(J.mid, P.t2, F.tu * .5), fr, 13); J.bl = add(add(J.hip, P.t, F.tl * .6), P.t - 90, 12);
    J.hp = add(J.hip, P.t - 90, 12); J.fc = add(J.head, P.n - 90, 8); J.nape = add(J.head, P.n + 90, 9);
    J.ear = J.head;
    const fd = s => s + 90;
    leg(J, "R", P.h, P.l, "x+", fd); leg(J, "L", P.h, P.l2, "x+", fd);
    arm(J, "R", J.ar, P.a, "x-"); arm(J, "L", J.ar, P.a2, "x-");
  } else if (v === "front") {
    const tl = P.tl;
    J.hip = P.h; J.sho = add(P.h, P.t, TOR * tl); J.mid = add(P.h, P.t, F.tl * tl);
    J.sR = add(add(J.sho, P.t - 90, F.sw), P.t, P.sh - 3); J.sL = add(add(J.sho, P.t + 90, F.sw), P.t, P.sh - 3);
    J.pR = add(P.h, P.t - 90, F.hw); J.pL = add(P.h, P.t + 90, F.hw);
    J.head = add(J.sho, P.n, F.nk + F.hr + 1); J.ch = add(J.sho, P.t, -13); J.bl = add(J.hip, P.t, 13);
    J.ear = J.head; J.fc = J.head;
    if (!P.nl) { leg(J, "R", J.pR, P.l, "x+", s => s + 55, 10); leg(J, "L", J.pL, P.lL, "x-", s => s - 55, 10); }
    arm(J, "R", J.sR, P.a, "x+"); arm(J, "L", J.sL, P.aL, "x-");
  } else {
    J.c = P.c; const fr = P.fr;
    J.sR = add(J.c, fr - 90, F.sw + 3); J.sL = add(J.c, fr + 90, F.sw + 3);
    J.head = add(J.c, fr, P.hb ? 5 : 2); J.ch = add(J.c, fr, 12); J.fc = add(J.head, fr, 9);
    arm(J, "R", J.sR, P.a, "x+"); arm(J, "L", J.sL, P.aL, "x-");
  }
  return J;
}

/* ---------- Dessin ---------- */
const r1 = n => Math.round(n * 10) / 10;
const COL = { b: "var(--an-b)", f: "var(--an-f)", eq: "var(--an-eq)", fr: "var(--an-fr)", pad: "var(--an-pad)", cab: "var(--an-cab)", band: "var(--green)", wall: "var(--an-fr)", hl: "var(--hl)", hl2: "var(--hl2)", bg: "var(--surface)", acc: "var(--accent)" };
const col = c => COL[c] || c || COL.eq;
const ln = (p, q, w, c, x) => `<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${col(c)}" stroke-width="${w}" stroke-linecap="round"${x || ""}/>`;
const ci = (p, r, c, x) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(r)}" fill="${col(c)}"${x || ""}/>`;
const elp = (p, rx, ry, a, c) => `<ellipse cx="${r1(p[0])}" cy="${r1(p[1])}" rx="${r1(rx)}" ry="${r1(ry)}" transform="rotate(${r1(90 - a)} ${r1(p[0])} ${r1(p[1])})" fill="${col(c)}"/>`;
const segPt = (p, q, u, na, off) => add(mixP(p, q, u), na, off);

function limbSVG(J, sd, c, side, legs, arms) {
  let s = "";
  if (legs && J["k" + sd]) s += ln(J["q" + sd], J["t" + sd], side ? 6 : 5, c) + ln(J["p" + sd], J["k" + sd], side ? 15 : 13, c) + ln(J["k" + sd], J["a" + sd], side ? 11 : 10, c);
  if (arms && J["e" + sd]) s += ln(J["r" + sd], J["e" + sd], side ? 10 : 9, c) + ln(J["e" + sd], J["w" + sd], 8.5, c) + ln(J["w" + sd], J["h" + sd], 7, c);
  return s;
}
/* Muscles : [muscle, couleur] dessinés sur la figure */
function musSide(J, P, M) {
  const t = P.t, t2 = P.t2, out = { torso: "", leg: "", arm: "" };
  const thA = angOf(J.hip, J.kR || J.hip), shA = J.kR ? angOf(J.kR, J.aR) : 0, uaA = J.eR ? angOf(J.ar, J.eR) : 0, faA = J.eR ? angOf(J.eR, J.wR) : 0;
  M.forEach(([m, c]) => {
    switch (m) {
      case "pecs": out.torso += elp(segPt(J.mid, J.sho, .6, t2 - 90, 7.5), 8, 4.8, t2, c); break;
      case "abdos": out.torso += elp(segPt(J.hip, J.mid, .75, t - 90, 6.5), 12, 3.6, t, c); break;
      case "obliques": out.torso += elp(segPt(J.hip, J.mid, .65, 0, 0), 10, 5.5, t, c); break;
      case "dorsaux": out.torso += elp(segPt(J.mid, J.sho, .35, t2 + 90, 7.5), 11, 4.5, t2, c); break;
      case "rhomboides": out.torso += elp(segPt(J.mid, J.sho, .78, t2 + 90, 8.5), 6, 3.6, t2, c); break;
      case "trapezes": out.torso += elp(segPt(J.mid, J.sho, 1.02, t2 + 90, 5), 7, 4, t2, c); break;
      case "lombaires": out.torso += elp(segPt(J.hip, J.mid, .5, t + 90, 6.5), 10, 3.6, t, c); break;
      case "fessiers": if (J.kR) out.torso += elp(add(add(J.hip, t + 90, 6), thA, 3), 8, 7, thA, c); break;
      case "abducteurs": out.torso += elp(add(J.hip, t, 4), 6, 5, t, c); break;
      case "quadriceps": if (J.kR) out.leg += elp(segPt(J.hip, J.kR, .52, thA + 90, 4.5), 15, 5.2, thA, c); break;
      case "ischios": if (J.kR) out.leg += elp(segPt(J.hip, J.kR, .58, thA - 90, 4.5), 14, 4.6, thA, c); break;
      case "adducteurs": if (J.kR) out.leg += elp(segPt(J.hip, J.kR, .32, 0, 0), 9, 3.6, thA, c); break;
      case "mollets": if (J.kR) out.leg += elp(segPt(J.kR, J.aR, .32, shA - 90, 3.4), 10, 4.2, shA, c); break;
      case "biceps": if (J.eR) out.arm += elp(segPt(J.ar, J.eR, .58, uaA + 90, 2.8), 9, 3.6, uaA, c); break;
      case "triceps": if (J.eR) out.arm += elp(segPt(J.ar, J.eR, .52, uaA - 90, 2.8), 10, 3.6, uaA, c); break;
      case "avantbras": if (J.eR) out.arm += elp(segPt(J.eR, J.wR, .35, 0, 0), 8, 3.5, faA, c); break;
      case "epaules_ant": if (J.eR) out.arm += elp(add(add(J.ar, t2 - 90, 3.5), uaA, 3), 6.5, 5.5, uaA, c); break;
      case "epaules_lat": if (J.eR) out.arm += elp(add(J.ar, uaA, 3.5), 6.5, 5.8, uaA, c); break;
      case "epaules_post": if (J.eR) out.arm += elp(add(add(J.ar, t2 + 90, 3.5), uaA, 3), 6.5, 5.5, uaA, c); break;
    }
  });
  return out;
}
function musFront(J, P, M, bk) {
  const t = P.t, out = { torso: "", leg: "", arm: "" };
  const up = J.sho, md = mixP(J.hip, J.sho, .5);
  const seg = (sd, a, b, u, rx, ry, c, off) => { if (!J[a + sd] && a !== "s" && a !== "p") return ""; const p = J[a + sd], q = J[b + sd]; if (!p || !q) return ""; const an = angOf(p, q); return elp(segPt(p, q, u, an + 90, off || 0), rx, ry, an, c); };
  M.forEach(([m, c]) => {
    const both = f => f("R") + f("L");
    switch (m) {
      case "pecs": if (!bk) out.torso += [-1, 1].map(s => elp(add(add(up, t, -9 * P.tl), t - 90, 7 * s), 7, 5 * Math.max(.45, P.tl), t + 90, c)).join(""); break;
      case "abdos": if (!bk) out.torso += elp(mixP(J.hip, J.sho, .38), 12 * P.tl, 5.5, t, c); break;
      case "obliques": if (!bk) out.torso += [-1, 1].map(s => elp(add(mixP(J.hip, J.sho, .38), t - 90, 10 * s), 9 * P.tl, 3.5, t, c)).join(""); break;
      case "dorsaux": out.torso += [-1, 1].map(s => elp(add(mixP(J.hip, J.sho, .6), t - 90, (bk ? 9 : 12.5) * s), 12 * P.tl, bk ? 5 : 3, t, c)).join(""); break;
      case "rhomboides": if (bk) out.torso += elp(add(up, t, -12 * P.tl), 9 * P.tl, 6, t, c); break;
      case "lombaires": if (bk) out.torso += elp(mixP(J.hip, J.sho, .22), 8 * P.tl, 7, t, c); break;
      case "trapezes": out.torso += bk ? elp(add(up, t, -3), 7, 11, t, c) : [-1, 1].map(s => elp(add(add(up, t, 1), t - 90, 7 * s), 3.5, 6, t + 90 - 25 * s, c)).join(""); break;
      case "fessiers": if (bk) out.torso += both(sd => J["p" + sd] && J["k" + sd] ? elp(add(J["p" + sd], angOf(J["p" + sd], J["k" + sd]), 4), 8, 7, angOf(J["p" + sd], J["k" + sd]), c) : ""); break;
      case "abducteurs": out.torso += both(sd => J["p" + sd] ? ci(add(J["p" + sd], sd === "R" ? t - 90 : t + 90, 5), 5, c) : ""); break;
      case "epaules_ant": case "epaules_lat": case "epaules_post": out.arm += both(sd => J["s" + sd] && J["e" + sd] ? elp(add(J["s" + sd], angOf(J["s" + sd], J["e" + sd]), 3), 6.5, 6, angOf(J["s" + sd], J["e" + sd]), c) : ""); break;
      case "biceps": if (!bk) out.arm += both(sd => seg(sd, "s", "e", .55, 9, 3.6, c)); break;
      case "triceps": if (bk) out.arm += both(sd => seg(sd, "s", "e", .55, 9, 3.6, c)); break;
      case "avantbras": out.arm += both(sd => seg(sd, "e", "w", .35, 8, 3.4, c)); break;
      case "quadriceps": if (!bk) out.leg += both(sd => seg(sd, "p", "k", .5, 14, 5.5, c)); break;
      case "ischios": if (bk) out.leg += both(sd => seg(sd, "p", "k", .55, 13, 5.5, c)); break;
      case "adducteurs": out.leg += both(sd => seg(sd, "p", "k", .3, 9, 3, c, sd === "R" ? -4 : 4)); break;
      case "mollets": out.leg += both(sd => seg(sd, "k", "a", .3, 9, 3.6, c)); break;
    }
  });
  return out;
}
function musTop(J, P, M) {
  let s = "";
  const fr = P.fr;
  M.forEach(([m, c]) => {
    switch (m) {
      case "pecs": s += [-1, 1].map(k => elp(add(add(J.c, fr, 5), fr - 90, 7 * k), 7, 4, fr - 90, c)).join(""); break;
      case "dorsaux": case "rhomboides": case "trapezes": s += [-1, 1].map(k => elp(add(add(J.c, fr, -5), fr - 90, 8 * k), 7, 4, fr - 90, c)).join(""); break;
      case "epaules_ant": case "epaules_lat": case "epaules_post": s += ci(J.sR, 6, c) + ci(J.sL, 6, c); break;
      case "biceps": case "triceps": ["R", "L"].forEach(sd => { if (J["e" + sd] && dist(J["s" + sd], J["e" + sd]) > 8) s += elp(mixP(J["s" + sd], J["e" + sd], .55), Math.min(9, dist(J["s" + sd], J["e" + sd]) * .32), 3.4, angOf(J["s" + sd], J["e" + sd]), c); }); break;
      case "avantbras": ["R", "L"].forEach(sd => { if (J["e" + sd]) s += elp(mixP(J["e" + sd], J["w" + sd], .4), 7, 3.2, angOf(J["e" + sd], J["w" + sd]), c); }); break;
      case "obliques": case "abdos": s += elp(add(J.c, fr, 4), 8, 4, fr - 90, c); break;
    }
  });
  return s;
}

/* Accessoires : primitives { k:"l"|"c"|"plate"|"db"|"kb"|"path"|"rect", ... } ; p et q = points ou noms de repères */
function pt(J, p) { if (typeof p === "string") return J[p] || [0, 0]; if (p && p.j) return plus(J[p.j] || [0, 0], p.o || [0, 0]); return p; }
function propSVG(J, P, pr, v) {
  const p = pt(J, pr.p);
  switch (pr.k) {
    case "l": return ln(p, pt(J, pr.q), pr.w || 3, pr.c || "fr", pr.d ? ` stroke-dasharray="${pr.d}"` : "");
    case "c": return pr.s ? `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${pr.r}" fill="none" stroke="${col(pr.c || "fr")}" stroke-width="${pr.s}"/>` : ci(p, pr.r, pr.c || "eq");
    case "plate": return ci(p, pr.r || 16, pr.c || "eq", ' opacity=".9"') + ci(p, (pr.r || 16) * .5, "var(--an-pl)", ' opacity=".55"') + ci(p, 2.6, "bg");
    case "db": { const a = pr.a == null ? 90 : pr.a, c = pr.c || "eq", e1 = add(p, a, 7), e2 = add(p, a, -7); return ln(e1, e2, 3, c) + ln(add(e1, a + 90, 5.5), add(e1, a - 90, 5.5), 5, c) + ln(add(e2, a + 90, 5.5), add(e2, a - 90, 5.5), 5, c); }
    case "dbs": return ci(p, pr.r || 7, pr.c || "eq") + ci(p, 2.2, "bg");
    case "kb": { const b = plus(p, [0, 9]); return `<path d="M${r1(p[0] - 5)} ${r1(p[1] + 4)} Q${r1(p[0])} ${r1(p[1] - 6)} ${r1(p[0] + 5)} ${r1(p[1] + 4)}" fill="none" stroke="${col(pr.c || "eq")}" stroke-width="3"/>` + ci(b, 8, pr.c || "eq"); }
    case "rect": { const w = pr.w, h = pr.h, a = pr.a || 0; return `<rect x="${r1(p[0] - w / 2)}" y="${r1(p[1] - h / 2)}" width="${w}" height="${h}" rx="${pr.rx == null ? 3 : pr.rx}" fill="${col(pr.c || "fr")}" transform="rotate(${a} ${r1(p[0])} ${r1(p[1])})"${pr.op ? ` opacity="${pr.op}"` : ""}/>`; }
    case "path": { const pts = pr.pts.map(x => pt(J, x)); let d = "M" + pts.map(x => r1(x[0]) + " " + r1(x[1])).join(pr.q ? " " : " L"); if (pr.q) d = "M" + r1(pts[0][0]) + " " + r1(pts[0][1]) + " Q" + pts.slice(1).map(x => r1(x[0]) + " " + r1(x[1])).join(" "); return `<path d="${d}" fill="none" stroke="${col(pr.c || "eq")}" stroke-width="${pr.w || 2}" stroke-linecap="round" stroke-linejoin="round"${pr.d ? ` stroke-dasharray="${pr.d}"` : ""}/>`; }
    case "cab": { const q = pt(J, pr.q); return ln(p, q, 2.4, "cab") + ci(p, 5, "cab") + ci(p, 2, "bg"); }
    case "band": { const q = pt(J, pr.q); return ln(p, q, 2.6, "band") + ci(p, 3, "fr"); }
  }
  return "";
}
function propPts(J, pr) {
  const p = pt(J, pr.p), r = pr.r || (pr.k === "plate" ? 16 : pr.k === "kb" ? 10 : pr.k === "rect" ? Math.max(pr.w, pr.h) / 2 : pr.k === "db" ? 8 : 3);
  const out = p ? [[p[0] - r, p[1] - r], [p[0] + r, p[1] + r]] : [];
  if (pr.q) out.push(pt(J, pr.q));
  if (pr.pts) pr.pts.forEach(x => out.push(pt(J, x)));
  return out;
}

function drawFrame(A, P) {
  const v = A.v, J = solve(P, v), M = A.mus, props = A.props(J, P);
  const back = props.filter(p => !p.z).map(p => propSVG(J, P, p, v)).join("");
  const mid = props.filter(p => p.z === 1).map(p => propSVG(J, P, p, v)).join("");
  const front = props.filter(p => p.z === 2).map(p => propSVG(J, P, p, v)).join("");
  let s = back, B = COL.b;
  if (v === "side") {
    const ms = musSide(J, P, M);
    s += limbSVG(J, "L", COL.f, 1, 1, 1) + mid;
    s += ln(J.hip, J.mid, 19, B) + ln(J.mid, J.sho, 22, B) + ci(J.hip, 10.5, B) + ln(J.sho, J.head, 8, B) + ci(J.head, F.hr, B) + ci(add(add(J.head, P.n - 90, 9.3), P.n, -1.5), 2.6, B);
    s += ms.torso + limbSVG(J, "R", B, 1, 1, 0) + ms.leg + (J.eR ? ci(J.ar, 6, B) : "") + limbSVG(J, "R", B, 1, 0, 1) + ms.arm;
  } else if (v === "front") {
    const t = P.t, ms = musFront(J, P, M, A.bk);
    const sR = add(J.sR, t - 90, 3), sL = add(J.sL, t + 90, 3), wR = add(mixP(J.hip, J.sho, .45), t - 90, 11), wL = add(mixP(J.hip, J.sho, .45), t + 90, 11);
    const hR = add(J.hip, t - 90, 13), hL = add(J.hip, t + 90, 13), b2 = add(J.hip, t, -6);
    s += mid + (A.legsBack ? limbSVG(J, "R", B, 0, 1, 0) + limbSVG(J, "L", B, 0, 1, 0) + ms.leg : "");
    if (A.headBack) s += ln(J.sho, J.head, 9, B) + ci(J.head, F.hr + .5, B);
    s += `<path d="M${r1(sR[0])} ${r1(sR[1])} L${r1(wR[0])} ${r1(wR[1])} L${r1(hR[0])} ${r1(hR[1])} Q${r1(b2[0])} ${r1(b2[1] + (P.tl < .6 ? 0 : 4))} ${r1(hL[0])} ${r1(hL[1])} L${r1(wL[0])} ${r1(wL[1])} L${r1(sL[0])} ${r1(sL[1])} Z" fill="${B}" stroke="${B}" stroke-width="6" stroke-linejoin="round"/>`;
    if (!A.headBack) s += ln(J.sho, J.head, 9, B) + ci(J.head, F.hr + .5, B, ` stroke="var(--surface)" stroke-width="1.4"`);
    s += ms.torso + (A.legsBack ? "" : limbSVG(J, "R", B, 0, 1, 0) + limbSVG(J, "L", B, 0, 1, 0) + ms.leg) + ci(J.sR, 6, B) + ci(J.sL, 6, B) + limbSVG(J, "R", B, 0, 0, 1) + limbSVG(J, "L", B, 0, 0, 1) + ms.arm;
  } else {
    const fr = P.fr;
    const head = ci(J.head, F.hr + 1, B, ` stroke="var(--surface)" stroke-width="1.6"`) + ci(J.fc, 2.6, B);
    if (P.hb) s += head;
    s += mid + `<ellipse cx="${r1(J.c[0])}" cy="${r1(J.c[1])}" rx="${F.sw + 8}" ry="11" transform="rotate(${r1(-fr + 180)} ${r1(J.c[0])} ${r1(J.c[1])})" fill="${B}"/>`;
    if (!P.hb) s += head;
    s += musTop(J, P, M) + ci(J.sR, 6, B) + ci(J.sL, 6, B) + limbSVG(J, "R", B, 0, 0, 1) + limbSVG(J, "L", B, 0, 0, 1);
    s += musTop(J, P, M.filter(x => ["biceps", "triceps", "avantbras"].indexOf(x[0]) >= 0));
  }
  return s + front;
}

/* ---------- Animation ---------- */
/* Transitions entre deux poses : départ et arrivée en douceur (sinus) ; quand un mouvement s'enchaîne sans pause
   vers une autre pose, il garde son élan au lieu de s'arrêter à chaque étape. */
const easeIO = u => .5 - .5 * Math.cos(Math.PI * u), easeI = u => 1 - Math.cos(Math.PI * u / 2), easeO = u => Math.sin(Math.PI * u / 2);
/* Interpolation d'une pose à l'autre sans membres qui sautent ni qui tournent dans le mauvais sens :
   - les angles prennent toujours le chemin le plus court (10° → 340° = 30° de rotation, pas 330°) ;
   - un membre guidé vers une cible (main sur la barre, pied au sol) garde sa cible et le même sens de pliure du coude
     ou du genou tout au long du geste ;
   - sinon (cibles de nature différente, pliure qui changerait de côté), le membre passe d'une pose à l'autre
     articulation par articulation. */
const lerpA = (a, b, u) => a + na(b - a) * u;
const ANGF = ["t", "t2", "n", "fr", "rot"];
const LIMBS = { side: [["a", "aR", 0], ["a2", "aL", 0], ["l", "lR", 1], ["l2", "lL", 1]], front: [["a", "aR", 0], ["aL", "aL", 0], ["l", "lR", 1], ["lL", "lL", 1]], top: [["a", "aR", 0], ["aL", "aL", 0]] };
function limbAng(J, key, isLeg) {
  const sd = key[1], n = isLeg ? ["p", "k", "a", "t"] : ["r", "e", "w", "h"], R = J[n[0] + sd], M = J[n[1] + sd], E = J[n[2] + sd], X = J[n[3] + sd];
  if (!R || !M || !E || !X) return null;
  return [angOf(R, M), angOf(M, E), angOf(E, X), dist(R, M) / (isLeg ? F.th : F.ua), dist(M, E) / (isLeg ? F.sh : F.fa)];
}
const sameTarget = (a, b) => a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)
  && !a.k === !b.k && a.j === b.j && (a.w == null) === (b.w == null) && (a.f == null) === (b.f == null);
function mixIK(Pa, Pb, k, sg, u) { const a = Pa[k], b = Pb[k], o = lerp(a, b, u); o.b = sg; if (a.w != null) o.w = lerpA(a.w, b.w, u); if (a.f != null) o.f = lerpA(a.f, b.f, u); return o; }
/* une cible qui passe tout près de l'épaule ou de la hanche ferait tourner le membre d'un coup : on le vérifie sur le trajet */
function smoothIK(Pa, Pb, k, key, isLeg, sg, v) {
  let prev = null;
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, P = lerp(Pa, Pb, u); P[k] = mixIK(Pa, Pb, k, sg, u);
    const q = limbAng(solve(P, v), key, isLeg);
    if (!q) return false;
    if (prev && (Math.abs(na(q[0] - prev[0])) > 30 || Math.abs(na(q[1] - prev[1])) > 30)) return false;
    prev = q;
  }
  return true;
}
function prepMix(Pa, Pb, v) {
  const Ja = solve(Pa, v), Jb = solve(Pb, v), plan = [];
  (LIMBS[v] || []).forEach(([k, key, isLeg]) => {
    const a = Pa[k], b = Pb[k];
    if (a == null || b == null) return;
    if (v === "front" && isLeg && (Pa.nl || Pb.nl)) return;
    if (sameTarget(a, b)) {
      const sa = Ja.sg && Ja.sg[key], sb = Jb.sg && Jb.sg[key];
      if (sa && sb) {
        // membre presque tendu à une extrémité : son sens de pliure ne compte pas
        const sg = sa[0] === sb[0] || sb[1] < 8 ? sa[0] : sa[1] < 8 ? sb[0] : 0;
        if (sg && smoothIK(Pa, Pb, k, key, isLeg, sg, v)) { plan.push([k, "ik", sg]); return; }
      }
    }
    const qa = limbAng(Ja, key, isLeg), qb = limbAng(Jb, key, isLeg);
    if (!qa || !qb) return;
    // main ou pied qui reste en place (posé au sol, sur la barre) : on le garde au même endroit
    const n = isLeg ? ["k", "a"] : ["e", "w"], sd = key[1], Ea = Ja[n[1] + sd], Eb = Jb[n[1] + sd];
    if (dist(Ea, Eb) < 1) {
      const at = (sg, J0, u) => { const P = lerp(Pa, Pb, u); P[k] = { k: mixP(Ea, Eb, u), b: sg, s1: qa[3] + (qb[3] - qa[3]) * u, s2: qa[4] + (qb[4] - qa[4]) * u }; P[k][isLeg ? "f" : "w"] = lerpA(qa[2], qb[2], u); return P; };
      const fits = sg => [[Ja, 0], [Jb, 1]].every(([J0, u]) => dist(solve(at(sg, J0, u), v)[n[0] + sd], J0[n[0] + sd]) < 1.5);
      const sg = fits(1) ? 1 : fits(-1) ? -1 : 0;
      if (sg) { plan.push([k, "fix", sg, at]); return; }
    }
    plan.push([k, "ang", qa, qb]);
  });
  return u => {
    const P = lerp(Pa, Pb, u);
    ANGF.forEach(f => { if (typeof Pa[f] === "number" && typeof Pb[f] === "number") P[f] = lerpA(Pa[f], Pb[f], u); });
    plan.forEach(([k, m, x, y]) => {
      if (m === "ik") P[k] = mixIK(Pa, Pb, k, x, u);
      else if (m === "fix") P[k] = y(x, null, u)[k];
      else P[k] = [lerpA(x[0], y[0], u), lerpA(x[1], y[1], u), lerpA(x[2], y[2], u), x[3] + (y[3] - x[3]) * u, x[4] + (y[4] - x[4]) * u];
    });
    return P;
  };
}
const DEFS = {};
const CAP = { side: "Vue de profil", front: "Vue de face", top: "Vue de dessus", end: "Vue depuis les pieds" };
function build(id, ex) {
  const d = DEFS[id]; if (!d) return null;
  const spec = typeof d === "function" ? d() : d;
  const v = spec.v || "side";
  const K = spec.k.map(p => normPose(p, v === "end" ? "top" : v));
  const vv = v === "end" ? "top" : v;
  const steps = []; let t = 0;
  (spec.s || [[0, 0, 600], [1, 1500, 300], [0, 1200, 500]]).forEach(([p, d, w, lab, lin], i) => { steps.push({ p, from: i ? steps[i - 1].p : p, t0: t, d: d || 0, w: w || 0, lab: lab || "", lin: !!lin }); t += (d || 0) + (w || 0); });
  // élan : une étape enchaînée sans pause vers une pose différente de celle d'où l'on vient ne s'arrête pas entre les deux
  const flows = (s, n) => s && n && s.d > 0 && n.d > 0 && !s.w && n.p !== s.from;
  steps.forEach((s, i) => {
    if (s.d > 0 && s.from !== s.p) s.mix = prepMix(K[s.from], K[s.p], vv);
    const a = flows(steps[i - 1], s), b = flows(s, steps[i + 1]);
    s.ease = s.lin || (a && b) ? (u => u) : a ? easeO : b ? easeI : easeIO;
  });
  const mus = []; (ex ? ex.s : []).forEach(m => mus.push([m, "hl2"])); (ex ? ex.p : []).forEach(m => mus.push([m, "hl"]));
  const A = { v: vv, K, steps, total: t, mus, bk: !!spec.bk, legsBack: !!spec.lb, headBack: !!spec.hbk, props: (J, P) => { const out = []; (spec.p || []).forEach(x => { const r = typeof x === "function" ? x(J, P) : x; if (Array.isArray(r)) r.forEach(y => y && out.push(y)); else if (r) out.push(r); }); return out; }, floor: spec.floor !== false && v !== "top", cap: spec.cap || CAP[v] || "" };
  // cadrage : boîte englobante de toutes les poses ; le matériel (montants, poulies, bancs) peut déborder du cadre
  // au-delà d’une marge, pour que le personnage reste grand
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, q0 = 1e9, q1 = -1e9, r0 = 1e9, r1_ = -1e9;
  const eat = p => { if (!p || !isFinite(p[0])) return; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
  const eatP = p => { if (!p || !isFinite(p[0])) return; q0 = Math.min(q0, p[0]); q1 = Math.max(q1, p[0]); r0 = Math.min(r0, p[1]); r1_ = Math.max(r1_, p[1]); };
  const samples = K.slice(); steps.forEach(s => { if (s.mix) [.25, .5, .75].forEach(u => samples.push(s.mix(u))); });
  samples.forEach(P => {
    const J = solve(P, vv);
    if (spec.focus) { spec.focus.forEach(k => eat(J[k])); return; }
    Object.keys(J).forEach(k => { if (Array.isArray(J[k]) && k !== "ear") eat(J[k]); });
    eat(plus(J.head, [-F.hr, -F.hr])); eat(plus(J.head, [F.hr, F.hr]));
    A.props(J, P).forEach(pr => propPts(J, pr).forEach(eatP));
  });
  if (q0 < 1e9) {
    const lim = .2 * Math.max(x1 - x0, y1 - y0);
    x0 = Math.min(x0, Math.max(q0, x0 - lim)); x1 = Math.max(x1, Math.min(q1, x1 + lim));
    y0 = Math.min(y0, Math.max(r0, y0 - lim)); y1 = Math.max(y1, Math.min(r1_, y1 + lim));
  }
  if (A.floor && !spec.focus) y1 = Math.max(y1, 4);
  const pad = spec.focus ? 22 : 12; x0 -= pad; x1 += pad; y0 -= pad; y1 += A.floor ? 6 : pad;
  let w = x1 - x0, h = y1 - y0; const ar = spec.ar || Math.max(1.3, Math.min(2, w / h));
  A.ar = ar;
  if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) * (A.floor && !spec.focus ? 1 : .5); h = nh; }
  A.vb = [x0, y0, w, h];
  return A;
}
function poseAt(A, t) {
  const st = A.steps;
  t = Math.max(0, t || 0);
  for (let i = 0; i < st.length; i++) {
    const s = st[i];
    if (s.d > 0 && t < s.t0 + s.d) { const u = s.ease((t - s.t0) / s.d); return { P: s.mix ? s.mix(u) : A.K[s.p], i }; }
    if (t < s.t0 + s.d + s.w) return { P: A.K[s.p], i };
  }
  return { P: A.K[st[st.length - 1].p], i: st.length - 1 };
}
function frameSVG(A, P) {
  const [x, y, w, h] = A.vb;
  const fl = A.floor && y + h > 0 ? `<rect x="${r1(x)}" y="0" width="${r1(w)}" height="${r1(y + h)}" fill="var(--an-gr)"/><line x1="${r1(x)}" y1="0" x2="${r1(x + w)}" y2="0" stroke="var(--line)" stroke-width="2"/>` : "";
  return fl + drawFrame(A, P);
}

const players = new WeakMap();
const reduced = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
function mount(root, auto) {
  (root || document).querySelectorAll(".anim[data-ex]").forEach(el => {
    if (players.get(el)) return;
    const id = el.dataset.ex, ex = typeof EX_BY_ID !== "undefined" ? EX_BY_ID[id] : null;
    const A = build(id, ex); if (!A) { el.hidden = true; return; }
    const svg = el.querySelector("svg");
    svg.setAttribute("viewBox", A.vb.map(r1).join(" "));
    el.style.aspectRatio = String(Math.round(A.ar * 100) / 100);
    const g = svg.querySelector("g"), card = el.closest(".anim-card"), lab = card && card.querySelector(".anim-lab"), bar = card && card.querySelector(".anim-prog b"), cap = card && card.querySelector(".anim-cap");
    if (cap) cap.textContent = A.cap;
    const pl = { A, raf: 0, playing: false };
    const draw = t => { const r = poseAt(A, t); g.innerHTML = frameSVG(A, r.P); if (lab) lab.textContent = A.steps[r.i].lab || (t <= 0 ? "" : lab.textContent); if (bar) bar.style.width = Math.min(100, t / A.total * 100) + "%"; };
    pl.play = () => {
      cancelAnimationFrame(pl.raf); pl.playing = true; el.classList.add("playing"); if (card) card.classList.add("playing");
      if (lab) lab.textContent = "";
      const t0 = performance.now();
      const step = now => {
        if (!el.isConnected) { pl.playing = false; return; }
        const t = now - t0;
        if (t >= A.total) { draw(A.total); pl.playing = false; el.classList.remove("playing"); if (card) { card.classList.remove("playing"); card.classList.add("played"); } if (lab) lab.textContent = ""; return; }
        draw(t); pl.raf = requestAnimationFrame(step);
      };
      pl.raf = requestAnimationFrame(step);
    };
    pl.stop = () => { cancelAnimationFrame(pl.raf); pl.playing = false; };
    players.set(el, pl);
    draw(0);
    if (auto && !reduced()) setTimeout(() => { if (el.isConnected) pl.play(); }, 250);
    else if (card) card.classList.add("played");
  });
}
function replay(el) { const a = el.closest(".anim-card"); const t = a ? a.querySelector(".anim[data-ex]") : el; const p = t && players.get(t); if (p) p.play(); }
function has(id) { return !!DEFS[id]; }
return { DEFS, F, TOR, LEG, ARM, AR, dir, add, plus, angOf, mixP, build, poseAt, frameSVG, mount, replay, has, solve, normPose };
})();

/* ===== Mouvements de chaque exercice ===== */
(function () {
"use strict";
const { DEFS: Z, F, LEG, AR, add, plus, angOf, mixP } = ANIM;
const D = 180 / Math.PI;
/* raccourcis */
const IK = (k, b, x) => Object.assign({ k, b }, x || {});
const IJ = (j, o, b, x) => Object.assign({ j, o, b }, x || {});
const IR = (r, b, x) => Object.assign({ r, b }, x || {});
const O = (...a) => Object.assign({}, ...a);
const rep = (d1, d2, l1, l2, w) => [[0, 0, (w && w[0]) || 500], [1, d1, (w && w[1]) || 300, l1], [0, d2, (w && w[2]) || 500, l2]];
const rep3 = (d, l, w) => [[0, 0, 450]].concat(d.map((x, i) => [i + 1 < d.length ? i + 1 : 0, x, (w && w[i]) || 250, l[i] || ""])).concat();
const seq = (list) => [[list[0][0], 0, list[0][1] || 450]].concat(list.slice(1).map(x => [x[0], x[1], x[2] || 0, x[3] || "", x[4]]));
const hold = (d1, hd, l1, l2) => [[0, 0, 400], [1, d1, hd || 2800, l1], [0, 1100, 400, l2 || ""]];
const cyc = (ps, n, d, lab, lin) => { const s = [[ps[0], 0, 300]]; for (let k = 0; k < n; k++) ps.slice(1).concat([ps[0]]).forEach((p, i) => s.push([p, d, 0, k === 0 && i === 0 ? lab || "" : "", lin])); s[s.length - 1][2] = 450; return s; };
const L = (p, q, w, c, z) => ({ k: "l", p, q, w, c, z });
const C = (p, r, c, z) => ({ k: "c", p, r, c, z });
const RC = (p, w, h, a, c, z) => ({ k: "rect", p, w, h, a, c, z });
const plate = (at, r) => ({ k: "plate", p: at || "gR", r: r || 16, z: 2 });
const dbs = (r) => [{ k: "dbs", p: "gL", c: "var(--an-eqf)", r, z: 0 }, { k: "dbs", p: "gR", r, z: 2 }];
const db1 = (at, r) => ({ k: "dbs", p: at || "gR", r: r || 7, z: 2 });
const dbF = (a) => [{ k: "db", p: "gR", a: a == null ? 90 : a, z: 2 }, { k: "db", p: "gL", a: a == null ? 90 : a, z: 2 }];
const kb = (at) => ({ k: "kb", p: at || "gR", z: 2 });
const cab = (p, at) => ({ k: "cab", p, q: at || "gR", z: 0 });
const band = (p, at) => ({ k: "band", p, q: at || "gR", z: 0 });
const pad = (p, q, w) => L(p, q, w || 8, "pad");
const post = (p, q, w) => L(p, q, w || 4, "fr");
const hnd = (at) => C(at || "gR", 3.6, "eq", 2);
const def = (ids, spec) => [].concat(ids).forEach(id => { Z[id] = spec; });
/* barre vue de face, disques aux extrémités */
const barF = (ext, pr) => J => { const a = J.gL, b = J.gR, an = angOf(a, b), e1 = add(a, an, -(ext || 26)), e2 = add(b, an, ext || 26), r = pr == null ? 17 : pr; return [L(e1, e2, 3.2, "eq", 2)].concat(r ? [L(add(e1, an + 90, r), add(e1, an - 90, r), 7, "eq", 2), L(add(e2, an + 90, r), add(e2, an - 90, r), 7, "eq", 2)] : []); };
/* angle du corps gainé (chevilles A) pour placer l’épaule à la hauteur y */
const tFor = (A, y, left) => { const c = Math.max(-1, Math.min(1, (y - A[1]) / (LEG - .5 + AR))); const t = Math.acos(c) * D; return left ? 360 - t : t; };
const rootOf = (A, t) => add(A, t, LEG - .5 + AR);

/* ---------- poses de base ---------- */
const FT = IK([0, -4], "x+");
const ST = x => O({ h: [0, -88], t: 180, a: [3, 5], l: FT }, x);
const BENCH = [pad([-60, -40], [40, -40], 8), post([-48, -36], [-48, 0]), post([28, -36], [28, 0])];
const LIE = x => O({ h: [22, -55], t: -90, n: -92, l: IK([60, -4], "y-", { f: 90 }) }, x);
const FLOOR = x => O({ h: [0, -11], t: 270, n: 270 }, x);
const PL = (A, t, x) => O({ h: add(A, t, LEG - .5), t, l: IK(A, "y+", { f: -8 }) }, x);
const QUAD = x => O({ h: [-42, -50], t: 90, n: 100, a: IK([9, -4], "x-", { w: 90 }), l: [0, -90, -90] }, x);
const SEAT = (y, x) => O({ h: [0, y || -54], t: 180, l: IK([40, -4], "y-", { f: 90 }) }, x);
const FST = x => O({ h: [0, -88], a: [6, 10], l: IK([12, -4], "x+") }, x); // debout, vue de face
const FSEAT = (x) => O({ h: [0, -60], a: [6, 10], l: [14, 2, null, .38, 1] }, x);
const FSEATP = [RC([0, -50], 46, 8, 0, "pad"), post([0, -46], [0, 0])];
const ARMSD = [3, 5];

/* ================= PECTORAUX ================= */
const pressLie = (eq) => ({ k: [LIE({ a: IR([3, -53], "x+", { w: 180 }) }), LIE({ a: IJ("ch", [3, -5], "x+", { w: 180 }) })], s: rep(1500, 1000, "Descends lentement", "Pousse en expirant"), p: BENCH.concat(eq) });
def(["dc-barre", "dc-serre"], pressLie([plate()]));
def(["dc-halteres", "squeeze-press"], pressLie(dbs()));
const HI = [16, -54], TI = 235;
const INCL = [pad(add(add(HI, TI, -6), TI + 90, 13), add(add(HI, TI, 70), TI + 90, 13), 9), pad([0, -40], [34, -40], 8), post([16, -36], [16, 0]), post(add(add(HI, TI, 55), TI + 90, 16), [-30, 0])];
const pressIncl = (eq) => ({ k: [{ h: HI, t: TI, n: TI - 8, a: IR([2, -53], "x+", { w: 180 }), l: IK([56, -4], "y-", { f: 90 }) }, { h: HI, t: TI, n: TI - 8, a: IJ("ch", [2, -5], "x+", { w: 180 }), l: IK([56, -4], "y-", { f: 90 }) }], s: rep(1500, 1000, "Descends vers le haut des pecs", "Pousse"), p: INCL.concat(eq) });
def("di-barre", pressIncl([plate()]));
def("di-halteres", pressIncl(dbs()));
def("smith-incline", pressIncl([post([-24, -10], [-24, -190], 3), plate()]));
const HD = [22, -66], TD = 290;
def("dd-barre", { k: [{ h: HD, t: TD, n: TD + 4, a: IR([2, -53], "x+", { w: 180 }), l: [140, 30] }, { h: HD, t: TD, n: TD + 4, a: IJ("ch", [2, -5], "x+", { w: 180 }), l: [140, 30] }], s: rep(1500, 1000, "Descends vers le bas des pecs", "Pousse"),
  p: [pad(add(add(HD, TD, -12), TD + 90, 12), add(add(HD, TD, 72), TD + 90, 12), 9), post([10, -55], [10, 0]), post([-50, -38], [-50, 0]), C([72, -70], 6, "pad"), post([72, -66], [40, -40], 3), plate()] });
const FLY = (c) => ({ v: "end", k: [{ c, fr: 180, hb: 1, a: [176, 186] }, { c, fr: 180, hb: 1, a: [98, 116] }], s: rep(1600, 1100, "Ouvre les bras en arc", "Referme comme pour enlacer"),
  p: [RC([0, -38], 30, 8, 0, "pad"), post([0, -34], [0, 0], 5), L([-14, -46], [-22, -40], 11, "b", 2), L([14, -46], [22, -40], 11, "b", 2), L([-22, -40], [-25, -5], 10, "b", 2), L([22, -40], [25, -5], 10, "b", 2), { k: "dbs", p: "gR", z: 2 }, { k: "dbs", p: "gL", z: 2 }] });
def("ecarte-halteres", FLY([0, -54]));
def("ecarte-incline", FLY([0, -60]));
const TOPC = [0, -60];
def("pec-deck", { v: "top", k: [{ c: TOPC, a: [98, 125] }, { c: TOPC, a: IK([7, -110], "x+") }], s: rep(1100, 1500, "Rapproche les bras", "Reviens lentement"), p: [pad([-30, -45], [30, -45], 10), hnd("gR"), hnd("gL")] });
def("vis-a-vis", { v: "front", k: [FST({ a: IK([60, -152], "x+"), l: IK([16, -4], "x+") }), FST({ a: IK([7, -98], "x+"), l: IK([16, -4], "x+") })], s: rep(1300, 1500, "Ramène les mains devant toi", "Reviens en contrôlant"),
  p: [post([96, 0], [96, -215]), post([-96, 0], [-96, -215]), cab([92, -205], "gR"), cab([-92, -205], "gL"), hnd("gR"), hnd("gL")] });
def("presse-pecs", { k: [SEAT(-56, { t: 188, a: IJ("ch", [4, 2], "y+") }), SEAT(-56, { t: 188, a: IR([52, 4], "y+") })], s: rep(1100, 1500, "Pousse devant toi", "Reviens lentement"),
  p: [pad([-16, -66], [-24, -128], 9), pad([-12, -46], [30, -46], 8), post([6, -42], [6, 0]), post([84, 0], [84, -150]), J => L([84, -128], J.gR, 4, "fr"), hnd("gR")] });
/* pompes : chevilles A, mains H */
const pushup = (A, H, yTop, yBot, x) => { const t1 = tFor(A, yTop), t2 = tFor(A, yBot); const h = IK(H, "x-", { w: 90 }); return [PL(A, t1, O({ a: h }, x)), PL(A, t2, O({ a: h }, x))]; };
const PA = [-118, -12], PH = [rootOf(PA, tFor(PA, -57))[0], -4];
def(["pompes", "pompes-diamant"], { k: pushup(PA, PH, -57, -22), s: rep(1400, 900, "Descends, corps gainé", "Pousse fort") });
def("pompes-archer", () => { const t1 = tFor(PA, -57), t2 = tFor(PA, -26), h = IK(PH, "x-", { w: 90 }), str = [70, 70, 90];
  return { k: [PL(PA, t1, { a: h }), PL(PA, t2, { a: h, a2: str }), PL(PA, t2, { a: str, a2: h })], s: [[0, 0, 400], [1, 1300, 250, "Descends vers une main"], [0, 900, 200, "Remonte"], [2, 1300, 250, "Puis vers l’autre"], [0, 900, 400, "Remonte"]] }; });
const KN = [-62, -6];
const kneeP = (t, H) => O({ h: add(KN, t, F.th), t, a: IK(H, "x-", { w: 90 }), l: [t + 180, -128, -128] });
def("pompes-genoux", () => { const t1 = Math.acos((-57 - KN[1]) / (F.th + AR)) * D, t2 = Math.acos((-24 - KN[1]) / (F.th + AR)) * D; const H = [add(add(KN, t1, F.th), t1, AR)[0], -4]; return { k: [kneeP(t1, H), kneeP(t2, H)], s: rep(1300, 900, "Descends la poitrine", "Pousse") }; });
def("pompes-inclinees", () => { const A = [-112, -12], t1 = tFor(A, -101), t2 = tFor(A, -64), H = [rootOf(A, t1)[0], -48]; return { k: [PL(A, t1, { a: IK(H, "x-", { w: 90 }) }), PL(A, t2, { a: IK(H, "x-", { w: 90 }) })], s: rep(1300, 900, "Descends vers le banc", "Pousse"), p: [pad([H[0] - 30, -40], [H[0] + 22, -40], 8), post([H[0] - 22, -36], [H[0] - 22, 0]), post([H[0] + 14, -36], [H[0] + 14, 0])] }; });
def("pompes-declinees", () => { const A = [-112, -62], t1 = tFor(A, -57), t2 = tFor(A, -24), H = [rootOf(A, t1)[0], -4]; return { k: [PL(A, t1, { a: IK(H, "x-", { w: 90 }), l: IK(A, "y+", { f: 10 }) }), PL(A, t2, { a: IK(H, "x-", { w: 90 }), l: IK(A, "y+", { f: 10 }) })], s: rep(1300, 900, "Descends le visage vers le sol", "Pousse"), p: [RC([-118, -26], 40, 52, 0, "fr")] }; });
/* dips : barres à hauteur de main */
const DB = [0, -116];
const dip = (t1, t2, x1, legs, eq) => ({ k: [{ h: add(plus(DB, [x1, -55]), t1 + 180, AR), t: t1, a: IK(DB, "x-", { w: 90 }), l: legs }, { h: add(plus(DB, [x1 - 8, -27]), t2 + 180, AR), t: t2, a: IK(DB, "x-", { w: 90 }), l: legs }], s: rep(1400, 1000, "Descends en pliant les coudes", "Pousse pour remonter"), p: [L([-14, DB[1] + 4], [18, DB[1] + 4], 5, "eq", 2), post([-10, DB[1] + 6], [-10, DB[1] + 50])].concat(eq || []) });
def("dips-pecs", O(dip(160, 145, 6, [25, -55]), { floor: false }));
def("dips-triceps", O(dip(178, 172, 2, [20, -60]), { floor: false }));
def("dips-assiste", () => { const d = dip(178, 172, 2, [0, -90, -90]); d.p[1] = post([-10, DB[1] + 6], [-10, 0]); d.p.push(J => [RC(plus(J.kR, [-16, 6]), 44, 8, 0, "pad", 0), L([-50, -20], plus(J.kR, [-30, 8]), 4, "fr")]); return d; });
def("pull-over", { k: [LIE({ a: [182, 186, 186] }), LIE({ a: [254, 262, 262] })], s: rep(1700, 1300, "Descends derrière la tête", "Ramène au-dessus de la poitrine"), p: BENCH.concat([db1("gR", 9)]) });

/* ================= DOS ================= */
const BARY = -210;
const pullF = (bk) => ({ v: "front", bk, k: [{ h: [0, -99], a: IK([36, BARY + 5], "x+", { w: 180 }), l: [4, -12, null, 1, .8] }, { h: [0, -146], a: IK([36, BARY + 5], "x+", { w: 180 }), l: [10, -20, null, 1, .8] }], s: rep(1300, 1600, "Tire la poitrine vers la barre", "Redescends lentement"),
  p: [L([-62, BARY], [62, BARY], 4, "eq"), post([-62, BARY], [-62, BARY + 40]), post([62, BARY], [62, BARY + 40])], floor: false });
def("tractions", pullF(true));
const pullS = (legs, x) => ({ k: [O({ h: [0, -104], t: 182, a: IK([6, BARY + 5], "x+", { w: 180 }), l: legs }, x), O({ h: [-4, -151], t: 192, a: IK([6, BARY + 5], "x+", { w: 180 }), l: legs }, x)], s: rep(1300, 1600, "Tire, menton au-dessus de la barre", "Redescends lentement"), p: [C([6, BARY], 4, "eq", 2), post([6, BARY], [-40, BARY - 12], 3)] });
def("tractions-supination", O(pullS([15, -70]), { floor: false }));
def("tractions-assistees", () => { const d = pullS([0, -90, -90]); d.p.push(J => [RC(plus(J.kR, [-14, 6]), 40, 8, 0, "pad"), L([-60, -10], plus(J.kR, [-30, 8]), 4, "fr")]); return d; });
def("tirage-vertical", { v: "front", k: [FSEAT({ a: IK([42, -192], "x+", { w: 180 }) }), FSEAT({ a: IK([40, -128], "x+", { w: 180 }) })], s: rep(1200, 1500, "Tire la barre vers la poitrine", "Remonte lentement"),
  p: FSEATP.concat([RC([0, -84], 50, 7, 0, "pad"), J => cab([0, -232], mixP(J.gR, J.gL, .5)), barF(18, 0)]) });
def("tirage-serre", { k: [SEAT(-54, { t: 194, a: IR([10, -53], "x+"), l: IK([40, -4], "y-", { f: 90 }) }), SEAT(-54, { t: 196, a: IJ("ch", [4, -4], "y+") })], s: rep(1200, 1500, "Tire la poignée vers la poitrine", "Remonte jusqu’à l’étirement"),
  p: [pad([-12, -46], [30, -46], 8), post([8, -42], [8, 0]), J => RC(plus(J.kR, [-2, -8]), 22, 7, 0, "pad"), J => cab([14, -232], J.gR), hnd()] });
def("tirage-horizontal", { k: [{ h: [0, -30], t: 168, a: IR([52, 8], "y+"), l: IK([78, -16], "y-", { f: 170 }) }, { h: [0, -30], t: 184, a: IJ("bl", [6, -2], "y+"), l: IK([78, -16], "y-", { f: 170 }) }], s: rep(1100, 1500, "Tire vers le nombril, omoplates serrées", "Reviens sans arrondir le dos"),
  p: [pad([-50, -18], [50, -18], 8), post([-30, -14], [-30, 0]), post([30, -14], [30, 0]), RC([90, -22], 8, 30, -10, "fr"), J => cab([106, -24], J.gR), hnd()] });
const rowBar = (eq, x) => ({ k: [O({ h: [-22, -82], t: 125, n: 132, a: [0, 0, 0], l: FT }, x), O({ h: [-22, -82], t: 125, n: 132, a: IJ("bl", [2, 8], "y-"), l: FT }, x)], s: rep(900, 1300, "Tire vers le nombril", "Redescends sous contrôle"), p: eq });
def("rowing-barre", rowBar([plate("gR", 18)]));
def("rowing-t", rowBar([J => L([-110, -4], J.gR, 4, "eq", 2), J => plate(plus(J.gR, [8, 3]), 15)]));
const ROWB = [pad([-72, -40], [40, -40], 8), post([-60, -36], [-60, 0]), post([28, -36], [28, 0])];
const benchRow = (a1, a2) => [{ h: [-20, -88], t: 100, n: 108, a: a1, a2: IK([30, -46], "x-", { w: 90 }), l: IK([-34, -4], "x+"), l2: [-5, -90, -90] }, { h: [-20, -88], t: 100, n: 108, a: a2, a2: IK([30, -46], "x-", { w: 90 }), l: IK([-34, -4], "x+"), l2: [-5, -90, -90] }];
def("rowing-haltere", { k: benchRow([0, 0, 0], IJ("hip", [8, -6], "y-")), s: rep(1000, 1300, "Tire l’haltère vers la hanche", "Redescends lentement"), p: ROWB.concat([db1("gR", 8)]) });
def("rowing-machine", { k: [SEAT(-56, { t: 168, a: IK([62, -118], "y+"), l: IK([36, -4], "y-", { f: 90 }) }), SEAT(-56, { t: 172, a: IK([16, -116], "y+"), l: IK([36, -4], "y-", { f: 90 }) })], s: rep(1100, 1400, "Tire les coudes vers l’arrière", "Reviens lentement"),
  p: [pad([-12, -46], [30, -46], 8), post([8, -42], [8, 0]), pad([24, -94], [27, -124], 9), post([30, -96], [40, 0]), post([86, 0], [86, -150]), J => L([86, -120], J.gR, 4, "fr"), hnd()] });
def("rowing-inverse", () => { const A = [110, -8], t1 = tFor(A, -42, true), t2 = tFor(A, -80, true), B = [rootOf(A, t1)[0] + 4, -92]; return { k: [PL(A, t1, { a: IK(B, 1, { w: 180 }), l: IK(A, "y-") }), PL(A, t2, { a: IK(B, 1, { w: 180 }), l: IK(A, "y-") })], s: rep(1100, 1400, "Tire la poitrine vers la barre", "Redescends lentement"), p: [C(plus(B, [0, -4]), 4, "eq", 2), post(plus(B, [-12, -4]), [B[0] - 12, 0])] }; });
def("souleve-terre", { k: [{ h: [-26, -58], t: 118, n: 126, a: [0, 0, 0], l: FT }, ST({ a: [0, 0, 0] })], s: rep(1400, 1500, "Pousse dans le sol, dos plat", "Redescends, fesses en arrière", [600, 400, 500]), p: [plate("gR", 21)] });
def("sdt-kettlebell", { k: [{ h: [-24, -50], t: 125, n: 132, a: [0, 0, 0], l: FT }, ST({ a: [0, 0, 0] })], s: rep(1200, 1400, "Relève-toi en serrant les fessiers", "Redescends en contrôlant"), p: [kb()] });
const HE = [0, -72];
def("extension-lombaire", { k: [{ h: HE, t: 135, a: IJ("ch", [-2, 2], "y+"), l: [-45, -45, 40] }, { h: HE, t: 18, n: 15, a: IJ("ch", [-2, 2], "y+"), l: [-45, -45, 40] }], s: [[0, 0, 500], [1, 1500, 300, "Descends le buste, dos plat"], [0, 1300, 500, "Remonte jusqu’à l’alignement"]],
  p: [pad(add(add(HE, 45, 13), -45, -4), add(add(HE, 45, 13), -45, 26), 10), post(add(add(HE, 45, 13), -45, 14), [-10, 0]), RC([-60, -6], 24, 8, -45, "fr"), post([-60, -6], [-20, 0])] });
def("superman", { k: [{ h: [0, -11], t: 90, n: 92, a: [90, 90, 90], l: [-90, -90, -90] }, { h: [0, -12], t: 90, t2: 104, n: 108, a: [104, 104, 104], l: [-100, -98, -96] }], s: [[0, 0, 500], [1, 1000, 1600, "Décolle bras, poitrine et jambes"], [0, 1000, 500, "Redescends doucement"]] });
def("pull-over-poulie", { k: [ST({ t: 162, a: [148, 150] }), ST({ t: 164, a: [12, 14] })], s: rep(1100, 1500, "Ramène la barre vers les cuisses, bras tendus", "Remonte lentement"), p: [post([84, 0], [84, -215]), J => cab([80, -210], J.gR), hnd()] });
def("shrug-halteres", { v: "front", k: [FST({ a: [5, 3] }), FST({ a: [5, 3], sh: 8 })], s: rep(700, 1000, "Hausse les épaules", "Redescends lentement", [500, 900, 500]), p: [{ k: "dbs", p: "gR", z: 2 }, { k: "dbs", p: "gL", z: 2 }] });
def("shrug-barre", { v: "front", k: [FST({ a: [3, -4] }), FST({ a: [3, -4], sh: 8 })], s: rep(700, 1000, "Hausse les épaules", "Redescends lentement", [500, 900, 500]), p: [barF(24, 19)] });
def("rowing-elastique", { k: [ST({ a: IR([52, 4], "y+"), l: IK([4, -4], "x+") }), ST({ a: IJ("bl", [4, -10], "y+") })], s: rep(1000, 1300, "Tire les coudes en arrière", "Reviens lentement"), p: [post([96, 0], [96, -140]), J => band([92, -124], J.gR), hnd()] });

/* ================= ÉPAULES ================= */
def("dm-barre", { k: [ST({ a: IJ("rk", [3, -2], "y+", { w: 160 }) }), ST({ a: IR([-2, -53], "x+", { w: 180 }) })], s: rep(1100, 1400, "Pousse au-dessus de la tête", "Redescends sous contrôle", [500, 350, 500]), p: [plate("gR", 16)] });
const backrest = [RC([0, -100], 34, 70, 0, "pad", 0)];
def("dm-halteres", { v: "front", k: [FSEAT({ a: [90, 180, 180] }), FSEAT({ a: [158, 174, 174] })], s: rep(1100, 1400, "Pousse au-dessus de la tête", "Redescends coudes à hauteur d’épaules"), p: backrest.concat(FSEATP, dbF()) });
def("arnold", { v: "front", k: [FSEAT({ a: [-18, 178, 178] }), FSEAT({ a: [90, 180, 180] }), FSEAT({ a: [158, 174, 174] })], s: [[0, 0, 450], [1, 700, 0, "Ouvre les coudes en tournant"], [2, 800, 300, "Pousse"], [1, 900, 0, "Redescends"], [0, 700, 450, "Referme"]], p: backrest.concat(FSEATP, dbF()) });
def("presse-epaules", { v: "front", k: [FSEAT({ a: [92, 180, 180] }), FSEAT({ a: [158, 174, 174] })], s: rep(1100, 1400, "Pousse vers le haut", "Redescends lentement"), p: backrest.concat(FSEATP, [post([42, -60], [42, -200]), post([-42, -60], [-42, -200]), hnd("gR"), hnd("gL")]) });
def("elevations-laterales", { v: "front", k: [FST({ a: [7, 9] }), FST({ a: [86, 94] })], s: rep(1000, 1500, "Monte les bras sur les côtés", "Redescends lentement"), p: [{ k: "dbs", p: "gR", z: 2 }, { k: "dbs", p: "gL", z: 2 }] });
def("elev-lat-poulie", { v: "front", k: [FST({ a: IK([-6, -84], "x+"), aL: IK([-30, -96], "x-") }), FST({ a: [86, 94], aL: IK([-30, -96], "x-") })], s: rep(1000, 1500, "Monte le bras sur le côté", "Redescends lentement"), p: [post([-50, 0], [-50, -110]), cab([-46, -10], "gR"), hnd()] });
def("elevations-frontales", { k: [ST({ a: [3, 5] }), ST({ a: [88, 92] })], s: rep(1000, 1400, "Monte devant toi", "Redescends lentement"), p: dbs() });
def("oiseau", { v: "front", bk: 1, lb: 1, k: [{ h: [0, -80], tl: .45, n: 20, a: [3, 1], l: IK([14, -4], "x+") }, { h: [0, -80], tl: .45, n: 20, a: [84, 92], l: IK([14, -4], "x+") }], s: rep(1000, 1500, "Ouvre les bras sur les côtés", "Redescends sous contrôle"), p: [{ k: "dbs", p: "gR", z: 2 }, { k: "dbs", p: "gL", z: 2 }], cap: "Vue de face, buste penché" });
def("reverse-pec-deck", { v: "top", k: [{ c: TOPC, a: IK([7, -112], "x+") }, { c: TOPC, a: [98, 92] }], s: rep(1100, 1500, "Ouvre les bras vers l’arrière", "Reviens lentement"), p: [pad([-22, -75], [22, -75], 10), hnd("gR"), hnd("gL")] });
def("face-pull", { k: [ST({ a: IR([48, -18], "y+") }), ST({ a: IJ("head", [-4, 4], "y-") })], s: rep(1000, 1400, "Tire vers le visage, coudes hauts", "Reviens lentement"), p: [post([92, 0], [92, -170]), J => cab([88, -160], J.gR), hnd()] });
def("rowing-menton", { v: "front", k: [FST({ a: IK([12, -80], "x+") }), FST({ a: IK([12, -130], "x+") })], s: rep(1000, 1400, "Monte la barre, coudes vers le haut", "Redescends lentement"), p: [barF(26, 17)] });
def("pike-pushup", { k: [{ h: [-40, -88], t: 47.6, n: 40, a: IK([0, -4], "x-", { w: 90 }), l: IK([-70, -10], "y+", { f: 0 }) }, { h: [-32, -80], t: 40, n: 28, a: IK([0, -4], "x-", { w: 90 }), l: IK([-70, -10], "y+", { f: 0 }) }], s: rep(1300, 1000, "Descends la tête entre les mains", "Pousse") });
def("rotation-externe", { v: "front", k: [FST({ a: [2, 88, null, 1, .25], aL: [-4, -6] }), FST({ a: [2, 88, null, 1, 1], aL: [-4, -6] })], s: rep(1000, 1300, "Tourne l’avant-bras vers l’extérieur", "Reviens lentement"), p: [post([-70, 0], [-70, -100]), band([-66, -92], "gR")], cap: "Vue de face, coude collé" });
def("elevations-y", { k: [{ h: [-20, -62], t: 125, n: 128, a: [0, 0], l: IK([-66, -4], "x+") }, { h: [-20, -62], t: 125, n: 132, a: [132, 134], l: IK([-66, -4], "x+") }], s: rep(1100, 1400, "Monte les bras en Y", "Redescends lentement", [500, 600, 500]),
  p: [pad(add(add([-20, -62], 125, -18), 35, 13), add(add([-20, -62], 125, 50), 35, 13), 9), post(add(add([-20, -62], 125, 10), 35, 16), [-6, 0]), dbs()[0], dbs()[1]] });

/* ================= BICEPS ================= */
const curlK = (x, u2) => [ST(O({ a: [3, 5] }, x)), ST(O({ a: [u2 == null ? 8 : u2, 152] }, x))];
def(["curl-barre", "curl-ez", "curl-inverse"], { k: curlK(), s: rep(1000, 1500, "Monte la barre, coudes fixes", "Redescends lentement"), p: [plate("gR", 15)] });
def("curl-marteau", { k: curlK(), s: rep(1000, 1500, "Monte les haltères", "Redescends lentement"), p: dbs() });
def("curl-halteres", { k: [ST({ a: [3, 5] }), ST({ a: [8, 152], a2: [3, 5] }), ST({ a: [3, 5], a2: [8, 152] })], s: [[0, 0, 450], [1, 1000, 250, "Monte un haltère"], [0, 1300, 150, "Redescends"], [2, 1000, 250, "Puis l’autre bras"], [0, 1300, 450, "Redescends"]], p: dbs() });
def("curl-poulie", { k: curlK(), s: rep(1000, 1500, "Monte la barre vers les épaules", "Redescends lentement"), p: [post([62, 0], [62, -30]), J => cab([58, -12], J.gR), hnd()] });
const HC = [10, -54];
def("curl-incline", { k: [{ h: HC, t: 215, n: 205, a: [0, 4], l: IK([56, -4], "y-", { f: 90 }) }, { h: HC, t: 215, n: 205, a: [2, 150], l: IK([56, -4], "y-", { f: 90 }) }], s: rep(1100, 1500, "Monte, coudes immobiles", "Redescends jusqu’à l’étirement"), p: [pad(add(add(HC, 215, -6), 305, 13), add(add(HC, 215, 66), 305, 13), 9), pad([-4, -40], [34, -40], 8), post([12, -36], [12, 0]), post(add(add(HC, 215, 50), 305, 16), [-26, 0])].concat(dbs()) });
def("curl-pupitre", () => { const H = [-10, -56], T = 165, ar = add(add(H, T, F.tl), T, F.tu - 5); return { k: [{ h: H, t: T, a: [50, 72], l: IK([30, -4], "y-", { f: 90 }) }, { h: H, t: T, a: [50, 176], l: IK([30, -4], "y-", { f: 90 }) }], s: rep(1000, 1500, "Monte vers les épaules", "Redescends sans claquer les bras"), p: [pad(add(add(ar, 50, 4), -40, 7), add(add(ar, 50, 32), -40, 7), 9), post(add(add(ar, 50, 18), -40, 10), [24, 0]), pad([-26, -46], [6, -46], 8), plate("gR", 14)] }; });
def("curl-concentre", { k: [{ h: [-6, -54], t: 140, n: 125, a: [0, 2], a2: IJ("kR", [-2, -6], "x-"), l: IK([36, -4], "y-", { f: 90 }) }, { h: [-6, -54], t: 140, n: 125, a: [0, 158], a2: IJ("kR", [-2, -6], "x-"), l: IK([36, -4], "y-", { f: 90 }) }], s: rep(1000, 1500, "Monte vers l’épaule, contracte", "Redescends lentement"), p: [pad([-24, -46], [10, -46], 8), post([-8, -42], [-8, 0]), db1("gR", 7)] });
def("curl-araignee", { k: [{ h: [-30, -72], t: 135, n: 140, a: [0, 2], l: IK([-62, -4], "x+") }, { h: [-30, -72], t: 135, n: 140, a: [0, 150], l: IK([-62, -4], "x+") }], s: rep(1000, 1500, "Monte, coudes fixes", "Redescends lentement"), p: [pad(add(add([-30, -72], 135, -12), 45, 13), add(add([-30, -72], 135, 46), 45, 13), 9), post(add(add([-30, -72], 135, 14), 45, 16), [-6, 0])].concat(dbs()) });

/* ================= TRICEPS ================= */
def("barre-front", { k: [LIE({ a: [184, 184, 184] }), LIE({ a: [196, 290, 290] })], s: rep(1400, 1000, "Plie les coudes vers le front", "Tends les bras"), p: BENCH.concat([plate("gR", 14)]) });
const extPoulie = { k: [ST({ t: 172, a: [8, 124] }), ST({ t: 172, a: [8, 8] })], s: rep(900, 1300, "Pousse vers le bas, coudes collés", "Remonte lentement"), p: [post([42, 0], [42, -225]), J => cab([38, -218], J.gR), hnd()] };
def(["extension-corde", "extension-barre-poulie"], extPoulie);
def("extension-nuque", { k: [ST({ a: [182, 182, 182] }), ST({ a: [186, 334, 334] })], s: rep(1400, 1100, "Descends derrière la tête", "Tends les bras"), p: [db1("gR", 8)] });
def("extension-nuque-poulie", { k: [{ h: [0, -86], t: 150, n: 158, a: [140, 300], l: IK([30, -4], "x+"), l2: IK([-34, -6], "x+") }, { h: [0, -86], t: 150, n: 158, a: [142, 146], l: IK([30, -4], "x+"), l2: IK([-34, -6], "x+") }], s: rep(1000, 1400, "Tends les bras vers l’avant", "Reviens jusqu’à l’étirement"), p: [post([-84, 0], [-84, -170]), J => cab([-80, -160], J.gR), hnd()] });
def("kickback", { k: benchRow([-92, 0, 0], [-92, -90, -90]), s: rep(900, 1300, "Tends l’avant-bras vers l’arrière", "Reviens lentement"), p: ROWB.concat([db1("gR", 7)]) });
def("dips-banc", { k: [{ h: [-4, -54], t: 176, a: IK([-12, -48], "x-", { w: 90 }), l: IK([76, -6], "y-", { f: 170 }) }, { h: [2, -28], t: 174, a: IK([-12, -48], "x-", { w: 90 }), l: IK([76, -6], "y-", { f: 170 }) }], s: rep(1300, 1000, "Descends, coudes à 90°", "Pousse pour remonter"), p: [pad([-64, -40], [-8, -40], 8), post([-52, -36], [-52, 0]), post([-20, -36], [-20, 0])] });

/* ================= AVANT-BRAS ================= */
const wrist = (w1, w2, l1, l2) => ({ k: [SEAT(-54, { t: 158, a: [-12, 92, w1], l: IK([40, -4], "y-", { f: 90 }) }), SEAT(-54, { t: 158, a: [-12, 92, w2], l: IK([40, -4], "y-", { f: 90 }) })], s: rep(800, 1100, l1, l2, [500, 300, 500]), focus: ["ar", "eR", "wR", "hR", "kR", "hip"], p: [pad([-18, -46], [14, -46], 8), post([-2, -42], [-2, 0]), db1("gR", 6)] });
def("curl-poignets", wrist(40, 148, "Remonte en fléchissant le poignet", "Laisse redescendre"));
def("extension-poignets", wrist(60, 118, "Monte le dos de la main", "Redescends lentement"));
/* marche sur place */
const walk = (x, arms) => { const a = arms || [0, 0, 0]; return [
  O({ h: [0, -86], a, l: IK([20, -5], "x+", { f: 105 }), l2: IK([-18, -9], "x+", { f: 50 }) }, x),
  O({ h: [0, -88], a, l: IK([2, -4], "x+"), l2: IK([-4, -22], "x+", { f: 60 }) }, x),
  O({ h: [0, -86], a, l2: IK([20, -5], "x+", { f: 105 }), l: IK([-18, -9], "x+", { f: 50 }) }, x),
  O({ h: [0, -88], a, l2: IK([2, -4], "x+"), l: IK([-4, -22], "x+", { f: 60 }) }, x)]; };
def("farmer-walk", { k: walk(), s: cyc([0, 1, 2, 3], 2, 420, "Marche à petits pas, buste droit", 1), p: dbs(8) });
def("suspension", { v: "front", k: [{ h: [0, -96], sh: 6, a: IK([26, BARY + 5], "x+", { w: 180 }), l: [3, 3] }, { h: [0, -100], sh: -1, a: IK([26, BARY + 5], "x+", { w: 180 }), l: [3, 3] }], s: hold(900, 2600, "Épaules engagées, respire calmement"), p: [L([-62, BARY], [62, BARY], 4, "eq"), post([-62, BARY], [-62, BARY + 40]), post([62, BARY], [62, BARY + 40])], floor: false });

/* ================= ABDOS & GAINAGE ================= */
def("planche", () => { const A = [-120, -12], t = tFor(A, -35), ar = rootOf(A, t), K = [ar[0] - Math.sin(108.6 / D) * (F.th + AR), -6], tk = 108.6;
  return { k: [{ h: add(K, tk, F.th), t: tk, a: [0, 90, 90], l: [tk + 180, -90, -90] }, { h: add(A, t, LEG - .5), t, a: [0, 90, 90], l: [t + 180, t + 180, -8] }], s: hold(1000, 3000, "Corps aligné, abdos et fessiers serrés", "Repose les genoux") }; });
def("planche-laterale", { v: "front", k: [{ h: [8, -10], t: 239, n: 245, a: [168, 172], aL: IK([-72, -5], "y+", { w: -90 }), l: IK([98, -4], "y-"), lL: IK([98, -4], "y-") }, { h: [0, -28], t: 252, n: 252, a: [176, 178], aL: IK([-72, -5], "y+", { w: -90 }), l: IK([98, -4], "y-"), lL: IK([98, -4], "y-") }], s: hold(1000, 2800, "Monte les hanches, corps aligné", "Redescends"), cap: "Vue de face" });
const HAND_HEAD = IJ("nape", [2, 0], "y-");
def("crunch", { k: [FLOOR({ a: HAND_HEAD, l: IK([40, -4], "y-", { f: 90 }) }), FLOOR({ t: 268, t2: 240, n: 228, a: HAND_HEAD, l: IK([40, -4], "y-", { f: 90 }) })], s: rep(900, 1200, "Enroule le haut du dos", "Redescends lentement") });
def("crunch-inverse", { k: [FLOOR({ a: [92, 90, 90], l: [180, 90, 180] }), { h: [4, -24], t: 291, t2: 270, n: 270, a: [92, 90, 90], l: [222, 128, 210] }], s: rep(1000, 1300, "Ramène les genoux, décolle le bassin", "Redescends sans poser les pieds") });
def("releve-jambes-sol", { k: [FLOOR({ a: [92, 92, 90], l: [93, 93] }), FLOOR({ a: [92, 92, 90], l: [178, 178] })], s: rep(1100, 1500, "Monte les jambes à la verticale", "Redescends sans toucher le sol") });
def("releve-jambes-suspendu", { k: [{ h: [-2, -104], t: 182, a: IK([4, BARY + 5], "x+", { w: 180 }), l: [2, 2] }, { h: [-2, -104], t: 192, a: IK([4, BARY + 5], "x+", { w: 180 }), l: [92, 92] }], s: rep(1100, 1500, "Monte les jambes à l’horizontale", "Redescends sans te balancer"), p: [C([4, BARY], 4, "eq", 2), post([4, BARY], [-40, BARY - 12], 3)], floor: false });
def("releve-genoux-chaise", { k: [{ h: [0, -100], t: 180, a: [0, 90, 90], l: [2, 2] }, { h: [0, -98], t: 176, a: [0, 90, 90], l: [102, 2] }], s: rep(900, 1300, "Monte les genoux vers la poitrine", "Redescends lentement"), p: [pad([-14, -152], [-14, -88], 10), pad([-4, -113], [32, -113], 6), post([-20, -88], [-20, 0]), post([-20, -113], [-4, -113], 3)] });
def("russian-twist", { v: "front", k: [{ h: [0, -14], t: 172, tl: .8, n: 170, a: IK([30, -40], "x+"), aL: IK([30, -40], "x-"), l: [158, 24, null, .55, .5], lL: [-158, -24, null, .55, .5] }, { h: [0, -14], t: 188, tl: .8, n: 190, a: IK([-30, -40], "x+"), aL: IK([-30, -40], "x-"), l: [158, 24, null, .55, .5], lL: [-158, -24, null, .55, .5] }], s: [[0, 0, 350], [1, 900, 150, "Tourne le buste d’un côté puis de l’autre"], [0, 900, 150], [1, 900, 150], [0, 900, 400]], p: [C("gR", 0)], cap: "Vue de face, assis" });
def("mountain-climbers", () => { const A = [-118, -12], t = tFor(A, -57), H = [rootOf(A, t)[0], -4], b = PL(A, t, { a: IK(H, "x-", { w: 90 }) });
  return { k: [b, O(b, { l: IK([-34, -9], "y-", { f: 0 }) }), O(b, { l2: IK([-34, -9], "y-", { f: 0 }) })], s: cyc([0, 1, 0, 2], 2, 320, "Ramène un genou puis l’autre", 0) }; });
def("bicycle", { k: [FLOOR({ t2: 244, n: 236, a: HAND_HEAD, l: [218, 118], l2: [98, 96] }), FLOOR({ t2: 244, n: 236, a: HAND_HEAD, l2: [218, 118], l: [98, 96] })], s: cyc([0, 1], 2, 700, "Coude vers le genou opposé, alterne") });
def("dead-bug", { k: [FLOOR({ a: [180, 180, 180], l: [180, 90, 180] }), FLOOR({ a: [262, 266, 266], a2: [180, 180, 180], l: [180, 90, 180], l2: [97, 96] }), FLOOR({ a2: [262, 266, 266], a: [180, 180, 180], l2: [180, 90, 180], l: [97, 96] })], s: [[0, 0, 450], [1, 1100, 300, "Tends un bras et la jambe opposée"], [0, 900, 200, "Reviens au centre"], [2, 1100, 300, "Puis l’autre côté"], [0, 900, 450]] });
def("bird-dog", { k: [QUAD(), QUAD({ a: [90, 90, 90], l2: [-90, -90, -90] }), QUAD({ a2: [90, 90, 90], l: [-90, -90, -90] })], s: [[0, 0, 450], [1, 1100, 900, "Tends un bras et la jambe opposée"], [0, 900, 200], [2, 1100, 900, "Puis l’autre côté"], [0, 900, 450]] });
def("hollow", { k: [FLOOR({ a: [270, 270, 270], l: [92, 92] }), FLOOR({ t: 268, t2: 250, n: 246, a: [246, 250, 250], l: [104, 104] })], s: hold(1000, 2800, "Décolle épaules et jambes, bas du dos plaqué", "Repose") });
def("ab-wheel", () => { const K = [-40, -6], hip = th => add(K, th, F.th); return { k: [{ h: hip(180), t: 112, n: 104, a: IK([6, -12], "y-", { w: 90 }), l: [0, -90, -90] }, { h: hip(132), t: 100, n: 100, a: IK([78, -12], "y-", { w: 90 }), l: [-48, -90, -90] }], s: rep(1500, 1300, "Roule vers l’avant, dos plat", "Reviens en contractant les abdos"), p: [J => [C([J.gR[0], -9], 9, "eq", 2), C([J.gR[0], -9], 3, "bg", 2)]] }; });
def("crunch-poulie", { k: [{ h: [0, -49], t: 176, t2: 170, n: 168, a: IJ("head", [6, 4], "y+"), l: [0, -90, -90] }, { h: [0, -49], t: 150, t2: 78, n: 52, a: IJ("head", [6, 4], "y+"), l: [0, -90, -90] }], s: rep(1100, 1400, "Enroule le buste vers le sol", "Remonte lentement"), p: [post([70, 0], [70, -225]), J => cab([66, -218], J.gR)] });
def("pallof", { v: "top", k: [{ c: TOPC, a: IK([3, -84], "x+"), aL: IK([-3, -84], "x-") }, { c: TOPC, a: IK([3, -122], "x+"), aL: IK([-3, -122], "x-") }], s: [[0, 0, 500], [1, 900, 1300, "Pousse devant toi sans tourner"], [0, 900, 500, "Ramène contre la poitrine"]], p: [post([96, -86], [96, -86]), J => cab([92, -84], J.gR), hnd("gR")], cap: "Vue de dessus, poulie sur le côté" });
def("bucheron", { v: "front", k: [FST({ t: 172, n: 168, a: IK([54, -176], "x+"), aL: IK([50, -172], "x+"), l: IK([24, -4], "x+") }), FST({ t: 190, n: 194, a: IK([-38, -72], "x-"), aL: IK([-42, -74], "x-"), l: IK([24, -4], "x+") })], s: rep(1000, 1400, "Tire en diagonale vers la hanche opposée", "Reviens lentement"), p: [post([92, 0], [92, -222]), J => cab([88, -214], J.gR), hnd()] });
def("shoulder-taps", () => { const A = [-122, -12], t = tFor(A, -57), H = [rootOf(A, t)[0], -4], b = PL(A, t, { a: IK(H, "x-", { w: 90 }), l: IK(A, "y+", { f: -8 }) });
  return { k: [b, O(b, { a: IJ("sho", [-2, 4], "x-") }), O(b, { a2: IJ("sho", [-2, 4], "x-") })], s: [[0, 0, 400], [1, 700, 250, "Touche l’épaule opposée"], [0, 600, 150], [2, 700, 250, "Alterne, hanches immobiles"], [0, 600, 400]] }; });
def("v-ups", { k: [FLOOR({ a: [270, 270, 270], l: [90, 90] }), { h: [0, -12], t: 230, n: 222, a: [142, 140], l: [132, 132] }], s: rep(900, 1300, "Monte buste et jambes ensemble", "Redescends lentement") });
def("ciseaux", { k: [FLOOR({ a: [92, 92, 90], l: [104, 104], l2: [96, 96] }), FLOOR({ a: [92, 92, 90], l: [96, 96], l2: [104, 104] })], s: cyc([0, 1], 3, 380, "Petits battements alternés", 0) });

/* ================= QUADRICEPS ================= */
const squat = (bot, x, eq, labs) => ({ k: [ST(x), O({ l: FT }, x, bot)], s: rep(1500, 1100, (labs || [])[0] || "Descends, fesses en arrière", (labs || [])[1] || "Remonte en poussant dans le sol"), p: eq || [] });
def("squat-barre", squat({ h: [-26, -50], t: 140, n: 150 }, { a: IJ("bk", [-2, 2], "y+") }, [plate("bk", 18)]));
def("front-squat", squat({ h: [-18, -48], t: 160, n: 166 }, { a: IJ("rk", [2, -2], "x+", { w: 150 }) }, [plate("rk", 16)]));
def("goblet-squat", squat({ h: [-22, -48], t: 152, n: 158 }, { a: IJ("ch", [6, 4], "y+", { w: 180 }) }, [db1("gR", 9)]));
def("squat-pdc", squat({ h: [-26, -50], t: 140, n: 148 }, { a: [84, 88, 88] }));
def("squat-smith", squat({ h: [-20, -52], t: 150, n: 158 }, { a: IJ("bk", [-2, 2], "y+"), l: IK([8, -4], "x+") }, [post([-8, -6], [-8, -180], 3), plate("bk", 16)]));
def("presse-cuisses", () => { const H = [0, -40], T = 228, far = add(H, 135, 80), near = add(H, 135, 46); const plat = J => { const c = add(J.aR, 135, 4); return pad(add(c, 45, 24), add(c, 225, 24), 7); };
  return { k: [{ h: H, t: T, n: 210, a: IJ("hip", [6, 8], "y+"), l: IK(far, "y-", { f: 225 }) }, { h: H, t: T, n: 210, a: IJ("hip", [6, 8], "y+"), l: IK(near, "y-", { f: 225 }) }], s: rep(1500, 1100, "Descends, genoux vers la poitrine", "Pousse sans verrouiller"),
    p: [pad(add(add(H, T, -4), T + 90, 13), add(add(H, T, 60), T + 90, 13), 9), pad([-6, -30], [22, -30], 8), post([8, -26], [8, 0]), L(add(add(H, 135, 30), 45, 18), add(add(H, 135, 110), 45, 18), 4, "fr"), post(add(add(H, 135, 70), 45, 18), [70, 0]), plat] }; });
def("hack-squat", () => { const T = 200, A = [30, -12]; const pd = J => [pad(add(J.hip, T + 90, 13), add(J.sho, T + 90, 13), 9), RC(add(J.sho, T, 2), 18, 6, 0, "pad")];
  return { k: [{ h: [2, -92], t: T, n: 192, a: IJ("sho", [4, -4], "y+"), l: IK(A, "x+", { f: 80 }) }, { h: add([2, -92], 20, 42), t: T, n: 192, a: IJ("sho", [4, -4], "y+"), l: IK(A, "x+", { f: 80 }) }], s: rep(1500, 1100, "Descends en contrôlant", "Remonte en poussant fort"), p: [L(add([2, -92], 20, -30), add([2, -92], 20, 70), 4, "fr"), RC([34, -6], 40, 8, -12, "fr"), pd] }; });
def("leg-extension", { k: [{ h: [0, -58], t: 188, a: IJ("hip", [8, 6], "y+"), l: [92, 2] }, { h: [0, -58], t: 188, a: IJ("hip", [8, 6], "y+"), l: [92, 86] }], s: rep(900, 1400, "Tends les jambes", "Redescends lentement"),
  p: [pad([-14, -48], [38, -48], 8), pad([-14, -60], [-22, -122], 9), post([10, -44], [10, 0]), J => { const a = angOf(J.kR, J.aR), c = add(add(J.aR, a + 90, 8), a, -6); return [L(J.kR, c, 4, "eq"), C(c, 7, "pad", 2)]; }] });
const LUNGE = (front, back, hip, t) => ({ h: hip, t: t || 178, a: [3, 5], l: IK(front, "x+"), l2: IK(back, "x+", { f: 28 }) });
def("fentes-avant", { k: [ST(), { h: [8, -85], t: 180, a: [3, 5], l: IK([30, -14], "x+"), l2: FT }, LUNGE([56, -4], [-22, -9], [22, -50])], s: [[0, 0, 400], [1, 500, 0, "Grand pas en avant"], [2, 800, 300, "Descends, genou arrière près du sol"], [1, 800, 0, "Pousse pour revenir"], [0, 500, 450]], p: dbs() });
def("fentes-arriere", { k: [ST(), { h: [-6, -85], t: 180, a: [3, 5], l: IK([-34, -16], "x+", { f: 60 }), l2: FT }, { h: [-34, -50], t: 178, a: [3, 5], l: IK([-78, -9], "x+", { f: 28 }), l2: IK([0, -4], "x+") }], s: [[0, 0, 400], [1, 500, 0, "Recule une jambe"], [2, 800, 300, "Descends"], [1, 800, 0, "Reviens en poussant sur la jambe avant"], [0, 500, 450]], p: dbs() });
def("fentes-marchees", { k: [ST(), LUNGE([56, -4], [-22, -9], [22, -50]), ST({ h: [56, -88], l: IK([56, -4], "x+") }), { h: [78, -50], t: 178, a: [3, 5], l2: IK([112, -4], "x+"), l: IK([34, -9], "x+", { f: 28 }) }, ST({ h: [112, -88], l: IK([112, -4], "x+") })], s: [[0, 0, 400], [1, 1000, 200, "Avance en fente"], [2, 800, 100, "Ramène la jambe arrière"], [3, 1000, 200, "Fente avec l’autre jambe"], [4, 800, 500]], p: dbs() });
def("squat-bulgare", { k: [{ h: [-4, -86], t: 178, a: [3, 5], l: IK([20, -4], "x+"), l2: IK([-52, -46], "y+", { f: -80 }) }, { h: [-8, -50], t: 168, a: [3, 5], l: IK([20, -4], "x+"), l2: IK([-52, -46], "y+", { f: -80 }) }], s: rep(1500, 1100, "Descends sur la jambe avant", "Remonte en poussant dans le talon"), p: [pad([-100, -40], [-42, -40], 8), post([-88, -36], [-88, 0]), post([-54, -36], [-54, 0])].concat(dbs()) });
def("step-up", { k: [{ h: [0, -86], t: 178, a: [3, 5], l: IK([36, -48], "x+"), l2: FT }, { h: [34, -130], t: 178, a: [3, 5], l: IK([36, -48], "x+"), l2: IK([30, -50], "x+") }], s: rep(1100, 1200, "Monte en poussant sur la jambe du banc", "Redescends lentement"), p: [RC([44, -22], 48, 44, 0, "fr")].concat(dbs()) });
def("squat-saute", { k: [ST(), { h: [-24, -54], t: 142, n: 150, a: [-40, -34], l: FT }, { h: [0, -110], t: 178, a: [162, 166], l: IK([0, -24], "x+", { f: 40 }) }], s: [[0, 0, 350], [1, 650, 120, "Descends en squat"], [2, 300, 120, "Saute le plus haut possible"], [1, 350, 250, "Réception en douceur"], [0, 700, 400]] });
def("pistol", { k: [{ h: [0, -88], t: 178, a: [84, 88, 88], l: [24, 26], l2: FT }, { h: [-22, -42], t: 132, n: 142, a: [84, 88, 88], l: [84, 88], l2: FT }], s: rep(1700, 1300, "Descends sur une jambe", "Remonte sans poser l’autre pied") });
def("chaise", { k: [{ h: [-24, -80], t: 180, a: [3, 5], l: IK([22, -4], "x+") }, { h: [-24, -48], t: 180, a: [10, 12], l: IK([22, -4], "x+") }], s: hold(1300, 2800, "Glisse le long du mur, genoux à 90°", "Remonte"), p: [RC([-40, -90], 8, 180, 0, "fr")] });
def("fentes-laterales", { v: "front", k: [FST({ a: IJ("ch", [0, 10], "x+"), aL: IJ("ch", [0, 10], "x-"), l: IK([12, -4], "x+"), lL: IK([-12, -4], "x-") }), FST({ h: [36, -64], t: 174, a: IJ("ch", [0, 10], "x+"), aL: IJ("ch", [0, 10], "x-"), l: IK([82, -4], "x+"), lL: IK([-12, -4], "x-") })], s: rep(1200, 1000, "Grand pas sur le côté, fesses en arrière", "Pousse pour revenir") });

/* ================= ISCHIO-JAMBIERS ================= */
const hinge = (bot, x, eq, labs) => ({ k: [ST(x), O({ l: FT }, x, bot)], s: rep(1500, 1200, (labs || [])[0] || "Pousse les fesses en arrière, dos plat", (labs || [])[1] || "Remonte en serrant les fessiers"), p: eq || [] });
def("sdt-roumain", hinge({ h: [-26, -85], t: 100, n: 108 }, { a: [0, 0, 0] }, [plate("gR", 18)]));
def("sdt-roumain-halteres", hinge({ h: [-24, -85], t: 102, n: 110 }, { a: [0, 0, 0] }, dbs(8)));
def("good-morning", hinge({ h: [-24, -85], t: 100, n: 110 }, { a: IJ("bk", [-2, 2], "y+") }, [plate("bk", 16)]));
def("leg-curl-allonge", { k: [{ h: [-14, -52], t: 90, n: 100, a: [30, 70, 90], l: [270, 270, 270] }, { h: [-14, -52], t: 90, n: 100, a: [30, 70, 90], l: [270, 162, 250] }], s: rep(1000, 1400, "Ramène les talons vers les fesses", "Redescends lentement"),
  p: [pad([-54, -40], [62, -40], 8), post([-40, -36], [-40, 0]), post([48, -36], [48, 0]), J => { const a = angOf(J.kR, J.aR), c = add(add(J.aR, a - 90, 8), a, -6); return [L(J.kR, c, 4, "eq"), C(c, 7, "pad", 2)]; }] });
def("leg-curl-assis", { k: [{ h: [0, -58], t: 194, a: IJ("hip", [8, 6], "y+"), l: [92, 80] }, { h: [0, -58], t: 194, a: IJ("hip", [8, 6], "y+"), l: [92, -14] }], s: rep(1000, 1400, "Ramène les talons sous le siège", "Reviens lentement"),
  p: [pad([-14, -48], [40, -48], 8), pad([-14, -60], [-24, -122], 9), post([10, -44], [10, 0]), J => RC(plus(J.kR, [-10, -10]), 24, 7, 0, "pad"), J => { const a = angOf(J.kR, J.aR), c = add(add(J.aR, a - 90, 8), a, -6); return [L(J.kR, c, 4, "eq"), C(c, 7, "pad", 2)]; }] });
def("nordic-curl", () => { const K = [0, -6], P = (th, a) => ({ h: add(K, th, F.th), t: th, a, l: [th + 180, -90, -90] }); return { k: [P(180, IJ("ch", [0, 2], "y+")), P(128, IJ("ch", [0, 2], "y+")), P(104, [70, 72, 90])], s: [[0, 0, 450], [1, 1700, 0, "Descends lentement en résistant"], [2, 700, 250, "Rattrape-toi avec les mains"], [0, 1300, 450, "Repousse et remonte"]], p: [J => C(plus(J.aR, [0, -9]), 6, "pad", 2)] }; });
def("sdt-unilateral", { k: [{ h: [0, -88], t: 180, a: [0, 0, 0], a2: [0, 0, 0], l: [-6, -14], l2: FT }, { h: [-14, -86], t: 96, n: 102, a: [0, 0, 0], a2: [0, 0, 0], l: [-84, -84, -10], l2: FT }], s: rep(1500, 1300, "Penche le buste, jambe libre en arrière", "Remonte en serrant le fessier"), p: [db1("gR", 8)] });
def("leg-curl-swissball", { k: [{ h: [0, -30], t: 290, n: 280, a: [92, 92, 90], l: IK([84, -34], "y-", { f: 180 }) }, { h: [0, -38], t: 302, n: 285, a: [92, 92, 90], l: IK([38, -36], "y-", { f: 160 }) }], s: rep(1100, 1400, "Ramène le ballon vers les fesses", "Repousse, hanches hautes"), p: [J => C([J.aR[0] + 12, -18], 18, "fr", 0)] });

/* ================= FESSIERS ================= */
def("hip-thrust", { k: [{ h: [8, -22], t: 235, n: 230, a: IJ("hp", [0, -3], "y-"), l: IK([44, -4], "y-", { f: 90 }) }, { h: [10, -50], t: 266, n: 258, a: IJ("hp", [0, -3], "y-"), l: IK([44, -4], "y-", { f: 90 }) }], s: rep(1000, 1300, "Pousse les hanches vers le plafond", "Redescends lentement", [500, 700, 500]), p: [pad([-92, -40], [-32, -40], 9), post([-80, -36], [-80, 0]), post([-44, -36], [-44, 0]), plate("hp", 17)] });
def("pont-fessier", { k: [FLOOR({ a: [86, 90, 90], l: IK([40, -4], "y-", { f: 90 }) }), { h: [0, -40], t: 300, n: 275, a: [86, 90, 90], l: IK([40, -4], "y-", { f: 90 }) }], s: rep(900, 1200, "Monte les hanches, serre les fessiers", "Redescends", [500, 700, 500]) });
def("pont-unilateral", { k: [FLOOR({ a: [86, 90, 90], l: [140, 140], l2: IK([40, -4], "y-", { f: 90 }) }), { h: [0, -40], t: 300, n: 275, a: [86, 90, 90], l: [118, 118], l2: IK([40, -4], "y-", { f: 90 }) }], s: rep(900, 1200, "Pousse dans le talon d’appui", "Redescends sans poser les fesses", [500, 700, 500]) });
def("kickback-poulie", { k: [{ h: [0, -88], t: 155, n: 160, a: IK([44, -122], "y+"), l: [6, 6], l2: IK([-2, -4], "x+") }, { h: [0, -88], t: 155, n: 160, a: IK([44, -122], "y+"), l: [-52, -48], l2: IK([-2, -4], "x+") }], s: rep(900, 1300, "Pousse la jambe vers l’arrière", "Reviens lentement"), p: [post([52, 0], [52, -150]), J => cab([48, -10], J.aR), hnd()] });
const seatF = (k1, k2) => ({ v: "front", k: [{ h: [0, -62], a: IJ("hip", [24, 6], "x+"), l: [k1, 2, null, .5, 1] }, { h: [0, -62], a: IJ("hip", [24, 6], "x+"), l: [k2, 2, null, .5, 1] }], p: FSEATP.concat(backrest, [J => [C(add(J.kR, 90, 8), 6, "pad", 2), C(add(J.kL, -90, 8), 6, "pad", 2)]]) });
def("abduction-machine", O(seatF(6, 56), { s: rep(900, 1300, "Écarte les jambes", "Reviens lentement") }));
def("adduction-machine", O(seatF(56, 6), { s: rep(900, 1300, "Rapproche les jambes en serrant", "Reviens lentement") }));
def("squat-sumo", { v: "front", k: [FST({ h: [0, -82], a: IJ("hip", [0, 28], "x+"), l: IK([40, -4], "x+") }), FST({ h: [0, -50], a: IJ("hip", [0, 28], "x+"), l: IK([40, -4], "x+") })], s: rep(1400, 1100, "Descends en écartant les genoux", "Remonte en serrant les fessiers"), p: [J => ({ k: "db", p: plus(mixP(J.gR, J.gL, .5), [0, 7]), a: 0, z: 2 })] });
def("donkey-kick", { k: [QUAD(), QUAD({ l: [-118, -208, -118] })], s: rep(900, 1200, "Pousse le pied vers le plafond", "Redescends sans poser le genou") });
def("fire-hydrant", { v: "front", bk: 1, hbk: 1, k: [{ h: [0, -56], tl: .3, a: null, l: [0, 0, null, 1, .22] }, { h: [0, -58], tl: .3, t: 184, n: 180, a: null, l: [78, 80, null, 1, .22], lL: [0, 0, null, 1, .22] }], s: rep(900, 1200, "Écarte le genou sur le côté", "Redescends lentement"), cap: "Vue de dos, à quatre pattes" });
def("marche-laterale", { v: "front", k: [FST({ h: [0, -70], a: [10, 14], l: IK([18, -4], "x+") }), FST({ h: [12, -70], a: [10, 14], l: IK([42, -4], "x+"), lL: IK([-18, -4], "x-") }), FST({ h: [24, -70], a: [10, 14], l: IK([42, -4], "x+"), lL: IK([6, -4], "x-") }), FST({ h: [36, -70], a: [10, 14], l: IK([66, -4], "x+"), lL: IK([6, -4], "x-") }), FST({ h: [48, -70], a: [10, 14], l: IK([66, -4], "x+"), lL: IK([30, -4], "x-") })], s: [[0, 0, 400], [1, 550, 100, "Pas chassé, reste bas"], [2, 550, 100], [3, 550, 100], [4, 550, 500]], p: [J => L(J.kR, J.kL, 2.6, "band", 2)] });
def("sdt-sumo", { v: "front", k: [{ h: [0, -56], tl: .55, n: 180, a: IK([14, -26], "x+"), l: IK([38, -4], "x+") }, { h: [0, -84], a: IK([14, -82], "x+"), l: IK([38, -4], "x+") }], s: rep(1400, 1500, "Pousse dans le sol, genoux écartés", "Redescends sous contrôle", [600, 400, 500]), p: [barF(34, 21)] });
def("clamshell", { v: "front", k: [{ h: [4, -16], t: 270, n: 272, a: [92, 92], aL: [-90, -88], l: IK([62, -22], "y-", { s1: .7, s2: .7 }), lL: IK([62, -8], "y-", { s1: .7, s2: .7 }) }, { h: [4, -16], t: 270, n: 272, a: [92, 92], aL: [-90, -88], l: IK([62, -22], "y-", { s1: 1, s2: 1 }), lL: IK([62, -8], "y-", { s1: .7, s2: .7 }) }], s: rep(800, 1100, "Ouvre le genou du dessus, pieds collés", "Referme lentement"), p: [J => L(J.kR, J.kL, 2.6, "band", 2)], cap: "Vue de face, allongé sur le côté" });
def("fentes-croisees", { v: "front", k: [FST({ a: [10, 14], l: IK([12, -4], "x+"), lL: IK([-12, -4], "x-") }), FST({ h: [-6, -58], a: [12, 16], l: IK([-34, -10], "x-", { f: -60 }), lL: IK([-10, -4], "x-") })], s: rep(1200, 1000, "Croise la jambe derrière, descends", "Reviens et alterne") });
def("pull-through", { k: [{ h: [-24, -84], t: 100, n: 108, a: IK([-12, -40], "x-"), l: FT }, ST({ a: IK([8, -78], "x-") })], s: rep(1100, 1300, "Pousse les hanches vers l’avant", "Fesses en arrière, dos plat", [600, 500, 400]), p: [post([-82, 0], [-82, -40]), J => cab([-78, -10], J.gR), hnd()] });

/* ================= MOLLETS ================= */
const calf = (T, f1, f2, x, eq) => { const A1 = add(T, f1, -11), A2 = add(T, f2, -11); return { k: [O({ h: [A1[0], A1[1] - 84], a: [3, 5], l: IK(A1, "x+", { f: f1 }) }, x), O({ h: [A2[0], A2[1] - 84], a: [3, 5], l: IK(A2, "x+", { f: f2 }) }, x)], s: rep(800, 1200, "Monte sur la pointe des pieds", "Redescends sous la marche", [500, 600, 500]), p: eq }; };
def("mollets-debout", calf([12, -14], 118, 52, {}, [RC([10, -6], 28, 12, 0, "fr"), J => [pad(add(J.sho, 90, -12), add(J.sho, 90, 14), 7), L(add(J.sho, 90, -12), [-40, 0], 4, "fr")]]));
def("mollets-unilateral", calf([12, -14], 118, 52, { l2: [-10, -80], a2: IK([58, -130], "y+") }, [RC([10, -6], 28, 12, 0, "fr"), RC([66, -90], 8, 180, 0, "fr")]));
def("mollets-assis", () => { const T = [44, -14], A1 = add(T, 115, -11), A2 = add(T, 55, -11); return { k: [{ h: [-10, -52], t: 182, a: IJ("kR", [-6, -8], "x-"), l: IK(A1, "y-", { f: 115 }) }, { h: [-10, -52], t: 182, a: IJ("kR", [-6, -8], "x-"), l: IK(A2, "y-", { f: 55 }) }], s: rep(800, 1200, "Monte les talons", "Redescends lentement", [500, 600, 500]), p: [pad([-30, -44], [10, -44], 8), post([-14, -40], [-14, 0]), RC([44, -6], 24, 12, 0, "fr"), J => RC(plus(J.kR, [0, -9]), 24, 7, 0, "pad")] }; });
def("mollets-presse", () => { const H = [0, -40], T = 228, A = add(H, 135, 82.5); const plat = J => { const c = add(J.tR, 135, 3); return pad(add(c, 45, 24), add(c, 225, 24), 7); };
  return { k: [{ h: H, t: T, n: 210, a: IJ("hip", [6, 8], "y+"), l: IK(A, "y-", { f: 225 }) }, { h: H, t: T, n: 210, a: IJ("hip", [6, 8], "y+"), l: IK(A, "y-", { f: 178 }) }], s: rep(800, 1200, "Pousse avec la pointe des pieds", "Reviens lentement", [500, 600, 500]),
    p: [pad(add(add(H, T, -4), T + 90, 13), add(add(H, T, 60), T + 90, 13), 9), pad([-6, -30], [22, -30], 8), post([8, -26], [8, 0]), L(add(add(H, 135, 30), 45, 18), add(add(H, 135, 110), 45, 18), 4, "fr"), post(add(add(H, 135, 70), 45, 18), [70, 0]), plat] }; });
def("releves-pointes", { k: [{ h: [-20, -84], t: 186, a: [3, 5], l: IK([12, -4], "x+", { f: 90 }) }, { h: [-20, -84], t: 186, a: [3, 5], l: IK([12, -4], "x+", { f: 132 }) }], s: rep(700, 1000, "Relève la pointe des pieds", "Redescends lentement", [500, 500, 500]), p: [RC([-36, -90], 8, 180, 0, "fr")] });

/* ================= FULL BODY ================= */
const BA = [-105, -12], BT = tFor(BA, -57), BH = [rootOf(BA, BT)[0], -4];
const BSQ = { h: [-18, -46], t: 118, n: 126, a: IK(BH, "x-", { w: 90 }), l: FT };
def("burpees", { k: [ST(), BSQ, PL(BA, BT, { a: IK(BH, "x-", { w: 90 }) }), { h: [0, -108], t: 178, a: [168, 172], l: IK([0, -22], "x+", { f: 40 }) }], s: [[0, 0, 350], [1, 600, 100, "Mains au sol"], [2, 400, 300, "Saute les pieds en arrière"], [1, 400, 100, "Ramène les pieds"], [3, 450, 150, "Saute, bras tendus"], [0, 500, 400]] });
def("burpee-sans-saut", { k: [ST(), BSQ, O(BSQ, { l: IK(BA, "y+", { f: -8 }), h: [-14, -50], t: 112 }), PL(BA, BT, { a: IK(BH, "x-", { w: 90 }) }), ST({ a: [172, 176] })], s: [[0, 0, 350], [1, 700, 100, "Mains au sol"], [2, 500, 100, "Recule un pied"], [3, 500, 400, "Puis l’autre : planche"], [2, 500, 100, "Ramène un pied"], [1, 500, 100, "Puis l’autre"], [4, 700, 300, "Relève-toi, bras tendus"], [0, 500, 400]] });
def("kettlebell-swing", { k: [{ h: [-28, -80], t: 112, n: 118, a: IK([-12, -48], "x-"), l: FT }, ST({ a: [96, 96, 96] })], s: [[0, 0, 400], [1, 550, 100, "Projette les hanches"], [0, 650, 100, "Laisse redescendre entre les jambes"], [1, 550, 100], [0, 650, 400]], p: [kb()] });
const RACK = IJ("rk", [4, -2], "y+", { w: 160 });
def("thruster", { k: [ST({ a: RACK }), { h: [-18, -50], t: 158, n: 164, a: RACK, l: FT }, ST({ a: IR([0, -53], "x+", { w: 180 }) })], s: [[0, 0, 400], [1, 1100, 150, "Descends en squat"], [2, 800, 300, "Remonte et pousse au-dessus de la tête"], [0, 900, 450, "Redescends aux épaules"]], p: dbs() });
def("clean-press", { k: [{ h: [-10, -86], t: 160, n: 166, a: [0, 0, 0], l: FT }, ST({ a: RACK }), ST({ a: IR([0, -53], "x+", { w: 180 }) })], s: [[0, 0, 450], [1, 450, 300, "Tire explosivement aux épaules"], [2, 800, 300, "Pousse au-dessus de la tête"], [1, 800, 200, "Redescends aux épaules"], [0, 700, 450, "Puis aux cuisses"]], p: dbs() });
def("turkish-getup", { k: [FLOOR({ a: [180, 180, 180], a2: [110, 100, 90], l: IK([34, -4], "y-", { f: 90 }), l2: [90, 90] }), { h: [0, -11], t: 205, n: 200, a: [180, 180, 180], a2: IK([-42, -6], "x-", { w: -90 }), l: IK([40, -4], "y-", { f: 90 }), l2: [90, 90] }, { h: [-4, -52], t: 182, a: [180, 180, 180], a2: [0, 0], l: IK([36, -4], "x+"), l2: [0, -90, -90] }, { h: [6, -88], t: 180, a: [180, 180, 180], a2: [3, 5], l: IK([6, -4], "x+"), l2: IK([2, -4], "x+") }],
  s: [[0, 0, 500], [1, 1200, 300, "Monte sur le coude puis la main"], [2, 1300, 300, "Passe la jambe dessous, à genoux"], [3, 1100, 600, "Relève-toi, regard sur la charge"], [2, 1100, 200], [1, 1200, 200], [0, 1100, 500, "Refais le chemin inverse"]], p: [kb("gR")] });
const WBT = [52, -240];
def("wall-ball", { k: [ST({ a: IJ("ch", [8, 0], "y+"), bf: 0 }), { h: [-20, -50], t: 150, n: 158, a: IJ("ch", [8, 0], "y+"), l: FT, bf: 0 }, ST({ a: [160, 160, 170], bf: 0 }), ST({ a: [160, 160, 170], bf: 1 })], s: [[0, 0, 400], [1, 900, 100, "Descends en squat"], [2, 450, 0, "Remonte et lance"], [3, 450, 200], [2, 450, 0, "Rattrape"], [0, 600, 400]], p: [RC([86, -120], 8, 240, 0, "fr"), C(WBT, 5, "acc", 0), (J, P) => C(mixP(J.gR, WBT, P.bf || 0), 10, "eq", 2)] });
def("box-jump", { k: [ST(), { h: [-18, -58], t: 135, n: 144, a: [-46, -40], l: FT }, { h: [30, -146], t: 170, a: [150, 152], l: IK([44, -78], "x+", { f: 70 }) }, { h: [42, -104], t: 140, n: 148, a: [70, 80], l: IK([56, -60], "x+") }, { h: [56, -144], t: 180, a: [3, 5], l: IK([56, -60], "x+") }, { h: [40, -128], t: 178, a: [3, 5], l: IK([18, -12], "x+", { f: 80 }), l2: IK([52, -60], "x+") }],
  s: [[0, 0, 350], [1, 600, 100, "Fléchis, bras en arrière"], [2, 350, 0, "Saute sur la box"], [3, 300, 200, "Réception en douceur"], [4, 500, 400, "Debout sur la box"], [5, 600, 100, "Redescends en marchant"], [0, 600, 400]], p: [RC([56, -28], 44, 56, 0, "fr")] });
const BEAR = x => O({ h: [-42, -58], t: 92, n: 100, a: IK([9, -4], "x-", { w: 90 }), l: IK([-66, -12], "x+", { f: -10 }) }, x);
def("bear-crawl", { k: [BEAR(), BEAR({ a: IK([26, -4], "x-", { w: 90 }), l2: IK([-52, -12], "x+", { f: -10 }) }), BEAR({ a2: IK([26, -4], "x-", { w: 90 }), l: IK([-52, -12], "x+", { f: -10 }) })], s: cyc([0, 1, 0, 2], 2, 380, "Avance main et pied opposés, genoux décollés") });
def("sled-push", { k: [{ h: [-10, -80], t: 132, n: 140, a: IK([46, -96], "y+"), l: IK([-44, -6], "x+", { f: 40 }), l2: IK([-6, -22], "x+") }, { h: [-10, -80], t: 132, n: 140, a: IK([46, -96], "y+"), l2: IK([-44, -6], "x+", { f: 40 }), l: IK([-6, -22], "x+") }], s: cyc([0, 1], 3, 420, "Pas courts et puissants, dos plat"), p: [RC([80, -24], 44, 32, 0, "eq"), post([52, -96], [66, -36], 4)] });
def("renegade-row", () => { const A = [-120, -12], t = tFor(A, -61), H = [rootOf(A, t)[0], -8], b = PL(A, t, { a: IK(H, "x-", { w: 90 }) }); return { k: [b, O(b, { a: IJ("hip", [10, -12], "y-") }), O(b, { a2: IJ("hip", [10, -12], "y-") })], s: [[0, 0, 400], [1, 800, 250, "Tire un haltère vers la hanche"], [0, 700, 150], [2, 800, 250, "Puis l’autre, bassin fixe"], [0, 700, 400]], p: dbs(7) }; });
def("slam-ball", { k: [ST({ a: [172, 172, 180] }), { h: [-22, -58], t: 120, n: 128, a: IK([28, -16], "x-", { w: 0 }), l: FT }], s: [[0, 0, 400], [1, 500, 350, "Lance violemment au sol"], [0, 1000, 450, "Ramasse et remonte"]], p: [J => C(plus(J.gR, [0, J.gR[1] > -30 ? 0 : -2]), 11, "eq", 2)] });

/* ================= CARDIO ================= */
const BELT = [pad([-64, -8], [72, -8], 9), post([72, -8], [80, -116], 4), post([80, -116], [52, -122], 4)];
const run = (hy, ay) => [
  { h: [0, hy], t: 172, n: 176, a: [-38, 50], a2: [40, 150], l: IK([12, ay], "x+"), l2: IK([-40, ay - 24], "x+", { f: 20 }) },
  { h: [0, hy - 4], t: 172, n: 176, a: [0, 100], a2: [0, 100], l: IK([-34, ay - 6], "x+", { f: 30 }), l2: IK([8, ay - 34], "x+") },
  { h: [0, hy], t: 172, n: 176, a2: [-38, 50], a: [40, 150], l2: IK([12, ay], "x+"), l: IK([-40, ay - 24], "x+", { f: 20 }) },
  { h: [0, hy - 4], t: 172, n: 176, a: [0, 100], a2: [0, 100], l2: IK([-34, ay - 6], "x+", { f: 30 }), l: IK([8, ay - 34], "x+") }];
def("tapis-course", { k: run(-98, -16), s: cyc([0, 1, 2, 3], 2, 260, "Foulée courte et légère", 1), p: BELT });
def("marche-inclinee", { k: walk({ t: 174, h: [0, -96] }, [10, 30]).map((p, i) => O(p, { h: [0, -96 + (i % 2 ? -2 : 0)], a: i % 2 ? [3, 20] : [i === 0 ? -16 : 16, 20], a2: i % 2 ? [3, 20] : [i === 0 ? 16 : -16, 20], l: IK(plus(p.l.k, [0, -10 - p.l.k[0] * .14]), "x+", { f: (p.l.f || 90) - 8 }), l2: IK(plus(p.l2.k, [0, -10 - p.l2.k[0] * .14]), "x+", { f: (p.l2.f || 90) - 8 }) })), s: cyc([0, 1, 2, 3], 2, 480, "Buste droit, sans te tenir", 1), p: [pad([-64, 0], [74, -20], 9), post([74, -20], [82, -120], 4), post([82, -120], [56, -126], 4)] });
const CR = [26, -32], crank = (ph) => [CR[0] + 15 * Math.sin(ph / D), CR[1] + 15 * Math.cos(ph / D) - 3];
const bike = (ph, x) => O({ h: [-8, -96], t: 140, n: 150, a: IK([60, -122], "y+"), l: IK(crank(ph), "x+", { f: 100 }), l2: IK(crank(ph + 180), "x+", { f: 100 }) }, x);
const BIKE = [RC([-8, -86], 22, 6, 0, "eq"), L([-8, -84], CR, 5, "fr"), L(CR, [56, -112], 5, "fr"), L([56, -112], [62, -126], 4, "eq"), C([70, -34], 20, "fr"), L(CR, [-30, 0], 5, "fr"), L([70, -34], [70, 0], 5, "fr"), { k: "c", p: CR, r: 15, s: 1.5, c: "fr" }];
def("velo", { k: [0, 45, 90, 135, 180, 225, 270, 315].map(ph => bike(ph)), s: cyc([0, 1, 2, 3, 4, 5, 6, 7], 2, 170, "Pédale à rythme régulier", 1), p: BIKE });
def("assault-bike", { k: [0, 45, 90, 135, 180, 225, 270, 315].map(ph => bike(ph, { a: IK([60 + 14 * Math.cos(ph / D), -118], "y+"), a2: IK([60 - 14 * Math.cos(ph / D), -118], "y+") })), s: cyc([0, 1, 2, 3, 4, 5, 6, 7], 2, 170, "Pousse et tire avec bras et jambes", 1), p: BIKE.slice(0, 7).concat([J => [L([66, -60], J.gR, 4, "fr"), L([66, -60], J.gL, 4, "var(--an-f)")]]) });
const RFT = [62, -18];
const row = (hx, t, a) => ({ h: [hx, -30], t, n: t - 4, a, l: IK(RFT, "y-", { f: 150 }) });
def("rameur", { k: [row(16, 150, IR([50, 8], "y+")), row(-20, 176, IR([52, 4], "y+")), row(-22, 200, IJ("bl", [4, -8], "y+")), row(-12, 160, IR([52, 6], "y+"))], s: [[0, 0, 400], [1, 600, 0, "Pousse avec les jambes"], [2, 400, 150, "Bascule et tire"], [3, 450, 0, "Reviens : bras, buste, jambes"], [0, 550, 200], [1, 600, 0], [2, 400, 150], [3, 450, 0], [0, 550, 400]], p: [L([-70, -14], [84, -14], 5, "fr"), J => RC([J.hip[0], -20], 24, 7, 0, "eq"), RC([92, -28], 26, 34, 0, "fr"), RC([66, -20], 8, 20, -30, "eq"), J => cab([84, -32], J.gR)] });
const ell = (ph) => ({ h: [0, -110], t: 176, a: IK([34 + 12 * Math.cos(ph / D), -126], "y+"), a2: IK([34 - 12 * Math.cos(ph / D), -126], "y+"), l: IK([8 + 22 * Math.cos(ph / D), -30 + 8 * Math.sin(ph / D)], "x+", { f: 92 }), l2: IK([8 - 22 * Math.cos(ph / D), -30 - 8 * Math.sin(ph / D)], "x+", { f: 92 }) });
def("elliptique", { k: [0, 45, 90, 135, 180, 225, 270, 315].map(ell), s: cyc([0, 1, 2, 3, 4, 5, 6, 7], 2, 190, "Pousse et tire avec les bras", 1), p: [L([-30, -8], [70, -8], 6, "fr"), post([70, -8], [70, -60], 5), J => [L([70, -56], J.gL, 4, "var(--an-f)"), L([70, -56], J.gR, 4, "fr")]] });
def("stairmaster", { k: [{ h: [0, -100], t: 172, a: IK([34, -116], "y+"), l: IK([22, -42], "x+"), l2: IK([-4, -14], "x+") }, { h: [6, -104], t: 172, a: IK([34, -116], "y+"), l2: IK([22, -42], "x+"), l: IK([-4, -14], "x+") }], s: cyc([0, 1], 3, 520, "Pose tout le pied sur chaque marche"), p: [RC([-4, -6], 36, 12, 0, "fr"), RC([24, -20], 36, 40, 0, "fr"), post([40, -40], [44, -120], 4)] });
const ROPE = (P, J) => { const y = -264 + 356 * (P.rp || 0); return { k: "path", q: 1, pts: [J.gL, [0, y], J.gR], w: 2, c: "eq", z: (P.rp || 0) > .5 ? 2 : 0 }; };
def("corde-sauter", { v: "front", k: [FST({ a: IK([30, -84], "x+"), l: IK([7, -4], "x+"), rp: 0 }), FST({ h: [0, -92], a: IK([30, -88], "x+"), l: IK([7, -8], "x+", { f: 30 }), rp: .5 }), FST({ h: [0, -96], a: IK([30, -90], "x+"), l: IK([7, -12], "x+", { f: 20 }), rp: 1 })], s: cyc([0, 1, 2, 1], 3, 200, "Petits sauts, la corde tourne avec les poignets", 1), p: [(J, P) => ROPE(P, J)] });
def("jumping-jacks", { v: "front", k: [FST({ a: [8, 12], l: IK([8, -4], "x+") }), FST({ h: [0, -86], a: [164, 170], l: IK([40, -6], "x+") })], s: cyc([0, 1], 2, 420, "Écarte bras et jambes en sautant") });
def("step-jack", { v: "front", k: [FST({ a: [8, 12], l: IK([10, -4], "x+") }), FST({ h: [10, -86], a: [164, 170], l: IK([44, -4], "x+"), lL: IK([-10, -4], "x-") }), FST({ h: [-10, -86], a: [164, 170], l: IK([10, -4], "x+"), lL: IK([-44, -4], "x-") })], s: [[0, 0, 350], [1, 450, 100, "Une jambe sur le côté, bras en haut"], [0, 450, 100], [2, 450, 100, "Puis l’autre"], [0, 450, 100], [1, 450, 100], [0, 450, 100], [2, 450, 100], [0, 450, 400]] });
const knees = (hi, arm) => [{ h: [0, -90], t: 178, a: arm ? [180, 180, 180] : [-34, 40], a2: arm ? [3, 5] : [50, 150], l: hi, l2: IK([0, -8], "x+", { f: 50 }) }, { h: [0, -90], t: 178, a2: arm ? [180, 180, 180] : [-34, 40], a: arm ? [3, 5] : [50, 150], l2: hi, l: IK([0, -8], "x+", { f: 50 }) }];
def("montees-genoux", { k: knees([96, 0]), s: cyc([0, 1], 3, 300, "Genoux à hauteur de hanches") });
def("marche-genoux", { k: knees([96, 0], 1).map(p => O(p, { l: p.l.k ? IK([0, -4], "x+") : p.l, l2: p.l2.k ? IK([0, -4], "x+") : p.l2 })), s: cyc([0, 1], 2, 650, "Monte un genou, lève le bras opposé") });
def("talons-fesses", { k: knees([-6, -162, -100]), s: cyc([0, 1], 3, 300, "Ramène les talons vers les fesses") });
const WAVE = (side, ph) => (J, P) => { const g = J["g" + side], an = [140, -6], pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, p = mixP(g, an, u); pts.push([p[0], p[1] + 9 * (1 - u) * Math.sin(u * 12 - (P.ph || 0) + ph)]); } return { k: "path", pts, w: 3, c: side === "R" ? "eq" : "var(--an-eqf)", z: side === "R" ? 2 : 0 }; };
def("battle-ropes", { k: [{ h: [-14, -68], t: 164, n: 170, a: [56, 96], a2: [26, 66], l: FT, ph: 0 }, { h: [-14, -68], t: 164, n: 170, a2: [56, 96], a: [26, 66], l: FT, ph: 3.14 }], s: cyc([0, 1], 4, 330, "Vagues en alternant les bras", 0), p: [C([140, -6], 4, "fr"), WAVE("L", 1.5), WAVE("R", 0)] });
const GUARD = IJ("fc", [4, 10], "y+");
const box = (a, a2) => ({ h: [0, -86], t: 176, n: 172, a, a2, l: IK([22, -4], "x+"), l2: IK([-22, -6], "x+", { f: 70 }) });
def("shadow-boxing", { k: [box(GUARD, IJ("fc", [0, 12], "y+")), box(IR([54, -4], "y+", { w: 90 }), IJ("fc", [0, 12], "y+")), box(GUARD, IR([54, -2], "y+", { w: 90 }))], s: [[0, 0, 400], [1, 250, 200, "Direct"], [0, 300, 200], [2, 250, 200, "Puis l’autre poing"], [0, 300, 200], [1, 250, 200], [0, 300, 400, "Ramène les poings au visage"]] });
def("skater-jumps", { v: "front", k: [FST({ h: [30, -72], t: 170, a: [-40, -20], aL: [-60, -40], l: IK([36, -4], "x+"), lL: IK([12, -16], "x+") }), FST({ h: [0, -100], a: [20, 30], l: IK([12, -22], "x+"), lL: IK([-12, -22], "x-") }), FST({ h: [-30, -72], t: 190, a: [60, 40], aL: [40, 20], lL: IK([-36, -4], "x-"), l: IK([-12, -16], "x-") })], s: [[0, 0, 300], [1, 300, 0, "Saute sur le côté"], [2, 300, 300, "Réception sur une jambe"], [1, 300, 0], [0, 300, 300], [1, 300, 0], [2, 300, 300], [1, 300, 0], [0, 300, 400]] });

/* ================= MOBILITÉ ================= */
def("etirement-ischios", { k: [{ h: [0, -11], t: 180, a: [6, 30], l: [90, 90], l2: IK([28, -4], "y-", { f: 90 }) }, { h: [0, -11], t: 124, t2: 112, n: 112, a: [82, 84], l: [90, 90], l2: IK([28, -4], "y-", { f: 90 }) }], s: hold(1300, 2800, "Penche le buste, dos droit", "Relâche") });
def("etirement-quadriceps", { k: [ST({ a2: IK([48, -134], "y+"), l: FT, l2: FT }), ST({ a: IJ("aR", [-2, -2], "x-"), a2: IK([48, -134], "y+"), l: [-6, -168, -100], l2: FT })], s: hold(1100, 2800, "Talon vers la fesse, genoux serrés", "Relâche"), p: [RC([58, -110], 8, 220, 0, "fr")] });
def("etirement-pectoraux", { v: "top", k: [{ c: TOPC, fr: 180, a: IK([44, -66], "y-", { s2: .2 }), aL: [-95, -95, null, .2, .2] }, { c: TOPC, fr: 150, a: IK([44, -66], "y-", { s2: .2 }), aL: [-95, -95, null, .2, .2] }], s: hold(1200, 2800, "Tourne doucement le buste à l’opposé", "Relâche"), p: [L([48, -140], [48, 10], 6, "fr")], cap: "Vue de dessus, avant-bras au mur" });
def("posture-enfant", () => { const K = [10, -6]; return { k: [{ h: add(K, 180, F.th), t: 180, a: [3, 5], l: [0, -90, -90] }, { h: add(K, 252, F.th), t: 80, n: 66, a: IK([82, -5], "y-", { w: 90 }), l: [72, -90, -90] }], s: hold(1500, 2800, "Assieds-toi sur les talons, bras devant", "Reviens doucement") }; });
def("chat-vache", { k: [QUAD(), QUAD({ t: 78, t2: 106, n: 140 }), QUAD({ t: 104, t2: 72, n: 40 })], s: [[0, 0, 400], [1, 1200, 400, "Inspire : creuse le dos"], [2, 1700, 400, "Expire : arrondis le dos"], [1, 1700, 400, "Inspire"], [0, 1200, 400]] });
def("pigeon", { k: [QUAD(), { h: [-14, -24], t: 72, n: 76, a: IK([84, -5], "y-", { w: 90 }), l: [62, -70, -90, 1, .35], l2: [-80, -92, -92] }], s: hold(1700, 2800, "Genou avant vers la main, descends le buste", "Reviens") });
def("fente-psoas", { k: [{ h: [0, -52], t: 180, a: IJ("kR", [0, -8], "x-"), l: IK([40, -4], "x+"), l2: [-24, -90, -90] }, { h: [14, -46], t: 184, n: 180, a: IJ("kR", [0, -8], "x-"), l: IK([40, -4], "x+"), l2: [-42, -76, -90] }], s: hold(1200, 2800, "Avance le bassin, serre le fessier arrière", "Relâche") });
def("rotation-thoracique", { v: "end", k: [{ c: [0, -22], fr: 90, a: IK([58, -5], "y-"), aL: [98, 92] }, { c: [0, -22], fr: 150, a: IK([58, -5], "y-"), aL: [258, 264] }], s: rep(1700, 1500, "Ouvre le bras en suivant la main des yeux", "Reviens lentement", [500, 700, 500]), cap: "Vue depuis la tête, allongé sur le côté" });
const circ = ph => FST({ a: IK([66 + 4 * Math.sin(ph / D), -132 - 10 * Math.cos(ph / D)], "x+") });
def("cercles-bras", { k: [0, 90, 180, 270].map(circ), s: cyc([0, 1, 2, 3], 3, 260, "Fais des cercles avec les bras tendus", 1), v: "front" });
def("etirement-triceps", { v: "front", k: [FST({ a: [6, 10], aL: [-6, -10] }), FST({ a: [166, 340, 340], aL: IJ("eR", [-2, 2], "x-") })], s: hold(1200, 2800, "Pousse doucement le coude", "Relâche") });
def("etirement-mollets", { k: [ST({ h: [6, -88], t: 166, a: IK([66, -130], "y+"), l: IK([6, -4], "x+"), l2: IK([10, -4], "x+") }), { h: [-6, -84], t: 156, n: 160, a: IK([66, -130], "y+"), l: IK([-44, -4], "x+", { f: 90 }), l2: IK([14, -4], "x+") }], s: hold(1100, 2800, "Jambe arrière tendue, talon au sol", "Relâche"), p: [RC([74, -110], 8, 220, 0, "fr")] });
def("world-greatest", { k: [ST(), { h: [8, -48], t: 118, n: 126, a: IK([46, -4], "x-", { w: 90 }), l: IK([52, -4], "x+"), l2: IK([-64, -9], "x+", { f: 28 }) }, { h: [6, -44], t: 104, n: 112, a: IK([42, -12], "y+", { w: 60 }), a2: IK([48, -4], "x-", { w: 90 }), l: IK([52, -4], "x+"), l2: IK([-64, -9], "x+", { f: 28 }) }, { h: [6, -46], t: 112, n: 150, a: [180, 180, 180], a2: IK([48, -4], "x-", { w: 90 }), l: IK([52, -4], "x+"), l2: IK([-64, -9], "x+", { f: 28 }) }],
  s: [[0, 0, 400], [1, 1000, 200, "Fente, mains au sol"], [2, 900, 500, "Coude vers la cheville"], [3, 1000, 900, "Ouvre le bras vers le plafond"], [1, 900, 200], [0, 1000, 400]] });
def("squat-profond", { k: [ST({ a: IJ("ch", [10, 8], "y+") }), { h: [-14, -28], t: 162, n: 166, a: IJ("ch", [10, 8], "y+"), l: FT }], s: hold(1500, 2800, "Descends le plus bas possible, talons au sol", "Remonte") });
def("papillon", { v: "front", k: [{ h: [0, -12], a: IK([6, -10], "x+"), l: [70, -62, null, .9, .9] }, { h: [0, -12], tl: .86, a: IK([6, -10], "x+"), l: [82, -70, null, .9, .9] }], s: [[0, 0, 400], [1, 1300, 600, "Penche le buste, genoux vers le sol"], [0, 700, 100], [1, 700, 600], [0, 900, 400]], cap: "Vue de face, assis" });
def("cobra", { k: [{ h: [0, -11], t: 90, n: 92, a: IK([44, -4], "x-", { w: 90 }), l: [-90, -90, -90] }, { h: [0, -12], t: 92, t2: 150, n: 166, a: IK([44, -4], "x-", { w: 90 }), l: [-90, -90, -90] }], s: hold(1300, 2600, "Pousse doucement, hanches au sol", "Redescends") });
def("dislocations-epaules", { k: [ST({ a: [28, 28, 28] }), ST({ a: [180, 180, 180] }), ST({ a: [332, 332, 332] })], s: [[0, 0, 400], [1, 900, 0, "Passe au-dessus de la tête"], [2, 900, 300, "Jusque derrière toi"], [1, 900, 0, "Reviens"], [0, 900, 400]], p: [C("gR", 3.5, "eq", 2)] });
def("foam-roller", { k: [{ h: [-14, -24], t: 205, n: 195, a: IK([-46, -4], "x-", { w: -90 }), l: [93, 92] }, { h: [16, -24], t: 205, n: 195, a: IK([-46, -4], "x-", { w: -90 }), l: [93, 92] }], s: cyc([0, 1], 2, 1300, "Roule lentement d’avant en arrière"), p: [C([30, -9], 9, "fr", 2)] });
def("etirement-trapezes", { v: "front", k: [FST({ a: [6, 10] }), FST({ n: 152, a: IJ("head", [-4, -8], "x+"), aL: [-4, -6], sh: -2 })], s: hold(1300, 2800, "Penche la tête, épaule opposée basse", "Relâche") });

})();

