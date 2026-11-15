// ============================================
// ميني جيم "جوّه المعالج (CPU)": محاكاة مبسّطة لدورة Fetch-Decode-Execute
// بلغة أسمبلي مصغّرة (LOAD/ADD/STORE) - اللغة المناسبة لطبيعة الـCPU نفسه.
// الهدف: الطالب يفهم إزاي أي برنامج (حتى بايثون) بينزل في الآخر لنفس
// الدورة دي جوّه المعالج، قبل ما يكمّل في مسار الأمن السيبراني.
// ============================================

const CPU_PROGRAM = [
  { op: 'LOAD', args: ['R1', '5'], desc: 'حط القيمة 5 في السجل R1' },
  { op: 'LOAD', args: ['R2', '3'], desc: 'حط القيمة 3 في السجل R2' },
  { op: 'ADD', args: ['R3', 'R1', 'R2'], desc: 'اجمع قيمة R1 + R2 وحط الناتج في R3' },
  { op: 'STORE', args: ['R3', '100'], desc: 'خزّن قيمة R3 في عنوان الذاكرة رقم 100' },
];
const PHASE_LABELS = ['fetch', 'decode', 'execute'];
const TOTAL_STEPS = CPU_PROGRAM.length * PHASE_LABELS.length;

const regs = { R1: null, R2: null, R3: null };
const mem = {};
let step = 0;

const instrListEl = document.getElementById('cpuInstrList');
const regRowEl = document.getElementById('cpuRegRow');
const memRowEl = document.getElementById('cpuMemRow');
const statusEl = document.getElementById('cpuStatus');
const nextBtn = document.getElementById('cpuNextBtn');
const questionBox = document.getElementById('cpuQuestion');
const answerInput = document.getElementById('cpuAnswerInput');
const answerBtn = document.getElementById('cpuAnswerBtn');
const answerFeedback = document.getElementById('cpuAnswerFeedback');
const doneBox = document.getElementById('cpuDone');
const pixelMsg = document.getElementById('pixelMsg');

function instrText(instr) {
  return `${instr.op} ${instr.args.join(', ')}`;
}

function renderInstrList() {
  instrListEl.innerHTML = '';
  CPU_PROGRAM.forEach((instr, i) => {
    const line = document.createElement('div');
    line.className = 'cpu-instr-line';
    line.id = `cpuInstr${i}`;
    line.innerHTML = `<span class="cpu-instr-num">${i + 1}</span><span class="cpu-instr-code">${instrText(instr)}</span>`;
    instrListEl.appendChild(line);
  });
}

function renderRegs() {
  regRowEl.innerHTML = '';
  Object.keys(regs).forEach((name) => {
    const box = document.createElement('div');
    box.className = 'cpu-reg-box';
    box.id = `cpuReg_${name}`;
    box.innerHTML = `<span class="cpu-reg-name">${name}</span><span class="cpu-reg-val">${regs[name] === null ? '—' : regs[name]}</span>`;
    regRowEl.appendChild(box);
  });
}

function renderMem() {
  memRowEl.innerHTML = '';
  ['99', '100', '101'].forEach((addr) => {
    const cell = document.createElement('div');
    cell.className = 'cpu-mem-cell';
    cell.id = `cpuMem_${addr}`;
    const val = mem[addr];
    cell.innerHTML = `<span class="cpu-mem-addr">#${addr}</span><span class="cpu-mem-val">${val === undefined ? '—' : val}</span>`;
    memRowEl.appendChild(cell);
  });
}

function clearHighlights() {
  document.querySelectorAll('.cpu-instr-line').forEach((el) => el.classList.remove('fetch', 'decode', 'execute'));
  document.querySelectorAll('.cpu-reg-box').forEach((el) => el.classList.remove('flash'));
  document.querySelectorAll('.cpu-mem-cell').forEach((el) => el.classList.remove('flash'));
}

function doExecute(instr) {
  if (instr.op === 'LOAD') {
    regs[instr.args[0]] = parseInt(instr.args[1], 10);
  } else if (instr.op === 'ADD') {
    regs[instr.args[0]] = (regs[instr.args[1]] || 0) + (regs[instr.args[2]] || 0);
  } else if (instr.op === 'STORE') {
    mem[instr.args[1]] = regs[instr.args[0]];
  }
}

