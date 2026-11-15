// ============================================
// المهمة الأولى (Quest): جمّع الجهاز → شغّله → شوف شاشة الإقلاع → استخدم
// التيرمينال عشان تبعت تقرير مشكلة أمنية للزميل الصح، كل ده بإرشاد بيكسل.
// 4 مراحل متتابعة: build → power → boot → task(terminal/email command).
// ============================================

// PC_PARTS و PC_PART_SVG جايين من assets/js/pc-parts-data.js (لازم يتحمّل قبل الملف ده)

// محتوى ملفات المهمة البرمجية (المرحلة 4)
const TASK_FS = {
  'report.txt': [
    'تقرير فحص سريع — جهاز الزبون',
    '--------------------------------',
    'لوحظ: برنامج غير معروف بيحاول يتصل بعنوان IP غريب (203.0.113.77)',
    'كل يوم الساعة 3 الفجر — وده وقت نشاط خبيث كلاسيكي بيحاول يستخبى فيه.',
    '',
    'الإجراء المطلوب: تبليغ فوري للمسؤول عن الشبكة والأمن لمتابعة الموضوع.',
  ],
  'contacts.txt': [
    'جهات الاتصال المتاحة دلوقتي:',
    '--------------------------------',
    'مريم   | مسؤولة الشبكة والأمن | mariam@kudosk.local | 🟢 شغالة دلوقتي',
    'كريم   | محاسب                | karim@kudosk.local  | 🏖️ في إجازة',
    'سلمى   | موارد بشرية          | salma@kudosk.local  | 🟢 شغالة دلوقتي (مش مسؤولة عن الموضوع ده)',
  ],
};
const CORRECT_EMAIL = 'mariam@kudosk.local';
const WRONG_EMAILS = {
  'karim@kudosk.local': 'كريم في إجازة دلوقتي — مش هيشوف الإيميل غير لما يرجع، والمشكلة مستعجلة.',
  'salma@kudosk.local': 'سلمى شغالة فعلًا، بس هي مسؤولة الموارد البشرية مش الشبكة والأمن — مش هي الشخص الصح للموضوع ده.',
};

const board = document.getElementById('pcBoard');
const tray = document.getElementById('pcTray');
const feedback = document.getElementById('pcFeedback');
const doneBox = document.getElementById('pcDone');
const pixelMsg = document.getElementById('pixelMsg');

const stageBuild = document.getElementById('qStageBuild');
const stagePower = document.getElementById('qStagePower');
const stageBoot = document.getElementById('qStageBoot');
const stageTask = document.getElementById('qStageTask');
const powerBtn = document.getElementById('pcPowerBtn');
const bootLines = document.getElementById('bootLines');
const taskLines = document.getElementById('taskLines');
const taskInput = document.getElementById('taskInput');
const taskHint = document.getElementById('taskHint');

let filledCount = 0;
let dragEl = null;
let dragPieceId = null;

function setPixel(text) {
  if (pixelMsg) pixelMsg.textContent = text;
}

// نبني الأماكن (slots) على اللوحة
PC_PARTS.forEach((part) => {
  const slot = document.createElement('div');
  slot.className = 'q-slot';
  slot.dataset.slot = part.id;
  slot.style.top = part.top + '%';
  slot.style.left = part.left + '%';
  slot.innerHTML = `<span class="slot-label">${part.label}</span>`;
  board.appendChild(slot);
});

// نبني القطع القابلة للسحب (نخلطها عشان ماتبقاش بنفس ترتيب الأماكن)
const shuffled = [...PC_PARTS].sort(() => Math.random() - 0.5);
shuffled.forEach((part) => {
  const piece = document.createElement('div');
  piece.className = 'q-piece';
  piece.dataset.piece = part.id;
  piece.innerHTML = `<span class="pc-ic">${PC_PART_SVG[part.id]}</span><span>${part.label}</span>`;
  tray.appendChild(piece);

  piece.addEventListener('pointerdown', (e) => startDrag(e, piece, part.id));
});

