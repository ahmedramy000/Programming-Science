// ============================================
// محاكاة تيرمينال لينكس — تعليمية بس (نسخة موسّعة)
// نظام ملفات وهمي بالكامل في الذاكرة، مفيش تنفيذ حقيقي لأي حاجة.
// ده البديل التدريبي اللي بيظهر لو الجهاز مش هيقدر يشغّل v86 الحقيقي،
// أو لحد ما المستخدم يختار يشغّل النظام الحقيقي بنفسه.
// ============================================

const FS = {
  home: {
    __type: 'dir',
    'notes.txt': { __type: 'file', content: 'فاكرة: كمّل درس 7 في مسار الأمن السيبراني 🛡️' },
    'projects': {
      __type: 'dir',
      'kudosk.txt': { __type: 'file', content: 'مشروع علوم البرمجة — منصة تعليم برمجة 🚀' },
    },
    'secrets': {
      __type: 'dir',
      'flag.txt': { __type: 'file', content: '🏁 مبروك! لقيت أول "flag" — كده عملت أول خطوة في عالم الـCTF!' },
    },
  },
  etc: {
    __type: 'dir',
    'motd': { __type: 'file', content: 'Welcome to Kudosk Fake Linux — للتعليم بس، مش نظام حقيقي.' },
    'hostname': { __type: 'file', content: 'kudosk-kali' },
  },
  var: {
    __type: 'dir',
    log: {
      __type: 'dir',
      'auth.log': { __type: 'file', content: '[kudosk] لو شفت ملف زي ده في نظام حقيقي، معناه فيه محاولات دخول اتسجّلت.' },
    },
  },
  bin: { __type: 'dir' },
};

let cwd = ['home'];
const history = [];
let historyIdx = -1;

function resolveDir(pathParts) {
  let node = FS;
  for (const p of pathParts) {
    if (!node[p] || node[p].__type !== 'dir') return null;
    node = node[p];
  }
  return node;
}

// بيحل مسار نسبي أو مطلق (بدون .. متداخلة معقدة - كفاية للتعليم)
function resolvePathArg(arg) {
  if (!arg || arg === '.' || arg === '~') return { parts: [...cwd], name: null };
  const abs = arg.startsWith('/');
  let parts = abs ? [] : [...cwd];
  for (const seg of arg.split('/').filter(Boolean)) {
    if (seg === '..') { if (parts.length) parts.pop(); }
    else if (seg === '.') { /* نفس المكان */ }
    else parts.push(seg);
  }
  const name = parts.pop();
  return { parts, name };
}

function promptPath() {
  const p = cwd.slice(1).join('/');
  return cwd[0] === 'home' ? '~/' + p : '/' + cwd.join('/');
}

const linesEl = document.getElementById('termLines');
const inputEl = document.getElementById('termInput');
const promptLabel = document.getElementById('promptLabel');

function print(text, cls = '') {
  const div = document.createElement('div');
  div.className = 'term-line ' + cls;
  div.textContent = text;
  linesEl.appendChild(div);
  linesEl.parentElement.scrollTop = linesEl.parentElement.scrollHeight;
}

function updatePrompt() {
  promptLabel.textContent = `kudosk@kali:${promptPath()}$`;
}

const MAN_PAGES = {
  ls: 'ls — بيعرض محتويات الفولدر الحالي. جرّب: ls',
  cd: 'cd [فولدر] — بينقلك لفولدر تاني. cd .. يرجعك خطوة لورا، cd ~ يرجعك للهوم.',
  grep: 'grep كلمة ملف — بيدوّر على كلمة جوه ملف معيّن.',
  nmap: 'nmap target — أداة حقيقية بتفحص البورتات المفتوحة على جهاز/سيرفر. هنا محاكاة تعليمية بس.',
  ping: 'ping host — بيبعت حزم صغيرة يتأكد إن الجهاز التاني شغّال ومتوصل بالشبكة.',
};

