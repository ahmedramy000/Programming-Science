const PROGRESS_KEY = 'kudosk_cyber_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function markDone(id) {
  const p = getProgress();
  p[id] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

const RIG_TIER_RANK = { weak: 0, mid: 1, strong: 2 };
const RIG_TIER_NAMES = { weak: 'ضعيف 🐢', mid: 'متوسط ⚙️', strong: 'قوي 🚀' };

const params = new URLSearchParams(location.search);
const id = parseInt(params.get('id'), 10);
const lessonIndex = CYBER_LESSONS.findIndex((l) => l.id === id);
const lesson = lessonIndex === -1 ? null : CYBER_LESSONS[lessonIndex];
const container = document.getElementById('engineContainer');

if (!lesson) {
  container.innerHTML = '<p>الدرس ده مش موجود. <a href="index.html">رجوع للمركز</a></p>';
} else if (lesson.requiresRigTier && window.PSProgress && RIG_TIER_RANK[window.PSProgress.getRigTierInfo().key] < RIG_TIER_RANK[lesson.requiresRigTier]) {
  // بوابة قوة الجهاز: بعض التحديات (زي تحدي التخرج) محتاجة جهاز متوسط
  // على الأقل عشان "يقدر يشغّلها" - بتربط متجر القطع بالمنهج نفسه.
  const needed = RIG_TIER_NAMES[lesson.requiresRigTier];
  container.innerHTML = `
    <div style="text-align:center; padding:30px 14px;">
      <div style="font-size:40px; margin-bottom:10px;">🔒🖥️</div>
      <h2 style="margin:0 0 8px;">التحدي ده محتاج جهاز ${needed} على الأقل</h2>
      <p style="color:var(--muted); font-size:13px; max-width:360px; margin:0 auto 18px;">
        "${lesson.title}" تحدي تقيل بيحتاج معالجة قوية — جهازك الحالي لسه ما وصلش للمستوى ده.
        رقّي جهازك من صفحة "جهازي" بالعملات اللي جمعتها من الدروس، وارجع تاني.
      </p>
      <a href="../rig/index.html" style="display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg,#7c5cff,#22d3ee); color:#fff; text-decoration:none; font-weight:bold; font-size:13px; padding:10px 20px; border-radius:12px;">
        🖥️ روح لـ"جهازي" رقّي الآن
      </a>
    </div>`;
  document.getElementById('lessonHeaderTitle').textContent = `🔒 ${lesson.title}`;
  document.getElementById('lessonTitle').textContent = `🔒 ${lesson.title}`;
  document.getElementById('lessonDesc').textContent = 'محتاج ترقية جهاز الأول.';
} else {
  document.title = `علوم البرمجة — ${lesson.title}`;
  document.getElementById('lessonHeaderTitle').textContent = `${lesson.emoji} ${lesson.title}`;
  document.getElementById('lessonTitle').textContent = `${lesson.emoji} ${lesson.title}`;
  document.getElementById('lessonDesc').textContent = lesson.description;

  // --- Sidebar بستايل غرفة TryHackMe: صعوبة + قائمة مهام الغرفة ---
  (function renderSidebar() {
    const diff = (typeof cyberDifficultyOf === 'function') ? cyberDifficultyOf(lesson) : null;
    if (diff) {
      [document.getElementById('headerDiffBadge'), document.getElementById('sideDiffBadge')].forEach((el) => {
        if (!el) return;
        el.textContent = diff.label;
        el.style.background = diff.color + '26';
        el.style.color = diff.color;
        el.style.borderColor = diff.color;
      });
    }
    const sideEmoji = document.getElementById('sideEmoji');
    const sideTitle = document.getElementById('sideTitle');
    if (sideEmoji) sideEmoji.textContent = lesson.emoji || '🛡️';
    if (sideTitle) sideTitle.textContent = lesson.title;
    const sidePoints = document.getElementById('sidePoints');
    if (sidePoints) sidePoints.textContent = '+50 XP'; // نفس المعادلة الفعلية في progress.js لإتمام أي درس terminal

    const hasTasks = Array.isArray(lesson.tasks) && lesson.tasks.length > 0;
    const taskList = document.getElementById('sideTaskList');
    const items = hasTasks ? lesson.tasks.map((t, i) => ({ label: `المهمة ${i + 1}` })) : [{ label: 'المهمة الرئيسية' }];
    taskList.innerHTML = items.map((it, i) => `
      <div class="thm-task-siderow" id="sideTaskRow${i}"><span class="thm-task-check" id="sideTaskCheck${i}">⬜</span><span>${it.label}</span></div>
    `).join('');

    // متابعة بسيطة لتحديث العلامات في الـsidebar مع تقدّم الطالب جوه الـengine
    const total = items.length;
    const pollId = setInterval(() => {
      let doneCount = 0;
      for (let i = 0; i < total; i++) {
        const isDone = hasTasks
          ? !!document.getElementById(`engTask${i}`)?.classList.contains('eng-task-done')
          : document.getElementById('engTermFeedback')?.classList.contains('eng-success');
        const checkEl = document.getElementById(`sideTaskCheck${i}`);
        if (checkEl) checkEl.textContent = isDone ? '✅' : '⬜';
        if (isDone) doneCount++;
      }
      if (doneCount === total) clearInterval(pollId);
    }, 400);
  })();

  function onDone(a, b) {
    markDone(lesson.id);
    if (window.PSProgress) {
      const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete(`cyber:${lesson.id}`, a || 0, b || 0);
      window.PSProgress.showToast(xpGained, newMedals, coinsGained);
    }
    const doneBanner = document.getElementById('doneBanner');
    const doneText = document.getElementById('doneText');
    const nextBtn = document.getElementById('nextBtn');

    if (lesson.type === 'quiz' || lesson.type === 'scenario') {
      doneText.textContent = `خلصت التحدي! نتيجتك: ${a} من ${b} 🎉`;
    } else {
      doneText.textContent = 'خلصت التحدي بنجاح! 🎉';
    }

    // بيلاقي "الدرس الجاي" حسب ترتيبه الفعلي في المصفوفة (ترتيب المستويات)
    // مش حسب رقم id+1 - عشان الـids مش متسلسلة بترتيب العرض بعد تقسيم المستويات.
    const nextLesson = CYBER_LESSONS[lessonIndex + 1];
    if (nextLesson) {
      nextBtn.href = `lesson.html?id=${nextLesson.id}`;
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
      doneText.textContent += ' خلصت كل المسار! 🏆';
    }
    doneBanner.style.display = 'flex';
  }

  if (lesson.type === 'maze') {
    KudoskEngine.renderMaze(container, lesson, () => onDone());
  } else if (lesson.type === 'scenario') {
    KudoskEngine.renderScenario(container, lesson, (score, total) => onDone(score, total));
  } else if (lesson.type === 'terminal') {
    KudoskEngine.renderTerminal(container, lesson, (score, total) => onDone(score, total));
  } else {
    KudoskEngine.renderQuiz(container, lesson, (score, total) => onDone(score, total));
  }
}
