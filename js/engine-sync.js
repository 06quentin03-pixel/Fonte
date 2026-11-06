"use strict";
/* ===== Fonte · moteur « sauvegarde et synchro en ligne » (phase 3C : D1, D7, D9) =====
   Ce fichier ne connaît pas Firebase : il décide quoi fusionner, quoi envoyer, quoi mettre à la corbeille, et combien d’écritures
   sont permises. app.js lui fournit un « api » branché sur Firebase ; tests/run.js lui fournit un faux Firestore.
   Principes (docs/FORMAT_DONNEES.md, section 5) :
   - le téléphone reste la référence : tout marche sans réseau, une erreur de synchro ne retire jamais rien des données locales ;
   - une séance = un document en ligne (users/{uid}/seances/{id}) ; le reste du profil = un document users/{uid}, découpé en rubriques ;
   - une suppression = une marque « del » + date ; la séance reste 30 jours dans la corbeille (restaurable), puis le document est effacé ;
   - on ne lit que ce qui a changé depuis la dernière fois (date du serveur « srv ») ;
   - toute donnée reçue passe par migrate ; une donnée d’un format plus récent arrête la synchro et n’est jamais écrasée ;
   - un limiteur borne le nombre d’écritures (protection contre un bug qui écrirait en boucle et épuiserait le quota gratuit).
   Fichiers chargés dans l’ordre par de simples <script src> : … → engine-user.js → engine-sync.js → app.js. */

const CS_TRASH_MS = 30 * 864e5;           /* corbeille : 30 jours */
const CS_TRASH_MAX = 200;                 /* séances gardées au plus dans la corbeille locale */
const CS_LIM_MIN = 60, CS_LIM_DAY = 1500; /* écritures permises par minute et par jour, par profil et par appareil (quota gratuit : 20 000 par jour pour tout le projet) */
const CS_BATCH = 100;                     /* documents par envoi groupé (Firestore : 500 au plus) */
const CS_USER_MAX = 800000, CS_SE_MAX = 200000; /* tailles maximales en caractères (Firestore : 1 Mio par document) */
const CS_DEL_MAX = 300;                   /* séances supprimées dont on garde la trace (histDel), comme pruneDel */
/* Rubriques du document users/{uid} (chacune enregistrée en texte JSON, avec sa date de modification u[rubrique]) */
const CS_SECTIONS = ["profile", "notes", "mesures", "mesSeances", "deload", "imports", "agenda", "legacy", "clear"];

/* ---------- Petits outils ---------- */
const csSig = v => sigOf(JSON.stringify(v === undefined ? null : v));
const csParse = s => { if (typeof s !== "string") return undefined; try { return JSON.parse(s); } catch (e) { return undefined; } };
const csDay = now => Math.floor(now / 864e5), csMin = now => Math.floor(now / 6e4);
const csDel36 = t => "~" + Math.max(0, Math.round(t || 0)).toString(36); /* « ~ » n’apparaît jamais dans une empreinte (sigOf : hexadécimal) */
const csDelAt = s => (typeof s === "string" && s[0] === "~" ? parseInt(s.slice(1), 36) || 0 : 0);
const csIsDel = s => typeof s === "string" && s[0] === "~";
/* Séance valide (reçue d’un autre appareil) */
const csSeOk = (h, id) => isObj(h) && typeof h.id === "string" && (id == null || h.id === id) && typeof h.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(h.date) && Array.isArray(h.log);
/* Empreinte d’une séance : ce qui a été envoyé ou reçu tel quel n’est pas renvoyé */
const csSeSig = h => csSig(h);

/* État de synchro d’un profil (clé fonte:p:<id>:sync) */
function csMeta(m) {
  const o = Object.assign({ v: 1, cfg: null, email: "", uid: "", cursor: 0, sent: {}, ru: null, seen: {}, skip: {}, lim: {}, last: 0, blocked: "" }, isObj(m) ? clone(m) : {});
  ["sent", "seen", "skip", "lim"].forEach(k => { if (!isObj(o[k])) o[k] = {}; });
  if (o.ru != null && !isObj(o.ru)) o.ru = null;
  return o;
}
/* Remet à zéro ce qui dépend du compte (déconnexion, autre compte) : les données locales ne sont pas touchées */
function csMetaReset(m) { const o = csMeta(m); Object.assign(o, { uid: "", cursor: 0, sent: {}, ru: null, seen: {}, skip: {}, last: 0, blocked: "" }); return o; }

