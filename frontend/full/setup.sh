#!/data/data/com.termux/files/usr/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  Kudosk - تثبيت بيئة Kali Linux على Termux"
echo "============================================"
echo "محتاج تطبيق Termux متثبت من F-Droid الأول"
echo ""

pkg update -y && pkg upgrade -y
pkg install proot-distro -y

if proot-distro install kali; then
  echo ""
  echo "✅ خلصنا! شغّل Kali بالأمر:"
  echo "   proot-distro login kali"
  STATUS="ok"
else
  echo "❌ حصلت مشكلة في التثبيت"
  STATUS="fail"
fi

RESULT_FILE="file://$SCRIPT_DIR/success.html?component=kali&status=$STATUS"
if command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "$RESULT_FILE"
else
  echo ""
  echo "افتح الملف ده في المتصفح عشان تشوف النتيجة:"
  echo "$RESULT_FILE"
fi
