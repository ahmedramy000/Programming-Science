const term = new Terminal({ fontSize: 13, theme: { background: '#000000' } });
term.open(document.getElementById('terminal'));
term.writeln('علوم البرمجة Terminal — جاري تجهيز بايثون...');

let editor;
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: 'print("أهلاً بيك في علوم البرمجة 👋")\nfor i in range(3):\n    print("خطوة", i + 1)',
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
  });
});

let pyodideReady = null;
async function initPyodide() {
  const pyodide = await loadPyodide();
  pyodide.setStdout({ batched: (msg) => term.writeln(msg) });
  pyodide.setStderr({ batched: (msg) => term.writeln('\x1b[31m' + msg + '\x1b[0m') });
  return pyodide;
}
pyodideReady = initPyodide().then((p) => {
  document.getElementById('status').textContent = 'جاهز ✅';
  document.getElementById('runBtn').disabled = false;
  term.writeln('جاهز! اضغط "تشغيل" عشان تجرّب الكود.\n');
  return p;
});

document.getElementById('runBtn').addEventListener('click', async () => {
  const pyodide = await pyodideReady;
  const code = editor.getValue();
  term.writeln('\n$ تشغيل...');
  try {
    await pyodide.runPythonAsync(code);
  } catch (e) {
    term.writeln('\x1b[31m' + e + '\x1b[0m');
  }
});
