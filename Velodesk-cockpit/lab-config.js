/**
 * Velodesk Lab — sandbox isolado para testes.
 * Porta recomendada: 8767 (localStorage separado de Velodesk/ produção local).
 */
(function () {
    'use strict';

    if (location.protocol === 'file:') {
        document.documentElement.innerHTML =
            '<head><meta charset="UTF-8"><title>Velodesk Lab</title>' +
            '<style>body{font-family:Inter,Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;' +
            'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem}' +
            '.box{max-width:520px;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.5rem}' +
            'h1{margin:0 0 .75rem;font-size:1.25rem}p{line-height:1.5;color:#94a3b8}' +
            'code{background:#0f172a;padding:.15rem .4rem;border-radius:4px;color:#38bdf8}' +
            'a{color:#38bdf8}</style></head>' +
            '<body><div class="box"><h1>Velodesk Lab precisa do servidor local</h1>' +
            '<p>Nao abra o <code>index.html</code> direto pelo Explorer.</p>' +
            '<p>1. Entre na pasta <code>Velodesk-lab</code><br>' +
            '2. Execute <code>start-lab.bat</code><br>' +
            '3. Acesse <a href="http://localhost:8767">http://localhost:8767</a></p></div></body>';
        return;
    }

    window.VELODESK_LAB = true;
    window.VELODESK_LAB_ID = 'velodesk-lab-v1';
    window.VELODESK_LAB_PORT = 8767;

    window.resetVelodeskLabData = function () {
        const keep = ['velodeskDarkMode'];
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && keep.indexOf(k) === -1) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
        localStorage.setItem('isLoggedIn', 'true');
        if (typeof showNotification === 'function') {
            showNotification('Dados do Lab resetados. Recarregando…', 'info');
        }
        setTimeout(function () { location.reload(); }, 600);
    };

    window.seedVelodeskLabDemo = function () {
        if (typeof window.seedDemoTickets === 'function') {
            window.seedDemoTickets({ force: true, replaceAll: true });
            if (typeof showNotification === 'function') {
                showNotification('Tickets demo recriados no Lab.', 'success');
            }
            return;
        }
        if (typeof showNotification === 'function') {
            showNotification('seedDemoTickets não disponível ainda.', 'warning');
        }
    };
})();
