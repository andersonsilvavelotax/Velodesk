// Função de login - DEFINIDA PRIMEIRO
function fazerLogin() {
    alert('Função fazerLogin chamada!');
    
    try {
        // Ocultar tela de login
        document.getElementById('loginScreen').style.display = 'none';
        alert('Tela de login ocultada!');
        
        // Mostrar aplicação principal
        document.getElementById('mainApp').style.display = 'grid';
        alert('Aplicação principal exibida!');
        
        alert('LOGIN FUNCIONOU!');
    } catch (error) {
        alert('ERRO: ' + error.message);
    }
}

// Estado da aplicação
let currentUser = null;
let tickets = [];
let currentTicketId = null;
let kanbanColumns = [];
let currentTab = 'list';
let draggedTicket = null;
let ticketMessages = {};
let ticketInternalNotes = {};
let ticketConfig = {
    forms: [],
    automations: [],
    customFields: []
};
let systemUsers = [];
let currentEditingUser = null;
let openTabs = [];
let activeTabId = null;
let selectedBoxId = null;
let customForms = {};

// Status dos tickets
const TICKET_STATUS = {
    NOVO: 'novo',
    EM_ABERTO: 'em-aberto',
    EM_ESPERA: 'em-espera',
    PENDENTE: 'pendente',
    RESOLVIDO: 'resolvido'
};

// Prioridades dos tickets
const TICKET_PRIORITY = {
    BAIXA: 'baixa',
    MEDIA: 'media',
    ALTA: 'alta'
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
    initializeKanbanColumns();
});

// Inicializar aplicação
function initializeApp() {
    console.log('Inicializando aplicação...');
    
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('velodesk_user');
    console.log('Usuário salvo no localStorage:', savedUser);
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Usuário carregado:', currentUser);
            showMainApp();
            updateDashboard();
        } catch (error) {
            console.error('Erro ao fazer parse do usuário:', error);
            showLoginScreen();
        }
    } else {
        console.log('Nenhum usuário logado, mostrando tela de login');
        showLoginScreen();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('Configurando event listeners de login...');
    console.log('loginForm:', loginForm);
    console.log('logoutBtn:', logoutBtn);
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Event listener de login adicionado');
    } else {
        console.error('Formulário de login não encontrado!');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('Event listener de logout adicionado');
    } else {
        console.error('Botão de logout não encontrado!');
    }
    
    // Navegação
    const navItems = document.querySelectorAll('.nav-item');
    console.log('Encontrados itens de navegação:', navItems.length);
    
    navItems.forEach((item, index) => {
        console.log(`Configurando navegação ${index}:`, item.dataset.page);
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            console.log('Clique em navegação:', page);
            navigateToPage(page);
        });
    });
    
    // Tickets
    document.getElementById('newTicketForm').addEventListener('submit', handleNewTicket);
    document.getElementById('cancelTicket').addEventListener('click', function() {
        navigateToPage('tickets');
    });
    
    // Busca e filtros
    document.getElementById('searchTickets').addEventListener('input', filterTickets);
    document.getElementById('statusFilter').addEventListener('change', filterTickets);
    
    // Configuração de tickets
    document.getElementById('openTicketConfig').addEventListener('click', openTicketConfig);
    document.getElementById('closeConfigModal').addEventListener('click', closeTicketConfig);
    document.querySelector('.close-config').addEventListener('click', closeTicketConfig);
    
    // Modal
    document.getElementById('saveTicket').addEventListener('click', saveTicketChanges);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Fechar modal clicando fora
    document.getElementById('ticketModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Mensagens e observações (removidos - agora são gerenciados pelas abas)
    
    // Sistema de abas
    document.getElementById('closeAllTabs').addEventListener('click', closeAllTabs);
    
    // Modal Nova Caixa - configuração imediata
    setTimeout(() => {
        const addColumnBtn = document.getElementById('addColumn');
        console.log('Tentando configurar botão addColumn:', addColumnBtn);
        
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Botão Nova Caixa clicado!');
                openNewBoxModal();
            });
            console.log('Event listener adicionado ao botão addColumn');
        } else {
            console.error('Botão addColumn não encontrado!');
        }
    }, 500);
    
    // Abas de Tickets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Configuração dos outros elementos do modal - usando setTimeout para garantir que existam
    setTimeout(() => {
        const closeNewBoxModalBtn = document.getElementById('closeNewBoxModal');
        const closeNewBoxSpan = document.querySelector('.close-new-box');
        const newBoxModal = document.getElementById('newBoxModal');
        const saveBoxBtn = document.getElementById('saveBox');
        const addUserBtn = document.getElementById('addUserBtn');
        
        console.log('Configurando event listeners do modal...');
        console.log('closeNewBoxModalBtn:', closeNewBoxModalBtn);
        console.log('saveBoxBtn:', saveBoxBtn);
        console.log('addUserBtn:', addUserBtn);
        
        if (closeNewBoxModalBtn) {
            closeNewBoxModalBtn.addEventListener('click', function() {
                console.log('Botão Cancelar clicado!');
                closeNewBoxModal();
            });
            console.log('Event listener adicionado ao botão Cancelar');
        } else {
            console.error('Botão closeNewBoxModal não encontrado!');
        }
        
        if (closeNewBoxSpan) {
            closeNewBoxSpan.addEventListener('click', function() {
                console.log('Botão X clicado!');
                closeNewBoxModal();
            });
            console.log('Event listener adicionado ao botão X');
        } else {
            console.error('Botão closeNewBoxSpan não encontrado!');
        }
        
        if (saveBoxBtn) {
            saveBoxBtn.addEventListener('click', function() {
                console.log('Botão Salvar clicado!');
                saveNewBox();
            });
            console.log('Event listener adicionado ao botão Salvar');
        } else {
            console.error('Botão saveBox não encontrado!');
        }
        
        if (addUserBtn) {
            addUserBtn.addEventListener('click', function() {
                console.log('Botão Adicionar Usuário clicado!');
                addUserToBox();
            });
            console.log('Event listener adicionado ao botão Adicionar Usuário');
        } else {
            console.error('Botão addUserBtn não encontrado!');
        }
        
    if (newBoxModal) {
        newBoxModal.addEventListener('click', function(e) {
            if (e.target === this) {
                console.log('Clique fora do modal - fechando...');
                closeNewBoxModal();
            }
        });
        console.log('Event listener adicionado ao modal');
    } else {
        console.error('Modal newBoxModal não encontrado!');
    }
    
    // Event listeners para sistema de usuários
    const addUserBtn = document.getElementById('addUser');
    const saveUserBtn = document.getElementById('saveUser');
    const closeUserModalBtn = document.getElementById('closeUserModal');
    const closeUserSpan = document.querySelector('.close-user');
    const userModal = document.getElementById('userModal');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            console.log('Botão Novo Usuário clicado!');
            openUserModal();
        });
        console.log('Event listener adicionado ao botão Novo Usuário');
    }
    
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', function() {
            console.log('Botão Salvar Usuário clicado!');
            saveUser();
        });
        console.log('Event listener adicionado ao botão Salvar Usuário');
    }
    
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
        console.log('Event listener adicionado ao botão Cancelar Usuário');
    }
    
    if (closeUserSpan) {
        closeUserSpan.addEventListener('click', closeUserModal);
        console.log('Event listener adicionado ao botão X do modal usuário');
    }
    
    if (userModal) {
        userModal.addEventListener('click', function(e) {
            if (e.target === this) {
                console.log('Clique fora do modal usuário - fechando...');
                closeUserModal();
            }
        });
        console.log('Event listener adicionado ao modal usuário');
    }
    }, 1000);
}

