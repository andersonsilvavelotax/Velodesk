// Sistema Velodesk - Versão Limpa e Simples
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
        setTimeout(() => setupTicketFilters(), 100); // Aguardar DOM ser renderizado
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
    console.log('Carregando estatísticas do dashboard...');
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let totalTickets = 0;
    let novosTickets = 0;
    let emAndamentoTickets = 0;
    let resolvidosTickets = 0;
    
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            totalTickets += box.tickets.length;
            
            if (box.id === 'novos') {
                novosTickets = box.tickets.length;
            } else if (box.id === 'em-andamento') {
                emAndamentoTickets = box.tickets.length;
            } else if (box.id === 'resolvidos') {
                resolvidosTickets = box.tickets.length;
            }
        }
    });
    
    // Atualizar elementos do dashboard
    const totalElement = document.getElementById('totalTickets');
    const novosElement = document.getElementById('novosTickets');
    const emAndamentoElement = document.getElementById('emAndamentoTickets');
    const resolvidosElement = document.getElementById('resolvidosTickets');
    
    if (totalElement) totalElement.textContent = totalTickets;
    if (novosElement) novosElement.textContent = novosTickets;
    if (emAndamentoElement) emAndamentoElement.textContent = emAndamentoTickets;
    if (resolvidosElement) resolvidosElement.textContent = resolvidosTickets;
}

// Função para carregar caixas Kanban
function loadBoxes() {
    console.log('Carregando caixas Kanban...');
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    if (kanbanColumns.length === 0) {
        createDefaultKanbanBoxes();
        return;
    }
    
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;
    
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
    console.log('Criando caixas Kanban padrão...');
    
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
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    let ticket = null;
    let box = null;
    
    for (const b of kanbanColumns) {
        if (b.tickets) {
            ticket = b.tickets.find(t => t.id === ticketId);
            if (ticket) {
                box = b;
                break;
            }
        }
    }
    
    if (!ticket) {
        console.log('Ticket não encontrado:', ticketId);
        return;
    }
    
    createTicketModal(ticket, box);
}

