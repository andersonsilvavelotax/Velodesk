@echo off
chcp 65001 >nul
title Velodesk Cockpit — porta 8768
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

echo.
echo  Velodesk Cockpit — copiloto operacional
echo  URL: http://localhost:8768
echo.

netstat -ano | findstr ":8768 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Servidor ja ativo na porta 8768
) else (
    start "Velodesk Cockpit" cmd /c "npx --yes serve -l 8768"
    timeout /t 2 /nobreak >nul
)

start "" "http://localhost:8768/?desk=v2"
echo Abrindo navegador...
echo Pressione Ctrl+C para encerrar esta janela.
pause
