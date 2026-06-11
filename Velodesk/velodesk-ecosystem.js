/**
 * Velodesk Ecossistema V3 — Protótipo local
 * Perfis segmentados, camada IA, workspace 360°, analytics e automação
 */
(function () {
    'use strict';

    const BRAND_TONE = {
        replacements: [
            [/vc\b/gi, 'você'],
            [/tb\b/gi, 'também'],
            [/pq\b/gi, 'porque'],
            [/blz\b/gi, 'certo'],
            [/tá\b/gi, 'está'],
            [/pra\b/gi, 'para'],
            [/né\?/gi, ', correto?'],
            [/a gente/gi, 'nossa equipe'],
            [/desculpa/gi, 'pedimos desculpas'],
            [/problema/gi, 'situação']
        ],
        formalOpeners: ['Prezado(a) cliente,', 'Olá,', 'Bom dia,']
    };

    const PROFILES = {
        agent: {
            id: 'agent', label: 'Agente', icon: 'fa-headset', color: '#2563eb',
            desc: 'Tickets, treinamentos e registro rápido',
            nav: ['workspace', 'tickets', 'chat', 'reports', 'config'],
            defaultPage: 'workspace'
        },
        supervisor: {
            id: 'supervisor', label: 'Supervisor', icon: 'fa-user-tie', color: '#7c3aed',
            desc: 'SLA, performance da equipe e escalonamentos',
            nav: ['workspace', 'dashboard', 'tickets', 'analytics-ia', 'reports', 'config'],
            defaultPage: 'workspace'
        },
        monitor: {
            id: 'monitor', label: 'Monitoria', icon: 'fa-clipboard-check', color: '#0891b2',
            desc: 'Fila de avaliação e feedback de qualidade',
            nav: ['workspace', 'tickets', 'analytics-ia', 'reports'],
            defaultPage: 'workspace'
        },
        training: {
            id: 'training', label: 'Treinamento', icon: 'fa-graduation-cap', color: '#059669',
            desc: 'Trilhas recomendadas e gaps de competência',
            nav: ['workspace', 'analytics-ia', 'config'],
            defaultPage: 'workspace'
        },
        management: {
            id: 'management', label: 'Gestão', icon: 'fa-chart-line', color: '#dc2626',
            desc: 'Visão executiva e indicadores estratégicos',
            nav: ['dashboard', 'analytics-ia', 'reports', 'config'],
            defaultPage: 'analytics-ia'
        }
    };

    const ADAPTIVE_FORM_TREE = {
        contactTypes: {
            reclamacao: { label: 'Reclamação', channels: ['telefone', 'whatsapp', 'email', 'chat'] },
            duvida: { label: 'Dúvida', channels: ['whatsapp', 'chat', 'email'] },
            solicitacao: { label: 'Solicitação', channels: ['telefone', 'whatsapp', 'email', 'chat'] },
            elogio: { label: 'Elogio', channels: ['whatsapp', 'email', 'chat'] }
        },
        products: {
            internet: { label: 'Internet Fibra', motives: ['lentidao', 'queda', 'instalacao', 'cobranca'] },
            movel: { label: 'Plano Móvel', motives: ['sinal', 'cobranca', 'portabilidade'] },
            tv: { label: 'TV por Assinatura', motives: ['canais', 'decodificador', 'cobranca'] },
            combo: { label: 'Combo Residencial', motives: ['cobranca', 'cancelamento', 'upgrade'] }
        },
        motives: {
            lentidao: 'Lentidão de conexão',
            queda: 'Quedas frequentes',
            instalacao: 'Agendamento de instalação',
            cobranca: 'Cobrança indevida',
            sinal: 'Problema de sinal',
            portabilidade: 'Portabilidade',
            canais: 'Canais indisponíveis',
            decodificador: 'Decodificador com defeito',
            cancelamento: 'Intenção de cancelamento',
            upgrade: 'Upgrade de plano'
        }
    };

    const MACROS = [
        { key: 'F1', title: 'Saudação padrão', text: 'Prezado(a) cliente, sou {{agente}} da equipe de atendimento. Como posso ajudá-lo(a) hoje?' },
        { key: 'F2', title: 'Aguardar retorno', text: 'Permaneço à disposição. Caso precise de mais informações, nossa equipe retornará em até 24 horas úteis.' },
        { key: 'F3', title: 'Escalonamento', text: 'Para garantir a melhor solução, estou encaminhando sua solicitação ao especialista responsável. Prazo estimado: 4 horas.' },
        { key: 'F4', title: 'Encerramento NPS', text: 'Agradecemos o contato! Em instantes você receberá nossa pesquisa de satisfação. Sua opinião é muito importante.' }
    ];

    let callAssistActive = false;
    let sentimentScore = 72;
    let reviewDebounce = null;

    function getProfile() {
        return localStorage.getItem('velodeskProfile') || 'agent';
    }

    function setProfile(id) {
        if (!PROFILES[id]) return;
        localStorage.setItem('velodeskProfile', id);
        applyProfileUI();
        if (typeof showNotification === 'function') {
            showNotification(`Perfil alterado: ${PROFILES[id].label}`, 'success');
        }
    }

    function seedEcosystemData() {
        if (localStorage.getItem('velodeskEcosystemSeeded')) return;
        const trainings = [
            { id: 1, title: 'Comunicação empática em reclamações', reason: 'Monitoria: tom inadequado em 2 atendimentos', priority: 'alta', duration: '45 min' },
            { id: 2, title: 'Produto Internet Fibra — troubleshooting', reason: 'Alto volume de tickets de lentidão', priority: 'media', duration: '30 min' },
            { id: 3, title: 'Retenção e risco de cancelamento', reason: 'IA detectou padrão de churn', priority: 'alta', duration: '60 min' }
        ];
        const monitorQueue = [
            { id: 101, agent: 'Ana Silva', ticket: '#4521', channel: 'Telefone', duration: '08:42', score: null },
            { id: 102, agent: 'Carlos Mendes', ticket: '#4518', channel: 'WhatsApp', duration: '05:15', score: null }
        ];
        const client360 = {
            'cliente-demo': {
                name: 'Maria Oliveira', cpf: '***.456.789-**', preferredChannel: 'WhatsApp',
                products: ['Internet Fibra 500MB', 'TV Premium'], nps: 8, riskScore: 35,
                tickets: [
                    { id: 4490, subject: 'Lentidão à noite', status: 'Resolvido', date: '2026-05-28', channel: 'WhatsApp' },
                    { id: 4512, subject: 'Cobrança duplicada', status: 'Em andamento', date: '2026-06-03', channel: 'Telefone' }
                ]
            }
        };
        localStorage.setItem('velodeskTrainings', JSON.stringify(trainings));
        localStorage.setItem('velodeskMonitorQueue', JSON.stringify(monitorQueue));
        localStorage.setItem('velodeskClient360', JSON.stringify(client360));
        localStorage.setItem('velodeskEcosystemSeeded', 'true');
    }

    /* ─── IA: Revisor de texto ─── */
    function reviewTextWithAI(text) {
        if (!text || !text.trim()) return { original: text, revised: text, changes: [] };
        let revised = text.trim();
        const changes = [];

        BRAND_TONE.replacements.forEach(([regex, replacement]) => {
            if (regex.test(revised)) {
                changes.push({ type: 'tom', msg: `Ajuste de tom: "${regex.source}" → "${replacement}"` });
                revised = revised.replace(regex, replacement);
            }
        });

        const fixes = [
            [/nao /gi, 'não '], [/voce /gi, 'você '], [/ate /gi, 'até '],
            [/sua solicitacao/gi, 'sua solicitação'], [/informacao/gi, 'informação'],
            [/solucao/gi, 'solução'], [/atenciosamente/gi, 'Atenciosamente']
        ];
        fixes.forEach(([regex, replacement]) => {
            if (regex.test(revised)) {
                changes.push({ type: 'ortografia', msg: 'Correção ortográfica aplicada' });
                revised = revised.replace(regex, replacement);
            }
        });

        if (!/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(revised) && revised.length > 3) {
            revised = revised.charAt(0).toUpperCase() + revised.slice(1);
            changes.push({ type: 'gramática', msg: 'Capitalização inicial' });
        }
        if (revised.length > 20 && !revised.endsWith('.') && !revised.endsWith('!') && !revised.endsWith('?')) {
            revised += '.';
            changes.push({ type: 'gramática', msg: 'Pontuação final adicionada' });
        }

        return { original: text, revised, changes };
    }

    function attachAIReviewToField(field) {
        if (!field || field.dataset.aiReviewBound) return;
        field.dataset.aiReviewBound = 'true';

        const wrap = document.createElement('div');
        wrap.className = 'ai-review-wrap';
        field.parentNode.insertBefore(wrap, field);
        wrap.appendChild(field);

        const bar = document.createElement('div');
        bar.className = 'ai-review-bar';
        bar.innerHTML = `
            <span class="ai-review-status"><i class="fas fa-sparkles"></i> IA Revisor ativo</span>
            <button type="button" class="ai-review-apply btn-primary btn-sm" style="display:none">Aplicar revisão</button>
        `;
        wrap.appendChild(bar);

        const panel = document.createElement('div');
        panel.className = 'ai-review-panel';
        panel.style.display = 'none';
        wrap.appendChild(panel);

        const applyBtn = bar.querySelector('.ai-review-apply');
        let lastReview = null;

        function runReview() {
            const result = reviewTextWithAI(field.value);
            lastReview = result;
            const status = bar.querySelector('.ai-review-status');
            if (result.changes.length === 0) {
                status.innerHTML = '<i class="fas fa-check-circle"></i> Texto adequado ao tom da marca';
                applyBtn.style.display = 'none';
                panel.style.display = 'none';
                field.classList.remove('ai-field-needs-review');
            } else {
                status.innerHTML = `<i class="fas fa-magic"></i> ${result.changes.length} sugestão(ões) de revisão`;
                applyBtn.style.display = 'inline-flex';
                panel.style.display = 'block';
                panel.innerHTML = `
                    <div class="ai-review-diff">
                        <strong>Sugestão da IA (tom ${escapeHtmlEcosystem('Velodesk')}):</strong>
                        <p class="ai-revised-text">${escapeHtmlEcosystem(result.revised)}</p>
                        <ul>${result.changes.map(c => `<li><span class="ai-tag ai-tag-${c.type}">${c.type}</span> ${escapeHtmlEcosystem(c.msg)}</li>`).join('')}</ul>
                    </div>`;
                field.classList.add('ai-field-needs-review');
            }
        }

        field.addEventListener('input', () => {
            clearTimeout(reviewDebounce);
            reviewDebounce = setTimeout(runReview, 600);
        });
        field.addEventListener('blur', runReview);
        applyBtn.addEventListener('click', () => {
            if (lastReview) {
                field.value = lastReview.revised;
                field.classList.remove('ai-field-needs-review');
                runReview();
                if (typeof showNotification === 'function') showNotification('Texto revisado pela IA', 'success');
            }
        });
    }

    function initGlobalAIReview() {
        document.querySelectorAll('textarea:not([data-ai-skip]), #ticketDescription, #chatInput, #aiChatInput').forEach(attachAIReviewToField);
        const observer = new MutationObserver(() => {
            document.querySelectorAll('textarea:not([data-ai-review-bound])').forEach(attachAIReviewToField);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /* ─── IA: tickets abertos pelo cliente (canais digitais, não ligação) ─── */
    function detectTicketChannel(ticket) {
        if (!ticket) return '';
        if (typeof window.detectVelodeskTicketChannel === 'function') {
            return window.detectVelodeskTicketChannel(ticket);
        }
        if (ticket.lateralForm && ticket.lateralForm.canal) return ticket.lateralForm.canal;
        return ticket.channel || ticket.source || 'Portal';
    }

    function isClientDigitalTicket(ticket) {
        if (!ticket || ticket.isNewTicket) return false;
        const ch = String(detectTicketChannel(ticket)).toLowerCase();
        if (/telefone|ligação|ligacao|phone|voip|presencial/.test(ch)) return false;
        if (ticket.openedBy === 'agent' || ticket.createdBy === 'agent') return false;
        if (ticket.openedBy === 'client') return true;
        if (ticket.phone && !ticket.source && !ticket.channel && !(ticket.lateralForm && ticket.lateralForm.canal)) {
            return false;
        }
        if (/whatsapp|portal|e-mail|email|chat|web/.test(ch)) return true;
        if (ticket.messages && ticket.messages.some(function (m) {
            return m.fromClient === true || m.type === 'client' || m.sender === 'them';
        })) return true;
        return !!(ticket.description && ticket.source && !/telefone|phone|ligação|ligacao/i.test(String(ticket.source)));
    }

    function extractClientMessage(ticket) {
        if (!ticket) return '';
        if (ticket.messages && ticket.messages.length) {
            const clientMsgs = ticket.messages.filter(function (m) {
                return m.fromClient === true || m.type === 'client' || m.sender === 'them';
            });
            if (clientMsgs.length) return String(clientMsgs[clientMsgs.length - 1].text || '').trim();
        }
        if (ticket.description) return String(ticket.description).trim();
        return '';
    }

    function inferTabulationFromMessage(text, ticket) {
        const msg = String(text || '').toLowerCase();
        const ticketHint = ticket && ticket.lateralForm ? ticket.lateralForm : {};
        const out = {};

        if (/cancel|encerr|desistir/.test(msg)) out.classificacaoTipo = 'Cancelamento';
        else if (/reten/.test(msg)) out.classificacaoTipo = 'Retenção';
        else if (/reclam|lent|problema|insatis|duplic|bloqueio|contest/.test(msg)) out.classificacaoTipo = 'Reclamação';
        else if (/upgrade|solicit|agend|negoci|mudança|mudanca|contrat/.test(msg)) out.classificacaoTipo = 'Solicitação';
        else if (/inform|dúvida|duvida|como funciona/.test(msg)) out.classificacaoTipo = 'Informação';
        else if (/elog|obrigad|parab/.test(msg)) out.classificacaoTipo = 'Elogio';

        if (/fibra|internet|lent|wifi|wi-fi|roteador|\bmb\b/.test(msg)) out.produto = 'Internet Fibra';
        else if (/\btv\b|canal|decoder|decodificador|tela preta/.test(msg)) out.produto = 'TV';
        else if (/combo|móvel|movel|celular|chip|portabil|bloqueio/.test(msg)) {
            out.produto = /combo/.test(msg) ? 'Combo' : 'Móvel';
        } else if (/fixo|telefone fixo|sem tom/.test(msg)) out.produto = 'Telefone Fixo';
        else if (/stream|app|login/.test(msg)) out.produto = 'Streaming';

        if (/lent|veloc|wifi|wi-fi|queda/.test(msg)) out.motivo = 'Lentidão';
        else if (/instala|agend|técnico|tecnico|visita|upgrade|link|corporat|dedicad/.test(msg)) out.motivo = 'Instalação';
        else if (/cancel|encerr|desist/.test(msg)) out.motivo = 'Cancelamento';
        else if (/cobran|fatura|boleto|duplic|inadim|bloqueio|contest|débito|debito/.test(msg)) out.motivo = 'Cobrança';
        else if (/sinal|chip|portabil/.test(msg)) out.motivo = 'Sem sinal';
        else if (/canal|tela/.test(msg)) out.motivo = 'Canal indisponível';

        if (/escal|n2|análise|analise/.test(msg)) out.detalhe = 'Escalado N2';
        else if (/técnico|tecnico|aguard/.test(msg)) out.detalhe = 'Aguardando técnico';
        else if (/contest/.test(msg)) out.detalhe = 'Contestação';
        else if (/reten/.test(msg)) out.detalhe = 'Retenção acionada';
        else if (/negoci|agend/.test(msg)) out.detalhe = 'Agendamento pendente';

        ['classificacaoTipo', 'produto', 'motivo', 'detalhe'].forEach(function (k) {
            if (!out[k] && ticketHint[k]) out[k] = ticketHint[k];
        });

        return out;
    }

    function suggestClientResponse(messageText, ticket) {
        const msg = String(messageText || '').toLowerCase();
        const fullName = (ticket && (ticket.clientName || ticket.solicitante)) || 'cliente';
        const firstName = fullName.split(/\s+/)[0] || 'cliente';
        let body = '';

        if (/lent|veloc|wifi|wi-fi|fibra|internet|queda|roteador/.test(msg)) {
            body = 'Entendemos a dificuldade com a conexão no período informado. Nossa equipe já iniciou a análise da sua linha e, se necessário, agendará visita técnica com prioridade.';
        } else if (/bloque|inadim|fatura|cobran|boleto|débito|debito|duplic|contest/.test(msg)) {
            body = 'Recebemos sua solicitação referente à situação de faturamento. Vamos verificar os débitos em aberto e apresentar as opções de regularização ou negociação disponíveis para o seu plano.';
        } else if (/cancel|encerr|desist/.test(msg)) {
            body = 'Registramos sua intenção de cancelamento. Antes de prosseguir, gostaríamos de entender melhor sua necessidade e verificar alternativas que possam atendê-lo(a).';
        } else if (/upgrade|link|corporat|contrat|dedicad/.test(msg)) {
            body = 'Agradecemos o interesse na evolução do seu plano. Nossa equipe analisará a viabilidade técnica e retornará com proposta e prazos para implementação.';
        } else if (/instala|agend|visita|técnico|tecnico/.test(msg)) {
            body = 'Vamos verificar a disponibilidade de agenda e confirmar data e janela de atendimento. Em breve enviaremos a confirmação por este mesmo canal.';
        } else {
            body = 'Recebemos sua mensagem e nossa equipe está analisando os detalhes informados. Retornaremos em breve com a atualização do atendimento.';
        }

        const channel = String(detectTicketChannel(ticket)).toLowerCase();
        const opener = /whatsapp|chat/.test(channel)
            ? 'Olá, ' + firstName + '!'
            : 'Prezado(a) ' + fullName + ',';

        return reviewTextWithAI(opener + ' ' + body + ' Permaneço à disposição para qualquer dúvida.').revised;
    }

    function formatTabulationSuggestionLabel(tab) {
        const parts = [];
        if (tab.classificacaoTipo) parts.push(tab.classificacaoTipo);
        if (tab.produto) parts.push(tab.produto);
        if (tab.motivo) parts.push(tab.motivo);
        if (tab.detalhe) parts.push(tab.detalhe);
        return parts.join(' → ') || '—';
    }

    function renderVeloClientResponseSuggestionHtml(ticket, messageText) {
        if (!isClientDigitalTicket(ticket)) return '';
        const text = messageText || extractClientMessage(ticket);
        if (!text) return '';
        const suggestion = suggestClientResponse(text, ticket);
        const tid = ticket.id;
        return '<div class="velo-ai-suggest velo-ai-suggest--response" data-ticket-id="' + tid + '">' +
            '<div class="velo-ai-suggest__head">' +
            '<span class="velo-ai-suggest__title"><i class="fas fa-robot"></i> Sugestão de resposta</span>' +
            '<span class="velo-ai-suggest__tag">IA · tom Velodesk</span></div>' +
            '<p class="velo-ai-suggest__text">' + escapeHtmlEcosystem(suggestion) + '</p>' +
            '<div class="velo-ai-suggest__actions">' +
            '<button type="button" class="btn-primary btn-sm velo-ai-apply-response" data-ticket-id="' + tid + '">Usar na resposta</button>' +
            '<button type="button" class="btn-secondary btn-sm velo-ai-copy-response" data-ticket-id="' + tid + '">Copiar</button>' +
            '</div></div>';
    }

    function renderVeloTabulationSuggestionHtml(ticket) {
        if (!isClientDigitalTicket(ticket)) return '';
        const text = extractClientMessage(ticket);
        if (!text) return '';
        const tab = inferTabulationFromMessage(text, ticket);
        if (!tab.classificacaoTipo && !tab.produto && !tab.motivo) return '';
        const tid = ticket.id;
        const label = formatTabulationSuggestionLabel(tab);
        return '<div class="velo-ai-suggest velo-ai-suggest--tabulation" data-ticket-id="' + tid + '">' +
            '<textarea class="velo-ai-tabulation-data" aria-hidden="true" tabindex="-1" readonly style="display:none">' + escapeHtmlEcosystem(JSON.stringify(tab)) + '</textarea>' +
            '<div class="velo-ai-suggest__head">' +
            '<span class="velo-ai-suggest__title"><i class="fas fa-sitemap"></i> Sugestão de tabulação</span>' +
            '<span class="velo-ai-suggest__tag">IA</span></div>' +
            '<p class="velo-ai-suggest__path">' + escapeHtmlEcosystem(label) + '</p>' +
            '<div class="velo-ai-suggest__actions">' +
            '<button type="button" class="btn-primary btn-sm velo-ai-apply-tabulation" data-ticket-id="' + tid + '">Aplicar tabulação</button>' +
            '</div></div>';
    }

    window.applyVeloSuggestedResponse = function (ticketId) {
        const box = document.querySelector('.velo-ai-suggest--response[data-ticket-id="' + ticketId + '"]');
        const ta = document.getElementById('publicResponse-' + ticketId);
        if (!box || !ta) return;
        const suggestion = box.querySelector('.velo-ai-suggest__text');
        if (suggestion && suggestion.textContent) {
            ta.value = suggestion.textContent.trim();
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.focus();
            if (typeof showNotification === 'function') showNotification('Resposta sugerida aplicada ao campo', 'success');
        }
    };

    window.applyVeloSuggestedTabulation = function (ticketId) {
        const box = document.querySelector('.velo-ai-suggest--tabulation[data-ticket-id="' + ticketId + '"]');
        const panel = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"]');
        if (!box || !panel) return;
        const dataEl = box.querySelector('.velo-ai-tabulation-data');
        let tab = {};
        try {
            tab = JSON.parse(dataEl ? (dataEl.value || dataEl.textContent) : '{}');
        } catch (e) { return; }

        Object.keys(tab).forEach(function (key) {
            const el = panel.querySelector('[data-lf-key="' + key + '"]');
            if (el && tab[key]) el.value = tab[key];
        });

        if (typeof window.refreshTicketLateralFormCascade === 'function') {
            window.refreshTicketLateralFormCascade(ticketId);
        }

        setTimeout(function () {
            Object.keys(tab).forEach(function (key) {
                const el = panel.querySelector('[data-lf-key="' + key + '"]');
                if (el && tab[key]) el.value = tab[key];
            });
            if (typeof window.persistTicketLateralForm === 'function') {
                window.persistTicketLateralForm(ticketId, false);
            }
            if (typeof showNotification === 'function') showNotification('Tabulação sugerida aplicada', 'success');
        }, 80);
    };

    function initClientTicketAiSuggestions() {
        document.addEventListener('click', function (e) {
            const applyResp = e.target.closest('.velo-ai-apply-response');
            if (applyResp) {
                e.preventDefault();
                window.applyVeloSuggestedResponse(applyResp.getAttribute('data-ticket-id'));
                return;
            }
            const copyResp = e.target.closest('.velo-ai-copy-response');
            if (copyResp) {
                e.preventDefault();
                const tid = copyResp.getAttribute('data-ticket-id');
                const textEl = document.querySelector('.velo-ai-suggest--response[data-ticket-id="' + tid + '"] .velo-ai-suggest__text');
                const text = textEl ? textEl.textContent.trim() : '';
                if (text && navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        if (typeof showNotification === 'function') showNotification('Texto copiado', 'info');
                    });
                }
                return;
            }
            const applyTab = e.target.closest('.velo-ai-apply-tabulation');
            if (applyTab) {
                e.preventDefault();
                window.applyVeloSuggestedTabulation(applyTab.getAttribute('data-ticket-id'));
            }
        });
    }

    window.renderVeloClientResponseSuggestionHtml = renderVeloClientResponseSuggestionHtml;
    window.renderVeloTabulationSuggestionHtml = renderVeloTabulationSuggestionHtml;
    window.isClientDigitalTicket = isClientDigitalTicket;
    window.extractVelodeskClientMessage = extractClientMessage;

    function statCard(icon, value, label, warn) {
        return `<div class="ws-stat${warn ? ' ws-stat--warn' : ''}">
            <div class="ws-stat-icon"><i class="fas ${icon}"></i></div>
            <div><strong>${value}</strong><span>${label}</span></div>
        </div>`;
    }

    window.toggleProfileSwitcher = function () {
        const dd = document.getElementById('ecoProfileDropdown');
        if (dd) dd.classList.toggle('open');
    };

    document.addEventListener('click', (e) => {
        const dd = document.getElementById('ecoProfileDropdown');
        const badge = document.getElementById('profileRoleBadge');
        if (!dd || !badge) return;
        if (!dd.contains(e.target) && !badge.contains(e.target)) dd.classList.remove('open');
    });

    function findAllKanbanTickets() {
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        const list = [];
        columns.forEach(function (c) {
            (c.tickets || []).forEach(function (t) { list.push(t); });
        });
        return list;
    }

    function findTicketForSmartReason(reason) {
        const tickets = findAllKanbanTickets();
        if (!tickets.length) return null;
        if (reason === 'sla') {
            return tickets.find(function (t) { return t.priority === 'critica' || t.priority === 'critical' || t.slaCritical; }) || tickets[0];
        }
        if (reason === 'monitoria') {
            return tickets.find(function (t) { return t.status === 'em-aberto'; }) || tickets[1] || tickets[0];
        }
        if (reason === 'treinamento') {
            return tickets.find(function (t) { return t.status === 'novo'; }) || tickets[0];
        }
        if (reason === 'retorno') {
            return tickets.find(function (t) { return t.status === 'pendente' || t.status === 'em-espera'; }) || tickets[tickets.length - 1];
        }
        return tickets[0];
    }

    function renderSmartNotificationsHtml() {
        const defs = [
            { reason: 'sla', type: 'critical', label: 'SLA crítico', textFn: function (t) { return 'Ticket #' + t.id + ' — ' + (t.title || 'prioridade crítica'); } },
            { reason: 'monitoria', type: 'warning', label: 'Monitoria', textFn: function (t) { return 'Feedback disponível no ticket #' + t.id; } },
            { reason: 'treinamento', type: 'info', label: 'Treinamento', textFn: function (t) { return 'Treinamento pendente vinculado ao ticket #' + t.id; } },
            { reason: 'retorno', type: 'default', label: 'Retorno', textFn: function (t) { return 'Cliente aguardando resposta — ticket #' + t.id; } }
        ];
        return defs.map(function (d) {
            const t = findTicketForSmartReason(d.reason);
            if (!t) {
                return '<li class="ws-notif ws-notif--muted"><span>' + escapeHtmlEcosystem(d.label) + '</span> Sem tickets elegíveis</li>';
            }
            const typeClass = d.type === 'critical' ? 'ws-notif--critical' : d.type === 'warning' ? 'ws-notif--warning' : '';
            return '<li class="ws-notif ' + typeClass + ' ws-notif--clickable" role="button" tabindex="0" onclick="openSmartNotificationTicket(' + t.id + ')">' +
                '<span>' + escapeHtmlEcosystem(d.label) + '</span> ' + escapeHtmlEcosystem(d.textFn(t)) + '</li>';
        }).join('');
    }

    function normalizeDeskCpf(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function getStatusLabelDesk(status) {
        if (typeof window.getVeloStatusLabel === 'function') return window.getVeloStatusLabel(status);
        return status || '—';
    }

    function computeAgentDeskData() {
        const tickets = findAllKanbanTickets();
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const agentName = user.name || 'Agente';
        const db = JSON.parse(localStorage.getItem('velodeskClientDB') || '{}');
        const trainings = JSON.parse(localStorage.getItem('velodeskTrainings') || '[]');
        const monitorQueue = JSON.parse(localStorage.getItem('velodeskMonitorQueue') || '[]');

        const counts = { total: tickets.length, novos: 0, andamento: 0, pendente: 0, slaCritico: 0, resolvidos: 0 };
        const priorityScore = { critica: 4, critical: 4, alta: 3, high: 3, normal: 2, baixa: 1 };

        tickets.forEach(function (t) {
            if (t.status === 'novo') counts.novos++;
            else if (t.status === 'em-aberto') counts.andamento++;
            else if (t.status === 'pendente' || t.status === 'em-espera') counts.pendente++;
            else if (t.status === 'resolvido') counts.resolvidos++;
            if (t.priority === 'critica' || t.priority === 'critical') counts.slaCritico++;
        });

        const prioritized = tickets.slice().sort(function (a, b) {
            const pa = priorityScore[a.priority] || 1;
            const pb = priorityScore[b.priority] || 1;
            if (pb !== pa) return pb - pa;
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });

        const hotClients = [];
        const seenCpf = {};
        tickets.forEach(function (t) {
            const cpf = normalizeDeskCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
            if (!cpf || seenCpf[cpf]) return;
            const client = db[cpf];
            if (!client) return;
            const score = client.termometro != null ? client.termometro : 0;
            const riscoAlto = String(client.risco || '').toLowerCase().indexOf('alto') !== -1;
            if (score >= 55 || riscoAlto) {
                seenCpf[cpf] = true;
                hotClients.push({ ticket: t, client: client, score: score });
            }
        });
        hotClients.sort(function (a, b) { return b.score - a.score; });

        const channels = {};
        tickets.forEach(function (t) {
            const ch = (t.lateralForm && t.lateralForm.canal) || t.channel || t.source || 'Outros';
            channels[ch] = (channels[ch] || 0) + 1;
        });

        return {
            agentName: agentName,
            counts: counts,
            prioritized: prioritized,
            hotClients: hotClients,
            trainings: trainings,
            monitorQueue: monitorQueue,
            channels: channels
        };
    }

    function renderAgentQueueHtml(tickets) {
        if (!tickets.length) {
            return '<p class="ws-empty">Nenhum ticket na fila. Use <strong>Registro rápido</strong> ou aguarde novos atendimentos.</p>';
        }
        return '<ul class="ws-queue-list">' + tickets.slice(0, 6).map(function (t) {
            const pri = t.priority || 'normal';
            const priClass = pri === 'critica' || pri === 'critical' ? 'critical' : pri === 'alta' ? 'high' : 'normal';
            const title = (t.title || 'Sem título').length > 42 ? (t.title || '').substring(0, 42) + '…' : (t.title || 'Sem título');
            const client = t.clientName || t.solicitante || '';
            return '<li class="ws-queue-item" role="button" tabindex="0" onclick="openSmartNotificationTicket(' + t.id + ')">' +
                '<div class="ws-queue-item__row">' +
                '<span class="ws-queue-item__id">#' + t.id + '</span>' +
                '<span class="ws-queue-priority ws-queue-priority--' + priClass + '">' + escapeHtmlEcosystem(pri) + '</span></div>' +
                '<div class="ws-queue-item__title">' + escapeHtmlEcosystem(title) + '</div>' +
                (client ? '<div class="ws-queue-item__client"><i class="fas fa-user"></i> ' + escapeHtmlEcosystem(client) + '</div>' : '') +
                '<div class="ws-queue-item__meta">' + escapeHtmlEcosystem(getStatusLabelDesk(t.status)) + '</div></li>';
        }).join('') + '</ul>';
    }

    function renderHotClientsHtml(items) {
        if (!items.length) {
            return '<p class="ws-empty">Nenhum cliente com termômetro elevado no momento.</p>';
        }
        return '<ul class="ws-hot-list">' + items.slice(0, 4).map(function (item) {
            const c = item.client;
            const score = item.score;
            const nivel = score >= 80 ? 'quente' : score >= 55 ? 'morno' : 'frio';
            return '<li class="ws-hot-item ws-hot-item--' + nivel + '" role="button" tabindex="0" onclick="openSmartNotificationTicket(' + item.ticket.id + ')">' +
                '<div class="ws-hot-item__score">' + score + '°</div>' +
                '<div><strong>' + escapeHtmlEcosystem(c.name) + '</strong>' +
                '<span>' + escapeHtmlEcosystem(c.situacao || '') + ' · Risco ' + escapeHtmlEcosystem(c.risco || '—') + '</span>' +
                '<em>Ticket #' + item.ticket.id + '</em></div></li>';
        }).join('') + '</ul>';
    }

    function renderDeskChannelsHtml(channels) {
        const keys = Object.keys(channels);
        if (!keys.length) return '';
        return '<div class="ws-channel-pills">' + keys.map(function (ch) {
            return '<span class="ws-channel-pill"><i class="fas fa-hashtag"></i> ' + escapeHtmlEcosystem(ch) + ' <strong>' + channels[ch] + '</strong></span>';
        }).join('') + '</div>';
    }

    function renderAgentDeskShortcuts() {
        return '<div class="ws-desk-shortcuts">' +
            '<button type="button" class="ws-desk-btn" onclick="navigateToPage(\'tickets\')"><i class="fas fa-inbox"></i><span>Abrir tickets</span></button>' +
            '<button type="button" class="ws-desk-btn" onclick="openQuickRegisterModal()"><i class="fas fa-bolt"></i><span>Registro rápido</span></button>' +
            '<button type="button" class="ws-desk-btn" onclick="navigateToPage(\'chat\')"><i class="fas fa-comments"></i><span>Chat</span></button>' +
            MACROS.map(function (m) {
                return '<button type="button" class="ws-desk-btn ws-desk-btn--macro" onclick="insertMacro(\'' + m.key + '\')" title="' + escapeHtmlEcosystem(m.title) + '"><kbd>' + m.key + '</kbd><span>' + escapeHtmlEcosystem(m.title) + '</span></button>';
            }).join('') +
            '</div>';
    }

    function renderAgentWorkspaceHtml() {
        const desk = computeAgentDeskData();
        const now = new Date();
        const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
        const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        const monitorPending = desk.monitorQueue.length;

        return '<div class="ws-agent-desk">' +
            '<div class="ws-hero ws-hero--agent">' +
            '<div class="ws-agent-greeting">' +
            '<span class="ws-eyebrow">' + escapeHtmlEcosystem(dateStr) + '</span>' +
            '<h3>' + greeting + ', ' + escapeHtmlEcosystem(desk.agentName.split(' ')[0]) + '</h3>' +
            '<p>Seu desk está pronto. ' + desk.counts.total + ' ticket(s) na operação · priorize SLA e clientes críticos.</p>' +
            renderDeskChannelsHtml(desk.channels) +
            '</div>' +
            '<div class="ws-hero-actions">' +
            '<button type="button" class="btn-primary" onclick="navigateToPage(\'tickets\')"><i class="fas fa-play"></i> Iniciar atendimentos</button>' +
            '<button type="button" class="btn-secondary" onclick="openQuickRegisterModal()"><i class="fas fa-bolt"></i> Registro rápido</button>' +
            '</div></div>' +

            '<div class="ws-stats-grid">' +
            statCard('fa-inbox', desk.counts.novos, 'Novos na fila', desk.counts.novos > 0) +
            statCard('fa-headset', desk.counts.andamento, 'Em andamento') +
            statCard('fa-clock', desk.counts.slaCritico, 'SLA crítico', desk.counts.slaCritico > 0) +
            statCard('fa-reply', desk.counts.pendente, 'Aguardando retorno', desk.counts.pendente > 0) +
            '</div>' +

            '<div class="ws-grid-2 ws-agent-grid">' +
            '<section class="ws-panel ws-panel--queue">' +
            '<h4><i class="fas fa-list-ol"></i> Fila prioritária</h4>' +
            '<p class="ws-panel-hint">Clique para abrir o ticket no desk.</p>' +
            renderAgentQueueHtml(desk.prioritized) +
            '</section>' +

            '<section class="ws-panel ws-panel--notif">' +
            '<h4><i class="fas fa-bell"></i> Atenção imediata</h4>' +
            '<ul class="ws-notif-list">' + renderSmartNotificationsHtml() + '</ul>' +
            (monitorPending ? '<p class="ws-panel-foot"><i class="fas fa-clipboard-check"></i> ' + monitorPending + ' avaliação(ões) de monitoria na fila.</p>' : '') +
            '</section></div>' +

            '<div class="ws-grid-2 ws-agent-grid">' +
            '<section class="ws-panel ws-panel--hot">' +
            '<h4><i class="fas fa-fire"></i> Clientes em alerta</h4>' +
            '<p class="ws-panel-hint">Termômetro elevado ou risco alto — dados do cadastro consultado.</p>' +
            renderHotClientsHtml(desk.hotClients) +
            '</section>' +

            '<section class="ws-panel ws-panel--shortcuts">' +
            '<h4><i class="fas fa-rocket"></i> Acesso rápido ao desk</h4>' +
            renderAgentDeskShortcuts() +
            '</section></div>' +

            (desk.trainings.length ? '<section class="ws-panel ws-panel--training">' +
            '<h4><i class="fas fa-graduation-cap"></i> Treinamentos recomendados</h4>' +
            '<div class="ws-training-list">' + desk.trainings.map(function (t) {
                return '<div class="ws-training-item ws-priority-' + t.priority + '">' +
                    '<div><strong>' + escapeHtmlEcosystem(t.title) + '</strong><p>' + escapeHtmlEcosystem(t.reason) + '</p></div>' +
                    '<span class="ws-duration">' + escapeHtmlEcosystem(t.duration) + '</span></div>';
            }).join('') + '</div></section>' : '') +
            '</div>';
    }

    window.openSmartNotificationTicket = function (ticketId) {
        if (typeof navigateToPage === 'function') navigateToPage('tickets');
        setTimeout(function () {
            if (typeof openTicket === 'function') openTicket(ticketId);
        }, 250);
    };

    function tryAutoOpenSmartTicket() {
        if (sessionStorage.getItem('velodeskAutoOpenDone') === '1') return;
        const t = findTicketForSmartReason('sla');
        if (!t || typeof openTicket !== 'function') return;
        sessionStorage.setItem('velodeskAutoOpenDone', '1');
        setTimeout(function () {
            if (typeof navigateToPage === 'function') navigateToPage('tickets');
            setTimeout(function () { openTicket(t.id); }, 400);
        }, 1200);
    }

    window.VelodeskMACROS = MACROS;

    /* ─── Painel 360 por perfil ─── */
    window.renderWorkspace360 = function renderWorkspace360() {
        const el = document.getElementById('workspace360Content');
        if (!el) return;
        const profile = getProfile();
        const p = PROFILES[profile];
        const trainings = JSON.parse(localStorage.getItem('velodeskTrainings') || '[]');
        const monitorQueue = JSON.parse(localStorage.getItem('velodeskMonitorQueue') || '[]');
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let pendingTickets = 0;
        columns.forEach(c => { if (c.tickets) pendingTickets += c.tickets.length; });

        const blocks = {
            agent: renderAgentWorkspaceHtml(),
            supervisor: `
                <div class="ws-hero ws-hero--supervisor">
                    <div><span class="ws-eyebrow">Supervisão</span><h3>Performance da equipe</h3><p>SLA, escalonamentos e alertas em tempo real.</p></div>
                </div>
                <div class="ws-stats-grid">
                    ${statCard('fa-percentage', '87%', 'SLA cumprido')}
                    ${statCard('fa-exclamation-triangle', '5', 'Em risco de SLA', true)}
                    ${statCard('fa-users', '12', 'Agentes online')}
                    ${statCard('fa-smile', '4.2', 'NPS médio')}
                </div>
                <div class="ws-grid-2">
                    <section class="ws-panel"><h4>Escalonamentos automáticos</h4>
                        <ul class="ws-notif-list">
                            <li class="ws-notif ws-notif--critical">Ticket #4512 — SLA 92% — Agente: Ana Silva</li>
                            <li class="ws-notif ws-notif--warning">Risco de churn — Cliente Maria O. — Score 78</li>
                            <li class="ws-notif">Palavra-chave "Procon" — Ticket #4509</li>
                        </ul>
                    </section>
                    <section class="ws-panel"><h4>Ranking da equipe (hoje)</h4>
                        <ol class="ws-ranking"><li>Ana Silva <span>98% SLA · NPS 9</span></li><li>Carlos Mendes <span>94% SLA · NPS 8</span></li><li>Julia Costa <span>91% SLA · NPS 7</span></li></ol>
                    </section>
                </div>`,
            monitor: `
                <div class="ws-hero ws-hero--monitor">
                    <div><span class="ws-eyebrow">Monitoria</span><h3>Fila de avaliação</h3><p>Escute, pontue e gere feedback no ticket.</p></div>
                </div>
                <section class="ws-panel"><h4>Atendimentos para avaliar</h4>
                    <div class="ws-monitor-queue">${monitorQueue.map(m => `
                        <div class="ws-monitor-item">
                            <div><strong>${escapeHtmlEcosystem(m.agent)}</strong> · ${m.ticket} · ${m.channel} · ${m.duration}</div>
                            <div class="ws-monitor-actions">
                                <button class="btn-secondary btn-sm" onclick="openMonitorEvaluation(${m.id})"><i class="fas fa-play"></i> Avaliar</button>
                            </div>
                        </div>`).join('')}</div>
                </section>`,
            training: `
                <div class="ws-hero ws-hero--training">
                    <div><span class="ws-eyebrow">Treinamento</span><h3>Trilhas e gaps</h3><p>Recomendações baseadas em monitoria e volume.</p></div>
                </div>
                <section class="ws-panel">${trainings.map(t => `
                    <div class="ws-training-item ws-priority-${t.priority}">
                        <div><strong>${escapeHtmlEcosystem(t.title)}</strong><p>${escapeHtmlEcosystem(t.reason)}</p></div>
                        <button class="btn-primary btn-sm">Atribuir trilha</button>
                    </div>`).join('')}</section>`,
            management: `
                <div class="ws-hero ws-hero--mgmt">
                    <div><span class="ws-eyebrow">Gestão</span><h3>Visão estratégica</h3><p>Indicadores executivos e previsões.</p></div>
                    <button class="btn-primary" onclick="navigateToPage('analytics-ia')"><i class="fas fa-chart-line"></i> Analytics completo</button>
                </div>
                <div class="ws-stats-grid">
                    ${statCard('fa-phone-volume', '1.247', 'Volume hoje')}
                    ${statCard('fa-stopwatch', '4m 32s', 'TMA')}
                    ${statCard('fa-check-double', '76%', 'FCR')}
                    ${statCard('fa-chart-line', '+18%', 'Previsão amanhã')}
                </div>`
        };

        el.className = 'eco-page-inner eco-stagger';
        el.innerHTML = blocks[profile] || blocks.agent;
    };

    /* ─── Registro rápido adaptativo ─── */
    window.openQuickRegisterModal = function () {
        window._qrStep = 1;
        window._qrData = {};
        let modal = document.getElementById('quickRegisterModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quickRegisterModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-content--wide">
                <div class="modal-header">
                    <h3><i class="fas fa-bolt"></i> Registro rápido</h3>
                    <button type="button" class="close-btn" onclick="closeQuickRegisterModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" id="quickRegisterBody"></div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeQuickRegisterModal()">Cancelar</button>
                    <button type="button" class="btn-primary" onclick="saveQuickRegister()"><i class="fas fa-magic"></i> Criar ticket com IA</button>
                </div>
            </div>`;
        renderQuickRegisterStep();
    };

    window.closeQuickRegisterModal = function () {
        const m = document.getElementById('quickRegisterModal');
        if (m) m.style.display = 'none';
    };

    function renderQuickRegisterStep() {
        const body = document.getElementById('quickRegisterBody');
        if (!body) return;
        const step = window._qrStep || 1;
        const data = window._qrData || {};

        if (step === 1) {
            body.innerHTML = `
                <p class="forms-modal-lead">Selecione o tipo de contato. Os campos seguintes se adaptam automaticamente.</p>
                <div class="qr-options">${Object.entries(ADAPTIVE_FORM_TREE.contactTypes).map(([k, v]) =>
                    `<button type="button" class="qr-option ${data.contactType === k ? 'active' : ''}" onclick="selectQRField('contactType','${k}')">${v.label}</button>`
                ).join('')}</div>`;
        } else if (step === 2) {
            const channels = ADAPTIVE_FORM_TREE.contactTypes[data.contactType]?.channels || [];
            body.innerHTML = `
                <p class="forms-modal-lead">Canal de atendimento</p>
                <div class="qr-options">${channels.map(ch =>
                    `<button type="button" class="qr-option ${data.channel === ch ? 'active' : ''}" onclick="selectQRField('channel','${ch}')">${ch.charAt(0).toUpperCase() + ch.slice(1)}</button>`
                ).join('')}</div>`;
        } else if (step === 3) {
            body.innerHTML = `
                <p class="forms-modal-lead">Produto / serviço</p>
                <div class="qr-options">${Object.entries(ADAPTIVE_FORM_TREE.products).map(([k, v]) =>
                    `<button type="button" class="qr-option ${data.product === k ? 'active' : ''}" onclick="selectQRField('product','${k}')">${v.label}</button>`
                ).join('')}</div>`;
        } else if (step === 4) {
            const motives = ADAPTIVE_FORM_TREE.products[data.product]?.motives || [];
            body.innerHTML = `
                <p class="forms-modal-lead">Motivo (árvore Velohub)</p>
                <div class="qr-options">${motives.map(m =>
                    `<button type="button" class="qr-option ${data.motive === m ? 'active' : ''}" onclick="selectQRField('motive','${m}')">${ADAPTIVE_FORM_TREE.motives[m]}</button>`
                ).join('')}</div>`;
        } else {
            const motiveLabel = ADAPTIVE_FORM_TREE.motives[data.motive] || data.motive;
            const aiText = generateAITicketText(data);
            body.innerHTML = `
                <div class="qr-summary">
                    <span class="qr-pill">${ADAPTIVE_FORM_TREE.contactTypes[data.contactType]?.label}</span>
                    <span class="qr-pill">${data.channel}</span>
                    <span class="qr-pill">${ADAPTIVE_FORM_TREE.products[data.product]?.label}</span>
                    <span class="qr-pill">${motiveLabel}</span>
                </div>
                <div class="form-group"><label>Cliente</label><input type="text" id="qrClient" value="Maria Oliveira" class="form-control"></div>
                <div class="form-group"><label>Título sugerido pela IA</label><input type="text" id="qrTitle" value="${escapeHtmlEcosystem(aiText.title)}"></div>
                <div class="form-group"><label>Descrição revisada (tom da marca)</label><textarea id="qrDescription" rows="5">${escapeHtmlEcosystem(aiText.description)}</textarea></div>
                <div class="ai-suggestion-box"><i class="fas fa-robot"></i> <strong>Próxima ação:</strong> ${escapeHtmlEcosystem(aiText.nextAction)}</div>`;
            setTimeout(() => {
                const ta = document.getElementById('qrDescription');
                if (ta) attachAIReviewToField(ta);
            }, 50);
        }
        updateQRProgress(step);
    }

    function updateQRProgress(step) {
        const max = 5;
        const body = document.getElementById('quickRegisterBody');
        if (!body) return;
        const prog = document.createElement('div');
        prog.className = 'qr-progress';
        prog.innerHTML = `<div class="qr-progress-bar" style="width:${(step / max) * 100}%"></div><span>Etapa ${step} de ${max}</span>`;
        body.prepend(prog);
    }

    window.selectQRField = function (field, value) {
        window._qrData = window._qrData || {};
        window._qrData[field] = value;
        window._qrStep = (window._qrStep || 1) + 1;
        renderQuickRegisterStep();
    };

    function generateAITicketText(data) {
        const motive = ADAPTIVE_FORM_TREE.motives[data.motive] || 'atendimento geral';
        const product = ADAPTIVE_FORM_TREE.products[data.product]?.label || 'serviço';
        const channel = data.channel || 'canal';
        const title = `${motive} — ${product}`;
        const description = reviewTextWithAI(
            `Cliente entrou em contato via ${channel} referente a ${motive.toLowerCase()} no ${product}. ` +
            `Nossa equipe está analisando a situação e buscando a melhor solução conforme o processo Velohub.`
        ).revised;
        const actions = {
            cobranca: 'Verificar faturas e abrir contestação se necessário',
            cancelamento: 'Acionar script de retenção e oferecer benefício',
            lentidao: 'Executar diagnóstico remoto e agendar visita técnica',
            queda: 'Verificar incidentes na região e escalar para N2'
        };
        return { title, description, nextAction: actions[data.motive] || 'Seguir fluxo padrão do bot de processos' };
    }

    window.saveQuickRegister = function () {
        const title = document.getElementById('qrTitle')?.value;
        const desc = document.getElementById('qrDescription')?.value;
        if (!title) return;
        closeQuickRegisterModal();
        window._qrStep = 1;
        window._qrData = {};
        if (typeof createNewTicket === 'function') {
            navigateToPage('tickets');
            setTimeout(() => {
                createNewTicket();
                setTimeout(() => {
                    const t = document.getElementById('ticketTitle');
                    const d = document.getElementById('ticketDescription');
                    if (t) t.value = title;
                    if (d) d.value = desc;
                }, 300);
            }, 200);
        }
        if (typeof showNotification === 'function') showNotification('Ticket criado com sugestão da IA!', 'success');
    };

    /* ─── Cliente do atendimento (popup por ticket) ─── */
    function normalizeClientCpf(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function findKanbanTicketById(ticketId) {
        const id = parseInt(ticketId, 10);
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        for (const box of columns) {
            if (!box.tickets) continue;
            const t = box.tickets.find(function (x) { return x.id === id; });
            if (t) return t;
        }
        const tabInfo = window.openTicketTabs && window.openTicketTabs.get(id);
        return tabInfo ? tabInfo.ticket : null;
    }

    function getCpfFromTicketRecord(ticket, ticketId) {
        if (!ticket) return '';
        const panelCpf = document.querySelector('.velo-lateral-form-panel[data-ticket-id="' + ticketId + '"] [data-lf-key="cpf"]');
        const liveCpf = panelCpf ? panelCpf.value : '';
        return normalizeClientCpf(
            liveCpf || (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF || ''
        );
    }

    function collectClientTickets(cpf, clientName) {
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        const list = [];
        const nameKey = (clientName || '').toLowerCase().trim();
        columns.forEach(function (box) {
            (box.tickets || []).forEach(function (t) {
                const tCpf = normalizeClientCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF || '');
                const tName = (t.clientName || t.solicitante || '').toLowerCase();
                const titleMatch = nameKey && (t.title || '').toLowerCase().indexOf(nameKey) !== -1;
                if ((cpf && tCpf === cpf) || (nameKey && (tName === nameKey || titleMatch))) {
                    list.push(t);
                }
            });
        });
        list.sort(function (a, b) {
            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
        return list;
    }

    function renderClientTicketRows(tickets) {
        if (!tickets.length) {
            return '<tr><td colspan="5" class="client360-empty">Nenhum ticket encontrado para este cliente.</td></tr>';
        }
        return tickets.map(function (t) {
            const statusLabel = typeof getVeloStatusLabel === 'function'
                ? getVeloStatusLabel(t.status)
                : (t.status || '—');
            const date = t.updatedAt || t.createdAt;
            const dateFmt = date ? new Date(date).toLocaleDateString('pt-BR') : '—';
            const channel = (t.lateralForm && t.lateralForm.canal) || t.channel || t.source || '—';
            return '<tr class="client360-row--clickable" onclick="openClientTicketFromModal(' + t.id + ')">' +
                '<td>#' + t.id + '</td>' +
                '<td>' + escapeHtmlEcosystem(t.title || 'Sem título') + '</td>' +
                '<td>' + escapeHtmlEcosystem(channel) + '</td>' +
                '<td>' + escapeHtmlEcosystem(statusLabel) + '</td>' +
                '<td>' + escapeHtmlEcosystem(dateFmt) + '</td></tr>';
        }).join('');
    }

    window.openClientTicketFromModal = function (ticketId) {
        closeEcosystemModal();
        if (typeof openTicket === 'function') {
            if (typeof navigateToPage === 'function') navigateToPage('tickets');
            setTimeout(function () { openTicket(ticketId); }, 200);
        }
    };

    window.openClientFromTicket = function (ticketId) {
        const ticket = findKanbanTicketById(ticketId);
        if (!ticket) {
            if (typeof showNotification === 'function') showNotification('Ticket não encontrado.', 'warning');
            return;
        }

        const cpf = getCpfFromTicketRecord(ticket, ticketId);
        let client = null;
        if (typeof lookupVelodeskClientByCpf === 'function' && cpf.length === 11) {
            client = lookupVelodeskClientByCpf(cpf);
        }

        const clientName = (client && client.name) ||
            ticket.clientName || ticket.solicitante ||
            (ticket.title || '').split('—').pop().trim() || 'Cliente não identificado';

        let clientTickets = collectClientTickets(cpf, clientName);
        if (clientTickets.length === 0) clientTickets = [ticket];

        const cpfDisplay = client ? client.cpf : (cpf.length === 11 ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—');
        const situacao = client ? client.situacao : 'Informe o CPF no formulário lateral';
        const risco = client ? client.risco : '—';
        const produtos = client && client.produtos ? client.produtos.join(', ') : '—';
        const analise = client ? client.analise : 'Consulte o CPF no painel lateral para carregar o cadastro completo.';

        openConfigStyleModal(
            'Cliente — ' + escapeHtmlEcosystem(clientName),
            '<div class="client360-profile">' +
            '<div class="client360-grid">' +
            '<div class="client360-card"><strong>CPF</strong><span>' + escapeHtmlEcosystem(cpfDisplay) + '</span></div>' +
            '<div class="client360-card"><strong>Situação</strong><span>' + escapeHtmlEcosystem(situacao) + '</span></div>' +
            '<div class="client360-card client360-risk"><strong>Risco</strong><span>' + escapeHtmlEcosystem(risco) + '</span></div>' +
            '</div>' +
            '<p><strong>Produtos:</strong> ' + escapeHtmlEcosystem(produtos) + '</p>' +
            '<p class="client360-analise"><i class="fas fa-brain"></i> ' + escapeHtmlEcosystem(analise) + '</p>' +
            '<h5 class="client360-section-title">Tickets atendidos (' + clientTickets.length + ')</h5>' +
            '<div class="client360-table-wrap"><table class="client360-table"><thead><tr>' +
            '<th>Ticket</th><th>Assunto</th><th>Canal</th><th>Status</th><th>Data</th>' +
            '</tr></thead><tbody>' + renderClientTicketRows(clientTickets) + '</tbody></table></div>' +
            '</div>',
            '<button type="button" class="btn-secondary" onclick="closeEcosystemModal()">Fechar</button>'
        );
    };

    window.openClient360 = function (clientId) {
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let first = null;
        columns.some(function (box) {
            return (box.tickets || []).some(function (t) {
                first = t;
                return true;
            });
        });
        if (first) openClientFromTicket(first.id);
        else if (typeof showNotification === 'function') showNotification('Nenhum ticket disponível.', 'info');
    };

    /* ─── Monitoria ─── */
    window.openMonitorEvaluation = function (id) {
        const queue = JSON.parse(localStorage.getItem('velodeskMonitorQueue') || '[]');
        const item = queue.find(m => m.id === id);
        if (!item) return;
        openConfigStyleModal('Avaliar atendimento — ' + item.agent, `
            <p>${item.ticket} · ${item.channel} · Duração: ${item.duration}</p>
            <div class="form-group"><label>Qualidade (0-100)</label><input type="range" id="monScore" min="0" max="100" value="85" oninput="document.getElementById('monScoreVal').textContent=this.value"></div>
            <p>Nota: <strong id="monScoreVal">85</strong></p>
            <div class="form-group"><label>Feedback para o agente</label><textarea id="monFeedback" rows="4" placeholder="Pontos de melhoria...">Boa condução do atendimento. Sugerimos usar saudação mais formal no início.</textarea></div>
        `, `<button class="btn-secondary" onclick="closeEcosystemModal()">Cancelar</button>
            <button class="btn-primary" onclick="saveMonitorFeedback(${id})">Salvar e notificar agente</button>`);
        setTimeout(() => attachAIReviewToField(document.getElementById('monFeedback')), 50);
    };

    window.saveMonitorFeedback = function (id) {
        closeEcosystemModal();
        if (typeof showNotification === 'function') showNotification('Feedback enviado ao painel do agente', 'success');
    };

    /* ─── Assistência em ligação (IA) ─── */
    window.toggleCallAssist = function () {
        callAssistActive = !callAssistActive;
        const panel = document.getElementById('callAssistPanel');
        if (panel) panel.classList.toggle('active', callAssistActive);
        if (callAssistActive) simulateCallAssist();
        if (typeof showNotification === 'function') {
            showNotification(callAssistActive ? 'Atendimento IA ativo na ligação' : 'Atendimento IA encerrado', 'info');
        }
    };

    function simulateCallAssist() {
        const suggestions = document.getElementById('callAssistSuggestions');
        if (!suggestions) return;
        const motives = ['Cobrança indevida', 'Lentidão de conexão', 'Cancelamento'];
        const actions = ['Verificar fatura no Velohub', 'Abrir diagnóstico remoto', 'Acionar retenção'];
        let i = 0;
        const interval = setInterval(() => {
            if (!callAssistActive) { clearInterval(interval); return; }
            sentimentScore = Math.max(20, Math.min(95, sentimentScore + (Math.random() > 0.6 ? -8 : 5)));
            updateSentimentUI();
            if (i < motives.length) {
                suggestions.innerHTML = `
                    <div class="ca-item"><i class="fas fa-sitemap"></i><div><strong>Árvore de motivos</strong><p>${motives[i]}</p></div></div>
                    <div class="ca-item"><i class="fas fa-file-alt"></i><div><strong>Texto sugerido</strong><p>Cliente relata ${motives[i].toLowerCase()}. Nossa equipe está verificando conforme processo #VH-${1200 + i}.</p></div></div>
                    <div class="ca-item"><i class="fas fa-arrow-right"></i><div><strong>Próxima ação</strong><p>${actions[i]}</p></div></div>`;
                i++;
            }
        }, 4000);
    }

    function updateSentimentUI() {
        const el = document.getElementById('sentimentIndicator');
        if (!el) return;
        let mood = 'neutro', icon = 'fa-meh', cls = 'sentiment--neutral';
        if (sentimentScore < 40) { mood = 'frustrado'; icon = 'fa-frown'; cls = 'sentiment--negative'; }
        else if (sentimentScore > 70) { mood = 'satisfeito'; icon = 'fa-smile'; cls = 'sentiment--positive'; }
        el.className = 'sentiment-indicator ' + cls;
        el.innerHTML = `<i class="fas ${icon}"></i><div><strong>Sentimento: ${mood}</strong><span>Score ${sentimentScore}% — ${sentimentScore < 40 ? 'Use tom empático e ofereça solução rápida' : 'Mantenha o ritmo positivo'}</span></div>`;
    }

    window.generateCallSummary = function () {
        const summary = reviewTextWithAI(
            'Cliente entrou em contato reclamando de cobrança duplicada na fatura de maio. Foi verificado no sistema e identificada divergência. Estorno solicitado com prazo de 5 dias úteis. Cliente demonstrou satisfação ao final.'
        ).revised;
        openConfigStyleModal('Resumo automático pós-ligação', `
            <p class="forms-modal-lead">IA preencheu automaticamente os campos do ticket:</p>
            <div class="form-group"><label>Resumo</label><textarea rows="4" readonly>${escapeHtmlEcosystem(summary)}</textarea></div>
            <div class="form-group"><label>Classificação sugerida</label><input readonly value="Reclamação > Cobrança > Cobrança indevida"></div>
            <div class="form-group"><label>Tags</label><input readonly value="cobrança, estorno, resolvido"></div>
        `, `<button class="btn-primary" onclick="closeEcosystemModal()">Aplicar ao ticket</button>`);
    };

    /* ─── Analytics IA ─── */
    window.renderAnalyticsIA = function renderAnalyticsIA() {
        const el = document.getElementById('analyticsIAContent');
        if (!el) return;
        el.className = 'eco-page-inner eco-stagger';
        el.innerHTML = `
            <div class="ws-hero ws-hero--mgmt">
                <div><span class="ws-eyebrow">Analytics & Gestão</span><h3>Dashboard executivo em tempo real</h3><p>TMA, SLA, NPS e previsões atualizados continuamente.</p></div>
                <div class="analytics-filters">
                    <select id="analyticsPeriod"><option>Hoje</option><option>7 dias</option><option>30 dias</option></select>
                    <select><option>Todos os produtos</option><option>Internet</option><option>Móvel</option></select>
                </div>
            </div>
            <div class="ws-stats-grid ws-stats-grid--6">
                ${statCard('fa-stopwatch', '4m 12s', 'TMA')}
                ${statCard('fa-hourglass-half', '6m 45s', 'TME')}
                ${statCard('fa-check-double', '76%', 'FCR')}
                ${statCard('fa-smile', '72', 'NPS')}
                ${statCard('fa-percentage', '91%', 'SLA')}
                ${statCard('fa-phone-volume', '1.247', 'Volume')}
            </div>
            <div class="ws-grid-2">
                <section class="ws-panel"><h4><i class="fas fa-fire"></i> Mapa de reclamações (calor)</h4>
                    <div class="heatmap">
                        ${['Cobrança', 'Lentidão', 'Cancelamento', 'Instalação', 'Sinal'].map((r, i) =>
                            `<div class="heatmap-row"><span>${r}</span><div class="heatmap-cells">${[40, 90, 30, 70, 55].map((v, j) =>
                                `<div class="heatmap-cell" style="--intensity:${v + i * 5}" title="${v}%">${v}%</div>`
                            ).join('')}</div></div>`
                        ).join('')}
                        <div class="heatmap-legend"><span>Internet</span><span>Móvel</span><span>TV</span><span>Combo</span><span>Geral</span></div>
                    </div>
                </section>
                <section class="ws-panel"><h4><i class="fas fa-chart-area"></i> Previsão de volume (IA)</h4>
                    <canvas id="volumePredictionChart" height="200"></canvas>
                    <p class="forms-toolbar-hint">Pico previsto: amanhã 14h–17h (+18%). Escale 3 agentes extras.</p>
                </section>
            </div>
            <section class="ws-panel"><h4><i class="fas fa-trophy"></i> Performance individual</h4>
                <table class="client360-table"><thead><tr><th>#</th><th>Agente</th><th>Qualidade</th><th>Velocidade</th><th>NPS</th><th>Evolução</th></tr></thead>
                <tbody>
                    <tr><td>1</td><td>Ana Silva</td><td>94%</td><td>4m 02s</td><td>9.1</td><td class="trend-up">↑ 5%</td></tr>
                    <tr><td>2</td><td>Carlos Mendes</td><td>89%</td><td>4m 28s</td><td>8.4</td><td class="trend-up">↑ 2%</td></tr>
                    <tr><td>3</td><td>Julia Costa</td><td>86%</td><td>5m 10s</td><td>7.8</td><td class="trend-down">↓ 1%</td></tr>
                </tbody></table>
            </section>`;
        renderVolumeChart();
    };

    function renderVolumeChart() {
        const canvas = document.getElementById('volumePredictionChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (canvas._chart) canvas._chart.destroy();
        canvas._chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [
                    { label: 'Real', data: [980, 1100, 1050, 1200, 1150, 400, 300], borderColor: '#2563eb', tension: 0.3 },
                    { label: 'Previsto', data: [null, null, null, null, 1150, 520, 380], borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3 }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
        });
    }

    /* ─── Portal do cliente (preview) ─── */
    window.renderClientPortal = function renderClientPortal() {
        const el = document.getElementById('clientPortalContent');
        if (!el) return;
        el.className = 'eco-page-inner eco-stagger';
        el.innerHTML = `
            <div class="portal-preview-banner"><i class="fas fa-eye"></i> Pré-visualização do Portal do Cliente — self-service para reduzir volume de ligações</div>
            <div class="portal-mock">
                <header class="portal-mock-header"><h3>Olá, Maria!</h3><p>Acompanhe seus chamados</p></header>
                <div class="portal-mock-stats">
                    <div><strong>2</strong><span>Abertos</span></div>
                    <div><strong>8</strong><span>Resolvidos</span></div>
                    <div><strong>NPS 9</strong><span>Última avaliação</span></div>
                </div>
                <div class="portal-ticket-list">
                    <div class="portal-ticket"><span class="portal-status open">Em andamento</span><strong>#4512 Cobrança duplicada</strong><p>Atualizado há 2 horas</p></div>
                    <div class="portal-ticket"><span class="portal-status done">Resolvido</span><strong>#4490 Lentidão à noite</strong><p>Resolvido em 28/05</p></div>
                </div>
                <button class="btn-primary portal-new-btn"><i class="fas fa-plus"></i> Nova solicitação</button>
                <section class="portal-kb"><h4>Base de conhecimento</h4>
                    <a href="#">Como consultar sua fatura</a>
                    <a href="#">Teste de velocidade da internet</a>
                    <a href="#">Como solicitar cancelamento</a>
                </section>
            </div>`;
    };

    /* ─── Perfil UI ─── */
    function applyProfileUI() {
        const profile = getProfile();
        const p = PROFILES[profile];
        document.body.dataset.velodeskProfile = profile;

        const badge = document.getElementById('profileRoleBadge');
        if (badge) {
            badge.style.background = `linear-gradient(135deg, ${p.color}, var(--eco-blue, #1a3fd4))`;
            badge.innerHTML = `<i class="fas ${p.icon}"></i> <span>${p.label}</span> <i class="fas fa-chevron-down eco-badge-chevron"></i>`;
        }
        const dd = document.getElementById('ecoProfileDropdown');
        if (dd) dd.classList.remove('open');

        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            const page = item.getAttribute('data-page');
            const allowed = p.nav.includes(page);
            item.style.display = allowed ? '' : 'none';
            item.classList.toggle('nav-item--hidden-profile', !allowed);
        });

        document.querySelectorAll('.eco-profile-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.profile === profile);
        });

        if (document.getElementById('workspace')?.classList.contains('active')) renderWorkspace360();
        if (document.getElementById('analytics-ia')?.classList.contains('active')) renderAnalyticsIA();
    }

    window.switchVelodeskProfile = function (id) {
        setProfile(id);
        const p = PROFILES[id];
        const dd = document.getElementById('ecoProfileDropdown');
        if (dd) dd.classList.remove('open');
        navigateToPage(p.defaultPage);
    };

    /* ─── Macros ─── */
    window.insertMacro = function (key) {
        const macro = MACROS.find(m => m.key === key);
        if (!macro) return;
        const active = document.activeElement;
        const text = macro.text.replace('{{agente}}', 'Agente');
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
            active.value = (active.value ? active.value + '\n' : '') + text;
            active.dispatchEvent(new Event('input'));
        } else if (typeof showNotification === 'function') {
            showNotification(`Macro ${key}: ${macro.title}`, 'info');
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('F') && e.key.length <= 3) {
            const macro = MACROS.find(m => m.key === e.key);
            if (macro && document.getElementById('mainApp')?.style.display !== 'none') {
                e.preventDefault();
                insertMacro(e.key);
            }
        }
    });

    /* ─── Helpers ─── */
    function escapeHtmlEcosystem(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function openConfigStyleModal(title, body, footer) {
        let modal = document.getElementById('ecosystemModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ecosystemModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content modal-content--wide">
                <div class="modal-header"><h3>${title}</h3><button class="close-btn" onclick="closeEcosystemModal()"><i class="fas fa-times"></i></button></div>
                <div class="modal-body">${body}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>`;
    }

    window.closeEcosystemModal = function () {
        const m = document.getElementById('ecosystemModal');
        if (m) m.style.display = 'none';
    };

    function injectCallAssistPanel() {
        if (document.getElementById('callAssistPanel')) return;
        const panel = document.createElement('aside');
        panel.id = 'callAssistPanel';
        panel.className = 'call-assist-panel';
        panel.innerHTML = `
            <header class="ca-header">
                <h4><i class="fas fa-headset"></i> Atendimento IA</h4>
                <button type="button" onclick="toggleCallAssist()"><i class="fas fa-times"></i></button>
            </header>
            <div id="sentimentIndicator" class="sentiment-indicator sentiment--neutral">
                <i class="fas fa-meh"></i><div><strong>Sentimento: neutro</strong><span>Aguardando ligação...</span></div>
            </div>
            <div id="callAssistSuggestions" class="ca-suggestions">
                <p class="ca-empty">Inicie uma ligação para receber sugestões em tempo real.</p>
            </div>
            <div class="ca-risk-alert"><i class="fas fa-exclamation-triangle"></i> Risco de churn: 35% — priorizar retenção</div>
            <footer class="ca-footer">
                <button class="btn-primary btn-sm" onclick="generateCallSummary()"><i class="fas fa-file-alt"></i> Gerar resumo</button>
            </footer>`;
        document.body.appendChild(panel);
    }

    function syncChromeTopOffset() {
        const banner = document.querySelector('.eco-prototype-banner');
        const h = banner ? banner.offsetHeight : 0;
        document.body.style.setProperty('--velo-banner-height', h + 'px');
    }

    function injectPrototypeBanner() {
        if (document.getElementById('ecoPrototypeBanner')) {
            syncChromeTopOffset();
            return;
        }
        const banner = document.createElement('div');
        banner.id = 'ecoPrototypeBanner';
        banner.className = 'eco-prototype-banner';
        banner.innerHTML = `<i class="fas fa-flask"></i> Protótipo V3 — Ecossistema Velodesk (local) · <button type="button" onclick="this.parentElement.remove(); if(window.syncChromeTopOffset) window.syncChromeTopOffset();">ocultar</button>`;
        document.body.appendChild(banner);
        syncChromeTopOffset();
    }
    window.syncChromeTopOffset = syncChromeTopOffset;

    function ensureDeskAgentUser() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.name) {
                localStorage.setItem('currentUser', JSON.stringify({
                    id: 1,
                    name: 'Ana Silva',
                    email: 'ana.silva@velodesk.demo',
                    role: 'agent'
                }));
            }
        } catch (e) { /* noop */ }
    }

    /* ─── Init & hooks ─── */
    window.initVelodeskEcosystem = function () {
        seedEcosystemData();
        ensureDeskAgentUser();
        if (typeof window.seedDemoTickets === 'function') {
            window.seedDemoTickets({ force: true, replaceAll: true });
        }
        injectPrototypeBanner();
        initGlobalAIReview();
        initClientTicketAiSuggestions();
        applyProfileUI();
        renderWorkspace360();
        tryAutoOpenSmartTicket();

        const origNavigate = window.navigateToPage;
        if (origNavigate && !window._ecoNavHooked) {
            window._ecoNavHooked = true;
            window.navigateToPage = function (page) {
                origNavigate(page);
                document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.toggle('active', n.getAttribute('data-page') === page));
                if (page === 'workspace') renderWorkspace360();
                if (page === 'analytics-ia') renderAnalyticsIA();
                if (page === 'client-portal') renderClientPortal();
            };
        }

        const origLogin = window.fazerLogin;
        if (origLogin && !window._ecoLoginHooked) {
            window._ecoLoginHooked = true;
            window.fazerLogin = function () {
                origLogin();
                setTimeout(initVelodeskEcosystem, 150);
            };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (localStorage.getItem('isLoggedIn') === 'true') initVelodeskEcosystem();
        });
    } else if (localStorage.getItem('isLoggedIn') === 'true') {
        initVelodeskEcosystem();
    }
})();