// Função para criar modal de ticket
function createTicketModal(ticket, box) {
    console.log('Criando modal de ticket:', ticket.title);
    
    // Remover modal existente
    const existingModal = document.getElementById('ticketModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'ticketModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content ticket-modal">
            <div class="modal-header">
                <h3>${ticket.title}</h3>
                <button class="close-btn" onclick="closeTicketModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="ticket-layout">
                <div class="ticket-main">
                    <div class="ticket-details">
                        <h4>Descrição</h4>
                        <p>${ticket.description}</p>
                        
                        <h4>Status</h4>
                        <p>${ticket.status}</p>
                        
                        <h4>Data de Criação</h4>
                        <p>${new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div class="ticket-actions">
                        <h4>Alterar Status</h4>
                        <div class="status-buttons">
                            <button class="btn-primary" onclick="changeTicketStatus(${ticket.id}, 'novo')">Novo</button>
                            <button class="btn-primary" onclick="changeTicketStatus(${ticket.id}, 'em-andamento')">Em Andamento</button>
                            <button class="btn-primary" onclick="changeTicketStatus(${ticket.id}, 'em-espera')">Em Espera</button>
                            <button class="btn-primary" onclick="changeTicketStatus(${ticket.id}, 'resolvido')">Resolvido</button>
                        </div>
                    </div>
                </div>
                
                <div class="ticket-sidebar">
                    <div class="sidebar-section">
                        <h3>Informações do Cliente</h3>
                        <div class="form-field">
                            <label>Nome do Cliente</label>
                            <input type="text" id="clientName" value="${ticket.clientName || ''}" onchange="updateClientData('${ticket.id}', 'clientName', this.value)">
                        </div>
                        <div class="form-field">
                            <label>CPF</label>
                            <input type="text" id="clientCPF" value="${ticket.clientCPF || ''}" onchange="updateClientData('${ticket.id}', 'clientCPF', this.value)">
                        </div>
                        <div class="form-field">
                            <label>Responsável</label>
                            <input type="text" id="responsibleAgent" value="${ticket.responsibleAgent || ''}" onchange="updateClientData('${ticket.id}', 'responsibleAgent', this.value)">
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h3>Formulário Personalizado</h3>
                        <div class="form-field">
                            <label>Selecionar Formulário</label>
                            <select id="formSelector" onchange="applyFormToTicket('${ticket.id}', this.value)">
                                <option value="">Selecione um formulário...</option>
                                ${generateFormOptions(ticket.formId)}
                            </select>
                        </div>
                        <div id="formFields" class="form-fields">
                            ${renderFormFields(ticket)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Função para gerar opções de formulário
function generateFormOptions(currentFormId) {
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let optionsHTML = '';
    
    forms.forEach(form => {
        const selected = currentFormId == form.id ? 'selected' : '';
        optionsHTML += `<option value="${form.id}" ${selected}>${form.name}</option>`;
    });
    
    return optionsHTML;
}

// Função para renderizar campos do formulário
function renderFormFields(ticket) {
    if (!ticket.formId) {
        return '<p class="no-form-message">Nenhum formulário selecionado.</p>';
    }
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    const form = forms.find(f => f.id == ticket.formId);
    
    if (!form) {
        return '<p class="form-error">Formulário não encontrado!</p>';
    }
    
    let html = '';
    
    form.fields.forEach(field => {
        const currentValue = ticket.formData && ticket.formData[field.id] ? ticket.formData[field.id] : '';
        
        html += `<div class="form-field">`;
        html += `<label>${field.label}${field.required ? ' *' : ''}</label>`;
        
        switch (field.type) {
            case 'text':
                html += `<input type="text" value="${currentValue}" onchange="updateFormData('${ticket.id}', '${field.id}', this.value)">`;
                break;
            case 'textarea':
                html += `<textarea onchange="updateFormData('${ticket.id}', '${field.id}', this.value)">${currentValue}</textarea>`;
                break;
            case 'select':
                html += `<select onchange="updateFormData('${ticket.id}', '${field.id}', this.value)">`;
                html += '<option value="">Selecione uma opção</option>';
                if (field.options) {
                    field.options.forEach(option => {
                        const selected = currentValue === option ? 'selected' : '';
                        html += `<option value="${option}" ${selected}>${option}</option>`;
                    });
                }
                html += '</select>';
                break;
            case 'checkbox':
                const checked = currentValue === 'sim' ? 'checked' : '';
                html += `<input type="checkbox" ${checked} onchange="updateFormData('${ticket.id}', '${field.id}', this.checked ? 'sim' : 'não')">`;
                break;
            case 'tree':
                html += renderTreeField(field, currentValue, ticket.id);
                break;
            default:
                html += `<input type="text" value="${currentValue}" onchange="updateFormData('${ticket.id}', '${field.id}', this.value)">`;
        }
        
        html += '</div>';
    });
    
    return html;
}

// Função para renderizar campo de árvore (SIMPLES)
function renderTreeField(field, currentValue, ticketId) {
    if (!field.config || !field.config.treeStructure) {
        return '<p class="form-error">Estrutura da árvore não encontrada!</p>';
    }
    
    const treeStructure = field.config.treeStructure;
    
    // Renderizar apenas o primeiro nível como select
    let html = `<select onchange="handleTreeSelection('${ticketId}', '${field.id}', this.value, this)">`;
    html += '<option value="">Selecione uma opção</option>';
    
    treeStructure.forEach(node => {
        const selected = currentValue === node.label ? 'selected' : '';
        html += `<option value="${node.label}" data-has-children="${node.children && node.children.length > 0}" ${selected}>${node.label}</option>`;
    });
    
    html += '</select>';
    
    // Se há valor salvo, mostrar o caminho completo
    if (currentValue) {
        html += `<div class="tree-path">`;
        html += `<small>Caminho selecionado: ${currentValue}</small>`;
        html += `</div>`;
    }
    
    return html;
}

// Função para lidar com seleção de árvore
function handleTreeSelection(ticketId, fieldId, selectedValue, selectElement) {
    console.log('Seleção de árvore:', selectedValue);
    
    // Salvar o valor
    updateFormData(ticketId, fieldId, selectedValue);
    
    // Verificar se tem filhos
    const hasChildren = selectElement.selectedOptions[0].getAttribute('data-has-children') === 'true';
    
    if (hasChildren) {
        // Criar próximo select
        createNextTreeLevel(ticketId, fieldId, selectedValue);
    }
}

// Função para criar próximo nível da árvore
function createNextTreeLevel(ticketId, fieldId, parentValue) {
    console.log('Criando próximo nível para:', parentValue);
    
    const forms = JSON.parse(localStorage.getItem('forms') || '[]');
    let targetField = null;
    
    for (const form of forms) {
        targetField = form.fields.find(f => f.id == fieldId);
        if (targetField) break;
    }
    
    if (!targetField || !targetField.config || !targetField.config.treeStructure) {
        console.log('Campo de árvore não encontrado');
        return;
    }
    
    // Encontrar o nó pai
    const parentNode = findNodeByLabel(targetField.config.treeStructure, parentValue);
    
    if (!parentNode || !parentNode.children || parentNode.children.length === 0) {
        console.log('Nó pai não encontrado ou não tem filhos');
        return;
    }
    
    // Criar novo select
    const formFields = document.getElementById('formFields');
    if (!formFields) return;
    
    const newSelect = document.createElement('div');
    newSelect.className = 'form-field tree-level';
    newSelect.innerHTML = `
        <label>Subcategoria</label>
        <select onchange="handleTreeSelection('${ticketId}', '${fieldId}', this.value, this)">
            <option value="">Selecione uma opção</option>
            ${parentNode.children.map(child => `<option value="${child.label}" data-has-children="${child.children && child.children.length > 0}">${child.label}</option>`).join('')}
        </select>
    `;
    
    formFields.appendChild(newSelect);
}

// Função para encontrar nó por label
function findNodeByLabel(treeStructure, label) {
    for (const node of treeStructure) {
        if (node.label === label) {
            return node;
        }
        if (node.children && node.children.length > 0) {
            const found = findNodeByLabel(node.children, label);
            if (found) return found;
        }
    }
    return null;
}

// Função para aplicar formulário ao ticket
function applyFormToTicket(ticketId, formId) {
    console.log('Aplicando formulário:', formId, 'ao ticket:', ticketId);
    
    if (!formId) {
        removeFormFromTicket(ticketId);
        return;
    }
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                ticket.formId = parseInt(formId);
                ticket.formData = ticket.formData || {};
                ticket.updatedAt = new Date().toISOString();
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                
                // Atualizar campos do formulário
                const formFields = document.getElementById('formFields');
                if (formFields) {
                    formFields.innerHTML = renderFormFields(ticket);
                }
                
                showNotification('Formulário aplicado com sucesso!', 'success');
                break;
            }
        }
    }
}

// Função para remover formulário do ticket
function removeFormFromTicket(ticketId) {
    console.log('Removendo formulário do ticket:', ticketId);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                delete ticket.formId;
                delete ticket.formData;
                ticket.updatedAt = new Date().toISOString();
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                
                // Limpar campos do formulário
                const formFields = document.getElementById('formFields');
                if (formFields) {
                    formFields.innerHTML = '<p class="no-form-message">Nenhum formulário selecionado.</p>';
                }
                
                showNotification('Formulário removido!', 'info');
                break;
            }
        }
    }
}

