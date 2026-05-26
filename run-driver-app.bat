@echo off
cd /d "%~dp0driver-app"
echo Iniciando App do Entregador...
echo Acesse em: http://localhost:3003
echo.
npx vite
pause
