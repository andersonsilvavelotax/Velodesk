@echo off
title Velodesk Lab - porta 8767
cd /d "%~dp0"

set PORT=8767
set URL=http://localhost:%PORT%

echo.
echo  ========================================
echo   Velodesk Lab - sandbox de testes
echo   %URL%
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    echo.
    pause
    exit /b 1
)

powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue; if ($c) { exit 0 } else { exit 1 }"
if %errorlevel%==0 (
    echo Servidor ja ativo na porta %PORT%.
    echo Abrindo navegador...
    start "" "%URL%"
    echo.
    echo Se a pagina nao carregar, feche outros servidores e rode este script de novo.
    pause
    exit /b 0
)

echo Iniciando servidor na porta %PORT%...
echo Nao feche esta janela enquanto estiver testando.
echo.

start "" "%URL%"

npx --yes serve -l %PORT% .

if errorlevel 1 (
    echo.
    echo [ERRO] Nao foi possivel iniciar na porta %PORT%.
    echo Verifique se outro programa usa essa porta.
    pause
    exit /b 1
)
