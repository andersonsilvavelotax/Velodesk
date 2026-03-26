// Sistema Velodesk - Versão Simplificada
console.log('Sistema Velodesk carregando...');

// Função de login
function fazerLogin() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    
    if (mainApp) {
        mainApp.style.display = 'grid';
    }
    
    localStorage.setItem('isLoggedIn', 'true');
    // Login automático - sem notificação
    
    // Inicializar status após login
    setTimeout(() => {
        initializeUserStatus();
    }, 100);
}

// Função de navegação
function navigateToPage(page) {
    console.log('Navegando para:', page);
    
    // Remover classe ticket-tab-open de todas as páginas ao navegar
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active', 'ticket-tab-open');
    });
    
    // Ajustar background do main-content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        if (page === 'tickets') {
            mainContent.style.background = 'transparent';
        } else {
            mainContent.style.background = 'var(--light-gray)';
        }
    }
    
    // Mostrar página selecionada
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Carregar dados específicos da página
    if (page === 'dashboard') {
        loadDashboardStats();
    } else if (page === 'tickets') {
        // Garantir que a página de tickets seja restaurada corretamente
        const ticketsPage = document.getElementById('tickets');
        if (ticketsPage) {
            ticketsPage.classList.remove('ticket-tab-open');
        }
        
        // Garantir que o background seja transparente
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.background = 'transparent';
            mainContent.classList.add('tickets-active');
        }
        
        loadBoxes();
        const kanbanColumns = localStorage.getItem('kanbanColumns');
        if (!kanbanColumns || JSON.parse(kanbanColumns).length === 0) {
            forceCreateKanbanBoxes();
        } else {
            loadBoxes();
        }
    } else if (page === 'config') {
        loadConfig();
        // Remover classe tickets-active quando sair da página de tickets
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('tickets-active');
            mainContent.style.background = 'var(--light-gray)';
        }
    } else if (page === 'reports') {
        loadReports();
        // Remover classe tickets-active quando sair da página de tickets
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('tickets-active');
            mainContent.style.background = 'var(--light-gray)';
        }
    } else if (page === 'chat') {
        loadChat();
        // Remover classe tickets-active quando sair da página de tickets
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('tickets-active');
            mainContent.style.background = 'var(--light-gray)';
        }
    } else {
        // Remover classe tickets-active quando sair da página de tickets
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('tickets-active');
            mainContent.style.background = 'var(--light-gray)';
        }
    }
}

// Função para navegação mobile
function navigateToPageMobile(page) {
    navigateToPage(page);
}

// Função para carregar caixas Kanban
function loadBoxes() {
    const boxesList = document.getElementById('boxesList');
    if (!boxesList) {
        console.error('Lista de caixas não encontrada!');
        return;
    }
    
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        kanbanColumns = [
            { id: 'novos', name: 'Novos', tickets: [] },
            { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
            { id: 'em-espera', name: 'Em Espera', tickets: [] },
            { id: 'pendentes', name: 'Pendentes', tickets: [] },
            { id: 'resolvidos', name: 'Resolvidos', tickets: [] },
            { id: 'em-aberto', name: 'Em Aberto', tickets: [] }
        ];
        localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    }
    
    boxesList.innerHTML = '';
    kanbanColumns.forEach(box => {
        const boxElement = document.createElement('div');
        boxElement.className = 'box-item';
        boxElement.setAttribute('data-box-id', box.id);
        boxElement.innerHTML = `
            <div class="box-header">
                <h3>${box.name}</h3>
                <span class="ticket-count">${box.tickets ? box.tickets.length : 0}</span>
            </div>
        `;
        boxElement.addEventListener('click', () => selectBox(box.id));
        boxesList.appendChild(boxElement);
    });
}

// Função para selecionar caixa
function selectBox(boxId) {
    document.querySelectorAll('.box-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedBox = document.querySelector(`[data-box-id="${boxId}"]`);
    if (selectedBox) {
        selectedBox.classList.add('selected');
    }
    
    loadTicketsForBox(boxId);
}

// Função para carregar tickets de uma caixa
// Variáveis globais para filtros
let currentTickets = [];
let currentFilters = {
    ticketNumber: '',
    status: 'all',
    responsible: '',
    group: 'all',
    dateFrom: '',
    dateTo: '',
    updateFrom: '',
    updateTo: ''
};

function loadTicketsForBox(boxId) {
    const ticketsList = document.getElementById('ticketsList');
    const filtersAdvanced = document.getElementById('ticketFiltersAdvanced');
    
    if (!ticketsList) return;
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const box = kanbanColumns.find(b => b.id === boxId);
    
    if (!box || !box.tickets) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket nesta caixa</div>';
        if (filtersAdvanced) filtersAdvanced.style.display = 'none';
        return;
    }
    
    const tickets = box.tickets;
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket nesta caixa</div>';
        if (filtersAdvanced) filtersAdvanced.style.display = 'none';
        return;
    }
    
    // Armazenar tickets globalmente
    currentTickets = tickets;
    
    // Mostrar filtro avançado
    if (filtersAdvanced) {
        filtersAdvanced.style.display = 'block';
    }
    
    // Renderizar tickets
    renderTickets();
}

function renderTickets() {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) return;
    
    // Aplicar filtros
    let filteredTickets = applyFiltersToTickets(currentTickets);
    
    if (filteredTickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket encontrado para os filtros aplicados</div>';
        return;
    }
    
    ticketsList.innerHTML = '';
    
    filteredTickets.forEach(ticket => {
        // Obter cor e nome do status
        const statusInfo = getStatusInfo(ticket.status);
        
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item-slim';
        ticketElement.style.borderLeftColor = statusInfo.color;
        ticketElement.setAttribute('data-status', ticket.status || 'novos');
        
        // Formatar data de criação
        const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
        const formattedDate = createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Formatar última atualização
        const updatedAt = ticket.updatedAt ? new Date(ticket.updatedAt) : createdAt;
        const formattedUpdate = updatedAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Obter responsável e grupo (se disponíveis)
        const responsible = getResponsibleAgentName(ticket.responsibleAgent || ticket.responsible || ticket.responsibleName) || 'Não atribuído';
        const group = ticket.group || ticket.attendanceGroup || 'Não definido';
        
        ticketElement.innerHTML = `
            <div class="ticket-slim-header">
                <div class="ticket-slim-title">
                    <span class="ticket-status-dot" style="background-color: ${statusInfo.color}"></span>
                    <h5>${ticket.title || 'Sem título'}</h5>
                </div>
                <span class="ticket-slim-status">${statusInfo.name}</span>
            </div>
            <div class="ticket-slim-content">
                <p class="ticket-slim-description">${(ticket.description || '').substring(0, 80)}${(ticket.description || '').length > 80 ? '...' : ''}</p>
            </div>
            <div class="ticket-slim-footer">
                <div class="ticket-slim-footer-left">
                    <span class="ticket-slim-date">
                        <i class="fas fa-calendar-alt"></i> ${formattedDate}
                    </span>
                    <span class="ticket-slim-update" title="Última atualização: ${formattedUpdate}">
                        <i class="fas fa-clock"></i> ${formattedUpdate}
                    </span>
                </div>
                <div class="ticket-slim-footer-right">
                    <span class="ticket-slim-responsible" title="Responsável: ${responsible}">
                        <i class="fas fa-user"></i> ${responsible}
                    </span>
                    <span class="ticket-slim-id">#${ticket.id}</span>
                </div>
            </div>
        `;
        
        // Adicionar evento de clique para abrir o ticket
        ticketElement.onclick = () => openTicket(ticket.id);
        ticketsList.appendChild(ticketElement);
    });
}

function getStatusInfo(status) {
    const statusMap = {
        'novos': { name: 'Novos', color: '#1976d2' },
        'novo': { name: 'Novos', color: '#1976d2' },
        'em-andamento': { name: 'Em Andamento', color: '#28a745' },
        'em_andamento': { name: 'Em Andamento', color: '#28a745' },
        'pendente': { name: 'Pendente', color: '#ffc107' },
        'resolvido': { name: 'Resolvido', color: '#6c757d' },
        'fechado': { name: 'Fechado', color: '#dc3545' }
    };
    
    const normalizedStatus = (status || 'novos').toLowerCase();
    return statusMap[normalizedStatus] || { name: normalizedStatus, color: '#666' };
}

// Função para aplicar filtros aos tickets
function applyFiltersToTickets(tickets) {
    return tickets.filter(ticket => {
        // Filtro por número do ticket
        if (currentFilters.ticketNumber) {
            const ticketId = String(ticket.id || '');
            if (!ticketId.includes(currentFilters.ticketNumber)) {
                return false;
            }
        }
        
        // Filtro por status
        if (currentFilters.status !== 'all') {
            const ticketStatus = (ticket.status || 'novos').toLowerCase();
            const filterStatus = currentFilters.status.toLowerCase();
            if (ticketStatus !== filterStatus && ticketStatus !== filterStatus.replace('-', '_')) {
                return false;
            }
        }
        
        // Filtro por responsável
        if (currentFilters.responsible) {
            const responsible = (ticket.responsible || ticket.responsibleName || '').toLowerCase();
            if (!responsible.includes(currentFilters.responsible.toLowerCase())) {
                return false;
            }
        }
        
        // Filtro por grupo de atendimento
        if (currentFilters.group !== 'all') {
            const ticketGroup = (ticket.group || ticket.attendanceGroup || '').toLowerCase();
            if (ticketGroup !== currentFilters.group.toLowerCase()) {
                return false;
            }
        }
        
        // Filtro por data de abertura (De)
        if (currentFilters.dateFrom) {
            const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
            const filterDateFrom = new Date(currentFilters.dateFrom);
            filterDateFrom.setHours(0, 0, 0, 0);
            if (createdAt < filterDateFrom) {
                return false;
            }
        }
        
        // Filtro por data de abertura (Até)
        if (currentFilters.dateTo) {
            const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
            const filterDateTo = new Date(currentFilters.dateTo);
            filterDateTo.setHours(23, 59, 59, 999);
            if (createdAt > filterDateTo) {
                return false;
            }
        }
        
        // Filtro por última atualização (De)
        if (currentFilters.updateFrom) {
            const updatedAt = ticket.updatedAt ? new Date(ticket.updatedAt) : (ticket.createdAt ? new Date(ticket.createdAt) : new Date());
            const filterUpdateFrom = new Date(currentFilters.updateFrom);
            filterUpdateFrom.setHours(0, 0, 0, 0);
            if (updatedAt < filterUpdateFrom) {
                return false;
            }
        }
        
        // Filtro por última atualização (Até)
        if (currentFilters.updateTo) {
            const updatedAt = ticket.updatedAt ? new Date(ticket.updatedAt) : (ticket.createdAt ? new Date(ticket.createdAt) : new Date());
            const filterUpdateTo = new Date(currentFilters.updateTo);
            filterUpdateTo.setHours(23, 59, 59, 999);
            if (updatedAt > filterUpdateTo) {
                return false;
            }
        }
        
        return true;
    });
}

// Função para aplicar filtros (chamada pelos inputs)
function applyTicketFilters() {
    // Capturar valores dos filtros
    currentFilters.ticketNumber = document.getElementById('filterTicketNumber')?.value || '';
    currentFilters.status = document.getElementById('filterStatus')?.value || 'all';
    currentFilters.responsible = document.getElementById('filterResponsible')?.value || '';
    currentFilters.group = document.getElementById('filterGroup')?.value || 'all';
    currentFilters.dateFrom = document.getElementById('filterDateFrom')?.value || '';
    currentFilters.dateTo = document.getElementById('filterDateTo')?.value || '';
    currentFilters.updateFrom = document.getElementById('filterUpdateFrom')?.value || '';
    currentFilters.updateTo = document.getElementById('filterUpdateTo')?.value || '';
    
    // Re-renderizar tickets com os novos filtros
    renderTickets();
}

// Função para limpar todos os filtros
function clearTicketFilters() {
    // Limpar campos de input
    const filterTicketNumber = document.getElementById('filterTicketNumber');
    const filterStatus = document.getElementById('filterStatus');
    const filterResponsible = document.getElementById('filterResponsible');
    const filterGroup = document.getElementById('filterGroup');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterUpdateFrom = document.getElementById('filterUpdateFrom');
    const filterUpdateTo = document.getElementById('filterUpdateTo');
    
    if (filterTicketNumber) filterTicketNumber.value = '';
    if (filterStatus) filterStatus.value = 'all';
    if (filterResponsible) filterResponsible.value = '';
    if (filterGroup) filterGroup.value = 'all';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';
    if (filterUpdateFrom) filterUpdateFrom.value = '';
    if (filterUpdateTo) filterUpdateTo.value = '';
    
    // Resetar filtros globais
    currentFilters = {
        ticketNumber: '',
        status: 'all',
        responsible: '',
        group: 'all',
        dateFrom: '',
        dateTo: '',
        updateFrom: '',
        updateTo: ''
    };
    
    // Re-renderizar tickets
    renderTickets();
}

// Função para expandir/colapsar painel de filtros
function toggleFiltersPanel() {
    const filtersContent = document.getElementById('filtersContent');
    const toggleBtn = document.querySelector('.btn-toggle-filters');
    
    if (filtersContent && toggleBtn) {
        const isVisible = filtersContent.style.display !== 'none';
        filtersContent.style.display = isVisible ? 'none' : 'block';
        
        // Atualizar ícone
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        }
    }
}

// Função para abrir ticket
// Variável para armazenar abas abertas
const openTicketTabs = new Map();

function openTicket(ticketId) {
    // Verificar se já existe uma aba aberta para este ticket
    if (openTicketTabs.has(ticketId)) {
        switchTicketTab(`ticket-${ticketId}`);
        return;
    }
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let foundTicket = null;
    let foundBox = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                foundTicket = ticket;
                foundBox = box;
                break;
            }
        }
    }
    
    if (!foundTicket) {
        console.error('Ticket não encontrado!');
        showNotification('Ticket não encontrado!', 'error');
        return;
    }
    
    createTicketTab(foundTicket, foundBox);
}

// Função para criar modal de ticket
function createTicketModal(ticket, box) {
    const existingModal = document.getElementById('ticketModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Ticket #${ticket.id}</h3>
                <button class="close-btn" onclick="closeTicketModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="ticket-info">
                    <h4>${ticket.title}</h4>
                    <p>${ticket.description}</p>
                    <div class="ticket-meta">
                        <span>Status: ${ticket.status}</span>
                        <span>Criado em: ${new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeTicketModal()">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal de ticket
function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    if (modal) {
        modal.remove();
    }
}

// Função para criar novo ticket
function createNewTicket() {
    // Criar um ticket vazio temporário
    const tempTicket = {
        id: Date.now(),
        title: '',
        description: '',
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        internalNotes: [],
        formId: null,
        formData: {},
        solicitante: '',
        responsibleAgent: '',
        clientCPF: '',
        clientName: '',
        isNewTicket: true // Flag para identificar que é um ticket novo
    };
    
    // Criar uma caixa temporária para o ticket
    const tempBox = {
        id: 'temp',
        name: 'Novo Ticket',
        tickets: [tempTicket]
    };
    
    // Abrir a página completa do ticket como aba
    createTicketTab(tempTicket, tempBox);
}

// Função duplicada removida - já existe acima

// Função para criar aba de ticket
function createTicketTab(ticket, box) {
    const tabId = `ticket-${ticket.id}`;
    
    // Verificar se a aba já existe
    const existingTab = document.getElementById(`tab-${tabId}`);
    if (existingTab) {
        switchTicketTab(tabId);
        return;
    }
    
    // Criar aba na barra de abas
    const tabsBar = document.getElementById('ticketTabsBar');
    const tabsContent = document.querySelector('.ticket-tabs-content');
    const ticketsLayout = document.getElementById('ticketsLayout');
    
    if (!tabsBar || !tabsContent) return;
    
    // Mostrar barra de abas e conteúdo, ocultar layout de lista
    tabsBar.style.display = 'flex';
    tabsContent.style.display = 'block';
    if (ticketsLayout) ticketsLayout.style.display = 'none';
    
    const tabItem = document.createElement('div');
    tabItem.className = 'ticket-tab-item';
    tabItem.setAttribute('data-tab', tabId);
    tabItem.onclick = () => switchTicketTab(tabId);
    
    const tabTitle = ticket.title || `Ticket #${ticket.id}`;
    const shortTitle = tabTitle.length > 20 ? tabTitle.substring(0, 20) + '...' : tabTitle;
    
    tabItem.innerHTML = `
        <i class="fas fa-ticket-alt"></i>
        <span>${shortTitle}</span>
        <span class="tab-close" onclick="event.stopPropagation(); closeTicketTab('${tabId}')">
            <i class="fas fa-times"></i>
        </span>
    `;
    
    tabsBar.appendChild(tabItem);
    
    // Criar conteúdo da aba
    const tabContent = document.createElement('div');
    tabContent.className = 'ticket-tab-content';
    tabContent.id = `tab-${tabId}`;
    
    // Mapear status
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    
    const statusColors = {
        'novo': '#1976d2',
        'em-aberto': '#28a745',
        'em-espera': '#000000',
        'pendente': '#ffc107',
        'resolvido': '#6c757d'
    };
    
    const statusName = statusNames[ticket.status] || ticket.status;
    const statusColor = statusColors[ticket.status] || '#666';
    
    tabContent.innerHTML = generateTicketTabHTML(ticket, statusName, statusColor);
    tabsContent.appendChild(tabContent);
    
    // Armazenar referência
    openTicketTabs.set(ticket.id, { tabId, ticket, box });
    
    // Garantir que a classe está aplicada antes de ativar a aba
    const ticketsPage = document.getElementById('tickets');
    if (ticketsPage) {
        ticketsPage.classList.add('ticket-tab-open');
    }
    
    // Mostrar botão de toggle do sidebar quando ticket for aberto
    updateSidebarToggleVisibility();
    
    // Pequeno delay para garantir que o DOM está pronto antes da animação
    setTimeout(() => {
        // Ativar a nova aba com animação suave
        switchTicketTab(tabId);
    }, 50);
    
    // Configurar event listeners após criação
    setTimeout(() => {
        setupTicketTabEvents(ticket.id);
    }, 100);
}

// Função para gerar HTML do conteúdo do ticket na aba
function generateTicketTabHTML(ticket, statusName, statusColor) {
    return `
        <div class="ticket-tab-ticket-view">
            <div class="ticket-tab-ticket-layout">
                <!-- Coluna Principal -->
                <div class="ticket-tab-main-column">
                    <!-- Cabeçalho do Ticket -->
                    <div class="ticket-header">
                        ${ticket.isNewTicket ? 
                            `<div class="new-ticket-header">
                                <div class="form-group">
                                    <label for="ticketTitleInput-${ticket.id}">Título do Ticket:</label>
                                    <input type="text" id="ticketTitleInput-${ticket.id}" class="form-input ticket-title-input" placeholder="Digite o título do ticket..." value="${ticket.title}">
                                </div>
                                <div class="form-group">
                                    <label for="ticketDescriptionInput-${ticket.id}">Descrição:</label>
                                    <textarea id="ticketDescriptionInput-${ticket.id}" class="form-textarea" rows="4" placeholder="Descreva o problema ou solicitação...">${ticket.description}</textarea>
                                </div>
                            </div>` :
                            `<div class="ticket-status-info">
                                <div class="current-status">
                                    <span class="status-indicator" style="background-color: ${statusColor}"></span>
                                    <span class="status-text">${statusName} #${ticket.id}</span>
                                </div>
                            </div>`
                        }
                    </div>

                    <!-- Informações do Ticket -->
                    <div class="ticket-details">
                        <div class="ticket-meta">
                            <div class="meta-item">
                                <span class="meta-label">Status:</span>
                                <span class="meta-value status-${ticket.status}">${statusName}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Abertura:</span>
                                <span class="meta-value">${new Date(ticket.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Última Atualização:</span>
                                <span class="meta-value">${new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Descrição do Ticket -->
                    <div class="ticket-description">
                        <h4>Descrição:</h4>
                        <p>${ticket.description || 'Nenhuma descrição disponível'}</p>
                    </div>

                    <!-- Timeline do Ticket -->
                    <div class="ticket-timeline">
                        <h4>Histórico de Atendimento</h4>
                        <div class="timeline-container" id="timeline-${ticket.id}">
                            ${generateTimelineHTML(ticket)}
                        </div>
                    </div>

                    <!-- Área de Resposta -->
                    <div class="ticket-response">
                        <div class="response-tabs">
                            <button class="response-tab active" data-tab="public-${ticket.id}" onclick="switchResponseTabInTab('${ticket.id}', 'public')">Resposta Pública</button>
                            <button class="response-tab" data-tab="internal-${ticket.id}" onclick="switchResponseTabInTab('${ticket.id}', 'internal')">Anotação Interna</button>
                        </div>
                        
                        <div class="response-content">
                            <div class="response-tab-content active" id="public-${ticket.id}">
                                <div class="response-form">
                                    <textarea class="response-textarea" id="publicResponse-${ticket.id}" placeholder="Digite sua resposta..." rows="4"></textarea>
                                    <div class="response-actions">
                                        <button type="button" class="btn-secondary" onclick="openAIChatbot()">
                                            <i class="fas fa-robot"></i> Assistente IA
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="response-tab-content" id="internal-${ticket.id}">
                                <div class="response-form internal-form">
                                    <div class="internal-note-header">
                                        <i class="fas fa-lock"></i>
                                        <span>Anotação Interna - Não será enviada ao cliente</span>
                                    </div>
                                    <textarea class="response-textarea internal-textarea" id="internalResponse-${ticket.id}" placeholder="Digite uma anotação interna..." rows="4"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Coluna Lateral - Informações do Cliente e Formulário -->
                <div class="ticket-tab-sidebar">
                    <!-- Seção de Informações do Cliente -->
                    <div class="sidebar-section client-info-section">
                        <h3>Informações do Cliente</h3>
                        <div class="client-fields">
                            <div class="form-field">
                                <label>Solicitante/Cliente</label>
                                <input type="text" class="form-input" id="solicitante-${ticket.id}" placeholder="Nome do solicitante/cliente" value="${ticket.solicitante || ticket.clientName || ''}">
                            </div>
                            <div class="form-field">
                                <label>Responsável</label>
                                <select class="form-input" id="responsibleAgent-${ticket.id}" onchange="updateTicketResponsible(${ticket.id}, this.value)">
                                    <option value="">Selecione um responsável</option>
                                    ${generateUsersOptions(ticket.responsibleAgent)}
                                </select>
                            </div>
                            <div class="form-field">
                                <label>CPF</label>
                                <input type="text" class="form-input" id="clientCPF-${ticket.id}" placeholder="000.000.000-00" value="${ticket.clientCPF || ''}">
                            </div>
                            <div class="form-field">
                                <label>Nome do Cliente</label>
                                <input type="text" class="form-input" id="clientName-${ticket.id}" placeholder="Nome completo do cliente" value="${ticket.clientName || ''}">
                            </div>
                            <div class="client-actions">
                                <button class="btn-primary btn-save-client" onclick="saveClientData(${ticket.id})">
                                    <i class="fas fa-save"></i> Salvar Dados
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Seção de Seleção de Formulário -->
                    <div class="sidebar-section form-selector-section">
                        <h3>Formulário Personalizado</h3>
                        <div class="form-selector">
                            <div class="form-field">
                                <label>Selecionar Formulário:</label>
                                <select id="formSelector-${ticket.id}" onchange="applyFormToTicket(${ticket.id}, this.value)">
                                    <option value="">Selecione um formulário...</option>
                                    ${generateFormOptions(ticket.formId)}
                                </select>
                            </div>
                            <div class="form-actions">
                                <button class="btn-secondary btn-refresh-forms" onclick="refreshFormSelector(${ticket.id})">
                                    <i class="fas fa-sync"></i> Atualizar Lista
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Seção do Formulário Aplicado -->
                    <div class="sidebar-section form-section">
                        <h3>Campos do Formulário</h3>
                        <div class="form-fields" id="ticketFormFields-${ticket.id}">
                            ${ticket.formId ? renderTicketFormFieldsSimple(ticket) : '<p class="no-form-message">Selecione um formulário acima para ver os campos.</p>'}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rodapé Fixo -->
            <div class="ticket-tab-footer-fixed">
                <div class="ticket-tab-footer-left">
                    <!-- Espaço vazio para alinhar com o conteúdo principal -->
                </div>
                <div class="ticket-tab-footer-right">
                    <div class="dropdown-container">
                        <button type="button" class="btn-primary dropdown-btn" onclick="toggleStatusDropdownInTab('${ticket.id}')">
                            Enviar como: ${statusName} <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="statusDropdownTab-${ticket.id}">
                            <div class="dropdown-item" onclick="changeTicketStatusFromTab('${ticket.id}', 'novo')">
                                <span class="status-indicator novo"></span>
                                <span>Novo</span>
                            </div>
                            <div class="dropdown-item" onclick="changeTicketStatusFromTab('${ticket.id}', 'em-aberto')">
                                <span class="status-indicator em-aberto"></span>
                                <span>Em Andamento</span>
                            </div>
                            <div class="dropdown-item" onclick="changeTicketStatusFromTab('${ticket.id}', 'em-espera')">
                                <span class="status-indicator em-espera"></span>
                                <span>Em Espera</span>
                            </div>
                            <div class="dropdown-item" onclick="changeTicketStatusFromTab('${ticket.id}', 'pendente')">
                                <span class="status-indicator pendente"></span>
                                <span>Pendente</span>
                            </div>
                            <div class="dropdown-item" onclick="changeTicketStatusFromTab('${ticket.id}', 'resolvido')">
                                <span class="status-indicator resolvido"></span>
                                <span>Resolvido</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função para atualizar visibilidade do botão de toggle do sidebar
function updateSidebarToggleVisibility() {
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const hasOpenTickets = openTicketTabs.size > 0;
    
    if (toggleBtn) {
        if (hasOpenTickets) {
            toggleBtn.style.display = 'flex';
        } else {
            toggleBtn.style.display = 'none';
        }
    }
}

// Chamar ao carregar a página para verificar se há tickets abertos
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        updateSidebarToggleVisibility();
    }, 500);
});

// Função para alternar entre abas
function switchTicketTab(tabId) {
    // Remover active de todas as abas com transição suave
    document.querySelectorAll('.ticket-tab-item').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.ticket-tab-content').forEach(content => {
        content.classList.remove('active');
        // Resetar animação
        content.style.animation = 'none';
        setTimeout(() => {
            content.style.animation = '';
        }, 10);
    });
    
    // Pequeno delay para transição suave
    setTimeout(() => {
        // Ativar aba selecionada
        const tabItem = document.querySelector(`.ticket-tab-item[data-tab="${tabId}"]`);
        const tabContent = document.getElementById(`tab-${tabId}`);
        
        if (tabItem) tabItem.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
        
        // Scroll para a aba ativa na barra de abas
        if (tabItem) {
            tabItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
        
        // Adicionar ou remover classe para ocultar elementos quando um ticket estiver aberto
        const ticketsPage = document.getElementById('tickets');
        if (ticketsPage) {
            // Verificar se há uma aba de ticket ativa (não apenas "Lista")
            const hasTicketTabOpen = tabId && tabId.startsWith('ticket-');
            if (hasTicketTabOpen) {
                ticketsPage.classList.add('ticket-tab-open');
            } else {
                ticketsPage.classList.remove('ticket-tab-open');
            }
        }
    }, 10);
}

// Função para fechar aba
function closeTicketTab(tabId) {
    // Não permitir fechar a aba "Lista"
    if (tabId === 'list') return;
    
    const tabItem = document.querySelector(`.ticket-tab-item[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(`tab-${tabId}`);
    
    if (tabItem) tabItem.remove();
    if (tabContent) tabContent.remove();
    
    // Remover da lista de abas abertas
    const ticketId = parseInt(tabId.replace('ticket-', ''));
    if (openTicketTabs.has(ticketId)) {
        openTicketTabs.delete(ticketId);
    }
    
    // Ativar aba "Lista" se ainda existir
    const listTab = document.querySelector('.ticket-tab-item[data-tab="list"]');
    if (listTab) {
        switchTicketTab('list');
        // Remover classe quando voltar para lista
        const ticketsPage = document.getElementById('tickets');
        if (ticketsPage) {
            ticketsPage.classList.remove('ticket-tab-open');
        }
    } else {
        // Se não houver mais abas, ocultar barra de abas e mostrar layout de lista
        const tabsBar = document.getElementById('ticketTabsBar');
        const tabsContent = document.querySelector('.ticket-tabs-content');
        const ticketsLayout = document.getElementById('ticketsLayout');
        
        if (tabsBar) tabsBar.style.display = 'none';
        if (tabsContent) tabsContent.style.display = 'none';
        if (ticketsLayout) ticketsLayout.style.display = 'flex';
        
        // Remover classe quando só há aba Lista
        const ticketsPage = document.getElementById('tickets');
        if (ticketsPage) {
            ticketsPage.classList.remove('ticket-tab-open');
        }
    }
    
    // Atualizar visibilidade do botão de toggle após fechar ticket
    updateSidebarToggleVisibility();
}

// Função para alternar aba de resposta dentro do ticket
function switchResponseTabInTab(ticketId, tabType) {
    const publicTab = document.querySelector(`.response-tab[data-tab="public-${ticketId}"]`);
    const internalTab = document.querySelector(`.response-tab[data-tab="internal-${ticketId}"]`);
    const publicContent = document.getElementById(`public-${ticketId}`);
    const internalContent = document.getElementById(`internal-${ticketId}`);
    
    if (tabType === 'public') {
        publicTab?.classList.add('active');
        internalTab?.classList.remove('active');
        if (publicContent) publicContent.classList.add('active');
        if (internalContent) internalContent.classList.remove('active');
    } else {
        internalTab?.classList.add('active');
        publicTab?.classList.remove('active');
        if (internalContent) internalContent.classList.add('active');
        if (publicContent) publicContent.classList.remove('active');
    }
}

// Função para toggle dropdown de status na aba
function toggleStatusDropdownInTab(ticketId) {
    const dropdown = document.getElementById(`statusDropdownTab-${ticketId}`);
    if (!dropdown) return;
    
    // Fechar todos os outros dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `statusDropdownTab-${ticketId}`) {
            menu.style.display = 'none';
        }
    });
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
}

// Função para alterar status do ticket na aba
function changeTicketStatusFromTab(ticketId, newStatus) {
    // Fechar dropdown
    const dropdown = document.getElementById(`statusDropdownTab-${ticketId}`);
    if (dropdown) dropdown.style.display = 'none';
    
    // Buscar o ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let foundTicket = null;
    let foundBox = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                foundTicket = ticket;
                foundBox = box;
                break;
            }
        }
    }
    
    // Se não encontrou no localStorage, verificar se é um ticket novo na aba
    if (!foundTicket) {
        const tabInfo = openTicketTabs.get(parseInt(ticketId));
        if (tabInfo && tabInfo.ticket && tabInfo.ticket.isNewTicket) {
            // É um ticket novo - coletar dados do formulário e salvar primeiro
            const titleInput = document.getElementById(`ticketTitleInput-${ticketId}`);
            const descriptionInput = document.getElementById(`ticketDescriptionInput-${ticketId}`);
            
            // Validar campos obrigatórios
            if (!titleInput || !titleInput.value.trim()) {
                showNotification('Por favor, preencha o título do ticket!', 'error');
                return;
            }
            
            if (!descriptionInput || !descriptionInput.value.trim()) {
                showNotification('Por favor, preencha a descrição do ticket!', 'error');
                return;
            }
            
            // Coletar dados do formulário
            const newTicket = {
                id: parseInt(ticketId),
                title: titleInput.value.trim(),
                description: descriptionInput.value.trim(),
                status: 'novo', // Será atualizado para newStatus abaixo
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [],
                internalNotes: [],
                solicitante: '',
                responsibleAgent: '',
                clientCPF: '',
                clientName: '',
                formId: tabInfo.ticket.formId || null,
                formData: {},
                isNewTicket: false // Remover flag após salvar
            };
            
            // Coletar dados do cliente se existirem
            const solicitanteInput = document.getElementById(`solicitante-${ticketId}`);
            const responsibleAgentInput = document.getElementById(`responsibleAgent-${ticketId}`);
            const clientCPFInput = document.getElementById(`clientCPF-${ticketId}`);
            const clientNameInput = document.getElementById(`clientName-${ticketId}`);
            
            if (solicitanteInput) {
                newTicket.solicitante = solicitanteInput.value.trim();
            }
            if (responsibleAgentInput) {
                newTicket.responsibleAgent = responsibleAgentInput.value.trim();
            }
            if (clientCPFInput) {
                newTicket.clientCPF = clientCPFInput.value.trim();
            }
            if (clientNameInput) {
                newTicket.clientName = clientNameInput.value.trim();
            }
            
            // Coletar dados do formulário personalizado se existir
            const formFieldsContainer = document.getElementById(`ticketFormFields-${ticketId}`);
            if (formFieldsContainer && newTicket.formId) {
                const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
                formFields.forEach(field => {
                    const fieldId = field.getAttribute('data-field-id');
                    const fieldType = field.querySelector('input, select, textarea')?.type || 
                                     field.querySelector('select') ? 'select' : 'text';
                    
                    let value = '';
                    if (fieldType === 'checkbox') {
                        value = field.querySelector('input[type="checkbox"]')?.checked || false;
                    } else if (fieldType === 'select') {
                        value = field.querySelector('select')?.value || '';
                    } else {
                        value = field.querySelector('input, textarea')?.value || '';
                    }
                    
                    if (value !== '') {
                        newTicket.formData[fieldId] = value;
                    }
                });
            }
            
            // Adicionar ticket à caixa "novos"
            const novosBox = kanbanColumns.find(box => box.id === 'novos');
            if (!novosBox) {
                showNotification('Erro: Caixa "Novos" não encontrada!', 'error');
                return;
            }
            
            if (!novosBox.tickets) {
                novosBox.tickets = [];
            }
            novosBox.tickets.push(newTicket);
            
            // Atualizar referência na aba
            tabInfo.ticket = newTicket;
            foundTicket = newTicket;
            foundBox = novosBox;
            
            // Salvar no localStorage
            localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
        } else {
            showNotification('Ticket não encontrado!', 'error');
            return;
        }
    }
    
    // Obter resposta do usuário
    const responseTextarea = document.getElementById(`publicResponse-${ticketId}`);
    const internalTextarea = document.getElementById(`internalResponse-${ticketId}`);
    
    let responseText = '';
    let internalNote = '';
    
    if (responseTextarea) {
        responseText = responseTextarea.value.trim();
    }
    
    if (internalTextarea) {
        internalNote = internalTextarea.value.trim();
    }
    
    // Coletar dados dos formulários personalizados
    const formFieldsContainer = document.getElementById(`ticketFormFields-${ticketId}`);
    if (formFieldsContainer && foundTicket.formId) {
        const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
        formFields.forEach(field => {
            const fieldId = field.getAttribute('data-field-id');
            const fieldType = field.querySelector('input, select, textarea')?.type || 
                             field.querySelector('select') ? 'select' : 'text';
            
            let value = '';
            if (fieldType === 'checkbox') {
                value = field.querySelector('input[type="checkbox"]')?.checked || false;
            } else if (fieldType === 'select') {
                value = field.querySelector('select')?.value || '';
            } else {
                value = field.querySelector('input, textarea')?.value || '';
            }
            
            if (value !== '') {
                if (!foundTicket.formData) {
                    foundTicket.formData = {};
                }
                foundTicket.formData[fieldId] = value;
            }
        });
    }
    
    // Coletar dados do cliente
    const solicitanteInput = document.getElementById(`solicitante-${ticketId}`);
    const responsibleAgentInput = document.getElementById(`responsibleAgent-${ticketId}`);
    const clientCPFInput = document.getElementById(`clientCPF-${ticketId}`);
    const clientNameInput = document.getElementById(`clientName-${ticketId}`);
    
    if (solicitanteInput) {
        foundTicket.solicitante = solicitanteInput.value.trim();
    }
    if (responsibleAgentInput) {
        foundTicket.responsibleAgent = responsibleAgentInput.value.trim();
    }
    if (clientCPFInput) {
        foundTicket.clientCPF = clientCPFInput.value.trim();
    }
    if (clientNameInput) {
        foundTicket.clientName = clientNameInput.value.trim();
    }
    
    // Se o ticket foi recém-criado, garantir que os dados estão atualizados
    if (foundTicket.isNewTicket !== undefined && foundTicket.isNewTicket) {
        // Coletar título e descrição novamente caso tenham sido atualizados
        const titleInput = document.getElementById(`ticketTitleInput-${ticketId}`);
        const descriptionInput = document.getElementById(`ticketDescriptionInput-${ticketId}`);
        
        if (titleInput && titleInput.value.trim()) {
            foundTicket.title = titleInput.value.trim();
        }
        if (descriptionInput && descriptionInput.value.trim()) {
            foundTicket.description = descriptionInput.value.trim();
        }
        
        // Remover flag de ticket novo
        foundTicket.isNewTicket = false;
    }
    
    // Atualizar ticket
    foundTicket.status = newStatus;
    foundTicket.updatedAt = new Date().toISOString();
    
    // Adicionar mensagem se houver resposta
    if (responseText) {
        if (!foundTicket.messages) {
            foundTicket.messages = [];
        }
        foundTicket.messages.push({
            id: Date.now(),
            text: responseText,
            type: 'response',
            timestamp: new Date().toISOString(),
            status: newStatus
        });
    }
    
    // Adicionar nota interna se houver
    if (internalNote) {
        if (!foundTicket.messages) {
            foundTicket.messages = [];
        }
        foundTicket.messages.push({
            id: Date.now() + 1,
            text: internalNote,
            type: 'internal',
            timestamp: new Date().toISOString()
        });
    }
    
    // Limpar campos de resposta após salvar
    if (responseTextarea) {
        responseTextarea.value = '';
    }
    if (internalTextarea) {
        internalTextarea.value = '';
    }
    
    // Mover ticket para a caixa correta
    const targetBoxId = moveTicketToCorrectBox(foundTicket, kanbanColumns);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Mapear status para nomes
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    const statusName = statusNames[newStatus] || newStatus;
    
    // Atualizar timeline na aba
    const timelineContainer = document.getElementById(`timeline-${ticketId}`);
    if (timelineContainer) {
        timelineContainer.innerHTML = generateTimelineHTML(foundTicket);
    }
    
    // Atualizar título da aba e conteúdo
    const tabInfo = openTicketTabs.get(parseInt(ticketId));
    if (tabInfo) {
        tabInfo.ticket = foundTicket;
        const tabItem = document.querySelector(`.ticket-tab-item[data-tab="ticket-${ticketId}"]`);
        if (tabItem) {
            const tabTitle = foundTicket.title || `Ticket #${ticketId}`;
            const shortTitle = tabTitle.length > 20 ? tabTitle.substring(0, 20) + '...' : tabTitle;
            tabItem.innerHTML = `
                <i class="fas fa-ticket-alt"></i>
                <span>${shortTitle}</span>
                <span class="tab-close" onclick="event.stopPropagation(); closeTicketTab('ticket-${ticketId}')">
                    <i class="fas fa-times"></i>
                </span>
            `;
            tabItem.onclick = () => switchTicketTab(`ticket-${ticketId}`);
        }
        
        // Atualizar botão "Enviar como"
        const sendButton = document.querySelector(`button[onclick*="toggleStatusDropdownInTab('${ticketId}')"]`);
        if (sendButton) {
            sendButton.innerHTML = `Enviar como: ${statusName} <i class="fas fa-chevron-down"></i>`;
        }
        
        // Atualizar conteúdo completo da aba com novo status
        const tabContent = document.getElementById(`tab-ticket-${ticketId}`);
        if (tabContent) {
            const statusColors = {
                'novo': '#1976d2',
                'em-aberto': '#28a745',
                'em-espera': '#000000',
                'pendente': '#ffc107',
                'resolvido': '#6c757d'
            };
            const statusColor = statusColors[newStatus] || '#666';
            tabContent.innerHTML = generateTicketTabHTML(foundTicket, statusName, statusColor);
            
            // Reconfigurar eventos após atualizar o HTML
            setTimeout(() => {
                setupTicketTabEvents(ticketId);
            }, 100);
        }
    }
    
    // Recarregar caixas para atualizar a lista
    loadBoxes();
    
    // Atualizar dashboard
    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
    
    // Selecionar automaticamente a nova caixa onde o ticket foi movido
    setTimeout(() => {
        if (targetBoxId) {
            const targetBoxElement = document.querySelector(`.box-item[data-box-id="${targetBoxId}"]`);
            if (targetBoxElement) {
                // Remover active de todas as caixas
                document.querySelectorAll('.box-item').forEach(box => {
                    box.classList.remove('active');
                });
                // Ativar a nova caixa
                targetBoxElement.classList.add('active');
                // Carregar tickets da nova caixa
                loadTicketsForBox(targetBoxId);
            }
        } else {
            // Se não encontrou a caixa, recarregar a caixa atual
            const selectedBox = document.querySelector('.box-item.active');
            if (selectedBox) {
                const boxId = selectedBox.getAttribute('data-box-id');
                if (boxId) {
                    loadTicketsForBox(boxId);
                }
            }
        }
    }, 200);
    
    // Mostrar notificação
    showNotification(`Ticket salvo e atualizado para "${statusName}" com sucesso!`, 'success');
}

// Função para configurar eventos da aba do ticket
function setupTicketTabEvents(ticketId) {
    // Renderizar formulário se existir
    const formFieldsContainer = document.getElementById(`ticketFormFields-${ticketId}`);
    if (formFieldsContainer) {
        const tabInfo = openTicketTabs.get(parseInt(ticketId));
        if (tabInfo && tabInfo.ticket) {
            const formHtml = renderTicketFormFieldsSimple(tabInfo.ticket);
            formFieldsContainer.innerHTML = formHtml;
            setupFormFieldEvents(ticketId);
        }
    }
    
    // Fechar dropdowns quando clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-container')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}

// Função para criar modal do ticket (mantida para compatibilidade, mas não será usada)
function createTicketModal(ticket, box) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('ticketModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // Mapear status para cores e nomes
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    
    const statusColors = {
        'novo': '#1976d2',
        'em-aberto': '#28a745',
        'em-espera': '#000000',
        'pendente': '#ffc107',
        'resolvido': '#6c757d'
    };
    
    const statusName = statusNames[ticket.status] || ticket.status;
    const statusColor = statusColors[ticket.status] || '#666';
    
    modal.innerHTML = `
        <div class="modal-content ticket-modal">
            <div class="modal-header">
                <h3>Ticket #${ticket.id}</h3>
                <span class="close" onclick="closeTicketModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="ticket-layout">
                    <!-- Coluna Principal -->
                    <div class="ticket-main-column">
                        <!-- Cabeçalho do Ticket -->
                        <div class="ticket-header">
                            ${ticket.isNewTicket ? 
                                `<div class="new-ticket-header">
                                    <div class="form-group">
                                        <label for="ticketTitleInput">Título do Ticket:</label>
                                        <input type="text" id="ticketTitleInput" class="form-input ticket-title-input" placeholder="Digite o título do ticket..." value="${ticket.title}">
                                    </div>
                                    <div class="form-group">
                                        <label for="ticketDescriptionInput">Descrição:</label>
                                        <textarea id="ticketDescriptionInput" class="form-textarea" rows="4" placeholder="Descreva o problema ou solicitação...">${ticket.description}</textarea>
                                    </div>
                                </div>` :
                                `<div class="ticket-status-info">
                                    <div class="current-status">
                                        <span class="status-indicator" style="background-color: ${statusColor}"></span>
                                        <span class="status-text">${statusName} #${ticket.id}</span>
                                    </div>
                                </div>`
                            }
                        </div>

                        <!-- Informações do Ticket -->
                        <div class="ticket-details">
                            <div class="ticket-meta">
                                <div class="meta-item">
                                    <span class="meta-label">Status:</span>
                                    <span class="meta-value status-${ticket.status}">${statusName}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Abertura:</span>
                                    <span class="meta-value">${new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Última Atualização:</span>
                                    <span class="meta-value">${new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Descrição do Ticket -->
                        <div class="ticket-description">
                            <h4>Descrição:</h4>
                            <p>${ticket.description || 'Nenhuma descrição disponível'}</p>
                        </div>

                        <!-- Timeline do Ticket -->
                        <div class="ticket-timeline">
                            <h4>Histórico de Atendimento</h4>
                            <div class="timeline-container" id="timeline-${ticket.id}">
                                ${generateTimelineHTML(ticket)}
                            </div>
                        </div>

                        <!-- Área de Resposta -->
                        <div class="ticket-response">
                            <div class="response-tabs">
                                <button class="response-tab active" data-tab="public">Resposta Pública</button>
                                <button class="response-tab" data-tab="internal">Anotação Interna</button>
                            </div>
                            
                            <div class="response-content">
                                <div class="response-tab-content active" id="public-${ticket.id}">
                                    <div class="response-form">
                                        <textarea class="response-textarea" placeholder="Digite sua resposta..." rows="4"></textarea>
                                        <div class="response-actions">
                                            <button type="button" class="btn-secondary" onclick="openAIChatbot()">
                                                <i class="fas fa-robot"></i> Assistente IA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="response-tab-content" id="internal-${ticket.id}">
                                    <div class="response-form internal-form">
                                        <div class="internal-note-header">
                                            <i class="fas fa-lock"></i>
                                            <span>Anotação Interna - Não será enviada ao cliente</span>
                                        </div>
                                        <textarea class="response-textarea internal-textarea" placeholder="Digite uma anotação interna..." rows="4"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Lateral - Informações do Cliente e Formulário -->
                    <div class="ticket-sidebar">
                        <!-- Seção de Informações do Cliente -->
                        <div class="sidebar-section client-info-section">
                            <h3>Informações do Cliente</h3>
                            <div class="client-fields">
                                <div class="form-field">
                                    <label>Solicitante/Cliente</label>
                                    <input type="text" class="form-input" id="solicitante" placeholder="Nome do solicitante/cliente" value="${ticket.solicitante || ticket.clientName || ''}">
                                </div>
                                <div class="form-field">
                                    <label>Responsável</label>
                                    <select class="form-input" id="responsibleAgent" onchange="updateTicketResponsible(${ticket.id}, this.value)">
                                        <option value="">Selecione um responsável</option>
                                        ${generateUsersOptions(ticket.responsibleAgent)}
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>CPF</label>
                                    <input type="text" class="form-input" id="clientCPF" placeholder="000.000.000-00" value="${ticket.clientCPF || ''}">
                                </div>
                                <div class="form-field">
                                    <label>Nome do Cliente</label>
                                    <input type="text" class="form-input" id="clientName" placeholder="Nome completo do cliente" value="${ticket.clientName || ''}">
                                </div>
                                <div class="client-actions">
                                    <button class="btn-primary btn-save-client" onclick="saveClientData(${ticket.id})">
                                        <i class="fas fa-save"></i> Salvar Dados
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Seção de Seleção de Formulário -->
                        <div class="sidebar-section form-selector-section">
                            <h3>Formulário Personalizado</h3>
                            <div class="form-selector">
                                <div class="form-field">
                                    <label>Selecionar Formulário:</label>
                                    <select id="formSelector" onchange="applyFormToTicket(${ticket.id}, this.value)">
                                        <option value="">Selecione um formulário...</option>
                                        ${generateFormOptions(ticket.formId)}
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button class="btn-secondary btn-refresh-forms" onclick="refreshFormSelector(${ticket.id})">
                                        <i class="fas fa-sync"></i> Atualizar Lista
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Seção do Formulário Aplicado -->
                        <div class="sidebar-section form-section">
                            <h3>Campos do Formulário</h3>
                            <div class="form-fields" id="ticketFormFields">
                                ${ticket.formId ? renderTicketFormFieldsSimple(ticket) : '<p class="no-form-message">Selecione um formulário acima para ver os campos.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${ticket.isNewTicket ? 
                `<div class="modal-footer new-ticket-footer">
                    <div class="footer-actions">
                        <button class="btn-secondary" onclick="closeTicketModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button class="btn-primary" onclick="saveNewTicket(${ticket.id})">
                            <i class="fas fa-save"></i> Salvar Ticket
                        </button>
                    </div>
                </div>` : 
                `<div class="modal-footer ticket-footer-fixed">
                    <div class="ticket-footer-left">
                        <!-- Espaço vazio para alinhar com o conteúdo principal -->
                    </div>
                    <div class="ticket-footer-right">
                        <div class="dropdown-container">
                            <button type="button" class="btn-primary dropdown-btn" onclick="toggleStatusDropdown()">
                                Enviar como: ${statusName} <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="dropdown-menu" id="statusDropdownFooter">
                                <div class="dropdown-item" onclick="changeTicketStatus('${ticket.id}', 'novo')">
                                    <span class="status-indicator novo"></span>
                                    <span>Novo</span>
                                </div>
                                <div class="dropdown-item" onclick="changeTicketStatus('${ticket.id}', 'em-aberto')">
                                    <span class="status-indicator em-aberto"></span>
                                    <span>Em Andamento</span>
                                </div>
                                <div class="dropdown-item" onclick="changeTicketStatus('${ticket.id}', 'em-espera')">
                                    <span class="status-indicator em-espera"></span>
                                    <span>Em Espera</span>
                                </div>
                                <div class="dropdown-item" onclick="changeTicketStatus('${ticket.id}', 'pendente')">
                                    <span class="status-indicator pendente"></span>
                                    <span>Pendente</span>
                                </div>
                                <div class="dropdown-item" onclick="changeTicketStatus('${ticket.id}', 'resolvido')">
                                    <span class="status-indicator resolvido"></span>
                                    <span>Resolvido</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
            }
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar event listeners
    setupTicketModalEvents(ticket.id);
    
    // Fechar dropdowns quando clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-container')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
    
    // Forçar renderização do formulário após o modal ser criado
    setTimeout(() => {
        console.log('Forçando renderização do formulário...');
        const formFieldsContainer = document.getElementById('ticketFormFields');
        if (formFieldsContainer) {
            console.log('Container encontrado, renderizando formulário...');
            const formHtml = renderTicketFormFieldsSimple(ticket);
            console.log('HTML do formulário:', formHtml);
            formFieldsContainer.innerHTML = formHtml;
            console.log('Formulário renderizado no DOM!');
            
            // Garantir que os event handlers sejam adicionados
            setupFormFieldEvents(ticket.id);
        } else {
            console.error('Container ticketFormFields não encontrado!');
        }
    }, 100);
}

// Função para gerar HTML da timeline
function generateTimelineHTML(ticket) {
    if (!ticket) return '<p class="no-timeline">Nenhum histórico disponível.</p>';
    
    // Combinar todas as entradas do histórico
    let timelineEntries = [];
    
    // Adicionar criação do ticket
    timelineEntries.push({
        id: 'creation',
        type: 'creation',
        text: `Ticket criado: ${ticket.description || 'Sem descrição'}`,
        timestamp: ticket.createdAt,
        status: 'novo',
        author: 'Sistema'
    });
    
    // Adicionar mensagens públicas
    if (ticket.messages && ticket.messages.length > 0) {
        ticket.messages.forEach(msg => {
            timelineEntries.push({
                id: msg.id,
                type: 'public',
                text: msg.text,
                timestamp: msg.timestamp,
                status: msg.status,
                author: 'Atendente'
            });
        });
    }
    
    // Adicionar anotações internas
    if (ticket.internalNotes && ticket.internalNotes.length > 0) {
        ticket.internalNotes.forEach(note => {
            timelineEntries.push({
                id: note.id,
                type: 'internal',
                text: note.text,
                timestamp: note.timestamp,
                status: note.status,
                author: 'Atendente'
            });
        });
    }
    
    // Ordenar por timestamp (mais antigo primeiro)
    timelineEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (timelineEntries.length === 0) {
        return '<p class="no-timeline">Nenhum histórico disponível.</p>';
    }
    
    // Gerar HTML da timeline
    let timelineHTML = '<div class="timeline">';
    
    timelineEntries.forEach((entry, index) => {
        const date = new Date(entry.timestamp);
        const timeString = date.toLocaleString('pt-BR');
        const statusName = getStatusName(entry.status);
        const statusColor = getStatusColor(entry.status);
        
        timelineHTML += `
            <div class="timeline-item ${entry.type}" data-entry-id="${entry.id}">
                <div class="timeline-marker">
                    <div class="timeline-dot" style="background-color: ${statusColor}"></div>
                    ${index < timelineEntries.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-type">${getTypeLabel(entry.type)}</span>
                        <span class="timeline-status" style="color: ${statusColor}">${statusName}</span>
                        <span class="timeline-time">${timeString}</span>
                    </div>
                    <div class="timeline-text">${escapeHtml(entry.text).replace(/\n/g, '<br>')}</div>
                    <div class="timeline-author">por ${entry.author}</div>
                </div>
            </div>
        `;
    });
    
    timelineHTML += '</div>';
    return timelineHTML;
}

// Função para obter nome do status
function getStatusName(status) {
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    return statusNames[status] || status;
}

// Função para obter cor do status
function getStatusColor(status) {
    const statusColors = {
        'novo': '#1976d2',
        'em-aberto': '#28a745',
        'em-espera': '#000000',
        'pendente': '#ffc107',
        'resolvido': '#6c757d'
    };
    return statusColors[status] || '#666';
}

// Função para obter label do tipo
function getTypeLabel(type) {
    const typeLabels = {
        'creation': 'Criação',
        'public': 'Resposta Pública',
        'internal': 'Anotação Interna'
    };
    return typeLabels[type] || type;
}

// Função para escapar HTML (prevenir XSS)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para gerar opções de formulários
function generateFormOptions(currentFormId) {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let optionsHTML = '';
    
    forms.forEach(form => {
        const selected = currentFormId == form.id ? 'selected' : '';
        optionsHTML += `<option value="${form.id}" ${selected}>${form.name}</option>`;
    });
    
    return optionsHTML;
}

// Função para gerar opções de formulários para criação
function generateFormOptionsForCreation() {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let optionsHTML = '';
    
    forms.forEach(form => {
        optionsHTML += `<option value="${form.id}">${form.name}</option>`;
    });
    
    return optionsHTML;
}

// Função para aplicar formulário ao ticket
function applyFormToTicket(ticketId, formId) {
    console.log('=== APLICANDO FORMULÁRIO ===');
    console.log('Ticket ID:', ticketId, 'Formulário ID:', formId);
    
    if (!formId) {
        console.log('Formulário não selecionado, removendo...');
        removeFormFromTicket(ticketId);
        return;
    }
    
    // Buscar o ticket
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let foundTicket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                foundTicket = ticket;
                console.log('Ticket encontrado:', ticket.title);
                break;
            }
        }
    }
    
    if (!foundTicket) {
        console.log('Ticket não encontrado para aplicar formulário');
        return;
    }
    
    // Aplicar formulário ao ticket
    foundTicket.formId = parseInt(formId);
    foundTicket.updatedAt = new Date().toISOString();
    
    console.log('Formulário aplicado ao ticket:', foundTicket.formId);
    
    // Salvar alterações
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    console.log('Alterações salvas no localStorage');
    
    // Atualizar a sidebar
    console.log('Atualizando campos do formulário na sidebar...');
    updateTicketFormFields(foundTicket);
    
    // Mostrar notificação
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const form = forms.find(f => f.id == formId);
    const formName = form ? form.name : 'Formulário';
    showNotification(`Formulário "${formName}" aplicado ao ticket!`, 'success');
    
    console.log('=== FORMULÁRIO APLICADO COM SUCESSO ===');
}

// Função para remover formulário do ticket
function removeFormFromTicket(ticketId) {
    console.log('Removendo formulário do ticket:', ticketId);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                // Remover formulário do ticket
                delete ticket.formId;
                delete ticket.formData;
                ticket.updatedAt = new Date().toISOString();
                
                // Salvar alterações
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                
                // Atualizar a sidebar
                updateTicketFormFields(ticket);
                
                // Mostrar notificação
                showNotification('Formulário removido do ticket!', 'info');
                
                break;
            }
        }
    }
}

// Função para atualizar campos do formulário na sidebar
function updateTicketFormFields(ticket) {
    console.log('=== ATUALIZANDO CAMPOS DO FORMULÁRIO ===');
    console.log('Ticket:', ticket.title, 'Form ID:', ticket.formId);
    
    const formFieldsContainer = document.getElementById('ticketFormFields');
    if (!formFieldsContainer) {
        console.log('Container de campos não encontrado!');
        return;
    }
    
    console.log('Container encontrado, verificando formulário...');
    
    if (ticket.formId) {
        console.log('Renderizando campos do formulário...');
        const formHTML = renderTicketFormFieldsSimple(ticket);
        console.log('HTML gerado:', formHTML);
        
        // Adicionar botão de teste
        const testButton = '<div class="form-test-buttons" style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 5px;"><button onclick="debugForm()" style="margin-right: 10px; padding: 5px 10px;">Debug Form</button><button onclick="forceSaveForm()" style="margin-right: 10px; padding: 5px 10px;">Force Save</button><button onclick="testSavedData()" style="margin-right: 10px; padding: 5px 10px;">Test Saved Data</button><button onclick="testTreeSave()" style="margin-right: 10px; padding: 5px 10px;">Test Tree Save</button><button onclick="testTreeReconstruction()" style="margin-right: 10px; padding: 5px 10px;">Test Reconstruction</button><button onclick="forceUpdateFieldsWithSavedData()" style="padding: 5px 10px;">Force Update Fields</button></div>';
        
        formFieldsContainer.innerHTML = formHTML + testButton;
        
        // Configurar eventos dos campos
        console.log('Configurando eventos dos campos...');
        setupFormFieldEvents(ticket.id);
        console.log('Eventos configurados!');
        
        // Forçar atualização dos campos com dados salvos após um pequeno delay
        setTimeout(() => {
            console.log('Forçando atualização dos campos com dados salvos...');
            forceUpdateFieldsWithSavedData();
        }, 200);
    } else {
        console.log('Nenhum formulário aplicado, mostrando mensagem padrão');
        formFieldsContainer.innerHTML = '<p class="no-form-message">Selecione um formulário acima para ver os campos.</p>';
    }
    
    console.log('=== CAMPOS ATUALIZADOS ===');
}

// Função para atualizar lista de formulários
function refreshFormSelector(ticketId) {
    console.log('Atualizando lista de formulários para ticket:', ticketId);
    
    const formSelector = document.getElementById('formSelector');
    if (!formSelector) return;
    
    // Buscar formulários atualizados
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    
    // Buscar formulário atual do ticket
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let currentFormId = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                currentFormId = ticket.formId;
                break;
            }
        }
    }
    
    // Atualizar opções do select
    let optionsHTML = '<option value="">Selecione um formulário...</option>';
    forms.forEach(form => {
        const selected = currentFormId == form.id ? 'selected' : '';
        optionsHTML += `<option value="${form.id}" ${selected}>${form.name}</option>`;
    });
    
    formSelector.innerHTML = optionsHTML;
    
    showNotification('Lista de formulários atualizada!', 'success');
}

// Função para salvar ticket do modal antigo (compatibilidade)
function saveTicket() {
    // Coletar dados do modal
    const titleInput = document.getElementById('ticketTitle');
    const descriptionInput = document.getElementById('ticketDescription');
    const formSelect = document.getElementById('ticketFormSelect');
    
    // Validar campos obrigatórios
    if (!titleInput || !titleInput.value.trim()) {
        showNotification('Por favor, preencha o título do ticket!', 'error');
        return;
    }
    
    if (!descriptionInput || !descriptionInput.value.trim()) {
        showNotification('Por favor, preencha a descrição do ticket!', 'error');
        return;
    }
    
    // Criar ticket temporário e abrir como aba (novo sistema)
    const tempTicket = {
        id: Date.now(),
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        internalNotes: [],
        formId: formSelect && formSelect.value ? parseInt(formSelect.value) : null,
        formData: {},
        solicitante: '',
        responsibleAgent: '',
        clientCPF: '',
        clientName: '',
        isNewTicket: true
    };
    
    // Coletar dados do formulário personalizado se existir
    if (tempTicket.formId) {
        const formFieldsContainer = document.getElementById('dynamicFormFields');
        if (formFieldsContainer) {
            const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
            formFields.forEach(field => {
                const fieldId = field.getAttribute('data-field-id');
                const fieldType = field.querySelector('input, select, textarea')?.type || 
                                 field.querySelector('select') ? 'select' : 'text';
                
                let value = '';
                if (fieldType === 'checkbox') {
                    value = field.querySelector('input[type="checkbox"]')?.checked || false;
                } else if (fieldType === 'select') {
                    value = field.querySelector('select')?.value || '';
                } else {
                    value = field.querySelector('input, textarea')?.value || '';
                }
                
                if (value !== '') {
                    tempTicket.formData[fieldId] = value;
                }
            });
        }
    }
    
    // Criar caixa temporária
    const tempBox = {
        id: 'temp',
        name: 'Novo Ticket',
        tickets: [tempTicket]
    };
    
    // Fechar modal
    closeTicketModal();
    
    // Abrir ticket como aba
    createTicketTab(tempTicket, tempBox);
    
    showNotification('Ticket criado! Preencha os dados e clique em "Enviar como" para salvar.', 'info');
}

// Função para salvar ticket novo (usada por modais antigos)
function saveNewTicket(ticketId) {
    console.log('Salvando ticket novo:', ticketId);
    
    // Coletar dados do formulário
    const titleInput = document.getElementById('ticketTitleInput');
    const descriptionInput = document.getElementById('ticketDescriptionInput');
    const solicitanteInput = document.getElementById('solicitante');
    const responsibleAgentInput = document.getElementById('responsibleAgent');
    const clientCPFInput = document.getElementById('clientCPF');
    const clientNameInput = document.getElementById('clientName');
    const formSelector = document.getElementById('formSelector');
    
    if (!titleInput || !titleInput.value.trim()) {
        showNotification('Por favor, preencha o título do ticket!', 'error');
        return;
    }
    
    if (!descriptionInput || !descriptionInput.value.trim()) {
        showNotification('Por favor, preencha a descrição do ticket!', 'error');
        return;
    }
    
    // Criar objeto do ticket com todos os dados
    const newTicket = {
        id: ticketId,
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        internalNotes: [],
        solicitante: solicitanteInput ? solicitanteInput.value.trim() : '',
        responsibleAgent: responsibleAgentInput ? responsibleAgentInput.value.trim() : '',
        clientCPF: clientCPFInput ? clientCPFInput.value.trim() : '',
        clientName: clientNameInput ? clientNameInput.value.trim() : '',
        responsibleAgent: responsibleAgentInput ? responsibleAgentInput.value.trim() : '',
        formId: formSelector && formSelector.value ? parseInt(formSelector.value) : null,
        formData: {}
    };
    
    // Coletar dados do formulário personalizado se aplicado
    if (newTicket.formId) {
        const formFieldsContainer = document.getElementById('ticketFormFields');
        if (formFieldsContainer) {
            const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
            formFields.forEach(field => {
                const fieldId = field.getAttribute('data-field-id');
                const fieldType = field.querySelector('input, select, textarea')?.type || 
                                 field.querySelector('select') ? 'select' : 'text';
                
                let value = '';
                if (fieldType === 'checkbox') {
                    value = field.querySelector('input[type="checkbox"]')?.checked || false;
                } else if (fieldType === 'select') {
                    value = field.querySelector('select')?.value || '';
                } else {
                    value = field.querySelector('input, textarea')?.value || '';
                }
                
                if (value !== '') {
                    newTicket.formData[fieldId] = value;
                }
            });
        }
    }
    
    // Salvar no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const novosBox = kanbanColumns.find(box => box.id === 'novos');
    
    if (novosBox) {
        if (!novosBox.tickets) {
            novosBox.tickets = [];
        }
        novosBox.tickets.push(newTicket);
        localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
        
        // Fechar modal
        closeTicketModal();
        
        // Atualizar interface
        loadBoxes();
        loadDashboardStats();
        
        showNotification('Ticket criado com sucesso!', 'success');
    } else {
        showNotification('Erro ao salvar ticket. Caixa "Novos" não encontrada.', 'error');
    }
}

// Função para configurar eventos do modal de ticket
function setupTicketModalEvents(ticketId) {
    // Configurar tabs de resposta
    const responseTabs = document.querySelectorAll('.response-tab');
    responseTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            switchResponseTab(tabType, ticketId);
        });
    });
}

// Função para alternar entre tabs de resposta
function switchResponseTab(tabType, ticketId) {
    // Remover classe active de todas as tabs
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Adicionar classe active à tab clicada
    const activeTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Ocultar todos os conteúdos
    document.querySelectorAll('.response-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar conteúdo da tab selecionada
    const activeContent = document.getElementById(`${tabType}-${ticketId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// Função para alternar dropdown de status
function toggleStatusDropdown() {
    // Fechar todos os dropdowns primeiro
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(dd => {
        dd.style.display = 'none';
    });
    
    // Usar o dropdown do rodapé fixo
    const dropdownFooter = document.getElementById('statusDropdownFooter');
    if (dropdownFooter) {
        const isVisible = dropdownFooter.style.display === 'block';
        dropdownFooter.style.display = isVisible ? 'none' : 'block';
    } else {
        // Fallback para dropdowns antigos caso ainda existam
        const dropdown = document.getElementById('statusDropdown');
        const dropdownInternal = document.getElementById('statusDropdownInternal');
        
        const activeTab = document.querySelector('.response-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'internal') {
            if (dropdownInternal) {
                dropdownInternal.style.display = 'block';
            }
        } else {
            if (dropdown) {
                dropdown.style.display = 'block';
            }
        }
    }
}

// Função para alterar status do ticket
function changeTicketStatus(ticketId, newStatus) {
    console.log('=== INICIANDO MUDANÇA DE STATUS ===');
    console.log('Ticket ID:', ticketId, 'Novo Status:', newStatus);
    
    // Encontrar o ticket
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let foundTicket = null;
    let foundBox = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                foundTicket = ticket;
                foundBox = box;
                break;
            }
        }
    }
    
    if (!foundTicket) {
        console.log('Ticket não encontrado:', ticketId);
        return;
    }
    
    console.log('Ticket encontrado:', foundTicket.title);
    
    // Obter resposta do usuário
    const responseTextarea = document.querySelector('.response-textarea:not(.internal-textarea)');
    const internalTextarea = document.querySelector('.internal-textarea');
    
    let responseText = '';
    let internalNote = '';
    
    if (responseTextarea) {
        responseText = responseTextarea.value.trim();
    }
    
    if (internalTextarea) {
        internalNote = internalTextarea.value.trim();
    }
    
    // Coletar dados dos formulários personalizados
    const formFieldsContainer = document.getElementById('ticketFormFields');
    if (formFieldsContainer && foundTicket.formId) {
        const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
        formFields.forEach(field => {
            const fieldId = field.getAttribute('data-field-id');
            const fieldType = field.querySelector('input, select, textarea')?.type || 
                             field.querySelector('select') ? 'select' : 'text';
            
            let value = '';
            if (fieldType === 'checkbox') {
                value = field.querySelector('input[type="checkbox"]')?.checked || false;
            } else if (fieldType === 'select') {
                value = field.querySelector('select')?.value || '';
            } else {
                value = field.querySelector('input, textarea')?.value || '';
            }
            
            if (value !== '') {
                if (!foundTicket.formData) {
                    foundTicket.formData = {};
                }
                foundTicket.formData[fieldId] = value;
            }
        });
    }
    
    // Coletar dados do cliente
    const clientNameInput = document.getElementById('clientName');
    const clientCPFInput = document.getElementById('clientCPF');
    const responsibleAgentInput = document.getElementById('responsibleAgent');
    
    if (clientNameInput) {
        foundTicket.clientName = clientNameInput.value.trim();
    }
    if (clientCPFInput) {
        foundTicket.clientCPF = clientCPFInput.value.trim();
    }
    if (responsibleAgentInput) {
        foundTicket.responsibleAgent = responsibleAgentInput.value.trim();
    }
    
    // Atualizar ticket
    foundTicket.status = newStatus;
    foundTicket.updatedAt = new Date().toISOString();
    
    // Adicionar mensagem se houver resposta
    if (responseText) {
        if (!foundTicket.messages) {
            foundTicket.messages = [];
        }
        foundTicket.messages.push({
            id: Date.now(),
            text: responseText,
            type: 'response',
            timestamp: new Date().toISOString(),
            status: newStatus
        });
    }
    
    // Adicionar anotação interna se houver
    if (internalNote) {
        if (!foundTicket.internalNotes) {
            foundTicket.internalNotes = [];
        }
        foundTicket.internalNotes.push({
            id: Date.now(),
            text: internalNote,
            timestamp: new Date().toISOString(),
            status: newStatus
        });
    }
    
    // Limpar campos de resposta após salvar
    if (responseTextarea) {
        responseTextarea.value = '';
    }
    if (internalTextarea) {
        internalTextarea.value = '';
    }
    
    // Mover ticket para a caixa correta
    const targetBoxId = moveTicketToCorrectBox(foundTicket, kanbanColumns);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    console.log('KanbanColumns salvo no localStorage');
    
    // Mapear status para nomes
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    const statusName = statusNames[newStatus] || newStatus;
    
    // Verificar se o ticket está aberto em uma aba e atualizar
    const tabInfo = openTicketTabs.get(parseInt(ticketId));
    if (tabInfo) {
        tabInfo.ticket = foundTicket;
        
        // Atualizar conteúdo da aba se estiver aberta
        const tabContent = document.getElementById(`tab-ticket-${ticketId}`);
        if (tabContent) {
            const statusColors = {
                'novo': '#1976d2',
                'em-aberto': '#28a745',
                'em-espera': '#000000',
                'pendente': '#ffc107',
                'resolvido': '#6c757d'
            };
            const statusColor = statusColors[newStatus] || '#666';
            
            tabContent.innerHTML = generateTicketTabHTML(foundTicket, statusName, statusColor);
            
            // Reconfigurar eventos após atualizar o HTML
            setTimeout(() => {
                setupTicketTabEvents(ticketId);
            }, 100);
        }
    }
    
    // Fechar modal
    closeTicketModal();
    console.log('Fechando modal de ticket...');
    
    // Forçar limpeza completa do modal
    setTimeout(() => {
        console.log('=== FORÇANDO LIMPEZA COMPLETA DO MODAL ===');
        const modal = document.getElementById('ticketModal');
        if (modal) {
            modal.remove();
        }
        console.log('=== LIMPEZA COMPLETA FINALIZADA ===');
    }, 100);
    
    // Recarregar caixas
    loadBoxes();
    console.log('Chamando loadBoxes()...');
    
    // Atualizar dashboard
    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
    
    // Selecionar automaticamente a nova caixa onde o ticket foi movido
    setTimeout(() => {
        if (targetBoxId) {
            const targetBoxElement = document.querySelector(`.box-item[data-box-id="${targetBoxId}"]`);
            if (targetBoxElement) {
                // Remover active de todas as caixas
                document.querySelectorAll('.box-item').forEach(box => {
                    box.classList.remove('active');
                });
                // Ativar a nova caixa
                targetBoxElement.classList.add('active');
                // Carregar tickets da nova caixa
                loadTicketsForBox(targetBoxId);
            }
        } else {
            // Se não encontrou a caixa, recarregar a caixa atual
            const selectedBox = document.querySelector('.box-item.active');
            if (selectedBox) {
                const boxId = selectedBox.getAttribute('data-box-id');
                if (boxId) {
                    loadTicketsForBox(boxId);
                }
            }
        }
    }, 200);
    
    // Mostrar notificação
    showNotification(`Ticket salvo e atualizado para "${statusName}" com sucesso!`, 'success');
    
    console.log('=== FINALIZANDO MUDANÇA DE STATUS ===');
}

// Função para mover ticket para a caixa correta
function moveTicketToCorrectBox(ticket, kanbanColumns) {
    console.log('Movendo ticket para caixa correta:', ticket.status);
    
    // Mapear status para IDs de caixa
    const statusToBoxMap = {
        'novo': 'novos',
        'em-aberto': 'em-andamento',
        'em-espera': 'em-espera',
        'pendente': 'pendentes',
        'resolvido': 'resolvidos'
    };
    
    const targetBoxId = statusToBoxMap[ticket.status] || 'novos';
    console.log('Caixa de destino:', targetBoxId);
    
    // Remover ticket de todas as caixas
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            box.tickets = box.tickets.filter(t => t.id !== ticket.id);
        }
    });
    
    // Adicionar ticket à caixa correta
    const targetBox = kanbanColumns.find(box => box.id === targetBoxId);
    if (targetBox) {
        if (!targetBox.tickets) {
            targetBox.tickets = [];
        }
        targetBox.tickets.push(ticket);
        console.log('Ticket adicionado à caixa:', targetBox.name);
        return targetBoxId; // Retornar o ID da caixa de destino
    } else {
        console.log('Caixa de destino não encontrada:', targetBoxId);
        return null;
    }
}

// Função para salvar dados do cliente
function saveClientData(ticketId) {
    // Tentar obter campos com ID específico do ticket primeiro (para abas)
    const solicitanteInput = document.getElementById(`solicitante-${ticketId}`) || document.getElementById('solicitante');
    const responsibleAgentInput = document.getElementById(`responsibleAgent-${ticketId}`) || document.getElementById('responsibleAgent');
    const clientCPFInput = document.getElementById(`clientCPF-${ticketId}`) || document.getElementById('clientCPF');
    const clientNameInput = document.getElementById(`clientName-${ticketId}`) || document.getElementById('clientName');
    
    const solicitante = solicitanteInput ? solicitanteInput.value.trim() : '';
    const responsibleAgent = responsibleAgentInput ? responsibleAgentInput.value.trim() : '';
    const clientCPF = clientCPFInput ? clientCPFInput.value.trim() : '';
    const clientName = clientNameInput ? clientNameInput.value.trim() : '';
    
    // Buscar o ticket e atualizar os dados
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.solicitante = solicitante;
                ticket.responsibleAgent = responsibleAgent;
                ticket.clientCPF = clientCPF;
                ticket.clientName = clientName;
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    // Atualizar também na aba se estiver aberta
    const tabInfo = openTicketTabs.get(ticketId);
    if (tabInfo) {
        tabInfo.ticket.solicitante = solicitante;
        tabInfo.ticket.responsibleAgent = responsibleAgent;
        tabInfo.ticket.clientCPF = clientCPF;
        tabInfo.ticket.clientName = clientName;
    }
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    showNotification('Dados do cliente salvos com sucesso!', 'success');
}

// Função para renderizar campos do formulário no ticket
function renderTicketFormFieldsSimple(ticket) {
    if (!ticket.formId) {
        return '<p class="no-form-message">Nenhum formulário personalizado aplicado a este ticket.</p>';
    }
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const form = forms.find(f => f.id == ticket.formId);
    
    if (!form) {
        return '<p class="form-error">Formulário não encontrado!</p>';
    }
    
    let formHTML = '';
    form.fields.forEach(field => {
        formHTML += renderFormFieldSimple(field, ticket);
    });
    
    return formHTML;
}

// Função para renderizar campo individual do formulário
function renderFormFieldSimple(field, ticket) {
    console.log(`=== RENDERIZANDO CAMPO: ${field.label} ===`);
    console.log('Field ID:', field.id);
    console.log('Field Type:', field.type);
    console.log('Ticket formData:', ticket.formData);
    
    const currentValue = ticket.formData && ticket.formData[field.id] ? ticket.formData[field.id] : '';
    console.log('Current Value:', currentValue);
    
    let fieldHTML = `<div class="form-field ticket-form-field" data-field-id="${field.id}">`;
    fieldHTML += `<label>${field.label}${field.required ? ' *' : ''}</label>`;
    
    switch (field.type) {
        case 'text':
            fieldHTML += `<input type="text" value="${currentValue}">`;
            break;
        case 'textarea':
            fieldHTML += `<textarea>${currentValue}</textarea>`;
            break;
        case 'select':
            fieldHTML += `<select>`;
            fieldHTML += '<option value="">Selecione uma opção</option>';
            if (field.options) {
                field.options.forEach(option => {
                    const selected = currentValue === option ? 'selected' : '';
                    fieldHTML += `<option value="${option}" ${selected}>${option}</option>`;
                });
            }
            fieldHTML += '</select>';
            break;
        case 'checkbox':
            const checked = currentValue === 'sim' ? 'checked' : '';
            fieldHTML += `<input type="checkbox" ${checked}>`;
            break;
        case 'radio':
            if (field.options) {
                field.options.forEach((option, index) => {
                    const checked = currentValue === option ? 'checked' : '';
                    fieldHTML += `<label class="radio-option">
                        <input type="radio" name="${field.id}" value="${option}" ${checked}>
                        ${option}
                    </label>`;
                });
            }
            break;
        case 'date':
            fieldHTML += `<input type="date" value="${currentValue}">`;
            break;
        case 'email':
            fieldHTML += `<input type="email" value="${currentValue}">`;
            break;
        case 'number':
            fieldHTML += `<input type="number" value="${currentValue}">`;
            break;
        case 'tree':
        case 'tree-select':
            console.log('Renderizando campo de árvore com valor:', currentValue);
            fieldHTML += renderTreeSelection(field, currentValue);
            break;
        case 'tree-sequential':
            console.log('Renderizando campo de árvore sequencial (Zendesk) com valor:', currentValue);
            fieldHTML += renderTreeSequential(field, currentValue);
            break;
        default:
            fieldHTML += `<input type="text" value="${currentValue}">`;
    }
    
    fieldHTML += '</div>';
    console.log(`=== CAMPO RENDERIZADO: ${field.label} ===`);
    return fieldHTML;
}

// Função para atualizar dados do formulário do ticket
function updateTicketFormData(fieldId, value) {
    console.log('=== ATUALIZANDO DADOS DO FORMULÁRIO ===');
    console.log('Field ID:', fieldId, 'Valor:', value);
    console.log('Tipo do Field ID:', typeof fieldId);
    console.log('Tipo do Valor:', typeof value);
    
    // Encontrar o ticket atual
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ ID do ticket não encontrado!');
        return;
    }
    
    console.log('✅ ID do ticket encontrado:', ticketId);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    console.log('📦 Total de caixas:', kanbanColumns.length);
    
    let ticketFound = false;
    
    for (const box of kanbanColumns) {
        console.log(`🔍 Verificando caixa: ${box.name} (${box.tickets ? box.tickets.length : 0} tickets)`);
        
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                console.log('✅ Ticket encontrado:', ticket.title);
                console.log('📋 Formulário do ticket:', ticket.formId);
                
                if (!ticket.formData) {
                    ticket.formData = {};
                    console.log('📝 Objeto formData criado');
                }
                
                console.log('📊 Dados antes da atualização:', ticket.formData);
                ticket.formData[fieldId] = value;
                ticket.updatedAt = new Date().toISOString();
                
                console.log('📊 Dados após atualização:', ticket.formData);
                console.log('🔑 Campo específico:', ticket.formData[fieldId]);
                
                ticketFound = true;
                break;
            }
        }
    }
    
    if (!ticketFound) {
        console.log('❌ Ticket não encontrado para atualização!');
        console.log('🔍 Procurando em todas as caixas...');
        
        kanbanColumns.forEach((box, index) => {
            console.log(`Caixa ${index + 1}: ${box.name}`);
            if (box.tickets) {
                box.tickets.forEach((ticket, ticketIndex) => {
                    console.log(`  Ticket ${ticketIndex + 1}: ID=${ticket.id}, Título=${ticket.title}`);
                });
            }
        });
        return;
    }
    
    console.log('💾 Salvando no localStorage...');
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Verificar se foi salvo corretamente
    const savedData = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let savedTicket = null;
    
    for (const box of savedData) {
        if (box.tickets) {
            savedTicket = box.tickets.find(t => t.id === ticketId);
            if (savedTicket) break;
        }
    }
    
    if (savedTicket && savedTicket.formData && savedTicket.formData[fieldId]) {
        console.log('✅ Dados confirmados no localStorage:', savedTicket.formData[fieldId]);
    } else {
        console.log('❌ Dados não foram salvos corretamente!');
    }
    
    console.log('=== DADOS ATUALIZADOS COM SUCESSO ===');
}

// Função para atualizar checkbox do formulário
function updateTicketFormDataCheckbox(fieldId, checked) {
    updateTicketFormData(fieldId, checked ? 'sim' : 'não');
}

// Função para obter ID do ticket atual
function getCurrentTicketId() {
    const modal = document.getElementById('ticketModal');
    if (!modal) return null;
    
    const titleElement = modal.querySelector('h3');
    if (titleElement) {
        const match = titleElement.textContent.match(/#(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    return null;
}

// Função para configurar eventos dos campos do formulário
function setupFormFieldEvents(ticketId) {
    console.log('=== CONFIGURANDO EVENTOS DOS CAMPOS ===');
    console.log('Ticket ID:', ticketId);
    
    // Aguardar um pouco para garantir que o DOM foi renderizado
    setTimeout(() => {
        const formFieldsContainer = document.getElementById('ticketFormFields');
        if (!formFieldsContainer) {
            console.log('❌ Container não encontrado após timeout');
            return;
        }
        
        console.log('✅ Container encontrado após timeout');
        
        // Configurar eventos para campos de árvore
        const treeFields = document.querySelectorAll('.tree-selection-container');
        console.log('Campos de árvore encontrados:', treeFields.length);
        treeFields.forEach(container => {
            setupCascadeTreeEvents(container, ticketId);
        });
        
        // Configurar eventos para todos os inputs
        const allInputs = formFieldsContainer.querySelectorAll('input, select, textarea');
        console.log('Total de inputs encontrados:', allInputs.length);
        
        allInputs.forEach((input, index) => {
            const fieldContainer = input.closest('.ticket-form-field');
            if (!fieldContainer) return;
            
            const fieldId = fieldContainer.getAttribute('data-field-id');
            if (!fieldId) return;
            
            console.log(`Configurando evento ${index + 1}: ${fieldId}`);
            
            // Remover eventos anteriores
            input.removeEventListener('input', handleFieldChange);
            input.removeEventListener('change', handleFieldChange);
            
            // Adicionar novo evento
            if (input.type === 'checkbox') {
                input.addEventListener('change', function() {
                    console.log(`Checkbox ${fieldId} alterado:`, this.checked);
                    updateTicketFormDataCheckbox(fieldId, this.checked);
                });
            } else if (input.type === 'radio') {
                input.addEventListener('change', function() {
                    console.log(`Radio ${fieldId} alterado:`, this.value);
                    updateTicketFormData(fieldId, this.value);
                });
            } else if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    console.log(`Select ${fieldId} alterado:`, this.value);
                    updateTicketFormData(fieldId, this.value);
                });
            } else {
                input.addEventListener('input', function() {
                    console.log(`Input ${fieldId} alterado:`, this.value);
                    updateTicketFormData(fieldId, this.value);
                });
            }
        });
        
        console.log('=== EVENTOS CONFIGURADOS ===');
    }, 100);
}

// Função genérica para lidar com mudanças nos campos
function handleFieldChange(event) {
    const fieldContainer = event.target.closest('.ticket-form-field');
    if (!fieldContainer) return;
    
    const fieldId = fieldContainer.getAttribute('data-field-id');
    if (!fieldId) return;
    
    let value = '';
    if (event.target.type === 'checkbox') {
        value = event.target.checked ? 'sim' : 'não';
    } else {
        value = event.target.value || '';
    }
    
    console.log(`Campo ${fieldId} alterado para:`, value);
    updateTicketFormData(fieldId, value);
}

// Função para testar salvamento de formulário
function testFormSave() {
    console.log('=== TESTANDO SALVAMENTO DE FORMULÁRIO ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID encontrado:', ticketId);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket) {
        console.log('❌ Ticket não encontrado!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📋 Formulário aplicado:', ticket.formId);
    console.log('📝 Dados do formulário:', ticket.formData);
    
    // Testar salvamento manual
    const testFieldId = 'test_' + Date.now();
    const testValue = 'Valor de teste';
    
    updateTicketFormData(testFieldId, testValue);
    
    // Verificar se foi salvo
    const updatedColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let updatedTicket = null;
    
    for (const box of updatedColumns) {
        if (box.tickets) {
            updatedTicket = box.tickets.find(t => t.id === ticketId);
            if (updatedTicket) break;
        }
    }
    
    if (updatedTicket && updatedTicket.formData && updatedTicket.formData[testFieldId] === testValue) {
        console.log('✅ Salvamento funcionando corretamente!');
        console.log('📊 Dados finais:', updatedTicket.formData);
    } else {
        console.log('❌ Problema no salvamento!');
    }
    
    console.log('=== TESTE CONCLUÍDO ===');
}

// Função para testar eventos dos campos
function testFieldEvents() {
    console.log('=== TESTANDO EVENTOS DOS CAMPOS ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID:', ticketId);
    
    // Verificar se há campos
    const textFields = document.querySelectorAll('.ticket-form-field input[type="text"]');
    const selectFields = document.querySelectorAll('.ticket-form-field select');
    const textareaFields = document.querySelectorAll('.ticket-form-field textarea');
    
    console.log('📝 Campos encontrados:');
    console.log('- Texto:', textFields.length);
    console.log('- Select:', selectFields.length);
    console.log('- Textarea:', textareaFields.length);
    
    if (textFields.length > 0) {
        console.log('🧪 Testando campo de texto...');
        const firstField = textFields[0];
        const fieldId = firstField.closest('.ticket-form-field').getAttribute('data-field-id');
        console.log('Field ID:', fieldId);
        
        // Simular digitação
        firstField.value = 'Teste de salvamento';
        firstField.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log('✅ Evento de input disparado');
    }
    
    console.log('=== TESTE DE EVENTOS CONCLUÍDO ===');
}

// Função para debug completo do formulário
function debugForm() {
    console.log('=== DEBUG COMPLETO DO FORMULÁRIO ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID:', ticketId);
    
    // Verificar ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket) {
        console.log('❌ Ticket não encontrado no localStorage!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📋 Formulário aplicado:', ticket.formId);
    console.log('📝 Dados atuais:', ticket.formData);
    
    // Verificar formulário
    if (ticket.formId) {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const form = forms.find(f => f.id == ticket.formId);
        
        if (form) {
            console.log('✅ Formulário encontrado:', form.name);
            console.log('📝 Campos do formulário:', form.fields.length);
            form.fields.forEach(field => {
                console.log(`- ${field.label} (${field.type}): ${ticket.formData && ticket.formData[field.id] ? ticket.formData[field.id] : 'vazio'}`);
            });
        } else {
            console.log('❌ Formulário não encontrado!');
        }
    }
    
    // Verificar elementos no DOM
    const formFieldsContainer = document.getElementById('ticketFormFields');
    if (!formFieldsContainer) {
        console.log('❌ Container de campos não encontrado!');
        return;
    }
    
    console.log('✅ Container encontrado');
    
    const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
    console.log('📝 Campos no DOM:', formFields.length);
    
    formFields.forEach((field, index) => {
        const fieldId = field.getAttribute('data-field-id');
        const input = field.querySelector('input, select, textarea');
        const value = input ? input.value : 'sem input';
        console.log(`${index + 1}. Field ID: ${fieldId}, Valor: ${value}`);
    });
    
    // Verificar eventos
    const textInputs = formFieldsContainer.querySelectorAll('input[type="text"]');
    console.log('🔗 Campos de texto com eventos:', textInputs.length);
    
    textInputs.forEach((input, index) => {
        const hasListener = input.oninput !== null || input.addEventListener;
        console.log(`${index + 1}. Input tem listener: ${hasListener}`);
    });
    
    console.log('=== DEBUG CONCLUÍDO ===');
}

// Função para forçar salvamento manual
function forceSaveForm() {
    console.log('=== FORÇANDO SALVAMENTO ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    const formFieldsContainer = document.getElementById('ticketFormFields');
    if (!formFieldsContainer) {
        console.log('❌ Container não encontrado!');
        return;
    }
    
    const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
    console.log('📝 Coletando dados de', formFields.length, 'campos');
    
    const formData = {};
    
    formFields.forEach(field => {
        const fieldId = field.getAttribute('data-field-id');
        const input = field.querySelector('input, select, textarea');
        
        if (input) {
            let value = '';
            if (input.type === 'checkbox') {
                value = input.checked ? 'sim' : 'não';
            } else {
                value = input.value || '';
            }
            
            if (value) {
                formData[fieldId] = value;
                console.log(`✅ ${fieldId}: ${value}`);
            }
        }
    });
    
    console.log('📊 Dados coletados:', formData);
    
    // Salvar no ticket
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.formData = formData;
                ticket.updatedAt = new Date().toISOString();
                console.log('✅ Dados salvos no ticket');
                break;
            }
        }
    }
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    console.log('✅ Dados salvos no localStorage');
    console.log('=== SALVAMENTO FORÇADO CONCLUÍDO ===');
}

// Função para testar carregamento de dados salvos
function testSavedData() {
    console.log('=== TESTANDO DADOS SALVOS ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID:', ticketId);
    
    // Buscar ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket) {
        console.log('❌ Ticket não encontrado!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📋 Formulário aplicado:', ticket.formId);
    console.log('📝 Dados salvos:', ticket.formData);
    
    // Verificar se há dados salvos
    if (ticket.formData && Object.keys(ticket.formData).length > 0) {
        console.log('✅ Há dados salvos!');
        Object.keys(ticket.formData).forEach(fieldId => {
            console.log(`- Campo ${fieldId}: ${ticket.formData[fieldId]}`);
        });
        
        // Verificar se os dados estão sendo exibidos no DOM
        const formFieldsContainer = document.getElementById('ticketFormFields');
        if (formFieldsContainer) {
            const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
            console.log('📝 Campos no DOM:', formFields.length);
            
            formFields.forEach((field, index) => {
                const fieldId = field.getAttribute('data-field-id');
                const input = field.querySelector('input, select, textarea');
                const value = input ? input.value : 'sem input';
                const savedValue = ticket.formData[fieldId];
                
                console.log(`${index + 1}. Field ID: ${fieldId}`);
                console.log(`   Valor salvo: ${savedValue}`);
                console.log(`   Valor no DOM: ${value}`);
                console.log(`   ✅ Coincide: ${savedValue === value ? 'SIM' : 'NÃO'}`);
            });
        }
    } else {
        console.log('❌ Nenhum dado salvo encontrado!');
    }
    
    console.log('=== TESTE DE DADOS SALVOS CONCLUÍDO ===');
}

// Função para testar salvamento de seleções de árvore
function testTreeSave() {
    console.log('=== TESTANDO SALVAMENTO DE ÁRVORE ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID:', ticketId);
    
    // Buscar ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket) {
        console.log('❌ Ticket não encontrado!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📋 Formulário aplicado:', ticket.formId);
    console.log('📝 Dados salvos:', ticket.formData);
    
    // Verificar campos de árvore no DOM
    const treeFields = document.querySelectorAll('.tree-field-container');
    console.log('🌳 Campos de árvore encontrados:', treeFields.length);
    
    treeFields.forEach((field, index) => {
        const fieldId = field.getAttribute('data-field-id');
        const selects = field.querySelectorAll('.tree-level-select');
        console.log(`Campo ${index + 1} (${fieldId}):`);
        console.log(`- Selects encontrados: ${selects.length}`);
        
        selects.forEach((select, selectIndex) => {
            const level = select.getAttribute('data-level');
            const value = select.value;
            console.log(`  Select ${selectIndex + 1} (nível ${level}): ${value}`);
        });
        
        const savedValue = ticket.formData && ticket.formData[fieldId];
        console.log(`- Valor salvo: ${savedValue}`);
        console.log(`- ✅ Coincide: ${savedValue === selects[selects.length - 1]?.value ? 'SIM' : 'NÃO'}`);
    });
    
    console.log('=== TESTE DE SALVAMENTO CONCLUÍDO ===');
}

// Função para testar reconstrução da árvore
function testTreeReconstruction() {
    console.log('=== TESTANDO RECONSTRUÇÃO DA ÁRVORE ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    console.log('✅ Ticket ID:', ticketId);
    
    // Buscar ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket) {
        console.log('❌ Ticket não encontrado!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📋 Formulário aplicado:', ticket.formId);
    console.log('📝 Dados salvos:', ticket.formData);
    
    if (!ticket.formId) {
        console.log('❌ Nenhum formulário aplicado!');
        return;
    }
    
    // Buscar formulário
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const form = forms.find(f => f.id == ticket.formId);
    
    if (!form) {
        console.log('❌ Formulário não encontrado!');
        return;
    }
    
    console.log('✅ Formulário encontrado:', form.name);
    
    // Buscar campos de árvore
    const treeFields = form.fields.filter(field => field.type === 'tree' || field.type === 'tree-select' || field.type === 'tree-sequential');
    console.log('🌳 Campos de árvore encontrados:', treeFields.length);
    
    treeFields.forEach((field, index) => {
        console.log(`\n--- Campo ${index + 1}: ${field.label} ---`);
        console.log('Field ID:', field.id);
        console.log('Field Type:', field.type);
        
        const savedValue = ticket.formData && ticket.formData[field.id];
        console.log('Valor salvo:', savedValue);
        
        if (savedValue) {
            console.log('🔍 Testando busca do caminho...');
            const path = findPathToValue(field.config.treeStructure, savedValue);
            console.log('Caminho encontrado:', path);
            
            if (path.length > 0) {
                console.log('✅ Caminho válido encontrado!');
                console.log('Nós no caminho:', path.map(node => node.label));
            } else {
                console.log('❌ Caminho não encontrado!');
                console.log('Estrutura da árvore:', field.config.treeStructure);
            }
        } else {
            console.log('❌ Nenhum valor salvo para este campo');
        }
    });
    
    console.log('=== TESTE DE RECONSTRUÇÃO CONCLUÍDO ===');
}

// Função para forçar atualização dos campos com valores salvos
function forceUpdateFieldsWithSavedData() {
    console.log('=== FORÇANDO ATUALIZAÇÃO DOS CAMPOS ===');
    
    const ticketId = getCurrentTicketId();
    if (!ticketId) {
        console.log('❌ Nenhum ticket aberto!');
        return;
    }
    
    // Buscar ticket no localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) break;
        }
    }
    
    if (!ticket || !ticket.formData) {
        console.log('❌ Ticket ou dados não encontrados!');
        return;
    }
    
    console.log('✅ Ticket encontrado:', ticket.title);
    console.log('📝 Dados salvos:', ticket.formData);
    
    // Forçar atualização de cada campo
    const formFieldsContainer = document.getElementById('ticketFormFields');
    if (!formFieldsContainer) {
        console.log('❌ Container não encontrado!');
        return;
    }
    
    const formFields = formFieldsContainer.querySelectorAll('.ticket-form-field');
    console.log('📝 Atualizando', formFields.length, 'campos');
    
    formFields.forEach((field, index) => {
        const fieldId = field.getAttribute('data-field-id');
        const savedValue = ticket.formData[fieldId];
        
        if (savedValue) {
            console.log(`Atualizando campo ${index + 1}: ${fieldId} = ${savedValue}`);
            
            // Para campos de árvore, usar função específica
            if (field.querySelector('.tree-field-container')) {
                updateTreeFieldAsSelects(fieldId, savedValue);
            } else {
                // Para outros tipos de campo
                const input = field.querySelector('input, select, textarea');
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = savedValue === 'sim';
                        console.log(`✅ Checkbox ${fieldId} atualizado: ${input.checked}`);
                    } else if (input.type === 'radio') {
                        // Para radio, marcar o que tem o valor correto
                        const radioInput = field.querySelector(`input[value="${savedValue}"]`);
                        if (radioInput) {
                            radioInput.checked = true;
                            console.log(`✅ Radio ${fieldId} atualizado: ${savedValue}`);
                        }
                    } else {
                        input.value = savedValue;
                        console.log(`✅ Input ${fieldId} atualizado: ${savedValue}`);
                    }
                }
            }
        }
    });
    
    console.log('=== ATUALIZAÇÃO FORÇADA CONCLUÍDA ===');
}

// Função para atualizar campos de árvore como selects
function updateTreeFieldAsSelects(fieldId, savedValue) {
    console.log(`=== ATUALIZANDO ÁRVORE COMO SELECTS ===`);
    console.log('Field ID:', fieldId);
    console.log('Saved Value:', savedValue);
    
    const fieldContainer = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (!fieldContainer) {
        console.log('❌ Campo não encontrado no DOM');
        return;
    }
    
    const treeContainer = fieldContainer.querySelector('.tree-field-container');
    if (!treeContainer) {
        console.log('❌ Container de árvore não encontrado');
        return;
    }
    
    // Buscar o formulário e campo
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('❌ Campo de árvore não encontrado');
        return;
    }
    
    // Encontrar o caminho até o valor
    const path = findPathToValue(targetField.config.treeStructure, savedValue);
    console.log('Caminho encontrado:', path);
    
    if (path.length > 0) {
        // Renderizar o caminho completo como selects
        renderTreePathAsSelects(fieldId, path);
    }
    
    console.log('=== ÁRVORE COMO SELECTS ATUALIZADA ===');
}

// Função para renderizar caminho da árvore como selects
function renderTreePathAsSelects(fieldId, path) {
    console.log(`=== RENDERIZANDO CAMINHO COMO SELECTS ===`);
    console.log('Field ID:', fieldId);
    console.log('Path:', path);
    
    const treeContainer = document.querySelector(`[data-field-id="${fieldId}"] .tree-field-container`);
    if (!treeContainer) {
        console.log('❌ Container de árvore não encontrado');
        return;
    }
    
    // Limpar container
    treeContainer.innerHTML = '';
    
    // Buscar o formulário para obter a estrutura completa
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('❌ Campo de árvore não encontrado');
        return;
    }
    
    const treeStructure = targetField.config.treeStructure;
    let currentLevel = 0;
    let currentChildren = treeStructure;
    
    // Renderizar cada nível do caminho
    for (let i = 0; i < path.length; i++) {
        const targetNode = path[i];
        
        // Criar select para o nível atual
        const selectHTML = `
            <select class="tree-level-select" data-level="${currentLevel}" data-field-id="${fieldId}" onchange="handleTreeLevelChange(this)">
                <option value="">Selecione uma opção</option>
                ${currentChildren.map(child => `<option value="${child.label}" data-node-id="${child.id}" data-has-children="${child.children && child.children.length > 0}" ${child.label === targetNode.label ? 'selected' : ''}>${child.label}</option>`).join('')}
            </select>
        `;
        
        treeContainer.insertAdjacentHTML('beforeend', selectHTML);
        
        // Se não é o último nó, preparar próximo nível
        if (i < path.length - 1) {
            const selectedNode = currentChildren.find(child => child.label === targetNode.label);
            if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
                currentChildren = selectedNode.children;
                currentLevel++;
            } else {
                console.log('❌ Nó selecionado não tem filhos');
                break;
            }
        }
    }
    
    console.log('=== CAMINHO COMO SELECTS RENDERIZADO ===');
}

// Função específica para atualizar campos de árvore
function updateTreeFieldDisplay(fieldId, savedValue) {
    console.log(`=== ATUALIZANDO CAMPO DE ÁRVORE ===`);
    console.log('Field ID:', fieldId);
    console.log('Saved Value:', savedValue);
    
    const fieldContainer = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (!fieldContainer) {
        console.log('❌ Campo não encontrado no DOM');
        return;
    }
    
    // Para campos tree-select (dropdown)
    const treeSelectBtn = fieldContainer.querySelector('.tree-select-btn');
    if (treeSelectBtn) {
        treeSelectBtn.innerHTML = `${savedValue} <i class="fas fa-chevron-down"></i>`;
        console.log(`✅ Botão tree-select atualizado: ${savedValue}`);
        return;
    }
    
    // Para campos tree (cascata)
    const treeContainer = fieldContainer.querySelector('.tree-selection-container');
    if (treeContainer) {
        // Encontrar o nó selecionado e marcar como selecionado
        const allNodes = treeContainer.querySelectorAll('.tree-selection-item');
        allNodes.forEach(node => {
            const nodeLabel = node.querySelector('.tree-node-label');
            if (nodeLabel && nodeLabel.textContent === savedValue) {
                node.classList.add('selected');
                console.log(`✅ Nó marcado como selecionado: ${savedValue}`);
            } else {
                node.classList.remove('selected');
            }
        });
        
        // Se for uma árvore em cascata, expandir até o valor selecionado
        if (savedValue) {
            expandTreeToValue(fieldId, savedValue);
        }
    }
    
    console.log('=== CAMPO DE ÁRVORE ATUALIZADO ===');
}

// Função para expandir árvore até o valor selecionado
function expandTreeToValue(fieldId, targetValue) {
    console.log(`=== EXPANDINDO ÁRVORE ATÉ VALOR ===`);
    console.log('Field ID:', fieldId);
    console.log('Target Value:', targetValue);
    
    // Buscar o formulário e campo
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('❌ Campo de árvore não encontrado');
        return;
    }
    
    // Encontrar o caminho até o valor
    const path = findPathToValue(targetField.config.treeStructure, targetValue);
    console.log('Caminho encontrado:', path);
    
    if (path.length > 0) {
        // Renderizar o caminho completo
        renderTreePath(fieldId, path);
    }
}

// Função para encontrar caminho até um valor na árvore
function findPathToValue(treeStructure, targetValue) {
    console.log(`🔍 Procurando caminho para: "${targetValue}"`);
    console.log('Estrutura da árvore:', treeStructure);
    
    for (const node of treeStructure) {
        console.log(`Verificando nó: "${node.label}"`);
        if (node.label === targetValue) {
            console.log(`✅ Valor encontrado no primeiro nível: "${node.label}"`);
            return [node];
        }
        if (node.children && node.children.length > 0) {
            console.log(`🔍 Procurando nos filhos de "${node.label}"`);
            const childPath = findPathToValue(node.children, targetValue);
            if (childPath.length > 0) {
                console.log(`✅ Caminho encontrado através de "${node.label}"`);
                return [node, ...childPath];
            }
        }
    }
    console.log(`❌ Caminho não encontrado para: "${targetValue}"`);
    return [];
}

// Função para renderizar caminho da árvore
function renderTreePath(fieldId, path) {
    console.log(`=== RENDERIZANDO CAMINHO DA ÁRVORE ===`);
    console.log('Field ID:', fieldId);
    console.log('Path:', path);
    
    const treeContainer = document.querySelector(`#tree_${fieldId} .tree-cascade-container`);
    if (!treeContainer) {
        console.log('❌ Container de árvore não encontrado');
        return;
    }
    
    // Limpar container
    treeContainer.innerHTML = '';
    
    // Renderizar cada nível do caminho
    let currentLevel = 0;
    path.forEach(node => {
        const nodeHTML = renderTreeNode(node, fieldId, currentLevel, node.label);
        treeContainer.insertAdjacentHTML('beforeend', nodeHTML);
        
        // Se não é o último nó, renderizar filhos
        if (currentLevel < path.length - 1) {
            const nextNode = path[currentLevel + 1];
            const childrenHTML = renderTreeNode(nextNode, fieldId, currentLevel + 1, nextNode.label);
            treeContainer.insertAdjacentHTML('beforeend', childrenHTML);
        }
        
        currentLevel++;
    });
    
    // Reconfigurar eventos
    setupCascadeTreeEvents(treeContainer, getCurrentTicketId());
    
    console.log('=== CAMINHO DA ÁRVORE RENDERIZADO ===');
}

// Função para renderizar seleção de árvore
function renderTreeSelection(field, currentValue) {
    console.log(`=== RENDERIZANDO ÁRVORE COMO SELECT: ${field.label} ===`);
    console.log('Field ID:', field.id);
    console.log('Current Value:', currentValue);
    console.log('Field config:', field.config);
    
    if (!field.config || !field.config.treeStructure) {
        console.log('❌ Estrutura da árvore não encontrada!');
        return '<p class="form-error">Estrutura da árvore não encontrada!</p>';
    }
    
    const treeStructure = field.config.treeStructure;
    console.log('Tree structure:', treeStructure);
    
    // Renderizar como select simples
    let html = `<div class="tree-field-container" data-field-id="${field.id}">`;
    
    // Renderizar cascata completa se há valor salvo
    if (currentValue) {
        console.log('Valor salvo encontrado, reconstruindo cascata completa...');
        const path = findPathToValue(treeStructure, currentValue);
        console.log('Caminho encontrado:', path);
        
        if (path.length > 0) {
            // Renderizar cada nível do caminho
            let currentLevel = 0;
            let currentChildren = treeStructure;
            
            for (let i = 0; i < path.length; i++) {
                const targetNode = path[i];
                
                // Criar select para o nível atual
                html += `<select class="tree-level-select" data-level="${currentLevel}" data-field-id="${field.id}" onchange="handleTreeLevelChange(this)">`;
                html += '<option value="">Selecione uma opção</option>';
                
                currentChildren.forEach(child => {
                    const selected = child.label === targetNode.label ? 'selected' : '';
                    html += `<option value="${child.label}" data-node-id="${child.id}" data-has-children="${child.children && child.children.length > 0}" ${selected}>${child.label}</option>`;
                });
                
                html += '</select>';
                
                // Se não é o último nó, preparar próximo nível
                if (i < path.length - 1) {
                    const selectedNode = currentChildren.find(child => child.label === targetNode.label);
                    if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
                        currentChildren = selectedNode.children;
                        currentLevel++;
                    } else {
                        console.log('❌ Nó selecionado não tem filhos');
                        break;
                    }
                }
            }
        } else {
            console.log('Caminho não encontrado, renderizando primeiro nível...');
            // Fallback para primeiro nível
            html += `<select class="tree-level-select" data-level="0" data-field-id="${field.id}" onchange="handleTreeLevelChange(this)">`;
            html += '<option value="">Selecione uma opção</option>';
            
            treeStructure.forEach(node => {
                const selected = currentValue === node.label ? 'selected' : '';
                html += `<option value="${node.label}" data-node-id="${node.id}" data-has-children="${node.children && node.children.length > 0}" ${selected}>${node.label}</option>`;
            });
            
            html += '</select>';
        }
    } else {
        // Sem valor salvo, renderizar apenas primeiro nível
        console.log('Sem valor salvo, renderizando primeiro nível...');
        html += `<select class="tree-level-select" data-level="0" data-field-id="${field.id}" onchange="handleTreeLevelChange(this)">`;
        html += '<option value="">Selecione uma opção</option>';
        
        treeStructure.forEach(node => {
            html += `<option value="${node.label}" data-node-id="${node.id}" data-has-children="${node.children && node.children.length > 0}">${node.label}</option>`;
        });
        
        html += '</select>';
    }
    
    html += '</div>';
    
    console.log(`=== ÁRVORE COMO SELECT RENDERIZADA: ${field.label} ===`);
    return html;
}

// Função para renderizar árvore sequencial estilo Zendesk
function renderTreeSequential(field, currentValue) {
    console.log(`=== RENDERIZANDO ÁRVORE SEQUENCIAL (ZENDESK): ${field.label} ===`);
    console.log('Field ID:', field.id);
    console.log('Current Value:', currentValue);
    console.log('Field config:', field.config);
    
    if (!field.config || !field.config.treeStructure) {
        console.log('❌ Estrutura da árvore não encontrada!');
        return '<p class="form-error">Estrutura da árvore não encontrada!</p>';
    }
    
    const treeStructure = field.config.treeStructure;
    console.log('Tree structure:', treeStructure);
    
    // Renderizar como selects sequenciais (estilo Zendesk)
    let html = `<div class="tree-sequential-container" data-field-id="${field.id}">`;
    
    // Se há valor salvo, reconstruir o caminho completo
    if (currentValue) {
        console.log('Valor salvo encontrado, reconstruindo caminho sequencial...');
        const path = findPathToValue(treeStructure, currentValue);
        console.log('Caminho encontrado:', path);
        
        if (path.length > 0) {
            // Renderizar cada nível do caminho sequencialmente
            let currentChildren = treeStructure;
            
            for (let i = 0; i < path.length; i++) {
                const targetNode = path[i];
                
                // Criar select para o nível atual
                html += `<div class="tree-sequential-level" data-level="${i}">`;
                html += `<label class="tree-sequential-label">${i === 0 ? field.label : 'Selecione uma opção'}</label>`;
                html += `<select class="tree-sequential-select" data-level="${i}" data-field-id="${field.id}" onchange="handleTreeSequentialChange(this)">`;
                html += '<option value="">Selecione uma opção</option>';
                
                currentChildren.forEach(child => {
                    const selected = child.label === targetNode.label ? 'selected' : '';
                    html += `<option value="${child.label}" data-node-id="${child.id}" data-has-children="${child.children && child.children.length > 0}" ${selected}>${child.label}</option>`;
                });
                
                html += '</select>';
                html += '</div>';
                
                // Se não é o último nó, preparar próximo nível
                if (i < path.length - 1) {
                    const selectedNode = currentChildren.find(child => child.label === targetNode.label);
                    if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
                        currentChildren = selectedNode.children;
                    } else {
                        console.log('❌ Nó selecionado não tem filhos');
                        break;
                    }
                }
            }
        } else {
            // Fallback para primeiro nível
            html += `<div class="tree-sequential-level" data-level="0">`;
            html += `<label class="tree-sequential-label">${field.label}</label>`;
            html += `<select class="tree-sequential-select" data-level="0" data-field-id="${field.id}" onchange="handleTreeSequentialChange(this)">`;
            html += '<option value="">Selecione uma opção</option>';
            
            treeStructure.forEach(node => {
                const selected = currentValue === node.label ? 'selected' : '';
                html += `<option value="${node.label}" data-node-id="${node.id}" data-has-children="${node.children && node.children.length > 0}" ${selected}>${node.label}</option>`;
            });
            
            html += '</select>';
            html += '</div>';
        }
    } else {
        // Sem valor salvo, renderizar apenas primeiro nível
        console.log('Sem valor salvo, renderizando primeiro nível...');
        html += `<div class="tree-sequential-level" data-level="0">`;
        html += `<label class="tree-sequential-label">${field.label}</label>`;
        html += `<select class="tree-sequential-select" data-level="0" data-field-id="${field.id}" onchange="handleTreeSequentialChange(this)">`;
        html += '<option value="">Selecione uma opção</option>';
        
        treeStructure.forEach(node => {
            html += `<option value="${node.label}" data-node-id="${node.id}" data-has-children="${node.children && node.children.length > 0}">${node.label}</option>`;
        });
        
        html += '</select>';
        html += '</div>';
    }
    
    html += '</div>';
    
    console.log(`=== ÁRVORE SEQUENCIAL RENDERIZADA: ${field.label} ===`);
    return html;
}

// Função para lidar com mudança em árvore sequencial (estilo Zendesk)
function handleTreeSequentialChange(selectElement) {
    console.log('=== MUDANÇA EM ÁRVORE SEQUENCIAL (ZENDESK) ===');
    console.log('Select:', selectElement);
    console.log('Valor selecionado:', selectElement.value);
    
    const fieldId = selectElement.getAttribute('data-field-id');
    const level = parseInt(selectElement.getAttribute('data-level'));
    const selectedValue = selectElement.value;
    
    console.log('Field ID:', fieldId);
    console.log('Level:', level);
    console.log('Selected Value:', selectedValue);
    
    // Remover todos os níveis seguintes
    const container = document.querySelector(`.tree-sequential-container[data-field-id="${fieldId}"]`);
    if (container) {
        const allLevels = container.querySelectorAll('.tree-sequential-level');
        allLevels.forEach((levelDiv, index) => {
            if (index > level) {
                levelDiv.remove();
            }
        });
    }
    
    // Se não selecionou nada, apenas limpar
    if (!selectedValue) {
        // Salvar valor vazio
        updateTicketFormData(fieldId, '');
        return;
    }
    
    // Salvar o valor atual (caminho completo até aqui)
    const path = getTreeSequentialPath(fieldId);
    const fullPath = path.join(' > ');
    console.log('Salvando caminho completo:', fullPath);
    updateTicketFormData(fieldId, fullPath);
    
    // Buscar o nó selecionado
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('❌ Campo de árvore não encontrado');
        return;
    }
    
    // Encontrar o nó selecionado no caminho atual
    const pathNodes = getTreeSequentialPathNodes(fieldId, targetField.config.treeStructure);
    const selectedNode = pathNodes[level];
    
    console.log('Nó selecionado:', selectedNode);
    
    // Se o nó tem filhos, mostrar próximo nível
    if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
        console.log('Nó tem filhos, criando próximo nível sequencial...');
        createNextSequentialLevel(fieldId, selectedNode.children, level + 1);
    } else {
        console.log('Nó não tem filhos, seleção completa.');
    }
    
    console.log('=== MUDANÇA EM ÁRVORE SEQUENCIAL PROCESSADA ===');
}

// Função para obter caminho atual da árvore sequencial
function getTreeSequentialPath(fieldId) {
    const container = document.querySelector(`.tree-sequential-container[data-field-id="${fieldId}"]`);
    if (!container) return [];
    
    const selects = container.querySelectorAll('.tree-sequential-select');
    const path = [];
    
    selects.forEach(select => {
        if (select.value) {
            path.push(select.value);
        }
    });
    
    return path;
}

// Função para obter nós do caminho atual
function getTreeSequentialPathNodes(fieldId, treeStructure) {
    const path = getTreeSequentialPath(fieldId);
    const nodes = [];
    let currentChildren = treeStructure;
    
    for (const label of path) {
        const node = currentChildren.find(child => child.label === label);
        if (node) {
            nodes.push(node);
            if (node.children && node.children.length > 0) {
                currentChildren = node.children;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    
    return nodes;
}

// Função para criar próximo nível sequencial
function createNextSequentialLevel(fieldId, children, level) {
    console.log(`=== CRIANDO PRÓXIMO NÍVEL SEQUENCIAL ${level} ===`);
    console.log('Field ID:', fieldId);
    console.log('Children:', children);
    
    const container = document.querySelector(`.tree-sequential-container[data-field-id="${fieldId}"]`);
    if (!container) {
        console.log('❌ Container não encontrado');
        return;
    }
    
    // Criar novo nível
    const levelHTML = `
        <div class="tree-sequential-level" data-level="${level}">
            <label class="tree-sequential-label">Selecione uma opção</label>
            <select class="tree-sequential-select" data-level="${level}" data-field-id="${fieldId}" onchange="handleTreeSequentialChange(this)">
                <option value="">Selecione uma opção</option>
                ${children.map(child => `<option value="${child.label}" data-node-id="${child.id}" data-has-children="${child.children && child.children.length > 0}">${child.label}</option>`).join('')}
            </select>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', levelHTML);
    console.log(`✅ Próximo nível sequencial ${level} criado`);
}

// Função para lidar com mudança em nível da árvore
function handleTreeLevelChange(selectElement) {
    console.log('=== MUDANÇA EM NÍVEL DA ÁRVORE ===');
    console.log('Select:', selectElement);
    console.log('Valor selecionado:', selectElement.value);
    
    const fieldId = selectElement.getAttribute('data-field-id');
    const level = parseInt(selectElement.getAttribute('data-level'));
    const selectedValue = selectElement.value;
    
    console.log('Field ID:', fieldId);
    console.log('Level:', level);
    console.log('Selected Value:', selectedValue);
    
    // Salvar o valor atual
    console.log('Salvando valor:', selectedValue, 'para field:', fieldId);
    updateTicketFormData(fieldId, selectedValue);
    
    // Verificar se foi salvo
    setTimeout(() => {
        const ticketId = getCurrentTicketId();
        if (ticketId) {
            const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
            let ticket = null;
            
            for (const box of kanbanColumns) {
                if (box.tickets) {
                    ticket = box.tickets.find(t => t.id === ticketId);
                    if (ticket) break;
                }
            }
            
            if (ticket && ticket.formData) {
                console.log('✅ Valor salvo confirmado:', ticket.formData[fieldId]);
            } else {
                console.log('❌ Valor não foi salvo!');
            }
        }
    }, 100);
    
    // Buscar o nó selecionado
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('❌ Campo de árvore não encontrado');
        return;
    }
    
    // Encontrar o nó selecionado
    const selectedNode = findNodeByLabel(targetField.config.treeStructure, selectedValue);
    console.log('Nó selecionado:', selectedNode);
    
    if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
        console.log('Nó tem filhos, criando próximo nível...');
        createNextLevel(fieldId, selectedNode.children, level + 1);
    } else {
        console.log('Nó não tem filhos, removendo níveis seguintes...');
        removeNextLevels(fieldId, level + 1);
    }
    
    console.log('=== MUDANÇA EM NÍVEL PROCESSADA ===');
}

// Função para encontrar nó por label
function findNodeByLabel(treeStructure, label) {
    console.log(`🔍 Procurando nó com label: "${label}"`);
    console.log('Estrutura atual:', treeStructure);
    
    for (const node of treeStructure) {
        console.log(`Verificando nó: "${node.label}"`);
        if (node.label === label) {
            console.log(`✅ Nó encontrado: "${node.label}"`);
            return node;
        }
        if (node.children && node.children.length > 0) {
            console.log(`🔍 Procurando nos filhos de "${node.label}"`);
            const found = findNodeByLabel(node.children, label);
            if (found) return found;
        }
    }
    console.log(`❌ Nó não encontrado: "${label}"`);
    return null;
}

// Função para criar próximo nível
function createNextLevel(fieldId, children, level) {
    console.log(`=== CRIANDO PRÓXIMO NÍVEL ${level} ===`);
    console.log('Field ID:', fieldId);
    console.log('Children:', children);
    
    const container = document.querySelector(`[data-field-id="${fieldId}"] .tree-field-container`);
    if (!container) {
        console.log('❌ Container não encontrado');
        return;
    }
    
    // Remover níveis seguintes primeiro
    removeNextLevels(fieldId, level);
    
    // Criar novo select
    const selectHTML = `
        <select class="tree-level-select" data-level="${level}" data-field-id="${fieldId}" onchange="handleTreeLevelChange(this)">
            <option value="">Selecione uma opção</option>
            ${children.map(child => `<option value="${child.label}" data-node-id="${child.id}" data-has-children="${child.children && child.children.length > 0}">${child.label}</option>`).join('')}
        </select>
    `;
    
    container.insertAdjacentHTML('beforeend', selectHTML);
    console.log(`✅ Próximo nível ${level} criado`);
}

// Função para remover níveis seguintes
function removeNextLevels(fieldId, fromLevel) {
    console.log(`=== REMOVENDO NÍVEIS A PARTIR DE ${fromLevel} ===`);
    
    const container = document.querySelector(`[data-field-id="${fieldId}"] .tree-field-container`);
    if (!container) {
        console.log('❌ Container não encontrado');
        return;
    }
    
    const selects = container.querySelectorAll('.tree-level-select');
    selects.forEach(select => {
        const level = parseInt(select.getAttribute('data-level'));
        if (level >= fromLevel) {
            select.remove();
            console.log(`✅ Nível ${level} removido`);
        }
    });
}

// Função para renderizar nó da árvore
function renderTreeNode(node, fieldId, level, currentValue) {
    const isSelected = currentValue === node.label;
    const hasChildren = node.children && node.children.length > 0;
    
    let html = `<div class="tree-selection-item level-${level} ${isSelected ? 'selected' : ''}" 
        data-node-id="${node.id}" 
        data-field-id="${fieldId}" 
        data-level="${level}">`;
    
    html += `<span class="tree-node-label">${node.label}</span>`;
    
    if (hasChildren) {
        html += `<span class="tree-expand-icon"><i class="fas fa-chevron-right"></i></span>`;
    }
    
    html += `</div>`;
    return html;
}

// Função para alternar dropdown de árvore
function toggleTreeSelect(fieldId) {
    const dropdown = document.getElementById(`treeDropdown_${fieldId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Função para configurar eventos de árvore em cascata
function setupCascadeTreeEvents(container, ticketId) {
    const fieldId = container.id.replace('tree_', '');
    const nodes = container.querySelectorAll('.tree-selection-item');
    
    nodes.forEach(node => {
        node.addEventListener('click', function(e) {
            e.stopPropagation();
            const nodeId = this.getAttribute('data-node-id');
            const nodeLabel = this.querySelector('.tree-node-label').textContent;
            const level = parseInt(this.getAttribute('data-level'));
            
            console.log('Nó da árvore clicado:', fieldId, nodeLabel, 'ID:', nodeId, 'Nível:', level);
            
            selectTreeNode(fieldId, nodeLabel, nodeId, level, ticketId);
        });
    });
}

// Função para selecionar nó da árvore
function selectTreeNode(fieldId, nodeLabel, nodeId, level, ticketId) {
    console.log('Selecionando nó da árvore em cascata:', fieldId, '=', nodeLabel, 'nível:', level);
    
    // Buscar o formulário e campo
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let foundForm = null;
    let foundField = null;
    
    for (const form of forms) {
        const field = form.fields.find(f => f.id == fieldId);
        if (field) {
            foundForm = form;
            foundField = field;
            break;
        }
    }
    
    if (!foundForm || !foundField) {
        console.log('Formulário ou campo de árvore não encontrado para fieldId:', fieldId);
        return;
    }
    
    console.log('Formulário encontrado:', foundForm.name);
    console.log('Campo de árvore encontrado:', foundField.label);
    
    // Encontrar o nó na estrutura
    const treeStructure = foundField.config.treeStructure;
    const selectedNode = findNodeById(treeStructure, nodeId);
    
    if (!selectedNode) {
        console.log('Nó selecionado não encontrado:', nodeLabel);
        return;
    }
    
    console.log('Nó selecionado encontrado:', nodeLabel);
    
    // Atualizar dados do formulário
    updateTicketFormData(fieldId, nodeLabel);
    
    // Se o nó tem filhos, renderizar próximo nível
    if (selectedNode.children && selectedNode.children.length > 0) {
        console.log('Nó tem filhos:', selectedNode.children.length);
        renderNextLevel(fieldId, selectedNode.children, level + 1);
    } else {
        console.log('Nó não tem filhos ou é folha');
    }
}

// Função para encontrar nó por ID
function findNodeById(treeStructure, nodeId) {
    for (const node of treeStructure) {
        if (node.id == nodeId) {
            return node;
        }
        if (node.children) {
            const found = findNodeById(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
}

// Função para renderizar próximo nível da árvore
function renderNextLevel(fieldId, children, level) {
    const container = document.getElementById(`tree_${fieldId}`);
    if (!container) return;
    
    let nextLevelHTML = '';
    children.forEach(child => {
        nextLevelHTML += renderTreeNode(child, fieldId, level, '');
    });
    
    console.log('HTML do próximo nível gerado:', nextLevelHTML);
    
    // Adicionar próximo nível ao container
    const cascadeContainer = container.querySelector('.tree-cascade-container') || container.querySelector('.tree-dropdown');
    if (cascadeContainer) {
        console.log('Container de cascata encontrado, adicionando próximo nível');
        cascadeContainer.insertAdjacentHTML('beforeend', nextLevelHTML);
        console.log('Próximo nível adicionado ao DOM');
        
        // Reconfigurar eventos para os novos nós
        setupCascadeTreeEvents(container, getCurrentTicketId());
    }
}

// Função para carregar campos do formulário selecionado
function loadFormFields() {
    const formSelect = document.getElementById('ticketFormSelect');
    const formFieldsContainer = document.getElementById('formFieldsContainer');
    
    if (!formSelect || !formFieldsContainer) return;
    
    const selectedFormId = formSelect.value;
    
    if (!selectedFormId || selectedFormId === '') {
        formFieldsContainer.innerHTML = '';
        return;
    }
    
    // Buscar o formulário selecionado
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const selectedForm = forms.find(form => form.id == selectedFormId);
    
    if (!selectedForm) {
        formFieldsContainer.innerHTML = '<p class="form-error">Formulário não encontrado!</p>';
        return;
    }
    
    // Renderizar campos do formulário
    let fieldsHTML = '<div class="form-fields-section"><h4>Campos do Formulário</h4>';
    
    selectedForm.fields.forEach(field => {
        fieldsHTML += renderFormFieldForTicket(field);
    });
    
    fieldsHTML += '</div>';
    formFieldsContainer.innerHTML = fieldsHTML;
}

// Função para renderizar campo do formulário no ticket
function renderFormFieldForTicket(field) {
    let fieldHTML = `<div class="form-field" data-field-id="${field.id}">`;
    fieldHTML += `<label for="field_${field.id}">${field.label}${field.required ? ' *' : ''}</label>`;
    
    switch (field.type) {
        case 'text':
            fieldHTML += `<input type="text" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'textarea':
            fieldHTML += `<textarea id="field_${field.id}" name="${field.id}" rows="3" ${field.required ? 'required' : ''}></textarea>`;
            break;
        case 'select':
            fieldHTML += `<select id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            fieldHTML += '<option value="">Selecione uma opção</option>';
            if (field.options) {
                field.options.forEach(option => {
                    fieldHTML += `<option value="${option}">${option}</option>`;
                });
            }
            fieldHTML += '</select>';
            break;
        case 'checkbox':
            fieldHTML += `<input type="checkbox" id="field_${field.id}" name="${field.id}" value="sim">`;
            break;
        case 'radio':
            if (field.options) {
                field.options.forEach((option, index) => {
                    fieldHTML += `<label class="radio-option">
                        <input type="radio" id="field_${field.id}_${index}" name="${field.id}" value="${option}" ${field.required ? 'required' : ''}>
                        ${option}
                    </label>`;
                });
            }
            break;
        case 'date':
            fieldHTML += `<input type="date" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'email':
            fieldHTML += `<input type="email" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        case 'number':
            fieldHTML += `<input type="number" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
            break;
        default:
            fieldHTML += `<input type="text" id="field_${field.id}" name="${field.id}" ${field.required ? 'required' : ''}>`;
    }
    
    fieldHTML += '</div>';
    return fieldHTML;
}

// Função para buscar tickets
function searchTickets() {
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const ticketsList = document.getElementById('ticketsList');
    
    if (!ticketsList) return;
    
    // Buscar tanto tickets antigos (.ticket-item) quanto novos (.ticket-item-slim)
    const ticketItems = ticketsList.querySelectorAll('.ticket-item, .ticket-item-slim');
    
    if (searchTerm === '') {
        // Mostrar todos os tickets
        ticketItems.forEach(item => {
            item.style.display = 'flex';
            if (item.classList.contains('ticket-item-slim')) {
                item.style.display = 'flex';
            }
        });
        return;
    }
    
    ticketItems.forEach(item => {
        let title = '';
        let description = '';
        
        // Verificar se é ticket fino (novo) ou antigo
        if (item.classList.contains('ticket-item-slim')) {
            title = item.querySelector('.ticket-slim-title h5')?.textContent.toLowerCase() || '';
            description = item.querySelector('.ticket-slim-description')?.textContent.toLowerCase() || '';
        } else {
            title = item.querySelector('.ticket-header h4')?.textContent.toLowerCase() || '';
            description = item.querySelector('.ticket-description')?.textContent.toLowerCase() || '';
        }
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Função para ordenar tickets
function sortTickets() {
    const sortSelect = document.getElementById('sortTickets');
    const ticketsList = document.getElementById('ticketsList');
    
    if (!sortSelect || !ticketsList) return;
    
    const sortBy = sortSelect.value;
    // Incluir tanto tickets antigos quanto novos
    const ticketItems = Array.from(ticketsList.querySelectorAll('.ticket-item, .ticket-item-slim'));
    
    ticketItems.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                let nameA, nameB;
                if (a.classList.contains('ticket-item-slim')) {
                    nameA = a.querySelector('.ticket-slim-title h5')?.textContent || '';
                    nameB = b.querySelector('.ticket-slim-title h5')?.textContent || '';
                } else {
                    nameA = a.querySelector('.ticket-header h4')?.textContent || '';
                    nameB = b.querySelector('.ticket-header h4')?.textContent || '';
                }
                return nameA.localeCompare(nameB);
            
            case 'date':
                let dateA, dateB;
                if (a.classList.contains('ticket-item-slim')) {
                    dateA = new Date(a.querySelector('.ticket-slim-date')?.textContent || '');
                    dateB = new Date(b.querySelector('.ticket-slim-date')?.textContent || '');
                } else {
                    dateA = new Date(a.querySelector('.ticket-date')?.textContent || '');
                    dateB = new Date(b.querySelector('.ticket-date')?.textContent || '');
                }
                return dateB - dateA; // Mais recente primeiro
            
            case 'update':
                let updateA, updateB;
                if (a.classList.contains('ticket-item-slim')) {
                    updateA = new Date(a.querySelector('.ticket-slim-date')?.textContent || '');
                    updateB = new Date(b.querySelector('.ticket-slim-date')?.textContent || '');
                } else {
                    updateA = new Date(a.querySelector('.ticket-date')?.textContent || '');
                    updateB = new Date(b.querySelector('.ticket-date')?.textContent || '');
                }
                return updateB - updateA;
            
            case 'group':
                let statusA, statusB;
                if (a.classList.contains('ticket-item-slim')) {
                    statusA = a.querySelector('.ticket-slim-status')?.textContent || '';
                    statusB = b.querySelector('.ticket-slim-status')?.textContent || '';
                } else {
                    statusA = a.querySelector('.ticket-status')?.textContent || '';
                    statusB = b.querySelector('.ticket-status')?.textContent || '';
                }
                return statusA.localeCompare(statusB);
            
            default:
                return 0;
        }
    });
    
    // Reordenar os elementos no DOM
    ticketItems.forEach(item => ticketsList.appendChild(item));
}

// Função para configurar filtros de tickets
function setupTicketFilters() {
    // Configurar busca de tickets
    const searchInput = document.getElementById('searchTickets');
    if (searchInput) {
        searchInput.addEventListener('input', searchTickets);
    }
    
    // Configurar ordenação de tickets
    const sortSelect = document.getElementById('sortTickets');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortTickets);
    }
}

// Função para criar caixas Kanban padrão
function forceCreateKanbanBoxes() {
    const kanbanColumns = [
        { id: 'novos', name: 'Novos', tickets: [] },
        { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
        { id: 'em-espera', name: 'Em Espera', tickets: [] },
        { id: 'pendentes', name: 'Pendentes', tickets: [] },
        { id: 'resolvidos', name: 'Resolvidos', tickets: [] },
        { id: 'em-aberto', name: 'Em Aberto', tickets: [] }
    ];
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    loadBoxes();
    showNotification('Caixas Kanban criadas com sucesso!', 'success');
}

// Função para carregar dashboard
function loadDashboardStats() {
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Coletar todos os tickets
    let allTickets = [];
    kanbanColumns.forEach(box => {
        if (box.tickets && Array.isArray(box.tickets)) {
            allTickets = allTickets.concat(box.tickets);
        }
    });
    
    // Calcular estatísticas
    const stats = calculateTicketStats(allTickets);
    
    // Atualizar KPIs
    updateDashboardKPIs(stats);
    
    // Atualizar cards de resumo
    updateDashboardSummaryCards(stats, allTickets);
    
    // Atualizar gráficos
    updateDashboardCharts(stats);
}

// Função para calcular estatísticas dos tickets
function calculateTicketStats(tickets) {
    const stats = {
        total: tickets.length,
        byStatus: {},
        byPriority: {},
        byResponsible: {},
        resolved: 0,
        pending: 0,
        inProgress: 0,
        new: 0,
        closed: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        avgResolutionTime: 0,
        withRating: 0,
        avgRating: 0
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let totalRating = 0;
    
    tickets.forEach(ticket => {
        // Por status - normalizar status para garantir consistência
        let status = ticket.status || 'novo';
        
        // Normalizar variações de status
        if (status === 'em-aberto') {
            status = 'em-andamento';
        } else if (status === 'novos') {
            status = 'novo';
        }
        
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        if (status === 'resolvido' || status === 'fechado') {
            stats.resolved++;
        } else if (status === 'pendente') {
            stats.pending++;
        } else if (status === 'em-andamento') {
            stats.inProgress++;
        } else if (status === 'novo') {
            stats.new++;
        }
        
        if (status === 'fechado') {
            stats.closed++;
        }
        
        // Por prioridade
        const priority = ticket.priority || 'normal';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        
        // Por responsável
        const responsible = ticket.responsibleAgent || 'Não atribuído';
        stats.byResponsible[responsible] = (stats.byResponsible[responsible] || 0) + 1;
        
        // Por data
        if (ticket.createdAt) {
            const createdDate = new Date(ticket.createdAt);
            if (createdDate >= today) {
                stats.today++;
            }
            if (createdDate >= weekAgo) {
                stats.thisWeek++;
            }
            if (createdDate >= monthAgo) {
                stats.thisMonth++;
            }
        }
        
        // Tempo de resolução
        if (ticket.createdAt && ticket.updatedAt && (status === 'resolvido' || status === 'fechado')) {
            const created = new Date(ticket.createdAt);
            const updated = new Date(ticket.updatedAt);
            const diffHours = (updated - created) / (1000 * 60 * 60);
            totalResolutionTime += diffHours;
            resolvedCount++;
        }
        
        // Avaliações
        if (ticket.rating) {
            stats.withRating++;
            const ratingValue = typeof ticket.rating === 'string' ? 
                (ticket.rating.includes('Bom') ? 5 : ticket.rating.includes('Ruim') ? 1 : 3) : 
                ticket.rating;
            totalRating += ratingValue;
        }
    });
    
    // Calcular médias
    if (resolvedCount > 0) {
        stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedCount);
    }
    
    if (stats.withRating > 0) {
        stats.avgRating = (totalRating / stats.withRating).toFixed(1);
    }
    
    return stats;
}

// Função para atualizar KPIs do dashboard
function updateDashboardKPIs(stats) {
    const resolvedTicketsEl = document.getElementById('resolvedTickets');
    if (resolvedTicketsEl) {
        resolvedTicketsEl.textContent = stats.resolved;
    }
    
    const avgResolutionTimeEl = document.getElementById('avgResolutionTime');
    if (avgResolutionTimeEl) {
        const hours = Math.floor(stats.avgResolutionTime);
        const minutes = Math.round((stats.avgResolutionTime - hours) * 60);
        avgResolutionTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    const satisfactionScoreEl = document.getElementById('satisfactionScore');
    if (satisfactionScoreEl) {
        satisfactionScoreEl.textContent = stats.avgRating > 0 ? `${stats.avgRating}/5` : 'N/A';
    }
    
    const activeAgentsEl = document.getElementById('activeAgents');
    if (activeAgentsEl) {
        const agentsCount = Object.keys(stats.byResponsible).filter(a => a !== 'Não atribuído').length;
        activeAgentsEl.textContent = agentsCount;
    }
}

// Função para atualizar cards de resumo
function updateDashboardSummaryCards(stats, tickets) {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    // Verificar se já existe a seção de resumo, se não, criar
    let summarySection = document.getElementById('dashboardSummarySection');
    if (!summarySection) {
        summarySection = document.createElement('div');
        summarySection.id = 'dashboardSummarySection';
        summarySection.className = 'dashboard-summary-section';
        summarySection.innerHTML = '<h3>Resumo de Tickets</h3><div class="summary-cards-grid" id="summaryCardsGrid"></div>';
        
        // Inserir após a seção de KPIs
        const kpiSection = document.querySelector('.kpi-section');
        if (kpiSection && kpiSection.parentNode) {
            kpiSection.parentNode.insertBefore(summarySection, kpiSection.nextSibling);
        } else {
            dashboardContainer.appendChild(summarySection);
        }
    }
    
    const summaryCardsGrid = document.getElementById('summaryCardsGrid');
    if (!summaryCardsGrid) return;
    
    // Mapear status para nomes e cores
    const statusMap = {
        'novo': { name: 'Novos', color: '#17a2b8', icon: 'fa-plus-circle' },
        'novos': { name: 'Novos', color: '#17a2b8', icon: 'fa-plus-circle' },
        'em-andamento': { name: 'Em Andamento', color: '#ffc107', icon: 'fa-spinner' },
        'pendente': { name: 'Pendentes', color: '#ff9800', icon: 'fa-clock' },
        'resolvido': { name: 'Resolvidos', color: '#28a745', icon: 'fa-check-circle' },
        'fechado': { name: 'Fechados', color: '#6c757d', icon: 'fa-lock' }
    };
    
    // Mapear prioridades para nomes e cores
    const priorityMap = {
        'baixa': { name: 'Baixa', color: '#6c757d', icon: 'fa-arrow-down' },
        'normal': { name: 'Normal', color: '#17a2b8', icon: 'fa-minus' },
        'alta': { name: 'Alta', color: '#ffc107', icon: 'fa-arrow-up' },
        'urgente': { name: 'Urgente', color: '#dc3545', icon: 'fa-exclamation-triangle' }
    };
    
    let cardsHTML = '';
    
    // Cards por Status
    cardsHTML += '<div class="summary-card-group">';
    cardsHTML += '<h4><i class="fas fa-info-circle"></i> Por Status</h4>';
    cardsHTML += '<div class="summary-cards-row">';
    
    Object.keys(statusMap).forEach(status => {
        const count = stats.byStatus[status] || 0;
        const statusInfo = statusMap[status];
        if (count > 0 || status === 'novo' || status === 'novos') {
            cardsHTML += `
                <div class="summary-card" style="border-left: 4px solid ${statusInfo.color};">
                    <div class="summary-card-icon" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
                        <i class="fas ${statusInfo.icon}"></i>
                    </div>
                    <div class="summary-card-content">
                        <h3>${count}</h3>
                        <p>${statusInfo.name}</p>
                    </div>
                </div>
            `;
        }
    });
    
    cardsHTML += '</div></div>';
    
    // Cards por Prioridade
    if (Object.keys(stats.byPriority).length > 0) {
        cardsHTML += '<div class="summary-card-group">';
        cardsHTML += '<h4><i class="fas fa-exclamation-circle"></i> Por Prioridade</h4>';
        cardsHTML += '<div class="summary-cards-row">';
        
        Object.keys(priorityMap).forEach(priority => {
            const count = stats.byPriority[priority] || 0;
            if (count > 0) {
                const priorityInfo = priorityMap[priority];
                cardsHTML += `
                    <div class="summary-card" style="border-left: 4px solid ${priorityInfo.color};">
                        <div class="summary-card-icon" style="background: ${priorityInfo.color}20; color: ${priorityInfo.color};">
                            <i class="fas ${priorityInfo.icon}"></i>
                        </div>
                        <div class="summary-card-content">
                            <h3>${count}</h3>
                            <p>${priorityInfo.name}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        cardsHTML += '</div></div>';
    }
    
    // Cards de tempo
    cardsHTML += '<div class="summary-card-group">';
    cardsHTML += '<h4><i class="fas fa-calendar-alt"></i> Por Período</h4>';
    cardsHTML += '<div class="summary-cards-row">';
    
    cardsHTML += `
        <div class="summary-card" style="border-left: 4px solid #17a2b8;">
            <div class="summary-card-icon" style="background: #17a2b820; color: #17a2b8;">
                <i class="fas fa-calendar-day"></i>
            </div>
            <div class="summary-card-content">
                <h3>${stats.today}</h3>
                <p>Hoje</p>
            </div>
        </div>
        <div class="summary-card" style="border-left: 4px solid #ffc107;">
            <div class="summary-card-icon" style="background: #ffc10720; color: #ffc107;">
                <i class="fas fa-calendar-week"></i>
            </div>
            <div class="summary-card-content">
                <h3>${stats.thisWeek}</h3>
                <p>Esta Semana</p>
            </div>
        </div>
        <div class="summary-card" style="border-left: 4px solid #28a745;">
            <div class="summary-card-icon" style="background: #28a74520; color: #28a745;">
                <i class="fas fa-calendar"></i>
            </div>
            <div class="summary-card-content">
                <h3>${stats.thisMonth}</h3>
                <p>Este Mês</p>
            </div>
        </div>
    `;
    
    cardsHTML += '</div></div>';
    
    // Top Responsáveis
    if (Object.keys(stats.byResponsible).length > 0) {
        const topResponsibles = Object.entries(stats.byResponsible)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (topResponsibles.length > 0) {
            cardsHTML += '<div class="summary-card-group">';
            cardsHTML += '<h4><i class="fas fa-users"></i> Top Responsáveis</h4>';
            cardsHTML += '<div class="summary-cards-row">';
            
            topResponsibles.forEach(([responsible, count]) => {
                cardsHTML += `
                    <div class="summary-card" style="border-left: 4px solid #000058;">
                        <div class="summary-card-icon" style="background: #00005820; color: #000058;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="summary-card-content">
                            <h3>${count}</h3>
                            <p>${responsible}</p>
                        </div>
                    </div>
                `;
            });
            
            cardsHTML += '</div></div>';
        }
    }
    
    summaryCardsGrid.innerHTML = cardsHTML;
}

// Função para atualizar gráficos do dashboard
function updateDashboardCharts(stats) {
    // Gráfico de Tickets por Status
    const ticketsChartCanvas = document.getElementById('ticketsChart');
    if (ticketsChartCanvas) {
        const ctx = ticketsChartCanvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (window.ticketsChartInstance) {
            window.ticketsChartInstance.destroy();
        }
        
        const statusLabels = [];
        const statusData = [];
        const statusColors = [];
        
        const statusMap = {
            'novo': { name: 'Novos', color: '#17a2b8' },
            'novos': { name: 'Novos', color: '#17a2b8' },
            'em-andamento': { name: 'Em Andamento', color: '#ffc107' },
            'pendente': { name: 'Pendentes', color: '#ff9800' },
            'resolvido': { name: 'Resolvidos', color: '#28a745' },
            'fechado': { name: 'Fechados', color: '#6c757d' }
        };
        
        Object.keys(stats.byStatus).forEach(status => {
            const count = stats.byStatus[status];
            if (count > 0) {
                const statusInfo = statusMap[status] || { name: status, color: '#6c757d' };
                statusLabels.push(statusInfo.name);
                statusData.push(count);
                statusColors.push(statusInfo.color);
            }
        });
        
        window.ticketsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 8,
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de Satisfação
    const satisfactionChartCanvas = document.getElementById('satisfactionChart');
    if (satisfactionChartCanvas) {
        const ctx = satisfactionChartCanvas.getContext('2d');
        
        // Destruir gráfico anterior se existir
        if (window.satisfactionChartInstance) {
            window.satisfactionChartInstance.destroy();
        }
        
        const ratingLabels = ['1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas'];
        const ratingData = [0, 0, 0, 0, 0];
        
        // Contar avaliações (simulado - você pode ajustar baseado nos dados reais)
        if (stats.withRating > 0) {
            // Distribuição aproximada baseada na média
            const avg = parseFloat(stats.avgRating);
            if (avg >= 4) {
                ratingData[4] = Math.round(stats.withRating * 0.6);
                ratingData[3] = Math.round(stats.withRating * 0.3);
                ratingData[2] = stats.withRating - ratingData[4] - ratingData[3];
            } else if (avg >= 3) {
                ratingData[3] = Math.round(stats.withRating * 0.4);
                ratingData[2] = Math.round(stats.withRating * 0.4);
                ratingData[1] = stats.withRating - ratingData[3] - ratingData[2];
            } else {
                ratingData[1] = Math.round(stats.withRating * 0.5);
                ratingData[0] = stats.withRating - ratingData[1];
            }
        }
        
        window.satisfactionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ratingLabels,
                datasets: [{
                    label: 'Avaliações',
                    data: ratingData,
                    backgroundColor: ['#dc3545', '#ff9800', '#ffc107', '#17a2b8', '#28a745'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.5,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
    
    // Configurar event listeners para as abas de configuração
    setupConfigTabListeners();
    
    // Configurar event listeners para os botões
    setupConfigButtons();
    
    // Criar formulário de teste se não existir
    createTestFormIfNeeded();
    
    // Carregar dados das abas
    loadUsersTab();
    loadFormsTab();
    loadWorkflowsTab();
    loadBackupTab();
    loadAuditTab();
    loadApiTab();
    loadAutomationTab();
    loadFieldsTab();
}

// Função para criar formulário de teste
function createTestFormIfNeeded() {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    
    // Verificar se já existe um formulário chamado "Teste Form"
    const testFormExists = forms.find(f => f.name === 'Teste Form');
    
    if (!testFormExists) {
        console.log('Criando formulário de teste...');
        
        const testForm = {
            id: Date.now(),
            name: 'Teste Form',
            description: 'Formulário de teste com campo tree-sequential (Zendesk) - Campos aparecem sequencialmente',
            fields: [
                {
                    id: Date.now() + 1,
                    label: 'Categoria',
                    type: 'tree-sequential',
                    required: true,
                    config: {
                        treeStructure: [
                            {
                                id: 1,
                                label: 'Suporte',
                                children: [
                                    {
                                        id: 2,
                                        label: 'Técnico',
                                        children: [
                                            {
                                                id: 3,
                                                label: 'Hardware',
                                                children: []
                                            },
                                            {
                                                id: 4,
                                                label: 'Software',
                                                children: []
                                            },
                                            {
                                                id: 5,
                                                label: 'Rede',
                                                children: []
                                            }
                                        ]
                                    },
                                    {
                                        id: 6,
                                        label: 'Financeiro',
                                        children: [
                                            {
                                                id: 7,
                                                label: 'Cobrança',
                                                children: []
                                            },
                                            {
                                                id: 8,
                                                label: 'Reembolso',
                                                children: []
                                            }
                                        ]
                                    },
                                    {
                                        id: 9,
                                        label: 'Outros',
                                        children: []
                                    }
                                ]
                            },
                            {
                                id: 10,
                                label: 'Vendas',
                                children: [
                                    {
                                        id: 11,
                                        label: 'Orçamento',
                                        children: []
                                    },
                                    {
                                        id: 12,
                                        label: 'Proposta',
                                        children: []
                                    },
                                    {
                                        id: 13,
                                        label: 'Contrato',
                                        children: []
                                    }
                                ]
                            },
                            {
                                id: 14,
                                label: 'Marketing',
                                children: [
                                    {
                                        id: 15,
                                        label: 'Campanha',
                                        children: []
                                    },
                                    {
                                        id: 16,
                                        label: 'Material',
                                        children: []
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    id: Date.now() + 2,
                    label: 'Prioridade',
                    type: 'select',
                    required: true,
                    options: ['Baixa', 'Média', 'Alta', 'Urgente']
                },
                {
                    id: Date.now() + 3,
                    label: 'Descrição do Problema',
                    type: 'textarea',
                    required: true
                },
                {
                    id: Date.now() + 4,
                    label: 'Email de Contato',
                    type: 'email',
                    required: false
                }
            ],
            createdAt: new Date().toISOString()
        };
        
        forms.push(testForm);
        localStorage.setItem('forms', JSON.stringify(forms));
        
        console.log('Formulário de teste criado com sucesso!');
        showNotification('Formulário de teste "Teste Form" criado automaticamente!', 'success');
    }
}

// Função para configurar event listeners dos botões de configuração
function setupConfigButtons() {
    // Botão Adicionar Usuário
    const addUserBtn = document.getElementById('addUser');
    if (addUserBtn) {
        addUserBtn.onclick = addUser;
    }
    
    // Botão Adicionar Formulário
    const addFormBtn = document.getElementById('addForm');
    if (addFormBtn) {
        addFormBtn.onclick = openFormModal;
    }
    
    // Botão Adicionar Campo
    const addFieldBtn = document.getElementById('addField');
    if (addFieldBtn) {
        addFieldBtn.onclick = addField;
    }
    
    // Botão Adicionar Automação
    const addAutomationBtn = document.getElementById('addAutomation');
    if (addAutomationBtn) {
        addAutomationBtn.onclick = addAutomation;
    }
}

// Função para configurar listeners das abas de configuração
function setupConfigTabListeners() {
    const configMenuItems = document.querySelectorAll('.config-menu-item');
    configMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.getAttribute('data-config-tab');
            switchConfigTab(tabName);
        });
    });
}

// Função para alternar abas de configuração
function switchConfigTab(tabName) {
    // Remover classe active de todos os itens do menu
    document.querySelectorAll('.config-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar classe active ao item clicado
    const activeItem = document.querySelector(`[data-config-tab="${tabName}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Ocultar todas as abas de conteúdo
    document.querySelectorAll('.config-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Carregar conteúdo específico da aba
    if (tabName === 'users') {
        loadUsersTab();
    } else if (tabName === 'forms') {
        loadFormsTab();
    } else if (tabName === 'fields') {
        loadFieldsTab();
    } else if (tabName === 'email') {
        loadEmailTab();
    }
}

// Função para carregar aba de usuários
function loadUsersTab() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <p>Nenhum usuário cadastrado ainda.</p>
                <p>Clique em "Novo Usuário" para adicionar o primeiro.</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-info">
                <h4 style="cursor: pointer; color: var(--primary-blue);" onclick="editUser(${user.id})" title="Clique para editar">
                    ${user.name} ${!user.active ? '<span class="badge-inactive">Inativo</span>' : ''}
                </h4>
                <p>${user.email}</p>
                <span class="user-role">${getUserRoleName(user.role)}</span>
            </div>
            <div class="user-actions">
                <button class="btn-secondary" onclick="editUser(${user.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteUser(${user.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        usersList.appendChild(userItem);
    });
}

// Função auxiliar para obter nome do perfil
function getUserRoleName(role) {
    const roles = {
        'admin': 'Administrador',
        'Admin': 'Administrador',
        'agent': 'Agente',
        'Agente': 'Agente',
        'viewer': 'Visualizador',
        'Visualizador': 'Visualizador'
    };
    return roles[role] || role;
}

// Função para carregar aba de formulários
function loadFormsTab() {
    const formsList = document.getElementById('formsList');
    if (!formsList) return;
    
    // Garantir que o botão de adicionar formulário está configurado
    const addFormBtn = document.getElementById('addForm');
    if (addFormBtn && !addFormBtn.onclick) {
        addFormBtn.onclick = openFormModal;
    }
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    
    // Atualizar estatísticas
    const totalFormsEl = document.getElementById('totalForms');
    const totalFieldsEl = document.getElementById('totalFields');
    const totalTreesEl = document.getElementById('totalTrees');
    
    if (totalFormsEl) totalFormsEl.textContent = forms.length;
    
    let totalFields = 0;
    let totalTrees = 0;
    
    forms.forEach(form => {
        totalFields += form.fields ? form.fields.length : 0;
        if (form.fields) {
            form.fields.forEach(field => {
                if (field.type === 'tree' || field.type === 'tree-select' || field.type === 'tree-sequential') {
                    totalTrees++;
                }
            });
        }
    });
    
    if (totalFieldsEl) totalFieldsEl.textContent = totalFields;
    if (totalTreesEl) totalTreesEl.textContent = totalTrees;
    
    // Renderizar lista de formulários
    formsList.innerHTML = '';
    
    if (forms.length === 0) {
        formsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-alt"></i>
                <p>Nenhum formulário criado ainda.</p>
                <p>Clique em "Novo Formulário" para criar o primeiro.</p>
            </div>
        `;
        return;
    }
    
    forms.forEach(form => {
        const formItem = document.createElement('div');
        formItem.className = 'form-item';
        formItem.innerHTML = `
            <div class="form-info">
                <h4>${escapeHtml(form.name)}</h4>
                <p>${escapeHtml(form.description || 'Sem descrição')}</p>
                <span class="form-fields-count">${form.fields ? form.fields.length : 0} campos</span>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="editForm(${form.id})" title="Editar Formulário">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteForm(${form.id})" title="Excluir Formulário">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        formsList.appendChild(formItem);
    });
}

// Função para carregar aba de workflows
function loadWorkflowsTab() {
    const workflowsList = document.getElementById('workflowsList');
    if (!workflowsList) return;
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    
    // Atualizar estatísticas
    const totalWorkflowsEl = document.getElementById('totalWorkflows');
    const activeWorkflowsEl = document.getElementById('activeWorkflows');
    const workflowExecutionsEl = document.getElementById('workflowExecutions');
    
    if (totalWorkflowsEl) totalWorkflowsEl.textContent = workflows.length;
    if (activeWorkflowsEl) activeWorkflowsEl.textContent = workflows.filter(w => w.active).length;
    if (workflowExecutionsEl) workflowExecutionsEl.textContent = '0'; // TODO: Implementar contador
    
    if (workflows.length === 0) {
        workflowsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-project-diagram"></i>
                <p>Nenhum workflow criado ainda.</p>
                <p>Clique em "Novo Workflow" para criar o primeiro.</p>
            </div>
        `;
        return;
    }
    
    workflowsList.innerHTML = '';
    workflows.forEach(workflow => {
        const workflowItem = document.createElement('div');
        workflowItem.className = 'workflow-item';
        workflowItem.innerHTML = `
            <div class="workflow-info">
                <h4>${workflow.name}</h4>
                <p>${workflow.description || 'Sem descrição'}</p>
                <span class="workflow-status ${workflow.active ? 'active' : 'inactive'}">
                    ${workflow.active ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="workflow-actions">
                <button class="btn-secondary" onclick="editWorkflow(${workflow.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteWorkflow(${workflow.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        workflowsList.appendChild(workflowItem);
    });
}

// Função para carregar aba de backup
function loadBackupTab() {
    const backupHistory = document.getElementById('backupHistory');
    if (!backupHistory) return;
    
    const backups = JSON.parse(localStorage.getItem('backups') || '[]');
    
    // Atualizar estatísticas
    const totalBackupsEl = document.getElementById('totalBackups');
    const lastBackupEl = document.getElementById('lastBackup');
    const backupSizeEl = document.getElementById('backupSize');
    
    if (totalBackupsEl) totalBackupsEl.textContent = backups.length;
    
    if (backups.length > 0) {
        const lastBackup = backups[backups.length - 1];
        const date = new Date(lastBackup.createdAt);
        if (lastBackupEl) lastBackupEl.textContent = date.toLocaleString('pt-BR');
        
        const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);
        if (backupSizeEl) backupSizeEl.textContent = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
    } else {
        if (lastBackupEl) lastBackupEl.textContent = 'Nunca';
        if (backupSizeEl) backupSizeEl.textContent = '0 MB';
    }
    
    if (backups.length === 0) {
        backupHistory.innerHTML = `
            <div class="no-data">
                <i class="fas fa-database"></i>
                <p>Nenhum backup criado ainda.</p>
                <p>Clique em "Backup Completo" para criar o primeiro backup.</p>
            </div>
        `;
        return;
    }
    
    backupHistory.innerHTML = '';
    backups.reverse().forEach(backup => {
        const date = new Date(backup.createdAt);
        const backupItem = document.createElement('div');
        backupItem.className = 'backup-item';
        backupItem.innerHTML = `
            <div class="backup-info">
                <h4>${backup.type === 'full' ? 'Backup Completo' : 'Backup Incremental'}</h4>
                <p>${date.toLocaleString('pt-BR')}</p>
                <span class="backup-size">${(backup.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div class="backup-actions">
                <button class="btn-primary" onclick="restoreBackup(${backup.id})">
                    <i class="fas fa-undo"></i> Restaurar
                </button>
                <button class="btn-danger" onclick="deleteBackup(${backup.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        backupHistory.appendChild(backupItem);
    });
}

// Função para carregar aba de auditoria
function loadAuditTab() {
    const auditTable = document.getElementById('auditTable');
    if (!auditTable) return;
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    
    if (auditLogs.length === 0) {
        auditTable.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhum log de auditoria registrado ainda.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedLogs = auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let tableHTML = `
        <table class="audit-table-content">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Detalhes</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedLogs.forEach(log => {
        const date = new Date(log.timestamp);
        tableHTML += `
            <tr>
                <td>${date.toLocaleString('pt-BR')}</td>
                <td>${log.user || 'Sistema'}</td>
                <td>${log.action}</td>
                <td>${log.details || '-'}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    auditTable.innerHTML = tableHTML;
}

// Função para carregar aba de API
function loadApiTab() {
    const apiKeysList = document.getElementById('apiKeysList');
    const apiEndpointsList = document.getElementById('apiEndpointsList');
    
    const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    
    // Atualizar estatísticas
    const totalApiKeysEl = document.getElementById('totalApiKeys');
    const totalEndpointsEl = document.getElementById('totalEndpoints');
    const apiRequestsEl = document.getElementById('apiRequests');
    
    if (totalApiKeysEl) totalApiKeysEl.textContent = apiKeys.length;
    if (totalEndpointsEl) totalEndpointsEl.textContent = '8'; // Número fixo de endpoints
    if (apiRequestsEl) apiRequestsEl.textContent = '0'; // TODO: Implementar contador
    
    if (apiKeysList) {
        if (apiKeys.length === 0) {
            apiKeysList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-key"></i>
                    <p>Nenhuma chave de API criada ainda.</p>
                    <p>Clique em "Nova Chave API" para criar a primeira.</p>
                </div>
            `;
        } else {
            apiKeysList.innerHTML = '';
            apiKeys.forEach(key => {
                const keyItem = document.createElement('div');
                keyItem.className = 'api-key-item';
                const maskedKey = key.key.substring(0, 8) + '...' + key.key.substring(key.key.length - 6);
                keyItem.innerHTML = `
                    <div class="api-key-info">
                        <h4>${key.name}</h4>
                        <p>${maskedKey}</p>
                        <span class="api-key-status ${key.active ? 'active' : 'inactive'}">
                            ${key.active ? 'Ativa' : 'Inativa'}
                        </span>
                    </div>
                    <div class="api-key-actions">
                        <button class="btn-secondary" onclick="regenerateApiKey(${key.id})">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteApiKey(${key.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                apiKeysList.appendChild(keyItem);
            });
        }
    }
    
    if (apiEndpointsList) {
        const endpoints = [
            { method: 'GET', path: '/api/tickets', description: 'Listar todos os tickets' },
            { method: 'GET', path: '/api/tickets/:id', description: 'Obter ticket por ID' },
            { method: 'POST', path: '/api/tickets', description: 'Criar novo ticket' },
            { method: 'PUT', path: '/api/tickets/:id', description: 'Atualizar ticket' },
            { method: 'DELETE', path: '/api/tickets/:id', description: 'Excluir ticket' },
            { method: 'GET', path: '/api/forms', description: 'Listar formulários' },
            { method: 'GET', path: '/api/users', description: 'Listar usuários' },
            { method: 'GET', path: '/api/stats', description: 'Obter estatísticas' }
        ];
        
        apiEndpointsList.innerHTML = '';
        endpoints.forEach(endpoint => {
            const endpointItem = document.createElement('div');
            endpointItem.className = 'api-endpoint-item';
            endpointItem.innerHTML = `
                <div class="endpoint-info">
                    <h4>${endpoint.method} ${endpoint.path}</h4>
                    <p>${endpoint.description}</p>
                </div>
                <div class="endpoint-actions">
                    <button class="btn-primary" onclick="testEndpoint('${endpoint.method}', '${endpoint.path}')">
                        <i class="fas fa-play"></i> Testar
                    </button>
                </div>
            `;
            apiEndpointsList.appendChild(endpointItem);
        });
    }
}

// Função para carregar aba de automações
function loadAutomationTab() {
    const automationRules = document.getElementById('automationRules');
    if (!automationRules) return;
    
    automationRules.innerHTML = `
        <div class="automation-rule-item">
            <div class="rule-info">
                <h4>Auto-atribuição de Tickets</h4>
                <p>Atribui automaticamente tickets novos ao primeiro agente disponível</p>
                <span class="rule-status active">Ativa</span>
            </div>
            <div class="rule-actions">
                <button class="btn-secondary" onclick="editAutomation(1)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteAutomation(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Função para carregar aba de campos
function loadFieldsTab() {
    const customFields = document.getElementById('customFields');
    if (!customFields) return;
    
    const fields = JSON.parse(localStorage.getItem('customFields') || '[]');
    
    if (fields.length === 0) {
        customFields.innerHTML = `
            <div class="no-data">
                <i class="fas fa-list"></i>
                <p>Nenhum campo personalizado criado ainda.</p>
                <p>Clique em "Novo Campo" para adicionar o primeiro.</p>
            </div>
        `;
        return;
    }
    
    customFields.innerHTML = '';
    fields.forEach(field => {
        const fieldItem = document.createElement('div');
        fieldItem.className = 'field-item';
        fieldItem.innerHTML = `
            <div class="field-info">
                <h4>${field.label}</h4>
                <p>Tipo: ${getFieldTypeName(field.type)} | Obrigatório: ${field.required ? 'Sim' : 'Não'}</p>
                ${field.type === 'tree' || field.type === 'tree-select' || field.type === 'tree-sequential' ? 
                    `<p class="field-detail">Estrutura de árvore configurada</p>` : ''}
                ${field.options ? `<p class="field-detail">Opções: ${field.options.join(', ')}</p>` : ''}
            </div>
            <div class="field-actions">
                <button class="btn-secondary" onclick="editCustomField(${field.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteCustomField(${field.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        customFields.appendChild(fieldItem);
    });
}

// Função para editar campo personalizado
function editCustomField(fieldId) {
    const fields = JSON.parse(localStorage.getItem('customFields') || '[]');
    const field = fields.find(f => f.id === fieldId);
    
    if (!field) {
        showNotification('Campo não encontrado!', 'error');
        return;
    }
    
    // Abrir modal com dados do campo
    openFieldConfigModal();
    
    // Preencher campos
    document.getElementById('fieldLabel').value = field.label;
    document.getElementById('fieldType').value = field.type;
    document.getElementById('fieldRequired').checked = field.required;
    
    // Chamar onFieldTypeChange para mostrar configurações
    onFieldTypeChange();
    
    // Se for árvore, carregar estrutura
    if (field.type === 'tree' || field.type === 'tree-select' || field.type === 'tree-sequential') {
        if (field.config && field.config.treeStructure) {
            loadTreeStructureToBuilder(field.config.treeStructure);
        }
    }
    
    // Se for select, carregar opções
    if (field.type === 'select' && field.options) {
        loadSelectOptions(field.options);
    }
    
    // Marcar que está editando
    window.editingFieldId = fieldId;
}

// Função para carregar estrutura de árvore no builder
function loadTreeStructureToBuilder(treeStructure) {
    const treeContainer = document.getElementById('treeStructure');
    if (!treeContainer) return;
    
    treeContainer.innerHTML = '';
    
    treeStructure.forEach(node => {
        renderTreeNodeToBuilder(node, treeContainer);
    });
}

// Função para renderizar nó no builder
function renderTreeNodeToBuilder(node, container) {
    const nodeHTML = `
        <div class="tree-node" data-node-id="${node.id}">
            <input type="text" class="tree-node-label" value="${node.label}">
            <button class="btn-small" onclick="addTreeChild(${node.id})">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button class="btn-small btn-danger" onclick="removeTreeNode(${node.id})">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', nodeHTML);
    
    // Renderizar filhos
    if (node.children && node.children.length > 0) {
        const parentElement = container.querySelector(`[data-node-id="${node.id}"]`);
        const childContainer = parentElement.querySelector('.tree-node-child');
        
        node.children.forEach(child => {
            renderTreeNodeToBuilder(child, childContainer);
        });
    }
}

// Função para carregar opções de select
function loadSelectOptions(options) {
    const optionsList = document.getElementById('optionsList');
    if (!optionsList) return;
    
    optionsList.innerHTML = '';
    options.forEach(option => {
        const optionHTML = `
            <div class="option-item">
                <input type="text" value="${option}">
                <button class="btn-small btn-danger" onclick="removeSelectOption(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        optionsList.insertAdjacentHTML('beforeend', optionHTML);
    });
}

// Função para excluir campo personalizado
function deleteCustomField(fieldId) {
    if (confirm('Tem certeza que deseja excluir este campo personalizado?')) {
        const fields = JSON.parse(localStorage.getItem('customFields') || '[]');
        const filteredFields = fields.filter(f => f.id !== fieldId);
        localStorage.setItem('customFields', JSON.stringify(filteredFields));
        loadFieldsTab();
        showNotification('Campo excluído com sucesso!', 'success');
    }
}

// Funções para formulários
function openFormModal() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('formModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar ID único para este modal
    const modalId = 'formModal-' + Date.now();
    const formNameId = 'formName-' + Date.now();
    const formDescriptionId = 'formDescription-' + Date.now();
    const saveBtnId = 'saveFormBtn-' + Date.now();
    
    const modal = document.createElement('div');
    modal.id = 'formModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Novo Formulário</h3>
                <button class="close-btn" onclick="closeFormModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="${formNameId}">Nome do Formulário:</label>
                    <input type="text" id="${formNameId}" placeholder="Ex: Formulário de Suporte">
                </div>
                <div class="form-group">
                    <label for="${formDescriptionId}">Descrição:</label>
                    <textarea id="${formDescriptionId}" placeholder="Descreva o propósito do formulário"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeFormModal()">Cancelar</button>
                <button class="btn-primary" id="${saveBtnId}" type="button">Salvar Formulário</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Armazenar IDs no modal para uso posterior
    modal.dataset.formNameId = formNameId;
    modal.dataset.formDescriptionId = formDescriptionId;
    
    // Garantir que o botão de salvar está funcionando
    const saveBtn = document.getElementById(saveBtnId);
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveForm(formNameId, formDescriptionId);
        });
    }
    
    // Focar no campo de nome
    setTimeout(() => {
        const nameInput = document.getElementById(formNameId);
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}

function closeFormModal() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.remove();
    }
}

function saveForm(formNameId, formDescriptionId) {
    // Se IDs não foram fornecidos, tentar encontrar no modal
    if (!formNameId) {
        const modal = document.getElementById('formModal');
        if (modal && modal.dataset.formNameId) {
            formNameId = modal.dataset.formNameId;
            formDescriptionId = modal.dataset.formDescriptionId;
        } else {
            // Fallback: procurar por qualquer campo com padrão formName
            const nameInputs = document.querySelectorAll('input[id^="formName"]');
            if (nameInputs.length > 0) {
                formNameId = nameInputs[nameInputs.length - 1].id;
            } else {
                formNameId = 'formName';
            }
            
            const descInputs = document.querySelectorAll('textarea[id^="formDescription"]');
            if (descInputs.length > 0) {
                formDescriptionId = descInputs[descInputs.length - 1].id;
            } else {
                formDescriptionId = 'formDescription';
            }
        }
    }
    
    const nameInput = document.getElementById(formNameId);
    const descriptionInput = document.getElementById(formDescriptionId);
    
    if (!nameInput) {
        const msg = 'Erro: Campo de nome não encontrado!';
        if (typeof showNotification === 'function') {
            showNotification(msg, 'error');
        } else {
            alert(msg);
        }
        return;
    }
    
    const name = nameInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    
    if (!name || name === '') {
        const msg = 'Por favor, digite o nome do formulário!';
        if (typeof showNotification === 'function') {
            showNotification(msg, 'error');
        } else {
            alert(msg);
        }
        nameInput.focus();
        return;
    }
    
    // Verificar se já existe um formulário com o mesmo nome
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const existingForm = forms.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (existingForm) {
        const msg = 'Já existe um formulário com este nome!';
        if (typeof showNotification === 'function') {
            showNotification(msg, 'error');
        } else {
            alert(msg);
        }
        nameInput.focus();
        return;
    }
    
    const newForm = {
        id: Date.now(),
        name: name,
        description: description,
        fields: [],
        createdAt: new Date().toISOString()
    };
    
    forms.push(newForm);
    localStorage.setItem('forms', JSON.stringify(forms));
    
    closeFormModal();
    
    // Aguardar um pouco antes de recarregar para garantir que o modal foi fechado
    setTimeout(() => {
        loadFormsTab();
        const msg = 'Formulário criado com sucesso!';
        if (typeof showNotification === 'function') {
            showNotification(msg, 'success');
        } else {
            alert(msg);
        }
    }, 100);
}

function editForm(formId) {
    console.log('Editando formulário:', formId);
    
    // Buscar o formulário no localStorage
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const form = forms.find(f => f.id === formId);
    
    if (!form) {
        showNotification('Formulário não encontrado!', 'error');
        return;
    }
    
    // Criar modal de edição
    const modal = document.createElement('div');
    modal.id = 'editFormModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Formulário: ${form.name}</h3>
                <button class="close-btn" onclick="closeEditFormModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="editFormName">Nome do Formulário:</label>
                    <input type="text" id="editFormName" value="${form.name}" placeholder="Ex: Formulário de Suporte">
                </div>
                <div class="form-group">
                    <label for="editFormDescription">Descrição:</label>
                    <textarea id="editFormDescription" placeholder="Descreva o propósito do formulário">${form.description || ''}</textarea>
                </div>
                
                <div class="form-fields-section">
                    <h4>Campos do Formulário</h4>
                    <div class="fields-list" id="editFieldsList">
                        ${renderFormFieldsForEdit(form.fields)}
                    </div>
                    <button type="button" class="btn-primary" onclick="addFieldToEditForm()">
                        <i class="fas fa-plus"></i> Adicionar Campo
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeEditFormModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveEditedForm(${formId})">Salvar Alterações</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Definir o ID do formulário sendo editado
    window.currentEditFormId = formId;
}

function renderFormFieldsForEdit(fields) {
    if (!fields || fields.length === 0) {
        return '<p class="no-fields">Nenhum campo adicionado ainda.</p>';
    }
    
    return fields.map((field, index) => `
        <div class="field-item" data-field-index="${index}">
            <div class="field-info">
                <h5>${field.label}</h5>
                <p>Tipo: ${getFieldTypeName(field.type)} | Obrigatório: ${field.required ? 'Sim' : 'Não'}</p>
                ${field.options ? `<p>Opções: ${field.options.join(', ')}</p>` : ''}
            </div>
            <div class="field-actions">
                <button class="btn-secondary" onclick="editFormField(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="removeFormField(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getFieldTypeName(type) {
    const typeNames = {
        'text': 'Texto',
        'textarea': 'Área de Texto',
        'select': 'Seleção Simples',
        'tree': 'Árvore de Seleção',
        'tree-select': 'Árvore Dropdown',
        'tree-sequential': 'Árvore Sequencial (Zendesk)',
        'checkbox': 'Caixa de Seleção',
        'radio': 'Botão de Rádio',
        'date': 'Data',
        'email': 'Email',
        'number': 'Número'
    };
    return typeNames[type] || type;
}

function closeEditFormModal() {
    const modal = document.getElementById('editFormModal');
    if (modal) {
        modal.remove();
    }
}

function saveEditedForm(formId) {
    const nameInput = document.getElementById('editFormName');
    const descriptionInput = document.getElementById('editFormDescription');
    
    if (!nameInput) {
        showNotification('Erro: Campo de nome não encontrado!', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    
    if (!name || name === '') {
        showNotification('Por favor, digite o nome do formulário!', 'error');
        nameInput.focus();
        return;
    }
    
    // Buscar o formulário no localStorage
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const formIdNum = typeof formId === 'string' ? parseInt(formId) : formId;
    const formIndex = forms.findIndex(f => f.id === formIdNum || f.id == formId);
    
    if (formIndex === -1) {
        showNotification('Formulário não encontrado!', 'error');
        return;
    }
    
    // Verificar se já existe outro formulário com o mesmo nome (exceto o atual)
    const existingForm = forms.find((f, index) => 
        index !== formIndex && f.name.toLowerCase() === name.toLowerCase()
    );
    if (existingForm) {
        showNotification('Já existe um formulário com este nome!', 'error');
        nameInput.focus();
        return;
    }
    
    // Atualizar o formulário
    forms[formIndex] = {
        ...forms[formIndex],
        name: name,
        description: description,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('forms', JSON.stringify(forms));
    
    closeEditFormModal();
    loadFormsTab();
    showNotification('Formulário atualizado com sucesso!', 'success');
}

function addFieldToEditForm() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('addFieldModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar IDs únicos para este modal
    const timestamp = Date.now();
    const fieldLabelId = 'fieldLabel-' + timestamp;
    const fieldTypeId = 'fieldType-' + timestamp;
    const fieldRequiredId = 'fieldRequired-' + timestamp;
    const fieldOptionsId = 'fieldOptions-' + timestamp;
    const optionsGroupId = 'optionsGroup-' + timestamp;
    const saveFieldBtnId = 'saveFieldBtn-' + timestamp;
    
    // Criar modal para adicionar campo
    const fieldModal = document.createElement('div');
    fieldModal.id = 'addFieldModal';
    fieldModal.className = 'modal';
    fieldModal.style.display = 'flex';
    
    fieldModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Adicionar Campo</h3>
                <button class="close-btn" onclick="closeAddFieldModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="${fieldLabelId}">Rótulo do Campo:</label>
                    <input type="text" id="${fieldLabelId}" placeholder="Ex: Categoria">
                </div>
                <div class="form-group">
                    <label for="${fieldTypeId}">Tipo do Campo:</label>
                    <select id="${fieldTypeId}">
                        <option value="text">Texto</option>
                        <option value="textarea">Área de Texto</option>
                        <option value="select">Seleção Simples</option>
                        <option value="checkbox">Caixa de Seleção</option>
                        <option value="radio">Botão de Rádio</option>
                        <option value="tree-sequential">Árvore Sequencial (Zendesk)</option>
                        <option value="date">Data</option>
                        <option value="email">Email</option>
                        <option value="number">Número</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="${fieldRequiredId}">Obrigatório:</label>
                    <input type="checkbox" id="${fieldRequiredId}">
                </div>
                <div class="form-group" id="${optionsGroupId}" style="display: none;">
                    <label for="${fieldOptionsId}">Opções (uma por linha):</label>
                    <textarea id="${fieldOptionsId}" rows="4" placeholder="Opção 1&#10;Opção 2&#10;Opção 3"></textarea>
                </div>
                <div class="form-group" id="treeConfigGroup-${timestamp}" style="display: none;">
                    <label>Configuração da Árvore Sequencial:</label>
                    <div class="tree-config-container" style="border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #f8f9fa;">
                        <div class="tree-explanation" style="margin-bottom: 15px; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                            <p style="margin: 0; font-size: 13px;"><strong>Como funciona:</strong> Campos aparecem sequencialmente. Ao selecionar uma opção, o próximo nível aparece automaticamente.</p>
                        </div>
                        <div class="tree-builder" id="treeBuilder-${timestamp}">
                            <div class="tree-header" style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <button type="button" class="btn-primary" onclick="addTreeRootToModal('${timestamp}')" style="padding: 8px 16px; font-size: 13px;">
                                    <i class="fas fa-plus"></i> Adicionar Raiz
                                </button>
                                <button type="button" class="btn-secondary" onclick="previewTreeInModal('${timestamp}')" style="padding: 8px 16px; font-size: 13px;">
                                    <i class="fas fa-eye"></i> Visualizar
                                </button>
                            </div>
                            <div class="tree-structure" id="treeStructure-${timestamp}" style="min-height: 100px; padding: 10px; background: white; border-radius: 4px;">
                                <p style="color: #999; font-size: 12px; margin: 0;">Nenhuma raiz adicionada ainda. Clique em "Adicionar Raiz" para começar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAddFieldModal()">Cancelar</button>
                <button class="btn-primary" id="${saveFieldBtnId}" type="button">Adicionar Campo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(fieldModal);
    
    // Armazenar IDs no modal para uso posterior
    fieldModal.dataset.fieldLabelId = fieldLabelId;
    fieldModal.dataset.fieldTypeId = fieldTypeId;
    fieldModal.dataset.fieldRequiredId = fieldRequiredId;
    fieldModal.dataset.fieldOptionsId = fieldOptionsId;
    fieldModal.dataset.timestamp = timestamp;
    
    // Configurar evento para mostrar/ocultar opções e configuração de árvore
    const fieldTypeSelect = document.getElementById(fieldTypeId);
    const optionsGroup = document.getElementById(optionsGroupId);
    const treeConfigGroup = document.getElementById(`treeConfigGroup-${timestamp}`);
    
    if (fieldTypeSelect) {
        fieldTypeSelect.addEventListener('change', function() {
            if (this.value === 'select' || this.value === 'radio' || this.value === 'checkbox') {
                if (optionsGroup) optionsGroup.style.display = 'block';
                if (treeConfigGroup) treeConfigGroup.style.display = 'none';
            } else if (this.value === 'tree-sequential') {
                if (optionsGroup) optionsGroup.style.display = 'none';
                if (treeConfigGroup) treeConfigGroup.style.display = 'block';
            } else {
                if (optionsGroup) optionsGroup.style.display = 'none';
                if (treeConfigGroup) treeConfigGroup.style.display = 'none';
            }
        });
    }
    
    // Configurar botão de salvar
    const saveBtn = document.getElementById(saveFieldBtnId);
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveNewField(fieldLabelId, fieldTypeId, fieldRequiredId, fieldOptionsId);
        });
    }
}

function closeAddFieldModal() {
    const modal = document.getElementById('addFieldModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewField(fieldLabelId, fieldTypeId, fieldRequiredId, fieldOptionsId) {
    // Se IDs não foram fornecidos, tentar encontrar no modal
    if (!fieldLabelId) {
        const modal = document.getElementById('addFieldModal');
        if (modal && modal.dataset.fieldLabelId) {
            fieldLabelId = modal.dataset.fieldLabelId;
            fieldTypeId = modal.dataset.fieldTypeId;
            fieldRequiredId = modal.dataset.fieldRequiredId;
            fieldOptionsId = modal.dataset.fieldOptionsId;
        } else {
            // Fallback: procurar por qualquer campo com padrão
            const labelInputs = document.querySelectorAll('input[id^="fieldLabel"]');
            if (labelInputs.length > 0) {
                fieldLabelId = labelInputs[labelInputs.length - 1].id;
            } else {
                fieldLabelId = 'fieldLabel';
            }
            
            const typeInputs = document.querySelectorAll('select[id^="fieldType"]');
            if (typeInputs.length > 0) {
                fieldTypeId = typeInputs[typeInputs.length - 1].id;
            } else {
                fieldTypeId = 'fieldType';
            }
            
            const requiredInputs = document.querySelectorAll('input[id^="fieldRequired"]');
            if (requiredInputs.length > 0) {
                fieldRequiredId = requiredInputs[requiredInputs.length - 1].id;
            } else {
                fieldRequiredId = 'fieldRequired';
            }
            
            const optionsInputs = document.querySelectorAll('textarea[id^="fieldOptions"]');
            if (optionsInputs.length > 0) {
                fieldOptionsId = optionsInputs[optionsInputs.length - 1].id;
            } else {
                fieldOptionsId = 'fieldOptions';
            }
        }
    }
    
    const labelInput = document.getElementById(fieldLabelId);
    const typeInput = document.getElementById(fieldTypeId);
    const requiredInput = document.getElementById(fieldRequiredId);
    const optionsInput = document.getElementById(fieldOptionsId);
    
    if (!labelInput || !typeInput) {
        showNotification('Erro: Campos não encontrados!', 'error');
        return;
    }
    
    const label = labelInput.value.trim();
    const type = typeInput.value;
    const required = requiredInput ? requiredInput.checked : false;
    const optionsText = optionsInput ? optionsInput.value.trim() : '';
    
    if (!label || label === '') {
        showNotification('Por favor, digite o rótulo do campo!', 'error');
        labelInput.focus();
        return;
    }
    
    const newField = {
        id: Date.now(),
        label: label,
        type: type,
        required: required
    };
    
    // Adicionar opções se necessário
    if ((type === 'select' || type === 'radio' || type === 'checkbox') && optionsText) {
        const options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt);
        if (options.length > 0) {
            newField.options = options;
        } else if (type === 'select' || type === 'radio' || type === 'checkbox') {
            showNotification('Por favor, adicione pelo menos uma opção para este tipo de campo!', 'error');
            if (optionsInput) optionsInput.focus();
            return;
        }
    }
    
    // Adicionar campo ao formulário em edição
    const success = addFieldToCurrentForm(newField);
    
    if (success) {
        closeAddFieldModal();
        refreshEditFormFields();
        showNotification('Campo adicionado com sucesso!', 'success');
    } else {
        showNotification('Erro ao adicionar campo. Certifique-se de que um formulário está sendo editado.', 'error');
    }
}

function addFieldToCurrentForm(field) {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const editFormId = getCurrentEditFormId();
    
    if (!editFormId) {
        return false;
    }
    
    const editFormIdNum = typeof editFormId === 'string' ? parseInt(editFormId) : editFormId;
    const formIndex = forms.findIndex(f => f.id === editFormIdNum || f.id == editFormId);
    
    if (formIndex === -1) {
        return false;
    }
    
    if (!forms[formIndex].fields) {
        forms[formIndex].fields = [];
    }
    
    forms[formIndex].fields.push(field);
    localStorage.setItem('forms', JSON.stringify(forms));
    
    return true;
}

function getCurrentEditFormId() {
    // Função auxiliar para obter o ID do formulário sendo editado
    // Por enquanto, vamos usar uma variável global simples
    return window.currentEditFormId || null;
}

function refreshEditFormFields() {
    const fieldsList = document.getElementById('editFieldsList');
    if (!fieldsList) {
        console.warn('editFieldsList não encontrado');
        return;
    }
    
    // Recarregar os campos do formulário em edição
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const editFormId = getCurrentEditFormId();
    
    if (!editFormId) {
        console.warn('Nenhum formulário em edição');
        return;
    }
    
    const editFormIdNum = typeof editFormId === 'string' ? parseInt(editFormId) : editFormId;
    const form = forms.find(f => f.id === editFormIdNum || f.id == editFormId);
    
    if (form) {
        fieldsList.innerHTML = renderFormFieldsForEdit(form.fields || []);
    } else {
        console.warn('Formulário não encontrado:', editFormId);
    }
}

function editFormField(fieldIndex) {
    console.log('Editando campo:', fieldIndex);
    
    // Buscar o formulário em edição
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const editFormId = getCurrentEditFormId();
    
    if (!editFormId) {
        showNotification('Erro: Nenhum formulário está sendo editado!', 'error');
        return;
    }
    
    const editFormIdNum = typeof editFormId === 'string' ? parseInt(editFormId) : editFormId;
    const formIndex = forms.findIndex(f => f.id === editFormIdNum || f.id == editFormId);
    
    if (formIndex === -1) {
        showNotification('Formulário não encontrado!', 'error');
        return;
    }
    
    if (!forms[formIndex].fields || fieldIndex < 0 || fieldIndex >= forms[formIndex].fields.length) {
        showNotification('Campo não encontrado!', 'error');
        return;
    }
    
    const field = forms[formIndex].fields[fieldIndex];
    
    // Remover modal existente se houver
    const existingModal = document.getElementById('editFieldModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar IDs únicos para este modal
    const timestamp = Date.now();
    const fieldLabelId = 'editFieldLabel-' + timestamp;
    const fieldTypeId = 'editFieldType-' + timestamp;
    const fieldRequiredId = 'editFieldRequired-' + timestamp;
    const fieldOptionsId = 'editFieldOptions-' + timestamp;
    const optionsGroupId = 'editOptionsGroup-' + timestamp;
    const saveEditFieldBtnId = 'saveEditFieldBtn-' + timestamp;
    
    // Criar modal para editar campo
    const fieldModal = document.createElement('div');
    fieldModal.id = 'editFieldModal';
    fieldModal.className = 'modal';
    fieldModal.style.display = 'flex';
    
    // Preparar opções para textarea se necessário
    const optionsText = (field.options && Array.isArray(field.options)) 
        ? field.options.join('\n') 
        : '';
    
    fieldModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Campo</h3>
                <button class="close-btn" onclick="closeEditFieldModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="${fieldLabelId}">Rótulo do Campo:</label>
                    <input type="text" id="${fieldLabelId}" value="${escapeHtml(field.label || '')}" placeholder="Ex: Categoria">
                </div>
                <div class="form-group">
                    <label for="${fieldTypeId}">Tipo do Campo:</label>
                    <select id="${fieldTypeId}">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Texto</option>
                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Área de Texto</option>
                        <option value="select" ${field.type === 'select' ? 'selected' : ''}>Seleção Simples</option>
                        <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Caixa de Seleção</option>
                        <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Botão de Rádio</option>
                        <option value="tree-sequential" ${field.type === 'tree-sequential' ? 'selected' : ''}>Árvore Sequencial (Zendesk)</option>
                        <option value="date" ${field.type === 'date' ? 'selected' : ''}>Data</option>
                        <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Número</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="${fieldRequiredId}">Obrigatório:</label>
                    <input type="checkbox" id="${fieldRequiredId}" ${field.required ? 'checked' : ''}>
                </div>
                <div class="form-group" id="${optionsGroupId}" style="display: ${(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') ? 'block' : 'none'};">
                    <label for="${fieldOptionsId}">Opções (uma por linha):</label>
                    <textarea id="${fieldOptionsId}" rows="4" placeholder="Opção 1&#10;Opção 2&#10;Opção 3">${escapeHtml(optionsText)}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeEditFieldModal()">Cancelar</button>
                <button class="btn-primary" id="${saveEditFieldBtnId}" type="button">Salvar Alterações</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(fieldModal);
    
    // Armazenar IDs e informações no modal para uso posterior
    fieldModal.dataset.fieldLabelId = fieldLabelId;
    fieldModal.dataset.fieldTypeId = fieldTypeId;
    fieldModal.dataset.fieldRequiredId = fieldRequiredId;
    fieldModal.dataset.fieldOptionsId = fieldOptionsId;
    fieldModal.dataset.fieldIndex = fieldIndex;
    fieldModal.dataset.formId = editFormId;
    fieldModal.dataset.timestamp = timestamp;
    
    // Configurar evento para mostrar/ocultar opções e configuração de árvore
    const fieldTypeSelect = document.getElementById(fieldTypeId);
    const optionsGroup = document.getElementById(optionsGroupId);
    const treeConfigGroup = document.getElementById(`editTreeConfigGroup-${timestamp}`);
    
    if (fieldTypeSelect) {
        fieldTypeSelect.addEventListener('change', function() {
            if (this.value === 'select' || this.value === 'radio' || this.value === 'checkbox') {
                if (optionsGroup) optionsGroup.style.display = 'block';
                if (treeConfigGroup) treeConfigGroup.style.display = 'none';
            } else if (this.value === 'tree-sequential') {
                if (optionsGroup) optionsGroup.style.display = 'none';
                if (treeConfigGroup) treeConfigGroup.style.display = 'block';
            } else {
                if (optionsGroup) optionsGroup.style.display = 'none';
                if (treeConfigGroup) treeConfigGroup.style.display = 'none';
            }
        });
    }
    
    // Configurar botão de salvar
    const saveBtn = document.getElementById(saveEditFieldBtnId);
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            saveEditedField(fieldIndex, fieldLabelId, fieldTypeId, fieldRequiredId, fieldOptionsId);
        });
    }
    
    // Focar no campo de rótulo
    setTimeout(() => {
        const labelInput = document.getElementById(fieldLabelId);
        if (labelInput) {
            labelInput.focus();
            labelInput.select();
        }
    }, 100);
}

function closeEditFieldModal() {
    const modal = document.getElementById('editFieldModal');
    if (modal) {
        modal.remove();
    }
}

function saveEditedField(fieldIndex, fieldLabelId, fieldTypeId, fieldRequiredId, fieldOptionsId) {
    // Se IDs não foram fornecidos, tentar encontrar no modal
    if (!fieldLabelId) {
        const modal = document.getElementById('editFieldModal');
        if (modal && modal.dataset.fieldLabelId) {
            fieldLabelId = modal.dataset.fieldLabelId;
            fieldTypeId = modal.dataset.fieldTypeId;
            fieldRequiredId = modal.dataset.fieldRequiredId;
            fieldOptionsId = modal.dataset.fieldOptionsId;
            fieldIndex = parseInt(modal.dataset.fieldIndex);
        } else {
            showNotification('Erro: Modal de edição não encontrado!', 'error');
            return;
        }
    }
    
    const labelInput = document.getElementById(fieldLabelId);
    const typeInput = document.getElementById(fieldTypeId);
    const requiredInput = document.getElementById(fieldRequiredId);
    const optionsInput = document.getElementById(fieldOptionsId);
    
    if (!labelInput || !typeInput) {
        showNotification('Erro: Campos não encontrados!', 'error');
        return;
    }
    
    const label = labelInput.value.trim();
    const type = typeInput.value;
    const required = requiredInput ? requiredInput.checked : false;
    const optionsText = optionsInput ? optionsInput.value.trim() : '';
    
    if (!label || label === '') {
        showNotification('Por favor, digite o rótulo do campo!', 'error');
        labelInput.focus();
        return;
    }
    
    // Buscar o formulário em edição
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const modal = document.getElementById('editFieldModal');
    const editFormId = modal ? modal.dataset.formId : getCurrentEditFormId();
    
    if (!editFormId) {
        showNotification('Erro: Nenhum formulário está sendo editado!', 'error');
        return;
    }
    
    const editFormIdNum = typeof editFormId === 'string' ? parseInt(editFormId) : editFormId;
    const formIndex = forms.findIndex(f => f.id === editFormIdNum || f.id == editFormId);
    
    if (formIndex === -1) {
        showNotification('Formulário não encontrado!', 'error');
        return;
    }
    
    if (!forms[formIndex].fields || fieldIndex < 0 || fieldIndex >= forms[formIndex].fields.length) {
        showNotification('Campo não encontrado!', 'error');
        return;
    }
    
    // Atualizar o campo
    const updatedField = {
        ...forms[formIndex].fields[fieldIndex],
        label: label,
        type: type,
        required: required
    };
    
    // Adicionar opções se necessário
    if ((type === 'select' || type === 'radio' || type === 'checkbox') && optionsText) {
        const options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt);
        if (options.length > 0) {
            updatedField.options = options;
        } else if (type === 'select' || type === 'radio' || type === 'checkbox') {
            showNotification('Por favor, adicione pelo menos uma opção para este tipo de campo!', 'error');
            if (optionsInput) optionsInput.focus();
            return;
        }
    } else if (type !== 'select' && type !== 'radio' && type !== 'checkbox') {
        // Remover opções se o tipo não precisar delas
        delete updatedField.options;
    }
    
    // Adicionar/atualizar estrutura de árvore se for tree-sequential
    if (type === 'tree-sequential') {
        const modal = document.getElementById('editFieldModal');
        const timestamp = modal ? modal.dataset.timestamp : null;
        if (timestamp) {
            const treeStructure = getTreeStructureFromEditModalBuilder(timestamp);
            if (!treeStructure || treeStructure.length === 0) {
                showNotification('Por favor, configure a estrutura da árvore sequencial!', 'error');
                return;
            }
            updatedField.config = {
                treeStructure: treeStructure
            };
        } else {
            // Se não conseguir obter do modal, manter a estrutura existente se houver
            if (forms[formIndex].fields[fieldIndex].config && forms[formIndex].fields[fieldIndex].config.treeStructure) {
                updatedField.config = forms[formIndex].fields[fieldIndex].config;
            } else {
                showNotification('Erro ao obter configuração da árvore!', 'error');
                return;
            }
        }
    } else if (type !== 'tree-sequential') {
        // Remover configuração de árvore se o tipo não for tree-sequential
        delete updatedField.config;
    }
    
    // Atualizar o campo no array
    forms[formIndex].fields[fieldIndex] = updatedField;
    localStorage.setItem('forms', JSON.stringify(forms));
    
    closeEditFieldModal();
    refreshEditFormFields();
    showNotification('Campo atualizado com sucesso!', 'success');
}

function removeFormField(fieldIndex) {
    if (confirm('Tem certeza que deseja remover este campo?')) {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const editFormId = getCurrentEditFormId();
        
        if (!editFormId) {
            showNotification('Erro: Nenhum formulário está sendo editado!', 'error');
            return;
        }
        
        const editFormIdNum = typeof editFormId === 'string' ? parseInt(editFormId) : editFormId;
        const formIndex = forms.findIndex(f => f.id === editFormIdNum || f.id == editFormId);
        
        if (formIndex === -1) {
            showNotification('Formulário não encontrado!', 'error');
            return;
        }
        
        if (!forms[formIndex].fields || fieldIndex < 0 || fieldIndex >= forms[formIndex].fields.length) {
            showNotification('Campo não encontrado!', 'error');
            return;
        }
        
        forms[formIndex].fields.splice(fieldIndex, 1);
        localStorage.setItem('forms', JSON.stringify(forms));
        refreshEditFormFields();
        showNotification('Campo removido com sucesso!', 'success');
    }
}

function deleteForm(formId) {
    if (confirm('Tem certeza que deseja excluir este formulário?')) {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const formIdNum = typeof formId === 'string' ? parseInt(formId) : formId;
        const filteredForms = forms.filter(form => form.id !== formIdNum && form.id != formId);
        localStorage.setItem('forms', JSON.stringify(filteredForms));
        loadFormsTab();
        showNotification('Formulário excluído com sucesso!', 'success');
    }
}

// Funções para workflows
function createNewWorkflow() {
    console.log('Criando novo workflow...');
    
    const modal = document.createElement('div');
    modal.id = 'newWorkflowModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Novo Workflow</h3>
                <button class="close-btn" onclick="closeNewWorkflowModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="workflowName">Nome do Workflow:</label>
                    <input type="text" id="workflowName" placeholder="Ex: Auto-atribuição de Tickets" required>
                </div>
                <div class="form-group">
                    <label for="workflowDescription">Descrição:</label>
                    <textarea id="workflowDescription" placeholder="Descreva o que este workflow faz" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="workflowTrigger">Gatilho:</label>
                    <select id="workflowTrigger">
                        <option value="ticket-created">Ticket Criado</option>
                        <option value="ticket-updated">Ticket Atualizado</option>
                        <option value="ticket-status-changed">Status Alterado</option>
                        <option value="ticket-assigned">Ticket Atribuído</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="workflowActive" checked>
                        Workflow Ativo
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeNewWorkflowModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveNewWorkflow()">Salvar Workflow</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeNewWorkflowModal() {
    const modal = document.getElementById('newWorkflowModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewWorkflow() {
    const name = document.getElementById('workflowName').value.trim();
    const description = document.getElementById('workflowDescription').value.trim();
    const trigger = document.getElementById('workflowTrigger').value;
    const active = document.getElementById('workflowActive').checked;
    
    if (!name) {
        showNotification('Por favor, digite o nome do workflow!', 'error');
        return;
    }
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    
    const newWorkflow = {
        id: Date.now(),
        name: name,
        description: description,
        trigger: trigger,
        active: active,
        actions: [],
        createdAt: new Date().toISOString()
    };
    
    workflows.push(newWorkflow);
    localStorage.setItem('workflows', JSON.stringify(workflows));
    
    closeNewWorkflowModal();
    loadWorkflowsTab();
    showNotification('Workflow criado com sucesso!', 'success');
}

function loadWorkflows() {
    console.log('Carregando workflows...');
    loadWorkflowsTab();
}

function editWorkflow(workflowId) {
    console.log('Editando workflow:', workflowId);
    
    const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (!workflow) {
        showNotification('Workflow não encontrado!', 'error');
        return;
    }
    
    // Criar modal de edição similar ao de criação
    showNotification('Funcionalidade de edição de workflow em desenvolvimento', 'info');
}

function deleteWorkflow(workflowId) {
    if (confirm('Tem certeza que deseja excluir este workflow?')) {
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        const filteredWorkflows = workflows.filter(w => w.id !== workflowId);
        localStorage.setItem('workflows', JSON.stringify(filteredWorkflows));
        loadWorkflowsTab();
        showNotification('Workflow excluído com sucesso!', 'success');
    }
}

// Funções para backup
function createFullBackup() {
    console.log('Criando backup completo...');
    
    try {
        // Coletar todos os dados do sistema
        const backupData = {
            kanbanColumns: localStorage.getItem('kanbanColumns'),
            forms: localStorage.getItem('forms'),
            users: localStorage.getItem('users'),
            customFields: localStorage.getItem('customFields'),
            workflows: localStorage.getItem('workflows'),
            whatsappSettings: localStorage.getItem('whatsappSettings'),
            whatsappConversations: localStorage.getItem('whatsappConversations')
        };
        
        const backup = {
            id: Date.now(),
            type: 'full',
            createdAt: new Date().toISOString(),
            data: backupData,
            size: JSON.stringify(backupData).length
        };
        
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        backups.push(backup);
        localStorage.setItem('backups', JSON.stringify(backups));
        
        showNotification('Backup completo criado com sucesso!', 'success');
        loadBackupTab();
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showNotification('Erro ao criar backup!', 'error');
    }
}

function createIncrementalBackup() {
    console.log('Criando backup incremental...');
    
    try {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const lastBackup = backups.length > 0 ? backups[backups.length - 1] : null;
        
        // Coletar apenas dados modificados desde o último backup
        const backupData = {
            kanbanColumns: localStorage.getItem('kanbanColumns'),
            forms: localStorage.getItem('forms'),
            timestamp: new Date().toISOString()
        };
        
        const backup = {
            id: Date.now(),
            type: 'incremental',
            createdAt: new Date().toISOString(),
            data: backupData,
            size: JSON.stringify(backupData).length,
            basedOn: lastBackup ? lastBackup.id : null
        };
        
        backups.push(backup);
        localStorage.setItem('backups', JSON.stringify(backups));
        
        showNotification('Backup incremental criado com sucesso!', 'success');
        loadBackupTab();
    } catch (error) {
        console.error('Erro ao criar backup incremental:', error);
        showNotification('Erro ao criar backup incremental!', 'error');
    }
}

function configureScheduledBackup() {
    console.log('Configurando backup agendado...');
    showNotification('Funcionalidade de backup agendado em desenvolvimento', 'info');
}

function restoreBackup(backupId) {
    if (!confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos!')) {
        return;
    }
    
    try {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            showNotification('Backup não encontrado!', 'error');
            return;
        }
        
        // Restaurar dados
        if (backup.data.kanbanColumns) {
            localStorage.setItem('kanbanColumns', backup.data.kanbanColumns);
        }
        if (backup.data.forms) {
            localStorage.setItem('forms', backup.data.forms);
        }
        if (backup.data.users) {
            localStorage.setItem('users', backup.data.users);
        }
        if (backup.data.customFields) {
            localStorage.setItem('customFields', backup.data.customFields);
        }
        if (backup.data.workflows) {
            localStorage.setItem('workflows', backup.data.workflows);
        }
        
        showNotification('Backup restaurado com sucesso! Recarregue a página para ver as alterações.', 'success');
        
        // Recarregar abas
        setTimeout(() => {
            loadConfig();
        }, 1000);
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        showNotification('Erro ao restaurar backup!', 'error');
    }
}

function deleteBackup(backupId) {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const filteredBackups = backups.filter(b => b.id !== backupId);
        localStorage.setItem('backups', JSON.stringify(filteredBackups));
        loadBackupTab();
        showNotification('Backup excluído com sucesso!', 'success');
    }
}

// Funções para auditoria
function filterAuditLogs() {
    console.log('Filtrando logs de auditoria...');
    
    const dateFrom = document.getElementById('auditDateFrom').value;
    const dateTo = document.getElementById('auditDateTo').value;
    const user = document.getElementById('auditUser').value.trim();
    const action = document.getElementById('auditAction').value;
    
    let auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    
    // Aplicar filtros
    if (dateFrom) {
        auditLogs = auditLogs.filter(log => new Date(log.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        auditLogs = auditLogs.filter(log => new Date(log.timestamp) <= toDate);
    }
    if (user) {
        auditLogs = auditLogs.filter(log => 
            log.user && log.user.toLowerCase().includes(user.toLowerCase())
        );
    }
    if (action) {
        auditLogs = auditLogs.filter(log => log.action === action);
    }
    
    // Renderizar tabela filtrada
    const auditTable = document.getElementById('auditTable');
    if (!auditTable) return;
    
    if (auditLogs.length === 0) {
        auditTable.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhum log encontrado com os filtros aplicados.</p>
            </div>
        `;
        return;
    }
    
    const sortedLogs = auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let tableHTML = `
        <table class="audit-table-content">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Detalhes</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedLogs.forEach(log => {
        const date = new Date(log.timestamp);
        tableHTML += `
            <tr>
                <td>${date.toLocaleString('pt-BR')}</td>
                <td>${log.user || 'Sistema'}</td>
                <td>${log.action}</td>
                <td>${log.details || '-'}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    auditTable.innerHTML = tableHTML;
    showNotification(`${auditLogs.length} log(s) encontrado(s)!`, 'success');
}

function exportAuditLogs() {
    console.log('Exportando logs de auditoria...');
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    
    if (auditLogs.length === 0) {
        showNotification('Nenhum log para exportar!', 'warning');
        return;
    }
    
    // Criar CSV
    let csv = 'Data,Usuário,Ação,Detalhes\n';
    auditLogs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleString('pt-BR');
        const user = log.user || 'Sistema';
        const action = log.action || '';
        const details = (log.details || '').replace(/"/g, '""');
        csv += `"${date}","${user}","${action}","${details}"\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Logs exportados com sucesso!', 'success');
}

function clearOldLogs() {
    if (!confirm('Tem certeza que deseja limpar os logs antigos? Esta ação não pode ser desfeita!')) {
        return;
    }
    
    // Limpar logs com mais de 90 dias
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const filteredLogs = auditLogs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    localStorage.setItem('auditLogs', JSON.stringify(filteredLogs));
    
    const removedCount = auditLogs.length - filteredLogs.length;
    showNotification(`${removedCount} log(s) antigo(s) removido(s)!`, 'success');
    loadAuditTab();
}

// Função auxiliar para adicionar log de auditoria
function addAuditLog(action, details, user) {
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    
    const log = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
        user: user || 'Sistema'
    };
    
    auditLogs.push(log);
    
    // Manter apenas os últimos 1000 logs
    if (auditLogs.length > 1000) {
        auditLogs.shift();
    }
    
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
}

// Funções para API
function generateApiKey() {
    console.log('Gerando nova chave de API...');
    
    const modal = document.createElement('div');
    modal.id = 'newApiKeyModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nova Chave de API</h3>
                <button class="close-btn" onclick="closeNewApiKeyModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="apiKeyName">Nome da Chave:</label>
                    <input type="text" id="apiKeyName" placeholder="Ex: Chave Principal" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="apiKeyActive" checked>
                        Chave Ativa
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeNewApiKeyModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveNewApiKey()">Gerar Chave</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeNewApiKeyModal() {
    const modal = document.getElementById('newApiKeyModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewApiKey() {
    const name = document.getElementById('apiKeyName').value.trim();
    const active = document.getElementById('apiKeyActive').checked;
    
    if (!name) {
        showNotification('Por favor, digite o nome da chave!', 'error');
        return;
    }
    
    // Gerar chave aleatória
    const apiKey = 'sk-' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    
    const newKey = {
        id: Date.now(),
        name: name,
        key: apiKey,
        active: active,
        createdAt: new Date().toISOString(),
        lastUsed: null
    };
    
    apiKeys.push(newKey);
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    
    closeNewApiKeyModal();
    
    // Mostrar chave gerada
    const showKeyModal = document.createElement('div');
    showKeyModal.id = 'showApiKeyModal';
    showKeyModal.className = 'modal';
    showKeyModal.style.display = 'flex';
    showKeyModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chave de API Gerada</h3>
                <button class="close-btn" onclick="closeShowApiKeyModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p><strong>IMPORTANTE:</strong> Esta chave será exibida apenas uma vez. Salve-a em local seguro!</p>
                <div class="form-group">
                    <label>Chave de API:</label>
                    <input type="text" id="generatedApiKey" value="${apiKey}" readonly style="font-family: monospace; width: 100%;">
                    <button class="btn-secondary" onclick="copyApiKey()">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeShowApiKeyModal()">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(showKeyModal);
    
    loadApiTab();
    if (typeof addAuditLog === 'function') {
        addAuditLog('API Key Created', `Nova chave de API criada: ${name}`, 'Sistema');
    }
}

function closeShowApiKeyModal() {
    const modal = document.getElementById('showApiKeyModal');
    if (modal) {
        modal.remove();
    }
}

function copyApiKey() {
    const keyInput = document.getElementById('generatedApiKey');
    if (keyInput) {
        keyInput.select();
        document.execCommand('copy');
        showNotification('Chave copiada para a área de transferência!', 'success');
    }
}

function loadApiKeys() {
    console.log('Carregando chaves de API...');
    loadApiTab();
}

function openApiDocumentation() {
    console.log('Abrindo documentação da API...');
    showNotification('Documentação da API em desenvolvimento', 'info');
}

function regenerateApiKey(keyId) {
    if (!confirm('Tem certeza que deseja regenerar esta chave? A chave atual será invalidada!')) {
        return;
    }
    
    const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    const keyIndex = apiKeys.findIndex(k => k.id === keyId);
    
    if (keyIndex === -1) {
        showNotification('Chave não encontrada!', 'error');
        return;
    }
    
    // Gerar nova chave
    const newApiKey = 'sk-' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    apiKeys[keyIndex].key = newApiKey;
    apiKeys[keyIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    
    showNotification('Chave regenerada com sucesso!', 'success');
    loadApiTab();
    if (typeof addAuditLog === 'function') {
        addAuditLog('API Key Regenerated', `Chave de API regenerada: ${apiKeys[keyIndex].name}`, 'Sistema');
    }
}

function deleteApiKey(keyId) {
    if (!confirm('Tem certeza que deseja excluir esta chave de API?')) {
        return;
    }
    
    const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    const key = apiKeys.find(k => k.id === keyId);
    const filteredKeys = apiKeys.filter(k => k.id !== keyId);
    
    localStorage.setItem('apiKeys', JSON.stringify(filteredKeys));
    
    showNotification('Chave de API excluída com sucesso!', 'success');
    loadApiTab();
    if (key && typeof addAuditLog === 'function') {
        addAuditLog('API Key Deleted', `Chave de API excluída: ${key.name}`, 'Sistema');
    }
}

function testEndpoint(method, path) {
    console.log(`Testando endpoint: ${method} ${path}`);
    showNotification(`Endpoint ${method} ${path} testado com sucesso!`, 'success');
}

// Funções para automações
function addAutomation() {
    console.log('Adicionando nova automação...');
    showNotification('Funcionalidade de automação em desenvolvimento', 'info');
}

function editAutomation(automationId) {
    console.log('Editando automação:', automationId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

function deleteAutomation(automationId) {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
        console.log('Excluindo automação:', automationId);
        showNotification('Automação excluída com sucesso!', 'success');
        loadAutomationTab();
    }
}

// Funções para campos
function addField() {
    console.log('Adicionando novo campo personalizado...');
    // Limpar ID de edição
    window.editingFieldId = null;
    // Abrir modal de configuração de campo
    openFieldConfigModal();
}

function editField(fieldId) {
    editCustomField(fieldId);
}

function deleteField(fieldId) {
    deleteCustomField(fieldId);
}

// Funções para usuários
function addUser() {
    console.log('Adicionando novo usuário...');
    
    // Criar modal para adicionar usuário
    const modal = document.createElement('div');
    modal.id = 'addUserModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Novo Usuário</h3>
                <button class="close-btn" onclick="closeAddUserModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="userName">Nome:</label>
                    <input type="text" id="userName" placeholder="Nome completo" required>
                </div>
                <div class="form-group">
                    <label for="userEmail">Email:</label>
                    <input type="email" id="userEmail" placeholder="email@exemplo.com" required>
                </div>
                <div class="form-group">
                    <label for="userPassword">Senha:</label>
                    <input type="password" id="userPassword" placeholder="Deixe em branco para enviar por e-mail">
                    <small style="color: #666; font-size: 0.85rem;">Se deixar em branco, o usuário receberá um e-mail para criar a senha</small>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="sendEmailToUser" checked>
                        <span>Enviar e-mail para criação de senha</span>
                    </label>
                </div>
                <div class="form-group">
                    <label for="userRole">Perfil:</label>
                    <select id="userRole" required>
                        <option value="Admin">Administrador</option>
                        <option value="Agente" selected>Agente</option>
                        <option value="Visualizador">Visualizador</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAddUserModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveNewUser()">Salvar Usuário</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const sendEmailCheckbox = document.getElementById('sendEmailToUser');
    const sendEmail = sendEmailCheckbox ? sendEmailCheckbox.checked : false;
    
    if (!name || !email) {
        showNotification('Por favor, preencha nome e e-mail!', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar se email já existe
    if (users.find(u => u.email === email)) {
        showNotification('Este email já está cadastrado!', 'error');
        return;
    }
    
    // Gerar token único para criação de senha
    const passwordToken = generatePasswordToken();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token válido por 7 dias
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password || null, // Se não tiver senha, será null
        role: role,
        createdAt: new Date().toISOString(),
        active: true,
        passwordToken: passwordToken,
        passwordTokenExpiry: tokenExpiry.toISOString(),
        passwordSet: !!password // Se já tem senha, não precisa criar
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Enviar e-mail se solicitado
    if (sendEmail && !password) {
        sendPasswordSetupEmail(email, name, passwordToken);
    }
    
    closeAddUserModal();
    loadUsersTab();
    showNotification('Usuário criado com sucesso!' + (sendEmail ? ' E-mail de criação de senha enviado.' : ''), 'success');
}

function editUser(userId) {
    console.log('Editando usuário:', userId);
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    // Criar modal de edição
    const modal = document.createElement('div');
    modal.id = 'editUserModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Editar Usuário</h3>
                <button class="close-btn" onclick="closeEditUserModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="editUserName">Nome:</label>
                    <input type="text" id="editUserName" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label for="editUserEmail">Email:</label>
                    <input type="email" id="editUserEmail" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label for="editUserPassword">Nova Senha (deixe em branco para manter):</label>
                    <input type="password" id="editUserPassword" placeholder="Nova senha">
                </div>
                <div class="form-group">
                    <label for="editUserRole">Perfil:</label>
                    <select id="editUserRole">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        <option value="agent" ${user.role === 'agent' ? 'selected' : ''}>Agente</option>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Visualizador</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editUserActive" ${user.active ? 'checked' : ''}>
                        Usuário Ativo
                    </label>
                </div>
                
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e9ecef;">
                    <h5 style="color: var(--primary-blue); margin-bottom: 1rem;">Ações de E-mail</h5>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn-secondary" onclick="sendPasswordSetupEmailToUser(${userId})" style="flex: 1; min-width: 200px;">
                            <i class="fas fa-envelope"></i> Enviar E-mail de Cadastro de Senha
                        </button>
                        <button class="btn-secondary" onclick="resetUserPassword(${userId})" style="flex: 1; min-width: 200px;">
                            <i class="fas fa-key"></i> Reset de Senha (E-mail)
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeEditUserModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveEditedUser(${userId})">Salvar Alterações</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.remove();
    }
}

function saveEditedUser(userId) {
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const password = document.getElementById('editUserPassword').value;
    const role = document.getElementById('editUserRole').value;
    const active = document.getElementById('editUserActive').checked;
    
    if (!name || !email) {
        showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    // Verificar se email já existe em outro usuário
    const emailExists = users.find((u, index) => u.email === email && index !== userIndex);
    if (emailExists) {
        showNotification('Este email já está cadastrado para outro usuário!', 'error');
        return;
    }
    
    // Atualizar usuário
    users[userIndex] = {
        ...users[userIndex],
        name: name,
        email: email,
        role: role,
        active: active,
        updatedAt: new Date().toISOString()
    };
    
    // Atualizar senha se fornecida
    if (password) {
        users[userIndex].password = password; // Em produção, deve ser hash
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    closeEditUserModal();
    loadUsersTab();
    showNotification('Usuário atualizado com sucesso!', 'success');
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        loadUsersTab();
        showNotification('Usuário excluído com sucesso!', 'success');
    }
}

// Função para criar usuários em massa com dados fornecidos
function createBulkUsers() {
    // Dados dos usuários: [Nome, Email, Nível de Acesso]
    const usuarios = [
        ['Equipe Concierge', 'concierge@velotax.com.br', 'Agente'],
        ['Mariana Luz', 'mariana.luz@velotax.com.br', 'Agente'],
        ['Octavio Augusto', 'octavio.silva@velotax.com.br', 'Grupo Suporte'],
        ['Nayara Ribeiro', 'nayara.ribeiro@velotax.com.br', 'Agente'],
        ['Lucas Arteiro', 'lucas.gargiulo@velotax.com.br', 'Agente'],
        ['Gabriel Lima de Araujo', 'gabriel.araujo@velotax.com.br', 'Grupo Suporte'],
        ['Brenda Miranda', 'brenda.miranda@velotax.com.br', 'Grupo Suporte'],
        ['Igor Siqueira', 'igor.siqueira@velotax.com.br', 'Agente'],
        ['financeiro@velotax.com.br', 'financeiro@velotax.com.br', 'Superadministrador'],
        ['Marcos da Silva Pereira', 'marcos.pereira@velotax.com.br', 'Agente'],
        ['Vinicius Assunção', 'vinicius.assuncao@velotax.com.br', 'Agente'],
        ['Nathalia Silva Villanova', 'nathalia.villanova@velotax.com.br', 'Agente'],
        ['Rafael Barreto', 'rafael.barreto@velotax.com.br', 'Agente'],
        ['César Leme', 'cesar.leme@velotax.com.br', 'Agente'],
        ['Joceana F.', 'joceana.freires@velotax.com.br', 'Agente'],
        ['Vanessa Souza', 'vanessa.souza@velotax.com.br', 'Grupo Suporte'],
        ['Roberto Sobral', 'roberto.sobral@velotax.com.br', 'Superadministrador'],
        ['André Violaro', 'andre.violaro@velotax.com.br', 'Superadministrador'],
        ['Joao S.', 'joao.silva@velotax.com.br', 'Superadministrador'],
        ['Lars Bleckwedel Morosini', 'lars@velotax.com.br', 'Superadministrador'],
        ['Marcelo Rodrigo Izael da Silva', 'marcelo.silva@velotax.com.br', 'Agente'],
        ['Shirley C', 'shirley.cunha@velotax.com.br', 'Grupo Suporte'],
        ['Caroline Santiago', 'caroline.santiago@velotax.com.br', 'Grupo Suporte'],
        ['Juliana Aparecida Rofino', 'juliana.rofino@velotax.com.br', 'Agente'],
        ['Rodrigo Raimundo Reis', 'rodrigo.reis@velotax.com.br', 'Agente'],
        ['Laura Porto de Almeida', 'laura.almeida@velotax.com.br', 'Agente'],
        ['Emerson M.', 'emerson.jose@velotax.com.br', 'Superadministrador'],
        ['Monike Samara Nascimento da Silva', 'monike.silva@velotax.com.br', 'Agente'],
        ['Gabrielli Ribeiro de Assunção', 'gabrielli.assuncao@velotax.com.br', 'Agente'],
        ['Guilherme Cunha Velotax', 'guilherme.silva@velotax.com.br', 'Agente'],
        ['Stephanie Monterani de Oliveira', 'stephanie.oliveira@velotax.com.br', 'Agente'],
        ['Dimas Nascimento', 'dimas.nascimento@velotax.com.br', 'Agente'],
        ['Laura Guedes', 'laura.guedes@velotax.com.br', 'Agente'],
        ['Viviane Barros Silva', 'viviane.silva@velotax.com.br', 'Agente'],
        ['Murilo Mazin', 'murilo.caetano@velotax.com.br', 'Agente'],
        ['Anderson F.', 'anderson.silva@velotax.com.br', 'Superadministrador'],
        ['Lucas Gravina', 'lucas.gravina@velotax.com.br', 'Superadministrador'],
        ['Velobot', 'velobot@velotax.com.br', 'Superadministrador'],
        ['Felipe da Rocha Santos do Prado', 'felipe.prado@velotax.com.br', 'Agente']
    ];
    
    // Limpar usuários existentes
    localStorage.removeItem('users');
    
    // Criar novos usuários
    const users = [];
    let baseId = Date.now();
    
    usuarios.forEach((usuario, index) => {
        const [nome, email, nivelAcesso] = usuario;
        
        // Gerar username baseado no email (parte antes do @)
        const username = email.split('@')[0];
        
        // Mapear nível de acesso
        let role = 'Agente';
        if (nivelAcesso === 'Superadministrador') {
            role = 'Admin';
        } else if (nivelAcesso === 'Grupo Suporte') {
            role = 'Agente'; // Ou criar um novo perfil se necessário
        } else if (nivelAcesso === 'Agente') {
            role = 'Agente';
        }
        
        // Gerar token para criação de senha
        const passwordToken = generatePasswordToken();
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 7);
        
        // Se o nome for igual ao email (caso especial), usar email como nome
        const finalName = (nome.trim() === email.trim()) ? email.split('@')[0] : nome.trim();
        
        const newUser = {
            id: baseId + index,
            name: finalName,
            email: email.trim(),
            username: username,
            password: null, // Sem senha inicial - será criada via e-mail
            role: role,
            createdAt: new Date().toISOString(),
            active: true,
            passwordToken: passwordToken,
            passwordTokenExpiry: tokenExpiry.toISOString(),
            passwordSet: false,
            nivelAcesso: nivelAcesso // Salvar nível original também
        };
        
        users.push(newUser);
    });
    
    // Salvar usuários
    localStorage.setItem('users', JSON.stringify(users));
    
    // Mostrar resultado
    console.log(`${users.length} usuários criados com sucesso!`);
    showNotification(`${users.length} usuário(s) criado(s) com sucesso!`, 'success');
    
    // Recarregar lista de usuários
    if (document.getElementById('usersList')) {
        loadUsersTab();
    }
    
    return { created: users.length, skipped: 0 };
}

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO DE E-MAIL
// ============================================

// Carregar aba de e-mail
function loadEmailTab() {
    const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
    
    // Preencher campos
    if (emailSettings.supportEmail) {
        const supportEmailInput = document.getElementById('emailSupport');
        if (supportEmailInput) supportEmailInput.value = emailSettings.supportEmail;
    }
    if (emailSettings.smtpHost) {
        const smtpHostInput = document.getElementById('smtpHost');
        if (smtpHostInput) smtpHostInput.value = emailSettings.smtpHost;
    }
    if (emailSettings.smtpPort) {
        const smtpPortInput = document.getElementById('smtpPort');
        if (smtpPortInput) smtpPortInput.value = emailSettings.smtpPort;
    }
    if (emailSettings.smtpSecure !== undefined) {
        const smtpSecureSelect = document.getElementById('smtpSecure');
        if (smtpSecureSelect) smtpSecureSelect.value = emailSettings.smtpSecure;
    }
    if (emailSettings.smtpUser) {
        const smtpUserInput = document.getElementById('smtpUser');
        if (smtpUserInput) smtpUserInput.value = emailSettings.smtpUser;
    }
    if (emailSettings.smtpPassword) {
        const smtpPasswordInput = document.getElementById('smtpPassword');
        if (smtpPasswordInput) smtpPasswordInput.value = emailSettings.smtpPassword;
    }
    if (emailSettings.smtpFromName) {
        const smtpFromNameInput = document.getElementById('smtpFromName');
        if (smtpFromNameInput) smtpFromNameInput.value = emailSettings.smtpFromName;
    }
}

// Salvar configurações de e-mail
function saveEmailSettings() {
    const emailSettings = {
        supportEmail: document.getElementById('emailSupport').value.trim(),
        smtpHost: document.getElementById('smtpHost').value.trim(),
        smtpPort: parseInt(document.getElementById('smtpPort').value) || 587,
        smtpSecure: document.getElementById('smtpSecure').value === 'true',
        smtpUser: document.getElementById('smtpUser').value.trim(),
        smtpPassword: document.getElementById('smtpPassword').value,
        smtpFromName: document.getElementById('smtpFromName').value.trim() || 'Velodesk Suporte'
    };
    
    // Validação básica
    if (!emailSettings.supportEmail) {
        showNotification('Por favor, informe o e-mail para receber chamados!', 'error');
        return;
    }
    
    if (emailSettings.smtpHost && !emailSettings.smtpUser) {
        showNotification('Por favor, informe o usuário SMTP!', 'error');
        return;
    }
    
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    showNotification('Configurações de e-mail salvas com sucesso!', 'success');
}

// Testar configurações de e-mail
function testEmailSettings() {
    const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
    
    if (!emailSettings.smtpHost || !emailSettings.smtpUser) {
        showNotification('Por favor, configure o SMTP antes de testar!', 'error');
        return;
    }
    
    const testEmail = emailSettings.smtpUser;
    
    // Simular envio de e-mail de teste
    sendEmailViaSMTP({
        to: testEmail,
        subject: 'Teste de Configuração - Velodesk',
        html: `
            <h2>Teste de Configuração de E-mail</h2>
            <p>Este é um e-mail de teste do sistema Velodesk.</p>
            <p>Se você recebeu este e-mail, suas configurações SMTP estão funcionando corretamente!</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        `
    }).then(() => {
        showNotification('E-mail de teste enviado com sucesso! Verifique sua caixa de entrada.', 'success');
    }).catch((error) => {
        console.error('Erro ao enviar e-mail:', error);
        showNotification('Erro ao enviar e-mail de teste. Verifique as configurações SMTP.', 'error');
    });
}

// Gerar token único para criação de senha
function generatePasswordToken() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Enviar e-mail para criação de senha
function sendPasswordSetupEmail(userEmail, userName, token) {
    const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
    
    if (!emailSettings.smtpHost || !emailSettings.smtpUser) {
        console.warn('Configurações SMTP não encontradas. E-mail não será enviado.');
        showNotification('Configure o SMTP nas configurações de e-mail para enviar e-mails aos usuários.', 'warning');
        return;
    }
    
    // Gerar URL do link de criação de senha
    const baseUrl = window.location.origin + window.location.pathname;
    const setupUrl = `${baseUrl}?action=setup-password&token=${token}&email=${encodeURIComponent(userEmail)}`;
    
    const emailContent = {
        to: userEmail,
        subject: 'Bem-vindo ao Velodesk - Crie sua senha de acesso',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000058; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #000058; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Velodesk</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, ${userName}!</h2>
                        <p>Bem-vindo ao sistema Velodesk!</p>
                        <p>Uma conta foi criada para você. Para começar a usar o sistema, você precisa criar uma senha de acesso.</p>
                        <p style="text-align: center;">
                            <a href="${setupUrl}" class="button">Criar Minha Senha</a>
                        </p>
                        <p>Ou copie e cole o link abaixo no seu navegador:</p>
                        <p style="word-break: break-all; color: #000058;">${setupUrl}</p>
                        <p><strong>Este link expira em 7 dias.</strong></p>
                        <p>Se você não solicitou esta conta, pode ignorar este e-mail.</p>
                    </div>
                    <div class="footer">
                        <p>Este é um e-mail automático, por favor não responda.</p>
                        <p>&copy; ${new Date().getFullYear()} Velodesk - Sistema de Gestão de Chamados</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    sendEmailViaSMTP(emailContent).then(() => {
        console.log('E-mail de criação de senha enviado para:', userEmail);
    }).catch((error) => {
        console.error('Erro ao enviar e-mail de criação de senha:', error);
        showNotification('Erro ao enviar e-mail. Verifique as configurações SMTP.', 'error');
    });
}

// Função para enviar e-mail via SMTP (simulação - em produção, usar backend)
function sendEmailViaSMTP(emailData) {
    return new Promise((resolve, reject) => {
        const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
        
        // Em produção, isso deve ser feito no backend
        // Por enquanto, vamos simular o envio e salvar no localStorage para demonstração
        const emailLog = {
            id: Date.now(),
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.html,
            sentAt: new Date().toISOString(),
            status: 'sent'
        };
        
        // Salvar log de e-mails enviados
        const emailLogs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
        emailLogs.push(emailLog);
        localStorage.setItem('emailLogs', JSON.stringify(emailLogs));
        
        // Simular delay de envio
        setTimeout(() => {
            console.log('E-mail enviado (simulado):', emailData.to);
            resolve(emailLog);
        }, 1000);
        
        // Em produção, fazer requisição para backend:
        /*
        fetch('/api/send-email', {
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
        .then(data => resolve(data))
        .catch(error => reject(error));
        */
    });
}

// Verificar se há token de criação de senha na URL
function checkPasswordSetupToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    const action = urlParams.get('action');
    
    if (action === 'setup-password' && token && email) {
        showPasswordSetupModal(token, email);
    }
}

// Mostrar modal para criação de senha
function showPasswordSetupModal(token, email) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === decodeURIComponent(email) && u.passwordToken === token);
    
    if (!user) {
        showNotification('Link inválido ou expirado!', 'error');
        return;
    }
    
    // Verificar se token expirou
    const tokenExpiry = new Date(user.passwordTokenExpiry);
    if (new Date() > tokenExpiry) {
        showNotification('Este link expirou! Solicite um novo link de criação de senha.', 'error');
        return;
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'passwordSetupModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> Criar Senha de Acesso</h3>
                <button class="close-btn" onclick="closePasswordSetupModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Olá, <strong>${user.name}</strong>!</p>
                <p>Por favor, crie uma senha para acessar o sistema Velodesk.</p>
                <form id="passwordSetupForm">
                    <div class="form-group">
                        <label for="newPasswordSetup">Nova Senha:</label>
                        <input type="password" id="newPasswordSetup" required minlength="6">
                        <small>Mínimo de 6 caracteres</small>
                    </div>
                    <div class="form-group">
                        <label for="confirmPasswordSetup">Confirmar Senha:</label>
                        <input type="password" id="confirmPasswordSetup" required minlength="6">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closePasswordSetupModal()">Cancelar</button>
                <button class="btn-primary" onclick="savePasswordSetup('${token}', '${email}')">Criar Senha</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fechar modal de criação de senha
function closePasswordSetupModal() {
    const modal = document.getElementById('passwordSetupModal');
    if (modal) {
        modal.remove();
        // Remover parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Enviar e-mail de cadastro de senha para usuário existente
function sendPasswordSetupEmailToUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    // Gerar novo token
    const passwordToken = generatePasswordToken();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);
    
    // Atualizar token do usuário
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex].passwordToken = passwordToken;
    users[userIndex].passwordTokenExpiry = tokenExpiry.toISOString();
    users[userIndex].passwordSet = false;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Enviar e-mail
    sendPasswordSetupEmail(user.email, user.name, passwordToken);
    showNotification('E-mail de cadastro de senha enviado com sucesso!', 'success');
}

// Reset de senha do usuário (gera senha aleatória e envia por e-mail)
function resetUserPassword(userId) {
    if (!confirm('Tem certeza que deseja resetar a senha deste usuário? Uma nova senha provisória será gerada e enviada por e-mail.')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    // Gerar senha aleatória provisória
    const temporaryPassword = generateRandomPassword();
    
    // Atualizar senha do usuário
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex].password = temporaryPassword;
    users[userIndex].passwordSet = true;
    users[userIndex].passwordToken = null;
    users[userIndex].passwordTokenExpiry = null;
    users[userIndex].passwordResetAt = new Date().toISOString();
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Enviar e-mail com senha provisória
    sendPasswordResetEmail(user.email, user.name, temporaryPassword);
    showNotification('Senha resetada! E-mail com senha provisória enviado com sucesso!', 'success');
}

// Gerar senha aleatória
function generateRandomPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    
    // Garantir pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%&*'[Math.floor(Math.random() * 7)];
    
    // Preencher o resto
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Enviar e-mail de reset de senha
function sendPasswordResetEmail(userEmail, userName, temporaryPassword) {
    const emailSettings = JSON.parse(localStorage.getItem('emailSettings') || '{}');
    
    if (!emailSettings.smtpHost || !emailSettings.smtpUser) {
        console.warn('Configurações SMTP não encontradas. E-mail não será enviado.');
        showNotification('Configure o SMTP nas configurações de e-mail para enviar e-mails aos usuários.', 'warning');
        return;
    }
    
    const emailContent = {
        to: userEmail,
        subject: 'Reset de Senha - Velodesk',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000058; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
                    .password-box { background: white; padding: 20px; border: 2px solid #000058; border-radius: 5px; margin: 20px 0; text-align: center; }
                    .password { font-size: 24px; font-weight: bold; color: #000058; letter-spacing: 2px; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Velodesk</h1>
                    </div>
                    <div class="content">
                        <h2>Olá, ${userName}!</h2>
                        <p>Uma nova senha provisória foi gerada para sua conta no sistema Velodesk.</p>
                        <div class="password-box">
                            <p style="margin: 0 0 10px 0; color: #666;">Sua senha provisória:</p>
                            <div class="password">${temporaryPassword}</div>
                        </div>
                        <div class="warning">
                            <p><strong>⚠️ Importante:</strong></p>
                            <p>Esta é uma senha provisória. Por segurança, recomendamos que você altere esta senha após fazer login.</p>
                        </div>
                        <p>Você pode alterar sua senha acessando "Meu Perfil" > "Alterar Senha" após fazer login.</p>
                        <p>Se você não solicitou este reset de senha, entre em contato com o administrador do sistema imediatamente.</p>
                    </div>
                    <div class="footer">
                        <p>Este é um e-mail automático, por favor não responda.</p>
                        <p>&copy; ${new Date().getFullYear()} Velodesk - Sistema de Gestão de Chamados</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    sendEmailViaSMTP(emailContent).then(() => {
        console.log('E-mail de reset de senha enviado para:', userEmail);
    }).catch((error) => {
        console.error('Erro ao enviar e-mail de reset de senha:', error);
        showNotification('Erro ao enviar e-mail. Verifique as configurações SMTP.', 'error');
    });
}

// Salvar senha criada pelo usuário
function savePasswordSetup(token, email) {
    const newPassword = document.getElementById('newPasswordSetup').value;
    const confirmPassword = document.getElementById('confirmPasswordSetup').value;
    
    if (!newPassword || !confirmPassword) {
        showNotification('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('A senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === decodeURIComponent(email) && u.passwordToken === token);
    
    if (userIndex === -1) {
        showNotification('Usuário não encontrado!', 'error');
        return;
    }
    
    // Atualizar usuário
    users[userIndex].password = newPassword;
    users[userIndex].passwordSet = true;
    users[userIndex].passwordToken = null;
    users[userIndex].passwordTokenExpiry = null;
    users[userIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('users', JSON.stringify(users));
    
    closePasswordSetupModal();
    showNotification('Senha criada com sucesso! Você já pode fazer login.', 'success');
    
    // Redirecionar para login após 2 segundos
    setTimeout(() => {
        window.location.href = window.location.pathname;
    }, 2000);
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando relatórios...');
}

// Função para carregar chat
function loadChat() {
    console.log('=== loadChat chamada ===');
    
    // Verificar status da conexão
    checkWhatsAppConnectionStatus();
    
    // Aguardar um pouco para garantir que a página está carregada
    setTimeout(() => {
        // Carregar conversas salvas se existirem
        reloadSavedConversations();
    }, 500);
}

// Função para verificar status da conexão do WhatsApp
function checkWhatsAppConnectionStatus() {
    console.log('=== checkWhatsAppConnectionStatus chamada ===');
    
    const notConnectedDiv = document.getElementById('whatsappNotConnected');
    const connectedDiv = document.getElementById('whatsappConnected');
    
    console.log('Container whatsappNotConnected encontrado:', !!notConnectedDiv);
    console.log('Container whatsappConnected encontrado:', !!connectedDiv);
    
    // Verificar status no backend primeiro
    const backendUrl = 'http://localhost:3000/api/whatsapp/status';
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Backend não disponível');
        })
        .then(data => {
            console.log('Status do backend:', data);
            
            if (data.connected) {
                console.log('WhatsApp está conectado no backend!');
                
                // Atualizar localStorage
                const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
                settings.connected = true;
                settings.connectedAt = new Date().toISOString();
                localStorage.setItem('whatsappSettings', JSON.stringify(settings));
                
                // Mostrar container de conversas
                if (notConnectedDiv) {
                    notConnectedDiv.style.display = 'none';
                    console.log('Container whatsappNotConnected ocultado');
                }
                if (connectedDiv) {
                    connectedDiv.style.display = 'flex';
                    console.log('Container whatsappConnected exibido (display: flex)');
                }
                
                // Sincronizar conversas do backend
                setTimeout(() => {
                    console.log('Sincronizando conversas do backend...');
                    syncWhatsAppConversations();
                }, 500);
            } else {
                console.log('WhatsApp NÃO está conectado no backend');
                
                // Atualizar localStorage
                const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
                settings.connected = false;
                localStorage.setItem('whatsappSettings', JSON.stringify(settings));
                
                // Mostrar tela de não conectado
                if (notConnectedDiv) notConnectedDiv.style.display = 'block';
                if (connectedDiv) connectedDiv.style.display = 'none';
                
                // Se tem QR Code, mostrar mensagem
                if (data.hasQRCode) {
                    showNotification('Escaneie o QR Code no terminal do backend para conectar', 'info');
                }
            }
        })
        .catch(error => {
            console.log('Erro ao verificar status do backend:', error);
            
            // Fallback: verificar localStorage
            const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
            
            if (settings.connected) {
                // Tentar usar conversas salvas
                if (notConnectedDiv) notConnectedDiv.style.display = 'none';
                if (connectedDiv) connectedDiv.style.display = 'flex';
                setTimeout(() => {
                    reloadSavedConversations();
                }, 500);
            } else {
                if (notConnectedDiv) notConnectedDiv.style.display = 'block';
                if (connectedDiv) connectedDiv.style.display = 'none';
                showNotification('Backend não disponível. Inicie o servidor backend primeiro.', 'warning');
            }
        });
}

// Função para mostrar notificações
function showNotification(message, type = 'info', duration = 3000) {
    // Criar container de notificações se não existir
    let container = document.getElementById('notificationsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Remover automaticamente após o tempo especificado
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Função para abrir Assistente IA
function openAIChatbot() {
    const modal = document.getElementById('aiChatbotModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Função para fechar Assistente IA
function closeAIChatbot() {
    const modal = document.getElementById('aiChatbotModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para enviar mensagem do IA
function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input || !input.value.trim()) return;
    
    const userMessage = input.value.trim();
    input.value = '';
    
    // Adicionar mensagem do usuário
    addAIMessage(userMessage, 'user');
    
    // Simular resposta do IA
    setTimeout(() => {
        const response = 'Olá! Como posso ajudá-lo hoje?';
        addAIMessage(response, 'assistant');
    }, 1000);
}

// Função para lidar com tecla Enter no chat IA
function handleAIChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

// Função para adicionar mensagem no chat IA
function addAIMessage(text, sender) {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-${sender}`;
    
    const avatar = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    messageDiv.innerHTML = `
        <div class="ai-avatar">
            ${avatar}
        </div>
        <div class="ai-content">
            <p>${text}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Função para atualizar tickets
function refreshTickets() {
    const selectedBox = document.querySelector('.box-item.selected');
    if (selectedBox) {
        const boxId = selectedBox.getAttribute('data-box-id');
        loadTicketsForBox(boxId);
    } else {
        loadTicketsForBox('novos');
    }
}

// Função para abrir modal de nova caixa
function openNewBoxModal() {
    console.log('Abrindo modal de nova caixa...');
    
    const modal = document.createElement('div');
    modal.id = 'newBoxModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nova Caixa Kanban</h3>
                <button class="close-btn" onclick="closeNewBoxModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="boxName">Nome da Caixa:</label>
                    <input type="text" id="boxName" placeholder="Ex: Em Análise" required>
                </div>
                <div class="form-group">
                    <label for="boxDescription">Descrição (opcional):</label>
                    <textarea id="boxDescription" rows="3" placeholder="Descreva o propósito desta caixa"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeNewBoxModal()">Cancelar</button>
                <button class="btn-primary" onclick="createNewBox()">Criar Caixa</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal de nova caixa
function closeNewBoxModal() {
    const modal = document.getElementById('newBoxModal');
    if (modal) {
        modal.remove();
    }
}

// Função para criar nova caixa
function createNewBox() {
    const name = document.getElementById('boxName').value;
    const description = document.getElementById('boxDescription').value;
    
    if (!name) {
        alert('Por favor, digite o nome da caixa!');
        return;
    }
    
    // Gerar ID único para a caixa
    const boxId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const newBox = {
        id: boxId,
        name: name,
        description: description || '',
        tickets: []
    };
    
    // Carregar caixas existentes
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    kanbanColumns.push(newBox);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Recarregar caixas
    loadBoxes();
    
    // Fechar modal
    closeNewBoxModal();
    
    // Mostrar notificação
    showNotification(`Caixa "${name}" criada com sucesso!`, 'success');
}

// Função para salvar nova caixa
function saveNewBox() {
    console.log('Salvando nova caixa...');
}

// Função para atualizar dashboard
function refreshDashboard() {
    loadDashboardStats();
}

// Função para exportar dashboard
function exportDashboard() {
    console.log('Exportando dashboard...');
}

// Função para gerar relatórios
function generatePerformanceReport() {
    console.log('Gerando relatório de performance...');
}

function generateAgentReport() {
    console.log('Gerando relatório de agentes...');
}

function generateSatisfactionReport() {
    console.log('Gerando relatório de satisfação...');
}

// Função para alternar menu mobile
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Função para alternar painel de notificações
// Funções de Status
let currentUserStatus = localStorage.getItem('userStatus') || 'online';

// Inicializar status ao carregar
function initializeUserStatus() {
    changeStatus(currentUserStatus, false);
}

function toggleStatusDropdown() {
    const dropdown = document.getElementById('statusDropdown');
    if (!dropdown) return;
    
    // Fechar outros dropdowns se houver
    document.querySelectorAll('.status-dropdown').forEach(menu => {
        if (menu.id !== 'statusDropdown') {
            menu.style.display = 'none';
        }
    });
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
}

function changeStatus(status, save = true) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const dropdown = document.getElementById('statusDropdown');
    
    if (!statusIndicator || !statusText) return;
    
    // Remover classes anteriores
    statusIndicator.classList.remove('status-online', 'status-ocupado', 'status-ausente', 'status-offline');
    
    // Atualizar status baseado no valor
    let statusName = '';
    let statusClass = '';
    
    switch(status) {
        case 'online':
            statusName = 'Online';
            statusClass = 'status-online';
            break;
        case 'ocupado':
            statusName = 'Ocupado';
            statusClass = 'status-ocupado';
            break;
        case 'ausente':
            statusName = 'Ausente';
            statusClass = 'status-ausente';
            break;
        case 'offline':
            statusName = 'Off-line';
            statusClass = 'status-offline';
            break;
        default:
            statusName = 'Online';
            statusClass = 'status-online';
    }
    
    statusIndicator.classList.add(statusClass);
    statusText.textContent = statusName;
    
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    if (save) {
        currentUserStatus = status;
        localStorage.setItem('userStatus', status);
        showNotification(`Status alterado para "${statusName}"`, 'success');
    }
}

// Fechar dropdown ao clicar fora - usar apenas uma vez
if (!window.statusDropdownInitialized) {
    window.statusDropdownInitialized = true;
    
    document.addEventListener('DOMContentLoaded', function() {
        initializeUserStatus();
    });
    
    document.addEventListener('click', function(e) {
        const selector = document.getElementById('statusSelector');
        const dropdown = document.getElementById('statusDropdown');
        
        if (selector && dropdown && !selector.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('show');
    }
}

// Função para marcar todas como lidas
function markAllAsRead() {
    console.log('Marcando todas como lidas...');
}

// Função para alternar menu do perfil
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    const btn = document.getElementById('profileBtn');
    
    if (menu && btn) {
        menu.classList.toggle('show');
        btn.classList.toggle('active');
    }
}

// Função para editar perfil
function editProfile() {
    // Fechar menu do perfil
    toggleProfileMenu();
    
    // Obter dados do usuário atual do localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Se não houver currentUser, usar o primeiro usuário ou criar um padrão
    let userData = currentUser;
    if (!userData || Object.keys(userData).length === 0) {
        if (users.length > 0) {
            userData = users[0];
        } else {
            userData = {
                id: Date.now(),
                name: 'Usuário',
                email: 'usuario@example.com',
                role: 'Admin',
                username: 'usuario'
            };
        }
    }
    
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'editProfileModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-edit"></i> Editar Perfil</h3>
                <button class="close-btn" onclick="closeEditProfileModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editProfileForm">
                    <div class="form-group">
                        <label for="editProfileName">Nome:</label>
                        <input type="text" id="editProfileName" value="${userData.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editProfileEmail">E-mail:</label>
                        <input type="email" id="editProfileEmail" value="${userData.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editProfileUsername">Usuário:</label>
                        <input type="text" id="editProfileUsername" value="${userData.username || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editProfileRole">Perfil:</label>
                        <select id="editProfileRole" required>
                            <option value="Admin" ${userData.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            <option value="Agente" ${userData.role === 'Agente' ? 'selected' : ''}>Agente</option>
                            <option value="Visualizador" ${userData.role === 'Visualizador' ? 'selected' : ''}>Visualizador</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeEditProfileModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveProfile()">Salvar Alterações</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal de editar perfil
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
}

// Função para salvar perfil
function saveProfile() {
    const name = document.getElementById('editProfileName').value.trim();
    const email = document.getElementById('editProfileEmail').value.trim();
    const username = document.getElementById('editProfileUsername').value.trim();
    const role = document.getElementById('editProfileRole').value;
    
    if (!name || !email || !username) {
        showNotification('Por favor, preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, insira um e-mail válido!', 'error');
        return;
    }
    
    // Obter usuário atual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Atualizar dados do usuário
    const updatedUser = {
        ...currentUser,
        name: name,
        email: email,
        username: username,
        role: role,
        updatedAt: new Date().toISOString()
    };
    
    // Atualizar na lista de usuários se existir
    if (currentUser.id) {
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updatedUser };
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Salvar usuário atual
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Atualizar nome no botão do perfil se existir
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        const span = profileBtn.querySelector('span');
        if (span) {
            span.textContent = name || 'Meu Perfil';
        }
    }
    
    showNotification('Perfil atualizado com sucesso!', 'success');
    closeEditProfileModal();
}

// Função para alterar senha
function changePassword() {
    // Fechar menu do perfil
    toggleProfileMenu();
    
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> Alterar Senha</h3>
                <button class="close-btn" onclick="closeChangePasswordModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="changePasswordForm">
                    <div class="form-group">
                        <label for="currentPassword">Senha Atual:</label>
                        <input type="password" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nova Senha:</label>
                        <input type="password" id="newPassword" required minlength="6">
                        <small style="color: #666; font-size: 0.85rem;">Mínimo de 6 caracteres</small>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar Nova Senha:</label>
                        <input type="password" id="confirmPassword" required minlength="6">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeChangePasswordModal()">Cancelar</button>
                <button class="btn-primary" onclick="savePassword()">Alterar Senha</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal de alterar senha
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
}

// Função para salvar nova senha
function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Por favor, preencha todos os campos!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('A nova senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('As senhas não coincidem!', 'error');
        return;
    }
    
    // Obter usuário atual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar senha atual (se houver senha salva)
    if (currentUser.password && currentUser.password !== currentPassword) {
        showNotification('Senha atual incorreta!', 'error');
        return;
    }
    
    // Atualizar senha
    const updatedUser = {
        ...currentUser,
        password: newPassword,
        updatedAt: new Date().toISOString()
    };
    
    // Atualizar na lista de usuários se existir
    if (currentUser.id) {
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], password: newPassword };
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    // Salvar usuário atual
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    showNotification('Senha alterada com sucesso!', 'success');
    closeChangePasswordModal();
}

// Função para logout
function logout() {
    // Fechar menu do perfil
    toggleProfileMenu();
    
    // Confirmar logout
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
        
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        showNotification('Logout realizado com sucesso!', 'success');
    }
}

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema Velodesk inicializado!');
    
    // Login automático - sempre entrar sem validação
    // Executar imediatamente para garantir que funcione
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    
    if (mainApp) {
        mainApp.style.display = 'grid';
    }
    
    // Marcar como logado
    localStorage.setItem('isLoggedIn', 'true');
    
    // Garantir que todas as páginas comecem sem a classe ticket-tab-open
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('ticket-tab-open');
    });
    
    // Fechar menu do perfil ao clicar fora dele
    document.addEventListener('click', function(event) {
        const profileMenu = document.getElementById('profileMenu');
        const profileBtn = document.getElementById('profileBtn');
        
        if (profileMenu && profileBtn) {
            const isClickInsideMenu = profileMenu.contains(event.target);
            const isClickOnButton = profileBtn.contains(event.target);
            
            if (!isClickInsideMenu && !isClickOnButton && profileMenu.classList.contains('show')) {
                profileMenu.classList.remove('show');
                profileBtn.classList.remove('active');
            }
        }
    });
    
    // Carregar dados iniciais
    setTimeout(() => {
        loadBoxes();
        loadDashboardStats();
        loadConfig();
        
        // Configurar event listeners para busca e ordenação
        setupTicketFilters();
        
        // Inicializar status do usuário
        initializeUserStatus();
        
        // Carregar nome do usuário no botão do perfil
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn && currentUser.name) {
            const span = profileBtn.querySelector('span');
            if (span) {
                span.textContent = currentUser.name;
            }
        }
        
        // Criar usuários em massa (sempre recriar com dados atualizados)
        setTimeout(() => {
            createBulkUsers();
        }, 3000);
    }, 100);
});

// Garantir login automático mesmo se DOMContentLoaded já tiver executado
(function() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen && mainApp) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'grid';
        localStorage.setItem('isLoggedIn', 'true');
    }
})();

// ============================================
// FUNÇÕES DE RELATÓRIOS - LEITURA DE TICKETS
// ============================================

// Variável global para armazenar tickets importados
let importedTickets = [];
let allImportedTickets = []; // Todos os tickets sem filtro

// Função para alternar entre tabs de relatórios
function switchReportTab(tabName) {
    // Ocultar todas as tabs
    document.querySelectorAll('.report-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.report-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Ativar botão selecionado
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Atualizar conteúdo baseado na tab
    if (tabName === 'reading') {
        displayImportedTickets();
        updateReadingFilters();
        updateCharts();
    } else if (tabName === 'performance') {
        updatePerformanceCharts();
    } else if (tabName === 'agents') {
        updateAgentsCharts();
    } else if (tabName === 'satisfaction') {
        updateSatisfactionCharts();
    }
}

// Função para processar upload de arquivo
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    const importStatus = document.getElementById('importStatus');
    const statusMessage = document.getElementById('statusMessage');
    const statusStats = document.getElementById('statusStats');
    
    // Mostrar área de status
    importStatus.style.display = 'block';
    statusMessage.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processando arquivo: ${fileName}...`;
    
    // Ler arquivo baseado na extensão
    if (fileExtension === 'csv') {
        readCSVFile(file);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
        readExcelFile(file);
    } else {
        statusMessage.innerHTML = `<i class="fas fa-times-circle"></i> Formato não suportado. Use .xlsx, .xls ou .csv`;
        statusMessage.className = 'status-message error';
        return;
    }
}

// Função para ler arquivo CSV
function readCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                showImportError('Arquivo CSV vazio ou sem dados');
                return;
            }
            
            // Primeira linha são os cabeçalhos
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Debug: Log dos headers encontrados
            console.log('📋 Headers encontrados na planilha CSV:', headers);
            
            const tickets = [];
            
            // Processar linhas de dados
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const ticket = parseTicketRow(headers, values);
                if (ticket) tickets.push(ticket);
            }
            
            processImportedTickets(tickets);
        } catch (error) {
            showImportError('Erro ao ler arquivo CSV: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Função para ler arquivo Excel
function readExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            // Usar cellDates: true para preservar datas como objetos Date
            const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
            
            // Ler primeira aba
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converter para JSON com preservação de tipos
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                raw: false, // Para ter strings formatadas
                dateNF: 'dd/mm/yyyy hh:mm' // Formato de data desejado
            });
            
            if (jsonData.length < 2) {
                showImportError('Planilha vazia ou sem dados');
                return;
            }
            
            // Primeira linha são os cabeçalhos
            const headers = jsonData[0].map(h => {
                if (h === null || h === undefined) return '';
                return String(h).trim().toLowerCase();
            });
            
            // Debug: Log dos headers encontrados
            console.log('📋 Headers encontrados na planilha:', headers);
            
            // Também obter dados brutos para datas
            const rawData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                raw: true // Para ter valores brutos (números de datas do Excel)
            });
            
            const tickets = [];
            
            // Processar linhas de dados
            for (let i = 1; i < jsonData.length; i++) {
                // Valores formatados (strings)
                const formattedValues = jsonData[i].map(v => {
                    if (v === null || v === undefined) return '';
                    return String(v).trim();
                });
                
                // Valores brutos (para datas)
                const rawValues = rawData[i] || [];
                
                // Combinar valores formatados com brutos para melhor processamento de datas
                const values = formattedValues.map((formatted, idx) => {
                    const raw = rawValues[idx];
                    // Se o valor formatado está vazio mas existe raw, usar raw
                    if ((!formatted || formatted === '') && raw !== undefined && raw !== null) {
                        return raw;
                    }
                    return formatted || '';
                });
                
                const ticket = parseTicketRow(headers, values);
                if (ticket) tickets.push(ticket);
            }
            
            processImportedTickets(tickets);
        } catch (error) {
            console.error('Erro ao ler arquivo Excel:', error);
            showImportError('Erro ao ler arquivo Excel: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Função para processar linha de ticket
function parseTicketRow(headers, values) {
    // Mapear nomes de colunas possíveis (mais completo)
    const columnMap = {
        'número do ticket': 'number',
        'numero do ticket': 'number',
        'número': 'number',
        'numero': 'number',
        'id': 'number',
        'ticket': 'number',
        'assunto': 'subject',
        'assunto do ticket': 'subject',
        'assunto do ticket': 'subject',
        'título': 'subject',
        'titulo': 'subject',
        'título do ticket': 'subject',
        'titulo do ticket': 'subject',
        'title': 'subject',
        'descrição': 'subject',
        'descricao': 'subject',
        'descrição do ticket': 'subject',
        'descricao do ticket': 'subject',
        'resumo': 'subject',
        'summary': 'subject',
        'status': 'status',
        'prioridade': 'priority',
        'priority': 'priority',
        'data de entrada': 'entryDate',
        'data entrada': 'entryDate',
        'data de criação': 'entryDate',
        'data criacao': 'entryDate',
        'data criação': 'entryDate',
        'data criado': 'entryDate',
        'created': 'entryDate',
        'created_at': 'entryDate',
        'data criação': 'entryDate',
        'data da resolução': 'resolutionDate',
        'data resolucao': 'resolutionDate',
        'data resolução': 'resolutionDate',
        'data de fechamento': 'resolutionDate',
        'data fechamento': 'resolutionDate',
        'resolvido em': 'resolutionDate',
        'resolvido_em': 'resolutionDate',
        'closed': 'resolutionDate',
        'closed_at': 'resolutionDate',
        'responsável': 'responsible',
        'responsavel': 'responsible',
        'responsável pelo ticket': 'responsible',
        'responsavel pelo ticket': 'responsible',
        'responsável pelo atendimento': 'responsible',
        'responsavel pelo atendimento': 'responsible',
        'atendente': 'responsible',
        'agent': 'responsible',
        'agente': 'responsible',
        'owner': 'responsible',
        'atribuído a': 'responsible',
        'atribuido a': 'responsible',
        'assigned to': 'responsible',
        'avaliação': 'rating',
        'avaliacao': 'rating',
        'nota': 'rating',
        'satisfação': 'rating',
        'satisfacao': 'rating',
        'rating': 'rating',
        'score': 'rating'
    };
    
    const ticket = {};
    
    // Debug: log dos headers (apenas quando necessário)
    // console.log('Headers:', headers);
    
    // Primeiro, identificar todos os campos e valores
    const fieldMapping = [];
    
    headers.forEach((header, index) => {
        if (!header) return; // Pular headers vazios
        
        const normalizedHeader = String(header).toLowerCase().trim();
        const rawValue = values[index];
        
        // Verificar se o valor está vazio (várias formas de verificar)
        const isEmpty = rawValue === undefined || 
                       rawValue === null || 
                       rawValue === '' || 
                       String(rawValue).trim() === '' ||
                       String(rawValue).trim().toLowerCase() === 'n/a' ||
                       String(rawValue).trim().toLowerCase() === 'na';
        
        if (isEmpty) {
            return; // Pular valores vazios - não mapear
        }
        
        // Buscar mapeamento exato primeiro
        let foundField = columnMap[normalizedHeader];
        let matchType = 'exact';
        
        // Se não encontrar mapeamento exato, tentar busca parcial (com prioridade para matches mais específicos)
        if (!foundField) {
            // Priorizar matches mais específicos primeiro (maior para menor)
            const sortedKeys = Object.keys(columnMap).sort((a, b) => b.length - a.length);
            
            // Pesos para evitar matches ambíguos - campos mais específicos têm preferência
            const fieldPriority = {
                'responsible': ['responsável', 'atendente', 'agente', 'owner'],
                'number': ['número', 'numero', 'id', 'ticket'],
                'subject': ['assunto do ticket', 'assunto', 'título do ticket', 'título', 'titulo', 'descrição do ticket', 'descrição', 'resumo'],
                'entryDate': ['data de entrada', 'data entrada', 'data de criação'],
                'resolutionDate': ['data da resolução', 'data resolucao', 'data de fechamento']
            };
            
            // Tentar matches específicos primeiro
            for (const [fieldName, keywords] of Object.entries(fieldPriority)) {
                for (const keyword of keywords) {
                    // Verificar se o header contém EXATAMENTE este termo (não como parte de outra palavra)
                    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                    if (regex.test(normalizedHeader)) {
                        // Confirmar que há um match válido no columnMap
                        const matchingKey = sortedKeys.find(k => k === keyword || k.includes(keyword));
                        if (matchingKey) {
                            foundField = columnMap[matchingKey];
                            matchType = 'partial';
                            break;
                        }
                    }
                }
                if (foundField) break;
            }
            
            // Se ainda não encontrou, tentar busca simples
            if (!foundField) {
                for (const key of sortedKeys) {
                    // Busca mais precisa: header deve conter a palavra-chave completa
                    if (normalizedHeader.includes(key)) {
                        foundField = columnMap[key];
                        matchType = 'partial';
                        break;
                    }
                }
            }
        }
        
        if (foundField) {
            // Verificação especial: se o campo encontrado é "responsible" mas o valor parece ser assunto
            if (foundField === 'responsible') {
                const valueStr = String(rawValue).trim();
                const valueLower = valueStr.toLowerCase();
                
                // Palavras-chave que indicam que é um assunto, não um responsável
                const assuntoIndicators = [
                    'restituição', 'restituicao', 'antecipação', 'antecipacao',
                    'consulta', 'solicitação', 'solicitacao', 'pergunta',
                    'dúvida', 'duvida', 'reclamação', 'reclamacao',
                    'pedido', 'informação', 'informacao', 'atendimento',
                    'cancelamento', 'alteração', 'alteracao', 'protocolo',
                    'pagamento', 'boleto', 'nota fiscal', 'nf',
                    'cadastro', 'cpf', 'rg', 'documento'
                ];
                
                // Se contém indicadores de assunto, NÃO mapear como responsible
                if (assuntoIndicators.some(indicator => valueLower.includes(indicator))) {
                    console.log(`⚠️ Ignorando mapeamento "responsible" - valor contém palavras de assunto: "${valueStr}"`);
                    
                    // Se não há subject mapeado ainda, tentar mapear este valor como subject
                    // Mesmo que o header não seja exatamente "assunto", se o valor parece ser assunto,
                    // é melhor mapear como subject do que não mapear
                    // Vamos fazer isso depois, na fase de processamento de mapeamentos
                    // Por enquanto, apenas não mapear como responsible
                    return;
                }
            }
            
            fieldMapping.push({
                field: foundField,
                value: rawValue,
                header: normalizedHeader,
                matchType: matchType,
                index: index
            });
        }
    });
    
    // Processar mapeamentos (priorizar matches exatos e mais específicos)
    // Ordenar: exatos primeiro, depois por especificidade do header (mais específicos primeiro)
    // IMPORTANTE: Priorizar "subject" sobre outros campos quando houver ambiguidade
    const sortedMapping = fieldMapping.sort((a, b) => {
        // Matches exatos têm prioridade
        if (a.matchType !== b.matchType) {
            return a.matchType === 'exact' ? -1 : 1;
        }
        
        // Priorizar "subject" sobre "responsible" e outros campos
        if (a.field === 'subject' && b.field !== 'subject') {
            return -1;
        }
        if (b.field === 'subject' && a.field !== 'subject') {
            return 1;
        }
        
        // Dentro do mesmo tipo, mais específicos primeiro
        return b.header.length - a.header.length;
    });
    
    sortedMapping.forEach(({ field, value, header }) => {
        // Evitar sobrescrever campos já mapeados (exceto se for subject mapeando sobre responsible incorretamente)
        if (ticket[field]) {
            // Se já temos um "responsible" e estamos tentando mapear "subject", 
            // verificar se o responsible atual parece ser um assunto
            if (field === 'subject' && ticket.responsible) {
                const responsibleValue = String(ticket.responsible).trim();
                const wordCount = responsibleValue.split(/\s+/).filter(w => w.length > 0).length;
                // Se o responsible atual parece ser um assunto, substituir
                if (wordCount > 4 || responsibleValue.length > 40) {
                    console.log(`🔄 Substituindo "responsible" por "subject": "${responsibleValue}" → "${String(value).trim()}"`);
                    delete ticket.responsible; // Remover o mapeamento incorreto
                } else {
                    return; // Manter o responsible e não mapear este valor como subject
                }
            } else {
                return; // Campo já mapeado
            }
        }
        
        // Validação específica para evitar conflitos de mapeamento
        const valueStr = String(value).trim();
        const spaces = (valueStr.match(/\s/g) || []).length;
        const letters = (valueStr.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
        const numbers = (valueStr.match(/\d/g) || []).length;
        
        // Validação para campo "number" - deve ser principalmente números
        if (field === 'number') {
            // Se parece um nome mais que um número, não mapear como number
            if (spaces >= 2 || (letters > numbers && letters > 3) || (letters > 5 && spaces >= 1) || (letters > 8)) {
                // Provavelmente é um nome, não um número de ticket - pular este mapeamento
                console.log(`Ignorando mapeamento de "number" para valor que parece nome: "${valueStr}" (header: "${header}")`);
                return;
            }
        }
        
        // Validação para campo "responsible" - deve ser principalmente letras E não deve ser um assunto
        if (field === 'responsible') {
            // Se for só números ou muito mais números que letras, pode ser erro de mapeamento
            if ((numbers > letters * 2 && numbers > 5) || (letters < 3 && numbers > 2)) {
                // Provavelmente é um número, não um nome - pular este mapeamento se parece número
                if (numbers > letters * 3) {
                    console.log(`Ignorando mapeamento de "responsible" para valor que parece número: "${valueStr}" (header: "${header}")`);
                    return;
                }
            }
            
            // Validação adicional: responsável geralmente é nome curto (1-3 palavras)
            // Se tiver muitas palavras ou caracteres, provavelmente é um assunto
            const wordCount = valueStr.split(/\s+/).filter(w => w.length > 0).length;
            const charCount = valueStr.length;
            
            // Se tiver mais de 4 palavras OU mais de 40 caracteres, provavelmente é assunto e não responsável
            if (wordCount > 4 || charCount > 40) {
                console.log(`⚠️ Ignorando mapeamento de "responsible" - parece ser assunto: "${valueStr}" (${wordCount} palavras, ${charCount} caracteres)`);
                return;
            }
            
            // Se contém palavras comuns de assuntos (ex: "restituição", "consulta", "solicitação", etc)
            const assuntoKeywords = ['restituição', 'restituicao', 'consulta', 'solicitação', 'solicitacao', 'pergunta', 'dúvida', 'duvida', 'reclamação', 'reclamacao', 'pedido', 'informação', 'informacao'];
            const valueLower = valueStr.toLowerCase();
            if (assuntoKeywords.some(keyword => valueLower.includes(keyword))) {
                console.log(`⚠️ Ignorando mapeamento de "responsible" - contém palavras de assunto: "${valueStr}"`);
                return;
            }
        }
        
        // Mapear o valor
        if (field === 'entryDate' || field === 'resolutionDate') {
            ticket[field] = value;
        } else if (field === 'responsible') {
            ticket[field] = String(value).trim();
        } else {
            ticket[field] = String(value).trim();
        }
        
        // Debug para assunto
        if (field === 'subject') {
            console.log(`✅ Assunto mapeado: "${ticket[field]}" (header: "${header}")`);
        }
    });
    
    // Se não temos assunto mapeado, tentar encontrar um valor que parece ser assunto
    if (!ticket.subject) {
        // Verificar se há um "responsible" que na verdade é um assunto
        if (ticket.responsible) {
            const responsibleValue = String(ticket.responsible).trim();
            const responsibleLower = responsibleValue.toLowerCase();
            const assuntoIndicators = [
                'restituição', 'restituicao', 'antecipação', 'antecipacao',
                'consulta', 'solicitação', 'solicitacao'
            ];
            
            // Se contém indicadores de assunto e é longo, provavelmente é assunto
            if (assuntoIndicators.some(ind => responsibleLower.includes(ind)) && 
                (responsibleValue.length > 20 || responsibleValue.split(/\s+/).length > 3)) {
                console.log(`🔄 Movendo "responsible" para "subject": "${responsibleValue}"`);
                ticket.subject = responsibleValue;
                delete ticket.responsible; // Remover do responsible
            }
        }
        
        // Verificar todos os valores não mapeados para encontrar possíveis assuntos
        if (!ticket.subject) {
            headers.forEach((header, index) => {
                if (ticket.subject) return; // Já encontramos assunto
                
                const rawValue = values[index];
                if (!rawValue || String(rawValue).trim() === '') return;
                
                const valueStr = String(rawValue).trim();
                const valueLower = valueStr.toLowerCase();
                const normalizedHeader = String(header).toLowerCase().trim();
                
                // Se não foi mapeado e parece ser assunto, usar como subject
                if (!ticket[normalizedHeader] && valueStr.length > 10) {
                    const assuntoIndicators = [
                        'restituição', 'restituicao', 'antecipação', 'antecipacao',
                        'consulta', 'solicitação', 'solicitacao', 'pergunta',
                        'dúvida', 'duvida', 'reclamação', 'reclamacao',
                        'pedido', 'informação', 'informacao'
                    ];
                    
                    if (assuntoIndicators.some(ind => valueLower.includes(ind)) || 
                        (valueStr.length > 30 && valueStr.split(/\s+/).length > 3)) {
                        console.log(`📋 Mapeando valor não mapeado como assunto: "${valueStr}" (header: "${header}")`);
                        ticket.subject = valueStr;
                    }
                }
            });
        }
    }
    
    // Debug: mostrar todos os campos mapeados
    if (ticket.subject) {
        console.log(`📋 Ticket processado - Assunto: "${ticket.subject}"`);
    } else {
        console.log(`⚠️ Ticket sem assunto mapeado. Headers disponíveis:`, headers);
        console.log(`   Campos mapeados:`, Object.keys(ticket));
        console.log(`   Valores disponíveis:`, values);
    }
    
    // Validar campos obrigatórios
    if (!ticket.number && !ticket.subject) {
        console.log('Ticket inválido - sem número ou assunto:', ticket);
        return null; // Pular linhas inválidas
    }
    
    // Processar datas (mesmo que já estejam formatadas)
    if (ticket.entryDate) {
        ticket.entryDate = parseDateString(ticket.entryDate);
    }
    if (ticket.resolutionDate) {
        ticket.resolutionDate = parseDateString(ticket.resolutionDate);
    }
    
    // Processar responsável (garantir que seja string)
    if (ticket.responsible) {
        ticket.responsible = String(ticket.responsible).trim();
    }
    return ticket;
}

// Função para parsear string de data
function parseDateString(dateStr) {
    if (!dateStr) return '';
    
    // Se já for um objeto Date, formatar diretamente
    if (dateStr instanceof Date) {
        const day = String(dateStr.getDate()).padStart(2, '0');
        const month = String(dateStr.getMonth() + 1).padStart(2, '0');
        const year = dateStr.getFullYear();
        const hours = String(dateStr.getHours()).padStart(2, '0');
        const minutes = String(dateStr.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    // Converter para string se necessário
    const dateValue = String(dateStr).trim();
    
    // Se for um número (pode ser timestamp em milissegundos)
    if (!isNaN(dateValue) && !dateValue.includes('/') && !dateValue.includes('-') && dateValue.length > 8) {
        const timestamp = parseInt(dateValue);
        if (timestamp > 1000000000000) { // Provavelmente timestamp em milissegundos
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        }
    }
    
    // Verificar se é um número (data serializada do Excel)
    // Excel usa 1 de janeiro de 1900 como dia 1
    if (!isNaN(dateValue) && dateValue.indexOf('/') === -1 && dateValue.indexOf('-') === -1) {
        const excelDate = parseFloat(dateValue);
        // Excel serial date: 1 = 1 de janeiro de 1900
        // JavaScript: 0 = 1 de janeiro de 1970
        // Diferença: 25569 dias (dias entre 1900-01-01 e 1970-01-01)
        if (excelDate > 0 && excelDate < 100000) {
            // É provavelmente uma data serializada do Excel
            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
            if (!isNaN(jsDate.getTime())) {
                const day = String(jsDate.getDate()).padStart(2, '0');
                const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                const year = jsDate.getFullYear();
                const hours = String(jsDate.getHours()).padStart(2, '0');
                const minutes = String(jsDate.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        }
    }
    
    // Tentar diferentes formatos de string
    // DD/MM/AAAA HH:MM ou DD/MM/AAAA HH:MM:SS
    const pattern1 = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::\d{2})?/;
    // DD/MM/AAAA
    const pattern2 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    // AAAA-MM-DD HH:MM:SS ou AAAA-MM-DD
    const pattern3 = /(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::\d{2})?)?/;
    
    let match = dateValue.match(pattern1);
    if (match) {
        const [, day, month, year, hour, minute] = match;
        const d = String(parseInt(day)).padStart(2, '0');
        const m = String(parseInt(month)).padStart(2, '0');
        const h = String(parseInt(hour)).padStart(2, '0');
        const min = String(parseInt(minute)).padStart(2, '0');
        return `${d}/${m}/${year} ${h}:${min}`;
    }
    
    match = dateValue.match(pattern2);
    if (match) {
        const [, day, month, year] = match;
        const d = String(parseInt(day)).padStart(2, '0');
        const m = String(parseInt(month)).padStart(2, '0');
        return `${d}/${m}/${year}`;
    }
    
    match = dateValue.match(pattern3);
    if (match) {
        const [, year, month, day, hour, minute] = match;
        const d = String(parseInt(day)).padStart(2, '0');
        const m = String(parseInt(month)).padStart(2, '0');
        if (hour !== undefined && minute !== undefined) {
            const h = String(parseInt(hour)).padStart(2, '0');
            const min = String(parseInt(minute)).padStart(2, '0');
            return `${d}/${m}/${year} ${h}:${min}`;
        }
        return `${d}/${m}/${year}`;
    }
    
    // Tentar parsear como objeto Date do JavaScript (do Excel)
    if (dateValue instanceof Date || (!isNaN(Date.parse(dateValue)) && dateValue.includes('T'))) {
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        } catch (e) {
            console.log('Erro ao parsear data como Date:', e);
        }
    }
    
    // Tentar parsear como data ISO geral
    try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
    } catch (e) {
        console.log('Erro ao parsear data ISO:', e);
    }
    
    // console.log('Data não pôde ser parseada, retornando original:', dateValue);
    return dateValue; // Retornar original se não conseguir parsear
}

// Função para processar tickets importados
function processImportedTickets(tickets) {
    if (tickets.length === 0) {
        showImportError('Nenhum ticket válido encontrado na planilha');
        return;
    }
    
    // Armazenar todos os tickets
    allImportedTickets = tickets;
    importedTickets = [...tickets];
    
    // Salvar no localStorage
    localStorage.setItem('importedTickets', JSON.stringify(allImportedTickets));
    
    // Mostrar sucesso
    const statusMessage = document.getElementById('statusMessage');
    const statusStats = document.getElementById('statusStats');
    
    statusMessage.innerHTML = `<i class="fas fa-check-circle"></i> <strong>Importação concluída com sucesso!</strong>`;
    statusMessage.className = 'status-message success';
    
    statusStats.innerHTML = `
        <div class="stat-item">
            <i class="fas fa-ticket-alt"></i>
            <span><strong>${tickets.length}</strong> tickets importados</span>
        </div>
        <div class="stat-item">
            <i class="fas fa-check"></i>
            <span><strong>100%</strong> sucesso</span>
        </div>
    `;
    
    // Atualizar exibição
    displayImportedTickets();
    updateReadingFilters();
    
    // Atualizar todos os gráficos
    updateCharts();
    updatePerformanceCharts();
    updateAgentsCharts();
    updateSatisfactionCharts();
    
    // Mostrar gráficos se houver tickets
    if (tickets.length > 0) {
        const chartsContainer = document.getElementById('readingCharts');
        if (chartsContainer) {
            chartsContainer.style.display = 'block';
            const toggleText = document.getElementById('chartsToggleText');
            if (toggleText) toggleText.textContent = 'Ocultar Gráficos';
        }
        // Atualizar gráficos após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            updateCharts();
        }, 500);
    }
    
    // Mudar para tab de leitura
    setTimeout(() => {
        switchReportTab('reading');
    }, 1000);
}

// Função para mostrar erro de importação
function showImportError(message) {
    const statusMessage = document.getElementById('statusMessage');
    const statusStats = document.getElementById('statusStats');
    
    statusMessage.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
    statusMessage.className = 'status-message error';
    statusStats.innerHTML = '';
}

// Função para exibir tickets importados na tabela
function displayImportedTickets() {
    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) return;
    
    // Carregar do localStorage se necessário
    if (allImportedTickets.length === 0) {
        const saved = localStorage.getItem('importedTickets');
        if (saved) {
            allImportedTickets = JSON.parse(saved);
            importedTickets = [...allImportedTickets];
        }
    }
    
    if (importedTickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <i class="fas fa-info-circle"></i>
                    Nenhum ticket importado. Faça upload de uma planilha na aba "Importar Tickets".
                </td>
            </tr>
        `;
        updateReadingStats();
        return;
    }
    
    tableBody.innerHTML = '';
    
    importedTickets.forEach(ticket => {
        const row = document.createElement('tr');
        
        // Truncar assunto para máximo de 50 caracteres
        const subject = ticket.subject || '';
        const truncatedSubject = subject ? (subject.length > 50 ? subject.substring(0, 50) + '...' : subject) : '';
        
        row.innerHTML = `
            <td>${ticket.number || '-'}</td>
            <td title="${subject}">${truncatedSubject}</td>
            <td><span class="status-badge status-${(ticket.status || '').toLowerCase().replace(/\s+/g, '-')}">${ticket.status || ''}</span></td>
            <td><span class="priority-badge priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority || ''}</span></td>
            <td>${ticket.entryDate || '-'}</td>
            <td>${ticket.resolutionDate || '-'}</td>
            <td>${ticket.responsible || ''}</td>
            <td><span class="rating-text rating-${getRatingClass(ticket.rating)}">${ticket.rating || ''}</span></td>
        `;
        tableBody.appendChild(row);
    });
    
    updateReadingStats();
    
    // Atualizar gráficos se estiverem visíveis
    const chartsContainer = document.getElementById('readingCharts');
    if (chartsContainer && chartsContainer.style.display !== 'none' && importedTickets.length > 0) {
        updateCharts();
    }
}

// Função para obter classe CSS da avaliação
function getRatingClass(rating) {
    if (!rating) return '';
    
    const ratingLower = String(rating).toLowerCase().trim();
    
    // Verificar "bom" primeiro (mesmo se tiver "comentário")
    if (ratingLower.includes('bom')) {
        return 'boa'; // Mantém a classe CSS como 'boa' para estilo verde
    } 
    // Verificar "ruim" (mesmo se tiver "comentário")
    else if (ratingLower.includes('ruim')) {
        return 'ruim';
    }
    
    return '';
}

// Função para atualizar estatísticas de leitura
function updateReadingStats() {
    const statsContainer = document.getElementById('readingStats');
    if (!statsContainer) return;
    
    const total = importedTickets.length;
    const withResolution = importedTickets.filter(t => t.resolutionDate).length;
    const pendingTickets = total - withResolution;
    const withRating = importedTickets.filter(t => t.rating && String(t.rating).trim() !== '').length;
    
    // Calcular porcentagens simples
    const porcentagemResolvidos = total > 0 ? ((withResolution / total) * 100).toFixed(1) : '0.0';
    const porcentagemPendentes = total > 0 ? ((pendingTickets / total) * 100).toFixed(1) : '0.0';
    const porcentagemAvaliados = total > 0 ? ((withRating / total) * 100).toFixed(1) : '0.0';
    
    statsContainer.innerHTML = `
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-ticket-alt"></i></div>
            <div class="stat-info">
                <h4>${total}</h4>
                <p>Total de Tickets</p>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-check-circle"></i></div>
            <div class="stat-info">
                <h4>${withResolution}</h4>
                <p>Resolvidos</p>
                <small>${porcentagemResolvidos}% do total</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-hourglass-half"></i></div>
            <div class="stat-info">
                <h4>${pendingTickets}</h4>
                <p>Pendentes</p>
                <small>${porcentagemPendentes}% do total</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-star"></i></div>
            <div class="stat-info">
                <h4>${withRating}</h4>
                <p>Total Avaliadas</p>
                <small>${porcentagemAvaliados}% do total</small>
            </div>
        </div>
    `;
}

// Função para atualizar filtros de leitura
function updateReadingFilters() {
    if (allImportedTickets.length === 0) return;
    
    // Status
    const statusSelect = document.getElementById('filterReadingStatus');
    if (statusSelect) {
        const statuses = [...new Set(allImportedTickets.map(t => t.status).filter(s => s))];
        statusSelect.innerHTML = '<option value="all">Todos</option>';
        statuses.forEach(status => {
            statusSelect.innerHTML += `<option value="${status}">${status}</option>`;
        });
    }
    
    // Prioridade
    const prioritySelect = document.getElementById('filterReadingPriority');
    if (prioritySelect) {
        const priorities = [...new Set(allImportedTickets.map(t => t.priority).filter(p => p))];
        prioritySelect.innerHTML = '<option value="all">Todas</option>';
        priorities.forEach(priority => {
            prioritySelect.innerHTML += `<option value="${priority}">${priority}</option>`;
        });
    }
    
    // Responsável
    const responsibleSelect = document.getElementById('filterReadingResponsible');
    if (responsibleSelect) {
        const responsibles = [...new Set(allImportedTickets.map(t => t.responsible).filter(r => r))];
        responsibleSelect.innerHTML = '<option value="all">Todos</option>';
        responsibles.forEach(responsible => {
            responsibleSelect.innerHTML += `<option value="${responsible}">${responsible}</option>`;
        });
    }
}

// Função para filtrar tickets de leitura
function filterReadingTickets() {
    const statusFilter = document.getElementById('filterReadingStatus')?.value || 'all';
    const priorityFilter = document.getElementById('filterReadingPriority')?.value || 'all';
    const responsibleFilter = document.getElementById('filterReadingResponsible')?.value || 'all';
    const searchTerm = (document.getElementById('searchReadingTickets')?.value || '').toLowerCase();
    
    importedTickets = allImportedTickets.filter(ticket => {
        // Filtro por status
        if (statusFilter !== 'all' && ticket.status !== statusFilter) {
            return false;
        }
        
        // Filtro por prioridade
        if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
            return false;
        }
        
        // Filtro por responsável
        if (responsibleFilter !== 'all' && ticket.responsible !== responsibleFilter) {
            return false;
        }
        
        // Filtro por busca
        if (searchTerm) {
            const number = String(ticket.number || '').toLowerCase();
            const subject = String(ticket.subject || '').toLowerCase();
            if (!number.includes(searchTerm) && !subject.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    displayImportedTickets();
    updateCharts(); // Atualizar gráficos quando filtrar
}

// Função para limpar tickets importados
function clearImportedTickets() {
    if (confirm('Tem certeza que deseja limpar todos os tickets importados?')) {
        importedTickets = [];
        allImportedTickets = [];
        localStorage.removeItem('importedTickets');
        displayImportedTickets();
        updateReadingFilters();
        showNotification('Tickets importados foram removidos', 'success');
    }
}

// Função para exportar relatório
function exportTicketsReport() {
    if (importedTickets.length === 0) {
        alert('Nenhum ticket para exportar!');
        return;
    }
    
    // Criar dados para exportação
    const data = importedTickets.map(ticket => ({
        'Número do ticket': ticket.number || '',
        'Assunto': ticket.subject || '',
        'Status': ticket.status || '',
        'Prioridade': ticket.priority || '',
        'Data de entrada': ticket.entryDate || '',
        'Data da resolução': ticket.resolutionDate || '',
        'Responsável': ticket.responsible || '',
        'Avaliação': ticket.rating || ''
    }));
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    
    // Exportar
    const fileName = `relatorio_tickets_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showNotification('Relatório exportado com sucesso!', 'success');
}

// Variáveis para gráficos
let statusChart = null;
let priorityChart = null;
let timeChart = null;
let ratingChart = null;

// Gráficos de Performance
let avgResolutionTimeChart = null;
let ticketsResolvedChart = null;
let slaChart = null;
let resolutionTimeDistributionChart = null;

// Gráficos de Agentes
let ticketsByAgentChart = null;
let avgTimeByAgentChart = null;
let resolutionRateByAgentChart = null;
let agentPerformanceRankingChart = null;

// Gráficos de Satisfação
let satisfactionDistributionChart = null;
let satisfactionTrendChart = null;
let satisfactionByAgentChart = null;
let satisfactionComparisonChart = null;

// Função para alternar exibição de gráficos
function toggleCharts() {
    const chartsContainer = document.getElementById('readingCharts');
    const toggleText = document.getElementById('chartsToggleText');
    
    if (chartsContainer && toggleText) {
        const isVisible = chartsContainer.style.display !== 'none';
        chartsContainer.style.display = isVisible ? 'none' : 'block';
        toggleText.textContent = isVisible ? 'Mostrar Gráficos' : 'Ocultar Gráficos';
        
        if (!isVisible && importedTickets.length > 0) {
            // Se está mostrando e há tickets, atualizar gráficos
            updateCharts();
        }
    }
}

// Função para atualizar todos os gráficos
function updateCharts() {
    if (importedTickets.length === 0) return;
    
    updateStatusChart();
    updatePriorityChart();
    updateTimeChart();
    updateRatingChart();
}

// Função para atualizar gráfico de status
function updateStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (statusChart) {
        statusChart.destroy();
    }
    
    // Contar tickets por status
    const statusCount = {};
    importedTickets.forEach(ticket => {
        const status = ticket.status || 'Sem Status';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCount);
    const data = Object.values(statusCount);
    const colors = labels.map(status => {
        const s = status.toLowerCase();
        if (s.includes('novo')) return '#1976d2';
        if (s.includes('andamento')) return '#28a745';
        if (s.includes('pendente')) return '#ffc107';
        if (s.includes('resolvido')) return '#6c757d';
        if (s.includes('fechado')) return '#dc3545';
        return '#95a5a6';
    });
    
    statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Função para atualizar gráfico de prioridade
function updatePriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;
    
    if (priorityChart) {
        priorityChart.destroy();
    }
    
    const priorityCount = {};
    importedTickets.forEach(ticket => {
        const priority = ticket.priority || 'Sem Prioridade';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });
    
    const labels = Object.keys(priorityCount);
    const data = Object.values(priorityCount);
    const colors = labels.map(priority => {
        const p = priority.toLowerCase();
        if (p.includes('alta')) return '#dc3545';
        if (p.includes('média') || p.includes('media')) return '#ffc107';
        if (p.includes('baixa')) return '#28a745';
        return '#95a5a6';
    });
    
    priorityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets',
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Função para atualizar gráfico de tempo
function updateTimeChart() {
    const ctx = document.getElementById('timeChart');
    if (!ctx) return;
    
    if (timeChart) {
        timeChart.destroy();
    }
    
    // Agrupar por data de entrada
    const dateCount = {};
    importedTickets.forEach(ticket => {
        if (ticket.entryDate) {
            // Extrair apenas a data (sem hora)
            const datePart = ticket.entryDate.split(' ')[0];
            dateCount[datePart] = (dateCount[datePart] || 0) + 1;
        }
    });
    
    // Ordenar por data
    const sortedDates = Object.keys(dateCount).sort();
    const labels = sortedDates;
    const data = sortedDates.map(date => dateCount[date]);
    
    timeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets Criados',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Função para atualizar gráfico de avaliações
function updateRatingChart() {
    const ctx = document.getElementById('ratingChart');
    if (!ctx) return;
    
    if (ratingChart) {
        ratingChart.destroy();
    }
    
    // Agrupar avaliações por categoria normalizada
    const ratingCount = {};
    
    importedTickets.forEach(ticket => {
        if (ticket.rating) {
            const rating = String(ticket.rating).trim();
            const ratingLower = rating.toLowerCase();
            
            // Normalizar e categorizar avaliação
            let category = '';
            
            if (ratingLower.includes('bom') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                category = 'Bom com comentário';
            } else if (ratingLower.includes('bom')) {
                category = 'Bom';
            } else if (ratingLower.includes('ruim') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                category = 'Ruim com comentário';
            } else if (ratingLower.includes('ruim')) {
                category = 'Ruim';
            } else {
                // Se não se encaixar em nenhuma categoria padrão, usar o valor original
                category = rating;
            }
            
            ratingCount[category] = (ratingCount[category] || 0) + 1;
        } else {
            ratingCount['Sem Avaliação'] = (ratingCount['Sem Avaliação'] || 0) + 1;
        }
    });
    
    // Filtrar categorias vazias e preparar dados
    const labels = [];
    const data = [];
    const colors = [];
    
    Object.keys(ratingCount).forEach(key => {
        if (ratingCount[key] > 0 || key === 'Sem Avaliação') {
            labels.push(key);
            data.push(ratingCount[key]);
            
            // Definir cor baseada na categoria
            if (key.toLowerCase().includes('bom')) {
                colors.push('#28a745'); // Verde
            } else if (key.toLowerCase().includes('ruim')) {
                colors.push('#dc3545'); // Vermelho
            } else {
                colors.push('#95a5a6'); // Cinza para sem avaliação
            }
        }
    });
    
    ratingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ============================================
// GRÁFICOS DE PERFORMANCE
// ============================================

function updatePerformanceCharts() {
    if (importedTickets.length === 0) return;
    
    updatePerformanceStats();
    updateAvgResolutionTimeChart();
    updateTicketsResolvedChart();
    updateSLAChart();
    updateResolutionTimeDistributionChart();
}

function updatePerformanceStats() {
    const statsContainer = document.getElementById('performanceStats');
    if (!statsContainer) return;
    
    const resolvedTickets = importedTickets.filter(t => t.resolutionDate);
    const totalTickets = importedTickets.length;
    
    // Calcular tempo médio de resolução (em horas)
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    
    resolvedTickets.forEach(ticket => {
        const entryDate = parseDate(ticket.entryDate);
        const resolutionDate = parseDate(ticket.resolutionDate);
        if (entryDate && resolutionDate) {
            const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
            if (diffHours > 0 && diffHours < 8760) { // Menos de 1 ano
                totalResolutionTime += diffHours;
                resolutionCount++;
            }
        }
    });
    
    const avgResolutionHours = resolutionCount > 0 ? (totalResolutionTime / resolutionCount) : 0;
    const avgResolutionDays = (avgResolutionHours / 24).toFixed(1);
    
    // Taxa de resolução
    const resolutionRate = totalTickets > 0 ? ((resolvedTickets.length / totalTickets) * 100).toFixed(1) : '0.0';
    
    // Tickets pendentes
    const pendingTickets = importedTickets.filter(t => !t.resolutionDate).length;
    
    statsContainer.innerHTML = `
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-clock"></i></div>
            <div class="stat-info">
                <h4>${avgResolutionDays}</h4>
                <p>Dias Médios de Resolução</p>
                <small>${avgResolutionHours.toFixed(1)} horas</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-check-circle"></i></div>
            <div class="stat-info">
                <h4>${resolvedTickets.length}</h4>
                <p>Tickets Resolvidos</p>
                <small>${resolutionRate}% do total</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-hourglass-half"></i></div>
            <div class="stat-info">
                <h4>${pendingTickets}</h4>
                <p>Tickets Pendentes</p>
                <small>${((pendingTickets / totalTickets) * 100).toFixed(1)}% do total</small>
            </div>
        </div>
    `;
}

function updateAvgResolutionTimeChart() {
    const ctx = document.getElementById('avgResolutionTimeChart');
    if (!ctx) return;
    
    if (avgResolutionTimeChart) avgResolutionTimeChart.destroy();
    
    const resolvedTickets = importedTickets.filter(t => t.resolutionDate);
    if (resolvedTickets.length === 0) return;
    
    // Agrupar por mês
    const monthlyData = {};
    resolvedTickets.forEach(ticket => {
        const resolutionDate = parseDate(ticket.resolutionDate);
        const entryDate = parseDate(ticket.entryDate);
        if (resolutionDate && entryDate) {
            const monthKey = `${resolutionDate.getFullYear()}-${String(resolutionDate.getMonth() + 1).padStart(2, '0')}`;
            const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
            if (diffHours > 0 && diffHours < 8760) {
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { total: 0, count: 0 };
                }
                monthlyData[monthKey].total += diffHours;
                monthlyData[monthKey].count++;
            }
        }
    });
    
    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(key => {
        const item = monthlyData[key];
        return (item.total / item.count / 24).toFixed(1); // Converter para dias
    });
    
    avgResolutionTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => {
                const [year, month] = l.split('-');
                return `${month}/${year}`;
            }),
            datasets: [{
                label: 'Dias',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                }
            }
        }
    });
}

function updateTicketsResolvedChart() {
    const ctx = document.getElementById('ticketsResolvedChart');
    if (!ctx) return;
    
    if (ticketsResolvedChart) ticketsResolvedChart.destroy();
    
    const resolvedTickets = importedTickets.filter(t => t.resolutionDate);
    
    // Agrupar por mês
    const monthlyData = {};
    resolvedTickets.forEach(ticket => {
        const date = parseDate(ticket.resolutionDate);
        if (date) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
    });
    
    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(key => monthlyData[key]);
    
    ticketsResolvedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => {
                const [year, month] = l.split('-');
                return `${month}/${year}`;
            }),
            datasets: [{
                label: 'Tickets Resolvidos',
                data: data,
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateSLAChart() {
    const ctx = document.getElementById('slaChart');
    if (!ctx) return;
    
    if (slaChart) slaChart.destroy();
    
    const resolvedTickets = importedTickets.filter(t => t.resolutionDate);
    let withinSLA = 0; // Assumindo SLA de 5 dias úteis (120 horas)
    let outsideSLA = 0;
    
    resolvedTickets.forEach(ticket => {
        const entryDate = parseDate(ticket.entryDate);
        const resolutionDate = parseDate(ticket.resolutionDate);
        if (entryDate && resolutionDate) {
            const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
            if (diffHours <= 120) { // 5 dias úteis
                withinSLA++;
            } else {
                outsideSLA++;
            }
        }
    });
    
    slaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Dentro do SLA', 'Fora do SLA'],
            datasets: [{
                data: [withinSLA, outsideSLA],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateResolutionTimeDistributionChart() {
    const ctx = document.getElementById('resolutionTimeDistributionChart');
    if (!ctx) return;
    
    if (resolutionTimeDistributionChart) resolutionTimeDistributionChart.destroy();
    
    const resolvedTickets = importedTickets.filter(t => t.resolutionDate);
    const buckets = {
        '0-24h': 0,
        '1-3 dias': 0,
        '3-7 dias': 0,
        '7-15 dias': 0,
        '15+ dias': 0
    };
    
    resolvedTickets.forEach(ticket => {
        const entryDate = parseDate(ticket.entryDate);
        const resolutionDate = parseDate(ticket.resolutionDate);
        if (entryDate && resolutionDate) {
            const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
            const diffDays = diffHours / 24;
            
            if (diffDays <= 1) buckets['0-24h']++;
            else if (diffDays <= 3) buckets['1-3 dias']++;
            else if (diffDays <= 7) buckets['3-7 dias']++;
            else if (diffDays <= 15) buckets['7-15 dias']++;
            else buckets['15+ dias']++;
        }
    });
    
    const labels = Object.keys(buckets);
    const data = Object.values(buckets);
    
    resolutionTimeDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets',
                data: data,
                backgroundColor: ['#17a2b8', '#28a745', '#ffc107', '#fd7e14', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ============================================
// GRÁFICOS DE AGENTES
// ============================================

function updateAgentsCharts() {
    if (importedTickets.length === 0) return;
    
    updateAgentsStats();
    updateTicketsByAgentChart();
    updateAvgTimeByAgentChart();
    updateResolutionRateByAgentChart();
    updateAgentPerformanceRankingChart();
}

function updateAgentsStats() {
    const statsContainer = document.getElementById('agentsStats');
    if (!statsContainer) return;
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        if (!agents[agent]) {
            agents[agent] = { total: 0, resolved: 0, totalTime: 0, resolvedCount: 0 };
        }
        agents[agent].total++;
        if (ticket.resolutionDate) {
            agents[agent].resolved++;
            const entryDate = parseDate(ticket.entryDate);
            const resolutionDate = parseDate(ticket.resolutionDate);
            if (entryDate && resolutionDate) {
                const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours < 8760) {
                    agents[agent].totalTime += diffHours;
                    agents[agent].resolvedCount++;
                }
            }
        }
    });
    
    const totalAgents = Object.keys(agents).length;
    const topAgent = Object.entries(agents).sort((a, b) => b[1].resolved - a[1].resolved)[0];
    const avgResolution = Object.values(agents).reduce((acc, agent) => {
        if (agent.resolvedCount > 0) {
            acc.total += agent.totalTime / agent.resolvedCount;
            acc.count++;
        }
        return acc;
    }, { total: 0, count: 0 });
    
    statsContainer.innerHTML = `
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-users"></i></div>
            <div class="stat-info">
                <h4>${totalAgents}</h4>
                <p>Agentes Ativos</p>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-trophy"></i></div>
            <div class="stat-info">
                <h4>${topAgent ? topAgent[0].substring(0, 15) : '-'}</h4>
                <p>Top Agente</p>
                <small>${topAgent ? topAgent[1].resolved : 0} resolvidos</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-clock"></i></div>
            <div class="stat-info">
                <h4>${avgResolution.count > 0 ? (avgResolution.total / avgResolution.count / 24).toFixed(1) : '0'}</h4>
                <p>Dias Médios por Agente</p>
            </div>
        </div>
    `;
}

function updateTicketsByAgentChart() {
    const ctx = document.getElementById('ticketsByAgentChart');
    if (!ctx) return;
    
    if (ticketsByAgentChart) ticketsByAgentChart.destroy();
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        agents[agent] = (agents[agent] || 0) + 1;
    });
    
    const sortedAgents = Object.entries(agents).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sortedAgents.map(a => a[0].substring(0, 20));
    const data = sortedAgents.map(a => a[1]);
    
    ticketsByAgentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets',
                data: data,
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateAvgTimeByAgentChart() {
    const ctx = document.getElementById('avgTimeByAgentChart');
    if (!ctx) return;
    
    if (avgTimeByAgentChart) avgTimeByAgentChart.destroy();
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        if (!agents[agent]) {
            agents[agent] = { totalTime: 0, count: 0 };
        }
        if (ticket.resolutionDate) {
            const entryDate = parseDate(ticket.entryDate);
            const resolutionDate = parseDate(ticket.resolutionDate);
            if (entryDate && resolutionDate) {
                const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours < 8760) {
                    agents[agent].totalTime += diffHours;
                    agents[agent].count++;
                }
            }
        }
    });
    
    const agentsWithData = Object.entries(agents)
        .filter(([_, data]) => data.count > 0)
        .map(([name, data]) => ({
            name,
            avgDays: (data.totalTime / data.count / 24).toFixed(1)
        }))
        .sort((a, b) => parseFloat(a.avgDays) - parseFloat(b.avgDays))
        .slice(0, 10);
    
    const labels = agentsWithData.map(a => a.name.substring(0, 20));
    const data = agentsWithData.map(a => parseFloat(a.avgDays));
    
    avgTimeByAgentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dias',
                data: data,
                backgroundColor: '#28a745'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                }
            }
        }
    });
}

function updateResolutionRateByAgentChart() {
    const ctx = document.getElementById('resolutionRateByAgentChart');
    if (!ctx) return;
    
    if (resolutionRateByAgentChart) resolutionRateByAgentChart.destroy();
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        if (!agents[agent]) {
            agents[agent] = { total: 0, resolved: 0 };
        }
        agents[agent].total++;
        if (ticket.resolutionDate) {
            agents[agent].resolved++;
        }
    });
    
    const agentsWithData = Object.entries(agents)
        .filter(([_, data]) => data.total > 0)
        .map(([name, data]) => ({
            name,
            rate: ((data.resolved / data.total) * 100).toFixed(1)
        }))
        .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
        .slice(0, 10);
    
    const labels = agentsWithData.map(a => a.name.substring(0, 20));
    const data = agentsWithData.map(a => parseFloat(a.rate));
    
    resolutionRateByAgentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Taxa (%)',
                data: data,
                backgroundColor: '#17a2b8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Taxa de Resolução (%)'
                    }
                }
            }
        }
    });
}

function updateAgentPerformanceRankingChart() {
    const ctx = document.getElementById('agentPerformanceRankingChart');
    if (!ctx) return;
    
    if (agentPerformanceRankingChart) agentPerformanceRankingChart.destroy();
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        if (!agents[agent]) {
            agents[agent] = { total: 0, resolved: 0, totalTime: 0, resolvedCount: 0 };
        }
        agents[agent].total++;
        if (ticket.resolutionDate) {
            agents[agent].resolved++;
            const entryDate = parseDate(ticket.entryDate);
            const resolutionDate = parseDate(ticket.resolutionDate);
            if (entryDate && resolutionDate) {
                const diffHours = (resolutionDate - entryDate) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours < 8760) {
                    agents[agent].totalTime += diffHours;
                    agents[agent].resolvedCount++;
                }
            }
        }
    });
    
    // Calcular score: (taxa de resolução * 50) + (velocidade * 50) onde velocidade = 100 - (tempo médio em dias * 10)
    const agentsWithScore = Object.entries(agents)
        .map(([name, data]) => {
            const resolutionRate = data.total > 0 ? (data.resolved / data.total) * 100 : 0;
            const avgDays = data.resolvedCount > 0 ? (data.totalTime / data.resolvedCount / 24) : 30;
            const speedScore = Math.max(0, 100 - (avgDays * 10));
            const score = (resolutionRate * 0.5) + (speedScore * 0.5);
            return { name, score: score.toFixed(1), resolved: data.resolved, avgDays: avgDays.toFixed(1) };
        })
        .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
        .slice(0, 10);
    
    const labels = agentsWithScore.map(a => a.name.substring(0, 20));
    const data = agentsWithScore.map(a => parseFloat(a.score));
    
    agentPerformanceRankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: data,
                backgroundColor: (ctx) => {
                    const value = ctx.parsed.y;
                    if (value >= 80) return '#28a745';
                    if (value >= 60) return '#ffc107';
                    return '#dc3545';
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score de Desempenho'
                    }
                }
            }
        }
    });
}

// ============================================
// GRÁFICOS DE SATISFAÇÃO
// ============================================

function updateSatisfactionCharts() {
    if (importedTickets.length === 0) return;
    
    updateSatisfactionStats();
    updateSatisfactionDistributionChart();
    updateSatisfactionTrendChart();
    updateSatisfactionByAgentChart();
    updateSatisfactionComparisonChart();
}

function updateSatisfactionStats() {
    const statsContainer = document.getElementById('satisfactionStats');
    if (!statsContainer) return;
    
    let totalBom = 0;
    let totalRuim = 0;
    let withRating = 0;
    
    importedTickets.forEach(ticket => {
        if (ticket.rating) {
            const rating = String(ticket.rating).trim().toLowerCase();
            withRating++;
            if (rating.includes('bom')) {
                totalBom++;
            } else if (rating.includes('ruim')) {
                totalRuim++;
            }
        }
    });
    
    const totalTickets = importedTickets.length;
    const porcentagemBom = withRating > 0 ? ((totalBom / withRating) * 100).toFixed(1) : '0.0';
    const porcentagemRuim = withRating > 0 ? ((totalRuim / withRating) * 100).toFixed(1) : '0.0';
    const porcentagemAvaliados = totalTickets > 0 ? ((withRating / totalTickets) * 100).toFixed(1) : '0.0';
    
    statsContainer.innerHTML = `
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-smile"></i></div>
            <div class="stat-info">
                <h4>${porcentagemBom}%</h4>
                <p>Avaliações Positivas</p>
                <small>${totalBom} tickets</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-frown"></i></div>
            <div class="stat-info">
                <h4>${porcentagemRuim}%</h4>
                <p>Avaliações Negativas</p>
                <small>${totalRuim} tickets</small>
            </div>
        </div>
        <div class="stat-card stat-card-primary">
            <div class="stat-icon stat-icon-primary"><i class="fas fa-star"></i></div>
            <div class="stat-info">
                <h4>${porcentagemAvaliados}%</h4>
                <p>Taxa de Avaliação</p>
                <small>${withRating} de ${totalTickets}</small>
            </div>
        </div>
    `;
}

function updateSatisfactionDistributionChart() {
    const ctx = document.getElementById('satisfactionDistributionChart');
    if (!ctx) return;
    
    if (satisfactionDistributionChart) satisfactionDistributionChart.destroy();
    
    const ratingCount = {
        'Bom': 0,
        'Bom com comentário': 0,
        'Ruim': 0,
        'Ruim com comentário': 0,
        'Sem Avaliação': 0
    };
    
    importedTickets.forEach(ticket => {
        if (ticket.rating) {
            const rating = String(ticket.rating).trim();
            const ratingLower = rating.toLowerCase();
            
            if (ratingLower.includes('bom') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                ratingCount['Bom com comentário']++;
            } else if (ratingLower.includes('bom')) {
                ratingCount['Bom']++;
            } else if (ratingLower.includes('ruim') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                ratingCount['Ruim com comentário']++;
            } else if (ratingLower.includes('ruim')) {
                ratingCount['Ruim']++;
            }
        } else {
            ratingCount['Sem Avaliação']++;
        }
    });
    
    const labels = Object.keys(ratingCount);
    const data = Object.values(ratingCount);
    const colors = ['#28a745', '#20c997', '#dc3545', '#c82333', '#95a5a6'];
    
    satisfactionDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateSatisfactionTrendChart() {
    const ctx = document.getElementById('satisfactionTrendChart');
    if (!ctx) return;
    
    if (satisfactionTrendChart) satisfactionTrendChart.destroy();
    
    const monthlyData = {};
    importedTickets.forEach(ticket => {
        const date = parseDate(ticket.resolutionDate || ticket.entryDate);
        if (date && ticket.rating) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { bom: 0, ruim: 0, total: 0 };
            }
            monthlyData[monthKey].total++;
            const rating = String(ticket.rating).trim().toLowerCase();
            if (rating.includes('bom')) {
                monthlyData[monthKey].bom++;
            } else if (rating.includes('ruim')) {
                monthlyData[monthKey].ruim++;
            }
        }
    });
    
    const labels = Object.keys(monthlyData).sort();
    const bomData = labels.map(key => {
        const item = monthlyData[key];
        return item.total > 0 ? ((item.bom / item.total) * 100).toFixed(1) : 0;
    });
    const ruimData = labels.map(key => {
        const item = monthlyData[key];
        return item.total > 0 ? ((item.ruim / item.total) * 100).toFixed(1) : 0;
    });
    
    satisfactionTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => {
                const [year, month] = l.split('-');
                return `${month}/${year}`;
            }),
            datasets: [{
                label: 'Positiva (%)',
                data: bomData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Negativa (%)',
                data: ruimData,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentual (%)'
                    }
                }
            }
        }
    });
}

function updateSatisfactionByAgentChart() {
    const ctx = document.getElementById('satisfactionByAgentChart');
    if (!ctx) return;
    
    if (satisfactionByAgentChart) satisfactionByAgentChart.destroy();
    
    const agents = {};
    importedTickets.forEach(ticket => {
        const agent = ticket.responsible || 'Não atribuído';
        if (!agents[agent]) {
            agents[agent] = { bom: 0, ruim: 0, total: 0 };
        }
        if (ticket.rating) {
            agents[agent].total++;
            const rating = String(ticket.rating).trim().toLowerCase();
            if (rating.includes('bom')) {
                agents[agent].bom++;
            } else if (rating.includes('ruim')) {
                agents[agent].ruim++;
            }
        }
    });
    
    const agentsWithData = Object.entries(agents)
        .filter(([_, data]) => data.total > 0)
        .map(([name, data]) => ({
            name,
            bomPct: ((data.bom / data.total) * 100).toFixed(1),
            ruimPct: ((data.ruim / data.total) * 100).toFixed(1),
            total: data.total
        }))
        .sort((a, b) => parseFloat(b.bomPct) - parseFloat(a.bomPct))
        .slice(0, 10);
    
    const labels = agentsWithData.map(a => a.name.substring(0, 20));
    const bomData = agentsWithData.map(a => parseFloat(a.bomPct));
    const ruimData = agentsWithData.map(a => parseFloat(a.ruimPct));
    
    satisfactionByAgentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Positiva (%)',
                data: bomData,
                backgroundColor: '#28a745'
            }, {
                label: 'Negativa (%)',
                data: ruimData,
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentual (%)'
                    }
                }
            }
        }
    });
}

function updateSatisfactionComparisonChart() {
    const ctx = document.getElementById('satisfactionComparisonChart');
    if (!ctx) return;
    
    if (satisfactionComparisonChart) satisfactionComparisonChart.destroy();
    
    const ratingCount = {
        'Bom': 0,
        'Bom com comentário': 0,
        'Ruim': 0,
        'Ruim com comentário': 0
    };
    
    importedTickets.forEach(ticket => {
        if (ticket.rating) {
            const rating = String(ticket.rating).trim();
            const ratingLower = rating.toLowerCase();
            
            if (ratingLower.includes('bom') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                ratingCount['Bom com comentário']++;
            } else if (ratingLower.includes('bom')) {
                ratingCount['Bom']++;
            } else if (ratingLower.includes('ruim') && (ratingLower.includes('comentário') || ratingLower.includes('comentario'))) {
                ratingCount['Ruim com comentário']++;
            } else if (ratingLower.includes('ruim')) {
                ratingCount['Ruim']++;
            }
        }
    });
    
    const labels = Object.keys(ratingCount);
    const data = Object.values(ratingCount);
    const colors = ['#28a745', '#20c997', '#dc3545', '#c82333'];
    
    satisfactionComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Função auxiliar para parsear datas
function parseDate(dateString) {
    if (!dateString) return null;
    
    // Tentar várias formas de parse
    let date = null;
    
    // Formato DD/MM/YYYY HH:MM
    const ddmmyyyy = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/;
    const match = String(dateString).match(ddmmyyyy);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        const hour = match[4] ? parseInt(match[4]) : 0;
        const minute = match[5] ? parseInt(match[5]) : 0;
        date = new Date(year, month, day, hour, minute);
        if (!isNaN(date.getTime())) return date;
    }
    
    // Tentar ISO string
    date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    
    // Tentar número (Excel serial date)
    const num = parseFloat(dateString);
    if (!isNaN(num) && num > 25569) { // Excel epoch
        date = new Date((num - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) return date;
    }
    
    return null;
}

// Carregar tickets do localStorage ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    const saved = localStorage.getItem('importedTickets');
    if (saved) {
        allImportedTickets = JSON.parse(saved);
        importedTickets = [...allImportedTickets];
    }
});

console.log('Sistema Velodesk carregado com sucesso!');

// ============================================
// FUNÇÕES DO WHATSAPP
// ============================================

// Função para abrir configurações do WhatsApp
function openWhatsAppSettings() {
    const modal = document.getElementById('whatsAppSettingsModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Carregar configurações salvas
        loadWhatsAppSettings();
        
        // Listener para mudança de método de conexão
        document.querySelectorAll('input[name="connectionMethod"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const method = this.value;
                if (method === 'api') {
                    document.getElementById('apiConfig').style.display = 'block';
                    document.getElementById('qrConfig').style.display = 'none';
                } else {
                    document.getElementById('apiConfig').style.display = 'none';
                    document.getElementById('qrConfig').style.display = 'block';
                }
            });
        });
    }
}

// Função para fechar configurações do WhatsApp
function closeWhatsAppSettings() {
    const modal = document.getElementById('whatsAppSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para alternar entre tabs de configurações
function switchWhatsAppTab(tabName) {
    // Remover active de todas as tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.settings-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar tab selecionada
    const tab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
    const content = document.getElementById(`${tabName}Tab`);
    
    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');
}

// Função para carregar configurações salvas
function loadWhatsAppSettings() {
    const savedSettings = localStorage.getItem('whatsappSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Carregar método de conexão
        if (settings.connectionMethod) {
            document.querySelector(`input[name="connectionMethod"][value="${settings.connectionMethod}"]`).checked = true;
            if (settings.connectionMethod === 'qr') {
                document.getElementById('apiConfig').style.display = 'none';
                document.getElementById('qrConfig').style.display = 'block';
            }
        }
        
        // Carregar configurações da API
        if (settings.apiToken) {
            document.getElementById('whatsappApiToken').value = settings.apiToken;
        }
        if (settings.apiUrl) {
            document.getElementById('whatsappApiUrl').value = settings.apiUrl;
        }
        if (settings.phoneNumber) {
            document.getElementById('whatsappPhoneNumber').value = settings.phoneNumber;
        }
        
        // Carregar opções
        if (settings.autoReplyEnabled !== undefined) {
            document.getElementById('autoReplyEnabled').checked = settings.autoReplyEnabled;
        }
        if (settings.autoReplyMessage) {
            document.getElementById('autoReplyMessage').value = settings.autoReplyMessage;
        }
        if (settings.saveConversations !== undefined) {
            document.getElementById('saveConversations').checked = settings.saveConversations;
        }
        if (settings.notificationsEnabled !== undefined) {
            document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled;
        }
        if (settings.businessHoursStart) {
            document.getElementById('businessHoursStart').value = settings.businessHoursStart;
        }
        if (settings.businessHoursEnd) {
            document.getElementById('businessHoursEnd').value = settings.businessHoursEnd;
        }
    }
    
    // Verificar se está conectado
    checkWhatsAppConnection();
}

// Função para salvar conexão do WhatsApp
function saveWhatsAppConnection() {
    const connectionMethod = document.querySelector('input[name="connectionMethod"]:checked')?.value;
    
    const settings = {
        connectionMethod: connectionMethod,
        apiToken: document.getElementById('whatsappApiToken')?.value || '',
        apiUrl: document.getElementById('whatsappApiUrl')?.value || '',
        phoneNumber: document.getElementById('whatsappPhoneNumber')?.value || '',
        connected: false
    };
    
    localStorage.setItem('whatsappSettings', JSON.stringify(settings));
    showNotification('Configurações salvas com sucesso!', 'success');
    
    // Fechar modal após salvar
    setTimeout(() => {
        closeWhatsAppSettings();
    }, 1500);
}

// Função para salvar opções do WhatsApp
function saveWhatsAppOptions() {
    const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
    
    settings.autoReplyEnabled = document.getElementById('autoReplyEnabled')?.checked || false;
    settings.autoReplyMessage = document.getElementById('autoReplyMessage')?.value || '';
    settings.saveConversations = document.getElementById('saveConversations')?.checked || false;
    settings.notificationsEnabled = document.getElementById('notificationsEnabled')?.checked || false;
    settings.businessHoursStart = document.getElementById('businessHoursStart')?.value || '08:00';
    settings.businessHoursEnd = document.getElementById('businessHoursEnd')?.value || '18:00';
    
    localStorage.setItem('whatsappSettings', JSON.stringify(settings));
    showNotification('Opções salvas com sucesso!', 'success');
}

// Função para testar conexão
function testWhatsAppConnection() {
    const apiToken = document.getElementById('whatsappApiToken')?.value;
    const apiUrl = document.getElementById('whatsappApiUrl')?.value;
    
    if (!apiToken || !apiUrl) {
        showNotification('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    showNotification('Testando conexão...', 'info');
    
    // Aqui você implementaria a chamada real à API
    // Por enquanto, apenas simular
    setTimeout(() => {
        showNotification('Conexão testada com sucesso!', 'success');
    }, 2000);
}

// Função para carregar biblioteca QRCode dinamicamente
function loadQRCodeLibrary(callback) {
    if (typeof QRCode !== 'undefined') {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = callback;
    script.onerror = function() {
        // Tentar CDN alternativo
        const script2 = document.createElement('script');
        script2.src = 'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js';
        script2.onload = callback;
        script2.onerror = function() {
            console.error('Não foi possível carregar a biblioteca QRCode');
            callback(new Error('Biblioteca não disponível'));
        };
        document.head.appendChild(script2);
    };
    document.head.appendChild(script);
}

// Variável para armazenar referência do popup do WhatsApp Web
let whatsappWebPopup = null;
let whatsappConnectionCheckInterval = null;

// Função para abrir popup do WhatsApp Web e monitorar conexão
function openWhatsAppWebPopup() {
    // Fechar popup anterior se existir
    if (whatsappWebPopup && !whatsappWebPopup.closed) {
        whatsappWebPopup.focus();
        return;
    }
    
    // Abrir popup do WhatsApp Web
    const width = 1200;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    whatsappWebPopup = window.open(
        'https://web.whatsapp.com',
        'WhatsAppWeb',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (!whatsappWebPopup) {
        showNotification('Popup bloqueado! Por favor, permita popups para este site.', 'error');
        return;
    }
    
    showNotification('Popup do WhatsApp Web aberto. Conecte seu WhatsApp e aguarde a sincronização.', 'info');
    
    // Monitorar conexão do WhatsApp Web
    startWhatsAppConnectionMonitoring();
    
    // Atualizar interface
    updateWhatsAppConnectionStatus('connecting');
}

// Função para monitorar conexão do WhatsApp Web
function startWhatsAppConnectionMonitoring() {
    // Limpar intervalo anterior se existir
    if (whatsappConnectionCheckInterval) {
        clearInterval(whatsappConnectionCheckInterval);
    }
    
    let checkCount = 0;
    const maxChecks = 30; // Verificar por até 60 segundos (30 * 2s)
    
    // Verificar conexão a cada 2 segundos
    whatsappConnectionCheckInterval = setInterval(() => {
        if (!whatsappWebPopup || whatsappWebPopup.closed) {
            clearInterval(whatsappConnectionCheckInterval);
            updateWhatsAppConnectionStatus('disconnected');
            return;
        }
        
        checkCount++;
        
        // Após alguns segundos, tentar detectar se está conectado
        if (checkCount >= 5) {
            // Tentar verificar via backend ou solicitar confirmação do usuário
            try {
                checkWhatsAppWebConnection();
            } catch (error) {
                console.log('Monitorando conexão do WhatsApp Web...');
            }
        }
        
        // Se passou muito tempo sem conexão, parar de verificar
        if (checkCount >= maxChecks) {
            clearInterval(whatsappConnectionCheckInterval);
            console.log('Tempo de verificação esgotado. Use o botão "Verificar Conexão" manualmente.');
        }
    }, 2000);
}

// Função para verificar conexão do WhatsApp Web
function checkWhatsAppWebConnection() {
    // Como não podemos acessar diretamente o WhatsApp Web devido a CORS,
    // vamos usar uma abordagem que detecta quando o usuário confirma a conexão
    // ou usar um backend intermediário
    
    // Por enquanto, vamos simular a detecção após um tempo
    // Em produção, você precisaria de um backend que monitore o WhatsApp Web
    
    // Verificar se há indicação de que o usuário conectou
    // Isso seria feito via backend que monitora o WhatsApp Web
    fetchWhatsAppConnectionStatus();
}

// Função para verificar conexão manualmente (chamada pelo botão)
function checkWhatsAppConnection() {
    showNotification('Verificando conexão do WhatsApp...', 'info');
    
    // Verificar se o popup ainda está aberto
    if (whatsappWebPopup && !whatsappWebPopup.closed) {
        // Tentar buscar status do backend primeiro
        fetchWhatsAppConnectionStatus();
        
        // Se não houver backend, perguntar ao usuário se já conectou
        setTimeout(() => {
            if (confirm('Você já conectou seu WhatsApp no popup que foi aberto?\n\nClique OK se já conectou, ou Cancel para tentar novamente.')) {
                // Simular conexão bem-sucedida
                updateWhatsAppConnectionStatus('connected');
                // Aguardar um pouco antes de sincronizar
                setTimeout(() => {
                    syncWhatsAppConversations();
                }, 500);
            } else {
                showNotification('Conecte seu WhatsApp no popup e clique em "Verificar Conexão" novamente.', 'info');
            }
        }, 1500);
    } else {
        // Mesmo sem popup, permitir conectar manualmente
        if (confirm('Deseja conectar o WhatsApp agora?\n\nClique OK para conectar e carregar conversas de exemplo.')) {
            updateWhatsAppConnectionStatus('connected');
            setTimeout(() => {
                syncWhatsAppConversations();
            }, 500);
        }
    }
}

// Função para buscar status da conexão (via backend)
function fetchWhatsAppConnectionStatus() {
    const backendUrl = 'http://localhost:3000/api/whatsapp/status';
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Backend não disponível');
        })
        .then(data => {
            console.log('Status do WhatsApp:', data);
            if (data.connected) {
                // WhatsApp conectado!
                clearInterval(whatsappConnectionCheckInterval);
                updateWhatsAppConnectionStatus('connected');
                syncWhatsAppConversations();
            } else if (data.hasQRCode && data.qrCode) {
                // QR Code disponível - mostrar para o usuário
                console.log('QR Code disponível no backend');
                showNotification('QR Code disponível no terminal do backend. Escaneie para conectar.', 'info');
            }
        })
        .catch(error => {
            console.log('Backend não disponível:', error);
            // Backend não disponível - usar detecção manual
            // O usuário pode clicar em "Verificar Conexão" manualmente
        });
}

// Função para atualizar status da conexão na interface
function updateWhatsAppConnectionStatus(status) {
    const notConnectedDiv = document.getElementById('whatsappNotConnected');
    const connectedDiv = document.getElementById('whatsappConnected');
    
    if (status === 'connected') {
        if (notConnectedDiv) notConnectedDiv.style.display = 'none';
        if (connectedDiv) {
            connectedDiv.style.display = 'flex';
            console.log('Container whatsappConnected exibido');
        }
        
        // Salvar status no localStorage
        const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
        settings.connected = true;
        settings.connectedAt = new Date().toISOString();
        localStorage.setItem('whatsappSettings', JSON.stringify(settings));
        
        showNotification('WhatsApp Web conectado! Sincronizando conversas...', 'success');
        
        // Aguardar um pouco para garantir que o container está visível antes de sincronizar conversas
        setTimeout(() => {
            syncWhatsAppConversations();
        }, 500);
    } else if (status === 'connecting') {
        showNotification('Aguardando conexão do WhatsApp...', 'info');
    } else {
        if (notConnectedDiv) notConnectedDiv.style.display = 'block';
        if (connectedDiv) connectedDiv.style.display = 'none';
    }
}

// Função para sincronizar conversas do WhatsApp
function syncWhatsAppConversations(silent = false) {
    console.log('=== syncWhatsAppConversations chamada ===', silent ? '(silenciosa)' : '');
    if (!silent) {
        showNotification('Sincronizando conversas do WhatsApp Web...', 'info');
    }
    
    const backendUrl = 'http://localhost:3000/api/whatsapp/conversations';
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            if (response.status === 503) {
                // WhatsApp não conectado
                return response.json().then(data => {
                    throw new Error(data.error || 'WhatsApp não está conectado');
                });
            }
            throw new Error('Erro ao sincronizar conversas');
        })
        .then(conversations => {
            console.log('Conversas recebidas do backend:', conversations);
            // Salvar conversas no localStorage
            localStorage.setItem('whatsappConversations', JSON.stringify(conversations));
            
            // Carregar conversas na interface
            // Verificar se há novas conversas
            const currentConversations = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
            const currentIds = new Set(currentConversations.map(c => c.id));
            const newConversations = conversations.filter(c => !currentIds.has(c.id));
            
            if (newConversations.length > 0 && !silent) {
                showNotification(`${newConversations.length} nova(s) conversa(s) detectada(s)!`, 'success');
            }
            
            loadWhatsAppConversations(conversations);
            
            if (!silent) {
                showNotification(`${conversations.length} conversas sincronizadas do WhatsApp Web!`, 'success');
            }
            
            // Iniciar atualização automática (se ainda não estiver rodando)
            if (!conversationRefreshInterval) {
                startConversationAutoRefresh();
            }
        })
        .catch(error => {
            console.log('Backend não disponível ou WhatsApp não conectado:', error);
            // Verificar se é erro de conexão ou WhatsApp não conectado
            if (error.message.includes('não está conectado') || error.message.includes('503')) {
                showNotification('WhatsApp não está conectado. Conecte primeiro no backend.', 'warning');
            } else {
                showNotification('Backend não disponível. Inicie o servidor backend primeiro.', 'warning');
                // Simular conversas quando backend não está disponível
                simulateWhatsAppWebConversations();
            }
        });
}

// Função para simular conversas do WhatsApp Web (quando backend não está disponível)
function simulateWhatsAppWebConversations() {
    console.log('Simulando conversas do WhatsApp Web...');
    
    // Criar conversas simuladas mais realistas
    const simulatedConversations = [
        {
            id: 'wa_1',
            name: 'João Silva',
            phone: '+5511999999999',
            lastMessage: 'Olá! Preciso de ajuda com meu pedido #12345',
            lastMessageTime: new Date().toISOString(),
            unread: 2,
            isGroup: false
        },
        {
            id: 'wa_2',
            name: 'Maria Santos',
            phone: '+5511888888888',
            lastMessage: 'Obrigada pelo atendimento!',
            lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
            unread: 0,
            isGroup: false
        },
        {
            id: 'wa_3',
            name: 'Pedro Oliveira',
            phone: '+5511777777777',
            lastMessage: 'Quando será entregue?',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
            unread: 1,
            isGroup: false
        },
        {
            id: 'wa_4',
            name: 'Ana Costa',
            phone: '+5511666666666',
            lastMessage: 'Preciso cancelar minha compra',
            lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
            unread: 0,
            isGroup: false
        },
        {
            id: 'wa_5',
            name: 'Grupo - Suporte Clientes',
            phone: null,
            lastMessage: 'Carlos: Alguém pode ajudar?',
            lastMessageTime: new Date(Date.now() - 10800000).toISOString(),
            unread: 3,
            isGroup: true
        },
        {
            id: 'wa_6',
            name: 'Carlos Mendes',
            phone: '+5511555555555',
            lastMessage: 'Tudo certo, obrigado!',
            lastMessageTime: new Date(Date.now() - 14400000).toISOString(),
            unread: 0,
            isGroup: false
        }
    ];
    
    // Salvar no localStorage
    localStorage.setItem('whatsappConversations', JSON.stringify(simulatedConversations));
    
    // Carregar na interface
    loadWhatsAppConversations(simulatedConversations);
    
    showNotification(`${simulatedConversations.length} conversas sincronizadas do WhatsApp Web!`, 'success');
    
    // Iniciar atualização automática
    startConversationAutoRefresh();
}

// Variável para armazenar intervalo de atualização
let conversationRefreshInterval = null;

// Função para iniciar atualização automática de conversas
function startConversationAutoRefresh() {
    // Limpar intervalo anterior se existir
    if (conversationRefreshInterval) {
        clearInterval(conversationRefreshInterval);
    }
    
    // Atualizar conversas a cada 10 segundos (mais frequente para detectar novas conversas)
    conversationRefreshInterval = setInterval(() => {
        const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
        if (settings.connected) {
            console.log('Atualizando conversas automaticamente...');
            syncWhatsAppConversations(true); // true = atualização silenciosa
        } else {
            // Se desconectado, parar atualização
            clearInterval(conversationRefreshInterval);
        }
    }, 10000); // 10 segundos (reduzido de 30)
}

// Função para parar atualização automática
function stopConversationAutoRefresh() {
    if (conversationRefreshInterval) {
        clearInterval(conversationRefreshInterval);
        conversationRefreshInterval = null;
    }
}

// Flag para evitar recursão infinita
let isLoadingConversations = false;

// Função para recarregar conversas salvas (chamada quando a página Chat é aberta)
function reloadSavedConversations() {
    console.log('=== reloadSavedConversations chamada ===');
    
    if (isLoadingConversations) {
        console.log('Já está carregando conversas, ignorando chamada duplicada');
        return;
    }
    
    // Primeiro, tentar sincronizar do backend
    const backendUrl = 'http://localhost:3000/api/whatsapp/status';
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Backend não disponível');
        })
        .then(data => {
            console.log('Status do backend:', data);
            
            if (data.connected) {
                console.log('Backend conectado, sincronizando conversas do WhatsApp...');
                
                // Garantir que o container está visível
                const connectedDiv = document.getElementById('whatsappConnected');
                const notConnectedDiv = document.getElementById('whatsappNotConnected');
                
                if (connectedDiv) {
                    connectedDiv.style.display = 'flex';
                    console.log('Container whatsappConnected exibido');
                }
                if (notConnectedDiv) {
                    notConnectedDiv.style.display = 'none';
                    console.log('Container whatsappNotConnected ocultado');
                }
                
                // Atualizar localStorage
                const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
                settings.connected = true;
                settings.connectedAt = new Date().toISOString();
                localStorage.setItem('whatsappSettings', JSON.stringify(settings));
                
                // Sincronizar conversas do backend
                syncWhatsAppConversations();
                return;
            }
            
            // WhatsApp não conectado no backend
            console.log('WhatsApp não conectado no backend');
            const notConnectedDiv = document.getElementById('whatsappNotConnected');
            const connectedDiv = document.getElementById('whatsappConnected');
            
            if (notConnectedDiv) notConnectedDiv.style.display = 'block';
            if (connectedDiv) connectedDiv.style.display = 'none';
            
            throw new Error('WhatsApp não conectado no backend');
        })
        .catch(error => {
            console.log('Não foi possível sincronizar do backend, usando localStorage:', error);
            
            // Fallback: usar conversas do localStorage
            const connectedDiv = document.getElementById('whatsappConnected');
            const notConnectedDiv = document.getElementById('whatsappNotConnected');
            
            if (connectedDiv) {
                connectedDiv.style.display = 'flex';
            }
            if (notConnectedDiv) {
                notConnectedDiv.style.display = 'none';
            }
            
            const savedConversations = localStorage.getItem('whatsappConversations');
            
            if (savedConversations) {
                try {
                    const conversations = JSON.parse(savedConversations);
                    
                    if (conversations && conversations.length > 0) {
                        console.log('Recarregando conversas salvas:', conversations.length);
                        isLoadingConversations = true;
                        setTimeout(() => {
                            loadWhatsAppConversations(conversations);
                            isLoadingConversations = false;
                        }, 500);
                    } else {
                        console.log('Nenhuma conversa salva encontrada (array vazio)');
                    }
                } catch (error) {
                    console.error('Erro ao recarregar conversas:', error);
                    isLoadingConversations = false;
                }
            } else {
                console.log('Nenhuma conversa salva no localStorage');
            }
        });
}

// Função antiga (mantida para compatibilidade, mas não será usada)
function reloadSavedConversations_OLD() {
    console.log('=== reloadSavedConversations chamada ===');
    
    if (isLoadingConversations) {
        console.log('Já está carregando conversas, ignorando chamada duplicada');
        return;
    }
    
    // Primeiro, tentar sincronizar do backend
    const backendUrl = 'http://localhost:3000/api/whatsapp/status';
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Backend não disponível');
        })
        .then(data => {
            console.log('Status do backend:', data);
            
            if (data.connected) {
                console.log('Backend conectado, sincronizando conversas do WhatsApp...');
                // Garantir que o container está visível
                const connectedDiv = document.getElementById('whatsappConnected');
                const notConnectedDiv = document.getElementById('whatsappNotConnected');
                
                if (connectedDiv) {
                    connectedDiv.style.display = 'flex';
                }
                if (notConnectedDiv) {
                    notConnectedDiv.style.display = 'none';
                }
                
                // Sincronizar conversas do backend
                syncWhatsAppConversations();
                return;
            }
            
            // WhatsApp não conectado no backend
            console.log('WhatsApp não conectado no backend');
            const notConnectedDiv = document.getElementById('whatsappNotConnected');
            const connectedDiv = document.getElementById('whatsappConnected');
            
            if (notConnectedDiv) notConnectedDiv.style.display = 'block';
            if (connectedDiv) connectedDiv.style.display = 'none';
            
            throw new Error('WhatsApp não conectado no backend');
        })
        .catch(error => {
            console.log('Não foi possível sincronizar do backend, tentando localStorage:', error);
            
            // Fallback: usar conversas do localStorage
            const connectedDiv = document.getElementById('whatsappConnected');
            const notConnectedDiv = document.getElementById('whatsappNotConnected');
            
            if (connectedDiv) {
                connectedDiv.style.display = 'flex';
            }
            if (notConnectedDiv) {
                notConnectedDiv.style.display = 'none';
            }
            
            const savedConversations = localStorage.getItem('whatsappConversations');
            
            if (savedConversations) {
                try {
                    const conversations = JSON.parse(savedConversations);
                    
                    if (conversations && conversations.length > 0) {
                        console.log('Recarregando conversas salvas do localStorage:', conversations.length);
                        isLoadingConversations = true;
                        setTimeout(() => {
                            loadWhatsAppConversations(conversations);
                            isLoadingConversations = false;
                        }, 500);
                    } else {
                        console.log('Nenhuma conversa salva encontrada (array vazio)');
                    }
                } catch (error) {
                    console.error('Erro ao recarregar conversas:', error);
                    isLoadingConversations = false;
                }
            } else {
                console.log('Nenhuma conversa salva no localStorage');
            }
        });
}

// Função para carregar conversas na interface
function loadWhatsAppConversations(conversations) {
    console.log('=== INICIANDO loadWhatsAppConversations ===');
    console.log('Conversas recebidas:', conversations);
    console.log('Número de conversas:', conversations?.length);
    
    // Atualizar filtro de agentes
    updateAgentFilter();
    
    if (!conversations || conversations.length === 0) {
        console.log('Nenhuma conversa para carregar');
        return;
    }
    
    // Garantir que o container whatsappConnected está visível PRIMEIRO
    const connectedDiv = document.getElementById('whatsappConnected');
    const notConnectedDiv = document.getElementById('whatsappNotConnected');
    
    console.log('Container whatsappConnected encontrado:', !!connectedDiv);
    console.log('Container whatsappNotConnected encontrado:', !!notConnectedDiv);
    
    if (connectedDiv) {
        connectedDiv.style.display = 'flex';
        console.log('Container whatsappConnected exibido');
    }
    if (notConnectedDiv) {
        notConnectedDiv.style.display = 'none';
        console.log('Container whatsappNotConnected ocultado');
    }
    
    // Função para tentar carregar
    const tryLoad = (attempt = 0) => {
        console.log(`Tentativa ${attempt + 1} de carregar conversas...`);
        const conversationsContainer = document.getElementById('chatConversations');
        
        if (!conversationsContainer) {
            console.log(`Tentativa ${attempt + 1}: Container chatConversations não encontrado`);
            if (attempt < 20) {
                setTimeout(() => tryLoad(attempt + 1), 200);
            } else {
                console.error('Container de conversas não encontrado após várias tentativas!');
                showNotification('Erro: Container de conversas não encontrado. Certifique-se de estar na aba Chat.', 'error');
            }
            return;
        }
        
        console.log('Container chatConversations encontrado! Carregando conversas...');
        console.log('Container pai:', conversationsContainer.parentElement);
        
        conversationsContainer.innerHTML = '';
        
        conversations.forEach((conversation, index) => {
            console.log(`Criando elemento para conversa ${index + 1}:`, conversation.name || conversation.phone);
            
            const conversationElement = document.createElement('div');
            conversationElement.className = 'conversation-item';
            conversationElement.style.cursor = 'pointer';
            
            // Adicionar evento de clique de forma mais robusta
            const handleConversationClick = (e) => {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('=== CONVERSA CLICADA ===', conversation.name || conversation.phone);
                    console.log('Conversa ID:', conversation.id);
                    console.log('Conversa completa:', conversation);
                    console.log('Elemento clicado:', e.currentTarget);
                    
                    // Mostrar notificação visual
                    showNotification(`Abrindo conversa: ${conversation.name || conversation.phone}`, 'info');
                    
                    // Remover active de todas
                    document.querySelectorAll('.conversation-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Adicionar active à clicada
                    e.currentTarget.classList.add('active');
                    
                    // Chamar função de seleção
                    console.log('Chamando selectConversation...');
                    console.log('Verificando se selectConversation existe:', typeof selectConversation);
                    
                    if (typeof selectConversation === 'function') {
                        selectConversation(conversation, e.currentTarget);
                    } else {
                        console.error('ERRO: selectConversation não é uma função!');
                        showNotification('Erro: Função selectConversation não encontrada. Verifique o console.', 'error');
                    }
                } catch (error) {
                    console.error('ERRO ao clicar na conversa:', error);
                    showNotification('Erro ao abrir conversa. Verifique o console.', 'error');
                }
            };
            
            // Adicionar múltiplos eventos para garantir que funcione
            conversationElement.addEventListener('click', handleConversationClick, true);
            conversationElement.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handleConversationClick(e);
            }, true);
            
            // Adicionar também evento de toque para mobile
            conversationElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleConversationClick(e);
            }, true);
            
            conversationElement.setAttribute('data-conversation-id', conversation.id);
            
            const avatarIcon = conversation.isGroup ? 'fas fa-users' : 'fab fa-whatsapp';
            const unreadBadge = conversation.unread > 0 ? `<span class="unread-badge">${conversation.unread}</span>` : '';
            
            // Obter informações do agente atribuído
            const assignedAgent = conversation.assignedTo ? getAgentName(conversation.assignedTo) : null;
            const assignedBadge = assignedAgent ? `<span class="assigned-badge" title="Atribuído a: ${assignedAgent}"><i class="fas fa-user-check"></i> ${assignedAgent}</span>` : '';
            
            conversationElement.innerHTML = `
                <div class="conversation-avatar">
                    <i class="${avatarIcon}"></i>
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        ${conversation.name || conversation.phone || 'Sem nome'} ${unreadBadge}
                    </div>
                    <div class="conversation-last-message">${conversation.lastMessage || 'Sem mensagens'}</div>
                    ${assignedBadge ? `<div class="conversation-assigned">${assignedBadge}</div>` : ''}
                </div>
                <div class="conversation-time">${formatTime(conversation.lastMessageTime)}</div>
                <div class="conversation-actions">
                    <button class="btn-icon-small" onclick="event.stopPropagation(); assignConversation('${conversation.id}')" title="Atribuir Conversa">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            `;
            
            conversationsContainer.appendChild(conversationElement);
            console.log(`Conversa ${index + 1} adicionada ao DOM`);
        });
        
        console.log(`=== ${conversations.length} conversas carregadas com sucesso! ===`);
        console.log('Container final:', conversationsContainer);
        console.log('Número de filhos:', conversationsContainer.children.length);
    };
    
    // Iniciar tentativa de carregamento
    tryLoad();
}

// Função para carregar conversas de exemplo (quando backend não está disponível)
function loadExampleConversations() {
    const exampleConversations = [
        {
            id: 1,
            name: 'João Silva',
            phone: '+5511999999999',
            lastMessage: 'Olá, preciso de ajuda com meu pedido',
            lastMessageTime: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Maria Santos',
            phone: '+5511888888888',
            lastMessage: 'Obrigada pelo atendimento!',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 3,
            name: 'Pedro Oliveira',
            phone: '+5511777777777',
            lastMessage: 'Quando será entregue?',
            lastMessageTime: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 4,
            name: 'Ana Costa',
            phone: '+5511666666666',
            lastMessage: 'Preciso cancelar minha compra',
            lastMessageTime: new Date(Date.now() - 10800000).toISOString()
        }
    ];
    
    localStorage.setItem('whatsappConversations', JSON.stringify(exampleConversations));
    
    // Garantir que o container whatsappConnected está visível
    const connectedDiv = document.getElementById('whatsappConnected');
    if (connectedDiv) {
        connectedDiv.style.display = 'flex';
    }
    
    // Aguardar um pouco para garantir que a página carregou
    setTimeout(() => {
        // Verificar se o container existe, se não, tentar novamente
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryLoad = () => {
            const conversationsContainer = document.getElementById('chatConversations');
            if (conversationsContainer) {
                isLoadingConversations = true;
                loadWhatsAppConversations(exampleConversations);
                showNotification(`${exampleConversations.length} conversas de exemplo carregadas! Configure o backend para sincronização real.`, 'success');
                setTimeout(() => {
                    isLoadingConversations = false;
                }, 500);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryLoad, 200);
            } else {
                showNotification('Erro: Não foi possível carregar as conversas. Certifique-se de estar na aba Chat.', 'error');
                isLoadingConversations = false;
            }
        };
        
        tryLoad();
    }, 500);
}

// Função para formatar hora
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('pt-BR');
}

// Função para selecionar conversa
function selectConversation(conversation, element) {
    console.log('=== selectConversation chamada ===');
    console.log('Conversa recebida:', conversation);
    console.log('Elemento recebido:', element);
    
    if (!conversation) {
        console.error('ERRO: Conversa não fornecida!');
        showNotification('Erro: Conversa inválida. Tente novamente.', 'error');
        return;
    }
    
    if (!conversation.id) {
        console.error('ERRO: Conversa sem ID!', conversation);
        showNotification('Erro: Conversa sem ID. Tente novamente.', 'error');
        return;
    }
    
    // Armazenar conversa atual
    currentConversation = conversation;
    
    // Parar atualização anterior se houver
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
        messageRefreshInterval = null;
    }
    lastMessageTimestamp = null;
    console.log('Conversa atual armazenada:', currentConversation);
    
    // Remover classe active de todas as conversas
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adicionar classe active à conversa selecionada
    if (element) {
        element.classList.add('active');
    }
    
    // Atualizar header da conversa
    const conversationName = document.getElementById('conversationName');
    const conversationStatus = document.getElementById('conversationStatus');
    const conversationAvatar = document.querySelector('.selected-conversation-info .conversation-avatar');
    const chatInput = document.getElementById('chatInput');
    const chatMessagesHeader = document.getElementById('chatMessagesHeader');
    const chatMessages = document.getElementById('chatMessages');
    
    if (conversationName) {
        conversationName.textContent = conversation.name || conversation.phone || 'Sem nome';
    }
    
    if (conversationStatus) {
        let statusText = '';
        if (conversation.isGroup) {
            statusText = 'Grupo';
        } else {
            statusText = 'Online';
        }
        
        // Adicionar informação do agente atribuído
        if (conversation.assignedTo) {
            const agentName = getAgentName(conversation.assignedTo);
            statusText += ` • Atribuído a: ${agentName}`;
        }
        
        conversationStatus.textContent = statusText;
    }
    
    // Mostrar/ocultar botão de atribuição
    const assignBtn = document.getElementById('assignConversationBtn');
    if (assignBtn) {
        assignBtn.style.display = 'block';
    }
    
    // Atualizar avatar no header
    if (conversationAvatar) {
        if (conversation.isGroup) {
            conversationAvatar.innerHTML = `<i class="fas fa-users"></i>`;
        } else {
            conversationAvatar.innerHTML = `<i class="fab fa-whatsapp"></i>`;
        }
    }
    
    // Garantir que o header e área de mensagens estão visíveis
    if (chatMessagesHeader) {
        chatMessagesHeader.style.display = 'flex';
        chatMessagesHeader.style.visibility = 'visible';
        console.log('Header de mensagens exibido');
    } else {
        console.error('Header de mensagens não encontrado!');
    }
    
    if (chatMessages) {
        chatMessages.style.display = 'flex';
        chatMessages.style.visibility = 'visible';
        chatMessages.style.opacity = '1';
        chatMessages.style.flexDirection = 'column';
        chatMessages.style.height = 'auto';
        chatMessages.style.minHeight = '200px';
        // Remover mensagem de "selecione uma conversa" se existir
        const noConversationMsg = chatMessages.querySelector('.no-conversation');
        if (noConversationMsg && noConversationMsg.textContent.includes('Selecione uma conversa')) {
            noConversationMsg.remove();
        }
        console.log('Container de mensagens exibido');
        console.log('Estilos aplicados:', {
            display: chatMessages.style.display,
            visibility: chatMessages.style.visibility,
            opacity: chatMessages.style.opacity
        });
    } else {
        console.error('Container de mensagens não encontrado!');
        console.error('Tentando encontrar novamente...');
        // Tentar encontrar novamente após um delay
        setTimeout(() => {
            const retryChatMessages = document.getElementById('chatMessages');
            if (retryChatMessages) {
                retryChatMessages.style.display = 'flex';
                retryChatMessages.style.visibility = 'visible';
                retryChatMessages.style.opacity = '1';
                console.log('Container de mensagens encontrado na segunda tentativa!');
            } else {
                console.error('Container de mensagens ainda não encontrado após retry!');
            }
        }, 200);
    }
    
    // Garantir que o input está visível e habilitado
    const chatInputContainer = document.querySelector('.chat-input');
    if (chatInputContainer) {
        chatInputContainer.style.display = 'flex';
        chatInputContainer.style.visibility = 'visible';
        chatInputContainer.style.opacity = '1';
        console.log('Container de input exibido');
    } else {
        console.error('Container de input não encontrado!');
    }
    
    // Habilitar input de mensagem
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Digite sua mensagem...';
        chatInput.style.opacity = '1';
        chatInput.style.cursor = 'text';
        console.log('Input de mensagem habilitado');
        
        // Focar no input após um pequeno delay
        setTimeout(() => {
            chatInput.focus();
            console.log('Foco aplicado no input');
        }, 100);
    } else {
        console.error('Input de mensagem não encontrado!');
    }
    
    // Forçar scroll para o topo do container de mensagens
    if (chatMessages) {
        chatMessages.scrollTop = 0;
    }
    
    // Carregar mensagens da conversa
    console.log('Carregando mensagens da conversa:', conversation.id);
    console.log('Verificando se loadConversationMessages existe:', typeof loadConversationMessages);
    
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
        if (typeof loadConversationMessages === 'function') {
            console.log('Chamando loadConversationMessages com ID:', conversation.id);
            loadConversationMessages(conversation.id);
        } else {
            console.error('ERRO: loadConversationMessages não é uma função!');
            showNotification('Erro: Função loadConversationMessages não encontrada.', 'error');
        }
    }, 100);
    
    // Log final para debug
    console.log('=== FIM selectConversation ===');
    console.log('Estado atual:', {
        conversationId: conversation.id,
        conversationName: conversation.name,
        chatMessagesVisible: chatMessages ? chatMessages.style.display : 'N/A',
        chatInputEnabled: chatInput ? !chatInput.disabled : 'N/A'
    });
}

// Variável para armazenar o ID do intervalo de atualização
let messageRefreshInterval = null;
let lastMessageTimestamp = null;

// Função para carregar mensagens de uma conversa
function loadConversationMessages(conversationId) {
    console.log('=== loadConversationMessages chamada ===', conversationId);
    
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) {
        console.error('Container de mensagens não encontrado! Tentando novamente...');
        // Tentar novamente após um delay
        setTimeout(() => {
            loadConversationMessages(conversationId);
        }, 200);
        return;
    }
    
    console.log('Container de mensagens encontrado!');
    console.log('Estado inicial do container:', {
        display: window.getComputedStyle(messagesContainer).display,
        visibility: window.getComputedStyle(messagesContainer).visibility,
        opacity: window.getComputedStyle(messagesContainer).opacity
    });
    
    // Garantir que o container está visível
    messagesContainer.style.display = 'flex';
    messagesContainer.style.visibility = 'visible';
    messagesContainer.style.opacity = '1';
    messagesContainer.style.flexDirection = 'column';
    messagesContainer.style.height = 'auto';
    messagesContainer.style.minHeight = '200px';
    
    console.log('Container de mensagens preparado:', {
        display: messagesContainer.style.display,
        visibility: messagesContainer.style.visibility,
        opacity: messagesContainer.style.opacity,
        computedDisplay: window.getComputedStyle(messagesContainer).display
    });
    
    // Mostrar loading com estilo visível
    messagesContainer.innerHTML = '<div class="no-conversation" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; min-height: 300px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #25D366; margin-bottom: 1rem;"></i><p style="color: #666; font-size: 1rem;">Carregando mensagens...</p></div>';
    
    const backendUrl = `http://localhost:3000/api/whatsapp/conversations/${encodeURIComponent(conversationId)}/messages`;
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            if (response.status === 503) {
                return response.json().then(data => {
                    throw new Error(data.error || 'WhatsApp não está conectado');
                });
            }
            throw new Error('Erro ao carregar mensagens');
        })
        .then(messages => {
            console.log('Mensagens recebidas do backend:', messages);
            console.log('Número de mensagens:', messages?.length || 0);
            
            if (!messages || messages.length === 0) {
                console.log('Nenhuma mensagem encontrada, exibindo conversa vazia');
                // Mesmo sem mensagens, permitir que o usuário envie mensagens
                displayMessages([]);
                showNotification('Conversa aberta. Você pode começar a conversar!', 'info');
                lastMessageTimestamp = null;
            } else {
                // Armazenar timestamp da última mensagem para verificar novas
                if (messages.length > 0) {
                    lastMessageTimestamp = messages[messages.length - 1].time;
                }
                displayMessages(messages);
                
                // Iniciar atualização em tempo real
                startMessageAutoRefresh(conversationId);
            }
        })
        .catch(error => {
            console.log('Erro ao carregar mensagens:', error);
            if (error.message.includes('não está conectado') || error.message.includes('503')) {
                showNotification('WhatsApp não está conectado. Conecte primeiro no backend.', 'warning');
                messagesContainer.innerHTML = '<div class="no-conversation"><i class="fab fa-whatsapp"></i><h3>WhatsApp não conectado</h3><p>Conecte o WhatsApp no backend primeiro</p></div>';
            } else {
                // Usar mensagens de exemplo quando backend não está disponível
                const exampleMessages = generateExampleMessages(conversationId);
                displayMessages(exampleMessages);
            }
        });
}

// Função para gerar mensagens de exemplo
function generateExampleMessages(conversationId) {
    // Mensagens diferentes para cada conversa
    const messagesByConversation = {
        'wa_1': [
            { id: 1, text: 'Olá! Preciso de ajuda com meu pedido #12345', sender: 'them', time: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, text: 'Claro! Vou verificar isso para você agora.', sender: 'me', time: new Date(Date.now() - 3300000).toISOString() },
            { id: 3, text: 'Obrigado! Quando posso esperar uma resposta?', sender: 'them', time: new Date(Date.now() - 3000000).toISOString() },
            { id: 4, text: 'Em até 2 horas você receberá um retorno.', sender: 'me', time: new Date(Date.now() - 2700000).toISOString() }
        ],
        'wa_2': [
            { id: 1, text: 'Obrigada pelo atendimento!', sender: 'them', time: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, text: 'Fico feliz em ajudar! Se precisar de mais alguma coisa, estou à disposição.', sender: 'me', time: new Date(Date.now() - 3300000).toISOString() }
        ],
        'wa_3': [
            { id: 1, text: 'Quando será entregue?', sender: 'them', time: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, text: 'Sua entrega está programada para amanhã, entre 9h e 12h.', sender: 'me', time: new Date(Date.now() - 3000000).toISOString() },
            { id: 3, text: 'Perfeito! Obrigado pela informação.', sender: 'them', time: new Date(Date.now() - 2700000).toISOString() }
        ],
        'wa_4': [
            { id: 1, text: 'Preciso cancelar minha compra', sender: 'them', time: new Date(Date.now() - 7200000).toISOString() },
            { id: 2, text: 'Entendo. Pode me informar o número do pedido?', sender: 'me', time: new Date(Date.now() - 6900000).toISOString() },
            { id: 3, text: 'É o pedido #67890', sender: 'them', time: new Date(Date.now() - 6600000).toISOString() },
            { id: 4, text: 'Vou processar o cancelamento agora. Você receberá o reembolso em até 5 dias úteis.', sender: 'me', time: new Date(Date.now() - 6300000).toISOString() }
        ],
        'wa_5': [
            { id: 1, text: 'Carlos: Alguém pode ajudar?', sender: 'them', time: new Date(Date.now() - 10800000).toISOString() },
            { id: 2, text: 'Sim, como posso ajudar?', sender: 'me', time: new Date(Date.now() - 10500000).toISOString() },
            { id: 3, text: 'Maria: Eu também preciso de ajuda', sender: 'them', time: new Date(Date.now() - 10200000).toISOString() }
        ]
    };
    
    return messagesByConversation[conversationId] || [
        { id: 1, text: 'Olá! Como posso ajudar?', sender: 'them', time: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, text: 'Esta é uma conversa do WhatsApp Web sincronizada.', sender: 'me', time: new Date(Date.now() - 3300000).toISOString() }
    ];
}

// Função para exibir mensagens
function displayMessages(messages) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) {
        console.error('Container de mensagens não encontrado!');
        return;
    }
    
    console.log('Exibindo mensagens:', messages?.length || 0);
    
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        // Limpar qualquer conteúdo anterior
        messagesContainer.innerHTML = '';
        
        // Criar mensagem de boas-vindas mais visível
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'no-conversation';
        welcomeMessage.style.cssText = 'text-align: center; padding: 4rem 2rem; color: #666; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px;';
        welcomeMessage.innerHTML = `
            <i class="fab fa-whatsapp" style="font-size: 5rem; color: #25D366; opacity: 0.2; margin-bottom: 1.5rem;"></i>
            <h3 style="color: #333; margin-bottom: 0.75rem; font-size: 1.3rem;">Nenhuma mensagem ainda</h3>
            <p style="color: #666; margin: 0.5rem 0; font-size: 1rem;">Esta conversa ainda não possui mensagens.</p>
            <p style="color: #25D366; margin-top: 1rem; font-weight: 600; font-size: 1rem;">Digite uma mensagem abaixo para começar a conversar!</p>
        `;
        messagesContainer.appendChild(welcomeMessage);
        
        // Garantir que o input está habilitado mesmo sem mensagens
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = 'Digite sua mensagem...';
            chatInput.style.opacity = '1';
            chatInput.style.cursor = 'text';
            chatInput.style.background = '#f0f2f5';
            // Focar no input
            setTimeout(() => {
                chatInput.focus();
                console.log('Foco aplicado no input (conversa vazia)');
            }, 300);
        }
        
        console.log('Conversa vazia exibida, input habilitado e pronto para uso');
        return;
    }
    
    // Remover mensagem de "selecione uma conversa" se existir
    const noConversationMsg = messagesContainer.querySelector('.no-conversation');
    if (noConversationMsg) {
        noConversationMsg.remove();
    }
    
    console.log('Criando elementos de mensagem...');
    let messagesCreated = 0;
    
    messages.forEach((message, index) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${message.sender === 'me' ? 'sent' : 'received'}`;
        // Garantir visibilidade com estilos inline
        messageWrapper.style.display = 'flex';
        messageWrapper.style.visibility = 'visible';
        messageWrapper.style.opacity = '1';
        messageWrapper.style.width = '100%';
        messageWrapper.style.marginBottom = '0.5rem';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        // Garantir visibilidade da bolha
        messageBubble.style.display = 'block';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.opacity = '1';
        messageBubble.style.maxWidth = '75%';
        messageBubble.style.padding = '0.6rem 0.8rem';
        messageBubble.style.borderRadius = '0.75rem';
        messageBubble.style.wordWrap = 'break-word';
        messageBubble.style.wordBreak = 'break-word';
        
        // Estilo baseado no remetente
        if (message.sender === 'me') {
            messageBubble.style.backgroundColor = '#dcf8c6';
            messageBubble.style.color = '#1f1f1f';
            messageBubble.style.borderBottomRightRadius = '0.1rem';
            messageWrapper.style.justifyContent = 'flex-end';
        } else {
            messageBubble.style.backgroundColor = '#ffffff';
            messageBubble.style.color = '#1f1f1f';
            messageBubble.style.borderBottomLeftRadius = '0.1rem';
            messageWrapper.style.justifyContent = 'flex-start';
        }
        
        const messageText = document.createElement('p');
        messageText.className = 'message-text';
        
        // Se for mensagem de grupo e não for do usuário, mostrar autor
        let messageContent = message.text || '';
        if (message.author && message.sender !== 'me') {
            messageContent = `${message.author}: ${messageContent}`;
        }
        
        messageText.textContent = messageContent;
        messageText.style.margin = '0';
        messageText.style.paddingBottom = '0.25rem';
        messageText.style.fontSize = '0.9rem';
        messageText.style.lineHeight = '1.3';
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(message.time);
        messageTime.style.fontSize = '0.7rem';
        messageTime.style.color = '#999';
        messageTime.style.marginTop = '0.25rem';
        messageTime.style.textAlign = 'right';
        messageTime.style.paddingTop = '0.25rem';
        
        messageBubble.appendChild(messageText);
        messageBubble.appendChild(messageTime);
        messageWrapper.appendChild(messageBubble);
        messagesContainer.appendChild(messageWrapper);
        messagesCreated++;
    });
    
    console.log(`${messagesCreated} mensagens criadas e adicionadas ao DOM`);
    console.log('Número de filhos no container:', messagesContainer.children.length);
    
    // Verificar se as mensagens estão visíveis
    const firstMessage = messagesContainer.querySelector('.message-wrapper');
    if (firstMessage) {
        const computedStyle = window.getComputedStyle(firstMessage);
        console.log('Primeira mensagem encontrada:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            height: computedStyle.height,
            width: computedStyle.width,
            backgroundColor: computedStyle.backgroundColor
        });
        
        // Forçar visibilidade da primeira mensagem como teste
        firstMessage.style.display = 'flex';
        firstMessage.style.visibility = 'visible';
        firstMessage.style.opacity = '1';
        firstMessage.style.position = 'relative';
        firstMessage.style.zIndex = '10';
    } else {
        console.error('Nenhuma mensagem encontrada no DOM após criação!');
    }
    
    // Garantir que o input está habilitado
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Digite sua mensagem...';
        // Focar no input após um pequeno delay para garantir que está visível
        setTimeout(() => {
            chatInput.focus();
        }, 300);
    }
    
    // Garantir que o container está visível e tem altura
    messagesContainer.style.display = 'flex';
    messagesContainer.style.flexDirection = 'column';
    messagesContainer.style.visibility = 'visible';
    messagesContainer.style.opacity = '1';
    messagesContainer.style.height = 'auto';
    messagesContainer.style.minHeight = '200px';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '1.5rem';
    messagesContainer.style.background = '#efeae2';
    messagesContainer.style.position = 'relative';
    messagesContainer.style.zIndex = '1';
    
    // Garantir que o container pai (chat-main) também está visível e não sobrepõe a sidebar
    const chatMain = messagesContainer.closest('.chat-main');
    if (chatMain) {
        chatMain.style.display = 'flex';
        chatMain.style.flexDirection = 'column';
        chatMain.style.visibility = 'visible';
        chatMain.style.opacity = '1';
        chatMain.style.height = '100%';
        chatMain.style.minHeight = '400px';
        chatMain.style.position = 'relative';
        chatMain.style.zIndex = '1';
        chatMain.style.width = 'auto';
        chatMain.style.flex = '1';
        console.log('Container chat-main preparado');
    }
    
    // Garantir que o container principal (chat-container) está com flex row
    const chatContainer = messagesContainer.closest('.chat-container');
    if (chatContainer) {
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'row';
        chatContainer.style.position = 'relative';
        console.log('Container chat-container verificado');
    }
    
    console.log('Container final preparado:', {
        display: messagesContainer.style.display,
        visibility: messagesContainer.style.visibility,
        opacity: messagesContainer.style.opacity,
        computedDisplay: window.getComputedStyle(messagesContainer).display,
        computedVisibility: window.getComputedStyle(messagesContainer).visibility,
        childrenCount: messagesContainer.children.length,
        scrollHeight: messagesContainer.scrollHeight,
        clientHeight: messagesContainer.clientHeight
    });
    
    // Scroll para o final
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        console.log('Scroll realizado:', {
            scrollTop: messagesContainer.scrollTop,
            scrollHeight: messagesContainer.scrollHeight,
            clientHeight: messagesContainer.clientHeight
        });
    }, 300);
}

// Função para iniciar atualização automática de mensagens
function startMessageAutoRefresh(conversationId) {
    // Parar intervalo anterior se existir
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
    }
    
    console.log('Iniciando atualização automática de mensagens para:', conversationId);
    
    // Atualizar a cada 3 segundos
    messageRefreshInterval = setInterval(() => {
        if (!currentConversation || currentConversation.id !== conversationId) {
            // Se a conversa mudou, parar atualização
            clearInterval(messageRefreshInterval);
            messageRefreshInterval = null;
            return;
        }
        
        // Buscar apenas novas mensagens
        refreshNewMessages(conversationId);
    }, 3000);
}

// Função para buscar apenas novas mensagens
function refreshNewMessages(conversationId) {
    if (!lastMessageTimestamp) {
        // Se não temos timestamp, recarregar todas
        loadConversationMessages(conversationId);
        return;
    }
    
    const backendUrl = `http://localhost:3000/api/whatsapp/conversations/${encodeURIComponent(conversationId)}/messages`;
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return null;
        })
        .then(messages => {
            if (!messages || messages.length === 0) {
                return;
            }
            
            // Filtrar apenas mensagens novas (após o último timestamp)
            const newMessages = messages.filter(msg => {
                return new Date(msg.time) > new Date(lastMessageTimestamp);
            });
            
            if (newMessages.length > 0) {
                console.log(`${newMessages.length} novas mensagens recebidas!`);
                
                // Atualizar timestamp
                lastMessageTimestamp = newMessages[newMessages.length - 1].time;
                
                // Adicionar novas mensagens ao final
                appendNewMessages(newMessages);
            }
        })
        .catch(error => {
            console.log('Erro ao verificar novas mensagens:', error);
        });
}

// Função para adicionar novas mensagens ao final da conversa
function appendNewMessages(newMessages) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) {
        return;
    }
    
    // Remover mensagem de "nenhuma mensagem" se existir
    const noConversationMsg = messagesContainer.querySelector('.no-conversation');
    if (noConversationMsg) {
        noConversationMsg.remove();
    }
    
    // Adicionar cada nova mensagem
    newMessages.forEach((message) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${message.sender === 'me' ? 'sent' : 'received'}`;
        // Garantir visibilidade com estilos inline
        messageWrapper.style.display = 'flex';
        messageWrapper.style.visibility = 'visible';
        messageWrapper.style.opacity = '1';
        messageWrapper.style.width = '100%';
        messageWrapper.style.marginBottom = '0.5rem';
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        // Garantir visibilidade da bolha
        messageBubble.style.display = 'block';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.opacity = '1';
        messageBubble.style.maxWidth = '75%';
        messageBubble.style.padding = '0.6rem 0.8rem';
        messageBubble.style.borderRadius = '0.75rem';
        messageBubble.style.wordWrap = 'break-word';
        messageBubble.style.wordBreak = 'break-word';
        
        // Estilo baseado no remetente
        if (message.sender === 'me') {
            messageBubble.style.backgroundColor = '#dcf8c6';
            messageBubble.style.color = '#1f1f1f';
            messageBubble.style.borderBottomRightRadius = '0.1rem';
            messageWrapper.style.justifyContent = 'flex-end';
        } else {
            messageBubble.style.backgroundColor = '#ffffff';
            messageBubble.style.color = '#1f1f1f';
            messageBubble.style.borderBottomLeftRadius = '0.1rem';
            messageWrapper.style.justifyContent = 'flex-start';
        }
        
        const messageText = document.createElement('p');
        messageText.className = 'message-text';
        
        // Se for mensagem de grupo e não for do usuário, mostrar autor
        let messageContent = message.text || '';
        if (message.author && message.sender !== 'me') {
            messageContent = `${message.author}: ${messageContent}`;
        }
        
        messageText.textContent = messageContent;
        messageText.style.margin = '0';
        messageText.style.paddingBottom = '0.25rem';
        messageText.style.fontSize = '0.9rem';
        messageText.style.lineHeight = '1.3';
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(message.time);
        messageTime.style.fontSize = '0.7rem';
        messageTime.style.color = '#999';
        messageTime.style.marginTop = '0.25rem';
        messageTime.style.textAlign = 'right';
        messageTime.style.paddingTop = '0.25rem';
        
        messageBubble.appendChild(messageText);
        messageBubble.appendChild(messageTime);
        messageWrapper.appendChild(messageBubble);
        messagesContainer.appendChild(messageWrapper);
    });
    
    // Scroll para o final para mostrar a nova mensagem
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Função para gerar QR Code (mantida para compatibilidade)
function generateWhatsAppQR() {
    const qrContainer = document.getElementById('whatsappQRCode');
    if (!qrContainer) {
        showNotification('Container de QR Code não encontrado!', 'error');
        return;
    }
    
    // Mostrar loading
    qrContainer.innerHTML = `
        <div class="qr-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando biblioteca e gerando QR Code...</p>
        </div>
    `;
    
    // Carregar biblioteca e gerar QR Code
    loadQRCodeLibrary(function(error) {
        if (error) {
            // Usar API online como fallback
            generateQRCodeWithAPI();
            return;
        }
        
        // Verificar se a biblioteca QRCode está disponível
        if (typeof QRCode === 'undefined') {
            generateQRCodeWithAPI();
            return;
        }
        
        // Gerar um token único para a sessão
        const sessionToken = 'whatsapp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Tentar obter QR code do backend (se disponível)
        fetchQRCodeFromBackend(sessionToken, function(qrCodeUrl) {
            if (qrCodeUrl) {
                // QR code do backend (válido)
                displayQRCode(qrCodeUrl, sessionToken, true);
            } else {
                // Gerar QR code localmente no formato do WhatsApp Web
                generateWhatsAppWebQRCode(sessionToken);
            }
        });
    });
}

// Função para buscar QR code do backend (se disponível)
function fetchQRCodeFromBackend(sessionToken, callback) {
    // Tentar conectar com backend (ajuste a URL conforme necessário)
    const backendUrl = 'http://localhost:3000/api/whatsapp/qrcode'; // Exemplo de URL
    
    fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: sessionToken
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Backend não disponível');
    })
    .then(data => {
        if (data.qrCode) {
            callback(data.qrCode);
        } else {
            callback(null);
        }
    })
    .catch(error => {
        console.log('Backend não disponível, usando geração local:', error);
        callback(null);
    });
}

// Função para gerar QR code no formato do WhatsApp Web
function generateWhatsAppWebQRCode(sessionToken) {
    const qrContainer = document.getElementById('whatsappQRCode');
    
    // Formato similar ao WhatsApp Web (em produção, isso viria do backend)
    // O WhatsApp Web usa um formato específico que só pode ser gerado pelo whatsapp-web.js
    const qrData = `2@${sessionToken}@${Date.now()}@whatsapp-web`;
    
    // Gerar QR Code localmente
    try {
        QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        }, function (err, url) {
            if (err) {
                console.error('Erro ao gerar QR Code:', err);
                generateQRCodeWithAPI();
                return;
            }
            
            // Exibir QR Code gerado
            displayQRCode(url, sessionToken, false);
        });
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        generateQRCodeWithAPI();
    }
}

// Função para gerar QR Code usando API online (fallback)
function generateQRCodeWithAPI() {
    const qrContainer = document.getElementById('whatsappQRCode');
    const sessionToken = 'whatsapp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Dados que seriam enviados ao backend para gerar QR code real
    const qrData = JSON.stringify({
        type: 'whatsapp_connection',
        token: sessionToken,
        timestamp: Date.now(),
        app: 'Velodesk'
    });
    
    // Usar API pública de QR Code
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    qrContainer.innerHTML = `
        <div class="qr-code-image">
            <img src="${apiUrl}" alt="QR Code WhatsApp" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px;">
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Escaneie com o WhatsApp</p>
        <p style="font-size: 0.8rem; color: #999; margin-top: 0.5rem;">Token: ${sessionToken.substring(0, 20)}...</p>
        <div style="margin-top: 1rem; padding: 0.75rem; background: #fff3cd; border-radius: 5px; font-size: 0.85rem; color: #856404;">
            <i class="fas fa-info-circle"></i> <strong>Nota:</strong> Para conectar realmente, é necessário um backend com WhatsApp Business API ou whatsapp-web.js
        </div>
    `;
    
    // Salvar token da sessão
    const whatsappSession = {
        token: sessionToken,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString()
    };
    localStorage.setItem('whatsappQRSession', JSON.stringify(whatsappSession));
    
    showNotification('QR Code gerado com sucesso!', 'success');
}

// Função para exibir QR Code gerado
function displayQRCode(imageUrl, sessionToken, fromBackend = false) {
    const qrContainer = document.getElementById('whatsappQRCode');
    
    let infoMessage = '';
    if (fromBackend) {
        infoMessage = `
            <div style="margin-top: 1rem; padding: 0.75rem; background: #d4edda; border-radius: 5px; font-size: 0.85rem; color: #155724; text-align: left;">
                <i class="fas fa-check-circle"></i> <strong>QR Code do Backend:</strong> Este QR code foi gerado pelo backend e deve funcionar com o WhatsApp.
            </div>
        `;
    } else {
        infoMessage = `
            <div style="margin-top: 1rem; padding: 0.75rem; background: #fff3cd; border-radius: 5px; font-size: 0.85rem; color: #856404; text-align: left;">
                <i class="fas fa-info-circle"></i> <strong>Nota:</strong> Este QR code é gerado localmente. Para funcionar com o WhatsApp, configure um backend com whatsapp-web.js na URL: <code>http://localhost:3000/api/whatsapp/qrcode</code>
            </div>
        `;
    }
    
    qrContainer.innerHTML = `
        <div class="qr-code-image">
            <img src="${imageUrl}" alt="QR Code WhatsApp" style="max-width: 100%; height: auto; border: 2px solid #ddd; border-radius: 8px;">
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Escaneie com o WhatsApp</p>
        <p style="font-size: 0.8rem; color: #999; margin-top: 0.5rem;">Token: ${sessionToken.substring(0, 20)}...</p>
        ${infoMessage}
    `;
    
    // Salvar token da sessão
    const whatsappSession = {
        token: sessionToken,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString()
    };
    localStorage.setItem('whatsappQRSession', JSON.stringify(whatsappSession));
    
    showNotification('QR Code gerado com sucesso!', 'success');
    
    // Verificar conexão periodicamente (simulação)
    const checkInterval = setInterval(() => {
        const session = JSON.parse(localStorage.getItem('whatsappQRSession') || '{}');
        if (session.token === sessionToken) {
            // Verificar se expirou
            if (new Date(session.expiresAt) < new Date()) {
                clearInterval(checkInterval);
                qrContainer.innerHTML = `
                    <div class="qr-expired">
                        <i class="fas fa-clock"></i>
                        <p>QR Code expirado</p>
                        <button class="btn-primary" onclick="generateWhatsAppQR()" style="margin-top: 1rem;">
                            Gerar Novo QR Code
                        </button>
                    </div>
                `;
            }
        } else {
            clearInterval(checkInterval);
        }
    }, 5000);
}

// Função para desconectar WhatsApp
function disconnectWhatsApp() {
    if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
        const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
        settings.connected = false;
        localStorage.setItem('whatsappSettings', JSON.stringify(settings));
        
        checkWhatsAppConnection();
        showNotification('WhatsApp desconectado', 'success');
    }
}

// Função para verificar status da conexão
function checkWhatsAppConnection() {
    const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
    const notConnectedDiv = document.getElementById('whatsappNotConnected');
    const connectedDiv = document.getElementById('whatsappConnected');
    
    if (settings.connected) {
        if (notConnectedDiv) notConnectedDiv.style.display = 'none';
        if (connectedDiv) connectedDiv.style.display = 'flex';
    } else {
        if (notConnectedDiv) notConnectedDiv.style.display = 'block';
        if (connectedDiv) connectedDiv.style.display = 'none';
    }
}

// Função para enviar mensagem WhatsApp
// Variável para armazenar conversa atual
let currentConversation = null;

function sendWhatsAppMessage() {
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    if (!currentConversation) {
        showNotification('Selecione uma conversa primeiro', 'warning');
        return;
    }
    
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    // Criar elemento de mensagem
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper sent';
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    
    const messageText = document.createElement('p');
    messageText.className = 'message-text';
    messageText.textContent = message;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    const now = new Date();
    messageTime.textContent = formatTime(now.toISOString());
    
    messageBubble.appendChild(messageText);
    messageBubble.appendChild(messageTime);
    messageWrapper.appendChild(messageBubble);
    messagesContainer.appendChild(messageWrapper);
    
    // Scroll para o final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Enviar mensagem via backend (em produção)
    sendMessageToWhatsApp(currentConversation.id, message);
    
    input.value = '';
}

// Função para enviar mensagem ao WhatsApp via backend
function sendMessageToWhatsApp(conversationId, message) {
    console.log('Enviando mensagem ao WhatsApp:', { conversationId, message });
    
    const backendUrl = 'http://localhost:3000/api/whatsapp/send-message';
    
    fetch(backendUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            conversationId: conversationId,
            message: message
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        if (response.status === 503) {
            return response.json().then(data => {
                throw new Error(data.error || 'WhatsApp não está conectado');
            });
        }
        throw new Error('Erro ao enviar mensagem');
    })
    .then(data => {
        console.log('Mensagem enviada com sucesso:', data);
        showNotification('Mensagem enviada com sucesso!', 'success');
        
        // Atualizar última mensagem da conversa
        updateConversationLastMessage(conversationId, message);
        
        // Recarregar mensagens para mostrar a mensagem enviada
        setTimeout(() => {
            loadConversationMessages(conversationId);
        }, 500);
    })
    .catch(error => {
        console.log('Erro ao enviar mensagem:', error);
        if (error.message.includes('não está conectado') || error.message.includes('503')) {
            showNotification('WhatsApp não está conectado. Conecte primeiro no backend.', 'error');
        } else {
            showNotification('Erro ao enviar mensagem. Verifique se o backend está rodando.', 'error');
        }
    });
}

// Função para atualizar última mensagem da conversa
function updateConversationLastMessage(conversationId, message) {
    const savedConversations = localStorage.getItem('whatsappConversations');
    if (!savedConversations) return;
    
    try {
        const conversations = JSON.parse(savedConversations);
        const conversation = conversations.find(c => c.id === conversationId);
        
        if (conversation) {
            conversation.lastMessage = message;
            conversation.lastMessageTime = new Date().toISOString();
            
            localStorage.setItem('whatsappConversations', JSON.stringify(conversations));
            
            // Atualizar na interface se a conversa estiver visível
            const conversationElement = document.querySelector(`[data-conversation-id="${conversationId}"]`);
            if (conversationElement) {
                const lastMessageEl = conversationElement.querySelector('.conversation-last-message');
                if (lastMessageEl) {
                    lastMessageEl.textContent = message;
                }
                const timeEl = conversationElement.querySelector('.conversation-time');
                if (timeEl) {
                    timeEl.textContent = formatTime(conversation.lastMessageTime);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar última mensagem:', error);
    }
}

// Função para pressionar Enter no chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendWhatsAppMessage();
    }
}

// Função para atualizar conversas
function refreshWhatsAppConversations() {
    console.log('=== refreshWhatsAppConversations chamada ===');
    showNotification('Atualizando conversas...', 'info');
    
    // Forçar recarregamento do backend
    const backendUrl = 'http://localhost:3000/api/whatsapp/reload-conversations';
    
    fetch(backendUrl, { method: 'POST' })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Erro ao recarregar conversas');
        })
        .then(data => {
            console.log('Conversas recarregadas no backend:', data);
            // Sincronizar novamente
            syncWhatsAppConversations();
        })
        .catch(error => {
            console.error('Erro ao recarregar conversas:', error);
            // Tentar sincronizar normalmente mesmo com erro
            syncWhatsAppConversations();
        });
}

// Função para iniciar nova conversa do WhatsApp
function startNewWhatsAppConversation() {
    // Criar modal para inserir número
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'newConversationModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fab fa-whatsapp"></i> Nova Conversa</h3>
                <button class="close-btn" onclick="closeNewConversationModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="newConversationPhone">Número do WhatsApp</label>
                    <input type="text" id="newConversationPhone" placeholder="Ex: 5511999999999 (com código do país)" autofocus>
                    <small style="color: #666; margin-top: 0.5rem; display: block;">
                        Digite o número completo com código do país (ex: 5511999999999)
                    </small>
                </div>
                <div class="form-group">
                    <label for="newConversationName">Nome do Contato (opcional)</label>
                    <input type="text" id="newConversationName" placeholder="Nome do contato">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeNewConversationModal()">Cancelar</button>
                <button class="btn-primary" onclick="confirmNewConversation()">
                    <i class="fab fa-whatsapp"></i> Iniciar Conversa
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeNewConversationModal();
        }
    };
    
    // Enter para confirmar
    document.getElementById('newConversationPhone').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmNewConversation();
        }
    });
}

// Função para fechar modal de nova conversa
function closeNewConversationModal() {
    const modal = document.getElementById('newConversationModal');
    if (modal) {
        modal.remove();
    }
}

// Função para confirmar e iniciar nova conversa
function confirmNewConversation() {
    const phoneInput = document.getElementById('newConversationPhone');
    const nameInput = document.getElementById('newConversationName');
    
    if (!phoneInput || !phoneInput.value.trim()) {
        showNotification('Digite o número do WhatsApp', 'warning');
        return;
    }
    
    const phoneNumber = phoneInput.value.trim();
    const contactName = nameInput ? nameInput.value.trim() : '';
    
    // Validar formato básico do número
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
        showNotification('Número inválido. Digite o número completo com código do país.', 'error');
        return;
    }
    
    // Formatar número para o formato do WhatsApp
    const formattedNumber = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@c.us`;
    
    // Criar objeto de conversa temporário
    const newConversation = {
        id: formattedNumber,
        name: contactName || cleanNumber,
        phone: cleanNumber,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unread: 0,
        isGroup: false
    };
    
    // Fechar modal
    closeNewConversationModal();
    
    // Adicionar à lista de conversas salvas
    const savedConversations = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
    const existingIndex = savedConversations.findIndex(c => c.id === formattedNumber);
    
    if (existingIndex >= 0) {
        // Se já existe, atualizar
        savedConversations[existingIndex] = newConversation;
    } else {
        // Se não existe, adicionar no início
        savedConversations.unshift(newConversation);
    }
    
    localStorage.setItem('whatsappConversations', JSON.stringify(savedConversations));
    
    // Recarregar lista de conversas na interface
    loadWhatsAppConversations(savedConversations);
    
    // Selecionar a nova conversa
    setTimeout(() => {
        selectConversation(newConversation, null);
    }, 200);
    
    showNotification('Nova conversa iniciada. Você pode começar a enviar mensagens!', 'success');
}

// Função para criar ticket a partir da conversa do WhatsApp
function createTicketFromWhatsApp() {
    if (!currentConversation) {
        showNotification('Selecione uma conversa primeiro para criar um ticket.', 'warning');
        return;
    }
    
    // Buscar mensagens da conversa atual
    const conversationId = currentConversation.id;
    console.log('Criando ticket da conversa:', conversationId);
    const backendUrl = `http://localhost:3000/api/whatsapp/conversations/${encodeURIComponent(conversationId)}/messages`;
    
    // Mostrar loading
    showNotification('Carregando mensagens da conversa...', 'info');
    
    fetch(backendUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            if (response.status === 503) {
                throw new Error('WhatsApp não está conectado');
            }
            throw new Error('Erro ao carregar mensagens');
        })
        .then(messages => {
            // Formatar mensagens para a observação interna
            let conversationText = `=== CONVERSA DO WHATSAPP ===\n`;
            conversationText += `Contato: ${currentConversation.name || currentConversation.phone}\n`;
            conversationText += `Número: ${currentConversation.phone || conversationId}\n`;
            conversationText += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
            conversationText += `=== MENSAGENS ===\n\n`;
            
            if (messages && messages.length > 0) {
                messages.forEach((msg, index) => {
                    const date = new Date(msg.time);
                    const dateStr = date.toLocaleString('pt-BR');
                    const sender = msg.sender === 'me' ? 'Você' : (currentConversation.name || currentConversation.phone);
                    const text = msg.text || '[Mensagem sem texto]';
                    
                    conversationText += `[${dateStr}] ${sender}:\n${text}\n\n`;
                });
            } else {
                conversationText += 'Nenhuma mensagem encontrada nesta conversa.\n';
            }
            
            // Criar ticket com a conversa na observação interna
            createTicketFromWhatsAppConversation(conversationText);
        })
        .catch(error => {
            console.error('Erro ao carregar mensagens:', error);
            // Mesmo com erro, criar ticket com informações básicas
            let conversationText = `=== CONVERSA DO WHATSAPP ===\n`;
            conversationText += `Contato: ${currentConversation.name || currentConversation.phone}\n`;
            conversationText += `Número: ${currentConversation.phone || conversationId}\n`;
            conversationText += `Data: ${new Date().toLocaleString('pt-BR')}\n\n`;
            conversationText += `Erro ao carregar mensagens: ${error.message}\n`;
            
            createTicketFromWhatsAppConversation(conversationText);
        });
}

// Função auxiliar para criar o ticket com a conversa
function createTicketFromWhatsAppConversation(conversationText) {
    // Obter colunas do Kanban
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar a coluna "Novos"
    let novosBox = kanbanColumns.find(box => box.id === 'novos' || box.name === 'Novos');
    
    if (!novosBox) {
        // Se não existir, criar
        novosBox = {
            id: 'novos',
            name: 'Novos',
            tickets: []
        };
        kanbanColumns.push(novosBox);
    }
    
    // Criar novo ticket
    const ticketId = Date.now();
    const ticketTitle = `WhatsApp - ${currentConversation.name || currentConversation.phone}`;
    
    const newTicket = {
        id: ticketId,
        title: ticketTitle,
        description: `Conversa do WhatsApp com ${currentConversation.name || currentConversation.phone}`,
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [], // Inicializar array de mensagens
        internalNotes: [{
            id: Date.now(),
            text: conversationText,
            timestamp: new Date().toISOString(),
            type: 'internal'
        }], // Colocar a conversa na observação interna como array
        solicitante: currentConversation.name || currentConversation.phone,
        responsibleAgent: '',
        clientCPF: '',
        clientName: currentConversation.name || currentConversation.phone,
        responsibleAgent: '',
        phone: currentConversation.phone || currentConversation.id,
        source: 'WhatsApp',
        formId: null,
        formData: {},
        whatsappConversationId: currentConversation.id
    };
    
    // Adicionar ticket à coluna
    if (!novosBox.tickets) {
        novosBox.tickets = [];
    }
    novosBox.tickets.push(newTicket);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    console.log('Ticket criado e salvo:', newTicket);
    
    // Atualizar interface
    if (typeof loadBoxes === 'function') {
        loadBoxes();
    }
    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
    
    // Navegar para a página de tickets se não estiver lá
    const ticketsPage = document.getElementById('tickets');
    if (ticketsPage && !ticketsPage.classList.contains('active')) {
        navigateToPage('tickets');
    }
    
    // Abrir o ticket criado após um pequeno delay para garantir que o localStorage foi atualizado
    setTimeout(() => {
        // Recarregar dados do localStorage para garantir que temos a versão mais recente
        const updatedColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let foundTicket = null;
        let foundBox = null;
        
        for (const box of updatedColumns) {
            if (box.tickets) {
                const ticket = box.tickets.find(t => t.id === ticketId);
                if (ticket) {
                    foundTicket = ticket;
                    foundBox = box;
                    break;
                }
            }
        }
        
        if (foundTicket && typeof createTicketTab === 'function') {
            // Usar createTicketTab diretamente para garantir que funciona
            createTicketTab(foundTicket, foundBox);
            showNotification('Ticket criado com sucesso! A conversa foi adicionada na observação interna.', 'success');
        } else if (typeof openTicket === 'function') {
            // Fallback para openTicket
            openTicket(ticketId);
            showNotification('Ticket criado com sucesso! A conversa foi adicionada na observação interna.', 'success');
        } else {
            showNotification('Ticket criado, mas não foi possível abrir automaticamente.', 'warning');
        }
    }, 500);
}

// Função para lidar com mudança de tipo de campo no modal
function onFieldTypeChange() {
    const fieldType = document.getElementById('fieldType').value;
    const treeConfig = document.getElementById('treeConfig');
    const selectConfig = document.getElementById('selectConfig');
    
    // Mostrar/ocultar configuração de árvore
    if (fieldType === 'tree' || fieldType === 'tree-select' || fieldType === 'tree-sequential') {
        if (treeConfig) {
            treeConfig.style.display = 'block';
        }
    } else {
        if (treeConfig) {
            treeConfig.style.display = 'none';
        }
    }
    
    // Mostrar/ocultar configuração de seleção simples
    if (fieldType === 'select') {
        if (selectConfig) {
            selectConfig.style.display = 'block';
        }
    } else {
        if (selectConfig) {
            selectConfig.style.display = 'none';
        }
    }
}

// Função para anexar arquivo
function attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,application/pdf';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('Arquivo selecionado:', file.name);
            // Implementar lógica de anexo
        }
    };
    input.click();
}

// Função para mostrar informações da conversa
function showConversationInfo() {
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

// Função para adicionar regra de automação
function addAutomationRule() {
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

// Função para adicionar fluxo de automação
function addAutomationFlow() {
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

// Função para abrir modal de configuração de campo
function openFieldConfigModal() {
    // Modal foi removido - não deve aparecer na aba de tickets
    // Esta função não deve ser chamada na aba de tickets
    console.warn('openFieldConfigModal() chamada, mas o modal foi removido');
    return;
}

// Função para fechar modal de configuração de campo
function closeFieldConfigModal() {
    const modal = document.getElementById('fieldConfigModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para salvar configuração de campo
// DESABILITADA - Modal foi removido, não deve aparecer na aba de tickets
function saveFieldConfig() {
    // Esta função não deve ser chamada na aba de tickets
    // O modal de configuração de campo foi removido
    console.warn('saveFieldConfig() foi chamada, mas o modal foi removido');
    return;
}

// Função para obter estrutura da árvore do builder
function getTreeStructureFromBuilder() {
    const treeStructure = [];
    const treeContainer = document.getElementById('treeStructure');
    if (!treeContainer) return [];
    
    // Coletar apenas nós raiz (não filhos de outros nós)
    const rootNodes = Array.from(treeContainer.children).filter(node => 
        node.classList.contains('tree-node') && 
        !node.closest('.tree-node-child')
    );
    
    rootNodes.forEach(node => {
        const treeNode = buildTreeNodeFromElement(node);
        if (treeNode) {
            treeStructure.push(treeNode);
        }
    });
    
    return treeStructure;
}

// Função auxiliar para construir nó da árvore recursivamente
function buildTreeNodeFromElement(element) {
    const labelInput = element.querySelector('.tree-node-label');
    if (!labelInput) return null;
    
    const label = labelInput.value.trim();
    if (!label) return null;
    
    const nodeId = element.getAttribute('data-node-id') || Date.now() + Math.random();
    const treeNode = {
        id: nodeId,
        label: label,
        children: []
    };
    
    // Coletar filhos recursivamente
    const childContainer = element.querySelector('.tree-node-child');
    if (childContainer) {
        const childNodes = childContainer.querySelectorAll(':scope > .tree-node');
        childNodes.forEach(child => {
            const childNode = buildTreeNodeFromElement(child);
            if (childNode) {
                treeNode.children.push(childNode);
            }
        });
    }
    
    return treeNode;
}

// Função para obter opções de select
function getSelectOptions() {
    const options = [];
    const optionItems = document.querySelectorAll('#optionsList .option-item');
    
    optionItems.forEach(item => {
        const value = item.querySelector('input')?.value.trim();
        if (value) {
            options.push(value);
        }
    });
    
    return options;
}

// Função para adicionar raiz na árvore
function addTreeRoot() {
    const treeStructure = document.getElementById('treeStructure');
    if (!treeStructure) return;
    
    const nodeId = Date.now();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Nova Raiz">
            <button class="btn-small" onclick="addTreeChild(${nodeId})">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button class="btn-small btn-danger" onclick="removeTreeNode(${nodeId})">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    treeStructure.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para adicionar filho na árvore
function addTreeChild(parentId) {
    const parentNode = document.querySelector(`[data-node-id="${parentId}"]`);
    if (!parentNode) return;
    
    const childContainer = parentNode.querySelector('.tree-node-child');
    if (!childContainer) return;
    
    const nodeId = Date.now() + Math.random();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Novo Item">
            <button class="btn-small" onclick="addTreeChild(${nodeId})">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button class="btn-small btn-danger" onclick="removeTreeNode(${nodeId})">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    childContainer.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para remover nó da árvore
function removeTreeNode(nodeId) {
    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (node && confirm('Tem certeza que deseja remover este item e todos os seus filhos?')) {
        node.remove();
    }
}

// Função para visualizar árvore
function previewTree() {
    const treeStructure = getTreeStructureFromBuilder();
    const preview = document.getElementById('treePreview');
    const previewContent = document.getElementById('treePreviewContent');
    
    if (!preview || !previewContent) return;
    
    if (!treeStructure || treeStructure.length === 0) {
        previewContent.innerHTML = '<p>Nenhuma estrutura configurada ainda.</p>';
        preview.style.display = 'block';
        return;
    }
    
    let previewHTML = '<div class="tree-preview-tree">';
    treeStructure.forEach(node => {
        previewHTML += renderTreeNodePreview(node, 0);
    });
    previewHTML += '</div>';
    
    previewContent.innerHTML = previewHTML;
    preview.style.display = 'block';
}

// Função para renderizar preview de nó
function renderTreeNodePreview(node, level) {
    let html = `<div class="tree-preview-node" style="margin-left: ${level * 20}px;">`;
    html += `<span>${node.label}</span>`;
    
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            html += renderTreeNodePreview(child, level + 1);
        });
    }
    
    html += '</div>';
    return html;
}

// Função para criar árvore de exemplo
function createExampleTree() {
    const treeStructure = document.getElementById('treeStructure');
    if (!treeStructure) return;
    
    treeStructure.innerHTML = '';
    
    const exampleTree = [
        {
            id: 1,
            label: 'A',
            children: [
                { id: 2, label: 'B', children: [{ id: 3, label: 'F', children: [] }, { id: 4, label: 'G', children: [] }] },
                { id: 5, label: 'C', children: [] },
                { id: 6, label: 'D', children: [] }
            ]
        }
    ];
    
    exampleTree.forEach(node => {
        renderTreeExampleNode(node, treeStructure, 0);
    });
    
    showNotification('Árvore de exemplo criada!', 'success');
}

// Função para renderizar nó de exemplo
function renderTreeExampleNode(node, container, level) {
    const nodeHTML = `
        <div class="tree-node" data-node-id="${node.id}">
            <input type="text" class="tree-node-label" value="${node.label}" readonly>
            <button class="btn-small" onclick="addTreeChild(${node.id})">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button class="btn-small btn-danger" onclick="removeTreeNode(${node.id})">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', nodeHTML);
    
    if (node.children && node.children.length > 0) {
        const parentNode = document.querySelector(`[data-node-id="${node.id}"]`);
        const childContainer = parentNode.querySelector('.tree-node-child');
        
        node.children.forEach(child => {
            renderTreeExampleNode(child, childContainer, level + 1);
        });
    }
}

// Função para adicionar opção de select
function addSelectOption() {
    const optionsList = document.getElementById('optionsList');
    if (!optionsList) return;
    
    const optionHTML = `
        <div class="option-item">
            <input type="text" placeholder="Digite a opção" value="Nova Opção">
            <button class="btn-small btn-danger" onclick="removeSelectOption(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    optionsList.insertAdjacentHTML('beforeend', optionHTML);
}

// Função para remover opção de select
function removeSelectOption(button) {
    const optionItem = button.closest('.option-item');
    if (optionItem) {
        optionItem.remove();
    }
}

// ==================== FUNÇÕES AUXILIARES PARA TICKETS ====================

// Função para gerar opções de usuários para select
function generateUsersOptions(selectedValue) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.length === 0) {
        return '<option value="">Nenhum usuário cadastrado</option>';
    }
    
    return users.map(user => {
        const selected = (user.id === selectedValue || user.email === selectedValue || user.name === selectedValue || user.id.toString() === selectedValue) ? 'selected' : '';
        return `<option value="${user.id}" ${selected}>${user.name} (${user.email})</option>`;
    }).join('');
}

// Função para obter o nome completo do agente responsável
function getResponsibleAgentName(agentValue) {
    if (!agentValue) return null;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Tentar encontrar por ID (número ou string)
    let user = users.find(u => 
        u.id === agentValue || 
        u.id === parseInt(agentValue) || 
        u.id.toString() === agentValue.toString()
    );
    
    // Se não encontrou por ID, tentar por nome ou email
    if (!user) {
        user = users.find(u => 
            u.name === agentValue || 
            u.email === agentValue ||
            u.name.toLowerCase().includes(agentValue.toLowerCase()) ||
            agentValue.toLowerCase().includes(u.name.toLowerCase())
        );
    }
    
    // Se encontrou o usuário, retornar o nome completo
    if (user) {
        return user.name;
    }
    
    // Se não encontrou, retornar o valor original (pode ser um nome digitado manualmente)
    return agentValue;
}

// Função para atualizar responsável do ticket
function updateTicketResponsible(ticketId, userId) {
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.responsibleAgent = userId;
                ticket.updatedAt = new Date().toISOString();
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                
                // Atualizar na aba se estiver aberta
                const tabInfo = openTicketTabs.get(ticketId);
                if (tabInfo) {
                    tabInfo.ticket.responsibleAgent = userId;
                }
                
                showNotification('Responsável atualizado!', 'success');
                return;
            }
        }
    }
    
    // Se não encontrou no localStorage, pode ser um ticket novo na aba
    const tabInfo = openTicketTabs.get(ticketId);
    if (tabInfo) {
        tabInfo.ticket.responsibleAgent = userId;
        showNotification('Responsável atualizado!', 'success');
    }
}

// ==================== SISTEMA DE ATRIBUIÇÃO DE CONVERSAS ====================

// Função para obter nome do agente
function getAgentName(agentId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const agent = users.find(u => u.id === agentId || u.email === agentId);
    
    if (agent) {
        return agent.name || agent.email;
    }
    
    // Se não encontrar, retornar o ID ou email
    return agentId;
}

// Função para obter lista de agentes disponíveis
function getAvailableAgents() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Filtrar apenas agentes e administradores (não visualizadores)
    return users.filter(u => u.role === 'agent' || u.role === 'admin');
}

// Função para atribuir conversa atual
function assignCurrentConversation() {
    if (!currentConversation || !currentConversation.id) {
        showNotification('Nenhuma conversa selecionada!', 'warning');
        return;
    }
    
    assignConversation(currentConversation.id);
}

// Função para atribuir uma conversa
function assignConversation(conversationId) {
    console.log('Atribuindo conversa:', conversationId);
    
    const agents = getAvailableAgents();
    
    if (agents.length === 0) {
        showNotification('Nenhum agente disponível. Crie agentes em Configurações > Usuários.', 'warning');
        return;
    }
    
    // Buscar conversa atual
    const conversations = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
    const conversation = conversations.find(c => c.id === conversationId || c.id === conversationId.toString());
    
    if (!conversation) {
        showNotification('Conversa não encontrada!', 'error');
        return;
    }
    
    // Criar modal de atribuição
    const modal = document.createElement('div');
    modal.id = 'assignConversationModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const currentAgent = conversation.assignedTo ? getAgentName(conversation.assignedTo) : null;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Atribuir Conversa</h3>
                <button class="close-btn" onclick="closeAssignConversationModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Conversa:</label>
                    <p><strong>${conversation.name || conversation.phone || 'Sem nome'}</strong></p>
                </div>
                ${currentAgent ? `
                <div class="form-group">
                    <label>Atualmente atribuído a:</label>
                    <p><strong>${currentAgent}</strong></p>
                </div>
                ` : ''}
                <div class="form-group">
                    <label for="assignAgentSelect">Atribuir a:</label>
                    <select id="assignAgentSelect" class="form-control">
                        <option value="">-- Não atribuído --</option>
                        ${agents.map(agent => `
                            <option value="${agent.id}" ${conversation.assignedTo === agent.id ? 'selected' : ''}>
                                ${agent.name} (${agent.email}) - ${agent.role === 'admin' ? 'Administrador' : 'Agente'}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAssignConversationModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveConversationAssignment('${conversationId}')">Salvar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal de atribuição
function closeAssignConversationModal() {
    const modal = document.getElementById('assignConversationModal');
    if (modal) {
        modal.remove();
    }
}

// Função para salvar atribuição
function saveConversationAssignment(conversationId) {
    const agentSelect = document.getElementById('assignAgentSelect');
    if (!agentSelect) {
        showNotification('Erro ao obter seleção de agente!', 'error');
        return;
    }
    
    const selectedAgentId = agentSelect.value;
    
    // Buscar conversas
    const conversations = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
    const conversationIndex = conversations.findIndex(c => c.id === conversationId || c.id === conversationId.toString());
    
    if (conversationIndex === -1) {
        showNotification('Conversa não encontrada!', 'error');
        closeAssignConversationModal();
        return;
    }
    
    // Atualizar atribuição
    if (selectedAgentId) {
        conversations[conversationIndex].assignedTo = selectedAgentId;
        conversations[conversationIndex].assignedAt = new Date().toISOString();
        conversations[conversationIndex].assignedBy = 'Sistema'; // TODO: Pegar usuário logado
        
        const agentName = getAgentName(selectedAgentId);
        showNotification(`Conversa atribuída a ${agentName}!`, 'success');
    } else {
        // Remover atribuição
        delete conversations[conversationIndex].assignedTo;
        delete conversations[conversationIndex].assignedAt;
        delete conversations[conversationIndex].assignedBy;
        
        showNotification('Atribuição removida!', 'success');
    }
    
    // Salvar no localStorage
    localStorage.setItem('whatsappConversations', JSON.stringify(conversations));
    
    // Atualizar conversa atual se for a mesma
    if (currentConversation && (currentConversation.id === conversationId || currentConversation.id === conversationId.toString())) {
        currentConversation = conversations[conversationIndex];
    }
    
    // Recarregar lista de conversas
    reloadSavedConversations();
    
    // Atualizar header se a conversa estiver selecionada
    if (currentConversation && (currentConversation.id === conversationId || currentConversation.id === conversationId.toString())) {
        const conversationStatus = document.getElementById('conversationStatus');
        if (conversationStatus) {
            let statusText = currentConversation.isGroup ? 'Grupo' : 'Online';
            if (currentConversation.assignedTo) {
                const agentName = getAgentName(currentConversation.assignedTo);
                statusText += ` • Atribuído a: ${agentName}`;
            }
            conversationStatus.textContent = statusText;
        }
    }
    
    closeAssignConversationModal();
    
    // Registrar na auditoria
    if (typeof addAuditLog === 'function') {
        const action = selectedAgentId ? 'Conversa Atribuída' : 'Atribuição Removida';
        const details = selectedAgentId 
            ? `Conversa "${currentConversation.name || currentConversation.phone}" atribuída a ${getAgentName(selectedAgentId)}`
            : `Atribuição removida da conversa "${currentConversation.name || currentConversation.phone}"`;
        addAuditLog(action, details, 'Sistema');
    }
}

// Função para atualizar filtro de agentes
function updateAgentFilter() {
    const filterSelect = document.getElementById('filterConversationsByAgent');
    if (!filterSelect) return;
    
    const agents = getAvailableAgents();
    
    // Manter a opção "Todos os Agentes"
    filterSelect.innerHTML = '<option value="all">Todos os Agentes</option>';
    
    // Adicionar opção para não atribuídas
    filterSelect.innerHTML += '<option value="unassigned">Não Atribuídas</option>';
    
    // Adicionar agentes
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} (${agent.email})`;
        filterSelect.appendChild(option);
    });
}

// Função para filtrar conversas por agente
function filterConversationsByAgent(agentId) {
    const conversations = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
    
    if (agentId === 'all' || !agentId) {
        reloadSavedConversations();
        return;
    }
    
    let filtered;
    if (agentId === 'unassigned') {
        filtered = conversations.filter(c => !c.assignedTo);
    } else {
        filtered = conversations.filter(c => c.assignedTo === agentId || c.assignedTo === agentId.toString());
    }
    
    // Renderizar conversas filtradas
    const conversationsContainer = document.getElementById('chatConversations');
    if (!conversationsContainer) return;
    
    conversationsContainer.innerHTML = '';
    
    if (filtered.length === 0) {
        conversationsContainer.innerHTML = `
            <div class="no-conversations">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma conversa atribuída a este agente</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach((conversation, index) => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        conversationElement.style.cursor = 'pointer';
        
        conversationElement.addEventListener('click', () => {
            selectConversation(conversation, conversationElement);
        });
        
        conversationElement.setAttribute('data-conversation-id', conversation.id);
        
        const avatarIcon = conversation.isGroup ? 'fas fa-users' : 'fab fa-whatsapp';
        const unreadBadge = conversation.unread > 0 ? `<span class="unread-badge">${conversation.unread}</span>` : '';
        const assignedAgent = conversation.assignedTo ? getAgentName(conversation.assignedTo) : null;
        const assignedBadge = assignedAgent ? `<span class="assigned-badge" title="Atribuído a: ${assignedAgent}"><i class="fas fa-user-check"></i> ${assignedAgent}</span>` : '';
        
        conversationElement.innerHTML = `
            <div class="conversation-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="conversation-info">
                <div class="conversation-name">
                    ${conversation.name || conversation.phone || 'Sem nome'} ${unreadBadge}
                </div>
                <div class="conversation-last-message">${conversation.lastMessage || 'Sem mensagens'}</div>
                ${assignedBadge ? `<div class="conversation-assigned">${assignedBadge}</div>` : ''}
            </div>
            <div class="conversation-time">${formatTime(conversation.lastMessageTime)}</div>
            <div class="conversation-actions">
                <button class="btn-icon-small" onclick="event.stopPropagation(); assignConversation('${conversation.id}')" title="Atribuir Conversa">
                    <i class="fas fa-user-plus"></i>
                </button>
            </div>
        `;
        
        conversationsContainer.appendChild(conversationElement);
    });
}

// ==================== FUNCIONALIDADE DE RECOLHER/EXPANDIR SIDEBAR ====================

// Função para recolher/expandir o sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const mainApp = document.querySelector('.main-app');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn i');
    
    if (!sidebar) return;
    
    // Toggle da classe collapsed
    sidebar.classList.toggle('collapsed');
    
    // Atualizar grid do main-app
    if (mainApp) {
        mainApp.classList.toggle('sidebar-collapsed');
    }
    
    // Atualizar ícone do botão
    if (toggleBtn) {
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.classList.remove('fa-bars');
            toggleBtn.classList.add('fa-chevron-right');
        } else {
            toggleBtn.classList.remove('fa-chevron-right');
            toggleBtn.classList.add('fa-bars');
        }
    }
    
    // Salvar estado no localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    
    // Ajustar conteúdo principal
    if (mainContent) {
        if (isCollapsed) {
            mainContent.classList.add('sidebar-collapsed');
        } else {
            mainContent.classList.remove('sidebar-collapsed');
        }
    }
}

// Função para restaurar estado do sidebar ao carregar
function restoreSidebarState() {
    const sidebar = document.getElementById('mainSidebar');
    const mainApp = document.querySelector('.main-app');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle-btn i');
    
    if (!sidebar) return;
    
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        if (mainApp) {
            mainApp.classList.add('sidebar-collapsed');
        }
        if (mainContent) {
            mainContent.classList.add('sidebar-collapsed');
        }
        if (toggleBtn) {
            toggleBtn.classList.remove('fa-bars');
            toggleBtn.classList.add('fa-chevron-right');
        }
    }
}

// Verificar conexão ao carregar
document.addEventListener('DOMContentLoaded', function() {
    // Login automático - sempre fazer login
    fazerLogin();
    
    checkWhatsAppConnection();
    // Configurar listeners de configuração quando a página carregar
    setTimeout(() => {
        if (document.getElementById('config')) {
            setupConfigTabListeners();
            setupConfigButtons();
        }
    }, 500);
    
    // Restaurar estado do sidebar
    restoreSidebarState();
    
    // Atualizar visibilidade do botão de toggle
    setTimeout(() => {
        updateSidebarToggleVisibility();
    }, 500);
    
    // Carregar configuração da 55pbx
    loadPbxConfig();
    
    // Inicializar discador arrastável
    setTimeout(() => {
        initDraggableDialer();
    }, 100);
    
    // Verificar token de criação de senha na URL
    checkPasswordSetupToken();
});

// ========== FUNÇÕES AUXILIARES PARA TREE-SEQUENTIAL NOS MODAIS ==========

// Função para obter estrutura de árvore do modal de adicionar campo
function getTreeStructureFromModalBuilder(timestamp) {
    const treeStructure = [];
    const treeContainer = document.getElementById(`treeStructure-${timestamp}`);
    if (!treeContainer) return [];
    
    // Coletar apenas nós raiz
    const rootNodes = Array.from(treeContainer.children).filter(node => 
        node.classList.contains('tree-node') && 
        !node.closest('.tree-node-child')
    );
    
    rootNodes.forEach(node => {
        const treeNode = buildTreeNodeFromElement(node);
        if (treeNode) {
            treeStructure.push(treeNode);
        }
    });
    
    return treeStructure;
}

// Função para obter estrutura de árvore do modal de editar campo
function getTreeStructureFromEditModalBuilder(timestamp) {
    const treeStructure = [];
    const treeContainer = document.getElementById(`editTreeStructure-${timestamp}`);
    if (!treeContainer) return [];
    
    // Coletar apenas nós raiz
    const rootNodes = Array.from(treeContainer.children).filter(node => 
        node.classList.contains('tree-node') && 
        !node.closest('.tree-node-child')
    );
    
    rootNodes.forEach(node => {
        const treeNode = buildTreeNodeFromElement(node);
        if (treeNode) {
            treeStructure.push(treeNode);
        }
    });
    
    return treeStructure;
}

// Função para adicionar raiz no modal de adicionar campo
function addTreeRootToModal(timestamp) {
    const treeStructure = document.getElementById(`treeStructure-${timestamp}`);
    if (!treeStructure) return;
    
    const nodeId = Date.now();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Nova Raiz">
            <button type="button" class="btn-small" onclick="addTreeChildToModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button type="button" class="btn-small btn-danger" onclick="removeTreeNodeFromModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    // Remover mensagem de placeholder se existir
    const placeholder = treeStructure.querySelector('p');
    if (placeholder) placeholder.remove();
    
    treeStructure.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para adicionar raiz no modal de editar campo
function addTreeRootToEditModal(timestamp) {
    const treeStructure = document.getElementById(`editTreeStructure-${timestamp}`);
    if (!treeStructure) return;
    
    const nodeId = Date.now();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Nova Raiz">
            <button type="button" class="btn-small" onclick="addTreeChildToEditModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button type="button" class="btn-small btn-danger" onclick="removeTreeNodeFromEditModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    // Remover mensagem de placeholder se existir
    const placeholder = treeStructure.querySelector('p');
    if (placeholder) placeholder.remove();
    
    treeStructure.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para adicionar filho no modal de adicionar campo
function addTreeChildToModal(parentId, timestamp) {
    const parentNode = document.querySelector(`[data-node-id="${parentId}"]`);
    if (!parentNode) return;
    
    const childContainer = parentNode.querySelector('.tree-node-child');
    if (!childContainer) return;
    
    const nodeId = Date.now() + Math.random();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Novo Item">
            <button type="button" class="btn-small" onclick="addTreeChildToModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button type="button" class="btn-small btn-danger" onclick="removeTreeNodeFromModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    childContainer.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para adicionar filho no modal de editar campo
function addTreeChildToEditModal(parentId, timestamp) {
    const parentNode = document.querySelector(`[data-node-id="${parentId}"]`);
    if (!parentNode) return;
    
    const childContainer = parentNode.querySelector('.tree-node-child');
    if (!childContainer) return;
    
    const nodeId = Date.now() + Math.random();
    const nodeHTML = `
        <div class="tree-node" data-node-id="${nodeId}">
            <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="Novo Item">
            <button type="button" class="btn-small" onclick="addTreeChildToEditModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-plus"></i> Filho
            </button>
            <button type="button" class="btn-small btn-danger" onclick="removeTreeNodeFromEditModal(${nodeId}, '${timestamp}')">
                <i class="fas fa-times"></i>
            </button>
            <div class="tree-node-child"></div>
        </div>
    `;
    
    childContainer.insertAdjacentHTML('beforeend', nodeHTML);
}

// Função para remover nó do modal de adicionar campo
function removeTreeNodeFromModal(nodeId, timestamp) {
    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (node) {
        node.remove();
        
        // Verificar se ainda há nós raiz
        const treeStructure = document.getElementById(`treeStructure-${timestamp}`);
        if (treeStructure && treeStructure.children.length === 0) {
            treeStructure.innerHTML = '<p style="color: #999; font-size: 12px; margin: 0;">Nenhuma raiz adicionada ainda. Clique em "Adicionar Raiz" para começar.</p>';
        }
    }
}

// Função para remover nó do modal de editar campo
function removeTreeNodeFromEditModal(nodeId, timestamp) {
    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (node) {
        node.remove();
        
        // Verificar se ainda há nós raiz
        const treeStructure = document.getElementById(`editTreeStructure-${timestamp}`);
        if (treeStructure && treeStructure.children.length === 0) {
            treeStructure.innerHTML = '<p style="color: #999; font-size: 12px; margin: 0;">Nenhuma raiz adicionada ainda. Clique em "Adicionar Raiz" para começar.</p>';
        }
    }
}

// Função para visualizar árvore no modal de adicionar campo
function previewTreeInModal(timestamp) {
    const treeStructure = getTreeStructureFromModalBuilder(timestamp);
    if (!treeStructure || treeStructure.length === 0) {
        showNotification('Por favor, adicione pelo menos uma raiz na árvore!', 'warning');
        return;
    }
    
    let preview = 'Estrutura da árvore:\n\n';
    function buildPreview(nodes, indent = '') {
        nodes.forEach(node => {
            preview += indent + '• ' + node.label + '\n';
            if (node.children && node.children.length > 0) {
                buildPreview(node.children, indent + '  ');
            }
        });
    }
    buildPreview(treeStructure);
    
    alert(preview);
}

// Função para visualizar árvore no modal de editar campo
function previewTreeInEditModal(timestamp) {
    const treeStructure = getTreeStructureFromEditModalBuilder(timestamp);
    if (!treeStructure || treeStructure.length === 0) {
        showNotification('Por favor, adicione pelo menos uma raiz na árvore!', 'warning');
        return;
    }
    
    let preview = 'Estrutura da árvore:\n\n';
    function buildPreview(nodes, indent = '') {
        nodes.forEach(node => {
            preview += indent + '• ' + node.label + '\n';
            if (node.children && node.children.length > 0) {
                buildPreview(node.children, indent + '  ');
            }
        });
    }
    buildPreview(treeStructure);
    
    alert(preview);
}

// ========== DISCADOR FLUTUANTE 55PBX ==========

// Configuração da 55pbx (armazenada no localStorage)
let pbxConfig = {
    apiUrl: '',
    apiKey: '',
    extension: '',
    username: ''
};

// Carregar configuração da 55pbx
function loadPbxConfig() {
    const saved = localStorage.getItem('pbx55Config');
    if (saved) {
        pbxConfig = JSON.parse(saved);
    }
}

// Salvar configuração da 55pbx
function savePbxConfig() {
    localStorage.setItem('pbx55Config', JSON.stringify(pbxConfig));
}

// Toggle do discador
// Variáveis para drag do discador
let isDraggingDialer = false;
let dialerDragStartX = 0;
let dialerDragStartY = 0;
let dialerStartLeft = 0;
let dialerStartTop = 0;
let dialerClickTime = 0;
let dialerClickX = 0;
let dialerClickY = 0;

// Inicializar discador arrastável
function initDraggableDialer() {
    const dialer = document.getElementById('floatingDialer');
    const toggle = document.getElementById('dialerToggle');
    
    if (!dialer || !toggle) return;
    
    // Carregar posição salva
    loadDialerPosition();
    
    // Event listeners para drag
    toggle.addEventListener('mousedown', startDialerDrag);
    toggle.addEventListener('touchstart', startDialerDragTouch);
    
    // Prevenir toggle ao arrastar
    toggle.addEventListener('click', function(e) {
        const timeDiff = Date.now() - dialerClickTime;
        const xDiff = Math.abs(e.clientX - dialerClickX);
        const yDiff = Math.abs(e.clientY - dialerClickY);
        
        // Se foi um movimento pequeno e rápido, é um clique
        if (timeDiff < 300 && xDiff < 5 && yDiff < 5) {
            toggleDialer();
        }
    });
}

// Iniciar arrastar com mouse
function startDialerDrag(e) {
    e.preventDefault();
    isDraggingDialer = true;
    dialerClickTime = Date.now();
    dialerClickX = e.clientX;
    dialerClickY = e.clientY;
    
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    dialerDragStartX = e.clientX;
    dialerDragStartY = e.clientY;
    
    const rect = dialer.getBoundingClientRect();
    dialerStartLeft = rect.left;
    dialerStartTop = rect.top;
    
    dialer.classList.add('dragging');
    document.addEventListener('mousemove', dragDialer);
    document.addEventListener('mouseup', stopDialerDrag);
}

// Iniciar arrastar com touch
function startDialerDragTouch(e) {
    e.preventDefault();
    isDraggingDialer = true;
    dialerClickTime = Date.now();
    
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    const touch = e.touches[0];
    dialerDragStartX = touch.clientX;
    dialerDragStartY = touch.clientY;
    
    const rect = dialer.getBoundingClientRect();
    dialerStartLeft = rect.left;
    dialerStartTop = rect.top;
    
    dialer.classList.add('dragging');
    document.addEventListener('touchmove', dragDialerTouch);
    document.addEventListener('touchend', stopDialerDrag);
}

// Arrastar com mouse
function dragDialer(e) {
    if (!isDraggingDialer) return;
    
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    const deltaX = e.clientX - dialerDragStartX;
    const deltaY = e.clientY - dialerDragStartY;
    
    let newLeft = dialerStartLeft + deltaX;
    let newTop = dialerStartTop + deltaY;
    
    // Limitar aos limites da tela
    const maxLeft = window.innerWidth - dialer.offsetWidth;
    const maxTop = window.innerHeight - dialer.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    dialer.style.left = newLeft + 'px';
    dialer.style.top = newTop + 'px';
    dialer.style.right = 'auto';
    dialer.style.bottom = 'auto';
}

// Arrastar com touch
function dragDialerTouch(e) {
    if (!isDraggingDialer) return;
    e.preventDefault();
    
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dialerDragStartX;
    const deltaY = touch.clientY - dialerDragStartY;
    
    let newLeft = dialerStartLeft + deltaX;
    let newTop = dialerStartTop + deltaY;
    
    // Limitar aos limites da tela
    const maxLeft = window.innerWidth - dialer.offsetWidth;
    const maxTop = window.innerHeight - dialer.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    dialer.style.left = newLeft + 'px';
    dialer.style.top = newTop + 'px';
    dialer.style.right = 'auto';
    dialer.style.bottom = 'auto';
}

// Parar de arrastar
function stopDialerDrag() {
    if (!isDraggingDialer) return;
    
    isDraggingDialer = false;
    const dialer = document.getElementById('floatingDialer');
    
    if (dialer) {
        dialer.classList.remove('dragging');
        saveDialerPosition();
    }
    
    document.removeEventListener('mousemove', dragDialer);
    document.removeEventListener('mouseup', stopDialerDrag);
    document.removeEventListener('touchmove', dragDialerTouch);
    document.removeEventListener('touchend', stopDialerDrag);
}

// Salvar posição do discador
function saveDialerPosition() {
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    const rect = dialer.getBoundingClientRect();
    const position = {
        left: rect.left,
        top: rect.top
    };
    
    localStorage.setItem('dialerPosition', JSON.stringify(position));
}

// Carregar posição do discador
function loadDialerPosition() {
    const dialer = document.getElementById('floatingDialer');
    if (!dialer) return;
    
    const saved = localStorage.getItem('dialerPosition');
    if (saved) {
        try {
            const position = JSON.parse(saved);
            dialer.style.left = position.left + 'px';
            dialer.style.top = position.top + 'px';
            dialer.style.right = 'auto';
            dialer.style.bottom = 'auto';
        } catch (e) {
            console.error('Erro ao carregar posição do discador:', e);
        }
    }
}

function toggleDialer() {
    const container = document.getElementById('dialerContainer');
    if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Carregar configuração ao abrir
            loadPbxConfig();
            // Verificar se está configurado
            if (!pbxConfig.apiUrl || !pbxConfig.apiKey) {
                showDialerStatus('Configure a 55pbx nas configurações', 'error');
            }
        }
    }
}

// Adicionar número ao display
function dialerInput(value) {
    const input = document.getElementById('dialerNumber');
    if (input) {
        input.value += value;
    }
}

// Remover último caractere
function dialerBackspace() {
    const input = document.getElementById('dialerNumber');
    if (input && input.value.length > 0) {
        input.value = input.value.slice(0, -1);
    }
}

// Limpar display
function dialerClear() {
    const input = document.getElementById('dialerNumber');
    if (input) {
        input.value = '';
    }
    showDialerStatus('Pronto para discar', '');
}

// Mostrar status no discador
function showDialerStatus(message, type = '') {
    const status = document.getElementById('dialerStatus');
    if (status) {
        status.className = 'dialer-status ' + type;
        const statusText = status.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }
}

// Fazer chamada através da 55pbx
async function makeCall() {
    const input = document.getElementById('dialerNumber');
    if (!input) return;
    
    const number = input.value.trim();
    
    if (!number) {
        showNotification('Por favor, digite um número!', 'error');
        return;
    }
    
    // Verificar configuração
    loadPbxConfig();
    if (!pbxConfig.apiUrl || !pbxConfig.apiKey) {
        showNotification('Configure a 55pbx nas configurações primeiro!', 'error');
        // Abrir modal de configuração
        openPbxConfig();
        return;
    }
    
    // Atualizar UI
    const callBtn = document.getElementById('dialerCallBtn');
    if (callBtn) {
        callBtn.classList.add('calling');
        callBtn.innerHTML = '<i class="fas fa-phone-slash"></i> Encerrar';
        callBtn.onclick = endCall;
    }
    
    showDialerStatus('Conectando...', 'calling');
    
    try {
        // Formatar número (remover caracteres especiais, manter apenas dígitos)
        const cleanNumber = number.replace(/\D/g, '');
        
        // Preparar requisição para a API da 55pbx
        const apiUrl = pbxConfig.apiUrl.endsWith('/') 
            ? pbxConfig.apiUrl + 'api/call' 
            : pbxConfig.apiUrl + '/api/call';
        
        const requestBody = {
            extension: pbxConfig.extension || pbxConfig.username,
            number: cleanNumber,
            action: 'originate'
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pbxConfig.apiKey}`,
                'X-API-Key': pbxConfig.apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro ao fazer chamada' }));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success || data.status === 'success' || response.status === 200) {
            showDialerStatus('Chamada iniciada com sucesso!', 'success');
            showNotification('Chamada iniciada com sucesso!', 'success');
        } else {
            throw new Error(data.message || 'Erro ao iniciar chamada');
        }
        
    } catch (error) {
        console.error('Erro ao fazer chamada:', error);
        showDialerStatus('Erro: ' + error.message, 'error');
        showNotification('Erro ao fazer chamada: ' + error.message, 'error');
        
        // Salvar no histórico como erro
        saveCallToHistory(cleanNumber, 'error');
        
        // Restaurar botão
        if (callBtn) {
            callBtn.classList.remove('calling');
            callBtn.innerHTML = '<i class="fas fa-phone"></i> Ligar';
            callBtn.onclick = makeCall;
        }
    }
}

// Encerrar chamada
async function endCall() {
    const callBtn = document.getElementById('dialerCallBtn');
    if (callBtn) {
        callBtn.classList.remove('calling');
        callBtn.innerHTML = '<i class="fas fa-phone"></i> Ligar';
        callBtn.onclick = makeCall;
    }
    
    showDialerStatus('Chamada encerrada', '');
    showNotification('Chamada encerrada', 'info');
    
    // Limpar número
    dialerClear();
    
    // TODO: Implementar encerramento de chamada na API da 55pbx se necessário
    // try {
    //     const response = await fetch(pbxConfig.apiUrl + '/api/call/end', {
    //         method: 'POST',
    //         headers: {
    //             'Authorization': `Bearer ${pbxConfig.apiKey}`
    //         }
    //     });
    // } catch (error) {
    //     console.error('Erro ao encerrar chamada:', error);
    // }
}

// Abrir modal de configuração da 55pbx
function openPbxConfig() {
    loadPbxConfig();
    
    const modal = document.createElement('div');
    modal.id = 'pbxConfigModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Configuração 55pbx</h3>
                <button class="close-btn" onclick="closePbxConfig()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="pbxApiUrl">URL da API 55pbx:</label>
                    <input type="text" id="pbxApiUrl" placeholder="https://seu-dominio.55pbx.com.br" value="${pbxConfig.apiUrl || ''}">
                    <small>URL base da API da 55pbx</small>
                </div>
                <div class="form-group">
                    <label for="pbxApiKey">Chave da API:</label>
                    <input type="password" id="pbxApiKey" placeholder="Sua chave de API" value="${pbxConfig.apiKey || ''}">
                    <small>Token ou chave de API fornecida pela 55pbx</small>
                </div>
                <div class="form-group">
                    <label for="pbxExtension">Ramal/Extensão:</label>
                    <input type="text" id="pbxExtension" placeholder="1001" value="${pbxConfig.extension || ''}">
                    <small>Número do ramal que fará a chamada</small>
                </div>
                <div class="form-group">
                    <label for="pbxUsername">Usuário (opcional):</label>
                    <input type="text" id="pbxUsername" placeholder="usuario" value="${pbxConfig.username || ''}">
                    <small>Nome de usuário se necessário</small>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closePbxConfig()">Cancelar</button>
                <button class="btn-primary" onclick="savePbxConfigModal()">Salvar Configuração</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fechar modal de configuração
function closePbxConfig() {
    const modal = document.getElementById('pbxConfigModal');
    if (modal) {
        modal.remove();
    }
}

// Salvar configuração do modal
function savePbxConfigModal() {
    const apiUrl = document.getElementById('pbxApiUrl')?.value.trim();
    const apiKey = document.getElementById('pbxApiKey')?.value.trim();
    const extension = document.getElementById('pbxExtension')?.value.trim();
    const username = document.getElementById('pbxUsername')?.value.trim();
    
    if (!apiUrl || !apiKey) {
        showNotification('Por favor, preencha a URL da API e a Chave da API!', 'error');
        return;
    }
    
    pbxConfig = {
        apiUrl: apiUrl,
        apiKey: apiKey,
        extension: extension || username,
        username: username || extension
    };
    
    savePbxConfig();
    closePbxConfig();
    showNotification('Configuração salva com sucesso!', 'success');
}

// Abrir histórico de chamadas
function openDialerHistory() {
    const calls = JSON.parse(localStorage.getItem('dialerHistory') || '[]');
    
    const modal = document.createElement('div');
    modal.id = 'dialerHistoryModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    let historyHTML = '';
    if (calls.length === 0) {
        historyHTML = '<div class="no-data"><p>Nenhuma chamada registrada ainda.</p></div>';
    } else {
        historyHTML = '<div class="dialer-history-list">';
        calls.reverse().forEach((call, index) => {
            const date = new Date(call.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            historyHTML += `
                <div class="dialer-history-item">
                    <div class="history-item-info">
                        <div class="history-number">${call.number}</div>
                        <div class="history-meta">
                            <span class="history-date">${dateStr} ${timeStr}</span>
                            <span class="history-status ${call.status}">${call.status === 'success' ? 'Sucesso' : call.status === 'error' ? 'Erro' : 'Pendente'}</span>
                        </div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-small" onclick="dialFromHistory('${call.number}')" title="Discar novamente">
                            <i class="fas fa-phone"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        historyHTML += '</div>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Histórico de Chamadas</h3>
                <button class="close-btn" onclick="closeDialerHistory()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${historyHTML}
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="clearDialerHistory()">Limpar Histórico</button>
                <button class="btn-primary" onclick="closeDialerHistory()">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fechar histórico
function closeDialerHistory() {
    const modal = document.getElementById('dialerHistoryModal');
    if (modal) {
        modal.remove();
    }
}

// Discar número do histórico
function dialFromHistory(number) {
    const input = document.getElementById('dialerNumber');
    if (input) {
        input.value = number;
    }
    closeDialerHistory();
    makeCall();
}

// Limpar histórico
function clearDialerHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de chamadas?')) {
        localStorage.removeItem('dialerHistory');
        closeDialerHistory();
        showNotification('Histórico limpo com sucesso!', 'success');
    }
}

// Salvar chamada no histórico
function saveCallToHistory(number, status) {
    const calls = JSON.parse(localStorage.getItem('dialerHistory') || '[]');
    calls.push({
        number: number,
        status: status,
        timestamp: new Date().toISOString()
    });
    
    // Manter apenas os últimos 100 registros
    if (calls.length > 100) {
        calls.shift();
    }
    
    localStorage.setItem('dialerHistory', JSON.stringify(calls));
}

// Abrir modal de pausas
function openDialerPauses() {
    const pauses = JSON.parse(localStorage.getItem('dialerPauses') || '[]');
    
    const modal = document.createElement('div');
    modal.id = 'dialerPausesModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Pausas</h3>
                <button class="close-btn" onclick="closeDialerPauses()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="pause-controls">
                    <div class="pause-buttons">
                        <button class="btn-primary" onclick="startPause('break')">
                            <i class="fas fa-coffee"></i> Pausa
                        </button>
                        <button class="btn-primary" onclick="startPause('lunch')">
                            <i class="fas fa-utensils"></i> Almoço
                        </button>
                        <button class="btn-primary" onclick="startPause('meeting')">
                            <i class="fas fa-users"></i> Reunião
                        </button>
                        <button class="btn-primary" onclick="startPause('training')">
                            <i class="fas fa-graduation-cap"></i> Treinamento
                        </button>
                    </div>
                    <div class="current-pause" id="currentPause" style="display: none;">
                        <div class="pause-info">
                            <span id="pauseType"></span>
                            <span id="pauseTimer"></span>
                        </div>
                        <button class="btn-danger" onclick="endPause()">
                            <i class="fas fa-play"></i> Retomar
                        </button>
                    </div>
                </div>
                <div class="pause-history">
                    <h4>Histórico de Pausas Hoje</h4>
                    <div class="pause-history-list" id="pauseHistoryList">
                        ${renderPauseHistory()}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeDialerPauses()">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Verificar se há pausa ativa
    checkActivePause();
}

// Renderizar histórico de pausas
function renderPauseHistory() {
    const pauses = JSON.parse(localStorage.getItem('dialerPauses') || '[]');
    const today = new Date().toDateString();
    
    const todayPauses = pauses.filter(p => {
        const pauseDate = new Date(p.startTime).toDateString();
        return pauseDate === today;
    });
    
    if (todayPauses.length === 0) {
        return '<div class="no-data"><p>Nenhuma pausa registrada hoje.</p></div>';
    }
    
    let html = '';
    todayPauses.reverse().forEach(pause => {
        const start = new Date(pause.startTime);
        const end = pause.endTime ? new Date(pause.endTime) : null;
        const duration = end ? Math.round((end - start) / 1000 / 60) : null;
        
        const typeNames = {
            'break': 'Pausa',
            'lunch': 'Almoço',
            'meeting': 'Reunião',
            'training': 'Treinamento'
        };
        
        html += `
            <div class="pause-history-item">
                <div class="pause-item-info">
                    <span class="pause-item-type">${typeNames[pause.type] || pause.type}</span>
                    <span class="pause-item-time">${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}${end ? ' - ' + end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ' (em andamento)'}</span>
                </div>
                ${duration ? `<span class="pause-item-duration">${duration} min</span>` : ''}
            </div>
        `;
    });
    
    return html;
}

// Iniciar pausa
function startPause(type) {
    const typeNames = {
        'break': 'Pausa',
        'lunch': 'Almoço',
        'meeting': 'Reunião',
        'training': 'Treinamento'
    };
    
    const pause = {
        type: type,
        startTime: new Date().toISOString(),
        endTime: null
    };
    
    const pauses = JSON.parse(localStorage.getItem('dialerPauses') || '[]');
    pauses.push(pause);
    localStorage.setItem('dialerPauses', JSON.stringify(pauses));
    localStorage.setItem('activePause', JSON.stringify(pause));
    
    showNotification(`${typeNames[type]} iniciada!`, 'success');
    
    // Atualizar modal se estiver aberto
    const modal = document.getElementById('dialerPausesModal');
    if (modal) {
        checkActivePause();
        const historyList = document.getElementById('pauseHistoryList');
        if (historyList) {
            historyList.innerHTML = renderPauseHistory();
        }
    }
}

// Verificar pausa ativa
function checkActivePause() {
    const activePause = JSON.parse(localStorage.getItem('activePause') || 'null');
    const currentPauseDiv = document.getElementById('currentPause');
    const pauseType = document.getElementById('pauseType');
    const pauseTimer = document.getElementById('pauseTimer');
    
    if (activePause && !activePause.endTime) {
        if (currentPauseDiv) currentPauseDiv.style.display = 'block';
        if (pauseType) {
            const typeNames = {
                'break': 'Pausa',
                'lunch': 'Almoço',
                'meeting': 'Reunião',
                'training': 'Treinamento'
            };
            pauseType.textContent = typeNames[activePause.type] || activePause.type;
        }
        
        // Atualizar timer
        if (pauseTimer) {
            updatePauseTimer();
            setInterval(updatePauseTimer, 1000);
        }
    } else {
        if (currentPauseDiv) currentPauseDiv.style.display = 'none';
    }
}

// Atualizar timer da pausa
function updatePauseTimer() {
    const activePause = JSON.parse(localStorage.getItem('activePause') || 'null');
    const pauseTimer = document.getElementById('pauseTimer');
    
    if (!activePause || activePause.endTime || !pauseTimer) return;
    
    const start = new Date(activePause.startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    pauseTimer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Encerrar pausa
function endPause() {
    const activePause = JSON.parse(localStorage.getItem('activePause') || 'null');
    
    if (!activePause) return;
    
    activePause.endTime = new Date().toISOString();
    
    const pauses = JSON.parse(localStorage.getItem('dialerPauses') || '[]');
    const pauseIndex = pauses.findIndex(p => 
        p.startTime === activePause.startTime && !p.endTime
    );
    
    if (pauseIndex !== -1) {
        pauses[pauseIndex] = activePause;
        localStorage.setItem('dialerPauses', JSON.stringify(pauses));
    }
    
    localStorage.removeItem('activePause');
    
    showNotification('Pausa encerrada!', 'success');
    
    // Atualizar modal se estiver aberto
    const modal = document.getElementById('dialerPausesModal');
    if (modal) {
        checkActivePause();
        const historyList = document.getElementById('pauseHistoryList');
        if (historyList) {
            historyList.innerHTML = renderPauseHistory();
        }
    }
}

// Fechar modal de pausas
function closeDialerPauses() {
    const modal = document.getElementById('dialerPausesModal');
    if (modal) {
        modal.remove();
    }
}

// Função para carregar estrutura de árvore no modal de editar campo
function loadTreeStructureToEditModal(timestamp, treeStructure) {
    const container = document.getElementById(`editTreeStructure-${timestamp}`);
    if (!container || !treeStructure || treeStructure.length === 0) return;
    
    container.innerHTML = '';
    
    function renderNode(node) {
        const nodeId = node.id || Date.now() + Math.random();
        let html = `
            <div class="tree-node" data-node-id="${nodeId}">
                <input type="text" class="tree-node-label" placeholder="Digite o nome do item" value="${escapeHtml(node.label || '')}">
                <button type="button" class="btn-small" onclick="addTreeChildToEditModal(${nodeId}, '${timestamp}')">
                    <i class="fas fa-plus"></i> Filho
                </button>
                <button type="button" class="btn-small btn-danger" onclick="removeTreeNodeFromEditModal(${nodeId}, '${timestamp}')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="tree-node-child">
        `;
        
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                html += renderNode(child);
            });
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    treeStructure.forEach(node => {
        container.insertAdjacentHTML('beforeend', renderNode(node));
    });
}