/* ---------- Rubriques ---------- */
function csSection(st, k) {
  switch (k) {
    case "legacy": return { legacyRefs: st.legacyRefs || {}, legacySrc: st.legacySrc || {} };
    case "clear": return { histClear: st.histClear || 0, histDel: st.histDel || {} };
    default: return st[k];
  }
}
function csEmpty(k, v) {
  if (v == null) return true;
  if (k === "profile") return !(isObj(v) && (v.sexe || v.prenom || v.poids || v.age || v.onb)); /* le palier seul (posé à la première ouverture) ne compte pas */
  if (k === "legacy") return !Object.keys(v.legacyRefs || {}).length;
  if (k === "clear") return !v.histClear && !Object.keys(v.histDel || {}).length;
  if (Array.isArray(v)) return !v.length;
  if (isObj(v)) return !Object.keys(v).length;
  return true;
}
/* Valeur reçue nettoyée (types attendus), ou undefined si inutilisable */
function csClean(k, v) {
  switch (k) {
    case "profile": return isObj(v) ? normProfile(v) : undefined;
    case "notes": case "deload": return isObj(v) ? v : undefined;
    case "mesures": return Array.isArray(v) ? v.filter(m => m && typeof m.date === "string") : undefined;
    case "mesSeances": return Array.isArray(v) ? v.filter(m => m && Array.isArray(m.items)) : undefined;
    case "imports": return Array.isArray(v) ? v.filter(i => i && i.id).map(i => Object.assign({}, i, { events: cleanEvents(i.events) })) : undefined;
    case "agenda": return Array.isArray(v) ? cleanEvents(v) : undefined;
    case "legacy": return isObj(v) && isObj(v.legacyRefs) ? { legacyRefs: v.legacyRefs, legacySrc: isObj(v.legacySrc) ? v.legacySrc : {} } : undefined;
    case "clear": return isObj(v) ? { histClear: typeof v.histClear === "number" ? v.histClear : 0, histDel: isObj(v.histDel) ? v.histDel : {} } : undefined;
  }
  return undefined;
}
function csPut(st, k, v) {
  if (k === "legacy") { st.legacyRefs = clone(v.legacyRefs); st.legacySrc = clone(v.legacySrc); return; }
  if (k === "clear") { st.histClear = v.histClear; st.histDel = clone(v.histDel); return; }
  st[k] = clone(v);
}
/* Union par identifiant (conflit : les deux appareils ont modifié la rubrique) ; même identifiant : le plus récent gagne */
function csUnion(a, b, remoteNewer) {
  const m = {}, order = [];
  const add = (x, pri) => { if (!x) return; const id = x.id != null ? String(x.id) : JSON.stringify(x); if (!(id in m)) order.push(id); if (!(id in m) || pri) m[id] = x; };
  (a || []).forEach(x => add(x, false)); (b || []).forEach(x => add(x, remoteNewer));
  return order.map(id => m[id]);
}
function csMergeSection(k, lv, rv, remoteNewer) {
  if (k === "mesures") return csUnion(lv, rv, remoteNewer).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (k === "mesSeances" || k === "imports") return csUnion(lv, rv, remoteNewer);
  if (k === "agenda") return csUnion(lv, rv, remoteNewer).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (k === "notes") { const o = Object.assign({}, lv || {}); Object.keys(rv || {}).forEach(id => { if (!(id in o) || remoteNewer) o[id] = rv[id]; }); return o; }
  if (k === "legacy") { /* références v1 : par exercice, la plus récente */
    const L = Object.assign({}, lv.legacyRefs), S2 = Object.assign({}, lv.legacySrc);
    Object.keys(rv.legacyRefs || {}).forEach(id => { const a = L[id], b = rv.legacyRefs[id]; if (!a || ((b && b.ts) || 0) > ((a && a.ts) || 0)) { L[id] = b; if (rv.legacySrc && rv.legacySrc[id]) S2[id] = rv.legacySrc[id]; else delete S2[id]; } });
    return { legacyRefs: L, legacySrc: S2 };
  }
  return remoteNewer ? rv : lv; /* profile, deload : le plus récent gagne */
}
function csCapDel(m) {
  const ks = Object.keys(m); if (ks.length <= CS_DEL_MAX) return m;
  const out = {}; ks.sort((a, b) => m[b] - m[a]).slice(0, CS_DEL_MAX).forEach(k => { out[k] = m[k]; }); return out;
}

