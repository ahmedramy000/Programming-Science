// ============================================
// علوم البرمجة Cyber Engine
// محرك صغير قابل لإعادة الاستخدام لكل دروس المسار:
// - renderMaze: لعبة متاهة بالبلوكات (نفس فكرة لعبة "نظّف الشبكة" بس Generic)
// - renderQuiz: اختبار اختيار من متعدد
// ============================================

const KudoskEngine = (() => {

  const blockMeta = {
    right: { ic: '➡️', label: 'تحرك يمين' },
    left:  { ic: '⬅️', label: 'تحرك شمال' },
    down:  { ic: '⬇️', label: 'تحرك لتحت' },
    up:    { ic: '⬆️', label: 'تحرك لفوق' },
    repeat:{ ic: '🔁', label: 'كرر اللي قبله' },
  };

  // ---------- متاهة ----------
  function renderMaze(container, config, onComplete) {
    const { size, goal, threats = [], blocks = ['right','left','down','up'],
            threatEmoji = '🦠', playerEmoji = '🧑‍💻' } = config;

    const start = { x: 0, y: 0 };
    let program = [];
    let pos = { ...start };

    container.innerHTML = `
      <div class="eng-workspace">
        <div class="eng-blocks-panel">
          <h4>الأوامر المتاحة</h4>
          <div id="engBlocksList"></div>
        </div>
        <div class="eng-grid-panel">
          <h4>برنامجك</h4>
          <div class="eng-program" id="engProgram"></div>
          <div class="eng-ctrl">
            <button class="eng-btn-run" id="engRunBtn">▶ تشغيل</button>
            <button class="eng-btn-clear" id="engClearBtn">🗑 مسح</button>
          </div>
        </div>
        <div class="eng-result-panel">
          <h4>الخريطة</h4>
          <div class="eng-maze" id="engMaze"></div>
          <div class="eng-msg" id="engMsg"></div>
        </div>
      </div>
    `;

    const blocksListEl = container.querySelector('#engBlocksList');
    const programEl = container.querySelector('#engProgram');
    const mazeEl = container.querySelector('#engMaze');
    const msgEl = container.querySelector('#engMsg');

    function isThreat(x, y) { return threats.some((t) => t.x === x && t.y === y); }

    function renderMazeGrid() {
      mazeEl.style.gridTemplateColumns = `repeat(${size},1fr)`;
      mazeEl.innerHTML = '';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const c = document.createElement('div');
          c.className = 'eng-cell';
          if (x === goal.x && y === goal.y) c.classList.add('eng-goal');
          if (isThreat(x, y)) c.classList.add('eng-threat');
          let content = '';
          if (isThreat(x, y)) content = threatEmoji;
          else if (x === goal.x && y === goal.y) content = '🏁';
          if (pos.x === x && pos.y === y) content = playerEmoji;
          c.innerHTML = content;
          mazeEl.appendChild(c);
        }
      }
    }

    function renderProgramList() {
      programEl.innerHTML = '';
      program.forEach((cmd, i) => {
        const meta = blockMeta[cmd];
        const s = document.createElement('div');
        s.className = 'eng-step';
        s.innerHTML = `<span>${i + 1}. ${meta.ic} ${meta.label}</span><button data-i="${i}">✕</button>`;
        programEl.appendChild(s);
      });
    }

    function addCommand(cmd) {
      if (cmd === 'repeat') {
        if (program.length > 0) program.push(program[program.length - 1]);
      } else {
        program.push(cmd);
      }
      renderProgramList();
    }

    function renderBlocksPanel() {
      blocksListEl.innerHTML = '';
      blocks.forEach((cmd) => {
        const meta = blockMeta[cmd];
        const btn = document.createElement('button');
        btn.className = 'eng-block-btn';
        btn.draggable = true;
        btn.innerHTML = `<span>${meta.ic}</span> ${meta.label}`;
        btn.addEventListener('click', () => addCommand(cmd));
        btn.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', cmd));
        blocksListEl.appendChild(btn);
      });
    }

    programEl.addEventListener('dragover', (e) => e.preventDefault());
    programEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const cmd = e.dataTransfer.getData('text/plain');
      if (cmd) addCommand(cmd);
    });
    programEl.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        program.splice(parseInt(e.target.dataset.i), 1);
        renderProgramList();
      }
    });

    container.querySelector('#engClearBtn').addEventListener('click', () => {
      program = [];
      renderProgramList();
      resetRun();
    });

    function resetRun() {
      pos = { ...start };
      msgEl.className = 'eng-msg';
      msgEl.textContent = '';
      renderMazeGrid();
    }

    async function run() {
      resetRun();
      if (program.length === 0) {
        msgEl.textContent = 'ضيف أوامر الأول 🙂';
        return;
      }
      for (const cmd of program) {
        await new Promise((r) => setTimeout(r, 320));
        if (cmd === 'right' && pos.x < size - 1) pos.x++;
        if (cmd === 'left' && pos.x > 0) pos.x--;
        if (cmd === 'down' && pos.y < size - 1) pos.y++;
        if (cmd === 'up' && pos.y > 0) pos.y--;
        renderMazeGrid();
        if (isThreat(pos.x, pos.y)) {
          msgEl.className = 'eng-msg eng-fail';
          msgEl.textContent = '😱 داست على تهديد! جرّب طريق تاني.';
          return;
        }
      }
      if (pos.x === goal.x && pos.y === goal.y) {
        msgEl.className = 'eng-msg eng-success';
        msgEl.textContent = '🎉 وصلت بأمان!';
        onComplete(true);
      } else {
        msgEl.className = 'eng-msg eng-fail';
        msgEl.textContent = 'قريب بس لسه — كمّل البرنامج.';
      }
    }

    container.querySelector('#engRunBtn').addEventListener('click', run);

    renderBlocksPanel();
    renderMazeGrid();
  }

  // ---------- اختبار ----------
  function renderQuiz(container, config, onComplete) {
    const questions = config.questions;
    let idx = 0;
    let score = 0;

    function renderQuestion() {
      const q = questions[idx];
      container.innerHTML = `
        <div class="eng-quiz">
          <div class="eng-quiz-progress">سؤال ${idx + 1} من ${questions.length}</div>
          <h3 class="eng-quiz-q">${q.q}</h3>
          <div class="eng-quiz-options" id="engOptions"></div>
          <div class="eng-quiz-feedback" id="engFeedback"></div>
          <button class="eng-btn-run" id="engNextBtn" style="display:none;">التالي ←</button>
        </div>
      `;
      const optionsEl = container.querySelector('#engOptions');
      const feedbackEl = container.querySelector('#engFeedback');
      const nextBtn = container.querySelector('#engNextBtn');

      q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'eng-quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          [...optionsEl.children].forEach((b) => (b.disabled = true));
          const correct = i === q.correct;
          if (correct) {
            btn.classList.add('eng-correct');
            score++;
          } else {
            btn.classList.add('eng-wrong');
            optionsEl.children[q.correct].classList.add('eng-correct');
          }
          feedbackEl.textContent = (correct ? '✅ صح! ' : '❌ مش صح. ') + (q.explain || '');
          feedbackEl.className = 'eng-quiz-feedback ' + (correct ? 'eng-success' : 'eng-fail');
          nextBtn.style.display = 'inline-block';
        });
        optionsEl.appendChild(btn);
      });

      nextBtn.addEventListener('click', () => {
        idx++;
        if (idx < questions.length) {
          renderQuestion();
        } else {
          onComplete(score, questions.length);
        }
      });
    }

    renderQuestion();
  }

  // ---------- بطاقات معلومات (ملخص قبل الاختبار) ----------
  function renderCards(container, config, onComplete) {
    const cards = config.cards || [];
    let idx = 0;

    function renderCard() {
      if (cards.length === 0) { onComplete(); return; }
      const c = cards[idx];
      container.innerHTML = `
        <div class="eng-card-wrap">
          <div class="eng-card-progress">بطاقة ${idx + 1} من ${cards.length}</div>
          <div class="eng-card">
            ${c.emoji ? `<div class="eng-card-emoji">${c.emoji}</div>` : ''}
            ${c.title ? `<h3 class="eng-card-title">${c.title}</h3>` : ''}
            <div class="eng-card-body">${c.body || ''}</div>
          </div>
          <div class="eng-card-nav">
            <button class="eng-btn-clear" id="engCardPrev" ${idx === 0 ? 'disabled' : ''}>→ السابق</button>
            <button class="eng-btn-run" id="engCardNext">${idx === cards.length - 1 ? 'كمّل ✓' : 'التالي ←'}</button>
          </div>
        </div>
      `;
      container.querySelector('#engCardNext').addEventListener('click', () => {
        if (idx < cards.length - 1) { idx++; renderCard(); }
        else { onComplete(); }
      });
      container.querySelector('#engCardPrev').addEventListener('click', () => {
        if (idx > 0) { idx--; renderCard(); }
      });
    }

    renderCard();
  }

  // ---------- شات قصصي: بيتكشف وهو انت بتنزل في الصفحة عادي (زي Qureo بالظبط) ----------
  // مفيش بوكس منفصل ليه سكرول جوّاه ولا سحب خاص — الصفحة كلها بتتمرمر عادي،
  // وكل رسالة بتتكتب حرف بحرف أول ما توصلها وانت نازل.
  function renderChat(container, config, onComplete) {
    const characters = config.characters || { a: config.character || config.mentor || { name: 'المرشد', emoji: '🤖' } };
    const messages = config.messages || [];
    let idx = 0;
    let score = 0;
    let revealing = false; // true وإحنا بين رسالة وبعض عشان المراقب مايطلقش كذا مرة مع بعض

    container.innerHTML = `
      <div class="eng-chat-wrap">
        <div class="eng-chat-log" id="engChatLog"></div>
        <div class="eng-chat-sentinel" id="engSentinel"></div>
        <div class="eng-chat-controls" id="engChatControls"></div>
      </div>
    `;
    const log = container.querySelector('#engChatLog');
    const controls = container.querySelector('#engChatControls');
    const sentinel = container.querySelector('#engSentinel');

    // كارت "ما ستتعلمه في هذا الدرس" — أول حاجة تظهر لو الدرس حدد objectives
    if (config.objectives && config.objectives.length) {
      const obj = document.createElement('div');
      obj.className = 'eng-objectives';
      obj.innerHTML = `
        <div class="eng-objectives-title">💎 ما ستتعلمه في هذا الدرس</div>
        ${config.objectives.map((o) => `<div class="eng-objectives-item">${escapeHtml(o)}</div>`).join('')}
      `;
      log.appendChild(obj);
    }

    function scrollDown() { /* الصفحة بتتمرمر لوحدها عادي، مفيش بوكس منفصل نتحكم فيه */ }
    function charOf(key) { return characters[key] || characters.a || { name: 'شخصية', emoji: '🙂' }; }
    function escapeHtml(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    // أيقونة SVG بدل الإيموجي للشخصيات المعروفة (بيكسل = روبوت، نون = خريج)، وأي شخصية تانية بتفضل بإيموجيها
    function avatarHtml(ch) {
      if (ch.emoji === '🤖') return '<svg class="icon-svg" style="width:19px;height:19px"><use href="#ic-robot"/></svg>';
      if (ch.emoji === '🧑‍🎓') return '<svg class="icon-svg" style="width:19px;height:19px"><use href="#ic-grad"/></svg>';
      return `<span style="font-size:17px;">${ch.emoji || '🙂'}</span>`;
    }

    let skipCurrentTyping = null; // لو فيه كتابة شغالة دلوقتي، السحب بيخلّصها فورًا بدل ما يستناها

    // بتكتب الـ HTML حرف بحرف (زي Qureo) — الوسوم زي <b> أو <code> بتتحط مرة واحدة عشان متتكسرش
    // لو المستخدم سحب وهي لسه بتتكتب، بتخلص فورًا (مش إجباري تستنى الكتابة تخلص)
    function typeHtml(el, html, onDone) {
      let i = 0;
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        el.innerHTML = html;
        skipCurrentTyping = null;
        onDone && onDone();
      }
      function step() {
        if (done) return;
        if (i >= html.length) { finish(); return; }
        if (html[i] === '<') {
          const close = html.indexOf('>', i);
          el.innerHTML += html.slice(i, close < 0 ? html.length : close + 1);
          i = close < 0 ? html.length : close + 1;
        } else {
          el.innerHTML += html[i];
          i++;
        }
        scrollDown();
        setTimeout(step, 22);
      }
      skipCurrentTyping = finish;
      step();
    }

    // فقاعة كلام بسيطة: أفاتار دائري صغير + فقاعة ملوّنة، زي شات حقيقي مألوف
    function addBubble(charKey, html, extraCls, typed) {
      const isStudent = charKey === 'student';
      const ch = isStudent ? null : charOf(charKey);
      const row = document.createElement('div');
      row.className = 'eng-msg ' + (isStudent ? 'eng-msg-student' : 'eng-msg-char-' + charKey) + (extraCls ? ' ' + extraCls : '');
      row.innerHTML =
        (!isStudent ? `<div class="eng-avatar" title="${ch.name || ''}">${avatarHtml(ch)}</div>` : '') +
        `<div class="eng-bubble-col">
          ${!isStudent && ch.name ? `<div class="eng-msg-name">${ch.name}</div>` : ''}
          <div class="eng-bubble"></div>
        </div>`;
      const bodyEl = row.querySelector('.eng-bubble');
      log.appendChild(row);
      if (typed) {
        typeHtml(bodyEl, html, () => { revealing = false; checkReveal(); });
      } else {
        bodyEl.innerHTML = html;
        revealing = false;
      }
      return row;
    }

    // بانل كود ثابت (IDE) جوه الحدوتة — لأمثلة الكود، مش نص &lt;code&gt; وسط الكلام.
    // زرار "تشغيل" بيفتح مربع نتيجة حقيقي جنبه: لو فيه previewHtml بيعرض صفحة مصغّرة
    // شغالة فعليًا (HTML/CSS/JS مع بعض)؛ غير كده بيشغّل الـJS ويطلع ناتج console.log.
    function addCodePanel(m) {
      const wrap = document.createElement('div');
      wrap.className = 'eng-ide';
      const lines = (m.code || '').split('\n');
      const isJs = /\.js$/i.test(m.filename || '') || !/\.(html|css)$/i.test(m.filename || '');
      wrap.innerHTML = `
        <div class="eng-ide-tabbar">
          <span class="eng-ide-dot"></span><span class="eng-ide-dot"></span><span class="eng-ide-dot"></span>
          <span class="eng-ide-qlabel" style="margin-inline-start:4px; color:#e0b65c;">${escapeHtml(m.filename || 'example')}</span>
        </div>
        <div class="eng-ide-body" style="direction:ltr; text-align:left;">
          ${lines.map((ln, i) => `<div class="eng-ide-line"><span class="eng-ide-gutter">${i + 1}</span><span class="eng-ide-code">${escapeHtml(ln) || ' '}</span></div>`).join('')}
        </div>
        <button class="eng-run-btn" type="button">▶ تشغيل الكود</button>
        <div class="eng-code-result" style="display:none;">
          <div class="eng-code-result-label">النتيجة</div>
          <div class="eng-code-result-box"></div>
        </div>
      `;
      const runBtn = wrap.querySelector('.eng-run-btn');
      const resultWrap = wrap.querySelector('.eng-code-result');
      const resultBox = wrap.querySelector('.eng-code-result-box');
      runBtn.addEventListener('click', () => {
        resultWrap.style.display = 'block';
        if (m.previewHtml) {
          // معاينة حقيقية شغالة (مش نص) — صفحة مصغّرة جوه iframe معزول
          resultBox.innerHTML = '';
          const iframe = document.createElement('iframe');
          iframe.className = 'eng-code-preview-frame';
          iframe.setAttribute('sandbox', 'allow-scripts');
          iframe.srcdoc = m.previewHtml;
          resultBox.appendChild(iframe);
          return;
        }
        if (!isJs) {
          resultBox.innerHTML = '<div class="eng-code-note">💡 ده كود HTML/CSS، مش بيتشغّل هنا — جرّبه على WebDen (webden.dev) عشان تشوف شكله فعليًا.</div>';
          return;
        }
        const logs = [];
        const fakeConsole = { log: (...a) => logs.push(a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')) };
        let text;
        try {
          // eslint-disable-next-line no-new-func
          new Function('console', m.code)(fakeConsole);
          text = logs.length ? logs.join('\n') : '✅ اتنفّذ من غير أي مشاكل (الكود ده معندوش console.log يطبع حاجة).';
        } catch (e) {
          text = '⚠️ خطأ: ' + e.message;
        }
        resultBox.innerHTML = `<pre class="eng-code-output">${escapeHtml(text)}</pre>`;
      });
      log.appendChild(wrap);
      revealing = false;
    }

    // بلوك "سؤال" (شكل IDE) — بيظهر بعد ما الحدوتة كلها تخلص، مش جوّاها. بيستنى إجابتك
    // قبل ما يكمّل للسؤال اللي بعده.
    const quiz = config.quiz || [];
    let quizIdx = 0;
    const totalQ = quiz.length;
    function addQuizQuestion(q) {
      const wrap = document.createElement('div');
      wrap.className = 'eng-ide';
      wrap.innerHTML = `
        <div class="eng-ide-tabbar">
          <span class="eng-ide-qlabel">❓ سؤال</span>
          <span class="eng-ide-progress">${quizIdx + 1}/${totalQ}</span>
        </div>
        <div class="eng-ide-body">
          <div class="eng-ide-line"><span class="eng-ide-gutter">1</span><span class="eng-ide-code eng-ide-comment">// ${escapeHtml(q.text)}</span></div>
          <div class="eng-ide-line"><span class="eng-ide-gutter">2</span><span class="eng-ide-code"><span class="eng-ide-kw">function</span> answer() {</span></div>
          <div class="eng-ide-choices"></div>
          <div class="eng-ide-line"><span class="eng-ide-gutter">${(q.choices || []).length + 3}</span><span class="eng-ide-code">}</span></div>
        </div>
      `;
      log.appendChild(wrap);
      const choicesWrap = wrap.querySelector('.eng-ide-choices');
      (q.choices || []).forEach((choice, i) => {
        const line = document.createElement('div');
        line.className = 'eng-ide-line eng-ide-choice';
        line.innerHTML = `<span class="eng-ide-gutter">${i + 3}</span><span class="eng-ide-code">  <span class="eng-ide-kw">return</span> <span class="eng-ide-str">"${escapeHtml(choice)}"</span>;</span>`;
        line.addEventListener('click', () => {
          wrap.querySelectorAll('.eng-ide-choice').forEach((l) => { l.style.pointerEvents = 'none'; });
          line.classList.add('eng-ide-picked');
          const correct = i === q.correct;
          if (correct) score++;
          const fb = document.createElement('div');
          fb.className = 'eng-panel ' + (correct ? 'eng-correct' : 'eng-wrong');
          fb.style.padding = '12px 16px'; fb.style.marginTop = '8px';
          fb.textContent = (correct ? '✅ إجابة صح! ' : '❌ مش الإجابة الصح. ') + (q.explain || '');
          log.appendChild(fb);
          revealing = false;
          log.appendChild(sentinel);
          checkReveal();
        });
        choicesWrap.appendChild(line);
      });
    }

    function revealNext() {
      if (idx >= messages.length) {
        if (quizIdx < quiz.length) {
          revealing = true;
          addQuizQuestion(quiz[quizIdx++]);
          return;
        }
        clearInterval(pollId);
        sentinel.remove();
        onComplete(score, totalQ);
        return;
      }
      revealing = true;
      const m = messages[idx++];
      if (m.code) {
        addCodePanel(m);
        checkReveal();
      } else {
        const charKey = m.from || 'a';
        addBubble(charKey, m.text, null, true); // بتتكتب حرف بحرف أول ما توصلها وانت نازل
      }
      log.appendChild(sentinel); // السنتينل يفضل آخر حاجة عشان نعرف وصلت لحد فين
    }

    // بيتأكد كل شوية (مش معتمد على حدث سكرول ممكن ميوصلش) لو الـsentinel (آخر نقطة
    // في الشات) قرّب من حدود الشاشة وانت نازل بالصفحة عادي، وساعتها يكشف الرسالة الجاية.
    function checkReveal() {
      if (revealing) return;
      const rect = sentinel.getBoundingClientRect();
      if (rect.top < window.innerHeight + 150) revealNext();
    }
    const pollId = setInterval(checkReveal, 150);

    // أي سحب (swipe/scroll باللمس) وفيه رسالة لسه بتتكتب — يخلّصها فورًا، من غير أي دوسة.
    // مجرد ما تحرك إصبعك عشان تنزل، لو فيه كتابة شغالة بتتخطى تلقائي.
    let touchStartY = null;
    log.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    log.addEventListener('touchmove', (e) => {
      if (touchStartY == null || !skipCurrentTyping) return;
      if (Math.abs(touchStartY - e.touches[0].clientY) > 6) skipCurrentTyping();
    }, { passive: true });
    window.addEventListener('wheel', () => { if (skipCurrentTyping) skipCurrentTyping(); }, { passive: true });

    revealNext();
  }

  // ---------- محرر كود JavaScript حقيقي شغال (زي "هيا نجرّب!" في Qureo) ----------
  function renderCode(container, config, onComplete) {
    container.innerHTML = `
      <div class="eng-code-wrap">
        ${config.expectedOutput ? `
          <div class="eng-ide" style="margin:0;">
            <div class="eng-ide-tabbar"><span class="eng-ide-qlabel">مثال: النتيجة</span></div>
            <pre class="eng-code-output">${config.expectedOutput.replace(/</g, '&lt;')}</pre>
          </div>` : ''}

        <div class="eng-code-task">
          <div class="eng-code-task-title">🚀 هيا نجرّب!</div>
          <p>${config.task || ''}</p>
          ${config.targetSnippet ? `
            <div class="eng-code-copy">
              <code>${config.targetSnippet.replace(/</g, '&lt;')}</code>
              <button class="eng-copy-btn" id="engCopyBtn">نسخ</button>
            </div>` : ''}
        </div>

        <div class="eng-ide" style="margin:0 0 10px;">
          <div class="eng-ide-tabbar"><span class="eng-ide-qlabel">JavaScript</span></div>
          <textarea id="engCodeInput" class="eng-code-input" spellcheck="false" placeholder="${(config.placeholder || 'اكتب الكود هنا...').replace(/"/g, '&quot;')}">${config.starterCode || ''}</textarea>
          <button class="eng-run-btn" id="engRunBtn">▶ تشغيل الكود</button>
        </div>

        <div class="eng-ide">
          <div class="eng-ide-tabbar"><span class="eng-ide-qlabel">وحدة النتائج</span></div>
          <pre class="eng-code-output" id="engCodeOutput"></pre>
        </div>

        <div id="engCodeFeedback"></div>
        <div class="eng-code-controls" id="engCodeControls"></div>
      </div>
    `;

    const input = container.querySelector('#engCodeInput');
    const output = container.querySelector('#engCodeOutput');
    const feedback = container.querySelector('#engCodeFeedback');
    const controls = container.querySelector('#engCodeControls');
    const copyBtn = container.querySelector('#engCopyBtn');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard && navigator.clipboard.writeText(config.targetSnippet).catch(() => {});
        copyBtn.textContent = 'اتنسخ ✓';
        setTimeout(() => { copyBtn.textContent = 'نسخ'; }, 1200);
      });
    }

    container.querySelector('#engRunBtn').addEventListener('click', () => {
      const logs = [];
      const fakeConsole = { log: (...a) => logs.push(a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')) };
      let errorMsg = null;
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', input.value);
        fn(fakeConsole);
      } catch (e) {
        errorMsg = e.message;
      }
      output.textContent = errorMsg ? `⚠️ خطأ: ${errorMsg}` : logs.join('\n');

      const actual = logs.join('\n').trim();
      const expected = (config.expectedOutput || '').trim();
      const passed = !errorMsg && expected && actual === expected;

      feedback.innerHTML = '';
      controls.innerHTML = '';
      const msg = document.createElement('div');
      if (passed) {
        msg.className = 'eng-panel eng-correct';
        msg.style.marginTop = '10px'; msg.style.padding = '14px 16px';
        msg.textContent = '✅ ' + (config.successMsg || 'تمام كده! الناتج زي المطلوب بالظبط.');
        feedback.appendChild(msg);
        const nextBtn = document.createElement('button');
        nextBtn.className = 'eng-btn-run';
        nextBtn.textContent = 'التالي ←';
        nextBtn.addEventListener('click', () => onComplete());
        controls.appendChild(nextBtn);
      } else if (!errorMsg) {
        msg.className = 'eng-panel eng-wrong';
        msg.style.marginTop = '10px'; msg.style.padding = '14px 16px';
        msg.textContent = `جرّب تاني — الناتج المطلوب بالظبط: "${expected}"`;
        feedback.appendChild(msg);
      }
    });
  }

  // ---------- سيناريو واقعي (رسالة/إيميل/مكالمة وهمية) + قرار ----------
  // بدل سؤال اختبار نظري جاف، بيوريك "شاشة" واقعية (رسالة SMS، إيميل، محادثة،
  // أو بلاغ مكالمة) وبيسألك "تعمل إيه؟" — نفس فكرة مواقف تيك هوم العملية.
  const SCENARIO_ICON = { sms: '💬', email: '📧', call: '📞', dm: '🎮' };
  function renderScenario(container, config, onComplete) {
    const rounds = config.scenarios || [];
    let idx = 0;
    let score = 0;

    function renderRound() {
      const r = rounds[idx];
      const ic = SCENARIO_ICON[r.kind] || '📨';
      let mockHtml = '';
      if (r.kind === 'email') {
        mockHtml = `
          <div class="eng-mock eng-mock-email">
            <div class="eng-mock-head"><b>من:</b> ${r.from || ''}</div>
            <div class="eng-mock-head"><b>الموضوع:</b> ${r.subject || ''}</div>
            <div class="eng-mock-body">${r.body || ''}</div>
          </div>`;
      } else if (r.kind === 'call') {
        mockHtml = `
          <div class="eng-mock eng-mock-call">
            <div class="eng-mock-call-ic">📞</div>
            <div class="eng-mock-call-from">${r.from || 'مكالمة واردة'}</div>
            <div class="eng-mock-body">${r.body || ''}</div>
          </div>`;
      } else {
        mockHtml = `
          <div class="eng-mock eng-mock-${r.kind || 'sms'}">
            <div class="eng-mock-head">${ic} ${r.from || ''}</div>
            <div class="eng-mock-body">${r.body || ''}</div>
          </div>`;
      }

      container.innerHTML = `
        <div class="eng-quiz">
          <div class="eng-quiz-progress">موقف ${idx + 1} من ${rounds.length}</div>
          ${mockHtml}
          <h3 class="eng-quiz-q">${r.question || 'تعمل إيه؟'}</h3>
          <div class="eng-quiz-options" id="engOptions"></div>
          <div class="eng-quiz-feedback" id="engFeedback"></div>
          <button class="eng-btn-run" id="engNextBtn" style="display:none;">التالي ←</button>
        </div>
      `;
      const optionsEl = container.querySelector('#engOptions');
      const feedbackEl = container.querySelector('#engFeedback');
      const nextBtn = container.querySelector('#engNextBtn');

      r.choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'eng-quiz-opt';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
          [...optionsEl.children].forEach((b) => (b.disabled = true));
          if (choice.correct) {
            btn.classList.add('eng-correct');
            score++;
          } else {
            btn.classList.add('eng-wrong');
            const correctBtn = [...optionsEl.children].find((_, j) => r.choices[j].correct);
            if (correctBtn) correctBtn.classList.add('eng-correct');
          }
          feedbackEl.textContent = (choice.correct ? '✅ قرار سليم! ' : '❌ ده قرار خطر. ') + (choice.feedback || r.explain || '');
          feedbackEl.className = 'eng-quiz-feedback ' + (choice.correct ? 'eng-success' : 'eng-fail');
          nextBtn.style.display = 'inline-block';
        });
        optionsEl.appendChild(btn);
      });

      nextBtn.addEventListener('click', () => {
        idx++;
        if (idx < rounds.length) renderRound();
        else onComplete(score, rounds.length);
      });
    }

    renderRound();
  }

  // ---------- تحدي تيرمينال (زي TryHackMe): تدوّر في نظام ملفات وهمي وتلاقي الدليل/الـflag ----------
  function renderTerminal(container, config, onComplete) {
    const fs = JSON.parse(JSON.stringify(config.fs));
    let cwd = config.startDir ? [...config.startDir] : ['home'];
    let solved = false;

    function resolveDir(parts) {
      let node = fs;
      for (const p of parts) { if (!node[p] || node[p].__type !== 'dir') return null; node = node[p]; }
      return node;
    }
    function resolvePathArg(arg) {
      if (!arg || arg === '.' || arg === '~') return { parts: [...cwd], name: null };
      const abs = arg.startsWith('/');
      let parts = abs ? [] : [...cwd];
      for (const seg of arg.split('/').filter(Boolean)) {
        if (seg === '..') { if (parts.length) parts.pop(); }
        else if (seg !== '.') parts.push(seg);
      }
      const name = parts.pop();
      return { parts, name };
    }
    function promptPath() { return '~/' + cwd.slice(1).join('/'); }

    // غرف "TryHackMe style" بمهام متعددة (config.tasks) بدل flag واحد بس.
    // لو مفيش tasks، الدرس بيشتغل بالطريقة القديمة بالظبط (flagAnswer واحد) من غير أي تغيير.
    const hasTasks = Array.isArray(config.tasks) && config.tasks.length > 0;
    const tasksHtml = hasTasks
      ? `<div class="eng-term-tasks" id="engTermTasks">
          ${config.tasks.map((t, i) => `
            <div class="eng-term-task" id="engTask${i}" data-idx="${i}">
              <div class="eng-task-head"><span class="eng-task-num">المهمة ${i + 1}</span><span class="eng-task-status" id="engTaskStatus${i}">⬜</span></div>
              <div class="eng-task-q">${t.question}</div>
              <div class="eng-term-answer-row">
                <input class="eng-term-answer" id="engTaskAnswer${i}" placeholder="${t.answerPlaceholder || 'اكتب إجابتك هنا...'}" />
                <button class="eng-btn-run" id="engTaskSubmit${i}">تأكيد ✓</button>
              </div>
              <div class="eng-quiz-feedback" id="engTaskFeedback${i}"></div>
            </div>
          `).join('')}
        </div>`
      : '';

    container.innerHTML = `
      <div class="eng-term-wrap">
        <p class="eng-term-brief">${config.intro || ''}</p>
        <div class="eng-term" id="engTermBox">
          <div class="eng-term-lines" id="engTermLines"></div>
          <form class="eng-term-inrow" id="engTermForm" action="javascript:void(0)" autocomplete="off">
            <span class="eng-term-prompt" id="engTermPrompt"></span>
            <input class="eng-term-input" id="engTermInput" type="text" enterkeyhint="send" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
          </form>
        </div>
        ${tasksHtml}
        ${!hasTasks ? `
        <div class="eng-term-answer-row">
          <input class="eng-term-answer" id="engTermAnswer" placeholder="${config.answerPlaceholder || 'اكتب الـflag اللي لقيته هنا...'}" />
          <button class="eng-btn-run" id="engTermSubmit">تأكيد ✓</button>
        </div>
        <div class="eng-quiz-feedback" id="engTermFeedback"></div>
        ` : ''}
        <button class="eng-btn-run" id="engTermNext" style="display:none;">التالي ←</button>
      </div>
    `;

    const linesEl = container.querySelector('#engTermLines');
    const inputEl = container.querySelector('#engTermInput');
    const promptEl = container.querySelector('#engTermPrompt');
    const feedbackEl = container.querySelector('#engTermFeedback');
    const nextBtn = container.querySelector('#engTermNext');

    function print(text, cls) {
      const d = document.createElement('div');
      d.className = 'eng-term-line' + (cls ? ' ' + cls : '');
      d.textContent = text;
      linesEl.appendChild(d);
      scrollTermToBottom();
    }
    function scrollTermToBottom() {
      const box = container.querySelector('#engTermBox');
      if (box) box.scrollTop = box.scrollHeight;
    }
    function updatePrompt() { promptEl.textContent = `kali:${promptPath()}$`; }

    const CMDS = {
      help() { print('الأوامر المتاحة: ls, cd, cat, pwd, help'); },
      pwd() { print(promptPath()); },
      ls(arg) {
        const t = arg ? resolvePathArg(arg) : { parts: cwd, name: null };
        const dir = t.name ? (resolveDir(t.parts) || {})[t.name] : resolveDir(t.parts);
        if (!dir || dir.__type !== 'dir') { print('ls: مفيش فولدر كده', 'eng-term-err'); return; }
        const entries = Object.keys(dir).filter((k) => k !== '__type');
        print(entries.length ? entries.map((e) => (dir[e].__type === 'dir' ? e + '/' : e)).join('   ') : '(فاضي)');
      },
      cd(arg) {
        if (!arg || arg === '~') { cwd = config.startDir ? [...config.startDir] : ['home']; updatePrompt(); return; }
        if (arg === '..') { if (cwd.length > 1) cwd.pop(); updatePrompt(); return; }
        const { parts, name } = resolvePathArg(arg);
        const base = resolveDir(parts);
        if (base && name && base[name] && base[name].__type === 'dir') { cwd = [...parts, name]; updatePrompt(); }
        else print(`cd: مفيش فولدر اسمه "${arg}"`, 'eng-term-err');
      },
      cat(arg) {
        if (!arg) { print('استخدم: cat اسم_الملف'); return; }
        const { parts, name } = resolvePathArg(arg);
        const dir = resolveDir(parts);
        if (dir && dir[name] && dir[name].__type === 'file') print(dir[name].content);
        else print(`cat: مفيش ملف اسمه "${arg}"`, 'eng-term-err');
      },
    };

    print(config.welcomeMsg || 'اكتب "help" عشان تشوف الأوامر المتاحة.');
    updatePrompt();

    container.querySelector('#engTermForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = inputEl.value.trim();
      inputEl.value = '';
      if (raw) {
        print(`${promptEl.textContent} ${raw}`, 'eng-term-echo');
        const [cmd, ...rest] = raw.split(' ');
        if (CMDS[cmd]) CMDS[cmd](rest.join(' '));
        else print(`bash: ${cmd}: الأمر مش معروف`, 'eng-term-err');
      }
      scrollTermToBottom();
      inputEl.focus({ preventScroll: true });
    });
    container.querySelector('#engTermBox').addEventListener('click', () => inputEl.focus({ preventScroll: true }));

    if (hasTasks) {
      // غرفة بمهام متعددة: كل مهمة ليها input/submit منفصل، وكل التاسكات لازم تتحل عشان يظهر زرار "التالي"
      const doneTasks = new Set();
      config.tasks.forEach((t, i) => {
        const taskAnswerEl = container.querySelector(`#engTaskAnswer${i}`);
        const taskFeedbackEl = container.querySelector(`#engTaskFeedback${i}`);
        const taskStatusEl = container.querySelector(`#engTaskStatus${i}`);
        const taskSubmitEl = container.querySelector(`#engTaskSubmit${i}`);

        function trySubmitTask() {
          const given = taskAnswerEl.value.trim();
          const expected = String(t.flagAnswer || '').trim();
          const correct = given && expected && given.toLowerCase() === expected.toLowerCase();
          if (correct && !doneTasks.has(i)) {
            doneTasks.add(i);
            taskFeedbackEl.textContent = '✅ ' + (t.successMsg || 'صح!');
            taskFeedbackEl.className = 'eng-quiz-feedback eng-success';
            taskStatusEl.textContent = '✅';
            container.querySelector(`#engTask${i}`).classList.add('eng-task-done');
            taskAnswerEl.disabled = true;
            taskSubmitEl.disabled = true;
            if (doneTasks.size === config.tasks.length && !solved) {
              solved = true;
              nextBtn.style.display = 'inline-block';
            }
          } else if (!correct) {
            taskFeedbackEl.textContent = '❌ مش هي — راجع الملف تاني.';
            taskFeedbackEl.className = 'eng-quiz-feedback eng-fail';
          }
        }
        taskSubmitEl.addEventListener('click', trySubmitTask);
        taskAnswerEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') trySubmitTask(); });
      });
    } else {
      container.querySelector('#engTermAnswer').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); container.querySelector('#engTermSubmit').click(); }
      });
      container.querySelector('#engTermSubmit').addEventListener('click', () => {
        const answerEl = container.querySelector('#engTermAnswer');
        const given = answerEl.value.trim();
        const expected = String(config.flagAnswer || '').trim();
        const correct = given && expected && given.toLowerCase() === expected.toLowerCase();
        if (correct && !solved) {
          solved = true;
          feedbackEl.textContent = '✅ ' + (config.successMsg || 'تمام! لقيت الدليل صح.');
          feedbackEl.className = 'eng-quiz-feedback eng-success';
          nextBtn.style.display = 'inline-block';
          answerEl.disabled = true;
          container.querySelector('#engTermSubmit').disabled = true;
        } else if (!correct) {
          feedbackEl.textContent = '❌ مش هي — دوّر كمان في الملفات والفولدرات.';
          feedbackEl.className = 'eng-quiz-feedback eng-fail';
        }
      });
    }

    nextBtn.addEventListener('click', () => onComplete(1, 1));
  }

  return { renderMaze, renderQuiz, renderCards, renderChat, renderCode, renderScenario, renderTerminal };
})();