// Mostrar tela de login
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// Mostrar aplicação principal
function showMainApp() {
    console.log('Mostrando aplicação principal...');
    console.log('currentUser:', currentUser);
    
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const userName = document.getElementById('userName');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
        console.log('Tela de login ocultada');
    } else {
        console.error('Elemento loginScreen não encontrado!');
    }
    
    if (mainApp) {
        mainApp.style.display = 'grid';
        console.log('Aplicação principal exibida');
    } else {
        console.error('Elemento mainApp não encontrado!');
    }
    
    if (userName && currentUser) {
        userName.textContent = currentUser.name;
        console.log('Nome do usuário atualizado:', currentUser.name);
    } else {
        console.error('Elemento userName não encontrado ou currentUser não definido!');
    }
}

// Lidar com login
function handleLogin(e) {
    console.log('=== FUNÇÃO handleLogin CHAMADA ===');
    console.log('Evento:', e);
    e.preventDefault();
    
    const emailElement = document.getElementById('email');
    const passwordElement = document.getElementById('password');
    
    console.log('Elemento email:', emailElement);
    console.log('Elemento password:', passwordElement);
    
    if (!emailElement || !passwordElement) {
        console.error('Elementos de email ou senha não encontrados!');
        alert('Erro: Campos de login não encontrados!');
        return;
    }
    
    const email = emailElement.value;
    const password = passwordElement.value;
    
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'vazio');
    
    // Simulação de autenticação (em produção, isso seria feito no servidor)
    if (email && password) {
        console.log('Credenciais válidas, fazendo login...');
        currentUser = {
            id: 1,
            name: email.split('@')[0],
            email: email
        };
        
        localStorage.setItem('velodesk_user', JSON.stringify(currentUser));
        console.log('Usuário salvo no localStorage:', currentUser);
        
        showMainApp();
        updateDashboard();
        console.log('Login realizado com sucesso!');
    } else {
        console.log('Campos vazios, exibindo alerta...');
        alert('Por favor, preencha todos os campos.');
    }
}

// Lidar com logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('velodesk_user');
    showLoginScreen();
}

// Navegação entre páginas
function navigateToPage(page) {
    console.log('Navegando para página:', page);
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${page}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
        console.log('Navegação ativa atualizada');
    } else {
        console.error('Item de navegação não encontrado:', page);
    }
    
    // Mostrar página correspondente
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Página exibida:', page);
    } else {
        console.error('Página não encontrada:', page);
    }
    
    // Carregar dados específicos da página
    if (page === 'tickets') {
        console.log('Carregando caixas...');
        loadBoxes();
    } else if (page === 'chat') {
        console.log('Carregando chat...');
        loadChat();
    } else if (page === 'config') {
        console.log('Carregando configurações...');
        loadTicketConfig();
    }
}

// Carregar dados de exemplo
function loadSampleData() {
    tickets = [
        {
            id: 1,
            subject: 'Problema com login no sistema',
            description: 'Não consigo fazer login no sistema principal. Aparece erro de credenciais.',
            status: TICKET_STATUS.EM_ABERTO,
            priority: TICKET_PRIORITY.ALTA,
            createdDate: new Date('2024-01-15'),
            user: 'João Silva'
        },
        {
            id: 2,
            subject: 'Solicitação de nova funcionalidade',
            description: 'Gostaria de solicitar a implementação de relatórios em PDF.',
            status: TICKET_STATUS.NOVO,
            priority: TICKET_PRIORITY.MEDIA,
            createdDate: new Date('2024-01-16'),
            user: 'Maria Santos'
        },
        {
            id: 3,
            subject: 'Erro na impressão de documentos',
            description: 'Os documentos não estão sendo impressos corretamente.',
            status: TICKET_STATUS.EM_ESPERA,
            priority: TICKET_PRIORITY.BAIXA,
            createdDate: new Date('2024-01-14'),
            user: 'Pedro Costa'
        },
        {
            id: 4,
            subject: 'Acesso negado ao módulo financeiro',
            description: 'Preciso de acesso ao módulo financeiro para gerar relatórios.',
            status: TICKET_STATUS.PENDENTE,
            priority: TICKET_PRIORITY.MEDIA,
            createdDate: new Date('2024-01-13'),
            user: 'Ana Oliveira'
        },
        {
            id: 5,
            subject: 'Problema com backup automático',
            description: 'O backup automático não está funcionando há 3 dias.',
            status: TICKET_STATUS.RESOLVIDO,
            priority: TICKET_PRIORITY.ALTA,
            createdDate: new Date('2024-01-10'),
            user: 'Carlos Lima'
        }
    ];
    
    // Salvar no localStorage
    localStorage.setItem('velodesk_tickets', JSON.stringify(tickets));
}

// Atualizar dashboard
function updateDashboard() {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === TICKET_STATUS.EM_ABERTO).length;
    const resolvedTickets = tickets.filter(t => t.status === TICKET_STATUS.RESOLVIDO).length;
    const pendingTickets = tickets.filter(t => t.status === TICKET_STATUS.PENDENTE).length;
    
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('openTickets').textContent = openTickets;
    document.getElementById('resolvedTickets').textContent = resolvedTickets;
    document.getElementById('pendingTickets').textContent = pendingTickets;
}

// Carregar caixas
function loadBoxes() {
    console.log('Carregando caixas...', kanbanColumns);
    const boxesList = document.getElementById('boxesList');
    if (!boxesList) {
        console.error('Elemento boxesList não encontrado!');
        alert('Erro: Elemento boxesList não encontrado!');
        return;
    }
    
    boxesList.innerHTML = '';
    
    if (kanbanColumns.length === 0) {
        console.log('Nenhuma caixa para carregar');
        return;
    }
    
    kanbanColumns.forEach(box => {
        console.log('Criando elemento para caixa:', box);
        const boxElement = createBoxElement(box);
        boxesList.appendChild(boxElement);
    });
    
    console.log('Caixas carregadas com sucesso!');
    alert(`Caixas carregadas: ${kanbanColumns.length} caixas encontradas`);
}

