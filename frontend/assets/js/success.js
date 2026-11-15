const params = new URLSearchParams(location.search);
const component = params.get('component') || 'unknown';
const status = params.get('status') || 'ok';

const labels = {
  kali: 'Kali Linux',
  ide: 'VS Code + الإضافات',
  unknown: 'العنصر',
};

const ic = document.getElementById('ic');
const title = document.getElementById('title');
const desc = document.getElementById('desc');

if (status === 'ok') {
  ic.textContent = '✅';
  title.textContent = `${labels[component] || labels.unknown} اتثبت بنجاح!`;
  desc.textContent = 'تقدر ترجع تكمل من القائمة الرئيسية دلوقتي.';
} else {
  ic.textContent = '❌';
  title.textContent = `حصلت مشكلة في تثبيت ${labels[component] || labels.unknown}`;
  desc.textContent = 'راجع رسالة الخطأ في نافذة التثبيت وحاول تاني.';
}
