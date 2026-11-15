// بيحقن سبرايت الأيقونات (assets/icons.svg) جوه الصفحة نفسها، عشان <use href="#id">
// يشتغل بثبات في كل المتصفحات (بدل ما يفضل مرجع خارجي ممكن يتلخبط في بعضها).
(function () {
  const script = document.currentScript;
  const base = script && script.getAttribute('data-base') || '';
  fetch(base + 'assets/icons.svg')
    .then((r) => r.text())
    .then((svgText) => {
      const div = document.createElement('div');
      div.innerHTML = svgText;
      document.body.insertBefore(div.firstElementChild, document.body.firstChild);
    })
    .catch(() => {});
})();
