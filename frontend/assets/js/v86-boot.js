// ============================================
// تشغيل Kali Linux حقيقي جوه المتصفح (v86) — من ملف ISO المستخدم نفسه،
// 100% أوفلاين، مفيش fetch ولا رفع لأي سيرفر.
// الموقع بيعمل فحص تلقائي لإمكانيات الجهاز (مساحة تخزين + رامات متاحة)
// قبل ما يعرض خيار "تثبيت نظام حقيقي"، وبيستخدمه full/ (PC) و light/ (موبايل) مع بعض.
// ============================================

// الحد الأدنى المعقول عشان v86 يشتغل بشكل مقبول
// ملحوظة: navigator.storage.estimate() بيرجع "حصة المتصفح" للموقع مش المساحة الفاضية على الجهاز،
// فمش بنستخدمه كشرط. الـISO نفسه بيتقري كـ blob والـdisk الافتراضي بيتعمل async.
const V86_MIN_RAM_GB = 2;   // الرامات الكلية للجهاز (لو المتصفح بيوضحها)
const V86_MIN_CORES = 2;    // أنوية المعالج

async function checkV86Capability() {
  const result = {
    capable: false,
    specs: {
      cpuCores: null,        // navigator.hardwareConcurrency
      deviceMemoryGB: null,  // navigator.deviceMemory (Chromium بس، وبيوصل لحد 8)
      wasm: false,           // v86 محتاج WebAssembly
      mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
      browserStorageQuotaGB: null, // معلومة بس، مش شرط
    },
    reasons: [],
    warnings: [],
  };

  result.specs.wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  result.specs.cpuCores = navigator.hardwareConcurrency || null;
  result.specs.deviceMemoryGB = navigator.deviceMemory || null;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      result.specs.browserStorageQuotaGB = quota ? +(quota / 1024 / 1024 / 1024).toFixed(1) : null;
    } catch { /* تجاهل */ }
  }

  const s = result.specs;
  if (!s.wasm) {
    result.reasons.push('المتصفح مش بيدعم WebAssembly، ومحتاجه عشان يشغّل النظام. جرّب متصفح أحدث.');
  }
  if (s.cpuCores !== null && s.cpuCores < V86_MIN_CORES) {
    result.reasons.push(`عدد أنوية المعالج (${s.cpuCores}) أقل من ${V86_MIN_CORES} الموصى بيهم.`);
  }
  if (s.deviceMemoryGB !== null && s.deviceMemoryGB < V86_MIN_RAM_GB) {
    result.reasons.push(`رامات الجهاز (${s.deviceMemoryGB}GB) أقل من ${V86_MIN_RAM_GB}GB الموصى بيها.`);
  }
  // على الموبايل: نحذّر إن الـISO الكبير ممكن يسبب مشاكل
  if (s.mobile) {
    result.warnings.push('الموبايل ممكن يتعب مع ISOs أكبر من 1GB — الأفضل تجرب على كمبيوتر أو تابلت.');
  }

  // معلومات مش بتمنع التشغيل: المتصفح مش بيوضح القيم دي في كل الحالات
  if (s.cpuCores === null) result.warnings.push('المتصفح مش بيوضح عدد أنوية المعالج، هنكمل بدون الفحص ده.');
  if (s.deviceMemoryGB === null) result.warnings.push('المتصفح مش بيوضح حجم الرامات (ده بيحصل غالبًا في Safari وFirefox)، هنكمل بدون الفحص ده.');
  if (s.deviceMemoryGB !== null && s.deviceMemoryGB >= 8) {
    result.warnings.push('المتصفح بيوضح 8GB كحد أقصى، فالرامات الفعلية ممكن تكون أكتر.');
  }

  result.capable = result.reasons.length === 0;
  return result;
}

// بيبني واجهة اختيار ISO + تشغيل v86 جوه أي container، وبيرجع الـemulator instance

