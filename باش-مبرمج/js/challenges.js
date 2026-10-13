// علوم البرمجة — التحديات: صعوبة بتزيد تدريجيًا، نوعين (منهج كامل / تحويل أرقام)
// © Ahmed Rami
//
// ⚠️ ملاحظة مهمة للمطوّر: مستوى الصعوبة في "تحديات المنهج" بيزيد عن طريق عدد الأسئلة
// والوقت المتاح ونسبة النجاح المطلوبة (مش محتوى الأسئلة نفسها، لأن بنك أسئلة الوحدات
// الحالي مش متصنّف بمستويات صعوبة). أما "تحديات الأرقام" فمصنّفة فعليًا بمستوى صعوبة
// حقيقي (tier) من NUMBER_CHALLENGE_POOL في data.js، والمستوى الخامس بيستخدم حل خطوة
// بخطوة حقيقي بدل الاختيار من متعدد.

const CHALLENGE_LEVELS = [
  {level:1, label:'سهل',    icon:'🟢', questions:6,  secsPerQ:40, passPct:0.60},
  {level:2, label:'متوسط',  icon:'🟡', questions:8,  secsPerQ:35, passPct:0.65},
  {level:3, label:'صعب',    icon:'🟠', questions:10, secsPerQ:30, passPct:0.70},
  {level:4, label:'خبير',   icon:'🔴', questions:12, secsPerQ:25, passPct:0.75},
  {level:5, label:'أسطوري', icon:'🟣', questions:6,  secsPerQ:90, passPct:0.80},
];
const TRACK_META = {
  curriculum: {title:'تحديات المنهج', icon:'📚', desc:'أسئلة من كل وحدات صفّك مخلوطة مع بعض — كل مستوى أسئلة أكتر ووقت أقل.'},
  numbers:    {title:'تحديات الأرقام', icon:'🔢', desc:'تحويل بين الأنظمة العددية (عشري/ثنائي/سادس عشر) — المستوى الخامس حل خطوة بخطوة.'}
};

function challengeLevelOf(n){ return CHALLENGE_LEVELS.find(l=>l.level===n); }
function challengeUnlockedLevel(track){
  if(!STATE.challengeProgress) STATE.challengeProgress = {curriculum:{'1sec':0,'2bac':0,'3prep':0}, numbers:0};
  if(track === 'numbers') return STATE.challengeProgress.numbers || 0;
  return (STATE.challengeProgress.curriculum && STATE.challengeProgress.curriculum[STATE.currentGrade]) || 0;
}
function challengeSetUnlockedLevel(track, level){
  if(!STATE.challengeProgress) STATE.challengeProgress = {curriculum:{'1sec':0,'2bac':0,'3prep':0}, numbers:0};
  if(track === 'numbers'){ STATE.challengeProgress.numbers = Math.max(STATE.challengeProgress.numbers||0, level); return; }
  if(!STATE.challengeProgress.curriculum) STATE.challengeProgress.curriculum = {'1sec':0,'2bac':0,'3prep':0};
  const g = STATE.currentGrade;
  STATE.challengeProgress.curriculum[g] = Math.max(STATE.challengeProgress.curriculum[g]||0, level);
}

// ============ تجميع بنك أسئلة "تحديات المنهج" من كل وحدات الصف الحالي ============
function curriculumChallengePool(){
  const scope = certScope();
  const out = [];
  scope.units.forEach(u=>{
    (u.finalTest||[]).forEach(q=> out.push(q));
    u.lessons.forEach(l=>{
      (l.quiz||[]).forEach(q=> out.push(q));
      (l.practice||[]).forEach(q=> out.push(q));
    });
  });
  return out;
}

function openChallenges(){
  navTo('screen-challenges', 'التحديات', 'صعوبة بتزيد تدريجيًا — من سهل لأسطوري');
  renderChallengesHub();
}

