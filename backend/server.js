// ============================================
// Programming Science - Backend API
// نسخة بداية بسيطة (in-memory) - هتتحول لقاعدة بيانات حقيقية
// شوف database/schema.sql للبنية المقترحة
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const crypto = require('crypto');
const store = require('./store');

const app = express();
app.set('trust proxy', 1); // Render/Vercel: IP المستخدم الحقيقي بدل IP البروكسي
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// نظام تسجيل الدخول: المستخدمين والجلسات في PostgreSQL (أو ملفات محلية لو مفيش DATABASE_URL)
// ============================================
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}
function publicUser(u) {
  return { id: u.id, full_name: u.full_name, email: u.email, age: u.age };
}

function bearerToken(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { full_name, email, password, age } = req.body || {};
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والإيميل وكلمة المرور مطلوبين' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور لازم تكون 6 حروف على الأقل' });
    }
    if (await store.findUserByEmail(email)) {
      return res.status(409).json({ error: 'الإيميل ده مسجل قبل كده' });
    }
    const user = {
      id: crypto.randomUUID(),
      full_name,
      email: String(email).toLowerCase(),
      password_hash: hashPassword(password),
      age: age ? parseInt(age, 10) : null,
      created_at: new Date().toISOString(),
    };
    await store.createUser(user);
    const token = crypto.randomBytes(24).toString('hex');
    await store.createSession(token, user.id);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: 'حصل خطأ في التسجيل، جرّب تاني' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'الإيميل وكلمة المرور مطلوبين' });
    }
    const user = await store.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'الإيميل أو كلمة المرور غلط' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await store.createSession(token, user.id);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: 'حصل خطأ في الدخول، جرّب تاني' });
  }
});

async function requireAuth(req, res, next) {
  try {
    const userId = await store.getSessionUserId(bearerToken(req));
    if (!userId) return res.status(401).json({ error: 'لازم تسجل دخول الأول' });
    req.userId = userId;
    next();
  } catch (e) {
    res.status(500).json({ error: 'خطأ في التحقق من الجلسة' });
  }
}

// الأدمن = الإيميل اللي في متغير البيئة ADMIN_EMAIL على Render (مش مكتوب في الكود)
function isAdminUser(u) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return !!adminEmail && !!u && (u.email || '').trim().toLowerCase() === adminEmail;
}

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await store.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'المستخدم مش موجود' });
  res.json({ user: publicUser(user), isAdmin: isAdminUser(user) });
});

// زرار "تحديث الموقع" للأدمن: بيبعت طلب لـ Render Deploy Hook (سري في متغير البيئة RENDER_DEPLOY_HOOK_URL)
app.post('/api/admin/redeploy', requireAuth, async (req, res) => {
  const user = await store.findUserById(req.userId);
  if (!isAdminUser(user)) return res.status(403).json({ error: 'مش مسموح' });
  // بيحدّث الاتنين: الباك إند على Render، والفرونت على Vercel (الـhooks سرية في متغيرات البيئة)
  const targets = [
    { name: 'Render', url: process.env.RENDER_DEPLOY_HOOK_URL },
    { name: 'Vercel', url: process.env.VERCEL_DEPLOY_HOOK_URL },
  ];
  const results = await Promise.all(targets.map(async (t) => {
    if (!t.url) return { name: t.name, ok: false, error: 'مش متظبط' };
    try {
      const r = await fetch(t.url, { method: 'POST' });
      return { name: t.name, ok: r.ok, error: r.ok ? null : `رجّع ${r.status}` };
    } catch {
      return { name: t.name, ok: false, error: 'معرفتش أوصل' };
    }
  }));
  const allOk = results.every((r) => r.ok);
  const summary = results.map((r) => `${r.name}: ${r.ok ? '✅' : '❌ ' + r.error}`).join(' | ');
  res.status(allOk ? 200 : 502).json({
    ok: allOk,
    results,
    message: allOk ? 'اتبعت طلب التحديث لـ Render وVercel. الموقع هيتحدّث خلال دقايق.' : summary,
    error: allOk ? undefined : summary,
  });
});

// ============================================
// مزامنة الحساب: التقدم وبيانات الكتاب، لكل مستخدم في القاعدة
// items = { "مفتاح localStorage": { value: "النص الخام", mtime: وقت آخر تعديل } }
// ============================================
function isSyncKey(k) {
  return k === 'ps_progress_v1' || k === 'kudosk_cyber_progress' ||
    k === 'zakera_registry' || k === 'zakera_active_id' ||
    /^zakera_(profile_|research_draft_)/.test(k);
}

app.get('/api/progress', requireAuth, async (req, res) => {
  try {
    res.json({ items: await store.getProgressItems(req.userId) });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في جلب التقدم' });
  }
});