/* ---------- Corbeille (30 jours) ---------- */
/* Séance supprimée : gardée 30 jours dans st.corbeille = [{ id, del, h }] */
function csTrashAdd(st, h, del) {
  if (!csSeOk(h)) return;
  st.corbeille = (Array.isArray(st.corbeille) ? st.corbeille : []).filter(x => x && x.id !== h.id);
  st.corbeille.unshift({ id: h.id, del, h: clone(h) });
  st.corbeille = st.corbeille.slice(0, CS_TRASH_MAX);
}
function csTrashPrune(st, now) {
  st.corbeille = (Array.isArray(st.corbeille) ? st.corbeille : []).filter(x => x && x.h && x.del > now - CS_TRASH_MS && Math.max(x.h.ts || 0, x.h.upd || 0) > (st.histClear || 0));
}
/* Remet une séance de la corbeille dans l’historique (elle repart en ligne comme modifiée maintenant) → la séance, ou null */
function csTrashRestore(st, id, now) {
  const x = (st.corbeille || []).find(c => c && c.id === id); if (!x || !csSeOk(x.h)) return null;
  st.corbeille = st.corbeille.filter(c => c !== x);
  if (st.historique.some(h => h.id === id)) return null;
  const h = Object.assign(clone(x.h), { upd: now });
  delete st.histDel[id];
  st.historique = trimHist(st.historique.concat([h]).sort((a, b) => (b.ts || 0) - (a.ts || 0)));
  return h;
}

/* « Revenir à l’état d’avant » (copie de sécurité D5) avec la sauvegarde en ligne : chaque séance de l’état remis st absente de l’état
   actuel cur ou différente (supprimée, effacée ou modifiée depuis) devient la version la plus récente, pour revenir aussi sur les autres appareils. */
function csRevive(st, cur, now) {
  const have = {}; ((cur && cur.historique) || []).forEach(h => { if (h && h.id) have[h.id] = csSeSig(h); });
  let n = 0;
  (st.historique || []).forEach(h => { if (h && h.id && have[h.id] !== csSeSig(h)) { h.upd = now; delete st.histDel[h.id]; n++; } });
  if (n) st.upd = now;
  return n;
}

/* ---------- Références et palier après une fusion (D3) ---------- */
/* Références recalculées (rebuildRefs) pour les exercices des séances touchées ; les autres exercices ne bougent pas */
function csRefs(st, touched) {
  const ids = []; touched.forEach(h => (h && Array.isArray(h.log) ? h.log : []).forEach(l => { if (l && l.id && ids.indexOf(l.id) < 0) ids.push(l.id); }));
  if (!ids.length) return;
  const rb = rebuildRefs(st.historique, st.legacyRefs, st.legacySrc);
  ids.forEach(id => { if (rb.lastPerf[id]) st.lastPerf[id] = rb.lastPerf[id]; else delete st.lastPerf[id]; if (rb.refs[id]) st.refs[id] = rb.refs[id]; else delete st.refs[id]; });
}
/* Palier après l’ajout de la séance h (historique = avec h) : symétrique de rebuildProgress (suppression).
   Si le palier correspond à l’historique rejoué sans h, on rejoue avec h ; sinon on ajoute une séance au compteur. */
function csAddProgress(historique, profile, h) {
  const p = profile || {};
  if (!countable(h)) return clone(p);
  const key = q => [q.phase || 1, q.phaseDone || 0, q.niveau || "debutant"].join("|");
  const before = replayProgress((historique || []).filter(x => x && x.id !== h.id), p);
  if (key(before) === key(p)) return replayProgress(historique, p);
  const q = clone(p); tickApply(q, progressTick(q), h.date); return q;
}

