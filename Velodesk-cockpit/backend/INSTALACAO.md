# 🚀 Guia Rápido de Instalação

## Passo a Passo

### 1. Instalar Node.js
Se você ainda não tem o Node.js instalado:
- Baixe em: https://nodejs.org/
- Instale a versão LTS (recomendado)

### 2. Instalar Dependências
Abra o terminal na pasta `backend` e execute:

```bash
npm install
```

### 3. Iniciar o Servidor

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Ou manualmente:**
```bash
npm start
```

### 4. Conectar WhatsApp

1. O servidor iniciará e mostrará um QR Code no terminal
2. Abra o WhatsApp no seu celular
3. Vá em **Configurações > Aparelhos conectados > Conectar um aparelho**
4. Escaneie o QR Code que aparece no terminal
5. Aguarde a mensagem: "WhatsApp Web conectado e pronto!"

### 5. Usar no Frontend

1. Abra o `index.html` no navegador
2. Vá para a aba **Chat**
3. Clique em **"Verificar Conexão"**
4. As conversas do WhatsApp aparecerão automaticamente!

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
rm -rf node_modules
npm install
```

### QR Code não aparece
- Verifique se o terminal tem espaço suficiente
- Tente deletar a pasta `.wwebjs_auth/` e reconectar

### Porta 3000 já em uso
- Feche outros programas usando a porta 3000
- Ou altere a porta no arquivo `.env`

### WhatsApp não conecta
- Certifique-se de ter internet
- Tente deletar `.wwebjs_auth/` e reconectar
- Verifique os logs no terminal

## 📝 Próximos Passos

Após conectar:
- As conversas aparecerão automaticamente na aba Chat
- Você pode enviar e receber mensagens
- As mensagens são sincronizadas em tempo real

## 🔧 Comandos Úteis

```bash
# Iniciar em modo desenvolvimento (com auto-reload)
npm run dev

# Verificar se o servidor está rodando
curl http://localhost:3000/health

# Ver status do WhatsApp
curl http://localhost:3000/api/whatsapp/status
```