// Criar elemento de caixa
function createBoxElement(box) {
    const boxDiv = document.createElement('div');
    boxDiv.className = 'box-item';
    boxDiv.dataset.boxId = box.id;
    
    const ticketsInBox = tickets.filter(ticket => ticket.status === box.status);
    
    // Formatar número de tickets com zero à esquerda (ex: 03)
    const ticketCount = ticketsInBox.length.toString().padStart(2, '0');
    
    boxDiv.innerHTML = `
        <div class="box-header">
            <div class="box-title">${box.name}</div>
            <div class="box-count">(${ticketCount})</div>
        </div>
        <div class="box-description">Status: ${getStatusText(box.status)}</div>
        ${box.description ? `<div class="box-description">${box.description}</div>` : ''}
        ${box.users && box.users.length > 0 ? `<div class="box-users">👥 ${box.users.length} usuário(s)</div>` : ''}
    `;
    
    boxDiv.addEventListener('click', () => selectBox(box.id));
    
    return boxDiv;
}

// Selecionar caixa
function selectBox(boxId) {
    console.log('Selecionando caixa:', boxId);
    selectedBoxId = boxId;
    
    // Atualizar visual das caixas
    document.querySelectorAll('.box-item').forEach(item => {
        item.classList.remove('active');
    });
    const selectedBox = document.querySelector(`[data-box-id="${boxId}"]`);
    if (selectedBox) {
        selectedBox.classList.add('active');
        console.log('Caixa selecionada visualmente');
    } else {
        console.error('Caixa não encontrada para seleção');
    }
    
    // Carregar tickets da caixa
    loadTicketsForBox(boxId);
}

// Carregar tickets de uma caixa específica
function loadTicketsForBox(boxId) {
    console.log('Carregando tickets para caixa:', boxId);
    const box = kanbanColumns.find(b => b.id === boxId);
    if (!box) {
        console.error('Caixa não encontrada:', boxId);
        return;
    }
    
    const boxTickets = tickets.filter(ticket => ticket.status === box.status);
    console.log('Tickets encontrados para a caixa:', boxTickets.length);
    
    const ticketsList = document.getElementById('ticketsList');
    const selectedBoxTitle = document.getElementById('selectedBoxTitle');
    
    if (!ticketsList || !selectedBoxTitle) {
        console.error('Elementos da lista de tickets não encontrados!');
        return;
    }
    
    selectedBoxTitle.textContent = `${box.name} (${boxTickets.length} tickets)`;
    
    ticketsList.innerHTML = '';
    
    if (boxTickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket nesta caixa.</div>';
        console.log('Nenhum ticket encontrado para esta caixa');
        return;
    }
    
    boxTickets.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
    
    console.log('Tickets carregados com sucesso!');
}

// Carregar chat
function loadChat() {
    // Implementar funcionalidade de chat
    console.log('Carregando chat...');
}

// Carregar tickets (função original mantida para compatibilidade)
function loadTickets() {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) return;
    
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket encontrado.</div>';
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
}

// Criar elemento de ticket
function createTicketElement(ticket) {
    const div = document.createElement('div');
    div.className = 'ticket-item';
    div.onclick = () => openTicketModal(ticket);
    
    const statusClass = `status-${ticket.status.replace('_', '-')}`;
    const priorityClass = `priority-${ticket.priority}`;
    
    div.innerHTML = `
        <div class="ticket-info">
            <h4>#${ticket.id} - ${ticket.subject}</h4>
            <p>${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</p>
        </div>
        <div class="ticket-meta">
            <span class="status-badge ${statusClass}">${getStatusText(ticket.status)}</span>
            <span class="priority-badge ${priorityClass}">${getPriorityText(ticket.priority)}</span>
            <small>${formatDate(ticket.createdDate)}</small>
        </div>
    `;
    
    return div;
}

// Abrir ticket em aba
function openTicketModal(ticket) {
    console.log('Abrindo ticket:', ticket);
    
    // Verificar se o ticket já está aberto
    const existingTab = openTabs.find(tab => tab.ticketId === ticket.id);
    if (existingTab) {
        switchToTab(existingTab.id);
        return;
    }
    
    // Criar nova aba
    const tabId = `tab-${ticket.id}-${Date.now()}`;
    const tab = {
        id: tabId,
        ticketId: ticket.id,
        title: `#${ticket.id} - ${ticket.subject.substring(0, 30)}${ticket.subject.length > 30 ? '...' : ''}`,
        ticket: ticket
    };
    
    openTabs.push(tab);
    activeTabId = tabId;
    
    console.log('Criando aba:', tab);
    
    // Mostrar barra de abas e container
    const tabsBar = document.getElementById('ticketTabsBar');
    const tabsContainer = document.getElementById('ticketTabsContainer');
    
    if (tabsBar && tabsContainer) {
        tabsBar.style.display = 'block';
        tabsContainer.style.display = 'flex';
        
        // Criar aba na barra
        createTabElement(tab);
        
        // Criar conteúdo da aba
        createTabContent(tab);
        
        // Ativar a aba criada
        switchToTab(tabId);
        
        // Atualizar visualização
        updateTabsDisplay();
    } else {
        console.error('Elementos de abas não encontrados');
    }
}

// Criar elemento da aba
function createTabElement(tab) {
    const tabsList = document.getElementById('tabsList');
    if (!tabsList) {
        console.error('Elemento tabsList não encontrado');
        return;
    }
    
    const tabElement = document.createElement('div');
    tabElement.className = 'ticket-tab';
    tabElement.dataset.tabId = tab.id;
    
    tabElement.innerHTML = `
        <span class="ticket-tab-title">${tab.title}</span>
        <button class="ticket-tab-close" onclick="closeTab('${tab.id}')">&times;</button>
    `;
    
    tabElement.addEventListener('click', (e) => {
        if (e.target !== tabElement.querySelector('.ticket-tab-close')) {
            switchToTab(tab.id);
        }
    });
    
    tabsList.appendChild(tabElement);
    console.log('Aba criada:', tab.title);
}

