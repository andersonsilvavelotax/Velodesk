/**
 * Velodesk — perfis de clientes para o Portal do Cliente (demo)
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'velodeskClientProfiles';
    const SEED_VERSION = 'client-profiles-v1';

    const CLIENT_PROFILES = [
        {
            id: 'client_maria_oliveira',
            fullName: 'Maria Oliveira Santos',
            socialName: 'Maria',
            cpf: '248.391.056-42',
            cnpj: null,
            birthDate: '1985-03-15',
            gender: 'Feminino',
            nationality: 'Brasileira',
            photoInitials: 'MO',
            avatarColor: '#5b6ee8',
            segment: 'Residencial',
            tier: 'Gold',
            vip: true,
            customerSince: '2018-06-12',
            accountStatus: 'ativo',
            email: 'maria.oliveira@email.com',
            phone: '+55 11 98811-2233',
            phoneSecondary: '+55 11 3456-7890',
            preferredChannel: 'WhatsApp',
            preferredLanguage: 'Português (BR)',
            bestContactTime: '14h – 18h',
            address: {
                street: 'Rua das Flores, 123',
                complement: 'Apto 42',
                neighborhood: 'Jardins',
                city: 'São Paulo',
                state: 'SP',
                zip: '01415-000',
                country: 'Brasil',
                type: 'Residencial'
            },
            contract: {
                number: 'CTR-789456',
                plan: 'Família 4 linhas — 50 GB',
                status: 'ativo',
                since: '2020-01-10',
                renewal: '2026-01-10',
                monthlyValue: 289.9,
                paymentMethod: 'Cartão de crédito •••• 4521',
                dueDay: 15,
                autoDebit: true,
                lines: [
                    { number: '11 98811-2233', type: 'Móvel', holder: true, dataUsedGb: 32, dataLimitGb: 50 },
                    { number: '11 97722-3344', type: 'Móvel', holder: false, dataUsedGb: 18, dataLimitGb: 50 },
                    { number: '11 96633-4455', type: 'Móvel', holder: false, dataUsedGb: 41, dataLimitGb: 50 },
                    { number: '11 95544-5566', type: 'Móvel', holder: false, dataUsedGb: 8, dataLimitGb: 50 }
                ],
                addons: ['Streaming Premium', 'Roaming América do Sul']
            },
            billing: {
                currentBalance: 0,
                creditLimit: 500,
                creditScore: 'Excelente',
                lastInvoice: {
                    id: 'FAT-202506-789456',
                    amount: 289.9,
                    dueDate: '2025-06-15',
                    paidAt: '2025-06-12',
                    status: 'pago'
                },
                invoices: [
                    { id: 'FAT-202506-789456', amount: 289.9, dueDate: '2025-06-15', status: 'pago' },
                    { id: 'FAT-202505-789456', amount: 289.9, dueDate: '2025-05-15', status: 'pago' },
                    { id: 'FAT-202504-789456', amount: 274.9, dueDate: '2025-04-15', status: 'pago' }
                ]
            },
            devices: [
                { name: 'iPhone 14 Pro', imei: '356789012345678', acquiredAt: '2023-08-20', warrantyUntil: '2025-08-20', status: 'ativo', financed: false },
                { name: 'Modem Fibra 500Mb', serial: 'FTTH-998877', acquiredAt: '2020-01-10', warrantyUntil: '2025-01-10', status: 'ativo', financed: false }
            ],
            metrics: {
                nps: 9,
                csat: 4.7,
                totalTickets: 14,
                openTickets: 2,
                resolvedLast90Days: 3,
                avgResolutionDays: 1.2,
                churnRisk: 'baixo',
                lifetimeValue: 18420
            },
            tickets: [
                { id: 10015, subject: 'Cobrança duplicada no cartão', status: 'em-andamento', priority: 'Alta', channel: 'WhatsApp', createdAt: '2025-06-01T10:30:00', updatedAt: '2025-06-03T14:20:00', agent: 'Ana Silva' },
                { id: 10042, subject: 'Roaming internacional não funcionou', status: 'pendente', priority: 'Média', channel: 'App', createdAt: '2025-06-04T09:15:00', updatedAt: '2025-06-04T11:00:00', agent: 'Carlos Mendes' },
                { id: 10008, subject: 'Segunda via de boleto', status: 'resolvido', priority: 'Baixa', channel: 'Portal', createdAt: '2025-05-20T16:00:00', updatedAt: '2025-05-21T09:30:00', agent: 'Juliana Costa' }
            ],
            interactions: [
                { type: 'WhatsApp', date: '2025-06-03T14:20:00', summary: 'Cliente confirmou dados do cartão para estorno', agent: 'Ana Silva' },
                { type: 'Ligação', date: '2025-06-02T11:05:00', summary: 'Explicada duplicidade na fatura — protocolo aberto', agent: 'Ana Silva', duration: '8 min' },
                { type: 'E-mail', date: '2025-05-28T08:00:00', summary: 'Envio de comprovante de pagamento', agent: 'Sistema' }
            ],
            tags: ['VIP', 'Família', 'Alta fidelidade'],
            notes: 'Prefere contato após 14h. Histórico positivo — candidata a upgrade de plano.',
            lgpdConsent: true,
            lgpdConsentDate: '2018-06-12',
            marketingOptIn: true,
            accessibility: null
        },
        {
            id: 'client_joao_corporativo',
            fullName: 'João Pedro Ferreira',
            socialName: 'João',
            cpf: '312.847.159-00',
            cnpj: '12.345.678/0001-90',
            birthDate: '1978-11-22',
            gender: 'Masculino',
            nationality: 'Brasileira',
            photoInitials: 'JF',
            avatarColor: '#0d9488',
            segment: 'PME',
            tier: 'Platinum',
            vip: true,
            customerSince: '2015-03-08',
            accountStatus: 'ativo',
            email: 'joao.ferreira@techsolutions.com.br',
            phone: '+55 11 99722-3344',
            phoneSecondary: '+55 11 4002-8922',
            preferredChannel: 'E-mail',
            preferredLanguage: 'Português (BR)',
            bestContactTime: '9h – 12h',
            address: {
                street: 'Av. Paulista, 1578',
                complement: 'Sala 1204',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                zip: '01310-200',
                country: 'Brasil',
                type: 'Comercial'
            },
            contract: {
                number: 'CTR-CORP-445821',
                plan: 'Corporativo 20 linhas + Fibra 1Gb',
                status: 'ativo',
                since: '2019-06-01',
                renewal: '2025-12-01',
                monthlyValue: 4890.0,
                paymentMethod: 'Boleto bancário — faturamento centralizado',
                dueDay: 5,
                autoDebit: false,
                lines: [
                    { number: '11 99722-3344', type: 'Móvel', holder: true, dataUsedGb: 28, dataLimitGb: 100 },
                    { number: '11 99661-2233', type: 'Móvel', holder: false, dataUsedGb: 55, dataLimitGb: 100 },
                    { number: '11 4002-8922', type: 'Fixo', holder: false, dataUsedGb: 0, dataLimitGb: 0 }
                ],
                addons: ['VPN Empresarial', 'Suporte prioritário 24/7', 'Gestão de frota']
            },
            billing: {
                currentBalance: 4890.0,
                creditLimit: 15000,
                creditScore: 'Bom',
                lastInvoice: {
                    id: 'FAT-202506-CORP445821',
                    amount: 4890.0,
                    dueDate: '2025-06-05',
                    paidAt: null,
                    status: 'em aberto'
                },
                invoices: [
                    { id: 'FAT-202506-CORP445821', amount: 4890.0, dueDate: '2025-06-05', status: 'em aberto' },
                    { id: 'FAT-202505-CORP445821', amount: 4890.0, dueDate: '2025-05-05', status: 'pago' },
                    { id: 'FAT-202504-CORP445821', amount: 4650.0, dueDate: '2025-04-05', status: 'pago' }
                ]
            },
            devices: [
                { name: 'Samsung Galaxy S24 Ultra', imei: '359012345678901', acquiredAt: '2024-03-15', warrantyUntil: '2026-03-15', status: 'ativo', financed: true },
                { name: 'Roteador Empresarial', serial: 'ENT-ROUTE-5544', acquiredAt: '2019-06-01', warrantyUntil: '2024-06-01', status: 'ativo', financed: false },
                { name: 'Central PABX Cloud', serial: 'PABX-CLOUD-12', acquiredAt: '2021-01-20', warrantyUntil: '2026-01-20', status: 'ativo', financed: false }
            ],
            metrics: {
                nps: 7,
                csat: 4.0,
                totalTickets: 47,
                openTickets: 3,
                resolvedLast90Days: 8,
                avgResolutionDays: 2.5,
                churnRisk: 'médio',
                lifetimeValue: 285600
            },
            tickets: [
                { id: 10055, subject: 'Contrato corporativo — 5 linhas novas filial SP', status: 'em-andamento', priority: 'Urgente', channel: 'E-mail', createdAt: '2025-06-02T08:00:00', updatedAt: '2025-06-04T16:30:00', agent: 'Roberto Lima' },
                { id: 10061, subject: 'VPN empresa não conecta', status: 'pendente', priority: 'Alta', channel: 'Telefone', createdAt: '2025-06-03T14:00:00', updatedAt: '2025-06-04T09:00:00', agent: 'Paulo Henrique' },
                { id: 10038, subject: 'SLA não cumprido — instalação fibra', status: 'resolvido', priority: 'Alta', channel: 'Telefone', createdAt: '2025-05-15T10:00:00', updatedAt: '2025-05-22T17:00:00', agent: 'Fernanda Rocha' }
            ],
            interactions: [
                { type: 'Reunião', date: '2025-06-04T16:30:00', summary: 'Alinhamento sobre expansão filial — 5 linhas', agent: 'Roberto Lima', duration: '45 min' },
                { type: 'E-mail', date: '2025-06-03T09:00:00', summary: 'Enviada proposta comercial atualizada', agent: 'Roberto Lima' },
                { type: 'Telefone', date: '2025-06-01T11:20:00', summary: 'Reclamação sobre SLA de instalação', agent: 'Fernanda Rocha', duration: '22 min' }
            ],
            tags: ['PME', 'Corporativo', 'SLA contratual', 'Alto valor'],
            notes: 'Gerente de conta: Roberto Lima. Renovação em dezembro — atenção comercial.',
            lgpdConsent: true,
            lgpdConsentDate: '2019-06-01',
            marketingOptIn: false,
            accessibility: null
        },
        {
            id: 'client_ana_beatriz',
            fullName: 'Ana Beatriz Costa',
            socialName: 'Ana',
            cpf: '456.123.789-01',
            cnpj: null,
            birthDate: '1998-07-08',
            gender: 'Feminino',
            nationality: 'Brasileira',
            photoInitials: 'AC',
            avatarColor: '#e879a8',
            segment: 'Residencial',
            tier: 'Silver',
            vip: false,
            customerSince: '2022-09-20',
            accountStatus: 'inadimplente',
            email: 'ana.beatriz@gmail.com',
            phone: '+55 21 96633-4455',
            phoneSecondary: null,
            preferredChannel: 'App',
            preferredLanguage: 'Português (BR)',
            bestContactTime: '19h – 22h',
            address: {
                street: 'Rua Visconde de Pirajá, 456',
                complement: 'Cobertura',
                neighborhood: 'Ipanema',
                city: 'Rio de Janeiro',
                state: 'RJ',
                zip: '22410-002',
                country: 'Brasil',
                type: 'Residencial'
            },
            contract: {
                number: 'CTR-334521',
                plan: 'Controle 15 GB',
                status: 'suspenso',
                since: '2022-09-20',
                renewal: '2025-09-20',
                monthlyValue: 59.9,
                paymentMethod: 'PIX automático',
                dueDay: 20,
                autoDebit: true,
                lines: [
                    { number: '21 96633-4455', type: 'Móvel', holder: true, dataUsedGb: 0, dataLimitGb: 15 }
                ],
                addons: []
            },
            billing: {
                currentBalance: 179.7,
                creditLimit: 100,
                creditScore: 'Regular',
                lastInvoice: {
                    id: 'FAT-202506-334521',
                    amount: 59.9,
                    dueDate: '2025-06-20',
                    paidAt: null,
                    status: 'vencido'
                },
                invoices: [
                    { id: 'FAT-202506-334521', amount: 59.9, dueDate: '2025-06-20', status: 'vencido' },
                    { id: 'FAT-202505-334521', amount: 59.9, dueDate: '2025-05-20', status: 'vencido' },
                    { id: 'FAT-202504-334521', amount: 59.9, dueDate: '2025-04-20', status: 'pago' }
                ]
            },
            devices: [
                { name: 'Motorola Edge 40', imei: '351234567890123', acquiredAt: '2023-11-10', warrantyUntil: '2024-11-10', status: 'ativo', financed: true }
            ],
            metrics: {
                nps: 4,
                csat: 2.8,
                totalTickets: 9,
                openTickets: 2,
                resolvedLast90Days: 4,
                avgResolutionDays: 4.1,
                churnRisk: 'alto',
                lifetimeValue: 1680
            },
            tickets: [
                { id: 10072, subject: 'Linha suspensa por inadimplência — negociar débito', status: 'em-andamento', priority: 'Urgente', channel: 'App', createdAt: '2025-06-04T20:30:00', updatedAt: '2025-06-05T09:00:00', agent: 'Mariana Dias' },
                { id: 10068, subject: 'PIX automático falhou', status: 'pendente', priority: 'Alta', channel: 'Chat', createdAt: '2025-06-03T19:45:00', updatedAt: '2025-06-04T10:15:00', agent: 'Lucas Almeida' },
                { id: 10045, subject: 'Franquia estourada — cobrança extra', status: 'resolvido', priority: 'Média', channel: 'App', createdAt: '2025-05-10T21:00:00', updatedAt: '2025-05-12T14:00:00', agent: 'Mariana Dias' }
            ],
            interactions: [
                { type: 'Chat', date: '2025-06-05T09:00:00', summary: 'Oferecido parcelamento em 3x — cliente analisando', agent: 'Mariana Dias' },
                { type: 'App', date: '2025-06-04T20:30:00', summary: 'Abertura de chamado por suspensão', agent: 'Sistema' },
                { type: 'SMS', date: '2025-06-01T08:00:00', summary: 'Lembrete de fatura vencida — 2ª via enviada', agent: 'Sistema' }
            ],
            tags: ['Inadimplente', 'Risco churn', 'Controle'],
            notes: 'Sensível a preço. Oferecer plano pré-pago como alternativa na negociação.',
            lgpdConsent: true,
            lgpdConsentDate: '2022-09-20',
            marketingOptIn: false,
            accessibility: null
        },
        {
            id: 'client_carlos_idoso',
            fullName: 'Carlos Mendes Almeida',
            socialName: 'Seu Carlos',
            cpf: '089.456.123-45',
            cnpj: null,
            birthDate: '1952-12-03',
            gender: 'Masculino',
            nationality: 'Brasileira',
            photoInitials: 'CM',
            avatarColor: '#d97706',
            segment: 'Residencial',
            tier: 'Bronze',
            vip: false,
            customerSince: '2010-04-18',
            accountStatus: 'ativo',
            email: 'carlos.mendes@uol.com.br',
            phone: '+55 11 3456-7890',
            phoneSecondary: '+55 11 98765-4321',
            preferredChannel: 'Telefone',
            preferredLanguage: 'Português (BR)',
            bestContactTime: '9h – 11h',
            address: {
                street: 'Rua Augusta, 2100',
                complement: 'Casa',
                neighborhood: 'Consolação',
                city: 'São Paulo',
                state: 'SP',
                zip: '01412-100',
                country: 'Brasil',
                type: 'Residencial'
            },
            contract: {
                number: 'CTR-112890',
                plan: 'Fixo + Banda Larga 200Mb',
                status: 'ativo',
                since: '2010-04-18',
                renewal: '2025-12-18',
                monthlyValue: 129.9,
                paymentMethod: 'Débito automático — conta corrente',
                dueDay: 10,
                autoDebit: true,
                lines: [
                    { number: '11 3456-7890', type: 'Fixo', holder: true, dataUsedGb: 0, dataLimitGb: 0 },
                    { number: '11 98765-4321', type: 'Móvel', holder: true, dataUsedGb: 2, dataLimitGb: 5 }
                ],
                addons: ['Identificador de chamadas', 'Suporte telefônico prioritário 60+']
            },
            billing: {
                currentBalance: 0,
                creditLimit: 200,
                creditScore: 'Bom',
                lastInvoice: {
                    id: 'FAT-202506-112890',
                    amount: 129.9,
                    dueDate: '2025-06-10',
                    paidAt: '2025-06-08',
                    status: 'pago'
                },
                invoices: [
                    { id: 'FAT-202506-112890', amount: 129.9, dueDate: '2025-06-10', status: 'pago' },
                    { id: 'FAT-202505-112890', amount: 129.9, dueDate: '2025-05-10', status: 'pago' },
                    { id: 'FAT-202504-112890', amount: 119.9, dueDate: '2025-04-10', status: 'pago' }
                ]
            },
            devices: [
                { name: 'Modem VDSL', serial: 'VDSL-445566', acquiredAt: '2018-03-01', warrantyUntil: '2023-03-01', status: 'ativo', financed: false },
                { name: 'Telefone sem fio', serial: 'TEL-SF-8899', acquiredAt: '2015-06-10', warrantyUntil: '2016-06-10', status: 'ativo', financed: false }
            ],
            metrics: {
                nps: 8,
                csat: 4.5,
                totalTickets: 22,
                openTickets: 1,
                resolvedLast90Days: 2,
                avgResolutionDays: 3.0,
                churnRisk: 'baixo',
                lifetimeValue: 22400
            },
            tickets: [
                { id: 10080, subject: 'Internet lenta — luz vermelha no modem', status: 'em-andamento', priority: 'Alta', channel: 'Telefone', createdAt: '2025-06-04T09:30:00', updatedAt: '2025-06-05T08:00:00', agent: 'Paulo Henrique' },
                { id: 10022, subject: 'Visita técnica agendada para sábado', status: 'resolvido', priority: 'Média', channel: 'Telefone', createdAt: '2025-05-28T10:00:00', updatedAt: '2025-05-30T15:00:00', agent: 'Paulo Henrique' }
            ],
            interactions: [
                { type: 'Telefone', date: '2025-06-05T08:00:00', summary: 'Visita técnica confirmada para sábado 8h–12h', agent: 'Paulo Henrique', duration: '15 min' },
                { type: 'Telefone', date: '2025-06-04T09:30:00', summary: 'Relatou internet lenta e luz vermelha no modem', agent: 'Paulo Henrique', duration: '12 min' },
                { type: 'Telefone', date: '2025-05-28T10:00:00', summary: 'Agendamento de visita técnica', agent: 'Paulo Henrique', duration: '18 min' }
            ],
            tags: ['60+', 'Prioridade idoso', 'Fixo', 'Fidelidade'],
            notes: 'Filha (Beatriz) é contato alternativo: 11 91234-5678. Falar devagar e confirmar entendimento.',
            lgpdConsent: true,
            lgpdConsentDate: '2010-04-18',
            marketingOptIn: false,
            accessibility: 'Fonte ampliada no app, atendimento telefônico preferencial'
        },
        {
            id: 'client_techstart_b2b',
            fullName: 'TechStart Inovação Ltda',
            socialName: 'TechStart',
            cpf: null,
            cnpj: '45.678.901/0001-23',
            birthDate: null,
            gender: null,
            nationality: 'Brasileira',
            photoInitials: 'TS',
            avatarColor: '#7c3aed',
            segment: 'Enterprise',
            tier: 'Enterprise',
            vip: true,
            customerSince: '2021-02-01',
            accountStatus: 'ativo',
            email: 'suporte@techstart.io',
            phone: '+55 11 4003-5566',
            phoneSecondary: '+55 11 98877-6655',
            preferredChannel: 'Portal corporativo',
            preferredLanguage: 'Português (BR)',
            bestContactTime: 'Comercial',
            legalRep: 'Fernanda Rocha (CEO)',
            address: {
                street: 'Rua Funchal, 418',
                complement: '32º andar',
                neighborhood: 'Vila Olímpia',
                city: 'São Paulo',
                state: 'SP',
                zip: '04551-060',
                country: 'Brasil',
                type: 'Comercial'
            },
            contract: {
                number: 'CTR-ENT-990012',
                plan: 'Enterprise 50 linhas + Dedicado 2Gb',
                status: 'ativo',
                since: '2021-02-01',
                renewal: '2026-02-01',
                monthlyValue: 28500.0,
                paymentMethod: 'Nota fiscal — prazo 30 dias',
                dueDay: 1,
                autoDebit: false,
                sla: '99,5% uptime — resposta N1 em 15 min',
                lines: [
                    { number: '11 4003-5566', type: 'Fixo', holder: true, dataUsedGb: 0, dataLimitGb: 0 },
                    { number: '11 98877-6655', type: 'Móvel', holder: false, dataUsedGb: 78, dataLimitGb: 200 }
                ],
                addons: ['API integração', 'Gerente dedicado', 'Relatórios BI', 'Disaster recovery']
            },
            billing: {
                currentBalance: 0,
                creditLimit: 50000,
                creditScore: 'Excelente',
                lastInvoice: {
                    id: 'NF-202506-ENT990012',
                    amount: 28500.0,
                    dueDate: '2025-07-01',
                    paidAt: null,
                    status: 'a vencer'
                },
                invoices: [
                    { id: 'NF-202506-ENT990012', amount: 28500.0, dueDate: '2025-07-01', status: 'a vencer' },
                    { id: 'NF-202505-ENT990012', amount: 28500.0, dueDate: '2025-06-01', status: 'pago' },
                    { id: 'NF-202504-ENT990012', amount: 27200.0, dueDate: '2025-05-01', status: 'pago' }
                ]
            },
            devices: [
                { name: 'Link dedicado 2Gb', serial: 'DED-2G-7788', acquiredAt: '2021-02-01', warrantyUntil: '2026-02-01', status: 'ativo', financed: false },
                { name: 'Firewall corporativo', serial: 'FW-ENT-3344', acquiredAt: '2022-06-15', warrantyUntil: '2027-06-15', status: 'ativo', financed: false },
                { name: '50x SIM corporativo', serial: 'LOTE-SIM-50', acquiredAt: '2024-01-10', warrantyUntil: null, status: 'ativo', financed: false }
            ],
            metrics: {
                nps: 9,
                csat: 4.8,
                totalTickets: 156,
                openTickets: 4,
                resolvedLast90Days: 22,
                avgResolutionDays: 0.8,
                churnRisk: 'baixo',
                lifetimeValue: 1026000
            },
            tickets: [
                { id: 10090, subject: 'Webhook de status API parceiro falhou', status: 'em-andamento', priority: 'Urgente', channel: 'Portal', createdAt: '2025-06-05T07:00:00', updatedAt: '2025-06-05T10:30:00', agent: 'N2 — Integrações' },
                { id: 10088, subject: 'Relatório mensal SLA divergente', status: 'pendente', priority: 'Alta', channel: 'E-mail', createdAt: '2025-06-04T14:00:00', updatedAt: '2025-06-05T09:00:00', agent: 'Fernanda Rocha' },
                { id: 10085, subject: 'Migração 10 linhas para eSIM', status: 'em-andamento', priority: 'Média', channel: 'Portal', createdAt: '2025-06-01T11:00:00', updatedAt: '2025-06-03T16:00:00', agent: 'Roberto Lima' },
                { id: 10070, subject: 'Incidente link dedicado — resolvido', status: 'resolvido', priority: 'Crítica', channel: 'Telefone', createdAt: '2025-05-20T03:15:00', updatedAt: '2025-05-20T05:45:00', agent: 'NOC 24/7' }
            ],
            interactions: [
                { type: 'Portal', date: '2025-06-05T10:30:00', summary: 'Ticket API escalado para N2 Integrações', agent: 'Sistema' },
                { type: 'Reunião', date: '2025-06-02T15:00:00', summary: 'QBR trimestral — SLA 99,7% atingido', agent: 'Fernanda Rocha', duration: '60 min' },
                { type: 'E-mail', date: '2025-06-01T09:00:00', summary: 'Início migração eSIM — lote 1 de 3', agent: 'Roberto Lima' }
            ],
            tags: ['Enterprise', 'API', 'SLA premium', 'Gerente dedicado'],
            notes: 'Conta estratégica. CSM: Fernanda Rocha. Escalonamento direto para N2 sem triagem.',
            lgpdConsent: true,
            lgpdConsentDate: '2021-02-01',
            marketingOptIn: true,
            accessibility: null
        }
    ];

    function seedClientProfiles(force) {
        if (!force && localStorage.getItem('velodeskClientProfilesVersion') === SEED_VERSION) {
            return getClientProfiles();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(CLIENT_PROFILES));
        localStorage.setItem('velodeskClientProfilesVersion', SEED_VERSION);
        localStorage.setItem('velodeskActiveClientId', CLIENT_PROFILES[0].id);
        return CLIENT_PROFILES;
    }

    function getClientProfiles() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) { /* ignore */ }
        return seedClientProfiles(true);
    }

    function getActiveClientId() {
        return localStorage.getItem('velodeskActiveClientId') || getClientProfiles()[0]?.id;
    }

    function setActiveClientId(id) {
        localStorage.setItem('velodeskActiveClientId', id);
    }

    function getClientById(id) {
        return getClientProfiles().find(c => c.id === id) || null;
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return iso;
        }
    }

    function formatDateTime(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return iso;
        }
    }

    window.VelodeskClientPortal = {
        CLIENT_PROFILES,
        seedClientProfiles,
        getClientProfiles,
        getActiveClientId,
        setActiveClientId,
        getClientById,
        formatCurrency,
        formatDate,
        formatDateTime
    };

})();