app.put('/api/progress', requireAuth, async (req, res) => {
  try {
    const incoming = req.body && req.body.items;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ error: 'البيانات مش صح' });
    }
    const clean = {};
    Object.keys(incoming).forEach((k) => {
      const inc = incoming[k];
      if (!isSyncKey(k) || !inc || typeof inc.value !== 'string') return;
      clean[k] = { value: inc.value, mtime: Number(inc.mtime) || 0 };
    });
    const total = Object.values(clean).reduce((n, it) => n + it.value.length, 0);
    if (total > 9000000) return res.status(413).json({ error: 'بيانات الحساب كبيرة أوي' });
    const items = await store.upsertProgressItems(req.userId, clean);
    res.json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في حفظ التقدم' });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try { await store.deleteSession(bearerToken(req)); } catch (e) { /* تجاهل */ }
  res.json({ ok: true });
});

// ---------- بيانات مبدئية (هتتنقل لقاعدة بيانات بعدين) ----------
const tracks = [
  { id: 'general', title: 'برمجة عامة', emoji: '🧩', lessonsCount: 15 },
  { id: 'cyber', title: 'الأمن السيبراني', emoji: '🛡️', lessonsCount: 1 },
  { id: 'web', title: 'تطوير الويب', emoji: '🌐', lessonsCount: 0 },
  { id: 'games', title: 'تصميم الألعاب', emoji: '🎮', lessonsCount: 0 },
];

// إعدادات الصعوبة حسب السن لدرس "نظّف الشبكة" (الأمن السيبراني)
const ageLevels = {
  7:  { size: 4, goal: { x: 3, y: 3 }, viruses: [{ x: 1, y: 1 }], blocks: ['right', 'left', 'down', 'up'] },
  8:  { size: 4, goal: { x: 3, y: 3 }, viruses: [{ x: 1, y: 1 }, { x: 2, y: 2 }], blocks: ['right', 'left', 'down', 'up'] },
  9:  { size: 5, goal: { x: 4, y: 4 }, viruses: [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 1 }], blocks: ['right', 'left', 'down', 'up', 'repeat'] },
  10: { size: 6, goal: { x: 5, y: 5 }, viruses: [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 4, y: 4 }, { x: 1, y: 4 }], blocks: ['right', 'left', 'down', 'up', 'repeat'] },
};

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'programming-science-backend' });
});

app.get('/api/tracks', (req, res) => {
  res.json(tracks);
});

app.get('/api/lessons/cyber-maze/:age', (req, res) => {
  const age = parseInt(req.params.age, 10);
  const level = ageLevels[age];
  if (!level) {
    return res.status(404).json({ error: 'مفيش مستوى لهذا السن حاليًا (المتاح 7-10)' });
  }
  res.json({ age, ...level });
});

// ============================================
// ⚠️ تشغيل كود المستخدم — "الوضع الوسط"
// ده MVP بحماية أساسية بس مش بديل عن عزل حقيقي (Docker/VM منفصلة).
// قبل أي إطلاق عام لعدد كبير من المستخدمين، لازم تنقل التنفيذ
// لخدمة معزولة تمامًا (container لكل طلب، بلا شبكة، بلا وصول للملفات).
// ============================================

// اللغات اللي السيرفر يقدر ينفّذها فعليًا — بنكتشف الموجود منها وقت التشغيل (مش بنفترض)
// interpreted: بيتشغّل مباشرة | compile: بيتبني الأول وبعدين بيتشغّل
const LANG_DEFS = {
  python:     { label: 'Python',     bins: ['python3'],          file: 'main.py',   run: () => ['python3', ['main.py']] },
  javascript: { label: 'JavaScript', bins: ['node'],             file: 'main.js',   run: () => ['node', ['main.js']] },
  php:        { label: 'PHP',        bins: ['php'],              file: 'main.php',  run: () => ['php', ['main.php']] },
  ruby:       { label: 'Ruby',       bins: ['ruby'],             file: 'main.rb',   run: () => ['ruby', ['main.rb']] },
  c:          { label: 'C',          bins: ['gcc'],              file: 'main.c',    compile: () => ['gcc', ['main.c', '-o', 'prog', '-lm']], run: () => ['./prog', []] },
  cpp:        { label: 'C++',        bins: ['g++'],              file: 'main.cpp',  compile: () => ['g++', ['main.cpp', '-o', 'prog']],       run: () => ['./prog', []] },
  java:       { label: 'Java',       bins: ['javac', 'java'],    file: 'Main.java', compile: () => ['javac', ['Main.java']],                  run: () => ['java', ['-Xmx128m', 'Main']] },
};