// Criar conteúdo da aba
function createTabContent(tab) {
    console.log('Criando conteúdo da aba com nova estrutura:', tab);
    const container = document.getElementById('ticketTabsContainer');
    if (!container) {
        console.error('Container de abas não encontrado');
        return;
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.id = `tab-content-${tab.id}`;
    contentDiv.className = 'ticket-tab-content';
    
    contentDiv.innerHTML = `
        <!-- Cabeçalho do Ticket -->
        <div class="ticket-header">
            <div class="ticket-title-section">
                <h2>Ticket #${tab.ticket.id}</h2>
                <input type="text" id="subject-${tab.id}" class="ticket-subject-input" value="${tab.ticket.subject}" placeholder="Assunto do ticket">
            </div>
            <div class="ticket-actions">
                <button class="btn-primary" onclick="saveTicketFromTab('${tab.id}')">Salvar</button>
                <button class="btn-secondary" onclick="closeTab('${tab.id}')">Fechar</button>
            </div>
        </div>
        
        <!-- Corpo Principal do Ticket -->
        <div class="ticket-body">
            <!-- Área Principal -->
            <div class="ticket-main-area">
                <!-- Descrição do Cliente -->
                <div class="ticket-section">
                    <h3>Descrição do Cliente</h3>
                    <div class="client-description">
                        <p>${tab.ticket.description}</p>
                    </div>
                </div>
                
                <!-- Abas de Resposta -->
                <div class="ticket-response-tabs">
                    <div class="response-tab-buttons">
                        <button class="response-tab-btn active" data-tab="response" onclick="switchResponseTab('${tab.id}', 'response')">Resposta</button>
                        <button class="response-tab-btn" data-tab="internal" onclick="switchResponseTab('${tab.id}', 'internal')">Observação Interna</button>
                    </div>
                    
                    <!-- Conteúdo da Aba de Resposta -->
                    <div class="response-tab-content active" id="response-content-${tab.id}">
                        <div class="response-form">
                            <textarea id="newMessage-${tab.id}" placeholder="Digite sua resposta para o cliente..." rows="4"></textarea>
                            <button class="btn-primary" onclick="sendMessageFromTab('${tab.id}')">Enviar Resposta</button>
                        </div>
                    </div>
                    
                    <!-- Conteúdo da Aba de Observação Interna -->
                    <div class="response-tab-content" id="internal-content-${tab.id}">
                        <div class="internal-form">
                            <textarea id="newNote-${tab.id}" placeholder="Observação interna (não visível para o cliente)..." rows="4"></textarea>
                            <button class="btn-secondary" onclick="addNoteFromTab('${tab.id}')">Adicionar Observação</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Formulário de Tabulação (Lateral) -->
            <div class="ticket-form-sidebar">
                <div class="form-section">
                    <h4>Tabulação do Ticket</h4>
                    <div class="form-fields">
                        <div class="form-field">
                            <label>Status:</label>
                            <select id="status-${tab.id}">
                                <option value="novo" ${tab.ticket.status === 'novo' ? 'selected' : ''}>Novo</option>
                                <option value="em-aberto" ${tab.ticket.status === 'em-aberto' ? 'selected' : ''}>Em Aberto</option>
                                <option value="em-espera" ${tab.ticket.status === 'em-espera' ? 'selected' : ''}>Em Espera</option>
                                <option value="pendente" ${tab.ticket.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="resolvido" ${tab.ticket.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Prioridade:</label>
                            <select id="priority-${tab.id}">
                                <option value="baixa" ${tab.ticket.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
                                <option value="media" ${tab.ticket.priority === 'media' ? 'selected' : ''}>Média</option>
                                <option value="alta" ${tab.ticket.priority === 'alta' ? 'selected' : ''}>Alta</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>Data de Criação:</label>
                            <span class="form-value">${formatDate(tab.ticket.createdDate)}</span>
                        </div>
                        <div class="form-field">
                            <label>Cliente:</label>
                            <span class="form-value">${tab.ticket.user}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Histórico de Mensagens -->
                <div class="form-section">
                    <h4>Histórico de Mensagens</h4>
                    <div class="messages-container" id="messages-${tab.id}">
                        <!-- Mensagens serão carregadas aqui -->
                    </div>
                </div>
                
                <!-- Histórico de Observações Internas -->
                <div class="form-section">
                    <h4>Observações Internas</h4>
                    <div class="internal-notes-container" id="notes-${tab.id}">
                        <!-- Observações internas serão carregadas aqui -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(contentDiv);
    
    // Carregar mensagens e observações
    loadTicketMessagesForTab(tab.id);
    loadTicketInternalNotesForTab(tab.id);
    
    console.log('Conteúdo da aba criado:', tab.id);
}

// Alternar para uma aba
function switchToTab(tabId) {
    console.log('Alternando para aba:', tabId);
    activeTabId = tabId;
    
    // Atualizar abas visuais
    document.querySelectorAll('.ticket-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Atualizar conteúdo
    document.querySelectorAll('.ticket-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`tab-content-${tabId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    console.log('Aba ativada:', tabId);
}

// Fechar aba
function closeTab(tabId) {
    const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    // Remover aba da lista
    openTabs.splice(tabIndex, 1);
    
    // Remover elementos DOM
    document.querySelector(`[data-tab-id="${tabId}"]`).remove();
    document.getElementById(`tab-content-${tabId}`).remove();
    
    // Se era a aba ativa, alternar para outra
    if (activeTabId === tabId) {
        if (openTabs.length > 0) {
            const newActiveTab = openTabs[Math.max(0, tabIndex - 1)];
            switchToTab(newActiveTab.id);
        } else {
            // Fechar sistema de abas se não há mais abas
            closeAllTabs();
        }
    }
    
    updateTabsDisplay();
}

// Fechar todas as abas
function closeAllTabs() {
    openTabs = [];
    activeTabId = null;
    
    document.getElementById('ticketTabsBar').style.display = 'none';
    document.getElementById('ticketTabsContainer').style.display = 'none';
    document.getElementById('tabsList').innerHTML = '';
    document.getElementById('ticketTabsContainer').innerHTML = '';
}

// Atualizar display das abas
function updateTabsDisplay() {
    if (openTabs.length === 0) {
        closeAllTabs();
    }
}

// Salvar ticket de uma aba
function saveTicketFromTab(tabId) {
    console.log('Salvando ticket da aba:', tabId);
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) {
        console.error('Aba não encontrada:', tabId);
        return;
    }
    
    const ticket = tickets.find(t => t.id === tab.ticketId);
    if (!ticket) {
        console.error('Ticket não encontrado:', tab.ticketId);
        return;
    }
    
    console.log('Ticket encontrado:', ticket);
    
    // Atualizar campos editáveis
    const subjectElement = document.getElementById(`subject-${tabId}`);
    const statusElement = document.getElementById(`status-${tabId}`);
    const priorityElement = document.getElementById(`priority-${tabId}`);
    
    if (subjectElement) {
        ticket.subject = subjectElement.value;
        console.log('Assunto atualizado:', ticket.subject);
    } else {
        console.error('Campo subject não encontrado');
    }
    
    if (statusElement) {
        ticket.status = statusElement.value;
        console.log('Status atualizado:', ticket.status);
    } else {
        console.error('Campo status não encontrado');
    }
    
    if (priorityElement) {
        ticket.priority = priorityElement.value;
        console.log('Prioridade atualizada:', ticket.priority);
    } else {
        console.error('Campo priority não encontrado');
    }
    
    // Atualizar título da aba
    tab.title = `#${ticket.id} - ${ticket.subject.substring(0, 30)}${ticket.subject.length > 30 ? '...' : ''}`;
    document.querySelector(`[data-tab-id="${tabId}"] .ticket-tab-title`).textContent = tab.title;
    
    localStorage.setItem('velodesk_tickets', JSON.stringify(tickets));
    console.log('Ticket salvo no localStorage com sucesso!');
    
    // Recarregar visualizações
    if (currentTab === 'list') {
        loadTickets();
    } else if (currentTab === 'kanban') {
        loadKanbanView();
    }
    updateDashboard();
    
    // Mostrar feedback
    const saveBtn = document.querySelector(`#tab-content-${tabId} .btn-primary`);
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Salvo!';
    saveBtn.style.background = 'var(--success)';
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
    }, 2000);
}

