// API Client para integração com o backend
class VelodeskAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('velodesk_token');
    }

    // Método para fazer requisições HTTP
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Autenticação
    async login(email, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        this.token = data.token;
        localStorage.setItem('velodesk_token', this.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        this.token = data.token;
        localStorage.setItem('velodesk_token', this.token);
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('velodesk_token');
        localStorage.removeItem('velodesk_user');
    }

    // Tickets
    async getTickets(filters = {}) {
        const queryParams = new URLSearchParams(filters);
        return await this.request(`/tickets?${queryParams}`);
    }

    async createTicket(ticketData) {
        return await this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
        });
    }

    async updateTicket(ticketId, updateData) {
        return await this.request(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async getTicket(ticketId) {
        return await this.request(`/tickets/${ticketId}`);
    }

    // Mensagens
    async sendMessage(ticketId, content, isInternal = false) {
        return await this.request(`/tickets/${ticketId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, isInternal })
        });
    }

    // Caixas
    async getBoxes() {
        return await this.request('/boxes');
    }

    async createBox(boxData) {
        return await this.request('/boxes', {
            method: 'POST',
            body: JSON.stringify(boxData)
        });
    }

    // Upload de arquivos
    async uploadFile(file, ticketId = null) {
        const formData = new FormData();
        formData.append('file', file);
        if (ticketId) formData.append('ticketId', ticketId);

        const response = await fetch(`${this.baseURL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro no upload');
        }

        return await response.json();
    }

    // Usuários
    async getUsers() {
        return await this.request('/users');
    }

    // Dashboard
    async getDashboardStats() {
        return await this.request('/dashboard');
    }

    // WebSocket para notificações em tempo real
    connectWebSocket() {
        if (this.socket) return this.socket;

        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('Conectado ao WebSocket');
        });

        this.socket.on('newMessage', (data) => {
            // Emitir evento customizado para o frontend
            window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
        });

        this.socket.on('ticketUpdated', (data) => {
            window.dispatchEvent(new CustomEvent('ticketUpdated', { detail: data }));
        });

        return this.socket;
    }

    // Método para entrar em uma sala de ticket
    joinTicketRoom(ticketId) {
        if (this.socket) {
            this.socket.emit('joinTicket', ticketId);
        }
    }
}

// Instância global da API
const api = new VelodeskAPI();

// Funções auxiliares para integração com o frontend existente
async function syncWithBackend() {
    try {
        // Sincronizar dados do localStorage com o backend
        const localTickets = JSON.parse(localStorage.getItem('velodesk_tickets') || '[]');
        const localBoxes = JSON.parse(localStorage.getItem('velodesk_columns') || '[]');
        
        // Se há token, tentar sincronizar
        if (api.token) {
            const backendTickets = await api.getTickets();
            const backendBoxes = await api.getBoxes();
            
            // Atualizar localStorage com dados do backend
            localStorage.setItem('velodesk_tickets', JSON.stringify(backendTickets));
            localStorage.setItem('velodesk_columns', JSON.stringify(backendBoxes));
            
            console.log('Dados sincronizados com o backend');
        }
    } catch (error) {
        console.warn('Erro ao sincronizar com backend:', error);
    }
}

// Função para migrar dados do localStorage para o backend
async function migrateToBackend() {
    try {
        if (!api.token) return;

        const localTickets = JSON.parse(localStorage.getItem('velodesk_tickets') || '[]');
        const localBoxes = JSON.parse(localStorage.getItem('velodesk_columns') || '[]');

        // Migrar caixas
        for (const box of localBoxes) {
            try {
                await api.createBox({
                    name: box.name,
                    status: box.status,
                    color: box.color,
                    description: box.description
                });
            } catch (error) {
                console.warn('Erro ao migrar caixa:', error);
            }
        }

        // Migrar tickets
        for (const ticket of localTickets) {
            try {
                await api.createTicket({
                    subject: ticket.subject,
                    description: ticket.description,
                    priority: ticket.priority,
                    status: ticket.status
                });
            } catch (error) {
                console.warn('Erro ao migrar ticket:', error);
            }
        }

        console.log('Migração para backend concluída');
    } catch (error) {
        console.error('Erro na migração:', error);
    }
}

// Exportar para uso global
window.VelodeskAPI = VelodeskAPI;
window.api = api;
window.syncWithBackend = syncWithBackend;
window.migrateToBackend = migrateToBackend;

