@echo off
chcp 65001 >nul

echo ============================================
echo   Kudosk - تثبيت VS Code + الإضافات
echo ============================================

where winget >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo winget مش موجود على الجهاز ده. ثبّته من Microsoft Store
  echo (ابحث عن "App Installer"^) وبعدين شغّل الملف ده تاني.
  start "" "%~dp0success.html?component=ide&status=fail"
  pause
  exit /b 1
)

echo جاري تثبيت VS Code...
winget install -e --id Microsoft.VisualStudioCode --accept-package-agreements --accept-source-agreements

echo.
echo جاري تثبيت الإضافات من extensions.txt ...
for /f "usebackq delims=" %%e in ("%~dp0extensions.txt") do (
  set "line=%%e"
  setlocal enabledelayedexpansion
  set "trimmed=!line: =!"
  if not "!trimmed!"=="" if not "!trimmed:~0,1!"=="#" (
    echo   - تثبيت %%e
    code --install-extension %%e
  )
  endlocal
)

echo.
echo ✅ خلصنا! افتح VS Code وهتلاقي الإضافات متثبتة.
start "" "%~dp0success.html?component=ide&status=ok"
pause