// Função para atualizar dados do formulário
function updateFormData(ticketId, fieldId, value) {
    console.log('Atualizando dados do formulário:', fieldId, '=', value);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                if (!ticket.formData) {
                    ticket.formData = {};
                }
                ticket.formData[fieldId] = value;
                ticket.updatedAt = new Date().toISOString();
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                break;
            }
        }
    }
}

// Função para atualizar dados do cliente
function updateClientData(ticketId, field, value) {
    console.log('Atualizando dados do cliente:', field, '=', value);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                ticket[field] = value;
                ticket.updatedAt = new Date().toISOString();
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                break;
            }
        }
    }
}

// Função para alterar status do ticket
function changeTicketStatus(ticketId, newStatus) {
    console.log('Alterando status do ticket:', ticketId, 'para:', newStatus);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    for (const box of kanbanColumns) {
        if (box.tickets) {
            const ticket = box.tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                ticket.status = newStatus;
                ticket.updatedAt = new Date().toISOString();
                
                // Mover ticket para caixa correta
                moveTicketToCorrectBox(ticket, kanbanColumns);
                
                localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
                
                closeTicketModal();
                loadBoxes();
                loadDashboardStats();
                
                showNotification(`Ticket atualizado para "${newStatus}"!`, 'success');
                break;
            }
        }
    }
}

