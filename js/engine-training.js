/* ===== Fonte · moteur « entraînement » : séances types, prescriptions, programmes, planning, progression des charges, superséries, paliers =====
   Fonctions pures (sans DOM ni état de l’appli) : vérifiées par tests/run.js.
   Fichiers chargés dans l’ordre par de simples <script src> (index.html), sans outil de construction :
   engine-pedago.js → engine-training.js → engine-analytics.js → engine-user.js → app.js.
   Les déclarations de haut niveau sont partagées entre ces fichiers (comme lorsqu’ils formaient un seul index.html) :
   un fichier peut utiliser ce qu’un fichier précédent déclare. tools/assemble.js les recolle en un seul fichier (mode « artifact Claude »). */

/* ===== Séances types =====
   rôles : C polyarticulaire, I isolation, G gainage/abdos, K cardio continu, F fractionné, M mobilité, E échauffement */
const TPL_CATS = [
  ["haut", "Haut du corps"], ["bas", "Bas du corps"], ["full", "Full body"], ["split", "Programmes"],
  ["cardio", "Cardio & HIIT"], ["core", "Abdos"], ["mob", "Mobilité"]
];
const TPL = [
  { id: "dos", n: "Dos complet", cat: "haut", kind: "muscu", mode: "series",
    desc: "Largeur et épaisseur : tractions, rowing et tirages pour un dos en V et une meilleure posture.",
    items: [["tractions", "C"], ["rowing-barre", "C"], ["tirage-vertical", "C"], ["rowing-haltere", "I"], ["pull-over-poulie", "I"], ["extension-lombaire", "I"]] },
  { id: "dos-v", n: "Dos en V", cat: "haut", kind: "muscu", mode: "series",
    desc: "Priorité à la largeur du dos avec des mouvements de tirage vertical.",
    items: [["tractions-supination", "C"], ["tirage-vertical", "C"], ["tirage-serre", "C"], ["pull-over-poulie", "I"], ["rowing-machine", "I"], ["face-pull", "I"]] },
  { id: "bras", n: "Bras complets", cat: "haut", kind: "muscu", mode: "series",
    desc: "Biceps et triceps en alternance, avec un mouvement lourd pour démarrer.",
    items: [["dc-serre", "C"], ["curl-ez", "I"], ["extension-corde", "I"], ["curl-incline", "I"], ["extension-nuque", "I"], ["curl-marteau", "I"]] },
  { id: "pecs", n: "Pectoraux", cat: "haut", kind: "muscu", mode: "series",
    desc: "Haut, milieu et bas des pectoraux, avec une finition au poids du corps.",
    items: [["dc-barre", "C"], ["di-halteres", "C"], ["vis-a-vis", "I"], ["dips-pecs", "C"], ["pec-deck", "I"], ["pompes", "I"]] },
  { id: "epaules", n: "Épaules 3D", cat: "haut", kind: "muscu", mode: "series",
    desc: "Les trois faisceaux du deltoïde plus les trapèzes, pour des épaules larges et solides.",
    items: [["dm-halteres", "C"], ["elevations-laterales", "I"], ["oiseau", "I"], ["arnold", "C"], ["face-pull", "I"], ["shrug-halteres", "I"]] },
  { id: "haut", n: "Haut du corps", cat: "haut", kind: "muscu", mode: "series",
    desc: "Poussées et tirages en équilibre : pectoraux, dos, épaules et bras dans la même séance.",
    items: [["dc-halteres", "C"], ["rowing-haltere", "C"], ["dm-halteres", "C"], ["tirage-vertical", "C"], ["curl-halteres", "I"], ["extension-corde", "I"]] },
  { id: "jambes", n: "Jambes complètes", cat: "bas", kind: "muscu", mode: "series",
    desc: "Quadriceps, ischios, fessiers et mollets : la séance jambes classique.",
    items: [["squat-barre", "C"], ["presse-cuisses", "C"], ["sdt-roumain", "C"], ["fentes-arriere", "I"], ["leg-curl-assis", "I"], ["leg-extension", "I"], ["mollets-debout", "I"]] },
  { id: "fessiers", n: "Fessiers & ischios", cat: "bas", kind: "muscu", mode: "series",
    desc: "Priorité à l’arrière des jambes et aux fessiers, avec le hip thrust en exercice phare.",
    items: [["hip-thrust", "C"], ["sdt-roumain-halteres", "C"], ["squat-bulgare", "C"], ["kickback-poulie", "I"], ["abduction-machine", "I"], ["leg-curl-allonge", "I"]] },
  { id: "bas", n: "Bas du corps", cat: "bas", kind: "muscu", mode: "series",
    desc: "Séance jambes équilibrée entre l’avant et l’arrière de la cuisse.",
    items: [["goblet-squat", "C"], ["sdt-roumain", "C"], ["fentes-marchees", "C"], ["hip-thrust", "I"], ["leg-curl-allonge", "I"], ["mollets-assis", "I"]] },
  { id: "fb-machines", n: "Full body découverte", cat: "full", kind: "muscu", mode: "series",
    desc: "Tout le corps sur machines guidées : la meilleure façon de commencer à la salle.",
    items: [["presse-cuisses", "C"], ["presse-pecs", "C"], ["tirage-vertical", "C"], ["presse-epaules", "C"], ["leg-curl-assis", "I"], ["planche", "G"]] },
  { id: "fb-halteres", n: "Full body haltères", cat: "full", kind: "muscu", mode: "series",
    desc: "Une paire d’haltères et un banc suffisent pour travailler tout le corps.",
    items: [["goblet-squat", "C"], ["dc-halteres", "C"], ["rowing-haltere", "C"], ["sdt-roumain-halteres", "C"], ["dm-halteres", "C"], ["planche", "G"]] },
  { id: "fb-barre", n: "Full body barre", cat: "full", kind: "muscu", mode: "series",
    desc: "Les grands mouvements à la barre pour gagner en force sur tout le corps.",
    items: [["squat-barre", "C"], ["dc-barre", "C"], ["rowing-barre", "C"], ["dm-barre", "C"], ["hip-thrust", "I"], ["releve-genoux-chaise", "G"]] },
  { id: "fb-maison", n: "Full body sans matériel", cat: "full", kind: "muscu", mode: "circuit",
    desc: "Circuit au poids du corps, à faire à la maison ou dans un coin de la salle.",
    circuit: { timed: false },
    items: [["squat-pdc", "W"], ["pompes", "W"], ["fentes-arriere", "W"], ["superman", "W"], ["pont-fessier", "W"], ["planche", "W"]] },
  { id: "push", n: "Push", cat: "split", kind: "muscu", mode: "series",
    desc: "Tous les muscles de poussée : pectoraux, épaules et triceps.",
    items: [["dc-barre", "C"], ["dm-halteres", "C"], ["di-halteres", "C"], ["elevations-laterales", "I"], ["extension-corde", "I"], ["extension-nuque", "I"]] },
  { id: "pull", n: "Pull", cat: "split", kind: "muscu", mode: "series",
    desc: "Tous les muscles de tirage : dos, arrière des épaules et biceps.",
    items: [["tractions", "C"], ["rowing-barre", "C"], ["tirage-horizontal", "C"], ["face-pull", "I"], ["curl-ez", "I"], ["curl-marteau", "I"]] },
  { id: "legs", n: "Legs", cat: "split", kind: "muscu", mode: "series",
    desc: "La séance jambes du programme Push / Pull / Legs.",
    items: [["squat-barre", "C"], ["sdt-roumain", "C"], ["presse-cuisses", "C"], ["leg-curl-allonge", "I"], ["leg-extension", "I"], ["mollets-debout", "I"], ["releve-genoux-chaise", "G"]] },
  /* Variantes : mêmes muscles, autres exercices, pour ne jamais refaire la même séance dans la semaine (voir PROG_ALT) */
  { id: "push-b", n: "Push B", cat: "split", kind: "muscu", mode: "series",
    desc: "Variante de la séance Push : pectoraux, épaules et triceps avec d’autres exercices.",
    items: [["di-barre", "C"], ["presse-epaules", "C"], ["dc-halteres", "C"], ["ecarte-incline", "I"], ["elev-lat-poulie", "I"], ["extension-barre-poulie", "I"]] },
  { id: "pull-b", n: "Pull B", cat: "split", kind: "muscu", mode: "series",
    desc: "Variante de la séance Pull : dos, arrière des épaules et biceps avec d’autres exercices.",
    items: [["tirage-vertical", "C"], ["rowing-haltere", "C"], ["rowing-machine", "C"], ["reverse-pec-deck", "I"], ["curl-incline", "I"], ["curl-poulie", "I"]] },
  { id: "legs-b", n: "Legs B", cat: "split", kind: "muscu", mode: "series",
    desc: "Variante de la séance Legs : priorité aux fessiers et au travail sur une jambe.",
    items: [["hack-squat", "C"], ["hip-thrust", "C"], ["squat-bulgare", "C"], ["leg-curl-assis", "I"], ["leg-extension", "I"], ["mollets-assis", "I"], ["planche", "G"]] },
  { id: "haut-b", n: "Haut du corps B", cat: "haut", kind: "muscu", mode: "series",
    desc: "Variante du haut du corps : d’autres angles pour les pectoraux, le dos et les épaules.",
    items: [["di-halteres", "C"], ["tirage-horizontal", "C"], ["arnold", "C"], ["tirage-serre", "C"], ["curl-marteau", "I"], ["extension-nuque", "I"]] },
  { id: "bas-b", n: "Bas du corps B", cat: "bas", kind: "muscu", mode: "series",
    desc: "Variante du bas du corps : presse, fentes et travail des ischios.",
    items: [["presse-cuisses", "C"], ["sdt-roumain-halteres", "C"], ["fentes-arriere", "C"], ["leg-curl-assis", "I"], ["leg-extension", "I"], ["mollets-debout", "I"]] },
  { id: "fb-guide", n: "Full body guidé", cat: "full", kind: "muscu", mode: "series",
    desc: "Tout le corps sur machines guidées et poulies, avec d’autres exercices que la séance découverte.",
    items: [["squat-smith", "C"], ["smith-incline", "C"], ["tirage-horizontal", "C"], ["leg-curl-allonge", "I"], ["elevations-laterales", "I"], ["dead-bug", "G"]] },
  { id: "fb-barre-b", n: "Full body barre B", cat: "full", kind: "muscu", mode: "series",
    desc: "Variante force : soulevé de terre, développé incliné et fentes.",
    items: [["souleve-terre", "C"], ["di-barre", "C"], ["tirage-vertical", "C"], ["fentes-marchees", "C"], ["dips-assiste", "I"], ["planche", "G"]] },
  { id: "fb-maison-b", n: "Renfo maison", cat: "full", kind: "muscu", mode: "circuit",
    desc: "Deuxième circuit au poids du corps : fentes latérales, gainage et fessiers.",
    circuit: { timed: false },
    items: [["fentes-laterales", "W"], ["pompes-inclinees", "W"], ["fire-hydrant", "W"], ["bird-dog", "W"], ["chaise", "W"], ["dead-bug", "W"]] },
  { id: "cardio-mix", n: "Cardio varié", cat: "cardio", kind: "cardio", mode: "series",
    desc: "Trois machines différentes en zone 2 pour ne pas s’ennuyer.",
    items: [["elliptique", "K", { min: 5 }], ["tapis-course", "K", { f: 0.5 }], ["velo", "K", { f: 0.5 }], ["etirement-ischios", "M"], ["etirement-fessiers", "M"]] },
  { id: "hiit-boxe", n: "HIIT cardio-boxe", cat: "cardio", kind: "hiit", mode: "circuit",
    desc: "Circuit intense façon boxe, sans matériel.",
    circuit: { timed: true },
    items: [["shadow-boxing", "W"], ["skater-jumps", "W"], ["burpee-sans-saut", "W"], ["jumping-jacks", "W"], ["bear-crawl", "W"], ["mountain-climbers", "W"]] },
  /* ---- Force : une séance par grand mouvement (A et B : même mouvement principal, autres exercices d’appoint) ---- */
  { id: "force-squat", n: "Force : squat", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Le squat lourd en exercice principal, puis ce qui le renforce : presse, fentes, ischios et gainage.",
    items: [["squat-barre", "C"], ["presse-cuisses", "I"], ["fentes-marchees", "I"], ["leg-curl-assis", "I"], ["planche", "G"]] },
  { id: "force-squat-b", n: "Force : squat B", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Squat lourd, puis travail sur une jambe et gainage profond.",
    items: [["squat-barre", "C"], ["squat-bulgare", "I"], ["leg-extension", "I"], ["mollets-debout", "I"], ["dead-bug", "G"]] },
  { id: "force-dc", n: "Force : développé couché", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Le développé couché lourd, équilibré par un tirage lourd, puis triceps et arrière des épaules.",
    items: [["dc-barre", "C"], ["rowing-barre", "C"], ["di-halteres", "I"], ["dips-assiste", "I"], ["face-pull", "I"]] },
  { id: "force-dc-b", n: "Force : développé couché B", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Développé couché lourd, rowing, développé prise serrée pour les triceps.",
    items: [["dc-barre", "C"], ["rowing-haltere", "C"], ["dc-serre", "I"], ["ecarte-halteres", "I"], ["extension-nuque", "I"]] },
  { id: "force-sdt", n: "Force : soulevé de terre", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Le soulevé de terre en exercice principal, puis fessiers, dos et lombaires.",
    items: [["souleve-terre", "C"], ["tirage-vertical", "C"], ["hip-thrust", "I"], ["extension-lombaire", "I"], ["releve-genoux-chaise", "G"]] },
  { id: "force-sdt-b", n: "Force : soulevé de terre B", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Soulevé de terre lourd, tirage serré, travail de la chaîne arrière.",
    items: [["souleve-terre", "C"], ["tirage-serre", "C"], ["pull-through", "I"], ["leg-curl-allonge", "I"], ["crunch-inverse", "G"]] },
  { id: "force-dm", n: "Force : développé militaire", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Le développé militaire debout, les tractions, puis épaules et bras.",
    items: [["dm-barre", "C"], ["tractions", "C"], ["dc-halteres", "I"], ["elevations-laterales", "I"], ["curl-ez", "I"], ["planche-laterale", "G"]] },
  { id: "force-dm-b", n: "Force : développé militaire B", cat: "split", kind: "muscu", mode: "series", obj: "force",
    desc: "Développé militaire lourd, tirage vertical, puis arrière des épaules et biceps.",
    items: [["dm-barre", "C"], ["tirage-vertical", "C"], ["di-halteres", "I"], ["oiseau", "I"], ["curl-marteau", "I"]] },
  /* ---- Perte de poids : circuits « brûle-graisses » avec charges ---- */
  { id: "metab-haut", n: "Brûle-graisses haut du corps", cat: "cardio", kind: "hiit", mode: "circuit", obj: "perte",
    desc: "Circuit avec haltères pour le haut du corps : on enchaîne, le cœur reste haut, on brûle plus.",
    circuit: { timed: false },
    items: [["dc-halteres", "W"], ["rowing-haltere", "W"], ["dm-halteres", "W"], ["mountain-climbers", "W"], ["kickback", "W"], ["planche", "W"]] },
  { id: "metab-haut-b", n: "Brûle-graisses haut du corps B", cat: "cardio", kind: "hiit", mode: "circuit", obj: "perte",
    desc: "Deuxième circuit haut du corps : pompes, tirages et épaules.",
    circuit: { timed: false },
    items: [["pompes-inclinees", "W"], ["tirage-vertical", "W"], ["elevations-laterales", "W"], ["jumping-jacks", "W"], ["curl-halteres", "W"], ["shoulder-taps", "W"]] },
  { id: "metab-bas", n: "Brûle-graisses bas du corps", cat: "cardio", kind: "hiit", mode: "circuit", obj: "perte",
    desc: "Circuit jambes et fessiers : les plus gros muscles du corps, ceux qui dépensent le plus.",
    circuit: { timed: false },
    items: [["goblet-squat", "W"], ["fentes-arriere", "W"], ["kettlebell-swing", "W"], ["pont-fessier", "W"], ["jumping-jacks", "W"], ["chaise", "W"]] },
  { id: "metab-bas-b", n: "Brûle-graisses bas du corps B", cat: "cardio", kind: "hiit", mode: "circuit", obj: "perte",
    desc: "Deuxième circuit jambes : squat sumo, fentes latérales, step et gainage.",
    circuit: { timed: false },
    items: [["squat-sumo", "W"], ["fentes-laterales", "W"], ["step-up", "W"], ["hip-thrust", "W"], ["montees-genoux", "W"], ["planche-laterale", "W"]] },
  /* ---- Tonus et endurance : beaucoup de répétitions, pauses courtes ---- */
  { id: "tonus-haut", n: "Tonique haut du corps", cat: "haut", kind: "muscu", mode: "series", obj: "tonus",
    desc: "Endurance musculaire du haut du corps : charges légères, beaucoup de répétitions, pauses courtes.",
    items: [["presse-pecs", "C"], ["tirage-vertical", "C"], ["elevations-laterales", "I"], ["curl-poulie", "I"], ["extension-corde", "I"], ["planche", "G"]] },
  { id: "tonus-haut-b", n: "Tonique haut du corps B", cat: "haut", kind: "muscu", mode: "series", obj: "tonus",
    desc: "Variante : pompes, rowing et épaules, en séries longues.",
    items: [["pompes-inclinees", "C"], ["rowing-machine", "C"], ["oiseau", "I"], ["curl-halteres", "I"], ["kickback", "I"], ["dead-bug", "G"]] },
  { id: "tonus-bas", n: "Tonique bas du corps", cat: "bas", kind: "muscu", mode: "series", obj: "tonus",
    desc: "Jambes et fessiers en séries longues pour l’endurance et une silhouette plus ferme.",
    items: [["presse-cuisses", "C"], ["fentes-marchees", "C"], ["leg-curl-assis", "I"], ["abduction-machine", "I"], ["mollets-debout", "I"], ["chaise", "G"]] },
  { id: "tonus-bas-b", n: "Tonique bas du corps B", cat: "bas", kind: "muscu", mode: "series", obj: "tonus",
    desc: "Variante : goblet squat, pont, adducteurs et gainage.",
    items: [["goblet-squat", "C"], ["pont-fessier", "C"], ["leg-extension", "I"], ["adduction-machine", "I"], ["mollets-assis", "I"], ["planche-laterale", "G"]] },
  { id: "tonus-circuit", n: "Circuit tonique", cat: "full", kind: "hiit", mode: "circuit", obj: "tonus",
    desc: "Tout le corps en circuit chronométré, au poids du corps.",
    circuit: { timed: true },
    items: [["squat-pdc", "W"], ["pompes-inclinees", "W"], ["fentes-avant", "W"], ["superman", "W"], ["crunch", "W"], ["planche-laterale", "W"]] },
  /* ---- Remise en forme : en douceur, avec de la mobilité ---- */
  { id: "forme-doux", n: "Remise en forme", cat: "full", kind: "muscu", mode: "series", obj: "forme",
    desc: "Tout le corps sur machines, en douceur, pour reprendre de bonnes bases.",
    items: [["presse-cuisses", "C"], ["presse-pecs", "C"], ["tirage-horizontal", "C"], ["pont-fessier", "I"], ["bird-dog", "G"]] },
  { id: "forme-doux-b", n: "Remise en forme B", cat: "full", kind: "muscu", mode: "series", obj: "forme",
    desc: "Variante : goblet squat, tirage vertical, épaules et gainage.",
    items: [["goblet-squat", "C"], ["tirage-vertical", "C"], ["presse-epaules", "C"], ["leg-curl-assis", "I"], ["dead-bug", "G"]] },
  { id: "forme-mobi", n: "Renfo & mobilité", cat: "mob", kind: "muscu", mode: "series", obj: "forme",
    desc: "Renforcement léger entre des mouvements de mobilité : on bouge mieux, on se tient mieux.",
    items: [["chat-vache", "M"], ["world-greatest", "M"], ["goblet-squat", "C"], ["pompes-inclinees", "C"], ["rowing-elastique", "I"], ["dead-bug", "G"], ["pigeon", "M"]] },
  { id: "abdos", n: "Abdos & gainage", cat: "core", kind: "muscu", mode: "series",
    desc: "Grand droit, obliques et gainage profond pour une sangle abdominale solide.",
    items: [["planche", "G"], ["crunch-inverse", "G"], ["russian-twist", "G"], ["planche-laterale", "G"], ["dead-bug", "G"], ["releve-genoux-chaise", "G"]] },
  { id: "abdos-express", n: "Abdos express 10 min", cat: "core", kind: "hiit", mode: "circuit",
    desc: "Circuit court à placer en fin de séance.",
    circuit: { timed: true },
    items: [["crunch", "W"], ["mountain-climbers", "W"], ["bicycle", "W"], ["planche", "W"], ["ciseaux", "W"]] },
  { id: "cardio-endurance", n: "Cardio endurance", cat: "cardio", kind: "cardio", mode: "series",
    desc: "Cardio continu en zone 2 : améliore le souffle et brûle des graisses sans épuiser.",
    items: [["velo", "K", { min: 5 }], ["rameur", "K", { f: 0.45 }], ["marche-inclinee", "K", { f: 0.55 }], ["etirement-mollets", "M"], ["etirement-quadriceps", "M"]] },
  { id: "cardio-fractionne", n: "Fractionné vélo & rameur", cat: "cardio", kind: "cardio", mode: "series",
    desc: "Alternance d’efforts courts et intenses et de récupérations actives.",
    items: [["velo", "K", { min: 5 }], ["assault-bike", "F", { n: 8, w: 30, r: 60 }], ["rameur", "F", { n: 6, w: 40, r: 60 }], ["velo", "K", { min: 5 }]] },
  { id: "hiit-20", n: "HIIT sans matériel", cat: "cardio", kind: "hiit", mode: "circuit",
    desc: "Circuit intense sans matériel. Fais le maximum de répétitions pendant chaque effort.",
    circuit: { timed: true },
    items: [["burpees", "W"], ["squat-saute", "W"], ["mountain-climbers", "W"], ["jumping-jacks", "W"], ["pompes", "W"], ["montees-genoux", "W"]] },
  { id: "tabata", n: "Tabata express", cat: "cardio", kind: "hiit", mode: "circuit",
    desc: "20 secondes à fond, 10 secondes de repos. Court, mais redoutable.",
    circuit: { timed: true, work: 20, rest: 10, tours: 4, roundRest: 60 },
    items: [["squat-saute", "W"], ["mountain-climbers", "W"]] },
  { id: "cardio-renfo", n: "Cardio-renfo kettlebell", cat: "cardio", kind: "hiit", mode: "circuit",
    desc: "Renforcement et cardio en même temps, avec un kettlebell et des haltères.",
    circuit: { timed: true },
    items: [["kettlebell-swing", "W"], ["goblet-squat", "W"], ["thruster", "W"], ["renegade-row", "W"], ["mountain-climbers", "W"]] },
  { id: "echauffement", n: "Échauffement 8 min", cat: "mob", kind: "mob", mode: "series",
    desc: "Prépare articulations et muscles avant n’importe quelle séance.",
    items: [["step-jack", "E", { d: 60 }], ["cercles-bras", "E"], ["squat-pdc", "E", { d: 45 }], ["world-greatest", "E"], ["rotation-thoracique", "E"], ["dislocations-epaules", "E", { reps: 10 }]] },
  { id: "mobilite", n: "Mobilité & étirements", cat: "mob", kind: "mob", mode: "series",
    desc: "Une séance douce pour récupérer, gagner en souplesse et soulager le dos.",
    items: [["chat-vache", "M"], ["world-greatest", "M"], ["pigeon", "M"], ["fente-psoas", "M"], ["etirement-ischios", "M"], ["posture-enfant", "M"], ["etirement-pectoraux", "M"], ["rotation-thoracique", "M"]] },
  { id: "etirements", n: "Étirements complets", cat: "mob", kind: "mob", mode: "series",
    desc: "Tout le corps, de la nuque aux mollets, en 12 minutes. Après le sport ou un jour de repos.",
    items: [["etirement-trapezes", "M"], ["etirement-epaules", "M"], ["etirement-pectoraux", "M"], ["etirement-dorsaux", "M"], ["etirement-avantbras", "M"], ["torsion-allongee", "M"], ["etirement-fessiers", "M"], ["etirement-ischios", "M"], ["etirement-quadriceps", "M"], ["etirement-mollets", "M"], ["posture-enfant", "M"]] }
];
const TPL_BY_ID = Object.fromEntries(TPL.map(t => [t.id, t]));

