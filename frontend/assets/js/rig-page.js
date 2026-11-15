// ============================================
// صفحة "جهازي" (Rig): متجر القطع + عرض الجهاز الحالي.
// القطع والـSVG جايين من pc-parts-data.js، ومنطق العملات/الترقية كله
// جوه progress.js (window.PSProgress) عشان يفضل مصدر واحد للحقيقة
// مرتبط بكل تقدم الطالب في المنصة كلها (بايثون + سايبر + كورسات).
// ============================================

const OS_META = { label: 'نظام التشغيل', icon: '💿' };

const board = document.getElementById('rigBoard');
const osRow = document.getElementById('rigOsRow');
const shopList = document.getElementById('rigShopList');
const coinsPill = document.getElementById('rigCoinsPill');
const powerEmoji = document.getElementById('rigPowerEmoji');
const powerLabel = document.getElementById('rigPowerLabel');
const powerBar = document.getElementById('rigPowerBar');
const powerHint = document.getElementById('rigPowerHint');

function partMetaOf(slot) {
  return PC_PARTS.find((p) => p.id === slot) || null;
}

function renderAll() {
  const P = window.PSProgress;
  const rig = P.getRig();
  const coins = P.getRigCoins();
  const power = P.getRigPower(rig);
  const tierInfo = P.getRigTierInfo(power);

  coinsPill.textContent = `🪙 ${coins}`;
  powerEmoji.textContent = tierInfo.emoji;
  powerLabel.textContent = `جهازك: ${tierInfo.label}`;

  const pct = Math.round((power / P.RIG_MAX_POWER) * 100);
  powerBar.style.width = pct + '%';
  powerBar.className = 'rig-power-bar-fill rig-tier-' + tierInfo.key;

  if (tierInfo.key === 'weak') {
    powerHint.textContent = 'جهازك لسه ضعيف 🐢 — بعض الأدوات المتقدمة (زي nmap في التيرمينال) مش هتشتغل غير لما ترقّي شوية.';
  } else if (tierInfo.key === 'mid') {
    powerHint.textContent = 'تمام! ⚙️ جهازك بقى متوسط — الأدوات الأساسية هتشتغل كويس. كمّل ترقية عشان توصل لجهاز قوي بالكامل 🚀';
  } else {
    powerHint.textContent = 'جهازك قوي 🚀 — كل أدوات المنصة شغالة بأعلى كفاءة من غير أي تحذير.';
  }

  renderBoard(rig);
  renderOsRow(rig);
  renderShop(rig, coins);
}

function tierBadgeHtml(tier) {
  const stars = '⭐'.repeat(tier);
  return `<span class="rig-tier-badge">${stars}</span>`;
}

function renderBoard(rig) {
  board.innerHTML = '';
  PC_PARTS.forEach((part) => {
    const slot = document.createElement('div');
    slot.className = 'q-slot filled';
    slot.style.top = part.top + '%';
    slot.style.left = part.left + '%';
    const tier = rig[part.id] || 1;
    slot.innerHTML = `
      <span class="pc-ic">${PC_PART_SVG[part.id]}</span>
      <span class="slot-label">${part.label}</span>
      ${tierBadgeHtml(tier)}
    `;
    board.appendChild(slot);
  });
}

function renderOsRow(rig) {
  const tier = rig.os || 1;
  const table = window.PSProgress.RIG_TIERS.os;
  const current = table.find((t) => t.tier === tier);
  osRow.innerHTML = `
    <span class="os-ic">${OS_META.icon}</span>
    <div style="flex:1;">
      <div class="os-title">${OS_META.label}</div>
      <div class="os-current">${current ? current.name : ''}</div>
    </div>
    ${tierBadgeHtml(tier)}
  `;
}

function renderShop(rig, coins) {
  shopList.innerHTML = '';
  const RIG_TIERS = window.PSProgress.RIG_TIERS;
  window.PSProgress.RIG_SLOTS.forEach((slot) => {
    const meta = partMetaOf(slot);
    const label = meta ? meta.label : OS_META.label;
    const iconHtml = meta ? PC_PART_SVG[slot] : `<span style="font-size:26px;">${OS_META.icon}</span>`;
    const table = RIG_TIERS[slot];
    const currentTier = rig[slot] || 1;
    const current = table.find((t) => t.tier === currentTier);
    const next = table.find((t) => t.tier === currentTier + 1);

    const row = document.createElement('div');
    row.className = 'rig-shop-row';
    row.innerHTML = `
      <span class="rig-shop-ic">${iconHtml}</span>
      <div class="rig-shop-info">
        <div class="rig-shop-label">${label}</div>
        <div class="rig-shop-current">دلوقتي: ${current ? current.name : '—'}</div>
      </div>
      <div class="rig-shop-action"></div>
    `;

    const actionWrap = row.querySelector('.rig-shop-action');
    if (!next) {
      actionWrap.innerHTML = `<span class="rig-maxed">🏆 أقصى مستوى</span>`;
    } else {
      const canAfford = coins >= next.cost;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'q-btn rig-buy-btn';
      btn.disabled = !canAfford;
      btn.innerHTML = `رقّي لـ${next.name}<br><span class="rig-buy-cost">🪙 ${next.cost}</span>`;
      btn.addEventListener('click', () => handleBuy(slot));
      actionWrap.appendChild(btn);
      if (!canAfford) {
        const need = document.createElement('div');
        need.className = 'rig-need-more';
        need.textContent = `محتاج ${next.cost - coins} 🪙 كمان`;
        actionWrap.appendChild(need);
      }
    }
    shopList.appendChild(row);
  });
}

function handleBuy(slot) {
  const result = window.PSProgress.buyRigPart(slot);
  if (!result.ok) {
    if (result.reason === 'not-enough') {
      flashMessage(`محتاج ${result.need} 🪙 كمان عشان تقدر ترقّي القطعة دي.`);
    } else if (result.reason === 'max-tier') {
      flashMessage('القطعة دي وصلت لأقصى مستوى بالفعل 🏆');
    }
    return;
  }
  renderAll();
  flashMessage(`✅ اترقّت لـ"${result.name}"! قوة جهازك دلوقتي ${result.power}.`, true);
}

function flashMessage(text, success) {
  powerHint.textContent = text;
  powerHint.style.color = success ? 'var(--accent2)' : 'var(--danger)';
  setTimeout(() => { powerHint.style.color = ''; renderAll(); }, 1800);
}

renderAll();
