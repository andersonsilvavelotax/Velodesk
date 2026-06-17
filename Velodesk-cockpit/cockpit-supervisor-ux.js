/**
 * Velodesk Cockpit — Patches Supervisor UX
 */
(function () {
    'use strict';
    if (!window.VELODESK_COCKPIT || typeof window.renderSupervisorWorkspaceHtml !== 'function') return;

    var origRender = window.renderSupervisorWorkspaceHtml;
    var origAction = window.supervisorQuickAction;

    window._supervisorQuickActionOrig = function (action) {
        if (origAction) origAction(action);
    };

    var ACTION_LABELS = {
        redistribute: 'Redistribuir tickets',
        critical: 'Operação crítica',
        escalate: 'Escalonar equipe',
        contingency: 'Contingência',
        notify: 'Notificar agentes',
        pause: 'Pausar fila',
        reprioritize: 'Repriorizar'
    };

    var DESTRUCTIVE = { contingency: true, pause: true, escalate: true };

    window.supervisorQuickAction = function (action) {
        var label = ACTION_LABELS[action] || action;
        if (typeof supervisorConfirmAction === 'function') {
            supervisorConfirmAction(action, label, !!DESTRUCTIVE[action]);
        } else if (origAction) {
            origAction(action);
        }
    };

    window.renderSupervisorWorkspaceHtml = function () {
        var html = origRender();
        if (typeof renderSupervisorAuditHtml === 'function') {
            html = html.replace('</aside></div></div>', renderSupervisorAuditHtml() + '</aside></div></div>');
        }
        return html;
    };

    setTimeout(function () {
        if (window.COCKPIT_UX && window.COCKPIT_UX.renderAuditLogPanel) window.COCKPIT_UX.renderAuditLogPanel();
    }, 500);
})();