/* ===== Adaptation au profil ===== */
const OBJECTIFS = {
  muscle: { n: "Prendre du muscle", C: [4, 10, 120], I: [3, 12, 75], cardio: 15 },
  force:  { n: "Gagner en force",   C: [5, 5, 180],  I: [3, 8, 90],  cardio: 10 },
  perte:  { n: "Perdre du poids",   C: [3, 12, 60],  I: [3, 15, 45], cardio: 30 },
  tonus:  { n: "Tonifier, gagner en endurance", C: [3, 15, 45], I: [3, 18, 30], cardio: 25 },
  forme:  { n: "Me remettre en forme", C: [3, 10, 90], I: [2, 12, 60], cardio: 20 }
};
const NIV_KEYS = { debutant: 1, intermediaire: 2, avance: 3 };

/* Séries jusqu’à l’échec : seulement là où rater une répétition ne fait courir aucun risque
   (machines, poulies, poids du corps, isolation légère qu’on peut lâcher). Jamais sur les gros mouvements à la barre libre. */
const ECH = new Set(["presse-pecs", "pec-deck", "presse-epaules", "reverse-pec-deck", "rowing-machine", "leg-extension", "leg-curl-allonge", "leg-curl-assis",
  "abduction-machine", "adduction-machine", "mollets-assis", "mollets-debout", "tractions-assistees", "dips-assiste", "releve-genoux-chaise",
  "vis-a-vis", "tirage-vertical", "tirage-serre", "tirage-horizontal", "pull-over-poulie", "elev-lat-poulie", "face-pull", "curl-poulie", "extension-corde",
  "extension-barre-poulie", "crunch-poulie", "kickback-poulie", "rowing-elastique",
  "pompes", "pompes-genoux", "pompes-inclinees", "pompes-diamant", "tractions", "tractions-supination", "rowing-inverse", "dips-banc", "crunch", "crunch-inverse",
  "releve-jambes-sol", "planche", "planche-laterale", "chaise", "pont-fessier", "pont-unilateral", "donkey-kick", "fire-hydrant", "clamshell", "superman", "hollow",
  "mollets-unilateral", "squat-pdc", "suspension", "releves-pointes", "bicycle", "ciseaux",
  "curl-halteres", "curl-marteau", "curl-barre", "curl-ez", "curl-incline", "curl-concentre", "curl-araignee", "curl-inverse", "elevations-laterales",
  "elevations-frontales", "oiseau", "elevations-y", "shrug-halteres", "shrug-barre", "kickback", "curl-poignets", "extension-poignets"]);