/* Palier : p compte les séances de base + removals ; on retire removals une à une, puis on ajoute additions une à une (ordre des dates) */
function csProgress(p, base, removals, additions) {
  let cur = base.concat(removals);
  removals.forEach(h => { cur = cur.filter(x => x.id !== h.id); p = rebuildProgress(cur, p, h); });
  additions.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0)).forEach(h => { cur = cur.concat([h]); p = csAddProgress(cur, p, h); });
  return p;
}
const csSameU = (a, b) => { const n = o => (isObj(o) ? JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])) : "null"); return n(a) === n(b); };

/* ---------- Fusion de ce qui a été reçu (synchrone, sans réseau) ----------
   st0 : état local ; meta0 : état de synchro ; remote = { user: document users/{uid} ou null, seances: [{ id, data, srv }] }.
   Ne modifie rien de ce qui est reçu en paramètre. Renvoie { state, meta, rep } :
   rep = { added, removed, changed, sections, blocked, bad, snapshot, touched } ; si rep.blocked (format plus récent), state = st0 inchangé. */
function csMerge(st0, meta0, remote, now) {
  const st = normState(clone(st0)), m = csMeta(meta0), m0 = csMeta(meta0);
  const rep = { added: [], removed: [], changed: [], sections: [], blocked: "", bad: 0, snapshot: false };
  const first = !m.ru;
  if (!m.ru) m.ru = {};
  remote = remote || {};
  /* 1. Document du profil : migrate, refusé s’il vient d’un format plus récent */
  let ud = null;
  if (remote.user) {
    const raw = remote.user;
    const mg = migrate(Object.assign({}, raw, { v: Number.isInteger(raw.v) ? raw.v : 1 }));
    if (mg.error === "plus-recent") { m.blocked = "plus-recent"; return { state: st0, meta: m, rep: Object.assign(rep, { blocked: "plus-recent" }) }; }
    if (!mg.error) ud = raw;
  }
  m.su = ud && isObj(ud.u) ? clone(ud.u) : null; /* dates des rubriques en ligne, telles que lues : l’envoi vérifiera qu’elles n’ont pas changé */
  /* séances reçues : chacune passe par migrate (dans une enveloppe d’état) */
  const recv = [];
  for (const d of (remote.seances || [])) {
    if (!d || typeof d.id !== "string" || !isObj(d.data)) { rep.bad++; continue; }
    const v = Number.isInteger(d.data.v) ? d.data.v : 1;
    if (v > SCHEMA_VERSION) { m.skip[d.id] = v; rep.blocked = "plus-recent"; continue; } /* jamais réécrite par cet appareil */
    let h = null;
    if (d.data.j != null) {
      const hh = csParse(d.data.j);
      const mg = migrate({ v, historique: hh ? [hh] : [] });
      if (mg.error || !mg.data.historique.length || !csSeOk(mg.data.historique[0], d.id)) { rep.bad++; continue; }
      h = mg.data.historique[0];
    }
    if (!h && !d.data.del) { rep.bad++; continue; }
    recv.push({ id: d.id, h, del: typeof d.data.del === "number" ? d.data.del : 0, upd: typeof d.data.upd === "number" ? d.data.upd : 0, srv: d.srv || 0 });
  }
  if (rep.blocked) { /* une séance d’un format plus récent : on ne fusionne rien et on n’écrit plus (l’appli doit être mise à jour) */
    m.blocked = "plus-recent"; return { state: st0, meta: m, rep };
  }
  /* 2. Rubriques du profil */
  let profileWinner = "local", profileWasDirty = csSig(csSection(st, "profile")) !== m0.sent.profile || first;
  if (ud) {
    const u = isObj(ud.u) ? ud.u : {};
    CS_SECTIONS.forEach(k => {
      const rv = csClean(k, csParse(ud[k]));
      if (rv === undefined) return;
      const ru = typeof u[k] === "number" ? u[k] : 0;
      const lv = csSection(st, k), lsig = csSig(lv);
      if (k === "clear") { /* suppressions : toujours additionnées ; effacement complet : le plus récent */
        const out = { histClear: Math.max(lv.histClear || 0, rv.histClear || 0), histDel: Object.assign({}, lv.histDel) };
        Object.keys(rv.histDel).forEach(id => { if (typeof rv.histDel[id] === "number" && !(out.histDel[id] >= rv.histDel[id])) out.histDel[id] = rv.histDel[id]; });
        out.histDel = csCapDel(out.histDel);
        if (out.histClear > (lv.histClear || 0)) { rep.snapshot = true; rep.cleared = out.histClear; }
        csPut(st, k, out); m.ru[k] = ru;
        if (csSig(out) === csSig(rv)) m.sent[k] = csSig(csSection(st, k)); /* identique à ce qui est en ligne : rien à renvoyer */
        return;
      }
      if (lsig === csSig(rv)) { m.sent[k] = lsig; m.ru[k] = ru; return; } /* déjà identique (vide des deux côtés, par exemple) */
      /* premier lien d’un téléphone sans aucune séance (neuf, réinstallé) : le profil en ligne l’emporte, même si le questionnaire
         vient d’être rempli ici (sinon le palier et les réglages du compte seraient remplacés par ceux d’un profil tout neuf) */
      const fresh = first && k === "profile" && !(st0.historique || []).length && !csEmpty(k, rv);
      const localCh = fresh ? false : first ? !csEmpty(k, lv) : lsig !== m.sent[k];
      const remoteCh = first ? !csEmpty(k, rv) : ru !== (m.ru[k] || 0);
      if (!remoteCh) { m.ru[k] = ru; return; }
      if (!localCh) {
        csPut(st, k, rv); m.sent[k] = csSig(csSection(st, k)); m.ru[k] = ru; rep.sections.push(k);
        if (k === "profile") profileWinner = "remote";
        return;
      }
      /* conflit : les deux ont changé */
      const lt = k === "agenda" ? (st.agUpd || 0) : (st.upd || 0), remoteNewer = ru > lt;
      csPut(st, k, csMergeSection(k, clone(lv), rv, remoteNewer));
      if (k === "profile" && remoteNewer) profileWinner = "remote";
      m.ru[k] = ru; rep.sections.push(k); /* m.sent[k] inchangé : le résultat fusionné repartira en ligne */
    });
    if (typeof ud.upd === "number" && profileWinner === "remote") st.upd = Math.max(st.upd || 0, ud.upd);
    if (typeof ud.agUpd === "number" && rep.sections.indexOf("agenda") >= 0) st.agUpd = Math.max(st.agUpd || 0, ud.agUpd);
  }
  const clr = st.histClear || 0;
  let clearedGone = [];
  if (clr) { /* effacement complet reçu : les séances antérieures quittent l’historique (copie de sécurité faite par l’appli avant) */
    /* une séance remise après l’effacement (upd plus récent, « Revenir à l’état d’avant ») n’est pas effacée */
    clearedGone = st.historique.filter(h => Math.max(h.ts || 0, h.upd || 0) <= clr);
    if (clearedGone.length) st.historique = st.historique.filter(h => Math.max(h.ts || 0, h.upd || 0) > clr);
    if (rep.cleared) { st.lastPerf = {}; st.refs = {}; Object.keys(st.legacyRefs || {}).forEach(id => { const lp = st.legacyRefs[id]; if (!lp || (lp.ts || dayMs(lp.d)) <= clr) { delete st.legacyRefs[id]; delete st.legacySrc[id]; } }); }
  }
  /* 3. Séances, une par une */
  const byId = {}; st.historique.forEach(h => { byId[h.id] = h; });
  const removedIds = {}, addedIds = {};
  /* suppression connue par la liste des séances supprimées (document de la séance déjà effacé définitivement, appareil resté longtemps hors ligne) */
  Object.keys(st.histDel).forEach(id => {
    const h = byId[id]; if (!h || (st0.histDel || {})[id] || !(st.histDel[id] >= (h.upd || 0)) || m0.seen[id] !== csSeSig(h)) return;
    delete byId[id]; removedIds[id] = 1; rep.removed.push(h); csTrashAdd(st, h, st.histDel[id]); m.seen[id] = csDel36(st.histDel[id]);
  });
  recv.sort((a, b) => a.srv - b.srv).forEach(d => {
    m.cursor = Math.max(m.cursor || 0, d.srv || 0);
    const id = d.id, local = byId[id], seen = m0.seen[id];
    const lsig = local ? csSeSig(local) : null;
    const localDirty = local ? lsig !== seen : false;
    if (d.del) {
      if (local) {
        if (!localDirty || (local.upd || 0) <= d.del) {
          delete byId[id]; removedIds[id] = 1; rep.removed.push(local);
          st.histDel[id] = Math.max(st.histDel[id] || 0, d.del); csTrashAdd(st, local, d.del); m.seen[id] = csDel36(d.del);
        } /* sinon : séance modifiée ici après la suppression, elle est gardée et repartira en ligne */
      } else {
        if (!(st.histDel[id] >= d.del)) st.histDel[id] = d.del;
        if (d.h && (d.h.ts || 0) > clr && !(st.corbeille || []).some(c => c && c.id === id)) csTrashAdd(st, d.h, d.del);
        m.seen[id] = csDel36(d.del);
      }
      return;
    }
    const h = d.h, rsig = csSeSig(h);
    if (Math.max(h.ts || 0, d.upd || h.upd || 0) <= clr) { m.seen[id] = rsig; return; } /* effacée par « Effacer l’historique » : ignorée */
    if (!local) {
      const ldel = st.histDel[id];
      if (ldel && ldel >= (d.upd || h.upd || 0)) { m.seen[id] = rsig; return; } /* supprimée ici après cette version : la suppression repartira */
      if (ldel) delete st.histDel[id];
      st.corbeille = (st.corbeille || []).filter(c => c && c.id !== id);
      byId[id] = h; addedIds[id] = 1; rep.added.push(h); m.seen[id] = rsig;
      return;
    }
    if (rsig === lsig) { m.seen[id] = rsig; return; }
    if (h.c && !local.c) { m.seen[id] = lsig; return; } /* version résumée reçue : on garde le détail local, sans le renvoyer */
    if (!localDirty || (d.upd || h.upd || 0) > (local.upd || 0)) {
      byId[id] = h; rep.changed.push({ before: local, h }); m.seen[id] = rsig;
    } /* sinon : la version locale est plus récente, elle repartira */
  });
  /* une séance revenue (plus récente que sa suppression) n’est plus marquée supprimée */
  Object.keys(byId).forEach(id => { const h = byId[id]; if (st.histDel[id] && (h.upd || 0) > st.histDel[id]) delete st.histDel[id]; });
  st.historique = trimHist(Object.keys(byId).map(id => byId[id]).sort((a, b) => (b.ts || 0) - (a.ts || 0)));
  csTrashPrune(st, now);
  if (rep.removed.length >= 3) rep.snapshot = true;
  /* 4. Palier : le profil gagnant a compté ses propres séances ; on ajoute ou retire celles qu’il ne connaissait pas.
     Un effacement complet ne touche pas au palier (comme sur l’appareil qui l’a fait). */
  let p = st.profile;
  const hist = st.historique;
  if (profileWinner === "remote") {
    /* séances et suppressions faites ici et pas encore envoyées */
    const adds = hist.filter(h => m0.seen[h.id] === undefined && !addedIds[h.id]), addIds = {}; adds.forEach(h => { addIds[h.id] = 1; });
    const dels = [];
    Object.keys(st0.histDel || {}).forEach(id => { const s = m0.seen[id]; if (!s || csIsDel(s) || removedIds[id]) return; const c = (st0.corbeille || []).find(x => x && x.id === id); if (c && c.h && (c.h.ts || 0) > clr) dels.push(c.h); });
    p = csProgress(p, hist.filter(h => !addIds[h.id]), dels, adds);
  } else {
    p = csProgress(p, hist.filter(h => !addedIds[h.id]), rep.removed, rep.added);
  }
  st.profile = normProfile(p);
  /* changement dû seulement à la fusion, sur un profil qui n’avait rien de nouveau ici : pas renvoyé (l’autre appareil enverra le sien) */
  if (!profileWasDirty && ud) m.sent.profile = csSig(csSection(st, "profile"));
  /* 5. Références des exercices touchés (D3) */
  rep.removed = rep.removed.concat(clearedGone);
  rep.touched = rep.added.concat(rep.removed, rep.changed.map(c => c.before), rep.changed.map(c => c.h));
  if (rep.cleared) rep.touched = rep.touched.concat(hist);
  csRefs(st, rep.touched);
  if (JSON.stringify(st) === JSON.stringify(normState(clone(st0)))) rep.same = true; /* rien de changé : l’état local n’est pas réécrit */
  m.blocked = "";
  return { state: st, meta: m, rep };
}

