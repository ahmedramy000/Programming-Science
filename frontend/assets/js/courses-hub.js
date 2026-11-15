const GRADE_KEY = 'kudosk_grade';
const TERM_KEY = 'kudosk_term';

const gradePicker = document.getElementById('gradePicker');
const unitsView = document.getElementById('unitsView');
const changeGradeBtn = document.getElementById('changeGradeBtn');

function renderGradePicker() {
  const optsEl = document.getElementById('gradeOptions');
  optsEl.innerHTML = '';
  GRADES.forEach((g) => {
    const btn = document.createElement('button');
    btn.className = 'grade-opt';
    btn.innerHTML = `<span class="g-emoji">${g.emoji}</span> ${g.title}`;
    btn.addEventListener('click', () => {
      localStorage.setItem(GRADE_KEY, g.id);
      localStorage.setItem(TERM_KEY, 'term1');
      showUnits();
    });
    optsEl.appendChild(btn);
  });
}

function renderTermTabs(gradeId, activeTerm) {
  const tabsEl = document.getElementById('termTabs');
  tabsEl.innerHTML = '';
  [{ id: 'term1', label: '📗 الترم الأول' }, { id: 'term2', label: '📘 الترم الثاني' }].forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'term-tab' + (t.id === activeTerm ? ' active' : '');
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      localStorage.setItem(TERM_KEY, t.id);
      showUnits();
    });
    tabsEl.appendChild(btn);
  });
}

function renderUnitGrid(gradeId, termId) {
  const gridEl = document.getElementById('unitGrid');
  const course = COURSES[getCourseKey(gradeId, termId)];
  const units = course ? course.units : [];

  if (units.length === 0) {
    gridEl.innerHTML = `
      <div class="empty-state">
        🚧
        <h3>محتوى ${GRADES.find((g) => g.id === gradeId).title} قريبًا</h3>
        <p>المكان جاهز ومجهّز — هيتفتح تلقائيًا أول ما يُضاف المحتوى.</p>
      </div>`;
    return;
  }

  gridEl.innerHTML = '';
  units.forEach((u) => {
    const hasContent = u.lessons.length > 0;
    const card = document.createElement(hasContent ? 'a' : 'div');
    card.className = 'unit-card' + (hasContent ? '' : ' empty');
    if (hasContent) card.href = `unit.html?grade=${gradeId}&term=${termId}&unit=${u.id}`;
    card.innerHTML = `
      <div class="unit-emoji">${u.emoji}</div>
      <div class="unit-title">${u.title}</div>
      <div class="unit-status">${hasContent ? `${u.lessons.length} درس` : '🚧 قريبًا'}</div>
    `;
    gridEl.appendChild(card);
  });
}

function showUnits() {
  const gradeId = localStorage.getItem(GRADE_KEY);
  const termId = localStorage.getItem(TERM_KEY) || 'term1';
  gradePicker.style.display = 'none';
  unitsView.style.display = 'block';
  changeGradeBtn.style.display = 'inline-block';
  renderTermTabs(gradeId, termId);
  renderUnitGrid(gradeId, termId);
}

changeGradeBtn.addEventListener('click', () => {
  unitsView.style.display = 'none';
  changeGradeBtn.style.display = 'none';
  gradePicker.style.display = 'block';
});

renderGradePicker();
if (localStorage.getItem(GRADE_KEY)) {
  showUnits();
}