/* S5 (phase 3D, décision 3) : cible de répétitions en réserve (RIR) au lieu de « jusqu’à l’échec », selon le niveau et le type d’exercice
   (plan section 9.3, docs/REGLES_SPORTIVES.md). Types : l = grand mouvement libre (polyarticulaire à la barre, aux haltères, au kettlebell),
   m = machine, poulie, élastique ou isolation, p = poids du corps, t = chronométré (une durée, jamais d’échec ni de réserve).
   Renvoie { rir, rirLast?, echec? } (rirLast = cible de la dernière série si elle diffère ; echec = dernière série à l’échec, avancé seulement,
   exercices de la liste ECH), ou null (chronométré). */
const RIR_FREE = ["barre", "halteres", "kettlebell", "ez"], RIR_GUIDED = ["machine", "poulie", "smith", "elastique", "medecine"];
function rirKind(ex, role) {
  if (!ex || ex.t === "t") return "t";
  if (ex.m.some(x => RIR_GUIDED.indexOf(x) >= 0)) return "m";
  if (ex.m.some(x => RIR_FREE.indexOf(x) >= 0)) return role === "C" ? "l" : "m";
  return "p";
}
function rirFor(ex, role, lvl, phase) {
  const k = rirKind(ex, role); if (k === "t") return null;
  const ph = Math.max(1, Math.floor(+phase || 1)), ech = !!ex && ECH.has(ex.id);
  if (lvl <= 1) return { rir: k === "l" && ph < 2 ? 3 : 2 };
  if (lvl === 2) return k === "l" ? (ph >= 4 ? { rir: 2, rirLast: 1 } : { rir: 2 }) : { rir: 1 };
  if (k === "l") return { rir: 2, rirLast: 1 };
  return ech ? { rir: 1, rirLast: 0, echec: 1 } : { rir: 1 };
}
/* Applique la cible à un exercice de séance (séries classiques). Chronométré : ni réserve ni échec. */
function setRir(it, ex, role, lvl, phase) {
  delete it.rir; delete it.rirLast; delete it.echec;
  if (!(it.reps > 0) || it.duree > 0) return null;
  const r = rirFor(ex, role, lvl, phase); if (!r) return null;
  it.rir = r.rir; if (r.rirLast != null && r.rirLast !== r.rir) it.rirLast = r.rirLast; if (r.echec) it.echec = 1;
  return r;
}
/* Semaine allégée, séance de reprise : 3 répétitions en réserve partout, pas d’échec */
function rirEasy(it) { if (it.rir != null) it.rir = 3; delete it.rirLast; it.echec = 0; }
const nearestOf = (list, v) => list.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) ? x : b, list[0]);
/* Masse prise en compte : au-delà d’un IMC de 25, la moitié seulement du surplus compte (la force suit surtout la masse maigre) */
function effMass(p) {
  if (!p || !p.poids) return null;
  const h = p.taille ? p.taille / 100 : 0;
  if (!h) return p.poids;
  const ref = 25 * h * h;
  return p.poids > ref ? ref + .5 * (p.poids - ref) : p.poids;
}
function estCharge(id, reps, p) {
  const L = LOAD[id]; if (!L || !p || !p.poids) return 0;
  const k = L[0], r = L[1], o = L[2] || "", lvl = NIV_KEYS[p.niveau] || 1, fem = p.sexe === "F";
  if (k === "x") return r[fem ? 1 : 0] + (lvl - 1) * 2;
  if (k === "a") return Math.max(0, Math.round(p.poids * ((fem ? .66 : .56) - (lvl - 1) * .16 + Math.max(0, (reps || 8) - 8) * .015) / 2.5) * 2.5);
  if (o.indexOf("P") >= 0 && lvl === 1) return 0;
  const age = p.age || 25, ageF = age < 16 ? .7 : age < 18 ? .85 : age > 35 ? Math.max(.7, 1 - .007 * (age - 35)) : 1;
  let w = r * effMass(p) * (fem ? (o.indexOf("L") >= 0 ? .72 : .55) : 1) * [0, 1, 1.45, 1.85][lvl] * ageF;
  if (o.indexOf("w") < 0) w = w / (1 + (reps || 10) / 30) * (lvl === 1 ? .85 : .9);
  switch (k) {
    case "b": return Math.max(p.barre || 20, Math.round(w / 2.5) * 2.5);
    case "e": return Math.max(10, Math.round(w / 2.5) * 2.5);
    case "s": return Math.max(15, Math.round(w / 2.5) * 2.5);
    case "d": return nearestOf(DB_KG, w);
    case "k": return nearestOf(KB_KG, w);
    case "m": return Math.max(5, Math.round(w / 5) * 5);
    case "c": return Math.max(2.5, Math.round(w / 2.5) * 2.5);
  }
  return 0;
}
/* Corpulence élevée : versions plus accessibles des exercices au poids du corps les plus durs */
const BMI_SWAP = { "pompes": "pompes-inclinees", "pompes-diamant": "pompes-genoux", "pompes-declinees": "pompes", "pompes-archer": "pompes-inclinees",
  "tractions": "tractions-assistees", "tractions-supination": "tractions-assistees", "dips-pecs": "dips-assiste", "dips-triceps": "dips-assiste",
  "pistol": "squat-bulgare", "nordic-curl": "leg-curl-allonge", "releve-jambes-suspendu": "releve-genoux-chaise", "v-ups": "crunch", "pike-pushup": "presse-epaules" };

function imc(p) { return p && p.taille && p.poids ? p.poids / Math.pow(p.taille / 100, 2) : null; }
function lowImpact(p) { const b = imc(p); return !!(p && (p.sansSaut || (b && b >= 30) || (p.age && p.age >= 55))); }
function fcMax(p) { if (!p || !p.age) return null; return Math.round(p.sexe === "F" ? 206 - 0.88 * p.age : 208 - 0.7 * p.age); }
function round15(s) { return Math.max(15, Math.round(s / 15) * 15); }

function profileCtx(p) {
  p = p || {};
  const lvl = NIV_KEYS[p.niveau] || 1;
  const obj = OBJECTIFS[p.objectif] || OBJECTIFS.forme;
  let restMult = 1, restAdd = 0;
  if (p.sexe === "F") restMult = 0.85;
  if (p.age && p.age >= 50) restAdd = 15;
  const b = imc(p);
  return { p, lvl, obj, restMult, restAdd, low: lowImpact(p), heavy: !!(b && b >= 30 && lvl <= 2) };
}
function adjRest(ctx, s) { return round15(s * ctx.restMult + ctx.restAdd); }

/* used (facultatif) : exercices déjà dans la séance ou encore à venir, pour qu’un remplaçant guidé n’y soit pas deux fois */
function resolveEx(id, ctx, notes, used) {
  let ex = EX_BY_ID[id];
  if (!ex) return null;
  if (ctx.lvl === 1 && DEB_GUIDE[ex.id]) { ex = debGuide(ex.id, used); if (!ex) return null; notes.add(DEB_GUIDE_NOTE); }
  if (ctx.lvl === 1 && ex.l === 3) {
    if (ex.deb && EX_BY_ID[ex.deb]) { notes.add("Exercices avancés remplacés par une version débutant"); ex = EX_BY_ID[ex.deb]; }
    else return null;
    if (DEB_GUIDE[ex.id]) { ex = debGuide(ex.id, used); if (!ex) return null; notes.add(DEB_GUIDE_NOTE); }
  }
  if (ctx.low && ex.imp && ex.lo && EX_BY_ID[ex.lo]) { notes.add("Version sans saut"); ex = EX_BY_ID[ex.lo]; }
  if (ctx.heavy && BMI_SWAP[ex.id] && EX_BY_ID[BMI_SWAP[ex.id]]) { notes.add("Exercices au poids du corps adaptés à ta corpulence"); ex = EX_BY_ID[BMI_SWAP[ex.id]]; }
  return ex;
}

/* Même poste (banc, poulie) : les exercices qui l’utilisent s’enchaînent, pour éviter les allers-retours dans la salle.
   Un exercice ne passe pas devant un exercice plus important (gros mouvement > isolation > gainage), sauf une isolation
   devant un gros mouvement dont elle ne fatigue aucun muscle (principal ou secondaire) ; rien ne traverse le cardio,
   la mobilité ou les étirements. Réordonne items (et roles) sur place ; renvoie true si l’ordre change. */
function stationOf(id) {
  const e = EX_BY_ID[id]; if (!e) return null;
  if (e.m.indexOf("poulie") >= 0) return "poulie";
  if (e.m.indexOf("banc") >= 0 && e.m.indexOf("smith") < 0) return "banc";
  return null;
}
const STATION_RANK = { C: 0, I: 1, G: 2 };
const preTires = (x, y) => { const a = EX_BY_ID[x], b = EX_BY_ID[y]; return !!(a && b && b.p.some(m => a.p.indexOf(m) >= 0 || a.s.indexOf(m) >= 0)); };
function groupStations(items, roles) {
  const n = items.length, rank = k => roles ? STATION_RANK[roles[k]] : 1, done = new Array(n).fill(false), order = [];
  for (let a = 0; a < n; a++) {
    if (done[a]) continue;
    order.push(a); done[a] = true;
    const st = rank(a) != null && stationOf(items[a].id); if (!st) continue;
    for (let b = a + 1; b < n; b++) {
      if (done[b]) continue;
      if (rank(b) == null) break;
      if (stationOf(items[b].id) !== st) continue;
      let ok = true;
      for (let k = a + 1; k < b; k++) if (!done[k] && !(rank(k) >= rank(b) || (rank(b) === 1 && !preTires(items[k].id, items[b].id)))) { ok = false; break; }
      if (ok) { order.push(b); done[b] = true; }
    }
  }
  if (order.every((k, i) => k === i)) return false;
  const it0 = items.slice(), r0 = roles ? roles.slice() : null;
  order.forEach((k, i) => { items[i] = it0[k]; if (r0) roles[i] = r0[k]; });
  return true;
}

function prescribe(tpl, profile) {
  const ctx = profileCtx(profile);
  const notes = new Set();
  const out = { nom: tpl.n, tplId: tpl.id, mode: tpl.mode, kind: tpl.kind, etir: tpl.kind !== "mob", items: [] };
  const L = ctx.lvl;
  if (tpl.mode === "circuit") {
    const c = tpl.circuit || {};
    out.tours = c.tours ? Math.max(2, c.tours - (L === 1 ? 1 : 0)) : [0, 2, 3, 4][L];
    const work = c.work || [0, 30, 40, 45][L];
    const rest = c.rest || [0, 30, 20, 15][L];
    out.roundRest = c.roundRest || (L === 1 ? 90 : 60);
    tpl.items.forEach(([id], k) => {
      const ex = resolveEx(id, ctx, notes, out.items.map(x => x.id).concat(tpl.items.slice(k + 1).map(x => x[0]))); if (!ex) return;
      const timed = c.timed || ex.t === "t";
      out.items.push({ id: ex.id, series: 1, reps: timed ? 0 : [0, 8, 12, 15][L], duree: timed ? work : 0, repos: rest, charge: 0 });
    });
  } else {
    let lastK = -1; const roles = [];
    tpl.items.forEach(([id, role, o], k) => {
      o = o || {};
      const ex = resolveEx(id, ctx, notes, out.items.map(x => x.id).concat(tpl.items.slice(k + 1).map(x => x[0]))); if (!ex) return;
      if (role === "K" && !o.min) lastK = out.items.length;
      let it = { id: ex.id, series: 3, reps: 0, duree: 0, repos: 60, charge: 0 };
      if (role === "C" || role === "I") {
        const [s, r, rest] = ctx.obj[role];
        it.series = Math.max(2, s + (L === 1 ? -1 : 0) + (L === 3 && role === "C" ? 1 : 0));
        if (ex.t === "t") { it.duree = [0, 30, 45, 60][L]; } else it.reps = r;
        it.repos = adjRest(ctx, rest);
      } else if (role === "G") {
        it.series = L === 1 ? 2 : 3;
        if (ex.t === "t") it.duree = Math.round((ex.dt || 45) * [0, 0.7, 1, 1.35][L] / 5) * 5; else it.reps = [0, 12, 15, 20][L];
        it.repos = adjRest(ctx, ex.t === "t" ? 30 : 45);
      } else if (role === "K") {
        it.series = 1; it.repos = 0;
        it.duree = o.min ? o.min * 60 : Math.round(ctx.obj.cardio * [0, 0.7, 1, 1.25][L] * (o.f || 1)) * 60;
      } else if (role === "F") {
        it.series = Math.max(4, o.n - (L === 1 ? 2 : 0) + (L === 3 ? 2 : 0)); it.duree = o.w; it.repos = o.r;
      } else if (role === "M") {
        it.series = ex.pc ? 2 : 1; it.duree = ex.dt || 30; it.repos = 10;
      } else if (role === "E") {
        it.series = 1; it.repos = 10;
        if (o.reps) it.reps = o.reps; else it.duree = o.d || ex.dt || 30;
      }
      if (ex.pc && role !== "M" && it.reps) it.parCote = 1;
      out.items.push(it); roles.push(role);
    });
    if (L === 1 && tpl.kind === "muscu" && out.items.length > 5) { out.items = out.items.slice(0, 5); roles.length = 5; notes.add("Séance raccourcie pour débuter"); }
    /* Cardio en plus quand le poids ne baisse plus (voir plateau) */
    const plus = Math.min(15, Math.max(0, +(profile && profile.cardioPlus) || 0));
    if (plus && lastK >= 0 && ["perte", "tonus"].indexOf(profile.objectif) >= 0) { out.items[lastK].duree += plus * 60; notes.add(plus + " min de cardio en plus"); }
    addZones(out, tpl, ctx, notes, roles, profile);
    phaseAdjust(out, profile && profile.phase, ctx, notes, roles);
    /* S5 : cible de répétitions en réserve, une fois l’exercice définitif (le palier 3 peut le remplacer par une version plus dure) */
    let anyRir = false, anyFail = false;
    out.items.forEach((it, k) => { const role = roles[k]; if (role !== "C" && role !== "I" && role !== "G") return; const r = setRir(it, EX_BY_ID[it.id], role, L, profile && profile.phase); if (r) { anyRir = true; if (r.echec) anyFail = true; } });
    if (anyRir) notes.add(L === 1 ? "Aucune série jusqu’à l’échec : tu t’arrêtes en gardant des répétitions en réserve" : "Chaque série s’arrête en gardant des répétitions en réserve");
    if (anyFail) notes.add("Dernière série jusqu’à l’échec sur les exercices sans risque");
    if (groupStations(out.items, roles)) notes.add("Exercices au banc ou à la poulie à la suite pour éviter les allers-retours");
  }
  out.notes = [...notes];
  return out;
}

