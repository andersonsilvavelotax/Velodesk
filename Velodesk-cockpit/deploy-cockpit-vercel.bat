@echo off
setlocal EnableExtensions

title Velodesk Cockpit - Deploy provisorio (URL separada)

set "SOURCE=%~dp0"
set "PROJECT=velodesk-cockpit"
set "DEPLOY=%TEMP%\velodesk-cockpit-vercel"

echo.
echo  Velodesk Cockpit - Deploy provisorio na Vercel
echo  ==============================================
echo  Projeto NOVO: %PROJECT%
echo  NAO altera:   https://velodesk-v2.vercel.app
echo.

where npx >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js/npx nao encontrado.
    pause
    exit /b 1
)

if not exist "%SOURCE%index.html" (
    echo [ERRO] index.html nao encontrado.
    pause
    exit /b 1
)

echo [1/3] Preparando arquivos do Cockpit...
if exist "%DEPLOY%" rmdir /s /q "%DEPLOY%"
mkdir "%DEPLOY%"

for %%F in (
    index.html
    velodesk-crm.html
    styles.css
    velodesk-ecosystem.css
    velodesk-ecosystem.js
    velodesk-crm.css
    velodesk-crm.js
    velodesk-desk-v2.js
    cockpit.css
    cockpit-crm-ui.css
    cockpit-crm-ui.js
    velotax-theme.css
    cockpit-ux-enhancements.css
    cockpit-config.js
    cockpit-intelligence.js
    cockpit-supervisor.js
    cockpit-supervisor-ux.js
    cockpit-ux-enhancements.js
    cockpit-profiles.js
    login-simple-fixed.js
    seed-demo-tickets.js
    seed-demo-data.js
    client-portal-data.js
    ticket-lateral-form.js
    vercel.json
) do (
    if exist "%SOURCE%%%F" copy /y "%SOURCE%%%F" "%DEPLOY%\" >nul
)

echo [2/3] Vinculando ao projeto %PROJECT% (separado do velodesk-v2)...
pushd "%DEPLOY%"
call npx --yes vercel link --project %PROJECT% --yes
if errorlevel 1 (
    echo.
    echo [AVISO] Projeto ainda nao existe — criando na primeira publicacao...
)

echo [3/3] Publicando em producao...
call npx --yes vercel deploy --prod --yes --force
set "EXITCODE=%ERRORLEVEL%"
popd

if not "%EXITCODE%"=="0" (
    echo.
    echo [ERRO] Deploy falhou. Execute: npx vercel login
    pause
    exit /b 1
)

echo.
echo Deploy concluido!
echo.
echo  Cockpit (novo):  https://%PROJECT%.vercel.app
echo  Versao atual:    https://velodesk-v2.vercel.app  (intacta)
echo.
pause
exit /b 0
