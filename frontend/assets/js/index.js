function tick(){
  const el = document.getElementById('clock');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
}
tick(); setInterval(tick, 1000 * 30);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
