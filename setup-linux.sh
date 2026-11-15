#!/bin/bash
# ============================================
# سكريبت تجهيز بيئة العمل - مشروع Programming Science
# يعمل على: Ubuntu / Debian (أو WSL2 على ويندوز)
# شغّله بـ: bash setup-linux.sh
# ============================================

set -e

echo "🔄 تحديث النظام..."
sudo apt update && sudo apt upgrade -y

echo "📦 تثبيت الأدوات الأساسية..."
sudo apt install -y curl git build-essential unzip

# ---------- Node.js (عبر nvm عشان تتحكم في الإصدار) ----------
echo "⚙️ تثبيت Node.js (LTS) عبر nvm..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts

# ---------- PostgreSQL ----------
echo "🐘 تثبيت PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ---------- Docker (اختياري بس مفيد لو هتعزل البيئات) ----------
echo "🐳 تثبيت Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
fi

# ---------- VS Code ----------
echo "🧑‍💻 تثبيت VS Code..."
if ! command -v code &> /dev/null; then
  sudo snap install code --classic || echo "⚠️ لو snap مش متاح، نزّل VS Code يدوي من code.visualstudio.com"
fi

echo ""
echo "✅ خلصنا! الأدوات المتاحة دلوقتي:"
node -v 2>/dev/null && echo "   Node.js ⬆️"
npm -v 2>/dev/null && echo "   npm ⬆️"
git --version
psql --version 2>/dev/null
docker --version 2>/dev/null

echo ""
echo "📌 الخطوة الجاية:"
echo "   cd backend && npm install && npm start"
echo "   وبعدين افتح المتصفح على http://localhost:4000"
