/**
 * Velodesk Cockpit — Melhorias UX (auditoria completa)
 */
(function () {
    'use strict';
    if (!window.VELODESK_COCKPIT) return;

    var PROFILES_META = {
        agent: { desc: 'Fila operacional, tickets e registro rápido', label: 'Agente' },
        supervisor: { desc: 'SLA, equipe, war room e escalonamentos', label: 'Supervisor' },
        management: { desc: 'Indicadores executivos e analytics estratégico', label: 'Gestão' }
    };

    var supervisorAuditLog = JSON.parse(localStorage.getItem('velodeskSupervisorAudit') || '[]');

    function esc(s) {
        if (typeof window.escapeHtmlEcosystem === 'function') return window.escapeHtmlEcosystem(s);
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function notify(msg, type) {
        if (typeof showNotification === 'function') showNotification(msg, type || 'info');
    }

    function pushAudit(action, detail) {
        supervisorAuditLog.unshift({
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            action: action,
            detail: detail || ''
        });
        supervisorAuditLog = supervisorAuditLog.slice(0, 20);
        localStorage.setItem('velodeskSupervisorAudit', JSON.stringify(supervisorAuditLog));
        renderAuditLogPanel();
    }

    /* ─── Header: busca global ─── */
    function injectHeaderSearch() {
        if (document.getElementById('cockpitGlobalSearch')) return;
        var headerRight = document.getElementById('headerRight');
        if (!headerRight) return;
        var wrap = document.createElement('div');
        wrap.className = 'cockpit-global-search';
        wrap.innerHTML =
            '<i class="fas fa-search"></i>' +
            '<input type="search" id="cockpitGlobalSearch" placeholder="Buscar ticket #, CPF ou cliente…" autocomplete="off">' +
            '<kbd>Ctrl+K</kbd>';
        var profileWrap = headerRight.querySelector('.header-profile-wrap');
        if (profileWrap) headerRight.insertBefore(wrap, profileWrap);
        else headerRight.insertBefore(wrap, headerRight.firstChild);

        var input = document.getElementById('cockpitGlobalSearch');
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') runGlobalSearch(input.value.trim());
        });
    }

    function runGlobalSearch(q) {
        if (!q) { notify('Digite um termo para buscar.', 'info'); return; }
        navigateToPage('tickets');
        setTimeout(function () {
            var searchInput = document.getElementById('searchTickets');
            if (searchInput) {
                searchInput.value = q;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            notify('Busca: "' + q + '"', 'info');
        }, 250);
    }

    window.runCockpitGlobalSearch = runGlobalSearch;

    /* ─── Perfil: Alt+P + tooltip ─── */
    function updateProfileBadgeTooltip() {
        var badge = document.getElementById('profileRoleBadge');
        if (!badge) return;
        var profile = document.body.dataset.velodeskProfile || localStorage.getItem('velodeskProfile') || 'agent';
        var meta = PROFILES_META[profile] || PROFILES_META.agent;
        badge.title = meta.label + ' — ' + meta.desc + ' · Alt+P para trocar';
    }

    function cycleProfile() {
        var order = ['agent', 'supervisor', 'management'];
        var cur = document.body.dataset.velodeskProfile || 'agent';
        var idx = order.indexOf(cur);
        var next = order[(idx + 1) % order.length];
        if (typeof switchVelodeskProfile === 'function') switchVelodeskProfile(next);
    }

    /* ─── Tema por perfil ─── */
    function getThemeKey() {
        var p = document.body.dataset.velodeskProfile || 'agent';
        return 'velodeskDarkMode_' + p;
    }

    function applyThemeForProfile() {
        var key = getThemeKey();
        var isDark = localStorage.getItem(key) === '1' || (localStorage.getItem(key) === null && localStorage.getItem('velodeskDarkMode') === '1');
        document.body.classList.toggle('velodesk-dark', isDark);
        var btn = document.getElementById('velodeskThemeToggle');
        if (btn) {
            var icon = btn.querySelector('i');
            if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            btn.title = isDark ? 'Modo claro (salvo por perfil)' : 'Modo escuro (salvo por perfil)';
        }
    }

    var origToggleTheme = window.toggleVelodeskDarkMode;
    window.toggleVelodeskDarkMode = function () {
        var key = getThemeKey();
        var isDark = !document.body.classList.contains('velodesk-dark');
        document.body.classList.toggle('velodesk-dark', isDark);
        localStorage.setItem(key, isDark ? '1' : '0');
        applyThemeForProfile();
    };

    /* ─── Atalhos de teclado ─── */
    function injectKeyboardHelp() {
        if (document.getElementById('cockpitKeyboardHelpBtn')) return;
        var toolsLeft = document.getElementById('headerToolsLeft');
        if (!toolsLeft) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'cockpitKeyboardHelpBtn';
        btn.className = 'btn-header-theme';
        btn.title = 'Atalhos de teclado (?)';
        btn.innerHTML = '<i class="fas fa-keyboard"></i>';
        btn.onclick = openKeyboardHelp;
        toolsLeft.insertBefore(btn, document.getElementById('velodeskThemeToggle'));
    }

    window.openKeyboardHelp = function () {
        var existing = document.getElementById('cockpitKeyboardModal');
        if (existing) { existing.style.display = 'flex'; return; }
        var modal = document.createElement('div');
        modal.id = 'cockpitKeyboardModal';
        modal.className = 'modal cockpit-modal';
        modal.style.display = 'flex';
        modal.innerHTML =
            '<div class="modal-content modal-content--wide">' +
            '<div class="modal-header"><h3><i class="fas fa-keyboard"></i> Atalhos de teclado</h3>' +
            '<button type="button" class="close-btn" onclick="document.getElementById(\'cockpitKeyboardModal\').style.display=\'none\'"><i class="fas fa-times"></i></button></div>' +
            '<div class="modal-body cockpit-kbd-grid">' +
            kbdRow('R', 'Responder ticket focado') +
            kbdRow('A', 'Assumir ticket focado') +
            kbdRow('T', 'Transferir ticket focado') +
            kbdRow('Esc', 'Sair do focus mode') +
            kbdRow('Alt+P', 'Trocar perfil (Agente → Supervisor → Gestão)') +
            kbdRow('Ctrl+K', 'Focar busca global') +
            kbdRow('?', 'Abrir este painel') +
            kbdRow('F1–F4', 'Inserir macro (com preview)') +
            '</div></div>';
        document.body.appendChild(modal);
    };

    function kbdRow(key, desc) {
        return '<div class="cockpit-kbd-row"><kbd>' + esc(key) + '</kbd><span>' + esc(desc) + '</span></div>';
    }

    document.addEventListener('keydown', function (e) {
        if (e.target.matches('input, textarea, select') && e.key !== 'Escape') return;
        if (e.key === '?' && !e.ctrlKey && !e.altKey) { e.preventDefault(); openKeyboardHelp(); return; }
        if (e.altKey && (e.key === 'p' || e.key === 'P')) { e.preventDefault(); cycleProfile(); return; }
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            var inp = document.getElementById('cockpitGlobalSearch');
            if (inp) inp.focus();
        }
    });

    /* ─── Smart action: ignorar 30min ─── */
    window.dismissSmartAction = function (ticketId) {
        var ignored = JSON.parse(localStorage.getItem('velodeskIgnoredActions') || '{}');
        ignored[ticketId] = Date.now() + 30 * 60000;
        localStorage.setItem('velodeskIgnoredActions', JSON.stringify(ignored));
        notify('Sugestão adiada por 30 minutos.', 'info');
        if (typeof renderWorkspace360 === 'function') renderWorkspace360();
    };

    window.isSmartActionIgnored = function (ticketId) {
        var ignored = JSON.parse(localStorage.getItem('velodeskIgnoredActions') || '{}');
        return ignored[ticketId] && ignored[ticketId] > Date.now();
    };

    /* ─── Registro rápido: voltar + CPF ─── */
    window.qrGoBack = function () {
        if ((window._qrStep || 1) > 1) {
            window._qrStep--;
            if (typeof renderQuickRegisterStep === 'function') renderQuickRegisterStep();
        }
    };

    window.searchQrClientByCpf = function () {
        var cpf = normalizeCpf(document.getElementById('qrCpf') && document.getElementById('qrCpf').value);
        if (cpf.length < 11) { notify('CPF inválido.', 'warning'); return; }
        var db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
        var client = db[cpf];
        var nameInput = document.getElementById('qrClient');
        if (client && nameInput) {
            nameInput.value = client.name || '';
            notify('Cliente encontrado: ' + (client.name || cpf), 'success');
        } else {
            notify('Cliente não encontrado — preencha manualmente.', 'info');
        }
    };

    function normalizeCpf(v) {
        return String(v || '').replace(/\D/g, '');
    }

    /* ─── Painel lateral: log automação ─── */
    window.openAutomationLogPanel = function () {
        var panel = document.getElementById('cockpitSidePanel');
        if (!panel) {
            panel = document.createElement('aside');
            panel.id = 'cockpitSidePanel';
            panel.className = 'cockpit-side-panel';
            document.body.appendChild(panel);
        }
        panel.classList.add('open');
        var logs = [
            { time: '10:42', rule: 'SLA crítico', action: 'Escalado ticket #4512 → Supervisor Ana' },
            { time: '10:38', rule: 'Triagem N1', action: 'Classificado #4510 como Financeiro' },
            { time: '10:35', rule: 'Churn risk', action: 'Tag risco em #4508 · IA sugeriu resposta' },
            { time: '10:30', rule: 'Inatividade 72h', action: 'Prioridade ↑ ticket #4505' }
        ];
        panel.innerHTML =
            '<div class="cockpit-side-panel__head"><h4><i class="fas fa-robot"></i> Log de automações</h4>' +
            '<button type="button" class="close-btn" onclick="closeCockpitSidePanel()"><i class="fas fa-times"></i></button></div>' +
            '<ul class="cockpit-side-panel__list">' +
            logs.map(function (l) {
                return '<li><span class="cockpit-side-panel__time">' + l.time + '</span>' +
                    '<strong>' + esc(l.rule) + '</strong><span>' + esc(l.action) + '</span></li>';
            }).join('') + '</ul>';
    };

    window.closeCockpitSidePanel = function () {
        var panel = document.getElementById('cockpitSidePanel');
        if (panel) panel.classList.remove('open');
    };

    /* ─── Focus mode: painel contexto (desativado — duplicava painel direito do CRM) ─── */
    window.renderFocusContextPanel = function () {
        var existing = document.getElementById('cockpitFocusContext');
        if (existing) existing.remove();
    };

    var origEnterFocus = window.enterDeskFocusMode;
    window.enterDeskFocusMode = function (ticketId) {
        if (origEnterFocus) origEnterFocus(ticketId);
        renderFocusContextPanel();
    };

    var origExitFocus = window.exitDeskFocusMode;
    window.exitDeskFocusMode = function () {
        if (origExitFocus) origExitFocus();
        var p = document.getElementById('cockpitFocusContext');
        if (p) p.remove();
    };

    /* ─── Macros: preview ─── */
    var origInsertMacro = window.insertMacro;
    window.insertMacro = function (key) {
        var macros = window.VelodeskMACROS || [];
        var macro = macros.find(function (m) { return m.key === key; });
        if (!macro) return;
        var preview = document.getElementById('cockpitMacroPreview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'cockpitMacroPreview';
            preview.className = 'cockpit-macro-preview';
            document.body.appendChild(preview);
        }
        preview.innerHTML =
            '<div class="cockpit-macro-preview__box">' +
            '<h4>' + esc(macro.title) + ' (' + esc(key) + ')</h4>' +
            '<p>' + esc(macro.text.replace('{{agente}}', 'Agente')) + '</p>' +
            '<div class="cockpit-macro-preview__actions">' +
            '<button type="button" class="btn-secondary btn-sm" onclick="document.getElementById(\'cockpitMacroPreview\').classList.remove(\'open\')">Cancelar</button>' +
            '<button type="button" class="btn-primary btn-sm" onclick="applyMacroConfirmed(\'' + key + '\')">Inserir</button>' +
            '</div></div>';
        preview.classList.add('open');
    };

    window.applyMacroConfirmed = function (key) {
        document.getElementById('cockpitMacroPreview').classList.remove('open');
        if (origInsertMacro) origInsertMacro(key);
        notify('Macro ' + key + ' aplicada.', 'success');
    };

    /* ─── IA ligação: pausar / rejeitar ─── */
    window.pauseCallAssist = function () {
        window._callAssistPaused = !window._callAssistPaused;
        notify(window._callAssistPaused ? 'IA pausada.' : 'IA retomada.', 'info');
    };

    window.rejectCallSuggestion = function () {
        notify('Sugestão descartada. Próxima em breve.', 'info');
    };

    /* ─── Hot clients: filtro churn ─── */
    window.toggleHotChurnFilter = function () {
        var on = localStorage.getItem('velodeskHotChurnOnly') === '1';
        localStorage.setItem('velodeskHotChurnOnly', on ? '0' : '1');
        if (typeof renderWorkspace360 === 'function') renderWorkspace360();
    };

    /* ─── Supervisor: confirmações ─── */
    window.supervisorConfirmAction = function (action, label, destructive) {
        var modal = document.getElementById('cockpitConfirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cockpitConfirmModal';
            modal.className = 'modal cockpit-modal';
            document.body.appendChild(modal);
        }
        var explain = {
            redistribute: 'Tickets serão redistribuídos pela IA entre agentes online com menor carga.',
            critical: 'Ativa war room: SLAs repriorizados, feed acelerado e alertas visuais intensificados.',
            escalate: 'Equipe de plantão será notificada imediatamente.',
            contingency: 'Modo contingência: filas repriorizadas, pausas automáticas e SLA flexibilizado.',
            pause: 'Novos tickets não serão atribuídos até reativação manual.',
            notify: 'Todos os agentes online receberão a mensagem.',
            reprioritize: 'Tickets reordenados por SLA e risco de churn.'
        };
        modal.style.display = 'flex';
        modal.innerHTML =
            '<div class="modal-content">' +
            '<div class="modal-header"><h3><i class="fas fa-' + (destructive ? 'triangle-exclamation' : 'circle-check') + '"></i> Confirmar: ' + esc(label) + '</h3>' +
            '<button type="button" class="close-btn" onclick="closeCockpitConfirm()"><i class="fas fa-times"></i></button></div>' +
            '<div class="modal-body"><p>' + esc(explain[action] || 'Confirme para executar esta ação.') + '</p>' +
            (action === 'notify' ? '<div class="form-group"><label>Mensagem para agentes</label><textarea id="cockpitNotifyMsg" rows="3" placeholder="Ex.: Pico previsto às 16h — priorizar WhatsApp">Pico operacional previsto — priorizar SLAs críticos.</textarea></div>' : '') +
            (destructive ? '<p class="cockpit-confirm-warn"><i class="fas fa-exclamation-triangle"></i> Ação de impacto operacional — confirme novamente abaixo.</p>' +
                '<label class="cockpit-confirm-check"><input type="checkbox" id="cockpitConfirmCheck"> Entendo o impacto desta ação</label>' : '') +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn-secondary" onclick="closeCockpitConfirm()">Cancelar</button>' +
            '<button type="button" class="btn-primary' + (destructive ? ' btn-danger' : '') + '" id="cockpitConfirmBtn" onclick="executeSupervisorConfirmed(\'' + action + '\',' + (destructive ? 'true' : 'false') + ')">Confirmar</button>' +
            '</div></div>';
    };

    window.closeCockpitConfirm = function () {
        var m = document.getElementById('cockpitConfirmModal');
        if (m) m.style.display = 'none';
    };

    window.executeSupervisorConfirmed = function (action, destructive) {
        if (destructive) {
            var chk = document.getElementById('cockpitConfirmCheck');
            if (!chk || !chk.checked) { notify('Marque a confirmação para continuar.', 'warning'); return; }
        }
        closeCockpitConfirm();
        var msg = document.getElementById('cockpitNotifyMsg');
        var detail = msg ? msg.value : '';
        pushAudit(action, detail);
        if (window._supervisorQuickActionOrig) window._supervisorQuickActionOrig(action);
    };

    /* ─── Supervisor: interações ─── */
    window.supervisorOpenAgentQueue = function (agentName) {
        notify('Fila de ' + agentName + ' — simulação: 14 tickets ativos.', 'info');
        navigateToPage('tickets');
    };

    window.supervisorHeatmapHour = function (hour, sla) {
        notify('Slot ' + hour + 'h — SLA ' + sla + '% · 8 tickets simulados neste horário.', 'info');
    };

    window.markFeedItemTreated = function (btn) {
        var li = btn.closest('li');
        if (li) {
            li.classList.add('ws-super-feed__item--treated');
            btn.textContent = 'Tratado';
            btn.disabled = true;
        }
    };

    window.toggleSupervisorExpand = function (sectionId) {
        var el = document.getElementById(sectionId);
        if (!el) return;
        el.querySelectorAll('.cockpit-collapsed-extra').forEach(function (item) {
            item.style.display = item.style.display === 'none' ? '' : 'none';
        });
    };

    window.startPeakCountdown = function () {
        if (window._peakCountdownTimer) clearInterval(window._peakCountdownTimer);
        var peakHour = 16;
        function tick() {
            var el = document.getElementById('wsPeakCountdown');
            if (!el) return;
            var now = new Date();
            var peak = new Date(now);
            peak.setHours(peakHour, 0, 0, 0);
            if (peak <= now) peak.setDate(peak.getDate() + 1);
            var diff = peak - now;
            var h = Math.floor(diff / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            el.textContent = h + 'h ' + m + 'min';
        }
        tick();
        window._peakCountdownTimer = setInterval(tick, 60000);
    };

    window.exportExecTable = function (format) {
        notify('Export ' + format.toUpperCase() + ' gerado (simulação).', 'success');
    };

    window.openTicketWhatsApp = function (ticketId) {
        navigateToPage('chat');
        notify('Abrindo conversa WhatsApp do ticket #' + ticketId, 'info');
    };

    window.startRetentionFlow = function (ticketId) {
        notify('Fluxo de retenção iniciado para ticket #' + (ticketId || '—'), 'success');
        if (ticketId && typeof deskQuickAction === 'function') deskQuickAction(ticketId, 'reply');
    };

    window.openClientHistory = function (ticketId) {
        if (typeof openClientFromTicket === 'function') openClientFromTicket(ticketId);
    };

    window.toggleAutomationRule = function (idx) {
        var rules = JSON.parse(localStorage.getItem('velodeskAutomationRules') || '[true,true,true]');
        rules[idx] = !rules[idx];
        localStorage.setItem('velodeskAutomationRules', JSON.stringify(rules));
        if (typeof renderWorkspace360 === 'function') renderWorkspace360();
        notify('Automação ' + (rules[idx] ? 'ativada' : 'desativada') + '.', 'info');
    };

    window.toggleCrmPipelinePanel = function () {
        var el = document.getElementById('wsCrmPipelineWrap');
        if (el) el.classList.toggle('cockpit-collapsed');
    };

    /* ─── Audit log panel ─── */
    function renderAuditLogPanel() {
        var el = document.getElementById('cockpitAuditLog');
        if (!el) return;
        if (!supervisorAuditLog.length) {
            el.innerHTML = '<p class="ws-empty">Nenhuma ação gerencial registrada ainda.</p>';
            return;
        }
        el.innerHTML = '<ul class="cockpit-audit-list">' + supervisorAuditLog.map(function (a) {
            return '<li><span>' + esc(a.time) + '</span> <strong>' + esc(a.action) + '</strong> ' + esc(a.detail) + '</li>';
        }).join('') + '</ul>';
    }

    window.renderSupervisorAuditHtml = function () {
        return '<section class="ws-panel ws-panel--level-3" id="cockpitAuditSection">' +
            '<h4><i class="fas fa-clipboard-list"></i> Log de ações gerenciais</h4>' +
            '<div id="cockpitAuditLog"></div></section>';
    };

    /* ─── Config search ─── */
    window.filterConfigSections = function (q) {
        q = (q || '').toLowerCase();
        document.querySelectorAll('#config .config-nav-item, #config .config-card').forEach(function (el) {
            var text = el.textContent.toLowerCase();
            el.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
        });
    };

    function injectConfigSearch() {
        var configPage = document.getElementById('config');
        if (!configPage || document.getElementById('configSearchInput')) return;
        var header = configPage.querySelector('.page-header, .config-header, h2');
        if (!header) return;
        var wrap = document.createElement('div');
        wrap.className = 'cockpit-config-search';
        wrap.innerHTML = '<i class="fas fa-search"></i><input type="search" id="configSearchInput" placeholder="Buscar em configurações…" oninput="filterConfigSections(this.value)">';
        header.after(wrap);
    }

    /* ─── Notificações agrupadas ─── */
    function patchNotifications() {
        var panel = document.getElementById('notificationPanel');
        if (!panel || panel.dataset.cockpitPatched) return;
        panel.dataset.cockpitPatched = '1';
        var list = panel.querySelector('.notification-list, ul');
        if (!list) return;
        var items = list.querySelectorAll('li');
        if (items.length < 2) return;
        var groups = { critical: [], warn: [], info: [] };
        items.forEach(function (li) {
            var t = li.textContent.toLowerCase();
            if (/crítico|sla|urgente/.test(t)) groups.critical.push(li.outerHTML);
            else if (/atenção|aviso|risco/.test(t)) groups.warn.push(li.outerHTML);
            else groups.info.push(li.outerHTML);
        });
        var html = '';
        if (groups.critical.length) html += '<div class="cockpit-notif-group cockpit-notif-group--critical"><strong>Críticas</strong><ul>' + groups.critical.join('') + '</ul></div>';
        if (groups.warn.length) html += '<div class="cockpit-notif-group cockpit-notif-group--warn"><strong>Atenção</strong><ul>' + groups.warn.join('') + '</ul></div>';
        if (groups.info.length) html += '<div class="cockpit-notif-group"><strong>Informações</strong><ul>' + groups.info.join('') + '</ul></div>';
        if (html) list.innerHTML = html;
    }

    /* ─── Hook applyProfileUI ─── */
    function hookProfileUI() {
        var attempts = 0;
        var iv = setInterval(function () {
            attempts++;
            if (typeof applyProfileUI === 'undefined' && attempts < 50) return;
            clearInterval(iv);
            updateProfileBadgeTooltip();
            applyThemeForProfile();
        }, 200);
    }

    var origSwitchProfile = window.switchVelodeskProfile;
    if (origSwitchProfile) {
        window.switchVelodeskProfile = function (id) {
            origSwitchProfile(id);
            setTimeout(function () {
                updateProfileBadgeTooltip();
                applyThemeForProfile();
            }, 100);
        };
    }

    /* ─── Init ─── */
    function init() {
        injectHeaderSearch();
        injectKeyboardHelp();
        hookProfileUI();
        applyThemeForProfile();
        setTimeout(injectConfigSearch, 1500);
        setTimeout(patchNotifications, 2000);
        document.addEventListener('click', function () { setTimeout(patchNotifications, 300); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.COCKPIT_UX = { pushAudit: pushAudit, renderAuditLogPanel: renderAuditLogPanel };
})();
