@echo off
echo ======================================
echo    DIVA Virtual Try-On
echo ======================================
echo.
cd /d "%~dp0"
echo Iniciando servidor...
echo.
start http://localhost:3000
npm run dev
pause