function challengeTrackHTML(track){
  const meta = TRACK_META[track];
  const unlocked = challengeUnlockedLevel(track);
  const ladder = CHALLENGE_LEVELS.map(lv=>{
    const state = lv.level <= unlocked ? 'done' : (lv.level === unlocked+1 ? 'open' : 'locked');
    const cls = state==='done' ? 'ch-lvl done' : (state==='open' ? 'ch-lvl open' : 'ch-lvl locked');
    const click = state==='locked' ? '' : `onclick="startChallenge('${track}', ${lv.level})"`;
    return `<div class="${cls}" ${click} title="${lv.label}">
      <span class="ch-lvl-ic">${state==='locked' ? '🔒' : lv.icon}</span>
      <span class="ch-lvl-n">${lv.level}</span>
    </div>`;
  }).join('<div class="ch-lvl-line"></div>');
  return `<div class="card">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <div style="font-size:26px;">${meta.icon}</div>
      <div style="flex:1;"><h4 style="margin:0;">${meta.title}</h4><p style="margin:2px 0 0; font-size:11.5px; color:var(--ink-dim);">${meta.desc}</p></div>
    </div>
    <div class="ch-ladder">${ladder}</div>
    ${unlocked>=5 ? '<p style="margin:10px 0 0; text-align:center; color:var(--accent); font-size:12px;">🏅 خلّصت كل المستويات في المسار ده!</p>' : ''}
  </div>`;
}

function renderChallengesHub(){
  const root = document.getElementById('challengesRoot');
  if(!root) return;
  let html = challengeTrackHTML('curriculum');
  if(STATE.currentGrade === '1sec'){
    html += challengeTrackHTML('numbers');
  } else {
    html += `<div class="card" style="text-align:center; padding:24px 18px;">
      <div style="font-size:30px; margin-bottom:6px;">🔢</div>
      <h4 style="margin:0 0 6px;">تحديات الأرقام متاحة للصف الأول الثانوي بس دلوقتي</h4>
      <p style="color:var(--ink-dim); font-size:12px; margin:0;">هتتوسّع لصفوف تانية أول ما محتواها يتضاف.</p>
    </div>`;
  }
  root.innerHTML = html;
}

// ============ بدء تحدي (اختياري / صح وخطأ / إكمال) ============
function startChallenge(track, level){
  const unlocked = challengeUnlockedLevel(track);
  if(level > unlocked+1){ showToast('كمّل المستوى اللي قبله الأول 🔒'); return; }
  const lv = challengeLevelOf(level);
  if(track === 'numbers' && level === 5){ startStepChallenge(level); return; }

  let pool;
  if(track === 'numbers'){
    pool = NUMBER_CHALLENGE_POOL.filter(q=>q.tier===level).slice();
  } else {
    pool = curriculumChallengePool();
  }
  if(!pool.length){ showToast('بنك الأسئلة لسه فاضي للمسار ده'); return; }
  shuffleArray(pool);
  const qs = pool.slice(0, Math.min(lv.questions, pool.length)).map(q=>{
    const c = JSON.parse(JSON.stringify(q)); c.type = c.type || 'mcq';
    if(c.type === 'mcq'){ const o = c.opts.map((_,i)=>i); shuffleArray(o); c.opts = o.map(i=>c.opts[i]); c.a = o.indexOf(c.a); }
    return c;
  });
  STATE.challengeSession = { track, level, mode:'quiz', questions: qs, answered:{}, answeredCount:0, correctCount:0 };
  navTo('screen-challenge-session', `${TRACK_META[track].title} — مستوى ${level}`, lv.label);
  renderChallengeSession();
}

function renderChallengeSession(){
  const s = STATE.challengeSession;
  const lv = challengeLevelOf(s.level);
  QREG = {};
  let html = `<div class="card exams-intro">
    <span class="card-tag" style="background:rgba(255,180,84,.14); color:#FFC168;">${lv.icon} ${TRACK_META[s.track].title} — مستوى ${s.level} (${lv.label})</span>
    <p style="margin:0 0 8px;">${s.questions.length} سؤال، لازم ${Math.round(lv.passPct*100)}% أو أكثر عشان تعدّي للمستوى التالي.</p>
    <div class="test-timer" id="challengeTimer">⏱️ ${formatMMSS(lv.secsPerQ * s.questions.length)}</div>
  </div>`;
  html += `<div class="card">`;
  html += s.questions.map((q,qi)=> renderQuestion(q, `ch-${s.track}-${s.level}-${qi}`, 'challenge', qi, s.questions.length)).join('');
  html += `</div>`;
  html += `<div class="nav-btns" style="margin-top:6px;">
    <button class="btn btn-ghost" onclick="clearActiveTimer(); STATE.challengeSession=null; openChallenges();">إلغاء والرجوع للتحديات</button>
    <button class="btn btn-primary" id="challengeSubmitBtn" disabled onclick="submitChallenge()">إنهاء التحدي (0/${s.questions.length})</button>
  </div>`;
  document.getElementById('challengeBody').innerHTML = html;
  document.getElementById('challengeProg').style.width = '0%';
  startCountdown(lv.secsPerQ * s.questions.length, 'challengeTimer', ()=>submitChallenge(true));
}
function updateChallengeFooter(){
  const s = STATE.challengeSession;
  if(!s || s.mode !== 'quiz') return;
  const btn = document.getElementById('challengeSubmitBtn');
  if(!btn) return;
  btn.textContent = `إنهاء التحدي (${s.answeredCount}/${s.questions.length})`;
  btn.disabled = s.answeredCount < s.questions.length;
  const prog = document.getElementById('challengeProg');
  if(prog) prog.style.width = `${(s.answeredCount/s.questions.length)*100}%`;
}

