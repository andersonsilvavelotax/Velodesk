// ===== WEBHOOK 55PBX SIMULATOR =====
// Este arquivo simula os webhooks da 55PBX para demonstração

class PBXWebhookSimulator {
    constructor() {
        this.webhookUrl = window.location.origin + '/webhook/55pbx';
        this.isRunning = false;
        this.callInterval = null;
    }

    // Iniciar simulação de webhooks
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🔔 Simulador de webhook 55PBX iniciado');
        
        // Simular chamadas a cada 30-60 segundos
        this.callInterval = setInterval(() => {
            this.simulateIncomingCall();
        }, Math.random() * 30000 + 30000); // 30-60 segundos
    }

    // Parar simulação
    stop() {
        this.isRunning = false;
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
        console.log('🔔 Simulador de webhook 55PBX parado');
    }

    // Simular chamada entrante
    simulateIncomingCall() {
        const callData = {
            event: 'call.incoming',
            timestamp: new Date().toISOString(),
            callId: 'call_' + Date.now(),
            from: this.generatePhoneNumber(),
            to: '(11) 3333-4444', // Número da empresa
            direction: 'incoming',
            status: 'ringing',
            duration: 0,
            agent: null,
            customer: {
                name: this.generateCustomerName(),
                phone: this.generatePhoneNumber()
            }
        };

        console.log('📞 Simulando chamada entrante:', callData);
        this.processWebhook(callData);
    }

    // Simular chamada perdida
    simulateMissedCall() {
        const callData = {
            event: 'call.missed',
            timestamp: new Date().toISOString(),
            callId: 'call_' + Date.now(),
            from: this.generatePhoneNumber(),
            to: '(11) 3333-4444',
            direction: 'incoming',
            status: 'missed',
            duration: 0,
            agent: null,
            customer: {
                name: this.generateCustomerName(),
                phone: this.generatePhoneNumber()
            }
        };

        console.log('📞 Simulando chamada perdida:', callData);
        this.processWebhook(callData);
    }

    // Simular chamada atendida
    simulateAnsweredCall() {
        const callData = {
            event: 'call.answered',
            timestamp: new Date().toISOString(),
            callId: 'call_' + Date.now(),
            from: this.generatePhoneNumber(),
            to: '(11) 3333-4444',
            direction: 'incoming',
            status: 'answered',
            duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutos
            agent: this.generateAgentName(),
            customer: {
                name: this.generateCustomerName(),
                phone: this.generatePhoneNumber()
            }
        };

        console.log('📞 Simulando chamada atendida:', callData);
        this.processWebhook(callData);
    }

    // Processar webhook (simular envio para o sistema)
    processWebhook(callData) {
        // Simular delay de rede
        setTimeout(() => {
            this.handleWebhookData(callData);
        }, Math.random() * 1000 + 500);
    }

    // Processar dados do webhook
    handleWebhookData(callData) {
        try {
            // Converter para formato do sistema
            const phoneCall = {
                id: callData.callId,
                number: callData.from,
                name: callData.customer.name,
                type: callData.direction,
                status: callData.status,
                duration: callData.duration,
                timestamp: callData.timestamp,
                agent: callData.agent,
                ticketId: null
            };

            // Adicionar à lista de chamadas
            if (window.phoneData) {
                window.phoneData.calls.unshift(phoneCall);
                
                // Manter apenas as últimas 100 chamadas
                if (window.phoneData.calls.length > 100) {
                    window.phoneData.calls = window.phoneData.calls.slice(0, 100);
                }
                
                // Salvar dados
                if (window.savePhoneData) {
                    window.savePhoneData();
                }
                
                // Atualizar interface se estiver na página de telefonia
                if (document.getElementById('phone') && document.getElementById('phone').classList.contains('active')) {
                    if (window.updatePhoneStatus) window.updatePhoneStatus();
                    if (window.loadCallsList) window.loadCallsList();
                }
                
                // Criar ticket automaticamente se configurado
                if (callData.status === 'missed' && window.phoneData.settings.autoCreateTickets) {
                    if (window.createTicketFromCall) {
                        setTimeout(() => {
                            window.createTicketFromCall(phoneCall.id);
                        }, 2000);
                    }
                }
                
                // Oferecer callback se configurado
                if (callData.status === 'missed' && window.phoneData.settings.autoCallback) {
                    setTimeout(() => {
                        this.offerCallback(phoneCall);
                    }, 3000);
                }
                
                console.log('✅ Webhook processado:', phoneCall);
            }
        } catch (error) {
            console.error('❌ Erro ao processar webhook:', error);
        }
    }

    // Oferecer callback automático
    offerCallback(phoneCall) {
        if (window.phoneData.settings.autoCallback) {
            const message = window.phoneData.settings.callbackMessage;
            console.log(`📞 Callback oferecido para ${phoneCall.number}: ${message}`);
            
            // Aqui você poderia integrar com SMS, WhatsApp, etc.
            // Por enquanto, apenas log
        }
    }

    // Gerar número de telefone aleatório
    generatePhoneNumber() {
        const areaCode = '11';
        const number = Math.floor(Math.random() * 90000000) + 10000000;
        return `(${areaCode}) ${number.toString().substring(0, 5)}-${number.toString().substring(5)}`;
    }

    // Gerar nome de cliente aleatório
    generateCustomerName() {
        const names = [
            'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
            'Carlos Lima', 'Fernanda Alves', 'Roberto Souza', 'Juliana Pereira',
            'Marcos Ferreira', 'Patricia Rocha', 'Antonio Nunes', 'Camila Dias'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    // Gerar nome de agente aleatório
    generateAgentName() {
        const agents = [
            'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Silva',
            'Fernanda Alves', 'Roberto Souza', 'Juliana Pereira'
        ];
        return agents[Math.floor(Math.random() * agents.length)];
    }

    // Simular diferentes tipos de eventos
    simulateRandomEvent() {
        const events = [
            () => this.simulateIncomingCall(),
            () => this.simulateMissedCall(),
            () => this.simulateAnsweredCall()
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
    }
}

// Instanciar simulador
window.pbxSimulator = new PBXWebhookSimulator();

// Funções de controle global
window.startPBXSimulation = () => {
    window.pbxSimulator.start();
    alert('Simulação de webhooks 55PBX iniciada!');
};

window.stopPBXSimulation = () => {
    window.pbxSimulator.stop();
    alert('Simulação de webhooks 55PBX parada!');
};

window.simulatePBXCall = () => {
    window.pbxSimulator.simulateRandomEvent();
};

// Auto-iniciar simulação após 5 segundos (opcional)
setTimeout(() => {
    if (window.phoneData && window.phoneData.settings.autoCreateTickets) {
        console.log('🔔 Iniciando simulação automática de webhooks 55PBX...');
        window.pbxSimulator.start();
    }
}, 5000);

console.log('📞 Simulador de webhook 55PBX carregado!');
console.log('💡 Use startPBXSimulation() para iniciar a simulação');
console.log('💡 Use stopPBXSimulation() para parar a simulação');
console.log('💡 Use simulatePBXCall() para simular uma chamada manual');

