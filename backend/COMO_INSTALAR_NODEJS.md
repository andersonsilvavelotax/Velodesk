# 📦 Como Instalar Node.js

## Para Windows

### Opção 1: Instalador Oficial (Recomendado)

1. **Baixe o Node.js:**
   - Acesse: https://nodejs.org/
   - Baixe a versão **LTS** (Long Term Support)
   - Escolha o instalador para Windows (.msi)

2. **Instale:**
   - Execute o arquivo baixado
   - Siga o assistente de instalação
   - **IMPORTANTE:** Marque a opção "Add to PATH" se aparecer
   - Clique em "Install"

3. **Verifique a instalação:**
   - Abra um novo terminal (PowerShell ou CMD)
   - Execute:
   ```bash
   node --version
   npm --version
   ```
   - Deve mostrar as versões instaladas

### Opção 2: Via Chocolatey (se você tem Chocolatey)

```bash
choco install nodejs
```

### Opção 3: Via Winget (Windows 10/11)

```bash
winget install OpenJS.NodeJS.LTS
```

## Após Instalar

1. **Feche e reabra o terminal** (importante!)
2. **Navegue até a pasta do backend:**
   ```bash
   cd "C:\Users\velot\Desktop\Projeto Velodesk\V2\backend"
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor:**
   ```bash
   npm start
   ```

## ⚠️ Problemas Comuns

### "npm não é reconhecido"
- **Solução:** Feche e reabra o terminal após instalar o Node.js
- Ou reinicie o computador
- Verifique se o Node.js foi adicionado ao PATH

### Verificar se está no PATH
1. Abra "Variáveis de Ambiente" no Windows
2. Verifique se `C:\Program Files\nodejs\` está no PATH
3. Se não estiver, adicione manualmente

## ✅ Verificação Rápida

Execute estes comandos no terminal:

```bash
node --version    # Deve mostrar algo como: v18.17.0
npm --version     # Deve mostrar algo como: 9.6.7
```

Se ambos funcionarem, você está pronto para usar!