/* ---------- Ce qu’il faut envoyer (synchrone) ----------
   Renvoie { ops, n } : ops = [{ t: "se", id, data, mark } | { t: "user", data, marks } | { t: "rm", id }], dans l’ordre d’envoi :
   séances d’abord, document du profil ensuite (il ne compte jamais une séance absente en ligne), effacements définitifs en dernier.
   « mark » / « marks » : ce qui est noté comme envoyé une fois l’envoi réussi. */
function csPlan(st, meta, now) {
  const m = csMeta(meta), ops = [], inHist = {};
  if (m.blocked) return { ops, n: 0, blocked: m.blocked };
  (st.historique || []).forEach(h => {
    if (!h || !h.id) return; inHist[h.id] = 1;
    if (m.skip[h.id]) return;
    const sig = csSeSig(h), seen = m.seen[h.id];
    if (seen === sig) return;
    if (h.c && seen && !csIsDel(seen)) { ops.push({ t: "mark", id: h.id, mark: sig }); return; } /* résumée ici : le détail reste en ligne */
    const j = JSON.stringify(h); if (j.length > CS_SE_MAX) return;
    ops.push({ t: "se", id: h.id, data: { v: SCHEMA_VERSION, upd: h.upd || h.ts || now, j }, mark: sig });
  });
  const trash = {}; (st.corbeille || []).forEach(c => { if (c && c.id) trash[c.id] = c; });
  Object.keys(st.histDel || {}).forEach(id => {
    const seen = m.seen[id]; if (!seen || csIsDel(seen) || inHist[id] || m.skip[id]) return;
    const del = st.histDel[id], c = trash[id], data = { v: SCHEMA_VERSION, upd: del, del };
    if (c && c.h) { const j = JSON.stringify(c.h); if (j.length <= CS_SE_MAX) data.j = j; }
    ops.push({ t: "se", id, data, mark: csDel36(del) });
  });
  /* document du profil : seulement si une rubrique a changé */
  const marks = {}, u = Object.assign({}, m.ru || {}), data = { v: SCHEMA_VERSION, app: "fonte", upd: st.upd || 0, agUpd: st.agUpd || 0 };
  let changed = false;
  CS_SECTIONS.forEach(k => { const v = csSection(st, k), sig = csSig(v); data[k] = JSON.stringify(v === undefined ? null : v); if (sig !== m.sent[k]) { changed = true; u[k] = Math.max(now, (u[k] || 0) + 1); /* toujours plus récente que la précédente, même dans la même milliseconde */ } marks[k] = sig; });
  data.u = u;
  if (changed) {
    if (JSON.stringify(data).length > CS_USER_MAX) return { ops, n: ops.filter(o => o.t !== "mark").length, tooBig: true };
    ops.push({ t: "user", data, marks, u, expect: m.su || null }); /* envoyé seul, à condition que le document en ligne n’ait pas changé depuis la lecture */
  }
  /* effacements définitifs : séances supprimées depuis plus de 30 jours, séances antérieures à un effacement complet de plus de 30 jours */
  Object.keys(m.seen).forEach(id => {
    const s = m.seen[id], d = csDelAt(s);
    if (d && d < now - CS_TRASH_MS) ops.push({ t: "rm", id });
  });
  return { ops, n: ops.filter(o => o.t !== "mark").length };
}

