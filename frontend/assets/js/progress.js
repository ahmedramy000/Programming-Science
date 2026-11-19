// ============================================
// نظام تحفيز بسيط: نقاط (XP) + مستويات + ميداليات، زي QUREO.
// مخزّن في localStorage دلوقتي (قبل ما نظام الحسابات الحقيقي يشتغل)،
// هينتقل لحساب المستخدم على السيرفر لما نوصلهم.
// ============================================
const PS_PROGRESS_KEY = 'ps_progress_v1';
const XP_PER_LEVEL = 150;

// ============================================
// نظام "جهازي" (Rig): جهاز افتراضي واحد بيخص الطالب، مرتبط بكل تقدمه
// في المنصة كلها (بايثون + سايبر + كورسات) مش بس مسار واحد.
// كل درس يتخلّص (في أي مكان في المنصة) بيدي "عملات جهاز" 🪙 غير الـXP،
// عشان الـXP يفضل مقياس ثابت للمستوى ومايتأثرش بالصرف في المتجر.
// ============================================
const RIG_TIERS = {
  cpu: [
    { tier: 1, name: 'Core Lite', cost: 0, power: 1 },
    { tier: 2, name: 'Core Plus', cost: 80, power: 2 },
    { tier: 3, name: 'Core Max', cost: 220, power: 3 },
  ],
  ram: [
    { tier: 1, name: '2GB', cost: 0, power: 1 },
    { tier: 2, name: '8GB', cost: 70, power: 2 },
    { tier: 3, name: '16GB', cost: 180, power: 3 },
  ],
  gpu: [
    { tier: 1, name: 'Integrated', cost: 0, power: 1 },
    { tier: 2, name: 'Entry GPU', cost: 90, power: 2 },
    { tier: 3, name: 'Pro GPU', cost: 240, power: 3 },
  ],
  storage: [
    { tier: 1, name: 'HDD 128GB', cost: 0, power: 1 },
    { tier: 2, name: 'SSD 256GB', cost: 70, power: 2 },
    { tier: 3, name: 'SSD 1TB NVMe', cost: 160, power: 3 },
  ],
  psu: [
    { tier: 1, name: '300W', cost: 0, power: 1 },
    { tier: 2, name: '500W', cost: 60, power: 2 },
    { tier: 3, name: '750W Gold', cost: 150, power: 3 },
  ],
  fan: [
    { tier: 1, name: 'مروحة عادية', cost: 0, power: 1 },
    { tier: 2, name: 'تبريد محسّن', cost: 50, power: 2 },
    { tier: 3, name: 'تبريد مائي', cost: 140, power: 3 },
  ],
  os: [
    { tier: 1, name: 'KudoskOS Lite', cost: 0, power: 1 },
    { tier: 2, name: 'KudoskOS Pro', cost: 150, power: 2 },
  ],
};
const RIG_SLOTS = Object.keys(RIG_TIERS);
const RIG_MAX_POWER = RIG_SLOTS.reduce((s, slot) => s + RIG_TIERS[slot][RIG_TIERS[slot].length - 1].power, 0);

function psDefaultRig() {
  const rig = {};
  RIG_SLOTS.forEach((slot) => { rig[slot] = 1; });
  return rig;
}

function psGetRig() {
  const p = psLoadProgress();
  return p.rig || psDefaultRig();
}
function psGetRigCoins() {
  return psLoadProgress().rigCoins || 0;
}

function psGetRigPower(rig) {
  rig = rig || psGetRig();
  let total = 0;
  RIG_SLOTS.forEach((slot) => {
    const table = RIG_TIERS[slot];
    const found = table.find((t) => t.tier === rig[slot]);
    total += found ? found.power : table[0].power;
  });
  return total;
}

// تصنيف أداء الجهاز لـ3 مستويات بسيطة (ضعيف/متوسط/قوي) - أي جزء في المنصة
// يقدر يستخدمها عشان يقرر يسمح بأداة متقدمة أو يطلب ترقية الأول.
function psGetRigTierInfo(power) {
  if (power === undefined) power = psGetRigPower();
  if (power <= Math.round(RIG_MAX_POWER * 0.42)) return { key: 'weak', label: 'ضعيف', emoji: '🐢' };
  if (power <= Math.round(RIG_MAX_POWER * 0.72)) return { key: 'mid', label: 'متوسط', emoji: '⚙️' };
  return { key: 'strong', label: 'قوي', emoji: '🚀' };
}

