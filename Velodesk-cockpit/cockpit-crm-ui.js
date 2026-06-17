/**
 * Velodesk CRM UI — header cadastro manual, roleta alertas, painel direito
 */
(function (global) {
    'use strict';

    var ALERTAS_MONITORIA = [
        { icon: 'ti-alert-triangle', text: 'Monitoria: SLA de resposta em risco — 3 tickets acima de 15 min' },
        { icon: 'ti-shield-check', text: 'Fintech: cliente com score elevado — validar identidade antes de alteração cadastral' },
        { icon: 'ti-bell-ringing', text: 'Alerta operacional: pico de volume no canal WhatsApp (+28% vs média)' },
        { icon: 'ti-credit-card', text: 'Fintech: tentativa de portabilidade detectada — conferir produtos ativos' },
        { icon: 'ti-chart-line', text: 'Monitoria: NPS do turno abaixo da meta (72 vs 80)' }
    ];

    var roletaIntervals = {};

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function maskCpf(value) {
        var d = String(value || '').replace(/\D/g, '').slice(0, 11);
        if (d.length <= 3) return d;
        if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
        if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
        return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    }

    function maskPhone(value) {
        var d = String(value || '').replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return d;
        if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
        if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
        return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    }

    function getTicketById(ticketId) {
        if (typeof global.getTicketById === 'function') return global.getTicketById(ticketId);
        var list = global.tickets || [];
        return list.find(function (t) { return String(t.id) === String(ticketId); }) || null;
    }

    function lookupClientByCpf(cpf) {
        if (typeof global.lookupClientByCpf === 'function') return global.lookupClientByCpf(cpf);
        var clients = global.clients || global.demoClients || [];
        var digits = String(cpf || '').replace(/\D/g, '');
        return clients.find(function (c) {
            return String(c.cpf || '').replace(/\D/g, '') === digits;
        }) || null;
    }

    function isClientRegistered(ticket) {
        if (!ticket) return false;
        if (ticket.clientUnregistered) return false;
        if (ticket.manualClientRegistered) return true;
        var cpf = ticket.lateralForm && ticket.lateralForm.cpf;
        if (cpf && lookupClientByCpf(cpf)) return true;
        if (ticket.clientName && ticket.clientName !== 'Cliente Não Cadastrado') return true;
        return false;
    }

    function getClientThermometerScore(ticket) {
        var cpf = (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.cpf || '';
        var client = lookupClientByCpf(cpf);
        if (client && client.termometro != null) return client.termometro;
        if (ticket.lateralForm && ticket.lateralForm.termometro != null) return ticket.lateralForm.termometro;
        return 38;
    }

    function getSideClientData(ticket) {
        var cpf = (ticket.lateralForm && ticket.lateralForm.cpf) || ticket.cpf || '';
        var client = lookupClientByCpf(cpf);
        return {
            name: ticket.manualClientName || (client && client.name) || ticket.clientName || '',
            cpf: cpf,
            email: ticket.manualClientEmail || (client && client.email) || ticket.email || '',
            telefone: ticket.manualClientPhone || (client && client.telefone) || ticket.telefone || ''
        };
    }

    function renderAlertaRoletaHtml(ticketId) {
        var first = ALERTAS_MONITORIA[0];
        return (
            '<div class="alerta-roleta" id="alerta-roleta-' + escapeHtml(ticketId) + '" data-ticket-id="' + escapeHtml(ticketId) + '">' +
            '<div class="alerta-roleta__track">' +
            '<div class="alerta-roleta__item is-active" data-index="0">' +
            '<i class="ti ' + first.icon + '"></i>' +
            '<span>' + escapeHtml(first.text) + '</span>' +
            '</div></div></div>'
        );
    }

    function renderCustomerInfoInner(ticket) {
        if (isClientRegistered(ticket)) {
            var data = getSideClientData(ticket);
            var client = lookupClientByCpf(data.cpf);
            var products = (ticket.lateralForm && ticket.lateralForm.produtos) || ticket.produtos || (client && client.produtos) || [];
            var prodHtml = '';
            if (products.length) {
                prodHtml = '<div class="rp-product-tags" style="margin-top:0.35rem;">' +
                    products.map(function (p) {
                        return '<span class="rp-product-tag ' + productTagClass(p) + '">' + escapeHtml(p) + '</span>';
                    }).join('') +
                    '</div>';
            }
            return (
                '<strong style="color:#111827;">' + escapeHtml(data.name || 'Cliente') + '</strong>' +
                '<span class="customer-id" style="margin-left:0.5rem;">' + escapeHtml(data.email) + ' · ' + escapeHtml(data.telefone) + '</span>' +
                prodHtml
            );
        }
        return (
            '<span class="badge-waiting" style="padding:4px 8px;font-weight:bold;">Cliente Não Cadastrado</span>' +
            '<button type="button" class="send-btn" id="btn-cadastro-manual-' + escapeHtml(ticket.id) + '" data-ticket-id="' + escapeHtml(ticket.id) + '" style="padding:5px 10px;font-size:11px;">' +
            '<i class="ti ti-user-plus"></i> Cadastrar/Editar</button>'
        );
    }

    function renderCadastroManualExpandHtml(ticketId, ticket) {
        var data = ticket ? getSideClientData(ticket) : { name: '', cpf: '', email: '', telefone: '' };
        return (
            '<div class="cadastro-manual-expand" id="cadastro-manual-' + escapeHtml(ticketId) + '" aria-hidden="true">' +
            '<div class="cadastro-manual-expand__grid cadastro-manual-expand__fase1">' +
            '<div><label for="cm-nome-' + ticketId + '">Nome Completo *</label>' +
            '<input type="text" id="cm-nome-' + ticketId + '" data-field="nome" value="' + escapeHtml(data.name) + '" placeholder="Nome completo"></div>' +
            '<div><label for="cm-cpf-' + ticketId + '">CPF *</label>' +
            '<input type="text" id="cm-cpf-' + ticketId + '" data-field="cpf" value="' + escapeHtml(maskCpf(data.cpf)) + '" placeholder="000.000.000-00" maxlength="14"></div>' +
            '<div><label for="cm-tel-' + ticketId + '">Telefone</label>' +
            '<input type="text" id="cm-tel-' + ticketId + '" data-field="telefone" value="' + escapeHtml(maskPhone(data.telefone)) + '" placeholder="(00) 00000-0000" maxlength="15"></div>' +
            '<div><label for="cm-email-' + ticketId + '">E-mail</label>' +
            '<input type="email" id="cm-email-' + ticketId + '" data-field="email" value="' + escapeHtml(data.email) + '" placeholder="email@exemplo.com"></div>' +
            '</div>' +
            '<button type="button" class="cadastro-manual-expand__more" data-more-toggle="' + ticketId + '">Exibir mais informações</button>' +
            '<div class="cadastro-manual-expand__secondary" id="cm-secondary-' + ticketId + '">' +
            '<div><label for="cm-nasc-' + ticketId + '">Data de Nascimento</label>' +
            '<input type="date" id="cm-nasc-' + ticketId + '" data-field="nascimento"></div>' +
            '<div><label for="cm-cep-' + ticketId + '">Endereço / CEP</label>' +
            '<input type="text" id="cm-cep-' + ticketId + '" data-field="endereco" placeholder="CEP ou endereço"></div>' +
            '</div>' +
            '<button type="button" class="send-btn" data-save-cadastro="' + ticketId + '" style="padding:6px 14px;font-size:12px;">Salvar Cadastro</button>' +
            '</div>'
        );
    }

    function renderTicketHeaderBarBlock(ticket, statusName, statusColor) {
        var datesHtml = typeof global.renderTicketStatusBarHtml === 'function'
            ? global.renderTicketStatusBarHtml(ticket, statusName, statusColor)
            : '';
        return (
            renderAlertaRoletaHtml(ticket.id) +
            '<div class="ticket-header-bar">' +
            datesHtml +
            '<div class="customer-info' + (isClientRegistered(ticket) ? '' : ' customer-info--unknown') + '" id="customer-info-' + escapeHtml(ticket.id) + '">' +
            renderCustomerInfoInner(ticket) +
            '</div></div>' +
            renderCadastroManualExpandHtml(ticket.id, ticket)
        );
    }

    function productTagClass(name) {
        var lower = String(name || '').toLowerCase();
        if (lower.indexOf('móvel') >= 0 || lower.indexOf('movel') >= 0) return 'rp-product-tag--mobile';
        if (lower.indexOf('combo') >= 0) return 'rp-product-tag--combo';
        if (lower.indexOf('fibra') >= 0) return 'rp-product-tag--fiber';
        if (lower.indexOf('tv') >= 0) return 'rp-product-tag--tv';
        return 'rp-product-tag--default';
    }

    function renderRightPanelSections(ticket, lateralHtmlParts) {
        var data = getSideClientData(ticket);
        var lf = ticket.lateralForm || {};
        var products = lf.produtos || ticket.produtos || [];
        var client = lookupClientByCpf(data.cpf);
        if (!products.length && client && client.produtos) products = client.produtos;
        var temp = getClientThermometerScore(ticket);
        temp = Math.max(0, Math.min(100, Number(temp) || 38));

        var contactSection =
            '<div class="rp-section rp-section--contact">' +
            '<h4 class="rp-section__title">Identificação e Contato</h4>' +
            '<div class="rp-section__row"><span class="rp-section__label">E-mail</span>' +
            '<span class="rp-section__value" id="rp-email-' + ticket.id + '">' + escapeHtml(data.email || '—') + '</span></div>' +
            '<div class="rp-section__row"><span class="rp-section__label">Telefone</span>' +
            '<span class="rp-section__value" id="rp-tel-' + ticket.id + '">' + escapeHtml(data.telefone || '—') + '</span></div>' +
            '<div class="rp-section__row"><span class="rp-section__label">CPF</span>' +
            '<div class="rp-cpf-row">' +
            '<input type="text" class="velo-lf-input" id="rp-cpf-' + ticket.id + '" value="' + escapeHtml(maskCpf(data.cpf)) + '" maxlength="14" placeholder="000.000.000-00">' +
            '<button type="button" class="btn-cpf-search" title="Buscar CPF" data-rp-cpf-search="' + ticket.id + '"><i class="ti ti-search"></i></button>' +
            '</div></div>' +
            (products.length ? (
                '<div class="rp-section__row"><span class="rp-section__label">Produtos contratados</span>' +
                '<div class="rp-product-tags" id="rp-products-' + ticket.id + '">' +
                products.map(function (p) {
                    return '<span class="rp-product-tag ' + productTagClass(p) + '">' + escapeHtml(p) + '</span>';
                }).join('') +
                '</div></div>'
            ) : '') +
            '</div>';

        var classificacaoSection =
            '<div class="rp-section rp-section--classificacao">' +
            '<h4 class="rp-section__title">Classificação</h4>' +
            (lateralHtmlParts.classificacao || '') +
            '</div>';

        var thermoSection =
            '<div class="rp-section rp-section--thermo" id="rp-thermo-' + ticket.id + '">' +
            '<button type="button" class="rp-section__toggle" data-thermo-toggle="' + ticket.id + '">' +
            'Termômetro do cliente <i class="ti ti-chevron-down"></i></button>' +
            '<div class="rp-section__body">' +
            '<div class="thermo-score-label">Temperatura: ' + temp + '°</div>' +
            '<div class="thermo-bar">' +
            '<div class="thermo-fill" style="width:' + temp + '%"></div>' +
            '<span class="thermo-marker" style="left:' + temp + '%"></span>' +
            '</div></div></div>';

        var iaSection = lateralHtmlParts.ia ? (
            '<div class="rp-section rp-section--ia">' + lateralHtmlParts.ia + '</div>'
        ) : '';

        return contactSection + classificacaoSection + thermoSection + iaSection;
    }

    function rotateAlertaRoleta(container) {
        if (!container) return;
        var track = container.querySelector('.alerta-roleta__track');
        if (!track) return;
        var current = track.querySelector('.alerta-roleta__item.is-active');
        var curIdx = current ? parseInt(current.getAttribute('data-index'), 10) : 0;
        var nextIdx = (curIdx + 1) % ALERTAS_MONITORIA.length;
        var next = ALERTAS_MONITORIA[nextIdx];

        if (current) {
            current.classList.remove('is-active');
            current.classList.add('is-exiting');
            setTimeout(function () { current.remove(); }, 480);
        }

        var el = document.createElement('div');
        el.className = 'alerta-roleta__item is-entering';
        el.setAttribute('data-index', String(nextIdx));
        el.innerHTML = '<i class="ti ' + next.icon + '"></i><span>' + escapeHtml(next.text) + '</span>';
        track.appendChild(el);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                el.classList.remove('is-entering');
                el.classList.add('is-active');
            });
        });
    }

    function startAlertaRoleta(container, intervalMs) {
        if (!container) return;
        var id = container.id || 'default';
        if (roletaIntervals[id]) clearInterval(roletaIntervals[id]);
        roletaIntervals[id] = setInterval(function () {
            rotateAlertaRoleta(container);
        }, intervalMs || 5000);
    }

    function toggleCadastroExpand(ticketId, open) {
        var panel = document.getElementById('cadastro-manual-' + ticketId);
        if (!panel) return;
        var shouldOpen = open != null ? open : !panel.classList.contains('is-open');
        panel.classList.toggle('is-open', shouldOpen);
        panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        if (shouldOpen) {
            var nome = document.getElementById('cm-nome-' + ticketId);
            if (nome) setTimeout(function () { nome.focus(); }, 320);
        }
    }

    function saveCadastroManual(ticketId) {
        var ticket = getTicketById(ticketId);
        if (!ticket) return;

        var nome = (document.getElementById('cm-nome-' + ticketId) || {}).value || '';
        var cpf = (document.getElementById('cm-cpf-' + ticketId) || {}).value || '';
        var tel = (document.getElementById('cm-tel-' + ticketId) || {}).value || '';
        var email = (document.getElementById('cm-email-' + ticketId) || {}).value || '';

        if (!nome.trim()) {
            if (typeof global.showNotification === 'function') global.showNotification('Informe o nome completo.', 'warning');
            return;
        }

        ticket.manualClientRegistered = true;
        ticket.manualClientName = nome.trim();
        ticket.manualClientPhone = tel.trim();
        ticket.manualClientEmail = email.trim();
        ticket.clientName = nome.trim();
        if (!ticket.lateralForm) ticket.lateralForm = {};
        ticket.lateralForm.cpf = cpf.replace(/\D/g, '');

        var customerInfo = document.getElementById('customer-info-' + ticketId);
        if (customerInfo) customerInfo.innerHTML = renderCustomerInfoInner(ticket);

        var rpEmail = document.getElementById('rp-email-' + ticketId);
        var rpTel = document.getElementById('rp-tel-' + ticketId);
        var rpCpf = document.getElementById('rp-cpf-' + ticketId);
        if (rpEmail) rpEmail.textContent = email.trim() || '—';
        if (rpTel) rpTel.textContent = tel.trim() || '—';
        if (rpCpf) rpCpf.value = maskCpf(cpf);

        toggleCadastroExpand(ticketId, false);

        if (typeof global.showNotification === 'function') {
            global.showNotification('Cadastro salvo: ' + nome.trim(), 'success');
        }
    }

    function bindCadastroMasks(ticketId) {
        var cpfInput = document.getElementById('cm-cpf-' + ticketId);
        var telInput = document.getElementById('cm-tel-' + ticketId);
        if (cpfInput) {
            cpfInput.addEventListener('input', function () {
                cpfInput.value = maskCpf(cpfInput.value);
            });
        }
        if (telInput) {
            telInput.addEventListener('input', function () {
                telInput.value = maskPhone(telInput.value);
            });
        }
    }

    function initTicketCrmUi(ticketId) {
        var ticket = getTicketById(ticketId);
        if (!ticket) return;

        bindCadastroMasks(ticketId);

        var btnCadastro = document.getElementById('btn-cadastro-manual-' + ticketId);
        if (btnCadastro) {
            btnCadastro.addEventListener('click', function () {
                toggleCadastroExpand(ticketId);
            });
        }

        document.querySelectorAll('[data-more-toggle="' + ticketId + '"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var sec = document.getElementById('cm-secondary-' + ticketId);
                if (sec) {
                    sec.classList.toggle('is-visible');
                    btn.textContent = sec.classList.contains('is-visible') ? 'Ocultar informações' : 'Exibir mais informações';
                }
            });
        });

        document.querySelectorAll('[data-save-cadastro="' + ticketId + '"]').forEach(function (btn) {
            btn.addEventListener('click', function () { saveCadastroManual(ticketId); });
        });

        document.querySelectorAll('[data-thermo-toggle="' + ticketId + '"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var section = document.getElementById('rp-thermo-' + ticketId);
                if (section) section.classList.toggle('is-collapsed');
            });
        });

        var rpCpfSearch = document.querySelector('[data-rp-cpf-search="' + ticketId + '"]');
        var rpCpfInput = document.getElementById('rp-cpf-' + ticketId);
        if (rpCpfInput) {
            rpCpfInput.addEventListener('input', function () {
                rpCpfInput.value = maskCpf(rpCpfInput.value);
            });
        }
        if (rpCpfSearch && rpCpfInput) {
            rpCpfSearch.addEventListener('click', function () {
                var digits = rpCpfInput.value.replace(/\D/g, '');
                var client = lookupClientByCpf(digits);
                if (client) {
                    ticket.manualClientRegistered = true;
                    ticket.manualClientName = client.name;
                    ticket.clientName = client.name;
                    if (!ticket.lateralForm) ticket.lateralForm = {};
                    ticket.lateralForm.cpf = digits;
                    var customerInfo = document.getElementById('customer-info-' + ticketId);
                    if (customerInfo) customerInfo.innerHTML = renderCustomerInfoInner(ticket);
                    var rpEmail = document.getElementById('rp-email-' + ticketId);
                    var rpTel = document.getElementById('rp-tel-' + ticketId);
                    if (rpEmail && client.email) rpEmail.textContent = client.email;
                    if (rpTel && client.telefone) rpTel.textContent = client.telefone;
                    if (typeof global.showNotification === 'function') {
                        global.showNotification('Cliente encontrado: ' + client.name, 'success');
                    }
                } else if (typeof global.showNotification === 'function') {
                    global.showNotification('CPF não encontrado na base.', 'warning');
                }
            });
        }

        var roleta = document.getElementById('alerta-roleta-' + ticketId);
        if (roleta) startAlertaRoleta(roleta, 5000);
    }

    global.getClientThermometerScore = getClientThermometerScore;
    global.renderAlertaRoletaHtml = renderAlertaRoletaHtml;
    global.renderCustomerInfoInner = renderCustomerInfoInner;
    global.renderCadastroManualExpandHtml = renderCadastroManualExpandHtml;
    global.renderTicketHeaderBarBlock = renderTicketHeaderBarBlock;
    global.renderRightPanelSections = renderRightPanelSections;
    global.isClientRegistered = isClientRegistered;
    global.initTicketCrmUi = initTicketCrmUi;
    global.saveCadastroManual = saveCadastroManual;
    global.maskCpf = maskCpf;
    global.maskPhone = maskPhone;

})(typeof window !== 'undefined' ? window : this);