/* Étirements de fin de séance : choisis selon les muscles les plus travaillés */
const STRETCH_FOR = { pecs: "etirement-pectoraux", epaules_ant: "etirement-epaules-ant", epaules_lat: "etirement-epaules", epaules_post: "etirement-epaules",
  biceps: "etirement-biceps", triceps: "etirement-triceps", avantbras: "etirement-avantbras", trapezes: "etirement-trapezes", dorsaux: "etirement-dorsaux",
  rhomboides: "etirement-haut-dos", lombaires: "genoux-poitrine", abdos: "cobra", obliques: "torsion-allongee", fessiers: "etirement-fessiers",
  abducteurs: "etirement-fessiers", adducteurs: "papillon", quadriceps: "etirement-quadriceps", ischios: "etirement-ischios", mollets: "etirement-mollets" };
const etirOn = s => s && s.etir != null ? !!s.etir : !!(s && s.kind !== "mob");
function coolDown(items) {
  const score = {}, have = new Set();
  (items || []).forEach(it => { const e = EX_BY_ID[it.id]; if (!e || it.cool) return; have.add(e.id); e.p.forEach(m => { score[m] = (score[m] || 0) + 2; }); e.s.forEach(m => { score[m] = (score[m] || 0) + 1; }); });
  const ids = [];
  Object.keys(score).filter(m => STRETCH_FOR[m]).sort((a, b) => score[b] - score[a]).forEach(m => { const id = STRETCH_FOR[m]; if (ids.indexOf(id) < 0 && !have.has(id)) ids.push(id); });
  if (!ids.length && items && items.length) ["etirement-quadriceps", "etirement-ischios", "etirement-mollets"].forEach(id => { if (!have.has(id)) ids.push(id); });
  return ids.slice(0, 4).map(id => { const e = EX_BY_ID[id]; return { id, series: e.pc ? 2 : 1, reps: 0, duree: 30, repos: 10, charge: 0, cool: 1 }; });
}
function coolDuree(items) { return coolDown(items).reduce((a, it) => a + it.series * (it.duree + 10), 20); }

/* Échauffement de début de séance : quelques minutes de cardio doux, puis des mouvements de mobilité
   choisis selon les muscles de la séance (mouvements dynamiques, pas d’étirements tenus) */
const WARM_FOR = { pecs: ["cercles-bras", "dislocations-epaules"], epaules_ant: ["dislocations-epaules", "cercles-bras"], epaules_lat: ["cercles-bras"], epaules_post: ["dislocations-epaules"],
  triceps: ["cercles-bras"], biceps: ["dislocations-epaules"], avantbras: ["cercles-bras"], trapezes: ["cercles-bras"], dorsaux: ["dislocations-epaules", "rotation-thoracique"], rhomboides: ["rotation-thoracique"],
  lombaires: ["chat-vache"], abdos: ["chat-vache"], obliques: ["rotation-thoracique"], quadriceps: ["squat-pdc", "world-greatest"], fessiers: ["world-greatest", "squat-pdc"],
  ischios: ["world-greatest"], adducteurs: ["squat-profond"], abducteurs: ["world-greatest"], mollets: ["squat-pdc"] };
const LEGS = ["quadriceps", "fessiers", "ischios", "adducteurs", "abducteurs", "mollets"];
const echOn = s => s && s.echauf != null ? !!s.echauf : !!(s && (s.kind === "muscu" || s.kind === "hiit" || !s.kind));
function warmUp(items, low) {
  const score = {}, have = new Set(); let gym = false;
  (items || []).forEach(it => {
    const e = EX_BY_ID[it.id]; if (!e || it.cool || it.warm) return;
    have.add(e.id);
    if (e.m.some(m => ["machine", "poulie", "smith", "barre", "ez"].indexOf(m) >= 0)) gym = true;
    e.p.forEach(m => { score[m] = (score[m] || 0) + 2; }); e.s.forEach(m => { score[m] = (score[m] || 0) + 1; });
  });
  if (!have.size) return [];
  const legs = LEGS.reduce((a, m) => a + (score[m] || 0), 0), all = Object.keys(score).reduce((a, m) => a + (m === "cardio" ? 0 : score[m]), 0);
  const pulse = gym ? (legs * 2 >= all ? "velo" : "rameur") : (low ? "step-jack" : "jumping-jacks");
  const mob = [];
  Object.keys(score).filter(m => WARM_FOR[m]).sort((a, b) => score[b] - score[a]).forEach(m => WARM_FOR[m].forEach(id => { if (mob.indexOf(id) < 0 && !have.has(id) && EX_BY_ID[id]) mob.push(id); }));
  if (!mob.length) ["world-greatest", "cercles-bras"].forEach(id => { if (!have.has(id)) mob.push(id); });
  return [pulse].concat(mob.slice(0, 3)).filter(id => EX_BY_ID[id]).map(id => {
    const e = EX_BY_ID[id], p = id === pulse;
    return { id, series: !p && e.pc ? 2 : 1, reps: 0, duree: p ? (gym ? 180 : 60) : 30, repos: 10, charge: 0, warm: 1 };
  });
}
function warmDuree(items, low) { const w = warmUp(items, low); return w.length ? w.reduce((a, it) => a + it.series * (it.duree + 10), 20) : 0; }

/* Durée estimée (s) et calories */
function estDuree(s) {
  let t = 0;
  const main = s.items.filter(it => !it.warm && !it.cool), phase = l => l.reduce((a, it) => a + it.series * (it.duree + 10), 20);
  /* échauffement et étirements : ceux de la séance s’ils y sont déjà, sinon ceux qui seront ajoutés au lancement */
  if (s.items.some(it => it.cool)) t += phase(s.items.filter(it => it.cool)); else if (etirOn(s) && main.length) t += coolDuree(main);
  if (s.items.some(it => it.warm)) t += phase(s.items.filter(it => it.warm)); else if (echOn(s) && main.length) t += warmDuree(main);
  if (s.mode === "circuit") {
    const per = main.reduce((a, it) => a + (it.duree || it.reps * 3.5) + (it.repos || 0), 0);
    t += (s.tours || 1) * per + Math.max(0, (s.tours || 1) - 1) * (s.roundRest || 60);
  } else {
    main.forEach((it, i) => {
      const w = it.duree || (it.reps || 10) * 3.5 * (it.parCote ? 2 : 1);
      /* superset : pas de repos avant l’exercice suivant du groupe */
      if (main[i + 1] && it.ss) t += it.series * (w + 15);
      else t += it.series * w + Math.max(0, it.series - 1) * (it.repos || 0) + 60;
    });
  }
  return Math.round(t);
}
const MET = { muscu: 4, hiit: 8, cardio: 7, mob: 2.5 };
function estKcal(s, profile, dureeSec) {
  const poids = profile && profile.poids ? profile.poids : 70;
  const met = MET[s.kind || "muscu"] || 5;
  return Math.round(met * poids * (dureeSec || estDuree(s)) / 3600);
}

/* Programme conseillé selon le nombre de jours */
const PROG_OFFSETS = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
/* Objectifs du profil : plusieurs possibles, le premier est le principal (p.objectif reste rempli pour les anciennes versions) */
function objList(p) {
  p = p || {};
  const a = (Array.isArray(p.objectifs) ? p.objectifs : []).filter((k, i, arr) => OBJECTIFS[k] && arr.indexOf(k) === i);
  if (p.objectif && OBJECTIFS[p.objectif] && a[0] !== p.objectif) { const i = a.indexOf(p.objectif); if (i > 0) a.splice(i, 1); a.unshift(p.objectif); }
  return a.length ? a : ["forme"];
}
/* Profil utilisé pour prescrire une séance réglée sur un objectif donné */
function profFor(p, obj) { return OBJECTIFS[obj] ? Object.assign({}, p, { objectif: obj }) : p; }
const STRENGTH_OBJ = ["muscle", "force", "forme"];
/* Répartit n éléments en parts proportionnelles aux poids (méthode du plus fort reste) */
function shares(n, w) {
  const tot = w.reduce((a, x) => a + x, 0), raw = w.map(x => n * x / tot), out = raw.map(Math.floor);
  let left = n - out.reduce((a, x) => a + x, 0);
  raw.map((x, i) => [x - out[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}
/* Mélange régulier de deux listes (ex. muscu, cardio, muscu, cardio) */
function interleave(a, b) {
  const out = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && (a.length - i) / a.length >= (b.length - j) / b.length)) out.push(a[i++]); else out.push(b[j++]);
  }
  return out;
}
/* Variété : jamais deux fois la même séance dans la semaine. Une séance déjà prévue est remplacée
   par une variante qui travaille les mêmes muscles (ou, à défaut, une séance proche). */
