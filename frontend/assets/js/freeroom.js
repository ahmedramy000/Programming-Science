// ============================================
// الفري روم: مود تسلية اختياري - الطالب يجمّع أي جهاز يحبه من غير درجات
// ولا تقييم، يشغّله، ويشوف "ديسكتوب" بتاعه، ويسميه ويحفظه عشان يرجعله تاني.
// PC_PARTS و PC_PART_SVG جايين من pc-parts-data.js (لازم يتحمّل الأول).
// ============================================

const FR_STORAGE_KEY = 'kudosk_freeroom_build';

const FR_DEVICE_TYPES = [
  { id: 'gaming', icon: '🎮', name: 'جهاز قيمنج', desc: 'قوي وسريع عشان الألعاب الثقيلة والرسومات العالية.', wallpaper: 'linear-gradient(160deg,#2a1440 0%,#160b30 60%,#0c0618 100%)', spec: '🎮 Gaming Build — RGB Ready' },
  { id: 'office', icon: '🖥️', name: 'جهاز مكتبي', desc: 'هادي ومناسب للشغل والدراسة والمهام اليومية.', wallpaper: 'linear-gradient(160deg,#103145 0%,#0b2030 60%,#061420 100%)', spec: '🖥️ Office Build — Reliable & Quiet' },
  { id: 'server', icon: '🗄️', name: 'سيرفر منزلي', desc: 'شغال طول الوقت لتخزين ومشاركة الملفات في البيت.', wallpaper: 'linear-gradient(160deg,#0f3324 0%,#0a2219 60%,#061309 100%)', spec: '🗄️ Home Server — Always On' },
];

const picker = document.getElementById('frPicker');
const typeGrid = document.getElementById('frTypeGrid');
const resumeBox = document.getElementById('frResume');
const stageBuild = document.getElementById('frStageBuild');
const stagePower = document.getElementById('frStagePower');
const stageDesktop = document.getElementById('frStageDesktop');
const board = document.getElementById('frBoard');
const tray = document.getElementById('frTray');
const feedback = document.getElementById('frFeedback');
const deviceIconEl = document.getElementById('frDeviceIcon');
const deviceNameEl = document.getElementById('frDeviceName');
const powerBtn = document.getElementById('frPowerBtn');
const desktopScreen = document.getElementById('frDesktopScreen');
const specLabel = document.getElementById('frSpecLabel');
const clockEl = document.getElementById('frClock');
const nameInput = document.getElementById('frNameInput');
const saveBtn = document.getElementById('frSaveBtn');
const rebuildBtn = document.getElementById('frRebuildBtn');
const saveMsg = document.getElementById('frSaveMsg');

let currentType = null;
let filledCount = 0;
let dragEl = null;
let clockTimer = null;

