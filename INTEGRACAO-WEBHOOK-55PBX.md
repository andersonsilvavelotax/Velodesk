# 🔌 Integração Webhook 55PBX - Guia Completo

## 📋 **O que você precisa:**

1. **Acesso ao painel da 55PBX** (administrativo)
2. **Servidor web** com PHP (para o webhook-receiver.php)
3. **URL pública** para receber os webhooks

## 🚀 **Passo a Passo:**

### **1. Configurar o Servidor**

1. **Faça upload dos arquivos:**
   - `webhook-receiver.php` → Pasta raiz do seu site
   - `55pbx-webhook-config.json` → Para referência

2. **Teste se está funcionando:**
   - Acesse: `https://seudominio.com/webhook-receiver.php`
   - Deve aparecer: `{"error":"Method not allowed"}` (isso é normal!)

### **2. Configurar na 55PBX**

1. **Acesse o painel da 55PBX**
2. **Procure por:**
   - "Webhooks" ou "Integrações" ou "API"
   - "Notificações" ou "Eventos"
   - "Callbacks" ou "URLs de retorno"

3. **Adicione a URL do webhook:**
   ```
   https://seudominio.com/webhook-receiver.php
   ```

4. **Configure os eventos:**
   - ✅ Chamada entrante
   - ✅ Chamada atendida  
   - ✅ Chamada perdida
   - ✅ Chamada finalizada

### **3. Configurar os Dados**

A 55PBX precisa enviar os dados neste formato:

```json
{
  "event": "call.missed",
  "call_id": "12345",
  "from": "(11) 99999-9999",
  "to": "(11) 3333-4444",
  "direction": "incoming",
  "status": "missed",
  "duration": 0,
  "timestamp": "2024-01-15T14:30:00Z",
  "customer_name": "João Silva",
  "agent": "Maria Santos"
}
```

### **4. Testar a Integração**

1. **Faça uma chamada de teste** para o número da empresa
2. **Verifique o arquivo `webhook_log.txt`** - deve mostrar os webhooks recebidos
3. **Verifique o arquivo `phone_data.json`** - deve ter os dados da chamada
4. **Acesse o Velodesk** - deve aparecer a chamada na aba Telefonia

## 🔧 **Configurações Avançadas**

### **Criar Tickets Automaticamente**

No arquivo `webhook-receiver.php`, linha 67:
```php
if ($status === 'missed' && ($data['auto_create_tickets'] ?? true)) {
    // Código para criar ticket
}
```

### **Personalizar Categorias**

No arquivo `webhook-receiver.php`, linha 75:
```php
'category' => $data['default_category'] ?? 'suporte',
```

### **Adicionar Mais Dados**

Modifique o array `$phoneCall` no webhook-receiver.php para incluir mais informações da 55PBX.

## 🐛 **Solução de Problemas**

### **Webhook não está chegando:**
1. Verifique se a URL está correta
2. Teste com uma ferramenta como Postman
3. Verifique os logs da 55PBX
4. Confirme se o servidor aceita POST

### **Dados não aparecem no Velodesk:**
1. Verifique o arquivo `phone_data.json`
2. Confira o console do navegador (F12)
3. Verifique se o `loadWebhookData()` está sendo chamado

### **Tickets não são criados:**
1. Verifique se `auto_create_tickets` está true
2. Confirme se o arquivo `tickets_data.json` está sendo criado
3. Verifique as permissões de escrita no servidor

## 📞 **Eventos Suportados**

| Evento | Descrição | Ação no Velodesk |
|--------|-----------|------------------|
| `call.incoming` | Chamada entrante | Registra na lista |
| `call.answered` | Chamada atendida | Atualiza status |
| `call.missed` | Chamada perdida | Cria ticket automaticamente |
| `call.ended` | Chamada finalizada | Atualiza duração |

## 🔒 **Segurança**

Para maior segurança, adicione autenticação no webhook:

```php
// No início do webhook-receiver.php
$expectedToken = 'seu_token_secreto';
$receivedToken = $_SERVER['HTTP_X_WEBHOOK_TOKEN'] ?? '';

if ($receivedToken !== $expectedToken) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
```

## 📊 **Monitoramento**

- **Logs:** `webhook_log.txt`
- **Dados:** `phone_data.json`
- **Tickets:** `tickets_data.json`

## 🆘 **Suporte**

Se precisar de ajuda:
1. Verifique os logs primeiro
2. Teste com dados de exemplo
3. Confirme se a 55PBX está enviando no formato correto

---

**✅ Pronto!** Sua integração webhook está configurada e funcionando!

