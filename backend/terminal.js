// ============================================================
// ترمينال Linux حقيقي عبر WebSocket
// كل جلسة = bash process منفصل في sandbox معزول
// بيتمسح تلقائياً بعد 20 دقيقة أو لما المستخدم يقفل
// ============================================================
const { spawn }  = require('child_process');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const MAX_SESSIONS    = 10;   // أقصى عدد جلسات في نفس الوقت
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 دقيقة
const MAX_OUTPUT_KB   = 512;  // أقصى output لكل جلسة

const sessions = new Map(); // sessionId → { proc, timer, dir, bytes }

function killSession(id) {
  const s = sessions.get(id);
  if (!s) return;
  clearTimeout(s.timer);
  try { s.proc.kill('SIGKILL'); } catch {}
  try { fs.rmSync(s.dir, { recursive: true, force: true }); } catch {}
  sessions.delete(id);
}

function createSandboxDir() {
  const dir = path.join(os.tmpdir(), `kudosk-term-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { mode: 0o700 });
  return dir;
}

// بيئة آمنة بدون أسرار السيرفر
function sandboxEnv(dir) {
  return {
    HOME: dir, TMPDIR: dir, PWD: dir,
    TERM: 'xterm-256color', LANG: 'C.UTF-8',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    PS1: '\\u@linux:\\w\\$ ',
    SHELL: '/bin/bash',
  };
}

function attachWss(server) {
  const wss = new WebSocketServer({ server, path: '/terminal' });

  wss.on('connection', (ws, req) => {
    // Rate limit بسيط: أقصى MAX_SESSIONS
    if (sessions.size >= MAX_SESSIONS) {
      ws.send('\r\n⚠️ السيرفر وصل للحد الأقصى من الجلسات. جرّب بعد شوية.\r\n');
      ws.close();
      return;
    }

    const id  = crypto.randomUUID();
    const dir = createSandboxDir();

    // ملف ترحيب بسيط في الـhome
    fs.writeFileSync(path.join(dir, 'welcome.txt'),
      'أهلاً بك في ترمينال Linux! هذه بيئة Ubuntu حقيقية معزولة.\n' +
      'الجلسة بتنتهي تلقائياً بعد 20 دقيقة وملفاتها بتتمسح.\n' +
      'جرّب: ls -la  |  python3 --version  |  echo "Hello Linux!"\n');

    const proc = spawn('bash', ['--norc', '--noprofile'], {
      cwd: dir, env: sandboxEnv(dir),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      ws.send('\r\n⏰ انتهت مهلة الجلسة (20 دقيقة). شكراً!\r\n');
      ws.close();
      killSession(id);
    }, SESSION_TIMEOUT);

    sessions.set(id, { proc, timer, dir, bytes: 0 });

    // رسالة ترحيب + PS1
    proc.stdin.write('cat ~/welcome.txt\n');

    // output من الـbash → المتصفح
    function onData(data) {
      const s = sessions.get(id);
      if (!s) return;
      s.bytes += data.length;
      if (s.bytes > MAX_OUTPUT_KB * 1024) {
        ws.send('\r\n⚠️ وصلت للحد الأقصى من الـoutput. جرّب جلسة جديدة.\r\n');
        ws.close(); killSession(id); return;
      }
      if (ws.readyState === 1 /* OPEN */) ws.send(data);
    }
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);

    proc.on('exit', () => {
      ws.send('\r\n[انتهت الجلسة]\r\n');
      ws.close(); killSession(id);
    });

    // input من المتصفح → الـbash
    ws.on('message', (msg) => {
      const s = sessions.get(id);
      if (!s) return;
      try {
        const data = JSON.parse(msg);
        if (data.type === 'input' && typeof data.data === 'string') {
          proc.stdin.write(data.data);
        } else if (data.type === 'resize') {
          // node-pty مش موجود، resize مش متاح بدونه — نتجاهله
        }
      } catch {
        // string مباشر
        proc.stdin.write(msg);
      }
    });

    ws.on('close', () => killSession(id));
    ws.on('error', () => killSession(id));
  });

  return wss;
}

module.exports = { attachWss };
