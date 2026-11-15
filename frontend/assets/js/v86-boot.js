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
function mountV86Boot(container, { v86BasePath = '../assets/v86/', defaultRam = 512 } = {}) {
  let selectedRam = defaultRam;

  container.innerHTML = `
    <div class="v86-boot">
      <div class="v86-ram-row">
        <button class="v86-ram-opt active" data-ram="512">512MB</button>
        <button class="v86-ram-opt" data-ram="1024">1GB</button>
        <button class="v86-ram-opt" data-ram="2048">2GB</button>
      </div>
      <label class="v86-pick-btn" for="v86IsoPicker">📂 اختار ملف Kali ISO من جهازك</label>
      <input type="file" id="v86IsoPicker" accept=".iso" style="display:none;">
      <div class="v86-file-chosen" id="v86FileChosen"></div>
      <div class="v86-status" id="v86Status"></div>
      <div class="v86-screen" id="v86Screen" style="display:none;"></div>
    </div>
  `;

  container.querySelectorAll('.v86-ram-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.v86-ram-opt').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRam = parseInt(btn.dataset.ram, 10);
    });
  });

  const picker = container.querySelector('#v86IsoPicker');
  const fileChosen = container.querySelector('#v86FileChosen');
  const status = container.querySelector('#v86Status');
  const screen = container.querySelector('#v86Screen');

  picker.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileChosen.textContent = `📄 ${file.name} (${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB)`;

    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
    if (typeof V86 === 'undefined') {
      status.textContent = '⚠️ محرك v86 مش متاح. راجع assets/v86/README.txt.';
      return;
    }

    status.textContent = 'بيشغّل...';
    screen.style.display = 'flex';

    const emulator = new V86({
      screen_container: screen,
      bios: { url: v86BasePath + 'seabios.bin' },
      vga_bios: { url: v86BasePath + 'vgabios.bin' },
      cdrom: { url: URL.createObjectURL(file) },
      hda: { size: 20 * 1024 * 1024 * 1024, async: true },
      memory_size: selectedRam * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      autostart: true,
    });

    localStorage.setItem('kaliFile', file.name);
    if (window.PSProgress && window.PSProgress.markKaliBooted) window.PSProgress.markKaliBooted();

    emulator.add_listener('emulator-ready', () => { status.textContent = '✅ شغال'; });
    return emulator;
  });
}

window.V86Kudosk = { checkV86Capability, mountV86Boot };
