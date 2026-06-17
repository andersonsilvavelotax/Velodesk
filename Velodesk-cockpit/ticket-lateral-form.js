/* Formulário lateral fixo do ticket — protótipo V3 com regras de negócio */
(function () {
    const STORAGE_KEY = 'velodeskLateralFormConfig';
    const DB_KEY = 'velodeskClientDB';

    const DEFAULT_PRODUCT_TREE = {
        'Internet Fibra': {
            'Lentidão': ['Aguardando técnico', 'Escalado N2', 'Em análise', 'Resolvido parcialmente'],
            'Instalação': ['Agendamento pendente', 'Técnico no local', 'Obra na região'],
            'Cancelamento': ['Retenção acionada', 'Cliente irrecuperável', 'Aguardando retorno'],
            'Cobrança': ['Contestação', '2ª via', 'Estorno solicitado']
        },
        'TV': {
            'Canal indisponível': ['Decoder reiniciado', 'Pacote não contratado', 'Escalado N2'],
            'Instalação': ['Agendamento pendente', 'Cabos danificados'],
            'Cancelamento': ['Retenção acionada', 'Downgrade oferecido']
        },
        'Móvel': {
            'Sem sinal': ['Área sem cobertura', 'Chip substituído', 'Portabilidade pendente'],
            'Cobrança': ['Plano incorreto', 'Roaming contestado'],
            'Cancelamento': ['Retenção acionada', 'Multa informada']
        },
        'Combo': {
            'Lentidão': ['Fibra OK / Wi-Fi', 'Escalado N2'],
            'Cobrança': ['Fatura unificada', 'Desconto combo'],
            'Instalação': ['Visita técnica combo']
        },
        'Telefone Fixo': {
            'Sem tom': ['Linha testada', 'Escalado rede'],
            'Portabilidade': ['Em processamento', 'Rejeitada operadora']
        },
        'Streaming': {
            'Acesso bloqueado': ['Conta reativada', 'Pacote não incluso'],
            'Login': ['Senha resetada', 'App atualizado']
        }
    };

    const DEFAULT_CONFIG = {
        classificacaoTipo: {
            label: 'Classificação de tipo',
            type: 'select',
            rule: 'manual',
            options: ['Reclamação', 'Solicitação', 'Informação', 'Elogio', 'Cancelamento', 'Retenção']
        },
        productTree: DEFAULT_PRODUCT_TREE,
        phaseAssignees: {
            novo: 'Fila N1 — Triagem',
            'em-aberto': 'Agente em atendimento',
            'em-espera': 'Backoffice',
            pendente: 'Supervisor de fila',
            resolvido: 'Encerramento automático'
        }
    };

    const FIELD_META = {
        cpf: { label: 'CPF', rule: 'db' },
        canal: { label: 'Canal', rule: 'auto' },
        classificacaoTipo: { label: 'Classificação de tipo', rule: 'manual' },
        produto: { label: 'Produto', rule: 'attendance' },
        motivo: { label: 'Motivo', rule: 'dynamic-product' },
        detalhe: { label: 'Detalhe', rule: 'dynamic-motivo' },
        responsavel: { label: 'Responsável', rule: 'journey-agent' },
        atribuido: { label: 'Atribuído', rule: 'phase' }
    };

    const PRODUCT_TAG_CLASS = {
        'Móvel': 'velo-tag--mobile',
        'Combo': 'velo-tag--combo',
        'Internet Fibra': 'velo-tag--fiber',
        'TV': 'velo-tag--tv',
        'Telefone Fixo': 'velo-tag--landline',
        'Streaming': 'velo-tag--streaming'
    };

    const FIELD_ORDER = ['cpf', 'canal', 'classificacaoTipo', 'produto', 'motivo', 'detalhe', 'responsavel', 'atribuido'];

    function getConfig() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!saved) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            return Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), saved, {
                productTree: saved.productTree || DEFAULT_PRODUCT_TREE,
                phaseAssignees: Object.assign({}, DEFAULT_CONFIG.phaseAssignees, saved.phaseAssignees || {})
            });
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }

    function saveConfig(config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    function seedClientDB() {
        if (typeof window.resetVelodeskClientDB === 'function') {
            window.resetVelodeskClientDB();
            return;
        }
        if (localStorage.getItem(DB_KEY)) return;
        const db = {
            '12345678901': {
                cpf: '123.456.789-01',
                name: 'Maria Oliveira',
                email: 'maria.oliveira@email.com',
                telefone: '(11) 98765-4321',
                situacao: 'Adimplente',
                produtos: ['Internet Fibra', 'TV'],
                risco: 'Baixo',
                atendimentos: [
                    { data: '2026-05-28', canal: 'WhatsApp', assunto: 'Lentidão à noite', status: 'Resolvido' },
                    { data: '2026-06-03', canal: 'Telefone', assunto: 'Cobrança duplicada', status: 'Em andamento' }
                ],
                abandonoJornada: { total: 2, ultimaEtapa: 'Confirmação de pagamento', ultimaData: '2026-05-15' },
                analise: 'Cliente recorrente em fibra; 2 abandonos na jornada digital nos últimos 90 dias.'
            },
            '98765432100': {
                cpf: '987.654.321-00',
                name: 'João Pereira',
                email: 'joao.pereira@email.com',
                telefone: '(11) 91234-5678',
                situacao: 'Inadimplente',
                produtos: ['Móvel', 'Combo'],
                risco: 'Alto',
                atendimentos: [
                    { data: '2026-06-01', canal: 'Portal', assunto: 'Bloqueio por atraso', status: 'Aberto' }
                ],
                abandonoJornada: { total: 5, ultimaEtapa: 'Validação de identidade', ultimaData: '2026-06-08' },
                analise: 'Alto risco de churn; histórico de abandono em self-service.'
            },
            '11122233344': {
                cpf: '111.222.333-44',
                name: 'Empresa Tech Ltda',
                email: 'contato@empresatech.com.br',
                telefone: '(11) 3456-7890',
                situacao: 'Adimplente',
                produtos: ['Internet Fibra', 'Telefone Fixo', 'Streaming'],
                risco: 'Médio',
                atendimentos: [
                    { data: '2026-05-10', canal: 'E-mail', assunto: 'Upgrade link dedicado', status: 'Resolvido' }
                ],
                abandonoJornada: { total: 0, ultimaEtapa: '—', ultimaData: '—' },
                analise: 'Conta corporativa estável; sem abandono recente.'
            }
        };
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    }

    function normalizeCpf(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function formatCpf(digits) {
        const d = normalizeCpf(digits);
        if (d.length !== 11) return digits;
        return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    function lookupClientByCpf(cpf) {
        const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
        return db[normalizeCpf(cpf)] || null;
    }

    function getTicketById(ticketId) {
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        for (const box of columns) {
            if (!box.tickets) continue;
            const ticket = box.tickets.find(function (t) { return t.id === ticketId; });
            if (ticket) return ticket;
        }
        const tabInfo = window.openTicketTabs && window.openTicketTabs.get(ticketId);
        return tabInfo ? tabInfo.ticket : null;
    }

    function getCurrentAgentName() {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (user.name) return user.name;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users[0]) return users[0].name || users[0].email || 'Agente';
        return 'Agente';
    }

    function detectChannel(ticket) {
        if (ticket.lateralForm && ticket.lateralForm.canal && ticket.lateralForm._canalLocked) {
            return ticket.lateralForm.canal;
        }
        if (ticket.whatsappConversationId || ticket.source === 'WhatsApp') return 'WhatsApp';
        if (ticket.phone && !ticket.source) return 'Telefone';
        const src = (ticket.source || ticket.channel || '').toLowerCase();
        if (src.includes('whatsapp')) return 'WhatsApp';
        if (src.includes('telefone') || src.includes('phone') || src.includes('voip')) return 'Telefone';
        if (src.includes('mail') || src.includes('e-mail') || src.includes('email')) return 'E-mail';
        if (src.includes('chat')) return 'Chat';
        if (src.includes('portal') || src.includes('web')) return 'Portal';
        if (/whatsapp/i.test(ticket.title || '')) return 'WhatsApp';
        if (/telefone|ligação|ligacao/i.test(ticket.title || '')) return 'Telefone';
        return ticket.channel || 'Portal';
    }

    function getPhaseAssignee(ticket) {
        const config = getConfig();
        const status = (ticket.status || 'novo').toLowerCase();
        const map = config.phaseAssignees || {};
        const base = map[status] || map.novo || 'Fila N1 — Triagem';
        if (base === 'Agente em atendimento') return getCurrentAgentName();
        return base;
    }

    function inferProductFromTicket(ticket, clientRecord) {
        if (ticket.lateralForm && ticket.lateralForm.produto) return ticket.lateralForm.produto;
        const title = (ticket.title || '').toLowerCase();
        const tree = getProductList();
        for (let i = 0; i < tree.length; i++) {
            if (title.includes(tree[i].toLowerCase())) return tree[i];
        }
        if (clientRecord && clientRecord.produtos && clientRecord.produtos.length === 1) {
            return clientRecord.produtos[0];
        }
        if (clientRecord && clientRecord.produtos && clientRecord.produtos.length) {
            return clientRecord.produtos[0];
        }
        return '';
    }

    function getProductList() {
        return Object.keys(getConfig().productTree || DEFAULT_PRODUCT_TREE);
    }

    function getMotivosForProduct(produto) {
        const tree = getConfig().productTree || {};
        return produto && tree[produto] ? Object.keys(tree[produto]) : [];
    }

    function getDetalhesForMotivo(produto, motivo) {
        const tree = getConfig().productTree || {};
        if (!produto || !motivo || !tree[produto]) return [];
        return tree[produto][motivo] || [];
    }

    function ensureLateralFormData(ticket) {
        const client = ticket.clientCPF || ticket.lateralForm?.cpf
            ? lookupClientByCpf(ticket.lateralForm?.cpf || ticket.clientCPF)
            : null;

        if (!ticket.lateralForm) {
            ticket.lateralForm = {
                cpf: ticket.clientCPF || '',
                canal: detectChannel(ticket),
                classificacaoTipo: '',
                produto: inferProductFromTicket(ticket, client),
                motivo: '',
                detalhe: '',
                responsavel: getCurrentAgentName(),
                atribuido: getPhaseAssignee(ticket),
                _canalLocked: true,
                _clientSnapshot: client ? client.cpf : null
            };
        } else {
            if (!ticket.lateralForm.canal) {
                ticket.lateralForm.canal = detectChannel(ticket);
                ticket.lateralForm._canalLocked = true;
            }
            if (!ticket.lateralForm.responsavel) {
                ticket.lateralForm.responsavel = ticket.responsibleAgent || getCurrentAgentName();
            }
            ticket.lateralForm.atribuido = getPhaseAssignee(ticket);
        }
        return ticket.lateralForm;
    }

    function syncTicketLateralFormWithConfig(ticket) {
        if (!ticket) return ticket;
        const config = getConfig();
        const data = ensureLateralFormData(ticket);

        if (data.classificacaoTipo) {
            const opts = config.classificacaoTipo.options || [];
            if (opts.length && opts.indexOf(data.classificacaoTipo) === -1) {
                data.classificacaoTipo = '';
            }
        }

        const products = getProductList();
        if (data.produto && products.indexOf(data.produto) === -1) {
            data.produto = '';
            data.motivo = '';
            data.detalhe = '';
        }

        if (data.produto && data.motivo) {
            const motivos = getMotivosForProduct(data.produto);
            if (motivos.indexOf(data.motivo) === -1) {
                data.motivo = '';
                data.detalhe = '';
            }
        }

        if (data.produto && data.motivo && data.detalhe) {
            const detalhes = getDetalhesForMotivo(data.produto, data.motivo);
            if (detalhes.length && detalhes.indexOf(data.detalhe) === -1) {
                data.detalhe = '';
            }
        }

        data.atribuido = getPhaseAssignee(ticket);
        data.responsavel = data.responsavel || ticket.responsibleAgent || getCurrentAgentName();
        ticket.lateralForm = data;
        ticket.group = data.atribuido;
        ticket.attendanceGroup = data.atribuido;
        return ticket;
    }

    function refreshTicketLateralFormPanel(ticketId) {
        const id = parseInt(ticketId, 10);
        if (!id) return false;
        const ticket = getTicketById(id);
        if (!ticket) return false;

        syncTicketLateralFormWithConfig(ticket);

        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + id + '"]');
        if (!panel) return false;

        const tmp = document.createElement('div');
        tmp.innerHTML = renderTicketLateralFormHTML(ticket);
        const newPanel = tmp.firstElementChild;
        if (!newPanel) return false;

        panel.replaceWith(newPanel);
        bindFormEvents(id);
        refreshCentralClientProfile(id);
        return true;
    }

    function applyLateralFormConfigToAllTickets() {
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let count = 0;
        const ticketIds = new Set();

        columns.forEach(function (box) {
            if (!box.tickets) return;
            box.tickets.forEach(function (ticket, idx) {
                syncTicketLateralFormWithConfig(ticket);
                box.tickets[idx] = ticket;
                ticketIds.add(ticket.id);
                count++;
            });
        });

        localStorage.setItem('kanbanColumns', JSON.stringify(columns));

        if (window.openTicketTabs && typeof window.openTicketTabs.forEach === 'function') {
            window.openTicketTabs.forEach(function (info, key) {
                if (info && info.ticket) {
                    syncTicketLateralFormWithConfig(info.ticket);
                    ticketIds.add(info.ticket.id);
                    if (typeof key === 'number' || !isNaN(parseInt(key, 10))) {
                        const colTicket = getTicketById(parseInt(key, 10));
                        if (colTicket) Object.assign(info.ticket, colTicket);
                    }
                }
            });
        }

        let refreshed = 0;
        ticketIds.forEach(function (id) {
            if (refreshTicketLateralFormPanel(id)) refreshed++;
        });

        return { count: count, refreshed: refreshed };
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function buildOptions(values, selected, placeholder) {
        let html = '<option value="">' + escapeHtml(placeholder || 'Selecione...') + '</option>';
        values.forEach(function (opt) {
            html += '<option value="' + escapeHtml(opt) + '"' + (selected === opt ? ' selected' : '') + '>' + escapeHtml(opt) + '</option>';
        });
        if (selected && values.indexOf(selected) === -1) {
            html += '<option value="' + escapeHtml(selected) + '" selected>' + escapeHtml(selected) + '</option>';
        }
        return html;
    }

    function renderProductTags(produtos) {
        return (produtos || []).map(function (p) {
            var lower = String(p).toLowerCase();
            var cls = 'rp-product-tag--default';
            if (lower.indexOf('móvel') >= 0 || lower.indexOf('movel') >= 0) cls = 'rp-product-tag--mobile';
            else if (lower.indexOf('combo') >= 0) cls = 'rp-product-tag--combo';
            else if (lower.indexOf('fibra') >= 0) cls = 'rp-product-tag--fiber';
            else if (lower.indexOf('tv') >= 0) cls = 'rp-product-tag--tv';
            else cls = PRODUCT_TAG_CLASS[p] ? PRODUCT_TAG_CLASS[p].replace('velo-tag', 'rp-product-tag') : 'rp-product-tag--default';
            return '<span class="rp-product-tag ' + cls + '">' + escapeHtml(p) + '</span>';
        }).join('');
    }

    function renderHistoryItems(atendimentos) {
        return (atendimentos || []).slice(0, 4).map(function (a) {
            const searchKey = (a.data + ' ' + a.canal + ' ' + a.assunto + ' ' + a.status).toLowerCase();
            return '<li class="velo-hist-row velo-lf-history-item" data-search="' + escapeHtml(searchKey) + '">' +
                '<span class="velo-hist-row__title">' + escapeHtml(a.assunto) + '</span>' +
                '<span class="velo-hist-row__meta">' + escapeHtml(a.data) + ' · ' + escapeHtml(a.canal) + ' · ' + escapeHtml(a.status) + '</span></li>';
        }).join('');
    }

    function getThermoVisualMeta(client) {
        const score = Math.min(100, Math.max(0, client.termometro != null ? client.termometro : 50));
        const nivel = client.termometroNivel || (score >= 80 ? 'quente' : score >= 55 ? 'morno' : 'frio');
        const label = client.termometroLabel || (score >= 80 ? 'Crítico' : score >= 55 ? 'Atenção' : 'Estável');
        const map = {
            frio: {
                icon: 'fa-snowflake',
                badge: label,
                color: '#059669',
                bg: '#ecfdf5',
                border: '#a7f3d0',
                zoneClass: 'velo-thermo-zone--frio',
                action: 'Cliente estável — priorize resolução técnica com SLA curto.'
            },
            morno: {
                icon: 'fa-temperature-half',
                badge: label,
                color: '#d97706',
                bg: '#fffbeb',
                border: '#fde68a',
                zoneClass: 'velo-thermo-zone--morno',
                action: 'Atenção — alinhe expectativas, confirme prazos e evite transferências.'
            },
            quente: {
                icon: 'fa-fire',
                badge: label,
                color: '#dc2626',
                bg: '#fef2f2',
                border: '#fecaca',
                zoneClass: 'velo-thermo-zone--quente',
                action: 'Prioridade alta — considere retenção, escalonamento ou supervisor.'
            }
        };
        return Object.assign({ score: score, nivel: nivel }, map[nivel] || map.morno);
    }

    function pickClientNextStep(client, meta) {
        const desc = (client.breveDescricao || '').trim();
        if (desc) {
            const tail = desc.split(/[—–]/).pop().trim().replace(/\.$/, '');
            if (tail.length >= 8) return tail;
            const first = desc.split(/[.;]/)[0].trim();
            if (first.length >= 8) return first;
        }
        if (client.analise) {
            return client.analise
                .replace(/^Termômetro\s+[^:]+:\s*/i, '')
                .replace(/^Perfil\s+[^:]+:\s*/i, '')
                .split(/[.;]/)[0]
                .trim();
        }
        return meta.action;
    }

    function renderClientSummary(client) {
        const meta = getThermoVisualMeta(client);
        const step = pickClientNextStep(client, meta);
        return '<div class="velo-brief velo-brief--' + escapeHtml(meta.nivel) + '">' +
            '<span class="velo-brief__label">Próximo passo</span>' +
            '<p class="velo-brief__text">' + escapeHtml(step) + '</p></div>';
    }

    function renderStatusChips(client, canalLabel) {
        const sit = (client.situacao || '').toLowerCase();
        const sitClass = sit.indexOf('inadim') !== -1 ? 'velo-chip--danger' : 'velo-chip--success';
        const sitIcon = sit.indexOf('inadim') !== -1 ? 'fa-exclamation-triangle' : 'fa-check-circle';
        const risco = (client.risco || 'baixo').toLowerCase();
        const riscoClass = risco.indexOf('alto') !== -1 ? 'velo-chip--danger' : risco.indexOf('méd') !== -1 || risco.indexOf('med') !== -1 ? 'velo-chip--warn' : 'velo-chip--success';
        const ab = client.abandonoJornada || {};
        let chips = '<div class="velo-client-chips">' +
            '<span class="velo-chip ' + sitClass + '"><i class="fas ' + sitIcon + '"></i> ' + escapeHtml(client.situacao || '—') + '</span>' +
            '<span class="velo-chip ' + riscoClass + '"><i class="fas fa-shield-halved"></i> Risco ' + escapeHtml(client.risco || '—') + '</span>' +
            '<span class="velo-chip velo-chip--info"><i class="fas fa-comments"></i> ' + escapeHtml(canalLabel) + '</span>';
        if (ab.total > 0) {
            chips += '<span class="velo-chip velo-chip--warn"><i class="fas fa-route"></i> ' + ab.total + ' abandono(s)</span>';
        }
        return chips + '</div>';
    }

    function renderThermometer(client) {
        if (!client) return '';
        const meta = getThermoVisualMeta(client);
        return '<div class="velo-thermo-compact velo-thermo-compact--' + escapeHtml(meta.nivel) + '" role="meter" aria-valuenow="' + meta.score + '" aria-valuemin="0" aria-valuemax="100">' +
            '<div class="velo-thermo-dial velo-thermo-dial--sm" style="--thermo-score:' + meta.score + ';--thermo-color:' + meta.color + '">' +
            '<div class="velo-thermo-dial__ring"></div>' +
            '<div class="velo-thermo-dial__center">' +
            '<span class="velo-thermo-dial__value">' + meta.score + '</span></div></div>' +
            '<div class="velo-thermo-compact__label">' +
            '<span class="velo-thermo-badge velo-thermo-badge--sm" style="background:' + meta.bg + ';color:' + meta.color + ';border-color:' + meta.border + '">' +
            '<i class="fas ' + meta.icon + '"></i> ' + escapeHtml(meta.badge) + '</span>' +
            '<span class="velo-thermo-compact__hint">Termômetro do cliente</span></div></div>';
    }

    function renderClientAccessButton(ticket) {
        let label = 'Dados do cliente';
        const cpfRaw = (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || '';
        const client = lookupClientByCpf(cpfRaw);
        if (client && client.name) {
            label = client.name;
        } else if (ticket.clientName) {
            label = ticket.clientName;
        } else if (ticket.solicitante) {
            label = ticket.solicitante;
        }
        return '<button type="button" class="btn-secondary velo-lf-client-btn" data-ticket-id="' + ticket.id + '" title="Ver cadastro e tickets do cliente">' +
            '<i class="fas fa-user-circle"></i> <span>' + escapeHtml(label) + '</span></button>';
    }

    function getClientFromTicket(ticket) {
        const cpfRaw = (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || '';
        return lookupClientByCpf(cpfRaw);
    }

    function renderTicketClientProfileCentral(ticket) {
        const cpfRaw = (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || '';
        const cpfNorm = normalizeCpf(cpfRaw);
        const client = lookupClientByCpf(cpfRaw);
        const cpfDisplay = cpfNorm.length === 11 ? formatCpf(cpfNorm) : (cpfRaw ? escapeHtml(cpfRaw) : '—');
        const name = client ? client.name : (ticket.clientName || ticket.solicitante || '—');
        const email = client && client.email ? client.email : (ticket.clientEmail || '—');
        const telefone = client && client.telefone ? client.telefone : (ticket.phone || ticket.clientPhone || '—');
        const productsHtml = client && client.produtos && client.produtos.length
            ? renderProductTags(client.produtos)
            : '<span class="ticket-client-profile__empty">—</span>';

        return '<section class="ticket-client-profile ticket-client-profile--compact" id="ticket-client-profile-' + ticket.id + '" aria-label="Perfil do cliente">' +
            '<div class="ticket-client-profile__row ticket-client-profile__row--top">' +
            '<strong class="ticket-client-profile__name">' + escapeHtml(name) + '</strong>' +
            '<span class="ticket-client-profile__contact"><i class="fas fa-envelope"></i> ' + escapeHtml(email) + '</span>' +
            '<span class="ticket-client-profile__contact"><i class="fas fa-phone"></i> ' + escapeHtml(telefone) + '</span>' +
            '</div>' +
            '<div class="ticket-client-profile__row ticket-client-profile__row--bottom">' +
            '<span class="ticket-client-profile__cpf"><span class="ticket-client-profile__label">CPF</span> ' + cpfDisplay + '</span>' +
            '<span class="ticket-client-profile__products">' + productsHtml + '</span>' +
            '</div>' +
            '<button type="button" class="btn-secondary btn-sm ticket-client-history-btn" data-ticket-id="' + ticket.id + '" onclick="openClientFromTicket(' + ticket.id + ')">' +
            '<i class="fas fa-history"></i> Histórico de tickets</button></section>';
    }

    function refreshCentralClientProfile(ticketId) {
        const id = parseInt(ticketId, 10);
        const ticket = getTicketById(id);
        const host = document.getElementById('ticket-client-profile-' + id);
        if (!ticket || !host) return;
        const tmp = document.createElement('div');
        tmp.innerHTML = renderTicketClientProfileCentral(ticket);
        const newEl = tmp.firstElementChild;
        if (newEl) host.replaceWith(newEl);
    }

    function refreshThermoInPanel(panel, cpf) {
        const wrap = panel.querySelector('.velo-lf-thermo-wrap');
        if (!wrap) return;
        const client = lookupClientByCpf(cpf);
        wrap.innerHTML = client
            ? renderThermometer(client)
            : '<div class="velo-lf-thermo-empty"><i class="fas fa-temperature-half"></i> Informe o CPF para ver o termômetro</div>';
    }

    function renderClientInsights(client, ticketId) {
        if (!client) {
            return '<div class="velo-lf-db-empty" id="velo-lf-db-' + ticketId + '">' +
                '<i class="fas fa-user"></i> Informe o CPF e clique em <strong>Consultar</strong> para carregar dados do cliente, produtos e histórico.</div>';
        }
        const ticket = getTicketById(parseInt(ticketId, 10));
        const canalAtual = ticket ? detectChannel(ticket) : '';
        const canalLabel = canalAtual || ((client.atendimentos && client.atendimentos[0]) ? client.atendimentos[0].canal : '—');
        return '<div class="velo-lf-db-panel" id="velo-lf-db-' + ticketId + '">' +
            '<div class="velo-lf-db-head velo-lf-db-head--visual">' +
            '<div class="velo-client-avatar" aria-hidden="true"><i class="fas fa-user"></i></div>' +
            '<div class="velo-client-head__body">' +
            '<strong class="velo-client-name">' + escapeHtml(client.name) + '</strong>' +
            renderStatusChips(client, canalLabel) +
            '<div class="velo-product-tags velo-product-tags--inline">' + renderProductTags(client.produtos) + '</div>' +
            '</div></div>' +
            renderThermometer(client) +
            renderClientSummary(client) +
            '<div class="velo-lf-history velo-lf-history--compact">' +
            '<strong class="velo-lf-history-title">Histórico</strong>' +
            '<ul class="velo-lf-history-list">' + renderHistoryItems(client.atendimentos) + '</ul></div>' +
            '</div>';
    }

    function bindDbPanelExtras(panel) {
        /* reservado para interações futuras do painel DB */
    }

    function renderField(ticket, key, data, config) {
        const meta = FIELD_META[key];
        const id = 'velo-lf-' + key + '-' + ticket.id;
        const val = data[key] || '';
        const hint = meta.hint ? '<span class="velo-lf-field-hint">' + escapeHtml(meta.hint) + '</span>' : '';
        let inner = '';

        switch (key) {
            case 'cpf':
                inner = '<div class="velo-lf-cpf-row rp-cpf-row">' +
                    '<input type="text" class="form-input velo-lf-input" id="' + id + '" data-lf-key="cpf" ' +
                    'placeholder="000.000.000-00" value="' + escapeHtml(formatCpf(val)) + '" maxlength="14">' +
                    '<button type="button" class="btn-cpf-search velo-lf-db-btn" data-ticket-id="' + ticket.id + '" title="Consultar DB">' +
                    '<i class="ti ti-search"></i></button></div>';
                break;
            case 'canal':
                inner = '<input type="text" class="form-input velo-lf-input velo-lf-readonly" id="' + id + '" data-lf-key="canal" ' +
                    'value="' + escapeHtml(val || detectChannel(ticket)) + '" readonly>' +
                    '<span class="velo-lf-auto-tag"><i class="fas fa-magic"></i> Automático</span>';
                break;
            case 'classificacaoTipo':
                inner = '<select class="form-input velo-lf-input" id="' + id + '" data-lf-key="classificacaoTipo">' +
                    buildOptions(config.classificacaoTipo.options || [], val) + '</select>';
                break;
            case 'produto': {
                const client = lookupClientByCpf(data.cpf);
                let products = getProductList();
                if (client && client.produtos && client.produtos.length) {
                    products = client.produtos.filter(function (p) { return products.indexOf(p) !== -1 || true; });
                    client.produtos.forEach(function (p) {
                        if (products.indexOf(p) === -1) products.push(p);
                    });
                }
                inner = '<select class="form-input velo-lf-input" id="' + id + '" data-lf-key="produto" data-cascade="motivo">' +
                    buildOptions(products, val, 'Selecione o produto do atendimento') + '</select>';
                break;
            }
            case 'motivo':
                inner = '<select class="form-input velo-lf-input" id="' + id + '" data-lf-key="motivo" data-cascade="detalhe"' +
                    (data.produto ? '' : ' disabled') + '>' +
                    buildOptions(getMotivosForProduct(data.produto), val, data.produto ? 'Selecione o motivo' : 'Selecione o produto antes') +
                    '</select>';
                break;
            case 'detalhe':
                inner = '<select class="form-input velo-lf-input" id="' + id + '" data-lf-key="detalhe"' +
                    (data.motivo ? '' : ' disabled') + '>' +
                    buildOptions(getDetalhesForMotivo(data.produto, data.motivo), val, data.motivo ? 'Selecione o detalhe' : 'Selecione o motivo antes') +
                    '</select>';
                break;
            case 'responsavel':
                inner = '<input type="text" class="form-input velo-lf-input velo-lf-readonly" id="' + id + '" data-lf-key="responsavel" ' +
                    'value="' + escapeHtml(val || getCurrentAgentName()) + '" readonly>' +
                    '<span class="velo-lf-auto-tag"><i class="fas fa-user-shield"></i> Jornada</span>';
                break;
            case 'atribuido':
                inner = '<input type="text" class="form-input velo-lf-input velo-lf-readonly" id="' + id + '" data-lf-key="atribuido" ' +
                    'value="' + escapeHtml(getPhaseAssignee(ticket)) + '" readonly>' +
                    '<span class="velo-lf-auto-tag"><i class="fas fa-layer-group"></i> Fase: ' + escapeHtml(ticket.status || 'novo') + '</span>';
                break;
            default:
                inner = '<input type="text" class="form-input velo-lf-input" id="' + id + '" data-lf-key="' + key + '" value="' + escapeHtml(val) + '">';
        }

        return '<div class="velo-lf-field velo-lf-field--' + key + '" data-field="' + key + '">' +
            '<label for="' + id + '">' + escapeHtml(meta.label) + '</label>' + hint + inner + '</div>';
    }

    function renderTicketLateralFormHTML(ticket) {
        seedClientDB();
        const config = getConfig();
        const data = ensureLateralFormData(ticket);
        let classificacaoHtml = '';
        let advancedHtml = '';
        const basicFields = ['canal', 'classificacaoTipo', 'produto', 'motivo'];
        FIELD_ORDER.forEach(function (key) {
            if (key === 'cpf') return;
            const html = renderField(ticket, key, data, config);
            if (basicFields.indexOf(key) !== -1) classificacaoHtml += html;
            else advancedHtml += html;
        });

        const aiTabHtml = typeof window.renderVeloTabulationSuggestionHtml === 'function'
            ? window.renderVeloTabulationSuggestionHtml(ticket)
            : '';

        if (typeof window.renderRightPanelSections === 'function') {
            const rpBody = window.renderRightPanelSections(ticket, {
                classificacao:
                    '<div class="velo-lf-fields velo-lf-fields--classificacao">' + classificacaoHtml +
                    '<button type="button" class="velo-lf-toggle-advanced" onclick="this.nextElementSibling.classList.toggle(\'is-open\'); this.textContent = this.nextElementSibling.classList.contains(\'is-open\') ? \'Ocultar campos avançados\' : \'Mostrar campos avançados\'">Mostrar campos avançados</button>' +
                    '<div class="velo-lf-advanced">' + advancedHtml + '</div></div>',
                ia: aiTabHtml
            });

            return '<div class="velo-lateral-form-panel right-panel" data-ticket-id="' + ticket.id + '">' +
                rpBody +
                '<div class="velo-lf-actions">' +
                '<button type="button" class="btn-secondary btn-sm btn-ticket-whatsapp" onclick="openTicketWhatsApp(' + ticket.id + ')"><i class="fab fa-whatsapp"></i> Abrir conversa</button>' +
                '<button type="button" class="btn-primary velo-lf-save" data-ticket-id="' + ticket.id + '">' +
                '<i class="fas fa-save"></i> Salvar no ticket</button></div></div>';
        }

        const shortTitle = ticket.title && ticket.title.length > 28
            ? ticket.title.substring(0, 28) + '…'
            : (ticket.title || 'Sem título');

        const client = getClientFromTicket(ticket);
        const thermoHtml = client
            ? renderThermometer(client)
            : '<div class="velo-lf-thermo-empty"><i class="fas fa-temperature-half"></i> Informe o CPF para ver o termômetro</div>';

        return '<div class="velo-lateral-form-panel" data-ticket-id="' + ticket.id + '">' +
            '<div class="velo-lf-header">' +
            '<div class="velo-lf-header-text">' +
            '<h3><i class="fas fa-ticket-alt"></i> Formulário do ticket</h3>' +
            '<p class="velo-lf-ticket-ref">#' + ticket.id + ' · ' + escapeHtml(shortTitle) + '</p>' +
            '</div>' +
            '<span class="velo-lf-badge">Fixo</span></div>' +
            '<div class="velo-lf-thermo-wrap">' + thermoHtml + '</div>' +
            '<div class="velo-lf-fields">' + classificacaoHtml +
            '<button type="button" class="velo-lf-toggle-advanced" onclick="this.nextElementSibling.classList.toggle(\'is-open\'); this.textContent = this.nextElementSibling.classList.contains(\'is-open\') ? \'Ocultar campos avançados\' : \'Mostrar campos avançados\'">Mostrar campos avançados</button>' +
            '<div class="velo-lf-advanced">' + advancedHtml + '</div></div>' +
            aiTabHtml +
            '<div class="velo-lf-actions">' +
            '<button type="button" class="btn-secondary btn-sm btn-ticket-whatsapp" onclick="openTicketWhatsApp(' + ticket.id + ')"><i class="fab fa-whatsapp"></i> Abrir conversa</button>' +
            '<button type="button" class="btn-primary velo-lf-save" data-ticket-id="' + ticket.id + '">' +
            '<i class="fas fa-save"></i> Salvar no ticket</button></div></div>';
    }

    function refreshCascadeFields(panel, ticketId) {
        const ticket = getTicketById(ticketId);
        if (!ticket || !panel) return;
        const data = ensureLateralFormData(ticket);
        const prodEl = panel.querySelector('[data-lf-key="produto"]');
        const motEl = panel.querySelector('[data-lf-key="motivo"]');
        const detEl = panel.querySelector('[data-lf-key="detalhe"]');
        const produto = prodEl ? prodEl.value : data.produto;
        data.produto = produto;

        if (motEl) {
            motEl.disabled = !produto;
            motEl.innerHTML = buildOptions(getMotivosForProduct(produto), motEl.value, produto ? 'Selecione o motivo' : 'Selecione o produto antes');
            if (motEl.value && getMotivosForProduct(produto).indexOf(motEl.value) === -1) motEl.value = '';
        }
        const motivo = motEl ? motEl.value : '';
        if (detEl) {
            detEl.disabled = !motivo;
            detEl.innerHTML = buildOptions(getDetalhesForMotivo(produto, motivo), detEl.value, motivo ? 'Selecione o detalhe' : 'Selecione o motivo antes');
            if (detEl.value && getDetalhesForMotivo(produto, motivo).indexOf(detEl.value) === -1) detEl.value = '';
        }
    }

    function refreshDbPanel(panel, ticketId, cpf) {
        refreshThermoInPanel(panel, cpf);
        refreshCentralClientProfile(ticketId);

        const client = lookupClientByCpf(cpf);
        if (client && client.produtos && client.produtos.length) {
            const prodEl = panel.querySelector('[data-lf-key="produto"]');
            if (prodEl && !prodEl.value) {
                prodEl.value = client.produtos[0];
                refreshCascadeFields(panel, ticketId);
            }
        }
    }

    function lookupCpfFromPanel(panel, ticketId, showToast) {
        const cpfEl = panel.querySelector('[data-lf-key="cpf"]');
        if (!cpfEl) return;
        const cpf = normalizeCpf(cpfEl.value);
        cpfEl.value = formatCpf(cpf);
        refreshDbPanel(panel, ticketId, cpf);
        const client = lookupClientByCpf(cpf);
        if (showToast && typeof showNotification === 'function') {
            showNotification(client ? 'Cliente encontrado: ' + client.name : 'CPF não encontrado no DB demo.', client ? 'success' : 'warning');
        }
        persistLateralForm(ticketId, false);
    }

    function persistLateralForm(ticketId, showToast) {
        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"]');
        const ticket = getTicketById(ticketId);
        if (!panel || !ticket) return;

        const data = ensureLateralFormData(ticket);
        panel.querySelectorAll('.velo-lf-input:not([readonly])').forEach(function (el) {
            const key = el.getAttribute('data-lf-key');
            if (!key) return;
            data[key] = key === 'cpf' ? normalizeCpf(el.value) : el.value.trim();
        });

        data.canal = detectChannel(ticket);
        data.responsavel = data.responsavel || getCurrentAgentName();
        data.atribuido = getPhaseAssignee(ticket);
        data._canalLocked = true;

        ticket.lateralForm = data;
        ticket.clientCPF = formatCpf(data.cpf);
        ticket.channel = data.canal;
        ticket.responsibleAgent = data.responsavel;
        ticket.group = data.atribuido;
        ticket.attendanceGroup = data.atribuido;
        ticket.updatedAt = new Date().toISOString();

        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        for (const box of columns) {
            if (!box.tickets) continue;
            const idx = box.tickets.findIndex(function (t) { return t.id === ticketId; });
            if (idx !== -1) {
                box.tickets[idx] = Object.assign({}, box.tickets[idx], ticket);
                break;
            }
        }
        localStorage.setItem('kanbanColumns', JSON.stringify(columns));

        const tabInfo = window.openTicketTabs && window.openTicketTabs.get(ticketId);
        if (tabInfo) tabInfo.ticket = Object.assign({}, tabInfo.ticket, ticket);

        const atrEl = panel.querySelector('[data-lf-key="atribuido"]');
        if (atrEl) atrEl.value = data.atribuido;

        if (showToast !== false && typeof showNotification === 'function') {
            showNotification('Formulário do ticket #' + ticketId + ' salvo!', 'success');
        }
    }

    function bindFormEvents(ticketId) {
        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"]');
        if (!panel || panel.dataset.bound === '1') return;
        panel.dataset.bound = '1';

        panel.querySelector('.velo-lf-save')?.addEventListener('click', function () {
            persistLateralForm(ticketId, true);
        });

        panel.querySelector('.velo-lf-db-btn')?.addEventListener('click', function () {
            lookupCpfFromPanel(panel, ticketId, true);
        });

        const cpfEl = panel.querySelector('[data-lf-key="cpf"]');
        if (cpfEl) {
            cpfEl.addEventListener('blur', function () {
                cpfEl.value = formatCpf(cpfEl.value);
                if (normalizeCpf(cpfEl.value).length === 11) lookupCpfFromPanel(panel, ticketId, false);
            });
        }

        panel.querySelector('[data-lf-key="produto"]')?.addEventListener('change', function () {
            const motEl = panel.querySelector('[data-lf-key="motivo"]');
            const detEl = panel.querySelector('[data-lf-key="detalhe"]');
            if (motEl) motEl.value = '';
            if (detEl) detEl.value = '';
            refreshCascadeFields(panel, ticketId);
            persistLateralForm(ticketId, false);
        });

        panel.querySelector('[data-lf-key="motivo"]')?.addEventListener('change', function () {
            const detEl = panel.querySelector('[data-lf-key="detalhe"]');
            if (detEl) detEl.value = '';
            refreshCascadeFields(panel, ticketId);
            persistLateralForm(ticketId, false);
        });

        panel.querySelectorAll('.velo-lf-input').forEach(function (el) {
            if (el.readOnly || el.disabled) return;
            el.addEventListener('change', function () {
                persistLateralForm(ticketId, false);
            });
        });

        const cpfVal = panel.querySelector('[data-lf-key="cpf"]')?.value;
        if (normalizeCpf(cpfVal).length === 11) refreshDbPanel(panel, ticketId, cpfVal);
        bindDbPanelExtras(panel);
    }

    function saveActiveTicketFormBeforeSwitch() {
        const activeTab = document.querySelector('.ticket-tab-item.active');
        if (!activeTab) return;
        const tabId = activeTab.getAttribute('data-tab');
        const match = tabId && String(tabId).match(/^ticket-(\d+)$/);
        if (match) persistLateralForm(parseInt(match[1], 10), false);
    }

    function treeToSimpleText(tree) {
        const lines = [];
        Object.keys(tree || {}).forEach(function (product) {
            lines.push(product);
            const motivos = tree[product] || {};
            Object.keys(motivos).forEach(function (motivo) {
                const detalhes = (motivos[motivo] || []).join(', ');
                lines.push('  ' + motivo + (detalhes ? ': ' + detalhes : ''));
            });
            lines.push('');
        });
        return lines.join('\n').trim();
    }

    function simpleTextToTree(text) {
        const tree = {};
        let currentProduct = null;
        String(text || '').split('\n').forEach(function (line) {
            const trimmed = line.trim();
            if (!trimmed) return;

            const isIndented = /^\s+/.test(line);
            const motivoMatch = trimmed.match(/^(.+?):\s*(.+)$/);

            if (!isIndented && !motivoMatch) {
                currentProduct = trimmed;
                if (!tree[currentProduct]) tree[currentProduct] = {};
                return;
            }

            if (!isIndented && motivoMatch && !currentProduct) {
                currentProduct = motivoMatch[1].trim();
                tree[currentProduct] = tree[currentProduct] || {};
                motivoMatch[2].split(',').forEach(function (part) {
                    const name = part.trim();
                    if (name) tree[currentProduct][name] = tree[currentProduct][name] || [];
                });
                return;
            }

            if (!currentProduct) return;

            if (motivoMatch) {
                const motivo = motivoMatch[1].trim();
                const detalhes = motivoMatch[2].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                tree[currentProduct][motivo] = detalhes;
            } else {
                tree[currentProduct][trimmed] = [];
            }
        });
        return tree;
    }

    const PHASE_LABELS = {
        novo: 'Novo',
        'em-aberto': 'Em andamento',
        'em-espera': 'Em espera',
        pendente: 'Pendente',
        resolvido: 'Resolvido'
    };

    function phasesToSimpleText(phases) {
        return Object.keys(PHASE_LABELS).map(function (key) {
            return PHASE_LABELS[key] + ': ' + (phases[key] || '');
        }).join('\n');
    }

    function simpleTextToPhases(text) {
        const labelToKey = {};
        Object.keys(PHASE_LABELS).forEach(function (key) {
            labelToKey[PHASE_LABELS[key].toLowerCase()] = key;
        });
        const phases = Object.assign({}, DEFAULT_CONFIG.phaseAssignees);
        String(text || '').split('\n').forEach(function (line) {
            const trimmed = line.trim();
            if (!trimmed) return;
            const match = trimmed.match(/^([^:]+):\s*(.+)$/);
            if (!match) return;
            const label = match[1].trim().toLowerCase();
            const value = match[2].trim();
            const key = labelToKey[label] || match[1].trim();
            phases[key] = value;
        });
        return phases;
    }

    function renderConfigPanel() {
        const root = document.getElementById('lateralFormConfigRoot');
        if (!root) return;
        seedClientDB();
        const config = getConfig();

        let html = '<p class="velo-lf-config-intro">Edite os textos abaixo e clique em <strong>Salvar</strong>. Não é necessário JSON — use uma linha por item.</p>';

        html += '<div class="velo-lf-config-block"><h5>Classificação de tipo</h5>' +
            '<p class="velo-lf-config-hint">Uma opção por linha (aparece no campo manual do formulário).</p>' +
            '<textarea class="form-textarea velo-lf-cfg-classificacao" rows="5" placeholder="Reclamação&#10;Solicitação&#10;Informação">' +
            escapeHtml((config.classificacaoTipo.options || []).join('\n')) + '</textarea></div>';

        html += '<div class="velo-lf-config-block"><h5>Árvore Produto → Motivo → Detalhe</h5>' +
            '<p class="velo-lf-config-hint">Nome do <strong>produto</strong> em linha própria. Motivos com dois espaços no início; detalhes após <code>:</code>, separados por vírgula.</p>' +
            '<pre class="velo-lf-config-example">Internet Fibra\n  Lentidão: Aguardando técnico, Escalado N2\n  Instalação: Agendamento pendente\n\nTV\n  Canal indisponível: Decoder reiniciado, Escalado N2</pre>' +
            '<textarea class="form-textarea velo-lf-cfg-tree" rows="14" placeholder="Digite os produtos e motivos...">' +
            escapeHtml(treeToSimpleText(config.productTree)) + '</textarea></div>';

        html += '<div class="velo-lf-config-block"><h5>Atribuído por fase do ticket</h5>' +
            '<p class="velo-lf-config-hint">Uma linha por fase: <code>Nome da fase: responsável</code>. Use <em>Agente em atendimento</em> para o agente logado.</p>' +
            '<textarea class="form-textarea velo-lf-cfg-phases" rows="6" placeholder="Novo: Fila N1 — Triagem&#10;Em andamento: Agente em atendimento">' +
            escapeHtml(phasesToSimpleText(config.phaseAssignees)) + '</textarea></div>';

        html += '<div class="velo-lf-config-block velo-lf-config-block--compact"><h5>CPFs de teste (DB demo)</h5>' +
            '<ul class="velo-lf-db-demo-list">' +
            '<li><code>123.456.789-01</code> — Maria Oliveira</li>' +
            '<li><code>987.654.321-00</code> — João Pereira</li>' +
            '<li><code>111.222.333-44</code> — Empresa Tech Ltda</li></ul></div>';

        html += '<div class="velo-lf-config-actions">' +
            '<button type="button" class="btn-primary" id="veloLfSaveConfig" onclick="saveVelodeskLateralFormConfig(event)"><i class="fas fa-save"></i> Salvar configurações</button>' +
            '<button type="button" class="btn-secondary" id="veloLfResetConfig"><i class="fas fa-undo"></i> Restaurar padrão</button></div>';

        root.innerHTML = html;

        document.getElementById('veloLfSaveConfig')?.addEventListener('click', saveConfigFromUI);
        document.getElementById('veloLfResetConfig')?.addEventListener('click', function () {
            localStorage.removeItem(STORAGE_KEY);
            renderConfigPanel();
            applyLateralFormConfigToAllTickets();
            if (typeof showNotification === 'function') showNotification('Configurações restauradas ao padrão e aplicadas nos tickets.', 'info');
        });
    }

    function saveConfigFromUI(evt) {
        if (evt && evt.preventDefault) evt.preventDefault();
        if (evt && evt.stopPropagation) evt.stopPropagation();

        const config = getConfig();
        const classEl = document.querySelector('.velo-lf-cfg-classificacao');
        const treeEl = document.querySelector('.velo-lf-cfg-tree');
        const phaseEl = document.querySelector('.velo-lf-cfg-phases');

        if (classEl) {
            const options = classEl.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            config.classificacaoTipo.options = options.length
                ? options
                : DEFAULT_CONFIG.classificacaoTipo.options.slice();
        }

        if (treeEl) {
            const raw = treeEl.value.trim();
            if (raw) {
                const tree = simpleTextToTree(treeEl.value);
                if (!Object.keys(tree).length) {
                    if (typeof showNotification === 'function') {
                        showNotification('Não foi possível ler a árvore. Coloque cada produto em uma linha e os motivos abaixo (com 2 espaços ou após ":").', 'error');
                    }
                    return;
                }
                config.productTree = tree;
            }
        }

        if (phaseEl && phaseEl.value.trim()) {
            config.phaseAssignees = simpleTextToPhases(phaseEl.value);
        }

        saveConfig(config);
        const applied = applyLateralFormConfigToAllTickets();
        if (typeof showNotification === 'function') {
            const msg = applied.count
                ? 'Formulário salvo e aplicado em ' + applied.count + ' ticket(s)' +
                  (applied.refreshed ? ' (' + applied.refreshed + ' aberto(s) atualizado(s))' : '') + '!'
                : 'Formulário do ticket salvo!';
            showNotification(msg, 'success');
        }
    }

    function switchToLateralFormConfig() {
        document.querySelectorAll('.config-menu-item').forEach(function (item) { item.classList.remove('active'); });
        const activeItem = document.querySelector('#config .config-menu [data-config-tab="lateral-form"]');
        if (activeItem) {
            activeItem.classList.add('active');
            if (typeof updateConfigContentHeader === 'function') {
                updateConfigContentHeader(
                    activeItem.getAttribute('data-config-title') || 'Formulário do ticket',
                    activeItem.getAttribute('data-config-desc') || ''
                );
            }
        }
        document.querySelectorAll('#config .config-content > .config-tab-content').forEach(function (content) {
            content.classList.remove('active');
            content.setAttribute('aria-hidden', 'true');
        });
        const tab = document.getElementById('lateralFormTab');
        if (tab) {
            tab.classList.add('active');
            tab.setAttribute('aria-hidden', 'false');
        }
        renderConfigPanel();
    }

    function patchTicketHooks() {
        if (window.__veloLateralFormHooked) return;
        window.__veloLateralFormHooked = true;
        seedClientDB();

        const origSetup = window.setupTicketTabEvents;
        if (origSetup) {
            window.setupTicketTabEvents = function (ticketId) {
                origSetup(ticketId);
                bindFormEvents(parseInt(ticketId, 10));
            };
        }

        const origSwitch = window.switchTicketTab;
        if (origSwitch) {
            window.switchTicketTab = function (tabId) {
                saveActiveTicketFormBeforeSwitch();
                origSwitch(tabId);
            };
        }

        const origClose = window.closeTicketTab;
        if (origClose) {
            window.closeTicketTab = function (tabId) {
                const match = String(tabId).match(/^ticket-(\d+)$/);
                if (match) persistLateralForm(parseInt(match[1], 10), false);
                return origClose(tabId);
            };
        }

        const origStatus = window.changeTicketStatusFromTab;
        if (origStatus) {
            window.changeTicketStatusFromTab = function (ticketId, status) {
                const result = origStatus(ticketId, status);
                setTimeout(function () {
                    const ticket = getTicketById(parseInt(ticketId, 10));
                    if (ticket) {
                        ticket.status = status;
                        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"]');
                        if (panel) {
                            const atr = panel.querySelector('[data-lf-key="atribuido"]');
                            if (atr) atr.value = getPhaseAssignee(ticket);
                            const tag = panel.querySelector('.velo-lf-field--atribuido .velo-lf-auto-tag');
                            if (tag) tag.innerHTML = '<i class="fas fa-layer-group"></i> Fase: ' + escapeHtml(status);
                        }
                        persistLateralForm(parseInt(ticketId, 10), false);
                    }
                }, 200);
                return result;
            };
        }

        const origSwitchConfig = window.switchConfigTab;
        if (origSwitchConfig) {
            window.switchConfigTab = function (tabName) {
                if (tabName === 'lateral-form') {
                    switchToLateralFormConfig();
                    return;
                }
                return origSwitchConfig(tabName);
            };
        }
    }

    window.renderTicketLateralFormHTML = renderTicketLateralFormHTML;
    window.renderTicketClientProfileCentral = renderTicketClientProfileCentral;
    window.refreshCentralClientProfile = refreshCentralClientProfile;
    window.renderLateralFormConfigPanel = renderConfigPanel;
    window.saveVelodeskLateralFormConfig = saveConfigFromUI;
    window.applyLateralFormConfigToAllTickets = applyLateralFormConfigToAllTickets;
    window.bindTicketLateralFormEvents = bindFormEvents;
    window.refreshTicketLateralFormPanel = refreshTicketLateralFormPanel;
    window.lookupVelodeskClientByCpf = lookupClientByCpf;
    window.detectVelodeskTicketChannel = detectChannel;
    window.refreshTicketLateralFormCascade = function (ticketId) {
        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"]');
        if (panel) refreshCascadeFields(panel, parseInt(ticketId, 10));
    };
    window.persistTicketLateralForm = persistLateralForm;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchTicketHooks);
    } else {
        patchTicketHooks();
    }
})();
