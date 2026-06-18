/**
 * Velodesk Desk V2 — CRM 5 colunas integrado ao Cockpit (?desk=v2)
 */
(function () {
    'use strict';

    var QUEUE_STATUSES = [
        { id: 'novos', name: 'Novos', dot: '#1634FF', boxes: ['novos'] },
        { id: 'em-andamento', name: 'Em andamento', dot: '#15A237', boxes: ['em-andamento', 'em-aberto'] },
        { id: 'pendente', name: 'Pendente', dot: '#FCC200', boxes: ['em-espera', 'pendentes'] },
        { id: 'resolvidos', name: 'Resolvidos', dot: '#9ca3af', boxes: ['resolvidos'] }
    ];

    var SEND_STATUS_OPTIONS = [
        { id: 'em-andamento', label: 'Enviar como: Em Andamento', cls: 'andamento' },
        { id: 'pendente', label: 'Enviar como: Pendente', cls: 'pendente' },
        { id: 'resolvidos', label: 'Enviar como: Resolvido', cls: 'resolvido' }
    ];

    var CASCADE_CATEGORIES = [
        { id: 'emprestimo-pessoal', label: 'Empréstimo pessoal' },
        { id: 'antecipacao', label: 'Antecipação' },
        { id: 'alteracao-dados', label: 'Alteração de dados' }
    ];

    var CASCADE_ACTIONS = [
        { id: 'cancelamento', label: 'Cancelamento' },
        { id: 'estorno', label: 'Estorno' }
    ];

    var ESCALONAR_OPTIONS = [
        { id: 'n2', label: 'N2' },
        { id: 'financeiro', label: 'Financeiro' },
        { id: 'suporte', label: 'Suporte' }
    ];

    var SLA_LABELS = {
        ok: 'Dentro do prazo',
        warning: 'Atenção — SLA',
        critical: 'SLA crítico'
    };

    var state = {
        activeQueue: 'em-andamento',
        activeTicketId: null,
        activeSort: 'data',
        composeMode: 'public',
        mainTab: 'conversa',
        searchQuery: '',
        queuePanelCollapsed: false,
        ticketListCollapsed: false,
        clientEditOpen: false,
        clientEditDocBound: false,
        sendStatusMenuOpen: false,
        sendStatusDocBound: false,
        cascadeCategory: null,
        cascadeAction: null,
        cascadeCategoryMenuOpen: false,
        cascadeActionMenuOpen: false,
        cascadeDocBound: false,
        escalonar: null,
        escalonarMenuOpen: false,
        escalonarDocBound: false,
        createTicketOpen: false,
        createTicketClient: null,
        createTicketClientKey: null,
        createTicketPreviewVisible: false,
        createTicketChannel: 'Telefone',
        createTicketEventsBound: false
    };

    function isDeskV2Mode() {
        return new URLSearchParams(window.location.search).get('desk') === 'v2';
    }

    function $(sel, ctx) {
        return (ctx || document).querySelector(sel);
    }

    function $$(sel, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getInitials(name) {
        var parts = String(name || '??').trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return String(name || '?').slice(0, 2).toUpperCase();
    }

    function getAgentName() {
        try {
            var user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return user.name || 'Ana Silva';
        } catch (e) {
            return 'Ana Silva';
        }
    }

    function getKanbanColumns() {
        return JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
    }

    function saveKanbanColumns(columns) {
        localStorage.setItem('kanbanColumns', JSON.stringify(columns));
    }

    function lookupClient(cpfRaw) {
        var digits = String(cpfRaw || '').replace(/\D/g, '');
        if (!digits) return null;
        try {
            var db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
            return db[digits] || null;
        } catch (e) {
            return null;
        }
    }

    function normalizeCpf(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function formatCpf(digits) {
        var d = normalizeCpf(digits);
        if (d.length !== 11) return digits || '';
        return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function getClientContactFields(ticket, client) {
        return {
            name: ticket.clientName || ticket.solicitante || (client && client.name) || '',
            cpf: formatCpf((ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || (client && client.cpf) || ''),
            email: (client && client.email) || ticket.clientEmail || '',
            phone: (client && client.telefone) || ticket.clientPhone || ''
        };
    }

    function channelIcon(channel) {
        var c = String(channel || '').toLowerCase();
        if (c.indexOf('whats') >= 0) return 'ti-brand-whatsapp';
        if (c.indexOf('telefone') >= 0 || c.indexOf('phone') >= 0) return 'ti-phone';
        if (c.indexOf('mail') >= 0 || c.indexOf('e-mail') >= 0) return 'ti-mail';
        if (c.indexOf('portal') >= 0) return 'ti-world';
        return 'ti-message';
    }

    function mapTicketQueueId(ticket, boxId) {
        if (boxId === 'novos') return 'novos';
        if (boxId === 'em-andamento' || boxId === 'em-aberto' || ticket.status === 'em-aberto') return 'em-andamento';
        if (boxId === 'em-espera' || boxId === 'pendentes' || ticket.status === 'pendente') return 'pendente';
        if (boxId === 'resolvidos' || ticket.status === 'resolvido') return 'resolvidos';
        return 'em-andamento';
    }

    function statusMeta(ticket, queueId) {
        var map = {
            'em-andamento': { label: 'Em andamento', cls: 'andamento' },
            'novos': { label: 'Novo', cls: 'novo' },
            'pendente': { label: 'Pendente', cls: 'pendente' },
            'resolvidos': { label: 'Resolvido', cls: 'resolvido' }
        };
        return map[queueId] || { label: 'Em andamento', cls: 'andamento' };
    }

    function formatTicketDate(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
            ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function getTicketTitle(ticket) {
        return ticket.title || ticket.description || 'Sem assunto';
    }

    function ensureTicketSlaFields(ticket) {
        if (ticket.slaRemaining != null && ticket.slaStatus) return;
        var priority = String(ticket.priority || '').toLowerCase();
        var limitHours = priority === 'critica' || priority === 'critical' ? 4
            : priority === 'alta' || priority === 'high' ? 8 : 24;
        var created = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
        var elapsedMin = Math.max(0, Math.round((Date.now() - created) / 60000));
        var totalMin = limitHours * 60;
        ticket.slaRemaining = totalMin - elapsedMin;
        if (ticket.slaRemaining <= 0) ticket.slaStatus = 'critical';
        else if (ticket.slaRemaining <= Math.min(60, totalMin * 0.2)) ticket.slaStatus = 'warning';
        else ticket.slaStatus = 'ok';
    }

    function getTicketSlaStatus(ticket) {
        ensureTicketSlaFields(ticket);
        if (ticket.slaStatus === 'critical' || ticket.slaStatus === 'overdue') return 'critical';
        if (ticket.slaStatus === 'warning' || ticket.slaStatus === 'attention') return 'warning';
        if (ticket.slaRemaining != null) {
            if (ticket.slaRemaining <= 0) return 'critical';
            if (ticket.slaRemaining <= 30) return 'warning';
        }
        return 'ok';
    }

    function formatMsgMeta(iso, author) {
        if (!iso) return author || '';
        var d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' às ' +
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
            (author ? ' · ' + author : '');
    }

    function getAllCockpitTickets() {
        var columns = getKanbanColumns();
        var list = [];
        columns.forEach(function (box) {
            (box.tickets || []).forEach(function (t) {
                list.push({
                    ticket: t,
                    boxId: box.id,
                    queueId: mapTicketQueueId(t, box.id)
                });
            });
        });
        return list;
    }

    function findTicketEntry(ticketId) {
        var id = String(ticketId);
        var columns = getKanbanColumns();
        for (var i = 0; i < columns.length; i++) {
            var box = columns[i];
            var t = (box.tickets || []).find(function (x) { return String(x.id) === id; });
            if (t) return { ticket: t, boxId: box.id, box: box, queueId: mapTicketQueueId(t, box.id) };
        }
        return null;
    }

    function ensureExtendedClientDB() {
        try {
            var db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
            var patch = {
                '45678912345': {
                    cpf: '456.789.123-45',
                    name: 'João Ferreira',
                    email: 'joao.ferreira@email.com',
                    telefone: '(11) 99876-5432',
                    situacao: 'Adimplente',
                    produtos: ['Internet Fibra'],
                    risco: 'Baixo',
                    termometro: 45,
                    termometroLabel: 'Estável',
                    atendimentos: [{ data: '2026-06-10', canal: 'E-mail', assunto: 'Segunda via fatura', status: 'Aberto' }],
                    analise: 'Cliente regular; solicitação financeira simples.'
                },
                '55566677788': {
                    cpf: '555.666.777-88',
                    name: 'Carlos Mendes',
                    email: 'carlos.mendes@email.com',
                    telefone: '(11) 97654-3210',
                    situacao: 'Adimplente',
                    produtos: ['TV'],
                    risco: 'Médio',
                    termometro: 52,
                    termometroLabel: 'Atenção',
                    atendimentos: [{ data: '2026-06-08', canal: 'Telefone', assunto: 'Cancelamento TV', status: 'Aberto' }],
                    analise: 'Cliente solicitando cancelamento — oportunidade de retenção.'
                }
            };
            var changed = false;
            Object.keys(patch).forEach(function (key) {
                if (!db[key]) {
                    db[key] = patch[key];
                    changed = true;
                }
            });
            if (changed) localStorage.setItem('velodeskClientDB', JSON.stringify(db));
        } catch (e) { /* noop */ }
    }

    function normalizeTicketForDeskV2(ticket) {
        if (!ticket) return ticket;

        if (!ticket.lateralForm) ticket.lateralForm = {};

        if ((ticket.clientName || '').indexOf('Carlos Mendes') >= 0 &&
            normalizeCpf(ticket.clientCPF || ticket.lateralForm.cpf) === '98765432100') {
            ticket.clientCPF = '555.666.777-88';
            ticket.lateralForm.cpf = '55566677788';
        }

        var cpfDigits = normalizeCpf(ticket.lateralForm.cpf || ticket.clientCPF);
        if (cpfDigits && !ticket.lateralForm.cpf) ticket.lateralForm.cpf = cpfDigits;
        if (cpfDigits && !ticket.clientCPF) ticket.clientCPF = formatCpf(cpfDigits);

        var client = lookupClient(cpfDigits);

        ticket.clientName = ticket.clientName || ticket.solicitante || (client && client.name) || 'Cliente';
        ticket.solicitante = ticket.solicitante || ticket.clientName;

        if (!ticket.lateralForm.canal) {
            ticket.lateralForm.canal = ticket.channel || ticket.source || 'WhatsApp';
        }
        if (!ticket.lateralForm.classificacaoTipo) ticket.lateralForm.classificacaoTipo = 'Solicitação';
        if (!ticket.lateralForm.produto) {
            ticket.lateralForm.produto = (client && client.produtos && client.produtos[0]) || 'Internet Fibra';
        }
        if (!ticket.lateralForm.motivo) ticket.lateralForm.motivo = 'Em análise';
        if (!ticket.lateralForm.responsavel) {
            ticket.lateralForm.responsavel = ticket.responsibleAgent || ticket.assignedTo || getAgentName();
        }
        if (ticket.lateralForm.automacaoCategoria === undefined) ticket.lateralForm.automacaoCategoria = '';
        if (ticket.lateralForm.automacaoAcao === undefined) ticket.lateralForm.automacaoAcao = '';
        if (ticket.lateralForm.escalonar === undefined) ticket.lateralForm.escalonar = '';

        ensureTicketSlaFields(ticket);

        if (!ticket.clientEmail && client && client.email) ticket.clientEmail = client.email;
        if (!ticket.clientPhone && client && client.telefone) ticket.clientPhone = client.telefone;

        if (!ticket.channel && ticket.lateralForm.canal) ticket.channel = ticket.lateralForm.canal;
        if (!ticket.source && ticket.channel) ticket.source = ticket.channel;

        if (!ticket.messages || !ticket.messages.length) {
            var created = ticket.createdAt || new Date().toISOString();
            ticket.messages = [{
                fromClient: true,
                type: 'client',
                text: ticket.description || ticket.title || 'Solicitação do cliente.',
                timestamp: created,
                author: ticket.clientName
            }];
        }

        if (!ticket.updatedAt) ticket.updatedAt = ticket.createdAt || new Date().toISOString();
        if (!ticket.createdAt) ticket.createdAt = ticket.updatedAt;

        return ticket;
    }

    function migrateAllTicketsForDeskV2() {
        ensureExtendedClientDB();
        var columns = getKanbanColumns();
        if (!columns.length) return;

        var changed = false;
        columns.forEach(function (box) {
            (box.tickets || []).forEach(function (t, idx) {
                var before = JSON.stringify(t);
                normalizeTicketForDeskV2(t);
                if (JSON.stringify(t) !== before) changed = true;
            });
        });

        if (changed) saveKanbanColumns(columns);
    }

    function ensureDeskV2PrototypeTickets() {
        if (localStorage.getItem('velodeskDeskV2Seeded') === '1') return;

        if (typeof window.seedDemoTickets === 'function') {
            window.seedDemoTickets({ force: false, replaceAll: false });
        }

        var columns = getKanbanColumns();
        if (!columns.length) {
            columns = [
                { id: 'novos', name: 'Novos', tickets: [] },
                { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
                { id: 'em-espera', name: 'Pendente', tickets: [] },
                { id: 'pendentes', name: 'Aguardando retorno', tickets: [] },
                { id: 'resolvidos', name: 'Resolvidos', tickets: [] }
            ];
        }

        function findBox(id) {
            return columns.find(function (b) { return b.id === id; });
        }

        function moveTicketByName(name, targetBoxId) {
            columns.forEach(function (box) {
                if (!box.tickets) return;
                box.tickets.forEach(function (t) {
                    if ((t.clientName || t.solicitante || '').indexOf(name) >= 0) {
                        t.status = targetBoxId === 'em-andamento' ? 'em-aberto' : t.status;
                    }
                });
            });
            var target = findBox(targetBoxId);
            if (!target) return;
            if (!target.tickets) target.tickets = [];
            for (var i = columns.length - 1; i >= 0; i--) {
                var box = columns[i];
                if (box.id === targetBoxId) continue;
                box.tickets = (box.tickets || []).filter(function (t) {
                    var match = (t.clientName || '').indexOf(name) >= 0;
                    if (match) target.tickets.push(t);
                    return !match;
                });
            }
        }

        moveTicketByName('Maria Oliveira', 'em-andamento');

        var now = Date.now();
        var extras = [
            {
                id: now + 901,
                title: 'Cancelamento de plano TV',
                description: 'Cliente solicita cancelamento do plano TV.',
                status: 'pendente',
                clientName: 'Carlos Mendes',
                solicitante: 'Carlos Mendes',
                clientCPF: '555.666.777-88',
                clientEmail: 'carlos.mendes@email.com',
                clientPhone: '(11) 97654-3210',
                channel: 'Telefone',
                createdAt: new Date(now - 86400000).toISOString(),
                updatedAt: new Date(now - 86400000).toISOString(),
                messages: [{
                    fromClient: true,
                    type: 'client',
                    text: 'Quero cancelar meu plano de TV. Não uso mais e o valor está alto.',
                    timestamp: new Date(now - 86400000).toISOString(),
                    author: 'Carlos Mendes'
                }],
                lateralForm: {
                    canal: 'Telefone',
                    classificacaoTipo: 'Solicitação',
                    produto: 'TV',
                    motivo: 'Cancelamento',
                    cpf: '55566677788',
                    automacaoCategoria: '',
                    automacaoAcao: ''
                }
            },
            {
                id: now + 902,
                title: 'Segunda via de fatura',
                description: 'Cliente precisa da segunda via da fatura.',
                status: 'novo',
                clientName: 'João Ferreira',
                solicitante: 'João Ferreira',
                clientCPF: '456.789.123-45',
                clientEmail: 'joao.ferreira@email.com',
                clientPhone: '(11) 99876-5432',
                channel: 'E-mail',
                createdAt: new Date(now - 3600000).toISOString(),
                updatedAt: new Date(now - 3600000).toISOString(),
                messages: [{
                    fromClient: true,
                    type: 'client',
                    text: 'Preciso da segunda via da minha fatura de junho. Não consigo acessar pelo portal.',
                    timestamp: new Date(now - 3600000).toISOString(),
                    author: 'João Ferreira'
                }],
                lateralForm: {
                    canal: 'E-mail',
                    classificacaoTipo: 'Solicitação',
                    produto: 'Internet Fibra',
                    motivo: 'Sem conexão',
                    cpf: '45678912345',
                    automacaoCategoria: '',
                    automacaoAcao: ''
                }
            }
        ];

        extras.forEach(function (t) {
            var exists = getAllCockpitTickets().some(function (e) {
                return (e.ticket.clientName || '') === t.clientName;
            });
            if (exists) return;
            var boxId = t.clientName.indexOf('Carlos') >= 0 ? 'pendentes' : 'novos';
            var box = findBox(boxId);
            if (box) {
                if (!box.tickets) box.tickets = [];
                box.tickets.push(t);
            }
        });

        saveKanbanColumns(columns);
        localStorage.setItem('velodeskDeskV2Seeded', '1');
        migrateAllTicketsForDeskV2();
    }

    function getFilteredTickets() {
        var q = state.searchQuery.toLowerCase();
        return getAllCockpitTickets().filter(function (entry) {
            if (entry.queueId !== state.activeQueue) return false;
            if (!q) return true;
            var t = entry.ticket;
            var hay = [t.id, t.title, t.description, t.clientName, t.solicitante].join(' ').toLowerCase();
            return hay.indexOf(q) >= 0;
        }).sort(function (a, b) {
            if (state.activeSort === 'prioridade') {
                var pri = { critica: 0, alta: 1, normal: 2 };
                return (pri[a.ticket.priority] || 9) - (pri[b.ticket.priority] || 9);
            }
            var da = new Date(a.ticket.updatedAt || a.ticket.createdAt || 0);
            var db = new Date(b.ticket.updatedAt || b.ticket.createdAt || 0);
            return db - da;
        });
    }

    function countQueue(queueId) {
        var status = QUEUE_STATUSES.find(function (s) { return s.id === queueId; });
        if (!status) return 0;
        return getAllCockpitTickets().filter(function (e) { return e.queueId === queueId; }).length;
    }

    function buildProducts(ticket, client) {
        var prod = (ticket.lateralForm && ticket.lateralForm.produto) || '';
        var list = client && client.produtos ? client.produtos.slice() : [];
        if (prod && list.indexOf(prod) < 0) list.unshift(prod);
        if (!list.length && prod) list = [prod];
        return list.map(function (p) {
            var lower = String(p).toLowerCase();
            var cls = 'default';
            var icon = 'ti-box';
            if (lower.indexOf('fibra') >= 0 || lower.indexOf('internet') >= 0) { cls = 'fibra'; icon = 'ti-wifi'; }
            else if (lower.indexOf('tv') >= 0) { cls = 'tv'; icon = 'ti-tv'; }
            else if (lower.indexOf('combo') >= 0) { cls = 'combo'; icon = 'ti-packages'; }
            return { label: p, cls: cls, icon: icon };
        });
    }

    function buildTags(ticket) {
        var tags = [];
        var lf = ticket.lateralForm || {};
        if (lf.produto) tags.push(lf.produto.replace(/Internet\s+/i, '').trim() || lf.produto);
        if (lf.motivo) tags.push(lf.motivo);
        if (!tags.length && ticket.priority) tags.push(ticket.priority);
        return tags.slice(0, 3);
    }

    function buildIaReply(ticket) {
        var lf = ticket.lateralForm || {};
        var name = (ticket.clientName || 'cliente').split(' ')[0];
        return 'Olá ' + name + '! Entendo sua solicitação sobre ' + (lf.motivo || ticket.title || 'seu atendimento') +
            '. Vou verificar agora e retorno em instantes com a melhor solução.';
    }

    function buildIaTabulation(ticket) {
        var lf = ticket.lateralForm || {};
        return (lf.classificacaoTipo || 'Solicitação') + ' → ' +
            (lf.produto || 'Produto') + ' → ' +
            (lf.motivo || 'Motivo') + ' → ' +
            (lf.detalhe || 'Em análise');
    }

    function buildConversationMessages(ticket) {
        var msgs = [];
        var created = ticket.createdAt || new Date().toISOString();
        msgs.push({
            type: 'system',
            text: 'Ticket #' + ticket.id + ' criado — ' + (ticket.title || 'Sem título'),
            meta: formatMsgMeta(created, 'Sistema')
        });

        (ticket.messages || []).forEach(function (m) {
            if (m.type === 'system') return;
            var isClient = m.fromClient || m.type === 'client';
            msgs.push({
                type: isClient ? 'client' : 'agent',
                initials: isClient ? getInitials(ticket.clientName || m.author) : 'AS',
                text: m.text || m.message || '',
                meta: formatMsgMeta(m.timestamp || m.createdAt, m.author || (isClient ? ticket.clientName : 'Ana Silva'))
            });
        });
        return msgs;
    }

    function getCreateTicketHistoryHtml(clientKey) {
        var items;
        if (clientKey === '12345678901') {
            items = [
                { dot: '#15A237', title: 'Queda de sinal — resolvido', meta: '12/03/2026 · Internet Fibra · #1781698000012' },
                { dot: '#15A237', title: 'Upgrade de plano — concluído', meta: '08/01/2026 · Solicitação · #1781690000087' },
                { dot: '#9CA3AF', title: 'Dúvida sobre fatura — resolvido', meta: '21/11/2025 · Financeiro · #1781680000034' }
            ];
        } else {
            items = [
                { dot: '#9CA3AF', title: 'Nenhum histórico recente', meta: '—' }
            ];
        }
        return items.map(function (it) {
            return '<div class="hist-item">' +
                '<span class="hist-item__dot" style="background:' + it.dot + '"></span>' +
                '<div><div class="hist-item__title">' + escapeHtml(it.title) + '</div>' +
                '<div class="hist-item__meta">' + escapeHtml(it.meta) + '</div></div></div>';
        }).join('');
    }

    function getCreateTicketWorkspaceHtml() {
        var agent = escapeHtml(getAgentName());
        return '<div class="ct-workspace" id="createTicketWorkspace" aria-hidden="true">' +
            '<div class="ct-form-panel" id="createTicketFormPanel">' +
            '<header class="ct-header">' +
            '<button type="button" class="ct-back-btn" id="btnCreateTicketBack" title="Voltar"><i class="ti ti-arrow-left"></i></button>' +
            '<h2 class="ct-header__title">Criar ticket</h2>' +
            '<span class="ct-header__badge">Novo</span></header>' +
            '<div class="ct-body">' +
            '<div class="ct-sec-lbl">Cliente</div>' +
            '<div class="ct-field"><label class="ct-flbl" for="ctClientSearch">Buscar por CPF, nome ou e-mail <span class="ct-req">*</span></label>' +
            '<div class="cpf-wrap">' +
            '<input type="text" class="cpf-inp" id="ctClientSearch" placeholder="123.456.789-01 ou nome do cliente" autocomplete="off">' +
            '<button type="button" class="cpf-btn" id="btnCtClientSearch"><i class="ti ti-search"></i> Buscar</button>' +
            '</div></div>' +
            '<div class="ct-field"><label class="ct-flbl">Canal de entrada <span class="ct-req">*</span></label>' +
            '<div class="ch-grid" id="ctChannelGrid">' +
            '<button type="button" class="ch-opt" data-channel="WhatsApp"><i class="ti ti-brand-whatsapp"></i><span>WhatsApp</span></button>' +
            '<button type="button" class="ch-opt on" data-channel="Telefone"><i class="ti ti-phone"></i><span>Telefone</span></button>' +
            '<button type="button" class="ch-opt" data-channel="E-mail"><i class="ti ti-mail"></i><span>E-mail</span></button>' +
            '</div></div>' +
            '<div class="ct-field"><label class="ct-flbl" for="ctAssunto">Assunto <span class="ct-req">*</span></label>' +
            '<input type="text" class="ct-input" id="ctAssunto" name="assunto" placeholder="Resumo breve do problema ou solicitação"></div>' +
            '<div class="ct-sec-lbl">Classificação</div>' +
            '<div class="f-row2">' +
            '<div class="ct-field"><label class="ct-flbl" for="ctTipo">Tipo <span class="ct-req">*</span></label>' +
            '<select class="ct-select" id="ctTipo" name="tipo">' +
            '<option>Reclamação</option><option>Solicitação</option><option>Dúvida</option><option>Elogio</option></select></div>' +
            '<div class="ct-field"><label class="ct-flbl" for="ctProduto">Produto <span class="ct-req">*</span></label>' +
            '<select class="ct-select" id="ctProduto" name="produto">' +
            '<option>Internet Fibra</option><option>TV</option><option>Telefone</option><option>Combo</option></select></div>' +
            '</div>' +
            '<div class="f-row2">' +
            '<div class="ct-field"><label class="ct-flbl" for="ctMotivo">Motivo <span class="ct-req">*</span></label>' +
            '<select class="ct-select" id="ctMotivo" name="motivo">' +
            '<option>Lentidão</option><option>Queda de sinal</option><option>Sem conexão</option><option>Intermitência</option></select></div>' +
            '<div class="ct-field"><label class="ct-flbl" for="ctAtribuir">Atribuir a</label>' +
            '<select class="ct-select" id="ctAtribuir" name="atribuir">' +
            '<option>' + agent + ' (eu)</option><option>Fila geral</option><option>Nível 2</option></select></div>' +
            '</div>' +
            '<div class="ct-field"><label class="ct-flbl" for="ctDescricao">Descrição</label>' +
            '<textarea class="ct-textarea" id="ctDescricao" name="descricao" placeholder="Descreva o problema ou solicitação com detalhes…"></textarea></div>' +
            '</div>' +
            '<footer class="ct-footer">' +
            '<button type="button" class="ct-btn-cancel" id="btnCreateTicketCancel">Cancelar</button>' +
            '<button type="button" class="ct-btn-save" id="btnCreateTicketSave"><i class="ti ti-device-floppy"></i> Salvar</button>' +
            '</footer></div>' +
            '<aside class="preview-panel" id="createTicketPreview">' +
            '<header class="preview-header">' +
            '<span class="preview-header__title">Prévia do Ticket</span>' +
            '<span class="preview-header__live"><span class="preview-header__dot"></span>Atualiza em tempo real</span></header>' +
            '<div class="prev-card">' +
            '<div class="prev-card__top">' +
            '<div class="prev-card__id">#AUTO · criado agora por ' + agent + '</div>' +
            '<div class="prev-card-title" id="prevCardTitle">Sem título</div>' +
            '<div class="prev-card__sub" id="prevCardSub">—</div></div>' +
            '<div class="prev-card__body">' +
            '<div class="prev-line"><i class="ti ti-phone"></i><span class="prev-tag ch" id="prevTagChannel">Telefone</span></div>' +
            '<div class="prev-line"><i class="ti ti-tag"></i>' +
            '<span class="prev-tag type" id="prevTagTipo">Reclamação</span>' +
            '<span class="prev-tag prod" id="prevTagProduto">Internet Fibra</span>' +
            '<span class="prev-tag mot" id="prevTagMotivo">Lentidão</span></div>' +
            '<div class="prev-line"><i class="ti ti-user"></i>Atribuído a <span class="prev-atribuido" id="prevAtribuido">' + agent + ' (eu)</span></div>' +
            '<div class="prev-line"><i class="ti ti-clock"></i>Aberto em <span class="prev-opened-date" id="prevOpenedAt">—</span></div></div>' +
            '<div class="prev-desc" id="prevDesc">""</div></div>' +
            '<div class="preview-history">' +
            '<div class="ct-sec-lbl">Histórico da Cliente</div>' +
            '<div id="prevHistoryList"></div></div></aside></div>';
    }

    function searchClientByQuery(query) {
        var q = String(query || '').trim().toLowerCase();
        if (q.length < 3) return null;
        var digits = q.replace(/\D/g, '');
        try {
            var db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
            var keys = Object.keys(db);
            var i;
            if (digits.length >= 3) {
                for (i = 0; i < keys.length; i++) {
                    if (keys[i].indexOf(digits) === 0 || digits.indexOf(keys[i]) === 0) {
                        return { key: keys[i], client: db[keys[i]] };
                    }
                }
            }
            for (i = 0; i < keys.length; i++) {
                var c = db[keys[i]];
                var name = String(c.name || '').toLowerCase();
                var email = String(c.email || '').toLowerCase();
                if (name.indexOf(q) >= 0 || email.indexOf(q) >= 0) {
                    return { key: keys[i], client: c };
                }
            }
        } catch (e) { /* noop */ }
        return null;
    }

    function formatCreateTicketOpenedAt() {
        var d = new Date();
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function resetCreateTicketForm() {
        var search = $('#ctClientSearch');
        var assunto = $('#ctAssunto');
        var desc = $('#ctDescricao');
        if (search) search.value = '';
        if (assunto) assunto.value = '';
        if (desc) desc.value = '';
        var tipo = $('#ctTipo');
        var prod = $('#ctProduto');
        var mot = $('#ctMotivo');
        var atr = $('#ctAtribuir');
        if (tipo) tipo.selectedIndex = 0;
        if (prod) prod.selectedIndex = 0;
        if (mot) mot.selectedIndex = 0;
        if (atr) atr.selectedIndex = 0;
        state.createTicketClient = null;
        state.createTicketClientKey = null;
        state.createTicketPreviewVisible = false;
        state.createTicketChannel = 'Telefone';
        $$('#ctChannelGrid .ch-opt').forEach(function (opt) {
            opt.classList.toggle('on', opt.getAttribute('data-channel') === 'Telefone');
        });
        var shell = $('#deskAppShell');
        if (shell) shell.classList.remove('has-preview');
        var preview = $('#createTicketPreview');
        if (preview) preview.classList.remove('visible');
        updateCreateTicketPreviewFields();
    }

    function updateCreateTicketPreviewFields() {
        var assunto = $('#ctAssunto');
        var title = $('#prevCardTitle');
        if (title) title.textContent = (assunto && assunto.value.trim()) || 'Sem título';
        var sub = $('#prevCardSub');
        if (sub) {
            if (state.createTicketClient) {
                var cpf = formatCpf(state.createTicketClientKey || state.createTicketClient.cpf);
                sub.textContent = (state.createTicketClient.name || 'Cliente') + ' · CPF ' + cpf;
            } else {
                sub.textContent = '—';
            }
        }
        var ch = $('#prevTagChannel');
        if (ch) ch.textContent = state.createTicketChannel || 'Telefone';
        var tipo = $('#ctTipo');
        var prod = $('#ctProduto');
        var mot = $('#ctMotivo');
        var atr = $('#ctAtribuir');
        var pt = $('#prevTagTipo');
        var pp = $('#prevTagProduto');
        var pm = $('#prevTagMotivo');
        var pa = $('#prevAtribuido');
        if (pt && tipo) pt.textContent = tipo.value;
        if (pp && prod) pp.textContent = prod.value;
        if (pm && mot) pm.textContent = mot.value;
        if (pa && atr) pa.textContent = atr.value;
        var opened = $('#prevOpenedAt');
        if (opened) opened.textContent = formatCreateTicketOpenedAt();
        var desc = $('#ctDescricao');
        var pd = $('#prevDesc');
        if (pd) pd.textContent = '"' + ((desc && desc.value) || '') + '"';
    }

    function showCreateTicketPreview(clientResult) {
        if (!clientResult) return;
        state.createTicketClient = clientResult.client;
        state.createTicketClientKey = clientResult.key;
        state.createTicketPreviewVisible = true;
        var shell = $('#deskAppShell');
        if (shell) shell.classList.add('has-preview');
        var preview = $('#createTicketPreview');
        if (preview) preview.classList.add('visible');
        var hist = $('#prevHistoryList');
        if (hist) hist.innerHTML = getCreateTicketHistoryHtml(clientResult.key);
        updateCreateTicketPreviewFields();
    }

    function hideCreateTicketPreview() {
        state.createTicketClient = null;
        state.createTicketClientKey = null;
        state.createTicketPreviewVisible = false;
        var shell = $('#deskAppShell');
        if (shell) shell.classList.remove('has-preview');
        var preview = $('#createTicketPreview');
        if (preview) preview.classList.remove('visible');
    }

    function runCreateTicketClientSearch() {
        var input = $('#ctClientSearch');
        var query = input ? input.value.trim() : '';
        if (query.length < 3) {
            if (typeof showNotification === 'function') {
                showNotification('Digite ao menos 3 caracteres para buscar.', 'warning');
            }
            return;
        }
        var result = searchClientByQuery(query);
        if (!result) {
            hideCreateTicketPreview();
            if (typeof showNotification === 'function') {
                showNotification('Cliente não encontrado.', 'error');
            }
            return;
        }
        showCreateTicketPreview(result);
        if (typeof showNotification === 'function') {
            showNotification('Cliente encontrado: ' + result.client.name, 'success');
        }
    }

    function submitCreateTicket() {
        var assuntoEl = $('#ctAssunto');
        var assunto = assuntoEl ? assuntoEl.value.trim() : '';
        if (!assunto) {
            if (typeof showNotification === 'function') showNotification('Informe o assunto do ticket.', 'warning');
            if (assuntoEl) assuntoEl.focus();
            return;
        }
        if (!state.createTicketClient) {
            if (typeof showNotification === 'function') {
                showNotification('Busque e selecione um cliente antes de salvar.', 'warning');
            }
            return;
        }
        var client = state.createTicketClient;
        var columns = getKanbanColumns();
        if (!columns.length) {
            columns = [
                { id: 'novos', name: 'Novos', tickets: [] },
                { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
                { id: 'em-espera', name: 'Pendente', tickets: [] },
                { id: 'pendentes', name: 'Aguardando retorno', tickets: [] },
                { id: 'resolvidos', name: 'Resolvidos', tickets: [] }
            ];
        }
        var novosBox = columns.find(function (b) { return b.id === 'novos'; });
        if (!novosBox) {
            novosBox = { id: 'novos', name: 'Novos', tickets: [] };
            columns.unshift(novosBox);
        }
        if (!novosBox.tickets) novosBox.tickets = [];
        var now = new Date().toISOString();
        var agent = getAgentName();
        var descEl = $('#ctDescricao');
        var desc = descEl ? descEl.value.trim() : '';
        var tipoEl = $('#ctTipo');
        var prodEl = $('#ctProduto');
        var motEl = $('#ctMotivo');
        var atrEl = $('#ctAtribuir');
        var tipo = tipoEl ? tipoEl.value : 'Reclamação';
        var produto = prodEl ? prodEl.value : 'Internet Fibra';
        var motivo = motEl ? motEl.value : 'Lentidão';
        var atribuir = atrEl ? atrEl.value : agent + ' (eu)';
        var cpfDigits = state.createTicketClientKey || normalizeCpf(client.cpf);
        var ticket = {
            id: Date.now(),
            title: assunto,
            description: desc || assunto,
            status: 'novo',
            priority: 'normal',
            channel: state.createTicketChannel,
            source: state.createTicketChannel,
            openedBy: 'agent',
            createdAt: now,
            updatedAt: now,
            messages: desc ? [{
                fromClient: true,
                type: 'client',
                text: desc,
                timestamp: now,
                author: client.name
            }] : [],
            internalNotes: [],
            solicitante: client.name,
            clientName: client.name,
            clientCPF: formatCpf(cpfDigits),
            clientEmail: client.email || '',
            clientPhone: client.telefone || client.phone || '',
            responsibleAgent: agent,
            group: atribuir.indexOf('Nível') >= 0 ? 'Nível 2' : (atribuir.indexOf('Fila') >= 0 ? 'Fila geral' : agent),
            lateralForm: {
                cpf: cpfDigits,
                canal: state.createTicketChannel,
                classificacaoTipo: tipo,
                produto: produto,
                motivo: motivo,
                detalhe: 'Em análise',
                responsavel: agent,
                atribuido: atribuir,
                automacaoCategoria: '',
                automacaoAcao: ''
            }
        };
        normalizeTicketForDeskV2(ticket);
        novosBox.tickets.unshift(ticket);
        saveKanbanColumns(columns);
        closeCreateTicketPanel();
        state.activeQueue = 'novos';
        state.activeTicketId = ticket.id;
        renderQueueList();
        renderTicketCards();
        renderMainTicket({ ticket: ticket, boxId: 'novos', box: novosBox, queueId: 'novos' });
        if (typeof showNotification === 'function') showNotification('Ticket criado com sucesso.', 'success');
    }

    function bindCreateTicketEvents() {
        if (state.createTicketEventsBound) return;
        state.createTicketEventsBound = true;

        var root = $('#velodeskDeskV2Root');
        if (!root) return;

        root.addEventListener('click', function (e) {
            if (!state.createTicketOpen) return;
            if (e.target.closest('#btnCreateTicketBack') || e.target.closest('#btnCreateTicketCancel')) {
                e.preventDefault();
                closeCreateTicketPanel();
                return;
            }
            if (e.target.closest('#btnCreateTicketSave')) {
                e.preventDefault();
                submitCreateTicket();
                return;
            }
            if (e.target.closest('#btnCtClientSearch')) {
                e.preventDefault();
                runCreateTicketClientSearch();
                return;
            }
            var chOpt = e.target.closest('#ctChannelGrid .ch-opt');
            if (chOpt) {
                e.preventDefault();
                state.createTicketChannel = chOpt.getAttribute('data-channel');
                $$('#ctChannelGrid .ch-opt').forEach(function (o) { o.classList.remove('on'); });
                chOpt.classList.add('on');
                updateCreateTicketPreviewFields();
            }
        });

        root.addEventListener('input', function (e) {
            if (!state.createTicketOpen || !state.createTicketPreviewVisible) return;
            if (e.target.id === 'ctAssunto' || e.target.id === 'ctDescricao') {
                updateCreateTicketPreviewFields();
            }
        });

        root.addEventListener('change', function (e) {
            if (!state.createTicketOpen || !state.createTicketPreviewVisible) return;
            var name = e.target.getAttribute('name');
            if (name === 'tipo' || name === 'produto' || name === 'motivo' || name === 'atribuir') {
                updateCreateTicketPreviewFields();
            }
        });

        root.addEventListener('keydown', function (e) {
            if (!state.createTicketOpen) return;
            if (e.target.id === 'ctClientSearch' && e.key === 'Enter') {
                e.preventDefault();
                runCreateTicketClientSearch();
            }
        });
    }

    function openCreateTicketPanel() {
        bindCreateTicketEvents();
        state.createTicketOpen = true;
        var shell = $('#deskAppShell');
        if (shell) shell.classList.add('is-create-ticket');
        resetCreateTicketForm();
        var queue = $('#crmQueuePanel');
        if (queue) queue.classList.add('is-create-strip');
        var opened = $('#prevOpenedAt');
        if (opened) opened.textContent = formatCreateTicketOpenedAt();
        var workspace = $('#createTicketWorkspace');
        if (workspace) {
            workspace.setAttribute('aria-hidden', 'false');
            workspace.classList.add('is-visible');
        }
    }

    function closeCreateTicketPanel() {
        state.createTicketOpen = false;
        var shell = $('#deskAppShell');
        if (shell) {
            shell.classList.remove('is-create-ticket');
            shell.classList.remove('has-preview');
        }
        var workspace = $('#createTicketWorkspace');
        if (workspace) {
            workspace.setAttribute('aria-hidden', 'true');
            workspace.classList.remove('is-visible');
        }
        var queue = $('#crmQueuePanel');
        if (queue) queue.classList.remove('is-create-strip');
        hideCreateTicketPreview();
    }

    function getShellHtml() {
        return '<div class="app-shell" id="deskAppShell">' +
            '<aside class="queue-panel" id="crmQueuePanel">' +
            '<div class="queue-panel__inner">' +
            '<div class="queue-panel__header">' +
            '<div class="queue-panel__header-top">' +
            '<h2 class="queue-panel__title">Fila de atendimento</h2>' +
            '<button type="button" class="crm-panel-retract" id="btnCollapseQueue" title="Recolher fila" aria-expanded="true">' +
            '<i class="ti ti-chevron-left"></i></button></div>' +
            '<label class="queue-search"><i class="ti ti-search"></i>' +
            '<input type="search" id="crmQueueSearch" placeholder="Buscar tickets…"></label></div>' +
            '<ul class="queue-status-list" id="queueStatusList"></ul>' +
            '<div class="queue-panel__footer">' +
            '<button type="button" class="queue-btn queue-btn--secondary" id="crmNewBox"><i class="ti ti-plus"></i> Nova caixa</button>' +
            '<button type="button" class="queue-btn queue-btn--primary" id="crmNewTicket"><i class="ti ti-plus"></i> Criar ticket</button>' +
            '</div></div>' +
            '<button type="button" class="crm-panel-expand-tab crm-panel-expand-tab--queue" id="btnExpandQueue" title="Expandir fila">' +
            '<i class="ti ti-chevron-right"></i><span>FILA</span></button></aside>' +

            '<aside class="ticket-list-panel" id="crmTicketListPanel">' +
            '<div class="ticket-list-panel__inner">' +
            '<div class="ticket-list-header">' +
            '<div class="ticket-list-header__row">' +
            '<h2 class="ticket-list-header__title" id="ticketListTitle">Em andamento · 0</h2>' +
            '<div class="ticket-list-header__actions">' +
            '<button type="button" class="crm-panel-retract" id="btnCollapseTickets" title="Recolher lista" aria-expanded="true">' +
            '<i class="ti ti-chevron-left"></i></button>' +
            '<button type="button" class="crm-icon-btn" title="Filtrar"><i class="ti ti-filter"></i></button>' +
            '<button type="button" class="crm-icon-btn" id="btnRefresh" title="Atualizar"><i class="ti ti-refresh"></i></button>' +
            '</div></div>' +
            '<div class="sort-chips">' +
            '<button type="button" class="sort-chip is-active" data-sort="data">Data</button>' +
            '<button type="button" class="sort-chip" data-sort="prioridade">Prioridade</button>' +
            '<button type="button" class="sort-chip" data-sort="sla">SLA</button>' +
            '</div></div>' +
            '<ul class="ticket-cards" id="ticketCards"></ul></div>' +
            '<button type="button" class="crm-panel-expand-tab crm-panel-expand-tab--tickets" id="btnExpandTickets" title="Expandir lista">' +
            '<i class="ti ti-chevron-right"></i><span>LISTA</span></button></aside>' +

            '<main class="crm-main-content" id="crmMainContent">' +
            '<div class="crm-empty-state" id="crmEmptyMain">Selecione um ticket na lista ao lado</div>' +
            '</main>' +

            '<aside class="crm-right-panel" id="crmRightPanel" style="display:none">' +
            '<div class="crm-right-panel__scroll">' +
            '<section class="rp-section"><div class="rp-section__label">Termômetro do cliente</div>' +
            '<div class="thermo-score" id="thermoScore">38</div>' +
            '<div class="thermo-bar"><div class="thermo-fill" id="thermoFill" style="width:38%"></div></div>' +
            '<div class="thermo-label" id="thermoLabel">Estável</div></section>' +
            '<section class="rp-section"><div class="rp-section__label">Classificação</div>' +
            '<div class="rp-field"><label for="selResponsavel">Responsável</label>' +
            '<input type="text" id="selResponsavel" readonly></div>' +
            '<div class="rp-field"><label for="selCanal">Canal</label><select id="selCanal">' +
            '<option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Portal</option></select></div>' +
            '<div class="rp-field"><label for="selTipo">Tipo</label><select id="selTipo">' +
            '<option>Reclamação</option><option>Solicitação</option><option>Dúvida</option><option>Informação</option></select></div>' +
            '<div class="rp-field"><label for="selProduto">Produto</label><select id="selProduto">' +
            '<option>Internet Fibra</option><option>TV</option><option>Telefone</option><option>Combo</option></select></div>' +
            '<div class="rp-field"><label for="selMotivo">Motivo</label><select id="selMotivo">' +
            '<option>Lentidão</option><option>Queda de sinal</option><option>Sem conexão</option><option>Cancelamento</option><option>Cobrança</option><option>Financeiro</option></select></div></section>' +
            getEscalonarSectionHtml() +
            getCascadeFlowSectionHtml() +
            '<section class="rp-section"><div class="ia-tabulation">' +
            '<div class="ia-tabulation__label">SUGESTÃO IA</div>' +
            '<div class="ia-tabulation__text" id="iaTabulationText"></div>' +
            '<button type="button" class="ia-tabulation__btn" id="btnApplyTabulation">Aplicar tabulação</button>' +
            '</div></section></div>' +
            '<div class="crm-right-panel__footer">' +
            '<button type="button" class="rp-footer-btn rp-footer-btn--secondary" id="btnOpenChat"><i class="ti ti-message-circle"></i> Abrir conversa</button>' +
            '<button type="button" class="rp-footer-btn rp-footer-btn--primary" id="btnSaveTicket"><i class="ti ti-device-floppy"></i> Salvar no ticket</button>' +
            '</div></aside>' +
            getCreateTicketWorkspaceHtml() +
            '</div>';
    }

    function getEscalonarSectionHtml() {
        var options = ESCALONAR_OPTIONS.map(function (opt) {
            return '<button type="button" class="cascade-flow__option" data-escalonar="' + opt.id + '">' + escapeHtml(opt.label) + '</button>';
        }).join('');

        return '<section class="rp-section rp-section--cascade" id="escalonarSection">' +
            '<div class="rp-section__label">Escalonar</div>' +
            '<div class="cascade-flow" id="escalonarFlow">' +
            '<div class="cascade-flow__step cascade-flow__step--category">' +
            '<button type="button" class="cascade-flow__trigger" id="escalonarBtn" aria-haspopup="listbox" aria-expanded="false">' +
            '<span class="cascade-flow__trigger-prefix">Destino</span>' +
            '<span class="cascade-flow__trigger-label" id="escalonarLabel">Selecionar escalonamento</span>' +
            '<i class="ti ti-chevron-down"></i></button>' +
            '<div class="cascade-flow__menu" id="escalonarMenu" role="listbox" hidden>' + options + '</div></div>' +
            '<div class="cascade-flow__summary" id="escalonarSummary" hidden></div>' +
            '</div></section>';
    }

    function getCascadeFlowSectionHtml() {
        var categoryOptions = CASCADE_CATEGORIES.map(function (cat) {
            return '<button type="button" class="cascade-flow__option" data-cascade-category="' + cat.id + '">' + escapeHtml(cat.label) + '</button>';
        }).join('');
        var actionOptions = CASCADE_ACTIONS.map(function (act) {
            return '<button type="button" class="cascade-flow__option cascade-flow__option--action" data-cascade-action="' + act.id + '">' + escapeHtml(act.label) + '</button>';
        }).join('');

        return '<section class="rp-section rp-section--cascade" id="cascadeFlowSection">' +
            '<div class="rp-section__label">Fluxo de automação</div>' +
            '<div class="cascade-flow" id="cascadeFlow">' +
            '<div class="cascade-flow__step cascade-flow__step--category">' +
            '<button type="button" class="cascade-flow__trigger" id="cascadeCategoryBtn" aria-haspopup="listbox" aria-expanded="false">' +
            '<span class="cascade-flow__trigger-prefix">Categoria</span>' +
            '<span class="cascade-flow__trigger-label" id="cascadeCategoryLabel">Selecionar categoria</span>' +
            '<i class="ti ti-chevron-down"></i></button>' +
            '<div class="cascade-flow__menu" id="cascadeCategoryMenu" role="listbox" hidden>' + categoryOptions + '</div></div>' +
            '<div class="cascade-flow__step cascade-flow__step--action" id="cascadeActionStep" aria-hidden="true">' +
            '<button type="button" class="cascade-flow__trigger cascade-flow__trigger--secondary" id="cascadeActionBtn" aria-haspopup="listbox" aria-expanded="false" disabled>' +
            '<span class="cascade-flow__trigger-prefix">Ação</span>' +
            '<span class="cascade-flow__trigger-label" id="cascadeActionLabel">Selecionar ação</span>' +
            '<i class="ti ti-chevron-down"></i></button>' +
            '<div class="cascade-flow__menu" id="cascadeActionMenu" role="listbox" hidden>' + actionOptions + '</div></div>' +
            '<div class="cascade-flow__summary" id="cascadeSummary" hidden></div>' +
            '</div></section>';
    }

    function getEscalonarLabel(id) {
        var opt = ESCALONAR_OPTIONS.find(function (o) { return o.id === id; });
        return opt ? opt.label : '';
    }

    function closeEscalonarMenu() {
        var menu = $('#escalonarMenu');
        var btn = $('#escalonarBtn');
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
        state.escalonarMenuOpen = false;
    }

    function updateEscalonarUI() {
        var label = $('#escalonarLabel');
        var btn = $('#escalonarBtn');
        var summary = $('#escalonarSummary');
        if (label) {
            label.textContent = state.escalonar
                ? getEscalonarLabel(state.escalonar)
                : 'Selecionar escalonamento';
        }
        if (btn) btn.classList.toggle('is-selected', !!state.escalonar);
        if (summary) {
            if (state.escalonar) {
                summary.hidden = false;
                summary.innerHTML = '<i class="ti ti-arrow-up-right"></i> Escalonado para <strong>' +
                    escapeHtml(getEscalonarLabel(state.escalonar)) + '</strong>';
            } else {
                summary.hidden = true;
                summary.innerHTML = '';
            }
        }
    }

    function persistEscalonarToTicket(entry) {
        entry = entry || findTicketEntry(state.activeTicketId);
        if (!entry) return;
        if (!entry.ticket.lateralForm) entry.ticket.lateralForm = {};
        entry.ticket.lateralForm.escalonar = state.escalonar || '';
        entry.ticket.updatedAt = new Date().toISOString();
        saveKanbanColumns(getKanbanColumns());
    }

    function restoreEscalonarFromTicket(entry) {
        var lf = (entry && entry.ticket && entry.ticket.lateralForm) || {};
        state.escalonar = lf.escalonar || null;
        updateEscalonarUI();
    }

    function selectEscalonar(optionId, entry) {
        entry = entry || findTicketEntry(state.activeTicketId);
        state.escalonar = optionId;
        closeEscalonarMenu();
        closeCascadeMenus();
        updateEscalonarUI();
        persistEscalonarToTicket(entry);
        if (typeof window.showNotification === 'function') {
            showNotification('Escalonado para ' + getEscalonarLabel(optionId), 'success');
        }
    }

    function bindEscalonarEvents(entry) {
        var btn = $('#escalonarBtn');
        var menu = $('#escalonarMenu');

        if (btn) {
            btn.onclick = function (e) {
                e.stopPropagation();
                var open = !state.escalonarMenuOpen;
                closeEscalonarMenu();
                closeCascadeMenus();
                if (open && menu) {
                    menu.hidden = false;
                    btn.setAttribute('aria-expanded', 'true');
                    state.escalonarMenuOpen = true;
                }
            };
        }

        if (menu) {
            menu.querySelectorAll('[data-escalonar]').forEach(function (opt) {
                opt.onclick = function (e) {
                    e.stopPropagation();
                    selectEscalonar(opt.getAttribute('data-escalonar'), entry);
                };
            });
        }

        if (!state.escalonarDocBound) {
            state.escalonarDocBound = true;
            document.addEventListener('click', function (e) {
                if (!state.escalonarMenuOpen) return;
                if (e.target.closest('#escalonarFlow')) return;
                closeEscalonarMenu();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeEscalonarMenu();
            });
        }
    }

    function getCascadeCategoryLabel(id) {
        var cat = CASCADE_CATEGORIES.find(function (c) { return c.id === id; });
        return cat ? cat.label : '';
    }

    function getCascadeActionLabel(id) {
        var act = CASCADE_ACTIONS.find(function (a) { return a.id === id; });
        return act ? act.label : '';
    }

    function closeCascadeMenus() {
        var catMenu = $('#cascadeCategoryMenu');
        var actMenu = $('#cascadeActionMenu');
        var catBtn = $('#cascadeCategoryBtn');
        var actBtn = $('#cascadeActionBtn');
        if (catMenu) catMenu.hidden = true;
        if (actMenu) actMenu.hidden = true;
        if (catBtn) catBtn.setAttribute('aria-expanded', 'false');
        if (actBtn) actBtn.setAttribute('aria-expanded', 'false');
        state.cascadeCategoryMenuOpen = false;
        state.cascadeActionMenuOpen = false;
        closeEscalonarMenu();
    }

    function updateCascadeFlowUI() {
        var catLabel = $('#cascadeCategoryLabel');
        var actLabel = $('#cascadeActionLabel');
        var actionStep = $('#cascadeActionStep');
        var actionBtn = $('#cascadeActionBtn');
        var summary = $('#cascadeSummary');
        var catBtn = $('#cascadeCategoryBtn');

        if (catLabel) {
            catLabel.textContent = state.cascadeCategory
                ? getCascadeCategoryLabel(state.cascadeCategory)
                : 'Selecionar categoria';
        }
        if (catBtn) catBtn.classList.toggle('is-selected', !!state.cascadeCategory);

        if (actionStep) {
            actionStep.classList.toggle('is-visible', !!state.cascadeCategory);
            actionStep.setAttribute('aria-hidden', state.cascadeCategory ? 'false' : 'true');
        }
        if (actionBtn) actionBtn.disabled = !state.cascadeCategory;

        if (actLabel) {
            actLabel.textContent = state.cascadeAction
                ? getCascadeActionLabel(state.cascadeAction)
                : 'Selecionar ação';
        }
        if (actionBtn) actionBtn.classList.toggle('is-selected', !!state.cascadeAction);

        if (summary) {
            if (state.cascadeCategory && state.cascadeAction) {
                summary.hidden = false;
                summary.innerHTML = '<i class="ti ti-route"></i> ' +
                    escapeHtml(getCascadeCategoryLabel(state.cascadeCategory)) +
                    ' <span class="cascade-flow__summary-arrow">→</span> ' +
                    escapeHtml(getCascadeActionLabel(state.cascadeAction));
            } else {
                summary.hidden = true;
                summary.innerHTML = '';
            }
        }
    }

    function persistCascadeToTicket(entry) {
        entry = entry || findTicketEntry(state.activeTicketId);
        if (!entry) return;
        if (!entry.ticket.lateralForm) entry.ticket.lateralForm = {};
        entry.ticket.lateralForm.automacaoCategoria = state.cascadeCategory || '';
        entry.ticket.lateralForm.automacaoAcao = state.cascadeAction || '';
        entry.ticket.updatedAt = new Date().toISOString();
        saveKanbanColumns(getKanbanColumns());
    }

    function restoreCascadeFromTicket(entry) {
        var lf = (entry && entry.ticket && entry.ticket.lateralForm) || {};
        state.cascadeCategory = lf.automacaoCategoria || null;
        state.cascadeAction = lf.automacaoAcao || null;
        if (!state.cascadeCategory) state.cascadeAction = null;
        updateCascadeFlowUI();
    }

    function selectCascadeCategory(categoryId, entry) {
        entry = entry || findTicketEntry(state.activeTicketId);
        if (state.cascadeCategory !== categoryId) {
            state.cascadeAction = null;
        }
        state.cascadeCategory = categoryId;
        closeCascadeMenus();
        updateCascadeFlowUI();
        persistCascadeToTicket(entry);
        if (typeof window.showNotification === 'function') {
            showNotification('Categoria selecionada: ' + getCascadeCategoryLabel(categoryId), 'info');
        }
    }

    function selectCascadeAction(actionId, entry) {
        entry = entry || findTicketEntry(state.activeTicketId);
        state.cascadeAction = actionId;
        closeCascadeMenus();
        updateCascadeFlowUI();
        persistCascadeToTicket(entry);
        if (typeof window.showNotification === 'function') {
            showNotification('Fluxo: ' + getCascadeCategoryLabel(state.cascadeCategory) + ' → ' + getCascadeActionLabel(actionId), 'success');
        }
    }

    function bindCascadeFlowEvents(entry) {
        var catBtn = $('#cascadeCategoryBtn');
        var actBtn = $('#cascadeActionBtn');
        var catMenu = $('#cascadeCategoryMenu');
        var actMenu = $('#cascadeActionMenu');

        if (catBtn) {
            catBtn.onclick = function (e) {
                e.stopPropagation();
                var open = !state.cascadeCategoryMenuOpen;
                closeCascadeMenus();
                if (open && catMenu) {
                    catMenu.hidden = false;
                    catBtn.setAttribute('aria-expanded', 'true');
                    state.cascadeCategoryMenuOpen = true;
                }
            };
        }

        if (actBtn) {
            actBtn.onclick = function (e) {
                e.stopPropagation();
                if (!state.cascadeCategory) return;
                var open = !state.cascadeActionMenuOpen;
                closeCascadeMenus();
                if (open && actMenu) {
                    actMenu.hidden = false;
                    actBtn.setAttribute('aria-expanded', 'true');
                    state.cascadeActionMenuOpen = true;
                }
            };
        }

        if (catMenu) {
            catMenu.querySelectorAll('[data-cascade-category]').forEach(function (opt) {
                opt.onclick = function (e) {
                    e.stopPropagation();
                    selectCascadeCategory(opt.getAttribute('data-cascade-category'), entry);
                };
            });
        }

        if (actMenu) {
            actMenu.querySelectorAll('[data-cascade-action]').forEach(function (opt) {
                opt.onclick = function (e) {
                    e.stopPropagation();
                    selectCascadeAction(opt.getAttribute('data-cascade-action'), entry);
                };
            });
        }

        if (!state.cascadeDocBound) {
            state.cascadeDocBound = true;
            document.addEventListener('click', function (e) {
                if (!state.cascadeCategoryMenuOpen && !state.cascadeActionMenuOpen) return;
                if (e.target.closest('#cascadeFlow')) return;
                closeCascadeMenus();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeCascadeMenus();
            });
        }
    }

    function buildVeloProductTagsHtml(ticket, client) {
        var products = client && client.produtos ? client.produtos.slice() : [];
        var prod = (ticket.lateralForm && ticket.lateralForm.produto) || '';
        if (prod && products.indexOf(prod) < 0) products.unshift(prod);
        if (!products.length && prod) products = [prod];
        if (!products.length) return '<span class="ticket-client-profile__empty">—</span>';
        return products.map(function (p) {
            var lower = String(p).toLowerCase();
            var cls = 'velo-tag--default';
            if (lower.indexOf('móvel') >= 0 || lower.indexOf('movel') >= 0) cls = 'velo-tag--mobile';
            else if (lower.indexOf('combo') >= 0) cls = 'velo-tag--combo';
            else if (lower.indexOf('fibra') >= 0 || lower.indexOf('internet') >= 0) cls = 'velo-tag--fiber';
            else if (lower.indexOf('tv') >= 0) cls = 'velo-tag--tv';
            else if (lower.indexOf('fixo') >= 0 || lower.indexOf('telefone') >= 0) cls = 'velo-tag--landline';
            else if (lower.indexOf('streaming') >= 0) cls = 'velo-tag--streaming';
            return '<span class="velo-product-tag ' + cls + '">' + escapeHtml(p) + '</span>';
        }).join('');
    }

    function getClientEditPopoverHtml() {
        return '<div class="crm-client-edit-popover" id="clientEditPopover" role="dialog" aria-labelledby="clientEditPopoverTitle" aria-hidden="true" hidden>' +
            '<button type="button" class="crm-client-edit-popover__close" id="btnCloseClientEdit" title="Fechar" aria-label="Fechar">' +
            '<i class="ti ti-x"></i></button>' +
            '<h3 class="crm-client-edit-popover__title" id="clientEditPopoverTitle">Editar contato</h3>' +
            '<div class="crm-client-edit-popover__fields">' +
            '<label class="crm-client-edit-popover__label" for="editClientName">Nome</label>' +
            '<input type="text" class="crm-client-edit-popover__input" id="editClientName" autocomplete="name">' +
            '<label class="crm-client-edit-popover__label" for="editClientCpf">CPF</label>' +
            '<input type="text" class="crm-client-edit-popover__input" id="editClientCpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00">' +
            '<label class="crm-client-edit-popover__label" for="editClientEmail">E-mail</label>' +
            '<input type="email" class="crm-client-edit-popover__input" id="editClientEmail" autocomplete="email">' +
            '<label class="crm-client-edit-popover__label" for="editClientPhone">Telefone</label>' +
            '<input type="tel" class="crm-client-edit-popover__input" id="editClientPhone" autocomplete="tel">' +
            '</div>' +
            '<div class="crm-client-edit-popover__footer">' +
            '<button type="button" class="crm-client-edit-popover__save" id="btnSaveClientEdit">Salvar</button>' +
            '</div></div>';
    }

    function getTicketMacroHubHtml(ticketId) {
        if (typeof window.renderTicketMacroHubHTML === 'function') {
            return window.renderTicketMacroHubHTML(String(ticketId));
        }
        return '<div class="ticket-macro-hub">' +
            '<select class="ticket-macro-select" aria-label="Central de opções de resposta" ' +
            'onchange="applyTicketMacroFromSelect(this, \'' + ticketId + '\')">' +
            '<option value="">Central de opções</option>' +
            '<option value="F1">F1 — Saudação padrão</option>' +
            '<option value="F2">F2 — Aguardar retorno</option>' +
            '<option value="F3">F3 — Escalonamento</option>' +
            '<option value="F4">F4 — Encerramento NPS</option>' +
            '</select></div>';
    }

    function getComposePanelHtml(ticketId) {
        var tid = String(ticketId);
        return '<div class="ticket-response octa-comment-panel crm-ticket-response">' +
            '<div class="octa-comment-panel-row">' +
            '<div class="octa-panel-avatar" aria-hidden="true"><i class="fas fa-user"></i></div>' +
            '<div class="octa-panel-box">' +
            '<div class="response-tabs octa-nav-tabs">' +
            '<button type="button" class="response-tab octa-nav-tab octa-tab-public active" data-tab="public-' + tid + '" data-compose="public">' +
            '<i class="fas fa-envelope"></i> Resposta pública</button>' +
            '<button type="button" class="response-tab octa-nav-tab octa-tab-internal" data-tab="internal-' + tid + '" data-compose="internal">' +
            '<i class="fas fa-edit"></i> Anotação interna</button></div>' +
            '<div class="response-content octa-response-panel-body">' +
            '<div class="response-tab-content active" id="public-' + tid + '">' +
            '<div class="response-form">' +
            '<textarea class="response-textarea" id="publicResponse-' + tid + '" data-ai-skip="true" placeholder="Digite sua resposta ao cliente..." rows="5"></textarea>' +
            '<div class="response-actions ticket-response-actions">' +
            getTicketMacroHubHtml(tid) +
            '<button type="button" class="btn-secondary" id="btnCrmAiAssistant">' +
            '<i class="fas fa-robot"></i> Assistente IA</button></div></div></div>' +
            '<div class="response-tab-content" id="internal-' + tid + '">' +
            '<div class="response-form internal-form">' +
            '<div class="internal-note-header">' +
            '<i class="fas fa-lock"></i>' +
            '<span>Anotação interna — não será enviada ao cliente</span></div>' +
            '<textarea class="response-textarea internal-textarea" id="internalResponse-' + tid + '" data-ai-skip="true" placeholder="Digite uma anotação interna..." rows="5"></textarea>' +
            '</div></div></div></div></div></div>' +
            '<div class="crm-ticket-compose-footer">' +
            '<div class="crm-send-status" id="crmSendStatus">' +
            '<button type="button" class="crm-send-status__trigger crm-send-status__trigger--andamento" id="crmStatusDropdown" aria-haspopup="listbox" aria-expanded="false">' +
            'Enviar como: Em Andamento <i class="ti ti-chevron-down"></i></button>' +
            '<div class="crm-send-status__menu" id="crmStatusMenu" role="listbox" hidden>' +
            SEND_STATUS_OPTIONS.map(function (opt) {
                return '<button type="button" class="crm-send-status__option crm-send-status__option--' + opt.cls + '" role="option" data-send-status="' + opt.id + '">' + opt.label + '</button>';
            }).join('') +
            '</div></div></div>';
    }

    function getMainTicketHtml(ticketId) {
        return '<div class="crm-client-profile-bar">' +
            '<section class="ticket-client-profile ticket-client-profile--compact" id="ticketClientProfile" aria-label="Perfil do cliente">' +
            '<div class="ticket-client-profile__row ticket-client-profile__row--top">' +
            '<span class="ticket-client-profile__name-wrap" id="headerInfo">' +
            '<strong class="ticket-client-profile__name" id="profileName"></strong>' +
            '<button type="button" class="crm-edit-client-btn" id="btnEditClient" title="Editar contato" aria-expanded="false" aria-controls="clientEditPopover">' +
            '<i class="ti ti-pencil"></i></button>' +
            getClientEditPopoverHtml() +
            '</span>' +
            '<span class="ticket-client-profile__contact"><i class="fas fa-envelope"></i> <span id="profileEmail"></span></span>' +
            '<span class="ticket-client-profile__contact"><i class="fas fa-phone"></i> <span id="profilePhone"></span></span>' +
            '</div>' +
            '<div class="ticket-client-profile__row ticket-client-profile__row--bottom">' +
            '<span class="ticket-client-profile__cpf"><span class="ticket-client-profile__label">CPF</span> <span id="profileCpf"></span></span>' +
            '<span class="ticket-client-profile__products" id="profileProducts"></span>' +
            '</div>' +
            '<button type="button" class="btn-secondary btn-sm ticket-client-history-btn" id="btnClientHistory">' +
            '<i class="fas fa-history"></i> Histórico de tickets</button>' +
            '</section></div>' +
            '<nav class="tabs-top" aria-label="Navegação do ticket">' +
            '<button type="button" class="tab-btn' + (state.mainTab === 'conversa' ? ' is-active' : '') + '" data-main-tab="conversa">' +
            '<i class="ti ti-message-2"></i> Conversa</button>' +
            '<button type="button" class="tab-btn' + (state.mainTab === 'notas' ? ' is-active' : '') + '" data-main-tab="notas">' +
            '<i class="ti ti-file-text"></i> Notas</button></nav>' +
            '<div class="crm-conversation-wrap">' +
            '<div class="tab-panel' + (state.mainTab === 'conversa' ? ' is-active' : '') + '" data-panel="conversa">' +
            '<div class="conversation" id="conversation"></div>' +
            getComposePanelHtml(ticketId) +
            '</div>' +
            '<div class="tab-panel tab-panel--placeholder' + (state.mainTab === 'notas' ? ' is-active' : '') + '" data-panel="notas">' +
            '<p>Nenhuma nota interna registrada.</p></div></div>';
    }

    function renderQueueList() {
        var list = $('#queueStatusList');
        if (!list) return;
        list.innerHTML = QUEUE_STATUSES.map(function (s) {
            var active = s.id === state.activeQueue ? ' is-active' : '';
            return '<li class="queue-status-item' + active + '" data-queue="' + s.id + '">' +
                '<span class="queue-status-item__dot" style="background:' + s.dot + '"></span>' +
                '<span class="queue-status-item__name">' + escapeHtml(s.name) + '</span>' +
                '<span class="queue-status-item__count">' + countQueue(s.id) + '</span></li>';
        }).join('');
    }

    function renderTicketCards() {
        var list = $('#ticketCards');
        var title = $('#ticketListTitle');
        var entries = getFilteredTickets();
        var qName = (QUEUE_STATUSES.find(function (s) { return s.id === state.activeQueue; }) || {}).name || '';

        if (title) title.textContent = qName + ' · ' + entries.length;
        if (!list) return;

        if (!entries.length) {
            list.innerHTML = '<li class="crm-empty-state" style="padding:16px;font-size:14px;">Nenhum ticket nesta fila</li>';
            return;
        }

        list.innerHTML = entries.map(function (entry) {
            var t = entry.ticket;
            normalizeTicketForDeskV2(t);
            var meta = statusMeta(t, entry.queueId);
            var active = String(t.id) === String(state.activeTicketId) ? ' is-active' : '';
            var sla = getTicketSlaStatus(t);
            var tags = buildTags(t).map(function (tag) {
                return '<span class="crm-tag">' + escapeHtml(tag) + '</span>';
            }).join('');
            return '<li class="crm-ticket-card' + active + '" data-ticket-id="' + t.id + '">' +
                '<div class="crm-ticket-card__top">' +
                '<span class="crm-ticket-card__name">' + escapeHtml(t.clientName || t.solicitante || 'Cliente') + '</span>' +
                '<span class="status-badge status-badge--' + meta.cls + '">' + escapeHtml(meta.label) + '</span></div>' +
                '<div class="crm-ticket-card__subject">' + escapeHtml(getTicketTitle(t)) + '</div>' +
                '<div class="crm-ticket-card__meta">' +
                '<span>' + escapeHtml(formatTicketDate(t.updatedAt || t.createdAt)) + '</span></div>' +
                '<div class="crm-ticket-card__tags">' + tags + '</div>' +
                '<span class="crm-ticket-card__sla crm-ticket-card__sla--' + sla + '" title="' + escapeHtml(SLA_LABELS[sla]) + '" aria-label="' + escapeHtml(SLA_LABELS[sla]) + '"></span></li>';
        }).join('');
    }

    function renderMessage(msg) {
        if (msg.type === 'system') {
            return '<div class="msg-row"><div class="msg-avatar msg-avatar--system"><i class="ti ti-terminal"></i></div>' +
                '<div class="msg-body"><div class="msg-bubble msg-bubble--system">' + escapeHtml(msg.text) + '</div>' +
                '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
        }
        if (msg.type === 'client') {
            return '<div class="msg-row"><div class="msg-avatar msg-avatar--client">' + escapeHtml(msg.initials) + '</div>' +
                '<div class="msg-body"><div class="msg-bubble msg-bubble--client">' + escapeHtml(msg.text) + '</div>' +
                '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
        }
        return '<div class="msg-row msg-row--agent"><div class="msg-avatar msg-avatar--agent">' + escapeHtml(msg.initials) + '</div>' +
            '<div class="msg-body"><div class="msg-bubble msg-bubble--agent">' + escapeHtml(msg.text) + '</div>' +
            '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
    }

    function renderMainTicket(entry) {
        var root = $('#velodeskDeskV2Root');
        if (!root || !entry) return;

        var t = entry.ticket;
        normalizeTicketForDeskV2(t);
        var client = lookupClient((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
        var name = t.clientName || t.solicitante || 'Cliente';
        var cpf = formatCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF || (client && client.cpf) || '') || '—';
        var iaReply = buildIaReply(t);
        var iaTab = buildIaTabulation(t);
        var convMsgs = buildConversationMessages(t);

        var main = $('#crmMainContent');
        var right = $('#crmRightPanel');
        if (main) main.innerHTML = getMainTicketHtml(t.id);
        if (right) right.style.display = '';

        state.composeMode = 'public';
        closeCascadeMenus();
        closeSendStatusMenu();

        stripComposeAiReview();
        removeFocusContextPanel();
        populateClientProfile(t, client);

        var conv = $('#conversation');
        if (conv) {
            conv.innerHTML = convMsgs.map(renderMessage).join('') +
                '<div class="ia-suggestion-bar" id="iaSuggestionBar">' +
                '<span class="ia-suggestion-bar__label">IA</span>' +
                '<span class="ia-suggestion-bar__text" id="iaReplyText">' + escapeHtml(iaReply) + '</span>' +
                '<div class="ia-suggestion-bar__actions">' +
                '<button type="button" class="ia-suggestion-bar__btn" id="btnUseReply">Usar resposta</button>' +
                '<button type="button" class="ia-suggestion-bar__btn ia-suggestion-bar__btn--dismiss" id="btnDismissReply">Não usar</button>' +
                '</div></div>';
            conv.scrollTop = conv.scrollHeight;
        }

        var ta = document.getElementById('publicResponse-' + t.id);
        if (ta) ta.placeholder = 'Digite sua resposta ao cliente…';

        var thermo = client && client.termometro != null ? client.termometro : 38;
        var thermoLabel = client && client.termometroLabel ? client.termometroLabel : (thermo >= 55 ? 'Atenção' : 'Estável');
        var thermoColor = thermo >= 55 ? '#FCC200' : '#15A237';

        var score = $('#thermoScore');
        var fill = $('#thermoFill');
        var tLabel = $('#thermoLabel');
        if (score) { score.textContent = thermo; score.style.color = thermoColor; }
        if (fill) { fill.style.width = thermo + '%'; fill.style.background = thermoColor; }
        if (tLabel) { tLabel.textContent = thermoLabel; tLabel.style.color = thermoColor; }

        var lf = t.lateralForm || {};
        var selResponsavel = $('#selResponsavel');
        var selCanal = $('#selCanal');
        var selTipo = $('#selTipo');
        var selProduto = $('#selProduto');
        var selMotivo = $('#selMotivo');
        if (selResponsavel) {
            selResponsavel.value = lf.responsavel || t.responsibleAgent || t.assignedTo || getAgentName();
        }
        if (selCanal) setSelectValue(selCanal, lf.canal || t.channel || 'WhatsApp');
        if (selTipo) setSelectValue(selTipo, lf.classificacaoTipo || 'Solicitação');
        if (selProduto) setSelectValue(selProduto, lf.produto || 'Internet Fibra');
        if (selMotivo) setSelectValue(selMotivo, lf.motivo || 'Lentidão');

        var iaText = $('#iaTabulationText');
        if (iaText) iaText.textContent = iaTab;

        restoreCascadeFromTicket(entry);
        restoreEscalonarFromTicket(entry);
        bindCascadeFlowEvents(entry);
        bindEscalonarEvents(entry);

        bindMainEvents(entry, iaReply);
        closeClientEditPopover();
        closeSendStatusMenu();
        removeFocusContextPanel();
    }

    function stripComposeAiReview() {
        var root = $('#velodeskDeskV2Root');
        if (!root) return;
        root.querySelectorAll('.octa-panel-box .ai-review-wrap').forEach(function (wrap) {
            var ta = wrap.querySelector('textarea');
            if (ta && wrap.parentNode) {
                wrap.parentNode.insertBefore(ta, wrap);
                wrap.remove();
                delete ta.dataset.aiReviewBound;
            }
        });
    }

    function syncComposeTabState(ticketId, tabType) {
        state.composeMode = tabType;
        if (typeof window.switchResponseTabInTab === 'function') {
            window.switchResponseTabInTab(ticketId, tabType);
        } else {
            var publicTab = document.querySelector('#velodeskDeskV2Root .response-tab[data-tab="public-' + ticketId + '"]');
            var internalTab = document.querySelector('#velodeskDeskV2Root .response-tab[data-tab="internal-' + ticketId + '"]');
            var publicContent = document.getElementById('public-' + ticketId);
            var internalContent = document.getElementById('internal-' + ticketId);
            if (tabType === 'public') {
                if (publicTab) publicTab.classList.add('active');
                if (internalTab) internalTab.classList.remove('active');
                if (publicContent) publicContent.classList.add('active');
                if (internalContent) internalContent.classList.remove('active');
            } else {
                if (internalTab) internalTab.classList.add('active');
                if (publicTab) publicTab.classList.remove('active');
                if (internalContent) internalContent.classList.add('active');
                if (publicContent) publicContent.classList.remove('active');
            }
        }
    }

    function populateClientProfile(ticket, client) {
        var fields = getClientContactFields(ticket, client);
        var cpfDisplay = formatCpf((ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || (client && client.cpf) || '') || '—';

        var profile = $('#ticketClientProfile');
        if (profile) profile.id = 'ticket-client-profile-' + ticket.id;

        var nameEl = $('#profileName');
        var emailEl = $('#profileEmail');
        var phoneEl = $('#profilePhone');
        var cpfEl = $('#profileCpf');
        var productsEl = $('#profileProducts');

        if (nameEl) nameEl.textContent = fields.name || '—';
        if (emailEl) emailEl.textContent = fields.email || '—';
        if (phoneEl) phoneEl.textContent = fields.phone || '—';
        if (cpfEl) cpfEl.textContent = cpfDisplay;
        if (productsEl) productsEl.innerHTML = buildVeloProductTagsHtml(ticket, client);

        var histBtn = $('#btnClientHistory');
        if (histBtn) histBtn.setAttribute('data-ticket-id', ticket.id);
    }

    function openClientEditPopover(entry) {
        var popover = $('#clientEditPopover');
        var btn = $('#btnEditClient');
        if (!popover || !entry) return;

        var t = entry.ticket;
        var client = lookupClient((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
        var fields = getClientContactFields(t, client);

        var nameIn = $('#editClientName');
        var cpfIn = $('#editClientCpf');
        var emailIn = $('#editClientEmail');
        var phoneIn = $('#editClientPhone');
        if (nameIn) nameIn.value = fields.name;
        if (cpfIn) cpfIn.value = fields.cpf;
        if (emailIn) emailIn.value = fields.email;
        if (phoneIn) phoneIn.value = fields.phone;

        popover.hidden = false;
        popover.setAttribute('aria-hidden', 'false');
        if (btn) {
            btn.setAttribute('aria-expanded', 'true');
            btn.classList.add('is-active');
        }
        state.clientEditOpen = true;

        if (nameIn) {
            setTimeout(function () { nameIn.focus(); nameIn.select(); }, 0);
        }
    }

    function closeClientEditPopover() {
        var popover = $('#clientEditPopover');
        var btn = $('#btnEditClient');
        if (popover) {
            popover.hidden = true;
            popover.setAttribute('aria-hidden', 'true');
        }
        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.classList.remove('is-active');
        }
        state.clientEditOpen = false;
    }

    function saveClientEdit(entry) {
        if (!entry) return;
        var t = entry.ticket;
        var nameIn = $('#editClientName');
        var cpfIn = $('#editClientCpf');
        var emailIn = $('#editClientEmail');
        var phoneIn = $('#editClientPhone');

        var name = nameIn ? nameIn.value.trim() : '';
        var cpfRaw = cpfIn ? cpfIn.value.trim() : '';
        var email = emailIn ? emailIn.value.trim() : '';
        var phone = phoneIn ? phoneIn.value.trim() : '';
        var cpfDigits = normalizeCpf(cpfRaw);
        var oldCpfDigits = normalizeCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);

        if (!name) {
            if (typeof window.showNotification === 'function') showNotification('Informe o nome do contato.', 'warning');
            if (nameIn) nameIn.focus();
            return;
        }

        t.clientName = name;
        t.solicitante = name;
        t.clientEmail = email;
        t.clientPhone = phone;
        t.clientCPF = formatCpf(cpfDigits) || cpfRaw;
        if (!t.lateralForm) t.lateralForm = {};
        t.lateralForm.cpf = cpfDigits;

        try {
            var db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
            var existing = oldCpfDigits ? db[oldCpfDigits] : null;
            if (oldCpfDigits && cpfDigits && oldCpfDigits !== cpfDigits && db[oldCpfDigits]) {
                delete db[oldCpfDigits];
            }
            var clientRecord = (cpfDigits && db[cpfDigits]) || existing || {};
            clientRecord.name = name;
            clientRecord.email = email;
            clientRecord.telefone = phone;
            if (cpfDigits) {
                clientRecord.cpf = formatCpf(cpfDigits);
                db[cpfDigits] = clientRecord;
            }
            localStorage.setItem('velodeskClientDB', JSON.stringify(db));
        } catch (e) { /* ignore */ }

        t.updatedAt = new Date().toISOString();
        saveKanbanColumns(getKanbanColumns());
        closeClientEditPopover();
        renderMainTicket(entry);
        renderTicketCards();
        if (typeof window.showNotification === 'function') showNotification('Contato atualizado.', 'success');
    }

    function bindClientEditEvents(entry) {
        var btnEdit = $('#btnEditClient');
        var btnClose = $('#btnCloseClientEdit');
        var btnSave = $('#btnSaveClientEdit');
        var popover = $('#clientEditPopover');

        if (btnEdit) {
            btnEdit.onclick = function (e) {
                e.stopPropagation();
                if (state.clientEditOpen) closeClientEditPopover();
                else openClientEditPopover(entry);
            };
        }
        if (btnClose) {
            btnClose.onclick = function (e) {
                e.stopPropagation();
                closeClientEditPopover();
            };
        }
        if (btnSave) {
            btnSave.onclick = function (e) {
                e.stopPropagation();
                saveClientEdit(entry);
            };
        }
        if (popover) {
            popover.onclick = function (e) { e.stopPropagation(); };
        }

        if (!state.clientEditDocBound) {
            state.clientEditDocBound = true;
            document.addEventListener('click', function (e) {
                if (!state.clientEditOpen) return;
                var root = $('#velodeskDeskV2Root');
                if (!root || !root.contains(e.target)) return;
                if (e.target.closest('#clientEditPopover') || e.target.closest('#btnEditClient')) return;
                closeClientEditPopover();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && state.clientEditOpen) closeClientEditPopover();
            });
        }
    }

    function bindMainEvents(entry, iaReply) {
        $$('#velodeskDeskV2Root .tab-btn[data-main-tab]').forEach(function (btn) {
            btn.onclick = function () {
                var tab = btn.getAttribute('data-main-tab');
                state.mainTab = tab;
                $$('#velodeskDeskV2Root .tab-btn[data-main-tab]').forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                $$('#velodeskDeskV2Root .tab-panel[data-panel]').forEach(function (p) {
                    p.classList.toggle('is-active', p.getAttribute('data-panel') === tab);
                });
            };
        });

        $$('#velodeskDeskV2Root .octa-nav-tab').forEach(function (tab) {
            tab.onclick = function () {
                var mode = tab.getAttribute('data-compose') || 'public';
                syncComposeTabState(entry.ticket.id, mode);
            };
        });
        syncComposeTabState(entry.ticket.id, state.composeMode || 'public');

        var btnUse = $('#btnUseReply');
        if (btnUse) {
            btnUse.onclick = function () {
                var ta = document.getElementById('publicResponse-' + entry.ticket.id);
                if (ta) { ta.value = iaReply; ta.focus(); }
            };
        }

        var btnDismiss = $('#btnDismissReply');
        if (btnDismiss) {
            btnDismiss.onclick = function () {
                var bar = $('#iaSuggestionBar');
                if (bar) bar.remove();
            };
        }

        var btnAi = $('#btnCrmAiAssistant');
        if (btnAi) {
            btnAi.onclick = function () {
                if (typeof window.openAIChatbot === 'function') window.openAIChatbot();
            };
        }

        bindSendStatusEvents(entry);
        setTimeout(stripComposeAiReview, 0);

        var btnApply = $('#btnApplyTabulation');
        if (btnApply) {
            btnApply.onclick = function () { applyTabulation(entry); };
        }

        var btnSave = $('#btnSaveTicket');
        if (btnSave) {
            btnSave.onclick = function () { saveTicketForm(entry, btnSave); };
        }

        var btnChat = $('#btnOpenChat');
        if (btnChat) {
            btnChat.onclick = function () {
                if (typeof navigateToPage === 'function') navigateToPage('chat');
            };
        }

        var btnHistory = $('#btnClientHistory');
        if (btnHistory) {
            btnHistory.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                var ticketId = entry.ticket.id;
                if (typeof window.openClientFromTicket === 'function') {
                    window.openClientFromTicket(ticketId);
                } else if (typeof window.showNotification === 'function') {
                    showNotification('Histórico de tickets indisponível.', 'warning');
                }
            };
        }

        bindClientEditEvents(entry);
    }

    function closeSendStatusMenu() {
        var menu = $('#crmStatusMenu');
        var trigger = $('#crmStatusDropdown');
        if (menu) menu.hidden = true;
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        state.sendStatusMenuOpen = false;
    }

    function openSendStatusMenu() {
        var menu = $('#crmStatusMenu');
        var trigger = $('#crmStatusDropdown');
        if (menu) menu.hidden = false;
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        state.sendStatusMenuOpen = true;
    }

    function bindSendStatusEvents(entry) {
        var trigger = $('#crmStatusDropdown');
        var menu = $('#crmStatusMenu');

        if (trigger) {
            trigger.onclick = function (e) {
                e.stopPropagation();
                if (state.sendStatusMenuOpen) closeSendStatusMenu();
                else openSendStatusMenu();
            };
        }

        if (menu) {
            $$('#velodeskDeskV2Root .crm-send-status__option').forEach(function (opt) {
                opt.onclick = function (e) {
                    e.stopPropagation();
                    var statusId = opt.getAttribute('data-send-status');
                    closeSendStatusMenu();
                    sendAgentMessage(entry, statusId);
                };
            });
        }

        if (!state.sendStatusDocBound) {
            state.sendStatusDocBound = true;
            document.addEventListener('click', function (e) {
                if (!state.sendStatusMenuOpen) return;
                if (e.target.closest('#crmSendStatus')) return;
                closeSendStatusMenu();
            });
        }
    }

    function moveTicketToBox(entry, targetBoxId) {
        if (!entry || !targetBoxId) return;
        var columns = getKanbanColumns();
        var ticket = entry.ticket;
        var ticketId = String(ticket.id);

        columns.forEach(function (box) {
            if (!box.tickets) return;
            box.tickets = box.tickets.filter(function (t) { return String(t.id) !== ticketId; });
        });

        var target = columns.find(function (b) { return b.id === targetBoxId; });
        if (!target) return;
        if (!target.tickets) target.tickets = [];
        target.tickets.push(ticket);
        saveKanbanColumns(columns);
        entry.boxId = targetBoxId;
        entry.queueId = mapTicketQueueId(ticket, targetBoxId);
    }

    function applySendStatus(entry, queueId) {
        var statusMap = {
            'em-andamento': { box: 'em-andamento', status: 'em-aberto' },
            'pendente': { box: 'em-espera', status: 'pendente' },
            'resolvidos': { box: 'resolvidos', status: 'resolvido' }
        };
        var cfg = statusMap[queueId] || statusMap['em-andamento'];
        entry.ticket.status = cfg.status;
        moveTicketToBox(entry, cfg.box);
    }

    function sendAgentMessage(entry, sendStatus) {
        if (state.composeMode !== 'public') return;
        var ta = document.getElementById('publicResponse-' + entry.ticket.id);
        var text = ta && ta.value.trim();
        if (!text || !entry) return;

        if (!entry.ticket.messages) entry.ticket.messages = [];
        var now = new Date().toISOString();
        entry.ticket.messages.push({
            type: 'agent',
            fromClient: false,
            text: text,
            timestamp: now,
            author: 'Ana Silva'
        });
        entry.ticket.updatedAt = now;

        applySendStatus(entry, sendStatus || 'em-andamento');
        saveKanbanColumns(getKanbanColumns());
        if (ta) ta.value = '';
        renderQueueList();
        renderTicketCards();
        renderMainTicket(entry);
        if (typeof window.showNotification === 'function') showNotification('Resposta enviada.', 'success');
    }

    function setSelectValue(sel, value) {
        if (!sel || !value) return;
        var found = Array.prototype.slice.call(sel.options).some(function (o) {
            if (o.value === value || o.text === value) {
                sel.value = o.value;
                return true;
            }
            return false;
        });
        if (!found) {
            var opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            sel.appendChild(opt);
            sel.value = value;
        }
    }

    function applyTabulation(entry) {
        if (!entry) return;
        var t = entry.ticket;
        if (!t.lateralForm) t.lateralForm = {};
        var selResponsavel = $('#selResponsavel');
        var selCanal = $('#selCanal');
        var selTipo = $('#selTipo');
        var selProduto = $('#selProduto');
        var selMotivo = $('#selMotivo');
        if (selResponsavel) t.lateralForm.responsavel = selResponsavel.value;
        if (selResponsavel) {
            t.responsibleAgent = selResponsavel.value;
            t.assignedTo = selResponsavel.value;
        }
        if (selCanal) t.lateralForm.canal = selCanal.value;
        if (selTipo) t.lateralForm.classificacaoTipo = selTipo.value;
        if (selProduto) t.lateralForm.produto = selProduto.value;
        if (selMotivo) t.lateralForm.motivo = selMotivo.value;
        t.lateralForm.automacaoCategoria = state.cascadeCategory || '';
        t.lateralForm.automacaoAcao = state.cascadeAction || '';
        t.lateralForm.escalonar = state.escalonar || '';
        saveKanbanColumns(getKanbanColumns());
        var btn = $('#btnApplyTabulation');
        if (btn) {
            var orig = btn.textContent;
            btn.textContent = 'Tabulação aplicada ✓';
            setTimeout(function () { btn.textContent = orig; }, 1800);
        }
    }

    function saveTicketForm(entry, btn) {
        if (!entry) return;
        applyTabulation(entry);
        if (btn) {
            btn.classList.add('is-saved');
            btn.innerHTML = '<i class="ti ti-check"></i> Salvo!';
            setTimeout(function () {
                btn.classList.remove('is-saved');
                btn.innerHTML = '<i class="ti ti-device-floppy"></i> Salvar no ticket';
            }, 2000);
        }
        if (typeof showNotification === 'function') showNotification('Ticket salvo.', 'success');
    }

    function selectTicket(ticketId) {
        if (state.createTicketOpen) closeCreateTicketPanel();
        var entry = findTicketEntry(ticketId);
        if (!entry) return;
        state.activeTicketId = ticketId;
        state.activeQueue = entry.queueId;
        renderQueueList();
        renderTicketCards();
        renderMainTicket(entry);
    }

    function selectQueue(queueId) {
        if (state.createTicketOpen) closeCreateTicketPanel();
        state.activeQueue = queueId;
        var entries = getFilteredTickets();
        if (!entries.find(function (e) { return String(e.ticket.id) === String(state.activeTicketId); })) {
            state.activeTicketId = entries.length ? entries[0].ticket.id : null;
        }
        renderQueueList();
        renderTicketCards();
        if (state.activeTicketId) {
            renderMainTicket(findTicketEntry(state.activeTicketId));
        } else {
            var main = $('#crmMainContent');
            var right = $('#crmRightPanel');
            if (main) main.innerHTML = '<div class="crm-empty-state">Selecione um ticket na lista ao lado</div>';
            if (right) right.style.display = 'none';
        }
    }

    function bindShellEvents() {
        var queueList = $('#queueStatusList');
        if (queueList) {
            queueList.onclick = function (e) {
                var item = e.target.closest('.queue-status-item');
                if (item) selectQueue(item.getAttribute('data-queue'));
            };
        }

        var cards = $('#ticketCards');
        if (cards) {
            cards.onclick = function (e) {
                var card = e.target.closest('.crm-ticket-card');
                if (card) selectTicket(card.getAttribute('data-ticket-id'));
            };
        }

        $$('#velodeskDeskV2Root .sort-chip').forEach(function (chip) {
            chip.onclick = function () {
                $$('#velodeskDeskV2Root .sort-chip').forEach(function (c) { c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                state.activeSort = chip.getAttribute('data-sort');
                renderTicketCards();
            };
        });

        var search = $('#crmQueueSearch');
        if (search) {
            search.oninput = function () {
                state.searchQuery = search.value;
                renderTicketCards();
            };
        }

        var refresh = $('#btnRefresh');
        if (refresh) {
            refresh.onclick = function () {
                renderQueueList();
                renderTicketCards();
                if (state.activeTicketId) renderMainTicket(findTicketEntry(state.activeTicketId));
            };
        }

        var newTicket = $('#crmNewTicket');
        if (newTicket) {
            newTicket.onclick = function () {
                openCreateTicketPanel();
            };
        }

        var newBox = $('#crmNewBox');
        if (newBox) {
            newBox.onclick = function () {
                if (typeof navigateToPage === 'function') navigateToPage('tickets');
            };
        }

        bindPanelCollapseEvents();
        applyPanelCollapseState();

        if (typeof syncMainSidebarNav === 'function') {
            syncMainSidebarNav('tickets');
        }
    }

    function setQueuePanelCollapsed(collapsed) {
        state.queuePanelCollapsed = collapsed;
        var panel = $('#crmQueuePanel');
        var btn = $('#btnCollapseQueue');
        if (panel) panel.classList.toggle('is-collapsed', collapsed);
        if (btn) {
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            btn.title = collapsed ? 'Expandir fila' : 'Recolher fila';
        }
        localStorage.setItem('velodeskCrmQueueCollapsed', collapsed ? '1' : '0');
    }

    function setTicketListCollapsed(collapsed) {
        state.ticketListCollapsed = collapsed;
        var panel = $('#crmTicketListPanel');
        var btn = $('#btnCollapseTickets');
        if (panel) panel.classList.toggle('is-collapsed', collapsed);
        if (btn) {
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            btn.title = collapsed ? 'Expandir lista' : 'Recolher lista';
        }
        localStorage.setItem('velodeskCrmTicketListCollapsed', collapsed ? '1' : '0');
    }

    function applyPanelCollapseState() {
        var q = localStorage.getItem('velodeskCrmQueueCollapsed') === '1';
        var t = localStorage.getItem('velodeskCrmTicketListCollapsed') === '1';
        setQueuePanelCollapsed(q);
        setTicketListCollapsed(t);
    }

    function bindPanelCollapseEvents() {
        var btnQueue = $('#btnCollapseQueue');
        var btnExpandQueue = $('#btnExpandQueue');
        var btnTickets = $('#btnCollapseTickets');
        var btnExpandTickets = $('#btnExpandTickets');

        if (btnQueue) {
            btnQueue.onclick = function (e) {
                e.stopPropagation();
                setQueuePanelCollapsed(true);
            };
        }
        if (btnExpandQueue) {
            btnExpandQueue.onclick = function () { setQueuePanelCollapsed(false); };
        }
        if (btnTickets) {
            btnTickets.onclick = function (e) {
                e.stopPropagation();
                setTicketListCollapsed(true);
            };
        }
        if (btnExpandTickets) {
            btnExpandTickets.onclick = function () { setTicketListCollapsed(false); };
        }
    }

    function pickDefaultTicket() {
        var preferred = getAllCockpitTickets().find(function (e) {
            return e.queueId === 'em-andamento' && (e.ticket.clientName || '').indexOf('João Pereira') >= 0;
        }) || getAllCockpitTickets().find(function (e) {
            return e.queueId === 'em-andamento' && (e.ticket.clientName || '').indexOf('Maria') >= 0;
        });
        if (preferred) return preferred.ticket.id;
        var inQueue = getAllCockpitTickets().filter(function (e) { return e.queueId === state.activeQueue; });
        if (inQueue.length) return inQueue[0].ticket.id;
        var any = getAllCockpitTickets();
        return any.length ? any[0].ticket.id : null;
    }

    function removeFocusContextPanel() {
        var panel = document.getElementById('cockpitFocusContext');
        if (panel) panel.remove();
    }

    function patchEcosystemForDeskV2() {
        if (window.__velodeskDeskV2EcosystemPatched) return;
        window.__velodeskDeskV2EcosystemPatched = true;

        var origOpenFromModal = window.openClientTicketFromModal;
        window.openClientTicketFromModal = function (ticketId) {
            if (typeof window.closeEcosystemModal === 'function') {
                window.closeEcosystemModal();
            }
            if (isDeskV2Mode() && document.getElementById('velodeskDeskV2Root')) {
                var entry = findTicketEntry(ticketId);
                if (entry) {
                    selectTicket(ticketId);
                    return;
                }
            }
            if (typeof origOpenFromModal === 'function') {
                origOpenFromModal(ticketId);
            }
        };
    }

    function hideDeskV2ForLegacyNav() {
        document.body.classList.remove('desk-v2-mode');
        var root = document.getElementById('velodeskDeskV2Root');
        if (root) root.style.display = 'none';
    }

    function restoreDeskV2() {
        if (!isDeskV2Mode()) return false;

        removeFocusContextPanel();
        document.body.classList.add('desk-v2-mode');
        document.title = 'Velodesk CRM — Cockpit';

        var root = document.getElementById('velodeskDeskV2Root');
        if (!root || !root.querySelector('#crmQueuePanel')) {
            mountDeskV2();
            return true;
        }

        root.style.display = '';
        renderQueueList();
        renderTicketCards();

        if (typeof syncMainSidebarNav === 'function') {
            syncMainSidebarNav('tickets');
        }

        if (state.activeTicketId && findTicketEntry(state.activeTicketId)) {
            renderMainTicket(findTicketEntry(state.activeTicketId));
        } else {
            state.activeTicketId = pickDefaultTicket();
            if (state.activeTicketId) {
                renderMainTicket(findTicketEntry(state.activeTicketId));
            }
        }

        return true;
    }

    function mountDeskV2() {
        removeFocusContextPanel();
        document.body.classList.add('desk-v2-mode');
        document.title = 'Velodesk CRM — Cockpit';

        var root = $('#velodeskDeskV2Root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'velodeskDeskV2Root';
            document.body.appendChild(root);
        }
        root.style.display = '';
        root.innerHTML = getShellHtml();

        ensureDeskV2PrototypeTickets();
        migrateAllTicketsForDeskV2();

        state.activeQueue = 'em-andamento';
        state.activeTicketId = pickDefaultTicket();

        renderQueueList();
        renderTicketCards();
        bindShellEvents();
        patchEcosystemForDeskV2();
        bindCascadeFlowEvents(null);
        updateCascadeFlowUI();

        if (state.activeTicketId) {
            renderMainTicket(findTicketEntry(state.activeTicketId));
        }
    }

    function boot() {
        if (!isDeskV2Mode()) return;
        if (typeof window.initVelodeskEcosystem === 'function') {
            try { window.initVelodeskEcosystem(); } catch (e) { /* noop */ }
        } else if (typeof window.seedDemoTickets === 'function') {
            window.seedDemoTickets({ force: false, replaceAll: false });
        }
        mountDeskV2();
    }

    window.VelodeskDeskV2 = {
        mount: mountDeskV2,
        restore: restoreDeskV2,
        hideForLegacyNav: hideDeskV2ForLegacyNav,
        isActive: isDeskV2Mode
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 120); });
    } else {
        setTimeout(boot, 120);
    }
})();
