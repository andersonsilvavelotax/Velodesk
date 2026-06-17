/**
 * Velodesk CRM — dados e interações
 */
(function () {
    'use strict';

    var QUEUE_STATUSES = [
        { id: 'novos', name: 'Novos', dot: '#1634FF' },
        { id: 'em-andamento', name: 'Em andamento', dot: '#1694FF' },
        { id: 'pendente', name: 'Pendente', dot: '#FCC200' },
        { id: 'aguard-retorno', name: 'Aguard. retorno', dot: 'rgba(252,194,0,0.55)' },
        { id: 'resolvidos', name: 'Resolvidos', dot: '#15A237' }
    ];

    var TICKETS = [
        {
            id: '1781698895651',
            queueId: 'em-andamento',
            name: 'Maria Oliveira',
            initials: 'MO',
            cpf: '123.456.789-01',
            statusKey: 'em-andamento',
            statusLabel: 'Em andamento',
            statusClass: 'andamento',
            subject: 'Internet lenta após 22h',
            channel: 'WhatsApp',
            channelIcon: 'ti-brand-whatsapp',
            date: '16/06 · 09:21',
            tags: ['Fibra', 'Lentidão'],
            products: [
                { label: 'Internet Fibra', icon: 'ti-wifi', cls: 'fibra' },
                { label: 'TV', icon: 'ti-tv', cls: 'tv' }
            ],
            thermo: 38,
            thermoLabel: 'Estável',
            contact: {
                email: 'maria.oliveira@email.com',
                phone: '(11) 98765-4321',
                cpf: '123.456.789-01'
            },
            classification: {
                canal: 'WhatsApp',
                tipo: 'Reclamação',
                produto: 'Internet Fibra',
                motivo: 'Lentidão'
            },
            iaReply: 'Olá Maria! Entendo sua preocupação com a lentidão após 22h. Vou verificar o sinal da sua região e orientar sobre otimização do roteador. Pode me informar se o problema ocorre via Wi-Fi ou cabo?',
            iaTabulation: 'Reclamação → Internet Fibra → Lentidão → Em análise',
            messages: [
                {
                    type: 'system',
                    text: 'Ticket #1781698895651 criado — Internet lenta após 22h',
                    meta: '16/06/2026 às 09:21 · Sistema'
                },
                {
                    type: 'client',
                    initials: 'MO',
                    text: 'Boa noite! Minha internet fica muito lenta depois das 22h. Já reiniciei o roteador mas continua igual. Podem me ajudar?',
                    meta: '16/06/2026 às 09:25 · Maria Oliveira'
                },
                {
                    type: 'agent',
                    initials: 'AS',
                    text: 'Olá Maria! Sou a Ana Silva e vou te ajudar. Vou verificar o sinal da sua região agora. Você usa Wi-Fi ou cabo de rede?',
                    meta: '16/06/2026 às 09:35 · Ana Silva'
                }
            ]
        },
        {
            id: '1781698895652',
            queueId: 'aguard-retorno',
            name: 'Carlos Mendes',
            initials: 'CM',
            cpf: '987.654.321-00',
            statusKey: 'aguard-retorno',
            statusLabel: 'Aguard. retorno',
            statusClass: 'aguardando',
            subject: 'Cancelamento de plano TV',
            channel: 'Telefone',
            channelIcon: 'ti-phone',
            date: '15/06 · 14:03',
            tags: ['TV', 'Cancelamento'],
            products: [{ label: 'TV', icon: 'ti-tv', cls: 'tv' }],
            thermo: 62,
            thermoLabel: 'Atenção',
            contact: {
                email: 'carlos.mendes@email.com',
                phone: '(11) 91234-5678',
                cpf: '987.654.321-00'
            },
            classification: {
                canal: 'Telefone',
                tipo: 'Solicitação',
                produto: 'TV',
                motivo: 'Queda de sinal'
            },
            iaReply: 'Carlos, confirmo o recebimento da solicitação de cancelamento do plano TV. Posso verificar alternativas de retenção ou prosseguir com o cancelamento conforme sua preferência.',
            iaTabulation: 'Solicitação → TV → Cancelamento → Aguard. retorno',
            messages: [
                {
                    type: 'system',
                    text: 'Ticket #1781698895652 criado — Cancelamento de plano TV',
                    meta: '15/06/2026 às 14:03 · Sistema'
                },
                {
                    type: 'client',
                    initials: 'CM',
                    text: 'Quero cancelar meu plano de TV. Não uso mais e o valor está alto.',
                    meta: '15/06/2026 às 14:05 · Carlos Mendes'
                }
            ]
        },
        {
            id: '1781698895653',
            queueId: 'novos',
            name: 'João Ferreira',
            initials: 'JF',
            cpf: '456.789.123-45',
            statusKey: 'novos',
            statusLabel: 'Novo',
            statusClass: 'novo',
            subject: 'Segunda via de fatura',
            channel: 'E-mail',
            channelIcon: 'ti-mail',
            date: '17/06 · 08:44',
            tags: ['Financeiro'],
            products: [{ label: 'Internet Fibra', icon: 'ti-wifi', cls: 'fibra' }],
            thermo: 22,
            thermoLabel: 'Estável',
            contact: {
                email: 'joao.ferreira@email.com',
                phone: '(11) 99876-5432',
                cpf: '456.789.123-45'
            },
            classification: {
                canal: 'E-mail',
                tipo: 'Solicitação',
                produto: 'Internet Fibra',
                motivo: 'Sem conexão'
            },
            iaReply: 'Olá João! Envio a segunda via da fatura em anexo. O boleto também pode ser acessado pelo portal do cliente com seu CPF.',
            iaTabulation: 'Solicitação → Internet Fibra → Financeiro → Novo',
            messages: [
                {
                    type: 'system',
                    text: 'Ticket #1781698895653 criado — Segunda via de fatura',
                    meta: '17/06/2026 às 08:44 · Sistema'
                },
                {
                    type: 'client',
                    initials: 'JF',
                    text: 'Preciso da segunda via da minha fatura de junho. Não consigo acessar pelo portal.',
                    meta: '17/06/2026 às 08:46 · João Ferreira'
                }
            ]
        }
    ];

    var state = {
        activeQueue: 'em-andamento',
        activeTicketId: '1781698895651',
        activeSort: 'data',
        activeMainTab: 'conversa',
        composeMode: 'public'
    };

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

    function getTicket(id) {
        return TICKETS.find(function (t) { return t.id === id; });
    }

    function countByQueue(queueId) {
        return TICKETS.filter(function (t) { return t.queueId === queueId; }).length;
    }

    function filteredTickets() {
        return TICKETS.filter(function (t) { return t.queueId === state.activeQueue; });
    }

    function renderQueueList() {
        var list = $('#queueStatusList');
        if (!list) return;
        list.innerHTML = QUEUE_STATUSES.map(function (s) {
            var count = countByQueue(s.id);
            var active = s.id === state.activeQueue ? ' is-active' : '';
            return '<li class="queue-status-item' + active + '" data-queue="' + s.id + '" role="button" tabindex="0">' +
                '<span class="queue-status-item__dot" style="background:' + s.dot + '"></span>' +
                '<span class="queue-status-item__name">' + escapeHtml(s.name) + '</span>' +
                '<span class="queue-status-item__count">' + count + '</span></li>';
        }).join('');
    }

    function renderTicketCards() {
        var list = $('#ticketCards');
        var tickets = filteredTickets();
        var title = $('#ticketListTitle');
        if (!list) return;

        var queueName = (QUEUE_STATUSES.find(function (q) { return q.id === state.activeQueue; }) || {}).name || '';
        if (title) {
            title.textContent = queueName + ' · ' + tickets.length;
        }

        if (!tickets.length) {
            list.innerHTML = '<li class="ticket-list-empty" style="padding:20px 13px;font-size:12px;color:#6b7280;text-align:center;">Nenhum ticket nesta fila</li>';
            return;
        }

        list.innerHTML = tickets.map(function (t) {
            var active = t.id === state.activeTicketId ? ' is-active' : '';
            var tags = t.tags.map(function (tag) {
                return '<span class="tag">' + escapeHtml(tag) + '</span>';
            }).join('');
            return '<li class="ticket-card' + active + '" data-ticket-id="' + t.id + '" role="button" tabindex="0">' +
                '<div class="ticket-card__top">' +
                '<span class="ticket-card__name">' + escapeHtml(t.name) + '</span>' +
                '<span class="status-badge status-badge--' + t.statusClass + '">' + escapeHtml(t.statusLabel) + '</span></div>' +
                '<div class="ticket-card__subject">' + escapeHtml(t.subject) + '</div>' +
                '<div class="ticket-card__meta">' +
                '<span class="ticket-card__channel"><i class="ti ' + t.channelIcon + '"></i> ' + escapeHtml(t.channel) + '</span>' +
                '<span>' + escapeHtml(t.date) + '</span></div>' +
                '<div class="ticket-card__tags">' + tags + '</div></li>';
        }).join('');
    }

    function renderMessage(msg) {
        if (msg.type === 'system') {
            return '<div class="msg-row msg-row--system">' +
                '<div class="msg-avatar msg-avatar--system"><i class="ti ti-terminal"></i></div>' +
                '<div class="msg-body">' +
                '<div class="msg-bubble msg-bubble--system">' + escapeHtml(msg.text) + '</div>' +
                '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
        }
        if (msg.type === 'client') {
            return '<div class="msg-row">' +
                '<div class="msg-avatar msg-avatar--client">' + escapeHtml(msg.initials) + '</div>' +
                '<div class="msg-body">' +
                '<div class="msg-bubble msg-bubble--client">' + escapeHtml(msg.text) + '</div>' +
                '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
        }
        return '<div class="msg-row msg-row--agent">' +
            '<div class="msg-avatar msg-avatar--agent">' + escapeHtml(msg.initials) + '</div>' +
            '<div class="msg-body">' +
            '<div class="msg-bubble msg-bubble--agent">' + escapeHtml(msg.text) + '</div>' +
            '<div class="msg-meta">' + escapeHtml(msg.meta) + '</div></div></div>';
    }

    function renderConversation(ticket) {
        var conv = $('#conversation');
        if (!conv || !ticket) return;
        var html = ticket.messages.map(renderMessage).join('');
        html += '<div class="ia-suggestion-bar" id="iaSuggestionBar">' +
            '<span class="ia-suggestion-bar__label">IA</span>' +
            '<span class="ia-suggestion-bar__text" id="iaReplyText">' + escapeHtml(ticket.iaReply) + '</span>' +
            '<button type="button" class="ia-suggestion-bar__btn" id="btnUseReply">Usar resposta</button></div>';
        conv.innerHTML = html;
        conv.scrollTop = conv.scrollHeight;
    }

    function renderMainContent(ticket) {
        if (!ticket) return;

        var avatar = $('#headerAvatar');
        var name = $('#headerName');
        var sub = $('#headerSub');
        var products = $('#headerProducts');
        var ta = $('#composePublic');
        if (avatar) avatar.textContent = ticket.initials;
        if (name) name.textContent = ticket.name;
        if (sub) sub.textContent = 'CPF ' + ticket.cpf + ' · #' + ticket.id;
        if (ta) {
            ta.value = '';
            ta.placeholder = 'Escreva sua resposta para ' + ticket.name + '…';
        }

        if (products) {
            products.innerHTML = ticket.products.map(function (p) {
                return '<span class="product-pill product-pill--' + p.cls + '">' +
                    '<i class="ti ' + p.icon + '"></i> ' + escapeHtml(p.label) + '</span>';
            }).join('');
        }

        renderConversation(ticket);
        renderRightPanel(ticket);
    }

    function renderRightPanel(ticket) {
        if (!ticket) return;

        var score = $('#thermoScore');
        var fill = $('#thermoFill');
        var label = $('#thermoLabel');
        if (score) score.textContent = ticket.thermo;
        if (fill) fill.style.width = ticket.thermo + '%';
        if (label) {
            label.textContent = ticket.thermoLabel;
            label.style.color = ticket.thermo >= 55 ? '#FCC200' : '#15A237';
        }
        if (score) score.style.color = ticket.thermo >= 55 ? '#FCC200' : '#15A237';
        if (fill) fill.style.background = ticket.thermo >= 55 ? '#FCC200' : '#15A237';

        var email = $('#contactEmail');
        var phone = $('#contactPhone');
        var cpf = $('#contactCpf');
        if (email) email.textContent = ticket.contact.email;
        if (phone) phone.textContent = ticket.contact.phone;
        if (cpf) cpf.textContent = 'CPF ' + ticket.contact.cpf;

        var selCanal = $('#selCanal');
        var selTipo = $('#selTipo');
        var selProduto = $('#selProduto');
        var selMotivo = $('#selMotivo');
        if (selCanal) selCanal.value = ticket.classification.canal;
        if (selTipo) selTipo.value = ticket.classification.tipo;
        if (selProduto) selProduto.value = ticket.classification.produto;
        if (selMotivo) selMotivo.value = ticket.classification.motivo;

        var iaText = $('#iaTabulationText');
        if (iaText) iaText.textContent = ticket.iaTabulation;
    }

    function selectTicket(id) {
        var ticket = getTicket(id);
        if (!ticket) return;
        state.activeTicketId = id;
        renderTicketCards();
        renderMainContent(ticket);
    }

    function selectQueue(queueId) {
        state.activeQueue = queueId;
        var tickets = filteredTickets();
        if (tickets.length && !tickets.find(function (t) { return t.id === state.activeTicketId; })) {
            state.activeTicketId = tickets[0].id;
        }
        renderQueueList();
        renderTicketCards();
        var ticket = getTicket(state.activeTicketId);
        if (ticket && ticket.queueId === queueId) {
            renderMainContent(ticket);
        } else if (tickets.length) {
            selectTicket(tickets[0].id);
        } else {
            renderMainContent(null);
        }
    }

    function sendMessage() {
        var ticket = getTicket(state.activeTicketId);
        if (!ticket || state.composeMode !== 'public') return;

        var ta = $('#composePublic');
        var text = ta && ta.value.trim();
        if (!text) return;

        var now = new Date();
        var dateStr = now.toLocaleDateString('pt-BR') + ' às ' +
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        ticket.messages.push({
            type: 'agent',
            initials: 'AS',
            text: text,
            meta: dateStr + ' · Ana Silva'
        });

        if (ta) ta.value = '';
        renderConversation(ticket);
    }

    function applyTabulation() {
        var ticket = getTicket(state.activeTicketId);
        if (!ticket) return;

        var parts = ticket.iaTabulation.split('→').map(function (p) { return p.trim(); });
        if (parts.length >= 4) {
            var tipoMap = { 'Reclamação': 'Reclamação', 'Solicitação': 'Solicitação', 'Dúvida': 'Dúvida' };
            var prodMap = { 'Internet Fibra': 'Internet Fibra', 'TV': 'TV', 'Telefone': 'Telefone' };
            var motMap = { 'Lentidão': 'Lentidão', 'Queda de sinal': 'Queda de sinal', 'Sem conexão': 'Sem conexão', 'Cancelamento': 'Queda de sinal', 'Financeiro': 'Sem conexão' };

            ticket.classification.tipo = tipoMap[parts[0]] || parts[0];
            ticket.classification.produto = prodMap[parts[1]] || parts[1];
            ticket.classification.motivo = motMap[parts[2]] || parts[2];

            var selTipo = $('#selTipo');
            var selProduto = $('#selProduto');
            var selMotivo = $('#selMotivo');
            if (selTipo) selTipo.value = ticket.classification.tipo;
            if (selProduto) selProduto.value = ticket.classification.produto;
            if (selMotivo) selMotivo.value = ticket.classification.motivo;

            var btn = $('#btnApplyTabulation');
            if (btn) {
                var orig = btn.textContent;
                btn.textContent = 'Tabulação aplicada ✓';
                setTimeout(function () { btn.textContent = orig; }, 1800);
            }
        }
    }

    function bindEvents() {
        var queueList = $('#queueStatusList');
        if (queueList) {
            queueList.addEventListener('click', function (e) {
                var item = e.target.closest('.queue-status-item');
                if (item) selectQueue(item.getAttribute('data-queue'));
            });
        }

        var ticketCards = $('#ticketCards');
        if (ticketCards) {
            ticketCards.addEventListener('click', function (e) {
                var card = e.target.closest('.ticket-card');
                if (card) selectTicket(card.getAttribute('data-ticket-id'));
            });
        }

        $$('.sort-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                $$('.sort-chip').forEach(function (c) { c.classList.remove('is-active'); });
                chip.classList.add('is-active');
                state.activeSort = chip.getAttribute('data-sort');
            });
        });

        $$('.tab-btn[data-main-tab]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tab = btn.getAttribute('data-main-tab');
                state.activeMainTab = tab;
                $$('.tab-btn[data-main-tab]').forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                $$('.tab-panel[data-panel]').forEach(function (p) {
                    p.classList.toggle('is-active', p.getAttribute('data-panel') === tab);
                });
            });
        });

        $$('.compose-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var mode = tab.getAttribute('data-compose');
                state.composeMode = mode;
                $$('.compose-tab').forEach(function (t) { t.classList.remove('is-active'); });
                tab.classList.add('is-active');
                var box = $('#composeBox');
                if (box) box.setAttribute('data-mode', mode);
            });
        });

        var composePublic = $('#composePublic');
        var composeBox = $('#composeBox');
        if (composePublic && composeBox) {
            composePublic.addEventListener('focus', function () {
                composeBox.classList.add('is-focused');
            });
            composePublic.addEventListener('blur', function () {
                composeBox.classList.remove('is-focused');
            });
        }

        document.addEventListener('click', function (e) {
            if (e.target.id === 'btnUseReply' || e.target.closest('#btnUseReply')) {
                var ticket = getTicket(state.activeTicketId);
                var ta = $('#composePublic');
                if (ticket && ta) {
                    ta.value = ticket.iaReply;
                    ta.focus();
                    if (composeBox) composeBox.classList.add('is-focused');
                }
            }
            if (e.target.id === 'btnApplyTabulation' || e.target.closest('#btnApplyTabulation')) {
                applyTabulation();
            }
            if (e.target.id === 'btnSend' || e.target.closest('#btnSend')) {
                sendMessage();
            }
            if (e.target.id === 'btnSaveTicket' || e.target.closest('#btnSaveTicket')) {
                var btn = $('#btnSaveTicket');
                if (btn) {
                    btn.classList.add('is-saved');
                    btn.innerHTML = '<i class="ti ti-check"></i> Salvo!';
                    setTimeout(function () {
                        btn.classList.remove('is-saved');
                        btn.innerHTML = '<i class="ti ti-device-floppy"></i> Salvar no ticket';
                    }, 2000);
                }
            }
        });

        var btnRefresh = $('#btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', function () {
                renderQueueList();
                renderTicketCards();
                var ticket = getTicket(state.activeTicketId);
                if (ticket) renderMainContent(ticket);
            });
        }
    }

    function init() {
        renderQueueList();
        renderTicketCards();
        var ticket = getTicket(state.activeTicketId);
        if (ticket) renderMainContent(ticket);
        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
