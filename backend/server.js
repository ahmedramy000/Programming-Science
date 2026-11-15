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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// نظام تسجيل الدخول — MVP بسيط (ملف JSON بدل قاعدة بيانات حقيقية مؤقتًا)
// لما تجهز تنقل لـ PostgreSQL، schema.sql فيه جدول users جاهز بنفس الأعمدة.
// ============================================
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const tokens = new Map(); // token -> userId (في الذاكرة فقط؛ بيتصفر لما السيرفر يعيد التشغيل)

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function writeUsers(users) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

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

app.post('/api/auth/signup', async (req, res) => {
  const { full_name, email, password, age } = req.body || {};
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والإيميل وكلمة المرور مطلوبين' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور لازم تكون 6 حروف على الأقل' });
  }
  const users = await readUsers();
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
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
  users.push(user);
  await writeUsers(users);

  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'الإيميل وكلمة المرور مطلوبين' });
  }
  const users = await readUsers();
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'الإيميل أو كلمة المرور غلط' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const userId = token && tokens.get(token);
  if (!userId) return res.status(401).json({ error: 'لازم تسجل دخول الأول' });
  req.userId = userId;
  next();
}

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const users = await readUsers();
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'المستخدم مش موجود' });
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) tokens.delete(token);
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

// لغات مسموحة بس — أي لغة تانية مرفوضة فورًا
const RUNNERS = {
  python: { cmd: 'python3', ext: '.py' },
  javascript: { cmd: 'node', ext: '.js' },
};

const MAX_CODE_LENGTH = 20000;
const EXEC_TIMEOUT_MS = 5000;
const MAX_OUTPUT_BYTES = 200 * 1024;

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

app.post('/run', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'طلبات كتير أوي في وقت قصير، استنى شوية وحاول تاني' });
  }

  const { code, language } = req.body || {};
  const runner = RUNNERS[language];
  if (!runner) {
    return res.status(400).json({ error: 'اللغة مش مدعومة (python أو javascript بس حاليًا)' });
  }
  if (typeof code !== 'string' || code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: 'الكود فاضي أو طويل أكتر من اللازم' });
  }

  const tmpFile = path.join(os.tmpdir(), `kudosk-${crypto.randomUUID()}${runner.ext}`);
  try {
    await fs.writeFile(tmpFile, code, { mode: 0o600 });

    const result = await new Promise((resolve) => {
      execFile(
        runner.cmd,
        [tmpFile],
        { timeout: EXEC_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES, windowsHide: true },
        (err, stdout, stderr) => {
          if (err && err.killed) {
            return resolve({ output: '', error: '⏱ انتهت المهلة المسموحة (5 ثواني)' });
          }
          resolve({ output: (stdout || '').slice(0, 5000), error: (stderr || '').slice(0, 2000) });
        }
      );
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'حصل خطأ في السيرفر وإحنا بنجهّز الكود' });
  } finally {
    fs.unlink(tmpFile).catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
});
