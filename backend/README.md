# Velodesk WhatsApp Backend

Backend Node.js para integração do WhatsApp Web com o sistema Velodesk usando `whatsapp-web.js`.

## 📋 Requisitos

- Node.js 16+ 
- npm ou yarn

## 🚀 Instalação

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

## ▶️ Como Executar

### Modo Desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo Produção:
```bash
npm start
```

O servidor iniciará na porta **3000** (ou na porta definida na variável de ambiente `PORT`).

## 📡 Endpoints da API

### 1. Status da Conexão
```
GET /api/whatsapp/status
```

Retorna o status da conexão do WhatsApp Web.

**Resposta:**
```json
{
  "connected": true,
  "hasQRCode": false,
  "qrCode": null
}
```

### 2. Obter QR Code
```
GET /api/whatsapp/qrcode
```

Retorna o QR Code para conexão (quando disponível).

**Resposta:**
```json
{
  "qrCode": "código_do_qr",
  "connected": false
}
```

### 3. Listar Conversas
```
GET /api/whatsapp/conversations
```

Retorna todas as conversas do WhatsApp.

**Resposta:**
```json
[
  {
    "id": "5511999999999@c.us",
    "name": "João Silva",
    "phone": "5511999999999",
    "lastMessage": "Olá!",
    "lastMessageTime": "2024-01-01T12:00:00.000Z",
    "unread": 2,
    "isGroup": false
  }
]
```

### 4. Mensagens de uma Conversa
```
GET /api/whatsapp/conversations/:id/messages
```

Retorna as mensagens de uma conversa específica.

**Parâmetros:**
- `id`: ID da conversa (ex: `5511999999999@c.us`)

**Resposta:**
```json
[
  {
    "id": "message_id",
    "text": "Olá!",
    "sender": "them",
    "time": "2024-01-01T12:00:00.000Z",
    "from": "5511999999999@c.us",
    "fromMe": false
  }
]
```

### 5. Enviar Mensagem
```
POST /api/whatsapp/send-message
```

Envia uma mensagem para uma conversa.

**Body:**
```json
{
  "conversationId": "5511999999999@c.us",
  "message": "Olá! Como posso ajudar?"
}
```

**Resposta:**
```json
{
  "success": true,
  "messageId": "message_id",
  "message": "Mensagem enviada com sucesso"
}
```

### 6. Recarregar Conversas
```
POST /api/whatsapp/reload-conversations
```

Força o recarregamento da lista de conversas.

**Resposta:**
```json
{
  "success": true,
  "count": 10,
  "message": "Conversas recarregadas com sucesso"
}
```

### 7. Informações do Cliente
```
GET /api/whatsapp/info
```

Retorna informações sobre o WhatsApp conectado.

**Resposta:**
```json
{
  "connected": true,
  "info": {
    "wid": "5511999999999@c.us",
    "pushname": "Meu Nome",
    "platform": "android"
  }
}
```

### 8. Health Check
```
GET /health
```

Verifica se o servidor está rodando.

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend (opcional):

```env
PORT=3000
```

## 📝 Como Funciona

1. **Inicialização**: Ao iniciar o servidor, o WhatsApp Web é inicializado automaticamente.

2. **QR Code**: Na primeira execução (ou após desconexão), um QR Code é gerado e exibido no terminal. Você também pode obter via API.

3. **Conexão**: Escaneie o QR Code com seu WhatsApp para conectar.

4. **Sincronização**: Após conectar, as conversas são carregadas automaticamente.

5. **Mensagens**: O sistema escuta novas mensagens e atualiza o cache automaticamente.

## ⚠️ Notas Importantes

- **Autenticação Local**: O sistema usa `LocalAuth` que salva a sessão em `.wwebjs_auth/`. Não é necessário escanear o QR Code toda vez após a primeira conexão.

- **Cache**: As conversas e mensagens são mantidas em cache para melhor performance. Use o endpoint de recarregamento se necessário.

- **Limite de Mensagens**: Por padrão, são carregadas as últimas 50 mensagens de cada conversa.

- **Puppeteer**: O sistema usa Puppeteer para controlar o WhatsApp Web. Certifique-se de ter todas as dependências do Chromium instaladas.

## 🐛 Troubleshooting

### Erro ao instalar dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### WhatsApp não conecta
- Verifique se o QR Code foi escaneado corretamente
- Tente deletar a pasta `.wwebjs_auth/` e reconectar
- Verifique os logs do servidor para mais detalhes

### Porta já em uso
```bash
# Altere a porta no .env ou diretamente no código
PORT=3001 npm start
```

## 📚 Documentação Adicional

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Express.js](https://expressjs.com/)

## 🔒 Segurança

⚠️ **IMPORTANTE**: Este backend é para uso em desenvolvimento/testes. Para produção:

- Adicione autenticação (JWT, API keys)
- Use HTTPS
- Implemente rate limiting
- Adicione validação de entrada
- Configure CORS adequadamente
- Use variáveis de ambiente para dados sensíveis

## 📄 Licença

ISC


