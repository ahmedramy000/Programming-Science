const ageConfigs = {
  7:  { size:4, goal:{x:3,y:3}, viruses:[{x:1,y:1}], blocks:['right','left','down','up'] },
  8:  { size:4, goal:{x:3,y:3}, viruses:[{x:1,y:1},{x:2,y:2}], blocks:['right','left','down','up'] },
  9:  { size:5, goal:{x:4,y:4}, viruses:[{x:1,y:1},{x:2,y:3},{x:3,y:1}], blocks:['right','left','down','up','repeat'] },
  10: { size:6, goal:{x:5,y:5}, viruses:[{x:1,y:1},{x:2,y:3},{x:3,y:1},{x:4,y:4},{x:1,y:4}], blocks:['right','left','down','up','repeat'] }
};
const blockMeta = {
  right:{ic:'➡️', label:'تحرك يمين'},
  left:{ic:'⬅️', label:'تحرك شمال'},
  down:{ic:'⬇️', label:'تحرك لتحت'},
  up:{ic:'⬆️', label:'تحرك لفوق'},
  repeat:{ic:'🔁', label:'كرر اللي قبله'}
};

let currentAge = 7;
let SIZE, start, goal, viruses;
let program = [];
let pos;

const mazeEl = document.getElementById('maze');
const programEl = document.getElementById('program');
const msgEl = document.getElementById('msg');
const tipEl = document.getElementById('tip');
const blocksListEl = document.getElementById('blocksList');

function addCommand(cmd){
  if(cmd === 'repeat'){
    if(program.length>0){ program.push(program[program.length-1]); }
  } else {
    program.push(cmd);
  }
  renderProgram();
}

function renderBlocks(){
  blocksListEl.innerHTML = '';
  const cfg = ageConfigs[currentAge];
  cfg.blocks.forEach(cmd=>{
    const meta = blockMeta[cmd];
    const btn = document.createElement('button');
    btn.className = 'block-btn';
    btn.draggable = true;
    btn.dataset.cmd = cmd;
    btn.innerHTML = `<span class="ic">${meta.ic}</span> ${meta.label}`;
    btn.addEventListener('click', ()=> addCommand(cmd));
    btn.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', cmd);
      btn.classList.add('dragging');
    });
    btn.addEventListener('dragend', ()=> btn.classList.remove('dragging'));
    blocksListEl.appendChild(btn);
  });
}

programEl.addEventListener('dragover', (e)=>{ e.preventDefault(); programEl.classList.add('dragover'); });
programEl.addEventListener('dragleave', ()=> programEl.classList.remove('dragover'));
programEl.addEventListener('drop', (e)=>{
  e.preventDefault();
  programEl.classList.remove('dragover');
  const cmd = e.dataTransfer.getData('text/plain');
  if(cmd) addCommand(cmd);
});

function setAge(age){
  currentAge = age;
  const cfg = ageConfigs[age];
  SIZE = cfg.size;
  start = {x:0,y:0};
  goal = cfg.goal;
  viruses = cfg.viruses;
  program = [];
  pos = {...start};
  document.querySelectorAll('.age-btn').forEach(b=>{
    b.classList.toggle('active', parseInt(b.dataset.age)===age);
  });
  renderBlocks();
  renderProgram();
  resetRun();
}

document.querySelectorAll('.age-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> setAge(parseInt(btn.dataset.age)));
});

const tips = [
  "💡 متفتحش مرفقات من إيميلات مش معروفة المصدر.",
  "💡 استخدم كلمة مرور قوية وغيّرها كل فترة.",
  "💡 فعّل التحقق بخطوتين على حساباتك المهمة.",
  "💡 حدّث برامجك باستمرار عشان تقفل الثغرات.",
  "💡 متشاركش بياناتك الشخصية مع مواقع مش موثوقة."
];

function cellKey(x,y){return x+'-'+y;}
function isVirus(x,y){return viruses.some(v=>v.x===x&&v.y===y);}

function renderMaze(){
  mazeEl.style.gridTemplateColumns = `repeat(${SIZE},1fr)`;
  mazeEl.innerHTML = '';
  for(let y=0;y<SIZE;y++){
    for(let x=0;x<SIZE;x++){
      const c = document.createElement('div');
      c.className = 'cell';
      if(x===goal.x && y===goal.y) c.classList.add('goal');
      if(isVirus(x,y)) c.classList.add('virus');
      let content = '';
      if(isVirus(x,y)) content = '🦠';
      else if(x===goal.x && y===goal.y) content = '🏁';
      if(pos.x===x && pos.y===y){
        content = '<span class="player">🧑‍💻</span>';
      }
      c.innerHTML = content;
      mazeEl.appendChild(c);
    }
  }
}

function renderProgram(){
  programEl.innerHTML = '';
  program.forEach((cmd, i)=>{
    const meta = blockMeta[cmd];
    const s = document.createElement('div');
    s.className = 'step';
    s.innerHTML = `<span>${i+1}. ${meta.ic} ${meta.label}</span><button data-i="${i}">✕</button>`;
    programEl.appendChild(s);
  });
}

programEl.addEventListener('click', (e)=>{
  if(e.target.tagName === 'BUTTON'){
    const i = parseInt(e.target.dataset.i);
    program.splice(i,1);
    renderProgram();
  }
});

document.getElementById('clearBtn').addEventListener('click', ()=>{
  program = [];
  renderProgram();
  resetRun();
});

function resetRun(){
  pos = {...start};
  msgEl.className = 'msg';
  msgEl.textContent = '';
  tipEl.textContent = '💡 نصيحة أمنية: لما تلاقي فيروس في طريقك، متفتحوش — دور على طريق تاني آمن!';
  renderMaze();
}

async function run(){
  resetRun();
  if(program.length === 0){
    msgEl.textContent = 'ضيف أوامر الأول عشان تحرّك اللاعب 🙂';
    return;
  }
  for(const cmd of program){
    await new Promise(r=>setTimeout(r, 350));
    if(cmd==='right' && pos.x < SIZE-1) pos.x++;
    if(cmd==='left' && pos.x > 0) pos.x--;
    if(cmd==='down' && pos.y < SIZE-1) pos.y++;
    if(cmd==='up' && pos.y > 0) pos.y--;
    renderMaze();
    if(isVirus(pos.x,pos.y)){
      msgEl.className = 'msg fail';
      msgEl.textContent = '😱 للأسف داست على فيروس! جرّب طريق تاني آمن.';
      tipEl.textContent = tips[Math.floor(Math.random()*tips.length)];
      return;
    }
  }
  if(pos.x===goal.x && pos.y===goal.y){
    msgEl.className = 'msg success';
    msgEl.textContent = '🎉 تمام! وصلت بأمان وخلّصت الشبكة من الفيروسات!';
  } else {
    msgEl.className = 'msg fail';
    msgEl.textContent = 'قريبة بس لسه مش وصلت للهدف 🏁 — كمّل البرنامج.';
  }
}

document.getElementById('runBtn').addEventListener('click', run);

setAge(7);

// ---- PWA: تسجيل Service Worker + زرار التثبيت ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js').catch(()=>{});
  });
}

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});
window.addEventListener('appinstalled', () => {
  installBtn.style.display = 'none';
});