// Lidar com novo ticket
function handleNewTicket(e) {
    e.preventDefault();
    
    const subject = document.getElementById('ticketSubject').value;
    const description = document.getElementById('ticketDescription').value;
    const priority = document.getElementById('ticketPriority').value;
    
    const newTicket = {
        id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
        subject: subject,
        description: description,
        status: TICKET_STATUS.NOVO,
        priority: priority,
        createdDate: new Date(),
        user: currentUser.name
    };
    
    tickets.push(newTicket);
    localStorage.setItem('velodesk_tickets', JSON.stringify(tickets));
    
    // Limpar formulário
    document.getElementById('newTicketForm').reset();
    
    // Navegar para lista de tickets
    navigateToPage('tickets');
    updateDashboard();
}

// Filtrar tickets
function filterTickets() {
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredTickets = tickets;
    
    // Filtrar por texto
    if (searchTerm) {
        filteredTickets = filteredTickets.filter(ticket => 
            ticket.subject.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar por status
    if (statusFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
    }
    
    // Atualizar visualização baseada na aba ativa
    if (currentTab === 'list') {
        // Atualizar lista
        const ticketsList = document.getElementById('ticketsList');
        ticketsList.innerHTML = '';
        
        if (filteredTickets.length === 0) {
            ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket encontrado com os filtros aplicados.</div>';
            return;
        }
        
        filteredTickets.forEach(ticket => {
            const ticketElement = createTicketElement(ticket);
            ticketsList.appendChild(ticketElement);
        });
    } else if (currentTab === 'kanban') {
        // Recarregar kanban com filtros
        loadKanbanView();
    }
}

// Funções auxiliares
function getStatusText(status) {
    const statusTexts = {
        [TICKET_STATUS.NOVO]: 'Novo',
        [TICKET_STATUS.EM_ABERTO]: 'Em Aberto',
        [TICKET_STATUS.EM_ESPERA]: 'Em Espera',
        [TICKET_STATUS.PENDENTE]: 'Pendente',
        [TICKET_STATUS.RESOLVIDO]: 'Resolvido'
    };
    return statusTexts[status] || status;
}

function getPriorityText(priority) {
    const priorityTexts = {
        [TICKET_PRIORITY.BAIXA]: 'Baixa',
        [TICKET_PRIORITY.MEDIA]: 'Média',
        [TICKET_PRIORITY.ALTA]: 'Alta'
    };
    return priorityTexts[priority] || priority;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Inicializar colunas do kanban
function initializeKanbanColumns() {
    console.log('Inicializando colunas do kanban...');
    const savedColumns = localStorage.getItem('velodesk_columns');
    console.log('Dados brutos do localStorage:', savedColumns);
    
    if (savedColumns) {
        try {
            kanbanColumns = JSON.parse(savedColumns);
            console.log('Colunas carregadas do localStorage:', kanbanColumns);
            console.log('Número de colunas carregadas:', kanbanColumns.length);
        } catch (error) {
            console.error('Erro ao fazer parse das colunas:', error);
            console.log('Criando colunas padrão devido ao erro...');
            createDefaultColumns();
        }
    } else {
        console.log('Nenhuma coluna salva encontrada. Criando colunas padrão...');
        createDefaultColumns();
    }
}

function createDefaultColumns() {
    // Caixas padrão simplificadas
    kanbanColumns = [
        { id: 1, name: 'Novos', status: TICKET_STATUS.NOVO, color: '#17a2b8' },
        { id: 2, name: 'Em Andamento', status: TICKET_STATUS.EM_ABERTO, color: '#ffc107' },
        { id: 3, name: 'Finalizadas', status: TICKET_STATUS.RESOLVIDO, color: '#28a745' }
    ];
    localStorage.setItem('velodesk_columns', JSON.stringify(kanbanColumns));
    console.log('Colunas padrão criadas:', kanbanColumns);
}

// Alternar entre abas
function switchTab(tab) {
    currentTab = tab;
    
    // Atualizar botões das abas
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Mostrar conteúdo da aba correspondente
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'list') {
        document.getElementById('listTab').classList.add('active');
        loadTickets();
    } else if (tab === 'kanban') {
        document.getElementById('kanbanTab').classList.add('active');
        loadKanbanView();
    }
}

// Carregar visualização kanban
function loadKanbanView() {
    const kanbanColumnsContainer = document.getElementById('kanbanColumns');
    kanbanColumnsContainer.innerHTML = '';
    
    // Aplicar filtros
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredTickets = tickets;
    
    if (searchTerm) {
        filteredTickets = filteredTickets.filter(ticket => 
            ticket.subject.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
    }
    
    kanbanColumns.forEach(column => {
        const columnElement = createKanbanColumn(column, filteredTickets);
        kanbanColumnsContainer.appendChild(columnElement);
    });
}

// Criar coluna do kanban
function createKanbanColumn(column, filteredTickets = tickets) {
    const columnDiv = document.createElement('div');
    columnDiv.className = `kanban-column ${column.status}`;
    columnDiv.dataset.status = column.status;
    columnDiv.style.borderTopColor = column.color;
    
    const ticketsInColumn = filteredTickets.filter(ticket => ticket.status === column.status);
    
    columnDiv.innerHTML = `
        <div class="kanban-column-header" style="background: ${column.color}">
            <div class="kanban-column-title">${column.name}</div>
            <div class="kanban-column-count">${ticketsInColumn.length}</div>
        </div>
        <div class="kanban-column-content" data-status="${column.status}">
            ${ticketsInColumn.map(ticket => createKanbanTicket(ticket)).join('')}
        </div>
    `;
    
    // Adicionar event listeners para drag and drop
    const content = columnDiv.querySelector('.kanban-column-content');
    content.addEventListener('dragover', handleDragOver);
    content.addEventListener('drop', handleDrop);
    content.addEventListener('dragenter', handleDragEnter);
    content.addEventListener('dragleave', handleDragLeave);
    
    return columnDiv;
}

// Criar ticket do kanban
function createKanbanTicket(ticket) {
    const priorityClass = `priority-${ticket.priority}`;
    
    return `
        <div class="kanban-ticket" draggable="true" data-ticket-id="${ticket.id}" onclick="openTicketModal(${JSON.stringify(ticket).replace(/"/g, '&quot;')})">
            <div class="kanban-ticket-header">
                <div class="kanban-ticket-id">#${ticket.id}</div>
                <div class="kanban-ticket-priority ${priorityClass}">${getPriorityText(ticket.priority)}</div>
            </div>
            <div class="kanban-ticket-title">${ticket.subject}</div>
            <div class="kanban-ticket-description">${ticket.description}</div>
            <div class="kanban-ticket-footer">
                <div class="kanban-ticket-date">${formatDate(ticket.createdDate)}</div>
            </div>
        </div>
    `;
}

// Event handlers para drag and drop
function handleDragStart(e) {
    draggedTicket = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTicket = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.target.closest('.kanban-column').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.closest('.kanban-column').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    const newStatus = column.dataset.status;
    
    if (draggedTicket && newStatus) {
        const ticketId = parseInt(draggedTicket.dataset.ticketId);
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket && ticket.status !== newStatus) {
            ticket.status = newStatus;
            localStorage.setItem('velodesk_tickets', JSON.stringify(tickets));
            
            // Recarregar visualizações
            if (isListView) {
                loadTickets();
            } else {
                loadKanbanView();
            }
            updateDashboard();
        }
    }
    
    column.classList.remove('drag-over');
}

// Adicionar event listeners para drag and drop
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('kanban-ticket')) {
            handleDragStart(e);
        }
    });
    
    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('kanban-ticket')) {
            handleDragEnd(e);
        }
    });
});

