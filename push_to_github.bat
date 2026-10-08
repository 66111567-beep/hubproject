@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "hubproject-main\.git" cd "hubproject-main"

echo ========================================================
echo   Upload to GitHub : 66111567-beep/hubproject
echo ========================================================
echo.

echo [1] Checking Git status...
git status
echo.

echo [2] Pushing to GitHub main branch...
git push origin main
if %ERRORLEVEL% equ 0 goto SUCCESS

echo.
echo ========================================================
echo   [Notice] Cannot push with default account
echo   (Windows may have cached another GitHub account)
echo ========================================================
echo.
echo Please enter your GitHub Personal Access Token (PAT):
set /p TOKEN="GitHub Token: "
if "%TOKEN%"=="" goto FAILED

echo.
echo Pushing with Token...
git push https://%TOKEN%@github.com/66111567-beep/hubproject.git main
if %ERRORLEVEL% equ 0 goto SUCCESS
goto FAILED

:SUCCESS
echo.
echo ========================================================
echo   [SUCCESS] Uploaded to GitHub successfully!
echo   URL: https://github.com/66111567-beep/hubproject
echo ========================================================
goto END

:FAILED
echo.
echo ========================================================
echo   [FAILED] Push failed. Please check your token or rights.
echo ========================================================
goto END

:END
echo.
pause
