/**
 * Velodesk Cockpit — Dashboard de Supervisão (centro de comando operacional)
 */
(function () {
    'use strict';

    if (!window.VELODESK_COCKPIT) return;

    function esc(s) {
        if (typeof window.escapeHtmlEcosystem === 'function') return window.escapeHtmlEcosystem(s);
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function findTickets() {
        const cols = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        const list = [];
        cols.forEach(function (c) { (c.tickets || []).forEach(function (t) { list.push(t); }); });
        return list;
    }

    function computeSupervisorData() {
        const tickets = findTickets();
        let slaAtRisk = 0, critical = 0, backlog = tickets.length, escalations = 2;
        const channels = {};
        tickets.forEach(function (t) {
            const pri = t.priority || 'normal';
            if (pri === 'critica' || pri === 'critical') critical++;
            if (pri === 'critica' || pri === 'critical' || pri === 'alta' || pri === 'high') slaAtRisk++;
            const ch = (t.lateralForm && t.lateralForm.canal) || t.channel || 'WhatsApp';
            channels[ch] = (channels[ch] || 0) + 1;
        });
        if (slaAtRisk < 3) slaAtRisk = 5;
        if (critical < 1) critical = 2;

        const slaAvg = 87 + (tickets.length % 5);
        const tmaTrend = 18;
        const agentsOnline = 12;
        const nps = 4.2;

        let healthLevel = 'ok';
        let healthLabel = 'Operação saudável';
        let healthIcon = '🟢';
        if (slaAtRisk >= 5 || critical >= 3) {
            healthLevel = 'critical';
            healthLabel = 'Operação crítica';
            healthIcon = '🔴';
        } else if (slaAtRisk >= 2 || tmaTrend >= 15) {
            healthLevel = 'warn';
            healthLabel = 'Operação sob atenção';
            healthIcon = '🟠';
        }

        const warRoom = healthLevel === 'critical' || slaAtRisk >= 7;

        return {
            slaAtRisk: slaAtRisk,
            critical: critical,
            escalations: escalations,
            backlog: backlog,
            slaAvg: slaAvg,
            tmaTrend: tmaTrend,
            agentsOnline: agentsOnline,
            nps: nps,
            healthLevel: healthLevel,
            healthLabel: healthLabel,
            healthIcon: healthIcon,
            warRoom: warRoom,
            channels: channels,
            forecastTickets: 18,
            forecastPeak: '16h',
            forecastSlaRisk: 2
        };
    }

    var FEED_EVENTS = [
        { type: 'neutral', text: 'João respondeu cliente', offset: 0 },
        { type: 'warn', text: 'Ticket #4512 escalado', offset: 1 },
        { type: 'critical', text: 'IA detectou risco de churn', offset: 2 },
        { type: 'ok', text: 'SLA voltou ao normal', offset: 4 },
        { type: 'ok', text: 'Ana Silva resolveu ticket em 2m', offset: 5 },
        { type: 'neutral', text: 'Novo ticket WhatsApp — prioridade alta', offset: 3 },
        { type: 'warn', text: 'Carlos Mendes atingiu 85% de carga', offset: 6 },
        { type: 'critical', text: 'Backlog cresceu 12% na última hora', offset: 7 }
    ];

    function buildLiveFeed() {
        const now = new Date();
        return FEED_EVENTS.map(function (ev) {
            const d = new Date(now.getTime() - ev.offset * 60000);
            return {
                time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                text: ev.text,
                type: ev.type
            };
        }).reverse();
    }

    var TEAM = [
        { name: 'Ana Silva', load: 92, tickets: 14, sla: 98, tma: '3m 12s', csat: 9.2, online: '4h 22m', trend: 'up', resolved: 32, medal: true, risk: true },
        { name: 'Carlos Mendes', load: 48, tickets: 7, sla: 94, tma: '4m 28s', csat: 8.4, online: '2h 10m', trend: 'up', resolved: 15, medal: false, risk: false },
        { name: 'Julia Costa', load: 71, tickets: 11, sla: 91, tma: '5m 01s', csat: 7.8, online: '3h 45m', trend: 'down', resolved: 12, medal: false, risk: false },
        { name: 'Pedro Alves', load: 55, tickets: 8, sla: 93, tma: '4m 05s', csat: 8.1, online: '1h 30m', trend: 'up', resolved: 10, medal: false, risk: false }
    ];

    var AI_RISKS = [
        { level: 'warn', text: 'Crescimento de tickets em 32%' },
        { level: 'critical', text: 'SLA pode cair às 16h' },
        { level: 'warn', text: 'Alto volume no WhatsApp' },
        { level: 'critical', text: 'Equipe próxima do limite operacional' },
        { level: 'warn', text: 'Aumento de reclamações sobre lentidão' }
    ];

    var BOTTLENECKS = [
        { area: 'WhatsApp', issue: 'Tempo médio elevado', severity: 'high' },
        { area: 'Financeiro', issue: '12 tickets sem resposta', severity: 'critical' },
        { area: 'Turno da noite', issue: 'Queda de SLA', severity: 'medium' },
        { area: 'Chat', issue: 'Fila congestionada', severity: 'medium' }
    ];

    var AI_INSIGHTS = [
        'IA detectou aumento de reclamações sobre lentidão',
        'Equipe resolve tickets 24% mais rápido pela manhã',
        'Clientes premium estão aguardando mais tempo',
        'Risco de churn aumentou em 18%'
    ];

    var HEATMAP_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    var HEATMAP_VALUES = [42, 58, 72, 85, 68, 55, 78, 92, 88, 95, 72, 48, 35];

    function renderSuperHero(d) {
        const bullets = [
            d.slaAtRisk + ' SLAs em risco',
            d.escalations + ' escalonamentos ativos',
            'Tempo médio aumentou ' + d.tmaTrend + '%',
            'Alta carga operacional no WhatsApp'
        ];
        if (d.warRoom) {
            return '<header class="ws-super-hero ws-super-hero--war ws-super-hero--' + d.healthLevel + '">' +
                '<div class="ws-super-hero__main">' +
                '<span class="ws-super-hero__eyebrow">SUPERVISÃO</span>' +
                '<h2 class="ws-super-hero__title">🚨 Operação crítica detectada</h2>' +
                '<ul class="ws-super-hero__bullets">' +
                '<li>' + d.slaAtRisk + ' SLAs em risco</li>' +
                '<li>Backlog crescendo rapidamente</li>' +
                '<li>Tempo médio aumentando</li></ul>' +
                '<div class="ws-super-hero__forecast"><strong>Previsão:</strong> +' + d.forecastTickets + ' tickets na próxima hora · Pico às ' + d.forecastPeak + '</div>' +
                '<div class="ws-super-hero__countdown" id="wsSuperCountdown"><i class="fas fa-hourglass-half"></i> Próximo pico em <strong id="wsPeakCountdown">—</strong></div>' +
                '</div>' +
                renderSuperQuickActions(true) +
                '</header>';
        }
        return '<header class="ws-super-hero ws-super-hero--' + d.healthLevel + '">' +
            '<div class="ws-super-hero__main">' +
            '<span class="ws-super-hero__eyebrow">SUPERVISÃO</span>' +
            '<div class="ws-super-hero__health"><span class="ws-super-hero__health-dot"></span>' + d.healthIcon + ' ' + esc(d.healthLabel) + '</div>' +
            '<ul class="ws-super-hero__bullets">' + bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
            '<div class="ws-super-hero__forecast"><strong>Previsão:</strong> +' + d.forecastTickets + ' tickets na próxima hora · Pico operacional previsto às ' + d.forecastPeak + '</div>' +
            '<div class="ws-super-hero__countdown" id="wsSuperCountdown"><i class="fas fa-hourglass-half"></i> Próximo pico em <strong id="wsPeakCountdown">—</strong></div>' +
            '</div>' +
            renderSuperQuickActions(false) +
            '</header>';
    }

    function renderSuperQuickActions(war) {
        return '<div class="ws-super-hero__actions">' +
            '<button type="button" class="ws-super-btn ws-super-btn--primary" onclick="supervisorQuickAction(\'redistribute\')"><i class="fas fa-shuffle"></i> Redistribuir tickets</button>' +
            '<button type="button" class="ws-super-btn" onclick="supervisorQuickAction(\'critical\')"><i class="fas fa-fire"></i> Operação crítica</button>' +
            '<button type="button" class="ws-super-btn" onclick="supervisorQuickAction(\'escalate\')"><i class="fas fa-users-gear"></i> Escalonar equipe</button>' +
            (war ? '<button type="button" class="ws-super-btn ws-super-btn--danger" onclick="supervisorQuickAction(\'contingency\')"><i class="fas fa-triangle-exclamation"></i> Ativar contingência</button>' :
                '<button type="button" class="ws-super-btn" onclick="supervisorQuickAction(\'contingency\')"><i class="fas fa-shield-halved"></i> Contingência</button>') +
            '</div>';
    }

    function renderLiveKpis(d) {
        return '<div class="ws-super-kpis--highlight">' +
            '<div class="ws-super-kpi ws-super-kpi--hero">' +
            '<div><strong class="ws-super-kpi__val">' + esc(d.slaAvg + '%') + '</strong><span>SLA cumprido</span></div></div>' +
            '<div class="ws-super-kpi ws-super-kpi--hero ws-super-kpi--warn">' +
            '<div><strong class="ws-super-kpi__val">' + esc(String(d.slaAtRisk)) + '</strong><span>Em risco de SLA</span></div></div>' +
            '<div class="ws-super-kpi ws-super-kpi--hero">' +
            '<div><strong class="ws-super-kpi__val">' + esc(String(d.agentsOnline)) + '</strong><span>Agentes online</span></div></div>' +
            '</div>' +
            '<div class="ws-super-kpis" id="wsSuperKpis">' +
            kpiLive('fa-smile', String(d.nps), 'NPS médio', 'nps') +
            kpiLive('fa-inbox', String(d.backlog), 'Backlog', 'backlog') +
            kpiLive('fa-stopwatch', '4m 32s', 'TMA médio', 'tma') +
            '</div>';
    }

    function kpiLive(icon, val, label, key, warn) {
        return '<div class="ws-super-kpi' + (warn ? ' ws-super-kpi--warn' : '') + '" data-kpi="' + key + '">' +
            '<div class="ws-super-kpi__icon"><i class="fas ' + icon + '"></i></div>' +
            '<div><strong class="ws-super-kpi__val">' + esc(val) + '</strong><span>' + esc(label) + '</span></div></div>';
    }

    function renderHealthCard(d) {
        const msgs = d.healthLevel === 'ok'
            ? ['SLA controlado', 'Backlog dentro do esperado']
            : d.healthLevel === 'warn'
                ? ['Crescimento de tickets detectado', 'Monitorar WhatsApp e TMA']
                : ['Operação próxima do limite', 'Ativar redistribuição imediata'];
        return '<section class="ws-super-health ws-super-health--' + d.healthLevel + '">' +
            '<h4><i class="fas fa-heart-pulse"></i> Saúde operacional</h4>' +
            '<div class="ws-super-health__status">' + d.healthIcon + ' ' + esc(d.healthLabel) + '</div>' +
            '<ul class="ws-super-health__list">' + msgs.map(function (m, i) {
                return '<li class="ws-super-health__link" onclick="navigateToPage(\'tickets\')" title="Ver tickets relacionados">' + esc(m) + ' → #' + (4510 + i) + '</li>';
            }).join('') + '</ul>' +
            '<div class="ws-super-health__ai"><i class="fas fa-brain"></i> IA: risco previsto de +' + d.forecastSlaRisk + ' SLAs críticos na próxima hora</div></section>';
    }

    function renderLiveFeed() {
        const items = buildLiveFeed();
        return '<section class="ws-super-feed ws-panel ws-panel--level-2">' +
            '<div class="ws-panel__head-row"><h4><i class="fas fa-satellite-dish"></i> Atividade em tempo real</h4>' +
            '<span class="ws-live-dot" title="Ao vivo"></span></div>' +
            '<ul class="ws-super-feed__list" id="wsSuperFeedList">' +
            items.map(function (item, i) {
                return '<li class="ws-super-feed__item ws-super-feed__item--' + item.type + ' ws-super-feed__item--enter" style="animation-delay:' + (i * 0.04) + 's">' +
                    '<span class="ws-super-feed__time">' + item.time + '</span>' +
                    '<span class="ws-super-feed__text">' + esc(item.text) + '</span>' +
                    '<button type="button" class="ws-super-feed__treat-btn" onclick="markFeedItemTreated(this)">Tratar</button></li>';
            }).join('') + '</ul></section>';
    }

    function renderTeamLoad() {
        return '<section class="ws-super-team ws-panel ws-panel--level-2">' +
            '<div class="ws-panel__head-row"><h4><i class="fas fa-users-between-lines"></i> Distribuição operacional</h4></div>' +
            TEAM.map(function (a) {
                const barClass = a.load >= 85 ? ' ws-super-load__bar--danger' : a.load >= 65 ? ' ws-super-load__bar--warn' : '';
                return '<div class="ws-super-load ws-super-load--clickable" onclick="supervisorOpenAgentQueue(\'' + esc(a.name).replace(/'/g, "\\'") + '\')" title="Ver fila de ' + esc(a.name) + '">' +
                    '<div class="ws-super-load__head"><strong>' + esc(a.name) + '</strong><span>' + a.load + '%</span></div>' +
                    '<div class="ws-super-load__track"><div class="ws-super-load__bar' + barClass + '" style="width:' + a.load + '%"></div></div>' +
                    '<div class="ws-super-load__meta">' + a.tickets + ' ativos · SLA ' + a.sla + '% · TMA ' + esc(a.tma) + ' · Online ' + esc(a.online) + '</div>' +
                    (a.risk ? '<div class="ws-super-load__risk">⚠️ ' + esc(a.name) + ' próxima do limite operacional</div>' : '') +
                    '</div>';
            }).join('') + '</section>';
    }

    function renderLeaderboard() {
        return '<section class="ws-super-leader ws-panel ws-panel--level-2">' +
            '<h4><i class="fas fa-trophy"></i> Leaderboard operacional</h4>' +
            '<div class="ws-super-leader__filters">' +
            '<select title="Turno"><option>Turno: Todos</option><option>Manhã</option><option>Tarde</option><option>Noite</option></select>' +
            '<select title="Canal"><option>Canal: Todos</option><option>WhatsApp</option><option>Email</option><option>Chat</option></select>' +
            '</div>' +
            '<ol class="ws-super-leader__list">' +
            TEAM.slice().sort(function (a, b) { return b.resolved - a.resolved; }).map(function (a, i) {
                const trend = a.trend === 'up' ? '<span class="ws-super-trend ws-super-trend--up">↑</span>' : '<span class="ws-super-trend ws-super-trend--down">↓</span>';
                return '<li class="ws-super-leader__item' + (a.medal ? ' ws-super-leader__item--top' : '') + '">' +
                    '<span class="ws-super-leader__rank">' + (i + 1) + '</span>' +
                    '<div class="ws-super-leader__body">' +
                    '<strong>' + esc(a.name) + ' ' + trend + (a.medal ? ' 🥇' : '') + '</strong>' +
                    '<span>' + a.sla + '% SLA · ' + a.resolved + ' resolvidos · TMA ' + esc(a.tma) + ' · CSAT ' + a.csat + '</span>' +
                    '<em>vs ontem: ' + (a.trend === 'up' ? '+5%' : '-1%') + '</em></div></li>';
            }).join('') + '</ol></section>';
    }

    function renderAiRisks() {
        return '<section class="ws-super-risks ws-panel ws-panel--level-3" id="wsSuperRisks">' +
            '<div class="ws-panel__head-row"><h4><i class="fas fa-robot"></i> Riscos detectados pela IA</h4>' +
            '<button type="button" class="ws-super-expand-btn" onclick="toggleSupervisorExpand(\'wsSuperRisks\')">Ver todos</button></div>' +
            '<div class="cockpit-collapsible-body"><ul class="ws-super-risks__list">' +
            AI_RISKS.slice(0, 3).map(function (r) {
                return '<li class="ws-super-risks__item ws-super-risks__item--' + r.level + '">⚠️ ' + esc(r.text) + '</li>';
            }).join('') +
            AI_RISKS.slice(3).map(function (r) {
                return '<li class="ws-super-risks__item ws-super-risks__item--' + r.level + ' cockpit-collapsed-extra" style="display:none">⚠️ ' + esc(r.text) + '</li>';
            }).join('') + '</ul></div></section>';
    }

    function renderBottlenecks() {
        return '<section class="ws-super-bottleneck ws-panel ws-panel--level-3" id="wsSuperBottlenecks">' +
            '<div class="ws-panel__head-row"><h4><i class="fas fa-road-barrier"></i> Gargalos operacionais</h4>' +
            '<button type="button" class="ws-super-expand-btn" onclick="document.querySelectorAll(\'#wsSuperBottlenecks .cockpit-collapsed-extra\').forEach(function(el){el.style.display=el.style.display===\'none\'?\'\':\'none\'})">Ver todos</button></div>' +
            '<ul class="ws-super-bottleneck__list">' +
            BOTTLENECKS.slice(0, 3).map(function (b) {
                return '<li class="ws-super-bottleneck__item ws-super-bottleneck__item--' + b.severity + '">' +
                    '<strong>' + esc(b.area) + '</strong><span>→ ' + esc(b.issue) + '</span></li>';
            }).join('') +
            BOTTLENECKS.slice(3).map(function (b) {
                return '<li class="ws-super-bottleneck__item ws-super-bottleneck__item--' + b.severity + ' cockpit-collapsed-extra" style="display:none">' +
                    '<strong>' + esc(b.area) + '</strong><span>→ ' + esc(b.issue) + '</span></li>';
            }).join('') + '</ul></section>';
    }

    function renderAiAnalytics() {
        return '<section class="ws-super-analytics ws-panel ws-panel--level-3">' +
            '<h4><i class="fas fa-wand-magic-sparkles"></i> Analytics IA</h4>' +
            '<ul class="ws-super-analytics__list">' +
            AI_INSIGHTS.map(function (t) {
                return '<li><i class="fas fa-lightbulb"></i> ' + esc(t) + '</li>';
            }).join('') + '</ul></section>';
    }

    function renderForecast(d) {
        return '<section class="ws-super-forecast ws-panel ws-panel--level-2">' +
            '<h4><i class="fas fa-chart-line"></i> Previsão operacional</h4>' +
            '<div class="ws-super-forecast__block">' +
            '<strong>Próxima hora:</strong>' +
            '<ul><li>+' + d.forecastTickets + ' tickets previstos</li>' +
            '<li>' + d.forecastSlaRisk + ' novos SLAs críticos</li>' +
            '<li>Pico operacional às ' + d.forecastPeak + '</li></ul></div></section>';
    }

    function renderChannels(d) {
        const defs = [
            { name: 'WhatsApp', vol: channelsVol(d, 'WhatsApp', 92), sla: 84, warn: true },
            { name: 'Email', vol: channelsVol(d, 'Email', 34), sla: 91, warn: false },
            { name: 'Chat', vol: channelsVol(d, 'Chat', 28), sla: 88, warn: false },
            { name: 'Instagram', vol: 12, sla: 79, warn: true },
            { name: 'Portal', vol: 8, sla: 95, warn: false }
        ];
        return '<section class="ws-super-channels ws-panel ws-panel--level-2">' +
            '<h4><i class="fas fa-layer-group"></i> Visão por canal</h4>' +
            '<div class="ws-super-channels__grid">' +
            defs.map(function (ch) {
                return '<div class="ws-super-channel-card">' +
                    '<strong>' + esc(ch.name) + '</strong>' +
                    '<span class="ws-super-channel-card__vol">' + ch.vol + ' tickets</span>' +
                    '<span class="ws-super-channel-card__sla">SLA ' + ch.sla + '%</span>' +
                    (ch.warn ? '<span class="ws-super-channel-card__warn">⚠️ Alto volume</span>' : '') +
                    '</div>';
            }).join('') + '</div></section>';
    }

    function channelsVol(d, name, fallback) {
        return d.channels[name] || fallback;
    }

    function renderHeatmap() {
        const max = Math.max.apply(null, HEATMAP_VALUES);
        return '<section class="ws-super-heatmap ws-panel ws-panel--level-2">' +
            '<h4><i class="fas fa-fire-flame-curved"></i> Heatmap operacional — SLA por hora</h4>' +
            '<div class="ws-super-heatmap__grid">' +
            HEATMAP_HOURS.map(function (h, i) {
                const v = HEATMAP_VALUES[i];
                const level = v >= 90 ? 'critical' : v >= 75 ? 'warn' : 'ok';
                return '<div class="ws-super-heatmap__cell ws-super-heatmap__cell--' + level + '" style="--intensity:' + (v / max) + '" title="' + h + 'h — ' + v + '% SLA" onclick="supervisorHeatmapHour(' + h + ',' + v + ')" role="button" tabindex="0">' +
                    '<span>' + h + 'h</span></div>';
            }).join('') + '</div>' +
            '<div class="ws-super-heatmap__legend"><span class="ws-super-heatmap__cell--ok">Manhã</span><span class="ws-super-heatmap__cell--warn">Tarde</span><span class="ws-super-heatmap__cell--critical">Pico</span></div></section>';
    }

    function renderMgmtActions() {
        return '<section class="ws-super-mgmt ws-panel ws-panel--level-3">' +
            '<h4><i class="fas fa-bolt"></i> Ações gerenciais</h4>' +
            '<div class="ws-super-mgmt__grid">' +
            mgmtBtn('redistribute', 'fa-shuffle', 'Redistribuir') +
            mgmtBtn('escalate', 'fa-users-gear', 'Escalonar equipe') +
            mgmtBtn('contingency', 'fa-shield-halved', 'Contingência') +
            mgmtBtn('notify', 'fa-bell', 'Notificar agentes') +
            mgmtBtn('pause', 'fa-pause', 'Pausar fila') +
            mgmtBtn('reprioritize', 'fa-sort-amount-up', 'Repriorizar') +
            '</div></section>';
    }

    function mgmtBtn(action, icon, label) {
        var danger = action === 'pause' || action === 'contingency';
        return '<button type="button" class="ws-super-mgmt__btn' + (danger ? ' ws-super-mgmt__btn--danger' : '') + '" onclick="supervisorQuickAction(\'' + action + '\')"><i class="fas ' + icon + '"></i> ' + label + '</button>';
    }

    window.renderSupervisorWorkspaceHtml = function () {
        const d = computeSupervisorData();
        return '<div class="ws-super-desk' + (d.warRoom ? ' ws-super-desk--war-room' : '') + '" id="wsSuperDesk">' +
            renderSuperHero(d) +
            renderLiveKpis(d) +
            '<div class="ws-super-layout">' +
            '<div class="ws-super-main">' +
            renderHealthCard(d) +
            renderTeamLoad() +
            renderLeaderboard() +
            renderChannels(d) +
            renderHeatmap() +
            renderForecast(d) +
            '</div>' +
            '<aside class="ws-super-aside">' +
            renderLiveFeed() +
            renderAiRisks() +
            renderBottlenecks() +
            renderAiAnalytics() +
            renderMgmtActions() +
            '</aside></div></div>';
    };

    window.supervisorQuickAction = function (action) {
        const labels = {
            redistribute: 'Redistribuição de tickets iniciada — IA balanceando filas.',
            critical: 'Abrindo visão de operação crítica…',
            escalate: 'Escalonamento enviado à equipe de plantão.',
            contingency: 'Modo contingência ativado — filas repriorizadas.',
            notify: 'Notificação enviada a todos os agentes online.',
            pause: 'Fila pausada temporariamente (simulação).',
            reprioritize: 'Tickets repriorizados por SLA e churn.'
        };
        if (action === 'critical') {
            document.getElementById('wsSuperDesk')?.classList.add('ws-super-desk--war-room');
        }
        if (typeof showNotification === 'function') {
            showNotification(labels[action] || 'Ação executada.', action === 'contingency' ? 'warning' : 'info');
        }
    };

    var superFeedIdx = 0;
    var EXTRA_FEED = [
        { type: 'ok', text: 'Maria resolveu ticket #4510' },
        { type: 'neutral', text: 'Pedro assumiu ticket da fila' },
        { type: 'warn', text: 'SLA #4515 entrou em risco' },
        { type: 'critical', text: 'Pico WhatsApp detectado' }
    ];

    function tickSupervisorLive() {
        const ws = document.getElementById('workspace');
        if (!ws || !ws.classList.contains('active')) return;
        if (document.body.dataset.velodeskProfile !== 'supervisor') return;

        const list = document.getElementById('wsSuperFeedList');
        if (list) {
            const ev = EXTRA_FEED[superFeedIdx % EXTRA_FEED.length];
            superFeedIdx++;
            const now = new Date();
            const li = document.createElement('li');
            li.className = 'ws-super-feed__item ws-super-feed__item--' + ev.type + ' ws-super-feed__item--enter';
            li.innerHTML = '<span class="ws-super-feed__time">' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
                '</span><span class="ws-super-feed__text">' + esc(ev.text) + '</span>' +
                '<button type="button" class="ws-super-feed__treat-btn" onclick="markFeedItemTreated(this)">Tratar</button>';
            list.insertBefore(li, list.firstChild);
            while (list.children.length > 12) list.removeChild(list.lastChild);
        }

        const kpiRisk = document.querySelector('.ws-super-kpi[data-kpi="risk"] .ws-super-kpi__val');
        if (kpiRisk) {
            kpiRisk.classList.add('ws-super-kpi__val--flash');
            setTimeout(function () { kpiRisk.classList.remove('ws-super-kpi__val--flash'); }, 600);
        }
    }

    window.startSupervisorLiveRefresh = function () {
        if (window._superLiveTimer) clearInterval(window._superLiveTimer);
        window._superLiveTimer = setInterval(function () {
            const ws = document.getElementById('workspace');
            if (ws && ws.classList.contains('active') && document.body.dataset.velodeskProfile === 'supervisor') {
                tickSupervisorLive();
                if (Math.random() > 0.7) window.renderWorkspace360();
            }
        }, 20000);
    };

    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(window.startSupervisorLiveRefresh, 2000);
    });
})();
