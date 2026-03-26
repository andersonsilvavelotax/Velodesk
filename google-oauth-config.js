// Configuração do Google OAuth para Velodesk
// Este arquivo contém as configurações necessárias para o login com Google

const GOOGLE_OAUTH_CONFIG = {
    // Substitua pelo seu Client ID do Google Console
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    
    // Domínios autorizados
    authorizedDomains: ['@velotax.com.br'],
    
    // Configurações do botão
    buttonConfig: {
        theme: 'outline',
        size: 'large',
        text: 'sign_in_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%'
    },
    
    // Configurações de segurança
    security: {
        autoSelect: false,
        cancelOnTapOutside: true,
        promptParentId: 'loginScreen'
    }
};

// Função para validar domínio de email
function validateEmailDomain(email) {
    if (!email) return false;
    
    return GOOGLE_OAUTH_CONFIG.authorizedDomains.some(domain => 
        email.endsWith(domain)
    );
}

// Função para obter configuração do Google
function getGoogleConfig() {
    return GOOGLE_OAUTH_CONFIG;
}

// Exportar para uso global
window.GOOGLE_OAUTH_CONFIG = GOOGLE_OAUTH_CONFIG;
window.validateEmailDomain = validateEmailDomain;
window.getGoogleConfig = getGoogleConfig;



