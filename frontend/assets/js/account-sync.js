// ============================================================
// مزامنة الحساب عبر Firebase Firestore
// بيستبدل نظام account-sync القديم (Render /api/progress)
// ============================================================
import { fbSaveProgress, fbGetProgress, fbOnAuthChange, fbIsAdmin }
  from './firebase-init.js';

(function () {
  'use strict';
  if (window.PSAccountSync) return;

  const PS_KEY    = 'ps_progress_v1';
  const CYBER_KEY = 'kudosk_cyber_progress';
  const MTIME_KEY = 'ps_sync_mtimes';
  const RIG_SLOTS_FALLBACK = ['cpu','ram','gpu','storage','psu','case','mobo','cooler','os','monitor'];

  function isSyncKey(k) {
    return k === PS_KEY || k === CYBER_KEY || k === 'zakera_registry' ||
      k === 'zakera_active_id' || /^zakera_(profile_|research_draft_)/.test(k);
  }
  function isUnionKey(k) { return k === PS_KEY || k === CYBER_KEY; }

  const originalSetItem = Storage.prototype.setItem;
  let applying = false, ready = false, pushTimer = null;

  function readMtimes() { try { return JSON.parse(localStorage.getItem(MTIME_KEY)||'{}'); } catch { return {}; } }
  function writeMtimes(m) { originalSetItem.call(localStorage, MTIME_KEY, JSON.stringify(m)); }
  function parseOr(str, fb) { try { return JSON.parse(str)??fb; } catch { return fb; } }
  function localSyncKeys() {
    const ks=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isSyncKey(k))ks.push(k);}
    return ks;
  }

  function mergePs(lStr, rStr) {
    const L=parseOr(lStr,{}),R=parseOr(rStr,{});
    const out=Object.assign({},R,L);
    out.xp=Math.max(L.xp||0,R.xp||0);
    out.lessonsCompleted=Math.max(L.lessonsCompleted||0,R.lessonsCompleted||0);
    out.perfectStreak=Math.max(L.perfectStreak||0,R.perfectStreak||0);
    out.rigCoins=Math.max(L.rigCoins||0,R.rigCoins||0);
    out.dayStreak=Math.max(L.dayStreak||0,R.dayStreak||0);
    out.placementTestTaken=!!(L.placementTestTaken||R.placementTestTaken);
    out.lessonLog=Object.assign({},R.lessonLog||{},L.lessonLog||{});
    out.medals=Array.from(new Set([...(R.medals||[]),...(L.medals||[])]));
    const rig={};
    const slots=new Set([...Object.keys(L.rig||{}),...Object.keys(R.rig||{}),...RIG_SLOTS_FALLBACK]);
    slots.forEach(slot=>{ rig[slot]=Math.max((L.rig||{})[slot]||1,(R.rig||{})[slot]||1); });
    out.rig=rig;
    return JSON.stringify(out);
  }
  function mergeCyber(lStr,rStr) {
    const L=parseOr(lStr,{}),R=parseOr(rStr,{});
    const out=Object.assign({},R);
    Object.keys(L).forEach(k=>{if(L[k])out[k]=true;});
    return JSON.stringify(out);
  }

  function buildItems() {
    const m=readMtimes(), items={};
    localSyncKeys().forEach(k=>{items[k]={value:localStorage.getItem(k),mtime:m[k]||0};});
    return items;
  }

  async function pushNow() {
    try { return await fbSaveProgress(buildItems()); } catch { return false; }
  }

  function schedulePush() {
    if(applying) return;
    clearTimeout(pushTimer);
    pushTimer=setTimeout(pushNow, 1500);
  }

  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if(this!==localStorage||applying||!isSyncKey(key)) return;
    const m=readMtimes();
    m[key]=ready?Date.now():(m[key]||0);
    writeMtimes(m);
    schedulePush();
  };

  async function pullAndMerge() {
    let remote;
    try { remote=await fbGetProgress(); } catch { return; }
    if(!remote) return;
    const m=readMtimes();
    const keys=new Set([...localSyncKeys(),...Object.keys(remote)]);
    let changed=false;
    applying=true;
    try {
      keys.forEach(k=>{
        const lv=localStorage.getItem(k), lm=m[k]||0;
        const rv=remote[k]?remote[k].value:null, rm=remote[k]?(remote[k].mtime||0):0;
        let nv, nm;
        if(isUnionKey(k)&&lv!==null&&rv!==null){
          nv=k===PS_KEY?mergePs(lv,rv):mergeCyber(lv,rv); nm=Math.max(lm,rm);
        } else if(rv!==null&&(lv===null||rm>lm)){ nv=rv; nm=rm; }
        else { nv=lv; nm=lm; }
        if(nv!==null&&nv!==lv){originalSetItem.call(localStorage,k,nv);changed=true;}
        if(nm) m[k]=nm;
      });
    } finally { applying=false; }
    writeMtimes(m);
    if(changed&&!sessionStorage.getItem('ps_synced_once')){
      sessionStorage.setItem('ps_synced_once','1');
      location.reload(); return;
    }
    schedulePush();
  }

  async function start() {
    try { await pullAndMerge(); } catch {} finally { ready=true; }
  }

  // شغّل المزامنة لما يتسجل دخول
  fbOnAuthChange((user) => {
    if(user) start();
    else ready=true;
  });

  window.PSAccountSync = { pushNow, pullAndMerge };
})();