function currentInstrIndex() { return Math.floor(step / 3); }
function currentPhase() { return PHASE_LABELS[step % 3]; }

function renderStatus() {
  clearHighlights();
  if (step >= TOTAL_STEPS) return;
  const idx = currentInstrIndex();
  const phase = currentPhase();
  const instr = CPU_PROGRAM[idx];
  const lineEl = document.getElementById(`cpuInstr${idx}`);
  if (lineEl) lineEl.classList.add(phase);

  if (phase === 'fetch') {
    statusEl.textContent = `📥 Fetch: المعالج بيروح للذاكرة ويجيب الأمر رقم ${idx + 1}: "${instrText(instr)}"`;
    pixelMsg.textContent = 'أول خطوة دايمًا: المعالج محتاج يجيب الأمر الجاي من الذاكرة الأول قبل ما يعرف يعمل إيه.';
  } else if (phase === 'decode') {
    statusEl.textContent = `🧩 Decode: المعالج بيفهم معنى الأمر: ${instr.desc}`;
    pixelMsg.textContent = 'دلوقتي المعالج "فكّك" الأمر وعرف بالظبط المطلوب منه يعمل إيه بالضبط.';
  } else if (phase === 'execute') {
    statusEl.textContent = `🔧 Execute: المعالج بينفّذ الأمر فعليًا الآن...`;
    pixelMsg.textContent = 'وأخيرًا بينفّذ — وده اللحظة اللي فعليًا بتتغيّر فيها قيم السجلات أو الذاكرة.';
  }
}

nextBtn.addEventListener('click', () => {
  if (step >= TOTAL_STEPS) return;
  const idx = currentInstrIndex();
  const phase = currentPhase();
  const instr = CPU_PROGRAM[idx];

  renderStatus();

  if (phase === 'execute') {
    doExecute(instr);
    renderRegs();
    renderMem();
    const lineEl = document.getElementById(`cpuInstr${idx}`);
    if (lineEl) lineEl.classList.add('done');
    if (instr.op === 'STORE') {
      const memEl = document.getElementById(`cpuMem_${instr.args[1]}`);
      if (memEl) memEl.classList.add('flash');
    } else {
      const regEl = document.getElementById(`cpuReg_${instr.args[0]}`);
      if (regEl) regEl.classList.add('flash');
    }
  }

  step++;
  if (step >= TOTAL_STEPS) {
    nextBtn.style.display = 'none';
    statusEl.textContent = '✅ البرنامج خلص التنفيذ بالكامل!';
    pixelMsg.textContent = 'شايف؟ 4 أسطر بسيطة، بس كل سطر فيهم اتعمله نفس الدورة 3 مرات (Fetch-Decode-Execute) — دي أساس كل حاجة بتشتغل جوّه أي كمبيوتر.';
    questionBox.style.display = 'block';
  }
});

answerBtn.addEventListener('click', () => {
  const given = (answerInput.value || '').trim();
  const expected = String(mem['100']);
  if (given === expected) {
    answerFeedback.textContent = `✅ بالظبط! القيمة ${expected} اتخزنت في عنوان 100 لأن 5 + 3 = 8.`;
    answerFeedback.style.color = 'var(--accent2)';
    answerInput.disabled = true;
    answerBtn.disabled = true;
    setTimeout(finishLesson, 1200);
  } else {
    answerFeedback.textContent = '❌ مش هي — ارجع شوف قيمة R3 بعد خطوة ADD، وده اللي اتخزن في عنوان 100.';
    answerFeedback.style.color = 'var(--danger)';
  }
});

function finishLesson() {
  questionBox.style.display = 'none';
  doneBox.style.display = 'flex';
  if (window.PSProgress) {
    const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete('cyber:18', 1, 1);
    window.PSProgress.showToast(xpGained, newMedals, coinsGained);
  }
  try {
    const p = JSON.parse(localStorage.getItem('kudosk_cyber_progress')) || {};
    p[18] = true;
    localStorage.setItem('kudosk_cyber_progress', JSON.stringify(p));
  } catch {}
}

renderInstrList();
renderRegs();
renderMem();
