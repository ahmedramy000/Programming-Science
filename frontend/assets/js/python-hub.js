const PROGRESS_KEY = 'kudosk_python_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}

function renderHub() {
  const progress = getProgress();
  const grid = document.getElementById('lessonGrid');
  const completedCount = Object.values(progress).filter(Boolean).length;
  document.getElementById('progressPill').textContent = `${completedCount} / ${PYTHON_LESSONS.length}`;

  grid.innerHTML = '';
  PYTHON_LESSONS.forEach((lesson, i) => {
    const isDone = !!progress[lesson.id];
    const isUnlocked = i === 0 || !!progress[PYTHON_LESSONS[i - 1].id];

    const card = document.createElement(isUnlocked ? 'a' : 'div');
    card.className = 'lesson-card' + (isDone ? ' done' : '') + (!isUnlocked ? ' locked' : '');
    if (isUnlocked) card.href = `lesson.html?id=${lesson.id}`;

    const badge = isDone ? '✅' : (isUnlocked ? '💬' : '🔒');
    card.innerHTML = `
      <div class="lesson-num">${lesson.id}</div>
      <div class="lesson-emoji">${lesson.emoji}</div>
      <div class="lesson-title">${lesson.title}</div>
      <div class="lesson-desc">${isUnlocked ? lesson.description : 'كمّل الدرس اللي قبله عشان يتفتح'}</div>
      <div class="lesson-badge">${badge}</div>
    `;
    grid.appendChild(card);
  });
}

renderHub();
