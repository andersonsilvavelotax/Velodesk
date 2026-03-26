# Configuração do Google OAuth para Velodesk

## 📋 Pré-requisitos

1. Conta Google com acesso ao Google Cloud Console
2. Domínio @velotax.com.br configurado no Google Workspace (recomendado)

## 🔧 Passos para Configuração

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: "Velodesk OAuth"

### 2. Habilitar Google Identity Services

1. No menu lateral, vá para **APIs & Services** > **Library**
2. Procure por "Google Identity Services API"
3. Clique em **Enable**

### 3. Configurar OAuth Consent Screen

1. Vá para **APIs & Services** > **OAuth consent screen**
2. Selecione **External** (para usuários externos)
3. Preencha os campos obrigatórios:
   - **App name**: Velodesk
   - **User support email**: seu-email@velotax.com.br
   - **Developer contact information**: seu-email@velotax.com.br
4. Adicione domínios autorizados:
   - **Authorized domains**: velotax.com.br
5. Salve e continue

### 4. Criar Credenciais OAuth

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Selecione **Web application**
4. Configure:
   - **Name**: Velodesk Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seudominio.com` (para produção)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seudominio.com` (para produção)
5. Clique em **Create**
6. **IMPORTANTE**: Copie o **Client ID** gerado

### 5. Configurar o Velodesk

1. Abra o arquivo `google-oauth-config.js`
2. Substitua `YOUR_GOOGLE_CLIENT_ID` pelo Client ID copiado:
   ```javascript
   clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
   ```

### 6. Testar a Configuração

1. Abra o Velodesk no navegador
2. Na tela de login, você deve ver:
   - Campo de email e senha
   - Divisor "ou"
   - Botão "Entrar com Google"
   - Botão "Acessar sem login (modo temporário)"

## 🔒 Configurações de Segurança

### Domínios Autorizados
- Apenas emails @velotax.com.br podem fazer login
- Configurado em `google-oauth-config.js`

### Modo Temporário
- O botão "Acessar sem login" permite acesso temporário
- Útil para desenvolvimento e testes
- **IMPORTANTE**: Desative em produção

## 🚀 Ativação em Produção

### Para Ativar o Google OAuth:
1. Configure o Client ID correto
2. Remova ou oculte o botão "Acessar sem login"
3. Teste com contas @velotax.com.br

### Para Manter Modo Temporário:
1. Mantenha o Client ID como `YOUR_GOOGLE_CLIENT_ID`
2. O botão do Google ficará oculto
3. Use apenas o botão "Acessar sem login"

## 🐛 Solução de Problemas

### Botão do Google não aparece:
- Verifique se o Client ID está correto
- Confirme se o Google Identity Services está carregado
- Verifique o console do navegador para erros

### Erro "Acesso negado":
- Confirme se o email termina com @velotax.com.br
- Verifique se o domínio está autorizado no Google Console

### Erro de CORS:
- Adicione o domínio nas "Authorized JavaScript origins"
- Verifique se está usando HTTPS em produção

## 📞 Suporte

Para problemas com a configuração, verifique:
1. Console do navegador (F12)
2. Logs do Google Cloud Console
3. Configurações de domínio no Google Workspace



