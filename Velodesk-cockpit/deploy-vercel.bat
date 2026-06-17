@echo off
setlocal EnableExtensions

title Velodesk - Deploy Vercel

set "SOURCE=%~dp0"
set "DEPLOY=%TEMP%\velodesk-vercel-deploy"

echo.
echo  Projeto Velodesk - Deploy para Vercel
echo  =====================================
echo.

where npx >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js/npx nao encontrado. Instale o Node.js e tente novamente.
    pause
    exit /b 1
)

if not exist "%SOURCE%index.html" (
    echo [ERRO] index.html nao encontrado em %SOURCE%
    pause
    exit /b 1
)

echo [1/4] Preparando pasta temporaria...
if exist "%DEPLOY%" rmdir /s /q "%DEPLOY%"
mkdir "%DEPLOY%"

for %%F in (
    index.html
    styles.css
    login-simple-fixed.js
    seed-demo-tickets.js
    ticket-lateral-form.js
    velodesk-ecosystem.js
    velodesk-ecosystem.css
    seed-demo-data.js
    client-portal-data.js
    vercel.json
) do (
    if exist "%SOURCE%%%F" copy /y "%SOURCE%%%F" "%DEPLOY%\" >nul
)

if exist "%SOURCE%prototipo" xcopy /E /I /Y "%SOURCE%prototipo" "%DEPLOY%\prototipo\" >nul

echo [2/4] Vinculando ao projeto velodesk-v2...
pushd "%DEPLOY%"
call npx --yes vercel link --project velodesk-v2 --yes
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao vincular. Execute "npx vercel login" e tente de novo.
    popd
    pause
    exit /b 1
)

echo [3/4] Publicando em producao...
call npx --yes vercel --prod --yes --force
set "EXITCODE=%ERRORLEVEL%"
popd

if not "%EXITCODE%"=="0" (
    echo.
    echo [ERRO] Deploy falhou. Verifique o login na Vercel e sua conexao.
    pause
    exit /b 1
)

echo.
echo [4/4] Deploy concluido!
echo.
echo  URL: https://velodesk-v2.vercel.app
echo.
pause
exit /b 0
