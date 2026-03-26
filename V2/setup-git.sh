#!/bin/bash

echo "========================================"
echo "Configurando Repositório Git - Velodesk"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "[1/7] Inicializando repositório Git..."
git init
if [ $? -ne 0 ]; then
    echo "ERRO: Git não encontrado. Por favor, instale o Git primeiro."
    exit 1
fi

echo "[2/7] Adicionando arquivos ao Git..."
git add .

echo "[3/7] Fazendo commit inicial..."
git commit -m "first commit"

echo "[4/7] Configurando branch principal como main..."
git branch -M main

echo "[5/7] Adicionando remote origin..."
git remote add origin https://github.com/andersonsilvavelotax/Velodesk.git

echo "[6/7] Fazendo push para o repositório..."
git push -u origin main

echo ""
echo "========================================"
echo "Configuração concluída!"
echo "========================================"

