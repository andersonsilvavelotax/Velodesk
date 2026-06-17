/**
 * Velodesk Cockpit — Customer Intelligence, Health Score, CRM, Omnichannel, Automações
 */
(function () {
    'use strict';

    if (!window.VELODESK_COCKPIT) return;

    function normalizeCpf(v) {
        return String(v || '').replace(/\D/g, '');
    }

    function getClientFromTicket(ticket) {
        const db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
        const cpf = normalizeCpf((ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF);
        return cpf ? db[cpf] : null;
    }

    function countClientTickets(cpf) {
        if (!cpf) return 0;
        const cols = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let n = 0;
        const cutoff = Date.now() - 30 * 86400000;
        cols.forEach(function (col) {
            (col.tickets || []).forEach(function (t) {
                const tc = normalizeCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
                if (tc === cpf && (t.createdAt || 0) >= cutoff) n++;
            });
        });
        return n || (3 + (cpf.charCodeAt(0) % 5));
    }

    window.computeClientHealthScore = function (client, ticket, enriched) {
        if (!client && !ticket) return { score: 50, level: 'medium', label: 'Sem dados' };
        let score = 100;
        const thermo = (enriched && enriched.thermoScore) || client.termometro || 50;
        const tickets30 = countClientTickets(normalizeCpf(client.cpf || (ticket && ticket.clientCPF)));
        if (thermo >= 75) score -= 35;
        else if (thermo >= 55) score -= 18;
        if (tickets30 >= 5) score -= 20;
        else if (tickets30 >= 3) score -= 10;
        if (enriched && enriched.slaCritical) score -= 15;
        if (client.situacao && String(client.situacao).toLowerCase().indexOf('inadimpl') !== -1) score -= 12;
        if (client.risco && String(client.risco).toLowerCase().indexOf('alto') !== -1) score -= 20;
        score = Math.max(8, Math.min(100, score));
        let level = 'good';
        let label = 'Relacionamento saudável';
        if (score < 45) { level = 'danger'; label = 'Risco alto de cancelamento'; }
        else if (score < 65) { level = 'warn'; label = 'Atenção — relacionamento em queda'; }
        return { score: score, level: level, label: label, tickets30: tickets30 };
    };

    window.buildClientIntelligence = function (ticket, enriched) {
        const client = getClientFromTicket(ticket) || {};
        const cpf = normalizeCpf(client.cpf || (ticket && ticket.clientCPF));
        const health = window.computeClientHealthScore(client, ticket, enriched);
        const channels = client.canais || ['WhatsApp', 'Email', 'Chat'];
        if (ticket && ticket.channel && channels.indexOf(ticket.channel) === -1) {
            channels.push(ticket.channel);
        }
        const sentiment = (enriched && enriched.thermoScore >= 75) ? 'Frustrado' :
            (enriched && enriched.thermoScore >= 55) ? 'Impaciente' : 'Neutro';
        return {
            name: client.name || ticket.clientName || ticket.solicitante || 'Cliente',
            cpf: cpf,
            tenure: client.clienteDesde || '2 anos',
            tickets30: health.tickets30,
            sentiment: sentiment,
            risk: client.risco || (health.level === 'danger' ? 'ALTO' : health.level === 'warn' ? 'MÉDIO' : 'BAIXO'),
            health: health,
            channels: channels.slice(0, 5),
            avgResponse: client.tmaMedio || '4m 12s',
            lastRating: client.ultimaAvaliacao || (health.level === 'danger' ? 'Negativa (NPS 4)' : 'Neutra (NPS 7)'),
            recurrence: health.tickets30 >= 3 ? 'Alta recorrência (' + health.tickets30 + ' tickets/30d)' : 'Recorrência normal',
            premium: !!(client.premium || client.plano === 'premium' || (client.name && client.name.indexOf('Tech') !== -1))
        };
    };

    window.renderCustomerIntelligenceHtml = function (intel, ticketId) {
        if (!intel) return '';
        const h = intel.health;
        const tid = ticketId || '';
        const retentionBtn = h.level === 'danger' || h.level === 'warn'
            ? '<button type="button" class="btn-primary btn-sm" onclick="startRetentionFlow(' + tid + ')"><i class="fas fa-shield-heart"></i> Iniciar retenção</button>'
            : '';
        return '<section class="ws-cintel ws-panel ws-panel--level-3">' +
            '<div class="ws-cintel__head"><h4><i class="fas fa-user-circle"></i> Customer Intelligence</h4>' +
            '<span class="ws-cintel__premium' + (intel.premium ? ' ws-cintel__premium--yes' : '') + '">' +
            (intel.premium ? 'Premium' : 'Standard') + '</span></div>' +
            '<div class="ws-cintel__hero">' +
            '<strong>' + escapeHtmlEcosystem(intel.name) + '</strong>' +
            '<span>Cliente há ' + escapeHtmlEcosystem(intel.tenure) + '</span></div>' +
            '<div class="ws-health-score ws-health-score--' + h.level + '">' +
            '<div class="ws-health-score__num">' + h.score + '<small>/100</small></div>' +
            '<div class="ws-health-score__meta"><strong>Health Score</strong><span>⚠️ ' + escapeHtmlEcosystem(h.label) + '</span></div></div>' +
            '<ul class="ws-cintel__stats">' +
            '<li><strong>' + intel.tickets30 + '</strong><span>Tickets (30d)</span></li>' +
            '<li><strong>' + escapeHtmlEcosystem(intel.sentiment) + '</strong><span>Sentimento</span></li>' +
            '<li><strong>' + escapeHtmlEcosystem(intel.risk) + '</strong><span>Risco churn</span></li>' +
            '<li><strong>' + escapeHtmlEcosystem(intel.avgResponse) + '</strong><span>TMA médio</span></li>' +
            '</ul>' +
            '<div class="ws-cintel__row"><span class="ws-cintel__label">Última avaliação</span><span>' + escapeHtmlEcosystem(intel.lastRating) + '</span></div>' +
            '<div class="ws-cintel__row"><span class="ws-cintel__label">Recorrência</span><span>' + escapeHtmlEcosystem(intel.recurrence) + '</span></div>' +
            '<div class="ws-cintel__channels">' + intel.channels.map(function (ch) {
                return '<span class="ws-channel-pill ws-channel-pill--sm"><i class="fas fa-hashtag"></i> ' + escapeHtmlEcosystem(ch) + '</span>';
            }).join('') + '</div>' +
            '<div class="ws-cintel__actions">' +
            '<button type="button" class="btn-secondary btn-sm" onclick="openClientHistory(' + tid + ')"><i class="fas fa-history"></i> Ver histórico</button>' +
            retentionBtn +
            '</div></section>';
    };

    window.renderOmnichannelTimelineHtml = function (intel, ticketId) {
        if (!intel) return '';
        const tid = ticketId || 4512;
        const events = [
            { ch: 'WhatsApp', time: '09:12', text: 'Cliente perguntou sobre fatura', ticketId: tid },
            { ch: 'Email', time: '09:28', text: 'Reclamação formal enviada', ticketId: tid },
            { ch: 'Chat', time: '09:41', text: 'Agente respondeu parcialmente', ticketId: tid },
            { ch: 'WhatsApp', time: '10:01', text: 'Cliente insistiu no bloqueio', ticketId: tid }
        ];
        return '<section class="ws-omni ws-panel ws-panel--level-3">' +
            '<h4><i class="fas fa-layer-group"></i> Omnichannel — ' + escapeHtmlEcosystem(intel.name) + '</h4>' +
            '<p class="ws-panel-hint">Timeline unificada · clique para abrir</p>' +
            '<ul class="ws-omni__list">' + events.map(function (ev) {
                return '<li class="ws-omni__item--clickable" onclick="deskQuickAction(' + ev.ticketId + ',\'open\')">' +
                    '<span class="ws-omni__ch">' + escapeHtmlEcosystem(ev.ch) + '</span>' +
                    '<span class="ws-omni__time">' + ev.time + '</span>' +
                    '<span class="ws-omni__text">' + escapeHtmlEcosystem(ev.text) + '</span></li>';
            }).join('') + '</ul></section>';
    };

    window.renderCrmPipelineHtml = function (collapsed) {
        var isCollapsed = collapsed !== false && localStorage.getItem('velodeskCrmCollapsed') !== '0';
        const stages = [
            { id: 'lead', label: 'Lead', count: 12, pct: 18 },
            { id: 'qual', label: 'Qualificação', count: 8, pct: 32 },
            { id: 'prop', label: 'Proposta', count: 5, pct: 48 },
            { id: 'neg', label: 'Negociação', count: 3, pct: 62 },
            { id: 'cli', label: 'Cliente', count: 142, pct: 78 },
            { id: 'ret', label: 'Retenção', count: 28, pct: 92 }
        ];
        return '<section class="ws-crm-pipeline ws-panel ws-panel--level-3' + (isCollapsed ? ' cockpit-collapsed' : '') + '" id="wsCrmPipelineWrap">' +
            '<h4><i class="fas fa-diagram-project"></i> CRM Pipeline' +
            '<button type="button" class="ws-panel__collapse-btn" onclick="toggleCrmPipelinePanel(); localStorage.setItem(\'velodeskCrmCollapsed\', document.getElementById(\'wsCrmPipelineWrap\').classList.contains(\'cockpit-collapsed\')?\'1\':\'0\')">' +
            (isCollapsed ? 'Expandir' : 'Recolher') + '</button></h4>' +
            '<div class="ws-crm-pipeline__track">' + stages.map(function (s, i) {
                return '<div class="ws-crm-stage' + (i === stages.length - 2 ? ' ws-crm-stage--active' : '') + '">' +
                    '<div class="ws-crm-stage__bar" style="--pct:' + s.pct + '%"></div>' +
                    '<strong>' + s.count + '</strong><span>' + s.label + '</span></div>';
            }).join('') + '</div>' +
            '<p class="ws-panel-hint">Tickets, vendas e retenção integrados em um funil único.</p></section>';
    };

    window.renderAutomationsDeskHtml = function () {
        const rules = [
            { name: 'Cliente 3d sem resposta', trigger: 'SE inatividade > 72h', actions: 'Alerta · Prioridade ↑ · Avisar supervisor · Sugerir mensagem', active: true },
            { name: 'SLA crítico automático', trigger: 'SE SLA < 15min', actions: 'Escalar · Notificar supervisor · Pulse dashboard', active: true },
            { name: 'Churn risk detectado', trigger: 'SE sentimento negativo + 3 tickets', actions: 'Tag risco · IA resposta · CRM retenção', active: true }
        ];
        var toggles = JSON.parse(localStorage.getItem('velodeskAutomationRules') || '[true,true,true]');
        return '<section class="ws-auto-desk ws-panel ws-panel--level-3">' +
            '<div class="ws-panel__head-row"><h4><i class="fas fa-bolt"></i> Automações ativas</h4>' +
            '<button type="button" class="ws-feed-action ws-feed-action--ghost" onclick="openAutomationLogPanel()">Ver log</button></div>' +
            '<ul class="ws-auto-desk__list">' + rules.map(function (r, idx) {
                var on = toggles[idx] !== false;
                return '<li class="ws-auto-desk__item' + (on ? ' ws-auto-desk__item--on' : '') + '">' +
                    '<button type="button" class="ws-auto-desk__toggle' + (on ? '' : ' is-off') + '" onclick="toggleAutomationRule(' + idx + ')">' + (on ? 'ON' : 'OFF') + '</button>' +
                    '<strong>' + escapeHtmlEcosystem(r.name) + '</strong>' +
                    '<span class="ws-auto-desk__trigger"><span class="ws-auto-desk__chip ws-auto-desk__chip--trigger">SE</span>' + escapeHtmlEcosystem(r.trigger.replace(/^SE\s*/, '')) + '</span>' +
                    '<span class="ws-auto-desk__actions"><span class="ws-auto-desk__chip ws-auto-desk__chip--action">ENTÃO</span>' + escapeHtmlEcosystem(r.actions) + '</span></li>';
            }).join('') + '</ul></section>';
    };

    window.renderExecutiveDashboardHtml = function () {
        return '<div class="ws-exec-dash">' +
            '<nav class="ws-exec-breadcrumb"><a onclick="navigateToPage(\'workspace\')">Gestão</a> → Analytics executivo</nav>' +
            '<header class="ws-exec-dash__head"><h3><i class="fas fa-chart-pie"></i> Dashboard Executivo</h3>' +
            '<span class="ws-live-dot"></span> Tempo real</header>' +
            '<div class="ws-exec-dash__toolbar">' +
            '<select id="execPeriodFilter" title="Período"><option>Hoje</option><option>Esta semana</option><option>Este mês</option></select>' +
            '<button type="button" class="btn-secondary btn-sm" onclick="exportExecTable(\'csv\')"><i class="fas fa-file-csv"></i> CSV</button>' +
            '<button type="button" class="btn-secondary btn-sm" onclick="exportExecTable(\'pdf\')"><i class="fas fa-file-pdf"></i> PDF</button>' +
            '</div>' +
            '<div class="ws-exec-dash__grid">' +
            statExec('fa-users', '12', 'Agentes online') +
            statExec('fa-percentage', '94%', 'SLA global') +
            statExec('fa-inbox', '47', 'Backlog') +
            statExec('fa-user-slash', '3.2%', 'Churn risk', 'Base: 847 clientes ativos') +
            '</div>' +
            '<div class="ws-exec-chart-wrap"><canvas id="execTrendChart" height="120"></canvas></div>' +
            '<section class="ws-panel ws-panel--level-2"><h4>Produtividade por agente</h4>' +
            '<table class="client360-table ws-exec-table" id="execAgentTable"><thead><tr><th>Agente</th><th>Resolvidos</th><th>SLA</th><th>TMA</th><th>CSAT</th></tr></thead>' +
            '<tbody><tr><td>Ana Silva</td><td>18</td><td>98%</td><td>3m 48s</td><td>4.9</td></tr>' +
            '<tr><td>Carlos Mendes</td><td>15</td><td>94%</td><td>4m 22s</td><td>4.7</td></tr>' +
            '<tr><td>Julia Costa</td><td>12</td><td>91%</td><td>5m 01s</td><td>4.5</td></tr></tbody></table></section></div>';
    };

    function statExec(icon, val, label, tooltip) {
        return '<div class="ws-exec-stat"' + (tooltip ? ' data-tooltip="' + escapeHtmlEcosystem(tooltip) + '" title="' + escapeHtmlEcosystem(tooltip) + '"' : '') + '>' +
            '<i class="fas ' + icon + '"></i><strong>' + val + '</strong><span>' + label + '</span></div>';
    }

    window.initExecTrendChart = function () {
        var canvas = document.getElementById('execTrendChart');
        if (!canvas || typeof Chart === 'undefined' || canvas.dataset.chartInit) return;
        canvas.dataset.chartInit = '1';
        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Tickets resolvidos',
                    data: [98, 112, 105, 128, 118, 45, 32],
                    borderColor: '#1634FF',
                    backgroundColor: 'rgba(22,52,255,0.08)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    };

    window.seedCockpitDemo = function () {
        if (typeof window.seedDemoTickets === 'function') {
            window.seedDemoTickets({ force: true, replaceAll: true });
        }
        const db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
        Object.keys(db).forEach(function (cpf) {
            const c = db[cpf];
            if (!c.clienteDesde) c.clienteDesde = '2 anos';
            if (!c.canais) c.canais = ['WhatsApp', 'Email', 'Chat'];
            if (!c.ultimaAvaliacao && c.risco && String(c.risco).indexOf('alto') !== -1) {
                c.ultimaAvaliacao = 'Negativa (NPS 4)';
            }
            if (c.name && c.name.indexOf('Tech') !== -1) c.premium = true;
        });
        localStorage.setItem('velodeskClientDB', JSON.stringify(db));
        const workflows = JSON.parse(localStorage.getItem('workflows') || '[]');
        if (!workflows.find(function (w) { return w.id === 'cockpit-auto-1'; })) {
            workflows.push({
                id: 'cockpit-auto-1',
                name: 'Cliente 3 dias sem resposta',
                description: 'Alerta + prioridade + supervisor + mensagem sugerida',
                trigger: 'ticket-updated',
                active: true,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('workflows', JSON.stringify(workflows));
        }
    };

    function escapeHtmlEcosystem(s) {
        if (typeof window.escapeHtmlEcosystem === 'function') return window.escapeHtmlEcosystem(s);
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            if (localStorage.getItem('velodeskCockpitSeeded') !== '1') {
                window.seedCockpitDemo();
                localStorage.setItem('velodeskCockpitSeeded', '1');
            }
        }, 800);
    });
})();
