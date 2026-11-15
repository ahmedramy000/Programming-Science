const CACHE_NAME = 'elom-elbarmaga-v36';
// ملفات v86 الكبيرة (المحرك والـBIOS) اختيارية - لو المستخدم لسه مضافهاش في
// assets/v86/، مش هنوقف تسطيب السيرفر وركر كله عشانها (كاشينج منفصل تحت)
const OPTIONAL_ASSETS = [
  '/assets/v86/libv86.js',
  '/assets/v86/v86.wasm',
  '/assets/v86/seabios.bin',
  '/assets/v86/vgabios.bin',
];
const ASSETS = [
  '/assets/js/v86-boot.js',
  '/assets/css/v86-boot.css',
  '/',
  '/index.html',
  '/home.html',
  '/profile.html',
  '/assets/icons.svg',
  '/assets/js/icons-inject.js',
  '/assets/js/progress.js',
  '/library/index.html',
  '/editor/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/light/index.html',
  '/middle/index.html',
  '/full/index.html',
  '/scratch/index.html',
  '/assets/css/index.css',
  '/assets/js/index.js',
  '/assets/css/light.css',
  '/assets/js/light.js',
  '/assets/css/middle.css',
  '/assets/js/middle.js',
  '/assets/css/full.css',
  '/assets/css/scratch.css',
  '/cyber/index.html',
  '/cyber/lesson.html',
  '/cyber/pcbuild.html',
  '/cyber/freeroom.html',
  '/cyber/cpu-sim.html',
  '/assets/css/cpu-sim.css',
  '/assets/js/cpu-sim.js',
  '/assets/css/cyber.css',
  '/assets/css/quest.css',
  '/assets/js/cyber-engine.js',
  '/assets/js/cyber-lessons.js',
  '/assets/js/cyber-hub.js',
  '/assets/js/cyber-lesson-player.js',
  '/assets/js/pc-parts-data.js',
  '/assets/js/pcbuild.js',
  '/assets/js/freeroom.js',
  '/rig/index.html',
  '/assets/css/rig.css',
  '/assets/js/rig-page.js',
  '/start/index.html',
  '/assets/js/start-quiz.js',
  '/light/terminal.html',
  '/assets/css/light-terminal.css',
  '/assets/js/light-terminal.js',
  '/courses/index.html',
  '/courses/unit.html',
  '/courses/lesson.html',
  '/assets/css/courses.css',
  '/assets/js/courses-data.js',
  '/assets/js/courses-hub.js',
  '/assets/js/courses-unit.js',
  '/assets/js/courses-lesson-player.js',
  '/interactive.html',
  '/setup/index.html',
  '/library/python/index.html',
  '/library/python/lesson.html',
  '/assets/js/python-lessons.js',
  '/assets/js/python-hub.js',
  '/assets/js/python-lesson-player.js',
  '/book/',
  '/book/index.html',
  '/book/css/style.css',
  '/book/js/app.js',
  '/book/js/data.js',
  '/book/js/glossary.js',
  '/book/js/certificates.js',
  '/book/js/challenges.js',
  '/book/js/crypto-backup.js',
  '/book/js/qr.js',
  '/book/js/lan.js',
  '/book/js/sync.js',
  '/book/icons/icon-192.png',
  '/book/icons/icon-512.png',
  '/book/icons/apple-touch-icon.png',
  '/book/icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      await Promise.all(OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
