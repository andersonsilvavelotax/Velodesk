# Guia de Envio de E-mails para Criação de Senha

## 📋 Pré-requisitos

Antes de enviar e-mails, você precisa configurar o servidor SMTP nas configurações do sistema.

## 🔧 Passo 1: Configurar SMTP

1. Acesse **Configurações** no menu lateral
2. Clique na aba **E-mail** (ou procure por "E-mail" no menu de configurações)
3. Preencha os campos:
   - **E-mail para Receber Chamados**: E-mail que receberá notificações
   - **Servidor SMTP**: Ex: `smtp.gmail.com` ou `smtp.office365.com`
   - **Porta SMTP**: 
     - Gmail: `587` (TLS) ou `465` (SSL)
     - Outlook/Office365: `587` (TLS)
     - Outros: Consulte seu provedor
   - **Segurança**: 
     - `true` para SSL (porta 465)
     - `false` para TLS (porta 587)
   - **Usuário SMTP**: Seu e-mail completo
   - **Senha SMTP**: 
     - Gmail: Use uma "Senha de App" (não a senha normal)
     - Outlook: Use sua senha ou senha de app
   - **Nome do Remetente**: Nome que aparecerá nos e-mails (ex: "Velodesk Suporte")
4. Clique em **Salvar Configurações**
5. (Opcional) Clique em **Testar Configurações** para verificar se está funcionando

### 📝 Configurações Comuns

#### Gmail
- **Servidor**: `smtp.gmail.com`
- **Porta**: `587`
- **Segurança**: `false` (TLS)
- **Usuário**: Seu e-mail completo do Gmail
- **Senha**: Senha de App do Google (criar em: https://myaccount.google.com/apppasswords)

#### Outlook/Office365
- **Servidor**: `smtp.office365.com`
- **Porta**: `587`
- **Segurança**: `false` (TLS)
- **Usuário**: Seu e-mail completo
- **Senha**: Sua senha ou senha de app

## 📧 Passo 2: Enviar E-mails

Existem 3 formas de enviar e-mails de criação de senha:

### Opção 1: Envio Individual (ao Editar Usuário)

1. Acesse **Configurações** > **Usuários**
2. Clique no **nome do usuário** ou no botão **Editar** (ícone de lápis)
3. No modal de edição, role até a seção **"Ações de E-mail"**
4. Clique no botão **"Enviar E-mail de Cadastro de Senha"**
5. O sistema gerará um novo token e enviará o e-mail

### Opção 2: Envio em Massa (Todos os Usuários sem Senha)

1. Acesse **Configurações** > **Usuários**
2. No topo da lista de usuários, você verá a seção **"Envio em Massa"**
3. Clique no botão **"Enviar E-mails para Todos os Usuários sem Senha"**
4. Confirme a ação
5. O sistema enviará e-mails para todos os usuários ativos que ainda não têm senha configurada
6. Aguarde a confirmação (pode levar alguns minutos dependendo da quantidade)

### Opção 3: Ao Criar Novo Usuário

1. Ao criar um novo usuário, marque a opção **"Enviar e-mail para criação de senha"**
2. Deixe o campo de senha em branco
3. O e-mail será enviado automaticamente após criar o usuário

## 📨 O que o Usuário Receberá

O e-mail contém:
- **Assunto**: "Bem-vindo ao Velodesk - Crie sua senha de acesso"
- **Conteúdo**: Mensagem de boas-vindas
- **Link**: Botão para criar a senha (válido por 7 dias)
- **Instruções**: Como usar o link

## 🔗 Link de Criação de Senha

O link gerado tem o formato:
```
https://seudominio.com/?action=setup-password&token=TOKEN_AQUI&email=usuario@email.com
```

O usuário pode:
1. Clicar no botão no e-mail
2. Ou copiar e colar o link no navegador
3. Criar sua senha no formulário que aparecerá

## ⚠️ Observações Importantes

1. **Token Válido por 7 dias**: O link expira após 7 dias. Se expirar, envie um novo e-mail.

2. **Backend Necessário**: Atualmente, o sistema **simula** o envio de e-mails. Para produção, você precisa:
   - Integrar a função `sendEmailViaSMTP()` com um backend real
   - O backend deve usar uma biblioteca como Nodemailer (Node.js) ou similar
   - Configurar o servidor SMTP no backend

3. **Limite de E-mails**: 
   - Gmail: 500 e-mails/dia (contas gratuitas)
   - Outlook: 300 e-mails/dia
   - Verifique os limites do seu provedor

4. **Delay entre E-mails**: O sistema envia com delay de 500ms entre cada e-mail para não sobrecarregar o servidor SMTP.

## 🛠️ Integração com Backend (Produção)

Para fazer funcionar em produção, você precisa:

1. **Criar endpoint no backend** para envio de e-mails:
```javascript
// Exemplo com Node.js + Nodemailer
app.post('/api/send-email', async (req, res) => {
    const { to, subject, html, emailSettings } = req.body;
    
    const transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        secure: emailSettings.smtpSecure,
        auth: {
            user: emailSettings.smtpUser,
            pass: emailSettings.smtpPassword
        }
    });
    
    await transporter.sendMail({
        from: `"${emailSettings.smtpFromName}" <${emailSettings.smtpUser}>`,
        to: to,
        subject: subject,
        html: html
    });
    
    res.json({ success: true });
});
```

2. **Atualizar a função `sendEmailViaSMTP()`** no frontend para fazer requisição ao backend:
```javascript
function sendEmailViaSMTP(emailData) {
    const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
    
    return fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emailSettings: emailSettings,
            emailData: emailData
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('E-mail enviado:', data);
        return data;
    })
    .catch(error => {
        console.error('Erro ao enviar e-mail:', error);
        throw error;
    });
}
```

## 📊 Verificar E-mails Enviados

Os e-mails enviados são registrados no `localStorage` com a chave `emailLogs`. Você pode verificar no console do navegador:

```javascript
const logs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
console.log('E-mails enviados:', logs);
```

## ❓ Problemas Comuns

### "Configure o SMTP nas configurações de e-mail"
- **Solução**: Configure o SMTP primeiro antes de tentar enviar e-mails

### "E-mail não está sendo enviado"
- Verifique se as configurações SMTP estão corretas
- Teste as configurações com o botão "Testar Configurações"
- Verifique se o backend está configurado (em produção)

### "Link expirado"
- Envie um novo e-mail de criação de senha para o usuário
- O token é válido por 7 dias

### "Usuário não recebeu o e-mail"
- Verifique a pasta de spam
- Confirme que o e-mail está correto
- Verifique os logs de e-mail no console

## 🎯 Resumo Rápido

1. ✅ Configure o SMTP em **Configurações** > **E-mail**
2. ✅ Teste as configurações
3. ✅ Acesse **Configurações** > **Usuários**
4. ✅ Use **"Envio em Massa"** ou envie individualmente
5. ✅ Aguarde confirmação
6. ✅ Usuários receberão e-mail com link para criar senha

---

**Nota**: Este sistema está preparado para integração com backend. Em ambiente de desenvolvimento, os e-mails são simulados e salvos em `localStorage`.

