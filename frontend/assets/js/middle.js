// غيّر العنوان ده لو هوست الباك إند بتاعك مختلف
const API_BASE = 'https://kudosk-api.onrender.com';
const API_URL = `${API_BASE}/run`;

// مؤشر حالة الاتصال بالسيرفر وقت فتح الصفحة
(async () => {
  const dot = document.getElementById('statusDot');
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(6000) });
    dot.textContent = res.ok ? '🟢 السيرفر شغال' : '🔴 السيرفر مش راضي';
  } catch {
    dot.textContent = '🔴 السيرفر نايم أو مش متاح (جرّب تاني بعد شوية)';
  }
})();

const cm = CodeMirror.fromTextArea(document.getElementById('code'), {
  mode: 'python', theme: 'dracula', lineNumbers: true,
});

document.getElementById('lang').addEventListener('change', (e) => {
  cm.setOption('mode', e.target.value);
});

const runBtn = document.getElementById('runBtn');
const output = document.getElementById('output');

runBtn.addEventListener('click', async () => {
  const code = cm.getValue();
  const language = document.getElementById('lang').value;
  runBtn.disabled = true;
  output.textContent = '⏳ بيشتغل على السيرفر...';
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });
    const data = await res.json();
    output.textContent = (data.output || '') + (data.error ? '\n⚠️ ' + data.error : '');
  } catch (err) {
    output.textContent = '❌ معرفش أوصل للسيرفر. اتأكد إن الباك إند شغال على:\n' + API_URL;
  } finally {
    runBtn.disabled = false;
  }
});
