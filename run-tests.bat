@echo off
echo Iniciando backend...
start /min cmd /c "cd /d C:\Users\KEIKO\GUIMARAES\backend && node server.js"
timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start /min cmd /c "cd /d C:\Users\KEIKO\GUIMARAES\frontend && npm run dev"
timeout /t 10 /nobreak >nul

echo Verificando servidores...
curl -s -o nul -w "Backend: %%{http_code}\n" http://localhost:3001/api/products
curl -s -o nul -w "Frontend: %%{http_code}\n" http://localhost:3000

echo Executando testes...
cd /d C:\Users\KEIKO\GUIMARAES\backend
node test-frontend.js

echo.
echo Testes concluidos!
pause
