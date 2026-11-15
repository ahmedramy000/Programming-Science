// ============================================
// شاشة "ابدأ هنا": اختيار يدوي بين البدء كمبتدئ تمامًا، أو اختبار تحديد
// مستوى سريع (5 أسئلة) بيدّي عملات 🪙 بونص لجهازه الافتراضي (مرة واحدة بس).
// ============================================

const QUIZ_QUESTIONS = [
  {
    q: 'إيه ناتج print(2 + 3 * 2) في بايثون؟',
    options: ['10', '8', '7', '12'],
    correct: 1,
  },
  {
    q: 'عايز تطبع الأرقام من 1 لـ5 في بايثون، تستخدم إيه؟',
    options: ['for i in range(1, 6):', 'if i in range(1, 6):', 'print(1, 6)', 'loop(1, 6)'],
    correct: 0,
  },
  {
    q: 'وصلتك رسالة إنك فزت بجائزة ومحتاج تدخل بياناتك فورًا — إيه الأصح؟',
    options: ['تدخل بياناتك على طول عشان ماتخسرش', 'تتجاهل الرسالة ومتدوسش على أي رابط فيها', 'تبعتها لصحابك يجربوها', 'تدخل بنص البيانات بس'],
    correct: 1,
  },
  {
    q: 'إيه أقوى كلمة سر من دول؟',
    options: ['123456', 'Tr5#mN8@qZ', 'password', 'ahmed2015'],
    correct: 1,
  },
  {
    q: 'إيه وظيفة المعالج (CPU) في الكمبيوتر؟',
    options: ['تخزين الملفات بشكل دائم', 'تنفيذ التعليمات والحسابات — عقل الجهاز', 'تبريد الجهاز', 'عرض الألوان على الشاشة بس'],
    correct: 1,
  },
];

const picker = document.getElementById('startPicker');
const quizStage = document.getElementById('quizStage');
const quizResult = document.getElementById('quizResult');
const alreadyDoneCard = document.getElementById('alreadyDoneCard');
const quizIdxLabel = document.getElementById('quizIdxLabel');
const quizTotalLabel = document.getElementById('quizTotalLabel');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const quizNextBtn = document.getElementById('quizNextBtn');
const quizResultTitle = document.getElementById('quizResultTitle');
const quizResultDesc = document.getElementById('quizResultDesc');

let qIndex = 0;
let correctCount = 0;
let answered = false;

quizTotalLabel.textContent = QUIZ_QUESTIONS.length;

document.getElementById('startBeginnerBtn').addEventListener('click', () => {
  // يبدأ كمبتدئ من غير بونص — الجهاز بيفضل بالقيم الافتراضية (أصلًا موجودة من progress.js)
  window.location.href = '../interactive.html';
});

document.getElementById('startQuizBtn').addEventListener('click', () => {
  if (window.PSProgress && window.PSProgress.isPlacementTestTaken()) {
    picker.style.display = 'none';
    alreadyDoneCard.style.display = 'flex';
    return;
  }
  picker.style.display = 'none';
  quizStage.style.display = 'block';
  renderQuestion();
});

function renderQuestion() {
  answered = false;
  const item = QUIZ_QUESTIONS[qIndex];
  quizIdxLabel.textContent = qIndex + 1;
  document.getElementById('quizNum').textContent = qIndex + 1;
  quizQuestionText.textContent = item.q;
  quizFeedback.textContent = '';
  quizNextBtn.style.display = 'none';
  quizOptions.innerHTML = '';

  item.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fr-type-card';
    btn.style.textAlign = 'center';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(i, btn));
    quizOptions.appendChild(btn);
  });
}

function handleAnswer(choiceIdx, btnEl) {
  if (answered) return;
  answered = true;
  const item = QUIZ_QUESTIONS[qIndex];
  const correct = choiceIdx === item.correct;
  if (correct) {
    correctCount++;
    btnEl.style.borderColor = '#34d399';
    btnEl.style.background = 'rgba(52,211,153,.15)';
    quizFeedback.textContent = '✅ تمام!';
    quizFeedback.style.color = '#34d399';
  } else {
    btnEl.style.borderColor = 'var(--danger)';
    btnEl.style.background = 'rgba(239,68,68,.15)';
    const correctBtn = quizOptions.children[item.correct];
    if (correctBtn) { correctBtn.style.borderColor = '#34d399'; correctBtn.style.background = 'rgba(52,211,153,.15)'; }
    quizFeedback.textContent = '❌ مش دي — بس محتاجة تتعلمها هتلاقيها في المنهج.';
    quizFeedback.style.color = 'var(--danger)';
  }
  Array.from(quizOptions.children).forEach((c) => (c.disabled = true));
  quizNextBtn.style.display = 'block';
  quizNextBtn.textContent = qIndex === QUIZ_QUESTIONS.length - 1 ? 'شوف نتيجتك 🎉' : 'السؤال الجاي ←';
}

quizNextBtn.addEventListener('click', () => {
  qIndex++;
  if (qIndex >= QUIZ_QUESTIONS.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
});

function finishQuiz() {
  quizStage.style.display = 'none';
  quizResult.style.display = 'flex';
  let bonus = 0;
  if (window.PSProgress) {
    const result = window.PSProgress.completePlacementTest(correctCount);
    bonus = result.bonus;
  }
  quizResultTitle.textContent = `جاوبت صح في ${correctCount} من ${QUIZ_QUESTIONS.length}! 🎉`;
  quizResultDesc.textContent = bonus > 0
    ? `خدت ${bonus} 🪙 بونص لجهازك الافتراضي — يلا رقّيه من صفحة "جهازي".`
    : 'المهم إنك بدأت! كمّل من المنهج وجمّع عملاتك من هناك.';
}
