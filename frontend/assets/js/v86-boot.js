// ============================================
// تشغيل Kali Linux حقيقي جوه المتصفح (v86) — من ملف ISO المستخدم نفسه،
// 100% أوفلاين، مفيش fetch ولا رفع لأي سيرفر.
// الموقع بيعمل فحص تلقائي لإمكانيات الجهاز (مساحة تخزين + رامات متاحة)
// قبل ما يعرض خيار "تثبيت نظام حقيقي"، وبيستخدمه full/ (PC) و light/ (موبايل) مع بعض.
// ============================================

// الحد الأدنى المعقول عشان نظام زي Kali يشتغل بشكل مقبول
const V86_MIN_STORAGE_GB = 20;
const V86_MIN_RAM_GB = 2; // تقديري - navigator.deviceMemory مش مدعومة في كل المتصفحات

async function checkV86Capability() {
  const result = { capable: false, storageGB: null, deviceMemoryGB: null, reasons: [] };

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { quota } = await navigator.storage.estimate();
      result.storageGB = quota ? +(quota / 1024 / 1024 / 1024).toFixed(1) : null;
    } catch { /* تجاهل */ }
  }
  // deviceMemory متاحة بس في متصفحات Chromium-based، لو مش متاحة منفترضش إنها مشكلة
  result.deviceMemoryGB = navigator.deviceMemory || null;

  if (result.storageGB !== null && result.storageGB < V86_MIN_STORAGE_GB) {
    result.reasons.push(`مساحة التخزين المتاحة (${result.storageGB}GB) أقل من ${V86_MIN_STORAGE_GB}GB المطلوبة.`);
  }
  if (result.deviceMemoryGB !== null && result.deviceMemoryGB < V86_MIN_RAM_GB) {
    result.reasons.push(`رامات الجهاز (${result.deviceMemoryGB}GB) أقل من ${V86_MIN_RAM_GB}GB الموصى بيها.`);
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
