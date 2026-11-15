# Kudosk — بيئة علوم البرمجة (3 أوضاع)

منصة تعليم برمجة بـ3 مستويات حسب قوة الجهاز، بالإضافة لمسار أمن سيبراني تفاعلي.

## الهيكل
```
frontend/                      (يترفع على Vercel)
├── index.html                 # الصفحة الرئيسية - ديسكتوب Kali وهمي + 3 أزرار أوضاع
├── manifest.json + sw.js       # PWA - قابل للتثبيت على أندرويد/ديسكتوب
├── assets/
│   ├── css/                   # كل تنسيقات الصفحات، ملف لكل صفحة
│   └── js/                    # كل منطق الصفحات، ملف لكل صفحة
├── light/index.html            # Monaco + Pyodide + xterm.js — بايثون كامل جوا المتصفح
├── middle/index.html           # CodeMirror خفيف + مؤشر حالة اتصال بالسيرفر
├── full/
│   ├── index.html              # قائمة رئيسية: تثبيت Kali، تثبيت IDE، شاشة النتيجة
│   ├── install.bat              # WSL + Kali (ويندوز) — يفتح success.html لما يخلص
│   ├── setup.sh                 # Termux + Kali (أندرويد) — يفتح success.html لما يخلص
│   ├── install-ide.bat           # VS Code + الإضافات من extensions.txt
│   ├── extensions.txt            # 📄 مكتبة إضافات قابلة للتعديل براحتك
│   └── success.html              # شاشة نتيجة التثبيت (نجاح/فشل)
├── scratch/index.html           # محرر Scratch (TurboWarp) مفتوح جوا الموقع مباشرة
└── game/index.html              # 🎮 الميني جيم الأصلي (مخفي - أيقونة 🗑️ في الصفحة الرئيسية)

backend/                       (يترفع على Render باسم kudosk-api)
├── server.js                  # API + endpoint تشغيل الكود /run
└── package.json

database/schema.sql            # بنية قاعدة بيانات PostgreSQL
render.yaml                     # إعداد نشر تلقائي على Render
setup-linux.sh                    # تثبيت أدوات التطوير (Node, PostgreSQL, Docker, VS Code)
```

## تشغيل محلي
```bash
cd backend
npm install
npm start          # http://localhost:4000
```

## النشر

### 1) الباك إند على Render
ادفع المشروع على GitHub → render.com → New → Blueprint → اختار الريبو (هيقرأ `render.yaml` تلقائيًا).
اسم الخدمة: **kudosk-api** → الرابط هيكون شبه `https://kudosk-api.onrender.com`

### 2) الفرونت إند على Vercel
```bash
npm i -g vercel
cd frontend
vercel deploy --prod
```

### 3) بعد النشر، المكان الوحيد اللي محتاج تحدّثه:
- `frontend/middle/index.html` → متغيّر `API_BASE` و `API_URL` (لازم فعلًا عشان ده نداء API حقيقي)
- سكريبتات `full/` (install.bat, setup.sh, install-ide.bat) **مش محتاجة رابط الموقع خالص** —
  بتفتح شاشة النتيجة من نفس مكان الملف على جهاز المستخدم (`file://`)، فتشتغل حتى لو الموقع
  لسه مش متنشر.

> ملحوظة: خطة Render المجانية بتنام بعد عدم استخدام، وبتاخد ١٠-٣٠ ثانية تصحى — طبيعي.

## شاشة نتيجة التثبيت
`install.bat` و `setup.sh` و `install-ide.bat` كلهم بيفتحوا `full/success.html` تلقائي
لما يخلصوا (✅ نجاح أو ❌ فشل حسب نتيجة التنفيذ)، عشان المستخدم يشوف النتيجة فورًا من غير
ما يفضل يحدّق في نافذة الأوامر.

## مكتبة إضافات IDE
`frontend/full/extensions.txt` ملف نصي بسيط، سطر لكل إضافة VS Code.
زوّد أو امسح أي سطر براحتك — `install-ide.bat` بيقرأه تلقائي في كل مرة يتشغّل.
الأساسيات الموجودة حاليًا: Python, Pylance, Code Runner, GitLens, Prettier, Remote-WSL.

## Scratch
صفحة `scratch/index.html` بتفتح محرر متوافق مع Scratch (TurboWarp، مفتوح المصدر) **جوا الموقع
نفسه** عن طريق iframe، مش تحويل لموقع تاني. زرار "⬇️ نسخة أوفلاين" في الأعلى بيوديك لتحميل
Scratch الرسمي من MIT لو حد عايز يشتغل بدون نت نهائي (الملف الأصلي كبير فمش بنستضيفه إحنا).

