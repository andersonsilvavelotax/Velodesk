// Função de login
function fazerLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        
        localStorage.setItem('isLoggedIn', 'true');
        alert('Login realizado com sucesso!');
    }
}

// Função de navegação
function navigateToPage(page) {
    console.log('Navegando para:', page);
    
    // Ocultar container de abas se estiver visível
    const tabsContainer = document.getElementById('ticketTabsContainer');
    const tabsBar = document.getElementById('ticketTabsBar');
    
    if (tabsContainer) {
        tabsContainer.style.display = 'none';
    }
    if (tabsBar) {
        tabsBar.style.display = 'none';
    }
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-page="${page}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Ocultar todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    
    // Mostrar página correspondente
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
        console.log('Página exibida:', page);
    } else {
        console.error('Página não encontrada:', page);
    }
    
    // Carregar dados específicos da página
    if (page === 'tickets') {
        console.log('Carregando página de tickets...');
        if (typeof loadBoxes === 'function') {
            loadBoxes();
        }
    } else if (page === 'chat') {
        console.log('Carregando página de chat...');
        if (typeof loadChat === 'function') {
            loadChat();
        }
    } else if (page === 'config') {
        console.log('Carregando página de configurações...');
        if (typeof loadConfig === 'function') {
            loadConfig();
        }
    } else if (page === 'dashboard') {
        console.log('Carregando dashboard...');
        if (typeof loadDashboardStats === 'function') {
            loadDashboardStats();
        }
    } else if (page === 'reports') {
        console.log('Carregando relatórios...');
        if (typeof loadReports === 'function') {
            loadReports();
        }
    }
}

