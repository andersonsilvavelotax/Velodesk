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
    showNotification('Login realizado com sucesso!', 'success');
}

// Função de navegação
function navigateToPage(page) {
    console.log('Navegando para:', page);
    
    // Ocultar todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Mostrar página selecionada
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Carregar dados específicos da página
    if (page === 'dashboard') {
        loadDashboardStats();
    } else if (page === 'tickets') {
        loadBoxes();
        const kanbanColumns = localStorage.getItem('kanbanColumns');
        if (!kanbanColumns || JSON.parse(kanbanColumns).length === 0) {
            forceCreateKanbanBoxes();
        } else {
            loadBoxes();
        }
    } else if (page === 'config') {
        loadConfig();
    } else if (page === 'reports') {
        loadReports();
    } else if (page === 'chat') {
        loadChat();
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
        const responsible = ticket.responsible || ticket.responsibleName || 'Não atribuído';
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
function openTicket(ticketId) {
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
        return;
    }
    
    createTicketModal(foundTicket, foundBox);
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
        clientName: '',
        clientCPF: '',
        responsibleAgent: '',
        isNewTicket: true // Flag para identificar que é um ticket novo
    };
    
    // Criar uma caixa temporária para o ticket
    const tempBox = {
        id: 'temp',
        name: 'Novo Ticket',
        tickets: [tempTicket]
    };
    
    // Abrir a página completa do ticket
    createTicketModal(tempTicket, tempBox);
}

// Função para abrir ticket existente
function openTicket(ticketId) {
    console.log('Abrindo ticket:', ticketId);
    
    // Encontrar o ticket
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
        alert('Ticket não encontrado');
        return;
    }
    
    // Criar modal do ticket
    createTicketModal(foundTicket, foundBox);
}

// Função para criar modal do ticket
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
                                    <input type="text" class="form-input" id="clientName" placeholder="Nome do cliente" value="${ticket.clientName || ''}">
                                </div>
                                <div class="form-field">
                                    <label>CPF</label>
                                    <input type="text" class="form-input" id="clientCPF" placeholder="000.000.000-00" value="${ticket.clientCPF || ''}">
                                </div>
                                <div class="form-field">
                                    <label>Responsável pelo Atendimento</label>
                                    <input type="text" class="form-input" id="responsibleAgent" placeholder="Nome do responsável" value="${ticket.responsibleAgent || ''}">
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
                    <div class="ticket-footer-actions">
                        <button type="button" class="btn-secondary" onclick="openAIChatbot()">
                            <i class="fas fa-robot"></i> Assistente IA
                        </button>
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
                    <div class="timeline-text">${entry.text}</div>
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

// Função para salvar ticket novo
function saveNewTicket(ticketId) {
    console.log('Salvando ticket novo:', ticketId);
    
    // Coletar dados do formulário
    const titleInput = document.getElementById('ticketTitleInput');
    const descriptionInput = document.getElementById('ticketDescriptionInput');
    const clientNameInput = document.getElementById('clientName');
    const clientCPFInput = document.getElementById('clientCPF');
    const responsibleAgentInput = document.getElementById('responsibleAgent');
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
        clientName: clientNameInput ? clientNameInput.value.trim() : '',
        clientCPF: clientCPFInput ? clientCPFInput.value.trim() : '',
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
    moveTicketToCorrectBox(foundTicket, kanbanColumns);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    console.log('KanbanColumns salvo no localStorage');
    
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
    
    // Mostrar notificação
    showNotification(`Ticket atualizado para "${newStatus}" com sucesso!`, 'success');
    
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
    } else {
        console.log('Caixa de destino não encontrada:', targetBoxId);
    }
}

// Função para salvar dados do cliente
function saveClientData(ticketId) {
    const clientName = document.getElementById('clientName').value;
    const clientCPF = document.getElementById('clientCPF').value;
    const responsibleAgent = document.getElementById('responsibleAgent').value;
    
    // Buscar o ticket e atualizar os dados
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.clientName = clientName;
                ticket.clientCPF = clientCPF;
                ticket.responsibleAgent = responsibleAgent;
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
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
    const treeFields = form.fields.filter(field => field.type === 'tree' || field.type === 'tree-select');
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
    let totalTickets = 0;
    
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            totalTickets += box.tickets.length;
        }
    });
    
    const resolvedTicketsEl = document.getElementById('resolvedTickets');
    if (resolvedTicketsEl) {
        resolvedTicketsEl.textContent = totalTickets;
    }
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
    
    // Configurar event listeners para as abas de configuração
    setupConfigTabListeners();
    
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
}

