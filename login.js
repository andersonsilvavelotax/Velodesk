// Função de login simples
function fazerLogin() {
    alert('Função fazerLogin chamada!');
    
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
        alert('Tela de login ocultada!');
    } else {
        alert('Elemento loginScreen não encontrado!');
        return;
    }
    
    if (mainApp) {
        mainApp.style.display = 'grid';
        alert('Aplicação principal exibida!');
    } else {
        alert('Elemento mainApp não encontrado!');
        return;
    }
    
    localStorage.setItem('isLoggedIn', 'true');
    alert('Login realizado com sucesso!');
}

// Função de navegação
function navigateToPage(page) {
    console.log('Navegando para:', page);
    
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
    const boxStatus = document.getElementById('boxStatus').value;
    const boxColor = document.getElementById('boxColor').value;
    const boxDescription = document.getElementById('boxDescription').value;
    
    if (!boxName.trim()) {
        alert('Por favor, insira o nome da caixa');
        return;
    }
    
    // Criar nova caixa
    const newBox = {
        id: Date.now().toString(),
        name: boxName,
        status: boxStatus,
        color: boxColor,
        description: boxDescription,
        tickets: []
    };
    
    // Salvar no localStorage
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    kanbanColumns.push(newBox);
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Fechar modal
    closeNewBoxModal();
    
    // Recarregar caixas se estivermos na página de tickets
    if (typeof loadBoxes === 'function') {
        loadBoxes();
    }
    
    // Limpar formulário
    document.getElementById('boxName').value = '';
    document.getElementById('boxStatus').value = 'Novo';
    document.getElementById('boxColor').value = '#000058';
    document.getElementById('boxDescription').value = '';
    
    alert('Caixa criada com sucesso!');
}

// Função para carregar caixas
function loadBoxes() {
    const boxesList = document.getElementById('boxesList');
    if (!boxesList) {
        return;
    }
    
    // Carregar caixas do localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Limpar lista atual
    boxesList.innerHTML = '';
    
    // Criar elementos para cada caixa
    kanbanColumns.forEach(box => {
        const boxElement = document.createElement('div');
        boxElement.className = 'box-item';
        boxElement.onclick = () => selectBox(box.id);
        
        const ticketCount = box.tickets ? box.tickets.length : 0;
        const countText = ticketCount.toString().padStart(2, '0');
        
        boxElement.innerHTML = `
            <div class="box-header">
                <div class="box-title" style="color: ${box.color}">${box.name}</div>
                <div class="box-count">(${countText})</div>
            </div>
        `;
        
        boxesList.appendChild(boxElement);
    });
}

// Função para selecionar caixa
function selectBox(boxId) {
    // Atualizar seleção visual
    document.querySelectorAll('.box-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedBox = document.querySelector(`[onclick*="${boxId}"]`);
    if (selectedBox) {
        selectedBox.classList.add('selected');
    }
    
    // Carregar tickets da caixa
    loadTicketsForBox(boxId);
}

// Função para carregar tickets de uma caixa
function loadTicketsForBox(boxId) {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) {
        return;
    }
    
    // Carregar caixas do localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const selectedBox = kanbanColumns.find(box => box.id === boxId);
    
    if (!selectedBox) {
        return;
    }
    
    // Limpar lista atual
    ticketsList.innerHTML = '';
    
    // Mostrar tickets da caixa
    const tickets = selectedBox.tickets || [];
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">Nenhum ticket nesta caixa</div>';
        return;
    }
    
    // Criar elementos para cada ticket
    tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-item';
        ticketElement.onclick = () => openTicketModal(ticket.id);
        
        // Formatar status para CSS
        const statusClass = ticket.status.toLowerCase().replace(/\s+/g, '-');
        
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
        
        // Formatar data de criação
        const createdDate = new Date(ticket.createdAt);
        const formattedDate = createdDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Responsável (por enquanto fixo, pode ser expandido depois)
        const responsible = ticket.responsible || 'Não atribuído';
        
        ticketElement.innerHTML = `
            <div class="ticket-drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="ticket-content">
                <div class="ticket-header-horizontal">
                    <div class="ticket-id-section">
                        <span class="status-icon" style="background-color: ${statusColor}"></span>
                        <span class="ticket-id">#${ticket.id}</span>
                    </div>
                    <div class="ticket-status-badge status-${statusClass}">${statusName}</div>
                </div>
                <div class="ticket-subject-horizontal">${ticket.subject}</div>
                <div class="ticket-info-horizontal">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span>${responsible}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>
        `;
        
        ticketsList.appendChild(ticketElement);
    });
}

// Função para abrir ticket
function openTicketModal(ticketId) {
    console.log('Abrindo ticket:', ticketId);
    
    // Carregar caixas do localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar o ticket em todas as caixas
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
    
    // Criar aba para o ticket
    createTicketTab(foundTicket, foundBox);
}

// Função para criar aba de ticket
function createTicketTab(ticket, box) {
    const tabId = 'tab-' + ticket.id;
    
    // Verificar se a aba já existe
    if (document.getElementById(tabId)) {
        switchToTicketTab(tabId);
        return;
    }
    
    // Mostrar barra de abas se estiver oculta
    const tabsBar = document.getElementById('ticketTabsBar');
    if (tabsBar) {
        tabsBar.style.display = 'block';
    } else {
        console.error('ticketTabsBar não encontrado!');
        return;
    }
    
    // Criar elemento da aba
    const tabsList = document.getElementById('tabsList');
    if (tabsList) {
        const tabElement = document.createElement('div');
        tabElement.className = 'ticket-tab active';
        tabElement.id = tabId;
        tabElement.innerHTML = `
            <span class="ticket-tab-title">#${ticket.id} - ${ticket.subject}</span>
            <span class="ticket-tab-close" onclick="closeTicketTab('${tabId}')">&times;</span>
        `;
        tabsList.appendChild(tabElement);
        
        // Adicionar evento de clique na aba
        tabElement.addEventListener('click', () => switchToTicketTab(tabId));
    }
    
    // Criar conteúdo da aba
    createTicketTabContent(ticket, box, tabId);
    
    // Ativar a aba
    switchToTicketTab(tabId);
}

// Funções auxiliares para status
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

