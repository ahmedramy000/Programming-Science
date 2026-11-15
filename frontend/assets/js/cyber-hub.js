const PROGRESS_KEY = 'kudosk_cyber_progress';

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}

function renderHub() {
  const progress = getProgress();
  const wrap = document.getElementById('roadmapWrap');
  wrap.className = 'lesson-path';
  wrap.innerHTML = `<div class="lesson-start-flag"><span class="flag-ic">🚩</span>ابدأ هنا</div>`;

  const ALIGN_CYCLE = ['end', 'center', 'start', 'center'];
  const TYPE_ICON = { quiz: '📝', scenario: '🎭', terminal: '💻', maze: '🧩' };

  // --- الخطوة صفر: لعبة تركيب الـPC (قبل أي درس تاني) ---
  const pcDone = !!progress.pcbuild;
  const pcRow = document.createElement('div');
  pcRow.className = `lesson-node-row align-${ALIGN_CYCLE[0]}`;
  const pcNode = document.createElement('a');
  pcNode.href = 'pcbuild.html';
  pcNode.className = 'lesson-node current' + (pcDone ? ' done' : '');
  pcNode.innerHTML = `<span class="ic">${pcDone ? '✅' : '🖥️'}</span><span class="num">0</span>`;
  const pcLabel = document.createElement('span');
  pcLabel.className = 'lesson-node-label';
  pcLabel.textContent = (pcDone ? '' : '▶ ') + 'ركّب جهازك';
  pcRow.appendChild(pcNode);
  pcRow.appendChild(pcLabel);
  wrap.appendChild(pcRow);

  let lastLevel = null;
  CYBER_LESSONS.forEach((lesson, i) => {
    const isDone = !!progress[lesson.id];
    const prevDone = i === 0 ? pcDone : !!progress[CYBER_LESSONS[i - 1].id];
    const isUnlocked = prevDone;
    const isCurrent = isUnlocked && !isDone;
    const typeIcon = TYPE_ICON[lesson.type] || '📄';
    const align = ALIGN_CYCLE[(i + 1) % ALIGN_CYCLE.length];

    // لافتة فاصلة لما نبدأ مستوى جديد + عدّاد إنجاز المستوى
    // (ملحوظة: level ممكن يكون 0 - فلازم نتأكد إنه مش undefined/null، مش بس truthy)
    if (lesson.level !== undefined && lesson.level !== null && lesson.level !== lastLevel) {
      lastLevel = lesson.level;
      const lvlInfo = (typeof CYBER_LEVELS !== 'undefined' && CYBER_LEVELS.find((l) => l.id === lesson.level)) || null;
      const levelLessons = CYBER_LESSONS.filter((l) => l.level === lesson.level);
      const doneInLevel = levelLessons.filter((l) => !!progress[l.id]).length;
      const ORDINAL = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' };
      const banner = document.createElement('div');
      banner.className = 'level-divider';
      if (lvlInfo) {
        const titleLine = lvlInfo.id === 0
          ? `${lvlInfo.title} (تمهيدي)`
          : `المستوى ${ORDINAL[lvlInfo.id] || lvlInfo.id}: ${lvlInfo.title}`;
        banner.innerHTML = `<span class="lv-emoji">${lvlInfo.emoji}</span><span class="lv-title">${titleLine}</span><span class="lv-desc">${lvlInfo.desc}</span><span class="lv-count">${doneInLevel} / ${levelLessons.length} مكتمل</span>`;
      } else {
        banner.innerHTML = `<span class="lv-title">مستوى ${lesson.level}</span>`;
      }
      wrap.appendChild(banner);
    }

    const row = document.createElement('div');
    row.className = `lesson-node-row align-${align}`;

    const node = document.createElement(isUnlocked ? 'a' : 'div');
    node.className = 'lesson-node' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '') + (!isUnlocked ? ' locked' : '');
    if (isUnlocked) node.href = lesson.externalHref || `lesson.html?id=${lesson.id}`;

    const icHtml = isDone
      ? '<span class="ic">✅</span>'
      : (isUnlocked ? `<span class="ic">${lesson.emoji || typeIcon}</span>` : '<span class="ic">🔒</span>');

    node.innerHTML = `${icHtml}<span class="num">${i + 1}</span>`;

    const label = document.createElement('span');
    label.className = 'lesson-node-label';
    const diff = (typeof cyberDifficultyOf === 'function') ? cyberDifficultyOf(lesson) : null;
    const diffTag = diff ? ` · ${diff.label}` : '';
    label.textContent = (isCurrent ? `▶ ${lesson.title}` : lesson.title) + (isUnlocked ? diffTag : '');

    row.appendChild(node);
    row.appendChild(label);
    wrap.appendChild(row);
  });

  const finishRow = document.createElement('div');
  finishRow.style.textAlign = 'center';
  finishRow.style.color = 'var(--muted)';
  finishRow.style.fontSize = '12px';
  finishRow.style.marginTop = '4px';
  finishRow.textContent = '🏁 نهاية المسار';
  wrap.appendChild(finishRow);
}

renderHub();
if (window.PSProgress) window.PSProgress.renderStreakBadge('streakBadge');