/* ---------- Limiteur d’écritures ---------- */
function csLimit(m, now) {
  const L = m.lim || (m.lim = {});
  if (L.d !== csDay(now)) { L.d = csDay(now); L.n = 0; }
  if (L.w !== csMin(now)) { L.w = csMin(now); L.k = 0; }
  return Math.max(0, Math.min(CS_LIM_DAY - L.n, CS_LIM_MIN - L.k));
}
function csTake(m, n, now) { csLimit(m, now); m.lim.n += n; m.lim.k += n; }

/* Nombre de changements pas encore en ligne (affiché « En attente du réseau ») */
function csPending(st, meta, now) { return csPlan(st, meta, now || Date.now()).ops.filter(o => o.t === "se" || o.t === "user").length; }

/* ---------- Une synchro complète (lecture de ce qui a changé, fusion, envoi) ----------
   o = { api, meta, now(), getState(), setState(state, rep), saveMeta(meta) }
   api = { getUser() → données ou null ; seancesSince(c) → séances dont srv > c : [{ id, data, srv }] ; commit(ops) → envoi groupé (atomique) }
   Toute erreur de l’api arrête la synchro : rien n’est retiré des données locales, ce qui n’est pas parti repartira la fois suivante.
   Renvoie { status: "ok" | "limite" | "plus-recent" | "trop-gros" | "erreur", error?, rep?, pending } */