function startDrag(e, piece, partId) {
  if (piece.classList.contains('placed')) return;
  e.preventDefault();
  dragPieceId = partId;
  dragEl = piece.cloneNode(true);
  dragEl.classList.add('dragging');
  dragEl.style.position = 'fixed';
  dragEl.style.zIndex = '999';
  dragEl.style.pointerEvents = 'none';
  dragEl.style.width = piece.offsetWidth + 'px';
  document.body.appendChild(dragEl);
  moveDragEl(e.clientX, e.clientY);

  function onMove(ev) { moveDragEl(ev.clientX, ev.clientY); highlightSlot(ev.clientX, ev.clientY); }
  function onUp(ev) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    dropAt(ev.clientX, ev.clientY, piece, partId);
    if (dragEl) { dragEl.remove(); dragEl = null; }
    clearHighlight();
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

function moveDragEl(x, y) {
  if (!dragEl) return;
  dragEl.style.left = (x - dragEl.offsetWidth / 2) + 'px';
  dragEl.style.top = (y - dragEl.offsetHeight / 2) + 'px';
}

function slotUnderPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest('.q-slot') : null;
}

function highlightSlot(x, y) {
  clearHighlight();
  const slot = slotUnderPoint(x, y);
  if (slot && !slot.classList.contains('filled')) slot.classList.add('over');
}
function clearHighlight() {
  document.querySelectorAll('.q-slot.over').forEach((s) => s.classList.remove('over'));
}

function dropAt(x, y, piece, partId) {
  const slot = slotUnderPoint(x, y);
  if (!slot) return;
  if (slot.classList.contains('filled')) {
    feedback.textContent = 'المكان ده متشغل بالفعل 🤔';
    return;
  }
  if (slot.dataset.slot !== partId) {
    feedback.textContent = '❌ ده مش مكانها الصح — جرّب مكان تاني.';
    feedback.style.color = 'var(--danger)';
    setPixel('هو ده شكله حلو، بس مش مكانه ده 😅 كل قطعة ليها مكان مخصوص على المذربورد، جرّب تاني!');
    return;
  }
  const part = PC_PARTS.find((p) => p.id === partId);
  slot.classList.add('filled');
  slot.innerHTML = `<span class="pc-ic">${PC_PART_SVG[part.id]}</span><span class="slot-label">${part.label}</span>`;
  piece.classList.add('placed');
  feedback.textContent = `✅ ${part.note}`;
  feedback.style.color = 'var(--accent2)';
  setPixel(`تمام كده! 🔧 ${part.note}`);
  filledCount++;
  if (filledCount === PC_PARTS.length) finishBuild();
}

function finishBuild() {
  setTimeout(() => {
    feedback.textContent = '';
    setPixel('جمّعت الجهاز بالكامل! 🎉 دلوقتي يلا نشغّله ونشوف هيعمل إيه.');
    stageBuild.style.display = 'none';
    stagePower.style.display = 'block';
  }, 900);
}

// ---- المرحلة 2: زرار التشغيل ----
powerBtn.addEventListener('click', () => {
  powerBtn.disabled = true;
  stagePower.style.display = 'none';
  stageBoot.style.display = 'block';
  setPixel('بيقلّع دلوقتي... استنى شوية. 👀');
  runBootSequence();
});

const BOOT_SEQUENCE = [
  'KudoskBIOS v2.4 — Initializing hardware...',
  'CPU: OK   RAM: OK   GPU: OK',
  'Storage (SSD): OK   PSU: OK   Cooling Fan: OK',
  'Detected OS on Storage (SSD): KudoskOS v2.4 — already installed, booting from disk...',
  'Loading kernel modules... done',
  'Starting network services... done',
  'Login: zabon',
  'Welcome, zabon. Terminal ready.',
];

function runBootSequence() {
  let i = 0;
  const addLine = () => {
    if (i >= BOOT_SEQUENCE.length) {
      setTimeout(() => {
        stageBoot.style.display = 'none';
        stageTask.style.display = 'block';
        setPixel('التيرمينال جاهز! 💻 اكتب "ls" الأول عشان تشوف الملفات الموجودة جوه الجهاز.');
        taskInput.focus();
      }, 500);
      return;
    }
    const line = document.createElement('div');
    line.className = 'q-line' + (i === BOOT_SEQUENCE.length - 1 ? ' ok' : ' dim');
    line.textContent = BOOT_SEQUENCE[i];
    bootLines.appendChild(line);
    i++;
    setTimeout(addLine, 320);
  };
  addLine();
}

// ---- المرحلة 4: تيرمينال المهمة (إرسال التقرير) ----
let taskDone = false;

