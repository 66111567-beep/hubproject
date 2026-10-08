@echo off
chcp 65001 >nul
echo ========================================================
echo   ระบบอัพโหลดโค้ดขึ้น GitHub (66111567-beep/hubproject)
echo ========================================================
echo.

echo [1/3] ตรวจสอบสถานะ Git...
git status
echo.

echo [2/3] กำลัง Push ขึ้น GitHub Branch main...
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   [สำเร็จ] อัพโหลดโค้ดขึ้น GitHub เรียบร้อยแล้ว!
    echo   URL: https://github.com/66111567-beep/hubproject
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [แจ้งเตือน] ไม่สามารถ Push ได้เนื่องจากสิทธิ์ GitHub
    echo   (Windows อาจจำบัญชี GitHub อื่นอยู่)
    echo ========================================================
    echo.
    echo หากต้องการใช้ GitHub Personal Access Token (PAT):
    set /p GITHUB_TOKEN="วาง GitHub Token ของคุณที่นี่ (หรือกด Enter เพื่อข้าม): "
    if not "%GITHUB_TOKEN%"=="" (
        git push https://%GITHUB_TOKEN%@github.com/66111567-beep/hubproject.git main
    )
)

echo.
pause