function submitChallenge(force){
  const s = STATE.challengeSession;
  if(!s) return;
  if(s.mode === 'quiz' && !force && s.answeredCount < s.questions.length) return;
  clearActiveTimer();
  const lv = challengeLevelOf(s.level);
  const total = s.mode === 'quiz' ? s.questions.length : s.steps.length;
  const correct = s.mode === 'quiz' ? s.correctCount : s.steps.filter(x=>x.allStepsCorrect).length;
  const score = total ? correct/total : 0;
  const passed = score >= lv.passPct;
  finishChallengeAttempt(s.track, s.level, passed, score, correct, total, force);
}

function finishChallengeAttempt(track, level, passed, score, correct, total, force){
  const lv = challengeLevelOf(level);
  const wasAlreadyUnlocked = challengeUnlockedLevel(track) >= level;
  if(passed) challengeSetUnlockedLevel(track, level);
  if(passed && !wasAlreadyUnlocked){
    addXP(track==='numbers' ? '1sec' : STATE.currentGrade, 15 * level);
    if(level === 5) logBadgeEarned('challenge', `${track}-track`, `${TRACK_META[track].title} — كل المستويات`, '🏅');
  }
  saveState();
  const pct = Math.round(score*100);
  const nextLevel = level < 5 ? level+1 : null;
  document.getElementById('challengeBody').innerHTML = `
    <div class="card done-badge">
      <div class="ico">${passed ? (level===5?'🏅':'🏆') : (force ? '⏰' : '💪')}</div>
      <h4>${passed ? (level===5 ? 'مبروك! خلّصت كل مستويات المسار ده 🎉' : 'مبروك! فتحت المستوى اللي بعده') : (force ? 'انتهى الوقت' : 'قريب! جرّب تاني')}</h4>
      <p style="font-size:22px; font-weight:900; color:${passed?'var(--accent)':'var(--accent-3)'}; margin:8px 0;">${pct}%</p>
      <p>${correct} صح من ${total}</p>
      <div class="nav-btns" style="margin-top:16px;">
        <button class="btn btn-ghost" onclick="startChallenge('${track}', ${level})">إعادة المحاولة</button>
        ${passed && nextLevel ? `<button class="btn btn-primary" onclick="startChallenge('${track}', ${nextLevel})">المستوى التالي ▶</button>` : `<button class="btn btn-primary" onclick="openChallenges()">رجوع للتحديات</button>`}
      </div>
    </div>`;
  document.getElementById('challengeProg').style.width = '100%';
  STATE.challengeSession = null;
}

// ============ المستوى الخامس لتحديات الأرقام: حل خطوة بخطوة بدل اختيار من متعدد ============
// الطريقة: قسمة متكررة على الأساس المطلوب (2 للثنائي أو 16 للسادس عشر) وتجميع الباقي —
// نفس الطريقة بالظبط اللي اتشرحت في الدرس. الطالب بيدخل ناتج القسمة والباقي لكل خطوة،
// ولو جاوب صح أو غلط بنعرضله الناتج الصحيح فورًا (يوفرله وقت الآلة الحاسبة) ونكمل
// بالقيمة الصحيحة عشان الخطوات اللي بعدها تتبني صح، لكن بنسجّل هل كل خطواته كانت سليمة.
function startStepChallenge(level){
  const lv = challengeLevelOf(level);
  const pool = STEP_SOLVER_POOL.slice();
  shuffleArray(pool);
  const targets = pool.slice(0, Math.min(lv.questions, pool.length));
  STATE.challengeSession = { track:'numbers', level, mode:'step', steps: targets.map(t=>({
    n: t.n, toBase: t.toBase, base: t.toBase==='hex' ? 16 : 2,
    cur: t.n, collected: [], userOk: [], done:false, allStepsCorrect:true
  })), idx: 0 };
  navTo('screen-challenge-session', `تحديات الأرقام — مستوى 5`, 'حل خطوة بخطوة');
  renderStepSolverSession();
}
function toBaseStr(n, base){ return base===16 ? n.toString(16).toUpperCase() : n.toString(2); }
function digitToStr(n, base){ return base===16 ? n.toString(16).toUpperCase() : n.toString(2); }