async function hasBinary(bin) {
  const exts = process.platform === 'win32' ? ['', ...(process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')] : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    for (const ext of exts) {
      try { await fs.access(path.join(dir, bin + ext)); return true; } catch { /* جرّب اللي بعده */ }
    }
  }
  return false;
}

const availableLangs = new Set();
async function detectLanguages() {
  for (const [id, def] of Object.entries(LANG_DEFS)) {
    const found = await Promise.all(def.bins.map(hasBinary));
    if (found.every(Boolean)) availableLangs.add(id);
  }
  console.log('لغات التنفيذ المتاحة على السيرفر:', [...availableLangs].join(', ') || 'مفيش');
}

// المحرر الحر بيسأل السيرفر إيه اللغات الجاهزة فعلًا
app.get('/api/languages', (req, res) => {
  res.json({ languages: Object.entries(LANG_DEFS).map(([id, d]) => ({ id, label: d.label, ready: availableLangs.has(id) })) });
});

const MAX_CODE_LENGTH = 20000;
const COMPILE_TIMEOUT_MS = 15000;
const EXEC_TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 200 * 1024;
const MAX_CONCURRENT_RUNS = 3; // السيرفر المجاني صغير: مش هننفذ أكتر من 3 مرة واحدة
let activeRuns = 0;

// rate limit بسيط جدًا بالـ IP (في الذاكرة فقط - يكفي للـ MVP)
const rateMap = new Map();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_REQUESTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || [];
  const recent = entry.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateMap.set(ip, recent);
  return recent.length > RATE_MAX_REQUESTS;
}

// 🔒 كود المستخدم بيتشغّل ببيئة نضيفة: مفيش DATABASE_URL ولا Deploy Hooks ولا أي سر من متغيرات السيرفر
function sandboxEnv(dir) {
  return { PATH: process.env.PATH || '', HOME: dir, TMPDIR: dir, LANG: 'C.UTF-8' };
}

function execInDir(cmd, args, dir, timeout) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd: dir, env: sandboxEnv(dir), timeout, killSignal: 'SIGKILL', maxBuffer: MAX_OUTPUT_BYTES, windowsHide: true },
      (err, stdout, stderr) => {
        if (err && err.killed) return resolve({ timedOut: true, output: '', error: '' });
        resolve({ failed: !!err, output: (stdout || '').slice(0, 5000), error: (stderr || '').slice(0, 2000) });
      });
  });
}

app.post('/run', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'طلبات كتير أوي في وقت قصير، استنى شوية وحاول تاني' });
  }

  const { code, language } = req.body || {};
  const def = Object.prototype.hasOwnProperty.call(LANG_DEFS, language) ? LANG_DEFS[language] : null;
  if (!def) {
    return res.status(400).json({ error: 'اللغة مش مدعومة' });
  }
  if (!availableLangs.has(language)) {
    return res.status(501).json({ error: `${def.label} مش متثبتة على السيرفر ده حاليًا` });
  }
  if (typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: 'الكود فاضي أو طويل أكتر من اللازم' });
  }
  if (activeRuns >= MAX_CONCURRENT_RUNS) {
    return res.status(503).json({ error: 'السيرفر مشغول بتنفيذ أكواد تانية، جرّب بعد ثواني' });
  }

  activeRuns++;
  const dir = path.join(os.tmpdir(), `kudosk-${crypto.randomUUID()}`);
  try {
    await fs.mkdir(dir, { mode: 0o700 });
    await fs.writeFile(path.join(dir, def.file), code, { mode: 0o600 });

    if (def.compile) {
      const [ccmd, cargs] = def.compile();
      const c = await execInDir(ccmd, cargs, dir, COMPILE_TIMEOUT_MS);
      if (c.timedOut) return res.json({ output: '', error: '⏱ انتهت مهلة البناء (Compile)' });
      if (c.failed) return res.json({ output: '', error: c.error || c.output || 'فشل البناء (Compile error)' });
    }
    const [rcmd, rargs] = def.run();
    const r = await execInDir(rcmd, rargs, dir, EXEC_TIMEOUT_MS);
    if (r.timedOut) return res.json({ output: '', error: '⏱ انتهت المهلة المسموحة (5 ثواني)' });
    res.json({ output: r.output, error: r.error });
  } catch (e) {
    res.status(500).json({ error: 'حصل خطأ في السيرفر وإحنا بنجهّز الكود' });
  } finally {
    activeRuns--;
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

store.init()
  .then(() => detectLanguages())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 السيرفر شغال على http://localhost:${PORT} — تخزين: ${store.useDb ? 'PostgreSQL' : 'ملفات محلية'}`);
    });
  })
  .catch((e) => {
    console.error('فشل الاتصال بقاعدة البيانات:', e.message);
    process.exit(1);
  });