function loadSavedBuild() {
  try { return JSON.parse(localStorage.getItem(FR_STORAGE_KEY)); } catch { return null; }
}
function saveBuild(data) {
  try { localStorage.setItem(FR_STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function clearSavedBuild() {
  try { localStorage.removeItem(FR_STORAGE_KEY); } catch {}
}

// ---- عرض كروت اختيار نوع الجهاز ----
FR_DEVICE_TYPES.forEach((t) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'fr-type-card';
  card.innerHTML = `<span class="fr-type-ic">${t.icon}</span><span class="fr-type-name">${t.name}</span><span class="fr-type-desc">${t.desc}</span>`;
  card.addEventListener('click', () => startBuild(t));
  typeGrid.appendChild(card);
});

// ---- هل فيه جهاز محفوظ قبل كده؟ ----
const saved = loadSavedBuild();
if (saved) {
  const t = FR_DEVICE_TYPES.find((d) => d.id === saved.deviceType) || FR_DEVICE_TYPES[0];
  const dateStr = saved.builtAt ? new Date(saved.builtAt).toLocaleDateString('ar-EG') : '';
  resumeBox.style.display = 'block';
  resumeBox.innerHTML = `
    <div class="q-note">
      <div class="q-note-head">🛠️ عندك جهاز محفوظ بالفعل</div>
      "${saved.name || 'جهاز بدون اسم'}" — ${t.icon} ${t.name}${dateStr ? ' — ' + dateStr : ''}
    </div>
    <div style="display:flex; gap:10px; margin-top:10px;">
      <button class="q-btn block" id="frResumeOpen" type="button">افتحه تاني</button>
      <button class="q-btn block" id="frResumeClear" type="button" style="background:linear-gradient(135deg,#ef4444,#f59e0b);">امسح وابدأ جديد</button>
    </div>`;
  document.getElementById('frResumeOpen').addEventListener('click', () => openDesktopDirect(t, saved));
  document.getElementById('frResumeClear').addEventListener('click', () => {
    clearSavedBuild();
    resumeBox.style.display = 'none';
    resumeBox.innerHTML = '';
  });
}

function openDesktopDirect(type, savedData) {
  currentType = type;
  picker.style.display = 'none';
  showDesktop(savedData.name || '');
}

// ---- بدء مرحلة التجميع ----
function startBuild(type) {
  currentType = type;
  picker.style.display = 'none';
  stageBuild.style.display = 'block';
  deviceIconEl.textContent = type.icon;
  deviceNameEl.textContent = type.name;
  buildBoardAndTray();
}

function buildBoardAndTray() {
  board.innerHTML = '';
  tray.innerHTML = '';
  filledCount = 0;

  PC_PARTS.forEach((part) => {
    const slot = document.createElement('div');
    slot.className = 'q-slot';
    slot.dataset.slot = part.id;
    slot.style.top = part.top + '%';
    slot.style.left = part.left + '%';
    slot.innerHTML = `<span class="slot-label">${part.label}</span>`;
    board.appendChild(slot);
  });

  const shuffled = [...PC_PARTS].sort(() => Math.random() - 0.5);
  shuffled.forEach((part) => {
    const piece = document.createElement('div');
    piece.className = 'q-piece';
    piece.dataset.piece = part.id;
    piece.innerHTML = `<span class="pc-ic">${PC_PART_SVG[part.id]}</span><span>${part.label}</span>`;
    tray.appendChild(piece);
    piece.addEventListener('pointerdown', (e) => startDrag(e, piece, part.id));
  });
}

function startDrag(e, piece, partId) {
  if (piece.classList.contains('placed')) return;
  e.preventDefault();
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
  document.querySelectorAll('#frBoard .q-slot.over').forEach((s) => s.classList.remove('over'));
}

function dropAt(x, y, piece, partId) {
  const slot = slotUnderPoint(x, y);
  if (!slot) return;
  if (slot.classList.contains('filled')) {
    feedback.textContent = 'المكان ده متشغل بالفعل 🤔';
    return;
  }
  if (slot.dataset.slot !== partId) {
    feedback.textContent = '❌ مش مكانها — جرّب مكان تاني، مفيش مشكلة خالص وانت بتتمرّن 😉';
    feedback.style.color = 'var(--danger)';
    return;
  }
  const part = PC_PARTS.find((p) => p.id === partId);
  slot.classList.add('filled');
  slot.innerHTML = `<span class="pc-ic">${PC_PART_SVG[part.id]}</span><span class="slot-label">${part.label}</span>`;
  piece.classList.add('placed');
  feedback.textContent = `✅ ${part.note}`;
  feedback.style.color = 'var(--accent2)';
  filledCount++;
  if (filledCount === PC_PARTS.length) {
    setTimeout(() => {
      feedback.textContent = '';
      stageBuild.style.display = 'none';
      stagePower.style.display = 'block';
    }, 800);
  }
}

// ---- تشغيل الجهاز وعرض الديسكتوب ----
powerBtn.addEventListener('click', () => {
  powerBtn.disabled = true;
  stagePower.style.display = 'none';
  showDesktop('');
});

function showDesktop(prefillName) {
  stageDesktop.style.display = 'block';
  desktopScreen.style.background = currentType.wallpaper;
  specLabel.textContent = currentType.spec;
  nameInput.value = prefillName || '';
  startClock();
}

function startClock() {
  if (clockTimer) clearInterval(clockTimer);
  const tick = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  };
  tick();
  clockTimer = setInterval(tick, 15000);
}

saveBtn.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'جهازي';
  saveBuild({ deviceType: currentType.id, name, builtAt: Date.now() });
  saveMsg.textContent = `💾 اتحفظ! "${name}" (${currentType.name}) هتلاقيه هنا لما ترجع تاني.`;
  if (window.PSProgress) {
    const { xpGained, newMedals, coinsGained } = window.PSProgress.recordLessonComplete('cyber:freeroom:' + currentType.id, 1, 1);
    if (xpGained) window.PSProgress.showToast(xpGained, newMedals, coinsGained);
  }
});

rebuildBtn.addEventListener('click', () => {
  if (clockTimer) clearInterval(clockTimer);
  stageDesktop.style.display = 'none';
  powerBtn.disabled = false;
  picker.style.display = 'block';
  saveMsg.textContent = '';
});
