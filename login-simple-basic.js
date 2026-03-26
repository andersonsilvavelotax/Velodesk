// Sistema Velodesk - Versão Ultra Simples
console.log('Sistema Velodesk carregando...');

// Função de login
function fazerLogin() {
    console.log('Fazendo login...');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }
    
    if (mainApp) {
        mainApp.style.display = 'grid';
    }
    
    localStorage.setItem('isLoggedIn', 'true');
    alert('Login realizado com sucesso!');
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
    } else if (page === 'config') {
        loadConfig();
    } else if (page === 'reports') {
        loadReports();
    }
}

// Função para navegação mobile
function navigateToPageMobile(page) {
    navigateToPage(page);
}

// Função para carregar estatísticas do dashboard
function loadDashboardStats() {
    console.log('Carregando estatísticas...');
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let totalTickets = 0;
    
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            totalTickets += box.tickets.length;
        }
    });
    
    // Atualizar elementos do dashboard
    const totalElement = document.getElementById('totalTickets');
    if (totalElement) {
        totalElement.textContent = totalTickets;
    }
}

// Função para carregar caixas Kanban
function loadBoxes() {
    console.log('Carregando caixas...');
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        createDefaultKanbanBoxes();
        return;
    }
    
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) {
        console.log('Container Kanban não encontrado!');
        return;
    }
    
    kanbanContainer.innerHTML = '';
    
    kanbanColumns.forEach(box => {
        const boxElement = createKanbanBox(box);
        kanbanContainer.appendChild(boxElement);
    });
}

// Função para criar caixa Kanban
function createKanbanBox(box) {
    const boxDiv = document.createElement('div');
    boxDiv.className = 'kanban-box';
    boxDiv.setAttribute('data-box-id', box.id);
    
    boxDiv.innerHTML = `
        <div class="box-header">
            <h3>${box.name}</h3>
            <span class="ticket-count">${box.tickets ? box.tickets.length : 0}</span>
        </div>
        <div class="box-content" id="box-${box.id}">
            ${box.tickets ? box.tickets.map(ticket => createTicketElement(ticket)).join('') : ''}
        </div>
    `;
    
    return boxDiv;
}

// Função para criar elemento de ticket
function createTicketElement(ticket) {
    return `
        <div class="ticket" onclick="openTicket(${ticket.id})">
            <h4>${ticket.title}</h4>
            <p>${ticket.description}</p>
            <div class="ticket-meta">
                <span class="ticket-status">${ticket.status}</span>
                <span class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}

// Função para criar caixas Kanban padrão
function createDefaultKanbanBoxes() {
    console.log('Criando caixas padrão...');
    
    const defaultBoxes = [
        { id: 'novos', name: 'Novos', tickets: [] },
        { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
        { id: 'em-espera', name: 'Em Espera', tickets: [] },
        { id: 'resolvidos', name: 'Resolvidos', tickets: [] }
    ];
    
    localStorage.setItem('kanbanColumns', JSON.stringify(defaultBoxes));
    loadBoxes();
}

// Função para abrir ticket
function openTicket(ticketId) {
    console.log('Abrindo ticket:', ticketId);
    alert('Abrindo ticket: ' + ticketId);
}

// Função para criar novo ticket
function createNewTicket() {
    console.log('Criando novo ticket...');
    alert('Função de criar ticket ativada!');
}

// Função para criar nova caixa
function openNewBoxModal() {
    console.log('Abrindo modal de nova caixa...');
    alert('Função de nova caixa ativada!');
}

// Função para criar caixas padrão
function createDefaultBoxes() {
    console.log('Criando caixas padrão...');
    createDefaultKanbanBoxes();
    alert('Caixas padrão criadas!');
}

// Função para atualizar tickets
function refreshTickets() {
    console.log('Atualizando tickets...');
    loadBoxes();
    loadDashboardStats();
    alert('Tickets atualizados!');
}

// Função para pesquisar tickets
function searchTickets() {
    console.log('Pesquisando tickets...');
    alert('Função de pesquisa ativada!');
}

// Função para ordenar tickets
function sortTickets() {
    console.log('Ordenando tickets...');
    alert('Função de ordenação ativada!');
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando relatórios...');
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    console.log(`Notificação [${type}]:`, message);
    alert(message);
}

// Função para abrir assistente IA
function openAIChatbot() {
    console.log('Abrindo assistente IA...');
    alert('Assistente IA ativado!');
}

// Função para fechar assistente IA
function closeAIChatbot() {
    console.log('Fechando assistente IA...');
}

// Função para enviar mensagem IA
function sendAIMessage() {
    console.log('Enviando mensagem IA...');
}

// Função para adicionar mensagem IA
function addAIMessage(text, sender, suggestions = []) {
    console.log('Adicionando mensagem IA:', text);
}

// Função para processar requisição IA
function processAIRequest(message) {
    return {
        text: 'Resposta do assistente IA',
        suggestions: []
    };
}

// Função para lidar com tecla pressionada no chat IA
function handleAIChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema Velodesk inicializado!');
    
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
        
        loadBoxes();
        loadDashboardStats();
    }
});




