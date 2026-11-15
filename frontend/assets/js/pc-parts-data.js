// ============================================
// بيانات وأيقونات قطع الـPC - مشتركة بين "المهمة الأولى" (pcbuild.js)
// و"الفري روم" (freeroom.js) عشان مانكررش نفس الحاجة مرتين.
// الأيقونات SVG مرسومة يدويًا (مش صور حقيقية من مواقع تانية) بتصميم
// مسطّح (Flat Design) يناسب هوية المنصة ومفيهاش حقوق ملكية لحد.
// ============================================

const PC_PARTS = [
  { id: 'cpu', label: 'المعالج (CPU)', top: 14, left: 38, note: 'عقل الجهاز — بينفّذ كل التعليمات والحسابات.' },
  { id: 'ram', label: 'الرام (RAM)', top: 14, left: 64, note: 'ذاكرة مؤقتة سريعة — بتخزن اللي الجهاز شغال عليه دلوقتي.' },
  { id: 'gpu', label: 'كارت الشاشة (GPU)', top: 46, left: 38, note: 'مسؤول عن معالجة الرسومات والصور على الشاشة.' },
  { id: 'storage', label: 'التخزين (SSD)', top: 46, left: 64, note: 'بيخزن ملفاتك ونظام التشغيل بشكل دائم — وفعلًا عليه بالفعل نظام التشغيل KudoskOS متثبت من المصنع.' },
  { id: 'psu', label: 'الباور سبلاي (PSU)', top: 76, left: 38, note: 'بيحوّل الكهرباء من المقبس لطاقة تقدر كل الأجزاء تستخدمها.' },
  { id: 'fan', label: 'المروحة (Cooling Fan)', top: 76, left: 64, note: 'بتبرّد الجهاز عشان الحرارة العالية ما تتلفش الأجزاء الحساسة.' },
];

// أيقونات مرسومة (flat-design) بدل الإيموجي - كل قطعة بلون مميز ليها
const PC_PART_SVG = {
  cpu: `<svg viewBox="0 0 64 64" width="30" height="30">
    <rect x="10" y="10" width="44" height="44" rx="4" fill="#241f3d" stroke="#7c5cff" stroke-width="2.2"/>
    <rect x="21" y="21" width="22" height="22" rx="2" fill="#7c5cff"/>
    <g stroke="#9b8cff" stroke-width="2">
      <line x1="5" y1="18" x2="10" y2="18"/><line x1="5" y1="28" x2="10" y2="28"/><line x1="5" y1="38" x2="10" y2="38"/><line x1="5" y1="48" x2="10" y2="48"/>
      <line x1="54" y1="18" x2="59" y2="18"/><line x1="54" y1="28" x2="59" y2="28"/><line x1="54" y1="38" x2="59" y2="38"/><line x1="54" y1="48" x2="59" y2="48"/>
      <line x1="18" y1="5" x2="18" y2="10"/><line x1="28" y1="5" x2="28" y2="10"/><line x1="38" y1="5" x2="38" y2="10"/><line x1="48" y1="5" x2="48" y2="10"/>
      <line x1="18" y1="54" x2="18" y2="59"/><line x1="28" y1="54" x2="28" y2="59"/><line x1="38" y1="54" x2="38" y2="59"/><line x1="48" y1="54" x2="48" y2="59"/>
    </g>
  </svg>`,
  ram: `<svg viewBox="0 0 64 64" width="30" height="30">
    <rect x="5" y="16" width="54" height="30" rx="3" fill="#122f35" stroke="#22d3ee" stroke-width="2.2"/>
    <rect x="22" y="16" width="7" height="10" fill="#0b0c0f"/>
    <rect x="9" y="40" width="46" height="8" fill="#0a2024"/>
    <g fill="#22d3ee">
      <rect x="12" y="42" width="3" height="5"/><rect x="18" y="42" width="3" height="5"/><rect x="24" y="42" width="3" height="5"/>
      <rect x="30" y="42" width="3" height="5"/><rect x="36" y="42" width="3" height="5"/><rect x="42" y="42" width="3" height="5"/><rect x="48" y="42" width="3" height="5"/>
    </g>
  </svg>`,
  gpu: `<svg viewBox="0 0 64 64" width="30" height="30">
    <rect x="3" y="15" width="58" height="30" rx="4" fill="#2a1420" stroke="#f472b6" stroke-width="2.2"/>
    <circle cx="20" cy="30" r="9" fill="#1a0c14" stroke="#f472b6" stroke-width="1.6"/>
    <circle cx="44" cy="30" r="9" fill="#1a0c14" stroke="#f472b6" stroke-width="1.6"/>
    <circle cx="20" cy="30" r="2.5" fill="#f472b6"/><circle cx="44" cy="30" r="2.5" fill="#f472b6"/>
    <rect x="1" y="41" width="10" height="6" rx="1" fill="#555"/>
  </svg>`,
  storage: `<svg viewBox="0 0 64 64" width="30" height="30">
    <rect x="11" y="9" width="42" height="46" rx="4" fill="#0e2b22" stroke="#34d399" stroke-width="2.2"/>
    <rect x="18" y="20" width="28" height="4" rx="2" fill="#34d399"/>
    <rect x="18" y="29" width="18" height="3" rx="1.5" fill="#1d6d50"/>
    <circle cx="42" cy="44" r="3.4" fill="#34d399"/>
  </svg>`,
  psu: `<svg viewBox="0 0 64 64" width="30" height="30">
    <rect x="7" y="8" width="50" height="48" rx="4" fill="#2a2110" stroke="#f59e0b" stroke-width="2.2"/>
    <g fill="#f59e0b" opacity=".85">
      <circle cx="18" cy="20" r="2"/><circle cx="27" cy="20" r="2"/><circle cx="36" cy="20" r="2"/><circle cx="45" cy="20" r="2"/>
      <circle cx="18" cy="29" r="2"/><circle cx="27" cy="29" r="2"/><circle cx="36" cy="29" r="2"/><circle cx="45" cy="29" r="2"/>
      <circle cx="18" cy="38" r="2"/><circle cx="27" cy="38" r="2"/><circle cx="36" cy="38" r="2"/><circle cx="45" cy="38" r="2"/>
    </g>
    <rect x="16" y="46" width="32" height="6" rx="2" fill="#f59e0b"/>
  </svg>`,
  fan: `<svg viewBox="0 0 64 64" width="30" height="30">
    <circle cx="32" cy="32" r="26" fill="#0e2230" stroke="#38bdf8" stroke-width="2.2"/>
    <g fill="#38bdf8">
      <path d="M32 32 L32 9 A23 23 0 0 1 51 21 Z"/>
      <path d="M32 32 L51 21 A23 23 0 0 1 51 43 Z"/>
      <path d="M32 32 L51 43 A23 23 0 0 1 32 55 Z"/>
      <path d="M32 32 L32 55 A23 23 0 0 1 13 43 Z"/>
      <path d="M32 32 L13 43 A23 23 0 0 1 13 21 Z"/>
      <path d="M32 32 L13 21 A23 23 0 0 1 32 9 Z"/>
    </g>
    <circle cx="32" cy="32" r="6.5" fill="#0e2230" stroke="#38bdf8" stroke-width="2.2"/>
  </svg>`,
};