## ⚠️ تنبيه أمني مهم عن /run
- Timeout 5 ثواني، حد أقصى للمخرجات، لغتين بس (python/javascript)، rate limiting بسيط بالـ IP.
- **ده مش عزل حقيقي (sandboxing).** قبل فتح المنصة لعدد كبير من المستخدمين، استخدم Docker
  container منفصل لكل تنفيذ، أو خدمة جاهزة زي Piston/Judge0، أو اكتفِ بالوضع الخفيف (Pyodide)
  اللي بيشتغل جوا متصفح المستخدم نفسه بدون أي خطر على السيرفر.

## الوضع الكامل (`full/`)
- `install.bat` → `wsl --install kali-linux` (ويندوز)
- `setup.sh` → `pkg install proot-distro -y && proot-distro install kali` (أندرويد عبر Termux)
- `install-ide.bat` → VS Code + الإضافات (ويندوز فقط حاليًا؛ على أندرويد استخدم محرر نصوص
  داخل Kali المثبتة أو code-server لو حابب تضيفه بنفسك)

محتاجين مساحة (1-3 جيجا تقريبًا) واتصال إنترنت وقت التثبيت بس.

## مسار الأمن السيبراني (15 درس)
- `frontend/cyber/index.html` — مركز الدروس (بيفتح درس بعد ما تخلص اللي قبله، تقدم محفوظ بـ localStorage)
- `frontend/cyber/lesson.html?id=N` — صفحة تشغيل أي درس
- `frontend/assets/js/cyber-engine.js` — **المحرك المشترك**: متاهة بالبلوكات (`renderMaze`) واختبار اختيار من متعدد (`renderQuiz`)
- `frontend/assets/js/cyber-lessons.js` — بيانات الـ15 درس (5 متاهات + 9 اختبارات + اختبار نهائي شامل)
- عايز تضيف درس 16؟ زوّد object جديد في `cyber-lessons.js` بنفس الشكل (type: 'maze' أو 'quiz') وهيظهر تلقائي في المركز.

## محاكاة تيرمينال لينكس (الوضع الخفيف)
- `frontend/light/terminal.html` — محاكاة بسيطة لأوامر لينكس (ls, cd, cat, mkdir, touch, whoami, neofetch...)
  على نظام ملفات وهمي بالكامل في المتصفح. تعليمية بس، مفيش تنفيذ حقيقي لأي حاجة.
- فيها "flag" مخبي في `secrets/flag.txt` كمقدمة بسيطة لفكرة الـ CTF (مسابقات الأمن السيبراني).

## المنهج الدراسي (مهيّأ لدمج محتوى "علوم البرمجة")
الفكرة: Kudosk هيبقى الموقع التفاعلي، والمنصة القديمة (علوم البرمجة) هتبقى مرجع ("كتاب").
الهيكل جاهز لاستقبال المحتوى من غير أي تعديل في الكود:

- `frontend/courses/index.html` — اختيار الصف (إعدادي٣ / ثانوي١ / بكالوريا٢) + تابات الترم
- `frontend/courses/unit.html` — عرض دروس وحدة معينة
- `frontend/courses/lesson.html` — تشغيل الدرس (بطاقة معلومات / اختبار / متاهة)
- `frontend/assets/js/courses-data.js` — **هنا بس** تضيف المحتوى. وحدات الصف الأول الثانوي/الترم
  الأول الـ13 متعرّفة بعناوين مؤقتة ("الوحدة 1"..."الوحدة 13") وبمصفوفة `lessons: []` فاضية —
  زوّد فيها دروس بالشكل ده وهتظهر تلقائي، بدون ما تلمس أي صفحة تانية:
  ```js
  { id: 1, type: 'card', emoji: '📡', title: 'مفهوم المعلومات',
    cards: [{ emoji: '💡', title: 'إيه هي المعلومة؟', body: 'نص الشرح هنا...' }] }
  { id: 2, type: 'quiz', emoji: '📝', title: 'اختبار سريع',
    questions: [{ q: '...', options: [...], correct: 0, explain: '...' }] }
  ```
- باقي الصفوف/الترمات (`prep3-term1`, `bac2-term2`, إلخ) متعرّفة في نفس الملف بمصفوفة
  وحدات فاضية — نفس الفكرة، جاهزة تتملى.
- التقدم بيتحفظ تلقائي بـ localStorage لكل وحدة لوحدها (نفس أسلوب مسار الأمن السيبراني).

## الخطوات الجاية المقترحة
- [ ] عزل حقيقي لتنفيذ الكود (أولوية أمنية قبل الإطلاق العام)
- [ ] ربط قاعدة البيانات فعليًا بالسيرفر (بدل localStorage للتقدم)
- [ ] نظام تسجيل دخول وحفظ تقدم الطالب على السيرفر
- [ ] إضافة دروس لمسارات تانية (ويب، تصميم ألعاب) بنفس محرك cyber-engine.js
