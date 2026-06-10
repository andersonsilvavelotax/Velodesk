@echo off
echo ========================================
echo Configurando Repositorio Git - Velodesk
echo ========================================
echo.

cd /d "%~dp0"

echo [1/7] Inicializando repositorio Git...
git init
if %errorlevel% neq 0 (
    echo ERRO: Git nao encontrado. Por favor, instale o Git primeiro.
    pause
    exit /b 1
)

echo [2/7] Adicionando arquivos ao Git...
git add .

echo [3/7] Fazendo commit inicial...
git commit -m "first commit"

echo [4/7] Configurando branch principal como main...
git branch -M main

echo [5/7] Adicionando remote origin...
git remote add origin https://github.com/andersonsilvavelotax/Velodesk.git

echo [6/7] Fazendo push para o repositorio...
git push -u origin main

echo.
echo ========================================
echo Configuracao concluida!
echo ========================================
pause

