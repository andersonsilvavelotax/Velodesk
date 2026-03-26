const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/velodesk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Schemas do MongoDB
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent', 'client'], default: 'client' },
  avatar: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['novo', 'em-aberto', 'em-espera', 'pendente', 'resolvido', 'fechado'], default: 'novo' },
  priority: { type: String, enum: ['baixa', 'media', 'alta', 'urgente'], default: 'media' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box' },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  messages: [{
    content: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isInternal: { type: Boolean, default: false },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      size: Number
    }],
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const boxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
  color: { type: String, default: '#007bff' },
  description: String,
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const Box = mongoose.model('Box', boxSchema);

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'velodesk-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Configuração do Nodemailer
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Rotas de autenticação
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role = 'client' } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });
    
    await user.save();
    
    // Gerar token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'velodesk-secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'velodesk-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

// Rotas de tickets
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, priority, boxId } = req.query;
    let query = {};
    
    // Filtros baseados no papel do usuário
    if (req.user.role === 'client') {
      query.clientId = req.user.userId;
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (boxId) query.boxId = boxId;
    
    const tickets = await Ticket.find(query)
      .populate('clientId', 'name email')
      .populate('agentId', 'name email')
      .populate('boxId', 'name color')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tickets', error: error.message });
  }
});

app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, description, priority, boxId } = req.body;
    
    const ticket = new Ticket({
      subject,
      description,
      priority,
      clientId: req.user.userId,
      boxId
    });
    
    await ticket.save();
    
    // Enviar email de confirmação
    const client = await User.findById(req.user.userId);
    if (client) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: client.email,
        subject: `Ticket criado: ${subject}`,
        html: `
          <h2>Ticket Criado com Sucesso</h2>
          <p>Seu ticket foi criado e recebeu o ID: ${ticket._id}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <p><strong>Descrição:</strong> ${description}</p>
          <p><strong>Prioridade:</strong> ${priority}</p>
        `
      });
    }
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar ticket', error: error.message });
  }
});

app.put('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, agentId } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }
    
    // Verificar permissões
    if (req.user.role === 'client' && ticket.clientId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    ticket.status = status || ticket.status;
    ticket.priority = priority || ticket.priority;
    ticket.agentId = agentId || ticket.agentId;
    ticket.updatedAt = new Date();
    
    await ticket.save();
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar ticket', error: error.message });
  }
});

// Rotas de caixas
app.get('/api/boxes', authenticateToken, async (req, res) => {
  try {
    const boxes = await Box.find().sort({ createdAt: -1 });
    res.json(boxes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar caixas', error: error.message });
  }
});

app.post('/api/boxes', authenticateToken, async (req, res) => {
  try {
    const { name, status, color, description } = req.body;
    
    const box = new Box({
      name,
      status,
      color,
      description
    });
    
    await box.save();
    res.status(201).json(box);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar caixa', error: error.message });
  }
});

// Rotas de upload
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }
    
    res.json({
      message: 'Arquivo enviado com sucesso',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer upload', error: error.message });
  }
});

// Rotas de mensagens
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content, isInternal = false } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket não encontrado' });
    }
    
    const message = {
      content,
      senderId: req.user.userId,
      isInternal
    };
    
    ticket.messages.push(message);
    await ticket.save();
    
    // Emitir evento via Socket.IO
    io.emit('newMessage', {
      ticketId: ticket._id,
      message: {
        ...message,
        sender: req.user
      }
    });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao enviar mensagem', error: error.message });
  }
});

// Rotas de usuários
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
});

// Rota de dashboard
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['novo', 'em-aberto', 'em-espera', 'pendente'] } });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolvido' });
    const closedTickets = await Ticket.countDocuments({ status: 'fechado' });
    
    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Socket.IO para notificações em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('joinTicket', (ticketId) => {
    socket.join(`ticket-${ticketId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;