// Função para criar conteúdo da aba
function createTicketTabContent(ticket, box, tabId) {
    const tabsContainer = document.getElementById('ticketTabsContainer');
    if (!tabsContainer) {
        console.error('ticketTabsContainer não encontrado!');
        return;
    }
    
    const tabContent = document.createElement('div');
    tabContent.className = 'ticket-tab-content active';
    tabContent.id = tabId + '-content';
    
    tabContent.innerHTML = `
        <div class="ticket-layout">
            <!-- Coluna Principal -->
            <div class="ticket-main-column">
                <!-- Cabeçalho do Ticket -->
                <div class="ticket-header">
                    <div class="ticket-status-info">
                        <div class="current-status">
                            <span class="status-indicator" style="background-color: ${getStatusColor(ticket.status)}"></span>
                            <span class="status-text">${getStatusName(ticket.status)} #${ticket.id}</span>
                        </div>
                    </div>
                </div>

                <!-- Informações do Ticket -->
                <div class="ticket-details">
                    <div class="ticket-meta">
                        <div class="meta-item">
                            <span class="meta-label">Status:</span>
                            <span class="meta-value status-${ticket.status}">${ticket.status}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Abertura:</span>
                            <span class="meta-value">${new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Recebimento:</span>
                            <span class="meta-value">${new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Canal:</span>
                            <span class="meta-value">Email</span>
                        </div>
                    </div>
                </div>

                <!-- Linha do Tempo -->
                <div class="ticket-timeline">
                    <h4>Histórico de Atendimento</h4>
                    <div class="timeline-container">
                        ${ticket.messages ? ticket.messages.map(msg => `
                            <div class="timeline-item">
                                <div class="timeline-marker">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <span class="agent-name">${msg.author}</span>
                                        <span class="timeline-date">${new Date(msg.date).toLocaleString()}</span>
                                    </div>
                                    <div class="timeline-message">${msg.content}</div>
                                </div>
                            </div>
                        `).join('') : ''}
                        ${ticket.internalNotes ? ticket.internalNotes.map(note => `
                            <div class="timeline-item internal">
                                <div class="timeline-marker internal">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <span class="agent-name">${note.author} (Interno)</span>
                                        <span class="timeline-date">${new Date(note.date).toLocaleString()}</span>
                                    </div>
                                    <div class="timeline-message">${note.content}</div>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <!-- Área de Resposta -->
                <div class="ticket-response">
                    <div class="response-tabs">
                        <button class="response-tab active" data-tab="public" onclick="switchResponseTab('tab-${ticket.id}', 'public')">Resposta Pública</button>
                        <button class="response-tab" data-tab="internal" onclick="switchResponseTab('tab-${ticket.id}', 'internal')">Anotação Interna</button>
                    </div>
                    
                    <div class="response-content">
                        <div class="response-tab-content active" id="public-${ticket.id}">
                            <div class="response-form">
                                <div class="response-toolbar">
                                    <button type="button" class="toolbar-btn" title="Negrito" onclick="formatText('bold', 'public')"><i class="fas fa-bold"></i></button>
                                    <button type="button" class="toolbar-btn" title="Itálico" onclick="formatText('italic', 'public')"><i class="fas fa-italic"></i></button>
                                    <button type="button" class="toolbar-btn" title="Link" onclick="insertLink('public')"><i class="fas fa-link"></i></button>
                                    <button type="button" class="toolbar-btn" title="Ticket Link" onclick="insertTicketLink('public')"><i class="fas fa-ticket-alt"></i></button>
                                </div>
                                <textarea class="response-textarea" placeholder="Digite sua resposta..." rows="4"></textarea>
                                <div class="response-actions">
                                    <button type="button" class="btn-secondary ai-assistant-btn" onclick="openAIAssistant()">
                                        <i class="fas fa-robot"></i> Assistente IA
                                    </button>
                                    <div class="dropdown-container">
                                        <button type="button" class="btn-primary dropdown-btn" onclick="toggleStatusDropdown('public')">
                                            Enviar como: Resolvido <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div class="dropdown-menu" id="statusDropdown">
                                            <div class="dropdown-item" onclick="sendAsStatus('novo')">
                                                <span class="status-indicator novo"></span>
                                                <span>Novo</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('em-aberto')">
                                                <span class="status-indicator em-aberto"></span>
                                                <span>Em Andamento</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('em-espera')">
                                                <span class="status-indicator em-espera"></span>
                                                <span>Em Espera</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('pendente')">
                                                <span class="status-indicator pendente"></span>
                                                <span>Pendente</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('resolvido')">
                                                <span class="status-indicator resolvido"></span>
                                                <span>Resolvido</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="response-tab-content" id="internal-${ticket.id}">
                            <div class="response-form internal-form">
                                <div class="internal-note-header">
                                    <i class="fas fa-lock"></i>
                                    <span>Anotação Interna - Não será enviada ao cliente</span>
                                </div>
                                <div class="response-toolbar">
                                    <button type="button" class="toolbar-btn" title="Negrito" onclick="formatText('bold', 'internal')"><i class="fas fa-bold"></i></button>
                                    <button type="button" class="toolbar-btn" title="Itálico" onclick="formatText('italic', 'internal')"><i class="fas fa-italic"></i></button>
                                    <button type="button" class="toolbar-btn" title="Link" onclick="insertLink('internal')"><i class="fas fa-link"></i></button>
                                    <button type="button" class="toolbar-btn" title="Ticket Link" onclick="insertTicketLink('internal')"><i class="fas fa-ticket-alt"></i></button>
                                </div>
                                <textarea class="response-textarea internal-textarea" placeholder="Digite uma anotação interna..." rows="4"></textarea>
                                <div class="response-actions">
                                    <button type="button" class="btn-secondary ai-assistant-btn" onclick="openAIAssistant()">
                                        <i class="fas fa-robot"></i> Assistente IA
                                    </button>
                                    <div class="dropdown-container">
                                        <button type="button" class="btn-primary dropdown-btn" onclick="toggleStatusDropdown('internal')">
                                            Enviar como: Resolvido <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <div class="dropdown-menu" id="statusDropdownInternal">
                                            <div class="dropdown-item" onclick="sendAsStatus('novo')">
                                                <span class="status-indicator novo"></span>
                                                <span>Novo</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('em-aberto')">
                                                <span class="status-indicator em-aberto"></span>
                                                <span>Em Andamento</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('em-espera')">
                                                <span class="status-indicator em-espera"></span>
                                                <span>Em Espera</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('pendente')">
                                                <span class="status-indicator pendente"></span>
                                                <span>Pendente</span>
                                            </div>
                                            <div class="dropdown-item" onclick="sendAsStatus('resolvido')">
                                                <span class="status-indicator resolvido"></span>
                                                <span>Resolvido</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Coluna Lateral - Configurações -->
            <div class="ticket-sidebar">
                <div class="sidebar-section">
                    <h3>Configurações</h3>
                    <h4>Aplicativos</h4>
                    
                    <div class="form-fields">
                        <!-- Seção 1: Informações Básicas -->
                        <div class="form-section">
                            <h5>Informações Básicas</h5>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>Solicitante / Cliente</label>
                                    <div class="client-info">
                                        <input type="text" class="form-input" placeholder="Nome do cliente" value="João Silva">
                                        <button class="copy-btn" title="Copiar email"><i class="fas fa-copy"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>Responsável</label>
                                    <input type="text" class="form-input" placeholder="Nome do responsável">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>CPF do Titular</label>
                                    <input type="text" class="form-input" placeholder="000.000.000-00">
                                </div>
                            </div>
                        </div>

                        <!-- Seção 3: Detalhes -->
                        <div class="form-section">
                            <h5>Detalhes</h5>
                            <div class="form-field">
                                <label>Detalhe</label>
                                <textarea class="form-textarea" placeholder="Detalhes adicionais" rows="2"></textarea>
                            </div>
                        </div>

                        <!-- Seção 4: Ações -->
                        <div class="form-section">
                            <h5>Ações</h5>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>Escalar Chamado</label>
                                    <select class="form-select">
                                        <option>Não escalar</option>
                                        <option>Escalar para supervisor</option>
                                        <option>Escalar para gerência</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-field">
                                    <label>Reatribuição</label>
                                    <select class="form-select">
                                        <option>Manter responsável atual</option>
                                        <option>Reatribuir</option>
                                        <option>Devolver</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                </div>
            </div>
        </div>
        
    `;
    
    tabsContainer.appendChild(tabContent);
    
    // Mostrar container de abas
    tabsContainer.style.display = 'block';
    
    // Adicionar event listeners
    setupTicketTabEvents(tabId);
}

// Função para configurar eventos da aba
function setupTicketTabEvents(tabId) {
    const tabContent = document.getElementById(tabId + '-content');
    if (!tabContent) return;
    
    // Event listeners para campos editáveis
    const subjectInput = tabContent.querySelector('.ticket-subject-input');
    if (subjectInput) {
        subjectInput.addEventListener('blur', () => saveTicketFromTab(tabId));
    }
    
    const statusSelect = tabContent.querySelector('.ticket-status-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => saveTicketFromTab(tabId));
    }
    
    const prioritySelect = tabContent.querySelector('.ticket-priority-select');
    if (prioritySelect) {
        prioritySelect.addEventListener('change', () => saveTicketFromTab(tabId));
    }
    
    // Event listeners para abas de resposta (agora usando onclick direto no HTML)
    // const responseTabs = tabContent.querySelectorAll('.response-tab');
    // responseTabs.forEach(btn => {
    //     btn.addEventListener('click', () => {
    //         const tabType = btn.getAttribute('data-tab');
    //         switchResponseTab(tabId, tabType);
    //     });
    // });
}

// Função para trocar aba de ticket
function switchToTicketTab(tabId) {
    // Remover ativo de todas as abas
    document.querySelectorAll('.ticket-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.ticket-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar aba selecionada
    const tab = document.getElementById(tabId);
    const content = document.getElementById(tabId + '-content');
    
    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');
}

// Função para fechar aba de ticket
function closeTicketTab(tabId) {
    const tab = document.getElementById(tabId);
    const content = document.getElementById(tabId + '-content');
    
    if (tab) tab.remove();
    if (content) content.remove();
    
    // Se não há mais abas, ocultar barra e voltar para página de tickets
    const tabsList = document.getElementById('tabsList');
    if (tabsList && tabsList.children.length === 0) {
        const tabsBar = document.getElementById('ticketTabsBar');
        const tabsContainer = document.getElementById('ticketTabsContainer');
        
        if (tabsBar) {
            tabsBar.style.display = 'none';
        }
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }
        
        // Voltar para a página de tickets
        showTicketsPage();
    }
}

// Função para mostrar página de tickets
function showTicketsPage() {
    console.log('Voltando para página de tickets...');
    
    // Ocultar container de abas
    const tabsContainer = document.getElementById('ticketTabsContainer');
    if (tabsContainer) {
        tabsContainer.style.display = 'none';
    }
    
    const tabsBar = document.getElementById('ticketTabsBar');
    if (tabsBar) {
        tabsBar.style.display = 'none';
    }
    
    // Ocultar todas as páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // Mostrar página de tickets
    const ticketsPage = document.getElementById('tickets');
    if (ticketsPage) {
        ticketsPage.style.display = 'block';
        ticketsPage.classList.add('active');
        console.log('Página de tickets exibida');
    } else {
        console.error('Página de tickets não encontrada');
    }
    
    // Atualizar menu ativo
    const menuItems = document.querySelectorAll('.nav-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const ticketsMenuItem = document.querySelector('[onclick*="tickets"]');
    if (ticketsMenuItem) {
        ticketsMenuItem.classList.add('active');
    }
}

// Função para trocar abas de resposta
function switchResponseTab(tabId, tabType) {
    console.log('Trocando para aba:', tabType);
    
    const tabContent = document.getElementById(tabId + '-content');
    if (!tabContent) {
        console.error('Conteúdo da aba não encontrado');
        return;
    }
    
    // Remover ativo de todos os botões
    tabContent.querySelectorAll('.response-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Remover ativo de todos os conteúdos
    tabContent.querySelectorAll('.response-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar botão selecionado
    const activeBtn = tabContent.querySelector(`[data-tab="${tabType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Ativar conteúdo selecionado
    const ticketId = tabId.split('-')[1];
    const activeContent = tabContent.querySelector(`#${tabType}-${ticketId}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    // Aplicar estilo especial para anotação interna
    const internalTextarea = tabContent.querySelector('.internal-textarea');
    if (tabType === 'internal' && internalTextarea) {
        internalTextarea.classList.add('internal-active');
    } else if (internalTextarea) {
        internalTextarea.classList.remove('internal-active');
    }
}

// Função para salvar ticket da aba
function saveTicketFromTab(tabId) {
    const ticketId = tabId.split('-')[1];
    const tabContent = document.getElementById(tabId + '-content');
    if (!tabContent) return;
    
    const subject = tabContent.querySelector('.ticket-subject-input').value;
    const status = tabContent.querySelector('.ticket-status-select').value;
    const priority = tabContent.querySelector('.ticket-priority-select').value;
    
    // Carregar caixas do localStorage
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar e atualizar ticket
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.subject = subject;
                ticket.status = status;
                ticket.priority = priority;
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Atualizar título da aba
    const tab = document.getElementById(tabId);
    if (tab) {
        const titleSpan = tab.querySelector('.ticket-tab-title');
        if (titleSpan) {
            titleSpan.textContent = `#${ticketId} - ${subject}`;
        }
    }
}

