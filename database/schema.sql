-- ============================================
-- Programming Science - بنية قاعدة البيانات (PostgreSQL)
-- شغّلها بـ: psql -U postgres -d programming_science -f schema.sql
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    age INTEGER CHECK (age >= 5 AND age <= 18),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(40) PRIMARY KEY,         -- مثال: 'cyber', 'general', 'web'
    title VARCHAR(120) NOT NULL,
    emoji VARCHAR(10),
    description TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    track_id VARCHAR(40) REFERENCES tracks(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    min_age INTEGER DEFAULT 7,
    max_age INTEGER DEFAULT 10,
    config JSONB,                       -- إعدادات الدرس (حجم الخريطة، الفيروسات، البلوكات المتاحة...)
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- بيانات مبدئية
INSERT INTO tracks (id, title, emoji, description) VALUES
    ('general', 'برمجة عامة', '🧩', 'أساسيات المنطق والتسلسل'),
    ('cyber', 'الأمن السيبراني', '🛡️', 'اكتشاف الفيروسات والتهديدات'),
    ('web', 'تطوير الويب', '🌐', 'بناء صفحات بسيطة'),
    ('games', 'تصميم الألعاب', '🎮', 'شخصيات وقصص تفاعلية')
ON CONFLICT (id) DO NOTHING;
