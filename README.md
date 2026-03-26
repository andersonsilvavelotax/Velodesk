# Velodesk - Sistema de Gerenciamento de Tickets

Sistema completo de helpdesk com frontend responsivo e backend robusto.

## 🚀 Funcionalidades Implementadas

### Frontend
- ✅ **Sistema de Login** com autenticação
- ✅ **Dashboard** com estatísticas em tempo real
- ✅ **Gerenciamento de Tickets** com sistema de abas
- ✅ **Sistema Kanban** com drag & drop
- ✅ **Upload de Arquivos** com validação
- ✅ **Templates de Resposta** predefinidos
- ✅ **Sistema de Notificações** visuais
- ✅ **Design Responsivo** para mobile
- ✅ **Chat Interno** com mensagens
- ✅ **Gerenciamento de Usuários**
- ✅ **Assistente IA** integrado
- ✅ **Relatórios** e estatísticas

### Backend
- ✅ **API REST** completa
- ✅ **Autenticação JWT** segura
- ✅ **Banco de Dados MongoDB** com Mongoose
- ✅ **Upload de Arquivos** com Multer
- ✅ **WebSocket** para notificações em tempo real
- ✅ **Sistema de Email** com Nodemailer
- ✅ **Rate Limiting** para segurança
- ✅ **Validação de Dados** com express-validator

## 📦 Instalação

### Pré-requisitos
- Node.js (v16 ou superior)
- MongoDB (local ou Atlas)
- Git

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd velodesk
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite as configurações
nano .env
```

### 4. Configure o MongoDB
```bash
# Para MongoDB local
mongod

# Ou use MongoDB Atlas (recomendado para produção)
# Atualize a MONGODB_URI no .env
```

### 5. Configure o Email (opcional)
```bash
# No arquivo .env, configure:
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

### 6. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 7. Acesse o sistema
- Frontend: `http://localhost:3000` (servir arquivos estáticos)
- API: `http://localhost:3000/api`
- WebSocket: `http://localhost:3000`

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/velodesk

# JWT
JWT_SECRET=sua-chave-secreta-super-segura

# Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
```

### Estrutura do Projeto
```
velodesk/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── config.js              # Configurações do frontend
├── api.js                 # Cliente API
├── login-simple.js        # Lógica do frontend
├── styles.css             # Estilos
├── index.html             # Interface principal
├── uploads/               # Arquivos enviados
└── README.md              # Este arquivo
```

## 🎯 Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Crie uma conta de administrador
3. Faça login no sistema

### 2. Configuração Inicial
1. **Crie Caixas**: Configure as caixas do Kanban
2. **Adicione Usuários**: Gerencie agentes e clientes
3. **Configure Templates**: Personalize respostas padrão

### 3. Uso Diário
1. **Receba Tickets**: Via email ou interface
2. **Gerencie Tickets**: Use o sistema Kanban
3. **Responda Clientes**: Com templates e anexos
4. **Acompanhe Métricas**: No dashboard

## 🔌 API Endpoints

### Autenticação
- `POST /api/login` - Login
- `POST /api/register` - Registro
- `GET /api/dashboard` - Estatísticas

### Tickets
- `GET /api/tickets` - Listar tickets
- `POST /api/tickets` - Criar ticket
- `PUT /api/tickets/:id` - Atualizar ticket
- `POST /api/tickets/:id/messages` - Enviar mensagem

### Caixas
- `GET /api/boxes` - Listar caixas
- `POST /api/boxes` - Criar caixa

### Upload
- `POST /api/upload` - Upload de arquivo

## 🛠️ Desenvolvimento

### Estrutura do Código
- **Frontend**: Vanilla JavaScript com módulos
- **Backend**: Node.js + Express + MongoDB
- **WebSocket**: Socket.IO para tempo real
- **Estilos**: CSS puro com variáveis

### Adicionando Novas Funcionalidades
1. **Backend**: Adicione rotas em `server.js`
2. **Frontend**: Crie funções em `login-simple.js`
3. **API**: Atualize `api.js` se necessário
4. **Estilos**: Adicione CSS em `styles.css`

### Testes
```bash
# Instalar dependências de teste
npm install --save-dev jest supertest

# Executar testes
npm test
```

## 🚀 Deploy

### Heroku
```bash
# Instalar Heroku CLI
# Configurar variáveis de ambiente
heroku config:set MONGODB_URI=sua-uri
heroku config:set JWT_SECRET=sua-chave

# Deploy
git push heroku main
```

### Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Mobile

O sistema é totalmente responsivo e funciona em:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops
- 🖥️ Telas grandes

## 🔒 Segurança

- ✅ **JWT** para autenticação
- ✅ **Rate Limiting** contra ataques
- ✅ **Validação** de dados
- ✅ **Sanitização** de inputs
- ✅ **CORS** configurado
- ✅ **Helmet** para headers seguros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@velodesk.com
- 💬 Discord: [Link do servidor]
- 📖 Documentação: [Link da documentação]

## 🎉 Agradecimentos

- **Font Awesome** pelos ícones
- **Socket.IO** para WebSocket
- **MongoDB** pelo banco de dados
- **Express** pelo framework
- **Comunidade** pelo feedback

---

**Velodesk** - Sistema de Gerenciamento de Tickets Profissional 🎯

