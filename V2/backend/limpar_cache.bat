@echo off
echo ========================================
echo   Limpando cache do WhatsApp Web
echo ========================================
echo.
echo IMPORTANTE: Pare o servidor primeiro (Ctrl+C)!
echo.
pause

echo.
echo Fechando processos do Chrome/Puppeteer...
taskkill /F /IM chrome.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Removendo cache...
if exist .wwebjs_auth (
    rmdir /s /q .wwebjs_auth
    echo Cache .wwebjs_auth removido!
) else (
    echo Cache .wwebjs_auth nao encontrado.
)

if exist .wwebjs_cache (
    rmdir /s /q .wwebjs_cache
    echo Cache .wwebjs_cache removido!
) else (
    echo Cache .wwebjs_cache nao encontrado.
)

echo.
echo ========================================
echo   Cache limpo com sucesso!
echo ========================================
echo.
echo Agora voce pode iniciar o servidor novamente:
echo   npm start
echo.
pause


