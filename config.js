// Configurações da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/login',
            REGISTER: '/register',
            LOGOUT: '/logout'
        },
        TICKETS: {
            LIST: '/tickets',
            CREATE: '/tickets',
            UPDATE: '/tickets',
            MESSAGES: '/tickets'
        },
        BOXES: {
            LIST: '/boxes',
            CREATE: '/boxes'
        },
        UPLOAD: '/upload',
        USERS: '/users',
        DASHBOARD: '/dashboard'
    }
};

// Configurações de upload
const UPLOAD_CONFIG = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
};

// Configurações de notificações
const NOTIFICATION_CONFIG = {
    DURATION: 3000,
    POSITION: 'top-right',
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};

// Configurações de templates
const TEMPLATE_CONFIG = {
    RESPONSE_TEMPLATES: {
        'saudacao': {
            name: 'Saudação Padrão',
            content: 'Olá! Obrigado por entrar em contato conosco. Como posso ajudá-lo hoje?'
        },
        'agradecimento': {
            name: 'Agradecimento',
            content: 'Obrigado pelo seu contato. Sua solicitação foi registrada e será analisada pela nossa equipe.'
        },
        'resolucao': {
            name: 'Resolução de Problema',
            content: 'Identificamos e resolvemos o problema reportado. Por favor, teste a solução e nos informe se tudo está funcionando corretamente.'
        },
        'escalonamento': {
            name: 'Escalonamento',
            content: 'Sua solicitação foi escalada para nossa equipe técnica especializada. Você receberá uma resposta em breve.'
        },
        'aguardando': {
            name: 'Aguardando Cliente',
            content: 'Aguardamos sua resposta para prosseguir com o atendimento. Por favor, nos envie as informações solicitadas.'
        }
    }
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG,
        UPLOAD_CONFIG,
        NOTIFICATION_CONFIG,
        TEMPLATE_CONFIG
    };
}