function printTaskLine(text, cls) {
  const line = document.createElement('div');
  line.className = 'q-line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  taskLines.appendChild(line);
  taskLines.parentElement.scrollTop = taskLines.parentElement.scrollHeight;
}

function printTaskEcho(cmd) {
  printTaskLine('zabon@kudosk:~$ ' + cmd);
}

taskInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || taskDone) return;
  const raw = taskInput.value.trim();
  if (!raw) return;
  printTaskEcho(raw);
  taskInput.value = '';
  handleTaskCommand(raw);
});

function handleTaskCommand(raw) {
  const lower = raw.toLowerCase();
  const parts = raw.split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();

  if (cmd === 'help') {
    printTaskLine('الأوامر المتاحة: ls, cat <file>, mail -s "subject" <email> < report.txt, clear', 'dim');
    return;
  }
  if (cmd === 'clear') {
    taskLines.innerHTML = '';
    return;
  }
  if (cmd === 'ls') {
    printTaskLine(Object.keys(TASK_FS).join('   '));
    setPixel('شايف الملفين؟ جرّب "cat report.txt" عشان تعرف إيه المشكلة.');
    return;
  }
  if (cmd === 'cat') {
    const filename = parts[1];
    if (!filename) { printTaskLine('الاستخدام: cat <file>', 'err'); return; }
    const content = TASK_FS[filename];
    if (!content) {
      printTaskLine(`cat: ${filename}: No such file or directory`, 'err');
      return;
    }
    content.forEach((l) => printTaskLine(l));
    if (filename === 'report.txt') {
      setPixel('كده عرفت المشكلة. دلوقتي اعرف مين المسؤول عنها — جرّب "cat contacts.txt".');
    } else if (filename === 'contacts.txt') {
      setPixel('تمام، دلوقتي اختار الشخص الصح وابعتله بأمر mail. مثال: mail -s "تنبيه أمني" الإيميل < report.txt');
      taskHint.textContent = '💡 تلميح: الصيغة: mail -s "عنوان الرسالة" the-email@kudosk.local < report.txt';
    }
    return;
  }
  if (cmd === 'mail' || cmd === 'sendmail') {
    handleMailCommand(raw, lower);
    return;
  }

  printTaskLine(`zsh: command not found: ${cmd}`, 'err');
  setPixel('الأمر ده مش معروف 🤔 جرّب "help" لو عايز تشوف الأوامر المتاحة.');
}

function handleMailCommand(raw, lower) {
  if (lower.includes(CORRECT_EMAIL)) {
    printTaskLine('Sending mail... done.', 'ok');
    printTaskLine(`✅ الرسالة اتبعتت لـ ${CORRECT_EMAIL} بنجاح.`, 'ok');
    setPixel('تمام جدًا! 🎉 بعتّها لمريم، وهي فعلًا مسؤولة الشبكة والأمن وشغالة دلوقتي — الاختيار الصح في التوقيت الصح.');
    taskDone = true;
    taskInput.disabled = true;
    finishTask();
    return;
  }
  for (const wrongEmail in WRONG_EMAILS) {
    if (lower.includes(wrongEmail)) {
      printTaskLine(`❌ مش فكرة حلوة: ${WRONG_EMAILS[wrongEmail]}`, 'err');
      setPixel(WRONG_EMAILS[wrongEmail] + ' جرّب "cat contacts.txt" تاني وشوف مين فعلًا المسؤول.');
      return;
    }
  }
  printTaskLine('❌ محتاج تحدد إيميل صحيح من contacts.txt في الأمر.', 'err');
  setPixel('محتاج تكتب إيميل حقيقي من جهات الاتصال — جرّب "cat contacts.txt" الأول لو نسيت.');
}

function finishTask() {
  setTimeout(() => {
    stageTask.style.display = 'none';
    doneBox.style.display = 'flex';
    if (window.PSProgress) {
      const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete('cyber:pcbuild', 1, 1);
      window.PSProgress.showToast(xpGained, newMedals, coinsGained);
    }
    try {
      const p = JSON.parse(localStorage.getItem('kudosk_cyber_progress')) || {};
      p.pcbuild = true;
      localStorage.setItem('kudosk_cyber_progress', JSON.stringify(p));
    } catch {}
  }, 1300);
}
