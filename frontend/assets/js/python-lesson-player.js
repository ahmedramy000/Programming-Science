const PROGRESS_KEY = 'kudosk_python_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function markDone(id) {
  const p = getProgress();
  p[id] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

const params = new URLSearchParams(location.search);
const id = parseInt(params.get('id'), 10);
const lesson = PYTHON_LESSONS.find((l) => l.id === id);
const container = document.getElementById('engineContainer');

if (!lesson) {
  container.innerHTML = '<p>الدرس ده مش موجود. <a href="index.html">رجوع للمركز</a></p>';
} else {
  document.title = `علوم البرمجة — ${lesson.title}`;
  document.getElementById('lessonHeaderTitle').textContent = `${lesson.emoji} ${lesson.title}`;
  document.getElementById('lessonTitle').textContent = `${lesson.emoji} ${lesson.title}`;
  document.getElementById('lessonDesc').textContent = lesson.description;

  function onDone(a, b) {
    markDone(lesson.id);
    if (window.PSProgress) {
      const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete(`python:${lesson.id}`, a || 0, b || 0);
      window.PSProgress.showToast(xpGained, newMedals, coinsGained);
    }
    const doneBanner = document.getElementById('doneBanner');
    const doneText = document.getElementById('doneText');
    const nextBtn = document.getElementById('nextBtn');

    doneText.textContent = (b > 0) ? `خلصت الاختبار! نتيجتك: ${a} من ${b} 🎉` : 'خلصت الدرس بنجاح! 🎉';

    const nextLesson = PYTHON_LESSONS.find((l) => l.id === lesson.id + 1);
    if (nextLesson) {
      nextBtn.href = `lesson.html?id=${nextLesson.id}`;
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
      doneText.textContent += ' خلصت كل الكورس لحد دلوقتي! 🏆';
    }
    doneBanner.style.display = 'flex';
  }

  if (lesson.type === 'quiz') {
    KudoskEngine.renderQuiz(container, lesson, (score, total) => onDone(score, total));
  } else {
    KudoskEngine.renderChat(container, lesson, (score, total) => onDone(score, total));
  }
}
