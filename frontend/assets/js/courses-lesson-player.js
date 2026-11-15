function progressKey(gradeId, termId, unitId) {
  return `kudosk_course_progress_${gradeId}_${termId}_${unitId}`;
}
function getUnitProgress(gradeId, termId, unitId) {
  try { return JSON.parse(localStorage.getItem(progressKey(gradeId, termId, unitId))) || {}; }
  catch { return {}; }
}
function markLessonDone(gradeId, termId, unitId, lessonId) {
  const p = getUnitProgress(gradeId, termId, unitId);
  p[lessonId] = true;
  localStorage.setItem(progressKey(gradeId, termId, unitId), JSON.stringify(p));
}

const params = new URLSearchParams(location.search);
const gradeId = params.get('grade');
const termId = params.get('term');
const unitId = parseInt(params.get('unit'), 10);
const lessonId = parseInt(params.get('lesson'), 10);

document.getElementById('backToUnit').href = `unit.html?grade=${gradeId}&term=${termId}&unit=${unitId}`;
document.getElementById('backBtn').href = `unit.html?grade=${gradeId}&term=${termId}&unit=${unitId}`;

const course = COURSES[getCourseKey(gradeId, termId)];
const unit = course ? course.units.find((u) => u.id === unitId) : null;
const lesson = unit ? unit.lessons.find((l) => l.id === lessonId) : null;
const container = document.getElementById('engineContainer');

if (!lesson) {
  container.innerHTML = '<p>الدرس ده مش موجود.</p>';
} else {
  document.title = `علوم البرمجة — ${lesson.title}`;
  document.getElementById('lessonHeaderTitle').textContent = `${lesson.emoji || ''} ${lesson.title}`;
  document.getElementById('lessonTitle').textContent = `${lesson.emoji || ''} ${lesson.title}`;

  function onDone(a, b) {
    markLessonDone(gradeId, termId, unitId, lesson.id);
    if (window.PSProgress) {
      const key = `courses:${gradeId}:${termId}:${unitId}:${lesson.id}`;
      const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete(key, a || 0, b || 0);
      window.PSProgress.showToast(xpGained, newMedals, coinsGained);
    }
    const doneBanner = document.getElementById('doneBanner');
    const doneText = document.getElementById('doneText');
    const nextBtn = document.getElementById('nextBtn');

    doneText.textContent = lesson.type === 'quiz' || (lesson.type === 'chat' && b > 0)
      ? `خلصت الاختبار! نتيجتك: ${a} من ${b} 🎉`
      : 'خلصت الدرس! 🎉';

    const idx = unit.lessons.findIndex((l) => l.id === lesson.id);
    const nextLesson = unit.lessons[idx + 1];
    if (nextLesson) {
      nextBtn.href = `lesson.html?grade=${gradeId}&term=${termId}&unit=${unitId}&lesson=${nextLesson.id}`;
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
      doneText.textContent += ' خلصت الوحدة كلها! 🏆';
    }
    doneBanner.style.display = 'flex';
  }

  if (lesson.type === 'maze') {
    KudoskEngine.renderMaze(container, lesson, () => onDone());
  } else if (lesson.type === 'card') {
    KudoskEngine.renderCards(container, lesson, () => onDone());
  } else if (lesson.type === 'chat') {
    KudoskEngine.renderChat(container, lesson, (score, total) => onDone(score, total));
  } else if (lesson.type === 'code') {
    KudoskEngine.renderCode(container, lesson, () => onDone());
  } else {
    KudoskEngine.renderQuiz(container, lesson, (score, total) => onDone(score, total));
  }
}