async function csRun(o) {
  let m = csMeta(o.meta);
  m.blocked = ""; /* on revérifie à chaque fois (l’appli a peut-être été mise à jour) */
  let rep = null;
  try {
    const user = await o.api.getUser();
    /* repère = heure du serveur (srv, en microsecondes) de la dernière séance reçue ; Firestore garantit qu’une lecture voit tout ce qui a été
       enregistré avant elle : on ne relit que ce qui est strictement plus récent */
    const docs = await o.api.seancesSince(m.cursor || 0);
    const r = csMerge(o.getState(), m, { user, seances: docs }, o.now());
    m = r.meta; rep = r.rep;
    if (rep.blocked) { o.saveMeta(m); return { status: "plus-recent", rep, pending: 0 }; }
    if (!rep.same) o.setState(r.state, rep);
    o.saveMeta(m);
  } catch (e) { o.saveMeta(m); return { status: "erreur", error: e, pending: csPending(o.getState(), m, o.now()) }; }
  /* envoi */
  const now = o.now(), plan = csPlan(o.getState(), m, now);
  plan.ops.filter(x => x.t === "mark").forEach(x => { m.seen[x.id] = x.mark; });
  let ops = plan.ops.filter(x => x.t !== "mark");
  let status = plan.tooBig ? "trop-gros" : "ok";
  const allowed = csLimit(m, now);
  if (ops.length > allowed) {
    status = "limite";
    ops = ops.slice(0, allowed);
    /* le document du profil ne part jamais avant toutes les séances qu’il compte */
    const ui = ops.findIndex(x => x.t === "user"); if (ui >= 0 && plan.ops.some((x, i) => x.t === "se" && ops.indexOf(x) < 0)) ops.splice(ui);
  }
  try {
    const groups = [];
    ops.filter(x => x.t === "se").forEach((x, i) => { if (i % CS_BATCH === 0) groups.push([]); groups[groups.length - 1].push(x); });
    ops.filter(x => x.t === "user").forEach(x => groups.push([x]));
    const rms = ops.filter(x => x.t === "rm"); for (let i = 0; i < rms.length; i += CS_BATCH) groups.push(rms.slice(i, i + CS_BATCH));
    for (const part of groups) {
      await o.api.commit(part);
      csTake(m, part.length, o.now());
      part.forEach(x => {
        if (x.t === "se") m.seen[x.id] = x.mark;
        else if (x.t === "user") { Object.assign(m.sent, x.marks); m.ru = Object.assign({}, m.ru || {}, x.u); m.su = clone(x.u); }
        else if (x.t === "rm") delete m.seen[x.id];
      });
      o.saveMeta(m);
    }
  } catch (e) {
    o.saveMeta(m);
    /* le document du profil a été modifié par un autre appareil entre la lecture et l’envoi : on recommence (lecture, fusion, envoi) */
    if (e && e.code === "conflit" && (o.retry || 0) < 2) return csRun(Object.assign({}, o, { meta: m, retry: (o.retry || 0) + 1 }));
    return { status: "erreur", error: e, rep, pending: csPending(o.getState(), m, o.now()) };
  }
  const pending = csPending(o.getState(), m, o.now());
  if (status === "ok" && !pending) m.last = o.now();
  o.saveMeta(m);
  return { status, rep, pending };
}
