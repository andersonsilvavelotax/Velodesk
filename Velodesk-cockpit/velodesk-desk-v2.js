/**
 * Velodesk Desk V2 — CRM 5 colunas integrado ao Cockpit (?desk=v2)
 */
(function () {
    'use strict';

    var QUEUE_STATUSES = [
        { id: 'novos', name: 'Novos', dot: '#1634FF', boxes: ['novos'] },
        { id: 'em-andamento', name: 'Em andamento', dot: '#1694FF', boxes: ['em-andamento', 'em-aberto'] },
        { id: 'pendente', name: 'Pendente', dot: '#FCC200', boxes: ['em-espera'] },
        { id: 'aguard-retorno', name: 'Aguard. retorno', dot: 'rgba(252,194,0,0.55)', boxes: ['pendentes'] },
        { id: 'resolvidos', name: 'Resolvidos', dot: '#15A237', boxes: ['resolvidos'] }
    ];

    var state = {
        activeQueue: 'em-andamento',
        activeTicketId: null,
        activeSort: 'data',
        composeMode: 'public',
        searchQuery: ''
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
        if (boxId === 'em-espera') return 'pendente';
        if (boxId === 'pendentes' || ticket.status === 'pendente') return 'aguard-retorno';
        if (boxId === 'resolvidos' || ticket.status === 'resolvido') return 'resolvidos';
        return 'em-andamento';
    }

    function statusMeta(ticket, queueId) {
        var map = {
            'em-andamento': { label: 'Em andamento', cls: 'andamento' },
            'novos': { label: 'Novo', cls: 'novo' },
            'pendente': { label: 'Pendente', cls: 'pendente' },
            'aguard-retorno': { label: 'Aguard. retorno', cls: 'aguardando' },
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
                clientCPF: '987.654.321-00',
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
                lateralForm: { canal: 'Telefone', classificacaoTipo: 'Solicitação', produto: 'TV', motivo: 'Cancelamento', cpf: '98765432100' }
            },
            {
                id: now + 902,
                title: 'Segunda via de fatura',
                description: 'Cliente precisa da segunda via da fatura.',
                status: 'novo',
                clientName: 'João Ferreira',
                solicitante: 'João Ferreira',
                clientCPF: '456.789.123-45',
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
                lateralForm: { canal: 'E-mail', classificacaoTipo: 'Solicitação', produto: 'Internet Fibra', motivo: 'Sem conexão', cpf: '45678912345' }
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

    function getShellHtml() {
        return '<div class="app-shell">' +
            '<aside class="crm-sidebar" aria-label="Navegação">' +
            '<div class="crm-sidebar__logo" title="Velodesk">V</div>' +
            '<nav class="crm-sidebar__nav">' +
            '<button type="button" class="crm-nav-icon is-active" title="Tickets"><i class="ti ti-ticket"></i></button>' +
            '<button type="button" class="crm-nav-icon" title="Mensagens"><i class="ti ti-message-2"></i><span class="crm-nav-icon__badge"></span></button>' +
            '<button type="button" class="crm-nav-icon" title="Dashboard" data-nav="dashboard"><i class="ti ti-layout-dashboard"></i></button>' +
            '<button type="button" class="crm-nav-icon" title="Relatórios"><i class="ti ti-chart-bar"></i></button>' +
            '<button type="button" class="crm-nav-icon" title="Configurações" data-nav="settings"><i class="ti ti-settings"></i></button>' +
            '<button type="button" class="crm-nav-icon" title="IA"><i class="ti ti-robot"></i></button>' +
            '</nav><div class="crm-sidebar__avatar" title="Ana Silva">AS</div></aside>' +

            '<aside class="queue-panel">' +
            '<div class="queue-panel__header"><h2 class="queue-panel__title">Fila de atendimento</h2>' +
            '<label class="queue-search"><i class="ti ti-search"></i>' +
            '<input type="search" id="crmQueueSearch" placeholder="Buscar tickets…"></label></div>' +
            '<ul class="queue-status-list" id="queueStatusList"></ul>' +
            '<div class="queue-panel__footer">' +
            '<button type="button" class="queue-btn queue-btn--secondary" id="crmNewBox"><i class="ti ti-plus"></i> Nova caixa</button>' +
            '<button type="button" class="queue-btn queue-btn--primary" id="crmNewTicket"><i class="ti ti-plus"></i> Criar ticket</button>' +
            '</div></aside>' +

            '<aside class="ticket-list-panel">' +
            '<div class="ticket-list-header">' +
            '<div class="ticket-list-header__row">' +
            '<h2 class="ticket-list-header__title" id="ticketListTitle">Em andamento · 0</h2>' +
            '<div class="ticket-list-header__actions">' +
            '<button type="button" class="crm-icon-btn" title="Filtrar"><i class="ti ti-filter"></i></button>' +
            '<button type="button" class="crm-icon-btn" id="btnRefresh" title="Atualizar"><i class="ti ti-refresh"></i></button>' +
            '</div></div>' +
            '<div class="sort-chips">' +
            '<button type="button" class="sort-chip is-active" data-sort="data">Data</button>' +
            '<button type="button" class="sort-chip" data-sort="prioridade">Prioridade</button>' +
            '<button type="button" class="sort-chip" data-sort="sla">SLA</button>' +
            '</div></div>' +
            '<ul class="ticket-cards" id="ticketCards"></ul></aside>' +

            '<main class="crm-main-content" id="crmMainContent">' +
            '<div class="crm-empty-state" id="crmEmptyMain">Selecione um ticket na lista ao lado</div>' +
            '</main>' +

            '<aside class="crm-right-panel" id="crmRightPanel" style="display:none">' +
            '<div class="crm-right-panel__scroll">' +
            '<section class="rp-section"><div class="rp-section__label">Termômetro do cliente</div>' +
            '<div class="thermo-score" id="thermoScore">38</div>' +
            '<div class="thermo-bar"><div class="thermo-fill" id="thermoFill" style="width:38%"></div></div>' +
            '<div class="thermo-label" id="thermoLabel">Estável</div></section>' +
            '<section class="rp-section"><div class="rp-section__label">Contato</div>' +
            '<div class="contact-line"><i class="ti ti-mail"></i><span id="contactEmail">—</span></div>' +
            '<div class="contact-line"><i class="ti ti-phone"></i><span id="contactPhone">—</span></div>' +
            '<div class="contact-line"><i class="ti ti-id-badge"></i><span id="contactCpf">—</span></div></section>' +
            '<section class="rp-section"><div class="rp-section__label">Classificação</div>' +
            '<div class="rp-field"><label for="selCanal">Canal</label><select id="selCanal">' +
            '<option>WhatsApp</option><option>Telefone</option><option>E-mail</option><option>Portal</option></select></div>' +
            '<div class="rp-field"><label for="selTipo">Tipo</label><select id="selTipo">' +
            '<option>Reclamação</option><option>Solicitação</option><option>Dúvida</option><option>Informação</option></select></div>' +
            '<div class="rp-field"><label for="selProduto">Produto</label><select id="selProduto">' +
            '<option>Internet Fibra</option><option>TV</option><option>Telefone</option><option>Combo</option></select></div>' +
            '<div class="rp-field"><label for="selMotivo">Motivo</label><select id="selMotivo">' +
            '<option>Lentidão</option><option>Queda de sinal</option><option>Sem conexão</option><option>Cancelamento</option><option>Cobrança</option><option>Financeiro</option></select></div></section>' +
            '<section class="rp-section"><div class="ia-tabulation">' +
            '<div class="ia-tabulation__label">SUGESTÃO IA</div>' +
            '<div class="ia-tabulation__text" id="iaTabulationText"></div>' +
            '<button type="button" class="ia-tabulation__btn" id="btnApplyTabulation">Aplicar tabulação</button>' +
            '</div></section></div>' +
            '<div class="crm-right-panel__footer">' +
            '<button type="button" class="rp-footer-btn rp-footer-btn--secondary" id="btnOpenChat"><i class="ti ti-message-circle"></i> Abrir conversa</button>' +
            '<button type="button" class="rp-footer-btn rp-footer-btn--primary" id="btnSaveTicket"><i class="ti ti-device-floppy"></i> Salvar no ticket</button>' +
            '</div></aside></div>';
    }

    function getMainTicketHtml() {
        return '<header class="crm-ticket-header">' +
            '<div class="crm-ticket-header__avatar" id="headerAvatar"></div>' +
            '<div class="crm-ticket-header__info">' +
            '<div class="crm-ticket-header__name" id="headerName"></div>' +
            '<div class="crm-ticket-header__sub" id="headerSub"></div></div>' +
            '<div class="crm-ticket-header__products" id="headerProducts"></div>' +
            '<div class="crm-ticket-header__actions">' +
            '<button type="button" class="crm-icon-btn" title="Histórico"><i class="ti ti-history"></i></button>' +
            '<button type="button" class="crm-icon-btn" title="Mais"><i class="ti ti-dots"></i></button>' +
            '</div></header>' +
            '<nav class="tabs-top">' +
            '<button type="button" class="tab-btn is-active" data-main-tab="conversa"><i class="ti ti-message-2"></i> Conversa</button>' +
            '<button type="button" class="tab-btn" data-main-tab="notas"><i class="ti ti-file-text"></i> Notas</button>' +
            '<button type="button" class="tab-btn" data-main-tab="historico"><i class="ti ti-history"></i> Histórico</button>' +
            '</nav>' +
            '<div class="tab-panel is-active" data-panel="conversa">' +
            '<div class="conversation" id="conversation"></div>' +
            '<div class="compose-area">' +
            '<div class="compose-tabs">' +
            '<button type="button" class="compose-tab is-active" data-compose="public">Resposta pública</button>' +
            '<button type="button" class="compose-tab" data-compose="internal">Anotação interna</button></div>' +
            '<div class="compose-box" id="composeBox" data-mode="public">' +
            '<textarea class="compose-textarea compose-textarea--public" id="composePublic" placeholder="Escreva sua resposta…"></textarea>' +
            '<textarea class="compose-textarea compose-textarea--internal" id="composeInternal" placeholder="Anotação interna…"></textarea></div>' +
            '<div class="compose-footer">' +
            '<div class="compose-tools">' +
            '<button type="button" class="tool-btn"><i class="ti ti-paperclip"></i></button>' +
            '<button type="button" class="tool-btn"><i class="ti ti-template"></i></button>' +
            '<button type="button" class="tool-btn"><i class="ti ti-robot"></i></button></div>' +
            '<div class="compose-actions">' +
            '<button type="button" class="status-dropdown" id="crmStatusDropdown">Enviar como: Em andamento <i class="ti ti-chevron-down"></i></button>' +
            '<button type="button" class="btn-send" id="btnSend">Enviar</button>' +
            '</div></div></div></div>' +
            '<div class="tab-panel tab-panel--placeholder" data-panel="notas"><p>Nenhuma nota interna registrada.</p></div>' +
            '<div class="tab-panel tab-panel--placeholder" data-panel="historico"><p>Histórico completo do cliente.</p></div>';
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
            list.innerHTML = '<li class="crm-empty-state" style="padding:16px;font-size:12px;">Nenhum ticket nesta fila</li>';
            return;
        }

        list.innerHTML = entries.map(function (entry) {
            var t = entry.ticket;
            var meta = statusMeta(t, entry.queueId);
            var active = String(t.id) === String(state.activeTicketId) ? ' is-active' : '';
            var channel = (t.lateralForm && t.lateralForm.canal) || t.channel || t.source || '—';
            var tags = buildTags(t).map(function (tag) {
                return '<span class="crm-tag">' + escapeHtml(tag) + '</span>';
            }).join('');
            return '<li class="crm-ticket-card' + active + '" data-ticket-id="' + t.id + '">' +
                '<div class="crm-ticket-card__top">' +
                '<span class="crm-ticket-card__name">' + escapeHtml(t.clientName || t.solicitante || 'Cliente') + '</span>' +
                '<span class="status-badge status-badge--' + meta.cls + '">' + escapeHtml(meta.label) + '</span></div>' +
                '<div class="crm-ticket-card__subject">' + escapeHtml(t.title || t.description || '') + '</div>' +
                '<div class="crm-ticket-card__meta">' +
                '<span class="crm-ticket-card__channel"><i class="ti ' + channelIcon(channel) + '"></i> ' + escapeHtml(channel) + '</span>' +
                '<span>' + escapeHtml(formatTicketDate(t.updatedAt || t.createdAt)) + '</span></div>' +
                '<div class="crm-ticket-card__tags">' + tags + '</div></li>';
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
        var client = lookupClient((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
        var name = t.clientName || t.solicitante || 'Cliente';
        var cpf = (t.lateralForm && t.lateralForm.cpf) ? t.clientCPF : (t.clientCPF || (client && client.cpf) || '—');
        var iaReply = buildIaReply(t);
        var iaTab = buildIaTabulation(t);
        var convMsgs = buildConversationMessages(t);

        var main = $('#crmMainContent');
        var right = $('#crmRightPanel');
        if (main) main.innerHTML = getMainTicketHtml();
        if (right) right.style.display = '';

        var avatar = $('#headerAvatar');
        var headerName = $('#headerName');
        var sub = $('#headerSub');
        var products = $('#headerProducts');
        if (avatar) avatar.textContent = getInitials(name);
        if (headerName) headerName.textContent = name;
        if (sub) sub.textContent = 'CPF ' + cpf + ' · #' + t.id;

        if (products) {
            products.innerHTML = buildProducts(t, client).map(function (p) {
                return '<span class="product-pill product-pill--' + p.cls + '"><i class="ti ' + p.icon + '"></i> ' + escapeHtml(p.label) + '</span>';
            }).join('');
        }

        var conv = $('#conversation');
        if (conv) {
            conv.innerHTML = convMsgs.map(renderMessage).join('') +
                '<div class="ia-suggestion-bar"><span class="ia-suggestion-bar__label">IA</span>' +
                '<span class="ia-suggestion-bar__text" id="iaReplyText">' + escapeHtml(iaReply) + '</span>' +
                '<button type="button" class="ia-suggestion-bar__btn" id="btnUseReply">Usar resposta</button></div>';
            conv.scrollTop = conv.scrollHeight;
        }

        var ta = $('#composePublic');
        if (ta) ta.placeholder = 'Escreva sua resposta para ' + name + '…';

        var thermo = client && client.termometro != null ? client.termometro : 38;
        var thermoLabel = client && client.termometroLabel ? client.termometroLabel : (thermo >= 55 ? 'Atenção' : 'Estável');
        var thermoColor = thermo >= 55 ? '#FCC200' : '#15A237';

        var score = $('#thermoScore');
        var fill = $('#thermoFill');
        var tLabel = $('#thermoLabel');
        if (score) { score.textContent = thermo; score.style.color = thermoColor; }
        if (fill) { fill.style.width = thermo + '%'; fill.style.background = thermoColor; }
        if (tLabel) { tLabel.textContent = thermoLabel; tLabel.style.color = thermoColor; }

        var email = $('#contactEmail');
        var phone = $('#contactPhone');
        var cpfEl = $('#contactCpf');
        if (email) email.textContent = (client && client.email) || '—';
        if (phone) phone.textContent = (client && client.telefone) || '—';
        if (cpfEl) cpfEl.textContent = 'CPF ' + (client && client.cpf ? client.cpf : cpf);

        var lf = t.lateralForm || {};
        var selCanal = $('#selCanal');
        var selTipo = $('#selTipo');
        var selProduto = $('#selProduto');
        var selMotivo = $('#selMotivo');
        if (selCanal) setSelectValue(selCanal, lf.canal || t.channel || 'WhatsApp');
        if (selTipo) setSelectValue(selTipo, lf.classificacaoTipo || 'Solicitação');
        if (selProduto) setSelectValue(selProduto, lf.produto || 'Internet Fibra');
        if (selMotivo) setSelectValue(selMotivo, lf.motivo || 'Lentidão');

        var iaText = $('#iaTabulationText');
        if (iaText) iaText.textContent = iaTab;

        bindMainEvents(entry, iaReply);
    }

    function bindMainEvents(entry, iaReply) {
        $$('#velodeskDeskV2Root .tab-btn[data-main-tab]').forEach(function (btn) {
            btn.onclick = function () {
                var tab = btn.getAttribute('data-main-tab');
                $$('#velodeskDeskV2Root .tab-btn[data-main-tab]').forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                $$('#velodeskDeskV2Root .tab-panel[data-panel]').forEach(function (p) {
                    p.classList.toggle('is-active', p.getAttribute('data-panel') === tab);
                });
            };
        });

        $$('#velodeskDeskV2Root .compose-tab').forEach(function (tab) {
            tab.onclick = function () {
                state.composeMode = tab.getAttribute('data-compose');
                $$('#velodeskDeskV2Root .compose-tab').forEach(function (t) { t.classList.remove('is-active'); });
                tab.classList.add('is-active');
                var box = $('#composeBox');
                if (box) box.setAttribute('data-mode', state.composeMode);
            };
        });

        var composePublic = $('#composePublic');
        var composeBox = $('#composeBox');
        if (composePublic && composeBox) {
            composePublic.onfocus = function () { composeBox.classList.add('is-focused'); };
            composePublic.onblur = function () { composeBox.classList.remove('is-focused'); };
        }

        var btnUse = $('#btnUseReply');
        if (btnUse) {
            btnUse.onclick = function () {
                var ta = $('#composePublic');
                if (ta) { ta.value = iaReply; ta.focus(); if (composeBox) composeBox.classList.add('is-focused'); }
            };
        }

        var btnSend = $('#btnSend');
        if (btnSend) {
            btnSend.onclick = function () { sendAgentMessage(entry); };
        }

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
    }

    function sendAgentMessage(entry) {
        if (state.composeMode !== 'public') return;
        var ta = $('#composePublic');
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

        var columns = getKanbanColumns();
        saveKanbanColumns(columns);
        if (ta) ta.value = '';
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
        var selCanal = $('#selCanal');
        var selTipo = $('#selTipo');
        var selProduto = $('#selProduto');
        var selMotivo = $('#selMotivo');
        if (selCanal) t.lateralForm.canal = selCanal.value;
        if (selTipo) t.lateralForm.classificacaoTipo = selTipo.value;
        if (selProduto) t.lateralForm.produto = selProduto.value;
        if (selMotivo) t.lateralForm.motivo = selMotivo.value;
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
        var entry = findTicketEntry(ticketId);
        if (!entry) return;
        state.activeTicketId = ticketId;
        state.activeQueue = entry.queueId;
        renderQueueList();
        renderTicketCards();
        renderMainTicket(entry);
    }

    function selectQueue(queueId) {
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
                if (typeof navigateToPage === 'function') navigateToPage('tickets');
                if (typeof showNotification === 'function') showNotification('Use a página Tickets para criar novos chamados.', 'info');
            };
        }

        var newBox = $('#crmNewBox');
        if (newBox) {
            newBox.onclick = function () {
                if (typeof navigateToPage === 'function') navigateToPage('tickets');
            };
        }

        var navDash = $('[data-nav="dashboard"]');
        if (navDash) {
            navDash.onclick = function () {
                document.body.classList.remove('desk-v2-mode');
                var root = $('#velodeskDeskV2Root');
                if (root) root.style.display = 'none';
                if (typeof navigateToPage === 'function') navigateToPage('dashboard');
            };
        }
    }

    function pickDefaultTicket() {
        var preferred = getAllCockpitTickets().find(function (e) {
            return e.queueId === 'em-andamento' && (e.ticket.clientName || '').indexOf('Maria') >= 0;
        });
        if (preferred) return preferred.ticket.id;
        var inQueue = getAllCockpitTickets().filter(function (e) { return e.queueId === state.activeQueue; });
        if (inQueue.length) return inQueue[0].ticket.id;
        var any = getAllCockpitTickets();
        return any.length ? any[0].ticket.id : null;
    }

    function mountDeskV2() {
        document.body.classList.add('desk-v2-mode');
        document.title = 'Velodesk CRM — Cockpit';

        var root = $('#velodeskDeskV2Root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'velodeskDeskV2Root';
            document.body.appendChild(root);
        }
        root.innerHTML = getShellHtml();

        ensureDeskV2PrototypeTickets();

        state.activeQueue = 'em-andamento';
        state.activeTicketId = pickDefaultTicket();

        renderQueueList();
        renderTicketCards();
        bindShellEvents();

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

    window.VelodeskDeskV2 = { mount: mountDeskV2, isActive: isDeskV2Mode };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 120); });
    } else {
        setTimeout(boot, 120);
    }
})();