// Função para salvar anotação interna
function saveInternalNote(ticketId) {
    const tabContent = document.getElementById(`tab-${ticketId}-content`);
    if (!tabContent) return;
    
    const internalTextarea = tabContent.querySelector('.internal-textarea');
    if (!internalTextarea) return;
    
    const noteContent = internalTextarea.value.trim();
    if (!noteContent) {
        alert('Por favor, digite uma anotação interna');
        return;
    }
    
    // Carregar caixas do localStorage
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar o ticket
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
    
    // Inicializar array de anotações internas se não existir
    if (!foundTicket.internalNotes) {
        foundTicket.internalNotes = [];
    }
    
    // Adicionar nova anotação interna
    const newNote = {
        id: Date.now().toString(),
        content: noteContent,
        author: 'Agente', // Por enquanto fixo, pode ser expandido
        date: new Date().toISOString(),
        type: 'internal'
    };
    
    foundTicket.internalNotes.push(newNote);
    foundTicket.updatedAt = new Date().toISOString();
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Limpar textarea
    internalTextarea.value = '';
    
    // Mostrar sucesso
    alert('Anotação interna salva com sucesso!');
    
    // Recarregar timeline se estiver visível
    updateTicketTimeline(ticketId);
}

// Função para atualizar timeline do ticket
function updateTicketTimeline(ticketId) {
    const tabContent = document.getElementById(`tab-${ticketId}-content`);
    if (!tabContent) return;
    
    // Carregar ticket atualizado
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
    
    if (!foundTicket) return;
    
    // Atualizar timeline
    const timelineContainer = tabContent.querySelector('.timeline-container');
    if (timelineContainer) {
        let timelineHTML = '';
        
        // Adicionar mensagens públicas
        if (foundTicket.messages) {
            foundTicket.messages.forEach(msg => {
                timelineHTML += `
                    <div class="timeline-item">
                        <div class="timeline-marker">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="agent-name">${msg.author}</span>
                                <span class="timeline-date">${new Date(msg.date).toLocaleString()}</span>
                            </div>
                            <div class="timeline-message">${msg.content}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Adicionar anotações internas
        if (foundTicket.internalNotes) {
            foundTicket.internalNotes.forEach(note => {
                timelineHTML += `
                    <div class="timeline-item internal">
                        <div class="timeline-marker internal">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="agent-name">${note.author} (Interno)</span>
                                <span class="timeline-date">${new Date(note.date).toLocaleString()}</span>
                            </div>
                            <div class="timeline-message">${note.content}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        timelineContainer.innerHTML = timelineHTML;
    }
}

// Função para adicionar mensagem
function addTicketMessage(event, ticketId) {
    event.preventDefault();
    const form = event.target;
    const textarea = form.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) return;
    
    // Adicionar mensagem ao ticket
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                if (!ticket.messages) ticket.messages = [];
                ticket.messages.push({
                    author: 'Agente',
                    content: content,
                    date: new Date().toISOString()
                });
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Limpar formulário
    textarea.value = '';
    
    // Recarregar conteúdo da aba
    const tabId = 'tab-' + ticketId;
    const tabContent = document.getElementById(tabId + '-content');
    if (tabContent) {
        // Recarregar apenas a seção de mensagens
        const messagesContainer = tabContent.querySelector('.messages-container');
        if (messagesContainer) {
            // Adicionar nova mensagem visualmente
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-item';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-author">Agente</span>
                    <span class="message-date">${new Date().toLocaleString()}</span>
                </div>
                <div class="message-content">${content}</div>
            `;
            messagesContainer.appendChild(messageDiv);
        }
    }
}

// Função para adicionar nota interna
function addInternalNote(event, ticketId) {
    event.preventDefault();
    const form = event.target;
    const textarea = form.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) return;
    
    // Adicionar nota interna ao ticket
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                if (!ticket.internalNotes) ticket.internalNotes = [];
                ticket.internalNotes.push({
                    author: 'Agente',
                    content: content,
                    date: new Date().toISOString()
                });
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Limpar formulário
    textarea.value = '';
    
    // Recarregar conteúdo da aba
    const tabId = 'tab-' + ticketId;
    const tabContent = document.getElementById(tabId + '-content');
    if (tabContent) {
        // Recarregar apenas a seção de notas internas
        const notesContainer = tabContent.querySelector('.internal-notes-container');
        if (notesContainer) {
            // Adicionar nova nota visualmente
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.innerHTML = `
                <div class="note-header">
                    <span class="note-author">Agente</span>
                    <span class="note-date">${new Date().toLocaleString()}</span>
                </div>
                <div class="note-content">${content}</div>
            `;
            notesContainer.appendChild(noteDiv);
        }
    }
}

// Função para alternar dropdown de status
function toggleStatusDropdown(type = 'public') {
    const dropdownId = type === 'internal' ? 'statusDropdownInternal' : 'statusDropdown';
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Função para enviar como status específico
function sendAsStatus(status) {
    const statusNames = {
        'novo': 'Novo',
        'em-aberto': 'Em Andamento',
        'em-espera': 'Em Espera',
        'pendente': 'Pendente',
        'resolvido': 'Resolvido'
    };
    
    const statusName = statusNames[status] || status;
    
    // Encontrar o ticket atual (assumindo que estamos em uma aba)
    const activeTab = document.querySelector('.ticket-tab.active');
    if (!activeTab) {
        alert('Nenhum ticket ativo encontrado');
        return;
    }
    
    const ticketId = activeTab.id.replace('tab-', '');
    
    // Verificar se estamos na aba de anotação interna
    const activeResponseTab = document.querySelector('.response-tab.active');
    const isInternalTab = activeResponseTab && activeResponseTab.getAttribute('data-tab') === 'internal';
    
    // Se for anotação interna, salvar a anotação junto com o status
    if (isInternalTab) {
        const internalTextarea = document.querySelector('.internal-textarea');
        if (internalTextarea && internalTextarea.value.trim()) {
            // Salvar anotação interna
            saveInternalNote(ticketId);
        }
    }
    
    // Atualizar status do ticket no localStorage
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === ticketId);
            if (ticket) {
                ticket.status = status;
                ticket.updatedAt = new Date().toISOString();
                break;
            }
        }
    }
    
    // Salvar no localStorage
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    // Atualizar interface do ticket
    updateTicketStatusDisplay(ticketId, status, statusName);
    
    // Fechar dropdown
    const activeResponseTab = document.querySelector('.response-tab.active');
    const isInternalTab = activeResponseTab && activeResponseTab.getAttribute('data-tab') === 'internal';
    const dropdownId = isInternalTab ? 'statusDropdownInternal' : 'statusDropdown';
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    
    if (isInternalTab) {
        alert(`Status alterado para: ${statusName} e anotação interna salva!`);
    } else {
        alert(`Status alterado para: ${statusName}`);
    }
}

// Função para atualizar a exibição do status no ticket
function updateTicketStatusDisplay(ticketId, status, statusName) {
    const tabContent = document.getElementById('tab-' + ticketId + '-content');
    if (!tabContent) return;
    
    // Atualizar o status na seção de metadados
    const statusElement = tabContent.querySelector('.meta-value.status-' + status);
    if (statusElement) {
        statusElement.textContent = statusName;
    }
    
    // Atualizar o select de status se existir
    const statusSelect = tabContent.querySelector('.ticket-status-select');
    if (statusSelect) {
        statusSelect.value = status;
    }
    
    // Atualizar o status no cabeçalho
    const currentStatus = tabContent.querySelector('.current-status');
    if (currentStatus) {
        const statusText = currentStatus.querySelector('.status-text');
        const statusIndicator = currentStatus.querySelector('.status-indicator');
        
        if (statusText) {
            // Extrair o número do ticket do texto atual
            const currentText = statusText.textContent;
            const ticketNumber = currentText.match(/#\d+/);
            statusText.textContent = `${statusName} ${ticketNumber ? ticketNumber[0] : '#' + ticketId}`;
        }
        if (statusIndicator) {
            statusIndicator.style.backgroundColor = getStatusColor(status);
        }
    }
    
    // Recarregar a listagem de tickets para atualizar o ícone
    const selectedBox = document.querySelector('.box-item.selected');
    if (selectedBox) {
        const boxId = selectedBox.getAttribute('data-box-id');
        if (boxId) {
            loadTicketsForBox(boxId);
        }
    }
}

// Função para abrir modal de criação de ticket
function openCreateTicketModal() {
    const modal = document.getElementById('createTicketModal');
    if (modal) {
        modal.style.display = 'block';
        loadBoxesForTicket();
    }
}

// Função para fechar modal de criação de ticket
function closeCreateTicketModal() {
    const modal = document.getElementById('createTicketModal');
    if (modal) {
        modal.style.display = 'none';
        // Limpar formulário
        document.getElementById('ticketSubject').value = '';
        document.getElementById('ticketDescription').value = '';
        document.getElementById('ticketPriority').value = 'baixa';
        document.getElementById('ticketStatus').value = 'novo';
        document.getElementById('ticketBox').value = '';
    }
}

// Função para carregar caixas no select do modal de ticket
function loadBoxesForTicket() {
    const ticketBoxSelect = document.getElementById('ticketBox');
    if (!ticketBoxSelect) return;
    
    // Limpar opções existentes (exceto a primeira)
    ticketBoxSelect.innerHTML = '<option value="">Selecione uma caixa</option>';
    
    // Carregar caixas do localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Adicionar opções para cada caixa
    kanbanColumns.forEach(box => {
        const option = document.createElement('option');
        option.value = box.id;
        option.textContent = box.name;
        ticketBoxSelect.appendChild(option);
    });
}

// Função para salvar novo ticket
function saveNewTicket() {
    const subject = document.getElementById('ticketSubject').value;
    const description = document.getElementById('ticketDescription').value;
    const priority = document.getElementById('ticketPriority').value;
    const status = document.getElementById('ticketStatus').value;
    const boxId = document.getElementById('ticketBox').value;
    
    if (!subject.trim() || !description.trim() || !boxId) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    // Criar novo ticket
    const newTicket = {
        id: Date.now().toString(),
        subject: subject,
        description: description,
        priority: priority,
        status: status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        internalNotes: []
    };
    
    // Carregar caixas do localStorage
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Encontrar a caixa selecionada
    const selectedBox = kanbanColumns.find(box => box.id === boxId);
    if (selectedBox) {
        // Adicionar ticket à caixa
        if (!selectedBox.tickets) {
            selectedBox.tickets = [];
        }
        selectedBox.tickets.push(newTicket);
        
        // Salvar no localStorage
        localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
        
        // Fechar modal
        closeCreateTicketModal();
        
        // Recarregar caixas se estivermos na página de tickets
        if (typeof loadBoxes === 'function') {
            loadBoxes();
        }
        
        // Se a caixa estiver selecionada, recarregar seus tickets
        const selectedBoxElement = document.querySelector('.box-item.selected');
        if (selectedBoxElement) {
            loadTicketsForBox(boxId);
        }
        
        alert('Ticket criado com sucesso!');
    } else {
        alert('Erro: Caixa não encontrada');
    }
}

// Função para configurar menu de configurações
function setupConfigMenu() {
    const menuItems = document.querySelectorAll('.config-menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remover ativo de todos os itens
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // Adicionar ativo ao item clicado
            item.classList.add('active');
            
            // Esconder todos os conteúdos
            const allContents = document.querySelectorAll('.config-tab-content');
            allContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostrar conteúdo correspondente
            const tabId = item.getAttribute('data-config-tab');
            const targetContent = document.getElementById(tabId + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
    loadUsers();
}

// Função para carregar usuários
function loadUsers() {
    console.log('Carregando usuários...');
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="no-data">Nenhum usuário cadastrado</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-phone">${user.phone}</div>
                <div class="user-access-level">${user.accessLevel}</div>
            </div>
            <div class="user-actions">
                <button class="user-action-btn edit-user-btn" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="user-action-btn delete-user-btn" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Função para carregar configurações de tickets
function loadTicketConfig() {
    console.log('Carregando configurações de tickets...');
    // Por enquanto, apenas log
}

// Função para carregar estatísticas do dashboard
function loadDashboardStats() {
    console.log('Carregando estatísticas do dashboard...');
    
    // Carregar caixas do localStorage
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    // Contar tickets por status
    const stats = {
        total: 0,
        novo: 0,
        'em-aberto': 0,
        'em-espera': 0,
        pendente: 0,
        resolvido: 0
    };
    
    // Percorrer todas as caixas e contar tickets
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
    
    // Atualizar elementos do DOM
    document.getElementById('totalTickets').textContent = stats.total;
    document.getElementById('novoTickets').textContent = stats.novo;
    document.getElementById('emAndamentoTickets').textContent = stats['em-aberto'];
    document.getElementById('emEsperaTickets').textContent = stats['em-espera'];
    document.getElementById('pendenteTickets').textContent = stats.pendente;
    document.getElementById('resolvidoTickets').textContent = stats.resolvido;
    
    console.log('Estatísticas carregadas:', stats);
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando página de relatórios...');
    
    // Definir datas padrão (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// Funções para gerar relatórios
function generatePerformanceReport() {
    alert('Relatório de Performance será gerado em breve!');
    console.log('Gerando relatório de performance...');
}

function generateAttendanceReport() {
    alert('Relatório de Atendimento será gerado em breve!');
    console.log('Gerando relatório de atendimento...');
}

function generateSLAReport() {
    alert('Relatório de SLA será gerado em breve!');
    console.log('Gerando relatório de SLA...');
}

function generateCategoryReport() {
    alert('Relatório por Categoria será gerado em breve!');
    console.log('Gerando relatório por categoria...');
}

// Função para carregar chat
function loadChat() {
    console.log('Carregando chat...');
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Por enquanto, apenas uma mensagem de exemplo
    chatMessages.innerHTML = `
        <div class="no-messages">
            <i class="fas fa-comments"></i>
            <p>Nenhuma conversa ativa</p>
            <small>As conversas aparecerão aqui quando houver atividade</small>
        </div>
    `;
}

// Função para alternar menu do perfil
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    const btn = document.getElementById('profileBtn');
    
    if (!menu || !btn) {
        console.error('Elementos do menu do perfil não encontrados');
        return;
    }
    
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        btn.classList.remove('active');
    } else {
        menu.classList.add('show');
        btn.classList.add('active');
    }
}

// ===== ASSISTENTE IA =====

// Função para abrir o Assistente IA
function openAIAssistant() {
    console.log('Abrindo Assistente IA...');
    const modal = document.getElementById('aiAssistantModal');
    if (!modal) {
        console.error('Modal do Assistente IA não encontrado');
        return;
    }
    
    // Carregar configurações salvas
    loadAIConfig();
    
    // Detectar se estamos na aba de anotação interna
    const activeTab = document.querySelector('.response-tab.active');
    const isInternalTab = activeTab && activeTab.getAttribute('data-tab') === 'internal';
    
    // Carregar texto atual do textarea (pode ser público ou interno)
    const textarea = document.querySelector('.response-textarea');
    if (textarea) {
        const currentText = textarea.value || 'Nenhum texto digitado';
        document.getElementById('currentText').textContent = currentText;
        
        // Se for anotação interna, mostrar aviso
        if (isInternalTab) {
            document.getElementById('currentText').textContent = '[ANOTAÇÃO INTERNA] ' + currentText;
        }
    }
    
    // Carregar texto do cliente (simulado por enquanto)
    document.getElementById('clientText').textContent = 'Olá, estou com problema no sistema. Não consigo fazer login e preciso de ajuda urgente.';
    
    modal.style.display = 'block';
}

// Função para fechar o Assistente IA
function closeAIAssistant() {
    const modal = document.getElementById('aiAssistantModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para alternar abas do Assistente IA
function switchAITab(tabName) {
    // Remover ativo de todas as abas
    document.querySelectorAll('.ai-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.ai-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar aba selecionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Função para validar texto
async function validateText() {
    const currentText = document.getElementById('currentText').textContent;
    if (!currentText || currentText === 'Nenhum texto digitado') {
        alert('Por favor, digite um texto para validar');
        return;
    }
    
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        alert('Por favor, configure sua chave da API OpenAI primeiro');
        switchAITab('config');
        return;
    }
    
    try {
        showAILoading('Validando texto...');
        
        const response = await callOpenAI(`
            Analise o seguinte texto de atendimento ao cliente e forneça sugestões de melhoria:
            
            "${currentText}"
            
            Forneça:
            1. Correções gramaticais
            2. Sugestões de clareza
            3. Melhorias no tom profissional
            4. Versão melhorada do texto
            
            Responda em português brasileiro.
        `);
        
        showAIResult(response);
    } catch (error) {
        console.error('Erro ao validar texto:', error);
        alert('Erro ao validar texto: ' + error.message);
    }
}

// Função para sugerir resposta
async function suggestResponse() {
    const clientText = document.getElementById('clientText').textContent;
    const includeGreeting = document.getElementById('includeGreeting').checked;
    const includeClosing = document.getElementById('includeClosing').checked;
    const formalTone = document.getElementById('formalTone').checked;
    
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        alert('Por favor, configure sua chave da API OpenAI primeiro');
        switchAITab('config');
        return;
    }
    
    try {
        showAILoading('Gerando sugestão de resposta...');
        
        let prompt = `Como agente de atendimento ao cliente, responda profissionalmente ao seguinte cliente:\n\n"${clientText}"\n\n`;
        
        if (includeGreeting) prompt += 'Inclua uma saudação cordial.\n';
        if (includeClosing) prompt += 'Inclua uma despedida profissional.\n';
        if (formalTone) prompt += 'Use tom formal e profissional.\n';
        
        prompt += 'Responda em português brasileiro.';
        
        const response = await callOpenAI(prompt);
        showAIResult(response);
    } catch (error) {
        console.error('Erro ao sugerir resposta:', error);
        alert('Erro ao sugerir resposta: ' + error.message);
    }
}

// Função para chamar a API OpenAI
async function callOpenAI(prompt) {
    const apiKey = localStorage.getItem('openai_api_key');
    const model = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
    const maxTokens = parseInt(localStorage.getItem('ai_max_tokens')) || 500;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente especializado em atendimento ao cliente. Forneça respostas profissionais e úteis.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Função para mostrar loading
function showAILoading(message) {
    const resultDiv = document.getElementById('aiResult');
    const contentDiv = document.getElementById('aiResultContent');
    
    contentDiv.innerHTML = `
        <div class="ai-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Função para mostrar resultado
function showAIResult(result) {
    const resultDiv = document.getElementById('aiResult');
    const contentDiv = document.getElementById('aiResultContent');
    
    contentDiv.innerHTML = `
        <div class="ai-result-text">
            ${result.replace(/\n/g, '<br>')}
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Função para aplicar resultado
function applyAIResult() {
    const resultContent = document.getElementById('aiResultContent').textContent;
    
    // Detectar se estamos na aba de anotação interna
    const activeTab = document.querySelector('.response-tab.active');
    const isInternalTab = activeTab && activeTab.getAttribute('data-tab') === 'internal';
    
    // Aplicar no textarea correto
    const textarea = document.querySelector('.response-textarea');
    if (textarea) {
        textarea.value = resultContent;
        
        if (isInternalTab) {
            alert('Anotação interna aplicada com sucesso!');
        } else {
            alert('Texto aplicado com sucesso!');
        }
    }
    
    closeAIResult();
}

// Função para copiar resultado
function copyAIResult() {
    const resultContent = document.getElementById('aiResultContent').textContent;
    navigator.clipboard.writeText(resultContent).then(() => {
        alert('Resultado copiado para a área de transferência!');
    });
}

// Função para fechar resultado
function closeAIResult() {
    document.getElementById('aiResult').style.display = 'none';
}

// Função para salvar configurações da IA
function saveAIConfig() {
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('aiModel').value;
    const maxTokens = document.getElementById('maxTokens').value;
    
    if (!apiKey) {
        alert('Por favor, insira sua chave da API OpenAI');
        return;
    }
    
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('ai_model', model);
    localStorage.setItem('ai_max_tokens', maxTokens);
    
    alert('Configurações salvas com sucesso!');
}

// Função para carregar configurações da IA
function loadAIConfig() {
    const apiKey = localStorage.getItem('openai_api_key');
    const model = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
    const maxTokens = localStorage.getItem('ai_max_tokens') || '500';
    
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }
    document.getElementById('aiModel').value = model;
    document.getElementById('maxTokens').value = maxTokens;
}

// ===== FUNCIONALIDADES DA TOOLBAR =====

// Função para formatar texto (negrito, itálico)
function formatText(format, tabType) {
    const textarea = getActiveTextarea(tabType);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            break;
    }
    
    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.value = newText;
    
    // Reposicionar cursor
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
}

// Função para inserir link
function insertLink(tabType) {
    const textarea = getActiveTextarea(tabType);
    if (!textarea) return;
    
    const url = prompt('Digite a URL do link:');
    if (!url) return;
    
    const linkText = prompt('Digite o texto do link (ou deixe vazio para usar a URL):') || url;
    const link = `[${linkText}](${url})`;
    
    insertTextAtCursor(textarea, link);
}

// Função para inserir link do ticket
function insertTicketLink(tabType) {
    const textarea = getActiveTextarea(tabType);
    if (!textarea) return;
    
    // Encontrar o ID do ticket atual
    const activeTab = document.querySelector('.ticket-tab.active');
    if (!activeTab) {
        alert('Nenhum ticket ativo encontrado');
        return;
    }
    
    const ticketId = activeTab.id.replace('tab-', '');
    const ticketLink = `[Ticket #${ticketId}](ticket:${ticketId})`;
    
    insertTextAtCursor(textarea, ticketLink);
}

// Função auxiliar para obter o textarea ativo
function getActiveTextarea(tabType) {
    if (tabType === 'internal') {
        return document.querySelector('.internal-textarea');
    } else {
        return document.querySelector('.response-textarea:not(.internal-textarea)');
    }
}

// Função auxiliar para inserir texto na posição do cursor
function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = textarea.value.substring(0, start) + text + textarea.value.substring(end);
    
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
}

// Função alternativa para o botão do perfil (fallback)
function initProfileButton() {
    console.log('Inicializando botão do perfil...');
    const profileBtn = document.getElementById('profileBtn');
    
    if (profileBtn) {
        // Remover event listener existente se houver
        profileBtn.removeEventListener('click', handleProfileClick);
        // Adicionar novo event listener
        profileBtn.addEventListener('click', handleProfileClick);
        console.log('Event listener adicionado ao botão do perfil');
    } else {
        console.error('Botão do perfil não encontrado para inicialização');
    }
}

// Handler para o clique no botão do perfil
function handleProfileClick(event) {
    console.log('handleProfileClick chamado');
    event.preventDefault();
    event.stopPropagation();
    toggleProfileMenu();
}

// Inicialização do botão do perfil
console.log('Inicializando botão do perfil...');
initProfileButton();

// Teste simples para verificar se JavaScript está funcionando
console.log('=== TESTE JAVASCRIPT FUNCIONANDO ===');

// Inicializar aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicação inicializada');
    
    // Criar dados de teste se não existirem
    initializeTestData();
    
    
    // Event listeners para abas do Assistente IA
    document.querySelectorAll('.ai-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAITab(tabName);
        });
    });
    
    // Event listener para fechar modal do Assistente IA
    const closeBtn = document.querySelector('.close-ai-assistant');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAIAssistant);
    }
    
    // Fechar menu do perfil ao clicar fora
    document.addEventListener('click', function(event) {
        const profileMenu = document.getElementById('profileMenu');
        const profileBtn = document.querySelector('.profile-btn');
        
        if (profileMenu && profileBtn && !profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.remove('show');
            profileBtn.classList.remove('active');
        }
        
        // Fechar dropdown de status ao clicar fora
        const statusDropdown = document.getElementById('statusDropdown');
        const statusDropdownInternal = document.getElementById('statusDropdownInternal');
        const dropdownBtn = document.querySelector('.dropdown-btn');
        
        if (statusDropdown && dropdownBtn && !dropdownBtn.contains(event.target) && !statusDropdown.contains(event.target)) {
            statusDropdown.classList.remove('show');
        }
        
        if (statusDropdownInternal && dropdownBtn && !dropdownBtn.contains(event.target) && !statusDropdownInternal.contains(event.target)) {
            statusDropdownInternal.classList.remove('show');
        }
    });
});

