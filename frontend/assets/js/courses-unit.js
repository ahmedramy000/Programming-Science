function progressKey(gradeId, termId, unitId) {
  return `kudosk_course_progress_${gradeId}_${termId}_${unitId}`;
}
function getUnitProgress(gradeId, termId, unitId) {
  try { return JSON.parse(localStorage.getItem(progressKey(gradeId, termId, unitId))) || {}; }
  catch { return {}; }
}

const params = new URLSearchParams(location.search);
const gradeId = params.get('grade');
const termId = params.get('term');
const unitId = parseInt(params.get('unit'), 10);

const course = COURSES[getCourseKey(gradeId, termId)];
const unit = course ? course.units.find((u) => u.id === unitId) : null;
const gridEl = document.getElementById('unitLessonGrid');

if (!unit) {
  gridEl.innerHTML = '<p>الوحدة دي مش موجودة. <a href="index.html">رجوع للمنهج</a></p>';
} else {
  document.title = `علوم البرمجة — ${unit.title}`;
  document.getElementById('unitHeaderTitle').textContent = `${unit.emoji} ${unit.title}`;
  document.getElementById('unitTitle').textContent = `${unit.emoji} ${unit.title}`;

  const progress = getUnitProgress(gradeId, termId, unitId);

  if (unit.lessons.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        🚧
        <h3>محتوى الوحدة قريبًا</h3>
        <p>المكان جاهز ومجهّز — هيتفتح تلقائيًا أول ما يُضاف المحتوى.</p>
      </div>`;
  } else {
    gridEl.className = 'lesson-path';
    gridEl.innerHTML = `<div class="lesson-start-flag"><span class="flag-ic">🚩</span>ابدأ هنا</div>`;

    // زِغزاج زي السلم: يمين، نص، شمال، نص... بيتكرر
    const ALIGN_CYCLE = ['end', 'center', 'start', 'center'];

    unit.lessons.forEach((lesson, i) => {
      const isDone = !!progress[lesson.id];
      const isUnlocked = i === 0 || !!progress[unit.lessons[i - 1].id];
      const isCurrent = isUnlocked && !isDone;
      const typeIcon = { card: '📖', quiz: '📝', maze: '🧩', chat: '💬', code: '👨‍💻' }[lesson.type] || '📄';
      const align = ALIGN_CYCLE[i % ALIGN_CYCLE.length];

      const row = document.createElement('div');
      row.className = `lesson-node-row align-${align}`;

      const node = document.createElement(isUnlocked ? 'a' : 'div');
      node.className = 'lesson-node' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '') + (!isUnlocked ? ' locked' : '');
      if (isUnlocked) node.href = `lesson.html?grade=${gradeId}&term=${termId}&unit=${unitId}&lesson=${lesson.id}`;

      const icHtml = isDone
        ? '<span class="ic">✅</span>'
        : (isUnlocked ? `<span class="ic">${lesson.emoji || typeIcon}</span>` : '<span class="ic">🔒</span>');

      node.innerHTML = `${icHtml}<span class="num">${i + 1}</span>`;

      const label = document.createElement('span');
      label.className = 'lesson-node-label';
      label.textContent = isCurrent ? `▶ ${lesson.title}` : lesson.title;

      row.style.position = 'relative';
      row.appendChild(node);
      row.appendChild(label);
      gridEl.appendChild(row);
    });
  }
}
