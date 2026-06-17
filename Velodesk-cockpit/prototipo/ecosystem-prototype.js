/**
 * Velodesk — Ecossistema V3 (Protótipo local)
 * Perfis segmentados, camada IA, workspace 360°, monitoria e analytics.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'velodeskEcoProfile';
    const BRAND_TONE = {
        replacements: [
            [/vc\b/gi, 'você'],
            [/tb\b/gi, 'também'],
            [/pq\b/gi, 'porque'],
            [/blz\b/gi, 'certo'],
            [/obg\b/gi, 'obrigado'],
            [/pfv\b/gi, 'por favor'],
            [/tá\b/gi, 'está'],
            [/né\?/gi, ', correto?'],
            [/a gente/gi, 'nossa equipe']
        ],
        formalOpeners: ['Prezado(a) cliente,', 'Olá,', 'Bom dia,']
    };

    const PROFILES = {
        agente: {
            label: 'Agente',
            icon: 'fa-headset',
            pages: ['workspace360', 'dashboard', 'tickets', 'chat', 'reports', 'config'],
            workspaceTitle: 'Seu painel de atendimento',
            workspaceDesc: 'Tickets, treinamentos pendentes e metas do dia em uma única tela.'
        },
        supervisor: {
            label: 'Supervisor',
            icon: 'fa-user-tie',
            pages: ['workspace360', 'dashboard', 'analyticsV3', 'tickets', 'reports', 'config'],
            workspaceTitle: 'Visão da equipe',
            workspaceDesc: 'SLA, performance da equipe e escalonamentos em tempo real.'
        },
        monitoria: {
            label: 'Monitoria',
            icon: 'fa-clipboard-check',
            pages: ['workspace360', 'monitoriaPage', 'tickets', 'reports'],
            workspaceTitle: 'Fila de avaliação',
            workspaceDesc: 'Atendimentos aguardando pontuação e feedback ao agente.'
        },
        treinamento: {
            label: 'Treinamento',
            icon: 'fa-graduation-cap',
            pages: ['workspace360', 'reports', 'config'],
            workspaceTitle: 'Trilhas e recomendações',
            workspaceDesc: 'Erros de monitoria e gaps de habilidade viram treinamentos automáticos.'
        },
        gestao: {
            label: 'Gestão',
            icon: 'fa-chart-line',
            pages: ['analyticsV3', 'dashboard', 'reports', 'workspace360', 'config'],
            workspaceTitle: 'Painel executivo',
            workspaceDesc: 'TMA, NPS, volume e previsões para decisão estratégica.'
        }
    };

    const MACROS = [
        { key: 'F1', label: 'Saudação', text: 'Prezado(a) cliente, obrigado por entrar em contato. Nossa equipe está à disposição para ajudá-lo(a).' },
        { key: 'F2', label: 'Aguardar', text: 'Por favor, aguarde um momento enquanto verifico as informações para você.' },
        { key: 'F3', label: 'Encerrar', text: 'Fico à disposição caso precise de mais alguma coisa. Tenha um excelente dia!' },
        { key: 'F4', label: 'SLA', text: 'Identificamos sua solicitação e ela será tratada dentro do prazo acordado. Enviaremos atualizações em breve.' }
    ];

    const VELHOHUB_TREE = {
        'Reclamação': {
            'Produto': ['Atraso na entrega', 'Defeito', 'Cobrança indevida'],
            'Serviço': ['Atendimento', 'Cancelamento', 'Reembolso']
        },
        'Suporte': {
            'Técnico': ['Acesso', 'Configuração', 'Integração'],
            'Financeiro': ['Boleto', 'Nota fiscal', 'Estorno']
        }
    };

    let currentProfile = localStorage.getItem(STORAGE_KEY) || 'agente';
    let aiDockOpen = false;

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    }

    function boot() {
        injectBanner();
        injectPages();
        injectProfileSwitcher();
        injectNavItems();
        injectAiDock();
        injectAiToggle();
        patchNavigation();
        applyProfile(currentProfile);
        setupWritingReviewObserver();
        setupTicketEnhancer();
        setupMacroShortcuts();
        seedEcoNotifications();
        console.log('[Ecossistema V3] Protótipo carregado — perfil:', currentProfile);
    }

    function injectBanner() {
        document.body.classList.add('eco-prototype-active');
        const banner = document.createElement('div');
        banner.className = 'eco-prototype-banner';
        banner.innerHTML = '<i class="fas fa-flask"></i> Protótipo Ecossistema V3 — versão local · IA simulada · Perfis segmentados';
        document.body.prepend(banner);
    }

    function injectNavItems() {
        const nav = document.querySelector('#mainSidebar .nav-list');
        if (!nav || document.getElementById('eco-nav-workspace360')) return;

        const items = [
            { page: 'workspace360', icon: 'fa-th-large', label: 'Workspace 360°', id: 'eco-nav-workspace360' },
            { page: 'analyticsV3', icon: 'fa-chart-pie', label: 'Analytics+', id: 'eco-nav-analyticsV3' },
            { page: 'monitoriaPage', icon: 'fa-clipboard-check', label: 'Monitoria', id: 'eco-nav-monitoriaPage' },
            { page: 'portalCliente', icon: 'fa-user-circle', label: 'Portal Cliente', id: 'eco-nav-portalCliente' }
        ];

        const ref = nav.querySelector('[data-page="tickets"]');
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item eco-nav-item';
            li.id = item.id;
            li.dataset.page = item.page;
            li.dataset.tooltip = item.label;
            li.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
            li.onclick = () => {
                if (typeof navigateToPageMobile === 'function') navigateToPageMobile(item.page);
                else if (typeof navigateToPage === 'function') navigateToPage(item.page);
            };
            if (ref) nav.insertBefore(li, ref);
            else nav.appendChild(li);
        });
    }

    function injectProfileSwitcher() {
        const menu = document.getElementById('profileMenu');
        if (!menu || document.getElementById('ecoRoleSwitcher')) return;

        const block = document.createElement('div');
        block.id = 'ecoRoleSwitcher';
        block.className = 'eco-role-item';
        block.innerHTML = '<small>Perfil no ecossistema</small>';
        Object.entries(PROFILES).forEach(([key, p]) => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'eco-role-option' + (key === currentProfile ? ' active' : '');
            a.dataset.role = key;
            a.innerHTML = `<i class="fas ${p.icon}"></i> ${p.label} <i class="fas fa-check"></i>`;
            a.onclick = (e) => {
                e.preventDefault();
                switchProfile(key);
                if (typeof toggleProfileMenu === 'function') toggleProfileMenu();
            };
            block.appendChild(a);
        });
        menu.insertBefore(block, menu.firstChild);
    }

    function switchProfile(role) {
        if (!PROFILES[role]) return;
        currentProfile = role;
        localStorage.setItem(STORAGE_KEY, role);
        document.querySelectorAll('.eco-role-option').forEach(el => {
            el.classList.toggle('active', el.dataset.role === role);
        });
        applyProfile(role);
        if (typeof showNotification === 'function') {
            showNotification(`Perfil alterado para ${PROFILES[role].label}`, 'info');
        }
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.id === 'workspace360') loadWorkspace360();
        if (activePage && activePage.id === 'analyticsV3') loadAnalyticsV3();
        if (activePage && activePage.id === 'monitoriaPage') loadMonitoriaPage();
    }

    function applyProfile(role) {
        const cfg = PROFILES[role];
        if (!cfg) return;

        document.querySelectorAll('#mainSidebar .nav-item[data-page]').forEach(el => {
            const page = el.dataset.page;
            if (!page) return;
            let show = cfg.pages.includes(page);
            if (page === 'portalCliente') show = ['agente', 'gestao'].includes(role);
            el.classList.toggle('eco-hidden', !show);
        });

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn && !profileBtn.querySelector('.eco-profile-badge')) {
            const badge = document.createElement('span');
            badge.className = 'eco-profile-badge';
            badge.id = 'ecoProfileBadge';
            profileBtn.querySelector('span')?.after(badge);
        }
        const badge = document.getElementById('ecoProfileBadge');
        if (badge) badge.textContent = cfg.label;

        updateHeaderForProfile(role);
    }

    function updateHeaderForProfile(role) {
        const cfg = PROFILES[role];
        const ws = document.getElementById('workspace360');
        if (ws) {
            const h = ws.querySelector('.eco-workspace-hero h3');
            const p = ws.querySelector('.eco-workspace-hero p');
            if (h) h.textContent = cfg.workspaceTitle;
            if (p) p.textContent = cfg.workspaceDesc;
        }
    }

    function patchNavigation() {
        const orig = window.navigateToPage;
        if (!orig || orig.__ecoPatched) return;

        window.navigateToPage = function (page) {
            orig.apply(this, arguments);
            syncNavActive(page);
            if (page === 'workspace360') loadWorkspace360();
            if (page === 'analyticsV3') loadAnalyticsV3();
            if (page === 'monitoriaPage') loadMonitoriaPage();
            if (page === 'portalCliente') loadPortalCliente();
        };
        window.navigateToPage.__ecoPatched = true;

        if (window.navigateToPageMobile && !window.navigateToPageMobile.__ecoPatched) {
            const origM = window.navigateToPageMobile;
            window.navigateToPageMobile = function (page) {
                origM.apply(this, arguments);
                syncNavActive(page);
            };
            window.navigateToPageMobile.__ecoPatched = true;
        }
    }

    function syncNavActive(page) {
        document.querySelectorAll('#mainSidebar .nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });
    }

    function injectPages() {
        const main = document.querySelector('.main-content');
        if (!main || document.getElementById('workspace360')) return;

        main.insertAdjacentHTML('beforeend', `
            <div id="workspace360" class="page">
                <div class="page-header"><h2>Workspace 360°</h2></div>
                <div class="eco-workspace" id="workspace360Content"></div>
            </div>
            <div id="analyticsV3" class="page">
                <div class="page-header"><h2>Analytics &amp; Gestão</h2></div>
                <div class="eco-workspace" id="analyticsV3Content"></div>
            </div>
            <div id="monitoriaPage" class="page">
                <div class="page-header"><h2>Módulo de Monitoria</h2></div>
                <div id="monitoriaPageContent"></div>
            </div>
            <div id="portalCliente" class="page">
                <div class="page-header"><h2>Portal do Cliente</h2></div>
                <div class="eco-workspace" id="portalClienteContent"></div>
            </div>
        `);
    }

    function loadWorkspace360() {
        const el = document.getElementById('workspace360Content');
        if (!el) return;
        const role = currentProfile;
        const cfg = PROFILES[role];

        const cards = getWorkspaceCards(role);
        el.innerHTML = `
            <div class="eco-workspace-hero">
                <div>
                    <h3>${cfg.workspaceTitle}</h3>
                    <p>${cfg.workspaceDesc}</p>
                </div>
                <span class="eco-tag info"><i class="fas ${cfg.icon}"></i> ${cfg.label}</span>
            </div>
            <div class="eco-workspace-grid">${cards}</div>
            ${role === 'agente' ? renderQuickRegister() : ''}
            ${role === 'agente' ? renderCallSimulation() : ''}
            <div class="eco-card" style="margin-top:1rem;">
                <div class="eco-card-header">
                    <div class="eco-card-icon purple"><i class="fas fa-bell"></i></div>
                    <h4>Notificações inteligentes</h4>
                </div>
                <ul class="eco-list" id="ecoSmartNotifList"></ul>
            </div>
        `;
        renderSmartNotifications();
        bindQuickRegister();
        if (window.DeskExperience?.staggerChildren) {
            window.DeskExperience.staggerChildren(el);
        }
    }

    function getWorkspaceCards(role) {
        const common = {
            agente: [
                { icon: 'blue', fa: 'fa-ticket-alt', title: 'Tickets pendentes', stat: '7', label: '3 com SLA crítico', list: ['#1042 — Reclamação cobrança', '#1038 — Suporte técnico', '#1035 — Retorno cliente'] },
                { icon: 'orange', fa: 'fa-clipboard-check', title: 'Monitoria', stat: '2', label: 'Apontamentos novos', list: ['Empatia — nota 7/10', 'Script — nota 8/10'] },
                { icon: 'green', fa: 'fa-graduation-cap', title: 'Treinamentos', stat: '1', label: 'Recomendado pela IA', list: ['Trilha: Comunicação empática', 'Prazo: 3 dias'] },
                { icon: 'purple', fa: 'fa-bullseye', title: 'Metas do dia', stat: '68%', label: 'FCR parcial', list: ['Meta: 12 tickets', 'Realizado: 8', 'NPS médio: 4.6'] }
            ],
            supervisor: [
                { icon: 'red', fa: 'fa-exclamation-triangle', title: 'SLA em risco', stat: '5', label: 'Escalonar agora', list: ['Equipe N1: 3 tickets', 'Equipe N2: 2 tickets'] },
                { icon: 'blue', fa: 'fa-users', title: 'Agentes online', stat: '14', label: 'de 18 escalados', list: ['Maior fila: Ana (6)', 'Menor fila: Carlos (1)'] },
                { icon: 'green', fa: 'fa-chart-line', title: 'Performance equipe', stat: '87%', label: 'SLA cumprido hoje', list: ['TMA: 4m 12s', 'NPS: 4.3'] },
                { icon: 'orange', fa: 'fa-route', title: 'Roteamento', stat: 'Auto', label: 'Inteligente ativo', list: ['12 redistribuídos hoje', '3 escalonamentos'] }
            ],
            monitoria: [
                { icon: 'blue', fa: 'fa-headphones', title: 'Fila avaliação', stat: '9', label: 'Aguardando', list: ['5 ligações', '4 chats'] },
                { icon: 'green', fa: 'fa-star', title: 'Média hoje', stat: '8.2', label: 'Qualidade', list: ['Melhor: Maria 9.5', 'Atenção: João 6.8'] },
                { icon: 'orange', fa: 'fa-comment-dots', title: 'Feedbacks', stat: '6', label: 'Enviados', list: ['Todos visíveis no painel do agente'] }
            ],
            treinamento: [
                { icon: 'purple', fa: 'fa-book', title: 'Trilhas ativas', stat: '4', label: 'Em andamento', list: ['Comunicação empática — 12 agentes', 'Produto X — 8 agentes'] },
                { icon: 'orange', fa: 'fa-robot', title: 'IA recomenda', stat: '7', label: 'Novas sugestões', list: ['Baseado em monitoria e volume'] }
            ],
            gestao: [
                { icon: 'blue', fa: 'fa-tachometer-alt', title: 'Volume hoje', stat: '342', label: '+12% vs ontem', list: ['Canal top: WhatsApp'] },
                { icon: 'green', fa: 'fa-smile', title: 'NPS', stat: '72', label: 'Últimos 7 dias', list: ['CSAT: 4.4/5'] },
                { icon: 'red', fa: 'fa-fire', title: 'Reclamações', stat: '28%', label: 'Mapa de calor', list: ['Produto A — cobrança'] }
            ]
        };

        return (common[role] || common.agente).map(c => `
            <div class="eco-card">
                <div class="eco-card-header">
                    <div class="eco-card-icon ${c.icon}"><i class="fas ${c.fa}"></i></div>
                    <h4>${c.title}</h4>
                </div>
                <div class="eco-stat">${c.stat}</div>
                <div class="eco-stat-label">${c.label}</div>
                <ul class="eco-list">${c.list.map(i => `<li><i class="fas fa-chevron-right" style="color:#ccc;font-size:0.65rem;margin-top:0.2rem;"></i> ${i}</li>`).join('')}</ul>
            </div>
        `).join('');
    }

    function renderQuickRegister() {
        return `
            <div class="eco-quick-register" id="ecoQuickRegister">
                <h4><i class="fas fa-bolt"></i> Registro rápido — formulário adaptativo</h4>
                <div class="eco-qr-steps">
                    <span class="eco-qr-step active" data-step="1">1. Canal</span>
                    <span class="eco-qr-step" data-step="2">2. Tipo</span>
                    <span class="eco-qr-step" data-step="3">3. Produto</span>
                    <span class="eco-qr-step" data-step="4">4. Motivo</span>
                </div>
                <div class="eco-qr-fields" id="ecoQrFields"></div>
                <div class="eco-qr-suggestion" id="ecoQrSuggestion" style="display:none;"></div>
            </div>
        `;
    }

    function bindQuickRegister() {
        const fields = document.getElementById('ecoQrFields');
        if (!fields) return;
        const state = { canal: '', tipo: '', produto: '', motivo: '' };

        function renderStep() {
            const step = !state.canal ? 1 : !state.tipo ? 2 : !state.produto ? 3 : 4;
            document.querySelectorAll('.eco-qr-step').forEach(s => {
                const n = +s.dataset.step;
                s.classList.toggle('active', n === step);
                s.classList.toggle('done', n < step);
            });

            const options = {
                1: { key: 'canal', label: 'Canal', opts: ['Telefone', 'WhatsApp', 'E-mail', 'Chat'] },
                2: { key: 'tipo', label: 'Tipo de contato', opts: ['Reclamação', 'Suporte', 'Vendas', 'Cancelamento'] },
                3: { key: 'produto', label: 'Produto', opts: ['Produto A', 'Produto B', 'Produto C', 'Serviço Premium'] },
                4: { key: 'motivo', label: 'Motivo (Velohub)', opts: getVelohubMotivos(state.tipo, state.produto) }
            };
            const cur = options[step];
            fields.innerHTML = `
                <div><label>${cur.label}</label>
                <select id="ecoQrSelect"><option value="">Selecione...</option>
                ${cur.opts.map(o => `<option value="${o}">${o}</option>`).join('')}</select></div>
            `;
            fields.querySelector('select').onchange = (e) => {
                state[cur.key] = e.target.value;
                if (step < 4) renderStep();
                else showQrSuggestion(state);
            };
        }
        renderStep();
    }

    function getVelohubMotivos(tipo, produto) {
        const t = VELHOHUB_TREE[tipo];
        if (!t) return ['Outros', 'Informação geral'];
        const sub = t[produto?.includes('Produto') ? 'Produto' : Object.keys(t)[0]];
        return sub || Object.values(t).flat();
    }

    function showQrSuggestion(state) {
        const el = document.getElementById('ecoQrSuggestion');
        if (!el) return;
        const raw = `Cliente entrou via ${state.canal} referente a ${state.tipo} do ${state.produto}. Motivo: ${state.motivo}. Nossa equipe está verificando e retornará em breve.`;
        const revised = applyBrandTone(raw);
        el.style.display = 'block';
        el.innerHTML = `<strong><i class="fas fa-robot"></i> IA sugere texto do ticket (revisado):</strong><br>${revised}
            <div style="margin-top:0.5rem;"><button type="button" class="btn-primary btn-sm" id="ecoQrCopyBtn">Copiar texto</button></div>`;
        const copyBtn = document.getElementById('ecoQrCopyBtn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(revised);
                if (typeof showNotification === 'function') showNotification('Texto copiado!', 'success');
            };
        }
    }

    function renderCallSimulation() {
        return `
            <div class="eco-call-sim">
                <span class="pulse"></span> <strong>Simulação — Atendimento IA em ligação</strong>
                <p style="margin:0.5rem 0 0;opacity:0.9;">Árvore de motivos, próxima ação e texto sugerido aparecem no painel IA (botão inferior direito).</p>
            </div>
        `;
    }

    function ecoEsc(text) {
        if (typeof escapeHtml === 'function') return escapeHtml(text);
        const d = document.createElement('div');
        d.textContent = text == null ? '' : String(text);
        return d.innerHTML;
    }

    function collectTicketAnalytics() {
        const kanbanColumns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let tickets = [];
        kanbanColumns.forEach(box => {
            if (Array.isArray(box.tickets)) tickets = tickets.concat(box.tickets);
        });
        const stats = typeof calculateTicketStats === 'function'
            ? calculateTicketStats(tickets)
            : { total: tickets.length, byStatus: {}, byPriority: {}, byResponsible: {}, new: 0, inProgress: 0, pending: 0, resolved: 0, today: 0, avgResolutionTime: 0, avgRating: 0, withRating: 0 };

        const now = Date.now();
        const openTickets = tickets.filter(t => {
            const s = (t.status || 'novo').replace('em-aberto', 'em-andamento').replace('novos', 'novo');
            return !['resolvido', 'fechado'].includes(s);
        });

        const slaRisk = { critical: [], warning: [], ok: 0 };
        openTickets.forEach(t => {
            const created = t.createdAt ? new Date(t.createdAt).getTime() : now;
            const hoursOpen = (now - created) / (1000 * 60 * 60);
            const prio = (t.priority || 'normal').toLowerCase();
            const limit = prio === 'urgente' || prio === 'alta' ? 4 : prio === 'media' || prio === 'média' ? 8 : 24;
            const item = { id: t.id, title: t.title || 'Sem título', hours: hoursOpen, agent: t.responsibleAgent || 'Não atribuído', priority: prio };
            if (hoursOpen >= limit) slaRisk.critical.push(item);
            else if (hoursOpen >= limit * 0.75) slaRisk.warning.push(item);
            else slaRisk.ok++;
        });

        const byChannel = { telefone: 0, whatsapp: 0, email: 0, chat: 0, outro: 0 };
        tickets.forEach(t => {
            const ch = (t.channel || t.origin || t.source || '').toLowerCase();
            if (ch.includes('whats')) byChannel.whatsapp++;
            else if (ch.includes('mail') || ch.includes('email')) byChannel.email++;
            else if (ch.includes('chat')) byChannel.chat++;
            else if (ch.includes('tel') || ch.includes('phone') || ch.includes('lig')) byChannel.telefone++;
            else {
                const mod = tickets.length ? (t.id % 4) : 0;
                if (mod === 0) byChannel.whatsapp++;
                else if (mod === 1) byChannel.telefone++;
                else if (mod === 2) byChannel.email++;
                else byChannel.chat++;
            }
        });

        const byHour = Array(12).fill(0);
        tickets.forEach(t => {
            if (!t.createdAt) return;
            const h = new Date(t.createdAt).getHours();
            const slot = Math.min(11, Math.floor(h / 2));
            byHour[slot]++;
        });
        const maxHour = Math.max(...byHour, 1);

        const agents = Object.entries(stats.byResponsible || {})
            .filter(([name]) => name && name !== 'Não atribuído')
            .map(([name, count]) => ({ name, count, resolved: Math.round(count * 0.6), score: (7.5 + (name.length % 3) * 0.5).toFixed(1) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        const motivos = {};
        tickets.forEach(t => {
            const m = t.tabulacao || t.category || t.motivo || (t.title ? t.title.split(' ').slice(0, 2).join(' ') : 'Outros');
            motivos[m] = (motivos[m] || 0) + 1;
        });
        const topMotivos = Object.entries(motivos).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const maxMotivo = topMotivos[0]?.[1] || 1;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const teamOnline = Math.max(1, users.filter(u => u.active !== false).length);
        const fcr = stats.resolved && stats.total ? Math.round((stats.resolved / stats.total) * 100) : 78;
        const slaPct = stats.total ? Math.round(((stats.total - slaRisk.critical.length) / stats.total) * 100) : 91;
        const tmaMin = stats.avgResolutionTime ? Math.round(stats.avgResolutionTime * 60) : 4;
        const tmaStr = stats.avgResolutionTime ? `${Math.floor(tmaMin)}m ${String(Math.round((stats.avgResolutionTime % 1) * 60)).padStart(2, '0')}s` : '4m 12s';
        const nps = stats.avgRating ? Math.round(stats.avgRating * 14 + 2) : 72;

        return {
            tickets, stats, openTickets, slaRisk, byChannel, byHour, maxHour,
            agents, topMotivos, maxMotivo, teamOnline, fcr, slaPct, tmaStr, nps
        };
    }

    function renderStatusBars(stats) {
        const rows = [
            { key: 'novo', label: 'Novos', cls: 'novo', val: stats.new || stats.byStatus?.novo || 0 },
            { key: 'andamento', label: 'Em andamento', cls: 'andamento', val: stats.inProgress || stats.byStatus?.['em-andamento'] || 0 },
            { key: 'pendente', label: 'Pendentes', cls: 'pendente', val: stats.pending || stats.byStatus?.pendente || 0 },
            { key: 'resolvido', label: 'Resolvidos', cls: 'resolvido', val: stats.resolved || 0 }
        ];
        const max = Math.max(...rows.map(r => r.val), 1);
        return rows.map(r => `
            <div class="eco-status-row">
                <span class="eco-status-label">${r.label}</span>
                <div class="eco-status-track"><div class="eco-status-fill ${r.cls}" style="width:${Math.round((r.val / max) * 100)}%"></div></div>
                <span class="eco-status-count">${r.val}</span>
            </div>
        `).join('');
    }

    function renderChannelRows(byChannel, total) {
        const channels = [
            { key: 'whatsapp', label: 'WhatsApp', icon: 'fab fa-whatsapp', cls: 'whatsapp' },
            { key: 'telefone', label: 'Telefone', icon: 'fas fa-phone', cls: 'phone' },
            { key: 'email', label: 'E-mail', icon: 'fas fa-envelope', cls: 'email' },
            { key: 'chat', label: 'Chat', icon: 'fas fa-comments', cls: 'chat' }
        ];
        const sum = total || Object.values(byChannel).reduce((a, b) => a + b, 0) || 1;
        return channels.map(c => {
            const n = byChannel[c.key] || 0;
            const pct = Math.round((n / sum) * 100);
            return `
                <div class="eco-channel-row">
                    <span class="eco-channel-icon ${c.cls}"><i class="${c.icon}"></i></span>
                    <span style="width:72px;">${c.label}</span>
                    <div class="eco-channel-bar"><div style="width:${pct}%"></div></div>
                    <strong style="width:36px;text-align:right;font-size:0.8rem;">${n}</strong>
                    <span style="font-size:0.72rem;color:#94a3b8;width:32px;">${pct}%</span>
                </div>
            `;
        }).join('');
    }

    function renderSlaTable(slaRisk) {
        const items = [...slaRisk.critical, ...slaRisk.warning].slice(0, 8);
        if (!items.length) {
            return '<p style="font-size:0.82rem;color:#64748b;">Nenhum ticket em risco de SLA no momento.</p>';
        }
        return `<table class="eco-data-table"><thead><tr><th>Ticket</th><th>Agente</th><th>Aberto</th><th>Prior.</th></tr></thead><tbody>
            ${items.map(t => `
                <tr>
                    <td><span class="ticket-link" onclick="typeof openTicket==='function'&&openTicket(${t.id})">#${t.id}</span> ${ecoEsc((t.title || '').slice(0, 28))}</td>
                    <td>${ecoEsc(t.agent)}</td>
                    <td><span class="eco-tag ${t.hours >= 8 ? 'critical' : 'warning'}">${Math.round(t.hours)}h</span></td>
                    <td>${ecoEsc(t.priority)}</td>
                </tr>
            `).join('')}
        </tbody></table>`;
    }

    function renderAgentTable(agents) {
        if (!agents.length) {
            return '<p style="font-size:0.82rem;color:#64748b;">Atribua tickets aos agentes para ver performance aqui.</p>';
        }
        return `<table class="eco-data-table"><thead><tr><th>Agente</th><th>Em fila</th><th>Resolvidos</th><th>Qualidade</th></tr></thead><tbody>
            ${agents.map((a, i) => `
                <tr>
                    <td>${i + 1}. ${ecoEsc(a.name)} ${i === 0 ? '<span class="eco-tag ok">Top</span>' : ''}</td>
                    <td>${a.count}</td>
                    <td>${a.resolved}</td>
                    <td><strong>${a.score}</strong>/10</td>
                </tr>
            `).join('')}
        </tbody></table>`;
    }

    function renderHourBars(byHour, maxHour) {
        const labels = ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
        return `<div class="eco-bar-chart">${byHour.map((v, i) => `
            <div class="eco-bar-col">
                <div class="eco-bar-fill" style="height:${Math.max(8, Math.round((v / maxHour) * 100))}%"></div>
                <span class="eco-bar-label">${labels[i]}</span>
            </div>
        `).join('')}</div>`;
    }

    function renderMotivoHeatmap(topMotivos, maxMotivo) {
        if (!topMotivos.length) {
            return '<p style="font-size:0.82rem;color:#64748b;">Registre tickets com tabulação para ver motivos.</p>';
        }
        return topMotivos.map(([label, count], i) => {
            const intensity = Math.min(5, Math.ceil((count / maxMotivo) * 5));
            return `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;font-size:0.8rem;">
                <div class="eco-heatmap-cell h${intensity}" style="width:28px;height:28px;flex-shrink:0;">${count}</div>
                <span style="flex:1;">${ecoEsc(label)}</span>
                <span style="color:#64748b;">${Math.round((count / (topMotivos.reduce((s, m) => s + m[1], 0) || 1)) * 100)}%</span>
            </div>`;
        }).join('');
    }

    function initAnalyticsCharts(data) {
        if (typeof Chart === 'undefined') return;
        const canvas = document.getElementById('ecoAnalyticsTrendChart');
        if (!canvas) return;
        if (window._ecoAnalyticsChart) {
            window._ecoAnalyticsChart.destroy();
        }
        const labels = ['0–2h', '2–4h', '4–6h', '6–8h', '8–10h', '10–12h', '12–14h', '14–16h', '16–18h', '18–20h', '20–22h', '22–24h'];
        window._ecoAnalyticsChart = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tickets abertos',
                    data: data.byHour,
                    borderColor: '#3333aa',
                    backgroundColor: 'rgba(51, 51, 170, 0.1)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function loadAnalyticsV3() {
        const el = document.getElementById('analyticsV3Content');
        if (!el) return;

        const data = collectTicketAnalytics();
        const role = currentProfile;
        const isGestao = role === 'gestao';
        const heroTitle = isGestao ? 'Inteligência analítica da central' : 'Monitoramento operacional em tempo real';
        const heroDesc = isGestao
            ? 'Visão executiva de volume, SLA, qualidade e motivos — baseada nos tickets registrados na operação.'
            : 'Acompanhe fila, riscos de SLA, desempenho da equipe e gargalos de atendimento via tickets.';

        const monitoriaScores = [
            { label: 'Empatia e tom', score: 8.4, trend: '+0.3' },
            { label: 'Aderência ao script', score: 7.9, trend: '-0.2' },
            { label: 'Resolução no 1º contato', score: 8.1, trend: '+0.5' },
            { label: 'Registro no ticket', score: 7.6, trend: '0' },
            { label: 'Tempo de resposta', score: 8.7, trend: '+0.4' }
        ];

        el.innerHTML = `
            <div class="eco-analytics-hero">
                <div>
                    <h3><i class="fas fa-chart-pie"></i> Analytics+ · ${isGestao ? 'Gestão' : 'Supervisão'}</h3>
                    <p>${heroDesc}</p>
                    <p style="font-size:0.75rem;opacity:0.8;margin-top:0.35rem;"><i class="fas fa-sync-alt"></i> Atualizado agora · ${data.stats.total} tickets na base</p>
                </div>
                <div class="eco-analytics-hero-actions">
                    <button type="button" class="btn-secondary" onclick="VelodeskEco.loadAnalyticsV3()"><i class="fas fa-sync-alt"></i> Atualizar</button>
                    <button type="button" class="btn-secondary" onclick="typeof navigateToPage==='function'&&navigateToPage('tickets')"><i class="fas fa-ticket-alt"></i> Ver fila</button>
                </div>
            </div>

            <div class="eco-analytics-kpis">
                <div class="eco-kpi-pill desk-stagger-in"><div class="val">${data.tmaStr}</div><div class="lbl">TMA</div><div class="delta down">▼ 8% vs ontem</div></div>
                <div class="eco-kpi-pill"><div class="val">1m 08s</div><div class="lbl">TME</div><div class="delta up">▲ fila estável</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.fcr}%</div><div class="lbl">FCR</div><div class="delta ${data.fcr >= 75 ? 'up' : 'down'}">${data.fcr >= 75 ? '▲ meta OK' : '▼ abaixo meta'}</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.nps}</div><div class="lbl">NPS</div><div class="delta up">▲ +3 pts</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.slaPct}%</div><div class="lbl">SLA cumprido</div><div class="delta ${data.slaRisk.critical.length ? 'down' : 'up'}">${data.slaRisk.critical.length ? data.slaRisk.critical.length + ' críticos' : 'Sem estouro'}</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.stats.today || data.stats.total}</div><div class="lbl">Volume hoje</div><div class="delta neutral">${data.openTickets.length} abertos</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.openTickets.length}</div><div class="lbl">Backlog</div><div class="delta warn">${data.slaRisk.warning.length} em alerta</div></div>
                <div class="eco-kpi-pill"><div class="val">${data.teamOnline}</div><div class="lbl">Equipe ativa</div><div class="delta neutral">na operação</div></div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-broadcast-tower"></i> Pulso da central</div>
                <div class="eco-central-pulse">
                    <div class="eco-pulse-item ${data.slaRisk.critical.length ? 'alert' : 'ok'}"><div class="num">${data.slaRisk.critical.length}</div><div class="lbl">SLA crítico</div></div>
                    <div class="eco-pulse-item warn"><div class="num">${data.slaRisk.warning.length}</div><div class="lbl">SLA alerta</div></div>
                    <div class="eco-pulse-item"><div class="num">${data.stats.new || 0}</div><div class="lbl">Novos aguardando</div></div>
                    <div class="eco-pulse-item ok"><div class="num">${data.stats.resolved || 0}</div><div class="lbl">Resolvidos</div></div>
                </div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-layer-group"></i> Operação por tickets</div>
                <div class="eco-analytics-grid-2">
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-columns"></i> Distribuição por status</h4>
                        <div class="eco-status-bars">${renderStatusBars(data.stats)}</div>
                        <p style="font-size:0.75rem;color:#64748b;margin-top:0.75rem;">Baseado nos tickets nas caixas do Kanban</p>
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-exclamation-triangle"></i> SLA em risco — ação imediata</h4>
                        ${renderSlaTable(data.slaRisk)}
                    </div>
                </div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-random"></i> Canais e volume</div>
                <div class="eco-analytics-grid-2">
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-share-alt"></i> Registros por canal</h4>
                        ${renderChannelRows(data.byChannel, data.stats.total)}
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-clock"></i> Volume por período (hoje)</h4>
                        ${renderHourBars(data.byHour, data.maxHour)}
                        <p style="font-size:0.72rem;color:#64748b;margin-top:0.5rem;">Picos indicam necessidade de reforço na escala</p>
                    </div>
                </div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-sitemap"></i> Motivos e reclamações (tabulação)</div>
                <div class="eco-analytics-grid-2">
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-fire"></i> Mapa de motivos nos tickets</h4>
                        ${renderMotivoHeatmap(data.topMotivos, data.maxMotivo)}
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-chart-area"></i> ${isGestao ? 'Previsão de volume' : 'Tendência da fila'}</h4>
                        <p style="font-size:0.82rem;margin-bottom:0.65rem;">${isGestao
                            ? 'Pico previsto: <strong>sexta 14h–17h</strong> (+23%). Recomendação: +2 agentes N1.'
                            : 'Crescimento de <strong>+' + Math.min(23, data.openTickets.length * 2) + '%</strong> em tickets abertos vs. média da semana.'}</p>
                        <div class="eco-heatmap" style="margin-top:0.5rem;">
                            ${['Cobrança', 'Entrega', 'Suporte', 'Cancel.', 'Outros'].map((l, i) =>
                                `<div class="eco-heatmap-cell h${5 - i}" title="${l}">${l}</div>`).join('')}
                        </div>
                        <p style="font-size:0.72rem;color:#64748b;margin-top:0.5rem;">Cruzamento motivo × produto × canal (Velohub)</p>
                    </div>
                </div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-users"></i> Equipe e monitoria analítica</div>
                <div class="eco-analytics-grid-3">
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-trophy"></i> Performance por agente</h4>
                        ${renderAgentTable(data.agents)}
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-clipboard-check"></i> Qualidade (monitoria)</h4>
                        ${monitoriaScores.map(m => {
                            const cls = m.score >= 8.2 ? 'high' : m.score >= 7.5 ? 'mid' : 'low';
                            return `<div class="eco-monitor-score">
                                <div class="eco-score-ring ${cls}">${m.score}</div>
                                <div style="flex:1;">
                                    <div style="font-size:0.82rem;font-weight:600;">${m.label}</div>
                                    <div style="font-size:0.72rem;color:#64748b;">${m.trend !== '0' ? 'vs. semana: ' + m.trend : 'estável'}</div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-smile"></i> CSAT / NPS pós-ticket</h4>
                        <div class="eco-pulse-item ok" style="margin-bottom:0.75rem;"><div class="num">${data.nps}</div><div class="lbl">NPS estimado</div></div>
                        <ul class="eco-list">
                            <li><span class="eco-tag ok">Bom</span> ${Math.round((data.stats.withRating || 12) * 0.6)} avaliações</li>
                            <li><span class="eco-tag warning">Neutro</span> ${Math.round((data.stats.withRating || 8) * 0.25)} avaliações</li>
                            <li><span class="eco-tag critical">Ruim</span> ${Math.round((data.stats.withRating || 5) * 0.15)} avaliações</li>
                        </ul>
                        <p style="font-size:0.72rem;color:#64748b;margin-top:0.5rem;">Disparo automático ao fechar ticket (WhatsApp/e-mail)</p>
                    </div>
                </div>
            </div>

            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-chart-line"></i> Tendência do dia</div>
                <div class="eco-analytics-card">
                    <div class="eco-analytics-canvas-wrap">
                        <canvas id="ecoAnalyticsTrendChart"></canvas>
                    </div>
                </div>
            </div>

            ${isGestao ? `
            <div class="eco-analytics-section">
                <div class="eco-analytics-section-title"><i class="fas fa-chess"></i> Indicadores estratégicos</div>
                <div class="eco-analytics-grid-3">
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-route"></i> Roteamento inteligente</h4>
                        <p style="font-size:0.82rem;">${Math.round(data.stats.total * 0.35)} tickets redistribuídos hoje por skill/produto</p>
                        <p style="font-size:0.75rem;color:#64748b;">Redução de 18% no tempo médio de fila N1</p>
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-level-up-alt"></i> Escalonamentos</h4>
                        <p style="font-size:0.82rem;"><strong>${data.slaRisk.critical.length + 2}</strong> tickets escalados ao supervisor</p>
                        <p style="font-size:0.75rem;color:#64748b;">Regra: SLA + palavras-chave críticas</p>
                    </div>
                    <div class="eco-analytics-card">
                        <h4><i class="fas fa-robot"></i> Automações ativas</h4>
                        <p style="font-size:0.82rem;">${(JSON.parse(localStorage.getItem('automationRules')||'[]')).length || 3} regras em execução</p>
                        <p style="font-size:0.75rem;color:#64748b;">Fechamento auto: ${Math.round(data.stats.resolved * 0.12)} tickets/semana</p>
                    </div>
                </div>
            </div>` : ''}
        `;

        initAnalyticsCharts(data);
        if (window.DeskExperience?.staggerChildren) window.DeskExperience.staggerChildren(el);
    }

    function loadMonitoriaPage() {
        const el = document.getElementById('monitoriaPageContent');
        if (!el) return;
        const queue = [
            { id: 1, agent: 'João Silva', type: 'Ligação', dur: '4:32', ticket: '#1042' },
            { id: 2, agent: 'Maria Santos', type: 'Chat', dur: '12 msgs', ticket: '#1038' },
            { id: 3, agent: 'Ana Costa', type: 'Ligação', dur: '6:15', ticket: '#1035' }
        ];
        el.innerHTML = `
            <div class="eco-monitoria-layout">
                <div class="eco-monitoria-queue">
                    <h4 style="margin:0 0 0.75rem;font-size:0.9rem;">Fila para avaliar</h4>
                    ${queue.map((q, i) => `
                        <div class="eco-monitoria-item ${i === 0 ? 'active' : ''}" data-id="${q.id}">
                            <strong>${q.ticket}</strong> — ${q.agent}<br>
                            <small>${q.type} · ${q.dur}</small>
                        </div>
                    `).join('')}
                </div>
                <div class="eco-card">
                    <h4>Avaliação — Ticket #1042</h4>
                    <p style="font-size:0.85rem;color:#666;">Ouça, pontue e gere feedback (aparece no painel do agente).</p>
                    <div class="eco-score-grid">
                        ${['Empatia', 'Script', 'Resolução'].map(s => `
                            <div class="eco-score-item"><label>${s}</label><input type="range" min="0" max="10" value="7"></div>
                        `).join('')}
                    </div>
                    <textarea rows="3" class="form-textarea" placeholder="Feedback para o agente..." style="width:100%;margin-bottom:0.75rem;"></textarea>
                    <button type="button" class="btn-primary" onclick="typeof showNotification==='function'&&showNotification('Feedback enviado ao painel do agente!','success')">
                        <i class="fas fa-paper-plane"></i> Enviar feedback
                    </button>
                    <p style="font-size:0.75rem;color:#666;margin-top:0.75rem;"><i class="fas fa-graduation-cap"></i> IA recomendará trilha "Comunicação empática" com base nesta nota.</p>
                </div>
            </div>
        `;
        el.querySelectorAll('.eco-monitoria-item').forEach(item => {
            item.onclick = () => {
                el.querySelectorAll('.eco-monitoria-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            };
        });
        if (window.DeskExperience?.staggerChildren) window.DeskExperience.staggerChildren(el);
    }

    let portalActiveTab = 'overview';
    let portalPreviewMode = 'agent';

    function loadPortalCliente() {
        const el = document.getElementById('portalClienteContent');
        if (!el) return;

        const CP = window.VelodeskClientPortal;
        if (!CP) {
            el.innerHTML = '<p class="eco-portal-empty">Carregando perfis de clientes…</p>';
            return;
        }
        CP.seedClientProfiles(false);

        const profiles = CP.getClientProfiles();
        const activeId = CP.getActiveClientId();
        const client = CP.getClientById(activeId) || profiles[0];

        el.innerHTML = `
            <div class="eco-portal-shell">
                <aside class="eco-portal-sidebar">
                    <div class="eco-portal-sidebar-head">
                        <h3><i class="fas fa-users"></i> Perfis de cliente</h3>
                        <span class="eco-tag info">${profiles.length} cadastros</span>
                    </div>
                    <p class="eco-portal-sidebar-hint">Selecione um perfil para visualizar o portal self-service e a ficha 360°.</p>
                    <div class="eco-portal-client-list">
                        ${profiles.map(p => renderPortalClientCard(p, p.id === client.id)).join('')}
                    </div>
                </aside>
                <main class="eco-portal-main">
                    ${renderPortalClientHeader(client, CP)}
                    <div class="eco-portal-mode-toggle">
                        <button type="button" class="eco-portal-mode-btn ${portalPreviewMode === 'agent' ? 'active' : ''}" data-mode="agent">
                            <i class="fas fa-headset"></i> Visão agente (360°)
                        </button>
                        <button type="button" class="eco-portal-mode-btn ${portalPreviewMode === 'client' ? 'active' : ''}" data-mode="client">
                            <i class="fas fa-mobile-alt"></i> Preview portal cliente
                        </button>
                    </div>
                    ${portalPreviewMode === 'client' ? renderPortalClientPreview(client, CP) : renderPortalAgentView(client, CP)}
                </main>
            </div>
        `;

        el.querySelectorAll('.eco-portal-client-card').forEach(card => {
            card.onclick = () => {
                CP.setActiveClientId(card.dataset.clientId);
                loadPortalCliente();
            };
        });
        el.querySelectorAll('.eco-portal-mode-btn').forEach(btn => {
            btn.onclick = () => {
                portalPreviewMode = btn.dataset.mode;
                loadPortalCliente();
            };
        });
        el.querySelectorAll('.eco-portal-tab').forEach(tab => {
            tab.onclick = () => {
                portalActiveTab = tab.dataset.tab;
                loadPortalCliente();
            };
        });
        el.querySelectorAll('[data-portal-action]').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.portalAction;
                const msgs = {
                    'new-ticket': 'Nova solicitação aberta no portal (simulação)',
                    'pay': 'Redirecionamento para pagamento (simulação)',
                    'kb': 'Base de conhecimento aberta (simulação)',
                    'chat': 'Chat iniciado com atendimento (simulação)'
                };
                if (typeof showNotification === 'function') showNotification(msgs[action] || 'Ação simulada', 'info');
            };
        });

        if (window.DeskExperience?.staggerChildren) window.DeskExperience.staggerChildren(el);
    }

    function renderPortalClientCard(p, active) {
        const statusClass = p.accountStatus === 'ativo' ? 'ok' : (p.accountStatus === 'inadimplente' ? 'critical' : 'warning');
        return `
            <button type="button" class="eco-portal-client-card ${active ? 'active' : ''}" data-client-id="${p.id}">
                <span class="eco-portal-avatar" style="background:${p.avatarColor}">${p.photoInitials}</span>
                <span class="eco-portal-client-card-body">
                    <strong>${p.socialName || p.fullName}</strong>
                    <small>${p.contract?.plan || p.segment}</small>
                    <span class="eco-tag ${statusClass}">${p.accountStatus}</span>
                </span>
            </button>
        `;
    }

    function renderPortalClientHeader(client, CP) {
        const tierClass = { Gold: 'warning', Platinum: 'info', Silver: 'info', Bronze: 'ok', Enterprise: 'critical' }[client.tier] || 'info';
        const churnClass = { baixo: 'ok', médio: 'warning', alto: 'critical' }[client.metrics?.churnRisk] || 'info';
        return `
            <header class="eco-portal-client-header">
                <div class="eco-portal-client-identity">
                    <span class="eco-portal-avatar lg" style="background:${client.avatarColor}">${client.photoInitials}</span>
                    <div>
                        <h3>${client.fullName} ${client.vip ? '<span class="eco-tag warning">VIP</span>' : ''}</h3>
                        <p>
                            <span class="eco-tag ${tierClass}">${client.tier}</span>
                            <span class="eco-tag info">${client.segment}</span>
                            <span class="eco-tag ${churnClass}">Churn ${client.metrics?.churnRisk}</span>
                        </p>
                        <p class="eco-portal-meta">
                            <i class="fas fa-id-card"></i> ${client.cpf || client.cnpj || '—'}
                            &nbsp;·&nbsp; Cliente desde ${CP.formatDate(client.customerSince)}
                            &nbsp;·&nbsp; Contrato ${client.contract?.number}
                        </p>
                    </div>
                </div>
                <div class="eco-portal-quick-stats">
                    <div class="eco-portal-stat"><span>${client.metrics?.openTickets || 0}</span><small>Abertos</small></div>
                    <div class="eco-portal-stat"><span>${client.metrics?.nps ?? '—'}</span><small>NPS</small></div>
                    <div class="eco-portal-stat"><span>${client.metrics?.csat ?? '—'}</span><small>CSAT</small></div>
                    <div class="eco-portal-stat"><span>${CP.formatCurrency(client.contract?.monthlyValue)}</span><small>Mensal</small></div>
                </div>
            </header>
        `;
    }

    function renderPortalAgentView(client, CP) {
        const tabs = [
            { id: 'overview', label: 'Visão geral', icon: 'fa-th-large' },
            { id: 'tickets', label: 'Chamados', icon: 'fa-ticket-alt' },
            { id: 'contract', label: 'Contrato', icon: 'fa-file-contract' },
            { id: 'billing', label: 'Financeiro', icon: 'fa-receipt' },
            { id: 'devices', label: 'Equipamentos', icon: 'fa-mobile-alt' },
            { id: 'history', label: 'Histórico', icon: 'fa-history' }
        ];
        const tabContent = {
            overview: renderPortalOverviewTab(client, CP),
            tickets: renderPortalTicketsTab(client, CP),
            contract: renderPortalContractTab(client, CP),
            billing: renderPortalBillingTab(client, CP),
            devices: renderPortalDevicesTab(client, CP),
            history: renderPortalHistoryTab(client, CP)
        };
        return `
            <nav class="eco-portal-tabs">
                ${tabs.map(t => `
                    <button type="button" class="eco-portal-tab ${portalActiveTab === t.id ? 'active' : ''}" data-tab="${t.id}">
                        <i class="fas ${t.icon}"></i> ${t.label}
                    </button>
                `).join('')}
            </nav>
            <div class="eco-portal-tab-panel">${tabContent[portalActiveTab] || tabContent.overview}</div>
        `;
    }

    function renderPortalOverviewTab(client, CP) {
        const addr = client.address;
        return `
            <div class="eco-portal-grid">
                <div class="eco-portal-card">
                    <h4><i class="fas fa-address-book"></i> Contato</h4>
                    <dl class="eco-portal-dl">
                        <dt>E-mail</dt><dd>${client.email}</dd>
                        <dt>Telefone principal</dt><dd>${client.phone}</dd>
                        <dt>Telefone secundário</dt><dd>${client.phoneSecondary || '—'}</dd>
                        <dt>Canal preferido</dt><dd>${client.preferredChannel}</dd>
                        <dt>Idioma</dt><dd>${client.preferredLanguage}</dd>
                        <dt>Melhor horário</dt><dd>${client.bestContactTime}</dd>
                    </dl>
                </div>
                <div class="eco-portal-card">
                    <h4><i class="fas fa-map-marker-alt"></i> Endereço</h4>
                    <dl class="eco-portal-dl">
                        <dt>Logradouro</dt><dd>${addr.street}${addr.complement ? ', ' + addr.complement : ''}</dd>
                        <dt>Bairro / Cidade</dt><dd>${addr.neighborhood} — ${addr.city}/${addr.state}</dd>
                        <dt>CEP</dt><dd>${addr.zip}</dd>
                        <dt>Tipo</dt><dd>${addr.type}</dd>
                    </dl>
                </div>
                <div class="eco-portal-card">
                    <h4><i class="fas fa-user-shield"></i> Dados pessoais</h4>
                    <dl class="eco-portal-dl">
                        <dt>Nome social</dt><dd>${client.socialName || '—'}</dd>
                        <dt>Data de nascimento</dt><dd>${client.birthDate ? CP.formatDate(client.birthDate) : '—'}</dd>
                        <dt>Gênero</dt><dd>${client.gender || '—'}</dd>
                        <dt>Nacionalidade</dt><dd>${client.nationality || '—'}</dd>
                        ${client.legalRep ? `<dt>Representante</dt><dd>${client.legalRep}</dd>` : ''}
                        <dt>LGPD</dt><dd>${client.lgpdConsent ? 'Consentimento em ' + CP.formatDate(client.lgpdConsentDate) : 'Pendente'}</dd>
                        <dt>Marketing</dt><dd>${client.marketingOptIn ? 'Aceita' : 'Não aceita'}</dd>
                    </dl>
                </div>
                <div class="eco-portal-card">
                    <h4><i class="fas fa-chart-line"></i> Métricas de relacionamento</h4>
                    <dl class="eco-portal-dl">
                        <dt>Total de chamados</dt><dd>${client.metrics?.totalTickets}</dd>
                        <dt>Resolvidos (90 dias)</dt><dd>${client.metrics?.resolvedLast90Days}</dd>
                        <dt>Tempo médio resolução</dt><dd>${client.metrics?.avgResolutionDays} dias</dd>
                        <dt>Lifetime value</dt><dd>${CP.formatCurrency(client.metrics?.lifetimeValue)}</dd>
                        <dt>Score crédito</dt><dd>${client.billing?.creditScore}</dd>
                    </dl>
                </div>
                <div class="eco-portal-card full">
                    <h4><i class="fas fa-tags"></i> Tags e observações</h4>
                    <div class="eco-portal-tags">${(client.tags || []).map(t => `<span class="eco-tag info">${t}</span>`).join('')}</div>
                    <p class="eco-portal-notes">${client.notes || '—'}</p>
                    ${client.accessibility ? `<p class="eco-portal-access"><i class="fas fa-universal-access"></i> ${client.accessibility}</p>` : ''}
                </div>
            </div>
        `;
    }

    function renderPortalTicketsTab(client, CP) {
        const statusMap = { 'em-andamento': 'warning', pendente: 'info', resolvido: 'ok' };
        const statusLabel = { 'em-andamento': 'Em andamento', pendente: 'Pendente', resolvido: 'Resolvido' };
        return `
            <div class="eco-portal-card">
                <div class="eco-portal-card-head">
                    <h4><i class="fas fa-ticket-alt"></i> Chamados do cliente</h4>
                    <button type="button" class="btn-primary btn-sm" data-portal-action="new-ticket"><i class="fas fa-plus"></i> Novo</button>
                </div>
                <table class="eco-portal-table">
                    <thead><tr><th>#</th><th>Assunto</th><th>Status</th><th>Prioridade</th><th>Canal</th><th>Agente</th><th>Atualizado</th></tr></thead>
                    <tbody>
                        ${(client.tickets || []).map(t => `
                            <tr>
                                <td><strong>#${t.id}</strong></td>
                                <td>${t.subject}</td>
                                <td><span class="eco-tag ${statusMap[t.status] || 'info'}">${statusLabel[t.status] || t.status}</span></td>
                                <td>${t.priority}</td>
                                <td>${t.channel}</td>
                                <td>${t.agent}</td>
                                <td>${CP.formatDateTime(t.updatedAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderPortalContractTab(client, CP) {
        const c = client.contract;
        const statusClass = c.status === 'ativo' ? 'ok' : 'warning';
        return `
            <div class="eco-portal-grid">
                <div class="eco-portal-card">
                    <h4><i class="fas fa-file-contract"></i> Plano contratado</h4>
                    <dl class="eco-portal-dl">
                        <dt>Plano</dt><dd><strong>${c.plan}</strong></dd>
                        <dt>Status</dt><dd><span class="eco-tag ${statusClass}">${c.status}</span></dd>
                        <dt>Nº contrato</dt><dd>${c.number}</dd>
                        <dt>Início</dt><dd>${CP.formatDate(c.since)}</dd>
                        <dt>Renovação</dt><dd>${CP.formatDate(c.renewal)}</dd>
                        <dt>Valor mensal</dt><dd>${CP.formatCurrency(c.monthlyValue)}</dd>
                        <dt>Pagamento</dt><dd>${c.paymentMethod}</dd>
                        <dt>Vencimento</dt><dd>Dia ${c.dueDay}</dd>
                        <dt>Débito automático</dt><dd>${c.autoDebit ? 'Sim' : 'Não'}</dd>
                        ${c.sla ? `<dt>SLA</dt><dd>${c.sla}</dd>` : ''}
                    </dl>
                </div>
                <div class="eco-portal-card">
                    <h4><i class="fas fa-sim-card"></i> Linhas (${(c.lines || []).length})</h4>
                    <ul class="eco-portal-lines">
                        ${(c.lines || []).map(l => `
                            <li>
                                <strong>${l.number}</strong>
                                <span>${l.type}${l.holder ? ' · Titular' : ''}</span>
                                ${l.dataLimitGb ? `<div class="eco-portal-data-bar"><div style="width:${Math.min(100, (l.dataUsedGb / l.dataLimitGb) * 100)}%"></div></div><small>${l.dataUsedGb} / ${l.dataLimitGb} GB</small>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="eco-portal-card full">
                    <h4><i class="fas fa-puzzle-piece"></i> Add-ons</h4>
                    <div class="eco-portal-tags">${(c.addons || []).map(a => `<span class="eco-tag ok">${a}</span>`).join('') || '<span class="eco-portal-muted">Nenhum add-on</span>'}</div>
                </div>
            </div>
        `;
    }

    function renderPortalBillingTab(client, CP) {
        const b = client.billing;
        const invStatusClass = { pago: 'ok', 'em aberto': 'warning', vencido: 'critical', 'a vencer': 'info' };
        return `
            <div class="eco-portal-grid">
                <div class="eco-portal-card">
                    <h4><i class="fas fa-wallet"></i> Situação financeira</h4>
                    <dl class="eco-portal-dl">
                        <dt>Saldo em aberto</dt><dd class="${b.currentBalance > 0 ? 'text-danger' : ''}"><strong>${CP.formatCurrency(b.currentBalance)}</strong></dd>
                        <dt>Limite de crédito</dt><dd>${CP.formatCurrency(b.creditLimit)}</dd>
                        <dt>Score</dt><dd>${b.creditScore}</dd>
                        <dt>Última fatura</dt><dd>${b.lastInvoice.id} — ${CP.formatCurrency(b.lastInvoice.amount)}</dd>
                        <dt>Vencimento</dt><dd>${CP.formatDate(b.lastInvoice.dueDate)}</dd>
                        <dt>Status</dt><dd><span class="eco-tag ${invStatusClass[b.lastInvoice.status] || 'info'}">${b.lastInvoice.status}</span></dd>
                    </dl>
                    ${b.currentBalance > 0 ? `<button type="button" class="btn-primary" data-portal-action="pay"><i class="fas fa-barcode"></i> Gerar 2ª via / Pagar</button>` : ''}
                </div>
                <div class="eco-portal-card wide">
                    <h4><i class="fas fa-history"></i> Histórico de faturas</h4>
                    <table class="eco-portal-table">
                        <thead><tr><th>Fatura</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
                        <tbody>
                            ${(b.invoices || []).map(inv => `
                                <tr>
                                    <td>${inv.id}</td>
                                    <td>${CP.formatCurrency(inv.amount)}</td>
                                    <td>${CP.formatDate(inv.dueDate)}</td>
                                    <td><span class="eco-tag ${invStatusClass[inv.status] || 'info'}">${inv.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderPortalDevicesTab(client, CP) {
        return `
            <div class="eco-portal-card">
                <h4><i class="fas fa-mobile-alt"></i> Equipamentos vinculados</h4>
                <div class="eco-portal-devices">
                    ${(client.devices || []).map(d => `
                        <div class="eco-portal-device">
                            <div class="eco-portal-device-icon"><i class="fas ${d.imei ? 'fa-mobile-alt' : 'fa-server'}"></i></div>
                            <div>
                                <strong>${d.name}</strong>
                                <small>${d.imei ? 'IMEI: ' + d.imei : 'S/N: ' + d.serial}</small>
                                <small>Adquirido: ${CP.formatDate(d.acquiredAt)} · Garantia: ${d.warrantyUntil ? CP.formatDate(d.warrantyUntil) : 'N/A'}</small>
                                <span class="eco-tag ${d.status === 'ativo' ? 'ok' : 'warning'}">${d.status}</span>
                                ${d.financed ? '<span class="eco-tag info">Financiado</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderPortalHistoryTab(client, CP) {
        const typeIcon = { WhatsApp: 'fa-whatsapp', Telefone: 'fa-phone', 'Ligação': 'fa-phone', 'E-mail': 'fa-envelope', Chat: 'fa-comments', App: 'fa-mobile-alt', Portal: 'fa-globe', 'Reunião': 'fa-users', SMS: 'fa-sms' };
        return `
            <div class="eco-portal-card">
                <h4><i class="fas fa-stream"></i> Interações recentes</h4>
                <ul class="eco-portal-timeline">
                    ${(client.interactions || []).map(i => `
                        <li>
                            <span class="eco-portal-timeline-icon"><i class="${i.type === 'WhatsApp' ? 'fab' : 'fas'} ${typeIcon[i.type] || 'fa-circle'}"></i></span>
                            <div>
                                <strong>${i.type}</strong> · ${CP.formatDateTime(i.date)}
                                ${i.duration ? `<span class="eco-portal-muted">(${i.duration})</span>` : ''}
                                <p>${i.summary}</p>
                                <small>Agente: ${i.agent}</small>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    function renderPortalClientPreview(client, CP) {
        const openTickets = (client.tickets || []).filter(t => t.status !== 'resolvido');
        const statusMap = { 'em-andamento': 'warning', pendente: 'info', resolvido: 'ok' };
        const statusLabel = { 'em-andamento': 'Em andamento', pendente: 'Pendente', resolvido: 'Resolvido' };
        return `
            <div class="eco-portal-preview-wrap">
                <p class="eco-portal-preview-label"><i class="fas fa-eye"></i> Simulação do que <strong>${client.socialName || client.fullName}</strong> vê no app</p>
                <div class="eco-portal-preview eco-portal-preview-rich">
                    <div class="portal-header">
                        <span class="eco-portal-avatar sm" style="background:${client.avatarColor}">${client.photoInitials}</span>
                        <div>
                            <h3 style="margin:0;">Olá, ${client.socialName || client.fullName.split(' ')[0]}!</h3>
                            <p style="margin:0.2rem 0 0;opacity:0.9;font-size:0.8rem;">${client.contract?.plan}</p>
                        </div>
                    </div>
                    <div class="eco-portal-preview-summary">
                        <div><span>${openTickets.length}</span><small>Chamados abertos</small></div>
                        <div><span>${CP.formatCurrency(client.billing?.lastInvoice?.amount)}</span><small>Última fatura</small></div>
                        <div><span class="eco-tag ${client.billing?.lastInvoice?.status === 'pago' ? 'ok' : 'warning'}">${client.billing?.lastInvoice?.status}</span><small>Status</small></div>
                    </div>
                    <div class="eco-portal-preview-section">
                        <h5>Meus chamados</h5>
                        ${(client.tickets || []).slice(0, 4).map(t => `
                            <div class="eco-portal-ticket">
                                <div><strong>#${t.id}</strong> — ${t.subject}</div>
                                <span class="eco-tag ${statusMap[t.status] || 'info'}">${statusLabel[t.status] || t.status}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="eco-portal-preview-section">
                        <h5>Meu plano</h5>
                        <p style="font-size:0.85rem;margin:0;">${client.contract?.plan} · ${CP.formatCurrency(client.contract?.monthlyValue)}/mês</p>
                        <p style="font-size:0.78rem;color:#666;margin:0.35rem 0 0;">Vencimento dia ${client.contract?.dueDay}</p>
                    </div>
                    <div class="eco-portal-preview-actions">
                        <button type="button" class="btn-primary" data-portal-action="new-ticket"><i class="fas fa-plus"></i> Nova solicitação</button>
                        <button type="button" class="btn-secondary" data-portal-action="kb"><i class="fas fa-book"></i> Ajuda</button>
                        <button type="button" class="btn-secondary" data-portal-action="chat"><i class="fas fa-comments"></i> Chat</button>
                    </div>
                </div>
            </div>
        `;
    }

    /* ========== Camada IA ========== */

    function injectAiDock() {
        if (document.getElementById('ecoAiDock')) return;
        document.body.insertAdjacentHTML('beforeend', `
            <div class="eco-ai-dock" id="ecoAiDock">
                <div class="eco-ai-dock-header">
                    <h4><i class="fas fa-brain"></i> Camada IA</h4>
                    <button type="button" class="close-btn" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;" onclick="VelodeskEco.toggleAiDock()">&times;</button>
                </div>
                <div class="eco-ai-dock-body" id="ecoAiDockBody"></div>
            </div>
        `);
        refreshAiDock();
    }

    function injectAiToggle() {
        if (document.getElementById('ecoAiToggle')) return;
        const btn = document.createElement('button');
        btn.id = 'ecoAiToggle';
        btn.className = 'eco-ai-toggle-btn';
        btn.title = 'Camada IA';
        btn.innerHTML = '<i class="fas fa-brain"></i>';
        btn.onclick = () => toggleAiDock();
        document.body.appendChild(btn);
    }

    function toggleAiDock() {
        aiDockOpen = !aiDockOpen;
        document.getElementById('ecoAiDock')?.classList.toggle('open', aiDockOpen);
        document.getElementById('ecoAiToggle')?.classList.toggle('dock-open', aiDockOpen);
        if (aiDockOpen) refreshAiDock();
    }

    function refreshAiDock() {
        const body = document.getElementById('ecoAiDockBody');
        if (!body) return;
        const sentiment = 35;
        body.innerHTML = `
            <div class="eco-ai-module">
                <h5><i class="fas fa-phone-volume"></i> Atendimento IA (ligação)</h5>
                <p>Sugestão: classificar como <strong>Reclamação → Cobrança</strong></p>
                <p>Próxima ação: verificar fatura no Velohub</p>
            </div>
            <div class="eco-ai-module">
                <h5><i class="fas fa-spell-check"></i> Revisor de texto</h5>
                <p>Toda digitação é revisada: ortografia, gramática e tom da marca.</p>
            </div>
            <div class="eco-ai-module">
                <h5><i class="fas fa-heart"></i> Sentimento</h5>
                <div class="eco-sentiment-bar"><div class="eco-sentiment-fill negative" style="width:${sentiment}%"></div></div>
                <p>Cliente <strong>frustrado</strong> — sugerir empatia e prioridade</p>
            </div>
            <div class="eco-ai-module">
                <h5><i class="fas fa-file-alt"></i> Resumo pós-ligação</h5>
                <p>Após encerrar, IA preenche ticket e classificação automaticamente.</p>
            </div>
            <div class="eco-ai-module">
                <h5><i class="fas fa-lightbulb"></i> Sugestão de resposta</h5>
                <p>${applyBrandTone('Prezado(a) cliente, entendemos sua preocupação e já estamos verificando sua solicitação.')}</p>
            </div>
            <div class="eco-ai-module">
                <h5><i class="fas fa-exclamation-circle"></i> Risco</h5>
                <p><span class="eco-tag critical">Alto</span> Padrão de insatisfação — priorizar atendimento proativo</p>
            </div>
        `;
    }

    function applyBrandTone(text) {
        let out = text;
        BRAND_TONE.replacements.forEach(([re, rep]) => { out = out.replace(re, rep); });
        if (!BRAND_TONE.formalOpeners.some(o => out.startsWith(o.split(',')[0]))) {
            out = out.charAt(0).toUpperCase() + out.slice(1);
        }
        return out;
    }

    function reviewText(text) {
        if (!text || text.length < 4) return null;
        const revised = applyBrandTone(text);
        const fixes = [];
        if (text !== revised) fixes.push('Tom da marca ajustado');
        if (/\bvc\b/i.test(text)) fixes.push('Ortografia: "você"');
        if (!/[.!?]$/.test(text.trim())) fixes.push('Pontuação final sugerida');
        if (!fixes.length && text === revised) return null;
        return { revised: revised + (/[.!?]$/.test(revised.trim()) ? '' : '.'), fixes };
    }

    function setupWritingReviewObserver() {
        document.addEventListener('input', (e) => {
            const t = e.target;
            if (!t.matches('textarea, input[type="text"]')) return;
            if (t.id === 'email' || t.id === 'password') return;
            attachWritingReview(t);
        }, true);

        const obs = new MutationObserver(() => {
            document.querySelectorAll('textarea:not([data-eco-review]), .response-textarea').forEach(attachWritingReview);
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    function attachWritingReview(textarea) {
        if (textarea.dataset.ecoReview) return;
        textarea.dataset.ecoReview = '1';

        let bar = textarea.parentElement?.querySelector('.eco-writing-bar');
        if (!bar) {
            const wrap = document.createElement('div');
            wrap.className = 'eco-writing-review';
            textarea.parentNode.insertBefore(wrap, textarea);
            wrap.appendChild(textarea);
            bar = document.createElement('div');
            bar.className = 'eco-writing-bar';
            bar.innerHTML = '<span class="eco-corrected"></span><button type="button" class="btn-apply">Aplicar</button><button type="button" class="btn-dismiss">Ignorar</button>';
            wrap.appendChild(bar);
            bar.querySelector('.btn-dismiss').onclick = () => bar.classList.remove('visible');
            bar.querySelector('.btn-apply').onclick = () => {
                const corrected = bar.querySelector('.eco-corrected').textContent;
                if (corrected) {
                    textarea.value = corrected.replace(/^"|"$/g, '');
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
                bar.classList.remove('visible');
            };
        }

        let timer;
        textarea.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const result = reviewText(textarea.value);
                if (result) {
                    bar.querySelector('.eco-corrected').textContent = result.revised;
                    bar.classList.add('visible');
                } else {
                    bar.classList.remove('visible');
                }
            }, 600);
        });
    }

    function setupTicketEnhancer() {
        const obs = new MutationObserver(() => {
            document.querySelectorAll('.ticket-tab-ticket-view:not([data-eco-enhanced])').forEach(panel => {
                panel.dataset.ecoEnhanced = '1';
                enhanceTicketPanel(panel);
            });
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    function enhanceTicketPanel(panel) {
        const mainCol = panel.querySelector('.ticket-tab-main-column');
        const sidebar = panel.querySelector('.ticket-tab-sidebar');
        if (!mainCol || mainCol.querySelector('.eco-ticket-panels')) return;

        const ticketId = panel.closest('[id^="ticket-tab-"]')?.id?.replace('ticket-tab-', '') || '0';

        const panels = document.createElement('div');
        panels.className = 'eco-ticket-panels';
        panels.innerHTML = `
            <div class="eco-panel-block">
                <h5><i class="fas fa-sitemap"></i> Velohub — Árvore de motivos</h5>
                <div class="eco-velohub-tree">
                    <div class="tree-path">Reclamação → <strong>Produto</strong> → <strong>Cobrança indevida</strong></div>
                    <p style="margin:0.35rem 0 0;font-size:0.72rem;color:#666;">Fluxo: Verificar fatura → Estornar se aplicável → Confirmar com cliente</p>
                </div>
            </div>
            <div class="eco-panel-block">
                <h5><i class="fas fa-history"></i> Histórico 360° do cliente</h5>
                <div class="eco-customer-360-mini">
                    <div class="row"><span>Atendimentos</span><strong>12</strong></div>
                    <div class="row"><span>Canal preferido</span><strong>WhatsApp</strong></div>
                    <div class="row"><span>NPS último</span><strong>4.2</strong></div>
                    <div class="row"><span>Risco</span><span class="eco-tag warning">Médio</span></div>
                </div>
            </div>
        `;

        const desc = panel.querySelector('.ticket-description');
        if (desc) desc.after(panels);

        const omni = document.createElement('div');
        omni.className = 'eco-panel-block';
        omni.style.marginTop = '0.75rem';
        omni.innerHTML = `
            <h5><i class="fas fa-comments"></i> Omnichannel unificado</h5>
            <div class="eco-omni-thread">
                <div class="eco-omni-msg"><span class="channel"><i class="fab fa-whatsapp"></i></span> Ontem: cliente perguntou sobre boleto</div>
                <div class="eco-omni-msg"><span class="channel"><i class="fas fa-phone"></i></span> Hoje: ligação 4min — reclamação cobrança</div>
                <div class="eco-omni-msg"><span class="channel"><i class="fas fa-envelope"></i></span> E-mail enviado com comprovante</div>
            </div>
        `;
        panels.after(omni);

        const responseArea = panel.querySelector('.response-form');
        if (responseArea && !responseArea.querySelector('.eco-macros-bar')) {
            const macros = document.createElement('div');
            macros.className = 'eco-macros-bar';
            MACROS.forEach(m => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'eco-macro-btn';
                b.textContent = `${m.key}: ${m.label}`;
                b.onclick = () => {
                    const ta = responseArea.querySelector('textarea');
                    if (ta) {
                        ta.value = applyBrandTone(m.text);
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                };
                macros.appendChild(b);
            });
            responseArea.appendChild(macros);
        }
    }

    function setupMacroShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!e.target.matches('textarea')) return;
            const macro = MACROS.find(m => m.key === e.key);
            if (macro && e.target.closest('.ticket-tab-ticket-view')) {
                e.preventDefault();
                e.target.value = applyBrandTone(macro.text);
                e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    function seedEcoNotifications() {
        if (!localStorage.getItem('ecoNotificationsSeeded')) {
            const extras = [
                { id: 'eco1', title: 'SLA crítico', message: 'Ticket #1042 vence em 25 minutos', type: 'warning', read: false, timestamp: new Date().toISOString() },
                { id: 'eco2', title: 'Monitoria', message: 'Novo apontamento de qualidade disponível', type: 'info', read: false, timestamp: new Date().toISOString() },
                { id: 'eco3', title: 'Treinamento IA', message: 'Trilha recomendada: Comunicação empática', type: 'info', read: false, timestamp: new Date().toISOString() }
            ];
            const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
            localStorage.setItem('notifications', JSON.stringify([...extras, ...existing]));
            localStorage.setItem('ecoNotificationsSeeded', '1');
        }
    }

    function renderSmartNotifications() {
        const list = document.getElementById('ecoSmartNotifList');
        if (!list) return;
        const items = [
            { tag: 'critical', text: 'Ticket #1042 retornado — SLA 25min' },
            { tag: 'warning', text: 'Apontamento monitoria aguardando leitura' },
            { tag: 'info', text: 'Treinamento: Comunicação empática (IA)' },
            { tag: 'ok', text: 'Meta diária: 68% concluída' }
        ];
        list.innerHTML = items.map(i => `<li><span class="eco-tag ${i.tag}">${i.tag}</span> ${i.text}</li>`).join('');
    }

    window.VelodeskEco = {
        switchProfile,
        toggleAiDock,
        applyBrandTone,
        reviewText,
        loadAnalyticsV3,
        loadPortalCliente,
        getProfile: () => currentProfile,
        PROFILES
    };

    init();
})();