// بيحاول يشتري الترقية الجاية لقطعة معيّنة (slot زي 'cpu'، 'ram'، 'os'...)
function psBuyRigPart(slot) {
  const table = RIG_TIERS[slot];
  if (!table) return { ok: false, reason: 'invalid-slot' };
  const p = psLoadProgress();
  const rig = p.rig || psDefaultRig();
  const currentTier = rig[slot] || 1;
  const next = table.find((t) => t.tier === currentTier + 1);
  if (!next) return { ok: false, reason: 'max-tier' };
  const coins = p.rigCoins || 0;
  if (coins < next.cost) return { ok: false, reason: 'not-enough', need: next.cost - coins, cost: next.cost };

  p.rigCoins = coins - next.cost;
  rig[slot] = next.tier;
  p.rig = rig;
  psSaveProgress(p);
  return { ok: true, tier: next.tier, name: next.name, coinsLeft: p.rigCoins, power: psGetRigPower(rig) };
}

const PS_MEDALS = [
  { id: 'first_lesson', icon: '🥉', name: 'أول خطوة', cond: (p) => p.lessonsCompleted >= 1 },
  { id: 'five_lessons', icon: '🥈', name: '5 دروس', cond: (p) => p.lessonsCompleted >= 5 },
  { id: 'ten_lessons', icon: '🥇', name: '10 دروس', cond: (p) => p.lessonsCompleted >= 10 },
  { id: 'perfect_streak3', icon: '🔥', name: '3 نتايج مثالية متتالية', cond: (p) => p.perfectStreak >= 3 },
  { id: 'level5', icon: '⭐', name: 'وصلت للمستوى 5', cond: (p) => psLevelOf(p.xp) >= 5 },
];

function psLevelOf(xp) { return 1 + Math.floor((xp || 0) / XP_PER_LEVEL); }
function psXpIntoLevel(xp) { return (xp || 0) % XP_PER_LEVEL; }

function psDefaultProgress() {
  return {
    xp: 0, lessonsCompleted: 0, perfectStreak: 0, medals: [], lessonLog: {}, dayStreak: 0, lastActiveDay: null,
    rigCoins: 0, rig: psDefaultRig(), placementTestTaken: false,
  };
}

// اختبار تحديد المستوى الاختياري (مرة واحدة بس) - كل إجابة صح بتدّي عملات
// بونص جهاز (مش XP) عشان يبدأ ببداية أقوى شوية من غير ما يأثر على مستواه الحقيقي.
function psIsPlacementTestTaken() {
  return !!psLoadProgress().placementTestTaken;
}
function psCompletePlacementTest(correctCount) {
  const p = psLoadProgress();
  if (p.placementTestTaken) return { bonus: 0, alreadyTaken: true };
  const bonus = (correctCount || 0) * 20;
  p.rigCoins = (p.rigCoins || 0) + bonus;
  p.placementTestTaken = true;
  if (!p.rig) p.rig = psDefaultRig();
  psSaveProgress(p);
  return { bonus, alreadyTaken: false, coinsNow: p.rigCoins };
}

// بيحسب "اليوم" كتاريخ بسيط (YYYY-MM-DD) عشان نقارن أيام مش أوقات
function psToday() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function psYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// بيتسجل مرة واحدة كل ما المستخدم يفتح أي صفحة رئيسية في المنصة —
// لو زار إمبارح: الستريك بيزيد. لو فاته يوم أو أكتر: الستريك بيرجع لـ1.
// لو زار النهارده قبل كده: مفيش تغيير (عشان الفتح المتكرر النهارده متزودش الستريك).
function psTouchDailyStreak() {
  const p = psLoadProgress();
  const today = psToday();
  if (p.lastActiveDay === today) return p.dayStreak || 0;

  if (p.lastActiveDay === psYesterday()) p.dayStreak = (p.dayStreak || 0) + 1;
  else p.dayStreak = 1;

  p.lastActiveDay = today;
  psSaveProgress(p);
  return p.dayStreak;
}