// ============================================================
// mountV86Boot: يدعم Live ISO والـInstaller
// الـInstaller flow:
//   1) يشتغل من cdrom (boot_order=291)
//   2) لما يخلص التثبيت ويعمل reboot → بنمسك emulator-stopped
//   3) بنعمل eject_cdrom وrestart — النسخة الجديدة من v86 بتدعم reboot من hda تلقائياً
//      لو ما اشتغلش، بنعمل save_state للـhda وnew V86 بـboot_order=786
// ============================================================
function mountV86Boot(container, { v86BasePath = '../assets/v86/', defaultRam = 512 } = {}) {
  container.innerHTML = `
    <div class="v86-boot">
      <div class="v86-controls">
        <div class="v86-ram-row">
          <span>الذاكرة:</span>
          <label><input type="radio" name="v86Ram" value="512"> 512MB</label>
          <label><input type="radio" name="v86Ram" value="1024" checked> 1GB</label>
          <label><input type="radio" name="v86Ram" value="2048"> 2GB</label>
        </div>
        <div class="v86-iso-hint">
          ⚠️ <strong>Live ISO</strong>: بيشتغل فوراً (kali-*-live-*.iso).
          <strong>Installer ISO</strong>: بيثبّت ويعمل reboot — الموقع هيكمّل من الـHDD تلقائياً.
          <br>للـ64-bit:
          <a href="https://www.kali.org/get-kali/#kali-live" target="_blank" rel="noopener" style="color:var(--accent)">kali.org ← Live</a>
          &nbsp;|&nbsp; للـ32-bit:
          <a href="https://cdimage.kali.org/kali-images/kali-last-snapshot/" target="_blank" rel="noopener" style="color:var(--accent)">cdimage.kali.org ← live-i386</a>
        </div>
        <div class="v86-arch-row">
          <span class="v86-arch-label">نوع المعالج:</span>
          <label class="v86-arch-opt"><input type="radio" name="v86Arch" value="64" checked> 64-bit</label>
          <label class="v86-arch-opt"><input type="radio" name="v86Arch" value="32"> 32-bit (i386)</label>
        </div>
        <div class="v86-ram-row">
          <span>حجم القرص الافتراضي:</span>
          <label><input type="radio" name="v86Hdd" value="8" checked> 8GB</label>
          <label><input type="radio" name="v86Hdd" value="20"> 20GB</label>
          <label><input type="radio" name="v86Hdd" value="40"> 40GB</label>
        </div>
        <div class="v86-disk-note">
          🔒 القرص الافتراضي معزول تماماً في الذاكرة — مش بيلمس ولا بيأثر على أي ملفات حقيقية على جهازك.
          بيتمسح لما تقفل الصفحة (عادي للتدريب). لو عايز تحفظ نظامك، استخدم زرار "حفظ الحالة" بعد التشغيل.
        </div>
        <label class="v86-pick-btn" for="v86IsoPicker">📂 اختار ملف ISO من جهازك</label>
        <input type="file" id="v86IsoPicker" accept=".iso" style="display:none;">
        <div class="v86-file-chosen" id="v86FileChosen"></div>
      </div>
      <div class="v86-screen-wrap" id="v86ScreenWrap" style="display:none;">
        <div class="v86-status" id="v86Status"></div>
        <div id="v86Screen" style="width:100%;"></div>
        <div class="v86-action-row" id="v86ActionRow" style="display:none;">
          <button class="v86-action-btn" id="v86FullscreenBtn">⛶ ملء الشاشة</button>
          <button class="v86-action-btn" id="v86SaveBtn">💾 حفظ الحالة</button>
          <button class="v86-action-btn" id="v86LoadBtn" style="display:none;">📂 استعادة الحالة</button>
          <button class="v86-action-btn" id="v86ResetBtn">🔄 إعادة تشغيل</button>
          <button class="v86-action-btn danger" id="v86StopBtn">⏹ وقف</button>
        </div>
      </div>
    </div>
  `;

  const fileChosen   = container.querySelector('#v86FileChosen');
  const statusEl     = container.querySelector('#v86Status');
  const screenWrap   = container.querySelector('#v86ScreenWrap');
  const screenDiv    = container.querySelector('#v86Screen');
  const actionRow    = container.querySelector('#v86ActionRow');

  function getStatus(text, cls='') {
    statusEl.innerHTML = '';
    if (cls === 'progress') {
      const wrap = document.createElement('div'); wrap.className = 'v86-progress-wrap';
      const bar  = document.createElement('div'); bar.className  = 'v86-progress-bar'; bar.id = 'v86ProgBar';
      wrap.appendChild(bar); statusEl.appendChild(wrap);
    }
    const lbl = document.createElement('div'); lbl.className = 'v86-progress-lbl'; lbl.textContent = text;
    statusEl.appendChild(lbl);
    return { bar: container.querySelector('#v86ProgBar'), lbl };
  }

  let emulator = null;
  let bootedFromHda = false;
  let hdaSaved = null;  // ArrayBuffer: حالة الـHDD بعد التثبيت

  function getRam() {
    const r = container.querySelector('input[name="v86Ram"]:checked');
    return parseInt(r ? r.value : '1024', 10);
  }

  function buildOptions(file, ram, fromHda, savedState) {
    const isInstaller = /installer/i.test(file ? file.name : '');
    const opts = {
      wasm_path:        v86BasePath + 'v86.wasm',
      screen_container: screenDiv,
      bios:    { url: v86BasePath + 'seabios.bin' },
      vga_bios:{ url: v86BasePath + 'vgabios.bin' },
      memory_size:     ram * 1024 * 1024,
      vga_memory_size: 16 * 1024 * 1024,
      acpi: true,
      autostart: true,
    };
    if (fromHda && savedState) {
      // بعد التثبيت: نشغّل من الـHDD مباشرة بالحالة المحفوظة
      opts.hda            = { buffer: savedState };
      opts.boot_order     = 786; // HDD أول
      opts.initial_state  = { buffer: savedState };
    } else {
      // أول تشغيل: من الـcdrom
      opts.cdrom      = { buffer: file };
      opts.boot_order = 291; // cdrom أول
      // HDD افتراضي: 20GB للـinstaller أو 8GB للـlive
      const hddR = container.querySelector('input[name="v86Hdd"]:checked');
      const hddGB = parseInt(hddR ? hddR.value : '20', 10);
      opts.hda = { size: hddGB * 1024 * 1024 * 1024 };
    }
    return opts;
  }

  async function launchVM(file, ram, fromHda, savedState) {
    // نضيف hidden input لـv86 عشان يعمل screen container صح
    screenDiv.innerHTML = '';
    if (emulator) { try { emulator.stop(); emulator.destroy(); } catch(e){} emulator = null; }

    const { lbl, bar } = getStatus('⏳ جاري تهيئة المحرك...', 'progress');
    screenWrap.style.display = 'flex';
    actionRow.style.display = 'none';

    if (typeof V86 === 'undefined') {
      lbl.textContent = '⚠️ محرك v86 غير موجود. راجع assets/v86/README.txt.';
      return;
    }

    let bootTimeout = setTimeout(() => {
      lbl.textContent = '⚠️ المحرك مش بيستجيب. ممكن الملف مش صالح أو الذاكرة أقل من اللازم.';
    }, 120000);

    try {
      emulator = new V86(buildOptions(file, ram, fromHda, savedState));
    } catch(e) {
      clearTimeout(bootTimeout);
      lbl.textContent = '❌ فشل التشغيل: ' + e.message;
      return;
    }

    emulator.add_listener('download-progress', (e) => {
      if (!e.total) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      if (bar) bar.style.width = pct + '%';
      lbl.textContent = `⬇️ جاري تحميل... ${pct}%`;
    });

    emulator.add_listener('emulator-ready', () => {
      clearTimeout(bootTimeout);
      if (bar && bar.parentElement) bar.parentElement.style.display = 'none';
      lbl.textContent = fromHda
        ? '✅ النظام المثبّت شغال — ابدأ الكتابة'
        : '✅ جاهز — النظام بيشتغل الآن';
      actionRow.style.display = 'flex';
      localStorage.setItem('kaliFile', file ? file.name : 'hda-boot');
      if (window.PSProgress && window.PSProgress.markKaliBooted) window.PSProgress.markKaliBooted();
    });

    // الحدث الأهم: لما الـInstaller يخلص ويعمل reboot
    emulator.add_listener('emulator-stopped', async () => {
      if (bootedFromHda) return; // ما نكررش
      bootedFromHda = true;
      clearTimeout(bootTimeout);
      lbl.textContent = '💾 اكتمل التثبيت — جاري التحضير للإقلاع من القرص...';
      actionRow.style.display = 'none';
      try {
        hdaSaved = await emulator.save_state();
        await launchVM(file, ram, true, hdaSaved);
      } catch(e) {
        // لو save_state فشل، نجرب eject cdrom وrestart عادي
        lbl.textContent = '🔄 جاري الإقلاع من القرص...';
        try { emulator.eject_cdrom(); } catch(e2){}
        emulator.restart();
        bootedFromHda = false; // نديه فرصة تانية
      }
    });
  }

  // --- file picker ---
  container.querySelector('#v86IsoPicker').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileChosen.style.color = '';
    fileChosen.textContent = `📀 ${file.name} (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB)`;
    const ram = getRam();
    bootedFromHda = false;
    hdaSaved = null;
    launchVM(file, ram, false, null);
  });

  // --- أزرار التحكم ---
  container.querySelector('#v86FullscreenBtn').addEventListener('click', () => {
    if (emulator) emulator.screen_go_fullscreen();
  });

  // حفظ الحالة: بيخزن snapshot للنظام كله في الذاكرة (مش على ملف — ده تقني متاح)
  container.querySelector('#v86SaveBtn').addEventListener('click', async () => {
    if (!emulator) return;
    const btn = container.querySelector('#v86SaveBtn');
    btn.textContent = '⏳ جاري الحفظ...'; btn.disabled = true;
    try {
      hdaSaved = await emulator.save_state();
      btn.textContent = '✅ اتحفظ'; btn.disabled = false;
      container.querySelector('#v86LoadBtn').style.display = 'inline-block';
    } catch(e) {
      btn.textContent = '❌ فشل الحفظ'; btn.disabled = false;
    }
  });

  // استعادة الحالة المحفوظة
  container.querySelector('#v86LoadBtn').addEventListener('click', async () => {
    if (!emulator || !hdaSaved) return;
    try { await emulator.restore_state(hdaSaved); } catch(e) {}
  });
  container.querySelector('#v86ResetBtn').addEventListener('click', () => {
    if (emulator) { bootedFromHda = false; hdaSaved = null; emulator.restart(); }
  });
  container.querySelector('#v86StopBtn').addEventListener('click', () => {
    if (emulator) { emulator.stop(); actionRow.style.display = 'none'; }
  });
}

window.V86Kudosk = { checkV86Capability, mountV86Boot };
