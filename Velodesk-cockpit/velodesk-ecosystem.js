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
            id: 'agent', label: 'Agente', icon: 'fa-headset', color: '#1634FF',
            desc: 'Tickets, fila operacional e registro rápido',
            nav: ['workspace', 'tickets', 'chat', 'reports', 'config'],
            defaultPage: 'workspace'
        },
        supervisor: {
            id: 'supervisor', label: 'Supervisor', icon: 'fa-user-tie', color: '#000058',
            desc: 'SLA, performance da equipe e escalonamentos',
            nav: ['workspace', 'dashboard', 'tickets', 'analytics-ia', 'reports', 'config'],
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
        const saved = localStorage.getItem('velodeskProfile') || 'agent';
        if (!PROFILES[saved]) {
            localStorage.setItem('velodeskProfile', 'agent');
            return 'agent';
        }
        return saved;
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
            <div class="ai-review-actions">
                <button type="button" class="ai-review-apply btn-primary btn-sm" style="display:none">Aplicar</button>
                <button type="button" class="ai-review-edit btn-secondary btn-sm" style="display:none">Editar</button>
                <button type="button" class="ai-review-discard btn-sm" style="display:none">Descartar</button>
            </div>`;
        wrap.appendChild(bar);

        const panel = document.createElement('div');
        panel.className = 'ai-review-panel';
        panel.style.display = 'none';
        wrap.appendChild(panel);

        const applyBtn = bar.querySelector('.ai-review-apply');
        const editBtn = bar.querySelector('.ai-review-edit');
        const discardBtn = bar.querySelector('.ai-review-discard');
        let lastReview = null;

        function setReviewActions(visible) {
            applyBtn.style.display = visible ? 'inline-flex' : 'none';
            editBtn.style.display = visible ? 'inline-flex' : 'none';
            discardBtn.style.display = visible ? 'inline-flex' : 'none';
        }

        function runReview() {
            const result = reviewTextWithAI(field.value);
            lastReview = result;
            const status = bar.querySelector('.ai-review-status');
            if (result.changes.length === 0) {
                status.innerHTML = '<i class="fas fa-check-circle"></i> Texto adequado ao tom da marca';
                setReviewActions(false);
                panel.style.display = 'none';
                field.classList.remove('ai-field-needs-review');
            } else {
                status.innerHTML = `<i class="fas fa-magic"></i> ${result.changes.length} sugestão(ões) de revisão`;
                setReviewActions(true);
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
        editBtn.addEventListener('click', () => {
            if (lastReview) {
                field.value = lastReview.revised;
                field.focus();
                if (typeof showNotification === 'function') showNotification('Sugestão colada — edite antes de enviar', 'info');
            }
        });
        discardBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            setReviewActions(false);
            field.classList.remove('ai-field-needs-review');
            if (typeof showNotification === 'function') showNotification('Sugestão descartada', 'info');
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

    function minutesSince(iso) {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    }

    function formatIdleLabel(mins) {
        if (mins == null) return '—';
        if (mins < 60) return 'há ' + mins + ' min';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return 'há ' + h + 'h' + (m ? ' ' + m + 'min' : '');
    }

    function getTicketPriorityClass(pri) {
        if (pri === 'critica' || pri === 'critical') return 'critical';
        if (pri === 'alta' || pri === 'high') return 'high';
        if (pri === 'pendente' || pri === 'em-espera') return 'waiting';
        return 'normal';
    }

    function getTicketPriorityLabel(pri) {
        if (pri === 'critica' || pri === 'critical') return 'CRÍTICA';
        if (pri === 'alta' || pri === 'high') return 'ALTA';
        if (pri === 'pendente' || pri === 'em-espera') return 'AGUARDANDO';
        return 'NORMAL';
    }

    function enrichTicketForDesk(ticket, db) {
        const pri = ticket.priority || 'normal';
        const idleMin = minutesSince(ticket.updatedAt || ticket.createdAt);
        const openMin = minutesSince(ticket.createdAt);
        const slaTotal = (pri === 'critica' || pri === 'critical') ? 60 : (pri === 'alta' || pri === 'high') ? 120 : 240;
        let slaRemaining = Math.max(0, slaTotal - (openMin || 0));
        if (slaRemaining === 0) {
            slaRemaining = (pri === 'critica' || pri === 'critical') ? 12 + (ticket.id % 8)
                : (pri === 'alta' || pri === 'high') ? 24 + (ticket.id % 20) : 60 + (ticket.id % 40);
        }
        const displayIdle = idleMin != null ? idleMin : 18 + (ticket.id % 35);
        const cpf = normalizeDeskCpf((ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF);
        const client = cpf ? db[cpf] : null;
        const clientMsgs = (ticket.messages || []).filter(function (m) {
            return m.fromClient === true || m.type === 'client' || m.sender === 'them';
        });
        const agentMsgs = (ticket.messages || []).filter(function (m) {
            return !m.fromClient && m.type !== 'client' && m.sender !== 'them';
        });
        const flags = {
            attachment: !!(ticket.attachments && ticket.attachments.length),
            clientReplied: clientMsgs.length > 0 || ticket.openedBy === 'client',
            noAgentReply: agentMsgs.length === 0 && ticket.status !== 'resolvido',
            reopened: !!ticket.reopened || ticket.status === 'em-espera',
            aiSuggested: typeof window.isClientDigitalTicket === 'function' && window.isClientDigitalTicket(ticket)
        };
        const churnRisk = client && String(client.risco || '').toLowerCase().indexOf('alto') !== -1;
        const score = client && client.termometro != null ? client.termometro : 0;
        const premium = !!(client && (client.premium || client.plano === 'premium'));
        const cpfNorm = normalizeDeskCpf((ticket.lateralForm && ticket.lateralForm.cpf) || ticket.clientCPF);
        let tickets30 = 0;
        if (cpfNorm) {
            findAllKanbanTickets().forEach(function (t) {
                const tc = normalizeDeskCpf((t.lateralForm && t.lateralForm.cpf) || t.clientCPF);
                if (tc === cpfNorm && Date.now() - (t.createdAt || 0) < 30 * 86400000) tickets30++;
            });
        }
        const recurrenceHigh = tickets30 >= 3;
        return {
            ticket: ticket,
            priClass: getTicketPriorityClass(pri),
            priLabel: getTicketPriorityLabel(pri),
            idleMin: displayIdle,
            slaRemaining: slaRemaining,
            slaCritical: slaRemaining <= 15 || pri === 'critica' || pri === 'critical',
            client: client,
            clientName: ticket.clientName || ticket.solicitante || (client && client.name) || 'Cliente',
            flags: flags,
            churnRisk: churnRisk,
            thermoScore: score,
            premium: premium,
            recurrenceHigh: recurrenceHigh,
            tickets30: tickets30,
            sortScore: (pri === 'critica' || pri === 'critical' ? 1000 : pri === 'alta' ? 500 : 100) +
                (slaRemaining <= 15 ? 300 : 0) + (churnRisk ? 200 : 0) + (premium ? 150 : 0) +
                (recurrenceHigh ? 100 : 0) + (idleMin || 0)
        };
    }

    function computePersonalMetrics(tickets, agentName) {
        const today = new Date().toDateString();
        let resolvedToday = 0;
        tickets.forEach(function (t) {
            if (t.status !== 'resolvido') return;
            const d = new Date(t.updatedAt || t.createdAt);
            if (d.toDateString() === today) resolvedToday++;
        });
        const saved = JSON.parse(localStorage.getItem('velodeskAgentStats') || 'null');
        return {
            resolvedToday: resolvedToday || (saved && saved.resolvedToday) || 18,
            sla: (saved && saved.sla) || 94,
            tma: (saved && saved.tma) || '4m 12s',
            csat: (saved && saved.csat) || 4.8,
            agentName: agentName
        };
    }

    function getAiConfidenceScore(ticket) {
        return 82 + (ticket.id % 17);
    }

    function getSentimentInfo(enriched) {
        const score = enriched.thermoScore || 0;
        if (score >= 75 || enriched.churnRisk) return { label: 'Sentimento negativo detectado', negative: true };
        if (score >= 55) return { label: 'Cliente pode estar frustrado', negative: true };
        return { label: null, negative: false };
    }

    function computeOperationHealth(desk) {
        const c = desk.counts;
        if (c.slaCritico >= 2 || (desk.nextAction && desk.nextAction.enriched.churnRisk && desk.nextAction.enriched.slaCritical)) {
            return { level: 'danger', label: 'Operação sob risco' };
        }
        if (c.slaCritico >= 1 || c.aguardandoRetorno >= 2) {
            return { level: 'warn', label: 'SLA próximo do limite' };
        }
        return { level: 'ok', label: 'Operação saudável' };
    }

    function buildOperationalTimeline(ticket, enriched) {
        const events = [];
        const now = new Date();
        const fmt = function (d) { return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
        const offset = 8 + (ticket.id % 25);
        const base = new Date(now.getTime() - offset * 60000);
        if (enriched.flags.clientReplied) {
            events.push({ time: fmt(new Date(base.getTime())), text: 'Cliente respondeu', type: 'client' });
        }
        if (enriched.flags.aiSuggested) {
            events.push({ time: fmt(new Date(base.getTime() + 2 * 60000)), text: 'IA sugeriu resposta', type: 'ai' });
        }
        if (enriched.slaCritical) {
            events.push({ time: fmt(new Date(base.getTime() + 5 * 60000)), text: 'SLA entrou em risco', type: 'sla' });
        }
        if (enriched.flags.reopened) {
            events.push({ time: fmt(new Date(base.getTime() + 8 * 60000)), text: 'Ticket reaberto', type: 'reopen' });
        }
        if (!events.length) {
            events.push({ time: fmt(new Date(base.getTime())), text: 'Ticket aberto', type: 'default' });
        }
        return events.slice(-4);
    }

    function renderOperationalTimelineHtml(ticket, enriched) {
        const events = buildOperationalTimeline(ticket, enriched);
        return '<div class="ws-ops-timeline"><div class="ws-ops-timeline__head"><i class="fas fa-stream"></i> Timeline operacional</div><ul class="ws-ops-timeline__list">' +
            events.map(function (ev) {
                return '<li class="ws-ops-timeline__item ws-ops-timeline__item--' + ev.type + '">' +
                    '<span class="ws-ops-timeline__time">' + ev.time + '</span>' +
                    '<span class="ws-ops-timeline__text">' + escapeHtmlEcosystem(ev.text) + '</span></li>';
            }).join('') + '</ul></div>';
    }

    function pickSmartNextAction(enrichedList) {
        if (!enrichedList.length) return null;
        const sorted = enrichedList.slice().sort(function (a, b) { return b.sortScore - a.sortScore; });
        const top = sorted[0];
        const t = top.ticket;
        let ctaLabel = 'Atender próximo ticket';
        let ctaIcon = 'fa-play';
        let reason = 'Prioridade operacional';
        if (top.slaCritical) {
            ctaLabel = 'Retomar SLA crítico';
            ctaIcon = 'fa-fire';
            reason = 'SLA vence em ' + top.slaRemaining + ' min';
        } else if (t.status === 'pendente' || t.status === 'em-espera') {
            ctaLabel = 'Responder cliente aguardando';
            ctaIcon = 'fa-reply';
            reason = 'Sem resposta ' + formatIdleLabel(top.idleMin);
        } else if (t.status === 'novo') {
            ctaLabel = 'Atender próximo ticket';
            ctaIcon = 'fa-inbox';
            reason = 'Novo na fila';
        }
        if (top.churnRisk) reason += ' · Risco alto de churn';
        if (top.premium) reason += ' · Cliente premium';
        if (top.recurrenceHigh) reason += ' · Priorizar reduz risco em 34%';
        const sentiment = getSentimentInfo(top);
        const contextLines = ['SLA vence em ' + top.slaRemaining + ' min', 'Cliente sem resposta ' + formatIdleLabel(top.idleMin)];
        if (sentiment.label) contextLines.push(sentiment.label);
        if (top.churnRisk) contextLines.push('Alta chance de cancelamento');
        let riskLabel = top.churnRisk ? 'RISCO ALTO DE CHURN' : top.slaCritical ? 'SLA CRÍTICO' : 'ATENÇÃO OPERACIONAL';
        let scoreLevel = top.slaCritical || top.churnRisk ? 'critical' : top.slaRemaining <= 30 ? 'attention' : 'normal';
        let specificCta = ctaLabel;
        const firstClient = (top.clientName || 'Cliente').split(' ')[0];
        if (top.slaCritical || top.churnRisk) specificCta = 'Responder ' + firstClient + ' · SLA ' + top.slaRemaining + 'min';
        else if (t.status === 'pendente' || t.status === 'em-espera') specificCta = 'Responder ' + firstClient + ' · aguardando ' + formatIdleLabel(top.idleMin);
        else if (t.status === 'novo') specificCta = 'Atender ' + firstClient + ' · ticket #' + t.id;
        var scoreParts = [];
        if (top.slaCritical) scoreParts.push('SLA crítico (+' + Math.round(top.sortScore * 0.4) + ' pts)');
        if (top.churnRisk) scoreParts.push('Risco churn (+' + Math.round(top.sortScore * 0.35) + ' pts)');
        if (top.premium) scoreParts.push('Cliente premium (+15 pts)');
        if (top.idleMin >= 60) scoreParts.push('Inatividade ' + formatIdleLabel(top.idleMin) + ' (+20 pts)');
        if (!scoreParts.length) scoreParts.push('Prioridade operacional padrão');
        return {
            ticket: t, enriched: top, ctaLabel: ctaLabel, ctaIcon: ctaIcon, reason: reason,
            riskLabel: riskLabel, contextLines: contextLines, scoreLevel: scoreLevel,
            specificCta: specificCta, sentiment: sentiment, scoreBreakdown: scoreParts.join(' · ')
        };
    }

    function findTicketForSmartReason(reason) {
        const tickets = findAllKanbanTickets();
        if (!tickets.length) return null;
        if (reason === 'sla') {
            return tickets.find(function (t) { return t.priority === 'critica' || t.priority === 'critical' || t.slaCritical; }) || tickets[0];
        }
        if (reason === 'retorno') {
            return tickets.find(function (t) { return t.status === 'pendente' || t.status === 'em-espera'; }) || tickets[tickets.length - 1];
        }
        return tickets[0];
    }

    function renderSmartNotificationsHtml() {
        const defs = [
            { reason: 'sla', type: 'critical', label: 'SLA crítico', textFn: function (t) { return 'Ticket #' + t.id + ' — ' + (t.title || 'prioridade crítica'); } },
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

        const counts = { total: tickets.length, novos: 0, andamento: 0, pendente: 0, slaCritico: 0, resolvidos: 0, aguardandoRetorno: 0 };
        tickets.forEach(function (t) {
            if (t.status === 'novo') counts.novos++;
            else if (t.status === 'em-aberto') counts.andamento++;
            else if (t.status === 'pendente' || t.status === 'em-espera') {
                counts.pendente++;
                counts.aguardandoRetorno++;
            }
            else if (t.status === 'resolvido') counts.resolvidos++;
            if (t.priority === 'critica' || t.priority === 'critical') counts.slaCritico++;
        });

        const enriched = tickets.map(function (t) { return enrichTicketForDesk(t, db); });
        enriched.sort(function (a, b) { return b.sortScore - a.sortScore; });
        const filtered = enriched.filter(function (e) {
            return !(typeof window.isSmartActionIgnored === 'function' && window.isSmartActionIgnored(e.ticket.id));
        });

        const hotClients = [];
        const seenCpf = {};
        enriched.forEach(function (e) {
            const cpf = normalizeDeskCpf((e.ticket.lateralForm && e.ticket.lateralForm.cpf) || e.ticket.clientCPF);
            if (!cpf || seenCpf[cpf] || !e.client) return;
            if (e.thermoScore >= 55 || e.churnRisk) {
                seenCpf[cpf] = true;
                hotClients.push({ ticket: e.ticket, client: e.client, score: e.thermoScore, enriched: e });
            }
        });
        hotClients.sort(function (a, b) { return b.score - a.score; });

        const channels = {};
        tickets.forEach(function (t) {
            const ch = (t.lateralForm && t.lateralForm.canal) || t.channel || t.source || 'Outros';
            channels[ch] = (channels[ch] || 0) + 1;
        });

        const personal = computePersonalMetrics(tickets, agentName);
        const nextAction = pickSmartNextAction(filtered.length ? filtered : enriched);
        const avgResponse = personal.tma;

        return {
            agentName: agentName,
            counts: counts,
            prioritized: tickets,
            enriched: enriched,
            hotClients: hotClients,
            channels: channels,
            personal: personal,
            nextAction: nextAction,
            avgResponse: avgResponse
        };
    }

    function renderTicketMicroFlags(flags) {
        const items = [];
        if (flags.attachment) items.push('<span class="ws-micro ws-micro--attach" title="Possui anexo">📎</span>');
        if (flags.clientReplied) items.push('<span class="ws-micro ws-micro--client" title="Cliente respondeu">💬</span>');
        if (flags.noAgentReply) items.push('<span class="ws-micro ws-micro--warn" title="Sem resposta do agente">⚠️</span>');
        if (flags.reopened) items.push('<span class="ws-micro ws-micro--reopen" title="Reaberto">🔁</span>');
        if (flags.aiSuggested) items.push('<span class="ws-micro ws-micro--ai" title="IA sugeriu resposta">🤖</span>');
        if (!items.length) return '';
        return '<div class="ws-micro-row">' + items.join('') + '</div>';
    }

    function renderAgentQueueHtml(enrichedList) {
        if (!enrichedList.length) {
            return '<div class="ws-empty ws-empty--action"><p>Nenhum ticket na fila.</p>' +
                '<button type="button" class="btn-primary btn-sm" onclick="openQuickRegisterModal()"><i class="fas fa-plus"></i> Novo ticket</button></div>';
        }
        const compact = localStorage.getItem('velodeskDeskCompact') === '1';
        return '<ul class="ws-queue-list' + (compact ? ' ws-queue-list--compact' : '') + '">' +
            enrichedList.slice(0, 8).map(function (e) {
                const t = e.ticket;
                const title = (t.title || 'Sem título').length > 48 ? (t.title || '').substring(0, 48) + '…' : (t.title || 'Sem título');
                const slaLine = e.slaCritical
                    ? '<span class="ws-queue-sla ws-queue-sla--critical" data-countdown="' + e.slaRemaining + '"><i class="fas fa-fire"></i> SLA ' + e.slaRemaining + 'min restante</span>'
                    : '<span class="ws-queue-sla" data-countdown="' + e.slaRemaining + '">SLA ' + e.slaRemaining + 'min restante</span>';
                const isNew = t.status === 'novo';
                const agentLine = t.assignedTo || t.responsavel
                    ? '<div class="ws-queue-card__agent"><i class="fas fa-headset"></i> Em atendimento · ' + escapeHtmlEcosystem(t.assignedTo || t.responsavel) + '</div>'
                    : (t.status === 'em-aberto' ? '<div class="ws-queue-card__agent"><i class="fas fa-clock"></i> Aguardando agente</div>' : '');
                return '<li class="ws-queue-card ws-queue-card--' + e.priClass +
                    (e.slaCritical ? ' ws-queue-card--pulse' : '') +
                    (isNew ? ' ws-queue-card--new' : '') +
                    '" data-ticket-id="' + t.id + '" data-sla-remaining="' + e.slaRemaining + '">' +
                    '<div class="ws-queue-card__head">' +
                    '<div class="ws-queue-card__title">' + escapeHtmlEcosystem(title) +
                    (isNew ? ' <span class="ws-badge-new">novo</span>' : '') + '</div>' +
                    '<span class="ws-queue-priority ws-queue-priority--' + e.priClass + '">' + escapeHtmlEcosystem(e.priLabel) + '</span></div>' +
                    '<div class="ws-queue-card__sub">' + escapeHtmlEcosystem(e.clientName) + ' · #' + t.id + '</div>' +
                    agentLine +
                    '<div class="ws-queue-card__time">' + slaLine +
                    '<span class="ws-queue-idle">Última interação ' + formatIdleLabel(e.idleMin) + '</span></div>' +
                    renderTicketMicroFlags(e.flags) +
                    '<div class="ws-queue-card__actions">' +
                    '<button type="button" class="ws-qbtn ws-qbtn--primary" onclick="event.stopPropagation();deskQuickAction(' + t.id + ',\'reply\')" title="Responder (R)"><i class="fas fa-reply"></i> Responder</button>' +
                    '<button type="button" class="ws-qbtn ws-qbtn--assume" onclick="event.stopPropagation();deskQuickAction(' + t.id + ',\'assume\')" title="Assumir (A)"><i class="fas fa-hand"></i> Assumir</button>' +
                    '<button type="button" class="ws-qbtn ws-qbtn--secondary" onclick="event.stopPropagation();deskQuickAction(' + t.id + ',\'open\')" title="Abrir"><i class="fas fa-folder-open"></i> Abrir</button>' +
                    '<button type="button" class="ws-qbtn ws-qbtn--ghost" onclick="event.stopPropagation();deskQuickAction(' + t.id + ',\'transfer\')" title="Transferir (T)"><i class="fas fa-share"></i> Transferir</button>' +
                    '</div></li>';
            }).join('') + '</ul>';
    }

    function renderAttentionFeedHtml(desk) {
        const enriched = desk.enriched;
        const groups = {
            critical: [],
            pending: [],
            automation: [],
            ai: []
        };

        enriched.forEach(function (e) {
            const t = e.ticket;
            if (e.slaCritical || e.churnRisk) {
                groups.critical.push({
                    text: escapeHtmlEcosystem(e.clientName) + ' · #' + t.id + ' — SLA ' + e.slaRemaining + 'min',
                    sub: e.churnRisk ? 'Risco alto de churn · cliente frustrado detectado' : 'Prioridade crítica · SLA em countdown',
                    action: 'Retomar agora',
                    id: t.id,
                    pulse: true
                });
            }
            if (t.status === 'pendente' || t.status === 'em-espera') {
                groups.pending.push({
                    text: 'Cliente aguardando ' + formatIdleLabel(e.idleMin),
                    sub: escapeHtmlEcosystem((t.title || '').substring(0, 40)),
                    action: 'Responder agora',
                    id: t.id
                });
            }
            if (e.flags.aiSuggested) {
                const conf = getAiConfidenceScore(t);
                groups.ai.push({
                    text: 'Resposta pronta com ' + conf + '% de confiança',
                    sub: (e.churnRisk ? 'Alta chance de cancelamento · ' : '') + 'Reduz TMA estimado em 32%',
                    action: 'Ver sugestão',
                    id: t.id,
                    confidence: conf
                });
            }
        });

        groups.automation.push({
            text: 'Automação: triagem N1 ativa',
            sub: '3 tickets classificados pela IA hoje',
            action: 'Ver log',
            id: null
        });

        const sections = [
            { key: 'critical', label: 'Críticos', icon: 'fa-fire' },
            { key: 'pending', label: 'Pendências', icon: 'fa-clock' },
            { key: 'ai', label: 'Sugestões IA', icon: 'fa-brain' },
            { key: 'automation', label: 'Automação', icon: 'fa-robot' }
        ];

        let html = '';
        sections.forEach(function (sec) {
            const items = groups[sec.key].slice(0, 3);
            if (!items.length) return;
            html += '<div class="ws-feed-group"><div class="ws-feed-group__head"><i class="fas ' + sec.icon + '"></i> ' + sec.label + '</div><ul class="ws-feed-list">';
            items.forEach(function (item) {
                html += '<li class="ws-feed-item' + (item.pulse ? ' ws-feed-item--pulse' : '') + '">' +
                    '<div class="ws-feed-item__body"><strong>' + item.text + '</strong><span>' + item.sub + '</span></div>' +
                    (item.id ? '<button type="button" class="ws-feed-action" onclick="deskQuickAction(' + item.id + ',\'reply\')">' + item.action + '</button>' :
                        '<button type="button" class="ws-feed-action ws-feed-action--ghost" onclick="openAutomationLogPanel()">' + item.action + '</button>') +
                    '</li>';
            });
            html += '</ul></div>';
        });
        return html || '<p class="ws-empty">Nenhum evento urgente no momento.</p>';
    }

    function renderPersonalMetricsBar(personal) {
        return '<div class="ws-perf-bar">' +
            '<span class="ws-perf-bar__label">Hoje</span>' +
            '<div class="ws-perf-metrics">' +
            '<div class="ws-perf-metric"><strong>' + personal.resolvedToday + '</strong><span>Resolvidos</span></div>' +
            '<div class="ws-perf-metric"><strong>' + personal.sla + '%</strong><span>SLA</span></div>' +
            '<div class="ws-perf-metric"><strong>' + escapeHtmlEcosystem(personal.tma) + '</strong><span>TMA</span></div>' +
            '<div class="ws-perf-metric"><strong>' + personal.csat + '</strong><span>CSAT</span></div>' +
            '</div></div>';
    }

    function renderHotClientsHtml(items) {
        var churnOnly = localStorage.getItem('velodeskHotChurnOnly') === '1';
        var filtered = churnOnly ? items.filter(function (item) { return item.enriched && item.enriched.churnRisk; }) : items;
        var filterBar = '<div class="ws-hot-filter">' +
            '<button type="button" class="ws-hot-filter__btn' + (!churnOnly ? ' is-active' : '') + '" onclick="localStorage.setItem(\'velodeskHotChurnOnly\',\'0\');renderWorkspace360()">Todos</button>' +
            '<button type="button" class="ws-hot-filter__btn' + (churnOnly ? ' is-active' : '') + '" onclick="toggleHotChurnFilter()">Só churn</button></div>';
        if (!filtered.length) {
            return filterBar + '<div class="ws-empty ws-empty--action"><p>Nenhum cliente com termômetro elevado no momento.</p>' +
                '<button type="button" class="btn-primary btn-sm" onclick="openQuickRegisterModal()"><i class="fas fa-bolt"></i> Novo ticket</button></div>';
        }
        return filterBar + '<ul class="ws-hot-list">' + filtered.slice(0, 4).map(function (item) {
            const c = item.client;
            const score = item.score;
            const nivel = score >= 80 ? 'quente' : score >= 55 ? 'morno' : 'frio';
            const hint = item.enriched && item.enriched.churnRisk ? 'Risco de churn' : 'Termômetro elevado';
            return '<li class="ws-hot-item ws-hot-item--' + nivel + '" role="button" tabindex="0" onclick="openSmartNotificationTicket(' + item.ticket.id + ')">' +
                '<div class="ws-hot-item__score">' + score + '°</div>' +
                '<div><strong>' + escapeHtmlEcosystem(c.name) + '</strong>' +
                '<span>' + escapeHtmlEcosystem(c.situacao || '') + ' · ' + escapeHtmlEcosystem(hint) + '</span>' +
                '<em>Ticket #' + item.ticket.id + ' · ' + escapeHtmlEcosystem((item.ticket.title || '').substring(0, 36)) + '</em></div></li>';
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

    function renderSmartNextBlock(next) {
        if (!next) return '';
        const ctxHtml = next.contextLines.map(function (line) {
            return '<li>' + escapeHtmlEcosystem(line) + '</li>';
        }).join('');
        return '<section class="ws-smart-next ws-smart-next--' + next.scoreLevel + ' ws-smart-next--priority-1">' +
            '<div class="ws-smart-next__score ws-smart-next__score--' + next.scoreLevel + '" aria-hidden="true"></div>' +
            '<div class="ws-smart-next__content">' +
            '<div class="ws-smart-next__label"><i class="fas fa-wand-magic-sparkles"></i> Próxima melhor ação</div>' +
            '<div class="ws-smart-next__risk">' + escapeHtmlEcosystem(next.riskLabel) + '</div>' +
            '<strong class="ws-smart-next__title">' + escapeHtmlEcosystem(next.ctaLabel) + ': ' + escapeHtmlEcosystem(next.enriched.clientName) + '</strong>' +
            '<ul class="ws-smart-next__context">' + ctxHtml + '</ul>' +
            (next.scoreBreakdown ? '<p class="ws-smart-next__explain"><i class="fas fa-chart-simple"></i> Score: ' + escapeHtmlEcosystem(next.scoreBreakdown) + '</p>' : '') +
            '</div>' +
            '<div class="ws-smart-next__actions">' +
            '<button type="button" class="ws-smart-next__btn" onclick="deskQuickAction(' + next.ticket.id + ',\'reply\')">' +
            '<i class="fas ' + next.ctaIcon + '"></i> ' + escapeHtmlEcosystem(next.specificCta) + '</button>' +
            '<button type="button" class="ws-smart-next__ignore" onclick="dismissSmartAction(' + next.ticket.id + ')"><i class="fas fa-clock"></i> Ignorar por 30 min</button>' +
            '</div>' +
            '</section>';
    }

    function renderFocusBullets(desk) {
        const c = desk.counts;
        const items = [];
        if (c.slaCritico) items.push(c.slaCritico + ' SLA crítico');
        if (c.aguardandoRetorno) items.push(c.aguardandoRetorno + ' cliente' + (c.aguardandoRetorno > 1 ? 's' : '') + ' aguardando retorno');
        if (c.novos) items.push(c.novos + ' ticket' + (c.novos > 1 ? 's' : '') + ' novo' + (c.novos > 1 ? 's' : ''));
        const churnCount = desk.enriched.filter(function (e) { return e.churnRisk; }).length;
        if (churnCount) items.push(churnCount + ' com risco de churn');
        if (!items.length) items.push('Fila em dia — nenhuma urgência imediata');
        return '<ul class="ws-action-focus-list">' + items.map(function (item) {
            return '<li>' + escapeHtmlEcosystem(item) + '</li>';
        }).join('') + '</ul>';
    }

    function renderAgentWorkspaceHtml() {
        const desk = computeAgentDeskData();
        const now = new Date();
        const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
        const firstName = desk.agentName.split(' ')[0];
        const compact = localStorage.getItem('velodeskDeskCompact') === '1';
        const c = desk.counts;
        const health = computeOperationHealth(desk);
        const p = desk.personal;

        const next = desk.nextAction;
        const nextBlock = renderSmartNextBlock(next);

        const ctaPrimary = next
            ? '<button type="button" class="ws-action-cta ws-action-cta--primary" onclick="deskQuickAction(' + next.ticket.id + ',\'reply\')"><i class="fas ' + next.ctaIcon + '"></i> ' + escapeHtmlEcosystem(next.specificCta) + '</button>'
            : '<button type="button" class="ws-action-cta ws-action-cta--primary" onclick="navigateToPage(\'tickets\')"><i class="fas fa-inbox"></i> Ver fila</button>';

        const timelineBlock = next
            ? renderOperationalTimelineHtml(next.ticket, next.enriched)
            : '';

        return '<div class="ws-agent-desk ws-agent-desk--operational ws-agent-desk--cockpit' + (compact ? ' ws-agent-desk--compact' : '') + '" id="wsAgentDesk">' +

            '<header class="ws-action-panel ws-action-panel--level-2">' +
            '<div class="ws-action-panel__top">' +
            '<div class="ws-action-panel__intro">' +
            '<span class="ws-action-panel__date">' + escapeHtmlEcosystem(now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })) + '</span>' +
            '<h3 class="ws-action-panel__greeting">' + greeting + ', ' + escapeHtmlEcosystem(firstName) + '.</h3>' +
            '<p class="ws-action-focus">Seu foco agora:</p>' +
            renderFocusBullets(desk) +
            '<div class="ws-action-briefing-today">' +
            '<span class="ws-action-briefing-today__label">Hoje:</span> ' +
            'SLA <strong>' + p.sla + '%</strong> · TMA <strong>' + escapeHtmlEcosystem(p.tma) + '</strong> · CSAT <strong>' + p.csat + '</strong>' +
            '</div>' +
            '<div class="ws-action-metrics">' +
            (c.slaCritico ? '<span class="ws-metric-pill ws-metric-pill--critical ws-metric-pill--live">' + c.slaCritico + ' SLA crítico</span>' : '') +
            (c.aguardandoRetorno ? '<span class="ws-metric-pill ws-metric-pill--warn">' + c.aguardandoRetorno + ' aguardando retorno</span>' : '') +
            (c.novos ? '<span class="ws-metric-pill ws-metric-pill--new ws-metric-pill--bounce">' + c.novos + ' novos</span>' : '') +
            '</div></div>' +
            '<div class="ws-action-panel__controls">' +
            '<div class="ws-ops-health ws-ops-health--' + health.level + '" title="Saúde operacional">' +
            '<span class="ws-ops-health__dot"></span>' + escapeHtmlEcosystem(health.label) + '</div>' +
            '<button type="button" class="ws-compact-toggle' + (compact ? ' is-active' : '') + '" onclick="toggleDeskCompactMode()" title="Modo compacto">' +
            '<i class="fas fa-' + (compact ? 'expand-alt' : 'compress-alt') + '"></i> ' + (compact ? 'Compacto ativo' : 'Compacto') + '</button>' +
            '<span class="ws-live-dot" title="Atualização ao vivo"></span></div></div>' +
            '<div class="ws-action-panel__cta-row">' + ctaPrimary +
            '<button type="button" class="ws-action-cta" onclick="openQuickRegisterModal()"><i class="fas fa-plus"></i> Novo ticket</button>' +
            '<button type="button" class="ws-action-cta" onclick="navigateToPage(\'tickets\')"><i class="fas fa-inbox"></i> Fila completa</button>' +
            '</div>' +
            renderPersonalMetricsBar(desk.personal) +
            '</header>' +

            nextBlock +

            '<div class="ws-agent-layout">' +
            '<div class="ws-agent-main">' +
            '<section class="ws-panel ws-panel--queue ws-panel--level-2">' +
            '<div class="ws-panel__head-row">' +
            '<h4><i class="fas fa-list-ol"></i> Fila operacional</h4>' +
            '<span class="ws-panel__count">' + desk.enriched.length + ' ticket(s)</span></div>' +
            '<p class="ws-panel-hint">Atalhos: <kbd>R</kbd> responder · <kbd>A</kbd> assumir · <kbd>T</kbd> transferir · <span class="ws-panel-hint__help" onclick="openKeyboardHelp()">?</span></p>' +
            renderAgentQueueHtml(desk.enriched) +
            '</section>' +
            renderAgentDeskShortcuts() +
            '</div>' +

            '<aside class="ws-agent-insights">' +
            '<section class="ws-panel ws-panel--notif ws-panel--level-3">' +
            '<h4><i class="fas fa-satellite-dish"></i> Central de eventos</h4>' +
            renderAttentionFeedHtml(desk) +
            '</section>' +
            (timelineBlock ? '<section class="ws-panel ws-panel--timeline ws-panel--level-3">' + timelineBlock + '</section>' : '') +
            (next && typeof window.buildClientIntelligence === 'function'
                ? window.renderCustomerIntelligenceHtml(window.buildClientIntelligence(next.ticket, next.enriched), next.ticket.id)
                : '') +
            (next && typeof window.renderOmnichannelTimelineHtml === 'function'
                ? window.renderOmnichannelTimelineHtml(window.buildClientIntelligence(next.ticket, next.enriched), next.ticket.id)
                : '') +
            (typeof window.renderAutomationsDeskHtml === 'function' ? window.renderAutomationsDeskHtml() : '') +
            (typeof window.renderCrmPipelineHtml === 'function' ? window.renderCrmPipelineHtml(true) : '') +
            '<section class="ws-panel ws-panel--hot ws-panel--level-3">' +
            '<h4><i class="fas fa-fire"></i> Risco &amp; SLA</h4>' +
            renderHotClientsHtml(desk.hotClients) +
            '</section>' +
            '</aside></div></div>';
    }

    window.toggleDeskCompactMode = function () {
        const on = localStorage.getItem('velodeskDeskCompact') === '1';
        localStorage.setItem('velodeskDeskCompact', on ? '0' : '1');
        renderWorkspace360();
    };

    window.enterDeskFocusMode = function (ticketId) {
        document.body.classList.add('velodesk-focus-mode');
        sessionStorage.setItem('velodeskFocusMode', '1');
        if (typeof navigateToPage === 'function') navigateToPage('tickets');
        setTimeout(function () {
            if (typeof openTicket === 'function') openTicket(ticketId);
            ensureFocusModeExitButton();
            setTimeout(function () {
                const ta = document.getElementById('publicResponse-' + ticketId);
                if (ta) ta.focus();
            }, 400);
        }, 280);
    };

    window.exitDeskFocusMode = function () {
        document.body.classList.remove('velodesk-focus-mode');
        sessionStorage.removeItem('velodeskFocusMode');
        const btn = document.getElementById('velodeskFocusExitBtn');
        if (btn) btn.remove();
    };

    function ensureFocusModeExitButton() {
        if (!document.body.classList.contains('velodesk-focus-mode')) return;
        if (document.getElementById('velodeskFocusExitBtn')) return;
        const btn = document.createElement('button');
        btn.id = 'velodeskFocusExitBtn';
        btn.type = 'button';
        btn.className = 'velodesk-focus-exit';
        btn.innerHTML = '<i class="fas fa-compress"></i> Sair do focus mode <kbd>Esc</kbd>';
        btn.onclick = function () { exitDeskFocusMode(); };
        document.body.appendChild(btn);
    }

    window.deskQuickAction = function (ticketId, action) {
        if (action === 'reply') {
            enterDeskFocusMode(ticketId);
            return;
        }
        if (action === 'assume') {
            var user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            var cols = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
            cols.forEach(function (col) {
                (col.tickets || []).forEach(function (t) {
                    if (t.id === ticketId) {
                        t.assignedTo = user.name || 'Agente';
                        t.responsavel = user.name || 'Agente';
                        if (t.status === 'novo') t.status = 'em-aberto';
                    }
                });
            });
            localStorage.setItem('kanbanColumns', JSON.stringify(cols));
            if (typeof showNotification === 'function') showNotification('Ticket #' + ticketId + ' assumido por você.', 'success');
            if (typeof renderWorkspace360 === 'function') renderWorkspace360();
            openSmartNotificationTicket(ticketId);
            return;
        }
        if (action === 'open') {
            openSmartNotificationTicket(ticketId);
            return;
        }
        if (action === 'transfer') {
            openSmartNotificationTicket(ticketId);
            if (typeof showNotification === 'function') {
                showNotification('Transferência: selecione o grupo no formulário lateral.', 'info');
            }
        }
    };

    window._deskFocusedTicketId = null;
    function updateDeskFocusedTicket() {
        const first = document.querySelector('.ws-queue-card');
        window._deskFocusedTicketId = first ? parseInt(first.getAttribute('data-ticket-id'), 10) : null;
    }

    function bindDeskKeyboardShortcuts() {
        if (window._deskKeysBound) return;
        window._deskKeysBound = true;
        document.addEventListener('keydown', function (e) {
            const ws = document.getElementById('workspace');
            if (!ws || !ws.classList.contains('active')) return;
            if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable)) return;
            const id = window._deskFocusedTicketId;
            if (!id) return;
            const key = e.key.toLowerCase();
            if (key === 'r') { e.preventDefault(); deskQuickAction(id, 'reply'); }
            if (key === 'a') { e.preventDefault(); deskQuickAction(id, 'assume'); }
            if (key === 't') { e.preventDefault(); deskQuickAction(id, 'transfer'); }
            if (key === 'escape' && document.body.classList.contains('velodesk-focus-mode')) {
                e.preventDefault();
                exitDeskFocusMode();
            }
        });
    }

    let deskSlaTickTimer = null;
    function tickDeskSlaCountdowns() {
        document.querySelectorAll('.ws-queue-sla[data-countdown]').forEach(function (el) {
            let min = parseInt(el.getAttribute('data-countdown'), 10);
            if (isNaN(min) || min <= 0) return;
            min = Math.max(0, min - 1);
            el.setAttribute('data-countdown', String(min));
            const critical = el.classList.contains('ws-queue-sla--critical');
            el.innerHTML = (critical ? '<i class="fas fa-fire"></i> ' : '') + 'SLA ' + min + 'min restante';
        });
    }

    function startDeskSlaTick() {
        if (deskSlaTickTimer) clearInterval(deskSlaTickTimer);
        deskSlaTickTimer = setInterval(tickDeskSlaCountdowns, 60000);
    }

    let deskRefreshTimer = null;
    function startDeskLiveRefresh() {
        if (deskRefreshTimer) clearInterval(deskRefreshTimer);
        deskRefreshTimer = setInterval(function () {
            const ws = document.getElementById('workspace');
            if (ws && ws.classList.contains('active') && getProfile() === 'agent') {
                renderWorkspace360();
            }
        }, 45000);
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
        const columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        let pendingTickets = 0;
        columns.forEach(c => { if (c.tickets) pendingTickets += c.tickets.length; });

        const blocks = {
            agent: renderAgentWorkspaceHtml(),
            supervisor: (typeof window.renderSupervisorWorkspaceHtml === 'function')
                ? window.renderSupervisorWorkspaceHtml()
                : `
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
            management: (typeof window.renderExecutiveDashboardHtml === 'function' && window.VELODESK_COCKPIT)
                ? window.renderExecutiveDashboardHtml()
                : `
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
        if (profile === 'supervisor' && typeof window.startSupervisorLiveRefresh === 'function') {
            window.startSupervisorLiveRefresh();
            if (typeof window.startPeakCountdown === 'function') window.startPeakCountdown();
        }
        if (profile === 'management' && typeof window.initExecTrendChart === 'function') {
            setTimeout(window.initExecTrendChart, 300);
        }
        if (profile === 'agent') {
            updateDeskFocusedTicket();
            bindDeskKeyboardShortcuts();
            startDeskSlaTick();
            document.querySelectorAll('.ws-queue-card').forEach(function (card) {
                card.addEventListener('click', function () {
                    window._deskFocusedTicketId = parseInt(card.getAttribute('data-ticket-id'), 10);
                    document.querySelectorAll('.ws-queue-card').forEach(function (c) { c.classList.remove('ws-queue-card--focused'); });
                    card.classList.add('ws-queue-card--focused');
                });
            });
            document.querySelectorAll('.ws-queue-sla').forEach(function (el) {
                const card = el.closest('.ws-queue-card');
                if (card) el.setAttribute('data-countdown', card.getAttribute('data-sla-remaining') || '0');
            });
            if (sessionStorage.getItem('velodeskFocusMode') === '1') {
                ensureFocusModeExitButton();
            }
        }
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
                    <button type="button" class="btn-secondary" onclick="qrGoBack()" id="qrBackBtn" style="margin-right:auto"><i class="fas fa-arrow-left"></i> Voltar</button>
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
                <div class="form-group"><label>CPF do cliente</label>
                    <div class="qr-cpf-row">
                        <input type="text" id="qrCpf" placeholder="000.000.000-00" class="form-control">
                        <button type="button" class="btn-secondary btn-sm" onclick="searchQrClientByCpf()"><i class="fas fa-search"></i> Buscar</button>
                    </div></div>
                <div class="form-group"><label>Cliente</label><input type="text" id="qrClient" placeholder="Nome do cliente" class="form-control"></div>
                <div class="form-group"><label>Título sugerido pela IA</label><input type="text" id="qrTitle" value="${escapeHtmlEcosystem(aiText.title)}"></div>
                <div class="form-group"><label>Descrição revisada (tom da marca)</label><textarea id="qrDescription" rows="5">${escapeHtmlEcosystem(aiText.description)}</textarea></div>
                <div class="ai-suggestion-box"><i class="fas fa-robot"></i> <strong>Próxima ação:</strong> ${escapeHtmlEcosystem(aiText.nextAction)}</div>`;
            setTimeout(() => {
                const ta = document.getElementById('qrDescription');
                if (ta) attachAIReviewToField(ta);
            }, 50);
        }
        updateQRProgress(step);
        var backBtn = document.getElementById('qrBackBtn');
        if (backBtn) backBtn.style.visibility = step <= 1 ? 'hidden' : 'visible';
    }

    window.renderQuickRegisterStep = renderQuickRegisterStep;

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
                    { label: 'Real', data: [980, 1100, 1050, 1200, 1150, 400, 300], borderColor: '#1634FF', tension: 0.3 },
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
            badge.style.background = `linear-gradient(135deg, ${p.color}, var(--eco-blue, #1634FF))`;
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
                <div class="call-assist-controls">
                    <button class="btn-secondary btn-sm" onclick="pauseCallAssist()"><i class="fas fa-pause"></i> Pausar IA</button>
                    <button class="btn-secondary btn-sm" onclick="rejectCallSuggestion()"><i class="fas fa-times"></i> Rejeitar</button>
                </div>
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
        const isCockpit = window.VELODESK_COCKPIT === true;
        const isLab = window.VELODESK_LAB === true && !isCockpit;
        const banner = document.createElement('div');
        banner.id = 'ecoPrototypeBanner';
        banner.className = 'eco-prototype-banner' + (isCockpit ? ' eco-cockpit-banner' : isLab ? ' eco-lab-banner' : '');
        if (isCockpit) {
            banner.innerHTML = '<span class="eco-cockpit-banner__tag">Cockpit</span><i class="fas fa-rocket"></i> Velodesk Cockpit — copiloto operacional (porta 8768) · versão paralela local' +
                '<span class="eco-cockpit-banner__actions">' +
                '<button type="button" onclick="seedVelodeskLabDemo()">Recriar demo</button>' +
                '<button type="button" onclick="resetVelodeskLabData()">Resetar dados</button>' +
                '<button type="button" onclick="this.closest(\'#ecoPrototypeBanner\').remove(); if(window.syncChromeTopOffset) window.syncChromeTopOffset();">Ocultar</button>' +
                '</span>';
        } else if (isLab) {
            banner.innerHTML = '<span class="eco-lab-banner__tag">Lab</span><i class="fas fa-vial"></i> Velodesk Lab — sandbox de testes (porta 8767) · dados isolados do app principal' +
                '<span class="eco-lab-banner__actions">' +
                '<button type="button" onclick="seedVelodeskLabDemo()">Recriar demo</button>' +
                '<button type="button" onclick="resetVelodeskLabData()">Resetar dados</button>' +
                '<button type="button" onclick="this.closest(\'#ecoPrototypeBanner\').remove(); if(window.syncChromeTopOffset) window.syncChromeTopOffset();">Ocultar</button>' +
                '</span>';
        } else {
            banner.innerHTML = `<i class="fas fa-flask"></i> Protótipo V3 — Ecossistema Velodesk (local) · <button type="button" onclick="this.parentElement.remove(); if(window.syncChromeTopOffset) window.syncChromeTopOffset();">ocultar</button>`;
        }
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
        startDeskLiveRefresh();
        startDeskSlaTick();
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