// Função para abrir modal de nova caixa
function openNewBoxModal() {
    const modal = document.getElementById('newBoxModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Função para fechar modal de nova caixa
function closeNewBoxModal() {
    const modal = document.getElementById('newBoxModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para salvar nova caixa
function saveNewBox() {
    const boxName = document.getElementById('boxName').value;
    const boxUsers = document.getElementById('boxUsers').value;
    
    if (!boxName) {
        alert('Por favor, digite o nome da caixa');
        return;
    }
    
    // Carregar caixas existentes
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Criar nova caixa
    const newBox = {
        id: Date.now().toString(),
        name: boxName,
        users: boxUsers ? boxUsers.split(',').map(user => user.trim()) : [],
        tickets: []
    };
    
    // Adicionar nova caixa
    kanbanColumns.push(newBox);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Fechar modal
    closeNewBoxModal();
    
    // Limpar campos
    document.getElementById('boxName').value = '';
    document.getElementById('boxUsers').value = '';
    
    // Recarregar caixas se estiver na página de tickets
    if (typeof loadBoxes === 'function') {
        loadBoxes();
    }
    
    alert('Caixa criada com sucesso!');
}

// Função para carregar caixas
function loadBoxes() {
    const boxesList = document.getElementById('boxesList');
    if (!boxesList) return;
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        boxesList.innerHTML = '<div class="no-boxes">Nenhuma caixa criada</div>';
        return;
    }
    
    boxesList.innerHTML = kanbanColumns.map(box => `
        <div class="box-item" onclick="selectBox('${box.id}')">
            <div class="box-name">${box.name}</div>
            <div class="box-count">(${box.tickets ? box.tickets.length : 0})</div>
        </div>
    `).join('');
}

// Função para selecionar caixa
function selectBox(boxId) {
    console.log('Selecionando caixa:', boxId);
    
    // Atualizar lista de tickets
    if (typeof loadTicketsForBox === 'function') {
        loadTicketsForBox(boxId);
    }
}

// Função para carregar tickets de uma caixa
function loadTicketsForBox(boxId) {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) return;
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const selectedBox = kanbanColumns.find(box => box.id === boxId);
    
    if (!selectedBox) {
        ticketsList.innerHTML = '<div class="no-tickets">Caixa não encontrada</div>';
        return;
    }
    
    const tickets = selectedBox.tickets || [];
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket nesta caixa</div>';
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket-item" onclick="openTicket('${ticket.id}')">
            <div class="ticket-id">#${ticket.id}</div>
            <div class="ticket-subject">${ticket.subject}</div>
            <div class="ticket-status">${ticket.status}</div>
        </div>
    `).join('');
}

// Função para abrir ticket
function openTicket(ticketId) {
    console.log('Abrindo ticket:', ticketId);
    
    // Encontrar o ticket
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let foundTicket = null;
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                foundTicket = ticket;
                break;
            }
        }
    }
    
    if (!foundTicket) {
        alert('Ticket não encontrado');
        return;
    }
    
    // Criar modal do ticket
    createTicketModal(foundTicket);
}

// Função para criar modal do ticket
function createTicketModal(ticket) {
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
    
    modal.innerHTML = `
        <div class="modal-content ticket-modal">
            <div class="modal-header">
                <h3>Ticket #${ticket.id}</h3>
                <span class="close" onclick="closeTicketModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="ticket-info">
                    <div class="ticket-field">
                        <label>Assunto:</label>
                        <input type="text" id="ticketSubject" value="${ticket.subject || ''}" class="form-input">
                    </div>
                    <div class="ticket-field">
                        <label>Status:</label>
                        <select id="ticketStatus" class="form-select">
                            <option value="novo" ${ticket.status === 'novo' ? 'selected' : ''}>Novo</option>
                            <option value="em-aberto" ${ticket.status === 'em-aberto' ? 'selected' : ''}>Em Andamento</option>
                            <option value="em-espera" ${ticket.status === 'em-espera' ? 'selected' : ''}>Em Espera</option>
                            <option value="pendente" ${ticket.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="resolvido" ${ticket.status === 'resolvido' ? 'selected' : ''}>Resolvido</option>
                        </select>
                    </div>
                    <div class="ticket-field">
                        <label>Descrição:</label>
                        <textarea id="ticketDescription" class="form-textarea" rows="4">${ticket.description || ''}</textarea>
                    </div>
                </div>
                
                <div class="ticket-actions">
                    <button class="btn-primary" onclick="saveTicket('${ticket.id}')">Salvar</button>
                    <button class="btn-secondary" onclick="closeTicketModal()">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para fechar modal do ticket
function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    if (modal) {
        modal.remove();
    }
}

// Função para salvar ticket
function saveTicket(ticketId) {
    const subject = document.getElementById('ticketSubject').value;
    const status = document.getElementById('ticketStatus').value;
    const description = document.getElementById('ticketDescription').value;
    
    if (!subject) {
        alert('Por favor, digite o assunto do ticket');
        return;
    }
    
    // Carregar caixas
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar e atualizar ticket
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.subject = subject;
                ticket.status = status;
                ticket.description = description;
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Fechar modal
    closeTicketModal();
    
    // Recarregar lista de tickets
    const ticketsList = document.getElementById('ticketsList');
    if (ticketsList) {
        // Encontrar a caixa atual
        const currentBox = kanbanColumns.find(box => 
            box.tickets && box.tickets.some(t => t.id === ticketId)
        );
        if (currentBox) {
            loadTicketsForBox(currentBox.id);
        }
    }
    
    alert('Ticket salvo com sucesso!');
}

// Função para carregar dashboard
function loadDashboardStats() {
    console.log('Carregando estatísticas do dashboard...');
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    const stats = {
        total: 0,
        novo: 0,
        'em-aberto': 0,
        'em-espera': 0,
        pendente: 0,
        resolvido: 0
    };
    
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            box.tickets.forEach(ticket => {
                stats.total++;
                if (stats[ticket.status] !== undefined) {
                    stats[ticket.status]++;
                }
            });
        }
    });
    
    const totalElement = document.getElementById('totalTickets');
    if (totalElement) {
        totalElement.textContent = stats.total;
    }
}

// Função para carregar chat
function loadChat() {
    console.log('Carregando chat...');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    chatMessages.innerHTML = `
        <div class="no-messages">
            <i class="fas fa-comments"></i>
            <p>Nenhuma conversa ativa</p>
            <small>As conversas aparecerão aqui quando houver atividade</small>
        </div>
    `;
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando relatórios...');
}

// Função para criar novo ticket
function createNewTicket() {
    // Encontrar a primeira caixa disponível
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        alert('Por favor, crie uma caixa primeiro');
        return;
    }
    
    const firstBox = kanbanColumns[0];
    
    // Criar novo ticket
    const newTicket = {
        id: Date.now().toString(),
        subject: 'Novo Ticket',
        description: '',
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Adicionar ticket à primeira caixa
    if (!firstBox.tickets) {
        firstBox.tickets = [];
    }
    firstBox.tickets.push(newTicket);
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Recarregar lista de tickets
    loadTicketsForBox(firstBox.id);
    
    // Abrir o ticket criado
    openTicket(newTicket.id);
    
    alert('Ticket criado com sucesso!');
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicação inicializada');
});