// بيحط شارة "🔥 عدد الأيام" جوه أي عنصر بالـid المدّي، من غير ما يغيّر الستريك
// (الاستخدام: psRenderStreakBadge('streakBadgeEl'))
function psRenderStreakBadge(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const streak = psTouchDailyStreak();
  el.classList.toggle('lit', streak > 0);
  el.innerHTML = `<span class="flame">🔥</span><span>${streak} يوم</span>`;
}
function psLoadProgress() {
  try { return Object.assign(psDefaultProgress(), JSON.parse(localStorage.getItem(PS_PROGRESS_KEY))); }
  catch { return psDefaultProgress(); }
}
function psSaveProgress(p) { localStorage.setItem(PS_PROGRESS_KEY, JSON.stringify(p)); }

// بيسجل إكمال درس مرة واحدة بس (نفس الدرس تاني ما بياخدش XP تاني عشان متتلعبش فيه)
function psRecordLessonComplete(lessonKey, score, total) {
  const p = psLoadProgress();
  if (p.lessonLog[lessonKey]) return { xpGained: 0, newMedals: [], progress: p, repeated: true };

  let xpGained = 15;
  if (total > 0) {
    xpGained += score * 10;
    if (score === total) { p.perfectStreak = (p.perfectStreak || 0) + 1; xpGained += 25; }
    else p.perfectStreak = 0;
  }
  p.xp = (p.xp || 0) + xpGained;
  p.lessonsCompleted = (p.lessonsCompleted || 0) + 1;
  p.lessonLog[lessonKey] = { score, total, at: Date.now() };

  // كل درس بيدي "عملات جهاز" 🪙 كمان غير الـXP - دي اللي بتتصرف في متجر القطع
  const coinsGained = Math.max(5, Math.round(xpGained / 2));
  p.rigCoins = (p.rigCoins || 0) + coinsGained;
  if (!p.rig) p.rig = psDefaultRig();

  const newMedals = [];
  PS_MEDALS.forEach((m) => {
    if (!p.medals.includes(m.id) && m.cond(p)) { p.medals.push(m.id); newMedals.push(m); }
  });

  psSaveProgress(p);
  return { xpGained, coinsGained, newMedals, progress: p, repeated: false };
}

// تظهر توست صغير فوق الشاشة لما تاخد XP أو ميدالية جديدة
function psShowToast(xpGained, newMedals, coinsGained) {
  if (!xpGained && !coinsGained && (!newMedals || !newMedals.length)) return;
  const el = document.createElement('div');
  el.className = 'ps-toast';
  let html = xpGained ? `<span class="ps-toast-xp">+${xpGained} XP</span>` : '';
  if (coinsGained) html += `<span class="ps-toast-coins">+${coinsGained} 🪙</span>`;
  (newMedals || []).forEach((m) => { html += `<span class="ps-toast-medal">${m.icon} ${m.name}</span>`; });
  el.innerHTML = html;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
}

// علامة بسيطة إن المستخدم شغّل نظام Kali حقيقي مرة (PC أو موبايل) — مش بتدّي XP،
// مجرد تسجيل حالة يقرأها أي جزء تاني من المنصة لاحقًا
function psMarkKaliBooted() {
  const p = psLoadProgress();
  p.kaliBooted = true;
  psSaveProgress(p);
}

window.PSProgress = {
  load: psLoadProgress,
  recordLessonComplete: psRecordLessonComplete,
  levelOf: psLevelOf,
  xpIntoLevel: psXpIntoLevel,
  XP_PER_LEVEL,
  MEDALS: PS_MEDALS,
  showToast: psShowToast,
  markKaliBooted: psMarkKaliBooted,
  touchDailyStreak: psTouchDailyStreak,
  renderStreakBadge: psRenderStreakBadge,
  // نظام "جهازي" (Rig)
  RIG_TIERS,
  RIG_SLOTS,
  RIG_MAX_POWER,
  getRig: psGetRig,
  getRigCoins: psGetRigCoins,
  getRigPower: psGetRigPower,
  getRigTierInfo: psGetRigTierInfo,
  buyRigPart: psBuyRigPart,
  isPlacementTestTaken: psIsPlacementTestTaken,
  completePlacementTest: psCompletePlacementTest,
};


// تحميل ملف مزامنة الحساب (تقدم + بيانات الكتاب) جنب الملف ده في نفس المسار
(function loadAccountSync() {
  try {
    const cs = document.currentScript;
    if (!cs || !cs.src) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.src = cs.src.replace(/progress\.js(\?.*)?$/, 'account-sync.js');
    document.head.appendChild(s);
  } catch (e) { /* تجاهل */ }
})();
