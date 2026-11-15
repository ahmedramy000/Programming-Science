// ============================================
// طبقة التخزين: PostgreSQL (لو فيه DATABASE_URL) وإلا ملفات JSON محلية (للتشغيل على جهازك)
// كل السيرفر بيكلم الدوال دي بس، فمش مهم هو أنهي تخزين شغال.
// ============================================
const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const DATABASE_URL = process.env.DATABASE_URL;
const useDb = !!DATABASE_URL;

let pool = null;
const fileSessions = new Map(); // في وضع الملفات بس: التوكن في الذاكرة

if (useDb) {
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
}

function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id, full_name: r.full_name, email: r.email, password_hash: r.password_hash,
    age: r.age, created_at: r.created_at,
  };
}

// ---------- ملفات JSON (وضع التشغيل المحلي) ----------
async function fileReadUsers() {
  try { return JSON.parse(await fs.readFile(USERS_FILE, 'utf8')); } catch { return []; }
}
async function fileWriteUsers(users) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}
async function fileReadProgress() {
  try { return JSON.parse(await fs.readFile(PROGRESS_FILE, 'utf8')); } catch { return {}; }
}
async function fileWriteProgress(store) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(store));
}

// ---------- إنشاء الجداول (مرة واحدة عند التشغيل) ----------
async function init() {
  if (!useDb) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    age INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS progress_items (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    mtime BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, key)
  )`);
  await migrateFromFiles();
}

// لو فيه ملفات JSON قديمة (من النسخة السابقة)، بننقلها للقاعدة مرة واحدة من غير ما نكرر
async function migrateFromFiles() {
  const users = await fileReadUsers();
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, age, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [u.id, u.full_name, String(u.email).toLowerCase(), u.password_hash, u.age || null, u.created_at || new Date().toISOString()]
    ).catch(() => {});
  }
  const progress = await fileReadProgress();
  for (const userId of Object.keys(progress)) {
    const items = (progress[userId] && progress[userId].items) || {};
    for (const key of Object.keys(items)) {
      await pool.query(
        `INSERT INTO progress_items (user_id, key, value, mtime) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, key) DO NOTHING`,
        [userId, key, items[key].value, Number(items[key].mtime) || 0]
      ).catch(() => {});
    }
  }
}

// ---------- المستخدمين ----------
async function findUserByEmail(email) {
  const e = String(email).toLowerCase();
  if (useDb) {
    const r = await pool.query('SELECT * FROM users WHERE email = $1', [e]);
    return rowToUser(r.rows[0]);
  }
  return (await fileReadUsers()).find((u) => u.email.toLowerCase() === e) || null;
}
async function findUserById(id) {
  if (useDb) {
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rowToUser(r.rows[0]);
  }
  return (await fileReadUsers()).find((u) => u.id === id) || null;
}
async function createUser(user) {
  if (useDb) {
    await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, age, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.id, user.full_name, user.email, user.password_hash, user.age, user.created_at]
    );
    return;
  }
  const users = await fileReadUsers();
  users.push(user);
  await fileWriteUsers(users);
}

// ---------- الجلسات (التوكن) ----------
async function createSession(token, userId) {
  if (useDb) {
    await pool.query('INSERT INTO sessions (token, user_id) VALUES ($1,$2)', [token, userId]);
    return;
  }
  fileSessions.set(token, userId);
}
async function getSessionUserId(token) {
  if (!token) return null;
  if (useDb) {
    const r = await pool.query('SELECT user_id FROM sessions WHERE token = $1', [token]);
    return r.rows[0] ? r.rows[0].user_id : null;
  }
  return fileSessions.get(token) || null;
}
async function deleteSession(token) {
  if (!token) return;
  if (useDb) { await pool.query('DELETE FROM sessions WHERE token = $1', [token]); return; }
  fileSessions.delete(token);
}

// ---------- مزامنة التقدم ----------
async function getProgressItems(userId) {
  if (useDb) {
    const r = await pool.query('SELECT key, value, mtime FROM progress_items WHERE user_id = $1', [userId]);
    const items = {};
    r.rows.forEach((row) => { items[row.key] = { value: row.value, mtime: Number(row.mtime) }; });
    return items;
  }
  const store = await fileReadProgress();
  return (store[userId] && store[userId].items) || {};
}

// بنحفظ كل مفتاح لو وقته أحدث من اللي في القاعدة (الأحدث يفوز)
async function upsertProgressItems(userId, incoming) {
  if (useDb) {
    for (const key of Object.keys(incoming)) {
      const it = incoming[key];
      await pool.query(
        `INSERT INTO progress_items (user_id, key, value, mtime) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, key) DO UPDATE
         SET value = EXCLUDED.value, mtime = EXCLUDED.mtime
         WHERE progress_items.mtime <= EXCLUDED.mtime`,
        [userId, key, it.value, it.mtime]
      );
    }
    return getProgressItems(userId);
  }
  const store = await fileReadProgress();
  const items = (store[userId] && store[userId].items) || {};
  Object.keys(incoming).forEach((k) => {
    const it = incoming[k];
    const st = items[k];
    if (!st || it.mtime >= (st.mtime || 0)) items[k] = { value: it.value, mtime: it.mtime };
  });
  store[userId] = { items };
  await fileWriteProgress(store);
  return items;
}

module.exports = {
  useDb, init,
  findUserByEmail, findUserById, createUser,
  createSession, getSessionUserId, deleteSession,
  getProgressItems, upsertProgressItems,
};
