@echo off
chcp 65001 >nul

echo ============================================
echo   Kudosk - تثبيت بيئة Kali Linux عبر WSL
echo ============================================
echo هيتطلب صلاحيات المسؤول (Admin)
pause

wsl --install kali-linux
if %ERRORLEVEL% NEQ 0 (
  echo حصلت مشكلة في التثبيت ❌
  start "" "%~dp0success.html?component=kali&status=fail"
  pause
  exit /b 1
)

echo.
echo ✅ خلصنا. ممكن يطلب إعادة تشغيل الجهاز.
echo بعد إعادة التشغيل، افتح "Kali Linux" من قائمة ابدأ.
start "" "%~dp0success.html?component=kali&status=ok"
pause