const COMMANDS = {
  help() {
    print('الأوامر المتاحة: ls, cd, pwd, cat, mkdir, touch, rm, mv, cp, find, grep, echo,');
    print('whoami, hostname, date, history, man, clear, neofetch, ping, nmap, sudo, exit, help');
  },
  pwd() { print(promptPath()); },
  ls(arg) {
    const target = arg && !arg.startsWith('-') ? resolvePathArg(arg) : { parts: cwd, name: null };
    const dir = target.name ? (resolveDir(target.parts) || {})[target.name] : resolveDir(target.parts);
    if (!dir || dir.__type !== 'dir') { print(`ls: مفيش فولدر كده`, 'term-err'); return; }
    const entries = Object.keys(dir).filter((k) => k !== '__type');
    if (entries.length === 0) { print('(فاضي)'); return; }
    print(entries.map((e) => (dir[e].__type === 'dir' ? e + '/' : e)).join('   '));
  },
  cd(arg) {
    if (!arg || arg === '~') { cwd = ['home']; updatePrompt(); return; }
    if (arg === '..') {
      if (cwd.length > 1) cwd.pop();
      updatePrompt();
      return;
    }
    const { parts, name } = resolvePathArg(arg);
    const base = resolveDir(parts);
    if (base && name && base[name] && base[name].__type === 'dir') {
      cwd = [...parts, name];
      updatePrompt();
    } else {
      print(`cd: مفيش فولدر اسمه "${arg}"`, 'term-err');
    }
  },
  cat(arg) {
    if (!arg) { print('استخدم: cat اسم_الملف'); return; }
    const { parts, name } = resolvePathArg(arg);
    const dir = resolveDir(parts);
    if (dir && dir[name] && dir[name].__type === 'file') {
      print(dir[name].content);
    } else {
      print(`cat: مفيش ملف اسمه "${arg}"`, 'term-err');
    }
  },
  mkdir(arg) {
    if (!arg) { print('استخدم: mkdir اسم_الفولدر'); return; }
    const dir = resolveDir(cwd);
    dir[arg] = { __type: 'dir' };
    print(`✅ اتعمل فولدر "${arg}"`);
  },
  touch(arg) {
    if (!arg) { print('استخدم: touch اسم_الملف'); return; }
    const dir = resolveDir(cwd);
    if (!dir[arg]) dir[arg] = { __type: 'file', content: '' };
    print(`✅ اتعمل ملف "${arg}"`);
  },
  rm(arg) {
    if (!arg) { print('استخدم: rm اسم_الملف (أو rm -r اسم_الفولدر)'); return; }
    const clean = arg.replace(/^-r\s*/, '').trim();
    const dir = resolveDir(cwd);
    if (dir[clean]) { delete dir[clean]; print(`🗑️ اتمسح "${clean}"`); }
    else { print(`rm: مفيش "${clean}"`, 'term-err'); }
  },
  mv(arg) {
    const [from, to] = (arg || '').split(' ').filter(Boolean);
    if (!from || !to) { print('استخدم: mv القديم الجديد'); return; }
    const dir = resolveDir(cwd);
    if (!dir[from]) { print(`mv: مفيش "${from}"`, 'term-err'); return; }
    dir[to] = dir[from];
    delete dir[from];
    print(`✅ اتنقل "${from}" لـ"${to}"`);
  },
  cp(arg) {
    const [from, to] = (arg || '').split(' ').filter(Boolean);
    if (!from || !to) { print('استخدم: cp القديم الجديد'); return; }
    const dir = resolveDir(cwd);
    if (!dir[from]) { print(`cp: مفيش "${from}"`, 'term-err'); return; }
    dir[to] = JSON.parse(JSON.stringify(dir[from]));
    print(`✅ اتنسخ "${from}" لـ"${to}"`);
  },
  find(arg) {
    const results = [];
    (function walk(node, path) {
      for (const k of Object.keys(node)) {
        if (k === '__type') continue;
        const p = path + '/' + k;
        if (!arg || k.includes(arg)) results.push(node[k].__type === 'dir' ? p + '/' : p);
        if (node[k].__type === 'dir') walk(node[k], p);
      }
    })(FS, '');
    print(results.length ? results.join('\n') : 'مفيش نتايج');
  },
  grep(arg) {
    const [word, file] = (arg || '').split(' ').filter(Boolean);
    if (!word || !file) { print('استخدم: grep كلمة اسم_الملف'); return; }
    const dir = resolveDir(cwd);
    if (!dir[file] || dir[file].__type !== 'file') { print(`grep: مفيش ملف "${file}"`, 'term-err'); return; }
    const content = dir[file].content;
    print(content.includes(word) ? content : `مفيش تطابق لـ"${word}" في "${file}"`);
  },
  echo(arg) { print(arg || ''); },
  whoami() { print('kudosk-student'); },
  hostname() { print('kudosk-kali'); },
  date() { print(new Date().toLocaleString('ar-EG')); },
  history() {
    history.forEach((h, i) => print(`${i + 1}  ${h}`));
  },
  man(arg) {
    print(MAN_PAGES[arg] || `مفيش صفحة مساعدة لـ"${arg}" — جرّب: help`);
  },
  clear() { linesEl.innerHTML = ''; },
  neofetch() {
    print('🛡️  kudosk@kali  — محاكاة تعليمية، مش توزيعة لينكس حقيقية');
    print('OS: علوم البرمجة Fake Linux (Browser Simulation)');
    print('Shell: kudosk-sh v2');
    print('Terminal: kudosk-term');
  },
  ping(arg) {
    if (!arg) { print('استخدم: ping اسم_سيرفر'); return; }
    print(`PING ${arg}: 4 حزم اتبعتت، 4 اترجعوا — الاتصال سليم ✅ (محاكاة تعليمية)`);
  },
  nmap(arg) {
    if (!arg) { print('استخدم: nmap هدف — مثال: nmap 192.168.1.1'); return; }
    // nmap أداة فحص شبكات تقيلة - محتاجة جهاز متوسط على الأقل عشان "تشتغل" هنا،
    // وده أول مكان في المنصة بيربط قوة "جهازي" (Rig) بإتاحة أدوات متقدمة.
    if (window.PSProgress) {
      const tierInfo = window.PSProgress.getRigTierInfo();
      if (tierInfo.key === 'weak') {
        print('⚠️ nmap: الهاردوير بتاعك ضعيف 🐢 — الأداة دي بتاكل معالجة وذاكرة كتير.');
        print('رقّي جهازك (CPU/RAM) من صفحة "جهازي" الأول عشان تقدر تشغّلها.');
        return;
      }
    }
    print(`Starting Nmap محاكاة ضد ${arg}`);
    print('PORT     STATE  SERVICE');
    print('22/tcp   open   ssh');
    print('80/tcp   open   http');
    print('443/tcp  closed https');
    print('(ده فحص وهمي للتعليم — مفيش سكانينج حقيقي بيحصل في المتصفح)');
  },
  sudo(arg) {
    print(`[sudo] المحاكاة دي تدريبية بس — متنفّذش أوامر حقيقية على جهازك، فمفيش معنى لـsudo هنا 😄`);
  },
  exit() { print('اكتب "logout" أو ارجع بزرار "رجوع" فوق الصفحة.'); },
};

print('مرحبًا بيك في محاكاة تيرمينال علوم البرمجة 🖥️');
print('اكتب "help" عشان تشوف الأوامر المتاحة، أو "man أمر" عشان تعرف تفاصيله.');
updatePrompt();

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length === 0) return;
    historyIdx = Math.max(0, historyIdx - 1);
    inputEl.value = history[historyIdx] || '';
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    historyIdx = Math.min(history.length, historyIdx + 1);
    inputEl.value = history[historyIdx] || '';
    return;
  }
  if (e.key !== 'Enter') return;

  const raw = inputEl.value.trim();
  inputEl.value = '';
  if (!raw) return;

  history.push(raw);
  historyIdx = history.length;

  print(`${promptLabel.textContent} ${raw}`, 'term-echo');

  const [cmd, ...rest] = raw.split(' ');
  const arg = rest.join(' ');
  if (COMMANDS[cmd]) {
    COMMANDS[cmd](arg);
  } else {
    print(`bash: ${cmd}: الأمر مش معروف — اكتب "help"`, 'term-err');
  }
});

document.getElementById('termScreen').addEventListener('click', () => inputEl.focus());
inputEl.focus();
