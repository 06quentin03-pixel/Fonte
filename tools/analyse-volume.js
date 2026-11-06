/* Outil d’audit (phase 1) : séries hebdomadaires par muscle et fréquence pour chaque objectif / niveau / nombre de jours / palier.
   Usage : node tools/analyse-volume.js   (lecture seule, ne modifie rien). Profil de référence : homme 30 ans, 180 cm, 80 kg.
   Séries comptées : 1 par série pour un muscle principal, ½ pour un secondaire ; « (n×) » = séances où le muscle est principal. */
const G=require("../tests/charger").charger(); /* moteurs js/engine-*.js (phase 3A) */
const M=["pecs","dorsaux","rhomboides","epaules_ant","epaules_lat","epaules_post","biceps","triceps","quadriceps","ischios","fessiers","mollets","abdos"];
function week(p,iso){const pr=G.programme(p);const v={},f={};const days=[];
 pr.ids.forEach((id0,j)=>{const id=G.weekVariant(id0,iso);const se=G.prescribe(G.TPL_BY_ID[id],G.profFor(p,pr.objs[j]));days.push(id+"("+Math.round(G.estDuree(se)/60)+"min)");const hit={};
  se.items.forEach(it=>{const e=G.EX_BY_ID[it.id];if(!e||["cardio","mobilite","etirements"].includes(e.g))return;const n=se.mode==="circuit"?(se.tours||1):it.series;
   e.p.forEach(m=>{v[m]=(v[m]||0)+n;hit[m]=1});e.s.forEach(m=>{if(!e.p.includes(m)){v[m]=(v[m]||0)+n/2;}})});
  Object.keys(hit).forEach(m=>f[m]=(f[m]||0)+1);});
 return {days,v,f};}
const base={sexe:"H",age:30,taille:180,poids:80,barre:20};
const args=process.argv.slice(2);
for(const obj of ["muscle","force","perte","tonus","forme"])for(const niveau of ["debutant","intermediaire","avance"])for(const jours of [2,3,4,5]){
 for(const phase of [1,2]){
 const p=Object.assign({},base,{objectif:obj,objectifs:[obj],niveau,jours,phase});const w=week(p,"2026-11-02");
 console.log(`${obj}/${niveau}/${jours}j/palier${phase}: ${w.days.join(", ")}`);
 console.log("   séries/sem: "+M.map(m=>m+"="+(Math.round((w.v[m]||0)*10)/10)+"("+(w.f[m]||0)+"x)").join(" "));}}
