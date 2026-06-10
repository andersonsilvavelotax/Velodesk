/**
 * Velodesk — dados de demonstração: 100 tickets, 10 conversas WhatsApp,
 * workflow de escalonamento e campo em árvore no formulário.
 */
(function () {
    const SEED_VERSION = 'velodesk-demo-v4';
    const DEMO_TICKET_TARGET = 100;
    const ESCALATION_FIELD_ID = 'velodesk_escalation_tree';
    const DEMO_TICKET_ID_START = 10001;

    const TICKET_SUBJECTS = [
        'Cobrança duplicada no cartão', 'Internet lenta após upgrade', 'Cancelamento de plano família',
        'Segunda via de boleto', 'Troca de titularidade', 'Portabilidade numérica pendente',
        'Fatura com valor incorreto', 'Reembolso não creditado', 'Ativação de chip travada',
        'Roaming internacional não funcionou', 'Contestação de multa contratual', 'Upgrade de velocidade',
        'Downgrade de plano solicitado', 'Endereço de instalação incorreto', 'Visita técnica não compareceu',
        'Modem com luz vermelha', 'Wi-Fi não conecta em todos os cômodos', 'App não abre após atualização',
        'Senha do portal resetada', 'Bloqueio indevido por inadimplência', 'Negociação de débito',
        'Parcelamento de fatura em atraso', 'Comprovante de pagamento não reconhecido', 'Débito automático falhou',
        'Nota fiscal não recebida', 'Alteração de vencimento', 'Isenção de taxa de adesão',
        'Contrato corporativo — novas linhas', 'Renovação de contrato empresarial', 'SLA não cumprido',
        'Reclamação de atendimento anterior', 'Solicitação de gravação de ligação', 'Ouvidoria — prazo excedido',
        'Caso especial — cliente VIP', 'Fraude em compra de aparelho', 'Garantia de equipamento',
        'Entrega de aparelho atrasada', 'Rastreamento de pedido', 'Devolução dentro do prazo',
        'Troca por defeito de fábrica', 'Acessório faltando na caixa', 'Promoção não aplicada',
        'Cashback não liberado', 'Programa de fidelidade', 'Indicação de amigo sem bônus',
        'Mudança de endereço de entrega', 'Agendamento de retirada em loja', 'Horário de entrega inadequado',
        'Pacote de TV com canais ausentes', 'Decoder com erro E-48', 'Gravação na nuvem indisponível',
        'Controle parental não configura', 'Perfil infantil bloqueado', 'Assinatura streaming duplicada',
        'Cancelamento de add-on', 'Ativação de HBO Max', 'Disney+ não vinculado',
        'Suporte Smart TV Samsung', 'Configuração de e-mail no celular', 'Backup de contatos',
        'Chip eSIM não provisionado', 'Dual chip com falha', 'IMEI bloqueado',
        'Antivirus corporativo', 'VPN empresa não conecta', 'Licença Office expirada',
        'Phishing reportado pelo cliente', 'Conta hackeada — recuperação', 'Spam em SMS marketing',
        'Opt-out de comunicações', 'LGPD — exclusão de dados', 'Portabilidade de dados',
        'Acessibilidade no app', 'Leitor de tela incompatível', 'Atendimento em libras solicitado',
        'Documentação para PcD', 'Isenção de taxa de instalação', 'Prioridade atendimento idoso',
        'Procon — protocolo aberto', 'Reclame Aqui respondido', 'Pesquisa CSAT negativa',
        'NPS detrator — retorno gestor', 'Monitoria — script não seguido', 'Treinamento solicitado equipe',
        'Macro incorreta aplicada', 'Tabulação errada no ticket', 'Transferência para N2',
        'Escalonamento financeiro urgente', 'Estorno parcial solicitado', 'Chargeback em análise',
        'PIX não identificado', 'TED com dados divergentes', 'Conta conjunta — titular falecido',
        'Herança de linha telefônica', 'Inventário de linhas ociosas', 'Desativação em massa filial',
        'Migração pré-pago para pós', 'Plano controle — franquia estourada', 'Roaming América do Sul',
        'Chip turismo Europa', 'Atendimento em inglês', 'Fuso horário incorreto no agendamento',
        'Integração API parceiro', 'Webhook de status falhou', 'Relatório mensal SLA',
        'Dashboard analytics divergente', 'Exportação CSV incompleta', 'Permissão de agente insuficiente'
    ];

    const AGENTS = ['Ana Silva', 'Carlos Mendes', 'Juliana Costa', 'Roberto Lima', 'Fernanda Rocha', 'Paulo Henrique', 'Mariana Dias', 'Lucas Almeida'];
    const CLIENTS = ['João Pedro', 'Maria Oliveira', 'Pedro Santos', 'Ana Beatriz', 'Lucas Ferreira', 'Camila Souza', 'Rafael Gomes', 'Beatriz Martins', 'Thiago Ribeiro', 'Larissa Nunes'];
    const CHANNELS = ['whatsapp', 'telefone', 'email', 'chat', 'portal'];
    const PRIORITIES = ['Baixa', 'Média', 'Alta', 'Urgente'];
    const STATUSES = ['novo', 'em-aberto', 'em-espera', 'pendente', 'resolvido'];
    const ESCALATION_TARGETS = ['Financeiro', 'N2', 'Ouvidoria', 'Casos especiais'];

    const WA_CONVERSATIONS = [
        { id: 'velodesk_demo_wa_1', name: 'Maria — Cobrança duplicada', phone: '+5511988112233', subject: 'cobrança' },
        { id: 'velodesk_demo_wa_2', name: 'João — Entrega atrasada', phone: '+5511977223344', subject: 'entrega' },
        { id: 'velodesk_demo_wa_3', name: 'Ana — Cancelamento plano', phone: '+5511966334455', subject: 'cancelamento' },
        { id: 'velodesk_demo_wa_4', name: 'Carlos — Dúvida fatura', phone: '+5511955445566', subject: 'fatura' },
        { id: 'velodesk_demo_wa_5', name: 'Fernanda — Internet lenta', phone: '+5511944556677', subject: 'suporte' },
        { id: 'velodesk_demo_wa_6', name: 'Roberto — Reclamação', phone: '+5511933667788', subject: 'reclamação' },
        { id: 'velodesk_demo_wa_7', name: 'Juliana — Troca aparelho', phone: '+5511922778899', subject: 'troca' },
        { id: 'velodesk_demo_wa_8', name: 'Grupo — Contrato Corp', phone: null, subject: 'corporativo', isGroup: true },
        { id: 'velodesk_demo_wa_9', name: 'Paulo — Visita técnica', phone: '+5511911889900', subject: 'visita' },
        { id: 'velodesk_demo_wa_10', name: 'Larissa — Portabilidade', phone: '+5511900990011', subject: 'portabilidade' }
    ];

    const WA_MESSAGE_TEMPLATES = {
        cobrança: [
            { from: 'them', text: 'Bom dia! Vi duas cobranças iguais na fatura deste mês.' },
            { from: 'me', text: 'Olá Maria, vou verificar seu extrato agora.' },
            { from: 'them', text: 'O valor é R$ 89,90 apareceu duas vezes.' },
            { from: 'me', text: 'Identifiquei a duplicidade. Abri o protocolo #10015 para estorno.' }
        ],
        entrega: [
            { from: 'them', text: 'Meu pedido #45892 deveria ter chegado ontem.' },
            { from: 'me', text: 'Vou consultar a transportadora.' },
            { from: 'them', text: 'Preciso do aparelho para trabalhar.' },
            { from: 'me', text: 'Previsão atualizada: entrega amanhã até 18h.' }
        ],
        cancelamento: [
            { from: 'them', text: 'Quero cancelar o plano família, somos 4 linhas.' },
            { from: 'me', text: 'Posso ajudar. Qual o motivo do cancelamento?' },
            { from: 'them', text: 'Mudança para outra operadora por preço.' }
        ],
        fatura: [
            { from: 'them', text: 'Não entendi um item "serviços digitais" na fatura.' },
            { from: 'me', text: 'Esse item refere-se ao pacote de streaming incluso.' },
            { from: 'them', text: 'Ah, entendi. Obrigada!' }
        ],
        suporte: [
            { from: 'them', text: 'A internet cai toda hora desde terça.' },
            { from: 'me', text: 'Já reiniciou o modem?' },
            { from: 'them', text: 'Sim, várias vezes. Luz vermelha piscando.' },
            { from: 'me', text: 'Vou agendar visita técnica para hoje à tarde.' }
        ],
        reclamação: [
            { from: 'them', text: 'Fiquei 40 min na fila e a ligação caiu.' },
            { from: 'me', text: 'Lamento muito. Vou registrar sua reclamação formalmente.' },
            { from: 'them', text: 'Quero falar com a ouvidoria.' }
        ],
        troca: [
            { from: 'them', text: 'O celular chegou com a tela riscada.' },
            { from: 'me', text: 'Pode enviar uma foto do defeito?' },
            { from: 'them', text: 'Enviei agora. Quero troca imediata.' }
        ],
        corporativo: [
            { from: 'them', text: 'Pessoal, precisamos de 20 linhas novas na filial SP.' },
            { from: 'me', text: 'Vou encaminhar para o time corporativo.' },
            { from: 'them', text: 'Prazo: até dia 15.' }
        ],
        visita: [
            { from: 'them', text: 'Confirmam visita técnica para sábado?' },
            { from: 'me', text: 'Temos horário das 8h às 12h. Serve?' },
            { from: 'them', text: 'Perfeito, estarei em casa.' }
        ],
        portabilidade: [
            { from: 'them', text: 'Portabilidade foi solicitada há 5 dias e nada.' },
            { from: 'me', text: 'Consultando o sistema da Anatel...' },
            { from: 'them', text: 'Meu número é 11 90099-0011' },
            { from: 'me', text: 'Está em processamento, conclusão em 24h.' }
        ]
    };

    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString(); }

    function ensureEscalationWorkflow() {
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        const wfId = 'velodesk_wf_escalation';
        const existing = workflows.find(w => String(w.id) === wfId);
        const payload = {
            id: wfId,
            name: 'Escalonamento de Ticket',
            description: 'Encaminha para Financeiro, N2, Ouvidoria ou Casos especiais quando selecionado no formulário.',
            trigger: 'ticket-updated',
            active: true,
            actions: [{ type: 'route-escalation', fieldId: ESCALATION_FIELD_ID }],
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (existing) {
            Object.assign(existing, payload);
        } else {
            workflows.push(payload);
        }
        localStorage.setItem('workflows', JSON.stringify(workflows));
    }

    function buildKanbanSkeleton() {
        return [
            { id: 'novos', name: 'Novos', tickets: [] },
            { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
            { id: 'em-espera', name: 'Em Espera', tickets: [] },
            { id: 'pendentes', name: 'Pendentes', tickets: [] },
            { id: 'resolvidos', name: 'Resolvidos', tickets: [] },
            { id: 'em-aberto', name: 'Em Aberto', tickets: [] },
            { id: 'financeiro', name: 'Financeiro', tickets: [] },
            { id: 'n2', name: 'N2', tickets: [] },
            { id: 'ouvidoria', name: 'Ouvidoria', tickets: [] },
            { id: 'casos-especiais', name: 'Casos Especiais', tickets: [] }
        ];
    }

    function getFormIdForSeed() {
        const forms = JSON.parse(localStorage.getItem('forms') || '[]');
        const testForm = forms.find(f => f.name === 'Teste Form');
        if (testForm) return testForm.id;
        if (forms.length) return forms[0].id;
        return null;
    }

    function createTicket(index, formId, boxPlan) {
        const id = DEMO_TICKET_ID_START + index;
        const subject = TICKET_SUBJECTS[index % TICKET_SUBJECTS.length];
        const status = boxPlan.status || rand(STATUSES);
        const createdAt = daysAgo(Math.floor(Math.random() * 30) + 1);
        const client = rand(CLIENTS);
        const agent = rand(AGENTS);
        const ticket = {
            id,
            title: subject,
            description: `Chamado referente a: ${subject}. Cliente relatou necessidade de acompanhamento.`,
            status,
            channel: rand(CHANNELS),
            priority: rand(PRIORITIES),
            createdAt,
            updatedAt: daysAgo(Math.floor(Math.random() * 5)),
            formId,
            formData: {},
            clientName: client,
            solicitante: client,
            responsibleAgent: agent,
            group: boxPlan.group || 'N1',
            messages: [{
                id: id * 10,
                text: `Abertura automática: ${subject}`,
                type: 'system',
                timestamp: createdAt
            }],
            internalNotes: []
        };

        if (formId) {
            ticket.formData['categoria_demo'] = rand(['Suporte > Técnico > Rede', 'Suporte > Financeiro > Cobrança', 'Vendas > Orçamento']);
            ticket.formData['prioridade_demo'] = ticket.priority;
            if (boxPlan.escalation) {
                ticket.formData[ESCALATION_FIELD_ID] = boxPlan.escalation;
                ticket.escalationQueue = boxPlan.escalation;
                ticket.group = boxPlan.escalation;
            }
        }
        return ticket;
    }

    function seedTickets() {
        if (typeof ensureEscalationFieldOnForms === 'function') {
            ensureEscalationFieldOnForms();
        }
        const formId = getFormIdForSeed();
        const kanban = buildKanbanSkeleton();

        const plan = [];
        const boxDistribution = [
            { boxId: 'novos', count: 12, status: 'novo' },
            { boxId: 'em-andamento', count: 15, status: 'em-aberto' },
            { boxId: 'em-espera', count: 10, status: 'em-espera' },
            { boxId: 'pendentes', count: 14, status: 'pendente' },
            { boxId: 'resolvidos', count: 25, status: 'resolvido' },
            { boxId: 'em-aberto', count: 8, status: 'em-aberto' },
            { boxId: 'financeiro', count: 6, status: 'em-aberto', escalation: 'Financeiro' },
            { boxId: 'n2', count: 5, status: 'em-aberto', escalation: 'N2' },
            { boxId: 'ouvidoria', count: 3, status: 'pendente', escalation: 'Ouvidoria' },
            { boxId: 'casos-especiais', count: 2, status: 'pendente', escalation: 'Casos especiais' }
        ];

        let idx = 0;
        boxDistribution.forEach(bd => {
            for (let i = 0; i < bd.count; i++) {
                plan.push({ boxId: bd.boxId, status: bd.status, escalation: bd.escalation, group: bd.escalation || 'N1' });
            }
        });

        plan.forEach((bp, i) => {
            const ticket = createTicket(i, formId, bp);
            const box = kanban.find(b => b.id === bp.boxId);
            if (box) box.tickets.push(ticket);
        });

        localStorage.setItem('kanbanColumns', JSON.stringify(kanban));
        return kanban;
    }

    function seedWhatsApp() {
        const conversations = WA_CONVERSATIONS.map((c, i) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            lastMessage: (WA_MESSAGE_TEMPLATES[c.subject] || []).slice(-1)[0]?.text || 'Olá!',
            lastMessageTime: daysAgo(i % 3),
            unread: i % 4 === 0 ? 2 : (i % 3 === 0 ? 1 : 0),
            isGroup: !!c.isGroup
        }));

        const messagesMap = {};
        WA_CONVERSATIONS.forEach((c, i) => {
            const tpl = WA_MESSAGE_TEMPLATES[c.subject] || [{ from: 'them', text: 'Olá, preciso de ajuda.' }];
            messagesMap[c.id] = tpl.map((m, j) => ({
                id: `${c.id}_msg_${j}`,
                text: m.text,
                sender: m.from === 'me' ? 'me' : 'them',
                timestamp: daysAgo(i + j * 0.1),
                type: 'text'
            }));
        });

        let existing = [];
        try {
            existing = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
            if (!Array.isArray(existing)) existing = [];
        } catch (e) { existing = []; }

        const demoIds = new Set(WA_CONVERSATIONS.map(c => c.id));
        const merged = existing.filter(c => !demoIds.has(String(c.id)));
        merged.push(...conversations);
        localStorage.setItem('whatsappConversations', JSON.stringify(merged));

        let allMsgs = {};
        try {
            allMsgs = JSON.parse(localStorage.getItem('whatsappConversationMessages') || '{}');
        } catch (e) { allMsgs = {}; }
        Object.assign(allMsgs, messagesMap);
        localStorage.setItem('whatsappConversationMessages', JSON.stringify(allMsgs));

        const settings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
        settings.connected = true;
        localStorage.setItem('whatsappSettings', JSON.stringify(settings));
    }

    function countKanbanTickets() {
        try {
            const kanban = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
            if (!Array.isArray(kanban)) return 0;
            return kanban.reduce((sum, box) => sum + (box.tickets ? box.tickets.length : 0), 0);
        } catch (e) {
            return 0;
        }
    }

    function countDemoTickets() {
        try {
            const kanban = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
            if (!Array.isArray(kanban)) return 0;
            let count = 0;
            kanban.forEach(box => {
                (box.tickets || []).forEach(t => {
                    if (t && Number(t.id) >= DEMO_TICKET_ID_START) count++;
                });
            });
            return count;
        } catch (e) {
            return 0;
        }
    }

    function hasDemoWhatsAppConversations() {
        try {
            const list = JSON.parse(localStorage.getItem('whatsappConversations') || '[]');
            if (!Array.isArray(list)) return false;
            return list.some(c => c && String(c.id).startsWith('velodesk_demo_wa_'));
        } catch (e) {
            return false;
        }
    }

    function needsDemoSeed() {
        if (localStorage.getItem('velodeskSeedVersion') !== SEED_VERSION) return true;
        if (countDemoTickets() < DEMO_TICKET_TARGET) return true;
        if (!hasDemoWhatsAppConversations()) return true;
        return false;
    }

    function needsClientProfilesSeed() {
        try {
            const raw = localStorage.getItem('velodeskClientProfiles');
            if (!raw) return true;
            const profiles = JSON.parse(raw);
            return !Array.isArray(profiles) || profiles.length < 5;
        } catch (e) {
            return true;
        }
    }

    function seedVelodeskDemoData(force) {
        if (!force && !needsDemoSeed()) {
            return { skipped: true };
        }
        if (typeof ensureEscalationFieldOnForms === 'function') {
            ensureEscalationFieldOnForms();
        }
        ensureEscalationWorkflow();
        seedTickets();
        seedWhatsApp();
        localStorage.setItem('velodeskSeedVersion', SEED_VERSION);
        return { skipped: false, tickets: 100, conversations: 10 };
    }

    /**
     * Restaura todo o ambiente de testes: tickets, WhatsApp, workflow,
     * formulários e perfis do portal do cliente.
     */
    function restoreVelodeskDemoEnvironment(force, silent) {
        let restored = false;
        const parts = [];

        if (force || needsDemoSeed()) {
            seedVelodeskDemoData(true);
            restored = true;
            parts.push('100 tickets', '10 conversas WhatsApp', 'workflow de escalação');
        }

        if (force || needsClientProfilesSeed()) {
            if (window.VelodeskClientPortal) {
                window.VelodeskClientPortal.seedClientProfiles(true);
                restored = true;
                parts.push('5 perfis do portal cliente');
            }
        }

        if (typeof createTestFormIfNeeded === 'function') {
            createTestFormIfNeeded();
        }
        if (typeof ensureEscalationFieldOnForms === 'function') {
            ensureEscalationFieldOnForms();
        }

        if (restored) {
            if (typeof loadBoxes === 'function') loadBoxes();
            if (typeof loadDashboardStats === 'function') loadDashboardStats();
            if (typeof loadWhatsAppConversations === 'function') loadWhatsAppConversations();
            if (window.VelodeskEco?.loadPortalCliente && document.getElementById('portalCliente')?.classList.contains('active')) {
                window.VelodeskEco.loadPortalCliente();
            }
            if (!silent && typeof showNotification === 'function') {
                showNotification('Ambiente demo restaurado: ' + parts.join(', ') + '.', 'success');
            }
        }

        return { restored, parts };
    }

    window.seedVelodeskDemoData = seedVelodeskDemoData;
    window.restoreVelodeskDemoEnvironment = restoreVelodeskDemoEnvironment;
    window.countKanbanTickets = countKanbanTickets;
    window.countDemoTickets = countDemoTickets;
    window.VELDESK_ESCALATION_FIELD_ID = ESCALATION_FIELD_ID;

    function bootDemoRestore(attempt) {
        const n = attempt || 0;
        if (typeof ensureEscalationFieldOnForms !== 'function' && n < 25) {
            setTimeout(function () { bootDemoRestore(n + 1); }, 200);
            return;
        }
        const result = restoreVelodeskDemoEnvironment(true, n > 0);
        console.log('[Velodesk Demo]', result.restored ? 'Ambiente restaurado' : 'Nada a restaurar', result);
        window.VelodeskDemoReady = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(function () { bootDemoRestore(0); }, 400);
        });
    } else {
        setTimeout(function () { bootDemoRestore(0); }, 400);
    }
})();