function renderStepSolverSession(){
  const s = STATE.challengeSession;
  const total = s.steps.length;
  const done = s.steps.filter(x=>x.done).length;
  const cur = s.steps[s.idx];
  const baseLabel = cur.base===16 ? 'السادس عشر (÷16)' : 'الثنائي (÷2)';
  const log = cur.collected.map((c,i)=>
    `<div class="step-row ${cur.userOk[i]?'ok':'bad'}">
       <span>${c.from} ÷ ${cur.base} = ${c.q} باقي <b>${digitToStr(c.r, cur.base)}</b></span>
       <span>${cur.userOk[i] ? '✅' : '❌ (الصح: '+c.r+')'}</span>
     </div>`).join('');
  const target = `تحويل ${cur.n} (عشري) إلى النظام ${baseLabel.replace(' (÷16)','').replace(' (÷2)','')}`;
  const stepDone = cur.cur === 0;
  document.getElementById('challengeBody').innerHTML = `
    <div class="card exams-intro">
      <span class="card-tag" style="background:rgba(255,180,84,.14); color:#FFC168;">🟣 مستوى 5 — حل خطوة بخطوة (${s.idx+1}/${total})</span>
      <p style="margin:0;">${target} بطريقة القسمة المتكررة. اكتب ناتج القسمة والباقي في كل خطوة — هنعرضلك الناتج الصحيح أول ما تتأكد، فمش محتاج آلة حاسبة.</p>
    </div>
    <div class="card">
      ${log || '<p style="color:var(--ink-dim); font-size:12px;">ابدأ بالخطوة الأولى تحت 👇</p>'}
      ${!stepDone ? `
        <div class="step-input-row">
          <span>${cur.cur} ÷ ${cur.base} =</span>
          <input type="number" id="stepQ" class="lan-input" placeholder="الناتج" style="width:90px;">
          <span>باقي</span>
          <input type="number" id="stepR" class="lan-input" placeholder="الباقي" style="width:70px;">
          <button class="btn btn-primary" style="flex:none;" onclick="checkStep()">تحقق ✓</button>
        </div>
      ` : `
        <div class="card" style="background:var(--panel-2); text-align:center;">
          <p style="margin:0 0 6px; font-size:12px; color:var(--ink-dim);">خلاص القسمة وصلت لصفر — الناتج باقتراء الباقي من تحت لفوق:</p>
          <p style="font-size:20px; font-weight:900; color:var(--accent); direction:ltr;">${cur.collected.map(c=>digitToStr(c.r,cur.base)).reverse().join('')}</p>
          <p style="margin:6px 0 0; font-size:12px;">${cur.allStepsCorrect ? '✅ كل خطواتك كانت صح!' : '⚠️ بعض الخطوات كانت غلط، شوف التصحيح فوق.'}</p>
          <button class="btn btn-primary" style="width:100%; margin-top:10px;" onclick="nextStepTarget()">${s.idx+1<total ? 'الرقم التالي ▶' : 'إنهاء المستوى 🏁'}</button>
        </div>
      `}
    </div>`;
  document.getElementById('challengeProg').style.width = `${(done/total)*100}%`;
}
function checkStep(){
  const s = STATE.challengeSession;
  const cur = s.steps[s.idx];
  const qEl = document.getElementById('stepQ'), rEl = document.getElementById('stepR');
  const userQ = qEl ? +qEl.value : NaN, userR = rEl ? +rEl.value : NaN;
  const realQ = Math.floor(cur.cur / cur.base), realR = cur.cur % cur.base;
  const ok = userQ === realQ && userR === realR;
  if(!ok) cur.allStepsCorrect = false;
  cur.collected.push({from: cur.cur, q: realQ, r: realR});
  cur.userOk.push(ok);
  cur.cur = realQ;
  if(cur.cur === 0) cur.done = true;
  renderStepSolverSession();
}
function nextStepTarget(){
  const s = STATE.challengeSession;
  s.idx++;
  if(s.idx >= s.steps.length){ submitChallenge(); return; }
  renderStepSolverSession();
}