// Modal de nova coluna
function openColumnModal() {
    const modal = document.getElementById('columnModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Modal de coluna não encontrado');
    }
}

function closeColumnModal() {
    const modal = document.getElementById('columnModal');
    if (modal) {
        modal.style.display = 'none';
        const nameInput = document.getElementById('columnName');
        const statusSelect = document.getElementById('columnStatus');
        const colorInput = document.getElementById('columnColor');
        
        if (nameInput) nameInput.value = '';
        if (statusSelect) statusSelect.value = 'novo';
        if (colorInput) colorInput.value = '#0f3460';
    }
}

function saveColumn() {
    const nameInput = document.getElementById('columnName');
    const statusSelect = document.getElementById('columnStatus');
    const colorInput = document.getElementById('columnColor');
    
    if (!nameInput || !statusSelect || !colorInput) {
        console.error('Elementos do formulário de coluna não encontrados');
        return;
    }
    
    const name = nameInput.value;
    const status = statusSelect.value;
    const color = colorInput.value;
    
    if (!name.trim()) {
        alert('Por favor, digite um nome para a coluna.');
        return;
    }
    
    // Verificar se já existe uma coluna com este status
    if (kanbanColumns.some(col => col.status === status)) {
        alert('Já existe uma coluna para este status.');
        return;
    }
    
    const newColumn = {
        id: kanbanColumns.length > 0 ? Math.max(...kanbanColumns.map(c => c.id)) + 1 : 1,
        name: name,
        status: status,
        color: color
    };
    
    kanbanColumns.push(newColumn);
    localStorage.setItem('velodesk_columns', JSON.stringify(kanbanColumns));
    
    closeColumnModal();
    
    if (!isListView) {
        loadKanbanView();
    }
    
    console.log('Nova coluna criada:', newColumn);
}

// Funções de Mensagens e Observações para Abas
function loadTicketMessagesForTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const messages = ticketMessages[tab.ticketId] || [];
    const container = document.getElementById(`messages-${tabId}`);
    
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="no-messages">Nenhuma mensagem ainda.</div>';
        return;
    }
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span>${message.author}</span>
                <span>${formatDate(message.date)}</span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
        container.appendChild(messageDiv);
    });
}

function loadTicketInternalNotesForTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const notes = ticketInternalNotes[tab.ticketId] || [];
    const container = document.getElementById(`notes-${tabId}`);
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="no-notes">Nenhuma observação interna ainda.</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.innerHTML = `
            <div class="note-header">
                <span>${note.author}</span>
                <span>${formatDate(note.date)}</span>
            </div>
            <div class="note-content">${note.content}</div>
        `;
        container.appendChild(noteDiv);
    });
}

function sendMessageFromTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const messageText = document.getElementById(`newMessage-${tabId}`).value.trim();
    if (!messageText) return;
    
    const message = {
        id: Date.now(),
        content: messageText,
        author: currentUser.name,
        date: new Date()
    };
    
    if (!ticketMessages[tab.ticketId]) {
        ticketMessages[tab.ticketId] = [];
    }
    
    ticketMessages[tab.ticketId].push(message);
    localStorage.setItem('velodesk_messages', JSON.stringify(ticketMessages));
    
    document.getElementById(`newMessage-${tabId}`).value = '';
    loadTicketMessagesForTab(tabId);
}

function addNoteFromTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;
    
    const noteText = document.getElementById(`newNote-${tabId}`).value.trim();
    if (!noteText) return;
    
    const note = {
        id: Date.now(),
        content: noteText,
        author: currentUser.name,
        date: new Date()
    };
    
    if (!ticketInternalNotes[tab.ticketId]) {
        ticketInternalNotes[tab.ticketId] = [];
    }
    
    ticketInternalNotes[tab.ticketId].push(note);
    localStorage.setItem('velodesk_internal_notes', JSON.stringify(ticketInternalNotes));
    
    document.getElementById(`newNote-${tabId}`).value = '';
    loadTicketInternalNotesForTab(tabId);
}

// Funções de Configuração
function openTicketConfig() {
    document.getElementById('ticketConfigModal').style.display = 'block';
    loadTicketConfig();
}

function closeTicketConfig() {
    document.getElementById('ticketConfigModal').style.display = 'none';
}

function loadTicketConfig() {
    const savedConfig = localStorage.getItem('velodesk_config');
    if (savedConfig) {
        ticketConfig = JSON.parse(savedConfig);
    }
    
    loadSystemUsers();
    loadConfigForms();
    loadConfigAutomations();
    loadConfigFields();
}

