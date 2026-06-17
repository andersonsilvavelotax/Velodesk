/* Seed de 3 tickets demo com clientes fictícios — protótipo V3 */
(function () {
    const DEMO_CLIENTS = [
        {
            cpf: '12345678901',
            cpfFmt: '123.456.789-01',
            name: 'Maria Oliveira',
            title: 'Internet lenta após 22h — Maria Oliveira',
            description: 'Cliente relata queda de velocidade no período noturno. Fibra 500MB contratada.',
            clientMessage: 'Boa noite! Minha internet fica muito lenta depois das 22h. Tenho fibra de 500MB e no speed test cai para menos de 50MB. Podem verificar?',
            status: 'novo',
            boxId: 'novos',
            source: 'WhatsApp',
            channel: 'WhatsApp',
            produto: 'Internet Fibra',
            classificacaoTipo: 'Reclamação',
            motivo: 'Lentidão',
            detalhe: 'Em análise',
            priority: 'alta'
        },
        {
            cpf: '98765432100',
            cpfFmt: '987.654.321-00',
            name: 'João Pereira',
            title: 'Bloqueio por inadimplência — João Pereira',
            description: 'Cliente contesta bloqueio do combo móvel. Solicita negociação de débitos.',
            clientMessage: 'Meu combo móvel foi bloqueado e eu já tinha feito acordo de pagamento pelo portal. Preciso desbloquear urgente e negociar o que ficou em aberto.',
            status: 'em-aberto',
            boxId: 'em-andamento',
            source: 'Portal',
            channel: 'Portal',
            produto: 'Combo',
            classificacaoTipo: 'Solicitação',
            motivo: 'Cobrança',
            detalhe: 'Contestação',
            priority: 'critica'
        },
        {
            cpf: '11122233344',
            cpfFmt: '111.222.333-44',
            name: 'Empresa Tech Ltda',
            title: 'Upgrade link dedicado — Empresa Tech Ltda',
            description: 'CNPJ solicita upgrade de link corporativo e revisão contratual.',
            clientMessage: 'Somos a Empresa Tech Ltda e precisamos de upgrade do link dedicado corporativo. Podem enviar proposta com revisão contratual?',
            status: 'pendente',
            boxId: 'pendentes',
            source: 'E-mail',
            channel: 'E-mail',
            produto: 'Internet Fibra',
            classificacaoTipo: 'Informação',
            motivo: 'Instalação',
            detalhe: 'Agendamento pendente',
            priority: 'normal'
        }
    ];

    function defaultBoxes() {
        return [
            { id: 'novos', name: 'Novos', tickets: [] },
            { id: 'em-andamento', name: 'Em Andamento', tickets: [] },
            { id: 'em-espera', name: 'Pendente', tickets: [] },
            { id: 'pendentes', name: 'Aguardando retorno', tickets: [] },
            { id: 'resolvidos', name: 'Resolvidos', tickets: [] }
        ];
    }

    function resetClientDB() {
        const db = {
            '12345678901': {
                cpf: '123.456.789-01',
                name: 'Maria Oliveira',
                email: 'maria.oliveira@email.com',
                telefone: '(11) 98765-4321',
                situacao: 'Adimplente',
                produtos: ['Internet Fibra', 'TV'],
                risco: 'Baixo',
                termometro: 38,
                termometroLabel: 'Estável',
                termometroNivel: 'frio',
                breveDescricao: 'Cliente adimplente e engajada; 2 abandonos leves na jornada digital. Priorizar resolução técnica rápida.',
                atendimentos: [
                    { data: '2026-05-28', canal: 'WhatsApp', assunto: 'Lentidão à noite', status: 'Resolvido' },
                    { data: '2026-06-03', canal: 'Telefone', assunto: 'Cobrança duplicada', status: 'Em andamento' }
                ],
                abandonoJornada: { total: 2, ultimaEtapa: 'Confirmação de pagamento', ultimaData: '2026-05-15' },
                analise: 'Perfil estável. Risco baixo de churn se SLA de fibra for cumprido.'
            },
            '98765432100': {
                cpf: '987.654.321-00',
                name: 'João Pereira',
                email: 'joao.pereira@email.com',
                telefone: '(11) 91234-5678',
                situacao: 'Inadimplente',
                produtos: ['Móvel', 'Combo'],
                risco: 'Alto',
                termometro: 88,
                termometroLabel: 'Crítico',
                termometroNivel: 'quente',
                breveDescricao: 'Inadimplente com 5 abandonos na jornada self-service. Alto risco de cancelamento — acionar retenção.',
                atendimentos: [
                    { data: '2026-06-01', canal: 'Portal', assunto: 'Bloqueio por atraso', status: 'Aberto' },
                    { data: '2026-05-20', canal: 'WhatsApp', assunto: 'Promessa de pagamento', status: 'Não cumprida' }
                ],
                abandonoJornada: { total: 5, ultimaEtapa: 'Validação de identidade', ultimaData: '2026-06-08' },
                analise: 'Termômetro crítico: combinar financeiro + retenção no mesmo atendimento.'
            },
            '11122233344': {
                cpf: '111.222.333-44',
                name: 'Empresa Tech Ltda',
                email: 'contato@empresatech.com.br',
                telefone: '(11) 3456-7890',
                situacao: 'Adimplente',
                produtos: ['Internet Fibra', 'Telefone Fixo', 'Streaming'],
                risco: 'Médio',
                termometro: 62,
                termometroLabel: 'Atenção',
                termometroNivel: 'morno',
                breveDescricao: 'Conta corporativa saudável, mas sensível a prazos de upgrade. Sem abandono recente — manter proatividade comercial.',
                atendimentos: [
                    { data: '2026-05-10', canal: 'E-mail', assunto: 'Upgrade link dedicado', status: 'Resolvido' },
                    { data: '2026-06-09', canal: 'Telefone', assunto: 'Revisão contratual', status: 'Em andamento' }
                ],
                abandonoJornada: { total: 0, ultimaEtapa: '—', ultimaData: '—' },
                analise: 'Oportunidade de upsell; monitorar prazo de proposta comercial.'
            }
        };
        localStorage.setItem('velodeskClientDB', JSON.stringify(db));
    }

    function buildClientMessage(client) {
        if (client.clientMessage) return client.clientMessage;
        return client.description;
    }

    function buildTicket(client, index, baseId) {
        const now = new Date();
        const createdAt = new Date(now.getTime() - (index + 1) * 86400000).toISOString();
        const agent = 'Ana Silva';
        const clientText = buildClientMessage(client);
        return {
            id: baseId + index,
            title: client.title,
            description: client.description,
            status: client.status,
            priority: client.priority,
            channel: client.channel,
            source: client.source,
            openedBy: 'client',
            createdAt,
            updatedAt: now.toISOString(),
            messages: [{
                id: 'client-msg-' + index,
                fromClient: true,
                type: 'client',
                text: clientText,
                timestamp: createdAt,
                author: client.name
            }],
            internalNotes: [],
            solicitante: client.name,
            clientName: client.name,
            clientCPF: client.cpfFmt,
            responsibleAgent: agent,
            group: client.boxId === 'pendentes' ? 'Supervisor de fila' : 'Fila N1 — Triagem',
            formId: null,
            formData: {},
            isDemo: true,
            lateralForm: {
                cpf: client.cpf,
                canal: client.channel,
                classificacaoTipo: client.classificacaoTipo,
                produto: client.produto,
                motivo: client.motivo,
                detalhe: client.detalhe,
                responsavel: agent,
                atribuido: client.status === 'em-aberto' ? agent : (client.status === 'pendente' ? 'Supervisor de fila' : 'Fila N1 — Triagem'),
                _canalLocked: true
            }
        };
    }

    window.seedDemoTickets = function (opts) {
        opts = opts || {};
        const force = opts.force !== false;
        const replaceAll = opts.replaceAll !== false;

        if (!force && localStorage.getItem('velodeskDemoTickets3')) {
            return 3;
        }

        resetClientDB();

        let columns = JSON.parse(localStorage.getItem('kanbanColumns') || '[]');
        if (!columns.length) columns = defaultBoxes();

        if (replaceAll) {
            columns.forEach(function (box) { box.tickets = []; });
        } else {
            columns.forEach(function (box) {
                if (box.tickets) box.tickets = box.tickets.filter(function (t) { return !t.isDemo; });
            });
        }

        const baseId = Date.now();
        DEMO_CLIENTS.forEach(function (client, i) {
            const ticket = buildTicket(client, i, baseId);
            const box = columns.find(function (b) { return b.id === client.boxId; });
            if (box) {
                if (!box.tickets) box.tickets = [];
                box.tickets.push(ticket);
            }
        });

        localStorage.removeItem('velodeskDemoTickets100');
        localStorage.setItem('kanbanColumns', JSON.stringify(columns));
        localStorage.setItem('velodeskDemoTickets3', 'true');

        if (typeof loadBoxes === 'function') loadBoxes();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        if (typeof showNotification === 'function') {
            showNotification('3 tickets demo criados com clientes fictícios.', 'success');
        }

        return 3;
    };

    window.resetVelodeskClientDB = resetClientDB;
})();