const PROG_ALT = {
  push: ["push-b"], pull: ["pull-b"], legs: ["legs-b"], haut: ["haut-b"], bas: ["bas-b", "jambes"],
  "fb-machines": ["fb-guide", "fb-halteres"], "fb-halteres": ["fb-guide", "fb-barre"], "fb-barre": ["fb-barre-b", "fb-halteres"],
  "fb-maison": ["fb-maison-b", "cardio-renfo"], "cardio-endurance": ["cardio-mix", "cardio-fractionne"], "hiit-20": ["hiit-boxe", "cardio-fractionne"],
  "cardio-renfo": ["hiit-boxe", "hiit-20", "fb-maison-b"], "cardio-fractionne": ["hiit-20", "cardio-mix"],
  "force-squat": ["force-squat-b"], "force-dc": ["force-dc-b"], "force-sdt": ["force-sdt-b"], "force-dm": ["force-dm-b"],
  "metab-haut": ["metab-haut-b", "hiit-boxe"], "metab-bas": ["metab-bas-b", "cardio-renfo"], "tonus-haut": ["tonus-haut-b"], "tonus-bas": ["tonus-bas-b"],
  "tonus-circuit": ["fb-maison", "cardio-renfo"], "forme-doux": ["forme-doux-b", "fb-machines"], "forme-mobi": ["mobilite", "fb-machines"], "mobilite": ["etirements"]
};
function vary(ids) {
  const seen = new Set();
  return ids.map(id => {
    if (seen.has(id)) { const a = (PROG_ALT[id] || []).find(x => TPL_BY_ID[x] && !seen.has(x)); if (a) id = a; }
    seen.add(id); return id;
  });
}
/* Programme de la semaine : { ids, offsets, objs } — objs[i] = objectif sur lequel la séance i est réglée */
function programme(p) {
  const r = programme0(p); r.ids = vary(r.ids); return r;
}
function programme0(p) {
  p = p || {};
  const O = objList(p), J = Math.min(6, Math.max(1, p.jours || 3));
  if (O.length === 1) { const r = programme1(Object.assign({}, p, { objectif: O[0] })); r.objs = r.ids.map(() => O[0]); return r; }
  const deb = (NIV_KEYS[p.niveau] || 1) === 1;
  /* Jours par objectif : le principal pèse 1,5, chaque objectif choisi a au moins une séance si possible */
  const used = O.slice(0, J), n = shares(J, used.map((k, i) => (i ? 1 : 1.5)));
  n.forEach((x, i) => { if (!x) { const k = n.indexOf(Math.max.apply(null, n)); n[k]--; n[i]++; } });
  const strObjs = [], strCount = [];
  const other = [];
  used.forEach((k, i) => {
    if (STRENGTH_OBJ.indexOf(k) >= 0) { strObjs.push(k); strCount.push(n[i]); return; }
    const pool = k === "perte" ? (deb ? ["metab-bas", "cardio-endurance", "metab-haut"] : ["metab-haut", "hiit-20", "metab-bas"]) : ["tonus-circuit", "tonus-haut", "tonus-bas"];
    for (let d = 0; d < n[i]; d++) other.push({ id: pool[d % pool.length], o: k });
  });
  let str = [];
  const ns = strCount.reduce((a, x) => a + x, 0);
  if (ns) {
    const base = programme1(Object.assign({}, p, { objectif: strObjs[0], jours: ns })).ids;
    /* objectifs de force répartis régulièrement sur les séances de muscu */
    let seq = []; strObjs.forEach((k, i) => { const t = []; for (let d = 0; d < strCount[i]; d++) t.push(k); seq = seq.length ? interleave(seq, t) : t; });
    str = base.map((id, i) => ({ id, o: seq[i] }));
  } else if (other.length) {
    /* aucun objectif « muscu » : le principal garde son programme habituel (renfo + cardio) */
    const k = used[0], m = n[0], base = programme1(Object.assign({}, p, { objectif: k, jours: m })).ids;
    const rest = other.filter(x => x.o !== k);
    str = base.map(id => ({ id, o: k }));
    other.length = 0; rest.forEach(x => other.push(x));
  }
  const days = interleave(str, other);
  return { ids: days.map(d => d.id), objs: days.map(d => d.o), offsets: PROG_OFFSETS[J] };
}
/* Séances de la semaine selon l’objectif, le niveau (d = débutant, s = sinon) et le nombre de jours */
const PLANS = {
  muscle: {
    d: [["fb-machines"], ["fb-machines", "fb-halteres"], ["fb-machines", "fb-halteres", "fb-machines"], ["haut", "bas", "haut", "bas"], ["push", "pull", "legs", "haut", "bas"], ["push", "pull", "legs", "push", "pull", "legs"]],
    s: [["fb-halteres"], ["fb-barre", "fb-halteres"], ["push", "pull", "legs"], ["haut", "bas", "haut", "bas"], ["push", "pull", "legs", "haut", "bas"], ["push", "pull", "legs", "push", "pull", "legs"]]
  },
  force: {
    d: [["fb-barre"], ["fb-barre", "fb-barre-b"], ["force-squat", "force-dc", "force-sdt"], ["force-squat", "force-dc", "force-sdt", "force-dm"], ["force-squat", "force-dc", "force-sdt", "force-dm", "fb-halteres"], ["force-squat", "force-dc", "force-sdt", "force-dm", "fb-barre", "fb-halteres"]],
    s: [["fb-barre"], ["fb-barre", "fb-barre-b"], ["force-squat", "force-dc", "force-sdt"], ["force-squat", "force-dc", "force-sdt", "force-dm"], ["force-squat", "force-dc", "force-sdt", "force-dm", "fb-barre"], ["force-squat", "force-dc", "force-sdt", "force-dm", "fb-barre", "fb-barre-b"]]
  },
  perte: {
    d: [["fb-machines"], ["fb-machines", "cardio-endurance"], ["fb-machines", "metab-bas", "cardio-endurance"], ["metab-haut", "cardio-endurance", "metab-bas", "fb-halteres"], ["metab-haut", "cardio-endurance", "metab-bas", "fb-halteres", "cardio-mix"], ["metab-haut", "cardio-endurance", "metab-bas", "fb-halteres", "cardio-mix", "fb-guide"]],
    s: [["fb-halteres"], ["fb-halteres", "hiit-20"], ["metab-haut", "hiit-20", "metab-bas"], ["metab-haut", "metab-bas", "hiit-20", "cardio-endurance"], ["haut", "bas", "metab-haut", "hiit-20", "cardio-endurance"], ["push", "pull", "legs", "metab-haut", "hiit-20", "cardio-endurance"]]
  },
  tonus: {
    d: [["tonus-circuit"], ["tonus-haut", "tonus-bas"], ["tonus-haut", "tonus-circuit", "tonus-bas"], ["tonus-haut", "cardio-endurance", "tonus-bas", "tonus-circuit"], ["tonus-haut", "cardio-endurance", "tonus-bas", "tonus-circuit", "cardio-mix"], ["tonus-haut", "cardio-endurance", "tonus-bas", "tonus-circuit", "cardio-mix", "fb-maison"]],
    s: [["tonus-circuit"], ["tonus-haut", "tonus-bas"], ["tonus-haut", "tonus-circuit", "tonus-bas"], ["tonus-haut", "cardio-renfo", "tonus-bas", "tonus-circuit"], ["tonus-haut", "cardio-renfo", "tonus-bas", "tonus-circuit", "cardio-endurance"], ["tonus-haut", "cardio-renfo", "tonus-bas", "tonus-circuit", "cardio-endurance", "fb-maison"]]
  },
  forme: {
    d: [["forme-doux"], ["forme-doux", "forme-mobi"], ["forme-doux", "cardio-endurance", "forme-mobi"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-machines"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-machines", "cardio-mix"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-machines", "cardio-mix", "mobilite"]],
    s: [["forme-doux"], ["forme-doux", "forme-mobi"], ["forme-doux", "cardio-endurance", "forme-mobi"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-halteres"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-halteres", "cardio-mix"], ["forme-doux", "cardio-endurance", "forme-mobi", "fb-halteres", "cardio-mix", "mobilite"]]
  }
};
function programme1(p) {
  p = p || {};
  const j = Math.min(6, Math.max(1, p.jours || 3)), deb = (NIV_KEYS[p.niveau] || 1) === 1;
  const plan = PLANS[OBJECTIFS[p.objectif] ? p.objectif : "forme"][deb ? "d" : "s"];
  return { ids: plan[j - 1].slice(), offsets: PROG_OFFSETS[j] };
}

/* Semaines A et B : une semaine sur deux, chaque séance est remplacée par sa variante (mêmes muscles, autres exercices).
   Les grands mouvements de force restent les mêmes pour pouvoir mesurer les progrès. */
const WEEK_PAIRS = [["push", "push-b"], ["pull", "pull-b"], ["legs", "legs-b"], ["haut", "haut-b"], ["bas", "bas-b"], ["fb-machines", "fb-guide"], ["fb-barre", "fb-barre-b"],
  ["fb-maison", "fb-maison-b"], ["cardio-endurance", "cardio-mix"], ["hiit-20", "hiit-boxe"], ["force-squat", "force-squat-b"], ["force-dc", "force-dc-b"], ["force-sdt", "force-sdt-b"],
  ["force-dm", "force-dm-b"], ["metab-haut", "metab-haut-b"], ["metab-bas", "metab-bas-b"], ["tonus-haut", "tonus-haut-b"], ["tonus-bas", "tonus-bas-b"], ["forme-doux", "forme-doux-b"]];
const WEEK_B = {};
WEEK_PAIRS.forEach(([a, b]) => { WEEK_B[a] = b; WEEK_B[b] = a; });
/* Semaine B : une semaine sur deux (semaines comptées depuis le lundi 1er janvier 2024) */
function weekB(iso) {
  const [y, m, d] = iso.split("-").map(Number), t = new Date(y, m - 1, d), mon = new Date(y, m - 1, d - (t.getDay() + 6) % 7);
  return Math.round((mon - new Date(2024, 0, 1)) / 6048e5) % 2 === 1;
}
const weekVariant = (id, iso) => weekB(iso) && WEEK_B[id] ? WEEK_B[id] : id;

/* Zone prioritaire (1 ou 2) : un exercice en plus pour cette zone dans les séances de musculation */
const ZONES = {
  bras: ["Bras", ["curl-halteres", "extension-corde", "curl-marteau", "extension-nuque", "curl-poulie", "kickback"]],
  epaules: ["Épaules", ["elevations-laterales", "oiseau", "elev-lat-poulie", "face-pull", "arnold"]],
  pecs: ["Pectoraux", ["ecarte-halteres", "pec-deck", "pompes", "ecarte-incline", "vis-a-vis"]],
  dos: ["Dos", ["tirage-vertical", "rowing-haltere", "tirage-serre", "pull-over-poulie", "rowing-machine"]],
  fessiers: ["Fessiers", ["hip-thrust", "kickback-poulie", "abduction-machine", "pont-fessier", "fire-hydrant"]],
  jambes: ["Jambes", ["leg-extension", "leg-curl-assis", "fentes-arriere", "mollets-debout", "squat-bulgare"]],
  abdos: ["Abdos", ["crunch-inverse", "planche-laterale", "russian-twist", "dead-bug", "releve-genoux-chaise", "crunch-poulie"]]
};
const zoneList = p => (Array.isArray(p && p.zones) ? p.zones : []).filter((z, i, a) => ZONES[z] && a.indexOf(z) === i).slice(0, 2);
function addZones(out, tpl, ctx, notes, roles, profile) {
  const zs = zoneList(profile); if (!zs.length || tpl.kind !== "muscu" || out.mode === "circuit") return;
  const L = ctx.lvl, max = L === 1 ? 1 : 2;
  let h = 0, added = 0; for (let k = 0; k < tpl.id.length; k++) h = (h * 31 + tpl.id.charCodeAt(k)) % 997;
  zs.forEach((z, zi) => {
    if (added >= max) return;
    const list = ZONES[z][1];
    for (let k = 0; k < list.length; k++) {
      const ex = resolveEx(list[(h + zi * 3 + k) % list.length], ctx, new Set(), out.items.map(it => it.id));
      if (!ex || out.items.some(it => it.id === ex.id)) continue;
      const role = z === "abdos" ? "G" : "I", it = { id: ex.id, series: 3, reps: 0, duree: 0, repos: 60, charge: 0 };
      if (role === "I") { const [s0, r, rest] = ctx.obj.I; it.series = Math.max(2, s0 + (L === 1 ? -1 : 0)); if (ex.t === "t") it.duree = [0, 30, 45, 60][L]; else it.reps = r; it.repos = adjRest(ctx, rest); }
      else { it.series = L === 1 ? 2 : 3; if (ex.t === "t") it.duree = Math.round((ex.dt || 45) * [0, 0.7, 1, 1.35][L] / 5) * 5; else it.reps = [0, 12, 15, 20][L]; it.repos = adjRest(ctx, ex.t === "t" ? 30 : 45); }
      if (ex.pc && it.reps) it.parCote = 1;
      out.items.push(it); roles.push(role); added++;
      notes.add("Zone prioritaire : " + ZONES[z][0].toLowerCase());
      break;
    }
  });
}
/* Débutant : machines guidées à la place des exercices libres techniques (barre libre, mouvements balistiques), à tous les paliers,
   dans toutes les séances (programme, séances types, zones prioritaires). Décision du propriétaire du 9 nov. 2026 (docs/REGLES_SPORTIVES.md, choix prudent).
   Pour chaque exercice : remplaçants dans l’ordre de préférence ; le premier qui n’est pas déjà dans la séance est retenu.
   Pas de machine pour le soulevé de terre : version légère au kettlebell ou aux haltères (charge faible, qu’on peut lâcher sans danger). */
const DEB_GUIDE = {
  "squat-barre": ["squat-smith", "presse-cuisses", "goblet-squat"], "front-squat": ["squat-smith", "presse-cuisses", "goblet-squat"],
  "dc-barre": ["dc-smith", "presse-pecs", "dc-halteres"], "di-barre": ["smith-incline", "presse-pecs", "di-halteres"], "dd-barre": ["presse-pecs", "dc-smith", "dc-halteres"],
  "dc-serre": ["dips-assiste", "extension-corde", "extension-barre-poulie"], "barre-front": ["extension-barre-poulie", "extension-corde"],
  "dm-barre": ["presse-epaules", "dm-smith", "dm-halteres"], "rowing-barre": ["rowing-machine", "tirage-horizontal", "rowing-haltere"],
  "rowing-t": ["rowing-machine", "tirage-horizontal", "rowing-haltere"], "rowing-menton": ["elev-lat-poulie", "elevations-laterales"], "shrug-barre": ["shrug-halteres"],
  "hip-thrust": ["hip-thrust-machine", "pont-fessier"], "souleve-terre": ["sdt-kettlebell", "sdt-roumain-halteres"], "sdt-sumo": ["squat-sumo", "sdt-kettlebell"],
  "sdt-roumain": ["sdt-roumain-halteres", "leg-curl-assis"], "good-morning": ["sdt-roumain-halteres", "extension-lombaire"],
  "kettlebell-swing": ["pont-fessier", "squat-pdc"], "thruster": ["goblet-squat", "squat-pdc"], "clean-press": ["goblet-squat", "squat-pdc"]
};
const DEB_GUIDE_NOTE = "Débutant : machines guidées à la place de la barre libre, pour apprendre les mouvements en sécurité";
function debGuide(id, used) {
  const list = DEB_GUIDE[id] || [];
  for (let k = 0; k < list.length; k++) if (EX_BY_ID[list[k]] && !(used && used.indexOf(list[k]) >= 0)) return EX_BY_ID[list[k]];
  return null; /* tous déjà dans la séance : l’exercice est retiré plutôt que de garder la barre */
}
/* Matériel guidé (machine, Smith, poulie) : pour un débutant, un exercice guidé ne devient jamais un exercice libre au palier 3 */
const isGuided = e => !!(e && e.m.some(m => m === "machine" || m === "smith" || m === "poulie"));

/* ===== Planning de la semaine =====
   p.planJours : jours d’entraînement choisis (0 = lundi … 6 = dimanche), autant que de séances par semaine.
   Sinon, séances espacées par défaut (PROG_OFFSETS à partir du lundi). La séance i du programme tombe sur le i-ème jour choisi. */
function planDays(p) {
  p = p || {};
  const J = Math.min(6, Math.max(1, p.jours || 3));
  const a = (Array.isArray(p.planJours) ? p.planJours : []).map(Number)
    .filter((d, i, arr) => Number.isInteger(d) && d >= 0 && d <= 6 && arr.indexOf(d) === i).sort((x, y) => x - y);
  return a.length === J ? a : PROG_OFFSETS[J].slice();
}
/* Semaine type : pour chaque jour du lundi au dimanche, l’indice de la séance du programme, ou -1 (repos) */
function weekPlan(p) { const w = [-1, -1, -1, -1, -1, -1, -1]; planDays(p).forEach((d, i) => { w[d] = i; }); return w; }
/* Ajoute ou retire un jour d’entraînement : nouvelle liste, ou null (au moins 1 jour, au plus 6 pour garder un jour de repos) */
function togglePlanDay(p, day) {
  const d = planDays(p), i = d.indexOf(day);
  if (i >= 0) { if (d.length <= 1) return null; d.splice(i, 1); }
  else { if (d.length >= 6 || day < 0 || day > 6) return null; d.push(day); d.sort((x, y) => x - y); }
  return d;
}
/* Dates des séances du programme sur plusieurs semaines, à partir de la date from (AAAA-MM-JJ, jours déjà passés de la première semaine ignorés) */
function planDates(p, from, weeks) {
  const [y, m, dd] = from.split("-").map(Number), f = new Date(y, m - 1, dd), mon = new Date(y, m - 1, dd - (f.getDay() + 6) % 7);
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const out = [], days = planDays(p);
  for (let k = 0; k < Math.max(1, weeks || 1); k++) days.forEach((day, j) => {
    const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 7 * k + day);
    if (d >= f) out.push({ date: iso(d), j });
  });
  return out;
}
/* Mois glissant : séances du programme à ajouter pour que l’agenda soit rempli jusqu’à today + (days - 1).
   On repart du lendemain de la dernière séance du programme déjà prévue (faite ou non) : une séance supprimée ou reportée n’est jamais recréée. */
function fillPlan(p, events, today, days) {
  days = days || 28;
  const until = isoAdd(today, days - 1);
  let last = "";
  (events || []).forEach(e => { if (e && e.ref && e.ref.k === "t" && e.ref.j != null && e.date > last) last = e.date; });
  const from = last && last >= today ? isoAdd(last, 1) : today;
  if (from > until) return [];
  return planDates(p, from, Math.ceil(days / 7) + 1).filter(x => x.date <= until);
}
/* Report : premier jour à partir de from sans autre séance prévue (non faite) */
function nextFreeDay(events, from, exceptId) {
  for (let k = 0; k < 60; k++) {
    const d = isoAdd(from, k);
    if (!(events || []).some(e => e && e.date === d && !e.fait && e.id !== exceptId)) return d;
  }
  return from;
}

/* ===== Progression, records, superséries, exports =====
   Fonctions pures (sans DOM ni état de l’appli) : elles sont vérifiées par tests/run.js. */

/* Pas de charge d’un exercice */
function chargeStep(e) { if (!e) return 2.5; const L = LOAD[e.id]; if (L && (L[0] === "m" || L[0] === "a")) return 5; if (L && L[0] === "k") return 2; if (e.m.indexOf("halteres") >= 0 || e.m.indexOf("kettlebell") >= 0) return 1; if (e.m.indexOf("pdc") >= 0 && e.m.length === 1) return 1; return 2.5; }
/* Charge suivante (dir = 1) ou précédente (dir = -1) réellement disponible : haltères et kettlebells du commerce, sinon le pas de l’exercice */
function loadStep(id, kg, dir) {
  const L = LOAD[id], k = L && L[0];
  if (k === "d" || k === "k") {
    const list = k === "d" ? DB_KG : KB_KG;
    if (dir > 0) { const n = list.find(x => x > kg + 1e-9); return n != null ? n : kg + (k === "d" ? 2 : 4); }
    const p = list.filter(x => x < kg - 1e-9).pop(); return p != null ? p : Math.max(0, kg - 1);
  }
  return Math.max(0, Math.round((kg + dir * chargeStep(EX_BY_ID[id])) * 100) / 100);
}
/* Charge allégée d’environ 10 % (ou assistance augmentée) après plusieurs séances ratées */
function deloadOf(id, kg) {
  if (isAssist(id)) return loadStep(id, kg, 1);
  const L = LOAD[id], k = L && L[0];
  if (k === "d" || k === "k") { const list = k === "d" ? DB_KG : KB_KG, t = kg * 0.9 + 1e-9, p = list.filter(x => x <= t).pop(); return p != null && p < kg ? p : loadStep(id, kg, -1); }
  const st = chargeStep(EX_BY_ID[id]), v = Math.floor(kg * 0.9 / st + 1e-9) * st;
  return Math.max(0, Math.min(v, kg - st));
}

/* 1RM estimé (formule d’Epley), utile pour comparer 5 × 80 kg et 10 × 70 kg */
function e1rm(r, kg) { if (!kg || !r || r < 1) return 0; if (r === 1) return kg; return Math.round(kg * (1 + Math.min(r, 15) / 30) * 10) / 10; }

/* Conseil pour la prochaine séance d’un exercice.
   lp = dernière performance { sets:[{r,kg,rir}], target, base (reps prévues au départ), feel (1 facile … 4 très dur), fails (séances ratées d’affilée) }
   rir = répétitions encore possibles à la fin de la série (0 à 3, 3 = 3 ou plus).
   Renvoie { last, next, up, reps, why } : why = "up" | "up2" | "reps" | "hold" | "limit" | "hard" | "deload". */
function progress(id, lp, prev) {
  if (!lp || !Array.isArray(lp.sets) || !lp.sets.length) return null;
  const as = isAssist(id), kg = Math.max.apply(null, lp.sets.map(s => s.kg || 0));
  if (!kg && !as) return progressBW(id, lp, prev); /* S6 : poids du corps et exercices chronométrés */
  const T = lp.target || 0, base = lp.base || T, reps = lp.sets.map(s => s.r || 0), minR = Math.min.apply(null, reps);
  const res = { last: kg, next: kg, up: false, reps: 0, why: "hold" };
  if (minR < T) { if ((lp.fails || 0) >= 3) { res.next = deloadOf(id, kg); res.why = "deload"; if (base && base !== T) res.reps = base; } return res; }
  if (lp.feel === 4) { res.why = "hard"; return res; }
  const rirs = lp.sets.map(s => s.rir).filter(x => x != null), minRir = rirs.length ? Math.min.apply(null, rirs) : null;
  /* toutes les séries réussies de justesse, sans aucune répétition en réserve : on consolide.
     S5 (3D) : avec une cible de réserve rirT de 2 ou plus (lp.rirT), aussi quand toutes les séries ont fini au moins 2 répétitions plus près
     de l’échec que prévu (l’estimation est imprécise d’environ 1 répétition, Halperin 2022 : 2 d’écart, c’est vraiment plus dur que prévu). */
  const maxRir = rirs.length ? Math.max.apply(null, rirs) : null, rt = lp.rirT;
  if (rirs.length === lp.sets.length && minR <= T && (maxRir === 0 || (rt >= 2 && maxRir <= rt - 2))) { res.why = "limit"; return res; }
  /* « 3 et + » en réserve n’est un signe de facilité que si la cible était 0 ou 1 */
  const easy = lp.feel === 1 || (minRir != null && minRir >= 3 && !(rt >= 2));
  const dir = as ? -1 : 1, nx = loadStep(id, kg, dir);
  if (as) { res.next = nx; res.up = nx !== kg; res.why = "up"; return res; }
  /* Double progression : quand la marche de charge est grosse (haltères légers, kettlebells), d’abord 2 répétitions de plus */
  const big = (nx - kg) / kg > 0.1;
  if (big && base && minR < base + 2 && !(minRir != null && minRir >= 3)) { res.reps = base + 2; res.why = "reps"; return res; }
  res.next = nx; res.up = true; res.why = "up";
  if (base && base !== T) res.reps = base;
  if (easy && !big && T && (minR >= T + 3 || (minRir != null && minRir >= 3))) { res.next = loadStep(id, nx, 1); res.why = "up2"; }
  return res;
}
/* S6 (phase 3D) : progression au poids du corps (sans charge) et chronométrée (gainage…).
   Double progression appliquée sans charge : quand toutes les séries atteignent la cible, +1 répétition (+2 si c’était facile),
   ou +5 s (+10 s si facile), jusqu’au haut de la fourchette : cible de départ + 5 répétitions, ou durée de départ × 1,5.
   Haut de la fourchette atteint 2 séances de suite (prev = séance précédente) : passer à la version plus dure (HARDER).
   lp = { sets: [{ r } ou { d }], target (reps ou secondes), base, feel } ; renvoie le même objet que progress, avec bw: true,
   why = "hold" | "hard" | "reps" (reps = répétitions à viser) | "time" (duree = secondes à viser) | "harder" (harder = exercice) | "top". */
const BW_TOP_REPS = 5, BW_TOP_TIME = 1.5;
function progressBW(id, lp, prev) {
  const res = { last: 0, next: 0, up: false, reps: 0, why: "hold", bw: true };
  const timed = lp.sets.every(s => s && s.d > 0 && !(s.r > 0)), T = lp.target || 0, base = lp.base || T;
  const val = (x, t) => { const v = (x && Array.isArray(x.sets) ? x.sets : []).map(s => (t ? (s && s.d) : (s && s.r)) || 0); return v.length ? Math.min.apply(null, v) : 0; };
  const cur = val(lp, timed); if (!T || cur < T) return res;
  if (lp.feel === 4) { res.why = "hard"; return res; }
  const rirs = lp.sets.map(s => s.rir).filter(x => x != null), easy = lp.feel === 1 || (rirs.length > 0 && Math.min.apply(null, rirs) >= 3);
  const top = timed ? Math.round(base * BW_TOP_TIME / 5) * 5 : base + BW_TOP_REPS;
  if (cur >= top) {
    if (prev && val(prev, timed) >= top) { const h = HARDER[id]; if (h && EX_BY_ID[h]) { res.why = "harder"; res.harder = h; return res; } }
    res.why = "top"; if (timed) res.duree = top; else res.reps = top; return res;
  }
  if (timed) { res.why = "time"; res.duree = Math.min(top, Math.round(cur / 5) * 5 + (easy ? 10 : 5)); }
  else { res.why = "reps"; res.reps = Math.min(top, cur + (easy ? 2 : 1)); }
  return res;
}
/* Dernières performances d’un exercice d’après l’historique (la plus récente d’abord) : { ts, sets, target, base, feel }.
   Sert à S6 : séance précédente (2 séances de suite en haut de la fourchette) et exercices chronométrés (sans référence lastPerf). */
function histPerfs(hist, id, n) {
  const out = [];
  (hist || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).some(h => {
    if (!h || h.dl || !Array.isArray(h.log)) return false;
    const l = h.log.find(x => x && x.id === id && !x.warm && !x.cool && Array.isArray(x.sets) && x.sets.length); if (!l) return false;
    const ts = l.sets.find(s => s && "t" in s), rs = l.sets.filter(s => s && s.r != null);
    out.push({ ts: h.ts, sets: l.sets.map(s => Object.assign({}, s)), target: ts ? ts.t : (rs.length ? Math.max.apply(null, rs.map(s => s.r)) : 0), base: l.b || 0, feel: h.ressenti || 0 });
    return out.length >= (n || 2);
  });
  return out;
}
/* Garde-fou S1-a : la séance prévue vise un nombre de répétitions très différent de la dernière fois (écart ≥ 3,
   ex. 5 × 5 à 100 kg puis 10 répétitions). Augmenter la charge de la dernière fois donnerait une charge irréalisable :
   on la convertit par le 1RM estimé (Epley) avec une marge de prudence de 5 %, arrondie vers le bas au matériel.
   Renvoie la charge convertie, ou null si la conversion ne s’applique pas (écart < 3, exercice sans charge, assistance, durée). */
const CONV_GAP = 3, CONV_MARGIN = 0.05;
/* Plus grande charge réellement disponible inférieure ou égale à kg (minimum du matériel respecté) */
function floorLoad(id, kg, barre) {
  const L = LOAD[id], k = L && L[0];
  if (k === "d" || k === "k") { const list = k === "d" ? DB_KG : KB_KG, p = list.filter(x => x <= kg + 1e-9).pop(); return p != null ? p : list[0]; }
  const st = chargeStep(EX_BY_ID[id]), v = Math.round(Math.floor(kg / st + 1e-9) * st * 100) / 100;
  const min = { b: barre || 20, e: 10, s: 15, m: 5, c: 2.5 }[k] || 0;
  return Math.max(min, v);
}
function convertLoad(id, lp, targetReps, barre) {
  if (!lp || !Array.isArray(lp.sets) || !lp.sets.length || !(targetReps > 0)) return null;
  const L = LOAD[id];
  if (isAssist(id) || (L && (L[0] === "x" || (L[2] || "").indexOf("w") >= 0))) return null;
  const sets = lp.sets.filter(s => s && s.kg > 0 && s.r > 0);
  if (!sets.length) return null;
  const ref = lp.target || Math.min.apply(null, sets.map(s => s.r));
  if (Math.abs(targetReps - ref) < CONV_GAP) return null;
  /* la série la plus lourde, avec le moins de répétitions faites à cette charge (estimation prudente) */
  const kg = Math.max.apply(null, sets.map(s => s.kg)), r = Math.min.apply(null, sets.filter(s => s.kg === kg).map(s => s.r));
  const rm = kg * (1 + Math.min(r, 15) / 30);
  return floorLoad(id, rm / (1 + Math.min(targetReps, 15) / 30) * (1 - CONV_MARGIN), barre);
}
/* S1-b (usage, phase 3D) : référence qui sert à la charge proposée pour un exercice visé à « reps » répétitions.
   La référence de la même zone de répétitions (refs[id][zone], zones de zoneOf) si elle existe : le squat progresse ainsi
   séparément à 5 et à 10 répétitions ; sinon la dernière performance (lastPerf), que convertLoad convertit si l’écart est grand.
   Exercice en durée (reps = 0) : la dernière performance. */
function refFor(refs, lastPerf, id, reps) {
  const z = reps > 0 && refs && refs[id] ? refs[id][zoneOf(reps)] : null;
  if (z && Array.isArray(z.sets) && z.sets.length) return z;
  return (lastPerf && lastPerf[id]) || null;
}
/* S8 : la séance vise 1 ou 2 répétitions de moins que la référence (palier 4 : 10 → 8 sur les gros exercices).
   La progression normale garderait la charge faite à 10 : trop légère pour 8. On convertit par le 1RM estimé (Epley),
   sans marge (l’écart est petit, la cible de répétitions en réserve garde la prudence), arrondi vers le bas au matériel,
   et jamais en dessous de la progression normale. Seulement si la dernière séance a été réussie (conseil « up »).
   Renvoie la charge, ou null si la règle ne s’applique pas. */
function s8Load(id, lp, reps, sg, barre) {
  if (!lp || !sg || (sg.why !== "up" && sg.why !== "up2") || !(reps > 0) || isAssist(id)) return null;
  const L = LOAD[id]; if (L && (L[0] === "x" || (L[2] || "").indexOf("w") >= 0)) return null;
  const sets = (lp.sets || []).filter(s => s && s.kg > 0 && s.r > 0); if (!sets.length) return null;
  const ref = lp.target || Math.min.apply(null, sets.map(s => s.r)), gap = ref - reps;
  if (gap < 1 || gap >= CONV_GAP) return null;
  const kg = Math.max.apply(null, sets.map(s => s.kg)), r = Math.min.apply(null, sets.filter(s => s.kg === kg).map(s => s.r));
  const v = floorLoad(id, kg * (1 + Math.min(r, 15) / 30) / (1 + Math.min(reps, 15) / 30), barre);
  return Math.max(sg.next, v);
}
/* Nombre de séances ratées d’affilée à la même charge, à enregistrer avec la nouvelle performance */
function failCount(prev, sets, target) {
  const kg = Math.max.apply(null, sets.map(s => s.kg || 0));
  if (sets.every(s => (s.r || 0) >= (target || 0))) return 0;
  const pk = prev && prev.sets && prev.sets.length ? Math.max.apply(null, prev.sets.map(s => s.kg || 0)) : null;
  return prev && pk !== null && Math.abs(pk - kg) < 1e-9 ? (prev.fails || 0) + 1 : 1;
}

/* Superséries : it.ss = enchaîné avec l’exercice suivant, sans repos entre les deux (séries classiques seulement) */
function linked(se, i) { const a = se.items[i], b = se.items[i + 1]; return se.mode !== "circuit" && !!(a && b && a.ss && !a.cool && !b.cool && !a.warm && !b.warm); }
/* Groupes d’exercices consécutifs (un exercice seul forme un groupe d’un élément) */
function ssGroups(se) {
  const out = []; let cur = null;
  se.items.forEach((it, i) => { if (it.cool || it.warm) return; if (!cur) { cur = [i]; out.push(cur); } else cur.push(i); if (!linked(se, i)) cur = null; });
  return out;
}
/* Étapes d’une séance : séries et repos */
function buildSteps(se) {
  const w = [], cool = [];
  const main = se.items.map((it, i) => i).filter(i => !se.items[i].cool && !se.items[i].warm);
  se.items.forEach((it, i) => { if (it.cool) cool.push(i); });
  /* échauffement d’abord */
  se.items.forEach((it, i) => { if (!it.warm) return; const n = Math.max(1, it.series || 1); for (let s = 1; s <= n; s++) w.push({ k: "work", i, set: s, of: n, warm: true }); });
  if (se.mode === "circuit") {
    const T = Math.max(1, se.tours || 1);
    for (let t = 1; t <= T; t++) main.forEach(i => w.push({ k: "work", i, set: t, of: T }));
  } else ssGroups(se).forEach(G => {
    const n = Math.max.apply(null, G.map(i => Math.max(1, se.items[i].series || 1)));
    for (let s = 1; s <= n; s++) G.forEach((i, j) => {
      const it = se.items[i], m = Math.max(1, it.series || 1);
      if (s > m) return;
      const st = { k: "work", i, set: s, of: m, fail: !!it.echec && s === m };
      if (G.length > 1) { st.g = G[0]; st.gi = j; st.gn = G.length; }
      w.push(st);
    });
  });
  cool.forEach(i => { const n = Math.max(1, se.items[i].series || 1); for (let s = 1; s <= n; s++) w.push({ k: "work", i, set: s, of: n, cool: true }); });
  return withRests(se, w);
}
/* Ajoute les repos entre les séries (sert aussi quand on repousse ou retire un exercice en cours de séance) */
function withRests(se, works) {
  const out = [];
  works.forEach((w, j) => {
    const p = works[j - 1];
    if (p) {
      const pit = se.items[p.i];
      let r = null;
      if (p.warm && !w.warm) r = { k: "rest", d: 20, fromWarm: true };
      else if (p.warm) r = { k: "rest", d: pit.repos || 10 };
      else if (w.cool && !p.cool) r = { k: "rest", d: 20, toCool: true };
      else if (p.cool) r = { k: "rest", d: pit.repos || 10 };
      else if (se.mode === "circuit") r = w.set !== p.set ? { k: "rest", d: se.roundRest || 60, round: true } : { k: "rest", d: pit.repos || 0 };
      else if (p.g != null && p.g === w.g && p.i !== w.i) r = w.set === p.set ? null : { k: "rest", d: pit.repos || 0, round: true };
      else r = p.i === w.i ? { k: "rest", d: pit.repos || 0 } : { k: "rest", d: Math.max(30, Math.min(pit.repos || 60, 90)), between: true };
      if (r && r.d > 0) out.push(r);
    }
    out.push(w);
  });
  return out;
}

/* ===== Remplacement d’exercice, muscles de la semaine, régularité, semaine allégée ===== */

/* Exercices de remplacement : mêmes muscles principaux, même façon de compter (reps ou temps), autre matériel de préférence.
   opts = { exclude: [ids déjà dans la séance], mat: [matériel de l’exercice remplacé], low: éviter les sauts, lvl: niveau max, deb: débutant (pas d’exercice de DEB_GUIDE) } */
function altsFor(id, opts) {
  const e = EX_BY_ID[id]; if (!e) return [];
  opts = opts || {};
  const ex = opts.exclude || [], mat = e.m;
  return EX.filter(x => x.id !== id && ex.indexOf(x.id) < 0 && x.t === e.t && x.g !== "etirements" && x.g !== "mobilite" && (!opts.low || !x.imp) && (!opts.lvl || x.l <= opts.lvl) && (!opts.deb || !DEB_GUIDE[x.id]))
    .map(x => {
      const pp = x.p.filter(m => e.p.indexOf(m) >= 0).length; if (!pp) return null;
      const ss = x.s.filter(m => e.s.indexOf(m) >= 0 || e.p.indexOf(m) >= 0).length;
      const miss = e.p.filter(m => x.p.indexOf(m) < 0).length;
      const other = x.m.some(m => mat.indexOf(m) < 0) && !mat.every(m => x.m.indexOf(m) >= 0);
      const extra = x.p.filter(m => e.p.indexOf(m) < 0).length, same = !miss && !extra;
      const w0 = s => s.n.split(/[\s’']/)[0].toLowerCase(); /* même famille de mouvement : développé, tirage, curl, pont… */
      return { x, sc: pp * 4 + ss - miss * 2 - extra + (same ? 3 : 0) + (x.g === e.g ? 2 : 0) + (w0(x) === w0(e) ? 1.5 : 0) + (other ? 1 : 0) - Math.abs(x.l - e.l) * 0.5 };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc || a.x.n.localeCompare(b.x.n)).slice(0, opts.n || 5).map(o => o.x.id);
}

/* Dates (texte AAAA-MM-JJ) */
function isoAdd(iso, n) { const [y, m, d] = iso.split("-").map(Number), t = new Date(y, m - 1, d + n); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); }
function isoMon(iso) { const [y, m, d] = iso.split("-").map(Number); return isoAdd(iso, -((new Date(y, m - 1, d).getDay() + 6) % 7)); }

/* Semaine allégée : conseillée après « every » semaines actives d’affilée (au moins une séance), depuis la dernière semaine allégée */
function deloadDue(hist, today, lastMon, every) {
  const w = weekCounts(hist, today, 30).slice(0, -1); /* semaines terminées */
  let s = 0;
  for (let k = w.length - 1; k >= 0; k--) { if (lastMon && w[k].mon <= lastMon) break; if (!w[k].n) break; s++; }
  return { weeks: s, due: s >= every };
}
/* ===== Paliers : le programme évolue toutes les 4 semaines d’entraînement =====
   Un palier = 4 semaines de séances (4 × séances par semaine), compté en séances faites : une pause ne fait pas avancer.
   Palier 2 : une série de plus sur les gros exercices. Palier 3 : versions plus dures des exercices.
   Palier 4 et suivants : plus lourd (moins de répétitions) pour muscle/force/forme, pauses plus courtes pour perte/tonus. */
const PHASE_WEEKS = 4;
/* Passage de niveau automatique après ce nombre de paliers terminés (débutant : 3 paliers ≈ 3 mois) */
const LEVEL_UP_PHASES = { 1: 3, 2: 6 };
const PHASE_NAMES = ["Découverte", "Construction", "Progression", "Intensité"];
const phaseName = n => PHASE_NAMES[Math.min(PHASE_NAMES.length, Math.max(1, n || 1)) - 1];
const phasePer = p => PHASE_WEEKS * planDays(p).length;
/* Ce qui change à un palier (texte) */
function phaseChanges(n, objectif) {
  if (n <= 1) return ["Mise en route : tu prends tes repères avec les séances de ton niveau, les poids montent séance après séance."];
  if (n === 2) return ["Une série de plus sur les gros exercices (squat, développé, tirage…)."];
  if (n === 3) return ["Des versions plus dures de certains exercices (par exemple pompes classiques au lieu de pompes sur les genoux).", "La série en plus du palier 2 est conservée."];
  return [["perte", "tonus"].indexOf(objectif) >= 0 ? "Des pauses plus courtes entre les séries pour brûler plus." : "Plus lourd : 2 mouvements de moins par série sur les gros exercices, avec une charge plus élevée.", "Les séries en plus et les exercices plus durs sont conservés."];
}
/* Progressions naturelles : machine → haltères → barre, version aidée → version complète (mêmes muscles) */
const HARDER = {
  "pompes-genoux": "pompes", "pompes-inclinees": "pompes", "pompes": "pompes-declinees", "presse-pecs": "dc-halteres", "smith-incline": "di-halteres", "dc-halteres": "dc-barre", "di-halteres": "di-barre",
  "presse-epaules": "dm-halteres", "dm-halteres": "dm-barre", "tirage-horizontal": "rowing-haltere", "rowing-machine": "rowing-haltere", "rowing-haltere": "rowing-barre",
  "tractions-assistees": "tractions", "dips-assiste": "dips-triceps", "squat-pdc": "goblet-squat", "squat-smith": "goblet-squat", "goblet-squat": "squat-barre",
  "fentes-arriere": "fentes-marchees", "fentes-avant": "fentes-marchees", "pont-fessier": "hip-thrust", "sdt-roumain-halteres": "sdt-roumain", "leg-curl-assis": "leg-curl-allonge",
  "crunch": "crunch-inverse", "releve-genoux-chaise": "releve-jambes-suspendu", "planche": "hollow", "curl-halteres": "curl-incline", "extension-corde": "extension-nuque-poulie"
};
/* Version plus dure d’un exercice, si elle convient au profil (niveau, sauts, corpulence) et n’est pas déjà dans la séance */
function harderEx(id, ctx, used) {
  const e = EX_BY_ID[id]; if (!e) return null;
  const ok = x => x && x.id !== id && x.t === e.t && x.l <= (ctx.lvl === 1 ? 2 : 3) && !(ctx.low && x.imp) && !(ctx.heavy && BMI_SWAP[x.id]) && used.indexOf(x.id) < 0
    && !(ctx.lvl === 1 && (DEB_GUIDE[x.id] || (isGuided(e) && !isGuided(x)))); /* débutant : jamais la barre libre, et le guidé reste guidé */
  const h = EX_BY_ID[HARDER[id]];
  return ok(h) ? h : (EX.find(x => x.deb === id && ok(x)) || null);
}
function phaseAdjust(out, phase, ctx, notes, roles) {
  const ph = Math.max(1, Math.floor(+phase || 1));
  if (ph < 2 || out.mode === "circuit") return out;
  out.items.forEach((it, k) => {
    const role = (roles || [])[k];
    if (role !== "C" && role !== "I" && role !== "G") return;
    if (role === "C" && it.series < 5) it.series++;
    if (ph >= 3) { const h = harderEx(it.id, ctx, out.items.map(x => x.id)); if (h) { it.id = h.id; if (!ECH.has(h.id)) it.echec = 0; } }
    if (ph >= 4 && role !== "G") {
      if (["perte", "tonus"].indexOf(ctx.p.objectif) >= 0) it.repos = Math.max(30, it.repos - 15);
      else if (role === "C" && it.reps > 6) it.reps = Math.max(5, it.reps - 2);
    }
  });
  notes.add("Palier " + ph + " : " + phaseName(ph).toLowerCase());
  return out;
}
/* Une séance de plus faite : avance dans le palier, passe au palier suivant.
   S4 (phase 3D, décision 4) : le niveau ne change plus jamais tout seul. Le passage est proposé (levelSuggest) et seulement fait
   si la personne accepte (levelAccept). opts.up = niveau à prendre à ce changement de palier : sert uniquement à rejouer un passage
   automatique d’avant 3D déjà enregistré dans les bilans (replayProgress). */
function progressTick(p, opts) {
  p = p || {};
  const per = phasePer(p);
  let phase = Math.max(1, p.phase || 1), done = (p.phaseDone || 0) + 1, niveau = p.niveau || "debutant", phaseUp = false, levelUp = false;
  if (done >= per) {
    done = 0; phase++; phaseUp = true;
    if (opts && opts.up && NIV_KEYS[opts.up] && opts.up !== niveau) { niveau = opts.up; phase = 1; levelUp = true; }
  }
  return { phase, phaseDone: done, niveau, phaseUp, levelUp, per };
}
/* Charges multipliées par f (arrondies au matériel disponible) */
function scaleCharges(se, f) {
  se.items.forEach(it => {
    if (it.cool || it.warm) return;
    if (it.charge > 0 && !isAssist(it.id)) { const e = EX_BY_ID[it.id], L = LOAD[it.id], t = it.charge * f; it.charge = L && (L[0] === "d" || L[0] === "k") ? ((L[0] === "d" ? DB_KG : KB_KG).filter(x => x <= t + 1e-9).pop() || it.charge) : Math.max(0, Math.round(t / chargeStep(e)) * chargeStep(e)); }
  });
  return se;
}
/* Séance allégée : environ 40 % de séries en moins, charges à 85 % */
function deloadSe(se) {
  se.items.forEach(it => {
    if (it.cool) return;
    if (se.mode !== "circuit" && it.series > 1) it.series = Math.max(1, Math.round(it.series * 0.6));
    if (it.charge > 0 && !isAssist(it.id)) { const e = EX_BY_ID[it.id], L = LOAD[it.id], t = it.charge * 0.85; it.charge = L && (L[0] === "d" || L[0] === "k") ? ((L[0] === "d" ? DB_KG : KB_KG).filter(x => x <= t + 1e-9).pop() || it.charge) : Math.max(0, Math.round(t / chargeStep(e)) * chargeStep(e)); }
    if (it.charge >= 0 && isAssist(it.id)) it.charge = loadStep(it.id, it.charge, 1);
    rirEasy(it);
  });
  if (se.mode === "circuit" && se.tours > 2) se.tours = se.tours - 1;
  return se;
}

/* ================= Références par zone et palier recalculés depuis l’historique (S1-b format, D3 — phase 3B) ================= */
/* Séance qui compte pour le palier (la mobilité seule ne compte pas, un exercice fait seul depuis sa fiche non plus : solo) */
const countable = h => !!h && h.kind !== "mob" && !h.solo;
/* Zone de répétitions (S1-b) : force ≤ 6, muscle 7 à 12, endurance ≥ 13 ; cible inconnue ou nulle : muscle */
const REF_ZONES = ["force", "muscle", "endurance"];
function zoneOf(reps) { return !(reps > 0) ? "muscle" : reps <= 6 ? "force" : reps <= 12 ? "muscle" : "endurance"; }
/* Répétitions visées d’une référence : sa cible, sinon la plus grande répétition faite */
function refReps(lp) { if (!lp || !Array.isArray(lp.sets)) return 0; return lp.target || Math.max.apply(null, lp.sets.map(s => (s && s.r) || 0).concat([0])); }
/* Applique une séance enregistrée (h, entrée de l’historique) aux références : dernière performance par exercice (lastPerf)
   et par exercice et zone (refs). C’est exactement ce que fait l’enregistrement d’une séance (saveRunHistory) :
   - semaine allégée (h.dl), échauffement et étirements : pas de référence ; séries sans répétitions (durée) : ignorées ;
   - cible = t enregistré dans les séries (depuis 3B) ; séances plus anciennes, sans t : la plus grande répétition faite ;
   - une référence plus récente n’est jamais remplacée par une séance plus ancienne.
   only : ne traiter que cet exercice. Modifie lastPerf et refs. */
function refStep(lastPerf, refs, h, only) {
  if (!h || h.dl || !Array.isArray(h.log)) return;
  h.log.forEach(l => {
    if (!l || l.warm || l.cool || !Array.isArray(l.sets) || (only && l.id !== only)) return;
    const rs = l.sets.filter(s => s && s.r != null); if (!rs.length) return;
    if (lastPerf[l.id] && (lastPerf[l.id].ts || 0) > (h.ts || 0)) return;
    const sets = rs.map(s => Object.assign({ r: s.r, kg: s.kg || 0 }, s.rir != null ? { rir: s.rir } : {}));
    const ts = rs.find(s => "t" in s), target = ts ? ts.t : Math.max.apply(null, sets.map(s => s.r || 0));
    const lp = { d: h.date, ts: h.ts, sets, target, base: l.b || target, feel: h.ressenti || 0, fails: failCount(lastPerf[l.id], sets, target) };
    const rtS = rs.find(s => typeof s.rt === "number"); if (rtS) lp.rirT = rtS.rt; /* S5 : cible de réserve de la séance (depuis 3D) */
    lastPerf[l.id] = lp;
    (refs[l.id] = refs[l.id] || {})[zoneOf(target)] = lp;
  });
}
/* D3 : références recalculées à partir de l’historique (après suppression d’une séance, plus tard après modification).
   Point de départ de chaque exercice : la référence v1 conservée (legacyRefs), car les séances d’avant 3B n’ont pas la cible t ;
   - si la séance d’origine de cette référence (legacySrc) est encore là : on part de la référence et on rejoue les séances suivantes ;
   - si elle a été supprimée : la référence v1 est abandonnée, on rejoue toutes les séances de l’exercice ;
   - origine inconnue (séance absente de l’historique) : on part de la référence et on rejoue les séances plus récentes.
   Renvoie { lastPerf, refs } (nouveaux objets ; rien n’est modifié). */
function rebuildRefs(historique, legacyRefs, legacySrc) {
  const hist = (Array.isArray(historique) ? historique : []).filter(h => h && Array.isArray(h.log)).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const L = legacyRefs && typeof legacyRefs === "object" ? legacyRefs : {}, src = legacySrc && typeof legacySrc === "object" ? legacySrc : {};
  const byId = {}, ids = [];
  const addId = id => { if (ids.indexOf(id) < 0) ids.push(id); };
  hist.forEach(h => { if (h.id) byId[h.id] = h; h.log.forEach(l => { if (l && l.id) addId(l.id); }); });
  Object.keys(L).forEach(addId);
  const lastPerf = {}, refs = {};
  ids.forEach(id => {
    const lp0 = L[id], lp = {}, rf = {};
    let from = -Infinity;
    if (lp0 && Array.isArray(lp0.sets) && lp0.sets.length) {
      const sid = src[id], a = sid ? byId[sid] : null;
      /* séance d’origine modifiée depuis (D4, marque ed) : la référence v1 ne correspond plus, on rejoue tout l’exercice */
      const edDay = !sid && hist.some(h => h.ed && h.date === lp0.d && h.log.some(l => l && l.id === id)); /* origine inconnue, mais séance du même jour modifiée */
      if ((!sid && !edDay) || (a && !a.ed)) {
        const t0 = lp0.ts || (lp0.d && /^\d{4}-\d{2}-\d{2}$/.test(lp0.d) ? new Date(+lp0.d.slice(0, 4), +lp0.d.slice(5, 7) - 1, +lp0.d.slice(8, 10) + 1).getTime() - 1 : 0);
        from = a ? (a.ts || 0) : t0;
        lp[id] = JSON.parse(JSON.stringify(lp0)); rf[id] = { [zoneOf(refReps(lp0))]: lp[id] };
      }
    }
    hist.forEach(h => { if ((h.ts || 0) > from) refStep(lp, rf, h, id); });
    if (lp[id]) { lastPerf[id] = lp[id]; refs[id] = rf[id]; }
  });
  return JSON.parse(JSON.stringify({ lastPerf, refs }));
}
/* Une séance de plus appliquée au profil p (palier, niveau, historique des paliers pour les bilans) : r = progressTick(p) */
function tickApply(p, r, date) {
  if (r.phaseUp) { p.phases = (p.phases || []).concat([{ n: p.phase || 1, niv: p.niveau, from: p.phaseStart || date, to: date, up: r.levelUp ? r.niveau : undefined }]).slice(-40); p.phaseStart = date; }
  if (r.levelUp && p.simple == null && (NIV_KEYS[p.niveau] || 1) === 1) p.simple = true; /* le mode simple ne disparaît pas sans prévenir */
  Object.assign(p, { phase: r.phase, phaseDone: r.phaseDone, niveau: r.niveau });
}
/* Palier rejoué depuis le début sur les séances qui comptent (même logique que la première ouverture, initProgress),
   au niveau de départ (celui du premier palier enregistré, sinon le niveau actuel). */
function replayProgress(historique, profile) {
  const p = profile || {}, ph0 = Array.isArray(p.phases) && p.phases[0];
  const q = JSON.parse(JSON.stringify(p));
  const list = (Array.isArray(historique) ? historique : []).filter(countable).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  Object.assign(q, { phase: 1, phaseDone: 0, phases: [], niveau: ph0 && ph0.niv ? ph0.niv : (p.niveau || "debutant"), phaseStart: list.length ? list[0].date : p.phaseStart });
  /* un passage de niveau automatique d’avant 3D (bilan avec up, sans man) est rejoué au même changement de palier */
  list.forEach(h => { const rec = Array.isArray(p.phases) ? p.phases[(q.phases || []).length] : null; tickApply(q, progressTick(q, rec && rec.up && !rec.man ? { up: rec.up } : null), h.date); });
  if (p.simple === undefined) delete q.simple; else q.simple = p.simple;
  if (q.bilanNew != null && !(q.phases && q.phases[q.bilanNew])) delete q.bilanNew;
  return JSON.parse(JSON.stringify(q));
}
/* Une séance de moins (sans rejouer) : dernière séance du palier retirée, palier précédent rouvert si besoin */
function untickProgress(profile) {
  const q = JSON.parse(JSON.stringify(profile || {}));
  if ((q.phaseDone || 0) > 0) q.phaseDone--;
  else if (Array.isArray(q.phases) && q.phases.length) {
    const last = q.phases.pop();
    q.phase = last.n || 1; if (last.up) q.niveau = last.niv; q.phaseStart = last.from;
    q.phaseDone = Math.max(0, phasePer(Object.assign({}, q, { niveau: last.niv })) - 1);
  }
  if (q.bilanNew != null && !(q.phases && q.phases[q.bilanNew])) delete q.bilanNew;
  return q;
}
/* D3 : palier après la suppression de la séance removed (historique = séances restantes). Renvoie un nouveau profil.
   Si le palier actuel correspond bien à l’historique (rejoué avec la séance), on rejoue sans elle : comme si elle n’avait jamais existé.
   Sinon (jours changés en cours de route, niveau choisi à la main, ancienne suppression non décomptée…) on retire seulement
   une séance au compteur, pour ne rien bouleverser. */
function rebuildProgress(historique, profile, removed) {
  const p = profile || {};
  if (removed !== undefined && !countable(removed)) return JSON.parse(JSON.stringify(p));
  if (removed === undefined) return replayProgress(historique, p);
  const key = q => [q.phase || 1, q.phaseDone || 0, q.niveau || "debutant"].join("|");
  const before = replayProgress((historique || []).concat([removed]), p);
  return key(before) === key(p) ? replayProgress(historique, p) : untickProgress(p);
}
