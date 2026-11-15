// ============================================
// مزامنة الحساب بين الأجهزة: التقدم (PS + السايبر) وبيانات الكتاب (زكرة)
// - لو مسجل دخول بس. لو لأ، كل حاجة محلية زي ما هي.
// - أي كتابة لمفاتيح المزامنة بتتسجل بوقت تعديلها وتتبعت للسيرفر بعد ثانية ونص.
// - أول ما الصفحة تفتح بتسحب من السيرفر وتدمج:
//   * تقدم PS وسايبر: بيتدمج (الأرقام بالأكبر، الدروس والميداليات بتتجمع) عشان مفيش خسارة.
//   * بيانات الكتاب (بروفايلات/مسودات): الأحدث يفوز (بالمقارنة بوقت التعديل).
// - قبل ما الصفحة تسحب من السيرفر، أي كتابة محلية بتتسجل بوقت 0، عشان أول تحميل
//   للتطبيق (اللي بيكتب حالة افتراضية) ميمسحش بيانات الحساب على السيرفر.
// ============================================
(function () {
  'use strict';
  if (window.PSAccountSync) return;

  const API = 'https://programming-science.onrender.com';
  const MTIME_KEY = 'ps_sync_mtimes';
  const PS_KEY = 'ps_progress_v1';
  const CYBER_KEY = 'kudosk_cyber_progress';

  function isSyncKey(k) {
    return k === PS_KEY || k === CYBER_KEY || k === 'zakera_registry' || k === 'zakera_active_id' ||
      /^zakera_(profile_|research_draft_)/.test(k);
  }
  function isUnionKey(k) { return k === PS_KEY || k === CYBER_KEY; }

  const originalSetItem = Storage.prototype.setItem;
  let applying = false;
  let ready = false;
  let pushTimer = null;

  function getToken() { return localStorage.getItem('ps_token'); }
  function readMtimes() {
    try { return JSON.parse(localStorage.getItem(MTIME_KEY) || '{}') || {}; } catch { return {}; }
  }
  function writeMtimes(m) { originalSetItem.call(localStorage, MTIME_KEY, JSON.stringify(m)); }
  function localSyncKeys() {
    const ks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (isSyncKey(k)) ks.push(k);
    }
    return ks;
  }
  function parseOr(str, fallback) { try { return JSON.parse(str) ?? fallback; } catch { return fallback; } }

  // دمج تقدم PS
  function mergePs(lStr, rStr) {
    const L = parseOr(lStr, {}), R = parseOr(rStr, {});
    const out = Object.assign({}, R, L);
    out.xp = Math.max(L.xp || 0, R.xp || 0);
    out.lessonsCompleted = Math.max(L.lessonsCompleted || 0, R.lessonsCompleted || 0);
    out.perfectStreak = Math.max(L.perfectStreak || 0, R.perfectStreak || 0);
    out.rigCoins = Math.max(L.rigCoins || 0, R.rigCoins || 0);
    out.dayStreak = Math.max(L.dayStreak || 0, R.dayStreak || 0);
    out.placementTestTaken = !!(L.placementTestTaken || R.placementTestTaken);
    out.lessonLog = Object.assign({}, R.lessonLog || {}, L.lessonLog || {});
    out.medals = Array.from(new Set([...(R.medals || []), ...(L.medals || [])]));
    const rig = {};
    const slots = new Set([...Object.keys(L.rig || {}), ...Object.keys(R.rig || {})]);
    slots.forEach((slot) => {
      rig[slot] = Math.max((L.rig || {})[slot] || 1, (R.rig || {})[slot] || 1);
    });
    out.rig = rig;
    return JSON.stringify(out);
  }
  // دمج تقدم السايبر: الدرس اللي اتعمل في أي جهاز يفضل متعمل
  function mergeCyber(lStr, rStr) {
    const L = parseOr(lStr, {}), R = parseOr(rStr, {});
    const out = Object.assign({}, R);
    Object.keys(L).forEach((k) => { if (L[k]) out[k] = true; });
    return JSON.stringify(out);
  }

  function buildItems() {
    const m = readMtimes();
    const items = {};
    localSyncKeys().forEach((k) => {
      items[k] = { value: localStorage.getItem(k), mtime: m[k] || 0 };
    });
    return items;
  }

  async function pushNow() {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(API + '/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ items: buildItems() }),
      });
    } catch { /* مفيش نت: البيانات محلية، هتتبعت المرة الجاية */ }
  }
  function schedulePush() {
    if (applying) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 1500);
  }

  // أي كتابة لمفاتيح المزامنة بتتسجل بوقتها وتتبعت
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this !== localStorage || applying || !isSyncKey(key)) return;
    const m = readMtimes();
    m[key] = ready ? Date.now() : (m[key] || 0);
    writeMtimes(m);
    schedulePush();
  };

  async function pullAndMerge() {
    const token = getToken();
    if (!token) return;
    let remote;
    try {
      const r = await fetch(API + '/api/progress', { headers: { Authorization: 'Bearer ' + token } });
      if (!r.ok) return; // 401 يعني السيرفر اتعاد تشغيله، لازم تسجل دخول تاني
      remote = (await r.json()).items || {};
    } catch { return; }

    const m = readMtimes();
    const keys = new Set([...localSyncKeys(), ...Object.keys(remote)]);
    let changed = false;
    applying = true;
    try { keys.forEach((k) => {
      const lv = localStorage.getItem(k);
      const lm = m[k] || 0;
      const rv = remote[k] ? remote[k].value : null;
      const rm = remote[k] ? (remote[k].mtime || 0) : 0;
      let nv, nm;
      if (isUnionKey(k) && lv !== null && rv !== null) {
        nv = k === PS_KEY ? mergePs(lv, rv) : mergeCyber(lv, rv);
        nm = Math.max(lm, rm);
      } else if (rv !== null && (lv === null || rm > lm)) {
        nv = rv; nm = rm;
      } else {
        nv = lv; nm = lm;
      }
      if (nv !== null && nv !== lv) { originalSetItem.call(localStorage, k, nv); changed = true; }
      if (nm) m[k] = nm;
    }); } finally { applying = false; }
    writeMtimes(m);

    if (changed && !sessionStorage.getItem('ps_synced_once')) {
      // عشان الصفحة تعرض البيانات الجديدة: reload مرة واحدة بس في الجلسة
      sessionStorage.setItem('ps_synced_once', '1');
      location.reload();
      return;
    }
    schedulePush(); // نرفع الدمج عشان الجهاز التاني يشوفه
  }

  async function start() {
    try { await pullAndMerge(); } catch { /* تجاهل */ } finally { ready = true; }
  }
  // لو مفيش توكن، ready تبقى true على طول
  if (!getToken()) ready = true;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.PSAccountSync = { pushNow, pullAndMerge };
})();