// Função para abrir configurações do perfil
function openProfileSettings() {
    alert('Configurações do perfil em desenvolvimento');
    // Fechar menu
    const profileMenu = document.getElementById('profileMenu');
    const profileBtn = document.querySelector('.profile-btn');
    if (profileMenu) profileMenu.classList.remove('show');
    if (profileBtn) profileBtn.classList.remove('active');
}

// Função para logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar dados do localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        
        // Ocultar aplicação principal
        document.getElementById('mainApp').style.display = 'none';
        
        // Mostrar tela de login
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Limpar formulário de login
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        
        alert('Logout realizado com sucesso!');
    }
    
    // Fechar menu
    const profileMenu = document.getElementById('profileMenu');
    const profileBtn = document.querySelector('.profile-btn');
    if (profileMenu) profileMenu.classList.remove('show');
    if (profileBtn) profileBtn.classList.remove('active');
}

// Função para inicializar dados de teste
function initializeTestData() {
    console.log('Inicializando dados de teste...');
    
    // Verificar se já existem caixas
    let kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        console.log('Criando caixas de teste...');
        
        // Criar caixas de teste
        const testBoxes = [
            {
                id: 'box-1',
                name: 'Novos',
                status: 'Ativo',
                color: '#1976d2',
                description: 'Tickets novos recebidos',
                tickets: [
                    {
                        id: 'ticket-1',
                        subject: 'Problema de login no sistema',
                        description: 'Cliente não consegue fazer login no sistema. Erro 500 aparece na tela.',
                        status: 'novo',
                        priority: 'alta',
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
                        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        messages: [
                            {
                                author: 'Cliente',
                                content: 'Olá, estou com problema para fazer login no sistema. Quando tento acessar, aparece erro 500.',
                                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                            }
                        ],
                        internalNotes: []
                    },
                    {
                        id: 'ticket-2',
                        subject: 'Dúvida sobre faturamento',
                        description: 'Cliente tem dúvidas sobre valores cobrados na última fatura.',
                        status: 'novo',
                        priority: 'media',
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
                        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        messages: [
                            {
                                author: 'Cliente',
                                content: 'Boa tarde, gostaria de entender os valores cobrados na minha última fatura. Alguns itens não reconheço.',
                                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                            }
                        ],
                        internalNotes: []
                    }
                ]
            },
            {
                id: 'box-2',
                name: 'Em Andamento',
                status: 'Ativo',
                color: '#28a745',
                description: 'Tickets sendo trabalhados',
                tickets: [
                    {
                        id: 'ticket-3',
                        subject: 'Solicitação de reembolso',
                        description: 'Cliente solicitou reembolso de serviço não utilizado.',
                        status: 'em-aberto',
                        priority: 'alta',
                        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
                        updatedAt: new Date(Date.now() - 1 * 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
                        messages: [
                            {
                                author: 'Cliente',
                                content: 'Preciso solicitar reembolso do serviço que contratei mas não utilizei.',
                                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                            },
                            {
                                author: 'Agente',
                                content: 'Olá! Vou verificar sua solicitação e processar o reembolso conforme nossa política.',
                                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                            }
                        ],
                        internalNotes: [
                            {
                                author: 'Agente',
                                content: 'Cliente tem direito ao reembolso conforme política. Processar em até 5 dias úteis.',
                                date: new Date(Date.now() - 1 * 12 * 60 * 60 * 1000).toISOString()
                            }
                        ]
                    }
                ]
            },
            {
                id: 'box-3',
                name: 'Finalizadas',
                status: 'Ativo',
                color: '#6c757d',
                description: 'Tickets resolvidos',
                tickets: [
                    {
                        id: 'ticket-4',
                        subject: 'Configuração de email',
                        description: 'Cliente precisava configurar email corporativo.',
                        status: 'resolvido',
                        priority: 'baixa',
                        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
                        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
                        messages: [
                            {
                                author: 'Cliente',
                                content: 'Preciso de ajuda para configurar meu email corporativo.',
                                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                            },
                            {
                                author: 'Agente',
                                content: 'Vou te ajudar com a configuração. Segue o passo a passo...',
                                date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
                            },
                            {
                                author: 'Cliente',
                                content: 'Perfeito! Funcionou. Obrigado pela ajuda!',
                                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                            }
                        ],
                        internalNotes: []
                    }
                ]
            }
        ];
        
        // Salvar no localStorage
        localStorage.setItem('kanbanColumns', JSON.stringify(testBoxes));
        console.log('Dados de teste criados com sucesso!');
        
        // Recarregar caixas se estivermos na página de tickets
        if (typeof loadBoxes === 'function') {
            loadBoxes();
        }
    } else {
        console.log('Dados já existem, não criando dados de teste');
    }
}

