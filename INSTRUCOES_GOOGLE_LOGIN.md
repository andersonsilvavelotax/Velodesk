# Instruções para Configurar Login Google

## Erro 400 - Solução

O erro 400 do Google geralmente ocorre quando o Client ID não está configurado corretamente. Siga os passos abaixo:

## Passo 1: Obter Client ID do Google

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth client ID**
5. Se for a primeira vez, configure a tela de consentimento OAuth:
   - Escolha **External** (ou Internal se tiver Google Workspace)
   - Preencha as informações necessárias
   - Adicione seu e-mail como desenvolvedor
6. Configure o OAuth client:
   - **Application type**: Web application
   - **Name**: Velodesk Login (ou qualquer nome)
   - **Authorized JavaScript origins**: 
     - `http://localhost` (para desenvolvimento)
     - `https://seu-dominio.com` (para produção)
   - **Authorized redirect URIs**: 
     - `http://localhost` (para desenvolvimento)
     - `https://seu-dominio.com` (para produção)
7. Clique em **Create**
8. Copie o **Client ID** (algo como: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Passo 2: Configurar no Código

1. Abra o arquivo `login-simple-fixed.js`
2. Encontre a linha 9:
   ```javascript
   const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com';
   ```
3. Substitua `SEU_CLIENT_ID_AQUI.apps.googleusercontent.com` pelo seu Client ID real:
   ```javascript
   const GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
   ```

## Passo 3: Verificar Configurações

Certifique-se de que:

1. ✅ O script do Google está carregado no HTML (`index.html` linha 13)
2. ✅ O Client ID está configurado corretamente no JavaScript
3. ✅ As origens autorizadas no Google Cloud Console incluem seu domínio
4. ✅ O domínio permitido está correto: `velotax.com.br`

## Passo 4: Testar

1. Abra o sistema no navegador
2. Na tela de login, você deve ver o botão "Entrar com Google"
3. Clique no botão e faça login com uma conta `@velotax.com.br`
4. O sistema deve validar o domínio e permitir o acesso

## Troubleshooting

### Erro 400 ainda aparece:
- Verifique se o Client ID está correto (sem espaços extras)
- Verifique se as origens autorizadas no Google Cloud Console estão corretas
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique o console do navegador (F12) para mais detalhes do erro

### Botão não aparece:
- Verifique se o script do Google está carregando (F12 > Network)
- Verifique se há erros no console do navegador
- Certifique-se de que o elemento `google-signin-button` existe no HTML

### Domínio não permitido:
- Verifique se o e-mail usado termina com `@velotax.com.br`
- Verifique a constante `ALLOWED_DOMAIN` no código

## Notas Importantes

- ⚠️ **Nunca compartilhe seu Client ID publicamente** em repositórios públicos
- ⚠️ Para produção, use variáveis de ambiente ou configuração segura
- ⚠️ O Client ID deve ser diferente para desenvolvimento e produção