function loadConfigForms() {
    const container = document.getElementById('formsList');
    container.innerHTML = '';
    
    if (ticketConfig.forms.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum formulário configurado.</div>';
        return;
    }
    
    ticketConfig.forms.forEach(form => {
        const formDiv = document.createElement('div');
        formDiv.className = 'form-item';
        formDiv.innerHTML = `
            <div class="item-info">
                <h5>${form.name}</h5>
                <p>${form.description}</p>
            </div>
            <div class="item-actions">
                <button class="edit-item" onclick="editForm(${form.id})">Editar</button>
                <button class="delete-item" onclick="deleteForm(${form.id})">Excluir</button>
            </div>
        `;
        container.appendChild(formDiv);
    });
}

function loadConfigAutomations() {
    const container = document.getElementById('automationRules');
    container.innerHTML = '';
    
    if (ticketConfig.automations.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhuma automação configurada.</div>';
        return;
    }
    
    ticketConfig.automations.forEach(automation => {
        const autoDiv = document.createElement('div');
        autoDiv.className = 'automation-item';
        autoDiv.innerHTML = `
            <div class="item-info">
                <h5>${automation.name}</h5>
                <p>${automation.description}</p>
            </div>
            <div class="item-actions">
                <button class="edit-item" onclick="editAutomation(${automation.id})">Editar</button>
                <button class="delete-item" onclick="deleteAutomation(${automation.id})">Excluir</button>
            </div>
        `;
        container.appendChild(autoDiv);
    });
}

function loadConfigFields() {
    const container = document.getElementById('customFields');
    container.innerHTML = '';
    
    if (ticketConfig.customFields.length === 0) {
        container.innerHTML = '<div class="no-items">Nenhum campo personalizado configurado.</div>';
        return;
    }
    
    ticketConfig.customFields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item';
        fieldDiv.innerHTML = `
            <div class="item-info">
                <h5>${field.name}</h5>
                <p>Tipo: ${field.type}</p>
            </div>
            <div class="item-actions">
                <button class="edit-item" onclick="editField(${field.id})">Editar</button>
                <button class="delete-item" onclick="deleteField(${field.id})">Excluir</button>
            </div>
        `;
        container.appendChild(fieldDiv);
    });
}

// Funções do Modal Nova Caixa
let boxUsers = [];

function openNewBoxModal() {
    console.log('Abrindo modal nova caixa...');
    boxUsers = [];
    
    const modal = document.getElementById('newBoxModal');
    if (!modal) {
        console.error('Modal newBoxModal não encontrado!');
        return;
    }
    
    modal.style.display = 'block';
    document.getElementById('boxName').value = '';
    document.getElementById('boxStatus').value = 'novo';
    document.getElementById('boxColor').value = '#000058';
    document.getElementById('boxDescription').value = '';
    document.getElementById('newUserEmail').value = '';
    updateUsersList();
    
    console.log('Modal nova caixa aberto com sucesso!');
}

function closeNewBoxModal() {
    console.log('Fechando modal nova caixa...');
    const modal = document.getElementById('newBoxModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal fechado com sucesso');
    } else {
        console.error('Modal newBoxModal não encontrado para fechar!');
    }
    boxUsers = [];
}

function addUserToBox() {
    const email = document.getElementById('newUserEmail').value.trim();
    if (!email) {
        alert('Por favor, digite um email válido.');
        return;
    }
    
    if (boxUsers.includes(email)) {
        alert('Este usuário já foi adicionado.');
        return;
    }
    
    boxUsers.push(email);
    document.getElementById('newUserEmail').value = '';
    updateUsersList();
}

function removeUserFromBox(email) {
    boxUsers = boxUsers.filter(user => user !== email);
    updateUsersList();
}

function updateUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    if (boxUsers.length === 0) {
        usersList.innerHTML = '<div class="no-users">Nenhum usuário adicionado</div>';
        return;
    }
    
    boxUsers.forEach(email => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <span class="user-email">${email}</span>
            <button class="remove-user" onclick="removeUserFromBox('${email}')">Remover</button>
        `;
        usersList.appendChild(userDiv);
    });
}

function saveNewBox() {
    console.log('Função saveNewBox chamada!');
    
    const name = document.getElementById('boxName').value.trim();
    const status = document.getElementById('boxStatus').value;
    const color = document.getElementById('boxColor').value;
    const description = document.getElementById('boxDescription').value.trim();
    
    console.log('Dados da caixa:', { name, status, color, description, users: boxUsers });
    
    if (!name) {
        alert('Por favor, digite um nome para a caixa.');
        return;
    }
    
    // Verificar se já existe uma caixa com este status
    if (kanbanColumns.some(col => col.status === status)) {
        alert('Já existe uma caixa para este status.');
        return;
    }
    
    // Gerar ID único para a nova caixa
    const newId = kanbanColumns.length > 0 ? Math.max(...kanbanColumns.map(c => c.id)) + 1 : 1;
    console.log('Novo ID gerado:', newId);
    
    const newBox = {
        id: newId,
        name: name,
        status: status,
        color: color,
        description: description,
        users: [...boxUsers]
    };
    
    console.log('Nova caixa criada:', newBox);
    console.log('kanbanColumns antes:', kanbanColumns);
    
    kanbanColumns.push(newBox);
    localStorage.setItem('velodesk_columns', JSON.stringify(kanbanColumns));
    
    console.log('kanbanColumns depois:', kanbanColumns);
    
    // Verificar se foi salvo corretamente no localStorage
    const savedData = localStorage.getItem('velodesk_columns');
    console.log('Dados salvos no localStorage:', savedData);
    
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Dados parseados do localStorage:', parsedData);
        console.log('Número de caixas salvas:', parsedData.length);
    } else {
        console.error('Erro: Dados não foram salvos no localStorage!');
    }
    
    closeNewBoxModal();
    loadBoxes();
    
    console.log('Nova caixa salva e lista atualizada!');
    alert('Caixa criada com sucesso!');
    
    // Verificação final - recarregar do localStorage para confirmar
    setTimeout(() => {
        const finalCheck = localStorage.getItem('velodesk_columns');
        console.log('Verificação final - dados no localStorage:', finalCheck);
        if (finalCheck) {
            const parsed = JSON.parse(finalCheck);
            console.log('Verificação final - dados parseados:', parsed);
            console.log('Verificação final - número de caixas:', parsed.length);
        }
    }, 1000);
}

// Alternar entre abas de resposta e observação interna
function switchResponseTab(tabId, tabType) {
    console.log('Alternando aba de resposta:', tabType);
    
    // Remover classe active de todos os botões
    const buttons = document.querySelectorAll(`#tab-content-${tabId} .response-tab-btn`);
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Adicionar classe active ao botão clicado
    const activeButton = document.querySelector(`#tab-content-${tabId} .response-tab-btn[data-tab="${tabType}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Ocultar todos os conteúdos
    const contents = document.querySelectorAll(`#tab-content-${tabId} .response-tab-content`);
    contents.forEach(content => content.classList.remove('active'));
    
    // Mostrar conteúdo da aba selecionada
    const activeContent = document.getElementById(`${tabType}-content-${tabId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// Carregar dados do localStorage ao inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIALIZAÇÃO DA APLICAÇÃO ===');
    
    const savedTickets = localStorage.getItem('velodesk_tickets');
    if (savedTickets) {
        tickets = JSON.parse(savedTickets);
        console.log('Tickets carregados:', tickets.length);
    } else {
        loadSampleData();
    }
    
    // Carregar mensagens e observações
    const savedMessages = localStorage.getItem('velodesk_messages');
    if (savedMessages) {
        ticketMessages = JSON.parse(savedMessages);
        console.log('Mensagens carregadas');
    }
    
    const savedNotes = localStorage.getItem('velodesk_internal_notes');
    if (savedNotes) {
        ticketInternalNotes = JSON.parse(savedNotes);
        console.log('Notas carregadas');
    }
    
    // Carregar configurações
    const savedConfig = localStorage.getItem('velodesk_config');
    if (savedConfig) {
        ticketConfig = JSON.parse(savedConfig);
        console.log('Config carregada');
    }
    
    // Carregar caixas
    const savedColumns = localStorage.getItem('velodesk_columns');
    console.log('Caixas salvas no localStorage (bruto):', savedColumns);
    if (savedColumns) {
        kanbanColumns = JSON.parse(savedColumns);
        console.log('Caixas carregadas antes da inicialização:', kanbanColumns);
        console.log('Número de caixas antes da inicialização:', kanbanColumns.length);
    }
    
    // Inicializar colunas do kanban
    initializeKanbanColumns();
    
    console.log('=== FIM DA INICIALIZAÇÃO ===');
    console.log('Caixas finais após inicialização:', kanbanColumns);
    console.log('Número de caixas finais:', kanbanColumns.length);
    
    // Carregar usuários
    loadSystemUsers();
});

// ===== SISTEMA DE USUÁRIOS =====

// Carregar usuários do sistema
function loadSystemUsers() {
    console.log('Carregando usuários do sistema...');
    const savedUsers = localStorage.getItem('velodesk_users');
    if (savedUsers) {
        systemUsers = JSON.parse(savedUsers);
        console.log('Usuários carregados:', systemUsers.length);
    } else {
        // Criar usuário administrador padrão
        systemUsers = [
            {
                id: 1,
                name: 'Administrador',
                email: 'admin@velodesk.com',
                phone: '',
                accessLevel: 'administrador',
                password: 'admin123',
                createdAt: new Date()
            }
        ];
        localStorage.setItem('velodesk_users', JSON.stringify(systemUsers));
        console.log('Usuário administrador padrão criado');
    }
    
    renderUsersList();
}

// Renderizar lista de usuários
function renderUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    if (systemUsers.length === 0) {
        usersList.innerHTML = '<div class="no-users">Nenhum usuário cadastrado</div>';
        return;
    }
    
    systemUsers.forEach(user => {
        const userElement = createUserElement(user);
        usersList.appendChild(userElement);
    });
}

// Criar elemento de usuário
function createUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'user-item';
    userDiv.dataset.userId = user.id;
    
    userDiv.innerHTML = `
        <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
            ${user.phone ? `<div class="user-phone">${user.phone}</div>` : ''}
            <div class="user-access-level ${user.accessLevel}">${user.accessLevel}</div>
        </div>
        <div class="user-actions">
            <button class="user-action-btn edit-user-btn" onclick="editUser(${user.id})">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="user-action-btn delete-user-btn" onclick="deleteUser(${user.id})">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    
    return userDiv;
}

// Abrir modal de usuário
function openUserModal(userId = null) {
    console.log('Abrindo modal de usuário:', userId);
    currentEditingUser = userId;
    
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error('Modal de usuário não encontrado');
        return;
    }
    
    modal.style.display = 'block';
    
    // Limpar campos
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userAccessLevel').value = 'usuario';
    document.getElementById('userPassword').value = '';
    
    // Se editando, preencher campos
    if (userId) {
        const user = systemUsers.find(u => u.id === userId);
        if (user) {
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userAccessLevel').value = user.accessLevel;
            document.getElementById('userPassword').placeholder = 'Deixe em branco para manter a senha atual';
        }
    }
}

// Fechar modal de usuário
function closeUserModal() {
    console.log('Fechando modal de usuário');
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingUser = null;
}

// Salvar usuário
function saveUser() {
    console.log('Salvando usuário...');
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const accessLevel = document.getElementById('userAccessLevel').value;
    const password = document.getElementById('userPassword').value;
    
    if (!name || !email || !accessLevel) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Verificar se email já existe (exceto se editando o mesmo usuário)
    const existingUser = systemUsers.find(u => u.email === email && u.id !== currentEditingUser);
    if (existingUser) {
        alert('Este e-mail já está cadastrado para outro usuário.');
        return;
    }
    
    if (currentEditingUser) {
        // Editando usuário existente
        const userIndex = systemUsers.findIndex(u => u.id === currentEditingUser);
        if (userIndex !== -1) {
            systemUsers[userIndex].name = name;
            systemUsers[userIndex].email = email;
            systemUsers[userIndex].phone = phone;
            systemUsers[userIndex].accessLevel = accessLevel;
            
            // Atualizar senha apenas se fornecida
            if (password) {
                systemUsers[userIndex].password = password;
            }
            
            console.log('Usuário atualizado:', systemUsers[userIndex]);
        }
    } else {
        // Criando novo usuário
        const newUser = {
            id: systemUsers.length > 0 ? Math.max(...systemUsers.map(u => u.id)) + 1 : 1,
            name: name,
            email: email,
            phone: phone,
            accessLevel: accessLevel,
            password: password,
            createdAt: new Date()
        };
        
        systemUsers.push(newUser);
        console.log('Novo usuário criado:', newUser);
    }
    
    // Salvar no localStorage
    localStorage.setItem('velodesk_users', JSON.stringify(systemUsers));
    console.log('Usuários salvos no localStorage');
    
    // Atualizar lista
    renderUsersList();
    
    // Fechar modal
    closeUserModal();
    
    alert(currentEditingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
}

// Editar usuário
function editUser(userId) {
    console.log('Editando usuário:', userId);
    openUserModal(userId);
}

// Excluir usuário
function deleteUser(userId) {
    console.log('Excluindo usuário:', userId);
    
    const user = systemUsers.find(u => u.id === userId);
    if (!user) {
        alert('Usuário não encontrado.');
        return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
        systemUsers = systemUsers.filter(u => u.id !== userId);
        localStorage.setItem('velodesk_users', JSON.stringify(systemUsers));
        renderUsersList();
        alert('Usuário excluído com sucesso!');
    }
}

// Verificar se a função está definida
alert('Script carregado! Função fazerLogin existe: ' + (typeof fazerLogin === 'function'));