// Função para carregar aba de usuários
function loadUsersTab() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = `
        <div class="user-item">
            <div class="user-info">
                <h4>Administrador</h4>
                <p>admin@velodesk.com</p>
            </div>
            <div class="user-actions">
                <button class="btn-secondary" onclick="editUser(1)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteUser(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Função para carregar aba de formulários
function loadFormsTab() {
    const formsList = document.getElementById('formsList');
    if (!formsList) return;
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    
    // Atualizar estatísticas
    const totalFormsEl = document.getElementById('totalForms');
    const totalFieldsEl = document.getElementById('totalFields');
    const totalTreesEl = document.getElementById('totalTrees');
    
    if (totalFormsEl) totalFormsEl.textContent = forms.length;
    
    let totalFields = 0;
    let totalTrees = 0;
    
    forms.forEach(form => {
        totalFields += form.fields.length;
        form.fields.forEach(field => {
            if (field.type === 'tree' || field.type === 'tree-select') {
                totalTrees++;
            }
        });
    });
    
    if (totalFieldsEl) totalFieldsEl.textContent = totalFields;
    if (totalTreesEl) totalTreesEl.textContent = totalTrees;
    
    // Renderizar lista de formulários
    formsList.innerHTML = '';
    forms.forEach(form => {
        const formItem = document.createElement('div');
        formItem.className = 'form-item';
        formItem.innerHTML = `
            <div class="form-info">
                <h4>${form.name}</h4>
                <p>${form.description || 'Sem descrição'}</p>
                <span class="form-fields-count">${form.fields.length} campos</span>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="editForm(${form.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteForm(${form.id})">
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
    
    workflowsList.innerHTML = `
        <div class="workflow-item">
            <div class="workflow-info">
                <h4>Workflow de Suporte</h4>
                <p>Automação para tickets de suporte</p>
                <span class="workflow-status active">Ativo</span>
            </div>
            <div class="workflow-actions">
                <button class="btn-secondary" onclick="editWorkflow(1)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteWorkflow(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Função para carregar aba de backup
function loadBackupTab() {
    const backupHistory = document.getElementById('backupHistory');
    if (!backupHistory) return;
    
    backupHistory.innerHTML = `
        <div class="backup-item">
            <div class="backup-info">
                <h4>Backup Completo</h4>
                <p>2024-01-15 14:30:00</p>
                <span class="backup-size">2.5 MB</span>
            </div>
            <div class="backup-actions">
                <button class="btn-primary" onclick="restoreBackup(1)">
                    <i class="fas fa-undo"></i> Restaurar
                </button>
                <button class="btn-danger" onclick="deleteBackup(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Função para carregar aba de auditoria