// Função para mover ticket para caixa correta
function moveTicketToCorrectBox(ticket, kanbanColumns) {
    // Remover ticket de todas as caixas
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            box.tickets = box.tickets.filter(t => t.id !== ticket.id);
        }
    });
    
    // Adicionar ticket à caixa correta
    const targetBox = kanbanColumns.find(box => box.id === ticket.status);
    if (targetBox) {
        if (!targetBox.tickets) {
            targetBox.tickets = [];
        }
        targetBox.tickets.push(ticket);
    }
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
    console.log('Criando novo ticket...');
    
    const newTicket = {
        id: Date.now(),
        title: 'Novo Ticket',
        description: 'Descrição do novo ticket',
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientName: '',
        clientCPF: '',
        responsibleAgent: '',
        formId: null,
        formData: {}
    };
    
    const tempBox = {
        id: 'temp',
        name: 'Novo Ticket',
        tickets: [newTicket]
    };
    
    createTicketModal(newTicket, tempBox);
}

// Função para carregar configurações
function loadConfig() {
    console.log('Carregando configurações...');
    // Implementar carregamento de configurações
}

// Função para carregar relatórios
function loadReports() {
    console.log('Carregando relatórios...');
    // Implementar carregamento de relatórios
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    console.log(`Notificação [${type}]:`, message);
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Função para abrir assistente IA
function openAIChatbot() {
    console.log('Abrindo assistente IA...');
    
    const modal = document.getElementById('aiChatbotModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Função para fechar assistente IA
function closeAIChatbot() {
    const modal = document.getElementById('aiChatbotModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para enviar mensagem IA
function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    if (!input || !input.value.trim()) return;
    
    const userMessage = input.value.trim();
    input.value = '';
    
    addAIMessage(userMessage, 'user');
    
    setTimeout(() => {
        const aiResponse = processAIRequest(userMessage);
        addAIMessage(aiResponse.text, 'assistant', aiResponse.suggestions);
    }, 1000);
}

// Função para adicionar mensagem IA
function addAIMessage(text, sender, suggestions = []) {
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

// Função para processar requisição IA
function processAIRequest(message) {
    const responses = [
        'Como posso ajudá-lo com seu sistema de tickets?',
        'Posso auxiliar na configuração de formulários.',
        'Precisa de ajuda com o Kanban?',
        'Posso explicar como usar o sistema.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
        text: randomResponse,
        suggestions: []
    };
}

// Função para lidar com tecla pressionada no chat IA
function handleAIChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

// ===== FUNÇÕES DOS BOTÕES DE TICKETS =====

// Função para abrir modal de nova caixa
function openNewBoxModal() {
    console.log('Abrindo modal de nova caixa...');
    
    const modal = document.createElement('div');
    modal.id = 'newBoxModal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nova Caixa Kanban</h3>
                <button class="close-btn" onclick="closeNewBoxModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-field">
                    <label>Nome da Caixa</label>
                    <input type="text" id="newBoxName" placeholder="Ex: Em Análise">
                </div>
                <div class="form-field">
                    <label>ID da Caixa</label>
                    <input type="text" id="newBoxId" placeholder="Ex: em-analise">
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
    const nameInput = document.getElementById('newBoxName');
    const idInput = document.getElementById('newBoxId');
    
    if (!nameInput || !nameInput.value.trim()) {
        showNotification('Por favor, preencha o nome da caixa!', 'error');
        return;
    }
    
    if (!idInput || !idInput.value.trim()) {
        showNotification('Por favor, preencha o ID da caixa!', 'error');
        return;
    }
    
    const newBox = {
        id: idInput.value.trim(),
        name: nameInput.value.trim(),
        tickets: []
    };
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    kanbanColumns.push(newBox);
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    
    closeNewBoxModal();
    loadBoxes();
    showNotification('Caixa criada com sucesso!', 'success');
}

// Função para criar caixas padrão
function createDefaultBoxes() {
    console.log('Criando caixas padrão...');
    createDefaultKanbanBoxes();
    showNotification('Caixas padrão criadas!', 'success');
}

// Função para atualizar tickets
function refreshTickets() {
    console.log('Atualizando tickets...');
    loadBoxes();
    loadDashboardStats();
    showNotification('Tickets atualizados!', 'success');
}

// Função para pesquisar tickets
function searchTickets() {
    const searchInput = document.getElementById('ticketSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log('Pesquisando tickets:', searchTerm);
    
    if (!searchTerm) {
        loadBoxes();
        return;
    }
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;
    
    kanbanContainer.innerHTML = '';
    
    kanbanColumns.forEach(box => {
        const filteredTickets = box.tickets ? box.tickets.filter(ticket => 
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm) ||
            (ticket.clientName && ticket.clientName.toLowerCase().includes(searchTerm))
        ) : [];
        
        if (filteredTickets.length > 0) {
            const boxCopy = { ...box, tickets: filteredTickets };
            const boxElement = createKanbanBox(boxCopy);
            kanbanContainer.appendChild(boxElement);
        }
    });
    
    showNotification(`Encontrados ${document.querySelectorAll('.ticket').length} tickets`, 'info');
}

// Função para ordenar tickets
function sortTickets() {
    const sortSelect = document.getElementById('ticketSort');
    if (!sortSelect) return;
    
    const sortBy = sortSelect.value;
    console.log('Ordenando tickets por:', sortBy);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    
    kanbanColumns.forEach(box => {
        if (box.tickets) {
            box.tickets.sort((a, b) => {
                switch (sortBy) {
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'date':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'status':
                        return a.status.localeCompare(b.status);
                    default:
                        return 0;
                }
            });
        }
    });
    
    localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    loadBoxes();
    showNotification(`Tickets ordenados por ${sortBy}`, 'success');
}

// Função para filtrar tickets por status
function filterTicketsByStatus(status) {
    console.log('Filtrando tickets por status:', status);
    
    const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (!kanbanContainer) return;
    
    kanbanContainer.innerHTML = '';
    
    if (status === 'all') {
        loadBoxes();
        return;
    }
    
    const targetBox = kanbanColumns.find(box => box.id === status);
    if (targetBox) {
        const boxElement = createKanbanBox(targetBox);
        kanbanContainer.appendChild(boxElement);
    }
    
    showNotification(`Mostrando tickets: ${status}`, 'info');
}

// Função para configurar filtros de tickets
function setupTicketFilters() {
    console.log('Configurando filtros de tickets...');
    
    // Adicionar evento de pesquisa
    const searchInput = document.getElementById('ticketSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchTickets);
    }
    
    // Adicionar evento de ordenação
    const sortSelect = document.getElementById('ticketSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortTickets);
    }
    
    // Adicionar eventos dos filtros de status
    const statusFilters = document.querySelectorAll('.status-filter');
    statusFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            filterTicketsByStatus(status);
        });
    });
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
        setupTicketFilters();
    }
});
