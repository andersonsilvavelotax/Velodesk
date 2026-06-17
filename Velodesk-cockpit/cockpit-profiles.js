/**
 * Velodesk Cockpit — Experiência por perfil (Agente / Supervisor / Gestor)
 * RBAC de navegação + dashboards segmentados
 */
(function () {
    'use strict';
    if (!window.VELODESK_COCKPIT) return;

    var TEAM = [
        { name: 'Ana Silva', tickets: 14, sla: 98, tma: '3m 12s', csat: 9.2, online: true, paused: false, load: 92 },
        { name: 'Carlos Mendes', tickets: 7, sla: 94, tma: '4m 28s', csat: 8.4, online: true, paused: false, load: 48 },
        { name: 'Julia Costa', tickets: 11, sla: 91, tma: '5m 01s', csat: 7.8, online: true, paused: true, load: 71 },
        { name: 'Pedro Alves', tickets: 8, sla: 93, tma: '4m 05s', csat: 8.1, online: false, paused: false, load: 55 }
    ];

    var TOP_MOTIVES = [
        'Portabilidade PIX', 'Erro de Login', 'Pagamento não reconhecido', 'Conta bloqueada',
        'Cartão virtual', 'Cobrança indevida', 'Lentidão internet', 'Cancelamento',
        'Segunda via boleto', 'Upgrade de plano'
    ];

    function esc(s) {
        if (typeof window.escapeHtmlEcosystem === 'function') return window.escapeHtmlEcosystem(s);
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function getProfile() {
        return document.body.dataset.velodeskProfile || localStorage.getItem('velodeskProfile') || 'agent';
    }

    function getAgentName() {
        var u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return u.name || 'Agente';
    }

    function loadTickets() {
        var cols = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        var list = [];
        cols.forEach(function (c) {
            (c.tickets || []).forEach(function (t) { list.push(t); });
        });
        return list;
    }

    function getFilters() {
        try {
            return JSON.parse(localStorage.getItem('velodeskGlobalFilters') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveFilters(f) {
        localStorage.setItem('velodeskGlobalFilters', JSON.stringify(f));
    }

    function defaultFilters() {
        return {
            period: '7d',
            channel: '',
            team: '',
            supervisor: '',
            agent: '',
            category: '',
            priority: ''
        };
    }

    function trendHtml(delta, invert) {
        if (delta === 0) return '<span class="pf-kpi__trend pf-kpi__trend--flat" title="Estável vs período anterior">—</span>';
        var up = delta > 0;
        if (invert) up = !up;
        var cls = up ? 'pf-kpi__trend--up' : 'pf-kpi__trend--down';
        var arrow = delta > 0 ? '↑' : '↓';
        return '<span class="pf-kpi__trend ' + cls + '" title="vs período anterior">' + arrow + ' ' + Math.abs(delta) + '%</span>';
    }

    function kpiCard(val, label, delta, invert) {
        return '<div class="pf-kpi" title="' + esc(label) + '">' + trendHtml(delta || 0, invert) +
            '<strong>' + esc(String(val)) + '</strong><span>' + esc(label) + '</span></div>';
    }

    function renderFiltersBar(profile) {
        var f = Object.assign(defaultFilters(), getFilters());
        var periods = [
            { id: 'today', label: 'Hoje' },
            { id: 'yesterday', label: 'Ontem' },
            { id: '7d', label: '7 dias' },
            { id: '30d', label: '30 dias' },
            { id: 'month', label: 'Este mês' },
            { id: 'custom', label: 'Personalizado' }
        ];
        var chips = periods.map(function (p) {
            return '<button type="button" class="pf-filters__chip' + (f.period === p.id ? ' is-active' : '') +
                '" onclick="VelodeskProfileFilters.setPeriod(\'' + p.id + '\')">' + p.label + '</button>';
        }).join('');

        var extra = '';
        if (profile !== 'agent') {
            extra = '<select id="pfFilterChannel" onchange="VelodeskProfileFilters.set(\'channel\',this.value)">' +
                '<option value="">Canal: Todos</option><option>WhatsApp</option><option>Email</option><option>Portal</option><option>API</option></select>' +
                '<select id="pfFilterTeam" onchange="VelodeskProfileFilters.set(\'team\',this.value)">' +
                '<option value="">Equipe: Todas</option><option>Financeiro</option><option>Suporte</option><option>Comercial</option></select>';
        }
        if (profile === 'management') {
            extra += '<select id="pfFilterSupervisor" onchange="VelodeskProfileFilters.set(\'supervisor\',this.value)">' +
                '<option value="">Supervisor: Todos</option><option>João Silva</option><option>Maria Costa</option></select>';
        }

        return '<div class="pf-filters" id="pfGlobalFilters">' +
            '<span class="pf-filters__label"><i class="fas fa-filter"></i> Período</span>' + chips +
            extra +
            '<button type="button" class="pf-filters__apply" onclick="VelodeskProfileFilters.apply()"><i class="fas fa-sync"></i> Aplicar</button>' +
            '</div>';
    }

    window.VelodeskProfileFilters = {
        setPeriod: function (p) {
            var f = Object.assign(defaultFilters(), getFilters());
            f.period = p;
            saveFilters(f);
            document.querySelectorAll('.pf-filters__chip').forEach(function (el) {
                el.classList.toggle('is-active', el.textContent.trim().indexOf(
                    { today: 'Hoje', yesterday: 'Ontem', '7d': '7 dias', '30d': '30 dias', month: 'Este mês', custom: 'Personalizado' }[p]
                ) === 0);
            });
        },
        set: function (key, val) {
            var f = Object.assign(defaultFilters(), getFilters());
            f[key] = val;
            saveFilters(f);
        },
        apply: function () {
            if (typeof renderWorkspace360 === 'function') renderWorkspace360();
            if (typeof showNotification === 'function') showNotification('Filtros aplicados.', 'info');
        }
    };

    function filterAgentTickets(tickets) {
        var name = getAgentName();
        return tickets.filter(function (t) {
            var resp = t.assignedTo || t.responsavel || '';
            return !resp || resp === name || resp.indexOf(name.split(' ')[0]) !== -1;
        });
    }

    /* ─── AGENTE ─── */
    window.renderAgentProfileDashboard = function () {
        var tickets = filterAgentTickets(loadTickets());
        var name = getAgentName();
        var assigned = tickets.filter(function (t) { return t.status === 'em-aberto' || t.assignedTo; }).length;
        var pending = tickets.filter(function (t) { return t.status === 'pendente' || t.status === 'em-espera' || t.status === 'novo'; }).length;
        var resolved = tickets.filter(function (t) { return t.status === 'resolvido'; }).length;

        var tableRows = tickets.slice(0, 12).map(function (t) {
            var pri = t.priority || 'normal';
            var sla = t.slaRemaining != null ? t.slaRemaining + ' min' : '—';
            return '<tr onclick="typeof openTicket===\'function\'&&openTicket(' + t.id + ')" style="cursor:pointer">' +
                '<td>#' + t.id + '</td>' +
                '<td>' + esc((t.title || '').substring(0, 40)) + '</td>' +
                '<td><span class="ws-queue-priority ws-queue-priority--' + pri + '">' + esc(pri) + '</span></td>' +
                '<td>—</td><td>' + sla + '</td></tr>';
        }).join('');

        if (!tableRows) {
            tableRows = '<tr><td colspan="5"><div class="pf-empty"><i class="fas fa-inbox"></i>Nenhum ticket encontrado para este período.</div></td></tr>';
        }

        return '<div class="pf-dash pf-dash--agent">' +
            '<header class="pf-dash__head"><h2>Dashboard — ' + esc(name.split(' ')[0]) + '</h2>' +
            '<p>Foco em atendimento · apenas seus tickets</p></header>' +
            renderFiltersBar('agent') +
            '<div class="pf-kpi-grid">' +
            kpiCard(assigned, 'Tickets atribuídos', 5) +
            kpiCard(pending, 'Tickets pendentes', -2, true) +
            kpiCard(resolved || 3, 'Resolvidos hoje', 12) +
            kpiCard('4m 18s', 'Tempo médio (TMA)', -8, true) +
            kpiCard('96%', 'SLA pessoal', 2) +
            kpiCard('8/12', 'Meta diária', 0) +
            '</div>' +
            '<section class="pf-section"><h3><i class="fas fa-list-check"></i> Minha operação</h3>' +
            '<div class="pf-table-wrap"><table class="pf-table" id="pfAgentTable">' +
            '<thead><tr><th>Ticket</th><th>Assunto</th><th>Prioridade</th><th>Tempo em fila</th><th>SLA restante</th></tr></thead>' +
            '<tbody>' + tableRows + '</tbody></table></div>' +
            '<button type="button" class="pf-agent-link" onclick="navigateToPage(\'tickets\')"><i class="fas fa-arrow-right"></i> Ver todos os tickets</button>' +
            '</section>' +
            '<section class="pf-section"><h3><i class="fas fa-chart-line"></i> Produtividade — últimos 7 dias</h3>' +
            '<div class="pf-chart-box"><canvas id="pfAgentChart"></canvas></div></section>' +
            '</div>';
    };

    /* ─── SUPERVISOR ─── */
    function computeOpHealth(slaPct) {
        if (slaPct > 95) return { level: 'ok', label: 'Operação saudável — SLA acima de 95%' };
        if (slaPct >= 85) return { level: 'warn', label: 'Operação em atenção — SLA entre 85% e 95%' };
        return { level: 'critical', label: 'Operação crítica — SLA abaixo de 85%' };
    }

    window.renderSupervisorProfileDashboard = function () {
        var tickets = loadTickets();
        var inQueue = tickets.length;
        var unassigned = tickets.filter(function (t) { return !t.assignedTo && !t.responsavel; }).length;
        var slaRisk = tickets.filter(function (t) {
            var p = t.priority || '';
            return p === 'alta' || p === 'high' || p === 'critica' || p === 'critical';
        }).length;
        var slaAvg = 91;
        var health = computeOpHealth(slaAvg);
        var online = TEAM.filter(function (a) { return a.online; }).length;
        var paused = TEAM.filter(function (a) { return a.paused; }).length;

        var teamRows = TEAM.map(function (a) {
            return '<tr><td>' + esc(a.name) + (a.paused ? ' <span title="Pausado">⏸</span>' : '') + '</td>' +
                '<td>' + a.tickets + '</td><td>' + a.sla + '%</td><td>' + esc(a.tma) + '</td><td>' + a.csat + '</td></tr>';
        }).join('');

        var alerts = [
            { type: 'warn', text: '3 tickets sem interação há mais de 24h' },
            { type: 'critical', text: slaRisk + ' tickets prestes a estourar SLA' },
            { type: 'info', text: '2 clientes reincidentes na fila' },
            { type: 'warn', text: 'Pico de fila previsto às 16h' }
        ].map(function (a) {
            return '<li class="pf-alerts li--' + a.type + ' pf-alerts li--' + a.type + '"><i class="fas fa-circle-exclamation"></i> ' + esc(a.text) + '</li>';
        }).join('').replace(/pf-alerts li--/g, 'pf-alerts li--');

        return '<div class="pf-dash pf-dash--supervisor">' +
            '<header class="pf-dash__head"><h2>Supervisão operacional</h2>' +
            '<p>Equipe, SLA e distribuição · dados da sua operação</p></header>' +
            renderFiltersBar('supervisor') +
            '<div class="pf-super-actions">' +
            '<button type="button" class="pf-super-actions__primary" onclick="typeof supervisorQuickAction===\'function\'&&supervisorQuickAction(\'redistribute\')"><i class="fas fa-shuffle"></i> Redistribuir</button>' +
            '<button type="button" onclick="navigateToPage(\'tickets\')"><i class="fas fa-sort"></i> Alterar prioridades</button>' +
            '<button type="button" onclick="navigateToPage(\'tickets\')"><i class="fas fa-rotate-left"></i> Reabrir ticket</button>' +
            '<button type="button" onclick="navigateToPage(\'tickets\')"><i class="fas fa-hand"></i> Assumir ticket</button>' +
            '</div>' +
            '<div class="pf-kpi-grid">' +
            kpiCard(inQueue, 'Tickets na fila', 8) +
            kpiCard(unassigned, 'Sem responsável', 3) +
            kpiCard(slaRisk, 'SLA em risco', 12) +
            kpiCard(2, 'SLA estourado', -1, true) +
            kpiCard(online, 'Agentes online', 0) +
            kpiCard(paused, 'Agentes pausados', 1) +
            '</div>' +
            '<div class="pf-health pf-health--' + health.level + '">' +
            '<span class="pf-health__dot"></span><span>' + esc(health.label) + '</span></div>' +
            '<section class="pf-section"><h3><i class="fas fa-users"></i> Desempenho da equipe</h3>' +
            '<input type="search" class="pf-table__search" placeholder="Buscar agente…" oninput="VelodeskProfileTable.filter(this,\'pfSuperTable\')">' +
            '<div class="pf-table-wrap"><table class="pf-table" id="pfSuperTable">' +
            '<thead><tr><th onclick="VelodeskProfileTable.sort(\'pfSuperTable\',0)">Agente</th><th onclick="VelodeskProfileTable.sort(\'pfSuperTable\',1)">Tickets</th>' +
            '<th onclick="VelodeskProfileTable.sort(\'pfSuperTable\',2)">SLA</th><th>TMA</th><th onclick="VelodeskProfileTable.sort(\'pfSuperTable\',4)">CSAT</th></tr></thead>' +
            '<tbody>' + teamRows + '</tbody></table></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-bell"></i> Alertas automáticos</h3><ul class="pf-alerts">' +
            '<li class="pf-alerts li--warn"><i class="fas fa-clock"></i> 3 tickets sem interação há mais de 24h</li>' +
            '<li class="pf-alerts li--critical"><i class="fas fa-fire"></i> ' + slaRisk + ' tickets prestes a estourar SLA</li>' +
            '<li class="pf-alerts li--info"><i class="fas fa-redo"></i> 2 clientes reincidentes na fila</li>' +
            '<li class="pf-alerts li--warn"><i class="fas fa-chart-line"></i> Pico de fila previsto às 16h</li>' +
            '</ul></section>' +
            '<div class="pf-charts-row">' +
            '<section class="pf-section"><h3><i class="fas fa-hashtag"></i> Por canal</h3><div class="pf-chart-box"><canvas id="pfSuperChannelChart"></canvas></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-layer-group"></i> Por prioridade</h3><div class="pf-chart-box"><canvas id="pfSuperPriChart"></canvas></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-tags"></i> Top categorias</h3><div class="pf-chart-box"><canvas id="pfSuperCatChart"></canvas></div></section>' +
            '</div></div>';
    };

    /* ─── GESTOR ─── */
    var AI_SUMMARIES = {
        daily: 'Hoje houve aumento de 18% nos tickets relacionados à Portabilidade PIX. O SLA caiu 4% em relação ao dia anterior. A equipe Financeiro concentra 42% do backlog total. O supervisor João apresenta o melhor índice de resolução do período.',
        weekly: 'Na semana, entradas superaram resoluções em 6%. SLA médio ficou em 93,2% (meta 95%). CSAT estável em 4,6. Canal WhatsApp respondeu por 58% do volume. Recomenda-se reforço no turno da tarde.',
        monthly: 'No mês, volume cresceu 14% vs mês anterior. Top motivo: Portabilidade PIX (22%). Backlog aging acima de 7 dias reduziu 8%. Equipe Suporte lidera CSAT; Financeiro concentra maior backlog.'
    };

    window.renderGestorProfileDashboard = function () {
        var slaGlobal = 93;
        var health = computeOpHealth(slaGlobal);
        health.label = slaGlobal > 95 ? 'Saúde global: operação saudável' :
            slaGlobal >= 85 ? 'Saúde global: operação em atenção' : 'Saúde global: operação crítica';

        var supRows = [
            { name: 'João Silva', sla: 96, csat: 4.8, backlog: 12, prod: 94 },
            { name: 'Maria Costa', sla: 92, csat: 4.5, backlog: 18, prod: 88 },
            { name: 'Pedro Almeida', sla: 89, csat: 4.3, backlog: 24, prod: 82 }
        ].map(function (s) {
            return '<tr><td>' + esc(s.name) + '</td><td>' + s.sla + '%</td><td>' + s.csat + '</td><td>' + s.backlog + '</td><td>' + s.prod + '%</td></tr>';
        }).join('');

        var teamRows = [
            { name: 'Financeiro', tickets: 142, sla: 88, csat: 4.2 },
            { name: 'Suporte', tickets: 98, sla: 95, csat: 4.7 },
            { name: 'Comercial', tickets: 56, sla: 91, csat: 4.5 }
        ].map(function (t) {
            return '<tr><td>' + esc(t.name) + '</td><td>' + t.tickets + '</td><td>' + t.sla + '%</td><td>' + t.csat + '</td></tr>';
        }).join('');

        var motiveRows = TOP_MOTIVES.map(function (m, i) {
            return '<tr><td>' + (i + 1) + '</td><td>' + esc(m) + '</td><td>' + (120 - i * 9) + '</td></tr>';
        }).join('');

        return '<div class="pf-dash pf-dash--gestor">' +
            '<header class="pf-dash__head"><h2>Dashboard executivo</h2>' +
            '<p>Visão estratégica · sem tickets individuais</p></header>' +
            renderFiltersBar('management') +
            '<div class="pf-health pf-health--' + health.level + '">' +
            '<span class="pf-health__dot"></span><span>' + esc(health.label) + ' · CSAT 86% · Backlog controlado</span></div>' +
            '<div class="pf-ai-widget" id="pfAiWidget">' +
            '<h3><i class="fas fa-brain"></i> Resumo inteligente da operação</h3>' +
            '<p id="pfAiSummaryText">' + esc(AI_SUMMARIES.daily) + '</p>' +
            '<div class="pf-ai-widget__tabs">' +
            '<button type="button" class="pf-ai-widget__tab is-active" onclick="VelodeskProfileAI.show(\'daily\',this)">Diário</button>' +
            '<button type="button" class="pf-ai-widget__tab" onclick="VelodeskProfileAI.show(\'weekly\',this)">Semanal</button>' +
            '<button type="button" class="pf-ai-widget__tab" onclick="VelodeskProfileAI.show(\'monthly\',this)">Mensal</button>' +
            '</div></div>' +
            '<div class="pf-kpi-grid">' +
            kpiCard(847, 'Tickets recebidos', 14) +
            kpiCard(712, 'Tickets resolvidos', 11) +
            kpiCard(slaGlobal + '%', 'SLA geral', -4, true) +
            kpiCard('4.6', 'CSAT', 2) +
            kpiCard(135, 'Backlog total', 6) +
            kpiCard('84%', 'Taxa de resolução', 3) +
            '</div>' +
            '<div class="pf-charts-row">' +
            '<section class="pf-section"><h3><i class="fas fa-chart-area"></i> Evolução de tickets</h3>' +
            '<select onchange="VelodeskProfileCharts.setPeriod(this.value)" style="font-size:0.75rem;margin-bottom:0.5rem">' +
            '<option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select>' +
            '<div class="pf-chart-box"><canvas id="pfGestorVolChart"></canvas></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-percentage"></i> Evolução do SLA</h3>' +
            '<div class="pf-chart-box"><canvas id="pfGestorSlaChart"></canvas></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-smile"></i> Evolução do CSAT</h3>' +
            '<div class="pf-chart-box"><canvas id="pfGestorCsatChart"></canvas></div></section>' +
            '</div>' +
            '<div class="pf-charts-row">' +
            '<section class="pf-section"><h3><i class="fas fa-user-tie"></i> Ranking de supervisores</h3>' +
            '<div class="pf-table-wrap"><table class="pf-table"><thead><tr><th>Supervisor</th><th>SLA</th><th>CSAT</th><th>Backlog</th><th>Produtividade</th></tr></thead>' +
            '<tbody>' + supRows + '</tbody></table></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-people-group"></i> Ranking de equipes</h3>' +
            '<div class="pf-table-wrap"><table class="pf-table"><thead><tr><th>Equipe</th><th>Tickets</th><th>SLA</th><th>CSAT</th></tr></thead>' +
            '<tbody>' + teamRows + '</tbody></table></div></section>' +
            '</div>' +
            '<section class="pf-section"><h3><i class="fas fa-ranking-star"></i> Top 10 motivos de abertura</h3>' +
            '<div class="pf-table-wrap"><table class="pf-table"><thead><tr><th>#</th><th>Motivo</th><th>Volume</th></tr></thead>' +
            '<tbody>' + motiveRows + '</tbody></table></div></section>' +
            '<section class="pf-section"><h3><i class="fas fa-hourglass-half"></i> Backlog aging</h3>' +
            '<p style="font-size:0.8rem;color:#64748b;margin:0 0 0.5rem">Distribuição por tempo parado na fila</p>' +
            '<div class="pf-backlog-bar">' +
            '<span style="width:35%;background:#1634FF" title="0-24h">0-24h</span>' +
            '<span style="width:25%;background:#1694FF" title="1-3d">1-3d</span>' +
            '<span style="width:18%;background:#6366f1" title="4-7d">4-7d</span>' +
            '<span style="width:12%;background:#D97706" title="8-15d">8-15d</span>' +
            '<span style="width:10%;background:#D92D20" title="15+d">15+d</span>' +
            '</div><div class="pf-chart-box" style="margin-top:1rem"><canvas id="pfGestorAgingChart"></canvas></div></section>' +
            '</div>';
    };

    window.VelodeskProfileAI = {
        show: function (key, btn) {
            document.getElementById('pfAiSummaryText').textContent = AI_SUMMARIES[key] || AI_SUMMARIES.daily;
            document.querySelectorAll('.pf-ai-widget__tab').forEach(function (b) { b.classList.remove('is-active'); });
            if (btn) btn.classList.add('is-active');
        }
    };

    window.VelodeskProfileTable = {
        filter: function (input, tableId) {
            var q = input.value.toLowerCase();
            document.querySelectorAll('#' + tableId + ' tbody tr').forEach(function (tr) {
                tr.style.display = tr.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
            });
        },
        sort: function (tableId, col) {
            var table = document.getElementById(tableId);
            if (!table) return;
            var tbody = table.querySelector('tbody');
            var rows = Array.from(tbody.querySelectorAll('tr'));
            var asc = table.dataset.sortCol == col ? table.dataset.sortAsc !== 'true' : true;
            table.dataset.sortCol = col;
            table.dataset.sortAsc = asc;
            rows.sort(function (a, b) {
                var av = a.cells[col].textContent.trim();
                var bv = b.cells[col].textContent.trim();
                var an = parseFloat(av), bn = parseFloat(bv);
                if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
                return asc ? av.localeCompare(bv) : bv.localeCompare(av);
            });
            rows.forEach(function (r) { tbody.appendChild(r); });
        }
    };

    window.VelodeskProfileCharts = {
        _instances: {},
        setPeriod: function () {
            if (typeof renderWorkspace360 === 'function') renderWorkspace360();
        },
        destroy: function () {
            Object.keys(this._instances).forEach(function (k) {
                if (VelodeskProfileCharts._instances[k]) VelodeskProfileCharts._instances[k].destroy();
            });
            this._instances = {};
        },
        bar: function (id, labels, data, color) {
            if (typeof Chart === 'undefined') return;
            var el = document.getElementById(id);
            if (!el) return;
            if (this._instances[id]) this._instances[id].destroy();
            this._instances[id] = new Chart(el.getContext('2d'), {
                type: 'bar',
                data: { labels: labels, datasets: [{ data: data, backgroundColor: color || '#1634FF', borderRadius: 6 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        },
        line: function (id, labels, datasets) {
            if (typeof Chart === 'undefined') return;
            var el = document.getElementById(id);
            if (!el) return;
            if (this._instances[id]) this._instances[id].destroy();
            this._instances[id] = new Chart(el.getContext('2d'), {
                type: 'line',
                data: { labels: labels, datasets: datasets },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
            });
        },
        doughnut: function (id, labels, data) {
            if (typeof Chart === 'undefined') return;
            var el = document.getElementById(id);
            if (!el) return;
            if (this._instances[id]) this._instances[id].destroy();
            this._instances[id] = new Chart(el.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{ data: data, backgroundColor: ['#1634FF', '#1694FF', '#000058', '#0D7A28', '#D97706'] }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        },
        initForProfile: function (profile) {
            this.destroy();
            if (profile === 'agent') {
                this.bar('pfAgentChart', ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], [6, 8, 7, 9, 8, 3, 0], '#1634FF');
            } else if (profile === 'supervisor') {
                this.doughnut('pfSuperChannelChart', ['WhatsApp', 'Email', 'Portal', 'API'], [58, 22, 12, 8]);
                this.doughnut('pfSuperPriChart', ['Baixa', 'Normal', 'Alta', 'Crítica'], [20, 45, 25, 10]);
                this.bar('pfSuperCatChart', TOP_MOTIVES.slice(0, 5), [45, 38, 32, 28, 22], '#000058');
            } else if (profile === 'management') {
                var days = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
                this.line('pfGestorVolChart', days, [
                    { label: 'Entradas', data: [120, 132, 118, 145, 138, 98, 87], borderColor: '#1634FF', tension: 0.35 },
                    { label: 'Resoluções', data: [110, 125, 115, 130, 132, 95, 90], borderColor: '#0D7A28', tension: 0.35 }
                ]);
                this.line('pfGestorSlaChart', days, [
                    { label: 'Meta', data: [95, 95, 95, 95, 95, 95, 95], borderColor: '#64748b', borderDash: [4, 4], tension: 0 },
                    { label: 'Resultado', data: [96, 94, 93, 91, 92, 94, 93], borderColor: '#1634FF', tension: 0.35 }
                ]);
                this.line('pfGestorCsatChart', ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], [
                    { label: 'CSAT', data: [4.2, 4.3, 4.5, 4.4, 4.6, 4.6], borderColor: '#1694FF', tension: 0.35, fill: true, backgroundColor: 'rgba(22,148,255,0.08)' }
                ]);
                this.bar('pfGestorAgingChart', ['0-24h', '1-3d', '4-7d', '8-15d', '15+d'], [47, 34, 24, 18, 12], '#1634FF');
            }
        }
    };

    /* ─── RBAC (complemento ao applyProfileUI do ecosystem) ─── */
    window.applyProfileRBAC = function () {
        document.body.dataset.velodeskProfile = getProfile();
    };

    /* ─── Hook renderWorkspace360 ─── */
    function hookRender() {
        if (typeof window.renderWorkspace360 !== 'function') return;
        var orig = window.renderWorkspace360;
        window.renderWorkspace360 = function () {
            var el = document.getElementById('workspace360Content');
            if (!el) return;
            var profile = getProfile();
            el.className = 'eco-page-inner eco-stagger';

            if (profile === 'agent' && typeof window.renderAgentProfileDashboard === 'function') {
                el.innerHTML = window.renderAgentProfileDashboard();
                setTimeout(function () { VelodeskProfileCharts.initForProfile('agent'); }, 200);
                return;
            }
            if (profile === 'supervisor' && typeof window.renderSupervisorProfileDashboard === 'function') {
                el.innerHTML = window.renderSupervisorProfileDashboard();
                setTimeout(function () {
                    VelodeskProfileCharts.initForProfile('supervisor');
                    if (typeof window.startSupervisorLiveRefresh === 'function') window.startSupervisorLiveRefresh();
                    if (typeof window.startPeakCountdown === 'function') window.startPeakCountdown();
                }, 200);
                return;
            }
            if (profile === 'management' && typeof window.renderGestorProfileDashboard === 'function') {
                el.innerHTML = window.renderGestorProfileDashboard();
                setTimeout(function () { VelodeskProfileCharts.initForProfile('management'); }, 200);
                return;
            }
            orig();
        };
    }

    function hookApplyProfileUI() {
        hookRender();
        var ws = document.getElementById('workspace');
        if (ws && ws.classList.contains('active') && typeof window.renderWorkspace360 === 'function') {
            window.renderWorkspace360();
        }
        if (document.readyState !== 'loading') applyProfileRBAC();
        else document.addEventListener('DOMContentLoaded', applyProfileRBAC);
    }

    hookApplyProfileUI();
})();