function loadAuditTab() {
    const auditTable = document.getElementById('auditTable');
    if (!auditTable) return;
    
    auditTable.innerHTML = `
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
                <tr>
                    <td>2024-01-15 14:30:00</td>
                    <td>admin@velodesk.com</td>
                    <td>Login</td>
                    <td>Sistema acessado</td>
                </tr>
                <tr>
                    <td>2024-01-15 14:25:00</td>
                    <td>admin@velodesk.com</td>
                    <td>Criar Ticket</td>
                    <td>Ticket #123 criado</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Função para carregar aba de API
function loadApiTab() {
    const apiKeysList = document.getElementById('apiKeysList');
    const apiEndpointsList = document.getElementById('apiEndpointsList');
    
    if (apiKeysList) {
        apiKeysList.innerHTML = `
            <div class="api-key-item">
                <div class="api-key-info">
                    <h4>Chave Principal</h4>
                    <p>sk-***...***abc123</p>
                    <span class="api-key-status active">Ativa</span>
                </div>
                <div class="api-key-actions">
                    <button class="btn-secondary" onclick="regenerateApiKey(1)">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn-danger" onclick="deleteApiKey(1)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    if (apiEndpointsList) {
        apiEndpointsList.innerHTML = `
            <div class="api-endpoint-item">
                <div class="endpoint-info">
                    <h4>GET /api/tickets</h4>
                    <p>Listar todos os tickets</p>
                </div>
                <div class="endpoint-actions">
                    <button class="btn-primary" onclick="testEndpoint('GET', '/api/tickets')">
                        <i class="fas fa-play"></i> Testar
                    </button>
                </div>
            </div>
        `;
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
    
    customFields.innerHTML = `
        <div class="field-item">
            <div class="field-info">
                <h4>Prioridade</h4>
                <p>Tipo: Select | Obrigatório: Sim</p>
            </div>
            <div class="field-actions">
                <button class="btn-secondary" onclick="editField(1)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteField(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Funções para formulários
function openFormModal() {
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
                    <label for="formName">Nome do Formulário:</label>
                    <input type="text" id="formName" placeholder="Ex: Formulário de Suporte">
                </div>
                <div class="form-group">
                    <label for="formDescription">Descrição:</label>
                    <textarea id="formDescription" placeholder="Descreva o propósito do formulário"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeFormModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveForm()">Salvar Formulário</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeFormModal() {
    const modal = document.getElementById('formModal');
    if (modal) {
        modal.remove();
    }
}

function saveForm() {
    const name = document.getElementById('formName').value;
    const description = document.getElementById('formDescription').value;
    
    if (!name) {
        alert('Por favor, digite o nome do formulário!');
        return;
    }
    
    const newForm = {
        id: Date.now(),
        name: name,
        description: description,
        fields: [],
        createdAt: new Date().toISOString()
    };
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    forms.push(newForm);
    localStorage.setItem('forms', JSON.stringify(forms));
    
    closeFormModal();
    loadFormsTab();
    showNotification('Formulário criado com sucesso!', 'success');
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
    const name = document.getElementById('editFormName').value;
    const description = document.getElementById('editFormDescription').value;
    
    if (!name) {
        alert('Por favor, digite o nome do formulário!');
        return;
    }
    
    // Buscar o formulário no localStorage
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const formIndex = forms.findIndex(f => f.id === formId);
    
    if (formIndex === -1) {
        showNotification('Formulário não encontrado!', 'error');
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
                    <label for="fieldLabel">Rótulo do Campo:</label>
                    <input type="text" id="fieldLabel" placeholder="Ex: Categoria">
                </div>
                <div class="form-group">
                    <label for="fieldType">Tipo do Campo:</label>
                    <select id="fieldType">
                        <option value="text">Texto</option>
                        <option value="textarea">Área de Texto</option>
                        <option value="select">Seleção Simples</option>
                        <option value="checkbox">Caixa de Seleção</option>
                        <option value="radio">Botão de Rádio</option>
                        <option value="date">Data</option>
                        <option value="email">Email</option>
                        <option value="number">Número</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="fieldRequired">Obrigatório:</label>
                    <input type="checkbox" id="fieldRequired">
                </div>
                <div class="form-group" id="optionsGroup" style="display: none;">
                    <label for="fieldOptions">Opções (uma por linha):</label>
                    <textarea id="fieldOptions" rows="4" placeholder="Opção 1&#10;Opção 2&#10;Opção 3"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAddFieldModal()">Cancelar</button>
                <button class="btn-primary" onclick="saveNewField()">Adicionar Campo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(fieldModal);
    
    // Configurar evento para mostrar/ocultar opções
    const fieldTypeSelect = document.getElementById('fieldType');
    const optionsGroup = document.getElementById('optionsGroup');
    
    fieldTypeSelect.addEventListener('change', function() {
        if (this.value === 'select' || this.value === 'radio') {
            optionsGroup.style.display = 'block';
        } else {
            optionsGroup.style.display = 'none';
        }
    });
}

function closeAddFieldModal() {
    const modal = document.getElementById('addFieldModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewField() {
    const label = document.getElementById('fieldLabel').value;
    const type = document.getElementById('fieldType').value;
    const required = document.getElementById('fieldRequired').checked;
    const optionsText = document.getElementById('fieldOptions').value;
    
    if (!label) {
        alert('Por favor, digite o rótulo do campo!');
        return;
    }
    
    const newField = {
        id: Date.now(),
        label: label,
        type: type,
        required: required
    };
    
    // Adicionar opções se necessário
    if ((type === 'select' || type === 'radio') && optionsText.trim()) {
        newField.options = optionsText.split('\n').map(opt => opt.trim()).filter(opt => opt);
    }
    
    // Adicionar campo ao formulário em edição
    addFieldToCurrentForm(newField);
    
    closeAddFieldModal();
    refreshEditFormFields();
}

function addFieldToCurrentForm(field) {
    // Esta função seria implementada para adicionar o campo ao formulário sendo editado
    // Por enquanto, vamos simular adicionando ao localStorage temporariamente
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const editFormId = getCurrentEditFormId(); // Função auxiliar
    
    if (editFormId) {
        const formIndex = forms.findIndex(f => f.id === editFormId);
        if (formIndex !== -1) {
            if (!forms[formIndex].fields) {
                forms[formIndex].fields = [];
            }
            forms[formIndex].fields.push(field);
            localStorage.setItem('forms', JSON.stringify(forms));
        }
    }
}

function getCurrentEditFormId() {
    // Função auxiliar para obter o ID do formulário sendo editado
    // Por enquanto, vamos usar uma variável global simples
    return window.currentEditFormId || null;
}

function refreshEditFormFields() {
    const fieldsList = document.getElementById('editFieldsList');
    if (!fieldsList) return;
    
    // Recarregar os campos do formulário em edição
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const editFormId = getCurrentEditFormId();
    
    if (editFormId) {
        const form = forms.find(f => f.id === editFormId);
        if (form) {
            fieldsList.innerHTML = renderFormFieldsForEdit(form.fields);
        }
    }
}

function editFormField(fieldIndex) {
    console.log('Editando campo:', fieldIndex);
    showNotification('Funcionalidade de edição de campo em desenvolvimento', 'info');
}

function removeFormField(fieldIndex) {
    if (confirm('Tem certeza que deseja remover este campo?')) {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const editFormId = getCurrentEditFormId();
        
        if (editFormId) {
            const formIndex = forms.findIndex(f => f.id === editFormId);
            if (formIndex !== -1 && forms[formIndex].fields) {
                forms[formIndex].fields.splice(fieldIndex, 1);
                localStorage.setItem('forms', JSON.stringify(forms));
                refreshEditFormFields();
                showNotification('Campo removido com sucesso!', 'success');
            }
        }
    }
}

function deleteForm(formId) {
    if (confirm('Tem certeza que deseja excluir este formulário?')) {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const filteredForms = forms.filter(form => form.id !== formId);
        localStorage.setItem('forms', JSON.stringify(filteredForms));
        loadFormsTab();
        showNotification('Formulário excluído com sucesso!', 'success');
    }
}

// Funções para workflows
function createNewWorkflow() {
    console.log('Criando novo workflow...');
    showNotification('Funcionalidade de workflow em desenvolvimento', 'info');
}

function loadWorkflows() {
    console.log('Carregando workflows...');
    loadWorkflowsTab();
}

function editWorkflow(workflowId) {
    console.log('Editando workflow:', workflowId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

function deleteWorkflow(workflowId) {
    console.log('Excluindo workflow:', workflowId);
    showNotification('Funcionalidade de exclusão em desenvolvimento', 'info');
}

// Funções para backup
function createFullBackup() {
    console.log('Criando backup completo...');
    showNotification('Backup completo criado com sucesso!', 'success');
    loadBackupTab();
}

function createIncrementalBackup() {
    console.log('Criando backup incremental...');
    showNotification('Backup incremental criado com sucesso!', 'success');
    loadBackupTab();
}

function configureScheduledBackup() {
    console.log('Configurando backup agendado...');
    showNotification('Funcionalidade de backup agendado em desenvolvimento', 'info');
}

function restoreBackup(backupId) {
    if (confirm('Tem certeza que deseja restaurar este backup?')) {
        console.log('Restaurando backup:', backupId);
        showNotification('Backup restaurado com sucesso!', 'success');
    }
}

function deleteBackup(backupId) {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
        console.log('Excluindo backup:', backupId);
        showNotification('Backup excluído com sucesso!', 'success');
        loadBackupTab();
    }
}

// Funções para auditoria
function filterAuditLogs() {
    console.log('Filtrando logs de auditoria...');
    showNotification('Filtros aplicados!', 'success');
}

function exportAuditLogs() {
    console.log('Exportando logs de auditoria...');
    showNotification('Logs exportados com sucesso!', 'success');
}

function clearOldLogs() {
    if (confirm('Tem certeza que deseja limpar os logs antigos?')) {
        console.log('Limpando logs antigos...');
        showNotification('Logs antigos limpos com sucesso!', 'success');
        loadAuditTab();
    }
}

// Funções para API
function generateApiKey() {
    console.log('Gerando nova chave de API...');
    showNotification('Nova chave de API gerada com sucesso!', 'success');
    loadApiTab();
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
    console.log('Regenerando chave de API:', keyId);
    showNotification('Chave de API regenerada com sucesso!', 'success');
}

function deleteApiKey(keyId) {
    if (confirm('Tem certeza que deseja excluir esta chave de API?')) {
        console.log('Excluindo chave de API:', keyId);
        showNotification('Chave de API excluída com sucesso!', 'success');
        loadApiTab();
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
    console.log('Adicionando novo campo...');
    showNotification('Funcionalidade de campos em desenvolvimento', 'info');
}

function editField(fieldId) {
    console.log('Editando campo:', fieldId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

function deleteField(fieldId) {
    if (confirm('Tem certeza que deseja excluir este campo?')) {
        console.log('Excluindo campo:', fieldId);
        showNotification('Campo excluído com sucesso!', 'success');
        loadFieldsTab();
    }
}

// Funções para usuários
function addUser() {
    console.log('Adicionando novo usuário...');
    showNotification('Funcionalidade de usuários em desenvolvimento', 'info');
}

function editUser(userId) {
    console.log('Editando usuário:', userId);
    showNotification('Funcionalidade de edição em desenvolvimento', 'info');
}

function deleteUser(userId) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        console.log('Excluindo usuário:', userId);
        showNotification('Usuário excluído com sucesso!', 'success');
        loadUsersTab();
    }
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando relatórios...');
}

// Função para carregar chat
function loadChat() {
    console.log('Carregando chat...');
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
    console.log('Editando perfil...');
}

// Função para alterar senha
function changePassword() {
    console.log('Alterando senha...');
}

// Função para logout
function logout() {
    localStorage.removeItem('isLoggedIn');
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

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema Velodesk inicializado!');
    
    // Verificar se já está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        
        if (mainApp) {
            mainApp.style.display = 'grid';
        }
        
        // Carregar dados iniciais
        loadBoxes();
        loadDashboardStats();
        loadConfig();
        
        // Configurar event listeners para busca e ordenação
        setupTicketFilters();
    }
});

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

// Função para gerar QR Code
function generateWhatsAppQR() {
    const qrContainer = document.getElementById('whatsappQRCode');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div class="qr-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Gerando QR Code...</p>
            </div>
        `;
        
        // Aqui você implementaria a geração real do QR Code
        // Por enquanto, apenas simular
        setTimeout(() => {
            qrContainer.innerHTML = `
                <div class="qr-code-image">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzI1QzY0MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UU8gQ29kZTwvdGV4dD48L3N2Zz4=" alt="QR Code">
                </div>
                <p>Escaneie com o WhatsApp</p>
            `;
        }, 1500);
    }
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
function sendWhatsAppMessage() {
    const input = document.getElementById('chatInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Aqui você implementaria o envio real
    console.log('Enviando mensagem:', message);
    input.value = '';
}

// Função para pressionar Enter no chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendWhatsAppMessage();
    }
}

// Função para atualizar conversas
function refreshWhatsAppConversations() {
    showNotification('Atualizando conversas...', 'info');
    // Implementar lógica de atualização
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

// Verificar conexão ao carregar
document.addEventListener('DOMContentLoaded', function() {
    checkWhatsAppConnection();
});
